"use strict";
//the kinds of things a local level is made of, used by levelData to build levels and by levelEditor to edit them
//each type is plain data plus a build() that makes it in the world with the same level.* and spawn.* helpers the written levels use
//add a new type with levelElements.define(), see docs/level-editor.md
const levelElements = {
    types: {},
    groups: { core: [], shape: [], element: [], constraint: [], mob: [], powerUp: [], code: [] }, //type names in the order they were defined, element, mob, and powerUp are the editor's add menus
    buildOrder: ["core", "shape", "element", "constraint", "mob", "powerUp", "code"], //mobs and power ups go in after the map they stand on, like in written levels, constraints after what they hold, a level with code builds in its list order instead
    maxPowerUpCount: 1000, //per editor element, also enforced when loading local level data

    //*********************************************************************
    // properties, shown and edited in the editor's inspector
    //*********************************************************************
    //{ key, kind: "number" | "bool" | "text" | "select" | "mask" | "veto", step, min, max, options, read(el), write(el, value) }
    //read and write are for values worked out from other values, like a block's mass from its density
    prop: {
        number(key, settings = {}) { return { key, kind: "number", ...settings } },
        bool(key, settings = {}) { return { key, kind: "bool", ...settings } },
        text(key, settings = {}) { return { key, kind: "text", ...settings } },
        color(key, settings = {}) { return { key, kind: "color", ...settings } }, //text with a color picker
        select(key, options, settings = {}) { return { key, kind: "select", options, ...settings } },
        ref(key, types, settings = {}) { return { key, kind: "ref", types, ...settings } }, //another element's id or null, types are the kinds it can be
        mask(key, settings = {}) { return { key, kind: "mask", ...settings } }, //collision categories as names, like "player map body", see levelElements.collision
        veto(key, tiers, noun, settings = {}) { return { key, kind: "veto", tiers, noun, ...settings } }, //mob or boss names it won't spawn, tiers() is [[label, names], ...], each tier keeps at least one, noun is "mob" or "boss"
    },

    //*********************************************************************
    // collision, a map's or block's collisionFilter.mask, saved as category names like "player map body"
    // two bodies collide only if each one's mask has the other's category, so a mask can only take away collisions the other side allows
    //*********************************************************************
    collision: {
        names: ["player", "map", "body", "bullet", "powerUp", "mob", "mobBullet", "mobShield"], //cat.phased is past 32 bits, Matter's masks can't hold it
        category: { map: "map", block: "body", mover: "map", vanish: "map", transport: "body", elevator: "body", spinner: "body", door: "body", dispenser: "body" },
        defaults: { //the mask each type gets in level.addToWorld(), spawn.bodyRect(), and its level.* helper
            map: "player map body bullet powerUp mob mobBullet",
            block: "player map body bullet mob mobBullet",
            mover: "player map body bullet powerUp mob mobBullet", //it's in map, so level.addToWorld() sets it
            vanish: "player body bullet powerUp mob mobBullet",
            transport: "player body bullet powerUp mob mobBullet",
            elevator: "player body bullet mob mobBullet",
            spinner: "player body bullet powerUp mob mobBullet",
            door: "player body bullet powerUp mob mobBullet",
            dispenser: "player map body bullet mob mobBullet", //the blocks it makes, like spawn.bodyRect()
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
            if (category === "map" && name === "map") return false
            return levelElements.collision.has(levelElements.collision.others[name], category)
        },
        choices(type) { //the names worth checking for a type, the others never collide with it whatever its mask
            return levelElements.collision.names.filter(name => levelElements.collision.isBack(type, name))
        },
        mask(text) { return String(text).split(" ").filter(Boolean).reduce((mask, name) => mask | cat[name], 0) },
        code(text) { return String(text).split(" ").filter(name => levelElements.collision.names.includes(name)).map(name => `cat.${name}`).join(" | ") || "0" },
        isDefault(el) { return el.collides === levelElements.collision.defaults[el.type] },
    },
    linkSources: ["button", "toggle", "keyhole", "zone", "scale", "mobClear", "logic"], //turn linked elements on and off, each has linkOn(el, runtime) and linkCode(el, name), see button
    orLinkProp() { return levelElements.prop.ref("orLink", levelElements.linkSources, { isShown: el => el.orLink !== null && el.orLink !== undefined }) }, //a second link, on while either is, set by linking a second button to it, only shown once it's set
    isLinkedTo: (el, source) => el.link === source.id || el.orLink === source.id,
    isLinkFull: el => !!el.link && !!el.orLink, //two links is the most, a third is refused, see levelEditor.linkTo()
    tidyLinks(el) { //orLink moves up when link goes away, so link is set whenever either is, and they're never the same
        if (el.orLink && el.orLink === el.link) el.orLink = null
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
    unionBounds(elements) { //the bounds around all of them
        return levelElements.boundsOf(elements.flatMap(el => {
            const b = levelElements.bounds(el)
            return [{ x: b.x, y: b.y }, { x: b.x + b.width, y: b.y + b.height }]
        }))
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
        return levelElements.rectHandles(el.vertices ? levelElements.bounds(el) : el)
    },
    rectHandles: ({ x, y, width: w, height: h }) => [ //the 8 resize handles around a rect, the ids dragHandle() reads
        { id: "nw", x, y }, { id: "n", x: x + w / 2, y }, { id: "ne", x: x + w, y },
        { id: "e", x: x + w, y: y + h / 2 }, { id: "se", x: x + w, y: y + h }, { id: "s", x: x + w / 2, y: y + h },
        { id: "sw", x, y: y + h }, { id: "w", x, y: y + h / 2 },
    ],
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
        if (el.forceAngle !== undefined) el.forceAngle = Number((el.forceAngle - degrees).toFixed(3)) //a block's force turns with it
        if (type && type.rotate) return type.rotate(el, degrees, center)
        if (!levelElements.isRotatable(el)) return levelElements.orbit(el, degrees, center)
        levelElements.setPoints(el, levelElements.points(el).map(p => levelElements.rotatePoint(p, center, degrees)))
    },
    //flipping, the inspector's flip buttons, axis "x" mirrors left and right, "y" up and down, around center
    //shapes and paths mirror their outline, a type with flip(el, axis, center) mirrors its own way, anything else only moves
    flipPoint: (p, axis, center) => axis === "x" ? { x: 2 * center.x - p.x, y: p.y } : { x: p.x, y: 2 * center.y - p.y },
    flipAngle: (degrees, axis) => axis === "x" ? Number((180 - degrees).toFixed(3)) : Number((-degrees).toFixed(3)), //degrees counterclockwise, like boost
    canFlip(el) { //flipping it on its own changes something: its outline, its angle, or its ends, anything else just stays where it is
        const type = levelElements.types[el.type]
        return !!type && ((!!type.flip && !type.isMirrorSymmetric) || type.group === "shape" || !!type.isVertexEditable)
    },
    flip(el, axis, center = levelElements.pivot(el)) {
        const type = levelElements.types[el.type]
        if (el.forceAngle !== undefined) el.forceAngle = levelElements.flipAngle(el.forceAngle, axis) //a block's force mirrors with it
        if (type && type.flip) return type.flip(el, axis, center)
        if (type && (type.group === "shape" || type.isVertexEditable)) return levelElements.setPoints(el, levelElements.points(el).map(p => levelElements.flipPoint(p, axis, center)))
        levelElements.flipPosition(el, axis, center)
    },
    flipPosition(el, axis, center) { //moves it so the middle of its bounds mirrors, its shape stays
        const b = levelElements.bounds(el)
        const to = levelElements.flipPoint({ x: b.x + b.width / 2, y: b.y + b.height / 2 }, axis, center)
        levelElements.move(el, to.x - b.x - b.width / 2, to.y - b.y - b.height / 2, true)
    },
    flipEnds(el, axis, center, pairs) { //mirror several x, y keys, like a laser's two ends
        for (const [x, y] of pairs) {
            const p = levelElements.flipPoint({ x: el[x], y: el[y] }, axis, center)
            el[x] = p.x
            el[y] = p.y
        }
    },
    stretch(el, box) { //fit a shape with vertices to a new bounds box
        const from = levelElements.bounds(el)
        const round = n => Math.round(n * 1000) / 1000
        levelElements.setPoints(el, levelElements.points(el).map(p => ({
            x: round(box.x + (p.x - from.x) * box.width / (from.width || 1)),
            y: round(box.y + (p.y - from.y) * box.height / (from.height || 1)),
        })))
        if (el.handles) el.handles = el.handles.map(h => h && [round(h[0] * box.width / (from.width || 1)), round(h[1] * box.height / (from.height || 1))]) //a path's curves stretch too
    },
    //*********************************************************************
    // presets, common shapes from written levels for the editor's add menu, made as map, or block when the block tool is on
    // points(w, h) is the outline in a w × h box with its top left at 0, 0, rects(w, h) makes several rects instead, like stairs, their button pictures are saved in levelEditor.shapeIcons
    //*********************************************************************
    presets: [ //no two are the same shape turned or mirrored, flip and rotate make the rest
        { name: "square", size: [200, 200], rects: (w, h) => [[0, 0, w, h]] }, //a plain rect
        { name: "rounded rect", size: [400, 200], points: (w, h, c = Math.min(50, w / 4, h / 4)) => [[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]] }, //like spawn.bodyRectCorner
        { name: "rounded bottom", size: [150, 400], points: (w, h, c = Math.min(40, w / 4, h / 4)) => [[0, 0], [w, 0], [w, h - c], [w - c, h], [c, h], [0, h - c]] },
        { name: "trapezoid", size: [400, 100], points: (w, h) => [[w / 4, 0], [w * 3 / 4, 0], [w, h], [0, h]] },
        { name: "dome", size: [400, 200], points: (w, h, n = 12) => Array.from({ length: n + 1 }, (_, i) => [w / 2 - w / 2 * Math.cos(Math.PI * i / n), h - h * Math.sin(Math.PI * i / n)]) }, //like the half circles in written levels, turn it for a bowl
        { name: "ramp", size: [400, 200], points: (w, h) => [[w, 0], [w, h], [0, h]] }, //up to the right, flip it for the other way
        { name: "hexagon", size: [300, 260], points: (w, h) => [[w / 4, 0], [w * 3 / 4, 0], [w, h / 2], [w * 3 / 4, h], [w / 4, h], [0, h / 2]] }, //the game's namesake, flat on top
        { name: "pointed ends", size: [600, 150], points: (w, h, c = Math.min(h * 0.75, w / 4)) => [[c, 0], [w - c, 0], [w, h / 2], [w - c, h], [c, h], [0, h / 2]] },
        { name: "circle", size: [300, 300], points: (w, h, n = 16) => Array.from({ length: n }, (_, i) => [w / 2 + w / 2 * Math.cos(2 * Math.PI * i / n), h / 2 + h / 2 * Math.sin(2 * Math.PI * i / n)]) },
        { name: "point up", size: [300, 500], points: (w, h) => [[w / 2, 0], [w, h * 0.15], [w, h], [0, h], [0, h * 0.15]] },
        { name: "diamond", size: [300, 400], points: (w, h) => [[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]] },
        { name: "spike", size: [200, 200], points: (w, h) => [[w / 2, 0], [w, h], [0, h]] },
        { name: "stairs", size: [600, 300], rects: (w, h, steps = 4) => Array.from({ length: steps }, (_, i) => [w * i / steps, h * (steps - 1 - i) / steps, w / steps, h * (i + 1) / steps]) }, //like spawn.spawnStairs, up to the right, flip it for the other way
        { name: "arch", size: [400, 300], rects: (w, h, t = Math.min(w, h) / 5) => [[0, 0, w, t], [0, t, t, h - t], [w - t, t, t, h - t]] }, //a beam on two pillars, three rects
    ],

    //*********************************************************************
    // making elements
    //*********************************************************************
    nameOf(typeName) { //what the editor calls a type, the spawn is entrance
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
    isCode: el => !!levelElements.types[el.type]?.isCode, //javascript the player wrote, it runs in list order and isn't drawn or copied
    isSnappable: el => !!levelElements.types[el.type]?.isSnappable, //made of map or body pieces, smart snap only moves and lines up with these
    unfinished(message) { //an error for an element that isn't set up yet, the editor shows it without logging it every rebuild
        return Object.assign(new Error(message), { isUnfinished: true })
    },
    isHeld(el, data = levelData.data) { //a constraint or another element points at it, a held block always shows up, chance would leave its constraint without a body
        return !!data && data.elements.some(other => other !== el && levelElements.refKeys(other).some(key => other[key] === el.id))
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
            args = [el.x, el.y, el.width, el.height].filter(value => value !== undefined).map(n) //a scale has no height
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
        return values.map(value => typeof value === "number" ? String(Number(value.toFixed(6))) : JSON.stringify(value)?.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029")).join(", ")
    },
    marker(el, radius, fill, text, fontSize = Math.max(16, radius * 0.5)) { //where a mob or power up spawns, the editor draws it with type.overlay()
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.arc(el.x, el.y, radius, 0, 2 * Math.PI)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.5)"
        ctx.stroke()
        ctx.font = `${fontSize}px monospace`
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
levelElements.define("spawn", { //still "spawn" in the data, the editor calls it entrance, like level.enter
    group: "core",
    label: "entrance",
    editorName: "entrance",
    summary: el => `entrance(${levelElements.args(el.x, el.y)})`,
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
    isSnappable: true, //smart snap lines it up with other snappable pieces, see docs/level-editor.md
    group: "shape",
    color: "#444",
    isLinkable: true,
    handlesLink: true, //appears or disappears instead of only running while it's on
    writesLink: true, //its code() uses context.link, edited, its link can't change
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
        if (!el.link && !el.orLink) return
        levelElements.outlineShape(el)
    },
    build(el) {
        const who = map[map.length] = levelElements.matterBody(el, { friction: el.friction, restitution: el.restitution })
        if (!levelElements.collision.isDefault(el)) who.collisionMask = levelElements.collision.mask(el.collides) //level.addToWorld() uses it in place of the usual mask
        if (!el.link && !el.orLink) return
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
        return { setup, custom: [`level.setMapPart(${name}, ${el.on === "appears" ? link.on : link.off}); //${el.on === "appears" ? "appears" : "disappears"} while it's on`] }
    },
})

levelElements.define("block", {
    isSnappable: true,
    group: "shape",
    color: "rgba(140,140,140,0.85)",
    defaults: () => ({ x: 0, y: 0, width: 50, height: 50, density: 0.001, friction: 0.05, frictionStatic: 0.5, frictionAir: 0.001, restitution: 0, velocityX: 0, velocityY: 0, hasForce: false, force: 0.5, forceAngle: 0, forceMode: "steady", forcePeriod: 120, carryPlayer: true, holdable: true, noSpin: false, immutable: false, collides: levelElements.collision.defaults.block, chance: 1 }),
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
        levelElements.prop.number("force", { step: 0.1, tip: "how hard it pushes each moment, 1 is as strong as gravity, any size of block moves the same", isShown: el => el.hasForce }),
        levelElements.prop.number("forceAngle", { step: 15, tip: "the way it pushes in degrees, 0 is right, 90 is up", isShown: el => el.hasForce }),
        levelElements.prop.select("forceMode", ["steady", "wave"], { tip: "steady always pushes, wave pushes back and forth, on a constraint it swings", isShown: el => el.hasForce }),
        levelElements.prop.number("forcePeriod", { step: 10, min: 2, tip: "frames for one push there and back, 60 is a second, on a constraint a period near how long it takes to swing builds up the biggest swing", isShown: el => el.hasForce && el.forceMode === "wave" }),
        levelElements.prop.bool("carryPlayer", { label: "carry player", tip: "the player standing on it moves along with it", isShown: el => el.hasForce }),
        levelElements.prop.bool("holdable"), //false is isNotHoldable, the field can't pick it up
        levelElements.prop.bool("noSpin"), //inertia Infinity, it slides but never turns
        levelElements.prop.bool("immutable"), //isImmutable, like a key, tech can't destroy, split, grow, or freeze it, and falling out of the level brings it back instead of removing it
        levelElements.prop.mask("collides"),
        levelElements.prop.number("chance", { step: 0.1, min: 0, isShown: el => !levelElements.isHeld(el) }), //of showing up each time the level loads, like spawn.bodyRect's chance, always shows in the editor, a block a constraint holds always shows up
    ],
    overlay(el) { //an arrow the way a force pushes, both ways for a wave, and blocks that don't always show up are labeled with their chance
        const b = levelElements.bounds(el)
        if (el.hasForce && el.force) {
            const middle = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
            const sign = Math.sign(el.force)
            const d = { x: sign * Math.cos(el.forceAngle * Math.PI / 180), y: -sign * Math.sin(el.forceAngle * Math.PI / 180) }
            const length = Math.max(b.width, b.height) / 2 + 20 + 40 * Math.min(2, Math.abs(el.force))
            const head = direction => {
                const tip = { x: middle.x + direction * d.x * length, y: middle.y + direction * d.y * length }
                ctx.moveTo(tip.x - direction * 12 * d.x - 8 * d.y, tip.y - direction * 12 * d.y + 8 * d.x)
                ctx.lineTo(tip.x, tip.y)
                ctx.lineTo(tip.x - direction * 12 * d.x + 8 * d.y, tip.y - direction * 12 * d.y - 8 * d.x)
            }
            const isWave = el.forceMode === "wave"
            ctx.setLineDash([])
            ctx.beginPath()
            ctx.moveTo(middle.x - (isWave ? d.x * length : 0), middle.y - (isWave ? d.y * length : 0))
            ctx.lineTo(middle.x + d.x * length, middle.y + d.y * length)
            head(1)
            if (isWave) head(-1)
            ctx.lineWidth = 2
            ctx.strokeStyle = "rgba(0,110,190,0.7)"
            ctx.stroke()
        }
        if (el.chance >= 1 || levelElements.isHeld(el)) return
        ctx.font = `${Math.max(14, Math.min(40, b.height * 0.4))}px monospace`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        ctx.fillText(`${Math.round(el.chance * 100)}%`, b.x + b.width / 2, b.y + b.height / 2)
        ctx.textBaseline = "alphabetic"
        ctx.textAlign = "left"
    },
    build(el, options) { //like spawn.bodyRect
        if (!options.isEditor && el.chance < 1 && !levelElements.isHeld(el) && Math.random() >= el.chance) return
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
        if (!el.hasForce) return
        const push = level.pushBody(who, el.force, el.forceAngle * Math.PI / 180, el.forceMode === "wave" ? el.forcePeriod : 0, el.carryPlayer)
        return { custom() { push.do() } }
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
        const forceName = `${name}Force`
        const hasChance = el.chance < 1 && !isHeld
        if (el.hasForce) { //angle in radians, written as degrees like a laser's, the period only for a wave, and carrying the player after it
            const isWave = el.forceMode === "wave"
            const period = isWave || el.carryPlayer ? `, ${isWave ? levelElements.args(el.forcePeriod) : 0}` : ""
            const carry = el.carryPlayer ? ", true" : ""
            setup.push(`${hasChance ? "" : "const "}${forceName} = level.pushBody(body[body.length - 1], ${levelElements.args(el.force)}, ${levelElements.args(el.forceAngle)} * Math.PI / 180${period}${carry});`)
        }
        const force = el.hasForce ? { custom: [`${hasChance ? `if (${forceName}) ` : ""}${forceName}.do();`] } : {}
        if (isHeld) setup.push(`const ${name} = body[body.length - 1];`)
        if (el.chance >= 1 || isHeld) return { setup, ...force }
        if (setup.length === 1 && !el.vertices) { //spawn.bodyRect has a chance argument
            setup[0] = isDefault ? setup[0].replace(/\);$/, `, ${levelElements.args(el.chance)});`) : setup[0].replace(", 1, {", `, ${levelElements.args(el.chance)}, {`)
            return { setup }
        }
        return { setup: [...(el.hasForce ? [`let ${forceName} = null;`] : []), `if (Math.random() < ${levelElements.args(el.chance)}) {`, ...setup.map(line => "    " + line), "}"], ...force }
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
    isSnappable: true,
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
    flip(el, axis, center) { //where it launches mirrors, the pad stays flat
        levelElements.flipPosition(el, axis, center)
        el.angle = levelElements.flipAngle(el.angle, axis)
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
    isSnappable: true,
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
    isSnappable: true,
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
    isSnappable: true,
    tip: "platform that rises and falls, or only when the player stands on it with onTouch, linked it only starts a trip while on",
    group: "element",
    handlesLink: true, //while off it finishes its trip and waits at the bottom, without move() it would fall through the map
    writesLink: true, //its code() uses context.link
    defaults: () => ({ x: 0, y: -25, width: 200, height: 25, travel: 500, force: 0.003, onTouch: false }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("travel", { isGrid: true, min: 0 }), //how far up it goes
        levelElements.prop.number("force", { step: 0.0005, min: 0 }),
        levelElements.prop.bool("onTouch"),
    ],
    build(el) {
        const elevator = level.elevator(el.x, el.y, el.width, el.height, el.y - el.travel, el.force)
        return {
            custom() {
                const isOn = levelData.linkOn(el) !== false
                if (el.onTouch) {
                    elevator.moveOnTouch(isOn)
                } else {
                    elevator.move(isOn)
                }
            },
        }
    },
    overlay(el) {
        ctx.strokeRect(el.x, el.y - el.travel, el.width, el.height + el.travel)
    },
    code(el, name, context) {
        const link = context && context.link(el)
        return {
            setup: [`const ${name} = level.elevator(${levelElements.args(el.x, el.y, el.width, el.height, el.y - el.travel, el.force)});`],
            custom: [`${name}.${el.onTouch ? "moveOnTouch" : "move"}(${link ? link.on : ""});`],
        }
    },
})

levelElements.define("vanish", { //platform that shrinks away after the player touches it, then comes back
    isSnappable: true,
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
    isSnappable: true,
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
    isMirrorSymmetric: true, //mirrored it's the same as turned, so one alone has rotate and no flip buttons, flip() still turns it right in a flipped selection
    flip(el, axis, center) { //a bar looks the same turned 180°, so mirroring only turns it the other way
        levelElements.flipPosition(el, axis, center)
        el.angle = Number((-el.angle).toFixed(3))
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
    writesLink: true, //its code() uses context.link
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
    flip: (el, axis, center) => levelElements.flipEnds(el, axis, center, [["x", "y"], ["x2", "y2"]]),
    overlay(el) {
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x2, el.y2)
        ctx.stroke()
    },
}

levelElements.laserAngle = el => { //the laser's angle now, radians: where x2, y2 points, plus spin and swing, by simulation.cycle like written levels' oscillating lasers
    let angle = Math.atan2(el.y2 - el.y, el.x2 - el.x)
    if (el.spin) angle += el.spin * Math.PI / 180 / 60 * simulation.cycle
    if (el.swing) angle += el.swing * Math.PI / 180 * Math.sin(2 * Math.PI / el.swingTime * simulation.cycle)
    return angle
}
levelElements.laserStyles = { beam: "#ff0000", arc: "#46aaff" } //the top of its info box switches them, each with the color it starts with
levelElements.define("laser", {
    tip: "beam between two points that hurts the player, drag either end, the top of its info box makes it an arc of electricity that hits a little wider, spin and swing turn it around x, y, motion makes it a motion sensor",
    group: "element",
    defaults: () => ({ x: 0, y: -300, x2: 400, y2: -300, damage: 0.12, color: levelElements.laserStyles.beam, style: "beam", spin: 0, swing: 0, swingTime: 240, motion: false }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("x2", { isGrid: true }),
        levelElements.prop.number("y2", { isGrid: true }),
        levelElements.prop.number("damage", { step: 0.02, min: 0 }),
        levelElements.prop.color("color"),
        levelElements.prop.number("spin", { step: 15 }), //degrees a second around x, y
        levelElements.prop.number("swing", { step: 5, min: 0 }), //degrees each way
        levelElements.prop.number("swingTime", { step: 30, min: 10, isShown: el => el.swing > 0 }), //frames for one swing there and back
        levelElements.prop.bool("motion"), //level.laser's motionQuery()
    ],
    ...levelElements.segment,
    flip(el, axis, center) { //the ends mirror, and it spins the other way
        levelElements.segment.flip(el, axis, center)
        if (el.spin) el.spin = -el.spin
    },
    overlay(el) { //the line, and where it turns: a circle for spin, the two ends of a swing
        levelElements.segment.overlay(el)
        if (!el.spin && !el.swing) return
        const length = Math.hypot(el.x2 - el.x, el.y2 - el.y)
        const base = Math.atan2(el.y2 - el.y, el.x2 - el.x)
        const reach = el.swing * Math.PI / 180
        ctx.save()
        ctx.setLineDash([12, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(255,0,0,0.35)"
        ctx.beginPath()
        if (el.spin) {
            ctx.arc(el.x, el.y, length, 0, 2 * Math.PI)
        } else {
            for (const side of [-1, 1]) {
                ctx.moveTo(el.x, el.y)
                ctx.lineTo(el.x + length * Math.cos(base + side * reach), el.y + length * Math.sin(base + side * reach))
            }
            ctx.moveTo(el.x + length * Math.cos(base - reach), el.y + length * Math.sin(base - reach))
            ctx.arc(el.x, el.y, length, base - reach, base + reach)
        }
        ctx.stroke()
        ctx.restore()
    },
    summary: el => `laser(${[el.x, el.y, el.x2, el.y2].map(n => Number(n.toFixed(2))).join(", ")})`,
    build(el) {
        const laser = level.laser({ x: el.x, y: el.y }, { x: el.x2, y: el.y2 }, el.damage, el.color)
        laser.isArc = el.style === "arc"
        const length = Math.hypot(el.x2 - el.x, el.y2 - el.y)
        return {
            custom() {
                if (el.spin || el.swing) {
                    const angle = levelElements.laserAngle(el)
                    laser.look = { x: el.x + length * Math.cos(angle), y: el.y + length * Math.sin(angle) }
                }
                if (el.motion) laser.motionQuery()
                else laser.query()
            },
        }
    },
    code(el, name) {
        const a = levelElements.args
        const custom = []
        if (el.spin || el.swing) { //like written levels' oscillating lasers
            const length = Math.hypot(el.x2 - el.x, el.y2 - el.y)
            const base = Math.atan2(el.y2 - el.y, el.x2 - el.x)
            const parts = base ? [a(base)] : [] //pointing right is 0
            if (el.spin) parts.push(`${a(el.spin * Math.PI / 180 / 60)} * simulation.cycle`)
            if (el.swing) parts.push(`${a(el.swing * Math.PI / 180)} * Math.sin(${a(2 * Math.PI / el.swingTime)} * simulation.cycle)`)
            custom.push(`const ${name}Angle = ${parts.join(" + ")};`, `${name}.look = { x: ${a(el.x)} + ${a(length)} * Math.cos(${name}Angle), y: ${a(el.y)} + ${a(length)} * Math.sin(${name}Angle) };`)
        }
        custom.push(el.motion ? `${name}.motionQuery();` : `${name}.query();`)
        return {
            setup: [`const ${name} = level.laser({ x: ${a(el.x)}, y: ${a(el.y)} }, { x: ${a(el.x2)}, y: ${a(el.y2)} }, ${a(el.damage)}${el.color === levelElements.laserStyles.beam ? "" : `, ${a(el.color)}`});`, ...(el.style === "arc" ? [`${name}.isArc = true; //electricity, hits a little wider`] : [])],
            custom,
        }
    },
})

levelElements.sawRoute = (el, data) => { //{ points, isLoop, start, at }, the buzzsaw's path as short straight lines, and how far along and where it's closest to x, y, that's where it starts, with no path it stays at x, y
    const path = el.path && data ? levelData.find(data, el.path) : null
    if (!path || path.type !== "path") return { points: [[el.x, el.y]], isLoop: false, start: 0, at: { x: el.x, y: el.y } }
    const outline = levelElements.pathOutline(path)
    const route = path.closed ? [...outline, outline[0]] : outline
    let along = 0
    let best = { start: 0, at: route[0], distance: Infinity }
    for (let i = 0; i < route.length - 1; i++) {
        const a = route[i]
        const b = route[i + 1]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const length = Math.hypot(dx, dy)
        const t = Math.max(0, Math.min(1, ((el.x - a.x) * dx + (el.y - a.y) * dy) / (length * length || 1)))
        const at = { x: a.x + t * dx, y: a.y + t * dy }
        const distance = Math.hypot(el.x - at.x, el.y - at.y)
        if (distance < best.distance) best = { start: along + t * length, at, distance }
        along += length
    }
    return { points: outline.map(p => [p.x, p.y]), isLoop: !!path.closed, start: best.start, at: best.at }
}
levelElements.define("buzzsaw", { //level.buzzsaw
    tip: "spinning blade that hurts the player, give it a path to travel: draw one with its path's draw button, or pick a draw path you've made, it goes back and forth along it, around and around on a closed path, without one it stays put, linked it only runs while on",
    group: "element",
    handlesLink: true, //off it stops where it is, it doesn't disappear
    writesLink: true, //its code() uses context.link
    rebuildWithRefs: true, //it follows the path as it was when it was built
    outlivesRefs: true, //deleting its path leaves it where it is, a constraint goes with its block
    defaults: () => ({ x: 0, y: -200, radius: 40, path: null, speed: 4, damage: 0.1, spin: 0.25, look: "blade" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("radius", { isGrid: true, min: 5 }),
        levelElements.prop.ref("path", ["path"], {
            write(el, id) { //goes to the closest spot on the new path, so it's where it'll start
                el.path = id
                const { at } = levelElements.sawRoute(el, levelData.data)
                el.x = Math.round(at.x)
                el.y = Math.round(at.y)
            },
        }),
        levelElements.prop.number("speed", { step: 1, min: 0 }),
        levelElements.prop.number("damage", { step: 0.01, min: 0 }),
        levelElements.prop.number("spin", { step: 0.05 }),
        levelElements.prop.select("look", Object.keys(level.buzzsawLooks)),
    ],
    bounds: el => ({ x: el.x - el.radius, y: el.y - el.radius, width: 2 * el.radius, height: 2 * el.radius }),
    contains: (el, p) => Math.hypot(p.x - el.x, p.y - el.y) <= el.radius,
    handles: el => [{ id: "radius", x: el.x + el.radius, y: el.y }],
    dragHandle(el, id, point) { el.radius = Math.max(5, Math.round(Math.hypot(point.x - el.x, point.y - el.y))) },
    overlay(el) { //where it starts, it's moving along its path while editing, and a line to the path if it's been dragged off
        const { at } = levelElements.sawRoute(el, levelData.data)
        ctx.beginPath()
        ctx.arc(at.x, at.y, el.radius, 0, 2 * Math.PI)
        if (Math.hypot(el.x - at.x, el.y - at.y) > 1) {
            ctx.moveTo(el.x + el.radius, el.y)
            ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI)
            ctx.moveTo(el.x, el.y)
            ctx.lineTo(at.x, at.y)
        }
        ctx.stroke()
    },
    build(el) {
        const { points, isLoop, start } = levelElements.sawRoute(el, levelData.data)
        const saw = level.buzzsaw(points, el.radius, el.speed, el.damage, el.spin, isLoop, start, el.look)
        return {
            containsPoint: point => Math.hypot(point.x - saw.position.x, point.y - saw.position.y) <= el.radius, //clicking the moving blade selects it
            custom() { saw.query(levelData.linkOn(el) !== false) },
            top() { saw.draw() },
        }
    },
    code(el, name, context) {
        const link = context && context.link(el)
        const route = levelElements.sawRoute(el, context ? context.data : levelData.data)
        const round = n => Math.round(n * 10) / 10
        const args = [el.radius, el.speed, el.damage, el.spin, route.isLoop, round(route.start), el.look || "blade"]
        const defaults = [40, 4, 0.1, 0.25, false, 0, "blade"]
        while (args.length && args[args.length - 1] === defaults[args.length - 1]) args.pop() //leave out what's the default
        return {
            setup: [`const ${name} = level.buzzsaw(${JSON.stringify(route.points.map(p => p.map(round)))}${args.length ? `, ${levelElements.args(...args)}` : ""});`],
            custom: [`${name}.query(${link ? link.on : ""});`],
            top: [`${name}.draw();`],
        }
    },
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

levelElements.define("oneWay", { //level.oneWay, x, y, width, height is its rect before it's turned, it turns around the middle
    isSnappable: true,
    label: "one way",
    tip: "platform things go through from behind and land on from the front, angle is the way its front faces, 90 is up, hold down on it to drop through, bullets pass both ways",
    group: "element",
    defaults: () => ({ x: 0, y: -200, width: 300, height: 20, angle: 90 }),
    props: [...levelElements.rect(), levelElements.prop.number("angle", { step: 15 })], //degrees, counterclockwise like boost
    turned(el) { //its center, along its length, and out its front, on screen
        const a = el.angle * Math.PI / 180
        return { c: { x: el.x + el.width / 2, y: el.y + el.height / 2 }, u: { x: Math.sin(a), y: Math.cos(a) }, n: { x: Math.cos(a), y: -Math.sin(a) } }
    },
    outlinePoints(el) { //its corners turned, what the editor outlines
        const { c, u, n } = this.turned(el)
        const w = el.width / 2, h = el.height / 2
        return [[-w, h], [w, h], [w, -h], [-w, -h]].map(([along, out]) => ({ x: c.x + u.x * along + n.x * out, y: c.y + u.y * along + n.y * out }))
    },
    bounds(el) { return levelElements.boundsOf(this.outlinePoints(el)) },
    contains(el, point) { return levelElements.isInside(this.outlinePoints(el), point) },
    handles(el) { //its two ends for length, its front and back for thickness
        const { c, u, n } = this.turned(el)
        const w = el.width / 2, h = el.height / 2
        return [{ id: "e", x: c.x + u.x * w, y: c.y + u.y * w }, { id: "w", x: c.x - u.x * w, y: c.y - u.y * w }, { id: "n", x: c.x + n.x * h, y: c.y + n.y * h }, { id: "s", x: c.x - n.x * h, y: c.y - n.y * h }]
    },
    dragHandle(el, id, point, min) { //the other side stays put
        const { c, u, n } = this.turned(el)
        const axis = id === "e" || id === "w" ? u : n
        const sign = id === "e" || id === "n" ? 1 : -1
        const key = axis === u ? "width" : "height"
        const fixed = { x: c.x - sign * axis.x * el[key] / 2, y: c.y - sign * axis.y * el[key] / 2 }
        const size = Math.max(min, sign * ((point.x - fixed.x) * axis.x + (point.y - fixed.y) * axis.y))
        const center = { x: fixed.x + sign * axis.x * size / 2, y: fixed.y + sign * axis.y * size / 2 }
        el[key] = Number(size.toFixed(3))
        el.x = Number((center.x - el.width / 2).toFixed(3))
        el.y = Number((center.y - el.height / 2).toFixed(3))
    },
    rotate(el, degrees, center) {
        levelElements.orbit(el, degrees, center)
        el.angle = Number((el.angle - degrees).toFixed(3))
    },
    flip(el, axis, center) {
        levelElements.flipPosition(el, axis, center)
        el.angle = levelElements.flipAngle(el.angle, axis)
    },
    build(el) {
        const platform = level.oneWay(el.x, el.y, el.width, el.height, el.angle * Math.PI / 180)
        return {
            custom() {
                platform.query()
                platform.draw()
            },
            remove() { platform.remove() },
        }
    },
    code(el, name) {
        const extra = el.angle !== 90 ? `, ${levelElements.args(el.height)}, ${levelElements.args(el.angle)} * Math.PI / 180` : el.height !== 20 ? `, ${levelElements.args(el.height)}` : ""
        return {
            setup: [`const ${name} = level.oneWay(${levelElements.args(el.x, el.y, el.width)}${extra});`],
            custom: [`${name}.query();`, `${name}.draw();`],
        }
    },
})

levelElements.define("gravityZone", { //level.gravityZone
    label: "gravity",
    tip: "changes gravity inside for the player, blocks, and power ups, 0 floats, 0.5 is half, negative falls up, uncheck visible to hide it from players, linked it only pulls while on",
    group: "element",
    handlesLink: true, //off it still draws its box
    writesLink: true, //its code() uses context.link
    defaults: () => ({ x: 0, y: -500, width: 500, height: 500, gravity: 0, visible: true }),
    props: [
        ...levelElements.rect(),
        levelElements.prop.number("gravity", { step: 0.25 }),
        levelElements.prop.bool("visible", { tip: "unchecked, players don't see the zone or its arrows, the editor still outlines it" }),
    ],
    overlay(el) { //an invisible zone gets a dashed outline in the editor
        if (el.visible) return
        ctx.setLineDash([10, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = el.gravity < 0 ? "rgba(255,90,0,0.5)" : "rgba(120,0,255,0.45)"
        ctx.strokeRect(el.x, el.y, el.width, el.height)
        ctx.setLineDash([])
    },
    build(el) {
        const zone = level.gravityZone(el.x, el.y, el.width, el.height, el.gravity)
        return {
            custom() {
                zone.do(levelData.linkOn(el) !== false)
                if (el.visible) zone.draw()
            },
        }
    },
    code(el, name, context) {
        const link = context && context.link(el)
        return {
            setup: [`const ${name} = level.gravityZone(${levelElements.args(el.x, el.y, el.width, el.height)}${el.gravity === 0 ? "" : `, ${levelElements.args(el.gravity)}`});`],
            custom: [`${name}.do(${link ? link.on : ""});`, ...(el.visible ? [`${name}.draw();`] : [])],
        }
    },
})

levelElements.define("dispenser", { //level.dispenser, x, y is where blocks show up, its back plate goes against a wall
    isSnappable: true, //its back plate snaps flush to a wall or ceiling
    tip: "makes a block every period cycles (60 is a second) until max of its blocks are in the level, angle is the way they come out, 90 is up, put its back plate on a wall, speed launches them, it waits while the spot is blocked, linked it only makes blocks while on",
    group: "element",
    handlesLink: true, //off it still draws its mount
    writesLink: true, //its code() uses context.link
    defaults: () => ({ x: 0, y: -400, size: 50, period: 180, max: 3, angle: -90, speed: 0, collides: levelElements.collision.defaults.dispenser }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("size", { step: 5, min: 10 }), //each block is size × size
        levelElements.prop.number("period", { step: 30, min: 1 }),
        levelElements.prop.number("max", { step: 1, min: 1 }),
        levelElements.prop.number("angle", { step: 15 }), //degrees, counterclockwise like boost, -90 is down
        levelElements.prop.number("speed", { step: 1, min: 0 }),
        levelElements.prop.mask("collides", { tip: "what its blocks bump into, click a name to turn it off, crossed out names go through them" }),
    ],
    outlinePoints(el) { //its mount turned to face angle, the back plate behind the block, like level.dispenser draws it
        const a = el.angle * Math.PI / 180
        const out = { x: Math.cos(a), y: -Math.sin(a) } //the way blocks come out
        const side = { x: -Math.sin(a), y: -Math.cos(a) }
        const r = el.size / 2 + 10
        return [[-r, -r - 10], [r, -r - 10], [r, r], [-r, r]].map(([across, along]) => ({ x: el.x + side.x * across + out.x * along, y: el.y + side.y * across + out.y * along }))
    },
    bounds(el) { return levelElements.boundsOf(this.outlinePoints(el)) },
    contains(el, point) { return levelElements.isInside(this.outlinePoints(el), point) },
    rotate(el, degrees, center) { //turns around the block's spot, so it stays where blocks show up
        const before = { x: el.x, y: el.y }
        const to = levelElements.rotatePoint(before, center, degrees)
        el.x = to.x
        el.y = to.y
        el.angle = Number((el.angle - degrees).toFixed(3))
    },
    pivot: el => ({ x: el.x, y: el.y }),
    flip(el, axis, center) {
        const to = levelElements.flipPoint(el, axis, center)
        el.x = to.x
        el.y = to.y
        el.angle = levelElements.flipAngle(el.angle, axis)
    },
    overlay(el) { //an arrow the way blocks come out
        const a = el.angle * Math.PI / 180
        const d = { x: Math.cos(a), y: -Math.sin(a) }
        const from = { x: el.x + d.x * (el.size / 2 + 14), y: el.y + d.y * (el.size / 2 + 14) }
        const tip = { x: from.x + d.x * 40, y: from.y + d.y * 40 }
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(tip.x, tip.y)
        ctx.moveTo(tip.x - 10 * d.x - 7 * d.y, tip.y - 10 * d.y + 7 * d.x)
        ctx.lineTo(tip.x, tip.y)
        ctx.lineTo(tip.x - 10 * d.x + 7 * d.y, tip.y - 10 * d.y - 7 * d.x)
        ctx.stroke()
    },
    build(el) {
        const dispenser = level.dispenser(el.x, el.y, el.size, el.period, el.max, el.angle * Math.PI / 180, el.speed)
        if (!levelElements.collision.isDefault(el)) dispenser.collisionMask = levelElements.collision.mask(el.collides)
        return {
            custom() {
                dispenser.query(levelData.linkOn(el) !== false)
                dispenser.draw()
            },
            remove() { dispenser.remove() },
        }
    },
    code(el, name, context) {
        const link = context && context.link(el)
        const values = [el.size, el.period, el.max, `${levelElements.args(el.angle)} * Math.PI / 180`, el.speed]
        const isDefault = [el.size === 50, el.period === 180, el.max === 3, el.angle === -90, !el.speed]
        let count = values.length
        while (count && isDefault[count - 1]) count-- //leave out the defaults at the end
        const extra = values.slice(0, count).map(v => typeof v === "string" ? v : levelElements.args(v))
        return {
            setup: [`const ${name} = level.dispenser(${[levelElements.args(el.x, el.y), ...extra].join(", ")});`, ...(levelElements.collision.isDefault(el) ? [] : [`${name}.collisionMask = ${levelElements.collision.code(el.collides)}; //what its blocks bump into`])],
            custom: [`${name}.query(${link ? link.on : ""});`, `${name}.draw();`],
        }
    },
})

//buttons and toggles turn linked elements on and off, a linked element's link is the button's or toggle's id
//doors open while it's on, other linkable elements only run while it's on, or with runs: "while off" the other way, see levelData.linkOn() and levelData.code()
//a link source can be linked to another link source, then it's only on while both are, see levelData.linkState()
//a link source has linkOn(el, runtime), true while on, and linkCode(el, name), the javascript for on and off
levelElements.isLinkSource = el => !!levelElements.types[el.type]?.linkOn
levelElements.isCodeEditable = el => { //its code can be edited in the info box: not code, the entrance and exit, mob spots' shared list, or logic, its code is only a comment
    const type = levelElements.types[el.type] //code naming other elements, like a door's button or a constraint's block, keeps up with their names, see levelData.editedRefs()
    return !!type && !!type.code && !type.codeAll && !type.isCode && !type.isSingleton && type.canEditCode !== false
}
levelElements.runsProp = () => levelElements.prop.select("runs", ["while on", "while off"], { isShown: el => !!(el.link || el.orLink) }) //what a linked element does with its link, only shown once it has one
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
levelElements.triggerModes = ["button", "scale", "toggle"] //the add menu only has button, its info box switches between them, see the triggerMode command and levelElements.triggerMode()
levelElements.triggerMode = (el, typeName) => { //el's values as another of them, in the same spot on the floor, a toggle's y is 10 above a button's and a scale's is the same, what they don't share goes back to the defaults
    const floor = el.type === "toggle" ? el.y + 10 : el.y
    const stays = el.on === "stays down" || el.staysOn === true
    return {
        x: el.x,
        y: typeName === "toggle" ? floor - 10 : floor,
        log: el.log,
        link: el.link,
        orLink: el.orLink,
        ...(el.group ? { group: el.group } : {}),
        ...(stays && typeName === "button" ? { on: "stays down" } : {}),
        ...(stays && typeName === "toggle" ? { staysOn: true } : {}),
    }
}
levelElements.define("button", {
    isSnappable: true,
    modes: levelElements.triggerModes,
    tip: "pressed by the player or a block, linked doors open and linked elements run, on says when, the top of its info box switches it to a scale or a toggle",
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
    isSnappable: true,
    isAddedAs: "button", //not in the add menu, a button's info box turns it into one
    modes: levelElements.triggerModes,
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
        setup: [`const ${name} = level.toggle(${levelElements.args(el.x, el.y)}${el.isOn || el.staysOn ? `, ${!!el.isOn}` : ""}${el.staysOn ? ", true" : ""});${el.staysOn ? " //stays on once it's flipped" : ""}`],
        custom: [`${name}.query();`],
    }),
})

levelElements.define("keyhole", { //level.keyButton, a link source the matching key turns on
    isSnappable: true,
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
    isSnappable: true,
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
levelElements.define("zone", { //a trigger, a link source that's on while the player is inside, only the editor draws it, a box, or with circle a circle around x, y
    tip: "invisible box or circle, linked doors open and linked elements run while the player (or a block or mob) is inside, stays on once something has been in, check effects to push, slow, hurt, or drain what's inside",
    group: "element",
    isBackground: true, //it's often big, lock it so the mouse goes through
    defaults: () => ({ x: 0, y: -400, width: 400, height: 400, radius: 200, circle: false, who: "player", on: "inside", effects: false, force: 0, forceAngle: 90, drag: 0, damage: 0, energy: 0, affects: "player body bullet powerUp mob", visible: true }),
    props: [
        ...levelElements.rect().map(prop => prop.key === "width" || prop.key === "height" ? { ...prop, isShown: el => !el.circle } : prop),
        levelElements.prop.number("radius", { isGrid: true, min: 1, isShown: el => !!el.circle }),
        levelElements.prop.bool("circle", { write: (el, value) => levelElements.types.zone.setCircle(el, value) }),
        levelElements.prop.select("who", Object.keys(levelElements.zoneWho)),
        levelElements.prop.select("on", ["inside", "stays on"]), //stays on once it's been entered
        levelElements.prop.bool("effects", { tip: "does things to what's inside: pushes, slows, hurts, or drains energy, level.effectZone()" }), //off keeps the settings
        levelElements.prop.number("force", { step: 0.1, tip: "how hard it pushes what's inside, 1 is as strong as gravity for any size, negative pushes the other way", isShown: el => el.effects }),
        levelElements.prop.number("forceAngle", { step: 15, tip: "the way it pushes in degrees, 0 is right, 90 is up", isShown: el => el.effects && el.force !== 0 }),
        levelElements.prop.number("drag", { step: 0.01, min: 0, max: 1, tip: "air friction, the share of speed lost each frame, 0.02 is thick air, 0.1 is mud, 1 stops everything", isShown: el => el.effects }),
        levelElements.prop.number("damage", { step: 0.05, min: 0, tip: "damage each second to the player and mobs inside, 0.1 is a tenth of the player's health, it goes up with levels cleared like other hazards", isShown: el => el.effects }),
        levelElements.prop.number("energy", { step: 0.1, tip: "energy drained from the player each second, 1 is a full bar, negative charges it up to max", isShown: el => el.effects }),
        levelElements.prop.mask("affects", { names: ["player", "body", "mob", "bullet", "powerUp"], tip: "what the effects happen to, damage only hurts the player and mobs, energy is only the player's", isShown: el => el.effects }),
        levelElements.prop.bool("visible", { tip: "players see a tint, red for damage, blue for draining, green for charging, and arrows the way it pushes, the editor always draws it", isShown: el => el.effects }),
    ],
    setCircle(el, isCircle) { //a box becomes the circle in its middle, as big as the box on average, and back to the box around the circle, x, y is a circle's center
        if (!!el.circle === !!isCircle) return
        if (isCircle) {
            el.radius = Math.max(1, Math.round((el.width + el.height) / 4))
            el.x += el.width / 2
            el.y += el.height / 2
        } else {
            el.width = el.height = 2 * el.radius
            el.x -= el.radius
            el.y -= el.radius
        }
        el.circle = !!isCircle
    },
    bounds: el => el.circle ? { x: el.x - el.radius, y: el.y - el.radius, width: 2 * el.radius, height: 2 * el.radius } : { x: el.x, y: el.y, width: el.width, height: el.height },
    contains(el, p) {
        if (el.circle) return Math.hypot(p.x - el.x, p.y - el.y) <= el.radius
        return p.x >= el.x && p.x <= el.x + el.width && p.y >= el.y && p.y <= el.y + el.height
    },
    handles: el => el.circle ? [{ id: "radius", x: el.x + el.radius, y: el.y }] : levelElements.rectHandles(el),
    dragHandle(el, id, point, min) {
        if (id === "radius") return el.radius = Math.max(1, Math.round(Math.hypot(point.x - el.x, point.y - el.y)))
        const box = { x: el.x, y: el.y, width: el.width, height: el.height }
        levelElements.dragHandle(box, id, point, min) //a plain box, like any rect
        Object.assign(el, box)
    },
    summary: el => el.circle ? `zone(${levelElements.args(el.x, el.y, el.radius)})` : `zone(${levelElements.args(el.x, el.y, el.width, el.height)})`,
    overlay(el) {
        ctx.fillStyle = "rgba(255,80,80,0.06)"
        if (el.circle) {
            ctx.beginPath()
            ctx.arc(el.x, el.y, el.radius, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
        } else {
            ctx.fillRect(el.x, el.y, el.width, el.height)
            ctx.strokeRect(el.x, el.y, el.width, el.height)
        }
        levelElements.drawLinks(el, el.circle ? el : { x: el.x + el.width / 2, y: el.y + el.height / 2 })
    },
    linkOn: (el, runtime) => runtime.zone ? runtime.zone.isOn : null,
    linkCode: (el, name) => ({ on: `${name}.isOn`, off: `!${name}.isOn` }),
    affectsText: el => levelElements.collision.toggle(el.affects, "map", false).split(" ").filter(name => ["player", "body", "bullet", "powerUp", "mob"].includes(name)).join(" "), //only names it knows, it's written into code
    hasEffects: el => !!el.effects && (el.force !== 0 || el.drag > 0 || el.damage > 0 || el.energy !== 0) && !!levelElements.types.zone.affectsText(el),
    effectOptions(el) { //level.effectZone()'s options, only what isn't its default
        const options = {}
        if (el.force !== 0) {
            options.force = el.force
            if (el.forceAngle !== 90) options.angle = el.forceAngle
        }
        for (const key of ["drag", "damage", "energy"]) if (el[key] !== 0) options[key] = el[key]
        const affects = levelElements.types.zone.affectsText(el)
        if (affects !== "player body bullet powerUp mob") options.who = affects
        return options
    },
    build(el) {
        const who = levelElements.zoneWho[el.who] || levelElements.zoneWho.player
        const type = levelElements.types.zone
        const zone = el.circle ? { isOn: false, x: el.x, y: el.y, radius: el.radius } : { isOn: false, min: { x: el.x, y: el.y }, max: { x: el.x + el.width, y: el.y + el.height } }
        const check = el.circle ? () => who.list().some(body => Vector.magnitude(Vector.sub(body.position, zone)) < zone.radius) : () => Matter.Query.region(who.list(), zone).length > 0 //a circle has a body in once its center is
        const options = type.hasEffects(el) ? type.effectOptions(el) : null
        const effects = options && level.effectZone(zone, { ...options, angle: (options.angle ?? 90) * Math.PI / 180 })
        return {
            zone,
            custom() {
                if (el.on !== "stays on" || !zone.isOn) zone.isOn = check()
                if (!effects) return
                effects.do(levelData.linkState(el) !== false) //a zone linked to a trigger only does its effects while that's on
                if (el.visible) effects.draw()
            },
        }
    },
    code(el, name, context) {
        const who = levelElements.zoneWho[el.who] || levelElements.zoneWho.player
        const type = levelElements.types.zone
        const check = el.circle ? `${name}.isOn = ${who.code}.some(body => Vector.magnitude(Vector.sub(body.position, ${name})) < ${name}.radius);` : `${name}.isOn = Matter.Query.region(${who.code}, ${name}).length > 0;`
        const setup = [el.circle ? `const ${name} = { isOn: false, x: ${levelElements.args(el.x)}, y: ${levelElements.args(el.y)}, radius: ${levelElements.args(el.radius)} }; //trigger zone, a circle` : `const ${name} = { isOn: false, min: { x: ${levelElements.args(el.x)}, y: ${levelElements.args(el.y)} }, max: { x: ${levelElements.args(el.x + el.width)}, y: ${levelElements.args(el.y + el.height)} } }; //trigger zone`]
        const custom = [el.on === "stays on" ? `if (!${name}.isOn) ${check} //stays on once it's been entered` : check]
        if (type.hasEffects(el)) {
            const options = type.effectOptions(el)
            const fields = Object.entries(options).map(([key, value]) => key === "angle" ? `angle: ${levelElements.args(value)} * Math.PI / 180` : key === "who" ? `who: "${value}"` : `${key}: ${levelElements.args(value)}`)
            setup.push(`const ${name}Effects = level.effectZone(${name}${fields.length ? `, { ${fields.join(", ")} }` : ""});`)
            const link = (el.link || el.orLink) && context && context.link(el)
            custom.push(`${name}Effects.do(${link ? link.on : ""});`)
            if (el.visible) custom.push(`${name}Effects.draw();`)
        }
        return { setup, custom }
    },
})

levelElements.define("scale", { //level.scale, shaped like a button, a pad that's on while enough mass sits on it
    isSnappable: true,
    isAddedAs: "button", //not in the add menu, a button's info box turns it into one
    modes: levelElements.triggerModes,
    tip: "amber pad like a taller, wider button that's on while at least mass sits on it, its gauge fills as weight goes on, stacks count, the player is 5 and a 50 × 50 block is 2.5, linked doors open and linked elements run while it's on",
    group: "element",
    defaults: () => ({ x: 0, y: 0, width: 189, mass: 6 }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("width", { isGrid: true, min: 40 }), //the pad's, its sloped base is 104 wider
        levelElements.prop.number("mass", { step: 0.5, min: 0.1 }),
    ],
    bounds: el => ({ x: el.x - 50, y: el.y - 32, width: el.width + 104, height: 44 }), //the pad and its sloped base, a button's 10 taller, see level.scale()
    handles: el => [{ id: "w", x: el.x + 2, y: el.y - 21 }, { id: "e", x: el.x + 2 + el.width, y: el.y - 21 }], //only the pad's width resizes, it has no height
    dragHandle(el, id, point, min) { //the other end stays put
        const right = el.x + el.width
        if (id === "w") {
            el.x = Math.min(point.x - 2, right - Math.max(min, 40))
            el.width = right - el.x
        } else {
            el.width = Math.max(min, 40, point.x - 2 - el.x)
        }
    },
    overlay: el => levelElements.drawLinks(el, { x: el.x + el.width / 2, y: el.y - 20 }),
    linkOn: (el, runtime) => runtime.scale ? runtime.scale.isOn : null,
    linkCode: (el, name) => ({ on: `${name}.isOn`, off: `!${name}.isOn` }),
    build(el) {
        const scale = level.scale(el.x, el.y, el.width, el.mass)
        return {
            scale,
            custom() {
                scale.query()
                scale.draw()
            },
            remove() { scale.remove() }, //its gauge
        }
    },
    code(el, name) {
        const extra = el.mass !== 6 ? [el.width, el.mass] : el.width !== 189 ? [el.width] : []
        return {
            setup: [`const ${name} = level.scale(${levelElements.args(el.x, el.y, ...extra)});`],
            custom: [`${name}.query();`, `${name}.draw();`],
        }
    },
})

levelElements.waitingMobs = (el, data) => data.elements.filter(other => { //the linked mobs a mob clear counts, it can't be clear until they've spawned
    if (levelElements.types[other.type]?.group !== "mob" || (!other.link && !other.orLink) || other.edited) return false
    const isBoss = other.type === "boss" || other.type === "secondaryBoss" || (other.type === "namedMob" && typeof spawn !== "undefined" && spawn.bossTier.flat().includes(other.name))
    if (el.who === "bosses") return isBoss
    if (el.who === "level") return true
    return [[other.x, other.y], ...(other.spots || [])].some(([x, y]) => x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height)
})
levelElements.define("mobClear", { //level.cleared, on once the mobs are gone
    tip: "on once no mobs are left in its box, or in the whole level, or no bosses, stays on after, linked doors open and linked elements run, like an arena that opens when it's cleared",
    label: "mob clear",
    group: "element",
    isBackground: true, //it's often big, lock it so the mouse goes through
    defaults: () => ({ x: 0, y: -400, width: 600, height: 400, who: "box", on: "stays on" }),
    props: [
        ...levelElements.rect().map(prop => prop.key === "width" || prop.key === "height" ? { ...prop, isShown: el => el.who === "box" } : prop),
        levelElements.prop.select("who", ["box", "level", "bosses"]), //mobs in the box, every mob, or only bosses
        levelElements.prop.select("on", ["stays on", "while clear"]), //while clear turns off again if a mob comes back
    ],
    bounds: el => el.who === "box" ? { x: el.x, y: el.y, width: el.width, height: el.height } : { x: el.x - 30, y: el.y - 30, width: 60, height: 60 },
    handles: el => el.who === "box" ? levelElements.rectHandles(el) : [],
    summary: el => el.who === "box" ? `mobClear(${levelElements.args(el.x, el.y, el.width, el.height)})` : `mobClear(${el.who})`,
    overlay(el) { //the box, or a marker for the whole level or bosses, green once it's on
        const runtime = levelData.runtimes.get(el.id)
        const isOn = !!(runtime && runtime.mobClear && runtime.mobClear.isOn)
        const b = levelElements.bounds(el)
        ctx.setLineDash([10, 8])
        ctx.lineWidth = 2
        ctx.fillStyle = isOn ? "rgba(80,200,120,0.08)" : "rgba(150,40,120,0.06)"
        ctx.strokeStyle = isOn ? "rgba(80,200,120,0.6)" : "rgba(150,40,120,0.5)"
        if (el.who === "box") {
            ctx.fillRect(b.x, b.y, b.width, b.height)
            ctx.strokeRect(b.x, b.y, b.width, b.height)
        } else {
            ctx.beginPath()
            ctx.arc(el.x, el.y, 30, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
        }
        ctx.setLineDash([])
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "rgba(0,0,0,0.5)"
        ctx.fillText(el.who === "box" ? "mob clear" : el.who, b.x + b.width / 2, b.y + b.height / 2)
        ctx.textBaseline = "alphabetic"
        ctx.textAlign = "left"
        levelElements.drawLinks(el, { x: b.x + b.width / 2, y: b.y + b.height / 2 })
    },
    linkOn: (el, runtime) => runtime.mobClear ? runtime.mobClear.isOn : null,
    linkCode: (el, name) => ({ on: `${name}.isOn`, off: `!${name}.isOn` }),
    build(el) {
        const clear = level.cleared(el.x, el.y, el.width, el.height, el.who, el.on === "stays on")
        return {
            mobClear: clear,
            custom() {
                if (levelElements.waitingMobs(el, levelData.data).some(other => levelData.runtimes.get(other.id)?.isSpawned === false)) return //none spawned isn't clear
                clear.query()
            },
        }
    },
    code(el, name, context) {
        const waiting = context ? levelElements.waitingMobs(el, context.data).map(other => `${context.nameOf(other.id)}Spawned`) : []
        const args = el.on === "stays on" ? (el.who === "box" ? [el.x, el.y, el.width, el.height] : [el.x, el.y, el.width, el.height, el.who]) : [el.x, el.y, el.width, el.height, el.who, false]
        return {
            setup: [`const ${name} = level.cleared(${levelElements.args(...args)});${el.on === "stays on" ? "" : " //turns off again if a mob comes back"}`],
            custom: [`${waiting.length ? `if (${waiting.join(" && ")}) ` : ""}${name}.query();${waiting.length ? " //none spawned isn't clear" : ""}`],
        }
    },
})

levelElements.timerCode = el => `${el.offset ? `(simulation.cycle + ${levelElements.args(el.offset)})` : "simulation.cycle"} % ${levelElements.args(el.onTime + el.offTime)} < ${levelElements.args(el.onTime)}`
//a logic element is a link source that only combines other link sources, nothing to see in a run, link and orLink are its inputs, more inputs is one linked to another
levelElements.gates = { //what its gate setting can be, the inspector switches between them, needs is how many inputs it takes to be useful, see the analysis, path draws it in its 50 × 50 bounds
    and: {
        needs: 2,
        tip: "on while both of its inputs are on",
        textX: -3,
        path(x, y) { //flat on the left, round on the right
            ctx.moveTo(x - 25, y - 20)
            ctx.lineTo(x + 5, y - 20)
            ctx.arc(x + 5, y, 20, -Math.PI / 2, Math.PI / 2)
            ctx.lineTo(x - 25, y + 20)
        },
        isOn: inputs => inputs.length > 0 && inputs.every(Boolean),
        on: inputs => inputs.map(on => on.includes("||") ? `(${on})` : on).join(" && ") || "false",
    },
    or: {
        needs: 2,
        tip: "on while either of its inputs is on",
        textX: 0,
        path(x, y) { //a curved back and a point, like a plug
            ctx.moveTo(x - 25, y - 20)
            ctx.quadraticCurveTo(x + 5, y - 20, x + 25, y)
            ctx.quadraticCurveTo(x + 5, y + 20, x - 25, y + 20)
            ctx.quadraticCurveTo(x - 12, y, x - 25, y - 20)
        },
        isOn: inputs => inputs.some(Boolean),
        on: inputs => inputs.join(" || ") || "false",
    },
    not: {
        needs: 1,
        tip: "on while its input is off, with no input it's always on",
        textX: -9,
        path(x, y) { //a triangle pointing right
            ctx.moveTo(x - 25, y - 23)
            ctx.lineTo(x + 25, y)
            ctx.lineTo(x - 25, y + 23)
        },
        isOn: inputs => !inputs.some(Boolean),
        on: inputs => inputs.length ? `!(${inputs.join(" || ")})` : "true",
        off: inputs => inputs.join(" || ") || "false",
    },
    timer: {
        needs: 0,
        tip: "on for onTime cycles, then off for offTime, over and over, 60 cycles is a second, offset shifts when, with inputs it only runs while one is on",
        draw(el, isOn) { //a clock, the hand goes around once a period, green while on
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
            ctx.fillStyle = isOn ? "rgba(80,200,120,0.3)" : "rgba(255,255,255,0.4)"
            ctx.fill()
            ctx.moveTo(el.x, el.y)
            ctx.lineTo(el.x + 20 * Math.sin(2 * Math.PI * phase), el.y - 20 * Math.cos(2 * Math.PI * phase))
            ctx.lineWidth = 2
            ctx.strokeStyle = "rgba(0,0,0,0.6)"
            ctx.stroke()
        },
        isOn: (inputs, el) => (simulation.cycle + el.offset) % (el.onTime + el.offTime) < el.onTime && (!inputs.length || inputs.some(Boolean)),
        on: (inputs, el) => inputs.length ? `${levelElements.timerCode(el)} && ${inputs.length > 1 || inputs[0].includes("||") ? `(${inputs.join(" || ")})` : inputs[0]}` : levelElements.timerCode(el),
    },
}
levelElements.gateName = el => Object.hasOwn(levelElements.gates, el.gate) ? el.gate : "and"
levelElements.gateOf = el => levelElements.gates[levelElements.gateName(el)]
levelElements.define("logic", {
    canEditCode: false, //what's linked to it writes the check, its own code is only a comment, like a timer
    isGate: true,
    tip: "and, or, not, or timer, it turns triggers linked to it into one, or pulses on and off, link it to what they should run",
    group: "element",
    defaults: () => ({ x: 0, y: -200, gate: "and", onTime: 60, offTime: 60, offset: 0 }),
    props: [
        ...levelElements.position(),
        ...[["onTime", 1], ["offTime", 0], ["offset", 0]].map(([key, min]) => levelElements.prop.number(key, { step: 10, min, isShown: el => levelElements.gateName(el) === "timer" })),
    ],
    summary: el => `${levelElements.gateName(el)}(${levelElements.args(el.x, el.y)})`,
    overlay(el) { //its gate's shape with its name, green while on
        const gate = levelElements.gateOf(el)
        if (gate.draw) {
            gate.draw(el, levelElements.types.logic.linkOn(el))
            return levelElements.drawLinks(el, el)
        }
        ctx.setLineDash([])
        ctx.beginPath()
        gate.path(el.x, el.y)
        ctx.closePath()
        ctx.fillStyle = levelElements.types.logic.linkOn(el) ? "rgba(80,200,120,0.45)" : "rgba(255,255,255,0.5)"
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.5)"
        ctx.stroke()
        ctx.font = "16px monospace"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#000"
        ctx.fillText(levelElements.gateName(el), el.x + gate.textX, el.y)
        ctx.textBaseline = "alphabetic"
        levelElements.drawLinks(el, el)
    },
    linkOn: (el, runtime, depth = 0) => depth < 8 && levelElements.gateOf(el).isOn(levelData.linkInputs(el, depth + 1).filter(state => state !== null), el), //depth stops gates linked in a loop
    linkCode(el, name, context, depth = 0) {
        const gate = levelElements.gateOf(el)
        const inputs = context ? context.inputs(el, depth + 1) : []
        const on = gate.on(inputs, el)
        return { on, off: gate.off ? gate.off(inputs) : `!(${on})` }
    },
    build: () => ({}),
    code: (el, name, context) => ({ setup: [`//${name}: what's linked to it checks ${levelElements.types.logic.linkCode(el, name, context).on}`] }),
})

levelElements.define("door", {
    isSnappable: true,
    writesLink: true, //its code() uses context.link
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

for (const name of ["mover", "transport", "elevator", "vanish", "spinner", "door"]) { //what it bumps into, like a map's or block's, the wrappers only touch one that isn't the default, so the rest build and export the same as written levels
    const type = levelElements.types[name]
    const defaults = type.defaults
    const isInMap = name === "mover" //a map's mask is set by level.addToWorld(), so it needs collisionMask
    type.defaults = () => ({ ...defaults(), collides: levelElements.collision.defaults[name] })
    type.props.push(levelElements.prop.mask("collides"))
    const build = type.build
    type.build = (el, options) => {
        const list = isInMap ? map : body
        const before = list.length
        const runtime = build(el, options)
        if (!levelElements.collision.isDefault(el)) {
            const mask = levelElements.collision.mask(el.collides)
            for (const who of list.slice(before)) {
                who.collisionFilter.mask = mask
                if (isInMap) who.collisionMask = mask
            }
        }
        return runtime
    }
    const code = type.code
    type.code = (el, varName, context) => {
        const lines = code(el, varName, context)
        if (levelElements.collision.isDefault(el)) return lines
        const mask = levelElements.collision.code(el.collides)
        return { ...lines, setup: [...(lines.setup || []), isInMap ? `map[map.length - 1].collisionMask = ${mask}; //level.addToWorld() uses it in place of the usual mask` : `body[body.length - 1].collisionFilter.mask = ${mask};`] }
    }
}

levelElements.linkable = name => { //a link prop, so a button or toggle can turn it on and off, and runs, only shown once it's linked
    const type = levelElements.types[name]
    const defaults = type.defaults
    type.isLinkable = true
    type.defaults = () => ({ ...defaults(), link: null, orLink: null, runs: "while on" })
    type.props.push(levelElements.prop.ref("link", levelElements.linkSources), levelElements.orLinkProp(), levelElements.runsProp())
}
for (const name of ["boost", "mover", "transport", "elevator", "laser", "buzzsaw", "wind", "slime", "fizzler", "spinner", "gravityZone", "dispenser"]) levelElements.linkable(name)
for (const name of levelElements.linkSources) { //a link source linked to another is only on while both are, set with the other one's link button, the row only shows once it's set
    const type = levelElements.types[name]
    const defaults = type.defaults
    type.defaults = () => ({ ...defaults(), log: "", link: null, orLink: null })
    const inputTip = "a button, toggle, or other trigger, or another gate, this gate reads"
    type.props.push(levelElements.prop.text("log"), ...(type.isGate ? [ //a gate's links are what it's for, so they always show, a not only shows a second once it's set
        levelElements.prop.ref("link", levelElements.linkSources, { label: "input", tip: inputTip }),
        levelElements.prop.ref("orLink", levelElements.linkSources, { label: "input2", tip: inputTip, isShown: el => levelElements.gateOf(el).needs > 1 || (el.orLink !== null && el.orLink !== undefined) }),
    ] : [levelElements.prop.ref("link", levelElements.linkSources, { isShown: el => el.link !== null && el.link !== undefined }), levelElements.orLinkProp()]))
    const build = type.build
    type.build = (el, options) => { //with a log, writes it in the in-game console each time it turns on, not if it's on when the level starts
        const runtime = build(el, options)
        if (!String(el.log).trim()) return runtime
        const custom = runtime.custom
        let wasOn = null
        runtime.custom = () => {
            if (custom) custom.call(runtime)
            const isOn = type.linkOn(el, runtime) === true && (type.isGate || levelData.linkState(el) !== false) //and what it's linked to, a gate's links are its inputs
            if (wasOn === false && isOn) simulation.inGameConsole(levelData.safeHtml(el.log)) //html that can't run javascript
            wasOn = isOn
        }
        return runtime
    }
    const code = type.code
    type.code = (el, varName, context) => { //the same in export, a WasOn variable and two lines after its own custom lines
        const lines = code(el, varName, context)
        if (!String(el.log).trim()) return lines
        const own = type.linkCode(el, varName, context).on
        const above = !type.isGate && context && (el.link || el.orLink) ? context.link(el) : null //a gate's links are its inputs
        const on = above ? `${own} && ${above.on.includes("||") ? `(${above.on})` : above.on}` : own
        return {
            ...lines,
            setup: [...(lines.setup || []), `let ${varName}WasOn = null; //its log shows each time it turns on`],
            custom: [...(lines.custom || []), `if (${varName}WasOn === false && (${on})) simulation.inGameConsole(${levelElements.args(levelData.safeHtml(el.log))});`, `${varName}WasOn = ${on};`],
        }
    }
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
    flip(el, axis, center) { //both ends mirror, and face their mirrored way
        levelElements.flipEnds(el, axis, center, [["x", "y"], ["x2", "y2"]])
        el.angle = levelElements.flipAngle(el.angle, axis)
        el.angle2 = levelElements.flipAngle(el.angle2, axis)
    },
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
        const exit = !["straight", "launch"].includes(el.exit) ? "" : `, level.portalExit.${el.exit}, level.portalExit.${el.exit}`
        return {
            setup: [`const ${name} = level.portal(${end(el.x, el.y)}, ${levelElements.angleCode(el.angle)}, ${end(el.x2, el.y2)}, ${levelElements.angleCode(el.angle2)}${exit});`],
            custom: [`${name}.query();`],
            top: [`${name}.draw();`],
        }
    },
})

levelElements.layers = ["under player", "over player"] //a drawing's layer: level.custom under the player, blocks, and mobs, or level.customTopLayer over them, older saves say back and front, see levelData.normalize()
levelElements.isOver = el => el.layer === "over player"
levelElements.define("fill", { //colored rect drawn behind or in front of the player, like the fillRect shading in written levels, older saves call it decor, see levelData.normalize()
    isDrawing: true, //only drawn, to top and to bottom change what's on top
    tip: "colored rect drawn behind or in front of the player, for shading and backgrounds, rect, circle, or ellipse in its info box changes its shape",
    group: "element",
    label: "fill",
    rounds: ["fill", "circle", "ellipse"], //the info box switches between them, see the round command and levelElements.roundShape()
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: 0, y: -400, width: 400, height: 400, color: "rgba(0,0,0,0.1)", layer: "under player" }),
    names: ["exit fill"], //the add menu's exit fill button
    tips: {
        "exit fill": "the light cyan room color behind the exit, placed around the exit door",
    },
    preset(name, data) { //x and y place it, otherwise it goes in the middle of the view
        const exit = data && data.elements.find(el => el.type === "exit")
        const room = { width: 400, height: 350, color: "#d4f4f4", layer: "under player" } //the light cyan room behind the exit in written levels
        return exit ? { ...room, x: exit.x - 150, y: exit.y + 20 - room.height } : room
    },
    props: [...levelElements.rect(), levelElements.prop.color("color"), levelElements.prop.select("layer", levelElements.layers)],
    build(el) {
        const draw = () => {
            ctx.fillStyle = el.color
            ctx.fillRect(el.x, el.y, el.width, el.height)
        }
        return levelElements.isOver(el) ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = [`ctx.fillStyle = ${levelElements.args(el.color)};`, `ctx.fillRect(${levelElements.args(el.x, el.y, el.width, el.height)});`]
        return levelElements.isOver(el) ? { top: lines } : { custom: lines }
    },
})

levelElements.roundShape = (el, typeName) => { //a fill, circle, or ellipse's size as another of them, around the same middle: a rect fits the ellipse, a circle is as big as both radii on average
    const round = n => Number(n.toFixed(3))
    const half = el.type === "fill" ? { x: el.width / 2, y: el.height / 2 } : el.type === "circle" ? { x: el.radius, y: el.radius } : { x: el.radiusX, y: el.radiusY }
    const center = el.type === "fill" ? { x: el.x + half.x, y: el.y + half.y } : { x: el.x, y: el.y }
    if (typeName === "fill") return { x: round(center.x - half.x), y: round(center.y - half.y), width: round(2 * half.x), height: round(2 * half.y) } //an ellipse's turn is dropped
    if (typeName === "circle") return { ...center, radius: Math.max(1, Math.round((half.x + half.y) / 2)) }
    return { ...center, radiusX: round(half.x), radiusY: round(half.y), angle: el.angle || 0 }
}
levelElements.isNoColor = color => !color || color === "none" || color === "transparent"
//a path's curves: handles[i] is null for a corner, or [dx, dy] for a curved vertex, its handle out toward the next vertex, mirrored toward the one before
//the line between two vertices is a bezier from each end's handle, or straight when neither has one
levelElements.pathSegments = el => { //[{ a, c1, c2, b, isCurve }] in world space, works for any outline, maps have no handles so they're all straight
    const points = levelElements.points(el)
    const handles = el.handles || []
    const count = levelElements.isOpen(el) ? points.length - 1 : points.length
    const segments = []
    for (let i = 0; i < count; i++) {
        const j = (i + 1) % points.length
        const a = points[i]
        const b = points[j]
        const ha = handles[i]
        const hb = handles[j]
        segments.push({ a, b, c1: ha ? { x: a.x + ha[0], y: a.y + ha[1] } : a, c2: hb ? { x: b.x - hb[0], y: b.y - hb[1] } : b, isCurve: !!(ha || hb) })
    }
    return segments
}
levelElements.cubicAt = (s, t) => { //a point on a segment
    const u = 1 - t
    return {
        x: u * u * u * s.a.x + 3 * u * u * t * s.c1.x + 3 * u * t * t * s.c2.x + t * t * t * s.b.x,
        y: u * u * u * s.a.y + 3 * u * u * t * s.c1.y + 3 * u * t * t * s.c2.y + t * t * t * s.b.y,
    }
}
levelElements.pathOutline = el => { //world points along the path, each curve as 16 short lines, for clicking, bounds, and outlines
    const segments = levelElements.pathSegments(el)
    if (!segments.length) return levelElements.points(el)
    const points = [segments[0].a]
    for (const s of segments) {
        if (s.isCurve) for (let k = 1; k <= 16; k++) points.push(levelElements.cubicAt(s, k / 16))
        else points.push(s.b)
    }
    if (!levelElements.isOpen(el)) points.pop() //back at the start
    return points
}
levelElements.autoHandle = (el, index) => { //a smooth curve through the vertex, its handle along the line from the vertex before to the one after
    const points = levelElements.points(el)
    const isOpen = levelElements.isOpen(el)
    const p = points[index]
    const prev = points[index - 1] || (isOpen ? p : points[points.length - 1])
    const next = points[index + 1] || (isOpen ? p : points[0])
    const scale = prev === p || next === p ? 1 / 3 : 1 / 6 //an open path's ends point at their one neighbor
    const round = n => Math.round(n * 1000) / 1000
    return [round((next.x - prev.x) * scale), round((next.y - prev.y) * scale)]
}
levelElements.define("path", { //lines and shapes of any outline, drawn behind or in front of the player, the add menu's path button draws one point at a time
    isDrawing: true, //only drawn, to top and to bottom change what's on top
    tip: "draw lines or filled shapes, click to add points, drag while clicking to curve, click the first point to close it, enter or right click to finish, later double click a vertex to curve it or make it a corner",
    group: "element",
    label: "draw path",
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    isVertexEditable: true,
    hasCurves: true, //vertex editing shows handles, double click a vertex to curve it or make it a corner
    addCommand: "drawPath", //its add button draws instead of adding one
    defaults: () => ({ x: 0, y: -300, vertices: [[-200, 0], [200, 0]], handles: [], closed: false, fill: "none", stroke: "rgba(0,0,0,0.25)", lineWidth: 10, layer: "under player" }), //handles: see levelElements.pathSegments()
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
        levelElements.prop.select("layer", levelElements.layers),
    ],
    isOpen: el => !el.closed,
    contains(el, p) { //inside a filled path, or near its line
        const points = levelElements.pathOutline(el)
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
    bounds: el => levelElements.boundsOf(levelElements.pathOutline(el)), //around the curves
    outlinePoints: el => levelElements.pathOutline(el), //what the editor outlines when it's selected
    rotate(el, degrees, center) { //the outline and its handles turn
        levelElements.setPoints(el, levelElements.points(el).map(p => levelElements.rotatePoint(p, center, degrees)))
        el.handles = el.handles.map(h => {
            if (!h) return h
            const p = levelElements.rotatePoint({ x: h[0], y: h[1] }, { x: 0, y: 0 }, degrees)
            return [p.x, p.y]
        })
    },
    flip(el, axis, center) { //the outline and its handles mirror
        levelElements.setPoints(el, levelElements.points(el).map(p => levelElements.flipPoint(p, axis, center)))
        el.handles = el.handles.map(h => h && (axis === "x" ? [-h[0], h[1]] : [h[0], -h[1]]))
    },
    summary: el => `path(${levelElements.args(el.x, el.y)}, ${el.vertices.length} points${el.handles.some(Boolean) ? `, ${el.handles.filter(Boolean).length} curved` : ""})`,
    build(el) {
        const draw = () => {
            const segments = levelElements.pathSegments(el)
            const start = levelElements.points(el)[0]
            ctx.beginPath()
            ctx.moveTo(start.x, start.y)
            for (const s of segments) {
                if (s.isCurve) ctx.bezierCurveTo(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.b.x, s.b.y)
                else ctx.lineTo(s.b.x, s.b.y)
            }
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
        return levelElements.isOver(el) ? { top: draw } : { custom: draw }
    },
    code(el) {
        const a = levelElements.args
        const start = levelElements.points(el)[0]
        const segments = levelElements.pathSegments(el)
        if (el.closed && !segments[segments.length - 1].isCurve) segments.pop() //closePath draws the last straight line
        const lines = ["ctx.beginPath();", `ctx.moveTo(${a(start.x, start.y)});`, ...segments.map(s => s.isCurve ? `ctx.bezierCurveTo(${a(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.b.x, s.b.y)});` : `ctx.lineTo(${a(s.b.x, s.b.y)});`)]
        if (el.closed) lines.push("ctx.closePath();")
        if (el.closed && !levelElements.isNoColor(el.fill)) lines.push(`ctx.fillStyle = ${levelElements.args(el.fill)};`, "ctx.fill();")
        if (!levelElements.isNoColor(el.stroke) && el.lineWidth > 0) lines.push(`ctx.strokeStyle = ${levelElements.args(el.stroke)};`, `ctx.lineWidth = ${levelElements.args(el.lineWidth)};`, "ctx.stroke();")
        return levelElements.isOver(el) ? { top: lines } : { custom: lines }
    },
})

//*********************************************************************
levelElements.define("drip", { //level.drip, a drop that falls from x, y over and over
    isDrawing: true, //only drawn, to top and to bottom change what's on top
    tip: "a drop that falls over and over and disappears, length is how far, period is cycles between drops (60 is a second), it's only for looks",
    group: "element",
    defaults: () => ({ x: 0, y: -600, length: 600, period: 100, color: "hsla(160, 100%, 35%, 0.5)", layer: "under player" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("length", { isGrid: true, min: 10 }),
        levelElements.prop.number("period", { step: 10, min: 1 }),
        levelElements.prop.color("color"),
        levelElements.prop.select("layer", levelElements.layers),
    ],
    bounds: el => ({ x: el.x - 12, y: el.y - 12, width: 24, height: el.length + 24 }),
    handles: el => [{ id: "end", x: el.x, y: el.y + el.length }],
    dragHandle(el, id, point, min) { el.length = Math.max(min, 10, point.y - el.y) },
    overlay(el) { //the way it falls
        ctx.setLineDash([6, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.25)"
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x, el.y + el.length)
        ctx.stroke()
        ctx.setLineDash([])
    },
    build(el) {
        const drip = level.drip(el.x, el.y, el.y + el.length, el.period, el.color)
        const draw = () => drip.draw()
        return levelElements.isOver(el) ? { top: draw } : { custom: draw }
    },
    code(el, name) {
        const draw = [`${name}.draw();`]
        return { setup: [`const ${name} = level.drip(${levelElements.args(el.x, el.y, el.y + el.length, el.period, el.color)});`], ...(levelElements.isOver(el) ? { top: draw } : { custom: draw }) }
    },
})
//you can't touch these, so what reads as part of the room (a fan, a pipe) starts soft and see through, behind the map, weather and light can be brighter, players may never change the color
levelElements.decorations = { //level.decoration() as elements in the add menu's draw list, each also has a function in level.decorationKinds and a picture in levelEditor.elementIcons
    //width, height, and color are how it starts, isAnimated gives it a speed, isInFront starts it over the player, settings are its own, like a wire's count
    //parts is about how many shapes it draws a frame, for the analysis, without one it counts as 1, worked out from how long each took to paint in software, 1000 is about 3 ms there, big areas and long lines count since they're slow to paint
    wires: {
        label: "wires",
        tip: "wires hanging from its top corners, height is how far they sag, still wires are cheaper, with sway or speed at 0 they're only worked out once",
        width: 600,
        height: 80,
        color: "rgba(0,0,0,0.28)",
        isAnimated: true,
        parts: el => Math.min(12, el.count),
        settings: [
            { key: "count", value: 3, prop: { step: 1, min: 1, tip: "how many wires, up to 12" } },
            { key: "thickness", value: 2.5, prop: { step: 0.5, min: 0.5, tip: "how thick each wire is" } },
            { key: "spread", value: 7, prop: { step: 1, min: 0, tip: "how far apart they start, 0 is one bundle" } },
            { key: "droop", value: 0.2, prop: { step: 0.05, min: 0, tip: "how much less each wire after the first sags, 0 is all the same" } },
            { key: "sway", value: 3, prop: { step: 1, min: 0, tip: "how much they swing, 0 hangs still" } },
            { key: "tilt", value: 0, prop: { step: 25, tip: "how much lower the right end is, negative is higher" } },
            { key: "clamps", value: false, prop: { tip: "a bracket holding each end" } },
        ],
    },
    fan: { label: "fan", tip: "a spinning fan, it doesn't push anything, add wind for that", width: 150, height: 150, color: "rgba(0,0,0,0.16)", isAnimated: true },
    gear: { label: "gear", tip: "a slowly turning cog, a negative speed turns the other way", width: 200, height: 200, color: "rgba(0,0,0,0.14)", isAnimated: true },
    vent: { label: "vent", tip: "a frame with slats across it", width: 200, height: 120, color: "rgba(0,0,0,0.12)", parts: el => el.width * el.height / 20000 },
    piston: { label: "piston", tip: "a rod pumping up and down out of a cylinder", width: 120, height: 300, color: "rgba(0,0,0,0.15)", isAnimated: true },
    belt: { label: "belt", tip: "a drive belt on a big pulley and a small one, the small one spins faster", width: 400, height: 100, color: "rgba(0,0,0,0.2)", isAnimated: true },
    beacon: { label: "beacon", tip: "a warning light that pulses", width: 120, height: 120, color: "rgba(255,70,50,0.55)", isAnimated: true, parts: el => el.width * el.height / 20000 },
    panel: { label: "panel", tip: "a computer panel of blinking lights", width: 200, height: 120, color: "rgba(40,150,90,0.5)", isAnimated: true, parts: el => Math.min(280, el.width * el.height / 576) },
    pipe: { label: "pipe", tip: "a pipe with joints along its longer side", width: 500, height: 40, color: "rgba(0,0,0,0.15)" },
    truss: { label: "truss", tip: "a steel girder along its longer side", width: 600, height: 60, color: "rgba(0,0,0,0.18)" },
    grate: { label: "grate", tip: "a diagonal mesh in a frame", width: 300, height: 200, color: "rgba(0,0,0,0.12)", parts: el => Math.min(800, (el.width + el.height) * 1.5) },
    stripes: { label: "stripes", tip: "black and yellow hazard stripes", width: 400, height: 40, color: "rgba(190,145,20,0.3)", parts: el => el.width * el.height / 8000 },
    rain: { label: "rain", tip: "streaks of rain falling through its box, a bigger box draws more", width: 500, height: 500, color: "rgba(70,110,175,0.6)", isAnimated: true, isInFront: true, parts: el => Math.min(250, el.width * el.height / 2200) },
    snow: { label: "snow", tip: "flakes drifting down through its box, a bigger box draws more, on a dark background try white", width: 500, height: 500, color: "rgba(140,165,205,0.85)", isAnimated: true, isInFront: true, parts: el => Math.min(250, el.width * el.height / 3000) },
    sparks: { label: "sparks", tip: "sparks rising from the bottom of its box, a wider box draws more", width: 300, height: 300, color: "rgb(255,150,40)", isAnimated: true, isInFront: true, parts: el => Math.min(90, el.width / 5) },
    steam: { label: "steam", tip: "puffs rising from the bottom of its box, growing and fading, on a dark background try white", width: 120, height: 400, color: "rgba(125,130,140,0.4)", isAnimated: true, isInFront: true, parts: el => Math.min(14, el.height / 35) + el.width * el.height / 20000 },
    waves: { label: "waves", tip: "layers of moving water, only for looks, it doesn't push or hurt anything, big see through layers are the costliest to draw", width: 600, height: 150, color: "rgba(60,130,200,0.5)", isAnimated: true, parts: el => 3 * el.width * el.height / 20000 },
    grass: { label: "grass", tip: "blades of grass swaying from the bottom of its box, a wider box draws more", width: 500, height: 40, color: "rgba(60,120,60,0.45)", isAnimated: true, isInFront: true, parts: el => Math.min(220, el.width / 6) * Math.min(150, el.height) / 40 },
    vines: { label: "vines", tip: "leafy vines hanging from the top of its box, a wider box draws more", width: 400, height: 250, color: "rgba(60,110,60,0.4)", isAnimated: true, isInFront: true, parts: el => 8 * Math.min(14, el.width / 50) },
}
for (const [name, { label, tip, width, height, color, isAnimated, isInFront, settings = [] }] of Object.entries(levelElements.decorations)) {
    const optionsOf = el => Object.fromEntries(settings.filter(({ key, value }) => el[key] !== value).map(({ key, value }) => [key, typeof value === "boolean" ? !!el[key] : Number(el[key])])) //only what isn't the default, plain numbers and booleans
    levelElements.define(name, {
        isDrawing: true, //only drawn, to top and to bottom change what's on top
        isBackground: true, //lock background colors in editor settings makes the mouse go through it
        label,
        tip,
        group: "element",
        defaults: () => ({ x: 0, y: -height, width, height, color, ...(isAnimated ? { speed: 1 } : {}), ...Object.fromEntries(settings.map(({ key, value }) => [key, value])), layer: isInFront ? "over player" : "under player" }),
        props: [
            ...levelElements.rect(),
            levelElements.prop.color("color"),
            ...(isAnimated ? [levelElements.prop.number("speed", { step: 0.25, tip: "how fast it moves, 0 stops it" })] : []),
            ...settings.map(({ key, value, prop }) => typeof value === "boolean" ? levelElements.prop.bool(key, prop) : levelElements.prop.number(key, prop)),
            levelElements.prop.select("layer", levelElements.layers),
        ],
        build(el) {
            const decoration = level.decoration(name, el.x, el.y, el.width, el.height, el.color, isAnimated ? el.speed : 1, optionsOf(el))
            const draw = () => decoration.draw()
            return levelElements.isOver(el) ? { top: draw } : { custom: draw }
        },
        code(el, varName) {
            const draw = [`${varName}.draw();`]
            const options = optionsOf(el)
            const hasOptions = Object.keys(options).length > 0
            const speed = isAnimated && (el.speed !== 1 || hasOptions) ? [el.speed] : hasOptions ? [1] : []
            const optionsCode = hasOptions ? `, { ${Object.entries(options).map(([key, value]) => `${key}: ${value}`).join(", ")} }` : ""
            return { setup: [`const ${varName} = level.decoration(${levelElements.args(name, el.x, el.y, el.width, el.height, el.color, ...speed)}${optionsCode});`], ...(levelElements.isOver(el) ? { top: draw } : { custom: draw }) }
        },
    })
}

levelElements.types.wires.contains = (el, p) => p.x >= el.x && p.x <= el.x + el.width && p.y >= Math.min(el.y, el.y + el.tilt) - 10 && p.y <= Math.max(el.y, el.y + el.tilt) + el.height + 10 //a tilted end is outside its box
levelElements.define("text", { //words in the game's stroke font, like the constraint and level name at the start of a level, it doesn't jitter when the camera moves slowly like fillText does
    isDrawing: true, //only drawn, to top and to bottom change what's on top
    tip: "words drawn in the game's line font, like the level name at the start, letters, numbers, and . , ! ? : ' - + = / ( ) %, x, y is the top left, or the top middle when centered",
    group: "element",
    defaults: () => ({ x: 0, y: -300, text: "text", size: 40, color: "rgba(0,0,0,0.5)", lineWidth: 3, align: "left", layer: "under player" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.text("text"),
        levelElements.prop.number("size", { step: 5, min: 5 }), //how tall the letters are, 40 is the font's own size
        levelElements.prop.color("color"),
        levelElements.prop.number("lineWidth", { step: 1, min: 0.5 }),
        levelElements.prop.select("align", ["left", "center", "right"]),
        levelElements.prop.select("layer", levelElements.layers),
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
        return levelElements.isOver(el) ? { top: draw } : { custom: draw }
    },
    code(el, name) {
        const box = levelElements.types.text.textBox(el)
        const lines = [`ctx.strokeStyle = ${levelElements.args(el.color)};`, `ctx.lineWidth = ${levelElements.args(el.lineWidth)};`, `ctx.stroke(${name});`]
        return {
            setup: [`const ${name} = simulation.draw.font.path(${levelElements.args(String(el.text), box.x, box.y)}${el.size !== 40 ? `, ${levelElements.args(el.size)}` : ""});${el.align === "left" ? "" : ` //${el.align === "center" ? "centered on" : "right side at"} x = ${levelElements.args(el.x)}`}`],
            [levelElements.isOver(el) ? "top" : "custom"]: lines,
        }
    },
})

levelElements.define("circle", { //a filled circle drawn behind or in front of the player, the shape written levels draw most
    isDrawing: true, //only drawn, to top and to bottom change what's on top
    tip: "colored circle drawn behind or in front of the player, drag the handle to change its radius, rect or ellipse in its info box changes its shape",
    group: "element",
    label: "circle fill",
    rounds: ["fill", "circle", "ellipse"],
    isAddedAs: "fill", //not in the add menu, a fill's info box turns it into one
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: 0, y: -200, radius: 100, color: "rgba(0,0,0,0.1)", layer: "under player" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("radius", { isGrid: true, min: 1 }),
        levelElements.prop.color("color"),
        levelElements.prop.select("layer", levelElements.layers),
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
        return levelElements.isOver(el) ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = ["ctx.beginPath();", `ctx.arc(${levelElements.args(el.x, el.y, el.radius)}, 0, 2 * Math.PI);`, `ctx.fillStyle = ${levelElements.args(el.color)};`, "ctx.fill();"]
        return levelElements.isOver(el) ? { top: lines } : { custom: lines }
    },
})

levelElements.define("ellipse", { //a filled ellipse, angle turns it, degrees counterclockwise like boost
    isDrawing: true, //only drawn, to top and to bottom change what's on top
    tip: "colored ellipse drawn behind or in front of the player, drag its handles to change each radius, rotate turns it",
    group: "element",
    label: "ellipse fill",
    rounds: ["fill", "circle", "ellipse"],
    isAddedAs: "fill", //not in the add menu, a fill's info box turns it into one
    isBackground: true, //lock background colors in editor settings makes the mouse go through it
    defaults: () => ({ x: 0, y: -200, radiusX: 150, radiusY: 75, angle: 0, color: "rgba(0,0,0,0.1)", layer: "under player" }),
    props: [
        ...levelElements.position(),
        levelElements.prop.number("radiusX", { isGrid: true, min: 1 }),
        levelElements.prop.number("radiusY", { isGrid: true, min: 1 }),
        levelElements.prop.number("angle", { step: 15 }),
        levelElements.prop.color("color"),
        levelElements.prop.select("layer", levelElements.layers),
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
    isMirrorSymmetric: true, //mirrored it's the same as turned, so one alone has rotate and no flip buttons, flip() still turns it right in a flipped selection
    flip(el, axis, center) { //an ellipse looks the same turned 180°
        const to = levelElements.flipPoint(el, axis, center)
        el.x = to.x
        el.y = to.y
        el.angle = Number((-el.angle).toFixed(3))
    },
    summary: el => `ellipse(${levelElements.args(el.x, el.y, el.radiusX, el.radiusY)})`,
    build(el) {
        const draw = () => {
            ctx.beginPath()
            ctx.ellipse(el.x, el.y, el.radiusX, el.radiusY, levelElements.radians(el.angle), 0, 2 * Math.PI)
            ctx.fillStyle = el.color
            ctx.fill()
        }
        return levelElements.isOver(el) ? { top: draw } : { custom: draw }
    },
    code(el) {
        const lines = ["ctx.beginPath();", `ctx.ellipse(${levelElements.args(el.x, el.y, el.radiusX, el.radiusY)}, ${el.angle ? levelElements.angleCode(el.angle) : "0"}, 0, 2 * Math.PI);`, `ctx.fillStyle = ${levelElements.args(el.color)};`, "ctx.fill();"]
        return levelElements.isOver(el) ? { top: lines } : { custom: lines }
    },
})

// constraints, a Matter.js constraint from a point in the level to a block, made with the inspector's constraint button
// x, y is the point in the level, bx, by is where it holds the block, from the block's center
//*********************************************************************
levelElements.turned = (offset, angle) => ({ x: offset.x * Math.cos(angle) - offset.y * Math.sin(angle), y: offset.x * Math.sin(angle) + offset.y * Math.cos(angle) }) //an offset on a body turned with it, like Matter turns a constraint's points
levelElements.constraintEnd = el => { //where it holds its body in the level, from the block's data, or its body while the level runs, turned with it
    const target = levelData.data && levelData.find(levelData.data, el.body)
    const runtime = target && levelData.runtimes.get(target.id)
    const who = runtime && runtime.bodies && runtime.bodies[0]
    if (who) {
        const offset = levelElements.turned({ x: el.bx, y: el.by }, who.angle)
        return { x: who.position.x + offset.x, y: who.position.y + offset.y }
    }
    if (target) {
        const c = levelElements.center(target)
        return { x: c.x + el.bx, y: c.y + el.by }
    }
    return null
}
levelElements.constraintStart = el => { //its other end, the point in the level, or on its anchor block, which it moves with while the level runs
    const anchor = el.anchor && levelData.data && levelData.find(levelData.data, el.anchor)
    const runtime = anchor && levelData.runtimes.get(anchor.id)
    const who = runtime && runtime.bodies && runtime.bodies[0]
    if (!who) return { x: el.x, y: el.y }
    const c = levelElements.center(anchor)
    const offset = levelElements.turned({ x: el.x - c.x, y: el.y - c.y }, who.angle)
    return { x: who.position.x + offset.x, y: who.position.y + offset.y }
}
levelElements.define("constraint", {
    tip: "a Matter.js constraint from a point in the level to a block, pick another block as its anchor to tie two blocks together, like a chain or a pendulum",
    group: "constraint",
    rebuildWithRefs: true, //its blocks are new bodies after they're rebuilt
    defaults: () => ({ x: 0, y: -300, anchor: null, body: null, bx: 0, by: 0, stiffness: 1, damping: 0, length: 200 }),
    props: [
        ...levelElements.position(), //pointA, in the level, on the anchor block if it has one
        levelElements.prop.ref("anchor", ["block"], { tip: "pick a block to tie this one to, the circle end moves with it, null pins it to the level" }), //bodyA
        levelElements.prop.ref("body", ["block"]), //bodyB
        levelElements.prop.number("bx", { isGrid: true }), //pointB, from the block's center
        levelElements.prop.number("by", { isGrid: true }),
        levelElements.prop.number("stiffness", { step: 0.05, min: 0 }), //1 is a rod, small is a spring
        levelElements.prop.number("damping", { step: 0.05, min: 0 }),
        levelElements.prop.number("length", { isGrid: true, min: 0 }),
    ],
    bounds: el => ({ x: el.x - 12, y: el.y - 12, width: 24, height: 24 }),
    contains(el, p) { //its point, or near the line to the block
        const start = levelElements.constraintStart(el)
        if (Math.hypot(p.x - start.x, p.y - start.y) < 12) return true
        const end = levelElements.constraintEnd(el)
        if (!end) return false
        const dx = end.x - start.x
        const dy = end.y - start.y
        const t = Math.max(0, Math.min(1, ((p.x - start.x) * dx + (p.y - start.y) * dy) / (dx * dx + dy * dy || 1)))
        return Math.hypot(p.x - start.x - t * dx, p.y - start.y - t * dy) < 8
    },
    handles(el) {
        const end = levelElements.constraintEnd(el)
        return end ? [{ id: "end", x: end.x, y: end.y }] : []
    },
    dragHandle(el, id, point) { //moves where it holds the block, turned back by the block's angle, bx and by are on the unturned block
        const center = levelElements.constraintEnd({ ...el, bx: 0, by: 0 })
        if (!center) return
        const who = levelData.runtimes.get(el.body)?.bodies?.[0]
        const offset = levelElements.turned({ x: point.x - center.x, y: point.y - center.y }, -(who ? who.angle : 0))
        el.bx = Math.round(offset.x * 1000) / 1000
        el.by = Math.round(offset.y * 1000) / 1000
    },
    flip(el, axis, center) { //the point mirrors, and where it holds the block mirrors on the block
        levelElements.flipEnds(el, axis, center, [["x", "y"]])
        if (axis === "x") el.bx = -el.bx
        else el.by = -el.by
    },
    summary: el => `constraint(${levelElements.args(el.x, el.y)})${el.anchor ? ` from #${el.anchor}` : ""}${el.body ? ` to #${el.body}` : ""}`,
    overlay(el) {
        const start = levelElements.constraintStart(el)
        const end = levelElements.constraintEnd(el)
        ctx.setLineDash([])
        ctx.lineWidth = 2
        ctx.strokeStyle = end ? "rgba(0,0,0,0.6)" : "rgba(220,0,0,0.8)"
        ctx.fillStyle = el.anchor ? "rgba(0,0,0,0.6)" : "#fff" //filled when it's on a block
        ctx.beginPath()
        ctx.arc(start.x, start.y, 8, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        if (!end) return
        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(end.x, end.y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = "rgba(0,0,0,0.6)"
        ctx.fill()
    },
    pointA(el, data) { //x, y in the level, or from the anchor block's center, how Matter wants it
        const anchor = el.anchor && levelData.find(data, el.anchor)
        if (!anchor) return { x: el.x, y: el.y }
        const c = levelElements.center(anchor)
        return { x: Math.round((el.x - c.x) * 1000) / 1000, y: Math.round((el.y - c.y) * 1000) / 1000 }
    },
    build(el) {
        const bodyOf = id => levelData.runtimes.get(id)?.bodies?.[0]
        const who = bodyOf(el.body)
        if (!who) throw levelElements.unfinished("needs a body, pick a block")
        const anchor = el.anchor ? bodyOf(el.anchor) : null
        if (el.anchor && !anchor) throw levelElements.unfinished("its anchor block is missing")
        cons[cons.length] = Constraint.create({ ...(anchor ? { bodyA: anchor } : {}), pointA: levelElements.types.constraint.pointA(el, levelData.data), bodyB: who, pointB: { x: el.bx, y: el.by }, stiffness: el.stiffness, damping: el.damping, length: el.length })
        Composite.add(engine.world, cons[cons.length - 1])
    },
    code(el, name, context) {
        const body = context && context.nameOf(el.body)
        if (!body) return { setup: [`//${levelElements.summary(el)} has no block`] }
        const anchor = el.anchor && context.nameOf(el.anchor)
        const a = levelElements.args
        const point = levelElements.types.constraint.pointA(el, context.data || levelData.data)
        return {
            setup: [
                `cons[cons.length] = Constraint.create({ ${anchor ? `bodyA: ${anchor}, ` : ""}pointA: { x: ${a(point.x)}, y: ${a(point.y)} }, bodyB: ${body}, pointB: { x: ${a(el.bx)}, y: ${a(el.by)} }, stiffness: ${a(el.stiffness)}, damping: ${a(el.damping)}, length: ${a(el.length)} });`,
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
    levelProps: ["mobVeto"], //the level's mob veto shows in its inspector too, it's for every spot
    defaults: () => ({ x: 0, y: -300, small: false }),
    props: [...levelElements.position(), levelElements.prop.bool("small")], //small spots get a few small mobs instead of one
    radius: el => el.small ? 25 : 45, //about the size of the mobs it spawns
    bounds(el) { const r = this.radius(el); return { x: el.x - r, y: el.y - r, width: 2 * r, height: 2 * r } },
    contains(el, p) { return Math.hypot(p.x - el.x, p.y - el.y) < this.radius(el) },
    overlay(el) { levelElements.marker(el, this.radius(el), "rgba(255,80,80,0.2)", el.small ? "s" : "mob", 22) },
    build(el, options) {
        if (options.isSpawning) spawn.randomMobPositions.push({ x: el.x, y: el.y, isSmall: el.small }) //levelData.play() calls spawn.randomMobFromArray() after
    },
    spawnLinked: el => spawn.randomMobAt(el.x, el.y, el.small, levelData.data.mobVeto), //linked, it isn't in the list and always spawns
    code(el, name, context) { //only linked ones, see levelData.isTogether()
        const veto = context ? context.data.mobVeto : []
        return { setup: [`spawn.randomMobAt(${levelElements.args(el.x, el.y)}${el.small || veto.length ? `, ${!!el.small}` : ""}${veto.length ? `, ${levelElements.namesCode(veto)}` : ""});`] }
    },
    codeAll: (elements, data) => [ //every spot goes in one list, the level's mobVeto goes with them
        "spawn.randomMobPositions = [",
        ...elements.map(el => `    [${levelElements.args(el.x, el.y)}${el.small ? ", true" : ""}],`),
        "].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));",
        `spawn.randomMobFromArray(${data.mobVeto.length ? levelElements.namesCode(data.mobVeto) : ""})`,
    ],
})
levelElements.namesCode = names => `[${names.map(name => JSON.stringify(name)).join(", ")}]`
levelElements.vetoTiers = { //what veto lists show, by tier, spawn.js isn't loaded in the unit tests
    mob: () => typeof spawn === "undefined" ? [] : spawn.tier.slice(1, 5).map((names, i) => [`tier ${i + 1}`, names.slice().sort()]), //tier 0 is only starter, tier 5 only spawns as next TIER mobs
    boss: () => typeof spawn === "undefined" ? [] : spawn.bossTier.map((names, i) => [`tier ${i}`, names.slice().sort()]).filter(([, names]) => names.length),
}
levelElements.vetoBlocks = (prop, veto, name) => { //why name can't be vetoed: it's the last one its tier has left, or ""
    const tier = prop.tiers().find(([, names]) => names.includes(name))
    return tier && !veto.includes(name) && tier[1].every(other => other === name || veto.includes(other)) ? `every other ${tier[0]} ${prop.noun} is vetoed, a tier needs one` : ""
}

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
levelElements.define("mob", { ...levelElements.mobType("randomMob", "mob", 40, "rgba(255,80,80,0.35)", true), tip: "one random mob in this exact spot, chance is how likely, standard levels use spots instead" })
levelElements.define("smallMobs", { ...levelElements.mobType("randomSmallMob", "small mobs", 30, "rgba(255,120,80,0.35)", true, "small"), tip: "a few small random mobs, more on harder difficulties" })
levelElements.define("mobGroup", { ...levelElements.mobType("randomGroup", "group", 50, "rgba(255,80,160,0.35)", true), tip: "a group of random mobs linked together, only after the first few levels" })
levelElements.nestNames = () => ["random", ...(typeof spawn === "undefined" ? ["starter"] : [...new Set(spawn.tier.flat())])] //random is one of the level's mob types, spawn.js isn't loaded in the unit tests
levelElements.define("nest", { //level.nest
    tip: "a mob that stays put and makes mobs while it sees the player, until max are alive, period is cycles between them (60 is a second), its mobs don't drop power ups",
    group: "mob",
    defaults: () => ({ x: 0, y: -300, name: "random", period: 300, max: 4, radius: 60 }),
    props: [
        ...levelElements.position(),
        { key: "name", kind: "select", get options() { return levelElements.nestNames() } },
        levelElements.prop.number("period", { step: 30, min: 1 }),
        levelElements.prop.number("max", { step: 1, min: 1 }),
        levelElements.prop.number("radius", { step: 5, min: 20 }),
    ],
    bounds: el => ({ x: el.x - el.radius, y: el.y - el.radius, width: 2 * el.radius, height: 2 * el.radius }),
    contains: (el, p) => Math.hypot(p.x - el.x, p.y - el.y) < el.radius,
    overlay: el => levelElements.marker(el, el.radius, "rgba(150,40,120,0.35)", "nest"), //it's a mob, so it only spawns with mobs on
    summary: el => `nest(${levelElements.args(el.x, el.y, el.name)})`,
    build(el, options) {
        if (options.isSpawning) level.nest(el.x, el.y, el.name, el.period, el.max, el.radius)
    },
    code(el) {
        const extra = el.radius !== 60 ? [el.period, el.max, el.radius] : el.max !== 4 ? [el.period, el.max] : el.period !== 300 ? [el.period] : []
        return { setup: [`level.nest(${levelElements.args(el.x, el.y, el.name, ...extra)});`] }
    },
})
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
        if (options.isSpawning && levelElements.mobNames().includes(el.name) && typeof spawn[el.name] === "function") spawn[el.name](el.x, el.y)
    },
    code: el => ({ setup: levelElements.mobNames().includes(el.name) ? [`spawn[${JSON.stringify(el.name)}](${levelElements.args(el.x, el.y)});`] : [] }),
})
levelElements.bossType = (spawnName, label, radius, fill, fontSize) => ({ //a boss spawns at its spot or one of its other spots, picked at random each time the level loads, fontSize for a long label
    ...levelElements.mobType(spawnName, label, radius, fill, false),
    defaults: () => ({ x: 0, y: -300, spots: [], veto: [] }), //spots: [[x, y], ...] other places it could spawn, the editor shows them as handles to drag, veto: boss names it won't be
    props: [...levelElements.position(), levelElements.prop.veto("veto", levelElements.vetoTiers.boss, "boss")],
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
            ctx.font = `${fontSize ?? Math.max(16, radius * 0.4)}px monospace`
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "rgba(0,0,0,0.6)"
            ctx.fillText(`${label} ${i + 2}`, x, y)
            ctx.textBaseline = "alphabetic"
            ctx.textAlign = "left"
        })
        levelElements.marker(el, radius, fill, el.spots.length ? `${label} 1` : label, fontSize)
    },
    build(el, options) {
        if (!options.isSpawning) return
        const places = levelElements.types[el.type].places(el)
        const [x, y] = places[Math.floor(Math.random() * places.length)]
        spawn[spawnName](x, y, [], el.veto)
    },
    code(el, name) {
        const spot = ([x, y]) => `{ x: ${levelElements.args(x)}, y: ${levelElements.args(y)} }`
        const veto = el.veto.length ? `, [], ${levelElements.namesCode(el.veto)}` : "" //spawn.randomLevelBoss(x, y, options, veto)
        if (!el.spots.length) return { setup: [`spawn.${spawnName}(${levelElements.args(el.x, el.y)}${veto});`] }
        const places = levelElements.types[el.type].places(el)
        const pick = places.length === 2 ? `Math.random() < 0.5 ? ${spot(places[0])} : ${spot(places[1])}` : `[${places.map(spot).join(", ")}][Math.floor(Math.random() * ${places.length})]` //like written levels pick a boss spot
        return { setup: [`const ${name} = ${pick}`, `spawn.${spawnName}(${name}.x, ${name}.y${veto});`] }
    },
})
levelElements.define("boss", { ...levelElements.bossType("randomLevelBoss", "boss", 80, "rgba(200,0,60,0.35)"), tip: "the level's boss, picked by the run's tier, add spots in the inspector for other places it could spawn" })
levelElements.define("secondaryBoss", { ...levelElements.bossType("secondaryBossChance", "2nd boss", 85, "rgba(160,0,100,0.3)", 27), tip: "a second boss, it only spawns with the 2 bosses difficulty option" })
for (const name of ["mobSpot", "mob", "smallMobs", "mobGroup", "nest", "namedMob", "boss", "secondaryBoss"]) { //no link spawns when the level starts, linked it spawns once, the first time what it's linked to turns on
    levelElements.linkable(name)
    const type = levelElements.types[name]
    type.handlesLink = true //it runs to watch its link, not only while it's on
    type.writesLink = true //its code() uses context.link
    type.props.find(prop => prop.key === "link").tip = "a button, zone, or other trigger that spawns it, once, the first time it turns on, null spawns it when the level starts"
    type.props.find(prop => prop.key === "runs").tip = "while on spawns it the first time its link turns on, while off the first time its link is off"
    const build = type.build
    type.build = (el, options) => {
        if (!el.link && !el.orLink) return build(el, options)
        if (!options.isSpawning) return {}
        const runtime = {
            isSpawned: false, //a mob clear waits for it
            custom() {
                if (runtime.isSpawned || levelData.linkOn(el) !== true) return
                runtime.isSpawned = true
                if (type.spawnLinked) type.spawnLinked(el)
                else build(el, options)
            },
        }
        return runtime
    }
    const code = type.code
    type.code = (el, varName, context) => {
        const lines = code(el, varName, context)
        const link = context && context.link(el)
        if (!link) return lines
        const flag = `${varName}Spawned`
        return {
            setup: [`let ${flag} = false; //it spawns once, the first time what it's linked to turns on`],
            custom: [`if (!${flag} && ${link.on.includes("||") ? `(${link.on})` : link.on}) {`, `    ${flag} = true;`, ...(lines.setup || []).map(line => "    " + line), "}"],
        }
    }
}

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
        tech: "a choice of 3 tech, standard levels give tech from the boss and the starting power up",
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
        levelElements.prop.number("count", {
            step: 1, min: 1, tip: `how many, up to ${levelElements.maxPowerUpCount} per element`,
            write(el, value) { el.count = Math.max(1, Math.min(levelElements.maxPowerUpCount, Math.round(value))) },
        }),
    ],
    bounds: el => ({ x: el.x - 25, y: el.y - 25, width: 50, height: 50 }),
    summary: el => `${el.name}(${levelElements.args(el.x, el.y)})${el.count > 1 ? ` × ${el.count}` : ""}`,
    overlay: el => levelElements.marker(el, 25, powerUps[el.name] ? powerUps[el.name].color : "#fff", el.count > 1 ? `${el.count}` : ""),
    build(el, options) {
        if (options.isSpawning) for (let i = 0; i < el.count; i++) powerUps.spawn(el.x + 25 * i, el.y, el.name) //25 apart, power ups in the same spot lag while they push apart
    },
    code: el => ({ setup: [el.count > 1 ? `for (let i = 0; i < ${Number(el.count)}; i++) powerUps.spawn(${levelElements.args(el.x)} + 25 * i, ${levelElements.args(el.y, el.name)});` : `powerUps.spawn(${levelElements.args(el.x, el.y, el.name)});`] }),
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
    tip: "small random blocks along a line, about 15% are heal or ammo instead, standard levels use about 16",
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
//*********************************************************************
// property tips, the inspector shows them when the mouse is over a property's name
// typeTips[type][key] is for one type, tips[key] for every type with that key, a prop's own tip wins
//*********************************************************************
levelElements.tips = {
    x: "left edge, or the middle for points and shapes with vertices, in game units, y goes down",
    y: "top edge, or the middle for points and shapes with vertices, in game units, y goes down",
    width: "game units, the player is about 50 wide",
    height: "game units, a jump is about 390 high",
    bump: "a small step under the door, older levels have one",
    friction: "how much things slide on it while moving, 0 is ice, 1 is very grippy",
    frictionStatic: "how hard it is to start sliding, Matter's default is 0.5",
    frictionAir: "drag, slows it down every frame, 0.001 is normal, 0.05 is like moving through water",
    restitution: "bounciness, 0 doesn't bounce, 1 bounces back as high as it fell",
    collides: "what it bumps into, click a name to turn it off, crossed out names go through it",
    link: "the button, zone, logic, or other trigger that turns it on and off",
    orLink: "a second control, it's on while either one is",
    runs: "while on runs it while its link is on, while off is the other way around",
    delay: "cycles it waits to follow its link, 60 is a second, it turns on that long after its link does and off that long after",
    density: "mass per area, 0.001 is a normal block, more is heavier and harder to push",
    mass: "density times area, change either one",
    velocityX: "how fast it's moving right when the level starts, negative is left, game units a frame",
    velocityY: "how fast it's moving down when the level starts, negative is up, game units a frame",
    holdable: "unchecked, the field can't pick it up",
    noSpin: "it slides but never turns",
    immutable: "tech can't destroy, split, grow, or freeze it, and falling out of the level brings it back",
    chance: "probability it shows up each time the level loads, 0 to 1, 0.5 is half the time",
    angle: "degrees, counterclockwise, 0 points right and 90 points up",
    speed: "game units a frame, negative goes the other way",
    distance: "how far it moves, game units",
    damage: "how much it hurts each hit, before difficulty scaling",
    color: "any css color, like #444, rgba(0,0,0,0.1), or hsl(200, 50%, 50%)",
    layer: "under or over the player, blocks, and mobs, to top and to bottom order it among the other drawings in its layer",
    stroke: "line color, any css color, or none",
    fill: "fill color, any css color, or none",
    lineWidth: "line thickness, game units",
    length: "game units",
    name: "",
    count: "how many",
    spin: "keeps turning around x, y, degrees a second, negative turns the other way, 0 doesn't",
    swing: "sways back and forth around x, y, this many degrees each way from where it points, 0 doesn't",
    swingTime: "frames for one swing there and back, 60 is a second",
    motion: "a motion sensor: a faint white beam, when the player crosses it, it flashes white for a second, then hurts like a laser for about 10 seconds",
    who: "what turns it on by being inside: the player, a block, a mob, or any of them",
    on: "",
    small: "a few small mobs instead of one",
    veto: "bosses it won't be, pick one to cross it out or bring it back, a vetoed boss's turn goes to the next one in its tier",
    mobVeto: "mobs the level's mob spots won't spawn, pick one to cross it out or bring it back, the level's other mob types spawn instead",
    log: "a message in the in-game console each time it turns on, text or html like <b>bold</b>, <br> for a new line, or <span class='color-var'>, no other tags or attributes, empty logs nothing",
    x2: "the other end's x, game units",
    y2: "the other end's y, game units",
}
levelElements.typeTips = {
    map: { on: "what it does while its link is on" },
    button: { on: "when its links are on: while pressed (down), while not (up), or for good once pressed (stays down)" },
    keyhole: { on: "on while the key is in, or for good once it's been in", color: "the key of this color fits" },
    key: { color: "fits the keyhole of this color" },
    zone: { on: "on while something's inside, or for good once something has been", circle: "a circle around x, y instead of a box, something is inside once its center is", radius: "game units, from x, y" },
    boost: { launchHeight: "about how high it throws the player, game units" },
    transport: { distance: "how far it slides from its start, game units" },
    buzzsaw: { radius: "how big it is, game units", path: "the path it travels along, draw makes a new one and links it, pick links a draw path you've made, it goes back and forth, or around and around if it's closed, it starts at the closest spot to x, y, null stays put", speed: "game units a cycle, 0 stays put", spin: "how fast it turns, radians a cycle, negative turns it the other way", look: "how it's drawn, it hurts the same in every look" },
    door: { distance: "how far up it slides to open, game units", speed: "how fast it opens and closes" },
    elevator: { travel: "how far up it goes, game units", force: "how hard it pushes, more is faster", onTouch: "only moves while the player stands on it" },
    vanish: { vertical: "shrinks sideways instead of down" },
    spinner: { spin: "how fast it's turning when the level starts, radians a frame", motor: "keeps it turning, negative turns the other way, its link turns the motor on and off", frictionAir: "slows its turning too, so a motor tops out sooner" },
    wind: { vx: "push to the right a frame, negative pushes left", vy: "push down a frame, negative pushes up", float: "cancels gravity inside it" },
    slime: { rise: "how fast it fills, game units a frame, 0 is always full, linked it drains while off" },
    toggle: { isOn: "how it starts", staysOn: "once it's on it can't be flipped back" },
    logic: { onTime: "frames it's on, 60 is a second", offTime: "frames it's off, 60 is a second", offset: "frames to shift it, so timers can take turns" },
    portal: { angle: "which way end A faces, degrees, 0 is right, 90 up", angle2: "which way end B faces, degrees", exit: "how things come out: keep their momentum, straight out, or launched" },
    path: { closed: "joins the last point to the first and fills it" },
    text: { text: "letters, numbers, and . , ! ? : ' - + = / ( ) %", size: "how tall the letters are, 40 is the font's own size", align: "which side of x the text is on" },
    circle: { radius: "game units" },
    ellipse: { radiusX: "half its width before turning, game units", radiusY: "half its height before turning, game units" },
    constraint: {
        x: "the circle end, in the level, or on its anchor block",
        y: "the circle end, in the level, or on its anchor block",
        body: "the block it holds",
        bx: "where it holds the block, right of its center, game units",
        by: "where it holds the block, below its center, game units",
        stiffness: "1 is a rigid rod, small numbers are a soft spring",
        damping: "0 bounces freely, more settles down faster",
        length: "its resting length, game units",
    },
    powerUp: { name: "which power up", count: "how many" },
    debris: { count: "how many little blocks, about 15% are heal or ammo" },
    namedMob: { name: "which mob" },
    level: {
        name: "letters, numbers, - and _, no spaces, it's the save name and the level pool name",
        author: "who made it, plain text, when it loads the in-game console says the level's name and who made it, empty says nothing",
        log: "a message in the in-game console when the level starts, after the author's, text or html like <b>bold</b>, <br> for a new line, or <span class='color-var'>, no other tags or attributes",
        zoom: "how far the camera sees, standard levels use 1300 to 2600",
        background: "the color behind everything",
        mapColor: "the color of the map",
        blockColor: "the color of blocks",
        gravity: "times normal, for the player, blocks, and power ups",
        fall: "falling off the bottom goes back to the entrance (spawn), or keeps falling from the sky",
        constraintTextX: "where the run's constraint text shows, right of the entrance",
        constraintTextY: "where the run's constraint text shows, below the entrance",
    },
}
levelElements.tipOf = (typeName, prop) => prop.tip || levelElements.typeTips[typeName]?.[prop.key] || levelElements.tips[prop.key] || ""

levelElements.level = {
    props: [
        levelElements.prop.text("name"),
        levelElements.prop.text("author"), //who made it, the level logs its name and author when it loads, see levelData.authorLog()
        levelElements.prop.text("log"), //a message in the in-game console when the level starts, after the author's
        levelElements.prop.number("zoom", { step: 100, min: 200 }), //level.defaultZoom when it's played
        levelElements.prop.color("background"),
        levelElements.prop.color("mapColor"),
        levelElements.prop.color("blockColor"),
        levelElements.prop.number("gravity", { step: 0.1, min: 0.1 }), //times normal gravity, for the player, blocks, and power ups, mobs have their own
        levelElements.prop.select("fall", ["spawn", "sky"]), //falling off the bottom sends the player back to the spawn, or keeps them falling from the sky above it
        levelElements.prop.bool("lineOfSight", { label: "line of sight", tip: "only what the player can see is drawn, like subway, it shows in quick test and test export, not while editing" }),
        levelElements.prop.number("constraintTextX", { isGrid: true }), //where the run's constraint shows, from the spawn, level.announceText()
        levelElements.prop.number("constraintTextY", { isGrid: true }),
        levelElements.prop.veto("mobVeto", levelElements.vetoTiers.mob, "mob", { isShown: data => data.elements.some(el => el.type === "mobSpot") }), //each mob spot shows it too
    ],
    defaults: () => ({ zoom: 2000, background: "#dcdcde", mapColor: "#444", blockColor: "rgba(140,140,140,0.85)", gravity: 1, fall: "spawn", lineOfSight: false, constraintTextX: 0, constraintTextY: 75, mobVeto: [] }), //what written levels use most, and the level properties default button
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

for (const name of Object.keys(levelElements.types).filter(name => levelElements.types[name].isDrawing)) { //a trigger can show and hide any drawing
    levelElements.linkable(name)
    const type = levelElements.types[name]
    type.props.find(prop => prop.key === "link").tip = "a button, zone, or other trigger that shows it while it's on, null always shows"
    const overlay = type.overlay
    type.overlay = (el, ...rest) => {
        if (overlay) overlay.call(type, el, ...rest)
        if ((!el.link && !el.orLink) || levelData.linkOn(el) !== false) return
        const b = levelElements.bounds(el) //off it isn't drawn, a faint outline so it can still be found while editing
        ctx.setLineDash([8, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(0,0,0,0.25)"
        ctx.strokeRect(b.x, b.y, b.width, b.height)
        ctx.setLineDash([])
    }
}

//every element a button, toggle, or other link source can turn on and off gets a delay, cycles it waits to follow its link, the row only shows once it's linked, see levelData.linkState() and level.delay()
for (const name of Object.keys(levelElements.types)) {
    const type = levelElements.types[name]
    if (levelElements.linkSources.includes(name) || !type.props.some(prop => prop.key === "link")) continue
    const defaults = type.defaults
    type.defaults = () => ({ ...defaults(), delay: 0 })
    const after = Math.max(...["link", "orLink", "runs", "on"].map(key => type.props.findIndex(prop => prop.key === key)))
    type.props.splice(after + 1, 0, levelElements.prop.number("delay", { step: 10, min: 0, isShown: el => !!(el.link || el.orLink) }))
}
