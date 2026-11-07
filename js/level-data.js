"use strict";
//local levels, levels saved as plain data instead of code, made in the level editor
//  levelData.play(data) builds one, level.load() calls it for local level names
//  levelData.store saves them in localStorage
//  authoring and capture live in level-editor-data.js, loaded only by the editor
//see docs/level-editor.md for the data format
const levelData = {
    format: 1, //bump when old data can't be read anymore, then convert it in levelData.normalize()
    nameMax: 40,

    //*********************************************************************
    // level data
    //*********************************************************************
    blank(name) { //entrance and exit 1500 apart on one piece of ground
        return levelData.normalize({
            name,
            elements: [
                levelElements.create("spawn", { x: 0, y: -50 }),
                levelElements.create("exit", { x: 1450, y: -20 }),
                levelElements.create("map", { x: -250, y: 0, width: 2000, height: 100 }),
            ],
        })
    },
    normalize(data) { //fills in anything missing, so the rest of the code can trust the data
        if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("expected level data")
        data.format = levelData.format
        data.name = String(data.name || "untitled")
        const defaults = levelElements.level.defaults()
        for (const key of Object.keys(defaults)) {
            if (data[key] === undefined || data[key] === null || data[key] === "") data[key] = defaults[key]
        }
        data.zoom = Number(data.zoom) || defaults.zoom
        if (typeof data.levelCode !== "string") data.levelCode = "" //the level info box's code, see runCode()
        data.typedCode = levelData.normalizeTyped(data.typedCode)
        for (const key of ["author", "log"]) if (typeof data[key] !== "string") data[key] = "" //not in level.defaults(), the typical level properties button keeps them
        if (!Array.isArray(data.mobVeto)) data.mobVeto = []
        data.elements = Array.isArray(data.elements) ? data.elements.filter(el => el && typeof el === "object" && typeof el.type === "string" && /^\w+$/.test(el.type)) : [] //a type is a name, the editor shows it
        const isId = id => Number.isSafeInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER //ids are whole numbers, the editor shows them, so an imported level can't put html there
        const ids = new Set()
        data.nextId = isId(Number(data.nextId)) ? Number(data.nextId) : 1
        for (const el of data.elements) {
            if (!isId(el.id)) continue
            if (ids.has(el.id)) throw new Error(`duplicate element id #${el.id}`)
            ids.add(el.id)
            data.nextId = Math.max(data.nextId, el.id + 1)
        }
        for (const el of data.elements) {
            if (el.type === "decor") el.type = "fill" //its old name
            if (el.type === "timer") { //it's one of logic's gates now, its link and orLink are its inputs
                el.type = "logic"
                el.gate = "timer"
            }
            if (el.type === "bezier") levelData.bezierToPath(el) //the path's curves do it now
            if (!isId(el.id)) el.id = data.nextId++
            levelElements.fillDefaults(el)
            for (const key of levelElements.refKeys(el)) if (!isId(el[key])) el[key] = null
            if (el.type === "powerUp") {
                if (!levelElements.types.powerUp.names.includes(el.name)) el.name = "heal"
                const count = typeof el.count === "number" || typeof el.count === "string" ? Number(el.count) : NaN
                if (!Number.isInteger(count) || count < 1 || count > levelElements.maxPowerUpCount) {
                    throw new Error(`power up #${el.id}: count must be a whole number from 1 to ${levelElements.maxPowerUpCount}`)
                }
                el.count = count
            }
            if (el.type === "namedMob" && !levelElements.mobNames().includes(el.name)) el.name = "starter"
            if ("veto" in el && !Array.isArray(el.veto)) el.veto = []
            const point = value => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)
            for (const key of ["vertices", "spots"]) {
                if (el[key] !== undefined && (!Array.isArray(el[key]) || !el[key].every(point))) throw new Error(`${el.type} #${el.id}: ${key} must be a list of coordinate pairs`)
            }
            if (el.vertices && el.vertices.length < (el.type === "path" ? 2 : 3)) throw new Error(`${el.type} #${el.id}: too few vertices`)
            if (el.handles !== undefined && (!Array.isArray(el.handles) || !el.handles.every(handle => handle == null || point(handle)))) throw new Error(`${el.type} #${el.id}: invalid curve handles`)
            if (el.layer === "back" || el.layer === "front") el.layer = el.layer === "back" ? "under player" : "over player" //their old names
            if (el.edited) levelData.normalizeEdited(el)
        }
        for (const type of levelElements.groups.core) { //every level needs a spawn and an exit, unless its code sets them, like a written level that picks a layout
            if (!data.elements.some(el => el.type === type) && !levelData.hasCode(data)) levelData.add(data, levelElements.create(type))
        }
        return data
    },
    normalizeTyped(typed) { //lines typed between elements in the code panel, [{ after, runsAfter, part, lines }], see typedOf()
        if (!Array.isArray(typed)) return []
        return typed.filter(block => block && typeof block === "object" && Array.isArray(block.lines)).map(block => ({
            after: typeof block.after === "number" || typeof block.after === "string" ? block.after : "start",
            runsAfter: Number.isSafeInteger(block.runsAfter) ? block.runsAfter : null,
            part: ["setup", "custom", "top"].includes(block.part) ? block.part : "setup",
            lines: block.lines.map(String),
        })).filter(block => block.lines.some(line => line.trim()))
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
    add(data, el) {
        delete el.codeName //a pasted element gets its own name; edited-name mappings follow it
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
    elementsById: new Map(), //active level only, refreshed on play and edits before rebuilding
    indexElements(data) {
        levelData.elementsById = new Map(data.elements.map(el => [el.id, el]))
    },
    runtimes: new Map(), //element id: { custom, top, maps, bodies, cons, consBB, composite, constraints, error }
    play(data, options = {}) { //call inside level.start, like a written level, see level.load(), options: { isEditor, isSpawning }
        levelData.data = data
        levelData.indexElements(data)
        levelData.isEditor = !!options.isEditor
        levelData.isSpawning = !levelData.isEditor || !!options.isSpawning
        levelData.unbuildAll() //clearMap already removed the last level's bodies, but not constraints in the world, like a spinner's pin
        levelData.runtimes = new Map()
        levelData.applySettings(data)
        if (data.author.trim()) simulation.inGameConsole(levelData.authorLog(data)) //like community levels
        if (data.log.trim()) simulation.inGameConsole(levelData.safeHtml(data.log)) //the level's own message
        levelData.trackEphemera(() => { }) //the last level code's effects go away, like mirrors
        levelData.codeLayers = null
        levelData.sharedElementIds = null
        levelData.codeError = null //the last level's error doesn't carry into this one
        levelData.drawnByCode = levelData.hasCode(data) || data.levelCode.trim() ? levelData.codeDraws(data) : {}
        const shared = levelData.isShared(data) && levelData.isProgramLoaded()
        if (levelData.isShared(data) && !shared) { //its code program is still downloading or failed to, see loadProgram(), the elements still build
            console.error(`level code for ${data.name} isn't loaded yet, it runs without its code`)
            levelData.loadProgram().catch(error => console.error(error))
        }
        if (shared) {
            levelData.runCode(data)
        } else {
            for (const el of levelData.inBuildOrder(data)) levelData.runtimes.set(el.id, levelData.build(el, false))
            levelData.finishElements(data)
        }
        level.custom = () => {
            levelData.runCodeLayer("custom")
            if (!shared) levelData.layer("custom")
        }
        level.customTopLayer = () => {
            levelData.runCodeLayer("top")
            if (!shared) levelData.layer("top")
        }
        if (!levelData.isEditor) simulation.zoomTransition(data.zoom)
    },
    finishElements(data) { //after every element and before the level code
        const has = text => levelData.codeHas(data, text) //what the level's code already does itself
        if (levelData.isSpawning && data.elements.some(el => el.type === "mobSpot")) spawn.randomMobFromArray(data.mobVeto) //mob spots, level.start() empties the list
        if (levelData.isSpawning && levelData.addsResearch(data)) powerUps.addResearchToLevel() //like written levels, after the mobs spawn
        if (levelData.isSpawning && !has("announceText")) { //like written levels, the run's constraint below the entrance and the new mob types
            const text = levelData.constraintText(data)
            level.announceText(text.x, text.y, true)
            level.announceMobTypes()
        }
        simulation.fallHeight = levelData.fallHeight(data)
    },
    //*********************************************************************
    // a level with any code runs inside one function, like a written level, so all of its code shares one scope
    // code elements, edited elements, elements that code names, and the level code are written into it, other elements just build where they are in the list
    //*********************************************************************
    typedOf: data => data.typedCode || [], //after is the line it shows under in the code panel and export: an element's id or a key from lineKey(), runsAfter is the element before it in its part, so a run matches, null is before them all
    isShared(data) {
        return levelData.hasCode(data) || !!data.levelCode.trim() || levelData.typedOf(data).length > 0 || data.elements.some(el => el.edited)
    },
    addsResearch(data) { //a level with mobs gets a research power up, unless its code already adds one, so a puzzle level or a copy of reactor doesn't
        return data.elements.some(el => levelElements.groups.mob.includes(el.type)) && !levelData.codeHas(data, "addResearchToLevel")
    },
    hasCode(data) {
        return data.elements.some(el => levelElements.isCode(el))
    },
    codeText(data) { //all the level's own javascript: code elements and the level code
        return data.elements.filter(el => levelElements.isCode(el)).map(el => el.code).concat(levelData.typedOf(data).flatMap(block => block.lines), data.levelCode || "").join("\n")
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
        for (const block of levelData.typedOf(data)) parts.push({ where: "typed code", code: block.lines.join("\n") })
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
        copy.typedCode = []
        return levelData.normalize(copy) //a spawn and exit, if its code made them
    },
    //*********************************************************************
    // saved data, read-only stand-ins guard against accidental writes
    // a level's javascript is made inside a function whose arguments are read-only stand-ins for localStorage, sessionStorage, and localSettings, and no indexedDB
    // only the level's own code sees them, so the game's own saving still works, even when level code calls it
    // the shared execution policy lives in level-code.js
    // it stops code that changes saves plainly, like a settings line in a community map, not code written to get around it, the import warning is for that
    //*********************************************************************
    codeFunction: (params, body) => levelCode.codeFunction(params, body),
    isSkipped: () => false, //the editor hides elements from its explorer by not building them while editing
    codeLayers: null, //{ custom, top } the level.custom and level.customTopLayer the level's code set
    drawnByCode: {}, //door types its code draws, see codeDraws()
    codeError: null,
    layersCode({ custom = [], top = [] }, selfName = "") { //the object of an element's or the level code's every cycle parts, they're closures so they see every variable in the level
        const layer = lines => lines.some(line => line.trim()) ? `() => {\n${lines.join("\n")}\n}` : "null"
        const self = selfName ? `, self: typeof ${selfName} === "undefined" ? undefined : ${selfName}` : ""
        return `{ custom: ${layer(custom)}, top: ${layer(top)}${self} }`
    },
    pieceProblem(sections) { //invalid edited elements can be left out without hiding the rest of the level
        try {
            Function(`${(sections.setup || []).join("\n")}\nreturn ${levelData.layersCode(sections)}`)
            return null
        } catch (error) {
            return error
        }
    },
    sharedSource(data) { //instrument the same ordered program shown in the panel, without adding scopes
        const { names, context, written } = levelData.codeNames(data)
        const broken = new Map()
        const leftOut = el => levelData.isSkipped(el) || (["mob", "powerUp"].includes(levelElements.types[el.type]?.group) && !levelData.isSpawning)
        for (const el of data.elements) {
            if (!written.has(el.id) || !levelElements.types[el.type] || leftOut(el)) continue
            const error = levelData.pieceProblem(levelData.exportElement(el, names.get(el.id), context))
            if (error) broken.set(el.id, error)
        }
        const lines = levelData.codeLines(data, true, { names, context }, true).slice(1, -1)
        const source = ['"use strict";']
        for (let i = 0; i < lines.length;) {
            const line = lines[i]
            const key = line.block ? `typed:${levelData.typedOf(data).indexOf(line.block)}` : line.owner === "level" ? "level" : typeof line.anchor === "number" ? line.anchor : null
            if (key === null) {
                if (line.anchor === "finish") source.push("__level.finish();")
                else if (!line.system) source.push(line.text)
                i++
                continue
            }
            const group = []
            do { group.push(lines[i++].text) } while (i < lines.length && lines[i].part === line.part && (line.block ? lines[i].block === line.block : key === "level" ? lines[i].owner === "level" : lines[i].anchor === key && !lines[i].block))
            const el = typeof key === "number" ? levelData.find(data, key) : null
            const isCode = el && levelElements.isCode(el)
            const isWritten = !el || isCode || written.has(key)
            if (el && (!isWritten || leftOut(el) || broken.has(key))) {
                if (line.part === "setup") source.push(broken.has(key) ? `__level.broken(${key});` : `__level.build(${key});`)
                else if (!leftOut(el) && !broken.has(key)) source.push(`__level.layer(${key}, ${JSON.stringify(line.part)});`)
                continue
            }
            const encoded = JSON.stringify(key)
            if (line.part === "setup") {
                source.push(`__level.start(${encoded});`, ...group)
                const self = el && !isCode && levelElements.types[el.type]?.linkOn ? names.get(key) : ""
                source.push(`;__level.layers(${encoded}, ${levelData.layersCode({}, self)});`)
            } else {
                source.push(`;__level.at(${encoded});`, ...group)
            }
        }
        return { source: source.join("\n"), broken, names }
    },
    codeProblem(data) { //why the level's one function can't be read, like two elements declaring the same variable, "" if it can, nothing runs
        if (!levelData.isShared(data)) return ""
        const { source, broken } = levelData.sharedSource(data)
        if (broken.size) return broken.values().next().value.message
        try {
            levelData.codeFunction(["__level"], source)
            Function(`"use strict"; return ({${levelData.codeLines(data, true).map(line => line.text).join("\n")}})`)
        } catch (error) {
            return error.message
        }
        return ""
    },
    runCode(data) { //every element in order, then the level code
        const marks = new Map()
        let chunk = null //the code running, to blame for an error
        let isFinished = false
        levelData.sharedElementIds = data.elements.map(el => el.id)
        const { source, broken, names } = levelData.sharedSource(data)
        const finish = () => {
            if (isFinished) return
            isFinished = true
            levelData.finishElements(data)
        }
        const blame = (key, error) => {
            console.error(key === "level" ? "level code:" : typeof key === "string" ? "typed code:" : `${levelData.find(data, key)?.type || "code"} #${key}:`, error)
            levelData.codeError = levelData.codeError || error
            if (key === "level") levelData.levelCodeRuntime = { ...levelData.made(marks.get(key) || levelData.mark()) }
            else levelData.runtimes.set(key, { ...levelData.made(marks.get(key) || levelData.mark()), isCode: true, error })
        }
        const api = {
            at(key) { levelData.frameOwner = key },
            layer(id, name) {
                const el = levelData.elementsById.get(id)
                if (el) levelData.layerElement(el, name)
            },
            build(id) {
                const el = levelData.find(data, id)
                levelData.runtimes.set(id, levelData.build(el, false))
            },
            start(key) {
                chunk = key
                marks.set(key, levelData.mark())
            },
            layers(key, layers) {
                if (key === "level") levelData.levelCodeRuntime = { ...levelData.made(marks.get(key)), custom: layers.custom, top: layers.top }
                else if (typeof key === "string") levelData.runtimes.set(key, { ...levelData.made(marks.get(key)), isCode: true })
                else levelData.runtimes.set(key, { ...levelData.made(marks.get(key)), ...levelData.writtenRuntime(levelData.find(data, key), names.get(key), layers) })
                chunk = null
            },
            broken(id) {
                blame(id, broken.get(id))
            },
            finish,
        }
        level.custom = () => { }
        level.customTopLayer = () => { }
        levelData.codeError = null
        levelData.levelCodeRuntime = null
        const spawned = { mob: mob.length, powerUp: powerUp.length }
        try {
            levelData.trackEphemera(() => levelData.codeFunction(["__level"], source).call(level, api))
        } catch (error) { //the code after it doesn't run, the plain elements still build below so the level isn't empty
            if (chunk !== null) blame(chunk, error)
            else {
                console.error("level code:", error)
                levelData.codeError = error
            }
        }
        for (const el of levelData.inBuildOrder(data)) { //only after an error
            if (!levelData.runtimes.has(el.id) && !levelElements.isCode(el) && !el.edited) api.build(el.id)
        }
        finish()
        for (const [key, error] of broken) if (typeof key === "string") blame(key, error)
        if (!levelData.isSpawning) levelData.removeSpawned(spawned)
        levelData.codeLayers = { custom: level.custom, top: level.customTopLayer }
    },
    writtenRuntime(el, name, layers) { //an element that ran as code, see sharedSource(), a link source is on when its code's object is
        const type = levelElements.types[el.type]
        const runtime = { custom: layers.custom, top: layers.top, isCode: true } //isCode: changing it runs the whole level again
        if (type.linkOn && name) {
            const on = Function(name, `return ${type.linkCode(el, name).on}`)
            runtime.self = layers.self
            runtime.linkOn = () => layers.self === undefined ? null : !!on(layers.self)
        }
        return runtime
    },
    //*********************************************************************
    // level code, data.levelCode, the level info box's code, it runs last, after everything else is made, like the end of a written level
    // written like an element's edited code: setup lines, then //level.custom and //level.customTopLayer and their lines, which run each frame after the elements'
    //*********************************************************************
    levelCodeRuntime: null, //{ maps, bodies, ..., custom, top } what it made and its layers
    runCodeLayer(name) { //the level code's level.custom or customTopLayer, an error doesn't stop the level
        const layers = levelData.codeLayers
        if (!layers) return
        levelData.frameOwner = null
        try {
            layers[name]()
        } catch (error) {
            const isNew = !levelData.codeError
            if (isNew) console.error(`level code ${name === "top" ? "customTopLayer" : "custom"}:`, error) //once, it would repeat every cycle
            levelData.codeError = error
            const runtime = levelData.runtimes.get(levelData.frameOwner)
            if (runtime) runtime.error = error
            layers[name] = () => {} //the shared layer stops after an error; do not repeat side effects each frame
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
        const isSight = data.lineOfSight && (!levelEditor.isActive || levelEditor.isTesting || levelEditor.isFullTest) //while editing it would hide the level, so only quick test and test export show it
        if (isSight && simulation.draw.drawMapPath !== simulation.draw.drawMapSightLevel) {
            simulation.draw.drawMapPath = simulation.draw.drawMapSightLevel
            simulation.draw.lineOfSightPrecalculation() //circleLoS would also catch up by itself, see simulation.sight.updateMapGrid()
        } else if (!isSight && simulation.draw.drawMapPath === simulation.draw.drawMapSightLevel) {
            simulation.draw.drawMapPath = simulation.draw.drawMapPathDefault
            simulation.draw.updateLineOfSightSetting() //the pause menu's setting
        }
    },
    constraintText(data) { //where the run's constraint text shows, the level properties move it from the spawn
        const spawn = data.elements.find(el => el.type === "spawn") || { x: 0, y: 0 }
        return { x: spawn.x + data.constraintTextX, y: spawn.y + data.constraintTextY }
    },
    onError: null, //called when an element or the level's code throws while running, the editor recounts its issues
    linkInputs(el, depth = 0) { //[link, orLink]: true while that trigger is on, false while off, null without one
        const sourceState = id => {
            const from = levelData.elementsById.get(id)
            const runtime = from && levelElements.isLinkSource(from) && levelData.runtimes.get(from.id)
            if (!runtime) return null
            const own = runtime.linkOn ? runtime.linkOn() : levelElements.types[from.type].linkOn(from, runtime, depth) //edited code's own check, see writtenRuntime()
            if (levelElements.types[from.type].isGate) return own //its links are its inputs, not also on
            const above = depth < 8 ? levelData.linkState(from, depth + 1) : null //a link source linked to another is only on while both are, like a timer that only runs while a button is down
            return above === false ? false : own
        }
        return [el.link ? sourceState(el.link) : null, el.orLink ? sourceState(el.orLink) : null]
    },
    linkState(el, depth = 0) { //true while what el is linked to is on, false while off, null without one
        const [a, b] = levelData.linkInputs(el, depth)
        const state = a === null ? b : b === null ? a : a || b //linked to two, it's on while either is
        if (depth || state === null || !(el.delay > 0)) return state
        const runtime = levelData.runtimes.get(el.id) //its delay follows the link late, kept on its runtime so a rebuild starts it over
        if (!runtime) return state
        if (!runtime.delayLine) runtime.delayLine = level.delay(el.delay)
        return runtime.delayLine.state(state)
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
    layer(name) { //plain levels keep native element callbacks; shared levels call them from the program
        for (const el of levelData.data.elements) levelData.layerElement(el, name)
    },
    layerElement(el, name) {
        const isTimed = levelData.isEditor //the editor's analysis shows what each element costs a frame, runtime.customMs and runtime.topMs
        const runtime = levelData.runtimes.get(el.id)
        if (!runtime || !runtime[name]) return
        const type = levelElements.types[el.type]
        if (levelData.drawnByCode[el.type]) return //the level's code draws it
        if ((el.link || el.orLink) && type.isLinkable && !type.handlesLink && levelData.linkOn(el) === false) return //its button has it off
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
    },
    build(el, isLive) { //isLive: the level has already started, so map bodies are added to the world here instead of in level.addToWorld()
        const type = levelElements.types[el.type]
        const start = levelData.mark()
        let runtime
        try {
            if (!type) throw new Error(`unknown element type: ${el.type}`)
            const options = { isLive, isEditor: levelData.isEditor, isSpawning: levelData.isSpawning && !isLive }
            runtime = levelData.isSkipped(el) || el.edited ? {} : type.build(el, options) || {} //hidden in the editor's explorer, edited code only runs with the whole level, see runCode()
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
    codeNames(data) { //persist names once allocated; list order never changes a code reference
        const names = new Map()
        const authored = { setup: [], custom: [], top: [] }
        for (const el of data.elements) if (levelElements.isCode(el)) authored.setup.push(el.code)
        for (const block of levelData.typedOf(data)) authored[block.part].push(...block.lines)
        const levelSections = levelData.sectionsOf(data.levelCode || "")
        for (const part of Object.keys(authored)) authored[part].push(...levelSections[part])
        const codeText = levelData.analysisText(levelData.sectionsText(authored))
        const analysis = levelData.analyzeCode(codeText)
        const edited = data.elements.filter(el => el.edited)
        const declarations = edited.map(el => ({ el, names: levelData.analyzeCode(levelData.analysisText(el.edited.text)).declarations }))
        const isTaken = name => analysis.declarations.has(name) || declarations.some(item => item.el.edited.name !== name && item.names.has(name))
        const counts = data.codeNameCounts && typeof data.codeNameCounts === "object" && !Array.isArray(data.codeNameCounts) ? data.codeNameCounts : {}
        data.codeNameCounts = counts
        const eligible = data.elements.filter(el => {
            const type = levelElements.types[el.type]
            return type && type.code && !levelData.isTogether(el) && !type.isCode
        })
        const used = new Set()
        for (const el of eligible) { //retain valid, unique names, including names restored from a saved level
            const prefix = levelData.functionName(el.type)
            const match = typeof el.codeName === "string" && el.codeName.match(new RegExp(`^${prefix}([1-9]\\d*)$`))
            if (!match || !Number.isSafeInteger(Number(match[1])) || used.has(el.codeName)) { delete el.codeName; continue }
            used.add(el.codeName)
            counts[el.type] = Math.max(Number.isSafeInteger(counts[el.type]) ? counts[el.type] : 0, Number(match[1]))
            names.set(el.id, el.codeName)
        }
        for (const el of eligible) {
            if (names.has(el.id)) continue
            let name
            do {
                counts[el.type] = (Number.isSafeInteger(counts[el.type]) && counts[el.type] >= 0 && counts[el.type] < Number.MAX_SAFE_INTEGER - 1 ? counts[el.type] : 0) + 1
                name = `${levelData.functionName(el.type)}${counts[el.type]}`
            } while (used.has(name) || isTaken(name))
            el.codeName = name
            used.add(name)
            names.set(el.id, name)
        }
        const referenced = new Set(data.elements.flatMap(el => levelElements.refKeys(el).map(key => el[key])).filter(id => names.has(id)))
        const codeOf = (id, depth) => {
            const from = levelData.find(data, id)
            if (!from || !levelElements.isLinkSource(from)) return null
            const own = levelElements.types[from.type].linkCode(from, names.get(from.id), context, depth)
            if (levelElements.types[from.type].isGate) return own //its links are its inputs, not also on
            const above = depth < 8 ? sourceCode(from, depth + 1) : null
            if (!above) return own
            const on = `${own.on} && ${above.on.includes("||") ? `(${above.on})` : above.on}`
            return { on, off: `!(${on})` }
        }
        const sourceCode = (el, depth) => { //{ on, off } for what el is linked to, a link source's own link has to be on too, and its orLink is either one
            const a = el.link ? codeOf(el.link, depth) : null
            const b = el.orLink ? codeOf(el.orLink, depth) : null
            if (!a || !b) return a || b
            const on = `${a.on} || ${b.on}`
            return { on, off: `!(${on})` }
        }
        const context = { //for code(el, name, context)
            data,
            nameOf: id => names.get(id),
            isReferenced: id => referenced.has(id) || named.has(id),
            inputs: (el, depth) => depth < 8 ? [el.link, el.orLink].map(id => id ? codeOf(id, depth) : null).filter(Boolean).map(code => code.on) : [], //a gate's inputs, each one's on, depth stops gates linked in a loop
            link(el) { //javascript for when el is on and off, from the trigger it's linked to, and what that's linked to
                let code = sourceCode(el, 0)
                if (!code) return null
                if (el.delay > 0) { //exportElement() declares its delay
                    const on = `${names.get(el.id)}Delay.state(${code.on})`
                    code = { on, off: `!${on}` }
                }
                return el.runs === "while off" ? { on: code.off, off: code.on } : code
            },
        }
        //elements the level's code names run as their code too, so the name is a real variable, and so do any their code names
        const written = new Set(edited.map(el => el.id))
        const named = new Set() //what code names, being edited doesn't name it
        const ids = new Map([...names].map(([id, name]) => [name, id]))
        const seen = new Set()
        const queue = [codeText]
        const textOf = el => levelData.analysisText(levelData.sectionsText(levelData.typeCode(el, names.get(el.id), context)))
        for (const el of edited) if (levelElements.types[el.type]) queue.push(textOf(el))
        while (queue.length) {
            for (const word of levelData.analyzeCode(queue.pop()).references) {
                if (seen.has(word)) continue
                seen.add(word)
                const el = ids.has(word) && levelData.find(data, ids.get(word))
                if (!el || !levelElements.isCodeEditable(el)) continue
                named.add(el.id)
                if (written.has(el.id)) continue
                written.add(el.id)
                queue.push(textOf(el))
            }
        }
        return { names, context, written }
    },
    isTogether: el => !!levelElements.types[el.type]?.codeAll && !el.link && !el.orLink, //written with the others of its type, like mob spots in one list, a linked one spawns on its own
    typeCode(el, name, context) { //an element's { setup, custom, top } for export: its edited code with its variable name now, and the names of the elements it names now, or what its type writes
        if (!el.edited) return levelElements.types[el.type].code(el, name, context)
        const renames = new Map()
        if (name && el.edited.name && name !== el.edited.name) renames.set(el.edited.name, name)
        for (const [id, old] of Object.entries(el.edited.names || {})) {
            const now = context && context.nameOf(Number(id))
            if (now && now !== old) renames.set(old, now)
        }
        const text = renames.size ? levelData.renameCode(el.edited.text, renames) : el.edited.text
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
    editedFunction(text, refNames = [], selfName = "") { //reads one piece of code alone, making it throws a SyntaxError if it can't be read, without running any of it
        const sections = levelData.sectionsOf(text)
        return levelData.codeFunction(refNames, `"use strict";\n${sections.setup.join("\n")}\nreturn ${levelData.layersCode(sections, selfName)}`)
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
        levelData.indexElements(data)
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
        if (runtime.containsPoint?.(point)) return true //something that moves without a body, like a buzzsaw
        return Matter.Query.point(runtime.maps, point).length > 0 || Matter.Query.point(runtime.bodies, point).length > 0
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
                if (data && levelData.isValidName(name)) {
                    try {
                        levelData.store.levels[name] = levelData.normalize({ ...data, name })
                    } catch (error) {
                        console.warn(`couldn't read local level ${name}:`, error) //leave the original storage untouched for recovery
                    }
                }
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
            if (levelData.store.failedKeys.has("localSettings") && localSettings.isAllowed) levelData.store.write("localSettings", localSettings)
            if (isNew) levelData.store.sync()
            return isSaved && !levelData.store.isFailing
        },
        hasWork() { //a local level that's more than the blank one opening the editor saves, the title page shows its editor button
            return levelData.store.names().some(name => {
                if (!/^untitled\d*$/.test(name)) return true
                const data = levelData.store.levels[name]
                const blank = levelData.blank(name)
                const withoutNames = (key, value) => key === "codeName" || key === "codeNameCounts" ? undefined : value
                return JSON.stringify(data, withoutNames) !== JSON.stringify(blank, withoutNames)
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
            if (localSettings.isAllowed) levelData.store.write("localSettings", localSettings) //a pool failure must not interrupt an already saved rename or deletion
        },
    },
}
levelData.store.load()

//*********************************************************************
// the code program, lib/level-parser.js and js/level-program.js, only the level editor and local levels with code need it
// it loads with the editor, or when the page loads if a local level has code, so a normal run never downloads the parser
//*********************************************************************
levelData.loadedScripts = [] //a retry after a failed download only adds the rest, running a file twice would declare its globals twice
levelData.loadScripts = files => Promise.all(files.filter(src => !levelData.loadedScripts.includes(src)).map(src => new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.async = false //in order, each adds to the one before
    script.onload = () => {
        levelData.loadedScripts.push(src)
        resolve()
    }
    script.onerror = () => {
        script.remove()
        reject(new Error(`failed to load ${src}`))
    }
    document.head.appendChild(script)
})))
levelData.programFiles = ["lib/level-parser.js", "js/level-program.js"]
levelData.programPromise = null
levelData.isProgramLoaded = () => typeof levelData.codeLines === "function" //js/level-program.js adds it
levelData.loadProgram = () => {
    if (levelData.isProgramLoaded()) return Promise.resolve()
    if (!levelData.programPromise) {
        levelData.programPromise = levelData.loadScripts(levelData.programFiles).catch(error => {
            levelData.programPromise = null
            throw error
        })
    }
    return levelData.programPromise
}
if (Object.values(levelData.store.levels).some(data => levelData.isShared(data))) levelData.loadProgram().catch(error => console.error(error)) //ready before a run reaches the level

//*********************************************************************
// the level editor before it opens, runs read isActive and the title page shows its button
// its files load the first time it opens, like level2.js, so a normal run never loads them
// js/level-editor.js adds the rest to this object, replacing open() and close()
//*********************************************************************
const levelEditor = {
    isActive: false, //level.start(), m.death(), m.takeDamage(), the autosave, and the mouse lock check it every run
    files: ["js/level-editor-data.js", "js/level-analysis.js", "js/level-editor.js", "js/level-editor-icons.js", "js/level-editor-help.js"], //js/level-editor-mob-pictures.js loads later, see loadMobPictures()
    filesPromise: null,
    isLoaded: false, //every file ran, js/level-editor.js replaces open() before the icons and help files run, so its open() waits for this
    loadFiles() { //all at once, they run in this order, after the code program, see levelData.loadProgram()
        if (levelEditor.isLoaded) return Promise.resolve()
        if (levelEditor.filesPromise) return levelEditor.filesPromise
        levelEditor.filesPromise = levelData.loadProgram().then(() => levelData.loadScripts(levelEditor.files)).then(() => {
            levelEditor.isLoaded = true
        }).catch(error => {
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
