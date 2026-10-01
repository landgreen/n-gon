"use strict";
//copies crashes and console.log, console.warn, and console.error into the in-game console
//tip: add this file to Chrome DevTools' ignore list (right click it in the sources panel) so the browser console links console.log calls to their caller instead of this file

const consoleMirror = {
    lastHTML: "",
    lastConsoleLength: 0,
    isShownByLoop: false, //the main loop catches its own errors, because browsers hide error details from window error events when the game runs from file://
    isLogging: false, //stops a console.log inside the in-game console from looping forever
    titleLogs: [], //the title screen covers the in-game console, so these wait until the first level starts
    escape(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    },
    shortFile(s) { //http://localhost/js/bullet.js:12:3 → bullet.js:12:3
        return s.replace(/(?:https?|file):\/\/\S*?\/([^/\s)]+:\d+:\d+)/g, "$1")
    },
    frames(stack) { //the lines of a call stack, chrome writes "at fn (file:1:2)" and firefox and safari write "fn@file:1:2"
        return String(stack).split("\n").map(line => line.trim()).filter(line => (line.startsWith("at ") || /@.*:\d+:\d+$/.test(line)) && line !== "at eval (<anonymous>)")
    },
    errorHTML(error, frames = consoleMirror.frames(error.stack)) { //the error message, then the file and line number of each function in the call stack
        return consoleMirror.escape(error) + frames.slice(0, 8).map(line => `<br>&nbsp;&nbsp;${consoleMirror.escape(consoleMirror.shortFile(line))}`).join("")
    },
    print(html, time) {
        if (simulation.onTitlePage) {
            if (consoleMirror.titleLogs.length < 10) consoleMirror.titleLogs.push(html)
            return
        }
        //skip a message that's still the last line, like an error that happens every frame
        if (html === consoleMirror.lastHTML && simulation.lastLogTime > m.cycle && simulation.consoleLength === consoleMirror.lastConsoleLength) return
        simulation.inGameConsole(html, time);
        consoleMirror.lastHTML = html
        consoleMirror.lastConsoleLength = simulation.consoleLength
    },
    showTitleLogs() { //called after level.start(), which clears the in-game console
        for (const html of consoleMirror.titleLogs) simulation.inGameConsole(html, 600)
        consoleMirror.titleLogs.length = 0
    },
    showError(error, event) {
        try {
            let html
            if (error && error.stack) {
                html = consoleMirror.errorHTML(error)
            } else if (event && event.filename) {
                html = `${consoleMirror.escape(event.message)} <u>${consoleMirror.escape(consoleMirror.shortFile(`${event.filename}:${event.lineno}:${event.colno}`))}</u>`
            } else { //browsers hide error details from scripts loaded from file:// or another origin
                html = `${consoleMirror.escape(event ? event.message : error)} <em>//no file or line number, check the browser console</em>`
            }
            consoleMirror.print(`<strong style='color:red;'>ERROR:</strong> ${html}`, 900)
        } catch (e) { }
    },
    formatValue(a) { //shows any value as html, like the browser console
        if (typeof a === "string") return consoleMirror.escape(a)
        if (a instanceof Error || (a && typeof a.stack === "string")) return consoleMirror.errorHTML(a)
        if (typeof a === "function") return consoleMirror.escape(`function ${a.name}`)
        if (a === null || typeof a !== "object") return consoleMirror.escape(a)
        let json
        try {
            json = JSON.stringify(a)
        } catch (e) { //circular objects like mobs and bodies
            json = `{${Object.keys(a).slice(0, 6).join(", ")}, …}`
        }
        if (json.length > 300) json = json.slice(0, 300) + "…"
        return consoleMirror.escape(json)
    },
    showLog(type, args) {
        if (consoleMirror.isLogging) return
        consoleMirror.isLogging = true
        try {
            const text = args.map(consoleMirror.formatValue).join(" ")
            const caller = consoleMirror.frames(new Error().stack).find(line => !line.includes("console-mirror.js"))
            const where = caller && consoleMirror.shortFile(caller).match(/([^\s()@]+:\d+):\d+\)?$/)
            const prefix = type === "error" ? "<strong style='color:red;'>ERROR:</strong> " : type === "warn" ? "<strong style='color:#c80;'>WARN:</strong> " : ""
            consoleMirror.print(`${prefix}${text}${where ? ` <em>//${consoleMirror.escape(where[1])}</em>` : ""}`, type === "log" ? 240 : 600)
        } catch (e) {
        } finally {
            consoleMirror.isLogging = false
        }
    },
}
window.addEventListener("error", event => {
    if (consoleMirror.isShownByLoop) { //already shown with its stack by the main loop
        consoleMirror.isShownByLoop = false
        return
    }
    consoleMirror.showError(event.error, event)
});
window.addEventListener("unhandledrejection", event => consoleMirror.showError(event.reason));
for (const type of ["log", "warn", "error"]) {
    const original = console[type]
    console[type] = function (...args) {
        original.apply(console, args)
        consoleMirror.showLog(type, args)
    }
}

//a text box at the bottom of the pause menu's console log that runs javascript like the browser console
const pauseConsole = {
    history: [], //commands typed this session, for the up and down arrow keys
    historyIndex: 0,
    draft: "", //what's typed so far, kept when the pause menu is rebuilt
    html: `<div id="pause-console"><span class='color-symbol'>&gt;</span><input type="text" id="pause-console-input" spellcheck="false" autocomplete="off" placeholder="console"></div>`,
    setup() { //called after the pause menu is rebuilt
        const el = document.getElementById("pause-console-input")
        if (!el) return
        el.value = pauseConsole.draft
        if (pauseConsole.history.length) el.placeholder = "" //only hint at what the box is for until it's been used
        el.addEventListener("input", () => { pauseConsole.draft = el.value })
        el.addEventListener("keyup", event => event.stopPropagation())
        el.addEventListener("keydown", event => {
            if (el.offsetParent === null) { //the pause menu closed without removing focus (firefox), so give the keys back to the game
                el.blur()
                return
            }
            event.stopPropagation() //typing shouldn't move, unpause, or switch guns
            if (event.key === "Enter" && !event.isComposing) {
                pauseConsole.run(el.value)
            } else if (event.key === "Escape") {
                el.blur()
            } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault()
                const h = pauseConsole.history
                pauseConsole.historyIndex = Math.max(0, Math.min(h.length, pauseConsole.historyIndex + (event.key === "ArrowUp" ? -1 : 1)))
                el.value = pauseConsole.draft = h[pauseConsole.historyIndex] ?? ""
            }
        })
    },
    run(code) {
        if (!code.trim()) return
        //pausing hides the in-game console, so the next message would replace it, keep adding to the log shown in the pause menu instead
        const log = document.getElementById("text-log")
        if (simulation.lastLogTime <= m.cycle && log.innerHTML && !localSettings.isHideHUD) {
            simulation.lastLogTime = m.cycle + 1
            log.style.display = "inline"
        }
        tech.setCheating()
        pauseConsole.history.push(code)
        pauseConsole.historyIndex = pauseConsole.history.length
        pauseConsole.draft = ""
        simulation.inGameConsole(`<span class='color-symbol'>&gt;</span> ${consoleMirror.escape(code)}`)
        try {
            const result = window.eval(code) //indirect eval runs in the global scope, so tech, m, b, spawn, and powerUps all work
            if (result !== undefined) simulation.inGameConsole(`<span class='color-symbol'>&lt;</span> ${consoleMirror.formatValue(result)}`)
        } catch (error) {
            const frames = consoleMirror.frames(error && error.stack)
            const end = frames.findIndex(line => line.includes("console-mirror.js") && !line.includes("eval")) //hide the call stack of this console, it's the same every time
            simulation.inGameConsole(`<strong style='color:red;'>ERROR:</strong> ${error && error.stack ? consoleMirror.errorHTML(error, end === -1 ? frames : frames.slice(0, end)) : consoleMirror.formatValue(error)}`)
        }
        if (document.getElementById("pause-grid-left").style.display !== "none") { //rebuild the pause menu to show new tech, guns, and the console output
            const lastLogTime = simulation.lastLogTime //pauseGrid() resets this, which would clear the output on the next command
            build.pauseGrid()
            simulation.lastLogTime = lastLogTime
            requestAnimationFrame(() => { //after pauseGrid restores which details are open
                const details = document.getElementById("console-log-details")
                if (details) details.open = true
                const el = document.getElementById("pause-console-input")
                if (el) el.focus()
            })
        }
    },
}
