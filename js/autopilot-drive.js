"use strict";
//autopilot, following the plan on the ground: loops, being stuck, recovery, and jumps, see the top of js/autopilot.js
Object.assign(autopilot, {
    //*********************************************************************
    // loops, being stuck, and following the plan
    //*********************************************************************
    routeLoop: { since: 0, pending: false, pickups: 0, kills: 0 },
    portalPass: null,
    recordPortalExit(end) {
        const previous = autopilot.portalPass
        const cycle = simulation.cycle
        const samePair = previous?.end.portalPair === end && cycle - previous.cycle <= 180
        autopilot.portalPass = { end, cycle, count: samePair ? previous.count + 1 : 1, dir: 0, failedDir: samePair ? previous.dir : 0 }
    },
    drivePortalEscape() { //a trip through the same pair can repeat forever without landing
        const pass = autopilot.portalPass
        if (!pass) return false
        const cycle = simulation.cycle
        const age = cycle - pass.cycle
        if ((m.onGround && age > 5) || age > 150) {
            autopilot.portalPass = null
            return false
        }
        if (pass.count < 3 && !(pass.count >= 2 && autopilot.routeLoop.pending)) return false
        const mouth = pass.end.portal.bounds
        const middle = pass.end.portal.position.x
        const x = player.position.x
        if (!pass.dir) {
            const size = autopilot.size()
            const y = mouth.min.y - 12
            const clear = dir => {
                const side = dir < 0 ? mouth.min.x - size.halfWidth - 35 : mouth.max.x + size.halfWidth + 35
                return !autopilot.isBoxSolidExact(side - size.halfWidth, y - size.height, side + size.halfWidth, y)
            }
            const preferred = -pass.failedDir || Math.sign((autopilot.nodes[autopilot.goal]?.x ?? middle) - middle) || 1
            pass.dir = clear(preferred) || !clear(-preferred) ? preferred : -preferred
            autopilot.cancelMovement()
            autopilot.routeLoop.pending = false
            autopilot.routeLoop.since = cycle
            autopilot.say("escaping", "the same portal pair keeps throwing it back")
        }
        const far = pass.dir > 0 ? mouth.max.x + 150 : mouth.min.x - 150
        input.left = pass.dir < 0 && x > far
        input.right = pass.dir > 0 && x < far
        input.up = input.down = input.field = false
        autopilot.why = "escaping a portal loop"
        return true
    },
    repeatedRoute(cycle, since, history) {
        if (!history?.length) return 0
        const at = age => history[(cycle - age) % history.length]?.position
        const here = at(0)
        if (!here) return 0
        const close = (a, b, radius) => b && (a.x - b.x) ** 2 + (a.y - b.y) ** 2 < radius ** 2
        //Compare two laps using eight position samples per lap. Let each sample drift up to 12 cycles.
        for (let lap = 120; lap <= 300; lap += 6) {
            const oldest = lap + Math.round(7 * lap / 8) + 12
            if (oldest >= history.length || cycle - since < oldest) break
            if (!close(here, at(lap), 65)) continue
            let matches = 1, traveled = false
            for (let i = 1; i < 8; i++) {
                const age = Math.round(i * lap / 8)
                const now = at(age)
                if (!now) break
                if (!close(here, now, 120)) traveled = true
                const previous = age + lap
                if (close(now, at(previous), 55) || close(now, at(previous - 12), 55) || close(now, at(previous + 12), 55)) matches++
            }
            if (traveled && matches >= 7) return lap
        }
        return 0
    },
    watchRouteLoop() {
        const cycle = simulation.cycle
        const loop = autopilot.routeLoop
        const kills = typeof mobs === "undefined" ? 0 : mobs.mobDeaths
        const suspend = autopilot.goalWalk !== null || autopilot.riding || autopilot.train || autopilot.carry || autopilot.blockClear ||
            autopilot.remotePickup || autopilot.blockAttack || simulation.isTimeSkipping ||
            (autopilot.goalType === "trigger" && autopilot.goalWho?.arrivedAt)
        if (suspend || kills !== loop.kills || powerUp.length < loop.pickups) {
            loop.since = cycle
            loop.pending = false
        }
        loop.kills = kills
        loop.pickups = powerUp.length
        if (!loop.pending && cycle % 12 === 0) loop.pending = !!autopilot.repeatedRoute(cycle, loop.since, m.history)
    },
    breakRouteLoop(feet) {
        const cycle = simulation.cycle
        const loop = autopilot.routeLoop
        loop.pending = false
        loop.since = cycle
        autopilot.say("stuck", "repeating the same route")
        const { goalType, goalWho, goal, nodes, cur } = autopilot
        if (goalWho && autopilot.isHuntTarget(goalWho)) return autopilot.recoverMovement(feet, autopilot.next?.[cur], true)
        if (((goalType === "powerUp" || goalType === "mob" || goalType === "trigger") && goalWho) ||
            (goalType === "explore" && nodes[goal])) {
            if (goalType === "explore") autopilot.rememberExploreGoal()
            else if (goalType === "trigger") autopilot.tried.set(goalWho, cycle)
            else autopilot.ignored.set(goalWho, cycle + 1200)
            autopilot.goal = -1
            autopilot.goalType = ""
            autopilot.goalWho = null
            autopilot.commit = autopilot.backUp = null
            autopilot.chooseGoal()
            autopilot.plan()
            return
        }
        autopilot.recoverMovement(feet, autopilot.next?.[cur], true)
    },
    recoverMovement(feet, edge, isLoop = false) {
        const cycle = simulation.cycle, x = player.position.x
        if (autopilot.startBlockClear(feet, edge)) return
        input.left = input.right = input.up = false
        autopilot.pending = null
        autopilot.blockedCycles = 0
        autopilot.watch = { x, y: feet, cycle }
        if (edge) {
            if (isLoop) autopilot.rememberFailure(edge) //a repeated route is evidence to try a detour, not a failed jump
            else autopilot.addFail(edge)
            autopilot.plan()
            const next = autopilot.next[autopilot.cur]
            if (next && !autopilot.sameManeuver(edge, next) && !autopilot.retryCost(next)) {
                autopilot.why = "trying another route"
                return
            }
        }
        if (autopilot.stuckCount++ >= 2 && autopilot.startBlockStep(feet, edge)) return
        const site = autopilot.recoverySite ??= { x, y: feet, pushed: false, hopped: false, until: 0, edge: null }
        const dir = Math.sign(edge ? edge.dir || autopilot.nodes[edge.to].x - x : (autopilot.nodes[autopilot.goal]?.x ?? level.exit.x + 50) - x)
        const block = !site.pushed && (!edge || edge.type === autopilot.WALK) ? autopilot.pushableBeside(x, feet) : null
        if (block) {
            site.pushed = true
            autopilot.recovery = "pushing"
            autopilot.wiggleDir = Math.sign(block.position.x - x) || dir
            autopilot.wiggleUntil = cycle + 60
            return
        }
        if (dir && autopilot.isEscalate && !isLoop && !site.hopped && !edge?.isLowStep) {
            site.hopped = true
            autopilot.recovery = "hopping"
            autopilot.wiggleDir = dir
            autopilot.wiggleUntil = cycle + 30
            return
        }
        //Give moving obstacles and replanning time to open a route without pacing back and forth.
        site.edge = edge
        site.until = cycle + 120
        autopilot.wiggleUntil = 0
        autopilot.commit = autopilot.backUp = null
        autopilot.routeLoop.since = cycle
        autopilot.routeLoop.pending = false
        autopilot.why = "waiting for a new route"
    },
    waitForRecovery(feet) {
        const site = autopilot.recoverySite
        if (!site) return false
        const x = player.position.x, cycle = simulation.cycle
        if (Math.hypot(x - site.x, feet - site.y) >= 150) {
            autopilot.recoverySite = null
            autopilot.stuckCount = 0
        } else if (site.until) {
            const edge = autopilot.next?.[autopilot.cur]
            const newRoute = edge && (!site.edge || !autopilot.sameManeuver(site.edge, edge)) && !autopilot.retryCost(edge)
            if (cycle < site.until && !newRoute) {
                autopilot.why = "waiting for a new route"
                return true
            }
            site.until = 0
            autopilot.watch = { x, y: feet, cycle }
        }
        return false
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
    driveStraight(feet, go) {
        if (autopilot.goalWalk === null) return false
        const pickup = autopilot.goalType === "powerUp" && autopilot.goalWho
        if (pickup && Number.isFinite(autopilot.nearbyUpgradeDistance(pickup))) {
            autopilot.why = "collecting a nearby upgrade"
            autopilot.isHolding = true
            return true
        }
        const x = player.position.x
        const dx = (pickup ? pickup.position.x : autopilot.goalWalk) - x
        const lookahead = 48 + 3 * Math.abs(player.velocity.x)
        const nextX = x + Math.sign(dx) * Math.min(Math.abs(dx), lookahead)
        const walk = autopilot.straightWalk(nextX, feet)
        if (walk?.block && Math.hypot(walk.block.position.x - m.pos.x, walk.block.position.y - m.pos.y) <= autopilot.carryReach()) {
            if (m.fieldCDcycle >= m.cycle) {
                autopilot.why = "waiting to pick up a block"
                return true
            }
            if (autopilot.startBlockClear(feet, null, { ...walk, x: nextX, isWalk: true })) return true
            autopilot.blockClearUntil.set(walk.block, simulation.cycle + 90)
        } else if (walk) {
            autopilot.why = pickup ? "walking to an upgrade" : "walking to the exit"
            autopilot.isHolding = false
            autopilot.pending = null
            go(dx)
            return true
        }
        autopilot.goalWalk = null //an obstacle moved into the walk; pick a new route next cycle
        autopilot.goal = -1
        autopilot.isPlanDirty = true
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
        if (autopilot.blockClear) return autopilot.driveBlockClear(feet)
        if (autopilot.rayMove) return autopilot.driveRay(feet)
        if (autopilot.goalType === "exit" && autopilot.isInExit()) {
            autopilot.wallClimb = autopilot.wallRelease = null
            return void (autopilot.why = "in the exit") //stand still while the exit charges
        }
        if (autopilot.flying) return autopilot.flyPath(feet, go)
        if (autopilot.warp) return autopilot.doWarp()
        if (autopilot.grapple) return autopilot.doGrapple(feet, go)
        if (autopilot.wallClimb && autopilot.driveWallClimb(feet, go)) return
        if (autopilot.releaseWall(feet, go)) return
        const train = autopilot.train
        const isJumpingOff = autopilot.pending && autopilot.pending.isJump && m.buttonCD_jump === autopilot.pending.mcycle //the feet can still touch the deck the cycle after
        if (train && autopilot.transportMoving(train) && m.onGround && !isJumpingOff) { //carried to its other stop, stand on the deck away from its ends
            const t = train.autopilotTransport
            autopilot.why = t.isSwing ? "riding a platform" : "riding a train"
            autopilot.isHolding = true
            autopilot.watch = { x, y: feet, cycle }
            autopilot.pending = null
            if (autopilot.trainRide !== train) { //where it left from is somewhere it has been, so exploring doesn't ride straight back
                autopilot.trainRide = train
                if (t.stops && !t.isSwing) autopilot.rodeFrom.push(t.stops[train.VxGoal > 0 ? 0 : 1])
                autopilot.say("riding", t.isSwing ? "a swinging platform" : "a train")
            }
            const off = x - train.position.x
            let want = 0, leave = null //where on the deck to stand, and how the plan leaves it
            if (t.isSwing && autopilot.next) { //it only pauses at its stop, so be standing where the plan leaves the deck from when it gets there
                const dest = autopilot.transportHeading(train)
                let at = autopilot.transportNode(train, dest, off)
                for (let i = 0; at >= 0 && i < 40; i++) {
                    const e = autopilot.next[at]
                    if (!e) break
                    if (e.type !== autopilot.WALK || nodes[e.to].transport !== train) {
                        want = nodes[e.from].x - t.stops[dest]
                        leave = e
                        break
                    }
                    at = e.to
                }
                const room = Math.max(20, t.width / 2 - 45)
                want = Math.max(-room, Math.min(room, want))
                if (Math.abs(off - want) > 18) go(want - off)
                else if (leave && leave.type === autopilot.JUMP && !leave.coyote && Math.abs(train.position.x - t.stops[dest]) < 160 && !m.crouch && m.hardLandCD < mc && m.buttonCD_jump + 20 < mc) {
                    const jump = autopilot.beltJump(leave, feet) //coming up to the stop, jump off as soon as the jump lands from here, it only pauses there
                    if (jump) {
                        autopilot.why = "jumping off a platform"
                        autopilot.isHolding = false
                        input.up = true
                        if (!jump.delay && jump.turnY === undefined && vx * (jump.steer || jump.dir) < Math.max(jump.most, 0.1)) go(jump.steer || jump.dir)
                        autopilot.pending = { edge: jump, mcycle: mc, isJump: true }
                    }
                }
            } else if (Math.abs(off) > Math.max(20, t.width / 2 - 60)) go(-off)
            return
        }
        autopilot.trainRide = null
        if (m.onGround && !isJumpingOff) {
            if (autopilot.driveStraight(feet, go)) return
            if (player.velocity.y >= -1 && autopilot.clearUnderfootDrop(feet)) return
        }
        if (cycle < autopilot.wiggleUntil && m.onGround) { //stuck, try something, see the stuck check
            autopilot.why = "stuck, " + autopilot.recovery
            go(autopilot.wiggleDir)
            input.up = autopilot.recovery === "hopping" && autopilot.wiggleUntil - cycle > 20
            autopilot.pending = null
            return
        }
        const pending = autopilot.pending
        if (!m.onGround) autopilot.commit = null //committed only until it leaves the ground
        if (pending && pending.isJump && m.buttonCD_jump === pending.mcycle) { //the jump pressed last cycle took off
            autopilot.flight = { edge: pending.edge, to: pending.edge.to, since: cycle, mStart: pending.mcycle, isJumped: true, isWindowed: !!pending.isWindowed, takeoffX: x, takeoffVx: vx, heldBlock: m.isHolding && m.holdingTarget, apexY: feet }
            autopilot.flight.takeoff = autopilot.recordTakeoff(pending.edge, x - vx, feet - player.velocity.y, pending.edge.isMomentum ? "momentum" : autopilot.flight.isWindowed ? "windowed" : pending.edge.isLeap ? "leap" : "planned")
            autopilot.pending = null
        }
        const landing = autopilot.flight
        const landingTarget = nodes[landing?.to]
        if (autopilot.isLandingSpan && landing?.isJumped && player.velocity.y >= -1 && landingTarget && !landingTarget.dead && !landingTarget.elevator && mc - landing.mStart >= 10 &&
            (m.onGround || (landing.slopeLandingUntil && mc - m.lastOnGroundCycle <= 4))) {
            const support = autopilot.standingOn()
            if (m.onGround && support?.isTouched && support.fadeTime && Math.abs(feet - support.bounds.min.y) < 16) {
                const { min, max } = support.bounds
                const foot = autopilot.size().foot
                const margin = Math.min(x - min.x, max.x - x)
                const inward = Math.sign(support.position.x - x)
                const next = autopilot.next?.[autopilot.cur]
                const slippingOff = margin < -0.6 * foot || (margin < foot && vx * inward < -1)
                if (slippingOff && (next?.type !== autopilot.WALK || next.dir !== inward)) {
                    autopilot.why = "getting a foothold on a shrinking platform"
                    go(inward)
                    return
                }
            }
            const uphill = support && autopilot.landingUphill(x, feet, landingTarget, support)
            if (uphill) {
                landing.slopeLandingUntil ??= mc + 45
                if (mc < landing.slopeLandingUntil) {
                    autopilot.why = "holding uphill on landing"
                    go(uphill)
                    return
                }
            }
        }
        const isBump = landing?.edge?.type === autopilot.WALK && !landing.isLaunched //walking over a bump, back on the ground the walking takes over at once, on a narrow top a few cycles at full speed runs off the end
        if (!m.onGround || (landing && ((mc - landing.mStart < 10 && !isBump) || landing.isJumped && player.velocity.y < -1))) return autopilot.fly(feet, go) //slope contact can persist briefly during takeoff
        //on the ground
        let isHopLanding = false //between hops against a belt it's on the ground a cycle at a time
        if (autopilot.flight) { //just landed
            const flight = autopilot.flight
            autopilot.flight = null
            const edge = flight.edge
            isHopLanding = !!flight.hopDir
            if (edge && !flight.hopDir && (edge.type !== autopilot.JUMP || flight.isJumped)) {
                const tally = autopilot.stats[autopilot.edgeNames[edge.type]]
                const to = nodes[edge.to]
                const boarded = edge.isBoarding && autopilot.standingOn() === to.elevator
                const support = autopilot.standingOn()
                const samePlatform = support?.isThere && support.fadeTime && Math.abs(support.bounds.min.y - to.y) < autopilot.cell &&
                    to.x >= support.bounds.min.x - autopilot.cell && to.x <= support.bounds.max.x + autopilot.cell && Math.abs(feet - support.bounds.min.y) < 20
                const landedAsPlanned = boarded || samePlatform || (Math.abs(to.x - x) < 40 && Math.abs(to.y - feet) < 30)
                const isGood = landedAsPlanned || (autopilot.dist && Number.isFinite(autopilot.dist[autopilot.cur]) && !autopilot.leadsBackToFailure(edge.to, autopilot.cur) && autopilot.dist[autopilot.cur] <= autopilot.dist[edge.to] + 5)
                if (tally) {
                    const kind = edge.airJumps ? "acoustic levitation" : edge.turnY !== undefined ? "vertical first" : edge.isMomentum ? "momentum" : edge.coyote ? "coyote" : edge.isLeap ? "leap" : flight.isWindowed ? "windowed" : "planned"
                    const tallyKind = autopilot.jumpKinds[kind] = autopilot.jumpKinds[kind] || [0, 0]
                    if (edge.type === autopilot.JUMP) tallyKind[0]++
                    if (edge.type === autopilot.JUMP && isGood) tallyKind[1]++
                    tally[0]++
                    if (isGood) tally[1]++
                    else if (autopilot.misses.length < 200) autopilot.misses.push({ type: autopilot.edgeNames[edge.type], run: edge.isRun, most: +edge.most.toFixed(1), dir: edge.dir, dx: Math.round(to.x - nodes[edge.from].x), dy: Math.round(to.y - nodes[edge.from].y), offX: Math.round((x - to.x) * edge.dir), offY: Math.round(feet - to.y), takeoff: Math.round(flight.takeoffX - nodes[edge.from].x), vx: +flight.takeoffVx.toFixed(1), delay: edge.delay || 0, hold: edge.hold || 0, kind, lands: [Math.round(x - to.x), Math.round(feet - to.y)] })
                }
                if (flight.takeoff) flight.takeoff.isGood = isGood
                if (landedAsPlanned) autopilot.confirmCrossing(edge)
                if (edge.type === autopilot.JUMP && autopilot.recoverLoadedJump(flight, isGood)) return
                if (edge.type === autopilot.JUMP && feet < nodes[edge.from].y - 35) {
                    //Give the next takeoff time to line up after gaining a foothold.
                    autopilot.watch = { x, y: feet, cycle }
                }
                const madeProgress = autopilot.dist && autopilot.dist[autopilot.cur] < autopilot.dist[edge.from]
                const cameUpShort = edge.type === autopilot.JUMP && !to.elevator && flight.apexY > to.y + 8
                if (!isGood && (flight.ceilingAt || cameUpShort || (autopilot.dist && !madeProgress))) {
                    autopilot.addFail(edge, 1, cameUpShort && !flight.ceilingAt, flight.ceilingAt)
                    return
                }
            }
        }
        if (cycle % 6 === 0 && autopilot.startBlockClear(feet, autopilot.next?.[autopilot.cur])) return
        if (tech.isRay && m.fieldMode === 2 && autopilot.tryRay(feet, autopilot.next?.[autopilot.cur])) return autopilot.driveRay(feet)
        if (autopilot.waitForRecovery(feet)) return
        if (autopilot.routeLoop.pending && !autopilot.isInExit()) return autopilot.breakRouteLoop(feet)
        //Catch stalls that did not report a failed landing or a blocked step.
        if (cycle > autopilot.watch.cycle + autopilot.stuckAfter) {
            const moved = Math.abs(x - autopilot.watch.x) + Math.abs(feet - autopilot.watch.y)
            autopilot.watch = { x, y: feet, cycle }
            const isWaiting = (autopilot.cur >= 0 && autopilot.cur === autopilot.goal) || autopilot.isHolding
            if (moved < 50 && !isWaiting && !autopilot.carry) {
                const edge = autopilot.next && autopilot.cur >= 0 ? autopilot.next[autopilot.cur] : null
                return autopilot.recoverMovement(feet, edge)
            }
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
        const retreating = target?.isBoss && autopilot.goalType === "exit" && !autopilot.canHuntBosses()
        if (!autopilot.isSmoothCombat && target && !retreating && autopilot.isArmed() && cycle > autopilot.pushOnUntil) { //the old way, to compare: stop within 750, back away within 420
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
        } else if (target && !retreating && autopilot.isArmed() && cycle > autopilot.pushOnUntil) {
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
            const backup = autopilot.backUp
            autopilot.backUp = null
            if (cycle < backup.until) return autopilot.backUpForJump(backup.edge, go, backup.until - cycle)
        }
        if (autopilot.goalType === "trigger" && autopilot.goalWho && (autopilot.cur === autopilot.goal || (autopilot.goalWho.arrivedAt && Math.abs(nodes[autopilot.goal].x - x) < 150))) {
            autopilot.why = "working a button"
            return autopilot.workTrigger(go)
        }
        let edge = autopilot.next[autopilot.cur]
        if (edge && edge.type === autopilot.JUMP && (edge.isRun || edge.coyote) && vx * edge.dir < 3 && autopilot.isUseAlternatives) edge = autopilot.standingAlternative(edge)
        const committed = autopilot.committedEdge(edge, x, feet) //a jump it's lining up for, kept while the plan around it shifts
        if (committed) edge = committed
        if (edge?.type === autopilot.JUMP) {
            const step = nodes[autopilot.cur].edges.find(walk => walk.isLowStep && walk.dir === edge.dir && !walk.fail)
            let walk = step
            for (let i = 0; i < autopilot.cellsFor(100) && walk?.type === autopilot.WALK && walk.dir === step.dir && !walk.fail; i++) {
                if (walk.to === edge.to) {
                    edge = step //the planned landing is a few uninterrupted steps away
                    autopilot.commit = null
                    break
                }
                walk = autopilot.next[walk.to]
            }
        }
        //Finish crossing a walkable bump before jumping or climbing to something farther along.
        let ahead = edge
        for (let i = 0; i < autopilot.cellsFor(100) && ahead?.type === autopilot.WALK && !ahead.isLowStep && !nodes[ahead.to].elevator; i++) ahead = autopilot.next[ahead.to]
        const stepAhead = ahead?.isLowStep
        if (cycle % 20 === 7 && autopilot.cur !== autopilot.goal && !autopilot.riding && !stepAhead && !edge?.airJumps) { //a field or tech that flies or teleports, used when it's much faster than the plan, or there's no plan
            if (autopilot.findWarp()) return autopilot.doWarp()
            if (autopilot.findGrapple(feet)) return autopilot.doGrapple(feet, go)
            if (autopilot.findFlight(feet)) return autopilot.flyPath(feet, go)
        }
        if (!edge) return void (autopilot.why = autopilot.cur === autopilot.goal ? "at the goal" : "no way to the goal")
        if (edge.type === autopilot.CLIMB) return autopilot.startWallClimb(edge, feet, go)
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
        if (train && edge.type === autopilot.RIDE && from.transport === train) { //it leaves when it senses the player stepping on, after it has seen them off it
            const off = x - train.position.x
            if (Math.abs(off) > Math.max(20, train.autopilotTransport.width / 2 - 60)) go(-off)
            else if (!train.autopilotTransport.isSwing && !train.isSensing && canJump && cycle % 20 === 0) { //still on it from the ride here, a hop in place counts as stepping off
                input.up = true
                autopilot.pending = { edge: null, mcycle: mc, isJump: false, isHop: true, dir: 0, hold: 1 }
            }
            return wait(train.autopilotTransport.isSwing ? "for the platform to swing back" : "for the train to leave")
        }
        //a few steps before stepping onto a transport's deck, if it isn't parked at this stop, stop short of the edge, it comes when the player waits near
        let board = null
        for (let e = edge, i = 0; e && i < 8 && !board; i++) {
            const stop = nodes[e.to]
            if (stop.transport && stop.transport !== train && !nodes[e.from].transport) board = e
            e = e.type === autopilot.WALK ? autopilot.next[e.to] : null
        }
        if (board && !autopilot.boardingReady(board, x, feet)) {
            const dir = Math.sign(nodes[board.to].x - nodes[board.from].x) || board.dir
            const isJump = board.type === autopilot.JUMP && !board.coyote //it waits on the spot it jumps from, or back from the edge it steps or drops off
            const left = ((isJump ? board.takeoffX ?? nodes[board.from].x : nodes[board.from].x - dir * 30) - x) * dir
            const speed = vx * dir
            if (left < Math.max(0, speed) * 11 + 10) {
                if (left < (isJump ? -7 : -15) || (speed > 2 && left < speed * 6)) go(-dir) //past it, or coming in too fast for friction alone
                else if (isJump && left > 7 && speed < 2) go(dir)
                return wait(nodes[board.to].transport.autopilotTransport?.isSwing ? "for the platform" : "for a train")
            }
        }
        const blocker = to.cover >= 3000 && !riding && !to.elevator ? autopilot.blockerIn(to) : null
        if (blocker) {
            if (tech.isRay && m.fieldMode === 2 && autopilot.tryRay(feet, edge, to.x)) return autopilot.driveRay(feet)
            if (autopilot.startBlockClear(feet, edge)) return
            if (autopilot.doorOpening(blocker)) return wait("for an opening door")
            if (blocker.isDoor && cycle >= (autopilot.triedDoors.get(blocker) ?? -Infinity)) {
                if (autopilot.doorApproach?.who !== blocker) autopilot.doorApproach = { who: blocker, since: cycle, contact: null }
                const approach = autopilot.doorApproach
                const dir = Math.sign(blocker.position.x - x) || edge.dir
                const face = dir > 0 ? blocker.bounds.min.x : blocker.bounds.max.x
                if ((face - x) * dir < autopilot.size().halfWidth + 8) approach.contact ??= cycle
                if (cycle < approach.since + 90 && (approach.contact === null || cycle < approach.contact + 15)) {
                    autopilot.why = "checking a door by contact"
                    go(dir)
                    return
                }
                autopilot.triedDoors.set(blocker, cycle + 300)
            }
            autopilot.doorApproach = null
            autopilot.waitSince = 0
            autopilot.isHolding = false
            return autopilot.recoverMovement(feet, edge)
        }
        autopilot.doorApproach = null
        const transferJump = jump => {
            autopilot.waitSince = 0
            autopilot.isHolding = false
            autopilot.commit = null
            autopilot.why = jump.isBoarding ? "jumping onto the elevator" : "jumping off the elevator"
            input.up = true
            go(jump.dir)
            autopilot.pending = { edge: jump, mcycle: mc, isJump: true }
        }
        if (riding) {
            const isLeaving = edge.type !== autopilot.RIDE && to.elevator !== riding
            const exit = autopilot.elevatorExit(riding, edge)
            if (exit) {
                const out = nodes[exit.to]
                const dir = Math.sign(out.x - riding.holdX)
                const isClose = Math.abs(out.y - feet) <= 250
                if (canJump && isClose && !out.elevator && (exit.type === autopilot.JUMP || out.y < feet - 18)) {
                    const jump = autopilot.elevatorJump(exit, feet, riding)
                    if (jump) return transferJump(jump)
                }
                if (!m.crouch) {
                    const drop = autopilot.elevatorDrop(riding, edge, feet)
                    if (drop) {
                        autopilot.why = "stepping off the elevator"
                        autopilot.waitSince = 0
                        autopilot.pending = { edge: drop, mcycle: mc, isJump: false }
                        go(drop.dir)
                        return
                    }
                }
                //Stage on the exit side while the lift travels, with room to brake before the lip.
                if (dir && !out.elevator) {
                    const margin = Math.max(28, autopilot.size().foot + 16)
                    const spot = riding.holdX + dir * Math.max(0, riding.autopilotElevator.width / 2 - margin)
                    if ((spot - x) * dir > Math.max(5, player.velocity.x * dir * 10) &&
                        !autopilot.isBoxSolidExact(Math.min(spot, x) - 20, feet - autopilot.size().height, Math.max(spot, x) + 20, feet - 16)) {
                        autopilot.why = "crossing the elevator deck"
                        autopilot.waitSince = 0
                        go(dir)
                        return
                    }
                    if (!isLeaving || !isClose) return wait("riding the elevator")
                }
            }
            if (!isLeaving || Math.abs(feet - from.y) > 70) {
                if (edge.type === autopilot.WALK && to.elevator === riding && Math.abs(feet - from.y) <= 70) {
                    autopilot.why = "crossing the elevator deck"
                    autopilot.waitSince = 0
                    go(to.x - x)
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
        } else if (to.elevator) {
            const top = to.elevator.bounds.min.y
            if (canJump && edge.type === autopilot.JUMP && !edge.blockJumps) {
                const jump = autopilot.elevatorJump(edge, feet)
                if (jump) return transferJump(jump)
            }
            if (!autopilot.boardingReady(edge, x, feet)) return wait("for the elevator")
            if (top < feet - 20 && top > feet - 150 && canJump) input.up = true //it's a little above, hop on
        }
        autopilot.waitSince = 0
        const isBeveledDrop = ahead?.type === autopilot.FALL && ahead.clearX !== undefined && !autopilot.retryCost(ahead)
        const isVerticalJump = ahead?.type === autopilot.JUMP && ahead.turnY !== undefined
        if (canJump && !riding && !from.isCrouch && (cycle % 3 === 0 || isHopLanding) && edge.type !== autopilot.BOOST && !stepAhead && !isBeveledDrop && !isVerticalJump) { //a jump from right here that beats the plan
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
        if (!riding && ahead?.type === autopilot.WALK && nodes[ahead.to].elevator && !autopilot.boardingReady(ahead, x, feet)) {
            const boardFrom = nodes[ahead.from].x
            if ((boardFrom - x) * ahead.dir <= Math.max(3, vx * ahead.dir * 8)) return wait("for the elevator")
        }
        //close to the planned spot it can jump from where it is, farther off, up to 120 away, only if the jump still lands when the player is a little off where and how fast they are,
        //so it keeps its running speed instead of slowing down to line up, jumps from farther off without that check land worse and look early
        const spotOf = e => e.takeoffX !== undefined ? e.takeoffX : nodes[e.from].x //where the planned jump leaves the ground
        const offTakeoff = ahead ? Math.abs(spotOf(ahead) - x) : Infinity
        const isNearTakeoff = ahead?.type === autopilot.JUMP && !isVerticalJump && !ahead.airJumps && !autopilot.retryCost(ahead) && !nodes[ahead.to].elevator && Math.abs(nodes[ahead.from].y - feet) < 30 &&
            (offTakeoff < 30 || (offTakeoff < 120 && Math.abs(vx) > 2 && autopilot.isMomentumJump && autopilot.canJumpFromHere(ahead, feet, 0, true)))
        if (isNearTakeoff && !ahead.coyote && autopilot.isJumpWindow && canJump && !riding && autopilot.canJumpFromHere(ahead, feet, 0, true)) { //still lands if the player is a little off, or a little faster or slower, a jump that just makes it in the simulation comes up short
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
                if (!ahead.delay && ahead.turnY === undefined) go(ahead.blockJumps ? ahead.steer : ahead.steer || ahead.dir)
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
            if (ahead && ahead.type === autopilot.JUMP && ahead.beltVx !== undefined && !ahead.coyote) {
                const jump = canJump && !riding ? autopilot.beltJump(ahead, feet) : null //a belt carries it past the planned spot in a cycle or two, take the jump as soon as it works
                if (jump) {
                    autopilot.why = "jumping off a belt"
                    input.up = true
                    if (!jump.delay && jump.turnY === undefined && vx * (jump.steer || jump.dir) < Math.max(jump.most, 0.1)) go(jump.steer || jump.dir)
                    autopilot.pending = { edge: jump, mcycle: mc, isJump: true }
                    return
                }
                const V = autopilot.beltV(nodes[ahead.from]) //a jump planned at the belt's own speed, let the belt carry it there, walking would make it too fast
                if (Math.abs(ahead.beltVx - V) < 0.5 && Math.abs(spotOf(ahead) - x) < Math.abs(vx - V) * 11 + 20) return void (autopilot.why = "riding a belt to a jump")
            }
            autopilot.why = "walking"
            go(edge.dir)
            if (edge.isLowStep) {
                autopilot.pending = { edge, mcycle: mc, isJump: false } //keep running if the bevel lifts the feet off the ground
            } else if (from.y - to.y > 16 && autopilot.realTop(from) - autopilot.realTop(to) > 16 && canJump && (to.x - x) * edge.dir < 30 + 3 * Math.abs(vx) && !autopilot.isUphillWalk(from, to)) { //hop a discrete step
                input.up = true
                autopilot.why = "hopping a step"
                autopilot.pending = { edge, mcycle: mc, isJump: false } //in the air it keeps walking, see fly()
            }
            autopilot.blockedStep(edge, feet, vx)
            return
        }
        if (edge.type === autopilot.JUMP && edge.beltVx !== undefined && !edge.coyote) {
            //taking off from a belt: it's carried, or hopping, through the spot and can't stand on it, so jump as soon as the jump lands from where it is,
            //every spot along the belt has its own plan, so one that doesn't work out is passed by, and the next is tried
            autopilot.why = "jumping off a belt"
            const key = autopilot.edgeKey(edge)
            const tried = autopilot.beltTry
            if (!tried || tried.key !== key) {
                if (tried && cycle - tried.cycle < 90) { //carried past the last one without it working
                    const count = (autopilot.beltMiss.get(tried.key) || 0) + 1
                    autopilot.beltMiss.set(tried.key, count)
                    if (count >= 2) {
                        autopilot.beltMiss.delete(tried.key)
                        autopilot.addFail(tried.edge)
                        autopilot.isPlanDirty = true
                    }
                }
                autopilot.beltTry = { key, edge, cycle }
            } else tried.cycle = cycle
            const jump = canJump ? autopilot.beltJump(edge, feet) : null
            if (jump) {
                input.up = true
                if (!jump.delay && jump.turnY === undefined && vx * (jump.steer || jump.dir) < Math.max(jump.most, 0.1)) go(jump.steer || jump.dir)
                autopilot.pending = { edge: jump, mcycle: mc, isJump: true }
                autopilot.beltTry = null
                return
            }
            const V = autopilot.beltV(from)
            if (Math.abs(edge.beltVx - V) >= 0.5) go(edge.beltVx - V) //going with the belt, or hopping against it, see beltHop(), else no key, the belt carries it
            return
        }
        if (edge.type === autopilot.JUMP && edge.coyote) { //run off the edge, the jump is pressed in the air, see fly()
            autopilot.why = "running off for a coyote jump"
            const past = (x - spotOf(edge)) * edge.dir //from the corner it runs off, it needs full speed there
            if (past > -20 && vx * edge.dir < 3) {
                if (canJump && autopilot.keepMomentum(edge, feet, go)) return
                if (!autopilot.backUpForJump(edge, go, 24)) return
            } else go(edge.dir)
            autopilot.pending = { edge, mcycle: mc, isJump: true }
            return
        }
        if (edge.type === autopilot.JUMP) {
            const toSpot = spotOf(edge) - x //the arc was simulated from here, the middle of the node or the top of a corner
            if (edge.turnY !== undefined) {
                autopilot.why = "lining up a vertical jump"
                const offset = Math.abs(toSpot), speed = Math.abs(vx)
                //Let the player settle, then check the live arc. A few pixels off the mark can still work.
                if (offset <= 10 && speed <= 0.55 && canJump) {
                    const fitted = autopilot.fitJumpHeight(edge, feet)
                    if (fitted) {
                        input.up = true
                        autopilot.pending = { edge: fitted, mcycle: mc, isJump: true }
                        return
                    }
                    if (offset <= 4) return autopilot.recoverMovement(feet, edge)
                }
                const coast = speed > 0.55 && toSpot * vx > 0 && Math.abs(toSpot - vx * 11) <= 10
                if (offset > 4 && !coast && (toSpot * vx <= 0 || offset > speed * 11)) go(toSpot)
                return
            }
            const past = -toSpot * edge.dir //how far past the takeoff spot, in the jump's direction
            const press = fitted => {
                input.up = true
                edge = fitted
                if (!edge.delay && edge.turnY === undefined) go(edge.blockJumps ? edge.steer : edge.dir)
            }
            const stopping = Math.abs(vx) * 11 //how far ground friction slides the player with no key held
            autopilot.why = edge.isRun ? "running jump" : "lining up a standing jump"
            if ((edge.isRun || edge.runFrom !== undefined) && Math.abs(toSpot) < 80) autopilot.commitTo(edge) //a run-up, switching plans mid run backs it up again, standing jumps are better off taking the spot it slid to
            if (edge.runFrom !== undefined) { //a run-up: fast enough already, jump at the takeoff, otherwise back to where the run-up starts, then run
                const moving = vx * edge.dir
                const need = edge.runVx ? 0.92 * edge.runVx : 0.5 //a short run-up from the old way jumps at any speed
                autopilot.why = edge.isRun ? "running jump" : "short run-up"
                if (moving >= need && past + moving > -4) {
                    const fitted = canJump && autopilot.fitJumpHeight(edge, feet)
                    if (fitted) press(fitted)
                    else go(edge.dir)
                } else if (moving < need && past + moving > -4 && canJump && autopilot.keepMomentum(edge, feet, go)) return
                else if (moving < need && past > -20 && (x - edge.runFrom) * edge.dir > 4) { //too slow to make it, back up for the run
                    if (!autopilot.backUpForJump(edge, go, 6)) return
                } else if (moving > 0.5 || (x - edge.runFrom) * edge.dir <= 4) go(edge.dir) //running, or at the start of the run-up
                else go(-edge.dir) //walking back to the start
            } else if (edge.isRun) {
                if (vx * edge.dir > 5.5 && past + vx * edge.dir > -4) { //reaches the spot this cycle
                    const fitted = canJump && autopilot.fitJumpHeight(edge, feet)
                    if (fitted) press(fitted)
                    else if (canJump && autopilot.retryCost(edge)) return autopilot.recoverMovement(feet, edge)
                    else go(edge.dir)
                } else if (past > -20 && vx * edge.dir < 3) {
                    if (canJump && autopilot.keepMomentum(edge, feet, go)) return
                    if (!autopilot.backUpForJump(edge, go, 24)) return
                } else go(edge.dir)
            } else if (Math.abs(toSpot) < 12 && Math.abs(vx) < 1.5) {
                if (canJump && vx * edge.dir < -0.3 && !autopilot.liveJumpLands(edge, feet)) return go(edge.dir) //still drifting back from lining up, from this speed it falls short, stop first
                if (canJump) {
                    const fitted = autopilot.fitJumpHeight(edge, feet)
                    if (!fitted) {
                        if (Math.abs(toSpot) > 3) return go(toSpot)
                        return autopilot.recoverMovement(feet, edge)
                    }
                    press(fitted)
                }
            } else {
                //Coast to the takeoff or let friction stop an overshoot before walking back.
                const coast = toSpot * vx > 0 && stopping > Math.abs(toSpot) - 8 || toSpot * vx < 0 && Math.abs(toSpot) < 30 && Math.abs(vx) >= 0.5
                if ((coast || toSpot * edge.dir < 0) && canJump && autopilot.keepMomentum(edge, feet, go)) return
                if (!coast) go(toSpot)
            }
            autopilot.pending = { edge, mcycle: mc, isJump: true } //walking off the edge before the jump still jumps, with coyote time
            return
        }
        //walk off a ledge or onto a boost
        autopilot.why = "walking off"
        go(edge.dir)
        autopilot.pending = { edge, mcycle: mc, isJump: false }
        if (edge.type === autopilot.FALL) autopilot.blockedStep(edge, feet, vx)
    },
    backUpForJump(edge, go, frames) {
        const support = autopilot.standingOn()
        if (support?.isTouched && support.fadeTime) {
            const x = player.position.x, dir = -edge.dir
            const room = dir > 0 ? support.bounds.max.x - x : x - support.bounds.min.x
            const travel = Math.max(0, player.velocity.x * dir, autopilot.p.run) * frames
            if (support.fadeCount <= frames + 20 || room <= travel + autopilot.size().foot) {
                //The run-up would outlast the foothold or walk off it. Replan while still standing on it.
                autopilot.rememberFailure(edge)
                autopilot.plan()
                autopilot.why = "looking for a jump before the platform vanishes"
                return false
            }
        }
        autopilot.backUp = { edge, until: simulation.cycle + frames }
        go(-edge.dir)
        return true
    },
    standingAlternative(edge) {
        const { dist, nodes, wrapRoutes } = autopilot
        let best = edge
        let cost = autopilot.edgeCost(edge) + autopilot.retryCost(edge) + dist[edge.to] + 15 //allow a little extra to avoid a run-up
        for (const option of nodes[edge.from].edges) {
            if (option.type !== autopilot.JUMP || option.isRun || option.coyote || autopilot.retryCost(option)) continue
            if (autopilot.leadsBackToFailure(edge.to, option.to)) continue
            if (!wrapRoutes?.[edge.from] && (option.wraps || wrapRoutes?.[option.to])) continue
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
        const isWorse = edge && dist && planned && (autopilot.leadsBackToFailure(planned.to, edge.to) ||
            dist[edge.to] + autopilot.edgeCost(edge) > dist[planned.from] + 60)
        const canAvoidWrap = edge && !autopilot.wrapRoutes?.[c.from] && (edge.wraps || autopilot.wrapRoutes?.[edge.to])
        if (!edge || (autopilot.retryCost(edge) && planned && !autopilot.sameManeuver(edge, planned)) || isWorse || canAvoidWrap || Math.abs(node.x - x) > 150 || Math.abs(node.y - feet) > 60 || simulation.cycle > c.start + 240) {
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
        const hit = autopilot.arc(x, y, vx, -p.jump, edge.steer, edge.most, true, autopilot.size(), edge.delay || 0, true, edge.hold || Infinity, edge.blockJumps, edge.turnY)
        if (!hit || hit.isWet || hit.ceilingHit || autopilot.worsensLanding(edge, hit) || !(dist[hit.node] <= dist[edge.to] + 30)) return Infinity
        if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles + frames, landingVy: hit.vy }, x)) return Infinity
        return dist[hit.node] + autopilot.fallWrapCost(hit) + autopilot.landingRisk(hit.node, Math.sign(nodes[hit.node].x - x) || dir)
    },
    worsensLanding(edge, hit) {
        return autopilot.leadsBackToFailure(edge.to, hit.node) ||
            (!edge.wraps && (hit.wraps || (autopilot.wrapRoutes?.[hit.node] && !autopilot.wrapRoutes[edge.to])))
    },
    isMomentumJump: true, //jump at running speed from farther off when it's safe, see drive(), false to compare in tools/autopilot-test.js
    jumpHasCeiling(x, feet, dir) {
        const { halfWidth, height } = autopilot.size()
        const reach = Math.min(300, autopilot.p.limit * 40)
        const apex = autopilot.p.jump ** 2 / (2 * autopilot.p.gravity)
        return !!autopilot.grid && autopilot.isBoxSolidExact(Math.min(x, x + dir * reach) - halfWidth, feet - apex - height, Math.max(x, x + dir * reach) + halfWidth, feet - height)
    },
    fitJumpHeight(edge, feet) { //the same landing can need a different hold from the live takeoff or after a miss
        const { p, nodes, dist } = autopilot
        const x = player.position.x, vx = player.velocity.x
        const retry = autopilot.retryCost(edge)
        const canRetry = retry && autopilot.canRetryCrossing(edge)
        const plannedHazard = autopilot.edgeHazardCost(edge)
        if (edge.airJumps) {
            if (!autopilot.canAirJump(edge) || (retry && !canRetry)) return null
            const dir = edge.steer
            const inheritedY = Math.max(-10, Math.min(10, m.standingOn?.velocity?.y || 0))
            const groundPush = dir * m.Fx / player.mass * simulation.delta ** 2 * (vx * dir < 2 ? 1.5 : 1)
            const launchVx = Math.abs(vx) > 4 ? 0.89 * vx : vx
            const hit = autopilot.arc(x + vx, feet, launchVx, inheritedY - p.jump, dir, edge.most, true, autopilot.size(),
                0, true, edge.hold, 0, undefined, { airJumps: edge.airJumps, groundPush })
            if (hit && (!hit.isWet || plannedHazard) && !hit.isPortal && !hit.ceilingHit && !nodes[hit.node].elevator &&
                !nodes[hit.node].transport && !autopilot.worsensLanding(edge, hit) && dist[hit.node] <= dist[edge.to] + 20) {
                return { ...edge, to: hit.node, arcArgs: hit.args, trace: undefined, wraps: hit.wraps || undefined }
            }
            return null
        }
        if (edge.delay || edge.blockJumps || nodes[edge.to].elevator) return edge
        if (!retry && edge.turnY === undefined && !autopilot.jumpHasCeiling(x, feet, edge.dir)) return edge
        const size = autopilot.size()
        const target = nodes[edge.to]
        let best = null, bestScore = Infinity
        const holds = retry ? [6, 10, 14, 18, 22, 28, 34, undefined] : [edge.hold, 6, 8, 10, 11, 12, 14, 16, 18, 20, undefined]
        const tryFit = (hold, turnY, repeating = false) => {
            const hit = autopilot.arc(x, feet, vx, -p.jump, edge.steer, edge.most, true, size, 0, true, hold, 0, turnY)
            if (!hit || (hit.isWet && !plannedHazard) || autopilot.worsensLanding(edge, hit) || !Number.isFinite(dist[hit.node])) return
            const land = nodes[hit.node]
            if (dist[hit.node] > dist[edge.to] + 30 || Math.abs(land.y - target.y) > 40 ||
                (turnY !== undefined && (hit.ceilingHit || land.cover >= 1000 || autopilot.vanishBeforeLanding(land, hit.cycles)))) return
            const margin = turnY === undefined ? 8 : 2
            if (land.y < feet - 35 && hit.apexY > land.y - margin) return //allow for slight differences between the arc and real takeoff
            if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles, landingVy: hit.vy }, x)) return
            const candidate = { ...edge, to: hit.node, hold, turnY, travelFrames: hit.cycles, landingVy: hit.vy, hazardPath: hit.hazardPath, arcArgs: hit.args, trace: undefined, ceilingHit: hit.ceilingHit, wraps: hit.wraps || undefined }
            if (!repeating && autopilot.retryCost(candidate)) return
            const landing = autopilot.surfaceAt(hit.x, land.y)
            const slope = landing ? Math.abs((landing.edge.y2 - landing.edge.y1) / (landing.edge.x2 - landing.edge.x1)) : 0
            const score = hit.cycles + dist[hit.node] + autopilot.fallWrapCost(hit) + autopilot.landingRisk(hit.node, edge.dir) + 0.15 * (feet - hit.apexY) + 0.2 * Math.abs(hit.x - target.x) +
                (slope > autopilot.lipDrop ? 60 : 0) + (hit.ceilingHit ? 45 : 0) + autopilot.pathHazardCost(hit.hazardPath, hit.cycles)
            if (score < bestScore) {
                best = candidate
                bestScore = score
            }
        }
        for (const hold of new Set(holds)) {
            if (!retry || !autopilot.similarJumpHold({ hold }, edge)) tryFit(hold, edge.turnY)
        }
        if (!best && !edge.isRun && Math.abs(vx) < 1.5 && Math.abs(target.x - x) <= 175 && target.y < feet - 35) {
            //Try turning at a different height from this foothold before giving it up.
            const turnHeights = [target.y - 8, target.y + 20, target.y + 50, target.y + 85]
            const alternateHolds = new Set([edge.hold, 12, 20, undefined])
            for (const turnY of turnHeights) {
                if (turnY === edge.turnY || turnY >= feet - 25 ||
                    autopilot.verticalJumpBlocked(x - size.halfWidth, turnY - size.height, x + size.halfWidth, feet - size.height)) continue
                for (const hold of alternateHolds) tryFit(hold, turnY)
            }
        }
        if (!best && canRetry) tryFit(edge.hold, edge.turnY, true)
        return best
    },
    canJumpFromHere(edge, feet, frames = 0, isRobust = false, dx = 0, dvx = 0, allowHazard = false) { //the live jump lands where planned or somewhere as good
        //isRobust also checks it lands that well starting 10 to either side and 1 slower and faster
        if (isRobust) {
            for (const [dx, dvx] of [[0, 0], [-10, 0], [10, 0], [0, -1], [0, 1]]) {
                if (!autopilot.canJumpFromHere(edge, feet, frames, false, dx, dvx, allowHazard)) return false
            }
            return true
        }
        const { dist, nodes, p } = autopilot
        const x = player.position.x + dx + player.velocity.x * frames
        if (frames && !autopilot.isBoxSolid(x - 18, feet + 1, x + 18, feet + 6 + frames * frames * p.gravity)) return false //past the ledge by then, too far into coyote time to count on
        const hit = autopilot.arc(x, feet, player.velocity.x + dvx, -p.jump, edge.steer, edge.most, true, autopilot.size(), edge.delay || 0, true, edge.hold || Infinity, edge.blockJumps, edge.turnY)
        if (!hit || hit.ceilingHit || autopilot.worsensLanding(edge, hit) || (hit.isWet && !allowHazard)) return false
        if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles + frames, landingVy: hit.vy }, x)) return false
        if (hit.node === edge.to) return true
        const to = nodes[edge.to], land = nodes[hit.node] //or right beside where it was planned, landings elsewhere tend to be on the edge of something
        return Math.abs(land.x - to.x) <= 25 && Math.abs(land.y - to.y) < 15 && dist[hit.node] <= dist[edge.to] + 3 && land.cover < 1000
    },
    isExactSides: true, //jumps and falls hit the sides of the map's real shape, not the grid's squares, false to compare
    isLedgeAssist: true, //plan and fly with the game's climb up a ledge the foot just missed, holding toward it, false to compare
    exactSideRoom: 4, //the room a rising jump keeps from the map's real side, with none it grazes corners the real player catches
    ledgeAhead(x, feet, vx, dir, size) { //m.ledgeAssist(): the map just ahead at the slanted foot but not 30 up, a corner or the round end of a pipe the player rides up holding toward it
        const scale = player.scale || 1
        const ax = x + dir * (size.halfWidth + Math.max(0, dir * vx) + 2)
        const g = autopilot.grid
        if (!g?.exact || !autopilot.isBoxSolid(ax - 1, feet - 13 * scale, ax + 1, feet - 11 * scale, g.base)) return false //nothing there on the grid, the map's real shape is only checked near it
        return autopilot.isMapExact(ax - 0.5, feet - 12 * scale - 0.5, ax + 0.5, feet - 12 * scale + 0.5) && !autopilot.isMapExact(ax - 0.5, feet - m.ledgeStep * scale - 0.5, ax + 0.5, feet - m.ledgeStep * scale + 0.5)
    },
    liveJumpLands(edge, feet) { //the jump from where the player is, at the speed it has, lands on the plan
        const { p, nodes, dist } = autopilot
        const hit = autopilot.arc(player.position.x, feet, player.velocity.x, -p.jump, edge.steer, edge.most, true, autopilot.size(), edge.delay || 0, true, edge.hold ?? Infinity, edge.blockJumps || 0, edge.turnY)
        if (!hit || !dist || autopilot.worsensLanding(edge, hit)) return false
        const at = nodes[hit.node], to = nodes[edge.to]
        return hit.node === edge.to || (Math.abs(at.x - to.x) < 60 && Math.abs(at.y - to.y) < 30) || dist[hit.node] <= dist[edge.to] + 5
    },
    keepMomentum(edge, feet, go) {
        if (!autopilot.isMomentumJump || autopilot.riding || input.down || input.field || m.isHolding || autopilot.nodes[edge.from].isCrouch ||
            Math.abs(autopilot.nodes[edge.from].y - feet) > 30 || player.velocity.x * edge.dir < -0.5) return false
        const leap = autopilot.bestLeap(feet, 0, edge)
        if (!leap) return false
        autopilot.why = "jumping without slowing"
        autopilot.commit = null
        autopilot.window.key = ""
        input.up = true
        if (!leap.delay && leap.turnY === undefined && player.velocity.x * leap.steer < leap.most) go(leap.steer)
        autopilot.pending = { edge: leap, mcycle: m.cycle, isJump: true }
        return true
    },
    bestLeap(feet, frames = 0, planned = null) { //simulate a jump from live position and speed, optionally to replace a slowdown before a planned jump
        const { dist, nodes, p } = autopilot
        const cur = autopilot.cur
        if (!dist) return null
        const here = dist[cur]
        if (!(here < Infinity)) return null
        const size = autopilot.size()
        const vx = player.velocity.x
        const x = player.position.x + vx * frames
        if (frames && !autopilot.isBoxSolid(x - 18, feet + 1, x + 18, feet + 6)) return null //not on the ground by then
        const tryLonger = autopilot.recentFailures.some(attempt => {
            if (!attempt.isTooLow || simulation.cycle >= attempt.until) return false
            const from = attempt.from
            return Math.abs(x - from.x) <= 50 && Math.abs(feet - from.y) <= 40
        })
        let best = null, bestValue = planned ? autopilot.edgeCost(planned) + dist[planned.to] + 15 : here - 20 + frames
        const validLanding = hit => {
            if (!hit || hit.isWet || hit.ceilingHit || nodes[hit.node].elevator || !(dist[hit.node] < Infinity)) return false
            if (!autopilot.wrapRoutes?.[cur] && autopilot.landingNeedsWrap(hit)) return false
            if (autopilot.leadsBackToFailure(planned?.to ?? cur, hit.node)) return false
            if (!planned) return true
            const land = nodes[hit.node]
            return !land.dead && land.cover < 1000 && (land.x - x) * planned.dir > 25 &&
                (hit.node === planned.to || (dist[hit.node] < here && dist[hit.node] <= dist[planned.to] + 25))
        }
        for (const steer of planned ? [planned.dir, 0] : [-1, 0, 1]) {
            const tries = steer ? [{ most: p.limit }, { most: p.limit * 0.4 }] : [{ most: 0 }]
            if (steer && autopilot.jumpHasCeiling(x, feet, steer)) {
                for (const hold of [8, 11, 14, 17, 20]) tries.push({ most: p.limit, hold })
            }
            if (steer && tryLonger) {
                for (const hold of [24, 32]) tries.push({ most: p.limit, hold })
            }
            if (planned && !planned.airJumps && steer === planned.steer) tries.push(planned)
            for (const { most, hold, delay, blockJumps, turnY } of tries) {
                const arc = (dx, dvx) => autopilot.arc(x + dx, feet, vx + dvx, -p.jump, steer, most, true, size, delay, true, hold, blockJumps, turnY)
                const hit = arc(0, 0)
                if (!validLanding(hit)) continue
                if (!autopilot.boardingReady({ to: hit.node, travelFrames: hit.cycles + frames, landingVy: hit.vy }, x)) continue
                const edge = { from: cur, to: hit.node, type: autopilot.JUMP, dir: steer || Math.sign(nodes[hit.node].x - x) || 1, cost: hit.cycles + 12, steer, most, hold, delay, blockJumps, turnY, isRun: false, coyote: 0, isLeap: true, isMomentum: !!planned, travelFrames: hit.cycles, landingVy: hit.vy, hazardPath: hit.hazardPath, wraps: hit.wraps || undefined }
                edge.fail = autopilot.failed.get(autopilot.edgeKey(edge)) || 0
                if (edge.fail >= 2 || autopilot.retryCost(edge)) continue
                const value = autopilot.edgeCost(edge) + dist[hit.node] + (planned ? autopilot.landingRisk(hit.node, edge.dir) : 0)
                if (value < bestValue) {
                    //a shortcut has to have room to spare, it still lands about as well a little behind and a little slower, a leap at the edge of its reach comes up short
                    const dir = planned?.dir || steer
                    const offsets = planned ? [[-dir * 8, 0], [dir * 8, 0], [0, -0.7 * dir], [0, 0.7 * dir]] : [[-steer * 10, 0], [0, -0.6 * (Math.sign(vx) || steer)]]
                    const isRoom = offsets.every(([dx, dvx]) => {
                        const worse = arc(dx, dvx)
                        return validLanding(worse) && dist[worse.node] <= dist[hit.node] + 20 &&
                            (!planned || autopilot.boardingReady({ to: worse.node, travelFrames: worse.cycles, landingVy: worse.vy }, x + dx))
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
    beltJump(edge, feet) { //the planned jump off a belt, taken from where the player is, or another jump from here that lands as well, the belt never has it right on the planned spot, or null
        if (autopilot.canJumpFromHere(edge, feet)) return autopilot.fitJumpHeight(edge, feet) || edge
        const leap = autopilot.bestLeap(feet, 0, edge)
        if (leap) return leap
        if (autopilot.edgeHazardCost(edge) && autopilot.canJumpFromHere(edge, feet, 0, false, 0, 0, true)) return autopilot.fitJumpHeight(edge, feet) || edge
        return null
    },
    beltTry: null, //{ key, edge, cycle } the jump off a belt it's trying to take as it's carried by
    beltMiss: new Map(), //how many times each was passed by
    hop: null, //{ at, dir, hold, edge } the last hop against a belt, at is the m.cycle of its jump, hold is how many cycles jump is held
    beltLast: 0, //the speed of the belt the player is on, or was on when it left the ground
    beltHop(feet) { //whatever drive() is doing, going against a belt on foot gets nowhere, so it goes in short hops, nothing pushes the player in the air
        const who = autopilot.beltUnder()
        if (!who || autopilot.flying || autopilot.grapple || autopilot.warp || autopilot.rayMove) return
        const mc = m.cycle
        const hop = autopilot.hop
        if (hop && hop.at === m.buttonCD_jump && mc - hop.at < hop.hold) { //the hop's jump, the feet can stay in contact a cycle or two after it
            input.up = true
            input.left = hop.dir < 0
            input.right = hop.dir > 0
            autopilot.pending = { edge: hop.edge, mcycle: mc, isJump: false, isHop: true, dir: hop.dir, hold: hop.hold }
            return
        }
        const dir = input.right ? 1 : input.left ? -1 : 0
        if (!dir || input.up || input.down || m.crouch || m.hardLandCD >= mc || m.buttonCD_jump + 20 >= mc) return
        const V = autopilot.beltSpeed(who)
        if (V * dir >= 0 || Math.abs(V) < 1.5) return
        const hold = autopilot.hopHold(player.position.x, feet, autopilot.size(), V, player.velocity.x)
        if (!hold) return
        const walk = autopilot.next && autopilot.cur >= 0 ? autopilot.next[autopilot.cur] : null
        input.up = true
        autopilot.why = "hopping against a belt"
        autopilot.hop = { at: mc, dir, hold, edge: walk && walk.type === autopilot.WALK && walk.dir === dir ? walk : null } //m.jump() stamps m.buttonCD_jump with this cycle
        autopilot.pending = { edge: autopilot.hop.edge, mcycle: mc, isJump: false, isHop: true, dir, hold }
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
            if (pending && pending.isHop && mc - pending.mcycle <= 3) { //a short hop against a belt
                autopilot.flight.isHop = true
                autopilot.flight.hopDir = pending.dir
                autopilot.flight.hopHold = pending.hold
                autopilot.flight.hopY = feet
            }
            autopilot.pending = null
        }
        const flight = autopilot.flight
        if (flight.edge?.clearX !== undefined && !flight.clearedLedge) {
            const { clearX, dir, dropY } = flight.edge
            flight.clearedLedge = (x - clearX) * dir >= 0 || feet > dropY + autopilot.size().height
            if (!flight.clearedLedge) {
                go(dir)
                return
            }
        }
        if (flight.isHop) {
            if (feet < flight.hopY + 40) { //let go of jump early for a low hop, and keep pushing the way it was going
                input.up = mc - m.buttonCD_jump < flight.hopHold
                go(flight.hopDir)
                flight.lastVx = vx
                flight.lastVy = vy
                return
            }
            flight.isHop = false //off the end of the belt, falling, land it like any other flight
            flight.edge = null
            flight.to = -1
        }
        if (flight.lastVx === undefined) { //how fast the player was going last cycle, on the ground
            flight.lastVx = autopilot.lastV.x
            flight.lastVy = autopilot.lastV.y
        }
        const isJustJumped = mc - m.buttonCD_jump < 3
        const isPlannedLaunch = isJustJumped && (m.buttonCD_jump === flight.blockJumpAt || m.buttonCD_jump === flight.lastBlockJump ||
            m.buttonCD_jump === flight.airJumpAt ||
            (flight.edge?.isElevatorTransfer && m.buttonCD_jump === flight.mStart))
        const jumpSpeed = flight.edge?.type === autopilot.JUMP ? autopilot.p.jump : 0
        const inheritedRise = Math.min(10, Math.max(0, -(m.standingOn?.velocity?.y ?? 0)))
        const isTooFast = Math.abs(vx) > Math.max(12, autopilot.p.run + 2, autopilot.p.limit + 2) + Math.abs(autopilot.beltLast) || //a belt's speed carries into the jump
            vy < -Math.max(28, jumpSpeed + inheritedRise + 2) //faster than the player's current jump, a boost under the jump
        let hitCeiling = false
        if (flight.isJumped && flight.lastVy < -3 && vy > flight.lastVy + 3 && autopilot.grid) {
            const { halfWidth, height } = autopilot.size()
            const headY = feet - height
            hitCeiling = autopilot.isBoxSolidExact(x - halfWidth + 6, headY + flight.lastVy - 4, x + halfWidth - 6, headY + 5)
            if (hitCeiling) flight.ceilingAt ??= Math.max(1, mc - m.buttonCD_jump)
        }
        if (!hitCeiling && Math.hypot(vx - flight.lastVx, vy - flight.lastVy) > 15 && (!isJustJumped || (isTooFast && !isPlannedLaunch))) { //thrown by a boost, or knocked by something, fly by simulating from here
            const below = autopilot.nodeBelow(x, feet - 40, 2) //the boost it came from, for remembering misses
            flight.from = below >= 0 && nodes[below].isBoost ? below : autopilot.cur
            flight.isLaunched = true
            flight.leaveBoost = m.buttonCD_jump === 0 && autopilot.boosts.length ? autopilot.boostAt(x, feet, autopilot.size()) : null
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
            const age = mc - m.buttonCD_jump
            const isLanding = vy > 0 && autopilot.isBoxSolid(x - 14, feet + 1, x + 14, feet + vy + 6)
            const isCatchingLedge = age > 20 && vy >= -m.apexSpeed - autopilot.p.gravity && vy < m.apexSpeed && autopilot.jumpContactAhead(x + vx, feet, vy)
            input.up = age < Math.min(60, flight.edge.hold ?? 60) && vy < m.apexSpeed && !isLanding && !isCatchingLedge
            if (flight.edge.blockJumps && autopilot.doBlockJump(flight, go, isLanding)) return
            if (flight.edge.airJumps) {
                if (autopilot.doAirJumps(flight, feet, go, isLanding)) return
                if (age > 20) input.up = false //finish this landing without spending another jump
            }
        }
        if ((!flight.edge || flight.isLaunched) && cycle >= (flight.replanAt || 0) && autopilot.dist) { //no plan for this flight, or a boost's drift, find the best landing from here, again every few cycles
            flight.replanAt = cycle + autopilot.flightEvery
            autopilot.planFlight(flight, feet)
        }
        const to = flight.to
        if (to < 0 || nodes[to].dead) return
        const target = nodes[to]
        const edge = flight.edge
        if (edge?.turnY !== undefined && !flight.hasTurned) {
            const isDrop = edge.type === autopilot.FALL
            flight.hasTurned = isDrop ? feet >= edge.turnY : feet <= edge.turnY
            if (!flight.hasTurned) {
                if (isDrop && vx * edge.steer < 0 && !autopilot.ledgeAhead(x, feet, vx, edge.steer, autopilot.size())) go(edge.steer) //brake without grabbing the ledge again
                return
            }
        }
        if (edge?.delay && mc - flight.mStart < edge.delay) return
        if (edge && edge.type === autopilot.WALK && !flight.isLaunched && feet < target.y + 60) { //riding over a low bump or stepping down, the feet leave the ground for a moment, keep walking at full speed
            go(edge.dir)
            return
        }
        if (edge?.isBoarding && target.elevator) {
            if (vx * edge.steer < edge.most) go(edge.steer)
            return
        }
        let control = null //{ steer, most }, push that way while slower than most
        if (edge?.type === autopilot.JUMP && edge.beltVx !== undefined && !flight.isJumped && !flight.isLaunched) { //ran off a belt for a coyote jump, keep the belt's speed the jump was planned with, braking to aim the landing loses it before the jump
            control = { steer: edge.steer || edge.dir, most: Infinity }
        } else if (vy > 0.5 && feet < target.y + 2 && (!flight.isLaunched || target.y - feet < 250)) { //coming down, steer so it lands somewhere good, set up for the next move
            if (autopilot.isLandingSpan) {
                if (cycle >= (flight.landAt || 0)) {
                    flight.landAt = cycle + autopilot.landEvery
                    flight.landSteer = autopilot.landingSteer(to, feet, edge?.type === autopilot.FALL ? edge : null)
                }
                control = flight.landSteer //up to its speed, most 0 against the way it's going brakes to a stop
            } else {
                const g = autopilot.p.gravity
                const t = (-vy + Math.sqrt(vy * vy + 2 * g * Math.max(0, target.y - feet))) / g
                const miss = target.x - (x + vx * t)
                control = { steer: Math.abs(miss) > 8 ? Math.sign(miss) : 0, most: Infinity }
            }
        } else if (edge) { //push like the arc did, after its delay
            control = { steer: edge.steer, most: edge.most }
        }
        if (control && autopilot.isAirCheck && autopilot.canAirCheck(flight)) {
            if ((mc - flight.mStart) % autopilot.airEvery === 0) control = autopilot.airCheck(flight, feet, control)
            else if (flight.air) control = autopilot.airControl(flight.air) //between checks, keep the steering it chose
        } else flight.preview = null
        if (autopilot.isLedgeAssist && vy <= 8 && target.y < feet) { //a ledge just above the foot on the way to the landing, hold toward it and the game climbs it
            const dir = Math.sign(target.x - x) || control?.steer || 0
            if (dir && autopilot.ledgeAhead(x, feet, vx, dir, autopilot.size())) return go(dir)
        }
        if (control && control.steer && vx * control.steer < control.most) go(control.steer)
    },
})
