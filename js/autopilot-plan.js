"use strict";
//autopilot, planning a path to the goal, saying what it's doing, power ups, detours, and choosing a goal, see the top of js/autopilot.js
Object.assign(autopilot, {
    //*********************************************************************
    // planning, a shortest path search backward from the goal
    //*********************************************************************
    pathIsWet(path) {
        return !!path?.some(autopilot.boxInHazard)
    },
    boxInArea(box, area) {
        return area.isOn !== false && area.height > 0 && box[2] > area.min.x && box[0] < area.max.x && box[3] > area.min.y && box[1] < area.max.y
    },
    boxInHazard(box) {
        return autopilot.hazards.some(area => autopilot.boxInArea(box, area)) ||
            autopilot.laserHazards.some(beam => autopilot.beamCrossesBox(beam, box))
    },
    pathHazardCost(path, frames) {
        if (!path?.length) return 0
        let exposure = 0
        for (const box of path) {
            let rate = 0
            for (const area of autopilot.hazards) {
                if (autopilot.boxInArea(box, area)) rate = Math.max(rate, area.autopilotIsHeat ? autopilot.heatPenalty : autopilot.hazardPenalty)
            }
            if (rate < autopilot.hazardPenalty && autopilot.laserHazards.some(beam => autopilot.beamCrossesBox(beam, box))) rate = autopilot.hazardPenalty
            exposure += rate
        }
        return (frames / 60) * (exposure / path.length)
    },
    beamCrossesBox({ x, y, dx, dy, pad }, [left, top, right, bottom]) {
        //Clip the segment parameter to the times spent inside each axis of the swept box.
        left -= pad
        right += pad
        top -= pad
        bottom += pad
        if ((!dx && (x < left || x > right)) || (!dy && (y < top || y > bottom))) return false
        const xEnter = dx ? ((dx > 0 ? left : right) - x) / dx : 0
        const xLeave = dx ? ((dx > 0 ? right : left) - x) / dx : 1
        const yEnter = dy ? ((dy > 0 ? top : bottom) - y) / dy : 0
        const yLeave = dy ? ((dy > 0 ? bottom : top) - y) / dy : 1
        return Math.max(0, xEnter, yEnter) <= Math.min(1, xLeave, yLeave)
    },
    edgeHazardCost(edge) {
        if (!autopilot.hazards.length && !autopilot.laserHazards.length) return 0
        if (edge.hazardRevision === autopilot.hazardRevision) return edge.hazardCost
        const from = autopilot.nodes[edge.from], to = autopilot.nodes[edge.to]
        let path = edge.hazardPath
        if (!path) {
            const size = autopilot.size()
            const height = from.isCrouch && to.isCrouch ? size.crouchHeight : size.height
            path = [[Math.min(from.x, to.x) - size.halfWidth, Math.min(from.y, to.y) - height,
                Math.max(from.x, to.x) + size.halfWidth, Math.max(from.y, to.y)]]
        }
        edge.hazardRevision = autopilot.hazardRevision
        return edge.hazardCost = autopilot.pathHazardCost(path, edge.travelFrames || edge.cost)
    },
    hazardPenalty: 1500, //cost per second exposed, independent of how many edges cross a hazard
    heatPenalty: 30, //keep moving through heat instead of climbing around it
    jumpCost: 12, //prefer an equivalent route with fewer jumps
    boostEntryCost: 300, //prefer a direct landing over a bounce, but keep routes that need a pad
    refreshHazards() { //per-hazard values, so two moving hazards cannot cancel each other's change
        const beams = []
        const cycle = simulation.cycle
        for (const { who, seen } of autopilot.lasers) {
            if (cycle - seen > 12 || who.isOn === false || m.isCloak) continue
            const { position, look } = who
            if (position.x === look.x && position.y === look.y) continue
            const pad = (who.isArc ? who.arcHitWidth / 2 : 0) + 5
            if (who.reflections > 0 && who.trace) { //each bounce is its own segment
                const path = who.trace(false).path
                for (let i = 1; i < path.length; i++) beams.push({ x: path[i - 1].x, y: path[i - 1].y, dx: path[i].x - path[i - 1].x, dy: path[i].y - path[i - 1].y, pad })
                continue
            }
            const hit = vertexCollision(position, look, [map, body])
            const end = hit.who ? hit : look
            beams.push({ x: position.x, y: position.y, dx: end.x - position.x, dy: end.y - position.y, pad })
        }
        const areas = autopilot.hazards.map(h => [h.isOn !== false, !!h.autopilotIsHeat, h.min.x, h.min.y, h.max.x, h.max.y, h.height].join(","))
        const areaSignature = areas.join(";")
        const signature = areaSignature + "|" + beams.map(({ x, y, dx, dy, pad }) =>
            [x, y, x + dx, y + dy, pad].map(value => Math.round(value / 10)).join(",")).join(";")
        if (signature === autopilot.hazardSignature) return
        if (areaSignature !== autopilot.hazardSignature.split("|")[0]) autopilot.lastHeavyMove = cycle
        autopilot.laserHazards = beams
        autopilot.hazardSignature = signature
        autopilot.hazardRevision++
        autopilot.flyStamp = autopilot.flyStamp % 65000 + 1
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
    platformForecast(who, frames, samples) { //predict only known elevator rules; never extend unknown motion through an unseen reversal
        const e = who.autopilotElevator
        const now = { x: who.position.x, y: e ? who.position.y - e.height / 2 : who.bounds.min.y, vy: who.velocity.y, reliable: false }
        if (samples) samples.push(now)
        if (!e || e.mode === "unknown" || simulation.cycle - e.commandCycle > 2 ||
            (who.constraint && Matter.Composite.get(engine.world, who.constraint.id, "constraint"))) return now
        if (m.isTimeDilated) {
            const still = { ...now, vy: 0, reliable: true }
            if (samples) for (let i = 0; i < frames; i++) samples.push(still)
            return still
        }
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
            if (samples) samples.push({ x: who.holdX, y, vy })
        }
        return { x: who.holdX, y, vy, reliable: frames <= 240 }
    },
    elevatorExit(who, edge) { //find the first step off the lift, beyond any ride or walk across the deck
        for (let i = 0; edge && i < 32; i++, edge = autopilot.next[edge.to]) {
            if (autopilot.nodes[edge.to].elevator !== who) return edge
        }
        return null
    },
    elevatorRunTo(target, dir) { //advance the grounded approach using the same input each cycle
        let x = player.position.x, vx = player.velocity.x
        const drag = 1 - (player.frictionAir ?? 0.001)
        const push = m.Fx / player.mass * simulation.delta ** 2
        const positions = []
        for (let i = 0; i < 90; i++) {
            x += vx
            positions.push(x)
            if ((target - x) * dir <= 0) return { positions, vx }
            const damp = Math.abs(vx) > 4 ? 0.89 : 1
            vx = vx * damp * drag + dir * push * (vx * dir < 2 ? 1.5 : 1)
        }
        return null
    },
    elevatorDrop(who, edge, feet) { //try the planned exit from the height where the player will reach the lip
        const { nodes, dist, p } = autopilot
        const exit = autopilot.elevatorExit(who, edge)
        if (!exit || !dist || !Number.isFinite(dist[exit.to])) return null
        const to = nodes[exit.to]
        const dir = Math.sign(to.x - who.holdX)
        if (!dir || to.elevator) return null
        const size = autopilot.size()
        const lip = who.holdX + dir * who.autopilotElevator.width / 2
        const start = lip + dir * (size.foot + 2)
        const approach = autopilot.elevatorRunTo(start, dir)
        if (!approach) return null
        const deck = []
        const prediction = autopilot.platformForecast(who, approach.positions.length, deck)
        const leaveY = prediction.reliable ? prediction.y : feet
        if (to.y < leaveY - 10) return null
        //Check clearance as the deck carries the player toward the edge.
        for (let i = 0; i < approach.positions.length; i++) {
            const cx = approach.positions[i], y = prediction.reliable ? deck[i + 1].y : feet
            if (autopilot.isBoxSolidExact(cx - size.halfWidth + 3, y - size.height, cx + size.halfWidth - 3, y - 14)) return null
        }
        const hit = autopilot.arc(start, leaveY, approach.vx, prediction.vy, dir, p.limit, false, size, 0, true)
        if (!hit || hit.isWet || hit.isPortal || hit.wraps) return null
        const land = nodes[hit.node]
        if (land.dead || !land.isStatic || land.isBoost || land.elevator || land.cover >= 3000 || land.y < leaveY - 10 || land.y - leaveY > 400) return null
        if (dist[land.id] > dist[exit.to] + 30 || !Number.isFinite(dist[land.id])) return null
        if (tech.isFallingDamage && hit.vy * player.mass > 150) return null
        const drop = { from: edge.from, to: land.id, type: autopilot.FALL, dir, steer: dir, most: p.limit, cost: hit.cycles, fail: 0 }
        return autopilot.retryCost(drop) && !autopilot.canRetryCrossing(drop) ? null : drop
    },
    boardingReady(edge, x, feet) {
        const to = autopilot.nodes[edge.to], who = to.elevator
        if (to.transport) { //a deck is only there while the transport is at that stop
            if (autopilot.train === to.transport) return true
            if (!to.transport.autopilotTransport) return false
            if (!to.transport.autopilotTransport.isSwing) return autopilot.transportAt(to.transport) === to.transportStop
            //a swinging platform only pauses there, it has to be there when the player arrives, and a little after
            const frames = Math.round(edge.travelFrames || Math.abs(to.x - x) / Math.max(1, autopilot.p.run) + 6)
            return autopilot.swingArrives(to.transport, to.transportStop, simulation.cycle + frames, to.x)
        }
        if (!who) return true
        if (!autopilot.elevatorEnabled(who)) return false
        if (who.autopilotElevator.waitingForTouch) return to.elevatorLevel === 0 && Math.abs(who.bounds.min.y - to.y) < 25
        if (edge.type === autopilot.WALK && feet !== undefined) {
            const dir = Math.sign(who.holdX - x) || edge.dir
            const lip = who.holdX - dir * who.autopilotElevator.width / 2
            const approach = autopilot.elevatorRunTo(lip + dir * 5, dir)
            if (!approach) return false
            const deck = autopilot.platformForecast(who, approach.positions.length)
            return deck.y >= feet - 12 && deck.y <= feet + 22 && (deck.reliable || Math.abs(who.velocity.y) < 0.5)
        }
        const frames = edge.travelFrames || Math.abs(to.x - x) / Math.max(1, autopilot.p.run) + 6
        const prediction = autopilot.platformForecast(who, frames)
        if (!prediction.reliable) return Math.abs(prediction.y - to.y) < 25 && Math.abs(who.velocity.y) < 0.5
        //A descending player must meet a platform that is actually present at the predicted landing time.
        return Math.abs(prediction.y - to.y) < 30 && (!edge.landingVy || edge.landingVy > prediction.vy)
    },
    elevatorJump(edge, feet, riding = null) {
        const { nodes, p, dist } = autopilot
        const target = nodes[edge.to], lift = target.elevator
        if (target.isCrouch || (!riding && (!lift || !autopilot.elevatorEnabled(lift) ||
            (lift.autopilotElevator.waitingForTouch && target.elevatorLevel !== 0)))) return null
        const x = player.position.x, vx = player.velocity.x, size = autopilot.size()
        const dir = Math.sign(target.x - x)
        if (!dir || Math.abs(target.x - x) > 420) return null
        const dt2 = simulation.delta * simulation.delta
        const transfer = { groundPush: dir * m.Fx / player.mass * dt2 * (vx * dir < 2 ? 1.5 : 1) }
        const launchVx = Math.abs(vx) > 4 ? 0.89 * vx : vx //ground control still applies its braking on the jump frame
        let startY = feet, vy = 0
        if (riding) {
            const deck = autopilot.platformForecast(riding, 1)
            if (deck.reliable) startY += deck.y - (riding.position.y - riding.autopilotElevator.height / 2)
            vy = Math.max(-10, Math.min(10, deck.vy))
        } else {
            const deck = []
            if (!autopilot.platformForecast(lift, 95, deck).reliable) return null
            //The next physics step precedes ground control, which applies the jump for the step after.
            Object.assign(transfer, { deck: deck.slice(1), halfWidth: lift.autopilotElevator.width / 2 - 8, height: lift.autopilotElevator.height, to: edge.to })
        }
        let hazardousJump = null
        for (const hold of new Set([12, 20, edge.hold || 60, 60])) {
            for (const most of [p.limit, p.limit * 0.55, p.limit * 0.3]) {
                const hit = autopilot.arc(x + vx, startY, launchVx, vy - p.jump, dir, most, true, size, 0, true, hold, 0, undefined, transfer)
                if (!hit || hit.ceilingHit || hit.isPortal || hit.wraps) continue
                const land = nodes[hit.node]
                if (!riding && (!hit.isDeckLanding ||
                    Math.abs(hit.x + hit.vx * 8 - lift.holdX) > transfer.halfWidth)) continue
                if (riding && (!dist || !Number.isFinite(dist[hit.node]) || land.dead || land.elevator || land.cover >= 1000 ||
                    Math.abs(land.y - target.y) > 30 || dist[hit.node] > dist[edge.to] + 30)) continue
                const jump = { from: edge.from, to: hit.node, type: autopilot.JUMP, dir, steer: dir, most, hold, cost: hit.cycles + 12, fail: 0, isElevatorTransfer: true, isBoarding: !!lift }
                if (autopilot.retryCost(jump) && !autopilot.canRetryCrossing(jump)) continue
                if (!hit.isWet) return jump
                if (!hazardousJump && autopilot.edgeHazardCost(edge)) hazardousJump = jump
            }
        }
        return hazardousJump
    },
    edgeCost(edge) {
        const to = autopilot.nodes[edge.to]
        if (autopilot.isUnavailableBoarding(edge)) return Infinity
        if (edge.airJumps && !autopilot.canAirJump(edge)) return Infinity
        if (to.cover >= 3000) {
            const blocker = autopilot.blockerIn(to)
            if (blocker && (!blocker.isDoor && !blocker.isRay || autopilot.triedDoors.has(blocker))) return Infinity
        }
        if (edge.blockJumps && (edge.blockJumps > autopilot.p.blockJumps || autopilot.p.coyote > 40)) return Infinity
        let cost = edge.cost * (1 + 6 * edge.fail) + 120 * edge.fail + to.cover
        if (edge.type === autopilot.JUMP) cost += autopilot.jumpCost + (edge.ceilingHit ? 45 : 0)
        if (edge.type === autopilot.RIDE && to.transport && autopilot.rodeFrom.length) { //riding back the way it came is a last resort, anything it hasn't seen is the other way
            const stop = to.transport.autopilotTransport.stops[to.transportStop]
            if (autopilot.rodeFrom.some(from => Math.abs(from - stop) < 400)) cost += 20000
        }
        return cost + (to.isBoost ? autopilot.boostEntryCost : 0) + autopilot.edgeHazardCost(edge) + autopilot.fallWrapCost(edge)
    },
    fallWrapCost(move) {
        return 20000 * (move.wraps || 0) //also account for wraps when comparing live arcs and goals
    },
    canRetryCrossing(edge) {
        return (autopilot.routeRank?.[edge.from] & 1) !== 0
    },
    leadsBackToFailure(from, to) {
        return (autopilot.routeRank?.[to] & 1) !== 0 && !(autopilot.routeRank?.[from] & 1)
    },
    plan() {
        const nodes = autopilot.nodes
        const count = nodes.length
        const openOnly = autopilot.goalType === "explore" || autopilot.isUpgrade(autopilot.goalWho) || autopilot.isLiveBoss(autopilot.goalWho) || (autopilot.goalType === "exit" &&
            (autopilot.triggers.length || autopilot.hasFallWrap()) && !autopilot.isExitBlocked(autopilot.goal))
        const dist = autopilot.dist = new Float64Array(count).fill(Infinity)
        const next = autopilot.next = new Array(count).fill(null)
        const wrapped = autopilot.wrapRoutes = new Uint8Array(count)
        const rank = autopilot.routeRank = new Uint8Array(count).fill(4)
        autopilot.isPlanDirty = false
        autopilot.lastPlanCycle = simulation.cycle
        if (autopilot.goal < 0 || nodes[autopilot.goal].dead) return
        autopilot.searchRoutes(autopilot.goal, dist, next, wrapped, true, openOnly, rank)
    },
    heap() { //binary heap of [distance, node], the closest on top, for plan() and pathFrom()
        const d = [], n = []
        return {
            d, n,
            push(dist, node) {
                let i = d.length
                d.push(dist)
                n.push(node)
                while (i > 0) {
                    const parent = (i - 1) >> 1
                    if (d[parent] <= dist) break
                    d[i] = d[parent]
                    n[i] = n[parent]
                    i = parent
                }
                d[i] = dist
                n[i] = node
            },
            pop() {
                const lastD = d.pop(), lastN = n.pop()
                const length = d.length
                if (length === 0) return
                let i = 0
                for (; ;) {
                    let child = 2 * i + 1
                    if (child >= length) break
                    if (child + 1 < length && d[child + 1] < d[child]) child++
                    if (d[child] >= lastD) break
                    d[i] = d[child]
                    n[i] = n[child]
                    i = child
                }
                d[i] = lastD
                n[i] = lastN
            }
        }
    },
    searchRoutes(start, dist, links, wrapped, reverse = false, openOnly = false, rank = new Uint8Array(dist.length).fill(4)) {
        const nodes = autopilot.nodes
        //Search without known failures first. Within routes that stay on the map, a retry is a fallback.
        //Fall-off shortcuts come after both. An edge can only add risk, so each queue finishes in order.
        const queues = [autopilot.heap()]
        dist[start] = 0
        rank[start] = 0
        queues[0].push(0, start)
        for (let risk = 0; risk < queues.length; risk++) {
            const heap = queues[risk]
            if (!heap) continue
            while (heap.d.length) {
                const d = heap.d[0], n = heap.n[0]
                heap.pop()
                if (rank[n] !== risk || d > dist[n]) continue
                const edges = reverse ? autopilot.rev[n] : nodes[n].edges
                if (!edges) continue
                for (let i = 0; i < edges.length; i++) {
                    const edge = edges[i]
                    const to = reverse ? edge.from : edge.to
                    if (nodes[to].dead || rank[to] < risk || (openOnly && autopilot.exitEdgeBlocked(edge))) continue
                    const failure = autopilot.crossingFailure(edge)
                    const nextRisk = risk | (edge.wraps ? 2 : 0) | (failure?.until === Infinity ? 1 : 0)
                    if (nextRisk > rank[to]) continue
                    const total = d + autopilot.edgeCost(edge) + (failure ? 360 : 0)
                    if (!Number.isFinite(total) || (nextRisk === rank[to] && total >= dist[to])) continue
                    dist[to] = total
                    rank[to] = nextRisk
                    wrapped[to] = (nextRisk & 2) !== 0
                    if (links) links[to] = edge
                    const queue = queues[nextRisk] ??= autopilot.heap()
                    queue.push(total, to)
                }
            }
        }
    },
    pathFrom(start, prev = null, wrapped = new Uint8Array(autopilot.nodes.length), openOnly = false) { //distances from one node to every other, to pick the closest thing to go for
        const dist = new Float64Array(autopilot.nodes.length).fill(Infinity)
        if (start >= 0) autopilot.searchRoutes(start, dist, prev, wrapped, false, openOnly)
        return dist
    },
    routes: { cycle: -1, start: -1, count: 0, from: null, prev: null }, //pathFrom() with the edge that reached each node, kept for the rest of the cycle
    openRoutes: { cycle: -1, start: -1, count: 0, from: null, prev: null },
    routesFrom(start, openOnly = false) {
        const r = openOnly ? autopilot.openRoutes : autopilot.routes
        if (r.cycle !== simulation.cycle || r.start !== start || r.count !== autopilot.nodes.length) {
            r.prev = []
            r.wrapped = new Uint8Array(autopilot.nodes.length)
            r.from = autopilot.pathFrom(start, r.prev, r.wrapped, openOnly)
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
        return !!autopilot.blockerIn(node)
    },
    blockerIn(node) { //the heavy thing in the way standing at node, worked out once a cycle for each node, the plan asks for every move that lands there
        if (node.blockerCycle === simulation.cycle) return node.blocker
        node.blockerCycle = simulation.cycle
        return node.blocker = autopilot.findBlocker(node)
    },
    findBlocker(node) {
        const size = autopilot.size()
        const box = { min: { x: node.x - size.halfWidth + 3, y: node.y - (node.isCrouch ? size.crouchHeight : size.height) + 3 }, max: { x: node.x + size.halfWidth - 3, y: node.y - 3 } }
        let opening = null
        for (const who of autopilot.dynList) {
            if (autopilot.obstacleWeight(who) < 3000 || !Matter.Query.region([who], box).length) continue
            if (!autopilot.doorOpening(who)) return who
            opening = who
        }
        return opening
    },
    nodeFor(where, reach = 8) { //a node to stand at to get to a point, under it or beside it
        let node = autopilot.nodeNear(where.x, where.y + 20, 2, 3)
        if (node < 0) node = autopilot.nodeBelow(where.x, where.y, 1)
        if (node >= 0 && autopilot.nodes[node].y - where.y > reach * 25) node = -1
        return node
    },
    exitSpot() { //the middle of the exit's floor
        return { x: level.exit.x + 50, y: level.exit.y }
    },
    exitNode() {
        const exit = autopilot.nodeNear(level.exit.x + 50, level.exit.y, 2, 3)
        if (exit >= 0) return exit
        const stand = autopilot.levelExits[level.levels[level.onLevel]] //a level whose exit isn't there yet, where to go to get to it
        return stand ? stand() : -1
    },
    walkToExit() {
        if (level.exit.isInverted || level.isFlipping) return null
        const { x, y } = level.exit
        if (player.position.y <= y - 250 || player.position.y >= y + 35) return null
        return autopilot.straightWalk(x + 50) ? x + 50 : null
    },

    //*********************************************************************
    // saying what it's doing
    //*********************************************************************
    saidAt: new Map(), //the cycle each word was last said, a word comes back after 900 cycles at the soonest, even with other words in between, so two don't flicker
    isRepeat(state) {
        return simulation.cycle < (autopilot.saidAt.get(state) ?? -Infinity) + 900
    },
    say(state, note = "") { //a word above the player for a moment when what it's doing changes, note is why, for tools/autopilot-test.js
        if (autopilot.isRepeat(state)) return
        autopilot.saidAt.set(state, simulation.cycle)
        autopilot.said = state
        autopilot.saidNote = note
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
    //*********************************************************************
    // picking up power ups from a distance
    //*********************************************************************
    isWanted(who) {
        return autopilotBuild.pickupValue(who) > 0
    },
    remotePickupRetry: new WeakMap(),
    pickupAim: null,
    remotePickup: null,
    pickupLookAhead: 800,
    pickupPath() {
        const { cur, goalWalk, next, nodes } = autopilot
        const path = [m.pos]
        const limit = autopilot.pickupLookAhead
        if (goalWalk !== null) {
            const dx = Math.max(-limit, Math.min(limit, goalWalk - m.pos.x))
            if (dx) path.push({ x: m.pos.x + dx, y: m.pos.y })
        } else {
            const eyeHeight = playerBody.bounds.max.y - m.pos.y
            let left = limit, at = cur
            for (let i = 0; i <= autopilot.cellsFor(limit) && left > 0; i++) {
                const edge = next?.[at]
                const node = nodes[edge?.to]
                if (!node || node.dead || node.isBoost || node.elevator || node.transport || edge.type !== autopilot.WALK || edge.isHop) break
                const { x, y } = node
                const from = path[path.length - 1]
                const dx = x - from.x, dy = y - eyeHeight - from.y
                const distance = Math.hypot(dx, dy)
                if (distance) {
                    const fraction = Math.min(1, left / distance)
                    path.push({ x: from.x + fraction * dx, y: from.y + fraction * dy })
                    left -= distance
                }
                at = edge.to
            }
        }
        return path.length > 1 ? path : null
    },
    isNearPickupPath(point, path) {
        const limit = autopilot.pickupLookAhead
        if ((point.x - path[0].x) ** 2 + (point.y - path[0].y) ** 2 > limit ** 2) return false
        for (let i = 1; i < path.length; i++) {
            const a = path[i - 1], b = path[i]
            const dx = b.x - a.x, dy = b.y - a.y
            const px = point.x - a.x, py = point.y - a.y
            const along = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)))
            if ((px - along * dx) ** 2 + (py - along * dy) ** 2 <= 180 ** 2) return true
        }
        return false
    },
    pickupOption(who, field, gun, closeUpgrade = false) {
        if (who.cycle < 10 || who.isGrabbed || who.collisionFilter?.mask === 0 ||
            !autopilot.isWanted(who) || autopilot.isIgnored(who) ||
            simulation.cycle < (autopilot.remotePickupRetry.get(who) || 0)) return null
        const to = who.position
        const distance = Math.hypot(to.x - m.pos.x, to.y - m.pos.y)
        const clear = () => !Matter.Query.rayAny(map, m.pos, to)
        const ready = m.fieldCDcycle < m.cycle
        if (closeUpgrade && ready && field !== "pilot wave" && field !== "grappling hook" &&
            !(tech.isWormHolePause && (field === "wormhole" || field === "portal") && distance >= 70) &&
            distance * distance + 10 < m.grabPowerUpRange2 && clear()) return { kind: "pull", cost: 10 + distance / 9 }
        if (distance < 70 && field !== "grappling hook" && field !== "wormhole" && field !== "pilot wave" &&
            !(field === "portal" && autopilot.isUpgrade(who))) return null //the portal uses this pull even for upgrades at its feet
        if (field === "pilot wave" && ready && (tech.isNoPilotCost || m.energy > 0.2) && distance < 1050) {
            const aim = { x: to.x, y: to.y - 35 }
            const from = m.fieldOn ? m.fieldPosition : m.pos
            const remaining = Math.hypot(to.x - from.x, to.y - from.y)
            const cost = 30 + distance / 9
            if (remaining < m.fieldRadius * 1.2) return { kind: "wave", cost }
            const canReach = !Matter.Query.rayAny(map, from, aim, 40)
            if (canReach) return { kind: "wave", cost }
            //With Bells theorem the wave can still be behind a wall the player already passed.
            if (tech.isNoPilotCost && m.fieldOn && !Matter.Query.rayAny(map, m.pos, aim, 40)) return { kind: "wave", cost, needsWaveReset: true }
        }
        if (field === "grappling hook" && ready && m.energy > 0.09 && distance < 1250 &&
            !bullet.some(hook => hook.isGrapple) && clear() && !Matter.Query.rayAny(body, m.pos, to, 10)) {
            return { kind: "hook", cost: 20 + distance / 13 }
        }
        if (field === "wormhole" && ready && distance < 1300) {
            const hole = m.hole
            if (hole.isOn && [hole.pos1, hole.pos2].some(end =>
                Math.hypot(end.x - to.x, end.y - to.y) < 210 && !Matter.Query.rayAny(map, end, to))) return { kind: "hole", cost: 35 }
            const wantsThis = autopilot.goalType === "powerUp" && autopilot.goalWho === who
            if (!tech.isWormHolePause && distance > 450 && (wantsThis || autopilot.goalType === "exit") &&
                m.energy > m.fieldUpgrades[m.fieldMode].energyCost() + 0.1) {
                const node = autopilot.nodes[autopilot.nodeFor(to, 5)]
                //Open a wormhole beside a pickup only if the landing can continue the current route.
                if (node?.isStatic && !node.dead && !node.isCrouch && !node.isBoost && !node.cover && !node.elevator && !node.transport &&
                    autopilot.dist?.[node.id] < Infinity &&
                    autopilot.dist[node.id] <= autopilot.dist[autopilot.cur] + 30 &&
                    !autopilot.pathIsWet([[node.x - 25, node.y - 145, node.x + 25, node.y]]) &&
                    Math.hypot(node.x - to.x, node.y - 75 - to.y) < 145) {
                    const aim = { x: node.x, y: node.y - 75 }
                    const past = Vector.add(aim, Vector.mult(Vector.normalise(Vector.sub(aim, m.pos)), 25))
                    if ((tech.isWormholeMapIgnore || !Matter.Query.rayAny(map, m.pos, past)) &&
                        !Matter.Query.rayAny(map, { x: aim.x, y: aim.y - 40 }, { x: aim.x, y: aim.y + 40 }, 40)) {
                        return { kind: "warp", aim, cost: 24 }
                    }
                }
            }
        }
        const pulls = field === "perfect diamagnetism" || field === "plasma torch" ||
            (!tech.isWormHolePause && (field === "wormhole" || field === "portal"))
        if (pulls && ready && distance * distance + 10 < m.grabPowerUpRange2 && clear()) {
            return { kind: "pull", cost: 10 + distance / 9 }
        }
        if (field !== "portal" && gun?.name === "harpoon" && gun.mode === "stab" && gun.ammo > 0 && m.energy > 0.1 &&
            distance < (tech.isUHMWPE ? 470 : 300) && clear()) return { kind: "harpoon", cost: 40 }
        if (who.cycle > 30 && distance < 1500 && !b.droneSkipsPowerUp?.(who)) {
            const drone = bullet.find(drone => autopilot.pickupDrone(drone) && !Matter.Query.rayAny(map, drone.position, to))
            if (drone) return { kind: "drone", drone, cost: 25 + Math.hypot(drone.position.x - to.x, drone.position.y - to.y) / 10 }
            const slot = b.inventory?.findIndex(index => b.guns[index]?.name === "drones" && b.guns[index].ammo > 0)
            if (field !== "portal" && slot >= 0 && (gun?.name === "drones" || (!tech.isGunCycle && !tech.isGunChoice)) && clear()) {
                return { kind: "drone", slot, cost: 40 + distance / 10 }
            }
        }
        return null
    },
    pickupDrone(drone) {
        return drone.isDrone && !drone.isImproved && !drone.lockedOn?.alive && drone.endCycle > simulation.cycle + drone.deathCycles + 30
    },
    endRemotePickup() {
        const attempt = autopilot.remotePickup
        if (attempt?.field === "wormhole" && m.fieldMode === 9 && m.hole?.isReady) m.hole.isReady = false
        if (attempt?.field === "portal" && m.fieldMode === 11 && attempt.kind === "pull") {
            m.fieldUpgrades[11].cancelPresses()
        }
        if (attempt?.previousSlot !== undefined && b.inventoryGun === attempt.slot) {
            simulation.switchToGunInInventory(attempt.previousSlot)
        }
        if (attempt && !m.isHolding && attempt.kind === "pull") m.holdingTarget = null
        autopilot.remotePickup = null
    },
    driveRemotePickup() {
        const cycle = simulation.cycle, field = autopilot.fieldName(), gun = b.guns?.[b.activeGun]
        const wantedUpgrade = autopilot.upgradeHunt?.who
        const closeUpgrade = wantedUpgrade && (autopilot.goalWalk !== null || autopilot.isInExit(110)) &&
            Number.isFinite(autopilot.nearbyUpgradeDistance(wantedUpgrade))
        autopilot.pickupAim = null
        let attempt = autopilot.remotePickup
        const directWalk = autopilot.goalWalk !== null
        if (attempt && directWalk && !closeUpgrade && !attempt.onRoute) {
            autopilot.endRemotePickup()
            attempt = null
        }
        const support = autopilot.standingOn()
        const threat = !closeUpgrade && autopilot.target && Math.hypot(autopilot.target.position.x - m.pos.x, autopilot.target.position.y - m.pos.y) < 450
        const busy = autopilot.flying || autopilot.warp || autopilot.grapple || autopilot.wallClimb || autopilot.rayMove ||
            autopilot.blockClear || autopilot.pilotClear || autopilot.carry || autopilot.riding || autopilot.train ||
            m.isHolding || support?.isRay || autopilot.goalType === "trigger" || autopilot.goalType === "carry"
        if (attempt) {
            const gone = !powerUp.includes(attempt.who)
            if (gone || (wantedUpgrade && attempt.who !== wantedUpgrade) || !autopilot.isWanted(attempt.who) || autopilot.detourLeft(attempt.who) <= 0 || cycle >= attempt.until || busy || field !== attempt.field || threat ||
                (attempt.onRoute && (!m.onGround || autopilot.only === "exit")) ||
                (attempt.drone && !autopilot.pickupDrone(attempt.drone)) ||
                ((attempt.kind === "harpoon" || (attempt.kind === "drone" && !attempt.fired && !attempt.drone)) && gun !== attempt.gun)) {
                autopilot.endRemotePickup()
                if (!gone && !busy) autopilot.remotePickupRetry.set(attempt.who, cycle + 240)
                attempt = null
            }
        }
        if (!attempt) {
            const canStart = !busy && m.onGround && !threat && powerUp.length &&
                (closeUpgrade || !(autopilot.goalType === "exit" && autopilot.isInExit()))
            if (!canStart || cycle % 6) return false
            const route = !wantedUpgrade && autopilot.only !== "exit" && !autopilot.pending?.isJump &&
                (directWalk || autopilot.goalType === "exit") ? autopilot.pickupPath() : null
            if (directWalk && !closeUpgrade && !route) return false
            const needsRemote = field === "pilot wave" || field === "grappling hook" || field === "wormhole" || field === "portal"
            let best = Infinity
            for (const who of powerUp) {
                if (wantedUpgrade && who !== wantedUpgrade) continue
                if (autopilot.only === "exit" && !autopilot.isUpgrade(who)) continue
                if (autopilot.detourLeft(who) <= 0) continue
                const onRoute = !!route && autopilot.isNearPickupPath(who.position, route)
                if (directWalk && !closeUpgrade) {
                    if (!onRoute) continue
                    const dx = who.position.x - m.pos.x, dy = who.position.y - m.pos.y
                    if (!needsRemote && dx * dx + dy * dy < m.grabPowerUpRange2) continue //the field can already pull it in while walking
                }
                const option = autopilot.pickupOption(who, field, gun, closeUpgrade)
                if (!option || (directWalk && option.kind === "warp")) continue
                const cost = option.cost * (who === autopilot.goalWho || onRoute ? 0.7 : 1) / autopilotBuild.pickupValue(who)
                if (cost >= best) continue
                best = cost
                const time = directWalk && onRoute && option.kind === "pull" ? 72 : Math.max(105, 55 + option.cost)
                attempt = { ...option, who, field, gun, onRoute: directWalk && onRoute, start: cycle, until: cycle + time }
            }
            if (!attempt) return false
            autopilot.remotePickup = attempt
            if (attempt.slot !== undefined && attempt.slot !== b.inventoryGun) {
                attempt.previousSlot = b.inventoryGun
                simulation.switchToGunInInventory(attempt.slot)
                attempt.gun = b.guns[b.activeGun]
            }
        }
        input.field = input.fire = false
        input.left = input.right = input.up = input.down = false
        autopilot.pending = null
        autopilot.isHolding = true
        autopilot.why = "collecting a distant power up"
        const who = attempt.who, to = who.position
        autopilot.pickupAim = to
        if (attempt.kind === "wave") {
            autopilot.pickupAim = { x: to.x, y: to.y - 35 }
            input.field = !tech.isNoPilotCost
            if (tech.isNoPilotCost && m.fieldOn && !attempt.didWaveReset) {
                const remaining = Math.hypot(to.x - m.fieldPosition.x, to.y - m.fieldPosition.y)
                if (remaining < (attempt.waveDistance ?? Infinity) - 8) {
                    attempt.waveDistance = remaining
                    attempt.waveProgressAt = cycle
                }
                const stalled = cycle >= attempt.waveProgressAt + 36 && remaining >= m.fieldRadius * 1.2
                if (attempt.needsWaveReset || (stalled && !Matter.Query.rayAny(map, m.pos, autopilot.pickupAim, 40))) {
                    input.field = true //one press turns it off, release next cycle reopens it at the player
                    attempt.didWaveReset = true
                    attempt.until = Math.max(attempt.until, cycle + 1 + Math.max(105, 55 + attempt.cost))
                }
            }
        } else if (attempt.kind === "pull") {
            input.field = true
        } else if (attempt.kind === "warp") {
            autopilot.pickupAim = attempt.aim
            input.field = cycle - attempt.start < 5
            if (cycle - attempt.start > 6 && !m.hole.isOn) attempt.until = cycle + 1
        } else if (attempt.kind === "hook") {
            const hook = bullet.find(hook => hook.isGrapple)
            if (!hook && !attempt.fired) {
                const flight = Math.min(18, 2 + Math.hypot(to.x - m.pos.x, to.y - m.pos.y) / 85)
                autopilot.pickupAim = {
                    x: to.x + who.velocity.x * flight - player.velocity.x * 1.5,
                    y: to.y + Math.max(-45, Math.min(35, who.velocity.y * flight + 0.35 * flight ** 2)),
                }
                input.field = m.fieldCDcycle < m.cycle && cycle >= attempt.start + 2
            } else if (hook) {
                input.field = !hook.caughtPowerUp && !hook.attached && hook.do !== hook.returnToPlayer &&
                    Math.hypot(hook.vertices[2].x - m.pos.x, hook.vertices[2].y - m.pos.y) < Math.hypot(to.x - m.pos.x, to.y - m.pos.y) + 160
            }
            if (hook) attempt.fired = true
            else if (attempt.fired) {
                const tries = (attempt.tries || 0) + 1
                if (tries < 2) {
                    attempt.tries = tries
                    attempt.fired = false
                } else attempt.until = cycle + 1
            }
        } else if (attempt.kind === "drone" || attempt.kind === "harpoon") {
            if (attempt.kind === "drone" && !attempt.drone) attempt.drone = bullet.find(drone => autopilot.pickupDrone(drone))
            if (!attempt.drone && !attempt.fired && m.fireCDcycle < m.cycle && (!tech.isFireMoveLock || player.speed < 0.5)) {
                input.fire = true
                attempt.fired = true
            }
        }
        return true
    },
    //*********************************************************************
    // detours, and upgrades and bosses worth staying for
    //*********************************************************************
    isIgnored(who) {
        const until = autopilot.ignored.get(who)
        return until !== undefined && until > simulation.cycle
    },
    isArmed() {
        return m.fieldMode !== 11 && b.guns?.[b.activeGun]?.ammo > 0
    },
    detourSpent: 0,
    detourProgress: null,
    detourLeft(who) { //a shared allowance, with a little extra for a heal or ammo the player needs now
        if (autopilot.isUpgrade(who)) return autopilot.pendingUpgrade(who) ? Infinity : 0
        const urgent = (who?.name === "heal" && m.health < 0.35 * m.maxHealth) ||
            (who?.name === "ammo" && b.inventory.length && b.inventory.every(i => b.guns[i].ammo <= 0))
        return (urgent ? 540 : 360) - autopilot.detourSpent
    },
    detourExitRoute(exit, from) {
        const cur = autopilot.cur
        if (!Number.isFinite(from[exit])) return null
        const onward = new Float64Array(autopilot.nodes.length).fill(Infinity)
        const wrapped = new Uint8Array(onward.length)
        autopilot.searchRoutes(exit, onward, null, wrapped, true, true)
        if (!Number.isFinite(onward[cur])) return null
        const { x, y } = autopilot.nodes[cur]
        const previous = autopilot.detourProgress
        if (!previous || previous.exit !== exit || Math.hypot(x - previous.x, y - previous.y) >= 200 && onward[cur] <= previous.cost - 150) {
            if (previous?.exit === exit) autopilot.detourSpent = 0
            autopilot.detourProgress = { exit, x, y, cost: onward[cur] }
        }
        return { onward, wrapped }
    },
    upgradeHunt: null,
    upgradeSearchLimit: 3600, //one minute of looking for alternatives per drop
    skippedUpgrades: new WeakMap(), //an abandoned drop gets one more try if it comes within field reach at the exit
    isUpgrade(who) {
        return who?.name === "tech" || who?.name === "gun"
    },
    nearbyUpgradeDistance(who) {
        if (!m.pos || who.isGrabbed || who.collisionFilter?.mask === 0) return Infinity
        const distance = Math.hypot(who.position.x - m.pos.x, who.position.y - m.pos.y)
        if (distance > 155 || (map.length && Matter.Query.rayAny(map, m.pos, who.position))) return Infinity
        return distance
    },
    pendingUpgrade(who) {
        if (!autopilot.isUpgrade(who)) return false
        const skipped = autopilot.skippedUpgrades.get(who)
        return !skipped?.abandoned || (!skipped.retriedAtExit && autopilot.isInExit(110) && Number.isFinite(autopilot.nearbyUpgradeDistance(who)))
    },
    holdExitForUpgrades() {
        return autopilot.canPlayInCurrentMode() && powerUp.some(autopilot.pendingUpgrade)
    },
    holdExitForObjectives() {
        return autopilot.holdExitForUpgrades() || (autopilot.canPlayInCurrentMode() && autopilot.canHuntBosses() && mob.some(autopilot.pendingBoss))
    },
    upgradeApproach(who, reachable, failed) {
        let best = null
        const { x, y } = who.position
        const scale = player.scale || 1
        for (const node of autopilot.nodes) {
            if (node.dead || !Number.isFinite(reachable[node.id])) continue
            const aimY = node.y - (node.isCrouch ? 45 : 75) * scale
            const distance = Math.hypot(node.x - x, aimY - y)
            if (distance > 150 || failed?.some(spot => Math.abs(node.x - spot.x) <= 75 && Math.abs(node.y - spot.y) <= 40)) continue
            const cost = reachable[node.id] + distance * 0.5
            if ((!best || cost < best.cost) && (!map.length || !Matter.Query.rayAny(map, { x: node.x, y: aimY }, who.position))) best = { node, cost }
        }
        return best
    },
    startUpgradeHunt(who) {
        const skipped = autopilot.skippedUpgrades.get(who)
        if (skipped?.abandoned) {
            skipped.abandoned = false
            skipped.retriedAtExit = true
        }
        return autopilot.upgradeHunt = { who, best: Infinity, progressAt: simulation.cycle, searchCycles: 0, lastSearchCycle: null, failed: [], explored: new Map(), approach: null, direct: null }
    },
    chooseDirectUpgrade() {
        if (autopilot.manualControl || !m.onGround || !m.pos) return null
        const { x, y } = m.pos, feet = playerBody.bounds.max.y
        const hunt = autopilot.upgradeHunt
        const cycle = simulation.cycle
        let best = null
        for (const who of powerUp) {
            if (!autopilot.pendingUpgrade(who) || who.isGrabbed || who.collisionFilter?.mask === 0) continue
            const distance = Math.hypot(who.position.x - x, who.position.y - y)
            const progress = hunt?.who === who && hunt.direct
            if (progress && cycle >= progress.at + 600 && distance >= progress.best - 15) continue
            if (best && distance >= best.distance) continue
            const close = Number.isFinite(autopilot.nearbyUpgradeDistance(who))
            if (!close && (Math.abs(who.position.y - y) > 105 || !autopilot.straightWalk(who.position.x, feet))) continue
            best = { who, distance, walk: close ? player.position.x : who.position.x }
        }
        if (!best) return null
        const current = hunt?.who === best.who ? hunt : autopilot.startUpgradeHunt(best.who)
        if (best.distance < (current.direct?.best ?? Infinity) - 15) current.direct = { best: best.distance, at: cycle }
        current.lastSearchCycle = null
        current.best = Infinity
        return best
    },
    chooseUpgrade(exitOpen = true, coolingButton = null) {
        const drops = powerUp.filter(autopilot.pendingUpgrade)
        if (!drops.length || autopilot.manualControl) {
            autopilot.upgradeHunt = null
            return null
        }
        const cur = autopilot.cur
        const cycle = simulation.cycle
        const reachable = cur >= 0 ? autopilot.routesFrom(cur, true).from : []
        let hunt = autopilot.upgradeHunt
        const nearExit = autopilot.isInExit(110)
        for (let i = 0; i < drops.length; i++) {
            let nearby = null, nearest = Infinity
            if (nearExit) {
                for (const drop of drops) {
                    if (!autopilot.pendingUpgrade(drop)) continue
                    const distance = autopilot.nearbyUpgradeDistance(drop)
                    if (distance >= nearest) continue
                    nearby = drop
                    nearest = distance
                }
            }
            if (nearby && hunt && !Number.isFinite(autopilot.nearbyUpgradeDistance(hunt.who))) hunt = null
            if (!hunt || !drops.includes(hunt.who)) {
                let who = nearby, best = Infinity, hasRoute = false
                if (!nearby) {
                    for (const drop of drops) {
                        if (!autopilot.pendingUpgrade(drop)) continue
                        const route = autopilot.upgradeApproach(drop, reachable)
                        if (hasRoute && !route) continue
                        const cost = route?.cost ?? Math.hypot(player.position.x - drop.position.x, player.position.y - drop.position.y)
                        if (cost < best || (route && !hasRoute)) {
                            who = drop
                            best = cost
                            hasRoute = !!route
                        }
                    }
                }
                if (!who) break
                hunt = autopilot.startUpgradeHunt(who)
            }
            const who = hunt.who
            const route = autopilot.upgradeApproach(who, reachable, hunt.failed)
            if (route) {
                if (route.cost < hunt.best - 25) {
                    hunt.best = route.cost
                    hunt.progressAt = cycle
                }
                if (cycle < hunt.progressAt + 600) { //ten seconds without progress before trying another spot
                    hunt.lastSearchCycle = null
                    return { goal: route.node.id, type: "powerUp", who }
                }
                hunt.failed.push({ x: route.node.x, y: route.node.y })
            }
            hunt.best = Infinity
            if (hunt.lastSearchCycle !== null) {
                const elapsed = cycle - hunt.lastSearchCycle
                if (elapsed <= autopilot.goalEvery) hunt.searchCycles += elapsed //a gap means another task interrupted the search
            }
            hunt.lastSearchCycle = cycle
            if (hunt.searchCycles >= autopilot.upgradeSearchLimit) {
                const retriedAtExit = !!autopilot.skippedUpgrades.get(who)?.retriedAtExit
                autopilot.skippedUpgrades.set(who, { abandoned: true, retriedAtExit })
                autopilot.say("leaving a power up", "couldn't reach the upgrade")
                hunt = null
                continue
            }
            if (!exitOpen) {
                const pickupNode = cur >= 0 && autopilot.grid ? autopilot.nodeFor(who.position) : -1
                const behindDoor = pickupNode >= 0 && !Number.isFinite(reachable[pickupNode]) && autopilot.isBehindDoor(pickupNode)
                const trigger = coolingButton || (behindDoor && autopilot.chooseTrigger(pickupNode, true))
                if (trigger) return { goal: autopilot.triggerNode(trigger), type: "trigger", who: trigger }
            }
            return autopilot.exploreForHunt(hunt, reachable)
        }
        autopilot.upgradeHunt = null
        return null
    },
    exploreForHunt(hunt, reachable) {
        const { cur, nodes } = autopilot
        const cycle = simulation.cycle
        const approach = hunt.approach
        if (approach) {
            const destination = nodes[approach.id], here = nodes[cur]
            if (Number.isFinite(reachable[approach.id]) && here && Math.hypot(here.x - destination.x, here.y - destination.y) >= 50 &&
                cycle < approach.until) return { goal: approach.id, type: "explore", who: null }
            hunt.explored.set(approach.area, approach.connections)
        }
        hunt.approach = cur >= 0 ? autopilot.exploreToward(hunt.who.position, reachable, hunt.explored, 0.65) : null
        if (hunt.approach) hunt.approach.until = cycle + 180
        return { goal: hunt.approach?.id ?? cur, type: "explore", who: null }
    },
    bossHunt: null,
    skippedBosses: new WeakSet(),
    bossStallLimit: 3600, //cycles without getting closer to a firing position or damaging the boss
    isLiveBoss(who) {
        return !!(who?.alive && who.isBoss && !who.shield && !who.isMobBullet)
    },
    pendingBoss(who) {
        return autopilot.isLiveBoss(who) && !autopilot.skippedBosses.has(who)
    },
    canHuntBosses() {
        return tech.isEnergyHealth ? m.energy > 0.25 * m.maxEnergy : m.health > 0.25 * m.maxHealth
    },
    bossApproach(who, reachable, profile, failed = []) {
        const reach = profile ? Math.min(700, 0.8 * profile.reach) : 400
        const near = profile?.near || 0
        const scale = player.scale || 1
        let best = null
        for (const node of autopilot.nodes) {
            if (node.dead || node.isBoost || !Number.isFinite(reachable[node.id]) || (best && reachable[node.id] >= best.cost)) continue
            const aim = { x: node.x, y: node.y - (node.isCrouch ? 45 : 75) * scale }
            const distance = Math.hypot(aim.x - who.position.x, aim.y - who.position.y)
            if (distance < near || distance > reach || failed.some(spot => Math.abs(node.x - spot.x) <= 150 && Math.abs(node.y - spot.y) <= 100)) continue
            const cost = reachable[node.id] + 0.1 * distance
            if ((!best || cost < best.cost) && (profile?.isThroughWalls || !map.length || !Matter.Query.rayAny(map, aim, who.position))) best = { node, cost }
        }
        return best
    },
    bossAmmo(reachable) {
        if (!autopilot.grid || m.fieldMode === 11 || !b.inventory.length || b.inventory.some(i => b.guns[i].ammo > 0)) return null
        let closest = 160, goal = null
        for (const who of powerUp) {
            if (who.name !== "ammo" || autopilot.isIgnored(who) || !autopilot.isWanted(who)) continue
            const node = autopilot.nodeFor(who.position)
            if (!(reachable[node] < closest)) continue
            closest = reachable[node]
            goal = { goal: node, type: "powerUp", who }
        }
        return goal
    },
    chooseBoss(exitOpen = true, coolingButton = null) {
        const bosses = mob.filter(autopilot.pendingBoss)
        if (!bosses.length || !autopilot.canHuntBosses() || autopilot.manualControl) {
            autopilot.bossHunt = null
            return null
        }
        const cycle = simulation.cycle, cur = autopilot.cur
        const reachable = cur >= 0 ? autopilot.routesFrom(cur, true).from : []
        const profile = autopilot.isArmed() ? autopilot.gunProfile() : null
        let hunt = autopilot.bossHunt
        for (let i = 0; i < bosses.length; i++) {
            let route = null
            if (!hunt || !bosses.includes(hunt.who)) {
                let who = null, best = Infinity
                for (const boss of bosses) {
                    if (!autopilot.pendingBoss(boss)) continue
                    const approach = autopilot.bossApproach(boss, reachable, profile)
                    if (route && !approach) continue
                    const cost = approach?.cost ?? Math.hypot(player.position.x - boss.position.x, player.position.y - boss.position.y)
                    if (cost < best || (approach && !route)) {
                        who = boss
                        route = approach
                        best = cost
                    }
                }
                if (!who) break
                autopilot.bossHunt = hunt = { who, health: who.health, best: Infinity, checkedAt: cycle, stalled: 0, trial: 0,
                    failed: [], explored: new Map(), approach: null }
            } else route = autopilot.bossApproach(hunt.who, reachable, profile, hunt.failed)
            const { who } = hunt
            const elapsed = cycle - hunt.checkedAt
            hunt.checkedAt = cycle
            const damaged = who.health < hunt.health - 0.005
            const closer = route && route.cost < hunt.best - 40
            if (damaged || closer) {
                if (damaged) hunt.health = who.health
                if (closer) hunt.best = route.cost
                hunt.stalled = hunt.trial = 0
            } else if (elapsed <= autopilot.goalEvery) {
                hunt.stalled += elapsed
                hunt.trial = route ? hunt.trial + elapsed : 0
            }
            if (hunt.stalled >= autopilot.bossStallLimit) {
                autopilot.skippedBosses.add(who)
                autopilot.say("leaving a boss", "couldn't make progress")
                hunt = null
                continue
            }
            const ammo = autopilot.bossAmmo(reachable)
            if (ammo) return ammo
            if (route && hunt.trial >= 720) {
                hunt.failed.push(route.node)
                hunt.trial = 0
                route = autopilot.bossApproach(who, reachable, profile, hunt.failed)
            }
            if (route) return { goal: route.node.id, type: "mob", who }
            if (!exitOpen) {
                const trigger = coolingButton || autopilot.chooseTrigger(-1, true)
                if (trigger) return { goal: autopilot.triggerNode(trigger), type: "trigger", who: trigger }
            }
            return autopilot.exploreForHunt(hunt, reachable)
        }
        autopilot.bossHunt = null
        return null
    },
    activeHunt() { //the upgrade or boss being searched for, an upgrade comes first
        return autopilot.upgradeHunt ?? autopilot.bossHunt
    },
    isHuntTarget(who) { //upgrades and bosses have their own search limits and loop handling
        return !!who && (who === autopilot.upgradeHunt?.who || who === autopilot.bossHunt?.who)
    },
    //*********************************************************************
    // choosing a goal
    //*********************************************************************
    chooseGoal() {
        if (autopilot.bossHunt && (!autopilot.pendingBoss(autopilot.bossHunt.who) || !autopilot.canHuntBosses())) autopilot.bossHunt = null
        const direct = autopilot.chooseDirectUpgrade()
        if (direct) {
            autopilot.releaseCarry(false)
            return autopilot.setGoal(autopilot.cur, "powerUp", direct.who, direct.walk)
        }
        const exit = autopilot.exitNode()
        const exitWalk = autopilot.walkToExit()
        const exitOpen = exitWalk !== null || !autopilot.isExitBlocked(exit, false)
        if (autopilot.carry) {
            const { step, trigger } = autopilot.carry
            //A button that pops back up only holds the door while something is on it. Up, or held by the player, the door
            //is closing or will close once they step off, even if it still looks open, so only a clear walk to the exit ends the carry.
            const needsBlock = trigger?.popsUp && exitWalk === null && (trigger.obj.isUp || autopilot.isHoldingButton(trigger))
            const keepCarry = step ? exitWalk === null || !!autopilot.upgradeHunt : !exitOpen || needsBlock
            if (keepCarry) {
                if (autopilot.updateCarry()) return
            } else autopilot.releaseCarry()
        }
        let goal = exit, type = "exit", who = null
        const hasCoolingButtons = autopilot.triggers.some(trigger => trigger.obj.autopilotHeat)
        const coolingButton = !exitOpen && hasCoolingButtons ? autopilot.chooseHeatButton() : null
        const upgradeGoal = autopilot.chooseUpgrade(exitOpen, coolingButton)
        const priorityGoal = upgradeGoal || autopilot.chooseBoss(exitOpen, coolingButton)
        if (priorityGoal) ({ goal, type, who } = priorityGoal)
        if (type === "exit" && !hasCoolingButtons && !autopilot.remotePickup?.onRoute && autopilot.only !== "exit" && autopilot.cur >= 0 && !autopilot.isInExit() &&
            (powerUp.length || mob.length && autopilot.isArmed())) {
            const { from, wrapped } = autopilot.routesFrom(autopilot.cur)
            const exitRoute = autopilot.detourExitRoute(exit, from)
            const extraCost = node => {
                if (!exitRoute) return 0 //the exit is blocked or the route is still unknown, so use local travel and the time allowance
                const { onward, wrapped } = exitRoute
                if (wrapped[node] && !wrapped[autopilot.cur]) return Infinity
                return Math.max(0, from[node] + onward[node] - onward[autopilot.cur])
            }
            const wrapDetour = node => exitOpen && wrapped[node]
            let best = Infinity
            const keep = who => who === autopilot.goalWho ? 0.8 : 1 //the current goal has to be beaten clearly, so it doesn't switch back and forth
            for (const pickup of powerUp) {
                if (autopilot.isUpgrade(pickup)) continue
                const value = autopilotBuild.pickupValue(pickup)
                if (!value || autopilot.isIgnored(pickup)) continue
                const node = autopilot.nodeFor(pickup.position)
                if (node < 0 || wrapDetour(node)) continue
                const extra = extraCost(node)
                if (!(extra < autopilot.detourLeft(pickup))) continue
                const cost = (extra + from[node] + 15) * keep(pickup) / value
                if (cost < best && !autopilot.isBehindDoor(node)) {
                    best = cost
                    goal = node
                    type = "powerUp"
                    who = pickup
                }
            }
            if (type === "exit" && autopilot.isArmed() && (autopilot.canHuntBosses() || !mob.some(autopilot.isLiveBoss))) { //nothing to pick up, look for something to shoot
                for (let i = 0; i < mob.length; i++) {
                    if (!mob[i].alive || mob[i].isBoss || mob[i].isBadTarget || mob[i].isInvulnerable || !mob[i].isDropPowerUp || autopilot.isIgnored(mob[i])) continue
                    const node = autopilot.nodeFor(mob[i].position, 16)
                    if (node < 0 || wrapDetour(node)) continue
                    const extra = extraCost(node)
                    if (!(extra < autopilot.detourLeft())) continue
                    const cost = (extra + from[node]) * keep(mob[i])
                    if (cost < best && !autopilot.isBehindDoor(node)) {
                        best = cost
                        goal = node
                        type = "mob"
                        who = mob[i]
                    }
                }
            }
        }
        if (type === "exit" && !exitOpen) {
            const trigger = coolingButton || (!hasCoolingButtons && autopilot.chooseTrigger(exit, true))
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
        if (type === "exit" && !exitOpen && autopilot.isExplore) {
            const spot = autopilot.chooseExplore(exit)
            if (spot >= 0) {
                type = "explore"
                goal = spot
            }
        }
        autopilot.setGoal(goal, type, who, type === "exit" ? exitWalk : null, coolingButton)
    },
    setGoal(goal, type, who, walk, coolingButton = null) {
        const changedTarget = who !== autopilot.goalWho || type !== autopilot.goalType
        const changedWalk = (walk === null) !== (autopilot.goalWalk === null)
        autopilot.goalWalk = walk
        if (changedTarget || changedWalk) {
            autopilot.resetRecovery()
            autopilot.commit = autopilot.backUp = null
        }
        if (goal !== autopilot.goal || changedTarget || changedWalk) {
            if (changedTarget || type === "explore") autopilot.goalSince = simulation.cycle
            if (changedTarget) {
                const previous = autopilot.goalType === "trigger" && autopilot.goalWho
                if (previous && previous.arrivedAt) {
                    autopilot.tried.set(previous, simulation.cycle)
                    previous.arrivedAt = 0
                }
                if (type === "powerUp") autopilot.say("fetching", who.name)
                else if (type === "mob") autopilot.say("hunting", who.isBoss ? "a boss" : "a mob that drops power ups")
                else if (type === "explore") autopilot.say("exploring", autopilot.upgradeHunt ? "looking for a route to an upgrade" :
                    autopilot.bossHunt ? "looking for a route to a boss" : "the exit is blocked and no button is left to try")
                else if (type === "trigger") autopilot.say(who.kind === "button" ? "pressing a button" : "flipping a toggle", who === coolingButton ? "turning off the heat" : "the way to the exit is blocked")
                else if (goal < 0 && walk === null) autopilot.say("lost", "can't find the exit")
                else autopilot.say("exiting", autopilot.only === "exit" ? "" : "nothing else to get")
            }
            autopilot.goal = goal
            autopilot.goalType = type
            autopilot.goalWho = who
            autopilot.isPlanDirty = true
        }
    },
})
