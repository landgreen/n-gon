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
//  clear walks to upgrades and the exit use live terrain; buttons and toggles are fallbacks for a blocked exit
//  a word above the player says what it's doing, like lost or stuck, and it circles what it's going for and shooting at
//autopilot.do() runs once a cycle, before simulation.normalLoop() or testingLoop(), only while it's on (see attachLoop), it only sets input.* and simulation.mouse
const autopilot = {
    isOn: false,
    isDrawPath: true, //a faint line along the planned path
    only: "", //"exit" skips optional pickups and mob hunts, for tools/autopilot-test.js
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
    triedDoors: new Map(),
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
    recentFailures: [], //failed crossings, kept by world position across grid rebuilds
    failed: new Map(), //how often an edge failed, by its cells, so it isn't forgotten when a moving platform's node is made again
    //the plan
    goal: -1, //node id
    goalType: "", //"exit", "powerUp", "mob"
    goalWho: null,
    goalWalk: null, //world x of a clear walk to an upgrade or the exit, even without graph nodes
    goalSince: 0,
    atGoalCount: 0,
    dist: null, //cycles from each node to the goal
    next: null, //the edge to take from each node
    routeRank: null, //bits for a remembered failure and a fall off the map on the remaining route
    isPlanDirty: true,
    lastPlanCycle: -Infinity,
    ignored: new Map(), //power ups and mobs given up on, and the cycle to try them again
    //driving
    cur: -1, //the node the player is at, or was last at
    wasOnGround: false,
    pending: null, //{ edge, mcycle, isJump } the edge being started, so leaving the ground knows which one it was
    flight: null, //{ edge, to, since, mStart, isJumped } while in the air
    loadedJumpMiss: null, //a ledge the current block made it too heavy to reach
    wiggleUntil: 0,
    wiggleDir: 1,
    recoverySite: null, //where recovery started, which moves were tried, and when to retry a blocked route
    backUp: null, //{ edge, until } getting room to run before a running jump, see backUpForJump()
    slideSince: 0, //the cycle it started sliding down a slope too steep to stand on
    watch: { x: 0, y: 0, cycle: 0 }, //where the player was, to notice they are stuck
    blockedCycles: 0,
    target: null, //the mob being shot at
    fightSince: 0,
    fightMobCount: 0,
    pushOnUntil: 0,
    aim: { x: 0, y: 0 },
    hazards: [],
    lasers: [], //level beams, observed only while their query methods are being called
    laserHazards: [], //current beam segments, clipped by the terrain and blocks
    jumpZones: [], //read-only observations of zone methods the level actually runs
    winds: [], //each level.wind() zone, { x, y, width, height, velocity, isFloat }
    observeJumpZone(zone, method, effect) {
        autopilot.hook(zone, method, run => function () {
            //Some hazard objects are used as lasers. Only query() and heatQuery() affect motion.
            effect.cycle = simulation.cycle
            return run.apply(this, arguments)
        })
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
    hazardSignature: "",
    said: "", //the last thing it said in the in game console, and when
    saidCycle: -Infinity,
    WALK: 0, JUMP: 1, FALL: 2, BOOST: 3, RIDE: 4, GRAPPLE: 5, PORTAL: 6, CLIMB: 7,
    edgeNames: ["walk", "jump", "fall", "boost", "ride", "grapple", "portal", "climb"],

    //*********************************************************************
    // setup
    //*********************************************************************
    setup() { //level.boost() and the others are local to each level's code, so what they make is tagged as it's made
        autopilot.settingDefaults = Object.fromEntries(autopilot.settingList.filter(s => s.key).map(s => [s.key, s.key === "choose" ? true : autopilot.getSetting(s.key)])) //taking the tech turns choosing on
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
                who.autopilotElevator = { width, height, bottom: y, top: maxHeight, force, friction: { ...friction }, isSmoothStop, mode: "unknown", enabled: false, commandCycle: -Infinity, commandPlayerCycle: -Infinity, lastMotion: m.cycle, lastY: who.position.y, waitingForTouch: false, boardedAt: null, nodes: [[], []] }
                for (const mode of ["move", "moveOnTouch"]) {
                    autopilot.hook(who, mode, move => function (isOn = true) {
                        const e = this.autopilotElevator
                        if (isOn && (!e.enabled || m.cycle - e.commandPlayerCycle > 2)) {
                            e.lastMotion = m.cycle
                            e.lastY = this.position.y
                            e.boardedAt = null
                        }
                        e.mode = mode
                        e.enabled = isOn
                        e.commandCycle = simulation.cycle
                        e.commandPlayerCycle = m.cycle
                        return move.apply(this, arguments)
                    })
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
        const spinner = level.spinner
        level.spinner = function () {
            const pin = spinner.apply(this, arguments)
            if (pin?.bodyB) pin.bodyB.autopilotSpinner = true
            return pin
        }
        const doorMap = level.doorMap
        level.doorMap = function () {
            const who = doorMap.apply(this, arguments)
            if (who) {
                who.autopilotDynamic = true //a map piece that moves
                autopilot.observeDoor(who)
            }
            return who
        }
        const door = level.door
        level.door = function () {
            const who = door.apply(this, arguments)
            if (who) autopilot.observeDoor(who)
            return who
        }
        const transport = level.transport
        level.transport = function (x, y, width, height) { //a platform that goes back and forth between two stops, see trainStop()
            const who = transport.apply(this, arguments)
            if (who) {
                who.autopilotTransport = { width, height, nodes: [[], []], stops: null }
                autopilot.hook(who, "trainStop", run => function () { //it only goes between its stops while its level calls this
                    this.autopilotTransport.cycle = simulation.cycle
                    return run.apply(this, arguments)
                })
            }
            return who
        }
        const mover = level.mover
        level.mover = function () { //a belt only carries the player on the cycles its level calls push()
            const who = mover.apply(this, arguments)
            if (who) {
                who.autopilotPushed = simulation.cycle
                autopilot.hook(who, "push", push => function () {
                    this.autopilotPushed = simulation.cycle
                    return push.apply(this, arguments)
                })
            }
            return who
        }
        const button = level.button
        level.button = function () {
            const who = button.apply(this, arguments)
            if (who && autopilot.isUsefulTrigger("button", who)) autopilot.triggers.push({ kind: "button", obj: who, arrivedAt: 0 })
            return who
        }
        const toggle = level.toggle
        level.toggle = function () {
            const who = toggle.apply(this, arguments)
            if (who && autopilot.isUsefulTrigger("toggle", who)) autopilot.triggers.push({ kind: "toggle", obj: who, arrivedAt: 0 })
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
            if (pair) {
                autopilot.portals.push(pair)
                for (const end of [pair[2], pair[3]]) if (end?.query) autopilot.hook(end, "query", run => function () {
                    const before = player.isInPortal
                    const result = run.apply(this, arguments)
                    if (player.isInPortal === this.portalPair && before !== this.portalPair) autopilot.recordPortalExit(this.portalPair)
                    return result
                })
            }
            return pair
        }
        const hazard = level.hazard
        level.hazard = function () {
            const who = hazard.apply(this, arguments)
            autopilot.hazards.push(who)
            autopilot.observeJumpZone(who, "query", { kind: "slime", bounds: who })
            autopilot.observeJumpZone(who, "heatQuery", { kind: "heat", bounds: who })
            for (const method of ["heatQuery", "heatWarning"]) autopilot.hook(who, method, run => function () {
                this.autopilotIsHeat = true
                return run.apply(this, arguments)
            })
            return who
        }
        const laser = level.laser
        level.laser = function (p1, p2, damage = 0.12) {
            const who = laser.apply(this, arguments)
            if (!(damage > 0)) return who
            const beam = { who, seen: -Infinity }
            if (!autopilot.lasers.length && !autopilot.hazards.length && autopilot.grid) autopilot.relinkAll()
            autopilot.lasers.push(beam)
            for (const method of ["query", "motionQuery"]) {
                autopilot.hook(who, method, run => function () {
                    if (!m.isTimeDilated && (method === "query" || this.countDown > 0)) beam.seen = simulation.cycle
                    return run.apply(this, arguments)
                })
            }
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
            autopilot.hooked.length = 0 //the last level's objects are gone
            autopilot.hazards.length = 0
            autopilot.lasers.length = autopilot.laserHazards.length = 0
            autopilot.jumpZones.length = 0
            autopilot.triggers.length = 0
            autopilot.portals.length = 0
            autopilot.winds.length = 0
            if (autopilot.isOn) autopilot.reset() //set(false) already reset it, so there's nothing to clear while it's off
            return start.apply(this, arguments)
        }
    },
    set(isOn) {
        autopilot.isOn = isOn
        for (const h of autopilot.hooked) autopilot.attachHook(h, isOn)
        autopilot.attachLoop(isOn)
        autopilot.reset()
        if (typeof input !== "undefined") input.reset()
    },
    //while the autopilot is off the game runs none of its code each cycle: no check in the main loop and no wrapped level methods
    //each level's helpers (level.elevator, level.door, level.hazard, ...) still list what they make, once, as it's made,
    //so turning the autopilot on mid-level, like taking its tech, can watch what's already there
    hooked: [], //{ obj, method, wrap, original, wrapped }, per-cycle methods of this level's elevators, doors, and zones, wrapped only while the autopilot is on
    hook(obj, method, wrap) { //wrap(original) returns the replacement
        const h = { obj, method, wrap, original: null, wrapped: null }
        autopilot.hooked.push(h)
        if (autopilot.isOn) autopilot.attachHook(h, true)
    },
    attachHook(h, isOn) {
        if (isOn && !h.original && typeof h.obj[h.method] === "function") {
            h.original = h.obj[h.method]
            h.wrapped = h.obj[h.method] = h.wrap(h.original)
        } else if (!isOn && h.original) {
            if (h.obj[h.method] === h.wrapped) h.obj[h.method] = h.original
            h.original = h.wrapped = null
        }
    },
    loops: null, //the game's own normal and testing loops, while the autopilot runs before them
    attachLoop(isOn) { //autopilot.do() runs at the start of each cycle's loop, only while it's on
        if (typeof simulation === "undefined" || typeof simulation.normalLoop !== "function") return
        if (isOn && !autopilot.loops) {
            const loops = autopilot.loops = { normalLoop: simulation.normalLoop, testingLoop: simulation.testingLoop }
            for (const name of ["normalLoop", "testingLoop"]) {
                const run = loops[name]
                simulation[name] = function () {
                    autopilot.do()
                    return run.apply(this, arguments)
                }
                if (simulation.loop === run) simulation.loop = simulation[name]
            }
        } else if (!isOn && autopilot.loops) {
            for (const name of ["normalLoop", "testingLoop"]) {
                if (simulation.loop === simulation[name]) simulation.loop = autopilot.loops[name]
                simulation[name] = autopilot.loops[name]
            }
            autopilot.loops = null
        }
    },
    toggle(isAutoChoose = false) { //for testing, from the browser console: autopilot.toggle() turns it on or off, autopilot.toggle(true) also picks power ups
        tech.isAutopilotChoose = isAutoChoose
        autopilot.set(!autopilot.isOn)
        return autopilot.isOn ? "autopilot on" + (isAutoChoose ? ", auto choosing power ups" : "") : "autopilot off"
    },
    canPlayInCurrentMode() {
        return !levelEditor.isActive || levelEditor.isFullTest
    },
    choiceDelay: 2000, //milliseconds a power up's menu stays up before auto choose clicks, so the player can see what it was
    draftScores(grid = document.getElementById("choose-grid")) { //also usable from the console to see why a draft card ranks where it does
        const run = autopilotBuild.currentBuild()
        const choices = []
        for (const card of grid.querySelectorAll(".card-background[onclick]")) {
            const match = card.getAttribute("onclick").match(/^powerUps\.choose\('(tech|gun|field)',(\d+)\)$/)
            if (!match) continue
            const type = match[1], index = Number(match[2])
            const option = type === "tech" ? tech.tech[index] : type === "gun" ? b.guns[index] : m.fieldUpgrades[index]
            if (option) choices.push({ type, name: option.name, ...autopilotBuild.score(type, option, run), card })
        }
        return choices.sort((a, b) => b.score - a.score)
    },
    chooseDraft(shownFor = 0) { //called after the draft's click delay, even when the game loop is paused
        const isReady = () => autopilot.isOn && tech.isAutopilotChoose &&
            m.alive && !simulation.onTitlePage && simulation.isChoosing && autopilot.canPlayInCurrentMode()
        if (!isReady()) return
        const grid = document.getElementById("choose-grid")
        let choice = grid.querySelector("#choose-difficulty")
        let discardType = ""
        if (!choice) {
            const ranked = autopilot.draftScores(grid)
            const best = ranked.find(option => Number.isFinite(option.score))
            const cancel = grid.querySelector(".cancel-card[onclick], .entanglement[onclick]")
            const reroll = grid.querySelector(".research-card[onclick]:not(.entanglement)")
            const canRandomize = cancel && tech.isCancelTech && tech.cancelTechCount === 0 && !cancel.classList.contains("entanglement")
            const type = reroll?.getAttribute("onclick").match(/^powerUps\.research\.use\('(tech|gun|field)'\)$/)?.[1] ||
                (canRandomize && cancel.getAttribute("onclick").match(/^powerUps\.endDraft\("(tech|gun|field)",true\)$/)?.[1])
            const freeResearch = tech.isJunkResearch && powerUps.research.currentRerollCount < 2
            // One speculative reroll per pickup. Preserve research for the run's other uses.
            const researchReserve = tech.isRerollDamage || tech.isRerollBots || tech.interestRate > 0 ? 2 :
                tech.isDeathAvoid && !tech.isDeathAvoidedThisLevel ? 1 : 0
            const canResearch = reroll && !tech.isBrainstormActive && !tech.isResearchReality && !tech.isRerollHaste &&
                powerUps.research.currentRerollCount === 0 && (freeResearch || powerUps.research.count > researchReserve)
            const cancelValue = tech.isCancelDuplication || tech.isCancelRerolls || tech.isCancelCouple ? 10 : 0
            const current = Math.max(best?.score ?? -100, cancel ? cancelValue : -100)
            const worthReroll = (options, gain) => {
                const forecast = autopilotBuild.rerollForecast(type, current, { floor: cancel ? cancelValue : -100, ...options })
                return forecast && current < forecast.typical && forecast.expected - current >= gain && forecast.chanceBetter >= 0.6
            }
            if (type && canRandomize && worthReroll({ expanded: true }, 5)) choice = cancel
            else if (type && canResearch && worthReroll({ researchCost: freeResearch ? 0 : 1, extraJunkChance: freeResearch ? 0.01 : 0 }, freeResearch ? 5 : 8)) choice = reroll
            else if (cancel && !canRandomize && (!best || best.score <= cancelValue)) choice = cancel
            else if (type && canRandomize && (!best || best.score <= 0)) {
                choice = cancel
                discardType = type
            } else if (best) choice = best.card
            else if (ranked.length) {
                // A forced draft can close without giving excluded tech or paying cancel rewards.
                choice = ranked[0].card
                discardType = "tech"
            } else choice = cancel || grid.querySelector(".card-background[onclick]")
        }
        if (!choice) return
        const draftId = powerUps.draftId
        const wait = Math.max(0, autopilot.choiceDelay - shownFor)
        const delay = tech.isBrainstormActive ? Math.min(wait, Math.max(0, tech.brainStormDelay - 300)) : wait
        autopilot.pointAt(choice)
        setTimeout(() => { //the same menu, still open
            if (isReady() && powerUps.draftId === draftId && choice.isConnected) {
                if (discardType) powerUps.endDraft(discardType)
                else choice.click()
            }
        }, delay)
    },
    pointAt(choice) { //light up the choice like a mouse hover, so the player can see what it's about to pick
        choice.classList.add("autopilot-hover")
    },
    cancelMovement() { //node references and timers belong to one uninterrupted maneuver
        if (autopilot.carry?.step && m.isHolding && m.holdingTarget === autopilot.carry.block) m.drop()
        autopilot.flight = autopilot.pending = autopilot.backUp = null
        autopilot.rayMove = null
        autopilot.loadedJumpMiss = null
        autopilot.flying = autopilot.warp = autopilot.grapple = autopilot.exactAim = autopilot.carry = autopilot.carryAim = null
        autopilot.pilotClear = null
        autopilot.endRemotePickup()
        autopilot.pickupAim = null
        autopilot.endBlockAttack()
        autopilot.wallClimb = autopilot.wallRelease = null
        if (autopilot.blockClear && !m.isHolding) m.holdingTarget = null
        autopilot.blockClear = null
        autopilot.commit = null
        autopilot.window = { key: "", start: 0 }
        autopilot.resetRecovery()
        autopilot.riding = null
        autopilot.rideProgress = null
        autopilot.doorApproach = null
        autopilot.combat = ""
    },
    resetRecovery() {
        autopilot.recoverySite = null
        autopilot.wiggleUntil = autopilot.blockedCycles = autopilot.stuckCount = autopilot.waitSince = autopilot.slideSince = 0
        autopilot.isHolding = false
        autopilot.routeLoop.pending = false
        autopilot.routeLoop.since = simulation.cycle
        autopilot.watch = { x: typeof player !== "undefined" && player ? player.position.x : 0, y: typeof playerBody !== "undefined" && playerBody ? playerBody.bounds.max.y : 0, cycle: simulation.cycle }
    },
    invalidateNavigation() { //a rebuilt grid reuses node ids, none of the old references may survive
        autopilot.cancelMovement()
        autopilot.exploreApproach = null
        if (autopilot.upgradeHunt) autopilot.upgradeHunt.approach = null
        if (autopilot.bossHunt) autopilot.bossHunt.approach = null
        autopilot.goal = autopilot.cur = -1
        autopilot.wasOnGround = false
        autopilot.goalWho = null
        autopilot.goalType = ""
        autopilot.goalWalk = null
        autopilot.dist = autopilot.next = null
        autopilot.routes.cycle = autopilot.openRoutes.cycle = -1
        autopilot.wrapRoutes = autopilot.routeRank = null
        autopilot.noFly.clear()
        autopilot.failed.clear()
        autopilot.isPlanDirty = true
        autopilot.lastPlanCycle = -Infinity
    },
    reset() {
        autopilot.invalidateNavigation()
        autopilot.recentFailures.length = 0
        autopilot.routeLoop = { since: simulation.cycle, pending: false, pickups: powerUp.length, kills: 0 }
        autopilot.portalPass = null
        autopilot.detourSpent = 0
        autopilot.detourProgress = null
        autopilot.upgradeHunt = null
        autopilot.skippedUpgrades = new WeakMap()
        autopilot.bossHunt = null
        autopilot.skippedBosses = new WeakSet()
        autopilot.stepBlocks.clear()
        autopilot.nextBlockStep = 0
        autopilot.levelExitProgress = -Infinity
        autopilot.target = null
        autopilot.atGoalCount = 0
        autopilot.isAiming = false
        autopilot.hazardSignature = ""
        autopilot.laserHazards = []
        autopilot.manualControl = false
        autopilot.controlField = m.fieldMode
        autopilot.grid = null
        autopilot.nodes = []
        autopilot.elevators = []
        autopilot.activeElevators.clear()
        autopilot.transports = []
        autopilot.activeTransports.clear()
        autopilot.train = null
        autopilot.trainRide = null
        autopilot.rodeFrom = []
        for (const who of autopilot.swings.keys()) if (who.autopilotTransport?.isSwing) who.autopilotTransport = null
        autopilot.swings.clear()
        autopilot.triedDoors.clear()
        autopilot.dyn.clear()
        autopilot.dynList = []
        autopilot.relink.clear()
        autopilot.badAnchors = []
        autopilot.elevatorStuckUntil = 0
        autopilot.windSignature = null
        autopilot.belts = []
        autopilot.beltSignature = null
        autopilot.beltTry = null
        autopilot.beltMiss.clear()
        autopilot.beltLast = 0
        autopilot.isPlanDirty = true
        autopilot.ignored.clear()
        autopilot.remotePickupRetry = new WeakMap()
        autopilot.blockAttackRetry = new WeakMap()
        autopilot.nextBlockAttack = 0
        autopilot.tried.clear()
        autopilot.saidAt.clear()
        autopilot.explored.clear()
        autopilot.exploreVisited.clear()
        autopilot.exploreAgainAt = 0
        autopilot.lostSince = 0
        autopilot.lastHeavyMove = 0
        autopilot.lastBuildCycle = -Infinity
        autopilot.rayWalls = null
        autopilot.lastRayAttempt = -Infinity
        autopilot.pushOnUntil = 0
        autopilot.ignoreBlocksUntil = autopilot.ignoreBlocksAgainAt = 0
    },

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
            const hit = vertexCollision(position, look, [map, body])
            const end = hit.who ? hit : look
            beams.push({ x: position.x, y: position.y, dx: end.x - position.x, dy: end.y - position.y,
                pad: (who.isArc ? who.arcHitWidth / 2 : 0) + 5 })
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

    //*********************************************************************
    // every cycle
    //*********************************************************************
    do() {
        if (!m.alive || simulation.onTitlePage || simulation.paused || simulation.isChoosing || !autopilot.canPlayInCurrentMode() || !player || simulation.clearNow) return
        const cycle = simulation.cycle
        const isManual = input.movementKeys.size > 0
        if (isManual !== autopilot.manualControl || autopilot.controlField !== m.fieldMode) {
            autopilot.cancelMovement()
            if (isManual) autopilot.upgradeHunt = autopilot.bossHunt = null
            autopilot.manualControl = isManual
            autopilot.controlField = m.fieldMode
        }
        for (const who of autopilot.elevators) autopilot.updateElevator(who)
        const elevatorChanged = autopilot.elevators.some(who => autopilot.activeElevators.has(who) !== autopilot.elevatorEnabled(who))
        autopilot.watchSwings()
        const transportChanged = (autopilot.transports.length > 0 || autopilot.swings.size > 0) && cycle % 10 === 7 && Math.abs(autopilot.transportSum() - autopilot.transportSignature) > 0.5
        if (!autopilot.grid || elevatorChanged || transportChanged || (cycle % 30 === 0 && cycle > autopilot.lastBuildCycle + 90 && autopilot.hasMapChanged())) {
            if (!autopilot.build()) {
                if (cycle % autopilot.goalEvery === 0 && !autopilot.chooseUpgrade()) autopilot.chooseBoss()
                return
            }
        }
        if (cycle % 30 === 15) autopilot.findMovingMap()
        if ((player.scale || 1) !== autopilot.pScale || cycle % 30 === 20) autopilot.hasMovementChanged()
        if (cycle % 10 === 0 && autopilot.winds.length) { //a button turning the fans around changes every jump through the wind
            let signature = 0
            for (const w of autopilot.winds) signature += 1000 * w.velocity.x + 3000 * w.velocity.y + (w.isFloat ? 7 : 0)
            if (Math.abs(signature - autopilot.windSignature) > 1e-6) {
                if (autopilot.windSignature !== null) {
                    autopilot.relinkAll()
                    autopilot.lastHeavyMove = cycle
                    autopilot.isPlanDirty = true
                }
                autopilot.windSignature = signature
            }
        }
        if (cycle % 10 === 3 && autopilot.belts.length) { //a belt that speeds up, stops, or turns around changes the walks and jumps from every spot on it
            const sum = autopilot.beltSum()
            if (Math.abs(sum - autopilot.beltSignature) > 0.2) {
                autopilot.beltSignature = sum
                for (const node of autopilot.nodes) {
                    if (node.dead || !node.belt) continue
                    const v = autopilot.beltV(node)
                    if (node.beltWas !== v) autopilot.relink.add(node.id)
                }
                autopilot.isPlanDirty = true
            }
        }
        if (cycle % 10 === 0) {
            autopilot.refreshHazards()
            autopilot.refreshJumpZones()
        }
        const rayWalls = m.fieldUpgrades[2]?.rayWalls?.()
        if (cycle % 10 === 5 || ((rayWalls?.length || autopilot.rayWalls?.length) && rayWalls !== autopilot.rayWalls)) autopilot.updateObstacles()
        autopilot.rayWalls = rayWalls
        for (const [door, until] of autopilot.triedDoors) {
            if (cycle < until && !autopilot.doorOpening(door)) continue
            autopilot.triedDoors.delete(door)
            autopilot.isPlanDirty = true
        }
        for (const t of autopilot.triggers) { //a button that went down and came back up needs something left on it
            if (t.kind !== "button") continue
            if (t.obj.isUp) {
                if (t.wasDown) t.popsUp = true
                t.wasUp = true
            } else if (t.wasUp) t.wasDown = true
        }
        autopilot.relinkSome(autopilot.relinkBudget)
        const feet = playerBody.bounds.max.y
        if (autopilot.cur >= 0 && autopilot.nodes[autopilot.cur].dead) autopilot.cur = -1
        if (m.onGround) {
            let at = autopilot.nodeNear(player.position.x, feet, 1, 2)
            if (at < 0) { //standing on something too small to be on the grid
                at = autopilot.nodeBelow(player.position.x, feet - 30)
                if (at >= 0 && autopilot.nodes[at].y - feet > 250) at = -1
            }
            const under = autopilot.standingOn()
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
            autopilot.train = under && under.autopilotTransport && autopilot.activeTransports.has(under) ? under : null
            if (autopilot.train) { //on its deck, at the stop it's parked at, or the one it's headed for
                const who = autopilot.train
                const stop = autopilot.transportMoving(who) ? autopilot.transportHeading(who) : autopilot.transportAt(who)
                const node = stop >= 0 ? autopilot.transportNode(who, stop, player.position.x - who.position.x) : -1
                if (node >= 0) at = node
            }
            if (at >= 0) {
                const step = autopilot.next?.[autopilot.cur]
                if (autopilot.wasOnGround && !autopilot.flight && step?.type === autopilot.WALK && step.to === at) autopilot.confirmCrossing(step)
                autopilot.cur = at
                autopilot.exploreVisited.add(autopilot.exploreArea(autopilot.nodes[at]))
            }
            autopilot.beltLast = autopilot.beltSpeed(autopilot.beltUnder()) //kept through the flight that leaves it
        } else {
            autopilot.riding = null
            if (autopilot.train && (!autopilot.train.autopilotTransport || !autopilot.transportMoving(autopilot.train))) autopilot.train = null //hopping on a parked one, a moving one carries on without it
        }
        if (autopilot.recentFailures.some(attempt => cycle >= attempt.until)) {
            autopilot.recentFailures = autopilot.recentFailures.filter(attempt => cycle < attempt.until)
            autopilot.isPlanDirty = true
        }
        const isRiding = !!autopilot.train && autopilot.transportMoving(autopilot.train) //on a train between stops it keeps where it was going, what it can reach is about to change
        const justLanded = m.onGround && !autopilot.wasOnGround
        autopilot.wasOnGround = m.onGround
        const pursuing = autopilot.remotePickup?.who ?? autopilot.goalWho
        if (!isManual && !autopilot.isUpgrade(pursuing) && !autopilot.isLiveBoss(pursuing) &&
            (autopilot.remotePickup || autopilot.goalType === "powerUp" || autopilot.goalType === "mob")) autopilot.detourSpent++
        const objectiveBeforeExit = !isManual && !isRiding && autopilot.goalType === "exit" && autopilot.isInExit(110) && autopilot.holdExitForObjectives()
        const upgradeCollected = autopilot.isUpgrade(autopilot.goalWho) && !powerUp.includes(autopilot.goalWho)
        const boss = autopilot.bossHunt?.who
        const bossResolved = boss && (!boss.alive || !autopilot.canHuntBosses())
        //once each time the plan is rebuilt, not every cycle it's waiting to be, relinking and moving doors keep it dirty for many cycles
        const reconsiderButton = autopilot.lastPlanCycle === cycle - 1 && (autopilot.goalType === "trigger" || autopilot.carry?.trigger)
        const reconsiderWalk = justLanded && !isManual && !isRiding && autopilot.goalWalk === null &&
            autopilot.goalType === "exit" && autopilot.walkToExit() !== null
        if (objectiveBeforeExit || upgradeCollected || bossResolved || reconsiderButton || reconsiderWalk || (cycle % autopilot.goalEvery === 0 && !isRiding) ||
            (autopilot.goal < 0 ? autopilot.goalWalk === null : autopilot.nodes[autopilot.goal].dead)) {
            autopilot.giveUp()
            autopilot.chooseGoal()
        }
        if ((autopilot.goalWalk === null || !m.onGround) && autopilot.isPlanDirty && (cycle > autopilot.lastPlanCycle + autopilot.planEvery || !autopilot.next)) autopilot.plan()
        if (cycle % 60 === 0 && autopilot.dist && autopilot.cur >= 0 && autopilot.goal >= 0 && !(autopilot.dist[autopilot.cur] < Infinity) && !autopilot.relink.size) autopilot.say("lost", `no way from here to the ${autopilot.goalType === "exit" ? "exit" : "goal"}`)
        autopilot.fight()
        if (!isManual) {
            autopilot.watchRouteLoop()
            if (!autopilot.drivePortalEscape() && !autopilot.driveBlockAttack(feet) && !autopilot.driveRemotePickup()) {
                autopilot.drive(feet) //holding a movement key takes over
                autopilot.beltHop(feet)
                autopilot.movePilotWave(feet)
            }
            autopilot.measure()
            if (tech.isFireMoveLock && (input.left || input.right || input.up || autopilot.flying)) input.fire = false //Higgs mechanism, the player can't move while firing
        } else {
            autopilot.portalPass = null
            autopilot.routeLoop.since = cycle
            autopilot.routeLoop.pending = false
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
        if (autopilot.isHuntTarget(who)) return //priority goals have their own search limits
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
        if (!isGone && autopilot.remotePickup?.who === who) return
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
    //*********************************************************************
    // settings, a panel in the autopilot tech's description in the pause menu, see tech.js
    //*********************************************************************
    //how often it plans and aims, not in the panel, tools/autopilot-test.js can change them with --set
    planEvery: 10, //plans again at most this often, in cycles, when something changed
    goalEvery: 30, //chooses what to go for this often, in cycles
    relinkBudget: 1.5, //milliseconds a cycle spent redrawing the map around what moved
    airEvery: 1, //checks where a flight lands this often, in cycles
    landEvery: 3, //picks how to steer a landing this often, in cycles
    flightEvery: 6, //looks for the best landing after a boost or a knock this often, in cycles
    stuckAfter: 150, //cycles without getting anywhere before it tries something else
    settingDefaults: null, //every setting's starting value, from setup()
    isSettingsOpen: false, //the settings in the pause menu are folded away until opened, and stay how they were left
    settingList: [ //{ key, text } a checkbox, { group } a heading
        { group: "what it does" },
        { key: "choose", text: "chooses" }, //tech.isAutopilotChoose, its text is in settingsHTML()
        { key: "hunt", text: "goes for other power ups and mobs" },
        { key: "isCarryBlocks", text: "carries blocks to buttons" },
        { key: "isExplore", text: "explores when there's no way" },
        { key: "isSmoothCombat", text: "keeps moving while it shoots" },
        { key: "isDrawPath", text: "draws its path" },
        { key: "isStuckView", text: "shows why it's stuck" },
        { key: "isTalking", text: "says what it's doing" },
    ],
    getSetting(key) {
        if (key === "choose") return !!tech.isAutopilotChoose
        return key === "hunt" ? autopilot.only !== "exit" : autopilot[key]
    },
    setSetting(key, value) { //from the pause menu, only while paused
        if (!simulation.paused || simulation.isChoosing) return
        const setting = autopilot.settingList.find(s => s.key === key)
        if (!setting) return
        if (key === "choose") tech.isAutopilotChoose = !!value
        else if (key === "hunt") autopilot.only = value ? "" : "exit"
        else autopilot[key] = !!value
        if (autopilot.isOn) autopilot.isPlanDirty = true
    },
    resetSettings() {
        if (!simulation.paused || simulation.isChoosing) return
        for (const key in autopilot.settingDefaults) autopilot.setSetting(key, autopilot.settingDefaults[key])
        build.generatePauseRight()
    },
    settingsHTML() { //a checkbox for every setting, folded away in a details menu
        let html = `<details class="autopilot-settings-details" onclick="event.stopPropagation()" ontoggle="autopilot.isSettingsOpen = this.open" ${autopilot.isSettingsOpen ? "open" : ""}><summary>settings</summary><div class="autopilot-settings">`
        for (const s of autopilot.settingList) {
            const text = s.key === "choose" ? `<strong>n-gon</strong> <strong class='color-choice' data-help='choice'><span>ch</span><span>oo</span><span>ses</span></strong> ${powerUps.orb.tech()} ${powerUps.orb.field()} ${powerUps.orb.gun()} for you` : s.text
            if (s.group) html += `<div class="autopilot-settings-group">${s.group}</div>`
            else html += `<label><input type="checkbox" onchange="autopilot.setSetting('${s.key}', this.checked)" ${autopilot.getSetting(s.key) ? "checked" : ""}> ${text}</label>`
        }
        return html + `<button type="button" class="autopilot-settings-reset" onclick="autopilot.resetSettings()">defaults</button></div></details>`
    },
    //*********************************************************************
    // the stuck view, why it isn't getting anywhere, drawn while it's stuck when the setting is on
    //*********************************************************************
    isStuckView: false,
    stuckWatch: null, //{ x, y, cycle } where the player was when it last got somewhere
    isStuck() { //hasn't got 150 from where it was for 3 seconds, has no way to its goal, or keeps failing moves
        const x = player.position.x, y = player.position.y, cycle = simulation.cycle
        const w = autopilot.stuckWatch
        if (!w || cycle < w.cycle || Math.hypot(x - w.x, y - w.y) > 150) autopilot.stuckWatch = { x, y, cycle }
        const isLost = autopilot.cur >= 0 && autopilot.dist && !(autopilot.dist[autopilot.cur] < Infinity)
        return cycle - autopilot.stuckWatch.cycle > 180 || isLost || autopilot.recentFailures.filter(f => cycle - f.cycle < 300).length >= 2
    },
    drawStuck() { //nearby spots and their jumps and falls, the moves that failed and how many times, the goal, and what it's doing
        const { nodes, dist } = autopilot
        const x = player.position.x, feet = playerBody.bounds.max.y
        const near = nodes.filter(n => !n.dead && Math.abs(n.x - x) < 450 && Math.abs(n.y - feet) < 350)
        const isFailed = e => e.fail > 0 || autopilot.retryCost(e) > 0
        const trace = (n, e) => {
            const to = nodes[e.to]
            ctx.moveTo(n.x, n.y - 12)
            if (e.type === autopilot.PORTAL) ctx.moveTo(to.x, to.y - 12)
            else if (e.type !== autopilot.WALK) autopilot.drawTrace(autopilot.edgeTrace(e))
            ctx.lineTo(to.x, to.y - 12)
        }
        ctx.beginPath() //every jump and fall from where the player is standing, faint
        for (const n of near) if (Math.abs(n.x - x) < 90 && Math.abs(n.y - feet) < 60) for (const e of n.edges) if (e.type !== autopilot.WALK && !isFailed(e)) trace(n, e)
        ctx.strokeStyle = "rgba(0,0,0,0.18)"
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath() //spots with a way to the goal
        for (const n of near) if (dist && dist[n.id] < Infinity) ctx.rect(n.x - 4, n.y - 4, 8, 8)
        ctx.fillStyle = "rgba(0,140,255,0.6)"
        ctx.fill()
        ctx.beginPath() //spots with no way
        for (const n of near) if (!dist || !(dist[n.id] < Infinity)) ctx.rect(n.x - 4, n.y - 4, 8, 8)
        ctx.fillStyle = "rgba(120,120,120,0.6)"
        ctx.fill()
        ctx.beginPath() //moves that failed
        const labels = []
        for (const n of near) for (const e of n.edges) {
            if (!isFailed(e)) continue
            trace(n, e)
            labels.push({ x: (n.x + nodes[e.to].x) / 2, y: Math.min(n.y, nodes[e.to].y) - 30, text: `${autopilot.edgeNames[e.type]} failed ${e.fail || 1}x` })
        }
        ctx.strokeStyle = "rgba(255,0,60,0.8)"
        ctx.lineWidth = 3
        ctx.stroke()
        const goal = autopilot.goal >= 0 && nodes[autopilot.goal] && !nodes[autopilot.goal].dead ? nodes[autopilot.goal] : null
        if (goal) {
            ctx.beginPath()
            ctx.arc(goal.x, goal.y - 40, 40, 0, 2 * Math.PI)
            ctx.strokeStyle = "rgba(0,170,90,0.8)"
            ctx.lineWidth = 3
            ctx.stroke()
            labels.push({ x: goal.x, y: goal.y - 95, text: `goal: ${autopilot.goalType || "?"}` })
        }
        const next = autopilot.cur >= 0 && autopilot.next ? autopilot.next[autopilot.cur] : null
        const lines = [
            `${autopilot.why || autopilot.said || "?"}${autopilot.saidNote && !autopilot.why ? ` (${autopilot.saidNote})` : ""}`,
            `goal: ${autopilot.goalType || "none"}${goal ? `, ${autopilot.dist && autopilot.cur >= 0 && autopilot.dist[autopilot.cur] < Infinity ? Math.round(autopilot.dist[autopilot.cur]) : "no way"}` : ""}`,
            next ? `next: ${autopilot.edgeNames[next.type]} to ${Math.round(nodes[next.to].x)}, ${Math.round(nodes[next.to].y)}${next.fail ? `, failed ${next.fail}x` : ""}` : "next: none",
            `still for ${Math.round((simulation.cycle - autopilot.stuckWatch.cycle) / 60)} s, ${autopilot.recentFailures.length} remembered crossings`,
        ]
        ctx.font = "22px Arial"
        ctx.textAlign = "center"
        ctx.fillStyle = "rgba(0,0,0,0.75)"
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], x, m.pos.y - 230 - (lines.length - 1 - i) * 26)
        ctx.fillStyle = "rgba(255,0,60,0.9)"
        for (const l of labels) ctx.fillText(l.text, l.x, l.y)
        ctx.textAlign = "left"
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
            if (autopilot.isStuckView && autopilot.isStuck()) autopilot.drawStuck()
            if (!autopilot.isDrawPath) return
            autopilot.drawRings()
            if (!autopilot.next || autopilot.cur < 0) return
            const nodes = autopilot.nodes
            let at = autopilot.cur
            ctx.beginPath()
            const flight = autopilot.flight
            const landing = !m.onGround && flight && flight.to >= 0 && !nodes[flight.to].dead ? autopilot.flightTrace(flight) : null
            if (landing) { //in the air, the rest of this flight as it's being steered, from the player
                ctx.moveTo(player.position.x, playerBody.bounds.max.y - 12)
                autopilot.drawTrace(landing.points)
                at = landing.node
            } else ctx.moveTo(nodes[at].x, nodes[at].y - 12)
            for (let i = 0; i < 400 && autopilot.next[at]; i++) {
                const edge = autopilot.next[at]
                const to = nodes[edge.to]
                if (edge.type === autopilot.PORTAL) ctx.moveTo(to.x, to.y - 12) //through a portal
                else if (edge.type !== autopilot.WALK) autopilot.drawTrace(autopilot.edgeTrace(edge))
                ctx.lineTo(to.x, to.y - 12)
                at = edge.to
            }
            ctx.strokeStyle = "rgba(0,140,255,0.3)"
            ctx.lineWidth = 4
            ctx.setLineDash([6, 14])
            ctx.stroke()
            ctx.setLineDash([])
            if (landing && landing.x !== undefined) { //where this flight comes down
                ctx.beginPath()
                ctx.arc(landing.x, landing.y - 12, 9, 0, 2 * Math.PI)
                ctx.strokeStyle = "rgba(0,140,255,0.5)"
                ctx.lineWidth = 3
                ctx.stroke()
            }
        },
    },
    drawTrace(points) { //continue the path through x, y pairs 12 above the feet, NaN breaks it
        if (!points) return
        let isGap = false
        for (let i = 0; i < points.length; i += 2) {
            if (Number.isNaN(points[i])) {
                isGap = true
                continue
            }
            if (isGap) ctx.moveTo(points[i], points[i + 1] - 12)
            else ctx.lineTo(points[i], points[i + 1] - 12)
            isGap = false
        }
    },
    replay(args) { //the cycle by cycle path of arcSim(...args)
        autopilot.arcTrace = []
        try {
            autopilot.arcSim(...args)
            return Float32Array.from(autopilot.arcTrace)
        } finally {
            autopilot.arcTrace = null
        }
    },
    edgeTrace(edge) { //the flight a jump, fall, or boost was planned with, replayed once and kept on the edge
        if (edge.trace === undefined) edge.trace = edge.arcArgs ? autopilot.replay(edge.arcArgs) : null
        return edge.trace
    },
    flightTrace(flight) { //{ points, node, x, y } the rest of the flight being steered now, once a cycle
        if (flight.traceCycle === simulation.cycle) return flight.traced
        flight.traceCycle = simulation.cycle
        const hit = flight.preview
        if (hit && hit.args) {
            const points = autopilot.replay(hit.args)
            flight.traced = { points, node: hit.node, x: points[points.length - 2], y: points[points.length - 1] }
        } else if (flight.edge && flight.edge.arcArgs && flight.edge.to === flight.to) { //a flight that isn't checked, the arc it was planned with
            flight.traced = { points: [NaN, NaN, ...autopilot.edgeTrace(flight.edge)], node: flight.to }
        } else {
            const to = autopilot.nodes[flight.to]
            flight.traced = { points: [to.x, to.y], node: flight.to }
        }
        return flight.traced
    },
}
autopilot.setup()
