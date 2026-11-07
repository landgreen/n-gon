"use strict";
//level editor, opened with the button next to level pool in settings
//it's a run of the game on a local level, so the player can move, jump, and use testing mode (T) while editing
//  levelElements: what can be placed, levelData: building, capturing, and saving levels
//  hooks into the game: level.start() calls levelEditor.startLevel(), m.death() calls levelEditor.respawn(),
//  simulation.splashReturn() calls levelEditor.close(), mouseMove.wantsLock() is false while it's open
//it loads the first time the editor opens, levelEditor starts as the small object at the bottom of js/level-data.js, this adds the rest
//see docs/level-editor.md
Object.assign(levelEditor, {
    isActive: false,
    data: null, //the level being edited, the same object as levelData.data
    selection: [], //element ids
    tool: "select",
    toolTips: { select: "select, mouse 2", pan: "pan, mouse 3, double click to teleport" }, //the status bar's tool buttons, the mouse button that does it with any tool
    tools: ["select", "pan", "map", "block", "measure"], //the draw tool, map and block draw new rects, select only selects and moves, measure draws a ruler with jump reach, pan moves the view without a middle mouse button, the right mouse button always selects
    measure: null, //{ start, end } the measure tool's ruler, it stays until the next one
    timeScale: 1, //simulation menu, under 1 lowers the frame cap, over 1 takes extra game steps a frame, see applyTimeScale()
    isTimeScaled: false,
    isTimeStopped: false, //simulation menu's stop time button, everything but the player freezes, like the game's time stop, not remembered
    isTimeFrozen: false, //applyTimeScale() froze it, so it knows to wake everything
    debugDraw: new Set(), //simulation menu's draw toggles, like "wireframe" and "bounds"
    grid: 25, //snap size, hold alt to place freely
    isGridShown: true,
    isSmartSnap: true, //edges and middles snap to other elements' edges and middles, the status bar's snap button, remembered
    snapReach: 8, //screen pixels, how close an edge has to be to snap
    isFree: false, //alt is held
    drag: null, //{ kind: "move" | "handle" | "draw" | "box" | "pan", ... } while the left or middle mouse button is held
    hoverId: null,
    isTesting: false, //start test restarts the level like a run, stop test restarts it for editing
    testSeed: "", //simulation menu, Math.seed for each level start, so tests spawn the same, empty keeps it random
    spawnLists: null, //the mob and boss lists in their first order, a seeded test reshuffles them from it
    isMouseLook: false, //simulation menu's mouse look button, the camera leans toward the mouse with no smoothing, off it stays on the player, remembered in localStorage
    isCamera: false, //the simulation menu's camera button, the player hides and stops colliding, WASD or the arrows fly the view, see flyCamera(), not remembered
    cameraAnchor: null, //where the hidden player is held while the camera flies
    cameraVelocity: { x: 0, y: 0 }, //the flying camera eases in and out
    cameraSaved: null, //{ draw, mask } the player's m.draw and collision mask to put back
    isFast: false, //shift is held, the camera flies faster
    isInvincible: true, //simulation menu, the player takes no damage while editing and testing, see m.takeDamage(), remembered in localStorage
    isFullTest: false, //JS test plays the level's export JS like a run, with the panels still open, editing anything goes back to editing
    isTestSpawning: true, //the simulation menu's mobs button, mobs and power ups spawn while testing, never while editing so it isn't a fight
    testLevel: 5, //level.levelsCleared while editing, for mob types, difficulty, and damage, at 0 random mobs don't spawn
    vertex: null, //{ id, active, error } while editing a map or block's vertices, active is the clicked vertex, error is why typed vertices didn't work
    pathDraw: null, //{ points, handles, forId, forKey } while drawing a path, see the drawPath command, forId is the element whose ref prop forKey gets the path when it's done (drawRef)
    hiddenTypes: new Set(), //the explorer's hide, hidden elements aren't built while editing, tests show them
    hiddenIds: new Set(),
    lockedTypes: new Set(), //the explorer's lock, the mouse goes through locked elements, the explorer still selects them
    lockedIds: new Set(),
    problems: new Map(), //element id: the analysis lines about it, outlined in the level
    isAnalysisShown: false, //the inspector shows the analysis, see inspectAnalysis()
    isAnalysisJump: false,
    analysisReport: null, //the last analysis, kept up to date by countProblems()
    analysisCursor: new Map(), //an analysis line's ids: which one it went to last
    paletteDrag: null, //{ command, arg, x, y, isDragging, isListed } dragging an add button onto the level
    isPanelsHidden: false, //tab hides the panels
    isHistoryOpen: false, //the history list over undo and redo in the status bar
    statusMouse: "", //what the status bar shows for the mouse
    problemTimer: null,
    problemText: "",
    problemIsFix: false, //the status bar's analysis count, a moment after changes stop
    codeEditing: null, //id of the code element open in the code panel, "level" for the level code popped out, or "element:12" for an element's code popped out
    fileRequest: 0, //invalidate pending file reads when their panel closes or changes
    pendingImport: null, //{ text, data } a pasted level waiting on the import warning, data is null without a level editor line, see confirmImport()
    picking: null, //{ id, key, isLink } while picking an element by clicking it, for a ref prop, or isLink to link it to button id
    preview: null, //{ owner, key, value } while a color picker is open, value is the color to put back before the change is saved
    scrub: null, //{ input, key, owner, panel, prop, x, start, isScrubbing, startStep } dragging a number field or its name left or right, see scrubStart()
    clipboard: [],
    history: { steps: [], index: 0 }, //{ label, json } of the level after each change, steps[index] is now, later steps were undone
    historyLimit: 200,
    pan: { x: 0, y: 0 }, //camera offset from the player
    zoomScale: 1400, //simulation.zoomScale to use when the level restarts, data.zoom is for runs
    gameCamera: null, //simulation.camera while the editor replaces it
    saveTimer: null,
    inspected: "", //what the inspector is showing, so it only redraws when that changes
    nameError: "", //why the last name typed wasn't used, shown under the level's properties
    exploreSearch: "", //the explorer's search box
    exploreLimits: {}, //type: how many the explorer lists, 100 to start, show more adds 100
    addTab: "", //which of the add menu's lists is open, one at a time, "" is none, see addLists()
    recentAdds: [], //the add args in the row above the list buttons, picked from the lists, empty is the defaults, see recentAddSlots()
    recentAddNext: 0, //which slot of that row the next new pick replaces
    mobIcons: null, //mob name: a little svg of it for the mobs list, drawn from the saved pictures, see loadMobPictures()
    mobPictureData: null, //js/level-editor-mob-pictures.js sets it, each mob's saved outlines, colors, and lines
    isLoadingMobPictures: false,
    mobShapes: {}, //mob name: { shapes, links, orbs } it was drawn from, to draw it again at other sizes, like the mob and boss buttons' examples

    //*********************************************************************
    // opening and closing
    //*********************************************************************
    async open() {
        if (!levelEditor.isLoaded) { //clicked again while the icons and help files are still downloading, or after one failed
            try {
                await levelEditor.loadFiles()
            } catch (error) {
                return console.error(error)
            }
        }
        if (simulation.isStartingGame || levelEditor.isActive) return
        const data = levelData.store.getRecent() || levelData.blank(levelData.freeName("untitled"))
        levelData.store.save(data)
        levelEditor.reset(data)
        levelEditor.isInvincible = levelEditor.recall("levelEditorInvincible", true) !== false //on unless it was turned off
        levelEditor.isTestSpawning = levelEditor.recall("levelEditorMobs", true) !== false
        const addTab = levelEditor.recall("levelEditorAddTab", "")
        levelEditor.addTab = levelEditor.addTabs.some(([name]) => name === addTab) ? addTab : ""
        const recentAdds = levelEditor.recall("levelEditorRecentAdd", null)
        levelEditor.recentAdds = Array.isArray(recentAdds?.slots) ? recentAdds.slots : []
        levelEditor.recentAddNext = Number.isInteger(recentAdds?.next) ? recentAdds.next : 0
        const testLevel = Number(levelEditor.recall("levelEditorTestLevel", 5))
        if (Number.isFinite(testLevel) && testLevel >= 0) levelEditor.testLevel = Math.min(30, Math.round(testLevel))
        levelEditor.isMouseLook = levelEditor.recall("levelEditorMouseLook", false) === true //the simulation menu's settings, remembered for next time
        const layers = levelEditor.recall("levelEditorDebugDraw", [])
        levelEditor.debugDraw = new Set(Array.isArray(layers) ? layers.filter(name => levelEditor.debugLayers.some(([layer]) => layer === name)) : [])
        const grid = Number(levelEditor.recall("levelEditorGrid", 25))
        if (Number.isFinite(grid) && grid >= 1) levelEditor.grid = Math.round(grid)
        levelEditor.isGridShown = levelEditor.recall("levelEditorGridShown", true) !== false
        levelEditor.isSmartSnap = levelEditor.recall("levelEditorSmartSnap", true) !== false
        levelEditor.isActive = true
        await simulation.startGame() //the first level start calls levelEditor.startLevel() instead of loading initial
        if (simulation.onTitlePage) levelEditor.isActive = false //startGame failed
    },
    catchUpEditedCode(data) { //settings its code doesn't have yet go in it, an older version could lose them
        const names = levelData.codeNames(data)
        for (const el of data.elements) {
            if (!el.edited || !levelElements.types[el.type]) continue
            try {
                levelData.catchUpEdited(el, names)
            } catch (error) { } //the code stays what it is
        }
    },
    reset(data) {
        levelEditor.catchUpEditedCode(data)
        levelEditor.data = data
        levelEditor.selection = []
        levelEditor.history = { steps: [{ label: `open ${data.name}`, json: JSON.stringify(data) }], index: 0 }
        levelEditor.pan = { x: 0, y: 0 }
        levelEditor.zoomScale = data.zoom
        levelEditor.drag = null
        levelEditor.vertex = null
        levelEditor.pathDraw = null
        levelEditor.preview = null
        levelEditor.picking = null
        levelEditor.whole = null
        levelEditor.codeEditing = null //a code draft belongs to the level it was opened in, switching levels closes it
        levelEditor.run("closeCode")
        levelEditor.codeDraft = null
        levelEditor.hiddenIds.clear() //ids are only the same within a level
        levelEditor.lockedIds.clear()
        levelEditor.problems = new Map()
        clearTimeout(levelEditor.problemTimer)
        levelEditor.analysisReport = null
        levelEditor.problemText = ""
        levelEditor.problemIsFix = false
    },
    startLevel() { //called by level.start() in place of level.load()
        const data = levelEditor.data
        level.levels = [data.name]
        level.onLevel = 0
        simulation.isCheating = true //editing isn't a run, so it doesn't count, store tech, or show the training choice at the exit
        simulation.isAutoZoom = false
        level.levelsCleared = levelEditor.testLevel //saveGame.autosave() skips the editor, so this doesn't make a checkpoint
        level.updateDifficulty()
        const random = Math.random
        const isSeeded = levelEditor.testSeed !== ""
        if (isSeeded) { //the seed makes the level's start the same each test: mob types, which spots get mobs, bosses, power ups, and debris, what mobs do after is still random
            Math.seed = Math.abs(Math.hash(levelEditor.testSeed))
            let seed = Math.seed
            Math.random = () => { //Math.seededRandom's numbers, only while the level is built
                seed = (seed * 9301 + 49297) % 233280
                return seed / 233280
            }
        }
        try {
            if (isSeeded) { //like a run from this seed reaching this level: the mob and boss lists from their first order, shuffled by the seed, then a new mob type each level
                if (!levelEditor.spawnLists) levelEditor.spawnLists = { tier: spawn.tier.map(list => list.slice()), bossTier: spawn.bossTier.map(list => list.slice()) } //seededShuffle shuffles them in place, each test starts from the same order
                levelEditor.spawnLists.tier.forEach((list, i) => spawn.tier[i].splice(0, Infinity, ...list))
                levelEditor.spawnLists.bossTier.forEach((list, i) => spawn.bossTier[i].splice(0, Infinity, ...list))
                spawn.bossTierIndex = spawn.bossTierIndex.map(() => 0)
                spawn.setMobTypeSpawnOrder()
                for (let i = 0; i <= level.levelsCleared; i++) spawn.setSpawnList()
            } else {
                spawn.setSpawnList() //new mob types each restart, like a new level
            }
            if (!levelEditor.gameCamera) levelEditor.gameCamera = simulation.camera
            if (levelEditor.isFullTest) {
                levelEditor.startFullTest(data)
            } else {
                levelData.isSkipped = el => !levelEditor.isTesting && levelEditor.isHidden(el) //the explorer's hide, tests show everything
                levelData.play(data, { isEditor: true, isSpawning: levelEditor.isTesting && levelEditor.isTestSpawning })
                simulation.setZoom(levelEditor.zoomScale)
                simulation.camera = levelEditor.camera
                m.look = levelEditor.look
            }
        } finally {
            Math.random = random
        }
        levelEditor.loadMobPictures() //once, for the mobs list's pictures
        level.disableExit = true //the exit charges, but doesn't leave
        simulation.removeEphemera("levelEditor", true)
        simulation.ephemera.push({ name: "levelEditor", do() { if (!simulation.isTimeSkipping) levelEditor.frame() } }) //2× time's extra steps aren't drawn
        document.body.classList.add("level-editor")
        levelEditor.updatePanels()
        levelEditor.renderLeft()
        levelEditor.renderRight()
    },
    close() { //also called by simulation.splashReturn()
        if (!levelEditor.isActive) return
        levelEditor.flush()
        clearTimeout(levelEditor.problemTimer)
        levelEditor.setCamera(false, false)
        levelEditor.isActive = false
        levelEditor.isFullTest = false
        levelEditor.isTimeStopped = false
        levelEditor.applyTimeScale() //back to normal time, frame() won't run again
        levelEditor.isPanelsHidden = false
        levelEditor.updatePanels()
        levelEditor.drag = null
        levelData.isEditor = false
        levelData.isSkipped = () => false
        document.body.classList.remove("level-editor")
        levelEditor.run("closeCode")
        if (levelEditor.gameCamera) simulation.camera = levelEditor.gameCamera
        levelEditor.gameCamera = null
        m.look = m.lookDefault
        simulation.removeEphemera("levelEditor", true)
    },
    restart(isKeepView = true) { //clears and rebuilds the whole level, and puts the player at the spawn
        levelEditor.flush()
        if (isKeepView) levelEditor.zoomScale = simulation.zoomScale
        levelEditor.drag = null
        simulation.clearNow = true
    },
    fullTestSession: null,
    startFullTest(data) { //guard only the editor's test session, exported levels keep their ordinary callbacks
        levelData.unbuildAll()
        levelData.isEditor = false
        simulation.camera = levelEditor.gameCamera
        m.look = m.lookDefault
        const session = levelEditor.fullTestSession = { stopped: false, effects: new Set(simulation.ephemera) }
        const isCurrent = () => levelEditor.isFullTest && levelEditor.fullTestSession === session && !session.stopped
        const fail = error => {
            if (!isCurrent()) return
            session.stopped = true
            simulation.inGameConsole(`<em>//test export stopped, ${levelEditor.escape(error.message)}</em>`)
            level.custom = level.customTopLayer = () => { }
            levelEditor.stopFullTest()
        }
        const guard = fn => function (...args) {
            if (!isCurrent()) return
            try {
                return fn.apply(this, args)
            } catch (error) {
                fail(error)
            } finally {
                guardEffects()
            }
        }
        const guardEffects = () => { //also catches effects added later by a guarded callback
            for (const effect of simulation.ephemera) {
                if (session.effects.has(effect)) continue
                session.effects.add(effect)
                if (typeof effect.do === "function") effect.do = guard(effect.do)
            }
        }
        try {
            const maps = levelData.codeFunction([], `return { ${levelData.code(data).trim().replace(/,\s*$/, "")} }`)()
            levelData.trackEphemera(() => Object.values(maps)[0].call(level))
            level.custom = guard(level.custom)
            level.customTopLayer = guard(level.customTopLayer)
        } catch (error) {
            fail(error)
        } finally {
            guardEffects()
        }
    },
    stopFullTest() { //back to editing, the level restarts from its elements
        if (!levelEditor.isFullTest) return
        levelEditor.isFullTest = false
        levelEditor.fullTestSession = null
        levelEditor.updatePanels()
        levelEditor.renderLeft()
        levelEditor.restart()
    },
    respawn() { //called by m.death(), dying while editing sends the player back to the spawn
        m.health = m.maxHealth
        m.displayHealth()
        m.immuneCycle = m.cycle + 60
        levelEditor.toSpawn()
        simulation.inGameConsole(`<em>//respawned</em>`)
    },
    middleClickTimer: null,
    middleClickPoint: null,
    middleClick(point, isTool = false) { //a middle click centers on the player, a middle double click teleports the player, so the first click waits to see if there's a second, the pan tool's click only teleports on a double click
        if (levelEditor.middleClickTimer) {
            clearTimeout(levelEditor.middleClickTimer)
            levelEditor.middleClickTimer = null
            if (!levelEditor.isFullTest) levelEditor.teleport(levelEditor.middleClickPoint) //where the first click was, before anything moved
            return
        }
        levelEditor.middleClickPoint = point
        levelEditor.middleClickTimer = setTimeout(() => {
            levelEditor.middleClickTimer = null
            if (!isTool) levelEditor.pan = { x: 0, y: 0 }
        }, 300)
    },
    teleport(point) { //middle double click, pan tool double click, or mouse 4 or 5, the player goes there, or in camera mode the camera does
        if (levelEditor.isCamera) {
            levelEditor.pan = { x: point.x - m.pos.x, y: point.y - m.pos.y }
            return
        }
        Matter.Body.setPosition(player, point)
        Matter.Body.setVelocity(player, { x: 0, y: 0 })
        m.resetHistory()
    },
    toSpawn() {
        const where = levelEditor.data.elements.find(el => el.type === "spawn") || m.spawnPos //a level's code can set the spawn itself
        Matter.Body.setPosition(player, { x: where.x, y: where.y })
        Matter.Body.setVelocity(player, { x: 0, y: 0 })
        m.resetHistory()
    },

    //*********************************************************************
    // changing the level, every change goes through edit() so it can be undone, saved, and rebuilt
    //*********************************************************************
    edit(label, change) { //change(data) changes the data and returns the ids of elements to rebuild, label is its name in the history menu
        const before = JSON.stringify(levelEditor.data)
        const ids = change(levelEditor.data) || []
        return levelEditor.commit(label, before, ids)
    },
    keepCodeWithSettings(before) { //settings changed on elements with edited code, the code changes too
        const data = levelEditor.data
        if (!data.elements.some(el => el.edited)) return
        const old = JSON.parse(before)
        const names = levelData.codeNames(old)
        const same = el => JSON.stringify({ ...el, edited: null })
        let kept = 0
        for (const el of data.elements) {
            const was = el.edited && levelData.find(old, el.id)
            if (!was || !was.edited || was.type !== el.type || JSON.stringify(was.edited) !== JSON.stringify(el.edited) || same(was) === same(el)) continue
            try {
                kept += levelData.mergeSettings(was, el, names)
            } catch (error) {
                kept++
            }
        }
        if (kept) simulation.inGameConsole(`<em>//${kept} setting${kept === 1 ? " is" : "s are"} in edited code that was typed over, the code stays, change it there</em>`)
    },
    commit(label, before, ids) {
        levelData.codeNames(levelEditor.data) //allocate names before saving the undo step
        levelEditor.keepCodeWithSettings(before)
        const json = JSON.stringify(levelEditor.data)
        if (json === before) return false
        const isFullTest = levelEditor.isFullTest
        if (isFullTest) ids = [] //the level is the export JS right now, editing goes back to building it from elements
        const history = levelEditor.history
        history.steps.length = history.index + 1 //a new change replaces anything that was undone
        history.steps.push({ label, json })
        if (history.steps.length > levelEditor.historyLimit) history.steps.shift()
        history.index = history.steps.length - 1
        levelData.indexElements(levelEditor.data)
        const isCode = levelEditor.isCodeChange(ids)
        if (!isCode) levelData.rebuild(ids)
        levelEditor.changed()
        levelEditor.refreshWholeCode()
        if (isFullTest) return levelEditor.stopFullTest() || true
        if (isCode) levelEditor.restart() //code runs once in order with the rest of the level, so the whole level runs again
        return true
    },
    isCodeChange(ids) { //something that runs as code changed, was added, or was removed: a code element, an edited element, or one that code names
        const data = levelEditor.data
        if (ids === "all") return levelData.isShared(data) //everything rebuilds, a level with code runs again
        if (levelData.isShared(data) && levelData.sharedElementIds && JSON.stringify(levelData.sharedElementIds) !== JSON.stringify(data.elements.map(el => el.id))) return true
        const written = levelData.isShared(data) ? levelData.codeNames(data).written : new Set()
        const isUnderTyped = id => levelData.typedOf(data).some(block => block.runsAfter === id) //it stops running if what it's under goes, it runs in the right place once the level starts again
        return ids.some(id => levelElements.types[levelData.find(data, id)?.type]?.isCode || written.has(id) || levelData.runtimes.get(id)?.isCode || isUnderTyped(id))
    },
    refresh(ids) { //shows a change that isn't saved, like a preview or hiding, code only runs with the whole level
        if (levelEditor.isCodeChange(ids)) levelEditor.restart()
        else levelData.rebuild(ids)
    },
    describe(elements) { //for history labels, one element with where it is, or how many of each type
        if (elements.length === 1) return levelElements.summary(elements[0])
        const counts = {}
        for (const el of elements) counts[el.type] = (counts[el.type] || 0) + 1
        return Object.keys(counts).map(type => `${counts[type]} ${levelElements.nameOf(type)}`).join(", ")
    },
    changed() {
        levelEditor.selection = levelEditor.selection.filter(id => levelData.find(levelEditor.data, id))
        if (levelEditor.vertex && !levelEditor.vertexElement()) levelEditor.vertex = null
        levelEditor.save()
        levelEditor.refreshRight()
        levelEditor.refreshFields()
        levelEditor.updateHistoryButtons()
        levelEditor.renderExplorer()
        levelEditor.countProblems()
    },
    undo() {
        levelEditor.rewind(levelEditor.history.index - 1)
    },
    redo() {
        levelEditor.rewind(levelEditor.history.index + 1)
    },
    rewind(index) { //go to any step in the history, undo and redo are one step
        const history = levelEditor.history
        if (index < 0 || index >= history.steps.length || index === history.index) return
        history.index = index
        const data = JSON.parse(history.steps[index].json)
        data.name = levelEditor.data.name //renaming isn't undone, the name is where the level is saved
        const isLevelCodeChanged = data.levelCode !== levelEditor.data.levelCode || JSON.stringify(data.typedCode) !== JSON.stringify(levelEditor.data.typedCode)
        const old = new Map(levelEditor.data.elements.map(el => [el.id, JSON.stringify(el)]))
        const ids = data.elements.filter(el => old.get(el.id) !== JSON.stringify(el)).map(el => el.id) //only rebuild what's different, so blocks that weren't changed stay where they were pushed
        for (const id of old.keys()) if (!levelData.find(data, id)) ids.push(id)
        levelEditor.data = levelData.data = data
        levelData.indexElements(data)
        levelEditor.applyLevelProps()
        if (levelEditor.isFullTest) { //the level is the export JS right now
            levelEditor.changed()
            return levelEditor.stopFullTest()
        }
        const isCode = isLevelCodeChanged || levelEditor.isCodeChange(ids)
        if (!isCode) levelData.rebuild(ids)
        levelEditor.changed()
        levelEditor.refreshWholeCode()
        if (isCode) levelEditor.restart()
    },
    applyLevelProps() { //level properties show right away
        levelData.applySettings(levelEditor.data)
        levelEditor.refreshFields()
    },
    setData(data) { //switch to another level
        levelEditor.flush()
        levelData.store.save(data)
        levelEditor.reset(data)
        levelEditor.renderLeft()
        levelEditor.restart(false)
    },
    save() { //soon, so dragging and typing don't write to localStorage every change
        clearTimeout(levelEditor.saveTimer)
        levelEditor.saveTimer = setTimeout(levelEditor.flush, 300)
    },
    flush() {
        if (levelEditor.saveTimer === null) return
        clearTimeout(levelEditor.saveTimer)
        levelEditor.saveTimer = null
        if (levelEditor.data) levelData.store.save(levelEditor.data)
    },

    //*********************************************************************
    // selection
    //*********************************************************************
    withGroups(ids) { //ids and everything grouped with them
        const groups = new Set(levelEditor.data.elements.filter(el => ids.includes(el.id) && el.group).map(el => el.group))
        return groups.size ? [...new Set(ids.concat(levelEditor.data.elements.filter(el => groups.has(el.group)).map(el => el.id)))] : ids
    },
    newGroupId(data) {
        return Math.max(0, ...data.elements.map(el => el.group || 0)) + 1
    },
    select(ids) {
        levelEditor.nameError = ""
        if (!levelEditor.isAnalysisJump) levelEditor.isAnalysisShown = false //selecting something goes back to its props, clicking an analysis line keeps the analysis
        levelEditor.selection = ids
        if (levelEditor.vertex && !(ids.length === 1 && ids[0] === levelEditor.vertex.id)) levelEditor.vertex = null //selecting something else ends vertex editing
        levelEditor.renderRight()
    },
    selectedParts() { //what's selected that's in the level, not code, flip, align, and draw order skip code
        return levelEditor.selected().filter(el => !levelElements.isCode(el))
    },
    selected() {
        return levelEditor.selection.map(id => levelData.find(levelEditor.data, id)).filter(Boolean)
    },
    isSingleton(el) {
        return !!levelElements.types[el.type]?.isSingleton
    },
    isCopyable(el) { //code can't be copied, its variables would be declared twice
        return !levelEditor.isSingleton(el) && !levelElements.isCode(el)
    },
    isLocked(el) { //the explorer's lock, the mouse goes through it
        return levelEditor.lockedTypes.has(el.type) || levelEditor.lockedIds.has(el.id)
    },
    isHideable(el) { //not the spawn and exit, the level needs them, or code, code after it could need it
        const type = levelElements.types[el.type]
        return !!type && type.group !== "core" && !type.isCode
    },
    isHidden(el) { //the explorer's hide, not built while editing
        return levelEditor.isHideable(el) && (levelEditor.hiddenTypes.has(el.type) || levelEditor.hiddenIds.has(el.id))
    },
    runAnalysis() { //with what the editor measures while the level runs, and what the explorer hides
        return levelAnalysis.run(levelEditor.data, { isLive: true, hidden: levelEditor.data.elements.filter(levelEditor.isHidden) })
    },
    elementAt(point, isPicking = false) { //the smallest element under point, so things on top of big map pieces can be picked, isPicking only looks at what a ref prop can pick, so a path can be picked where it crosses a map, even with background colors locked
        let best = null
        let bestArea = Infinity
        for (const el of levelEditor.data.elements) {
            if (isPicking ? !levelEditor.canPick(el) || levelEditor.isHidden(el) : levelEditor.isLocked(el) || levelEditor.isHidden(el)) continue
            if (!levelElements.contains(el, point) && !levelData.runtimeContains(el.id, point)) continue
            const b = levelElements.bounds(el)
            const area = levelElements.types[el.type]?.pickArea?.(el) ?? b.width * b.height
            if (area <= bestArea) { //ties go to the later element, it's drawn on top
                best = el
                bestArea = area
            }
        }
        return best
    },
    rotateHandle(el) { //a round handle above the element, drag it to turn
        if (!levelElements.isRotatable(el)) return null
        const b = levelElements.bounds(el)
        return { x: b.x + b.width / 2, y: b.y - levelEditor.px(28) }
    },
    dragTurn(drag) { //degrees the rotate handle has turned, in 15° steps unless alt is held
        const point = levelEditor.mouse()
        const angle = (Math.atan2(point.y - drag.pivot.y, point.x - drag.pivot.x) - Math.atan2(drag.from.y - drag.pivot.y, drag.from.x - drag.pivot.x)) * 180 / Math.PI
        const turn = ((angle % 360) + 540) % 360 - 180
        return levelEditor.isFree ? Number(turn.toFixed(1)) : Math.round(turn / 15) * 15
    },
    handleAt(el, point) {
        const reach = levelEditor.px(7)
        return levelElements.handles(el).find(h => Math.abs(h.x - point.x) < reach && Math.abs(h.y - point.y) < reach)
    },

    //*********************************************************************
    // coordinates
    //*********************************************************************
    px(pixels) { //screen pixels to map units
        return pixels / simulation.zoom
    },
    mouse() { //map position under the mouse right now, simulation.mouseInGame is from the start of the cycle
        return {
            x: (simulation.mouse.x - canvas.width2) / simulation.zoom + canvas.width2 - m.transX,
            y: (simulation.mouse.y - canvas.height2) / simulation.zoom + canvas.height2 - m.transY,
        }
    },
    snap(value) {
        const size = levelEditor.isFree ? 1 : levelEditor.grid
        return Math.round(value / size) * size
    },
    snapPoint(point) {
        return { x: levelEditor.snap(point.x), y: levelEditor.snap(point.y) }
    },
    viewBounds() { //the part of the level on screen, in map units
        const x = (0 - canvas.width2) / simulation.zoom + canvas.width2 - m.transX
        const y = (0 - canvas.height2) / simulation.zoom + canvas.height2 - m.transY
        return { x, y, width: canvas.width / simulation.zoom, height: canvas.height / simulation.zoom }
    },
    snapTargets(drag) { //the edges and middles a drag can snap to, worked out once a drag, snappable pieces on screen but what's dragged, so far off pieces don't add guides
        if (!drag.snapTargets) {
            const view = levelEditor.viewBounds()
            const skip = new Set(drag.kind === "move" ? drag.originals.map(el => el.id) : drag.id !== undefined ? [drag.id] : [])
            const targets = { x: [], y: [] }
            for (const el of levelEditor.data.elements) {
                if (skip.has(el.id) || !levelElements.isSnappable(el) || levelEditor.isHidden(el)) continue
                const b = levelElements.bounds(el)
                if (b.x > view.x + view.width || b.y > view.y + view.height || b.x + b.width < view.x || b.y + b.height < view.y) continue
                for (const x of [b.x, b.x + b.width / 2, b.x + b.width]) targets.x.push({ value: x, from: b.y, to: b.y + b.height })
                for (const y of [b.y, b.y + b.height / 2, b.y + b.height]) targets.y.push({ value: y, from: b.x, to: b.x + b.width })
            }
            drag.snapTargets = targets
        }
        return drag.snapTargets
    },
    nearestSnap(values, targets) { //how far to shift so one of values lands on the closest target, or null when none are in reach
        let best = null
        const reach = levelEditor.px(levelEditor.snapReach)
        for (const value of values) {
            for (const target of targets) {
                const offset = target.value - value
                if (Math.abs(offset) <= reach && (best === null || Math.abs(offset) < Math.abs(best))) best = offset
            }
        }
        return best
    },
    isSnapping(drag) { //drawing a map or block, the ruler, or dragging only snappable pieces, mobs and power ups stay on the grid
        if (!levelEditor.isSmartSnap || levelEditor.isFree || !drag) return false
        if (drag.kind === "draw" || drag.kind === "measure") return true
        const dragged = drag.kind === "move" ? drag.originals : [levelData.find(levelEditor.data, drag.id)]
        return dragged.every(el => el && levelElements.isSnappable(el))
    },
    smartPoint(point, drag) { //a point snapped to the nearest edge or middle in reach, each axis on its own, the grid if there's none
        const snapped = levelEditor.snapPoint(point)
        if (!levelEditor.isSnapping(drag)) return snapped
        const targets = levelEditor.snapTargets(drag)
        const dx = levelEditor.nearestSnap([point.x], targets.x)
        const dy = levelEditor.nearestSnap([point.y], targets.y)
        return { x: dx === null ? snapped.x : point.x + dx, y: dy === null ? snapped.y : point.y + dy }
    },
    smartMove(drag, point) { //how far a move drag moves, the grid, then shifted so the selection's edges or middle land on another's
        let dx = levelEditor.snap(point.x - drag.start.x)
        let dy = levelEditor.snap(point.y - drag.start.y)
        if (!levelEditor.isSnapping(drag)) return { dx, dy }
        const targets = levelEditor.snapTargets(drag)
        const b = levelElements.unionBounds(drag.originals)
        const rawX = point.x - drag.start.x
        const rawY = point.y - drag.start.y
        const sx = levelEditor.nearestSnap([b.x + rawX, b.x + b.width / 2 + rawX, b.x + b.width + rawX], targets.x)
        const sy = levelEditor.nearestSnap([b.y + rawY, b.y + b.height / 2 + rawY, b.y + b.height + rawY], targets.y)
        if (sx !== null) dx = rawX + sx
        if (sy !== null) dy = rawY + sy
        return { dx, dy }
    },
    snapGuides(drag, b) { //lines along the edges and middles of b that line up with another element's, from one to the other
        if (!levelEditor.isSnapping(drag)) return []
        const targets = levelEditor.snapTargets(drag)
        const lines = []
        const along = (values, list, axis, from, to) => {
            for (const value of new Set(values)) { //a point's edges and middle are the same line
                const hits = list.filter(target => Math.abs(target.value - value) < 0.01)
                if (hits.length) lines.push({ axis, value, from: Math.min(from, ...hits.map(t => t.from)), to: Math.max(to, ...hits.map(t => t.to)) })
            }
        }
        along([b.x, b.x + b.width / 2, b.x + b.width], targets.x, "x", b.y, b.y + b.height)
        along([b.y, b.y + b.height / 2, b.y + b.height], targets.y, "y", b.x, b.x + b.width)
        return lines
    },
    viewCenter() {
        return { x: m.pos.x + levelEditor.pan.x, y: m.pos.y + levelEditor.pan.y }
    },
    look() { //replaces m.look, static follows the player without leaning toward the mouse, so moving to a panel doesn't move the view
        if (levelEditor.isCamera) levelEditor.flyCamera()
        m.angle = Math.atan2(simulation.mouseInGame.y - m.pos.y, simulation.mouseInGame.x - m.pos.x)
        const scale = levelEditor.lookScale()
        m.transSmoothX = canvas.width2 - m.pos.x - levelEditor.pan.x - (simulation.mouse.x - canvas.width2) * scale
        m.transSmoothY = canvas.height2 - m.pos.y - levelEditor.pan.y - (simulation.mouse.y - canvas.height2) * scale
        m.transX = m.transSmoothX
        m.transY = m.transSmoothY
    },
    lookScale() { //how far the view leans toward the mouse, mouse look leans right away with no smoothing, like the motion sickness tech
        return levelEditor.isMouseLook ? 1.2 : 0
    },
    drawNothing() { }, //m.draw while the camera flies, the player is hidden
    setCamera(isOn, isDrop = true) { //camera mode on or off, off drops the player in the middle of the view unless that's inside the map
        if (isOn === levelEditor.isCamera) return
        levelEditor.isCamera = isOn
        if (levelEditor.isActive) levelEditor.renderStatus() //the status bar's ghost lights up
        if (isOn) {
            levelEditor.cameraSaved = { draw: m.draw, mask: player.collisionFilter.mask }
            levelEditor.cameraAnchor = { x: player.position.x, y: player.position.y }
            levelEditor.cameraVelocity = { x: 0, y: 0 }
            if (m.isHolding) m.drop()
            levelEditor.flyCamera()
            return
        }
        const saved = levelEditor.cameraSaved
        if (m.draw === levelEditor.drawNothing) m.draw = saved.draw
        player.collisionFilter.mask = saved.mask
        levelEditor.cameraSaved = levelEditor.cameraAnchor = null
        if (!isDrop) return
        const to = levelEditor.viewCenter()
        if (Matter.Query.point(map, to).length) { //it would be stuck, the player stays and the view goes back to it
            levelEditor.pan = { x: 0, y: 0 }
            return simulation.inGameConsole(`<em>//the middle of the view is inside the map, the player stayed where it was</em>`)
        }
        levelEditor.teleport({ x: to.x, y: to.y + player.position.y - m.pos.y }) //m.pos isn't the body's center, so the view doesn't move
        levelEditor.pan = { x: 0, y: 0 }
    },
    flyCamera() { //each frame in camera mode, from look(): the player stays hidden where it was with no collisions or damage, WASD or the arrows move the view, shift is faster
        let anchor = levelEditor.cameraAnchor
        if (Vector.magnitude(Vector.sub(player.position, anchor)) > 100) { //a restart or respawn moved the player, the view stays where it is
            levelEditor.pan.x += anchor.x - player.position.x
            levelEditor.pan.y += anchor.y - player.position.y
            anchor = levelEditor.cameraAnchor = { x: player.position.x, y: player.position.y }
        }
        Matter.Body.setPosition(player, anchor)
        Matter.Body.setVelocity(player, { x: 0, y: 0 })
        if (m.draw !== levelEditor.drawNothing) { //a new skin or level start can set them again
            levelEditor.cameraSaved.draw = m.draw
            m.draw = levelEditor.drawNothing
        }
        if (player.collisionFilter.mask) {
            levelEditor.cameraSaved.mask = player.collisionFilter.mask
            player.collisionFilter.mask = 0
        }
        m.immuneCycle = m.cycle + 10
        input.fire = input.field = false //no guns or field from where it's hidden
        const speed = canvas.height / simulation.zoom * (levelEditor.isFast ? 0.03 : 0.012) / (levelEditor.isTimeStopped ? 1 : Math.min(1, levelEditor.timeScale)) //a screen in about a second and a half at any zoom, slow motion doesn't slow it, this runs once a frame, so 2× time doesn't speed it up
        const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
        const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0)
        const length = Math.hypot(dx, dy) || 1
        const v = levelEditor.cameraVelocity
        v.x += (dx / length * speed - v.x) * 0.2
        v.y += (dy / length * speed - v.y) * 0.2
        levelEditor.pan.x += v.x
        levelEditor.pan.y += v.y
    },
    camera() { //replaces simulation.camera, without zooming out when the mouse is near the edge
        simulation.edgeZoomOutSmooth = 1
        ctx.save()
        ctx.translate(canvas.width2, canvas.height2)
        ctx.scale(simulation.zoom, simulation.zoom)
        ctx.translate(-canvas.width2 + m.transX, -canvas.height2 + m.transY)
        simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom + canvas.width2 - m.transX
        simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom + canvas.height2 - m.transY
    },
    zoom(scale) { //keeps the spot under the mouse still
        const before = levelEditor.mouse()
        levelEditor.zoomScale = Math.min(30000, Math.max(200, scale))
        simulation.setZoom(levelEditor.zoomScale)
        levelEditor.pan.x = before.x - m.pos.x - (simulation.mouse.x - canvas.width2) * (1 / simulation.zoom + levelEditor.lookScale())
        levelEditor.pan.y = before.y - m.pos.y - (simulation.mouse.y - canvas.height2) * (1 / simulation.zoom + levelEditor.lookScale())
        levelEditor.look()
        levelEditor.updateZoomField()
    },
    openArea() { //the part of the screen the panels and status bar don't cover, in screen pixels
        const rect = id => document.getElementById(id)?.getBoundingClientRect?.()
        const isShown = !levelEditor.isPanelsHidden
        const left = isShown ? rect("level-editor-left")?.right || 0 : 0
        const right = isShown ? rect("level-editor-right")?.left || canvas.width : canvas.width
        const bottom = isShown ? rect("level-editor-status")?.top || canvas.height : canvas.height
        const gap = 10
        const x = left + gap
        return { x, y: gap, width: Math.max(100, right - gap - x), height: Math.max(100, bottom - 2 * gap) }
    },
    zoomTo(scale) { //keeps the middle of the view still, for the zoom field
        levelEditor.zoomScale = Math.min(30000, Math.max(200, scale))
        simulation.setZoom(levelEditor.zoomScale)
        levelEditor.look()
        levelEditor.updateZoomField()
    },
    updateZoomField() {
        const field = document.querySelector('#level-editor-status [aria-label="editor zoom"][data-setting="zoom"]')
        if (field && field !== document.activeElement) field.value = Math.round(levelEditor.zoomScale)
    },

    //*********************************************************************
    // mouse, left button uses the draw tool, right button always selects and moves, middle button pans
    // the field is still on its key (space), so the right button isn't needed for it
    //*********************************************************************
    mouseDown(event) {
        if (!levelEditor.isActive || simulation.paused || levelEditor.isFullTest) return //JS test plays like a run, the mouse fires
        if (event.button === 1) {
            event.preventDefault()
            levelEditor.drag = { kind: "pan", button: 1, moved: 0, point: levelEditor.mouse() }
            return
        }
        if (event.button === 3 || event.button === 4) { //mouse 4 and 5, the back and forward buttons, teleport the player to the mouse
            event.preventDefault()
            levelEditor.teleport(levelEditor.mouse())
            return
        }
        if (event.button !== 0 && event.button !== 2) return
        event.stopPropagation() //don't fire or use the field
        if (event.detail > 1) event.preventDefault() //a double click doesn't select the panels' text
        if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur() //finishes typing in the inspector
        const point = levelEditor.mouse()
        if (levelEditor.pathDraw) return levelEditor.pathClick(point, event.button)
        if (levelEditor.picking) return levelEditor.pick(levelEditor.elementAt(point, !levelEditor.picking.isLink))
        const drag = { button: event.button, start: point, screen: { x: simulation.mouse.x, y: simulation.mouse.y }, before: JSON.stringify(levelEditor.data) }
        const vertexHit = levelEditor.vertexAt(point)
        if (vertexHit && vertexHit.side) { //a curved vertex's handle, dragging either end bends both sides
            levelEditor.drag = { ...drag, kind: "curveHandle", id: levelEditor.vertexElement().id, index: vertexHit.index, side: vertexHit.side }
            return
        }
        if (vertexHit && !vertexHit.isNew && event.detail === 2 && levelElements.types[levelEditor.vertexElement().type]?.hasCurves) return levelEditor.toggleCurve(vertexHit.index) //double click a path's vertex
        if (vertexHit) { //either button drags a vertex, or a dot in the middle of an edge to add one there
            const el = levelEditor.vertexElement()
            const points = levelElements.points(el)
            if (vertexHit.isNew) points.splice(vertexHit.index, 0, vertexHit.point)
            levelEditor.vertex.active = vertexHit.isNew ? -1 : vertexHit.index
            levelEditor.drag = { ...drag, kind: "vertex", id: el.id, index: vertexHit.index, isNew: vertexHit.isNew, points }
            return
        }
        const selected = levelEditor.selected()
        const turnHandle = !levelEditor.vertex && selected.length === 1 && levelEditor.rotateHandle(selected[0])
        if (turnHandle && Math.hypot(point.x - turnHandle.x, point.y - turnHandle.y) < levelEditor.px(8)) { //the round handle above a rotatable element
            levelEditor.drag = { ...drag, kind: "handle", id: selected[0].id, handle: "rotate", original: levelData.copy(selected[0]), pivot: levelElements.pivot(selected[0]), from: turnHandle }
            return
        }
        const handle = !levelEditor.vertex && selected.length === 1 && levelEditor.handleAt(selected[0], point)
        if (handle) {
            levelEditor.drag = { ...drag, kind: "handle", id: selected[0].id, handle: handle.id, original: levelData.copy(selected[0]) }
            return
        }
        const hit = levelEditor.elementAt(point)
        const isOnSelection = hit && levelEditor.selection.includes(hit.id)
        const grab = hit && (levelEditor.tool === "select" || event.button === 2 || isOnSelection) && levelElements.types[hit.type]?.grabHandle?.(hit, point)
        if (grab) { //part of an element that drags on its own, like a boss's other spot
            if (!isOnSelection || levelEditor.selection.length > 1) levelEditor.select([hit.id])
            levelEditor.drag = { ...drag, kind: "handle", id: hit.id, handle: grab, original: levelData.copy(hit) }
            return
        }
        const tool = event.button === 2 ? "select" : levelEditor.tool
        const isAdding = event.shiftKey || event.metaKey || event.ctrlKey //shift, ⌘, or ctrl click adds to the selection or takes away
        if (tool === "pan") { //like a middle drag, for a trackpad or a mouse without a middle button
            levelEditor.drag = { kind: "pan", button: event.button, moved: 0, point, isTool: true }
            return
        }
        if (tool === "measure") { //a ruler from here to where it's let go, with how far the player can jump from here
            levelEditor.drag = { ...drag, kind: "measure" }
            const start = levelEditor.smartPoint(point, levelEditor.drag)
            levelEditor.measure = { start, end: start }
            return
        }
        if (tool !== "select" && !isOnSelection) { //drawing, a click without dragging selects instead
            levelEditor.drag = { ...drag, kind: "draw", hitId: hit ? hit.id : null }
        } else if (hit) {
            const group = levelEditor.withGroups([hit.id]) //grouped pieces select together
            if (isAdding) {
                levelEditor.select(isOnSelection ? levelEditor.selection.filter(id => !group.includes(id)) : [...new Set(levelEditor.selection.concat(group))])
                if (isOnSelection) return
            } else if (!isOnSelection) {
                levelEditor.select(group)
            }
            levelEditor.drag = { ...drag, kind: "move", originals: levelEditor.selected().map(el => levelData.copy(el)) }
        } else {
            if (!isAdding) levelEditor.select([])
            levelEditor.drag = { ...drag, kind: "box", isAdding }
        }
    },
    mouseMove(event) {
        levelEditor.isFree = event.altKey
        const drag = levelEditor.drag
        if (drag && drag.kind === "pan") {
            levelEditor.pan.x -= event.movementX / simulation.zoom
            levelEditor.pan.y -= event.movementY / simulation.zoom
            drag.moved += Math.abs(event.movementX) + Math.abs(event.movementY)
        }
    },
    mouseUp(event) {
        if ((event.button === 3 || event.button === 4) && levelEditor.isActive) event.preventDefault() //mouse 4 and 5 teleport, they don't go back or forward a page
        const drag = levelEditor.drag
        if (!drag || event.button !== drag.button) return
        levelEditor.drag = null
        if (drag.kind === "pan") {
            if (drag.moved < 4) levelEditor.middleClick(drag.point, drag.isTool)
            return
        }
        if (drag.kind === "measure") return //the ruler stays until the next one or esc
        const isClick = Math.hypot(simulation.mouse.x - drag.screen.x, simulation.mouse.y - drag.screen.y) < 4
        if (drag.kind === "vertex") {
            if (isClick) return //a click picks the vertex for delete, an edge dot adds a vertex only when dragged
            const { points, error } = levelEditor.vertexPreview(drag)
            if (error) {
                simulation.inGameConsole(`<em>//shape ${error}</em>`)
                return
            }
            const el = levelData.find(levelEditor.data, drag.id)
            levelEditor.edit(`${drag.isNew ? "add" : "move"} vertex ${drag.index} ${levelEditor.describe([el])}`, () => {
                levelElements.setPoints(el, points)
                if (drag.isNew && el.handles) el.handles.splice(drag.index, 0, null) //a new vertex is a corner
                return [el.id]
            })
            levelEditor.vertex.active = drag.index
            return
        }
        if (drag.kind === "curveHandle") {
            if (isClick) return
            const el = levelData.find(levelEditor.data, drag.id)
            levelEditor.edit(`bend vertex ${drag.index} ${levelEditor.describe([el])}`, () => {
                el.handles[drag.index] = levelEditor.curveHandle(drag)
                return [el.id]
            })
            return
        }
        if (drag.kind === "pathHandle") { //letting go after a click while drawing a path, dragged far enough the point is curved
            if (!isClick) levelEditor.pathDraw.handles[drag.index] = levelEditor.pathHandle(drag)
            return
        }
        if (drag.kind === "draw") {
            if (isClick) {
                levelEditor.select(drag.hitId ? levelEditor.withGroups([drag.hitId]) : []) //grouped pieces select together, like the select tool
                return
            }
            const el = levelElements.create(levelEditor.tool, levelEditor.dragRect(drag))
            levelEditor.edit(`draw ${levelEditor.describe([el])}`, data => [levelData.add(data, el).id]) //draw map(x, y, width, height), like spawn.mapRect
            levelEditor.select([el.id])
            return
        }
        if (isClick) {
            if (drag.kind === "box" && !drag.isAdding) levelEditor.select([])
            return
        }
        if (drag.kind === "box") {
            const box = levelEditor.dragRect(drag, false)
            const inside = levelEditor.data.elements.filter(el => !levelEditor.isLocked(el) && !levelEditor.isHidden(el) && !levelElements.isCode(el)).filter(el => {
                const b = levelElements.bounds(el)
                return b.x >= box.x && b.y >= box.y && b.x + b.width <= box.x + box.width && b.y + b.height <= box.y + box.height
            }).map(el => el.id)
            levelEditor.select(levelEditor.withGroups(drag.isAdding ? [...new Set(levelEditor.selection.concat(inside))] : inside))
        } else { //move or handle, the data didn't change during the drag, only the preview did
            const changed = levelEditor.dragPreview(drag)
            for (const el of changed) Object.assign(levelData.find(levelEditor.data, el.id), el)
            const f = levelEditor.formatValue
            const by = changed.length > 1 ? ` by ${f(changed[0].x - drag.originals[0].x)}, ${f(changed[0].y - drag.originals[0].y)}` : "" //one element shows where it ended up, more show how far they moved
            const verb = drag.kind === "move" ? "move" : drag.handle === "rotate" ? "rotate" : drag.handle.startsWith("spot") ? `move spot ${Number(drag.handle.slice(4)) + 2} of` : "resize" //a boss's other spots are handles too
            const turn = drag.handle === "rotate" ? ` ${levelEditor.dragTurn(drag)}°` : ""
            levelEditor.commit(`${verb} ${levelEditor.describe(changed)}${by}${turn}`, drag.before, changed.map(el => el.id))
        }
    },
    wheel(event) {
        if (!levelEditor.isActive || simulation.paused || levelEditor.isFullTest) return
        event.preventDefault()
        levelEditor.zoom(simulation.zoomScale * (event.deltaY > 0 ? 1.1 : 1 / 1.1))
    },
    dragRect(drag, isSnapped = true) { //rect between where the drag started and the mouse
        const a = isSnapped ? levelEditor.smartPoint(drag.start, drag) : drag.start
        const b = isSnapped ? levelEditor.smartPoint(levelEditor.mouse(), drag) : levelEditor.mouse()
        const min = isSnapped && !levelEditor.isFree ? levelEditor.grid : 1
        const x = Math.min(a.x, b.x)
        const y = Math.min(a.y, b.y)
        return { x, y, width: Math.max(min, Math.abs(b.x - a.x)), height: Math.max(min, Math.abs(b.y - a.y)) }
    },
    dragPreview(drag) { //copies of the dragged elements where they'd end up
        const point = levelEditor.mouse()
        if (drag.kind === "handle" && drag.handle === "rotate") {
            const el = levelData.copy(drag.original)
            levelElements.rotate(el, levelEditor.dragTurn(drag), drag.pivot)
            return [el]
        }
        if (drag.kind === "handle") {
            const el = levelData.copy(drag.original)
            levelElements.dragHandle(el, drag.handle, levelEditor.smartPoint(point, drag), levelEditor.isFree ? 1 : levelEditor.grid)
            return [el]
        }
        const { dx, dy } = levelEditor.smartMove(drag, point)
        return drag.originals.map(original => {
            const el = levelData.copy(original)
            levelElements.move(el, dx, dy, drag.originals.length > 1) //moving one portal end leaves the other, moving several moves them whole
            return el
        })
    },

    vertexPreview(drag) { //the shape's world points with the dragged vertex at the mouse, and why it can't be made
        const points = drag.points.map(p => ({ x: p.x, y: p.y }))
        points[drag.index] = levelEditor.smartPoint(levelEditor.mouse(), drag)
        return { points, error: levelElements.checkPoints(points, levelData.find(levelEditor.data, drag.id)) }
    },
    vertexDragCopy(drag) { //a copy of the shape as it would be after a vertex or curve handle drag, to outline with its curves
        const el = levelData.copy(levelData.find(levelEditor.data, drag.id))
        if (drag.kind === "curveHandle") {
            el.handles[drag.index] = levelEditor.curveHandle(drag)
        } else {
            levelElements.setPoints(el, levelEditor.vertexPreview(drag).points)
            if (drag.isNew && el.handles) el.handles.splice(drag.index, 0, null)
        }
        return el
    },
    curveHandle(drag) { //the handle the mouse is on, it points from the vertex to the mouse, the other end mirrors
        const el = levelData.find(levelEditor.data, drag.id)
        const p = levelElements.points(el)[drag.index]
        const mouse = levelEditor.mouse()
        const round = n => Math.round(n * 1000) / 1000
        return [round((mouse.x - p.x) * drag.side), round((mouse.y - p.y) * drag.side)]
    },
    toggleCurve(index) { //a corner becomes a smooth curve through the vertex, a curve becomes a corner
        const el = levelEditor.vertexElement()
        const isCurved = !!(el.handles || [])[index]
        levelEditor.edit(`${isCurved ? "corner" : "curve"} vertex ${index} ${levelEditor.describe([el])}`, () => {
            el.handles = el.handles || []
            el.handles[index] = isCurved ? null : levelElements.autoHandle(el, index)
            for (let i = 0; i < el.vertices.length; i++) el.handles[i] = el.handles[i] || null //no holes in the saved list
            return [el.id]
        })
        levelEditor.vertex.active = index
    },

    //*********************************************************************
    // picking, click an element for a ref prop like a constraint's block, or to link it to a button
    //*********************************************************************
    canPick(el) {
        const picking = levelEditor.picking
        const owner = picking && levelData.find(levelEditor.data, picking.id)
        if (!el || !owner) return false
        return picking.isLink ? levelElements.isRefTo(el, "link", owner) && (!levelElements.isLinkFull(el) || levelElements.isLinkedTo(el, owner)) : levelElements.isRefTo(owner, picking.key, el)
    },
    linkTo(el, source) { //link el to a trigger, already linked to another one it's linked to both and on while either is (orLink), two is the most
        if (levelElements.isLinkedTo(el, source)) return
        if (levelElements.isLinkFull(el)) return simulation.inGameConsole(`<em>//${levelEditor.escape(levelEditor.describe([el]))} already has 2 links, unlink one first</em>`)
        const isOr = el.link && !el.orLink && levelElements.types[el.type]?.props.some(prop => prop.key === "orLink")
        levelEditor.edit(`${isOr ? "or link" : "link"} ${levelEditor.describe([el])} to ${levelEditor.describe([source])}`, () => {
            el[isOr ? "orLink" : "link"] = source.id
            return [el.id]
        })
    },
    pick(el) {
        const picking = levelEditor.picking
        const isPickable = levelEditor.canPick(el)
        levelEditor.picking = null
        const owner = levelData.find(levelEditor.data, picking.id)
        if (isPickable) {
            if (picking.isLink) {
                levelEditor.linkTo(el, owner)
            } else {
                const prop = levelEditor.findProp(picking.key, owner)
                levelEditor.edit(`${levelEditor.describe([owner])}.${picking.key} = ${el.id}`, () => {
                    if (prop?.write) prop.write(owner, el.id)
                    else owner[picking.key] = el.id
                    return [owner.id]
                })
            }
        } else if (picking.isLink && el && owner && el !== owner && levelElements.isRefTo(el, "link", owner)) { //full, says why
            levelEditor.linkTo(el, owner)
        }
        levelEditor.renderRight()
    },

    //*********************************************************************
    // drawing a path, the add menu's path button, a point each click
    //*********************************************************************
    pathClick(point, button) {
        const points = levelEditor.pathDraw.points
        if (button === 2) return levelEditor.finishPath(false)
        const snapped = levelEditor.snapPoint(point)
        const reach = levelEditor.px(10)
        const isNear = p => p && Math.hypot(p.x - point.x, p.y - point.y) < reach
        if (points.length > 2 && isNear(points[0])) return levelEditor.finishPath(true)
        if (points.length > 1 && isNear(points[points.length - 1])) return levelEditor.finishPath(false)
        points.push(snapped)
        levelEditor.pathDraw.handles.push(null)
        levelEditor.drag = { kind: "pathHandle", button, index: points.length - 1, screen: { x: simulation.mouse.x, y: simulation.mouse.y } } //dragging before letting go curves it
    },
    pathHandle(drag) { //while drawing, the point's handle points from it to the mouse, unsnapped
        const p = levelEditor.pathDraw.points[drag.index]
        const mouse = levelEditor.mouse()
        const round = n => Math.round(n * 1000) / 1000
        return [round(mouse.x - p.x), round(mouse.y - p.y)]
    },
    drawingPath() { //the path being drawn so far as a path, with the line to the mouse, and the handle being dragged
        const draw = levelEditor.pathDraw
        const drag = levelEditor.drag
        const isDragging = drag && drag.kind === "pathHandle" && Math.hypot(simulation.mouse.x - drag.screen.x, simulation.mouse.y - drag.screen.y) >= 4
        const points = isDragging ? draw.points : draw.points.concat(levelEditor.snapPoint(levelEditor.mouse()))
        const handles = draw.handles.map((h, i) => isDragging && i === drag.index ? levelEditor.pathHandle(drag) : h)
        return { type: "path", x: 0, y: 0, vertices: points.map(p => [p.x, p.y]), handles, closed: false }
    },
    finishPath(isClosed) {
        const draw = levelEditor.pathDraw || { points: [], handles: [] }
        const { points, handles } = draw
        levelEditor.pathDraw = null
        levelEditor.renderLeft()
        if (draw.forId) levelEditor.renderRight()
        if (points.length < (isClosed ? 3 : 2)) return
        const type = levelElements.types.path
        const el = levelElements.create("path", { closed: isClosed, handles: handles.some(Boolean) ? handles : [], ...type.styles[isClosed ? "closed" : "open"] })
        levelElements.setPoints(el, points)
        const owner = draw.forId && levelData.find(levelEditor.data, draw.forId)
        if (owner && levelElements.isRefTo(owner, draw.forKey, el)) { //drawn for a ref prop, like a buzzsaw's path, it's linked in the same undo step
            const prop = levelEditor.findProp(draw.forKey, owner)
            levelEditor.edit(`draw ${levelEditor.describe([el])} for ${levelEditor.describe([owner])}`, data => {
                levelData.add(data, el)
                if (prop?.write) prop.write(owner, el.id)
                else owner[draw.forKey] = el.id
                return [el.id, owner.id]
            })
            return levelEditor.select([owner.id])
        }
        levelEditor.edit(`draw ${levelEditor.describe([el])}`, data => [levelData.add(data, el).id])
        levelEditor.select([el.id])
    },
    drawPathPreview() { //the points so far and a line to the mouse, the first point is bigger, clicking it closes the path, curved points show their handle
        const path = levelEditor.drawingPath()
        const points = levelEditor.pathDraw.points
        levelEditor.outline(path, levelEditor.colors.select, 2, [6, 4])
        ctx.lineWidth = levelEditor.px(2)
        ctx.strokeStyle = levelEditor.colors.select
        path.handles.forEach((h, i) => { if (h) levelEditor.drawCurveHandle(points[i], h) })
        points.forEach((p, i) => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, levelEditor.px(i === 0 ? 7 : 4), 0, 2 * Math.PI)
            ctx.fillStyle = i === 0 ? "rgba(0,170,255,0.3)" : "#fff"
            ctx.fill()
            ctx.stroke()
        })
    },

    //*********************************************************************
    // vertex editing, the vertices button or V, for the selected map or block
    // a dot on each vertex to drag, and a smaller dot in the middle of each edge that adds a vertex when dragged
    //*********************************************************************
    vertexElement() {
        const vertex = levelEditor.vertex
        const el = vertex && levelData.find(levelEditor.data, vertex.id)
        return el && levelElements.isVertexEditable(el) ? el : null
    },
    vertexAt(point) { //{ index, isNew, point } for the vertex or edge dot under point
        const el = levelEditor.vertexElement()
        if (!el) return null
        const reach = levelEditor.px(8)
        const points = levelElements.points(el)
        const near = p => Math.abs(p.x - point.x) < reach && Math.abs(p.y - point.y) < reach
        const index = points.findIndex(near)
        if (index !== -1) return { index, isNew: false }
        for (const [i, h] of (el.handles || []).entries()) { //a curved vertex's handle ends
            if (!h) continue
            for (const side of [1, -1]) if (near({ x: points[i].x + side * h[0], y: points[i].y + side * h[1] })) return { index: i, side }
        }
        const segments = levelElements.pathSegments(el)
        for (let i = 0; i < segments.length; i++) {
            const middle = levelElements.cubicAt(segments[i], 0.5) //on the curve, the middle of a straight edge
            if (near(middle)) return { index: i + 1, isNew: true, point: middle }
        }
        return null
    },
    setVertices(points, label) { //for the selected shape, from the sides buttons or typed vertices, label(summary) is its history label
        const el = levelEditor.vertexElement()
        if (!el) return
        const error = levelElements.checkPoints(points, el)
        levelEditor.vertex.error = error
        levelEditor.vertex.text = levelElements.pathText(el)
        if (error) return levelEditor.renderRight()
        if (!levelEditor.edit(label(levelEditor.describe([el])), () => {
            if (el.handles && points.length !== levelElements.points(el).length) el.handles = [] //typed a different number of vertices, they're corners again
            levelElements.setPoints(el, points)
            return [el.id]
        })) levelEditor.renderRight()
    },
    drawCurveHandle(p, h) { //a line through a curved vertex with a small square at each end
        const size = levelEditor.px(3.5)
        ctx.beginPath()
        ctx.moveTo(p.x - h[0], p.y - h[1])
        ctx.lineTo(p.x + h[0], p.y + h[1])
        ctx.stroke()
        ctx.beginPath()
        for (const side of [1, -1]) ctx.rect(p.x + side * h[0] - size, p.y + side * h[1] - size, 2 * size, 2 * size)
        ctx.fillStyle = "#fff"
        ctx.fill()
        ctx.stroke()
    },
    drawVertices(el) {
        const points = levelElements.points(el)
        const size = levelEditor.px(5)
        ctx.lineWidth = levelEditor.px(1.5)
        ctx.strokeStyle = levelEditor.colors.select
        for (const [i, h] of (el.handles || []).entries()) if (h && points[i]) levelEditor.drawCurveHandle(points[i], h)
        ctx.beginPath()
        for (const s of levelElements.pathSegments(el)) { //edge dots, on the curve for curved ones
            const { x, y } = levelElements.cubicAt(s, 0.5)
            ctx.moveTo(x + size * 0.6, y)
            ctx.arc(x, y, size * 0.6, 0, 2 * Math.PI)
        }
        ctx.fillStyle = "rgba(255,255,255,0.6)"
        ctx.fill()
        ctx.stroke()
        points.forEach((p, i) => {
            ctx.beginPath()
            ctx.arc(p.x, p.y, size, 0, 2 * Math.PI)
            ctx.fillStyle = i === levelEditor.vertex.active ? levelEditor.colors.select : "#fff"
            ctx.fill()
            ctx.stroke()
        })
    },

    //*********************************************************************
    // commands, run by buttons with data-command and data-arg, and by keys
    // keys are written like "mod+shift+z", mod is ctrl or ⌘
    //*********************************************************************
    commands: {
        //history
        undo: { label: "undo", keys: ["mod+z"], run: () => levelEditor.undo() },
        redo: { label: "redo", keys: ["mod+shift+z", "mod+y"], run: () => levelEditor.redo() },
        rewind: { label: "rewind to here", run: index => levelEditor.rewind(Number(index)) },
        history: { //the list of every change under undo and redo, click one to go back to it
            label: "history, click a step to go back to it", run(isOpen) {
                levelEditor.isHistoryOpen = isOpen === undefined || isOpen === "" ? !levelEditor.isHistoryOpen : !!isOpen
                const pop = document.getElementById("level-editor-history")
                pop.hidden = !levelEditor.isHistoryOpen
                if (levelEditor.isHistoryOpen) levelEditor.updateHistoryButtons()
                document.querySelector('#level-editor-status [data-command="history"]')?.classList.toggle("le-on", levelEditor.isHistoryOpen)
            },
        },
        //view, tools, and testing
        tool: {
            label: "draw tool", keys: ["c"], run(tool) { //no tool cycles to the next one
                const tools = levelEditor.tools
                levelEditor.tool = tool || tools[(tools.indexOf(levelEditor.tool) + 1) % tools.length]
                levelEditor.renderStatus()
            },
        },
        smartSnap: {
            label: "snap maps, blocks, and platforms to each other's edges and middles, hold alt to place freely", run() {
                levelEditor.isSmartSnap = !levelEditor.isSmartSnap
                levelEditor.remember("levelEditorSmartSnap", levelEditor.isSmartSnap)
                levelEditor.renderStatus()
            },
        },
        grid: {
            label: "grid lines", run() {
                levelEditor.isGridShown = !levelEditor.isGridShown
                levelEditor.remember("levelEditorGridShown", levelEditor.isGridShown)
                levelEditor.renderStatus()
            },
        },
        panels: { //hide the panels to see the level like a player does
            label: "hide or show the editor panels", keys: ["tab"], run() {
                levelEditor.isPanelsHidden = !levelEditor.isPanelsHidden
                levelEditor.updatePanels()
            },
        },
        invincible: { //the simulation menu's invincible button, on to start, remembered
            label: "invincible", run() {
                levelEditor.isInvincible = !levelEditor.isInvincible
                levelEditor.remember("levelEditorInvincible", levelEditor.isInvincible)
                levelEditor.updatePanels()
                levelEditor.renderLeft()
            },
        },
        testSpawning: { //the simulation menu's mobs button, mobs and power ups, a quick test running starts again with or without them
            label: "mobs", run() {
                levelEditor.isTestSpawning = !levelEditor.isTestSpawning
                levelEditor.remember("levelEditorMobs", levelEditor.isTestSpawning)
                if (levelEditor.isTesting) levelEditor.restart()
                levelEditor.renderLeft()
            },
        },
        ghost: { //camera mode, the status bar's ghost and the simulation menu's ghost button
            label: "ghost: the player hides, WASD or the arrows fly the view anywhere through walls, shift is faster, again drops the player in the middle of the view", keys: ["g"], run() {
                if (levelEditor.isFullTest) return //a run has a player
                levelEditor.setCamera(!levelEditor.isCamera)
                if (levelEditor.isCamera) simulation.inGameConsole(`<em>//ghost: WASD or the arrows fly, shift is faster, G drops the player in the middle</em>`)
                levelEditor.renderLeft()
            },
        },
        mouseLook: { //the simulation menu's mouse look button
            label: "mouse look", run() {
                levelEditor.isMouseLook = !levelEditor.isMouseLook
                levelEditor.remember("levelEditorMouseLook", levelEditor.isMouseLook)
                levelEditor.renderLeft()
            },
        },
        levelZoom: { //the status bar's magnifying glass
            label: "the level's own zoom, what it uses in a run", run: () => levelEditor.zoomTo(levelEditor.data.zoom),
        },
        fit: { //the selection, or with nothing selected the whole level, fills the view
            label: "fit the selection in the view, or the whole level with nothing selected", run() {
                const elements = levelEditor.selected().length ? levelEditor.selected() : levelEditor.data.elements.filter(el => !levelElements.isCode(el))
                if (!elements.length) return
                const b = levelElements.unionBounds(elements)
                const view = levelEditor.openArea()
                levelEditor.zoomTo(1.15 * Math.max(b.height * canvas.height / view.height, b.width * canvas.height / view.width, 400)) //fits the part of the screen the panels don't cover
                const toWorld = (view.x + view.width / 2 - canvas.width / 2) / simulation.zoom //from the middle of the screen to the middle of the open area
                const toWorldY = (view.y + view.height / 2 - canvas.height / 2) / simulation.zoom
                levelEditor.pan = { x: b.x + b.width / 2 - toWorld - m.pos.x, y: b.y + b.height / 2 - toWorldY - m.pos.y }
            },
        },
        timeScale: { //the simulation menu's game speed
            label: "game speed", run(scale) {
                levelEditor.timeScale = Number(scale) || 1
                levelEditor.isTimeStopped = false
                levelEditor.renderLeft()
            },
        },
        timeStop: { //the simulation menu's stop time button, a speed button or this again starts time
            label: "stop time", run() {
                levelEditor.isTimeStopped = !levelEditor.isTimeStopped
                levelEditor.renderLeft()
            },
        },
        debugDraw: { //the simulation menu's draw toggles, see drawDebug()
            label: "draw", run(name) {
                if (levelEditor.debugDraw.has(name)) levelEditor.debugDraw.delete(name)
                else levelEditor.debugDraw.add(name)
                levelEditor.remember("levelEditorDebugDraw", [...levelEditor.debugDraw])
                levelEditor.renderLeft()
            },
        },
        test: { //start restarts the level at the spawn with blocks back in place, and mobs and power ups if the box is checked, stop restarts it without them
            label: "quick test: back to the entrance with blocks where they started, mobs and power ups if checked, again to stop", run() {
                levelEditor.isTesting = !levelEditor.isTesting || levelEditor.isFullTest
                levelEditor.isFullTest = false
                levelEditor.renderLeft()
                levelEditor.restart()
            },
        },
        fullTest: { //the export JS, everything a run would do
            label: "test export: plays the javascript export writes, exactly what the game would load, mobs and power ups always spawn, editing anything stops it", run() {
                if (levelEditor.whole && !levelEditor.isFullTest) { //what's typed is what gets tested
                    const error = levelEditor.applyWholeCode(document.querySelector("#level-editor-code textarea").value)
                    if (error) return levelEditor.showCodeError(error)
                    levelEditor.clearCodeError()
                }
                levelEditor.setCamera(false, false) //a run has a player
                levelEditor.isFullTest = !levelEditor.isFullTest
                levelEditor.updatePanels() //the panels stay as they are, tab hides them to see the level like a player
                levelEditor.isTesting = false
                levelEditor.drag = null
                levelEditor.picking = null
                levelEditor.pathDraw = null
                levelEditor.vertex = null
                levelEditor.renderLeft()
                levelEditor.restart()
            },
        },
        //selecting and changing what's selected
        deselect: {
            label: "deselect", keys: ["escape"], run() {
                levelEditor.drag = null
                if (levelEditor.isHistoryOpen) return levelEditor.run("history", false) //esc closes the history list first
                if (levelEditor.isAnalysisShown) return levelEditor.run("closeAnalysis") //then the analysis
                if (levelEditor.measure) { //then the ruler
                    levelEditor.measure = null
                    return
                }
                const code = document.getElementById("level-editor-code")
                if (code.classList.contains("le-open")) return levelEditor.run("closeCode") //esc closes the javascript first
                if (levelEditor.picking) { //then stops picking
                    levelEditor.picking = null
                    return levelEditor.renderRight()
                }
                if (levelEditor.pathDraw) { //then stops drawing a path
                    const isForRef = !!levelEditor.pathDraw.forId
                    levelEditor.pathDraw = null
                    if (isForRef) levelEditor.renderRight()
                    return levelEditor.renderLeft()
                }
                if (levelEditor.vertex) { //esc leaves vertex editing first
                    levelEditor.vertex = null
                    return levelEditor.renderRight()
                }
                levelEditor.select([])
            },
        },
        selectAll: { label: "select all", keys: ["mod+a"], run: () => levelEditor.select(levelEditor.data.elements.map(el => el.id)) },
        delete: {
            label: "delete", keys: ["delete", "backspace"], run(isCut = false) {
                if (levelEditor.pathDraw) return levelEditor.pathDraw.points.pop() && levelEditor.pathDraw.handles.pop() //the last point of the path being drawn
                const vertexEl = levelEditor.vertexElement()
                if (vertexEl && levelEditor.vertex.active !== -1) { //while editing vertices, delete removes the clicked vertex
                    const index = levelEditor.vertex.active
                    const points = levelElements.points(vertexEl)
                    points.splice(index, 1)
                    const error = levelElements.checkPoints(points, vertexEl)
                    if (error) return simulation.inGameConsole(`<em>//shape ${error}</em>`)
                    levelEditor.edit(`remove vertex ${index} ${levelEditor.describe([vertexEl])}`, () => {
                        levelElements.setPoints(vertexEl, points)
                        if (vertexEl.handles) vertexEl.handles.splice(index, 1)
                        return [vertexEl.id]
                    })
                    levelEditor.vertex.active = -1
                    return
                }
                const elements = levelEditor.selected().filter(el => !levelEditor.isSingleton(el) && (!isCut || levelEditor.isCopyable(el)))
                const ids = elements.map(el => el.id)
                if (!ids.length) return
                levelEditor.edit(`delete ${levelEditor.describe(elements)}`, data => levelEditor.removeElements(data, ids))
            },
        },
        copy: { label: "copy", keys: ["mod+c"], run: () => { levelEditor.clipboard = levelEditor.selected().filter(levelEditor.isCopyable).map(levelData.copy) } },
        cut: {
            label: "cut", keys: ["mod+x"], run() {
                levelEditor.run("copy")
                levelEditor.commands.delete.run(true)
            },
        },
        paste: { //the copied elements' top left corner goes to the mouse
            label: "paste", keys: ["mod+v"], run(where) { //"view" from the inspector's ⌘V, the copies' middle goes to the middle of the view
                if (!levelEditor.clipboard.length) return
                const box = levelElements.boundsOf(levelEditor.clipboard.flatMap(el => levelElements.points(el)))
                if (where === "view") {
                    const to = levelEditor.snapPoint(levelEditor.viewCenter())
                    return levelEditor.paste("paste", levelEditor.clipboard, to.x - levelEditor.snap(box.x + box.width / 2), to.y - levelEditor.snap(box.y + box.height / 2))
                }
                const to = levelEditor.snapPoint(levelEditor.mouse())
                levelEditor.paste("paste", levelEditor.clipboard, to.x - levelEditor.snap(box.x), to.y - levelEditor.snap(box.y))
            },
        },
        vertices: {
            label: "edit vertices", keys: ["v"], run() {
                const selected = levelEditor.selected()
                if (levelEditor.vertex) {
                    levelEditor.vertex = null
                } else if (selected.length === 1 && levelElements.isVertexEditable(selected[0])) {
                    levelEditor.vertex = { id: selected[0].id, active: -1, error: "", text: "" }
                }
                levelEditor.renderRight()
            },
        },
        sides: { //a regular shape with one more or one less side, filling the shape's bounds
            label: "sides", run(change) {
                const el = levelEditor.vertexElement()
                if (!el) return
                const sides = Math.min(levelElements.vertexLimit, Math.max(3, levelElements.points(el).length + Number(change)))
                levelEditor.setVertices(levelElements.regularPoints(levelElements.bounds(el), sides), summary => `${summary} to ${sides} sides`)
            },
        },
        rotate: { //the selection turns around its middle, one element around its own pivot, see levelElements.rotate()
            label: "rotate clockwise, shift for counterclockwise", run(degrees) {
                const elements = levelEditor.selectedParts()
                if (!elements.length || !elements.some(levelElements.isRotatable)) return
                const turn = Number(degrees) || 90
                let center
                if (elements.length === 1) {
                    center = levelElements.pivot(elements[0])
                } else {
                    const b = levelElements.boundsOf(elements.flatMap(el => levelElements.points(levelElements.bounds(el))))
                    center = levelEditor.snapPoint({ x: b.x + b.width / 2, y: b.y + b.height / 2 })
                }
                levelEditor.edit(`rotate ${levelEditor.describe(elements)} ${turn}°`, () => {
                    for (const el of elements) levelElements.rotate(el, turn, center)
                    return elements.map(el => el.id)
                })
            },
        },
        flip: { //"x" mirrors left and right, "y" up and down, a selection of many flips as a whole
            label: "flip", run(axis) {
                const elements = levelEditor.selectedParts()
                if (!elements.length) return
                const b = levelElements.boundsOf(elements.flatMap(el => levelElements.points(el)))
                const center = elements.length === 1 ? levelElements.pivot(elements[0]) : { x: b.x + b.width / 2, y: b.y + b.height / 2 }
                levelEditor.edit(`flip ${axis === "x" ? "↔" : "↕"} ${levelEditor.describe(elements)}`, () => {
                    for (const el of elements) levelElements.flip(el, axis, center)
                    return elements.map(el => el.id)
                })
            },
        },
        arrange: { //"top" draws them over the other drawings in their layer, "bottom" under, it's their order in the list
            label: "draw order", run(where) {
                const ids = levelEditor.selectedParts().map(el => el.id) //code runs in list order, moving it would change what it does
                if (!ids.length) return
                levelEditor.edit(`${levelEditor.describe(levelEditor.selected())} to the ${where}`, data => {
                    const moving = data.elements.filter(el => ids.includes(el.id))
                    const rest = data.elements.filter(el => !ids.includes(el.id))
                    data.elements = where === "top" ? rest.concat(moving) : moving.concat(rest)
                    return [] //drawing follows the list order each frame, nothing needs rebuilding, so blocks and controls stay where they are
                })
            },
        },
        align: { //lines up the selection's edges or middles with the outermost one
            label: "align", run(edge) {
                const elements = levelEditor.selectedParts()
                if (elements.length < 2) return
                const boxes = elements.map(el => levelElements.bounds(el))
                const all = levelElements.unionBounds(elements)
                const target = { left: all.x, right: all.x + all.width, center: all.x + all.width / 2, top: all.y, bottom: all.y + all.height, middle: all.y + all.height / 2 }[edge]
                levelEditor.edit(`align ${edge} ${levelEditor.describe(elements)}`, () => {
                    elements.forEach((el, i) => {
                        const b = boxes[i]
                        const at = { left: b.x, right: b.x + b.width, center: b.x + b.width / 2, top: b.y, bottom: b.y + b.height, middle: b.y + b.height / 2 }[edge]
                        const isX = ["left", "right", "center"].includes(edge)
                        levelElements.move(el, isX ? target - at : 0, isX ? 0 : target - at, true)
                    })
                    return elements.map(el => el.id)
                })
            },
        },
        group: { //clicking one selects them all, like a room's pieces
            label: "group, clicking one selects them all, ungroup to edit one", run() {
                const elements = levelEditor.selected()
                const groups = new Set(elements.map(el => el.group).filter(Boolean))
                levelEditor.edit(`${groups.size ? "ungroup" : "group"} ${levelEditor.describe(elements)}`, data => {
                    if (groups.size) { //every piece of those groups, even ones not selected, like one picked in the explorer
                        for (const el of data.elements) if (groups.has(el.group)) delete el.group
                    } else {
                        const id = levelEditor.newGroupId(data)
                        for (const el of elements) el.group = id
                    }
                    return []
                })
                levelEditor.renderRight()
            },
        },
        editElementCode: { //the info box's code button: its code in the big code panel, apply runs it instead of what its settings make
            label: "edit its code, apply runs it instead of the settings above", run() {
                const el = levelEditor.selected().length === 1 ? levelEditor.selected()[0] : null
                if (!el || !levelElements.isCodeEditable(el)) return
                levelEditor.openWholeCode(el.id)
            },
        },
        revertElementCode: { //back to the code its settings make
            label: "back to the code its settings make", run() {
                const el = levelEditor.selected()[0]
                if (!el || !el.edited) return
                levelEditor.edit(`revert code ${levelEditor.describe([el])}`, () => {
                    delete el.edited
                    return [el.id]
                })
                levelEditor.renderRight()
            },
        },
        round: { //switch selected fills between rect, circle, and ellipse, where it is, its color, layer, and group stay
            label: "rect, circle, or ellipse", run(typeName) {
                const rounds = levelEditor.selected().filter(el => levelElements.types[el.type]?.rounds?.includes(typeName) && el.type !== typeName)
                if (!rounds.length) return
                const ids = rounds.map(el => el.id)
                levelEditor.edit(`${levelEditor.describe(rounds)} to ${typeName}`, data => {
                    data.elements = data.elements.map(el => {
                        if (!ids.includes(el.id)) return el
                        const shared = { color: el.color, layer: el.layer, link: el.link, orLink: el.orLink, runs: el.runs, delay: el.delay, ...(el.group ? { group: el.group } : {}) }
                        return { ...levelElements.create(typeName, { ...shared, ...levelElements.roundShape(el, typeName) }), id: el.id }
                    })
                    return ids
                })
                levelEditor.renderRight()
            },
        },
        triggerMode: { //switch selected buttons, scales, and toggles between them, where it is and its links stay
            label: "button, scale, or toggle", run(typeName) {
                const triggers = levelEditor.selected().filter(el => levelElements.types[el.type]?.modes?.includes(typeName) && el.type !== typeName)
                if (!triggers.length) return
                const ids = triggers.map(el => el.id)
                levelEditor.edit(`${levelEditor.describe(triggers)} to ${typeName}`, data => {
                    data.elements = data.elements.map(el => ids.includes(el.id) ? { ...levelElements.create(typeName, levelElements.triggerMode(el, typeName)), id: el.id } : el)
                    return ids
                })
                levelEditor.renderRight()
            },
        },
        laserStyle: { //switch selected lasers between a beam and an arc, a color that's still the other one's starting color changes with it
            label: "beam or arc", run(style) {
                const styles = levelElements.laserStyles
                const lasers = levelEditor.selected().filter(el => el.type === "laser" && el.style !== style)
                if (!lasers.length || !Object.hasOwn(styles, style)) return
                levelEditor.edit(`${levelEditor.describe(lasers)} to ${style}`, () => {
                    for (const el of lasers) {
                        if (el.color === styles[el.style]) el.color = styles[style]
                        el.style = style
                    }
                    return lasers.map(el => el.id)
                })
                levelEditor.renderRight()
            },
        },
        gate: { //switch selected logic elements between and, or, not, and timer, where it is and its links stay
            label: "and, or, not, or timer", run(name) {
                const gates = levelEditor.selected().filter(el => levelElements.types[el.type]?.isGate && levelElements.gateName(el) !== name)
                if (!gates.length || !Object.hasOwn(levelElements.gates, name)) return
                levelEditor.edit(`${levelEditor.describe(gates)} to ${name}`, () => {
                    for (const el of gates) el.gate = name
                    return gates.map(el => el.id)
                })
                levelEditor.renderRight()
            },
        },
        shape: { //switch selected map and blocks to the other one
            label: "map or block", run(typeName) {
                const shapes = levelEditor.selected().filter(el => levelElements.groups.shape.includes(el.type) && el.type !== typeName)
                const ids = shapes.map(el => el.id)
                levelEditor.edit(`${levelEditor.describe(shapes)} to ${typeName}`, data => {
                    data.elements = data.elements.map(el => {
                        if (!ids.includes(el.id)) return el
                        const shared = { friction: el.friction, restitution: el.restitution, ...(el.group ? { group: el.group } : {}) } //and its group
                        return { ...levelElements.create(typeName, { ...levelElements.shapeGeometry(el), ...shared }), id: el.id }
                    })
                    const changed = new Set(ids)
                    const removed = [] //a constraint can't hold map, it goes in the same undo step
                    for (const el of data.elements) {
                        for (const key of levelElements.refKeys(el)) {
                            const target = ids.includes(el[key]) && levelData.find(data, el[key])
                            if (!target || levelElements.isRefTo(el, key, target)) continue
                            if (levelElements.types[el.type]?.rebuildWithRefs) removed.push(el.id)
                            else el[key] = null
                            changed.add(el.id)
                        }
                    }
                    data.elements = data.elements.filter(el => !removed.includes(el.id))
                    return [...changed]
                })
            },
        },
        collide: { //the inspector's collides checks, and other category lists like a zone's affects ("affects:mob"), toggles one for everything selected that has it, mixed turns it on for all
            label: "collides with it, the other side has to collide back too", run(arg) {
                const [key, name] = arg.includes(":") ? arg.split(":") : ["collides", arg]
                const elements = levelEditor.selected().filter(el => levelElements.types[el.type]?.props.some(prop => prop.kind === "mask" && prop.key === key))
                if (!elements.length) return
                const isOn = !elements.every(el => levelElements.collision.has(el[key], name))
                levelEditor.edit(`${levelEditor.describe(elements)}.${key} ${isOn ? "+" : "-"} ${name}`, () => {
                    for (const el of elements) el[key] = levelElements.collision.toggle(el[key], name, isOn)
                    return elements.map(el => el.id)
                })
                levelEditor.renderRight()
            },
        },
        veto: { //a veto list's pick or a crossed out name, "mobVeto:slasher" is the level's mob veto, "veto:hydraBoss" the selected boss's
            label: "crosses it out, or brings it back", run(arg) {
                const [key, name] = arg.split(":")
                const isLevel = levelElements.level.props.some(prop => prop.key === key)
                const owner = isLevel ? levelEditor.data : levelEditor.selected().length === 1 ? levelEditor.selected()[0] : null
                const prop = levelEditor.findProp(key, owner)
                if (!prop || prop.kind !== "veto") return
                const isVetoing = !owner[key].includes(name)
                if (isVetoing && levelElements.vetoBlocks(prop, owner[key], name)) return levelEditor.renderRight()
                levelEditor.edit(`${isLevel ? "level" : levelEditor.describe([owner])}.${key} ${isVetoing ? "+" : "-"} ${name}`, () => {
                    owner[key] = isVetoing ? [...owner[key], name] : owner[key].filter(other => other !== name)
                    return isLevel ? [] : [owner.id]
                })
                levelEditor.renderRight()
            },
        },
        //adding
        addTab: { //open one of the add menu's lists, or close it if it's the one open
            label: "open a list", run(name) {
                levelEditor.addTab = levelEditor.addTab === name ? "" : name
                levelEditor.remember("levelEditorAddTab", levelEditor.addTab)
                const part = document.querySelector("#level-editor-left [data-add-lists]")
                if (part) part.innerHTML = levelEditor.addLists()
            },
        },
        add: { //an element from an add menu, in the middle of the view, "powerUp:heal" uses the type's preset("heal"), or drag it onto the level
            label: "add", run: arg => levelEditor.place(levelEditor.creation("add", arg)),
        },
        drawPath: { //click to add points, click the first point to close it, click the last point, enter, or right click to finish
            label: "draw a path, click to add points, click the first point to close it, enter or right click to finish", run() {
                if (levelEditor.pathDraw) return levelEditor.finishPath(false)
                levelEditor.pathDraw = { points: [], handles: [] } //handles like a path's, a point dragged while clicking is curved
                levelEditor.select([])
                levelEditor.renderLeft()
            },
        },
        finishPath: { label: "finish the path", keys: ["enter"], run: () => levelEditor.pathDraw && levelEditor.finishPath(false) },
        preset: { //a common shape from levelElements.presets, as map, or block with the block tool, in the middle of the view, or drag it onto the level
            label: "shape", run: name => levelEditor.place(levelEditor.creation("preset", name)),
        },
        addSpot: { //another place the selected boss could spawn, drag it where it goes
            label: "another place it could spawn", run() {
                const el = levelEditor.selected()[0]
                if (!el || !Array.isArray(el.spots)) return
                const last = el.spots.length ? el.spots[el.spots.length - 1] : [el.x, el.y]
                const spot = [last[0] + 300, last[1]]
                levelEditor.edit(`${levelEditor.describe([el])} add spot ${levelEditor.formatValue(spot[0])}, ${levelEditor.formatValue(spot[1])}`, () => {
                    el.spots.push(spot)
                    return [el.id]
                })
            },
        },
        removeSpot: {
            label: "remove this spot", run(index) {
                const el = levelEditor.selected()[0]
                if (!el || !Array.isArray(el.spots)) return
                levelEditor.edit(`${levelEditor.describe([el])} remove spot ${Number(index) + 2}`, () => {
                    el.spots.splice(Number(index), 1)
                    return [el.id]
                })
            },
        },
        blockForce: { //a force on the selected blocks, its settings show in the info box, off keeps them for next time
            label: "keeps pushing the block, the way and how hard are in its info box, steady or back and forth like a sine wave, on a constraint it swings", run() {
                const blocks = levelEditor.selected().filter(el => el.type === "block")
                if (!blocks.length) return
                const isOn = !blocks.every(el => el.hasForce)
                levelEditor.edit(`${levelEditor.describe(blocks)}.force ${isOn ? "on" : "off"}`, () => {
                    for (const el of blocks) el.hasForce = isOn
                    return blocks.map(el => el.id)
                })
                levelEditor.renderRight()
            },
        },
        constrain: { //a constraint from a point above the selected block, drag the point where it goes
            label: "hold it with a Matter.js constraint to a point in the level", run() {
                const el = levelEditor.selected()[0]
                if (!el || el.type !== "block") return
                const c = levelElements.center(el)
                const anchor = levelEditor.snapPoint({ x: c.x, y: c.y - 200 })
                const constraint = levelElements.create("constraint", { x: anchor.x, y: anchor.y, body: el.id, length: Math.round(c.y - anchor.y) })
                levelEditor.edit(`add ${levelEditor.describe([constraint])}`, data => [levelData.add(data, constraint).id])
                levelEditor.select([constraint.id])
            },
        },
        levelCode: { //the level info box's code button, the level code in the big code panel, see levelData.runCode()
            label: "javascript that runs when the level starts, after everything in it is made, and each game cycle in its //level.custom and //level.customTopLayer parts", run() {
                levelEditor.openWholeCode("level")
            },
        },
        deleteLevelCode: {
            label: "delete the level code", run: () => levelEditor.applyLevelCode(""),
        },
        editCode: {
            label: "edit the code, ⌘enter applies", run(id) {
                const el = levelData.find(levelEditor.data, Number(id) || levelEditor.selection[0])
                if (!el) return
                levelEditor.openWholeCode(el.id)
            },
        },
        applyCode: { //the code panel's apply button
            label: "apply, the level runs again", run() {
                const error = levelEditor.applyWholeCode(document.querySelector("#level-editor-code textarea").value)
                if (error) levelEditor.showCodeError(error)
                else levelEditor.clearCodeError()
            },
        },
        codeNext: { //an element's setup and every cycle lines are in different places
            label: "go to the next place its code is", run() {
                const ranges = levelEditor.whole?.ranges
                if (!ranges?.length) return
                levelEditor.whole.rangeIndex = (levelEditor.whole.rangeIndex + 1) % ranges.length
                levelEditor.jumpToLine(ranges[levelEditor.whole.rangeIndex].start)
            },
        },
        //picking and linking
        pick: { //click an element for a ref prop of the selected element
            label: "pick it by clicking it, esc stops", run(key) {
                const el = levelEditor.selected()[0]
                levelEditor.picking = levelEditor.picking ? null : el ? { id: el.id, key } : null
                levelEditor.renderRight()
            },
        },
        drawRef: { //draw a new path for a ref prop of the selected element, like a buzzsaw's path, it's picked when the path is finished
            label: "draw a new path for it, click to add points, click the first point to close it, enter or right click to finish, then it's linked, esc stops", run(key) {
                const el = levelEditor.selected()[0]
                if (levelEditor.pathDraw) return levelEditor.finishPath(false)
                if (!el) return
                levelEditor.picking = null
                levelEditor.pathDraw = { points: [], handles: [], forId: el.id, forKey: key }
                levelEditor.renderLeft()
                levelEditor.renderRight()
            },
        },
        pickLink: { //click an element to link it to the selected button or toggle
            label: "link something by clicking it, esc stops, linking something already linked to another makes it on while either is, linking another trigger makes it only on while both are", run() {
                const el = levelEditor.selected()[0]
                levelEditor.picking = levelEditor.picking ? null : el ? { id: el.id, isLink: true } : null
                levelEditor.renderRight()
            },
        },
        unlink: { //from the selected trigger
            label: "unlink", run(id) {
                const el = levelData.find(levelEditor.data, Number(id))
                const source = levelEditor.selected()[0]
                if (!el) return
                levelEditor.edit(`unlink ${levelEditor.describe([el])}`, () => {
                    if (source && el.orLink === source.id) el.orLink = null
                    else el.link = null
                    levelElements.tidyLinks(el)
                    return [el.id]
                })
            },
        },
        //explorer
        jumpTo: { //the explorer, select it and go to it
            label: "select it and go to it", run(id) {
                const el = levelData.find(levelEditor.data, Number(id))
                if (!el) return
                const b = levelElements.bounds(el)
                levelEditor.pan = { x: b.x + b.width / 2 - m.pos.x, y: b.y + b.height / 2 - m.pos.y }
                levelEditor.select([el.id])
            },
        },
        hide: { //"type:map" or "id:12", hidden elements aren't built while editing
            label: "hide while editing, tests show it", run(arg) {
                const ids = levelEditor.toggleView(levelEditor.hiddenTypes, levelEditor.hiddenIds, arg)
                levelEditor.select(levelEditor.selection.filter(id => !levelEditor.isHidden(levelData.find(levelEditor.data, id))))
                if (!levelEditor.isTesting && !levelEditor.isFullTest) levelEditor.refresh(ids)
                levelEditor.countProblems() //the analysis notes hidden elements
            },
        },
        lock: { //"type:map" or "id:12", the mouse goes through locked elements
            label: "the mouse goes through it, the explorer still selects it", run(arg) {
                levelEditor.toggleView(levelEditor.lockedTypes, levelEditor.lockedIds, arg)
                levelEditor.select(levelEditor.selection.filter(id => !levelEditor.isLocked(levelData.find(levelEditor.data, id))))
            },
        },
        exploreMore: { //a type with more than 100 elements shows 100 more each click
            label: "show more", run(typeName) {
                levelEditor.exploreLimits[typeName] = (levelEditor.exploreLimits[typeName] || 100) + 100
                levelEditor.renderExplorer()
            },
        },
        //analysis
        analyze: { //the analysis in the inspector, click a line to go to what it's about
            label: "issues, the level checked against the standard levels", run() {
                levelEditor.analysisReport = levelEditor.runAnalysis()
                levelEditor.isAnalysisShown = true
                levelEditor.renderRight()
            },
        },
        closeAnalysis: {
            label: "back to what's selected", run() {
                levelEditor.isAnalysisShown = false
                levelEditor.renderRight()
            },
        },
        copyAnalysis: {
            label: "copy the issues as text", run: () => levelEditor.copy(levelAnalysis.text(levelEditor.analysisReport || levelEditor.runAnalysis()), "issues"),
        },
        fixProblem: { //an analysis line that adding something fixes, like no boss, adds it somewhere sensible, goes to it, and keeps the analysis open
            label: "add it", run(typeName) {
                levelEditor.isAnalysisJump = true
                levelEditor.place(levelEditor.creation("add", typeName, levelEditor.fixSpot(typeName) || undefined))
                const id = levelEditor.selection[0]
                if (id !== undefined) levelEditor.run("jumpTo", id)
                levelEditor.isAnalysisJump = false
                levelEditor.countProblems(0)
            },
        },
        jumpProblem: { //an analysis line, select what it's about and go to it, more than one goes to the next each click
            label: "go to it", run(arg) {
                const ids = String(arg).split(",").map(Number).filter(id => levelData.find(levelEditor.data, id))
                if (!ids.length) return
                const index = ((levelEditor.analysisCursor.get(arg) ?? -1) + 1) % ids.length
                levelEditor.analysisCursor.set(arg, index)
                levelEditor.isAnalysisJump = true
                levelEditor.run("jumpTo", ids[index])
                levelEditor.isAnalysisJump = false
            },
        },
        //levels, export, and import
        code: {
            label: "level as javascript", run() {
                levelEditor.openPanel(`${levelData.functionName(levelEditor.data.name)}()`, levelData.code(levelEditor.data))
            },
        },
        copyPanel: {
            label: "copy", run() {
                const panel = document.getElementById("level-editor-code")
                levelEditor.copy(panel.querySelector("textarea").value, panel.querySelector("[data-code-name]").textContent)
            },
        },
        downloadPanel: { //the export as a file, a backup that doesn't depend on the clipboard
            label: "save it as a .js file", run() {
                const panel = document.getElementById("level-editor-code")
                const name = panel.querySelector("[data-code-name]").textContent.replace(/\W/g, "") || "level"
                const link = document.createElement("a")
                link.href = URL.createObjectURL(new Blob([panel.querySelector("textarea").value], { type: "text/javascript" }))
                link.download = `${name}.js`
                link.click()
                setTimeout(() => URL.revokeObjectURL(link.href), 1000)
            },
        },
        closeCode: { label: "close", run() {
            levelEditor.keepCodeDraft()
            levelEditor.whole = null
            levelEditor.codeEditing = null
            levelEditor.fileRequest++
            levelEditor.pendingImport = null
            document.getElementById("level-editor-code").classList.remove("le-open")
        } },
        importLevel: {
            label: "import a level's javascript as a new local level", run() {
                levelEditor.openPanel("import level", "", "", "import")
            },
        },
        importText: { //the import panel's import button, a level with javascript asks first, see confirmImport()
            label: "import the pasted javascript as a new local level", run() {
                const text = document.querySelector("#level-editor-code textarea").value
                if (!text.trim()) return
                let data
                try {
                    data = levelData.dataOf(text) //nothing runs yet
                } catch (error) {
                    console.error(error)
                    return simulation.inGameConsole(`<em>//couldn't import that, ${levelEditor.escape(error.message)}</em>`)
                }
                levelEditor.pendingImport = { text, data }
                const parts = data ? levelData.codeParts(data) : [{ where: "the whole level, importing runs it to read its map", code: text }] //no level editor line, it's all code
                if (parts.length) return levelEditor.confirmImport(parts)
                levelEditor.run("importRun")
            },
        },
        importRun: { //the import warning's run button, or a level with no javascript
            label: "run its javascript and import it, only for code from people you trust", run() {
                const pending = levelEditor.pendingImport
                if (!pending) return
                levelEditor.pendingImport = null
                let imported = pending.data
                let isCaptured = false
                if (!imported) {
                    try {
                        ({ data: imported, isCaptured } = levelData.fromText(pending.text))
                    } catch (error) {
                        console.error(error)
                        simulation.inGameConsole(`<em>//couldn't import that, ${levelEditor.escape(error.message)}</em>`)
                        return levelEditor.restart() //running the code cleared the world
                    }
                }
                levelEditor.importData(imported, isCaptured ? ", only the map and blocks, the code had no level editor data" : "")
            },
        },
        importNoCode: { //the import warning's other way, nothing runs
            label: "import it without its javascript: the map, blocks, mobs, power ups, and elements with their settings", run() {
                const pending = levelEditor.pendingImport
                if (!pending) return
                levelEditor.pendingImport = null
                let imported
                try {
                    imported = levelData.withoutCode(pending.data || levelData.sourceData(pending.text))
                } catch (error) {
                    console.error(error)
                    return simulation.inGameConsole(`<em>//couldn't import that, ${levelEditor.escape(error.message)}</em>`)
                }
                levelEditor.importData(imported, ", without its javascript")
            },
        },
        importBack: { //the import warning's back button, the pasted text is still there
            label: "back to the import box", run() {
                const text = levelEditor.pendingImport ? levelEditor.pendingImport.text : ""
                levelEditor.openPanel("import level", text, "", "import")
            },
        },
        openFile: { //the import panel, a file instead of pasting, then it imports
            label: "load a level from a .js or .txt file", run: () => document.getElementById("level-editor-import-file").click(),
        },
        newLevel: { label: "a new level with ground, an entrance, and an exit", run: () => levelEditor.setData(levelData.blank(levelData.freeName("untitled"))) },
        duplicateLevel: { //a copy of this level to experiment on, it opens the copy
            label: "fork, a copy of this level under a new name, then edit the copy", run() {
                levelEditor.flush()
                const copy = levelData.copy(levelEditor.data)
                copy.name = levelData.freeName(`${levelEditor.data.name}-copy`)
                levelEditor.setData(copy)
                simulation.inGameConsole(`<em>//forked as ${levelEditor.escape(copy.name)}</em>`)
            },
        },
        load: { label: "load", run: arg => levelEditor.load(arg) },
        deleteLevel: {
            label: "delete level", run(name) {
                if (!confirm(`delete ${name}?`)) return
                if (name === levelEditor.data.name) {
                    clearTimeout(levelEditor.saveTimer)
                    levelEditor.saveTimer = null //switching levels must not save the deleted level again
                }
                levelData.store.remove(name)
                if (name === levelEditor.data.name) {
                    const next = levelData.store.names()[0]
                    levelEditor.setData(next ? levelData.store.get(next) : levelData.blank(levelData.freeName("untitled")))
                } else {
                    levelEditor.renderLeft()
                }
            },
        },
        pool: { //in or out of the random level pool from settings, without opening it
            label: "add it to the random level pool for runs, or take it out", run() {
                const pool = localSettings.levelPool
                const name = levelEditor.data.name
                pool.added = levelEditor.isInPool() ? pool.added.filter(n => n !== name) : pool.added.concat(name)
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                simulation.inGameConsole(levelEditor.isInPool() ? `<em>//${name} is in the level pool</em>` : `<em>//${name} is out of the level pool</em>`)
                levelEditor.renderLeft()
            },
        },
        levelDefaults: { //the level properties most written levels use, the name stays
            label: "typical level properties", run() {
                const defaults = levelElements.level.defaults()
                levelEditor.edit("level properties to default", data => {
                    Object.assign(data, defaults, { mobVeto: data.mobVeto }) //which mobs it vetoes isn't a look
                    return []
                })
                levelEditor.applyLevelProps()
            },
        },
    },
    run(name, arg) {
        levelEditor.commands[name].run(arg)
    },
    keyCombo(event) {
        return (event.ctrlKey || event.metaKey ? "mod+" : "") + (event.shiftKey ? "shift+" : "") + event.key.toLowerCase()
    },
    keyText(combo) { //for tooltips
        const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
        return combo.replace("mod+", isMac ? "⌘" : "ctrl+").replace("shift+", isMac ? "⇧" : "shift+").toUpperCase()
    },
    tip(name) {
        const command = levelEditor.commands[name]
        return command.keys ? `${command.label}  ${levelEditor.keyText(command.keys[0])}` : command.label
    },
    isTyping(target) { //keys go to a field being typed in, not the game or the editor's keys, menus and buttons don't keep them
        return !!target.matches?.("textarea, select, input:not([type=checkbox]):not([type=color])") || !!target.closest?.("select") || !!target.isContentEditable //an open list's option too, so esc closes the list
    },
    keyDown(event) {
        levelEditor.isFree = event.altKey
        levelEditor.isFast = event.shiftKey
        if (!levelEditor.isActive || simulation.paused || levelEditor.isTyping(event.target)) return
        const combo = levelEditor.keyCombo(event)
        if (!combo.includes("mod+") && Object.values(input.key).includes(event.code)) return //a key the player set for the game, like jump, stays a game key
        for (const name of Object.keys(levelEditor.commands)) {
            const keys = levelEditor.commands[name].keys
            if (keys && keys.includes(combo)) {
                event.preventDefault()
                event.stopImmediatePropagation() //game keys don't also run
                levelEditor.run(name)
                return
            }
        }
    },
    unstack(el, also = []) { //power ups spawned in the same spot lag while the game pushes them apart, so a new one moves 25 in a random direction until it has its own spot
        if (levelElements.types[el.type]?.group !== "powerUp" || el.type === "debris") return
        const isTaken = () => levelEditor.data.elements.concat(also).some(other => other !== el && levelElements.types[other.type]?.group === "powerUp" && other.type !== "debris" && other.x === el.x && other.y === el.y)
        const steps = [[25, 0], [-25, 0], [0, 25], [0, -25], [25, 25], [25, -25], [-25, 25], [-25, -25]]
        for (let i = 0; i < 50 && isTaken(); i++) {
            const [dx, dy] = steps[Math.floor(Math.random() * steps.length)]
            levelElements.move(el, dx, dy)
        }
    },
    paste(label, elements, dx, dy) {
        if (!elements.length) return
        const copies = elements.map(original => {
            const el = levelData.copy(original)
            levelElements.move(el, dx, dy, true)
            return el
        })
        for (const el of copies) levelEditor.unstack(el, copies)
        const ids = []
        levelEditor.edit(`${label} ${levelEditor.describe(copies)}`, data => {
            for (const el of copies) ids.push(levelData.add(data, el).id)
            const newIds = new Map(elements.map((original, i) => [original.id, ids[i]])) //a copied button and door stay linked to each other, not to the originals
            const newGroups = new Map() //copies of a group are their own group
            for (const el of copies) {
                for (const key of levelElements.refKeys(el)) if (newIds.has(el[key])) el[key] = newIds.get(el[key])
                if (el.edited?.names) {
                    el.edited.names = Object.fromEntries(Object.entries(el.edited.names).map(([id, name]) => [newIds.get(Number(id)) ?? id, name]))
                }
                if (el.group) {
                    if (!newGroups.has(el.group)) newGroups.set(el.group, levelEditor.newGroupId(data))
                    el.group = newGroups.get(el.group)
                }
            }
            return ids
        })
        levelEditor.select(ids)
    },
    async load(arg) { //"local:name" opens a local level, "written:name" and "more:name" copy a written level into a new local level
        const split = arg.indexOf(":")
        const source = arg.slice(0, split)
        const name = arg.slice(split + 1)
        if (source === "local") {
            if (name !== levelEditor.data.name && levelData.store.has(name)) levelEditor.setData(levelData.store.get(name))
            return
        }
        try {
            if (source === "more") await level.loadMoreLevels()
            levelEditor.flush()
            const data = levelData.capture(name)
            levelEditor.setData(data)
            simulation.inGameConsole(`<span class='color-var'>levelData</span>.capture(<span class='color-text'>"${name}"</span>) <em>//as ${data.name}</em>`)
        } catch (error) {
            console.error(error)
            simulation.inGameConsole(`<em>//couldn't load ${name}</em>`)
            levelEditor.restart() //capture cleared the world
        }
    },

    //*********************************************************************
    // drawing, runs each cycle as an ephemera, after the map is drawn
    //*********************************************************************
    colors: {
        select: "rgb(0,170,255)",
        pick: "rgb(255,120,0)",
        hover: "rgba(0,170,255,0.6)",
        guide: "rgba(106,102,152,0.6)", //lavender, cyan is only for selected
        grid: "rgba(90,85,150,0.1)", //lavender gray lines, like the panels' on
        axis: "rgba(106,102,152,0.45)",
        snap: "rgba(214,40,140,0.85)", //smart snap guides, magenta so they don't look like the selection
        fix: "#c62a2a", //the analysis' colors, the same as --le-fix, --le-warn, and --le-ok in style.css
        warn: "#c26a00",
        ok: "#2f8a55",
    },
    frame() {
        levelEditor.applyTimeScale()
        if (!levelEditor.isActive || levelEditor.isFullTest) return //JS test looks like a run
        if (levelEditor.debugDraw.size) levelEditor.drawDebug()
        const point = levelEditor.mouse()
        const drag = levelEditor.drag
        const hover = drag || levelEditor.pathDraw || !levelEditor.isMouseOnCanvas ? null : levelEditor.elementAt(point, !!levelEditor.picking && !levelEditor.picking.isLink)
        levelEditor.hoverId = hover ? hover.id : null
        if (levelEditor.picking) { //what can be picked, and the one under the mouse
            for (const el of levelEditor.data.elements) if (levelEditor.canPick(el)) levelEditor.outline(el, levelEditor.colors.pick, el === hover ? 3 : 1.5, el === hover ? [] : [6, 4])
        }
        if (levelEditor.isGridShown) levelEditor.drawGrid()
        if (levelEditor.isCamera) { //where the hidden player is
            ctx.beginPath()
            ctx.arc(m.pos.x, m.pos.y, 30, 0, 2 * Math.PI)
            ctx.setLineDash([6, 6])
            ctx.lineWidth = levelEditor.px(1.5)
            ctx.strokeStyle = "rgba(0,0,0,0.35)"
            ctx.stroke()
            ctx.setLineDash([])
        }
        levelEditor.drawGuides()
        levelEditor.drawProblems()
        if (hover && !levelEditor.selection.includes(hover.id)) {
            levelEditor.outline(hover, levelEditor.colors.hover, 1.5)
            if (hover.group) for (const el of levelEditor.data.elements) if (el.group === hover.group && el !== hover) levelEditor.outline(el, levelEditor.colors.hover, 1.5, [6, 4]) //the rest of its group, dashed, they select together
        }
        const isDragging = drag && (drag.kind === "move" || drag.kind === "handle" || drag.kind === "vertex" || drag.kind === "curveHandle")
        for (const el of levelEditor.selected()) levelEditor.outline(el, levelEditor.colors.select, 3, isDragging ? [9, 5] : []) //thick, so it shows on the dark map
        if (drag && drag.kind === "curveHandle") {
            const el = levelEditor.vertexDragCopy(drag)
            levelEditor.outline(el, levelEditor.colors.select, 2, [], "rgba(0,170,255,0.15)")
            levelEditor.drawVertices(el)
        } else if (drag && drag.kind === "vertex") {
            const { error } = levelEditor.vertexPreview(drag)
            levelEditor.outline(levelEditor.vertexDragCopy(drag), error ? levelEditor.colors.fix : levelEditor.colors.select, 2, [], error ? "rgba(255,0,0,0.15)" : "rgba(0,170,255,0.15)")
            if (error) { //on a light box so it shows over the map
                const x = point.x + levelEditor.px(14)
                const y = point.y + levelEditor.px(22)
                ctx.font = `${levelEditor.px(12)}px monospace`
                ctx.textAlign = "left" //other drawing can leave it centered
                ctx.textBaseline = "alphabetic"
                ctx.fillStyle = "rgba(255,255,255,0.85)"
                ctx.fillRect(x - levelEditor.px(3), y - levelEditor.px(12), ctx.measureText(error).width + levelEditor.px(6), levelEditor.px(16))
                ctx.fillStyle = levelEditor.colors.fix
                ctx.fillText(error, x, y)
            }
        } else if (isDragging) {
            for (const el of levelEditor.dragPreview(drag)) levelEditor.outline(el, levelEditor.colors.select, 2, [], "rgba(0,170,255,0.15)")
        } else if (levelEditor.vertexElement()) {
            levelEditor.drawVertices(levelEditor.vertexElement())
        } else if (levelEditor.selection.length === 1) {
            levelEditor.drawHandles(levelEditor.selected()[0])
        }
        if (drag && (drag.kind === "draw" || drag.kind === "box")) levelEditor.drawDragRect(drag)
        if (levelEditor.pathDraw && levelEditor.pathDraw.points.length) levelEditor.drawPathPreview()
        const palette = levelEditor.paletteDrag
        if (palette && palette.isDragging && levelEditor.isMouseOnCanvas) { //where an add button being dragged would go
            const made = levelEditor.creation(palette.command, palette.arg, point)
            if (made) for (const el of made.elements) levelEditor.outline(el, levelEditor.colors.select, 2, [6, 4], "rgba(0,170,255,0.15)")
        }
        if (drag && drag.kind === "measure") levelEditor.measure.end = levelEditor.smartPoint(point, drag)
        if (drag) levelEditor.drawSnapGuides(drag)
        if (levelEditor.measure) levelEditor.drawMeasure(levelEditor.measure)
        if (levelEditor.isMouseOnCanvas) levelEditor.drawLabel(point)
        if (hover && !drag && levelEditor.problems.has(hover.id)) levelEditor.drawTip(point, levelEditor.problems.get(hover.id))
        levelEditor.updateStatusMouse(point)
    },
    //*********************************************************************
    // simulation menu, measure tool, and physics numbers
    //*********************************************************************
    debugLayers: [ //[name, tooltip], drawn over the level by drawDebug()
        ["wireframe", "every body's outline, map, blocks, mobs, the player, power ups, and bullets"],
        ["bounds", "each body's axis aligned bounding box, it stretches with velocity"],
        ["constraints", "every Matter constraint, its two points and the line between them"],
        ["centers", "each body's center of mass and angle"],
        ["collisions", "contact points between bodies touching this frame"],
    ],
    applyTimeScale() { //the game takes one physics step a frame: slow motion lowers the frame cap, faster takes extra steps a frame (simulation.extraCycles), stopped is the game's time stop
        const isOn = levelEditor.isActive && !levelEditor.isFullTest
        const isStopped = isOn && levelEditor.isTimeStopped
        const scale = isOn && !isStopped ? levelEditor.timeScale : 1
        simulation.extraCycles = Math.max(0, scale - 1)
        if (isStopped) {
            m.immuneCycle = m.cycle + 10 //like m.timeStop(), nothing hurts while it's stopped
            m.freezeTime()
            levelEditor.isTimeFrozen = true
        } else if (levelEditor.isTimeFrozen) {
            levelEditor.isTimeFrozen = false
            m.wakeCheck()
        }
        if (scale < 1) {
            const fps = Math.round(60 * scale)
            if (simulation.fpsCap !== fps) { //taking damage and new levels set it back
                simulation.fpsCap = fps
                simulation.fpsInterval = 1000 / fps
            }
            levelEditor.isTimeScaled = true
        } else if (levelEditor.isTimeScaled) {
            levelEditor.isTimeScaled = false
            simulation.fpsCap = simulation.fpsCapDefault
            simulation.fpsInterval = 1000 / simulation.fpsCap
        }
    },
    drawDebug() {
        const layers = levelEditor.debugDraw
        const bodies = Composite.allBodies(engine.world)
        const width = levelEditor.px(1)
        if (layers.has("bounds")) {
            ctx.beginPath()
            for (const who of bodies) ctx.rect(who.bounds.min.x, who.bounds.min.y, who.bounds.max.x - who.bounds.min.x, who.bounds.max.y - who.bounds.min.y)
            ctx.lineWidth = width
            ctx.strokeStyle = "rgba(255,0,200,0.35)"
            ctx.stroke()
        }
        if (layers.has("wireframe")) {
            ctx.beginPath()
            for (const who of bodies) {
                for (let i = who.parts.length > 1 ? 1 : 0; i < who.parts.length; i++) {
                    const v = who.parts[i].vertices
                    ctx.moveTo(v[0].x, v[0].y)
                    for (let j = 1; j < v.length; j++) ctx.lineTo(v[j].x, v[j].y)
                    ctx.lineTo(v[0].x, v[0].y)
                }
            }
            ctx.lineWidth = width
            ctx.strokeStyle = "rgba(0,200,120,0.9)"
            ctx.stroke()
        }
        if (layers.has("centers")) {
            ctx.beginPath()
            for (const who of bodies) {
                const r = levelEditor.px(3)
                ctx.moveTo(who.position.x + r, who.position.y)
                ctx.arc(who.position.x, who.position.y, r, 0, 2 * Math.PI)
                ctx.moveTo(who.position.x, who.position.y)
                ctx.lineTo(who.position.x + levelEditor.px(12) * Math.cos(who.angle), who.position.y + levelEditor.px(12) * Math.sin(who.angle))
            }
            ctx.lineWidth = width
            ctx.strokeStyle = "rgba(0,0,0,0.7)"
            ctx.stroke()
        }
        if (layers.has("constraints")) {
            ctx.beginPath()
            for (const c of Composite.allConstraints(engine.world)) {
                const a = c.bodyA ? Vector.add(c.bodyA.position, c.pointA) : c.pointA
                const b = c.bodyB ? Vector.add(c.bodyB.position, c.pointB) : c.pointB
                ctx.moveTo(a.x, a.y)
                ctx.lineTo(b.x, b.y)
                ctx.moveTo(a.x + levelEditor.px(3), a.y)
                ctx.arc(a.x, a.y, levelEditor.px(3), 0, 2 * Math.PI)
                ctx.moveTo(b.x + levelEditor.px(3), b.y)
                ctx.arc(b.x, b.y, levelEditor.px(3), 0, 2 * Math.PI)
            }
            ctx.lineWidth = levelEditor.px(1.5)
            ctx.strokeStyle = "rgba(120,0,255,0.8)"
            ctx.stroke()
        }
        if (layers.has("collisions")) {
            ctx.beginPath()
            for (const pair of engine.pairs.list) {
                if (!pair.isActive) continue
                for (const support of pair.collision.supports) {
                    ctx.moveTo(support.x + levelEditor.px(2.5), support.y)
                    ctx.arc(support.x, support.y, levelEditor.px(2.5), 0, 2 * Math.PI)
                }
            }
            ctx.fillStyle = "rgba(255,0,0,0.9)"
            ctx.fill()
        }
    },
    jumpReach() { //how high and far the player jumps, measured in headless Chrome on flat ground: 390 high standing, 570 long running at full speed
        const force = (m.jumpForce / 0.42) * (5 / player.mass) //tech and field changes, the jump's starting speed goes with it
        const gravity = levelEditor.data.gravity || 1
        return { height: 390 * force * force / gravity, distance: 570 * force / gravity }
    },
    canReach(start, end) { //could a jump from standing at start land at end, as high as a jump goes for half its distance, then falling
        const { height, distance } = levelEditor.jumpReach()
        const across = Math.abs(end.x - start.x)
        const reach = across <= distance / 2 ? height : height * (1 - ((across - distance / 2) / (distance / 2)) ** 2)
        return start.y - end.y <= reach
    },
    drawMeasure({ start, end }) { //the ruler, its numbers, and the jump arc from its start
        const px = levelEditor.px
        const { height, distance } = levelEditor.jumpReach()
        const isReach = levelEditor.canReach(start, end)
        ctx.lineWidth = px(1.5)
        ctx.strokeStyle = levelEditor.colors.guide
        ctx.setLineDash([px(6), px(5)])
        ctx.beginPath() //how far a jump reaches both ways: as high as a jump goes for half its distance, then falling, past where it lands
        const reach = across => across <= distance / 2 ? height : height * (1 - ((across - distance / 2) / (distance / 2)) ** 2)
        for (const side of [-1, 1]) {
            for (let i = 0; i <= 40; i++) {
                const across = 1.5 * distance * i / 40
                const x = start.x + side * across
                const y = start.y - reach(across)
                if (i === 0) ctx.moveTo(x, y)
                else ctx.lineTo(x, y)
            }
        }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.beginPath() //the ruler
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.lineWidth = px(2)
        ctx.strokeStyle = isReach ? levelEditor.colors.ok : levelEditor.colors.fix
        ctx.stroke()
        for (const p of [start, end]) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, px(4), 0, 2 * Math.PI)
            ctx.fillStyle = "#fff"
            ctx.fill()
            ctx.stroke()
        }
        const f = levelEditor.formatValue
        const dx = end.x - start.x
        const dy = end.y - start.y
        const lines = [
            `dx ${f(dx)}  dy ${f(dy)}  d ${f(Number(Math.hypot(dx, dy).toFixed(1)))}  θ ${f(Number((Math.atan2(-dy, dx) * 180 / Math.PI).toFixed(1)))}°`,
            `jump ≈${Math.round(height)} up  ≈${Math.round(distance)} across  ${isReach ? "reach ✓" : "reach ✗"}`,
        ]
        ctx.font = `${px(12)}px monospace`
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"
        const width = Math.max(...lines.map(line => ctx.measureText(line).width))
        const screenX = (end.x + m.transX - canvas.width2) * simulation.zoom + canvas.width2
        const x = screenX + (width + px(20)) * simulation.zoom < canvas.width - 300 ? end.x + px(10) : end.x - px(10) - width //left of the end near the inspector
        const y = end.y - px(10)
        ctx.fillStyle = "rgba(255,255,255,0.85)"
        ctx.fillRect(x - px(4), y - px(13), width + px(8), px(36))
        ctx.fillStyle = "#000"
        ctx.fillText(lines[0], x, y)
        ctx.fillStyle = isReach ? levelEditor.colors.ok : levelEditor.colors.fix
        ctx.fillText(lines[1], x, y + px(16))
    },
    stepDiff(index) { //what a history step changed, for its tooltip
        const steps = levelEditor.history.steps
        if (index === 0 || !steps[index - 1]) return "the level as it was opened"
        const before = JSON.parse(steps[index - 1].json)
        const after = JSON.parse(steps[index].json)
        const short = value => {
            const text = Array.isArray(value) ? `[${value.length}]` : JSON.stringify(value)
            return text === undefined ? "-" : text.length > 24 ? text.slice(0, 23) + "…" : text
        }
        const lines = []
        for (const key of Object.keys({ ...before, ...after })) { //level properties
            if (key === "elements" || key === "nextId") continue
            if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) lines.push(`level.${key} ${short(before[key])} → ${short(after[key])}`)
        }
        const old = new Map(before.elements.map(el => [el.id, el]))
        const now = new Map(after.elements.map(el => [el.id, el]))
        for (const [id, el] of now) {
            const was = old.get(id)
            if (!was) {
                lines.push(`+ ${levelElements.nameOf(el.type)} #${id}`)
                continue
            }
            for (const key of Object.keys({ ...was, ...el })) {
                if (JSON.stringify(was[key]) !== JSON.stringify(el[key])) lines.push(`#${id}.${key} ${short(was[key])} → ${short(el[key])}`)
            }
        }
        for (const [id, el] of old) if (!now.has(id)) lines.push(`- ${levelElements.nameOf(el.type)} #${id}`)
        return lines.length > 12 ? lines.slice(0, 12).concat(`… ${lines.length - 12} more`).join("\n") : lines.join("\n") || "no change"
    },
    drawProblems() { //what the analysis found, outlined where it is, red to fix, orange to look at
        for (const [id, lines] of levelEditor.problems) {
            const el = levelData.find(levelEditor.data, id)
            if (!el || levelEditor.isHidden(el)) continue
            levelEditor.outline(el, lines.some(line => line.status === "fix") ? levelEditor.colors.fix : levelEditor.colors.warn, 2, [8, 5])
        }
    },
    drawTip(point, lines) { //the analysis lines about the element under the mouse, above it on a light box
        ctx.font = `${levelEditor.px(12)}px monospace`
        ctx.textAlign = "left"
        ctx.textBaseline = "alphabetic"
        const texts = lines.map(line => `${line.status} ${line.label}${line.text ? `, ${line.text}` : ""}`)
        const x = point.x + levelEditor.px(14)
        let y = point.y - levelEditor.px(18) - levelEditor.px(16) * (texts.length - 1)
        const width = Math.max(...texts.map(text => ctx.measureText(text).width))
        ctx.fillStyle = "rgba(255,255,255,0.9)"
        ctx.fillRect(x - levelEditor.px(4), y - levelEditor.px(13), width + levelEditor.px(8), levelEditor.px(16) * texts.length + levelEditor.px(4))
        texts.forEach((text, i) => {
            ctx.fillStyle = lines[i].status === "fix" ? levelEditor.colors.fix : levelEditor.colors.warn
            ctx.fillText(text, x, y)
            y += levelEditor.px(16)
        })
    },
    drawGrid() {
        let step = levelEditor.grid
        while (step * simulation.zoom < 10) step *= 4 //lines at least 10 pixels apart
        const { x: left, y: top, width, height } = levelEditor.viewBounds()
        const right = left + width
        const bottom = top + height
        ctx.beginPath()
        for (let x = Math.ceil(left / step) * step; x < right; x += step) {
            ctx.moveTo(x, top)
            ctx.lineTo(x, bottom)
        }
        for (let y = Math.ceil(top / step) * step; y < bottom; y += step) {
            ctx.moveTo(left, y)
            ctx.lineTo(right, y)
        }
        ctx.lineWidth = levelEditor.px(1)
        ctx.strokeStyle = levelEditor.colors.grid
        ctx.stroke()
        ctx.beginPath() //0, 0
        ctx.moveTo(0, top)
        ctx.lineTo(0, bottom)
        ctx.moveTo(left, 0)
        ctx.lineTo(right, 0)
        ctx.strokeStyle = levelEditor.colors.axis
        ctx.stroke()
    },
    drawGuides() { //each type's editor only drawing, like how far a platform travels
        ctx.lineWidth = levelEditor.px(1.5)
        ctx.strokeStyle = levelEditor.colors.guide
        ctx.setLineDash([levelEditor.px(6), levelEditor.px(6)])
        for (const el of levelEditor.data.elements) {
            const type = levelElements.types[el.type]
            if (type && type.overlay && !levelEditor.isHidden(el)) type.overlay(el)
        }
        ctx.setLineDash([])
    },
    outline(el, strokeStyle, width, dash = [], fillStyle = "") {
        ctx.beginPath()
        if (el.type === "laser") {
            ctx.moveTo(el.x, el.y)
            ctx.lineTo(el.x2, el.y2)
        } else {
            const points = levelElements.types[el.type]?.outlinePoints?.(el) || levelElements.points(el) //a path's curves
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
            if (!levelElements.isOpen(el)) ctx.closePath()
        }
        if (fillStyle) {
            ctx.fillStyle = fillStyle
            ctx.fill()
        }
        ctx.lineWidth = levelEditor.px(width)
        ctx.strokeStyle = strokeStyle
        ctx.setLineDash(dash.map(levelEditor.px))
        ctx.stroke()
        ctx.setLineDash([])
    },
    drawHandles(el) {
        const size = levelEditor.px(8)
        ctx.beginPath()
        for (const h of levelElements.handles(el)) ctx.rect(h.x - size / 2, h.y - size / 2, size, size)
        ctx.fillStyle = "#fff"
        ctx.fill()
        ctx.lineWidth = levelEditor.px(1.5)
        ctx.strokeStyle = levelEditor.colors.select
        ctx.stroke()
        const turn = levelEditor.rotateHandle(el)
        if (turn) { //round, on a short line from the top
            ctx.beginPath()
            ctx.moveTo(turn.x, turn.y + size / 2)
            ctx.lineTo(turn.x, turn.y + levelEditor.px(28))
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(turn.x, turn.y, size / 2 + levelEditor.px(1), 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
        }
    },
    drawDragRect(drag) {
        const isDraw = drag.kind === "draw"
        const rect = levelEditor.dragRect(drag, isDraw)
        ctx.fillStyle = isDraw ? (levelEditor.tool === "map" ? "rgba(68,68,68,0.5)" : "rgba(140,140,140,0.5)") : "rgba(0,170,255,0.08)"
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
        ctx.lineWidth = levelEditor.px(1.5)
        ctx.strokeStyle = levelEditor.colors.select
        ctx.setLineDash(isDraw ? [] : [levelEditor.px(5), levelEditor.px(5)])
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
        ctx.setLineDash([])
    },
    drawSnapGuides(drag) { //what the drag lined up with, see snapGuides()
        let b
        if (drag.kind === "move" || (drag.kind === "handle" && drag.handle !== "rotate")) b = levelElements.unionBounds(levelEditor.dragPreview(drag))
        else if (drag.kind === "draw") b = levelEditor.dragRect(drag)
        else if (drag.kind === "vertex") b = { ...levelEditor.vertexPreview(drag).points[drag.index], width: 0, height: 0 }
        else if (drag.kind === "measure") b = { ...levelEditor.measure.end, width: 0, height: 0 }
        else return
        const lines = levelEditor.snapGuides(drag, b)
        if (!lines.length) return
        const pad = levelEditor.px(12) //a little past both ends
        ctx.beginPath()
        for (const line of lines) {
            if (line.axis === "x") {
                ctx.moveTo(line.value, line.from - pad)
                ctx.lineTo(line.value, line.to + pad)
            } else {
                ctx.moveTo(line.from - pad, line.value)
                ctx.lineTo(line.to + pad, line.value)
            }
        }
        ctx.lineWidth = levelEditor.px(1)
        ctx.strokeStyle = levelEditor.colors.snap
        ctx.setLineDash([levelEditor.px(4), levelEditor.px(3)])
        ctx.stroke()
        ctx.setLineDash([])
    },
    drawLabel(point) { //snapped position by the mouse, and the size of a rect being drawn
        const drag = levelEditor.drag
        let text
        if (drag && drag.kind === "draw") {
            const rect = levelEditor.dragRect(drag)
            text = `${rect.width} × ${rect.height}`
        } else if (drag && drag.kind === "vertex") {
            const p = levelEditor.smartPoint(point, drag)
            text = `${levelEditor.formatValue(p.x)}, ${levelEditor.formatValue(p.y)}`
        } else if (drag && drag.kind === "handle" && drag.handle === "rotate") {
            text = `${levelEditor.dragTurn(drag)}°`
        } else if (drag && (drag.kind === "move" || drag.kind === "handle")) {
            const el = levelEditor.dragPreview(drag)[0]
            const f = levelEditor.formatValue
            const p = levelEditor.smartPoint(point, drag)
            text = el.width !== undefined && !el.vertices ? `${f(el.x)}, ${f(el.y)}  ${f(el.width)} × ${f(el.height)}` : drag.kind === "handle" ? `${f(p.x)}, ${f(p.y)}` : `${f(el.x)}, ${f(el.y)}`
        } else { //where the mouse is shows in the status bar
            return
        }
        ctx.font = `${levelEditor.px(12)}px monospace`
        ctx.textAlign = "left" //other drawing can leave it centered
        ctx.textBaseline = "alphabetic"
        ctx.fillStyle = "rgba(0,0,0,0.7)"
        ctx.fillText(text, point.x + levelEditor.px(14), point.y - levelEditor.px(10))
    },

    //*********************************************************************
    // panels, the left one has tools and menus, the right one shows what's selected
    // add a menu to the left panel by adding to levelEditor.sections
    //*********************************************************************
    sections: [ //{ id, title, isClosed, render() }, without a title it's always shown, with one it can be folded, isClosed starts it folded
        {
            id: "top",
            render: () => `<div class="le-row">
                <span class="le-info" data-level-info>${levelEditor.infoText()}</span>
            </div>`,
        },
        {
            id: "load",
            title: "import/export",
            render: () => `<div class="le-load" data-load-local></div>
                <div class="le-grid le-sixths le-gap-above le-flush-x">${levelEditor.button("newLevel", "new", "", false, undefined, { className: "le-third" })}${levelEditor.button("importLevel", "import", "", false, undefined, { className: "le-third" })}${levelEditor.button("code", "export", "", false, undefined, { className: "le-third" })}${levelEditor.button("duplicateLevel", "fork", "", false, undefined, { className: "le-half" })}${levelEditor.button("pool", levelEditor.isInPool() ? "in level pool" : "add to level pool", "", levelEditor.isInPool(), undefined, { className: "le-half" })}</div>
                <a class="le-button le-site-link le-flush-x" href="https://whyisthisnotavalable.github.io/n-vote/" target="_blank" rel="noopener" title="n-vote, a fan site for n-gon maps: upload your export, download other players' maps, and rate them. import a download here to play it, maps are javascript, so only run ones you trust"><span class="site-link-name">n-vote</span><span class="le-site-note">upload, download, rate maps</span></a>
                <div class="le-load" data-load-written></div>`, //the local levels, then new, import, the pool, and export, then the fan site for sharing levels, then the written levels, filled in when it opens, see renderLoadList()
        },
        {
            id: "simulation",
            title: "simulation",
            render: () => { //quick test plays the elements, test export plays the export javascript like a run, the settings it ignores are grayed out while it runs
                const isExport = levelEditor.isFullTest
                const exportNote = isExport ? ", test export ignores this" : ""
                const play = `<svg class="le-play" viewBox="0 0 12 12" aria-hidden="true"><polygon points="2.5,1.5 10.5,6 2.5,10.5"/></svg>` //green outlines, so it doesn't look like a menu's arrow
                const stop = `<svg class="le-stop" viewBox="0 0 12 12" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9"/></svg>` //as big as play
                return `<div class="le-row le-test-settings"><span class="le-row"><span class="le-label">level</span><input class="le-number le-short" aria-label="test level" data-setting="testLevel" value="${levelEditor.testLevel}" spellcheck="false" title="how many levels into a run you're testing, it picks mob types and difficulty, at 0 random mobs don't spawn"></span>
                <span class="le-row"><span class="le-label">seed</span><input class="le-number" aria-label="test seed" data-setting="testSeed" value="${levelEditor.escape(levelEditor.testSeed)}" placeholder="random" spellcheck="false" title="the same seed starts each test the same: mob types, which spots get mobs, bosses, power ups, and debris, what mobs do after is still random, empty is random"></span></div>
            <div class="le-grid le-two le-run le-flush-x">${levelEditor.button("test", levelEditor.isTesting ? `${stop} stop` : `${play} quick test`, "", levelEditor.isTesting)}${levelEditor.button("fullTest", isExport ? `${stop} stop` : `${play} test export`, "", isExport)}</div>
            <div class="le-grid le-time le-flush-x">${levelEditor.button("timeStop", "stop time", "", levelEditor.isTimeStopped, `everything but the player freezes, you can still edit, a speed starts it again${exportNote}`, { disabled: isExport })}${[0.1, 0.5, 1, 2].map(scale => levelEditor.button("timeScale", `${scale}×`, scale, !levelEditor.isTimeStopped && levelEditor.timeScale === scale, `game speed${exportNote}`, { disabled: isExport })).join("")}</div>
            <div class="le-grid le-two le-flush-x">${levelEditor.button("invincible", "invincible", "", levelEditor.isInvincible, "the player takes no damage, in both tests too, the health bars hide")}${levelEditor.button("testSpawning", "mobs", "", levelEditor.isTestSpawning || isExport, `quick test spawns mobs and power ups${isExport ? ", test export always does" : ""}`, { disabled: isExport })}</div>
            <div class="le-grid le-flush-x le-flush-bottom">${levelEditor.button("mouseLook", "mouse look", "", levelEditor.isMouseLook, `the camera leans toward the mouse right away, no smoothing${exportNote}`, { disabled: isExport })}${levelEditor.debugLayers.map(([name, tip]) => levelEditor.button("debugDraw", name, name, levelEditor.debugDraw.has(name), tip + exportNote, { disabled: isExport })).join("")}</div>`
            },
        },
        {
            id: "add",
            title: "add",
            render: () => { //spots, a boss, and a 2nd boss are all a level needs for mobs, and starting, random, and debris for power ups, they show the power ups they can be
                const main = { startingPowerUps: ["gun", "tech", "ammo", "heal"], randomPowerUp: ["heal", "ammo"], debris: ["block", "heal", "ammo"] }
                return `<div class="le-add-part">
                        <div class="le-shapes le-flush-x">${levelElements.presets.map(preset => levelEditor.button("preset", levelEditor.svgIcon(levelEditor.shapeIcons[preset.name] || "", "currentColor"), preset.name, false, `${preset.name}, as map, or block with the block tool`, { className: "le-shape" })).join("")}</div>
                    </div>
                    <div class="le-add-part">
                        <div class="le-grid le-tall le-flush-x">${["mobSpot", "boss", "secondaryBoss"].map(name => levelEditor.addButton(name, `${levelElements.types[name].label}<br>${levelEditor.mobExamplesHtml(name)}`)).join("")}</div>
                    </div>
                    <div class="le-add-part">
                        <div class="le-grid le-tall le-flush-x">${Object.entries(main).map(([name, orbs]) => levelEditor.addButton(name, `${levelElements.types[name].label}<br><span class="le-options">[${orbs.map(levelEditor.orb).join("")}]</span>`)).join("")}</div>
                    </div>
                    <div class="le-add-part" data-add-lists>${levelEditor.addLists()}</div>`
            },
        },
        {
            id: "explorer",
            title: "explorer",
            isClosed: true,
            render: () => `<input class="le-explore-search" data-explore-search value="${levelEditor.escape(levelEditor.exploreSearch)}" placeholder="search: type, #id, or position" spellcheck="false" autocomplete="off">
                <div class="le-explorer" data-explorer>${levelEditor.explorerHtml()}</div>`,
        },
        // { //the help menu, off for now, levelEditor.help and helpHtml() are kept for when it comes back
        //     id: "help",
        //     title: "help",
        //     isClosed: true,
        //     render: () => levelEditor.helpHtml(),
        // },
    ],
    openPanel(name, text, html, mode = "") { //the code panel in the middle of the screen, html shows instead of the text when there is some, copy always copies the text, mode "import" is a box to paste into, "code" edits a code element, "confirm" is the import warning
        levelEditor.fileRequest++
        const panel = document.getElementById("level-editor-code")
        const isConfirm = mode === "confirm"
        if (!isConfirm && mode !== "import") levelEditor.pendingImport = null //back keeps it for the import box
        const textarea = panel.querySelector("textarea")
        const report = panel.querySelector(".le-report")
        panel.querySelector(".le-panel-error")?.remove() //the last code's error
        textarea.value = text
        textarea.parentElement.hidden = !!html //the box and its colors
        textarea.hidden = !!html
        levelEditor.colorPanel()
        const isImport = mode === "import"
        const isEditable = isImport || mode === "code"
        textarea.readOnly = !isEditable
        textarea.placeholder = isImport ? "paste a level's javascript, like export JS writes" : ""
        report.hidden = !html
        report.innerHTML = html || ""
        panel.querySelector("[data-code-name]").textContent = name
        panel.querySelector('[data-command="copyPanel"]').hidden = isEditable || isConfirm
        panel.querySelector('[data-command="downloadPanel"]').hidden = isEditable || !!html
        panel.querySelector('[data-command="openFile"]').hidden = !isImport
        panel.querySelector('[data-command="importText"]').hidden = !isImport
        panel.querySelector('[data-command="applyCode"]').hidden = mode !== "code"
        panel.querySelector('[data-command="codeNext"]').hidden = true //setCodeFocus() shows it
        for (const command of ["importBack", "importNoCode", "importRun"]) panel.querySelector(`[data-command="${command}"]`).hidden = !isConfirm
        panel.classList.add("le-open")
        report.scrollTop = 0
        if (isEditable) {
            textarea.focus()
            textarea.setSelectionRange(0, 0) //from the top
            textarea.scrollTop = 0
        }
    },
    confirmImport(parts) { //the import warning: a pasted level's javascript doesn't run until the player reads it and says so, levelEditor.pendingImport is the level
        const flags = levelData.codeFlags(parts.map(part => part.code).join("\n"))
        const html = `<div class="le-import-warning">this level has javascript, it can do anything a web page can, only run code from people you trust</div>`
            + (flags.length ? `<div class="le-import-flags">look closely at what it does with ${flags.map(flag => `<code>${levelEditor.escape(flag)}</code>`).join(", ")}</div>` : "")
            + parts.map(part => `<div class="le-report-section">${levelEditor.escape(part.where)}</div><pre class="le-import-code">${levelEditor.highlight(part.code)}</pre>`).join("")
        levelEditor.openPanel("import level: run its javascript?", "", html, "confirm")
    },
    importData(imported, note = "") { //imports always get their own local level, the open level is saved first
        const data = levelData.normalize(levelData.copy(imported))
        data.name = levelData.freeName(data.name || "imported")
        levelEditor.setData(data)
        simulation.inGameConsole(`<em>//imported ${data.elements.length} elements as ${levelEditor.escape(data.name)}${note}</em>`)
    },
    //*********************************************************************
    // the code panel shows the whole level as one piece of javascript, opened at what it's for, see levelData.codeLines() and levelData.splitCode()
    //*********************************************************************
    whole: null, //the open panel, { base: the lines it opened from, text, focus: an element's id or "level", ranges: [{ start, end }] its lines, rangeIndex }
    codeDraft: null, //{ text: what the code was, draft: what was typed }, closing keeps what wasn't applied
    openWholeCode(focus) {
        const panel = document.getElementById("level-editor-code")
        const base = levelData.codeLines(levelEditor.data, true)
        const text = base.map(line => line.text).join("\n")
        const draft = levelEditor.codeDraft?.text === text ? levelEditor.codeDraft.draft : text
        levelEditor.codeDraft = null
        levelEditor.codeEditing = "whole"
        levelEditor.openPanel(`${levelData.functionName(levelEditor.data.name)}()`, draft, "", "code")
        levelEditor.whole = { base, text, focus, ranges: [], rangeIndex: 0, lines: draft.split("\n") }
        levelEditor.setCodeFocus(draft)
        panel.querySelector("textarea").focus()
        levelEditor.jumpToLine(levelEditor.whole.ranges[0]?.start ?? levelEditor.levelCodeLine(base))
    },
    levelCodeLine: base => Math.max(0, base.findIndex(line => line.text.trim() === "//level code") + 1),
    setCodeFocus(text) { //which lines are what the panel opened for, where they are in text
        const whole = levelEditor.whole
        const match = levelData.diffLines(whole.base.map(line => line.text), text.split("\n"))
        const ranges = []
        match.forEach((at, line) => {
            if (at === -1 || whole.base[at].owner !== whole.focus) return
            const last = ranges[ranges.length - 1]
            if (last && last.end === line) last.end = line + 1
            else ranges.push({ start: line, end: line + 1 })
        })
        whole.ranges = ranges
        whole.rangeIndex = 0
        whole.lines = text.split("\n")
        document.querySelector('#level-editor-code [data-command="codeNext"]').hidden = ranges.length < 2
    },
    trackCodeFocus(text) { //its lines stay marked as typing moves them, called on each input
        const whole = levelEditor.whole
        if (!whole) return
        const before = whole.lines
        const after = text.split("\n")
        let start = 0
        while (start < before.length && start < after.length && before[start] === after[start]) start++
        let tail = 0
        while (tail < before.length - start && tail < after.length - start && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail++
        const changedEnd = before.length - tail
        const delta = after.length - before.length
        for (const range of whole.ranges) {
            if (range.end <= start) continue
            if (range.start >= changedEnd) {
                range.start += delta
                range.end += delta
            } else {
                range.end = Math.max(range.start + 1, range.end + delta)
            }
        }
        whole.lines = after
    },
    jumpToLine(line) {
        const box = document.querySelector("#level-editor-code textarea")
        const lines = box.value.split("\n")
        const at = lines.slice(0, line).reduce((sum, text) => sum + text.length + 1, 0)
        box.setSelectionRange(at, at)
        box.focus()
        box.scrollTop = Math.max(0, line * parseFloat(getComputedStyle(box).lineHeight) - box.clientHeight / 3)
        box.scrollLeft = 0
        levelEditor.colorPanel()
    },
    setCodeText(text) { //changes what's in the box so ⌘Z in it can still go back, without taking the focus, then ⌘Z stays the level's undo
        const box = document.querySelector("#level-editor-code textarea")
        if (box.value === text) return
        const { selectionStart: caret, scrollTop, scrollLeft } = box
        if (document.activeElement !== box) {
            box.value = text
            box.scrollTop = scrollTop
            box.scrollLeft = scrollLeft
            return
        }
        box.select()
        if (!document.execCommand?.("insertText", false, text) || box.value !== text) box.value = text
        box.setSelectionRange(Math.min(caret, text.length), Math.min(caret, text.length))
        box.scrollTop = scrollTop
        box.scrollLeft = scrollLeft
    },
    refreshWholeCode() { //the level changed and the panel has nothing unapplied, it shows the code now
        const whole = levelEditor.whole
        if (!whole || levelEditor.isApplyingCode) return
        const box = document.querySelector("#level-editor-code textarea")
        if (box.value !== whole.text) return //what's typed wins, splitCode() only changes the lines it touched
        whole.base = levelData.codeLines(levelEditor.data, true)
        whole.text = whole.base.map(line => line.text).join("\n")
        levelEditor.setCodeText(whole.text)
        levelEditor.setCodeFocus(whole.text)
        levelEditor.colorPanel()
    },
    keepCodeDraft() {
        const whole = levelEditor.whole
        const box = document.querySelector("#level-editor-code textarea")
        levelEditor.codeDraft = whole && box.value !== whole.text ? { text: whole.text, draft: box.value } : null
    },
    clearCodeError() {
        document.querySelector("#level-editor-code .le-panel-error")?.remove()
    },
    applySplit(data, split, names) { //what typing changed, into the level's data, returns the ids that changed
        const ids = []
        data.typedCode = split.typed.filter(block => { //a line typed under an element that one of its settings writes is that setting, like a checkbox
            const el = block.part === "setup" && typeof block.after === "number" && levelData.find(data, block.after)
            if (!el || el.edited || !levelElements.isCodeEditable(el)) return true
            const isSetting = levelData.typedIsSetting(el, names.names.get(el.id), names.context, block.lines)
            if (isSetting) ids.push(el.id)
            return !isSetting
        })
        for (const [owner, parts] of split.owners) {
            const text = levelEditor.partsText({ setup: parts.setup.join("\n"), custom: parts.custom.join("\n"), top: parts.top.join("\n") })
            if (owner === "level") {
                data.levelCode = text.split("\n").some(line => line.trim() && !line.trim().startsWith("//")) ? text : ""
                continue
            }
            const el = levelData.find(data, owner)
            if (!el) continue
            ids.push(el.id)
            if (levelElements.isCode(el)) {
                el.code = parts.setup.join("\n")
                continue
            }
            levelData.syncSettings(el, names.names.get(el.id), names.context, text)
            const made = levelData.sectionsText(levelElements.types[el.type].code(el, names.names.get(el.id), names.context))
            const refs = Object.fromEntries(levelData.editedRefs(data, el).map(other => [other, names.names.get(other)]).filter(([, refName]) => refName))
            if (levelData.sortedLines(text) === levelData.sortedLines(levelEditor.partsText(levelEditor.partsOf(made)))) delete el.edited
            else el.edited = { name: names.names.get(el.id), text, names: refs }
        }
        return ids.concat(levelEditor.removeElements(data, split.removed.filter(id => {
            const el = levelData.find(data, id)
            return el && !levelEditor.isSingleton(el)
        })))
    },
    removeElements(data, ids) { //removes them and what can't stay without them, returns every id to rebuild
        ids = ids.slice()
        const left = [] //a buzzsaw stays when its path goes, it's rebuilt without it
        for (const el of data.elements) { //constraints go with the block they hold
            if (!levelElements.types[el.type]?.rebuildWithRefs || ids.includes(el.id) || !levelElements.refKeys(el).some(key => ids.includes(el[key]))) continue
            if (levelElements.types[el.type].outlivesRefs) left.push(el.id)
            else ids.push(el.id)
        }
        levelData.keepTypedPlace(data, ids)
        data.elements = data.elements.filter(el => !ids.includes(el.id))
        for (const el of data.elements) { //links to a deleted button go away
            for (const key of levelElements.refKeys(el)) if (ids.includes(el[key])) el[key] = null
            levelElements.tidyLinks(el)
        }
        return [...ids, ...left]
    },
    isApplyingCode: false,
    applyWholeCode(text) { //the panel's text into the level, code that can't be read returns why and changes nothing, what's typed stays in the box either way
        const whole = levelEditor.whole
        if (!whole || text === whole.text) return ""
        try {
            Function(`"use strict"; return {\n${text}\n}`) //only reads it, nothing runs
        } catch (error) {
            return error.message
        }
        const split = levelData.splitCode(whole.base, text)
        const names = levelData.codeNames(levelEditor.data)
        const candidate = levelData.copy(levelEditor.data)
        levelEditor.applySplit(candidate, split, names)
        const problem = levelEditor.sharedProblem(candidate)
        if (problem) return problem
        levelEditor.isApplyingCode = true
        const isChanged = levelEditor.edit("edit code", data => levelEditor.applySplit(data, split, names))
        levelEditor.isApplyingCode = false
        whole.base = levelData.codeLines(levelEditor.data, true)
        whole.text = whole.base.map(line => line.text).join("\n")
        levelEditor.setCodeText(whole.text)
        levelEditor.setCodeFocus(whole.text)
        levelEditor.colorPanel()
        if (isChanged) levelEditor.restart() //the level's code runs when it starts
        levelEditor.renderRight()
        if (split.restored) simulation.inGameConsole(`<em>//${split.restored} line${split.restored === 1 ? "" : "s"} the editor writes came back, change them in the level's or element's settings</em>`)
        return ""
    },
    partsOf(text) { //{ setup, custom, top } text from code with the comment lines that start each part, without them, or the blank lines around each
        const sections = levelData.sectionsOf(text || "")
        const setup = levelEditor.trimLines(sections.setup)
        if (setup[0]?.trim().startsWith(levelData.zones.setup)) setup.shift()
        return { setup: levelEditor.trimLines(setup).join("\n"), custom: levelEditor.trimLines(sections.custom).join("\n"), top: levelEditor.trimLines(sections.top).join("\n") }
    },
    partsText(parts) { //the three parts back to one text with their comment lines, like the info box shows and el.edited and data.levelCode keep
        const lines = text => levelEditor.trimLines(String(text).split("\n").map(line => line.replace(/^(\s*)\/\/level\.custom/, "$1// level.custom"))) //a comment typed like a part's start can't start one
        return levelData.sectionsText({ setup: lines(parts.setup), custom: lines(parts.custom), top: lines(parts.top) })
    },
    trimLines(lines) { //without blank lines at the start and end
        let start = 0
        let end = lines.length
        while (start < end && !lines[start].trim()) start++
        while (end > start && !lines[end - 1].trim()) end--
        return lines.slice(start, end)
    },
    copy(text, name) {
        navigator.clipboard.writeText(text).then(() => simulation.inGameConsole(`<em>//copied ${levelEditor.escape(name)}</em>`), () => simulation.inGameConsole(`<em>//copy failed</em>`))
    },
    keyCap(command) { //a command's first key, styled like the keys in the pause menu
        return `<span class="pause-hint le-key-cap"><strong class="key-input-train">${levelEditor.keyText(levelEditor.commands[command].keys[0])}</strong></span>`
    },
    isInPool() {
        return !!localSettings.levelPool && localSettings.levelPool.added.includes(levelEditor.data.name)
    },
    roundTips: { //a fill's shape buttons
        fill: "a rect around it, an ellipse's turn goes away",
        circle: "a circle in the middle, as big as it is on average",
        ellipse: "an ellipse that fits it, with a radius each way and an angle",
    },
    elementGroups() { //the add menu's level elements by kind, each has its own button and list, types not listed go in the last
        const groups = [
            { title: "draw", names: ["fill", "path", "text", "drip", ...Object.keys(levelElements.decorations)] }, //exit fill comes with fill, it's a named preset
            { title: "triggers", names: ["button", "logic", "keyhole", "zone", "key", "mobClear"] }, //two columns, left is button, keyhole, key, right is logic, zone, mob clear
            { title: "elements", names: ["laser", "slime", "buzzsaw", "boost", "mover", "transport", "elevator", "door", "oneWay", "spinner", "vanish", "portal", "fizzler", "wind", "gravityZone", "dispenser"] }, //common ones first, then platforms, portal and fizzler together, the rarely used last
        ]
        const listed = new Set(groups.flatMap(group => group.names))
        groups[groups.length - 1].names.push(...levelElements.groups.element.filter(name => !listed.has(name) && !levelElements.types[name].isAddedAs))
        return groups.map(group => ({ ...group, names: group.names.filter(name => levelElements.types[name]) }))
    },
    addTabs: [["elements", "element", () => levelEditor.elementList("elements")], ["powerUps", "power up", () => levelEditor.powerUpList()], ["mobs", "mob", () => levelEditor.mobList()], ["triggers", "trigger", () => levelEditor.elementList("triggers")], ["draw", "draw", () => levelEditor.elementList("draw")], ["bosses", "boss", () => levelEditor.bossList()]], //[name, button text, its list]
    addLists() { //the recent row, then six buttons in two rows that open their list under them, one at a time, a list's buttons can be clicked or dragged onto the level
        const open = levelEditor.addTabs.find(([name]) => name === levelEditor.addTab)
        return `<div class="le-shapes le-draws le-flush-x">${levelEditor.recentAddsHtml()}</div><div class="le-grid le-flush-x">${levelEditor.addTabs.map(([name, text]) => levelEditor.button("addTab", text, name, name === levelEditor.addTab, `${name === levelEditor.addTab ? "close" : "open"} the ${text} list`, { className: "le-add-tab" })).join("")}</div>${open ? `<div class="le-add-list">${open[2]()}</div>` : ""}`
    },
    addGroup(title, items) { //a titled part of a list, or no title for one that doesn't need it
        return `${title ? `<div class="le-label le-load-header">${title}</div>` : ""}<div class="le-grid le-add-grid le-flush-x">${items.join("")}</div>`
    },
    addItem(command, arg, picture, text, tip) { //one of a list's buttons, using it puts it in the recent row, see setRecentAdd()
        return levelEditor.button(command, `${picture}<span>${levelEditor.escape(text)}</span>`, arg, command === "drawPath" && !!levelEditor.pathDraw, tip, { className: "le-add-item" })
    },
    drawBasics: ["fill", "path", "text", "fill:exit fill"], //the first two rows of the draw list, the general ones, the ready made ones go under a graphics title
    elementList(title) { //one kind of level element, and each named preset like exit fill
        const item = arg => {
            const [name, preset] = arg.split(":")
            const type = levelElements.types[name]
            if (preset) return levelEditor.addItem("add", arg, levelEditor.elementIcon(arg), preset, (type.tips && type.tips[preset]) || `add ${preset}`)
            return levelEditor.addItem(type.addCommand || "add", name, levelEditor.elementIcon(name), type.label, type.tip || `add ${type.label}`)
        }
        const args = levelEditor.elementGroups().find(group => group.title === title).names.flatMap(name => [name, ...(levelElements.types[name].names || []).map(preset => `${name}:${preset}`)])
        if (title !== "draw") return levelEditor.addGroup("", args.map(item))
        return levelEditor.addGroup("", levelEditor.drawBasics.map(item)) + levelEditor.addGroup("graphics", args.filter(arg => !levelEditor.drawBasics.includes(arg)).map(item))
    },
    addButton(name, text) { //its tooltip is the type's tip
        const type = levelElements.types[name]
        const command = type.addCommand || "add"
        const isOn = command === "drawPath" && !!levelEditor.pathDraw
        return levelEditor.button(command, text || type.label, name, isOn, type.tip || `add ${type.label}`)
    },
    powerUpList() { //every power up with its orb
        const type = levelElements.types.powerUp
        return levelEditor.addGroup("", type.names.map(name => levelEditor.addItem("add", `powerUp:${name}`, levelEditor.orb(name), name, type.tips[name] || name)))
    },
    namedMobGroups(tiers) { //a titled part for each tier that has any, with their pictures
        const icons = levelEditor.mobIcons || {}
        return tiers.map((names, i) => names.length ? levelEditor.addGroup(`tier ${i}`, names.map(name => levelEditor.addItem("add", `namedMob:${name}`, icons[name] || "", name, name))) : "").join("")
    },
    bossList() { //every boss by tier
        return levelEditor.namedMobGroups(spawn.bossTier)
    },
    mobList() { //a random group and a nest, then every mob by tier
        const random = ["mobGroup", "nest"].map(name => levelEditor.addItem("add", name, levelEditor.elementIcon(name), levelElements.types[name].label, levelElements.types[name].tip))
        return levelEditor.addGroup("random", random) + levelEditor.namedMobGroups(spawn.tier)
    },
    recall(key, fallback) { //an editor setting saved with remember(), or fallback, localStorage can be blocked, older saves are plain text
        try {
            const text = localStorage.getItem(key)
            if (text === null) return fallback
            try {
                return JSON.parse(text)
            } catch (error) {
                return text
            }
        } catch (error) {
            return fallback
        }
    },
    remember(key, value) { //an editor setting for next time, like the camera mode or which menus are open
        try {
            localStorage.setItem(key, JSON.stringify(value))
        } catch (error) { }
    },
    openSections() { //which sections are folded, remembered for next time
        return levelEditor.recall("levelEditorSections", {}) || {}
    },
    escape(text) {
        return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    },
    button(command, text, arg = "", isOn = false, title = levelEditor.tip(command), { className = "", disabled = false } = {}) { //className adds classes, like le-half, le-wide, or le-shape
        return `<button class="le-button${isOn ? " le-on" : ""}${className ? ` ${className}` : ""}" data-command="${command}" data-arg="${levelEditor.escape(arg)}" title="${levelEditor.escape(title)}"${disabled ? " disabled" : ""}>${text}</button>`
    },
    renderLeft() {
        const open = levelEditor.openSections()
        document.getElementById("level-editor-left").innerHTML = levelEditor.sections.map(section => section.title ?
            `<details class="le-section" data-section="${section.id}"${open[section.id] ?? !section.isClosed ? " open" : ""}><summary>${section.title}</summary><div class="le-details">${section.render()}</div></details>` :
            `<div class="le-section">${section.render()}</div>`).join("")
        levelEditor.updateHistoryButtons()
        if (document.querySelector('#level-editor-left [data-section="load"]').open) levelEditor.renderLoadList()
        levelEditor.renderStatus()
    },
    renderStatus() { //the bar along the bottom, like VS Code's: grid, zoom, tools, and the mouse, then on the right the analysis, history, and tab hide
        document.getElementById("level-editor-status").innerHTML = `<span class="le-status-item" title="snap size, hold alt to place freely"><input class="le-number" aria-label="grid size" data-setting="grid" value="${levelEditor.grid}" spellcheck="false"><span class="le-segment">${levelEditor.button("grid", "grid", "", levelEditor.isGridShown)}${levelEditor.button("smartSnap", "snap", "", levelEditor.isSmartSnap)}</span></span>
            <span class="le-status-item" title="the editor's zoom, the wheel zooms too">${levelEditor.button("levelZoom", levelEditor.statusIcon("zoom"), "", false, undefined, { className: "le-icon-button" })}<input class="le-number" aria-label="editor zoom" data-setting="zoom" value="${Math.round(levelEditor.zoomScale)}" spellcheck="false">${levelEditor.button("fit", "fit")}</span>
            <span class="le-status-item">${levelEditor.keyCap("ghost")}<span class="le-segment le-tool-icons">${levelEditor.button("ghost", levelEditor.statusIcon("ghost"), "", levelEditor.isCamera, undefined, { disabled: levelEditor.isFullTest })}</span></span>
            <span class="le-status-item">${levelEditor.keyCap("tool")}<span class="le-segment le-tool-icons">${levelEditor.tools.map(tool => levelEditor.button("tool", levelEditor.toolIcon(tool), tool, levelEditor.tool === tool, levelEditor.toolTips[tool] || tool)).join("")}</span></span>
            <span class="le-status-mouse" data-status-mouse title="where the mouse is, snapped to the grid"></span>
            <span class="le-status-item le-status-right">
                <button class="le-button le-status-unsaved" data-command="code" data-status-unsaved${levelData.store.isFailing ? "" : " hidden"} title="the browser wouldn't save the level, storage is full or blocked, export it and copy it somewhere safe">not saved, export a backup</button>
                <button class="le-button le-status-problems${levelEditor.problemIsFix ? " le-status-fix" : ""}" data-command="analyze" data-status-problems title="${levelEditor.escape(levelEditor.tip("analyze"))}">${levelEditor.problemText}</button>
            </span>
            <span class="le-status-item">${levelEditor.keyCap("undo")}<span class="le-segment le-history-box">${levelEditor.button("undo", levelEditor.arrowIcon("undo"))}${levelEditor.button("redo", levelEditor.arrowIcon("redo"))}${levelEditor.button("history", "history ▴", "", levelEditor.isHistoryOpen)}</span></span>
            <button class="le-status-item le-status-tab" data-command="panels" title="${levelEditor.escape(levelEditor.tip("panels"))}">${levelEditor.keyCap("panels")} hide</button>`
        levelEditor.statusMouse = ""
        levelEditor.updateHistoryButtons()
        levelEditor.countProblems(0)
    },
    updateSaveWarning(isFailing) { //levelData.store.onChange, the status bar warns while the level can't be saved
        const warning = document.querySelector?.("[data-status-unsaved]")
        if (warning) warning.hidden = !isFailing
    },
    creation(command, arg, at) { //what an add button makes, its middle at at, snapped, or 100 above the middle of the view, for clicking and dragging onto the level
        const view = levelEditor.viewCenter()
        const center = levelEditor.snapPoint(at || (levelEditor.isCamera ? view : { x: view.x, y: view.y - 100 })) //above the player, not on top of it where it's hard to see, in camera mode in the middle
        if (command === "preset") {
            const preset = levelElements.presets.find(p => p.name === arg)
            if (!preset) return null
            const typeName = levelEditor.tool === "block" ? "block" : "map"
            const [w, h] = preset.size
            const x = levelEditor.snap(center.x - w / 2)
            const y = levelEditor.snap(center.y - h / 2)
            const elements = preset.rects ?
                preset.rects(w, h).map(([rx, ry, rw, rh]) => levelElements.create(typeName, { x: x + rx, y: y + ry, width: rw, height: rh })) :
                [levelElements.create(typeName)]
            if (!preset.rects) levelElements.setPoints(elements[0], preset.points(w, h).map(([px, py]) => ({ x: x + px, y: y + py })))
            return { elements, label: `add ${arg} ` }
        }
        const [typeName, preset] = arg.split(":")
        const type = levelElements.types[typeName]
        if (!type) return null
        const values = preset && type.preset ? type.preset(preset, levelEditor.data) : {}
        const el = levelElements.create(typeName, values)
        if (at || values.x === undefined || values.y === undefined) { //clicking a preset with a place leaves it there, like the exit fill around the exit
            const b = levelElements.bounds(el)
            levelElements.move(el, center.x - levelEditor.snap(b.x + b.width / 2), center.y - levelEditor.snap(b.y + b.height / 2), true)
        }
        return { elements: [el], label: `add ${preset ? `${preset} ` : ""}` }
    },
    fixSpot(typeName) { //where an analysis fix puts what it adds: on top of a map piece, as far from the entrance as written levels keep it, and apart from others like it
        const data = levelEditor.data
        const context = levelAnalysis.context(data, {})
        const norms = levelAnalysis.norms
        const tops = data.elements.filter(el => el.type === "map").map(el => levelElements.bounds(el)).filter(b => b.width > 60)
        if (!tops.length) return null
        const isBoss = typeName === "boss" || typeName === "secondaryBoss"
        const lift = isBoss ? 100 : typeName === "mobSpot" ? 60 : 40 //above the ground by about its size
        const fromEnter = norms.near[typeName] || (levelElements.types[typeName]?.group === "mob" ? norms.near.mob : 300)
        const apart = isBoss ? norms.bossApart : 300
        const others = data.elements.filter(el => el.type === typeName || (isBoss && (el.type === "boss" || el.type === "secondaryBoss")))
        const total = tops.reduce((sum, b) => sum + b.width, 0)
        let best = null
        let bestScore = -1
        for (let i = 0; i < 300; i++) { //random spots along the tops of the map, wider pieces get more, the best one that isn't in the map wins
            let r = Math.random() * total
            const b = tops.find(top => (r -= top.width) < 0) || tops[0]
            const point = { x: Math.round(b.x + 30 + Math.random() * (b.width - 60)), y: b.y - lift }
            if (levelAnalysis.inMap(context, point)) continue
            const enter = context.spawn ? Math.hypot(point.x - context.spawn.x, point.y - context.spawn.y) / fromEnter : 1
            const near = others.length ? Math.min(...others.map(el => Math.hypot(point.x - el.x, point.y - el.y))) / apart : 1
            const score = Math.min(enter, near, 1) + 0.001 * Math.random() //far enough is enough, then any spot that is
            if (score > bestScore) {
                best = point
                bestScore = score
            }
        }
        return best
    },
    place(made) { //adds what creation() made as one undo step and selects it
        if (!made) return
        for (const el of made.elements) levelEditor.unstack(el, made.elements)
        const ids = []
        levelEditor.edit(`${made.label}${levelEditor.describe(made.elements)}`, data => {
            for (const el of made.elements) ids.push(levelData.add(data, el).id)
            return ids
        })
        levelEditor.select(ids)
    },
    toggleView(types, ids, arg) { //the explorer's hide and lock, returns the ids it changed
        const [kind, key] = String(arg).split(":")
        const value = kind === "type" ? key : Number(key)
        const set = kind === "type" ? types : ids
        if (set.has(value)) set.delete(value)
        else set.add(value)
        levelEditor.renderExplorer()
        return levelEditor.data.elements.filter(el => kind === "type" ? el.type === key : el.id === value).map(el => el.id)
    },
    explorerHtml() { //every element by type, each type folds, with hide and lock for the type and each element
        const data = levelEditor.data
        if (!data) return ""
        const open = levelEditor.openSections()
        const types = [...new Set([...levelElements.buildOrder.flatMap(group => levelElements.groups[group]), ...data.elements.map(el => el.type)])]
        return types.map(typeName => {
            const list = data.elements.filter(el => el.type === typeName)
            if (!list.length) return ""
            const type = levelElements.types[typeName]
            const label = type ? type.label : typeName
            const canHide = levelEditor.isHideable(list[0])
            const toggles = (arg, isHidden, isLocked) => `${canHide ? levelEditor.button("hide", "hide", arg, isHidden) : ""}${levelEditor.button("lock", "lock", arg, isLocked)}`
            const search = levelEditor.exploreSearch.trim().toLowerCase()
            const matches = search ? list.filter(el => `${label} ${levelElements.summary(el)} #${el.id}`.toLowerCase().includes(search)) : list
            if (!matches.length) return ""
            const shown = matches.slice(0, levelEditor.exploreLimits[typeName] || 100) //a big level's maps would be a long list, show more lists more
            const rows = shown.map(el => `<div class="le-explore-row${levelEditor.selection.includes(el.id) ? " le-selected" : ""}">
                <button class="le-button le-explore-name" data-command="jumpTo" data-arg="${el.id}" title="select it and go to it">${levelEditor.escape(type && type.isCode ? levelElements.codeTitle(el) : levelElements.summary(el))} <span class="le-id">#${el.id}</span></button>${toggles(`id:${el.id}`, levelEditor.hiddenIds.has(el.id), levelEditor.lockedIds.has(el.id))}</div>`).join("")
            const more = matches.length > shown.length ? `<div class="le-row">${levelEditor.button("exploreMore", `show more (${matches.length - shown.length} left)`, typeName)}</div>` : ""
            return `<details class="le-explore-group" data-section="explore-${typeName}"${open[`explore-${typeName}`] || search ? " open" : ""}><summary><span class="le-explore-type">${levelEditor.escape(label)} <span class="le-id">${search ? `${matches.length} of ` : ""}${list.length}</span></span>${toggles(`type:${typeName}`, levelEditor.hiddenTypes.has(typeName), levelEditor.lockedTypes.has(typeName))}</summary>${rows}${more}</details>`
        }).join("")
    },
    renderExplorer() { //after changes and selecting, only while it's open
        const box = document.querySelector("#level-editor-left [data-explorer]")
        if (!box || !box.closest("details").open) return
        box.innerHTML = levelEditor.explorerHtml()
    },
    updatePanels() { //tab hides the panels, a hint says how to get them back, invincible hides the health bars and the left panel moves up
        document.body.classList.toggle("le-panels-hidden", levelEditor.isActive && levelEditor.isPanelsHidden)
        document.body.classList.toggle("le-invincible", levelEditor.isActive && levelEditor.isInvincible)
        const hint = document.getElementById("level-editor-hint")
        if (hint) hint.innerHTML = `${levelEditor.isFullTest ? "test export · " : ""}${levelEditor.keyCap("panels")} show`
    },
    updateStatusMouse(point) { //each frame, only touches the page when it changes
        const p = levelEditor.snapPoint(point)
        const text = levelEditor.isMouseOnCanvas ? `${levelEditor.formatValue(p.x)}, ${levelEditor.formatValue(p.y)}` : ""
        if (text === levelEditor.statusMouse) return
        levelEditor.statusMouse = text
        const span = document.querySelector("#level-editor-status [data-status-mouse]")
        if (span) span.textContent = text
    },
    countProblems(delay = 2000) { //background analysis waits for edits to settle; explicit checks can run immediately
        clearTimeout(levelEditor.problemTimer)
        levelEditor.problemTimer = setTimeout(() => {
            const button = document.querySelector("#level-editor-status [data-status-problems]")
            if (!button || !levelEditor.data) return
            const report = levelEditor.analysisReport = levelEditor.runAnalysis()
            const counts = levelAnalysis.counts(report)
            levelEditor.problems = new Map()
            for (const section of report.sections) {
                for (const line of section.lines) {
                    if (line.status !== "fix" && line.status !== "warn") continue
                    for (const id of line.ids || []) {
                        if (!levelEditor.problems.has(id)) levelEditor.problems.set(id, [])
                        levelEditor.problems.get(id).push(line)
                    }
                }
            }
            const parts = [counts.fix && `${counts.fix} fix`, counts.warn && `${counts.warn} warn`].filter(Boolean)
            button.textContent = levelEditor.problemText = parts.length ? parts.join(" · ") : "✓ ready" //kept, so redrawing the bar doesn't blank it
            levelEditor.problemIsFix = !!counts.fix
            button.classList.toggle("le-status-fix", levelEditor.problemIsFix)
            if (levelEditor.isAnalysisShown) levelEditor.renderRight() //it's up to date as the level changes
        }, delay)
    },
    infoText() { //the top of the left panel, which level this is
        const count = levelEditor.data.elements.length
        return `<span class="le-name">${levelEditor.escape(levelEditor.data.name)}</span> <span class="le-id">${count} element${count === 1 ? "" : "s"}</span>`
    },
    updateHistoryButtons() {
        const info = document.querySelector("#level-editor-left [data-level-info]")
        if (info) info.innerHTML = levelEditor.infoText() //after any change, and renaming
        const history = levelEditor.history
        const undo = document.querySelector(`#level-editor-status [data-command="undo"]`)
        const redo = document.querySelector(`#level-editor-status [data-command="redo"]`)
        if (undo) undo.disabled = history.index === 0
        if (redo) redo.disabled = history.index === history.steps.length - 1
        const list = document.querySelector("#level-editor-history [data-history]")
        if (list && levelEditor.isHistoryOpen) {
            const scroll = list.scrollTop
            list.innerHTML = levelEditor.historyList()
            list.scrollTop = scroll
        }
    },
    historyList() { //newest at the top, undone steps are grey and can be redone
        const history = levelEditor.history
        return history.steps.map((step, i) => `<button class="le-button le-step${i === history.index ? " le-on" : ""}${i > history.index ? " le-undone" : ""}" data-command="rewind" data-arg="${i}" title="${levelEditor.escape(step.label)}">${levelEditor.escape(step.label)}</button>`).reverse().join("")
    },
    storageText() { //how much of localStorage is used, it's shared with settings and checkpoints
        const used = levelData.store.used()
        const quota = levelData.store.quota
        const size = n => n < 100000 ? `${Math.ceil(n / 1000)} kB` : `${Number((n / 1000000).toFixed(1))} MB`
        return `<span class="le-storage${used > 0.8 * quota ? " le-storage-full" : ""}" title="saved in your browser, shared with settings and checkpoints">${size(used)} of ${size(quota)} used</span>`
    },
    renderLoadList() {
        const current = levelEditor.data.name
        const open = levelEditor.openSections()
        const group = (title, items, note = "") => items.length ? `<div class="le-label le-load-header">${title}${note}</div><div class="le-load-pairs">${items.join("")}</div>` : "" //local levels, each with its delete button, apart so the × is clearly its own
        const titled = (title, items) => items.length ? `<div class="le-label le-load-header">${title}</div><div class="le-grid le-load-grid le-flush-x">${items.join("")}</div>` : ""
        levelEditor.flush() //so the level being edited counts
        const written = (source, names) => names.map(name => levelEditor.button("load", name, `${source}:${name}`))
        const hidden = ["template", "testing", "null"]
        document.querySelector("#level-editor-left [data-load-local]").innerHTML =
            group("local", levelData.store.names().map(name => `<span class="le-pair">${levelEditor.button("load", name, `local:${name}`, name === current)}${levelEditor.button("deleteLevel", "×", name)}</span>`), levelEditor.storageText())
        document.querySelector("#level-editor-left [data-load-written]").innerHTML =
            `<details class="le-load-group" data-section="load-written"${open["load-written"] ? " open" : ""}><summary>load more levels</summary>${ //written levels fold away
                titled("n-gon", written("written", Object.keys(level.maps).filter(name => !hidden.includes(name)))) +
                titled("community", written("more", level.communityLevels)) +
                titled("training", written("more", level.trainingLevels)) +
                titled("other", written("written", ["testing"])) //the level.maps.testing sandbox
            }</details>`
    },

    //*********************************************************************
    // inspector, the right panel, the selected element's properties written like code
    //*********************************************************************
    renderRight() {
        const elements = levelEditor.selected()
        const panel = document.getElementById("level-editor-right")
        if (levelEditor.isAnalysisShown) {
            panel.innerHTML = levelEditor.inspectAnalysis()
        } else if (elements.length === 1) {
            panel.innerHTML = levelEditor.inspectElement(elements[0])
        } else if (elements.length > 1) {
            panel.innerHTML = levelEditor.inspectMany(elements)
        } else {
            panel.innerHTML = levelEditor.inspectLevel()
        }
        for (const box of panel.querySelectorAll("[data-mixed]")) box.indeterminate = true //a checkbox for many that don't match, the dash state
        levelEditor.inspected = levelEditor.isAnalysisShown ? "analysis" : elements.map(el => `${el.id}:${el.type}`).join()
        levelEditor.renderExplorer()
    },
    refreshRight() { //redraws, or while a field has focus only updates the values, so typing and arrow keys aren't interrupted
        const elements = levelEditor.selected()
        const panel = document.getElementById("level-editor-right")
        if (elements.map(el => `${el.id}:${el.type}`).join() !== levelEditor.inspected || !panel.contains(document.activeElement)) return levelEditor.renderRight()
        levelEditor.refreshFields(panel)
    },
    refreshFields(root = document.getElementById("level-editor-right")) { //new values in the fields, except the one being typed in, the level properties are in the inspector with nothing selected
        for (const input of root.querySelectorAll("[data-key]")) {
            if (input === document.activeElement || input.dataset.owner === "many") continue
            const owner = levelEditor.ownerOf(input)
            const prop = owner && levelEditor.findProp(input.dataset.key, owner)
            if (!prop) continue
            const value = levelEditor.propValue(owner, prop)
            if (input.type === "checkbox") {
                input.checked = !!value
            } else {
                input.value = levelEditor.formatValue(value)
                if (input.matches(".le-value")) input.style.width = levelEditor.fieldWidth(input.value)
            }
            const swatch = input.parentElement.querySelector("[data-swatch]")
            if (swatch) swatch.value = levelEditor.hexColor(value)
        }
        const js = root.querySelector(".le-js-view")
        const elements = levelEditor.selected()
        if (js && elements.length === 1) js.innerHTML = levelEditor.highlight(levelData.elementCode(levelEditor.data, elements[0]))
    },
    ownerOf(input) { //the level for level property fields, or the selected element
        if (input.dataset.owner === "level") return levelEditor.data
        const elements = levelEditor.selected()
        return elements.length === 1 ? elements[0] : null
    },
    propsOf(owner) {
        return owner === levelEditor.data ? levelElements.level.props : levelElements.types[owner.type]?.props || []
    },
    findProp(key, owner) {
        return owner ? levelEditor.propsOf(owner).find(prop => prop.key === key) : null
    },
    hexColor(value) { //for a color picker, which only takes #rrggbb
        const context = levelEditor.colorContext || (levelEditor.colorContext = document.createElement("canvas").getContext("2d"))
        context.fillStyle = "#000"
        context.fillStyle = String(value)
        const style = context.fillStyle
        if (style.startsWith("#")) return style
        const rgb = style.match(/\d+/g) || [0, 0, 0]
        return "#" + rgb.slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("")
    },
    pickedColor(hex, old) { //the picker only does #rrggbb, so a see-through color like a shadow keeps its alpha
        const alpha = String(old).startsWith("rgba") ? Number((String(old).match(/[\d.]+/g) || [])[3]) : 1
        if (!(alpha < 1)) return hex
        const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
        return `rgba(${r},${g},${b},${alpha})`
    },
    previewColor(input, hex) { //shows a color while the picker is open, without an undo step, endPreview() puts the old one back before setProp() saves it
        const owners = input.dataset.owner === "many" ? levelEditor.selected() : [levelEditor.ownerOf(input)].filter(Boolean)
        const key = input.dataset.key
        if (!owners.length) return
        const preview = levelEditor.preview
        if (!preview || preview.key !== key || preview.owners.length !== owners.length || preview.owners.some((owner, i) => owner !== owners[i])) levelEditor.preview = { owners, key, values: owners.map(owner => owner[key]) }
        input.value = levelEditor.pickedColor(hex, levelEditor.preview.values[0])
        for (const owner of owners) owner[key] = input.value
        levelEditor.applyPreview(owners)
    },
    endPreview() {
        const preview = levelEditor.preview
        if (!preview) return
        levelEditor.preview = null
        preview.owners.forEach((owner, i) => { owner[preview.key] = preview.values[i] })
        levelEditor.applyPreview(preview.owners.filter(owner => owner === levelEditor.data || levelData.find(levelEditor.data, owner.id)))
    },
    applyPreview(owners) {
        if (levelEditor.isFullTest) return //the color shows once editing goes back to elements
        if (owners[0] === levelEditor.data) return levelData.applySettings(levelEditor.data)
        const ids = owners.map(owner => owner.id).filter(id => !levelEditor.isCodeChange([id])) //code only runs with the whole level, its preview would start the level over each time
        if (ids.length) levelData.rebuild(ids)
    },
    propValue(owner, prop) {
        return prop.read ? prop.read(owner) : owner[prop.key]
    },
    codeValue(value) { //a value written like code, for history labels
        return typeof value === "string" ? `"${value}"` : levelEditor.formatValue(value)
    },
    formatValue(value) {
        return typeof value === "number" ? String(Number(value.toFixed(6))) : String(value ?? "")
    },
    propKey(owner, prop) { //its name, the mouse over it shows what it does
        const tip = levelElements.tipOf(owner === levelEditor.data ? "level" : owner.type, prop)
        const scrub = prop.kind === "number" ? " le-scrub" : "" //drag it left or right to change the number
        return `<span class="color-var${scrub}"${tip ? ` title="${levelEditor.escape(tip)}"` : ""}>${prop.label || prop.key}</span><span class="color-symbol">:</span>`
    },
    propsCode(owners, props, isWrapped = true) { //their props as fields, wrapped in { } unless the caller adds more inside, like an element's vertices
        const fields = props.map(prop => levelEditor.fieldFor(owners, prop)).join("")
        return isWrapped ? `<div class="le-code"><span class="color-symbol">{</span>${fields}<span class="color-symbol">}</span></div>` : fields
    },
    fieldFor(owners, prop) { //a prop written like code, for one owner or several, data-owner says which: "level", "many", or the selected element
        const isMany = owners.length > 1
        const owner = owners[0]
        const value = isMany ? levelEditor.manyValue(owners, prop) : levelEditor.propValue(owner, prop)
        const isMixed = isMany && value === undefined
        const key = levelEditor.propKey(owner, prop)
        const data = `aria-label="${levelEditor.escape(prop.label || prop.key)}" data-key="${prop.key}"${isMany ? ` data-owner="many"` : owner === levelEditor.data ? ` data-owner="level"` : ""}`
        let input
        if (prop.kind === "bool") {
            input = `<input type="checkbox" ${data}${value ? " checked" : ""}${isMixed ? ` data-mixed title="mixed, some are on and some are off, click to turn it on for all"` : ""}>` //renderRight() makes a mixed one indeterminate
        } else if (prop.kind === "select") {
            input = `<select ${data}>${isMixed ? `<option value="" selected></option>` : ""}${prop.options.map(option => `<option${option === value ? " selected" : ""}>${option}</option>`).join("")}</select>`
        } else if (prop.kind === "mask") {
            return levelEditor.maskField(owners, prop)
        } else if (prop.kind === "veto") { //only for one, sharedProps() leaves vetoes out
            return levelEditor.vetoField(owner, prop)
        } else if (prop.kind === "ref") { //another element by id, from a list or picked by clicking it, only for one, sharedProps() leaves refs out
            const options = levelEditor.data.elements.filter(other => levelElements.isRefTo(owner, prop.key, other))
            input = `<select ${data}><option value="">null</option>${options.map(other => `<option value="${other.id}"${other.id === value ? " selected" : ""} title="${levelEditor.escape(levelElements.summary(other))}">${other.type} #${other.id}</option>`).join("")}</select>${levelEditor.button("pick", "pick", prop.key, levelEditor.picking && levelEditor.picking.key === prop.key)}${prop.types.includes("path") ? levelEditor.button("drawRef", "draw", prop.key, levelEditor.pathDraw?.forKey === prop.key) : ""}`
        } else {
            const isText = prop.kind === "text" || prop.kind === "color"
            const text = isMixed ? "" : levelEditor.formatValue(value)
            input = `${isText ? `<span class="le-quote">"</span>` : ""}<input class="le-value${isText ? " le-text" : ""}" ${data} value="${levelEditor.escape(text)}"${isMixed ? ` placeholder="mixed"` : ""} style="width: ${levelEditor.fieldWidth(text || (isMixed ? "mixed" : ""))}" spellcheck="false" autocomplete="off">${isText ? `<span class="le-quote">"</span>` : ""}`
            if (prop.kind === "color") input = `<input type="color" class="le-swatch" aria-label="${levelEditor.escape(prop.label || prop.key)} color picker" data-swatch value="${levelEditor.hexColor(isMixed ? "#000" : value)}" title="pick a color">${input}`
        }
        return `<div class="le-prop">${key} ${input}<span class="color-symbol">,</span></div>`
    },
    maskField(elements, prop) { //collides: [player map body], each name toggles, only the names that can collide back with all of them, or prop.names, like a zone's affects
        const choices = prop.names || levelElements.collision.names.filter(name => elements.every(el => levelElements.collision.isBack(el.type, name)))
        const arg = name => prop.key === "collides" ? name : `${prop.key}:${name}`
        const chips = choices.map(name => {
            const count = elements.filter(el => levelElements.collision.has(el[prop.key], name)).length
            const state = count === elements.length ? " le-on" : count ? " le-mixed" : ""
            return `<button class="le-chip${state}" data-command="collide" data-arg="${arg(name)}" title="${prop.names ? name : `cat.${name}`}${count && count < elements.length ? ", mixed, click to turn it on for all" : ""}">${name}</button>`
        }).join("")
        return `<div class="le-prop le-mask"><span class="color-var" title="${levelEditor.escape(levelElements.tipOf(elements[0].type, prop))}">${prop.label || prop.key}</span><span class="color-symbol">: [</span>${chips}<span class="color-symbol">],</span></div>`
    },
    vetoField(owner, prop) { //veto: [hydraBoss], crossed out like collides' names, click one to bring it back, the list under it crosses out or brings back what's picked, a tier's last one can't be vetoed
        const veto = owner[prop.key]
        const icons = levelEditor.mobIcons || {}
        const chips = veto.map(name => `<button class="le-chip" data-command="veto" data-arg="${prop.key}:${levelEditor.escape(name)}" title="vetoed, click to bring it back">${Object.hasOwn(icons, name) ? icons[name] : ""}${levelEditor.escape(name)}</button>`).join("")
        const options = prop.tiers().map(([label, names]) => `<optgroup label="${label}">${names.map(name => {
            const blocked = levelElements.vetoBlocks(prop, veto, name)
            return `<option value="${name}"${veto.includes(name) ? ` class="le-vetoed" title="vetoed, pick it to bring it back"` : ""}${blocked ? ` disabled title="${levelEditor.escape(blocked)}"` : ""}>${icons[name] || ""}<span>${name}</span></option>`
        }).join("")}</optgroup>`).join("")
        return `<div class="le-prop le-mask">${levelEditor.propKey(owner, prop)}<span class="color-symbol"> [</span>${chips}<span class="color-symbol">],</span></div>
            <div class="le-prop"><select aria-label="${levelEditor.escape(prop.label || prop.key)}" class="le-list le-rich-list le-veto-list" data-veto="${prop.key}" title="${levelEditor.escape(levelElements.tipOf(owner === levelEditor.data ? "level" : owner.type, prop))}"><option value="">${prop.noun} pool</option>${options}</select></div>`
    },
    fieldWidth(text) { //as wide as its text, it's monospace
        return `${Math.min(26, Math.max(2, String(text).length + 0.5))}ch`
    },
    inspectCode(el) { //the code, click it or edit to change it in the code panel
        const runtime = levelData.runtimes.get(el.id)
        return `${levelEditor.hotkeys(false, true)}<div class="le-row"><span class="le-name">code</span><span class="le-id">#${el.id}</span></div>
            <pre class="le-code-view" data-command="editCode" title="edit the code">${levelEditor.escape(el.code) || " "}</pre>
            ${runtime && runtime.error ? `<div class="le-error">//${levelEditor.escape(runtime.error.message)}</div>` : ""}
            <div class="le-actions le-flush-x le-flush-bottom"><div class="le-grid le-even">${levelEditor.button("editCode", "code")}</div></div>`
    },
    inspectElement(el) {
        const type = levelElements.types[el.type]
        if (type && type.isCode) return levelEditor.inspectCode(el)
        const runtime = levelData.runtimes.get(el.id)
        const isShape = levelElements.groups.shape.includes(el.type)
        const isVertexEditable = levelElements.isVertexEditable(el)
        const shapes = isShape ? levelEditor.switchRow("shape", levelElements.groups.shape, el.type) :
            type?.rounds ? levelEditor.switchRow("round", type.rounds, el.type, name => levelEditor.roundTips[name], name => name === "fill" ? "rect" : name) :
                el.type === "laser" ? levelEditor.switchRow("laserStyle", Object.keys(levelElements.laserStyles), el.style, name => name === "arc" ? "electricity, it hits a little wider than a beam" : "a dashed beam") :
                    type?.modes ? levelEditor.switchRow("triggerMode", type.modes, el.type, name => levelElements.types[name].tip, name => name, "le-tight") :
                        type?.isGate ? levelEditor.switchRow("gate", Object.keys(levelElements.gates), levelElements.gateName(el), name => levelElements.gates[name].tip) : ""
        const props = type ? type.props : []
        const isVertexMode = levelEditor.vertexElement() === el
        const shown = props.filter(prop => !prop.isShown || prop.isShown(el))
        const settings = levelEditor.propsCode([el], shown, false)
        const isTypeSwitch = isShape || type?.rounds || type?.modes //a different type writes all different code, so edited code stays what it is
        return `${levelEditor.hotkeys(levelEditor.isCopyable(el), !(type && type.isSingleton))}
            <div class="le-row"><span class="le-name">${levelElements.nameOf(el.type)}</span><span class="le-id">#${el.id}</span><span class="le-fill"></span>${el.edited && isTypeSwitch ? "" : shapes}</div>
            <div class="le-code"><span class="color-symbol">{</span>
                ${el.edited ? `<div class="le-prop le-comment le-wrap">//its code is edited, these change it too</div>` : ""}${settings}
                ${(type?.levelProps || []).map(key => levelEditor.fieldFor([levelEditor.data], levelEditor.findProp(key, levelEditor.data))).join("")}
                ${isVertexMode ? levelEditor.inspectVertices(el) : el.vertices ? `<div class="le-prop"><span class="color-var">vertices</span><span class="color-symbol">:</span> <span class="le-comment">[${el.vertices.length}]</span><span class="color-symbol">,</span></div>` : ""}
            <span class="color-symbol">}</span></div>
            ${Array.isArray(el.spots) ? levelEditor.inspectSpots(el) : ""}
            ${levelElements.isLinkSource(el) ? levelEditor.inspectLinks(el) : ""}
            ${isVertexMode && levelEditor.vertex.error ? `<div class="le-error">//${levelEditor.escape(levelEditor.vertex.error)}</div>` : ""}
            ${runtime && runtime.error ? `<div class="le-error">//${levelEditor.escape(runtime.error.message)}</div>` : ""}
            ${levelEditor.actionRows(levelElements.isRotatable(el), [{ //vertices half and the flips a quarter each, then constraint across the row
                quarters: (isVertexEditable ? levelEditor.button("vertices", "vertices", "", isVertexMode, undefined, { className: "le-half" }) : "") +
                    levelEditor.arrangeButtons([el], isVertexEditable, !isVertexEditable) +
                    (el.type === "block" ? levelEditor.button("constrain", "constraint", "", false, undefined, { className: "le-half" }) + levelEditor.button("blockForce", "force", "", !!el.hasForce, undefined, { className: "le-half" }) : ""),
            }, el.group ? levelEditor.button("group", "ungroup", "", true, "it's in a group, picked on its own from the explorer, ungroup takes the whole group apart") : ""])}
            ${levelEditor.codeArea(el)}`
    },
    switchRow(command, names, current, tip, text = name => name, className = "") { //joined buttons at the top right of the info box that switch what it is, like map | block, without tip a command's own tooltip
        return `<span class="le-segment${className ? ` ${className}` : ""}">${names.map(name => levelEditor.button(command, text(name), name, name === current, tip ? tip(name) : undefined)).join("")}</span>`
    },
    inspectLinks(el) { //what this button or toggle turns on and off, written like a list
        const linked = levelEditor.data.elements.filter(other => levelElements.isLinkedTo(other, el))
        const free = levelEditor.data.elements.filter(other => !linked.includes(other) && other.type !== "map" && !levelElements.isLinkFull(other) && levelElements.isRefTo(other, "link", el)) //maps link with the link button or from their own inspector, a level has too many to list
        return `<div class="le-row le-spots"><span class="color-var">links</span><span class="color-symbol">:</span>
                <span class="le-fill"></span>${levelEditor.button("pickLink", "link", "", levelEditor.picking && levelEditor.picking.isLink)}</div>
            ${linked.map(other => `<div class="le-prop">${levelEditor.escape(levelElements.summary(other))} <span class="le-id">#${other.id}</span> ${levelEditor.button("unlink", "×", other.id)}</div>`).join("")}
            ${free.length ? `<div class="le-prop"><select class="le-link-list" data-link-to="${el.id}"><option value="">link…</option>${free.map(other => `<option value="${other.id}">${levelEditor.escape(levelElements.summary(other))} #${other.id}</option>`).join("")}</select></div>` : ""}`
    },
    inspectSpots(el) { //other places a boss could spawn
        return `<div class="le-row le-spots"><span class="color-var">spots</span><span class="le-fill"></span>${levelEditor.button("addSpot", "+ spot")}</div>
            ${el.spots.map(([x, y], i) => `<div class="le-prop"><span class="le-comment">${i + 2}:</span> [${levelEditor.escape(levelEditor.formatValue(x))}, ${levelEditor.escape(levelEditor.formatValue(y))}] ${levelEditor.button("removeSpot", "×", i)}</div>`).join("")}`
    },
    inspectVertices(el) { //sides buttons for maps and blocks, and the vertices written like spawn.mapVertex to edit as text
        const count = levelElements.points(el).length
        const sides = levelElements.groups.shape.includes(el.type) ?
            `<span class="le-segment">${levelEditor.button("sides", "−", "-1")}<span class="le-count">${count}</span>${levelEditor.button("sides", "+", "1")}</span>` :
            `<span class="le-comment">[${count}]</span>`
        const curveHint = levelElements.types[el.type]?.hasCurves ? `<div class="le-prop le-comment le-wrap">//double click a vertex to curve it or make it a corner, drag its handle's squares to bend it</div>` : ""
        return `<div class="le-prop"><span class="color-var">vertices</span><span class="color-symbol">:</span> ${sides}</div>${curveHint}
            <div class="le-prop"><textarea class="le-path" data-vertices rows="3" spellcheck="false" title="x y pairs around the center, like spawn.mapVertex">${levelEditor.vertex.error ? levelEditor.escape(levelEditor.vertex.text) : levelElements.pathText(el)}</textarea></div>`
    },
    sharedProps(elements) { //props every selected element has, to change them all at once
        const first = levelElements.types[elements[0].type]?.props || []
        return first.filter(prop => prop.kind !== "ref" && prop.kind !== "veto" && elements.every(el => levelEditor.findProp(prop.key, el)?.kind === prop.kind && (!prop.isShown || prop.isShown(el))))
    },
    manyValue(elements, prop) { //their value if they all match, or undefined
        const values = elements.map(el => levelEditor.propValue(el, levelEditor.findProp(prop.key, el)))
        return values.every(value => value === values[0]) ? values[0] : undefined
    },
    actionRows(isRotatable, lines, isLast = false) { //the inspector's bottom buttons, touching, each line split evenly, or { quarters } for a 4 column grid where wide buttons take half, the turns on their own line on top, isLast reaches the inspector's bottom edge
        const rows = lines.filter(line => line && (line.quarters ?? line)).map(line => line.quarters ? `<div class="le-grid le-quarters">${line.quarters}</div>` : `<div class="le-grid le-even">${line}</div>`).join("")
        return isRotatable || rows ? `<div class="le-actions le-flush-x${isLast ? " le-flush-bottom" : ""}">${isRotatable ? levelEditor.rotateRow() : ""}${rows}</div>` : ""
    },
    isDrawing(elements) { //all drawing elements (isDrawing types), only they show to top and to bottom
        return elements.every(el => levelElements.types[el.type]?.isDrawing)
    },
    elementCodeText(el) { //what the info box's code box starts with: its edited code, or what its settings make, without the link's if
        const { names, context } = levelData.codeNames(levelEditor.data)
        return levelData.sectionsText(levelData.typeCode(el, names.get(el.id), context))
    },
    sharedProblem(candidate) { //why this change would stop the level's one function from being read, like declaring a variable another element declares, a problem it already has doesn't block fixing it
        return levelData.codeProblem(levelEditor.data) ? "" : levelData.codeProblem(candidate)
    },
    applyElementCode(id, text) { //from the code panel, code that can't be read returns why and changes nothing, code the same as its settings make isn't edited
        const el = levelData.find(levelEditor.data, id)
        if (!el) return ""
        const { names, context } = levelData.codeNames(levelEditor.data)
        const name = names.get(el.id)
        const refs = Object.fromEntries(levelData.editedRefs(levelEditor.data, el).map(other => [other, names.get(other)]).filter(([, refName]) => refName)) //id: the name it has now, export renames them if they change
        try {
            levelData.editedFunction(text, Object.values(refs), levelElements.isLinkSource(el) ? name : "") //only reads it, nothing runs
        } catch (error) {
            return error.message
        }
        const candidate = { ...levelEditor.data, elements: levelEditor.data.elements.map(other => other === el ? { ...el, edited: { name, text, names: refs } } : other) }
        const problem = levelEditor.sharedProblem(candidate)
        if (problem) return problem
        const made = levelData.sectionsText(levelElements.types[el.type].code(el, name, context))
        levelEditor.edit(`edit code ${levelEditor.describe([el])}`, () => {
            if (text.trim() === made.trim()) delete el.edited
            else el.edited = { name, text, names: refs }
            return [el.id]
        })
        levelEditor.renderRight()
        return ""
    },
    showCodeError(message) { //the code panel's red line under its name, until it closes or applies
        const panel = document.getElementById("level-editor-code")
        let line = panel.querySelector(".le-panel-error")
        if (!line) {
            line = document.createElement("div")
            line.className = "le-error le-panel-error"
            panel.querySelector(".le-panel-box").before(line)
        }
        line.textContent = `//can't run this: ${message}`
    },
    codeArea(el) { //the info box's bottom: code and revert code, then the code it runs
        const buttons = levelElements.isCodeEditable(el) ? `<div class="le-grid le-even le-flush-x le-code-buttons">${levelEditor.button("editElementCode", "code")}${levelEditor.button("revertElementCode", "revert code", "", false, el.edited ? undefined : "nothing to revert, its code is what its settings make", { disabled: !el.edited })}</div>` : ""
        return `${buttons}<pre class="le-js-view">${levelEditor.highlight(levelData.elementCode(levelEditor.data, el))}</pre>`
    },
    colorPanel() { //the code panel's colors, like the info box's code box, once a frame at most, pasted levels can be long
        if (levelEditor.isPanelColoring) return
        levelEditor.isPanelColoring = true
        requestAnimationFrame(() => {
            levelEditor.isPanelColoring = false
            for (const box of document.querySelectorAll("#level-editor-code textarea")) {
                if (!box.offsetParent) continue //hidden
                const colors = box.previousElementSibling
                colors.innerHTML = levelEditor.highlight(box.value) + "\n" + levelEditor.codeFocusBands(box)
                colors.scrollTop = box.scrollTop
                colors.scrollLeft = box.scrollLeft
            }
        })
    },
    codeFocusBands(box) { //the lines the panel opened for, behind the text
        const ranges = levelEditor.whole?.ranges
        if (!ranges) return ""
        const height = parseFloat(getComputedStyle(box).lineHeight)
        const top = parseFloat(getComputedStyle(box).paddingTop)
        return ranges.map(range => `<span class="le-code-focus" style="top:${top + range.start * height}px;height:${(range.end - range.start) * height}px"></span>`).join("")
    },
    highlight(text) { //javascript in the editor's code colors, --le-code in style.css: comments, strings, numbers, keywords, and function calls, the rest stays plain, html to put in a pre
        const pattern = /(\/\/.*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?(?:e-?\d+)?\b|\b(?:true|false|null|undefined)\b)|(\b(?:const|let|var|if|else|for|while|do|return|function|new|this|of|in|break|continue|typeof|switch|case)\b)|([A-Za-z_$][\w$]*(?=\s*\())/g
        const kinds = ["le-hl-comment", "le-hl-string", "le-hl-number", "le-hl-keyword", "le-hl-call"]
        let html = ""
        let last = 0
        for (const match of text.matchAll(pattern)) {
            html += levelEditor.escape(text.slice(last, match.index))
            html += `<span class="${kinds[match.slice(1).findIndex(Boolean)]}">${levelEditor.escape(match[0])}</span>`
            last = match.index + match[0].length
        }
        return html + levelEditor.escape(text.slice(last))
    },
    hotkeys(isCopyable, isDeletable) { //cut, copy, and paste's keys on the left, delete's on the right, drawn like the other key caps, clicking one does it too
        const cap = (command, text, arg = "") => `<button class="pause-hint le-key-cap le-hotkey" data-command="${command}" data-arg="${arg}" title="${command}"><strong class="key-input-train">${text}</strong></button>`
        const keys = (isCopyable ? [cap("cut", levelEditor.keyText("mod+x")), cap("copy", levelEditor.keyText("mod+c")), cap("paste", levelEditor.keyText("mod+v"), "view")] : []).join("")
        return isCopyable || isDeletable ? `<div class="le-hotkeys"><span class="le-hotkey-group">${keys}</span>${isDeletable ? cap("delete", "DEL") : ""}</div>` : ""
    },
    arrangeButtons(elements, isOrderWide = false, isFlipWide = false) { //flip, and draw order for drawing elements, where what's on top shows, code has neither, a quarter each in a quarters grid, isOrderWide makes to top and to bottom a half each, isFlipWide the flips when nothing shares their row
        if (elements.every(el => levelElements.isCode(el))) return ""
        const isDrawing = levelEditor.isDrawing(elements)
        const isFlippable = elements.length > 1 || levelElements.canFlip(elements[0]) //many flip around their middle, one only if it has something to mirror
        const flipClass = isFlippable && isFlipWide && !isDrawing ? "le-half" : "" //a half each when nothing shares their row
        const orderClass = isOrderWide || !isFlippable ? "le-half" : ""
        const flips = isFlippable ? levelEditor.button("flip", "flip ↔", "x", false, "mirror left and right", { className: flipClass }) + levelEditor.button("flip", "flip ↕", "y", false, "mirror up and down", { className: flipClass }) : ""
        const order = isDrawing ? levelEditor.button("arrange", "to top", "top", false, "above the other drawings in its layer, it moves to the end of the list, layer says under or over the player", { className: orderClass }) + levelEditor.button("arrange", "to bottom", "bottom", false, "below the other drawings in its layer, it moves to the start of the list, layer says under or over the player", { className: orderClass }) : ""
        return flips + order
    },
    alignButtons() { //each lines the selection up with its outermost edge or its middle, see alignIcon()
        return ["left", "center", "right", "top", "middle", "bottom"].map(edge => levelEditor.button("align", levelEditor.alignIcon(edge), edge, false, `align ${edge}${edge === "center" || edge === "middle" ? "s" : " edges"}`)).join("")
    },
    rotateRow() { //type any angle and press enter, or a turn button, shift turns the other way, or drag the round handle above it
        const turn = degrees => levelEditor.button("rotate", `↻ ${degrees}°`, degrees, false, `rotate ${degrees}° clockwise, shift for counterclockwise`)
        return `<div class="le-grid le-even"><input class="le-angle" data-rotate placeholder="angle" title="degrees to rotate clockwise, negative turns counterclockwise, enter rotates" spellcheck="false">${[90, 45, 10].map(turn).join("")}</div>`
    },
    inspectMany(elements) {
        const isShapes = elements.every(el => levelElements.groups.shape.includes(el.type))
        const props = levelEditor.sharedProps(elements)
        return `${levelEditor.hotkeys(elements.some(levelEditor.isCopyable), elements.some(el => !levelEditor.isSingleton(el)))}<div class="le-row"><span class="le-name">${elements.length} selected</span></div>
            ${props.length ? levelEditor.propsCode(elements, props) : ""}
            ${levelEditor.actionRows(elements.some(levelElements.isRotatable), [
                isShapes ? levelElements.groups.shape.map(name => levelEditor.button("shape", name, name)).join("") : "",
                levelEditor.alignButtons(),
                { //the flips and group share a row, drawing elements' to top and to bottom fill the flips' row, so group gets the next
                    quarters: levelEditor.arrangeButtons(elements) + levelEditor.button("group", elements.some(el => el.group) ? "ungroup" : "group", "", elements.some(el => el.group), undefined, { className: levelEditor.isDrawing(elements) ? "le-wide" : "le-half" }),
                },
            ], true)}`
    },
    inspectAnalysis() { //the analysis in the inspector, each line about elements goes to them when clicked
        const report = levelEditor.analysisReport || levelEditor.runAnalysis()
        const escape = levelEditor.escape
        const selected = new Set(levelEditor.selection)
        const lines = report.sections.map(section => `<div class="le-analysis-section">//${escape(section.title)}</div>` + section.lines.map(line => {
            const ids = line.ids || []
            const body = `<span class="le-analysis-status">${line.status}</span> <span class="le-analysis-label">${escape(line.label)}</span>${line.value ? ` <span class="le-analysis-value">${escape(line.value)}</span>` : ""}${line.text ? `<span class="le-analysis-text">${escape(line.text)}</span>` : ""}`
            const isCurrent = ids.some(id => selected.has(id))
            if (!ids.length && line.add && levelElements.types[line.add]) { //clicking adds what fixes it
                const label = levelElements.types[line.add].label
                return `<button class="le-analysis-line le-${line.status}" data-command="fixProblem" data-arg="${line.add}" title="add ${escape(label)} in the middle of the view">${body}<span class="le-analysis-add">+ ${escape(label)}</span></button>`
            }
            return ids.length ?
                `<button class="le-analysis-line le-${line.status}${isCurrent ? " le-current" : ""}" data-command="jumpProblem" data-arg="${ids.join(",")}" title="go to it${ids.length > 1 ? `, ${ids.length} of them, click again for the next` : ""}">${body}</button>` :
                `<div class="le-analysis-line le-${line.status}">${body}</div>`
        }).join("")).join("")
        return `<div class="le-row"><span class="le-name">issues</span><span class="le-fill"></span><span class="le-segment">${levelEditor.button("copyAnalysis", "copy")}${levelEditor.button("closeAnalysis", "×")}</span></div>
            <div class="le-analysis">${lines}</div>`
    },
    applyLevelCode(text) { //code that can't be read returns why and changes nothing, the level starts again to run it, nothing but comments is no code
        try {
            levelData.editedFunction(text) //only reads it, nothing runs
        } catch (error) {
            return error.message
        }
        const problem = levelEditor.sharedProblem({ ...levelEditor.data, levelCode: text })
        if (problem) return problem
        const isEmpty = !text.split("\n").some(line => line.trim() && !line.trim().startsWith("//"))
        if (levelEditor.edit(isEmpty ? "delete level code" : "edit level code", data => {
            data.levelCode = isEmpty ? "" : text
            return []
        })) levelEditor.restart() //the level's code runs when it starts
        levelEditor.renderRight()
        return ""
    },
    levelCodeArea() { //the level info box's code: the code button, with delete above its code once it has some, it edits it in the code panel
        const code = levelEditor.data.levelCode
        if (!code.trim()) return `<div class="le-grid le-one le-flush-x le-flush-bottom le-code-buttons">${levelEditor.button("levelCode", "code")}</div>`
        return `<div class="le-grid le-even le-flush-x le-code-buttons">${levelEditor.button("levelCode", "code")}${levelEditor.button("deleteLevelCode", "delete", "", false, "delete the level code")}</div>
            <pre class="le-js-view">${levelEditor.highlight(code)}</pre>`
    },
    levelCodeLinks() { //code pieces from imports and older levels, and elements with edited code, each selects it
        const pieces = levelEditor.data.elements.filter(el => levelElements.isCode(el))
        const edited = levelEditor.data.elements.filter(el => el.edited)
        const row = (el, text) => {
            const runtime = levelData.runtimes.get(el.id)
            return `<button class="le-code-link${runtime && runtime.error ? " le-code-link-error" : ""}" data-command="jumpTo" data-arg="${el.id}" title="${runtime && runtime.error ? levelEditor.escape(runtime.error.message) : "select it and go to it"}"><span>${levelEditor.escape(text)}</span><span class="le-id">#${el.id}</span></button>`
        }
        return (pieces.length ? `<div class="le-prop le-comment le-wrap">//imported code, it runs in its place in the level</div>${pieces.map(el => row(el, levelElements.codeTitle(el))).join("")}` : "") +
            (edited.length ? `<div class="le-prop le-comment le-wrap">//elements with edited code</div>${edited.map(el => row(el, levelElements.nameOf(el.type))).join("")}` : "")
    },
    inspectLevel() { //nothing selected, the level's properties, code pieces and elements with edited code to go to, then its code at the bottom
        return `<div class="le-row"><span class="le-name">level</span><span class="le-fill"></span>${levelEditor.button("levelDefaults", "default")}</div>
            ${levelEditor.propsCode([levelEditor.data], levelElements.level.props.filter(prop => !prop.isShown || prop.isShown(levelEditor.data)))}
            ${levelEditor.nameError ? `<div class="le-error">//name not changed: ${levelEditor.escape(levelEditor.nameError)}</div>` : ""}
            ${levelData.codeError ? `<div class="le-error">//${levelEditor.escape(levelData.codeError.message)}</div>` : ""}
            ${levelEditor.levelCodeLinks()}
            ${levelEditor.levelCodeArea()}`
    },
    revertField(input) {
        if (input.matches && input.matches("[data-vertices]") && levelEditor.vertexElement()) {
            levelEditor.vertex.error = ""
            input.value = levelElements.pathText(levelEditor.vertexElement())
            return
        }
        if (!input.dataset || !input.dataset.key) return
        if (input.dataset.owner === "many") { //back to their shared value, or blank
            const elements = levelEditor.selected()
            const prop = elements.length && levelEditor.findProp(input.dataset.key, elements[0])
            const value = prop && levelEditor.manyValue(elements, prop)
            if (prop && input.type !== "checkbox") input.value = value === undefined ? "" : levelEditor.formatValue(value)
            return
        }
        const owner = levelEditor.ownerOf(input)
        const prop = levelEditor.findProp(input.dataset.key, owner)
        if (prop && input.type !== "checkbox") input.value = levelEditor.formatValue(levelEditor.propValue(owner, prop))
    },
    readValue(input, prop) { //{ value } from a field, or null if it isn't one
        if (prop.kind === "bool") return { value: input.checked }
        if (prop.kind === "ref") return { value: input.value === "" ? null : Number(input.value) }
        if (prop.kind === "number") {
            const value = Number(input.value)
            if (input.value.trim() === "" || !Number.isFinite(value)) return null
            return { value: prop.min !== undefined ? Math.max(prop.min, value) : value }
        }
        if (prop.kind === "select" && input.value === "") return null //mixed
        return { value: input.value }
    },
    setManyProp(input) { //one field for every selected element
        const key = input.dataset.key
        const elements = levelEditor.selected()
        const prop = elements.length && levelEditor.findProp(key, elements[0])
        const read = prop && levelEditor.readValue(input, prop)
        if (!read) return levelEditor.revertField(input)
        levelEditor.edit(`${levelEditor.describe(elements)}.${key} = ${levelEditor.codeValue(read.value)}`, () => {
            for (const el of elements) {
                const own = levelEditor.findProp(key, el)
                if (own.write) {
                    own.write(el, read.value)
                } else {
                    el[key] = read.value
                }
            }
            return elements.map(el => el.id)
        })
        levelEditor.refreshRight()
    },
    setProp(input) { //from a field, for the selected element, or the level for level property fields
        if (input.dataset.owner === "many") return levelEditor.setManyProp(input)
        const key = input.dataset.key
        const owner = levelEditor.ownerOf(input)
        const prop = levelEditor.findProp(key, owner)
        if (!prop) return
        const read = levelEditor.readValue(input, prop)
        if (!read) return levelEditor.revertField(input) //not a number, put the old value back
        const value = read.value
        if (owner === levelEditor.data) return levelEditor.setLevelProp(key, value)
        const el = owner
        levelEditor.edit(`${levelEditor.describe([el])}.${key} = ${levelEditor.codeValue(value)}`, () => {
            if (prop.write) {
                prop.write(el, value)
            } else {
                el[key] = value
            }
            if (key === "link" || key === "orLink") levelElements.tidyLinks(el) //like unlink, orLink moves up when link is cleared
            return [el.id]
        })
        levelEditor.refreshRight()
    },
    setLevelProp(key, value) {
        const data = levelEditor.data
        if (key === "name") {
            levelEditor.nameError = ""
            if (value !== data.name) {
                levelEditor.flush()
                levelEditor.nameError = levelData.nameProblem(value)
                if (!levelEditor.nameError && !levelData.store.rename(data.name, value)) levelEditor.nameError = "couldn't save it under the new name, storage is full or blocked, the old name is kept"
                if (!levelEditor.nameError) {
                    data.name = value
                    level.levels = [value]
                    levelEditor.updateHistoryButtons() //the name at the top
                    levelEditor.renderLoadList() //the local levels list
                }
            }
            return levelEditor.renderRight()
        }
        levelEditor.edit(`level.${key} = ${levelEditor.codeValue(value)}`, () => {
            data[key] = value
            return []
        })
        levelEditor.applyLevelProps()
    },
    stepProp(input, direction) { //arrow keys in a number field
        const prop = levelEditor.findProp(input.dataset.key, input.dataset.owner === "many" ? levelEditor.selected()[0] : levelEditor.ownerOf(input))
        if (!prop || prop.kind !== "number") return
        const step = (prop.isGrid ? Math.max(1, levelEditor.grid) : prop.step || 1) * direction
        const value = Number(input.value)
        input.value = levelEditor.formatValue(Number(((Number.isFinite(value) ? value : 0) + step).toFixed(6)))
        levelEditor.setProp(input)
    },
    scrubStart(event) { //mouse down on a number field or its name, dragging left or right changes it, a click on the field still types
        const target = event.target
        const input = target.matches("input.le-value") ? target : target.matches(".le-scrub") ? target.parentElement.querySelector("input.le-value") : null
        if (!input || event.button !== 0) return
        const prop = levelEditor.findProp(input.dataset.key, input.dataset.owner === "many" ? levelEditor.selected()[0] : levelEditor.ownerOf(input))
        if (!prop || prop.kind !== "number") return
        if (target !== input) event.preventDefault() //the name doesn't select its text
        const value = Number(input.value)
        levelEditor.scrub = {
            input, prop, x: event.clientX, isScrubbing: false,
            key: input.dataset.key, owner: input.dataset.owner || "", panel: input.closest("#level-editor-left, #level-editor-right"),
            start: input.value.trim() !== "" && Number.isFinite(value) ? value : 0, //mixed starts at 0, like the arrow keys
            startStep: levelEditor.history.steps[levelEditor.history.index],
        }
    },
    scrubMove(event) {
        const scrub = levelEditor.scrub
        if (!scrub) return
        const moved = event.clientX - scrub.x
        if (!scrub.isScrubbing) {
            if (Math.abs(moved) < 4) return //a click, or a small wobble while clicking into the field
            scrub.isScrubbing = true
            if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur() //finishes typing, the field shows the dragged value
            document.body.classList.add("le-scrubbing")
        }
        if (!scrub.input.isConnected) { //the inspector redrew, the same field is a new input
            scrub.input = [...scrub.panel.querySelectorAll("input.le-value")].find(input => input.dataset.key === scrub.key && (input.dataset.owner || "") === scrub.owner)
            if (!scrub.input) return levelEditor.scrubEnd()
        }
        const step = scrub.prop.isGrid ? Math.max(1, levelEditor.grid) : scrub.prop.step || 1
        const steps = Math.round(moved / (scrub.prop.isGrid ? 8 : 3)) * (event.shiftKey ? 10 : 1) //grid steps are big, so they take more pixels, shift is 10×
        const text = levelEditor.formatValue(Number((scrub.start + steps * step).toFixed(6)))
        if (text === scrub.input.value) return
        scrub.input.value = text
        scrub.input.style.width = levelEditor.fieldWidth(text)
        levelEditor.setProp(scrub.input)
    },
    scrubEnd() { //one undo step for the whole drag, named for where it ended up
        const scrub = levelEditor.scrub
        levelEditor.scrub = null
        if (!scrub || !scrub.isScrubbing) return
        document.body.classList.remove("le-scrubbing")
        const history = levelEditor.history
        const from = history.steps.indexOf(scrub.startStep) //gone if the history limit dropped it, then the steps stay
        if (from < 0 || history.index <= from) return
        const isBack = history.steps[history.index].json === scrub.startStep.json //dragged back to where it started
        history.steps.splice(from + 1, history.index - from - (isBack ? 0 : 1))
        history.index = isBack ? from : from + 1
        levelEditor.updateHistoryButtons()
    },
})

//*********************************************************************
// events
//*********************************************************************
{
    levelData.store.onChange = levelEditor.updateSaveWarning //the status bar warns while the level can't be saved
    levelData.onError = () => { //an error while the level runs shows in the issues count, and in the info box if it's showing that element
        if (!levelEditor.isActive) return
        levelEditor.countProblems(0)
        levelEditor.refreshRight()
    }
    //during a run #dmg covers the canvas, so mouse events land on either one
    const isGameSurface = target => target.id === "canvas" || target.id === "dmg"
    document.body.addEventListener("mousedown", event => { //capture, before the body's listener, so a left click edits instead of firing
        if (isGameSurface(event.target)) levelEditor.mouseDown(event)
    }, true)
    window.addEventListener("wheel", event => {
        if (isGameSurface(event.target)) levelEditor.wheel(event)
    }, { passive: false })
    window.addEventListener("mousemove", event => {
        levelEditor.isMouseOnCanvas = isGameSurface(event.target)
        levelEditor.mouseMove(event)
    })
    document.documentElement.addEventListener("mouseleave", () => { levelEditor.isMouseOnCanvas = false })
    window.addEventListener("mouseup", levelEditor.mouseUp)
    window.addEventListener("mousemove", event => levelEditor.scrubMove(event))
    window.addEventListener("mouseup", () => levelEditor.scrubEnd())
    window.addEventListener("keydown", levelEditor.keyDown, true) //capture, so it runs before the game's keys, which were added first
    window.addEventListener("keyup", event => {
        levelEditor.isFree = event.altKey
        levelEditor.isFast = event.shiftKey
    })
    window.addEventListener("beforeunload", () => levelEditor.flush())

    for (const id of ["level-editor-left", "level-editor-right", "level-editor-code", "level-editor-status", "level-editor-history"]) {
        const panel = document.getElementById(id)
        //the panels aren't part of the game, so clicks don't fire and typing doesn't move the player
        panel.addEventListener("mousedown", event => event.stopPropagation())
        panel.addEventListener("keydown", event => {
            if (event.key === "Escape") levelEditor.revertField(event.target) //put the saved value back before blur commits it
            if (event.key === "Escape" && id === "level-editor-code") levelEditor.run("closeCode")
            if (id === "level-editor-code" && event.target.matches("textarea") && !event.target.readOnly) { //typing code
                if (event.key === "Tab") {
                    event.preventDefault()
                    event.target.setRangeText("    ", event.target.selectionStart, event.target.selectionEnd, "end")
                    levelEditor.colorPanel()
                }
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault()
                    levelEditor.run(levelEditor.codeEditing && !document.querySelector('#level-editor-code [data-command="applyCode"]').hidden ? "applyCode" : "importText")
                }
            }
            if (event.key === "Escape" || (event.key === "Enter" && event.target.readOnly !== false)) event.target.blur() //enter types a new line in the import box
            if (levelEditor.isTyping(event.target)) event.stopPropagation() //after clicking a menu or button, WASD still moves the player
        })
        panel.addEventListener("click", event => { //a menu or checkbox clicked with the mouse lets go of focus, so the field key (space) doesn't toggle it again
            const el = document.activeElement //a label's click focuses its checkbox
            if (event.detail !== 0 && panel.contains(el) && el.matches("summary, input[type=checkbox]")) el.blur()
        })
        panel.addEventListener("click", event => {
            const button = event.target.closest("button[data-command], pre[data-command]")
            if (!button) return
            if (button.closest("summary")) event.preventDefault() //the explorer's hide and lock don't fold their type
            if (levelEditor.isPaletteClick) return //it was dragged onto the level
            if (event.detail !== 0) button.blur() //like menus, so the field key (space) doesn't press it again
            if (button.matches(".le-add-item")) levelEditor.setRecentAdd(button.dataset.arg)
            const isBackward = event.shiftKey && button.dataset.command === "rotate" //shift turns counterclockwise
            levelEditor.run(button.dataset.command, isBackward ? -Number(button.dataset.arg) : button.dataset.arg)
        })
    }
    const left = document.getElementById("level-editor-left")
    left.addEventListener("toggle", event => {
        const section = event.target.dataset.section
        if (section === "load" && event.target.open) levelEditor.renderLoadList()
        if (section === "explorer" && event.target.open) levelEditor.renderExplorer()
        if (section) {
            const open = levelEditor.openSections()
            open[section] = event.target.open
            levelEditor.remember("levelEditorSections", open)
        }
    }, true) //toggle doesn't bubble
    document.getElementById("level-editor-left").addEventListener("mousedown", event => { //an add button can be dragged onto the level
        const button = event.button === 0 && event.target.closest('button[data-command="add"], button[data-command="preset"]')
        levelEditor.paletteDrag = button ? { command: button.dataset.command, arg: button.dataset.arg, x: event.clientX, y: event.clientY, isDragging: false, isListed: button.matches(".le-add-item") } : null
    })
    window.addEventListener("mousemove", event => {
        const palette = levelEditor.paletteDrag
        if (palette && !palette.isDragging && Math.hypot(event.clientX - palette.x, event.clientY - palette.y) > 6) palette.isDragging = true
    })
    window.addEventListener("mouseup", () => {
        const palette = levelEditor.paletteDrag
        levelEditor.paletteDrag = null
        if (!palette || !palette.isDragging) return
        levelEditor.isPaletteClick = true //the click after letting go isn't another add
        setTimeout(() => { levelEditor.isPaletteClick = false }, 0)
        if (levelEditor.isMouseOnCanvas) {
            if (palette.isListed) levelEditor.setRecentAdd(palette.arg)
            levelEditor.place(levelEditor.creation(palette.command, palette.arg, levelEditor.mouse()))
        }
    }, true)
    document.getElementById("level-editor-history").addEventListener("mouseover", event => { //a history step's tooltip is what it changed, worked out when it's first hovered
        const step = event.target.closest?.(".le-step")
        if (step && !step.dataset.diff) {
            step.dataset.diff = "1"
            step.title = `${step.title}\n\n${levelEditor.stepDiff(Number(step.dataset.arg))}`
        }
    })
    window.addEventListener("mousedown", event => { //clicking anywhere else closes the history list
        if (levelEditor.isHistoryOpen && !event.target.closest?.(".le-history-box")) levelEditor.run("history", false)
    }, true) //before the panels stop it
    const onSettingChange = event => { //the left panel and the status bar, which has grid and zoom
        if (event.target.dataset.key) levelEditor.setProp(event.target)
        if (event.target.dataset.setting === "grid") {
            const size = Number(event.target.value)
            if (Number.isFinite(size) && size >= 1) levelEditor.grid = Math.round(size)
            levelEditor.remember("levelEditorGrid", levelEditor.grid)
            event.target.value = levelEditor.grid
        }
        if (event.target.dataset.setting === "zoom") {
            const value = Number(event.target.value)
            if (Number.isFinite(value) && value > 0) levelEditor.zoomTo(value)
            event.target.value = Math.round(levelEditor.zoomScale)
        }
        if (event.target.dataset.setting === "testSeed") {
            levelEditor.testSeed = event.target.value.trim()
            levelEditor.restart()
        }
        if (event.target.dataset.setting === "testLevel") {
            const value = Number(event.target.value)
            if (Number.isFinite(value) && value >= 0) {
                levelEditor.testLevel = Math.min(30, Math.round(value))
                levelEditor.remember("levelEditorTestLevel", levelEditor.testLevel)
                levelEditor.restart()
            } else {
                event.target.value = levelEditor.testLevel
            }
        }
    }
    left.addEventListener("change", onSettingChange)
    document.getElementById("level-editor-status").addEventListener("change", onSettingChange)
    const right = document.getElementById("level-editor-right")
    document.getElementById("level-editor-code").addEventListener("input", event => { //its colors follow what's typed
        if (levelEditor.whole && event.target.matches("textarea")) levelEditor.trackCodeFocus(event.target.value)
        levelEditor.colorPanel()
    })
    document.getElementById("level-editor-code").addEventListener("scroll", event => { //the code panel's colors scroll with it, right away
        if (!event.target.matches?.("textarea")) return
        const colors = event.target.previousElementSibling
        colors.scrollTop = event.target.scrollTop
        colors.scrollLeft = event.target.scrollLeft
    }, true)
    right.addEventListener("change", event => {
        const input = event.target
        if (input.matches("[data-rotate]")) { //rotate by the angle typed
            const text = input.value.trim().replace(/°$/, "")
            const turn = Number(text)
            input.value = ""
            if (text !== "" && Number.isFinite(turn) && turn % 360) levelEditor.run("rotate", turn)
            return
        }
        if (input.dataset.linkTo && input.value) { //the button's link list
            const button = levelData.find(levelEditor.data, Number(input.dataset.linkTo))
            const el = levelData.find(levelEditor.data, Number(input.value))
            if (button && el) levelEditor.linkTo(el, button)
            return levelEditor.renderRight()
        }
        if (input.dataset.veto) { //a veto list, what's picked is crossed out or brought back
            if (input.value) levelEditor.run("veto", `${input.dataset.veto}:${input.value}`)
            return
        }
        if (input.dataset.key) levelEditor.setProp(input)
        if (input.matches("[data-vertices]")) {
            const el = levelEditor.vertexElement()
            if (!el) return
            const { points, error } = levelElements.parsePath(el, input.value)
            if (error) { //keep what was typed so it can be fixed
                levelEditor.vertex.error = error
                levelEditor.vertex.text = input.value
                return levelEditor.renderRight()
            }
            levelEditor.setVertices(points, summary => `edit vertices ${summary}`)
        }
    })
    document.getElementById("level-editor-import-file").addEventListener("change", event => { //open file, its text goes in the import box and imports
        const file = event.target.files[0]
        event.target.value = "" //the same file can be opened again
        if (!file) return
        const request = ++levelEditor.fileRequest
        file.text().then(text => {
            if (request !== levelEditor.fileRequest) return
            document.querySelector("#level-editor-code textarea").value = text
            levelEditor.colorPanel()
            levelEditor.run("importText")
        }).catch(error => {
            if (request === levelEditor.fileRequest) simulation.inGameConsole(`<em>//couldn't read the file: ${levelEditor.escape(error.message)}</em>`)
        })
    })
    for (const panel of [left, right]) { //fields are in both panels, the level properties are in the inspector with nothing selected
        panel.addEventListener("mousedown", levelEditor.scrubStart)
        panel.addEventListener("input", event => {
            if (event.target.matches("[data-explore-search]")) { //lists only what matches, as it's typed
                levelEditor.exploreSearch = event.target.value
                levelEditor.renderExplorer()
            }
            if (event.target.matches(".le-value")) event.target.style.width = levelEditor.fieldWidth(event.target.value)
            if (event.target.matches("[data-swatch]")) { //the color picker fills in the text next to it, and the level shows it right away
                const text = event.target.parentElement.querySelector("[data-key]")
                levelEditor.previewColor(text, event.target.value)
                text.style.width = levelEditor.fieldWidth(text.value)
            }
        })
        panel.addEventListener("change", event => {
            if (event.target.matches("[data-swatch]")) { //once the picker closes, so it's one undo step
                levelEditor.endPreview()
                levelEditor.setProp(event.target.parentElement.querySelector("[data-key]"))
            }
        })
        panel.addEventListener("focusout", event => {
            if (event.target.matches("[data-swatch]") && levelEditor.preview) { //closed without a change, put the color back
                levelEditor.endPreview()
                levelEditor.refreshFields(panel)
            }
        })
        panel.addEventListener("keydown", event => {
            if (event.target.matches("input.le-value") && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                event.preventDefault()
                levelEditor.stepProp(event.target, (event.key === "ArrowUp" ? 1 : -1) * (event.shiftKey ? 10 : 1))
            }
        })
    }
}
