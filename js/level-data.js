"use strict";
//local levels, levels saved as plain data instead of code, made in the level editor
//  levelData.play(data) builds one, level.load() calls it for local level names
//  levelData.store saves them in localStorage
//  levelData.capture(name) turns a written level into data, so the editor can start from it
//see docs/level-editor.md for the data format
const levelData = {
    format: 1, //bump when old data can't be read anymore, then convert it in levelData.normalize()
    nameMax: 40,

    //*********************************************************************
    // level data
    //*********************************************************************
    blank(name) { //enter and exit 1000 apart on one piece of ground
        return levelData.normalize({
            name,
            elements: [
                levelElements.create("spawn", { x: 0, y: -50 }),
                levelElements.create("exit", { x: 950, y: -20 }),
                levelElements.create("map", { x: -250, y: 0, width: 1500, height: 100 }),
            ],
        })
    },
    normalize(data) { //fills in anything missing, so the rest of the code can trust the data
        delete data.lineOfSight //retired editor setting; the game keeps its own line-of-sight setting
        data.format = levelData.format
        data.name = String(data.name || "untitled")
        const defaults = levelElements.level.defaults()
        for (const key of Object.keys(defaults)) {
            if (data[key] === undefined || data[key] === null || data[key] === "") data[key] = defaults[key]
        }
        data.zoom = Number(data.zoom) || defaults.zoom
        if (typeof data.levelCode !== "string") data.levelCode = "" //the level info box's code, see runLevelCode()
        for (const key of ["author", "log"]) if (typeof data[key] !== "string") data[key] = "" //not in level.defaults(), the typical level properties button keeps them
        if (!Array.isArray(data.mobVeto)) data.mobVeto = []
        data.elements = Array.isArray(data.elements) ? data.elements.filter(el => el && typeof el === "object" && typeof el.type === "string" && /^\w+$/.test(el.type)) : [] //a type is a name, the editor shows it
        const isId = id => Number.isInteger(id) && id > 0 //ids are whole numbers, the editor shows them, so an imported level can't put html there
        data.nextId = Math.max(isId(Number(data.nextId)) ? Number(data.nextId) : 1, ...data.elements.map(el => isId(el.id) ? el.id + 1 : 1))
        for (const el of data.elements) {
            if (el.type === "decor") el.type = "fill" //its old name
            if (el.type === "bezier") levelData.bezierToPath(el) //the path's curves do it now
            if (!isId(el.id)) el.id = data.nextId++
            levelElements.fillDefaults(el)
            for (const key of levelElements.refKeys(el)) if (!isId(el[key])) el[key] = null
            if (el.type === "powerUp" && !levelElements.types.powerUp.names.includes(el.name)) el.name = "heal"
            if (el.type === "namedMob" && !levelElements.mobNames().includes(el.name)) el.name = "starter"
            if ("veto" in el && !Array.isArray(el.veto)) el.veto = []
            if ("handles" in el && !Array.isArray(el.handles)) el.handles = []
            if (el.layer === "back" || el.layer === "front") el.layer = el.layer === "back" ? "under player" : "over player" //their old names
            if (el.edited) levelData.normalizeEdited(el)
        }
        if (data.elements.some(el => el.type === "drip")) levelData.dripsToCode(data) //drip isn't an element anymore
        for (const type of levelElements.groups.core) { //every level needs a spawn and an exit, unless its code sets them, like a written level that picks a layout
            if (!data.elements.some(el => el.type === type) && !levelData.hasCode(data)) levelData.add(data, levelElements.create(type))
        }
        return data
    },
    normalizeEdited(el) { //edited code's names go into the javascript as variable and argument names, so each has to be a plain name, or an imported level could hide code where importing doesn't show it
        const isName = name => typeof name === "string" && /^[A-Za-z_$][\w$]*$/.test(name)
        const edited = el.edited
        if (typeof edited !== "object") return delete el.edited
        edited.text = String(edited.text ?? "") //importing shows it before it can run
        if (!isName(edited.name)) delete edited.name
        const names = edited.names && typeof edited.names === "object" ? edited.names : {}
        edited.names = Object.fromEntries(Object.entries(names).filter(([id, name]) => /^[1-9]\d*$/.test(id) && isName(name)))
    },
    dripsToCode(data) { //older saves' drips, each one's lines go in the level code so it still drips
        const parts = data.levelCode.trim() ? levelData.sectionsOf(data.levelCode) : { setup: [], custom: [], top: [] }
        for (const el of data.elements.filter(el => el.type === "drip")) {
            const name = `drip${el.id}`
            const y = Number(el.y) || 0
            parts.setup.push(`const ${name} = level.drip(${levelElements.args(Number(el.x) || 0, y, y + (Number(el.length) || 600), Number(el.period) || 100, String(el.color || "hsla(160, 100%, 35%, 0.5)"))}); //was a drip element`)
            parts.custom.push(`${name}.draw();`)
        }
        data.levelCode = levelData.sectionsText(parts)
        data.elements = data.elements.filter(el => el.type !== "drip")
    },
    add(data, el) {
        el.id = data.nextId++
        data.elements.push(el)
        return el
    },
    find(data, id) {
        return data.elements.find(el => el.id === id)
    },
    copy(data) {
        return JSON.parse(JSON.stringify(data))
    },
    fallHeight(data) { //falling this far below the lowest part of the level sends the player back to the start
        let bottom = 0
        for (const el of data.elements) {
            const b = levelElements.bounds(el)
            if (b.y + b.height > bottom) bottom = b.y + b.height
        }
        return Math.max(3000, bottom + 1500)
    },

    //*********************************************************************
    // names, local levels share names with written levels in level.levels and the level pool
    //*********************************************************************
    isValidName(name) {
        return typeof name === "string" && name.length <= levelData.nameMax && /^[A-Za-z][\w-]*$/.test(name)
    },
    isWrittenLevel(name) {
        return typeof level.maps[name] === "function" || typeof moreLevels[name] === "function" ||
            level.communityLevels.includes(name) || level.trainingLevels.includes(name)
    },
    isNameFree(name) {
        return levelData.isValidName(name) && !levelData.isWrittenLevel(name) && !levelData.store.has(name)
    },
    nameProblem(name) { //why a name can't be used, or ""
        if (!levelData.isValidName(name)) return `names use letters, numbers, - and _, no spaces, start with a letter, and are up to ${levelData.nameMax} long`
        if (levelData.isWrittenLevel(name)) return "that's the name of one of the game's levels"
        if (levelData.store.has(name)) return "another local level has that name"
        return ""
    },
    freeName(base) { //base, base2, base3, ...
        base = String(base).replace(/[^\w-]/g, "").slice(0, levelData.nameMax - 3)
        if (!/^[A-Za-z]/.test(base)) base = "level" + base
        if (levelData.isNameFree(base)) return base
        for (let i = 2; ; i++) {
            if (levelData.isNameFree(base + i)) return base + i
        }
    },

    bezierToPath(el) { //an older save's bezier, one curved line from x, y to x2, y2 bent by cx1, cy1 and cx2, cy2, as a path with two curved vertices
        const center = { x: (el.x + el.x2) / 2, y: (el.y + el.y2) / 2 }
        const path = { x: center.x, y: center.y, vertices: [[el.x - center.x, el.y - center.y], [el.x2 - center.x, el.y2 - center.y]], handles: [[el.cx1 - el.x, el.cy1 - el.y], [el.x2 - el.cx2, el.y2 - el.cy2]], closed: false, fill: "none" }
        for (const key of ["x2", "y2", "cx1", "cy1", "cx2", "cy2", "edited"]) delete el[key] //its edited code was written for a bezier
        Object.assign(el, path, { type: "path" })
    },

    //*********************************************************************
    // playing, builds data into the world, each element's runtime remembers what it made so the editor can rebuild one at a time
    //*********************************************************************
    data: null, //the level being played
    isEditor: false,
    isSpawning: true, //mobs and power ups spawn when the level loads, in the editor only when spawn is on
    runtimes: new Map(), //element id: { custom, top, maps, bodies, cons, consBB, composite, constraints, error }
    play(data, options = {}) { //call inside level.start, like a written level, see level.load(), options: { isEditor, isSpawning }
        levelData.data = data
        levelData.isEditor = !!options.isEditor
        levelData.isSpawning = !levelData.isEditor || !!options.isSpawning
        levelData.unbuildAll() //clearMap already removed the last level's bodies, but not constraints in the world, like a spinner's pin
        levelData.runtimes = new Map()
        levelData.applySettings(data)
        if (data.author.trim()) simulation.inGameConsole(levelData.authorLog(data)) //like community levels
        if (data.log.trim()) simulation.inGameConsole(levelData.safeHtml(data.log)) //the level's own message
        levelData.trackEphemera(() => { }) //the last level code's effects go away, like mirrors
        levelData.codeLayers = null
        levelData.codeError = null //the last level's error doesn't carry into this one
        levelData.drawnByCode = levelData.hasCode(data) || data.levelCode.trim() ? levelData.codeDraws(data) : {}
        if (levelData.hasCode(data)) {
            levelData.runCode(data)
        } else {
            for (const el of levelData.inBuildOrder(data)) levelData.runtimes.set(el.id, levelData.build(el, false))
        }
        const has = text => levelData.codeHas(data, text) //what the level's code already does itself
        if (levelData.isSpawning && data.elements.some(el => el.type === "mobSpot")) spawn.randomMobFromArray(data.mobVeto) //mob spots, level.start() empties the list
        if (levelData.isSpawning && data.elements.some(el => levelElements.groups.mob.includes(el.type)) && !has("addResearchToLevel")) powerUps.addResearchToLevel() //like written levels, after the mobs spawn
        if (levelData.isSpawning && !has("announceText")) { //like written levels, the run's constraint below the entrance and the new mob types
            const text = levelData.constraintText(data)
            level.announceText(text.x, text.y, true)
            level.announceMobTypes()
        }
        simulation.fallHeight = levelData.fallHeight(data)
        levelData.runLevelCode(data)
        level.custom = () => {
            levelData.runCodeLayer("custom")
            levelData.layer("custom")
            levelData.runLevelCodeLayer("custom")
        }
        level.customTopLayer = () => {
            levelData.runCodeLayer("top")
            levelData.layer("top")
            levelData.runLevelCodeLayer("top")
        }
        if (!levelData.isEditor) simulation.zoomTransition(data.zoom)
    },
    //*********************************************************************
    // code elements, a level with code runs in its list order inside one function, like a written level
    //*********************************************************************
    hasCode(data) {
        return data.elements.some(el => levelElements.isCode(el))
    },
    codeText(data) { //all the level's own javascript: code elements and the level code
        return data.elements.filter(el => levelElements.isCode(el)).map(el => el.code).concat(data.levelCode || "").join("\n")
    },
    codeHas(data, text) {
        return levelData.codeText(data).includes(text)
    },
    codeDraws(data) { //door types the level's code draws itself, so their elements don't draw them again
        return { spawn: levelData.codeHas(data, "level.enter.draw"), exit: levelData.codeHas(data, "level.exit.drawAndCheck") }
    },
    codeParts(data) { //every piece of javascript the level runs, [{ where, code }]: code elements, elements with edited code, and the level code, importing asks before running any
        const parts = []
        for (const el of data.elements) {
            if (levelElements.isCode(el)) {
                if (String(el.code).trim()) parts.push({ where: `code #${el.id}`, code: String(el.code) })
            } else if (el.edited) {
                parts.push({ where: `${levelElements.nameOf(el.type)} #${el.id}, edited code`, code: String(el.edited.text) })
            }
        }
        if (String(data.levelCode || "").trim()) parts.push({ where: "level code", code: String(data.levelCode) })
        return parts
    },
    runsCode: data => levelData.codeParts(data).length > 0,
    riskyCode: /\b(?:localStorage|sessionStorage|indexedDB|localSettings|saveGame|levelData|cookie|fetch|XMLHttpRequest|WebSocket|sendBeacon|EventSource|location|eval|Function|constructor|globalThis|window|innerHTML|outerHTML|insertAdjacentHTML|createElement|import)\b/g,
    codeFlags(text) { //names in code worth a close look before running it: what it could use to change saves, reach the internet, or change the page, not a complete list
        return [...new Set(String(text).match(levelData.riskyCode) || [])]
    },
    withoutCode(data) { //a copy without its javascript: no code elements or level code, and edited elements go back to what their settings make
        const copy = levelData.copy(data)
        copy.elements = copy.elements.filter(el => !levelElements.isCode(el))
        for (const el of copy.elements) delete el.edited
        copy.levelCode = ""
        return levelData.normalize(copy) //a spawn and exit, if its code made them
    },
    //*********************************************************************
    // saved data, level code can read saves and settings but not change them
    // a level's javascript is made inside a function whose arguments are read-only stand-ins for localStorage, sessionStorage, and localSettings, and no indexedDB
    // only the level's own code sees them, so the game's own saving still works, even when level code calls it
    // community levels from level2.js are made again from their source the same way, see communityLevel()
    // it stops code that changes saves plainly, like a settings line in a community map, not code written to get around it, the import warning is for that
    //*********************************************************************
    codeFunction(params, body) { //Function(...params, body) for a level's javascript, with the read-only stand-ins, see codeGlobals()
        Function(...params, body) //read alone first: code that can't be read throws a SyntaxError here, and its brackets can't close the function below early
        const globals = levelData.codeGlobals()
        const names = Object.keys(globals)
        return Function(...names, `return function (${params.join(", ")}) {${body}\n}`)(...names.map(name => globals[name]))
    },
    codeGlobals() { //what level code sees in place of the game's saved data
        const storage = name => { //reading localStorage throws when the browser blocks it
            try {
                return globalThis[name]
            } catch (error) {
                return undefined
            }
        }
        return {
            localStorage: levelData.readOnly(storage("localStorage"), "localStorage", true),
            sessionStorage: levelData.readOnly(storage("sessionStorage"), "sessionStorage", true),
            localSettings: levelData.readOnly(typeof localSettings === "undefined" ? undefined : localSettings, "localSettings"),
            indexedDB: undefined,
        }
    },
    readOnlies: new WeakMap(), //each object's read-only stand-in, so the same object is always the same stand-in
    readOnly(value, name, isStorage = false) { //value and everything in it can be read, changing any of it throws in the editor and does nothing in a run
        if (value === null || typeof value !== "object") return value
        if (levelData.readOnlies.has(value)) return levelData.readOnlies.get(value)
        const refuse = () => {
            if (levelEditor.isActive) throw new Error(`level code can't change ${name}`) //shows in the info box and the issues
            if (!levelData.refused.has(name)) console.warn(`level code can't change ${name}`) //a run keeps going without the change
            levelData.refused.add(name)
            return true
        }
        const proxy = new Proxy(value, {
            get(target, key) {
                if (isStorage && ["setItem", "removeItem", "clear"].includes(key)) return refuse
                const got = Reflect.get(target, key)
                if (isStorage && typeof got === "function") return got.bind(target) //storage's methods only work on the real storage
                return levelData.readOnly(got, name)
            },
            set: refuse,
            deleteProperty: refuse,
            defineProperty: refuse,
            setPrototypeOf: refuse,
        })
        levelData.readOnlies.set(value, proxy)
        return proxy
    },
    refused: new Set(), //what level code tried to change in a run, warned about once
    communityLevels: new Map(), //name: the community level made again from its source, see communityLevel()
    communityLevel(name) { //a community level from level2.js, made again from its own source so its code gets the read-only stand-ins, level.load() runs it
        if (!levelData.communityLevels.has(name)) {
            const original = moreLevels[name]
            const source = original.toString()
            let made = original
            try {
                made = Object.values(levelData.codeFunction([], `"use strict";\nreturn { ${source} }`)()).find(value => typeof value === "function") || original //name() { ... }
            } catch (error) {
                console.error(`community level ${name} runs without read-only saves:`, error) //written some other way, it still runs
            }
            levelData.communityLevels.set(name, made)
        }
        return levelData.communityLevels.get(name)
    },
    isSkipped: () => false, //the editor hides elements from its explorer by not building them while editing
    codeLayers: null, //{ custom, top } the level.custom and level.customTopLayer the level's code set
    drawnByCode: {}, //door types its code draws, see codeDraws()
    codeError: null,
    runCode(data) { //every element in order, code runs as written and the other elements build where they are in the list
        const marks = new Map()
        let chunk = null //the code element running, to blame for an error
        const api = {
            build(id) {
                const el = levelData.find(data, id)
                levelData.runtimes.set(id, levelData.build(el, false))
            },
            start(id) {
                chunk = id
                marks.set(id, levelData.mark())
            },
            end(id) {
                levelData.runtimes.set(id, { ...levelData.made(marks.get(id)), isCode: true })
                chunk = null
            },
        }
        const source = data.elements.map(el => levelElements.isCode(el) ? `__level.start(${el.id});\n${el.code}\n;__level.end(${el.id});` : `__level.build(${el.id});`).join("\n")
        level.custom = () => { }
        level.customTopLayer = () => { }
        levelData.codeError = null
        try {
            const spawned = { mob: mob.length, powerUp: powerUp.length }
            try {
                levelData.trackEphemera(() => levelData.codeFunction(["__level"], `"use strict";\n${source}`).call(level, api))
            } finally {
                if (!levelData.isSpawning) levelData.removeSpawned(spawned)
            }
        } catch (error) { //the elements after the error don't get made
            console.error(chunk ? `code #${chunk}:` : "level code:", error)
            levelData.codeError = error
            if (chunk) levelData.runtimes.set(chunk, { ...levelData.made(marks.get(chunk)), isCode: true, error })
        }
        levelData.codeLayers = { custom: level.custom, top: level.customTopLayer }
    },
    //*********************************************************************
    // level code, data.levelCode, the level info box's code, it runs last, after everything else is made, like the end of a written level
    // written like an element's edited code: setup lines, then //level.custom and //level.customTopLayer and their lines, which run each frame after the elements'
    //*********************************************************************
    levelCodeRuntime: null, //{ maps, bodies, ..., custom, top } what it made and its layers
    runLevelCode(data) { //an error while it runs is the level's code error
        if (levelData.levelCodeRuntime) levelData.unbuild(levelData.levelCodeRuntime)
        levelData.levelCodeRuntime = null
        if (!data.levelCode.trim()) return
        const start = levelData.mark()
        const spawned = { mob: mob.length, powerUp: powerUp.length }
        const before = new Set(simulation.ephemera)
        let layers = {}
        try {
            layers = levelData.editedFunction(data.levelCode).call(level) || {}
        } catch (error) {
            console.error("level code:", error)
            levelData.codeError = error
        } finally {
            levelData.codeEphemera.push(...simulation.ephemera.filter(effect => !before.has(effect))) //its effects go away when it runs again, like code elements'
            if (!levelData.isSpawning) levelData.removeSpawned(spawned)
        }
        levelData.levelCodeRuntime = { ...levelData.made(start), custom: layers.custom, top: layers.top }
    },
    runLevelCodeLayer(name) { //an error stops only that layer
        const runtime = levelData.levelCodeRuntime
        if (!runtime || !runtime[name]) return
        try {
            runtime[name]()
        } catch (error) {
            runtime[name] = null
            console.error(`level code ${name === "top" ? "customTopLayer" : "custom"}:`, error)
            levelData.codeError = error
            if (levelData.onError) levelData.onError()
        }
    },
    runCodeLayer(name) { //the level code's level.custom or customTopLayer, an error doesn't stop the level
        const layers = levelData.codeLayers
        if (!layers) return
        try {
            layers[name]()
        } catch (error) {
            const isNew = !levelData.codeError
            if (isNew) console.error(`level code ${name === "top" ? "customTopLayer" : "custom"}:`, error) //once, it would repeat every cycle
            levelData.codeError = error
            if (isNew && levelData.onError) levelData.onError()
        }
    },
    codeEphemera: [], //effects the level's code started, like mirrors, removed when it runs again
    trackEphemera(run) { //the editor runs a level's code again without changing levels, so its effects don't pile up
        simulation.ephemera = simulation.ephemera.filter(effect => !levelData.codeEphemera.includes(effect))
        const before = new Set(simulation.ephemera)
        try {
            run()
        } finally {
            levelData.codeEphemera = simulation.ephemera.filter(effect => !before.has(effect))
        }
    },
    removeSpawned(start) { //while editing, the mobs and power ups the level's code spawned go away, like the elements' don't spawn, its code can still use them
        const mobs = mob.slice(start.mob)
        for (const who of mobs.concat(powerUp.slice(start.powerUp))) Composite.remove(engine.world, who)
        mob.length = start.mob
        powerUp.length = start.powerUp
        const isGone = who => mobs.includes(who)
        consBB = consBB.filter(c => { //groups of mobs are held together
            const isMob = isGone(c.bodyA) || isGone(c.bodyB)
            if (isMob) Composite.remove(engine.world, c)
            return !isMob
        })
    },
    mark() { //how long the lists are, made() is what was added since
        return { map: map.length, body: body.length, cons: cons.length, consBB: consBB.length, composite: composite.length, constraints: engine.world.constraints.length }
    },
    made(start) {
        return {
            maps: map.slice(start.map),
            bodies: body.slice(start.body),
            cons: cons.slice(start.cons),
            consBB: consBB.slice(start.consBB),
            composite: composite.slice(start.composite),
            constraints: engine.world.constraints.slice(start.constraints),
        }
    },
    authorLog: data => `<strong>${levelData.escape(data.name)}</strong> by <span class='color-var'>${levelData.escape(data.author.trim())}</span>`, //what community levels log when they load, the author is plain text
    authorLine: /^simulation\.inGameConsole\(`<strong>[^<`]*<\/strong> by <span class=['"]color-var['"]>([^<`]*)<\/span>`\)$/, //that line in a written level's source, capture() reads the author from it
    authorOf(source) { //the author a written level logs, or ""
        for (const line of levelData.scanLines(source)) {
            const match = (line.comment === -1 ? line.text : line.text.slice(0, line.comment)).trim().replace(/;$/, "").match(levelData.authorLine)
            if (match) return levelData.unescape(match[1].trim()) //html in the source, plain text in the level
        }
        return ""
    },
    escape: text => String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), //plain text in html
    unescape: text => String(text).replace(/&(amp|lt|gt|quot|#39);/g, (all, name) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[name]),
    safeTag: /^<\/?(?:b|strong|i|em|u|s|br|span|sub|sup|small|code)(?:\s+(?:class|data-help)\s*=\s*(?:"[\w\s-]*"|'[\w\s-]*')|\s+style\s*=\s*(?:"[\w\s#%.,:;()-]*"|'[\w\s#%.,:;()-]*'))*\s*\/?>/i, //a formatting tag, with only class, data-help, or a plain style
    safeHtml(text) { //a log's html, it can't run javascript: formatting tags like <b>, <br>, and the game's color-var spans stay, any other < shows as text
        return String(text).replace(/<[^<]*/g, part => levelData.safeTag.test(part) ? part : `&lt;${part.slice(1)}`)
    },
    applySettings(data) { //the level properties, simulation.clearMap() sets them back for the next level
        level.defaultZoom = data.zoom
        document.body.style.backgroundColor = data.background
        color.map = data.mapColor
        color.block = data.blockColor
        simulation.g = simulation.gDefault * data.gravity
        level.fallMode = data.fall === "sky" ? "start" : ""
    },
    constraintText(data) { //where the run's constraint text shows, the level properties move it from the spawn
        const spawn = data.elements.find(el => el.type === "spawn") || { x: 0, y: 0 }
        return { x: spawn.x + data.constraintTextX, y: spawn.y + data.constraintTextY }
    },
    onError: null, //called when an element or the level's code throws while running, the editor recounts its issues
    linkState(el, depth = 0) { //true while the button, toggle, zone, or timer el is linked to is on, false while off, null without one
        const sourceState = id => {
            const from = levelData.find(levelData.data, id)
            const runtime = from && levelElements.isLinkSource(from) && levelData.runtimes.get(from.id)
            if (!runtime) return null
            const own = runtime.linkOn ? runtime.linkOn() : levelElements.types[from.type].linkOn(from, runtime) //edited code's own check, see buildEdited()
            const above = depth < 8 ? levelData.linkState(from, depth + 1) : null //a link source linked to another is only on while both are, like a timer that only runs while a button is down
            return above === false ? false : own
        }
        const a = el.link ? sourceState(el.link) : null
        const b = el.orLink ? sourceState(el.orLink) : null //linked to two, it's on while either is
        if (a === null) return b
        if (b === null) return a
        return a || b
    },
    linkOn(el) { //linkState() for el, flipped if it runs while its link is off, null without one
        const state = levelData.linkState(el)
        if (state === null) return null
        return el.runs === "while off" ? !state : state
    },
    inBuildOrder(data) { //spawn first, other elements can use the player's position, mobs and power ups last, they land on the map
        if (levelData.hasCode(data)) return data.elements.slice() //code runs in order, see runCode()
        const order = levelElements.buildOrder
        const rank = el => {
            const group = levelElements.types[el.type]?.group
            return group ? order.indexOf(group) : order.length
        }
        return data.elements.slice().sort((a, b) => rank(a) - rank(b)) //sort keeps the list order inside each group
    },
    layer(name) { //runs each element's custom or top, in the order the elements are listed
        const isTimed = levelData.isEditor //the editor's analysis shows what each element costs a frame, runtime.customMs and runtime.topMs
        for (const el of levelData.data.elements) {
            const runtime = levelData.runtimes.get(el.id)
            if (!runtime || !runtime[name]) continue
            const type = levelElements.types[el.type]
            if (levelData.drawnByCode[el.type]) continue //the level's code draws it
            if ((el.link || el.orLink) && type.isLinkable && !type.handlesLink && levelData.linkOn(el) === false) continue //its button has it off
            const start = isTimed ? performance.now() : 0
            try {
                runtime[name]()
            } catch (error) { //one broken element shouldn't stop the level
                runtime[name] = null
                runtime.error = error
                console.error(`${el.type} #${el.id}:`, error)
                if (levelData.onError) levelData.onError() //the editor's issues count, an error while running comes after the last count
            }
            if (isTimed) runtime[name + "Ms"] = 0.97 * (runtime[name + "Ms"] || 0) + 0.03 * (performance.now() - start) //averaged, a single frame's time is too coarse
        }
    },
    build(el, isLive) { //isLive: the level has already started, so map bodies are added to the world here instead of in level.addToWorld()
        const type = levelElements.types[el.type]
        const start = levelData.mark()
        let runtime
        try {
            if (!type) throw new Error(`unknown element type: ${el.type}`)
            const options = { isLive, isEditor: levelData.isEditor, isSpawning: levelData.isSpawning && !isLive }
            runtime = levelData.isSkipped(el) ? {} : el.edited ? levelData.buildEdited(el, options) : type.build(el, options) || {} //hidden in the editor's explorer, or its edited code
        } catch (error) {
            runtime = { error }
            if (!error.isUnfinished) console.error(`${el.type} #${el.id}:`, error) //an unfinished element, like a constraint with no block yet, only shows in the inspector and the issues
        }
        Object.assign(runtime, levelData.made(start)) //anything added while building belongs to this element, so the level.* helpers can be used as they are
        if (isLive) {
            for (const who of runtime.maps) { //like level.addToWorld()
                who.collisionFilter.category = cat.map
                who.collisionFilter.mask = who.collisionMask ?? (cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet)
                Matter.Body.setStatic(who, true)
                Composite.add(engine.world, who)
            }
        }
        return runtime
    },
    //*********************************************************************
    // edited code, an element's code changed in the editor's info box: el.edited = { name, text }
    // text is like the info box's code: setup lines, then //level.custom and //level.customTopLayer and their lines, name is the variable name it was written with
    // it runs instead of what the element's settings make, a link still turns it on and off, see levelElements.isCodeEditable()
    //*********************************************************************
    sectionsOf(text) { //{ setup, custom, top } lines
        const sections = { setup: [], custom: [], top: [] }
        let section = sections.setup
        for (const line of String(text).split("\n")) {
            if (line.trim().startsWith("//level.customTopLayer")) section = sections.top //anything after it on the line is a comment
            else if (line.trim().startsWith("//level.custom")) section = sections.custom
            else section.push(line)
        }
        return sections
    },
    sectionsText({ setup = [], custom = [], top = [] }) {
        const zones = levelData.zones
        const isHeaded = !(custom.length || top.length) || setup[0]?.trim().startsWith(zones.setup) //only code with a part that repeats says which part runs once
        return [...(isHeaded ? [] : [zones.setup]), ...setup, ...(custom.length ? [zones.custom, ...custom] : []), ...(top.length ? [zones.top, ...top] : [])].join("\n")
    },
    zones: { //the comment lines that start each part of edited code, the level code, and the info box's code, sectionsOf() reads the //level.custom and //level.customTopLayer at their start
        setup: "//runs once when the level starts",
        custom: "//level.custom: runs every game cycle", //drawn under the player
        top: "//level.customTopLayer: runs every game cycle", //drawn over the player
    },
    typeCode(el, name, context) { //an element's { setup, custom, top } for export: its edited code with its variable name now, and the names of the elements it names now, or what its type writes
        if (!el.edited) return levelElements.types[el.type].code(el, name, context)
        const renames = new Map()
        if (name && el.edited.name && name !== el.edited.name) renames.set(el.edited.name, name)
        for (const [id, old] of Object.entries(el.edited.names || {})) {
            const now = context && context.nameOf(Number(id))
            if (now && now !== old) renames.set(old, now)
        }
        const text = renames.size ? el.edited.text.replace(new RegExp(`\\b(${[...renames.keys()].join("|")})\\b`, "g"), old => renames.get(old)) : el.edited.text //all at once, so two names can swap
        return levelData.sectionsOf(text)
    },
    editedRefs(data, el) { //ids of the elements an element's code names: what its refs point at, like a door's button or a constraint's block, and what those buttons are linked to
        const ids = []
        const add = (id, depth) => {
            const other = id && levelData.find(data, id)
            if (!other || ids.includes(id) || depth > 8) return
            ids.push(id)
            if (levelElements.isLinkSource(other)) for (const key of ["link", "orLink"]) add(other[key], depth + 1)
        }
        for (const key of levelElements.refKeys(el)) add(el[key], 0)
        return ids
    },
    editedFunction(text, refNames = [], selfName = "") { //one function that runs the setup and returns the layers, making it throws a SyntaxError if the code can't be read, without running any of it
        //refNames are its arguments, the other elements its code names, selfName is the element's own variable, returned so a link source's code can be checked
        const { setup, custom, top } = levelData.sectionsOf(text)
        const layer = lines => lines.some(line => line.trim()) ? `() => {\n${lines.join("\n")}\n}` : "null"
        const self = selfName ? `, self: typeof ${selfName} === "undefined" ? undefined : ${selfName}` : ""
        return levelData.codeFunction(refNames, `"use strict";\n${setup.join("\n")}\nreturn { custom: ${layer(custom)}, top: ${layer(top)}${self} }`)
    },
    editedRef(id) { //what edited code gets for another element it names: a link source's object, looked up each time it's used since it can be rebuilt, or a block's body
        const other = levelData.find(levelData.data, id)
        if (other && levelElements.isLinkSource(other)) {
            const self = () => {
                const runtime = levelData.runtimes.get(id)
                return runtime && (runtime.self || runtime[other.type]) //like runtime.button, or its own edited code's
            }
            return new Proxy({}, {
                get(target, key) {
                    const who = self()
                    const value = who && who[key]
                    return typeof value === "function" ? value.bind(who) : value
                },
                set(target, key, value) {
                    const who = self()
                    if (who) who[key] = value
                    return true
                },
            })
        }
        const runtime = levelData.runtimes.get(id)
        return runtime ? runtime.bodies[0] || runtime.maps[0] : undefined
    },
    buildEdited(el, options) { //like a type's build(), its custom and top run each frame, mobs and power ups only spawn when they would
        const type = levelElements.types[el.type]
        if ((type?.group === "mob" || type?.group === "powerUp") && !options.isSpawning) return {}
        const refs = Object.entries(el.edited.names || {})
        const selfName = type?.linkOn && el.edited.name ? el.edited.name : ""
        const layers = levelData.editedFunction(el.edited.text, refs.map(([, name]) => name), selfName).call(level, ...refs.map(([id]) => levelData.editedRef(Number(id))))
        const runtime = { custom: layers.custom, top: layers.top }
        if (selfName) { //a link source, on when its code's object is, like button1.isUp is off
            const on = Function(selfName, `return ${type.linkCode(el, selfName).on}`)
            runtime.self = layers.self
            runtime.linkOn = () => layers.self === undefined ? null : !!on(layers.self)
        }
        return runtime
    },
    unbuild(runtime) {
        if (!runtime) return
        const removeFrom = (list, who) => {
            const index = list.indexOf(who)
            if (index !== -1) list.splice(index, 1)
        }
        for (const who of runtime.bodies.concat(runtime.maps)) {
            if (m.holdingTarget === who) m.drop()
            if (lastTouchedBlock === who) lastTouchedBlock = null
            Composite.remove(engine.world, who)
            removeFrom(body, who)
            removeFrom(map, who)
        }
        for (const who of runtime.cons) removeFrom(cons, who)
        for (const who of runtime.consBB) removeFrom(consBB, who)
        for (const who of runtime.composite) removeFrom(composite, who)
        for (const who of runtime.cons.concat(runtime.consBB, runtime.composite, runtime.constraints)) Composite.remove(engine.world, who)
        if (runtime.remove) runtime.remove()
    },
    rebuild(ids) { //rebuild elements after they change, ids that aren't in the data anymore are just removed, "all" rebuilds everything
        const data = levelData.data
        if (ids === "all") ids = [...new Set([...levelData.runtimes.keys(), ...data.elements.map(el => el.id)])]
        const changed = new Set(ids) //constraints hold bodies, so they're rebuilt after what they hold
        for (const el of data.elements) {
            if (levelElements.types[el.type]?.rebuildWithRefs && levelElements.refKeys(el).some(key => changed.has(el[key]))) changed.add(el.id)
        }
        const elements = new Map(data.elements.map(el => [el.id, el]))
        const order = new Map(levelData.inBuildOrder(data).map((el, i) => [el.id, i]))
        ids = [...changed].sort((a, b) => (order.has(a) ? order.get(a) : -1) - (order.has(b) ? order.get(b) : -1)) //removed ones first
        let isMapChanged = false
        for (const id of ids) {
            const old = levelData.runtimes.get(id)
            if (old) {
                if (old.maps.length) isMapChanged = true
                levelData.unbuild(old)
                levelData.runtimes.delete(id)
            }
            const el = elements.get(id)
            if (!el) continue
            const runtime = levelData.build(el, true)
            if (runtime.maps.length) isMapChanged = true
            levelData.runtimes.set(id, runtime)
        }
        simulation.fallHeight = levelData.fallHeight(data)
        if (isMapChanged) simulation.draw.setPaths()
    },
    unbuildAll() {
        for (const runtime of levelData.runtimes.values()) levelData.unbuild(runtime)
        levelData.runtimes = new Map()
        if (levelData.levelCodeRuntime) levelData.unbuild(levelData.levelCodeRuntime)
        levelData.levelCodeRuntime = null
    },
    runtimeContains(id, point) { //the element's bodies, blocks can be pushed away from where they start
        const runtime = levelData.runtimes.get(id)
        if (!runtime) return false
        return Matter.Query.point(runtime.maps, point).length > 0 || Matter.Query.point(runtime.bodies, point).length > 0
    },

    //*********************************************************************
    // code, the level written as a level.maps function, to paste into js/level.js
    //*********************************************************************
    functionName(name) { //my-level to myLevel
        return name.replace(/[-_]+(\w)/g, (match, letter) => letter.toUpperCase()).replace(/\W/g, "")
    },
    codeNames(data) { //each element's variable name, like door1, and the context code(el, name, context) gets
        const counts = {}
        const names = new Map() //element id: its variable name
        const codeText = levelData.codeText(data)
        for (const el of data.elements) {
            const type = levelElements.types[el.type]
            if (!type || !type.code || type.codeAll || type.isCode) continue
            let name
            do { //not a name the level's code already uses
                counts[el.type] = (counts[el.type] || 0) + 1
                name = `${levelData.functionName(el.type)}${counts[el.type]}`
            } while (new RegExp(`\\b${name}\\b`).test(codeText))
            names.set(el.id, name)
        }
        const referenced = new Set(data.elements.flatMap(el => levelElements.refKeys(el).map(key => el[key])).filter(id => names.has(id)))
        const sourceCode = (el, depth) => { //{ on, off } for what el is linked to, a link source's own link has to be on too, and its orLink is either one
            const codeOf = id => {
                const from = levelData.find(data, id)
                if (!from || !levelElements.isLinkSource(from)) return null
                const own = levelElements.types[from.type].linkCode(from, names.get(from.id))
                const above = depth < 8 ? sourceCode(from, depth + 1) : null
                if (!above) return own
                const on = `${own.on} && ${above.on.includes("||") ? `(${above.on})` : above.on}`
                return { on, off: `!(${on})` }
            }
            const a = el.link ? codeOf(el.link) : null
            const b = el.orLink ? codeOf(el.orLink) : null
            if (!a || !b) return a || b
            const on = `${a.on} || ${b.on}`
            return { on, off: `!(${on})` }
        }
        const context = { //for code(el, name, context)
            data,
            nameOf: id => names.get(id),
            isReferenced: id => referenced.has(id),
            link(el) { //javascript for when el is on and off, from its button, toggle, zone, or timer, and what that's linked to
                const code = sourceCode(el, 0)
                if (!code) return null
                return el.runs === "while off" ? { on: code.off, off: code.on } : code
            },
        }
        return { names, context }
    },
    exportElement(el, name, context) { //one element's generated lines, including its control links
        const type = levelElements.types[el.type]
        const lines = levelData.typeCode(el, name, context)
        const link = type.isLinkable && !type.handlesLink && context.link(el)
        const gate = list => link && list.length ? [`if (${link.on}) {`, ...list.map(line => "    " + line), "}"] : list
        return { setup: lines.setup || [], custom: gate(lines.custom || []), top: gate(lines.top || []) }
    },
    elementCode(data, el) { //the lines one element writes in export JS, for the inspector's js view
        const type = levelElements.types[el.type]
        if (!type) return "//unknown type"
        if (type.isCode) return el.code
        const { names, context } = levelData.codeNames(data)
        const lines = type.codeAll ? { setup: type.codeAll(data.elements.filter(other => other.type === el.type), data), custom: [], top: [] } : levelData.exportElement(el, names.get(el.id), context)
        return levelData.sectionsText(lines)
    },
    code(data) {
        const groups = {}
        const custom = []
        const top = []
        const together = new Map() //types with codeAll(elements) write all their elements at once, like mob spots in one list
        const { names, context } = levelData.codeNames(data)
        if (levelData.hasCode(data)) return levelData.codeInOrder(data, names, context)
        for (const el of data.elements) {
            const type = levelElements.types[el.type]
            if (type && type.codeAll) {
                if (!together.has(type)) together.set(type, [])
                together.get(type).push(el)
                continue
            }
            if (!type || !type.code) continue
            const lines = levelData.exportElement(el, names.get(el.id), context)
            if (!groups[type.group]) groups[type.group] = []
            groups[type.group].push(...(lines.setup || []))
            custom.push(...lines.custom)
            top.push(...lines.top)
        }
        for (const [type, elements] of together) {
            if (!groups[type.group]) groups[type.group] = []
            groups[type.group].unshift(...type.codeAll(elements, data))
        }
        const indent = lines => lines.map(line => "    " + line)
        const fallHeight = levelData.fallHeight(data)
        const name = levelData.functionName(data.name)
        return [
            `${name}() { //made in the level editor, paste it into level.maps in js/level.js and add "${name}" to level.playableLevels`,
            ...indent([
                ...(groups.core || []),
                ...levelData.exportAnnouncements(data),
                `level.announceText(${levelElements.args(levelData.constraintText(data).x, levelData.constraintText(data).y)}, true) //the run's constraint`,
                "level.announceMobTypes()",
                `level.defaultZoom = ${data.zoom}`,
                "simulation.zoomTransition(level.defaultZoom)",
                `document.body.style.backgroundColor = ${JSON.stringify(data.background)};`,
                ...(data.mapColor !== "#444" ? [`color.map = ${JSON.stringify(data.mapColor)};`] : []),
                ...(data.blockColor !== levelElements.level.defaults().blockColor ? [`color.block = ${JSON.stringify(data.blockColor)};`] : []),
                ...(data.gravity !== 1 ? [`simulation.g = simulation.gDefault * ${levelElements.args(data.gravity)} //clearMap sets it back for the next level`] : []),
                ...(data.fall === "sky" ? [`level.fallMode = "start"; //falling keeps going from the sky`] : []),

                ...(fallHeight !== 3000 ? [`simulation.fallHeight = ${fallHeight}`] : []),
                ...(groups.element || []),
                "",
                "level.custom = () => {",
                ...indent(custom),
                "};",
                "level.customTopLayer = () => {",
                ...indent(top),
                "};",
                "",
                ...(groups.shape || []),
                ...(groups.constraint || []),
                ...(groups.mob || []),
                ...(groups.powerUp || []),
                ...(groups.mob ? ["powerUps.addResearchToLevel() //needs to run after mobs are spawned"] : []),
                ...levelData.exportLevelCode(data),
                `${levelData.dataMark}${JSON.stringify(data).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")}`, //import level reads this back
            ]),
            "},",
        ].join("\n").replace(/^\s+$/gm, "")
    },

    exportAnnouncements(data) {
        return [
            ...(data.author.trim() ? [`simulation.inGameConsole(\`${levelData.authorLog(data).replace(/[`\\]|\$\{/g, c => "\\" + c)}\`);`] : []),
            ...(data.log.trim() ? [`simulation.inGameConsole(${levelElements.args(levelData.safeHtml(data.log))});`] : []),
        ]
    },
    exportLevelCode(data) { //its setup and two layers share a private scope, just like runLevelCode
        if (!data.levelCode.trim()) return []
        const { setup, custom, top } = levelData.sectionsOf(data.levelCode)
        const lines = ["", "//level code", ";(() => {", ...setup.map(line => "    " + line)]
        for (const [layer, body] of [["custom", custom], ["customTopLayer", top]]) {
            if (!body.length) continue
            lines.push(`    level.${layer} = ((before, after) => () => { before(); after(); })(level.${layer}, () => {`, ...body.map(line => "        " + line), "    });")
        }
        return lines.concat("})();")
    },
    codeInOrder(data, names, context) { //a level with code, everything in its list order like runCode(), the elements' custom and top run after the code's
        const lines = []
        const custom = []
        const top = []
        const together = new Set()
        const draws = levelData.codeDraws(data)
        for (const el of data.elements) {
            const type = levelElements.types[el.type]
            if (!type) continue
            if (type.isCode) {
                lines.push(...el.code.split("\n"))
                continue
            }
            if (type.codeAll) { //all of them where the first one is
                if (!together.has(type)) lines.push(...type.codeAll(data.elements.filter(other => other.type === el.type), data))
                together.add(type)
                continue
            }
            if (!type.code) continue
            const out = levelData.exportElement(el, names.get(el.id), context)
            lines.push(...(out.setup || []))
            if (draws[el.type]) continue //the level's code draws it
            custom.push(...out.custom)
            top.push(...out.top)
        }
        const has = text => levelData.codeHas(data, text)
        const text = levelData.constraintText(data)
        const indent = list => list.map(line => "    " + line)
        const name = levelData.functionName(data.name)
        const hasMobs = data.elements.some(el => levelElements.groups.mob.includes(el.type))
        return [
            `${name}() { //made in the level editor, paste it into level.maps in js/level.js and add "${name}" to level.playableLevels`,
            ...indent([
                ...levelData.exportAnnouncements(data),
                ...lines,
                "",
                "//level properties from the level editor", //after the code, so changing them in the editor wins
                `level.defaultZoom = ${data.zoom}`,
                "simulation.zoomTransition(level.defaultZoom)",
                `document.body.style.backgroundColor = ${JSON.stringify(data.background)};`,
                `color.map = ${JSON.stringify(data.mapColor)};`,
                `color.block = ${JSON.stringify(data.blockColor)};`,
                ...(data.gravity !== 1 ? [`simulation.g = simulation.gDefault * ${levelElements.args(data.gravity)}`] : []),
                ...(data.fall === "sky" ? [`level.fallMode = "start";`] : []),
                `simulation.fallHeight = ${levelData.fallHeight(data)}`,
                ...(has("announceText") ? [] : [`level.announceText(${levelElements.args(text.x, text.y)}, true)`, "level.announceMobTypes()"]),
                ...(hasMobs && !has("addResearchToLevel") ? ["powerUps.addResearchToLevel() //needs to run after mobs are spawned"] : []),
                ...(custom.length || top.length ? [
                    "const customFromCode = level.custom",
                    "const customTopLayerFromCode = level.customTopLayer",
                    "level.custom = () => {",
                    ...indent(["customFromCode();", ...custom]),
                    "};",
                    "level.customTopLayer = () => {",
                    ...indent(["customTopLayerFromCode();", ...top]),
                    "};",
                ] : []),
                ...levelData.exportLevelCode(data),
                `${levelData.dataMark}${JSON.stringify(data).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")}`, //import level reads this back
            ]),
            "},",
        ].join("\n").replace(/^\s+$/gm, "")
    },
    dataMark: "//level editor: ",
    dataOf(text) { //the data on export's level editor line, or null without one, nothing runs
        const line = String(text).split("\n").find(row => row.trim().startsWith(levelData.dataMark.trim()))
        return line ? levelData.normalize(JSON.parse(line.trim().slice(levelData.dataMark.trim().length))) : null
    },
    fromText(text) { //{ data, isCaptured } from export JS, its level editor line if it has one, or the map and blocks its code makes, which runs it, the editor asks first
        const data = levelData.dataOf(text)
        if (data) return { data, isCaptured: false }
        const source = String(text).trim().replace(/,\s*$/, "")
        let maps
        try {
            maps = levelData.codeFunction([], `return { ${source} }`)() //a level.maps function, name() { ... }
        } catch (error) {
            maps = levelData.codeFunction([], `return { imported() { ${source} } }`)() //or just what goes inside one
        }
        const fn = Object.values(maps).find(value => typeof value === "function")
        if (!fn) throw new Error("no level function")
        const name = "levelEditorImport"
        level.maps[name] = fn
        try {
            return { data: levelData.capture(name), isCaptured: true }
        } finally {
            delete level.maps[name]
        }
    },
    sourceData(text) { //a written level's code as data without running any of it, its code stays code elements, the zoom and colors are the defaults, see fromSource()
        const source = String(text).trim().replace(/,\s*$/, "")
        let isFunction = true
        try {
            Function(`return { ${source} }`) //only reads it, a level.maps function, name() { ... }
        } catch (error) {
            isFunction = false //or just what goes inside one
        }
        const whole = isFunction ? source : `imported() {\n${source}\n}`
        return levelData.normalize({ name: "imported", author: levelData.authorOf(whole), elements: levelData.fromSource(whole) })
    },

    //*********************************************************************
    // capture, a written level's code as data, its own code stays as code elements so everything it does still works
    // top level calls with plain numbers, like spawn.mapRect(0, -100, 500, 25) or spawn.randomLevelBoss(3000, -1400), become elements
    // everything else, its variables, special blocks, level.custom, and the flipped version, stays as code in the same order
    //*********************************************************************
    capture(name, source = levelData.sourceOf(name)) { //call while a level is running, then restart the level with simulation.clearNow, which clears out what the written level made
        levelData.clearWorld()
        const ephemera = simulation.ephemera.slice()
        const isHorizontalFlipped = simulation.isHorizontalFlipped
        try {
            simulation.isHorizontalFlipped = false
            level.load(name) //for the zoom and colors it sets
            return levelData.normalize({
                name: levelData.freeName(name + "-copy"),
                zoom: level.defaultZoom,
                background: document.body.style.backgroundColor || "#ddd",
                mapColor: color.map,
                blockColor: color.block,
                author: levelData.authorOf(source),
                elements: levelData.fromSource(source),
            })
        } finally {
            simulation.isHorizontalFlipped = isHorizontalFlipped
            simulation.ephemera = ephemera //effects the level started, like mirrors and zooming
            level.custom = () => { }
            level.customTopLayer = () => { }
            simulation.draw.body = simulation.draw.bodyDefault //community levels can draw blocks their own way
            simulation.clearTimeouts() //anything the level planned to do later
            input.isPauseKeyReady = true //in case its timeout was cleared
        }
    },
    sourceOf(name) {
        const maps = [level.maps, level.localMaps, moreLevels].find(maps => typeof maps[name] === "function")
        if (!maps) throw new Error(`unknown level: ${name}`)
        return maps[name].toString()
    },
    clearWorld() { //removes everything in the level, the player stays
        m.drop()
        levelData.unbuildAll()
        for (const list of [map, body, mob, powerUp, cons, consBB, composite]) {
            for (const who of list) Composite.remove(engine.world, who)
        }
        map = []
        body = []
        mob = []
        powerUp = []
        cons = []
        consBB = []
        composite = []
        lastTouchedBlock = null
    },
    scanLines(text) { //each line with the bracket depth it starts and ends at, and where its comment starts, strings and comments don't count
        const lines = []
        let depth = 0
        let mode = "code" //code, line, block, ', ", `
        const templates = [] //depth each ${ in a template started at
        let start = 0
        let startDepth = 0
        let isInside = false //starts inside a string or comment
        let comment = -1
        const end = i => {
            lines.push({ text: text.slice(start, i), depth: startDepth, endDepth: depth, isInside, comment: comment === -1 ? -1 : comment - start })
            start = i + 1
            startDepth = depth
            comment = -1
            if (mode === "line") mode = "code"
            isInside = mode !== "code"
        }
        for (let i = 0; i < text.length; i++) {
            const c = text[i]
            const next = text[i + 1]
            if (c === "\n") {
                end(i)
            } else if (mode === "line") {
                continue
            } else if (mode === "block") {
                if (c === "*" && next === "/") {
                    mode = "code"
                    i++
                }
            } else if (mode === "'" || mode === '"') {
                if (c === "\\") i++
                else if (c === mode) mode = "code"
            } else if (mode === "`") {
                if (c === "\\") {
                    i++
                } else if (c === "`") {
                    mode = "code"
                } else if (c === "$" && next === "{") {
                    templates.push(depth++)
                    mode = "code"
                    i++
                }
            } else if (c === "/" && next === "/") {
                if (comment === -1) comment = i
                mode = "line"
                i++
            } else if (c === "/" && next === "*") {
                mode = "block"
                i++
            } else if (c === "'" || c === '"' || c === "`") {
                mode = c
            } else if ("([{".includes(c)) {
                depth++
            } else if (")]}".includes(c)) {
                depth--
                if (c === "}" && templates.length && templates[templates.length - 1] === depth) {
                    templates.pop()
                    mode = "`"
                }
            }
        }
        end(text.length)
        return lines
    },
    callArgs(text) { //the arguments of a call written with plain numbers and strings, or null
        const args = []
        let current = ""
        let quote = ""
        for (const c of text) {
            if (quote) {
                current += c
                if (c === quote) quote = ""
            } else if (c === '"' || c === "'") {
                current += c
                quote = c
            } else if (c === ",") {
                args.push(current.trim())
                current = ""
            } else {
                current += c
            }
        }
        if (current.trim()) args.push(current.trim())
        return args.map(arg => {
            if (/^-?[\d.\s+\-*/()e]+$/.test(arg) && /\d/.test(arg)) { //numbers, maybe a little math like -1500 + 25
                try {
                    const value = Function(`"use strict"; return (${arg})`)()
                    return Number.isFinite(value) ? value : undefined
                } catch (error) { //split in the middle of something, like (a, b)
                    return undefined
                }
            }
            if (/^"[^"\\]*"$|^'[^'\\]*'$/.test(arg)) return arg.slice(1, -1)
            if (arg === "true" || arg === "false") return arg === "true"
            return undefined
        })
    },
    sourceCalls: { //top level calls that become elements, (args) => [type, props] or null when the arguments don't fit
        "spawn.mapRect": ([x, y, width, height], n) => n === 4 ? ["map", { x, y, width, height }] : null,
        "spawn.mapVertex": ([x, y, path], n) => n === 3 && typeof path === "string" ? ["map", { x, y, path }] : null,
        "spawn.bodyRect": ([x, y, width, height, chance = 1], n) => n === 4 || n === 5 ? ["block", { x, y, width, height, chance }] : null,
        "level.setPosToSpawn": ([x, y], n) => n === 2 ? ["spawn", { x, y, bump: false }] : null,
        "spawn.randomLevelBoss": ([x, y], n) => n === 2 ? ["boss", { x, y }] : null,
        "spawn.secondaryBossChance": ([x, y], n) => n === 2 ? ["secondaryBoss", { x, y }] : null,
        "spawn.randomMob": ([x, y, chance = 1], n) => n === 2 || n === 3 ? ["mob", { x, y, chance }] : null,
        "spawn.randomSmallMob": ([x, y], n) => n === 2 ? ["smallMobs", { x, y }] : null,
        "spawn.randomGroup": ([x, y, chance = 1], n) => n === 2 || n === 3 ? ["mobGroup", { x, y, chance }] : null,
        "spawn.debris": ([x, y, width, count = 6], n) => n === 3 || n === 4 ? ["debris", { x, y, width, count }] : null,
        "powerUps.spawnStartingPowerUps": ([x, y], n) => n === 2 ? ["startingPowerUps", { x, y }] : null,
        "powerUps.chooseRandomPowerUp": ([x, y], n) => n === 2 ? ["randomPowerUp", { x, y }] : null,
        "powerUps.spawn": ([x, y, name], n) => n === 3 && levelElements.types.powerUp.names.includes(name) ? ["powerUp", { x, y, name }] : null,
    },
    fromSource(source) { //elements and code elements, in the order the level's code has them
        const body = source.slice(source.indexOf("{") + 1, source.lastIndexOf("}"))
        const lines = levelData.scanLines(body)
        const code = index => { //the line without its comment
            const line = lines[index]
            return (line.comment === -1 ? line.text : line.text.slice(0, line.comment)).trim()
        }
        const isTop = index => lines[index].depth === 0 && lines[index].endDepth === 0 && !lines[index].isInside
        const near = (index, step) => { //the closest line with code
            for (let i = index + step; i >= 0 && i < lines.length; i += step) if (code(i)) return i
            return -1
        }
        const isAlone = index => { //a statement of its own, not part of the lines around it
            const before = near(index, -1)
            const after = near(index, 1)
            if (before !== -1 && (/(^|\W)(if|else|for|while)\b[^{]*$/.test(code(before)) || /[=+\-*/,(?:&|[]$|=>$/.test(code(before)))) return false
            if (after !== -1 && /^(\.|\?\.)/.test(code(after))) return false
            return true
        }
        const elements = []
        const used = new Set() //lines that became elements
        const element = (index, type, props) => {
            const el = levelElements.create(type, props)
            el.line = index //where it goes, removed below
            elements.push(el)
            used.add(index)
            return el
        }
        let spawnEl = null
        let exitEl = null
        const exitLines = []
        for (let i = 0; i < lines.length; i++) {
            if (!isTop(i) || !isAlone(i)) continue
            const text = code(i).replace(/;$/, "")
            const exit = text.match(/^level\.exit\.(x|y)\s*=\s*(-?[\d.]+)$/)
            if (exit) {
                if (!exitEl) exitEl = element(i, "exit", { x: undefined, y: undefined, bump: false })
                exitEl[exit[1]] = Number(exit[2])
                exitLines.push(i)
                used.add(i)
                continue
            }
            const compact = text.replace(/\s+/g, "")
            if (compact === "spawn.mapRect(level.exit.x,level.exit.y+20,100,20)" && exitEl) { //the bumps the doors stand on
                exitEl.bump = true
                used.add(i)
                continue
            }
            if (compact === "spawn.mapRect(level.enter.x,level.enter.y+20,100,20)" && spawnEl) {
                spawnEl.bump = true
                used.add(i)
                continue
            }
            if (/^spawn\.randomMobPositions\s*=\s*\[$/.test(text)) continue //handled below, it's more than one line
            if (levelData.authorLine.test(text)) { //the author log, capture() makes it the level's author
                used.add(i)
                continue
            }
            const namedMob = text.match(/^spawn\["(\w+)"\]\((.*)\)$/)
            const call = text.match(/^([\w.]+)\((.*)\)$/) || (namedMob && [text, "spawn." + namedMob[1], namedMob[2]])
            if (!call) continue
            const args = levelData.callArgs(call[2])
            if (args.includes(undefined)) continue
            const make = levelData.sourceCalls[call[1]] || (call[1].startsWith("spawn.") && levelElements.mobNames().includes(call[1].slice(6)) ? ([x, y], n) => n === 2 ? ["namedMob", { x, y, name: call[1].slice(6) }] : null : null)
            const found = make && make(args, args.length)
            if (!found) continue
            const [type, props] = found
            if (type === "spawn" && spawnEl) continue //only the first, written levels sometimes set it again
            const el = element(i, type, props)
            if (type === "spawn") spawnEl = el
            if (props.path !== undefined) { //spawn.mapVertex puts the center of its vertices at x, y like the editor does
                const numbers = props.path.trim().split(/[\s,]+/).map(Number)
                const points = []
                for (let j = 0; j + 1 < numbers.length; j += 2) points.push({ x: numbers[j], y: numbers[j + 1] })
                const c = levelElements.centroid(points)
                delete el.path
                levelElements.setPoints(el, points.map(p => ({ x: p.x - c.x + props.x, y: p.y - c.y + props.y })))
            }
        }
        if (exitEl && (exitEl.x === undefined || exitEl.y === undefined)) { //only one of exit.x and exit.y at the top, the level's code keeps setting it
            elements.splice(elements.indexOf(exitEl), 1)
            for (const i of exitLines) used.delete(i)
        }
        for (let i = 0; i < lines.length; i++) { //mob spots written like the newer levels, and the spawn.randomMobFromArray() after them
            if (lines[i].depth !== 0 || lines[i].isInside || used.has(i) || !/^spawn\.randomMobPositions\s*=\s*\[$/.test(code(i))) continue
            let last = i + 1
            while (last < lines.length && lines[last].endDepth !== 0) last++
            const text = lines.slice(i, last + 1).map((line, j) => code(i + j)).join(" ")
            const match = text.match(/^spawn\.randomMobPositions\s*=\s*\[(.*)\]\s*\.map\(\(\[x,\s*y,\s*isSmall\s*=\s*false\]\)\s*=>\s*\(\{\s*x,\s*y,\s*isSmall\s*\}\)\);?$/)
            const call = lines.findIndex((line, j) => j > last && isTop(j) && code(j).replace(/;$/, "") === "spawn.randomMobFromArray()")
            if (!match || call === -1) continue
            const rows = [...match[1].matchAll(/\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(true|false)\s*)?\]/g)]
            for (const row of rows) element(i, "mobSpot", { x: Number(row[1]), y: Number(row[2]), small: row[3] === "true" })
            for (let j = i; j <= last; j++) used.add(j)
            used.add(call)
            break
        }
        //the rest of the lines are code, lines next to each other are one code element
        const parts = []
        let chunk = null
        for (let i = 0; i < lines.length; i++) {
            if (used.has(i)) {
                chunk = null
                const placed = elements.filter(el => el.line === i)
                for (const el of placed) parts.push(el)
                continue
            }
            if (!chunk) {
                if (!code(i)) continue //blank lines and comments between elements
                chunk = { type: "code", lines: [] }
                parts.push(chunk)
            }
            chunk.lines.push(lines[i].text)
        }
        for (const el of elements) delete el.line
        return parts.map(part => {
            if (part.type !== "code") return part
            while (part.lines.length && !part.lines[part.lines.length - 1].trim()) part.lines.pop()
            const indent = Math.min(...part.lines.filter(line => line.trim()).map(line => line.match(/^\s*/)[0].length))
            return levelElements.create("code", { code: part.lines.map(line => line.slice(indent)).join("\n") })
        }).filter(el => el.type !== "code" || el.code.trim())
    },

    //*********************************************************************
    // storage, each level is its own localStorage key, so saving one doesn't rewrite the others
    // if localStorage is blocked, levels last until the page closes
    //*********************************************************************
    store: {
        prefix: "localLevel:",
        indexKey: "localLevels", //{ names: [], recent: "" }
        levels: null, //name: data, loaded on first use
        recent: "", //the level the editor opened last
        isFailing: false, //a write failed and hasn't worked since, storage is full or blocked, the editor warns until each key saves
        failedKeys: new Set(), //keys whose last write failed, a later small write working doesn't clear another key's failure
        onChange: null, //called after each write with isFailing, the editor's not saved warning
        quota: 5000000, //characters, about what browsers allow each site in localStorage, there's no way to ask for the real limit
        used() { //characters in localStorage, local levels share it with settings and checkpoints
            let total = 0
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    total += key.length + (localStorage.getItem(key) || "").length
                }
            } catch (error) { }
            return total
        },
        read(key) {
            try {
                return JSON.parse(localStorage.getItem(key))
            } catch (error) {
                return null
            }
        },
        write(key, value) { //true if it worked
            let isSaved = true
            try {
                if (value === null) {
                    localStorage.removeItem(key)
                } else {
                    localStorage.setItem(key, JSON.stringify(value))
                }
            } catch (error) {
                console.warn("local level not saved", error)
                isSaved = false
            }
            if (isSaved) levelData.store.failedKeys.delete(key)
            else levelData.store.failedKeys.add(key)
            levelData.store.isFailing = levelData.store.failedKeys.size > 0
            if (levelData.store.onChange) levelData.store.onChange(levelData.store.isFailing)
            return isSaved
        },
        load() {
            if (levelData.store.levels) return
            levelData.store.levels = {}
            const index = levelData.store.read(levelData.store.indexKey) || {}
            const names = Array.isArray(index.names) ? index.names.slice() : []
            try { //a level saved without its index, like after a rename whose index write failed, is still found
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && key.startsWith(levelData.store.prefix) && !names.includes(key.slice(levelData.store.prefix.length))) names.push(key.slice(levelData.store.prefix.length))
                }
            } catch (error) { }
            for (const name of names) {
                const data = levelData.store.read(levelData.store.prefix + name)
                if (data && levelData.isValidName(name)) levelData.store.levels[name] = levelData.normalize({ ...data, name })
            }
            levelData.store.recent = index.recent in levelData.store.levels ? index.recent : ""
            levelData.store.sync()
        },
        sync() { //written in level.localMaps, so level.load(), level.localLevels(), and the level pool see them
            for (const name of Object.keys(level.localMaps)) {
                if (!(name in levelData.store.levels)) delete level.localMaps[name]
            }
            for (const name of Object.keys(levelData.store.levels)) {
                level.localMaps[name] = () => levelData.play(levelData.store.get(name))
            }
        },
        saveIndex() { //true if it saved
            return levelData.store.write(levelData.store.indexKey, { names: Object.keys(levelData.store.levels), recent: levelData.store.recent })
        },
        names() {
            levelData.store.load()
            return Object.keys(levelData.store.levels)
        },
        has(name) {
            levelData.store.load()
            return Object.hasOwn(levelData.store.levels, name)
        },
        get(name) { //a copy, so playing or editing it doesn't change what's saved
            levelData.store.load()
            return levelData.store.has(name) ? levelData.copy(levelData.store.levels[name]) : null
        },
        getRecent() {
            levelData.store.load()
            return levelData.store.recent ? levelData.store.get(levelData.store.recent) : null
        },
        save(data, isRecent = true) { //true if it reached localStorage, it's kept for this page either way
            levelData.store.load()
            const isNew = !levelData.store.has(data.name)
            levelData.store.levels[data.name] = levelData.copy(data)
            const isSaved = levelData.store.write(levelData.store.prefix + data.name, data)
            if (isRecent) levelData.store.recent = data.name
            if (isNew || isRecent) levelData.store.saveIndex()
            if (isNew) levelData.store.sync()
            return isSaved && !levelData.store.isFailing
        },
        hasWork() { //a local level that's more than the blank one opening the editor saves, the title page shows its editor button
            return levelData.store.names().some(name => {
                const types = levelData.store.levels[name].elements.map(el => el.type).sort().join()
                return !/^untitled\d*$/.test(name) || types !== "exit,map,spawn"
            })
        },
        remove(name) {
            levelData.store.load()
            delete levelData.store.levels[name]
            levelData.store.write(levelData.store.prefix + name, null)
            if (levelData.store.recent === name) levelData.store.recent = ""
            levelData.store.saveIndex()
            levelData.store.sync()
            levelData.store.renameInPool(name, null)
        },
        rename(oldName, newName) { //the new copy is saved before the old one goes, so a failed save loses nothing
            const data = levelData.store.get(oldName)
            if (!data || !levelData.isNameFree(newName)) return false
            data.name = newName
            if (!levelData.store.write(levelData.store.prefix + newName, data)) return false
            const recent = levelData.store.recent
            levelData.store.levels[newName] = data
            delete levelData.store.levels[oldName]
            if (recent === oldName) levelData.store.recent = newName
            if (!levelData.store.saveIndex()) { //the index still says the old name, undo it all and keep the old one
                levelData.store.levels[oldName] = levelData.store.levels[newName]
                levelData.store.levels[oldName].name = oldName
                delete levelData.store.levels[newName]
                levelData.store.recent = recent
                levelData.store.write(levelData.store.prefix + newName, null)
                return false
            }
            levelData.store.write(levelData.store.prefix + oldName, null) //only once the new name is saved and listed
            levelData.store.sync()
            levelData.store.renameInPool(oldName, newName)
            return true
        },
        renameInPool(oldName, newName) { //the level pool in settings remembers local levels by name, null takes it out
            const pool = localSettings.levelPool
            if (!pool || !pool.added.includes(oldName)) return
            pool.added = pool.added.filter(name => name !== oldName)
            if (newName) pool.added.push(newName)
            if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        },
    },
}
levelData.store.load()

//*********************************************************************
// the level editor before it opens, runs read isActive and the title page shows its button
// its files load the first time it opens, like level2.js, so a normal run never loads them
// js/level-editor.js adds the rest to this object, replacing open() and close()
//*********************************************************************
const levelEditor = {
    isActive: false, //level.start(), m.death(), m.takeDamage(), the autosave, and the mouse lock check it every run
    files: ["js/level-analysis.js", "js/level-editor.js", "js/level-editor-icons.js", "js/level-editor-help.js"], //js/level-editor-mob-pictures.js loads later, see loadMobPictures()
    filesPromise: null,
    loadFiles() { //all at once, they run in this order
        if (levelEditor.filesPromise) return levelEditor.filesPromise
        levelEditor.filesPromise = Promise.all(levelEditor.files.map(src => new Promise((resolve, reject) => {
            const script = document.createElement("script")
            script.src = src
            script.async = false //in order, each adds to the one before
            script.onload = resolve
            script.onerror = () => reject(new Error(`failed to load ${src}`))
            document.head.appendChild(script)
        }))).catch(error => {
            levelEditor.filesPromise = null
            throw error
        })
        return levelEditor.filesPromise
    },
    async open() {
        const stub = levelEditor.open
        try {
            await levelEditor.loadFiles()
        } catch (error) {
            return console.error(error)
        }
        if (levelEditor.open !== stub) levelEditor.open() //js/level-editor.js's
    },
    close() { }, //nothing is open before it loads
    updateSplashButton() { //the title page's editor button, once there are local levels
        const isShown = levelData.store.hasWork()
        document.body.classList.toggle("has-level-editor", isShown)
        document.getElementById("level-editor-splash-button").style.display = isShown && simulation.onTitlePage !== false ? "inline" : "none"
    },
}
