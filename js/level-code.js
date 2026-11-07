"use strict";
// Execution policy for local and community level code, independent of the editor UI.
// Read-only save proxies prevent accidental writes, not deliberately hostile code.
const levelCode = {
    codeFunction(params, body) { //Function(...params, body) for a level's javascript, with the read-only stand-ins, see codeGlobals()
        Function(...params, body) //read alone first: code that can't be read throws a SyntaxError here, and its brackets can't close the function below early
        const globals = levelCode.codeGlobals()
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
            localStorage: levelCode.readOnly(storage("localStorage"), "localStorage", true),
            sessionStorage: levelCode.readOnly(storage("sessionStorage"), "sessionStorage", true),
            localSettings: levelCode.readOnly(typeof localSettings === "undefined" ? undefined : localSettings, "localSettings"),
            indexedDB: undefined,
        }
    },
    readOnlies: new WeakMap(), //each object's read-only stand-in, so the same object is always the same stand-in
    readOnly(value, name, isStorage = false) { //value and everything in it can be read, changing any of it throws in the editor and does nothing in a run
        if (value === null || typeof value !== "object") return value
        if (levelCode.readOnlies.has(value)) return levelCode.readOnlies.get(value)
        const refuse = () => {
            if (levelEditor.isActive) throw new Error(`level code can't change ${name}`) //shows in the info box and the issues
            if (!levelCode.refused.has(name)) console.warn(`level code can't change ${name}`) //a run keeps going without the change
            levelCode.refused.add(name)
            return true
        }
        const proxy = new Proxy(value, {
            get(target, key) {
                if (isStorage && ["setItem", "removeItem", "clear"].includes(key)) return refuse
                const got = Reflect.get(target, key)
                if (isStorage && typeof got === "function") return got.bind(target) //storage's methods only work on the real storage
                return levelCode.readOnly(got, name)
            },
            set: refuse,
            deleteProperty: refuse,
            defineProperty: refuse,
            setPrototypeOf: refuse,
        })
        levelCode.readOnlies.set(value, proxy)
        return proxy
    },
    refused: new Set(), //what level code tried to change in a run, warned about once
    communityLevels: new Map(), //name: the community level made again from its source, see communityLevel()
    communityLevel(name) { //a community level from level2.js, made again from its own source so its code gets the read-only stand-ins, level.load() runs it
        if (!levelCode.communityLevels.has(name)) {
            const original = moreLevels[name]
            const source = original.toString()
            let made = original
            try {
                made = Object.values(levelCode.codeFunction([], `"use strict";\nreturn { ${source} }`)()).find(value => typeof value === "function") || original //name() { ... }
            } catch (error) {
                console.error(`community level ${name} runs without read-only saves:`, error) //written some other way, it still runs
            }
            levelCode.communityLevels.set(name, made)
        }
        return levelCode.communityLevels.get(name)
    },
}
