"use strict";
//autopilot, edges: walking, jumping, falling, boosts, portals, and the arcs they're planned with, see the top of js/autopilot.js
Object.assign(autopilot, {
    //*********************************************************************
    // edges
    //*********************************************************************
    addEdge(from, to, type, dir, cost, steer = 0, most = 0, isRun = false, coyote = 0, hit = null, extra = null) { //steer and most are the air control the arc used: push that way while slower than most
        //coyote is how many cycles after running off a ledge the jump is pressed, 0 jumps from the ground
        if (from === to) return
        const edges = autopilot.nodes[from].edges
        const edge = { from, to, type, dir, cost, steer, most, isRun, coyote, fail: 0, hazardPath: hit ? hit.hazardPath : null, travelFrames: hit ? hit.cycles : 0, landingVy: hit ? hit.vy : 0, arcArgs: hit?.args || null, ceilingHit: hit?.ceilingHit } //arcArgs replays the arc for the path drawn
        if (hit?.wraps) edge.wraps = hit.wraps
        if (extra) Object.assign(edge, extra) //takeoffX, where on the ground the jump leaves from when it isn't the middle of the node
        if (autopilot.failed.size) edge.fail = autopilot.failed.get(autopilot.edgeKey(edge)) || 0
        const totalCost = e => autopilot.edgeCost(e) + autopilot.retryCost(e)
        for (let i = 0; i < edges.length; i++) {
            const other = edges[i]
            if (other.to !== to || other.type !== type || other.wraps !== edge.wraps) continue
            if (type === autopilot.FALL && (other.steer !== steer || other.turnY !== edge.turnY)) continue
            if (type === autopilot.JUMP && (other.isRun !== isRun || (other.runFrom === undefined) !== (edge.runFrom === undefined) || !!other.coyote !== !!coyote || !!other.hold !== !!edge.hold || !!other.delay !== !!edge.delay || other.turnY !== edge.turnY || other.blockJumps !== edge.blockJumps || other.airJumps !== edge.airJumps)) continue
            if (totalCost(other) > totalCost(edge)) edges[i] = edge
            return
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
        const V = node.beltWas = autopilot.beltV(node) //a belt under this spot carries the player this fast, see beltGait()
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
            const transfer = { leaveBoost: boost }
            for (const dir of [-1, 0, 1]) {
                for (const most of dir ? [p.limit, p.limit * 0.5, p.limit * 0.2] : [0]) {
                    const hit = autopilot.arc(node.x, node.y - 2, vx, vy, dir, most, false, size, 0, false, Infinity, 0, undefined, transfer)
                    if (hit) add(hit.node, autopilot.BOOST, dir || Math.sign(nodes[hit.node].x - node.x) || 1, hit.cycles + 10, dir, most, false, 0, hit)
                }
            }
        } else {
            const standY = autopilot.standY(node) //jumps and falls leave from here, the spot itself can float a little above it
            if (autopilot.portals.length) autopilot.linkPortals(node, size, add)
            if (autopilot.p.nitinol) autopilot.linkWallClimbs(node, standY, size, add)
            if (node.elevator) { //ride it to the other end
                const other = node.elevator.autopilotElevator.nodes[1 - node.elevatorLevel].find(n => n.cx === node.cx && !n.dead)
                if (other) add(other.id, autopilot.RIDE, 0, 150 + Math.abs(other.y - node.y) / 4)
            }
            if (node.transport) { //ride it to its other stop, the same spot on the deck
                const t = node.transport.autopilotTransport
                const other = autopilot.transportNode(node.transport, 1 - node.transportStop, node.x - t.stops[node.transportStop])
                if (other >= 0) add(other, autopilot.RIDE, 0, t.isSwing ? 30 + t.period / 2 : 60 + Math.abs(t.stops[1] - t.stops[0]) / Math.abs(node.transport.VxGoal))
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
                const gait = autopilot.beltGait(V, dir, node.x, standY, size) //how fast it goes this way on a belt, and whether by hopping
                const runVx = gait.isHop ? autopilot.hopTakeoff(V) : gait.speed //how fast it leaves the ground going this way, between hops against a belt it's slower than the hops average
                const beltRun = V ? { beltVx: dir * runVx } : null //marks a jump that takes off from a belt, with the speed it was planned at
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
                        if (gait.speed) {
                            const step = !V && autopilot.isLowStep(node, nodes[beside], dir)
                            add(beside, autopilot.WALK, dir, (node.isCrouch || nodes[beside].isCrouch ? 3 : 1) * cell / gait.speed + (gait.isHop ? 1 : 0), 0, 0, false, 0, null, gait.isHop ? { isHop: true } : step ? { isLowStep: true } : null)
                        }
                    } else if (!gait.speed) { //a belt carrying it away from this ledge faster than it can go
                    } else {
                        //a ledge, walk off it fast, slow, or turning back under it, the foot leaves the ground a little past the corner
                        const edgeLip = lipAhead || (lip && lip.isBehind && (node.x - lip.x) * dir < cell ? lip : null) //a spot just past the corner leaves the ground at the corner
                        const bevel = !V && !node.isCrouch && (lipAhead || lip?.isBehind) ? autopilot.dropLip(node, lip, dir) : null
                        if (bevel) autopilot.linkBeveledFall(node, standY, bevel, dir, gait.speed, size, add)
                        //Above the floor's cell row, which can stick up past the real floor.
                        if (!autopilot.isBoxSolid(node.x + dir * cell - size.halfWidth + 3, node.y - size.height + 3, node.x + dir * cell + size.halfWidth - 3, Math.min(node.y - 14, autopilot.grid.y0 + (node.cy + 1) * cell - 1))) {
                            const x = edgeLip ? edgeLip.x + dir * 16 : node.x + dir * (cell / 2 + 14)
                            const y = edgeLip ? edgeLip.y : standY
                            if (!bevel) {
                                const slow = V * dir > 0 ? Math.max(3, Math.abs(V)) : 3 //a belt carries it off the end at least that fast
                                for (const [vx, steer, most] of [[runVx, dir, p.limit], [slow, 0, 0], [slow, -dir, p.limit], [slow, -dir, p.limit * 0.4]]) {
                                    const hit = autopilot.arc(x, y, dir * vx, 0, steer, most, false, size)
                                    if (hit) add(hit.node, autopilot.FALL, dir, hit.cycles + 8, steer, most, false, 0, hit)
                                }
                                if (edgeLip && !node.isCrouch && !V) autopilot.linkUnderLedgeFall(x, y, dir, edgeLip.x, size, add)
                            }
                            if (isRoom && !node.isCrouch && !gait.isHop) { //run off and jump a few cycles later, in coyote time
                                const coyote = Math.min(m.coyoteCycles, 8) - 3 //a few cycles to spare, longer coyote time is flying, see findFlight()
                                const offVx = V || !autopilot.isMeasuredRun ? runVx : autopilot.runSpeed(autopilot.runRoom(x - dir * 16, y, dir, size, autopilot.runReach, 8) + 16) //as fast as the floor behind the edge lets it get
                                let cx = x, cy = y, fall = 0
                                for (let i = 0; i < coyote; i++) {
                                    fall += p.gravity
                                    cx += dir * offVx
                                    cy += fall
                                }
                                if (!autopilot.isBoxSolid(cx - size.halfWidth + 1, cy - size.height + 2, cx + size.halfWidth - 1, cy - 2)) {
                                    const hit = autopilot.arc(cx, cy, dir * offVx, -p.jump, dir, p.limit, true, size)
                                    if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + coyote + 35 + late, dir, p.limit, true, coyote, hit, edgeLip ? { takeoffX: edgeLip.x, ...beltRun } : beltRun) //15 of it is the run-up
                                }
                            }
                        }
                    }
                } finally {
                    autopilot.grid.hard = hard
                }
                if (node.isCrouch) continue
                //jumps from standing, pushing with different limits on speed, on a belt it's carried through this spot with no key held
                for (const most of [p.limit, p.limit * 0.6, p.limit * 0.3, p.limit * 0.12]) {
                    const hit = autopilot.arc(node.x, standY, V, -p.jump, dir, most, true, size)
                    if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + late, dir, most, false, 0, hit, V ? { beltVx: V } : null)
                }
                if (V) { //on a belt it never stands still, so only the jumps it can take on the move: carried along, and going with the belt or hopping against it
                    if (gait.isHop || (isRoom && gait.speed)) {
                        const hit = autopilot.arc(node.x, standY, dir * runVx, -p.jump, dir, p.limit, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 20 + late, dir, p.limit, true, 0, hit, beltRun)
                    }
                    continue
                }
                //with the map overhead, short hops under a ledge that hangs over where it lands, and jumps that go straight up first, past a ledge overhead, then over onto it
                if (autopilot.jumpHasCeiling(node.x, standY, dir)) {
                    for (const hold of [8, 11, 14, 17, 20]) {
                        const hit = autopilot.arc(node.x, standY, 0, -p.jump, dir, p.limit, true, size, 0, true, hold) //precise moves, they have to land with the flat of the foot
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + late, dir, p.limit, false, 0, hit, { hold })
                    }
                }
                autopilot.linkVerticalJumps(node, standY, dir, size, add)
                if (autopilot.isMeasuredRun) { //a running jump as fast as the floor behind the takeoff lets it get, the run-up starts that far back
                    const sx = lipAhead ? lipAhead.x - dir * 3 : node.x, sy = lipAhead ? lipAhead.y : standY
                    const back = autopilot.runRoom(sx, sy, dir, size, autopilot.runReach, 8)
                    if (back >= 20) {
                        const runVx = autopilot.runSpeed(back)
                        const hit = autopilot.arc(sx, sy, dir * runVx, -p.jump, dir, p.limit, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 20 + back / 4 + late, dir, p.limit, true, 0, hit, { takeoffX: sx, runFrom: sx - dir * back, runVx })
                    }
                } else if (isRoom) {
                    const hit = autopilot.arc(node.x, standY, dir * p.run, -p.jump, dir, p.limit, true, size)
                    if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 35 + late, dir, p.limit, true, 0, hit) //15 of it is the run-up
                }
                if (lipAhead) { //the same jumps from the top of the corner, 3 before it, at its real height
                    const sx = lipAhead.x - dir * 3, walk = Math.abs(sx - node.x) / p.run
                    for (const most of [p.limit, p.limit * 0.6, p.limit * 0.3]) {
                        const hit = autopilot.arc(sx, lipAhead.y, 0, -p.jump, dir, most, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + walk, dir, most, false, 0, hit, { takeoffX: sx })
                    }
                    if (isRoom && !autopilot.isMeasuredRun) {
                        const hit = autopilot.arc(sx, lipAhead.y, dir * p.run, -p.jump, dir, p.limit, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 35 + walk, dir, p.limit, true, 0, hit, { takeoffX: sx })
                    }
                }
                if (!isRoom && autopilot.isShortRun && !autopilot.isMeasuredRun) { //a ledge too short for a full run-up, like one against a wall: back up to its far end, run what there is, jump at the takeoff
                    const sx = lipAhead ? lipAhead.x - dir * 3 : node.x, sy = lipAhead ? lipAhead.y : standY
                    const back = autopilot.runRoom(sx, sy, dir, size)
                    if (back >= 20) {
                        const hit = autopilot.arc(sx, sy, dir * autopilot.runSpeed(back), -p.jump, dir, p.limit, true, size)
                        if (hit) add(hit.node, autopilot.JUMP, dir, hit.cycles + 25 + back / 2, dir, p.limit, false, 0, hit, { takeoffX: sx, runFrom: sx - dir * back })
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
        if (tech.isCoyote && p.coyote > 40 && !node.isBoost && !node.isCrouch && !node.elevator && !node.transport && !autopilot.beltV(node)) {
            const y = autopilot.standY(node)
            for (const [steer, most] of [[-1, p.limit], [1, p.limit], [-1, p.limit * 0.45], [1, p.limit * 0.45]]) {
                const groundPush = 1.5 * steer * m.Fx / player.mass * simulation.delta ** 2
                for (const airJumps of [1, 2, 4]) {
                    if (21 * airJumps >= p.coyote - 4) break
                    const hit = autopilot.arc(node.x, y, 0, -p.jump, steer, most, true, size, 0, true, 21, 0, undefined, { airJumps, groundPush })
                    if (!hit || hit.ceilingHit || hit.isPortal || nodes[hit.node].elevator || nodes[hit.node].transport) continue
                    add(hit.node, autopilot.JUMP, steer, hit.cycles + 20, steer, most, false, 0, hit, { airJumps, hold: 21 })
                }
            }
        }
        if (autopilot.rev.length) autopilot.attachEdges(node)
    },
    linkBeveledFall(node, standY, bevel, dir, speed, size, add) {
        const clearX = bevel.x + dir * (size.halfWidth + 2)
        //Check the walk out along the slope before assuming the player is already beside the wall.
        const distance = (clearX - node.x) * dir
        if (distance <= 0) return
        const steps = Math.ceil(distance / 5)
        const hazardPath = autopilot.hazards.length || autopilot.lasers.length ? [] : null
        for (let i = 0; i <= steps; i++) {
            const x = node.x + dir * distance * i / steps
            //The back of the foot still holds the player up while its center passes the curve.
            const center = autopilot.surfaceAt(x, standY, 8, 125)?.y ?? bevel.y
            const heel = autopilot.surfaceAt(x - dir * size.foot, standY, 25, 125)?.y ?? bevel.y
            const y = Math.min(center, heel)
            if (autopilot.isBoxSolidExact(x - size.halfWidth + 3, y - size.height + 2, x + size.halfWidth - 3, y - 26)) return
            if (hazardPath) hazardPath.push([x - size.halfWidth, y - size.height, x + size.halfWidth, y])
        }
        const { p } = autopilot
        const approach = distance / speed
        for (const [steer, most] of [[dir, p.limit], [0, 0], [-dir, 0]]) {
            const hit = autopilot.arc(clearX, bevel.y, dir * speed, 0, steer, most, false, size, 0, true)
            if (!hit || hit.y <= bevel.y + 20) continue
            if (hazardPath) hit.hazardPath = hazardPath.concat(hit.hazardPath)
            add(hit.node, autopilot.FALL, dir, hit.cycles + approach + 8, steer, most, false, 0, hit, { clearX, dropY: bevel.y })
        }
        autopilot.linkUnderLedgeFall(clearX, bevel.y, dir, bevel.x, size, add, { speed, approach, hazardPath })
    },
    linkUnderLedgeFall(x, y, dir, lipX, size, add, bevel = null) {
        //Find the underside of the lip. Brake outward momentum, then turn underneath.
        const probe = lipX - dir * Math.min(8, size.foot)
        let underside = y + 4
        while (underside < y + 160 && autopilot.isBoxSolidExact(probe, underside, probe, underside)) underside += 8
        if (underside >= y + 160) return
        const turnY = underside + size.height + 4
        const { p } = autopilot
        for (const most of [p.limit, p.limit * 0.4]) {
            const hit = autopilot.arc(x, y, dir * (bevel?.speed ?? p.run), 0, -dir, most, false, size, 0, true, undefined, 0, turnY)
            if (!hit || hit.y <= turnY || (hit.x - lipX) * dir >= 0) continue
            if (bevel?.hazardPath) hit.hazardPath = bevel.hazardPath.concat(hit.hazardPath)
            const clearance = bevel ? { clearX: x, dropY: y, turnY } : { turnY }
            add(hit.node, autopilot.FALL, dir, hit.cycles + (bevel?.approach ?? 0) + 8, -dir, most, false, 0, hit, clearance)
        }
    },
    linkVerticalJumps(node, feet, dir, size, add) { //rise beside a ledge, then steer over it once the feet clear its top
        const { w, nodeAt } = autopilot.grid
        const { p, nodes } = autopilot
        const rise = p.jump ** 2 / (2 * p.gravity)
        const near = node.x + dir * (size.halfWidth - 6), far = node.x + dir * 115
        if (rise <= 35 || !autopilot.isBoxSolid(Math.min(near, far), feet - rise, Math.max(near, far), feet - 35)) return
        const heights = new Map()
        for (let col = 1; col <= autopilot.cellsFor(115); col++) {
            const cx = node.cx + col * dir
            if (cx < 1 || cx >= w - 1) break
            for (let cy = Math.max(0, node.cy - autopilot.cellsFor(rise)); cy < node.cy; cy++) {
                const target = nodes[nodeAt[cx + cy * w]]
                if (!target || target.isCrouch || target.elevator || feet - target.y < 35 || feet - target.y > rise) continue
                heights.set(cy, Math.min(heights.get(cy) ?? Infinity, target.y))
            }
        }
        for (const y of heights.values()) {
            const holds = feet - y < 150 ? [6, 9, 12, undefined] : [12, 20, undefined]
            for (const back of [0, 8, 16]) {
                const x = node.x - dir * back, side = size.halfWidth + 2
                if (back && !autopilot.isBoxSolid(x - 4, feet + 1, x + 4, feet + 8)) continue
                let fits = false
                //Start steering late, early enough to build speed before the feet reach the edge.
                for (const offset of [-8, 20, 50, 85]) {
                    const turnY = y + offset
                    if (turnY >= feet - 25 || autopilot.verticalJumpBlocked(x - side, turnY - size.height, x + side, feet - size.height)) continue
                    for (const most of [p.limit * 0.45, p.limit]) {
                        for (const hold of holds) {
                            const hit = autopilot.arc(x, feet, 0, -p.jump, dir, most, true, size, 0, true, hold, 0, turnY)
                            if (!hit || Math.abs(nodes[hit.node].y - y) > 20 || (nodes[hit.node].x - node.x) * dir <= 0 ||
                                Math.abs(nodes[hit.node].x - node.x) > 150 || autopilot.vanishBeforeLanding(nodes[hit.node], hit.cycles)) continue
                            add(hit.node, autopilot.JUMP, dir, hit.cycles + 12 + back / p.run, dir, most, false, 0, hit, { hold, turnY, takeoffX: x })
                            fits = true
                        }
                    }
                    if (fits) break
                }
                if (fits) break
            }
        }
    },
    vanishBeforeLanding(node, frames) {
        return autopilot.dynList.some(who => who.isThere && who.isTouched && who.fadeTime && who.fadeCount < frames + 6 &&
            Math.abs(who.bounds.min.y - node.y) < autopilot.cell && node.x >= who.bounds.min.x && node.x <= who.bounds.max.x)
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
        return `${from.cx},${from.cy},${to.cx},${to.cy},${edge.type},${edge.dir},${edge.steer || 0},${(edge.most || 0).toFixed(3)},${edge.isRun ? 1 : 0},${edge.coyote || 0},${edge.delay || 0},${edge.hold || 0},${edge.blockJumps || 0},${edge.isMomentum ? 1 : 0},${edge.turnY ?? ""},${edge.airJumps || 0}${edge.runFrom === undefined ? "" : ",r"}${edge.wraps ? ",wrap:" + edge.wraps : ""}`
    },
    similarJumpHold(a, b) {
        return Math.abs((a.hold ?? 60) - (b.hold ?? 60)) < 4
    },
    sameManeuver(a, b, from = autopilot.nodes[b.from], to = autopilot.nodes[b.to]) {
        if (a.type !== b.type || a.dir !== b.dir || !!a.wraps !== !!b.wraps) return false
        if (a.type === autopilot.FALL && a.steer !== b.steer) return false
        //Keep distinct takeoffs available, even when they go to the same platform.
        if (!!a.isRun !== !!b.isRun || !!a.coyote !== !!b.coyote || !autopilot.similarJumpHold(a, b) || !!a.delay !== !!b.delay || !!a.isMomentum !== !!b.isMomentum || a.turnY !== b.turnY || a.blockJumps !== b.blockJumps || a.airJumps !== b.airJumps) return false
        return autopilot.sameCrossing(a, from, to)
    },
    sameCrossing(edge, from, to) {
        const start = autopilot.nodes[edge.from], end = autopilot.nodes[edge.to]
        return Math.abs(start.x - from.x) <= 50 && Math.abs(start.y - from.y) <= 25 &&
            Math.abs(end.x - to.x) <= 75 && Math.abs(end.y - to.y) <= 30
    },
    retryCost(edge) {
        return autopilot.crossingFailure(edge) ? 360 : 0
    },
    crossingFailure(edge) {
        const cycle = simulation.cycle
        let temporary = null
        for (const attempt of autopilot.recentFailures) {
            if (cycle >= attempt.until) continue
            const hold = edge.hold ?? 60
            //Nearby attempts either need more rise or must release early enough to clear the ceiling.
            const sameFailedHeight = edge.type === autopilot.JUMP && !edge.isElevatorTransfer &&
                ((attempt.isTooLow && hold < attempt.edge.hold + 4) ||
                 (attempt.ceilingAt && edge.dir === attempt.edge.dir && edge.turnY === attempt.edge.turnY && hold >= attempt.ceilingAt - 3))
            if (!(sameFailedHeight && autopilot.sameCrossing(edge, attempt.from, attempt.to)) &&
                !autopilot.sameManeuver(edge, attempt.edge, attempt.from, attempt.to)) continue
            if (attempt.until === Infinity) return attempt
            temporary = attempt
        }
        return temporary
    },
    addFail(edge, count = 1, isTooLow = false, ceilingAt = 0) {
        const key = autopilot.edgeKey(edge)
        edge.fail = Math.max(edge.fail || 0, autopilot.failed.get(key) || 0) + count
        autopilot.failed.set(key, edge.fail)
        //A shortcut can have its own edge object. Update the graph's copy too.
        for (const other of autopilot.nodes[edge.from].edges) {
            if (other !== edge && autopilot.edgeKey(other) === key) other.fail = edge.fail
        }
        autopilot.rememberFailure(edge, isTooLow, ceilingAt, Infinity)
    },
    rememberFailure(edge, isTooLow = false, ceilingAt = 0, retryAfter = 300) {
        const { cycle } = simulation
        let until = cycle + retryAfter
        const recent = autopilot.recentFailures.filter(attempt => {
            if (cycle >= attempt.until) return false
            if (!autopilot.sameManeuver(edge, attempt.edge, attempt.from, attempt.to)) return true
            until = Math.max(until, attempt.until)
            return false
        })
        const shortHold = isTooLow && edge.hold < 56 && !edge.isElevatorTransfer && !edge.blockJumps && !edge.airJumps
        const from = autopilot.nodes[edge.from], to = autopilot.nodes[edge.to]
        recent.push({ edge, from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y }, cycle, until, isTooLow: shortHold, ceilingAt })
        autopilot.recentFailures = recent.slice(-8)
        autopilot.commit = autopilot.backUp = null
        autopilot.window.key = ""
        autopilot.routes.cycle = autopilot.openRoutes.cycle = -1
        autopilot.isPlanDirty = true
        autopilot.lastPlanCycle = -Infinity //failures should replan before the next attempt
    },
    confirmCrossing(edge) {
        if (!autopilot.recentFailures.length && !edge.fail) return
        const end = autopilot.nodes[edge.to]
        const recent = autopilot.recentFailures.filter(attempt =>
            attempt.until !== Infinity || Math.abs(end.x - attempt.to.x) > autopilot.cell / 2 || Math.abs(end.y - attempt.to.y) > autopilot.cell / 2 ||
            !autopilot.sameManeuver(edge, attempt.edge, attempt.from, attempt.to))
        if (recent.length === autopilot.recentFailures.length && !edge.fail) return
        autopilot.recentFailures = recent
        const key = autopilot.edgeKey(edge)
        autopilot.failed.delete(key)
        edge.fail = 0
        for (const other of autopilot.nodes[edge.from].edges) {
            if (autopilot.edgeKey(other) === key) other.fail = 0
        }
        autopilot.routes.cycle = autopilot.openRoutes.cycle = -1
        autopilot.isPlanDirty = true
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
    arc(...args) { //arcSim(), the landing remembers how it was simulated, so the path drawn can replay it
        const hit = autopilot.arcSim(...args)
        if (hit) hit.args = args
        return hit
    },
    arcTrace: null, //an array while drawing, arcSim() adds x, y each cycle, NaN, NaN where it goes through a portal or wraps
    arcSim(x, y, vx, vy, steer, most, isJump, size, delay = 0, isStrict = false, hold = Infinity, blockJumps = 0, turnY, transfer) { //simulate the player's box through the grid, returning its landing and travel time
        //isStrict: catching a ledge's corner with the slanted side of the foot slides off it, for steering a flight, planning keeps those landings, steering in the air fixes them
        //transfer.jumpAge: a jump pressed that many cycles ago, already rising, holding jump until hold, transfer.switchAt: from that cycle on steer transfer.then up to transfer.thenMost
        const points = autopilot.arcTrace
        const isMidJump = transfer?.jumpAge !== undefined
        const switchAt = transfer?.switchAt || 0
        const g = autopilot.grid
        const p = autopilot.p
        const bottom = g.y0 + g.h * autopilot.cell
        const { halfWidth, height, foot } = size
        const startX = x, startY = y
        let apexY = y
        let ceilingHit = false
        let canTurn = turnY === undefined || (isJump ? y <= turnY : y >= turnY)
        const zones = autopilot.jumpZones.length ? autopilot.jumpZones.filter(autopilot.jumpZoneActive) : autopilot.jumpZones
        const air = { ax: 0, ay: 0, vx: 0, vy: 0 }
        const drag = 1 - (player.frictionAir ?? 0.001)
        const boxSolid = (isJump && turnY !== undefined) || transfer?.verticalJump ? autopilot.verticalJumpBlocked :
            isStrict ? autopilot.isBoxSolidExact : autopilot.isBoxSolid //steering a flight, the map's real shape, the grid rounds a ledge out to whole cells
        let vxBefore = vx //the speed a cycle ago, what the push this cycle was decided on
        let lastJump = isMidJump ? 1 - transfer.jumpAge : 1, blockJumpArmed = false, airJumps = transfer?.airJumps || 0
        const firstPush = transfer?.groundPush ?? (isJump && !isMidJump && steer && !delay && canTurn && vx * steer < most ? steer * p.push * m.airTurnFx : 0)
        const hazardPath = autopilot.hazards.length || autopilot.lasers.length ? [] : null
        let box = null
        const trace = () => {
            if (!hazardPath) return
            if (!box) { box = [x - halfWidth, y - height, x + halfWidth, y]; hazardPath.push(box) }
            else { box[0] = Math.min(box[0], x - halfWidth); box[1] = Math.min(box[1], y - height); box[2] = Math.max(box[2], x + halfWidth); box[3] = Math.max(box[3], y) }
        }
        const ends = autopilot.portalEnds()
        const hasBoosts = autopilot.boosts.length > 0
        let lastExit = null, isPortal = false
        let leaveBoost = transfer?.leaveBoost
        const boostHit = (boost, cycles) => {
            let node = -1, distance = Infinity
            for (const n of boost.nodes) {
                if (n.dead) continue
                const d = Math.abs(n.x - x) + Math.abs(n.y - y)
                if (d < distance) { node = n.id; distance = d }
            }
            if (node < 0) return null //an airborne pad without any standing node still interrupts the arc
            trace()
            if (points) points.push(x, y)
            return { node, cycles, isWet: autopilot.pathIsWet(hazardPath), isPortal, hazardPath, x, y, vx, vy, apexY, ceilingHit, boost, wraps }
        }
        const wrap = autopilot.hasFallWrap()
        let wraps = 0 //each fall through drifts the player about 850 to the side, getting across a level can take a few
        if (points) points.push(x, y)
        for (let cycle = 1; cycle < (wrap ? 2400 : 260); cycle++) {
            if (points && cycle > 1) points.push(x, y)
            if (switchAt && cycle === switchAt) {
                steer = transfer.then
                most = transfer.thenMost
            }
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
                    if (points) points.push(NaN, NaN)
                    wraps++
                }
                continue
            }
            for (const end of ends) { //going into a portal comes out the other end, see level.portal()
                if (end === lastExit) continue //coming out of this one, the game skips it until the player is clear of it
                const b = end.portal.bounds
                if (x + halfWidth < b.min.x || x - halfWidth > b.max.x || y < b.min.y || y - height > b.max.y) continue
                const out = autopilot.throughPortal(end, vx, vy)
                box = null //do not count the space between portals as traveled
                if (points) points.push(x, y, NaN, NaN)
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
            const isAirJump = airJumps && jumpAge >= 21
            const isHeld = isJump && !release && jumpAge < Math.min(60, hold)
            if (isJump && !isHeld && jumpAge < 60 && vy < 0) vy *= m.shortJumpDamp //let go of jump early, it cuts the rise short, see m.airControl()
            const isApex = cycle > 1 && isHeld && Math.abs(vy) < m.apexSpeed
            //Air control and level effects set the forces for the next physics step.
            canTurn ||= isJump ? y <= turnY : y >= turnY
            if (isJump && cycle > 1 && !canTurn && vy >= 0 && !zones.length && !autopilot.winds.length && !ends.length) return null
            const steerLimit = canTurn ? most : isJump ? -Infinity : 0
            const push = cycle === 1 && !isMidJump ? firstPush : steer && cycle - 1 > delay && vxBefore * steer < steerLimit && vx * steer < p.limit ? steer * p.push * (vx * steer < 0 ? m.airTurnFx : 1) : 0
            vxBefore = vx
            air.ax = push
            const impulse = isJump && ((cycle === 1 && !isMidJump) || isBlockJump || isAirJump) ? -p.jump : 0
            air.ay = p.gravity * (isApex ? m.apexGravity : 1)
            air.vx = vx
            air.vy = isAirJump ? 0 : vy - (cycle === 1 ? impulse : 0)
            if (isAirJump) {
                airJumps--
                lastJump = cycle
            }
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
            if (isJump && steer && autopilot.isLedgeAssist && air.vy <= 8 && autopilot.ledgeAhead(x, y, air.vx, steer, size)) air.vy = Math.min(air.vy, -m.ledgeClimbSpeed * (player.scale || 1)) //holding toward a ledge just above the foot climbs it, see m.ledgeAssist()
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
                const room = autopilot.exactSideRoom
                const isCorner = autopilot.isExactSides && vy < 0 && steer === dir && !g.geometry && g.exact && autopilot.isMapExact(nx - halfWidth - room, y - 14, nx + halfWidth + room, y + 6)
                if (isCorner ? autopilot.isBoxSolidExact(nx - halfWidth - room, y - height + 2, nx + halfWidth + room, y - 14) : boxSolid(nx - halfWidth + 1, y - height + 2, nx + halfWidth - 1, y - 14)) { //rising, sideways against the map's real shape, the grid squares off a rounded corner and stops the player short of the climb up it
                    const ahead = nx + dir * (halfWidth + 2)
                    if (vy <= 8 && steer === dir && autopilot.isSolidAt(ahead, y - 12) && !autopilot.isSolidAt(ahead, y - m.ledgeStep - 2)) vy = Math.min(vy, -m.ledgeClimbSpeed) //ledge assist
                    vx = 0
                } else x = nx
            }
            //up and down
            if (transfer?.deck) {
                const deck = transfer.deck[cycle]
                const previous = transfer.deck[cycle - 1]
                if (!deck) return null
                if (Math.abs(x - deck.x) <= transfer.halfWidth && y <= previous.y + 3 && y + vy >= deck.y && vy > deck.vy) {
                    if (deck.y <= y + 4 || !Number.isFinite(autopilot.surfaceY(x - foot, x + foot, y, deck.y - 4))) {
                        y = deck.y
                        if (hasBoosts && autopilot.boostAt(x, y, size)) return null
                        trace()
                        if (points) points.push(x, y)
                        return { node: transfer.to, cycles: cycle, isWet: autopilot.pathIsWet(hazardPath), isPortal, hazardPath, x, y, vx, vy, apexY, ceilingHit, isDeckLanding: true, wraps }
                    }
                }
                //A side or underside collision will not behave like a clean boarding arc.
                if (Math.abs(x - deck.x) < transfer.halfWidth + halfWidth && y > deck.y + 5 && y - height < deck.y + transfer.height) return null
            }
            if (vy < 0) {
                if (boxSolid(x - halfWidth + 6, y - height + vy, x + halfWidth - 6, y - height + 2)) {
                    if (turnY !== undefined) return null
                    ceilingHit = true
                    vy = 0
                } else y += vy
            } else {
                const top = autopilot.surfaceY(x - foot, x + foot, y, y + vy + 1)
                const edge = isStrict && Number.isFinite(top) && !g.geometry && autopilot.isLipTakeoff ? autopilot.footOff(x, top) : null
                if (edge) { //only the slanted side of the foot caught a corner, the player slides off it and keeps falling
                    x = edge.side > 0 ? Math.max(x, edge.x + foot + 1) : Math.min(x, edge.x - foot - 1)
                } else if (Number.isFinite(top)) { //the first real surface crossed this frame, however many grid rows that spans
                    if (hasBoosts) {
                        const boost = autopilot.boostAt(x, top, size)
                        if (boost && boost !== leaveBoost) { y = top; return boostHit(boost, cycle) }
                    }
                    let node = autopilot.nodeNear(x, top, 0, 0)
                    if (node < 0) node = autopilot.nodeNear(x, top, 1, g.geometry ? 1 : 0)
                    if (node < 0) { //no spot where it landed, on flat ground the grid's row can be a cell off the real top, only a slope slides it on to a spot further down
                        const ground = autopilot.surfaceAt(x, top, 30, 10)
                        const isFlat = ground && Math.abs((ground.edge.y2 - ground.edge.y1) / ((ground.edge.x2 - ground.edge.x1) || 1)) <= autopilot.lipDrop
                        node = isFlat ? autopilot.nodeNear(x, ground.y, 1, 1) : autopilot.slideTo(x, top)
                    }
                    if (node >= 0 && isStrict && Math.abs(autopilot.nodes[node].x - x) > 60) node = -1 //a narrow top with no spot of its own, not a slope down to one far off
                    if (node < 0 || airJumps) return null
                    const to = autopilot.nodes[node]
                    if (to.isCrouch) return null
                    if (Math.abs(to.x - startX) < 37.5 && Math.abs(to.y - startY) < 2) return null
                    y = top
                    trace()
                    if (points) points.push(x, y)
                    return { node, cycles: cycle, isWet: autopilot.pathIsWet(hazardPath), isPortal, hazardPath, x, y: top, vx, vy, apexY, ceilingHit, wraps }
                }
                if (!g.geometry && boxSolid(x - foot, y, x + foot, y + vy + 1)) return null
                y += vy
            }
            if (hasBoosts) {
                const boost = autopilot.boostAt(x, y, size)
                if (boost && boost !== leaveBoost) return boostHit(boost, cycle)
                if (!boost) leaveBoost = null
            }
            apexY = Math.min(apexY, y)
            if (y > bottom && !wrap) return null
        }
        return null
    },
    hasFallWrap() { //falling out the bottom of these levels sends the player back in from the sky
        return level.fallMode === "position" || level.fallMode === "start"
    },
})
