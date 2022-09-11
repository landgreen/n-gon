"use strict";

//convert text into numbers for seed
Math.hash = s => { for (var i = 0, h = 9; i < s.length;) h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9); return h ^ h >>> 9 }

// const date1 = new Date()
// console.log(date1.getUTCHours())
// document.getElementById("seed").placeholder = Math.initialSeed = String(date1.getUTCDate() * date1.getUTCFullYear()) // daily seed,  day + year

// document.getElementById("seed").placeholder = Math.initialSeed = Math.floor(Date.now() % 100000) //random every time:  just the time in milliseconds UTC

document.getElementById("seed").placeholder = Math.initialSeed = String(Math.floor(Date.now() % 100000))
Math.seed = Math.abs(Math.hash(Math.initialSeed)) //update randomizer seed in case the player changed it
Math.seededRandom = function(min = 0, max = 1) { // in order to work 'Math.seed' must NOT be undefined
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    return min + Math.seed / 233280 * (max - min);
}
//Math.seed is set to document.getElementById("seed").value in level.populate level at the start of runs
// console.log(Math.seed)


function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        // randomIndex = Math.floor(Math.random() * currentIndex);
        randomIndex = Math.floor(Math.seededRandom(0, currentIndex)) //Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

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

const color = { //light
    // background: "#ddd", // used instead:  document.body.style.backgroundColor
    block: "rgba(140,140,140,0.85)",
    blockS: "#222",
    map: "#444",
    bullet: "#000"
}

// const color = { //dark
//     background: "#333",
//     block: "#444",
//     blockS: "#aab",
//     map: "#556",
//     bullet: "#fff"
// }

// const color = { //dark
//     background: "#999",
//     block: "#888",
//     blockS: "#111",
//     map: "#444",
// }

// shrink power up selection menu
// if (screen.height < 800) {
//     document.getElementById("choose-grid").style.fontSize = "1em"; //1.3em is normal
//     if (screen.height < 600) document.getElementById("choose-grid").style.fontSize = "0.8em"; //1.3em is normal
// }


//**********************************************************************
// check for URL parameters to load an experimental game
//**********************************************************************

//example  https://landgreen.github.io/sidescroller/index.html?
//          &gun1=minigun&gun2=laser
//          &tech1=laser-bot&tech2=mass%20driver&tech3=overcharge&tech4=laser-bot&tech5=laser-bot&field=phase%20decoherence%20field&difficulty=2
//add ? to end of url then for each power up add
// &gun1=name&gun2=name
// &tech1=laser-bot&tech2=mass%20driver&tech3=overcharge&tech4=laser-bot&tech5=laser-bot
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
window.addEventListener('load', () => {
    const set = getUrlVars()
    if (Object.keys(set).length !== 0) {
        build.populateGrid() //trying to solve a bug with this, but maybe it doesn't help
        openExperimentMenu();
        //add experimental selections based on url
        for (const property in set) {
            set[property] = set[property].replace(/%20/g, " ")
            set[property] = set[property].replace(/%27/g, "'")
            set[property] = set[property].replace(/%CE%A8/g, "Ψ")
            if (property === "field") {
                let found = false
                let index
                for (let i = 0; i < m.fieldUpgrades.length; i++) {
                    if (set[property] === m.fieldUpgrades[i].name) {
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
            if (property.substring(0, 4) === "tech") {
                for (let i = 0; i < tech.tech.length; i++) {
                    if (set[property] === tech.tech[i].name) {
                        build.choosePowerUp(document.getElementById(`tech-${i}`), i, 'tech', true)
                        break;
                    }
                }
            }

            if (property === "difficulty") {
                simulation.difficultyMode = Number(set[property])
                lore.setTechGoal()
                document.getElementById("difficulty-select-experiment").value = Number(set[property])
            }
            if (property === "level") document.getElementById("starting-level").value = Math.max(Number(set[property]) - 1, 0)
            if (property === "noPower") document.getElementById("no-power-ups").checked = Number(set[property])
            if (property === "molMode") {
                simulation.molecularMode = Number(set[property])
                const i = 4 //update experiment text
                m.fieldUpgrades[i].description = m.fieldUpgrades[i].setDescription()
                document.getElementById(`field-${i}`).innerHTML = `<div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${build.nameLink(m.fieldUpgrades[i].name)}</div> ${m.fieldUpgrades[i].description}`
            }
            // if (property === "seed") {
            //     document.getElementById("seed").placeholder = Math.initialSeed = String(set[property])
            //     Math.seed = Math.abs(Math.hash(Math.initialSeed))
            //     level.populateLevels()
            // }
        }
    } else if (localSettings.isTrainingNotAttempted && localSettings.runCount < 30) { //make training button more obvious for new players
        // document.getElementById("training-button").style.border = "0px #333 solid";
        // document.getElementById("training-button").style.fill = "rgb(0, 150, 235)" //"#fff";
        // document.getElementById("training-button").style.background = "rgb(0, 200, 255)";

        //css classes not working for some reason
        // document.getElementById("training-button").classList.add('lore-text');

        let myanim = document.createElementNS("http://www.w3.org/2000/svg", 'animate');
        myanim.setAttribute("id", "myAnimation");
        myanim.setAttribute("attributeType", "XML");
        myanim.setAttribute("attributeName", "fill");
        // myanim.setAttribute("values", "#f55;#cc5;#5c5;#5dd;#66f;#5dd;#5c5;#cc5;#f55"); //rainbow
        myanim.setAttribute("values", "#5dd;#66f;#5dd");
        // myanim.setAttribute("values", "#333;rgb(0, 170, 255);#333");
        myanim.setAttribute("dur", "3s");
        myanim.setAttribute("repeatCount", "indefinite");
        document.getElementById("training-button").appendChild(myanim);
        document.getElementById("myAnimation").beginElement();
    }
});


//**********************************************************************
//set up canvas
//**********************************************************************
const canvas = document.getElementById("canvas");
//using "const" causes problems in safari when an ID shares the same name.
const ctx = canvas.getContext("2d");
// const ctx = canvas.getContext('2d', { alpha: false }); //optimization, this works if you wipe with the background color of each level

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
    ctx.font = "25px Arial";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    simulation.setZoom();
}
setupCanvas();
window.onresize = () => {
    setupCanvas();
};

//**********************************************************************
// experimental build grid display and pause
//**********************************************************************
//set wikipedia link
for (let i = 0, len = tech.tech.length; i < len; i++) {
    if (!tech.tech[i].link) tech.tech[i].link = `<a target="_blank" href='https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(tech.tech[i].name).replace(/'/g, '%27')}&title=Special:Search' class="link">${tech.tech[i].name}</a>`
}
const build = {
    pauseGrid() {
        //used for junk estimation
        let junkCount = 0
        let totalCount = 1 //start at one to avoid NaN issues
        for (let i = 0; i < tech.tech.length; i++) {
            if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isBanished) {
                totalCount += tech.tech[i].frequency
                if (tech.tech[i].isJunk) junkCount += tech.tech[i].frequency
            }
        }
        //left side
        let botText = ""
        if (tech.nailBotCount) botText += `<br>nail-bots: ${tech.nailBotCount}`
        if (tech.orbitBotCount) botText += `<br>orbital-bots: ${tech.orbitBotCount}`
        if (tech.boomBotCount) botText += `<br>boom-bots: ${tech.boomBotCount}`
        if (tech.laserBotCount) botText += `<br>laser-bots: ${tech.laserBotCount}`
        if (tech.foamBotCount) botText += `<br>foam-bots: ${tech.foamBotCount}`
        if (tech.dynamoBotCount) botText += `<br>dynamo-bots: ${tech.dynamoBotCount}`
        if (tech.plasmaBotCount) botText += `<br>plasma-bots: ${tech.plasmaBotCount}`
        if (tech.missileBotCount) botText += `<br>missile-bots: ${tech.missileBotCount}`

        let text = `<div class="pause-grid-module" style = "font-size: 13px;line-height: 120%;padding: 5px;">`
        if (!simulation.isChoosing) text += `<br><span style="font-size:1.5em;font-weight: 600;">PAUSED</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; press P to resume
<br><br><svg class="SVG-button" onclick="build.shareURL(false)" width="92" height="20" style="padding:0px; margin: 1px;">
    <g stroke='none' fill='#333' stroke-width="2" font-size="14px" font-family="Ariel, sans-serif"> <text x="5" y="15">copy build url</text></g>
</svg><br>`
        text += `
<br><strong class='color-d'>damage</strong>: ${((tech.damageFromTech())).toPrecision(3)} &nbsp; &nbsp; difficulty: ${((m.dmgScale)).toPrecision(3)}
<br><strong class='color-defense'>defense</strong>: ${(1-m.harmReduction()).toPrecision(3)} &nbsp; &nbsp; difficulty: ${(1/simulation.dmgScale).toPrecision(3)}
<br><strong><em>fire rate</em></strong>: ${((1-b.fireCDscale)*100).toFixed(b.fireCDscale < 0.1 ? 2 : 0)}%
${tech.duplicationChance() ?  `<br><strong class='color-dup'>duplication</strong>: ${(tech.duplicationChance()*100).toFixed(0)}%`: ""}
${m.coupling ? `<br><strong class='color-coupling'>coupling</strong>: ${(m.coupling).toFixed(2)} &nbsp; <span style = 'font-size:90%;'>`+m.couplingDescription()+"</span>": ""}
${botText}
<br>
<br><strong class='color-h'>health</strong>: (${(m.health*100).toFixed(0)} / ${(m.maxHealth*100).toFixed(0)})
<br><strong class='color-f'>energy</strong>: (${(m.energy*100).toFixed(0)} / ${(m.maxEnergy*100).toFixed(0)}) +(${(m.fieldRegen*6000).toFixed(0)}/s)
<br><strong class='color-g'>gun</strong>: ${b.activeGun === null || b.activeGun === undefined ? "undefined":b.guns[b.activeGun].name} &nbsp; <strong class='color-g'>ammo</strong>: ${b.activeGun === null || b.activeGun === undefined ? "0":b.guns[b.activeGun].ammo}
<br><strong class='color-m'>tech</strong>: ${tech.totalCount}  &nbsp; <strong class='color-r'>research</strong>: ${powerUps.research.count}  
${junkCount ?  `<br><strong class='color-j'>JUNK</strong>: ${(junkCount / totalCount * 100).toFixed(1)}%  `: ""}
 
<br>
<br>seed: ${Math.initialSeed}
<br>level: ${level.levels[level.onLevel]} (${level.difficultyText()}) &nbsp; ${m.cycle} cycles
<br>${mob.length} mobs, &nbsp; ${body.length} blocks, &nbsp; ${bullet.length} bullets, &nbsp; ${powerUp.length} power ups
<br>position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}) &nbsp; velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})
<br>mouse: (${simulation.mouseInGame.x.toFixed(1)}, ${simulation.mouseInGame.y.toFixed(1)}) &nbsp; mass: ${player.mass.toFixed(1)}   
${simulation.isCheating ? "<br><br><em>lore disabled</em>": ""}
</div>`;
        for (let i = 0, len = b.inventory.length; i < len; i++) {
            text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${build.nameLink(b.guns[b.inventory[i]].name)} - <span style="font-size:100%;font-weight: 100;">${b.guns[b.inventory[i]].ammo}</span></div> ${b.guns[b.inventory[i]].description}</div>`
        }
        let el = document.getElementById("pause-grid-left")
        el.style.display = tech.isNoDraftPause ? "none" : "grid" //disabled for eternalism because eternalism lets the player play while this menu is up but the menu doesn't update
        el.innerHTML = text
        //right side
        text = "";
        if (tech.isPauseSwitchField && !simulation.isChoosing) {
            text += `<div class="pause-grid-module" id ="pause-field" style="animation: fieldColorCycle 1s linear infinite alternate;"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${build.nameLink(m.fieldUpgrades[m.fieldMode].name)}</div> ${m.fieldUpgrades[m.fieldMode].description}</div>`
        } else {
            text += `<div class="pause-grid-module" id ="pause-field"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${build.nameLink(m.fieldUpgrades[m.fieldMode].name)}</div> ${m.fieldUpgrades[m.fieldMode].description}</div>`
        }

        const style = (tech.isPauseEjectTech && !simulation.isChoosing) ? 'style="animation: techColorCycle 1s linear infinite alternate;"' : ''
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (tech.tech[i].count > 0) {
                const techCountText = tech.tech[i].count > 1 ? `(${tech.tech[i].count}x)` : "";
                if (tech.tech[i].isNonRefundable) {
                    text += `<div class="pause-grid-module" id ="${i}-pause-tech" onclick="powerUps.pauseEjectTech(${i})" style = "border: 0px; opacity:0.5; font-size: 60%; line-height: 130%; margin: 1px; padding-top: 6px; padding-bottom: 6px;"><div class="grid-title">${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div></div>`
                } else if (tech.tech[i].isFieldTech) {
                    text += `<div class="pause-grid-module" id ="${i}-pause-tech" onclick="powerUps.pauseEjectTech(${i})" ${style}><div class="grid-title">
                                            <span style="position:relative;">
                                                <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                              <div class="circle-grid field" style="position:absolute; top:0; left:10px;opacity:0.65;"></div>
                                            </span>
                                            &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div></div>`
                } else if (tech.tech[i].isGunTech) {
                    text += `<div class="pause-grid-module" id ="${i}-pause-tech" onclick="powerUps.pauseEjectTech(${i})" ${style}><div class="grid-title">
                                            <span style="position:relative;">
                                                <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                                <div class="circle-grid gun" style="position:absolute; top:0; left:10px; opacity:0.65;"></div>
                                            </span>
                                            &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div></div>`
                } else if (tech.tech[i].isLore) {
                    text += `<div class="pause-grid-module"><div class="grid-title lore-text"><div class="circle-grid lore"></div> &nbsp; ${tech.tech[i].name} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div></div>`
                } else {
                    text += `<div class="pause-grid-module" id ="${i}-pause-tech" onclick="powerUps.pauseEjectTech(${i})" ${style}><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div></div>`
                }
            } else if (tech.tech[i].isLost) {
                text += `<div class="pause-grid-module" style="text-decoration: line-through;"><div class="grid-title">${tech.tech[i].link}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div></div>`
            }
        }
        el = document.getElementById("pause-grid-right")
        el.style.display = tech.isNoDraftPause ? "none" : "grid" //disabled for eternalism because eternalism lets the player play while this menu is up but the menu doesn't update
        el.innerHTML = text

        document.getElementById("tech").style.display = "none"
        document.getElementById("guns").style.display = "none"
        document.getElementById("field").style.display = "none"
        document.getElementById("health").style.display = "none"
        document.getElementById("health-bg").style.display = "none"
    },
    unPauseGrid() {
        document.getElementById("tech").style.display = "inline"
        document.getElementById("guns").style.display = "inline"
        document.getElementById("field").style.display = "inline"
        if (tech.isEnergyHealth) {
            document.getElementById("health").style.display = "none"
            document.getElementById("health-bg").style.display = "none"
        } else {
            document.getElementById("health").style.display = "inline"
            document.getElementById("health-bg").style.display = "inline"
        }
        // document.body.style.overflow = "hidden"
        document.getElementById("pause-grid-left").style.display = "none"
        document.getElementById("pause-grid-right").style.display = "none"
        document.getElementById("pause-grid-right").style.opacity = "1"
        document.getElementById("pause-grid-left").style.opacity = "1"
        window.scrollTo(0, 0);
    },
    isExperimentSelection: false,
    isExperimentRun: false,
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
                    simulation.makeGunHUD();
                    break
                }
            }
            if (!isDeselect) { //add gun
                who.classList.add("build-gun-selected");
                b.giveGuns(index)
            }
        } else if (type === "field") {
            if (m.fieldMode !== index) {
                document.getElementById("field-" + m.fieldMode).classList.remove("build-field-selected");
                m.setField(index)
                who.classList.add("build-field-selected");
            } else if (m.fieldMode === 4) {
                const i = 4 //update experiment text
                simulation.molecularMode++
                if (simulation.molecularMode > i - 1) simulation.molecularMode = 0
                m.fieldUpgrades[i].description = m.fieldUpgrades[i].setDescription()
                document.getElementById(`field-${i}`).innerHTML = `<div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${build.nameLink(m.fieldUpgrades[i].name)}</div> ${m.fieldUpgrades[i].description}`
            }

            // if (m.fieldMode === 4 && simulation.molecularMode < 3) {
            //     simulation.molecularMode++
            //     m.fieldUpgrades[4].description = m.fieldUpgrades[4].setDescription()
            // } else {
            //     m.setField((m.fieldMode === m.fieldUpgrades.length - 1) ? 1 : m.fieldMode + 1) //cycle to next field

            //     if (m.fieldMode === 4) {
            //         simulation.molecularMode = 0
            //         m.fieldUpgrades[4].description = m.fieldUpgrades[4].setDescription()
            //     }
            // }


        } else if (type === "tech") {
            if (tech.tech[index].count < tech.tech[index].maxCount) {
                // if (!tech.tech[index].isLore && !tech.tech[index].isNonRefundable && !who.classList.contains("build-tech-selected")) who.classList.add("build-tech-selected");
                if (!who.classList.contains("build-tech-selected")) who.classList.add("build-tech-selected");
                tech.giveTech(index)
            } else if (!tech.tech[index].isNonRefundable) {
                // tech.totalCount -= tech.tech[index].count
                tech.removeTech(index);
                who.classList.remove("build-tech-selected");
            } else {
                // for non refundable tech this makes it flash off for a second, but return to on to show that it can't be set off
                who.classList.remove("build-tech-selected")
                setTimeout(() => {
                    who.classList.add("build-tech-selected")
                }, 50);
            }
        }

        // } else if (type === "tech") { //remove tech if you have too many
        //     if (tech.tech[index].count < tech.tech[index].maxCount) {
        //         if (!who.classList.contains("build-tech-selected")) who.classList.add("build-tech-selected");
        //         tech.giveTech(index)
        //     } else if (!tech.tech[index].isNonRefundable) {
        //         tech.totalCount -= tech.tech[index].count
        //         tech.removeTech(index);
        //         who.classList.remove("build-tech-selected");
        //     } else {
        //         who.classList.remove("build-tech-selected")
        //         setTimeout(() => { //return energy
        //             who.classList.add("build-tech-selected")
        //         }, 50);
        //     }
        // }

        //update tech text //disable not allowed tech
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            const techID = document.getElementById("tech-" + i)
            if ((!tech.tech[i].isJunk || localSettings.isJunkExperiment)) { //!tech.tech[i].isNonRefundable && //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  does removing this cause problems????
                if (tech.tech[i].allowed() || isAllowed || tech.tech[i].count > 0) {
                    const techCountText = tech.tech[i].count > 1 ? `(${tech.tech[i].count}x)` : "";
                    // <div class="circle-grid-small research" style="position:absolute; top:13px; left:30px;opacity:0.85;"></div>
                    if (tech.tech[i].isFieldTech) {
                        techID.classList.remove('experiment-grid-hide');
                        techID.innerHTML = `
                        <div class="grid-title">
                            <span style="position:relative;">
                                <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                <div class="circle-grid field" style="position:absolute; top:0; left:10px;opacity:0.65;"></div>
                            </span>
                            &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}
                        </div>`
                        // <div class="circle-grid gun" style="position:absolute; top:-3px; left:-3px; opacity:1; height: 33px; width:33px;"></div>
                        // <div class="circle-grid tech" style="position:absolute; top:5px; left:5px;opacity:1;height: 20px; width:20px;border: #fff solid 2px;"></div>
                        // border: #fff solid 0px;
                    } else if (tech.tech[i].isGunTech) {
                        techID.classList.remove('experiment-grid-hide');
                        techID.innerHTML = `
                        <div class="grid-title">
                            <span style="position:relative;">
                                <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                <div class="circle-grid gun" style="position:absolute; top:0; left:10px; opacity:0.65;"></div>
                            </span>
                            &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}
                        </div>`
                    } else if (tech.tech[i].isJunk) {
                        techID.innerHTML = `<div class="grid-title"><div class="circle-grid junk"></div> &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() : tech.tech[i].description}</div>`
                    } else {
                        techID.innerHTML = `<div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].link} ${techCountText}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() : tech.tech[i].description}</div>`
                    }
                    //deselect selected tech options if you don't have the tech any more // for example: when bot techs are converted after a bot upgrade tech is taken
                    if (tech.tech[i].count === 0 && techID.classList.contains("build-tech-selected")) techID.classList.remove("build-tech-selected");

                    if (techID.classList.contains("experiment-grid-disabled")) {
                        techID.classList.remove("experiment-grid-disabled");
                        techID.setAttribute("onClick", `javascript: build.choosePowerUp(this,${i},'tech')`);
                    }
                    // } else if (tech.tech[i].isGunTech || tech.tech[i].isFieldTech) {
                    //     techID.classList.add('experiment-grid-hide');
                } else { //disabled color
                    // techID.innerHTML = `<div class="grid-title"> ${tech.tech[i].name}</div><span style="color:#666;">requires: ${tech.tech[i].requires}</span></div>`
                    // techID.innerHTML = `<div class="grid-title"> ${tech.tech[i].name}</div><span style="color:#666;">requires: ${tech.tech[i].requires}</span></div>`
                    techID.innerHTML = `<div class="grid-title">${tech.tech[i].name}</div>${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div>`
                    // console.log(techID)
                    if (!techID.classList.contains("experiment-grid-disabled")) {
                        techID.classList.add("experiment-grid-disabled");
                        techID.onclick = null
                    }
                    if (tech.tech[i].count > 0) tech.removeTech(i)
                    if (techID.classList.contains("build-tech-selected")) techID.classList.remove("build-tech-selected");
                }
            }
        }
    },
    populateGrid() {
        let text = `
  <div style="display: flex; justify-content: space-around; align-items: center;">
    <svg class="SVG-button" onclick="build.startExperiment()" width="115" height="51">
      <g stroke='none' fill='#333' stroke-width="2" font-size="40px" font-family="Ariel, sans-serif">
        <text x="18" y="38">start</text>
      </g>
    </svg>
    <svg class="SVG-button" onclick="build.reset()" width="50" height="25">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
        <text x="5" y="18">reset</text>
      </g>
    </svg>
    <svg class="SVG-button" onclick="build.shareURL(true)" width="52" height="25">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
        <text x="5" y="18">share</text>
      </g>
    </svg>
  </div>
  <div style="align-items: center; text-align:center; font-size: 1.00em; line-height: 190%;background-color:var(--build-bg-color);">
    <div>starting level: <input id='starting-level' type="number" step="1" value="1" min="0" max="99"></div>
    <div>
    <label for="difficulty-select" title="effects: number of mobs, damage done by mobs, damage done to mobs, mob speed, heal effects">difficulty:</label>
      <select name="difficulty-select" id="difficulty-select-experiment">
        <option value="1">easy</option>
        <option value="2" selected>normal</option>
        <option value="4">hard</option>
        <option value="6">why?</option>
      </select>
    </div>
    <div>
      <label for="no-power-ups" title="no tech, fields, or guns will spawn">no power ups:</label>
      <input type="checkbox" id="no-power-ups" name="no-power-ups" style="width:17px; height:17px;">
    </div>
  </div>`
        for (let i = 0, len = m.fieldUpgrades.length; i < len; i++) {
            text += `<div id ="field-${i}" class="experiment-grid-module" onclick="build.choosePowerUp(this,${i},'field')"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${build.nameLink(m.fieldUpgrades[i].name)}</div> ${m.fieldUpgrades[i].description}</div>`
        }
        for (let i = 0, len = b.guns.length; i < len; i++) {
            text += `<div id = "gun-${i}" class="experiment-grid-module" onclick="build.choosePowerUp(this,${i},'gun')"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${build.nameLink(b.guns[i].name)}</div> ${b.guns[i].description}</div>`
        }
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (!tech.tech[i].isJunk || localSettings.isJunkExperiment) {
                if (tech.tech[i].allowed() && (!tech.tech[i].isNonRefundable || localSettings.isJunkExperiment)) { // || tech.tech[i].name === "+1 cardinality") { //|| tech.tech[i].name === "leveraged investment"
                    if (tech.tech[i].isJunk) {
                        text += `<div id="tech-${i}" class="experiment-grid-module" onclick="build.choosePowerUp(this,${i},'tech')"><div class="grid-title"><div class="circle-grid junk"></div> &nbsp; ${tech.tech[i].link}</div> ${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div>`
                    } else {
                        text += `<div id="tech-${i}" class="experiment-grid-module" onclick="build.choosePowerUp(this,${i},'tech')"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].link}</div> ${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div>`
                    }
                } else {
                    text += `<div id="tech-${i}" class="experiment-grid-module experiment-grid-disabled"><div class="grid-title"> ${tech.tech[i].name}</div> ${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div>`
                    // text += `<div id="tech-${i}" class="experiment-grid-module experiment-grid-disabled"><div class="grid-title"> ${tech.tech[i].name}</div> ${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() :tech.tech[i].description}</div>`
                }
            }
        }
        document.getElementById("experiment-grid").innerHTML = text
        document.getElementById("difficulty-select-experiment").value = document.getElementById("difficulty-select").value
        document.getElementById("difficulty-select-experiment").addEventListener("input", () => {
            simulation.difficultyMode = Number(document.getElementById("difficulty-select-experiment").value)
            lore.setTechGoal()
            localSettings.difficultyMode = Number(document.getElementById("difficulty-select-experiment").value)
            document.getElementById("difficulty-select").value = document.getElementById("difficulty-select-experiment").value
            if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        });
        //add tooltips
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (document.getElementById(`tech-${i}`)) {
                document.getElementById(`tech-${i}`).setAttribute('data-descr', tech.tech[i].requires); //add tooltip
                // document.getElementById(`tech-${i}`).setAttribute('title', tech.tech[i].requires); //add tooltip
            }
        }
    },
    nameLink(text) { //converts text into a clickable wikipedia search
        return `<a target="_blank" href='https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(text).replace(/'/g, '%27')}&title=Special:Search' class="link">${text}</a>`
    },
    reset() {
        build.isExperimentSelection = true;
        build.isExperimentRun = true;
        simulation.startGame(true); //starts game, but pauses it
        build.isExperimentSelection = true;
        build.isExperimentRun = true;
        simulation.paused = true;
        b.inventory = []; //removes guns and ammo  
        for (let i = 0, len = b.guns.length; i < len; ++i) {
            b.guns[i].count = 0;
            b.guns[i].have = false;
            if (b.guns[i].ammo != Infinity) b.guns[i].ammo = 0;
        }
        b.activeGun = null;
        simulation.makeGunHUD();
        tech.setupAllTech();
        build.populateGrid();
        document.getElementById("field-0").classList.add("build-field-selected");
        document.getElementById("experiment-grid").style.display = "grid"
    },
    shareURL(isCustom = false) {
        let url = "https://landgreen.github.io/sidescroller/index.html?"
        url += `&seed=${Math.initialSeed}`
        let count = 0;
        for (let i = 0; i < b.inventory.length; i++) {
            if (b.guns[b.inventory[i]].have) {
                url += `&gun${count}=${encodeURIComponent(b.guns[b.inventory[i]].name.trim())}`
                count++
            }
        }
        count = 0;
        for (let i = 0; i < tech.tech.length; i++) {
            for (let j = 0; j < tech.tech[i].count; j++) {
                if (!tech.tech[i].isLore && !tech.tech[i].isJunk && !tech.tech[i].isNonRefundable) {
                    url += `&tech${count}=${encodeURIComponent(tech.tech[i].name.trim())}`
                    count++
                }
            }
        }
        url += `&molMode=${encodeURIComponent(simulation.molecularMode)}`
        // if (property === "molMode") {
        //     simulation.molecularMode = Number(set[property])
        //     m.fieldUpgrades[i].description = m.fieldUpgrades[i].setDescription()
        //     document.getElementById(`field-${i}`).innerHTML = `<div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${build.nameLink(m.fieldUpgrades[i].name)}</div> ${m.fieldUpgrades[i].description}`
        // }

        url += `&field=${encodeURIComponent(m.fieldUpgrades[m.fieldMode].name.trim())}`
        url += `&difficulty=${simulation.difficultyMode}`
        if (isCustom) {
            url += `&level=${Math.abs(Number(document.getElementById("starting-level").value))}`
            url += `&noPower=${Number(document.getElementById("no-power-ups").checked)}`
            // alert('n-gon build URL copied to clipboard.\nPaste into browser address bar.')
        } else {
            simulation.makeTextLog("n-gon build URL copied to clipboard.<br>Paste into browser address bar.")
        }
        console.log('n-gon build URL copied to clipboard.\nPaste into browser address bar.')
        console.log(url)
        navigator.clipboard.writeText(url).then(function() {
            /* clipboard successfully set */
            if (isCustom) {
                setTimeout(function() { alert('n-gon build URL copied to clipboard.\nPaste into browser address bar.') }, 300);
            }
        }, function() {
            /* clipboard write failed */
            if (isCustom) {
                setTimeout(function() { alert('copy failed') }, 300);
            }
            console.log('copy failed')
        });

    },
    hasExperimentalMode: false,
    startExperiment() { //start playing the game after exiting the experiment menu
        build.isExperimentSelection = false;
        spawn.setSpawnList(); //gives random mobs,  not starter mobs
        spawn.setSpawnList();
        if (b.inventory.length > 0) {
            b.activeGun = b.inventory[0] //set first gun to active gun
            simulation.makeGunHUD();
        }
        for (let i = 0; i < bullet.length; ++i) Matter.Composite.remove(engine.world, bullet[i]);
        bullet = []; //remove any bullets that might have spawned from tech
        const levelsCleared = Math.abs(Number(document.getElementById("starting-level").value) - 1)
        level.difficultyIncrease(Math.min(99, levelsCleared * simulation.difficultyMode)) //increase difficulty based on modes
        level.levelsCleared += levelsCleared;
        simulation.isNoPowerUps = document.getElementById("no-power-ups").checked
        if (simulation.isNoPowerUps) { //remove tech, guns, and fields
            function removeOne() { //recursive remove one at a time to avoid array problems
                for (let i = 0; i < powerUp.length; i++) {
                    if (powerUp[i].name === "tech" || powerUp[i].name === "gun" || powerUp[i].name === "field") {
                        Matter.Composite.remove(engine.world, powerUp[i]);
                        powerUp.splice(i, 1);
                        removeOne();
                        break
                    }
                }
            }
            removeOne();
        }
        build.hasExperimentalMode = false
        if (!simulation.isCheating) {
            for (let i = 0, len = tech.tech.length; i < len; i++) {
                if (tech.tech[i].count > 0 && !tech.tech[i].isLore) simulation.isCheating = true;
            }
            if (b.inventory.length !== 0 || m.fieldMode !== 0) simulation.isCheating = true;
        }
        if (simulation.isCheating) { //if you are cheating remove any lore you might have gotten
            lore.techCount = 0;
            for (let i = 0, len = tech.tech.length; i < len; i++) {
                if (tech.tech[i].isLore) {
                    tech.tech[i].frequency = 0; //remove lore power up chance
                    tech.tech[i].count = 0; //remove lore power up chance
                }
            }
            simulation.updateTechHUD();
        } else { //if you have no tech (not cheating) remove all power ups that might have spawned from tech
            for (let i = 0; i < powerUp.length; ++i) Matter.Composite.remove(engine.world, powerUp[i]);
            powerUp = [];
            // if (build.hasExperimentalMode) {
            //     for (let i = 0; i < 7; i++) tech.giveTech("undefined")
            // }
        }
        document.body.style.cursor = "none";
        document.body.style.overflow = "hidden"
        document.getElementById("experiment-grid").style.display = "none"
        simulation.paused = false;
        requestAnimationFrame(cycle);
    }
}

function openExperimentMenu() {
    document.getElementById("experiment-button").style.display = "none";
    document.getElementById("training-button").style.display = "none";
    const el = document.getElementById("experiment-grid")
    el.style.display = "grid"
    document.body.style.overflowY = "scroll";
    document.body.style.overflowX = "hidden";
    document.getElementById("info").style.display = 'none'
    build.reset();
}

//record settings so they can be reproduced in the experimental menu
document.getElementById("experiment-button").addEventListener("click", () => { //setup build run
    // let field = 0;
    // let inventory = [];
    // let techList = [];
    // if (!simulation.firstRun) {
    //     field = m.fieldMode
    //     inventory = [...b.inventory]
    //     for (let i = 0; i < tech.tech.length; i++) {
    //         techList.push(tech.tech[i].count)
    //     }
    // }
    openExperimentMenu();
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
        fire: "KeyF",
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
            fire: "KeyF",
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
        if (!input.key.fire) input.key.fire = "KeyF"
        document.getElementById("key-fire").innerHTML = cleanText(input.key.fire)
        document.getElementById("key-field").innerHTML = cleanText(input.key.field)
        document.getElementById("key-up").innerHTML = cleanText(input.key.up)
        document.getElementById("key-down").innerHTML = cleanText(input.key.down)
        document.getElementById("key-left").innerHTML = cleanText(input.key.left)
        document.getElementById("key-right").innerHTML = cleanText(input.key.right)
        document.getElementById("key-pause").innerHTML = cleanText(input.key.pause)
        document.getElementById("key-next-gun").innerHTML = cleanText(input.key.nextGun)
        document.getElementById("key-previous-gun").innerHTML = cleanText(input.key.previousGun)
        document.getElementById("key-testing").innerHTML = cleanText(input.key.testing) //if (localSettings.loreCount > 0) 

        document.getElementById("splash-up").innerHTML = cleanText(input.key.up)[0]
        document.getElementById("splash-down").innerHTML = cleanText(input.key.down)[0]
        document.getElementById("splash-left").innerHTML = cleanText(input.key.left)[0]
        document.getElementById("splash-right").innerHTML = cleanText(input.key.right)[0]
        document.getElementById("splash-next-gun").innerHTML = cleanText(input.key.nextGun)[0]
        document.getElementById("splash-previous-gun").innerHTML = cleanText(input.key.previousGun)[0]

        localSettings.key = input.key
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    },
    focus: null,
    setTextFocus() {
        const backgroundColor = "#fff"
        document.getElementById("key-fire").style.background = backgroundColor
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
                event.code === input.key.fire ||
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
                case "key-fire":
                    input.key.fire = event.code
                    break;
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
        case input.key.fire:
            input.fire = false
            break
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
        case input.key.fire:
            // event.preventDefault();
            input.fire = true
            break
        case input.key.field:
            // event.preventDefault();
            input.field = true
            break
        case input.key.nextGun:
            simulation.nextGun();
            break
        case input.key.previousGun:
            simulation.previousGun();
            break
        case input.key.pause:
            if (!simulation.isChoosing && input.isPauseKeyReady && m.alive) {
                input.isPauseKeyReady = false
                setTimeout(function() {
                    input.isPauseKeyReady = true
                }, 300);
                if (simulation.paused) {
                    build.unPauseGrid()
                    simulation.paused = false;
                    // level.levelAnnounce();
                    document.body.style.cursor = "none";
                    requestAnimationFrame(cycle);
                } else if (!tech.isNoDraftPause) {
                    simulation.paused = true;
                    build.pauseGrid()
                    document.body.style.cursor = "auto";

                    if (tech.isPauseSwitchField || simulation.testing) {
                        document.getElementById("pause-field").addEventListener("click", () => {
                            const energy = m.energy //save current energy
                            if (m.fieldMode === 4 && simulation.molecularMode < 3) {
                                simulation.molecularMode++
                                m.fieldUpgrades[4].description = m.fieldUpgrades[4].setDescription()
                            } else {
                                m.setField((m.fieldMode === m.fieldUpgrades.length - 1) ? 0 : m.fieldMode + 1) //cycle to next field
                                if (m.fieldMode === 4) {
                                    simulation.molecularMode = 0
                                    m.fieldUpgrades[4].description = m.fieldUpgrades[4].setDescription()
                                }
                            }
                            m.energy = energy //return to current energy
                            document.getElementById("pause-field").innerHTML = `<div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[m.fieldMode].name}</div> ${m.fieldUpgrades[m.fieldMode].description}`
                        });
                    }
                }
            }
            break
        case input.key.testing:
            if (m.alive && localSettings.loreCount > 0) {
                if (simulation.difficultyMode > 4) {
                    simulation.makeTextLog("<em>testing mode disabled for this difficulty</em>");
                    break
                }
                if (simulation.testing) {
                    simulation.testing = false;
                    simulation.loop = simulation.normalLoop
                    if (simulation.isConstructionMode) document.getElementById("construct").style.display = 'none'
                    simulation.makeTextLog("", 0);
                } else { //if (keys[191])
                    simulation.testing = true;
                    simulation.loop = simulation.testingLoop
                    if (simulation.isConstructionMode) document.getElementById("construct").style.display = 'inline'
                    if (simulation.testing) tech.setCheating();
                    simulation.makeTextLog(
                        `<table class="pause-table">
                            <tr>
                                <td class='key-input-pause'>T</td>
                                <td class='key-used'><strong>toggle testing</strong></td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>R</td>
                                <td class='key-used'>teleport to mouse</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>F</td>
                                <td class='key-used'>cycle field</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>G</td>
                                <td class='key-used'>all guns</td>
                            </tr>                            
                            <tr>
                                <td class='key-input-pause'>H</td>
                                <td class='key-used'>+100% defense</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>B</td>
                                <td class='key-used'>damage, research</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>N</td>
                                <td class='key-used'>fill health, energy</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>Y</td>
                                <td class='key-used'>random tech</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>U</td>
                                <td class='key-used'>next level</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>J</td>
                                <td class='key-used'>clear mobs</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>I/O</td>
                                <td class='key-used'>zoom in / out</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>1-8</td>
                                <td class='key-used'>spawn things</td>
                            </tr>
                            <tr>
                                <td class='key-input-pause'>⇧X</td>
                                <td class='key-used'>restart</td>
                            </tr>    
                        </table>`, Infinity);
                }
            }
            break
    }
    if (simulation.testing) {
        if (event.key === "X") m.death(); //only uppercase
        switch (event.key.toLowerCase()) {
            case "o":
                simulation.isAutoZoom = false;
                simulation.zoomScale /= 0.9;
                simulation.setZoom();
                break;
            case "i":
                simulation.isAutoZoom = false;
                simulation.zoomScale *= 0.9;
                simulation.setZoom();
                break
            case "`":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "research");
                break
            case "1":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "heal");
                break
            case "2":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "ammo");
                break
            case "3":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "gun");
                break
            case "4":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "field");
                break
            case "5":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "tech");
                break
            case "6":
                const index = body.length
                spawn.bodyRect(simulation.mouseInGame.x, simulation.mouseInGame.y, 50, 50);
                body[index].collisionFilter.category = cat.body;
                body[index].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                body[index].classType = "body";
                Composite.add(engine.world, body[index]); //add to world
                break
            case "7":
                const pick = spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)];
                spawn[pick](simulation.mouseInGame.x, simulation.mouseInGame.y);
                break
            case "8":
                spawn.randomLevelBoss(simulation.mouseInGame.x, simulation.mouseInGame.y);
                break
            case "f":
                const mode = (m.fieldMode === m.fieldUpgrades.length - 1) ? 0 : m.fieldMode + 1
                m.setField(mode)
                break
            case "g":
                b.giveGuns("all", 1000)
                break
            case "h":
                // m.health = Infinity
                if (m.immuneCycle === Infinity) {
                    m.immuneCycle = 0 //you can't take damage
                } else {
                    m.immuneCycle = Infinity //you can't take damage
                }

                // m.energy = Infinity
                // document.getElementById("health").style.display = "none"
                // document.getElementById("health-bg").style.display = "none"
                break
            case "n":
                m.addHealth(Infinity)
                m.energy = m.maxEnergy
                break
            case "y":
                tech.giveTech()
                break
            case "b":
                tech.isRerollDamage = true
                powerUps.research.changeRerolls(100000)
                break
            case "r":
                m.resetHistory();
                Matter.Body.setPosition(player, simulation.mouseInGame);
                Matter.Body.setVelocity(player, {
                    x: 0,
                    y: 0
                });
                // move bots to player
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
                level.nextLevel();
                break
            case "j":
                for (let i = 0, len = mob.length; i < len; ++i) mob[i].damage(Infinity, true)
                setTimeout(() => { for (let i = 0, len = mob.length; i < len; ++i) mob[i].damage(Infinity, true) }, 100);
                setTimeout(() => { for (let i = 0, len = mob.length; i < len; ++i) mob[i].damage(Infinity, true) }, 200);
                break
            case "l":
                document.getElementById("field").style.display = "none"
                document.getElementById("guns").style.display = "none"
                document.getElementById("tech").style.display = "none"
                break
        }
    }
});
//mouse move input
document.body.addEventListener("mousemove", (e) => {
    simulation.mouse.x = e.clientX;
    simulation.mouse.y = e.clientY;
});

document.body.addEventListener("mouseup", (e) => {
    // input.fire = false;
    // console.log(e)
    if (e.button === 0) {
        input.fire = false;
    } else if (e.button === 2) {
        input.field = false;
    }
});

document.body.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
        input.fire = true;
    } else if (e.button === 2) {
        input.field = true;
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
    if (!simulation.paused) {
        if (e.deltaY > 0) {
            simulation.nextGun();
        } else {
            simulation.previousGun();
        }
    }
}, {
    passive: true
});

//**********************************************************************
//  local storage
//**********************************************************************
let localSettings

function localstorageCheck() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }

}
if (localstorageCheck()) {
    localSettings = JSON.parse(localStorage.getItem("localSettings"))
    if (localSettings) {
        console.log('localStorage is enabled')
        localSettings.isAllowed = true
        localSettings.isEmpty = false
    } else {
        console.log('localStorage is enabled, local settings empty')
        localSettings = {
            isAllowed: true,
            isEmpty: true
        }
    }
} else {
    console.log("localStorage is disabled")
    localSettings = { isAllowed: false }
}

if (localSettings.isAllowed && !localSettings.isEmpty) {
    console.log('restoring previous settings')

    if (localSettings.key) {
        input.key = localSettings.key
    } else {
        input.setDefault()
    }

    if (localSettings.loreCount === undefined) {
        localSettings.loreCount = 0
        localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    }

    simulation.isCommunityMaps = localSettings.isCommunityMaps
    document.getElementById("community-maps").checked = localSettings.isCommunityMaps

    if (localSettings.difficultyMode === undefined) localSettings.difficultyMode = "2"
    simulation.difficultyMode = localSettings.difficultyMode
    lore.setTechGoal()
    document.getElementById("difficulty-select").value = localSettings.difficultyMode

    if (localSettings.fpsCapDefault === undefined) localSettings.fpsCapDefault = 'max'
    if (localSettings.personalSeeds === undefined) localSettings.personalSeeds = [];
    if (localSettings.fpsCapDefault === 'max') {
        simulation.fpsCapDefault = 999999999;
    } else {
        simulation.fpsCapDefault = Number(localSettings.fpsCapDefault)
    }
    document.getElementById("fps-select").value = localSettings.fpsCapDefault

    if (!localSettings.banList) localSettings.banList = ""
    if (localSettings.banList.length === 0 || localSettings.banList === "undefined") {
        localSettings.banList = ""
        localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    }
    document.getElementById("banned").value = localSettings.banList

} else {
    console.log('setting default localSettings')
    const isAllowed = localSettings.isAllowed //don't overwrite isAllowed value
    localSettings = {
        banList: "",
        isAllowed: isAllowed,
        personalSeeds: [],
        isJunkExperiment: false,
        isCommunityMaps: false,
        difficultyMode: '2',
        fpsCapDefault: 'max',
        runCount: 0,
        isTrainingNotAttempted: true,
        levelsClearedLastGame: 0,
        loreCount: 0,
        isHuman: false,
        key: undefined
    };
    input.setDefault()
    if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    document.getElementById("community-maps").checked = localSettings.isCommunityMaps
    simulation.isCommunityMaps = localSettings.isCommunityMaps
    document.getElementById("difficulty-select").value = localSettings.difficultyMode
    document.getElementById("fps-select").value = localSettings.fpsCapDefault
    document.getElementById("banned").value = localSettings.banList
}
document.getElementById("control-testing").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
// document.getElementById("experiment-button").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"

input.controlTextUpdate()

//**********************************************************************
// settings 
//**********************************************************************
document.getElementById("fps-select").addEventListener("input", () => {
    let value = document.getElementById("fps-select").value
    if (value === 'max') {
        simulation.fpsCapDefault = 999999999;
    } else {
        simulation.fpsCapDefault = Number(value)
    }
    localSettings.fpsCapDefault = value
    if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

document.getElementById("banned").addEventListener("input", () => {
    localSettings.banList = document.getElementById("banned").value
    if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

document.getElementById("community-maps").addEventListener("input", () => {
    simulation.isCommunityMaps = document.getElementById("community-maps").checked
    localSettings.isCommunityMaps = simulation.isCommunityMaps
    if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

// difficulty-select-experiment event listener is set in build.makeGrid
document.getElementById("difficulty-select").addEventListener("input", () => {
    simulation.difficultyMode = Number(document.getElementById("difficulty-select").value)
    lore.setTechGoal()
    localSettings.difficultyMode = simulation.difficultyMode
    localSettings.levelsClearedLastGame = 0 //after changing difficulty, reset run history
    if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
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
            for (let i = 0, len = 20; i < len; i++) {
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
const sound = {
    tone(frequency, end = 1000, gain = 0.05) {
        const audioCtx = new(window.AudioContext || window.webkitAudioContext)(); //setup audio context
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = gain; //controls volume
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine"; // 'sine' 'square', 'sawtooth', 'triangle' and 'custom'
        oscillator.frequency.value = frequency; // value in hertz
        oscillator.start();
        setTimeout(() => {
            audioCtx.suspend()
            audioCtx.close()
        }, end)
        // return audioCtx
    },
    portamento(frequency, end = 1000, shiftRate = 10, gain = 0.05) {
        const audioCtx = new(window.AudioContext || window.webkitAudioContext)(); //setup audio context
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = gain; //controls volume
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine"; // 'sine' 'square', 'sawtooth', 'triangle' and 'custom'
        oscillator.frequency.value = frequency; // value in hertz
        oscillator.start();
        for (let i = 0, len = end * 0.1; i < len; i++) oscillator.frequency.setValueAtTime(frequency + i * shiftRate, audioCtx.currentTime + i * 0.01);
        setTimeout(() => {
            audioCtx.suspend()
            audioCtx.close()
        }, end)
        // return audioCtx
    }
}
//**********************************************************************
// main loop 
//**********************************************************************
simulation.loop = simulation.normalLoop;

function cycle() {
    if (!simulation.paused) requestAnimationFrame(cycle);
    const now = Date.now();
    const elapsed = now - simulation.then; // calc elapsed time since last loop
    if (elapsed > simulation.fpsInterval) { // if enough time has elapsed, draw the next frame
        simulation.then = now - (elapsed % simulation.fpsInterval); // Get ready for next frame by setting then=now.   Also, adjust for fpsInterval not being multiple of 16.67

        simulation.cycle++; //tracks game cycles
        m.cycle++; //tracks player cycles  //used to alow time to stop for everything, but the player
        if (simulation.clearNow) {
            simulation.clearNow = false;
            simulation.clearMap();
            level.start();
        }
        simulation.loop();
    }
}