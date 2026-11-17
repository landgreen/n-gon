"use strict";
//autopilot, exits that appear later, buttons and toggles, exploring, carrying blocks, and moving blocks out of the way, see the top of js/autopilot.js
Object.assign(autopilot, {
    //*********************************************************************
    // exits that appear later, buttons and toggles, and exploring when there's no way
    //*********************************************************************
    levelExits: { //levels whose exit appears later, each returns the spot to head for in the meantime, or -1
        subway() { //each station is built when the player rides past the middle of the tunnel, the exit opens three stations along, so keep riding the trains right
            const x = player.position.x
            let best = null
            for (const who of autopilot.activeTransports) {
                const t = who.autopilotTransport
                if (!t || t.isSwing || !who.stops || who.stops.right < x + 500) continue //a train that carries it farther right
                if (who.stops.left < autopilot.levelExitProgress) continue //never back to a train it already went for, a station can take it left of where that one stops
                if (!best || who.stops.left < best.stops.left) best = who
            }
            if (!best) return -1
            autopilot.levelExitProgress = best.stops.left
            return autopilot.transportNode(best, 1, 0) //its deck at the far stop
        },
    },
    levelTriggers: { //levels where only some buttons and toggles help get to the exit, the rest are left alone
        labs: (kind, who) => kind === "button" && who.min.y > -60, //the tall room's button on the bottom floor adds its climb, the others spawn loot or switch lasers
    },
    isUsefulTrigger(kind, who) {
        const keep = autopilot.levelTriggers[level.levels[level.onLevel]]
        return !keep || keep(kind, who)
    },
    levelExitProgress: -Infinity, //on subway, the left stop of the train it last headed for, see levelExits
    isExplore: true, //when the exit is blocked and no button is left to try, wander to places it hasn't been, leaning toward the exit
    explored: new Map(), //exploration goals already tried, keyed by area and its usable connections
    exploreVisited: new Set(), //areas the player has actually stood in
    exploreApproach: null,
    exploreAgainAt: 0,
    lostSince: 0, //when the exit was blocked and it ran out of buttons, or last got closer to it
    lostBest: Infinity, //the closest it got to the blocked exit, by route cost
    exploreArea(node) {
        return Math.floor(node.x / 200) + "," + Math.floor(node.y / 125)
    },
    rememberExploreGoal() {
        const hunt = autopilot.activeHunt()
        if (hunt?.approach?.id === autopilot.goal) {
            hunt.explored.set(hunt.approach.area, hunt.approach.connections)
            hunt.approach = null
            return
        }
        const approach = autopilot.exploreApproach
        if (approach?.id === autopilot.goal) autopilot.explored.set(approach.area, approach.connections)
        autopilot.exploreApproach = null
    },
    ignoreBlocksUntil: 0, //while simulation.cycle is below this, loose blocks are left off the map it plans on, see ignoreBlocks()
    ignoreBlocksAgainAt: 0,
    ignoreBlocksFor: 1800, //cycles to try shoving through blocks before putting them back on the map and looking again, 0 never does
    isIgnoredBlock(who) { //a loose block it plans to shove through while stuck, not a door, platform, or something hanging
        return simulation.cycle < autopilot.ignoreBlocksUntil && autopilot.isPushable(who) && !who.isNotHoldable && !autopilot.hanging.has(who)
    },
    ignoreBlocks() { //explored everywhere and still no way: plan as if the loose blocks weren't there, shoving through them is slow but usually works
        const cycle = simulation.cycle
        if (!autopilot.ignoreBlocksFor || cycle < autopilot.ignoreBlocksAgainAt || !autopilot.grid) return false
        if (![...autopilot.dyn.keys()].some(who => autopilot.isPushable(who) && !who.isNotHoldable && !autopilot.hanging.has(who))) return false
        autopilot.ignoreBlocksUntil = cycle + autopilot.ignoreBlocksFor
        autopilot.ignoreBlocksAgainAt = autopilot.ignoreBlocksUntil + 600
        autopilot.updateObstacles() //takes them off the grid and relinks the spots around them, they come back the same way once the time is up
        autopilot.isPlanDirty = true
        autopilot.routes.cycle = autopilot.openRoutes.cycle = -1
        autopilot.exploreAgainAt = 0
        autopilot.say("pushing through", "planning as if the blocks weren't there")
        return true
    },
    chooseExplore(exit) { //find an open approach to a new area, or -1 if the exit is reachable
        const cur = autopilot.cur
        if (cur < 0) return -1
        if (!autopilot.isExitBlocked(exit)) { //found a way
            autopilot.lostSince = 0
            return -1
        }
        const { from, prev } = autopilot.routesFrom(cur)
        const left = exit >= 0 ? from[exit] : Infinity //what's left to the exit, through the door or hazard
        if (!autopilot.lostSince) autopilot.lostBest = Infinity
        if (left < autopilot.lostBest - 50 && autopilot.goalType !== "explore") { //still getting closer, the wait starts once it's as close as it gets
            autopilot.lostBest = left
            autopilot.lostSince = simulation.cycle
        }
        if (!autopilot.lostSince) autopilot.lostSince = simulation.cycle
        let wait = 90
        for (let edge = prev[exit]; edge; edge = prev[edge.from]) {
            const to = autopilot.nodes[edge.to]
            if (to.cover >= 3000 && autopilot.isDoorIn(to)) {
                wait = 90
                break
            }
            if (autopilot.exitEdgeBlocked(edge)) wait = 900
        }
        if (simulation.cycle < autopilot.lostSince + wait) return -1
        const nodes = autopilot.nodes
        if (autopilot.goalType === "explore" && autopilot.goal >= 0) { //keep going there until it arrives or it takes too long
            const destination = nodes[autopilot.goal]
            const isThere = cur === autopilot.goal || Math.hypot(nodes[cur].x - destination.x, nodes[cur].y - destination.y) < 50
            if (!isThere && !destination.dead && from[autopilot.goal] < Infinity && !autopilot.isExitBlocked(autopilot.goal) &&
                simulation.cycle < autopilot.goalSince + 900) return autopilot.goal
            autopilot.rememberExploreGoal()
        }
        if (simulation.cycle < autopilot.exploreAgainAt) return -1
        const target = exit >= 0 ? autopilot.nodes[exit] : autopilot.exitSpot()
        const approach = autopilot.exploreToward(target, autopilot.routesFrom(cur, true).from, autopilot.explored)
        if (!approach) {
            if (autopilot.ignoreBlocks()) return -1 //try again once the spots around the blocks are relinked
            autopilot.exploreAgainAt = simulation.cycle + 120 //wait for a connection to change instead of retrying the same areas
            if (autopilot.isLearningSwing()) autopilot.say("watching", "a swinging platform")
            else autopilot.say("stuck", "explored everywhere it can reach")
            return -1
        }
        autopilot.exploreApproach = approach
        return approach.id
    },
    exploreToward(target, reachable, explored, distanceWeight = 0.2) {
        const { nodes, cur } = autopilot
        const areas = new Map(), keys = nodes.map(n => autopilot.exploreArea(n))
        for (let i = 0; i < nodes.length; i++) {
            if (!(reachable[i] < Infinity) || nodes[i].dead) continue
            const area = keys[i]
            if (!areas.has(area)) areas.set(area, { connections: new Set(), frontier: false })
        }
        for (let i = 0; i < nodes.length; i++) {
            if (!(reachable[i] < Infinity) || nodes[i].dead) continue
            const n = nodes[i]
            const area = areas.get(keys[i])
            for (const edge of n.edges) {
                const next = keys[edge.to]
                if (next === keys[i] || edge.wraps || !Number.isFinite(reachable[edge.to]) || autopilot.exitEdgeBlocked(edge)) continue
                const changesFloor = Math.abs(nodes[edge.to].y - n.y) >= 100
                const mechanism = edge.type === autopilot.PORTAL || edge.type === autopilot.RIDE || nodes[edge.to].transport || nodes[edge.to].elevator
                area.connections.add(next)
                if (changesFloor || mechanism) areas.get(next).frontier = true
            }
        }
        for (const area of areas.values()) area.signature = [...area.connections].sort().join(";")
        let best = -1, bestScore = Infinity
        for (let i = 0; i < nodes.length; i++) {
            if (!(reachable[i] < Infinity) || nodes[i].dead || keys[i] === keys[cur]) continue
            const n = nodes[i], area = areas.get(keys[i])
            if (explored.get(keys[i]) === area.signature) continue
            let score = distanceWeight * Math.hypot(n.x - target.x, n.y - target.y) + reachable[i] //straight-line distance is a weak hint through walls
            if (autopilot.exploreVisited.has(keys[i])) score += 500
            else if (area.frontier) score -= 600
            if (n.transport) {
                const stop = n.transport.autopilotTransport.stops[n.transportStop]
                if (autopilot.rodeFrom.some(from => Math.abs(from - stop) < 400)) continue //it came from there
                if (Math.abs(n.x - nodes[cur].x) > 800) score -= 5000 //a ride to somewhere it hasn't been is the best lead there is
            }
            if (score < bestScore) {
                bestScore = score
                best = i
            }
        }
        if (best < 0) return null
        const area = keys[best]
        return { id: best, area, connections: areas.get(area).signature }
    },
    exitEdgeBlocked(edge) {
        const to = autopilot.nodes[edge.to]
        if (autopilot.isUnavailableBoarding(edge)) return true
        if (edge.airJumps && !autopilot.canAirJump(edge)) return true
        if (edge.blockJumps && (edge.blockJumps > autopilot.p.blockJumps || autopilot.p.coyote > 40)) return true
        if (to.cover >= 3000 && autopilot.isDoorIn(to)) return true
        if (simulation.cycle < autopilot.elevatorStuckUntil && (edge.type === autopilot.RIDE || to.elevator)) return true
        return false //slime and beams affect the cost, and can still be crossed if needed
    },
    isUnavailableBoarding(edge) {
        const to = autopilot.nodes[edge.to], who = to.elevator
        return to.elevatorLevel === 1 && who?.autopilotElevator?.waitingForTouch && autopilot.nodes[edge.from].elevator !== who
    },
    isExitBlocked(exit, allowWrap = true) { //look for any open route, including a detour around a closed door
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
                if (seen[edge.to] || nodes[edge.to].dead || (!allowWrap && edge.wraps) || autopilot.exitEdgeBlocked(edge)) continue
                seen[edge.to] = 1
                queue.push(edge.to)
            }
        }
        return true
    },
    triggerNode(trigger) { //where to stand to press it
        if (trigger.kind === "button") return autopilot.nodeNear((trigger.obj.min.x + trigger.obj.max.x) / 2, trigger.obj.min.y + 10, 2, 3)
        return autopilot.nodeNear(trigger.obj.flip.position.x, trigger.obj.flip.position.y + 10, 2, 3)
    },
    chooseHeatButton() {
        if (autopilot.cur < 0) return null
        const { from, wrapped } = autopilot.routesFrom(autopilot.cur, true)
        let best = null, closest = Infinity
        for (const trigger of autopilot.triggers) {
            if (trigger.obj.autopilotHeat?.isOn !== true || !trigger.obj.isUp) continue
            if (simulation.cycle < (autopilot.tried.get(trigger) ?? -Infinity) + 240) continue
            const node = autopilot.triggerNode(trigger)
            if (node < 0) continue
            const distance = from[node]
            if (!(distance < closest) || wrapped[node]) continue
            best = trigger
            closest = distance
        }
        return best
    },
    chooseTrigger(destination, blocked = autopilot.isExitBlocked(destination, false)) {
        if (autopilot.cur < 0 || !autopilot.triggers.length || !blocked) return null
        const cycle = simulation.cycle
        const working = autopilot.goalType === "trigger" ? autopilot.goalWho : null
        const { from, wrapped } = autopilot.routesFrom(autopilot.cur, true)
        const ready = [], carryAgain = []
        let closest = Infinity
        for (const trigger of autopilot.triggers) {
            if (trigger.kind === "button" && (!map.length || (trigger.wasUp && !trigger.obj.isUp))) continue
            const node = autopilot.triggerNode(trigger)
            if (node < 0 || !Number.isFinite(from[node]) || wrapped[node]) continue
            if (trigger === working && working.arrivedAt) return working
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
        if (!choices.length) return null
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
    stepBlocks: new Set(), //blocks left in place as steps this level
    nextBlockStep: 0,
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
    startBlockStep(feet, edge) {
        const { cur, nodes, dist, p } = autopilot
        const cycle = simulation.cycle
        const source = nodes[cur]
        if (!autopilot.isCarryBlocks || !autopilot.grid || !source?.isStatic || autopilot.carry || m.isHolding || !m.onGround || m.energy < 0.05 ||
            cycle < autopilot.nextBlockStep || !autopilot.canHoldBlocks() || source.isBoost || autopilot.beltV(source)) return false
        const jumpRise = autopilot.hopFlight(p, 60).rise
        const targets = nodes.filter(to => !to.dead && to.isStatic && !to.cover && !to.isCrouch && !to.isBoost &&
            feet - to.y >= jumpRise - 45 && feet - to.y <= jumpRise + 170 && Math.abs(to.x - source.x) < 275 &&
            (to.id === edge?.to || (Number.isFinite(dist?.[to.id]) && dist[to.id] < dist[cur]) ||
                (autopilot.goalType === "explore" && Math.hypot(to.x - level.exit.x, to.y - level.exit.y) <
                    Math.hypot(source.x - level.exit.x, feet - level.exit.y) - 100)))
        if (!targets.length) return false
        const size = autopilot.size(), radius = 30 + 40 * (player.scale || 1)
        const from = autopilot.routesFrom(cur).from
        const blocks = body.filter(block => autopilot.isCarryable(block) && !block.isImmutable && block.vertices.length === 4 &&
            !autopilot.isOnButton(block) && !autopilot.stepBlocks.has(block) && !autopilot.isIgnored(block) && !autopilot.hanging.has(block) &&
            Math.abs(block.bounds.max.y - feet) < 30 && Math.abs(block.position.x - source.x) < 500 && block.speed < 3 &&
            Number.isFinite(from[autopilot.fetchNode(block)]))
        let best = null, bestCost = Infinity
        for (const stage of nodes) {
            if (stage.dead || !stage.isStatic || stage.cover || stage.isBoost || stage.isCrouch || Math.abs(stage.y - feet) > 12 ||
                Math.abs(stage.x - source.x) > 135 || !Number.isFinite(from[stage.id])) continue
            for (const dir of [-1, 1]) {
                const x = stage.x + dir * radius
                const floor = autopilot.surfaceAt(x, stage.y, 12, 12)
                if (!floor || Math.abs((floor.edge.y2 - floor.edge.y1) / (floor.edge.x2 - floor.edge.x1)) > 0.15) continue
                const base = [...autopilot.stepBlocks].find(block => body.includes(block) && block.speed < 2 &&
                    Math.abs(block.bounds.max.y - floor.y) < 12 && Math.abs(block.position.x - x) < 12)
                const y = base ? base.bounds.min.y : floor.y
                for (const block of blocks) {
                    const { min, max } = block.bounds, half = (max.x - min.x) / 2, height = max.y - min.y
                    if (half < 27 || half > radius - size.halfWidth - 6 || height < 38 || (base && 2 * half > base.bounds.max.x - base.bounds.min.x)) continue
                    if (!base && (floor.edge.x1 > x - half - 4 || floor.edge.x2 < x + half + 4)) continue
                    if (autopilot.verticalJumpBlocked(x - half, y - height - size.height - 6, x + half, y - 5)) continue
                    for (const to of targets) {
                        const gap = (to.x - x) * dir, rise = y - height - to.y
                        if (gap < 12 || gap > 155 || rise < 25 || rise > jumpRise + (!base && blocks.length > 1 ? 55 : -8)) continue
                        const cost = Math.abs(stage.x - source.x) + Math.abs(block.position.x - stage.x) + gap + 5 * Math.max(0, rise - jumpRise + 8)
                        if (cost >= bestCost) continue
                        best = { block, spots: [stage.id], phase: "fetch", since: cycle, holdAt: 0, step: { x, y, base } }
                        bestCost = cost
                    }
                }
            }
        }
        if (!best) return false
        autopilot.carry = best
        autopilot.nextBlockStep = cycle + 420
        return autopilot.updateCarry()
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
            if (c.trigger) {
                c.trigger.carries = (c.trigger.carries || 0) + 1
                autopilot.tried.set(c.trigger, cycle)
            }
            autopilot.say(isGood ? "dropped" : "stuck", why)
            return false
        }
        if (!body.includes(c.block)) return stop(false, "the block it was carrying is gone")
        if (c.step?.base && (!body.includes(c.step.base) || Math.abs(c.step.base.position.x - c.step.x) > 15)) return stop(false, "the bottom block moved")
        if (c.phase === "settle") {
            if (Math.abs(c.block.bounds.max.y - c.step.y) < 10 && Math.abs(c.block.position.x - c.step.x) < 16 && c.block.speed < 1) {
                autopilot.stepBlocks.add(c.block)
                autopilot.updateObstacles()
                return stop(true, "put a block in place as a step")
            }
            return cycle < c.since + 120 || stop(false, "the step block slid away")
        }
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
        if (cycle > c.since + (c.step ? 360 : 1200)) return stop(false, c.phase === "fetch" ? "couldn't pick up the block" : "couldn't place the block")
        let goal = -1
        if (c.phase === "fetch") goal = autopilot.fetchNode(c.block)
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
            if (autopilot.goalType !== "carry") autopilot.say("carrying", c.step ? "a block to make a step" : "a block to hold the button down")
            autopilot.goal = goal
            autopilot.goalType = "carry"
            autopilot.goalWho = c.block
            autopilot.goalWalk = null
            autopilot.goalSince = cycle
            autopilot.isPlanDirty = true
        }
        return true
    },
    releaseCarry(isDone = true) { //let go of a carry it no longer needs, false only pauses it, like for an upgrade on the way
        const c = autopilot.carry
        if (!c) return
        if (m.holdingTarget === c.block) {
            if (m.isHolding) m.drop()
            else m.holdingTarget = null
        }
        if (isDone && c.trigger) { //counted like one updateCarry() finished, so a door that keeps reopening and closing can't start carries forever
            c.trigger.carries = (c.trigger.carries || 0) + 1
            autopilot.tried.set(c.trigger, simulation.cycle)
        }
        autopilot.carry = null
    },
    fetchNode(block) { //where to stand to pick up a block, beside it or under where it rests, not on top of it, the player can't stand there once it's picked up
        const b = block.bounds, nodes = autopilot.nodes
        const from = autopilot.cur >= 0 ? autopilot.routesFrom(autopilot.cur).from : null
        const near = autopilot.nodeNear(block.position.x, b.max.y, 3, 3)
        const isOnTop = n => nodes[n].x > b.min.x - 15 && nodes[n].x < b.max.x + 15 && Math.abs(nodes[n].y - b.min.y) < 20
        let best = -1, bestCost = Infinity
        for (const n of [near, autopilot.nodeNear(b.min.x - 40, b.max.y, 2, 3), autopilot.nodeNear(b.max.x + 40, b.max.y, 2, 3)]) {
            if (n < 0 || nodes[n].dead || isOnTop(n) || !from || !(from[n] < bestCost)) continue
            best = n
            bestCost = from[n]
        }
        return best >= 0 ? best : near
    },
    carryReach() { //how far from the player's middle the field picks up a block, see m.lookForBlock(), a little under
        return 80 + 70 * Math.max(1, player.scale || 1) + 20
    },
    isHoldingButton(trigger) { //the player standing on this button, it holds the door open only while they're there
        if (trigger.kind !== "button" || trigger.obj.isUp) return false
        const o = trigger.obj, x = player.position.x, feet = playerBody.bounds.max.y
        return x > o.min.x - 30 && x < o.max.x + 30 && feet > o.min.y - 30 && feet < o.max.y + 15
    },
    driveCarry(go) { //close to the block, pick it up, at the spot beside the button, drop it on, true while it's doing one of those
        const c = autopilot.carry
        if (!c || autopilot.goalType !== "carry" || !m.onGround) return false
        const cycle = simulation.cycle
        if (c.phase === "settle") {
            autopilot.why = "waiting for the step block to settle"
            return true
        }
        if (c.phase === "fetch" && !m.isHolding) {
            const b = c.block.position
            if (Math.hypot(b.x - m.pos.x, b.y - m.pos.y) > autopilot.carryReach() || Matter.Query.rayAny(map, b, m.pos)) return false
            autopilot.why = "picking up a block"
            autopilot.carryAim = { x: b.x, y: b.y }
            if (c.step) {
                input.field = m.holdingTarget !== c.block || m.fieldCDcycle >= m.cycle
                return true
            }
            if (!c.holdAt || cycle > c.holdAt + 40) c.holdAt = cycle //hold the field on it, then let go, and m.hold() picks it up
            input.field = cycle < c.holdAt + 14
            return true
        }
        if (c.phase === "bring" && m.isHolding && autopilot.cur === autopilot.goal) {
            if (c.step) {
                autopilot.why = "placing a block as a step"
                const dx = autopilot.nodes[autopilot.goal].x - player.position.x
                if (Math.abs(dx) > 5 && (dx * player.velocity.x <= 0 || Math.abs(dx) > Math.abs(player.velocity.x) * 10)) go(dx)
                const b = c.block.bounds
                autopilot.carryAim = { x: c.step.x, y: Math.min(m.pos.y, c.step.y - (b.max.y - c.block.position.y) - 16) }
                input.field = false
                if (Math.abs(c.block.position.x - c.step.x) < 13 && b.max.y <= c.step.y - 5 && Math.abs(player.velocity.x) < 0.65 && autopilot.blockDropFits(c.block, b)) {
                    m.drop()
                    c.phase = "settle"
                    c.since = cycle
                }
                return true
            }
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
            if (carry.trigger) autopilot.tried.set(carry.trigger, cycle)
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
    //*********************************************************************
    // moving a block out of the way, by hand or with the pilot wave
    //*********************************************************************
    blockClear: null,
    blockClearUntil: new WeakMap(),
    blockClearSize: 25, //a loose block no bigger than this either way gets hopped or pushed, not picked up and moved
    isSmallBlock(who) { //no wider corner to corner than a blockClearSize square, the widest span doesn't change as it turns
        if (!autopilot.isPushable(who) || !who.vertices) return false
        const most = 2 * autopilot.blockClearSize * autopilot.blockClearSize //the square's diagonal, squared
        const v = who.vertices
        for (let i = 0; i < v.length; i++) {
            for (let j = i + 1; j < v.length; j++) if ((v[i].x - v[j].x) ** 2 + (v[i].y - v[j].y) ** 2 > most + 1) return false
        }
        return true
    },
    canClearBlock(block) {
        return autopilot.isPushable(block) && !block.isNotHoldable && !autopilot.hanging.has(block) && (block.collisionFilter.mask & cat.player) &&
            !autopilot.isOnButton(block) && !autopilot.stepBlocks.has(block) && simulation.cycle >= (autopilot.blockClearUntil.get(block) || 0)
    },
    blockDropFits(block, bounds, passage = null) {
        //Anything parked above a drop could fall back into it, so keep the whole shaft clear.
        if (passage && bounds.max.x > passage.min.x && bounds.min.x < passage.max.x &&
            (passage.descend || bounds.min.y < passage.max.y)) return false
        const overlaps = who => (who.parts.length > 1 ? who.parts.slice(1) : who.parts).some(part => !part.isSensor &&
            autopilot.polygonBox(part.vertices, bounds.min.x, bounds.min.y, bounds.max.x, bounds.max.y))
        if (Matter.Bounds.overlaps(player.bounds, bounds) && overlaps(player)) return false
        if (Matter.Query.region(map, bounds).some(overlaps)) return false
        return !Matter.Query.region(body, bounds).some(who => who !== block && overlaps(who))
    },
    blockDropAim(block, angle, passage = null) {
        const radius = 30 + 40 * player.scale //the same distance as m.holding()
        const bounds = block.bounds
        const angles = [angle, angle - Math.PI / 4, angle + Math.PI / 4, angle - Math.PI / 2, angle + Math.PI / 2]
        if (passage) angles.push(Math.PI, 0) //face exactly sideways if the block needs the full holding reach
        for (const aim of angles) {
            const x = m.pos.x + radius * Math.cos(aim)
            const y = m.pos.y + radius * Math.sin(aim)
            const dx = x - block.position.x, dy = y - block.position.y
            const box = {
                min: { x: bounds.min.x + dx, y: bounds.min.y + dy },
                max: { x: bounds.max.x + dx, y: bounds.max.y + dy },
            }
            if (autopilot.blockDropFits(block, box, passage)) return { x, y }
        }
        return null
    },
    blockClearPassage(feet, edge, target, isWalk = false) {
        const x = player.position.x
        const size = autopilot.size()
        const dy = target.y - feet, dx = target.x - x
        const towardDrop = Math.abs(dx) <= Math.max(100, edge ? 0 : dy)
        const descend = !isWalk && dy > 28 && (edge?.type === autopilot.FALL || (!edge || edge.type === autopilot.WALK) && towardDrop)
        const climb = !isWalk && (dy < -25 || edge?.type === autopilot.JUMP)
        if (!isWalk && !descend && !climb && Math.abs(dx) < 8) return null
        const toward = descend ? (edge?.clearX ?? edge?.arcArgs?.[0] ?? target.x) - x : dx
        const end = isWalk ? target.x : x + Math.max(-55, Math.min(55, toward))
        const top = Math.min(feet, isWalk ? target.y : feet) - size.height - (climb ? 85 : 0)
        const bottom = isWalk ? target.y : descend ? Math.min(target.y, feet + 115) : feet - 8
        return {
            min: { x: Math.min(x, end) - size.halfWidth, y: top },
            max: { x: Math.max(x, end) + size.halfWidth, y: bottom },
            descend,
        }
    },
    startBlockClear(feet, edge, approach = null) {
        if (!body.length || autopilot.carry || autopilot.riding || autopilot.train || m.isHolding || !m.onGround || m.fieldCDcycle >= m.cycle || !autopilot.canHoldBlocks()) return false
        if (edge && edge.type !== autopilot.WALK && edge.type !== autopilot.FALL && edge.type !== autopilot.JUMP) return false
        const cycle = simulation.cycle
        const hunt = autopilot.activeHunt()
        const target = approach || (!edge && autopilot.goalType === "explore" ? hunt?.who.position : autopilot.nodes[edge?.to ?? autopilot.goal]) ||
            autopilot.exitSpot()
        const passage = autopilot.blockClearPassage(feet, edge, target, approach?.isWalk)
        if (!passage) return false
        const support = autopilot.standingOn()
        let best = null, bestDistance = Infinity
        for (const block of Matter.Query.region(body, passage)) {
            if ((approach && block !== approach.block) || !autopilot.canClearBlock(block) || (!approach && autopilot.isSmallBlock(block))) continue
            if (block === support ? !approach?.isWalk && !passage.descend : block.speed > 8) continue
            const b = block.bounds
            if (edge?.type === autopilot.JUMP && target.x > b.min.x && target.x < b.max.x && Math.abs(target.y - b.min.y) < 15) continue //the jump lands on this block
            const dx = block.position.x - m.pos.x, dy = block.position.y - m.pos.y
            const distance = Math.hypot(dx, dy)
            if (distance > autopilot.carryReach() || distance >= bestDistance || Matter.Query.rayAny(map, m.pos, block.position)) continue
            const angle = Math.atan2(-dy, -dx)
            const dropAim = autopilot.blockDropAim(block, angle, passage)
            if (!dropAim) continue
            best = { block, angle, passage, start: cycle, pickedUp: false, dropAim }
            bestDistance = distance
        }
        if (!best) return false
        autopilot.blockClear = best
        autopilot.pending = autopilot.backUp = autopilot.commit = null
        autopilot.blockedCycles = 0
        return autopilot.driveBlockClear(feet)
    },
    clearUnderfootDrop(feet) {
        const block = autopilot.standingOn()
        if (!autopilot.grid?.exact || m.isHolding || autopilot.carry || !body.includes(block) ||
            !autopilot.isCarryable(block) || !autopilot.canClearBlock(block) || !autopilot.canHoldBlocks()) return false
        const x = player.position.x
        const below = autopilot.nodeBelow(x, Math.max(feet + 50, block.bounds.max.y + autopilot.cell))
        const landing = autopilot.nodes[below]
        if (!landing?.isStatic || landing.isBoost || landing.elevator || landing.transport || landing.y - feet > 700) return false
        const hunt = autopilot.activeHunt()
        const target = (autopilot.goalType === "explore" && hunt?.who.position) || autopilot.nodes[autopilot.goal] ||
            autopilot.exitSpot()
        const cost = autopilot.dist?.[below]
        const savesRoute = Number.isFinite(cost) && cost + 60 < (autopilot.dist?.[autopilot.cur] ?? Infinity)
        if (!savesRoute && (Math.abs(target.x - x) > 75 || target.y < feet + 50)) return false
        const width = autopilot.size().halfWidth - 3
        const shaft = [x - width, feet, x + width, landing.y - 8]
        if (autopilot.isMapExact(...shaft) || autopilot.boxInHazard(shaft)) return false
        const bounds = { min: { x: shaft[0], y: shaft[1] }, max: { x: shaft[2], y: shaft[3] } }
        if (Matter.Query.region(body, bounds).some(who => who !== block && (who.collisionFilter.mask & cat.player)) ||
            autopilot.dynList.some(who => who !== block && (who.autopilotDynamic || who.isRay) && Matter.Bounds.overlaps(who.bounds, bounds))) return false
        if (m.fieldCDcycle >= m.cycle) {
            autopilot.why = "waiting to pick up a block"
            autopilot.pending = null
        } else if (!autopilot.startBlockClear(feet, null, { x, y: landing.y, block })) return false
        autopilot.flight = null
        return true
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
                autopilot.lastPlanCycle = -Infinity
                autopilot.say("cleared", "a block in the way")
            }
            return true
        }
        input.field = input.fire = input.left = input.right = input.up = input.down = false
        if (!body.includes(block) || (m.isHolding && !isHeld) || (!isHeld && (clear.pickedUp || cycle > clear.start + 30 ||
            !Matter.Bounds.overlaps(block.bounds, clear.passage)))) return stop(false)
        if (!isHeld) {
            autopilot.why = "picking up a blocking block"
            autopilot.carryAim = block.position
            input.field = m.holdingTarget !== block
            return true
        }
        clear.pickedUp = true
        autopilot.why = "moving a block out of the way"
        const aim = autopilot.blockDropAim(block, clear.angle, clear.passage)
        if (aim) clear.dropAim = aim
        autopilot.carryAim = clear.dropAim
        if (aim && Math.hypot(block.position.x - aim.x, block.position.y - aim.y) < 10 && autopilot.blockDropFits(block, block.bounds, clear.passage)) return stop(true)
        if (cycle > clear.start + 60) return stop(false)
        return true
    },
    movePilotWave(feet) { //Bells theorem reverses the field input. Use the mouse to pull blocks out of our way.
        if (m.fieldMode !== 8 || !tech.isNoPilotCost) {
            autopilot.pilotClear = null
            return
        }
        const cycle = simulation.cycle
        if (autopilot.blockClear || autopilot.carry || m.isHolding || m.fieldCDcycle >= m.cycle) {
            autopilot.pilotClear = null
            return
        }
        const x = player.position.x
        const size = autopilot.size()
        const edge = autopilot.pending?.edge || autopilot.next?.[autopilot.cur]
        const target = autopilot.nodes[edge?.to ?? autopilot.goal]
        const dir = Number(input.right) - Number(input.left) || Math.sign((target?.x ?? x) - x) || edge?.dir
        const clear = autopilot.pilotClear
        if (clear && (cycle >= clear.until || !body.includes(clear.block) ||
            autopilot.standingOn() === clear.block || autopilot.isOnButton(clear.block) ||
            (clear.block.position.x - x) * clear.dir < -size.halfWidth - clear.halfWidth)) {
            autopilot.pilotClear = null
        }
        if (clear && cycle >= clear.until && !clear.isForward) {
            autopilot.blockClearUntil.set(clear.block, cycle + 75)
        }
        if (!autopilot.pilotClear && dir && autopilot.why !== "in the exit") {
            const ahead = x + 110 * dir
            const top = Math.min(feet, Math.max(feet - 100, target?.y ?? feet)) - size.height
            const bounds = { min: { x: Math.min(x, ahead) - size.halfWidth, y: top }, max: { x: Math.max(x, ahead) + size.halfWidth, y: feet - 8 } }
            const wave = m.fieldPosition
            const radius = Math.max(65, m.fieldRadius)
            const block = Matter.Query.region(body, bounds).find(who => (who.collisionFilter.mask & cat.player) &&
                cycle >= (autopilot.blockClearUntil.get(who) || 0) &&
                !who.isNotHoldable && autopilot.isPushable(who) && !autopilot.hanging.has(who) && !autopilot.isOnButton(who) && !autopilot.stepBlocks.has(who) &&
                autopilot.standingOn() !== who &&
                Math.hypot(who.position.x - wave.x, who.position.y - wave.y) < radius)
            if (block) {
                const { bounds: b, position } = block
                const halfWidth = (b.max.x - b.min.x) / 2
                const halfHeight = (b.max.y - b.min.y) / 2
                const lift = top - halfHeight - 30
                const safe = spot => !Matter.Query.rayAny(map, position, spot, Math.max(70, 2 * Math.min(halfWidth, halfHeight))) &&
                    !Matter.Query.rayAny(map, wave, spot, 64)
                const above = [170, 85, 0].map(lead => ({ x: position.x, y: lift - lead })).find(safe)
                const forward = { x: position.x + dir * 245, y: position.y }
                const aim = above || (safe(forward) ? forward : null)
                autopilot.pilotClear = { block, dir, top, aim, isForward: aim === forward, halfWidth, until: cycle + (aim ? 110 : 20) }
            }
        }
        const move = autopilot.pilotClear
        if (move?.aim) {
            autopilot.carryAim = move.aim
            input.field = false
            input.fire = false
            if (m.onGround && !move.isForward && move.block.bounds.max.y >= move.top) {
                input.left = input.right = input.up = false
                autopilot.pending = null
                autopilot.blockedCycles = 0
                autopilot.isHolding = true
                autopilot.why = "moving a block with pilot wave"
            } else if (move.isForward) autopilot.why = "guiding a block ahead with pilot wave"
        } else if (move || clear) input.field = true
    },
})
