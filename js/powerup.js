let powerUp = [];

const powerUps = {
    totalPowerUps: 0, //used for tech that count power ups at the end of a level
    lastTechIndex: null,
    do() {},
    setDo() {
        if (tech.duplicationChance() > 0) {
            if (tech.isPowerUpsVanish) {
                powerUps.do = powerUps.doDuplicatesVanish
            } else if (tech.isPowerUpsAttract) {
                powerUps.do = powerUps.doAttractDuplicates
            } else {
                powerUps.do = powerUps.doDuplicates
            }
            tech.maxDuplicationEvent() //check to see if hitting 100% duplication
        } else if (tech.isPowerUpsAttract) {
            powerUps.do = powerUps.doAttract
        } else {
            powerUps.do = powerUps.doDefault
        }
    },
    doDefault() {
        //draw power ups
        ctx.globalAlpha = 0.4 * Math.sin(m.cycle * 0.15) + 0.6;
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            ctx.beginPath();
            ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
            ctx.fillStyle = powerUp[i].color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },
    doAttract() {
        powerUps.doDefault();
        //pull in 
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            const force = Vector.mult(Vector.normalise(Vector.sub(m.pos, powerUp[i].position)), 0.0015 * powerUp[i].mass)
            powerUp[i].force.x += force.x
            powerUp[i].force.y = force.y - simulation.g
        }
    },
    doAttractDuplicates() {
        powerUps.doDuplicates();
        //pull in 
    },
    doDuplicates() { //draw power ups but give duplicates some electricity
        ctx.globalAlpha = 0.4 * Math.sin(m.cycle * 0.15) + 0.6;
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            ctx.beginPath();
            ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
            ctx.fillStyle = powerUp[i].color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            if (powerUp[i].isDuplicated && Math.random() < 0.1) {
                //draw electricity
                const mag = 5 + powerUp[i].size / 5
                let unit = Vector.rotate({
                    x: mag,
                    y: mag
                }, 2 * Math.PI * Math.random())
                let path = {
                    x: powerUp[i].position.x + unit.x,
                    y: powerUp[i].position.y + unit.y
                }
                ctx.beginPath();
                ctx.moveTo(path.x, path.y);
                for (let i = 0; i < 6; i++) {
                    unit = Vector.rotate(unit, 3 * (Math.random() - 0.5))
                    path = Vector.add(path, unit)
                    ctx.lineTo(path.x, path.y);
                }
                ctx.lineWidth = 0.5 + 2 * Math.random();
                ctx.strokeStyle = "#000"
                ctx.stroke();
            }
        }
    },
    doDuplicatesVanish() { //draw power ups but give duplicates some electricity
        //remove power ups after 3 seconds
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            if (powerUp[i].isDuplicated && Math.random() < 0.004) { //  (1-0.004)^150 = chance to be removed after 3 seconds
                b.explosion(powerUp[i].position, (10 + 3 * Math.random()) * powerUp[i].size);
                Matter.World.remove(engine.world, powerUp[i]);
                powerUp.splice(i, 1);
                break
            }
        }

        ctx.globalAlpha = 0.4 * Math.sin(m.cycle * 0.25) + 0.6
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            ctx.beginPath();
            ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
            ctx.fillStyle = powerUp[i].color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            if (powerUp[i].isDuplicated && Math.random() < 0.3) {
                //draw electricity
                const mag = 5 + powerUp[i].size / 5
                let unit = Vector.rotate({
                    x: mag,
                    y: mag
                }, 2 * Math.PI * Math.random())
                let path = {
                    x: powerUp[i].position.x + unit.x,
                    y: powerUp[i].position.y + unit.y
                }
                ctx.beginPath();
                ctx.moveTo(path.x, path.y);
                for (let i = 0; i < 6; i++) {
                    unit = Vector.rotate(unit, 3 * (Math.random() - 0.5))
                    path = Vector.add(path, unit)
                    ctx.lineTo(path.x, path.y);
                }
                ctx.lineWidth = 0.5 + 2 * Math.random();
                ctx.strokeStyle = "#000"
                ctx.stroke();
            }
        }
    },
    choose(type, index) {
        if (type === "gun") {
            b.giveGuns(index)
            let text = `b.giveGuns("<span class='color-text'>${b.guns[index].name}</span>")`
            if (b.inventory.length === 1) text += `<br>input.key.gun<span class='color-symbol'>:</span> ["<span class='color-text'>MouseLeft</span>"]`
            if (b.inventory.length === 2) text += `
            <br>input.key.nextGun<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.nextGun}</span>","<span class='color-text'>MouseWheel</span>"]
            <br>input.key.previousGun<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.previousGun}</span>","<span class='color-text'>MouseWheel</span>"]`
            simulation.makeTextLog(text);
        } else if (type === "field") {
            m.setField(index)
            simulation.makeTextLog(`<span class='color-var'>m</span>.setField("<span class='color-text'>${m.fieldUpgrades[m.fieldMode].name}</span>")`);
        } else if (type === "tech") {
            setTimeout(() => {
                powerUps.lastTechIndex = index
            }, 10);
            simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${tech.tech[index].name}</span>")`);
            tech.giveTech(index)
        }
        powerUps.endDraft(type);
    },
    showDraft() {
        // document.getElementById("choose-grid").style.gridTemplateColumns = "repeat(2, minmax(370px, 1fr))"
        // document.getElementById("choose-background").style.display = "inline"
        document.getElementById("choose-background").style.visibility = "visible"
        document.getElementById("choose-background").style.opacity = "0.6"
        // document.getElementById("choose-grid").style.display = "grid"
        document.getElementById("choose-grid").style.transitionDuration = "0.25s";
        document.getElementById("choose-grid").style.visibility = "visible"
        document.getElementById("choose-grid").style.opacity = "1"
        //disable clicking for 1/2 a second to prevent mistake clicks
        document.getElementById("choose-grid").style.pointerEvents = "none";
        setTimeout(() => {
            document.getElementById("choose-grid").style.pointerEvents = "auto";
            document.body.style.cursor = "auto";
            document.getElementById("choose-grid").style.transitionDuration = "0s";
        }, 500);

        if (tech.isExtraChoice) {
            document.body.style.overflowY = "scroll";
            document.body.style.overflowX = "hidden";
        }
        simulation.paused = true;
        simulation.isChoosing = true; //stops p from un pausing on key down
        build.pauseGrid(true)
    },
    endDraft(type, isCanceled = false) {
        if (isCanceled) {
            if (tech.isCancelDuplication) {
                tech.cancelCount++
                tech.maxDuplicationEvent()
            }
            if (tech.isCancelRerolls) {
                for (let i = 0; i < 10; i++) {
                    let spawnType = (m.health < 0.25 || tech.isEnergyNoAmmo) ? "heal" : "ammo"
                    if (Math.random() < 0.33) {
                        spawnType = "heal"
                    } else if (Math.random() < 0.5 && !tech.isSuperDeterminism) {
                        spawnType = "research"
                    }
                    powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), spawnType, false);
                }
            }
            if (tech.isBanish && type === 'tech') { // banish researched tech by adding them to the list of banished tech
                const banishLength = tech.isDeterminism ? 1 : 3 + tech.isExtraChoice * 2
                if (powerUps.tech.choiceLog.length > banishLength || powerUps.tech.choiceLog.length === banishLength) { //I'm not sure this check is needed
                    for (let i = 0; i < banishLength; i++) {
                        powerUps.tech.banishLog.push(powerUps.tech.choiceLog[powerUps.tech.choiceLog.length - 1 - i])
                    }
                }
                simulation.makeTextLog(`powerUps.tech.length: ${Math.max(0,powerUps.tech.lastTotalChoices - powerUps.tech.banishLog.length)}`)
            }
        }
        if (tech.isAnsatz && powerUps.research.count === 0) {
            for (let i = 0; i < 2; i++) powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), "research", false);
        }
        // document.getElementById("choose-grid").style.display = "none"
        document.getElementById("choose-grid").style.visibility = "hidden"
        document.getElementById("choose-grid").style.opacity = "0"
        // document.getElementById("choose-background").style.display = "none"
        document.getElementById("choose-background").style.visibility = "hidden"
        document.getElementById("choose-background").style.opacity = "0"

        document.body.style.cursor = "none";
        document.body.style.overflow = "hidden"
        simulation.paused = false;
        simulation.isChoosing = false; //stops p from un pausing on key down
        if (m.immuneCycle < m.cycle + tech.collisionImmuneCycles) m.immuneCycle = m.cycle + tech.collisionImmuneCycles; //player is immune to damage for 30 cycles
        build.unPauseGrid()
        requestAnimationFrame(cycle);
        if (m.holdingTarget) m.drop();
    },
    research: {
        count: 0,
        name: "research",
        color: "#f7b",
        size() {
            return 20;
        },
        effect() {
            powerUps.research.changeRerolls(1)
        },
        changeRerolls(amount) {
            if (amount !== 0) {
                powerUps.research.count += amount
                if (powerUps.research.count < 0) {
                    powerUps.research.count = 0
                } else {
                    simulation.makeTextLog(`powerUps.research.count <span class='color-symbol'>+=</span> ${amount}`) // <br>${powerUps.research.count}
                }
            }
            if (tech.isRerollBots) {
                for (const cost = 3; powerUps.research.count > cost - 1; powerUps.research.count -= cost) {
                    b.randomBot()
                    if (tech.renormalization) {
                        for (let i = 0; i < cost; i++) {
                            if (Math.random() < 0.4) {
                                m.fieldCDcycle = m.cycle + 30;
                                powerUps.spawn(m.pos.x, m.pos.y, "research");
                            }
                        }
                    }
                }
            }
            if (tech.isDeathAvoid && document.getElementById("tech-anthropic")) {
                document.getElementById("tech-anthropic").innerHTML = `-${powerUps.research.count}`
            }
            if (tech.renormalization && Math.random() < 0.4 && amount < 0) {
                for (let i = 0, len = -amount; i < len; i++) powerUps.spawn(m.pos.x, m.pos.y, "research");
            }
            if (tech.isRerollHaste) {
                if (powerUps.research.count === 0) {
                    tech.researchHaste = 0.66;
                    b.setFireCD();
                } else {
                    tech.researchHaste = 1;
                    b.setFireCD();
                }
            }
        },
        use(type) { //runs when you actually research a list of selections, type can be field, gun, or tech
            if (tech.isJunkResearch) {
                tech.addJunkTechToPool(tech.junkResearchNumber)
            } else {
                powerUps.research.changeRerolls(-1)
            }
            // simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span><span class='color-symbol'>--</span>
            // <br>${powerUps.research.count}`)
            if (tech.isBanish && type === 'tech') { // banish researched tech
                const banishLength = tech.isDeterminism ? 1 : 3 + tech.isExtraChoice * 2
                if (powerUps.tech.choiceLog.length > banishLength || powerUps.tech.choiceLog.length === banishLength) { //I'm not sure this check is needed
                    for (let i = 0; i < banishLength; i++) {
                        powerUps.tech.banishLog.push(powerUps.tech.choiceLog[powerUps.tech.choiceLog.length - 1 - i])
                    }
                }
                // simulation.makeTextLog(`${Math.max(0,powerUps.tech.lastTotalChoices - powerUps.tech.banishLog.length)} estimated <strong class='color-m'>tech</strong> choices remaining`)
                simulation.makeTextLog(`powerUps.tech.length: ${Math.max(0,powerUps.tech.lastTotalChoices - powerUps.tech.banishLog.length)}`)
            }
            if (tech.isResearchReality) {
                m.switchWorlds()
                simulation.trails()
                simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
            }
            powerUps[type].effect();
        },
    },
    heal: {
        name: "heal",
        color: "#0eb",
        size() {
            return 40 * (simulation.healScale ** 0.25) * Math.sqrt(tech.largerHeals) * Math.sqrt(0.1 + Math.random() * 0.5); //(simulation.healScale ** 0.25)  gives a smaller radius as heal scale goes down
        },
        calculateHeal(size) {
            return tech.largerHeals * (size / 40 / Math.sqrt(tech.largerHeals) / (simulation.healScale ** 0.25)) ** 2 //heal scale is undone here because heal scale is properly affected on m.addHealth()
        },
        effect() {
            // if (!tech.isEnergyHealth && m.alive) {
            //     const heal = powerUps.heal.calculateHeal(this.size)
            //     if (heal > 0) {
            //         if (tech.isOverHeal && m.health === m.maxHealth) { //tech quenching
            //             m.damage(heal * simulation.healScale);
            //             //draw damage
            //             simulation.drawList.push({ //add dmg to draw queue
            //                 x: m.pos.x,
            //                 y: m.pos.y,
            //                 radius: heal * 500 * simulation.healScale,
            //                 color: simulation.mobDmgColor,
            //                 time: simulation.drawTime
            //             });
            //             tech.extraMaxHealth += heal * simulation.healScale //increase max health
            //             m.setMaxHealth();
            //         } else {
            //             const healOutput = Math.min(m.maxHealth - m.health, heal) * simulation.healScale
            //             m.addHealth(heal);
            //             simulation.makeTextLog(`<span class='color-var'>m</span>.health <span class='color-symbol'>+=</span> ${(healOutput).toFixed(3)}`) // <br>${m.health.toFixed(3)}
            //         }
            //     }
            // }
            if (!tech.isEnergyHealth && m.alive) {
                const heal = powerUps.heal.calculateHeal(this.size)
                if (heal > 0) {
                    const overHeal = m.health + heal * simulation.healScale - m.maxHealth //used with tech.isOverHeal

                    const healOutput = Math.min(m.maxHealth - m.health, heal) * simulation.healScale
                    m.addHealth(heal);
                    simulation.makeTextLog(`<span class='color-var'>m</span>.health <span class='color-symbol'>+=</span> ${(healOutput).toFixed(3)}`) // <br>${m.health.toFixed(3)}

                    if (tech.isOverHeal && overHeal > 0) { //tech quenching
                        const scaledOverHeal = overHeal * 0.8
                        m.damage(scaledOverHeal);
                        simulation.makeTextLog(`<span class='color-var'>m</span>.health <span class='color-symbol'>-=</span> ${(scaledOverHeal).toFixed(3)}`) // <br>${m.health.toFixed(3)}

                        //draw damage
                        simulation.drawList.push({ //add dmg to draw queue
                            x: m.pos.x,
                            y: m.pos.y,
                            radius: scaledOverHeal * 500 * simulation.healScale,
                            color: simulation.mobDmgColor,
                            time: simulation.drawTime
                        });
                        tech.extraMaxHealth += scaledOverHeal * simulation.healScale //increase max health
                        m.setMaxHealth();
                    }
                }
            }

            if (tech.healGiveMaxEnergy) {
                tech.healMaxEnergyBonus += 0.06
                m.setMaxEnergy();
            }
        },
        spawn(x, y, size) { //used to spawn a heal with a specific size / heal amount, not normally used
            powerUps.directSpawn(x, y, "heal", false, null, size)
            if (Math.random() < tech.duplicationChance()) {
                powerUps.directSpawn(x, y, "heal", false, null, size)
                powerUp[powerUp.length - 1].isDuplicated = true
            }
        }
    },
    ammo: {
        name: "ammo",
        color: "#467",
        size() {
            return 17;
        },
        effect() {
            if (tech.isAmmoForGun && b.inventory.length > 0 && b.activeGun) {
                const target = b.guns[b.activeGun]
                if (target.ammo !== Infinity) {
                    const ammoAdded = Math.ceil(Math.random() * target.ammoPack) + Math.ceil(0.7 * Math.random() * target.ammoPack)
                    target.ammo += ammoAdded
                    simulation.makeTextLog(`${target.name}.<span class='color-gun'>ammo</span> <span class='color-symbol'>+=</span> ${ammoAdded}`)
                }
            } else { //give ammo to all guns in inventory
                for (let i = 0, len = b.inventory.length; i < len; i++) {
                    const target = b.guns[b.inventory[i]]
                    if (target.ammo !== Infinity) {
                        const ammoAdded = Math.ceil(Math.random() * target.ammoPack)
                        target.ammo += ammoAdded
                        simulation.makeTextLog(`${target.name}.<span class='color-gun'>ammo</span> <span class='color-symbol'>+=</span> ${ammoAdded}`)
                    }
                }

            }
            simulation.updateGunHUD();
        }
    },
    field: {
        name: "field",
        color: "#0cf",
        size() {
            return 45;
        },
        choiceLog: [], //records all previous choice options
        effect() {
            function pick(who, skip1 = -1, skip2 = -1, skip3 = -1, skip4 = -1) {
                let options = [];
                for (let i = 1; i < who.length; i++) {
                    if (i !== m.fieldMode && i !== skip1 && i !== skip2 && i !== skip3 && i !== skip4) options.push(i);
                }
                //remove repeats from last selection
                const totalChoices = tech.isDeterminism ? 1 : 3 + tech.isExtraChoice * 2
                if (powerUps.field.choiceLog.length > totalChoices || powerUps.field.choiceLog.length === totalChoices) { //make sure this isn't the first time getting a power up and there are previous choices to remove
                    for (let i = 0; i < totalChoices; i++) { //repeat for each choice from the last selection
                        if (options.length > totalChoices) {
                            for (let j = 0, len = options.length; j < len; j++) {
                                if (powerUps.field.choiceLog[powerUps.field.choiceLog.length - 1 - i] === options[j]) {
                                    options.splice(j, 1) //remove previous choice from option pool
                                    break
                                }
                            }
                        }
                    }
                }
                if (options.length > 0) {
                    return options[Math.floor(Math.random() * options.length)]
                }
            }

            let choice1 = pick(m.fieldUpgrades)
            let choice2 = -1
            let choice3 = -1
            if (choice1 > -1) {
                let text = ""
                if (!tech.isDeterminism) text += `<div class='cancel' onclick='powerUps.endDraft("field",true)'>✕</div>`
                text += `<h3 style = 'color:#fff; text-align:left; margin: 0px;'>field</h3>`
                text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice1})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choice1].name}</div> ${m.fieldUpgrades[choice1].description}</div>`
                if (!tech.isDeterminism) {
                    choice2 = pick(m.fieldUpgrades, choice1)
                    if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice2})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choice2].name}</div> ${m.fieldUpgrades[choice2].description}</div>`
                    choice3 = pick(m.fieldUpgrades, choice1, choice2)
                    if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice3})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choice3].name}</div> ${m.fieldUpgrades[choice3].description}</div>`
                }
                if (tech.isExtraChoice) {
                    let choice4 = pick(m.fieldUpgrades, choice1, choice2, choice3)
                    if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice4})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choice4].name}</div> ${m.fieldUpgrades[choice4].description}</div>`
                    let choice5 = pick(m.fieldUpgrades, choice1, choice2, choice3, choice4)
                    if (choice5 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice5})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choice5].name}</div> ${m.fieldUpgrades[choice5].description}</div>`
                    powerUps.field.choiceLog.push(choice4)
                    powerUps.field.choiceLog.push(choice5)
                }
                powerUps.field.choiceLog.push(choice1)
                powerUps.field.choiceLog.push(choice2)
                powerUps.field.choiceLog.push(choice3)

                if (tech.isJunkResearch) {
                    tech.junkResearchNumber = Math.floor(5 * Math.random())
                    text += `<div class="choose-grid-module" onclick="powerUps.research.use('field')"><div class="grid-title"> <span style="position:relative;">`
                    for (let i = 0; i < tech.junkResearchNumber; i++) text += `<div class="circle-grid junk" style="position:absolute; top:0; left:${15*i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
                    text += `</span>&nbsp; <span class='research-select'>pseudoscience</span></div></div>`
                } else if (powerUps.research.count) {
                    text += `<div class="choose-grid-module" onclick="powerUps.research.use('field')"><div class="grid-title"> <span style="position:relative;">`
                    for (let i = 0, len = Math.min(powerUps.research.count, 30); i < len; i++) text += `<div class="circle-grid research" style="position:absolute; top:0; left:${(18 - len*0.3)*i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
                    text += `</span>&nbsp; <span class='research-select'>research</span></div></div>`
                }
                //(${powerUps.research.count})
                // text += `<div style = 'color:#fff'>${simulation.SVGrightMouse} activate the shield with the right mouse<br>fields shield you from damage <br>and let you pick up and throw blocks</div>`
                document.getElementById("choose-grid").innerHTML = text
                powerUps.showDraft();
            } else {
                powerUps.giveRandomAmmo()
            }
        }
    },
    tech: {
        name: "tech",
        color: "hsl(246,100%,77%)", //"#a8f",
        size() {
            return 42;
        },
        choiceLog: [], //records all previous choice options
        lastTotalChoices: 0, //tracks how many tech were available for random selection last time a tech was picked up
        banishLog: [], //records all tech permanently removed from the selection pool
        effect() {
            if (m.alive) {
                function pick(skip1 = -1, skip2 = -1, skip3 = -1, skip4 = -1) {
                    let options = [];
                    for (let i = 0; i < tech.tech.length; i++) {
                        if (tech.tech[i].count < tech.tech[i].maxCount && i !== skip1 && i !== skip2 && i !== skip3 && i !== skip4 && tech.tech[i].allowed()) {
                            for (let j = 0, len = tech.tech[i].frequency; j < len; j++) options.push(i);
                        }
                    }
                    powerUps.tech.lastTotalChoices = options.length //this is recorded so that banish can know how many tech were available
                    if (tech.isBanish) { //remove banished tech from last selection
                        for (let i = 0; i < powerUps.tech.banishLog.length; i++) {
                            for (let j = 0; j < options.length; j++) {
                                if (powerUps.tech.banishLog[i] === options[j]) {
                                    options.splice(j, 1)
                                    break
                                }
                            }
                        }
                    } else { //remove repeats from last selection
                        const totalChoices = tech.isDeterminism ? 1 : 3 + tech.isExtraChoice * 2
                        if (powerUps.tech.choiceLog.length > totalChoices || powerUps.tech.choiceLog.length === totalChoices) { //make sure this isn't the first time getting a power up and there are previous choices to remove
                            for (let i = 0; i < totalChoices; i++) { //repeat for each choice from the last selection
                                if (options.length > totalChoices) {
                                    for (let j = 0, len = options.length; j < len; j++) {
                                        if (powerUps.tech.choiceLog[powerUps.tech.choiceLog.length - 1 - i] === options[j]) {
                                            options.splice(j, 1) //remove previous choice from option pool
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (options.length > 0) {
                        const choose = options[Math.floor(Math.random() * options.length)]
                        const isCount = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count+1}x)` : "";

                        if (tech.tech[choose].isFieldTech) {
                            text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title">
                                                    <span style="position:relative;">
                                                        <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                                        <div class="circle-grid field" style="position:absolute; top:0; left:10px;opacity:0.65;"></div>
                                                    </span>
                                                    &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[choose].name} ${isCount}</div>${tech.tech[choose].description}</div></div>`
                        } else if (tech.tech[choose].isGunTech) {
                            text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title">
                                                    <span style="position:relative;">
                                                        <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                                        <div class="circle-grid gun" style="position:absolute; top:0; left:10px; opacity:0.65;"></div>
                                                    </span>
                                                    &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[choose].name} ${isCount}</div>${tech.tech[choose].description}</div></div>`
                        } else if (tech.tech[choose].isLore) {
                            text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title lore-text"><div class="circle-grid lore"></div> &nbsp; ${tech.tech[choose].name} ${isCount}</div>${tech.tech[choose].description}</div>`
                        } else if (tech.tech[choose].isJunk) {
                            text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title"><div class="circle-grid junk"></div> &nbsp; ${tech.tech[choose].name} ${isCount}</div>${tech.tech[choose].description}</div>`
                        } else {
                            text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choose].name} ${isCount}</div>${tech.tech[choose].description}</div>`
                        }

                        // text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choose].name}</div> ${tech.tech[choose].description}</div>`
                        return choose
                    }
                }
                let text = ""
                if (!tech.isDeterminism) text += `<div class='cancel' onclick='powerUps.endDraft("tech",true)'>✕</div>`
                text += `<h3 style = 'color:#fff; text-align:left; margin: 0px;'>tech</h3>`
                let choice1 = pick()
                let choice2 = -1
                let choice3 = -1
                if (choice1 > -1) {
                    if (!tech.isDeterminism) {
                        choice2 = pick(choice1)
                        // if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choice2})"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choice2].name}</div> ${tech.tech[choice2].description}</div>`
                        choice3 = pick(choice1, choice2)
                        // if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choice3})"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choice3].name}</div> ${tech.tech[choice3].description}</div>`
                    }
                    if (tech.isExtraChoice) {
                        let choice4 = pick(choice1, choice2, choice3)
                        // if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choice4})"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choice4].name}</div> ${tech.tech[choice4].description}</div>`
                        let choice5 = pick(choice1, choice2, choice3, choice4)
                        // if (choice5 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choice5})"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choice5].name}</div> ${tech.tech[choice5].description}</div>`
                        powerUps.tech.choiceLog.push(choice4)
                        powerUps.tech.choiceLog.push(choice5)
                    }
                    powerUps.tech.choiceLog.push(choice1)
                    powerUps.tech.choiceLog.push(choice2)
                    powerUps.tech.choiceLog.push(choice3)
                    // if (powerUps.research.count) text += `<div class="choose-grid-module" onclick="powerUps.research.use('tech')"><div class="grid-title"><div class="circle-grid research"></div> &nbsp; research <span class="research-select">${powerUps.research.count}</span></div></div>`

                    if (tech.isJunkResearch) {
                        tech.junkResearchNumber = Math.floor(5 * Math.random())
                        text += `<div class="choose-grid-module" onclick="powerUps.research.use('tech')"><div class="grid-title"> <span style="position:relative;">`
                        for (let i = 0; i < tech.junkResearchNumber; i++) text += `<div class="circle-grid junk" style="position:absolute; top:0; left:${15*i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
                        text += `</span>&nbsp; <span class='research-select'>pseudoscience</span></div></div>`
                    } else if (powerUps.research.count) {
                        text += `<div class="choose-grid-module" onclick="powerUps.research.use('tech')"><div class="grid-title"> <span style="position:relative;">`
                        for (let i = 0, len = Math.min(powerUps.research.count, 30); i < len; i++) text += `<div class="circle-grid research" style="position:absolute; top:0; left:${(18 - len*0.3)*i}px;opacity:0.8; border: 1px #fff solid;"></div>`
                        text += `</span>&nbsp; <span class='research-select'>research</span></div></div>`
                    }

                    document.getElementById("choose-grid").innerHTML = text
                    powerUps.showDraft();
                } else {
                    if (tech.isBanish) {
                        for (let i = 0, len = tech.tech.length; i < len; i++) {
                            if (tech.tech[i].name === "decoherence") powerUps.ejectTech(i)
                        }
                        // simulation.makeTextLog(`No <strong class='color-m'>tech</strong> left<br>erased <strong class='color-m'>tech</strong> have been recovered`)
                        simulation.makeTextLog(`powerUps.tech.length: ${Math.max(0,powerUps.tech.lastTotalChoices - powerUps.tech.banishLog.length)}`)
                        // powerUps.spawn(m.pos.x, m.pos.y, "tech");
                        powerUps.endDraft("tech");
                    } else {
                        powerUps.giveRandomAmmo()
                    }
                }
            }
        }
    },
    gun: {
        name: "gun",
        color: "#26a",
        size() {
            return 35;
        },
        choiceLog: [], //records all previous choice options
        effect() {
            function pick(who, skip1 = -1, skip2 = -1, skip3 = -1, skip4 = -1) {
                let options = [];
                for (let i = 0; i < who.length; i++) {
                    if (!who[i].have && i !== skip1 && i !== skip2 && i !== skip3 && i !== skip4) {
                        options.push(i);
                    }
                }

                //remove repeats from last selection
                const totalChoices = tech.isDeterminism ? 1 : 3 + tech.isExtraChoice * 2
                if (powerUps.gun.choiceLog.length > totalChoices || powerUps.gun.choiceLog.length === totalChoices) { //make sure this isn't the first time getting a power up and there are previous choices to remove
                    for (let i = 0; i < totalChoices; i++) { //repeat for each choice from the last selection
                        if (options.length > totalChoices) {
                            for (let j = 0, len = options.length; j < len; j++) {
                                if (powerUps.gun.choiceLog[powerUps.gun.choiceLog.length - 1 - i] === options[j]) {
                                    options.splice(j, 1) //remove previous choice from option pool
                                    break
                                }
                            }
                        }
                    }
                }
                if (options.length > 0) {
                    return options[Math.floor(Math.random() * options.length)]
                }
            }

            let choice1 = pick(b.guns)
            let choice2 = -1
            let choice3 = -1
            if (choice1 > -1) {
                let text = ""
                if (!tech.isDeterminism) text += `<div class='cancel' onclick='powerUps.endDraft("gun",true)'>✕</div>`
                text += `<h3 style = 'color:#fff; text-align:left; margin: 0px;'>gun</h3>`
                text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice1})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice1].name}</div> ${b.guns[choice1].description}</div>`
                if (!tech.isDeterminism) {
                    choice2 = pick(b.guns, choice1)
                    if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice2})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice2].name}</div> ${b.guns[choice2].description}</div>`
                    choice3 = pick(b.guns, choice1, choice2)
                    if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice3})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice3].name}</div> ${b.guns[choice3].description}</div>`
                }
                if (tech.isExtraChoice) {
                    let choice4 = pick(b.guns, choice1, choice2, choice3)
                    if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice4})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice4].name}</div> ${b.guns[choice4].description}</div>`
                    let choice5 = pick(b.guns, choice1, choice2, choice3, choice4)
                    if (choice5 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice5})">
          <div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice5].name}</div> ${b.guns[choice5].description}</div>`
                    powerUps.gun.choiceLog.push(choice4)
                    powerUps.gun.choiceLog.push(choice5)
                }
                powerUps.gun.choiceLog.push(choice1)
                powerUps.gun.choiceLog.push(choice2)
                powerUps.gun.choiceLog.push(choice3)
                // if (powerUps.research.count) text += `<div class="choose-grid-module" onclick="powerUps.research.use('gun')"><div class="grid-title"><div class="circle-grid research"></div> &nbsp; research <span class="research-select">${powerUps.research.count}</span></div></div>`

                if (tech.isJunkResearch) {
                    tech.junkResearchNumber = Math.floor(5 * Math.random())
                    text += `<div class="choose-grid-module" onclick="powerUps.research.use('gun')"><div class="grid-title"> <span style="position:relative;">`
                    for (let i = 0; i < tech.junkResearchNumber; i++) text += `<div class="circle-grid junk" style="position:absolute; top:0; left:${15*i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
                    text += `</span>&nbsp; <span class='research-select'>pseudoscience</span></div></div>`
                } else if (powerUps.research.count) {
                    text += `<div class="choose-grid-module" onclick="powerUps.research.use('gun')"><div class="grid-title"> <span style="position:relative;">`
                    for (let i = 0, len = Math.min(powerUps.research.count, 30); i < len; i++) text += `<div class="circle-grid research" style="position:absolute; top:0; left:${(18 - len*0.3)*i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
                    text += `</span>&nbsp; <span class='research-select'>research</span></div></div>`
                }
                // console.log(powerUps.gun.choiceLog)
                // console.log(choice1, choice2, choice3)
                if (tech.isOneGun && b.inventory.length > 0) text += `<div style = "color: #f24">replaces your current gun</div>`
                document.getElementById("choose-grid").innerHTML = text
                powerUps.showDraft();
            } else {
                powerUps.giveRandomAmmo()
            }
        }
    },
    onPickUp(who) {
        if (tech.isTechDamage && who.name === "tech") m.damage(0.11)
        if (tech.isMassEnergy) m.energy += 2;
        if (tech.isMineDrop) {
            if (tech.isLaserMine) {
                b.laserMine(who.position)
            } else {
                b.mine(who.position, { x: 0, y: 0 }, 0, tech.isMineAmmoBack)
            }
        }
        if (tech.isRelay) {
            if (tech.isFlipFlopOn) {
                tech.isFlipFlopOn = false
                if (document.getElementById("tech-switch")) document.getElementById("tech-switch").innerHTML = ` = <strong>OFF</strong>`
                m.eyeFillColor = 'transparent'
            } else {
                tech.isFlipFlopOn = true //immune to damage this hit, lose immunity for next hit
                if (document.getElementById("tech-switch")) document.getElementById("tech-switch").innerHTML = ` = <strong>ON</strong>`
                m.eyeFillColor = m.fieldMeterColor //'#0cf'
            }
        }
    },
    giveRandomAmmo() {
        const ammoTarget = Math.floor(Math.random() * (b.guns.length));
        const ammo = Math.ceil(b.guns[ammoTarget].ammoPack * 6);
        if (ammo !== Infinity) {
            b.guns[ammoTarget].ammo += ammo;
            simulation.updateGunHUD();
            simulation.makeTextLog(`${b.guns[ammoTarget].name}.<span class='color-gun'>ammo</span> <span class='color-symbol'>+=</span> ${ammo}`);
        }
    },
    spawnRandomPowerUp(x, y) { //mostly used after mob dies,  doesn't always return a power up
        if ((Math.random() * Math.random() - 0.3 > Math.sqrt(m.health) && !tech.isEnergyHealth) || Math.random() < 0.04) { //spawn heal chance is higher at low health
            powerUps.spawn(x, y, "heal");
            return;
        }
        if (Math.random() < 0.15 && b.inventory.length > 0) {
            powerUps.spawn(x, y, "ammo");
            return;
        }
        if (Math.random() < 0.001 * (3 - b.inventory.length)) { //a new gun has a low chance for each not acquired gun up to 3
            powerUps.spawn(x, y, "gun");
            return;
        }
        // if (Math.random() < 0.0027 * (22 - tech.totalCount)) { //a new tech has a low chance for each not acquired tech up to 25
        if (Math.random() < 0.005 * (10 - level.levelsCleared)) { //a new tech has a low chance that decreases in later levels
            powerUps.spawn(x, y, "tech");
            return;
        }
        if (Math.random() < 0.006) {
            powerUps.spawn(x, y, "field");
            return;
        }
        // if (Math.random() < 0.01) {
        //   powerUps.spawn(x, y, "research");
        //   return;
        // }
    },
    randomPowerUpCounter: 0,
    spawnBossPowerUp(x, y) { //boss spawns field and gun tech upgrades
        if (level.levels[level.onLevel] !== "final") {
            if (m.fieldMode === 0) {
                powerUps.spawn(x, y, "field")
            } else {
                powerUps.randomPowerUpCounter++;
                powerUpChance(Math.max(level.levelsCleared, 10) * 0.1)
            }
            powerUps.randomPowerUpCounter += 0.6;
            powerUpChance(Math.max(level.levelsCleared, 6) * 0.1)

            function powerUpChance(chanceToFail) {
                if (Math.random() * chanceToFail < powerUps.randomPowerUpCounter) {
                    powerUps.randomPowerUpCounter = 0;
                    if (Math.random() < 0.97) {
                        powerUps.spawn(x, y, "tech")
                    } else {
                        powerUps.spawn(x, y, "gun")
                    }
                } else {
                    if (m.health < 0.65 && !tech.isEnergyHealth) {
                        powerUps.spawn(x, y, "heal");
                        powerUps.spawn(x, y, "heal");
                    } else {
                        powerUps.spawn(x, y, "ammo");
                        powerUps.spawn(x, y, "ammo");
                    }
                }
            }
        }
    },
    chooseRandomPowerUp(x, y) { //100% chance to drop a random power up    //used in spawn.debris
        if (Math.random() < 0.5) {
            powerUps.spawn(x, y, "heal", false);
        } else {
            powerUps.spawn(x, y, "ammo", false);
        }
    },
    addResearchToLevel() { //add a random power up to a location that has a mob,  mostly used to give each level one randomly placed research
        if (mob.length && Math.random() < 0.8) { // 80% chance
            const index = Math.floor(Math.random() * mob.length)
            powerUps.spawn(mob[index].position.x, mob[index].position.y, "research");
        }
    },
    spawnStartingPowerUps(x, y) { //used for map specific power ups, mostly to give player a starting gun
        if (level.levelsCleared < 4) { //runs 4 times on all difficulty levels
            if (level.levelsCleared > 1) powerUps.spawn(x, y, "tech")

            //bonus power ups for clearing runs in the last game
            if (level.levelsCleared === 0 && !simulation.isCheating && localSettings.levelsClearedLastGame > 1) {
                for (let i = 0; i < localSettings.levelsClearedLastGame / 3; i++) {
                    powerUps.spawn(m.pos.x, m.pos.y, "tech", false); //spawn a tech for levels cleared in last game
                    simulation.makeTextLog(`for (let i = 0; i < localSettings.levelsClearedLastGame / 3; i++)`);
                    simulation.makeTextLog(`{ powerUps.spawn(m.pos.x, m.pos.y, "tech") //simulation superposition }`);
                }
                localSettings.levelsClearedLastGame = 0 //after getting bonus power ups reset run history
                localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
            if (b.inventory.length === 0) {
                powerUps.spawn(x, y, "gun", false); //first gun
            } else if (tech.totalCount === 0) { //first tech
                powerUps.spawn(x, y, "tech", false);
            } else if (b.inventory.length === 1) { //second gun or extra ammo
                if (Math.random() < 0.4) {
                    powerUps.spawn(x, y, "gun", false);
                } else {
                    for (let i = 0; i < 5; i++) powerUps.spawn(x, y, "ammo", false);
                }
            } else {
                for (let i = 0; i < 4; i++) powerUps.spawnRandomPowerUp(x, y);
            }
        } else {
            for (let i = 0; i < 3; i++) powerUps.spawnRandomPowerUp(x, y);
        }
    },
    ejectTech(choose = 'random') {
        //find which tech you have
        if (choose === 'random') {
            const have = []
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].count > 0 && !tech.tech[i].isNonRefundable) have.push(i)
            }
            if (have.length === 0) {
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].count > 0) have.push(i)
                }
            }

            if (have.length) {
                choose = have[Math.floor(Math.random() * have.length)]
                // simulation.makeTextLog(`<div class='circle tech'></div> &nbsp; <strong>${tech.tech[choose].name}</strong> was ejected`, 600) //message about what tech was lost
                simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)

                for (let i = 0; i < tech.tech[choose].count; i++) {
                    powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
                    powerUp[powerUp.length - 1].isDuplicated = true
                }
                // remove a random tech from the list of tech you have
                tech.tech[choose].remove();
                tech.tech[choose].count = 0;
                tech.tech[choose].isLost = true;
                simulation.updateTechHUD();
                m.fieldCDcycle = m.cycle + 30; //disable field so you can't pick up the ejected tech
            }
        } else {
            // simulation.makeTextLog(`<div class='circle tech'></div> &nbsp; <strong>${tech.tech[choose].name}</strong> was ejected`, 600) //message about what tech was lost
            simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)

            for (let i = 0; i < tech.tech[choose].count; i++) {
                powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
                powerUp[powerUp.length - 1].isDuplicated = true
            }
            // remove a random tech from the list of tech you have
            tech.tech[choose].remove();
            tech.tech[choose].count = 0;
            tech.tech[choose].isLost = true;
            simulation.updateTechHUD();
            m.fieldCDcycle = m.cycle + 30; //disable field so you can't pick up the ejected tech
        }
    },
    removeRandomTech() {
        const have = [] //find which tech you have
        for (let i = 0; i < tech.tech.length; i++) {
            if (tech.tech[i].count > 0) have.push(i)
        }
        if (have.length) {
            const choose = have[Math.floor(Math.random() * have.length)]
            simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)
            const totalRemoved = tech.tech[choose].count
            tech.tech[choose].count = 0;
            tech.tech[choose].remove(); // remove a random tech form the list of tech you have
            tech.tech[choose].isLost = true
            simulation.updateTechHUD();
            return totalRemoved
        }
        return 0
    },
    directSpawn(x, y, target, moving = true, mode = null, size = powerUps[target].size()) {
        let index = powerUp.length;
        target = powerUps[target];
        powerUp[index] = Matter.Bodies.polygon(x, y, 0, size, {
            density: 0.001,
            frictionAir: 0.03,
            restitution: 0.85,
            inertia: Infinity, //prevents rotation
            collisionFilter: {
                group: 0,
                category: cat.powerUp,
                mask: cat.map | cat.powerUp
            },
            color: target.color,
            effect: target.effect,
            name: target.name,
            size: size
        });
        if (mode) {
            powerUp[index].mode = mode
        }
        if (moving) {
            Matter.Body.setVelocity(powerUp[index], {
                x: (Math.random() - 0.5) * 15,
                y: Math.random() * -9 - 3
            });
        }
        World.add(engine.world, powerUp[index]); //add to world
    },
    spawn(x, y, target, moving = true, mode = null, size = powerUps[target].size()) {
        if (
            (!tech.isSuperDeterminism || (target === 'tech' || target === 'heal' || target === 'ammo')) &&
            !(tech.isEnergyNoAmmo && target === 'ammo') &&
            (!simulation.isNoPowerUps || (target === 'research' || target === 'heal' || target === 'ammo'))
        ) {
            powerUps.directSpawn(x, y, target, moving, mode, size)
            if (Math.random() < tech.duplicationChance()) {
                powerUps.directSpawn(x, y, target, moving, mode, size)
                powerUp[powerUp.length - 1].isDuplicated = true
                // if (tech.isPowerUpsVanish) powerUp[powerUp.length - 1].endCycle = simulation.cycle + 300
            }
        }
    },
};