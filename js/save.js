"use strict";
//save the run at the start of each level, so it can be continued or exported and imported later
//a save rebuilds the field, guns, and tech the normal way, then overwrites every saveable value that changed during the run
const saveGame = {
    version: 1,
    storageKey: "n-gon-autosave",
    latest: null, //the most recent level start save, kept in memory even when local storage is blocked
    baseline: null, //saveable values right after simulation.startGame resets the run, used to only save what changed
    pendingMessage: "", //shown when the loaded level starts
    isResuming: false, //true until the loaded level starts
    pendingHeldBlock: null, //plain geometry consumed by clearMap on load
    NO: Symbol("unsaveable"),
    //values in these objects are saved in full, because they depend on the run's seed
    //these depend on the run's seed, so they're saved even when they match a fresh run
    alwaysSaved: {
        level: ["levels", "onLevel", "levelsCleared", "constraintIndex"],
        spawn: ["mobTypeSpawnOrder", "mobTierSpawnOrder", "pickList"],
    },
    renamedTech: { "quantum non-demolition": "self-locating uncertainty" }, //old name: new name, so older saves keep tech that were renamed
    renameTech(save) {
        const rename = name => saveGame.renamedTech[name] ?? name
        const renameKeys = obj => {
            if (!obj || typeof obj !== "object") return obj
            const result = {}
            for (const name of Object.keys(obj)) result[rename(name)] = obj[name]
            return result
        }
        save.techCounts = renameKeys(save.techCounts)
        if (Array.isArray(save.techOrder)) save.techOrder = save.techOrder.map(rename)
        save.state.techEntries = renameKeys(save.state.techEntries)
    },
    simulationKeys: ["difficultyOptions", "difficultyMode", "difficulty", "accelScale", "CDScale", "healScale", "molecularMode", "isCheating", "isHorizontalFlipped", "cycle"],

    // ****************************************************************************************************
    // copying values
    // ****************************************************************************************************
    copy(value, depth = 0, seen = new Set()) { //JSON safe deep copy, or saveGame.NO if the value can't be saved
        const NO = saveGame.NO
        if (value === null || typeof value === "string" || typeof value === "boolean") return value
        if (typeof value === "number") return Number.isFinite(value) ? value : { $num: String(value) } //Infinity, -Infinity, NaN
        if (typeof value !== "object" || depth > 6 || seen.has(value)) return NO //functions, undefined, and cycles like Matter bodies
        seen.add(value)
        let result
        if (Array.isArray(value)) {
            if (value.length > 5000) return NO
            result = []
            for (const item of value) {
                const copy = saveGame.copy(item, depth + 1, seen)
                if (copy === NO) return NO
                result.push(copy)
            }
        } else {
            const proto = Object.getPrototypeOf(value)
            if (proto !== Object.prototype && proto !== null) return NO //DOM nodes, Maps, class instances
            result = {}
            for (const key of Object.keys(value)) {
                const copy = saveGame.copy(value[key], depth + 1, seen)
                if (copy === NO) return NO
                result[key] = copy
            }
        }
        seen.delete(value)
        return result
    },
    revive(value) { //undo saveGame.copy's number encoding
        if (Array.isArray(value)) return value.map(saveGame.revive)
        if (value && typeof value === "object") {
            if (Object.keys(value).length === 1 && typeof value.$num === "string") return Number(value.$num)
            const result = {}
            for (const key of Object.keys(value)) result[key] = saveGame.revive(value[key])
            return result
        }
        return value
    },
    props(obj, exclude = []) { //every saveable own property of an object
        const result = {}
        if (!obj) return result
        for (const key of Object.keys(obj)) {
            if (exclude.includes(key)) continue
            const copy = saveGame.copy(obj[key])
            if (copy !== saveGame.NO) result[key] = copy
        }
        return result
    },
    pick(obj, keys) { //explicit data from objects that also contain physics or executable state
        return saveGame.props(Object.fromEntries(keys.map(key => [key, obj[key]])))
    },
    nestedProps(obj, exclude = []) { //saveable properties, plus saveable properties one level down in objects that also hold functions
        const result = saveGame.props(obj, exclude)
        const sub = {}
        for (const key of Object.keys(obj)) {
            const value = obj[key]
            if (exclude.includes(key) || key in result || !value || typeof value !== "object" || Array.isArray(value)) continue
            if (Object.getPrototypeOf(value) !== Object.prototype) continue
            const inner = saveGame.props(value, ["name", "description"])
            if (Object.keys(inner).length) sub[key] = inner
        }
        if (Object.keys(sub).length) result.$sub = sub
        return result
    },
    byName(list, exclude = ["name", "link", "requires"]) { //descriptions are kept because some tech rewrite theirs during a run
        const result = {}
        for (const item of list) if (item && item.name !== undefined) result[item.name] = saveGame.props(item, exclude)
        return result
    },
    diff(current = {}, base = {}) { //only the values that changed from base
        const result = {}
        for (const key of Object.keys(current)) {
            const value = current[key]
            if (key === "$sub") {
                const sub = {}
                for (const name of Object.keys(value)) {
                    const d = saveGame.diff(value[name], base.$sub?.[name])
                    if (Object.keys(d).length) sub[name] = d
                }
                if (Object.keys(sub).length) result.$sub = sub
            } else if (JSON.stringify(value) !== JSON.stringify(base[key])) {
                result[key] = value
            }
        }
        return result
    },
    assign(obj, values = {}, exclude = []) { //write saved values back onto a game object
        if (!obj) return
        for (const key of Object.keys(values)) {
            if (exclude.includes(key)) continue
            if (key === "$sub") {
                for (const name of Object.keys(values.$sub)) saveGame.assign(obj[name], values.$sub[name])
            } else {
                obj[key] = saveGame.revive(values[key])
            }
        }
    },

    // ****************************************************************************************************
    // taking a save
    // ****************************************************************************************************
    runtimeState() { //saved in full: these objects are rebuilt, not reset from the plain-data baseline
        const held = m.holdingTarget
        return {
            playerScale: tech.isScaleInvariance ? player.scale : null,
            pendingActions: saveGame.copy(simulation.pendingActions || []),
            wire: tech.wire ? saveGame.props(tech.wire) : null,
            eigen: tech.isEigenstate && m.eigen ? saveGame.props(m.eigen, ["block", "keyListener"]) : null,
            polarDefense: !!m.skin?.isPolarDefense,
            plasmaBall: m.plasmaBall ? saveGame.pick(m.plasmaBall, ["circleRadius", "alpha", "isAttached", "isOn", "drain", "radiusLimit", "damage", "effectRadius"]) : null,
            //Match the block that clearMap normally carries between levels; don't serialize Matter references.
            heldBlock: held ? {
                ...saveGame.pick(held, ["friction", "frictionAir", "frictionStatic", "isKey", "isImmutable"]),
                vertices: held.vertices.map(vertex => ({ x: vertex.x, y: vertex.y })),
            } : null,
            effects: (simulation.ephemera || []).filter(effect => effect.saveType).map(effect => saveGame.props(effect)),
        }
    },
    restoreRuntime(runtime) {
        if (tech.isScaleInvariance && Number.isFinite(runtime?.playerScale) && runtime.playerScale > 0) m.skin.setPlayerScale(runtime.playerScale)
        if (tech.wire) {
            tech.wire.setPhysics()
            if (runtime?.wire) saveGame.assign(tech.wire, runtime.wire)
        }
        if (tech.isEigenstate && runtime?.eigen) saveGame.assign(m.eigen, runtime.eigen, ["block", "keyListener"])
        if (m.skin) {
            //Older saves still have the absolute defense multiplier, so synchronize its bookkeeping flag.
            m.skin.isPolarDefense = runtime?.polarDefense ?? !!(tech.isHyperpolarisation && tech.isDamageCooldown && m.lastKillCycle + tech.isDamageCooldownTime > m.cycle)
        }
        if (m.plasmaBall && runtime?.plasmaBall) {
            const radius = runtime.plasmaBall.circleRadius
            if (Number.isFinite(radius) && radius > 0) Matter.Body.scale(m.plasmaBall, radius / m.plasmaBall.circleRadius, radius / m.plasmaBall.circleRadius)
            saveGame.assign(m.plasmaBall, runtime.plasmaBall, ["circleRadius"])
        }
        saveGame.pendingHeldBlock = runtime?.heldBlock ? saveGame.revive(runtime.heldBlock) : null
        if (runtime?.effects) {
            const rebuilt = simulation.ephemera.filter(effect => effect.saveType)
            simulation.ephemera = simulation.ephemera.filter(effect => !effect.saveType)
            for (const data of runtime.effects) {
                //Only known factories can recreate workers; checkpoints never contain executable code.
                switch (data.saveType) {
                    case "induction brake": powerUps.heal.spawnBrake(saveGame.revive(data)); break
                    case "merged power ups": powerUps.Casimir.queueMerged(saveGame.revive(data)); break
                    case "super balls": b.queueSuperBalls(saveGame.revive(data)); break
                    case "harpoons": b.queueHarpoons(saveGame.revive(data)); break
                    case "filament":
                    case "majorana":
                    case "block jump": {
                        const index = rebuilt.findIndex(effect => effect.saveType === data.saveType)
                        if (index !== -1) {
                            const effect = rebuilt.splice(index, 1)[0]
                            saveGame.assign(effect, data, ["do", "saveType", "name"])
                            simulation.ephemera.push(effect)
                        }
                        break
                    }
                }
            }
        }
        powerUps.resumeDelayedSpawns?.()
        simulation.pendingActions = saveGame.revive(runtime?.pendingActions || [])
        simulation.resumePendingActions?.()
    },
    state() { //every saveable value, grouped by game object
        return {
            tech: saveGame.props(tech, ["tech"]),
            techEntries: saveGame.byName(tech.tech, ["name", "link", "requires", "keyListener"]),
            m: saveGame.props(m, ["fieldUpgrades", "history", "fieldEvent"]), //history is reset at the start of each level, fieldEvent is the field's key listener
            fields: saveGame.byName(m.fieldUpgrades),
            guns: saveGame.byName(b.guns),
            b: saveGame.props(b, ["guns"]),
            powerUps: saveGame.nestedProps(powerUps, ["orb", "difficulty"]), //difficulty values are recalculated from the options
            mobs: saveGame.props(mobs),
            level: saveGame.props(level),
            spawn: saveGame.props(spawn),
            lore: saveGame.props(lore),
            runtime: saveGame.runtimeState(),
        }
    },
    captureBaseline() { //called at the end of simulation.startGame
        saveGame.baseline = saveGame.state()
        saveGame.latest = null //a new run has no save until its first level starts
    },
    create() {
        const state = saveGame.state()
        const base = saveGame.baseline || {}
        const changed = {}
        for (const group of Object.keys(state)) {
            if (group === "runtime") {
                changed[group] = state[group] //these workers and bodies are reconstructed, not restored from baseline values
            } else if (group === "techEntries" || group === "fields" || group === "guns") {
                const byName = {}
                for (const name of Object.keys(state[group])) {
                    const d = saveGame.diff(state[group][name], base[group]?.[name])
                    if (Object.keys(d).length) byName[name] = d
                }
                changed[group] = byName
            } else {
                changed[group] = saveGame.diff(state[group], base[group])
                for (const key of saveGame.alwaysSaved[group] || []) if (key in state[group]) changed[group][key] = state[group][key]
            }
        }
        //The mode can already be active in the baseline after a previous run.
        changed.fields["time dilation"] = { ...changed.fields["time dilation"], isRewindMode: m.fieldUpgrades[6].isRewindMode }
        const techCounts = {}
        for (const t of tech.tech) if (t.count > 0) techCounts[t.name] = t.count
        const simulationValues = {}
        for (const key of saveGame.simulationKeys) {
            const copy = saveGame.copy(simulation[key])
            if (copy !== saveGame.NO) simulationValues[key] = copy
        }
        return {
            v: saveGame.version,
            time: Date.now(),
            seed: Math.initialSeed,
            mathSeed: Math.seed,
            field: m.fieldUpgrades[m.fieldMode]?.name,
            guns: b.inventory.map(index => b.guns[index].name),
            techCounts,
            techOrder: tech.tech.map(t => t.name), //newest tech first, planned obsolescence ejects the oldest
            constraints: level.constraint.map(c => c.name ?? c.description),
            simulation: simulationValues,
            state: changed,
        }
    },
    autosave() { //called at the top of level.start, after the previous level is cleared
        if (saveGame.pendingMessage) {
            simulation.inGameConsole(saveGame.pendingMessage)
            saveGame.pendingMessage = ""
        }
        if (level.levelsCleared < 1 || simulation.isTraining || build.isExperimentRun || !m.alive) return
        if (level.levels[level.onLevel] === "null") return //the run was already won on final, and the save was cleared
        try {
            saveGame.latest = saveGame.create()
            if (localSettings.isAllowed) localStorage.setItem(saveGame.storageKey, JSON.stringify(saveGame.latest))
            if (!saveGame.isResuming) simulation.inGameConsole(`<em>//checkpoint saved</em>`) //a loaded level already says checkpoint loaded
        } catch (error) {
            console.error("autosave failed", error)
        }
    },
    clearAutosave() { //called when a run ends
        saveGame.latest = null
        try {
            localStorage.removeItem(saveGame.storageKey)
        } catch (error) { }
    },
    storedSave() {
        try {
            const text = localStorage.getItem(saveGame.storageKey)
            return text ? JSON.parse(text) : null
        } catch (error) {
            return null
        }
    },

    // ****************************************************************************************************
    // loading a save
    // ****************************************************************************************************
    isValid(save) {
        return save && typeof save === "object" && save.v === 1 && save.state && save.state.level && typeof save.state.level.levelsCleared === "number" && Array.isArray(save.state.level.levels)
    },
    async load(save) {
        if (!saveGame.isValid(save)) {
            alert("That isn't a valid n-gon checkpoint.")
            return
        }
        if (!simulation.onTitlePage) return
        saveGame.renameTech(save)
        const missing = []
        //community levels in the saved level order need level2.js, which startGame loads when community maps are on
        const communitySetting = simulation.isCommunityMaps
        if (save.state.level.levels.some(name => !(name in level.maps))) simulation.isCommunityMaps = true
        await simulation.startGame()
        simulation.isCommunityMaps = communitySetting //keep the player's setting for later runs
        if (simulation.onTitlePage) return //startGame failed

        //side effects of rebuilding tech the normal way
        const saved = {
            spawn: powerUps.spawn, spawnDelay: powerUps.spawnDelay, directSpawn: powerUps.directSpawn,
            inGameConsole: simulation.inGameConsole,
        }
        powerUps.spawn = powerUps.spawnDelay = powerUps.directSpawn = () => { }
        simulation.inGameConsole = () => { }
        try {
            //Build the time dilation handler for the saved mode, before restoring its numeric state.
            m.fieldUpgrades[6].isRewindMode = save.state.fields?.["time dilation"]?.isRewindMode ?? saveGame.baseline.fields["time dilation"].isRewindMode
            const fieldIndex = m.fieldUpgrades.findIndex(f => f.name === save.field)
            if (fieldIndex > 0) m.setField(fieldIndex)
            else if (fieldIndex < 0 && save.field) missing.push(save.field)
            for (const name of save.guns) {
                if (b.guns.some(g => g.name === name)) b.giveGuns(name)
                else missing.push(name)
            }
            const targetCounts = save.techCounts
            for (const t of tech.tech.slice()) { //a copy, because giving tech reorders the list
                const count = targetCounts[t.name] || 0
                for (let i = 0; i < count; i++) {
                    if (t.isInstant || t.isLore) t.count++ //instant tech already did their one time effect, lore tech change lore progress after a delay
                    else tech.giveTech(t.name)
                }
            }
            for (const name of Object.keys(targetCounts)) if (!tech.tech.some(t => t.name === name)) missing.push(name)
            for (const t of tech.tech.slice()) { //tech that give or remove other tech can leave the wrong counts
                const count = targetCounts[t.name] || 0 //by name, because giving a tech moves it to the top of the list
                if (t.count > count) tech.removeTech(t.name, false)
                while (t.count < count) {
                    if (t.isInstant || t.isLore) t.count++
                    else tech.giveTech(t.name)
                }
            }
            //giving tech moves each one to the top of the list, so put the list back in the saved order
            //older saves only have techCounts, which was written in the same order
            const order = Array.isArray(save.techOrder) ? save.techOrder : Object.keys(targetCounts)
            const rank = new Map(order.map((name, i) => [name, i]))
            tech.tech.sort((a, c) => (rank.get(a.name) ?? Infinity) - (rank.get(c.name) ?? Infinity))
        } finally {
            powerUps.spawn = saved.spawn
            powerUps.spawnDelay = saved.spawnDelay
            powerUps.directSpawn = saved.directSpawn
            simulation.inGameConsole = saved.inGameConsole
        }

        //reset to a fresh run, undoing any side effects of rebuilding tech, then apply everything that changed during the run
        const state = save.state
        const base = saveGame.baseline
        const apply = (obj, group, exclude = []) => { saveGame.assign(obj, base[group], exclude); saveGame.assign(obj, state[group], exclude) }
        const applyByName = (list, group, exclude = []) => { for (const item of list) { saveGame.assign(item, base[group][item.name], exclude); saveGame.assign(item, state[group][item.name], exclude) } }
        apply(tech, "tech", ["wire"])
        applyByName(tech.tech, "techEntries", ["keyListener"]) //keep rebuilt event listeners, including when older saves contain null
        apply(m, "m", ["eigen", "plasmaBall", "holdingTarget", "fieldEvent"]) //keep the key listener setField just added, so the next setField can remove it
        applyByName(m.fieldUpgrades, "fields", ["collider"]) //keep the physics body rebuilt by setField, including when older saves contain collider: null
        applyByName(b.guns, "guns")
        apply(b, "b")
        apply(powerUps, "powerUps")
        apply(mobs, "mobs")
        apply(spawn, "spawn")
        apply(level, "level")
        apply(lore, "lore")
        //rebuilding tech can fire bullets, like booby trap's mine; clearMap would refund their ammo, so remove them first
        for (const who of bullet) Matter.Composite.remove(engine.world, who)
        bullet = []
        //rebuilding tech like eigenstate can hand the player a block; only the saved held block comes back, in clearMap
        m.isHolding = false
        m.holdingTarget = null
        m.definePlayerMass()
        saveGame.assign(simulation, save.simulation)
        if (Array.isArray(save.constraints)) { //restore the shuffled constraint order
            const order = save.constraints
            level.constraint.sort((a, c) => order.indexOf(a.name ?? a.description) - order.indexOf(c.name ?? c.description))
        }
        Math.initialSeed = save.seed
        Math.seed = save.mathSeed
        document.getElementById("seed").value = Math.initialSeed

        //recalculate things that are derived from the restored values
        level.updateDifficulty()
        powerUps.difficulty.setDamageAndDefense(false) //false keeps the restored mob spawn order
        for (const g of b.guns) if (g.chooseFireMethod) g.chooseFireMethod()
        b.setFireMethod()
        b.setFireCD()
        saveGame.restoreRuntime(state.runtime)
        simulation.makeGunHUD()
        simulation.updateGunHUD()
        simulation.updateTechHUD()
        m.displayHealth()
        saveGame.latest = save
        saveGame.isResuming = true //level.start skips run stats that were already counted when this level first started
        saveGame.pendingMessage = missing.length ? `<em>//checkpoint loaded, but these no longer exist: ${missing.join(", ")}</em>` : `<em>//checkpoint loaded</em>`
        //startGame already set simulation.clearNow, so the next cycle clears the map and runs level.start for the saved level
    },
    continueRun() {
        const save = saveGame.storedSave()
        if (save) saveGame.load(save)
    },

    // ****************************************************************************************************
    // save codes and files
    // ****************************************************************************************************
    async encode(save) {
        const json = JSON.stringify(save)
        if (typeof CompressionStream === "function") {
            const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("deflate-raw"))
            const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
            return "ngon1:" + saveGame.toBase64(bytes)
        }
        return "ngon1j:" + saveGame.toBase64(new TextEncoder().encode(json))
    },
    async decode(text) {
        text = String(text).replace(/\s+/g, "") //codes pasted into chat can pick up line breaks
        const match = text.match(/^ngon1(j?):([A-Za-z0-9_-]+)$/)
        if (!match) return null
        let bytes = saveGame.fromBase64(match[2])
        if (!match[1]) {
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
            bytes = new Uint8Array(await new Response(stream).arrayBuffer())
        }
        return JSON.parse(new TextDecoder().decode(bytes))
    },
    toBase64(bytes) { //URL safe base64 without padding
        let binary = ""
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
        return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    },
    fromBase64(text) {
        const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"))
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return bytes
    },
    fileName(save) {
        return `n-gon checkpoint level ${save.state.level.levelsCleared} ${save.state.level.levels[save.state.level.onLevel] ?? ""} ${save.seed}.ngon`.replace(/\s+/g, " ").trim()
    },
    exportHTML() { //pause menu controls
        if (!saveGame.latest) return `<div class="pause-row pause-hint"><span data-help="checkpoint">export checkpoint</span><span>available after the first level</span></div>`
        return `<div id="export-save" class="pause-row"><span data-help="checkpoint">export checkpoint</span><span>
<button onclick="saveGame.copyCode()" class='sort-button' style="font-size:0.9em;">copy code</button>
<button onclick="saveGame.download()" class='sort-button' style="font-size:0.9em;">download file</button>
</span></div>`
    },
    async copyCode() {
        if (!saveGame.latest) return
        const code = await saveGame.encode(saveGame.latest)
        try {
            await navigator.clipboard.writeText(code)
            simulation.inGameConsole(`<em>//checkpoint from the start of level ${saveGame.latest.state.level.levelsCleared} copied to clipboard (${code.length} characters)</em>`)
        } catch (error) {
            prompt("copy this checkpoint code", code)
        }
    },
    async download() {
        if (!saveGame.latest) return
        const code = await saveGame.encode(saveGame.latest)
        const link = document.createElement("a")
        link.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }))
        link.download = saveGame.fileName(saveGame.latest)
        document.body.appendChild(link)
        link.click()
        link.remove()
        setTimeout(() => URL.revokeObjectURL(link.href), 1000)
        simulation.inGameConsole(`<em>//checkpoint from the start of level ${saveGame.latest.state.level.levelsCleared} downloaded as ${link.download}</em>`)
    },
    async importText(text) {
        let save = null
        try {
            save = await saveGame.decode(text)
        } catch (error) { }
        if (save && typeof save.v === "number" && save.v > saveGame.version) {
            alert("That checkpoint is from a newer version of n-gon.")
            return
        }
        if (!saveGame.isValid(save)) {
            alert("That isn't a valid n-gon checkpoint.")
            return
        }
        document.getElementById("settings-details").open = false
        saveGame.load(save)
    },
    importFromBox() {
        saveGame.importText(document.getElementById("import-save-text").value)
    },
    async importFromFile(input) {
        const file = input.files && input.files[0]
        input.value = "" //allows picking the same file again
        if (file) saveGame.importText(await file.text())
    },
    timeAgo(time) {
        const minutes = Math.max(0, Math.round((Date.now() - time) / 60000))
        if (minutes < 1) return "just now"
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
        const hours = Math.round(minutes / 60)
        if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`
        return `${Math.round(hours / 24)} days ago`
    },
    updateContinueButton() { //title page continue button, shown when there is an autosave
        const save = saveGame.storedSave()
        const hasSave = saveGame.isValid(save)
        document.body.classList.toggle("has-autosave", hasSave)
        const button = document.getElementById("continue-button")
        if (!button) return
        button.style.display = hasSave && simulation.onTitlePage !== false ? "inline" : "none"
        if (hasSave) {
            const where = `level ${save.state.level.levelsCleared}: ${save.state.level.levels[save.state.level.onLevel] ?? ""}`
            button.querySelector("title").textContent = `continue from ${where}${save.time ? ` (saved ${saveGame.timeAgo(save.time)})` : ""}`
        }
    },
}
