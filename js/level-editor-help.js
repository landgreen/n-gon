"use strict";
//the level editor's help menu, a guide from a blank level to a submitted one, off for now, see the help section in levelEditor.sections
//loads after js/level-editor.js and adds to levelEditor
Object.assign(levelEditor, {
    help: [ //the help menu, a guide from a blank level to a submitted one, each [title, html] folds on its own
        ["start here", `
            <p>You don't need to write any JavaScript to make a level. The editor writes it for you and saves your changes in this browser as you go.</p>
            <p><b>Map</b> pieces are solid ground and walls that stay in place. <b>Blocks</b> can move and be pushed around. Every level also has an <b>entrance</b>, where the player starts, and an <b>exit</b>.</p>
            <ol>
                <li>Draw the ground and walls with the <b>map</b> tool.</li>
                <li>Select and drag <b>entrance</b> and <b>exit</b> into place.</li>
                <li>Open <b>add</b> to place <b>mob</b> spots, a <b>boss</b>, and a <b>starting</b> power up.</li>
                <li>Press <b>▶ quick test</b> in <b>simulation</b> to play. Press <b>■ stop</b> to return to editing.</li>
                <li>Click the issues count in the bottom bar to check for problems. When you're ready to share, use <b>export</b> in <b>import/export</b>.</li>
            </ol>`],
        ["drawing", `
            <ul>
                <li><b>C</b> cycles through select, pan, map, block, and measure. You can also click their icons in the bottom bar. Pan drags the view, handy on a trackpad.</li>
                <li>With map or block selected, drag with the left mouse button to draw. With select, drag an object to move it or drag across empty space to select several. The right mouse button always selects and moves.</li>
                <li>Hold shift and click to add or remove objects from your selection.</li>
                <li>Drag the squares around a selection to resize it. Hold alt to move or resize without snapping to the grid.</li>
                <li>The shapes at the top of <b>add</b> make ramps, domes, stairs, and more.</li>
                <li>Select a map piece or block and press <b>V</b> or <b>vertices</b> to edit its corners. These shapes can't have inward dents; use several pieces to make those.</li>
                <li>The angle box and ↻ buttons rotate your selection. Hold shift when clicking a ↻ button to turn the other way.</li>
                <li>⌘Z undoes a change, ⌘⇧Z redoes it. <b>History</b> lets you return to an earlier step.</li>
                <li>⌘X cuts, ⌘C copies, and ⌘V pastes at the mouse. Use ctrl instead of ⌘ on Windows or Linux. Delete removes the selection. The keys under the info box do the same when clicked.</li>
                <li>Scroll to zoom. Drag with the middle mouse button (or the pan tool) to move the view, middle click to center on the player, or double-click either one to teleport the player to the mouse. Mouse 4 and 5 (the back and forward buttons) teleport with one click. <b>fit</b> in the bottom bar shows the whole level, or just the selection.</li>
                <li>With objects selected, <b>flip</b> mirrors them, <b>to top</b> and <b>to bottom</b> change which drawing is on top, and a drawing's <b>layer</b> puts it under or over the player, and with several selected you can line up their edges or <b>group</b> them so clicking one selects them all.</li>
                <li>Tab hides or shows the panels.</li>
            </ul>`],
        ["the info box", `
            <p>Select an object to see its settings in the box on the right. They look like code, but you can edit them directly. Click a number to type a new value, or use ↑ and ↓ to adjust it. Hold shift with the arrow keys for steps 10 times larger.</p>
            <p>Select several objects to change their shared settings at once. Press esc to deselect them and see the whole level's settings: its name, zoom, colors, and gravity.</p>
            <p>The gray box at the bottom shows the JavaScript the editor writes for that object. You can leave it alone.</p>
            <p>Use <b>explorer</b> to find objects that are hard to click. Lock an object to avoid selecting it by accident, or hide it while editing. Hidden objects still appear in tests.</p>`],
        ["a good level", `
            <p>These are starting points based on the game's existing levels, not strict rules.</p>
            <ul>
                <li>Give the player a clear route from the entrance, through a few rooms or climbs, to the exit. Existing levels keep the exit at least 450 units from the entrance.</li>
                <li>Drag with the <b>measure</b> tool from where the player stands to check a jump. Green means it should be reachable. A normal jump reaches about 390 units up or 570 across at full speed; test the jump yourself too.</li>
                <li>Put the <b>boss</b> at least 1400 units from the entrance. Place the <b>starting</b> power up away from the entrance too, so players explore to find it.</li>
                <li>Spread 15 to 20 <b>mob</b> spots around the level. These are possible spawn locations: the game uses some of them, with more mobs later in a run.</li>
                <li>Aim for 2 to 12 heal and ammo power ups in total. <b>Random</b> places a heal or ammo, and <b>debris</b> scatters small blocks and power ups.</li>
                <li>Keep it light: aim for fewer than about 100 map pieces and 50 blocks. Fewer, larger pieces usually run better than many small ones.</li>
                <li>The level's <b>zoom</b> controls how much the camera shows during a run. Higher numbers show more; existing levels use 1300 to 2600.</li>
                <li>Use fills to make rooms easier to read. A light exit fill helps mark the end.</li>
                <li>Click the issues count in the bottom bar for suggestions. <b>Fix</b> marks missing essentials, <b>warn</b> marks likely problems, and <b>note</b> marks something unusual that may be fine.</li>
            </ul>`],
        ["testing", `
            <ul>
                <li><b>▶ quick test</b> returns the player to the entrance and puts blocks back where they started. Turn on <b>mobs</b> to include mobs and power ups in the test, and <b>invincible</b> to explore without taking damage.</li>
                <li><b>level</b> sets how far into a run you're testing. Try 1 and 10 to see how the fights change. At 0, random mobs don't spawn.</li>
                <li><b>▶ test export</b> runs the code that <b>export</b> produces, with the normal game camera and mouse controls. It always includes mobs and power ups. You don't need to know JavaScript to use it; try it before sharing your level.</li>
                <li><b>Time</b> slows the game so you can watch something closely. Test export ignores it, and grays out the settings it doesn't use.</li>
                <li>The buttons below the camera list show outlines, movement, and collision points to help explain how objects behave.</li>
                <li>Play all the way to the exit, and try falling off the edges. The exit won't take you to another level while you're in the editor.</li>
            </ul>`],
        ["buttons and moving parts", `
            <p>Open the <b>element</b> and <b>trigger</b> lists in <b>add</b> for boosts, conveyors, elevators, portals, hazards, controls, and decorations.</p>
            <p>A <b>button</b>, <b>toggle</b>, <b>zone</b>, <b>keyhole</b>, or <b>logic</b> timer can control other objects. A button responds to weight, a toggle is a lever, a zone detects something inside it, a timer switches on and off, and a keyhole needs a matching key.</p>
            <p>Select a control, press <b>link</b>, then click the object you want it to control. For example, a linked <b>door</b> opens while the button is pressed. Press esc to stop linking.</p>
            <p>A block's <b>constraint</b> can pin it to a point in the level, or set its <b>anchor</b> to another block to tie the two together, like a chain or a pendulum.</p>
            <p>Link two controls to the same object and either can turn it on. Link one control to another and both must be on. For example, link a zone to a logic timer, then the timer to a laser, to make the laser pulse only while something is in the zone.</p>`],
        ["code", `
            <p>Code is optional. For behavior the editor's tools can't make, <b>code</b> at the bottom of the level's info box (click empty space) lets you add your own JavaScript.</p>
            <p>To explore how existing levels work, open one from <b>load more levels</b> in <b>import/export</b>. This makes a local copy, so you can experiment without changing the original.</p>
            <p>If you're writing code: each code element runs when the level loads and can use variables defined in earlier code elements. Put behavior that needs to repeat each frame in <code>level.custom</code>.</p>`],
        ["sharing and submitting", `
            <ul>
                <li>Your levels are saved in this browser. Use <b>export</b>, then <b>download</b> to save a backup file, or <b>copy</b> to share the text. If the bottom bar ever says <b>not saved</b>, export a backup right away.</li>
                <li>Keep the whole export, including its final <code>//level editor:</code> line. That line lets <b>import</b> restore all the editable objects.</li>
                <li><b>Import</b> saves a new local level, paste the text or use <b>open file</b>. Your current level is kept, and an imported name already in use gets a number added. <b>Fork</b> is also an easy way to experiment on a copy.</li>
                <li><b>Add to level pool</b> includes the level in your own runs. It doesn't publish it.</li>
                <li>Before submitting, play from start to finish with mobs on and try <b>test export</b>. Resolve the <b>fix</b> items in the issues list and review any warnings.</li>
                <li>To suggest your level for the game, open an issue on <a href="https://github.com/landgreen/n-gon/issues" target="_blank" rel="noopener">github.com/landgreen/n-gon</a> titled <i>New community map: your level's name</i> and paste the full export into it.</li>
                <li>Submit once and allow time for a reply. It may take days or weeks.</li>
            </ul>`],
    ],
    helpHtml() { //each part of the guide folds, and stays the way the player left it
        const open = levelEditor.openSections()
        return levelEditor.help.map(([title, html], i) => `<details class="le-load-group le-help" data-section="help-${i}"${open[`help-${i}`] ? " open" : ""}><summary>${title}</summary><div class="le-help-text">${html}</div></details>`).join("")
    },
})
