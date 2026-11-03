"use strict";
//the level editor's little pictures: the status bar's tool, zoom, and undo icons, the align icons, power up orbs,
//and mob pictures for mob by name and the mob and boss buttons, saved in js/level-editor-mob-pictures.js by tools/mob-pictures.js
//loads after js/level-editor.js and adds to levelEditor
Object.assign(levelEditor, {
    orb(name) { //the power up's orb from powerUps.orb, without the game's hover help, "block" is a little block, difficulty has no orb so it's a black circle like in the level
        if (name === "block") return `<span class="le-orb"><span class="le-block-icon"></span></span>`
        if (name === "difficulty") return `<span class="le-orb"><span class="le-difficulty-icon"></span></span>`
        return powerUps.orb[name] ? `<span class="le-orb">${powerUps.orb[name]().replace(/ data-help="[^"]*"/g, "")}</span>` : ""
    },
    mobExamples: { //a few of what the add menu's mob, boss, and 2nd boss buttons can spawn, drawn under them like the power up buttons' orbs
        mobSpot: ["starter", "shooter", "hopper", "spinner"],
        boss: ["hydraBoss", "powerUpBossBaby", "shooterBoss"],
        secondaryBoss: ["mantisBoss", "pentaLaserBoss", "spiderBoss"],
    },
    mobExamplesHtml(typeName) { //[ pictures ], 13 × 13 each
        const pictures = (levelEditor.mobExamples[typeName] || []).filter(name => levelEditor.mobShapes[name]).map(name => {
            const { shapes, links, orbs } = levelEditor.mobShapes[name]
            return levelEditor.mobIcon(name, shapes, links, orbs, 13, 13)
        })
        return `<span class="le-options le-mob-examples">[${pictures.join("")}]</span>`
    },
    loadMobPictures() { //the mob pictures are saved in js/level-editor-mob-pictures.js, loaded the first time the editor starts a level, never in a normal run
        if (levelEditor.mobIcons || levelEditor.isLoadingMobPictures || typeof document.createElement !== "function") return
        if (levelEditor.mobPictureData) return levelEditor.useMobPictures(levelEditor.mobPictureData)
        levelEditor.isLoadingMobPictures = true
        const script = document.createElement("script")
        script.src = "js/level-editor-mob-pictures.js"
        script.onload = () => {
            levelEditor.isLoadingMobPictures = false
            levelEditor.useMobPictures(levelEditor.mobPictureData || {})
            if (levelEditor.isActive) { //mob by name, the boss buttons, and veto lists show them
                levelEditor.renderLeft()
                levelEditor.refreshRight()
            }
        }
        script.onerror = () => { //no pictures, only names
            levelEditor.isLoadingMobPictures = false
            levelEditor.mobIcons = {}
        }
        document.head.appendChild(script)
    },
    useMobPictures(data) { //the saved outlines, colors, and lines for each mob, drawn as svg for mob by name, see mobIcon()
        const icons = {}
        for (const [name, saved] of Object.entries(data)) {
            const picture = {
                shapes: saved.shapes.map(shape => ({ points: shape.points.map(([x, y]) => ({ x, y })), fill: shape.fill, stroke: shape.stroke })),
                links: saved.links.map(([x1, y1, x2, y2]) => [{ x: x1, y: y1 }, { x: x2, y: y2 }]),
                orbs: saved.orbs.map(([x, y, r, fill]) => ({ x, y, r, fill })),
            }
            levelEditor.mobShapes[name] = picture
            icons[name] = levelEditor.mobExtras[name]?.icon || levelEditor.mobIcon(name, picture.shapes, picture.links, picture.orbs)
        }
        levelEditor.mobIcons = icons
    },
    collectMobPictures() { //only for tools/mob-pictures.js: spawns every mob and boss once, far away, saves what it made, then takes it all away again
        const pictures = {}
        const saved = [level, spawn, simulation, m, powerUps, tech].map(object => [object, Object.entries(object).filter(([, value]) => value === null || typeof value !== "object" && typeof value !== "function")]) //a boss could set a flag when it spawns, like a boss fight starting, these go back after
        spawn.allowShields = false //random shields would hide the mob
        const round = n => Math.round(n)
        for (const name of levelElements.mobNames()) {
            const start = levelData.mark()
            const spawned = { mob: mob.length, powerUp: powerUp.length }
            const ephemera = new Set(simulation.ephemera)
            try {
                spawn[name](0, -100000)
                const made = levelData.made(start)
                const shapes = mob.slice(spawned.mob).filter(who => !who.shield).map(who => ({
                    points: who.vertices.map(v => [round(v.x), round(v.y + 100000)]),
                    fill: who.fill,
                    stroke: who.stroke,
                }))
                const end = (body, point) => [round(body.position.x + point.x), round(body.position.y + point.y + 100000)]
                const links = made.cons.concat(made.consBB, made.constraints).filter(c => c.bodyA && c.bodyB).map(c => [...end(c.bodyA, c.pointA), ...end(c.bodyB, c.pointB)]) //tails, legs, and chains, not ends pinned to the level, a spider's are at 0, 0 until it moves
                const orbs = powerUp.slice(spawned.powerUp).map(who => [round(who.position.x), round(who.position.y + 100000), round(who.size), who.color])
                if (shapes.length) pictures[name] = { shapes, links, orbs }
            } catch (error) { } //it's only a picture
            levelData.unbuild(levelData.made(start))
            levelData.removeSpawned(spawned)
            simulation.ephemera = simulation.ephemera.filter(effect => ephemera.has(effect))
        }
        for (const [object, values] of saved) for (const [key, value] of values) object[key] = value //and allowShields
        return pictures
    },
    mobExtras: { //what a mob does that its shape doesn't show, drawn on its picture: lasers (how many), a laser sword, a sniper's sight, a sucker's dark middle
        laser: { lasers: 1 }, laserLayer: { lasers: 1 }, beamer: { lasers: 1 }, focuser: { lasers: 1 }, quadLaser: { lasers: 4 }, pentaLaserBoss: { lasers: 5 },
        laserTargetingBoss: { lasers: 1 }, laserBombingBoss: { lasers: 1 }, laserLayerBoss: { lasers: 1 },
        slasher: { sword: true }, slasher2: { sword: true }, slasher3: { sword: true }, slasher4: { sword: true }, slasher5: { sword: true }, slicer: { sword: true }, slicer5: { sword: true }, slashBoss: { sword: true },
        sniper: { sight: true }, sucker: { hole: true }, bigSucker: { hole: true },
        powerUpBoss: { nodeOrbs: true }, powerUpBossBaby: { nodeOrbs: true }, //it carries a power up at each corner
        mayflyBoss: { //its swarm of cells doesn't fit, so a cartoon mayfly: wings, a pink head, a white body that thins out, and long tail threads
            icon: `<svg class="le-mob-icon" width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
                <ellipse cx="8.5" cy="4" rx="3" ry="5.5" transform="rotate(-30 8.5 4)" fill="rgba(200,225,240,0.7)" stroke="#222" stroke-width="0.6"/>
                <ellipse cx="11.5" cy="4.5" rx="2.5" ry="4.5" transform="rotate(20 11.5 4.5)" fill="rgba(200,225,240,0.7)" stroke="#222" stroke-width="0.6"/>
                <path d="M15.5 10.5 Q20 11 25 6.5 M15.5 11 Q20 13 25.5 10.5 M15.5 11.5 Q19.5 15 25 14.5" stroke="#777" stroke-width="0.6" fill="none"/>
                ${[[14.5, 10.5, 1.3], [12.5, 10, 1.7], [10, 9.5, 2.1], [7, 9.5, 2.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#222" stroke-width="0.6"/>`).join("")}
                <circle cx="3.2" cy="9.5" r="2.3" fill="rgb(182,99,124)" stroke="#222" stroke-width="0.6"/>
            </svg>`,
        },
    },
    mobIcon(name, shapes, links = [], orbs = [], w = 26, h = 16) { //shapes are { points, fill, stroke } in world space, or { x, y, r, sides, fill } made up, it's fit into a w × h picture around the biggest
        shapes = shapes.map(shape => shape.points ? shape : { ...shape, points: Array.from({ length: shape.sides }, (_, i) => ({ x: shape.x + shape.r * Math.cos(2 * Math.PI * i / shape.sides), y: shape.y + shape.r * Math.sin(2 * Math.PI * i / shape.sides) })) })
        const boxes = shapes.map(shape => levelElements.boundsOf(shape.points))
        const mainIndex = boxes.reduce((best, b, i) => b.width * b.height > 1.5 * boxes[best].width * boxes[best].height ? i : best, 0) //the first, or a much bigger body, a spider spawns its legs first
        const main = boxes[mainIndex]
        const center = { x: main.x + main.width / 2, y: main.y + main.height / 2 }
        const size = Math.max(main.width, main.height) / 2
        const extra = levelEditor.mobExtras[name] || {}
        if (extra.nodeOrbs) { //a dot at each corner, in the colors of the power ups it spawned
            const colors = orbs.length ? orbs.map(o => o.fill) : ["rgba(255,0,255,0.6)"]
            const r = Math.max(main.width, main.height) / 9
            orbs = shapes[mainIndex].points.map((p, i) => ({ x: p.x, y: p.y, r, fill: colors[i % colors.length] }))
        }
        const lines = [] //[from, to, color, dash]
        for (let i = 0; i < (extra.lasers || 0); i++) {
            const a = 2 * Math.PI * i / extra.lasers
            lines.push([center, { x: center.x + 2.4 * size * Math.cos(a), y: center.y + 2.4 * size * Math.sin(a) }, "#f00", ""])
        }
        if (extra.sword) lines.push([center, { x: center.x + 2.6 * size, y: center.y - 0.6 * size }, "rgb(110,130,170)", ""])
        if (extra.sight) lines.push([center, { x: center.x + 3 * size, y: center.y }, "rgba(255,0,0,0.7)", "2 2"])
        const points = shapes.flatMap(shape => shape.points).concat(links.flat(), lines.flatMap(line => [line[0], line[1]]), orbs.flatMap(o => [{ x: o.x - o.r, y: o.y - o.r }, { x: o.x + o.r, y: o.y + o.r }]))
        let box = levelElements.boundsOf(points)
        const reach = 7 * size //a mob that spreads out far, like a culture, is drawn around its first part
        if (box.width > 2 * reach || box.height > 2 * reach) box = { x: center.x - reach, y: center.y - reach, width: 2 * reach, height: 2 * reach }
        const k = Math.min((w - 2) / (box.width || 1), (h - 2) / (box.height || 1))
        const ox = (w - box.width * k) / 2 - box.x * k
        const oy = (h - box.height * k) / 2 - box.y * k
        const xy = p => `${(ox + p.x * k).toFixed(1)},${(oy + p.y * k).toFixed(1)}`
        const isNone = color => !color || color === "transparent" || /^(rgba|hsla)\([^,]+,[^,]+,[^,]+,\s*0(\.0*)?\s*\)$/.test(color) //no color, or see-through
        const linkPath = links.length ? `<path d="${links.map(([a, b]) => `M${xy(a)}L${xy(b)}`).join("")}" stroke="#999" stroke-width="0.7" fill="none"/>` : ""
        const polygons = shapes.map(shape => {
            const isInvisible = isNone(shape.fill) && isNone(shape.stroke)
            return `<polygon points="${shape.points.map(xy).join(" ")}" fill="${isNone(shape.fill) ? "none" : levelEditor.escape(shape.fill)}" stroke="${isInvisible ? "#777" : "#222"}" stroke-width="${shapes.length > 8 ? 0.5 : 0.8}"${isInvisible ? ` stroke-dasharray="2 1.5"` : ""}/>`
        }).join("")
        const hole = extra.hole ? `<circle cx="${(ox + center.x * k).toFixed(1)}" cy="${(oy + center.y * k).toFixed(1)}" r="${(0.6 * size * k).toFixed(1)}" fill="#000"/>` : ""
        const lineMarks = lines.map(([a, b, color, dash]) => `<path d="M${xy(a)}L${xy(b)}" stroke="${color}" stroke-width="1.2"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`).join("")
        const orbMarks = orbs.map(o => `<circle cx="${(ox + o.x * k).toFixed(1)}" cy="${(oy + o.y * k).toFixed(1)}" r="${Math.max(1, o.r * k).toFixed(1)}" fill="${levelEditor.escape(o.fill || "#888")}"/>`).join("")
        return `<svg class="le-mob-icon" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${linkPath}${lineMarks}${polygons}${hole}${orbMarks}</svg>`
    },
    statusIcon(name) { //zoom is a magnifying glass
        const icons = {
            zoom: `<circle cx="6.5" cy="6" r="4.5" fill="#fff" stroke="#333" stroke-width="1.6"/><path d="M10 9.5 L15 13" stroke="#333" stroke-width="2.4" stroke-linecap="round"/>`,
        }
        return `<svg class="le-tool-icon le-status-icon" viewBox="0 0 17 14" width="17" height="14" aria-label="${name}">${icons[name]}</svg>`
    },
    shapeIcons: { //the preset shapes' pictures, 30 × 22, filled with the button's text color, a new preset in levelElements.presets needs one
        "square": `<rect x="5" y="1" width="20" height="20"/>`,
        "rounded rect": `<polygon points="4.5,4 25.5,4 29,7.5 29,14.5 25.5,18 4.5,18 1,14.5 1,7.5"/>`,
        "rounded bottom": `<polygon points="11.3,1 18.8,1 18.8,19.1 16.9,21 13.1,21 11.3,19.1"/>`,
        "trapezoid": `<polygon points="8,5 22,5 29,16.9 1,16.9"/>`,
        "dome": `<polygon points="1,18 1.5,14.4 2.9,11 5.1,8.1 8,5.9 11.4,4.5 15,4 18.6,4.5 22,5.9 24.9,8.1 27.1,11 28.5,14.4 29,18"/>`,
        "ramp": `<polygon points="29,4 29,18 1,18"/>`,
        "hexagon": `<polygon points="9.2,1 20.8,1 26.5,11 20.8,21 9.2,21 3.5,11"/>`,
        "pointed ends": `<polygon points="8,4.9 22,4.9 29,11 22,17.1 8,17.1 1,11"/>`,
        "circle": `<polygon points="25,11 24.2,14.8 22.1,18.1 18.8,20.2 15,21 11.2,20.2 7.9,18.1 5.8,14.8 5,11 5.8,7.2 7.9,3.9 11.2,1.8 15,1 18.8,1.8 22.1,3.9 24.2,7.2"/>`,
        "point up": `<polygon points="15,1 21,4 21,21 9,21 9,4"/>`,
        "diamond": `<polygon points="15,1 22.5,11 15,21 7.5,11"/>`,
        "spike": `<polygon points="15,1 25,21 5,21"/>`,
        "stairs": `<rect x="1" y="14.5" width="7" height="3.5"/><rect x="8" y="11" width="7" height="7"/><rect x="15" y="7.5" width="7" height="10.5"/><rect x="22" y="4" width="7" height="14"/>`,
        "arch": `<rect x="1.7" y="1" width="26.7" height="4"/><rect x="1.7" y="5" width="4" height="16"/><rect x="24.3" y="5" width="4" height="16"/>`,
    },
    elementIcons: { //the level element list's pictures, 26 × 16 like the mob pictures, in the colors each looks like in the game, "type:preset" for a named preset
        boost: `<rect x="5" y="13" width="16" height="2" fill="#444"/><path d="M13 1L18 7H15V12H11V7H8Z" fill="rgb(200,0,255)"/>`,
        mover: `<rect x="2" y="10" width="22" height="4" fill="#586370"/><path d="M6 6H19M16 3.5L19.5 6L16 8.5" fill="none" stroke="#444" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`,
        transport: `<rect x="2" y="9" width="10" height="3" fill="#586370"/><path d="M13 10.5H21" stroke="#444" stroke-width="1.2" stroke-dasharray="2 1.5"/><path d="M19.5 8L22.5 10.5L19.5 13" fill="none" stroke="#444" stroke-width="1.2" stroke-linejoin="round"/>`,
        elevator: `<rect x="6" y="12" width="14" height="3" fill="#586370"/><path d="M13 11V3M10 5.5L13 2L16 5.5" fill="none" stroke="#444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
        vanish: `<rect x="3" y="7" width="20" height="4" fill="rgba(88,99,112,0.3)" stroke="#586370" stroke-dasharray="2 1.5"/>`,
        spinner: `<rect x="5" y="7" width="17" height="3" fill="#999" stroke="#444" stroke-width="0.8" transform="rotate(-22 13.5 8.5)"/><circle cx="13.5" cy="8.5" r="1.5" fill="#444"/><path d="M4.5 8A8 7 0 0 1 12 1.5" fill="none" stroke="#444" stroke-width="1.1"/><path d="M12 1.5L9.4 0.5M12 1.5L9.9 3.3" stroke="#444" stroke-width="1.1" stroke-linecap="round"/>`,
        wind: `<path d="M2 4H15A2.5 2.5 0 1 0 12.5 1.5M2 8H21A2.5 2.5 0 1 1 18.5 10.5M4 12H13" fill="none" stroke="#69c" stroke-width="1.5" stroke-linecap="round"/>`,
        portal: `<ellipse cx="5" cy="8" rx="2" ry="6" fill="none" stroke="hsl(197,100%,50%)" stroke-width="2"/><ellipse cx="21" cy="8" rx="2" ry="6" fill="none" stroke="hsl(29,100%,50%)" stroke-width="2"/><path d="M8 8H18" stroke="#999" stroke-width="1" stroke-dasharray="1.5 1.5"/>`,
        slime: `<path d="M2 7Q6 5 10 7T18 7T24 7V15H2Z" fill="hsla(160,100%,35%,0.65)"/>`,
        laser: `<rect x="2" y="5.5" width="4" height="5" fill="#444"/><path d="M6 8H24" stroke="rgba(255,0,0,0.25)" stroke-width="4"/><path d="M6 8H24" stroke="#f00" stroke-width="1.2"/>`,
        fizzler: `<rect x="8" y="1" width="10" height="2" fill="#444"/><rect x="8" y="13" width="10" height="2" fill="#444"/><path d="M10 3V13M13 3V13M16 3V13" stroke="rgba(0,170,255,0.75)" stroke-width="1" stroke-dasharray="1.5 1"/>`,
        button: `<g transform="translate(5.2 9.35) scale(0.12 0.3)"><polygon points="165,12 -35,12 -5,-8 135,-8" fill="#444"/><rect x="2" y="-21" width="126" height="20" fill="hsl(0,100%,70%)"/></g>`, //level.button in its own units, stretched taller so it reads: the map base and the red pad up on it
        toggle: `<g transform="translate(1.95 11.46) scale(0.17)"><polygon points="27.9,-52.7 17.3,-42.1 68.2,8.8 78.8,-1.8" fill="rgba(140,140,140,0.85)" stroke="#222" stroke-width="4"/><polygon points="135,12 -5,12 25,-8 105,-8" fill="#444"/></g>`, //level.toggle off: the block lever leaning left from its pin, into the map platform
        zone: `<rect x="3" y="2" width="20" height="12" fill="rgba(70,150,200,0.15)" stroke="#49c" stroke-dasharray="2 1.5"/><circle cx="13" cy="8" r="2.5" fill="none" stroke="#444" stroke-width="1"/>`,
        timer: `<circle cx="13" cy="8" r="6.5" fill="#fff" stroke="#444" stroke-width="1.3"/><path d="M13 8V4M13 8L16 9.5" stroke="#444" stroke-width="1.2" stroke-linecap="round"/>`,
        keyhole: `<g transform="translate(12.75 10.6) scale(0.125 0.18)"><polygon points="-70,12 70,12 70,-8 -70,-8" fill="#444"/><polygon points="-93,9 -93,-11 -73,-41 -47,-41 -18,9" fill="#444"/><polygon points="97,9 97,-11 77,-41 51,-41 22,9" fill="#444"/><rect x="-38" y="-26" width="80" height="25" fill="rgba(254,248,164,0.73)"/></g>`, //level.keyButton: the map base, its two cradle walls, and the key color between them
        key: `<g transform="translate(13 8) scale(0.22)"><polygon points="37.5,0 25,21.65 -25,21.65 -37.5,0 -25,-21.65 25,-21.65" fill="#FEF8A4" stroke="rgba(254,248,164,0.35)" stroke-width="22"/><polygon points="37.5,0 25,21.65 -25,21.65 -37.5,0 -25,-21.65 25,-21.65" fill="#FEF8A4" stroke="rgba(0,0,0,0.25)" stroke-width="3"/></g>`, //level.key: the glowing yellow hexagon, a faint edge so it shows on white
        door: `<rect x="9" y="1" width="5" height="14" fill="#666"/><path d="M19 12V3M16.5 5.5L19 2.5L21.5 5.5" fill="none" stroke="#444" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    },
    elementIcon(arg) { //"type" or "type:preset", or nothing for a type without a picture
        const picture = levelEditor.elementIcons[arg]
        return picture ? `<svg class="le-mob-icon" width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">${picture}</svg>` : ""
    },
    drawButtons: [ //the add menu's drawing row under the shapes: [command, arg, picture], 30 × 22 like the shapes, in the colors each one starts with
        ["add", "fill", `<rect x="3" y="2" width="16" height="12" fill="rgba(0,0,0,0.25)"/><circle cx="19" cy="13.5" r="7.5" fill="rgba(0,0,0,0.25)"/>`], //a see-through rect and circle overlapping, it can be either, or an ellipse
        ["drawPath", "path", `<polyline points="3,18 7,10 13,13 16,5 22,9 27,4" fill="none" stroke="#444" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`], //uneven, so it doesn't read as a letter
        ["add", "fill:exit fill", `<rect x="3" y="2" width="24" height="18" fill="#d4f4f4" stroke="#9cc"/><path d="M11 20V10a4 4 0 0 1 8 0V20Z" fill="#c8eef0" stroke="#466"/><rect x="1" y="20" width="28" height="2" fill="#444"/>`], //the cyan room around the exit door
        ["add", "text", `<path transform="translate(2.1 4.4) scale(0.33)" d="M-1 0H21M10 0V40M29 0L48 40M48 0L29 40M57 0H79M68 0V40" fill="none" stroke="#444" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>`], //"txt" in the game's stroke font, simulation.draw.font's t() and x()
    ],
    svgIcon(picture, fill = "none") { //one of the saved pictures above as a 30 × 22 svg
        return `<svg width="30" height="22" viewBox="0 0 30 22" fill="${fill}" stroke="none" aria-hidden="true">${picture}</svg>`
    },
    drawButtonsHtml() {
        return levelEditor.drawButtons.map(([command, arg, picture]) => {
            const [name, preset] = arg.split(":")
            const type = levelElements.types[name]
            const tip = preset ? type.tips[preset] : type.tip
            return levelEditor.button(command, levelEditor.svgIcon(picture), arg, command === "drawPath" && !!levelEditor.pathDraw, `${preset || type.label}, ${tip}`, { className: "le-shape" })
        }).join("")
    },
    toolIcon(tool) { //tiny drawings for the status bar's draw tools, simple enough to read from far away
        const icons = {
            select: `<rect x="4.5" y="0.5" width="8" height="13" rx="4" fill="#fff" stroke="#333"/><path d="M4.5 5.5 H12.5 M8.5 0.5 V5.5" stroke="#333"/><path d="M8.5 0.5 A4 4 0 0 0 4.5 4.5 V5.5 H8.5 Z" fill="#0cf"/>`,
            map: `<rect x="1.5" y="2" width="14" height="10" fill="${color.map}"/>`,
            block: `<rect x="2.5" y="2.5" width="12" height="9" fill="${color.block}" stroke="${color.blockS}" stroke-width="1.5"/>`,
            measure: `<rect x="0.5" y="3.5" width="16" height="7" fill="#fd4" stroke="#333"/><path d="M4.5 3.5 V6.5 M8.5 3.5 V7.5 M12.5 3.5 V6.5" stroke="#333"/>`,
            pan: `<path d="M8.5 1 L6.5 3 M8.5 1 L10.5 3 M8.5 13 L6.5 11 M8.5 13 L10.5 11 M2 7 L4 5 M2 7 L4 9 M15 7 L13 5 M15 7 L13 9 M8.5 1 V13 M2 7 H15" fill="none" stroke="#333" stroke-width="1.3" stroke-linecap="round"/>`,
        }
        return `<svg class="le-tool-icon" viewBox="0 0 17 14" width="17" height="14" aria-label="${tool}">${icons[tool]}</svg>`
    },
    arrowIcon(name) { //undo curls back to the left, redo is it mirrored, in the text color so disabled grays them
        const flip = name === "redo" ? ` transform="matrix(-1 0 0 1 16 0)"` : ""
        return `<svg class="le-tool-icon" viewBox="0 0 16 14" width="16" height="14" aria-label="${name}"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"${flip}><path d="M3.5 5 H9 A4 4 0 0 1 9 13 H6"/><path d="M6.5 2 L3.5 5 L6.5 8"/></g></svg>`
    },
    alignIcon(edge) { //bars against a line, for the inspector's align buttons
        const isX = ["left", "center", "right"].includes(edge)
        const at = { left: 2, center: 7, right: 12, top: 2, middle: 7, bottom: 12 }[edge]
        const shapes = [[3, 9], [5, 5]].map(([along, size], i) => {
            const start = edge === "left" || edge === "top" ? at : edge === "right" || edge === "bottom" ? at - size : at - size / 2
            return isX ? `<rect x="${start}" y="${along + i * 3}" width="${size}" height="2.5" fill="currentColor"/>` : `<rect x="${along + i * 3}" y="${start}" width="2.5" height="${size}" fill="currentColor"/>`
        }).join("")
        const line = isX ? `<path d="M${at} 1 V13" stroke="currentColor" stroke-width="0.8"/>` : `<path d="M1 ${at} H13" stroke="currentColor" stroke-width="0.8"/>`
        return `<svg class="le-tool-icon le-align-icon" viewBox="0 0 14 14" width="14" height="14" aria-label="align ${edge}">${line}${shapes}</svg>`
    },
})
