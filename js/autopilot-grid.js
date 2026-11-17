"use strict";
//autopilot, the grid and its nodes, exact map surfaces, and moving obstacles, see the top of js/autopilot.js
Object.assign(autopilot, {
    //*********************************************************************
    // the grid and its nodes
    //*********************************************************************
    standingOn() { //the body under the player's feet, the whole compound body when it's a part, or null
        return m.standingOn?.parent || m.standingOn
    },
    size() { //the standing player, from the middle of their feet
        const scale = player.scale || 1
        //Down also changes size with scale invariance. Plan for standing clearance at small size.
        return { halfWidth: 25 * scale, height: 132 * scale, crouchHeight: (tech.isScaleInvariance && scale < 1 ? 132 : 96) * scale, foot: 14 * scale }
    },
    physics() { //what one cycle does to the player's velocity, like Matter's Body.update
        const dt2 = simulation.delta * simulation.delta
        const p = {
            gravity: simulation.g * dt2,
            jump: m.jumpForce / player.mass * dt2,
            push: m.FxAir / player.mass * dt2,
            limit: m.airSpeedLimit / player.mass,
            run: 7.2 * (m.Fx / player.mass * dt2) / 0.889, //ground speed settles here
            coyote: Math.min(m.coyoteCycles, 600), //some tech makes it long enough to jump again and again in the air
            apex: m.apexGravity,
            blockJumps: simulation.ephemera.filter(effect => effect.name === "blockJump").length,
            nitinol: !!tech.isNitinol, //grabs walls, so it can climb them, see linkWallClimbs()
        }
        p.hop = autopilot.hopFlight(p, 6) //{ rise, cycles } of the short hops that go against a belt
        p.hopLow = autopilot.hopFlight(p, 1) //the lowest hop, for under a ceiling
        return p
    },
    //transports, see level.transport(): a platform that carries the player between two stops, like subway's trains, it leaves when the player steps on,
    //and it comes to the stop the player is waiting by, both stops get standing spots joined by a ride, like an elevator's
    transports: [], //this level's
    activeTransports: new Set(), //the ones going between their stops
    train: null, //the transport under the player's feet
    trainRide: null, //the one it's riding between stops
    rodeFrom: [], //the x of each stop it rode away from
    //a platform hanging from ropes that swings back and forth the same way every time, like on towers and superstructure, is a transport too,
    //its two stops are where it turns around, learned by watching it for a swing and a half, see watchSwings()
    swings: new Map(), //each hanging platform being watched, who → { dir, far, farAt, turns }
    isSwingShape(who) { //wide and flat enough to stand on, too heavy to be knocked off its path
        const b = who.bounds
        return b.max.x - b.min.x >= 200 && who.mass >= 8 && !who.autopilotElevator && !who.isMover && !who.isDoor
    },
    watchSwings() { //every cycle: where each hanging platform is, and where it turns around
        const cycle = simulation.cycle
        if (cycle % 30 === 1) { //which ones there are
            const live = new Set()
            for (const who of body) {
                if (!autopilot.hanging.has(who) || !autopilot.isSwingShape(who)) continue
                live.add(who)
                if (!autopilot.swings.has(who)) autopilot.swings.set(who, { dir: 0, far: who.position.x, farAt: cycle, farTop: who.bounds.min.y, start: who.position.x, turns: [], since: cycle, thick: who.bounds.max.y - who.bounds.min.y })
            }
            for (const who of autopilot.swings.keys()) {
                if (live.has(who)) continue
                autopilot.swings.delete(who)
                autopilot.unmakeSwing(who)
            }
        }
        for (const [who, s] of autopilot.swings) {
            const x = who.position.x
            s.thick = Math.min(s.thick, who.bounds.max.y - who.bounds.min.y) //how thick it is when it's level, tipped its bounds are taller
            if (s.dir === 0) { //which way it's going
                if (Math.abs(x - s.start) > 60) {
                    s.dir = Math.sign(x - s.start)
                    s.far = x
                    s.farAt = cycle
                }
            } else if ((x - s.far) * s.dir > 0) { //still going
                s.far = x
                s.farAt = cycle
                s.farTop = autopilot.swingTop(who, s)
                s.farAngle = who.angle
                s.farWidth = who.bounds.max.x - who.bounds.min.x
            } else if ((s.far - x) * s.dir > 60) { //it turned around at far
                autopilot.swingTurn(who, s, { cycle: s.farAt, x: s.far, top: s.farTop, side: s.dir > 0 ? 1 : 0, angle: s.farAngle || 0, width: s.farWidth || 0 })
                s.dir = -s.dir
                s.far = x
                s.farAt = cycle
            }
        }
    },
    unmakeSwing(who) { //a swing that stopped being a ride, its deck spots are plain spots until the next rebuild, see transportSum()
        const t = who.autopilotTransport
        if (!t?.isSwing) return
        for (const list of t.nodes) for (const node of list) if (node.transport === who) node.transport = null
        who.autopilotTransport = null
        autopilot.activeTransports.delete(who)
        if (autopilot.train === who) autopilot.train = null
    },
    swingTurn(who, s, turn) { //it turned around: a level turn at each end makes it a transport, a turn somewhere else unmakes it
        const turns = s.turns
        turns.push(turn)
        if (turns.length > 6) turns.shift()
        const t = who.autopilotTransport
        const isLoaded = autopilot.train === who //the player's weight makes it sag and shifts its turns a little
        if (t && t.isSwing) {
            const isSame = Math.abs(turn.x - t.stops[turn.side]) < (isLoaded ? 160 : 90) && Math.abs(turn.top - t.tops[turn.side]) < (isLoaded ? 220 : 90)
            if (!isSame) { //knocked off its path, or the level changed it
                autopilot.unmakeSwing(who)
                s.isOff = true
                return
            }
            const last = t.turnAt[turn.side]
            if (turn.cycle - last > 100) t.period = turn.cycle - last //a whole swing, measured
            t.turnAt[turn.side] = turn.cycle
            return
        }
        if (turns.length < 2 || s.isOff) return
        const mid = turns[turns.length - 2]
        const half = turn.cycle - mid.cycle
        const isLevel = Math.abs(turn.angle) < 0.35 && Math.abs(mid.angle) < 0.35 //it tips a little at each end
        if (mid.side === turn.side || !isLevel || half < 60 || half > 750 || Math.abs(mid.x - turn.x) < 300) return
        if (turns.length > 2) { //the turn before has to have been at the same place
            const before = turns[turns.length - 3]
            if (Math.abs(before.x - turn.x) > 90 || Math.abs(before.top - turn.top) > 90) return
        }
        const stops = [], tops = [], turnAt = []
        for (const one of [mid, turn]) {
            stops[one.side] = one.x
            tops[one.side] = one.top
            turnAt[one.side] = one.cycle
        }
        who.autopilotTransport = { isSwing: true, width: Math.max(100, Math.min(turn.width, mid.width) - 50), height: who.bounds.max.y - who.bounds.min.y, nodes: [[], []], stops, tops, turnAt, period: 2 * half } //there and back takes about the same
    },
    isLearningSwing() { //a hanging platform that might turn out to be a ride is still being watched
        for (const [who, s] of autopilot.swings) {
            if (!who.autopilotTransport && !s.isOff && s.dir !== 0 && s.turns.length < 4 && simulation.cycle < s.since + 1200) return true
        }
        return false
    },
    swingArrives(who, stop, cycle, x) { //at cycle it's close enough to turning around at that stop that the spot at x on its deck there is under the player
        const t = who.autopilotTransport
        let late = (cycle - t.turnAt[stop]) % t.period //cycles after a turn there
        if (late > t.period / 2) late -= t.period
        //near a turn it's this far short of the stop: k * cycles squared, like the top of a sine, and always on the inside of the swing,
        //so a spot on the inside half of the deck is under the player for longer than one at its outside end
        const k = Math.abs(t.stops[1] - t.stops[0]) / 4 * (2 * Math.PI / t.period) ** 2
        const inside = x === undefined ? 0 : (x - t.stops[stop]) * (stop ? -1 : 1)
        const reach = Math.max(20, Math.min(110, inside + t.width / 2 - 35)) //how far short it can be
        const window = Math.sqrt(reach / k)
        return late > -window && late < window - 8 //and still be there a little after
    },
    swingTop(who, s = autopilot.swings.get(who)) { //the top of its deck at its middle, its bounds reach higher when it's tipped
        return s ? who.position.y - s.thick / 2 : who.bounds.min.y
    },
    swingNear(who, stop) { //at that stop now, close enough to step or land on its deck
        const t = who.autopilotTransport
        return Math.abs(who.position.x - t.stops[stop]) < 50 && Math.abs(autopilot.swingTop(who) - t.tops[stop]) < 130
    },
    transportMoving(who) { //between its stops
        return who.autopilotTransport.isSwing ? autopilot.transportAt(who) < 0 : !!who.isMoving
    },
    transportHeading(who) { //the stop it's going to
        return (who.autopilotTransport.isSwing ? who.velocity.x : who.VxGoal) > 0 ? 1 : 0
    },
    transportEnabled(who) {
        if (who.autopilotTransport.isSwing) return true
        return simulation.cycle - who.autopilotTransport.cycle <= 2 && Number.isFinite(who.stops.left) && Number.isFinite(who.stops.right) && Math.abs(who.VxGoal) >= 1
    },
    transportStops(who) { //the middle of the deck at its left and right stop, it overshoots each by up to a cycle of travel, where it's parked is exact
        if (who.autopilotTransport.isSwing) return who.autopilotTransport.stops
        const over = Math.abs(who.VxGoal) / 2
        const stops = [who.stops.left - over, who.stops.right + over]
        const at = autopilot.transportAt(who)
        if (at >= 0) stops[at] = who.position.x
        return stops
    },
    transportAt(who) { //the stop it's parked at, 0 left, 1 right, or -1 while it's between them
        if (who.autopilotTransport.isSwing) return autopilot.swingNear(who, 0) ? 0 : autopilot.swingNear(who, 1) ? 1 : -1
        if (who.isMoving) return -1
        const reach = Math.abs(who.VxGoal) + 5
        if (Math.abs(who.position.x - who.stops.left) <= reach || who.position.x < who.stops.left) return 0
        if (Math.abs(who.position.x - who.stops.right) <= reach || who.position.x > who.stops.right) return 1
        return -1
    },
    transportSum() { //changes when a transport starts or stops being used, or its stops move
        let sum = 0
        for (const who of autopilot.transports) {
            const t = who.autopilotTransport
            if (!t) sum += 0.7 //a swing that stopped repeating
            else if (t.isSwing) sum += 5 + t.stops[0] + 3 * t.stops[1]
            else sum += autopilot.transportEnabled(who) ? 1 + who.stops.left + 3 * who.stops.right : 0
        }
        for (const who of autopilot.swings.keys()) if (who.autopilotTransport && !autopilot.activeTransports.has(who)) sum += 11 //one that was just learned
        return sum
    },
    transportNode(who, stop, x) { //the standing spot on its deck at a stop, for a player this far from the middle of the deck
        const built = who.autopilotTransport.stops
        let best = -1, bestOff = Infinity
        for (const node of who.autopilotTransport.nodes[stop]) {
            const off = Math.abs(node.x - built[stop] - x)
            if (!node.dead && off < bestOff) {
                bestOff = off
                best = node.id
            }
        }
        return best
    },
    //mover belts, see level.mover(): a belt carries the player at its VxGoal, walking with it is faster, walking against a fast one gets nowhere,
    //but nothing pushes the player in the air, so short hops go against any belt at about the air speed limit
    belts: [], //the map's movers
    beltSignature: null, //changes when a belt speeds up, stops, or turns around
    beltSpeed(who) { //how fast the belt carries what's on it right now, 0 when it's off or too slow to matter
        if (!who || simulation.cycle - who.autopilotPushed > 2) return 0
        return Math.abs(who.VxGoal) < 0.5 ? 0 : who.VxGoal
    },
    beltV: node => node && node.belt ? autopilot.beltSpeed(node.belt) : 0, //the belt speed under a standing spot
    beltUnder() { //the belt under the player's feet, or null
        const who = m.onGround && m.standingOn ? m.standingOn.parent || m.standingOn : null
        return who && who.isMover && !who.trainStop && autopilot.beltSpeed(who) ? who : null //not a transport, the player rides those standing still
    },
    hopFlight(p, hold) { //a short hop, jump held for hold cycles: how high it rises and how long it's in the air, see arc()
        const drag = 1 - (player.frictionAir ?? 0.001)
        let vy = 0, y = 0, rise = 0
        for (let cycle = 1; cycle < 200; cycle++) {
            const isHeld = cycle - 1 < hold
            if (!isHeld && vy < 0) vy *= m.shortJumpDamp
            const isApex = cycle > 1 && isHeld && Math.abs(vy) < m.apexSpeed
            vy = vy * drag + p.gravity * (isApex ? m.apexGravity : 1) - (cycle === 1 ? p.jump : 0)
            y += vy
            rise = Math.max(rise, -y)
            if (y >= 0 && cycle > 1) return { rise, cycles: cycle }
        }
        return { rise, cycles: 200 }
    },
    hopTakeoff(V) { //how fast it's still going against a belt moving at V on the cycle it touches down between hops, the belt takes some back
        return Math.max(0, 0.89 * (autopilot.p.limit + 0.5) - 0.11 * Math.abs(V) - 1)
    },
    hopHold(x, feet, size, V, vx = -Math.sign(V) * autopilot.hopTakeoff(V)) { //how many cycles to hold jump for a hop against a belt moving at V, from x going vx, 0 when no hop works
        //it needs the room overhead, and to come down about level, on the belt or just past its end, not off the end into a gap
        const p = autopilot.p, dir = -Math.sign(V)
        const isClear = rise => !autopilot.isBoxSolid(x - size.halfWidth + 3, feet - size.height - 1.1 * rise - 8, x + size.halfWidth - 3, feet - size.height + 2) //measured hops rise a little more than hopFlight()
        const lands = hold => {
            const hit = autopilot.arc(x, feet, vx, -p.jump, dir, p.limit, true, size, 0, false, hold)
            return !!hit && Math.abs(autopilot.nodes[hit.node].y - feet) < 30
        }
        if (Math.abs(V) > 30 && isClear(p.jump ** 2 / (2 * p.gravity)) && lands(60)) return 60 //a fast belt takes back the most each landing, full jumps land the least
        if (isClear(p.hop.rise) && lands(6)) return 6
        return isClear(p.hopLow.rise) && lands(1) ? 1 : 0
    },
    beltGait(V, dir, x, feet, size) { //going dir on a belt moving at V: { speed, isHop }, how fast over the ground, and whether that's by hopping, speed 0 when it can't
        const p = autopilot.p
        if (!V) return { speed: p.run, isHop: false }
        if (V * dir > 0) return { speed: p.run + Math.abs(V), isHop: false }
        const walk = p.run - 1 - Math.abs(V) //measured, the belt also pushes whatever is slower than it
        const hop = Math.abs(V) >= 1.5 && autopilot.hopHold(x, feet, size, V) ? Math.max(2, p.limit + 0.4 - 0.045 * Math.abs(V)) : 0 //about the air speed limit, less the cycle on the belt each landing
        if (hop > walk) return { speed: hop, isHop: true }
        return { speed: walk > 1.5 ? walk : 0, isHop: false }
    },
    beltSum() {
        let sum = 0
        for (let i = 0; i < autopilot.belts.length; i++) sum += (i + 1) * autopilot.beltSpeed(autopilot.belts[i])
        return sum
    },
    isBoostPiece: who => !!(who.boostBounds || who.autopilotBoost),
    elevatorEnabled(who) {
        const e = who.autopilotElevator
        //Some levels park the lift by ceasing to call move() instead of calling move(false).
        //Use the player clock so a time skip that omits level updates doesn't park a running lift.
        return who.isOn !== false && !!e.enabled && m.cycle - e.commandPlayerCycle <= 2 &&
            (m.cycle - e.lastMotion <= 45 || e.waitingForTouch && (e.boardedAt === null || m.cycle - e.boardedAt <= 45))
    },
    updateElevator(who) {
        const e = who.autopilotElevator, cycle = m.cycle
        if (Math.abs(who.position.y - e.lastY) >= 4) {
            e.lastY = who.position.y
            e.lastMotion = cycle
            e.boardedAt = null
        }
        const idle = e.enabled && e.mode === "moveOnTouch" && !who.isUp && Math.abs(who.bounds.min.y - e.bottom) < 5
        if (idle && m.onGround && autopilot.standingOn() === who) e.boardedAt ??= cycle
        else e.boardedAt = null
        if (e.waitingForTouch !== idle) autopilot.isPlanDirty = true
        e.waitingForTouch = idle
    },
    observeDoor(who) {
        who.isDoor = true
        autopilot.hook(who, "openClose", openClose => function () {
            const y = this.position.y
            const result = openClose.apply(this, arguments)
            if (this.position.y < y) this.autopilotOpenedAt = m.cycle
            return result
        })
    },
    doorOpening(who) {
        return who.isDoor && m.cycle - who.autopilotOpenedAt <= 3
    },
    isObstacle(who) { //a block in body[] the path goes around or over, small ones the player steps over or pushes
        if (m.isHolding && who === m.holdingTarget) return false
        if (autopilot.isIgnoredBlock(who)) return false
        if (!(who.collisionFilter.mask & cat.player)) return false
        if (who.autopilotElevator) return !autopilot.activeElevators.has(who)
        if (who.autopilotTransport && autopilot.activeTransports.has(who)) return false //its two stops are on the map instead
        if (autopilot.isSpinner(who)) return autopilot.isBeam(who) //a flat beam is something to stand on, it tips as the player walks along it and is redrawn as it turns, a standing one the player pushes aside
        //A deck on fixed ropes can tilt and settle again. Driven swings still use their timed stops.
        if (autopilot.hanging.has(who) && autopilot.isSwingShape(who) &&
            simulation.cycle > (autopilot.hangingDrivenAt.get(who) ?? -Infinity) + 120) return true
        if (who.isNotHoldable && (who.autopilotRotating || Math.abs(who.angularVelocity) > 0.003)) { //other rotating bodies would need constant redraws
            who.autopilotRotating = true
            return false
        }
        const b = who.bounds
        return b.max.y - b.min.y > 32 || b.max.x - b.min.x > 60
    },
    isSpinner: who => !!(who.isRotor || who.autopilotSpinner),
    beamSpin: 0.02, //faster than this a beam is left off the map
    isBeam(who) { //a spinner lying about flat that isn't driven around, see level.spinner(), a rotor keeps turning on its own
        if (who.isRotor || Math.abs(who.angularVelocity) > autopilot.beamSpin) return false //a slowly turning one would be redrawn every few cycles, it isn't much of a floor anyway
        const b = who.bounds
        return b.max.x - b.min.x > autopilot.beamSlope * (b.max.y - b.min.y) //lying flat or tilted like a step, one standing up is a wall the player pushes aside
    },
    beamSlope: 0.75, //how much wider than tall a spinner has to be to stand on, 0.75 is up to about 53 degrees
    hanging: new Set(), //blocks hanging from a constraint, like a swinging door, the player can push them aside even when they can't be picked up
    hangingLengths: new WeakMap(),
    hangingDrivenAt: new WeakMap(), //Towers and Superstructure drive their swings by changing rope lengths
    findHanging() {
        const set = autopilot.hanging = new Set()
        const lists = [typeof cons === "undefined" ? [] : cons, typeof consBB === "undefined" ? [] : consBB]
        for (const list of lists) {
            for (const c of list) {
                const isDriven = Math.abs(c.length - autopilot.hangingLengths.get(c)) > 1
                autopilot.hangingLengths.set(c, c.length)
                for (const who of [c.bodyA, c.bodyB]) {
                    if (!who || who.isStatic) continue
                    set.add(who)
                    if (isDriven) autopilot.hangingDrivenAt.set(who, simulation.cycle)
                }
            }
        }
    },
    isPushable(who) { //a block the player can shove out of the way, not a door, platform, or something else the level moves
        if (who.autopilotDynamic || who.autopilotElevator || who.isStatic || who.isDoor) return false
        return !who.isNotHoldable || autopilot.hanging.has(who) || autopilot.isSpinner(who) //a spinner turns out of the way when it's walked into
    },
    pushableBeside(x, feet) { //the closest block it could shove, beside the player, not under it or far above, or null
        let best = null, bestD = 90 //from the middle of the player to the block's near side, the player is about 50 wide
        for (const who of autopilot.dynList) {
            if (!autopilot.isPushable(who) || autopilot.obstacleWeight(who) >= 3000) continue
            const b = who.bounds
            if (b.max.y < feet - 110 || b.min.y > feet - 5) continue
            const d = Math.max(b.min.x - x, x - b.max.x)
            if (d < bestD) {
                bestD = d
                best = who
            }
        }
        return best
    },
    isSoftBlock(who) { //a thin light block standing in a doorway, or hanging in one and swinging, the player shoves it aside, so jumps and falls go through it
        if (!autopilot.isPushable(who) || who.mass > 8) return false
        const b = who.bounds
        return b.max.y - b.min.y > 2.5 * (b.max.x - b.min.x)
    },
    obstacleWeight(who) { //what walking through it costs, about in cycles, 3000 or more is something the player can't push out of the way
        if (!autopilot.isPushable(who)) return 3000 //doors, moving platforms, spinners, it has to move first
        return 40 + 12 * who.mass //pushing a block, or a block hanging from something that swings out of the way, heavy ones barely move
    },
    build() {
        const startMs = performance.now()
        const cell = autopilot.cell
        //how far the grid reaches, some maps have huge walls far outside the level
        const reach = 14000
        const anchors = [player.position, level.exit, level.enter]
        const limit = {
            minX: Math.min(...anchors.map(p => p.x)) - reach, maxX: Math.max(...anchors.map(p => p.x)) + reach,
            minY: Math.min(...anchors.map(p => p.y)) - reach, maxY: Math.max(...anchors.map(p => p.y)) + reach,
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (let i = 0; i < map.length; i++) {
            const b = map[i].bounds
            minX = Math.min(minX, Math.max(limit.minX, b.min.x))
            minY = Math.min(minY, Math.max(limit.minY, b.min.y))
            maxX = Math.max(maxX, Math.min(limit.maxX, b.max.x))
            maxY = Math.max(maxY, Math.min(limit.maxY, b.max.y))
        }
        if (!(maxX > minX)) return false
        const physics = autopilot.physics()
        if (autopilot.pScale !== (player.scale || 1) || autopilot.hasDifferentMovement(physics)) autopilot.recentFailures.length = 0
        autopilot.invalidateNavigation()
        const x0 = Math.floor(minX / cell) * cell - autopilot.cellsFor(200) * cell
        const y0 = Math.floor(minY / cell) * cell - autopilot.cellsFor(600) * cell
        const w = Math.ceil((maxX - x0) / cell) + autopilot.cellsFor(200)
        const h = Math.ceil((maxY - y0) / cell) + autopilot.cellsFor(100)
        const base = new Uint8Array(w * h) //the map that doesn't move
        const grid = autopilot.grid = { x0, y0, w, h, base, solid: base, dynCount: new Uint16Array(w * h), dynWeight: new Float32Array(w * h), nodeAt: new Int32Array(w * h).fill(-1), mapCount: map.filter(who => !who.isRay).length }
        autopilot.p = physics
        autopilot.pScale = player.scale || 1
        autopilot.flyStamp = autopilot.flyStamp % 65000 + 1

        //draw the map onto the grid
        const boosts = autopilot.boosts = []
        const cells = []
        for (let i = 0; i < map.length; i++) {
            const who = map[i]
            if (autopilot.isBoostPiece(who)) { //its body sits in the floor, the player never stands on it
                boosts.push(autopilot.boostZone(who))
                continue
            }
            if (who.autopilotDynamic || who.isRay) continue
            who.autopilotBounds = { x: who.bounds.min.x, y: who.bounds.min.y } //to notice it moving
            cells.length = 0
            autopilot.cellsOfBody(who, cells)
            for (let k = 0; k < cells.length; k++) base[cells[k]] = 1
        }

        autopilot.buildSurfaces()
        autopilot.indexExact()
        autopilot.belts = map.filter(who => who.isMover)
        autopilot.beltSignature = autopilot.beltSum()

        //An active elevator has virtual platforms at both stops. Parked lifts are drawn at their live position below.
        const elevators = autopilot.elevators = body.filter(who => who.autopilotElevator)
        for (const who of elevators) autopilot.updateElevator(who)
        const activeElevators = autopilot.activeElevators = new Set(elevators.filter(autopilot.elevatorEnabled))
        for (const who of elevators) {
            const e = who.autopilotElevator
            e.nodes = [[], []]
            if (!activeElevators.has(who)) continue
            const c0 = Math.max(0, Math.floor((who.holdX - e.width / 2 + 3 - x0) / cell)), c1 = Math.min(w - 1, Math.floor((who.holdX + e.width / 2 - 3 - x0) / cell))
            for (const y of [e.bottom, e.top]) {
                const cy = Math.floor((y + 2 - y0) / cell)
                if (cy > 0 && cy < h) base.fill(1, c0 + cy * w, c1 + cy * w + 1)
            }
        }

        //a transport has a deck at both of its stops
        const transports = autopilot.transports = body.filter(who => who.autopilotTransport)
        const activeTransports = autopilot.activeTransports = new Set(transports.filter(autopilot.transportEnabled))
        autopilot.transportSignature = 0 //transportSum() reads activeTransports
        autopilot.transportSignature = autopilot.transportSum()
        for (const who of transports) {
            const t = who.autopilotTransport
            t.nodes = [[], []]
            if (!activeTransports.has(who)) continue
            t.stops = autopilot.transportStops(who)
            if (!t.isSwing) t.tops = [who.bounds.min.y, who.bounds.min.y]
            for (let i = 0; i < 2; i++) {
                const stop = t.stops[i]
                const cy = Math.floor((t.tops[i] + 2 - y0) / cell)
                const c0 = Math.max(0, Math.floor((stop - t.width / 2 + 3 - x0) / cell)), c1 = Math.min(w - 1, Math.floor((stop + t.width / 2 - 3 - x0) / cell))
                if (cy > 0 && cy < h && c1 >= c0) base.fill(1, c0 + cy * w, c1 + cy * w + 1)
            }
        }

        //blocks, doors, and moving map pieces on top of that
        grid.solid = base.slice()
        grid.hard = base.slice() //what jumps and falls hit, thin light blocks hanging in doorways get shoved aside, so they're left out
        grid.hardCount = new Uint16Array(w * h)
        grid.fixed = base.slice() //the map, doors, and platforms, not blocks the player can push out of the way
        grid.fixedCount = new Uint16Array(w * h)
        autopilot.dyn.clear()
        autopilot.relink.clear()
        autopilot.updateObstacles(false)

        //nodes, a clear cell over a solid one with room for the player
        const size = autopilot.size()
        const nodes = autopilot.nodes = []
        for (let cx = 1; cx < w - 1; cx++) {
            for (let cy = autopilot.cellsFor(150); cy < h - 1; cy++) {
                const node = autopilot.makeNode(cx, cy, size)
                if (!node) continue
                node.id = nodes.length
                grid.nodeAt[cx + cy * w] = node.id
                nodes.push(node)
                autopilot.tagNode(node, size)
            }
        }
        autopilot.rev = []
        for (const node of nodes) autopilot.linkNode(node, size)
        autopilot.rebuildRev()
        autopilot.lastBuildCycle = simulation.cycle
        autopilot.isPlanDirty = true
        autopilot.cur = -1
        autopilot.buildMs = performance.now() - startMs
        return true
    },
    makeNode(cx, cy, size) { //a node for this cell if the player can stand there, or null
        const { x0, y0, w, base, solid } = autopilot.grid
        const cell = autopilot.cell
        const x = x0 + (cx + 0.5) * cell
        const top = y0 + (cy + 1) * cell
        const floorAt = arr => {
            if (autopilot.grid.geometry) return autopilot.surfaceY(x, x, top, top + cell, arr)
            const list = arr === base ? map : autopilot.dynList
            for (let offset = 0; offset < cell; offset += 5) { //under the flat middle of the foot, 5 to either side, past that the slanted foot slides off a corner
                for (const dx of [0, -5, 5]) if (Matter.Query.point(list, { x: x + dx, y: top + offset + 1 }).length) return top + offset
            }
            return top //only a sliver of the cell below, like a corner, landingRisk() steers landings away from these
        }
        const room = (arr, y) => { //0 no room, 1 room to crouch, 2 room to stand, from the real floor
            if (!autopilot.isBoxSolid(x - size.halfWidth + 3, y - size.height + 3, x + size.halfWidth - 3, y - 26, arr)) return 2
            return autopilot.isBoxSolid(x - size.halfWidth + 3, y - size.crouchHeight + 3, x + size.halfWidth - 3, y - 26, arr) ? 0 : 1
        }
        let isStatic = false, space = 0, y = top
        if (!base[cx + cy * w] && base[cx + (cy + 1) * w]) { //on the map that doesn't move
            y = floorAt(base)
            space = Number.isFinite(y) ? room(base, y) : 0
            if (space < 2 && Number.isFinite(y) && autopilot.grid.exact) { //the grid rounds a ceiling down to a whole cell, a gap that only just fits, like crouching under a low ledge, check the map's real shape
                const fits = height => !autopilot.isMapExact(x - size.halfWidth + 3, y - height + 3, x + size.halfWidth - 3, y - 26)
                space = Math.max(space, fits(size.height) ? 2 : fits(size.crouchHeight) ? 1 : 0)
            }
            isStatic = space > 0
        }
        if (!isStatic) { //on top of something that moves, or floating a little above a slope too steep to stand on, isOnMap() tells them apart
            if (solid[cx + cy * w] || !solid[cx + (cy + 1) * w]) return null
            y = floorAt(solid)
            space = Number.isFinite(y) ? room(solid, y) : 0
            if (!space) return null
        }
        const node = { id: -1, x, y, cx, cy, edges: [], isStatic, cover: 0, isBoost: false, isCrouch: space === 1, elevator: null, elevatorLevel: 0, belt: null, transport: null, transportStop: 0, dead: false }
        if (isStatic) autopilot.coverOf(node, size)
        return node
    },
    coverOf(node, size) { //the heaviest thing in the player's way standing there
        const { x0, y0, w, h, dynWeight } = autopilot.grid
        const cell = autopilot.cell
        const c0 = Math.max(0, Math.floor((node.x - size.halfWidth + 3 - x0) / cell)), c1 = Math.min(w - 1, Math.floor((node.x + size.halfWidth - 3 - x0) / cell))
        const r0 = Math.max(0, Math.floor((node.y - (node.isCrouch ? size.crouchHeight : size.height) + 3 - y0) / cell)), r1 = Math.min(h - 1, node.cy)
        let most = 0
        for (let cy = r0; cy <= r1; cy++) {
            for (let cx = c0; cx <= c1; cx++) if (dynWeight[cx + cy * w] > most) most = dynWeight[cx + cy * w]
        }
        node.cover = most
    },
    boostZone(who) {
        const { launchHeight = 1000, angle = Math.PI / 2 } = who.autopilotBoost || {}
        //Vertical pads use a region and angled pads cast a 100-by-100 ray from their center.
        let bounds = who.boostBounds, vertices = null
        if (!bounds) {
            const dx = Math.cos(angle) * 50, dy = -Math.sin(angle) * 50
            vertices = [
                { x: who.position.x - dy, y: who.position.y + dx },
                { x: who.position.x + dy, y: who.position.y - dx },
                { x: who.position.x + 2 * dx + dy, y: who.position.y + 2 * dy - dx },
                { x: who.position.x + 2 * dx - dy, y: who.position.y + 2 * dy + dx },
            ]
            bounds = Matter.Bounds.create(vertices)
        }
        return { bounds, vertices, launchHeight, angle, nodes: [] }
    },
    boostAt(x, feet, size, height = size.height) {
        const left = x - size.halfWidth, right = x + size.halfWidth
        const top = feet - height, bottom = feet + 3 //the ground sensor extends below the feet
        for (const boost of autopilot.boosts) {
            const { min, max } = boost.bounds
            if (right < min.x || left > max.x || bottom < min.y || top > max.y) continue
            if (!boost.vertices || autopilot.polygonBox(boost.vertices, left, top, right, bottom)) return boost
        }
        return null
    },
    tagNode(node, size) { //boosts, elevator stops, and belts
        if (node.isStatic) {
            for (const who of autopilot.belts) {
                const b = who.bounds
                if (node.x > b.min.x - 5 && node.x < b.max.x + 5 && Math.abs(node.y - b.min.y) < 20) node.belt = who
            }
        }
        const boost = autopilot.boostAt(node.x, node.y, size, node.isCrouch ? size.crouchHeight : size.height)
        if (boost) {
            node.isBoost = boost
            boost.nodes.push(node)
        }
        for (const who of autopilot.activeTransports) {
            const t = who.autopilotTransport
            for (let i = 0; i < 2; i++) {
                if (Math.abs(node.y - t.tops[i]) >= (t.isSwing ? 26 : 6)) continue //on the deck itself, not a platform beside it a step higher or lower, a swing's top isn't on a cell's edge
                if (Math.abs(node.x - t.stops[i]) > t.width / 2) continue
                node.transport = who
                node.transportStop = i
                t.nodes[i].push(node)
            }
        }
        for (const who of autopilot.activeElevators) {
            const e = who.autopilotElevator
            if (Math.abs(node.x - who.holdX) > e.width / 2) continue
            for (let i = 0; i < 2; i++) {
                if (Math.abs(node.y - (i ? e.top : e.bottom)) < 30) {
                    node.elevator = who
                    node.elevatorLevel = i
                    e.nodes[i].push(node)
                }
            }
        }
    },
    killNode(node) {
        node.dead = true
        autopilot.detachEdges(node)
        autopilot.grid.nodeAt[node.cx + node.cy * autopilot.grid.w] = -1
        if (node.isBoost) node.isBoost.nodes.splice(node.isBoost.nodes.indexOf(node), 1)
        if (node.elevator) {
            const list = node.elevator.autopilotElevator.nodes[node.elevatorLevel]
            const index = list.indexOf(node)
            if (index !== -1) list.splice(index, 1)
        }
        if (node.transport) {
            const list = node.transport.autopilotTransport.nodes[node.transportStop]
            const index = list.indexOf(node)
            if (index !== -1) list.splice(index, 1)
        }
    },
    cellsOfBody(who, out) {
        if (who.parts.length > 1) {
            for (let i = 1; i < who.parts.length; i++) autopilot.cellsOf(who.parts[i], out)
        } else autopilot.cellsOf(who, out)
    },
    cellsOf(part, out) { //the grid cells a convex part covers by more than a sliver
        const { x0, y0, w, h } = autopilot.grid
        const cell = autopilot.cell
        const b = part.bounds
        const v = part.vertices
        const c0 = Math.max(0, Math.floor((b.min.x - x0) / cell)), c1 = Math.min(w - 1, Math.floor((b.max.x - x0) / cell))
        const r0 = Math.max(0, Math.floor((b.min.y - y0) / cell)), r1 = Math.min(h - 1, Math.floor((b.max.y - y0) / cell))
        if (c1 < c0 || r1 < r0) return
        let isRect = v.length === 4
        for (let i = 0; isRect && i < 4; i++) {
            if ((Math.abs(v[i].x - b.min.x) > 0.5 && Math.abs(v[i].x - b.max.x) > 0.5) || (Math.abs(v[i].y - b.min.y) > 0.5 && Math.abs(v[i].y - b.max.y) > 0.5)) isRect = false
        }
        if (isRect) {
            const a0 = Math.max(0, Math.floor((b.min.x + 2 - x0) / cell)), a1 = Math.min(w - 1, Math.floor((b.max.x - 2 - x0) / cell))
            const b0 = Math.max(0, Math.floor((b.min.y + 2 - y0) / cell)), b1 = Math.min(h - 1, Math.floor((b.max.y - 2 - y0) / cell))
            for (let cy = b0; cy <= b1; cy++) {
                for (let cx = a0; cx <= a1; cx++) out.push(cx + cy * w)
            }
            return
        }
        const at = [0.5, 0.5, 0.12, 0.12, 0.88, 0.12, 0.12, 0.88, 0.88, 0.88, 0.5, 0.12, 0.5, 0.88, 0.12, 0.5, 0.88, 0.5] //spots in a cell to test
        const point = { x: 0, y: 0 }
        for (let cy = r0; cy <= r1; cy++) {
            for (let cx = c0; cx <= c1; cx++) {
                for (let k = 0; k < at.length; k += 2) {
                    point.x = x0 + (cx + at[k]) * cell
                    point.y = y0 + (cy + at[k + 1]) * cell
                    if (Matter.Vertices.contains(v, point)) {
                        out.push(cx + cy * w)
                        break
                    }
                }
            }
        }
    },
    //*********************************************************************
    // exact surfaces, the top edges of the map that stays put, from its vertices, not the grid
    //*********************************************************************
    surfaces: new Map(), //200 wide columns of { x1, y1, x2, y2 } top edges, x1 < x2
    buildSurfaces() {
        const columns = autopilot.surfaces = new Map()
        const add = edge => {
            for (let k = Math.floor(edge.x1 / 200); k <= Math.floor(edge.x2 / 200); k++) {
                if (!columns.has(k)) columns.set(k, [])
                columns.get(k).push(edge)
            }
        }
        for (const who of map) {
            if (who.isRay || who.autopilotDynamic || autopilot.isBoostPiece(who)) continue
            const parts = who.parts && who.parts.length > 1 ? who.parts.slice(1) : [who]
            for (const part of parts) {
                const v = part.vertices || []
                for (let i = 0; i < v.length; i++) {
                    const a = v[i], b = v[(i + 1) % v.length]
                    if (Math.abs(b.x - a.x) < 0.5 || Math.abs(b.y - a.y) > 3 * Math.abs(b.x - a.x)) continue //walls
                    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
                    if (Matter.Vertices.contains(v, { x: mx, y: my - 1 }) || !Matter.Vertices.contains(v, { x: mx, y: my + 1 })) continue //faces down or sideways
                    add(a.x < b.x ? { x1: a.x, y1: a.y, x2: b.x, y2: b.y, who } : { x1: b.x, y1: b.y, x2: a.x, y2: a.y, who })
                }
            }
        }
    },
    edgeY: (e, x) => e.y1 + (Math.min(e.x2, Math.max(e.x1, x)) - e.x1) * (e.y2 - e.y1) / (e.x2 - e.x1),
    surfaceAt(x, feet, above = 15, below = 40, skip = null, support = null) { //the top edge the feet are on, near feet, or null
        let best = null, bestD = Infinity
        for (const e of autopilot.surfaces.get(Math.floor(x / 200)) || []) {
            if (e === skip || (support && e.who !== support) || x < e.x1 - 0.5 || x > e.x2 + 0.5) continue
            const y = autopilot.edgeY(e, x)
            if (y < feet - above || y > feet + below) continue
            if (Math.abs(y - feet) < bestD) {
                bestD = Math.abs(y - feet)
                best = { edge: e, y }
            }
        }
        return best
    },
    straightWalk(toX, feet = playerBody.bounds.max.y) {
        const x = player.position.x, dir = Math.sign(toX - x)
        if (!autopilot.grid || !m.onGround || Math.abs(toX - x) > 800) return null
        const canMove = who => autopilot.isCarryable(who) && autopilot.canClearBlock(who) && who.speed <= 8 && autopilot.canHoldBlocks()
        const support = autopilot.standingOn()
        let floor = autopilot.surfaceAt(x, feet, 6, 12), block = null
        if (!floor && body.includes(support) && canMove(support)) {
            floor = autopilot.surfaceAt(x, support.bounds.max.y, 6, 10)
            block = support //continue along the permanent floor underneath the crate
        }
        if (!floor || floor.edge.who.isMover || floor.edge.who.autopilotDynamic) return null
        const y = floor.y
        //Cover the whole span with touching, level surfaces. A clear sight line can still cross a pit.
        for (let end = x; (toX - end) * dir > 0;) {
            let far = end
            for (const edge of autopilot.surfaces.get(Math.floor(end / 200)) || []) {
                if (edge.who.isMover || edge.who.autopilotDynamic || end < edge.x1 - 0.5 || end > edge.x2 + 0.5 ||
                    Math.abs(edge.y1 - y) > 2 || Math.abs(edge.y2 - y) > 2) continue
                const next = dir > 0 ? edge.x2 : edge.x1
                if ((next - far) * dir > 0) far = next
            }
            if (far === end) return null
            end = far
        }
        const { halfWidth, height } = autopilot.size()
        const left = Math.min(x, toX) - halfWidth + 3, right = Math.max(x, toX) + halfWidth - 3
        const top = y - height + 3, bottom = y - 5
        const overlaps = b => b && b.min.x < right && b.max.x > left && b.min.y < y + 4 && b.max.y > top
        const hitsMap = autopilot.grid.exact ? autopilot.isMapExact(left, top, right, bottom) : autopilot.isBoxSolidExact(left, top, right, bottom)
        if (hitsMap || autopilot.boxInHazard([left, top, right, y])) return null
        const blocksWalk = who => !who.isSensor && who.isThere !== false && (who.collisionFilter.mask & cat.player) &&
            !(m.isHolding && who === m.holdingTarget) && who.bounds.min.y < bottom && overlaps(who.bounds)
        if (autopilot.dynList.some(who => (who.autopilotDynamic || who.isRay) && blocksWalk(who))) return null
        if (autopilot.boosts.some(boost => overlaps(boost.bounds)) || autopilot.portalEnds().some(end => overlaps(end.portal.bounds))) return null
        if (autopilot.winds.some(w => w.x < right && w.x + w.width > left && w.y < y && w.y + w.height > top) ||
            autopilot.jumpZones.some(z => z.lastBounds && z.lastBounds.left < right && z.lastBounds.right > left && z.lastBounds.top < y && z.lastBounds.bottom > top)) return null
        for (const who of body) {
            if (who === block || !blocksWalk(who) || autopilot.isSmallBlock(who)) continue //a small one is walked through
            if (!canMove(who)) return null
            if (!block || block !== support && Math.abs(who.position.x - x) < Math.abs(block.position.x - x)) block = who
        }
        return { y, block }
    },
    landingUphill(x, feet, target, support = null) {
        const scale = player.scale || 1
        const surface = autopilot.surfaceAt(x, feet, 15 * scale, (support ? 22 : autopilot.cell) * scale, null, support)
        if (!surface) return 0
        const { edge, y } = surface
        const slope = (edge.y2 - edge.y1) / (edge.x2 - edge.x1)
        const uphill = -Math.sign(slope)
        if (Math.abs(slope) < 0.5 || Math.abs(target.x - x) > 150 || target.y > y + 20 || (target.x - x) * uphill < -10 * scale) return 0
        const onward = autopilot.next?.[target.id]
        if (onward?.type === autopilot.WALK && onward.dir === -uphill && autopilot.nodes[onward.to].y > target.y + 8) return 0
        return uphill
    },
    landingRisk(id, dir) { //landing on a steep slope, or right at the edge it came over, often clips the corner and bounces off, the plan should land on the flat
        if (!autopilot.isLipTakeoff) return 0
        const n = autopilot.nodes[id]
        if (!n || !autopilot.isOnMap(n)) return 0 //on something that moves, the map's surfaces don't say
        const here = autopilot.surfaceAt(n.x, n.y)
        if (!here) return 60 //nothing of the map that stays put under the middle of the player, the spot hangs over an edge
        const e = here.edge
        if (Math.abs((e.y2 - e.y1) / (e.x2 - e.x1)) > autopilot.lipDrop) return 60
        const near = autopilot.lipFor(n.x, n.y, -dir) //the edge of this ground it comes over
        if (near && !near.isBehind && Math.abs(near.x - n.x) < 22) return 40
        return 0
    },
    isOnMap(node) { //standing on the map that stays put, or floating just above a steep part of it, not on something that moves
        if (node.isStatic) return true
        const g = autopilot.grid
        return !(g.dynCount && g.dynCount[node.cx + (node.cy + 1) * g.w])
    },
    realTop(node) { //the map's top under a spot, a spot on a sliver of a corner gets the top of its grid cell, the corner can be most of a cell lower
        if (!node.isStatic) return node.y
        const half = autopilot.cell / 2 - 1
        for (let offset = 0; offset < autopilot.cell; offset += 2) {
            for (const dx of [0, -half, half]) if (Matter.Query.point(map, { x: node.x + dx, y: node.y + offset + 1 }).length) return node.y + offset
        }
        return node.y
    },
    isLowStep(from, to, dir) {
        if (!from.isStatic || !to.isStatic || from.y < to.y || from.elevator || to.elevator || from.transport || to.transport || to.isBoost) return false
        const lower = autopilot.surfaceAt(from.x, from.y, 5, autopilot.cell)?.edge
        let upper = autopilot.surfaceAt(to.x, to.y, 5, autopilot.cell)?.edge
        if (!upper || upper === lower) upper = autopilot.surfaceAt(to.x + 5 * dir, to.y, 5, autopilot.cell)?.edge //the foot can overlap the lip before its center does
        if (!lower || !upper || lower === upper) return false
        const lip = dir > 0 ? upper.x1 : upper.x2
        if ((lip - from.x) * dir < -0.5 || (to.x - lip) * dir < -5 || lip < lower.x1 - 0.5 || lip > lower.x2 + 0.5) return false
        const rise = autopilot.edgeY(lower, lip) - autopilot.edgeY(upper, lip)
        return rise > 0 && rise <= 15 * (player.scale || 1) //the player's slanted foot can ride onto it
    },
    isShortRun: true, //jumps with a short run-up from the far end of a ledge too short for a full one, false to compare
    isMeasuredRun: true, //running jumps at the speed the floor behind the takeoff allows, false is full speed with 100 of floor and the short run-ups, to compare
    runReach: 200, //the most run-up it measures, about 6.9 of the full 7.06
    runRoom(x, feet, dir, size, reach = 100, step = 4) { //how far back from x, against dir, the player can stand on this ground, up to reach
        let back = 0
        for (let d = step; d <= reach; d += step) {
            const at = x - dir * d
            if (!autopilot.surfaceAt(at, feet, 3, 6)) break
            if (autopilot.isBoxSolidExact(at - size.halfWidth + 2, feet - size.height + 2, at + size.halfWidth - 2, feet - 16)) break
            back = d
        }
        return back
    },
    runTable: null, //[distance, speed] running from a standstill, measured to 100, then each cycle gets 0.111 of the way to the full 7.06
    runSpeed(distance) { //how fast running from a standstill is going after this far, measured, a little under to be safe
        if (!autopilot.runTable) {
            const run = autopilot.runTable = [[0, 0], [1.3, 1.33], [4, 2.64], [7.5, 3.52], [11.9, 3.92], [16.7, 4.27], [21.9, 4.58], [27.3, 4.86], [33.1, 5.1], [39.1, 5.32], [45.3, 5.52], [51.7, 5.69], [58.3, 5.85], [65, 5.99], [71.9, 6.11], [79, 6.22], [86.1, 6.31], [93.3, 6.4], [100.8, 6.47]]
            let [d, v] = run[run.length - 1]
            while (d < 600) {
                v += (7.06 - v) * 0.111
                d += v
                run.push([d, v])
            }
        }
        const run = autopilot.runTable
        const scale = autopilot.p.run / 7.06 //measured with the usual run speed
        const d = distance / (scale * scale)
        for (let i = 1; i < run.length; i++) {
            if (d > run[i][0]) continue
            const [d0, v0] = run[i - 1], [d1, v1] = run[i]
            return 0.95 * scale * (v0 + (v1 - v0) * (d - d0) / (d1 - d0))
        }
        return 0.95 * scale * run[run.length - 1][1]
    },
    standY(node) { //where the feet really are on this spot, a spot that clips a corner or floats above a steep slope is higher than the map under its middle
        if (!autopilot.isLipTakeoff || !autopilot.isOnMap(node)) return node.y
        const under = autopilot.surfaceAt(node.x, node.y, 2, 2 * autopilot.cell)
        return under && under.y > node.y + 4 ? under.y : node.y //floors found by the grid are 0 to 4 below the real surface
    },
    isUphillWalk(from, to) { //a continuous incline can span multiple grid rows without a step
        if (from.elevator || to.elevator) return false
        const tolerance = autopilot.cell
        const slope = autopilot.surfaceAt(to.x, to.y, 8, tolerance)
        if (!slope) return false
        const { edge, y } = slope
        const dir = Math.sign(to.x - from.x)
        const grade = (edge.y1 - edge.y2) * dir / (edge.x2 - edge.x1)
        if (grade <= 0 || grade > 1.05) return false
        const startX = Math.max(edge.x1, Math.min(edge.x2, from.x))
        const startY = autopilot.edgeY(edge, startX)
        if (Math.abs(startY - from.y) > tolerance) return false
        if (Math.abs(startX - from.x) < 0.5) return true
        const before = autopilot.surfaceAt(from.x, from.y, 8, tolerance)
        const meets = autopilot.surfaceAt(startX - dir, startY, 4, 4, edge)
        return !!before && before.edge === meets?.edge
    },
    isLipTakeoff: true, //plan jumps off the exact top of a corner, false to compare in tools/autopilot-test.js
    lipDrop: 0.3, //a surface going down steeper than this, about 17 degrees, is where flat ground ends, running off it leaves the ground
    lipFor(x, feet, dir) { //where the ground the feet are on ends going dir, a drop or a steep slope down, { x, y, isBehind }, or null if it doesn't end within 400
        const here = autopilot.surfaceAt(x, feet)
        if (!here) return null
        const down = e => (dir > 0 ? e.y2 - e.y1 : e.y1 - e.y2) / (e.x2 - e.x1) //how steeply it goes down, going dir
        const start = e => dir > 0 ? { x: e.x1, y: e.y1 } : { x: e.x2, y: e.y2 }
        const end = e => dir > 0 ? { x: e.x2, y: e.y2 } : { x: e.x1, y: e.y1 }
        let e = here.edge
        if (down(e) > autopilot.lipDrop) { //already on the way down a slope, the lip is back at its top
            let lip = start(e)
            for (let k = 0; k < 4; k++) {
                const back = autopilot.surfaceAt(lip.x - dir * 1.5, lip.y, 4, 4, e)
                if (!back || down(back.edge) <= autopilot.lipDrop) break
                e = back.edge
                lip = start(e)
            }
            return { x: lip.x, y: lip.y, isBehind: true }
        }
        for (let k = 0; k < 16; k++) {
            const p = end(e)
            if (Math.abs(p.x - x) > 400) return null
            const next = autopilot.surfaceAt(p.x + dir * 1.5, p.y, 4, 4, e) //the ground carries on from here, maybe on another map piece
            if (!next) return { x: p.x, y: p.y, isBehind: false }
            if (down(next.edge) > autopilot.lipDrop) return { x: p.x, y: p.y, isBehind: false }
            e = next.edge
        }
        return null
    },
    dropLip(node, lip, dir) { //follow the downhill face from the jump lip to its outer edge
        let x = lip.x, y = lip.y, edge = null
        for (let i = 0; i < 16; i++) {
            const next = autopilot.surfaceAt(x + 1.5 * dir, y, 4, 5, edge)
            if (!next) return edge ? { x, y } : null
            edge = next.edge
            if ((edge.y2 - edge.y1) * dir <= (edge.x2 - edge.x1) * autopilot.lipDrop) return null //the slope joins more walkable ground
            x = dir > 0 ? edge.x2 : edge.x1
            y = dir > 0 ? edge.y2 : edge.y1
            if (Math.abs(x - node.x) > 120) return null
        }
        return null
    },
    indexGeometry() {
        const g = autopilot.grid
        if (!autopilot.isPreciseGeometry) { delete g.geometry; return }
        const buckets = g.geometry = new Map()
        const add = (part, isStatic, isSoft = false) => {
            const entry = { part, isStatic, isSoft }
            const b = part.bounds
            for (let y = Math.floor(b.min.y / 200); y <= Math.floor(b.max.y / 200); y++) {
                for (let x = Math.floor(b.min.x / 200); x <= Math.floor(b.max.x / 200); x++) {
                    const key = x + "," + y
                    if (!buckets.has(key)) buckets.set(key, [])
                    buckets.get(key).push(entry)
                }
            }
        }
        const addBody = (who, isStatic) => {
            const parts = who.parts.length > 1 ? who.parts.slice(1) : [who]
            for (const part of parts) add(part, isStatic, !isStatic && autopilot.isSoftBlock(who))
        }
        for (const who of map) if (!who.isRay && !who.autopilotDynamic && !autopilot.isBoostPiece(who)) addBody(who, true)
        for (const who of autopilot.dyn.keys()) addBody(who, false)
        for (const who of autopilot.activeTransports) {
            const t = who.autopilotTransport
            for (let i = 0; i < 2; i++) {
                const stop = t.stops[i]
                const y = g.y0 + Math.floor((t.tops[i] + 2 - g.y0) / autopilot.cell) * autopilot.cell
                const x1 = g.x0 + Math.floor((stop - t.width / 2 + 3 - g.x0) / autopilot.cell) * autopilot.cell
                const x2 = g.x0 + (Math.floor((stop + t.width / 2 - 3 - g.x0) / autopilot.cell) + 1) * autopilot.cell
                add({ bounds: { min: { x: x1, y }, max: { x: x2, y: y + 2 } }, vertices: [{ x: x1, y }, { x: x2, y }, { x: x2, y: y + 2 }, { x: x1, y: y + 2 }] }, true)
            }
        }
        for (const who of autopilot.activeElevators) {
            const e = who.autopilotElevator
            const x1 = g.x0 + Math.floor((who.holdX - e.width / 2 + 3 - g.x0) / autopilot.cell) * autopilot.cell
            const x2 = g.x0 + (Math.floor((who.holdX + e.width / 2 - 3 - g.x0) / autopilot.cell) + 1) * autopilot.cell
            for (const stop of [e.bottom, e.top]) {
                const y = g.y0 + Math.floor((stop + 2 - g.y0) / autopilot.cell) * autopilot.cell
                add({ bounds: { min: { x: x1, y }, max: { x: x2, y: y + 2 } }, vertices: [{ x: x1, y }, { x: x2, y }, { x: x2, y: y + 2 }, { x: x1, y: y + 2 }] }, true)
            }
        }
    },
    geometryIn(x1, y1, x2, y2, solid) {
        const g = autopilot.grid, found = new Set(), parts = []
        for (let y = Math.floor(y1 / 200); y <= Math.floor(y2 / 200); y++) {
            for (let x = Math.floor(x1 / 200); x <= Math.floor(x2 / 200); x++) {
                for (const entry of g.geometry.get(x + "," + y) || []) {
                    if (found.has(entry)) continue
                    found.add(entry)
                    if (solid === g.base && !entry.isStatic || solid === g.hard && entry.isSoft) continue
                    const b = entry.part.bounds
                    if (b.max.x >= x1 && b.min.x <= x2 && b.max.y >= y1 && b.min.y <= y2) parts.push(entry.part)
                }
            }
        }
        return parts
    },
    polygonBox(vertices, x1, y1, x2, y2) { //separating axes for a convex Matter part and a box
        for (let i = 0; i < vertices.length; i++) {
            const a = vertices[i], b = vertices[(i + 1) % vertices.length]
            const nx = a.y - b.y, ny = b.x - a.x
            let low = Infinity, high = -Infinity
            for (const v of vertices) { const d = nx * v.x + ny * v.y; low = Math.min(low, d); high = Math.max(high, d) }
            const center = nx * (x1 + x2) / 2 + ny * (y1 + y2) / 2
            const radius = Math.abs(nx) * (x2 - x1) / 2 + Math.abs(ny) * (y2 - y1) / 2
            if (center + radius < low || center - radius > high) return false
        }
        return true
    },
    surfaceY(x1, x2, y1, y2, solid = autopilot.grid.hard) {
        const g = autopilot.grid
        if (!g.geometry) { //keep the coarse floor tolerance, but search the whole downward sweep
            if (!autopilot.isBoxSolid(x1, y1, x2, y2, solid)) return Infinity
            const row = Math.floor((y1 - g.y0) / autopilot.cell)
            const last = Math.max(row + 2, Math.floor((y2 - g.y0) / autopilot.cell))
            for (let cy = Math.max(0, row); cy <= last && cy < g.h; cy++) {
                const top = g.y0 + cy * autopilot.cell
                if (top >= y1 - 1 && autopilot.isBoxSolid(x1, top + 1, x2, top + 2, solid)) return top
            }
            return Infinity
        }
        let best = Infinity
        for (const part of autopilot.geometryIn(x1, y1 - 1, x2, y2, solid)) {
            let top = Infinity
            const v = part.vertices
            for (let i = 0; i < v.length; i++) {
                const a = v[i], b = v[(i + 1) % v.length]
                if (Math.max(a.x, b.x) < x1 || Math.min(a.x, b.x) > x2) continue
                if (a.x === b.x) top = Math.min(top, a.y, b.y)
                else {
                    const left = Math.max(x1, Math.min(a.x, b.x)), right = Math.min(x2, Math.max(a.x, b.x))
                    top = Math.min(top, a.y + (left - a.x) * (b.y - a.y) / (b.x - a.x), a.y + (right - a.x) * (b.y - a.y) / (b.x - a.x))
                }
            }
            if (top >= y1 - 1 && top <= y2) best = Math.min(best, top)
        }
        return best
    },
    isSolidAt(x, y) {
        const g = autopilot.grid
        if (g.geometry) return autopilot.isBoxSolid(x, y, x, y)
        const cx = Math.floor((x - g.x0) / autopilot.cell), cy = Math.floor((y - g.y0) / autopilot.cell)
        if (cx < 0 || cy < 0 || cx >= g.w || cy >= g.h) return false
        return g.hard[cx + cy * g.w] === 1
    },
    indexExact() { //the real shapes of the map that stays put, in 200 wide squares, for isBoxSolidExact()
        const g = autopilot.grid
        const buckets = g.exact = new Map()
        for (const who of map) {
            if (who.isRay || who.autopilotDynamic || autopilot.isBoostPiece(who)) continue
            const parts = who.parts && who.parts.length > 1 ? who.parts.slice(1) : [who]
            for (const part of parts) {
                const b = part.bounds
                if (!b || !part.vertices) continue
                for (let y = Math.floor(b.min.y / 200); y <= Math.floor(b.max.y / 200); y++) {
                    for (let x = Math.floor(b.min.x / 200); x <= Math.floor(b.max.x / 200); x++) {
                        const key = x + "," + y
                        if (!buckets.has(key)) buckets.set(key, [])
                        buckets.get(key).push(part)
                    }
                }
            }
        }
    },
    isBoxSolidExact(x1, y1, x2, y2) { //isBoxSolid() on the hard grid, but where the grid has only the map that stays put, check the map's real shape
        const g = autopilot.grid
        if (g.geometry || !g.exact) return autopilot.isBoxSolid(x1, y1, x2, y2)
        const cell = autopilot.cell
        const c0 = Math.max(0, Math.floor((x1 - g.x0) / cell)), c1 = Math.min(g.w - 1, Math.floor((x2 - g.x0) / cell))
        const r0 = Math.max(0, Math.floor((y1 - g.y0) / cell)), r1 = Math.min(g.h - 1, Math.floor((y2 - g.y0) / cell))
        let isMap = false
        for (let cy = r0; cy <= r1; cy++) {
            for (let cx = c0; cx <= c1; cx++) {
                const i = cx + cy * g.w
                if (!g.hard[i]) continue
                if (!g.base[i]) return true //something that moves, the grid is all there is
                isMap = true
            }
        }
        if (!isMap) return false
        return autopilot.isMapExact(x1, y1, x2, y2)
    },
    verticalJumpBlocked(x1, y1, x2, y2) {
        const g = autopilot.grid
        if (!g.exact || g.geometry) return autopilot.isBoxSolidExact(x1, y1, x2, y2)
        if (!autopilot.isBoxSolid(x1, y1, x2, y2)) return false
        if (autopilot.isMapExact(x1, y1, x2, y2)) return true
        //A full margin matters beside a shrinking platform. Check its live shape, not the occupied cell.
        for (const [who, obstacle] of autopilot.dyn) {
            if (obstacle.isSoft || who.isThere === false) continue
            const b = who.bounds
            if (b.max.x < x1 || b.min.x > x2 || b.max.y < y1 || b.min.y > y2) continue
            const parts = who.parts.length > 1 ? who.parts.slice(1) : [who]
            if (parts.some(part => autopilot.polygonBox(part.vertices, x1, y1, x2, y2))) return true
        }
        return false
    },
    isMapExact(x1, y1, x2, y2) { //the real shape of the map that stays put is in this box, see indexExact()
        const g = autopilot.grid
        const seen = new Set()
        for (let y = Math.floor(y1 / 200); y <= Math.floor(y2 / 200); y++) {
            for (let x = Math.floor(x1 / 200); x <= Math.floor(x2 / 200); x++) {
                for (const part of g.exact.get(x + "," + y) || []) {
                    if (seen.has(part)) continue
                    seen.add(part)
                    const b = part.bounds
                    if (b.max.x >= x1 && b.min.x <= x2 && b.max.y >= y1 && b.min.y <= y2 && autopilot.polygonBox(part.vertices, x1, y1, x2, y2)) return true
                }
            }
        }
        return false
    },
    isBoxSolid(x1, y1, x2, y2, solid = autopilot.grid.hard) { //jumps, falls, and flying hit the hard grid, standing spots use base or solid
        const g = autopilot.grid
        if (g.geometry) return autopilot.geometryIn(x1, y1, x2, y2, solid).some(part => autopilot.polygonBox(part.vertices, x1, y1, x2, y2))
        const cell = autopilot.cell
        const c0 = Math.max(0, Math.floor((x1 - g.x0) / cell)), c1 = Math.min(g.w - 1, Math.floor((x2 - g.x0) / cell))
        const r0 = Math.max(0, Math.floor((y1 - g.y0) / cell)), r1 = Math.min(g.h - 1, Math.floor((y2 - g.y0) / cell))
        for (let cy = r0; cy <= r1; cy++) {
            for (let cx = c0; cx <= c1; cx++) if (solid[cx + cy * g.w]) return true
        }
        return false
    },
    nodeNear(x, y, columns = 1, rows = 2) { //the node closest to feet at x, y, or -1
        const g = autopilot.grid
        const cell = autopilot.cell
        const cx = Math.floor((x - g.x0) / cell), cy = Math.round((y - g.y0) / cell) - 1
        columns = autopilot.cellsFor(columns * 25)
        rows = autopilot.cellsFor(rows * 25)
        let best = -1, bestD = Infinity
        for (let i = -columns; i <= columns; i++) {
            for (let j = -rows; j <= rows; j++) {
                const a = cx + i, c = cy + j
                if (a < 0 || c < 0 || a >= g.w || c >= g.h) continue
                const id = g.nodeAt[a + c * g.w]
                if (id < 0) continue
                const d = g.geometry ? Math.abs(autopilot.nodes[id].x - x) * 1.5 + Math.abs(autopilot.nodes[id].y - y) : Math.abs(i) * 1.5 + Math.abs(j)
                if (d < bestD) {
                    bestD = d
                    best = id
                }
            }
        }
        return best
    },
    nodeBelow(x, y, columns = 0) { //the first node under a point
        const g = autopilot.grid
        const cell = autopilot.cell
        const cx = Math.floor((x - g.x0) / cell)
        const from = Math.max(0, Math.floor((y - g.y0) / cell) - 1)
        columns = autopilot.cellsFor(columns * 25)
        for (let cy = from; cy < g.h; cy++) {
            for (let i = 0; i <= columns; i++) {
                for (const a of i ? [cx - i, cx + i] : [cx]) {
                    if (a < 0 || a >= g.w) continue
                    if (g.nodeAt[a + cy * g.w] >= 0) return g.nodeAt[a + cy * g.w]
                }
            }
        }
        return -1
    },

    //*********************************************************************
    // moving obstacles
    //*********************************************************************
    hasMovementChanged() { //tech, fields, and size change how far the player jumps and runs, the paths were simulated with the old numbers
        if ((player.scale || 1) !== autopilot.pScale) { //where the player fits changed, build it all again
            autopilot.build()
            autopilot.say("re-planning", "the player changed size")
            return true
        }
        if (m.isHolding || input.field || autopilot.flying) return false //negative mass temporarily changes air control
        const now = autopilot.physics()
        if (autopilot.hasDifferentMovement(now)) { //simulate every edge again with the new numbers, a little each cycle
            autopilot.cancelMovement()
            autopilot.failed.clear()
            autopilot.recentFailures.length = 0
            autopilot.noFly.clear()
            autopilot.p = now
            for (const node of autopilot.nodes) if (!node.dead) {
                for (const edge of node.edges) edge.fail = 0 //a different jump strength gets a fresh attempt
                autopilot.relink.add(node.id)
            }
            autopilot.say("re-planning", "the player moves differently now")
        }
        return false
    },
    hasDifferentMovement(now) {
        const was = autopilot.p
        return !was || now.blockJumps !== (was.blockJumps || 0) || now.nitinol !== !!was.nitinol ||
            ["jump", "run", "push", "limit", "gravity", "coyote", "apex"].some(k => Math.abs(now[k] - was[k]) > 0.04 * Math.abs(was[k]))
    },
    hasMapChanged() { //a map piece was added or removed, the grid is built again
        return map.filter(who => !who.isRay).length !== autopilot.grid.mapCount
    },
    findMovingMap() { //a map piece that was still started moving, from then on it's drawn like a block
        for (let i = 0; i < map.length; i++) {
            const who = map[i]
            if (who.isRay || who.autopilotDynamic || autopilot.isBoostPiece(who)) continue
            const was = who.autopilotBounds
            if (!was || Math.abs(was.x - who.bounds.min.x) > 1 || Math.abs(was.y - who.bounds.min.y) > 1) {
                if (was) { //where it was, the cells it covered then
                    const now = { x: who.position.x, y: who.position.y }
                    Matter.Body.setPosition(who, { x: now.x + was.x - who.bounds.min.x, y: now.y + was.y - who.bounds.min.y })
                    autopilot.unbase(who)
                    Matter.Body.setPosition(who, now)
                }
                who.autopilotDynamic = true
            }
        }
    },
    updateObstacles(isRelink = true) { //redraw the obstacles that moved, then rebuild the nodes around them
        const g = autopilot.grid
        const { w, base, solid, dynCount, dynWeight, hard, hardCount, fixed, fixedCount } = g
        autopilot.findHanging()
        const list = []
        for (let i = 0; i < body.length; i++) if (autopilot.isObstacle(body[i])) list.push(body[i])
        for (let i = 0; i < map.length; i++) if (map[i].autopilotDynamic || map[i].isRay) list.push(map[i])
        autopilot.dynList = list
        const dirty = [] //boxes of cells that changed, { c0, r0, c1, r1 }, one per obstacle so far apart ones don't make one huge box
        const change = (cells, delta, weight, box, isSoft = false) => {
            for (let k = 0; k < cells.length; k++) {
                const i = cells[k]
                dynCount[i] += delta
                dynWeight[i] = dynCount[i] > 0 ? Math.max(0, dynWeight[i] + delta * weight) : 0
                solid[i] = base[i] || dynCount[i] > 0 ? 1 : 0
                if (!isSoft) hardCount[i] += delta
                hard[i] = base[i] || hardCount[i] > 0 ? 1 : 0
                if (fixedCount) {
                    if (weight >= 3000) fixedCount[i] += delta
                    fixed[i] = base[i] || fixedCount[i] > 0 ? 1 : 0
                }
                const cx = i % w, cy = (i - cx) / w
                if (cx < box.c0) box.c0 = cx
                if (cx > box.c1) box.c1 = cx
                if (cy < box.r0) box.r0 = cy
                if (cy > box.r1) box.r1 = cy
            }
        }
        const newBox = () => {
            const box = { c0: Infinity, r0: Infinity, c1: -Infinity, r1: -Infinity }
            dirty.push(box)
            return box
        }
        const seen = new Set(list)
        for (const who of list) {
            const was = autopilot.dyn.get(who)
            const bounds = who.bounds
            const shapeChanged = was && (!was.bounds || Math.abs((bounds.max.x - bounds.min.x) - (was.bounds[2] - was.bounds[0])) >= 1 || Math.abs((bounds.max.y - bounds.min.y) - (was.bounds[3] - was.bounds[1])) >= 1)
            if (was && !shapeChanged && Math.abs(was.x - who.position.x) < 4 && Math.abs(was.y - who.position.y) < 4 && Math.abs(was.angle - who.angle) < 0.04) continue
            if (!who.autopilotDynamic && !who.autopilotElevator && !who.isDoor && (who.speed > 5 || Math.abs(who.angularVelocity) > 0.06)) { //a block flying or spinning, leave it out until it settles, moving platforms stay in
                if (was) {
                    change(was.cells, -1, was.weight, newBox(), was.isSoft)
                    autopilot.dyn.delete(who)
                }
                continue
            }
            const cells = []
            autopilot.cellsOfBody(who, cells)
            if (was && was.cells.length === cells.length && was.cells.every((c, k) => c === cells[k])) {
                if (autopilot.isSpinner(who)) { //a beam tipping a little, the spots on it keep their cells, rebuilding every jump near a long beam isn't worth it
                    was.angle = who.angle
                    continue
                }
                const box = newBox()
                for (const i of cells) {
                    const cx = i % w, cy = (i - cx) / w
                    box.c0 = Math.min(box.c0, cx); box.c1 = Math.max(box.c1, cx)
                    box.r0 = Math.min(box.r0, cy); box.r1 = Math.max(box.r1, cy)
                }
                was.x = who.position.x
                was.y = who.position.y
                was.angle = who.angle
                was.bounds = [bounds.min.x, bounds.min.y, bounds.max.x, bounds.max.y]
                continue
            }
            const box = newBox()
            if (was) change(was.cells, -1, was.weight, box, was.isSoft)
            const weight = autopilot.obstacleWeight(who)
            if (weight >= 3000) autopilot.lastHeavyMove = simulation.cycle //a door or platform moving
            const isSoft = autopilot.isSoftBlock(who)
            change(cells, 1, weight, box, isSoft)
            autopilot.dyn.set(who, { cells, weight, isSoft, x: who.position.x, y: who.position.y, angle: who.angle, bounds: [bounds.min.x, bounds.min.y, bounds.max.x, bounds.max.y] })
        }
        for (const [who, was] of autopilot.dyn) { //gone, or held
            if (seen.has(who)) continue
            change(was.cells, -1, was.weight, newBox(), was.isSoft)
            autopilot.dyn.delete(who)
        }
        autopilot.indexGeometry()
        if (dirty.length) autopilot.flyStamp = autopilot.flyStamp % 65000 + 1 //open air changed
        if (isRelink) {
            for (const box of dirty) if (box.c1 >= box.c0) autopilot.updateNodes(box)
        }
    },
    updateNodes({ c0, r0, c1, r1 }) { //nodes stand on the cell below and need clear cells above, then edges near them are rebuilt
        const g = autopilot.grid
        const nodes = autopilot.nodes
        const cell = autopilot.cell
        const size = autopilot.size()
        const a0 = Math.max(1, c0 - autopilot.cellsFor(50)), a1 = Math.min(g.w - 2, c1 + autopilot.cellsFor(50))
        const b0 = Math.max(autopilot.cellsFor(150), r0 - autopilot.cellsFor(50)), b1 = Math.min(g.h - 2, r1 + autopilot.cellsFor(175))
        for (let cx = a0; cx <= a1; cx++) {
            for (let cy = b0; cy <= b1; cy++) {
                const i = cx + cy * g.w
                const made = autopilot.makeNode(cx, cy, size)
                const id = g.nodeAt[i]
                if (id >= 0) {
                    const node = nodes[id]
                    if (made && made.isStatic === node.isStatic) { //still here, static nodes only go when the map under them moves
                        node.y = made.y
                        node.isCrouch = made.isCrouch
                        node.cover = made.cover
                        continue
                    }
                    autopilot.killNode(node)
                }
                if (made) {
                    made.id = nodes.length
                    g.nodeAt[i] = made.id
                    nodes.push(made)
                    autopilot.rev[made.id] = []
                    autopilot.tagNode(made, size)
                }
            }
        }
        //jumps reach about 650 across, falls from above can land here
        const left = g.x0 + a0 * cell - 650, right = g.x0 + (a1 + 1) * cell + 650
        const top = g.y0 + b0 * cell - 1200, bottom = g.y0 + (b1 + 1) * cell + 500
        for (const node of nodes) {
            if (!node.dead && node.x > left && node.x < right && node.y > top && node.y < bottom) autopilot.relink.add(node.id)
        }
    },
    unbase(who) { //a map piece that was still started moving, take it off the map that doesn't move, then it's drawn like a block
        const g = autopilot.grid
        const cells = []
        autopilot.cellsOfBody(who, cells)
        if (!cells.length) return
        for (const i of cells) g.base[i] = 0
        const b = who.bounds
        for (const other of map) { //put back pieces it overlapped
            if (other === who || other.autopilotDynamic || autopilot.isBoostPiece(other)) continue
            if (other.bounds.max.x < b.min.x || other.bounds.min.x > b.max.x || other.bounds.max.y < b.min.y || other.bounds.min.y > b.max.y) continue
            const again = []
            autopilot.cellsOfBody(other, again)
            for (const i of again) g.base[i] = 1
        }
        const box = { c0: Infinity, r0: Infinity, c1: -Infinity, r1: -Infinity }
        for (const i of cells) {
            g.solid[i] = g.base[i] || g.dynCount[i] > 0 ? 1 : 0
            g.hard[i] = g.base[i] || g.hardCount[i] > 0 ? 1 : 0
            if (g.fixed) g.fixed[i] = g.base[i] || g.fixedCount[i] > 0 ? 1 : 0
            const cx = i % g.w, cy = (i - cx) / g.w
            box.c0 = Math.min(box.c0, cx)
            box.c1 = Math.max(box.c1, cx)
            box.r0 = Math.min(box.r0, cy)
            box.r1 = Math.max(box.r1, cy)
        }
        autopilot.updateNodes(box)
    },
    relinkAll() { //rebuild the edges of every live node, a little each cycle
        for (const node of autopilot.nodes) if (!node.dead) autopilot.relink.add(node.id)
    },
    relinkSome(ms) { //rebuild queued edges for up to ms, then the plan once they're all done
        if (!autopilot.relink.size) return
        const start = performance.now()
        const size = autopilot.size()
        let count = 0
        for (const id of autopilot.relink) {
            autopilot.relink.delete(id)
            const node = autopilot.nodes[id]
            if (!node.dead) autopilot.linkNode(node, size)
            if (++count >= 12 && performance.now() - start > ms) break //at least a few each cycle, so a slow computer still catches up
        }
        autopilot.isPlanDirty = true
        autopilot.relinkMs = Math.max(autopilot.relinkMs, performance.now() - start)
    },
})
