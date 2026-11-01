"use strict";
//the kinds of things a local level is made of, used by levelData to build levels and by levelEditor to edit them
//each type is plain data plus a build() that makes it in the world with the same level.* and spawn.* helpers the written levels use
//add a new type with levelElements.define(), see docs/level-editor.md
const levelElements = {
    types: {},
    groups: { core: [], shape: [], element: [], constraint: [], mob: [], powerUp: [], code: [] }, //type names in the order they were defined, element, mob, and powerUp are the editor's add menus
    buildOrder: ["core", "shape", "element", "constraint", "mob", "powerUp", "code"], //mobs and power ups go in after the map they stand on, like in written levels, constraints after what they hold, a level with code builds in its list order instead

    //*********************************************************************
    // properties, shown and edited in the editor's inspector
    //*********************************************************************
    //{ key, kind: "number" | "bool" | "text" | "select" | "mask", step, min, max, options, read(el), write(el, value) }
    //read and write are for values worked out from other values, like a block's mass from its density
    prop: {
        number(key, settings = {}) { return { key, kind: "number", ...settings } },
        bool(key, settings = {}) { return { key, kind: "bool", ...settings } },
        text(key, settings = {}) { return { key, kind: "text", ...settings } },
        color(key, settings = {}) { return { key, kind: "color", ...settings } }, //text with a color picker
        select(key, options, settings = {}) { return { key, kind: "select", options, ...settings } },
        ref(key, types, settings = {}) { return { key, kind: "ref", types, ...settings } }, //another element's id or null, types are the kinds it can be
        mask(key, settings = {}) { return { key, kind: "mask", ...settings } }, //collision categories as names, like "player map body", see levelElements.collision
    },

    //*********************************************************************
    // collision, a map's or block's collisionFilter.mask, saved as category names like "player map body"
    // two bodies collide only if each one's mask has the other's category, so a mask can only take away collisions the other side allows
    //*********************************************************************
    collision: {
        names: ["player", "map", "body", "bullet", "powerUp", "mob", "mobBullet", "mobShield"], //cat.phased is past 32 bits, Matter's masks can't hold it
        category: { map: "map", block: "body" },
        defaults: { //the mask each type gets in level.addToWorld() and spawn.bodyRect()
            map: "player map body bullet powerUp mob mobBullet",
            block: "player map body bullet mob mobBullet",
        },
        others: { //the masks the game usually gives each category, so the editor only lists what collides back, guns and mobs vary
            player: "map body mob mobBullet mobShield",
            map: "player map body bullet powerUp mob mobBullet",
            body: "player map body bullet mob mobBullet",
            bullet: "map body mob mobBullet mobShield",
            powerUp: "map powerUp",
            mob: "player map body bullet mob",
            mobBullet: "player map body bullet",
            mobShield: "bullet",
        },
        has(text, name) { return String(text).split(" ").includes(name) },
        toggle(text, name, isOn) { //canonical order, so the same mask is always the same text
            const on = new Set(String(text).split(" ").filter(Boolean))
            if (isOn) on.add(name)
            else on.delete(name)
            return levelElements.collision.names.filter(n => on.has(n)).join(" ")
        },
        isBack(type, name) { //does name's usual mask have this type's category, static maps never hit each other
            const category = levelElements.collision.category[type]
            if (type === "map" && name === "map") return false
            return levelElements.collision.has(levelElements.collision.others[name], category)
        },
        choices(type) { //the names worth checking for a type, the others never collide with it whatever its mask
            return levelElements.collision.names.filter(name => levelElements.collision.isBack(type, name))
        },
        mask(text) { return String(text).split(" ").filter(Boolean).reduce((mask, name) => mask | cat[name], 0) },
        code(text) { return String(text).split(" ").filter(Boolean).map(name => `cat.${name}`).join(" | ") || "0" },
        isDefault(el) { return el.collides === levelElements.collision.defaults[el.type] },
    },
    linkSources: ["button", "toggle", "keyhole", "zone", "timer"], //turn linked elements on and off, each has linkOn(el, runtime) and linkCode(el, name), see button
    orLinkProp() { return levelElements.prop.ref("orLink", levelElements.linkSources, { isShown: el => el.orLink !== null && el.orLink !== undefined }) }, //a second link, on while either is, set by linking a second button to it, only shown once it's set
    isLinkedTo: (el, source) => el.link === source.id || el.orLink === source.id,
    tidyLinks(el) { //orLink moves up when link goes away, so link is set whenever either is
        if (!el.link && el.orLink) {
            el.link = el.orLink
            el.orLink = null
        }
    },
    refKeys(el) { //the props that hold other elements' ids, like a door's button
        const type = levelElements.types[el.type]
        return type ? type.props.filter(prop => prop.kind === "ref").map(prop => prop.key) : []
    },
    isRefTo(el, key, other) { //can el's ref prop key point at other
        const prop = levelElements.types[el.type]?.props.find(p => p.key === key)
        return !!prop && other.id !== el.id && prop.types.includes(other.type)
    },
    position() {
        return [levelElements.prop.number("x", { isGrid: true }), levelElements.prop.number("y", { isGrid: true })]
    },
    rect() { //a shape with vertices has a width and height too, its bounds, changing them stretches it
        const size = key => levelElements.prop.number(key, {
            isGrid: true,
            min: 1,
            read: el => el.vertices ? Number(levelElements.bounds(el)[key].toFixed(3)) : el[key],
            write(el, value) {
                if (!el.vertices) return el[key] = value
                const box = levelElements.bounds(el)
                box[key] = value
                levelElements.stretch(el, box)
            },
        })
        return [...levelElements.position(), size("width"), size("height")]
    },

    //*********************************************************************
    // geometry, a type can replace any of these, the defaults work for anything with x, y, and maybe width and height
    //*********************************************************************
    bounds(el) { //{ x, y, width, height } in world space, for selecting, hovering, and box select
        const type = levelElements.types[el.type]
        if (type && type.bounds) return type.bounds(el)
        if (el.vertices) return levelElements.boundsOf(levelElements.points(el))
        if (el.width !== undefined) return { x: el.x, y: el.y, width: el.width, height: el.height }
        return { x: el.x - 25, y: el.y - 25, width: 50, height: 50 }
    },
    points(el) { //outline in world space, rect corners or a shape's vertices
        if (el.vertices) return el.vertices.map(v => ({ x: el.x + v[0], y: el.y + v[1] }))
        const b = levelElements.bounds(el)
        return [{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y }, { x: b.x + b.width, y: b.y + b.height }, { x: b.x, y: b.y + b.height }]
    },
    boundsOf(points) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of points) {
            if (p.x < minX) minX = p.x
            if (p.y < minY) minY = p.y
            if (p.x > maxX) maxX = p.x
            if (p.y > maxY) maxY = p.y
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    },
    contains(el, point) {
        const type = levelElements.types[el.type]
        if (type && type.contains) return type.contains(el, point)
        if (el.vertices) return levelElements.isInside(levelElements.points(el), point)
        const b = levelElements.bounds(el)
        return point.x >= b.x && point.x <= b.x + b.width && point.y >= b.y && point.y <= b.y + b.height
    },
    move(el, dx, dy, isWhole = false) { //isWhole moves parts that otherwise stay put, like a boss's other spots when it's copied
        const type = levelElements.types[el.type]
        if (type && type.move) return type.move(el, dx, dy, isWhole)
        el.x += dx
        el.y += dy
    },
    handles(el) { //drag points for resizing, [{ id, x, y }], see levelElements.dragHandle(), shapes with vertices use their bounds
        const type = levelElements.types[el.type]
        if (type && type.handles) return type.handles(el)
        if (el.width === undefined && !el.vertices) return []
        const { x, y, width: w, height: h } = el.vertices ? levelElements.bounds(el) : el
        return [
            { id: "nw", x, y }, { id: "n", x: x + w / 2, y }, { id: "ne", x: x + w, y },
            { id: "e", x: x + w, y: y + h / 2 }, { id: "se", x: x + w, y: y + h }, { id: "s", x: x + w / 2, y: y + h },
            { id: "sw", x, y: y + h }, { id: "w", x, y: y + h / 2 },
        ]
    },
    dragHandle(el, id, point, min) { //move a handle to point, min is the smallest size
        const type = levelElements.types[el.type]
        if (type && type.dragHandle) return type.dragHandle(el, id, point, min)
        if (el.vertices) { //resize its bounds like a rect, then stretch the shape to fit
            const box = levelElements.bounds(el)
            levelElements.dragHandle(box, id, point, min)
            return levelElements.stretch(el, box)
        }
        const right = el.x + el.width
        const bottom = el.y + el.height
        if (id.includes("w")) {
            el.x = Math.min(point.x, right - min)
            el.width = right - el.x
        }
        if (id.includes("e")) el.width = Math.max(min, point.x - el.x)
        if (id.includes("n")) {
            el.y = Math.min(point.y, bottom - min)
            el.height = bottom - el.y
        }
        if (id.includes("s")) el.height = Math.max(min, point.y - el.y)
    },

    //*********************************************************************
    // rotating, the R key, the inspector's rotate buttons, and the editor's rotate handle
    // maps, blocks, and paths turn their outline, a type with rotate(el, degrees, center) turns its own way, like boost's angle
    // anything else only moves around the center, so a selection of many turns together
    //*********************************************************************
    rotatePoint(p, center, degrees) { //clockwise on screen, rounded so a quarter turn keeps a rect a rect
        const a = degrees * Math.PI / 180
        const dx = p.x - center.x
        const dy = p.y - center.y
        const round = n => Math.round(n * 1000) / 1000
        return { x: round(center.x + dx * Math.cos(a) - dy * Math.sin(a)), y: round(center.y + dx * Math.sin(a) + dy * Math.cos(a)) }
    },
    isRotatable(el) {
        const type = levelElements.types[el.type]
        return !!type && (type.group === "shape" || !!type.isVertexEditable || !!type.rotate)
    },
    pivot(el) { //what a single element turns around
        const type = levelElements.types[el.type]
        if (type && type.pivot) return type.pivot(el)
        if (el.vertices) return { x: el.x, y: el.y }
        const b = levelElements.bounds(el)
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
    },
    orbit(el, degrees, center) { //move el so the middle of its bounds turns around center
        const b = levelElements.bounds(el)
        const from = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
        const to = levelElements.rotatePoint(from, center, degrees)
        levelElements.move(el, to.x - from.x, to.y - from.y, true)
    },
    rotate(el, degrees, center = levelElements.pivot(el)) { //clockwise, negative turns counterclockwise
        const type = levelElements.types[el.type]
        if (type && type.rotate) return type.rotate(el, degrees, center)
        if (!levelElements.isRotatable(el)) return levelElements.orbit(el, degrees, center)
        levelElements.setPoints(el, levelElements.points(el).map(p => levelElements.rotatePoint(p, center, degrees)))
    },
    stretch(el, box) { //fit a shape with vertices to a new bounds box
        const from = levelElements.bounds(el)
        const round = n => Math.round(n * 1000) / 1000
        levelElements.setPoints(el, levelElements.points(el).map(p => ({
            x: round(box.x + (p.x - from.x) * box.width / (from.width || 1)),
            y: round(box.y + (p.y - from.y) * box.height / (from.height || 1)),
        })))
    },
    //*********************************************************************
    // presets, common shapes from written levels for the editor's add menu, made as map, or block when the block tool is on
    // points(w, h) is the outline in a w × h box with its top left at 0, 0, rects(w, h) makes several rects instead, like stairs
    //*********************************************************************
    presets: [
        { name: "rounded rect", size: [400, 200], points: (w, h, c = Math.min(50, w / 4, h / 4)) => [[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]] }, //like spawn.bodyRectCorner
        { name: "rounded bottom", size: [150, 400], points: (w, h, c = Math.min(40, w / 4, h / 4)) => [[0, 0], [w, 0], [w, h - c], [w - c, h], [c, h], [0, h - c]] },
        { name: "trapezoid", size: [400, 100], points: (w, h) => [[w / 4, 0], [w * 3 / 4, 0], [w, h], [0, h]] },
        { name: "dome", size: [400, 200], points: (w, h, n = 12) => Array.from({ length: n + 1 }, (_, i) => [w / 2 - w / 2 * Math.cos(Math.PI * i / n), h - h * Math.sin(Math.PI * i / n)]) }, //like the half circles in written levels, turn it for a bowl
        { name: "ramp up right", size: [400, 200], points: (w, h) => [[w, 0], [w, h], [0, h]] },
        { name: "ramp up left", size: [400, 200], points: (w, h) => [[0, 0], [w, h], [0, h]] },
        { name: "pointed ends", size: [600, 150], points: (w, h, c = Math.min(h * 0.75, w / 4)) => [[c, 0], [w - c, 0], [w, h / 2], [w - c, h], [c, h], [0, h / 2]] },
        { name: "circle", size: [300, 300], points: (w, h, n = 16) => Array.from({ length: n }, (_, i) => [w / 2 + w / 2 * Math.cos(2 * Math.PI * i / n), h / 2 + h / 2 * Math.sin(2 * Math.PI * i / n)]) },
        { name: "point up", size: [300, 500], points: (w, h) => [[w / 2, 0], [w, h * 0.15], [w, h], [0, h], [0, h * 0.15]] },
        { name: "diamond", size: [300, 400], points: (w, h) => [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]] },
        { name: "spike", size: [200, 200], points: (w, h) => [[w / 2, 0], [w, h], [0, h]] },
        { name: "stairs up right", size: [600, 300], rects: (w, h, steps = 4) => Array.from({ length: steps }, (_, i) => [w * i / steps, h * (steps - 1 - i) / steps, w / steps, h * (i + 1) / steps]) }, //like spawn.spawnStairs
        { name: "stairs up left", size: [600, 300], rects: (w, h, steps = 4) => Array.from({ length: steps }, (_, i) => [w * i / steps, h * i / steps, w / steps, h * (steps - i) / steps]) },
        { name: "arch", size: [400, 300], rects: (w, h, t = Math.min(w, h) / 5) => [[0, 0, w, t], [0, t, t, h - t], [w - t, t, t, h - t]] }, //a beam on two pillars, three rects
    ],
    presetIcon(preset, size = 18) { //a tiny drawing of the preset for its button
        const [w, h] = preset.size
        const k = (size - 2) / Math.max(w, h)
        const ox = (size - w * k) / 2
        const oy = (size - h * k) / 2
        const xy = (x, y) => `${(ox + x * k).toFixed(1)},${(oy + y * k).toFixed(1)}`
        const shapes = preset.rects ?
            preset.rects(w, h).map(([x, y, rw, rh]) => `<rect x="${(ox + x * k).toFixed(1)}" y="${(oy + y * k).toFixed(1)}" width="${(rw * k).toFixed(1)}" height="${(rh * k).toFixed(1)}"/>`).join("") :
            `<polygon points="${preset.points(w, h).map(([x, y]) => xy(x, y)).join(" ")}"/>`
        return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="currentColor" stroke="none" aria-hidden="true">${shapes}</svg>`
    },

    //*********************************************************************
    // making elements
    //*********************************************************************
    nameOf(typeName) { //what the editor calls a type, the spawn is enter
        return levelElements.types[typeName]?.editorName || typeName
    },
    define(name, type) {
        type.name = name
        type.label = type.label || name
        type.props = type.props || []
        levelElements.types[name] = type
        levelElements.groups[type.group].push(name)
    },
    create(typeName, values = {}) { //a new element with the type's defaults, levelData.add() gives it an id
        const type = levelElements.types[typeName]
        return { type: typeName, ...type.defaults(), ...values }
    },
    fillDefaults(el) { //older saves are missing properties added to a type later
        const type = levelElements.types[el.type]
        if (!type) return el
        const defaults = type.defaults()
        for (const key of Object.keys(defaults)) {
            if (el[key] === undefined && !(key === "width" && el.vertices) && !(key === "height" && el.vertices)) el[key] = defaults[key]
        }
        return el
    },
    shapeGeometry(el) { //the part of a map or block that stays when switching between them
        return el.vertices ? { x: el.x, y: el.y, vertices: el.vertices.map(v => v.slice()) } : { x: el.x, y: el.y, width: el.width, height: el.height }
    },
    matterBody(el, properties) { //a Matter body for a map or block, rect or vertices
        if (el.vertices) return Matter.Bodies.fromVertices(el.x, el.y, [el.vertices.map(v => ({ x: v[0], y: v[1] }))], properties)
        return Bodies.rectangle(el.x + el.width / 2, el.y + el.height / 2, el.width, el.height, properties)
    },
    //*********************************************************************
    // vertices, for the editor's vertex tool, a map or block is a rect or a list of vertices
    // shapes have to be convex: without the poly-decomp library Matter turns a concave shape into its hull,
    // so the level would collide differently than it looks, written levels make dents from several convex pieces
    //*********************************************************************
    vertexLimit: 64,
    minArea: 100, //10 × 10
    isInside(points, point) { //works for any simple shape, either winding
        let isIn = false
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const a = points[i]
            const b = points[j]
            if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) isIn = !isIn
        }
        return isIn
    },
    polygonArea(points) { //signed
        let area = 0
        for (let i = 0; i < points.length; i++) {
            const a = points[i]
            const b = points[(i + 1) % points.length]
            area += a.x * b.y - b.x * a.y
        }
        return area / 2
    },
    centroid(points) { //the center of area, where Matter puts a body's position
        const area = levelElements.polygonArea(points)
        let x = 0
        let y = 0
        for (let i = 0; i < points.length; i++) {
            const a = points[i]
            const b = points[(i + 1) % points.length]
            const cross = a.x * b.y - b.x * a.y
            x += (a.x + b.x) * cross
            y += (a.y + b.y) * cross
        }
        return { x: x / (6 * area), y: y / (6 * area) }
    },
    center(el) { //what vertices are written around, the centroid for shapes, the middle for rects
        return el.vertices ? { x: el.x, y: el.y } : { x: el.x + el.width / 2, y: el.y + el.height / 2 }
    },
    isVertexEditable(el) { //maps, blocks, and types with their own vertex rules, like a path
        const type = levelElements.types[el.type]
        return !!type && (type.group === "shape" || !!type.isVertexEditable)
    },
    isOpen(el) { //no edge from the last vertex back to the first
        const type = levelElements.types[el.type]
        return !!(type && type.isOpen && type.isOpen(el))
    },
    checkPoints(points, el) { //why a shape can't be made, or "" if it's fine, el's type can have its own rules
        const type = el && levelElements.types[el.type]
        if (type && type.checkPoints) return type.checkPoints(points, el)
        const n = points.length
        if (n < 3) return "needs at least 3 vertices"
        if (n > levelElements.vertexLimit) return `can't have more than ${levelElements.vertexLimit} vertices`
        if (!points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) return "vertices need numbers"
        const side = (a, b, c) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x))
        for (let i = 0; i < n; i++) { //edges that aren't next to each other can't cross
            for (let j = i + 2; j < n; j++) {
                if (i === 0 && j === n - 1) continue
                const a = points[i], b = points[(i + 1) % n], c = points[j], d = points[(j + 1) % n]
                if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) return "edges can't cross"
            }
        }
        let sign = 0
        let turn = 0
        for (let i = 0; i < n; i++) {
            const a = points[i]
            const b = points[(i + 1) % n]
            const c = points[(i + 2) % n]
            const ab = { x: b.x - a.x, y: b.y - a.y }
            const bc = { x: c.x - b.x, y: c.y - b.y }
            const lengths = Math.hypot(ab.x, ab.y) * Math.hypot(bc.x, bc.y)
            if (lengths < 1) return "two vertices are in the same spot"
            const cross = ab.x * bc.y - ab.y * bc.x
            if (Math.abs(cross) > 1e-6 * lengths) { //vertices in a straight line are fine
                if (sign && Math.sign(cross) !== sign) return "has to be convex, no dents"
                sign = Math.sign(cross)
            }
            turn += Math.atan2(cross, ab.x * bc.x + ab.y * bc.y)
        }
        if (Math.abs(Math.abs(turn) - 2 * Math.PI) > 0.01) return "edges can't cross"
        if (Math.abs(levelElements.polygonArea(points)) < levelElements.minArea) return "too small"
        return ""
    },
    setPoints(el, points) { //world points to a map or block, a rect if it is one
        const type = levelElements.types[el.type]
        if (type && type.setPoints) return type.setPoints(el, points)
        const isRect = points.length === 4 && points.every((p, i) => {
            const next = points[(i + 1) % 4]
            return p.x === next.x || p.y === next.y
        })
        if (isRect) {
            const b = levelElements.boundsOf(points)
            delete el.vertices
            Object.assign(el, b)
            return
        }
        const round = n => Math.round(n * 1000) / 1000
        const c = levelElements.centroid(points)
        el.x = round(c.x)
        el.y = round(c.y)
        el.vertices = points.map(p => [round(p.x - el.x), round(p.y - el.y)])
        delete el.width
        delete el.height
    },
    regularPoints(box, sides) { //a regular shape stretched to fill box, flat side down
        const unit = []
        for (let i = 0; i < sides; i++) {
            const angle = Math.PI / 2 + Math.PI / sides + 2 * Math.PI * i / sides
            unit.push({ x: Math.cos(angle), y: Math.sin(angle) })
        }
        const b = levelElements.boundsOf(unit)
        const round = n => Math.round(n * 1000) / 1000
        return unit.map(p => ({ x: round(box.x + (p.x - b.x) / b.width * box.width), y: round(box.y + (p.y - b.y) / b.height * box.height) }))
    },
    pathText(el) { //vertices around the center, written like spawn.mapVertex: "x y  x y  x y"
        const c = levelElements.center(el)
        const n = value => Number(value.toFixed(3))
        return levelElements.points(el).map(p => `${n(p.x - c.x)} ${n(p.y - c.y)}`).join("  ")
    },
    parsePath(el, text) { //pathText back to world points, or an error
        const numbers = String(text).match(/-?(\d+\.?\d*|\.\d+)(e-?\d+)?/gi) || []
        if (numbers.length % 2) return { error: "needs x y pairs" }
        const c = levelElements.center(el)
        const points = []
        for (let i = 0; i < numbers.length; i += 2) points.push({ x: c.x + Number(numbers[i]), y: c.y + Number(numbers[i + 1]) })
        return { points, error: levelElements.checkPoints(points, el) }
    },
    summary(el) { //short and code-like, for the editor's history, like map(0, -100, 500, 25)
        const type = levelElements.types[el.type]
        if (type && type.summary) return type.summary(el)
        const n = value => Number(Number(value).toFixed(2))
        let args
        if (el.vertices) {
            args = [n(el.x), n(el.y), `${el.vertices.length} vertices`]
        } else if (el.width !== undefined) {
            args = [el.x, el.y, el.width, el.height].map(n)
        } else {
            args = [n(el.x), n(el.y)]
        }
        return `${el.type}(${args.join(", ")})`
    },
    //*********************************************************************
    // code, each type's code(el, name) returns { setup, custom, top } lines of javascript, see levelData.code()
    // setup runs once when the level loads, name is a variable name for it like boost1, custom and top run each cycle
    //*********************************************************************
    args(...values) { //numbers without float noise, strings quoted, like they'd be written by hand
        return values.map(value => typeof value === "number" ? String(Number(value.toFixed(6))) : typeof value === "string" ? JSON.stringify(value) : value).join(", ")
    },
    marker(el, radius, fill, text) { //where a mob or power up spawns, the editor draws it with type.overlay()
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(el.x, el.y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.5)"
        ctx.stroke()
        ctx.font = `${Math.max(16, radius * 0.5)}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#000"
        ctx.fillText(text, el.x, el.y)
        ctx.textBaseline = "alphabetic"
        ctx.textAlign = "left"
    },
    outlineShape(el) { //a map's or block's outline in the guide style, for when its body isn't there
        const points = levelElements.points(el)
        ctx.beginPath()
        points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))
        ctx.closePath()
        ctx.stroke()
    },
    area(el) {
        return el.vertices ? Matter.Vertices.area(levelElements.points(el)) : el.width * el.height
    },
}

//*********************************************************************
// core, every level has one of each
//*********************************************************************
levelElements.define("spawn", { //still "spawn" in the data, the editor calls it enter, like level.enter
    group: "core",
    label: "enter",
    editorName: "enter",
    summary: el => `enter(${levelElements.args(el.x, el.y)})`,
    isSingleton: true,
    defaults: () => ({ x: 0, y: -50, bump: true }),
    props: [...levelElements.position(), levelElements.prop.bool("bump")],
    bounds: el => ({ x: el.x - 50, y: el.y - 150, width: 100, height: 200 }), //the entrance arch around the player
    overlay(el) { //where the run's constraint text shows, see the level properties
        const data = levelData.data
        if (!data) return
        ctx.font = "26px monospace"
        ctx.textAlign = "center"
        ctx.fillStyle = "rgba(255,83,177,0.6)"
        ctx.fillText("constraint text", el.x + data.constraintTextX, el.y + data.constraintTextY)
        ctx.textAlign = "left"
    },
    build(el, options) {
        if (options.isLive) { //moving the spawn in the editor shouldn't teleport the player
            m.spawnPos.x = el.x
            m.spawnPos.y = el.y
            level.enter.x = el.x - 50
            level.enter.y = el.y + 20
        } else {
            level.setPosToSpawn(el.x, el.y)
        }
        if (el.bump) spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20)
        return { custom() { level.enter.draw() } }
    },
    code: el => ({
        setup: [`level.setPosToSpawn(${levelElements.args(el.x, el.y)});`, ...(el.bump ? ["spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20); //bump for level entrance"] : [])],
        custom: ["level.enter.draw();"],
    }),
})

levelElements.define("exit", {
    group: "core",
    isSingleton: true,
    defaults: () => ({ x: 950, y: -20, bump: false }), //newer exits stand on the floor with no bump
    props: [...levelElements.position(), levelElements.prop.bool("bump")],
    bounds: el => ({ x: el.x, y: el.y - 170, width: 100, height: 210 }),
    build(el) {
        level.exit.x = el.x
        level.exit.y = el.y
        if (el.bump) spawn.mapRect(el.x, el.y + 20, 100, 20)
        return { custom() { level.exit.drawAndCheck() } }
    },
    code: el => ({
        setup: [`level.exit.x = ${levelElements.args(el.x)};`, `level.exit.y = ${levelElements.args(el.y)};`, ...(el.bump ? ["spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20); //bump for level exit"] : [])],
        custom: ["level.exit.drawAndCheck();"],
    }),
})

//*********************************************************************
// shapes, drawn with the editor's draw tool, a rect or a list of vertices around x, y
//*********************************************************************
levelElements.define("map", {
    group: "shape",
    color: "#444",
    isLinkable: true,
    handlesLink: true, //appears or disappears instead of only running while it's on
    defaults: () => ({ x: 0, y: 0, width: 100, height: 100, friction: 0.1, restitution: 0, collides: levelElements.collision.defaults.map, link: null, orLink: null, on: "appears" }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("friction", { step: 0.05, min: 0 }),
        levelElements.prop.number("restitution", { step: 0.1, min: 0 }),
        levelElements.prop.mask("collides"),
        levelElements.prop.ref("link", levelElements.linkSources),
        levelElements.orLinkProp(),
        levelElements.prop.select("on", ["appears", "disappears"]), //what it does while its link is on
    ],
    overlay(el) { //a linked map piece can be gone, so its outline always shows
        if (!el.link) return
        levelElements.outlineShape(el)
    },
    build(el) {
        const who = map[map.length] = levelElements.matterBody(el, { friction: el.friction, restitution: el.restitution })
        if (!levelElements.collision.isDefault(el)) who.collisionMask = levelElements.collision.mask(el.collides) //level.addToWorld() uses it in place of the usual mask
        if (!el.link) return
        return {
            custom() {
                const state = levelData.linkOn(el)
                level.setMapPart(who, state === null || state === (el.on === "appears")) //without its button or toggle it stays
            },
        }
    },
    code(el, name, context) { //spawn.mapRect or spawn.mapVertex, with properties only when they aren't the defaults
        const changed = [el.friction !== 0.1 ? `friction: ${levelElements.args(el.friction)}` : "", el.restitution ? `restitution: ${levelElements.args(el.restitution)}` : ""].filter(Boolean)
        const properties = changed.length ? `, { ${changed.join(", ")} }` : ""
        const shape = el.vertices ? `spawn.mapVertex(${levelElements.args(el.x, el.y, levelElements.pathText(el))}` : `spawn.mapRect(${levelElements.args(el.x, el.y, el.width, el.height)}`
        const setup = [`${shape}${properties});`]
        if (!levelElements.collision.isDefault(el)) setup.push(`map[map.length - 1].collisionMask = ${levelElements.collision.code(el.collides)}; //level.addToWorld() uses it in place of the usual mask`)
        const link = context && context.link(el)
        if (!link) return { setup }
        setup.push(`const ${name} = map[map.length - 1];`)
        return { setup, custom: [`level.setMapPart(${name}, ${el.on === "appears" ? link.on : link.off}); //${el.on} while it's on`] }
    },
})

levelElements.define("block", {
    group: "shape",
    color: "rgba(140,140,140,0.85)",
    defaults: () => ({ x: 0, y: 0, width: 50, height: 50, density: 0.001, friction: 0.05, frictionStatic: 0.5, frictionAir: 0.001, restitution: 0, velocityX: 0, velocityY: 0, holdable: true, noSpin: false, immutable: false, collides: levelElements.collision.defaults.block, chance: 1 }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("density", { step: 0.0005, min: 0.00001 }),
        levelElements.prop.number("mass", {
            step: 1,
            min: 0.01,
            read: el => Math.round(el.density * levelElements.area(el) * 100) / 100,
            write(el, value) { el.density = value / levelElements.area(el) },
        }),
        levelElements.prop.number("friction", { step: 0.05, min: 0 }),
        levelElements.prop.number("frictionStatic", { step: 0.1, min: 0 }), //how hard it is to start sliding, Matter's default is 0.5
        levelElements.prop.number("frictionAir", { step: 0.001, min: 0 }),
        levelElements.prop.number("restitution", { step: 0.1, min: 0 }),
        levelElements.prop.number("velocityX", { step: 1 }), //how fast it's moving when the level starts
        levelElements.prop.number("velocityY", { step: 1 }),
        levelElements.prop.bool("holdable"), //false is isNotHoldable, the field can't pick it up
        levelElements.prop.bool("noSpin"), //inertia Infinity, it slides but never turns
        levelElements.prop.bool("immutable"), //isImmutable, like a key, tech can't destroy, split, grow, or freeze it, and falling out of the level brings it back instead of removing it
        levelElements.prop.mask("collides"),
        levelElements.prop.number("chance", { step: 0.1, min: 0 }), //of showing up each time the level loads, like spawn.bodyRect's chance, always shows in the editor
    ],
    overlay(el) { //blocks that don't always show up are labeled with their chance
        if (el.chance >= 1) return
        const b = levelElements.bounds(el)
        ctx.font = `${Math.max(14, Math.min(40, b.height * 0.4))}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        ctx.fillText(`${Math.round(el.chance * 100)}%`, b.x + b.width / 2, b.y + b.height / 2)
        ctx.textBaseline = "alphabetic"
        ctx.textAlign = "left"
    },
    build(el, options) { //like spawn.bodyRect
        if (!options.isEditor && el.chance < 1 && Math.random() >= el.chance) return
        const who = body[body.length] = levelElements.matterBody(el, { friction: el.friction, frictionStatic: el.frictionStatic, frictionAir: el.frictionAir, restitution: el.restitution })
        Matter.Body.setDensity(who, el.density)
        if (el.noSpin) Matter.Body.setInertia(who, Infinity) //after the density, setting it sets the inertia too
        if (el.velocityX || el.velocityY) Matter.Body.setVelocity(who, { x: el.velocityX, y: el.velocityY })
        if (!el.holdable) who.isNotHoldable = true
        if (el.immutable) who.isImmutable = true
        who.collisionFilter.category = cat.body
        who.collisionFilter.mask = levelElements.collision.mask(el.collides)
        Composite.add(engine.world, who)
        who.classType = "body"
    },
    code(el, name, context) { //spawn.bodyRect's properties default to { friction: 0.05, frictionAir: 0.001 }, spawn.bodyVertex has no defaults
        const isHeld = !!(context && context.isReferenced(el.id)) //a constraint holds it, so it gets a name and always shows up
        const isDefault = el.friction === 0.05 && el.frictionAir === 0.001 && !el.restitution && el.frictionStatic === 0.5
        const properties = `{ friction: ${levelElements.args(el.friction)}${el.frictionStatic !== 0.5 ? `, frictionStatic: ${levelElements.args(el.frictionStatic)}` : ""}, frictionAir: ${levelElements.args(el.frictionAir)}${el.restitution ? `, restitution: ${levelElements.args(el.restitution)}` : ""} }`
        const setup = [el.vertices ?
            `spawn.bodyVertex(${levelElements.args(el.x, el.y, levelElements.pathText(el))}, ${properties});` :
            `spawn.bodyRect(${levelElements.args(el.x, el.y, el.width, el.height)}${isDefault ? "" : `, 1, ${properties}`});`]
        if (el.density !== 0.001) setup.push(`Matter.Body.setDensity(body[body.length - 1], ${levelElements.args(el.density)});`)
        if (el.noSpin) setup.push(`Matter.Body.setInertia(body[body.length - 1], Infinity); //slides but never turns`)
        if (el.velocityX || el.velocityY) setup.push(`Matter.Body.setVelocity(body[body.length - 1], { x: ${levelElements.args(el.velocityX)}, y: ${levelElements.args(el.velocityY)} });`)
        if (!el.holdable) setup.push(`body[body.length - 1].isNotHoldable = true;`)
        if (el.immutable) setup.push(`body[body.length - 1].isImmutable = true;`)
        if (!levelElements.collision.isDefault(el)) setup.push(`body[body.length - 1].collisionFilter.mask = ${levelElements.collision.code(el.collides)};`)
        if (isHeld) setup.push(`const ${name} = body[body.length - 1];`)
        if (el.chance >= 1 || isHeld) return { setup }
        if (setup.length === 1 && !el.vertices) { //spawn.bodyRect has a chance argument
            setup[0] = isDefault ? setup[0].replace(/\);$/, `, ${levelElements.args(el.chance)});`) : setup[0].replace(", 1, {", `, ${levelElements.args(el.chance)}, {`)
            return { setup }
        }
        return { setup: [`if (Math.random() < ${levelElements.args(el.chance)}) {`, ...setup.map(line => "    " + line), "}"] }
    },
})

//*********************************************************************
// elements, the editor's add menu
// build() returns { custom(), top() }, run each cycle under and over the player and blocks, like level.custom and level.customTopLayer
// overlay(el) draws extra guides in the editor only, like where a platform travels
//*********************************************************************
//angles in the inspector are degrees like boost's, 0 faces right and 90 up, Matter's angles turn clockwise in radians
levelElements.radians = degrees => -degrees * Math.PI / 180
levelElements.angleCode = degrees => { //Matter's angle written the way written levels do, like Math.PI or -Math.PI / 2
    const d = ((degrees % 360) + 540) % 360 - 180 //-180 to 180
    const named = { 0: "0", 180: "Math.PI", "-180": "Math.PI", 90: "-Math.PI / 2", "-90": "Math.PI / 2", 45: "-Math.PI / 4", "-45": "Math.PI / 4", 135: "-3 * Math.PI / 4", "-135": "3 * Math.PI / 4" }
    return named[d] || `${levelElements.args(-d)} * Math.PI / 180`
}

levelElements.define("boost", {
    tip: "launches the player, launchHeight is about how high, angle 90 is straight up",
    group: "element",
    defaults: () => ({ x: 0, y: -10, launchHeight: 1000, angle: 90 }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("launchHeight", { step: 50, min: 0 }), //about how high it flings the player
        levelElements.prop.number("angle", { step: 15 }), //degrees, 90 is up
    ],
    bounds: el => ({ x: el.x - 70, y: el.y - 60, width: 240, height: 135 }),
    rotate(el, degrees, center) { //turns where it launches, the pad stays flat
        levelElements.orbit(el, degrees, center)
        el.angle = Number((el.angle - degrees).toFixed(3))
    },
    build(el) {
        const boost = level.boost(el.x, el.y, el.launchHeight, el.angle * Math.PI / 180)
        return { custom() { boost.query() } }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.boost(${levelElements.args(el.x, el.y, el.launchHeight)}${el.angle === 90 ? "" : `, ${levelElements.args(el.angle)} * Math.PI / 180`});`],
        custom: [`${name}.query();`],
    }),
})

levelElements.define("mover", { //conveyor belt
    tip: "conveyor belt, pushes the player, blocks, and mobs along it, speed sets the direction",
    group: "element",
    defaults: () => ({ x: 0, y: -25, width: 500, height: 25, speed: -6 }),
    props: [...levelElements.rect(), levelElements.prop.number("speed", { step: 1 })],
    build(el) {
        const mover = level.mover(el.x, el.y, el.width, el.height, el.speed)
        return {
            custom() { mover.push() },
            top() { mover.draw() },
        }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.mover(${levelElements.args(el.x, el.y, el.width, el.height, el.speed)});`],
        custom: [`${name}.push();`],
        top: [`${name}.draw();`],
    }),
})

levelElements.define("transport", { //platform that slides back and forth
    tip: "platform that slides back and forth, distance is how far",
    group: "element",
    defaults: () => ({ x: 0, y: -200, width: 300, height: 25, speed: 4, distance: 1000 }),
    props: [...levelElements.rect(), levelElements.prop.number("speed", { step: 1 }), levelElements.prop.number("distance", { isGrid: true })],
    build(el) {
        const platform = level.transport(el.x, el.y, el.width, el.height, el.speed)
        const left = el.x + el.width / 2
        const right = left + el.distance
        return {
            custom() {
                if (platform.position.x < left) {
                    platform.changeDirection(true)
                } else if (platform.position.x > right) {
                    platform.changeDirection(false)
                }
                platform.move()
            },
            top() { platform.draw() },
        }
    },
    overlay(el) {
        ctx.strokeRect(el.x, el.y, el.width + el.distance, el.height)
    },
    code(el, name) {
        const left = levelElements.args(el.x + el.width / 2)
        const right = levelElements.args(el.x + el.width / 2 + el.distance)
        return {
            setup: [`const ${name} = level.transport(${levelElements.args(el.x, el.y, el.width, el.height, el.speed)});`],
            custom: [
                `if (${name}.position.x < ${left}) { //back and forth`,
                `    ${name}.changeDirection(true)`,
                `} else if (${name}.position.x > ${right}) {`,
                `    ${name}.changeDirection(false)`,
                `}`,
                `${name}.move();`,
            ],
            top: [`${name}.draw();`],
        }
    },
})

levelElements.define("elevator", {
    tip: "platform that rises and falls, or only when the player stands on it with onTouch",
    group: "element",
    defaults: () => ({ x: 0, y: -25, width: 200, height: 25, travel: 500, force: 0.003, onTouch: false }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("travel", { isGrid: true, min: 0 }), //how far up it goes
        levelElements.prop.number("force", { step: 0.0005, min: 0 }),
        levelElements.prop.bool("onTouch"),
    ],
    build(el) {
        const elevator = level.elevator(el.x, el.y, el.width, el.height, el.y - el.travel, el.force)
        return { custom: el.onTouch ? () => elevator.moveOnTouch() : () => elevator.move() }
    },
    overlay(el) {
        ctx.strokeRect(el.x, el.y - el.travel, el.width, el.height + el.travel)
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.elevator(${levelElements.args(el.x, el.y, el.width, el.height, el.y - el.travel, el.force)});`],
        custom: [`${name}.${el.onTouch ? "moveOnTouch" : "move"}();`],
    }),
})

levelElements.define("vanish", { //platform that shrinks away after the player touches it, then comes back
    tip: "platform that shrinks away after the player touches it, then comes back",
    group: "element",
    defaults: () => ({ x: 0, y: -25, width: 200, height: 25, vertical: false }),
    props: [...levelElements.rect(), levelElements.prop.bool("vertical")],
    build(el) {
        const vanish = level.vanish(el.x, el.y, el.width, el.height, el.vertical)
        return { top() { vanish.query() } }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.vanish(${levelElements.args(el.x, el.y, el.width, el.height)}${el.vertical ? ", true" : ""});`],
        top: [`${name}.query();`],
    }),
})

levelElements.define("spinner", { //block pinned at its center
    tip: "block pinned at its center, it turns when pushed, or on its own with motor, linked its motor only runs while on, frictionAir slows it",
    group: "element",
    defaults: () => ({ x: 0, y: -300, width: 400, height: 25, angle: 0, density: 0.001, frictionAir: 0.001, spin: 0, motor: 0 }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("angle", { step: 15 }), //how it starts, degrees, 90 is a quarter turn counterclockwise
        levelElements.prop.number("density", { step: 0.0005, min: 0.00001 }),
        levelElements.prop.number("frictionAir", { step: 0.005, min: 0 }), //Matter's air friction slows turning too, so a motor tops out sooner
        levelElements.prop.number("spin", { step: 0.01 }), //starting angular velocity
        levelElements.prop.number("motor", { step: 0.0005 }), //keeps it turning, like level.rotor
    ],
    rotate(el, degrees, center) {
        levelElements.orbit(el, degrees, center)
        el.angle = Number((el.angle - degrees).toFixed(3))
    },
    overlay(el) { //the bar at its starting angle, the selection outline is its unturned rect
        if (!el.angle) return
        const c = { x: el.x + el.width / 2, y: el.y + el.height / 2 }
        const points = [[el.x, el.y], [el.x + el.width, el.y], [el.x + el.width, el.y + el.height], [el.x, el.y + el.height]].map(([x, y]) => levelElements.rotatePoint({ x, y }, c, -el.angle))
        ctx.setLineDash([10, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.3)"
        ctx.beginPath()
        points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))
        ctx.closePath()
        ctx.stroke()
        ctx.setLineDash([])
    },
    build(el) {
        const rotor = level.rotor(el.x, el.y, el.width, el.height, el.density, levelElements.radians(el.angle), el.frictionAir, el.spin, el.motor)
        return { custom() { if (el.motor) rotor.rotate() } }
    },
    code(el, name) {
        const rotor = `level.rotor(${levelElements.args(el.x, el.y, el.width, el.height, el.density)}, ${levelElements.angleCode(el.angle)}, ${levelElements.args(el.frictionAir, el.spin, el.motor)});`
        return el.motor ? { setup: [`const ${name} = ${rotor}`], custom: [`${name}.rotate();`] } : { setup: [rotor] }
    },
})

levelElements.define("wind", {
    tip: "pushes the player, blocks, and power ups inside it, float cancels gravity",
    group: "element",
    defaults: () => ({ x: 0, y: -400, width: 400, height: 400, vx: 0, vy: -0.01, float: false }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("vx", { step: 0.005 }),
        levelElements.prop.number("vy", { step: 0.005 }),
        levelElements.prop.bool("float"), //cancels gravity inside
    ],
    build(el) {
        const wind = level.wind(el.x, el.y, el.width, el.height, { x: el.vx, y: el.vy }, el.float)
        return {
            custom() { wind.draw() },
            top() { if (!m.isTimeDilated) wind.do() },
        }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.wind(${levelElements.args(el.x, el.y, el.width, el.height)}, { x: ${levelElements.args(el.vx)}, y: ${levelElements.args(el.vy)} }${el.float ? ", true" : ""});`],
        custom: [`${name}.draw();`],
        top: [`if (!m.isTimeDilated) ${name}.do();`],
    }),
})

levelElements.define("slime", { //level.hazard
    tip: "hurts the player while they're inside it, with rise it starts empty and fills up, linked it fills while on and drains while off",
    group: "element",
    handlesLink: true, //with rise it drains while off instead of stopping
    defaults: () => ({ x: 0, y: -100, width: 400, height: 100, damage: 0.0025, rise: 0 }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("damage", { step: 0.0005, min: 0 }),
        levelElements.prop.number("rise", { step: 0.5, min: 0 }), //how fast it fills a cycle, 0 is always full, see hazard.level()
    ],
    overlay(el) { //how high it fills
        if (el.rise) ctx.strokeRect(el.x, el.y, el.width, el.height)
    },
    build(el) {
        const slime = level.hazard(el.x, el.y, el.width, el.height, el.damage)
        if (el.rise) { //starts empty
            slime.height = 0
            slime.min.y = slime.max.y
        }
        return {
            custom() {
                const state = levelData.linkOn(el)
                if (el.rise) slime.level(state !== false, el.rise)
                if (el.rise || state !== false) slime.query()
            },
        }
    },
    code(el, name, context) {
        const link = context && context.link(el)
        const setup = [`const ${name} = level.hazard(${levelElements.args(el.x, el.y, el.width, el.height, el.damage)});`]
        if (!el.rise) return { setup, custom: [link ? `if (${link.on}) ${name}.query();` : `${name}.query();`] }
        setup.push(`${name}.height = 0; //starts empty and rises`, `${name}.min.y = ${name}.max.y;`)
        return { setup, custom: [link ? `${name}.level(${link.on}, ${levelElements.args(el.rise)}); //fills while on, drains while off` : `${name}.levelRise(${levelElements.args(el.rise)});`, `${name}.query();`] }
    },
})

levelElements.segment = { //geometry for a line between two points, x, y and x2, y2, drag either end, like laser and fizzler
    bounds(el) {
        const b = levelElements.boundsOf([{ x: el.x, y: el.y }, { x: el.x2, y: el.y2 }])
        return { x: b.x - 10, y: b.y - 10, width: b.width + 20, height: b.height + 20 }
    },
    contains(el, p) { //close to the line
        const dx = el.x2 - el.x
        const dy = el.y2 - el.y
        const t = Math.max(0, Math.min(1, ((p.x - el.x) * dx + (p.y - el.y) * dy) / (dx * dx + dy * dy || 1)))
        return Math.hypot(p.x - el.x - t * dx, p.y - el.y - t * dy) < 15
    },
    move(el, dx, dy) {
        el.x += dx
        el.y += dy
        el.x2 += dx
        el.y2 += dy
    },
    handles: el => [{ id: "start", x: el.x, y: el.y }, { id: "end", x: el.x2, y: el.y2 }],
    pivot: el => ({ x: (el.x + el.x2) / 2, y: (el.y + el.y2) / 2 }),
    rotate(el, degrees, center) {
        const start = levelElements.rotatePoint({ x: el.x, y: el.y }, center, degrees)
        const end = levelElements.rotatePoint({ x: el.x2, y: el.y2 }, center, degrees)
        Object.assign(el, { x: start.x, y: start.y, x2: end.x, y2: end.y })
    },
    dragHandle(el, id, point) {
        if (id === "start") {
            el.x = point.x
            el.y = point.y
        } else {
            el.x2 = point.x
            el.y2 = point.y
        }
    },
    overlay(el) {
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x2, el.y2)
        ctx.stroke()
    },
}

levelElements.define("laser", {
    tip: "beam between two points that hurts the player, drag either end",
    group: "element",
    defaults: () => ({ x: 0, y: -300, x2: 400, y2: -300, damage: 0.12 }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("x2", { isGrid: true }),
        levelElements.prop.number("y2", { isGrid: true }),
        levelElements.prop.number("damage", { step: 0.02, min: 0 }),
    ],
    ...levelElements.segment,
    summary: el => `laser(${[el.x, el.y, el.x2, el.y2].map(n => Number(n.toFixed(2))).join(", ")})`,
    build(el) {
        const laser = level.laser({ x: el.x, y: el.y }, { x: el.x2, y: el.y2 }, el.damage)
        return { custom() { laser.query() } }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.laser({ x: ${levelElements.args(el.x)}, y: ${levelElements.args(el.y)} }, { x: ${levelElements.args(el.x2)}, y: ${levelElements.args(el.y2)} }, ${levelElements.args(el.damage)});`],
        custom: [`${name}.query();`],
    }),
})

levelElements.define("fizzler", { //level.fizzler
    tip: "line that deletes blocks that cross it, not immutable or unholdable ones, drag either end",
    group: "element",
    defaults: () => ({ x: 0, y: -300, x2: 0, y2: 0 }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("x2", { isGrid: true }),
        levelElements.prop.number("y2", { isGrid: true }),
    ],
    ...levelElements.segment,
    summary: el => `fizzler(${[el.x, el.y, el.x2, el.y2].map(n => Number(n.toFixed(2))).join(", ")})`,
    build(el) {
        const fizzler = level.fizzler({ x: el.x, y: el.y }, { x: el.x2, y: el.y2 })
        return { custom() { fizzler.query() } }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.fizzler({ x: ${levelElements.args(el.x)}, y: ${levelElements.args(el.y)} }, { x: ${levelElements.args(el.x2)}, y: ${levelElements.args(el.y2)} });`],
        custom: [`${name}.query();`],
    }),
})

//buttons and toggles turn linked elements on and off, a linked element's link is the button's or toggle's id
//doors open while it's on, other linkable elements only run while it's on, or with runs: "while off" the other way, see levelData.linkOn() and levelData.code()
//a link source can be linked to another link source, then it's only on while both are, see levelData.linkState()
//a link source has linkOn(el, runtime), true while on, and linkCode(el, name), the javascript for on and off
levelElements.isLinkSource = el => !!levelElements.types[el.type]?.linkOn
levelElements.runsProp = () => levelElements.prop.select("runs", ["while on", "while off"], { isShown: el => !!el.link }) //what a linked element does with its link, only shown once it has one
levelElements.keyColors = ["yellow", "pink", "teal"] //level.keyColors by name
levelElements.keyColor = name => level.keyColors[Math.max(0, levelElements.keyColors.indexOf(name))]
levelElements.drawLinks = (el, from) => { //a dashed line from a button or toggle to each element linked to it
    ctx.setLineDash([10, 8])
    ctx.lineWidth = 2
    ctx.strokeStyle = "rgba(255,80,80,0.6)"
    ctx.beginPath()
    for (const other of levelData.data.elements) {
        if (!levelElements.isLinkedTo(other, el)) continue
        const b = levelElements.bounds(other)
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(b.x + b.width / 2, b.y + b.height / 2)
    }
    ctx.stroke()
    ctx.setLineDash([])
}
levelElements.define("button", {
    tip: "pressed by the player or a block, linked doors open and linked elements run, on says when",
    group: "element",
    defaults: () => ({ x: 0, y: 0, on: "down" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.select("on", ["down", "up", "stays down"]), //when linked elements are on, stays down never comes back up
    ],
    bounds: el => ({ x: el.x - 35, y: el.y - 22, width: 200, height: 34 }), //the base, like level.button()
    overlay: el => levelElements.drawLinks(el, { x: el.x + 65, y: el.y - 10 }),
    linkOn: (el, runtime) => runtime.button ? (el.on === "up" ? runtime.button.isUp : !runtime.button.isUp) : null,
    linkCode: (el, name) => el.on === "up" ? { on: `${name}.isUp`, off: `!${name}.isUp` } : { on: `!${name}.isUp`, off: `${name}.isUp` },
    build(el) {
        const button = level.button(el.x, el.y)
        button.isUp = true //so stays down can be pressed the first time
        return {
            button,
            custom() {
                if (el.on !== "stays down" || button.isUp) button.query()
                button.draw()
            },
        }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.button(${levelElements.args(el.x, el.y)});`, ...(el.on === "stays down" ? [`${name}.isUp = true; //stays down once it's pressed`] : [])],
        custom: [el.on === "stays down" ? `if (${name}.isUp) ${name}.query();` : `${name}.query();`, `${name}.draw();`],
    }),
})

levelElements.define("toggle", { //level.toggle, a lever the player flips
    tip: "lever the player or a block flips, linked doors open and linked elements run while it's on, staysOn can't be flipped back",
    group: "element",
    defaults: () => ({ x: 0, y: -10, isOn: false, staysOn: false }),
    props: [
        ...levelElements.position(),
        levelElements.prop.bool("isOn"), //how it starts
        levelElements.prop.bool("staysOn"), //once it's on it can't be flipped off, level.toggle's isLockOn
    ],
    bounds: el => ({ x: el.x - 5, y: el.y - 55, width: 140, height: 70 }), //the lever and its base, like level.toggle()
    overlay: el => levelElements.drawLinks(el, { x: el.x + 65, y: el.y - 5 }),
    linkOn: (el, runtime) => runtime.toggle ? runtime.toggle.isOn : null,
    linkCode: (el, name) => ({ on: `${name}.isOn`, off: `!${name}.isOn` }),
    build(el) {
        const toggle = level.toggle(el.x, el.y, el.isOn, el.staysOn)
        return {
            toggle,
            custom() { toggle.query() },
        }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.toggle(${levelElements.args(el.x, el.y)}${el.isOn || el.staysOn ? `, ${el.isOn}` : ""}${el.staysOn ? ", true" : ""});${el.staysOn ? " //stays on once it's flipped" : ""}`],
        custom: [`${name}.query();`],
    }),
})

levelElements.define("keyhole", { //level.keyButton, a link source the matching key turns on
    tip: "cradle a key of the same color fits in, linked doors open and linked elements run while the key is in, stays on once it's been in",
    group: "element",
    defaults: () => ({ x: 0, y: 0, color: "yellow", on: "key in" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.select("color", levelElements.keyColors),
        levelElements.prop.select("on", ["key in", "stays on"]), //stays on once a key has been in, like the key level's doors
    ],
    bounds: el => ({ x: el.x - 35, y: el.y - 105, width: 152, height: 120 }), //the cradle and the glow over it
    overlay: el => levelElements.drawLinks(el, { x: el.x + 42, y: el.y - 30 }),
    linkOn: (el, runtime) => runtime.keyhole ? (el.on === "stays on" ? !!runtime.keyhole.isUsed : !runtime.keyhole.isUp) : null,
    linkCode: (el, name) => el.on === "stays on" ? { on: `${name}.isUsed`, off: `!${name}.isUsed` } : { on: `!${name}.isUp`, off: `${name}.isUp` },
    build(el) {
        const keyhole = level.keyButton(el.x, el.y, levelElements.keyColor(el.color))
        return {
            keyhole,
            custom() {
                keyhole.query()
                if (!keyhole.isUp) keyhole.isUsed = true
                keyhole.buttonStatus()
                keyhole.draw()
            },
        }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.keyButton(${levelElements.args(el.x, el.y)}, level.keyColors[${levelElements.keyColors.indexOf(el.color)}]);`],
        custom: [`${name}.query();`, ...(el.on === "stays on" ? [`if (!${name}.isUp) ${name}.isUsed = true; //stays on once the key has been in`] : []), `${name}.buttonStatus();`, `${name}.draw();`],
    }),
})

levelElements.define("key", { //level.key, an immutable block that turns on the keyhole of its color
    tip: "glowing block that fits the keyhole of its color, it can't be destroyed",
    group: "element",
    defaults: () => ({ x: 0, y: -100, color: "yellow" }),
    props: [...levelElements.position(), levelElements.prop.select("color", levelElements.keyColors)],
    bounds: el => ({ x: el.x - 38, y: el.y - 22, width: 76, height: 44 }),
    build(el) {
        const key = level.key(el.x, el.y, levelElements.keyColor(el.color))
        return {
            custom() { key.draw() },
            top() { key.drawTop() },
        }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.key(${levelElements.args(el.x, el.y)}, level.keyColors[${levelElements.keyColors.indexOf(el.color)}]);`],
        custom: [`${name}.draw();`],
        top: [`${name}.drawTop();`],
    }),
})

levelElements.zoneWho = { //what a zone notices, and the same as javascript
    player: { list: () => [player], code: "[player]" },
    block: { list: () => body, code: "body" },
    mob: { list: () => mob, code: "mob" },
    any: { list: () => [player].concat(body, mob), code: "[player].concat(body, mob)" },
}
levelElements.define("zone", { //a trigger, a link source that's on while the player is inside, only the editor draws it
    tip: "invisible box, linked doors open and linked elements run while the player (or a block or mob) is inside, stays on once something has been in",
    group: "element",
    isBackground: true, //it's often big, lock it so the mouse goes through
    defaults: () => ({ x: 0, y: -400, width: 400, height: 400, who: "player", on: "inside" }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.select("who", Object.keys(levelElements.zoneWho)),
        levelElements.prop.select("on", ["inside", "stays on"]), //stays on once it's been entered
    ],
    overlay(el) {
        ctx.fillStyle = "rgba(255,80,80,0.06)"
        ctx.fillRect(el.x, el.y, el.width, el.height)
        ctx.strokeRect(el.x, el.y, el.width, el.height)
        levelElements.drawLinks(el, { x: el.x + el.width / 2, y: el.y + el.height / 2 })
    },
    linkOn: (el, runtime) => runtime.zone ? runtime.zone.isOn : null,
    linkCode: (el, name) => ({ on: `${name}.isOn`, off: `!${name}.isOn` }),
    build(el) {
        const zone = { isOn: false, min: { x: el.x, y: el.y }, max: { x: el.x + el.width, y: el.y + el.height } }
        const who = levelElements.zoneWho[el.who] || levelElements.zoneWho.player
        return {
            zone,
            custom() { if (el.on !== "stays on" || !zone.isOn) zone.isOn = Matter.Query.region(who.list(), zone).length > 0 },
        }
    },
    code(el, name) {
        const who = levelElements.zoneWho[el.who] || levelElements.zoneWho.player
        const check = `${name}.isOn = Matter.Query.region(${who.code}, ${name}).length > 0;`
        return {
            setup: [`const ${name} = { isOn: false, min: { x: ${levelElements.args(el.x)}, y: ${levelElements.args(el.y)} }, max: { x: ${levelElements.args(el.x + el.width)}, y: ${levelElements.args(el.y + el.height)} } }; //trigger zone`],
            custom: [el.on === "stays on" ? `if (!${name}.isOn) ${check} //stays on once it's been entered` : check],
        }
    },
})

levelElements.timerCode = el => `${el.offset ? `(simulation.cycle + ${levelElements.args(el.offset)})` : "simulation.cycle"} % ${levelElements.args(el.onTime + el.offTime)} < ${levelElements.args(el.onTime)}`
levelElements.define("timer", { //a link source that's on for onTime cycles, then off for offTime, over and over
    tip: "linked doors open and linked elements run for onTime cycles, then stop for offTime, over and over, 60 cycles is a second, offset shifts when",
    group: "element",
    defaults: () => ({ x: 0, y: -200, onTime: 60, offTime: 60, offset: 0 }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("onTime", { step: 10, min: 1 }),
        levelElements.prop.number("offTime", { step: 10, min: 0 }),
        levelElements.prop.number("offset", { step: 10, min: 0 }),
    ],
    overlay(el) { //a clock, the hand goes around once a period, green while on
        const period = el.onTime + el.offTime
        const phase = ((simulation.cycle + el.offset) % period) / period
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.arc(el.x, el.y, 22, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * el.onTime / period)
        ctx.closePath()
        ctx.fillStyle = "rgba(80,200,120,0.35)"
        ctx.fill()
        ctx.beginPath()
        ctx.arc(el.x, el.y, 22, 0, 2 * Math.PI)
        ctx.fillStyle = levelElements.types.timer.linkOn(el) ? "rgba(80,200,120,0.3)" : "rgba(255,255,255,0.4)"
        ctx.fill()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x + 20 * Math.sin(2 * Math.PI * phase), el.y - 20 * Math.cos(2 * Math.PI * phase))
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.6)"
        ctx.stroke()
        levelElements.drawLinks(el, el)
    },
    linkOn: el => (simulation.cycle + el.offset) % (el.onTime + el.offTime) < el.onTime,
    linkCode: el => ({ on: levelElements.timerCode(el), off: `!(${levelElements.timerCode(el)})` }),
    build: () => ({}),
    code: (el, name) => ({ setup: [`//${name}: on ${el.onTime} cycles, off ${el.offTime}, what's linked to it checks ${levelElements.timerCode(el)}`] }),
})

levelElements.define("door", {
    tip: "slides up to open, link it to a button or toggle, without one it stays shut",
    group: "element",
    isLinkable: true,
    handlesLink: true, //opens instead of only running while it's on
    defaults: () => ({ x: 0, y: -400, width: 25, height: 400, distance: 355, speed: 1.5, link: null, orLink: null, runs: "while on" }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("distance", { isGrid: true, min: 0 }), //how far up it slides
        levelElements.prop.number("speed", { step: 0.5, min: 0.1 }),
        levelElements.prop.ref("link", levelElements.linkSources),
        levelElements.orLinkProp(),
        levelElements.runsProp(),
    ],
    overlay(el) { //where it slides to
        ctx.setLineDash([10, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.3)"
        ctx.strokeRect(el.x, el.y - el.distance, el.width, el.height)
        ctx.setLineDash([])
    },
    build(el) {
        const door = level.door(el.x, el.y, el.width, el.height, el.distance, el.speed)
        door.isClosing = true
        return {
            custom() {
                door.isClosing = levelData.linkOn(el) !== true
                door.openClose()
            },
            top() { door.draw() },
        }
    },
    code(el, name, context) {
        const link = context && context.link(el)
        return {
            setup: [`const ${name} = level.door(${levelElements.args(el.x, el.y, el.width, el.height, el.distance, el.speed)});`],
            custom: [`${name}.isClosing = ${link ? link.off : "true"};${link ? "" : " //no button opens it"}`, `${name}.openClose();`],
            top: [`${name}.draw();`],
        }
    },
})

levelElements.linkable = name => { //a link prop, so a button or toggle can turn it on and off, and runs, only shown once it's linked
    const type = levelElements.types[name]
    const defaults = type.defaults
    type.isLinkable = true
    type.defaults = () => ({ ...defaults(), link: null, orLink: null, runs: "while on" })
    type.props.push(levelElements.prop.ref("link", levelElements.linkSources), levelElements.orLinkProp(), levelElements.runsProp())
}
for (const name of ["boost", "mover", "transport", "laser", "wind", "slime", "fizzler", "spinner"]) levelElements.linkable(name)
for (const name of levelElements.linkSources) { //a link source linked to another is only on while both are, set with the other one's link button, the row only shows once it's set
    const type = levelElements.types[name]
    const defaults = type.defaults
    type.defaults = () => ({ ...defaults(), link: null, orLink: null })
    type.props.push(levelElements.prop.ref("link", levelElements.linkSources, { isShown: el => el.link !== null && el.link !== undefined }), levelElements.orLinkProp())
}

//a pair of portals, one element so the two ends stay together, end A is x, y, angle and end B is x2, y2, angle2
//angles are degrees like boost, 0 faces right and 90 up, each end's block fills the hole behind it, see level.portal()
levelElements.portalOutline = (x, y, degrees) => { //one end, the portal face 25 in front of x, y and the 200 deep block behind it, 160 across
    const a = levelElements.radians(degrees)
    const unit = { x: Math.cos(a), y: Math.sin(a) }
    const corner = (out, across) => ({ x: x + unit.x * out - unit.y * across, y: y + unit.y * out + unit.x * across })
    return [corner(25, -80), corner(25, 80), corner(-200, 80), corner(-200, -80)]
}
levelElements.define("portal", {
    tip: "a pair of portals, what goes in one comes out the other, drag either end, angle 0 faces right and 90 up, put each end in a gap in the map, its block fills the gap behind it",
    group: "element",
    defaults: () => ({ x: -300, y: -80, angle: 0, x2: 300, y2: -80, angle2: 180, exit: "momentum" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("angle", { step: 45 }), //degrees, 0 faces right, 90 up
        levelElements.prop.number("x2", { isGrid: true }),
        levelElements.prop.number("y2", { isGrid: true }),
        levelElements.prop.number("angle2", { step: 45 }),
        levelElements.prop.select("exit", ["momentum", "straight", "launch"]), //how things come out, momentum keeps what went in, the others are level.portalExit's
    ],
    outlines: el => [levelElements.portalOutline(el.x, el.y, el.angle), levelElements.portalOutline(el.x2, el.y2, el.angle2)],
    bounds: el => levelElements.boundsOf(levelElements.types.portal.outlines(el).flat()),
    contains: (el, p) => levelElements.types.portal.outlines(el).some(outline => levelElements.isInside(outline, p)),
    pickArea: () => 225 * 160, //one end, so the two ends far apart don't lose to the map between them
    move(el, dx, dy, isWhole) { //dragging end A leaves end B where it is, copies take both
        el.x += dx
        el.y += dy
        if (isWhole) {
            el.x2 += dx
            el.y2 += dy
        }
    },
    handles: el => [{ id: "a", x: el.x, y: el.y }, { id: "b", x: el.x2, y: el.y2 }],
    pivot: el => ({ x: (el.x + el.x2) / 2, y: (el.y + el.y2) / 2 }),
    rotate(el, degrees, center) { //both ends turn around the center, and face their new way
        const a = levelElements.rotatePoint({ x: el.x, y: el.y }, center, degrees)
        const b = levelElements.rotatePoint({ x: el.x2, y: el.y2 }, center, degrees)
        Object.assign(el, { x: a.x, y: a.y, x2: b.x, y2: b.y, angle: Number((el.angle - degrees).toFixed(3)), angle2: Number((el.angle2 - degrees).toFixed(3)) })
    },
    grabHandle: (el, point) => levelElements.isInside(levelElements.types.portal.outlines(el)[1], point) ? "b" : null, //anywhere on end B drags just end B
    dragHandle(el, id, point) {
        if (id === "a") {
            el.x = point.x
            el.y = point.y
        } else {
            el.x2 = point.x
            el.y2 = point.y
        }
    },
    summary: el => `portal(${levelElements.args(el.x, el.y)}, ${levelElements.args(el.x2, el.y2)})`,
    overlay(el) { //each end's outline with an arrow out of its face, and a dashed line between them
        ctx.setLineDash([10, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.3)"
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x2, el.y2)
        ctx.stroke()
        ctx.setLineDash([])
        const ends = [[el.x, el.y, el.angle, "A", "hsla(197, 100%, 40%, 0.8)"], [el.x2, el.y2, el.angle2, "B", "hsla(29, 100%, 45%, 0.8)"]]
        for (const [x, y, degrees, label, stroke] of ends) {
            const outline = levelElements.portalOutline(x, y, degrees)
            const a = levelElements.radians(degrees)
            ctx.strokeStyle = stroke
            ctx.beginPath()
            outline.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))
            ctx.closePath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + 70 * Math.cos(a), y + 70 * Math.sin(a))
            ctx.lineTo(x + 50 * Math.cos(a + 0.4), y + 50 * Math.sin(a + 0.4))
            ctx.moveTo(x + 70 * Math.cos(a), y + 70 * Math.sin(a))
            ctx.lineTo(x + 50 * Math.cos(a - 0.4), y + 50 * Math.sin(a - 0.4))
            ctx.stroke()
            ctx.font = "bold 40px monospace"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "rgba(255,255,255,0.8)" //on its block, which looks like the map
            ctx.fillText(label, x - 110 * Math.cos(a), y - 110 * Math.sin(a))
            ctx.textBaseline = "alphabetic"
            ctx.textAlign = "left"
        }
    },
    build(el) {
        const exit = level.portalExit[el.exit] //undefined for momentum, what goes in comes out
        const pair = level.portal({ x: el.x, y: el.y }, levelElements.radians(el.angle), { x: el.x2, y: el.y2 }, levelElements.radians(el.angle2), exit, exit)
        return {
            custom() { pair.query() },
            top() { pair.draw() },
        }
    },
    code(el, name) {
        const end = (x, y) => `{ x: ${levelElements.args(x)}, y: ${levelElements.args(y)} }`
        const exit = el.exit === "momentum" ? "" : `, level.portalExit.${el.exit}, level.portalExit.${el.exit}`
        return {
            setup: [`const ${name} = level.portal(${end(el.x, el.y)}, ${levelElements.angleCode(el.angle)}, ${end(el.x2, el.y2)}, ${levelElements.angleCode(el.angle2)}${exit});`],
            custom: [`${name}.query();`],
            top: [`${name}.draw();`],
        }
    },
})

levelElements.define("decor", { //colored rect drawn behind or in front of the player, like the fillRect shading in written levels
    tip: "colored rect drawn behind or in front of the player, for shading and backgrounds",
    group: "element",
    label: "fill color",
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: 0, y: -400, width: 400, height: 400, color: "rgba(0,0,0,0.1)", layer: "back" }),
    names: ["exit fill", "shadow fill"], //each gets a button in the add menu
    tips: {
        "exit fill": "the light cyan room color behind the exit, placed around the exit door",
        "shadow fill": "see-through dark rect drawn in front of the player, like the shading in written levels",
    },
    preset(name, data) { //x and y place it, otherwise it goes in the middle of the view
        if (name === "shadow fill") return { color: "rgba(0,0,0,0.1)", layer: "front" } //written levels mostly shade in customTopLayer
        const exit = data && data.elements.find(el => el.type === "exit")
        const room = { width: 400, height: 350, color: "#d4f4f4", layer: "back" } //the light cyan room behind the exit in written levels
        return exit ? { ...room, x: exit.x - 150, y: exit.y + 20 - room.height } : room
    },
    props: [...levelElements.rect(), levelElements.prop.color("color"), levelElements.prop.select("layer", ["back", "front"])],
    build(el) {
        const draw = () => {
            ctx.fillStyle = el.color
            ctx.fillRect(el.x, el.y, el.width, el.height)
        }
        return el.layer === "front" ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = [`ctx.fillStyle = ${levelElements.args(el.color)};`, `ctx.fillRect(${levelElements.args(el.x, el.y, el.width, el.height)});`]
        return el.layer === "front" ? { top: lines } : { custom: lines }
    },
})

levelElements.isNoColor = color => !color || color === "none" || color === "transparent"
levelElements.define("path", { //lines and shapes of any outline, drawn behind or in front of the player, the add menu's path button draws one point at a time
    tip: "draw lines or filled shapes, click to add points, click the first point to close it, enter or right click to finish",
    group: "element",
    label: "draw path",
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    isVertexEditable: true,
    addCommand: "drawPath", //its add button draws instead of adding one
    defaults: () => ({ x: 0, y: -300, vertices: [[-200, 0], [200, 0]], closed: false, fill: "none", stroke: "rgba(0,0,0,0.25)", lineWidth: 10, layer: "back" }),
    styles: { //what a newly drawn path looks like
        closed: { fill: "rgba(0,0,0,0.1)", stroke: "none" },
        open: { fill: "none", stroke: "rgba(0,0,0,0.25)" },
    },
    props: [
        ...levelElements.position(),
        levelElements.prop.bool("closed"),
        levelElements.prop.color("fill"), //"none" for no fill
        levelElements.prop.color("stroke"), //"none" for no line
        levelElements.prop.number("lineWidth", { step: 1, min: 0 }),
        levelElements.prop.select("layer", ["back", "front"]),
    ],
    isOpen: el => !el.closed,
    contains(el, p) { //inside a filled path, or near its line
        const points = levelElements.points(el)
        if (el.closed && !levelElements.isNoColor(el.fill) && levelElements.isInside(points, p)) return true
        const reach = Math.max(8, el.lineWidth / 2 + 4)
        const count = el.closed ? points.length : points.length - 1
        for (let i = 0; i < count; i++) {
            const a = points[i]
            const b = points[(i + 1) % points.length]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)))
            if (Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) < reach) return true
        }
        return false
    },
    checkPoints(points, el) { //any outline works, it's only drawn
        const min = el && el.closed ? 3 : 2
        if (points.length < min) return `needs at least ${min} vertices`
        if (points.length > 200) return "can't have more than 200 vertices"
        if (!points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) return "vertices need numbers"
        return ""
    },
    setPoints(el, points) { //vertices around the middle of its bounds, never a rect
        const round = n => Math.round(n * 1000) / 1000
        const b = levelElements.boundsOf(points)
        el.x = round(b.x + b.width / 2)
        el.y = round(b.y + b.height / 2)
        el.vertices = points.map(p => [round(p.x - el.x), round(p.y - el.y)])
    },
    summary: el => `path(${levelElements.args(el.x, el.y)}, ${el.vertices.length} points)`,
    build(el) {
        const draw = () => {
            const points = levelElements.points(el)
            ctx.beginPath()
            ctx.moveTo(points[0].x, points[0].y)
            for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y)
            if (el.closed) ctx.closePath()
            if (el.closed && !levelElements.isNoColor(el.fill)) {
                ctx.fillStyle = el.fill
                ctx.fill()
            }
            if (!levelElements.isNoColor(el.stroke) && el.lineWidth > 0) {
                ctx.strokeStyle = el.stroke
                ctx.lineWidth = el.lineWidth
                ctx.stroke()
            }
        }
        return el.layer === "front" ? { top: draw } : { custom: draw }
    },
    code(el) {
        const points = levelElements.points(el)
        const lines = ["ctx.beginPath();", `ctx.moveTo(${levelElements.args(points[0].x, points[0].y)});`, ...points.slice(1).map(p => `ctx.lineTo(${levelElements.args(p.x, p.y)});`)]
        if (el.closed) lines.push("ctx.closePath();")
        if (el.closed && !levelElements.isNoColor(el.fill)) lines.push(`ctx.fillStyle = ${levelElements.args(el.fill)};`, "ctx.fill();")
        if (!levelElements.isNoColor(el.stroke) && el.lineWidth > 0) lines.push(`ctx.strokeStyle = ${levelElements.args(el.stroke)};`, `ctx.lineWidth = ${levelElements.args(el.lineWidth)};`, "ctx.stroke();")
        return el.layer === "front" ? { top: lines } : { custom: lines }
    },
})

//*********************************************************************
levelElements.define("drip", { //level.drip, a drop that falls over and over
    tip: "a drop that falls from x, y, over and over, drag the bottom to change how far",
    group: "element",
    defaults: () => ({ x: 0, y: -600, length: 600, period: 100, color: "hsla(160, 100%, 35%, 0.5)" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("length", { isGrid: true, min: 10 }), //how far it falls
        levelElements.prop.number("period", { step: 10, min: 1 }), //cycles between drops, plus up to 40 at random
        levelElements.prop.color("color"),
    ],
    bounds: el => ({ x: el.x - 10, y: el.y - 10, width: 20, height: el.length + 20 }),
    handles: el => [{ id: "end", x: el.x, y: el.y + el.length }],
    dragHandle(el, id, point) { el.length = Math.max(10, point.y - el.y) },
    overlay(el) {
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x, el.y + el.length)
        ctx.stroke()
    },
    build(el) {
        const drip = level.drip(el.x, el.y, el.y + el.length, el.period, el.color)
        return { custom() { drip.draw() } }
    },
    code: (el, name) => ({
        setup: [`const ${name} = level.drip(${levelElements.args(el.x, el.y, el.y + el.length, el.period, el.color)});`],
        custom: [`${name}.draw();`],
    }),
})

levelElements.define("text", { //words in the game's stroke font, like the constraint and level name at the start of a level, it doesn't jitter when the camera moves slowly like fillText does
    tip: "words drawn in the game's line font, like the level name at the start, letters, numbers, and . , ! ? : ' - + = / ( ) %, x, y is the top left, or the top middle when centered",
    group: "element",
    defaults: () => ({ x: 0, y: -300, text: "text", size: 40, color: "rgba(0,0,0,0.5)", lineWidth: 3, align: "left", layer: "back" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.text("text"),
        levelElements.prop.number("size", { step: 5, min: 5 }), //how tall the letters are, 40 is the font's own size
        levelElements.prop.color("color"),
        levelElements.prop.number("lineWidth", { step: 1, min: 0.5 }),
        levelElements.prop.select("align", ["left", "center", "right"]),
        levelElements.prop.select("layer", ["back", "front"]),
    ],
    textBox(el) { //where the letters go, each letter and space is 29 wide at size 40
        const width = Math.max(1, String(el.text).toLowerCase().replace(/[^a-z0-9.,!?:'\-+=/()% ]/g, "").length) * 29 * el.size / 40 //the characters simulation.draw.font has, it skips others
        const left = el.align === "center" ? el.x - width / 2 : el.align === "right" ? el.x - width : el.x
        return { x: left, y: el.y, width, height: el.size }
    },
    bounds: el => levelElements.types.text.textBox(el),
    summary: el => `text(${levelElements.args(el.x, el.y)}, ${JSON.stringify(String(el.text).slice(0, 20))})`,
    build(el) {
        const box = levelElements.types.text.textBox(el)
        const word = simulation.draw.font.path(String(el.text), box.x, box.y, el.size)
        const draw = () => {
            ctx.strokeStyle = el.color
            ctx.lineWidth = el.lineWidth
            ctx.stroke(word)
        }
        return el.layer === "front" ? { top: draw } : { custom: draw }
    },
    code(el, name) {
        const box = levelElements.types.text.textBox(el)
        const lines = [`ctx.strokeStyle = ${levelElements.args(el.color)};`, `ctx.lineWidth = ${levelElements.args(el.lineWidth)};`, `ctx.stroke(${name});`]
        return {
            setup: [`const ${name} = simulation.draw.font.path(${levelElements.args(String(el.text), box.x, box.y)}${el.size !== 40 ? `, ${levelElements.args(el.size)}` : ""});${el.align === "left" ? "" : ` //${el.align === "center" ? "centered on" : "right side at"} x = ${levelElements.args(el.x)}`}`],
            [el.layer === "front" ? "top" : "custom"]: lines,
        }
    },
})

levelElements.define("circle", { //a filled circle drawn behind or in front of the player, the shape written levels draw most
    tip: "colored circle drawn behind or in front of the player, drag the handle to change its radius",
    group: "element",
    label: "circle fill",
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: 0, y: -200, radius: 100, color: "rgba(0,0,0,0.1)", layer: "back" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("radius", { isGrid: true, min: 1 }),
        levelElements.prop.color("color"),
        levelElements.prop.select("layer", ["back", "front"]),
    ],
    bounds: el => ({ x: el.x - el.radius, y: el.y - el.radius, width: 2 * el.radius, height: 2 * el.radius }),
    contains: (el, p) => Math.hypot(p.x - el.x, p.y - el.y) <= el.radius,
    handles: el => [{ id: "radius", x: el.x + el.radius, y: el.y }],
    dragHandle(el, id, point) { el.radius = Math.max(1, Math.round(Math.hypot(point.x - el.x, point.y - el.y))) },
    summary: el => `circle(${levelElements.args(el.x, el.y, el.radius)})`,
    build(el) {
        const draw = () => {
            ctx.beginPath()
            ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI)
            ctx.fillStyle = el.color
            ctx.fill()
        }
        return el.layer === "front" ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = ["ctx.beginPath();", `ctx.arc(${levelElements.args(el.x, el.y, el.radius)}, 0, 2 * Math.PI);`, `ctx.fillStyle = ${levelElements.args(el.color)};`, "ctx.fill();"]
        return el.layer === "front" ? { top: lines } : { custom: lines }
    },
})

levelElements.define("ellipse", { //a filled ellipse, angle turns it, degrees counterclockwise like boost
    tip: "colored ellipse drawn behind or in front of the player, drag its handles to change each radius, rotate turns it",
    group: "element",
    label: "ellipse fill",
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: 0, y: -200, radiusX: 150, radiusY: 75, angle: 0, color: "rgba(0,0,0,0.1)", layer: "back" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("radiusX", { isGrid: true, min: 1 }),
        levelElements.prop.number("radiusY", { isGrid: true, min: 1 }),
        levelElements.prop.number("angle", { step: 15 }),
        levelElements.prop.color("color"),
        levelElements.prop.select("layer", ["back", "front"]),
    ],
    axes(el) { //unit vectors along radiusX and radiusY in world space
        const a = levelElements.radians(el.angle)
        return { u: { x: Math.cos(a), y: Math.sin(a) }, v: { x: -Math.sin(a), y: Math.cos(a) } }
    },
    bounds(el) {
        const { u } = levelElements.types.ellipse.axes(el)
        const halfWidth = Math.hypot(el.radiusX * u.x, el.radiusY * u.y)
        const halfHeight = Math.hypot(el.radiusX * u.y, el.radiusY * u.x)
        return { x: el.x - halfWidth, y: el.y - halfHeight, width: 2 * halfWidth, height: 2 * halfHeight }
    },
    contains(el, p) {
        const { u, v } = levelElements.types.ellipse.axes(el)
        const dx = p.x - el.x
        const dy = p.y - el.y
        return ((dx * u.x + dy * u.y) / el.radiusX) ** 2 + ((dx * v.x + dy * v.y) / el.radiusY) ** 2 <= 1
    },
    handles(el) {
        const { u, v } = levelElements.types.ellipse.axes(el)
        return [{ id: "radiusX", x: el.x + el.radiusX * u.x, y: el.y + el.radiusX * u.y }, { id: "radiusY", x: el.x + el.radiusY * v.x, y: el.y + el.radiusY * v.y }]
    },
    dragHandle(el, id, point) { //how far along its own axis the handle is
        const axis = levelElements.types.ellipse.axes(el)[id === "radiusX" ? "u" : "v"]
        el[id] = Math.max(1, Math.round(Math.abs((point.x - el.x) * axis.x + (point.y - el.y) * axis.y)))
    },
    pivot: el => ({ x: el.x, y: el.y }),
    rotate(el, degrees, center) {
        levelElements.orbit(el, degrees, center)
        el.angle = Number((el.angle - degrees).toFixed(3))
    },
    summary: el => `ellipse(${levelElements.args(el.x, el.y, el.radiusX, el.radiusY)})`,
    build(el) {
        const draw = () => {
            ctx.beginPath()
            ctx.ellipse(el.x, el.y, el.radiusX, el.radiusY, levelElements.radians(el.angle), 0, 2 * Math.PI)
            ctx.fillStyle = el.color
            ctx.fill()
        }
        return el.layer === "front" ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = ["ctx.beginPath();", `ctx.ellipse(${levelElements.args(el.x, el.y, el.radiusX, el.radiusY)}, ${el.angle ? levelElements.angleCode(el.angle) : "0"}, 0, 2 * Math.PI);`, `ctx.fillStyle = ${levelElements.args(el.color)};`, "ctx.fill();"]
        return el.layer === "front" ? { top: lines } : { custom: lines }
    },
})

levelElements.bezierPoints = el => [{ x: el.x, y: el.y }, { x: el.cx1, y: el.cy1 }, { x: el.cx2, y: el.cy2 }, { x: el.x2, y: el.y2 }] //start, its control, the end's control, end
levelElements.bezierAt = (el, t) => { //a point on the curve
    const [a, b, c, d] = levelElements.bezierPoints(el)
    const s = 1 - t
    return {
        x: s * s * s * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t * t * t * d.x,
        y: s * s * s * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t * t * t * d.y,
    }
}
levelElements.define("bezier", { //a curved line, ctx.bezierCurveTo, drag either end or either control point
    tip: "curved line from x, y to x2, y2, drag the ends and the two control points that bend it",
    group: "element",
    label: "bezier",
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: -200, y: -200, cx1: -100, cy1: -450, cx2: 100, cy2: -450, x2: 200, y2: -200, stroke: "rgba(0,0,0,0.25)", lineWidth: 10, layer: "back" }),
    props: [
        ...levelElements.position(),
        ...["cx1", "cy1", "cx2", "cy2", "x2", "y2"].map(key => levelElements.prop.number(key, { isGrid: true })),
        levelElements.prop.color("stroke"),
        levelElements.prop.number("lineWidth", { step: 1, min: 0 }),
        levelElements.prop.select("layer", ["back", "front"]),
    ],
    samples: el => Array.from({ length: 33 }, (_, i) => levelElements.bezierAt(el, i / 32)),
    bounds(el) { //the curve, not its control points
        const b = levelElements.boundsOf(levelElements.types.bezier.samples(el))
        const pad = Math.max(10, el.lineWidth / 2)
        return { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad }
    },
    contains(el, p) { //near the curve
        const points = levelElements.types.bezier.samples(el)
        const reach = Math.max(8, el.lineWidth / 2 + 4)
        for (let i = 0; i < points.length - 1; i++) {
            const a = points[i]
            const dx = points[i + 1].x - a.x
            const dy = points[i + 1].y - a.y
            const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)))
            if (Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) < reach) return true
        }
        return false
    },
    move(el, dx, dy) {
        for (const [x, y] of [["x", "y"], ["cx1", "cy1"], ["cx2", "cy2"], ["x2", "y2"]]) {
            el[x] += dx
            el[y] += dy
        }
    },
    handles: el => [{ id: "start", x: el.x, y: el.y }, { id: "c1", x: el.cx1, y: el.cy1 }, { id: "c2", x: el.cx2, y: el.cy2 }, { id: "end", x: el.x2, y: el.y2 }],
    dragHandle(el, id, point) {
        const [x, y] = { start: ["x", "y"], c1: ["cx1", "cy1"], c2: ["cx2", "cy2"], end: ["x2", "y2"] }[id]
        el[x] = point.x
        el[y] = point.y
    },
    pivot: el => ({ x: (el.x + el.x2) / 2, y: (el.y + el.y2) / 2 }),
    rotate(el, degrees, center) {
        for (const [x, y] of [["x", "y"], ["cx1", "cy1"], ["cx2", "cy2"], ["x2", "y2"]]) {
            const p = levelElements.rotatePoint({ x: el[x], y: el[y] }, center, degrees)
            el[x] = p.x
            el[y] = p.y
        }
    },
    overlay(el) { //each end to its control point
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.cx1, el.cy1)
        ctx.moveTo(el.x2, el.y2)
        ctx.lineTo(el.cx2, el.cy2)
        ctx.stroke()
    },
    summary: el => `bezier(${levelElements.args(el.x, el.y, el.x2, el.y2)})`,
    build(el) {
        const draw = () => {
            if (levelElements.isNoColor(el.stroke) || el.lineWidth <= 0) return
            ctx.beginPath()
            ctx.moveTo(el.x, el.y)
            ctx.bezierCurveTo(el.cx1, el.cy1, el.cx2, el.cy2, el.x2, el.y2)
            ctx.strokeStyle = el.stroke
            ctx.lineWidth = el.lineWidth
            ctx.stroke()
        }
        return el.layer === "front" ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = ["ctx.beginPath();", `ctx.moveTo(${levelElements.args(el.x, el.y)});`, `ctx.bezierCurveTo(${levelElements.args(el.cx1, el.cy1, el.cx2, el.cy2, el.x2, el.y2)});`, `ctx.strokeStyle = ${levelElements.args(el.stroke)};`, `ctx.lineWidth = ${levelElements.args(el.lineWidth)};`, "ctx.stroke();"]
        return el.layer === "front" ? { top: lines } : { custom: lines }
    },
})

// constraints, a Matter.js constraint from a point in the level to a block, made with the inspector's constraint button
// x, y is the point in the level, bx, by is where it holds the block, from the block's center
//*********************************************************************
levelElements.constraintEnd = el => { //where it holds its body in the level, from the block's data, or its body while the level runs
    const target = levelData.data && levelData.find(levelData.data, el.body)
    const runtime = target && levelData.runtimes.get(target.id)
    const who = runtime && runtime.bodies && runtime.bodies[0]
    if (who) return { x: who.position.x + el.bx, y: who.position.y + el.by }
    if (target) {
        const c = levelElements.center(target)
        return { x: c.x + el.bx, y: c.y + el.by }
    }
    return null
}
levelElements.define("constraint", {
    tip: "a Matter.js constraint from a point in the level to a block",
    group: "constraint",
    rebuildWithRefs: true, //its block is a new body after the block is rebuilt
    defaults: () => ({ x: 0, y: -300, body: null, bx: 0, by: 0, stiffness: 1, damping: 0, length: 200 }),
    props: [
        ...levelElements.position(), //pointA
        levelElements.prop.ref("body", ["block"]), //bodyB
        levelElements.prop.number("bx", { isGrid: true }), //pointB, from the block's center
        levelElements.prop.number("by", { isGrid: true }),
        levelElements.prop.number("stiffness", { step: 0.05, min: 0 }), //1 is a rod, small is a spring
        levelElements.prop.number("damping", { step: 0.05, min: 0 }),
        levelElements.prop.number("length", { isGrid: true, min: 0 }),
    ],
    bounds: el => ({ x: el.x - 12, y: el.y - 12, width: 24, height: 24 }),
    contains(el, p) { //its point, or near the line to the block
        if (Math.hypot(p.x - el.x, p.y - el.y) < 12) return true
        const end = levelElements.constraintEnd(el)
        if (!end) return false
        const dx = end.x - el.x
        const dy = end.y - el.y
        const t = Math.max(0, Math.min(1, ((p.x - el.x) * dx + (p.y - el.y) * dy) / (dx * dx + dy * dy || 1)))
        return Math.hypot(p.x - el.x - t * dx, p.y - el.y - t * dy) < 8
    },
    handles(el) {
        const end = levelElements.constraintEnd(el)
        return end ? [{ id: "end", x: end.x, y: end.y }] : []
    },
    dragHandle(el, id, point) { //moves where it holds the block
        const end = levelElements.constraintEnd({ ...el, bx: 0, by: 0 })
        if (!end) return
        el.bx = Math.round((point.x - end.x) * 1000) / 1000
        el.by = Math.round((point.y - end.y) * 1000) / 1000
    },
    summary: el => `constraint(${levelElements.args(el.x, el.y)})${el.body ? ` to #${el.body}` : ""}`,
    overlay(el) {
        const end = levelElements.constraintEnd(el)
        ctx.setLineDash([])
        ctx.lineWidth = 2
        ctx.strokeStyle = end ? "rgba(0,0,0,0.6)" : "rgba(220,0,0,0.8)"
        ctx.fillStyle = "#fff"
        ctx.beginPath()
        ctx.arc(el.x, el.y, 8, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        if (!end) return
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(end.x, end.y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        ctx.fill()
    },
    build(el) {
        const runtime = levelData.runtimes.get(el.body)
        const who = runtime && runtime.bodies && runtime.bodies[0]
        if (!who) throw new Error("needs a body, pick a block")
        cons[cons.length] = Constraint.create({ pointA: { x: el.x, y: el.y }, bodyB: who, pointB: { x: el.bx, y: el.by }, stiffness: el.stiffness, damping: el.damping, length: el.length })
        Composite.add(engine.world, cons[cons.length - 1])
    },
    code(el, name, context) {
        const body = context && context.nameOf(el.body)
        if (!body) return { setup: [`//${levelElements.summary(el)} has no block`] }
        const a = levelElements.args
        return {
            setup: [
                `cons[cons.length] = Constraint.create({ pointA: { x: ${a(el.x)}, y: ${a(el.y)} }, bodyB: ${body}, pointB: { x: ${a(el.bx)}, y: ${a(el.by)} }, stiffness: ${a(el.stiffness)}, damping: ${a(el.damping)}, length: ${a(el.length)} });`,
                "Composite.add(engine.world, cons[cons.length - 1]);",
            ],
        }
    },
})

//*********************************************************************
// mobs, the editor's mobs menu, random mobs picked for the level like written levels
// they only spawn when the level loads, in the editor only after a restart with spawn on, see levelEditor.isSpawning
//*********************************************************************
levelElements.define("mobSpot", { //a place a random mob might spawn, spawn.randomMobFromArray() picks how many by the level's difficulty, like newer written levels
    tip: "a place a random mob might spawn, each level spawns mobs at some of its spots, more as the run goes on, small spots get a few small mobs",
    group: "mob",
    label: "mob", //its add button, the data and export still call it a spot
    defaults: () => ({ x: 0, y: -300, small: false }),
    props: [...levelElements.position(), levelElements.prop.bool("small")], //small spots get a few small mobs instead of one
    bounds: el => ({ x: el.x - 20, y: el.y - 20, width: 40, height: 40 }),
    contains: (el, p) => Math.hypot(p.x - el.x, p.y - el.y) < 20,
    overlay: el => levelElements.marker(el, 20, "rgba(255,80,80,0.2)", el.small ? "s" : "?"),
    build(el, options) {
        if (options.isSpawning) spawn.randomMobPositions.push({ x: el.x, y: el.y, isSmall: el.small }) //levelData.play() calls spawn.randomMobFromArray() after
    },
    codeAll: elements => [ //every spot goes in one list
        "spawn.randomMobPositions = [",
        ...elements.map(el => `    [${levelElements.args(el.x, el.y)}${el.small ? ", true" : ""}],`),
        "].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));",
        "spawn.randomMobFromArray()",
    ],
})

levelElements.mobType = (spawnName, label, radius, fill, hasChance, text = label) => ({ //text is what the editor writes on its marker
    group: "mob",
    label,
    defaults: () => hasChance ? { x: 0, y: -300, chance: 1 } : { x: 0, y: -300 },
    props: [...levelElements.position(), ...(hasChance ? [levelElements.prop.number("chance", { step: 0.1, min: 0 })] : [])],
    bounds: el => ({ x: el.x - radius, y: el.y - radius, width: 2 * radius, height: 2 * radius }),
    contains: (el, p) => Math.hypot(p.x - el.x, p.y - el.y) < radius,
    overlay: el => levelElements.marker(el, radius, fill, text),
    build(el, options) {
        if (options.isSpawning) spawn[spawnName](el.x, el.y, ...(hasChance ? spawnName === "randomSmallMob" ? [undefined, undefined, el.chance] : [el.chance] : []))
    },
    code(el) {
        let chance = ""
        if (hasChance && spawnName !== "randomSmallMob") chance = `, ${levelElements.args(el.chance)}`
        if (hasChance && spawnName === "randomSmallMob" && el.chance !== 1) chance = `, undefined, undefined, ${levelElements.args(el.chance)}` //how many and their size are random by default
        return { setup: [`spawn.${spawnName}(${levelElements.args(el.x, el.y)}${chance});`] }
    },
})
levelElements.define("mob", { ...levelElements.mobType("randomMob", "mob", 40, "rgba(255,80,80,0.35)", true), tip: "one random mob in this exact spot, chance is how likely, written levels use spots instead" })
levelElements.define("smallMobs", { ...levelElements.mobType("randomSmallMob", "small mobs", 30, "rgba(255,120,80,0.35)", true, "small"), tip: "a few small random mobs, more on harder difficulties" })
levelElements.define("mobGroup", { ...levelElements.mobType("randomGroup", "group", 50, "rgba(255,80,160,0.35)", true), tip: "a group of random mobs linked together, only after the first few levels" })
levelElements.mobNames = () => typeof spawn === "undefined" ? ["starter"] : [...new Set([...spawn.tier.flat(), ...spawn.bossTier.flat()])] //every mob and boss by tier, spawn.js isn't loaded in the unit tests
levelElements.define("namedMob", { //one mob picked by name, for levels that want a specific mob
    ...levelElements.mobType("namedMob", "mob by name", 40, "rgba(255,40,40,0.35)", false),
    tip: "one mob picked by name, it always spawns",
    preset: name => ({ name }),
    defaults: () => ({ x: 0, y: -300, name: "slasher" }),
    props: [
        ...levelElements.position(),
        { key: "name", kind: "select", get options() { return levelElements.mobNames() } },
    ],
    overlay: el => levelElements.marker(el, 40, "rgba(255,40,40,0.35)", el.name),
    summary: el => `${el.name}(${levelElements.args(el.x, el.y)})`,
    build(el, options) {
        if (options.isSpawning && typeof spawn[el.name] === "function") spawn[el.name](el.x, el.y)
    },
    code: el => ({ setup: [`spawn.${el.name}(${levelElements.args(el.x, el.y)});`] }),
})
levelElements.bossType = (spawnName, label, radius, fill) => ({ //a boss spawns at its spot or one of its other spots, picked at random each time the level loads
    ...levelElements.mobType(spawnName, label, radius, fill, false),
    defaults: () => ({ x: 0, y: -300, spots: [] }), //spots: [[x, y], ...] other places it could spawn, the editor shows them as handles to drag
    places: el => [[el.x, el.y], ...el.spots],
    contains: (el, p) => levelElements.types[el.type].places(el).some(([x, y]) => Math.hypot(p.x - x, p.y - y) < radius),
    move(el, dx, dy, isWhole) { //dragging the boss leaves its other spots where they are, copies take them along
        el.x += dx
        el.y += dy
        if (isWhole) el.spots = el.spots.map(([x, y]) => [x + dx, y + dy])
    },
    handles: el => el.spots.map(([x, y], i) => ({ id: `spot${i}`, x, y })),
    grabHandle(el, point) { //anywhere on another spot's marker drags that spot, not just its handle
        const index = el.spots.findIndex(([x, y]) => Math.hypot(point.x - x, point.y - y) < radius)
        return index === -1 ? null : `spot${index}`
    },
    dragHandle(el, id, point) {
        el.spots[Number(id.slice(4))] = [point.x, point.y]
    },
    summary: el => `${label.replace(" ", "")}(${levelElements.args(el.x, el.y)})${el.spots.length ? ` + ${el.spots.length} spot${el.spots.length > 1 ? "s" : ""}` : ""}`,
    overlay(el) {
        el.spots.forEach(([x, y], i) => { //other spots are dashed, with a line to the main one
            ctx.setLineDash([12, 8])
            ctx.beginPath()
            ctx.moveTo(el.x, el.y)
            ctx.lineTo(x, y)
            ctx.lineWidth = 2
            ctx.strokeStyle = "rgba(160,0,60,0.4)"
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, 2 * Math.PI)
            ctx.fillStyle = "rgba(200,0,60,0.1)"
            ctx.fill()
            ctx.stroke()
            ctx.setLineDash([])
            ctx.font = `${Math.max(16, radius * 0.4)}px monospace`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "rgba(0,0,0,0.6)"
            ctx.fillText(`${label} ${i + 2}`, x, y)
            ctx.textBaseline = "alphabetic"
            ctx.textAlign = "left"
        })
        levelElements.marker(el, radius, fill, el.spots.length ? `${label} 1` : label)
    },
    build(el, options) {
        if (!options.isSpawning) return
        const places = levelElements.types[el.type].places(el)
        const [x, y] = places[Math.floor(Math.random() * places.length)]
        spawn[spawnName](x, y)
    },
    code(el, name) {
        const spot = ([x, y]) => `{ x: ${levelElements.args(x)}, y: ${levelElements.args(y)} }`
        if (!el.spots.length) return { setup: [`spawn.${spawnName}(${levelElements.args(el.x, el.y)});`] }
        const places = levelElements.types[el.type].places(el)
        const pick = places.length === 2 ? `Math.random() < 0.5 ? ${spot(places[0])} : ${spot(places[1])}` : `[${places.map(spot).join(", ")}][Math.floor(Math.random() * ${places.length})]` //like written levels pick a boss spot
        return { setup: [`const ${name} = ${pick}`, `spawn.${spawnName}(${name}.x, ${name}.y);`] }
    },
})
levelElements.define("boss", { ...levelElements.bossType("randomLevelBoss", "boss", 80, "rgba(200,0,60,0.35)"), tip: "the level's boss, picked by the run's tier, add spots in the inspector for other places it could spawn" })
levelElements.define("secondaryBoss", { ...levelElements.bossType("secondaryBossChance", "2nd boss", 70, "rgba(160,0,100,0.3)"), tip: "a second boss, it only spawns with the 2 bosses difficulty option" })

//*********************************************************************
// power ups, the editor's power ups menu
//*********************************************************************
levelElements.define("powerUp", {
    group: "powerUp",
    label: "power up",
    names: ["heal", "ammo", "research", "tech", "gun", "field", "coupling", "boost", "Casimir", "qubit", "difficulty"], //each gets a button in the menu, every power up with an orb, entanglement has none
    tips: {
        heal: "restores health",
        ammo: "adds ammo to all the player's guns",
        research: "rerolls gun, field, and tech choices, levels with mobs already get 1",
        tech: "a choice of 3 tech, written levels give tech from the boss and the starting power up",
        gun: "a choice of 2 guns",
        field: "a choice of 2 fields",
        coupling: "improves the player's field",
        boost: "more damage for a while",
        Casimir: "more max energy, what heals turn into with some tech",
        qubit: "0.97x damage taken for the rest of the run",
        difficulty: "pick difficulty options, like the one at the start of a run",
    },
    preset: name => ({ name }),
    defaults: () => ({ x: 0, y: -100, name: "heal", count: 1 }),
    props: [
        ...levelElements.position(),
        { key: "name", kind: "select", get options() { return levelElements.types.powerUp.names } },
        levelElements.prop.number("count", { step: 1, min: 1 }),
    ],
    bounds: el => ({ x: el.x - 25, y: el.y - 25, width: 50, height: 50 }),
    summary: el => `${el.name}(${levelElements.args(el.x, el.y)})${el.count > 1 ? ` × ${el.count}` : ""}`,
    overlay: el => levelElements.marker(el, 25, powerUps[el.name] ? powerUps[el.name].color : "#fff", el.count > 1 ? `${el.count}` : ""),
    build(el, options) {
        if (options.isSpawning) for (let i = 0; i < el.count; i++) powerUps.spawn(el.x + 25 * i, el.y, el.name) //25 apart, power ups in the same spot lag while they push apart
    },
    code: el => ({ setup: [el.count > 1 ? `for (let i = 0; i < ${el.count}; i++) powerUps.spawn(${levelElements.args(el.x)} + 25 * i, ${levelElements.args(el.y, el.name)});` : `powerUps.spawn(${levelElements.args(el.x, el.y, el.name)});`] }),
})

levelElements.powerUpCall = (call, label, fill) => ({ //a powerUps function that picks for the player, like the starting power ups
    group: "powerUp",
    label,
    defaults: () => ({ x: 0, y: -100 }),
    props: levelElements.position(),
    bounds: el => ({ x: el.x - 30, y: el.y - 30, width: 60, height: 60 }),
    contains: (el, p) => Math.hypot(p.x - el.x, p.y - el.y) < 30,
    overlay: el => levelElements.marker(el, 30, fill, label),
    build(el, options) {
        if (options.isSpawning) powerUps[call](el.x, el.y)
    },
    code: el => ({ setup: [`powerUps.${call}(${levelElements.args(el.x, el.y)});`] }),
})
levelElements.define("randomPowerUp", { ...levelElements.powerUpCall("chooseRandomPowerUp", "random", "rgba(0,200,180,0.3)"), tip: "a heal or ammo, picked when the level loads" })
levelElements.define("startingPowerUps", { ...levelElements.powerUpCall("spawnStartingPowerUps", "starting", "rgba(30,90,200,0.3)"), tip: "every level has 1, early in a run it gives the first gun or tech, later it's a few random power ups, put it far from the entrance so the player explores to find it" })

levelElements.define("debris", { //random small blocks and power ups along a line, written levels use about 16
    tip: "small random blocks along a line, about 15% are heal or ammo instead, written levels use about 16",
    group: "powerUp",
    defaults: () => ({ x: 0, y: -300, width: 1000, count: 16 }),
    props: [...levelElements.position(), levelElements.prop.number("width", { isGrid: true, min: 1 }), levelElements.prop.number("count", { step: 1, min: 1 })],
    bounds: el => ({ x: el.x, y: el.y - 25, width: el.width, height: 50 }),
    handles: el => [{ id: "w", x: el.x, y: el.y }, { id: "e", x: el.x + el.width, y: el.y }],
    dragHandle(el, id, point, min) {
        const right = el.x + el.width
        if (id === "w") {
            el.x = Math.min(point.x, right - min)
            el.width = right - el.x
        } else {
            el.width = Math.max(min, point.x - el.x)
        }
    },
    summary: el => `debris(${levelElements.args(el.x, el.y, el.width, el.count)})`,
    overlay(el) {
        ctx.setLineDash([])
        ctx.fillStyle = "rgba(140,140,140,0.3)"
        ctx.fillRect(el.x, el.y - 25, el.width, 50)
        ctx.fillStyle = "#000"
        ctx.font = "20px monospace"
        ctx.textAlign = "left"
        ctx.fillText(`debris × ${el.count}`, el.x + 5, el.y + 7)
    },
    build(el, options) {
        if (options.isSpawning) spawn.debris(el.x, el.y, el.width, el.count)
    },
    code: el => ({ setup: [`spawn.debris(${levelElements.args(el.x, el.y, el.width, el.count)});`] }),
})

//settings for the whole level, in the editor's level properties menu, levelData.applySettings() uses them
levelElements.level = {
    props: [
        levelElements.prop.text("name"),
        levelElements.prop.number("zoom", { step: 100, min: 200 }), //level.defaultZoom when it's played
        levelElements.prop.color("background"),
        levelElements.prop.color("mapColor"),
        levelElements.prop.color("blockColor"),
        levelElements.prop.number("gravity", { step: 0.1, min: 0.1 }), //times normal gravity, for the player, blocks, and power ups, mobs have their own
        levelElements.prop.select("fall", ["spawn", "sky"]), //falling off the bottom sends the player back to the spawn, or keeps them falling from the sky above it
        levelElements.prop.number("constraintTextX", { isGrid: true }), //where the run's constraint shows, from the spawn, level.announceText()
        levelElements.prop.number("constraintTextY", { isGrid: true }),
    ],
    defaults: () => ({ zoom: 2000, background: "#dcdcde", mapColor: "#444", blockColor: "rgba(140,140,140,0.85)", gravity: 1, fall: "spawn", constraintTextX: 0, constraintTextY: 75 }), //what written levels use most, and the level properties default button
}

//*********************************************************************
// code, javascript that runs as part of the level, like a written level's special blocks and level.custom
// a level with code runs everything in its list order inside one function, so code can use the variables of code before it, see levelData.runCode()
//*********************************************************************
levelElements.define("code", {
    tip: "javascript that runs as part of the level, it can use the variables of code above it",
    group: "code",
    isCode: true, //not in the level to click, except the bodies it makes, and not copied
    defaults: () => ({ code: "" }),
    props: [],
    bounds(el) { //around the bodies it made
        const runtime = levelData.runtimes.get(el.id)
        const bodies = runtime ? (runtime.maps || []).concat(runtime.bodies || []) : []
        if (!bodies.length) return { x: 0, y: 0, width: 0, height: 0 }
        return levelElements.boundsOf(bodies.flatMap(who => [who.bounds.min, who.bounds.max]))
    },
    contains: () => false, //clicking one of its bodies selects it, see levelData.runtimeContains()
    move() { },
    summary: el => `code(${levelElements.codeTitle(el)})`,
    build() { }, //levelData.runCode() runs it
    code: el => ({ setup: el.code.split("\n") }),
})
levelElements.codeTitle = el => { //its first line of code, short
    const line = el.code.split("\n").map(row => row.trim()).find(row => row && !row.startsWith("//")) || "empty"
    return line.length > 32 ? line.slice(0, 31) + "…" : line
}
