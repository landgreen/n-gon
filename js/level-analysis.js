"use strict";
//checks a local level against the standard levels, the analysis button in the level editor's export menu
//  levelAnalysis.run(data, { isLive }) returns { sections: [{ title, lines: [{ status, label, value, text }] }] }
//  status is "fix", "warn", "note", or "ok", isLive adds what the editor measures while the level runs, hidden is the elements the explorer hides
//add a check with levelAnalysis.check(section, context => lines), see docs/level-editor.md
const levelAnalysis = {
    //from the 22 playable levels in js/level.js (labs through refinery), run in headless Chrome at levelsCleared 5
    norms: {
        mobPlaces: 13, //spawn.randomMobFromArray() spawns up to 13 mobs by the end of a run, standard levels have 6 to 38 spots, most about 17
        groups: 5, //standard levels have 0 to 5 random groups, a note past double
        healAmmo: [2, 12], //heal and ammo power ups, random power ups plus 15% of debris
        debris: 40, //standard levels scatter about 16
        zoom: [1000, 3000], //standard levels use 1300 to 2600
        size: [21000, 9000], //the widest and tallest standard levels, a note past double
        near: { mob: 450, boss: 1400, secondaryBoss: 1400, startingPowerUps: 500, exit: 450 }, //the closest a standard level puts each to the spawn, a 2nd boss is as dangerous as the boss, so the same, one modular level has its 2nd boss about 700 away
        bossApart: 400, //the closest a standard level puts its 2 bosses
        farGap: 3000, //an empty gap this wide splits off the far side, standard levels have none
        tinyArea: 100, //map pieces and blocks smaller than 10 × 10, usually a misclick while drawing
        map: [100, 200], //map pieces, standard levels have up to 82, the community levels that lag have 300 to 900
        mapVertices: 1500, //refinery has the most, 1251, from its round shapes
        blocks: [50, 100], //blocks and debris, standard levels have up to 38, ace has 236
        blockVertices: 400, //blocks with many vertices collide slowly
        most: { boost: 7, mover: 12, elevator: 3, vanish: 16, spinner: 12, wind: 8, slime: 3, laser: 12, fill: 32 }, //the most in one standard level, a note past double, wind costs about 30 µs a frame each, 10 times the others, elements a frame catches too many
        drawingParts: [1500, 4000], //about how many shapes the draw list's elements draw a frame, each costs little, so a level has to pile them up
        frameMs: [0.35, 0.5], //elements' custom and top layers, standard levels take under 0.31 ms a frame
        bodies: 250, //physics bodies the elements make, standard levels have up to 122 with their mobs
        powerUpPile: [150, 12], //power ups within this distance of one spot, and how many before they lag, they overlap and push apart every frame
    },
    debrisPowerUp: 0.15, //chance each debris is a heal or ammo, see spawn.debris()
    checks: [],
    check(section, run) {
        levelAnalysis.checks.push({ section, run })
    },
    run(data, options = {}) {
        const context = levelAnalysis.context(data, options)
        const sections = []
        for (const { section, run } of levelAnalysis.checks) {
            let lines
            try {
                lines = run(context) || []
            } catch (error) { //a broken check shouldn't hide the others
                lines = [levelAnalysis.line("note", "check failed", "", String(error.message || error))]
            }
            let found = sections.find(s => s.title === section)
            if (!found) sections.push(found = { title: section, lines: [] })
            found.lines.push(...lines)
        }
        return { name: data.name, sections }
    },
    context(data, options) {
        const byType = {}
        for (const el of data.elements) (byType[el.type] = byType[el.type] || []).push(el)
        const of = type => byType[type] || []
        const spawn = of("spawn")[0]
        const exit = of("exit")[0]
        const ground = of("map").slice()
        if (spawn && spawn.bump) ground.push({ type: "map", x: spawn.x - 50, y: spawn.y + 40, width: 100, height: 20 }) //the bumps the doors stand on
        if (exit && exit.bump) ground.push({ type: "map", x: exit.x, y: exit.y + 20, width: 100, height: 20 })
        const code = levelData.codeText(data) //code elements and the level code
        return { data, of, spawn, exit, ground, code, inCode: text => code.includes(text), norms: levelAnalysis.norms, live: options.isLive ? levelAnalysis.live(data) : null, hidden: options.hidden || [] }
    },
    live(data) { //what each element made and what its custom and top layers cost a frame, from levelData's runtimes
        const elements = data.elements.map(el => {
            const runtime = levelData.runtimes.get(el.id)
            if (!runtime) return { el, ms: 0, bodies: 0, constraints: 0 }
            return {
                el,
                error: runtime.error || null, //building it, or its custom or top layer, threw
                ms: (runtime.customMs || 0) + (runtime.topMs || 0),
                bodies: (runtime.maps || []).length + (runtime.bodies || []).length + (runtime.composite || []).length,
                constraints: (runtime.cons || []).length + (runtime.consBB || []).length + (runtime.constraints || []).length,
            }
        })
        return { elements, ms: elements.reduce((sum, e) => sum + e.ms, 0), bodies: elements.reduce((sum, e) => sum + e.bodies, 0), codeError: levelData.codeError || null }
    },

    //*********************************************************************
    // helpers for checks
    //*********************************************************************
    line(status, label, value = "", text = "", elements = [], add = "") { //elements are the ones it's about, the editor outlines them in the level, add is a type whose add fixes it, the editor adds one when it's clicked
        return { status, label, value: String(value), text, ids: elements.map(el => el.id).filter(id => id !== undefined), add }
    },
    at: (x, y) => `(${Math.round(x)}, ${Math.round(y)})`,
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    inMap(context, point) { //at least 5 deep, so something resting on a surface isn't in it
        return context.ground.some(el => [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]].every(([dx, dy]) => levelElements.contains(el, { x: point.x + dx, y: point.y + dy })))
    },
    isGroundBelow(context, point) { //a map piece's outline crosses the line straight down from the point, its bounds alone reach under points a slope doesn't
        return context.ground.some(el => {
            const b = levelElements.bounds(el)
            if (point.x < b.x || point.x > b.x + b.width || b.y + b.height <= point.y) return false
            const points = levelElements.points(el)
            for (let i = 0; i < points.length; i++) {
                const p = points[i]
                const q = points[(i + 1) % points.length]
                if ((p.x - point.x) * (q.x - point.x) > 0) continue //this edge is all on one side
                const y = p.x === q.x ? Math.max(p.y, q.y) : p.y + (q.y - p.y) * (point.x - p.x) / (q.x - p.x)
                if (y > point.y) return true
            }
            return false
        })
    },
    far(context) { //elements past an empty gap from the entrance's part of the level, on either axis, with how far and which way
        const boxes = context.data.elements.filter(el => !levelElements.isCode(el)).map(el => ({ el, b: levelElements.bounds(el) }))
        const found = new Map()
        for (const [lo, size] of [["x", "width"], ["y", "height"]]) {
            const sorted = boxes.slice().sort((a, b) => a.b[lo] - b.b[lo])
            const clusters = [] //runs of boxes with no gap wider than farGap between them
            for (const box of sorted) {
                const last = clusters[clusters.length - 1]
                if (last && box.b[lo] <= last.hi + context.norms.farGap) {
                    last.boxes.push(box)
                    last.hi = Math.max(last.hi, box.b[lo] + box.b[size])
                } else clusters.push({ lo: box.b[lo], hi: box.b[lo] + box.b[size], boxes: [box] })
            }
            const main = clusters.find(cluster => cluster.boxes.some(box => box.el === context.spawn))
            if (!main) continue
            for (const cluster of clusters) {
                if (cluster === main) continue
                const isAfter = cluster.lo > main.hi
                for (const box of cluster.boxes) {
                    if (found.has(box.el)) continue
                    const gap = isAfter ? box.b[lo] - main.hi : main.lo - (box.b[lo] + box.b[size])
                    found.set(box.el, { gap, isBelow: lo === "y" && isAfter })
                }
            }
        }
        return found
    },
    powerUpPile(context) { //find one pile to warn about, with the elements in it
        const [reach, most] = context.norms.powerUpPile
        const cellSize = reach / 2 //everyone in the same cell is within reach of each other
        const cells = new Map()
        const key = (i, j) => `${i},${j}`
        let crowded
        let total = 0
        const add = (x, y, el) => {
            if (!Number.isFinite(x) || !Number.isFinite(y)) return
            const i = Math.floor(x / cellSize)
            const j = Math.floor(y / cellSize)
            const k = key(i, j)
            if (!cells.has(k)) cells.set(k, [])
            const cell = cells.get(k)
            cell.push({ x, y, i, j, el })
            if (!crowded && cell.length > most) crowded = cell[0]
            total++
        }
        for (const el of context.of("powerUp")) {
            const count = Math.min(el.count, levelElements.maxPowerUpCount)
            for (let i = 0; i < count; i++) add(el.x + 25 * i, el.y, el) //match powerUp.build()
        }
        for (const el of context.of("randomPowerUp").concat(context.of("startingPowerUps"))) add(el.x, el.y, el)
        if (total <= most) return null

        const reachSquared = reach * reach
        const pileAt = p => {
            const near = []
            for (let di = -2; di <= 2; di++) {
                for (let dj = -2; dj <= 2; dj++) {
                    const cell = cells.get(key(p.i + di, p.j + dj))
                    if (!cell) continue
                    for (const q of cell) if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 <= reachSquared) near.push(q.el)
                }
            }
            return near.length > most ? { count: near.length, x: p.x, y: p.y, elements: [...new Set(near)] } : null
        }
        if (crowded) return pileAt(crowded) //one scan of a dense pile instead of comparing all its pairs
        for (const cell of cells.values()) {
            for (const point of cell) {
                const pile = pileAt(point)
                if (pile) return pile
            }
        }
        return null
    },
    area(points) { //of an outline, shoelace
        let sum = 0
        for (let i = 0; i < points.length; i++) {
            const p = points[i]
            const q = points[(i + 1) % points.length]
            sum += p.x * q.y - q.x * p.y
        }
        return Math.abs(sum) / 2
    },
    overlap(a, b) { //how deep two convex outlines overlap, 0 if they don't
        let depth = Infinity
        for (const shape of [a, b]) {
            for (let i = 0; i < shape.length; i++) {
                const p = shape[i]
                const q = shape[(i + 1) % shape.length]
                const length = Math.hypot(q.x - p.x, q.y - p.y) || 1
                const nx = (q.y - p.y) / length
                const ny = (p.x - q.x) / length
                const range = points => {
                    let min = Infinity, max = -Infinity
                    for (const v of points) {
                        const d = v.x * nx + v.y * ny
                        if (d < min) min = d
                        if (d > max) max = d
                    }
                    return [min, max]
                }
                const [aMin, aMax] = range(a)
                const [bMin, bMax] = range(b)
                depth = Math.min(depth, Math.min(aMax, bMax) - Math.max(aMin, bMin))
                if (depth <= 0) return 0
            }
        }
        return depth
    },
    overlapping(list, others, isSame) { //pairs that overlap more than 2 deep, bounds first so big levels stay fast
        const shapes = others.map(el => ({ el, b: levelElements.bounds(el), points: levelElements.points(el) }))
        const found = []
        for (const el of list) {
            const b = levelElements.bounds(el)
            const points = levelElements.points(el)
            const hit = shapes.find(s => s.el !== el && (!isSame || s.el.id > el.id) &&
                b.x < s.b.x + s.b.width && b.x + b.width > s.b.x && b.y < s.b.y + s.b.height && b.y + b.height > s.b.y &&
                levelAnalysis.overlap(points, s.points) > 2)
            if (hit) found.push(el)
        }
        return found
    },
    rgb(color) { //[r, g, b, a] from #rgb, #rrggbb, rgb(), or rgba(), named colors only work in the browser
        let text = String(color).trim()
        if (typeof document !== "undefined" && !text.startsWith("#") && !text.startsWith("rgb")) {
            const context = levelAnalysis.colorContext || (levelAnalysis.colorContext = document.createElement("canvas").getContext("2d"))
            context.fillStyle = "#000"
            context.fillStyle = text
            text = context.fillStyle
        }
        if (/^#[0-9a-f]{3}$/i.test(text)) return [...text.slice(1)].map(c => parseInt(c + c, 16)).concat(1)
        if (/^#[0-9a-f]{6}$/i.test(text)) return [1, 3, 5].map(i => parseInt(text.slice(i, i + 2), 16)).concat(1)
        const numbers = text.startsWith("rgb") ? text.match(/[\d.]+/g) : null
        if (numbers && numbers.length >= 3) return [Number(numbers[0]), Number(numbers[1]), Number(numbers[2]), numbers[3] === undefined ? 1 : Number(numbers[3])]
        return null
    },
    contrast(color, background) { //WCAG contrast ratio, 1 is the same color, 21 is black on white, see-through colors are mixed with the background first
        const back = levelAnalysis.rgb(background)
        const front = levelAnalysis.rgb(color)
        if (!back || !front) return null
        const mixed = front.slice(0, 3).map((c, i) => c * front[3] + back[i] * (1 - front[3]))
        const luminance = rgb => {
            const [r, g, b] = rgb.map(c => {
                c /= 255
                return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
            })
            return 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        const [light, dark] = [luminance(mixed), luminance(back.slice(0, 3))].sort((a, b) => b - a)
        return (light + 0.05) / (dark + 0.05)
    },

    //*********************************************************************
    // output, html for the editor's code panel, text for copying
    //*********************************************************************
    counts(report) {
        const counts = { fix: 0, warn: 0, note: 0, ok: 0 }
        for (const section of report.sections) for (const line of section.lines) counts[line.status]++
        return counts
    },
    headline(report) {
        const counts = levelAnalysis.counts(report)
        const parts = [counts.fix && `${counts.fix} to fix`, counts.warn && `${counts.warn} warning${counts.warn > 1 ? "s" : ""}`, counts.note && `${counts.note} note${counts.note > 1 ? "s" : ""}`].filter(Boolean)
        if (!counts.fix && !counts.warn) parts.unshift("ready to play")
        return parts.join(", ")
    },
    text(report) {
        const all = report.sections.flatMap(section => section.lines)
        const width = key => Math.max(0, ...all.map(line => line[key].length)) + 2 //columns line up like the html
        const lines = [`//${report.name} issues: ${levelAnalysis.headline(report)}`]
        for (const section of report.sections) {
            lines.push("", `//${section.title}`)
            for (const line of section.lines) lines.push(`${line.status.padEnd(5)}${line.label.padEnd(width("label"))}${line.value.padEnd(width("value"))}${line.text}`.trimEnd())
        }
        return lines.join("\n")
    },
    html(report) {
        const escape = text => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        return `<div class="le-report-head">${escape(levelAnalysis.headline(report))}</div>` + report.sections.map(section =>
            `<div class="le-report-section">//${escape(section.title)}</div>` + section.lines.map(line =>
                `<div class="le-report-line le-${line.status}"><span>${line.status}</span><span>${escape(line.label)}</span><span>${escape(line.value)}</span><span>${escape(line.text)}</span></div>`
            ).join("")
        ).join("")
    },
}

//*********************************************************************
// checks, in the order they're shown
//*********************************************************************
levelAnalysis.check("errors", c => { //javascript that throws while the level runs, only known in the editor, the level isn't ready until it's fixed
    if (!c.live) return []
    const lines = c.live.elements.filter(e => e.error && !levelElements.isCode(e.el)).map(e => levelAnalysis.line("fix", levelElements.nameOf(e.el.type), "error", String(e.error.message || e.error), [e.el]))
    const codeElements = c.live.elements.filter(e => e.error && levelElements.isCode(e.el))
    const codeError = c.live.codeError || codeElements[0]?.error
    if (codeError) lines.push(levelAnalysis.line("fix", "code", "error", String(codeError.message || codeError), codeElements.map(e => e.el)))
    return lines
})

levelAnalysis.check("bosses", c => {
    const { line, at, distance } = levelAnalysis
    const lines = []
    const spotsOf = {} //each boss type's spots, with the element each is on
    const bossCalls = (c.code.match(/spawn\.\w*Boss\s*\(/g) || []).length //spawn.randomLevelBoss( or a named one like spawn.mantisBoss(, not secondaryBossChance(
    const inCode = { boss: bossCalls > 0, secondaryBoss: c.inCode("secondaryBossChance") || bossCalls > (c.of("boss").length ? 0 : 1) }
    for (const [type, label] of [["boss", "boss"], ["secondaryBoss", "2nd boss"]]) {
        const list = c.of(type)
        if (!list.length) {
            if (inCode[type]) lines.push(line("ok", label, "in code"))
            else lines.push(line("fix", label, 0, type === "boss" ? "add a boss" : "add a 2nd boss", [], type))
            continue
        }
        spotsOf[type] = list.flatMap(el => levelElements.types[type].places(el).map(([x, y]) => ({ x, y, el })))
        const places = spotsOf[type]
        lines.push(list.length > 1 ?
            line("warn", label, list.length, "standard levels have 1, give it more spots instead", list) :
            line("ok", label, 1, places.length > 1 ? `${places.length} spots` : ""))
        const placesOf = el => levelElements.types[type].places(el).map(([x, y]) => ({ x, y }))
        if (c.spawn) {
            const near = places.filter(p => distance(p, c.spawn) < c.norms.near[type])
            if (near.length) lines.push(line("warn", `${label} near entrance`, `${Math.round(distance(near[0], c.spawn))} away`, `at ${at(near[0].x, near[0].y)}, standard levels keep it ${c.norms.near[type]}+ from the entrance`, list.filter(el => placesOf(el).some(p => distance(p, c.spawn) < c.norms.near[type]))))
        }
        const stuck = places.filter(p => levelAnalysis.inMap(c, p))
        if (stuck.length) lines.push(line("warn", `${label} in the map`, stuck.length, `at ${at(stuck[0].x, stuck[0].y)}`, list.filter(el => placesOf(el).some(p => levelAnalysis.inMap(c, p)))))
    }
    if (spotsOf.boss && spotsOf.secondaryBoss) { //the closest pair of spots, either one could be picked
        let closest = null
        for (const a of spotsOf.boss) for (const b of spotsOf.secondaryBoss) if (!closest || distance(a, b) < distance(closest[0], closest[1])) closest = [a, b]
        const d = distance(closest[0], closest[1])
        if (d < c.norms.bossApart) lines.push(line("note", "bosses together", `${Math.round(d)} apart`, `at ${at(closest[0].x, closest[0].y)}, standard levels keep them ${c.norms.bossApart}+ apart`, [closest[0].el, closest[1].el]))
    }
    return lines
})

levelAnalysis.check("mobs", c => {
    const { line, at, distance } = levelAnalysis
    const lines = []
    const spots = c.of("mobSpot")
    const singles = c.of("mob").concat(c.of("smallMobs"))
    const places = spots.length + singles.length
    if (!places && (c.inCode("randomMobPositions") || c.inCode("randomMob("))) {
        lines.push(line("ok", "mob places", "in code"))
    } else if (!places) {
        lines.push(line("fix", "mob places", 0, "add some with mob in add mobs", [], "mobSpot"))
    } else if (places < c.norms.mobPlaces) {
        lines.push(line("warn", "mob places", places, `up to ${c.norms.mobPlaces} mobs spawn late in a run, standard levels have about 17 spots`, [], "mobSpot"))
    } else {
        lines.push(line("ok", "mob places", places))
    }
    if (singles.length && !spots.length) lines.push(line("note", "random mobs", singles.length, "standard levels use spots, each level picks how many mobs to spawn from them"))
    const groups = c.of("mobGroup").length
    if (groups > 2 * c.norms.groups) lines.push(line("note", "groups", groups, `standard levels have up to ${c.norms.groups}`))
    else lines.push(line("ok", "groups", groups))
    const all = spots.concat(singles, c.of("mobGroup"), c.of("namedMob"))
    const near = c.spawn ? all.filter(el => distance(el, c.spawn) < c.norms.near.mob).sort((a, b) => distance(a, c.spawn) - distance(b, c.spawn)) : [] //closest first
    if (near.length) lines.push(line("warn", near.length > 1 ? "mobs near entrance" : "mob near entrance", `${Math.round(distance(near[0], c.spawn))} away`, `at ${at(near[0].x, near[0].y)}${near.length > 1 ? ` and ${near.length - 1} more` : ""}, standard levels keep mobs ${c.norms.near.mob}+ from the entrance`, near))
    const stuck = all.filter(el => levelAnalysis.inMap(c, el))
    if (stuck.length) lines.push(line("warn", "mobs in the map", stuck.length, `at ${at(stuck[0].x, stuck[0].y)}`, stuck))
    return lines
})

levelAnalysis.check("power ups", c => {
    const { line, at, distance } = levelAnalysis
    const lines = []
    const starting = c.of("startingPowerUps")
    if (!starting.length && c.inCode("spawnStartingPowerUps")) lines.push(line("ok", "starting", "in code"))
    else if (!starting.length) lines.push(line("warn", "starting", 0, "add one, it gives a gun or tech early in a run", [], "startingPowerUps"))
    else if (starting.length > 1) lines.push(line("warn", "starting", starting.length, "standard levels have 1", starting))
    else lines.push(line("ok", "starting", 1))
    const nearEnter = c.spawn ? starting.filter(el => distance(el, c.spawn) < c.norms.near.startingPowerUps) : []
    if (nearEnter.length) { //a gun or field right at the start is no search at all
        lines.push(line("warn", "starting near entrance", `${Math.round(distance(nearEnter[0], c.spawn))} away`, `at ${at(nearEnter[0].x, nearEnter[0].y)}, it's best deeper in the level, so the player has to search a little for the gun or tech, standard levels keep it ${c.norms.near.startingPowerUps}+ from the entrance`, nearEnter))
    }
    const placed = name => c.of("powerUp").filter(el => el.name === name).reduce((sum, el) => sum + el.count, 0)
    const debris = c.of("debris").reduce((sum, el) => sum + el.count, 0)
    const healAmmo = c.of("randomPowerUp").length + placed("heal") + placed("ammo") + levelAnalysis.debrisPowerUp * debris
    const [few, many] = c.norms.healAmmo
    const value = `~${Number(healAmmo.toFixed(1))}`
    if (healAmmo < few) lines.push(line("warn", "heal and ammo", value, `levels should have ${few} to ${many}`, [], "randomPowerUp"))
    else if (healAmmo > many) lines.push(line("warn", "heal and ammo", value, `levels should have ${few} to ${many}`))
    else lines.push(line("ok", "heal and ammo", value))
    const free = ["tech", "gun", "field"].filter(name => placed(name))
    if (free.length) lines.push(line("warn", "free " + free.join(" "), free.reduce((sum, name) => sum + placed(name), 0), "standard levels give these from the boss and the starting power up", c.of("powerUp").filter(el => free.includes(el.name))))
    if (placed("research")) lines.push(line("note", "research", placed("research"), "levels with mobs already get 1 on a random mob"))
    if (debris > c.norms.debris) lines.push(line("warn", "debris", debris, "many levels scatter about 16"))
    else lines.push(line(debris ? "ok" : "note", "debris", debris, debris ? "" : "many levels scatter about 16", [], debris ? "" : "debris"))
    const drops = c.of("powerUp").concat(c.of("randomPowerUp"), starting, c.of("debris").map(el => ({ ...el, x: el.x + el.width / 2 })))
    const stuck = drops.filter(el => levelAnalysis.inMap(c, el))
    if (stuck.length) lines.push(line("warn", "power ups in map", stuck.length, `at ${at(stuck[0].x, stuck[0].y)}`, stuck))
    const falling = drops.filter(el => !levelAnalysis.isGroundBelow(c, el))
    if (falling.length) lines.push(line("warn", "nothing below", falling.length, `power ups at ${at(falling[0].x, falling[0].y)} fall out of the level`, falling))
    return lines
})

levelAnalysis.check("layout", c => {
    const { line, at, distance } = levelAnalysis
    const lines = []
    const maps = c.of("map")
    if (c.code.trim()) lines.push(line("note", "code", c.of("code").length + (c.data.levelCode.trim() ? 1 : 0), "these checks can't see what it makes"))
    if (!maps.length) return lines.concat(c.code.trim() ? [] : [line("fix", "map", 0, "draw some ground", [], "map")])
    if (c.spawn) {
        if (levelAnalysis.inMap(c, c.spawn)) lines.push(line("fix", "entrance in the map", "", `at ${at(c.spawn.x, c.spawn.y)}`, [c.spawn]))
        else if (!levelAnalysis.isGroundBelow(c, c.spawn)) lines.push(line("warn", "entrance", "", "nothing below it", [c.spawn]))
    }
    if (c.exit) {
        const door = { x: c.exit.x + 50, y: c.exit.y - 50 }
        if (levelAnalysis.inMap(c, door)) lines.push(line("fix", "exit in the map", "", `at ${at(c.exit.x, c.exit.y)}`, [c.exit]))
        else if (!levelAnalysis.isGroundBelow(c, door)) lines.push(line("warn", "exit", "", "nothing below it", [c.exit]))
        if (c.spawn && distance(door, c.spawn) < c.norms.near.exit) lines.push(line("note", "exit near entrance", `${Math.round(distance(door, c.spawn))} away`, "", [c.exit]))
    }
    const b = levelElements.boundsOf(maps.flatMap(el => levelElements.points(el)))
    const [wide, tall] = c.norms.size
    const size = `${Math.round(b.width)} × ${Math.round(b.height)}`
    if (b.width > 2 * wide || b.height > 2 * tall) lines.push(line("note", "size", size, `standard levels are up to ${wide} × ${tall}`))
    else lines.push(line("ok", "size", size))
    const blocks = c.of("block")
    const inMap = levelAnalysis.overlapping(blocks, maps)
    if (inMap.length) lines.push(line("warn", "blocks in the map", inMap.length, `${levelElements.summary(inMap[0])}, shoved out on level load`, inMap))
    const inBlocks = levelAnalysis.overlapping(blocks, blocks, true)
    if (inBlocks.length) lines.push(line("note", "blocks overlap", inBlocks.length, levelElements.summary(inBlocks[0]), inBlocks))
    const seen = new Set()
    const stacked = c.data.elements.filter(el => { //the same thing in the same place, usually a double paste
        const { id, ...rest } = el
        const key = JSON.stringify(rest)
        if (seen.has(key)) return true
        seen.add(key)
        return false
    })
    if (stacked.length) lines.push(line("warn", "stacked copies", stacked.length, `${levelElements.summary(stacked[0])}, delete the extras`, stacked))
    const isSource = id => c.data.elements.some(el => el.id === id && levelElements.isLinkSource(el))
    const shut = c.of("door").filter(el => !isSource(el.link))
    if (shut.length) lines.push(line("note", "doors", shut.length, `${levelElements.summary(shut[0])} has no button or toggle, it stays shut`, shut))
    const loose = c.of("constraint").filter(el => !c.of("block").some(block => block.id === el.body))
    if (loose.length) lines.push(line("warn", "constraints", loose.length, `${levelElements.summary(loose[0])} has no block`, loose))
    const tiny = maps.concat(blocks).filter(el => levelAnalysis.area(levelElements.points(el)) < c.norms.tinyArea)
    if (tiny.length) lines.push(line("warn", "tiny shapes", tiny.length, `${levelElements.summary(tiny[0])}, almost no area, usually a misclick`, tiny))
    if (c.spawn) {
        const far = levelAnalysis.far(c)
        if (far.size) {
            const [el, { gap }] = [...far].sort((a, b) => b[1].gap - a[1].gap)[0] //the farthest
            const isBelow = [...far.values()].some(f => f.isBelow)
            lines.push(line("warn", "far from the level", far.size, `${levelElements.summary(el)}, ${Math.round(gap)} past the rest${isBelow ? ", below the level it moves the fall line down, so falling takes longer" : ""}`, [...far.keys()]))
        }
    }
    if (c.hidden.length) lines.push(line("note", "hidden", c.hidden.length, "hidden in the editor, they're still in the level and its export", c.hidden))
    return lines
})

levelAnalysis.check("elements", c => {
    const { line, at } = levelAnalysis
    const lines = []
    const keyColors = new Set(c.of("key").map(el => el.color))
    const holeColors = new Set(c.of("keyhole").map(el => el.color))
    const noKey = c.of("keyhole").filter(el => !keyColors.has(el.color))
    if (noKey.length && !c.inCode("level.key(")) lines.push(line("warn", "keyhole", noKey.length, `no ${noKey[0].color} key fits it`, noKey))
    const noHole = c.of("key").filter(el => !holeColors.has(el.color))
    if (noHole.length && !c.inCode("level.keyButton(")) lines.push(line("warn", "key", noHole.length, `no ${noHole[0].color} keyhole for it`, noHole))
    const linked = new Set(c.data.elements.flatMap(el => [el.link, el.orLink]).filter(id => id !== null && id !== undefined))
    const idle = c.data.elements.filter(el => levelElements.linkSources.includes(el.type) && !linked.has(el.id) && !String(el.log ?? "").trim() && !el.edited)
    if (idle.length) lines.push(line("note", "does nothing", idle.length, `${levelElements.summary(idle[0])} has nothing linked, no log, and no edited code`, idle))
    const unwired = c.data.elements.filter(el => levelElements.types[el.type]?.isGate && [el.link, el.orLink].filter(Boolean).length < levelElements.gateOf(el).needs)
    if (unwired.length) lines.push(line("note", "gate inputs", unwired.length, `${levelElements.summary(unwired[0])} needs ${levelElements.gateOf(unwired[0]).needs === 1 ? "an input" : "2 inputs"}, link triggers to it`, unwired))
    if (c.spawn) { //the player's middle, head, feet, and sides at the entrance
        const body = [[0, 0], [0, -30], [0, 30], [-20, 0], [20, 0]].map(([dx, dy]) => ({ x: c.spawn.x + dx, y: c.spawn.y + dy }))
        const hazards = c.of("slime").filter(el => el.damage > 0).concat(c.of("laser").filter(el => el.damage > 0), c.of("wind"))
        const hit = hazards.filter(el => body.some(p => levelElements.contains(el, p)))
        if (hit.length) lines.push(line("warn", "hazard at entrance", hit.length, `${levelElements.summary(hit[0])}, at ${at(c.spawn.x, c.spawn.y)}, the player ${hit[0].type === "wind" ? "is pushed" : "is hurt"} before they can move`, hit))
    }
    return lines
})

levelAnalysis.check("settings", c => {
    const { line } = levelAnalysis
    const lines = []
    const [close, far] = c.norms.zoom
    lines.push(c.data.zoom < close || c.data.zoom > far ? line("note", "zoom", c.data.zoom, "standard levels use 1300 to 2600") : line("ok", "zoom", c.data.zoom))
    if (c.data.gravity !== 1) lines.push(line("note", "gravity", `× ${c.data.gravity}`, "standard levels use 1, mobs ignore it"))
    const mapContrast = levelAnalysis.contrast(c.data.mapColor, c.data.background)
    if (mapContrast !== null) {
        lines.push(mapContrast < 1.5 ?
            line("warn", "map color", `${mapContrast.toFixed(1)}:1`, "hard to see on the background") :
            line("ok", "map color", `${mapContrast.toFixed(1)}:1`))
    }
    const blockContrast = levelAnalysis.contrast(c.data.blockColor, c.data.background)
    if (blockContrast !== null && blockContrast < 1.25 && c.of("block").length) lines.push(line("note", "block color", `${blockContrast.toFixed(1)}:1`, "hard to see on the background"))
    const name = String(c.data.name ?? "").trim()
    if (!name || name === "untitled") lines.push(line("note", "name", name || "none", "name it before exporting or adding it to the level pool"))
    if (!String(c.data.author ?? "").trim()) lines.push(line("note", "author", "none", "the level says who made it in the in-game console when it loads"))
    return lines
})

levelAnalysis.check("performance", c => {
    const { line } = levelAnalysis
    const lines = []
    const grade = (value, [some, many]) => value > many ? "warn" : value > some ? "note" : "ok"
    const vertices = list => list.reduce((sum, el) => sum + levelElements.points(el).length, 0)
    const maps = c.of("map")
    const mapStatus = grade(maps.length, c.norms.map)
    lines.push(line(mapStatus, "map pieces", maps.length, mapStatus === "ok" ? "" : `standard levels have up to 82${mapStatus === "warn" ? ", join pieces into bigger ones" : ""}`))
    const mapVertices = vertices(maps)
    if (mapVertices > c.norms.mapVertices) lines.push(line("warn", "map vertices", mapVertices, `standard levels have up to ${c.norms.mapVertices}`))
    const debris = c.of("debris").reduce((sum, el) => sum + el.count, 0)
    const blocks = c.of("block").length + Math.round(debris * (1 - levelAnalysis.debrisPowerUp))
    const blockStatus = grade(blocks, c.norms.blocks)
    lines.push(line(blockStatus, "blocks", blocks, blockStatus === "ok" ? "" : "standard levels have up to 38, with debris"))
    const blockVertices = vertices(c.of("block"))
    if (blockVertices > c.norms.blockVertices) lines.push(line("warn", "block vertices", blockVertices, `blocks with many sides collide slowly, keep it under ${c.norms.blockVertices}`))
    for (const [type, most] of Object.entries(c.norms.most)) {
        const count = c.of(type).length
        if (count > 2 * most) lines.push(line("note", type, count, `standard levels have up to ${most}`))
    }
    const drawings = c.data.elements.filter(el => levelElements.decorations[el.type])
    const costs = {} //each type's total
    for (const el of drawings) costs[el.type] = (costs[el.type] || 0) + (levelElements.decorations[el.type].parts?.(el) ?? 1)
    const parts = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
    const partsStatus = grade(parts, c.norms.drawingParts)
    if (partsStatus !== "ok") {
        const costliest = Object.entries(costs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type).join(", ")
        lines.push(line(partsStatus, "drawings", `${Math.round(parts)} shapes`, `drawn each frame when they're on screen, for looks only, most from ${costliest}, smaller boxes or fewer cost less`, drawings))
    } else if (drawings.length) lines.push(line("ok", "drawings", `${Math.round(parts)} shapes`))
    if (c.live) {
        const [slow, slower] = c.norms.frameMs
        const ms = c.live.ms
        const status = ms > slower ? "warn" : ms > slow ? "note" : "ok"
        const byType = {} //each type's total, many cheap lasers can cost more than one slow element
        for (const e of c.live.elements) byType[e.el.type] = (byType[e.el.type] || 0) + e.ms
        const slowest = Object.entries(byType).filter(([, typeMs]) => typeMs > 0.01).sort((a, b) => b[1] - a[1]).slice(0, 3)
        lines.push(line(status, "elements a frame", `${ms.toFixed(2)} ms`, status === "ok" ? "" : `standard levels take under 0.31 ms, slowest: ${slowest.map(([type, typeMs]) => `${type} ${typeMs.toFixed(2)}`).join(", ")}`))
        if (c.live.bodies > c.norms.bodies) lines.push(line("warn", "physics bodies", c.live.bodies, `standard levels have up to 122, with mobs`))
    }
    const pile = levelAnalysis.powerUpPile(c)
    if (pile) lines.push(line("warn", "piled power ups", pile.count, `around ${levelAnalysis.at(pile.x, pile.y)}, power ups on top of each other push apart every frame, that slows the physics engine and drops the frame rate, spread them out`, pile.elements))
    return lines
})
