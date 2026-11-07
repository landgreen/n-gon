"use strict";
// Shared level program: the panel, export, and local playback use the same ordered lines.
Object.assign(levelData, {
    dataMark: "//level editor: ",
    syntaxCache: new Map(), //bounded because code changes on each apply; ordinary game levels never use the parser
    analyzeCode(text) { //bindings and free references, using JavaScript syntax rather than words in comments
        const cached = levelData.syntaxCache.get(text)
        if (cached) return cached
        const root = { parent: null, names: new Set(), functionScope: true }
        const uses = []
        const scope = (parent, functionScope = false) => ({ parent, names: new Set(), functionScope })
        const bind = (node, here) => {
            if (!node) return
            if (node.type === "Identifier") here.names.add(node.name)
            else if (node.type === "RestElement") bind(node.argument, here)
            else if (node.type === "AssignmentPattern") { bind(node.left, here); visit(node.right, here) }
            else if (node.type === "ArrayPattern") node.elements.forEach(item => bind(item, here))
            else if (node.type === "ObjectPattern") for (const prop of node.properties) {
                if (prop.type === "RestElement") bind(prop.argument, here)
                else { if (prop.computed) visit(prop.key, here); bind(prop.value, here) }
            }
        }
        const visit = (node, here) => {
            if (!node || typeof node.type !== "string") return
            switch (node.type) {
                case "Identifier": uses.push({ name: node.name, scope: here }); return
                case "VariableDeclaration": {
                    let target = here
                    if (node.kind === "var") while (!target.functionScope) target = target.parent
                    for (const decl of node.declarations) { bind(decl.id, target); visit(decl.init, here) }
                    return
                }
                case "FunctionDeclaration":
                case "FunctionExpression":
                case "ArrowFunctionExpression": {
                    if (node.type === "FunctionDeclaration" && node.id) here.names.add(node.id.name)
                    const inner = scope(here, true)
                    if (node.id) inner.names.add(node.id.name)
                    for (const param of node.params) bind(param, inner)
                    const bodyScope = scope(inner, true) //parameter defaults cannot see declarations in the function body
                    if (node.body.type === "BlockStatement") node.body.body.forEach(child => visit(child, bodyScope))
                    else visit(node.body, bodyScope)
                    return
                }
                case "ClassDeclaration":
                case "ClassExpression": {
                    if (node.type === "ClassDeclaration" && node.id) here.names.add(node.id.name)
                    const inner = scope(here)
                    if (node.id) inner.names.add(node.id.name)
                    visit(node.superClass, inner); visit(node.body, inner); return
                }
                case "BlockStatement":
                case "StaticBlock": {
                    const inner = scope(here, node.type === "StaticBlock")
                    node.body.forEach(child => visit(child, inner)); return
                }
                case "ForStatement":
                case "ForInStatement":
                case "ForOfStatement": {
                    const inner = scope(here)
                    for (const key of ["init", "test", "update", "left", "right", "body"]) visit(node[key], inner)
                    return
                }
                case "SwitchStatement": {
                    visit(node.discriminant, here)
                    const inner = scope(here)
                    node.cases.forEach(child => visit(child, inner)); return
                }
                case "CatchClause": {
                    const inner = scope(here)
                    bind(node.param, inner); visit(node.body, inner); return
                }
                case "MemberExpression": visit(node.object, here); if (node.computed) visit(node.property, here); return
                case "Property":
                case "MethodDefinition":
                case "PropertyDefinition":
                    if (node.computed) visit(node.key, here)
                    visit(node.value, here); return
                case "LabeledStatement": visit(node.body, here); return
                case "BreakStatement":
                case "ContinueStatement":
                case "PrivateIdentifier": return
            }
            for (const value of Object.values(node)) {
                if (Array.isArray(value)) value.forEach(child => visit(child, here))
                else if (value && typeof value === "object") visit(value, here)
            }
        }
        try {
            const tree = levelParser().parse(`function __scope() {\n${text}\n}`, { ecmaVersion: "latest" })
            tree.body[0].body.body.forEach(node => visit(node, root))
        } catch (error) { //the compiler reports invalid source; don't guess bindings from its text
            return { declarations: new Set(), references: new Set() }
        }
        const references = new Set()
        for (const use of uses) {
            let here = use.scope
            while (here && !here.names.has(use.name)) here = here.parent
            if (!here) references.add(use.name)
        }
        const result = { declarations: root.names, references }
        if (text.length < 32768) {
            if (levelData.syntaxCache.size >= 64) levelData.syntaxCache.delete(levelData.syntaxCache.keys().next().value)
            levelData.syntaxCache.set(text, result)
        }
        return result
    },
    renameCode(text, renames) { //copied code's identifiers and helper names, never its comments or strings
        const changes = []
        try {
            for (const token of levelParser().tokenizer(text, { ecmaVersion: "latest" })) {
                if (token.type.label !== "name") continue
                for (const [from, to] of renames) {
                    if (token.value !== from && !(token.value.startsWith(from) && /^[A-Z]/.test(token.value.slice(from.length)))) continue
                    changes.push({ start: token.start, end: token.end, text: to + token.value.slice(from.length) })
                    break
                }
            }
        } catch (error) { return text } //keep invalid drafts intact for the compiler's error message
        for (const change of changes.reverse()) text = text.slice(0, change.start) + change.text + text.slice(change.end)
        return text
    },
    analysisText(text) {
        const sections = levelData.sectionsOf(text)
        return `${sections.setup.join("\n")}\n;(${levelData.layersCode(sections)});`
    },

    functionName(name) { //my-level to myLevel
        return name.replace(/[-_]+(\w)/g, (match, letter) => letter.toUpperCase()).replace(/\W/g, "")
    },
    exportLines(el, name, context) { //one element's generated lines as { text, owner, part }, owner is the element when the lines are its own code, so typing in them edits it, see splitCode()
        const type = levelElements.types[el.type]
        const lines = levelData.typeCode(el, name, context)
        const owner = levelElements.isCodeEditable(el) ? el.id : undefined
        const tag = (list, part) => (list || []).filter(text => text.trim() !== levelData.zones.setup).map(text => ({ text, owner, part, anchor: el.id }))
        const link = type.isLinkable && !type.handlesLink && context.link(el)
        const gate = (list, part) => { //the link's if comes from its settings, the lines inside it are the element's
            if (!link || !list || !list.length) return tag(list, part)
            return [{ text: `if (${link.on}) {`, part, anchor: el.id }, ...levelData.indentLines(tag(list, part)), { text: "}", part, anchor: el.id }]
        }
        const delay = el.delay > 0 && (el.link || el.orLink) ? [{ text: `const ${name}Delay = level.delay(${levelElements.args(el.delay)}); //follows its link ${levelElements.args(el.delay)} cycles late`, part: "setup", anchor: el.id }] : []
        return { setup: [...delay, ...tag(lines.setup, "setup")], custom: gate(lines.custom, "custom"), top: gate(lines.top, "top") }
    },
    exportElement(el, name, context) { //one element's generated lines, including its control links
        const lines = levelData.exportLines(el, name, context)
        const text = list => list.map(line => line.text)
        return { setup: text(lines.setup), custom: text(lines.custom), top: text(lines.top) }
    },
    indentLines: list => list.map(line => typeof line === "string" ? "    " + line : { ...line, text: "    " + line.text, indent: (line.indent || 0) + 4 }),
    plainLines: (list, part = "setup") => list.map(line => typeof line === "string" ? { text: line, part } : line),
    codeLines(data, isPanel = false, allocation = levelData.codeNames(data), includeEmpty = false) { //the export as { text, owner, part, indent }: owner is the element's id or "level" for lines the player's code can change, part is setup, custom, or top, isPanel is the code panel's view, without the data line and always with //level code
        const blanks = lines => lines.map(line => /^\s+$/.test(line.text) ? { ...line, text: "" } : line)
        const { names, context } = allocation
        return levelData.withTyped(blanks(levelData.programLines(data, names, context, isPanel)), data).filter(line => includeEmpty || !line.empty)
    },
    lineKey(line, i) { //what typed lines remember being under: an element's id, or the start of a line the editor writes, like level.defaultZoom, blank lines don't count
        if (line.anchor !== undefined) return line.anchor
        if (i === 0) return "start"
        return line.text.trim() ? line.text.trim().split(/\s*=\s*|\(/)[0] : null
    },
    withTyped(lines, data) { //lines typed between elements under the line they were typed under, or if it's gone, the end of their part
        const out = lines.map((line, i) => ({ ...line, anchor: levelData.lineKey(line, i) }))
        for (const block of levelData.typedOf(data)) {
            let at = -1
            out.forEach((line, i) => {
                if (line.anchor === block.after && line.part === block.part) at = i
            })
            if (at === -1) { //before the end of the block, or the level code, or the end
                const isEnd = line => block.part === "setup" ? line.anchor === "level-code" || line.text.trim().startsWith(levelData.dataMark.trim()) || line.text === "}," : (line.owner === "level" && line.part === block.part) || line.anchor === `${block.part}-end` //before the level code's, like a run
                at = out.findIndex(isEnd) - 1
                while (out[at] && !out[at].text.trim()) at--
            }
            while (out[at + 1]?.owner === "typed") at++ //after other typed lines there, so they stay in order
            const indent = block.part === "setup" ? 4 : 8
            out.splice(at + 1, 0, ...block.lines.map(text => ({ text: text.trim() ? " ".repeat(indent) + text : "", owner: "typed", part: block.part, indent, anchor: "typed", block })))
        }
        return out
    },
    program(data, names, context) { //ordered, owned sections; consumers only format or instrument these lines
        const setup = []
        const layers = new Map()
        const together = new Set()
        const draws = levelData.codeDraws(data)
        for (const el of levelData.inBuildOrder(data)) {
            const type = levelElements.types[el.type]
            if (!type) { setup.push({ text: "", anchor: el.id, part: "setup" }); continue }
            if (type.isCode) {
                setup.push(...el.code.split("\n").map(text => ({ text, owner: el.id, anchor: el.id, part: "setup" })))
            } else if (levelData.isTogether(el)) {
                const lines = together.has(type) ? [] : type.codeAll(data.elements.filter(other => other.type === el.type && levelData.isTogether(other)), data)
                setup.push(...(lines.length ? lines : [""]).map(text => ({ text, anchor: el.id, part: "setup" })))
                together.add(type)
            } else if (type.code) {
                const out = levelData.exportLines(el, names.get(el.id), context)
                setup.push(...(out.setup.length ? out.setup : [{ text: "", anchor: el.id, part: "setup" }]))
                if (!draws[el.type]) layers.set(el.id, out)
            }
        }
        const layer = part => data.elements.flatMap(el => {
            const lines = layers.get(el.id)?.[part]
            return lines?.length ? lines : [{ text: "", anchor: el.id, part, empty: true }]
        })
        return { setup, custom: layer("custom"), top: layer("top") }
    },
    programLines(data, names, context, isPanel) {
        const program = levelData.program(data, names, context)
        const levelLines = levelData.levelCodeLines(data, isPanel)
        const indent = levelData.indentLines
        const text = levelData.constraintText(data)
        const name = levelData.functionName(data.name)
        const system = lines => lines.map(text => ({ text, part: "setup", system: true }))
        const hasCode = levelData.hasCode(data)
        return levelData.plainLines([
            `${name}() { //made in the level editor, paste it into level.maps in js/level.js and add "${name}" to level.playableLevels`,
            ...indent(levelData.plainLines([
                ...system(levelData.exportAnnouncements(data)),
                ...program.setup,
                ...levelData.plainLines([
                    "//level properties from the level editor",
                    `level.defaultZoom = ${data.zoom}`,
                    { text: "simulation.zoomTransition(level.defaultZoom)", part: "setup", system: true },
                    `document.body.style.backgroundColor = ${JSON.stringify(data.background)};`,
                    ...(hasCode || data.mapColor !== "#444" ? [`color.map = ${JSON.stringify(data.mapColor)};`] : []),
                    ...(hasCode || data.blockColor !== levelElements.level.defaults().blockColor ? [`color.block = ${JSON.stringify(data.blockColor)};`] : []),
                    ...(data.gravity !== 1 ? [`simulation.g = simulation.gDefault * ${levelElements.args(data.gravity)}`] : []),
                    ...(data.fall === "sky" ? [`level.fallMode = "start";`] : []),
                    ...system(data.lineOfSight ? ["simulation.draw.drawMapPath = simulation.draw.drawMapSightLevel //line of sight"] : []), //local play gets it from applySettings(), which keeps it off while editing
                    `simulation.fallHeight = ${levelData.fallHeight(data)}`,
                    ...system(levelData.codeHas(data, "announceText") ? [] : [`level.announceText(${levelElements.args(text.x, text.y)}, true)`, "level.announceMobTypes()"]),
                    ...system(levelData.addsResearch(data) ? ["powerUps.addResearchToLevel() //needs to run after mobs are spawned"] : []),
                ]),
                ...(hasCode ? ["const customFromCode = level.custom", "const customTopLayerFromCode = level.customTopLayer"] : []),
                { text: "level.custom = () => {", part: "custom", anchor: "custom-start" },
                ...indent(levelData.plainLines([...(hasCode ? ["customFromCode();"] : []), ...program.custom, ...levelLines.custom], "custom")),
                { text: "};", part: "setup", anchor: "custom-end" },
                { text: "level.customTopLayer = () => {", part: "top", anchor: "top-start" },
                ...indent(levelData.plainLines([...(hasCode ? ["customTopLayerFromCode();"] : []), ...program.top, ...levelLines.top], "top")),
                { text: "};", part: "setup", anchor: "top-end" },
                { text: "", part: "setup", anchor: "finish" },
                ...levelLines.setup,
                ...levelData.dataLine(data, isPanel),
            ])),
            "},",
        ])
    },
    dataLine(data, isPanel) { //import level reads it back
        return isPanel ? [] : [`${levelData.dataMark}${JSON.stringify(data).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")}`]
    },
    exportAnnouncements(data) {
        return [
            ...(data.author.trim() ? [`simulation.inGameConsole(\`${levelData.authorLog(data).replace(/[`\\]|\$\{/g, c => "\\" + c)}\`);`] : []),
            ...(data.log.trim() ? [`simulation.inGameConsole(${levelElements.args(levelData.safeHtml(data.log))});`] : []),
        ]
    },
    levelCodeLines(data, isPanel) { //last in the level's one function, so it shares every variable, see runCode(), its every cycle parts go in level.custom and level.customTopLayer after the elements'
        const hasCode = !!data.levelCode.trim()
        const { setup, custom, top } = levelData.sectionsOf(data.levelCode)
        const tag = (list, part) => (hasCode ? list : []).filter(text => text.trim() !== levelData.zones.setup).map(text => ({ text, owner: "level", part }))
        return { setup: [...(hasCode || isPanel ? ["", { text: "//level code", part: "setup", anchor: "level-code" }] : []), ...tag(setup, "setup")], custom: tag(custom, "custom"), top: tag(top, "top") }
    },
});
