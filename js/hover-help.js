"use strict";

(() => {
    const popover = document.getElementById("hover-help");
    if (!popover) return

    const supportsPopover = typeof popover.showPopover === "function";
    const escapeHTML = text => String(text).replace(/[&<>"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    })[character])
    const keyLabel = code => escapeHTML(code).replace("Key", "").replace("Digit", "")
    const couplingDefinition = `// <strong class="color-coupling">coupling</strong> improves every field differently
<br><br>// field emitter: all applicable effects<br>
standing wave: +5 max energy<br>
perfect diamagnetism: deflecting makes ice IX<br>
negative mass: 0.977x damage taken<br>
molecular assembler: +1 energy per second<br>
plasma torch: 1.02x damage<br>
time dilation: 1.05x longer stopped time<br>
metamaterial cloaking: 1.060x ambush damage<br>
pilot wave: 1.05x block collision damage<br>
wormhole: +3 energy after eating a block<br>
grappling hook: ammo power ups give 5% more ammo
<br><br>// <em>in physics, coupled systems interact so a change in one can influence the other</em>`
    const definitions = {
        "orb-coupling": couplingDefinition,
        // coupling: couplingDefinition,
        "orb-field": `// gives you a choice between 2 <strong class="energy">fields</strong>`,
        "orb-gun": `// gives you a choice between 2 <strong class="color-g">guns</strong>`,
        "orb-tech": `// gives you a choice between 3 <strong class="color-var">tech</strong>`,
        "orb-field-tech": `// <strong class="energy">field tech</strong><br>upgrade your field`,
        "orb-gun-tech": `// <strong class="color-g">gun tech</strong><br>upgrade your guns`,
        "orb-skin": `// a <strong>skin</strong> changes the player appearance and gives an extra strong upgrade<br><br>// you can only have one`,
        "orb-skin-upgrade": `// <strong>skin tech</strong><br>upgrades your skin`,
        "orb-ammo": `// adds ammunition<br>to all you guns`,
        "orb-research": `// used to <strong class="color-r">research</strong> (reroll) gun, field, and tech choices
        <br><br>// also expended<br>for certain tech`,
        "orb-heal": `// <strong class="color-h">heal</strong> power ups<br>restore health`,
        "orb-energy": `// increases max energy`,
        "orb-boost": `// temporarily increases damage`,
        "dark-matter": `// <strong class="color-dark-matter">dark matter</strong> follows you and reduces damage taken when you are inside it
        <br><br>// <em>dark matter is hypothetical invisible matter inferred from unexplained gravity</em>`,
        "alternate-reality": `// entering an <strong class="alt">alternate reality</strong> randomizes guns, ammo, field, tech, health, research, and coupling
        <br><br>// <em>in the many-worlds interpretation, quantum events form non-interacting branches with internally consistent histories</em>`,
        "fire-rate": `// <span class="color-fire-rate">fire rate</span> controls how often a weapon fires<br><br>// higher <span class="color-fire-rate">fire rate</span> means less delay between shots`,
        block: `// <strong class="block">blocks</strong> are grey polygons
        <br><br>// throw <strong class="block">blocks</strong> to do high collision damage to mobs
        <strong class="block" style="display: inline-block; width: 30px; height: 60px;margin-right:10px;"></strong><strong class="block" style="display: inline-block; width: 50px; height: 30px;margin-right:3px;"> </strong><strong class="block" style="display: inline-block; width: 10px; height: 10px;"> </strong>`,
        damage: `// <strong class="color-d">damage</strong> scales how fast you destroy mobs`,
        explode: `// <span style="position: absolute; z-index: -1; width: 170px; height: 170px; background-color: rgba(255, 166, 0, 0.2); border-radius: 50%;"></span>
        <strong class='explode'>explosions</strong> damage the player and mobs in a circle
        <br><br>// <em>a rapid expansion in volume of a given amount of matter associated with an extreme outward release of energy</em>`,
        energy: `// <div style="background-color: rgb(0, 195, 255); height: 4px; width: 100%;"></div>
        your <strong class="energy">energy</strong> is the bar above the player
        <br><br>// <strong class="energy">energy</strong> is consumed by your <strong class="energy">field</strong> and slowly regenerates over time
        <br><br>// <em>the quantitative property that is transferred to a body or to a physical system, recognizable in the capacity to do work</em>`,
        cloaking: `// while <strong class="color-cloaked">cloaked</strong> mobs cannot see or target the player and it prevents electromagnetic damage
        <br><br>// <em>cloaking obscures objects from specific wavelengths of electromagnetic emissions</em>`,
        defense: `// <div style="background-color: rgb(255, 255, 255); height: 4px; width: 100%;border:1px solid #000;"></div>
        your <strong class='color-defense'>damage taken</strong> is the white bar in the top left
        <br><br>// <strong class="color-defense">damage taken</strong> scales how much health the player loses from attacks`,
        movement: `// <strong class="color-speed">movement</strong> scales <br> player run speed`,
        health: `// <div style="background-color: rgb(9, 245, 166); height: 4px; width: 100%;"></div>
        your <strong class="color-h">health</strong> is the green bar in the top left
        <br><br>// <strong class="color-h">health</strong> decreases when you take damage and is restored by heal power ups`,
        bot: `// <strong class="color-bot">bots</strong> follow the player and automatically attack nearby mobs without using ammo`,
        choice: `// <strong class="color-choice"><span>ch</span><span>oi</span><span>ces</span></strong> are the options offered by gun, field, and tech power ups`,
        duplicate: `// <strong class="color-dup">duplication</strong> increases your chance to create an extra copy of spawned power ups`,
        remove: `// <strong class="color-remove">removing</strong> takes a tech out of your build`,
        eject: `// <strong class="color-remove">ejecting</strong> removes a tech from your build and spawns a new tech power up`,
        research: `// <strong class="color-r">research</strong> rerolls gun, field, and tech choices
        <br><br>// it can also be used as a currency to trade for certain tech`,
        wormhole: `// <strong class="color-worm">wormholes</strong> teleport the player, collect power ups, and consume nearby blocks
        <br><br>// <em>a wormhole connects locations in spacetime</em>`,
        wire: `// <strong class="color-wire">filament</strong> is a thin strand attached to the player
        <br><br>// filament grows after consuming power ups and shrinks after touching mobs`,
        junk: `// <strong class="color-junk">JUNK</strong> tech are ideas that didn't work out because they were annoying, harmful, or overpowered`,
        pause: () => `// press <strong class="color-paused">${keyLabel(input.key.pause)}</strong> to pause the simulation and see your tech, guns, and field`,
        invulnerability: `// while <strong class="color-invulnerable">invulnerable</strong> you take no damage but energy does not regenerate`,
        tokamak: `// <strong class="color-tokamak">tokamak</strong> converts thrown blocks into energy and a pulsed fusion explosion
        <br><br>// <em>a tokamak uses powerful magnetic fields to confine plasma in a torus for controlled fusion</em>`,
        expend: `// <strong class="expend">expend</strong> consumes the shown research power ups`,
        radioactive: `// <strong class="color-p">radioactive</strong> effects deal damage over time
        <br><br>// <em>radioactive decay occurs when an unstable nucleus loses energy through radiation</em>`,
        spore: `// <strong class="spore">spores</strong>, <strong class="spore">fleas</strong>, and <strong class="spore">worms</strong> are biological projectiles that seek<br>nearby mobs
        <br><br>// sporangium attach to surfaces and grow <strong class="spore">spores</strong>, <strong class="spore">fleas</strong>, or <strong class="spore">worms</strong>
        <br><br>// <em>a sporangium is an enclosure where biological spores are grown</em>`,
        slow: `// <strong class="color-s">slows</strong> reduce mob movement speed`,
        plasma: `// <strong class="color-plasma">plasma</strong> damages<br>and slows mobs it touches
        <br><br>// <em>plasma is an ionized state of matter containing freely moving charged particles</em>`,
        laser: `<svg class="hover-help-laser-path" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <polyline points="0,94 200,34 87,0 0,26 200,86"></polyline>
        </svg><span class="hover-help-laser-copy">// <strong class="color-laser">laser</strong> beams bounce<br>off walls and instantly<br>damage mobs
        <br><br>// <em>lasers produce coherent light through amplification by stimulated emission</em></span>`,
    }
    const showDelay = 250;
    const hideDelay = 250;
    let activeTarget = null;
    let showTimer = null;
    let hideTimer = null;

    function definitionFor(target) {
        const definition = definitions[target.dataset.help]
        return typeof definition === "function" ? definition() : definition
    }

    function isOpen() {
        return supportsPopover ? popover.matches(":popover-open") : popover.classList.contains("hover-help-open")
    }

    function position(target) {
        const gap = 8;
        const edge = 8;
        const targetBounds = target.getBoundingClientRect();
        const popoverBounds = popover.getBoundingClientRect();
        let left = targetBounds.left + (targetBounds.width - popoverBounds.width) / 2;
        let top = targetBounds.bottom + gap;

        left = Math.max(edge, Math.min(left, window.innerWidth - popoverBounds.width - edge));
        if (top + popoverBounds.height > window.innerHeight - edge) {
            top = Math.max(edge, targetBounds.top - popoverBounds.height - gap);
        }

        popover.style.left = `${Math.round(left)}px`;
        popover.style.top = `${Math.round(top)}px`;
    }

    function show(target) {
        const definition = definitionFor(target);
        if (!definition || !target.isConnected) return

        activeTarget = target;
        target.setAttribute("aria-describedby", popover.id);
        popover.dataset.helpKey = target.dataset.help;
        // Definitions are authored locally; never pass untrusted text to this HTML sink.
        popover.innerHTML = definition;
        if (!isOpen()) {
            if (supportsPopover) {
                popover.showPopover();
            } else {
                popover.classList.add("hover-help-open");
            }
        }
        position(target);
    }

    function hide() {
        if (activeTarget) activeTarget.removeAttribute("aria-describedby");
        activeTarget = null;
        if (isOpen()) {
            if (supportsPopover) {
                popover.hidePopover();
            } else {
                popover.classList.remove("hover-help-open");
            }
        }
    }

    function matchingTarget(event) {
        return event.target instanceof Element ? event.target.closest("[data-help]") : null
    }

    document.addEventListener("pointerover", event => {
        const target = matchingTarget(event);
        if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return

        clearTimeout(hideTimer);
        clearTimeout(showTimer);
        if (activeTarget === target && isOpen()) return
        showTimer = setTimeout(() => show(target), showDelay);
    });

    document.addEventListener("pointerout", event => {
        const target = matchingTarget(event);
        if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))) return

        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, hideDelay);
    });

    document.addEventListener("focusin", event => {
        const target = matchingTarget(event);
        if (!target) return

        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        show(target);
    });

    document.addEventListener("focusout", event => {
        const target = matchingTarget(event);
        if (!target) return

        clearTimeout(showTimer);
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, hideDelay);
    });

    function reposition() {
        if (activeTarget && activeTarget.isConnected && isOpen()) {
            position(activeTarget);
        } else if (isOpen()) {
            hide();
        }
    }

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
})();
