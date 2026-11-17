"use strict";
//autopilot, in the air: checking the landing, flying, warping, grappling, and where the mouse looks, see the top of js/autopilot.js
Object.assign(autopilot, {
    //*********************************************************************
    // checking the landing every cycle in the air
    //*********************************************************************
    isAirCheck: true, //every cycle in the air simulate the rest of the flight, and when it won't land on the plan steer to whatever lands best, false to compare
    canAirCheck(flight) { //flights that steer like a plain jump or fall, not block jumps, extra air jumps, or boarding something moving
        const edge = flight.edge, to = autopilot.nodes[flight.to]
        if (!edge || !autopilot.dist || !to || to.dead || to.elevator || to.transport) return false
        if (edge.blockJumps || edge.airJumps || edge.isBoarding || edge.isElevatorTransfer || edge.type === autopilot.WALK) return false
        if (edge.type === autopilot.JUMP && (!flight.isJumped || m.cycle - m.buttonCD_jump < 2)) return false //the jump's push shows up in the speed a cycle after it's pressed
        return m.cycle - flight.mStart >= 2
    },
    airWays(vx) { //[steer, most, switchAt, then, thenMost], the ways of steering tried: one way all flight, or one way for a few cycles then another
        const L = autopilot.p.limit
        const ways = [[0, 0, 0, 0, 0]]
        for (const s of [-1, 1]) {
            for (const most of [L, L * 0.6, L * 0.3]) ways.push([s, most, 0, 0, 0])
        }
        if (Math.abs(vx) > 0.5) ways.push([-Math.sign(vx), 0, 0, 0, 0]) //brake to a stop over where it is
        for (const k of [4, 10, 18]) {
            for (const s of [-1, 0, 1]) {
                for (const t of [-1, 0, 1]) if (s !== t) ways.push([s, s ? L : 0, k, t, t ? L : 0])
            }
        }
        return ways
    },
    airArc(flight, feet, way) { //the rest of this flight from where the player is, steering way, holding jump like fly() does
        const edge = flight.edge
        const x = player.position.x, vx = player.velocity.x, vy = player.velocity.y
        const [steer, most, switchAt, then, thenMost] = way
        const transfer = { switchAt, then, thenMost, leaveBoost: flight.leaveBoost, verticalJump: edge?.type === autopilot.JUMP && edge.turnY !== undefined }
        const hold = edge?.type === autopilot.JUMP && flight.isJumped ? Math.min(60, edge.hold ?? 60) : 0
        const age = m.cycle - m.buttonCD_jump
        if (hold && age < hold && vy < m.apexSpeed) { //still rising on a held jump
            transfer.jumpAge = age
            return autopilot.arc(x, feet, vx, vy, steer, most, true, autopilot.size(), 0, true, hold, 0, undefined, transfer)
        }
        return autopilot.arc(x, feet, vx, vy, steer, most, false, autopilot.size(), 0, true, Infinity, 0, undefined, transfer)
    },
    landingNeedsWrap(hit) {
        return !!(hit.wraps || autopilot.wrapRoutes?.[hit.node])
    },
    landingRank(hit) {
        if (!hit || (autopilot.dist && !Number.isFinite(autopilot.dist[hit.node]))) return 4
        return (autopilot.landingNeedsWrap(hit) ? 2 : 0) | (autopilot.routeRank?.[hit.node] & 1)
    },
    airValue(flight, hit) { //lower is better: time in the air, then the plan's cost from where it lands
        const { dist, nodes } = autopilot
        if (!hit || !(dist[hit.node] < Infinity)) return Infinity
        return hit.cycles + dist[hit.node] + nodes[hit.node].cover + autopilot.fallWrapCost(hit) + autopilot.pathHazardCost(hit.hazardPath, hit.cycles) +
            (nodes[hit.node].isBoost ? autopilot.boostEntryCost : 0)
    },
    isAirOnPlan(flight, hit) { //lands on the target, a little to either side of it, or somewhere at least as close to the goal
        const { dist, nodes } = autopilot
        if (!hit || !(dist[hit.node] < Infinity) || hit.isWet || autopilot.leadsBackToFailure(flight.to, hit.node)) return false
        const at = nodes[hit.node], to = nodes[flight.to]
        if (at.isBoost && at.isBoost !== to.isBoost) return false
        return (Math.abs(at.x - to.x) < 110 && Math.abs(at.y - to.y) < 30) || dist[hit.node] <= dist[flight.to] + 5
    },
    airCheck(flight, feet, control) { //simulate what the plan pushes, keep it if it lands on the plan, otherwise steer to whatever lands best
        const mc = m.cycle
        const planned = autopilot.airArc(flight, feet, [control.steer, control.most, 0, 0, 0])
        flight.preview = planned
        if (autopilot.isAirOnPlan(flight, planned) && !autopilot.landingNeedsWrap(planned)) {
            flight.air = null
            return control
        }
        const air = flight.air
        if (air) { //the steering it switched to, from where it is in it now
            const left = air.switchAt ? air.switchAt - (mc - air.mc) : 0
            const way = left > 0 ? [air.steer, air.most, left, air.then, air.thenMost] : air.switchAt ? [air.then, air.thenMost, 0, 0, 0] : [air.steer, air.most, 0, 0, 0]
            const hit = autopilot.airArc(flight, feet, way)
            if (hit && (hit.node === air.node || autopilot.isAirOnPlan(flight, hit)) && !hit.isWet && !autopilot.landingNeedsWrap(hit)) {
                flight.preview = hit
                return autopilot.airControl(air)
            }
        }
        let best = null, bestValue = autopilot.airValue(flight, planned) - 10 //has to be clearly better than what the plan pushes
        const plannedRank = autopilot.landingRank(planned)
        let bestRank = plannedRank
        const { dist } = autopilot
        const from = flight.edge.from
        const fromRank = autopilot.landingRank({ node: from })
        const advances = (hit, rank) => dist[hit.node] < dist[from] || rank < fromRank || (plannedRank < 4 && rank < plannedRank)
        for (const way of autopilot.airWays(player.velocity.x)) {
            const hit = autopilot.airArc(flight, feet, way)
            if (!hit) continue
            const rank = autopilot.landingRank(hit)
            if (!advances(hit, rank)) continue
            const value = autopilot.airValue(flight, hit) + (way[2] ? 2 : 0) - (hit && hit.node === flight.to ? 8 : 0)
            if (rank < bestRank || (rank === bestRank && value < bestValue)) {
                bestValue = value
                bestRank = rank
                best = { way, hit }
            }
        }
        if (flight.edge.type !== autopilot.JUMP && m.buttonCD_jump + 20 < mc && mc < m.lastOnGroundCycle + m.coyoteCycles - 1) { //just walked off, a jump still works for a few cycles
            const L = autopilot.p.limit, dir = flight.edge.dir || Math.sign(player.velocity.x) || 1, size = autopilot.size()
            const ways = [[dir, L, 0, 0, 0], [dir, 0.6 * L, 0, 0, 0], [0, 0, 0, 0, 0], [-dir, L, 0, 0, 0], [-dir, 0, 0, 0, 0]]
            for (const k of [10, 20, 30]) { //going too fast for where it lands, coast or push on, then brake
                for (const s of [0, dir]) for (const [t, most] of [[-dir, 0], [-dir, L]]) ways.push([s, s ? L : 0, k, t, most])
            }
            for (const hold of [60, 20]) {
                for (const way of ways) {
                    const [steer, most, switchAt, then, thenMost] = way
                    const hit = autopilot.arc(player.position.x, feet, player.velocity.x, -autopilot.p.jump, steer, most, true, size, 0, true, hold, 0, undefined, switchAt ? { switchAt, then, thenMost } : undefined)
                    if (!hit || hit.ceilingHit) continue
                    const rank = autopilot.landingRank(hit)
                    if (!advances(hit, rank)) continue
                    const value = autopilot.airValue(flight, hit) + autopilot.jumpCost + 4 + (switchAt ? 2 : 0)
                    if (rank < bestRank || (rank === bestRank && value < bestValue)) {
                        const jump = { ...flight.edge, type: autopilot.JUMP, to: hit.node, hold, steer, most, dir: steer || flight.edge.dir, isLeap: true, coyote: 0, turnY: undefined, arcArgs: hit.args, trace: undefined, wraps: hit.wraps || undefined }
                        if (autopilot.retryCost(jump) && !autopilot.canRetryCrossing(jump)) continue
                        bestValue = value
                        bestRank = rank
                        best = { way, hit, jump }
                    }
                }
            }
        }
        autopilot.airSearches++
        if (best?.jump) { //jump now, the fall it walked off on would have missed
            autopilot.addFail(flight.edge)
            const [steer, most, switchAt, then, thenMost] = best.way
            flight.edge = best.jump
            flight.to = best.hit.node
            flight.isJumped = false
            flight.air = switchAt ? { steer, most, switchAt, then, thenMost, mc, node: best.hit.node } : null
            flight.landAt = 0
            flight.preview = best.hit
            autopilot.airSwitches++
            input.up = true
            return { steer, most }
        }
        if (!best) {
            flight.air = null
            return control
        }
        const [steer, most, switchAt, then, thenMost] = best.way
        flight.air = { steer, most, switchAt, then, thenMost, mc, node: best.hit.node }
        if (!autopilot.isAirOnPlan(flight, best.hit)) { //somewhere else, not just another spot on the same landing
            flight.to = best.hit.node //aim the rest of the flight there, the edge it started on still counts the miss
            flight.landAt = 0
            autopilot.airSwitches++
        }
        flight.preview = best.hit
        return autopilot.airControl(flight.air)
    },
    airSearches: 0, //how many times a flight looked for other steering, and how many times it changed where it lands, for tools/autopilot-test.js
    airSwitches: 0,
    airControl(air) {
        return air.switchAt && m.cycle - air.mc >= air.switchAt ? { steer: air.then, most: air.thenMost } : { steer: air.steer, most: air.most }
    },
    jumpContactAhead(x, feet, vy) { //the wide ground sensor can catch a ledge before the middle of the foot lands
        const reach = 18 * (player.scale || 1)
        for (const dx of [0, -reach, reach]) {
            const contact = autopilot.surfaceAt(x + dx, feet + vy, 3, 5)
            if (contact && Math.abs(contact.edge.y2 - contact.edge.y1) < 0.5 * (contact.edge.x2 - contact.edge.x1)) return true
        }
        return false
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
    canAirJump(edge) {
        return !!tech.isCoyote && 21 * edge.airJumps < m.coyoteCycles - 4
    },
    releaseWall(feet, go) {
        let release = autopilot.wallRelease
        if (!tech.isNitinol || m.onGround) {
            autopilot.wallRelease = null
            return false
        }
        const mc = m.cycle, grip = m.ledgeCoyote
        const crossing = autopilot.flight || autopilot.pending
        const step = crossing?.edge
        if (step?.isLowStep && mc - (crossing.mStart ?? crossing.mcycle) < 18 &&
            feet <= autopilot.nodes[step.to].y + 15 * (player.scale || 1)) {
            autopilot.wallRelease = null
            return false //keep running through brief contact on the lip
        }
        if (!release) {
            //Nitinol refreshes the grab timer to 20 while leaning on a wall, even during a planned fall.
            if (Math.abs(grip) !== 20 || Math.abs(player.velocity.y) > 1) return false
            release = autopilot.wallRelease = { dir: Math.sign(grip), until: mc + 18, coast: false }
            const edge = autopilot.flight?.edge
            if (edge?.type === autopilot.JUMP && autopilot.nodes[edge.to].y < feet - 25) autopilot.addFail(edge)
            autopilot.flight = autopilot.pending = null //predict a new landing after moving clear
        }
        if (mc >= release.until) {
            autopilot.wallRelease = null
            return false
        }
        if (grip === -20 * release.dir) release.coast = true //a narrow shaft can grab on either side
        if (!release.coast) go(-release.dir)
        autopilot.why = "letting go of a nitinol wall grab"
        return true
    },
    climbHeight: 2000, //the tallest wall it plans to climb with nitinol
    wallClimbTo(x, feet, n, dir, size) { //standing at x, the climb up the wall beside it to stand on n at its top, { wall, y, cost }, or null
        const surface = autopilot.surfaceAt(n.x, n.y, 8, 12)
        if (!surface || Math.abs(surface.edge.y2 - surface.edge.y1) > 0.2 * (surface.edge.x2 - surface.edge.x1)) return null //a flat top to stand on
        const wall = dir > 0 ? surface.edge.x1 : surface.edge.x2
        const gap = (wall - x) * dir
        if (gap < size.halfWidth - 5 || gap > 145 || Math.abs(n.x - wall) > 110) return null
        const y = surface.y
        const nearX = wall - dir * (size.halfWidth + 3)
        const hitsWall = yy => Matter.Query.rayAny(map, { x: wall - 3 * dir, y: yy }, { x: wall + 6 * dir, y: yy })
        for (let yy = y + 20; yy < feet - 16; yy += 95) if (!hitsWall(yy)) return null //a face to grab all the way up, nitinol grabs with the lower body
        if (autopilot.isBoxSolidExact(Math.min(x, nearX) - size.halfWidth + 3, feet - size.height, Math.max(x, nearX) + size.halfWidth - 3, feet - 20) ||
            autopilot.isBoxSolidExact(nearX - size.halfWidth + 3, y - size.height, nearX + size.halfWidth - 3, feet - 20) ||
            autopilot.pathIsWet([[Math.min(x, n.x) - size.halfWidth, y - size.height, Math.max(x, n.x) + size.halfWidth, feet]])) return null
        return { wall, y, nearX, cost: 35 + gap / autopilot.p.run + (feet - y) / 6 }
    },
    linkWallClimbs(node, feet, size, add) { //with nitinol, climb the wall beside this spot to the top of it
        if (!node.isStatic || node.isCrouch || node.isBoost || node.elevator || node.transport || node.belt) return
        const { w, h, nodeAt } = autopilot.grid
        const nodes = autopilot.nodes
        const lowest = node.cy - autopilot.cellsFor(140), highest = Math.max(0, node.cy - autopilot.cellsFor(autopilot.climbHeight))
        for (const dir of [-1, 1]) {
            for (let k = 1; k <= autopilot.cellsFor(245); k++) {
                const cx = node.cx + dir * k
                if (cx < 0 || cx >= w) break
                for (let cy = Math.min(lowest, h - 1); cy >= highest; cy--) {
                    const id = nodeAt[cx + cy * w]
                    if (id < 0) continue
                    const n = nodes[id]
                    if (n.dead || !n.isStatic || n.isCrouch || n.isBoost || n.elevator || n.transport || n.cover) continue
                    const climb = autopilot.wallClimbTo(node.x, feet, n, dir, size)
                    if (!climb) continue
                    add(id, autopilot.CLIMB, dir, climb.cost, 0, 0, false, 0, null, {
                        wall: climb.wall, wallY: climb.y, trace: Float32Array.from([climb.nearX, feet, climb.nearX, climb.y, n.x, n.y]),
                    })
                    break //the first top above this column, a higher one is another wall
                }
            }
        }
    },
    startWallClimb(edge, feet, go) { //a planned climb, see linkWallClimbs()
        autopilot.wallClimb = { node: edge.to, dir: edge.dir, wall: edge.wall, y: edge.wallY, edge, start: m.cycle, lastProgress: m.cycle, bestY: feet }
        return autopilot.driveWallClimb(feet, go)
    },
    driveWallClimb(feet, go) {
        const climb = autopilot.wallClimb, target = autopilot.nodes[climb.node]
        const mc = m.cycle, x = player.position.x, vy = player.velocity.y
        const finish = failed => {
            autopilot.wallClimb = null
            if (failed) {
                autopilot.noFly.set(climb.node, simulation.cycle + 300)
                if (climb.edge) autopilot.rememberFailure(climb.edge) //replan around it for a while
            } else if (climb.edge) autopilot.confirmCrossing(climb.edge)
            return false
        }
        if (!tech.isNitinol || !target || target.dead || m.isHolding) return finish(false)
        if (feet < climb.bestY - 8) {
            climb.bestY = feet
            climb.lastProgress = mc
        }
        if (m.onGround && climb.launched && mc > climb.launched + 8) return finish(feet > climb.y + 25)
        if (mc > climb.lastProgress + 70 || mc > climb.start + 240 + (climb.bestY - climb.y)) return finish(true) //a cycle for every unit of wall left
        const across = (x - climb.wall) * climb.dir
        const atTop = feet < climb.y - 9 || across > 3
        autopilot.why = "climbing a wall with nitinol"
        input.fire = false
        if (atTop) {
            if (Math.abs(target.x - x) > 12) go(target.x - x)
            else if (Math.abs(player.velocity.x) > 1.2) go(-player.velocity.x)
            return true
        }
        go(climb.dir)
        if (m.onGround) {
            if (!m.crouch && m.hardLandCD < mc && m.buttonCD_jump + 20 < mc) {
                input.up = true
                climb.launched = mc
            }
        } else if (m.buttonCD_jump + 20 >= mc) {
            input.up = vy < m.apexSpeed
        } else if (mc - m.lastOnGroundCycle > 10 &&
            (Math.sign(m.ledgeCoyote) === climb.dir || (vy > -10 && Matter.Query.rayAny(map,
                { x: m.pos.x + 25 * climb.dir, y: m.pos.y + 50 },
                { x: m.pos.x + 25 * climb.dir, y: m.pos.y + 95 })))) {
            input.up = true
            autopilot.why = "jumping off a wall with nitinol"
        }
        return true
    },
    doAirJumps(flight, feet, go, isLanding) {
        const edge = flight.edge, mc = m.cycle
        if (flight.airJumpAt !== undefined) {
            if (m.buttonCD_jump === flight.airJumpAt) flight.airJumpsUsed = (flight.airJumpsUsed || 0) + 1
            flight.airJumpAt = undefined
        }
        if ((flight.airJumpsUsed || 0) >= edge.airJumps || !autopilot.canAirJump(edge)) return false
        const age = mc - m.buttonCD_jump
        const left = m.lastOnGroundCycle + m.coyoteCycles - mc
        if (age > 20 && !m.onGround && left > 1 && !isLanding && !autopilot.jumpContactAhead(player.position.x + player.velocity.x, feet, player.velocity.y)) {
            input.up = true
            flight.airJumpAt = mc
            autopilot.why = "jumping again with acoustic levitation"
        } else if (age > 20) input.up = false
        if (player.velocity.x * edge.steer < edge.most) go(edge.steer)
        return true
    },
    isLandingSpan: true, //land anywhere on the target or the next steps of the plan, false aims at the target's middle, for tools/autopilot-test.js
    landingSteer(to, feet, fall = null) { //simulate steering options and pick a safe landing on or near the route
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
        if (fall?.steer) ways.unshift([fall.steer, fall.most])
        if (Math.abs(vx) > 0.5) ways.push([-Math.sign(vx), 0]) //brake to a stop over where it is
        let best = { steer: 0, most: 0 }, bestScore = Infinity, bestRank = 4
        for (const [steer, most] of ways) {
            const hit = autopilot.arc(player.position.x, feet, vx, player.velocity.y, steer, most, false, size, 0, true)
            let score
            if (hit && (span.has(hit.node) || along.has(hit.node))) {
                score = (steer === nextDir && most === p.limit ? 0 : steer === 0 ? 1 : 2) + (along.get(hit.node) || 0) //in the span, best moving the way it goes next
                if (fall?.steer && steer === fall.steer && most === fall.most) score -= 2
                const uphill = autopilot.landingUphill(hit.x, hit.y, nodes[to])
                if (uphill) score += steer === uphill && most === p.limit ? 1 : 5 //prefer arriving with enough uphill speed to climb
                if (autopilot.isLipTakeoff) { //near the end of a ledge, or sliding toward it after landing, a little off and it slides off
                    const rest = hit.x + hit.vx * 6 //it slides a little after landing, while it brakes
                    const onX = autopilot.surfaceAt(hit.x, hit.y) ? hit.x : nodes[hit.node].x //past the end of a narrow top there's no ground under the middle of the foot, find its ends from the spot it lands on
                    const left = autopilot.lipFor(onX, hit.y, -1), right = autopilot.lipFor(onX, hit.y, 1)
                    const marginAt = x => Math.min(left && !left.isBehind ? x - left.x : Infinity, right && !right.isBehind ? right.x - x : Infinity)
                    const margin = Math.min(marginAt(hit.x), marginAt(rest))
                    if (margin < 20) score += (20 - Math.max(-20, margin)) / 4
                    if (autopilot.landTries) autopilot.landTries.push(`[margin ${Number.isFinite(margin) ? margin.toFixed(0) : "inf"} rest ${rest.toFixed(0)} lips ${left ? left.x.toFixed(0) + (left.isBehind ? "b" : "") : "-"},${right ? right.x.toFixed(0) + (right.isBehind ? "b" : "") : "-"}]`)
                }
            } else score = 10 + (hit ? Math.abs(nodes[hit.node].x - nodes[to].x) + 3 * Math.abs(nodes[hit.node].y - nodes[to].y) : 5000) //the closest miss
            if (hit?.isWet) score += autopilot.pathHazardCost(hit.hazardPath, hit.cycles)
            if (hit && nodes[hit.node].isBoost && nodes[hit.node].isBoost !== nodes[to].isBoost) score += autopilot.boostEntryCost
            if (autopilot.landTries) autopilot.landTries.push(`${steer}/${most.toFixed(1)}:${hit ? nodes[hit.node].x + "," + nodes[hit.node].y + " at " + Math.round(hit.x) : "none"}=${score.toFixed(1)}`)
            const rank = autopilot.landingRank(hit)
            if (rank < bestRank || (rank === bestRank && score < bestScore)) {
                bestScore = score
                bestRank = rank
                best = { steer, most }
            }
        }
        if (bestScore >= 5000) {
            const steer = Math.sign(nodes[to].x - player.position.x)
            best = { steer, most: fall?.steer === steer ? fall.most : p.limit * 0.3 }
        }
        return best
    },
    planFlight(flight, feet) { //simulate the rest of this flight with a few ways of steering, and take the one that lands closest to the goal
        const { dist, nodes, p } = autopilot
        const size = autopilot.size()
        const x = player.position.x, vx = player.velocity.x, vy = player.velocity.y
        if (flight.leaveBoost && autopilot.boostAt(x, feet, size) !== flight.leaveBoost) flight.leaveBoost = null
        const transfer = flight.leaveBoost ? { leaveBoost: flight.leaveBoost } : undefined
        let best = null, bestValue = Infinity, bestRank = 4
        for (const steer of [-1, 0, 1]) {
            for (const most of steer ? [p.limit, p.limit * 0.6, p.limit * 0.3] : [0]) {
                const hit = autopilot.arc(x, feet, vx, vy, steer, most, false, size, 0, true, Infinity, 0, undefined, transfer)
                if (!hit || !(dist[hit.node] < Infinity)) continue
                let value = autopilot.airValue(flight, hit)
                if (hit.node === flight.to) value -= 8 //keep the landing it was going for unless another is clearly better
                const rank = autopilot.landingRank(hit)
                if (rank < bestRank || (rank === bestRank && value < bestValue)) {
                    bestValue = value
                    bestRank = rank
                    best = { node: hit.node, steer, most, cycles: hit.cycles, wraps: hit.wraps }
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
        flight.edge = { from, to: best.node, type: flight.launchType || (flight.isLaunched ? autopilot.BOOST : autopilot.FALL), dir: best.steer || Math.sign(nodes[best.node].x - x) || 1, cost: best.cycles, steer: best.steer, most: best.most, isRun: false, fail: 0, isLeap: true, wraps: best.wraps || undefined }
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
        const support = autopilot.standingOn()
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
        if (tech.isCoyote && m.coyoteCycles > 40) {
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
        } else {
            if (!tech.isCoyote || m.coyoteCycles <= 40) {
                autopilot.flying = null
                return
            }
            const age = m.cycle - m.buttonCD_jump
            const needsRise = dy < -30 && (!isLanding || feet > target.y + 8)
            const riseLeft = Math.min(21, Math.max(0, -vy) / autopilot.p.gravity)
            const nextRise = Math.max(0, -vy) * riseLeft - 0.5 * autopilot.p.gravity * riseLeft ** 2
            const left = m.lastOnGroundCycle + m.coyoteCycles - m.cycle
            if (age <= 20) input.up = vy < m.apexSpeed
            else if (m.onGround) input.up = needsRise
            else if (left > 1 && needsRise && feet - nextRise > point.y + 20 && !autopilot.jumpContactAhead(x + vx, feet, vy)) input.up = true
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
    isInExit(margin = 0) {
        const x = player.position.x, y = player.position.y
        return x > level.exit.x + 12 - margin && x < level.exit.x + 88 + margin &&
            y > level.exit.y - 250 - margin && y < level.exit.y + 35 + margin && !level.exit.isInverted && !level.isFlipping
    },
    isHolding: false,
    combat: "", //"back" or "hold" while fighting changes how it moves
    isSmoothCombat: true, //keep traveling while shooting, false is the old stop and back away, for tools/autopilot-test.js
    isCommit: true, //keep going for a running jump once it's lined up, false to compare
    isEscalate: true, //try a forward hop when stuck, false to compare
    stuckCount: 0,
    recovery: "",
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
        const exact = autopilot.blockAttackAim || autopilot.pickupAim || autopilot.warp || autopilot.exactAim || autopilot.carryAim
        if (exact) { //exactly on the warp spot or the hook's anchor, the camera follows the mouse this cycle too, solve for where the mouse has to be
            if (autopilot.pickupAim || autopilot.blockAttackAim || autopilot.blockClear) {
                //The game's look() reads the world mouse before camera() projects the screen mouse.
                simulation.mouseInGame.x = exact.x
                simulation.mouseInGame.y = exact.y
            }
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
})
//runs once every autopilot file has loaded, keep it at the end of the last one index.html loads
autopilot.setup()
