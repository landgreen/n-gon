"use strict";
//collision groups
//   cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet | cat.mobShield | cat.phased
const cat = {
    player: 0x1,
    map: 0x10,
    body: 0x100,
    bullet: 0x1000,
    powerUp: 0x10000,
    mob: 0x100000,
    mobBullet: 0x1000000,
    mobShield: 0x10000000,
    phased: 0x100000000,
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

// shrink power up selection menu to find window height
if (screen.height < 800) {
    document.getElementById("choose-grid").style.fontSize = "1em"; //1.3em is normal
    if (screen.height < 600) document.getElementById("choose-grid").style.fontSize = "0.8em"; //1.3em is normal
}


//**********************************************************************
// check for URL parameters to load a custom game
//**********************************************************************

//example  https://landgreen.github.io/sidescroller/index.html?
//          &gun1=minigun&gun2=laser
//          &mod1=laser-bot&mod2=mass%20driver&mod3=overcharge&mod4=laser-bot&mod5=laser-bot&field=phase%20decoherence%20field&difficulty=2
//add ? to end of url then for each power up add
// &gun1=name&gun2=name
// &mod1=laser-bot&mod2=mass%20driver&mod3=overcharge&mod4=laser-bot&mod5=laser-bot
// &field=phase%20decoherence%20field
// &difficulty=2
//use %20 for spaces
//difficulty is 0 easy, 1 normal, 2 hard, 4 why
function getUrlVars() {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, k, v) {
        vars[k] = v;
    });
    return vars;
}
window.addEventListener('load', (event) => {
    const set = getUrlVars()
    if (Object.keys(set).length !== 0) {
        openCustomBuildMenu();
        //add custom selections based on url
        for (const property in set) {
            set[property] = set[property].replace(/%20/g, " ")
            set[property] = set[property].replace(/%CE%A8/g, "Ψ")
            if (property === "field") {
                let found = false
                let index
                for (let i = 0; i < mech.fieldUpgrades.length; i++) {
                    if (set[property] === mech.fieldUpgrades[i].name) {
                        index = i;
                        found = true;
                        break;
                    }
                }
                if (found) build.choosePowerUp(document.getElementById(`field-${index}`), index, 'field')
            }
            if (property.substring(0, 3) === "gun") {
                let found = false
                let index
                for (let i = 0; i < b.guns.length; i++) {
                    if (set[property] === b.guns[i].name) {
                        index = i;
                        found = true;
                        break;
                    }
                }
                if (found) build.choosePowerUp(document.getElementById(`gun-${index}`), index, 'gun')
            }
            if (property.substring(0, 3) === "mod") {
                for (let i = 0; i < mod.mods.length; i++) {
                    if (set[property] === mod.mods[i].name) {
                        build.choosePowerUp(document.getElementById(`mod-${i}`), i, 'mod', true)
                        break;
                    }
                }
            }
            if (property === "difficulty") {
                game.difficultyMode = Number(set[property])
                document.getElementById("difficulty-select-custom").value = Number(set[property])
            }
            if (property === "level") {
                document.getElementById("starting-level").value = Number(set[property])
            }
            if (property === "noPower") {
                document.getElementById("no-power-ups").checked = Number(set[property])
            }
        }
    }
});


//**********************************************************************
//set up canvas
//**********************************************************************
var canvas = document.getElementById("canvas");
//using "const" causes problems in safari when an ID shares the same name.
const ctx = canvas.getContext("2d");
document.body.style.backgroundColor = "#fff";

//disable pop up menu on right click
document.oncontextmenu = function() {
    return false;
}

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.width2 = canvas.width / 2; //precalculated because I use this often (in mouse look)
    canvas.height2 = canvas.height / 2;
    canvas.diagonal = Math.sqrt(canvas.width2 * canvas.width2 + canvas.height2 * canvas.height2);
    // ctx.font = "18px Arial";
    // ctx.textAlign = "center";
    ctx.font = "25px Arial";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // ctx.lineCap='square';
    game.setZoom();
}
setupCanvas();
window.onresize = () => {
    setupCanvas();
};

//**********************************************************************
// custom build grid display and pause
//**********************************************************************
const build = {
    onLoadPowerUps() {
        const set = getUrlVars()
        if (Object.keys(set).length !== 0) {
            for (const property in set) {
                set[property] = set[property].replace(/%20/g, " ")
                if (property.substring(0, 3) === "gun") b.giveGuns(set[property])
                if (property.substring(0, 3) === "mod") mod.giveMod(set[property])
                if (property === "field") mech.setField(set[property])
                if (property === "difficulty") {
                    game.difficultyMode = Number(set[property])
                    document.getElementById("difficulty-select").value = Number(set[property])
                }
                if (property === "level") {
                    level.levelsCleared += Number(set[property]);
                    level.difficultyIncrease(Number(set[property]) * game.difficultyMode) //increase difficulty based on modes
                    spawn.setSpawnList(); //picks a couple mobs types for a themed random mob spawns
                    level.onLevel++
                }
            }
            for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
            bullet = []; //remove any bullets that might have spawned from mods
            if (b.inventory.length > 0) {
                b.activeGun = b.inventory[0] //set first gun to active gun
                game.makeGunHUD();
            }
        }
    },
    pauseGrid() {
        let text = ""
        if (!game.isChoosing) text += `<div class="pause-grid-module">
      <span style="font-size:1.5em;font-weight: 600;">PAUSED</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; press P to resume</div>
      <div class="pause-grid-module" style = "font-size: 13px;line-height: 120%;padding: 5px;">
      <strong class='color-d'>damage</strong> increase: ${((mod.damageFromMods()-1)*100).toFixed(0)}%
      <br><strong class='color-harm'>harm</strong> reduction: ${((1-mech.harmReduction())*100).toFixed(0)}%
      <br><strong>fire delay</strong> decrease: ${((1-b.fireCD)*100).toFixed(0)}%
      <br>
      <br><strong class='color-r'>rerolls</strong>: ${powerUps.reroll.rerolls}
      <br><strong class='color-h'>health</strong>: (${(mech.health*100).toFixed(0)} / ${(mech.maxHealth*100).toFixed(0)}) &nbsp; <strong class='color-f'>energy</strong>: (${(mech.energy*100).toFixed(0)} / ${(mech.maxEnergy*100).toFixed(0)})
      <br>position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}) &nbsp; velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})
      <br>mouse: (${game.mouseInGame.x.toFixed(1)}, ${game.mouseInGame.y.toFixed(1)}) &nbsp; mass: ${player.mass.toFixed(1)}      
      <br>
      <br>level: ${level.levels[level.onLevel]} (${level.difficultyText()}) &nbsp; ${mech.cycle} cycles
      <br>${mob.length} mobs, &nbsp; ${body.length} blocks, &nbsp; ${bullet.length} bullets, &nbsp; ${powerUp.length} power ups      
      <br>damage difficulty scale: ${(b.dmgScale*100).toFixed(2) }%
      <br>harm difficulty scale: ${(game.dmgScale*100).toFixed(0)}%
      <br>heal difficulty scale: ${(game.healScale*100).toFixed(1)}%
    </div>`;
        let countGuns = 0
        let countMods = 0
        for (let i = 0, len = b.guns.length; i < len; i++) {
            if (b.guns[i].have) {
                text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[i].name}</div> ${b.guns[i].description}</div>`
                countGuns++
            }
        }
        let el = document.getElementById("pause-grid-left")
        el.style.display = "grid"
        el.innerHTML = text
        text = "";
        text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[mech.fieldMode].name}</div> ${mech.fieldUpgrades[mech.fieldMode].description}</div>`
        for (let i = 0, len = mod.mods.length; i < len; i++) {
            if (mod.mods[i].count > 0) {
                if (mod.mods[i].count === 1) {
                    text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name}</div> ${mod.mods[i].description}</div>`
                } else {
                    text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name} (${mod.mods[i].count}x)</div> ${mod.mods[i].description}</div>`
                }
                countMods++
            }
        }
        el = document.getElementById("pause-grid-right")
        el.style.display = "grid"
        el.innerHTML = text
        if (countMods > 5 || countGuns > 6) {
            document.body.style.overflowY = "scroll";
            document.body.style.overflowX = "hidden";
        }
    },
    unPauseGrid() {
        document.body.style.overflow = "hidden"
        document.getElementById("pause-grid-left").style.display = "none"
        document.getElementById("pause-grid-right").style.display = "none"
        window.scrollTo(0, 0);
    },
    isCustomSelection: true,
    choosePowerUp(who, index, type, isAllowed = false) {
        if (type === "gun") {
            let isDeselect = false
            for (let i = 0, len = b.inventory.length; i < len; i++) { //look for selection in inventory
                if (b.guns[b.inventory[i]].name === b.guns[index].name) { //if already clicked, remove gun
                    isDeselect = true
                    who.classList.remove("build-gun-selected");
                    //remove gun
                    b.inventory.splice(i, 1)
                    b.guns[index].count = 0;
                    b.guns[index].have = false;
                    if (b.guns[index].ammo != Infinity) b.guns[index].ammo = 0;
                    if (b.inventory.length === 0) b.activeGun = null;
                    game.makeGunHUD();
                    break
                }
            }
            if (!isDeselect) { //add gun
                who.classList.add("build-gun-selected");
                b.giveGuns(index)
            }
        } else if (type === "field") {
            if (mech.fieldMode !== index) {
                document.getElementById("field-" + mech.fieldMode).classList.remove("build-field-selected");
                mech.setField(index)
                who.classList.add("build-field-selected");
            }
        } else if (type === "mod") { //remove mod if you have too many
            if (mod.mods[index].count < mod.mods[index].maxCount) {
                if (!who.classList.contains("build-mod-selected")) who.classList.add("build-mod-selected");
                mod.giveMod(index)
            } else {
                mod.removeMod(index);
                who.classList.remove("build-mod-selected");
            }
        }
        //update mod text //disable not allowed mods
        for (let i = 0, len = mod.mods.length; i < len; i++) {
            const modID = document.getElementById("mod-" + i)
            if (!mod.mods[i].isCustomHide) {
                if (mod.mods[i].allowed() || isAllowed) {
                    if (mod.mods[i].count > 1) {
                        modID.innerHTML = `<div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name} (${mod.mods[i].count}x)</div>${mod.mods[i].description}</div>`
                    } else {
                        modID.innerHTML = `<div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name}</div>${mod.mods[i].description}</div>`
                    }

                    if (modID.classList.contains("build-grid-disabled")) {
                        modID.classList.remove("build-grid-disabled");
                        modID.setAttribute("onClick", `javascript: build.choosePowerUp(this,${i},'mod')`);
                    }
                } else {
                    modID.innerHTML = `<div class="grid-title"><div class="circle-grid grey"></div> &nbsp; ${mod.mods[i].name}</div><span style="color:#666;"><strong>requires:</strong> ${mod.mods[i].requires}</span></div>`
                    if (!modID.classList.contains("build-grid-disabled")) {
                        modID.classList.add("build-grid-disabled");
                        modID.onclick = null
                    }
                    if (mod.mods[i].count > 0) mod.removeMod(i)
                    if (modID.classList.contains("build-mod-selected")) modID.classList.remove("build-mod-selected");
                }
            }
        }
    },
    populateGrid() {
        let text = `
  <div style="display: flex; justify-content: space-around; align-items: center;">
    <svg class="SVG-button" onclick="build.startBuildRun()" width="115" height="51">
      <g stroke='none' fill='#333' stroke-width="2" font-size="40px" font-family="Ariel, sans-serif">
        <text x="18" y="38">start</text>
      </g>
    </svg>
    <svg class="SVG-button" onclick="build.reset()" width="50" height="25">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
        <text x="5" y="18">reset</text>
      </g>
    </svg>
    <svg class="SVG-button" onclick="build.shareURL()" width="52" height="25">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
        <text x="5" y="18">share</text>
      </g>
    </svg>
  </div>
  <div style="align-items: center; text-align:center; font-size: 1.00em; line-height: 190%;background-color:var(--build-bg-color);">
    <div>starting level: <input id='starting-level' type="number" step="1" value="0" min="0" max="99"></div>
    <div>
    <label for="difficulty-select" title="effects: number of mobs, damage done by mobs, damage done to mobs, mob speed, heal effects">difficulty:</label>
      <select name="difficulty-select" id="difficulty-select-custom">
        <option value="1">easy</option>
        <option value="2" selected>normal</option>
        <option value="4">hard</option>
        <option value="6">why?</option>
      </select>
    </div>
    <div>
      <label for="no-power-ups" title="no mods, fields, or guns will spawn during the game">no power ups:</label>
      <input type="checkbox" id="no-power-ups" name="no-power-ups" style="width:17px; height:17px;">
    </div>
  </div>`
        for (let i = 0, len = mech.fieldUpgrades.length; i < len; i++) {
            text += `<div id ="field-${i}" class="build-grid-module" onclick="build.choosePowerUp(this,${i},'field')"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[i].name}</div> ${mech.fieldUpgrades[i].description}</div>`
        }

        for (let i = 0, len = b.guns.length; i < len; i++) {
            text += `<div id = "gun-${i}" class="build-grid-module" onclick="build.choosePowerUp(this,${i},'gun')"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[i].name}</div> ${b.guns[i].description}</div>`
        }
        for (let i = 0, len = mod.mods.length; i < len; i++) {
            if (!mod.mods[i].isCustomHide) {
                if (!mod.mods[i].allowed()) { // || mod.mods[i].name === "+1 cardinality") { //|| mod.mods[i].name === "leveraged investment"
                    text += `<div id="mod-${i}" class="build-grid-module build-grid-disabled"><div class="grid-title"><div class="circle-grid grey"></div> &nbsp; ${mod.mods[i].name}</div><span style="color:#666;"><strong>requires:</strong> ${mod.mods[i].requires}</span></div>`
                } else if (mod.mods[i].count > 1) {
                    text += `<div id="mod-${i}" class="build-grid-module" onclick="build.choosePowerUp(this,${i},'mod')"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name} (${mod.mods[i].count}x)</div> ${mod.mods[i].description}</div>`
                } else {
                    text += `<div id="mod-${i}" class="build-grid-module" onclick="build.choosePowerUp(this,${i},'mod')"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name}</div> ${mod.mods[i].description}</div>`
                }
            }
        }
        document.getElementById("build-grid").innerHTML = text
        document.getElementById("difficulty-select-custom").value = document.getElementById("difficulty-select").value
        document.getElementById("difficulty-select-custom").addEventListener("input", () => {
            game.difficultyMode = Number(document.getElementById("difficulty-select-custom").value)
            localSettings.difficultyMode = Number(document.getElementById("difficulty-select-custom").value)
            document.getElementById("difficulty-select").value = document.getElementById("difficulty-select-custom").value
            localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        });
    },
    reset() {
        build.isCustomSelection = true;
        mech.setField(0)

        b.inventory = []; //removes guns and ammo  
        for (let i = 0, len = b.guns.length; i < len; ++i) {
            b.guns[i].count = 0;
            b.guns[i].have = false;
            if (b.guns[i].ammo != Infinity) b.guns[i].ammo = 0;
        }
        b.activeGun = null;
        game.makeGunHUD();

        mod.setupAllMods();
        build.populateGrid();
        document.getElementById("field-0").classList.add("build-field-selected");
        document.getElementById("build-grid").style.display = "grid"
    },
    shareURL() {
        let url = "https://landgreen.github.io/sidescroller/index.html?"
        let count = 0;

        for (let i = 0; i < b.inventory.length; i++) {
            if (b.guns[b.inventory[i]].have) {
                url += `&gun${count}=${encodeURIComponent(b.guns[b.inventory[i]].name.trim())}`
                count++
            }
        }

        count = 0;
        for (let i = 0; i < mod.mods.length; i++) {
            for (let j = 0; j < mod.mods[i].count; j++) {
                url += `&mod${count}=${encodeURIComponent(mod.mods[i].name.trim())}`
                count++
            }
        }
        url += `&field=${encodeURIComponent(mech.fieldUpgrades[mech.fieldMode].name.trim())}`
        url += `&difficulty=${game.difficultyMode}`
        url += `&level=${Math.abs(Number(document.getElementById("starting-level").value))}`
        url += `&noPower=${Number(document.getElementById("no-power-ups").checked)}`
        console.log(url)
        game.copyToClipBoard(url)
        alert('n-gon build URL copied to clipboard.\nPaste into browser address bar.')
    },
    startBuildRun() {
        build.isCustomSelection = false;
        spawn.setSpawnList(); //gives random mobs,  not starter mobs
        spawn.setSpawnList();
        if (b.inventory.length > 0) {
            b.activeGun = b.inventory[0] //set first gun to active gun
            game.makeGunHUD();
        }
        for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
        bullet = []; //remove any bullets that might have spawned from mods
        const levelsCleared = Math.abs(Number(document.getElementById("starting-level").value))
        level.difficultyIncrease(Math.min(99, levelsCleared * game.difficultyMode)) //increase difficulty based on modes
        level.levelsCleared += levelsCleared;
        game.isNoPowerUps = document.getElementById("no-power-ups").checked
        if (game.isNoPowerUps) { //remove mods, guns, and fields
            function removeOne() { //recursive remove one at a time to avoid array problems
                for (let i = 0; i < powerUp.length; i++) {
                    if (powerUp[i].name === "mod" || powerUp[i].name === "gun" || powerUp[i].name === "field") {
                        Matter.World.remove(engine.world, powerUp[i]);
                        powerUp.splice(i, 1);
                        removeOne();
                        break
                    }
                }
            }
            removeOne();
        }
        game.isCheating = true;
        document.body.style.cursor = "none";
        document.body.style.overflow = "hidden"
        document.getElementById("build-grid").style.display = "none"
        game.paused = false;
        requestAnimationFrame(cycle);
    }
}

function openCustomBuildMenu() {
    document.getElementById("build-button").style.display = "none";
    const el = document.getElementById("build-grid")
    el.style.display = "grid"
    document.body.style.overflowY = "scroll";
    document.body.style.overflowX = "hidden";
    document.getElementById("info").style.display = 'none'
    game.startGame(true); //starts game, but pauses it
    build.isCustomSelection = true;
    game.paused = true;
    build.reset();
}

//record settings so they can be reproduced in the custom menu
document.getElementById("build-button").addEventListener("click", () => { //setup build run
    let field = 0;
    let inventory = [];
    let modList = [];
    if (!game.firstRun) {
        field = mech.fieldMode
        inventory = [...b.inventory]
        for (let i = 0; i < mod.mods.length; i++) {
            modList.push(mod.mods[i].count)
        }
    }
    openCustomBuildMenu();
    if (!game.firstRun) { //if player has already died once load that previous build
        build.choosePowerUp(document.getElementById(`field-${field}`), field, 'field')
        for (let i = 0; i < inventory.length; i++) {
            build.choosePowerUp(document.getElementById(`gun-${inventory[i]}`), inventory[i], 'gun')
        }
        for (let i = 0; i < modList.length; i++) {
            for (let j = 0; j < modList[i]; j++) {
                build.choosePowerUp(document.getElementById(`mod-${i}`), i, 'mod', true)
            }
        }
        //update mod text //disable not allowed mods  
        for (let i = 0, len = mod.mods.length; i < len; i++) {
            const modID = document.getElementById("mod-" + i)
            if (!mod.mods[i].isCustomHide) {
                if (mod.mods[i].allowed() || mod.mods[i].count > 1) {
                    if (mod.mods[i].count > 1) {
                        modID.innerHTML = `<div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name} (${mod.mods[i].count}x)</div>${mod.mods[i].description}</div>`
                    } else {
                        modID.innerHTML = `<div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[i].name}</div>${mod.mods[i].description}</div>`
                    }
                    if (modID.classList.contains("build-grid-disabled")) {
                        modID.classList.remove("build-grid-disabled");
                        modID.setAttribute("onClick", `javascript: build.choosePowerUp(this,${i},'mod')`);
                    }
                } else {
                    modID.innerHTML = `<div class="grid-title"><div class="circle-grid grey"></div> &nbsp; ${mod.mods[i].name}</div><span style="color:#666;"><strong>requires:</strong> ${mod.mods[i].requires}</span></div>`
                    if (!modID.classList.contains("build-grid-disabled")) {
                        modID.classList.add("build-grid-disabled");
                        modID.onclick = null
                    }
                }
            }
        }
    }
});

// ************************************************************************************************
// inputs
// ************************************************************************************************
const input = {
    fire: false, // left mouse
    field: false, // right mouse
    up: false, // jump
    down: false, // crouch
    left: false,
    right: false,
    isPauseKeyReady: true,
    key: {
        // fire: "ShiftLeft",
        field: "Space",
        up: "KeyW", // jump
        down: "KeyS", // crouch
        left: "KeyA",
        right: "KeyD",
        pause: "KeyP",
        nextGun: "KeyE",
        previousGun: "KeyQ",
        testing: "KeyT"
    },
    setDefault() {
        input.key = {
            // fire: "ShiftLeft",
            field: "Space",
            up: "KeyW", // jump
            down: "KeyS", // crouch
            left: "KeyA",
            right: "KeyD",
            pause: "KeyP",
            nextGun: "KeyE",
            previousGun: "KeyQ",
            testing: "KeyT"
        }
        input.controlTextUpdate()
    },
    controlTextUpdate() {
        function cleanText(text) {
            return text.replace('Key', '').replace('Digit', '')
        }
        document.getElementById("key-field").innerHTML = cleanText(input.key.field)
        document.getElementById("key-up").innerHTML = cleanText(input.key.up)
        document.getElementById("key-down").innerHTML = cleanText(input.key.down)
        document.getElementById("key-left").innerHTML = cleanText(input.key.left)
        document.getElementById("key-right").innerHTML = cleanText(input.key.right)
        document.getElementById("key-pause").innerHTML = cleanText(input.key.pause)
        document.getElementById("key-next-gun").innerHTML = cleanText(input.key.nextGun)
        document.getElementById("key-previous-gun").innerHTML = cleanText(input.key.previousGun)
        document.getElementById("key-testing").innerHTML = cleanText(input.key.testing)

        document.getElementById("splash-up").innerHTML = cleanText(input.key.up)[0]
        document.getElementById("splash-down").innerHTML = cleanText(input.key.down)[0]
        document.getElementById("splash-left").innerHTML = cleanText(input.key.left)[0]
        document.getElementById("splash-right").innerHTML = cleanText(input.key.right)[0]
        document.getElementById("splash-next-gun").innerHTML = cleanText(input.key.nextGun)[0]
        document.getElementById("splash-previous-gun").innerHTML = cleanText(input.key.previousGun)[0]

        localSettings.key = input.key
        localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    },
    focus: null,
    setTextFocus() {
        const backgroundColor = "#fff"
        document.getElementById("key-field").style.background = backgroundColor
        document.getElementById("key-up").style.background = backgroundColor
        document.getElementById("key-down").style.background = backgroundColor
        document.getElementById("key-left").style.background = backgroundColor
        document.getElementById("key-right").style.background = backgroundColor
        document.getElementById("key-pause").style.background = backgroundColor
        document.getElementById("key-next-gun").style.background = backgroundColor
        document.getElementById("key-previous-gun").style.background = backgroundColor
        document.getElementById("key-testing").style.background = backgroundColor
        if (input.focus) input.focus.style.background = 'rgb(0, 200, 255)';
    },
    setKeys(event) {
        //check for duplicate keys
        if (event.code && !(
                event.code === "ArrowRight" ||
                event.code === "ArrowLeft" ||
                event.code === "ArrowUp" ||
                event.code === "ArrowDown" ||
                event.code === input.key.field ||
                event.code === input.key.up ||
                event.code === input.key.down ||
                event.code === input.key.left ||
                event.code === input.key.right ||
                event.code === input.key.pause ||
                event.code === input.key.nextGun ||
                event.code === input.key.previousGun ||
                event.code === input.key.testing
            )) {
            switch (input.focus.id) {
                case "key-field":
                    input.key.field = event.code
                    break;
                case "key-up":
                    input.key.up = event.code
                    break;
                case "key-down":
                    input.key.down = event.code
                    break;
                case "key-left":
                    input.key.left = event.code
                    break;
                case "key-right":
                    input.key.right = event.code
                    break;
                case "key-pause":
                    input.key.pause = event.code
                    break;
                case "key-next-gun":
                    input.key.nextGun = event.code
                    break;
                case "key-previous-gun":
                    input.key.previousGun = event.code
                    break;
                case "key-testing":
                    input.key.testing = event.code
                    break;
            }
        }
        input.controlTextUpdate()
        input.endKeySensing()
    },
    endKeySensing() {
        window.removeEventListener("keydown", input.setKeys);
        input.focus = null
        input.setTextFocus()
    }
}

document.getElementById("control-table").addEventListener('click', (event) => {
    if (event.target.className === 'key-input') {
        input.focus = event.target
        input.setTextFocus()
        window.addEventListener("keydown", input.setKeys);
    }
});
document.getElementById("control-details").addEventListener("toggle", function() {
    input.controlTextUpdate()
    input.endKeySensing();
})

document.getElementById("control-reset").addEventListener('click', input.setDefault);

window.addEventListener("keyup", function(event) {
    switch (event.code) {
        case input.key.right:
        case "ArrowRight":
            input.right = false
            break;
        case input.key.left:
        case "ArrowLeft":
            input.left = false
            break;
        case input.key.up:
        case "ArrowUp":
            input.up = false
            break;
        case input.key.down:
        case "ArrowDown":
            input.down = false
            break;
        case input.key.field:
            input.field = false
            break
    }
});

window.addEventListener("keydown", function(event) {
    switch (event.code) {
        case input.key.right:
        case "ArrowRight":
            input.right = true
            break;
        case input.key.left:
        case "ArrowLeft":
            input.left = true
            break;
        case input.key.up:
        case "ArrowUp":
            input.up = true
            break;
        case input.key.down:
        case "ArrowDown":
            input.down = true
            break;
        case input.key.field:
            input.field = true
            break
        case input.key.nextGun:
            game.nextGun();
            break
        case input.key.previousGun:
            game.previousGun();
            break
        case input.key.pause:
            if (!game.isChoosing && input.isPauseKeyReady && mech.alive) {
                input.isPauseKeyReady = false
                setTimeout(function() {
                    input.isPauseKeyReady = true
                }, 300);
                if (game.paused) {
                    build.unPauseGrid()
                    game.paused = false;
                    level.levelAnnounce();
                    document.body.style.cursor = "none";
                    requestAnimationFrame(cycle);
                } else {
                    game.paused = true;
                    game.replaceTextLog = true;
                    build.pauseGrid()
                    document.body.style.cursor = "auto";
                }
            }
            break
        case input.key.testing:
            if (mech.alive) {
                if (game.testing) {
                    game.testing = false;
                    game.loop = game.normalLoop
                    if (game.isConstructionMode) {
                        document.getElementById("construct").style.display = 'none'
                    }
                } else { //if (keys[191])
                    game.testing = true;
                    game.isCheating = true;
                    if (game.isConstructionMode) {
                        document.getElementById("construct").style.display = 'inline'
                    }
                    game.loop = game.testingLoop
                }
            }
            break
    }
    if (game.testing) {
        switch (event.key) {
            case "o":
                game.isAutoZoom = false;
                game.zoomScale /= 0.9;
                game.setZoom();
                break;
            case "i":
                game.isAutoZoom = false;
                game.zoomScale *= 0.9;
                game.setZoom();
                break
            case "`":
                powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "reroll");
                break
            case "1":
                powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "heal");
                break
            case "2":
                powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "ammo");
                break
            case "3":
                powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "gun");
                break
            case "4":
                powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "field");
                break
            case "5":
                powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "mod");
                break
            case "6":
                const index = body.length
                spawn.bodyRect(game.mouseInGame.x, game.mouseInGame.y, 50, 50);
                body[index].collisionFilter.category = cat.body;
                body[index].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                body[index].classType = "body";
                World.add(engine.world, body[index]); //add to world
                break
            case "7":
                const pick = spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)];
                spawn[pick](game.mouseInGame.x, game.mouseInGame.y);
                break
            case "8":
                spawn.randomLevelBoss(game.mouseInGame.x, game.mouseInGame.y);
                break
            case "f":
                const mode = (mech.fieldMode === mech.fieldUpgrades.length - 1) ? 0 : mech.fieldMode + 1
                mech.setField(mode)
                break
            case "g":
                b.giveGuns("all", 1000)
                break
            case "h":
                mech.addHealth(Infinity)
                mech.energy = mech.maxEnergy;
                break
            case "y":
                mod.giveMod()
                break
            case "r":
                Matter.Body.setPosition(player, game.mouseInGame);
                Matter.Body.setVelocity(player, {
                    x: 0,
                    y: 0
                });
                // move bots to follow player
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType) {
                        Matter.Body.setPosition(bullet[i], Vector.add(player.position, {
                            x: 250 * (Math.random() - 0.5),
                            y: 250 * (Math.random() - 0.5)
                        }));
                        Matter.Body.setVelocity(bullet[i], {
                            x: 0,
                            y: 0
                        });
                    }
                }
                break
            case "u":
                level.bossKilled = true; //if there is no boss this needs to be true to increase levels
                level.nextLevel();
                break
            case "X": //capital X to make it hard to die
                mech.death();
                break
        }
    }
});
//mouse move input
document.body.addEventListener("mousemove", (e) => {
    game.mouse.x = e.clientX;
    game.mouse.y = e.clientY;
});

document.body.addEventListener("mouseup", (e) => {
    // input.fire = false;
    // console.log(e)
    if (e.which === 3) {
        input.field = false;
    } else {
        input.fire = false;
    }
});

document.body.addEventListener("mousedown", (e) => {
    if (e.which === 3) {
        input.field = true;
    } else {
        input.fire = true;
    }
});

document.body.addEventListener("mouseenter", (e) => { //prevents mouse getting stuck when leaving the window
    if (e.button === 1) {
        input.fire = true;
    } else {
        input.fire = false;
    }

    if (e.button === 3) {
        input.field = true;
    } else {
        input.field = false;
    }
});
document.body.addEventListener("mouseleave", (e) => { //prevents mouse getting stuck when leaving the window
    if (e.button === 1) {
        input.fire = true;
    } else {
        input.fire = false;
    }

    if (e.button === 3) {
        input.field = true;
    } else {
        input.field = false;
    }
});

document.body.addEventListener("wheel", (e) => {
    if (!game.paused) {
        if (e.deltaY > 0) {
            game.nextGun();
        } else {
            game.previousGun();
        }
    }
}, {
    passive: true
});

//**********************************************************************
//  local storage
//**********************************************************************
let localSettings = JSON.parse(localStorage.getItem("localSettings"));
if (localSettings) {
    if (localSettings.key) {
        input.key = localSettings.key
    } else {
        input.setDefault()
    }


    game.isCommunityMaps = localSettings.isCommunityMaps
    document.getElementById("community-maps").checked = localSettings.isCommunityMaps
    game.difficultyMode = localSettings.difficultyMode
    document.getElementById("difficulty-select").value = localSettings.difficultyMode
    if (localSettings.fpsCapDefault === 'max') {
        game.fpsCapDefault = 999999999;
    } else {
        game.fpsCapDefault = Number(localSettings.fpsCapDefault)
    }
    document.getElementById("fps-select").value = localSettings.fpsCapDefault
} else {
    localSettings = {
        isCommunityMaps: false,
        difficultyMode: '2',
        fpsCapDefault: 'max',
        runCount: 0,
        levelsClearedLastGame: 0,
        key: undefined
    };
    input.setDefault()
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    document.getElementById("community-maps").checked = localSettings.isCommunityMaps
    game.isCommunityMaps = localSettings.isCommunityMaps
    document.getElementById("difficulty-select").value = localSettings.difficultyMode
    document.getElementById("fps-select").value = localSettings.fpsCapDefault
}
input.controlTextUpdate()

//**********************************************************************
// settings 
//**********************************************************************
document.getElementById("fps-select").addEventListener("input", () => {
    let value = document.getElementById("fps-select").value
    if (value === 'max') {
        game.fpsCapDefault = 999999999;
    } else {
        game.fpsCapDefault = Number(value)
    }
    localSettings.fpsCapDefault = value
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

document.getElementById("community-maps").addEventListener("input", () => {
    game.isCommunityMaps = document.getElementById("community-maps").checked
    localSettings.isCommunityMaps = game.isCommunityMaps
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

// difficulty-select-custom event listener is set in build.makeGrid
document.getElementById("difficulty-select").addEventListener("input", () => {
    game.difficultyMode = Number(document.getElementById("difficulty-select").value)
    localSettings.difficultyMode = game.difficultyMode
    localSettings.levelsClearedLastGame = 0 //after changing difficulty, reset run history
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});



document.getElementById("updates").addEventListener("toggle", function() {


    function loadJSON(path, success, error) { //generic function to get JSON
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    if (success)
                        success(JSON.parse(xhr.responseText));
                } else {
                    if (error)
                        error(xhr);
                }
            }
        };
        xhr.open("GET", path, true);
        xhr.send();
    }
    let text = `<strong>n-gon</strong>: <a href="https://github.com/landgreen/n-gon/blob/master/todo.txt">todo list</a> and complete <a href="https://github.com/landgreen/n-gon/commits/master">change-log</a><hr>`
    document.getElementById("updates-div").innerHTML = text

    ///  https://api.github.com/repos/landgreen/n-gon/stats/commit_activity
    loadJSON('https://api.github.com/repos/landgreen/n-gon/commits',
        function(data) {
            // console.log(data)
            for (let i = 0, len = 3; i < len; i++) {
                text += "<strong>" + data[i].commit.author.date.substr(0, 10) + "</strong> - "; //+ "<br>"
                text += data[i].commit.message
                if (i < len - 1) text += "<hr>"
            }
            document.getElementById("updates-div").innerHTML = text.replace(/\n/g, "<br />")
        },
        function(xhr) {
            console.error(xhr);
        }
    );
})

//**********************************************************************
// main loop 
//**********************************************************************
game.loop = game.normalLoop;

function cycle() {
    if (!game.paused) requestAnimationFrame(cycle);
    const now = Date.now();
    const elapsed = now - game.then; // calc elapsed time since last loop
    if (elapsed > game.fpsInterval) { // if enough time has elapsed, draw the next frame
        game.then = now - (elapsed % game.fpsInterval); // Get ready for next frame by setting then=now.   Also, adjust for fpsInterval not being multiple of 16.67

        game.cycle++; //tracks game cycles
        mech.cycle++; //tracks player cycles  //used to alow time to stop for everything, but the player
        if (game.clearNow) {
            game.clearNow = false;
            game.clearMap();
            level.start();
        }

        game.loop();
        // if (isNaN(mech.health) || isNaN(mech.energy)) {
        //   console.log(`mech.health = ${mech.health}`)
        //   game.paused = true;
        //   game.replaceTextLog = true;
        //   build.pauseGrid()
        //   document.body.style.cursor = "auto";
        //   alert("health is NaN, please report this bug to the discord  \n https://discordapp.com/invite/2eC9pgJ")
        // }
        // for (let i = 0, len = loop.length; i < len; i++) {
        //   loop[i]()
        // }
    }
}