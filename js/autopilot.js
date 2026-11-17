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
//none of this is in index.html: js/autopilot-loader.js downloads it the first time autopilot turns on, autopilot.files there lists the files in order
//this file has its state, setup, turning it on and off, power up choices, do(), the settings, and the stuck view, the rest adds to autopilot, in this order:
//  autopilot-grid.js        the grid and its nodes, exact map surfaces, and moving obstacles
//  autopilot-edges.js       edges: walking, jumping, falling, boosts, portals, and the arcs they're planned with
//  autopilot-plan.js        planning a path to the goal, saying what it's doing, power ups, detours, and choosing a goal
//  autopilot-mechanisms.js  exits that appear later, buttons and toggles, exploring, carrying blocks, and moving blocks out of the way
//  autopilot-fight.js       aiming each gun and fighting mobs
//  autopilot-drive.js       following the plan on the ground: loops, being stuck, recovery, and jumps
//  autopilot-air.js         in the air: checking the landing, flying, warping, grappling, and where the mouse looks, it ends with autopilot.setup()
//a new file goes in autopilot.files before autopilot-air.js
Object.assign(autopilot, { //autopilot starts as the stand in from js/autopilot-loader.js
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
    setup() { //runs once every file has loaded, see js/autopilot-loader.js
        autopilot.settingDefaults = Object.fromEntries(autopilot.settingList.filter(s => s.key).map(s => [s.key, s.key === "choose" ? true : autopilot.getSetting(s.key)])) //taking the tech turns choose on, so reset settings turns it back on
        autopilot.watchLevel()
        for (const record of autopilot.made) autopilot.observe(record) //what this level made before the files loaded
        autopilot.isLoaded = true
    },
    observe({ kind, who, args, cycle }) { //level.boost() and the others are local to each level's code, so what they make is tagged as it's made, see autopilot.made
        autopilot.observers[kind]?.(who, args, cycle)
    },
    observers: {
        boost(who, [x, y, launchHeight = 1000, angle = Math.PI / 2]) {
            if (who) who.autopilotBoost = { x, y, launchHeight, angle }
        },
        elevator(who, [x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }, isAtTop = false, isSmoothStop = false]) {
            if (!who) return
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
        },
        train(who) {
            if (who) who.autopilotDynamic = true //fast path-driven platforms must not be discarded as flying debris
        },
        spinner(pin) {
            if (pin?.bodyB) pin.bodyB.autopilotSpinner = true
        },
        doorMap(who) {
            if (!who) return
            who.autopilotDynamic = true //a map piece that moves
            autopilot.observeDoor(who)
        },
        door(who) {
            if (who) autopilot.observeDoor(who)
        },
        transport(who, [x, y, width, height]) { //a platform that goes back and forth between two stops, see trainStop()
            if (!who) return
            who.autopilotTransport = { width, height, nodes: [[], []], stops: null }
            autopilot.hook(who, "trainStop", run => function () { //it only goes between its stops while its level calls this
                this.autopilotTransport.cycle = simulation.cycle
                return run.apply(this, arguments)
            })
        },
        mover(who, args, cycle) { //a belt only carries the player on the cycles its level calls push()
            if (!who) return
            who.autopilotPushed ??= cycle
            autopilot.hook(who, "push", push => function () {
                this.autopilotPushed = simulation.cycle
                return push.apply(this, arguments)
            })
        },
        button(who) {
            if (who && autopilot.isUsefulTrigger("button", who)) autopilot.triggers.push({ kind: "button", obj: who, arrivedAt: 0 })
        },
        toggle(who) {
            if (who && autopilot.isUsefulTrigger("toggle", who)) autopilot.triggers.push({ kind: "toggle", obj: who, arrivedAt: 0 })
        },
        wind(zone) {
            if (zone) autopilot.winds.push(zone)
        },
        portal(pair) {
            if (!pair) return
            autopilot.portals.push(pair)
            for (const end of [pair[2], pair[3]]) if (end?.query) autopilot.hook(end, "query", run => function () {
                const before = player.isInPortal
                const result = run.apply(this, arguments)
                if (player.isInPortal === this.portalPair && before !== this.portalPair) autopilot.recordPortalExit(this.portalPair)
                return result
            })
        },
        hazard(who) {
            autopilot.hazards.push(who)
            autopilot.observeJumpZone(who, "query", { kind: "slime", bounds: who })
            autopilot.observeJumpZone(who, "heatQuery", { kind: "heat", bounds: who })
            for (const method of ["heatQuery", "heatWarning"]) autopilot.hook(who, method, run => function () {
                this.autopilotIsHeat = true
                return run.apply(this, arguments)
            })
        },
        laser(who, [p1, p2, damage = 0.12]) {
            if (!(damage > 0)) return
            const beam = { who, seen: -Infinity }
            if (!autopilot.lasers.length && !autopilot.hazards.length && autopilot.grid) autopilot.relinkAll()
            autopilot.lasers.push(beam)
            for (const method of ["query", "motionQuery"]) {
                autopilot.hook(who, method, run => function () {
                    if (!m.isTimeDilated && (method === "query" || this.countDown > 0)) beam.seen = simulation.cycle
                    return run.apply(this, arguments)
                })
            }
        },
        gravityZone(zone) {
            autopilot.observeJumpZone(zone, "do", { kind: "gravity", bounds: zone })
        },
        effectZone(zone, [bounds, { force = 0, angle = Math.PI / 2, drag = 0, who = "player body mob bullet powerUp" } = {}]) {
            if ((force || drag) && who.split(" ").includes("player")) {
                autopilot.observeJumpZone(zone, "do", { kind: "effect", bounds, ax: force * Math.cos(angle), ay: -force * Math.sin(angle), keep: Math.max(0, 1 - drag) })
            }
        },
    },
    newLevel() { //from level.start(), before the level is built, see watchLevel()
        autopilot.hooked.length = 0 //the last level's objects are gone
        autopilot.hazards.length = 0
        autopilot.lasers.length = autopilot.laserHazards.length = 0
        autopilot.jumpZones.length = 0
        autopilot.triggers.length = 0
        autopilot.portals.length = 0
        autopilot.winds.length = 0
        if (autopilot.isOn) autopilot.reset() //set(false) already reset it, so there's nothing to clear while it's off
    },
    set(isOn) {
        autopilot.isPending = false //see the stand in's set() in js/autopilot-loader.js
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
})
