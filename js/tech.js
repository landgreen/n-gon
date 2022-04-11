const tech = {
    totalCount: null,
    setupAllTech() {
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            tech.tech[i].count = 0
            tech.tech[i].isLost = false
            tech.tech[i].remove();
            if (tech.tech[i].isJunk) {
                tech.tech[i].frequency = 0
            } else if (tech.tech[i].frequencyDefault) {
                tech.tech[i].frequency = tech.tech[i].frequencyDefault
            } else {
                tech.tech[i].frequency = 2
            }
        }
        //remove lore if it's your first time playing since it's confusing
        //also remove lore if cheating
        lore.techCount = 0;
        if (simulation.isCheating || localSettings.runCount < 1) { //simulation.isCommunityMaps ||
            for (let i = 0, len = tech.tech.length; i < len; i++) {
                if (tech.tech[i].isLore) {
                    tech.tech[i].frequency = 0;
                    tech.tech[i].count = 0;
                }
            }
        }
        // tech.removeJunkTechFromPool();
        // tech.removeLoreTechFromPool();
        // tech.addLoreTechToPool();
        tech.extraMaxHealth = 0;
        tech.totalCount = 0;
        simulation.updateTechHUD();
    },
    removeTech(index = 'random') {
        if (index === 'random') {
            const have = [] //find which tech you have
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].count > 0 && !tech.tech[i].isNonRefundable) have.push(i)
            }
            if (have.length) {
                index = have[Math.floor(Math.random() * have.length)]
            } else {
                return 0 //if none found don't remove any tech
            }
        } else if (isNaN(index)) { //find index by name
            let found = false;
            for (let i = 0; i < tech.tech.length; i++) {
                if (index === tech.tech[i].name) {
                    index = i;
                    found = true;
                    break;
                }
            }
            if (!found) return 0 //if name not found don't remove any tech
        }
        if (tech.tech[index].count === 0) return 0
        const totalRemoved = tech.tech[index].count
        simulation.makeTextLog(`<span class='color-var'>tech</span>.removeTech("<span class='color-text'>${tech.tech[index].name}</span>")`)
        tech.tech[index].remove();
        tech.tech[index].count = 0;
        tech.totalCount -= totalRemoved
        simulation.updateTechHUD();
        tech.tech[index].isLost = true
        simulation.updateTechHUD();
        return totalRemoved //return the total number of tech removed
    },
    // onclick="tech.removeTechPaused(${i}, this)"  //add this to tech elements in pause menu
    // removeTechPaused(index, who) {
    //     tech.tech[index].remove();
    //     tech.tech[index].count = 0;
    //     simulation.updateTechHUD();
    //     who.innerHTML = "removed"
    //     // who.style.display = "none"
    // },
    // removeLoreTechFromPool() {
    //     for (let i = tech.tech.length - 1; i > 0; i--) {
    //         if (tech.tech[i].isLore && tech.tech[i].count === 0) tech.tech.splice(i, 1)
    //     }
    // },
    addJunkTechToPool(chance) { //chance is number between 0-1
        // { //count JUNK
        //     let count = 0
        //     for (let i = 0, len = tech.tech.length; i < len; i++) {
        //         if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && tech.tech[i].isJunk && tech.tech[i].frequency > 0) count += tech.tech[i].frequency
        //     }
        //     console.log(count)
        // }
        // { //count not JUNK
        //     let count = 0
        //     for (let i = 0, len = tech.tech.length; i < len; i++) {
        //         if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isJunk && tech.tech[i].frequency > 0) count++
        //     }
        //     console.log(count)
        // }
        // count total non junk tech
        let count = 0
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isJunk) count += tech.tech[i].frequency
        }
        //make an array for possible junk tech to add
        let options = [];
        for (let i = 0; i < tech.tech.length; i++) {
            if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].isJunk) options.push(i);
        }
        //add random array options to tech pool
        if (options.length) {
            const num = chance * count //scale number added
            for (let i = 0; i < num; i++) tech.tech[options[Math.floor(Math.random() * options.length)]].frequency++
            simulation.makeTextLog(`<span class='color-var'>tech</span>.tech.push(${num.toFixed(0)} <span class='color-text'>JUNK</span>)`)
            return num
        } else {
            return 0
        }
    },
    removeJunkTechFromPool(num = 1) {
        for (let j = 0; j < num; j++) {
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].isJunk && tech.tech[i].frequency > 0 && tech.tech[i].count < tech.tech[i].maxCount) {
                    tech.tech[i].frequency--
                    break
                }
            }
        }
    },
    giveRandomJUNK() {
        const list = []
        for (let i = 0; i < tech.tech.length; i++) {
            if (tech.tech[i].isJunk) list.push(tech.tech[i].name)
        }
        let name = list[Math.floor(Math.random() * list.length)]
        tech.giveTech(name)
        simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${name}</span>")<em>`);
    },
    giveTech(index = 'random') {
        if (index === 'random') {
            let options = [];
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isJunk && !tech.tech[i].isLore && !tech.tech[i].isBadRandomOption) options.push(i);
            }
            // give a random tech from the tech I don't have
            if (options.length > 0) {
                let newTech = options[Math.floor(Math.random() * options.length)]
                tech.giveTech(newTech)
                simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${tech.tech[newTech].name}</span>")<em> //random tech</em>`);
            }
        } else {
            if (isNaN(index)) { //find index by name
                let found = false;
                for (let i = 0; i < tech.tech.length; i++) {
                    if (index === tech.tech[i].name) {
                        index = i;
                        found = true;
                        break;
                    }
                }
                if (!found) return //if name not found don't give any tech
            }
            if (tech.isMetaAnalysis && tech.tech[index].isJunk) {
                simulation.makeTextLog(`//tech: meta-analysis replaced junk tech with random tech`);
                tech.giveTech('random')
                for (let i = 0; i < 3; i++) powerUps.spawn(m.pos.x + 40 * Math.random(), m.pos.y + 40 * Math.random(), "research");
                return
            }

            if (tech.tech[index].isLost) tech.tech[index].isLost = false; //give specific tech
            tech.tech[index].effect(); //give specific tech
            tech.tech[index].count++
            tech.totalCount++ //used in power up randomization
            simulation.updateTechHUD();
        }
    },
    // setTechoNonRefundable(name) {
    //     for (let i = 0; i < tech.tech.length; i++) {
    //         if (tech.tech.name === name) {
    //             tech.tech[i].isNonRefundable = true;
    //             return
    //         }
    //     }
    // },
    setCheating() {
        if (!simulation.isCheating) {
            simulation.isCheating = true;
            level.levelAnnounce();
            lore.techCount = 0;
            for (let i = 0, len = tech.tech.length; i < len; i++) {
                if (tech.tech[i].isLore) {
                    tech.tech[i].frequency = 0;
                    tech.tech[i].count = 0;
                }
            }
            console.log('cheating')
            sound.tone(250)
            sound.tone(300)
            sound.tone(375)
        }
    },
    haveGunCheck(name, needActive = true) {
        // if (
        //     !build.isExperimentSelection &&
        //     b.inventory.length > 2 &&
        //     name !== b.guns[b.activeGun].name &&
        //     Math.random() > 2 - b.inventory.length * 0.5
        // ) {
        //     return false
        // }
        // for (i = 0, len = b.inventory.length; i < len; i++) {
        //     if (b.guns[b.inventory[i]].name === name) return true
        // }
        // return false
        if (build.isExperimentSelection || !needActive) {
            for (i = 0, len = b.inventory.length; i < len; i++) {
                if (b.guns[b.inventory[i]].name === name) return true
            }
            return false
        } else { //must be holding gun, this is the standard while playing
            return b.inventory.length > 0 && b.guns[b.activeGun].name === name
        }
    },
    hasExplosiveDamageCheck() {
        return tech.haveGunCheck("missiles") || tech.isMissileField || tech.missileBotCount > 0 || tech.boomBotCount > 1 || tech.isIncendiary || tech.isPulseLaser || tech.isTokamak || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb)
    },
    damageFromTech() {
        let dmg = 1 //m.fieldDamage
        if (tech.isTechDebt) dmg *= Math.max(41 / (tech.totalCount + 21), 4 - 0.15 * tech.totalCount)
        if (tech.isAxion && tech.isHarmMACHO) dmg *= 1 + 0.75 * (1 - m.harmReduction())
        if (tech.OccamDamage) dmg *= tech.OccamDamage
        if (tech.isCloakingDamage) dmg *= 1.35
        if (tech.isFlipFlopDamage && tech.isFlipFlopOn) dmg *= 1.555
        if (tech.isAnthropicDamage && tech.isDeathAvoidedThisLevel) dmg *= 2.3703599
        if (m.isSneakAttack && m.cycle > m.lastKillCycle + 240) dmg *= tech.sneakAttackDmg
        if (tech.isTechDamage) dmg *= 1.9
        if (tech.isDupDamage) dmg *= 1 + Math.min(1, tech.duplicationChance())
        if (tech.isLowEnergyDamage) dmg *= 1 + 0.7 * Math.max(0, 1 - m.energy)
        if (tech.isMaxEnergyTech) dmg *= 1.5
        if (tech.isEnergyNoAmmo) dmg *= 1.70
        if (tech.isDamageForGuns) dmg *= 1 + 0.12 * b.inventory.length
        if (tech.isLowHealthDmg) dmg *= 1 + Math.max(0, 1 - m.health) * 0.5
        if (tech.isHarmDamage && m.lastHarmCycle + 600 > m.cycle) dmg *= 3;
        if (tech.isEnergyLoss) dmg *= 1.55;
        if (tech.isAcidDmg && m.health > 1) dmg *= 1.35;
        if (tech.restDamage > 1 && player.speed < 1) dmg *= tech.restDamage
        if (tech.isEnergyDamage) dmg *= 1 + m.energy * 0.125;
        if (tech.isDamageFromBulletCount) dmg *= 1 + bullet.length * 0.007
        if (tech.isRerollDamage) dmg *= 1 + 0.038 * powerUps.research.count
        if (tech.isOneGun && b.inventory.length < 2) dmg *= 1.25
        if (tech.isNoFireDamage && m.cycle > m.fireCDcycle + 120) dmg *= 2
        if (tech.isSpeedDamage) dmg *= 1 + Math.min(0.66, player.speed * 0.0165)
        if (tech.isBotDamage) dmg *= 1 + 0.06 * b.totalBots()
        if (tech.isDamageAfterKillNoRegen && m.lastKillCycle + 300 > m.cycle) dmg *= 1.5
        return dmg * tech.slowFire * tech.aimDamage
    },
    duplicationChance() {
        return Math.max(0, (tech.isPowerUpsVanish ? 0.12 : 0) + (tech.isStimulatedEmission ? 0.15 : 0) + tech.cancelCount * 0.043 + tech.duplicateChance + m.duplicateChance + tech.wormDuplicate + tech.cloakDuplication + (tech.isAnthropicTech && tech.isDeathAvoidedThisLevel ? 0.5 : 0))
    },
    isScaleMobsWithDuplication: false,
    maxDuplicationEvent() {
        if (tech.is111Duplicate && tech.duplicationChance() > 1.11) {
            tech.is111Duplicate = false
            const range = 1300
            tech.isScaleMobsWithDuplication = true
            for (let i = 0, len = 9; i < len; i++) {
                const angle = 2 * Math.PI * i / len
                spawn.randomLevelBoss(m.pos.x + range * Math.cos(angle), m.pos.y + range * Math.sin(angle), spawn.nonCollideBossList);
            }
            spawn.historyBoss(0, 0)
            spawn.pulsarBoss(level.exit.x, level.exit.y, 70, true)
            spawn.blockBoss(level.enter.x, level.enter.y)
            tech.isScaleMobsWithDuplication = false
        }
    },
    setTechFrequency(name, frequency) {
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (tech.tech[i].name === name) tech.tech[i].frequency = frequency
        }
    },
    setBotTechFrequency(f = 0) {
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (tech.tech[i].isBotTech) {
                switch (tech.tech[i].name) {
                    case "dynamo-bot":
                        tech.tech[i].frequency = f
                        break;
                    case "orbital-bot":
                        tech.tech[i].frequency = f
                        break;
                    case "laser-bot":
                        tech.tech[i].frequency = f
                        break;
                    case "boom-bot":
                        tech.tech[i].frequency = f
                        break;
                    case "foam-bot":
                        tech.tech[i].frequency = f
                        break;
                    case "nail-bot":
                        tech.tech[i].frequency = f
                        break;
                }
            }
        }
    },
    tech: [{
            name: "gun sciences",
            description: "</strong>triple</strong> the <strong class='flicker'>frequency</strong> of finding <strong class='color-g'>gun</strong><strong class='color-m'>tech</strong><br>spawn a <strong class='color-g'>gun</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            // isExperimentHide: true,
            isBadRandomOption: true,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "NOT EXPERIMENT MODE, not superdeterminism",
            effect() {
                powerUps.spawn(m.pos.x, m.pos.y, "gun");
                // this.count--
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].isGunTech) tech.tech[i].frequency *= 3
                }
            },
            remove() {}
        },
        {
            name: "ad hoc",
            description: `spawn a ${powerUps.orb.heal()}, ${powerUps.orb.research(1)}, <strong class='color-f'>field</strong>, ${powerUps.orb.ammo(1)}, or <strong class='color-m'>tech</strong><br>for every <strong class='color-g'>gun</strong> in your inventory`,
            maxCount: 1, //random power up
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            allowed() {
                return b.inventory.length > 1
            },
            requires: "NOT EXPERIMENT MODE, at least 2 guns",
            effect() {
                for (let i = 0; i < b.inventory.length; i++) {
                    if (Math.random() < 0.2) {
                        powerUps.spawn(m.pos.x + 10 * Math.random(), m.pos.y + 10 * Math.random(), "tech");
                    } else if (Math.random() < 0.25) {
                        powerUps.spawn(m.pos.x + 10 * Math.random(), m.pos.y + 10 * Math.random(), "field");
                    } else if (Math.random() < 0.33) {
                        powerUps.spawn(m.pos.x + 10 * Math.random(), m.pos.y + 10 * Math.random(), "heal");
                    } else if (Math.random() < 0.5) {
                        powerUps.spawn(m.pos.x + 10 * Math.random(), m.pos.y + 10 * Math.random(), "ammo");
                    } else {
                        powerUps.spawn(m.pos.x + 10 * Math.random(), m.pos.y + 10 * Math.random(), "research");
                    }
                }
            },
            remove() {}
        },
        {
            name: "applied science",
            description: `get a random <strong class='color-g'>gun</strong><strong class='color-m'>tech</strong><br>for each <strong class='color-g'>gun</strong> in your inventory`, //spawn ${powerUps.orb.research(1)} and 
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return b.inventory.length > 1
            },
            requires: "NOT EXPERIMENT MODE, at least 2 guns",
            effect() {
                for (let i = b.inventory.length - 1; i > -1; i--) {
                    const gunTechPool = [] //find gun tech for this gun
                    for (let j = 0, len = tech.tech.length; j < len; j++) {
                        // console.log(j, tech.tech[j].isGunTech, tech.tech[j].allowed(), !tech.tech[j].isJunk, !tech.tech[j].isBadRandomOption, tech.tech[j].count < tech.tech[j].maxCount)
                        const originalActiveGunIndex = b.activeGun //set current gun to active so allowed works
                        b.activeGun = b.inventory[i] //to make the .allowed work for guns that aren't active
                        if (tech.tech[j].isGunTech && tech.tech[j].allowed() && !tech.tech[j].isJunk && !tech.tech[j].isBadRandomOption && tech.tech[j].count < tech.tech[j].maxCount) {
                            const regex = tech.tech[j].requires.search(b.guns[b.inventory[i]].name) //get string index of gun name
                            const not = tech.tech[j].requires.search(' not ') //get string index of ' not '
                            if (regex !== -1 && (not === -1 || not > regex)) gunTechPool.push(j) //look for the gun name in the requirements, but the gun name needs to show up before the word ' not '                        
                        }
                        b.activeGun = originalActiveGunIndex
                    }
                    if (gunTechPool.length) {
                        const index = Math.floor(Math.random() * gunTechPool.length)
                        tech.giveTech(gunTechPool[index]) // choose from the gun pool
                        tech.tech[gunTechPool[index]].isFromAppliedScience = true //makes it not remove properly under paradigm shift
                        simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${tech.tech[gunTechPool[index]].name}</span>")`)
                    }
                }
                simulation.boldActiveGunHUD();
            },
            remove() {}
        },
        {
            name: "integrated armament",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Weapon' class="link">integrated armament</a>`,
            description: `<span style = 'font-size:95%;'>increase <strong class='color-d'>damage</strong> by <strong>25%</strong>, but new <strong class='color-g'>guns</strong><br>replace your current <strong class='color-g'>gun</strong> and convert <strong class='color-g'>gun</strong><strong class='color-m'>tech</strong></span>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return b.inventory.length === 1
            },
            requires: "only 1 gun",
            effect() {
                tech.isOneGun = true;
            },
            remove() {
                tech.isOneGun = false;
            }
        },
        {
            name: "entanglement",
            nameInfo: "<span id = 'tech-entanglement'></span>",
            addNameInfo() {
                setTimeout(function() {
                    simulation.boldActiveGunHUD();
                }, 1000);
            },
            description: "while your <strong>first</strong> <strong class='color-g'>gun</strong> is equipped<br>reduce <strong class='color-harm'>harm</strong> by <strong>13%</strong> for each of your <strong class='color-g'>guns</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect() {
                tech.isEntanglement = true
                setTimeout(function() {
                    simulation.boldActiveGunHUD();
                }, 1000);

            },
            remove() {
                tech.isEntanglement = false;
            }
        },
        {
            name: "generalist",
            description: "spawn <strong>8</strong> <strong class='color-g'>guns</strong>, but you can't <strong>switch</strong> <strong class='color-g'>guns</strong><br><strong class='color-g'>guns</strong> cycle automatically with each new level",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return b.inventory.length < b.guns.length - 5 //(tech.isDamageForGuns || tech.isFireRateForGuns) &&
            },
            requires: "less than 7 guns",
            effect() {
                tech.isGunCycle = true;
                for (let i = 0; i < 8; i++) powerUps.spawn(m.pos.x + 10 * Math.random(), m.pos.y + 10 * Math.random(), "gun");
            },
            remove() {
                if (tech.isGunCycle) {
                    for (let i = 0; i < 8; i++) {
                        if (b.inventory.length) b.removeGun(b.guns[b.inventory[b.inventory.length - 1]].name) //remove your last gun
                    }
                    tech.isGunCycle = false;
                }
            }
        },
        {
            name: "arsenal",
            // descriptionFunction() {
            //     return `increase <strong class='color-d'>damage</strong> by <strong>${14 * b.inventory.length}%</strong><br><strong>14%</strong> for each <strong class='color-g'>gun</strong> in your inventory`
            // },
            description: "increase <strong class='color-d'>damage</strong> by <strong>12%</strong><br>for each <strong class='color-g'>gun</strong> in your inventory",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isDamageForGuns = true;
            },
            remove() {
                tech.isDamageForGuns = false;
            }
        },
        {
            name: "active cooling",
            description: "<strong>18%</strong> decreased <strong><em>delay</em></strong> after firing<br>for each <strong class='color-g'>gun</strong> in your inventory",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isFireRateForGuns = true;
                b.setFireCD();
            },
            remove() {
                tech.isFireRateForGuns = false;
                b.setFireCD();
            }
        },
        {
            name: "supply chain",
            junk: 0.05,
            descriptionFunction() { return `double your current <strong class='color-ammo'>ammo</strong> for all <strong class='color-g'>guns</strong>` },
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = 0; i < b.guns.length; i++) {
                    if (b.guns[i].have) b.guns[i].ammo = Math.floor(2 * b.guns[i].ammo)
                }
                simulation.makeGunHUD();
                // this.refundAmount += tech.addJunkTechToPool(this.junk)
            },
            refundAmount: 0,
            remove() {
                for (let j = 0; j < this.count; j++) {
                    for (let i = 0; i < b.guns.length; i++) {
                        if (b.guns[i].have) b.guns[i].ammo = Math.floor(0.5 * b.guns[i].ammo)
                    }
                }
                simulation.makeGunHUD();
                // if (this.count > 0 && this.refundAmount > 0) {
                //     tech.removeJunkTechFromPool(this.refundAmount)
                //     this.refundAmount = 0
                // }
            }
        },
        {
            name: "logistics",
            description: `${powerUps.orb.ammo()} give <strong>80%</strong> more <strong class='color-ammo'>ammo</strong>, but<br>it's only added to your current <strong class='color-g'>gun</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyNoAmmo
            },
            requires: "not exciton",
            effect() {
                tech.isAmmoForGun = true;
            },
            remove() {
                tech.isAmmoForGun = false;
            }
        },
        {
            name: "cache",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Cache_(computing)' class="link">cache</a>`,
            description: `${powerUps.orb.ammo()} give <strong>14x</strong> more <strong class='color-ammo'>ammo</strong>, but<br>you can't <strong>store</strong> any more <strong class='color-ammo'>ammo</strong> than that`,
            // ammo powerups always max out your gun,
            // but the maximum ammo ti limited
            // description: `${powerUps.orb.ammo()} give <strong>13x</strong> more <strong class='color-ammo'>ammo</strong>, but<br>you can't <strong>store</strong> any more <strong class='color-ammo'>ammo</strong> than that`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyNoAmmo
            },
            requires: "not exciton",
            effect() {
                tech.ammoCap = 14;
                powerUps.ammo.effect()
            },
            remove() {
                tech.ammoCap = 0;
            }
        },
        {
            name: "catabolism",
            description: `firing while <strong>out</strong> of <strong class='color-ammo'>ammo</strong> spawns ${powerUps.orb.ammo(4)}<br>but it reduces your <strong>maximum</strong> <strong class='color-h'>health</strong> by <strong>1</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyNoAmmo && !tech.isEnergyHealth
            },
            requires: "not exciton, mass-energy",
            effect: () => {
                tech.isAmmoFromHealth = true;
            },
            remove() {
                tech.isAmmoFromHealth = false;
            }
        },
        {
            name: "exciton",
            description: `increase <strong class='color-d'>damage</strong> by <strong>70%</strong>, but<br>${powerUps.orb.ammo()} will no longer <strong>spawn</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isAmmoFromHealth
            },
            requires: "not catabolism",
            effect() {
                tech.isEnergyNoAmmo = true;
            },
            remove() {
                tech.isEnergyNoAmmo = false;
            }
        },
        {
            name: "desublimated ammunition",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Deposition_(phase_transition)' class="link">desublimated ammunition</a>`,
            description: `every other shot uses no <strong class='color-ammo'>ammo</strong> when <strong>crouching</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.crouchAmmoCount = true
            },
            remove() {
                tech.crouchAmmoCount = false;
            }
        },
        {
            name: "gun turret",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>66%</strong> when <strong>crouching</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth //(tech.crouchAmmoCount || tech.isCrouchRegen) &&
            },
            requires: "not mass-energy", //inductive coupling, desublimated ammunition, 
            effect() {
                tech.isTurret = true
            },
            remove() {
                tech.isTurret = false;
            }
        },
        {
            name: "dead reckoning",
            description: "increase <strong class='color-d'>damage</strong> by <strong>36%</strong> when at <strong>rest</strong>",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect: () => {
                tech.restDamage += 0.36
            },
            remove() {
                tech.restDamage = 1;
            }
        },
        {
            name: "Higgs mechanism",
            description: "while <strong>firing</strong> your <strong>position</strong> is locked<br><strong>50%</strong> decreased <strong><em>delay</em></strong> after firing",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !m.isShipMode && !tech.isAlwaysFire, !tech.isGrapple
            },
            requires: "not ship mode, not automatic, grappling hook",
            effect: () => {
                tech.isFireMoveLock = true;
                b.setFireCD();
                b.setFireMethod();
            },
            remove() {
                if (tech.isFireMoveLock) {
                    tech.isFireMoveLock = false
                    b.setFireCD();
                    b.setFireMethod();
                }
            }
        },
        {
            name: "squirrel-cage rotor",
            description: "<strong>move</strong> and <strong>jump</strong> <strong>30%</strong> faster<br>take <strong>5%</strong> more <strong class='color-harm'>harm</strong>",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() { // good with melee builds, content skipping builds
                tech.squirrelFx += 0.25;
                tech.squirrelJump += 0.1;
                m.setMovement()
            },
            remove() {
                tech.squirrelFx = 1;
                tech.squirrelJump = 1;
                m.setMovement()
            }
        },
        // {
        //     name: "coyote",
        //     description: "",
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 1,
        //     frequencyDefault: 1,
        //     allowed() { return true },
        //     requires: "",
        //     effect() { // good with melee builds, content skipping builds
        //         tech.coyoteTime = 120
        //         // simulation.gravity = function() {
        //         //     function addGravity(bodies, magnitude) {
        //         //         for (var i = 0; i < bodies.length; i++) {
        //         //             bodies[i].force.y += bodies[i].mass * magnitude;
        //         //         }
        //         //     }
        //         //     if (!m.isBodiesAsleep) {
        //         //         addGravity(powerUp, simulation.g);
        //         //         addGravity(body, simulation.g);
        //         //     }
        //         //     player.force.y += player.mass * simulation.g
        //         // }
        //     },
        //     remove() {
        //         tech.coyoteTime = 5
        //     }
        // },
        {
            name: "Newton's 1st law",
            description: "moving at high <strong>speeds</strong><br>reduces <strong class='color-harm'>harm</strong> by up to <strong>66%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isSpeedHarm = true //max at speed = 40
            },
            remove() {
                tech.isSpeedHarm = false
            }
        },
        {
            name: "Newton's 2nd law",
            description: "moving at high <strong>speeds</strong><br>increases <strong class='color-d'>damage</strong> by up to <strong>66%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isSpeedDamage = true //max at speed = 40
            },
            remove() {
                tech.isSpeedDamage = false
            }
        },
        {
            name: "kinetic bombardment",
            description: "increase <strong class='color-d'>damage</strong> by up to <strong>33%</strong> at a <strong>distance</strong><br>of up to 50 player widths from the target",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isFarAwayDmg = true; //used in mob.damage()
            },
            remove() {
                tech.isFarAwayDmg = false;
            }
        },
        {
            name: "regression",
            description: "bullet <strong>collisions</strong> increase <strong>vulnerability</strong> to<br><strong class='color-d'>damage</strong> by <strong>5%</strong> for mobs <em>(0.25% for bosses)</em>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isLessDamageReduction = true
            },
            remove() {
                tech.isLessDamageReduction = false
            }
        },
        {
            name: "microstates",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Microstate_(statistical_mechanics)' class="link">microstates</a>`,
            description: "increase <strong class='color-d'>damage</strong> by <strong>7%</strong><br>for every <strong>10</strong> active <strong>projectiles</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isDamageFromBulletCount = true
            },
            remove() {
                tech.isDamageFromBulletCount = false
            }
        },
        {
            name: "simulated annealing",
            description: "increase <strong class='color-d'>damage</strong> by <strong>20%</strong><br><strong>20%</strong> increased <strong><em>delay</em></strong> after firing",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            effect() {
                tech.slowFire = 1.2
                b.setFireCD();
            },
            remove() {
                tech.slowFire = 1;
                b.setFireCD();
            }
        },
        {
            name: "heuristics",
            description: "<strong>33%</strong> decreased <strong><em>delay</em></strong> after firing",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.fireRate *= 0.67
                b.setFireCD();
            },
            remove() {
                tech.fireRate = 1;
                b.setFireCD();
            }
        },

        {
            name: "fracture analysis",
            description: "bullet impacts do <strong>400%</strong> <strong class='color-d'>damage</strong><br>to <strong>stunned</strong> mobs",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isStunField || tech.oneSuperBall || tech.isCloakStun || tech.orbitBotCount > 1 || tech.isExplosionStun
            },
            requires: "a stun effect",
            effect() {
                tech.isCrit = true;
            },
            remove() {
                tech.isCrit = false;
            }
        },
        {
            name: "thermal runaway",
            description: "mobs <strong class='color-e'>explode</strong> when they <strong>die</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.sporesOnDeath && !tech.nailsDeathMob && !tech.botSpawner && !tech.isMobBlockFling && !tech.iceIXOnDeath
            },
            requires: "no other mob death tech",
            effect: () => {
                tech.isExplodeMob = true;
            },
            remove() {
                tech.isExplodeMob = false;
            }
        },
        {
            name: "shear stress",
            description: "mobs release a <strong>nail</strong> when they <strong>die</strong><br><em>nails target nearby mobs</em>",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.sporesOnDeath && !tech.isExplodeMob && !tech.botSpawner && !tech.isMobBlockFling && !tech.iceIXOnDeath
            },
            requires: "no other mob death tech",
            effect: () => {
                tech.nailsDeathMob++
            },
            remove() {
                tech.nailsDeathMob = 0;
            }
        },
        {
            name: "zoospore vector",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Disease_vector' class="link">zoospore vector</a>`,
            description: "mobs produce <strong class='color-p' style='letter-spacing: 2px;'>spores</strong> when they <strong>die</strong><br><strong>11%</strong> chance",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.nailsDeathMob && !tech.isExplodeMob && !tech.botSpawner && !tech.isMobBlockFling && !tech.iceIXOnDeath
            },
            requires: "no other mob death tech",
            effect() {
                tech.sporesOnDeath += 0.11;
                // if (tech.isSporeWorm) {
                //     for (let i = 0; i < 4; i++) b.worm(m.pos)
                // } else {
                //     for (let i = 0; i < 8; i++) b.spore(m.pos)
                // }
            },
            remove() {
                tech.sporesOnDeath = 0;
            }
        },
        {
            name: "reaction inhibitor",
            description: "mobs spawn with <strong>11%</strong> less <strong>health</strong>",
            maxCount: 3,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true //tech.nailsDeathMob || tech.sporesOnDeath || tech.isExplodeMob || tech.botSpawner || tech.isMobBlockFling || tech.iceIXOnDeath
            },
            requires: "", //"any mob death tech",
            effect: () => {
                tech.mobSpawnWithHealth *= 0.89

                //set all mobs at full health to 0.85
                for (let i = 0; i < mob.length; i++) {
                    if (mob.health > tech.mobSpawnWithHealth) mob.health = tech.mobSpawnWithHealth
                }
            },
            remove() {
                tech.mobSpawnWithHealth = 1;
            }
        },
        {
            name: "decorrelation",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>70%</strong> after not <strong>activating</strong><br>your <strong class='color-g'>gun</strong> or <strong class='color-f'>field</strong> for <strong>2</strong> seconds",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth //((m.fieldUpgrades[m.fieldMode].name === "standing wave" && (tech.blockingIce !== 0 || tech.blockDmg !== 0)) || b.totalBots() > 1 || tech.haveGunCheck("mine") || tech.haveGunCheck("spores") || m.fieldUpgrades[m.fieldMode].name === "molecular assembler") && 
            },
            requires: "not mass-energy",
            effect() {
                tech.isNoFireDefense = true
            },
            remove() {
                tech.isNoFireDefense = false
            }
        },
        {
            name: "anticorrelation",
            description: "increase <strong class='color-d'>damage</strong> by <strong>100%</strong><br>after not using your <strong class='color-g'>gun</strong> or <strong class='color-f'>field</strong> for <strong>2</strong> seconds",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isNoFireDamage = true
            },
            remove() {
                tech.isNoFireDamage = false
            }
        },
        {
            name: "scrap bots",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Scrap' class="link">scrap bots</a>`,
            description: "<strong>33%</strong> chance after killing a mob to build<br>a scrap <strong class='color-bot'>bot</strong> that operates for <strong>14</strong> seconds",
            maxCount: 3,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBotTech: true,
            allowed() {
                return !tech.sporesOnDeath && !tech.nailsDeathMob && !tech.isExplodeMob && !tech.isMobBlockFling && !tech.iceIXOnDeath
            },
            requires: "no other mob death tech",
            effect() {
                tech.botSpawner += 0.33;
            },
            remove() {
                tech.botSpawner = 0;
            }
        },
        {
            name: "scrap refit",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Scrap' class="link">scrap refit</a>`,
            description: "killing a mob resets your functional scrap <strong class='color-bot'>bots</strong><br>to <strong>14</strong> seconds of operation",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.botSpawner
            },
            requires: "scrap bots",
            effect() {
                tech.isBotSpawnerReset = true;
            },
            remove() {
                tech.isBotSpawnerReset = false;
            }
        },
        {
            name: "nail-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">nail-bot</a>`,
            description: "a <strong class='color-bot'>bot</strong> fires <strong>nails</strong> at mobs in line of sight",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            allowed() { return true },
            requires: "",
            effect() {
                tech.nailBotCount++;
                b.nailBot();
            },
            remove() {
                if (this.count) {
                    tech.nailBotCount -= this.count;
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "nail-bot upgrade",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">nail-bot upgrade</a>`,
            description: "<strong>convert</strong> your bots to <strong>nail-bots</strong><br><strong>+500%</strong> <strong>fire rate</strong> and <strong>+40%</strong> nail <strong>velocity</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.nailBotCount > 1 && !b.hasBotUpgrade()
            },
            requires: "2 or more nail bots and no other bot upgrade",
            effect() {
                tech.isNailBotUpgrade = true
                b.convertBotsTo("nail-bot")
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'nail') bullet[i].isUpgraded = true
                }
                tech.setBotTechFrequency()
                tech.setTechFrequency("nail-bot", 5)
            },
            remove() {
                if (this.count) {
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].botType === 'nail') bullet[i].isUpgraded = false
                    }
                    tech.setBotTechFrequency(1)
                }
                tech.isNailBotUpgrade = false
            }
        },
        {
            name: "foam-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">foam-bot</a>`,
            description: "a <strong class='color-bot'>bot</strong> fires <strong>foam</strong> at nearby mobs",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            allowed() { return true },
            requires: "",
            effect() {
                tech.foamBotCount++;
                b.foamBot();
            },
            remove() {
                if (this.count) {
                    tech.foamBotCount -= this.count;
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "foam-bot upgrade",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">foam-bot upgrade</a>`,
            description: "<strong>convert</strong> your bots to <strong>foam-bots</strong><br><strong>300%</strong> increased foam <strong>size</strong> and <strong>fire rate</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.foamBotCount > 1 && !b.hasBotUpgrade()
            },
            requires: "2 or more foam bots and no other bot upgrade",
            effect() {
                tech.isFoamBotUpgrade = true
                b.convertBotsTo("foam-bot")
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'foam') bullet[i].isUpgraded = true
                }
                tech.setBotTechFrequency()
                tech.setTechFrequency("foam-bot", 5)
            },
            remove() {
                if (this.count) {
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].botType === 'foam') bullet[i].isUpgraded = false
                    }
                    tech.setBotTechFrequency(1)
                }
                tech.isFoamBotUpgrade = false
            }
        },
        {
            name: "boom-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">boom-bot</a>`,
            description: "a <strong class='color-bot'>bot</strong> <strong>defends</strong> the space around you<br>ignites an <strong class='color-e'>explosion</strong> after hitting a mob",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            allowed() { return true },
            requires: "",
            effect() {
                tech.boomBotCount++;
                b.boomBot();
            },
            remove() {
                if (this.count) {
                    tech.boomBotCount -= this.count;
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "boom-bot upgrade",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">boom-bot upgrade</a>`,
            description: "<strong>convert</strong> your bots to <strong>boom-bots</strong><br><strong>300%</strong> increased <strong class='color-e'>explosion</strong> <strong class='color-d'>damage</strong> and size",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.boomBotCount > 1 && !b.hasBotUpgrade()
            },
            requires: "2 or more boom bots and no other bot upgrade",
            effect() {
                tech.isBoomBotUpgrade = true
                b.convertBotsTo("boom-bot")
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'boom') bullet[i].isUpgraded = true
                }
                tech.setBotTechFrequency()
                tech.setTechFrequency("boom-bot", 5)
            },
            remove() {
                if (this.count) {
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].botType === 'boom') bullet[i].isUpgraded = false
                    }
                    tech.setBotTechFrequency(1)
                }
                tech.isBoomBotUpgrade = false
            }
        },
        {
            name: "laser-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">laser-bot</a>`,
            description: "a <strong class='color-bot'>bot</strong> uses <strong class='color-f'>energy</strong> to emit a <strong class='color-laser'>laser</strong> beam<br>that targets nearby mobs",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            allowed() {
                return m.maxEnergy > 0.5
            },
            requires: "maximum energy above 50",
            effect() {
                tech.laserBotCount++;
                b.laserBot();
            },
            remove() {
                if (this.count) {
                    tech.laserBotCount -= this.count;
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "laser-bot upgrade",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">laser-bot upgrade</a>`,
            description: "<strong>convert</strong> your bots to <strong>laser-bots</strong><br><strong>100%</strong> improved <strong class='color-d'>damage</strong>, efficiency, and range", //  <strong>400%</strong> increased <strong>laser-bot</strong> <strong class='color-laser'>laser</strong> <strong class='color-d'>damage</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.laserBotCount > 1 && !b.hasBotUpgrade()
            },
            requires: "2 or more laser bots and no other bot upgrade",
            effect() {
                tech.isLaserBotUpgrade = true
                b.convertBotsTo("laser-bot")
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'laser') bullet[i].isUpgraded = true
                }
                tech.setBotTechFrequency()
                tech.setTechFrequency("laser-bot", 5)
            },
            remove() {
                if (this.count) {
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].botType === 'laser') bullet[i].isUpgraded = false
                    }
                    tech.setBotTechFrequency(1)
                }
                tech.isLaserBotUpgrade = false
            }
        },
        {
            name: "orbital-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">orbital-bot</a>`,
            description: "a <strong class='color-bot'>bot</strong> is locked in <strong>orbit</strong> around you<br><strong>stuns</strong> and <strong class='color-d'>damages</strong> mobs on <strong>contact</strong>",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            allowed() { return true },
            requires: "",
            effect() {
                b.orbitBot();
                tech.orbitBotCount++;
            },
            remove() {
                if (this.count) {
                    tech.orbitBotCount -= this.count;
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "orbital-bot upgrade",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">orbital-bot upgrade</a>`,
            description: "<strong>convert</strong> your bots to <strong>orbital-bots</strong><br>increase <strong class='color-d'>damage</strong> by <strong>300%</strong> and <strong>radius</strong> by <strong>50%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.orbitBotCount > 1 && !b.hasBotUpgrade()
            },
            requires: "2 or more orbital bots and no other bot upgrade",
            effect() {
                tech.isOrbitBotUpgrade = true
                b.convertBotsTo("orbital-bot")
                const range = 190 + 120 * tech.isOrbitBotUpgrade
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'orbit') {
                        bullet[i].isUpgraded = true
                        bullet[i].range = range
                        bullet[i].orbitalSpeed = Math.sqrt(0.25 / range)
                    }
                }
                tech.setBotTechFrequency()
                tech.setTechFrequency("orbital-bot", 5)
            },
            remove() {
                if (this.count) {
                    const range = 190 + 100 * tech.isOrbitBotUpgrade
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].botType === 'orbit') {
                            bullet[i].range = range
                            bullet[i].orbitalSpeed = Math.sqrt(0.25 / range)
                        }
                    }
                    tech.setBotTechFrequency(1)
                }
                tech.isOrbitBotUpgrade = false
            }
        },
        {
            name: "dynamo-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">dynamo-bot</a>`,
            description: "a <strong class='color-bot'>bot</strong> <strong class='color-d'>damages</strong> mobs while it <strong>traces</strong> your path<br>regen <strong>7</strong> <strong class='color-f'>energy</strong> per second when it's near",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            allowed() { return true },
            requires: "",
            effect() {
                tech.dynamoBotCount++;
                b.dynamoBot();
            },
            remove() {
                if (this.count) {
                    tech.dynamoBotCount -= this.count;
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "dynamo-bot upgrade",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">dynamo-bot upgrade</a>`,
            description: "<strong>convert</strong> your bots to <strong>dynamo-bots</strong><br>increase regen to <strong>23</strong> <strong class='color-f'>energy</strong> per second",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBotTech: true,
            allowed() {
                return tech.dynamoBotCount > 1 && !b.hasBotUpgrade()
            },
            requires: "2 or more dynamo bots and no other bot upgrade",
            effect() {
                tech.isDynamoBotUpgrade = true
                b.convertBotsTo("dynamo-bot")
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'dynamo') bullet[i].isUpgraded = true
                }
                tech.setBotTechFrequency()
                tech.setTechFrequency("dynamo-bot", 5)
            },
            remove() {
                if (this.count) {
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].botType === 'dynamo') bullet[i].isUpgraded = false
                    }
                    tech.setBotTechFrequency(1)
                }
                tech.isDynamoBotUpgrade = false
            }
        },
        {
            name: "bot fabrication",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">bot fabrication</a>`,
            descriptionFunction() {
                return `after you collect ${powerUps.orb.research(2 + Math.floor(0.1666 * b.totalBots()))}use them to build a<br>random <strong class='color-bot'>bot</strong> <em>(+1 cost every 6 bots)</em>`
            },
            // description: `if you collect ${powerUps.orb.research(2)}use them to build a<br>random <strong class='color-bot'>bot</strong> <em>(+1 cost every 5 bots)</em>`,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBotTech: true,
            allowed() {
                return powerUps.research.count > 1 || build.isExperimentSelection
            },
            requires: "at least 2 research",
            effect() {
                tech.isRerollBots = true;
                powerUps.research.changeRerolls(0)
                simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span> <span class='color-symbol'>=</span> 0`)
            },
            remove() {
                tech.isRerollBots = false;
                // this.description = `if you collect ${powerUps.orb.research(2 + Math.floor(0.2 * b.totalBots()))}use them to build a<br>random <strong class='color-bot'>bot</strong>  <em>(+1 cost every 5 bots)</em>`
            }
        },
        {
            name: "robotics",
            description: `spawn <strong>2</strong> random <strong>bots</strong><br><strong>quadruple</strong> the <strong class='flicker'>frequency</strong> of finding <strong>bot</strong> <strong class='color-m'>tech</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBotTech: true,
            allowed() {
                return b.totalBots() > 1 || build.isExperimentSelection
            },
            requires: "at least 2 bots",
            effect: () => {
                b.randomBot()
                b.randomBot()
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].isBotTech) tech.tech[i].frequency *= 4
                }
            },
            remove() {
                if (this.count > 0) {
                    b.removeBot()
                    b.removeBot()
                    b.clearPermanentBots();
                    b.respawnBots();
                    for (let i = 0, len = tech.tech.length; i < len; i++) {
                        if (tech.tech[i].isBotTech) tech.tech[i].frequency = Math.ceil(tech.tech[i].frequency / 4)
                    }
                }
            }
        },
        {
            name: "perimeter defense",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>7%</strong><br>for each of your permanent <strong class='color-bot'>bots</strong>",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBotTech: true,
            allowed() {
                return b.totalBots() > 1 && !tech.isEnergyHealth
            },
            requires: "at least 2 bots",
            effect() {
                tech.isBotArmor = true
            },
            remove() {
                tech.isBotArmor = false
            }
        },
        {
            name: "network effect",
            description: "increase <strong class='color-d'>damage</strong> by <strong>6%</strong><br>for each of your permanent <strong class='color-bot'>bots</strong>",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBotTech: true,
            allowed() {
                return b.totalBots() > 1
            },
            requires: "at least 2 bots",
            effect() {
                tech.isBotDamage = true
            },
            remove() {
                tech.isBotDamage = false
            }
        },
        {
            name: "ersatz bots",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Ersatz_good' class="link">ersatz bots</a>`,
            description: "<strong>double</strong> your current permanent <strong class='color-bot'>bots</strong><br>remove <strong>all</strong> <strong class='color-g'>guns</strong> in your inventory",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBotTech: true,
            // isNonRefundable: true,
            isBadRandomOption: true,
            numberOfGunsLost: 0,
            allowed() {
                return b.totalBots() > 3 && !build.isExperimentSelection
            },
            requires: "NOT EXPERIMENT MODE, at least 4 bots",
            effect() {
                this.numberOfGunsLost = b.inventory.length
                b.removeAllGuns();
                simulation.makeGunHUD();
                //double bots
                for (let i = 0; i < tech.nailBotCount; i++) b.nailBot();
                tech.nailBotCount *= 2
                for (let i = 0; i < tech.laserBotCount; i++) b.laserBot();
                tech.laserBotCount *= 2
                for (let i = 0; i < tech.foamBotCount; i++) b.foamBot();
                tech.foamBotCount *= 2
                for (let i = 0; i < tech.boomBotCount; i++) b.boomBot();
                tech.boomBotCount *= 2
                for (let i = 0; i < tech.orbitBotCount; i++) b.orbitBot();
                tech.orbitBotCount *= 2
                for (let i = 0; i < tech.dynamoBotCount; i++) b.dynamoBot();
                tech.dynamoBotCount *= 2
                for (let i = 0; i < tech.plasmaBotCount; i++) b.plasmaBot();
                tech.plasmaBotCount *= 2
                for (let i = 0; i < tech.missileBotCount; i++) b.missileBot();
                tech.missileBotCount *= 2
            },
            remove() {
                if (this.count) {
                    //return guns
                    for (let i = 0; i < this.numberOfGunsLost; i++) powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "gun");
                    this.numberOfGunsLost = 0;

                    //half all current guns
                    tech.nailBotCount = Math.round(tech.nailBotCount / 2)
                    tech.laserBotCount = Math.round(tech.laserBotCount / 2)
                    tech.foamBotCount = Math.round(tech.foamBotCount / 2)
                    tech.boomBotCount = Math.round(tech.boomBotCount / 2)
                    tech.orbitBotCount = Math.round(tech.orbitBotCount / 2)
                    tech.dynamoBotCount = Math.round(tech.dynamoBotCount / 2)
                    tech.plasmaBotCount = Math.round(tech.plasmaBotCount / 2)
                    tech.missileBotCount = Math.round(tech.missileBotCount / 2)
                    b.clearPermanentBots();
                    b.respawnBots();
                }
            }
        },
        {
            name: "mass driver",
            description: "increase <strong class='color-block'>block</strong> collision <strong class='color-d'>damage</strong> by <strong>300%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name !== "wormhole"
            },
            requires: "not wormhole",
            effect() {
                tech.blockDamage = 0.3
            },
            remove() {
                tech.blockDamage = 0.075
            }
        },
        {
            name: "inflation",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Inflation_(cosmology)' class="link">inflation</a>`,
            description: "<strong>throwing</strong> a <strong class='color-block'>block</strong> expands it by <strong>300%</strong><br><strong>holding</strong> a <strong class='color-block'>block</strong> reduces <strong class='color-harm'>harm</strong> by <strong>85%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.blockDamage > 0.075 && m.fieldUpgrades[m.fieldMode].name !== "pilot wave" && m.fieldUpgrades[m.fieldMode].name !== "wormhole" && !tech.isTokamak
            },
            requires: "mass driver, not pilot wave, tokamak, wormhole",
            effect() {
                tech.isAddBlockMass = true
            },
            remove() {
                tech.isAddBlockMass = false
            }
        },
        {
            name: "restitution",
            description: "<strong>throwing</strong> a <strong class='color-block'>block</strong> makes it very <strong>bouncy</strong><br>increase <strong class='color-block'>block</strong> collision <strong class='color-d'>damage</strong> by <strong>150%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.blockDamage > 0.075 && m.fieldUpgrades[m.fieldMode].name !== "pilot wave" && m.fieldUpgrades[m.fieldMode].name !== "wormhole" && !tech.isTokamak
            },
            requires: "mass driver, not pilot wave not tokamak, wormhole",
            effect() {
                tech.isBlockRestitution = true
            },
            remove() {
                tech.isBlockRestitution = false
            }
        },
        {
            name: "flywheel",
            description: "after a mob <strong>dies</strong> its <strong class='color-block'>block</strong> is <strong>flung</strong> at mobs<br>increase <strong class='color-block'>block</strong> collision <strong class='color-d'>damage</strong> by <strong>150%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.blockDamage > 0.075 && !tech.nailsDeathMob && !tech.sporesOnDeath && !tech.isExplodeMob && !tech.botSpawner && !tech.iceIXOnDeath
            },
            requires: "mass driver, no other mob death tech",
            effect() {
                tech.isMobBlockFling = true
            },
            remove() {
                tech.isMobBlockFling = false
            }
        },
        // {
        //     name: "fermions",
        //     description: "<strong class='color-block'>blocks</strong> thrown by you or <strong>pilot wave</strong> will<br><strong>collide</strong> with <strong>intangible</strong> mobs, but not you",
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return (tech.blockDamage > 0.075 || m.fieldUpgrades[m.fieldMode].name === "pilot wave") && !tech.isTokamak
        //     },
        //     requires: "mass driver or pilot wave, not tokamak",
        //     effect() {
        //         tech.isBlockBullets = true
        //     },
        //     remove() {
        //         tech.isBlockBullets = false
        //     }
        // },
        // {
        //     name: "inelastic collision",
        //     description: "<strong>holding</strong> a <strong class='color-block'>block</strong> reduces <strong class='color-harm'>harm</strong> by <strong>85%</strong><br>increase <strong class='color-block'>block</strong> collision <strong class='color-d'>damage</strong> by <strong>150%</strong>",
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 3,
        //     frequencyDefault: 3,
        //     allowed() {
        //         return tech.blockDamage > 0.075 && m.fieldUpgrades[m.fieldMode].name !== "pilot wave" && m.fieldUpgrades[m.fieldMode].name !== "wormhole" && !tech.isEnergyHealth
        //     },
        //     requires: "mass driver, a field that can hold things, not mass-energy",
        //     effect() {
        //         tech.isBlockHarm = true
        //     },
        //     remove() {
        //         tech.isBlockHarm = false
        //     }
        // },
        {
            name: "buckling",
            description: `if a <strong class='color-block'>block</strong> you threw kills a mob<br>spawn <strong>1</strong> ${powerUps.orb.heal()}, ${powerUps.orb.ammo()}, or ${powerUps.orb.research(1)}`,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.blockDamage > 0.075 && m.fieldUpgrades[m.fieldMode].name !== "pilot wave" && !tech.isTokamak
            },
            requires: "mass driver, not pilot wave, tokamak",
            effect() {
                tech.isBlockPowerUps = true
            },
            remove() {
                tech.isBlockPowerUps = false
            }
        },
        {
            name: "Pauli exclusion",
            description: `after receiving <strong class='color-harm'>harm</strong> from a <strong>collision</strong> become<br><strong>immune</strong> to <strong class='color-harm'>harm</strong> for <strong>2.5</strong> extra seconds`,
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.collisionImmuneCycles += 150;
                if (m.immuneCycle < m.cycle + tech.collisionImmuneCycles) m.immuneCycle = m.cycle + tech.collisionImmuneCycles; //player is immune to damage
            },
            remove() {
                tech.collisionImmuneCycles = 30;
            }
        },
        {
            name: "spin–statistics theorem",
            description: `become <strong>immune</strong> to <strong class='color-harm'>harm</strong> for <strong>1.75</strong> seconds<br>once every <strong>7</strong> seconds`,
            maxCount: 3,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true //tech.collisionImmuneCycles > 30
            },
            requires: "",
            effect() {
                tech.cyclicImmunity += 105;
            },
            remove() {
                tech.cyclicImmunity = 0;
            }
        },
        {
            name: "NOR gate",
            description: "if <strong>flip-flop</strong> is in the <strong class='color-flop'>OFF</strong> state<br>take <strong>0</strong> <strong class='color-harm'>harm</strong> from collisions with mobs",
            maxCount: 1,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            allowed() {
                return tech.isFlipFlop
            },
            requires: "flip-flop",
            effect() {
                tech.isFlipFlopHarm = true //do you have this tech
            },
            remove() {
                tech.isFlipFlopHarm = false
            }
        },
        {
            name: "shape-memory alloy",
            description: "if <strong>flip-flop</strong> is in the <strong class='color-flop'>ON</strong> state<br>increase your <strong>maximum</strong> <strong class='color-h'>health</strong> by <strong>200</strong>",
            maxCount: 1,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            allowed() {
                return tech.isFlipFlop && !tech.isEnergyHealth
            },
            requires: "flip-flop, not mass-energy equivalence",
            effect() {
                tech.isFlipFlopHealth = true;
                m.setMaxHealth();
            },
            remove() {
                tech.isFlipFlopHealth = false;
                m.setMaxHealth();
            }
        },
        {
            name: "flip-flop",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Flip-flop_(electronics)' class="link">flip-flop</a>`,
            description: `toggle <strong class="color-flop">ON</strong> and <strong class="color-flop">OFF</strong> after a <strong>collision</strong><br>unlock advanced <strong class='color-m'>tech</strong> that runs if <strong class="color-flop">ON</strong>`,
            nameInfo: "<span id = 'tech-flip-flop'></span>",
            addNameInfo() {
                setTimeout(function() {
                    if (document.getElementById("tech-flip-flop")) {
                        if (tech.isFlipFlopOn) {
                            document.getElementById("tech-flip-flop").innerHTML = ` = <strong>ON</strong>`
                            m.eyeFillColor = m.fieldMeterColor //'#5af'
                        } else {
                            document.getElementById("tech-flip-flop").innerHTML = ` = <strong>OFF</strong>`
                            m.eyeFillColor = "transparent"
                        }
                    }
                }, 100);
            },
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isRelay
            },
            requires: "not relay switch",
            effect() {
                tech.isFlipFlop = true //do you have this tech?
                tech.isFlipFlopOn = true //what is the state of flip-Flop?
                if (!m.isShipMode) {
                    m.draw = m.drawFlipFlop
                }
            },
            remove() {
                tech.isFlipFlop = false
                tech.isFlipFlopOn = false
                m.eyeFillColor = 'transparent'
            }
        },
        {
            name: "NAND gate",
            description: "if in the <strong class='color-flop'>ON</strong> state<br>do <strong>55.5%</strong> more <strong class='color-d'>damage</strong>",
            maxCount: 1,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            allowed() {
                return tech.isFlipFlop || tech.isRelay
            },
            requires: "ON/OFF tech",
            effect() {
                tech.isFlipFlopDamage = true;
            },
            remove() {
                tech.isFlipFlopDamage = false;
            }
        },
        {
            name: "transistor",
            description: "if <strong class='color-flop'>ON</strong> regen <strong>20</strong> <strong class='color-f'>energy</strong> per second<br>if <strong class='color-flop'>OFF</strong> drain <strong>1</strong> <strong class='color-f'>energy</strong> per second",
            maxCount: 1,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            allowed() {
                return tech.isFlipFlop || tech.isRelay
            },
            requires: "ON/OFF tech",
            effect() {
                tech.isFlipFlopEnergy = true;
            },
            remove() {
                tech.isFlipFlopEnergy = false;
            }
        },
        {
            name: "relay switch",
            description: `toggle <strong class="color-flop">ON</strong> and <strong class="color-flop">OFF</strong> after picking up a <strong>power up</strong><br>unlock advanced <strong class='color-m'>tech</strong> that runs if <strong class="color-flop">ON</strong>`,
            nameInfo: "<span id = 'tech-switch'></span>",
            addNameInfo() {
                setTimeout(function() {
                    if (document.getElementById("tech-switch")) {
                        if (tech.isFlipFlopOn) {
                            document.getElementById("tech-switch").innerHTML = ` = <strong>ON</strong>`
                            m.eyeFillColor = m.fieldMeterColor //'#5af'
                        } else {
                            document.getElementById("tech-switch").innerHTML = ` = <strong>OFF</strong>`
                            m.eyeFillColor = "transparent"
                        }
                    }
                }, 100);
            },
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isFlipFlop
            },
            requires: "not flip-flop",
            effect() {
                tech.isRelay = true //do you have this tech?
                tech.isFlipFlopOn = true //what is the state of flip-Flop?
                if (!m.isShipMode) {
                    m.draw = m.drawFlipFlop
                }
            },
            remove() {
                tech.isRelay = false
                tech.isFlipFlopOn = false
                m.eyeFillColor = 'transparent'
            }
        },
        {
            name: "lithium-ion",
            description: "if <strong>relay switch</strong> is in the <strong class='color-flop'>ON</strong> state<br>increase your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>300</strong>",
            maxCount: 1,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            allowed() {
                return tech.isRelay
            },
            requires: "relay switch",
            effect: () => {
                tech.isRelayEnergy = true
                m.setMaxEnergy()
            },
            remove() {
                tech.isRelayEnergy = false
                m.setMaxEnergy()
            }
        },
        // {
        //     name: "shift registers",
        //     description: "set to the <strong class='color-flop'>ON</strong> state<br>at the start of a <strong>level</strong>",
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 4,
        //     frequencyDefault: 4,
        //     allowed() {
        //         return tech.isFlipFlopEnergy || tech.isFlipFlopDamage || tech.isFlipFlopHarm || tech.relayIce
        //     },
        //     requires: "2 ON/OFF techs",
        //     effect() {
        //         tech.isFlipFlopLevelReset = true;
        //     },
        //     remove() {
        //         tech.isFlipFlopLevelReset = false;
        //     }
        // },

        {
            name: "thermocouple",
            description: "if  <strong>relay switch</strong> is in the <strong class='color-flop'>ON</strong> state<br>condense <strong>4-13</strong> <strong class='color-s'>ice IX</strong> crystals every second",
            maxCount: 9,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            allowed() {
                return tech.isRelay
            },
            requires: "relay switch",
            effect() {
                tech.relayIce++
            },
            remove() {
                tech.relayIce = 0
            }
        },
        {
            name: "crystallizer",
            description: "after <strong class='color-s'>frozen</strong> mobs <strong>die</strong> they<br>shatter into <strong class='color-s'>ice IX</strong> crystals",
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.isIceCrystals || tech.isSporeFreeze || tech.isIceField || tech.isIceShot || tech.relayIce || tech.isNeedleIce || tech.blockingIce > 1) && !tech.sporesOnDeath && !tech.isExplodeMob && !tech.botSpawner && !tech.isMobBlockFling && !tech.nailsDeathMob
            },
            requires: "a localized freeze effect, no other mob death tech",
            effect() {
                tech.iceIXOnDeath++
            },
            remove() {
                tech.iceIXOnDeath = 0
            }
        },
        {
            name: "thermoelectric effect",
            description: "<strong>killing</strong> mobs with <strong class='color-s'>ice IX</strong><br>generates <strong>100</strong> <strong class='color-f'>energy</strong>",
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isIceField || tech.relayIce || tech.isNeedleIce || tech.blockingIce || tech.iceIXOnDeath || tech.isIceShot
            },
            requires: "ice IX",
            effect() {
                tech.iceEnergy++
            },
            remove() {
                tech.iceEnergy = 0;
            }
        },
        {
            name: "superfluidity",
            description: "<strong class='color-s'>freeze</strong> effects are applied to a small area",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isIceCrystals || tech.isSporeFreeze || tech.isIceField || tech.relayIce || tech.isNeedleIce || tech.blockingIce > 1 || tech.iceIXOnDeath || tech.isIceShot
            },
            requires: "a localized freeze effect",
            effect() {
                tech.isAoESlow = true
            },
            remove() {
                tech.isAoESlow = false
            }
        },
        // {
        //     name: "osmoprotectant",
        //     description: `collisions with <strong>stunned</strong> or <strong class='color-s'>frozen</strong> mobs<br>cause you <strong>no</strong> <strong class='color-harm'>harm</strong>`,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.isStunField || tech.isExplosionStun || tech.isMineStun || tech.oneSuperBall || tech.isHarmFreeze || tech.isIceField || tech.relayIce || tech.isNeedleIce || tech.isIceCrystals || tech.isSporeFreeze || tech.isAoESlow || tech.isFreezeMobs || tech.isCloakStun || tech.orbitBotCount > 1 || tech.isWormholeDamage || tech.blockingIce > 1 || tech.iceIXOnDeath || tech.isIceShot
        //     },
        //     requires: "a freezing or stunning effect",
        //     effect() {
        //         tech.isFreezeHarmImmune = true;
        //     },
        //     remove() {
        //         tech.isFreezeHarmImmune = false;
        //     }
        // },
        {
            name: "liquid cooling",
            description: `<strong class='color-s'>freeze</strong> all mobs for <strong>7</strong> seconds<br>after receiving <strong class='color-harm'>harm</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isSlowFPS
            },
            requires: "clock gating",
            effect() {
                tech.isHarmFreeze = true;
            },
            remove() {
                tech.isHarmFreeze = false;
            }
        },
        {
            name: "clock gating",
            description: `<strong>slow</strong> <strong>time</strong> by <strong>50%</strong> after receiving <strong class='color-harm'>harm</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>20%</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return simulation.fpsCapDefault > 45
            },
            requires: "FPS above 45",
            effect() {
                tech.isSlowFPS = true;
            },
            remove() {
                tech.isSlowFPS = false;
            }
        },
        {
            name: "MACHO",
            description: "a massive but compact object slowly <strong>follows</strong> you<br>take <strong>66%</strong> less <strong class='color-harm'>harm</strong> inside it's <strong>halo</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect: () => {
                tech.isMACHO = true; //this harm reduction comes from the particle toggling  tech.isHarmMACHO
                spawn.MACHO()
            },
            remove() {
                tech.isMACHO = false;
                tech.isHarmMACHO = false;
                for (let i = 0, len = mob.length; i < len; i++) {
                    if (mob[i].isMACHO) mob[i].alive = false;
                }
            }
        },
        {
            name: "axion",
            description: "while inside the <strong>MACHO</strong> <strong>75%</strong> of your total<br><strong class='color-harm'>harm</strong> reduction is added to your <strong class='color-d'>damage</strong>",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isMACHO
            },
            requires: "MACHO",
            effect: () => {
                tech.isAxion = true
            },
            remove() {
                tech.isAxion = false
            }
        },
        {
            name: "ablative drones",
            description: "rebuild your broken parts as <strong>drones</strong><br>chance to occur after receiving <strong class='color-harm'>harm</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isDroneOnDamage = true;
                // for (let i = 0; i < 4; i++) b.drone()
            },
            remove() {
                tech.isDroneOnDamage = false;
            }
        },
        {
            name: "non-Newtonian armor",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Non-Newtonian_fluid' class="link">non-Newtonian armor</a>`,
            description: "for <strong>10 seconds</strong> after receiving <strong class='color-harm'>harm</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>66%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect() {
                tech.isHarmArmor = true;
            },
            remove() {
                tech.isHarmArmor = false;
            }
        },
        // {
        //     name: "radiative equilibrium",
        //     description: "for <strong>10 seconds</strong> after receiving <strong class='color-harm'>harm</strong><br>increase <strong class='color-d'>damage</strong> by <strong>200%</strong>",
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 1,
        //     frequencyDefault: 1,
        //     allowed() {
        //         return true
        //     },
        //     requires: "",
        //     effect() {
        //         tech.isHarmDamage = true;
        //     },
        //     remove() {
        //         tech.isHarmDamage = false;
        //     }
        // },
        {
            name: "CPT symmetry",
            description: "<strong>charge</strong>, <strong>parity</strong>, and <strong>time</strong> invert to undo <strong class='color-harm'>harm</strong><br><strong class='color-rewind'>rewind</strong> <strong>(1.5—5)</strong> seconds for <strong>(66—220)</strong> <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { //&& (m.fieldUpgrades[m.fieldMode].name !== "molecular assembler" || m.maxEnergy > 1)
                return m.maxEnergy > 0.99 && m.fieldUpgrades[m.fieldMode].name !== "standing wave" && !tech.isEnergyHealth && !tech.isRewindField //&& !tech.isRewindGun
            },
            requires: "not standing wave, mass-energy, max energy reduction",
            effect() {
                tech.isRewindAvoidDeath = true;
            },
            remove() {
                tech.isRewindAvoidDeath = false;
            }
        },
        {
            name: "causality bots",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Causality' class="link">causality bots</a>`,
            description: "when you <strong class='color-rewind'>rewind</strong>, build several <strong class='color-bot'>bots</strong><br>that protect you for about <strong>9</strong> seconds",
            maxCount: 3,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBotTech: true,
            allowed() {
                return tech.isRewindAvoidDeath || tech.isRewindField
            },
            requires: "CPT, retrocausality",
            effect() {
                tech.isRewindBot++;
            },
            remove() {
                tech.isRewindBot = 0;
            }
        },
        {
            name: "causality bombs",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Causality' class="link">causality bombs</a>`,
            description: "when you <strong class='color-rewind'>rewind</strong> drop several <strong>grenades</strong><br>become immune to <strong class='color-harm'>harm</strong> until they <strong class='color-e'>explode</strong>",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isRewindAvoidDeath || tech.isRewindField
            },
            requires: "CPT, retrocausality",
            effect() {
                tech.isRewindGrenade = true;
            },
            remove() {
                tech.isRewindGrenade = false;
            }
        },
        {
            name: "piezoelectricity",
            description: "<strong>colliding</strong> with mobs gives you <strong>2048</strong> <strong class='color-f'>energy</strong>", //<br>reduce <strong class='color-harm'>harm</strong> by <strong>15%</strong>
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect() {
                tech.isPiezo = true;
                // if (simulation.isTextLogOpen) m.energy += 20.48;
            },
            remove() {
                tech.isPiezo = false;
            }
        },
        {
            name: "mass-energy equivalence",
            description: "<strong class='color-f'>energy</strong> protects you instead of <strong class='color-h'>health</strong><br><strong class='color-harm'>harm</strong> <strong>reduction</strong> effects provide <strong>no</strong> benefit",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isZeno && !tech.isNoHeals && !tech.isPiezo && !tech.isRewindAvoidDeath && !tech.isTechDamage && !tech.isMutualism //&& !tech.isAmmoFromHealth && !tech.isRewindGun
            },
            requires: "not Zeno, ergodicity, piezoelectricity, CPT, antiscience, mutualism",
            effect: () => {
                m.health = 0
                document.getElementById("health").style.display = "none"
                document.getElementById("health-bg").style.display = "none"
                document.getElementById("dmg").style.backgroundColor = "#0cf";
                tech.isEnergyHealth = true;
                simulation.mobDmgColor = "rgba(14, 190, 235,0.7)" //"#0cf"
                m.displayHealth();
            },
            remove() {
                if (tech.isEnergyHealth) {
                    tech.isEnergyHealth = false;
                    document.getElementById("health").style.display = "inline"
                    document.getElementById("health-bg").style.display = "inline"
                    document.getElementById("dmg").style.backgroundColor = "#f67";
                    m.health = Math.max(Math.min(m.maxHealth, m.energy), 0.1);
                    simulation.mobDmgColor = "rgba(255,0,0,0.7)"
                    m.displayHealth();
                }
                tech.isEnergyHealth = false;
            }
        },
        {
            name: "1st ionization energy",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Ionization_energy' class="link">1st ionization energy</a>`,
            description: `each ${powerUps.orb.heal()} you collect<br>increases your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>8</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isEnergyHealth
            },
            requires: "mass-energy equivalence",
            effect() {
                tech.healGiveMaxEnergy = true; //tech.healMaxEnergyBonus given from heal power up
                powerUps.heal.color = "#0ae"
                for (let i = 0; i < powerUp.length; i++) { //find active heal power ups and adjust color live
                    if (powerUp[i].name === "heal") powerUp[i].color = powerUps.heal.color
                }
            },
            remove() {
                tech.healGiveMaxEnergy = false;
                // tech.healMaxEnergyBonus = 0
                powerUps.heal.color = "#0eb"
                for (let i = 0; i < powerUp.length; i++) { //find active heal power ups and adjust color live
                    if (powerUp[i].name === "heal") powerUp[i].color = powerUps.heal.color
                }
            }
        },
        {
            name: "weak interaction",
            description: "each unused <strong>power up</strong> at the end of a <strong>level</strong><br>adds 5 <strong>maximum</strong> <strong class='color-f'>energy</strong>", // <em>(up to 51 health per level)</em>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isDroneGrab
            },
            requires: "not delivery drone",
            effect() {
                tech.isExtraMaxEnergy = true; //tracked by  tech.extraMaxHealth
            },
            remove() {
                tech.isExtraMaxEnergy = false;
            }
        },
        {
            name: "electroweak interaction",
            description: "unused <strong>power ups</strong> at the end of each <strong>level</strong><br>are still activated <em>(selections are random)</em>",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isExtraMaxEnergy
            },
            requires: "weak interaction",
            effect() {
                tech.isEndLevelPowerUp = true;
            },
            remove() {
                tech.isEndLevelPowerUp = false;
            }
        },
        {
            name: "electronegativity",
            description: "increase <strong class='color-d'>damage</strong> by <strong>1%</strong><br>for every <strong>8</strong> stored <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect: () => {
                tech.isEnergyDamage = true
            },
            remove() {
                tech.isEnergyDamage = false;
            }
        },
        {
            name: "ground state",
            description: "increase your <strong>max</strong> <strong class='color-f'>energy</strong> by <strong>200</strong><br>reduce passive <strong class='color-f'>energy</strong> regen by <strong>66%</strong>",
            // description: "reduce <strong class='color-harm'>harm</strong> by <strong>66%</strong><br>you <strong>no longer</strong> passively regenerate <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isTimeCrystals
            },
            requires: "not time crystals",
            effect: () => {
                m.fieldRegen = 0.00033
                tech.isGroundState = true
                m.setMaxEnergy()
            },
            remove() {
                m.fieldRegen = 0.001;
                tech.isGroundState = false
                m.setMaxEnergy()
            }
        },
        {
            name: "heat engine",
            description: `increase <strong class='color-d'>damage</strong> by <strong>50%</strong>, but<br>reduce maximum <strong class='color-f'>energy</strong> by <strong>50</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isRewindAvoidDeath
            },
            requires: "not CPT",
            effect() {
                tech.isMaxEnergyTech = true;
                m.setMaxEnergy()
            },
            remove() {
                tech.isMaxEnergyTech = false;
                m.setMaxEnergy()
            }
        },
        {
            name: "exothermic process",
            description: "increase <strong class='color-d'>damage</strong> by <strong>50%</strong><br>if a mob <strong>dies</strong> drain <strong class='color-f'>energy</strong> by <strong>25%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isEnergyLoss = true;
            },
            remove() {
                tech.isEnergyLoss = false;
            }
        },
        {
            name: "Gibbs free energy",
            description: `increase <strong class='color-d'>damage</strong> by <strong>0.7%</strong><br>for each <strong class='color-f'>energy</strong> below <strong>100</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isLowEnergyDamage = true;
            },
            remove() {
                tech.isLowEnergyDamage = false;
            }
        },
        {
            name: "overcharge",
            description: "increase your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>60</strong><br><strong>+10%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.bonusEnergy += 0.6
                m.setMaxEnergy()
                this.refundAmount += tech.addJunkTechToPool(0.1)
            },
            refundAmount: 0,
            remove() {
                tech.bonusEnergy = 0;
                m.setMaxEnergy()
                if (this.count > 0 && this.refundAmount > 0) {
                    tech.removeJunkTechFromPool(this.refundAmount)
                    this.refundAmount = 0
                }
            }
        },
        {
            name: "Maxwell's demon",
            description: "<strong class='color-f'>energy</strong> above your max decays <strong>95%</strong> slower<br><strong>+10%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.energy > m.maxEnergy || build.isExperimentSelection
            },
            requires: "energy above your max",
            effect() {
                tech.overfillDrain = 0.92 //70% = 1-(1-0.75)/(1-0.15) //92% = 1-(1-0.75)/(1-0.87)
                this.refundAmount += tech.addJunkTechToPool(0.1)
            },
            refundAmount: 0,
            remove() {
                tech.overfillDrain = 0.7
                if (this.count > 0 && this.refundAmount > 0) {
                    tech.removeJunkTechFromPool(this.refundAmount)
                    this.refundAmount = 0
                }
            }
        },
        {
            name: "inductive coupling",
            description: "passive <strong class='color-f'>energy</strong> regen is increased by <strong>700%</strong><br>but you only regen when <strong>crouched</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isDamageAfterKillNoRegen
            },
            requires: "not parasitism",
            effect() {
                tech.isCrouchRegen = true; //only used to check for requirements
                m.regenEnergy = function() {
                    if (m.immuneCycle < m.cycle && m.crouch) m.energy += 7 * m.fieldRegen; //m.fieldRegen = 0.001
                    if (m.energy < 0) m.energy = 0
                }
            },
            remove() {
                tech.isCrouchRegen = false;
                m.regenEnergy = m.regenEnergyDefault
            }
        },
        {
            name: "energy conservation",
            description: "<strong>5%</strong> of <strong class='color-d'>damage</strong> done recovered as <strong class='color-f'>energy</strong>",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.energySiphon += 0.05;
            },
            remove() {
                tech.energySiphon = 0;
            }
        },
        {
            name: "waste heat recovery",
            description: "if a mob has <strong>died</strong> in the last <strong>5 seconds</strong><br>regen <strong>5%</strong> of max <strong class='color-f'>energy</strong> every second",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isEnergyRecovery = true;
            },
            remove() {
                tech.isEnergyRecovery = false;
            }
        },
        {
            name: "recycling",
            description: "if a mob has <strong>died</strong> in the last <strong>5 seconds</strong><br>regain <strong>1%</strong> of max <strong class='color-h'>health</strong> every second",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isHealTech: true,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isHealthRecovery = true;
            },
            remove() {
                tech.isHealthRecovery = false;
            }
        },
        {
            name: "parasitism",
            description: "<span style = 'font-size:91%;'>if a mob has <strong>died</strong> in the last <strong>5 seconds</strong> inhibit<br>passive <strong class='color-f'>energy</strong> regen and increase <strong class='color-d'>damage</strong> <strong>50%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isCrouchRegen
            },
            requires: "not inductive coupling",
            effect() {
                tech.isDamageAfterKillNoRegen = true;
                m.regenEnergy = function() {
                    if (m.immuneCycle < m.cycle && (m.lastKillCycle + 300 < m.cycle)) m.energy += m.fieldRegen; //m.fieldRegen = 0.001
                    if (m.energy < 0) m.energy = 0
                }
            },
            remove() {
                if (this.count) m.regenEnergy = m.regenEnergyDefault
                tech.isDamageAfterKillNoRegen = false;
            }
        },
        {
            name: "torpor",
            description: "if a mob has <strong>not died</strong> in the last <strong>5 seconds</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>66%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect() {
                tech.isHarmReduceNoKill = true;
            },
            remove() {
                tech.isHarmReduceNoKill = false;
            }
        },
        {
            name: "Zeno's paradox",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>85%</strong>, but every <strong>5</strong> seconds<br>remove <strong>7%</strong> of your current <strong class='color-h'>health</strong>",
            // description: "every <strong>5</strong> seconds remove <strong>1/10</strong> of your <strong class='color-h'>health</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>90%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return !tech.isEnergyHealth },
            requires: "not mass-energy",
            effect() {
                tech.isZeno = true;
            },
            remove() {
                tech.isZeno = false;
            }
        },
        {
            name: "negative feedback",
            description: "increase <strong class='color-d'>damage</strong> by <strong>5%</strong><br>for every <strong>10</strong> <strong class='color-h'>health</strong> below <strong>100</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return m.health < 0.6 || build.isExperimentSelection
            },
            requires: "health below 60",
            effect() {
                tech.isLowHealthDmg = true; //used in mob.damage()
            },
            remove() {
                tech.isLowHealthDmg = false;
            }
        },
        {
            name: "antiscience",
            description: "increase <strong class='color-d'>damage</strong> by <strong>90%</strong><br>lose <strong>11</strong> <strong class='color-h'>health</strong> when you pick up a <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect() {
                tech.isTechDamage = true;
            },
            remove() {
                tech.isTechDamage = false;
            }
        },
        {
            name: "enthalpy",
            description: "<strong class='color-h'>heal</strong> for <strong>2%</strong> of <strong class='color-d'>damage</strong> done<br>take <strong>10%</strong> more <strong class='color-harm'>harm</strong>",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isHealTech: true,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.healthDrain += 0.02;
            },
            remove() {
                tech.healthDrain = 0;
            }
        },
        {
            name: "fluoroantimonic acid",
            description: "increase <strong class='color-d'>damage</strong> by <strong>35%</strong><br>when your <strong class='color-h'>health</strong> is above <strong>100</strong>",
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.maxHealth > 1;
            },
            requires: "max health above 100",
            effect() {
                tech.isAcidDmg = true;
            },
            remove() {
                tech.isAcidDmg = false;
            }
        },
        {
            name: "tungsten carbide",
            description: "increase your <strong>maximum</strong> <strong class='color-h'>health</strong> by <strong>100</strong><br><strong>landings</strong> that force you to crouch cause <strong class='color-harm'>harm</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isFallingDamage = true;
                m.setMaxHealth();
                m.addHealth(1 / simulation.healScale)
            },
            remove() {
                tech.isFallingDamage = false;
                m.setMaxHealth();
            }
        },
        {
            name: "quenching",
            description: `over healing from ${powerUps.orb.heal()} does <strong class='color-harm'>harm</strong><br>but it also increase your <strong>maximum</strong> <strong class='color-h'>health</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isEnergyHealth && !tech.isNoHeals
            },
            requires: "not mass-energy equivalence, ergodicity",
            effect() {
                tech.isOverHeal = true;
            },
            remove() {
                tech.isOverHeal = false;
            }
        },
        {
            name: "negative entropy",
            description: `at the start of each <strong>level</strong><br>spawn ${powerUps.orb.heal()} for every <strong>26</strong> missing health`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isHealTech: true,
            allowed() {
                return m.health > 0.1 && !tech.isNoHeals
            },
            requires: "has some health, not ergodicity",
            effect() {
                tech.isHealLowHealth = true;
            },
            remove() {
                tech.isHealLowHealth = false;
            }
        },
        {
            name: "adiabatic healing",
            description: `${powerUps.orb.heal()} are <strong>100%</strong> more effective<br><strong>+5%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool`,
            maxCount: 3,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isHealTech: true,
            allowed() {
                return ((m.health / m.maxHealth) < 0.7 || build.isExperimentSelection) && !tech.isEnergyHealth && !tech.isNoHeals
            },
            requires: "under 70% health, not mass-energy equivalence, ergodicity",
            effect() {
                tech.largerHeals++;
                this.refundAmount += tech.addJunkTechToPool(0.05)
                //update current heals
                for (let i = 0; i < powerUp.length; i++) {
                    if (powerUp[i].name === "heal") powerUp[i].size = powerUps.heal.size()
                }
            },
            refundAmount: 0,
            remove() {
                tech.largerHeals = 1;
                if (this.count > 0 && this.refundAmount > 0) {
                    tech.removeJunkTechFromPool(this.refundAmount)
                    this.refundAmount = 0
                }
            }
        },
        {
            name: "maintenance",
            description: `</strong>double</strong> the <strong class='flicker'>frequency</strong> of finding <strong class='color-h'>healing</strong> <strong class='color-m'>tech</strong><br>spawn ${powerUps.orb.heal(13)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() { return true },
            requires: "NOT EXPERIMENT MODE",
            effect() {
                for (let i = 0; i < 13; i++) powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "heal");
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].isHealTech) tech.tech[i].frequency *= 2
                }
            },
            remove() {}
        },
        {
            name: "anthropic principle",
            nameInfo: "<span id = 'tech-anthropic'></span>",
            addNameInfo() {
                setTimeout(function() {
                    powerUps.research.changeRerolls(0)
                }, 1000);
            },
            description: `once per level, instead of <strong>dying</strong><br>use ${powerUps.orb.research(1)} and spawn ${powerUps.orb.heal(5)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isHealTech: true,
            allowed() {
                return powerUps.research.count > 0 || build.isExperimentSelection
            },
            requires: "at least 1 research",
            effect() {
                tech.isDeathAvoid = true;
                tech.isDeathAvoidedThisLevel = false;
                setTimeout(function() {
                    powerUps.research.changeRerolls(0)
                }, 1000);
            },
            remove() {
                tech.isDeathAvoid = false;
            }
        },
        {
            name: "weak anthropic principle",
            description: "after <strong>anthropic principle</strong> prevents your <strong>death</strong><br>add <strong>50%</strong> <strong class='color-dup'>duplication</strong> chance for that level",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.isDeathAvoid
            },
            requires: "anthropic principle",
            effect() {
                tech.isAnthropicTech = true
                powerUps.setDupChance(); //needed after adjusting duplication chance
            },
            remove() {
                tech.isAnthropicTech = false
                powerUps.setDupChance(); //needed after adjusting duplication chance
            }
        },
        {
            name: "strong anthropic principle",
            description: "after <strong>anthropic principle</strong> prevents your <strong>death</strong><br>increase <strong class='color-d'>damage</strong> by <strong>137.03599%</strong> for that level",
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.isDeathAvoid
            },
            requires: "anthropic principle",
            effect() {
                tech.isAnthropicDamage = true
            },
            remove() {
                tech.isAnthropicDamage = false
            }
        },
        {
            name: "quantum immortality",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>33%</strong><br>after <strong>dying</strong>, continue in an <strong class='alt'>alternate reality</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isImmortal = true;
            },
            remove() {
                tech.isImmortal = false;
            }
        },
        {
            name: "non-unitary operator",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Unitary_operator' class="link">non-unitary operator</a>`,
            description: "reduce combat <strong>difficulty</strong> by <strong>2 levels</strong>, but<br>after a <strong>collision</strong> enter an <strong class='alt'>alternate reality</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isResearchReality && !tech.isSwitchReality
            },
            requires: "not Ψ(t) collapse, many-worlds",
            effect() {
                tech.isCollisionRealitySwitch = true;
                level.difficultyDecrease(simulation.difficultyMode * 2)
            },
            remove() {
                tech.isCollisionRealitySwitch = false;
                if (this.count > 0) {
                    level.difficultyIncrease(simulation.difficultyMode * 2)
                }
            }
        },
        {
            name: "many-worlds",
            // description: "each <strong>level</strong> is an <strong class='alt'>alternate reality</strong>, where you<br>find a <strong class='color-m'>tech</strong> at the start of each level",
            description: `on each new <strong>level</strong> use ${powerUps.orb.research(1)} to enter an<br><strong class='alt'>alternate reality</strong> and spawn a <strong class='color-m'>tech</strong> power up`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isResearchReality && !tech.isCollisionRealitySwitch
            },
            requires: "not Ψ(t) collapse, non-unitary",
            effect() {
                tech.isSwitchReality = true;
            },
            remove() {
                tech.isSwitchReality = false;
            }
        },
        {
            name: "Ψ(t) collapse",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Wave_function_collapse' class="link">Ψ(t) collapse</a>`,
            description: `enter an <strong class='alt'>alternate reality</strong> after you <strong class='color-r'>research</strong><br>spawn ${powerUps.orb.research(21)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isSwitchReality && !tech.isCollisionRealitySwitch && !tech.isJunkResearch
            },
            requires: "not many-worlds, non-unitary, pseudoscience",
            effect() {
                tech.isResearchReality = true;
                for (let i = 0; i < 16; i++) powerUps.spawn(m.pos.x + Math.random() * 60, m.pos.y + Math.random() * 60, "research", false);
            },
            remove() {
                tech.isResearchReality = false;
            }
        },
        {
            name: "decoherence",
            description: `<strong class='color-r'>researched</strong> or <strong>canceled</strong> <strong class='color-m'>tech</strong> won't <strong>reoccur</strong> <br>spawn ${powerUps.orb.research(9)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "not superdeterminism",
            effect() {
                tech.isBanish = true
                for (let i = 0; i < 9; i++) powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), "research", false);
            },
            remove() {
                if (tech.isBanish) {
                    tech.isBanish = false
                    //reset banish list
                    for (let i = 0; i < tech.tech.length; i++) {
                        if (tech.tech[i].isBanished) tech.tech[i].isBanished = false
                    }
                    // powerUps.research.changeRerolls(-10)
                }
            }
        },
        {
            name: "renormalization",
            description: `using ${powerUps.orb.research(1)} for <strong>any</strong> purpose<br>has a <strong>40%</strong> chance to spawn ${powerUps.orb.research(1)}`,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (powerUps.research.count > 3 || build.isExperimentSelection) && !tech.isSuperDeterminism
            },
            requires: "at least 4 research and not superdeterminism",
            effect() {
                tech.renormalization = true;
            },
            remove() {
                tech.renormalization = false;
            }
        },
        {
            name: "perturbation theory",
            description: `<strong>66%</strong> decreased <strong><em>delay</em></strong> after firing<br>when you have no ${powerUps.orb.research(1)} in your inventory`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return powerUps.research.count === 0
            },
            requires: "no research",
            effect() {
                tech.isRerollHaste = true;
                tech.researchHaste = 0.33;
                b.setFireCD();
            },
            remove() {
                tech.isRerollHaste = false;
                tech.researchHaste = 1;
                b.setFireCD();
            }
        },
        {
            name: "ansatz",
            description: `after choosing a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>spawn ${powerUps.orb.research(2)}if you have no ${powerUps.orb.research(1)} in your inventory`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return powerUps.research.count === 0 && !tech.isSuperDeterminism && !tech.isRerollHaste && !tech.isResearchReality
            },
            requires: "no research, not superdeterminism, Ψ(t) collapse, perturbation theory",
            effect: () => {
                tech.isAnsatz = true;
            },
            remove() {
                tech.isAnsatz = false;
            }
        },
        {
            name: "Bayesian statistics",
            description: `increase <strong class='color-d'>damage</strong> by <strong>3.8%</strong><br>for each ${powerUps.orb.research(1)} in your inventory`,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return powerUps.research.count > 5 || build.isExperimentSelection
            },
            requires: "at least 6 research",
            effect() {
                tech.isRerollDamage = true;
            },
            remove() {
                tech.isRerollDamage = false;
            }
        },
        {
            name: "pseudoscience",
            description: "<span style = 'font-size:94%;'>when <strong>selecting</strong> a power up, <strong class='color-r'>research</strong> <strong>3</strong> times</span><br>for <strong>free</strong>, but add <strong>0-3%</strong> <strong class='color-j'>JUNK</strong> to the <strong class='color-m'>tech</strong> pool",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isResearchReality //tech.isResearchBoss || tech.isMetaAnalysis || tech.isRerollBots || tech.isDeathAvoid || tech.isRerollDamage || build.isExperimentSelection
            },
            requires: "not Ψ(t) collapse", //"abiogenesis, meta-analysis, bot fabrication, anthropic principle, or Bayesian statistics, not Ψ(t) collapse",
            effect() {
                tech.isJunkResearch = true;
            },
            remove() {
                tech.isJunkResearch = false;
            }
        },
        {
            name: "brainstorming",
            description: "<strong class='color-m'>tech</strong> choices <strong>randomize</strong><br>every <strong>2</strong> seconds for <strong>10</strong> seconds",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isBrainstorm = true
                tech.isBrainstormActive = false
                tech.brainStormDelay = 120
            },
            remove() {
                tech.isBrainstorm = false
                tech.isBrainstormActive = false
            }
        },
        {
            name: "cross disciplinary",
            description: "<strong class='color-m'>tech</strong> have an extra <strong class='color-f'>field</strong> or <strong class='color-g'>gun</strong> <strong>choice</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isDeterminism
            },
            requires: "not determinism",
            effect: () => {
                tech.isExtraGunField = true;
                // for (let i = 0; i < 2; i++) powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), "research", false);

            },
            remove() {
                tech.isExtraGunField = false;
                // if (this.count > 0) powerUps.research.changeRerolls(-2)
            }
        },
        {
            name: "emergence",
            description: "<strong class='color-m'>tech</strong>, <strong class='color-f'>fields</strong>, and <strong class='color-g'>guns</strong> have <strong>5</strong> <strong>choices</strong><br><strong>+5%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isDeterminism
            },
            requires: "not determinism",
            effect: () => {
                tech.isExtraChoice = true;
                this.refundAmount += tech.addJunkTechToPool(0.05)
            },
            refundAmount: 0,
            remove() {
                tech.isExtraChoice = false;
                if (this.count > 0 && this.refundAmount > 0) {
                    tech.removeJunkTechFromPool(this.refundAmount)
                    this.refundAmount = 0
                }
            }
        },
        {
            name: "determinism",
            description: "spawn <strong>5</strong> <strong class='color-m'>tech</strong>, but you have only<br> <strong>1 choice</strong> for <strong class='color-m'>tech</strong>, <strong class='color-f'>fields</strong>, and <strong class='color-g'>guns</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBadRandomOption: true,
            isNonRefundable: true,
            allowed() {
                return !tech.isExtraChoice && !tech.isExtraGunField
            },
            requires: "NOT EXPERIMENT MODE, not emergence, cross disciplinary",
            effect: () => {
                tech.isDeterminism = true;
                //if you change the number spawned also change it in Born rule
                for (let i = 0; i < 5; i++) powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "tech");
            },
            remove() {
                tech.isDeterminism = false;
                // if (this.count > 0) {
                //     for (let i = 0; i < 5; i++) {
                //         const numberRemoved = tech.removeTech()
                //         console.log(numberRemoved)
                //         if (numberRemoved === 0) { //if the player didn't remove a power up then remove 1 tech for the map
                //             for (let j = powerUp.length - 1; j > -1; j--) {
                //                 if (powerUp[j].name === "tech") {
                //                     Matter.Composite.remove(engine.world, powerUp[j]);
                //                     powerUp.splice(j, 1);
                //                     break;
                //                 }
                //             }
                //         }
                //     }
                // }
            }
        },
        {
            name: "superdeterminism",
            description: `spawn <strong>5</strong> <strong class='color-m'>tech</strong>, but you have <strong>no cancel</strong><br>and ${powerUps.orb.research(1)}, no longer <strong>spawn</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 4,
            frequencyDefault: 4,
            isBadRandomOption: true,
            isNonRefundable: true,
            allowed() {
                return tech.isDeterminism && !tech.isAnsatz
            },
            requires: "NOT EXPERIMENT MODE, determinism, not ansatz",
            effect: () => {
                tech.isSuperDeterminism = true;
                //if you change the number spawned also change it in Born rule
                for (let i = 0; i < 5; i++) powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "tech");
            },
            remove() {
                tech.isSuperDeterminism = false;
                // tech.isSuperDeterminism = false;
                // if (this.count) {
                //     for (let i = 0; i < 5; i++) tech.removeTech()
                // }
            }
        },
        {
            name: "unified field theory",
            description: `spawn ${powerUps.orb.research(6)}and when <strong>paused</strong><br><strong>clicking</strong> the <strong class='color-f'>field</strong> box switches your <strong class='color-f'>field</strong>`,
            // description: `in the <strong>pause</strong> menu, change your <strong class='color-f'>field</strong><br>by <strong>clicking</strong> on your <strong class='color-f'>field's</strong> box`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return true
            },
            requires: "not superdeterminism",
            effect() {
                tech.isPauseSwitchField = true;
                for (let i = 0; i < 6; i++) powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), "research", false);
            },
            remove() {
                if (tech.isPauseSwitchField) {
                    tech.isPauseSwitchField = false;
                    powerUps.research.changeRerolls(-6)
                }
            }
        },
        {
            name: "paradigm shift",
            description: `<strong>clicking</strong> <strong class='color-m'>tech</strong> while paused <strong>ejects</strong> them<br><strong>10%</strong> chance to convert that tech into ${powerUps.orb.research(1)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isPauseEjectTech = true;
            },
            remove() {
                tech.isPauseEjectTech = false;
            }
        },
        {
            name: "technical debt", // overengineering
            // description: `increase <strong class='color-d'>damage</strong> by <strong>300%</strong> minus <strong>10%</strong> for <strong class='color-m'>tech</strong> you have learned(${4 - 0.1 * tech.totalCount})`,
            // description: `increase <strong class='color-d'>damage</strong> by <strong>300%</strong>, but reduce <strong class='color-d'>damage</strong><br>by <strong>10%</strong> for <strong class='color-m'>tech</strong> you have learned`,
            descriptionFunction() {
                // return `increase <strong class='color-d'>damage</strong> by <strong>300%</strong> minus <strong>15%</strong><br>for each <strong class='color-m'>tech</strong> you have learned <em>(${Math.floor(100*(4 - 0.14 * tech.totalCount))-100}%)</em>`
                return `increase <strong class='color-d'>damage</strong> by <strong>300%</strong> minus <strong>15%</strong><br>for each <strong class='color-m'>tech</strong> you have learned <em>(${Math.floor(100*(Math.max(41 / (tech.totalCount + 21), 4 - 0.15 * tech.totalCount) ))-100}%)</em>`
            },
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isTechDebt = true;
            },
            remove() {
                tech.isTechDebt = false;
            }
        },
        {
            name: "abiogenesis",
            description: `at the start of a level spawn a 2nd <strong>boss</strong><br>use ${powerUps.orb.research(4)}or add <strong>49%</strong> <strong class='color-j'>JUNK</strong> to the <strong class='color-m'>tech</strong> pool`,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (build.isExperimentSelection || powerUps.research.count > 3) && !tech.isDuplicateBoss
            },
            requires: "at least 4 research and not parthenogenesis",
            effect() {
                tech.isResearchBoss = true; //abiogenesis
            },
            remove() {
                tech.isResearchBoss = false;
            }
        },
        {
            name: "meta-analysis",
            description: `if you choose a <strong class='color-j'>JUNK</strong> <strong class='color-m'>tech</strong> you instead get a<br>random normal <strong class='color-m'>tech</strong> and ${powerUps.orb.research(3)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isMetaAnalysis = true
            },
            remove() {
                tech.isMetaAnalysis = false
            }
        },
        {
            name: "dark patterns",
            description: "reduce combat <strong>difficulty</strong> by <strong>1 level</strong><br><strong>+31%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return level.onLevel < 8 && level.onLevel > 0
            },
            requires: "on levels 1 through 7",
            effect() {
                level.difficultyDecrease(simulation.difficultyMode)
                // simulation.difficulty<span class='color-symbol'>-=</span>
                simulation.makeTextLog(`level.difficultyDecrease(simulation.difficultyMode)`)
                this.refundAmount += tech.addJunkTechToPool(0.31)
                // for (let i = 0; i < tech.junk.length; i++) tech.tech.push(tech.junk[i])
            },
            refundAmount: 0,
            remove() {
                if (this.count > 0) {
                    if (this.refundAmount > 0) tech.removeJunkTechFromPool(this.refundAmount)
                    level.difficultyIncrease(simulation.difficultyMode)
                }
            }
        },
        {
            name: "ergodicity",
            description: `reduce combat <strong>difficulty</strong> by <strong>2 levels</strong><br>${powerUps.orb.heal()} have <strong>no</strong> effect`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return level.onLevel > 1 && !tech.isEnergyHealth
            },
            requires: "past levels 1, not mass-energy",
            effect() {
                tech.isNoHeals = true;
                level.difficultyDecrease(simulation.difficultyMode * 2)
                simulation.makeTextLog(`level.difficultyDecrease(simulation.difficultyMode <span class='color-symbol'>*</span> 2)`)
                powerUps.heal.color = "#abb"
                for (let i = 0; i < powerUp.length; i++) { //find active heal power ups and adjust color live
                    if (powerUp[i].name === "heal") powerUp[i].color = powerUps.heal.color
                }
            },
            remove() {
                if (tech.isNoHeals) {
                    powerUps.heal.color = "#0eb"
                    for (let i = 0; i < powerUp.length; i++) { //find active heal power ups and adjust color live
                        if (powerUp[i].name === "heal") powerUp[i].color = powerUps.heal.color
                    }
                }
                tech.isNoHeals = false;
                if (this.count > 0) level.difficultyIncrease(simulation.difficultyMode * 2)
            }
        },
        {
            name: "bubble fusion",
            description: `after destroying a mob's natural <strong>shield</strong><br>spawn <strong>1-2</strong> ${powerUps.orb.heal()}, ${powerUps.orb.ammo()}, or ${powerUps.orb.research(1)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() { return true },
            requires: "",
            effect() {
                tech.isShieldAmmo = true;
            },
            remove() {
                tech.isShieldAmmo = false;
            }
        },
        {
            name: "commodities exchange",
            description: `clicking <strong style = 'font-size:150%;'>×</strong> to cancel a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>spawns <strong>5-10</strong> ${powerUps.orb.heal()}, ${powerUps.orb.ammo()}, or ${powerUps.orb.research(1)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "not superdeterminism",
            effect() {
                tech.isCancelRerolls = true
            },
            remove() {
                tech.isCancelRerolls = false
            }
        },
        {
            name: "futures exchange",
            description: "clicking <strong style = 'font-size:150%;'>×</strong> to <strong>cancel</strong> a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>adds <strong>4.3%</strong> power up <strong class='color-dup'>duplication</strong> chance",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.duplicationChance() < 1 && !tech.isSuperDeterminism
            },
            requires: "below 100% duplication chance, not superdeterminism",
            effect() {
                tech.isCancelDuplication = true //search for tech.cancelCount  to balance
                powerUps.setDupChance(); //needed after adjusting duplication chance
            },
            remove() {
                tech.isCancelDuplication = false
                powerUps.setDupChance(); //needed after adjusting duplication chance
            }
        },
        {
            name: "replication",
            description: "<strong>10%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong><br><strong>+30%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.duplicationChance() < 1
            },
            requires: "below 100% duplication chance",
            effect() {
                tech.duplicateChance += 0.1
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (!build.isExperimentSelection && !simulation.isTextLogOpen) simulation.circleFlare(0.1);
                this.refundAmount += tech.addJunkTechToPool(0.3)
            },
            refundAmount: 0,
            remove() {
                tech.duplicateChance = 0
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (this.count > 0 && this.refundAmount > 0) {
                    tech.removeJunkTechFromPool(this.refundAmount)
                    this.refundAmount = 0
                }
            }
        },
        {
            name: "stimulated emission",
            description: "<strong>15%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong><br>but, after a <strong>collision</strong> eject <strong>1</strong> <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.duplicationChance() < 1
            },
            requires: "below 100% duplication chance",
            effect: () => {
                tech.isStimulatedEmission = true
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (!build.isExperimentSelection && !simulation.isTextLogOpen) simulation.circleFlare(0.15);
            },
            remove() {
                tech.isStimulatedEmission = false
                powerUps.setDupChance(); //needed after adjusting duplication chance
            }
        },
        {
            name: "metastability",
            description: "<strong>12%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong><br><strong class='color-dup'>duplicates</strong> <strong class='color-e'>explode</strong> with a <strong>3</strong> second <strong>half-life</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.duplicationChance() < 1
            },
            requires: "below 100% duplication chance",
            effect: () => {
                tech.isPowerUpsVanish = true
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (!build.isExperimentSelection && !simulation.isTextLogOpen) simulation.circleFlare(0.12);
            },
            remove() {
                tech.isPowerUpsVanish = false
                powerUps.setDupChance(); //needed after adjusting duplication chance
            }
        },
        {
            name: "correlated damage",
            description: "your chance to <strong class='color-dup'>duplicate</strong> power ups<br>increases your <strong class='color-d'>damage</strong> by the same percent",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.duplicationChance() > 0.15
            },
            requires: "duplication chance > 15%",
            effect() {
                tech.isDupDamage = true;
            },
            remove() {
                tech.isDupDamage = false;
            }
        },
        {
            name: "parthenogenesis",
            description: "<span style = 'font-size:90%;'> <strong>bosses</strong> have a <strong>2x</strong> chance to be <strong class='color-dup'>duplicated</strong>, but their<br><strong>health</strong> is increased by your <strong class='color-dup'>duplication</strong> chance</span>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.duplicationChance() > 0 && !tech.isResearchBoss
            },
            requires: "some duplication chance, not abiogenesis",
            effect() {
                tech.isDuplicateBoss = true;
            },
            remove() {
                tech.isDuplicateBoss = false;
            }
        },
        {
            name: "apomixis",
            description: `when you reach <strong>111%</strong> <strong class='color-dup'>duplication</strong><br>spawn <strong>11 bosses</strong> with <strong>111%</strong> more <strong>health</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 10,
            frequencyDefault: 10,
            isNonRefundable: true,
            allowed() {
                return tech.duplicationChance() > 0.6
            },
            requires: "duplication chance above 70%",
            effect() {
                tech.is111Duplicate = true;
                tech.maxDuplicationEvent()
            },
            remove() {
                tech.is111Duplicate = false;
            }
        },
        {
            name: "Born rule",
            description: "<strong>remove</strong> all current <strong class='color-m'>tech</strong><br>spawn new <strong class='color-m'>tech</strong> to replace them",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() {
                return (tech.totalCount > 6)
            },
            requires: "NOT EXPERIMENT MODE, more than 6 tech",
            effect: () => {
                //remove active bullets  //to get rid of bots
                for (let i = 0; i < bullet.length; ++i) Matter.Composite.remove(engine.world, bullet[i]);
                bullet = [];
                let count = 1 //count tech
                for (let i = 0, len = tech.tech.length; i < len; i++) { // spawn new tech power ups
                    if (!tech.tech[i].isNonRefundable) count += tech.tech[i].count
                }
                if (tech.isDeterminism) count -= 4 //remove the bonus tech 
                if (tech.isSuperDeterminism) count -= 4 //remove the bonus tech 

                tech.setupAllTech(); // remove all tech
                if (simulation.isCheating) tech.setCheating();
                lore.techCount = 0;
                // tech.addLoreTechToPool();
                for (let i = 0; i < count; i++) powerUps.spawn(m.pos.x + 100 * (Math.random() - 0.5), m.pos.y + 100 * (Math.random() - 0.5), "tech"); // spawn new tech power ups
                //have state is checked in m.death()
            },
            remove() {}
        },
        {
            name: "Occam's razor",
            // descriptionFunction() {
            //     return `randomly remove <strong>${this.removePercent * 100}%</strong> of your <strong class='color-m'>tech</strong><br>for each removed gain <strong>${this.damagePerRemoved * 100}%</strong> <strong class='color-d'>damage</strong>`
            // },
            descriptionFunction() {
                return `randomly remove <strong>half</strong> your <strong class='color-m'>tech</strong><br>for each removed gain <strong>${this.damagePerRemoved * 100}%</strong> <strong class='color-d'>damage</strong> <em>(~${this.damagePerRemoved * 50 * tech.totalCount}%)</em>`
            },
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() {
                return (tech.totalCount > 6)
            },
            requires: "NOT EXPERIMENT MODE, more than 6 tech",
            removePercent: 0.5,
            damagePerRemoved: 0.5,
            effect() {
                let pool = []
                for (let i = 0, len = tech.tech.length; i < len; i++) { // spawn new tech power ups
                    if (tech.tech[i].count && !tech.tech[i].isNonRefundable && !tech.tech[i].isFromAppliedScience) pool.push(i)
                }
                pool = shuffle(pool); //shuffles order of maps
                let removeCount = 0
                for (let i = 0, len = pool.length * this.removePercent; i < len; i++) removeCount += tech.removeTech(pool[i])
                tech.OccamDamage = 1 + this.damagePerRemoved * removeCount
                // tech.OccamDamage = Math.pow(1.25, removeCount)
            },
            remove() {
                tech.OccamDamage = 0;
            }
        },
        {
            name: "exchange symmetry",
            description: "remove <strong>1</strong> random <strong class='color-m'>tech</strong><br>spawn <strong>2</strong> new <strong class='color-g'>guns</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() {
                return (tech.totalCount > 3) && !tech.isSuperDeterminism
            },
            requires: "NOT EXPERIMENT MODE, at least 4 tech, not superdeterminism",
            effect: () => {
                const have = [] //find which tech you have
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].count > 0 && !tech.tech[i].isNonRefundable) have.push(i)
                }
                const choose = have[Math.floor(Math.random() * have.length)]
                simulation.makeTextLog(`<span class='color-var'>tech</span>.removeTech("<span class='color-text'>${tech.tech[choose].name}</span>")`)
                for (let i = 0; i < tech.tech[choose].count; i++) {
                    powerUps.spawn(m.pos.x, m.pos.y, "gun");
                }
                powerUps.spawn(m.pos.x, m.pos.y, "gun");
                // powerUps.spawn(m.pos.x, m.pos.y, "gun");
                tech.tech[choose].count = 0;
                tech.tech[choose].remove(); // remove a random tech form the list of tech you have
                tech.tech[choose].isLost = true
                simulation.updateTechHUD();
            },
            remove() {}
        },
        {
            name: "monte carlo experiment",
            description: "remove <strong>1</strong> random <strong class='color-m'>tech</strong><br>spawn <strong>2</strong> <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() {
                return (tech.totalCount > 3) && tech.duplicationChance() > 0 && !tech.isSuperDeterminism
            },
            requires: "NOT EXPERIMENT MODE, some duplication, at least 4 tech, not superdeterminism",
            effect: () => {
                const removeTotal = tech.removeTech()
                for (let i = 0; i < removeTotal + 1; i++) powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "tech");
            },
            remove() {}
        },
        {
            name: "strange attractor",
            description: `use ${powerUps.orb.research(2)} to spawn <strong>1</strong> <strong class='color-m'>tech</strong><br>with <strong>double</strong> your <strong class='color-dup'>duplication</strong> chance`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() {
                return !tech.isSuperDeterminism && tech.duplicationChance() > 0 && powerUps.research.count > 1
            },
            requires: "NOT EXPERIMENT MODE, some duplication, not super determinism",
            effect: () => {
                powerUps.research.changeRerolls(-2)
                simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span> <span class='color-symbol'>-=</span> 2<br>${powerUps.research.count}`)
                powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
                if (Math.random() < tech.duplicationChance() * 2) powerUps.directSpawn(m.pos.x + 10, m.pos.y + 5, "tech");
            },
            remove() {}
        },
        {
            name: "tensor field",
            description: `<strong>triple</strong> the <strong class='flicker'>frequency</strong> of finding <strong class='color-f'>field</strong> <strong class='color-m'>tech</strong><br>spawn a <strong class='color-f'>field</strong> and  ${powerUps.orb.research(7)}`,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isNonRefundable: true,
            isBadRandomOption: true,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "NOT EXPERIMENT MODE, not superdeterminism",
            effect() {
                powerUps.spawn(m.pos.x, m.pos.y, "field");
                for (let i = 0; i < 7; i++) powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), "research", false);
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].isFieldTech) tech.tech[i].frequency *= 3
                }
            },
            remove() {
                // powerUps.research.changeRerolls(-6)
                // if (this.count > 1) {
                //     for (let i = 0, len = tech.tech.length; i < len; i++) {
                //         if (tech.tech[i].isFieldTech) tech.tech[i].frequency /= 3
                //     }
                // }
            }
        },
        {
            name: "reinforcement learning",
            description: "increase the <strong class='flicker'>frequency</strong> of finding copies of<br>your current recursive <strong class='color-m'>tech</strong> by <strong>1000%</strong>",
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.totalCount > 9
            },
            requires: "at least 10 tech",
            effect: () => {
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].count > 0) tech.tech[i].frequency *= 10
                }
            },
            remove() {
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].count > 0 && tech.tech[i].frequency > 1) tech.tech[i].frequency /= 10
                }
            }
        },
        // {
        //     name: "backward induction",
        //     descriptionFunction() {
        //         if (build.isExperimentSelection || powerUps.tech.choiceLog.length < 10) return `use ${powerUps.orb.research(2)} to <strong>choose</strong> all the unchosen <strong class='color-m'>tech</strong><br>from your last selection`

        //         text = ``
        //         let num = 3
        //         if (tech.isExtraChoice) num = 5
        //         if (tech.isDeterminism) num = 1
        //         for (let i = 0; i < num; i++) {
        //             const index = powerUps.tech.choiceLog[powerUps.tech.choiceLog.length - i - 1]
        //             if (index !== powerUps.lastTechIndex && tech.tech[index].count < tech.tech[index].maxCount && tech.tech[index].allowed() && tech.tech[index].name !== "backward induction") {
        //                 text += `${tech.tech[index].name}, `
        //             }
        //         }
        //         text = text.slice(0, -2);
        //         return `use ${powerUps.orb.research(2)}to <strong>choose</strong> the unchosen<br><strong class='color-m'>tech</strong> from your previous selection:<br><em style = 'font-size:${num===5 ? 70 : 85}%;'>${text}</em>`
        //     },
        //     // description: `use ${powerUps.orb.research(2)}to <strong>choose</strong> all the unchosen<br> <strong class='color-m'>tech</strong> from your previous <strong class='color-m'>tech</strong> selection`,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 100,
        //     frequencyDefault: 100,
        //     isNonRefundable: true,
        //     isBadRandomOption: true,
        //     allowed() {
        //         return powerUps.tech.choiceLog.length > 10 && !tech.isDeterminism && powerUps.research.count > 1
        //     },
        //     requires: "NOT EXPERIMENT MODE, rejected an option in the last tech selection, at least 2 research, not determinism",
        //     effect: () => {
        //         powerUps.research.changeRerolls(-2)
        //         let num = 3
        //         if (tech.isExtraChoice) num = 5
        //         if (tech.isDeterminism) num = 1
        //         for (let i = 0; i < num; i++) {
        //             const index = powerUps.tech.choiceLog[powerUps.tech.choiceLog.length - i - 1]
        //             if (index !== powerUps.lastTechIndex && tech.tech[index].count < tech.tech[index].maxCount && tech.tech[index].allowed() && tech.tech[index].name !== "backward induction") {
        //                 tech.giveTech(index)
        //                 simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${tech.tech[index].name}</span>") <em> //backward induction</em>`);
        //             }
        //         }
        //     },
        //     remove() {}
        // },
        //************************************************** 
        //************************************************** gun
        //************************************************** tech
        //**************************************************
        // {
        //     name: "CPT gun",
        //     link: `<a target="_blank" href='https://en.wikipedia.org/wiki/CPT_symmetry' class="link">CPT gun</a>`,
        //     description: `adds the <strong>CPT</strong> <strong class='color-g'>gun</strong> to your inventory<br>it <strong>rewinds</strong> your <strong class='color-h'>health</strong>, <strong>velocity</strong>, and <strong>position</strong>`,
        //     isGunTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return (b.totalBots() > 3 || m.fieldUpgrades[m.fieldMode].name === "molecular assembler" || m.fieldUpgrades[m.fieldMode].name === "plasma torch" || m.fieldUpgrades[m.fieldMode].name === "pilot wave") && !tech.isEnergyHealth && !tech.isRewindAvoidDeath //build.isExperimentSelection ||
        //     },
        //     requires: "bots > 3, plasma torch, assembler, pilot wave, not mass-energy equivalence, CPT",
        //     effect() {
        //         tech.isRewindGun = true
        //         b.guns.push(b.gunRewind)
        //         b.giveGuns("CPT gun");
        //     },
        //     remove() {
        //         if (tech.isRewindGun) {
        //             b.removeGun("CPT gun", true)
        //             // for (let i = 0; i < b.guns.length; i++) {
        //             //     if (b.guns[i].name === "CPT gun") {
        //             //         b.guns[i].have = false
        //             //         for (let j = 0; j < b.inventory.length; j++) {
        //             //             if (b.inventory[j] === i) {
        //             //                 b.inventory.splice(j, 1)
        //             //                 break
        //             //             }
        //             //         }
        //             //         if (b.inventory.length) {
        //             //             b.activeGun = b.inventory[0];
        //             //         } else {
        //             //             b.activeGun = null;
        //             //         }
        //             //         simulation.makeGunHUD();

        //             //         b.guns.splice(i, 1) //also remove CPT gun from gun pool array
        //             //         break
        //             //     }
        //             // }
        //             tech.isRewindGun = false
        //         }
        //     }
        // },
        {
            name: "needle ice",
            description: `when <strong>needles</strong> impact walls<br>they chip off <strong>1-2</strong> freezing <strong class='color-s'>ice IX</strong> crystals`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.isNeedles || tech.isNeedles) && !tech.needleTunnel
            },
            requires: "nail gun, needle gun, not nanowires",
            effect() {
                tech.isNeedleIce = true
            },
            remove() {
                tech.isNeedleIce = false
            }
        },
        {
            name: "nanowires",
            description: `<strong>needles</strong> tunnel through <strong class='color-block'>blocks</strong> and <strong>map</strong><br>increase needle <strong class='color-d'>damage</strong> by <strong>20%</strong>`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return ((tech.haveGunCheck("nail gun") && tech.isNeedles) || (tech.isNeedles && tech.haveGunCheck("shotgun"))) && !tech.isNeedleIce
            },
            requires: "needle gun, not needle ice",
            effect() {
                tech.needleTunnel = true
            },
            remove() {
                tech.needleTunnel = false
            }
        },
        {
            name: "needle gun",
            description: "<strong>nail gun</strong> and <strong>shot gun</strong> fire mob piercing <strong>needles</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return ((tech.haveGunCheck("nail gun") && !tech.nailInstantFireRate && !tech.nailRecoil) || (tech.haveGunCheck("shotgun") && !tech.isNailShot && !tech.isFoamShot && !tech.isSporeWorm)) && !tech.isRivets && !tech.isIncendiary && !tech.isIceCrystals && !tech.isIceShot
            },
            requires: "nail gun, shotgun, not ice crystal, rivets, rotary cannon, or pneumatic, incendiary, nail-shot, rivets, foam-shot, worm-shot, ice-shot",
            effect() {
                tech.isNeedles = true
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "nail gun") {
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo / 3);
                        b.guns[i].ammoPack = Math.ceil(b.guns[i].defaultAmmoPack / 3);
                        b.guns[i].chooseFireMethod()
                        simulation.updateGunHUD();
                        break
                    }
                }
            },
            remove() {
                if (tech.isNeedles) {
                    tech.isNeedles = false
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "nail gun") {
                            b.guns[i].chooseFireMethod()
                            b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 3);
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
                            simulation.updateGunHUD();
                            break
                        }
                    }
                }
            }
        },
        {
            name: "rivet gun",
            description: "<strong>nail gun</strong> and <strong>shot gun</strong> slowly lob a heavy <strong>rivet</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return ((tech.haveGunCheck("nail gun") && !tech.nailInstantFireRate) || (tech.haveGunCheck("shotgun") && !tech.isNailShot && !tech.isFoamShot && !tech.isSporeWorm)) && !tech.isNeedles && !tech.isIceCrystals && !tech.isIceShot
            },
            requires: "nail gun shot gun, not ice crystal, needles, or pneumatic actuator",
            effect() {
                tech.isRivets = true
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "nail gun") {
                        b.guns[i].chooseFireMethod()
                        break
                    }
                }
            },
            remove() {
                if (tech.isRivets) {
                    tech.isRivets = false
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "nail gun") {
                            b.guns[i].chooseFireMethod()
                            break
                        }
                    }
                }
                tech.isRivets = false
            }
        },
        // {
        //     name: "slug",
        //     description: "<strong>shotgun</strong> lobs <strong>1</strong> huge <strong>bullet</strong>",
        //     isGunTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.haveGunCheck("shotgun") && !tech.isNailShot && !tech.isIncendiary && !tech.isIceShot && !tech.isFoamShot && !tech.isSporeWorm && !tech.isNeedles
        //     },
        //     requires: "shotgun, not nail-shot, foam-shot, worm-shot, ice-shot, needle-shot",
        //     effect() {
        //         tech.isSlugShot = true;
        //         for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
        //             if (b.guns[i].name === "shotgun") {
        //                 b.guns[i].do = function() {
        //                     if (!input.field && input.down) {
        //                         ctx.beginPath()
        //                         const speed = input.down ? 212 : 160
        //                         const v = { x: speed * Math.cos(m.angle), y: speed * Math.sin(m.angle) } //m.Vy / 2 + removed to make the path less jerky
        //                         const where = { x: m.pos.x, y: m.pos.y }
        //                         for (let i = 0; i < 20; i++) {
        //                             v.x *= 0.9712
        //                             v.y = v.y * 0.977 + 9.87
        //                             where.x += v.x
        //                             where.y += v.y
        //                             ctx.lineTo(where.x, where.y)
        //                         }
        //                         ctx.strokeStyle = "rgba(68, 68, 68, 0.2)" //color.map
        //                         ctx.lineWidth = 2
        //                         ctx.stroke()
        //                     }
        //                 }
        //                 break
        //             }
        //         }
        //     },
        //     remove() {
        //         if (tech.isSlugShot) {
        //             for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
        //                 if (b.guns[i].name === "shotgun") {
        //                     b.guns[i].do = function() {}
        //                     break
        //                 }
        //             }
        //         }
        //         tech.isSlugShot = false;
        //     }
        // },
        // {
        //     name: "super sized",
        //     description: `increase <strong>super ball</strong> radius by <strong>14%</strong><br>increases <strong class='color-d'>damage</strong> by about <strong>27%</strong>`,
        //     isGunTech: true,
        //     maxCount: 9,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.haveGunCheck("super balls")
        //     },
        //     requires: "super balls",
        //     effect() {
        //         tech.bulletSize += 0.14
        //     },
        //     remove() {
        //         tech.bulletSize = 1;
        //     }
        // },
        {
            name: "caliber",
            description: `<strong>rivets</strong>, <strong>needles</strong>, <strong>super balls</strong>, and <strong>nails</strong><br>have <strong>16%</strong> increased mass and physical <strong class='color-d'>damage</strong>`,
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isMineDrop + tech.nailBotCount + tech.fragments + tech.nailsDeathMob + (tech.haveGunCheck("super balls") + (tech.haveGunCheck("mine") && !tech.isLaserMine) + (tech.haveGunCheck("nail gun")) + tech.isNeedles + tech.isNailShot + tech.isRivets) * 2 > 1
            },
            requires: "nails, nail gun, rivets, shotgun",
            effect() {
                tech.bulletSize += 0.16
            },
            remove() {
                tech.bulletSize = 1;
            }
        },
        {
            name: "pneumatic actuator",
            description: "<strong>nail gun</strong> takes <strong>no</strong> time to ramp up<br>to its shortest <strong><em>delay</em></strong> after firing",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("nail gun") && !tech.isRivets && !tech.isNeedles && !tech.nailRecoil
            },
            requires: "nail gun, not rotary cannon, rivets, or needles",
            effect() {
                tech.nailInstantFireRate = true
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "nail gun") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.nailInstantFireRate) {
                    tech.nailInstantFireRate = false
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "nail gun") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "ice crystal nucleation",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Nucleation' class="link">ice crystal nucleation</a>`,
            description: "the <strong>nail gun</strong> uses <strong class='color-f'>energy</strong> to condense<br>unlimited <strong class='color-s'>freezing</strong> <strong>ice shards</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("nail gun") && !tech.isRivets && !tech.isNeedles // && !tech.isNailRadiation && !tech.isNailCrit
            },
            requires: "nail gun, not rivets, needles",
            effect() {
                tech.isIceCrystals = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "nail gun") {
                        b.guns[i].ammoPack = Infinity
                        b.guns[i].recordedAmmo = b.guns[i].ammo
                        b.guns[i].ammo = Infinity
                        simulation.updateGunHUD();
                        break;
                    }
                }
            },
            remove() {
                if (tech.isIceCrystals) {
                    tech.isIceCrystals = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "nail gun") {
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
                            if (b.guns[i].recordedAmmo) b.guns[i].ammo = b.guns[i].recordedAmmo
                            simulation.updateGunHUD();
                            break;
                        }
                    }
                }
            }
        },
        {
            name: "rotary cannon",
            description: "<strong>nail gun</strong> has increased muzzle <strong>speed</strong>,<br>maximum <strong>fire rate</strong>, <strong>accuracy</strong>, and <strong>recoil</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("nail gun") && !tech.nailInstantFireRate && !tech.isNeedles
            },
            requires: "nail gun, not pneumatic actuator, needle gun",
            effect() {
                tech.nailRecoil = true
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "nail gun") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.nailRecoil) {
                    tech.nailRecoil = false
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "nail gun") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "supercritical fission",
            description: "<strong>nails</strong>, <strong>needles</strong>, and <strong>rivets</strong> can <strong class='color-e'>explode</strong><br>if they strike mobs near their <strong>center</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.isNailShot || tech.isNeedles || tech.nailBotCount > 1 || tech.haveGunCheck("nail gun") || tech.isRivets) && !tech.isIncendiary
            },
            requires: "needles, nails, rivets, not incendiary",
            effect() {
                tech.isNailCrit = true
            },
            remove() {
                tech.isNailCrit = false
            }
        },
        {
            name: "irradiated nails",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Irradiation' class="link">irradiated nails</a>`,
            description: "<strong>nails</strong>, <strong>needles</strong>, and <strong>rivets</strong> are <strong class='color-p'>radioactive</strong><br>about <strong>90%</strong> more <strong class='color-d'>damage</strong> over <strong>3</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isMineDrop + tech.nailBotCount + tech.fragments + tech.nailsDeathMob / 2 + ((tech.haveGunCheck("mine") && !tech.isLaserMine) + (tech.haveGunCheck("nail gun") && !tech.isShieldPierce) + tech.isNeedles + tech.isNailShot) * 2 > 1
            },
            requires: "nail gun, nails, rivets, not ceramic needles",
            effect() {
                tech.isNailRadiation = true;
            },
            remove() {
                tech.isNailRadiation = false;
            }
        },
        {
            name: "6s half-life",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Half-life' class="link">6s half-life</a>`,
            description: "<strong>nails</strong> are made of <strong class='color-p'>plutonium-238</strong><br>increase <strong class='color-d'>damage</strong> by <strong>100%</strong> over <strong>6</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isNailRadiation && !tech.isFastRadiation
            },
            requires: "irradiated nails, not 1s half-life",
            effect() {
                tech.isSlowRadiation = true;
            },
            remove() {
                tech.isSlowRadiation = false;
            }
        },
        {
            name: "1s half-life",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Half-life' class="link">1s half-life</a>`,
            description: "<strong>nails</strong> are made of <strong class='color-p'>lithium-8</strong><br><strong class='color-d'>damage</strong> occurs after <strong>1</strong> second",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isNailRadiation && !tech.isSlowRadiation
            },
            requires: "irradiated nails, not 6s half-life",
            effect() {
                tech.isFastRadiation = true;
            },
            remove() {
                tech.isFastRadiation = false;
            }
        },
        {
            name: "spin-statistics",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Spin%E2%80%93statistics_theorem' class="link">spin-statistics</a>`,
            description: "<strong>immune</strong> to <strong class='color-harm'>harm</strong> while firing the <strong>shotgun</strong><br>shotgun has <strong>50%</strong> fewer shots",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("shotgun")
            },
            requires: "shotgun",
            effect() {
                tech.isShotgunImmune = true;

                //cut current ammo by 1/2
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "shotgun") {
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 0.5);
                        b.guns[i].ammoPack = b.guns[i].defaultAmmoPack * 0.5
                        break;
                    }
                }
                simulation.updateGunHUD();
            },
            remove() {
                if (tech.isShotgunImmune) {
                    tech.isShotgunImmune = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "shotgun") {
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
                            b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 2);
                            break;
                        }
                    }
                    simulation.updateGunHUD();
                }
            }
        },
        {
            name: "Newton's 3rd law",
            description: "<strong>shotgun</strong> <strong>recoil</strong> is increased<br>decrease <strong>shotgun</strong> <strong><em>delay</em></strong> after firing by <strong>66%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("shotgun") && !tech.isShotgunReversed
            },
            requires: "shotgun, not Noether violation",
            effect() {
                tech.isShotgunRecoil = true;
            },
            remove() {
                tech.isShotgunRecoil = false;
            }
        },
        {
            name: "Noether violation",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Noether%27s_theorem' class="link">Noether violation</a>`,
            description: "increase <strong>shotgun</strong> <strong class='color-d'>damage</strong> <strong>60%</strong><br>its <strong>recoil</strong> is increased and <strong>reversed</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("shotgun")) && !tech.isShotgunRecoil
            },
            requires: "shotgun, not Newton's 3rd law",
            effect() {
                tech.isShotgunReversed = true;
            },
            remove() {
                tech.isShotgunReversed = false;
            }
        },
        {
            name: "nail-shot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Nail_(fastener)' class="link">nail-shot</a>`,
            description: "<strong>shotgun</strong> fires <strong>17</strong> <strong>nails</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("shotgun") && !tech.isIncendiary && !tech.isRivets && !tech.isIceShot && !tech.isFoamShot && !tech.isSporeWorm && !tech.isNeedles
            },
            requires: "shotgun, not incendiary, rivets, foam-shot, worm-shot, ice-shot, needles",
            effect() {
                tech.isNailShot = true;
            },
            remove() {
                tech.isNailShot = false;
            }
        },
        {
            name: "foam-shot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Foam' class="link">foam-shot</a>`,
            description: "<strong>shotgun</strong> sprays <strong>13</strong> sticky <strong>foam</strong> bubbles",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("shotgun") && !tech.isNailShot && !tech.isIncendiary && !tech.isRivets && !tech.isIceShot && !tech.isSporeWorm && !tech.isNeedles
            },
            requires: "shotgun, not incendiary, nail-shot, rivet, worm-shot, ice-shot, needle",
            effect() {
                tech.isFoamShot = true;
            },
            remove() {
                tech.isFoamShot = false;
            }
        },
        {
            name: "ice-shot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Ice-nine_(disambiguation)' class="link">ice-shot</a>`,
            description: "<strong>shotgun</strong> grows <strong>15</strong> freezing <strong class='color-s'>ice IX</strong> crystals",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("shotgun") && !tech.isNailShot && !tech.isIncendiary && !tech.isRivets && !tech.isFoamShot && !tech.isSporeWorm && !tech.isNeedles
            },
            requires: "shotgun, not incendiary, nail-shot, rivet, foam-shot, worm-shot",
            effect() {
                tech.isIceShot = true;
            },
            remove() {
                tech.isIceShot = false;
            }
        },
        {
            name: "incendiary ammunition",
            description: "<strong>rivets</strong>, <strong>super balls</strong>, and <strong>drones</strong><br>are loaded with <strong class='color-e'>explosives</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.haveGunCheck("super balls") || (tech.isRivets && !tech.isNailCrit) || (m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isDroneTeleport || tech.isDroneRadioactive || tech.isSporeField || tech.isMissileField || tech.isIceField)) || (tech.haveGunCheck("drones") && !tech.isForeverDrones && !tech.isDroneRadioactive && !tech.isDroneTeleport)
            },
            requires: "super balls, rivets, drones, not irradiated drones or burst drones",
            effect() {
                tech.isIncendiary = true
            },
            remove() {
                tech.isIncendiary = false;
            }
        },
        {
            name: "supertemporal",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Temporal_paradox' class="link">supertemporal</a>`,
            description: "fire <strong>super ball</strong> from the same point in <strong>space</strong><br> but separated by <strong>0.1</strong> seconds in <strong>time</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("super balls") && !tech.oneSuperBall
            },
            requires: "super balls, but not the tech super ball",
            effect() {
                tech.superBallDelay = true
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "super balls") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.superBallDelay) {
                    tech.superBallDelay = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "super balls") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "super duper",
            description: `randomly fire <strong>+0</strong>, <strong>+1</strong>, or <strong>+2</strong> extra <strong>super balls</strong>`,
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("super balls") && !tech.oneSuperBall
            },
            requires: "super balls, not super ball",
            effect() {
                tech.extraSuperBalls += 3
            },
            remove() {
                tech.extraSuperBalls = 0;
            }
        },
        {
            name: "super ball",
            description: "fire just <strong>1 large</strong> super <strong>ball</strong><br>that <strong>stuns</strong> mobs for <strong>3</strong> second",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("super balls") && !tech.extraSuperBalls && !tech.superBallDelay
            },
            requires: "super balls, not super duper or supertemporal",
            effect() {
                tech.oneSuperBall = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "super balls") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.oneSuperBall) {
                    tech.oneSuperBall = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "super balls") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "phase velocity",
            description: "matter wave <strong>propagates</strong> faster through <strong>solids</strong><br>increase matter wave <strong class='color-d'>damage</strong> by <strong>15%</strong>",
            // description: "matter wave <strong>propagates</strong> faster through <strong>solids</strong><br>up by <strong>3000%</strong> in the map and <strong>760%</strong> in <strong class='color-block'>blocks</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("matter wave") && !tech.isLongitudinal
            },
            requires: "matter wave, not phonon",
            effect() {
                tech.isPhaseVelocity = true;
            },
            remove() {
                tech.isPhaseVelocity = false;
            }
        },
        {
            name: "bound state",
            description: "wave packets <strong>reflect</strong> backwards <strong>2</strong> times<br><strong>range</strong> is reduced by <strong>25%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("matter wave")
            },
            requires: "matter wave",
            effect() {
                tech.waveReflections += 2
            },
            remove() {
                tech.waveReflections = 1
            }
        },
        {
            name: "amplitude",
            description: "wave packet <strong>amplitude</strong> is <strong>33%</strong> higher<br>wave <strong class='color-d'>damage</strong> is increased by <strong>50%</strong>",
            isGunTech: true,
            maxCount: 3,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("matter wave")
            },
            requires: "matter wave",
            effect() {
                tech.waveFrequency *= 0.66
                tech.wavePacketDamage *= 1.5
            },
            remove() {
                tech.waveFrequency = 0.2
                tech.wavePacketDamage = 1
            }
        },
        {
            name: "propagation",
            description: "wave packet propagation <strong>speed</strong> is <strong>20%</strong> slower<br>wave <strong class='color-d'>damage</strong> is increased by <strong>50%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("matter wave")
            },
            requires: "matter wave",
            effect() {
                tech.waveBeamSpeed *= 0.8;
                tech.waveBeamDamage += 1.5 * 0.5 //this sets base matter wave damage, not used by arcs or circles
            },
            remove() {
                tech.waveBeamSpeed = 10;
                tech.waveBeamDamage = 1.5 //this sets base matter wave damage, not used by arcs or circles
            }
        },
        {
            name: "phonon", //longitudinal  //gravitational wave?
            description: "matter wave emits low <strong>frequency</strong>, high <strong class='color-d'>damage</strong><br><strong>expanding arcs</strong> that propagate through <strong>solids</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("matter wave") && !tech.isPhaseVelocity && !tech.isBulletTeleport
            },
            requires: "matter wave, not phase velocity, uncertainty principle",
            effect() {
                tech.isLongitudinal = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "matter wave") {
                        b.guns[i].chooseFireMethod()
                        b.guns[i].ammoPack = b.guns[i].defaultAmmoPack / 9
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo / 9);
                        simulation.updateGunHUD();
                        break
                    }
                }
            },
            remove() {
                if (tech.isLongitudinal) {
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "matter wave") {
                            tech.isLongitudinal = false;
                            b.guns[i].chooseFireMethod()
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack
                            b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 9);
                            simulation.updateGunHUD();
                            break
                        }
                    }
                }
                tech.isLongitudinal = false;
            }
        },
        {
            name: "isotropic radiator",
            description: "<strong>matter wave</strong> expands in <strong>all</strong> directions<br><span style = 'font-size:90%;'><strong>range</strong> reduced <strong>40%</strong> and <strong class='color-d'>damage</strong> increased <strong>50%</strong></span>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isLongitudinal
            },
            requires: "matter wave, phonon",
            effect() {
                tech.is360Longitudinal = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "matter wave") {
                        b.guns[i].chooseFireMethod()
                        break
                    }
                }
            },
            remove() {
                tech.is360Longitudinal = false;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "matter wave") {
                        b.guns[i].chooseFireMethod()
                        break
                    }
                }
            }
        },
        {
            name: "cruise missile",
            description: "<strong>missiles</strong> travel <strong>50%</strong> slower,<br>but have a <strong>100%</strong> larger <strong class='color-e'>explosive</strong> payload",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("missiles") && tech.missileFireCD === 45) || tech.isMissileField || tech.missileBotCount
            },
            requires: "missiles",
            effect() {
                tech.isMissileBig = true
            },
            remove() {
                tech.isMissileBig = false
            }
        },
        {
            name: "ICBM",
            description: "cruise <strong>missiles</strong> travel <strong>66%</strong> slower,<br>but have a <strong>100%</strong> larger <strong class='color-e'>explosive</strong> payload",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("missiles") && tech.isMissileBig //&& !tech.isSmartRadius && !tech.isImmuneExplosion
            },
            requires: "missiles, cruse missile", //, not electric reactive armor, controlled explosions",
            effect() {
                tech.isMissileBiggest = true
            },
            remove() {
                tech.isMissileBiggest = false
            }
        },
        {
            name: "launch system",
            description: `reduce <strong>missile</strong> launch cooldown <strong>500%</strong><br>gain <strong>20%</strong> more missile <strong class='color-ammo'>ammo</strong> per ${powerUps.orb.ammo(1)}`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("missiles") && !tech.isMissileBig
            },
            requires: "missiles",
            ammoBonus: 1.2,
            effect() {
                tech.missileFireCD = 10
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "missiles") {
                        b.guns[i].ammoPack = this.ammoBonus;
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo * this.ammoBonus);
                        simulation.updateGunHUD();
                        break
                    }
                }
            },
            remove() {
                if (tech.missileFireCD !== 45) {
                    tech.missileFireCD = 45;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "missiles") {
                            b.guns[i].ammoPack = 5;
                            b.guns[i].ammo = Math.ceil(b.guns[i].ammo / this.ammoBonus);
                            simulation.updateGunHUD();
                            break
                        }
                    }
                }
            }
        },
        {
            name: "missile-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">missile-bot</a>`,
            description: "gain a <strong class='color-bot'>bot</strong> that fires <strong>missiles</strong> at mobs<br>remove your <strong>missile gun</strong>",
            isGunTech: true,
            isRemoveGun: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBot: true,
            isBotTech: true,
            allowed() {
                return tech.haveGunCheck("missiles", false)
            },
            requires: "missiles",
            effect() {
                tech.missileBotCount++;
                b.missileBot();
                if (tech.haveGunCheck("missiles", false)) b.removeGun("missiles") //remove your last gun
            },
            remove() {
                if (this.count) {
                    tech.missileBotCount = 0;
                    b.clearPermanentBots();
                    b.respawnBots();
                    if (!tech.haveGunCheck("missiles", false)) b.giveGuns("missiles")
                }
            }
        },
        {
            name: "iridium-192",
            description: "<strong class='color-e'>explosions</strong> release <strong class='color-p'>gamma radiation</strong><br><strong>100%</strong> more <strong class='color-d'>damage</strong>, but over 4 seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.explosiveRadius === 1 && !tech.isSmallExplosion && (tech.haveGunCheck("missiles") || tech.missileBotCount || tech.isIncendiary || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.isPulseLaser || tech.isMissileField || tech.boomBotCount > 1 || tech.isTokamak)
            },
            requires: "an explosive damage source, not ammonium nitrate or nitroglycerin",
            effect: () => {
                tech.isExplodeRadio = true; //iridium-192
            },
            remove() {
                tech.isExplodeRadio = false;
            }
        },
        {
            name: "fragmentation",
            description: "some <strong class='color-e'>detonations</strong> and collisions eject <strong>nails</strong><br><em style = 'font-size: 90%'>blocks, grenades, missiles, rivets, harpoon</em>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.haveGunCheck("harpoon") || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("missiles") || tech.missileBotCount || tech.isRivets || tech.blockDamage > 0.075
            },
            requires: "grenades, missiles, rivets, harpoon, or mass driver",
            effect() {
                tech.fragments++
            },
            remove() {
                tech.fragments = 0
            }
        },
        {
            name: "ammonium nitrate",
            description: "increase <strong class='color-e'>explosive</strong> <strong class='color-d'>damage</strong> by <strong>27%</strong><br>increase <strong class='color-e'>explosive</strong> <strong>radius</strong> by <strong>27%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isExplodeRadio && tech.hasExplosiveDamageCheck()
            },
            requires: "an explosive damage source, not iridium-192",
            effect: () => {
                tech.explosiveRadius += 0.27;
            },
            remove() {
                tech.explosiveRadius = 1;
            }
        },
        {
            name: "nitroglycerin",
            description: "increase <strong class='color-e'>explosive</strong> <strong class='color-d'>damage</strong> by <strong>66%</strong><br>decrease <strong class='color-e'>explosive</strong> <strong>radius</strong> by <strong>33%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isExplodeRadio && tech.hasExplosiveDamageCheck()
            },
            requires: "an explosive damage source, not iridium-192",
            effect: () => {
                tech.isSmallExplosion = true;
            },
            remove() {
                tech.isSmallExplosion = false;
            }
        },
        {
            name: "acetone peroxide",
            description: "increase <strong class='color-e'>explosive</strong> <strong>radius</strong> by <strong>80%</strong>, but<br>you take <strong>200%</strong> more <strong class='color-harm'>harm</strong> from <strong class='color-e'>explosions</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isBadRandomOption: true,
            allowed() {
                return tech.hasExplosiveDamageCheck()
            },
            requires: "an explosive damage source",
            effect: () => {
                tech.isExplosionHarm = true;
            },
            remove() {
                tech.isExplosionHarm = false;
            }
        },
        {
            name: "shock wave",
            description: "<strong>mines</strong> and <strong class='color-e'>explosions</strong> <strong>stun</strong> for <strong>1-2</strong> seconds<br>decrease <strong class='color-e'>explosive</strong> <strong class='color-d'>damage</strong> by <strong>30%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.haveGunCheck("mine") || (!tech.isExplodeRadio && tech.hasExplosiveDamageCheck())
            },
            requires: "an explosive damage source, not iridium-192",
            effect() {
                tech.isExplosionStun = true;
            },
            remove() {
                tech.isExplosionStun = false;
            }
        },
        // {
        //     name: "blast mines",
        //     link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Anti-personnel_mine' class="link">blast mines</a>`,
        //     description: "when a <strong>mine</strong> <strong>activates</strong><br>it <strong>stuns</strong> nearby mobs for <strong>2-4</strong> seconds",
        //     isGunTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.haveGunCheck("mine")
        //     },
        //     requires: "mines",
        //     effect() {
        //         tech.isMineStun = true;
        //     },
        //     remove() {
        //         tech.isMineStun = false;
        //     }
        // },
        {
            name: "controlled explosion",
            description: `use ${powerUps.orb.research(3)} to dynamically <strong>reduce</strong> all<br><strong class='color-e'>explosions</strong> until they do no <strong class='color-harm'>harm</strong>`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isImmuneExplosion && (build.isExperimentSelection || powerUps.research.count > 2) && (tech.haveGunCheck("missiles") || tech.isMissileField || tech.missileBotCount > 0 || tech.isIncendiary || tech.isPulseLaser || tech.isTokamak || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb))
            },
            requires: "an explosive damage source, not electric reactive armor",
            effect: () => {
                tech.isSmartRadius = true;
                for (let i = 0; i < 3; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.isSmartRadius = false;
                if (this.count > 0) powerUps.research.changeRerolls(3)
            }
        },
        {
            name: "electric reactive armor",
            // description: "<strong class='color-e'>explosions</strong> do no <strong class='color-harm'>harm</strong><br> while your <strong class='color-f'>energy</strong> is above <strong>98%</strong>",
            description: "<strong class='color-harm'>harm</strong> from <strong class='color-e'>explosions</strong> is passively reduced<br>by <strong>5%</strong> for every <strong>10</strong> stored <strong class='color-f'>energy</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isSmartRadius && !tech.isExplodeRadio && tech.hasExplosiveDamageCheck()
            },
            requires: "an explosive damage source, not iridium-192",
            effect: () => {
                tech.isImmuneExplosion = true;
            },
            remove() {
                tech.isImmuneExplosion = false;
            }
        },
        {
            name: "MIRV",
            description: "fire <strong>+1</strong> <strong>missile</strong> and <strong>grenade</strong> per shot<br>decrease <strong class='color-e'>explosion</strong> <strong>radius</strong> up to <strong>10%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("missiles") || tech.missileBotCount || tech.haveGunCheck("grenades")
            },
            requires: "missiles, grenades",
            effect() {
                tech.missileCount++;
            },
            remove() {
                tech.missileCount = 1;
            }
        },
        {
            name: "rocket-propelled grenade",
            description: "<strong>grenades</strong> rapidly <strong>accelerate</strong> forward<br>map <strong>collisions</strong> trigger an <strong class='color-e'>explosion</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("grenades")
            },
            requires: "grenades",
            effect() {
                tech.isRPG = true;
                b.setGrenadeMode()
            },
            remove() {
                tech.isRPG = false;
                b.setGrenadeMode()
            }
        },
        {
            name: "vacuum bomb",
            description: "<strong>grenades</strong> fire slower, <strong class='color-e'>explode</strong> bigger<br> and, <strong>suck</strong> everything towards them",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("grenades") && !tech.isNeutronBomb
            },
            requires: "grenades, not neutron bomb",
            effect() {
                tech.isVacuumBomb = true;
                b.setGrenadeMode()
            },
            remove() {
                tech.isVacuumBomb = false;
                b.setGrenadeMode()
            }
        },
        {
            name: "chain reaction",
            description: "increase <strong>grenade</strong> radius and <strong class='color-d'>damage</strong> <strong>33%</strong><br><strong class='color-block'>blocks</strong> caught in <strong class='color-e'>explosions</strong> also <strong class='color-e'>explode</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isVacuumBomb && !tech.isExplodeRadio
            },
            requires: "grenades, vacuum bomb, not iridium-192",
            effect() {
                tech.isBlockExplode = true; //chain reaction
            },
            remove() {
                tech.isBlockExplode = false;
            }
        },
        {
            name: "neutron bomb",
            description: "<strong>grenades</strong> are <strong class='color-p'>irradiated</strong> with <strong class='color-p'>Cf-252</strong><br>does <strong class='color-d'>damage</strong>, <strong class='color-harm'>harm</strong>, and drains <strong class='color-f'>energy</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("grenades") && !tech.fragments && !tech.isVacuumBomb
            },
            requires: "grenades, not fragmentation, vacuum bomb",
            effect() {
                tech.isNeutronBomb = true;
                b.setGrenadeMode()
            },
            remove() {
                tech.isNeutronBomb = false;
                b.setGrenadeMode()
            }
        },
        {
            name: "vacuum permittivity",
            description: "increase <strong class='color-p'>radioactive</strong> range by <strong>20%</strong><br>objects in range of the bomb are <strong>slowed</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isNeutronBomb
            },
            requires: "grenades, neutron bomb",
            effect() {
                tech.isNeutronSlow = true
            },
            remove() {
                tech.isNeutronSlow = false
            }
        },
        {
            name: "radioactive contamination",
            description: "after a mob or shield <strong>dies</strong>,<br> leftover <strong class='color-p'>radiation</strong> <strong>spreads</strong> to a nearby mob",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isNailRadiation || tech.isWormholeDamage || tech.isNeutronBomb || tech.isExplodeRadio
            },
            requires: "radiation damage source",
            effect() {
                tech.isRadioactive = true
            },
            remove() {
                tech.isRadioactive = false
            }
        },
        {
            name: "water shielding",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Radiation_protection#Radiation_shielding' class="link">water shielding</a>`,
            description: "<strong class='color-p'>radioactive</strong> effects on you are reduced by 75%<br><em>neutron bomb, drones, explosions, slime</em>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isNeutronBomb || tech.isDroneRadioactive || tech.isExplodeRadio
            },
            requires: "neutron bomb or irradiated drones or iridium-192",
            effect() {
                tech.isRadioactiveResistance = true
            },
            remove() {
                tech.isRadioactiveResistance = false
            }
        },
        {
            name: "booby trap",
            description: "<strong>60%</strong> chance to drop a <strong>mine</strong> from <strong>power ups</strong><br><strong>+46%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("mine")
            },
            requires: "mines",
            effect() {
                tech.isMineDrop = true;
                if (tech.isMineDrop) b.mine(m.pos, { x: 0, y: 0 }, 0)
                this.refundAmount += tech.addJunkTechToPool(0.46)
            },
            refundAmount: 0,
            remove() {
                tech.isMineDrop = false;
                if (this.count > 0 && this.refundAmount > 0) {
                    tech.removeJunkTechFromPool(this.refundAmount)
                    this.refundAmount = 0
                }
            }
        },
        {
            name: "laser-mines",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Laser' class="link">laser-mines</a>`,
            description: "<strong>mines</strong> laid while you are <strong>crouched</strong><br>use <strong class='color-f'>energy</strong> to emit <strong>3</strong> unaimed <strong class='color-laser'>lasers</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("mine")
            },
            requires: "mines",
            effect() {
                tech.isLaserMine = true;
            },
            remove() {
                tech.isLaserMine = false;
            }
        },
        {
            name: "sentry",
            description: "instead of detonating, <strong>mines</strong> <strong>target</strong> mobs<br>with a stream of nails for about <strong>17</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("mine")
            },
            requires: "mines",
            effect() {
                tech.isMineSentry = true;
            },
            remove() {
                tech.isMineSentry = false;
            }
        },
        {
            name: "mycelial fragmentation",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Fungus' class="link">mycelial fragmentation</a>`,
            description: "<strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> release <strong>6</strong> more <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br>during their <strong>growth</strong> phase",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("spores")
            },
            requires: "spore gun",
            effect() {
                tech.isSporeGrowth = true
            },
            remove() {
                tech.isSporeGrowth = false
            }
        },
        {
            name: "tinsellated flagella",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Zoospore#Flagella_types' class="link">tinsellated flagella</a>`,
            description: "<strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> release <strong>2</strong> more <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> accelerate <strong>40% faster</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField
            },
            requires: "spore gun, spores",
            effect() {
                tech.isFastSpores = true
            },
            remove() {
                tech.isFastSpores = false
            }
        },
        {
            name: "cryodesiccation",
            description: "<strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> release <strong>2</strong> more <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> <strong class='color-s'>freeze</strong> mobs for <strong>1.5</strong> second",
            // <br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> do <strong>1/3</strong> <strong class='color-d'>damage</strong>
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField || tech.isSporeWorm
            },
            requires: "spore gun, spores or worms",
            effect() {
                tech.isSporeFreeze = true
            },
            remove() {
                tech.isSporeFreeze = false
            }
        },
        {
            name: "diplochory",
            description: "<strong class='color-p' style='letter-spacing: 2px;'>spores</strong> use you for <strong>dispersal</strong><br>until they <strong>locate</strong> a viable host",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField || tech.isSporeWorm
            },
            requires: "spore gun, spores or worms",
            effect() {
                tech.isSporeFollow = true
            },
            remove() {
                tech.isSporeFollow = false
            }
        },
        {
            name: "mutualism",
            description: "increase <strong class='color-p' style='letter-spacing: 2px;'>spore</strong> <strong class='color-d'>damage</strong> by <strong>150%</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> borrow <strong>0.5</strong> <strong>health</strong> until they <strong>die</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField) && !tech.isEnergyHealth || tech.isSporeWorm
            },
            requires: "spore gun, spores, worms, not mass-energy",
            effect() {
                tech.isMutualism = true
            },
            remove() {
                tech.isMutualism = false
            }
        },
        // {
        //     name: "worm-shot",
        //     link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Worm' class="link">worm-shot</a>`,
        //     description: "<strong>shotgun</strong> hatches <strong>3-4</strong> mob seeking <strong class='color-p' style='letter-spacing: -0.8px;'>worms</strong><br><em>worms benefit from spore technology</em>", //<br><strong class='color-p' style='letter-spacing: -0.8px;'>worms</strong> seek out nearby mobs
        //     isGunTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.haveGunCheck("shotgun") && !tech.isNailShot && !tech.isIncendiary && !tech.isRivets && !tech.isIceShot && !tech.isFoamShot && !tech.isNeedles
        //     },
        //     requires: "shotgun, not incendiary, nail-shot, rivets, foam-shot, ice-shot, needles",
        //     effect() {
        //         tech.isWormShot = true;
        //     },
        //     remove() {
        //         tech.isWormShot = false;
        //     }
        // },
        {
            name: "nematodes",
            description: "<strong>shotgun</strong> and <strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> hatch <strong class='color-p' style='letter-spacing: -0.8px;'>worms</strong>", //<br><strong class='color-p' style='letter-spacing: -0.8px;'>worms</strong> do <strong>250%</strong> more <strong class='color-d'>damage</strong>
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField || (tech.haveGunCheck("shotgun") && !tech.isIncendiary && !tech.isRivets && !tech.isIceShot && !tech.isFoamShot && !tech.isNeedles && !tech.isNailShot)
            },
            requires: "spore gun, spores",
            effect() {
                tech.isSporeWorm = true
            },
            remove() {
                tech.isSporeWorm = false
            }
        },
        {
            name: "annelids",
            description: "increase <strong class='color-p' style='letter-spacing: -0.8px;'>worm</strong> size and <strong class='color-d'>damage</strong><br>between <strong>10%</strong> and <strong>120%</strong>",
            isGunTech: true,
            maxCount: 3,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return tech.isSporeWorm
            },
            requires: "spore gun, shotgun, worms",
            effect() {
                tech.wormSize++
            },
            remove() {
                tech.wormSize = 0
            }
        },
        {
            name: "anti-shear topology",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Topology' class="link">anti-shear topology</a>`,
            description: "some <strong>projectiles</strong> last <strong>30% longer</strong><br><em style = 'font-size: 83%'>drone, spore, missile, foam, wave, neutron, ice</em>",
            isGunTech: true,
            maxCount: 3,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "molecular assembler" || tech.haveGunCheck("spores") || tech.haveGunCheck("drones") || tech.haveGunCheck("missiles") || tech.haveGunCheck("foam") || tech.haveGunCheck("matter wave") || tech.isNeutronBomb || tech.isIceField || tech.isIceShot || tech.relayIce || tech.isNeedleIce || tech.blockingIce > 1 || tech.isSporeWorm || tech.foamBotCount > 1
            },
            requires: "drones, spores, missiles, foam, matter wave, neutron bomb, ice IX",
            effect() {
                tech.isBulletsLastLonger += 0.3
            },
            remove() {
                tech.isBulletsLastLonger = 1;
            }
        },
        {
            name: "reduced tolerances",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Engineering_tolerance' class="link">reduced tolerances</a>`,
            description: `increase <strong>drones</strong> per ${powerUps.orb.ammo()} or <strong class='color-f'>energy</strong> by <strong>66%</strong><br>reduce average <strong>drone</strong> <strong>durability</strong> by <strong>40%</strong>`,
            isGunTech: true,
            maxCount: 3,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isDroneRadioactive && (tech.haveGunCheck("drones") || (m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isMissileField || tech.isIceField)))
            },
            requires: "drones, not irradiated drones",
            effect() {
                tech.droneCycleReduction = Math.pow(0.6, 1 + this.count)
                tech.droneEnergyReduction = Math.pow(0.333, 1 + this.count)
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "drones") {
                        const scale = Math.pow(3, this.count + 1)
                        b.guns[i].ammoPack = b.guns[i].defaultAmmoPack * scale
                    }
                }
            },
            remove() {
                tech.droneCycleReduction = 1
                tech.droneEnergyReduction = 1
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "drones") b.guns[i].ammoPack = b.guns[i].defaultAmmoPack
                }
            }
        },
        {
            name: "delivery drone",
            description: "if a <strong>drone</strong> picks up a <strong>power up</strong>,<br>it becomes <strong>larger</strong>, <strong>faster</strong>, and more <strong>durable</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isExtraMaxEnergy && (tech.haveGunCheck("drones") || tech.isForeverDrones || (m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isMissileField || tech.isIceField)))
            },
            requires: "drones, not permittivity",
            effect() {
                tech.isDroneGrab = true
            },
            remove() {
                tech.isDroneGrab = false
            }
        },
        {
            name: "drone repair",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Unmanned_aerial_vehicle' class="link">drone repair</a>`,
            description: "after a <strong>drone</strong> expires it <strong>redeploys</strong><br>for a <strong>20%</strong> chance to use <strong>1</strong> <strong>drone</strong> <strong class='color-ammo'>ammo</strong>",
            // description: "broken <strong>drones</strong> <strong>repair</strong> if the drone <strong class='color-g'>gun</strong> is active<br><strong>repairing</strong> has a <strong>25%</strong> chance to use <strong>1</strong> <strong>drone</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("drones")
            },
            requires: "drones",
            effect() {
                tech.isDroneRespawn = true
            },
            remove() {
                tech.isDroneRespawn = false
            }
        },
        {
            name: "autonomous navigation",
            description: "<strong>drones</strong> travel with you through <strong>levels</strong><br>and reset their <strong>durability</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("drones") || (m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isMissileField || tech.isIceField))
            },
            requires: "drones",
            effect() {
                tech.isDronesTravel = true
            },
            remove() {
                tech.isDronesTravel = false
            }
        },
        {
            name: "brushless motor",
            description: "<strong>drones</strong> rapidly <strong>rush</strong> towards their target<br>increase <strong>drone</strong> collision <strong class='color-d'>damage</strong> by <strong>33%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (tech.haveGunCheck("drones") || tech.isForeverDrones || (m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isMissileField || tech.isIceField))) && !tech.isDroneRadioactive && !tech.isIncendiary
            },
            requires: "drones, molecular assembler, not irradiated drones, incendiary",
            effect() {
                tech.isDroneTeleport = true
            },
            remove() {
                tech.isDroneTeleport = false
            }
        },
        {
            name: "axial flux motor",
            description: "<strong>drones</strong> can <strong>rush</strong> <strong>66%</strong> more often<br>increase <strong>drone</strong> collision <strong class='color-d'>damage</strong> by <strong>44%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isDroneTeleport
            },
            requires: "drones, brushless motor",
            effect() {
                tech.isDroneFastLook = true
            },
            remove() {
                tech.isDroneFastLook = false
            }
        },
        {
            name: "irradiated drones",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Irradiation' class="link">irradiated drones</a>`,
            description: `the space around <strong>drones</strong> is <strong class='color-p'>irradiated</strong><br>reduce <strong>drones</strong> per ${powerUps.orb.ammo()} or <strong class='color-f'>energy</strong> <strong>75%</strong>`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.droneCycleReduction === 1 && !tech.isIncendiary && !tech.isDroneTeleport && (tech.haveGunCheck("drones") || tech.isForeverDrones || (m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isMissileField || tech.isIceField)))
            },
            requires: "drones, not reduced tolerances, incendiary, torque bursts",
            effect() {
                tech.isDroneRadioactive = true
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "drones") {
                        b.guns[i].ammoPack = b.guns[i].defaultAmmoPack * 0.25
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 0.25)
                        simulation.makeGunHUD();
                    }
                }
            },
            remove() {
                if (tech.isDroneRadioactive) {
                    tech.isDroneRadioactive = false
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "drones") {
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack
                            b.guns[i].ammo = b.guns[i].ammo * 4
                            simulation.makeGunHUD();
                        }
                    }
                }
            }
        },
        {
            name: "beta radiation", //"control rod ejection",
            description: "reduce the average <strong>drone</strong> lifetime by <strong>50%</strong><br>increase <strong class='color-p'>radiation</strong> <strong class='color-d'>damage</strong> by <strong>100%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isDroneRadioactive
            },
            requires: "drones irradiated drones",
            effect() {
                tech.droneRadioDamage = 2
            },
            remove() {
                tech.droneRadioDamage = 1
            }
        },
        {
            name: "orthocyclic winding",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Coil_winding_technology' class="link">orthocyclic winding</a>`,
            description: "<strong>drones</strong> accelerate <strong>66%</strong> faster<br>increase <strong class='color-p'>radiation</strong> <strong class='color-d'>damage</strong> by <strong>33%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isDroneRadioactive
            },
            requires: "drones, irradiated drones",
            effect() {
                tech.isFastDrones = true
            },
            remove() {
                tech.isFastDrones = false
            }
        },
        {
            name: "fault tolerance",
            description: "spawn <strong>6</strong> <strong>drones</strong> that last <strong>forever</strong><br>remove your <strong>drone gun</strong>",
            isGunTech: true,
            isRemoveGun: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.haveGunCheck("drones", false) && !tech.isDroneRespawn && tech.isBulletsLastLonger === 1 && !tech.isDronesTravel
            },
            requires: "drones, not drone repair, anti-shear topology, autonomous navigation",
            effect() {
                const num = 6
                tech.isForeverDrones += num
                if (tech.haveGunCheck("drones", false)) b.removeGun("drones")
                //spawn drones
                if (tech.isDroneRadioactive) {
                    for (let i = 0; i < num * 0.25; i++) {
                        b.droneRadioactive({ x: m.pos.x + 30 * (Math.random() - 0.5), y: m.pos.y + 30 * (Math.random() - 0.5) }, 5)
                        bullet[bullet.length - 1].endCycle = Infinity
                    }
                } else {
                    for (let i = 0; i < num; i++) {
                        b.drone({ x: m.pos.x + 30 * (Math.random() - 0.5), y: m.pos.y + 30 * (Math.random() - 0.5) }, 5)
                        bullet[bullet.length - 1].endCycle = Infinity
                    }
                }
            },
            remove() {
                tech.isForeverDrones = 0
                if (this.count && !tech.haveGunCheck("drones", false)) b.giveGuns("drones")
            }
        },
        {
            name: "surfactant",
            description: "trade your <strong>foam gun</strong> for <strong>2</strong> <strong class='color-bot'>foam-bots</strong><br>and <strong>upgrade</strong> all bots to foam",
            isGunTech: true,
            isRemoveGun: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBot: true,
            isBotTech: true,
            isNonRefundable: true,
            requires: "at least 3 guns, foam gun, NOT EXPERIMENT MODE, bot upgrades, fractionation, quantum foam, capacitor",
            allowed() {
                return b.inventory.length > 2 && tech.haveGunCheck("foam", false) && !b.hasBotUpgrade() && !tech.isAmmoFoamSize && !tech.foamFutureFire && !tech.isCapacitor
            },
            effect() {
                tech.giveTech("foam-bot upgrade")
                for (let i = 0; i < 2; i++) {
                    b.foamBot()
                    tech.foamBotCount++;
                }
                simulation.makeTextLog(`tech.isFoamBotUpgrade = true`)
                if (tech.haveGunCheck("foam", false)) b.removeGun("foam")
            },
            remove() {
                // if (this.count) {
                //     b.clearPermanentBots();
                //     b.respawnBots();
                //     if (!tech.haveGunCheck("foam")) b.giveGuns("foam")
                // }
            }
        },
        {
            name: "electrostatic induction",
            description: "<strong>foam</strong> bubbles are electrically charged<br>causing <strong>attraction</strong> to nearby <strong>mobs</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isBulletTeleport && (tech.haveGunCheck("foam") || tech.foamBotCount > 1 || tech.isFoamShot)
            },
            requires: "foam, not uncertainty",
            effect() {
                tech.isFoamAttract = true
            },
            remove() {
                tech.isFoamAttract = false
            }
        },
        {
            name: "uncertainty principle",
            description: "<strong>foam</strong> and <strong>wave</strong> particle <strong>positions</strong> are random<br>increase their <strong class='color-d'>damage</strong> by <strong>43%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (!tech.isFoamAttract && (tech.haveGunCheck("foam") || tech.foamBotCount > 1 || tech.isFoamShot)) || (tech.haveGunCheck("matter wave") && !tech.isLongitudinal)
            },
            requires: "foam, not electrostatic induction, matter wave, not phonon",
            effect() {
                tech.isBulletTeleport = true
            },
            remove() {
                tech.isBulletTeleport = false;
            }
        },
        {
            name: "necrophage",
            description: "if <strong>foam</strong> or <strong class='color-p' style='letter-spacing: -0.8px;'>worms</strong> <strong>kill</strong> their target<br>grow 3 <strong>copies</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("foam") || tech.foamBotCount > 1 || tech.isFoamShot || tech.isSporeWorm
            },
            requires: "foam, worms",
            effect() {
                tech.isSpawnBulletsOnDeath = true
            },
            remove() {
                tech.isSpawnBulletsOnDeath = false;
            }
        },
        {
            name: "aerogel",
            description: "<strong>foam</strong> bubbles <strong>float</strong> and dissipate <strong>50%</strong> faster<br>increase <strong>foam</strong> <strong class='color-d'>damage</strong> per second by <strong>150%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("foam") || tech.foamBotCount > 1 || tech.isFoamShot
            },
            requires: "foam",
            effect() {
                tech.isFastFoam = true
                tech.foamGravity = -0.0003
            },
            remove() {
                tech.isFastFoam = false;
                tech.foamGravity = 0.00008
            }
        },
        {
            name: "quantum foam",
            description: "<strong>foam</strong> gun fires <strong>0.25</strong> seconds into the <strong>future</strong><br>increase <strong>foam</strong> gun <strong class='color-d'>damage</strong> by <strong>66%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("foam")
            },
            requires: "foam",
            effect() {
                tech.foamFutureFire++
            },
            remove() {
                tech.foamFutureFire = 0;
            }
        },
        {
            name: "foam fractionation",
            description: "<strong>foam</strong> gun bubbles are <strong>100%</strong> larger<br>when you have below <strong>300</strong> <strong>foam</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("foam")
            },
            requires: "foam",
            effect() {
                tech.isAmmoFoamSize = true
            },
            remove() {
                tech.isAmmoFoamSize = false;
            }
        },
        {
            name: "capacitor bank",
            // description: "<strong>charge</strong> effects build up almost <strong>instantly</strong><br><em style = 'font-size:97%;'>throwing <strong class='color-block'>blocks</strong>, foam, railgun, pulse, tokamak</em>",
            descriptionFunction() { return `<strong>charge</strong> effects build up almost <strong>instantly</strong><br><em style = 'font-size:93%;'>throwing, ${tech.haveGunCheck("foam", false) ? "<strong>foam</strong>" : "foam"}, ${tech.isPlasmaBall ? "<strong>plasma ball</strong>" : "plasma ball"}, ${tech.isRailGun ? "<strong>railgun</strong>" : "railgun"}, ${tech.isPulseLaser ? "<strong>pulse</strong>" : "pulse"}, ${tech.isTokamak ? "<strong>tokamak</strong>" : "tokamak"}</em>` },
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.blockDamage > 0.075 || tech.isRailGun || tech.haveGunCheck("foam") || tech.isTokamak || tech.isPulseLaser || tech.isPlasmaBall
            },
            requires: "throwing blocks, railgun, foam, pulse, tokamak, plasma ball",
            effect() {
                tech.isCapacitor = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "foam") {
                        b.guns[i].chooseFireMethod()
                        break
                    }
                }
            },
            remove() {
                tech.isCapacitor = false;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "foam") {
                        b.guns[i].chooseFireMethod()
                        break
                    }
                }
            }
        },
        {
            name: "railgun",
            description: `<strong>harpoons</strong> are <strong>50% denser</strong>, but don't <strong>retract</strong><br>gain <strong>800%</strong> more harpoon <strong class='color-ammo'>ammo</strong> per ${powerUps.orb.ammo(1)}`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("harpoon") && !tech.isFilament && !tech.isHarpoonPowerUp && !tech.isGrapple
            },
            requires: "harpoon, not filament, toggling harpoon, grappling hook",
            ammoBonus: 8,
            effect() {
                tech.isRailGun = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "harpoon") {
                        b.guns[i].chooseFireMethod()
                        b.guns[i].ammoPack = this.ammoBonus;
                        b.guns[i].ammo = b.guns[i].ammo * this.ammoBonus;
                        simulation.updateGunHUD();
                        break
                    }
                }
            },
            remove() {
                if (tech.isRailGun) {
                    tech.isRailGun = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "harpoon") {
                            b.guns[i].chooseFireMethod()
                            b.guns[i].ammoPack = 0.6;
                            b.guns[i].ammo = Math.ceil(b.guns[i].ammo / this.ammoBonus);
                            simulation.updateGunHUD();
                            break
                        }
                    }
                }
            }
        },
        // {
        //     name: "dielectric polarization",
        //     description: "firing the <strong>railgun</strong> <strong class='color-d'>damages</strong> nearby <strong>mobs</strong>",
        //     isGunTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.haveGunCheck("railgun")
        //     },
        //     requires: "railgun",
        //     effect() {
        //         tech.isRailAreaDamage = true;
        //     },
        //     remove() {
        //         tech.isRailAreaDamage = false;
        //     }
        // },
        // {
        //     name: "aerodynamic heating",
        //     description: "<strong>railgun</strong> rod <strong class='color-d'>damage</strong> nearby mobs",
        //     isGunTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return tech.haveGunCheck("railgun")
        //     },
        //     requires: "railgun",
        //     effect() {
        //         tech.isRodAreaDamage = true;
        //     },
        //     remove() {
        //         tech.isRodAreaDamage = false;
        //     }
        // },
        {
            name: "grappling hook",
            description: `<strong>harpoons</strong> attach to the <strong>map</strong> and pull you<br>your <strong>rope</strong> extends while holding <strong>fire</strong>`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("harpoon") && !tech.isFilament && !tech.isHarpoonPowerUp && !tech.isRailGun && !tech.isFireMoveLock
            },
            requires: "harpoon, not railgun, filament, toggling harpoon, Higgs mechanism",
            effect() {
                tech.isGrapple = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "harpoon") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.isGrapple) {
                    tech.isGrapple = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "harpoon") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "bulk modulus",
            description: `become <strong>immune</strong> to <strong class='color-harm'>harm</strong> while <strong>grappling</strong><br>drains <strong class='color-f'>energy</strong> and prevents <strong>regen</strong>`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isGrapple && !tech.isRailEnergyGain
            },
            requires: "grappling hook, not alternator",
            effect() {
                tech.isImmuneGrapple = true;
            },
            remove() {
                tech.isImmuneGrapple = false
            }
        },
        {
            name: "alternator",
            description: "<strong>harpoons</strong> drain no <strong class='color-f'>energy</strong><br><strong>railgun</strong> generates <strong class='color-f'>energy</strong>", //as they <strong>retract</strong><br><strong>crouch</strong> firing <strong>harpoon</strong> generates <strong class='color-f'>energy</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("harpoon") && !tech.isImmuneGrapple
            },
            requires: "railgun, not Bose–Einstein statistics",
            effect() {
                tech.isRailEnergyGain = true;
            },
            remove() {
                tech.isRailEnergyGain = false;
            }
        },
        {
            name: "ceramics",
            description: `<strong>needles</strong> and <strong>harpoons</strong> pierce <strong>shields</strong><br>directly <strong class='color-d'>damaging</strong> shielded mobs`,
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (!tech.isLargeHarpoon && tech.haveGunCheck("harpoon")) || tech.isNeedles
            },
            requires: "nail gun, needle gun, needle, harpoon, not Bessemer process",
            effect() {
                tech.isShieldPierce = true
            },
            remove() {
                tech.isShieldPierce = false
            }
        },
        {
            name: "Bessemer process",
            description: "increase the <strong>size</strong> of your <strong>harpoon</strong><br>by <strong>10%</strong> of the square root of harpoon <strong class='color-ammo'>ammo</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("harpoon") && !tech.isShieldPierce
            },
            requires: "harpoon not ceramics",
            effect() {
                tech.isLargeHarpoon = true;
            },
            remove() {
                tech.isLargeHarpoon = false;
            }
        },
        {
            name: "smelting",
            // description: `spend ${powerUps.orb.ammo(2)}to upgrade the <strong>harpoon</strong><br>fire <strong>+1</strong> <strong>harpoon</strong> with each shot`,
            description: `forge <strong>3</strong> <strong class='color-ammo'>ammo</strong> into a new harpoon<br>fire <strong>+1</strong> <strong>harpoon</strong> with each shot`,
            // descriptionFunction() { return `forge <strong>${tech.isRailGun? 10: 2}</strong> <strong class='color-ammo'>ammo</strong> into a new harpoon<br>fire <strong>+1</strong> <strong>harpoon</strong> with each shot` },
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return tech.haveGunCheck("harpoon") && b.returnGunAmmo('harpoon') > 2 + this.count * 3
            },
            requires: "harpoon",
            effect() {
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "harpoon") {
                        b.guns[i].ammo -= 3 + this.count * 3
                        console.log(3 + this.count * 3)
                        if (b.guns[i].ammo < 0) b.guns[i].ammo = 0
                        simulation.updateGunHUD();
                        tech.extraHarpoons++;
                        break
                    }
                }
                this.description = `forge <strong>${3+(this.count+1)*3}</strong> <strong class='color-ammo'>ammo</strong> into a new harpoon<br>fire <strong>+1</strong> <strong>harpoon</strong> with each shot`
            },
            remove() {
                if (tech.extraHarpoons) {
                    this.description = `forge <strong>${2}</strong> <strong class='color-ammo'>ammo</strong> into a new harpoon<br>fire <strong>+1</strong> <strong>harpoon</strong> with each shot`
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "harpoon") {
                            b.guns[i].ammo += 2
                            simulation.updateGunHUD();
                            break
                        }
                    }
                }
                tech.extraHarpoons = 0;
            }
        },
        {
            name: "UHMWPE",
            description: "increase the <strong>length</strong> of your <strong>harpoon</strong>'s <strong>rope</strong><br>by <strong>1%</strong> per harpoon <strong class='color-ammo'>ammo</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("harpoon") && !tech.isRailGun && !tech.isGrapple
            },
            requires: "harpoon, not grappling hook, railgun",
            effect() {
                tech.isFilament = true;
            },
            remove() {
                tech.isFilament = false;
            }
        },
        {
            name: "induction furnace",
            description: "increase the <strong class='color-d'>damage</strong> of your next <strong>harpoon</strong><br>by <strong>600%</strong> after using it to collect a <strong>power up</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("harpoon") && !tech.isRailGun && !tech.isGrapple
            },
            requires: "harpoon, not grappling hook, railgun",
            effect() {
                tech.isHarpoonPowerUp = true
            },
            remove() {
                tech.isHarpoonPowerUp = false
                tech.harpoonDensity = 0.005
            }
        },
        {
            name: "optical amplifier",
            description: "gain <strong>3</strong> random <strong class='color-laser'>laser</strong> <strong class='color-g'>gun</strong><strong class='color-m'>tech</strong><br><strong class='color-laser'>laser</strong> only turns <strong>off</strong> if you have no <strong class='color-f'>energy</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            isNonRefundable: true,
            allowed() {
                return tech.haveGunCheck("laser") && !tech.isPulseLaser
            },
            requires: "laser gun, not pulse",
            effect() {
                tech.isStuckOn = true

                for (let j = 0; j < 3; j++) {
                    const names = ["laser diode", "free-electron laser", "relativistic momentum", "specular reflection", "diffraction grating", "diffuse beam", "output coupler", "slow light"]
                    //convert names into indexes
                    const options = []
                    for (let i = 0; i < names.length; i++) {
                        for (let k = 0; k < tech.tech.length; k++) {
                            if (tech.tech[k].name === names[i]) {
                                options.push(k)
                                break
                            }
                        }
                    }
                    //remove options that don't meet requirements
                    for (let i = options.length - 1; i > -1; i--) {
                        const index = options[i]
                        if (!(tech.tech[index].count < tech.tech[index].maxCount) || !tech.tech[index].allowed()) {
                            options.splice(i, 1);
                        }
                    }
                    //pick one option
                    if (options.length) {
                        const index = options[Math.floor(Math.random() * options.length)]
                        simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${tech.tech[index].name}</span>") <em>//optical amplifier</em>`);
                        tech.giveTech(index)
                    }
                }
            },
            remove() {
                tech.isStuckOn = false
            }
        },
        {
            name: "laser diode",
            description: "all <strong class='color-laser'>lasers</strong> drain <strong>30%</strong> less <strong class='color-f'>energy</strong><br><em>affects laser-gun, laser-bot, laser-mines, pulse</em>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("laser") || tech.laserBotCount > 1 || tech.isLaserMine) && tech.laserDamage === 0.17
            },
            requires: "laser, not free-electron",
            effect() {
                tech.isLaserDiode = 0.70; //100%-37%
                tech.laserColor = "rgb(0, 11, 255)"
                tech.laserColorAlpha = "rgba(0, 11, 255,0.5)"
            },
            remove() {
                tech.isLaserDiode = 1;
                tech.laserColor = "#f02"
                tech.laserColorAlpha = "rgba(255, 0, 0, 0.5)"
            }
        },
        {
            name: "free-electron laser",
            description: "increase all <strong class='color-laser'>laser</strong> <strong class='color-d'>damage</strong> by <strong>200%</strong><br>increase all <strong class='color-laser'>laser</strong> <strong class='color-f'>energy</strong> drain by <strong>250%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("laser") || tech.isLaserMine || tech.laserBotCount > 1) && !tech.isPulseLaser && tech.isLaserDiode === 1
            },
            requires: "laser, not pulse, diodes",
            effect() {
                tech.laserFieldDrain = 0.007 //base is 0.002
                tech.laserDamage = 0.51; //base is 0.16
                tech.laserColor = "#83f"
                tech.laserColorAlpha = "rgba(136, 51, 255,0.5)"
            },
            remove() {
                tech.laserFieldDrain = 0.002;
                tech.laserDamage = 0.17; //used in check on pulse and diode: tech.laserDamage === 0.16
                tech.laserColor = "#f00"
                tech.laserColorAlpha = "rgba(255, 0, 0, 0.5)"
            }
        },
        {
            name: "relativistic momentum",
            description: "all <strong class='color-laser'>lasers</strong> push <strong>mobs</strong> and <strong class='color-block'>blocks</strong> away<br><em>affects laser-gun, laser-bot, and laser-mines</em>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("laser") && !tech.isPulseLaser) || tech.laserBotCount > 1
            },
            requires: "laser, not pulse",
            effect() {
                tech.isLaserPush = true;
            },
            remove() {
                tech.isLaserPush = false;
            }
        },
        {
            name: "specular reflection",
            description: "<strong>+2</strong> reflection for all <strong class='color-laser'>lasers</strong><br><em>affects laser-gun, laser-bot, and laser-mines</em>",
            isGunTech: true,
            maxCount: 3,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.haveGunCheck("laser") || tech.isLaserMine || tech.laserBotCount > 1) && !tech.isWideLaser && !tech.isPulseLaser && !tech.historyLaser
            },
            requires: "laser, not diffuse beam, pulse, or slow light",
            effect() {
                tech.laserReflections += 2;
            },
            remove() {
                tech.laserReflections = 2;
            }
        },
        {
            name: "diffraction grating",
            description: `<strong class='color-laser'>laser</strong> gains a <strong>diverging</strong> beam`,
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("laser") && !tech.isWideLaser && !tech.isPulseAim && !tech.historyLaser
            },
            requires: "laser gun, not neocognitron, diffuse beam, or slow light",
            effect() {
                tech.beamSplitter++
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.beamSplitter !== 0) {
                    tech.beamSplitter = 0
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "diffuse beam",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Diffuser_(optics)' class="link">diffuse beam</a>`,
            description: "<strong class='color-laser'>laser</strong> beam is <strong>wider</strong> and doesn't <strong>reflect</strong><br>increase full beam <strong class='color-d'>damage</strong> by <strong>200%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("laser") && tech.laserReflections < 3 && !tech.beamSplitter && !tech.isPulseLaser && !tech.historyLaser
            },
            requires: "laser gun, not specular reflection, diffraction grating, slow light, pulse",
            effect() {
                if (tech.wideLaser === 0) tech.wideLaser = 3
                tech.isWideLaser = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.isWideLaser) {
                    // tech.wideLaser = 0
                    tech.isWideLaser = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "output coupler",
            description: "<strong>widen</strong> diffuse <strong class='color-laser'>laser</strong> beam by <strong>30%</strong><br>increase full beam <strong class='color-d'>damage</strong> by <strong>30%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isWideLaser
            },
            requires: "laser gun, diffuse beam",
            effect() {
                tech.wideLaser += 2
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.isWideLaser) {
                    tech.wideLaser = 3
                } else {
                    tech.wideLaser = 0
                }
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            }
        },
        {
            name: "slow light",
            description: "<strong class='color-laser'>laser</strong> beam is <strong>spread</strong> into your recent <strong>past</strong><br>increase total beam <strong class='color-d'>damage</strong> by <strong>300%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("laser") && tech.laserReflections < 3 && !tech.beamSplitter && !tech.isWideLaser
            },
            requires: "laser gun, not specular reflection, diffraction grating, diffuse beam",
            effect() {
                // this.description = `add 5 more <strong>laser</strong> beams into into your past`
                tech.historyLaser++
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                // this.description = "<strong>laser</strong> beam is <strong>spread</strong> into your recent <strong>past</strong><br>increase total beam <strong class='color-d'>damage</strong> by <strong>300%</strong>"
                if (tech.historyLaser) {
                    tech.historyLaser = 0
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "pulse",
            description: "charge your <strong class='color-f'>energy</strong> and release it as a<br><strong class='color-laser'>laser</strong> pulse that initiates an <strong class='color-e'>explosion</strong> cluster",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.haveGunCheck("laser") && tech.laserReflections < 3 && !tech.isWideLaser && tech.laserDamage === 0.17 && !tech.isStuckOn
            },
            requires: "laser gun, not specular reflection, diffuse, free-electron laser, optical amplifier",
            effect() {
                tech.isPulseLaser = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.isPulseLaser) {
                    tech.isPulseLaser = false;
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                    }
                }
            }
        },
        {
            name: "neocognitron",
            description: "<strong class='color-laser'>pulse</strong> automatically <strong>aims</strong> at a nearby mob",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isPulseLaser && !tech.beamSplitter
            },
            requires: "laser gun, pulse, not diffraction grating",
            effect() {
                tech.isPulseAim = true;
            },
            remove() {
                tech.isPulseAim = false;
            }
        },
        //************************************************** 
        //************************************************** field
        //************************************************** tech
        //************************************************** 
        {
            name: "zero point energy",
            description: `use ${powerUps.orb.research(2)}to increase your <strong>max</strong> <strong class='color-f'>energy</strong> by <strong>100</strong>`,
            // description: "use <strong>2</strong> <strong class='color-r'>research</strong> to<br>increase your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>74</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "standing wave" || m.fieldUpgrades[m.fieldMode].name === "pilot wave") && (build.isExperimentSelection || powerUps.research.count > 1)
            },
            requires: "standing wave or pilot wave",
            effect() {
                tech.harmonicEnergy = 1
                m.setMaxEnergy()
                for (let i = 0; i < 2; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.harmonicEnergy = 0;
                m.setMaxEnergy()
                if (this.count > 0) powerUps.research.changeRerolls(2)
            }
        },
        {
            name: "spherical harmonics",
            description: "<strong>standing wave</strong> oscillates in a 3rd dimension<br>increase <strong>deflecting</strong> efficiency by <strong>40%</strong>",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "standing wave"
            },
            requires: "standing wave",
            effect() {
                tech.harmonics++
                m.fieldShieldingScale = (tech.isStandingWaveExpand ? 1.1 : 1.3) * Math.pow(0.6, (tech.harmonics - 2))
                m.harmonicShield = m.harmonicAtomic
            },
            remove() {
                tech.harmonics = 2
                m.fieldShieldingScale = (tech.isStandingWaveExpand ? 1.1 : 1.3) * Math.pow(0.6, (tech.harmonics - 2))
                m.harmonicShield = m.harmonic3Phase
            }
        },
        {
            name: "expansion",
            description: "using <strong>standing wave</strong> field <strong>expands</strong> its <strong>radius</strong><br>increase <strong>deflecting</strong> efficiency by <strong>25%</strong>",
            // description: "use <strong class='color-f'>energy</strong> to <strong>expand</strong> <strong>standing wave</strong><br>the field slowly <strong>contracts</strong> when not used",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "standing wave"
            },
            requires: "standing wave",
            effect() {
                tech.isStandingWaveExpand = true
                m.fieldShieldingScale = (tech.isStandingWaveExpand ? 1.1 : 1.3) * Math.pow(0.6, (tech.harmonics - 2))
            },
            remove() {
                tech.isStandingWaveExpand = false
                m.fieldShieldingScale = (tech.isStandingWaveExpand ? 1.1 : 1.3) * Math.pow(0.6, (tech.harmonics - 2))
                m.harmonicRadius = 1
            }
        },
        {
            name: "bremsstrahlung",
            description: "<strong>deflecting</strong> does <strong class='color-d'>damage</strong> to mobs",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "standing wave" || m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism"
            },
            requires: "standing wave, perfect diamagnetism",
            effect() {
                tech.blockDmg += 1.75 //if you change this value also update the for loop in the electricity graphics in m.pushMass
            },
            remove() {
                tech.blockDmg = 0;
            }
        },
        {
            name: "triple point",
            description: "the pressure from <strong>deflecting</strong> is used<br>to condense <strong class='color-s'>ice IX</strong> crystals",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "standing wave" || m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism"
            },
            requires: "standing wave, perfect diamagnetism",
            effect() {
                tech.blockingIce++
            },
            remove() {
                tech.blockingIce = 0;
            }
        },
        {
            name: "flux pinning",
            description: "<strong>deflecting</strong> mobs with your <strong>field</strong><br><strong>stuns</strong> them for <strong>4</strong> seconds",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism" || m.fieldUpgrades[m.fieldMode].name === "standing wave" || m.fieldUpgrades[m.fieldMode].name === "molecular assembler"
            },
            requires: "a field that can block",
            effect() {
                tech.isStunField += 240;
            },
            remove() {
                tech.isStunField = 0;
            }
        },
        {
            name: "eddy current brake",
            description: "<strong>perfect diamagnetism</strong> <strong class='color-s'>slows</strong> nearby mobs<br>effect <strong>radius</strong> scales with stored <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism"
            },
            requires: "perfect diamagnetism",
            effect() {
                tech.isPerfectBrake = true;
            },
            remove() {
                tech.isPerfectBrake = false;
            }
        },
        {
            name: "Meissner effect",
            description: "increase <strong>perfect diamagnetism</strong> field<br><strong>radius</strong> by <strong>55%</strong> and circular <strong>arc</strong> by <strong>22°</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism"
            },
            requires: "perfect diamagnetism",
            effect() {
                tech.isBigField = true;
            },
            remove() {
                tech.isBigField = false;
            }
        },
        {
            name: "tessellation",
            description: `use ${powerUps.orb.research(2)}to reduce <strong class='color-harm'>harm</strong> by <strong>50%</strong>`,
            // description: "use <strong>4</strong> <strong class='color-r'>research</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>50%</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "pilot wave" || m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism" || m.fieldUpgrades[m.fieldMode].name === "negative mass") && (build.isExperimentSelection || powerUps.research.count > 3)
            },
            requires: "perfect diamagnetism, negative mass, pilot wave",
            effect() {
                tech.isFieldHarmReduction = true
                for (let i = 0; i < 2; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.isFieldHarmReduction = false
                if (this.count > 0) powerUps.research.changeRerolls(2)
            }
        },
        {
            name: "radiative equilibrium",
            description: "for <strong>10 seconds</strong> after receiving <strong class='color-harm'>harm</strong><br>increase <strong class='color-d'>damage</strong> by <strong>200%</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "pilot wave" || m.fieldUpgrades[m.fieldMode].name === "negative mass") && (build.isExperimentSelection || powerUps.research.count > 3)
            },
            requires: "negative mass, pilot wave",
            effect() {
                tech.isHarmDamage = true;
            },
            remove() {
                tech.isHarmDamage = false;
            }
        },
        {
            name: "neutronium",
            description: `reduce <strong class='color-harm'>harm</strong> by <strong>90%</strong> when your <strong class='color-f'>field</strong> is active<br><strong>move</strong> and <strong>jump</strong> <strong>33%</strong> <strong>slower</strong>`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "negative mass" && !tech.isEnergyHealth
            },
            requires: "negative mass, not mass-energy",
            effect() {
                tech.isNeutronium = true
                tech.baseFx *= 0.66
                tech.baseJumpForce *= 0.66
                m.setMovement()
            },
            //also removed in m.setHoldDefaults() if player switches into a bad field
            remove() {
                tech.isNeutronium = false
                if (!tech.isFreeWormHole) {
                    tech.baseFx = 0.08
                    tech.baseJumpForce = 10.5
                    m.setMovement()
                }
            }
        },
        {
            name: "annihilation",
            description: "<strong>touching</strong> normal mobs <strong>annihilates</strong> them<br>but drains <strong>33%</strong> of your maximum <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "negative mass"
            },
            requires: "negative mass",
            effect() {
                tech.isAnnihilation = true
            },
            remove() {
                tech.isAnnihilation = false;
            }
        },
        {
            name: "inertial mass",
            description: "<strong>negative mass</strong> is larger and <strong>faster</strong><br><strong class='color-block'>blocks</strong> also move <strong>horizontally</strong> with the field",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "negative mass"
            },
            requires: "negative mass",
            effect() {
                tech.isFlyFaster = true
            },
            remove() {
                tech.isFlyFaster = false;
            }
        },
        // {
        //     name: "Bose Einstein condensate",
        //     description: "use <strong class='color-f'>energy</strong> to <strong class='color-s'>freeze</strong> <strong>mobs</strong> in your <strong class='color-f'>field</strong><br><em style = 'font-size: 100%'>pilot wave, negative mass, time dilation</em>",
        //     isFieldTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return m.fieldUpgrades[m.fieldMode].name === "pilot wave" || m.fieldUpgrades[m.fieldMode].name === "negative mass" || (m.fieldUpgrades[m.fieldMode].name === "time dilation" && !tech.isRewindField)
        //     },
        //     requires: "pilot wave, negative mass, time dilation, not retrocausality",
        //     effect() {
        //         tech.isFreezeMobs = true
        //     },
        //     remove() {
        //         tech.isFreezeMobs = false
        //     }
        // },
        {
            name: "pair production",
            description: "picking up a <strong>power up</strong> gives you <strong>200</strong> <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "molecular assembler" || m.fieldUpgrades[m.fieldMode].name === "standing wave" || m.fieldUpgrades[m.fieldMode].name === "pilot wave"
            },
            requires: "molecular assembler or pilot wave",
            effect: () => {
                tech.isMassEnergy = true // used in m.grabPowerUp
                m.energy += 2
            },
            remove() {
                tech.isMassEnergy = false;
            }
        },
        {
            name: "bot manufacturing",
            description: `use ${powerUps.orb.research(2)} to build<br><strong>3</strong> random <strong class='color-bot'>bots</strong>`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBotTech: true,
            isNonRefundable: true,
            // isExperimentHide: true,
            allowed() {
                return powerUps.research.count > 1 && m.fieldUpgrades[m.fieldMode].name === "molecular assembler"
            },
            requires: "NOT EXPERIMENT MODE, molecular assembler",
            effect: () => {
                for (let i = 0; i < 2; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
                m.energy = 0.01;
                b.randomBot()
                b.randomBot()
                b.randomBot()
            },
            remove() {}
        },
        {
            name: "bot prototypes",
            description: `use ${powerUps.orb.research(3)}to build<br><strong>2</strong> random <strong class='color-bot'>bots</strong> and <strong>upgrade</strong> all <strong class='color-bot'>bots</strong> to that type`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            isBotTech: true,
            isNonRefundable: true,
            // isExperimentHide: true,
            allowed() {
                return powerUps.research.count > 2 && m.fieldUpgrades[m.fieldMode].name === "molecular assembler"
            },
            requires: "NOT EXPERIMENT MODE, molecular assembler",
            effect: () => {
                for (let i = 0; i < 3; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
                //fill array of available bots
                const notUpgradedBots = []
                const num = 2
                notUpgradedBots.push(() => {
                    tech.giveTech("nail-bot upgrade")
                    for (let i = 0; i < num; i++) {
                        b.nailBot()
                        tech.nailBotCount++;
                    }
                    simulation.makeTextLog(`tech.isNailBotUpgrade = true`)
                })
                notUpgradedBots.push(() => {
                    tech.giveTech("foam-bot upgrade")
                    for (let i = 0; i < num; i++) {
                        b.foamBot()
                        tech.foamBotCount++;
                    }
                    simulation.makeTextLog(`tech.isFoamBotUpgrade = true`)
                })
                notUpgradedBots.push(() => {
                    tech.giveTech("boom-bot upgrade")
                    for (let i = 0; i < num; i++) {
                        b.boomBot()
                        tech.boomBotCount++;
                    }
                    simulation.makeTextLog(`tech.isBoomBotUpgrade = true`)
                })
                notUpgradedBots.push(() => {
                    tech.giveTech("laser-bot upgrade")
                    for (let i = 0; i < num; i++) {
                        b.laserBot()
                        tech.laserBotCount++;
                    }
                    simulation.makeTextLog(`tech.isLaserBotUpgrade = true`)
                })
                notUpgradedBots.push(() => {
                    tech.giveTech("orbital-bot upgrade")
                    for (let i = 0; i < num; i++) {
                        b.orbitBot()
                        tech.orbitBotCount++;
                    }
                    simulation.makeTextLog(`tech.isOrbitalBotUpgrade = true`)
                })
                for (let i = 0; i < 2; i++) { //double chance for dynamo-bot, since it's very good for assembler
                    notUpgradedBots.push(() => {
                        tech.giveTech("dynamo-bot upgrade")
                        for (let i = 0; i < num; i++) {
                            b.dynamoBot()
                            tech.dynamoBotCount++;
                        }
                        simulation.makeTextLog(`tech.isDynamoBotUpgrade = true`)
                    })
                }
                notUpgradedBots[Math.floor(Math.random() * notUpgradedBots.length)]() //choose random function from the array and run it
            },
            remove() {}
        },
        {
            name: "mycelium manufacturing",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Mycelium' class="link">mycelium manufacturing</a>`,
            description: `use ${powerUps.orb.research(1)}to repurpose <strong>molecular assembler</strong><br>excess <strong class='color-f'>energy</strong> used to grow <strong class='color-p' style='letter-spacing: 2px;'>spores</strong>`,
            // description: "use <strong>3</strong> <strong class='color-r'>research</strong> to repurpose <strong>assembler</strong><br>excess <strong class='color-f'>energy</strong> used to grow <strong class='color-p' style='letter-spacing: 2px;'>spores</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (build.isExperimentSelection || powerUps.research.count > 0) && m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isMissileField || tech.isIceField || tech.isFastDrones || tech.isDroneGrab || tech.isDroneRadioactive || tech.isDroneTeleport || tech.isDronesTravel)
            },
            requires: "molecular assembler, no other manufacturing, no drone tech",
            effect() {
                if (!build.isExperimentSelection) {
                    for (let i = 0; i < 1; i++) {
                        if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                    }
                }
                tech.isSporeField = true;
            },
            remove() {
                tech.isSporeField = false;
                if (this.count > 0) powerUps.research.changeRerolls(1)
            }
        },
        {
            name: "missile manufacturing",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Missile' class="link">missile manufacturing</a>`,
            description: `use ${powerUps.orb.research(1)}to repurpose <strong>molecular assembler</strong><br>excess <strong class='color-f'>energy</strong> used to construct <strong>missiles</strong>`,
            // description: "use <strong>3</strong> <strong class='color-r'>research</strong> to repurpose <strong>assembler</strong><br>excess <strong class='color-f'>energy</strong> used to construct <strong>missiles</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (build.isExperimentSelection || powerUps.research.count > 0) && m.maxEnergy > 0.5 && m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isIceField || tech.isFastDrones || tech.isDroneGrab || tech.isDroneRadioactive || tech.isDroneTeleport || tech.isDronesTravel)
            },
            requires: "molecular assembler, no other manufacturing, no drone tech",
            effect() {
                if (!build.isExperimentSelection) {
                    for (let i = 0; i < 1; i++) {
                        if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                    }
                }
                tech.isMissileField = true;
            },
            remove() {
                tech.isMissileField = false;
                if (this.count > 0) powerUps.research.changeRerolls(1)
            }
        },
        {
            name: "ice IX manufacturing",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Ice-nine_(disambiguation)' class="link">ice IX manufacturing</a>`,
            description: `use ${powerUps.orb.research(1)}to repurpose <strong>molecular assembler</strong><br>excess <strong class='color-f'>energy</strong> used to condense <strong class='color-s'>ice IX</strong>`,
            // description: "use <strong>3</strong> <strong class='color-r'>research</strong> to repurpose <strong>assembler</strong><br>excess <strong class='color-f'>energy</strong> used to condense <strong class='color-s'>ice IX</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (build.isExperimentSelection || powerUps.research.count > 0) && m.fieldUpgrades[m.fieldMode].name === "molecular assembler" && !(tech.isSporeField || tech.isMissileField || tech.isFastDrones || tech.isDroneGrab || tech.isDroneRadioactive || tech.isDroneTeleport || tech.isDronesTravel)
            },
            requires: "molecular assembler, no other manufacturing, no drone tech",
            effect() {
                if (!build.isExperimentSelection) {
                    for (let i = 0; i < 1; i++) {
                        if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                    }
                }
                tech.isIceField = true;
            },
            remove() {
                tech.isIceField = false;
                if (this.count > 0) powerUps.research.changeRerolls(1)
            }
        },
        // {
        //     name: "thermal reservoir",
        //     description: "increase your <strong class='color-plasma'>plasma</strong> <strong class='color-d'>damage</strong> by <strong>100%</strong><br><strong class='color-plasma'>plasma</strong> temporarily lowers health not <strong class='color-f'>energy</strong>",
        //     isFieldTech: true,
        //     maxCount: 1,
        //     count: 0,
        // frequency: 2,
        //     allowed() {
        //         return m.fieldUpgrades[m.fieldMode].name === "plasma torch" && !tech.isEnergyHealth
        //     },
        //     requires: "plasma torch, not mass-energy equivalence",
        //     effect() {
        //         tech.isPlasmaRange += 0.27;
        //     },
        //     remove() {
        //         tech.isPlasmaRange = 1;
        //     }
        // },
        {
            name: "degenerate matter",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>60%</strong> while your <strong class='color-f'>field</strong> is active",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "plasma torch" || m.fieldUpgrades[m.fieldMode].name === "perfect diamagnetism" || m.fieldUpgrades[m.fieldMode].name === "pilot wave") && !tech.isEnergyHealth
            },
            requires: "perfect diamagnetism, pilot wave, plasma, not mass-energy",
            effect() {
                tech.isHarmReduce = true
            },
            remove() {
                tech.isHarmReduce = false;
            }
        },
        {
            name: "tokamak",
            description: "throwing a <strong class='color-block'>block</strong> converts it into <strong class='color-f'>energy</strong><br>and a pulsed fusion <strong class='color-e'>explosion</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "plasma torch" || m.fieldUpgrades[m.fieldMode].name === "molecular assembler"
            },
            requires: "plasma torch or molecular assembler",
            effect() {
                tech.isTokamak = true;
            },
            remove() {
                tech.isTokamak = false;
            }
        },
        {
            name: "plasma-bot",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Robot' class="link">plasma-bot</a>`,
            description: "remove your <strong>field</strong> to build a <strong class='color-bot'>bot</strong><br>that uses <strong class='color-f'>energy</strong> to emit <strong class='color-plasma'>plasma</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isBot: true,
            isBotTech: true,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "plasma torch" && (build.isExperimentSelection || powerUps.research.count > 0) && !tech.isPlasmaBall && !tech.isExtruder
            },
            requires: "plasma torch",
            effect() {
                tech.plasmaBotCount++;
                b.plasmaBot();
                if (build.isExperimentSelection) {
                    document.getElementById("field-" + m.fieldMode).classList.remove("build-field-selected");
                    document.getElementById("field-0").classList.add("build-field-selected");
                }
                m.setField("field emitter")
            },
            remove() {
                if (this.count > 0) {
                    tech.plasmaBotCount = 0;
                    b.clearPermanentBots();
                    b.respawnBots();
                    if (m.fieldMode === 0) {
                        m.setField("plasma torch")
                        if (build.isExperimentSelection) {
                            document.getElementById("field-0").classList.remove("build-field-selected");
                            document.getElementById("field-" + m.fieldMode).classList.add("build-field-selected");
                        }
                    }
                }
            }
        },
        {
            name: "plasma jet",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Plasma_(physics)' class="link">plasma jet</a>`,
            description: `use ${powerUps.orb.research(2)} to increase <strong class='color-plasma'>plasma</strong> <strong>torch</strong> range <strong>50%</strong>`,
            // description: "use <strong>1</strong> <strong class='color-r'>research</strong> to <br>increase <strong class='color-plasma'>plasma</strong> <strong>torch's</strong> range by <strong>50%</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (tech.plasmaBotCount || m.fieldUpgrades[m.fieldMode].name === "plasma torch") && (build.isExperimentSelection || powerUps.research.count > 1) && !tech.isPlasmaBall
            },
            requires: "plasma torch, not plasma ball",
            effect() {
                tech.isPlasmaRange += 0.5;
                for (let i = 0; i < 2; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.isPlasmaRange = 1;
                if (this.count > 0) powerUps.research.changeRerolls(this.count * 2)
            }
        },
        {
            name: "extruder",
            description: "<strong>extrude</strong> a thin hot wire of <strong class='color-plasma'>plasma</strong><br>increases <strong class='color-d'>damage</strong> and <strong class='color-f'>energy</strong> drain",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "plasma torch" && !tech.isPlasmaBall
            },
            requires: "plasma torch, not plasma ball",
            effect() {
                tech.isExtruder = true;
                m.fieldUpgrades[m.fieldMode].set()
            },
            remove() {
                tech.isExtruder = false;
                if (this.count && m.fieldUpgrades[m.fieldMode].name === "plasma torch") m.fieldUpgrades[m.fieldMode].set()
            }
        },
        {
            name: "refractory metal",
            description: "<strong class='color-plasma'>extrude</strong> metals at a higher <strong class='color-plasma'>temperature</strong><br>increases effective <strong>radius</strong> and <strong class='color-d'>damage</strong>",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return tech.isExtruder
            },
            requires: "extruder",
            effect() {
                tech.extruderRange += 60
            },
            remove() {
                tech.extruderRange = 15
            }
        },
        {
            name: "plasma ball",
            description: "<strong>grow</strong> an expanding <strong>ball</strong> of <strong class='color-plasma'>plasma</strong><br>increases <strong class='color-d'>damage</strong> and <strong class='color-f'>energy</strong> drain",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "plasma torch" && !tech.isExtruder && tech.isPlasmaRange === 1
            },
            requires: "plasma torch, not extruder, plasma jet",
            effect() {
                tech.isPlasmaBall = true;
                m.fieldUpgrades[m.fieldMode].set()
            },
            remove() {
                tech.isPlasmaBall = false;
                if (this.count && m.fieldUpgrades[m.fieldMode].name === "plasma torch") m.fieldUpgrades[m.fieldMode].set()
            }
        },
        {
            name: "corona discharge",
            description: "increase the <strong>range</strong> and <strong>frequency</strong><br>of <strong class='color-plasma'>plasma</strong> ball's <strong>electric arc</strong> ",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "plasma torch" && tech.isPlasmaBall
            },
            requires: "plasma ball",
            effect() {
                tech.plasmaDischarge += 0.03
            },
            remove() {
                tech.plasmaDischarge = 0.01 //default chance per cycle of a discharge
            }
        },
        {
            name: "retrocausality",
            description: "<strong>time dilation</strong> uses <strong class='color-f'>energy</strong> to <strong>rewind</strong> your<br><strong class='color-h'>health</strong>, <strong>velocity</strong>, and <strong>position</strong> up to <strong>10 s</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "time dilation" && !m.isShipMode && !tech.isRewindAvoidDeath && !tech.isEnergyHealth && !tech.isTimeSkip && !tech.isFreezeMobs
            },
            requires: "time dilation, not CPT symmetry, mass-energy, timelike, Bose Einstein condensate",
            effect() {
                tech.isRewindField = true;
                m.fieldUpgrades[m.fieldMode].set()
                m.wakeCheck();
            },
            remove() {
                tech.isRewindField = false;
                if (this.count) m.fieldUpgrades[m.fieldMode].set()
            }
        },
        {
            name: "timelike",
            description: "<strong>time dilation</strong> doubles your relative time <strong>rate</strong><br>and makes you immune to <strong class='color-harm'>harm</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "time dilation" && !m.isShipMode && !tech.isRewindField
            },
            requires: "time dilation, not retrocausality",
            effect() {
                tech.isTimeSkip = true;
            },
            remove() {
                tech.isTimeSkip = false;
            }
        },
        {
            name: "Lorentz transformation",
            description: `use ${powerUps.orb.research(3)}to increase your time rate<br><strong>move</strong>, <strong>jump</strong>, and <strong>shoot</strong> <strong>50%</strong> faster`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "time dilation") && (build.isExperimentSelection || powerUps.research.count > 2)
            },
            requires: "time dilation",
            effect() {
                tech.isFastTime = true
                m.setMovement();
                b.setFireCD();
                for (let i = 0; i < 3; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.isFastTime = false
                m.setMovement();
                b.setFireCD();
                if (this.count > 0) powerUps.research.changeRerolls(3)
            }
        },
        {
            name: "time crystals",
            description: "<strong>quadruple</strong> your default <strong class='color-f'>energy</strong> regeneration",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return !tech.isGroundState && (m.fieldUpgrades[m.fieldMode].name === "time dilation" || m.fieldUpgrades[m.fieldMode].name === "pilot wave")
            },
            requires: "time dilation or pilot wave, not ground state",
            effect: () => {
                m.fieldRegen = 0.004
                tech.isTimeCrystals = true
            },
            remove() {
                m.fieldRegen = 0.001
                tech.isTimeCrystals = false
            }
        },
        {
            name: "no-cloning theorem",
            description: `<strong>45%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong><br>after a <strong>mob</strong> <strong>dies</strong>, lose <strong>2%</strong> <strong class='color-dup'>duplication</strong> chance`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "time dilation" || m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking")
            },
            requires: "cloaking, time dilation",
            effect() {
                tech.cloakDuplication = 0.45
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (!build.isExperimentSelection && !simulation.isTextLogOpen) simulation.circleFlare(0.4);
            },
            remove() {
                tech.cloakDuplication = 0
                powerUps.setDupChance(); //needed after adjusting duplication chance
            }
        },
        {
            name: "symbiosis",
            description: "after a <strong>mob</strong> <strong>dies</strong>, lose <strong>0.45</strong> max <strong class='color-h'>health</strong><br><strong>bosses</strong> spawn <strong>1</strong> extra <strong class='color-m'>tech</strong> after they <strong>die</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking" || m.fieldUpgrades[m.fieldMode].name === "time dilation"
            },
            requires: "cloaking or time dilation",
            effect() {
                tech.isAddRemoveMaxHealth = true
            },
            remove() {
                tech.isAddRemoveMaxHealth = false
            }
        },
        // {
        //     name: "symbiosis",
        //     description: "after a <strong>mob</strong> <strong>dies</strong>, lose <strong>0.5</strong> max <strong class='color-h'>health</strong><br>after picking up <strong class='color-m'>tech</strong> gain <strong>10</strong> max <strong class='color-h'>health</strong>",
        //     isFieldTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return (m.fieldUpgrades[m.fieldMode].name === "time dilation" || m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking")
        //     },
        //     requires: "metamaterial cloaking",
        //     effect() {
        //         tech.isAddRemoveMaxHealth = true
        //         tech.extraMaxHealth += 0.1 //increase max health
        //         m.setMaxHealth();
        //     },
        //     remove() {
        //         tech.isAddRemoveMaxHealth = false
        //     }
        // },
        // {
        //     name: "symbiosis",
        //     description: "if a <strong>mob</strong> <strong>dies</strong>, lose <strong>1%</strong> max <strong class='color-h'>health</strong><br>at the <strong>end</strong> of each level spawn <strong>2</strong> <strong class='color-m'>tech</strong>",
        //     isFieldTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return (m.fieldUpgrades[m.fieldMode].name === "time dilation" || m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking") && !tech.removeMaxHealthOnKill
        //     },
        //     requires: "metamaterial cloaking, not -symbiosis-",
        //     effect() {
        //         tech.removeMaxHealthOnKill = 0.01
        //         tech.isSpawnExitTech = true
        //         // for (let i = 0; i < 2; i++) powerUps.spawn(player.position.x + 90 * (Math.random() - 0.5), player.position.y + 90 * (Math.random() - 0.5), "tech", false);  //start
        //         for (let i = 0; i < 2; i++) powerUps.spawn(level.exit.x + 10 * (Math.random() - 0.5), level.exit.y - 100 + 10 * (Math.random() - 0.5), "tech", false) //exit
        //     },
        //     remove() {
        //         tech.removeMaxHealthOnKill = 0
        //         tech.isSpawnExitTech = false
        //     }
        // },
        {
            name: "boson composite",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Boson' class="link">boson composite</a>`,
            description: "<strong>intangible</strong> to <strong class='color-block'>blocks</strong> and mobs while <strong class='color-cloaked'>cloaked</strong><br>passing through <strong>shields</strong> drains your <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking"
            },
            requires: "metamaterial cloaking",
            effect() {
                tech.isIntangible = true;
            },
            remove() {
                if (tech.isIntangible) {
                    tech.isIntangible = false;
                    player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
                }
            }
        },
        {
            name: "dazzler",
            description: "<strong class='color-cloaked'>decloaking</strong> <strong>stuns</strong> nearby mobs<br>and drains 10 <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking"
            },
            requires: "metamaterial cloaking",
            effect() {
                tech.isCloakStun = true;
            },
            remove() {
                tech.isCloakStun = false;
            }
        },
        {
            name: "ambush",
            description: "metamaterial cloaking field <strong class='color-d'>damage</strong> effect<br>is increased from <span style = 'text-decoration: line-through;'>333%</span> to <strong>666%</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking"
            },
            requires: "metamaterial cloaking",
            effect() {
                tech.sneakAttackDmg = 7.66
            },
            remove() {
                tech.sneakAttackDmg = 4.33
            }
        },
        {
            name: "dynamical systems",
            description: `use ${powerUps.orb.research(2)}to increase your <strong class='color-d'>damage</strong> by <strong>35%</strong>`,
            // description: "use <strong>1</strong> <strong class='color-r'>research</strong><br>increase your <strong class='color-d'>damage</strong> by <strong>35%</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return (m.fieldUpgrades[m.fieldMode].name === "plasma torch" || m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking" || m.fieldUpgrades[m.fieldMode].name === "pilot wave") && (build.isExperimentSelection || powerUps.research.count > 1)
            },
            requires: "cloaking, pilot wave, or plasma torch",
            effect() {
                tech.isCloakingDamage = true
                for (let i = 0; i < 2; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.isCloakingDamage = false
                if (this.count > 0) powerUps.research.changeRerolls(2)
            }
        },
        {
            name: "discrete optimization",
            description: "increase <strong class='color-d'>damage</strong> by <strong>40%</strong><br><strong>40%</strong> increased <strong><em>delay</em></strong> after firing",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "plasma torch" || m.fieldUpgrades[m.fieldMode].name === "metamaterial cloaking" || m.fieldUpgrades[m.fieldMode].name === "pilot wave" || m.fieldUpgrades[m.fieldMode].name === "molecular assembler"
            },
            requires: "metamaterial cloaking, molecular assembler, plasma torch or pilot wave",
            effect() {
                tech.aimDamage = 1.40
                b.setFireCD();
            },
            remove() {
                tech.aimDamage = 1
                b.setFireCD();
            }
        },
        // {
        //     name: "potential well",
        //     description: "the force that <strong>pilot wave</strong> generates<br>to trap <strong class='color-block'>blocks</strong> is greatly increased",
        //     isFieldTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 2,
        //     frequencyDefault: 2,
        //     allowed() {
        //         return m.fieldUpgrades[m.fieldMode].name === "pilot wave"
        //     },
        //     requires: "pilot wave",
        //     effect() {
        //         tech.pilotForce = 0.0006
        //     },
        //     remove() {
        //         tech.pilotForce = 0.00002
        //     }
        // },
        {
            name: "WIMPs",
            description: `at the end of each <strong>level</strong> spawn ${powerUps.orb.research(5)}<br> and a <strong class='color-harm'>harmful</strong> particle that slowly <strong>chases</strong> you`,
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            frequency: 1,
            frequencyDefault: 1,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole" || m.fieldUpgrades[m.fieldMode].name === "pilot wave"
            },
            requires: "wormhole or pilot wave",
            effect: () => {
                tech.wimpCount++
                spawn.WIMP()
                for (let j = 0, len = 1 + 5 * Math.random(); j < len; j++) powerUps.spawn(level.exit.x + 100 * (Math.random() - 0.5), level.exit.y - 100 + 100 * (Math.random() - 0.5), "research", false)
            },
            remove() {
                tech.wimpCount = 0
            }
        },
        {
            name: "virtual particles",
            description: `use ${powerUps.orb.research(4)}to exploit your <strong class='color-worm'>wormhole</strong> for a<br><strong>12%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong>`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole" && (build.isExperimentSelection || powerUps.research.count > 3)
            },
            requires: "wormhole",
            effect() {
                tech.wormDuplicate = 0.12
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (!build.isExperimentSelection && !simulation.isTextLogOpen) simulation.circleFlare(0.13);
                for (let i = 0; i < 4; i++) {
                    if (powerUps.research.count > 0) powerUps.research.changeRerolls(-1)
                }
            },
            remove() {
                tech.wormDuplicate = 0
                powerUps.setDupChance(); //needed after adjusting duplication chance
                if (this.count > 0) powerUps.research.changeRerolls(4)
            }
        },
        {
            name: "Penrose process",
            description: "after a <strong class='color-block'>block</strong> falls into a <strong class='color-worm'>wormhole</strong><br>you gain <strong>53</strong> <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormholeEnergy = true
            },
            remove() {
                tech.isWormholeEnergy = false
            }
        },
        {
            name: "transdimensional worms",
            link: `<a target="_blank" href='https://en.wikipedia.org/wiki/Dimension' class="link">transdimensional worms</a>`,
            description: "when <strong class='color-block'>blocks</strong> fall into a <strong class='color-worm'>wormhole</strong><br>higher dimension <strong class='color-p' style='letter-spacing: 2px;'>worms</strong> are summoned",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormholeWorms = true
            },
            remove() {
                tech.isWormholeWorms = false
            }
        },
        {
            name: "geodesics",
            description: `your <strong>projectiles</strong> can traverse <strong class='color-worm'>wormholes</strong><br>spawn 2 <strong class='color-g'>guns</strong> and ${powerUps.orb.ammo(2)}`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormBullets = true
                for (let i = 0; i < 2; i++) {
                    powerUps.spawn(m.pos.x, m.pos.y, "gun");
                    powerUps.spawn(m.pos.x, m.pos.y, "ammo");
                }
            },
            remove() {
                if (tech.isWormBullets) {
                    for (let i = 0; i < 2; i++) {
                        if (b.inventory.length) b.removeGun(b.guns[b.inventory[b.inventory.length - 1]].name) //remove your last gun
                    }
                    tech.isWormBullets = false;
                }
            }
        },
        {
            name: "cosmic string",
            description: "<strong>stun</strong> and do <strong class='color-p'>radioactive</strong> <strong class='color-d'>damage</strong> to <strong>mobs</strong><br>if you tunnel through them with a <strong class='color-worm'>wormhole</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormholeDamage = true
            },
            remove() {
                tech.isWormholeDamage = false
            }
        },
        {
            name: "invariant",
            description: "use <strong class='color-f'>energy</strong> to <strong>pause</strong> time<br>while placing your <strong class='color-worm'>wormhole</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormHolePause = true
            },
            remove() {
                tech.isWormHolePause = false
            }
        },
        {
            name: "charmed baryons",
            description: `<strong class='color-worm'>wormholes</strong> require <strong>zero</strong> <strong class='color-f'>energy</strong><br><strong>move</strong> and <strong>jump</strong> <strong>33%</strong> <strong>slower</strong>`,
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole" && !tech.isWormholeMapIgnore
            },
            requires: "wormhole, not affine connection",
            effect() {
                tech.isFreeWormHole = true
                tech.baseFx *= 0.66
                tech.baseJumpForce *= 0.66
                m.setMovement()
            },
            //also removed in m.setHoldDefaults() if player switches into a bad field
            remove() {
                tech.isFreeWormHole = false
                if (!tech.isNeutronium) {
                    tech.baseFx = 0.08
                    tech.baseJumpForce = 10.5
                    m.setMovement()
                }
            }
        },
        {
            name: "affine connection",
            description: "<strong class='color-worm'>wormholes</strong> can tunnel through the <strong>map</strong><br>at <strong>200%</strong> increased <strong class='color-f'>energy</strong> cost",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            frequency: 2,
            frequencyDefault: 2,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name === "wormhole" && !tech.isFreeWormHole
            },
            requires: "wormhole, not charmed baryons",
            effect() {
                tech.isWormholeMapIgnore = true
            },
            remove() {
                tech.isWormholeMapIgnore = false
            }
        },
        //************************************************** 
        //************************************************** experimental
        //************************************************** modes
        //************************************************** 
        {
            name: "-ship-",
            description: "<strong style='color: #f55;'>experiment:</strong> fly around with no legs<br>aim with the keyboard",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection && !m.isShipMode && m.fieldUpgrades[m.fieldMode].name !== "negative mass"
            },
            requires: "",
            effect() {
                m.shipMode()
            },
            remove() {}
        },
        {
            name: "-quantum leap-",
            description: "<strong style='color: #f55;'>experiment:</strong> every 20 seconds<br>become an <strong class='alt'>alternate</strong> version of yourself",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            interval: undefined,
            effect() {
                this.interval = setInterval(() => {
                    if (!build.isExperimentSelection) {
                        m.switchWorlds()
                        simulation.trails()
                    }
                }, 20000); //every 20 seconds

            },
            remove() {
                if (this.count > 0) clearTimeout(this.interval);
            }
        },
        {
            name: "-shields-",
            description: "<strong style='color: #f55;'>experiment:</strong> every 5 seconds<br>all mobs gain a shield",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            effect() {
                this.interval = setInterval(() => {
                    if (!build.isExperimentSelection) {
                        for (let i = 0; i < mob.length; i++) {
                            if (!mob[i].isShielded && !mob[i].shield && mob[i].isDropPowerUp) spawn.shield(mob[i], mob[i].position.x, mob[i].position.y, 1, true);
                        }
                    }
                }, 5000); //every 5 seconds
            },
            interval: undefined,
            remove() {
                if (this.count > 0) clearTimeout(this.interval);
            }
        },
        {
            name: "-Fourier analysis-",
            description: "<strong style='color: #f55;'>experiment:</strong> your aiming is random",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection && !m.isShipMode
            },
            requires: "not ship",
            effect() {
                m.look = () => {
                    m.angle = 2 * Math.sin(m.cycle * 0.0133) + Math.sin(m.cycle * 0.013) + 0.5 * Math.sin(m.cycle * 0.031) + 0.33 * Math.sin(m.cycle * 0.03)
                    const scale = 0.8;
                    m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                    m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;
                    m.transX += (m.transSmoothX - m.transX) * 0.07;
                    m.transY += (m.transSmoothY - m.transY) * 0.07;
                }
            },
            remove() {
                if (this.count > 0) m.look = m.lookDefault()
            }
        },
        {
            name: "-panopticon-",
            description: "<strong style='color: #f55;'>experiment:</strong> mobs can always see you",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            effect() {
                this.interval = setInterval(() => {
                    if (!build.isExperimentSelection) {
                        for (let i = 0; i < mob.length; i++) {
                            if (!mob[i].shield && mob[i].isDropPowerUp) {
                                mob[i].locatePlayer()
                                mob[i].seePlayer.yes = true;
                            }
                        }
                    }
                }, 1000); //every 1 seconds
            },
            interval: undefined,
            remove() {
                if (this.count > 0) clearTimeout(this.interval);
            }
        },
        {
            name: "-decomposers-",
            description: "<strong style='color: #f55;'>experiment:</strong> after they die<br>mobs leave behind spawns",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            effect() {
                tech.deathSpawns = 0.2
            },
            remove() {
                tech.deathSpawns = 0
            }
        },
        {
            name: "-WIMP-",
            description: "<strong style='color: #f55;'>experiment:</strong> <strong class='color-harm'>harmful</strong> particles slowly <strong>chase</strong> you",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            effect() {
                tech.wimpExperiment = 5
            },
            remove() {
                tech.wimpExperiment = 0
            }
        },
        {
            name: "-symbiosis-",
            description: "<strong style='color: #f55;'>experiment:</strong> if you <strong>kill</strong> a <strong>mob</strong><br>lose <strong>0.2</strong> max <strong class='color-h'>health</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            effect() {
                tech.removeMaxHealthOnKill = 0.002
            },
            remove() {
                tech.removeMaxHealthOnKill = 0
            }
        },
        {
            name: "-parthenocarpy-",
            description: "<strong style='color: #f55;'>experiment:</strong> spawn about 50% more mobs",
            maxCount: 1,
            count: 1,
            frequency: 0,
            isBadRandomOption: true,
            isExperimentalMode: true,
            allowed() {
                return build.isExperimentSelection
            },
            requires: "",
            effect() {
                tech.isMoreMobs = true
            },
            remove() {
                tech.isMoreMobs = false
            }
        },
        //************************************************** 
        //************************************************** JUNK
        //************************************************** tech
        //************************************************** 
        // {
        //     name: "junk",
        //     description: "",
        //     maxCount: 9,
        //     count: 0,
        //     frequency: 0,
        //     isNonRefundable: true,
        //     isJunk: true,
        //     allowed() {
        //         return true
        //     },
        //     requires: "",
        //     effect() {

        //     },
        //     remove() {}
        // },
        {
            name: "discount",
            description: "get 3 random <strong class='color-j'>JUNK</strong> <strong class='color-m'>tech</strong> for the price of 1!",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.giveRandomJUNK()
                tech.giveRandomJUNK()
                tech.giveRandomJUNK()
            },
            remove() {}
        },
        {
            name: "hi",
            description: `spawn to seed`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                document.getElementById("seed").placeholder = Math.initialSeed = String(616)
                Math.seed = Math.abs(Math.hash(Math.initialSeed)) //update randomizer seed in case the player changed it

            },
            remove() {}
        },
        {
            name: "meteor shower",
            description: "take a shower, but meteors instead of water",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                setInterval(() => {

                    fireBlock = function(xPos, yPos) {
                        const index = body.length
                        spawn.bodyRect(xPos, yPos, 20 + 50 * Math.random(), 20 + 50 * Math.random());
                        const bodyBullet = body[body.length - 1]
                        Matter.Body.setVelocity(body[index], { x: 5 * (Math.random() - 0.5), y: 10 * (Math.random() - 0.5) });
                        body[index].collisionFilter.category = cat.body;
                        body[index].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                        body[index].classType = "body";
                        Composite.add(engine.world, body[index]); //add to world
                        setTimeout(() => { //remove block
                            for (let i = 0; i < body.length; i++) {
                                if (body[i] === bodyBullet) {
                                    Matter.Composite.remove(engine.world, body[i]);
                                    body.splice(i, 1);
                                }
                            }
                        }, 3000 + Math.floor(6000 * Math.random()));
                    }
                    fireBlock(player.position.x + 600 * (Math.random() - 0.5), player.position.y - 500 - 500 * Math.random());
                    // for (let i = 0, len =  Math.random(); i < len; i++) {
                    // }

                }, 1000);
            },
            remove() {}
        },
        {
            name: "Higgs phase transition",
            description: "instantly spawn 5 <strong class='color-m'>tech</strong>, but add a chance to<br>remove everything with a 5 minute <strong>half-life</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            frequencyDefault: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                powerUps.spawn(m.pos.x, m.pos.y, "tech");
                powerUps.spawn(m.pos.x + 30, m.pos.y, "tech");
                powerUps.spawn(m.pos.x + 60, m.pos.y, "tech");
                powerUps.spawn(m.pos.x, m.pos.y - 30, "tech");
                powerUps.spawn(m.pos.x + 30, m.pos.y - 60, "tech");

                function loop() {
                    // (1-X)^cycles = chance to be removed //Math.random() < 0.000019  10 min
                    if (!simulation.paused && m.alive) {
                        if (Math.random() < 0.000038) {
                            // m.death();
                            simulation.clearMap();
                            simulation.draw.setPaths();
                            return
                        }
                    }
                    requestAnimationFrame(loop);
                }
                requestAnimationFrame(loop);
            },
            remove() {}
        },
        {
            name: "harvest",
            description: "convert all the mobs on this level into <strong class='color-ammo'>ammo</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            frequencyDefault: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                for (let i = 0, len = mob.length; i < len; i++) {
                    if (mob[i].isDropPowerUp) {
                        powerUps.directSpawn(mob[i].position.x, mob[i].position.y, "ammo");
                        mob[i].death();
                    }
                }
                for (let i = powerUp.length - 1; i > -1; i--) {
                    if (powerUp[i].name !== "ammo") {
                        Matter.Composite.remove(engine.world, powerUp[i]);
                        powerUp.splice(i, 1);
                    }
                }
            },
            remove() {}
        },
        {
            name: "brainstorm",
            description: "the <strong class='color-m'>tech</strong> choice menu <strong>randomizes</strong><br>every <strong>0.5</strong> seconds for <strong>10</strong> seconds",
            maxCount: 1,
            count: 0,
            frequency: 0,
            frequencyDefault: 0,
            isJunk: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isBrainstorm = true
                tech.isBrainstormActive = false
                tech.brainStormDelay = 30
            },
            remove() {
                tech.isBrainstorm = false
                tech.isBrainstormActive = false
            }
        },
        {
            name: "catabolysis",
            description: `set your <strong>maximum</strong> <strong class='color-h'>health</strong> to <strong>1</strong><br><strong>double</strong> your current <strong class='color-ammo'>ammo</strong> <strong>10</strong> times`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return !tech.isFallingDamage && !tech.isOverHeal && !tech.isEnergyHealth },
            requires: "not quenching, tungsten carbide, mass-energy",
            effect() {
                m.baseHealth = 0.01
                m.setMaxHealth();
                for (let i = 0; i < b.guns.length; i++) b.guns[i].ammo = b.guns[i].ammo * Math.pow(2, 10)
                simulation.updateGunHUD();
            },
            remove() {}
        },
        {
            name: "density",
            description: `<strong class='color-block'>blocks</strong> are <strong>10</strong> times less <strong>dense</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = 0; i < body.length; i++) Matter.Body.setDensity(body[i], 0.0001) //set current blocks to low density

                level.addToWorld = () => {
                    for (let i = 0; i < body.length; i++) {
                        if (body[i] !== m.holdingTarget && !body[i].isNoSetCollision) {
                            body[i].collisionFilter.category = cat.body;
                            body[i].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                        }
                        Matter.Body.setDensity(body[i], 0.0001) //THIS IS THE ONLY ADDED LINE OF CODE
                        body[i].classType = "body";
                        Composite.add(engine.world, body[i]); //add to world
                    }
                    for (let i = 0; i < map.length; i++) {
                        map[i].collisionFilter.category = cat.map;
                        map[i].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                        Matter.Body.setStatic(map[i], true); //make static
                        Composite.add(engine.world, map[i]); //add to world
                    }
                }
            },
            remove() {
                if (this.count) m.look = m.lookDefault
            }
        },
        {
            name: "palantír",
            description: `see far away lands`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            // isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                m.look = () => {
                    //always on mouse look
                    m.angle = Math.atan2(
                        simulation.mouseInGame.y - m.pos.y,
                        simulation.mouseInGame.x - m.pos.x
                    );
                    //smoothed mouse look translations
                    const scale = 2;
                    m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                    m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;
                    m.transX += (m.transSmoothX - m.transX) * m.lookSmoothing;
                    m.transY += (m.transSmoothY - m.transY) * m.lookSmoothing;
                }
            },
            remove() {
                if (this.count) m.look = m.lookDefault
            }
        },
        {
            name: "motion sickness",
            description: `disable camera smoothing`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            // isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                m.look = () => {
                    //always on mouse look
                    m.angle = Math.atan2(
                        simulation.mouseInGame.y - m.pos.y,
                        simulation.mouseInGame.x - m.pos.x
                    );
                    //smoothed mouse look translations
                    const scale = 1.2;
                    m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                    m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;
                    m.transX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                    m.transY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;
                    // m.transX += (m.transSmoothX - m.transX) * m.lookSmoothing;
                    // m.transY += (m.transSmoothY - m.transY) * m.lookSmoothing;
                }
            },
            remove() {
                if (this.count) m.look = m.lookDefault
            }
        },
        {
            name: "facsimile",
            description: `inserts a copy of your current level into the level list`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                level.levels.splice(level.onLevel, 0, level.levels[level.onLevel]);
            },
            remove() {}
        },
        {
            name: "negative friction",
            description: "when you touch walls you speed up instead of slowing down. It's kinda fun.",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                player.friction = -0.4
            },
            remove() {
                if (this.count) player.friction = 0.002
            }
        },
        {
            name: "bounce",
            description: "you bounce off things.  It's annoying, but not that bad.",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                player.restitution = 0.9
            },
            remove() {
                if (this.count) player.restitution = 0
            }
        },
        {
            name: "mouth",
            description: "mobs have a non functional mouth",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                mobs.draw = () => {
                    ctx.lineWidth = 2;
                    let i = mob.length;
                    while (i--) {
                        ctx.beginPath();
                        const vertices = mob[i].vertices;
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
                        ctx.quadraticCurveTo(mob[i].position.x, mob[i].position.y, vertices[0].x, vertices[0].y);
                        ctx.fillStyle = mob[i].fill;
                        ctx.strokeStyle = mob[i].stroke;
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            },
            remove() {
                mobs.draw = () => {
                    ctx.lineWidth = 2;
                    let i = mob.length;
                    while (i--) {
                        ctx.beginPath();
                        const vertices = mob[i].vertices;
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
                        ctx.lineTo(vertices[0].x, vertices[0].y);
                        ctx.fillStyle = mob[i].fill;
                        ctx.strokeStyle = mob[i].stroke;
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
        },
        {
            name: "all-stars",
            description: "make all mobs look like stars",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                mobs.draw = () => {
                    ctx.lineWidth = 2;
                    let i = mob.length;
                    while (i--) {
                        ctx.beginPath();
                        const vertices = mob[i].vertices;
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let j = 1, len = vertices.length; j < len; ++j) ctx.quadraticCurveTo(mob[i].position.x, mob[i].position.y, vertices[j].x, vertices[j].y);
                        ctx.quadraticCurveTo(mob[i].position.x, mob[i].position.y, vertices[0].x, vertices[0].y);
                        ctx.fillStyle = mob[i].fill;
                        ctx.strokeStyle = mob[i].stroke;
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            },
            remove() {
                mobs.draw = () => {
                    ctx.lineWidth = 2;
                    let i = mob.length;
                    while (i--) {
                        ctx.beginPath();
                        const vertices = mob[i].vertices;
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
                        ctx.lineTo(vertices[0].x, vertices[0].y);
                        ctx.fillStyle = mob[i].fill;
                        ctx.strokeStyle = mob[i].stroke;
                        ctx.fill();
                        ctx.stroke();
                    }
                }
            }
        },
        // draw() {
        //     ctx.lineWidth = 2;
        //     let i = mob.length;
        //     while (i--) {
        //         ctx.beginPath();
        //         const vertices = mob[i].vertices;
        //         ctx.moveTo(vertices[0].x, vertices[0].y);
        //         for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
        //         ctx.lineTo(vertices[0].x, vertices[0].y);
        //         ctx.fillStyle = mob[i].fill;
        //         ctx.strokeStyle = mob[i].stroke;
        //         ctx.fill();
        //         ctx.stroke();
        //     }
        // },
        {
            name: "true colors",
            description: `set all power ups to their real world colors`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                // const colors = shuffle(["#f7b", "#0eb", "#467", "#0cf", "hsl(246,100%,77%)", "#26a"])
                const colors = shuffle([powerUps.research.color, powerUps.heal.color, powerUps.ammo.color, powerUps.ammo.color, powerUps.field.color, powerUps.gun.color])
                powerUps.research.color = colors[0]
                powerUps.heal.color = colors[1]
                powerUps.ammo.color = colors[2]
                powerUps.field.color = colors[3]
                powerUps.tech.color = colors[4]
                powerUps.gun.color = colors[5]
                for (let i = 0; i < powerUp.length; i++) {
                    switch (powerUp[i].name) {
                        case "research":
                            powerUp[i].color = colors[0]
                            break;
                        case "heal":
                            powerUp[i].color = colors[1]
                            break;
                        case "ammo":
                            powerUp[i].color = colors[2]
                            break;
                        case "field":
                            powerUp[i].color = colors[3]
                            break;
                        case "tech":
                            powerUp[i].color = colors[4]
                            break;
                        case "gun":
                            powerUp[i].color = colors[5]
                            break;
                    }
                }
            },
            remove() {
                const colors = ["#f7b", "#0eb", "#467", "#0cf", "hsl(246,100%,77%)", "#26a"] //no shuffle
                powerUps.research.color = colors[0]
                powerUps.heal.color = colors[1]
                powerUps.ammo.color = colors[2]
                powerUps.field.color = colors[3]
                powerUps.tech.color = colors[4]
                powerUps.gun.color = colors[5]
                for (let i = 0; i < powerUp.length; i++) {
                    switch (powerUp[i].name) {
                        case "research":
                            powerUp[i].color = colors[0]
                            break;
                        case "heal":
                            powerUp[i].color = colors[1]
                            break;
                        case "ammo":
                            powerUp[i].color = colors[2]
                            break;
                        case "field":
                            powerUp[i].color = colors[3]
                            break;
                        case "tech":
                            powerUp[i].color = colors[4]
                            break;
                        case "gun":
                            powerUp[i].color = colors[5]
                            break;
                    }
                }
            }
        },
        {
            name: "emergency broadcasting",
            description: "emit 2 sine waveforms at 853 Hz and 960 Hz<br><em>lower your volume</em>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() { return true },
            requires: "",
            effect: () => {
                //setup audio context
                function tone(frequency) {
                    const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
                    const oscillator1 = audioCtx.createOscillator();
                    const gainNode1 = audioCtx.createGain();
                    gainNode1.gain.value = 0.5; //controls volume
                    oscillator1.connect(gainNode1);
                    gainNode1.connect(audioCtx.destination);
                    oscillator1.type = "sine"; // 'sine' 'square', 'sawtooth', 'triangle' and 'custom'
                    oscillator1.frequency.value = frequency; // value in hertz
                    oscillator1.start();
                    return audioCtx
                }
                // let sound = tone(1050)

                function EBS() {
                    const audioCtx = new(window.AudioContext || window.webkitAudioContext)();

                    const oscillator1 = audioCtx.createOscillator();
                    const gainNode1 = audioCtx.createGain();
                    gainNode1.gain.value = 0.3; //controls volume
                    oscillator1.connect(gainNode1);
                    gainNode1.connect(audioCtx.destination);
                    oscillator1.type = "sine"; // 'sine' 'square', 'sawtooth', 'triangle' and 'custom'
                    oscillator1.frequency.value = 850; // value in hertz
                    oscillator1.start();

                    const oscillator2 = audioCtx.createOscillator();
                    const gainNode2 = audioCtx.createGain();
                    gainNode2.gain.value = 0.3; //controls volume
                    oscillator2.connect(gainNode2);
                    gainNode2.connect(audioCtx.destination);
                    oscillator2.type = "sine"; // 'sine' 'square', 'sawtooth', 'triangle' and 'custom'
                    oscillator2.frequency.value = 957; // value in hertz
                    oscillator2.start();
                    return audioCtx
                }
                let sound = EBS()

                delay = 1000
                setTimeout(() => {
                    sound.suspend()
                    powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
                    setTimeout(() => {
                        sound.resume()
                        setTimeout(() => {
                            sound.suspend()
                            powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
                            setTimeout(() => {
                                sound.resume()
                                setTimeout(() => {
                                    sound.suspend()
                                    powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
                                    setTimeout(() => {
                                        sound.resume()
                                        setTimeout(() => {
                                            sound.suspend()
                                            powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
                                            setTimeout(() => {
                                                sound.resume()
                                                setTimeout(() => {
                                                    sound.suspend()
                                                    powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
                                                    setTimeout(() => {
                                                        sound.resume()
                                                        setTimeout(() => {
                                                            sound.suspend()
                                                            sound.close()
                                                            powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
                                                        }, delay);
                                                    }, delay);
                                                }, delay);
                                            }, delay);
                                        }, delay);
                                    }, delay);
                                }, delay);
                            }, delay);
                        }, delay);
                    }, delay);
                }, delay);
            },
            remove() {}
        },
        {
            name: "automatic",
            description: "you can't fire when moving<br>always <strong>fire</strong> when at <strong>rest</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() {
                return !tech.isFireMoveLock
            },
            requires: "not Higgs mechanism",
            effect: () => {
                tech.isAlwaysFire = true;
                b.setFireMethod();
            },
            remove() {
                if (tech.isAlwaysFire) {
                    tech.isAlwaysFire = false
                    b.setFireMethod();
                }
            }
        },
        {
            name: "hidden variable",
            description: `spawn ${powerUps.orb.heal(20)}<br>but hide your <strong class='color-h'>health</strong> bar`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy",
            effect() {
                document.getElementById("health").style.display = "none"
                document.getElementById("health-bg").style.display = "none"
                for (let i = 0; i < 20; i++) powerUps.spawn(m.pos.x + 160 * (Math.random() - 0.5), m.pos.y + 160 * (Math.random() - 0.5), "heal");
            },
            remove() {}
        },
        {
            name: "not a bug",
            description: "initiate a totally safe game crash for 10 seconds",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                const savedfunction = simulation.drawCircle
                simulation.drawCircle = () => {
                    const a = mob[Infinity].position //crashed the game in a visually interesting way, because of the ctx.translate command is never reverted in the main game loop
                }
                setTimeout(() => {
                    simulation.drawCircle = savedfunction
                    canvas.width = canvas.width //clears the canvas // works on chrome at least
                    powerUps.spawn(m.pos.x, m.pos.y, "tech");
                }, 10000);

                // for (;;) {} //freezes the tab
            },
            remove() {}
        },
        {
            name: "posture",
            description: "stand a bit taller",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                m.yOffWhen.stand = 70
            },
            remove() {
                m.yOffWhen.stand = 49
            }
        },
        {
            name: "rhythm",
            description: "you oscillate up and down",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                setInterval(() => {
                    m.yOffWhen.stand = 53 + 28 * Math.sin(simulation.cycle * 0.2)
                    if (m.onGround && !m.crouch) m.yOffGoal = m.yOffWhen.stand
                }, 100);
            },
            remove() {}
        },
        {
            name: "spinor",
            description: "the direction you aim is determined by your position",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                m.look = function() {
                    //always on mouse look
                    m.angle = (((m.pos.x + m.pos.y) / 100 + Math.PI) % Math.PI * 2) - Math.PI
                    //smoothed mouse look translations
                    const scale = 0.8;
                    m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                    m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;

                    m.transX += (m.transSmoothX - m.transX) * 0.07;
                    m.transY += (m.transSmoothY - m.transY) * 0.07;
                }
            },
            remove() {
                if (this.count) m.look = m.lookDefault
            }
        },
        {
            name: "decomposers",
            description: "after they die <strong>mobs</strong> leave behind <strong>spawns</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return tech.deathSpawns === 0
            },
            requires: "",
            effect() {
                tech.deathSpawns = 0.2
            },
            remove() {
                tech.deathSpawns = 0
            }
        },
        {
            name: "panopticon",
            description: "<strong>mobs</strong> can always see you",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => {
                    for (let i = 0; i < mob.length; i++) {
                        if (!mob[i].shield && mob[i].isDropPowerUp) {
                            mob[i].locatePlayer()
                            mob[i].seePlayer.yes = true;
                        }
                    }
                }, 1000); //every 1 seconds
            },
            remove() {}
        },
        // {
        //     name: "inverted mouse",
        //     description: "your mouse is scrambled<br>it's fine, just rotate it 90 degrees",
        //     maxCount: 1,
        //     count: 0,
        //     frequency: 0,
        //     isExperimentHide: true,
        //     isNonRefundable: true,
        //     isJunk: true,
        //     allowed() {
        //         return !m.isShipMode
        //     },
        //     requires: "not ship",
        //     effect() {
        //         document.body.addEventListener("mousemove", (e) => {
        //             const ratio = window.innerWidth / window.innerHeight
        //             simulation.mouse.x = e.clientY * ratio
        //             simulation.mouse.y = e.clientX / ratio;
        //         });
        //     },
        //     remove() {
        //         // m.look = m.lookDefault
        //     }
        // },
        {
            name: "Fourier analysis",
            description: "your aiming is now controlled by this equation:<br><span style = 'font-size:80%;'>2sin(0.0133t) + sin(0.013t) + 0.5sin(0.031t)+ 0.33sin(0.03t)</span>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "not ship",
            effect() {
                m.look = () => {
                    m.angle = 2 * Math.sin(m.cycle * 0.0133) + Math.sin(m.cycle * 0.013) + 0.5 * Math.sin(m.cycle * 0.031) + 0.33 * Math.sin(m.cycle * 0.03)
                    const scale = 0.8;
                    simulation.mouse.y
                    m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                    m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;
                    m.transX += (m.transSmoothX - m.transX) * 0.07;
                    m.transY += (m.transSmoothY - m.transY) * 0.07;
                }
            },
            remove() {
                if (this.count) m.look = m.lookDefault
            }
        },
        {
            name: "disintegrated armament",
            description: "spawn a <strong class='color-g'>gun</strong><br><strong>remove</strong> your active <strong class='color-g'>gun</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return b.inventory.length > 0
            },
            requires: "at least 1 gun",
            effect() {
                if (b.inventory.length > 0) b.removeGun(b.guns[b.activeGun].name)
                simulation.makeGunHUD()
                powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "gun");
            },
            remove() {}
        },
        {
            name: "probability",
            description: "increase the <strong class='flicker'>frequency</strong><br>of one random <strong class='color-m'>tech</strong> by <strong>100</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                let options = []; //find what tech I could get
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (
                        tech.tech[i].count < tech.tech[i].maxCount &&
                        tech.tech[i].allowed() &&
                        !tech.tech[i].isJunk &&
                        !tech.tech.isLore
                    ) {
                        options.push(i);
                    }
                }
                if (options.length) {
                    const index = options[Math.floor(Math.random() * options.length)]
                    tech.tech[index].frequency = 100
                }
            },
            remove() {}
        },
        {
            name: "encryption",
            description: "secure <strong class='color-m'>tech</strong> information",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                String.prototype.shuffle = function() {
                    var a = this.split(""),
                        n = a.length;

                    for (var i = n - 1; i > 0; i--) {
                        var j = Math.floor(Math.random() * (i + 1));
                        var tmp = a[i];
                        a[i] = a[j];
                        a[j] = tmp;
                    }
                    return a.join("");
                }

                for (let i = 0, len = tech.tech.length; i < len; i++) tech.tech[i].name = tech.tech[i].name.shuffle()
            },
            remove() {}
        },
        {
            name: "transparency",
            description: "become invisible to yourself<br><em>mobs can still see you</em>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                m.draw = () => {}
            },
            remove() {}
        },
        {
            name: "quantum leap",
            description: "become an <strong class='alt'>alternate</strong> version of yourself<br>every <strong>20</strong> seconds",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => {
                    m.switchWorlds()
                    simulation.trails()
                }, 20000); //every 30 seconds
            },
            remove() {}
        },
        {
            name: "score",
            description: "Add a score to n-gon!",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => {
                    let score = Math.ceil(1000 * Math.random() * Math.random() * Math.random() * Math.random() * Math.random())
                    simulation.makeTextLog(`simulation.score <span class='color-symbol'>=</span> ${score.toFixed(0)}`);
                }, 10000); //every 10 seconds
            },
            remove() {}
        },
        {
            name: "pop-ups",
            description: "sign up to learn endless easy ways to win n-gon<br>that Landgreen doesn't want you to know!!!1!!",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => {
                    alert(`The best combo is ${tech.tech[Math.floor(Math.random() * tech.tech.length)].name} with ${tech.tech[Math.floor(Math.random() * tech.tech.length)].name}!`);
                }, 30000); //every 30 seconds
            },
            remove() {}
        },
        {
            name: "music",
            description: "add music to n-gon",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                window.open('https://www.youtube.com/watch?v=lEbHeSdmS-k&list=PL9Z5wjoBiPKEDhwCW2RN-VZoCpmhIojdn', '_blank')
            },
            remove() {}
        },
        {
            name: "performance",
            description: "display performance stats to n-gon",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                (function() {
                    var script = document.createElement('script');
                    script.onload = function() {
                        var stats = new Stats();
                        document.body.appendChild(stats.dom);
                        requestAnimationFrame(function loop() {
                            stats.update();
                            requestAnimationFrame(loop)
                        });
                    };
                    script.src = 'https://unpkg.com/stats.js@0.17.0/build/stats.min.js';
                    document.head.appendChild(script);
                })()
                //move health to the right
                document.getElementById("health").style.left = "86px"
                document.getElementById("health-bg").style.left = "86px"
            },
            remove() {}
        },
        {
            name: "repartitioning",
            description: "set the <strong class='flicker'>frequency</strong> of finding normal <strong class='color-m'>tech</strong> to <strong>0</strong><br>spawn 5 <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = 0, len = tech.tech.length; i < len; i++) {
                    if (tech.tech[i].isJunk) {
                        tech.tech[i].frequency = 2
                    } else {
                        tech.tech[i].frequency = 0
                    }
                }
                for (let i = 0; i < 5; i++) powerUps.spawn(m.pos.x, m.pos.y, "tech");
            },
            remove() {}
        },
        {
            name: "defragment",
            description: "set the <strong class='flicker'>frequency</strong> of finding <strong class='color-j'>JUNK</strong> <strong class='color-m'>tech</strong> to zero",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = tech.tech.length - 1; i > 0; i--) {
                    if (tech.tech[i].isJunk) tech.tech[i].frequency = 0
                }
            },
            remove() {}
        },
        {
            name: "ship",
            description: "fly around with no legs<br>reduce combat <strong>difficulty</strong> by <strong>1 level</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !m.isShipMode && m.fieldUpgrades[m.fieldMode].name !== "negative mass"
            },
            requires: "",
            effect() {
                m.shipMode()
                level.difficultyDecrease(simulation.difficultyMode)
            },
            remove() {}
        },
        // {
        //     name: "lubrication",
        //     description: "reduce block density and friction for this level",
        //     maxCount: 9,
        //     count: 0,
        //     frequency: 0,
        //     isNonRefundable: true,
        //     isExperimentHide: true,
        //     isJunk: true,
        //     allowed() {
        //         return true
        //     },
        //     requires: "",
        //     effect() {
        //         for (let i = 0; i < body.length; i++) {
        //             Matter.Body.setDensity(body[i], 0.0001) // 0.001 is normal
        //             body[i].friction = 0.01
        //         }
        //     },
        //     remove() {}
        // },
        {
            name: "pitch",
            description: "oscillate the pitch of your world",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => { if (!simulation.paused) ctx.rotate(0.001 * Math.sin(simulation.cycle * 0.01)) }, 16);
            },
            remove() {}
        },
        {
            name: "umbra",
            description: "produce a blue glow around everything<br>and probably some simulation lag",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                ctx.shadowColor = '#06f';
                ctx.shadowBlur = 25;
            },
            remove() {}
        },
        {
            name: "lighter",
            description: `ctx.globalCompositeOperation = "lighter"`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return m.fieldUpgrades[m.fieldMode].name !== "negative mass"
            },
            requires: "",
            effect() {
                ctx.globalCompositeOperation = "lighter";
            },
            remove() {}
        },
        {
            name: "rewind",
            description: "every 10 seconds <strong class='color-rewind'>rewind</strong> <strong>2</strong> seconds",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => { m.rewind(120) }, 10000);
                // for (let i = 0; i < 24; i++) {
                //     setTimeout(() => { m.rewind(120) }, i * 5000);
                // }
            },
            remove() {}
        },
        {
            name: "undo",
            description: "every 4 seconds <strong class='color-rewind'>rewind</strong> <strong>1/2</strong> a second",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => { m.rewind(30) }, 4000);
            },
            remove() {}
        },
        {
            name: "energy to mass conversion",
            description: "convert your <strong class='color-f'>energy</strong> into <strong class='color-block'>blocks</strong>",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = 0, len = 40; i < len; i++) {
                    setTimeout(() => {
                        m.energy -= 1 / len
                        const index = body.length
                        where = Vector.add(m.pos, { x: 400 * (Math.random() - 0.5), y: 400 * (Math.random() - 0.5) })
                        spawn.bodyRect(where.x, where.y, Math.floor(15 + 100 * Math.random()), Math.floor(15 + 100 * Math.random()));
                        body[index].collisionFilter.category = cat.body;
                        body[index].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                        body[index].classType = "body";
                        Composite.add(engine.world, body[index]); //add to world
                    }, i * 100);
                }

            },
            remove() {}
        },
        {
            name: "level.nextLevel()",
            description: "advance to the next level",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                level.nextLevel();
            },
            remove() {}
        },
        {
            name: "expert system",
            description: "spawn a <strong class='color-m'>tech</strong> power up<br><strong>+64%</strong> <strong class='color-j'>JUNK</strong> to the potential <strong class='color-m'>tech</strong> pool",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                powerUps.spawn(m.pos.x, m.pos.y, "tech");
                tech.addJunkTechToPool(0.64)
            },
            remove() {}
        },
        {
            name: "energy investment",
            description: "every 10 seconds drain your <strong class='color-f'>energy</strong><br>return it doubled 5 seconds later",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => {
                    if (!simulation.paused) {
                        const energy = m.energy
                        m.energy = 0
                        setTimeout(() => { //return energy
                            m.energy += 2 * energy
                        }, 5000);
                    }
                }, 10000);
            },
            remove() {}
        },
        {
            name: "missile launching system",
            description: "fire missiles for the next 120 seconds",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = 0; i < 120; i++) {
                    setTimeout(() => {
                        const where = {
                            x: m.pos.x,
                            y: m.pos.y - 40
                        }
                        b.missile(where, -Math.PI / 2 + 0.2 * (Math.random() - 0.5) * Math.sqrt(tech.missileCount), -2)
                    }, i * 1000);
                }
            },
            remove() {}
        },
        {
            name: "grenade production",
            description: "drop a grenade every 2 seconds",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                setInterval(() => {
                    if (!simulation.paused && document.visibilityState !== "hidden") {
                        b.grenade(Vector.add(m.pos, { x: 10 * (Math.random() - 0.5), y: 10 * (Math.random() - 0.5) }), -Math.PI / 2) //fire different angles for each grenade
                        const who = bullet[bullet.length - 1]
                        Matter.Body.setVelocity(who, {
                            x: who.velocity.x * 0.1,
                            y: who.velocity.y * 0.1
                        });
                    }
                }, 2000);
            },
            remove() {}
        },
        // {
        //     name: "inverted input",
        //     description: "left input becomes right and up input becomes down",
        //     maxCount: 9,
        //     count: 0,
        //     frequency: 0,
        //     isNonRefundable: true,
        //     isExperimentHide: true,
        //     isJunk: true,
        //     allowed() {
        //         return true
        //     },
        //     requires: "",
        //     effect() {
        //         const left = input.key.left
        //         input.key.left = input.key.right
        //         input.key.right = left

        //         const up = input.key.up
        //         input.key.up = input.key.down
        //         input.key.down = up
        //     },
        //     remove() {}
        // },
        {
            name: "Sleipnir",
            description: "grow more legs",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                m.draw = function() {
                    ctx.fillStyle = m.fillColor;
                    m.walk_cycle += m.flipLegs * m.Vx;

                    //draw body
                    ctx.save();
                    ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.5
                    ctx.translate(m.pos.x, m.pos.y);
                    for (let i = 0; i < 16; i++) {
                        m.calcLeg(Math.PI * i / 8, -3 * i / 16)
                        m.drawLeg("#444")
                    }
                    ctx.rotate(m.angle);

                    ctx.beginPath();
                    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                    ctx.fillStyle = this.bodyGradient
                    ctx.fill();
                    ctx.arc(15, 0, 4, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    // ctx.beginPath();
                    // ctx.arc(15, 0, 3, 0, 2 * Math.PI);
                    // ctx.fillStyle = '#0cf';
                    // ctx.fill()
                    ctx.restore();
                    m.yOff = m.yOff * 0.85 + m.yOffGoal * 0.15; //smoothly move leg height towards height goal
                }
            },
            remove() {}
        },
        {
            name: "diegesis",
            description: "indicate gun fire <strong><em>delay</em></strong><br>through a rotation of your head",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                m.draw = function() {
                    ctx.fillStyle = m.fillColor;
                    m.walk_cycle += m.flipLegs * m.Vx;

                    ctx.save();
                    ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.5
                    ctx.translate(m.pos.x, m.pos.y);
                    m.calcLeg(Math.PI, -3);
                    m.drawLeg("#4a4a4a");
                    m.calcLeg(0, 0);
                    m.drawLeg("#333");
                    ctx.rotate(m.angle - (m.fireCDcycle != Infinity ? m.flipLegs * 0.25 * Math.pow(Math.max(m.fireCDcycle - m.cycle, 0), 0.5) : 0));

                    ctx.beginPath();
                    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                    ctx.fillStyle = this.bodyGradient
                    ctx.fill();
                    ctx.arc(15, 0, 4, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                    m.yOff = m.yOff * 0.85 + m.yOffGoal * 0.15; //smoothly move leg height towards height goal
                }
            },
            remove() {}
        },
        {
            name: "🐱",
            description: "🐈",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                m.draw = function() {
                    ctx.fillStyle = m.fillColor;
                    m.walk_cycle += m.flipLegs * m.Vx;
                    ctx.save();
                    ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.5
                    ctx.translate(m.pos.x, m.pos.y);
                    m.calcLeg(Math.PI, -3);
                    m.drawLeg("#4a4a4a");


                    if (!(m.angle > -Math.PI / 2 && m.angle < Math.PI / 2)) {
                        ctx.scale(1, -1);
                        ctx.rotate(Math.PI);
                    }
                    ctx.beginPath();
                    ctx.moveTo(-30, 0);
                    ctx.bezierCurveTo(-65, -75,
                        -5, 150 + (5 * Math.sin(simulation.cycle / 10)),
                        -70 + (10 * Math.sin(simulation.cycle / 10)), 0 + (10 * Math.sin(simulation.cycle / 10)));
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    if (!(m.angle > -Math.PI / 2 && m.angle < Math.PI / 2)) {
                        ctx.scale(1, -1);
                        ctx.rotate(0 - Math.PI);
                    }
                    m.calcLeg(0, 0);
                    m.drawLeg("#333");

                    ctx.rotate(m.angle);
                    if (!(m.angle > -Math.PI / 2 && m.angle < Math.PI / 2)) ctx.scale(1, -1);
                    ctx.beginPath();
                    ctx.moveTo(5, -30);
                    ctx.lineTo(20, -40);
                    ctx.lineTo(20, -20);
                    ctx.lineWidth = 2;
                    ctx.fillStyle = "#f3f";
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                    ctx.fillStyle = this.bodyGradient
                    ctx.fill();
                    ctx.stroke();
                    ctx.moveTo(19, 0);
                    ctx.arc(15, 0, 4, Math.PI, 2 * Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(24.3, 6, 5, Math.PI * 2, Math.PI);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(30, 6);
                    ctx.lineTo(32, 0);
                    ctx.lineTo(26, 0);
                    ctx.lineTo(30, 6);
                    ctx.fillStyle = "#f3f";
                    ctx.fill();
                    ctx.stroke();

                    ctx.restore();
                    m.yOff = m.yOff * 0.85 + m.yOffGoal * 0.15; //smoothly move leg height towards height goal
                }
            },
            remove() {}
        },
        {
            name: "pareidolia",
            description: "don't",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return !m.isShipMode
            },
            requires: "",
            effect() {
                m.draw = function() {
                    ctx.fillStyle = m.fillColor;
                    m.walk_cycle += m.flipLegs * m.Vx;
                    ctx.save();
                    ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.7
                    ctx.translate(m.pos.x, m.pos.y);
                    m.calcLeg(Math.PI, -3);
                    m.drawLeg("#4a4a4a");
                    m.calcLeg(0, 0);
                    m.drawLeg("#333");
                    ctx.rotate(m.angle);
                    ctx.beginPath();
                    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                    ctx.fillStyle = this.bodyGradient
                    ctx.fill();
                    ctx.strokeStyle = "#333";
                    ctx.lineWidth = 2;
                    if (!(m.angle > -Math.PI / 2 && m.angle < Math.PI / 2)) ctx.scale(1, -1); //here is the flip
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(2, -6, 7, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(25, -6, 7, 0.25 * Math.PI, 1.6 * Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(2, -10, 9, 1.25 * Math.PI, 1.75 * Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(25, -10, 9, 1.25 * Math.PI, 1.4 * Math.PI);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(18, 13, 10, 0, 2 * Math.PI);
                    ctx.fillStyle = this.bodyGradient;
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(18, 13, 6, 0, 2 * Math.PI);
                    ctx.fillStyle = "#555";
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(3, -6, 3, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(26, -6, 3, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                    m.yOff = m.yOff * 0.85 + m.yOffGoal * 0.15;
                }
            },
            remove() {}
        },
        {
            name: "prism",
            description: "you cycle through different <strong>colors</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                m.color = {
                    hue: 0,
                    sat: 100,
                    light: 50
                }
                setInterval(function() {
                    m.color.hue++
                    m.setFillColors()
                }, 10);
            },
            remove() {}
        },
        {
            name: "assimilation",
            description: "all your <strong class='color-bot'>bots</strong> are converted to the <strong>same</strong> random model",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isBotTech: true,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return b.totalBots() > 2
            },
            requires: "at least 3 bots",
            effect() {
                const total = b.totalBots();
                tech.dynamoBotCount = 0;
                tech.nailBotCount = 0;
                tech.laserBotCount = 0;
                tech.orbitBotCount = 0;
                tech.foamBotCount = 0;
                tech.boomBotCount = 0;
                tech.plasmaBotCount = 0;
                tech.missileBotCount = 0;
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType) bullet[i].endCycle = 0
                }

                const bots = [
                    () => {
                        b.nailBot();
                        tech.nailBotCount++;
                    },
                    () => {
                        b.foamBot();
                        tech.foamBotCount++;
                    },
                    () => {
                        b.boomBot();
                        tech.boomBotCount++;
                    },
                    () => {
                        b.laserBot();
                        tech.laserBotCount++;
                    },
                    () => {
                        b.orbitBot();
                        tech.orbitBotCount++
                    },
                    () => {
                        b.dynamoBot();
                        tech.dynamoBotCount++
                    }
                ]
                const index = Math.floor(Math.random() * bots.length)
                for (let i = 0; i < total; i++) bots[index]()
            },
            remove() {}
        },
        {
            name: "growth hacking",
            description: "increase combat <strong>difficulty</strong> by <strong>1 level</strong>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                level.difficultyIncrease(simulation.difficultyMode)
            },
            remove() {}
        },
        {
            name: "stun",
            description: "<strong>stun</strong> all mobs for up to <strong>8</strong> seconds",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                for (let i = 0; i < mob.length; i++) mobs.statusStun(mob[i], 480)
            },
            remove() {}
        },
        {
            name: "re-arm",
            description: "remove all your <strong class='color-g'>guns</strong>,<br>and <strong>spawn</strong> new ones",
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return b.inventory.length > 0
            },
            requires: "at least 1 gun",
            effect() {
                for (let i = 0; i < b.inventory.length; i++) powerUps.spawn(m.pos.x + 60 * (Math.random() - 0.5), m.pos.y + 60 * (Math.random() - 0.5), "gun");

                //removes guns and ammo  
                b.inventory = [];
                b.activeGun = null;
                b.inventoryGun = 0;
                for (let i = 0, len = b.guns.length; i < len; ++i) {
                    b.guns[i].have = false;
                    if (b.guns[i].ammo !== Infinity) b.guns[i].ammo = 0;
                }
                simulation.makeGunHUD(); //update gun HUD
            },
            remove() {}
        },
        {
            name: "re-research",
            description: `<strong>eject</strong> all your ${powerUps.orb.research(1)}`,
            maxCount: 9,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return powerUps.research.count > 3
            },
            requires: "at least 4 research",
            effect() {
                const dist = 10 * powerUps.research.count + 100
                for (let i = 0; i < powerUps.research.count; i++) {
                    powerUps.directSpawn(m.pos.x + dist * (Math.random() - 0.5), m.pos.y + dist * (Math.random() - 0.5), "research");
                }
                powerUps.research.count = 0
            },
            remove() {}
        },
        {
            name: "black hole",
            description: `use your <strong class='color-f'>energy</strong> and ${powerUps.orb.research(4)} to <strong>spawn</strong><br>inside the event horizon of a huge <strong>black hole</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() {
                return powerUps.research.count > 3
            },
            requires: "at least 4 research",
            effect() {
                m.energy = 0
                spawn.suckerBoss(m.pos.x, m.pos.y - 700)
                powerUps.research.changeRerolls(-4)
                simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span> <span class='color-symbol'>--</span><br>${powerUps.research.count}`)
            },
            remove() {}
        },
        {
            name: "black hole cluster",
            description: `spawn <strong>30</strong> nearby <strong>black holes</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                const unit = { x: 1, y: 0 }
                for (let i = 0; i < 30; i++) {
                    const where = Vector.add(m.pos, Vector.mult(Vector.rotate(unit, Math.random() * 2 * Math.PI), 2000 + 1200 * Math.random()))
                    spawn.sucker(where.x, where.y, 140)
                    const who = mob[mob.length - 1]
                    who.locatePlayer()
                    // who.damageReduction = 0.2
                }
            },
            remove() {}
        },
        {
            name: "cosmogonic myth",
            description: `open a portal to a primordial version of reality<br>after 5 minutes <strong>close</strong> the portal, and spawn 1 of every power up`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                const urls = ["https://scratch.mit.edu/projects/14005697/fullscreen/", "https://scratch.mit.edu/projects/22573757/fullscreen/", "https://codepen.io/lilgreenland/full/ozXNWZ", "https://codepen.io/lilgreenland/full/wzARJY", "classic/7-1-2017/", "classic/4-15-2018/", "classic/7-11-2019/", "classic/9-8-2019/", "classic/7-15-2020/", "classic/6-1-2021/"]
                const choose = urls[Math.floor(Math.random() * urls.length)]
                console.log(`opening new tab" ${choose}`)
                let tab = window.open(choose, "_blank");
                setTimeout(() => {
                    tab.close();
                    powerUps.spawn(m.pos.x, m.pos.y, "gun");
                    setTimeout(() => { powerUps.spawn(m.pos.x, m.pos.y - 50, "ammo") }, 250);
                    setTimeout(() => { powerUps.spawn(m.pos.x + 50, m.pos.y, "field"); }, 500);
                    setTimeout(() => { powerUps.spawn(m.pos.x + 50, m.pos.y - 50, "heal"); }, 750);
                    setTimeout(() => { powerUps.spawn(m.pos.x - 50, m.pos.y, "tech"); }, 1000);
                    setTimeout(() => { powerUps.spawn(m.pos.x - 50, m.pos.y - 50, "research"); }, 1250);
                }, 1000 * 5 * 60);
            },
            remove() {}
        },
        {
            name: "planetesimals",
            description: `play <strong>planetesimals</strong> <em style = 'font-size:80%;'>(an asteroids-like game)</em><br>clear <strong>levels</strong> in <strong>planetesimals</strong> to spawn <strong class='color-m'>tech</strong><br>if you <strong style="color:red;">die</strong> in <strong>planetesimals</strong> you <strong style="color:red;">die</strong> in <strong>n-gon</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 0,
            isNonRefundable: true,
            isJunk: true,
            allowed() { return true },
            requires: "",
            effect() {
                window.open('../../planetesimals/index.html', '_blank')
                // powerUps.spawn(m.pos.x, m.pos.y, "tech");

                // for communicating to other tabs, like planetesimals
                // Connection to a broadcast channel
                const bc = new BroadcastChannel('planetesimals');
                bc.activated = false

                bc.onmessage = function(ev) {
                    if (ev.data === 'tech') powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
                    if (ev.data === 'death') {
                        m.death()
                        bc.close(); //end session
                    }
                    if (ev.data === 'ready' && !bc.activated) {
                        bc.activated = true //prevents n-gon from activating multiple copies of planetesimals
                        bc.postMessage("activate");
                    }
                }
            },
            remove() {}
        },
        {
            name: "tinker",
            description: "<strong>permanently</strong> unlock <strong class='color-j'>JUNK</strong> <strong class='color-m'>tech</strong> in experiment mode<br><em>this effect is stored for future visits</em>",
            maxCount: 1,
            count: 0,
            frequency: 0,
            frequencyDefault: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return !localSettings.isJunkExperiment
            },
            requires: "",
            effect() {
                localSettings.isJunkExperiment = true
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            },
            remove() {}
        },
        {
            name: "NFT",
            descriptionFunction() { return `buy your current game seed: <strong style = 'font-size:130%;'>${Math.initialSeed}</strong><br><em>no one is allow to use your seeds<br>if they use them they are gonna get in trouble</em><br>your seeds: <span style = 'font-size:70%;'>${localSettings.personalSeeds.join()}</span>` },
            maxCount: 1,
            count: 0,
            frequency: 0,
            isJunk: true,
            isNonRefundable: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                localSettings.personalSeeds.push(Math.initialSeed)
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            },
            remove() {}
        },
        //************************************************** 
        //************************************************** undefined / lore
        //************************************************** tech
        //************************************************** 
        {
            name: `undefined`,
            // description: `${lore.techCount+1}/${lore.techGoal}<br><em>add copies of <strong class="lore-text">this</strong> to the potential <strong class='color-m'>tech</strong> pool</em>`,
            description: `<strong class="lore-text">this</strong>`,
            maxCount: 1,
            count: 0,
            frequency: 3,
            frequencyDefault: 3,
            isLore: true,
            // isNonRefundable: true,
            isExperimentHide: true,
            allowed() { return true },
            requires: "",
            effect() {
                setTimeout(() => { //a short delay, I can't remember why
                    lore.techCount++
                    if (lore.techCount === lore.techGoal) {
                        // tech.removeLoreTechFromPool();
                        this.frequency = 0;
                        this.description = `<strong class="lore-text">null</strong> is open at level.final()`
                    } else {
                        this.frequency += lore.techGoal * 2
                        // for (let i = 0; i < tech.tech.length; i++) { //set name for all unchosen copies of this tech
                        //     if (tech.tech[i].isLore && tech.tech[i].count === 0) tech.tech[i].description = `${lore.techCount+1}/${lore.techGoal}<br><em>add copies of <strong class="lore-text">this</strong> to the potential <strong class='color-m'>tech</strong> pool</em>`
                        // }
                        // for (let i = 0, len = 10; i < len; i++) tech.addLoreTechToPool()
                        this.description = `<em>uncaught error:</em><br><strong>${Math.max(0, lore.techGoal - lore.techCount)}</strong> more required for access to <strong class="lore-text">null</strong>`
                    }
                }, 1);
            },
            remove() {
                lore.techCount = 0;
                this.maxCount = lore.techGoal;
                this.description = `<strong class="lore-text">this</strong>`
            }
        }
    ],
    // addLoreTechToPool() { //adds lore tech to tech pool
    //     if (!simulation.isCheating) {
    //         tech.tech.push({
    //             name: `undefined`,
    //             description: `${lore.techCount+1}/${lore.techGoal}<br><em>add copies of <strong class="lore-text">this</strong> to the potential <strong class='color-m'>tech</strong> pool</em>`,
    //             maxCount: 1,
    //             count: 0,
    //             frequency: 2,
    //             isLore: true,
    //             isNonRefundable: true,
    //             isExperimentHide: true,
    //             allowed() {
    //                 return true
    //             },
    //             requires: "",
    //             effect() {
    //                 setTimeout(() => { //a short delay, I can't remember why
    //                     lore.techCount++
    //                     if (lore.techCount > lore.techGoal - 1) {
    //                         // tech.removeLoreTechFromPool();
    //                         for (let i = tech.tech.length - 1; i > 0; i--) {
    //                             if (tech.tech[i].isLore && tech.tech[i].count === 0) tech.tech.splice(i, 1)
    //                         }
    //                     } else {
    //                         for (let i = 0; i < tech.tech.length; i++) { //set name for all unchosen copies of this tech
    //                             if (tech.tech[i].isLore && tech.tech[i].count === 0) tech.tech[i].description = `${lore.techCount+1}/${lore.techGoal}<br><em>add copies of <strong class="lore-text">this</strong> to the potential <strong class='color-m'>tech</strong> pool</em>`
    //                         }
    //                         for (let i = 0, len = 10; i < len; i++) tech.addLoreTechToPool()
    //                     }
    //                 }, 1);
    //             },
    //             remove() {}
    //         })
    //     }
    // },
    // junk: [

    // ],
    //variables use for gun tech upgrades
    fireRate: null,
    bulletSize: null,
    energySiphon: null,
    healthDrain: null,
    crouchAmmoCount: null,
    isBulletsLastLonger: null,
    isImmortal: null,
    sporesOnDeath: null,
    isImmuneExplosion: null,
    isExplodeMob: null,
    isDroneOnDamage: null,
    isAcidDmg: null,
    isAnnihilation: null,
    largerHeals: null,
    squirrelFx: null,
    isCrit: null,
    isLowHealthDmg: null,
    isFarAwayDmg: null,
    isEntanglement: null,
    isMassEnergy: null,
    isExtraChoice: null,
    laserBotCount: null,
    dynamoBotCount: null,
    nailBotCount: null,
    foamBotCount: null,
    boomBotCount: null,
    plasmaBotCount: null,
    missileBotCount: null,
    orbitBotCount: null,
    collisionImmuneCycles: null,
    blockDmg: null,
    isPiezo: null,
    isFastDrones: null,
    isFastSpores: null,
    oneSuperBall: null,
    laserReflections: null,
    laserDamage: null,
    laserFieldDrain: null,
    isAmmoFromHealth: null,
    mobSpawnWithHealth: null,
    isEnergyRecovery: null,
    isHealthRecovery: null,
    isEnergyLoss: null,
    isDeathAvoid: null,
    isDeathAvoidedThisLevel: null,
    isSporeField: null,
    isMissileField: null,
    isIceField: null,
    isPlasmaRange: null,
    isFreezeMobs: null,
    isIceCrystals: null,
    blockDamage: null,
    isBlockStun: null,
    isStunField: null,
    isHarmDamage: null,
    energyRegen: null,
    isVacuumBomb: null,
    renormalization: null,
    fragments: null,
    isEnergyDamage: null,
    botSpawner: null,
    isBotSpawnerReset: null,
    isSporeFollow: null,
    isNailRadiation: null,
    isEnergyHealth: null,
    isExplosionStun: null,
    restDamage: null,
    isRPG: null,
    missileCount: null,
    isDeterminism: null,
    isSuperDeterminism: null,
    isHarmReduce: null,
    nailsDeathMob: null,
    isSlowFPS: null,
    isNeutronStun: null,
    isAnsatz: null,
    isDamageFromBulletCount: null,
    isLaserDiode: null,
    isNailShot: null,
    slowFire: null,
    fastTime: null,
    squirrelJump: null,
    isFastRadiation: null,
    isExtraMaxEnergy: null,
    isAmmoForGun: null,
    isRapidPulse: null,
    isPulseAim: null,
    isSporeFreeze: null,
    isShotgunRecoil: null,
    isHealLowHealth: null,
    isAoESlow: null,
    isHarmArmor: null,
    isTurret: null,
    isRerollDamage: null,
    isHarmFreeze: null,
    isBotArmor: null,
    isRerollHaste: null,
    researchHaste: null,
    isMineDrop: null,
    isRerollBots: null,
    isNailBotUpgrade: null,
    isFoamBotUpgrade: null,
    isLaserBotUpgrade: null,
    isBoomBotUpgrade: null,
    isOrbitBotUpgrade: null,
    isDroneGrab: null,
    isOneGun: null,
    isDamageForGuns: null,
    isGunCycle: null,
    isFastFoam: null,
    isSporeGrowth: null,
    isStimulatedEmission: null,
    nailGun: null,
    nailInstantFireRate: null,
    isCapacitor: null,
    isEnergyNoAmmo: null,
    // isFreezeHarmImmune: null,
    isSmallExplosion: null,
    isExplosionHarm: null,
    extraMaxHealth: null,
    // bonusHealth: null,
    isIntangible: null,
    isCloakStun: null,
    bonusEnergy: null,
    healGiveMaxEnergy: null,
    healMaxEnergyBonus: 0, //not null
    aimDamage: null,
    isNoFireDefense: null,
    isNoFireDamage: null,
    duplicateChance: null,
    beamSplitter: null,
    iceEnergy: null,
    isPerfectBrake: null,
    explosiveRadius: null,
    isWormholeEnergy: null,
    isWormholeDamage: null,
    isNailCrit: null,
    isFlechetteExplode: null,
    isWormholeWorms: null,
    isWormBullets: null,
    isWideLaser: null,
    wideLaser: null,
    isPulseLaser: null,
    isRadioactive: null,
    isRailEnergyGain: null,
    isMineSentry: null,
    isIncendiary: null,
    overfillDrain: null,
    isNeutronSlow: null,
    // isRailAreaDamage: null,
    historyLaser: null,
    isSpeedHarm: null,
    isSpeedDamage: null,
    isTimeSkip: null,
    isCancelDuplication: null,
    cancelCount: null,
    isCancelRerolls: null,
    isBotDamage: null,
    isBanish: null,
    isMaxEnergyTech: null,
    isLowEnergyDamage: null,
    isRewindBot: null,
    isRewindGrenade: null,
    isExtruder: null,
    isEndLevelPowerUp: null,
    isMissileBig: null,
    isMissileBiggest: null,
    isLaserMine: null,
    isAmmoFoamSize: null,
    isIceIX: null,
    isDupDamage: null,
    isFireRateForGuns: null,
    cyclicImmunity: null,
    isTechDamage: null,
    isRestHarm: null,
    isFireMoveLock: null,
    isRivets: null,
    isNeedles: null,
    isExplodeRadio: null,
    isPauseSwitchField: null,
    isPauseEjectTech: null,
    isShieldPierce: null,
    isDuplicateBoss: null,
    is111Duplicate: null,
    isDynamoBotUpgrade: null,
    isBlockPowerUps: null,
    foamFutureFire: null,
    isDamageAfterKillNoRegen: null,
    isHarmReduceNoKill: null,
    isSwitchReality: null,
    isResearchReality: null,
    isAnthropicDamage: null,
    isFlipFlop: null,
    isFlipFlopHarm: null,
    isFlipFlopOn: null,
    // isFlipFlopLevelReset: null,
    isFlipFlopDamage: null,
    isFlipFlopEnergy: null,
    isRelay: null,
    relayIce: null,
    isMetaAnalysis: null,
    isFoamAttract: null,
    droneCycleReduction: null,
    droneEnergyReduction: null,
    isNoHeals: null,
    isAlwaysFire: null,
    isDroneRespawn: null,
    deathSpawns: null,
    isMobBlockFling: null,
    blockingIce: null,
    isPhaseVelocity: null,
    waveBeamSpeed: null,
    wavePacketAmplitude: null,
    isCollisionRealitySwitch: null,
    iceIXOnDeath: null,
    wimpCount: null,
    isAddBlockMass: null,
    isMACHO: null,
    isHarmMACHO: null,
    isSneakAttack: null,
    isFallingDamage: null,
    harmonics: null,
    isStandingWaveExpand: null,
    isTokamak: null,
    superBallDelay: null,
    isBlockExplode: null,
    isOverHeal: null,
    isDroneRadioactive: null,
    droneRadioDamage: null,
    isDroneTeleport: null,
    isDroneFastLook: null,
    isBulletTeleport: null,
    isResearchBoss: null,
    isJunkResearch: null,
    junkResearchNumber: null,
    laserColor: null,
    laserColorAlpha: null,
    isLongitudinal: null,
    is360Longitudinal: null,
    isShotgunReversed: null,
    wormDuplicate: null,
    isCloakingDamage: null,
    harmonicEnergy: null,
    isFieldHarmReduction: null,
    isFastTime: null,
    isAnthropicTech: null,
    isSporeWorm: null,
    isFoamShot: null,
    isIceShot: null,
    isBlockRestitution: null,
    isZeno: null,
    isFieldFree: null,
    isExtraGunField: null,
    isBigField: null,
    isSmartRadius: null,
    isFilament: null,
    isLargeHarpoon: null,
    extraHarpoons: null,
    ammoCap: null,
    isHarpoonPowerUp: null,
    harpoonDensity: null,
    isAddRemoveMaxHealth: null,
    removeMaxHealthOnKill: null,
    isSpawnExitTech: null,
    cloakDuplication: null,
    extruderRange: null,
    isForeverDrones: null,
    isMoreMobs: null,
    nailRecoil: null,
    baseJumpForce: null,
    baseFx: null,
    isNeutronium: null,
    isFreeWormHole: null,
    isRewindField: null,
    isCrouchRegen: null,
    isDarts: null,
    OccamDamage: null,
    isAxion: null,
    isWormholeMapIgnore: null,
    isLessDamageReduction: null,
    // bulletSize: null,
    needleTunnel: null,
    isBrainstorm: null,
    isBrainstormActive: null,
    brainStormDelay: null,
    wormSize: null,
    extraSuperBalls: null,
    isTimeCrystals: null,
    isGroundState: null,
    isRailGun: null,
    isGrapple: null,
    isImmuneGrapple: null,
    isDronesTravel: null,
    isTechDebt: null,
    isPlasmaBall: null,
    plasmaDischarge: null,
    isFlipFlopHealth: null,
    isRelayEnergy: null,
    coyoteTime: null,
    missileFireCD: null
}