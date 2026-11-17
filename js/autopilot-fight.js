"use strict";
//autopilot, aiming each gun and fighting mobs, see the top of js/autopilot.js
Object.assign(autopilot, {
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
        const offset = p.launchOffset || 0
        let x = from.x + offset * Math.cos(angle), y = from.y + offset * Math.sin(angle)
        let vx = p.speed * Math.cos(angle) + p.inherit.x * vp.x, vy = p.speed * Math.sin(angle) + p.inherit.y * vp.y
        const dir = Math.sign(goalX - from.x) || 1
        const isVertical = Math.abs(goalX - from.x) < 30
        let lastX = x, lastY = y, clear = true
        const obstacles = p.obstacles || map
        if (isCheck && offset && Matter.Query.rayAny(obstacles, from, { x, y }, p.width)) return null
        for (let t = 1; t < 240; t++) {
            vx *= p.keep
            vy = vy * p.keep + p.gravity
            const nx = x + vx, ny = y + vy
            if (isCheck && t % 3 === 0) {
                if (Matter.Query.rayAny(obstacles, { x: lastX, y: lastY }, { x: nx, y: ny }, p.width)) clear = false
                lastX = nx
                lastY = ny
            }
            if (isVertical ? Math.abs(ny - goalY) < Math.abs(vy) + 1 || (ny - goalY) * Math.sign(vy) > 0 : (nx - goalX) * dir >= 0) {
                const f = isVertical ? 1 : Math.abs(vx) > 1e-6 ? (goalX - x) / vx : 1
                if (isCheck && Matter.Query.rayAny(obstacles, { x: lastX, y: lastY }, { x: goalX, y: y + vy * f }, p.width)) clear = false
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
        if (along < 30) return [{ angle: Math.atan2(to.y - from.y, dx || 1e-6), t: Math.hypot(dx, up) / s, clear: !Matter.Query.rayAny(p.obstacles || map, from, to, p.width) }]
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
    blockAttack: null,
    blockAttackAim: null,
    blockAttackRetry: new WeakMap(),
    nextBlockAttack: 0,
    endBlockAttack() {
        const attack = autopilot.blockAttack
        if (!attack) return
        autopilot.blockAttack = autopilot.blockAttackAim = null
        input.field = false
        if (m.holdingTarget === attack.block) {
            if (m.isHolding) m.drop()
            else m.holdingTarget = null //a released block keeps its projectile collision filter
        } else if (!m.isHolding && !attack.held) m.holdingTarget = null //discard any other block the field highlighted during pickup
        if (m.fieldMode === 11) m.fieldUpgrades[11].cancelPresses()
    },
    blockAttackShot(block, target, charge) {
        const origin = m.pos
        const to = target.position
        const dx = to.x - origin.x, dy = to.y - origin.y
        const distance = Math.hypot(dx, dy)
        const obstacles = map.concat(body.filter(who => who !== block && (who.collisionFilter.mask & (cat.player | cat.bullet))))
        if (tech.isTokamak && charge > 4) {
            const blast = 330 * Math.pow(block.mass, 0.25) * b.explosionRange()
            if (distance < blast + (target.radius || 30) + 40 || Matter.Query.rayAny(obstacles, origin, to)) return null
            return { x: to.x, y: to.y }
        }
        const speed = m.throwSpeed(Math.min(charge / 5, 1), block.mass)
        const launchOffset = 30 + 40 * player.scale //the block's center in m.holding()
        const width = Math.min(block.bounds.max.x - block.bounds.min.x, block.bounds.max.y - block.bounds.min.y)
        if (speed < 12) return null
        if (distance <= launchOffset + width / 2 || Math.abs(dx) < 30) {
            const angle = Math.atan2(dy, dx)
            const radius = Math.max(launchOffset, distance)
            const end = { x: origin.x + radius * Math.cos(angle), y: origin.y + radius * Math.sin(angle) }
            return Matter.Query.rayAny(obstacles, origin, end, width) ? null : to
        }
        const dt = simulation.delta
        const profile = {
            speed, launchOffset, width, obstacles, fuse: 36,
            gravity: simulation.g * dt * dt, keep: 1 - block.frictionAir * dt / (1000 / 60),
            inherit: { x: 0.5, y: 0.5 },
        }
        const velocity = target.velocity
        const initial = autopilot.aimArc(profile, origin, to, false)[0]
        if (!initial) return null
        const lead = Math.min(initial.t, 24)
        const ahead = { x: to.x + velocity.x * lead, y: to.y + velocity.y * lead }
        const shot = autopilot.aimArc(profile, origin, ahead).find(arc => arc.clear)
        return shot ? { x: origin.x + 500 * Math.cos(shot.angle), y: origin.y + 500 * Math.sin(shot.angle) } : null
    },
    driveBlockAttack(feet) {
        const cycle = simulation.cycle
        const target = autopilot.target
        const support = autopilot.standingOn()
        let attack = autopilot.blockAttack
        const distance = target?.alive && !target.isBadTarget && !target.isInvulnerable ?
            Math.hypot(target.position.x - m.pos.x, target.position.y - m.pos.y) : Infinity
        const upgrade = autopilot.upgradeHunt?.who
        const busy = autopilot.goalWalk !== null || autopilot.carry || autopilot.blockClear || autopilot.rayMove || autopilot.remotePickup || autopilot.flying ||
            autopilot.warp || autopilot.grapple || autopilot.riding || autopilot.train || autopilot.wallClimb || autopilot.wallRelease ||
            autopilot.backUp || autopilot.pending?.isJump || support?.isRay || autopilot.goalType === "trigger" ||
            (autopilot.goalType === "exit" && autopilot.isInExit()) ||
            (upgrade && autopilot.isInExit(110) && Number.isFinite(autopilot.nearbyUpgradeDistance(upgrade)))
        if (attack?.released) {
            autopilot.endBlockAttack()
            return false
        }
        if (autopilot.isArmed() || busy || !m.onGround || distance > 1000 || (autopilot.only === "exit" && autopilot.goalWho !== autopilot.bossHunt?.who)) {
            autopilot.endBlockAttack()
            return false
        }
        if (!attack) {
            if (cycle < autopilot.nextBlockAttack || cycle < autopilot.pushOnUntil || m.fieldCDcycle >= m.cycle ||
                m.energy < 0.06 || m.isHolding || m.throwBlock !== m.throwBlockDefault || !autopilot.canHoldBlocks()) return false
            if (autopilot.goalType === "powerUp" && autopilot.goalWho?.name === "ammo" &&
                Math.hypot(autopilot.goalWho.position.x - m.pos.x, autopilot.goalWho.position.y - m.pos.y) < 250) return false
            let best = Infinity
            for (const block of body) {
                const reach = Math.hypot(block.position.x - m.pos.x, block.position.y - m.pos.y)
                if (reach > autopilot.carryReach() - 20 || block === support || block.isImmutable || block.isInvulnerable ||
                    cycle < (autopilot.blockAttackRetry.get(block) || 0) || !autopilot.isCarryable(block) || !autopilot.isPushable(block) ||
                    autopilot.hanging.has(block) || autopilot.isOnButton(block) || autopilot.stepBlocks.has(block) || block.speed > 10 ||
                    Matter.Query.rayAny(map, m.pos, block.position)) continue
                const cost = reach + block.mass * 6
                if (cost < best) {
                    best = cost
                    attack = { block, started: cycle, held: false, released: false }
                }
            }
            autopilot.nextBlockAttack = cycle + 15
            if (!attack) return false
            autopilot.blockAttack = attack
            autopilot.say("throwing", "out of ammo, using a block")
        }
        const block = attack.block
        const isHeld = m.isHolding && m.holdingTarget === block
        if (!body.includes(block) || (m.isHolding && !isHeld) || (!isHeld && attack.held) ||
            cycle - attack.started > (isHeld ? 95 : 32) || (!isHeld && (block === support || autopilot.isOnButton(block)))) {
            autopilot.blockAttackRetry.set(block, cycle + 180)
            autopilot.endBlockAttack()
            return false
        }
        input.left = input.right = input.up = input.down = input.fire = false
        autopilot.pending = autopilot.commit = null
        autopilot.watch = { x: player.position.x, y: feet, cycle }
        autopilot.blockedCycles = 0
        autopilot.isHolding = true
        if (!isHeld) {
            autopilot.why = "picking up a block for combat"
            autopilot.blockAttackAim = block.position
            //Only let the field go once it has selected our block, so it can't take a button weight or the floor.
            input.field = m.holdingTarget !== block || m.fieldCDcycle >= m.cycle
            return true
        }
        attack.held = true
        autopilot.why = "charging a block throw"
        const minimumCharge = distance < 300 ? 2 : distance < 650 ? 3.5 : 5
        //A close tokamak blast can hurt us. Try a physical throw before it reaches fusion charge.
        const aim = m.throwCharge >= minimumCharge && autopilot.blockAttackShot(block, target, m.throwCharge)
        if (aim) {
            autopilot.blockAttackAim = aim
            autopilot.why = "throwing a block at a mob"
            input.field = false
            attack.released = true
            autopilot.blockAttackRetry.set(block, cycle + 150)
            autopilot.nextBlockAttack = cycle + 25
        } else if (m.energy < 0.004 || m.throwCharge >= 5) {
            autopilot.blockAttackRetry.set(block, cycle + 180)
            autopilot.endBlockAttack()
            input.field = false
        } else {
            const away = Math.atan2(m.pos.y - target.position.y, m.pos.x - target.position.x)
            autopilot.blockAttackAim = autopilot.blockDropAim(block, away) || target.position
            input.field = true
        }
        return true
    },
    fight() { //pick the closest mob in view, shoot it, and pull in power ups
        if (autopilot.flying || autopilot.warp || autopilot.grapple || autopilot.blockClear || autopilot.rayMove) {
            input.fire = input.field = false
            autopilot.target = null
            autopilot.isAiming = false
            return
        }
        if (!autopilot.isArmed() && !autopilot.remotePickup && m.fieldMode !== 11 && !tech.isGunCycle && !tech.isGunChoice) {
            const slot = b.inventory.findIndex(index => b.guns[index].ammo > 0)
            if (slot >= 0) {
                simulation.switchToGunInInventory(slot)
                autopilot.cycleAim = -Infinity
            }
        }
        if (autopilot.blockAttack) return
        const profile = autopilot.profile = autopilot.isGunAim && b.inventory.length ? autopilot.gunProfile() : null
        if (profile) autopilot.watchShots()
        const isThroughWalls = profile && profile.isThroughWalls
        const boss = autopilot.goalType === "mob" && autopilot.goalWho === autopilot.bossHunt?.who ? autopilot.goalWho : null
        let target = null, best = 1800 * 1800, bossInRange = false
        for (let i = 0; i < mob.length; i++) {
            const who = mob[i]
            if (!who.alive || who.isBadTarget || who.isInvulnerable) continue
            const dx = who.position.x - m.pos.x, dy = who.position.y - m.pos.y
            const d2 = dx * dx + dy * dy
            const supportsBoss = boss?.isShielded && who.shield && who.shieldTargetID !== undefined && who.shieldTargetID === boss.id
            const priority = (who === boss || supportsBoss) && d2 < (profile?.reach ?? (autopilot.isArmed() ? 1800 : 450)) ** 2
            if (((!bossInRange && d2 < best) || (priority && (!bossInRange || d2 < best))) &&
                ((isThroughWalls && d2 < profile.reach * profile.reach) || !Matter.Query.rayAny(map, m.pos, who.position))) {
                best = d2
                target = who
                bossInRange = priority
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
        const isRemoteField = field === "grappling hook" || field === "wormhole" || field === "pilot wave" || field === "portal"
        const grabRange = isRemoteField && !autopilot.manualControl ? 0 : target || isFieldMoves ? 160 * 160 : m.grabPowerUpRange2
        let grab = null, grabCost = Infinity
        for (const pickup of powerUp) {
            const value = autopilotBuild.pickupValue(pickup)
            if (!value) continue
            const dx = pickup.position.x - m.pos.x, dy = pickup.position.y - m.pos.y
            const d2 = dx * dx + dy * dy
            const cost = (Math.sqrt(d2) + 15) / (pickup === autopilot.upgradeHunt?.who ? 50 : value)
            if (d2 < grabRange && cost < grabCost && !Matter.Query.rayAny(map, m.pos, pickup.position)) {
                grabCost = cost
                grab = pickup
            }
        }
        //Keep a ray underfoot while walking or jumping off it. Field input would remove the support.
        const support = autopilot.standingOn()
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
})
