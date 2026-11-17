"use strict";
//autopilot plays the game for you, for testing, its code only downloads the first time something turns it on, see autopilot.files
//until then autopilot is this small stand in:
//  each level's helpers (level.button, level.door, level.hazard, ...) list what they make in autopilot.made, a push per piece as the level is built,
//  so autopilot can see the level it loads in, setup() reads the list and observe() handles what's made after
//  set(true), toggle(), and chooseDraft() wait for the download, then the real ones from js/autopilot.js take their place
const autopilot = {
    isOn: false,
    isLoaded: false, //set by setup(), at the end of the last file
    isPending: false, //turned on, waiting for the files
    files: [ //in order, the last one calls autopilot.setup()
        "js/autopilot-build.js", "js/autopilot.js", "js/autopilot-grid.js", "js/autopilot-edges.js", "js/autopilot-plan.js",
        "js/autopilot-mechanisms.js", "js/autopilot-fight.js", "js/autopilot-drive.js", "js/autopilot-air.js",
    ],
    ranFiles: new Set(), //files that loaded, a retry after a failed download only adds the rest
    loading: null, //the download's promise
    load() { //resolves once every file has run, also from the browser console or a tool: await autopilot.load()
        if (autopilot.isLoaded) return Promise.resolve()
        if (!autopilot.loading) {
            autopilot.loading = new Promise((resolve, reject) => {
                const scripts = autopilot.files.filter(src => !autopilot.ranFiles.has(src)).map(src => {
                    const script = document.createElement("script")
                    script.src = src
                    script.async = false //run in order
                    script.onload = () => autopilot.ranFiles.add(src)
                    script.onerror = () => {
                        script.remove()
                        reject(new Error(`couldn't download ${src}`))
                    }
                    document.head.appendChild(script)
                    return script
                })
                if (!scripts.length) return reject(new Error("autopilot didn't set up"))
                scripts[scripts.length - 1].addEventListener("load", () => autopilot.isLoaded ? resolve() : reject(new Error("autopilot didn't set up")))
            }).catch(error => {
                autopilot.loading = null
                throw error
            })
        }
        return autopilot.loading
    },
    set(isOn) { //the real set() replaces this when the files load
        autopilot.isPending = isOn
        if (!isOn) return
        simulation.inGameConsole(`<em>//loading autopilot</em>`)
        autopilot.load().then(() => {
            if (!autopilot.isPending) return //turned off while it downloaded
            autopilot.isPending = false
            autopilot.set(true)
        }, error => {
            autopilot.isPending = false
            simulation.inGameConsole(`<em>//autopilot didn't load, ${error.message}</em>`)
            console.error(error)
        })
    },
    toggle(isAutoChoose = false) { //the real toggle() replaces this when the files load
        tech.isAutopilotChoose = isAutoChoose
        autopilot.set(!autopilot.isRequested())
        return autopilot.isPending ? "loading autopilot, it turns on when it's ready" : "autopilot off"
    },
    isRequested() { //on, or turning on once it downloads
        return autopilot.isOn || autopilot.isPending
    },
    chooseDraft(clickDelay) { //power up menus call this every draft, it only matters once the autopilot is on
        if (autopilot.isPending) autopilot.load().then(() => autopilot.chooseDraft(clickDelay), () => { })
    },
    settingsHTML: () => "", //the autopilot tech's settings, once it's loaded

    made: [], //{ kind, who, args, cycle } what this level's helpers made, cleared as each level starts
    watched: ["boost", "elevator", "train", "spinner", "doorMap", "door", "transport", "mover", "button", "toggle", "wind", "portal", "hazard", "laser", "gravityZone", "effectZone"],
    watchLevel() { //wraps each helper once, setup() runs it again for helpers added later, like in the unit tests
        for (const kind of autopilot.watched) {
            const make = level[kind]
            if (typeof make !== "function" || make.isAutopilotWatched) continue
            const watched = level[kind] = function () {
                const who = make.apply(this, arguments)
                const record = { kind, who, args: [...arguments], cycle: simulation.cycle }
                autopilot.made.push(record)
                if (autopilot.isLoaded) autopilot.observe(record)
                return who
            }
            watched.isAutopilotWatched = true
        }
        const start = level.start
        if (typeof start === "function" && !start.isAutopilotWatched) {
            const watched = level.start = function () {
                autopilot.made.length = 0 //the last level's pieces are gone
                if (autopilot.isLoaded) autopilot.newLevel()
                return start.apply(this, arguments)
            }
            watched.isAutopilotWatched = true
        }
    },
}
autopilot.watchLevel()
