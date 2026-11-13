"use strict";
//autopilot: the player moves, fights, and exits on their own, autopilot.toggle() in the browser console turns it on, autopilot.toggle(true) also handles power up menus
//  the map is drawn onto a grid of cells, every spot the player can stand is a node, and nodes are joined by
//  walking, jumping, falling, boosts, and elevators, the jumps and falls are found by simulating the player's arc through the grid
//  blocks, doors, and map pieces that move are drawn on the grid too, every few cycles the ones that moved are redrawn,
//  and the nodes and edges near them are rebuilt a little each cycle, the tops of blocks are places to stand,
//  and a block over a spot on the map makes walking there cost more, a lot more if it's too heavy to push
//  a shortest path search from the goal gives every node its next step, so the player can be knocked anywhere and keep going
//  an edge that doesn't work when it's tried costs more next time, so the path changes
//  while running it also tries jumping from where it is, and takes the jump if that lands somewhere closer than the plan
//  when the way to the exit goes through a closed door or a hazard, or there's no way at all, it presses buttons and flips toggles
//  a word above the player says what it's doing, like lost or stuck, and it circles what it's going for and shooting at
//autopilot.do() runs once a cycle from cycle() in js/index.js, it only sets input.* and simulation.mouse
const autopilot = {
    isOn: false,
    isDrawPath: true, //a faint line along the planned path
    only: "", //"exit" skips power ups and hunting, for tools/autopilot-test.js
    cell: 25, //world units; keep 25 until repeated play tests justify a finer default
    isPreciseGeometry: false, //experimental: enable with the corner benchmark before promoting
    cellsFor(distance) { return Math.ceil(distance / autopilot.cell) },
    grid: null, //{ x0, y0, w, h, base, solid, dynCount, dynWeight, nodeAt, mapCount }, base is the map that doesn't move, solid adds what does
    nodes: [], //{ id, x, y, cx, cy, edges: [], isStatic, cover, isBoost, isCrouch, elevator, elevatorLevel, dead }, x is the player's center and y is their feet
    //  a static node stands on the map that doesn't move and is always there, cover is the cost of what's in the way there now
    //  the others stand on top of moving things and come and go with them
    rev: [], //edges that arrive at each node
    boosts: [],
    elevators: [],
    activeElevators: new Set(),
    p: null, //the player's physics when the grid was built
    dyn: new Map(), //each moving obstacle and the cells it covers
    dynList: [], //the moving obstacles, to find the floor on top of one
    relink: new Set(), //nodes whose edges need rebuilding, a little each cycle
    lastBuildCycle: -Infinity,
    buildMs: 0,
    relinkMs: 0, //the most a cycle has spent on moving obstacles, for tools/autopilot-test.js
    stats: { jump: [0, 0], fall: [0, 0], boost: [0, 0], grapple: [0, 0], portal: [0, 0] }, //[tried, landed where planned] for tools/autopilot-test.js
    misses: [], //what the ones that missed looked like
    jumpKinds: {}, //[tried, landed] by how the jump was started, for tools/autopilot-test.js
    recentFailures: [], //a few recent maneuvers, including their nearby grid variants
    failed: new Map(), //how often an edge failed, by its cells, so it isn't forgotten when a moving platform's node is made again
    //the plan
    goal: -1, //node id
    goalType: "", //"exit", "powerUp", "mob"
    goalWho: null,
    goalSince: 0,
    atGoalCount: 0,
    dist: null, //cycles from each node to the goal
    next: null, //the edge to take from each node
    isPlanDirty: true,
    lastPlanCycle: -Infinity,
    ignored: new Map(), //power ups and mobs given up on, and the cycle to try them again
    //driving
    cur: -1, //the node the player is at, or was last at
    pending: null, //{ edge, mcycle, isJump } the edge being started, so leaving the ground knows which one it was
    flight: null, //{ edge, to, since, mStart, isJumped } while in the air
    loadedJumpMiss: null, //a ledge the current block made it too heavy to reach
    wiggleUntil: 0,
    wiggleDir: 1,
    backUp: null, //{ dir, until } getting room to run before a running jump
    slideSince: 0, //the cycle it started sliding down a slope too steep to stand on
    pushCount: 0, //times in a row it got stuck and tried shoving a block beside it
    watch: { x: 0, y: 0, cycle: 0 }, //where the player was, to notice they are stuck
    blockedCycles: 0,
    target: null, //the mob being shot at
    fightSince: 0,
    fightMobCount: 0,
    pushOnUntil: 0,
    aim: { x: 0, y: 0 },
    hazards: [],
    jumpZones: [], //read-only observations of zone methods the level actually runs
    winds: [], //each level.wind() zone, { x, y, width, height, velocity, isFloat }
    observeJumpZone(zone, method, effect) {
        const run = zone[method]
        zone[method] = function () {
            //Some hazard objects are used as lasers. Only query() and heatQuery() affect motion.
            effect.cycle = simulation.cycle
            return run.apply(this, arguments)
        }
        effect.zone = zone
        autopilot.jumpZones.push(effect)
    },
    jumpZoneActive(z) {
        return z.zone.isOn !== false && (z.zone.height ?? 1) > 0 && simulation.cycle - z.cycle <= 2
    },
    jumpZoneStep(zones, x, feet, vx, vy, size, gravity, force) {
        //Matter's bounds include the velocity expansion and the foot sensor below the body.
        const footSensor = 7 * (player.scale || 1)
        for (const z of zones) {
            const b = z.bounds
            if (b.radius !== undefined) {
                if ((x - b.x) ** 2 + (feet - 73 * (player.scale || 1) - b.y) ** 2 > b.radius ** 2) continue
            } else if (x + size.halfWidth + Math.max(0, vx) < b.min.x || x - size.halfWidth + Math.min(0, vx) > b.max.x ||
                feet + footSensor + Math.max(0, vy) < b.min.y || feet - size.height + Math.min(0, vy) > b.max.y) continue
            if (z.kind === "slime") {
                force.ay -= gravity * (vy > 5 ? 1.45 : 0.5)
                vx *= Math.max(0.95, 1 - 0.036 * Math.abs(vx))
                vy *= vy > 0 ? Math.max(0.8, 1 - 0.002 * vy * vy) : Math.max(0.98, 1 - 0.001 * Math.abs(vy))
            } else if (z.kind === "heat") {
                if (vy < 0) force.ay -= 0.5 * gravity
            } else if (z.kind === "gravity") {
                force.ay += (z.zone.gravity - 1) * gravity
            } else {
                force.ax += z.ax * gravity
                force.ay += z.ay * gravity
                vx *= z.keep
                vy *= z.keep
            }
        }
        force.vx = vx
        force.vy = vy
    },
    windSignature: null, //changes when a button turns the fans around
    windAt(x, feet, isGround) { //how much the wind zones the player's body is in speed them up each cycle, see level.wind()
        let ax = 0, ay = 0, isFloat = false, isIn = false
        for (const w of autopilot.winds) {
            if (x + 25 < w.x || x - 25 > w.x + w.width || feet < w.y || feet - 129 > w.y + w.height) continue
            const dt2 = simulation.delta * simulation.delta * 5 / player.mass
            ax += w.velocity.x * dt2 * (isGround ? 0.5 : 1) //the force is velocity × 5 on a player of mass 5
            ay += w.velocity.y * dt2
            if (w.isFloat) isFloat = true
            isIn = true
        }
        return isIn ? { ax, ay, isFloat } : null
    },
    portals: [], //each level.portal() pair, [portalA, portalB, mapA, mapB], the map pieces have unit, exit, and portalPair
    triggers: [], //{ kind: "button" or "toggle", obj, arrivedAt, startOn } buttons and toggles in the level
    tried: new Map(), //each trigger and the cycle it was last tried
    lastHeavyMove: 0, //the last cycle a door, a moving map piece, or a hazard moved, to wait for them to finish
    hazardSignature: 0,
    said: "", //the last thing it said in the in game console, and when
    saidCycle: -Infinity,
    WALK: 0, JUMP: 1, FALL: 2, BOOST: 3, RIDE: 4, GRAPPLE: 5, PORTAL: 6,
    edgeNames: ["walk", "jump", "fall", "boost", "ride", "grapple", "portal"],

    //*********************************************************************
    // setup
    //*********************************************************************
    setup() { //level.boost() and the others are local to each level's code, so what they make is tagged as it's made
        const boost = level.boost
        level.boost = function (x, y, launchHeight = 1000, angle = Math.PI / 2) {
            const who = boost.apply(this, arguments)
            if (who) who.autopilotBoost = { x, y, launchHeight, angle }
            return who
        }
        const elevator = level.elevator
        level.elevator = function (x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }, isAtTop = false, isSmoothStop = false) {
            const who = elevator.apply(this, arguments)
            if (who) {
                who.autopilotElevator = { width, height, bottom: y, top: maxHeight, force, friction: { ...friction }, isSmoothStop, mode: "unknown", enabled: false, commandCycle: -Infinity, commandPlayerCycle: -Infinity, nodes: [[], []] }
                for (const mode of ["move", "moveOnTouch"]) {
                    const move = who[mode]
                    who[mode] = function (isOn = true) {
                        const e = this.autopilotElevator
                        e.mode = mode
                        e.enabled = isOn
                        e.commandCycle = simulation.cycle
                        e.commandPlayerCycle = m.cycle
                        return move.apply(this, arguments)
                    }
                }
            }
            return who
        }
        const train = level.train
        level.train = function () {
            const who = train.apply(this, arguments)
            if (who) who.autopilotDynamic = true //fast path-driven platforms must not be discarded as flying debris
            return who
        }
        const doorMap = level.doorMap
        level.doorMap = function () {
            const who = doorMap.apply(this, arguments)
            if (who) {
                who.autopilotDynamic = true //a map piece that moves
                who.isDoor = true
            }
            return who
        }
        const door = level.door
        level.door = function () {
            const who = door.apply(this, arguments)
            if (who) who.isDoor = true //it opens and closes, it can't be pushed out of the way
            return who
        }
        const button = level.button
        level.button = function () {
            const who = button.apply(this, arguments)
            if (who) autopilot.triggers.push({ kind: "button", obj: who, arrivedAt: 0 })
            return who
        }
        const toggle = level.toggle
        level.toggle = function () {
            const who = toggle.apply(this, arguments)
            if (who) autopilot.triggers.push({ kind: "toggle", obj: who, arrivedAt: 0 })
            return who
        }
        const wind = level.wind
        level.wind = function () {
            const zone = wind.apply(this, arguments)
            if (zone) autopilot.winds.push(zone)
            return zone
        }
        const portal = level.portal
        level.portal = function () {
            const pair = portal.apply(this, arguments)
            if (pair) autopilot.portals.push(pair)
            return pair
        }
        const hazard = level.hazard
        level.hazard = function () {
            const who = hazard.apply(this, arguments)
            autopilot.hazards.push(who)
            autopilot.observeJumpZone(who, "query", { kind: "slime", bounds: who })
            autopilot.observeJumpZone(who, "heatQuery", { kind: "heat", bounds: who })
            return who
        }
        const gravityZone = level.gravityZone
        level.gravityZone = function () {
            const zone = gravityZone.apply(this, arguments)
            autopilot.observeJumpZone(zone, "do", { kind: "gravity", bounds: zone })
            return zone
        }
        const effectZone = level.effectZone
        level.effectZone = function (bounds, { force = 0, angle = Math.PI / 2, drag = 0, who = "player body mob bullet powerUp" } = {}) {
            const zone = effectZone.apply(this, arguments)
            if ((force || drag) && who.split(" ").includes("player")) {
                autopilot.observeJumpZone(zone, "do", { kind: "effect", bounds, ax: force * Math.cos(angle), ay: -force * Math.sin(angle), keep: Math.max(0, 1 - drag) })
            }
            return zone
        }
        const start = level.start
        level.start = function () {
            autopilot.hazards.length = 0
            autopilot.jumpZones.length = 0
            autopilot.triggers.length = 0
            autopilot.portals.length = 0
            autopilot.winds.length = 0
            autopilot.reset()
            return start.apply(this, arguments)
        }
    },
    set(isOn) {
        autopilot.isOn = isOn
        autopilot.reset()
        if (typeof input !== "undefined") input.reset()
    },
    toggle(isAutoChoose = false) { //for testing, from the browser console: autopilot.toggle() turns it on or off, autopilot.toggle(true) also picks power ups
        tech.isAutopilotChoose = isAutoChoose
        autopilot.set(!autopilot.isOn)
        return autopilot.isOn ? "autopilot on" + (isAutoChoose ? ", auto choosing power ups" : "") : "autopilot off"
    },
    choiceDelay: 3000, //milliseconds a power up's menu stays up before auto choose clicks, so the player can see what it was
    chooseDraft() { //called after the draft's click delay, even when the game loop is paused
        const isReady = () => autopilot.isOn && tech.isAutopilotChoose && //tech.isAutopilotChoose is the autopilot tech's checkbox, it favors skins and weapon or field upgrades and skips JUNK
            m.alive && !simulation.onTitlePage && simulation.isChoosing
        if (!isReady()) return
        const grid = document.getElementById("choose-grid")
        let choice = grid.querySelector("#choose-difficulty")
        if (!choice) {
            let fallback = null
            for (const card of grid.querySelectorAll(".card-background[onclick]")) {
                const match = card.getAttribute("onclick").match(/^powerUps\.choose\('tech',(\d+)\)$/)
                const upgrade = match && tech.tech[Number(match[1])]
                if (upgrade && upgrade.isJunk) continue
                if (upgrade && (upgrade.isSkin || upgrade.isSkinUpgrade || upgrade.isGunTech || upgrade.isFieldTech)) {
                    choice = card
                    break
                }
                fallback ??= card
            }
            choice ||= fallback || grid.querySelector(".cancel-card[onclick], .entanglement[onclick]")
        }
        if (!choice) return
        const draftId = powerUps.draftId
        autopilot.pointAt(choice)
        setTimeout(() => { //the same menu, still open
            if (isReady() && powerUps.draftId === draftId && choice.isConnected) choice.click()
        }, autopilot.choiceDelay)
    },
    pointAt(choice) { //light up the choice like a mouse hover, so the player can see what it's about to pick
        choice.classList.add("autopilot-hover")
    },
    cancelMovement() { //node references and timers belong to one uninterrupted maneuver
        autopilot.flight = autopilot.pending = autopilot.backUp = null
        autopilot.rayMove = null
        autopilot.loadedJumpMiss = null
        autopilot.flying = autopilot.warp = autopilot.grapple = autopilot.exactAim = autopilot.carry = autopilot.carryAim = null
        if (autopilot.blockClear && !m.isHolding) m.holdingTarget = null
        autopilot.blockClear = null
        autopilot.commit = null
        autopilot.window = { key: "", start: 0 }
        autopilot.wiggleUntil = autopilot.blockedCycles = autopilot.stuckCount = autopilot.waitSince = autopilot.slideSince = autopilot.pushCount = 0
        autopilot.isHolding = false
        autopilot.riding = null
        autopilot.rideProgress = null
        autopilot.combat = ""
        autopilot.watch = { x: typeof player !== "undefined" && player ? player.position.x : 0, y: typeof playerBody !== "undefined" && playerBody ? playerBody.bounds.max.y : 0, cycle: simulation.cycle }
    },
    invalidateNavigation() { //a rebuilt grid reuses node ids, none of the old references may survive
        autopilot.cancelMovement()
        autopilot.goal = autopilot.cur = -1
        autopilot.goalWho = null
        autopilot.goalType = ""
        autopilot.dist = autopilot.next = null
        autopilot.noFly.clear()
        autopilot.failed.clear()
        autopilot.recentFailures.length = 0
        autopilot.isPlanDirty = true
        autopilot.lastPlanCycle = -Infinity
    },
    reset() {
        autopilot.invalidateNavigation()
        autopilot.target = null
        autopilot.atGoalCount = 0
        autopilot.isAiming = false
        autopilot.hazardSignature = ""
        autopilot.manualControl = false
        autopilot.controlField = m.fieldMode
        autopilot.grid = null
        autopilot.nodes = []
        autopilot.elevators = []
        autopilot.activeElevators.clear()
        autopilot.dyn.clear()
        autopilot.dynList = []
        autopilot.relink.clear()
        autopilot.badAnchors = []
        autopilot.elevatorStuckUntil = 0
        autopilot.windSignature = null
        autopilot.isPlanDirty = true
        autopilot.ignored.clear()
        autopilot.tried.clear()
        autopilot.saidAt.clear()
        autopilot.explored.length = 0
        autopilot.lostSince = 0
        autopilot.lastHeavyMove = 0
        autopilot.lastBuildCycle = -Infinity
        autopilot.rayWalls = null
        autopilot.lastRayAttempt = -Infinity
        autopilot.pushOnUntil = 0
    },

    //*********************************************************************
    // the grid and its nodes
    //*********************************************************************
    size() { //the standing player, from the middle of their feet
        const scale = player.scale || 1
        //Down also changes size with scale invariance. Plan for standing clearance at small size.
        return { halfWidth: 25 * scale, height: 132 * scale, crouchHeight: (tech.isScaleInvariance && scale < 1 ? 132 : 96) * scale, foot: 14 * scale }
    },
    physics() { //what one cycle does to the player's velocity, like Matter's Body.update
        const dt2 = simulation.delta * simulation.delta
        return {
            gravity: simulation.g * dt2,
            jump: m.jumpForce / player.mass * dt2,
            push: m.FxAir / player.mass * dt2,
            limit: m.airSpeedLimit / player.mass,
            run: 7.2 * (m.Fx / player.mass * dt2) / 0.889, //ground speed settles here
            coyote: Math.min(m.coyoteCycles, 600), //some tech makes it long enough to jump again and again in the air
            apex: m.apexGravity,
            blockJumps: simulation.ephemera.filter(effect => effect.name === "blockJump").length,
        }
    },
    isBoostPiece: who => !!(who.boostBounds || who.autopilotBoost),
    elevatorEnabled(who) {
        const e = who.autopilotElevator
        //Some levels park the lift by ceasing to call move() instead of calling move(false).
        //Use the player clock so a time skip that omits level updates doesn't park a running lift.
        return who.isOn !== false && !!e.enabled && m.cycle - e.commandPlayerCycle <= 2
    },
    isObstacle(who) { //a block in body[] the path goes around or over, small ones the player steps over or pushes
        if (m.isHolding && who === m.holdingTarget) return false
        if (!(who.collisionFilter.mask & cat.player)) return false
        if (who.autopilotElevator) return !autopilot.activeElevators.has(who)
        if (who.isNotHoldable && (who.autopilotSpinner || Math.abs(who.angularVelocity) > 0.003)) { //rotors and spinners turn all the time, redrawing them would never stop
            who.autopilotSpinner = true
            return false
        }
        const b = who.bounds
        return b.max.y - b.min.y > 32 || b.max.x - b.min.x > 60
    },
    hanging: new Set(), //blocks hanging from a constraint, like a swinging door, the player can push them aside even when they can't be picked up
    findHanging() {
        const set = autopilot.hanging = new Set()
        const lists = [typeof cons === "undefined" ? [] : cons, typeof consBB === "undefined" ? [] : consBB]
        for (const list of lists) {
            for (const c of list) {
                if (c.bodyA && !c.bodyA.isStatic) set.add(c.bodyA)
                if (c.bodyB && !c.bodyB.isStatic) set.add(c.bodyB)
            }
        }
    },
    isPushable(who) { //a block the player can shove out of the way, not a door, platform, or something else the level moves
        if (who.autopilotDynamic || who.autopilotElevator || who.isStatic || who.isDoor) return false
        return !who.isNotHoldable || autopilot.hanging.has(who)
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
        autopilot.invalidateNavigation()
        const x0 = Math.floor(minX / cell) * cell - autopilot.cellsFor(200) * cell
        const y0 = Math.floor(minY / cell) * cell - autopilot.cellsFor(600) * cell
        const w = Math.ceil((maxX - x0) / cell) + autopilot.cellsFor(200)
        const h = Math.ceil((maxY - y0) / cell) + autopilot.cellsFor(100)
        const base = new Uint8Array(w * h) //the map that doesn't move
        const grid = autopilot.grid = { x0, y0, w, h, base, solid: base, dynCount: new Uint16Array(w * h), dynWeight: new Float32Array(w * h), nodeAt: new Int32Array(w * h).fill(-1), mapCount: map.filter(who => !who.isRay).length }
        autopilot.p = autopilot.physics()
        autopilot.pScale = player.scale || 1
        autopilot.flyStamp = autopilot.flyStamp % 65000 + 1

        //draw the map onto the grid
        const boosts = autopilot.boosts = []
        const cells = []
        for (let i = 0; i < map.length; i++) {
            const who = map[i]
            if (autopilot.isBoostPiece(who)) { //its body sits in the floor, the player never stands on it
                const made = who.autopilotBoost || { launchHeight: 1000, angle: Math.PI / 2 }
                const bounds = who.boostBounds //levels that flip move these, so where it was made isn't where it is
                boosts.push({ x: bounds ? bounds.min.x : who.position.x - 50, y: bounds ? bounds.max.y : who.position.y - 35, launchHeight: made.launchHeight, angle: made.angle })
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

        //An active elevator has virtual platforms at both stops. Parked lifts are drawn at their live position below.
        const elevators = autopilot.elevators = body.filter(who => who.autopilotElevator)
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
                autopilot.tagNode(node)
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
            isStatic = space > 0
        }
        if (!isStatic) { //on top of something that moves, or floating a little above a slope too steep to stand on, isOnMap() tells them apart
            if (solid[cx + cy * w] || !solid[cx + (cy + 1) * w]) return null
            y = floorAt(solid)
            space = Number.isFinite(y) ? room(solid, y) : 0
            if (!space) return null
        }
        const node = { id: -1, x, y, cx, cy, edges: [], isStatic, cover: 0, isBoost: false, isCrouch: space === 1, elevator: null, elevatorLevel: 0, dead: false }
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
    tagNode(node) { //boosts and elevator stops
        for (const boost of autopilot.boosts) {
            if (node.x > boost.x && node.x < boost.x + 100 && Math.abs(node.y - boost.y) < 40) node.isBoost = boost
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
        if (node.elevator) {
            const list = node.elevator.autopilotElevator.nodes[node.elevatorLevel]
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
                    add(a.x < b.x ? { x1: a.x, y1: a.y, x2: b.x, y2: b.y } : { x1: b.x, y1: b.y, x2: a.x, y2: a.y })
                }
            }
        }
    },
    edgeY: (e, x) => e.y1 + (Math.min(e.x2, Math.max(e.x1, x)) - e.x1) * (e.y2 - e.y1) / (e.x2 - e.x1),
    surfaceAt(x, feet, above = 15, below = 40, skip = null) { //the top edge the feet are on, near feet, or null
        let best = null, bestD = Infinity
        for (const e of autopilot.surfaces.get(Math.floor(x / 200)) || []) {
            if (e === skip || x < e.x1 - 0.5 || x > e.x2 + 0.5) continue
            const y = autopilot.edgeY(e, x)
            if (y < feet - above || y > feet + below) continue
            if (Math.abs(y - feet) < bestD) {
                bestD = Math.abs(y - feet)
                best = { edge: e, y }
            }
        }
        return best
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
    standY(node) { //where the feet really are on this spot, a spot that clips a corner or floats above a steep slope is higher than the map under its middle
        if (!autopilot.isLipTakeoff || !autopilot.isOnMap(node)) return node.y
        const under = autopilot.surfaceAt(node.x, node.y, 2, 2 * autopilot.cell)
        return under && under.y > node.y + 4 ? under.y : node.y //floors found by the grid are 0 to 4 below the real surface
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
        const now = autopilot.physics(), was = autopilot.p
        const isChanged = now.blockJumps !== (was.blockJumps || 0) || ["jump", "run", "push", "limit", "gravity", "coyote", "apex"].some(k => Math.abs(now[k] - was[k]) > 0.04 * Math.abs(was[k]))
        if (isChanged) { //simulate every edge again with the new numbers, a little each cycle
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
            if (!who.autopilotDynamic && !who.autopilotElevator && (who.speed > 5 || Math.abs(who.angularVelocity) > 0.06)) { //a block flying or spinning, leave it out until it settles, moving platforms stay in
                if (was) {
                    change(was.cells, -1, was.weight, newBox(), was.isSoft)
                    autopilot.dyn.delete(who)
                }
                continue
            }
            const cells = []
            autopilot.cellsOfBody(who, cells)
            if (was && was.cells.length === cells.length && was.cells.every((c, k) => c === cells[k])) {
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
                    autopilot.tagNode(made)
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

    //*********************************************************************
    // edges
    //*********************************************************************
    addEdge(from, to, type, dir, cost, steer = 0, most = 0, isRun = false, coyote = 0, hit = null, extra = null) { //steer and most are the air control the arc used: push that way while slower than most
        //coyote is how many cycles after running off a ledge the jump is pressed, 0 jumps from the ground
        if (from === to) return
        const edges = autopilot.nodes[from].edges
        const edge = { from, to, type, dir, cost, steer, most, isRun, coyote, fail: 0, hazardPath: hit ? hit.hazardPath : null, travelFrames: hit ? hit.cycles : 0, landingVy: hit ? hit.vy : 0 }
        if (extra) Object.assign(edge, extra) //takeoffX, where on the ground the jump leaves from when it isn't the middle of the node
        if (autopilot.failed.size) edge.fail = autopilot.failed.get(autopilot.edgeKey(edge)) || 0
        const totalCost = e => autopilot.edgeCost(e) + autopilot.retryCost(e)
        for (let i = 0; i < edges.length; i++) {
            const other = edges[i]
            if (other.to === to && other.type === type && (type !== autopilot.JUMP || (other.isRun === isRun && !!other.coyote === !!coyote && !!other.hold === !!edge.hold && other.blockJumps === edge.blockJumps))) {
                if (totalCost(other) > totalCost(edge)) edges[i] = edge
                return
            }
        }
        edges.push(edge)
    },
    walkTo(node, dir) { //the node one column over, level or a step up or down
        const { w, nodeAt } = autopilot.grid
        for (const dy of [0, -1, 1]) {
            const id = nodeAt[node.cx + dir + (node.cy + dy) * w]
            if (id >= 0) return id
        }
        return -1
    },
    linkNode(node, size) {
        const nodes = autopilot.nodes
        const cell = autopilot.cell
        const p = autopilot.p
        if (autopilot.rev.length) autopilot.detachEdges(node) //relinking, not building
        node.edges = []
        const add = (to, type, dir, cost, steer, most, isRun, coyote, hit, extra) => {
            if (type === autopilot.JUMP || type === autopilot.FALL) {
                if (Math.abs(nodes[to].x - node.x) < 37.5 && Math.abs(nodes[to].y - node.y) < 2) return //back where it started, arc() can't tell when it left from below a floating spot
                cost += autopilot.landingRisk(to, Math.sign(nodes[to].x - node.x) || dir) //a marginal landing
            }
            autopilot.addEdge(node.id, to, type, dir, cost, steer, most, isRun, coyote, hit, extra)
        }
        if (node.isBoost) { //standing on it launches
            const boost = node.isBoost
            const speed = 1.21 * Math.sqrt(Math.abs(boost.launchHeight))
            const isUp = boost.angle === Math.PI / 2
            const vx = isUp ? 0 : Math.cos(boost.angle) * speed
            const vy = isUp ? -speed : -Math.sin(boost.angle) * speed
            for (const dir of [-1, 0, 1]) {
                for (const most of dir ? [p.limit, p.limit * 0.5, p.limit * 0.2] : [0]) {
                    const hit = autopilot.arc(node.x, node.y - 2, vx, vy, dir, most, false, size)
                    if (hit) add(hit.node, autopilot.BOOST, dir || Math.sign(nodes[hit.node].x - node.x) || 1, hit.cycles + 10, dir, most, false, 0, hit)
                }
            }
        } else {
            const standY = autopilot.standY(node) //jumps and falls leave from here, the spot itself can float a little above it
            if (autopilot.portals.length) autopilot.linkPortals(node, size, add)
            if (node.elevator) { //ride it to the other end
                const other = node.elevator.autopilotElevator.nodes[1 - node.elevatorLevel].find(n => n.cx === node.cx && !n.dead)
                if (other) add(other.id, autopilot.RIDE, 0, 150 + Math.abs(other.y - node.y) / 4)
            }
            for (const dir of [-1, 1]) {
                //a running jump needs room behind to get up to speed
                let behind = node, isRoom = true
                for (let i = 0; i < autopilot.cellsFor(100) && isRoom; i++) {
                    const id = autopilot.walkTo(behind, -dir)
                    if (id < 0) isRoom = false
                    else behind = nodes[id]
                }
                //where the flat ground this spot is on ends going dir, from the map's vertices, not the grid, jumping off the very top of a corner keeps the most height
                const lip = autopilot.isLipTakeoff && autopilot.isOnMap(node) && !node.isCrouch ? autopilot.lipFor(node.x, node.y, dir) : null
                const lipAhead = lip && !lip.isBehind && (lip.x - node.x) * dir > -2 && (lip.x - node.x) * dir < 1.5 * cell ? lip : null
                const late = lip && lip.isBehind && ((node.x - lip.x) * dir < 80 || standY > node.y) ? 40 : 0 //on the slope past the top, the plan should jump from the top instead
                let beside = autopilot.walkTo(node, dir)
                if (beside >= 0 && autopilot.winds.length) { //walking into a wind stronger than the player's legs doesn't get anywhere
                    const w = autopilot.windAt(node.x, node.y, true)
                    if (w) { //a float wind lifts the player off the ground, so it's the air push against all of the wind
                        const push = w.isFloat ? 2 * w.ax : w.ax
                        const legs = w.isFloat ? autopilot.p.push : 1.5 * m.Fx / player.mass * simulation.delta * simulation.delta
                        if (push * dir < 0 && Math.abs(push) > 0.8 * legs) beside = -1
                    }
                }
                //standing in a block it can push, the block goes along ahead of the player, off the ledge too, so walking off it doesn't hit the block
                const isPushing = node.cover > 0 && node.cover < 3000 && autopilot.grid.fixed
                const hard = autopilot.grid.hard
                if (isPushing) autopilot.grid.hard = autopilot.grid.fixed
                try {
                    if (beside >= 0) {
                        add(beside, autopilot.WALK, dir, (node.isCrouch || nodes[beside].isCrouch ? 3 : 1) * cell / p.run)
                    } else if (!autopilot.isBoxSolid(node.x + dir * cell - size.halfWidth + 3, node.y - size.height + 3, node.x + dir * cell + size.halfWidth - 3, Math.min(node.y - 14, autopilot.grid.y0 + (node.cy + 1) * cell - 1))) { //above the floor's cell row, which can stick up past the real floor, the slanted foot rides over the last bit
                        //a ledge, walk off it fast, slow, or turning back under it, the foot leaves the ground a little past the corner
                        const edgeLip = lipAhead || (lip && lip.isBehind && (node.x - lip.x) * dir < cell ? lip : null) //a spot just past the corner leaves the ground at the corner
                        const x = edgeLip ? edgeLip.x + dir * 16 : node.x + dir * (cell / 2 + 14)
                        const y = edgeLip ? edgeLip.y : standY
                        for (const [vx, steer, most] of [[p.run, dir, p.limit], [3, 0, 0], [3, -dir, p.limit], [3, -dir, p.limit * 0.4]]) {
                            const hit = autopilot.arc(x, y, dir * vx, 0, steer, most, false, size)
                            if (hit) add(hit.node, autopilot.FALL, dir, hit.cycles + 8, steer, most, false, 0, hit)
                        }
                        if (isRoom && !node.isCrouch) { //run off the edge and jump a few cycles later, in coyote time, it reaches farther than jumping from the last spot on the ledge
                            const coyote = Math.min(m.coyoteCycles, 8) - 3 //a few cycles to spare, longer coyote time is flying, see findFlight()
                            let cx = x, cy = y, fall = 0
                            for (let i = 0; i < coyote; i++) {
                                fall += p.gravity
                                cx += dir * p.run
                                cy += fall
                            }
                            if (!autopilot.isBoxSolid(cx - size.halfWidth + 1, cy - size.height + 2, cx + size.halfWidth - 1, cy - 2)) {
                                const hit = autopilot.arc(cx, cy, dir * p.run, -p.jump, dir, p.limit, true, size)
                                if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + coyote + 35 + late, dir, p.limit, true, coyote, hit, edgeLip ? { takeoffX: edgeLip.x } : null) //15 of it is the run-up
                            }
                        }
                    }
                } finally {
                    autopilot.grid.hard = hard
                }
                if (node.isCrouch) continue
                //jumps from standing, pushing with different limits on speed
                for (const most of [p.limit, p.limit * 0.6, p.limit * 0.3, p.limit * 0.12]) {
                    const hit = autopilot.arc(node.x, standY, 0, -p.jump, dir, most, true, size)
                    if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + late, dir, most, false, 0, hit)
                }
                //with the map overhead, short hops under a ledge that hangs over where it lands, and jumps that go straight up first, past a ledge overhead, then over onto it
                if (autopilot.jumpHasCeiling(node.x, standY, dir)) {
                    for (const hold of [8, 11, 14, 17, 20]) {
                        const hit = autopilot.arc(node.x, standY, 0, -p.jump, dir, p.limit, true, size, 0, true, hold) //precise moves, they have to land with the flat of the foot
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + late, dir, p.limit, false, 0, hit, { hold })
                    }
                    if (!autopilot.rev.length) { //delayed steering is more expensive, keep it on the initial build
                        const hit = autopilot.arc(node.x, standY, 0, -p.jump, dir, p.limit, true, size, 12, true)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + late, dir, p.limit, false, 0, hit, { delay: 12 })
                    }
                }
                if (isRoom) {
                    const hit = autopilot.arc(node.x, standY, dir * p.run, -p.jump, dir, p.limit, true, size)
                    if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 35 + late, dir, p.limit, true, 0, hit) //15 of it is the run-up
                }
                if (lipAhead) { //the same jumps from the top of the corner, 3 before it, at its real height
                    const sx = lipAhead.x - dir * 3, walk = Math.abs(sx - node.x) / p.run
                    for (const most of [p.limit, p.limit * 0.6, p.limit * 0.3]) {
                        const hit = autopilot.arc(sx, lipAhead.y, 0, -p.jump, dir, most, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + walk, dir, most, false, 0, hit, { takeoffX: sx })
                    }
                    if (isRoom) {
                        const hit = autopilot.arc(sx, lipAhead.y, dir * p.run, -p.jump, dir, p.limit, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 35 + walk, dir, p.limit, true, 0, hit, { takeoffX: sx })
                    }
                }
            }
        }
        if (!node.isBoost && !node.isCrouch && p.blockJumps && p.coyote <= 40) {
            const standY = autopilot.standY(node)
            for (const [steer, most] of [[0, 0], [-1, p.limit * 0.6], [1, p.limit * 0.6], [-1, p.limit], [1, p.limit]]) {
                const hit = autopilot.arc(node.x, standY, 0, -p.jump, steer, most, true, size, 0, true, Infinity, p.blockJumps)
                if (hit) add(hit.node, autopilot.JUMP, steer || Math.sign(nodes[hit.node].x - node.x) || 1, hit.cycles + 28, steer, most, false, 0, hit, { blockJumps: p.blockJumps })
            }
        }
        if (autopilot.rev.length) autopilot.attachEdges(node)
    },
    detachEdges(node) { //take its edges out of the lists of edges arriving at each node
        for (const edge of node.edges) {
            const list = autopilot.rev[edge.to]
            const index = list ? list.indexOf(edge) : -1
            if (index !== -1) {
                list[index] = list[list.length - 1]
                list.pop()
            }
        }
        node.edges = []
    },
    attachEdges(node) {
        for (const edge of node.edges) (autopilot.rev[edge.to] = autopilot.rev[edge.to] || []).push(edge)
    },
    edgeKey(edge) {
        const from = autopilot.nodes[edge.from], to = autopilot.nodes[edge.to]
        return `${from.cx},${from.cy},${to.cx},${to.cy},${edge.type},${edge.dir},${edge.steer || 0},${(edge.most || 0).toFixed(3)},${edge.isRun ? 1 : 0},${edge.coyote || 0},${edge.delay || 0},${edge.hold || 0},${edge.blockJumps || 0}`
    },
    sameManeuver(a, b) {
        if (a.type !== b.type || a.dir !== b.dir) return false
        //Keep distinct takeoffs available, even when they go to the same platform.
        if (!!a.isRun !== !!b.isRun || !!a.coyote !== !!b.coyote || !!a.hold !== !!b.hold || !!a.delay !== !!b.delay || a.blockJumps !== b.blockJumps) return false
        const from = autopilot.nodes[a.from], otherFrom = autopilot.nodes[b.from]
        const to = autopilot.nodes[a.to], otherTo = autopilot.nodes[b.to]
        return Math.abs(from.x - otherFrom.x) <= 50 && Math.abs(from.y - otherFrom.y) <= 25 &&
            Math.abs(to.x - otherTo.x) <= 75 && Math.abs(to.y - otherTo.y) <= 30
    },
    retryCost(edge) {
        const cycle = simulation.cycle
        for (const attempt of autopilot.recentFailures) {
            if (cycle < attempt.until && autopilot.sameManeuver(edge, attempt.edge)) return 360
        }
        return 0
    },
    addFail(edge, count = 1) {
        const key = autopilot.edgeKey(edge)
        edge.fail = Math.max(edge.fail || 0, autopilot.failed.get(key) || 0) + count
        autopilot.failed.set(key, edge.fail)
        //A shortcut can have its own edge object. Update the graph's copy too.
        for (const other of autopilot.nodes[edge.from].edges) {
            if (other !== edge && autopilot.edgeKey(other) === key) other.fail = edge.fail
        }
        const recent = autopilot.recentFailures.filter(attempt => simulation.cycle < attempt.until && !autopilot.sameManeuver(edge, attempt.edge))
        recent.push({ edge, until: simulation.cycle + 300 })
        autopilot.recentFailures = recent.slice(-8)
        autopilot.commit = autopilot.backUp = null
        autopilot.window.key = ""
        autopilot.routes.cycle = -1
        autopilot.isPlanDirty = true
        autopilot.lastPlanCycle = -Infinity //failures should replan before the next attempt
    },
    footOff(x, top) { //the player's flat foot is 10 wide, 5 past a corner it slides off, null if it stands here, or { x, side } the corner and which way it slides
        const scale = player.scale || 1
        const flat = 4 * scale, foot = 14 * scale
        const at = dx => autopilot.surfaceAt(x + dx, top, 4, 28) //the map's real surface, the grid's top can be most of a cell above it
        if (at(0) || at(-flat) || at(flat)) return null
        for (const reach of [foot, foot + autopilot.cell]) { //the slanted foot, then a whole grid cell past it, the grid rounds a ledge's end out to its cells
            const left = at(-reach), right = at(reach)
            if (left) return { x: left.edge.x2, side: 1 } //ground under the left of the foot, it slides off to the right
            if (right) return { x: right.edge.x1, side: -1 }
        }
        return null //no map surface here at all, a block or something moving, the grid knows best
    },
    slideTo(x, top) { //the closest spot to stand below a slope, or -1
        const nodes = autopilot.nodes
        let best = -1, bestD = Infinity
        for (let k = 0; k <= 12; k++) { //out to 150 to either side, a slope runs out that far from where it was hit
            const dx = (k % 2 ? -1 : 1) * Math.ceil(k / 2) * 25
            const node = autopilot.nodeBelow(x + dx, top)
            if (node < 0 || nodes[node].y - top > 400) continue
            const d = Math.abs(dx) + (nodes[node].y - top) * 0.5
            if (d < bestD) {
                bestD = d
                best = node
            }
        }
        return best
    },
    portalEnds() { //the two map pieces behind each portal pair, each has portal (the sensor), unit (out of it), exit, and portalPair
        const ends = []
        for (const pair of autopilot.portals) if (pair[2] && pair[3] && pair[2].portal) ends.push(pair[2], pair[3])
        return ends
    },
    throughPortal(end, vx, vy) { //where and how fast the player comes out after going into end, like level.portal()'s query()
        const to = end.portalPair
        //the game puts the player behind the face and their speed carries them out, the grid has the hole behind it as solid, so start just outside the face
        const center = Vector.add(to.portal.position, Vector.mult(to.unit, 28 * Math.abs(to.unit.x) + 70 * Math.abs(to.unit.y)))
        const v = level.portalExitVelocity({ x: vx, y: vy }, end, to)
        return { x: center.x, feet: center.y + 73, vx: v.x, vy: v.y }
    },
    linkPortals(node, size, add) { //walk straight into a portal beside this spot, then land wherever it throws the player
        const p = autopilot.p
        for (const end of autopilot.portalEnds()) {
            const b = end.portal.bounds
            const middle = (b.min.x + b.max.x) / 2
            const dir = Math.sign(middle - node.x)
            if (!dir || Math.abs(middle - node.x) > 300 || Math.sign(end.unit.x) !== -dir) continue //it has to face this spot, and walking in goes against the way it faces
            if (node.y < b.min.y + 20 || node.y - size.height > b.max.y - 20) continue //the player's body would touch it
            const face = dir > 0 ? b.min.x : b.max.x
            if (autopilot.isBoxSolid(Math.min(node.x, face) - size.halfWidth + 3, node.y - size.height + 3, Math.max(node.x, face) + size.halfWidth - 3, node.y - 35)) continue //a wall on the way, steps lower than 35 are climbed
            const out = autopilot.throughPortal(end, dir * p.run, 0)
            const lastExit = end.portalPair
            for (const steer of [-1, 0, 1]) {
                for (const most of steer ? [p.limit, p.limit * 0.4] : [0]) {
                    const portals = autopilot.portals
                    autopilot.portals = portals.filter(pair => pair[2] !== lastExit && pair[3] !== lastExit) //not straight back into the end it comes out of
                    const hit = autopilot.arc(out.x, out.feet, out.vx, out.vy, steer, most, false, size)
                    autopilot.portals = portals
                    if (hit) add(hit.node, autopilot.PORTAL, dir, Math.abs(face - node.x) / p.run + hit.cycles + 5, steer, most, false, 0, hit)
                }
            }
        }
    },
    rebuildRev() {
        const nodes = autopilot.nodes
        autopilot.rev = nodes.map(() => [])
        for (const node of nodes) {
            if (!node.dead) autopilot.attachEdges(node)
        }
    },
    arc(x, y, vx, vy, steer, most, isJump, size, delay = 0, isStrict = false, hold = Infinity, blockJumps = 0) { //hold: cycles jump is held, a short hop lets go early //fly the player's box through the grid, returns { node, cycles } where it lands, steer pushes that way up to speed most, after delay cycles
        //isStrict: catching a ledge's corner with the slanted side of the foot slides off it, for steering a flight, planning keeps those landings, steering in the air fixes them
        const g = autopilot.grid
        const p = autopilot.p
        const bottom = g.y0 + g.h * autopilot.cell
        const { halfWidth, height, foot } = size
        const startX = x, startY = y
        let apexY = y
        const zones = autopilot.jumpZones.length ? autopilot.jumpZones.filter(autopilot.jumpZoneActive) : autopilot.jumpZones
        const air = { ax: 0, ay: 0, vx: 0, vy: 0 }
        const drag = 1 - (player.frictionAir ?? 0.001)
        const boxSolid = isStrict ? autopilot.isBoxSolidExact : autopilot.isBoxSolid //steering a flight, the map's real shape, the grid rounds a ledge out to whole cells
        let vxBefore = vx //the speed a cycle ago, what the push this cycle was decided on
        let lastJump = 1, blockJumpArmed = false
        const firstPush = isJump && steer && !delay && vx * steer < most ? steer * p.push * m.airTurnFx : 0 //the jump's own cycle pushes harder, the feet are still on the ground
        const hazards = autopilot.hazards.filter(h => h.isOn !== false && h.height > 0)
        const hazardPath = autopilot.hazards.length ? [] : null
        let box = null
        const trace = () => {
            if (!hazardPath) return
            if (!box) { box = [x - halfWidth, y - height, x + halfWidth, y]; hazardPath.push(box) }
            else { box[0] = Math.min(box[0], x - halfWidth); box[1] = Math.min(box[1], y - height); box[2] = Math.max(box[2], x + halfWidth); box[3] = Math.max(box[3], y) }
        }
        let isWet = false //went through slime or another hazard on the way
        const ends = autopilot.portalEnds()
        let lastExit = null, isPortal = false
        const wrap = level.fallMode === "position" || level.fallMode === "start" //falling out the bottom of the level comes back in from the sky, see simulation.js
        let wraps = 0 //each fall through drifts the player about 850 to the side, getting across a level can take a few
        for (let cycle = 1; cycle < (wrap ? 2400 : 260); cycle++) {
            trace()
            if (cycle % 4 === 0) { box = null; trace() }
            if (y > bottom) { //below the level, nothing to hit until it falls far enough to wrap to the sky
                if (!wrap || wraps >= 8 || (level.fallMode === "start" && wraps)) return null
                vy = vy * 0.999 + p.gravity
                if (vy > 70) vy *= 0.99 //the game slows a long fall
                if (steer && vx * steer < most) vx += steer * p.push
                x += vx
                y += vy
                if (y - 120 > simulation.fallHeight) { //m.pos is about 120 above the feet
                    if (level.fallMode === "position") {
                        x = Math.min(Math.max(level.fallModeBounds.left, x), level.fallModeBounds.right)
                        y = level.enter.y - 6000 + 73
                    } else {
                        x = level.enter.x
                        y = level.enter.y - 3000 + 73
                        vx = 0
                    }
                    box = null //wrapping is teleportation, not a sweep through the level
                    wraps++
                }
                continue
            }
            if (hazards.length && !isWet && cycle % 2 === 0) {
                for (const h of hazards) if (x > h.min.x - halfWidth && x < h.max.x + halfWidth && y > h.min.y && y - height < h.max.y) isWet = true
            }
            for (const end of ends) { //going into a portal comes out the other end, see level.portal()
                if (end === lastExit) continue //coming out of this one, the game skips it until the player is clear of it
                const b = end.portal.bounds
                if (x + halfWidth < b.min.x || x - halfWidth > b.max.x || y < b.min.y || y - height > b.max.y) continue
                const out = autopilot.throughPortal(end, vx, vy)
                box = null //do not count the space between portals as traveled
                x = out.x
                y = out.feet
                vx = out.vx
                vy = out.vy
                lastExit = end.portalPair
                isPortal = true
                break
            }
            //velocity, holding jump hangs at the top, see m.airControl()
            //The takeoff impulse is applied on the first step. Air control starts after that step.
            const jumpAge = cycle - lastJump
            const release = blockJumps && !blockJumpArmed && jumpAge > 10 && vy >= -1.5
            const isBlockJump = blockJumps && blockJumpArmed && jumpAge > 10
            const isHeld = isJump && !release && jumpAge < Math.min(60, hold)
            if (isJump && !isHeld && jumpAge < 60 && vy < 0) vy *= m.shortJumpDamp //let go of jump early, it cuts the rise short, see m.airControl()
            const isApex = cycle > 1 && isHeld && Math.abs(vy) < m.apexSpeed
            //Air control and level effects set the forces for the next physics step.
            const push = cycle === 1 ? firstPush : steer && cycle - 1 > delay && vxBefore * steer < most && vx * steer < p.limit ? steer * p.push * (vx * steer < 0 ? m.airTurnFx : 1) : 0
            vxBefore = vx
            air.ax = push
            const impulse = isJump && (cycle === 1 || isBlockJump) ? -p.jump : 0
            air.ay = p.gravity * (isApex ? m.apexGravity : 1)
            air.vx = vx
            air.vy = vy - (cycle === 1 ? impulse : 0)
            if (zones.length) {
                //The jump impulse is a force, so slime drag acts on the inherited speed, not the impulse.
                autopilot.jumpZoneStep(zones, x, y, vx, air.vy, size, p.gravity, air)
            }
            if (autopilot.winds.length) {
                const w = autopilot.windAt(x, y, isJump && cycle === 1)
                if (w) {
                    air.ax += w.ax
                    air.ay += w.ay - (w.isFloat ? 1.05 * p.gravity : 0)
                    if (air.vx * air.vx + air.vy * air.vy > 900) {
                        air.vx *= 0.97
                        air.vy *= 0.97
                    }
                }
            }
            if (release) blockJumpArmed = true
            if (isBlockJump) {
                air.vy = -7.5 + 0.25 * air.vy
                if (steer && vx * steer < most) air.vx += 8 * steer
                lastJump = cycle
                blockJumps--
            }
            vx = air.vx * drag + air.ax
            vy = air.vy * drag + air.ay + impulse
            //sideways, the bottom of the player is slanted and rides over low corners
            if (vx !== 0) {
                const dir = vx > 0 ? 1 : -1
                const nx = x + vx
                if (boxSolid(nx - halfWidth + 1, y - height + 2, nx + halfWidth - 1, y - 14)) {
                    const ahead = nx + dir * (halfWidth + 2)
                    if (vy <= 8 && steer === dir && autopilot.isSolidAt(ahead, y - 12) && !autopilot.isSolidAt(ahead, y - m.ledgeStep - 2)) vy = Math.min(vy, -m.ledgeClimbSpeed) //ledge assist
                    vx = 0
                } else x = nx
            }
            //up and down
            if (vy < 0) {
                if (boxSolid(x - halfWidth + 6, y - height + vy, x + halfWidth - 6, y - height + 2)) vy = 0
                else y += vy
            } else {
                const top = autopilot.surfaceY(x - foot, x + foot, y, y + vy + 1)
                const edge = isStrict && Number.isFinite(top) && !g.geometry && autopilot.isLipTakeoff ? autopilot.footOff(x, top) : null
                if (edge) { //only the slanted side of the foot caught a corner, the player slides off it and keeps falling
                    x = edge.side > 0 ? Math.max(x, edge.x + foot + 1) : Math.min(x, edge.x - foot - 1)
                } else if (Number.isFinite(top)) { //the first real surface crossed this frame, however many grid rows that spans
                    let node = autopilot.nodeNear(x, top, 0, 0)
                    if (node < 0) node = autopilot.nodeNear(x, top, 1, g.geometry ? 1 : 0)
                    if (node < 0) node = autopilot.slideTo(x, top)
                    if (node >= 0 && isStrict && Math.abs(autopilot.nodes[node].x - x) > 60) node = -1 //a narrow top with no spot of its own, not a slope down to one far off
                    if (node < 0) return null
                    const to = autopilot.nodes[node]
                    if (to.isCrouch) return null
                    if (Math.abs(to.x - startX) < 37.5 && Math.abs(to.y - startY) < 2) return null
                    y = top
                    trace()
                    isWet = isWet || autopilot.pathIsWet(hazardPath, hazards)
                    return { node, cycles: cycle, isWet, isPortal, hazardPath, x, y: top, vx, vy, apexY }
                }
                if (!g.geometry && boxSolid(x - foot, y, x + foot, y + vy + 1)) return null
                y += vy
            }
            apexY = Math.min(apexY, y)
            if (y > bottom && !wrap) return null
        }
        return null
    },

    //*********************************************************************
    // planning, a shortest path search backward from the goal
    //*********************************************************************
    pathIsWet(path, hazards = autopilot.hazards) {
        if (!path) return false
        return hazards.some(h => h.isOn !== false && h.height > 0 && path.some(b => b[2] > h.min.x && b[0] < h.max.x && b[3] > h.min.y && b[1] < h.max.y))
    },
    refreshHazards() { //per-hazard values, so two moving hazards cannot cancel each other's change
        const signature = autopilot.hazards.map(h => [h.isOn !== false, h.min.x, h.min.y, h.max.x, h.max.y, h.height].join(",")).join(";")
        if (signature === autopilot.hazardSignature) return
        autopilot.hazardSignature = signature
        autopilot.hazardRevision++
        autopilot.flyStamp = autopilot.flyStamp % 65000 + 1
        autopilot.lastHeavyMove = simulation.cycle
        autopilot.isPlanDirty = true
    },
    hazardRevision: 0,
    refreshJumpZones() {
        for (const z of autopilot.jumpZones) {
            const active = autopilot.jumpZoneActive(z)
            if (!active && !z.lastBounds) continue
            const b = z.bounds
            const left = b.radius !== undefined ? b.x - b.radius : b.min.x
            const right = b.radius !== undefined ? b.x + b.radius : b.max.x
            const top = b.radius !== undefined ? b.y - b.radius : b.min.y
            const bottom = b.radius !== undefined ? b.y + b.radius : b.max.y
            const signature = active ? [left, right, top, bottom].map(value => Math.floor(value / autopilot.cell)).join(",") + ":" + z.zone.gravity : ""
            if (z.signature === signature) continue
            z.signature = signature
            const previous = z.lastBounds
            z.lastBounds = active ? { left, right, top, bottom } : null
            const nearby = (n, bounds) => bounds && n.x >= bounds.left - 650 && n.x <= bounds.right + 650 && n.y >= bounds.top - 1200 && n.y <= bounds.bottom + 500
            for (const n of autopilot.nodes) {
                if (!n.dead && (nearby(n, z.lastBounds) || nearby(n, previous))) autopilot.relink.add(n.id)
            }
        }
    },
    platformForecast(who, frames) { //predict only known elevator rules; never extend unknown motion through an unseen reversal
        const e = who.autopilotElevator
        const now = { x: who.position.x, y: e ? who.position.y - e.height / 2 : who.bounds.min.y, vy: who.velocity.y, reliable: false }
        if (!e || e.mode === "unknown" || simulation.cycle - e.commandCycle > 2 || who.constraint) return now
        if (m.isTimeDilated) return { ...now, vy: 0, reliable: true }
        let y = now.y, vy = now.vy, up = !!who.isUp, drag = who.frictionAir
        const dt2 = simulation.delta * simulation.delta
        let acceleration = simulation.g + who.force.y / who.mass
        for (let i = 0; i < Math.min(240, Math.max(0, Math.ceil(frames))); i++) {
            //The game integrates last frame's force before calling the platform's movement method.
            vy = vy * (1 - drag) + acceleration * dt2
            y += vy
            acceleration = simulation.g
            if (up) {
                const left = y - e.top
                const brake = e.isSmoothStop ? Math.min(left, Math.sqrt(1.2 * simulation.g * dt2 * Math.max(0, left))) : Infinity
                if (-vy >= brake) { acceleration = 0; vy = -brake }
                else acceleration -= e.force + simulation.g
                if (y < e.top || (e.isSmoothStop && left < 1)) { up = false; drag = e.friction.down; y = e.top; vy = 0 }
            } else if (y + 10 * vy > e.bottom) {
                vy *= 0.7
                if (e.mode === "move" && e.enabled && y + vy > e.bottom) { up = true; drag = e.friction.up }
            }
            if (y < e.top) y = e.top
            else if (y > e.bottom) {
                y = e.bottom
                if (e.mode === "moveOnTouch" || !e.enabled) acceleration -= simulation.g
            }
        }
        return { x: who.holdX, y, vy, reliable: frames <= 240 }
    },
    elevatorDrop(who, edge, feet) { //try the planned exit from the lift's real height, even if its nominal stop is out of reach
        const { nodes, dist, p } = autopilot
        //The plan may still say to ride to a stop or walk across the deck before leaving.
        let exit = edge
        for (let i = 0; exit && nodes[exit.to].elevator === who && i < 32; i++) exit = autopilot.next[exit.to]
        if (!exit || !dist || !Number.isFinite(dist[exit.to])) return null
        const to = nodes[exit.to]
        const dir = Math.sign(to.x - who.holdX)
        if (!dir || to.elevator || to.y < feet - 10) return null
        const size = autopilot.size()
        const x = player.position.x
        const lip = who.holdX + dir * who.autopilotElevator.width / 2
        const start = lip + dir * (size.foot + 2)
        //Use the standing body's path across the deck and off the edge. Leave headroom for a moving lift.
        const near = Math.min(x, start), far = Math.max(x, start)
        if (autopilot.isBoxSolidExact(near - size.halfWidth + 3, feet - size.height - 8, far + size.halfWidth - 3, feet - 14)) return null
        let best = null, bestCost = Infinity
        for (const speed of [p.run, Math.min(3, p.run)]) {
            const hit = autopilot.arc(start, feet, dir * speed, who.velocity.y, dir, p.limit, false, size, 0, true)
            if (!hit || hit.isWet || hit.isPortal) continue
            const land = nodes[hit.node]
            if (land.dead || !land.isStatic || land.isBoost || land.elevator || land.cover >= 3000 || land.y < feet - 10 || land.y - feet > 400) continue
            if (dist[land.id] > dist[exit.to] + 30 || !Number.isFinite(dist[land.id])) continue
            if (tech.isFallingDamage && hit.vy * player.mass > 150) continue
            const drop = { from: edge.from, to: land.id, type: autopilot.FALL, dir, steer: dir, most: p.limit, cost: hit.cycles, fail: 0 }
            if (autopilot.retryCost(drop)) continue
            const cost = hit.cycles + dist[land.id]
            if (cost < bestCost) {
                best = drop
                bestCost = cost
            }
        }
        return best
    },
    boardingReady(edge, x) {
        const to = autopilot.nodes[edge.to], who = to.elevator
        if (!who) return true
        if (!autopilot.elevatorEnabled(who)) return false
        const frames = edge.travelFrames || Math.abs(to.x - x) / Math.max(1, autopilot.p.run) + 6
        const prediction = autopilot.platformForecast(who, frames)
        if (!prediction.reliable) return Math.abs(prediction.y - to.y) < 25 && Math.abs(who.velocity.y) < 0.5
        //A descending player must meet a platform that is actually present at the predicted landing time.
        return Math.abs(prediction.y - to.y) < 30 && (!edge.landingVy || edge.landingVy > prediction.vy)
    },
    edgeCost(edge) {
        const to = autopilot.nodes[edge.to]
        if (edge.blockJumps && (edge.blockJumps > autopilot.p.blockJumps || autopilot.p.coyote > 40)) return Infinity
        let cost = edge.cost * (1 + 6 * edge.fail) + 120 * edge.fail + to.cover
        if (edge.hazardRevision !== autopilot.hazardRevision) {
            edge.hazardRevision = autopilot.hazardRevision
            edge.hazardCost = autopilot.pathIsWet(edge.hazardPath) ? 1500 : 0
        }
        cost += edge.hazardCost
        if (autopilot.hazards.length) {
            for (const hazard of autopilot.hazards) {
                if (hazard.isOn !== false && hazard.height > 0 && to.x > hazard.min.x - 20 && to.x < hazard.max.x + 20 && to.y > hazard.min.y && to.y - 100 < hazard.max.y) cost += 1500
            }
        }
        return cost
    },
    plan() {
        const nodes = autopilot.nodes
        const count = nodes.length
        const clearExit = autopilot.goalType === "exit" && autopilot.triggers.length && !autopilot.isExitBlocked(autopilot.goal)
        const dist = autopilot.dist = new Float64Array(count).fill(Infinity)
        const next = autopilot.next = new Array(count).fill(null)
        autopilot.isPlanDirty = false
        autopilot.lastPlanCycle = simulation.cycle
        if (autopilot.goal < 0 || nodes[autopilot.goal].dead) return
        //binary heap of [distance, node]
        const heapD = [0], heapN = [autopilot.goal]
        dist[autopilot.goal] = 0
        const push = (d, n) => {
            let i = heapD.length
            heapD.push(d)
            heapN.push(n)
            while (i > 0) {
                const parent = (i - 1) >> 1
                if (heapD[parent] <= d) break
                heapD[i] = heapD[parent]
                heapN[i] = heapN[parent]
                i = parent
            }
            heapD[i] = d
            heapN[i] = n
        }
        const pop = () => {
            const lastD = heapD.pop(), lastN = heapN.pop()
            const length = heapD.length
            if (length === 0) return
            let i = 0
            for (; ;) {
                let child = 2 * i + 1
                if (child >= length) break
                if (child + 1 < length && heapD[child + 1] < heapD[child]) child++
                if (heapD[child] >= lastD) break
                heapD[i] = heapD[child]
                heapN[i] = heapN[child]
                i = child
            }
            heapD[i] = lastD
            heapN[i] = lastN
        }
        while (heapD.length) {
            const d = heapD[0], n = heapN[0]
            pop()
            if (d > dist[n]) continue
            const arriving = autopilot.rev[n]
            if (!arriving) continue
            for (let i = 0; i < arriving.length; i++) {
                const edge = arriving[i]
                if (nodes[edge.from].dead || (clearExit && autopilot.exitEdgeBlocked(edge))) continue
                const total = d + autopilot.edgeCost(edge) + autopilot.retryCost(edge)
                if (total < dist[edge.from]) {
                    dist[edge.from] = total
                    next[edge.from] = edge
                    push(total, edge.from)
                }
            }
        }
    },
    pathFrom(start, prev = null) { //distances from one node to every other, to pick the closest thing to go for, prev gets the edge that reached each node
        const nodes = autopilot.nodes
        const dist = new Float64Array(nodes.length).fill(Infinity)
        if (start < 0) return dist
        dist[start] = 0
        const queue = [start] //the graph is small, a simple relaxing queue is enough
        for (let head = 0; head < queue.length; head++) {
            const n = queue[head]
            const edges = nodes[n].edges
            for (let i = 0; i < edges.length; i++) {
                const total = dist[n] + autopilot.edgeCost(edges[i]) + autopilot.retryCost(edges[i])
                if (total < dist[edges[i].to] - 0.5) {
                    dist[edges[i].to] = total
                    if (prev) prev[edges[i].to] = edges[i]
                    queue.push(edges[i].to)
                }
            }
        }
        return dist
    },
    routes: { cycle: -1, start: -1, count: 0, from: null, prev: null }, //pathFrom() with the edge that reached each node, kept for the rest of the cycle
    routesFrom(start) {
        const r = autopilot.routes
        if (r.cycle !== simulation.cycle || r.start !== start || r.count !== autopilot.nodes.length) {
            r.prev = []
            r.from = autopilot.pathFrom(start, r.prev)
            r.cycle = simulation.cycle
            r.start = start
            r.count = autopilot.nodes.length
        }
        return r
    },
    isBehindDoor(goal) { //the best way from here to goal goes through a closed door, or a platform in the way, that can't be pushed
        const cur = autopilot.cur
        if (cur < 0) return false
        const { prev } = autopilot.routesFrom(cur)
        for (let at = goal, i = 0; at !== cur && prev[at] && i < 4000; i++) {
            if (autopilot.nodes[at].cover >= 3000 && autopilot.isDoorIn(autopilot.nodes[at])) return true
            at = prev[at].from
        }
        return false
    },
    isDoorIn(node) { //something that can't be pushed really overlaps the player standing at node, the grid's cover rounds it out to whole cells, so a spot beside a door has it too
        const size = autopilot.size()
        const box = { min: { x: node.x - size.halfWidth + 3, y: node.y - (node.isCrouch ? size.crouchHeight : size.height) + 3 }, max: { x: node.x + size.halfWidth - 3, y: node.y - 3 } }
        for (const who of autopilot.dynList) {
            if (autopilot.obstacleWeight(who) >= 3000 && Matter.Query.region([who], box).length) return true
        }
        return false
    },
    nodeFor(where, reach = 8) { //a node to stand at to get to a point, under it or beside it
        let node = autopilot.nodeNear(where.x, where.y + 20, 2, 3)
        if (node < 0) node = autopilot.nodeBelow(where.x, where.y, 1)
        if (node >= 0 && autopilot.nodes[node].y - where.y > reach * 25) node = -1
        return node
    },
    exitNode() {
        return autopilot.nodeNear(level.exit.x + 50, level.exit.y, 2, 3)
    },
    isExplore: true, //when the exit is blocked and no button is left to try, wander to places it hasn't been, leaning toward the exit
    explored: [], //{ x, y } spots it explored, so it goes somewhere new next time
    lostSince: 0, //when the exit was blocked and it ran out of buttons, or last got closer to it
    lostBest: Infinity, //the closest it got to the blocked exit, by route cost
    chooseExplore(exit) { //a spot it can get to, close to the exit, that it hasn't explored, or -1 if the exit can be reached or nothing is left
        const cur = autopilot.cur
        if (cur < 0 || autopilot.relink.size) return autopilot.goalType === "explore" ? autopilot.goal : -1
        if (!autopilot.isExitBlocked(exit)) { //found a way
            autopilot.lostSince = 0
            return -1
        }
        const from = autopilot.routesFrom(cur).from
        const left = exit >= 0 ? from[exit] : Infinity //what's left to the exit, through the door or hazard
        if (!autopilot.lostSince) autopilot.lostBest = Infinity
        if (left < autopilot.lostBest - 50 && autopilot.goalType !== "explore") { //still getting closer, the wait starts once it's as close as it gets
            autopilot.lostBest = left
            autopilot.lostSince = simulation.cycle
        }
        if (!autopilot.lostSince) autopilot.lostSince = simulation.cycle
        const wait = left < Infinity ? 900 : 90 //at a closed door or hazard, wait there a while, they often open on their own, with no way at all just give moving platforms a moment
        if (simulation.cycle < autopilot.lostSince + wait) return -1
        const nodes = autopilot.nodes
        if (autopilot.goalType === "explore" && autopilot.goal >= 0) { //keep going there until it arrives or it takes too long
            const isThere = cur === autopilot.goal || Math.hypot(nodes[cur].x - nodes[autopilot.goal].x, nodes[cur].y - nodes[autopilot.goal].y) < 60
            if (!isThere && from[autopilot.goal] < Infinity && simulation.cycle < autopilot.goalSince + 900) return autopilot.goal
            autopilot.explored.push({ x: nodes[autopilot.goal].x, y: nodes[autopilot.goal].y })
        }
        const target = exit >= 0 ? nodes[exit] : { x: level.exit.x + 50, y: level.exit.y }
        let best = -1, bestScore = Infinity
        for (let i = 0; i < nodes.length; i++) {
            if (!(from[i] < Infinity) || nodes[i].dead || i === cur) continue
            const n = nodes[i]
            if (autopilot.explored.some(e => Math.abs(e.x - n.x) < 250 && Math.abs(e.y - n.y) < 250)) continue
            const score = Math.hypot(n.x - target.x, n.y - target.y) + 0.5 * from[i] + 600 * Math.random() //near the exit, not too far to go, and some of the time somewhere else
            if (score < bestScore) {
                bestScore = score
                best = i
            }
        }
        if (best < 0) {
            autopilot.explored.length = 0 //been everywhere it can get to, start over, things may have moved
            autopilot.say("stuck", "explored everywhere it can reach")
        }
        return best
    },
    exitEdgeBlocked(edge) {
        const to = autopilot.nodes[edge.to]
        if (edge.blockJumps && (edge.blockJumps > autopilot.p.blockJumps || autopilot.p.coyote > 40)) return true
        if (to.cover >= 3000 && autopilot.isDoorIn(to)) return true
        if (simulation.cycle < autopilot.elevatorStuckUntil && (edge.type === autopilot.RIDE || to.elevator)) return true
        return autopilot.hazards.length > 0 && autopilot.edgeCost(edge) - edge.cost * (1 + 6 * edge.fail) - 120 * edge.fail - to.cover >= 1000
    },
    isExitBlocked(exit) { //look for any open route, including a detour around a closed door
        const cur = autopilot.cur
        const nodes = autopilot.nodes
        if (exit < 0 || !nodes[cur] || nodes[cur].dead) return true
        const queue = [cur]
        const seen = new Uint8Array(nodes.length)
        seen[cur] = 1
        for (let i = 0; i < queue.length; i++) {
            const at = queue[i]
            if (at === exit) return false
            for (const edge of nodes[at].edges) {
                if (seen[edge.to] || nodes[edge.to].dead || autopilot.exitEdgeBlocked(edge)) continue
                seen[edge.to] = 1
                queue.push(edge.to)
            }
        }
        return true
    },
    isPathBlocked() { //the plan from here goes through a door, a heavy block, or a hazard, or there is no plan
        const { dist, next, cur } = autopilot
        if (cur < 0 || !dist || autopilot.nodes[cur].dead) return false
        if (!(dist[cur] < Infinity)) return true
        if (simulation.cycle < autopilot.elevatorStuckUntil) return true //an elevator on the way didn't come
        let at = cur
        for (let i = 0; i < 800 && next[at]; i++) {
            const edge = next[at]
            if (autopilot.edgeCost(edge) - edge.cost * (1 + 6 * edge.fail) - 120 * edge.fail >= 1000) return true
            at = edge.to
        }
        return false
    },
    triggerNode(trigger) { //where to stand to press it
        if (trigger.kind === "button") return autopilot.nodeNear((trigger.obj.min.x + trigger.obj.max.x) / 2, trigger.obj.min.y + 10, 2, 3)
        return autopilot.nodeNear(trigger.obj.flip.position.x, trigger.obj.flip.position.y + 10, 2, 3)
    },
    chooseTrigger(exit) {
        if (autopilot.cur < 0 || !autopilot.triggers.length || !autopilot.isExitBlocked(exit)) return null
        const cycle = simulation.cycle
        const working = autopilot.goalType === "trigger" ? autopilot.goalWho : null
        if (working && working.arrivedAt) return working
        const from = autopilot.routesFrom(autopilot.cur).from
        const ready = [], carryAgain = []
        let closest = Infinity
        for (const trigger of autopilot.triggers) {
            if (trigger.kind === "button" && (!map.length || (trigger.wasUp && !trigger.obj.isUp))) continue
            const node = autopilot.triggerNode(trigger)
            if (node < 0 || !Number.isFinite(from[node])) continue
            const when = autopilot.tried.get(trigger)
            if (when === undefined || cycle >= when + 2400) {
                if (trigger === working) return working //keep the choice while walking to it
                ready.push({ trigger, distance: from[node] })
                closest = Math.min(closest, from[node])
            } else if (trigger.popsUp && (trigger.carries || 0) < 2 && autopilot.canHoldBlocks()) {
                carryAgain.push({ trigger, distance: from[node] })
            }
        }
        const choices = ready.length ? ready : carryAgain
        if (!choices.length) {
            autopilot.say("stuck", exit < 0 ? "no way to the exit" : "tried every button, going for the exit anyway")
            return null
        }
        if (!ready.length) closest = Math.min(...choices.map(({ distance }) => distance))
        const weights = choices.map(({ distance }) => 1 + (closest + 60) / (distance + 60)) //the nearest gets at most twice the weight
        let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0)
        for (let i = 0; i < choices.length - 1; i++) {
            roll -= weights[i]
            if (roll < 0) return choices[i].trigger
        }
        return choices[choices.length - 1].trigger
    },
    workTrigger(go) { //stand on the button, or rock the toggle, until doors and hazards stop moving
        const trigger = autopilot.goalWho
        const cycle = simulation.cycle
        const x = player.position.x
        autopilot.isHolding = true
        if (!trigger.arrivedAt) {
            trigger.arrivedAt = cycle
            trigger.startOn = trigger.obj.isOn
        }
        const waited = cycle - trigger.arrivedAt
        let isDone = waited > (trigger.kind === "button" ? 240 : 480)
        if (trigger.kind === "button") {
            const middle = (trigger.obj.min.x + trigger.obj.max.x) / 2
            if (Math.abs(middle - x) > 10) go(middle - x)
            if (waited >= 90 && (trigger.obj.isUp || cycle > autopilot.lastHeavyMove + 45)) isDone = true //unpressed, or nothing is changing
        } else {
            const side = Math.floor(waited / 70) % 2 ? 1 : -1 //stand on one end, then the other, until it flips
            const spot = trigger.obj.flip.position.x + side * 70
            if (Math.abs(spot - x) > 8) go(spot - x)
            if (trigger.obj.isOn !== trigger.startOn && waited > 60 && cycle > autopilot.lastHeavyMove + 45) isDone = true
        }
        if (isDone) {
            autopilot.tried.set(trigger, cycle)
            trigger.arrivedAt = 0
            autopilot.goal = -1
            autopilot.goalWho = null
            autopilot.goalType = ""
        }
    },
    //*********************************************************************
    // carrying a block onto a button that pops back up, so what it opens stays open while the player goes through
    //*********************************************************************
    isCarryBlocks: true,
    carry: null, //{ trigger, block, phase: "fetch" or "bring", spot, since, holdAt } the block it's bringing to a button
    carryAim: null, //{ x, y } the mouse goes exactly here this cycle, at the block it's picking up or the button it's dropping onto
    canHoldBlocks() { //the field picks up blocks, most do, see m.lookForBlock()
        if (autopilot.holdField !== m.fieldMode) {
            autopilot.holdField = m.fieldMode
            autopilot.isHoldField = typeof m.hold === "function" && m.hold.toString().includes("lookForBlock")
        }
        return autopilot.isHoldField
    },
    isCarryable(who) { //a block it can pick up and carry, not too heavy, small enough that a button centers it
        if (who.isNotHoldable || who.isStatic || who.autopilotDynamic || who.autopilotElevator || who.mass > 12) return false
        if (!(who.collisionFilter.mask & cat.player)) return false
        const b = who.bounds
        return b.max.x - b.min.x < 150 && b.max.y - b.min.y < 150
    },
    isOnButton(who) { //resting on one of the level's buttons, already holding it down
        const b = who.bounds
        for (const t of autopilot.triggers) {
            if (t.kind !== "button") continue
            const o = t.obj
            if (b.max.x > o.min.x && b.min.x < o.max.x && b.max.y > o.min.y - 6 && b.max.y < o.max.y + 20) return true
        }
        return false
    },
    planCarry(trigger) { //the closest block to fetch for a button, counting the slow walk carrying it, or null
        if (!autopilot.isCarryBlocks || trigger.kind !== "button" || !autopilot.canHoldBlocks() || autopilot.cur < 0) return null
        const o = trigger.obj, mid = (o.min.x + o.max.x) / 2
        const from = autopilot.routesFrom(autopilot.cur).from
        const spots = [o.min.x - 45, o.max.x + 45].map(x => autopilot.nodeNear(x, o.min.y, 1, 2)).filter(n => n >= 0 && from[n] < Infinity) //just off either end of it
        if (!spots.length) return null
        let best = null, bestCost = Infinity
        for (const who of body) {
            if (!autopilot.isCarryable(who) || autopilot.isOnButton(who) || autopilot.isIgnored(who)) continue
            const far = Math.hypot(who.position.x - mid, who.position.y - o.min.y)
            if (far > 1500) continue
            const node = autopilot.nodeNear(who.position.x, who.bounds.max.y, 3, 3) //it's picked up from up to about 150 away
            if (node < 0 || !(from[node] < Infinity)) continue
            const cost = from[node] + far / autopilot.p.run * (1 + who.mass / 5) //carrying it slows the player down
            if (cost < bestCost) {
                bestCost = cost
                best = who
            }
        }
        return best ? { trigger, block: best, spots, phase: "fetch", since: simulation.cycle, holdAt: 0 } : null
    },
    updateCarry() { //keep the goal on the block, then on a spot beside the button, false when it's done or gave up
        const c = autopilot.carry
        const cycle = simulation.cycle
        const nodes = autopilot.nodes
        const stop = (isGood, why) => {
            autopilot.carry = null
            if (m.isHolding) m.drop()
            if (!isGood) autopilot.ignored.set(c.block, cycle + 3600)
            c.trigger.carries = (c.trigger.carries || 0) + 1
            autopilot.tried.set(c.trigger, cycle)
            autopilot.say(isGood ? "dropped" : "stuck", why)
            return false
        }
        if (!body.includes(c.block)) return stop(false, "the block it was carrying is gone")
        if (autopilot.isOnButton(c.block) && !m.isHolding) return stop(true, "a block is holding the button down")
        if (m.isHolding && m.holdingTarget === c.block) {
            if (c.phase !== "bring") {
                c.phase = "bring"
                c.since = cycle
            }
        } else if (c.phase === "bring") { //dropped it somewhere else, go get it again
            c.phase = "fetch"
            c.since = cycle
        }
        if (cycle > c.since + 1200) return stop(false, c.phase === "fetch" ? "couldn't pick up the block" : "couldn't bring the block to the button")
        let goal = -1
        if (c.phase === "fetch") goal = autopilot.nodeNear(c.block.position.x, c.block.bounds.max.y, 3, 3)
        else {
            const from = autopilot.cur >= 0 ? autopilot.routesFrom(autopilot.cur).from : null
            let best = Infinity
            for (const n of c.spots) {
                if (nodes[n] && !nodes[n].dead && from && from[n] < best) {
                    best = from[n]
                    goal = n
                }
            }
        }
        if (goal < 0 || nodes[goal].dead) return stop(false, "no way to the block or the button")
        if (goal !== autopilot.goal || autopilot.goalType !== "carry") {
            if (autopilot.goalType !== "carry") autopilot.say("carrying", "a block to hold the button down")
            autopilot.goal = goal
            autopilot.goalType = "carry"
            autopilot.goalWho = c.block
            autopilot.goalSince = cycle
            autopilot.isPlanDirty = true
        }
        return true
    },
    driveCarry(go) { //close to the block, pick it up, at the spot beside the button, drop it on, true while it's doing one of those
        const c = autopilot.carry
        if (!c || autopilot.goalType !== "carry" || !m.onGround) return false
        const cycle = simulation.cycle
        if (c.phase === "fetch" && !m.isHolding) {
            const b = c.block.position
            if (Math.hypot(b.x - m.pos.x, b.y - m.pos.y) > 130 || Matter.Query.rayAny(map, b, m.pos)) return false
            autopilot.why = "picking up a block"
            autopilot.carryAim = { x: b.x, y: b.y }
            if (!c.holdAt || cycle > c.holdAt + 40) c.holdAt = cycle //hold the field on it, then let go, and m.hold() picks it up
            input.field = cycle < c.holdAt + 14
            return true
        }
        if (c.phase === "bring" && m.isHolding && autopilot.cur === autopilot.goal) {
            const o = c.trigger.obj, mid = (o.min.x + o.max.x) / 2
            autopilot.why = "dropping a block on the button"
            autopilot.carryAim = { x: mid, y: o.min.y - 50 } //the held block hangs out toward the mouse, over the button
            input.field = false
            const bx = m.holdingTarget.position.x
            if (bx > o.min.x + 12 && bx < o.max.x - 12 && Math.abs(player.velocity.x) < 1.5) m.drop()
            else if (Math.abs(player.velocity.x) < 0.5 && cycle % 60 === 0) go(Math.sign(mid - player.position.x)) //nudge closer if it doesn't reach
            return true
        }
        return false
    },
    recoverLoadedJump(flight, isGood) {
        const { edge, heldBlock, apexY } = flight
        const block = m.isHolding && m.holdingTarget
        const to = autopilot.nodes[edge.to]
        if (isGood || !block || block !== heldBlock || !(player.mass > m.defaultMass) || !(apexY > to.y + 8)) {
            autopilot.loadedJumpMiss = null
            return false
        }
        const cycle = simulation.cycle
        const previous = autopilot.loadedJumpMiss
        if (!previous || previous.block !== block || cycle - previous.cycle > 600 ||
            Math.abs(previous.x - to.x) > 100 || Math.abs(previous.y - to.y) > 30) {
            autopilot.loadedJumpMiss = { block, x: to.x, y: to.y, cycle }
            return true //try once more before giving up the block, without penalizing the unloaded jump
        }
        const carry = autopilot.carry
        m.drop()
        input.field = false
        autopilot.cancelMovement()
        autopilot.ignored.set(block, cycle + 600)
        if (carry && carry.block === block) {
            autopilot.tried.set(carry.trigger, cycle)
            autopilot.goal = -1
            autopilot.goalWho = null
            autopilot.goalType = ""
        }
        autopilot.updateObstacles()
        autopilot.hasMovementChanged()
        autopilot.isPlanDirty = true
        autopilot.lastPlanCycle = -Infinity
        autopilot.say("dropped", "the block was too heavy for the jump")
        return true
    },
    blockClear: null,
    blockClearUntil: new WeakMap(),
    blockDropFits(block, bounds, isUnderfoot) {
        //A block lifted from underfoot needs to fall beside the player, outside the drop.
        if (isUnderfoot && bounds.max.x > player.bounds.min.x - 4 && bounds.min.x < player.bounds.max.x + 4) return false
        if (Matter.Bounds.overlaps(player.bounds, bounds) || Matter.Query.region(map, bounds).length) return false
        return !Matter.Query.region(body, bounds).some(who => who !== block)
    },
    blockDropAim(block, angle, isUnderfoot) {
        const radius = 30 + 40 * player.scale //the same distance as m.holding()
        const bounds = block.bounds
        for (const turn of [0, -Math.PI / 4, Math.PI / 4, -Math.PI / 2, Math.PI / 2]) {
            const x = m.pos.x + radius * Math.cos(angle + turn)
            const y = m.pos.y + radius * Math.sin(angle + turn)
            const dx = x - block.position.x, dy = y - block.position.y
            const box = {
                min: { x: bounds.min.x + dx, y: bounds.min.y + dy },
                max: { x: bounds.max.x + dx, y: bounds.max.y + dy },
            }
            if (autopilot.blockDropFits(block, box, isUnderfoot)) return { x, y }
        }
        return null
    },
    startBlockClear(feet, edge) {
        if (autopilot.carry || autopilot.riding || m.isHolding || !m.onGround || m.fieldCDcycle >= m.cycle || !autopilot.canHoldBlocks()) return false
        const cycle = simulation.cycle
        const x = player.position.x
        const goalId = edge ? edge.to : autopilot.goal
        const goal = (!edge && autopilot.goalType === "explore" ? null : autopilot.nodes[goalId]) || { x: level.exit.x + 50, y: level.exit.y }
        const dir = Math.sign(goal.x - x)
        const targetDy = goal.y - feet
        const under = m.standingOn && (m.standingOn.parent || m.standingOn)
        const size = autopilot.size()
        let best = null, bestDistance = Infinity
        for (const block of body) {
            if (!autopilot.isPushable(block) || block.isNotHoldable || autopilot.hanging.has(block) || !(block.collisionFilter.mask & cat.player) || autopilot.isOnButton(block)) continue
            if (cycle < (autopilot.blockClearUntil.get(block) || 0)) continue
            const b = block.bounds
            const isUnderfoot = block === under
            if (isUnderfoot) {
                if (targetDy < 30 || Math.abs(goal.x - x) > Math.max(60, targetDy) || (edge && edge.type !== autopilot.FALL && edge.type !== autopilot.WALK)) continue
            } else {
                const beside = dir && (block.position.x - x) * dir > 0 && (dir > 0 ? b.min.x - x : x - b.max.x) < size.halfWidth + 35 && b.max.y > feet - size.height && b.min.y < feet - 8
                const overhead = targetDy < -30 && b.max.y > feet - size.height - 45 && b.max.y < feet - size.height + 6 && b.min.x < x + size.halfWidth && b.max.x > x - size.halfWidth
                if (!beside && !overhead) continue
            }
            const dx = block.position.x - m.pos.x, dy = block.position.y - m.pos.y
            const distance = Math.hypot(dx, dy)
            if (distance > 80 + 70 * Math.max(1, player.scale) || distance >= bestDistance || Matter.Query.rayAny(map, m.pos, block.position)) continue
            const angle = Math.atan2(-dy, -dx)
            const dropAim = autopilot.blockDropAim(block, angle, isUnderfoot)
            if (!dropAim) continue
            best = { block, angle, isUnderfoot, start: cycle, pickedUp: false, dropAim }
            bestDistance = distance
        }
        if (!best) return false
        autopilot.blockClear = best
        autopilot.pending = autopilot.backUp = autopilot.commit = null
        autopilot.blockedCycles = 0
        return autopilot.driveBlockClear(feet)
    },
    driveBlockClear(feet) {
        const clear = autopilot.blockClear
        const block = clear.block
        const cycle = simulation.cycle
        const isHeld = m.isHolding && m.holdingTarget === block
        const stop = success => {
            if (isHeld) m.drop()
            else if (!m.isHolding) m.holdingTarget = null
            autopilot.blockClearUntil.set(block, cycle + (success ? 180 : 300))
            autopilot.blockClear = null
            autopilot.watch = { x: player.position.x, y: feet, cycle }
            if (success) {
                autopilot.updateObstacles()
                autopilot.isPlanDirty = true
                autopilot.say("cleared", "a block in the way")
            }
            return true
        }
        input.field = input.fire = input.left = input.right = input.up = input.down = false
        if (!body.includes(block) || (m.isHolding && !isHeld) || (!isHeld && (clear.pickedUp || cycle > clear.start + 30))) return stop(false)
        if (!isHeld) {
            autopilot.why = "picking up a blocking block"
            autopilot.carryAim = block.position
            input.field = m.holdingTarget !== block
            return true
        }
        clear.pickedUp = true
        autopilot.why = "moving a block out of the way"
        const aim = autopilot.blockDropAim(block, clear.angle, clear.isUnderfoot)
        if (aim) clear.dropAim = aim
        autopilot.carryAim = clear.dropAim
        if (aim && Math.hypot(block.position.x - aim.x, block.position.y - aim.y) < 10 && autopilot.blockDropFits(block, block.bounds, clear.isUnderfoot)) return stop(true)
        if (cycle > clear.start + 60) return stop(false)
        return true
    },
    saidAt: new Map(), //the cycle each word was last said, a word comes back after 900 cycles at the soonest, even with other words in between, so two don't flicker
    isRepeat(state) {
        return simulation.cycle < (autopilot.saidAt.get(state) ?? -Infinity) + 900
    },
    say(state, note = "") { //a word above the player for a moment when what it's doing changes, note is why, for tools/autopilot-test.js
        if (autopilot.isRepeat(state)) return
        autopilot.saidAt.set(state, simulation.cycle)
        autopilot.said = state
        autopilot.saidCycle = simulation.cycle
        if (!autopilot.isTalking) return
        const word = autopilot.words[state] || state
        const size = 28 //how tall the letters are, the font is 40
        autopilot.word = { path: simulation.draw.font.path(word, 0, 0, size), width: (word.length * 29 - 8) * size / 40, start: simulation.cycle }
    },
    isTalking: true,
    elevatorStuckUntil: 0, //an elevator didn't come, try the level's toggles and buttons until then
    words: { "pressing a button": "button", "flipping a toggle": "toggle", "out of ammo": "no ammo", "re-planning": "rethinking" }, //shorter words for some states
    word: null, //{ path, width, start } the word above the player
    drawWord() { //drawn with the in game text font, it rises a little and fades out
        const word = autopilot.word
        if (!word) return
        const age = simulation.cycle - word.start
        const life = 120
        if (age > life || age < 0) return void (autopilot.word = null)
        ctx.save()
        ctx.translate(m.pos.x - word.width / 2, m.pos.y - 115 - Math.min(age, 30) * 0.4)
        ctx.globalAlpha = Math.min(1, age / 8, (life - age) / 30)
        ctx.strokeStyle = "rgb(0,140,255)"
        ctx.lineWidth = 3
        ctx.stroke(word.path)
        ctx.restore()
    },
    isWanted(who) {
        if (who.name === "heal") return m.health < m.maxHealth * 0.95 || tech.isOverHeal
        if (who.name === "ammo") return b.inventory.length > 0 && !tech.isEnergyNoAmmo
        return true
    },
    isIgnored(who) {
        const until = autopilot.ignored.get(who)
        return until !== undefined && until > simulation.cycle
    },
    isArmed() {
        return b.activeGun !== null && b.activeGun !== undefined && b.guns[b.activeGun] && b.guns[b.activeGun].ammo > 0
    },
    chooseGoal() {
        const exit = autopilot.exitNode()
        if (autopilot.carry) {
            if (autopilot.isExitBlocked(exit)) {
                if (autopilot.updateCarry()) return
            } else {
                const { block, trigger } = autopilot.carry
                if (m.holdingTarget === block) {
                    if (m.isHolding) m.drop()
                    else m.holdingTarget = null
                }
                autopilot.tried.set(trigger, simulation.cycle)
                autopilot.carry = null
            }
        }
        let goal = exit, type = "exit", who = null
        if (autopilot.only !== "exit" && autopilot.cur >= 0) {
            const from = autopilot.routesFrom(autopilot.cur).from
            let best = Infinity
            const keep = who => who === autopilot.goalWho ? 0.8 : 1 //the current goal has to be beaten clearly, so it doesn't switch back and forth
            for (let i = 0; i < powerUp.length; i++) {
                if (!autopilot.isWanted(powerUp[i]) || autopilot.isIgnored(powerUp[i])) continue
                const node = autopilot.nodeFor(powerUp[i].position)
                if (node >= 0 && from[node] * keep(powerUp[i]) < best && !autopilot.isBehindDoor(node)) {
                    best = from[node] * keep(powerUp[i])
                    goal = node
                    type = "powerUp"
                    who = powerUp[i]
                }
            }
            if (type === "exit" && autopilot.isArmed()) { //nothing to pick up, look for something to shoot
                for (let i = 0; i < mob.length; i++) {
                    if (!mob[i].alive || mob[i].isBadTarget || mob[i].isInvulnerable || !mob[i].isDropPowerUp || autopilot.isIgnored(mob[i])) continue
                    const node = autopilot.nodeFor(mob[i].position, 16)
                    if (node >= 0 && from[node] * keep(mob[i]) < best && !autopilot.isBehindDoor(node)) {
                        best = from[node] * keep(mob[i])
                        goal = node
                        type = "mob"
                        who = mob[i]
                    }
                }
            }
        }
        if (type === "exit") { //a closed door, a hazard, or no way at all, try a button or toggle
            const trigger = autopilot.chooseTrigger(exit)
            if (trigger) {
                type = "trigger"
                who = trigger
                goal = autopilot.triggerNode(trigger)
                autopilot.lostSince = 0 //the wait at a blocked exit starts over after the buttons
                if (trigger.popsUp && !trigger.arrivedAt && (trigger.carries || 0) < 2) { //standing on it didn't keep it down, bring a block to hold it
                    const carry = autopilot.planCarry(trigger)
                    if (carry) {
                        autopilot.carry = carry
                        if (autopilot.updateCarry()) return
                    }
                }
            }
        }
        if (type === "exit" && autopilot.isExplore) { //no way to the exit, go see somewhere that might have one
            const spot = autopilot.chooseExplore(exit)
            if (spot >= 0) {
                type = "explore"
                goal = spot
            }
        }
        if (goal !== autopilot.goal || who !== autopilot.goalWho) {
            if (who !== autopilot.goalWho || type !== autopilot.goalType) {
                const previous = autopilot.goalType === "trigger" && autopilot.goalWho
                if (previous && previous.arrivedAt) {
                    autopilot.tried.set(previous, simulation.cycle)
                    previous.arrivedAt = 0
                }
                autopilot.goalSince = simulation.cycle
                if (type === "powerUp") autopilot.say("fetching", who.name)
                else if (type === "mob") autopilot.say("hunting", "a mob that drops power ups")
                else if (type === "explore") autopilot.say("exploring", "the exit is blocked and no button is left to try")
                else if (type === "trigger") autopilot.say(who.kind === "button" ? "pressing a button" : "flipping a toggle", "the way to the exit is blocked")
                else if (exit < 0) autopilot.say("lost", "can't find the exit")
                else autopilot.say("exiting", autopilot.only === "exit" ? "" : "nothing else to get")
            }
            autopilot.goal = goal
            autopilot.goalType = type
            autopilot.goalWho = who
            autopilot.isPlanDirty = true
        }
    },

    //*********************************************************************
    // every cycle
    //*********************************************************************
    do() {
        if (!m.alive || simulation.onTitlePage || simulation.paused || simulation.isChoosing || levelEditor.isActive || !player || simulation.clearNow) return
        const cycle = simulation.cycle
        const isManual = input.movementKeys.size > 0
        if (isManual !== autopilot.manualControl || autopilot.controlField !== m.fieldMode) {
            autopilot.cancelMovement()
            autopilot.manualControl = isManual
            autopilot.controlField = m.fieldMode
        }
        const elevatorChanged = autopilot.elevators.some(who => autopilot.activeElevators.has(who) !== autopilot.elevatorEnabled(who))
        if (!autopilot.grid || elevatorChanged || (cycle % 30 === 0 && cycle > autopilot.lastBuildCycle + 90 && autopilot.hasMapChanged())) {
            if (!autopilot.build()) return
        }
        if (cycle % 30 === 15) autopilot.findMovingMap()
        if ((player.scale || 1) !== autopilot.pScale || cycle % 30 === 20) autopilot.hasMovementChanged()
        if (cycle % 10 === 0 && autopilot.winds.length) { //a button turning the fans around changes every jump through the wind
            let signature = 0
            for (const w of autopilot.winds) signature += 1000 * w.velocity.x + 3000 * w.velocity.y + (w.isFloat ? 7 : 0)
            if (Math.abs(signature - autopilot.windSignature) > 1e-6) {
                if (autopilot.windSignature !== null) {
                    for (const node of autopilot.nodes) if (!node.dead) autopilot.relink.add(node.id)
                    autopilot.lastHeavyMove = cycle
                    autopilot.isPlanDirty = true
                }
                autopilot.windSignature = signature
            }
        }
        if (cycle % 10 === 0) {
            autopilot.refreshHazards()
            autopilot.refreshJumpZones()
        }
        const rayWalls = m.fieldUpgrades[2]?.rayWalls?.()
        if (cycle % 10 === 5 || ((rayWalls?.length || autopilot.rayWalls?.length) && rayWalls !== autopilot.rayWalls)) autopilot.updateObstacles()
        autopilot.rayWalls = rayWalls
        for (const t of autopilot.triggers) { //a button that went down and came back up needs something left on it
            if (t.kind !== "button") continue
            if (t.obj.isUp) {
                if (t.wasDown) t.popsUp = true
                t.wasUp = true
            } else if (t.wasUp) t.wasDown = true
        }
        autopilot.relinkSome(1.5)
        const feet = playerBody.bounds.max.y
        if (autopilot.cur >= 0 && autopilot.nodes[autopilot.cur].dead) autopilot.cur = -1
        if (m.onGround) {
            let at = autopilot.nodeNear(player.position.x, feet, 1, 2)
            if (at < 0) { //standing on something too small to be on the grid
                at = autopilot.nodeBelow(player.position.x, feet - 30)
                if (at >= 0 && autopilot.nodes[at].y - feet > 250) at = -1
            }
            const under = m.standingOn && (m.standingOn.parent || m.standingOn)
            autopilot.riding = autopilot.activeElevators.has(under) ? under : null
            if (autopilot.riding) { //between its two ends, the closer end's node in this column
                const e = autopilot.riding.autopilotElevator
                const level = Math.abs(feet - e.top) < Math.abs(feet - e.bottom) ? 1 : 0
                let best = Infinity
                for (const node of e.nodes[level]) {
                    if (Math.abs(node.x - player.position.x) < best) {
                        best = Math.abs(node.x - player.position.x)
                        at = node.id
                    }
                }
            }
            if (at >= 0) autopilot.cur = at
        } else autopilot.riding = null
        if (autopilot.recentFailures.length && cycle >= autopilot.recentFailures[0].until) {
            autopilot.recentFailures = autopilot.recentFailures.filter(attempt => cycle < attempt.until)
            autopilot.isPlanDirty = true
        }
        if (cycle % 30 === 0 || autopilot.goal < 0 || autopilot.nodes[autopilot.goal].dead) {
            autopilot.giveUp()
            autopilot.chooseGoal()
        }
        if (autopilot.isPlanDirty && (cycle > autopilot.lastPlanCycle + 10 || !autopilot.next)) autopilot.plan()
        if (cycle % 60 === 0 && autopilot.dist && autopilot.cur >= 0 && autopilot.goal >= 0 && !(autopilot.dist[autopilot.cur] < Infinity) && !autopilot.relink.size) autopilot.say("lost", `no way from here to the ${autopilot.goalType === "exit" ? "exit" : "goal"}`)
        autopilot.fight()
        if (!isManual) {
            autopilot.drive(feet) //holding a movement key takes over
            autopilot.measure()
            if (tech.isFireMoveLock && (input.left || input.right || input.up || autopilot.flying)) input.fire = false //Higgs mechanism, the player can't move while firing
        }
        autopilot.look()
        autopilot.lastV.x = player.velocity.x
        autopilot.lastV.y = player.velocity.y
        if (!simulation.ephemera.includes(autopilot.drawer)) simulation.ephemera.push(autopilot.drawer)
    },
    motion: { ground: 0, reversals: 0, stopped: 0, stationary: 0, blocked: 0, coasting: 0, lastDir: 0, reversed: {}, stoppedFor: {}, movingFor: {} }, //on the ground: cycles, turnarounds, and cycles with no direction held, with why, for tools/autopilot-test.js
    takeoffs: [], //where jumps left the ground compared to where the ground they left ends, for tools/autopilot-test.js
    recordTakeoff(edge, x, feet, kind) {
        if (!edge || autopilot.takeoffs.length > 400) return null
        const nodes = autopilot.nodes
        const dir = Math.sign(nodes[edge.to].x - x) || edge.dir || 1
        const lip = autopilot.lipFor(x, feet, dir)
        if (!lip || Math.abs(lip.x - x) > 150) return null //not jumping off the end of something
        const record = { kind, run: !!edge.isRun, dir, past: Math.round((x - lip.x) * dir), below: Math.round(feet - lip.y), isBehind: lip.isBehind, isGood: null, at: [Math.round(x), Math.round(feet)], lip: [Math.round(lip.x), Math.round(lip.y)], from: [nodes[edge.from].x, nodes[edge.from].y], to: [nodes[edge.to].x, nodes[edge.to].y], takeoffX: edge.takeoffX === undefined ? null : Math.round(edge.takeoffX), coyote: edge.coyote, type: autopilot.edgeNames[edge.type] }
        autopilot.takeoffs.push(record)
        return record
    },
    resetMetrics() { //the benchmark calls this after loading its target level, not on every level transition
        autopilot.takeoffs = []
        autopilot.stats = { jump: [0, 0], fall: [0, 0], boost: [0, 0], grapple: [0, 0], portal: [0, 0] }
        autopilot.misses = []
        autopilot.jumpKinds = {}
        autopilot.flyEnds = {}
        autopilot.grappleWhy = {}
        autopilot.relinkMs = 0
        autopilot.motion = { ground: 0, reversals: 0, stopped: 0, stationary: 0, blocked: 0, coasting: 0, lastDir: 0, reversed: {}, stoppedFor: {}, movingFor: {} }
    },
    measure() {
        if (!m.onGround || (autopilot.flight && m.cycle - autopilot.flight.mStart < 10)) return
        const motion = autopilot.motion
        const dir = input.right ? 1 : input.left ? -1 : 0
        const why = autopilot.why || "?"
        motion.ground++
        const isStill = Math.abs(player.velocity.x - (m.carryX || 0)) < 0.6
        if (isStill) motion.stationary++
        if (isStill && dir) motion.blocked++
        if (!isStill && !dir) motion.coasting++
        if (dir && motion.lastDir && dir !== motion.lastDir) {
            motion.reversals++
            motion.reversed[why] = (motion.reversed[why] || 0) + 1
        }
        if (!dir) {
            motion.stopped++
            motion.stoppedFor[why] = (motion.stoppedFor[why] || 0) + 1
        }
        if (dir) {
            motion.lastDir = dir
            motion.movingFor[why] = (motion.movingFor[why] || 0) + 1
        }
    },
    giveUp() { //a power up or mob that takes too long isn't worth it
        const who = autopilot.goalWho
        if (!who || autopilot.goalType === "carry") return //a carry has its own time limits
        if (autopilot.goalType === "trigger") {
            if (simulation.cycle > autopilot.goalSince + 1800 || (autopilot.dist && autopilot.cur >= 0 && !(autopilot.dist[autopilot.cur] < Infinity) && simulation.cycle > autopilot.goalSince + 120)) {
                autopilot.tried.set(who, simulation.cycle)
                who.arrivedAt = 0
                autopilot.goalWho = null
                autopilot.goal = -1
            }
            return
        }
        const isGone = autopilot.goalType === "powerUp" ? !powerUp.includes(who) : !who.alive
        //standing where it should be reachable for a few checks in a row, and it isn't
        autopilot.atGoalCount = autopilot.cur === autopilot.goal && m.onGround && autopilot.target !== who ? autopilot.atGoalCount + 1 : 0
        const isThere = autopilot.atGoalCount > 3
        const isUnreachable = autopilot.dist && autopilot.cur >= 0 && !(autopilot.dist[autopilot.cur] < Infinity) && simulation.cycle > autopilot.goalSince + 60
        if (isGone || isThere || simulation.cycle > autopilot.goalSince + 1500 || isUnreachable) {
            if (!isGone) autopilot.ignored.set(who, simulation.cycle + 3600)
            autopilot.atGoalCount = 0
            autopilot.goalWho = null
            autopilot.goal = -1
        }
    },
    //*********************************************************************
    // aiming, each gun's shots fly differently
    //*********************************************************************
    isGunAim: true, //aim each gun its own way, false aims every gun like a fast straight shot, to compare
    profile: null, //gunProfile() of the gun in hand, this cycle
    shot: null, //aimAt() for the target, worked out every other cycle
    shotFor: null,
    cycleAim: -1,
    gunProfile() { //how the gun in hand's shots fly: straight, in an arc, homing, an instant beam, or a wave, how fast, how far is worth firing, and how close is too close
        const gun = b.guns[b.activeGun]
        if (!gun) return null
        const dt2 = simulation.delta * simulation.delta //a force per mass each cycle, as a change in speed each cycle
        const name = gun.name
        let p
        //speeds and gravities measured in game, the shots it sees replace them when tech changes how a gun fires
        if (name === "nail gun") p = { kind: "straight", speed: 33, reach: 2200, inherit: { x: 0.8, y: 0.5 } }
        else if (name === "shotgun") p = { kind: "straight", speed: 52, keep: 0.966, reach: 650 } //a wide spray that slows down fast
        else if (name === "super balls") p = { kind: "straight", speed: 36, reach: 1800, isFixed: true } //they bounce, straight at it hits more than a careful arc
        else if (name === "wave") p = { kind: "wave", speed: 17, reach: 1100, isAutoFire: true, isThroughWalls: true } //emits on its own unless fire is held, through walls
        else if (name === "missiles") p = { kind: "homing", reach: 2000, near: 330 } //they explode
        else if (name === "grenades") p = { kind: "arc", speed: m.crouch ? 43 : 32, gravity: 0.0025 * dt2, reach: 1700, near: 380, splash: 280, fuse: (m.crouch ? 120 : 80) * (tech.bulletsLastLonger || 1), inherit: { x: 0.5, y: 0.5 } }
        else if (name === "spores") p = { kind: "arc", speed: 18, gravity: 0.0007 * dt2, keep: 0.993, reach: 1200 } //a seed that lands, then spores chase mobs
        else if (name === "drones") p = { kind: "homing", reach: 1800 } //they hunt on their own
        else if (name === "foam") p = { kind: "arc", speed: 12.5, gravity: 0.0001 * dt2, keep: 0.997, reach: 1000, inherit: { x: 0.7, y: 0.5 } } //slow, it needs a big lead
        else if (name === "harpoon") p = { kind: "homing", reach: 600 * (tech.isUHMWPE ? 1 + 0.012 * Math.min(110, gun.ammo) : 1) } //locks on to a mob near the aim, then comes back
        else if (name === "mine") p = { kind: "arc", speed: 23, gravity: 0.002 * dt2, reach: 1500, splash: 650 } //sticks where it lands, then shoots nails at mobs within 700
        else if (name === "laser") p = { kind: "beam", reach: tech.beamSplitter ? 3000 : 4500, near: tech.isPulseLaser ? 330 : 0 }
        else p = { kind: "straight", speed: 30, reach: 1500 }
        p.gravity = p.gravity || 0
        p.keep = p.keep || 1
        p.near = p.near || 0
        p.inherit = p.inherit || { x: 0, y: 0 }
        const seen = autopilot.shots[name + (m.crouch ? " crouching" : "")]
        if (seen && seen.n >= 2 && !p.isFixed && (p.kind === "straight" || p.kind === "arc")) { //what its own shots did
            p.speed = seen.speed
            p.gravity = seen.gravity
            p.keep = seen.keep
            p.kind = seen.gravity > 0.05 ? "arc" : "straight" //rivets and slugs fall
        }
        return p
    },
    shots: {}, //{ speed, gravity, keep, n } what its shots did, by gun name, and crouching
    shotWatch: [], //{ who, key, inherit, playerV, pts } shots it just fired, measured for a few cycles
    seenBullets: new WeakSet(),
    firedAt: -Infinity, //the cycle it last held fire
    watchShots() { //measure the shots it just fired, so aiming keeps up with tech that changes them
        const cycle = simulation.cycle
        const p = autopilot.profile
        const isMeasured = p && (p.kind === "straight" || p.kind === "arc") && cycle - autopilot.firedAt <= 2
        for (let i = 0; i < bullet.length; i++) {
            const who = bullet[i]
            if (autopilot.seenBullets.has(who)) continue
            autopilot.seenBullets.add(who)
            if (isMeasured && autopilot.shotWatch.length < 12 && Math.hypot(who.position.x - m.pos.x, who.position.y - m.pos.y) < 120) {
                autopilot.shotWatch.push({ who, key: b.guns[b.activeGun].name + (m.crouch ? " crouching" : ""), inherit: p.inherit, playerV: { x: player.velocity.x, y: player.velocity.y }, pts: [] })
            }
        }
        for (let i = autopilot.shotWatch.length - 1; i >= 0; i--) {
            const w = autopilot.shotWatch[i]
            const isGone = !bullet.includes(w.who)
            if (!isGone) w.pts.push({ x: w.who.velocity.x, y: w.who.velocity.y })
            if (!isGone && w.pts.length < 7) continue
            autopilot.shotWatch.splice(i, 1)
            if (w.pts.length >= 4) autopilot.learnShot(w)
        }
    },
    learnShot(w) {
        const v = w.pts
        const median = list => list.length ? list.slice().sort((a, b) => a - b)[Math.floor(list.length / 2)] : null
        const keeps = []
        for (let i = 1; i < v.length; i++) if (Math.abs(v[i - 1].x) > 2) keeps.push(v[i].x / v[i - 1].x)
        const keep = Math.min(1, Math.max(0.9, median(keeps) ?? 1))
        const gravities = []
        for (let i = 1; i < v.length; i++) gravities.push(v[i].y - keep * v[i - 1].y)
        const gravity = median(gravities)
        for (let i = 1; i < v.length; i++) { //it hit something, or something pushed it
            if (Math.abs(v[i].x - keep * v[i - 1].x) > 2 || Math.abs(v[i].y - keep * v[i - 1].y - gravity) > 2) return
        }
        const first = { x: (v[0].x) / keep - w.inherit.x * w.playerV.x, y: (v[0].y - gravity) / keep - w.inherit.y * w.playerV.y } //back one cycle, to when it left the gun
        const speed = Math.hypot(first.x, first.y)
        if (!(speed > 2)) return
        const s = autopilot.shots[w.key] = autopilot.shots[w.key] || { speed, gravity, keep, n: 0 }
        const rate = 1 / Math.min(6, s.n + 1) //an average that follows tech changes after a few shots
        s.speed += (speed - s.speed) * rate
        s.gravity += (Math.max(0, gravity) - s.gravity) * rate
        s.keep += (keep - s.keep) * rate
        s.n++
    },
    flyShot(p, angle, from, goalX, goalY, isCheck = false) { //follow a shot fired at angle until it passes goalX, or is about level with goalY going straight up or down, { y, t, clear } or null
        const vp = player.velocity
        let x = from.x, y = from.y
        let vx = p.speed * Math.cos(angle) + p.inherit.x * vp.x, vy = p.speed * Math.sin(angle) + p.inherit.y * vp.y
        const dir = Math.sign(goalX - from.x) || 1
        const isVertical = Math.abs(goalX - from.x) < 30
        let lastX = x, lastY = y, clear = true
        for (let t = 1; t < 240; t++) {
            vx *= p.keep
            vy = vy * p.keep + p.gravity
            const nx = x + vx, ny = y + vy
            if (isCheck && t % 3 === 0) {
                if (Matter.Query.rayAny(map, { x: lastX, y: lastY }, { x: nx, y: ny })) clear = false
                lastX = nx
                lastY = ny
            }
            if (isVertical ? Math.abs(ny - goalY) < Math.abs(vy) + 1 || (ny - goalY) * Math.sign(vy) > 0 : (nx - goalX) * dir >= 0) {
                const f = isVertical ? 1 : Math.abs(vx) > 1e-6 ? (goalX - x) / vx : 1
                if (isCheck && Matter.Query.rayAny(map, { x: lastX, y: lastY }, { x: goalX, y: y + vy * f })) clear = false
                return { y: y + vy * f, t: t - 1 + f, clear }
            }
            if (!isVertical && vx * dir <= 0.05) return null //stalled before it got there
            x = nx
            y = ny
        }
        return null
    },
    landShot(p, angle, from, groundY) { //where a shot comes down to groundY, { x, y, t, clear }, or hits the map first, or null
        const vp = player.velocity
        let x = from.x, y = from.y
        let vx = p.speed * Math.cos(angle) + p.inherit.x * vp.x, vy = p.speed * Math.sin(angle) + p.inherit.y * vp.y
        for (let t = 1; t < 240; t++) {
            vx *= p.keep
            vy = vy * p.keep + p.gravity
            const nx = x + vx, ny = y + vy
            if (t % 2 === 0 && Matter.Query.rayAny(map, { x, y }, { x: nx, y: ny })) return { x: nx, y: ny, t, clear: true } //lands on the map
            if (vy > 0 && ny >= groundY) return { x: nx, y: ny, t, clear: true }
            x = nx
            y = ny
        }
        return null
    },
    aimArc(p, from, to, isCheck = true) { //the angles that land a falling shot on to, low arc first, each { angle, t, clear }, isCheck looks for the map in the way
        const dx = to.x - from.x, up = from.y - to.y, s = p.speed, g = p.gravity
        const along = Math.abs(dx), side = Math.sign(dx) || 1
        if (along < 30) return [{ angle: Math.atan2(to.y - from.y, dx || 1e-6), t: Math.hypot(dx, up) / s, clear: !Matter.Query.rayAny(map, from, to) }]
        const root = s * s * s * s - g * (g * along * along + 2 * up * s * s)
        if (root < 0) return [] //out of reach
        const found = []
        for (const sign of [-1, 1]) {
            const elevation = Math.atan2(s * s + sign * Math.sqrt(root), g * along) //without drag or the player's speed
            let angle = side > 0 ? -elevation : Math.PI + elevation //screen angles, y is down
            let miss = null, lastAngle = null, lastMiss = null, hit = null
            for (let i = 0; i < 5; i++) { //correct for drag and the player's speed by trying it
                hit = autopilot.flyShot(p, angle, from, to.x, to.y)
                if (!hit) break
                miss = hit.y - to.y
                if (Math.abs(miss) < 4) break
                const next = lastAngle === null ? angle - 0.02 * side * Math.sign(miss) : angle - miss * (angle - lastAngle) / (miss - lastMiss || 1e-6) //landed low, aim higher
                lastAngle = angle
                lastMiss = miss
                angle = next
            }
            const shot = isCheck ? autopilot.flyShot(p, angle, from, to.x, to.y, true) : hit
            if (shot && Math.abs(shot.y - to.y) < 40 && !(p.fuse && shot.t > p.fuse)) found.push({ angle, t: shot.t, clear: isCheck ? shot.clear : true })
        }
        return found
    },
    aimAt(target, p) { //where to point the gun to hit target, { angle, t, clear, distance }, or null if this gun can't reach it
        const from = { x: m.pos.x, y: m.pos.y }
        const to = { x: target.position.x, y: target.position.y }
        const distance = Math.hypot(to.x - from.x, to.y - from.y)
        if (distance > p.reach) return null
        if (p.kind === "beam") return { angle: Math.atan2(to.y - from.y, to.x - from.x), t: 0, clear: !Matter.Query.rayAny(map, from, to), distance } //instant
        if (p.kind === "homing") { //they steer themselves, a small lead starts them off right
            const lead = Math.min(20, distance / 45)
            const spot = { x: to.x + target.velocity.x * lead, y: to.y + target.velocity.y * lead }
            return { angle: Math.atan2(spot.y - from.y, spot.x - from.x), t: lead, clear: !Matter.Query.rayAny(map, from, to), distance }
        }
        const vp = player.velocity, vt = target.velocity
        const ahead = t => { //where it will be in t cycles, from the shot's view, which carries some of the player's speed
            const lead = Math.min(t, 90)
            return { x: to.x + (vt.x - p.inherit.x * vp.x) * lead, y: to.y + (vt.y - p.inherit.y * vp.y) * lead }
        }
        if (p.kind === "straight" || p.kind === "wave") {
            const timeTo = d => p.keep < 1 ? (d * (1 - p.keep) < p.speed ? Math.log(1 - d * (1 - p.keep) / p.speed) / Math.log(p.keep) : Infinity) : d / p.speed
            let t = timeTo(distance), spot = to
            for (let i = 0; i < 3 && Number.isFinite(t); i++) {
                spot = ahead(t)
                t = timeTo(Math.hypot(spot.x - from.x, spot.y - from.y))
            }
            if (!Number.isFinite(t)) return null
            return { angle: Math.atan2(spot.y - from.y, spot.x - from.x), t, clear: p.isThroughWalls || !Matter.Query.rayAny(map, from, spot), distance }
        }
        let shots = autopilot.aimArc(p, from, to, false)
        if (shots.length) shots = autopilot.aimArc(p, from, ahead(shots[0].t), false) //lead it by the flight time
        if (shots.length) shots = autopilot.aimArc(p, from, ahead(shots[0].t)) //and once more, checking for the map in the way
        if (!shots.length && p.splash) { //a little out of reach, lob it as far as it goes if the explosion or the mine's nails still get there
            const side = Math.sign(to.x - from.x) || 1
            const angle = side > 0 ? -Math.PI / 4 : -3 * Math.PI / 4
            const land = autopilot.landShot(p, angle, from, to.y)
            if (land && Math.hypot(land.x - to.x, land.y - to.y) < p.splash && !(p.fuse && land.t > p.fuse)) return { angle, t: land.t, clear: land.clear, distance }
            return null
        }
        if (!shots.length) return null
        const shot = shots.find(s => s.clear) || shots[0] //low arc unless something's in the way
        return { angle: shot.angle, t: shot.t, clear: shot.clear, distance }
    },
    chargeSince: 0, //the cycle a gun that fires on release started charging
    releaseUntil: 0,
    holdCharge(gun) { //pulse laser, railgun, and pressure foam charge while fire is held and fire when it's let go
        const cycle = simulation.cycle
        if (!gun || typeof gun.charge !== "number") return
        if (cycle < autopilot.releaseUntil) {
            input.fire = false
            return
        }
        if (input.fire && gun.charge > 0) {
            if (!autopilot.chargeSince) autopilot.chargeSince = cycle
            if (cycle - autopilot.chargeSince > 45) {
                autopilot.releaseUntil = cycle + 20
                autopilot.chargeSince = 0
                input.fire = false
            }
        } else if (!input.fire) autopilot.chargeSince = 0
    },
    fight() { //pick the closest mob in view, shoot it, and pull in power ups
        if (autopilot.flying || autopilot.warp || autopilot.grapple || autopilot.blockClear || autopilot.rayMove) {
            input.fire = input.field = false
            autopilot.target = null
            autopilot.isAiming = false
            return
        }
        const profile = autopilot.profile = autopilot.isGunAim && b.inventory.length ? autopilot.gunProfile() : null
        if (profile) autopilot.watchShots()
        const isThroughWalls = profile && profile.isThroughWalls
        let target = null, best = 1800 * 1800
        for (let i = 0; i < mob.length; i++) {
            const who = mob[i]
            if (!who.alive || who.isBadTarget || who.isInvulnerable) continue
            const dx = who.position.x - m.pos.x, dy = who.position.y - m.pos.y
            const d2 = dx * dx + dy * dy
            if (d2 < best && ((isThroughWalls && d2 < profile.reach * profile.reach) || !Matter.Query.rayAny(map, m.pos, who.position))) {
                best = d2
                target = who
            }
        }
        if (!target && profile && profile.kind === "arc") { //lob over what's in the way
            let bestLob = profile.reach * profile.reach
            for (let i = 0; i < mob.length; i++) {
                const who = mob[i]
                if (!who.alive || who.isBadTarget || who.isInvulnerable) continue
                const dx = who.position.x - m.pos.x, dy = who.position.y - m.pos.y
                if (dx * dx + dy * dy < bestLob) {
                    bestLob = dx * dx + dy * dy
                    target = who
                    best = bestLob
                }
            }
        }
        if (!autopilot.target && target) {
            autopilot.fightSince = simulation.cycle
            autopilot.fightMobCount = mob.length
        }
        if (mob.length < autopilot.fightMobCount) { //something died, keep at it
            autopilot.fightSince = simulation.cycle
            autopilot.fightMobCount = mob.length
        }
        if (target && simulation.cycle > autopilot.fightSince + 480 && simulation.cycle > autopilot.pushOnUntil) { //shooting isn't working, move on for a while
            autopilot.pushOnUntil = simulation.cycle + 600
            autopilot.fightSince = simulation.cycle + 600
        }
        autopilot.target = target
        input.fire = false
        input.field = false
        if (target) {
            if (!autopilot.isArmed() && b.inventory.length > 1 && simulation.cycle % 30 === 0) simulation.nextGun() //out of ammo, try another gun
            if (!autopilot.isArmed()) autopilot.say(b.inventory.length ? "out of ammo" : "unarmed", "can't shoot back")
            if (profile) {
                const shot = autopilot.cycleAim === simulation.cycle - 1 && autopilot.shotFor === target && simulation.cycle % 2 ? autopilot.shot : autopilot.aimAt(target, profile) //every other cycle
                autopilot.shot = shot
                autopilot.shotFor = target
                autopilot.cycleAim = simulation.cycle
                if (shot) { //the mouse goes out as far as the target, some missiles and drones go for where it is
                    autopilot.aim.x = m.pos.x + shot.distance * Math.cos(shot.angle)
                    autopilot.aim.y = m.pos.y + shot.distance * Math.sin(shot.angle)
                } else {
                    autopilot.aim.x = target.position.x
                    autopilot.aim.y = target.position.y
                }
                input.fire = !!(shot && shot.clear && shot.distance >= profile.near && !profile.isAutoFire && autopilot.isArmed()) //in reach, not too close for an explosion, and nothing in the way
                autopilot.holdCharge(b.guns[b.activeGun])
                if (input.fire) autopilot.firedAt = simulation.cycle
            } else {
                const lead = Math.min(20, Math.sqrt(best) / 45)
                autopilot.aim.x = target.position.x + target.velocity.x * lead
                autopilot.aim.y = target.position.y + target.velocity.y * lead
                input.fire = autopilot.isArmed()
            }
        }
        //the field pulls in power ups, it has to look at them unless they are close
        const field = autopilot.fieldName()
        const isFieldMoves = field === "negative mass" || field === "grappling hook" || field === "wormhole" //holding these fields lifts, hooks, or teleports the player, so only for power ups that are close
        let grab = null, near = target || isFieldMoves ? 160 * 160 : m.grabPowerUpRange2
        for (let i = 0; i < powerUp.length; i++) {
            if (!autopilot.isWanted(powerUp[i])) continue
            const dx = powerUp[i].position.x - m.pos.x, dy = powerUp[i].position.y - m.pos.y
            const d2 = dx * dx + dy * dy
            if (d2 < near && !Matter.Query.rayAny(map, m.pos, powerUp[i].position)) {
                near = d2
                grab = powerUp[i]
            }
        }
        //Keep a ray underfoot while walking or jumping off it. Field input would remove the support.
        const support = m.standingOn && (m.standingOn.parent || m.standingOn)
        const canGrab = grab && !(support?.isRay && (m.onGround || m.cycle - m.lastOnGroundCycle < 10))
        if (canGrab) {
            input.field = true
            input.fire = false
            autopilot.aim.x = grab.position.x
            autopilot.aim.y = grab.position.y
        }
        autopilot.isAiming = !!(target || canGrab)
        if (autopilot.carry) { //carrying a block to a button, the field picks it up and holding it there would throw it
            const block = autopilot.carry.block
            if (m.isHolding && m.holdingTarget !== block) m.drop() //picked up some other block while grabbing a power up
            if (m.isHolding) input.field = false
            else if (!input.field && m.holdingTarget !== block) m.holdingTarget = null
            return
        }
        //blocks: a held block is heavy and lowers jumps, so drop it, and letting go of the field doesn't pick up the block it was looking at
        if (m.isHolding) m.drop()
        else if (!input.field) m.holdingTarget = null
    },
    recoverMovement(feet, edge) {
        const cycle = simulation.cycle, x = player.position.x
        if (autopilot.startBlockClear(feet, edge)) return
        input.left = input.right = input.up = false
        autopilot.pending = null
        autopilot.blockedCycles = 0
        autopilot.watch = { x, y: feet, cycle }
        if (edge) {
            autopilot.addFail(edge)
            autopilot.plan()
            const next = autopilot.next[autopilot.cur]
            if (next && !autopilot.sameManeuver(edge, next)) {
                autopilot.why = "trying another route"
                return
            }
        }
        //If the graph offers no different route, try a few distinct movements in order.
        const dir = edge ? Math.sign(edge.dir || autopilot.nodes[edge.to].x - x) || 1 : Math.sign(level.exit.x + 50 - x) || 1
        const block = autopilot.pushCount < 2 && (!edge || edge.type === autopilot.WALK) ? autopilot.pushableBeside(x, feet) : null
        if (block) {
            autopilot.pushCount++
            autopilot.recovery = "pushing"
            autopilot.wiggleDir = Math.sign(block.position.x - x) || dir
            autopilot.wiggleUntil = cycle + 60
            return
        }
        const attempt = autopilot.isEscalate ? autopilot.stuckCount++ % 3 : 2
        autopilot.recovery = ["hopping", "taking a run", "backing away"][attempt]
        autopilot.wiggleDir = attempt === 2 ? -dir : dir
        autopilot.wiggleUntil = cycle + [30, 60, 35][attempt]
    },
    blockedStep(edge, feet, vx) {
        const cycle = simulation.cycle
        if (vx * edge.dir >= 0.6) {
            autopilot.blockedCycles = 0
            return false
        }
        if (autopilot.blockedAt !== cycle - 1 || autopilot.blockedDir !== edge.dir) autopilot.blockedCycles = 0
        autopilot.blockedAt = cycle
        autopilot.blockedDir = edge.dir
        if (++autopilot.blockedCycles === 13 && autopilot.startBlockClear(feet, edge)) return true
        if (autopilot.blockedCycles < 30) return false
        autopilot.recoverMovement(feet, edge)
        return true
    },
    drive(feet) {
        input.left = input.right = input.up = input.down = false
        autopilot.carryAim = null
        const nodes = autopilot.nodes
        const cycle = simulation.cycle
        const mc = m.cycle //the player's jump timers count with m.cycle
        const x = player.position.x
        const vx = player.velocity.x
        const go = dir => {
            if (dir > 0) input.right = true
            else if (dir < 0) input.left = true
        }
        autopilot.why = "" //what it's doing on the ground this cycle, to measure why it stops or turns around
        if (autopilot.rayMove) return autopilot.driveRay(feet)
        if (autopilot.goalType === "exit" && autopilot.isInExit()) return void (autopilot.why = "in the exit") //stand still while the exit charges
        if (autopilot.flying) return autopilot.flyPath(feet, go)
        if (autopilot.warp) return autopilot.doWarp()
        if (autopilot.grapple) return autopilot.doGrapple(feet, go)
        if (autopilot.blockClear) return autopilot.driveBlockClear(feet)
        if (autopilot.goalType === "explore" && m.onGround && !autopilot.relink.size) {
            const support = m.standingOn && (m.standingOn.parent || m.standingOn)
            if ((autopilot.dyn.has(support) || (Math.abs(vx) < 2 && cycle % 15 === 0)) && autopilot.startBlockClear(feet, null)) return
        }
        if (cycle < autopilot.wiggleUntil && m.onGround) { //stuck, try something, see the stuck check
            const left = autopilot.wiggleUntil - cycle
            const kind = autopilot.recovery
            autopilot.why = "stuck, " + kind
            if (kind === "pushing") { //lean on the block beside it, no hopping, so it slides out of the way
                go(autopilot.wiggleDir)
            } else if (kind === "hopping") { //a low step or a block, hop at it
                go(autopilot.wiggleDir)
                input.up = left > 20
            } else if (kind === "taking a run") { //back up, then run and jump
                go(left > 25 ? -autopilot.wiggleDir : autopilot.wiggleDir)
                input.up = left < 12
            } else { //back away far enough to approach from a different spot
                go(autopilot.wiggleDir)
            }
            autopilot.pending = null
            return
        }
        const pending = autopilot.pending
        if (!m.onGround) autopilot.commit = null //committed only until it leaves the ground
        if (pending && pending.isJump && m.buttonCD_jump === pending.mcycle) { //the jump pressed last cycle took off
            autopilot.flight = { edge: pending.edge, to: pending.edge.to, since: cycle, mStart: pending.mcycle, isJumped: true, isWindowed: !!pending.isWindowed, takeoffX: x, takeoffVx: vx, heldBlock: m.isHolding && m.holdingTarget, apexY: feet }
            autopilot.flight.takeoff = autopilot.recordTakeoff(pending.edge, x - vx, feet - player.velocity.y, autopilot.flight.isWindowed ? "windowed" : pending.edge.isLeap ? "leap" : "planned")
            autopilot.pending = null
        }
        if (!m.onGround || (autopilot.flight && mc - autopilot.flight.mStart < 10)) return autopilot.fly(feet, go) //the feet stay on the ground for a few cycles after a jump
        //on the ground
        if (autopilot.flight) { //just landed
            const flight = autopilot.flight
            autopilot.flight = null
            const edge = flight.edge
            if (edge && (edge.type !== autopilot.JUMP || flight.isJumped)) {
                const tally = autopilot.stats[autopilot.edgeNames[edge.type]]
                const to = nodes[edge.to]
                const isGood = (Math.abs(to.x - x) < 40 && Math.abs(to.y - feet) < 30) || (autopilot.dist && Number.isFinite(autopilot.dist[autopilot.cur]) && autopilot.dist[autopilot.cur] <= autopilot.dist[edge.to] + 5) //there, or somewhere as close to the goal
                if (tally) {
                    const kind = edge.coyote ? "coyote" : edge.isLeap ? "leap" : flight.isWindowed ? "windowed" : "planned"
                    const tallyKind = autopilot.jumpKinds[kind] = autopilot.jumpKinds[kind] || [0, 0]
                    if (edge.type === autopilot.JUMP) tallyKind[0]++
                    if (edge.type === autopilot.JUMP && isGood) tallyKind[1]++
                    tally[0]++
                    if (isGood) tally[1]++
                    else if (autopilot.misses.length < 200) autopilot.misses.push({ type: autopilot.edgeNames[edge.type], run: edge.isRun, most: +edge.most.toFixed(1), dir: edge.dir, dx: Math.round(to.x - nodes[edge.from].x), dy: Math.round(to.y - nodes[edge.from].y), offX: Math.round((x - to.x) * edge.dir), offY: Math.round(feet - to.y), takeoff: Math.round(flight.takeoffX - nodes[edge.from].x), vx: +flight.takeoffVx.toFixed(1), delay: edge.delay || 0, hold: edge.hold || 0, kind, lands: [Math.round(x - to.x), Math.round(feet - to.y)] })
                }
                if (flight.takeoff) flight.takeoff.isGood = isGood
                if (edge.type === autopilot.JUMP && autopilot.recoverLoadedJump(flight, isGood)) return
                if (!isGood && autopilot.dist && !(autopilot.dist[autopilot.cur] < autopilot.dist[edge.from])) {
                    autopilot.addFail(edge)
                    return
                }
            }
        }
        if (tech.isRay && m.fieldMode === 2 && autopilot.tryRay(feet, autopilot.next?.[autopilot.cur])) return autopilot.driveRay(feet)
        //Catch stalls that did not report a failed landing or a blocked step.
        if (cycle > autopilot.watch.cycle + 150) {
            const moved = Math.abs(x - autopilot.watch.x) + Math.abs(feet - autopilot.watch.y)
            autopilot.watch = { x, y: feet, cycle }
            const isWaiting = (autopilot.cur >= 0 && autopilot.cur === autopilot.goal) || autopilot.isHolding
            if (moved < 50 && !isWaiting && !autopilot.carry) {
                const edge = autopilot.next && autopilot.cur >= 0 ? autopilot.next[autopilot.cur] : null
                return autopilot.recoverMovement(feet, edge)
            }
            if (moved >= 150) autopilot.stuckCount = autopilot.pushCount = 0
        }
        autopilot.isHolding = false
        autopilot.pending = null
        if (autopilot.driveCarry(go)) return
        if (tech.isScaleInvariance && player.scale > 1 && (autopilot.cur < 0 || autopilot.cur !== autopilot.goal)) {
            const edge = autopilot.next?.[autopilot.cur]
            const to = edge && nodes[edge.to]
            const nearCrouch = to?.isCrouch && Math.abs(to.x - x) < 1.5 * autopilot.cell
            if (nearCrouch || nodes[autopilot.cur]?.isCrouch || (!edge && !autopilot.relink.size)) {
                autopilot.why = "shrinking for clearance"
                input.down = true
                return
            }
        }
        if (autopilot.cur < 0 || !autopilot.next) return void (autopilot.why = "no plan")
        //on a slope too steep to stand on, well below the spot it's matched to, the plan's moves don't start from here, slide to the bottom
        const steep = m.onGround && autopilot.isLipTakeoff && nodes[autopilot.cur].y < feet - 20 ? autopilot.surfaceAt(x, feet, 10, 40) : null //on a slope the player touches it off center
        if (steep && Math.abs((steep.edge.y2 - steep.edge.y1) / (steep.edge.x2 - steep.edge.x1)) > 1) {
            if (!autopilot.slideSince) autopilot.slideSince = cycle
            if (cycle - autopilot.slideSince < 90) return void (autopilot.why = "sliding down a slope") //a slope that doesn't end, back to the plan
        } else autopilot.slideSince = 0
        //fighting changes how it travels, it keeps going while shooting, it backs away from a mob that gets close and holds only to shoot the mob it's hunting,
        //each starts at one distance and ends at a farther one, so a mob moving around the line doesn't flip it every cycle
        const target = autopilot.target
        if (!autopilot.isSmoothCombat && target && autopilot.isArmed() && cycle > autopilot.pushOnUntil) { //the old way, to compare: stop within 750, back away within 420
            const dx = target.position.x - x
            const distance = Math.hypot(dx, target.position.y - m.pos.y)
            if (distance < 750) {
                autopilot.why = distance < 420 ? "backing from a mob" : "holding for a mob"
                autopilot.isHolding = true
                if (distance < 420) {
                    const away = dx > 0 ? -1 : 1
                    const edge = nodes[autopilot.cur].edges.find(e => e.type === autopilot.WALK && e.dir === away)
                    if (edge && !nodes[edge.to].isBoost) go(away)
                }
                return
            }
        } else if (target && autopilot.isArmed() && cycle > autopilot.pushOnUntil) {
            const dx = target.position.x - x
            const distance = Math.hypot(dx, target.position.y - m.pos.y)
            const p = autopilot.profile
            const backAt = Math.max(260, p ? p.near + 40 : 0), holdAt = p ? Math.min(550, 0.8 * p.reach) : 550 //too close for its explosions, and close enough for its reach
            autopilot.combat = distance < (autopilot.combat === "back" ? backAt + 120 : backAt) ? "back" :
                autopilot.goalType === "mob" && autopilot.goalWho === target && distance < (autopilot.combat === "hold" ? holdAt + 150 : holdAt) ? "hold" : ""
            if (autopilot.combat === "back") { //back away, if there's ground that way
                const away = dx > 0 ? -1 : 1
                const edge = nodes[autopilot.cur].edges.find(e => e.type === autopilot.WALK && e.dir === away)
                if (edge && !nodes[edge.to].isBoost) {
                    autopilot.why = "backing from a mob"
                    autopilot.isHolding = true
                    return go(away)
                }
            } else if (autopilot.combat === "hold") {
                autopilot.why = "shooting the mob it's hunting"
                autopilot.isHolding = true
                return
            }
        } else autopilot.combat = ""
        if (autopilot.backUp) {
            autopilot.why = "backing up to run"
            if (cycle < autopilot.backUp.until) return go(autopilot.backUp.dir)
            autopilot.backUp = null
        }
        if (autopilot.goalType === "trigger" && autopilot.goalWho && (autopilot.cur === autopilot.goal || (autopilot.goalWho.arrivedAt && Math.abs(nodes[autopilot.goal].x - x) < 150))) {
            autopilot.why = "working a button"
            return autopilot.workTrigger(go)
        }
        let edge = autopilot.next[autopilot.cur]
        if (edge && edge.type === autopilot.JUMP && (edge.isRun || edge.coyote) && vx * edge.dir < 3 && autopilot.isUseAlternatives) edge = autopilot.standingAlternative(edge)
        const committed = autopilot.committedEdge(edge, x, feet) //a jump it's lining up for, kept while the plan around it shifts
        if (committed) edge = committed
        if (cycle % 20 === 7 && autopilot.cur !== autopilot.goal && !autopilot.riding) { //a field or tech that flies or teleports, used when it's much faster than the plan, or there's no plan
            if (autopilot.findWarp()) return autopilot.doWarp()
            if (autopilot.findGrapple(feet)) return autopilot.doGrapple(feet, go)
            if (autopilot.findFlight(feet)) return autopilot.flyPath(feet, go)
        }
        if (!edge) return void (autopilot.why = autopilot.cur === autopilot.goal ? "at the goal" : "no way to the goal")
        const from = nodes[edge.from]
        const to = nodes[edge.to]
        const canJump = !m.crouch && m.hardLandCD < mc && m.buttonCD_jump + 20 < mc //see m.groundControl()
        const riding = autopilot.riding
        const wait = note => { //for an elevator, it fails if nothing comes
            autopilot.why = note
            autopilot.isHolding = true
            if (!autopilot.waitSince) autopilot.waitSince = cycle
            if (riding) {
                const progress = autopilot.rideProgress
                if (!progress || progress.who !== riding || Math.abs(riding.position.y - progress.y) > 10) {
                    autopilot.rideProgress = { who: riding, y: riding.position.y }
                    autopilot.waitSince = cycle
                }
            }
            if (cycle > autopilot.waitSince + 600) { //it isn't coming, maybe a toggle or button turns it on
                autopilot.addFail(edge, 3)
                autopilot.waitSince = 0
                if (to.elevator || riding) autopilot.elevatorStuckUntil = cycle + 1200
            }
            if (cycle > autopilot.waitSince + 30) autopilot.say("waiting", note)
        }
        if (to.cover >= 3000 && !riding && !to.elevator && autopilot.isDoorIn(to)) { //a closed door, or a platform moving through, pushing into it does nothing, wait a step before it
            if (tech.isRay && m.fieldMode === 2 && autopilot.tryRay(feet, edge, to.x)) return autopilot.driveRay(feet)
            if (autopilot.startBlockClear(feet, edge)) return
            if (Math.abs(from.x - x) > 12) go(from.x - x)
            return wait("for a door")
        }
        if (riding) {
            const isLeaving = edge.type !== autopilot.RIDE && to.elevator !== riding
            if (!isLeaving || Math.abs(feet - from.y) > 70) {
                const drop = !m.crouch ? autopilot.elevatorDrop(riding, edge, feet) : null
                if (drop) {
                    autopilot.why = "stepping off the elevator"
                    autopilot.waitSince = 0
                    autopilot.pending = { edge: drop, mcycle: mc, isJump: false }
                    go(drop.dir)
                    return
                }
                if (Math.abs(riding.holdX - x) > 15) go(riding.holdX - x)
                return wait("riding the elevator")
            }
            if (edge.type !== autopilot.JUMP) { //near the stop, step or hop off before it leaves
                go(Math.sign(to.x - x) || edge.dir)
                if (to.y < feet - 10 && canJump) input.up = true
                autopilot.waitSince = 0
                return
            }
        } else if (to.elevator) { //getting on, it has to be at the stop by the time the player is
            const top = to.elevator.bounds.min.y
            if (!autopilot.boardingReady(edge, x)) return wait("for the elevator")
            if (top < feet - 20 && top > feet - 150 && canJump) input.up = true //it's a little above, hop on
        }
        autopilot.waitSince = 0
        if (canJump && !riding && !from.isCrouch && cycle % 3 === 0 && edge.type !== autopilot.BOOST) { //a jump from right here that beats the plan
            let leap = autopilot.bestLeap(feet)
            if (leap) {
                const later = autopilot.bestLeap(feet, 4)
                if (later && later.value <= leap.value + 2) leap = null //as good a few cycles from now, wait for it
            }
            if (leap) {
                autopilot.why = "shortcut jump"
                input.up = true
                go(leap.steer || leap.dir)
                autopilot.pending = { edge: leap, mcycle: mc, isJump: true }
                return
            }
        }
        if (!tech.isScaleInvariance && (from.isCrouch || (edge.type === autopilot.WALK && nodes[edge.to].isCrouch))) input.down = true
        //the next jump on the plan, this edge or one a step or two of walking ahead, can it be taken from right here, so it doesn't rock back and forth lining up
        let ahead = edge
        for (let i = 0; i < autopilot.cellsFor(100) && ahead && ahead.type === autopilot.WALK; i++) ahead = autopilot.next[ahead.to]
        //close to the planned spot it can jump from where it is, farther off, up to 120 away, only if the jump still lands when the player is a little off where and how fast they are,
        //so it keeps its running speed instead of slowing down to line up, jumps from farther off without that check land worse and look early
        const spotOf = e => e.takeoffX !== undefined ? e.takeoffX : nodes[e.from].x //where the planned jump leaves the ground
        const offTakeoff = ahead ? Math.abs(spotOf(ahead) - x) : Infinity
        const isNearTakeoff = ahead && Math.abs(nodes[ahead.from].y - feet) < 30 && (offTakeoff < 30 || (offTakeoff < 120 && Math.abs(vx) > 2 && autopilot.isMomentumJump && autopilot.canJumpFromHere(ahead, feet, 0, true)))
        if (ahead && ahead.type === autopilot.JUMP && !ahead.coyote && autopilot.isJumpWindow && isNearTakeoff && canJump && !riding && autopilot.canJumpFromHere(ahead, feet, 0, true)) { //still lands if the player is a little off, or a little faster or slower, a jump that just makes it in the simulation comes up short
            //the jump works from here, but jump in the middle of the stretch it works from, not at its first cycle, so it isn't early
            const key = autopilot.edgeKey(ahead)
            if (autopilot.window.key !== key) autopilot.window = { key, start: mc }
            let left = 0 //how many more cycles it still works, if the player keeps going
            let isLater = false //a later moment lands clearly better, wait for it
            if (autopilot.isLipTakeoff) { //score jumping now and a little later, off the top of a corner, down its slope, or off the end in coyote time, by where each lands
                const now = autopilot.jumpValue(ahead, feet, 0)
                const later = [3, 6, 9, 12].map(frames => autopilot.jumpValue(ahead, feet, frames))
                const best = Math.min(now, ...later)
                isLater = now > best + 2
                for (let i = 0; i < later.length && later[i] <= best + 2; i++) left = 3 * (i + 1)
            } else {
                for (const frames of [3, 6, 9, 12]) {
                    if (!autopilot.canJumpFromHere(ahead, feet, frames)) break
                    left = frames
                }
            }
            autopilot.why = isLater ? "waiting for a better takeoff" : "waiting for the middle of a jump window"
            if (isLater) autopilot.window.start = mc //the stretch it works from starts when now is as good as later
            else if (mc - autopilot.window.start >= left) {
                autopilot.why = "jump"
                input.up = true
                if (!ahead.delay) go(ahead.blockJumps ? ahead.steer : ahead.steer || ahead.dir) //a delayed jump goes straight up first
                autopilot.pending = { edge: ahead, mcycle: mc, isJump: true, isWindowed: true }
                return
            }
        } else autopilot.window.key = ""
        if (edge.type === autopilot.PORTAL) { //walk in, it lands like a jump, see fly()
            autopilot.why = "walking into a portal"
            go(edge.dir)
            autopilot.pending = { edge, mcycle: mc, isJump: false }
            return
        }
        if (edge.type === autopilot.WALK) {
            autopilot.why = "walking"
            go(edge.dir)
            if (from.y - to.y > 16 && canJump && (to.x - x) * edge.dir < 30 + 3 * Math.abs(vx)) { //a step up taller than the slanted foot rides over, hop it without slowing down
                input.up = true
                autopilot.why = "hopping a step"
                autopilot.pending = { edge, mcycle: mc, isJump: false } //in the air it keeps walking, see fly()
            }
            autopilot.blockedStep(edge, feet, vx)
            return
        }
        if (edge.type === autopilot.JUMP && edge.coyote) { //run off the edge, the jump is pressed in the air, see fly()
            autopilot.why = "running off for a coyote jump"
            const past = (x - spotOf(edge)) * edge.dir //from the corner it runs off, it needs full speed there
            if (past > -20 && vx * edge.dir < 3) {
                autopilot.backUp = { dir: -edge.dir, until: cycle + 24 } //get room to run
                go(-edge.dir)
            } else go(edge.dir)
            autopilot.pending = { edge, mcycle: mc, isJump: true }
            return
        }
        if (edge.type === autopilot.JUMP) {
            const toSpot = spotOf(edge) - x //the arc was simulated from here, the middle of the node or the top of a corner
            const past = -toSpot * edge.dir //how far past the takeoff spot, in the jump's direction
            const press = () => {
                input.up = true
                if (!edge.delay) go(edge.blockJumps ? edge.steer : edge.dir) //a delayed jump goes straight up first
                edge = autopilot.fitJumpHeight(edge, feet)
            }
            const stopping = Math.abs(vx) * 11 //how far ground friction slides the player with no key held
            autopilot.why = edge.isRun ? "running jump" : "lining up a standing jump"
            if (edge.isRun && Math.abs(toSpot) < 80) autopilot.commitTo(edge) //a run-up, switching plans mid run backs it up again, standing jumps are better off taking the spot it slid to
            if (edge.isRun) {
                if (vx * edge.dir > 5.5 && past + vx * edge.dir > -4) { //reaches the spot this cycle
                    if (canJump) press()
                    else go(edge.dir)
                } else if (past > -20 && vx * edge.dir < 3) {
                    autopilot.backUp = { dir: -edge.dir, until: cycle + 24 } //get room to run
                    go(-edge.dir)
                } else go(edge.dir)
            } else if (Math.abs(toSpot) < 12 && Math.abs(vx) < 1.5) {
                if (canJump) press()
            } else if (toSpot * vx > 0 && stopping > Math.abs(toSpot) - 8) {
                //coasting, ground friction stops the player about on the spot
            } else if (toSpot * vx < 0 && Math.abs(toSpot) < 30) {
                //slid a little past it, let friction stop the player before walking back, so it doesn't rock back and forth
                if (Math.abs(vx) < 0.5) go(toSpot)
            } else go(toSpot)
            autopilot.pending = { edge, mcycle: mc, isJump: true } //walking off the edge before the jump still jumps, with coyote time
            return
        }
        //walk off a ledge or onto a boost
        autopilot.why = "walking off"
        go(edge.dir)
        autopilot.pending = { edge, mcycle: mc, isJump: false }
        if (edge.type === autopilot.FALL) autopilot.blockedStep(edge, feet, vx)
    },
    standingAlternative(edge) {
        const { dist, nodes } = autopilot
        let best = edge
        let cost = autopilot.edgeCost(edge) + autopilot.retryCost(edge) + dist[edge.to] + 15 //allow a little extra to avoid a run-up
        for (const option of nodes[edge.from].edges) {
            if (option.type !== autopilot.JUMP || option.isRun || option.coyote || autopilot.retryCost(option)) continue
            const value = autopilot.edgeCost(option) + dist[option.to]
            if (value < cost) {
                best = option
                cost = value
            }
        }
        return best
    },
    isJumpWindow: true, //near a planned jump, jump from where the player is, in the middle of the stretch it works from, false only jumps from the planned spot
    window: { key: "", start: 0 }, //the jump that works from here, by its edgeKey(), relinking makes new edge objects, and the cycle it started working
    commit: null, //{ key, from, start } the jump it's lining up for
    committedEdge(planned, x, feet) { //keep going for the jump it committed to unless it's gone, much worse than the plan, too far away, or taking too long
        const c = autopilot.commit
        if (!c || !autopilot.isCommit) return null
        const node = autopilot.nodes[c.from]
        const edge = node && !node.dead ? node.edges.find(e => autopilot.edgeKey(e) === c.key) : null
        const dist = autopilot.dist
        const isWorse = edge && dist && planned && dist[edge.to] + autopilot.edgeCost(edge) > dist[planned.from] + 60
        if (!edge || (autopilot.retryCost(edge) && planned && !autopilot.sameManeuver(edge, planned)) || isWorse || Math.abs(node.x - x) > 150 || Math.abs(node.y - feet) > 60 || simulation.cycle > c.start + 240) {
            autopilot.commit = null
            return null
        }
        return edge
    },
    commitTo(edge) {
        const key = autopilot.edgeKey(edge)
        if (!autopilot.commit || autopilot.commit.key !== key) autopilot.commit = { key, from: edge.from, start: simulation.cycle }
    },
    jumpValue(edge, feet, frames) { //jumping in frames cycles, holding the planned air control: the landing's time to the goal plus its risk, Infinity if it won't do
        const { dist, nodes, p } = autopilot
        const vx = player.velocity.x, dir = Math.sign(vx) || edge.dir
        let x = player.position.x + vx * frames, y = feet
        if (frames) { //where the feet will be, still on the ground, maybe down a slope, or off the end in coyote time
            const ground = autopilot.surfaceAt(x, feet, 25, 60)
            if (ground) y = ground.y
            else {
                const lip = autopilot.lipFor(player.position.x, feet, dir)
                if (!lip || lip.isBehind) return Infinity
                const air = frames - Math.max(0, (lip.x - player.position.x) * dir / Math.max(1, Math.abs(vx)))
                if (air > m.coyoteCycles - 2) return Infinity
                y = lip.y + 0.5 * p.gravity * air * air
            }
        }
        const hit = autopilot.arc(x, y, vx, -p.jump, edge.steer, edge.most, true, autopilot.size(), edge.delay || 0, true, edge.hold || Infinity, edge.blockJumps)
        if (!hit || hit.isWet || !(dist[hit.node] <= dist[edge.to] + 30)) return Infinity
        if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles + frames, landingVy: hit.vy }, x)) return Infinity
        return dist[hit.node] + autopilot.landingRisk(hit.node, Math.sign(nodes[hit.node].x - x) || dir)
    },
    isMomentumJump: true, //jump at running speed from farther off when it's safe, see drive(), false to compare in tools/autopilot-test.js
    jumpHasCeiling(x, feet, dir) {
        const { halfWidth, height } = autopilot.size()
        const reach = Math.min(300, autopilot.p.limit * 40)
        const apex = autopilot.p.jump ** 2 / (2 * autopilot.p.gravity)
        return !!autopilot.grid && autopilot.isBoxSolidExact(Math.min(x, x + dir * reach) - halfWidth, feet - apex - height, Math.max(x, x + dir * reach) + halfWidth, feet - height)
    },
    fitJumpHeight(edge, feet) { //the same landing can need a different hold at the player's actual takeoff speed
        const { p, nodes, dist } = autopilot
        const x = player.position.x, vx = player.velocity.x
        if (edge.delay || edge.blockJumps || !autopilot.jumpHasCeiling(x, feet, edge.dir)) return edge
        const size = autopilot.size()
        const target = nodes[edge.to]
        let best = edge, bestScore = Infinity
        for (const hold of new Set([edge.hold, 8, 10, 11, 12, 14, 16, 18, 20, undefined])) {
            const hit = autopilot.arc(x, feet, vx, -p.jump, edge.steer, edge.most, true, size, 0, true, hold)
            if (!hit || hit.isWet || !Number.isFinite(dist[hit.node])) continue
            if (dist[hit.node] > dist[edge.to] + 30 || Math.abs(nodes[hit.node].y - target.y) > 40) continue
            if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles, landingVy: hit.vy }, x)) continue
            const candidate = { ...edge, to: hit.node, hold }
            if (hold !== edge.hold && autopilot.retryCost(candidate)) continue
            const landing = autopilot.surfaceAt(hit.x, nodes[hit.node].y)
            const slope = landing ? Math.abs((landing.edge.y2 - landing.edge.y1) / (landing.edge.x2 - landing.edge.x1)) : 0
            const score = hit.cycles + dist[hit.node] + autopilot.landingRisk(hit.node, edge.dir) + 0.15 * (feet - hit.apexY) + 0.2 * Math.abs(hit.x - target.x) + (slope > autopilot.lipDrop ? 60 : 0)
            if (score < bestScore) {
                best = candidate
                bestScore = score
            }
        }
        return best
    },
    canJumpFromHere(edge, feet, frames = 0, isRobust = false) { //the planned jump, from where the player is, or will be in a few cycles, lands where planned or somewhere as good
        //isRobust also checks it lands that well starting 10 to either side and 1 slower and faster
        if (isRobust) {
            for (const [dx, dvx] of [[0, 0], [-10, 0], [10, 0], [0, -1], [0, 1]]) {
                if (!autopilot.canJumpFromHere(edge, feet, frames, false, dx, dvx)) return false
            }
            return true
        }
        const dx = arguments[4] || 0, dvx = arguments[5] || 0
        const { dist, nodes, p } = autopilot
        const x = player.position.x + dx + player.velocity.x * frames
        if (frames && !autopilot.isBoxSolid(x - 18, feet + 1, x + 18, feet + 6 + frames * frames * p.gravity)) return false //past the ledge by then, too far into coyote time to count on
        const hit = autopilot.arc(x, feet, player.velocity.x + dvx, -p.jump, edge.steer, edge.most, true, autopilot.size(), edge.delay || 0, true, edge.hold || Infinity, edge.blockJumps)
        if (!hit || hit.isWet) return false
        if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles + frames, landingVy: hit.vy }, x)) return false
        if (hit.node === edge.to) return true
        const to = nodes[edge.to], land = nodes[hit.node] //or right beside where it was planned, landings elsewhere tend to be on the edge of something
        return Math.abs(land.x - to.x) <= 25 && Math.abs(land.y - to.y) < 15 && dist[hit.node] <= dist[edge.to] + 3 && land.cover < 1000
    },
    bestLeap(feet, frames = 0) { //simulate jumping now, or in a few cycles, from where the player is and how fast they're going, the best landing if it's closer than the plan
        const { dist, nodes, p } = autopilot
        const cur = autopilot.cur
        const here = dist[cur]
        if (!(here < Infinity)) return null
        const size = autopilot.size()
        const vx = player.velocity.x
        const x = player.position.x + vx * frames
        if (frames && !autopilot.isBoxSolid(x - 18, feet + 1, x + 18, feet + 6)) return null //not on the ground by then
        let best = null, bestValue = here - 20 + frames //worth it only if it saves some time
        for (const steer of [-1, 0, 1]) {
            const tries = steer ? [{ most: p.limit }, { most: p.limit * 0.4 }] : [{ most: 0 }]
            if (steer && autopilot.jumpHasCeiling(x, feet, steer)) {
                for (const hold of [8, 11, 14, 17, 20]) tries.push({ most: p.limit, hold })
            }
            for (const { most, hold } of tries) {
                const hit = autopilot.arc(x, feet, vx, -p.jump, steer, most, true, size, 0, true, hold)
                if (!hit || hit.isWet || !(dist[hit.node] < Infinity)) continue
                if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles + frames, landingVy: hit.vy }, x)) continue
                const edge = { from: cur, to: hit.node, type: autopilot.JUMP, dir: steer || Math.sign(nodes[hit.node].x - x) || 1, cost: hit.cycles + 12, steer, most, hold, isRun: false, coyote: 0, isLeap: true }
                edge.fail = autopilot.failed.get(autopilot.edgeKey(edge)) || 0
                if (edge.fail >= 2 || autopilot.retryCost(edge)) continue
                const value = autopilot.edgeCost(edge) + dist[hit.node]
                if (value < bestValue) {
                    //a shortcut has to have room to spare, it still lands about as well a little behind and a little slower, a leap at the edge of its reach comes up short
                    const isRoom = [[-steer * 10, 0], [0, -0.6 * (Math.sign(vx) || steer)]].every(([dx, dvx]) => {
                        const worse = autopilot.arc(x + dx, feet, vx + dvx, -p.jump, steer, most, true, size, 0, true, hold)
                        return worse && !worse.isWet && dist[worse.node] <= dist[hit.node] + 20
                    })
                    if (!isRoom) continue
                    bestValue = value
                    best = edge
                }
            }
        }
        if (best) best.value = bestValue - frames
        return best
    },
    fly(feet, go) { //in the air, or just jumped
        const nodes = autopilot.nodes
        const cycle = simulation.cycle
        const mc = m.cycle
        const x = player.position.x
        const vx = player.velocity.x, vy = player.velocity.y
        if (!autopilot.flight) { //just left the ground, by the edge that was being started if it was this cycle or the last few
            const pending = autopilot.pending
            const walk = autopilot.cur >= 0 && autopilot.next ? autopilot.next[autopilot.cur] : null
            const edge = pending && mc - pending.mcycle <= 3 ? pending.edge : walk && walk.type === autopilot.WALK && Math.abs(vy) < 8 ? walk : null //walking, a low bump lifted the feet
            autopilot.flight = { edge, to: edge ? edge.to : -1, since: cycle, mStart: mc, isJumped: false, takeoffX: x, takeoffVx: vx }
            autopilot.pending = null
        }
        const flight = autopilot.flight
        if (flight.lastVx === undefined) { //how fast the player was going last cycle, on the ground
            flight.lastVx = autopilot.lastV.x
            flight.lastVy = autopilot.lastV.y
        }
        const isJustJumped = mc - m.buttonCD_jump < 3
        const isTooFast = Math.abs(vx) > 12 || vy < -28 //faster than a jump, a boost under the jump
        const isBlockLaunch = isJustJumped && (m.buttonCD_jump === flight.blockJumpAt || m.buttonCD_jump === flight.lastBlockJump)
        if (Math.hypot(vx - flight.lastVx, vy - flight.lastVy) > 15 && (!isJustJumped || (isTooFast && !isBlockLaunch))) { //thrown by a boost, or knocked by something, fly by simulating from here
            const below = autopilot.nodeBelow(x, feet - 40, 2) //the boost it came from, for remembering misses
            flight.from = below >= 0 && nodes[below].isBoost ? below : autopilot.cur
            flight.isLaunched = true
            flight.isJumped = false
            flight.since = cycle
            flight.edge = null
            flight.to = -1
            flight.replanAt = cycle
        }
        flight.lastVx = vx
        flight.lastVy = vy
        if (flight.edge && flight.edge.type === autopilot.JUMP && !flight.isJumped) {
            if (m.buttonCD_jump >= flight.mStart) {
                flight.isJumped = true
                flight.heldBlock = m.isHolding && m.holdingTarget
                flight.apexY = feet
                flight.takeoff = autopilot.recordTakeoff(flight.edge, x - vx, feet - vy, "coyote")
            } else if (mc < m.lastOnGroundCycle + m.coyoteCycles && m.buttonCD_jump + 20 < mc) {
                //a coyote jump waits the cycles it was planned with, a jump that walked off by mistake goes now, see m.airControl()
                if (mc - m.lastOnGroundCycle >= (flight.edge.coyote || 0)) input.up = true
            } else { //too late, just falling
                flight.edge = null
                flight.to = -1
            }
        }
        if (flight.edge && flight.edge.type === autopilot.JUMP && flight.isJumped) {
            flight.apexY = Math.min(flight.apexY ?? feet, feet)
            //hold jump through the rise and the hang at the top, like the arc, letting go early cuts the jump short
            //but not when landing, holding jump then would jump again
            const isLanding = vy > 0 && autopilot.isBoxSolid(x - 14, feet + 1, x + 14, feet + vy + 6)
            input.up = mc - m.buttonCD_jump < Math.min(60, flight.edge.hold || 60) && vy < m.apexSpeed && !isLanding //a short hop lets go early
            if (flight.edge.blockJumps && autopilot.doBlockJump(flight, go, isLanding)) return
        }
        if ((!flight.edge || flight.isLaunched) && cycle >= (flight.replanAt || 0) && autopilot.dist) { //no plan for this flight, or a boost's drift, find the best landing from here, again every few cycles
            flight.replanAt = cycle + 6
            autopilot.planFlight(flight, feet)
        }
        const to = flight.to
        if (to < 0 || nodes[to].dead) return
        const target = nodes[to]
        const edge = flight.edge
        if (edge && edge.type === autopilot.WALK && !flight.isLaunched && feet < target.y + 60) { //riding over a low bump or stepping down, the feet leave the ground for a moment, keep walking at full speed
            go(edge.dir)
            return
        }
        if (vy > 0.5 && feet < target.y + 2 && (!flight.isLaunched || target.y - feet < 250)) { //coming down, steer so it lands somewhere good, set up for the next move
            if (autopilot.isLandingSpan) {
                if (cycle >= (flight.landAt || 0)) {
                    flight.landAt = cycle + 3
                    flight.landSteer = autopilot.landingSteer(to, feet)
                }
                const land = flight.landSteer
                if (land.steer && vx * land.steer < land.most) go(land.steer) //up to its speed, most 0 against the way it's going brakes to a stop
            } else {
                const g = autopilot.p.gravity
                const t = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, target.y - feet))) / g
                const miss = target.x - (x + vx * t)
                if (Math.abs(miss) > 8) go(miss)
            }
        } else if (edge) { //push like the arc did, after its delay
            if (edge.steer && vx * edge.steer < edge.most && (!edge.delay || mc - flight.mStart >= edge.delay)) go(edge.steer)
        }
    },
    doBlockJump(flight, go, isLanding) {
        const mc = m.cycle, edge = flight.edge
        const remaining = simulation.ephemera.filter(effect => effect.name === "blockJump" && effect.blockJumpPhase !== 2)
        if (flight.blockJumpAt) {
            if (m.buttonCD_jump === flight.blockJumpAt) {
                flight.lastBlockJump = flight.blockJumpAt
                flight.blockJumpsUsed = (flight.blockJumpsUsed || 0) + 1
            }
            flight.blockJumpAt = 0
        }
        if ((flight.blockJumpsUsed || 0) >= edge.blockJumps || !remaining.length) return false
        const age = mc - m.buttonCD_jump
        const armed = remaining.some(effect => effect.blockJumpPhase === 1)
        //One release arms every stack. An armed stack fires as soon as Up is held past its cooldown.
        input.up = !isLanding && (age <= 10 || (armed ? mc >= m.lastOnGroundCycle + m.coyoteCycles : player.velocity.y < -1.5 && age < 60))
        if (input.up && age > 10 && armed) {
            flight.blockJumpAt = mc
            autopilot.why = "jumping off working mass"
        }
        if (edge.steer && player.velocity.x * edge.steer < edge.most) go(edge.steer)
        return true
    },
    isLandingSpan: true, //land anywhere on the target or the next steps of the plan, false aims at the target's middle, for tools/autopilot-test.js
    landingSteer(to, feet) { //simulate the rest of the fall steering a few ways, { steer, most }, and pick one that lands on the target or the next few steps after it, well away from the ends of a narrow ledge, pushing the way the plan goes next
        const { nodes, next, p } = autopilot
        const span = new Set([to])
        let at = to
        for (let i = 0; i < autopilot.cellsFor(100); i++) { //landing farther along is as good
            const step = next && next[at]
            if (!step || step.type !== autopilot.WALK) break
            span.add(at = step.to)
        }
        const back = autopilot.walkTo(nodes[to], -(next && next[to] ? next[to].dir : 1))
        if (back >= 0) span.add(back) //a step short is fine too
        const along = new Map() //the rest of the ledge it's landing on, near the target, a little worse the farther it is
        for (const dir of [-1, 1]) {
            let on = to
            for (let i = 0; i < autopilot.cellsFor(100); i++) {
                on = autopilot.walkTo(nodes[on], dir)
                if (on < 0) break
                if (!span.has(on)) along.set(on, Math.abs(nodes[on].x - nodes[to].x) / 50)
            }
        }
        const nextDir = next && next[to] ? Math.sign(next[to].dir) : 0
        const size = autopilot.size()
        const ahead = nextDir || 1, vx = player.velocity.x
        const ways = [[ahead, p.limit], [0, 0], [-ahead, p.limit], [-ahead, p.limit * 0.3], [ahead, p.limit * 0.3]] //all the way, coast, back, and gently
        if (Math.abs(vx) > 0.5) ways.push([-Math.sign(vx), 0]) //brake to a stop over where it is
        let best = { steer: 0, most: 0 }, bestScore = Infinity
        for (const [steer, most] of ways) {
            const hit = autopilot.arc(player.position.x, feet, vx, player.velocity.y, steer, most, false, size, 0, true)
            let score
            if (hit && (span.has(hit.node) || along.has(hit.node))) {
                score = (steer === nextDir && most === p.limit ? 0 : steer === 0 ? 1 : 2) + (along.get(hit.node) || 0) //in the span, best moving the way it goes next
                if (autopilot.isLipTakeoff) { //near the end of a ledge, or sliding toward it after landing, a little off and it slides off
                    const rest = hit.x + hit.vx * 6 //it slides a little after landing, while it brakes
                    const left = autopilot.lipFor(hit.x, hit.y, -1), right = autopilot.lipFor(hit.x, hit.y, 1)
                    const marginAt = x => Math.min(left && !left.isBehind ? x - left.x : Infinity, right && !right.isBehind ? right.x - x : Infinity)
                    const margin = Math.min(marginAt(hit.x), marginAt(rest))
                    if (margin < 20) score += (20 - Math.max(-20, margin)) / 4
                    if (autopilot.landTries) autopilot.landTries.push(`[margin ${Number.isFinite(margin) ? margin.toFixed(0) : "inf"} rest ${rest.toFixed(0)} lips ${left ? left.x.toFixed(0) + (left.isBehind ? "b" : "") : "-"},${right ? right.x.toFixed(0) + (right.isBehind ? "b" : "") : "-"}]`)
                }
            } else score = 10 + (hit ? Math.abs(nodes[hit.node].x - nodes[to].x) + 3 * Math.abs(nodes[hit.node].y - nodes[to].y) : 5000) //the closest miss
            if (hit && hit.isWet) score += 1500
            if (autopilot.landTries) autopilot.landTries.push(`${steer}/${most.toFixed(1)}:${hit ? nodes[hit.node].x + "," + nodes[hit.node].y + " at " + Math.round(hit.x) : "none"}=${score.toFixed(1)}`)
            if (score < bestScore) {
                bestScore = score
                best = { steer, most }
            }
        }
        if (bestScore >= 5000) best = { steer: Math.sign(nodes[to].x - player.position.x), most: p.limit * 0.3 } //nothing lands, ease toward the target, not all out one way
        return best
    },
    planFlight(flight, feet) { //simulate the rest of this flight with a few ways of steering, and take the one that lands closest to the goal
        const { dist, nodes, p } = autopilot
        const size = autopilot.size()
        const x = player.position.x, vx = player.velocity.x, vy = player.velocity.y
        let best = null, bestValue = Infinity
        for (const steer of [-1, 0, 1]) {
            for (const most of steer ? [p.limit, p.limit * 0.6, p.limit * 0.3] : [0]) {
                const hit = autopilot.arc(x, feet, vx, vy, steer, most, false, size, 0, true)
                if (!hit || !(dist[hit.node] < Infinity)) continue
                let value = hit.cycles + dist[hit.node] + nodes[hit.node].cover + (hit.isWet ? 1500 : 0)
                if (hit.node === flight.to) value -= 8 //keep the landing it was going for unless another is clearly better
                if (value < bestValue) {
                    bestValue = value
                    best = { node: hit.node, steer, most, cycles: hit.cycles }
                }
            }
        }
        if (!best) { //nowhere good to land, at least don't steer into anything
            flight.to = -1
            return
        }
        const from = flight.from >= 0 ? flight.from : autopilot.cur
        if (from < 0) return
        flight.to = best.node
        flight.edge = { from, to: best.node, type: flight.launchType || (flight.isLaunched ? autopilot.BOOST : autopilot.FALL), dir: best.steer || Math.sign(nodes[best.node].x - x) || 1, cost: best.cycles, steer: best.steer, most: best.most, isRun: false, fail: 0, isLeap: true }
    },
    //*********************************************************************
    // fields and tech that fly or teleport
    //*********************************************************************
    fieldName: () => m.fieldUpgrades[m.fieldMode] ? m.fieldUpgrades[m.fieldMode].name : "",
    rayMove: null,
    lastRayAttempt: -Infinity,
    tryRay(feet, edge, blockedX) {
        const x = player.position.x, cycle = simulation.cycle
        if (m.isHolding || m.crouch || autopilot.riding || autopilot.carry || m.fieldCDcycle >= m.cycle) return false
        const ray = m.fieldUpgrades[2], walls = ray.rayWalls()
        const support = m.standingOn?.parent || m.standingOn
        if (support?.isRay) return false
        const to = autopilot.nodes[edge?.to]
        const exit = autopilot.nodes[autopilot.exitNode()]
        const dir = Math.sign((blockedX ?? (to || exit || level.exit).x) - x) || 1
        const size = autopilot.size()
        const rayInWay = walls.some(who => {
            const end = (blockedX ?? x + dir * 35) + dir * size.halfWidth
            return autopilot.polygonBox(who.vertices, Math.min(x, end), feet - size.height, Math.max(x, end), feet - 26)
        })
        if (rayInWay && (blockedX !== undefined || !edge || edge.fail || autopilot.blockedCycles >= 8 || edge.type === autopilot.JUMP) && cycle > autopilot.lastRayAttempt + 15) {
            autopilot.rayMove = { start: cycle, clear: true }
            return true
        }
        if (cycle % 10 || cycle - autopilot.lastRayAttempt < 180 || autopilot.relink.size || autopilot.goalType !== "exit" || (edge && !edge.fail) || m.hardLandCD >= m.cycle || m.buttonCD_jump + 20 >= m.cycle || Math.abs(player.velocity.x) > 2 || !exit || autopilot.isInExit()) return false
        const { jump, gravity } = autopilot.p
        const rise = jump * jump / (2 * gravity)
        //A second takeoff from the ray needs an accessible landing above the first jump.
        const target = autopilot.nodes.find(n => !n.dead && n.isStatic && !n.isCrouch && !n.elevator && !n.cover &&
            autopilot.dist?.[n.id] < Infinity && Math.abs(n.x - x) > 45 && Math.abs(n.x - x) < 480 && feet - n.y > rise && feet - n.y < rise * 1.8)
        if (!target || autopilot.isBoxSolidExact(x - size.halfWidth, feet - size.height - rise, x + size.halfWidth, feet - size.height)) return false
        const rayScale = ray.rayScale(tech.meissnerCount)
        //Same vertical offset as the game's ray, with its band on the eye side.
        const surfaceOffset = 134.27 * (1 + 0.2 * (rayScale - 1)) + 15 * (player.scale || 1) - 17
        if (surfaceOffset - (feet - m.pos.y) < 7) return false
        autopilot.rayMove = { start: cycle, takeoff: m.cycle, surfaceOffset }
        return true
    },
    driveRay(feet) {
        const move = autopilot.rayMove, cycle = simulation.cycle
        const age = cycle - move.start
        const finish = () => {
            autopilot.rayMove = autopilot.exactAim = null
            autopilot.lastRayAttempt = cycle
        }
        input.fire = input.field = false
        autopilot.why = move.clear ? "moving a blocking ray" : "placing a ray platform"
        if (!tech.isRay || m.fieldMode !== 2 || m.isHolding || age > 100) return finish()
        const aimDown = () => autopilot.exactAim = { x: m.pos.x + player.velocity.x, y: m.pos.y + 600 }
        if (move.clear) {
            //Aim into the floor, clearing the old field while the button is held.
            aimDown()
            input.field = age < 2
            if (age >= 3) finish()
            return
        }
        if (move.released) {
            if (m.onGround || cycle > move.released + 22) finish()
            return
        }
        aimDown()
        input.field = true
        input.up = true
        if (age > 3 && m.buttonCD_jump !== move.takeoff) return finish()
        if (age > 8 && player.velocity.y >= -1.5) {
            const y = m.pos.y + move.surfaceOffset
            const x = player.position.x, { halfWidth, height } = autopilot.size()
            if (y < feet + 7 || autopilot.pathIsWet([[x - halfWidth, y - height, x + halfWidth, y + 20]])) return finish()
            input.field = input.up = false
            move.released = cycle
        }
    },
    isFly: true, //fly with negative mass or acoustic levitation when it's much faster, false to compare
    isWarp: true, //teleport with wormhole when it's much faster, false to compare
    flying: null, //{ kind, path: [{ x, y }], i, node, start, frames } a flight it's following
    warp: null, //{ x, y, node, start } a wormhole it's opening
    flyEnds: {}, //why flights that didn't land ended, for tools/autopilot-test.js
    noFly: new Map(), //landing nodes and warp targets that didn't work, and the cycle to try them again
    flyStamp: 1, //the grid's flyable cache is good while its stamp matches
    flyAbility() { //how this player can fly right now, or null
        if (!autopilot.isFly) return null
        if (autopilot.fieldName() === "negative mass" && m.fieldCDcycle < m.cycle && m.energy > 0.15) { //hold field, up rises, down sinks
            const perCycle = tech.negativeMassCost > 0 ? 5 * tech.negativeMassCost + m.fieldRegen : 0 //energy rising costs, and holding the field uses up the regen too
            return { kind: "negative mass", across: 9, up: 9, down: 12, frames: perCycle > 0 ? Math.min(500, (m.energy - 0.05) / perCycle) : 500 }
        }
        if (m.coyoteCycles > 40) { //acoustic levitation, holding jump jumps again every 20 cycles until coyote time runs out
            const left = m.onGround ? m.coyoteCycles : m.lastOnGroundCycle + m.coyoteCycles - m.cycle
            if (left > 40) return { kind: "air jumps", across: 5, up: 14, down: 15, frames: Math.min(500, left - 10) }
        }
        return null
    },
    isFlyable(cx, cy) { //the player fits here with feet at the bottom of cell cy, cached until obstacles move
        const g = autopilot.grid
        if (cx < 1 || cy < autopilot.cellsFor(150) || cx >= g.w - 1 || cy >= g.h - 1) return false
        if (!g.flyStamp) {
            g.flyStamp = new Uint16Array(g.w * g.h)
            g.flyOk = new Uint8Array(g.w * g.h)
        }
        const i = cx + cy * g.w
        if (g.flyStamp[i] !== autopilot.flyStamp) {
            const x = g.x0 + (cx + 0.5) * autopilot.cell, feet = g.y0 + (cy + 1) * autopilot.cell
            const size = autopilot.size()
            const box = [x - size.halfWidth + 1, feet - size.height + 2, x + size.halfWidth - 1, feet - 3]
            g.flyOk[i] = autopilot.isBoxSolid(...box) || autopilot.pathIsWet([box]) ? 0 : 1
            g.flyStamp[i] = autopilot.flyStamp
        }
        return g.flyOk[i] === 1
    },
    findFlight(feet) { //search the open air for a landing that's closer to the goal than walking, start flying there if it's worth it
        const ability = autopilot.flyAbility()
        if (!ability || !autopilot.dist) return false
        const g = autopilot.grid, cell = autopilot.cell, nodes = autopilot.nodes, dist = autopilot.dist
        const here = autopilot.cur >= 0 ? dist[autopilot.cur] : Infinity
        const step = autopilot.cellsFor(50) //cells per move, the search is on a coarser grid
        const sx = Math.floor((player.position.x - g.x0) / cell), sy = Math.round((feet - g.y0) / cell) - 1
        if (!autopilot.isFlyable(sx, sy) && !autopilot.isFlyable(sx, sy - 1)) return false
        const start = sx + (autopilot.isFlyable(sx, sy) ? sy : sy - 1) * g.w
        const cost = new Map([[start, 0]]), parent = new Map()
        const heap = [[0, start]] //small binary heap of [cost, cell]
        const push = item => {
            heap.push(item)
            for (let i = heap.length - 1; i > 0;) {
                const up = (i - 1) >> 1
                if (heap[up][0] <= heap[i][0]) break;
                [heap[up], heap[i]] = [heap[i], heap[up]]
                i = up
            }
        }
        const pop = () => {
            const top = heap[0], last = heap.pop()
            if (heap.length) {
                heap[0] = last
                for (let i = 0; ;) {
                    let c = 2 * i + 1
                    if (c >= heap.length) break
                    if (c + 1 < heap.length && heap[c + 1][0] < heap[c][0]) c++
                    if (heap[c][0] >= heap[i][0]) break;
                    [heap[c], heap[i]] = [heap[i], heap[c]]
                    i = c
                }
            }
            return top
        }
        let best = -1, bestCell = -1, bestValue = Math.min(here - 60, Infinity) //it has to save at least a second
        let expanded = 0
        while (heap.length && expanded < 6000) {
            const [c, at] = pop()
            if (c > cost.get(at) || c > ability.frames) continue
            expanded++
            const cx = at % g.w, cy = (at - cx) / g.w
            for (let dy = 0; dy <= autopilot.cellsFor(50); dy++) { //a node to land on, here or just below
                const node = g.nodeAt[cx + (cy + dy) * g.w]
                if (node < 0 || !(dist[node] < Infinity) || nodes[node].isBoost || !nodes[node].isStatic || nodes[node].cover > 0) continue //on the map that stays put, not on a block that may move
                const until = autopilot.noFly.get(node)
                if (until && until > simulation.cycle) continue
                const value = c + 20 + dist[node]
                if (value < bestValue && node !== autopilot.cur) {
                    bestValue = value
                    best = node
                    bestCell = at
                }
            }
            for (const [mx, my] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                const nx = cx + mx * step, ny = cy + my * step
                let clear = true
                for (let k = 1; k <= step; k++) if (!autopilot.isFlyable(cx + mx * k, cy + my * k)) { clear = false; break }
                if (!clear) continue //check every intermediate cell, including at finer resolutions
                const next = nx + ny * g.w
                const d = c + (Math.abs(mx) * step * cell / ability.across + (my < 0 ? step * cell / ability.up : my > 0 ? step * cell / ability.down : 0)) * (mx && my ? 0.8 : 1)
                if (d < (cost.has(next) ? cost.get(next) : Infinity)) {
                    cost.set(next, d)
                    parent.set(next, at)
                    push([d, next])
                }
            }
        }
        if (best < 0) return false
        const path = [] //from the landing back to the start, as feet positions
        for (let at = bestCell; at !== undefined; at = parent.get(at)) {
            const cx = at % g.w, cy = (at - cx) / g.w
            path.unshift({ x: g.x0 + (cx + 0.5) * cell, y: g.y0 + (cy + 1) * cell })
        }
        path.push({ x: nodes[best].x, y: nodes[best].y })
        autopilot.flying = { kind: ability.kind, path, i: 1, node: best, start: simulation.cycle, frames: ability.frames, lastProgress: simulation.cycle, closest: Infinity }
        autopilot.say("flying", here < Infinity ? "it's faster" : "no way to walk there")
        return true
    },
    flyPath(feet, go) { //follow the flight, rising, hovering, and sinking toward the next point, then land
        const f = autopilot.flying
        const cycle = simulation.cycle
        const x = player.position.x, vx = player.velocity.x, vy = player.velocity.y
        const path = f.path, last = path.length - 1
        autopilot.why = "flying"
        input.fire = input.field = false
        while (f.i < last && Math.hypot(path[f.i].x - x, path[f.i].y - feet) < 45) { //f.i is the point it's heading for
            f.i++
            f.lastProgress = cycle //getting through the points is progress, a path around a wall goes away from the landing for a while
        }
        const point = path[f.i]
        const target = autopilot.nodes[f.node]
        const isOver = target.dead || cycle > f.start + f.frames + 120 || cycle > f.lastProgress + 90 || (f.kind === "negative mass" && (m.energy < 0.02 || m.fieldCDcycle > m.cycle))
        const dist = autopilot.dist
        const isAsGood = autopilot.cur >= 0 && dist && dist[autopilot.cur] <= dist[f.node] + 20 //down somewhere about as close to the goal
        if (m.onGround && cycle > f.start + 15 && ((Math.abs(target.x - x) < 40 && Math.abs(target.y - feet) < 40) || (isAsGood && Math.abs(vx) < 2 && !input.field))) { //landed
            autopilot.flying = null
            autopilot.stats.fly = autopilot.stats.fly || [0, 0]
            autopilot.stats.fly[0]++
            autopilot.stats.fly[1]++
            return
        }
        if (isOver) { //it stopped getting closer, ran out of time or energy, don't try this landing for a while, touching a ledge on the way keeps going
            const why = target.dead ? "landing gone" : cycle > f.lastProgress + 90 ? "no progress" : cycle > f.start + f.frames + 120 ? "too long" : "out of energy"
            autopilot.flyEnds[why] = (autopilot.flyEnds[why] || 0) + 1
            autopilot.noFly.set(f.node, cycle + 900)
            autopilot.flying = null
            autopilot.stats.fly = autopilot.stats.fly || [0, 0]
            autopilot.stats.fly[0]++
            return
        }
        const dx = point.x - x, dy = point.y - feet
        const isLanding = f.i >= last && Math.abs(target.x - x) < 30
        const wantVx = isLanding ? 0 : Math.max(-9, Math.min(9, dx / 6))
        const wantVy = Math.max(-10, Math.min(10, dy / 6))
        if (wantVx > vx + 0.6) go(1)
        else if (wantVx < vx - 0.6) go(-1)
        if (f.kind === "negative mass") {
            input.field = !(isLanding && target.y - feet < 80) //over the landing, let go and drop onto it
            if (wantVy < vy - 0.5) input.up = true
            else if (wantVy > vy + 0.5) {
                if (tech.isScaleInvariance) input.field = false //let gravity sink without toggling size
                else input.down = true
            }
        } else { //air jumps, holding jump jumps again every 20 cycles, see m.airControl()
            input.up = dy < -30 || (m.onGround && cycle < f.start + 10)
        }
    },
    findWarp() { //a wormhole to a spot farther along the plan, or anywhere closer to the goal when there's no plan
        if (!autopilot.isWarp || autopilot.fieldName() !== "wormhole" || m.fieldCDcycle >= m.cycle || !autopilot.dist) return false
        const drain = m.fieldUpgrades[m.fieldMode].energyCost()
        if (m.energy < drain + 0.05) return false
        const { nodes, dist, next } = autopilot
        const cur = autopilot.cur
        const here = cur >= 0 ? dist[cur] : Infinity
        const candidates = []
        if (here < Infinity) {
            let at = cur
            for (let i = 0; i < 300 && next[at]; i++) candidates.push(at = next[at].to)
        } else {
            for (let i = 0; i < nodes.length; i++) if (dist[i] < Infinity && !nodes[i].dead && Math.abs(nodes[i].x - m.pos.x) < 1100 && Math.abs(nodes[i].y - m.pos.y) < 800) candidates.push(i)
        }
        const scale = simulation.zoom / simulation.edgeZoomOutSmooth
        const isOnScreen = (wx, wy) => {
            const sx = (wx + m.transX - canvas.width2) * scale + canvas.width2, sy = (wy + m.transY - canvas.height2) * scale + canvas.height2
            return sx > 60 && sx < canvas.width - 60 && sy > 60 && sy < canvas.height - 60
        }
        let best = -1, bestValue = here < Infinity ? here - 90 : Infinity //it has to save a second and a half
        for (const i of candidates) {
            const n = nodes[i]
            if (n.isBoost || n.elevator || n.cover > 0 || dist[i] + 30 >= bestValue) continue
            const until = autopilot.noFly.get(i)
            if (until && until > simulation.cycle) continue
            const spot = { x: n.x, y: n.y - 75 } //the player's middle standing there
            if (!isOnScreen(spot.x, spot.y)) continue
            const past = Vector.add(spot, Vector.mult(Vector.normalise(Vector.sub(spot, m.pos)), 25)) //the same checks the field makes
            if (Matter.Query.rayAny(map, m.pos, past) || Matter.Query.rayAny(map, { x: spot.x, y: spot.y - 40 }, { x: spot.x, y: spot.y + 40 })) continue
            bestValue = dist[i] + 30
            best = i
        }
        if (best < 0) return false
        autopilot.warp = { x: nodes[best].x, y: nodes[best].y - 75, node: best, start: simulation.cycle, from: { x: player.position.x, y: player.position.y } }
        autopilot.say("teleporting", "it's faster")
        return true
    },
    doWarp() { //hold the field on the spot for a few cycles, then let go to go through
        const w = autopilot.warp
        const age = simulation.cycle - w.start
        autopilot.why = "teleporting"
        input.fire = false
        autopilot.isHolding = true
        if (age < 8) {
            input.field = true
            return
        }
        input.field = false
        if (age > 10) {
            const isThere = Math.hypot(player.position.x - w.x, player.position.y - w.y) < 100
            if (!isThere) autopilot.noFly.set(w.node, simulation.cycle + 900)
            autopilot.stats.warp = autopilot.stats.warp || [0, 0]
            autopilot.stats.warp[0]++
            if (isThere) autopilot.stats.warp[1]++
            autopilot.warp = null
        }
    },
    isGrapple: true, //swing up with the grappling hook when it's much faster, false to compare
    grapple: null, //{ node, anchor, aim, kind, stop, start, attachedAt, closest, lastProgress } a hook it's using
    exactAim: null, //{ x, y } the mouse goes exactly here, see look()
    grappleWhy: {},
    badAnchors: [], //{ x, y, until } spots a hook didn't get anywhere from //why hook options were passed over, for tools/autopilot-test.js
    findGrapple(feet) { //fire rays up and around, hook the spot with the best ledges near it, see doGrapple() for when it lets go
        if (!autopilot.isGrapple || autopilot.fieldName() !== "grappling hook" || m.fieldCDcycle >= m.cycle || m.energy < 0.1 || !autopilot.dist) return false
        if (bullet.some(who => who.isGrapple)) return false //one hook at a time
        const { nodes, dist } = autopilot
        const here = autopilot.cur >= 0 ? dist[autopilot.cur] : Infinity
        if (here < Infinity && autopilot.stuckCount < 2) return false //only when walking can't get there, or it's stuck, a swing that misses costs more than it saves
        const from = { x: m.pos.x, y: m.pos.y }
        const near = [] //ledges closer to the goal within reach
        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i]
            if (n.dead || !n.isStatic || n.isBoost || n.cover > 0 || !(dist[i] < here - 200)) continue
            if (Math.abs(n.x - from.x) < 1300 && Math.abs(n.y - from.y) < 1200) near.push(i)
        }
        if (!near.length) return false
        const why = autopilot.grappleWhy
        let best = null, bestValue = here - 180 //it has to look 3 seconds faster, a swing often lands short of where it hoped
        for (let k = 0; k < 18; k++) {
            const angle = -Math.PI * (0.06 + 0.88 * k / 17) //up and to either side
            const reach = { x: from.x + 1000 * Math.cos(angle), y: from.y + 1000 * Math.sin(angle) }
            const hit = vertexCollision(from, reach, [map])
            if (autopilot.badAnchors.some(b => b.until > simulation.cycle && Math.hypot(b.x - hit.x, b.y - hit.y) < 100)) {
                why["anchor didn't work before"] = (why["anchor didn't work before"] || 0) + 1
                continue
            }
            if (!hit.who || Math.hypot(hit.x - from.x, hit.y - from.y) < 150) {
                why[hit.who ? "anchor too close" : "nothing to hook"] = (why[hit.who ? "anchor too close" : "nothing to hook"] || 0) + 1
                continue
            }
            let value = Infinity //the best ledge near the anchor, at or below it, the pull and a fling get there
            for (const i of near) {
                const n = nodes[i]
                if (n.y < hit.y - 60 || Math.abs(n.x - hit.x) > 350 || n.y - hit.y > 500) continue
                const v = dist[i] + 30 + Math.hypot(hit.x - from.x, hit.y - from.y) / 12
                if (v < value) value = v
            }
            if (!(value < bestValue)) {
                why["no better ledge near the anchor"] = (why["no better ledge near the anchor"] || 0) + 1
                continue
            }
            why.ok = (why.ok || 0) + 1
            bestValue = value
            best = { aim: { x: reach.x, y: reach.y }, anchor: { x: hit.x, y: hit.y } }
        }
        if (!best) return false
        autopilot.grapple = { ...best, start: simulation.cycle, attachedAt: 0, closest: Infinity, lastProgress: simulation.cycle, from: autopilot.cur, here, bestValue: Infinity, landing: -1, checkAt: 0 }
        autopilot.say("grappling", here < Infinity ? "it's faster" : "no way to walk there")
        return true
    },
    doGrapple(feet, go) { //hold the field and up while the rope pulls, let go when a fling from here lands best, then steer the landing
        const gr = autopilot.grapple
        const cycle = simulation.cycle
        const age = cycle - gr.start
        const x = player.position.x
        autopilot.why = "grappling"
        input.fire = input.field = false
        autopilot.exactAim = gr.aim
        if (age < 2) return //let the aim settle before firing
        const hook = bullet.find(who => who.isGrapple)
        const end = isGood => {
            autopilot.grapple = autopilot.exactAim = null
            input.field = input.up = false
            if (!isGood) { //don't hook near here again for a while
                autopilot.badAnchors = autopilot.badAnchors.filter(b => b.until > cycle)
                autopilot.badAnchors.push({ x: gr.anchor.x, y: gr.anchor.y, until: cycle + 900 })
                autopilot.stats.grapple[0]++
                return
            }
            const to = gr.landing >= 0 ? gr.landing : autopilot.cur
            autopilot.flight = { edge: { from: gr.from, to, type: autopilot.GRAPPLE, dir: Math.sign(autopilot.nodes[to].x - x) || 1, cost: 0, steer: 0, most: 0, isRun: false, coyote: 0, fail: 0, isLeap: true }, to, since: cycle, mStart: m.cycle, isJumped: false, isLaunched: true, launchType: autopilot.GRAPPLE, from: gr.from, replanAt: cycle, takeoffX: x, takeoffVx: player.velocity.x }
        }
        input.field = true
        input.up = true //floats up while hooked, see b.grapple()
        if (!hook || !hook.attached) {
            if (age > 50 || (hook && hook.do === hook.returnToPlayer)) end(false) //it missed
            return
        }
        if (!gr.attachedAt) gr.attachedAt = cycle
        autopilot.exactAim = gr.anchor
        if (gr.landing >= 0) go(autopilot.nodes[gr.landing].x - x) //swing toward where it'll land, left and right pump the swing
        if (cycle >= gr.checkAt) { //where would letting go now land
            gr.checkAt = cycle + 3
            const flight = { to: gr.landing, isLaunched: true, launchType: autopilot.GRAPPLE, from: gr.from }
            autopilot.planFlight(flight, feet)
            if (flight.to >= 0 && flight.edge) {
                const value = flight.edge.cost + autopilot.dist[flight.to]
                if (value < gr.bestValue) {
                    gr.bestValue = value
                    gr.landing = flight.to
                    gr.lastProgress = cycle
                } else if (gr.bestValue < gr.here - 40 && value > gr.bestValue + 15) return end(true) //it was best a moment ago, let go now
            }
        }
        const left = Math.hypot(gr.anchor.x - x, gr.anchor.y - player.position.y)
        if (left < 90) return end(gr.bestValue < gr.here - 40) //at the anchor
        if (cycle > gr.lastProgress + 90 || age > 360) end(gr.bestValue < gr.here - 40) //the landing stopped getting better
    },
    isInExit() { //the same box as level.exit.drawAndCheck()
        const x = player.position.x, y = player.position.y
        return x > level.exit.x + 12 && x < level.exit.x + 88 && y > level.exit.y - 250 && y < level.exit.y + 35 && !level.exit.isInverted
    },
    isHolding: false,
    combat: "", //"back" or "hold" while fighting changes how it moves
    isSmoothCombat: true, //keep traveling while shooting, false is the old stop and back away, for tools/autopilot-test.js
    isCommit: true, //keep going for a running jump once it's lined up, false to compare
    isEscalate: true, //when stuck, plan again, hop, take a run, then something random, false is always random, to compare
    stuckCount: 0,
    recovery: "backing away",
    isUseAlternatives: true, //take a standing jump instead of backing up for a running one when both get there, false to compare
    lastV: { x: 0, y: 0 }, //the player's velocity last cycle
    riding: null, //the elevator under the player
    waitSince: 0,
    isAiming: false,
    look() { //move the mouse toward what's being aimed at, or look ahead along the path
        if (!autopilot.isAiming) {
            let ahead = autopilot.cur
            for (let i = 0; i < autopilot.cellsFor(300) && ahead >= 0 && autopilot.next && autopilot.next[ahead]; i++) ahead = autopilot.next[ahead].to
            if (ahead >= 0 && ahead !== autopilot.cur) {
                const to = autopilot.nodes[ahead]
                const dx = to.x - m.pos.x, dy = to.y - 80 - m.pos.y
                const scale = 350 / Math.max(350, Math.hypot(dx, dy))
                autopilot.aim.x = m.pos.x + dx * scale
                autopilot.aim.y = m.pos.y + dy * scale
            } else {
                autopilot.aim.x = m.pos.x + 300 * Math.cos(m.angle)
                autopilot.aim.y = m.pos.y + 300 * Math.sin(m.angle)
            }
        }
        const exact = autopilot.warp || autopilot.exactAim || autopilot.carryAim
        if (exact) { //exactly on the warp spot or the hook's anchor, the camera follows the mouse this cycle too, solve for where the mouse has to be
            const s = simulation.edgeZoomOutSmooth / simulation.zoom, L = m.lookSmoothing
            const solve = (world, half, trans, pos) => half + (world - half + trans + L * (half - pos - trans)) / (s + 0.8 * L)
            simulation.mouse.x = solve(exact.x, canvas.width2, m.transX, m.pos.x)
            simulation.mouse.y = solve(exact.y, canvas.height2, m.transY, m.pos.y)
            return
        }
        const scale = simulation.zoom / simulation.edgeZoomOutSmooth
        const toScreenX = wx => (wx + m.transX - canvas.width2) * scale + canvas.width2
        const toScreenY = wy => (wy + m.transY - canvas.height2) * scale + canvas.height2
        const px = toScreenX(m.pos.x), py = toScreenY(m.pos.y)
        let dx = toScreenX(autopilot.aim.x) - px, dy = toScreenY(autopilot.aim.y) - py
        const most = 0.42 * Math.min(canvas.width, canvas.height) //keep the mouse on screen, in the same direction
        const length = Math.hypot(dx, dy)
        if (length > most) {
            dx *= most / length
            dy *= most / length
        }
        const rate = autopilot.isAiming ? 0.35 : 0.08
        simulation.mouse.x += (px + dx - simulation.mouse.x) * rate
        simulation.mouse.y += (py + dy - simulation.mouse.y) * rate
        if (autopilot.isAiming && (input.fire || (autopilot.profile && autopilot.profile.isAutoFire && autopilot.target))) m.angle = Math.atan2(autopilot.aim.y - m.pos.y, autopilot.aim.x - m.pos.x) //shots go right at the target while the mouse catches up
    },
    drawRings() { //circle what it's going for and what it's shooting at
        const ring = (x, y, radius, color, dash) => {
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.setLineDash(dash)
            ctx.stroke()
            ctx.setLineDash([])
        }
        const target = autopilot.target
        if (target && target.alive) ring(target.position.x, target.position.y, (target.radius || 30) + 22, "rgba(255,0,90,0.55)", [12, 8])
        const who = autopilot.goalWho
        if (!who) return
        if (autopilot.goalType === "powerUp" && powerUp.includes(who)) ring(who.position.x, who.position.y, (who.size || 20) + 22, "rgba(0,140,255,0.5)", [10, 10])
        else if (autopilot.goalType === "mob" && who.alive && who !== target) ring(who.position.x, who.position.y, (who.radius || 30) + 28, "rgba(0,140,255,0.5)", [4, 10])
        else if (autopilot.goalType === "trigger") {
            const x = who.kind === "button" ? (who.obj.min.x + who.obj.max.x) / 2 : who.obj.flip.position.x
            const y = who.kind === "button" ? who.obj.min.y : who.obj.flip.position.y
            ring(x, y, 90, "rgba(0,170,90,0.55)", [14, 8])
        }
    },
    drawer: { //an ephemera, runs inside the level's camera
        name: "autopilot",
        count: 0,
        do() {
            if (!autopilot.isOn) return simulation.removeEphemera(this)
            if (simulation.isTimeSkipping) return
            autopilot.drawWord()
            if (!autopilot.isDrawPath) return
            autopilot.drawRings()
            if (!autopilot.next || autopilot.cur < 0) return
            const nodes = autopilot.nodes
            let at = autopilot.cur
            ctx.beginPath()
            ctx.moveTo(nodes[at].x, nodes[at].y - 12)
            for (let i = 0; i < 400 && autopilot.next[at]; i++) {
                const edge = autopilot.next[at]
                const from = nodes[at], to = nodes[edge.to]
                if (edge.type === autopilot.WALK) ctx.lineTo(to.x, to.y - 12)
                else ctx.quadraticCurveTo((from.x + to.x) / 2, Math.min(from.y, to.y) - (edge.type === autopilot.FALL ? 40 : 300), to.x, to.y - 12)
                at = edge.to
            }
            ctx.strokeStyle = "rgba(0,140,255,0.3)"
            ctx.lineWidth = 4
            ctx.setLineDash([6, 14])
            ctx.stroke()
            ctx.setLineDash([])
        },
    },
}
autopilot.setup()
