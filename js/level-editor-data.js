"use strict";
// Authoring only: export JavaScript and read/capture source. Loaded when the editor opens.
Object.assign(levelData, {
    elementCode(data, el) { //the lines one element writes in export JS, for the inspector's js view
        const type = levelElements.types[el.type]
        if (!type) return "//unknown type"
        if (type.isCode) return el.code
        const { names, context } = levelData.codeNames(data)
        const lines = levelData.isTogether(el) ? { setup: type.codeAll(data.elements.filter(other => other.type === el.type && levelData.isTogether(other)), data), custom: [], top: [] } : levelData.exportElement(el, names.get(el.id), context)
        return levelData.sectionsText(lines)
    },
    code(data) {
        return levelData.codeLines(data).map(line => line.text).join("\n")
    },
    keepTypedPlace(data, ids) { //the elements with ids are going, typed lines under them go under what's above them instead, so they stay where they are
        if (!levelData.typedOf(data).some(block => ids.includes(block.after) || ids.includes(block.runsAfter))) return
        const above = { setup: "start", custom: "custom-start", top: "top-start" }
        const element = { setup: null, custom: null, top: null }
        for (const line of levelData.codeLines(data, true)) {
            if (line.block) {
                if (ids.includes(line.block.after)) line.block.after = above[line.part]
                if (ids.includes(line.block.runsAfter)) line.block.runsAfter = element[line.part]
            } else if (line.text.trim() && !ids.includes(line.anchor)) {
                above[line.part] = line.anchor
                if (typeof line.anchor === "number") element[line.part] = line.anchor
            }
        }
    },

    authorLine: /^simulation\.inGameConsole\(`<strong>[^<`]*<\/strong> by <span class=['"]color-var['"]>([^<`]*)<\/span>`\)$/, //that line in a written level's source, capture() reads the author from it
    authorOf(source) { //the author a written level logs, or ""
        for (const line of levelData.scanLines(source)) {
            const match = (line.comment === -1 ? line.text : line.text.slice(0, line.comment)).trim().replace(/;$/, "").match(levelData.authorLine)
            if (match) return levelData.unescape(match[1].trim()) //html in the source, plain text in the level
        }
        return ""
    },
    //*********************************************************************
    // the code panel's whole level, typed text back to data, the data stays the level so dragging keeps working
    // lines that match stay with their owner, typing in an element's lines edits it, new lines between owners stay where they're typed, lines the editor writes itself come back
    //*********************************************************************
    diffLines(before, after) { //for each line of after, the line of before it stays as, or -1, in order
        const match = new Array(after.length).fill(-1)
        let start = 0
        while (start < before.length && start < after.length && before[start] === after[start]) {
            match[start] = start
            start++
        }
        let endA = before.length
        let endB = after.length
        while (endA > start && endB > start && before[endA - 1] === after[endB - 1]) {
            endA--
            endB--
            match[endB] = endA
        }
        const rows = endA - start
        const columns = endB - start
        if (rows * columns <= 16000000) { //longest common lines between what changed
            const width = columns + 1
            const table = new Uint32Array((rows + 1) * width)
            for (let i = rows - 1; i >= 0; i--) {
                for (let j = columns - 1; j >= 0; j--) {
                    table[i * width + j] = before[start + i] === after[start + j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
                }
            }
            for (let i = 0, j = 0; i < rows && j < columns;) {
                if (before[start + i] === after[start + j]) match[start + j++] = start + i++
                else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++
                else j++
            }
        } else { //too much changed to compare it all, the next line that's the same
            let i = start
            for (let j = start; j < endB; j++) {
                const at = before.indexOf(after[j], i)
                if (at === -1 || at >= endA) continue
                match[j] = at
                i = at + 1
            }
        }
        return match
    },
    splitCode(base, text) { //what typing changed from base, codeLines(data, true), to text: { owners: Map(id or "level": { setup, custom, top }), removed: ids with nothing left, typed: the level's typedCode now, restored: lines the editor writes that came back }
        const after = text.split("\n")
        const match = levelData.diffLines(base.map(line => line.text), after)
        const owners = new Map()
        const touched = new Set()
        const sections = owner => {
            if (!owners.has(owner)) owners.set(owner, { setup: [], custom: [], top: [] })
            return owners.get(owner)
        }
        const outdent = (lineText, indent) => lineText.replace(new RegExp(`^ {0,${indent}}`), "")
        const typed = []
        let last = null //the line above, not blank or typed
        const lastElement = { setup: null, custom: null, top: null }
        const see = line => {
            if (line.owner === "typed" || !line.text.trim()) return
            last = line
            if (typeof line.anchor === "number") lastElement[line.part] = line.anchor
        }
        const addTyped = lineText => {
            const part = last ? last.part : "setup"
            const at = last ? last.anchor : "start"
            const block = typed[typed.length - 1]
            const textNow = outdent(lineText, part === "setup" ? 4 : 8)
            if (block && block.after === at && block.part === part) block.lines.push(textNow)
            else typed.push({ after: at, runsAfter: lastElement[part], part, lines: [textNow] })
        }
        let restored = 0
        let i = 0
        const hunk = (nextBase, added) => { //the lines of base before nextBase went, the added lines came
            const gone = base.slice(i, nextBase)
            const lost = gone.filter(line => line.owner !== undefined && line.owner !== "typed")
            restored += gone.filter(line => line.owner === undefined && line.text.trim()).length
            for (const line of lost) touched.add(line.owner)
            for (const line of gone) if (line.owner === undefined) see(line) //it comes back, so what's typed stays under it
            if (!added.length || (added.every(lineText => !lineText.trim()) && !lost.length)) return
            if (lost.length) { //new lines above a changed line aren't part of it
                const firstWords = lineText => lineText.trim().split(/[\s(=.]+/).slice(0, 2).join(" ")
                const same = added.findIndex(lineText => firstWords(lineText) === firstWords(lost[0].text))
                if (same > 0) {
                    for (const lineText of added.slice(0, same)) addTyped(lineText)
                    added = added.slice(same)
                }
            }
            const above = base[i - 1]
            const below = base[nextBase]
            const own = [lost[0], above, below].find(line => line?.owner !== undefined && line.owner !== "typed" && (line === lost[0] || (above && below && above.anchor === below.anchor && typeof above.anchor === "number") || (above?.owner === below?.owner)))
            let owner = own?.owner
            let part = own?.part
            let indent = own?.indent
            if (owner === undefined && (last?.owner === "level" || last?.anchor === "level-code")) {
                owner = "level"
                part = last.part
                indent = part === "setup" ? 4 : 8
            }
            if (owner === undefined) {
                for (const lineText of added) addTyped(lineText)
                return
            }
            touched.add(owner)
            sections(owner)[part].push(...added.map(lineText => outdent(lineText, indent || 0)))
        }
        let added = []
        for (let j = 0; j < after.length; j++) {
            if (match[j] === -1) {
                added.push(after[j])
                continue
            }
            hunk(match[j], added)
            added = []
            i = match[j]
            const line = base[i]
            if (line.owner === "typed") addTyped(line.text)
            else if (line.owner !== undefined) sections(line.owner)[line.part].push(outdent(line.text, line.indent || 0))
            see(line)
            i++
        }
        hunk(base.length, added)
        const result = new Map()
        const removed = []
        for (const owner of touched) {
            const parts = owners.get(owner) || { setup: [], custom: [], top: [] }
            if (owner !== "level" && !parts.setup.concat(parts.custom, parts.top).some(line => line.trim())) removed.push(owner)
            else result.set(owner, parts)
        }
        return { owners: result, removed, restored, typed: levelData.normalizeTyped(typed) }
    },
    //*********************************************************************
    // settings and edited code keep up with each other, nothing here knows any element type, it only compares the code they write, it only runs when an edit is applied
    //*********************************************************************
    codeTokens: text => String(text).match(/-?\d+(?:\.\d+)?(?:e-?\d+)?|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|[A-Za-z_$][\w$]*|\n|[^\S\n]+|./g) || [],
    tokenChanges(a, b) { //[{ a: [start, end], b: [start, end] }] the parts of a that are different in b, or null if too much is different to compare
        let start = 0
        while (start < a.length && start < b.length && a[start] === b[start]) start++
        let tail = 0
        while (tail < a.length - start && tail < b.length - start && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
        const rows = a.length - start - tail
        const columns = b.length - start - tail
        if (rows * columns > 4000000) return null
        const width = columns + 1
        const table = new Uint32Array((rows + 1) * width)
        for (let i = rows - 1; i >= 0; i--) {
            for (let j = columns - 1; j >= 0; j--) {
                table[i * width + j] = a[start + i] === b[start + j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
            }
        }
        const changes = []
        let open = null
        let i = 0
        let j = 0
        const close = () => {
            if (open) changes.push({ a: [open.i + start, i + start], b: [open.j + start, j + start] })
            open = null
        }
        while (i < rows || j < columns) {
            if (i < rows && j < columns && a[start + i] === b[start + j]) {
                close()
                i++
                j++
                continue
            }
            if (!open) open = { i, j }
            if (j >= columns || (i < rows && table[(i + 1) * width + j] >= table[i * width + j + 1])) i++
            else j++
        }
        close()
        return changes
    },
    statementOf: line => line.trim().split(/\(| = /)[0], //what a line is, like spawn.bodyRect or Matter.Body.setVelocity
    mergeLine(old, now, typed) { //a line typing changed, what settings changed in it too: only values swapped in place, away from what's typed, so it can't make different code than either meant, { text, conflicts }
        const before = levelData.codeTokens(old)
        const after = levelData.codeTokens(now)
        const mine = levelData.codeTokens(typed)
        const changes = levelData.tokenChanges(before, mine)
        const isValue = token => /^-?\d|^["']/.test(token)
        if (before.length !== after.length || !changes || before.some((token, i) => token !== after[i] && !(isValue(token) && isValue(after[i])))) return { text: typed, conflicts: 1 } //it's a different line, not different values
        const beside = (tokens, i, step) => { //the next token that isn't a space
            let at = i + step
            while (tokens[at] !== undefined && !tokens[at].trim()) at += step
            return tokens[at]
        }
        const at = i => { //where a value of the line is in what's typed, -1 if typing changed it or what's on either side of it, like the * 2 in 0.5 * 2
            let shift = 0
            for (const change of changes) {
                if (i >= change.a[0] && i < change.a[1]) return -1
                if (change.a[1] <= i) shift += (change.b[1] - change.b[0]) - (change.a[1] - change.a[0])
            }
            const there = i + shift
            return beside(before, i, -1) === beside(mine, there, -1) && beside(before, i, 1) === beside(mine, there, 1) ? there : -1
        }
        const out = mine.slice()
        let conflicts = 0
        for (let i = 0; i < before.length; i++) {
            if (before[i] === after[i]) continue
            if (at(i) === -1) conflicts++
            else out[at(i)] = after[i]
        }
        return { text: out.join(""), conflicts }
    },
    mergeCode(oldText, newText, edited) { //what changed from oldText to newText, made in edited, line by line, { text, conflicts }: a line typing changed stays as typed if it can't take it, it's counted
        const old = oldText.split("\n")
        const now = newText.split("\n")
        const out = edited.split("\n")
        const statement = levelData.statementOf
        const match = levelData.diffLines(old, now)
        const taken = new Set() //lines of now that are the same or take over a line of old
        const partner = new Map() //line of old: its line in now
        match.forEach((at, j) => {
            if (at !== -1) {
                partner.set(at, j)
                taken.add(j)
            }
        })
        old.forEach((line, i) => { //changed lines are the next of the same statement
            if (partner.has(i) || !line.trim()) return
            const j = now.findIndex((other, k) => !taken.has(k) && other.trim() && statement(other) === statement(line))
            if (j === -1) return
            partner.set(i, j)
            taken.add(j)
        })
        let conflicts = 0
        const find = line => out.indexOf(line)
        const findStatement = line => out.findIndex(other => other.trim() && statement(other) === statement(line))
        old.forEach((line, i) => {
            if (!line.trim()) return
            const j = partner.get(i)
            if (j !== undefined && now[j] === line) return
            const exact = find(line)
            if (j === undefined) { //a setting doesn't write this line now
                if (exact !== -1) out.splice(exact, 1)
                else if (findStatement(line) !== -1) conflicts++
                return
            }
            if (exact !== -1) {
                out[exact] = now[j]
                return
            }
            const typed = findStatement(line)
            if (typed === -1) return //typing removed it
            const merged = levelData.mergeLine(line, now[j], out[typed])
            out[typed] = merged.text
            conflicts += merged.conflicts
        })
        now.forEach((line, j) => { //lines a setting writes now, under the line above them
            if (taken.has(j) || !line.trim()) return
            if (findStatement(line) !== -1) return conflicts++
            let at = -1
            for (let k = j - 1; k >= 0 && at === -1; k--) if (now[k].trim()) at = findStatement(now[k])
            out.splice(at + 1, 0, line)
        })
        return { text: out.join("\n"), conflicts }
    },
    sortedLines: text => String(text).split("\n").map(line => line.trim()).filter(Boolean).sort().join("\n"), //the order of lines doesn't change which settings they are
    syncSettings(el, name, context, text) { //what's typed in an element's code goes in the settings that write it, found by trying them: numbers, words, and checkboxes, it keeps what gets the code closest to what's typed
        const type = levelElements.types[el.type]
        const write = () => levelData.codeTokens(levelData.sortedLines(levelData.sectionsText(type.code(el, name, context))))
        const want = levelData.codeTokens(levelData.sortedLines(text))
        const size = change => Math.max(change.a[1] - change.a[0], change.b[1] - change.b[0])
        const distance = tokens => {
            const changes = levelData.tokenChanges(tokens, want)
            return changes ? changes.reduce((sum, change) => sum + size(change), 0) : Infinity
        }
        const isNumber = token => /^-?\d/.test(token)
        const isText = token => /^["']/.test(token)
        const keys = Object.keys(el).filter(key => key !== "id" && key !== "group" && key !== "type" && ["number", "boolean", "string"].includes(typeof el[key]))
        const original = JSON.stringify(el)
        const defaults = levelElements.create(el.type, {}) //a line that isn't there is its setting at its default
        try {
            for (let round = 0; round < 12; round++) {
                const tokens = write()
                const at = distance(tokens)
                if (!at) break
                const changes = levelData.tokenChanges(tokens, want) || []
                const typedTokens = changes.flatMap(change => want.slice(...change.b))
                const pairs = changes.filter(change => size(change) === 1).map(change => [tokens[change.a[0]], want[change.b[0]]]).filter(([from, to]) => isNumber(from) && isNumber(to)).map(([from, to]) => to - from)
                const numbers = typedTokens.filter(isNumber).map(Number)
                const words = typedTokens.filter(isText).map(token => token.slice(1, -1))
                const tries = value => typeof value === "boolean" ? [!value] : typeof value === "string" ? words : [...numbers, ...pairs.map(by => Number((value + by).toFixed(6)))]
                let best = null
                for (const key of keys) {
                    const value = el[key]
                    for (const next of [...tries(value), ...(typeof value === typeof defaults[key] && value !== defaults[key] ? [defaults[key]] : [])]) {
                        el[key] = next
                        const score = distance(write())
                        if (score < at && (!best || score < best.score)) best = { key, next, score }
                    }
                    el[key] = value
                }
                if (!best) break
                el[best.key] = best.next
            }
            levelData.normalize({ name: "check", elements: [JSON.parse(JSON.stringify(el))] }) //a value a setting can't have stays in the code only
        } catch (error) {
            Object.keys(el).forEach(key => delete el[key])
            Object.assign(el, JSON.parse(original))
        }
    },
    typedIsSetting(el, name, context, lines) { //true and el's settings change if the lines typed under el are what a setting writes, in any order
        const type = levelElements.types[el.type]
        const made = () => levelData.sectionsText(type.code(el, name, context))
        const original = JSON.stringify(el)
        const sorted = levelData.sortedLines
        const want = `${made()}\n${lines.join("\n")}`
        levelData.syncSettings(el, name, context, want)
        if (sorted(made()) === sorted(want)) return true
        Object.keys(el).forEach(key => delete el[key])
        Object.assign(el, JSON.parse(original))
        return false
    },
    settingsOfCode(el, name, context, text) { //a copy of el with the settings its code says
        const copy = JSON.parse(JSON.stringify(el))
        delete copy.edited
        levelData.syncSettings(copy, name, context, text)
        return copy
    },
    mergeSettings(was, el, names) { //what changed from was to el goes in its edited code, was and el the same is everything its code doesn't have yet, returns how many places its code kept what was typed
        const type = levelElements.types[el.type]
        const name = names.names.get(el.id)
        const write = target => levelData.sectionsText(type.code(target, name, names.context))
        const edited = levelData.sectionsText(levelData.typeCode(was, name, names.context))
        const said = levelData.settingsOfCode(was, name, names.context, edited)
        const target = was === el ? el : { ...said } //a setting that couldn't go in its code earlier doesn't get in the way of this one
        if (was !== el) for (const key of Object.keys({ ...was, ...el })) {
            if (key !== "edited" && JSON.stringify(was[key]) !== JSON.stringify(el[key])) target[key] = el[key]
        }
        const merged = levelData.mergeCode(write(said), write(target), edited)
        levelData.editedFunction(merged.text) //it's still code that can be read, or this throws and the code stays
        if (levelData.sortedLines(merged.text) === levelData.sortedLines(write(el))) delete el.edited
        else el.edited = { name, text: merged.text, names: Object.fromEntries(Object.keys(el.edited.names || {}).map(id => [id, names.names.get(Number(id)) || el.edited.names[id]])) }
        return merged.conflicts
    },
    catchUpEdited(el, names) { //opening a level, an older version could leave its settings and code different: a setting at its default takes what the code says, a setting that's been changed goes in the code
        const name = names.names.get(el.id)
        const said = levelData.settingsOfCode(el, name, names.context, levelData.sectionsText(levelData.typeCode(el, name, names.context)))
        const defaults = levelElements.create(el.type, {})
        for (const key of Object.keys(said)) {
            if (key !== "id" && JSON.stringify(said[key]) !== JSON.stringify(el[key]) && JSON.stringify(el[key]) === JSON.stringify(defaults[key])) el[key] = said[key]
        }
        levelData.mergeSettings(el, el, names)
    },
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

})
