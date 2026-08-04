let body = []; //non static bodies
let map = []; //all static bodies
let cons = []; //all constraints between a point and a body
let consBB = []; //all constraints between two bodies
let composite = [] //rotors and other map elements that don't fit 
const level = {
    fallMode: "",
    defaultZoom: 1400,
    onLevel: -1,
    levelsCleared: 0,
    isFlipped: false,
    isFlipping: false,
    uniqueLevels: ["initial", "reservoir", "factory", "interferometer", "reactor", "subway", "final"], //see level.populateLevels:   (initial, ... , (reservoir, factory, or interferometer), reactor, ... , subway, final)    added later
    playableLevels: ["labs", "rooftops", "skyscrapers", "warehouse", "highrise", "office", "aerie", "satellite", "sewers", "testChamber", "pavilion", "lock", "towers", "flocculation", "gravitron", "substructure", "corridor", "furnace", "superstructure", "HVAC", "chute", "refinery"],
    communityLevels: ["gauntlet", "stronghold", "basement", "crossfire", "vats", "run", "ngon", "house", "perplex", "coliseum", "tunnel", "islands", "temple", "dripp", "biohazard", "yingYang", "staircase", "fortress", "commandeer", "clock", "buttonbutton", "downpour", "superNgonBros", "underpass", "cantilever", "tlinat", "ruins", "ace", "crimsonTowers", "LaunchSite", "shipwreck", "unchartedCave", "dojo", "arena", "soft", "flappyGon", "rings", "trial", "zenith", "archipelago", "vents", "intervals", "turbine", "terminal"],
    trainingLevels: ["walk", "crouch", "jump", "hold", "throw", "throwAt", "deflect", "heal", "fire", "nailGun", "shotGun", "superBall", "matterWave", "missile", "stack"], //, "mine", "grenades", "harpoon"
    levels: [],
    load(name) {
        const mapCollection = typeof level.maps[name] === "function" ? level.maps : moreLevels
        if (typeof mapCollection[name] !== "function") throw new Error(`unknown level: ${name}`)
        mapCollection[name].call(level)
    },
    start() {
        spawn.randomMobPositions.length = 0
        level.setConstraints()
        if (level.levelsCleared === 0) { //this code only runs on the first level
            // if (false) {
            if (true) {
                level.load(simulation.isTraining ? "walk" : "initial") //normal starting level **************************************************
            } else {
                simulation.enableConstructMode()  //used to build maps in testing mode
                // simulation.difficultyMode = 1
                // build.isExperimentRun = true
                // tech.duplicateChance += 1
                // powerUps.setPowerUpMode(); //needed after adjusting duplication chance
                // simulation.isHorizontalFlipped = true
                // level.levelsCleared = 13
                // level.updateDifficulty()
                // simulation.isCheating = true
                // tech.giveTech("performance")
                // m.coyoteCycles = 120
                // powerUps.research.changeRerolls(100000)
                // tech.tech[297].frequency = 100
                // tech.addJunkTechToPool(0.5)
                // m.couplingChange(100)
                // requestAnimationFrame(() => { m.setField(9) });
                m.setField(2) //1 standing wave  2 perfect diamagnetism  3 negative mass  4 molecular assembler  5 plasma torch  6 time dilation  7 metamaterial cloaking  8 pilot wave  9 wormhole 10 grappling hook

                // m.energy = m.maxEnergy = 12.2
                // m.energy += 1
                // m.couplingChange(1000)
                // m.fieldUpgrades[6].isRewindMode = true
                // window.removeEventListener("keydown", m.fieldEvent);
                // m.fieldUpgrades[6].set()
                // m.wakeCheck();
                // m.damageDone *= 10

                m.maxHealth = m.health = 10
                // m.energy = m.health = 0.000001
                // m.displayHealth();
                // m.immuneCycle = Infinity //you can't take damage
                // m.maxEnergy = m.energy = 10000000
                // powerUps.research.count = 3
                // tech.isHookWire = true
                // m.energy = 0
                // simulation.molecularMode = 2
                // m.takeDamage(0.01);

                // b.giveGuns(0) //0 nail gun  1 shotgun  2 super balls 3 wave 4 missiles 5 grenades  6 spores  7 drones  8 foam  9 harpoon  10 mine  11 laser
                // b.giveGuns(11)
                // b.guns[b.inventory[0]].ammo = 100000
                // tech.addJunkTechToPool(0.5)
                // for (let i = 0; i < 1; ++i) tech.giveTech("optical resonator")
                // for (let i = 0; i < 1; ++i) tech.giveTech("Higgs mechanism")
                // tech.giveTech("transverse")
                // for (let i = 0; i < 1; ++i) tech.giveTech("working mass")
                // for (let i = 0; i < 1; ++i) tech.giveTech("additive manufacturing")
                // for (let i = 0; i < 100; ++i) tech.giveTech("anti-shear topology")
                // for (let i = 0; i < 1; i++) tech.giveTech("exchange operator")
                // for (let i = 0; i < 1; i++) tech.giveTech("eigenstate")
                // for (let i = 0; i < 1; i++) tech.giveTech("uncertainty principle")
                // spawn.bodyRect(575, -700, 150, 150);  //block mob line of site on testing
                level.levelsCleared = 2
                // simulation.isHorizontalFlipped = true
                // localSettings.levelsClearedLastGame = 5 //triggers tech to spawn on initial level
                level.load("refinery")
                // level.maps.testing()

                // powerUps.spawn(m.pos.x, m.pos.y, "heal", false);
                // requestAnimationFrame(() => { powerUps.spawnDelay("tech", 10); });
                // spawn.randomGroup(1300, -200, Infinity);
                // spawn.nodeGroup(1300, -200, 'grower');
                // for (let i = 0; i < 4; i++) spawn.starter(1300 + 10 * i, -400)
                // for (let i = 0; i < 1; i++) spawn.starter(1300 + 10 * i, -200, 100)
                // for (let i = 0; i < 1; i++) spawn.shieldingBoss(2300 + 200 * i, -200)
                // Matter.Body.setPosition(player, { x: -27000, y: -400 });
                // m.storeTech() //sets entanglement
                // for (let i = 0; i < 10; ++i) powerUps.directSpawn(m.pos.x + 3000 * Math.random(), m.pos.y + 50 * Math.random(), "ammo");
                // for (let i = 0; i < 30; ++i) powerUps.directSpawn(m.pos.x + 450 + 150 * Math.random(), m.pos.y + 150 * Math.random(), "coupling");
                // for (let i = 0; i < 100; i++) powerUps.spawn(player.position.x + Math.random() * 50, player.position.y - Math.random() * 50, "coupling", false);
                // level.constraint[0].effect()  // turn this off first ->  seededShuffle(level.constraint)

                // level.defaultZoom = 600 //zoom in close
                // simulation.zoomTransition(level.defaultZoom)

                //lore testing
                // localSettings.isTrainingNotAttempted = true
                // simulation.isCheating = false //true;
                // for (let i = 0; i < 5; i++) tech.giveTech("undefined")
                // lore.techCount = 1
                // level.levelsCleared = 10
                // localSettings.loreCount = 1 //this sets what conversation is heard
                // localSettings.levelsClearedLastGame = 10
                // if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                // level.onLevel = -1 //this sets level.levels[level.onLevel] = undefined which is required to run the conversation
                // level.maps.null()
                // localSettings.isHuman = true
                // mobs.mobDeaths = 200 //to prevent pacifist mode
                // for (let i = 0; i < 13; i++) level.nextLevel(); //jump to final boss
                // lore.unlockTesting();
                // tech.giveTech("tinker"); //show junk tech in experiment mode
                // m.storeTech()
                // powerUps.spawn(m.pos.x, m.pos.y, "difficulty", false);
                // for (let i = 0; i < 3; i++) localSettings.difficultyCompleted[i] = true
                // localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
        } else {
            spawn.setSpawnList(); //picks a couple mobs types for a themed random mob spawns
            // spawn.pickList = ["focuser", "focuser"]
            level.load(level.levels[level.onLevel]); //picks the current map from level.maps or moreLevels
            if (!simulation.isCheating && !build.isExperimentRun && !simulation.isTraining) {
                localSettings.runCount += level.levelsCleared //track the number of total runs locally
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
        }
        setupCanvas()
        simulation.setupCamera(player.position);
        simulation.setZoom();
        level.addToWorld(); //add bodies to game engine
        simulation.draw.setPaths();
        b.respawnBots();
        m.resetHistory();

        m.fieldCDcycle = m.cycle + 15;
        tech.isDeathTechTriggered = false
        if (tech.isNoDeath) { //needed for quantum Zeno effect
            if (m.health < 0) {
                if (tech.isDeathAvoid && powerUps.research.count > 0 && !tech.isDeathAvoidedThisLevel) {
                    m.health = 0.01
                    tech.isDeathAvoidedThisLevel = true
                    powerUps.research.changeRerolls(-1)
                    simulation.inGameConsole(`<span class='color-var'>m</span>.<span class='color-r'>research</span><span class='color-symbol'>--</span><br>${powerUps.research.count}`)
                    setTimeout(function () {
                        powerUps.spawnDelay("heal", 16, 8);//(type, count, delay = 2, location = m.pos) {
                    }, 800);
                    simulation.ephemera.push({
                        levelsCleared: level.levelsCleared,
                        do() {
                            m.timeStop(Math.random() < 0.1 ? "#00cccc55" : "#ccc")
                            if (m.health > Math.min(0.7 * m.maxHealth, 99) || this.levelsCleared !== level.levelsCleared) {
                                m.wakeCheck(false); //unpause time
                                simulation.removeEphemera(this);
                                simulation.wipe = function () { //set wipe to normal
                                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                                }
                            }
                        },
                    });
                    simulation.wipe = function () { //set wipe to have trails
                        ctx.fillStyle = "rgba(255,255,255,0.3)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                } else {
                    m.health = 0;
                    m.displayHealth();
                    requestAnimationFrame(() => { m.death(); });
                }
            } else if (tech.isEigenstate && m.eigen.health[m.eigen.state === 0 ? 1 : 0] < 0) { //check other state health
                m.health = 0;
                m.displayHealth();
                requestAnimationFrame(() => { m.death(); });

                // m.death()//this shouldn't kill, it will just eject eigen state tech
                // m.eigen.deathCount++
                // m.eigen.isAlive[m.eigen.state] = false
                // m.eigen.swap()
                // simulation.inGameConsole(`<em>//your other state died</em>`)
                // simulation.inGameConsole(`<span class='color-var'>m</span>.eigen.isAlive<span class='color-symbol'>[</span>m.eigen.state<span class='color-var'>]</span> <span class='color-var'>=</span> false `)
                // // m.addHealth(1)
                // for (let i = 0; i < tech.tech.length; i++) {
                //     if (tech.tech[i].name === "eigenstate") {
                //         powerUps.ejectTech(i)
                //         break
                //     }
                // }
            }
        }
        tech.isDeathAvoidedThisLevel = false;
        //catch waves that continue to exist
        for (let i = simulation.ephemera.length - 1; i >= 0; i--) {
            if (simulation.ephemera[i].name === "wave") simulation.ephemera.splice(i, 1)
        }
        if (tech.isForeverDrones) {
            if (tech.isDroneRadioactive) {
                for (let i = 0; i < tech.isForeverDrones * 0.25; i++) {
                    b.droneRadioactive({ x: m.pos.x + 30 * (Math.random() - 0.5), y: m.pos.y + 30 * (Math.random() - 0.5) }, 5)
                    bullet[bullet.length - 1].endCycle = Infinity
                }
            } else {
                for (let i = 0; i < tech.isForeverDrones; i++) {
                    b.drone({ x: m.pos.x + 30 * (Math.random() - 0.5), y: m.pos.y + 30 * (Math.random() - 0.5) }, 5)
                    bullet[bullet.length - 1].endCycle = Infinity
                }
            }
        }
        if (tech.isDarkMatter) spawn.darkMatter()
        for (let i = 0; i < tech.wimpCount; i++) {
            spawn.WIMP()
            mob[mob.length - 1].isDecoupling = true //so you can find it to remove
            for (let j = 0, len = 7; j < len; j++) powerUps.spawn(level.exit.x + 100 * (Math.random() - 0.5), level.exit.y - 100 + 100 * (Math.random() - 0.5), "research", false)
        }

        if (m.plasmaBall) m.plasmaBall.fire()
        if (localSettings.entanglement && localSettings.entanglement.levelName === level.levels[level.onLevel]) {
            const flip = localSettings.entanglement.isHorizontalFlipped === simulation.isHorizontalFlipped ? 1 : -1
            powerUps.directSpawn(flip * localSettings.entanglement.position.x, localSettings.entanglement.position.y, "entanglement", false);
        }
        if (m.fieldMode === 8) {
            Matter.Body.setPosition(m.fieldUpgrades[8].collider, m.pos);
            m.fieldPosition = { x: m.pos.x, y: m.pos.y }
            m.lastFieldPosition = { x: m.pos.x, y: m.pos.y }
        }
        if (tech.isBlockDup) {
            tech.blockDupCount = 0
            simulation.inGameConsole(`<span class='color-var'>duplicationChance</span> <span class='color-symbol'>=</span> 0 //for anyon`);
        }
        //translate wire
        if (tech.wire && tech.wire.segments.length) {
            const radius = 80 + 60 * Math.random()
            const angleStep = 0.1 + 0.2 * Math.random()
            let angle = 0
            for (let i = 0; i < tech.wire.segments.length; i++) {
                angle += angleStep
                tech.wire.segments[i].x = m.pos.x + radius * Math.cos(angle)
                tech.wire.segments[i].y = m.pos.y + radius * Math.sin(angle)
                tech.wire.segments[i].oldX = m.pos.x + radius * Math.cos(angle)
                tech.wire.segments[i].oldY = m.pos.y + radius * Math.sin(angle)

            }
        }
        if (tech.isEigenstate) m.eigen.reset(false)

        level.newLevelOrPhase()
        if (tech.isDigitalPet) {
            for (let i = 0, len = simulation.ephemera.length; i < len; i++) {
                if (simulation.ephemera[i].name === 'tamagotchi') {
                    simulation.inGameConsole(`digital pet report:`);
                    simulation.inGameConsole(`<strong>hunger</strong> = ${simulation.ephemera[i].hunger.toFixed(0)}`);
                    simulation.inGameConsole(`<strong>energy</strong> = ${simulation.ephemera[i].energy.toFixed(0)}`);
                    simulation.inGameConsole(`<strong>cleanliness</strong> = ${simulation.ephemera[i].cleanliness.toFixed(0)}`);
                    simulation.inGameConsole(`your digital pet has brought you something!`);

                    // console.log(simulation.ephemera[i])
                    //I think 340 is max for each stat?
                    if (simulation.ephemera[i].hunger + simulation.ephemera[i].energy + simulation.ephemera[i].cleanliness > 900) {
                        powerUps.spawnDelay("tech", 1);
                    } else if (Math.random() < 0.33) {
                        if (simulation.ephemera[i].hunger > 300) {
                            powerUps.spawnDelay("heal", 20);
                        } else {
                            powerUps.spawnDelay("heal", 3);
                        }
                    } else if (Math.random() < 0.5) {
                        if (simulation.ephemera[i].energy > 300) {
                            powerUps.spawnDelay("research", 9);
                        } else {
                            powerUps.spawnDelay("research", 2);
                        }
                    } else {
                        if (simulation.ephemera[i].cleanliness > 300) {
                            powerUps.spawnDelay("ammo", 15);
                        } else {
                            powerUps.spawnDelay("ammo", 4);
                        }
                    }

                    break;
                }
            }

        }

        if (tech.isAusterity && b.inventory.length === 0) {
            m.damageDone *= 1.4
        }
        if (tech.isAmalgam && b.inventory.length > 0) {
            const which = b.guns[b.inventory[b.inventory.length - 1]].name
            simulation.inGameConsole(`<span class='color-var'>b</span><span class='color-symbol'>.</span>removeGun<span class='color-symbol'>("${which}")</span> <em>//converted to 3 bots</em>`);
            b.removeGun(which)

            for (let i = 0; i < 3; i++) b.randomBot()
        }

        if (tech.zeitgeistRemoveName) {
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].name === tech.zeitgeistRemoveName) {
                    powerUps.ejectTech(i, true)

                }
            }
        }

        if (simulation.isTraining) {
            simulation.difficultyMode = 1
        } else {
            simulation.inGameConsole(`<span class='color-var'>level</span>.onLevel <span class='color-symbol'>=</span> "<span class='color-text'>${level.levels[level.onLevel]}</span>"`);
            document.title = "n-gon: " + level.levelAnnounce();
        }
    },
    newLevelOrPhase() { //runs on each new level but also on final boss phases
        //used for generalist and pigeonhole principle
        tech.cancelTechCount = 0
        tech.tokamakHealCount = 0
        tech.buffedGun++
        if (tech.buffedGun > b.inventory.length - 1) tech.buffedGun = 0;
        if ((tech.isGunCycle || tech.isGunChoice) && (b.activeGun !== null && b.activeGun !== undefined) && b.inventory.length) {
            b.inventoryGun = tech.buffedGun;
            simulation.switchGun();
        }
        // if (tech.isGunChoice && Number.isInteger(tech.buffedGun) && b.inventory.length) {
        //     var gun = b.guns[b.inventory[tech.buffedGun]].name
        //     simulation.inGameConsole(`pigeonhole principle: <strong>${(1 + 0.4 * Math.max(0, b.inventory.length)).toFixed(2)}x</strong> <strong class='color-d'>damage</strong> for <strong class="highlight">${gun}</strong>`, 600);
        // }
        if (tech.isSwitchReality && level.levelsCleared !== 0) {
            simulation.inGameConsole(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
            m.switchWorlds("many-worlds")
            simulation.trails()
            powerUps.spawn(player.position.x + 50, player.position.y - Math.random() * 50, "tech", false);
        }
        if (tech.isHealLowHealth) {
            const len = tech.isEnergyHealth ? 5 * Math.max(0, m.maxEnergy - m.energy) : 5 * Math.max(0, m.maxHealth - m.health)
            // for (let i = 0; i < len; i++) powerUps.spawn(player.position.x + 90 * (Math.random() - 0.5), player.position.y + 90 * (Math.random() - 0.5), "heal", false);
            powerUps.spawnDelay("heal", Math.floor(len), 8);
        }
        if (tech.interestRate > 0) {
            // const rate = ((level[level.levels[level.onLevel]].name === "final" || level[level.levels[level.onLevel]].name === "subway") ? 1 / 3 : 1) * tech.interestRate //this effect triggers extra times on these final levels
            let rate = tech.interestRate
            if (level.onLevel < level.levels.length - 1) {//make sure it's not on the lore level which has an undefined name
                const levelName = level.levels[level.onLevel]
                if (levelName === "final") rate *= 1 / 5
                // if (levelName === "subway") rate *= 1 / 3
            }
            if (powerUps.research.count > 0 && rate > 0) {
                const r = Math.ceil(rate * powerUps.research.count)
                simulation.inGameConsole(`${(rate * 100).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-r'>research</span> <span class='color-symbol'>=</span> ${r > 20 ? r + powerUps.orb.research(1) : powerUps.orb.research(r)}`)
                powerUps.spawnDelay("research", r, 4);
            }
            if (m.coupling > 0 && rate > 0) {
                const c = Math.ceil(rate * m.coupling / 3)
                powerUps.spawnDelay("coupling", c, 4);
                simulation.inGameConsole(`${(rate * 100 / 3).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-coupling'>coupling</span> <span class='color-symbol'>=</span> ${c > 20 ? c + powerUps.orb.coupling(1) : powerUps.orb.coupling(c)}`)
            }

            // let ammoSum = 0
            // for (let i = 0; i < b.inventory.length; i++) {
            //     if (b.guns[b.inventory[i]].ammo !== Infinity) ammoSum += b.guns[b.inventory[i]].ammo / b.guns[b.inventory[i]].ammoPack
            // }
            // if (ammoSum > 0 && b.inventory.length > 0) {
            //     const amount = Math.ceil(rate * ammoSum / b.inventory.length)
            //     powerUps.spawnDelay("ammo", amount, 4);
            //     simulation.inGameConsole(`${(rate * 100).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-g'>ammo</span> <span class='color-symbol'>=</span> ${amount > 20 ? amount + powerUps.orb.ammo(1) : powerUps.orb.ammo(amount)}`)
            // }

            // if (b.activeGun !== null && b.activeGun !== undefined && b.guns[b.activeGun].ammo !== Infinity) {
            //     const ammoPerOrb = b.guns[b.activeGun].ammoPack
            //     const a = Math.ceil(rate * b.guns[b.activeGun].ammo / ammoPerOrb)
            //     powerUps.spawnDelay("ammo", a, 4);
            //     simulation.inGameConsole(`${(rate * 100).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-g'>ammo</span> <span class='color-symbol'>=</span> ${a > 20 ? a + powerUps.orb.ammo(1) : powerUps.orb.ammo(a)}`)
            // }
            // const healPerOrb = (powerUps.heal.size() / 40 / (simulation.healScale ** 0.25)) ** 2
            // const h = Math.ceil(rate * m.health / healPerOrb)
            // powerUps.spawnDelay("heal", h, 4);
            // simulation.inGameConsole(`${(rate * 100).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-h'>health</span> <span class='color-symbol'>=</span> ${h > 20 ? h + powerUps.orb.heal(1) : powerUps.orb.heal(h)}`)

            // trying to spawn smaller heals
            // const healPerOrb = (powerUps.heal.size() / 40 / (simulation.healScale ** 0.25)) ** 2
            // console.log(healPerOrb)
            // let h = tech.interestRate * m.health / healPerOrb
            // console.log(tech.interestRate, m.health, healPerOrb, h)
            // const overHeal = h - Math.floor(h)
            // powerUps.spawn(m.pos.x, m.pos.y, "heal", true, null, Math.max(0.25, overHeal) * 40 * (simulation.healScale ** 0.25))
            // if (h > healPerOrb) powerUps.spawnDelay("heal", h);
            // simulation.inGameConsole(`${(Math.ceil(tech.interestRate * 100)).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-h'>health</span> <span class='color-symbol'>=</span> ${h > 20 ? h + powerUps.orb.heal(1) : powerUps.orb.heal(h)}`)
        }
        if (tech.interestRateGuns && b.inventory.length) {
            let rate = tech.interestRateGuns
            if (level.onLevel < level.levels.length - 1) {//make sure it's not on the lore level which has an undefined name
                const levelName = level.levels[level.onLevel]
                if (levelName === "final") rate *= 1 / 5
            }
            if (rate > 0) {
                let a = 0
                for (let i = 0; i < b.inventory.length; i++) {
                    const gun = b.guns[b.inventory[i]]
                    let ratio = gun.ammo / gun.ammoPack
                    if (Number.isFinite(ratio)) a += ratio
                }
                //     actual code that determines ammo you get from ammo power ups        name.ammo += Math.ceil(2 * (Math.random() + Math.random()) * name.ammoPack * couplingExtraAmmo)
                a *= rate / b.inventory.length / 2
                a = Math.ceil(a)
                simulation.inGameConsole(`${(rate * 100).toFixed(0)}<span class='color-symbol'>%</span> <span class='color-m'>interest</span> on <span class='color-ammo'>ammo</span> <span class='color-symbol'>=</span> ${powerUps.orb.ammo(1)}`)
                powerUps.spawnDelay("ammo", a, 4);
            }
        }
        if (tech.isEjectOld) {
            let index = null //find oldest tech that you have
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].count > 0 && !tech.tech[i].isInstant) {
                    index = i
                }
            }
            if (index !== null) { //eject it
                const effect = Math.pow(1.1, tech.tech[index].count)
                simulation.inGameConsole(`<strong>${(effect).toFixed(2)}x</strong> <strong class='color-d'>damage</strong> <em>//from obsolescence</em>`, 360)
                m.damageDone *= effect
                powerUps.ejectTech(index)
            }
        }
    },
    trainingText(say) {
        simulation.lastLogTime = 0; //clear previous messages
        simulation.isTextLogOpen = true
        simulation.inGameConsole(`<span style="font-size: 120%;line-height: 120%;"><span style="color:#51f;">supervised.learning</span>(<span style="color:#777; font-size: 80%;">${(Date.now() / 1000).toFixed(0)} s</span>)<span class='color-symbol'>:</span><br>${say}</span>`, Infinity)
        simulation.isTextLogOpen = false
    },
    trainingBackgroundColor: "#e1e1e1",
    custom() { },
    customTopLayer() { },
    updateDifficulty() {
        simulation.difficulty = level.levelsCleared * simulation.difficultyMode
        if (simulation.isTraining) {
            simulation.difficulty = 1
            simulation.difficultyMode = 1
        }
        simulation.healScale = 1 / (1 + simulation.difficulty * 0.043) //a higher denominator makes for lower heals // m.health += heal * simulation.healScale;
        if (simulation.difficultyMode === 1) {
            simulation.accelScale = 1.1
            simulation.CDScale = 0.9
        } else {
            simulation.accelScale = Math.min(6, Math.pow(1.024, simulation.difficulty))
            simulation.CDScale = Math.max(0.15, Math.pow(0.964, simulation.difficulty))
        }
    },
    constraintIndex: 0,
    constraintPopUp() {
        //pause
        if (!simulation.paused) {
            simulation.paused = true;
            simulation.isChoosing = true; //stops p from un pausing on key down

            document.body.style.cursor = "auto";
            document.getElementById("choose-grid").style.pointerEvents = "auto";
            document.getElementById("choose-grid").style.transitionDuration = "0s";
        }
        //build level info
        document.getElementById("choose-grid").classList.add('choose-grid-no-images')
        document.getElementById("choose-grid").classList.remove('choose-grid')
        document.getElementById("choose-grid").style.gridTemplateColumns = "auto"//"450px"
        let text = `<div class="constraint-module metallic-sparkle">${level.constraintDescription1}</div>`
        if (level.constraintDescription2) text += `<div class="constraint-module metallic-sparkle"><span>${level.constraintDescription2}</div>`
        text += `<div class="choose-grid-module" id = "choose-unPause" style="font-size: 1em;text-align: center;padding: 13px;border-radius:5px;">continue</div>`

        document.getElementById("choose-grid").innerHTML = text
        //show level info
        document.getElementById("choose-grid").style.opacity = "1"
        document.getElementById("choose-grid").style.transitionDuration = "0.25s"; //how long is the fade in on
        document.getElementById("choose-grid").style.visibility = "visible"
        document.getElementById("choose-unPause").addEventListener("click", () => {
            level.unPause()
            document.body.style.cursor = "none";
            document.getElementById("choose-grid").classList.add('choose-grid-no-images');
            document.getElementById("choose-grid").classList.remove('choose-grid');

        });
        requestAnimationFrame(() => {
            ctx.fillStyle = `rgba(150,150,150,0.9)`; //`rgba(221,221,221,0.6)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
    },
    setConstraints() {
        //populate array with possible constraints and reset constraints
        level.constraintDescription1 = level.constraintDescription2 = ""
        const possible = []
        for (let i = 0; i < level.constraint.length; i++) {
            level.constraint[i].remove()
            possible.push(i)
        }
        if (level.levels[level.onLevel] !== "final" && level.levels[level.onLevel] !== "null" && level.levels[level.onLevel] !== "initial" && !simulation.isTraining && m.alive && level.levelsCleared) {
            if (simulation.difficultyMode > 4 && possible.length) {
                //choose a random constraint from possible array and remove it from that array
                level.constraint[level.constraintIndex].effect()
                possible.splice(level.constraintIndex, 1)
                //generate text to describe the active constraints for the pause menu
                level.constraintDescription1 = level.constraint[level.constraintIndex].description
                level.constraintIndex++
                if (level.constraintIndex > level.constraint.length - 1) level.constraintIndex = 0
                if (simulation.difficultyMode > 6 && possible.length) {
                    level.constraint[level.constraintIndex].effect()
                    possible.splice(level.constraintIndex, 1)
                    level.constraintDescription2 += level.constraint[level.constraintIndex].description
                    level.constraintIndex++
                    if (level.constraintIndex > level.constraint.length - 1) level.constraintIndex = 0
                }
                document.getElementById("right-HUD-constraint").style.display = "block";
                // level.constraintPopUp()
                //animate making constraint HUD bigger then smaller
                if (!localSettings.isHideHUD) {
                    requestAnimationFrame(() => {
                        //grow and get bright
                        document.getElementById("right-HUD-constraint").style.opacity = 1
                        document.getElementById("right-HUD-constraint").style.fontSize = "23px"
                        document.getElementById("right-HUD-constraint").style.top = simulation.difficultyMode > 6 ? "6px" : "9px"
                        setTimeout(() => {
                            if (m.alive) {
                                //fade to background
                                document.getElementById("right-HUD-constraint").style.opacity = 0.35
                                document.getElementById("right-HUD-constraint").style.fontSize = "20px"
                                document.getElementById("right-HUD-constraint").style.top = "12px"
                            }
                        }, 5000);
                    });
                }
            } else {
                document.getElementById("right-HUD-constraint").style.display = "none";
            }
        } else {
            document.getElementById("right-HUD-constraint").style.display = "none";
        }
        //update HUD with constraints
        let text = `${level.constraintDescription1}`
        if (level.constraintDescription1) simulation.inGameConsole(`level<span class='color-symbol'>.</span>constraint<span class='color-symbol'>.</span>description<span class='color-symbol'>:</span> "<span style="color:#624;background-color: rgba(255, 215, 241, 0.4);border-radius:6px;padding:3px;">${level.constraintDescription1}</span>"`)
        if (simulation.difficultyMode > 6 && level.constraintDescription2) {
            text += `<br>${level.constraintDescription2}`
            if (level.constraintDescription2) simulation.inGameConsole(`level<span class='color-symbol'>.</span>constraint<span class='color-symbol'>.</span>description<span class='color-symbol'>:</span> "<span style="color:#624;background-color: rgba(255, 215, 241, 0.4);border-radius:6px;padding:3px;">${level.constraintDescription2}</span>"`)
        }
        document.getElementById("right-HUD-constraint").innerHTML = text

        if (level.constraintDescription1) {
            if (level.constraintDescription2) {
                document.getElementById("right-HUD").style.top = "80px";
            } else {
                document.getElementById("right-HUD").style.top = "57px"; //make room for tech list in "right-HUD"
            }
        } else {
            document.getElementById("right-HUD").style.top = "15px";
        }
    },
    announceText(x, y, isCentered = false) {  //max width around 900-1000
        let xAdjusted = x
        // simulation.draw.font.drawString('abcdefghijklmnopqrstuvwxyzdnasijfnibdiasbfuyabndkjbsdufdbaisfbkadsbfkusbfdkuhbsdfubdsaifbadosifbiousadbfiuasdbfiuasdbifubasi', x, y)
        if (!localSettings.isHideHUD) {
            if (level.constraintDescription1) {
                simulation.draw.font.word = new Path2D()
                if (isCentered) xAdjusted -= level.constraintDescription1.length * 29 / 2
                simulation.draw.font.drawString(level.constraintDescription1, xAdjusted, y) //level.constraintDescription2
                simulation.ephemera.push({
                    count: 300, //cycles before it self removes
                    do() {
                        ctx.beginPath()
                        const a = this.count > 280 ? Math.min((300 - this.count) * 0.05, 1) : Math.min(this.count / 20, 1)
                        // ctx.strokeStyle = "#444"
                        // ctx.lineWidth = 6 
                        // ctx.stroke(simulation.draw.font.word)
                        ctx.strokeStyle = `rgba(255, 83, 177,${a})`
                        ctx.lineWidth = 3  //Math.min(3, (360 - this.count) * 0.01)  //Math.floor(4 + 2 * Math.sin(simulation.cycle * 0.13));
                        ctx.stroke(simulation.draw.font.word)
                        this.count--
                        if (this.count < 0) {
                            simulation.removeEphemera(this)
                            if (level.constraintDescription2) {
                                simulation.draw.font.word = new Path2D()
                                if (isCentered) xAdjusted = x - level.constraintDescription2.length * 29 / 2
                                simulation.draw.font.drawString(level.constraintDescription2, xAdjusted, y) //level.constraintDescription2
                                simulation.ephemera.push({
                                    count: 300, //cycles before it self removes
                                    do() {
                                        const a = this.count > 280 ? Math.min((300 - this.count) * 0.05, 1) : Math.min(this.count / 20, 1)
                                        ctx.strokeStyle = `rgba(255, 83, 177,${a})`
                                        ctx.lineWidth = 3
                                        ctx.beginPath()
                                        ctx.stroke(simulation.draw.font.word)
                                        this.count--
                                        if (this.count < 0) simulation.removeEphemera(this)
                                    },
                                })
                            }

                        }
                    },
                })
            } else {
                simulation.draw.font.word = new Path2D()
                if (isCentered) xAdjusted -= level.levels[level.onLevel].length * 29 / 2
                simulation.draw.font.drawString(level.levels[level.onLevel], xAdjusted, y)
                simulation.ephemera.push({
                    count: 240, //cycles before it self removes
                    do() {
                        ctx.strokeStyle = `rgba(255, 255, 255,${Math.min(this.count / 20, 1)})`
                        ctx.lineWidth = 3
                        ctx.beginPath()
                        ctx.stroke(simulation.draw.font.word)
                        this.count--
                        if (this.count < 0) simulation.removeEphemera(this)
                    },
                })
            }
        }
    },
    announceTextTraining(x, y, text, color = `rgb(200, 200, 200)`) {  //max width around 900-1000
        let xAdjusted = x - text.length * 29 / 2
        // simulation.draw.font.drawString('abcdefghijklmnopqrstuvwxyzdnasijfnibdiasbfuyabndkjbsdufdbaisfbkadsbfkusbfdkuhbsdfubdsaifbadosifbiousadbfiuasdbfiuasdbifubasi', x, y)
        simulation.draw.font.word = new Path2D()
        simulation.draw.font.drawString(text, xAdjusted, y)
        simulation.ephemera.push({
            onLevel: level.levels[level.onLevel],
            do() {
                if (!m.alive || this.onLevel !== level.levels[level.onLevel]) simulation.removeEphemera(this)
                ctx.strokeStyle = color
                ctx.lineWidth = 3// + Math.random()
                ctx.beginPath()
                ctx.stroke(simulation.draw.font.word)
            },
        })
    },
    inGameText(x, y, text, count = 240, color = `rgb(200, 200, 200)`) {  //max width around 900-1000
        let xAdjusted = x - text.length * 29 / 2
        // simulation.draw.font.drawString('abcdefghijklmnopqrstuvwxyzdnasijfnibdiasbfuyabndkjbsdufdbaisfbkadsbfkusbfdkuhbsdfubdsaifbadosifbiousadbfiuasdbfiuasdbifubasi', x, y)
        simulation.draw.font.word = new Path2D()
        simulation.draw.font.drawString(text, xAdjusted, y)
        simulation.ephemera.push({
            name: "in game text",
            onLevel: level.levels[level.onLevel],
            count: count,
            do() {
                count--
                if (count < 0 || !m.alive || this.onLevel !== level.levels[level.onLevel]) simulation.removeEphemera(this)
                ctx.strokeStyle = color
                ctx.lineWidth = 3// + Math.random()
                ctx.beginPath()
                ctx.stroke(simulation.draw.font.word)
            },
        })
    },
    constraintDescription1: "", //used in pause menu and console
    constraintDescription2: "",
    constraint: [
        {
            description: `field drains energy`,
            effect() {
                simulation.ephemera.push({
                    levelName: level.levels[level.onLevel],
                    do() {
                        if (level.levels[level.onLevel] === this.levelName) {
                            if (input.field) {
                                m.energy -= 0.02
                                if (m.energy < 0) m.energy = 0
                            }
                        } else {
                            simulation.removeEphemera(this);
                        }
                    },
                })
            },
            remove() { }
        },
        {
            description: "half fire rate",
            effect() {
                level.isSlowFireRate = true
                b.setFireCD()
            },
            remove() {
                level.isSlowFireRate = false
                b.setFireCD()
            }
        },
        {
            description: "exploding blocks",
            effect() {
                simulation.ephemera.push({
                    time: 0,
                    levelName: level.levels[level.onLevel],
                    do() {
                        if (level.levels[level.onLevel] === this.levelName) {
                            //check if player is touching a block and give them explode status
                            const hits = Matter.Query.collides(player, body)
                            for (let i = 0; i < hits.length; i++) {
                                //hits[i].bodyA.inertia !== Infinity checks if it's not the player
                                let who = hits[i].bodyA
                                if (who.inertia !== Infinity && !who.isNotHoldable && !who.isInvulnerable && !who.isExplodingConstraintTimer) {
                                    who.isExplodingConstraintTimer = 120
                                }
                                who = hits[i].bodyB
                                if (who.inertia !== Infinity && !who.isNotHoldable && !who.isInvulnerable && !who.isExplodingConstraintTimer) {
                                    who.isExplodingConstraintTimer = 120
                                }
                            }
                            for (let i = 0; i < body.length; i++) {
                                if (body[i].isExplodingConstraintTimer) {
                                    //draw explosion timer
                                    ctx.beginPath();
                                    const v = body[i].vertices;
                                    ctx.moveTo(v[0].x, v[0].y);
                                    for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                                    ctx.lineTo(v[0].x, v[0].y);
                                    ctx.fillStyle = `rgba(255,80,30,${0.4 + 0.5 * Math.random()})`
                                    ctx.fill();

                                    // explode blocks when they are out of time
                                    if (!m.isTimeDilated) body[i].isExplodingConstraintTimer--
                                    if (body[i].isExplodingConstraintTimer === 0) {
                                        // if (body[i] === m.holdingTarget) m.drop()
                                        // b.explosion(body[i].position, 20 + 300 * Math.pow(body[i].mass, 0.25));
                                        // Matter.Composite.remove(engine.world, body[i]);
                                        // body.splice(i, 1);

                                        if (body[i] === m.holdingTarget) m.drop()
                                        const size = 20 + 300 * Math.pow(body[i].mass, 0.25)
                                        const x = body[i].position.x
                                        const y = body[i].position.y
                                        const onLevel = level.onLevel //prevent explosions in the next level
                                        Matter.Composite.remove(engine.world, body[i]);
                                        body.splice(i, 1);
                                        requestAnimationFrame(() => {
                                            if (onLevel === level.onLevel) b.explosion({ x: x, y: y }, size);
                                        })
                                    }
                                }
                            }
                        } else {
                            simulation.removeEphemera(this);
                        }
                    },
                })
            },
            remove() {
            }
        },
        {
            description: "hallucinations",
            effect() {
                requestAnimationFrame(() => {
                    spawn.hallucinationMob()
                    spawn.hallucinationMob()
                    // spawn.hallucinationMob()
                    // spawn.hallucinationPowerUp()
                })
            },
            remove() {
            }
        },
        {
            description: "reduced healing",//just A-Z for use with simulation.draw.font.drawString 
            effect() {
                level.isLowHeal = true
            },
            remove() {
                level.isLowHeal = false
            }
        },
        {
            description: "no health bar",
            effect() {
                level.isHideHealth = true
                document.getElementById("health").style.display = "none"
                document.getElementById("health-bg").style.display = "none"
            },
            remove() {
                level.isHideHealth = false
                if (tech.isEnergyHealth) {
                    document.getElementById("health").style.display = "none"
                    document.getElementById("health-bg").style.display = "none"
                } else if (!level.isHideHealth) {
                    document.getElementById("health").style.display = "inline"
                    document.getElementById("health-bg").style.display = "inline"
                }
            }
        },
        {
            description: "reduced energy regen",
            effect() {
                level.isReducedRegen = 0.5
            },
            remove() {
                level.isReducedRegen = 1
            }
        },
        {
            description: "lower max health",
            effect() {
                level.isReducedHealth = true
                m.setMaxHealth()
            },
            remove() {
                if (level.isReducedHealth) {
                    level.isReducedHealth = false
                    m.setMaxHealth()
                    m.addHealth(level.reducedHealthLost / simulation.healScale);
                    level.reducedHealthLost = 0
                } else {
                    level.isReducedHealth = false
                }
            }
        },
        {
            description: "spawn wimps",
            effect() {
                simulation.ephemera.push({
                    time: 0,
                    levelName: level.levels[level.onLevel],
                    do() {
                        this.time++
                        if (level.levels[level.onLevel] === this.levelName) {
                            // console.log(this.time, this.time > 3000, !(this.time % 720), (level.constraintDescription1 === "spawn wimps" || level.constraintDescription2 === "spawn wimps"))
                            if (this.time > 3000 && !(this.time % 720) && (level.constraintDescription1 === "spawn wimps" || level.constraintDescription2 === "spawn wimps")) spawn.WIMP(level.enter.x, level.enter.y)
                        } else {
                            simulation.removeEphemera(this);
                        }
                    },
                })
            },
            remove() {
            }
        },
        {
            description: "low damage after power ups",
            effect() {
                level.isNoDamage = true
                level.noDamageCycle = 0
            },
            remove() {
                level.isNoDamage = false
                level.noDamageCycle = 0
            }
        },
        {
            description: "taking damage heals mobs",
            effect() {
                level.isMobHealPlayerDamage = true
            },
            remove() {
                level.isMobHealPlayerDamage = false
            }
        },
        {
            description: "death heals mobs",
            effect() {
                level.isMobDeathHeal = true
            },
            remove() {
                level.isMobDeathHeal = false
            }
        },
        {
            description: "freeze on death",
            effect() {
                level.isMobDeathFreeze = true
            },
            remove() {
                level.isMobDeathFreeze = false
            }
        },
        {
            description: "more shielded mobs",
            effect() {
                level.isMobShields = true
            },
            remove() {
                level.isMobShields = false
            }
        },
        {
            description: "higher JUNK chance",
            effect() {
                level.junkAdded = 0.4
            },
            remove() {
                level.junkAdded = 0
            }
        },
        {
            description: "fewer choices",
            effect() {
                level.fewerChoices = true
            },
            remove() {
                level.fewerChoices = false
            }
        },
        {
            description: "power ups in stasis",
            effect() {
                level.isNextLevelPowerUps = true
                //remove all current power ups
                for (let i = powerUp.length - 1; i > -1; i--) {
                    powerUps.powerUpStorage.push({ name: powerUp[i].name, size: powerUp[i].size })
                    Matter.Composite.remove(engine.world, powerUp[i]);
                    powerUp.splice(i, 1)
                }
            },
            remove() {
                level.isNextLevelPowerUps = false
                if (powerUps.powerUpStorage.length) {
                    const delay = 10
                    let i = 0
                    let cycle = () => {
                        if (powerUps.powerUpStorage.length && m.alive && powerUp.length < 300) {
                            requestAnimationFrame(cycle);
                            if (!simulation.paused && !simulation.isChoosing) {
                                if (!(simulation.cycle % delay)) {
                                    const where = { x: m.pos.x + 70 * (Math.random() - 0.5), y: m.pos.y + 70 * (Math.random() - 0.5) }
                                    powerUps.directSpawn(where.x, where.y, powerUps.powerUpStorage[i].name, true, powerUps.powerUpStorage[i].size);
                                    powerUps.powerUpStorage.splice(i, 1);
                                }
                            }
                        } else {
                            powerUps.powerUpStorage = []
                        }
                    }
                    requestAnimationFrame(cycle);
                }
            }
        },
        {
            description: "mobs respawn",
            effect() {
                level.isMobRespawn = true
            },
            remove() {
                level.isMobRespawn = false
            }
        },
        {
            description: "no duplication",
            effect() {
                level.isNoDuplicate = true
            },
            remove() {
                level.isNoDuplicate = false
            }
        },
        {
            description: "double ammo cost",
            effect() {
                level.is2xAmmo = true
            },
            remove() {
                level.is2xAmmo = false
            }
        },
        {
            description: "lower max energy",
            effect() {
                level.isReducedEnergy = true
                m.setMaxEnergy()
            },
            remove() {
                if (level.isReducedEnergy) {
                    level.isReducedEnergy = false
                    m.setMaxEnergy()
                } else {
                    level.isReducedEnergy = false
                }
            }
        },
        {
            description: "slow bots",
            effect() {
                requestAnimationFrame(() => {
                    level.isSlowBots = true
                    b.clearPermanentBots();
                    b.respawnBots();
                });
            },
            remove() {
                if (level.isSlowBots) {
                    requestAnimationFrame(() => {
                        level.isSlowBots = false
                        b.clearPermanentBots();
                        b.respawnBots();
                    });
                } else {
                    level.isSlowBots = false
                }
            }
        },
        {
            description: "blurry choices",
            effect() {
                level.blurryChoices = true
            },
            remove() {
                level.blurryChoices = false
            }
        },
    ],
    isMobShields: false,
    junkAdded: 0,
    isNextLevelPowerUps: false,
    isMobRespawn: false,
    fewerChoices: false,
    blurryChoices: false,
    isNoDuplicate: false,
    is2xAmmo: false,
    isReducedEnergy: false,
    isSlowBots: false,
    isMobDeathFreeze: false,
    isMobDeathHeal: false,
    isMobHealPlayerDamage: false,
    isNoDamage: false,
    noDamageCycle: 0,
    reducedHealthLost: 0,
    isReducedHealth: false,
    isReducedRegen: 1,
    isHideHealth: false,
    isSlowFireRate: false,
    isNoPause: false,
    isLowHeal: false,
    levelAnnounce() {
        const cheating = simulation.isCheating ? "(testing)" : ""
        if (level.levelsCleared === 0) {
            return `initial ${cheating}`;
        } else {
            return `${level.levelsCleared} ${level.levels[level.onLevel]} ${cheating}`
        }
    },
    announceMobTypes() {
        simulation.inGameConsole(`spawn<span class='color-symbol'>.</span>${spawn.pickList[0]}<span class='color-symbol'>(</span>x<span class='color-symbol'>,</span>y<span class='color-symbol'>)</span> //Tier ${spawn.mobTierSpawnOrder[level.levelsCleared - 1]}`)
        simulation.inGameConsole(`spawn<span class='color-symbol'>.</span>${spawn.pickList[1]}<span class='color-symbol'>(</span>x<span class='color-symbol'>,</span>y<span class='color-symbol'>)</span> //Tier ${spawn.mobTierSpawnOrder[level.levelsCleared]}`)
    },
    disableExit: false,
    nextLevel() {
        if (!level.disableExit) {
            level.levelsCleared++;
            level.onLevel++; //cycles map to next level
            level.updateDifficulty()

            if (simulation.isTraining) {
                level.levelsCleared = 1 //to control the difficulty of mobs
                if (level.onLevel > level.levels.length - 1) { //if all training levels are completed
                    level.disableExit = true
                    document.getElementById("health").style.display = "none"
                    document.getElementById("health-bg").style.display = "none"
                    document.getElementById("defense-bar").style.display = "none"
                    document.getElementById("text-log").style.display = "none"
                    document.getElementById("fade-out").style.opacity = 1; //slowly fades out
                    setTimeout(function () {
                        simulation.paused = true;
                        level.disableExit = false;
                        engine.world.bodies.forEach((body) => {
                            Matter.Composite.remove(engine.world, body)
                        })
                        Engine.clear(engine);
                        simulation.splashReturn();
                    }, 6000);
                    return
                }
            } else {
                if (level.onLevel > level.levels.length - 1) level.onLevel = 0;
            }
            //reset lost tech display
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].isLost) tech.tech[i].isLost = false;
            }
            simulation.updateTechHUD();
            simulation.clearNow = true; //triggers in simulation.clearMap to remove all physics bodies and setup for new map

            //pop up new level info screen for a few seconds    //|| level.levels[level.onLevel] === "subway"
            if (!localSettings.isHideHUD && m.alive && (level.levels[level.onLevel] === "final" || level.levels[level.onLevel] === "reactor")) {
                // if (!localSettings.isHideHUD && m.alive) {
                //pause
                if (!simulation.paused) {
                    simulation.paused = true;
                    simulation.isChoosing = true; //stops p from un pausing on key down
                }

                //build level info
                document.getElementById("choose-grid").style.gridTemplateColumns = "250px"
                let text = `<div class="card-background" style="height:auto; border: none; background-color: transparent; line-height: 160%; background-color: var(--card-color); font-size: 1.15em;"> <div class="card-text">`
                for (let i = 0; i < level.levels.length; i++) {
                    if (i < level.levelsCleared) {
                        text += `<div style="user-select: none;">${level.levels[i]}</div>`
                    } else if (i === level.levelsCleared) {
                        text += `<div class="unblur" style="user-select: none;"><strong>${level.levels[i]}</strong></div>`
                        // ${spawn.mobTypeSpawnOrder[level.levelsCleared]} Tier ${spawn.mobTierSpawnOrder[level.levelsCleared]}
                        // <br>${spawn.mobTypeSpawnOrder[level.levelsCleared - 1]} Tier ${spawn.mobTierSpawnOrder[level.levelsCleared - 1]}`
                    } else {
                        text += `<div class= "blur-text" style="user-select: none;">${level.levels[i]}</div>` //blurry text
                        // `spawn<span class='color-symbol'>.</span><span class='color-symbol'>(</span>x<span class='color-symbol'>,</span>y<span class='color-symbol'>)</span>`
                    }
                }
                text += `</div></div>`

                document.getElementById("choose-grid").innerHTML = text
                //show level info
                document.getElementById("choose-grid").style.opacity = "1"
                document.getElementById("choose-grid").style.transitionDuration = "0.25s"; //how long is the fade in on
                document.getElementById("choose-grid").style.visibility = "visible"
                simulation.draw.cons();
                simulation.draw.body();
                level.customTopLayer();
                let count = countMax = simulation.testing ? 0 : 240
                let newLevelDraw = () => {
                    count--
                    if (count > 0) {
                        requestAnimationFrame(newLevelDraw);
                    } else { //unpause
                        if (m.immuneCycle < m.cycle + 15) m.immuneCycle = m.cycle + 30; //player is immune to damage for 30 cycles
                        if (simulation.paused) requestAnimationFrame(cycle);
                        if (m.alive) simulation.paused = false;
                        simulation.isChoosing = false; //stops p from un pausing on key down
                        build.unPauseGrid()
                        document.getElementById("choose-grid").style.opacity = "0"
                        document.getElementById("choose-grid").style.visibility = "hidden"
                    }
                    //draw
                    simulation.wipe();
                    m.look();
                    simulation.camera();
                    const scale = 15
                    ctx.setLineDash([scale * (countMax - count), scale * count]);
                    simulation.draw.wireFrame();
                    ctx.setLineDash([]);
                    ctx.restore();
                    simulation.drawCursor();
                }
                requestAnimationFrame(newLevelDraw);
            }
        }
    },
    unPause() {
        if (m.immuneCycle < m.cycle + 15) m.immuneCycle = m.cycle + 30; //player is immune to damage for 30 cycles
        if (simulation.paused) requestAnimationFrame(cycle);
        if (m.alive) simulation.paused = false;
        simulation.isChoosing = false; //stops p from un pausing on key down
        build.unPauseGrid()
        document.getElementById("choose-grid").style.opacity = "0"
        document.getElementById("choose-grid").style.visibility = "hidden"
        // setTimeout(() => {
        // }, 1000);
    },
    populateLevels() { //run a second time if URL is loaded
        if (document.getElementById("banned").value) { //remove levels from ban list in settings
            const banList = document.getElementById("banned").value.replace(/,/g, ' ').replace(/\s\s+/g, ' ').replace(/[^\w\s]/g, '') //replace commas with spaces, replace double spaces with single, remove strange symbols
            const remove = banList.split(" ");
            // console.log('remove these', remove)
            // console.log('community levels before', level.communityLevels)
            for (let i = 0; i < remove.length; i++) {
                const index = level.communityLevels.indexOf(remove[i])
                if (index !== -1) {
                    level.communityLevels.splice(index, 1);
                    // console.log('removed level:', remove[i])
                    requestAnimationFrame(() => { simulation.inGameConsole(`banned level: <strong style="color: '#f00';">${remove[i]}</strong>`); });
                }
            }
            // console.log('community levels after', level.communityLevels)
            // console.log('Landgreen levels before', level.playableLevels)
            for (let i = 0; i < remove.length; i++) {
                if (level.playableLevels.length + level.communityLevels.length * simulation.isCommunityMaps < 10) break //can't remove too many levels
                const index = level.playableLevels.indexOf(remove[i])
                if (index !== -1) {
                    level.playableLevels.splice(index, 1);
                    // console.log('removed level:', remove[i])
                    requestAnimationFrame(() => { simulation.inGameConsole(`banned level: <strong style="color: '#f00';">${remove[i]}</strong>`); });
                }
            }
            // console.log('Landgreen levels after', level.playableLevels)
        }

        if (document.getElementById("seed").value) { //check for player entered seed in settings
            Math.initialSeed = String(document.getElementById("seed").value)
        }
        Math.seed = Math.abs(Math.hash(Math.initialSeed)) //update randomizer seed

        if (simulation.isTraining) {
            simulation.isHorizontalFlipped = false
            level.levels = level.trainingLevels.slice(0) //copy array, not by just by assignment
            if (simulation.isCommunityMaps) level.trainingLevels.push("diamagnetism")
        } else {
            level.levels = level.playableLevels.slice(0) //copy array, not by just by assignment
            if (simulation.isCommunityMaps) {
                level.levels = level.levels.concat(level.communityLevels)
                simulation.isHorizontalFlipped = false;
            } else {
                simulation.isHorizontalFlipped = (Math.seededRandom() < 0.5) ? true : false //if true, some maps are flipped horizontally
            }
            level.levels = seededShuffle(level.levels); //shuffles order of maps with seeded random
            level.levels.length = 9 //remove any extra levels past 9
            pick = ["interferometer", "factory", "reservoir"]
            // level.levels.splice(Math.floor(Math.seededRandom(level.levels.length * 0.6, level.levels.length)), 0, pick[Math.floor(Math.random() * pick.length)]); //add level to the back half of the randomized levels list
            level.levels.splice(6, 0, "reactor"); //add level to the 7th location of the randomized levels list
            level.levels.push(pick[Math.floor(Math.random() * pick.length)]); //add level to the end of the randomized levels list
            if (!build.isExperimentSelection || (build.hasExperimentalMode && !simulation.isCheating)) { //experimental mode is endless, unless you only have an experiment Tech
                level.levels.unshift("initial"); //add level to the start of the randomized levels list
                level.levels.push("subway"); //add level to the end of the randomized levels list
                level.levels.push("final"); //add level to the end of the randomized levels list
            }
        }
    },
    flipHorizontal() {
        const flipX = (who) => {
            for (let i = 0, len = who.length; i < len; i++) {
                Matter.Body.setPosition(who[i], {
                    x: -who[i].position.x,
                    y: who[i].position.y
                })
            }
        }
        flipX(map)
        flipX(body)
        flipX(mob)
        flipX(powerUp)
        for (let i = 0, len = cons.length; i < len; i++) {
            cons[i].pointA.x *= -1
            cons[i].pointB.x *= -1
        }
        for (let i = 0, len = consBB.length; i < len; i++) {
            consBB[i].pointA.x *= -1
            consBB[i].pointB.x *= -1
        }
        level.exit.x = -level.exit.x - 100 //minus the 100 because of the width of the graphic
    },
    flipVertical() {
        const flipY = (who) => {
            for (let i = 0, len = who.length; i < len; i++) {
                Matter.Body.setPosition(who[i], { x: who[i].position.x, y: -who[i].position.y - player.position.y })
            }
        }
        flipY(map)
        flipY(body)
        flipY(mob)
        flipY(powerUp)
        Matter.Body.setPosition(player, { x: player.position.x, y: -2 * player.position.y })

        // for (let i = 0, len = cons.length; i < len; i++) {
        //     cons[i].pointA.x *= -1
        //     cons[i].pointB.x *= -1
        // }
        // for (let i = 0, len = consBB.length; i < len; i++) {
        //     consBB[i].pointA.x *= -1
        //     consBB[i].pointB.x *= -1
        // }
        // level.exit.x = -level.exit.x - 100 //minus the 100 because of the width of the graphic
    },
    exitCount: 0,
    setPosToSpawn(xPos, yPos) {
        m.spawnPos.x = m.pos.x = xPos;
        m.spawnPos.y = m.pos.y = yPos;
        level.enter.x = m.spawnPos.x - 50;
        level.enter.y = m.spawnPos.y + 20;
        m.transX = m.transSmoothX = canvas.width2 - m.pos.x;
        m.transY = m.transSmoothY = canvas.height2 - m.pos.y;
        m.Vx = m.spawnVel.x;
        m.Vy = m.spawnVel.y;
        player.force.x = 0;
        player.force.y = 0;
        Matter.Body.setPosition(player, m.spawnPos);
        Matter.Body.setVelocity(player, m.spawnVel);
        //makes perfect diamagnetism tech: Lenz's law show up in the right spot at the start of a level
        m.fieldPosition = {
            x: m.pos.x,
            y: m.pos.y
        }
        m.fieldAngle = m.angle
    },
    enter: {
        x: 0,
        y: 0,
        draw() {
            ctx.beginPath();
            ctx.moveTo(level.enter.x, level.enter.y + 30);
            ctx.lineTo(level.enter.x, level.enter.y - 80);
            ctx.bezierCurveTo(level.enter.x, level.enter.y - 170, level.enter.x + 100, level.enter.y - 170, level.enter.x + 100, level.enter.y - 80);
            ctx.lineTo(level.enter.x + 100, level.enter.y + 30);
            ctx.lineTo(level.enter.x, level.enter.y + 30);
            ctx.fillStyle = "#ccc";
            ctx.fill();
        }
    },
    exit: {
        x: 0,
        y: 0,
        drawAndCheck() {
            if ( //check
                player.position.x > level.exit.x &&
                player.position.x < level.exit.x + 100 &&
                player.position.y > level.exit.y - 250 &&
                player.position.y < level.exit.y + 35 &&
                player.velocity.y < 0.15 &&
                !level.isFlipping
            ) {
                // level.exitCount += input.down ? 8 : 2
                level.exitCount += m.health < 0 ? 0.5 : 3
            } else if (level.exitCount > 0) {
                level.exitCount -= 3
            }

            ctx.beginPath();
            ctx.moveTo(level.exit.x, level.exit.y + 30);
            ctx.lineTo(level.exit.x, level.exit.y - 80);
            ctx.bezierCurveTo(level.exit.x, level.exit.y - 170, level.exit.x + 100, level.exit.y - 170, level.exit.x + 100, level.exit.y - 80);
            ctx.lineTo(level.exit.x + 100, level.exit.y + 30);
            ctx.lineTo(level.exit.x, level.exit.y + 30);
            ctx.fillStyle = "#0ff";
            ctx.fill();

            if (level.exitCount > 0) { //stroke outline of door from 2 sides,  grows with count
                ctx.beginPath();
                ctx.moveTo(level.exit.x, level.exit.y + 40);
                ctx.lineTo(level.exit.x, level.exit.y - 80);
                ctx.bezierCurveTo(level.exit.x, level.exit.y - 148, level.exit.x + 50, level.exit.y - 148, level.exit.x + 50, level.exit.y - 148);
                ctx.moveTo(level.exit.x + 100, level.exit.y + 40);
                ctx.lineTo(level.exit.x + 100, level.exit.y - 80);
                ctx.bezierCurveTo(level.exit.x + 100, level.exit.y - 148, level.exit.x + 50, level.exit.y - 148, level.exit.x + 50, level.exit.y - 148);
                ctx.setLineDash([200, 200]);
                ctx.lineDashOffset = Math.max(-15, 185 - 2.1 * level.exitCount)
                if (m.health < 0) {
                    ctx.strokeStyle = "#f00"
                    ctx.lineWidth = 6 + 0.1 * (level.exitCount)
                } else {
                    ctx.strokeStyle = "#444"
                    ctx.lineWidth = 2
                }
                ctx.stroke();
                ctx.setLineDash([]);

                if (level.exitCount > 100) {
                    level.exitCount = 0

                    //prompt an option to do the training levels or continue to the normal game
                    if (!simulation.isChoosing && m.alive && !simulation.isTraining && !simulation.isCheating && b.inventory.length === 0 && level.levelsCleared === 0 && localSettings.isTrainingNotAttempted) {
                        //pause
                        if (!simulation.paused) {
                            simulation.paused = true;
                            simulation.isChoosing = true; //stops p from un pausing on key down

                            document.body.style.cursor = "auto";
                            document.getElementById("choose-grid").style.pointerEvents = "auto";
                            document.getElementById("choose-grid").style.transitionDuration = "0s";
                        }
                        //build level info
                        document.getElementById("choose-grid").classList.add('choose-grid-no-images');
                        document.getElementById("choose-grid").classList.remove('choose-grid');
                        document.getElementById("choose-grid").style.gridTemplateColumns = "350px"
                        let text = `
                            <div class="choose-grid-module" id = "choose-training" style = "font-size: 1em; padding:10px;color:#333;">
                                <h2 style="text-align: center;letter-spacing: 5px;">training</h2>
                                Begin the <strong>guided tutorial</strong> that shows how to use ${powerUps.orb.field()} and ${powerUps.orb.gun()}.
                            </div>
                            <div class="choose-grid-module" id = "choose-unPause" style = "font-size: 1em; padding:10px;color:#333;">
                                <h2 style="text-align: center; letter-spacing: 7px;">play</h2>
                                Begin the <strong>standard game</strong> where you progress through <strong>13</strong> random levels and beat the final boss.
                            </div>`
                        document.getElementById("choose-grid").innerHTML = text
                        //show level info
                        document.getElementById("choose-grid").style.opacity = "1"
                        document.getElementById("choose-grid").style.transitionDuration = "0.25s"; //how long is the fade in on
                        document.getElementById("choose-grid").style.visibility = "visible"
                        document.getElementById("choose-training").addEventListener("click", () => {
                            level.unPause()
                            document.body.style.cursor = "none";
                            simulation.isTraining = true
                            level.levelsCleared--;
                            level.onLevel--
                            simulation.isHorizontalFlipped = false
                            level.levels = level.trainingLevels.slice(0) //copy array, not by just by assignment
                            level.nextLevel()
                            //reset hide image style
                            document.getElementById("choose-grid").classList.add('choose-grid-no-images');
                            document.getElementById("choose-grid").classList.remove('choose-grid');
                        });
                        document.getElementById("choose-unPause").addEventListener("click", () => {
                            level.unPause()
                            document.body.style.cursor = "none";
                            level.nextLevel()
                            //reset hide image style
                            document.getElementById("choose-grid").classList.add('choose-grid-no-images');
                            document.getElementById("choose-grid").classList.remove('choose-grid');
                        });
                        requestAnimationFrame(() => {
                            ctx.fillStyle = `rgba(150,150,150,0.9)`; //`rgba(221,221,221,0.6)`;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        });
                    } else { //advance to next level
                        level.nextLevel()
                    }
                }
            }
        },
        // draw() {
        //     ctx.beginPath();
        //     ctx.moveTo(level.exit.x, level.exit.y + 30);
        //     ctx.lineTo(level.exit.x, level.exit.y - 80);
        //     ctx.bezierCurveTo(level.exit.x, level.exit.y - 170, level.exit.x + 100, level.exit.y - 170, level.exit.x + 100, level.exit.y - 80);
        //     ctx.lineTo(level.exit.x + 100, level.exit.y + 30);
        //     ctx.lineTo(level.exit.x, level.exit.y + 30);
        //     ctx.fillStyle = "#0ff";
        //     ctx.fill();
        // }
    },
    addToWorld() { //needs to be run to put bodies into the world
        for (let i = 0; i < map.length; i++) {
            map[i].collisionFilter.category = cat.map;
            map[i].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
            Matter.Body.setStatic(map[i], true); //make static
            Composite.add(engine.world, map[i]); //add to world
        }
    },
    spinner(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0) {
        x += width / 2
        y += height / 2
        const who = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.body,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            isNotHoldable: true,
            frictionAir: frictionAir,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
        });
        Matter.Body.setAngle(who, angle)
        Matter.Body.setAngularVelocity(who, angularVelocity);
        Matter.Body.setDensity(who, density)
        Composite.add(engine.world, who); //add to world
        who.classType = "body"

        const constraint = Constraint.create({ //fix rotor in place, but allow rotation
            pointA: {
                x: who.position.x,
                y: who.position.y
            },
            bodyB: who,
            stiffness: 1,
            damping: 1
        });
        Composite.add(engine.world, constraint);
        return constraint
    },
    rotor(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
        x += width / 2
        y += height / 2
        const who = body[body.length] = Bodies.rectangle(x, y, width, height, {
            isRotor: true,
            collisionFilter: {
                category: cat.body,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            isNotHoldable: true,
            frictionAir: frictionAir,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            rotationForce: rotationForce,
        });
        Matter.Body.setAngle(who, angle)
        Matter.Body.setAngularVelocity(who, angularVelocity);

        Matter.Body.setDensity(who, density)
        const constraint = Constraint.create({ //fix rotor in place, but allow rotation
            pointA: {
                x: who.position.x,
                y: who.position.y
            },
            bodyB: who,
            stiffness: 1,
            damping: 1
        });
        Composite.add(engine.world, constraint);
        who.center = {
            x: who.position.x,
            y: who.position.y
        }
        who.rotate = function () {
            if (!m.isTimeDilated) {
                Matter.Body.applyForce(this, {
                    x: this.position.x + 100,
                    y: this.position.y + 100
                }, {
                    x: this.rotationForce * this.mass,
                    y: 0
                })
            } else {
                Matter.Body.setAngularVelocity(this, 0);
            }
        }
        // if (rotate) {
        //     rotor.rotate = function() {
        //         if (!m.isTimeDilated) {
        //             Matter.Body.applyForce(rotor, {
        //                 x: rotor.position.x + 100,
        //                 y: rotor.position.y + 100
        //             }, {
        //                 x: rotate * rotor.mass,
        //                 y: 0
        //             })
        //         } else {
        //             Matter.Body.setAngularVelocity(rotor, 0);
        //         }
        //     }
        // }

        Composite.add(engine.world, who); //add to world
        who.classType = "body"

        return who
    },
    boost(x, y, speed = 1000, angle = Math.PI / 2) { //height is how high the player will be flung above y
        if (angle !== Math.PI / 2) { //angle !== 3 * Math.PI / 2
            angle *= -1
            who = map[map.length] = Matter.Bodies.fromVertices(x + 50, y + 35, Vertices.fromPath("80 40 -80 40 -50 -40 50 -40"), {
                collisionFilter: {
                    category: cat.body,
                    mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
                },
                query() {
                    // check for collisions
                    const rayVector = Vector.add(this.position, Vector.rotate({ x: 100, y: 0 }, angle))
                    query = (who) => {
                        const list = Matter.Query.ray(who, this.position, rayVector, 100)
                        if (list.length > 0 && !list[0].bodyA.isDarkMatter) {
                            Matter.Body.setVelocity(list[0].bodyA, Vector.rotate({ x: 1.21 * Math.sqrt(Math.abs(speed)), y: 0 }, angle));
                        }
                    }
                    query(body)
                    query(mob)
                    query(bullet)
                    query(powerUp)
                    //player collision
                    const list = Matter.Query.ray([player], this.position, rayVector, 100)
                    if (list.length > 0) {
                        Matter.Body.setVelocity(player, Vector.rotate({ x: 1.21 * Math.sqrt(Math.abs(speed)), y: 0 }, angle));
                        m.buttonCD_jump = 0; // reset short jump counter to prevent short jumps on boosts
                        m.hardLandCD = 0 // disable hard landing
                    }

                    //draw 
                    const v1 = this.vertices[0]
                    const v2 = this.vertices[1]
                    let unit = Vector.rotate({ x: 60, y: 0 }, angle)
                    let v3 = Vector.add(v2, unit)
                    let v4 = Vector.add(v1, unit)
                    ctx.beginPath();
                    ctx.moveTo(v1.x, v1.y)
                    ctx.lineTo(v2.x, v2.y)
                    ctx.lineTo(v3.x, v3.y)
                    ctx.lineTo(v4.x, v4.y)
                    ctx.fillStyle = "rgba(200,0,255,0.05)";
                    ctx.fill()
                    unit = Vector.rotate({ x: 20, y: 0 }, angle)
                    v3 = Vector.add(v2, unit)
                    v4 = Vector.add(v1, unit)
                    ctx.beginPath();
                    ctx.moveTo(v1.x, v1.y)
                    ctx.lineTo(v2.x, v2.y)
                    ctx.lineTo(v3.x, v3.y)
                    ctx.lineTo(v4.x, v4.y)
                    ctx.fillStyle = "rgba(200,0,255,0.15)";
                    ctx.fill()
                },
            });
            Matter.Body.rotate(who, angle + Math.PI / 2);
            return who
        } else {
            who = map[map.length] = Matter.Bodies.fromVertices(x + 50, y + 35, Vertices.fromPath("120 40 -120 40 -50 -40 50 -40"), {
                collisionFilter: {
                    category: cat.body,
                    mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
                },
                boostBounds: {
                    min: {
                        x: x,
                        y: y - 20
                    },
                    max: {
                        x: x + 100,
                        y: y
                    }
                },
                query() {
                    // check for collisions
                    query = (who) => {
                        if (Matter.Query.region(who, this.boostBounds).length > 0) {
                            list = Matter.Query.region(who, this.boostBounds)
                            Matter.Body.setVelocity(list[0], {
                                x: list[0].velocity.x + (Math.random() - 0.5) * 2.5, //add a bit of horizontal drift to reduce endless bounces
                                y: -1.21 * Math.sqrt(Math.abs(speed)) //give a upwards velocity
                            });
                        }
                    }
                    query(body)
                    query(mob)
                    query(bullet)
                    query(powerUp)
                    //player collision
                    if (Matter.Query.region([player], this.boostBounds).length > 0 && !input.down) {
                        m.buttonCD_jump = 0; // reset short jump counter to prevent short jumps on boosts
                        m.hardLandCD = 0 // disable hard landing
                        if (player.velocity.y > 26) {
                            Matter.Body.setVelocity(player, {
                                x: player.velocity.x,
                                y: -15 //gentle bounce if coming down super fast
                            });
                        } else {
                            Matter.Body.setVelocity(player, {
                                x: player.velocity.x + (Math.random() - 0.5) * 2.5,
                                y: -1.21 * Math.sqrt(Math.abs(speed)) //give an upwards velocity that will put the player that the height desired
                            });
                        }
                    }

                    //draw 
                    ctx.fillStyle = "rgba(200,0,255,0.15)";
                    ctx.fillRect(this.boostBounds.min.x, this.boostBounds.min.y - 10, 100, 30);
                    ctx.fillStyle = "rgba(200,0,255,0.05)";
                    ctx.fillRect(this.boostBounds.min.x, this.boostBounds.min.y - 50, 100, 70);
                },
            });
            return who
        }
    },
    elevator(x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }, isAtTop = false) {
        x += width / 2
        y += height / 2
        maxHeight += height / 2
        const yTravel = maxHeight - y
        force += simulation.g
        const who = body[body.length] = Bodies.rectangle(x, isAtTop ? maxHeight : y, width, height, {
            collisionFilter: {
                category: cat.body, //cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.mob | cat.mobBullet //| cat.powerUp
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            frictionAir: 0.001,
            holdX: x,
            move() {
                if (!m.isTimeDilated) {
                    if (this.isUp) { //moving up still with high air friction
                        this.force.y -= force * this.mass //hard force propels up, even with high friction

                        if (this.position.y < maxHeight) { //switch to down mode
                            this.isUp = false
                            this.frictionAir = friction.down
                            //adds a hard jerk at the top of vertical motion because it's fun
                            Matter.Body.setPosition(this, { x: this.holdX, y: maxHeight });
                            Matter.Body.setVelocity(this, { x: 0, y: 0 });
                        }
                    } else if (this.position.y + 10 * this.velocity.y > y) { //free falling down, with only air friction
                        Matter.Body.setVelocity(this, { //slow down early to avoid a jerky stop that can pass through blocks
                            x: 0,
                            y: this.velocity.y * 0.7
                        });
                        if (this.position.y + this.velocity.y > y) { //switch to up mode
                            this.isUp = true
                            this.frictionAir = friction.up
                        }
                    }
                    Matter.Body.setVelocity(this, { x: 0, y: this.velocity.y });
                }
                //edge limits
                if (this.position.y < maxHeight) {
                    Matter.Body.setPosition(this, { x: this.holdX, y: maxHeight });
                } else if (this.position.y > y) {
                    Matter.Body.setPosition(this, { x: this.holdX, y: y });
                }
                // hold horizontal position
                Matter.Body.setPosition(this, { x: this.holdX, y: this.position.y });
            },
            moveOnTouch() {
                if (!m.isTimeDilated) {
                    if (this.isUp) { //moving up still with high air friction
                        this.force.y -= force * this.mass //hard force propels up, even with high friction

                        if (this.position.y < maxHeight) { //switch to down mode
                            this.isUp = false
                            this.frictionAir = friction.down
                            //adds a hard jerk at the top of vertical motion because it's fun
                            Matter.Body.setPosition(this, { x: this.holdX, y: maxHeight });
                            Matter.Body.setVelocity(this, { x: 0, y: 0 });
                        }
                    } else if (this.position.y + 10 * this.velocity.y > y) { //free falling down, with only air friction
                        //slow down early to avoid a jerky stop that can pass through blocks
                        Matter.Body.setVelocity(this, { x: 0, y: this.velocity.y * 0.7 });
                        //switch to up mode
                        // if (this.position.y + this.velocity.y > y) {
                        //     this.isUp = true
                        //     this.frictionAir = friction.up
                        // }
                    }
                    Matter.Body.setVelocity(this, { x: 0, y: this.velocity.y });
                }
                //draw line to show how far to will extend
                ctx.beginPath();
                ctx.moveTo(x, y + height / 2);
                ctx.lineTo(x, maxHeight - height / 2);
                ctx.strokeStyle = `rgba(0,0,0,0.2)`
                ctx.lineWidth = "2"
                ctx.stroke();

                //draw body
                ctx.beginPath();
                ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
                for (let j = 1; j < this.vertices.length; j++) {
                    ctx.lineTo(this.vertices[j].x, this.vertices[j].y);
                }
                ctx.lineTo(this.vertices[0].x, this.vertices[0].y);
                ctx.lineWidth = "2"
                ctx.strokeStyle = `#333`
                ctx.fillStyle = `rgba(200,200,200,1)`
                //edge limits
                if (this.position.y < maxHeight) {
                    Matter.Body.setPosition(this, { x: this.holdX, y: maxHeight });
                } else if (this.position.y > y) {
                    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.15 * Math.random()})`
                    Matter.Body.setPosition(this, { x: this.holdX, y: y });
                    //undoing force of gravity
                    this.force.y -= this.mass * simulation.g;
                    if (Matter.Query.collides(this, [player]).length) {
                        this.isUp = true
                        this.frictionAir = friction.up
                    }
                }
                ctx.fill();
                ctx.stroke();
                // hold horizontal position
                Matter.Body.setPosition(this, { x: this.holdX, y: this.position.y });
            },
            off() {
                Matter.Body.setPosition(this, { x: this.holdX, y: this.position.y });
                Matter.Body.setVelocity(this, { x: 0, y: this.velocity.y });
            },
            constraint: this.null,
            addConstraint() {
                this.constraint = Constraint.create({
                    pointA: {
                        x: this.position.x,
                        y: this.position.y
                    },
                    bodyB: this,
                    stiffness: 0.01,
                    damping: 0.3
                });
                Composite.add(engine.world, this.constraint);
            },
            removeConstraint() {
                Composite.remove(engine.world, this.constraint, true)
            },
            drawTrack() {
                ctx.fillStyle = "#ccc"
                ctx.fillRect(this.holdX, y, 5, yTravel)
            }
        });
        Matter.Body.setDensity(who, 0.01) //10x density for added stability
        Composite.add(engine.world, who); //add to world
        who.classType = "body"
        return who
    },
    // spring(x, y, v = "-100 0  100 0  70 40  0 50  -70 40", force = 0.01, distance = 300, angle = 0) {
    //     const who = body[body.length] = Matter.Bodies.fromVertices(x, y, Vertices.fromPath(v), {
    //         collisionFilter: {
    //             category: cat.body,
    //             mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
    //         },
    //         inertia: Infinity, //prevents rotation
    //         isNotHoldable: true,
    //         friction: 1,
    //         frictionStatic: 1,
    //         restitution: 0,
    //         frictionAir: 1,
    //         density: 0.1,
    //         isReady: true,
    //         isResetting: false,
    //         query() {
    //             if (this.isReady) {
    //                 if (Matter.Query.collides(this, [player]).length) {
    //                     this.isReady = false
    //                     this.constraint.stiffness = 0
    //                     this.constraint.damping = 0 //0.3
    //                     this.frictionAir = 0
    //                     Matter.Body.setVelocity(this, { x: 0, y: 0 });
    //                     //show graphically  being ready?
    //                 }
    //             } else {
    //                 if (this.isResetting) {
    //                     this.constraint.stiffness += 0.0005
    //                     if (this.constraint.stiffness > 0.1) {
    //                         this.isResetting = false
    //                         this.isReady = true
    //                     }
    //                 } else {
    //                     if (Vector.magnitudeSquared(Vector.sub(this.position, {
    //                         x: x,
    //                         y: y
    //                     })) < distance * distance) {
    //                         this.force.y -= force * this.mass
    //                     } else {
    //                         this.constraint.damping = 1
    //                         this.frictionAir = 1
    //                         this.isResetting = true
    //                         Matter.Body.setVelocity(this, {
    //                             x: 0,
    //                             y: 0
    //                         });
    //                     }
    //                 }
    //             }
    //         }
    //     });
    //     who.constraint = Constraint.create({
    //         pointA: {
    //             x: who.position.x,
    //             y: who.position.y
    //         },
    //         bodyB: who,
    //         stiffness: 1,
    //         damping: 1
    //     });
    //     Composite.add(engine.world, who.constraint);
    //     return who
    // },
    // rotor(x, y, rotate = 0, radius = 800, width = 40, density = 0.0005) {
    //     const rotor1 = Matter.Bodies.rectangle(x, y, width, radius, {
    //         density: density,
    //         isNotHoldable: true,
    //         isNonStick: true,
    //         collisionFilter: {
    //             category: cat.map,
    //             mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
    //         },
    //     });
    //     const rotor2 = Matter.Bodies.rectangle(x, y, width, radius, {
    //         angle: Math.PI / 2,
    //         density: density,
    //         isNotHoldable: true,
    //         isNonStick: true,
    //         collisionFilter: {
    //             category: cat.map,
    //             mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
    //         },
    //     });
    //     rotor = Body.create({ //combine rotor1 and rotor2
    //         parts: [rotor1, rotor2],
    //         restitution: 0,
    //         collisionFilter: {
    //             category: cat.map,
    //             mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
    //         },
    //     });
    //     Matter.Body.setPosition(rotor, {
    //         x: x,
    //         y: y
    //     });
    //     Composite.add(engine.world, [rotor]);
    //     body[body.length] = rotor1
    //     body[body.length] = rotor2

    //     // setTimeout(function() {
    //     //     rotor.collisionFilter.category = cat.body;
    //     //     rotor.collisionFilter.mask = cat.body | cat.player | cat.bullet | cat.mob | cat.mobBullet //| cat.map
    //     // }, 1000);

    //     const constraint = Constraint.create({ //fix rotor in place, but allow rotation
    //         pointA: {
    //             x: x,
    //             y: y
    //         },
    //         bodyB: rotor
    //     });
    //     Composite.add(engine.world, constraint);

    //     if (rotate) {
    //         rotor.rotate = function() {
    //             if (!m.isTimeDilated) {
    //                 Matter.Body.applyForce(rotor, {
    //                     x: rotor.position.x + 100,
    //                     y: rotor.position.y + 100
    //                 }, {
    //                     x: rotate * rotor.mass,
    //                     y: 0
    //                 })
    //             } else {
    //                 Matter.Body.setAngularVelocity(rotor, 0);
    //             }
    //         }
    //     }
    //     composite[composite.length] = rotor
    //     return rotor
    // },
    toggle(x, y, isOn = false, isLockOn = false) {
        spawn.mapVertex(x + 65, y + 2, "70 10 -70 10 -40 -10 40 -10"); //toggle platform
        map[map.length - 1].restitution = 0;
        map[map.length - 1].friction = 1; //
        map[map.length - 1].frictionStatic = 1;
        const width = 120
        const height = 15
        body[body.length] = Bodies.rectangle(x + width / 2, y + height / 2, width, height, { friction: 0.05, frictionAir: 0.01 });
        let flip = body[body.length - 1];
        flip.collisionFilter.category = cat.body
        flip.collisionFilter.mask = cat.player | cat.body
        flip.isNotHoldable = true
        flip.restitution = 0
        Matter.Body.setDensity(flip, 0.003)
        if (isOn) {
            Matter.Body.setAngle(flip, (0.25 - 0.5) * Math.PI)
        } else {
            Matter.Body.setAngle(flip, (-0.25 - 0.5) * Math.PI)
        }
        cons[cons.length] = Constraint.create({
            pointA: {
                x: x + 65,
                y: y - 5
            },
            bodyB: flip,
            stiffness: 1,
            length: 0
        });
        Composite.add(engine.world, [cons[cons.length - 1]]);
        Composite.add(engine.world, flip); //add to world
        flip.classType = "body"
        return {
            flip: flip,
            isOn: isOn,
            query() {
                const limit = {
                    right: (-0.25 - 0.5) * Math.PI,
                    left: (0.25 - 0.5) * Math.PI
                }
                if (flip.angle < limit.right) {
                    Matter.Body.setAngle(flip, limit.right)
                    Matter.Body.setAngularVelocity(flip, 0);
                    if (!isLockOn) this.isOn = false
                } else if (flip.angle > limit.left) {
                    Matter.Body.setAngle(flip, limit.left)
                    Matter.Body.setAngularVelocity(flip, 0);
                    this.isOn = true
                }
                if (this.isOn) {
                    ctx.beginPath();
                    ctx.moveTo(flip.vertices[0].x, flip.vertices[0].y);
                    for (let j = 1; j < flip.vertices.length; j++) {
                        ctx.lineTo(flip.vertices[j].x, flip.vertices[j].y);
                    }
                    ctx.lineTo(flip.vertices[0].x, flip.vertices[0].y);
                    ctx.fillStyle = "#3df"
                    ctx.fill();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = color.blockS;
                    ctx.stroke();
                }
            },
        }
    },
    button(x, y, width = 126, isSpawnBase = true, isInvertedVertical = false, color = "hsl(0, 100%, 70%)") {
        if (isSpawnBase) {
            if (isInvertedVertical) {
                spawn.mapVertex(x + 65, y - 3, "100 -10 -100 -10 -70 10 70 10");
            } else {
                spawn.mapVertex(x + 65, y + 2, "100 10 -100 10 -70 -10 70 -10");
            }
            map[map.length - 1].restitution = 0;
            map[map.length - 1].friction = 1;
            map[map.length - 1].frictionStatic = 1;
        }
        // const buttonSensor = Bodies.rectangle(x + 35, y - 1, 70, 20, {
        //   isSensor: true
        // });
        if (isInvertedVertical) {
            return {
                isUp: false,
                min: {
                    x: x + 2,
                    y: y - 1
                },
                max: {
                    x: x + width,
                    y: y
                },
                width: width,
                height: 20,
                query() {
                    if (Matter.Query.region(body, this).length === 0 && Matter.Query.region([player], this).length === 0) {
                        this.isUp = true;
                    } else {
                        if (this.isUp === true) {
                            const list = Matter.Query.region(body, this) //are any blocks colliding with this
                            if (list.length > 0) {
                                if (list[0].bounds.max.x - list[0].bounds.min.x < 150 && list[0].bounds.max.y - list[0].bounds.min.y < 150) { //not too big of a block
                                    Matter.Body.setPosition(list[0], { //teleport block to the center of the button
                                        x: this.min.x + width / 2,
                                        y: list[0].position.y
                                    })
                                }
                                Matter.Body.setVelocity(list[0], { x: 0, y: 0 });
                            }
                        }
                        this.isUp = false;
                    }
                },
                queryRemove() {
                    if (Matter.Query.region(body, this).length === 0 && Matter.Query.region([player], this).length === 0) {
                        this.isUp = true;
                    } else {
                        if (this.isUp === true) {
                            const list = Matter.Query.region(body, this) //are any blocks colliding with this
                            if (list.length > 0) {
                                Matter.Composite.remove(engine.world, list[0]);
                                for (let i = 0; i < body.length; i++) {
                                    if (body[i] === list[0]) {
                                        body.splice(i, 1);
                                        break
                                    }
                                }
                                Matter.Body.setVelocity(list[0], { x: 0, y: 0 });
                            }
                        }
                        this.isUp = false;
                    }
                },
                queryPlayer() {
                    if (Matter.Query.region([player], this).length === 0) {
                        this.isUp = true;
                    } else {
                        this.isUp = false;
                    }
                },
                draw() {
                    ctx.fillStyle = color
                    if (this.isUp) {
                        ctx.fillRect(this.min.x, this.min.y, this.width, 20)
                    } else {
                        ctx.fillRect(this.min.x, this.min.y - 12, this.width, 25)
                    }
                }
            }
        } else {
            return {
                isUp: false,
                min: {
                    x: x + 2,
                    y: y - 11
                },
                max: {
                    x: x + width,
                    y: y - 10
                },
                width: width,
                height: 20,
                query() {
                    if (Matter.Query.region(body, this).length === 0 && Matter.Query.region([player], this).length === 0) {
                        this.isUp = true;
                    } else {
                        if (this.isUp === true) {
                            const list = Matter.Query.region(body, this) //are any blocks colliding with this
                            if (list.length > 0) {
                                if (list[0].bounds.max.x - list[0].bounds.min.x < 150 && list[0].bounds.max.y - list[0].bounds.min.y < 150) { //not too big of a block
                                    Matter.Body.setPosition(list[0], { //teleport block to the center of the button
                                        x: this.min.x + width / 2,
                                        y: list[0].position.y
                                    })
                                }
                                Matter.Body.setVelocity(list[0], { x: 0, y: 0 });
                            }
                        }
                        this.isUp = false;
                    }
                },
                queryRemove() {
                    if (Matter.Query.region(body, this).length === 0 && Matter.Query.region([player], this).length === 0) {
                        this.isUp = true;
                    } else {
                        if (this.isUp === true) {
                            const list = Matter.Query.region(body, this) //are any blocks colliding with this
                            if (list.length > 0) {
                                //delete triggering block
                                Matter.Composite.remove(engine.world, list[0]);
                                for (let i = 0; i < body.length; i++) {
                                    if (body[i] === list[0]) {
                                        body.splice(i, 1);
                                        break
                                    }
                                }
                                Matter.Body.setVelocity(list[0], { x: 0, y: 0 });
                            }
                        }
                        this.isUp = false;
                    }
                },
                queryPlayer() {
                    if (Matter.Query.region([player], this).length === 0) {
                        this.isUp = true;
                    } else {
                        this.isUp = false;
                    }
                },
                draw() {
                    ctx.fillStyle = color
                    if (this.isUp) {
                        ctx.fillRect(this.min.x, this.min.y - 10, this.width, 20)
                    } else {
                        ctx.fillRect(this.min.x, this.min.y - 3, this.width, 25)
                    }
                }
            }
        }
    },
    vanish(x, y, width, height, isVertical = false, hide = {
        x: 0,
        y: 400
    }) {
        x = x + width / 2
        y = y + height / 2
        const vertices = [{
            x: x,
            y: y,
            index: 0,
            isInternal: false
        }, {
            x: x + width,
            y: y,
            index: 1,
            isInternal: false
        }, {
            x: x + width,
            y: y + height,
            index: 4,
            isInternal: false
        }, {
            x: x,
            y: y + height,
            index: 3,
            isInternal: false
        }]
        const block = body[body.length] = Bodies.fromVertices(x, y, vertices, {
            // const block = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            isNonStick: true, //this keep sporangium from sticking
            isTouched: false,
            fadeTime: 10 + Math.ceil(0.25 * width),
            fadeCount: null,
            isThere: true,
            returnTime: 120,
            returnCount: 0,
            shrinkVertices(size) {
                if (isVertical) {
                    return [{
                        x: x,
                        y: y * size,
                        index: 0,
                        isInternal: false
                    }, {
                        x: x + width,
                        y: y * size,
                        index: 1,
                        isInternal: false
                    }, {
                        x: x + width,
                        y: (y + height) * size,
                        index: 4,
                        isInternal: false
                    }, {
                        x: x,
                        y: (y + height) * size,
                        index: 3,
                        isInternal: false
                    }]
                } else {
                    return [{
                        x: x * size,
                        y: y,
                        index: 0,
                        isInternal: false
                    }, {
                        x: (x + width) * size,
                        y: y,
                        index: 1,
                        isInternal: false
                    }, {
                        x: (x + width) * size,
                        y: y + height,
                        index: 4,
                        isInternal: false
                    }, {
                        x: x * size,
                        y: y + height,
                        index: 3,
                        isInternal: false
                    }]
                }
            },
            query() {
                if (this.isThere) {
                    if (this.isTouched) {
                        if (!m.isTimeDilated) {
                            this.fadeCount--
                            Matter.Body.setVertices(this, this.shrinkVertices(Math.max(this.fadeCount / this.fadeTime, 0.03)))
                        }
                        if (this.fadeCount < 1) {
                            Matter.Body.setPosition(this, hide)
                            this.isThere = false
                            this.isTouched = false
                            this.collisionFilter.mask = 0 //cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
                            this.returnCount = this.returnTime
                            Matter.Body.setVertices(this, this.shrinkVertices(1))
                            Matter.Body.setVertices(this, vertices)
                        }
                    } else if (Matter.Query.collides(this, [player]).length) { // || (Matter.Query.collides(this, body).length)) {
                        this.isTouched = true
                        this.fadeCount = this.fadeTime;
                    }
                    ctx.beginPath();
                    const v = this.vertices;
                    ctx.moveTo(v[0].x, v[0].y);
                    for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                    ctx.lineTo(v[0].x, v[0].y);
                    ctx.fillStyle = "#586370"
                    ctx.fill();
                } else {
                    if (!m.isTimeDilated) {
                        this.returnCount--
                        if (this.returnCount < 1) {
                            Matter.Body.setPosition(this, { x: x, y: y })
                            if (Matter.Query.collides(this, [player]).length) { //|| (Matter.Query.collides(this, body).length)) {
                                Matter.Body.setPosition(this, hide)
                                this.returnCount = 15
                            } else {
                                this.isThere = true
                                this.collisionFilter.mask = cat.player | cat.mob | cat.body | cat.bullet | cat.powerUp | cat.mobBullet
                                this.fadeCount = this.fadeTime
                                //delete any overlapping blocks
                                const blocks = Matter.Query.collides(this, body)
                                for (let i = 0; i < blocks.length; i++) {
                                    if (blocks[i].bodyB !== this && blocks[i].bodyB !== m.holdingTarget) { //dont' delete yourself   <----- bug here maybe...
                                        Matter.Composite.remove(engine.world, blocks[i].bodyB);
                                        blocks[i].bodyB.isRemoveMeNow = true
                                        for (let i = 1; i < body.length; i++) { //find which index in body array it is and remove from array
                                            if (body[i].isRemoveMeNow) {
                                                body.splice(i, 1);
                                                break
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ctx.beginPath();
                    const v = this.v;
                    ctx.moveTo(v[0].x, v[0].y);
                    for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                    ctx.lineTo(v[0].x, v[0].y);
                    ctx.strokeStyle = `rgba(88, 99, 112,${1 - Math.sqrt(this.returnCount / this.returnTime)})`
                    ctx.lineWidth = 1
                    ctx.stroke();
                }
            },
        });
        //store shape
        body[body.length - 1].v = body[body.length - 1].vertices
        Matter.Body.setStatic(block, true); //make static
        Composite.add(engine.world, block); //add to world
        // who.classType = "body"
        if (simulation.isHorizontalFlipped) x *= -1
        return block
    },
    door(x, y, width, height, distance, speed = 1) {
        x = x + width / 2
        y = y + height / 2
        const doorBlock = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.body,//cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            isClosing: false,
            openClose() {
                if (!m.isTimeDilated) {
                    if (this.isClosing) {
                        if (this.position.y < y) { //try to close
                            if ( //if clear of stuff
                                Matter.Query.collides(this, [player]).length === 0 &&
                                Matter.Query.collides(this, body).length < 2 &&
                                Matter.Query.collides(this, mob).length === 0
                            ) {
                                const position = {
                                    x: this.position.x,
                                    y: this.position.y + speed
                                }
                                Matter.Body.setPosition(this, position)
                            }
                        }
                    } else {
                        if (this.position.y > y - distance) { //try to open 
                            const position = {
                                x: this.position.x,
                                y: this.position.y - speed
                            }
                            Matter.Body.setPosition(this, position)
                        }
                    }
                }
            },
            isClosed() {
                return this.position.y > y - 1
            },
            draw() {
                ctx.fillStyle = "#666"
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x, v[0].y);
                for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                ctx.lineTo(v[0].x, v[0].y);
                ctx.fill();
            }
        });
        Matter.Body.setStatic(doorBlock, true); //make static
        Composite.add(engine.world, doorBlock); //add to world
        doorBlock.classType = "body"
        return doorBlock
    },
    doorMap(x, y, width, height, distance, speed = 20, addToWorld = true) { //for doors that use line of sight
        x = x + width / 2
        y = y + height / 2
        const door = map[map.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet,
                // mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            isClosing: false,
            openClose(isSetPaths = false) {
                if (!m.isTimeDilated) {
                    if (this.isClosing) {
                        if (this.position.y < y) { //try to close
                            if ( //if clear of stuff
                                Matter.Query.collides(this, [player]).length === 0 &&
                                Matter.Query.collides(this, body).length < 2 &&
                                Matter.Query.collides(this, mob).length === 0
                            ) {
                                const position = {
                                    x: this.position.x,
                                    y: this.position.y + speed
                                }
                                Matter.Body.setPosition(this, position)
                                if (isSetPaths) {
                                    simulation.draw.setPaths()
                                    simulation.draw.lineOfSightPrecalculation() //required precalculation for line of sight
                                }
                            }
                        }
                    } else {
                        if (this.position.y > y - distance) { //try to open 
                            const position = {
                                x: this.position.x,
                                y: this.position.y - speed
                            }
                            Matter.Body.setPosition(this, position)
                            if (isSetPaths) {
                                simulation.draw.setPaths()
                                simulation.draw.lineOfSightPrecalculation() //required precalculation for line of sight
                            }
                        }
                    }
                }
            },
            isClosed() {
                return this.position.y > y - 1
            },
            draw() {
                ctx.fillStyle = "#666"
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x, v[0].y);
                for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                ctx.lineTo(v[0].x, v[0].y);
                ctx.fill();
            }
        });

        Matter.Body.setStatic(door, true); //make static
        if (addToWorld) Composite.add(engine.world, door); //add to world
        door.classType = "map"
        return door
    },
    portal(centerA, angleA, centerB, angleB) {
        const width = 50
        const height = 150
        const mapWidth = 200
        const unitA = Matter.Vector.rotate({ x: 1, y: 0 }, angleA)
        const unitB = Matter.Vector.rotate({ x: 1, y: 0 }, angleB)
        draw = function () {
            ctx.beginPath(); //portal
            let v = this.vertices;
            ctx.moveTo(v[0].x, v[0].y);
            for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
            ctx.fillStyle = this.color
            ctx.fill();
        }
        query = function (isRemoveBlocks = false) {
            if (Matter.Query.collides(this, [player]).length === 0) { //not touching player
                if (player.isInPortal === this) player.isInPortal = null
            } else if (player.isInPortal !== this) { //touching player    //&& !(player.scale > 1)
                if (m.buttonCD_jump === m.cycle) player.force.y = 0 // undo a jump right before entering the portal
                m.buttonCD_jump = 0 //disable short jumps when letting go of jump key
                player.isInPortal = this.portalPair
                //teleport
                if (this.portalPair.angle % (Math.PI / 2)) { //if left, right up or down
                    if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                    // Matter.Body.setPosition(player, this.portalPair.portal.position);
                    simulation.translatePlayerAndCamera(this.portalPair.portal.position)
                } else { //if at some odd angle
                    if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                    // Matter.Body.setPosition(player, this.portalPair.position);
                    simulation.translatePlayerAndCamera(this.portalPair.position)
                }
                //rotate velocity
                let mag
                if (this.portalPair.angle !== 0 && this.portalPair.angle !== Math.PI) { //portal that fires the player up
                    mag = Math.max(10, Math.min(50, player.velocity.y * 0.8)) + 11
                } else {
                    mag = Math.max(6, Math.min(50, Vector.magnitude(player.velocity)))
                }
                let v = Vector.mult(this.portalPair.unit, mag)
                Matter.Body.setVelocity(player, v);
                if (tech.isHealAttract) {  //send heals to next portal
                    for (let i = 0; i < powerUp.length; i++) {
                        if (powerUp[i].name === "heal") {
                            Matter.Body.setPosition(powerUp[i], Vector.add(this.portalPair.portal.position, { x: 500 * (Math.random() - 0.5), y: 500 * (Math.random() - 0.5) }));
                        }
                    }
                }
                if (tech.isForeverDrones) { //send drones to next portal
                    for (let i = 0; i < bullet.length; i++) {
                        if (bullet[i].endCycle === Infinity) {
                            Matter.Body.setPosition(bullet[i], Vector.add(this.portalPair.portal.position, { x: 500 * (Math.random() - 0.5), y: 500 * (Math.random() - 0.5) }));
                        }
                    }
                }
            }
            for (let i = 0, len = body.length; i < len; i++) {
                if (body[i] !== m.holdingTarget) {
                    // body[i].bounds.max.x - body[i].bounds.min.x < 100 && body[i].bounds.max.y - body[i].bounds.min.y < 100
                    if (Matter.Query.collides(this, [body[i]]).length === 0) {
                        if (body[i].isInPortal === this) body[i].isInPortal = null
                    } else if (body[i].isInPortal !== this) { //touching this portal, but for the first time
                        if (isRemoveBlocks && !body[i].isInvulnerable) {
                            // console.log(body[i])
                            Matter.Composite.remove(engine.world, body[i]);
                            body.splice(i, 1);
                            break
                        }
                        body[i].isInPortal = this.portalPair
                        //teleport
                        if (this.portalPair.angle % (Math.PI / 2)) { //if left, right up or down
                            Matter.Body.setPosition(body[i], this.portalPair.portal.position);
                        } else { //if at some odd angle
                            Matter.Body.setPosition(body[i], this.portalPair.position);
                        }
                        //rotate velocity
                        let mag
                        if (this.portalPair.angle !== 0 && this.portalPair.angle !== Math.PI) { //portal that fires up
                            mag = Math.max(10, Math.min(50, body[i].velocity.y * 0.8)) + 11
                            let v = Vector.mult(this.portalPair.unit, mag)
                            //rotate the velocity vector of blocks fired directly up to keep them from getting stuck endlessly in vertical portals
                            Matter.Body.setVelocity(body[i], Vector.rotate(v, 0.5 * (Math.random() - 0.5)));
                        } else {
                            mag = Math.max(6, Math.min(50, Vector.magnitude(body[i].velocity)))
                            let v = Vector.mult(this.portalPair.unit, mag)
                            Matter.Body.setVelocity(body[i], v);
                        }

                    }
                }
            }

            //remove block if touching
            // if (body.length) {
            //   touching = Matter.Query.collides(this, body)
            //   for (let i = 0; i < touching.length; i++) {
            //     if (touching[i].bodyB !== m.holdingTarget) {
            //       for (let j = 0, len = body.length; j < len; j++) {
            //         if (body[j] === touching[i].bodyB) {
            //           body.splice(j, 1);
            //           len--
            //           Matter.Composite.remove(engine.world, touching[i].bodyB);
            //           break;
            //         }
            //       }
            //     }
            //   }
            // }

            // if (touching.length !== 0 && touching[0].bodyB !== m.holdingTarget) {
            //   if (body.length) {
            //     for (let i = 0; i < body.length; i++) {
            //       if (body[i] === touching[0].bodyB) {
            //         body.splice(i, 1);
            //         break;
            //       }
            //     }
            //   }
            //   Matter.Composite.remove(engine.world, touching[0].bodyB);
            // }
        }

        const portalA = composite[composite.length] = Bodies.rectangle(centerA.x, centerA.y, width, height, {
            isSensor: true,
            collisionFilter: { category: cat.map, mask: 0 },
            angle: angleA,
            color: "hsla(197, 100%, 50%,0.7)",
            draw: draw,
        });
        const portalB = composite[composite.length] = Bodies.rectangle(centerB.x, centerB.y, width, height, {
            isSensor: true,
            collisionFilter: { category: cat.map, mask: 0 },
            angle: angleB,
            color: "hsla(29, 100%, 50%, 0.7)",
            draw: draw
        });
        const mapA = composite[composite.length] = Bodies.rectangle(centerA.x - 0.5 * unitA.x * mapWidth, centerA.y - 0.5 * unitA.y * mapWidth, mapWidth, height + 10, {
            collisionFilter: {
                category: cat.map,
                mask: cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            unit: unitA,
            angle: angleA,
            color: color.map,
            draw: draw,
            query: query,
            lastPortalCycle: 0
        });
        Matter.Body.setStatic(mapA, true); //make static
        Composite.add(engine.world, mapA); //add to world

        const mapB = composite[composite.length] = Bodies.rectangle(centerB.x - 0.5 * unitB.x * mapWidth, centerB.y - 0.5 * unitB.y * mapWidth, mapWidth, height + 10, {
            collisionFilter: {
                category: cat.map,
                mask: cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            unit: unitB,
            angle: angleB,
            color: color.map,
            draw: draw,
            query: query,
            lastPortalCycle: 0,
        });
        Matter.Body.setStatic(mapB, true); //make static
        Composite.add(engine.world, mapB); //add to world

        mapA.portal = portalA
        mapB.portal = portalB
        mapA.portalPair = mapB
        mapB.portalPair = mapA
        return [portalA, portalB, mapA, mapB]
    },
    drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
        return {
            x: x,
            y: yMin,
            period: period,
            dropCycle: 0,
            speed: 0,
            draw() {
                if (!m.isTimeDilated) {
                    if (this.dropCycle < simulation.cycle) { //reset
                        this.dropCycle = simulation.cycle + this.period + Math.floor(40 * Math.random())
                        this.y = yMin
                        this.speed = 1
                    } else { //fall
                        this.speed += 0.35 //acceleration from gravity
                        this.y += this.speed
                    }
                }
                if (this.y < yMax) { //draw
                    ctx.fillStyle = color //"hsla(160, 100%, 35%,0.75)"
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 8, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
    },
    //consider switching coordinate system to starting and ending points to make angled wind easier
    wind(x, y, width, height, velocity = { x: 10, y: 0 }, isFloat = false) {
        return {
            x: x,
            y: y,
            height: height,
            width: width,
            velocity: velocity,
            isFloat: isFloat,
            a: { x: x, y: y + height / 2 },
            b: { x: x + width, y: y + height / 2 },
            do() {
                //draw wind lines
                //generate # of lines that scales with width*height



                // ctx.beginPath();
                // ctx.moveTo(this.a.x, this.a.y)
                // ctx.lineTo(this.b.x, this.b.y)
                // ctx.lineWidth = height
                // ctx.strokeStyle = "#0f04"
                // ctx.stroke();

                //push player

                //push blocks, bullets, power ups, mobs
                let hit = Matter.Query.ray([player], this.a, this.b, height)
                if (hit.length) {
                    //5 is normal player mass, so if player has more mass they are gonna go slower
                    player.force.x += this.velocity.x * 5 * (m.crouch ? 0.3 : 1) * (m.onGround ? 0.5 : 1)
                    player.force.y += this.velocity.y * 5 * (m.crouch ? 0.4 : 1)
                    if (this.isFloat) player.force.y -= 1.05 * player.mass * simulation.g
                    if (player.speed > 30) Matter.Body.setVelocity(player, Vector.mult(player.velocity, 0.97));
                }
                hit = Matter.Query.ray(body, this.a, this.b, height)
                for (let i = 0; i < hit.length; i++) {
                    hit[i].body.force.x += this.velocity.x * hit[i].body.mass
                    hit[i].body.force.y += this.velocity.y * hit[i].body.mass
                    if (this.isFloat) hit[i].body.force.y -= 1.05 * hit[i].body.mass * simulation.g
                    if (hit[i].body.speed > 30) Matter.Body.setVelocity(hit[i].body, Vector.mult(hit[i].body.velocity, 0.97));

                }
                // hit = Matter.Query.ray(bullet, this.a, this.b, height)
                // for (let i = 0; i < hit.length; i++) {
                //     hit[i].body.force.x += this.velocity.x * hit[i].body.mass * 0.5
                //     hit[i].body.force.y += this.velocity.y * hit[i].body.mass * 0.5
                // }
                hit = Matter.Query.ray(mob, this.a, this.b, height)
                for (let i = 0; i < hit.length; i++) {
                    hit[i].body.force.x += this.velocity.x * hit[i].body.mass * 0.5
                    hit[i].body.force.y += this.velocity.y * hit[i].body.mass * 0.5
                }
                hit = Matter.Query.ray(powerUp, this.a, this.b, height)
                for (let i = 0; i < hit.length; i++) {
                    hit[i].body.force.x += this.velocity.x * hit[i].body.mass * 1
                    hit[i].body.force.y += this.velocity.y * hit[i].body.mass * 1
                    if (this.isFloat) {
                        hit[i].body.force.y -= 1.08 * hit[i].body.mass * simulation.g
                        hit[i].body.force.x += 0.001 * (Math.random() - 0.5) * hit[i].body.mass
                    }
                }
            },
            draw() {
                //draw background of zone
                ctx.fillStyle = "rgba(0,0,155,0.05)"
                ctx.fillRect(this.x, this.y, this.width, this.height)

                //particles
                //issues: draws over map, looks bad in overlapping regions
                // simulation.ephemera.push({
                //     where: { x: this.x + this.width * Math.random(), y: this.y + this.height * Math.random() },
                //     velocity: Vector.mult(this.velocity, 1000),
                //     r: 1.5 + 3 * Math.random(),
                //     bounds: { min: { x: this.x, y: this.y }, max: { x: this.x + this.width, y: this.y + this.height } },
                //     do() {
                //         this.where.x += this.velocity.x
                //         this.where.y += this.velocity.y
                //         ctx.beginPath();
                //         ctx.arc(this.where.x, this.where.y, this.r, 0, 2 * Math.PI);
                //         ctx.fillStyle = "rgb(0,0,0)"
                //         ctx.fill();

                //         //remove
                //         if (
                //             this.where.x < this.bounds.min.x || this.where.x > this.bounds.max.x ||
                //             this.where.y < this.bounds.min.y || this.where.y > this.bounds.max.y
                //         ) {
                //             simulation.removeEphemera(this)
                //         }
                //     },
                // })
            },
            particles: [],
        }
    },
    laser(p1, p2, damage = 0.12, color = "#f00") {
        return {
            isOn: true,
            position: p1,
            look: p2,
            color: color,
            query() {
                if (!m.isTimeDilated) {
                    let best = { x: null, y: null, dist2: Infinity, who: null, v1: null, v2: null }
                    best = vertexCollision(this.position, this.look, m.isCloak ? [map, body] : [map, body, [playerBody, playerHead]]);
                    // hitting player
                    if ((best.who === playerBody || best.who === playerHead) && m.immuneCycle < m.cycle) {
                        m.immuneCycle = m.cycle + m.collisionImmuneCycles + 60; //player is immune to damage for an extra second
                        const dmg = damage * spawn.dmgToPlayerByLevelsCleared();
                        m.takeDamage(dmg);
                        simulation.drawList.push({ //add dmg to draw queue
                            x: best.x,
                            y: best.y,
                            radius: dmg * 1500,
                            color: "rgba(255,0,0,0.5)",
                            time: 20
                        });
                    }
                    //draw
                    if (best.dist2 === Infinity) best = this.look;
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(best.x, best.y);
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 5;
                    ctx.setLineDash([50 + 200 * Math.random(), 50 * Math.random()]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            },
            countDown: 0,
            countTotal: 690,
            countDelay: 630,
            motionQuery() {
                if (!m.isTimeDilated) {
                    let best = { x: null, y: null, dist2: Infinity, who: null, v1: null, v2: null }
                    best = vertexCollision(this.position, this.look, m.isCloak ? [map, body] : [map, body, [playerBody, playerHead]]);

                    if (this.countDown === 0) {
                        if ((best.who === playerBody || best.who === playerHead)) this.countDown = this.countTotal // hitting player
                        ctx.strokeStyle = `rgba(255,255,255,0.4)`;
                        ctx.lineWidth = 8 + 3 * Math.sin(simulation.cycle * 0.3);
                    } else if (this.countDown > this.countDelay) {
                        ctx.strokeStyle = `rgba(255,255,255,0.8)`;
                        ctx.lineWidth = 11;
                        this.countDown--
                    } else {
                        this.countDown--
                        if ((best.who === playerBody || best.who === playerHead) && m.immuneCycle < m.cycle) { // hitting player
                            m.immuneCycle = m.cycle + m.collisionImmuneCycles + 60; //player is immune to damage for an extra second
                            const dmg = damage * spawn.dmgToPlayerByLevelsCleared()
                            m.takeDamage(dmg);
                            simulation.drawList.push({ //add dmg to draw queue
                                x: best.x,
                                y: best.y,
                                radius: dmg * 1500,
                                color: "rgba(255,0,0,0.5)",
                                time: 20
                            });
                        }
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 5;
                        ctx.setLineDash([50 + 200 * Math.random(), 50 * Math.random()]);
                    }
                    //draw
                    if (best.dist2 === Infinity) best = this.look;
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(best.x, best.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            },
        }
    },
    fizzler(p1, p2) {
        return {
            isOn: true,
            position: p1,
            look: p2,
            color: color,
            query() {
                if (!m.isTimeDilated) {
                    // let best = { x: null, y: null, dist2: Infinity, who: null, v1: null, v2: null }
                    // best = vertexCollision(this.position, this.look, [body]);

                    const hits = Matter.Query.ray(body, this.position, this.look, 25)
                    for (let i = hits.length - 1; i > -1; i--) {
                        const what = hits[i].bodyA
                        if (!what.isInvulnerable && !what.isNotHoldable) {
                            // console.log(what)
                            simulation.drawList.push({ x: what.position.x, y: what.position.y, radius: 11, color: "rgba(0,160,255,0.7)", time: 10 });
                            if (what === m.holdingTarget) m.drop()
                            for (let i = 0; i < body.length; i++) {
                                if (body[i] === what) {
                                    body.splice(i, 1);
                                    break
                                }
                            }
                            Matter.Composite.remove(engine.world, what);
                        }
                    }
                    //draw
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(this.look.x, this.look.y);
                    // ctx.strokeStyle = "rgba(50,200,255,0.3)";
                    // ctx.lineWidth = 2 + 5 * Math.random()
                    // ctx.stroke();
                    ctx.strokeStyle = "rgba(50,160,255,0.17)";
                    ctx.lineWidth = 35 + 25 * Math.random() * Math.random();
                    ctx.stroke();

                    //draw random dots in the path
                    if (Math.random() < 0.05) {
                        const r = Math.random();
                        const where = {
                            x: this.position.x + r * (this.look.x - this.position.x) + 60 * (Math.random() - 0.5),
                            y: this.position.y + r * (this.look.y - this.position.y) + 60 * (Math.random() - 0.5)
                        };
                        simulation.drawList.push({ x: where.x, y: where.y, radius: 6, color: "rgba(0,160,255,0.7)", time: 5 });
                    }
                }
            },
        }
    },
    isHazardRise: false,
    hazard(x, y, width, height, damage = 0.0025) {
        return {
            min: { x: x, y: y },
            max: { x: x + width, y: y + height },
            width: width,
            height: height,
            maxHeight: height,
            isOn: true,
            opticalQuery() {
                if (this.isOn) {
                    //draw
                    ctx.fillStyle = `hsla(0, 100%, 50%,${0.6 + 0.4 * Math.random()})`
                    ctx.fillRect(this.min.x, this.min.y, this.width, this.height)
                    //collision with player
                    if (this.height > 0 && Matter.Query.region([player], this).length && !(m.isCloak)) {
                        if (m.immuneCycle < m.cycle) {
                            m.immuneCycle = m.cycle + m.collisionImmuneCycles;
                            m.takeDamage(damage * spawn.dmgToPlayerByLevelsCleared())
                            simulation.drawList.push({ //add dmg to draw queue
                                x: player.position.x,
                                y: player.position.y,
                                radius: damage * 1500 * spawn.dmgToPlayerByLevelsCleared(),
                                color: simulation.mobDmgColor,
                                time: 20
                            });
                        }
                    }
                }
            },
            query() {
                if (this.isOn) {
                    ctx.fillStyle = "hsla(160, 100%, 35%,0.75)"
                    const offset = 5 * Math.sin(simulation.cycle * 0.015)
                    ctx.fillRect(this.min.x, this.min.y + offset, this.width, this.height - offset)

                    if (this.height > 0 && Matter.Query.region([player], this).length) {
                        if (m.immuneCycle < m.cycle && !(m.cycle % 5)) {
                            const DRAIN = 0.02 * (tech.isRadioactiveResistance ? 0.2 : 1)
                            if (m.energy > DRAIN) {
                                m.energy -= DRAIN
                                if (tech.isEnergyHealth && m.energy < 0) m.death()
                            } else {
                                m.takeDamage(5 * damage * (tech.isRadioactiveResistance ? 0.2 : 1) * spawn.dmgToPlayerByLevelsCleared())
                            }
                        }
                        //float
                        if (player.velocity.y > 5) player.force.y -= 0.95 * player.mass * simulation.g
                        const slowY = (player.velocity.y > 0) ? Math.max(0.8, 1 - 0.002 * player.velocity.y * player.velocity.y) : Math.max(0.98, 1 - 0.001 * Math.abs(player.velocity.y)) //down : up
                        Matter.Body.setVelocity(player, {
                            x: Math.max(0.95, 1 - 0.036 * Math.abs(player.velocity.x)) * player.velocity.x,
                            y: slowY * player.velocity.y
                        });
                        //undo 1/2 of gravity
                        player.force.y -= 0.5 * player.mass * simulation.g;

                    }
                    //float power ups
                    powerUpCollide = Matter.Query.region(powerUp, this)
                    for (let i = 0, len = powerUpCollide.length; i < len; i++) {
                        const diameter = 2 * powerUpCollide[i].size
                        const buoyancy = 1 - 0.2 * Math.max(0, Math.min(diameter, this.min.y - powerUpCollide[i].position.y + powerUpCollide[i].size)) / diameter
                        powerUpCollide[i].force.y -= buoyancy * 1.24 * powerUpCollide[i].mass * simulation.g;
                        Matter.Body.setVelocity(powerUpCollide[i], {
                            x: powerUpCollide[i].velocity.x,
                            y: 0.97 * powerUpCollide[i].velocity.y
                        });
                    }
                }
            },
            heatWarning(opacity = 0.1 + 0.07 * Math.random()) {
                //draw background
                ctx.fillStyle = `hsla(0, 100%, 45%,${opacity})`
                ctx.fillRect(this.min.x, this.min.y, this.width, this.height)

                //draw horizontal bars along top and bottom, to indicate where the heat is coming from
                // const h = 10
                // ctx.fillStyle = `hsla(0, 100%, 50%,0.3)`
                // ctx.fillRect(this.min.x, this.min.y, this.width, h)
                // ctx.fillRect(this.min.x, this.min.y - h + this.height, this.width, h)
            },
            heatQuery() {
                if (this.isOn) {
                    //draw background
                    const opacity = 0.6 + 0.06 * Math.random()//(simulation.cycle % 6) ? 0.5 : 0.2 * Math.random()
                    ctx.fillStyle = `hsla(${0}, 100%, 43%,${opacity})`
                    ctx.fillRect(this.min.x, this.min.y, this.width, this.height)

                    //draw random vertical rectangles
                    const hue = 10 + 25 * Math.sin(simulation.cycle * 0.1) //360 is total circular space for hue
                    const width = Math.floor(0.25 * this.width * Math.random())
                    const x = this.min.x + (this.width - width) * Math.random()
                    ctx.fillStyle = `hsla(${hue}, 100%, 65%,0.5)`
                    ctx.fillRect(x, this.min.y, width, this.height)

                    //draw horizontal bars along top and bottom, to indicate where the heat is coming from
                    const h = 10
                    ctx.fillStyle = `hsla(0, 100%, ${70 + 20 * Math.random()}%,0.8)`
                    ctx.fillRect(this.min.x, this.min.y, this.width, h)
                    ctx.fillRect(this.min.x, this.min.y - h + this.height, this.width, h)

                    //collision with player
                    if (this.height > 0 && Matter.Query.region([player], this).length) {
                        if (m.immuneCycle < m.cycle && !(m.cycle % 10)) {
                            m.takeDamage(10 * damage * spawn.dmgToPlayerByLevelsCleared())
                        }
                        //undo 1/2 of gravity if on the way up
                        if (player.velocity.y < 0) player.force.y -= 0.5 * player.mass * simulation.g;
                    }

                    //float blocks
                    hotBlocks = Matter.Query.region(body, this)
                    for (let i = 0; i < hotBlocks.length; i++) {
                        hotBlocks[i].force.y -= (Math.max(1.04, 1.09 - 0.01 * i)) * simulation.g * hotBlocks[i].mass
                        hotBlocks[i].torque += 0.00002 * hotBlocks[i].inertia * (Math.random() - 0.5)
                        //push to sides
                        // if (hotBlocks[i].position.x > this.min.x + this.width / 2) {
                        //     hotBlocks[i].force.x += 0.00004 * hotBlocks[i].mass
                        // } else {
                        //     hotBlocks[i].force.x -= 0.00004 * hotBlocks[i].mass
                        // }
                    }
                }
            },
            // draw() {
            //     if (this.isOn) {
            //         ctx.fillStyle = color
            //         ctx.fillRect(this.min.x, this.min.y, this.width, this.height)
            //     }
            // },
            levelRise(growRate = 1) {
                if (this.height < this.maxHeight && !m.isTimeDilated) {
                    this.height += growRate
                    this.min.y -= growRate
                    this.max.y = this.min.y + this.height
                }
            },
            levelFall(fallRate = 1) {
                if (this.height > 0 && !m.isTimeDilated) {
                    this.height -= fallRate
                    this.min.y += fallRate
                    this.max.y = this.min.y + this.height
                }
            },
            level(isFill, growSpeed = 1) {
                if (!m.isTimeDilated) {
                    if (isFill) {
                        if (this.height < this.maxHeight) {
                            this.height += growSpeed
                            this.min.y -= growSpeed
                            this.max.y = this.min.y + this.height
                        }
                    } else if (this.height > 0) {
                        this.height -= growSpeed
                        this.min.y += growSpeed
                        this.max.y = this.min.y + this.height
                    }
                }
            }
        }
    },
    mover(x, y, width, height, VxGoal = -6, force = VxGoal > 0 ? 0.0005 : -0.0005) {
        //VxGoal below 3 don't move well, maybe try adjusting the force
        x = x + width / 2
        y = y + height / 2
        const rect = map[map.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 0,
            frictionStatic: 0,
            restitution: 0,
            isClosing: false,
            isMover: true,
            VxGoal: VxGoal,
            force: force,
            push() {
                if (!m.isTimeDilated) {
                    const touchingPlayer = Matter.Query.collides(this, [jumpSensor])
                    if (touchingPlayer.length) {
                        m.moverX = this.VxGoal
                        if ((this.VxGoal > 0 && player.velocity.x < this.VxGoal) || (this.VxGoal < 0 && player.velocity.x > this.VxGoal)) {
                            player.force.x += this.force * player.mass
                        }
                        m.Vx = player.velocity.x - this.VxGoal
                    }
                    let pushBlock = (who) => {
                        if (!who.isMover && !who.isDarkMatter) {
                            if ((this.VxGoal > 0 && who.velocity.x < this.VxGoal) || (this.VxGoal < 0 && who.velocity.x > this.VxGoal)) {
                                who.force.x += this.force * who.mass
                            }
                            const stoppingFriction = 0.5
                            Matter.Body.setVelocity(who, { x: this.VxGoal * (1 - stoppingFriction) + who.velocity.x * stoppingFriction, y: who.velocity.y });
                            Matter.Body.setAngularVelocity(who, who.angularVelocity * 0.9)
                        }
                    }
                    const blocks = Matter.Query.collides(this, body)
                    for (let i = 0; i < blocks.length; i++) {
                        pushBlock(blocks[i].bodyA)
                        pushBlock(blocks[i].bodyB)
                    }
                    const mobTargets = Matter.Query.collides(this, mob)
                    for (let i = 0; i < mobTargets.length; i++) {
                        // if (!mobTargets[i].bodyA.isBoss)
                        pushBlock(mobTargets[i].bodyA)
                        // if (!mobTargets[i].bodyB.isBoss)
                        pushBlock(mobTargets[i].bodyB)
                    }
                    let pushPowerUp = (who) => {
                        if (!who.isMover) {
                            if ((this.VxGoal > 0 && who.velocity.x < this.VxGoal) || (this.VxGoal < 0 && who.velocity.x > this.VxGoal)) {
                                who.force.x += 2 * this.force * who.mass
                            }
                            const stoppingFriction = 0.5
                            Matter.Body.setVelocity(who, { x: this.VxGoal * (1 - stoppingFriction) + who.velocity.x * stoppingFriction, y: who.velocity.y });
                        }
                    }
                    const powers = Matter.Query.collides(this, powerUp)
                    for (let i = 0; i < powers.length; i++) {
                        pushPowerUp(powers[i].bodyA)
                        pushPowerUp(powers[i].bodyB)
                    }
                }
            },
            draw() {
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x + 2, v[0].y);
                // for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                ctx.lineTo(v[1].x - 2, v[1].y);
                ctx.strokeStyle = "#000"
                ctx.lineWidth = 4;
                ctx.setLineDash([40, 40]);
                ctx.lineDashOffset = (-simulation.cycle * this.VxGoal) % 80;
                ctx.stroke();
                ctx.setLineDash([]);
            },
            drawFast() {
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x + 2, v[0].y);
                // for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                ctx.lineTo(v[1].x - 2, v[1].y);
                ctx.strokeStyle = "#000"
                ctx.lineWidth = 4;
                ctx.setLineDash([60, 60]);
                ctx.lineDashOffset = (-simulation.cycle * this.VxGoal) % 120;
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
        Matter.Body.setStatic(rect, true); //make static
        return rect
    },
    transport(x, y, width, height, VxGoal = -6, force = VxGoal > 0 ? 0.0005 : -0.0005) {
        //horizontal moving platform
        //VxGoal below 3 don't move well, maybe try adjusting the force
        x = x + width / 2
        y = y + height / 2
        const rect = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.body,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 0,
            frictionStatic: 0,
            restitution: 0,
            isClosing: false,
            isMover: true,
            VxGoal: VxGoal,
            force: force,
            move() {
                if (!m.isTimeDilated) {
                    Matter.Body.setPosition(this, { x: this.position.x + this.VxGoal, y: this.position.y }); //horizontal movement
                    const touchingPlayer = Matter.Query.collides(this, [jumpSensor])
                    if (touchingPlayer.length) {
                        m.moverX = this.VxGoal
                        if ((this.VxGoal > 0 && player.velocity.x < this.VxGoal) || (this.VxGoal < 0 && player.velocity.x > this.VxGoal)) {
                            player.force.x += this.force * player.mass
                        }
                        m.Vx = player.velocity.x - this.VxGoal
                    }
                    let pushBlock = (who) => {
                        if (!who.isMover) {
                            if ((this.VxGoal > 0 && who.velocity.x < this.VxGoal) || (this.VxGoal < 0 && who.velocity.x > this.VxGoal)) {
                                who.force.x += this.force * who.mass
                            }
                            const stoppingFriction = 0.5
                            Matter.Body.setVelocity(who, { x: this.VxGoal * (1 - stoppingFriction) + who.velocity.x * stoppingFriction, y: who.velocity.y });
                            Matter.Body.setAngularVelocity(who, who.angularVelocity * 0.8)
                        }
                    }
                    const blocks = Matter.Query.collides(this, body)
                    for (let i = 0; i < blocks.length; i++) {
                        pushBlock(blocks[i].bodyA)
                        pushBlock(blocks[i].bodyB)
                    }
                }
            },
            draw() {
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x, v[0].y);
                for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                ctx.lineTo(v[0].x, v[0].y);
                ctx.fillStyle = "#586370"
                ctx.fill();
            },
            changeDirection(isRight) {
                if (isRight) {
                    this.VxGoal = Math.abs(this.VxGoal)
                    this.force = Math.abs(this.force)
                    if (Matter.Query.collides(this, [jumpSensor]).length) player.force.x += this.trainKickPlayer * this.force * player.mass
                } else {
                    this.VxGoal = -Math.abs(this.VxGoal)
                    this.force = -Math.abs(this.force)
                    if (Matter.Query.collides(this, [jumpSensor]).length) player.force.x += this.trainKickPlayer * this.force * player.mass
                }
            },
            trainSpeed: Math.abs(VxGoal),
            trainKickPlayer: 12 * Math.abs(force),
            isSensing: false,
            stops: { left: x, right: x + 1000 }, //this should probably be reset in the level code for the actual train stops
            trainStop() {
                if (this.isMoving) {
                    this.move();
                    //oscillate back and forth
                    if (this.position.x < this.stops.left) {//stop
                        this.VxGoal = this.trainSpeed
                        this.force = 0.0005
                        this.isMoving = false
                        this.isSensing = false
                        if (Matter.Query.collides(this, [jumpSensor]).length) player.force.x += this.trainKickPlayer * player.mass * (this.VxGoal > 0 ? 1 : -1)//give player a kick so they don't fall off                        
                    } else if (this.position.x > this.stops.right) {//stop
                        this.VxGoal = -this.trainSpeed
                        this.force = -0.0005
                        this.isMoving = false
                        this.isSensing = false
                        if (Matter.Query.collides(this, [jumpSensor]).length) player.force.x += this.trainKickPlayer * player.mass * (this.VxGoal > 0 ? 1 : -1)//give player a kick so they don't fall off
                    }
                } else if (this.isSensing) {
                    if (Matter.Query.collides(this, [jumpSensor]).length) {
                        this.isMoving = true
                        this.move(); //needs to move out of the stop range
                        // if (Matter.Query.collides(this, [jumpSensor]).length) player.force.x += trainKickPlayer * player.mass * (this.VxGoal > 0 ? 1 : -1)//give player a kick so they don't fall off
                        if (Matter.Query.collides(this, [jumpSensor]).length) {
                            Matter.Body.setVelocity(player, { x: this.VxGoal, y: player.velocity.y });
                        }
                    } else if (this.position.x > this.stops.right && player.position.x < this.stops.left + 500) {//head to other stop if the player is far away
                        this.changeDirection(false) //go left
                        this.isMoving = true
                        this.move(); //needs to move out of the stop range
                    } else if (this.position.x < this.stops.left && player.position.x > this.stops.right - 500) {//head to other stop if the player is far away
                        this.changeDirection(true) //go right
                        this.isMoving = true
                        this.move(); //needs to move out of the stop range
                    }
                } else if (!Matter.Query.collides(this, [jumpSensor]).length) {//wait until player is off the train to start sensing
                    this.isSensing = true
                }
            },
        });
        Matter.Body.setStatic(rect, true); //make static
        Composite.add(engine.world, rect); //add to world
        rect.classType = "body"
        return rect
    },
    chain(x, y, angle = 0, isAttached = true, len = 15, radius = 20, stiffness = 1, damping = 1) {
        const gap = 2 * radius
        const unit = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        for (let i = 0; i < len; i++) {
            body[body.length] = Bodies.polygon(x + gap * unit.x * i, y + gap * unit.y * i, 12, radius, {
                inertia: Infinity,
                isNotHoldable: true
            });
            const who = body[body.length - 1]
            who.collisionFilter.category = cat.body;
            who.collisionFilter.mask = cat.player | cat.body | cat.bullet | cat.mob | cat.mobBullet
            Composite.add(engine.world, who); //add to world
            who.classType = "body"
        }
        for (let i = 1; i < len; i++) { //attach blocks to each other
            consBB[consBB.length] = Constraint.create({
                bodyA: body[body.length - i],
                bodyB: body[body.length - i - 1],
                stiffness: stiffness,
                damping: damping
            });
            Composite.add(engine.world, consBB[consBB.length - 1]);
        }
        cons[cons.length] = Constraint.create({ //pin first block to a point in space
            pointA: {
                x: x,
                y: y
            },
            bodyB: body[body.length - len],
            stiffness: 1,
            damping: damping
        });
        Composite.add(engine.world, cons[cons.length - 1]);
        if (isAttached) {
            cons[cons.length] = Constraint.create({ //pin last block to a point in space
                pointA: {
                    x: x + gap * unit.x * (len - 1),
                    y: y + gap * unit.y * (len - 1)
                },
                bodyB: body[body.length - 1],
                stiffness: 1,
                damping: damping
            });
            Composite.add(engine.world, cons[cons.length - 1]);
        }
    },
    // chain(x, y, angle = 0, isAttached = true, len = 15, radius = 20, stiffness = 1, damping = 1) {
    //     const gap = 2 * radius
    //     const unit = {
    //         x: Math.cos(angle),
    //         y: Math.sin(angle)
    //     }
    //     for (let i = 0; i < len; i++) {
    //         body[body.length] = Bodies.polygon(x + gap * unit.x * i, y + gap * unit.y * i, 12, radius, {
    //             inertia: Infinity,
    //             isNotHoldable: true
    //         });
    //         const who = body[body.length - 1]
    //         who.collisionFilter.category = cat.body;
    //         who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
    //         Composite.add(engine.world, who); //add to world
    //         who.classType = "body"
    //     }
    //     for (let i = 1; i < len; i++) { //attach blocks to each other
    //         consBB[consBB.length] = Constraint.create({
    //             bodyA: body[body.length - i],
    //             bodyB: body[body.length - i - 1],
    //             stiffness: stiffness,
    //             damping: damping
    //         });
    //         Composite.add(engine.world, consBB[consBB.length - 1]);
    //     }
    //     cons[cons.length] = Constraint.create({ //pin first block to a point in space
    //         pointA: {
    //             x: x,
    //             y: y
    //         },
    //         bodyB: body[body.length - len],
    //         stiffness: 1,
    //         damping: damping
    //     });
    //     Composite.add(engine.world, cons[cons.length - 1]);
    //     if (isAttached) {
    //         cons[cons.length] = Constraint.create({ //pin last block to a point in space
    //             pointA: {
    //                 x: x + gap * unit.x * (len - 1),
    //                 y: y + gap * unit.y * (len - 1)
    //             },
    //             bodyB: body[body.length - 1],
    //             stiffness: 1,
    //             damping: damping
    //         });
    //         Composite.add(engine.world, cons[cons.length - 1]);
    //     }
    // },
    // softBody(x, y, angle = 0, isAttached = true, len = 15, radius = 20, stiffness = 1, damping = 1) {
    // https://github.com/liabru/matter-js/blob/master/examples/softBody.js
    // https://brm.io/matter-js/docs/classes/Composites.html
    // https://codepen.io/Shokeen/pen/EmOLJO?editors=0010
    // },
    //******************************************************************************************************************
    //******************************************************************************************************************
    //******************************************************************************************************************
    //******************************************************************************************************************
    initialPowerUps() {
        //wait to spawn power ups until unpaused
        //power ups don't spawn in experiment mode, so they don't get removed at the start of experiment mode
        const goal = simulation.cycle + 10
        function cycle() {
            if (simulation.cycle > goal) {
                if (localSettings.loreCount === 6) {
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2170, "field", false);
                } else {
                    powerUps.spawnStartingPowerUps(2095 + 20 * (Math.random() - 0.5), -2200);
                }
                if (simulation.difficultyMode === 1) {
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2600, "ammo", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2550, "ammo", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2400, "heal", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2350, "heal", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2350, "heal", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2100, "research", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2060, "research", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2120, "research", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2075, "research", false);
                } else if (simulation.difficultyMode > 4) {

                } else {
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2300, "heal", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2100, "heal", false);
                    powerUps.spawn(2095 + 20 * (Math.random() - 0.5), -2060, "research", false);
                }
                //spin the power ups to prevent them from stacking awkwardly
                for (let i = 0; i < powerUp.length; i++) {
                    Matter.Body.setAngularVelocity(powerUp[i], 5 * (Math.random() - 0.5))
                }
            } else {
                requestAnimationFrame(cycle);
            }
        }
        requestAnimationFrame(cycle);
    },
    maps: {
        template() {
            // level.announceMobTypes()
            simulation.enableConstructMode()
            level.setPosToSpawn(0, -50); //normal spawn
            level.exit.x = 1500;
            level.exit.y = -1875;
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20); //bump for level entrance
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20); //bump for level exit
            level.defaultZoom = 1800
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d8dadf";
            // color.map = "#444" //custom map color

            level.custom = () => {
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => { };

            spawn.mapRect(-100, 0, 1000, 100);
            // powerUps.spawnStartingPowerUps(1475, -1175);
            // spawn.debris(750, -2200, 3700, 16); //16 debris per level
            // spawn.bodyRect(1540, -1110, 300, 25, 0.9); 
            // spawn.randomSmallMob(1300, -70);
            // spawn.randomMob(2650, -975, 0.8);
            // spawn.randomGroup(1700, -900, 0.4);
            // spawn.randomLevelBoss(2200, -1300);
            // spawn.secondaryBossChance(100, -1500)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        testing() {
            // simulation.enableConstructMode() //tech.giveTech('motion sickness')  //used to build maps in testing mode

            document.body.style.backgroundColor = "#ddd";
            // color.map = "#444" //custom map color
            level.defaultZoom = 1500
            simulation.zoomTransition(level.defaultZoom)

            const mover = level.mover(2800, -300, 1000, 25); //x,y,width.height,VxGoal,force

            const train = level.transport(2900, -500, 500, 25, 8); //x,y,width.height,VxGoal,force
            // spawn.bodyRect(500, -500, 50, 50);
            const button = level.button(2535, -200)
            // spawn.bodyRect(250, -450, 50, 50); //block on button

            // const wind = []
            // wind.push(level.wind(975, -160, 600, 150, { x: 0.01, y: 0 }))
            // wind.push(level.wind(1750, -475, 75, 475, { x: 0, y: -0.01 }))
            // wind.push(level.wind(975, -825, 475, 75, { x: 0, y: -0.01 }))

            level.custom = () => {

                //oscillate back and forth
                if (train.position.x < 2000) {
                    train.changeDirection(true) //go right
                } else if (train.position.x > 4000) {
                    train.changeDirection(false) //go left
                }
                if (!button.isUp) train.move();

                mover.push();
                ctx.fillStyle = "#d4d4d4"
                ctx.fillRect(2500, -475, 200, 300)

                // ctx.fillStyle = "#ddd"
                // ctx.fillRect(-150, -1000, 6875, 1000);
                ctx.fillStyle = "rgba(0,255,255,0.1)";
                ctx.fillRect(6400, -550, 300, 350);
                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                train.draw()
                mover.draw();
                button.query();
                button.draw();
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(-150, -650, 900, 250)

                // for (let i = 0; i < wind.length; i++) wind[i].do()
            };
            level.setPosToSpawn(0, -450); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = 6500;
            level.exit.y = -230;

            spawn.bodyRect(-150, -450, 100, 50);
            spawn.bodyRect(-150, -600, 75, 150);
            spawn.bodyRect(775, -75, 50, 75);
            spawn.bodyRect(4250, -350, 250, 350); //about as a big a block as possible


            spawn.mapRect(-950, 0, 8200, 800); //ground
            spawn.mapRect(-950, -1200, 800, 1400); //left wall
            spawn.mapRect(-950, -1800, 8200, 800); //roof
            spawn.mapRect(-250, -400, 1000, 600); // shelf
            spawn.mapRect(-250, -1200, 1000, 550); // shelf roof
            // for (let i = 0; i < 10; ++i) powerUps.spawn(550, -800, "ammo", false);

            function blockDoor(x, y, blockSize = 58) {
                spawn.mapRect(x, y - 290, 40, 60); // door lip
                spawn.mapRect(x, y, 40, 50); // door lip
                for (let i = 0; i < 4; ++i) spawn.bodyRect(x + 5, y - 260 + i * blockSize, 30, blockSize);
            }

            spawn.mapRect(2500, -1200, 200, 750); //right wall
            // spawn.mapRect(2500, -200, 200, 300); //right wall
            spawn.mapRect(4500, -1200, 200, 650); //right wall
            spawn.mapRect(725, -325, 50, 375);


            blockDoor(4585, -310)
            spawn.mapRect(4500, -300, 200, 400); //right wall
            spawn.mapRect(6400, -1200, 400, 750); //right wall
            spawn.mapRect(6400, -200, 400, 300); //right wall
            spawn.mapRect(6700, -1800, 800, 2600); //right wall
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump

            spawn.mapVertex(2600, 25, "-600 0  -150 -300  150 -300  600 0");
            spawn.mapVertex(2600, -35, "-300 0  -150 -300  150 -300  300 0");
            spawn.mapVertex(2600, -1800, "-600 0  -150 300  150 300  600 0");
            //place to hide
            spawn.mapRect(4650, -300, 1150, 50);
            spawn.mapRect(5750, -300, 50, 200);
            spawn.mapRect(5575, -100, 50, 125);
            spawn.mapRect(5300, -275, 50, 175);
            spawn.mapRect(5050, -100, 50, 150);
            spawn.mapRect(4790, -275, 50, 175);
            spawn.mapRect(-950, -3250, 850, 1750);
            //roof
            spawn.mapRect(-175, -2975, 300, 1425);
            spawn.mapRect(75, -2650, 325, 1150);
            // spawn.mapRect(375, -2225, 250, 650);
            spawn.mapRect(4075, -2125, 700, 800);
            spawn.mapRect(4450, -2950, 675, 1550);
            spawn.mapRect(4875, -3625, 725, 2225);
            spawn.mapRect(5525, -4350, 1725, 2925);
            spawn.mapRect(7200, -5125, 300, 3900);
            spawn.mapRect(-1150, -9175, 700, 5750); ///wall to climb


            //???
            // m.addHealth(Infinity)

            // spawn.starter(1900, -500, 200) //big boy
            // spawn.starter(1900, -500, 100) //big boy
            // for (let i = 0; i < 10; ++i) spawn.launcher(1900, -500)
            // spawn.suckerBoss(1900, -500)
            // spawn.launcherBoss(3200, -500)
            // spawn.laserTargetingBoss(1700, -500)
            // spawn.powerUpBoss(1900, -500)
            // spawn.powerUpBossBaby(3200, -500)
            // spawn.dragonFlyBoss(1700, -500)
            // spawn.streamBoss(3200, -500)
            // spawn.pulsarBoss(1700, -500)
            // spawn.spawnerBossCulture(3200, -500)
            // spawn.grenadierBoss(1700, -500)
            // spawn.growBossCulture(3200, -500)
            // spawn.blinkBoss(1700, -500)
            // spawn.snakeSpitBoss(3200, -500)
            // spawn.laserBombingBoss(1700, -500)
            // spawn.launcherBoss(3200, -500)
            // spawn.blockBoss(1700, -500)
            // spawn.blinkBoss(3200, -500)
            // spawn.spiderBoss(1700, -500)
            // spawn.tetherBoss(1700, -500) //go to actual level?
            // spawn.revolutionBoss(1900, -500)
            // spawn.bomberBoss(1400, -500)
            // spawn.cellBossCulture(1600, -500)
            // spawn.shieldingBoss(1700, -500)

            // for (let i = 0; i < 10; ++i) spawn.bodyRect(1600 + 5, -500, 30, 40);
            // for (let i = 0; i < 4; i++) spawn.starter(1900, -500)
            // spawn.pulsar(1900, -500)
            // spawn.shield(mob[mob.length - 1], 1900, -500, 1);
            // mob[mob.length - 1].isShielded = true
            // spawn.nodeGroup(1200, 0, "grenadier")
            // spawn.blinkBoss(1200, -500)
            // spawn.suckerBoss(2900, -500)
            // spawn.randomMob(1600, -500)
        },
        null() {
            level.levels.pop(); //remove lore level from rotation
            // level.onLevel--
            // console.log(level.onLevel, level.levels)
            //start a conversation based on the number of conversations seen
            if (localSettings.loreCount > lore.conversation.length - 1) localSettings.loreCount = lore.conversation.length - 1; //repeat final conversation if lore count is too high
            if (!simulation.isCheating && localSettings.loreCount < lore.conversation.length) {
                lore.testSpeechAPI() //see if speech is working
                lore.chapter = localSettings.loreCount //set the chapter to listen to to be the lore level (you can't use the lore level because it changes during conversations)
                lore.sentence = 0 //what part of the conversation to start on
                lore.conversation[lore.chapter][lore.sentence]()
                localSettings.loreCount++ //hear the next conversation next time you win
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
            // const hazardSlime = level.hazard(-1800, 150, 3600, 650, 0.004, "hsla(160, 100%, 35%,0.75)")
            level.isHazardRise = false //this is set to true to make the slime rise up
            const hazardSlime = level.hazard(-1800, -800, 3600, 1600, 0.004)
            hazardSlime.height -= 950
            hazardSlime.min.y += 950
            hazardSlime.max.y = hazardSlime.min.y + hazardSlime.height
            const circle = {
                x: 0,
                y: -500,
                radius: 50
            }
            level.custom = () => {
                //draw wide line
                ctx.beginPath();
                ctx.moveTo(circle.x, -800)
                ctx.lineTo(circle.x, circle.y)
                ctx.lineWidth = 40;
                ctx.strokeStyle = lore.talkingColor //"#d5dddd" //"#bcc";
                ctx.globalAlpha = 0.03;
                ctx.stroke();
                ctx.globalAlpha = 1;
                //support pillar
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.fillRect(-25, 0, 50, 1000);

                //draw circles
                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
                ctx.fillStyle = "#bcc"
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#abb";
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(circle.x, circle.y, circle.radius / 8, 0, 2 * Math.PI);
                ctx.fillStyle = lore.talkingColor //"#dff"
                ctx.fill();

                // level.enter.draw();
            };
            let sway = {
                x: 0,
                y: 0
            }
            let phase = -Math.PI / 2
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.fillRect(-1950, -950, 3900, 1900);
                //draw center circle lines
                ctx.beginPath();
                const step = Math.PI / 20
                const horizontalStep = 85
                if (simulation.isCheating) phase += 0.3 * Math.random() * Math.random() //(m.pos.x - circle.x) * 0.0005 //0.05 * Math.sin(simulation.cycle * 0.030)
                // const sway = 5 * Math.cos(simulation.cycle * 0.007)
                sway.x = sway.x * 0.995 + 0.005 * (m.pos.x - circle.x) * 0.05 //+ 0.04 * Math.cos(simulation.cycle * 0.01)
                sway.y = 2.5 * Math.sin(simulation.cycle * 0.015)
                for (let i = -19.5; i < 20; i++) {
                    const where = {
                        x: circle.x + circle.radius * Math.cos(i * step + phase),
                        y: circle.y + circle.radius * Math.sin(i * step + phase)
                    }
                    ctx.moveTo(where.x, where.y);
                    ctx.bezierCurveTo(sway.x * Math.abs(i) + where.x, where.y + 25 * Math.abs(i) + 60 + sway.y * Math.sqrt(Math.abs(i)),
                        sway.x * Math.abs(i) + where.x + horizontalStep * i, where.y + 25 * Math.abs(i) + 60 + sway.y * Math.sqrt(Math.abs(i)),
                        horizontalStep * i, -800);
                }
                ctx.lineWidth = 0.5;
                ctx.strokeStyle = "#899";
                ctx.stroke();
                hazardSlime.query();
                if (level.isHazardRise) hazardSlime.level(true)
                //draw wires
                // ctx.beginPath();
                // ctx.moveTo(-500, -800);
                // ctx.quadraticCurveTo(-800, -100, -1800, -375);
                // ctx.moveTo(-600, -800);
                // ctx.quadraticCurveTo(-800, -200, -1800, -325);
                // ctx.lineWidth = 1;
                // ctx.strokeStyle = "#9aa";
                // ctx.stroke();
            };
            level.setPosToSpawn(0, -50); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 25, 100, 10);
            level.exit.x = 0;
            level.exit.y = 40000;
            level.defaultZoom = 1000
            simulation.zoomTransition(level.defaultZoom)
            // document.body.style.backgroundColor = "#aaa";
            document.body.style.backgroundColor = "#ddd";
            color.map = "#586363" //808f8f"

            spawn.mapRect(-3000, 800, 5000, 1200); //bottom
            spawn.mapRect(-2000, -2000, 5000, 1200); //ceiling
            spawn.mapRect(-3000, -2000, 1200, 3400); //left
            spawn.mapRect(1800, -1400, 1200, 3400); //right

            spawn.mapRect(-500, 0, 1000, 50); //center platform
            spawn.mapRect(-500, -25, 25, 50); //edge shelf
            spawn.mapRect(475, -25, 25, 50); //edge shelf
        },
        initial() {
            if (level.levelsCleared === 0) { //if this is the 1st level of the game
                level.initialPowerUps()
                if (level.levelsCleared === 0) powerUps.directSpawn(-60, -950, "difficulty", false);

                if (!simulation.isCheating && !m.isShipMode && !build.isExperimentRun) {
                    spawn.wireFoot();
                    spawn.wireFootLeft();
                    spawn.wireKnee();
                    spawn.wireKneeLeft();
                    spawn.wireHead();
                } else {
                    simulation.isCheating = true;
                }

                if (localSettings.levelsClearedLastGame < 3) {
                } else if (!build.isExperimentRun) {
                    simulation.trails(70)
                    //bonus power ups for clearing runs in the last game
                    if (!simulation.isCheating && localSettings.levelsClearedLastGame > 1) {
                        for (let i = 0; i < localSettings.levelsClearedLastGame / 3; i++) powerUps.spawn(2095 + 2 * Math.random(), -1270 - 50 * i, "tech", false); //spawn a tech for levels cleared in last game
                        simulation.inGameConsole(`for (let i <span class='color-symbol'>=</span> 0; i <span class='color-symbol'><</span> localSettings.levelsClearedLastGame <span class='color-symbol'>/</span> 3; i<span class='color-symbol'>++</span>)`);
                        simulation.inGameConsole(`{ powerUps.spawn(m.pos.x, m.pos.y, "tech") <em>//simulation superposition</em>}`);
                        localSettings.levelsClearedLastGame = 0 //after getting bonus power ups reset run history
                        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                    }
                }
                spawn.mapRect(2025, 0, 150, 50); //lid to floor hole
            } else {
                for (let i = 0; i < 60; i++) {
                    setTimeout(() => {
                        if (level.levels[level.onLevel] === "initial") spawn.sneaker(2100, -1500 - 50 * i);
                    }, 2000 + 500 * i);
                }
            }


            //pre-draw the complex letter path to save processing
            // simulation.draw.font.drawString('w', 450, -815)
            // simulation.draw.font.drawString('a s d', 395, -750)
            // simulation.draw.font.drawString('t', 380, -935)
            // simulation.draw.font.drawString('right mouse click', 1950, -940)

            // simulation.draw.font.drawString('fire and field', 1750, -860)
            // simulation.draw.font.drawString('abcdefghijklmnopqrstuvwxyz', 110, -350)
            //run this in the level.custom loop to draw the letters
            // ctx.strokeStyle = "#fff"
            // ctx.lineWidth = 3;
            // ctx.beginPath()
            // ctx.stroke(simulation.draw.font.word)

            const wires = new Path2D() //pre-draw the complex lighting path to save processing
            wires.moveTo(-150, -275)
            wires.lineTo(80, -275)
            wires.lineTo(80, -1000)
            wires.moveTo(-150, -265)
            wires.lineTo(90, -265)
            wires.lineTo(90, -1000)
            wires.moveTo(-150, -255)
            wires.lineTo(100, -255)
            wires.lineTo(100, -1000)
            wires.moveTo(-150, -245)
            wires.lineTo(1145, -245)
            wires.lineTo(1145, 0)
            wires.moveTo(-150, -235)
            wires.lineTo(1135, -235)
            wires.lineTo(1135, 0)
            wires.moveTo(-150, -225)
            wires.lineTo(1125, -225)
            wires.lineTo(1125, 0)
            wires.moveTo(-150, -215)
            wires.lineTo(460, -215)
            wires.lineTo(460, 0)
            wires.moveTo(-150, -205)
            wires.lineTo(450, -205)
            wires.lineTo(450, 0)
            wires.moveTo(-150, -195)
            wires.lineTo(440, -195)
            wires.lineTo(440, 0)

            wires.moveTo(1155, 0)
            wires.lineTo(1155, -450)
            wires.lineTo(1000, -450)
            wires.lineTo(1000, -1000)
            wires.moveTo(1165, 0)
            wires.lineTo(1165, -460)
            wires.lineTo(1010, -460)
            wires.lineTo(1010, -1000)
            wires.moveTo(1175, 0)
            wires.lineTo(1175, -470)
            wires.lineTo(1020, -470)
            wires.lineTo(1020, -1000)
            wires.moveTo(1185, 0)
            wires.lineTo(1185, -480)
            wires.lineTo(1030, -480)
            wires.lineTo(1030, -1000)
            wires.moveTo(1195, 0)
            wires.lineTo(1195, -490)
            wires.lineTo(1040, -490)
            wires.lineTo(1040, -1000)

            wires.moveTo(1625, -1000)
            wires.lineTo(1625, 0)
            wires.moveTo(1635, -1000)
            wires.lineTo(1635, 0)
            wires.moveTo(1645, -1000)
            wires.lineTo(1645, 0)
            wires.moveTo(1655, -1000)
            wires.lineTo(1655, 0)
            wires.moveTo(1665, -1000)
            wires.lineTo(1665, 0)

            wires.moveTo(1675, -465)
            wires.lineTo(2325, -465)
            wires.lineTo(2325, 0)
            wires.moveTo(1675, -455)
            wires.lineTo(2315, -455)
            wires.lineTo(2315, 0)
            wires.moveTo(1675, -445)
            wires.lineTo(2305, -445)
            wires.lineTo(2305, 0)
            wires.moveTo(1675, -435)
            wires.lineTo(2295, -435)
            wires.lineTo(2295, 0)

            wires.moveTo(2335, 0)
            wires.lineTo(2335, -710)
            wires.lineTo(2600, -710)
            wires.moveTo(2345, 0)
            wires.lineTo(2345, -700)
            wires.lineTo(2600, -700)
            wires.moveTo(2355, 0)
            wires.lineTo(2355, -690)
            wires.lineTo(2600, -690)

            // let isSpawnedWarp = false
            level.custom = () => {
                //push around power ups stuck in the tube wall
                if (!(simulation.cycle % 30)) {
                    for (let i = 0, len = powerUp.length; i < len; i++) {
                        if (powerUp[i].name === "instructions") {
                            if (simulation.isCheating) {
                                Matter.Composite.remove(engine.world, powerUp[i]);
                                powerUp.splice(i, 1);
                                break
                            }
                        } else if (powerUp[i].position.y < -1000) {
                            if (m.cycle > 900) {
                                Matter.Body.setPosition(powerUp[i], {
                                    x: 2075 + 50 * Math.random(),
                                    y: -900 + 100 * Math.random()
                                });
                            } else {
                                powerUp[i].force.x += 0.01 * (Math.random() - 0.5) * powerUp[i].mass
                            }
                        }

                    }
                }
                //draw binary number
                const binary = (localSettings.runCount >>> 0).toString(2)
                const height = 20
                const width = 8
                const yOff = -40 //-580
                let xOff = -130 //2622
                ctx.strokeStyle = "#bff"
                ctx.lineWidth = 1.5;
                ctx.beginPath()
                for (let i = 0; i < binary.length; i++) {
                    if (binary[i] === "0") {
                        ctx.moveTo(xOff, yOff)
                        ctx.lineTo(xOff, yOff + height)
                        ctx.lineTo(xOff + width, yOff + height)
                        ctx.lineTo(xOff + width, yOff)
                        ctx.lineTo(xOff, yOff)
                        xOff += 10 + width
                    } else {
                        ctx.moveTo(xOff, yOff)
                        ctx.lineTo(xOff, yOff + height)
                        xOff += 10
                    }
                }
                ctx.stroke();

                ctx.beginPath()
                ctx.strokeStyle = "#ccc"
                ctx.lineWidth = 5;
                ctx.stroke(wires);

                //squares that look like they keep the wires in place
                ctx.beginPath()
                ctx.rect(1600, -500, 90, 100)
                ctx.rect(-55, -285, 12, 100)
                ctx.rect(1100, -497, 8, 54)
                ctx.rect(2285, -200, 80, 10)
                ctx.rect(1110, -70, 100, 10)
                ctx.fillStyle = "#ccc"
                ctx.fill()

                //exit room
                ctx.fillStyle = "#f2f2f2"
                ctx.fillRect(2600, -600, 400, 300)

                // level.enter.draw();
                level.exit.drawAndCheck();

                //words, instructions
                // ctx.strokeStyle = "#fff"
                // ctx.lineWidth = 3;
                // ctx.beginPath()
                // ctx.stroke(simulation.draw.font.word)
            };

            level.customTopLayer = () => {
                //exit room glow
                ctx.fillStyle = "rgba(0,255,255,0.05)"
                ctx.fillRect(2600, -600, 400, 300)
                //draw shade for ceiling tech
                ctx.fillStyle = "rgba(68, 68, 68,0.95)"
                ctx.fillRect(2030, -2800, 150, 1800);
                ctx.fillRect(2030, 0, 150, 1800);
                ctx.fillStyle = "rgba(68, 68, 68,0.98)"
                // ctx.fillRect(-2750, -300, 2600, 125);
                ctx.fillRect(-2925, -2800, 2775, 2650);
            };
            level.setPosToSpawn(460, -100); //normal spawn
            // level.enter.x = -1000000; //hide enter graphic for first level by moving to the far left
            level.exit.x = 2800;
            level.exit.y = -335;
            spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
            simulation.zoomScale = 1000 //1400 is normal
            level.defaultZoom = 1600
            simulation.zoomTransition(level.defaultZoom, 1)
            document.body.style.backgroundColor = "#e1e1e1";

            // spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
            spawn.mapRect(-2750, -2800, 2600, 2515);
            spawn.mapRect(-3275, -185, 3125, 1985);
            requestAnimationFrame(() => { powerUps.directSpawn(-2315, -3050, "instructions", false); });
            spawn.mapRect(-3275, -2800, 400, 3250);
            spawn.mapRect(-2775, -575, 50, 25);
            spawn.mapRect(-2775, -950, 50, 25);
            spawn.mapRect(-2775, -1325, 50, 25);
            spawn.mapRect(-2775, -1700, 50, 25);
            spawn.mapRect(-2775, -2075, 50, 25);
            spawn.mapRect(-2775, -2450, 50, 25);

            spawn.mapRect(3000, -2800, 2600, 4600); //right wall
            // spawn.mapRect(-250, 0, 3600, 1800); //ground
            spawn.mapRect(-250, 0, 2300, 1800); //ground

            // Matter.Body.setVelocity(map[map.length - 1], { x: 10, y: -10 });
            spawn.mapRect(2150, 0, 1200, 1800); //ground
            spawn.mapRect(2025, -3, 25, 15); //lip on power up chamber
            spawn.mapRect(2150, -3, 25, 15); //lip on power up chamber

            // spawn.mapRect(-250, -2800, 3600, 1800); //roof
            spawn.mapRect(-250, -2800, 2300, 1800); //split roof        
            map[map.length - 1].friction = 0
            map[map.length - 1].frictionStatic = 0
            spawn.mapRect(2150, -2800, 1200, 1800); //split roof
            map[map.length - 1].friction = 0
            map[map.length - 1].frictionStatic = 0
            spawn.mapRect(2025, -1010, 25, 13); //lip on power up chamber
            spawn.mapRect(2150, -1010, 25, 13); //lip on power up chamber

            spawn.mapRect(2600, -300, 500, 500); //exit shelf
            spawn.mapRect(2600, -1200, 500, 600); //exit roof
            spawn.mapRect(-95, -1100, 80, 110); //wire source
            spawn.mapRect(410, -10, 90, 20); //small platform for player

            spawn.bodyRect(2425, -120, 70, 50);
            spawn.bodyRect(2400, -100, 100, 60);
            spawn.bodyRect(2500, -150, 100, 130); //exit step
        },
        final() {
            // color.map = "rgba(0,0,0,0.8)"
            const slime = level.hazard(simulation.isHorizontalFlipped ? 150 - 860 : -150, -360, 880, 259) //x, y, width, height, damage = 0.002) {
            slime.height -= slime.maxHeight - 150 //start slime at zero
            slime.min.y += slime.maxHeight
            slime.max.y = slime.min.y + slime.height
            level.custom = () => {
                level.exit.drawAndCheck();
                level.enter.draw();

                //check for out of bounds mobs
                if (!(simulation.cycle % 180)) {
                    for (let i = 0; i < mob.length; i++) {
                        if (mob[i].isFinalBossMob && (mob[i].position.x < -200 || mob[i].position.x > 6000 || mob[i].position.y < -1600 || mob[i].position.y > 150)) {
                            // console.log(mob[i].position)
                            mob[i].death()
                            // Matter.Body.setPosition(mob[i], {
                            //     x: 3000 + 400 * (Math.random() - 0.5),
                            //     y: -1200
                            // });
                            // break
                        }
                    }
                }
            };
            level.customTopLayer = () => {
                slime.query();
                slime.levelRise(0.1)

                ctx.fillStyle = "rgba(0,255,255,0.1)"
                ctx.fillRect(5385, -550, 300, 250)
            };

            level.setPosToSpawn(0, -250); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            spawn.mapRect(5500, -330 + 20, 100, 20); //spawn this because the real exit is in the wrong spot
            level.exit.x = 0;
            level.exit.y = -8000;

            level.defaultZoom = 2500
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#ddd";

            for (let i = 0; i < 16; i++) powerUps.spawn(4600 + 40 * i, -30, "ammo");
            if (simulation.difficultyMode > 5) for (let i = 0; i < 8; i++) powerUps.spawn(4600 + 40 * i, -30, "ammo"); //extra ammo on why difficulty

            spawn.mapRect(-1950, 0, 8200, 1800); //ground
            spawn.mapRect(-1950, -1500, 1800, 1900); //left wall
            spawn.mapRect(-1950, -3300, 8200, 1800); //roof
            spawn.mapRect(-250, -200, 1000, 300); // shelf
            spawn.mapRect(-250, -1700, 1000, 1250); // shelf roof
            spawn.mapRect(705, -210, 25, 50);
            spawn.mapRect(725, -220, 25, 50);
            spawn.bodyRect(750, -125, 125, 125);
            spawn.bodyRect(875, -50, 50, 50);

            spawn.mapRect(5400, -1700, 400, 1150); //right wall
            spawn.mapRect(5400, -300, 400, 400); //right wall
            spawn.mapRect(5700, -3300, 1800, 5100); //right wall
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump
            spawn.mapRect(5403, -650, 400, 450); //blocking exit
            if (mobs.mobDeaths < level.levelsCleared && !simulation.isCheating) { //pacifist run
                for (let i = 0; i < 250; i++) spawn.starter(1000 + 4000 * Math.random(), -1500 * Math.random())
            } else {
                spawn.finalBoss(3000, -750)
            }

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

                level.setPosToSpawn(0, -250);
                level.custom = () => {
                    level.exit.drawAndCheck();
                    level.enter.draw();

                    //check for out of bounds mobs
                    if (!(simulation.cycle % 180)) {
                        for (let i = 0; i < mob.length; i++) {
                            if (mob[i].isFinalBossMob && (mob[i].position.x < -6000 || mob[i].position.x > 400 || mob[i].position.y < -1600 || mob[i].position.y > 150)) {
                                // console.log(mob[i].position)
                                mob[i].death()
                                // Matter.Body.setPosition(mob[i], {
                                //     x: -3000 + 400 * (Math.random() - 0.5),
                                //     y: -1200
                                // });
                                // break
                            }
                        }
                    }
                };
                level.customTopLayer = () => {
                    slime.query();
                    slime.levelRise(0.1)
                    ctx.fillStyle = "rgba(0,255,255,0.1)"
                    ctx.fillRect(-5385 - 300, -550, 300, 250)
                };
            }
            if (mobs.mobDeaths < level.levelsCleared && localSettings.loreCount > 5 && !simulation.isCheating) {
                //open door for pacifist run on final lore chapter
                if (simulation.isHorizontalFlipped) {
                    level.exit.x = -5500 - 100;
                } else {
                    level.exit.x = 5500;
                }
                level.exit.y = -330;
                Matter.Composite.remove(engine.world, map[map.length - 1]);
                map.splice(map.length - 1, 1);
                simulation.draw.setPaths(); //redraw map draw path
                level.levels.push("null")
            }
        },

        subway() {
            level.announceText(0, -575, true)
            // simulation.enableConstructMode() //tech.giveTech('motion sickness')  //used to build maps in testing mode
            // m.maxHealth = m.health = 100
            // color.map = "#333" //custom map color
            document.body.style.backgroundColor = "#e3e3e3"//"#e3e3e3"//color.map//"#333"//"#000"
            level.defaultZoom = 1400
            simulation.zoomTransition(level.defaultZoom)
            level.setPosToSpawn(450 * (Math.random() < 0.5 ? 1 : -1), -300); //normal spawn
            // spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20); //entrance bump disabled for performance
            level.exit.x = 0;
            level.exit.y = -9000;
            // spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump disabled for performance
            const stationWidth = 9000
            let stationNumber = 0;
            let stationCustom = () => { }
            let stationCustomTopLayer = () => { }
            const train = []
            train.push(level.transport(1475, -200, 500, 25, 30))
            train[train.length - 1].isMoving = false
            train[train.length - 1].stops = { left: 1725, right: 7225 }
            train.push(level.transport(-1475 - 500, -200, 500, 25, -30))
            train[train.length - 1].isMoving = false
            train[train.length - 1].stops = { left: -7225, right: -1725 }

            const stationList = [] //use to randomize station order
            for (let i = 1, totalNumberOfStations = 10; i < totalNumberOfStations; ++i) stationList.push(i) //!!!! update station number when you add a new station
            stationList.sort(() => Math.random() - 0.5);
            // console.log(stationList)
            const totalStations = 3 //including the initial station and 2 stations with bosses (exit station is a repeat of the initial)
            stationList.splice(0, stationList.length - (totalStations - 1)); //remove all but 3 stations
            stationList.unshift(0) //add index zero to the front of the array for the starting station
            // console.log(stationList, "after splice")

            const stationsCleared = []
            let isExitOpen = false
            // let isTechSpawned = false
            let gatesOpenRight = -1
            let gatesOpenLeft = -1
            const infrastructure = (x, isInProgress = true) => {
                if (isInProgress) {
                    //randomize the mobs for each station
                    spawn.pickList.splice(0, 2);
                    let array = simulation.difficultyMode > 3 ? spawn.tier[4] : spawn.tier[3]
                    spawn.pickList.push(array[Math.floor(Math.random() * array.length)]);
                    array = spawn.tier[4]
                    spawn.pickList.push(array[Math.floor(Math.random() * array.length)]);

                    function removeAll(array) {
                        for (let i = 0; i < array.length; ++i) Matter.Composite.remove(engine.world, array[i]);
                    }
                    removeAll(map);
                    map = [];
                    removeAll(composite);
                    composite = []
                    //remove any powerUp that is too far from player
                    for (let i = 0; i < powerUp.length; ++i) {
                        if (Vector.magnitudeSquared(Vector.sub(player.position, powerUp[i].position)) > 9000000 && (!tech.isHealAttract || powerUp[i].name !== "heal")) { //remove any powerUp farther then 3000 pixels from player
                            Matter.Composite.remove(engine.world, powerUp[i]);
                            powerUp.splice(i--, 1)
                        }
                    }
                    //remove any mob that is too far from player
                    for (let i = 0; i < mob.length; ++i) {
                        if (Vector.magnitudeSquared(Vector.sub(player.position, mob[i].position)) > 4000000 && !mob[i].isDarkMatter) { //remove any mob farther then 2000 pixels from player
                            mob[i].removeConsBB()
                            mob[i].removeCons()
                            mob[i].leaveBody = false
                            mob[i].alive = false
                            Matter.Composite.remove(engine.world, mob[i]);
                            mob.splice(i--, 1)
                        }
                    }
                }
                const checkGate = (gate, gateButton) => {
                    if (gate) { //check status of buttons and gates
                        gate.isClosing = gateButton.isUp
                        gate.openClose(true);
                        if (gateButton.isUp) {
                            gateButton.query();
                            if (!gateButton.isUp) {
                                simulation.inGameConsole(`station gate opened`, 360);
                                if (stationNumber > 0) {
                                    if (!isExitOpen && gatesOpenRight < stationNumber) level.newLevelOrPhase() //run some new level tech effects
                                    gatesOpenRight = stationNumber
                                } else if (stationNumber < 0) {
                                    if (!isExitOpen && gatesOpenLeft > stationNumber) level.newLevelOrPhase() //run some new level tech effects
                                    gatesOpenLeft = stationNumber
                                } else { //starting station both doors open
                                    gatesOpenLeft = stationNumber
                                    gatesOpenRight = stationNumber
                                }
                                if (Math.abs(stationNumber) > 0 && ((Math.abs(stationNumber) + 1) % stationList.length) === 0) {
                                    // simulation.inGameConsole(`level exit opened`, 360);
                                    isExitOpen = true;
                                }
                            }
                        }
                        // gateButton.draw();
                        if (gateButton.isUp) {
                            //aura around button
                            ctx.beginPath();
                            ctx.ellipse(gateButton.min.x + gateButton.width * 0.5, gateButton.min.y + 6, 0.75 * gateButton.width, 0.5 * gateButton.width, 0, Math.PI, 0); //ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
                            ctx.fillStyle = `hsla(345, 100%, 80%,${0.1 + 0.4 * Math.random()})`
                            ctx.fill();
                            ctx.fillStyle = "hsl(345, 100%, 75%)"
                            ctx.fillRect(gateButton.min.x, gateButton.min.y - 10, gateButton.width, 25)
                            ctx.strokeStyle = "#000"//"rgba(255,255,255,0.2)"
                            ctx.lineWidth = 2
                            ctx.strokeRect(gateButton.min.x, gateButton.min.y - 10, gateButton.width, 25)
                        } else {
                            ctx.fillStyle = "hsl(345, 100%, 75%)"
                            ctx.fillRect(gateButton.min.x, gateButton.min.y, gateButton.width, 10)
                            ctx.strokeStyle = "#000"//"rgba(255,255,255,0.2)"
                            ctx.lineWidth = 2
                            ctx.strokeRect(gateButton.min.x, gateButton.min.y, gateButton.width, 10)
                        }
                    }
                }
                const stations = [ //update totalNumberOfStations as you add more stations 
                    () => { //empty starting station   
                        // console.log(stationNumber)
                        if (Math.abs(stationNumber) > 2) isExitOpen = true
                        // console.log(stationNumber, stationsCleared, stationsCleared[Math.abs(stationNumber)])
                        if (isExitOpen) {
                            level.exit.x = x - 50;
                            level.exit.y = -260;
                            var gateButton = level.button(x - 62, -736, 125, false) //x, y, width = 126, isSpawnBase = true
                            gateButton.isUp = true
                            if (stationNumber > 0) {
                                var gateR = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                            } else {
                                var gateL = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                            }
                        } else {
                            var gateButton = level.button(x - 62, -237, 125, false) //x, y, width = 126, isSpawnBase = true
                            gateButton.isUp = true
                            if (stationNumber === 0 && gatesOpenRight === -1 && gatesOpenLeft === -1) {
                                var gateR = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                                var gateL = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                                for (let i = 0; i < 10; ++i) powerUps.chooseRandomPowerUp(x + 800 * (Math.random() - 0.5), -300 - 100 * Math.random())//only spawn heal or ammo once at the first station
                            }
                        }

                        spawn.mapRect(x + -1400, -750, 3375, 100); //roof
                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        // spawn.mapRect(x + -550, -220, 1125, 100); //floor
                        // spawn.mapRect(x + -475, -230, 975, 150);//floor
                        spawn.mapVertex(x + 0, -200, "400 0  -400 0  -300 -80  300 -80"); //hexagon but wide
                        // spawn.mapRect(x + -1350, -550, 50, 150);
                        // spawn.mapRect(x + 1300, -550, 50, 150);
                        stationCustom = () => { };
                        stationCustomTopLayer = () => {
                            checkGate(gateR, gateButton)
                            checkGate(gateL, gateButton)
                        };
                    },
                    () => { //portal maze
                        // const buttonsCoords = [{ x: x + 50, y: -1595 }, { x: x + 637, y: -2195 }, { x: x - 1487, y: -2145 }]
                        // const buttonsCoordsIndex = Math.floor(Math.random() * buttonsCoords.length) //pick a random element from the array 
                        // if (isExitOpen) {
                        //     level.exit.x = buttonsCoords[buttonsCoordsIndex].x;
                        //     level.exit.y = buttonsCoords[buttonsCoordsIndex].y - 25;
                        // } else {
                        //     var gateButton = level.button(buttonsCoords[buttonsCoordsIndex].x, buttonsCoords[buttonsCoordsIndex].y, 126, false) //x, y, width = 126, isSpawnBase = true
                        //     gateButton.isUp = true
                        //     if (stationNumber > gatesOpenRight) {
                        //         var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     } else if (stationNumber < gatesOpenLeft) {
                        //         var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        //     }
                        // }



                        // if (stationsCleared[stationNumber] ) {
                        //     var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        // }

                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        spawn.mapRect(x + -1775, -1600, 3400, 1000); //center pillar
                        spawn.mapRect(x + -4100, -3325, 8000, 700); //roof
                        spawn.mapRect(x + -4100, -3325, 325, 1500);
                        spawn.mapRect(x + 3500, -3325, 400, 1500);
                        spawn.mapRect(x + -225, -700, 450, 600); //lower portal blocks

                        //upper parts
                        spawn.mapRect(x + -1425, -2400, 1900, 50);
                        spawn.mapRect(x + -775, -2750, 575, 1045);
                        spawn.mapRect(x + 475, -1900, 450, 375);
                        spawn.mapRect(x + 2225, -2300, 125, 350);
                        spawn.mapRect(x + 2550, -2350, 700, 50);
                        spawn.mapRect(x + 1375, -2850, 125, 650);
                        spawn.mapRect(x + 600, -2200, 200, 195);
                        spawn.mapRect(x + -3500, -2275, 825, 75);
                        spawn.mapRect(x + -1550, -2150, 250, 250);
                        spawn.mapRect(x + -2575, -2450, 275, 345);

                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            if (Math.random() < 0.5) {
                                spawn.randomMobPositions.push(...[
                                    [x + 2850, -2425],
                                    [x + 2275, -2425],
                                    // [x + 2000, -2150],
                                    [x + 1650, -2150],
                                    // [x + 1000, -2475],
                                    [x + 725, -2450],
                                    // [x + 525, -2175],
                                    [x + 200, -1950],
                                    // [x + -25, -1825],
                                    [x + -975, -2000],
                                    // [x + -1500, -2225],
                                    [x + 1850, -2125],
                                    // [x + 225, -1975],
                                    [x + 25, -1950],
                                    // [x + 25, -1950],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            } else {
                                spawn.randomMobPositions.push(...[
                                    [x + 250, -1850],
                                    [x + 225, -1950],
                                    // [x + 125, -2000],
                                    [x + 0, -1800],
                                    // [x + -1725, -2300],
                                    [x + -2025, -2175],
                                    // [x + -2050, -2250],
                                    [x + -2000, -2350],
                                    // [x + -2950, -2400],
                                    [x + -2775, -2400],
                                    // [x + -2425, -2550],
                                    [x + 1950, -2225],
                                    // [x + -2700, -2100],
                                    [x + -1925, -2175],
                                    // [x + -825, -2050],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            }
                            const softBoss = [() => {
                                spawn.centipedeBoss(x + 500, -2500, 16, 16, 2, stationNumber > 0); //x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false)
                            }, () => {
                                spawn.centipedeBoss(x + -2800, -2500, 16, 16, 2, stationNumber > 0);
                            }, () => {
                                spawn.centipedeBoss(x + 1300, -2125, 16, 16, 2, stationNumber > 0);
                            }]

                            softBoss[Math.floor(softBoss.length * Math.random())]()
                            for (let i = 0; i < mob.length; i++) {
                                mob[i].tier = 4  //make all mobs T5
                            }
                        }

                        const portal1 = level.portal({ x: x - 250, y: -310 }, Math.PI,
                            { x: x + -3750, y: -2100 }, 0)
                        const portal2 = level.portal({ x: x + 250, y: -310 }, 0,
                            { x: x + 3475, y: -2100 }, Math.PI)
                        const portal3 = level.portal({ x: x - 800, y: -2500 }, Math.PI,
                            { x: x - 175, y: -2500 }, 0)
                        const portal4 = level.portal({ x: x + 1275, y: -1700 }, Math.PI,
                            { x: x - 1275, y: -1700 }, 0)
                        stationCustom = () => {
                            portal1[2].query()
                            portal1[3].query()
                            portal2[2].query()
                            portal2[3].query()
                            portal3[2].query()
                            portal3[3].query()
                            portal4[2].query()
                            portal4[3].query()
                        }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                            portal1[0].draw();
                            portal1[1].draw();
                            portal1[2].draw();
                            portal1[3].draw();
                            portal2[0].draw();
                            portal2[1].draw();
                            portal2[2].draw();
                            portal2[3].draw();
                            portal3[0].draw();
                            portal3[1].draw();
                            portal3[2].draw();
                            portal3[3].draw();
                            portal4[0].draw();
                            portal4[1].draw();
                            portal4[2].draw();
                            portal4[3].draw();
                        }
                    },
                    () => { //opening and closing doors
                        // const buttonsCoords = [{ x: x - 800, y: -2245 }, { x: x + 250, y: -870 }, { x: x + 1075, y: -1720 }, { x: x - 1600, y: -1995 }]
                        // const buttonsCoordsIndex = Math.floor(Math.random() * buttonsCoords.length) //pick a random element from the array 
                        // if (isExitOpen) {
                        //     level.exit.x = buttonsCoords[buttonsCoordsIndex].x;
                        //     level.exit.y = buttonsCoords[buttonsCoordsIndex].y - 25;
                        // } else {
                        //     var gateButton = level.button(buttonsCoords[buttonsCoordsIndex].x, buttonsCoords[buttonsCoordsIndex].y, 126, false) //x, y, width = 126, isSpawnBase = true
                        //     gateButton.isUp = true
                        //     if (stationNumber > gatesOpenRight) {
                        //         var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     } else if (stationNumber < gatesOpenLeft) {
                        //         var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        //     }
                        // }

                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            if (Math.random() < 0.5) {
                                spawn.randomMobPositions.push(...[
                                    [x + 1125, -650],
                                    [x + 150, -950],
                                    // [x + 100, -975],
                                    [x + 75, -975],
                                    // [x + 275, -1225],
                                    [x + 825, -975],
                                    // [x + -50, -1625],
                                    [x + -950, -1550],
                                    // [x + -975, -1550],
                                    [x + -900, -2500],
                                    // [x + -975, -2550],
                                    [x + 675, -1950],
                                    // [x + 675, -2550],
                                    [x + 1225, -1825],
                                    // [x + -750, -2450],
                                    [x + -700, -825],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            } else {
                                spawn.randomMobPositions.push(...[
                                    [x + -675, -675],
                                    [x + -575, -925],
                                    // [x + -425, -1100],
                                    [x + -225, -1225],
                                    // [x + -650, -1250],
                                    [x + -675, -775],
                                    // [x + 75, -1000],
                                    [x + -1100, -1575],
                                    // [x + -1250, -1850],
                                    [x + -1625, -2100],
                                    // [x + -700, -2500],
                                    [x + -375, -2550],
                                    // [x + 250, -2025],
                                    [x + 675, -2175],
                                    // [x + -1000, -2000],
                                    [x + -1550, -2325],
                                    // [x + -1725, -2425],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            }
                            const softBoss = [() => {
                                spawn.caterpillarBoss(x - 775, -2575, 18, 24, 2, stationNumber > 0); //x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false)
                            }, () => {
                                spawn.caterpillarBoss(x - 1200, -1600, 18, 24, 2, stationNumber > 0);
                            }, () => {
                                spawn.caterpillarBoss(x - 1250, -1325, 18, 24, 2, stationNumber > 0);
                            }, () => {
                                spawn.caterpillarBoss(x + 550, -2375, 18, 24, 2, stationNumber > 0);
                            }]
                            softBoss[Math.floor(softBoss.length * Math.random())]()
                            for (let i = 0; i < mob.length; i++) {
                                mob[i].tier = 3  //make all mobs T4
                            }
                        }

                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        spawn.mapRect(x + -2550, -3200, 425, 1375);//roof left wall
                        spawn.mapRect(x + 2125, -3175, 450, 1375);//roof right wall
                        spawn.mapRect(x + -2550, -3200, 5125, 225);//roof

                        spawn.mapRect(x + -1325, -550, 1375, 50);//first floor roof/ground
                        spawn.mapRect(x + 775, -550, 675, 50);
                        spawn.mapRect(x + -200, -875, 1300, 50); //2nd floor roof/ground
                        spawn.mapRect(x + -125, -1125, 50, 275);
                        spawn.mapRect(x + -125, -1150, 800, 50); //3rd floor roof/ground
                        spawn.mapRect(x + -1450, -1475, 1600, 50);
                        spawn.mapRect(x + -1325, -1725, 800, 50); //4th floor roof/ground
                        spawn.mapRect(x + 50, -1725, 1350, 50);
                        spawn.mapRect(x + -1125, -2250, 700, 50);

                        spawn.mapRect(x, -525, 50, 150); //door cap for ground at ground y = -210
                        const door1 = level.doorMap(x + 12, -380, 25, 170, 140, 20, false) //x, y, width, height, distance, speed = 20
                        spawn.mapRect(x - 200, -525 - 340, 50, 150); //door cap for ground at ground y = -210
                        const door2 = level.doorMap(x - 188, -380 - 340, 25, 170, 140, 20, false) //x, y, width, height, distance, speed = 20
                        spawn.mapRect(x + 100, -525 - 940, 50, 150); //door cap for ground at ground y = -210
                        const door3 = level.doorMap(x + 112, -380 - 940, 25, 170, 140, 20, false) //x, y, width, height, distance, speed = 20
                        spawn.mapRect(x + 450, -3050, 50, 775);
                        const door4 = level.doorMap(x + 462, -2300, 25, 575, 520, 30, false) //x, y, width, height, distance, speed = 20

                        const portal1 = level.portal({
                            x: x + 2100,
                            y: -2100
                        }, Math.PI, { //right
                            x: x + -1275,
                            y: -650
                        }, 2 * Math.PI) //right

                        stationCustom = () => {
                            door1.isClosing = (simulation.cycle % 240) < 120
                            door1.openClose(true);
                            door2.isClosing = (simulation.cycle % 240) > 120
                            door2.openClose(true);
                            door3.isClosing = (simulation.cycle % 240) < 120
                            door3.openClose(true);
                            door4.isClosing = (simulation.cycle % 240) > 120
                            door4.openClose(true);
                            portal1[2].query()
                            portal1[3].query()
                        }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                            portal1[0].draw();
                            portal1[1].draw();
                            portal1[2].draw();
                            portal1[3].draw();
                        }
                    },
                    () => { //slime
                        // const buttonsCoords = [{ x: x - 675, y: -895 }, { x: x - 750, y: -70 }, { x: x + 75, y: -570 },]
                        // const buttonsCoordsIndex = Math.floor(Math.random() * buttonsCoords.length) //pick a random element from the array 
                        // if (isExitOpen) {
                        //     level.exit.x = buttonsCoords[buttonsCoordsIndex].x;
                        //     level.exit.y = buttonsCoords[buttonsCoordsIndex].y - 25;
                        // } else {
                        //     var gateButton = level.button(buttonsCoords[buttonsCoordsIndex].x, buttonsCoords[buttonsCoordsIndex].y, 126, false) //x, y, width = 126, isSpawnBase = true
                        //     gateButton.isUp = true
                        //     if (stationNumber > gatesOpenRight) {
                        //         var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     } else if (stationNumber < gatesOpenLeft) {
                        //         var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        //     }
                        // }


                        spawn.mapRect(x + -1575, -2000, 3025, 100); //roof
                        // spawn.mapRect(x + -1575, -2200, 3025, 300); //roof
                        // spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        spawn.mapRect(x + -1500, -210, 500, 350); //station floor left
                        spawn.mapRect(x + 1000, -210, 500, 350); //station floor right
                        spawn.mapRect(x + 900, -1250, 125, 1250);
                        spawn.mapRect(x - 1025, -1550, 125, 1625);
                        spawn.mapRect(x - 50, -1900, 100, 1500);
                        spawn.mapRect(x + -975, -1250, 200, 25);
                        spawn.mapRect(x + -950, -625, 150, 25);
                        spawn.mapRect(x - 925, -400, 250, 175);
                        spawn.mapRect(x - 725, -900, 225, 300);
                        spawn.mapRect(x + 325, -225, 325, 75);
                        spawn.mapRect(x + 400, -950, 275, 25);
                        spawn.mapRect(x + 775, -575, 200, 25);
                        spawn.mapRect(x + 0, -1225, 125, 25);
                        spawn.mapRect(x + 0, -575, 225, 175);
                        spawn.mapRect(x - 925, -75, 875, 150);
                        spawn.mapRect(x + 475, -1400, 75, 1250);

                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            if (Math.random() < 0.5) {
                                spawn.randomMobPositions.push(...[
                                    [x + -850, -450],
                                    [x + -850, -125],
                                    // [x + -725, -100],
                                    [x + 0, -100],
                                    // [x + 800, -50],
                                    [x + 50, -275],
                                    // [x + -300, -425],
                                    [x + -750, -475],
                                    // [x + -850, -775],
                                    [x + -650, -1000],
                                    // [x + -150, -1325],
                                    [x + -825, -1350],
                                    // [x + -375, -150],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            } else {
                                spawn.randomMobPositions.push(...[
                                    [x + 350, -350],
                                    [x + 175, -700],
                                    // [x + 350, -1175],
                                    [x + 200, -1600],
                                    // [x + 500, -1675],
                                    [x + 425, -50],
                                    // [x + 725, -75],
                                    [x + 650, -700],
                                    // [x + 775, -1150],
                                    [x + 500, -1675],
                                    // [x + -150, -175],
                                    [x + -800, -150],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            }
                            const softBoss = [() => {
                                spawn.larvaBoss(x - 794, -1032, 15, 16, 2, stationNumber > 0); //x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false)
                            }, () => {
                                spawn.larvaBoss(x - 868, -177, 15, 16, 2, stationNumber > 0);
                            }, () => {
                                spawn.larvaBoss(x + 112, -1540, 15, 16, 2, stationNumber > 0);
                            }]
                            softBoss[Math.floor(softBoss.length * Math.random())]() // softBoss[2]()
                            for (let i = 0; i < mob.length; i++) {
                                mob[i].tier = 4  //make all mobs T4
                            }
                        }

                        const boost1 = level.boost(x - 1185, -225, 1400)
                        const boost2 = level.boost(x + 1100, -225, 1100)
                        const hazard1 = level.hazard(x - 900, -1225, 1800, 1225)
                        let isSlimeRiseUp = false
                        const drip = []
                        drip.push(level.drip(x - 900 + 1800 * Math.random(), -1900, 0, 100)) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
                        drip.push(level.drip(x - 900 + 1800 * Math.random(), -1900, 0, 150))
                        drip.push(level.drip(x - 900 + 1800 * Math.random(), -1900, 0, 70))
                        // drip.push(level.drip(x - 900 + 1800 * Math.random(), -1900, 0, 210))
                        // drip.push(level.drip(x - 900 + 1800 * Math.random(), -1900, 0, 67))
                        stationCustom = () => {
                            for (let i = 0; i < drip.length; i++) drip[i].draw()
                            // drip1.draw();
                            // drip2.draw();
                            // drip3.draw();
                        }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)

                            hazard1.query();
                            hazard1.level(isSlimeRiseUp, 1.5)
                            if (!(hazard1.height < hazard1.maxHeight)) {
                                isSlimeRiseUp = false
                            } else if (!(hazard1.height > 0)) {
                                isSlimeRiseUp = true
                            }
                            boost1.query();
                            boost2.query();
                        }
                    },
                    () => { //portal fling
                        // const buttonsCoords = [{ x: x + 775, y: -1695 }, { x: x - 775, y: -800 }, { x: x - 375, y: -2080 },]
                        // const buttonsCoordsIndex = Math.floor(Math.random() * buttonsCoords.length) //pick a random element from the array 
                        // if (isExitOpen) {
                        //     level.exit.x = buttonsCoords[buttonsCoordsIndex].x;
                        //     level.exit.y = buttonsCoords[buttonsCoordsIndex].y - 25;
                        // } else {
                        //     var gateButton = level.button(buttonsCoords[buttonsCoordsIndex].x, buttonsCoords[buttonsCoordsIndex].y, 126, false) //x, y, width = 126, isSpawnBase = true
                        //     gateButton.isUp = true
                        //     if (stationNumber > gatesOpenRight) {
                        //         var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     } else if (stationNumber < gatesOpenLeft) {
                        //         var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        //     }
                        // }
                        spawn.mapRect(x + -1600, -3450, 300, 1475); //roof
                        spawn.mapRect(x + -1600, -3450, 3225, 100);
                        spawn.mapRect(x + 1300, -3450, 325, 1525);

                        spawn.mapVertex(x + 400, -180, "-300 0   -300 -100   300 -100   400 0");
                        spawn.mapVertex(x - 400, -180, "300 0   300 -100   -300 -100   -400 0");
                        spawn.mapRect(x + -1500, -210, 1425, 350); //station floor left
                        spawn.mapRect(x + 75, -210, 1425, 350); //station floor right
                        spawn.mapRect(x + 75, -950, 50, 450);
                        spawn.mapRect(x + 125, -700, 1225, 200);
                        spawn.mapRect(x + -1325, -1775, 775, 175);
                        spawn.mapVertex(x + 445, -800, "-200 0   -200 -300   100 -300   185 0");
                        spawn.mapVertex(x - 310, -1880, "-185 0   -100 -400   400 -400   400 0");
                        spawn.mapVertex(x + -675, -725, "325 0  250 80  -250 80  -325 0  -250 -80  250 -80");
                        spawn.mapRect(x + 625, -1700, 750, 500);

                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            spawn.randomMobPositions.push(...[
                                [x + -750, -1925],
                                [x + -425, -2300],
                                // [x + -350, -2200],
                                [x + -275, -2175],
                                // [x + -375, -2175],
                                [x + 1075, -1850],
                                // [x + 925, -1775],
                                [x + 1150, -1800],
                                // [x + 1400, -2150],
                                [x + 925, -850],
                                // [x + 800, -800],
                                [x + 875, -825],
                                // [x + 1050, -900],
                                [x + 19050, -2925],
                                // [x + 17150, -3150],
                                [x + 17700, -3300],
                            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            const softBoss = [() => {
                                spawn.roundwormBoss4(x - 900, -1400); //x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false)
                            }, () => {
                                spawn.roundwormBoss4(x - 750, -2750); //x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false)
                            }, () => {
                                spawn.roundwormBoss4(x + 950, -2000); //x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false)
                            }]
                            softBoss[Math.floor(softBoss.length * Math.random())]()

                            for (let i = 0; i < mob.length; i++) {
                                mob[i].tier = 4  //make all mobs T4
                            }
                        }
                        const portal1 = level.portal({
                            x: x + 0,
                            y: -200
                        }, -Math.PI / 2, { //up
                            x: x + 200,
                            y: -900
                        }, -Math.PI / 2) //up
                        const portal2 = level.portal({
                            x: x + 1275,
                            y: -800
                        }, Math.PI, { //right
                            x: x + -1275,
                            y: -1875
                        }, 2 * Math.PI) //right

                        stationCustom = () => {
                            portal1[2].query(true)
                            portal1[3].query(true)
                            portal2[2].query()
                            portal2[3].query()
                        }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                            portal1[0].draw();
                            portal1[1].draw();
                            portal1[2].draw();
                            portal1[3].draw();
                            portal2[0].draw();
                            portal2[1].draw();
                            portal2[2].draw();
                            portal2[3].draw();
                        }
                    },
                    () => { //tower levels and squares
                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        spawn.mapRect(x + -1625, -3950, 3225, 350);//roof
                        spawn.mapRect(x + 1300, -3850, 300, 2150); //roof wall
                        spawn.mapRect(x + -1625, -3950, 325, 2250); //roof wall
                        spawn.mapRect(x + -1050, -575, 1000, 75);
                        spawn.mapRect(x + 175, -575, 975, 75);
                        spawn.mapRect(x + -1050, -825, 150, 275);
                        spawn.mapRect(x + -900, -1200, 2275, 75);
                        spawn.mapRect(x + 125, -1425, 1250, 300);
                        spawn.mapRect(x + -925, -1775, 2100, 75);
                        spawn.mapRect(x + -100, -2050, 950, 350);
                        spawn.mapRect(x + -925, -2100, 100, 400);
                        spawn.mapRect(x + -700, -2375, 1225, 75);
                        spawn.mapRect(x + 650, -2375, 575, 75);
                        spawn.mapRect(x + -25, -2750, 350, 269);
                        spawn.mapRect(x + -950, -3125, 975, 75);
                        spawn.mapRect(x + 325, -3025, 900, 75);
                        spawn.bodyRect(x + -125, -1325, 225, 125, 0.3);
                        spawn.bodyRect(x + -225, -2100, 300, 50, 0.3);
                        spawn.bodyRect(x + -225, -2575, 100, 200, 0.3);
                        spawn.bodyRect(x + 850, -2575, 150, 200, 0.3);
                        spawn.bodyRect(x + 850, -1875, 75, 100, 0.3);
                        spawn.bodyRect(x + 500, -725, 175, 150, 0.3);
                        spawn.bodyRect(x + -925, -2250, 100, 150, 0.3);
                        spawn.bodyRect(x + -1050, -950, 150, 125, 0.3);

                        const mobPlacement = [
                            () => { //1st floor
                                spawn.randomMobPositions.push(...[
                                    [x + -775, -725],
                                    [x + -575, -700],
                                    // [x + -275, -700],
                                    [x + -125, -650],
                                    // [x + 250, -675],
                                    [x + 425, -650],
                                    // [x + 775, -650],
                                    [x + 1050, -675],
                                    // [x + 675, -950],
                                    [x + -625, -900],
                                    // [x + -750, -1400],
                                    [x + -500, -2025],
                                    // [x + -125, -3225],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                            () => { //2nd floor
                                spawn.randomMobPositions.push(...[
                                    [x + -950, -925],
                                    [x + -775, -1325],
                                    // [x + -450, -1500],
                                    [x + -325, -1250],
                                    // [x + 0, -1500],
                                    [x + 375, -1525],
                                    // [x + 750, -1550],
                                    [x + 1175, -1550],
                                    // [x + -875, -1350],
                                    [x + -875, -2375],
                                    // [x + 175, -2850],
                                    [x + 750, -2475],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                            () => {//3rd floor
                                spawn.randomMobPositions.push(...[
                                    [x + 1075, -2000],
                                    [x + 725, -2125],
                                    // [x + 350, -2125],
                                    [x + -325, -2000],
                                    // [x + -675, -1875],
                                    [x + -725, -2200],
                                    // [x + -675, -2575],
                                    [x + -425, -2675],
                                    // [x + -50, -2875],
                                    [x + 425, -2725],
                                    // [x + 1150, -2550],
                                    [x + 1150, -2175],
                                    // [x + 1000, -1900],
                                    [x + 500, -2550],
                                    // [x + 125, -2900],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                            () => {//all floors
                                spawn.randomMobPositions.push(...[
                                    [x + 1000, -850],
                                    [x + 300, -850],
                                    // [x + -450, -825],
                                    [x + -1025, -1125],
                                    // [x + -750, -1375],
                                    [x + -225, -1375],
                                    // [x + 625, -1525],
                                    [x + 1025, -1925],
                                    // [x + -425, -2100],
                                    [x + -400, -2650],
                                    // [x + 150, -3000],
                                    [x + 675, -3200],
                                    // [x + -550, -3300],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                        ]
                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            mobPlacement[Math.floor(Math.random() * mobPlacement.length)]()//different random mob placements, with mobs clustered to surprise player
                            const softBoss = [() => {
                                spawn.hydraBoss2(x + 800, -3300, 25, 5);
                            }, () => {
                                spawn.hydraBoss2(x + 775, -2650, 25, 5);
                            }, () => {
                                spawn.hydraBoss2(x - 400, -2075, 25, 5);
                            }]
                            softBoss[Math.floor(softBoss.length * Math.random())]()

                            for (let i = 0; i < mob.length; i++) {
                                if (mob[i].isBoss) {
                                    mob[i].tier = 4  //make all mobs T4
                                } else if (mob[i].swordVertex) {
                                    mob[i].damageReduction = 0.002
                                }
                            }
                        }
                        stationCustom = () => { }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                        }
                    },
                    () => { //jump pads and 6 sided platforms
                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        spawn.mapRect(x + -3200, -3200, 300, 1400); //roof left wall
                        spawn.mapRect(x + 2600, -3200, 300, 1400);//roof right wall
                        spawn.mapRect(x + -3175, -3200, 6175, 225);//roof
                        if (Math.random() < 0.3) spawn.mapRect(x + -1350, -550, 150, 50); //wall ledge
                        if (Math.random() < 0.3) spawn.mapRect(x + 1175, -550, 200, 50); //wall ledge
                        spawn.mapVertex(x + 600, -900, "490 0  350 80  -350 80  -490 0  -350 -80  350 -80"); //hexagon but wide
                        spawn.mapVertex(x - 600, -750, "490 0  350 80  -350 80  -490 0  -350 -80  350 -80"); //hexagon but wide
                        spawn.mapVertex(x - 100, -1850, "-100 -300  0 -350  100 -300  100 300  0 350  -100 300"); //hexagon but tall
                        spawn.mapVertex(x + -600, -2000, "-150 -450 150 -450  150 450  0 525  -150 450"); //hexagon but big and tall and flat
                        spawn.mapVertex(x + 350, -1575, "-150 0  150 0  150 450  0 525  -150 450"); //hexagon but tall and flat top
                        spawn.mapVertex(x + 850, -1575, "-150 0  150 0  150 450  0 525  -150 450"); //hexagon but tall and flat top
                        spawn.mapVertex(x + -2050, -2350, "490 0  350 80  -350 80  -490 0  -350 -80  350 -80"); //left top corner hexagon but wide
                        spawn.mapVertex(x + 1700, -2450, "-100 -300  0 -350  100 -300  100 300  0 350  -100 300"); //hexagon but tall

                        const mobPlacement = [
                            () => { //rightish
                                spawn.randomMobPositions.push(...[
                                    [x + 2250, -2375],
                                    [x + 1950, -2825],
                                    // [x + 1275, -2775],
                                    [x + 1450, -2200],
                                    // [x + 825, -1950],
                                    [x + 400, -1875],
                                    // [x + -75, -2275],
                                    [x + -650, -2550],
                                    // [x + 1500, -2075],
                                    [x + 2125, -2650],
                                    // [x + 2075, -2250],
                                    [x + 1000, -2850],
                                    // [x + 750, -950],
                                    [x + -750, -1125],
                                    // [x + -1575, -2050],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                            () => { //leftish
                                spawn.randomMobPositions.push(...[
                                    [x + -2225, -2125],
                                    [x + -2675, -2125],
                                    // [x + -2600, -2600],
                                    [x + -2100, -2725],
                                    // [x + -1425, -2600],
                                    [x + -1375, -2050],
                                    // [x + -575, -2575],
                                    [x + -125, -2300],
                                    // [x + 350, -1925],
                                    [x + -350, -1050],
                                    // [x + -1000, -1000],
                                    [x + -700, -1300],
                                    // [x + 350, -1150],
                                    [x + -575, -2525],
                                    // [x + -1075, -2525],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                            () => {//centerish
                                spawn.randomMobPositions.push(...[
                                    [x + 25, -2275],
                                    [x + 300, -1975],
                                    // [x + 700, -1950],
                                    [x + 325, -1200],
                                    // [x + -225, -950],
                                    [x + -925, -975],
                                    // [x + -675, -2575],
                                    [x + -1425, -2175],
                                    // [x + 1575, -2075],
                                    [x + 2300, -2075],
                                    // [x + 425, -1925],
                                    [x + 125, -2175],
                                    // [x + -325, -2150],
                                    [x + -350, -950],
                                    // [x + 600, -325],
                                    [x + -600, -375],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            },
                        ]
                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            mobPlacement[Math.floor(Math.random() * mobPlacement.length)]()//different random mob placements, with mobs clustered to surprise player
                            //    centipedeBoss(x, y, radius = 16, gridX = 16, gridY = 2, flipHead = false) {
                            const softBoss = [() => {
                                spawn.centipedeBoss(x - 2800, -2900, 25, 40, 3);
                            }, () => {
                                spawn.centipedeBoss(x - 400, -2450, 25, 30, 3);
                            },]
                            softBoss[Math.floor(softBoss.length * Math.random())]()

                            for (let i = 0; i < mob.length; i++) {
                                if (mob[i].isBoss) {
                                    mob[i].tier = 3  //make all mobs T4
                                    mob[i].accelMag *= 1.1
                                }
                            }
                        }
                        const boost1 = level.boost(x - 50, -225, 790)
                        const boost2 = level.boost(x + 550, -985, 900)
                        const boost3 = level.boost(x + -850, -835, 1900)
                        stationCustom = () => { }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                            boost1.query();
                            boost2.query();
                            boost3.query();
                        }
                    },
                    () => { //crouch tunnels
                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        spawn.mapRect(x + -1575, -2200, 3025, 300); //roof
                        spawn.mapRect(x + -1100, -925, 100, 610);
                        spawn.mapRect(x + 900, -550, 100, 235);

                        spawn.mapRect(x + -1300, -575, 125, 75);
                        spawn.mapRect(x + -1100, -575, 375, 75);
                        spawn.mapRect(x + -925, -1300, 375, 125);
                        spawn.mapRect(x + -300, -1300, 620, 125);
                        spawn.mapRect(x + 450, -1400, 500, 225);
                        spawn.mapRect(x + 900, -550, 500, 50);
                        spawn.mapRect(x + 950, -925, 400, 270);
                        spawn.mapRect(x + 1250, -1250, 150, 75);
                        spawn.mapRect(x + -225, -525, 800, 210);
                        spawn.mapRect(x + -100, -1600, 300, 193);
                        spawn.mapRect(x + 925, -1250, 75, 75);
                        spawn.bodyRect(x + 200, -1475, 75, 175, 0.3);
                        spawn.bodyRect(x + -25, -625, 225, 100, 0.3);
                        spawn.bodyRect(x + -1000, -750, 125, 175, 0.3);
                        spawn.bodyRect(x + -625, -1450, 75, 150, 0.3);
                        spawn.bodyRect(x + -650, -300, 300, 75, 0.3);
                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            spawn.randomMobPositions.push(...[
                                [x + -750, -1425],
                                [x + -1050, -1100],
                                // [x + -825, -750],
                                [x + -500, -400],
                                // [x + 450, -650],
                                [x + 0, -725],
                                // [x + 300, -1350],
                                [x + 550, -1500],
                                // [x + 725, -1650],
                                [x + 900, -1550],
                                // [x + 1100, -1300],
                                [x + -1050, -1050],
                                // [x + -925, -350],
                                [x + 75, -1750],
                                // [x + 1000, -375],
                            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            spawn.bounceBoss(x + 75, -975, 40, true)
                            for (let i = 0; i < mob.length; i++) {
                                if (mob[i].isBoss) {
                                    mob[i].tier = 4  //make all mobs T4
                                    // mob[i].accelMag *= 1.1
                                }
                            }
                        }
                        stationCustom = () => {
                            //out of bounds check for boss
                            if (!(simulation.cycle % 120)) {
                                for (let i = 0; i < mob.length; i++) {
                                    if (mob[i].isBoss && (mob[i].position.x < x - 1500 || mob[i].position.x > x + 1500)) {
                                        Matter.Body.setPosition(mob[i], { x: x, y: -800 });
                                    }
                                }
                            }
                        }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                            ctx.fillStyle = "rgba(0,0,0,0.08)"
                            ctx.fillRect(x + -225, -325, 800, 125);
                            ctx.fillRect(x + -100, -1425, 300, 125);
                            ctx.fillRect(x + 950, -675, 400, 125);
                            ctx.fillRect(x + -1100, -350, 100, 150);
                            ctx.fillRect(x + 900, -325, 100, 150);

                        }
                    },
                    () => { //angled jumps
                        // const buttonsCoords = [{ x: x + 50, y: -1395 }, { x: x - 625, y: -2945 }, { x: x + 900, y: -2945 }]
                        // const buttonsCoordsIndex = Math.floor(Math.random() * buttonsCoords.length) //pick a random element from the array

                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        boosts = []
                        boosts.push(level.boost(x - 311, -218, 1200, 1.85))
                        spawn.mapRect(x + -225, -525, 675, 375);
                        spawn.mapRect(x + -1350, -1175, 400, 675);
                        spawn.mapRect(x + -225, -2125, 675, 400);

                        // spawn.mapRect(x + -225, -1325, 675, 550);
                        spawn.mapRect(x + -225, -1400, 675, 650);

                        boosts.push(level.boost(x - 1335, -1200, 1800, 1))
                        boosts.push(level.boost(x + 1272, -1300, 1550, 2.75)) //far right
                        //high up walls
                        boosts.push(level.boost(x + 1455, -2048, 1450, 2.5))
                        spawn.mapRect(x + 1500, -3825, 325, 1900);
                        boosts.push(level.boost(x - 1555, -2048, 1450, 0.64))
                        // spawn.mapRect(x + -1625, -3975, 3450, 325);
                        spawn.mapRect(x + -1825, -4000, 325, 2150);
                        spawn.mapRect(x + -1825, -4070, 3650, 375);//roof

                        spawn.randomMobPositions.push(...[
                            [x + 100, -2125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        boosts.push(level.boost(x + 75, -2175, 2800))
                        spawn.mapRect(x + -100, -3900, 400, 400);
                        Matter.Body.setAngle(map[map.length - 1], map[map.length - 1].angle - Math.PI / 4);

                        spawn.mapRect(x + 225, -2950, 1100, 150);
                        spawn.mapRect(x + -1325, -2950, 1325, 150);

                        // if (isExitOpen) {
                        //     level.exit.x = buttonsCoords[buttonsCoordsIndex].x;
                        //     level.exit.y = buttonsCoords[buttonsCoordsIndex].y - 25;
                        // } else {
                        //     var gateButton = level.button(buttonsCoords[buttonsCoordsIndex].x, buttonsCoords[buttonsCoordsIndex].y, 126, false) //x, y, width = 126, isSpawnBase = true
                        //     gateButton.isUp = true
                        //     if (stationNumber > gatesOpenRight) {
                        //         var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     } else if (stationNumber < gatesOpenLeft) {
                        //         var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        //     }
                        // }

                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            spawn.randomMobPositions.push(...[
                                [x + 350, -600],
                                [x + -25, -600],
                                // [x + 600, -300],
                                [x + 1050, -300],
                                // [x + 350, -1525],
                                // [x + -75, -1525],
                                // [x + -1075, -1275],
                                [x + -1350, -2050],
                                // [x + -50, -2250],
                                [x + -200, -3050],
                                // [x + -925, -3150],
                                // [x + 450, -3125],
                                // [x + 1075, -3025],
                                // [x + 750, -3125],
                                // [x + -725, -3125],
                            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            // myriapodsBoss(where, num = 5, radius = 22, gridX = 14, gridY = 2) {
                            spawn.myriapodsBoss([{ x: -650, y: -1550 }, { x: x + 825, y: -1100 }, { x: x + -550, y: -825 }, { x: x + 800, y: -2400 }, { x: x + -650, y: -2500 }, { x: x + -675, y: -3225 }])
                        }
                        stationCustom = () => {
                            for (let i = 0; i < boosts.length; i++) {
                                boosts[i].query()
                            }
                        }
                        stationCustomTopLayer = () => {
                            // checkGate(gate, gateButton)
                            ctx.fillStyle = "rgba(0,0,0,0.08)"
                            ctx.fillRect(x - 225, -775, 675, 275);
                            ctx.fillRect(x - 225, -1750, 675, 375);
                        }
                    },
                    () => { //people movers
                        simulation.removeEphemera("zoom", true)//stop previous zooms
                        simulation.zoomTransition(2000)
                        // const buttonsCoords = [{ x: x - 65, y: -2045 }] //only one button location?
                        // const buttonsCoordsIndex = Math.floor(Math.random() * buttonsCoords.length) //pick a random element from the array

                        // console.log(stationNumber)
                        // if (isExitOpen) {
                        //     level.exit.x = buttonsCoords[buttonsCoordsIndex].x;
                        //     level.exit.y = buttonsCoords[buttonsCoordsIndex].y - 25;
                        // } else {
                        //     var gateButton = level.button(buttonsCoords[buttonsCoordsIndex].x, buttonsCoords[buttonsCoordsIndex].y, 126, false) //x, y, width = 126, isSpawnBase = true
                        //     gateButton.isUp = true
                        //     if (stationNumber > gatesOpenRight) {
                        //         var gate = level.doorMap(x + 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20                        
                        //     } else if (stationNumber < gatesOpenLeft) {
                        //         var gate = level.doorMap(x - 1375, -525, 50, 375, 300, 20, false) //x, y, width, height, distance, speed = 20
                        //     }
                        // }
                        const moverDirection = stationNumber > 0 ? 1 : -1
                        //floor 0
                        spawn.mapRect(x + -1500, -210, 3000, 400);//station floor
                        const movers = []
                        movers.push(level.mover(x + -1200, -220, 900, 50, 3 * moverDirection))
                        movers.push(level.mover(x + 300, -220, 900, 50, 3 * moverDirection))
                        spawn.mapRect(x + -4700, -7000, 700, 5200);//Left wall
                        spawn.mapRect(x + 4000, -7000, 500, 5200);//Right wall
                        const portals = []
                        portals.push(level.portal({ x: x - 315, y: -310 }, Math.PI, { x: x - 3985, y: -2110 }, 0))
                        spawn.mapRect(x - 1375, -1100, 2750, 300);
                        spawn.mapRect(x + -300, -525, 600, 550);

                        //floor 1 fast with jump in middle
                        movers.push(level.mover(x - 4000, -2025, 2700, 50, 30 * moverDirection))
                        movers.push(level.mover(x + 1300, -2025, 2700, 50, 30 * moverDirection))
                        portals.push(level.portal({ x: x + 3985, y: -2110 }, Math.PI, { x: x - 3985, y: -3410 }, 0))
                        spawn.mapRect(x + -500, -2050, 1000, 150);
                        spawn.mapRect(x + -4200, -2300, 1225, 125);
                        spawn.mapRect(x + 2675, -2350, 1625, 150);
                        //up mode triggered by player contact
                        const elevator0 = level.elevator(x - 1300, -1175, 175, 50, -1600, 0.011, { up: 0.01, down: 0.7 })
                        const elevator1 = level.elevator(x + 1125, -1175, 175, 50, -1600, 0.011, { up: 0.01, down: 0.7 })

                        //floor 2  slow with some things to jump on and mobs
                        portals.push(level.portal({ x: x + 3985, y: -3410 }, Math.PI, { x: x - 3985, y: -5110 }, 0))
                        movers.push(level.mover(x - 4000, -3325, 8000, 50, 7 * moverDirection))
                        if (Math.random() < 0.5) {
                            spawn.mapRect(x + 1125, -3625, 325, 200);
                            spawn.mapRect(x - 1350, -3600, 375, 175);
                            spawn.mapRect(x + 325, -3825, 325, 100);
                            spawn.mapRect(x - 675, -3800, 450, 75);
                            spawn.mapRect(x - 1775, -3900, 175, 400);
                            spawn.mapRect(x - 2100, -4275, 325, 775);
                            spawn.mapRect(x + 2625, -3700, 450, 125);
                            spawn.mapRect(x - 3350, -3335, 175, 50);
                            spawn.mapRect(x - 200, -3335, 500, 50);
                            spawn.mapRect(x + 3200, -3335, 325, 50);
                        } else {
                            spawn.mapRect(x + -325, -3550, 425, 125);
                            spawn.mapRect(x + -1100, -3750, 425, 75);
                            spawn.mapRect(x + -2175, -3500, 200, 200);
                            spawn.mapRect(x + 675, -3700, 175, 75);
                            spawn.mapRect(x + 2375, -3425, 275, 125);
                            spawn.mapRect(x + 1750, -3650, 275, 75);
                            spawn.mapRect(x + 1125, -3850, 175, 550);
                            spawn.mapRect(x + -3300, -4175, 675, 550);
                        }
                        spawn.mapRect(x + 3550, -3625, 550, 100);
                        spawn.mapRect(x + -4100, -3650, 325, 100);
                        if (!stationsCleared[Math.abs(stationNumber % totalStations)]) {
                            spawn.randomMobPositions.push(...[
                                [x + 3900, -3725],
                                [x + 3675, -3700],
                                // [x + 2075, -3400],
                                [x + 2500, -3500],
                                // [x + 1975, -3700],
                                [x + 1250, -3900],
                                // [x + 800, -3750],
                                [x + 2700, -4700],
                                [x + -75, -3650],
                                [x + 575, -3500],
                                // [x + -850, -3900],
                                [x + -2725, -4350],
                                // [x + -2975, -4300],
                                [x + -3950, -3675],
                                [x + -2950, -3450],
                                [x + -2075, -3575],
                                // [x + -1650, -3450],
                                [x + -2825, -4400],
                                // [x + -900, -4475],
                                [x + -75, -3575],
                                // [x + 3900, -3775],
                                [x + 2825, -3375],
                                // [x + 2075, -3425],
                                [x + 1525, -3425],
                                [x + 350, -3500],
                                [x + -1675, -3650],
                                [x + -3025, -3450],
                                [x + -3850, -3750],
                            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                            spawn.tetherBoss4(x + 0, -4000, { x: x, y: -4974 }, 150) // tetherBoss(x, y, constraint, radius = 90)
                        }

                        //floor 3 fast with bumps
                        spawn.mapRect(x + -4250, -7000, 8475, 325);//roof
                        portals.push(level.portal({ x: x + 3985, y: -5110 }, Math.PI, { x: x + 320, y: -310 }, 0))
                        movers.push(level.mover(x - 4000, -5025, 8000, 50, 50 * moverDirection))
                        if (Math.random() < 0.5) {
                            spawn.mapVertex(x - 2100, -5050, "-150 0   150 0   5 -150   -5 -150")
                            spawn.mapVertex(x - 0, -5100, "-500 0   500 0   25 -300   -25 -300")
                            spawn.mapVertex(x + 2100, -5050, "-300 0   300 0   100 -100   -100 -100")
                        } else {
                            spawn.mapVertex(x - 2100, -5050, "-100 0   100 0   25 -100   -25 -100")
                            spawn.mapVertex(x - 0, -5050, "-400 0   400 0   100 -100   -100 -100")
                            spawn.mapVertex(x + 2100, -5050, "-400 0   400 0   100 -100   -100 -100")
                        }
                        spawn.mapRect(x + 2000, -6700, 200, 1250);
                        spawn.mapRect(x + -100, -6700, 200, 1075);
                        spawn.mapRect(x + -2125, -6700, 50, 925);
                        // spawn.mapRect(x + -4150, -5325, 975, 125); //portal over hang
                        // spawn.mapRect(x + 3325, -5300, 850, 100);//portal over hang

                        stationCustom = () => {
                            for (let i = 0; i < movers.length; i++) movers[i].push();
                            for (let i = 0; i < portals.length; i++) {
                                portals[i][2].query()
                                portals[i][3].query()
                            }
                        }
                        stationCustomTopLayer = () => {
                            for (let i = 0; i < portals.length; i++) {
                                portals[i][0].draw()
                                portals[i][1].draw()
                                portals[i][2].draw()
                                portals[i][3].draw()
                            }
                            elevator0.moveOnTouch()
                            elevator1.moveOnTouch()

                            //custom draw so you can see the mover tracks on subway map with the Line of sight graphics
                            ctx.strokeStyle = "#000"
                            ctx.lineWidth = 4;
                            ctx.setLineDash([40, 40]);
                            for (let i = 0; i < movers.length; i++) {
                                ctx.beginPath();
                                ctx.moveTo(movers[i].vertices[0].x + 2, movers[i].vertices[0].y - 3);
                                ctx.lineTo(movers[i].vertices[1].x - 2, movers[i].vertices[1].y - 3);
                                ctx.lineDashOffset = (-simulation.cycle * movers[i].VxGoal) % 80;
                                ctx.stroke();
                            }
                            ctx.setLineDash([]);
                            // checkGate(gate, gateButton)
                        }
                    },
                ]
                // console.log(stations, "stations")
                //update totalNumberOfStations to a higher number when adding new maps
                simulation.zoomTransition(level.defaultZoom)
                // spawn.randomHigherTierMob(1732, -2267)
                // stations[10]() //for testing a specific station
                spawn.randomMobPositions = []
                stations[stationList[Math.abs(stationNumber % stationList.length)]]() //*************** run this one when done testing individual stations
                spawn.randomMobFromArray()
                // stations[7]()

                //add in standard station map infrastructure
                spawn.mapRect(x + -8000, 0, 16000, 800);//tunnel floor
                spawn.mapRect(x + 1500 - 200, -2000, 6400, 1500); //tunnel roof
                spawn.mapRect(x + -1500 - 6400 + 200, -2000, 6400, 1500); //tunnel roof

                // add debris so you can see how fast the train moves
                const debrisCount = 4
                const size = 18 + Math.random() * 25;
                const wide = 6400
                if (isInProgress) {
                    //adds new map elements to the level while the level is already running 
                    for (let i = 0; i < map.length; ++i) {
                        map[i].collisionFilter.category = cat.map;
                        map[i].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                        Matter.Body.setStatic(map[i], true); //make static
                        Composite.add(engine.world, map[i]); //add to world
                    }
                    simulation.draw.setPaths()
                    simulation.draw.lineOfSightPrecalculation() //required precalculation for line of sight


                    //shift trains left/right, as you move left or right a train will jump over and become the train needed at the next station
                    let repositionTrain
                    let playerOnTrain
                    if (Math.abs(train[0].position.x - m.pos.x) > Math.abs(train[1].position.x - m.pos.x)) { //figure out which train the player is farthest from and move it
                        repositionTrain = train[0]
                        playerOnTrain = train[1]
                    } else {
                        repositionTrain = train[1]
                        playerOnTrain = train[0]
                    }
                    repositionTrain.isMoving = false
                    if (repositionTrain.position.x > playerOnTrain.position.x) { //decide if the train is moving left or right
                        Matter.Body.setPosition(repositionTrain, { x: -1725 + x, y: repositionTrain.position.y });
                        repositionTrain.changeDirection(false) //go left
                        repositionTrain.stops = { right: -1725 + x, left: -7225 + x }
                        for (let i = 0; i < debrisCount; ++i) spawn.bodyRect(x + -1500 - 6400 + 200 + Math.random() * wide, -35, size * (0.6 + Math.random()), size * (0.6 + Math.random()), 1);
                    } else {
                        Matter.Body.setPosition(repositionTrain, { x: 1725 + x, y: repositionTrain.position.y });
                        repositionTrain.changeDirection(true) //go right
                        repositionTrain.stops = { left: 1725 + x, right: 7225 + x }
                        for (let i = 0; i < debrisCount; ++i) spawn.bodyRect(x + 1500 - 200 + Math.random() * wide, -35, size * (0.6 + Math.random()), size * (0.6 + Math.random()), 1);
                    }
                } else {
                    for (let i = 0; i < debrisCount; ++i) spawn.bodyRect(x + -1500 - 6400 + 200 + Math.random() * wide, -35, size * (0.6 + Math.random()), size * (0.6 + Math.random()), 1);
                    for (let i = 0; i < debrisCount; ++i) spawn.bodyRect(x + 1500 - 200 + Math.random() * wide, -35, size * (0.6 + Math.random()), size * (0.6 + Math.random()), 1);
                }
                stationsCleared[Math.abs(stationNumber)] = true
            }
            infrastructure(0, false) //if this is run before the level starts, it needs a false

            level.custom = () => {
                for (let i = 0; i < train.length; i++)  train[i].trainStop()
                ctx.fillStyle = "rgba(0,0,0,0.1)"//"#ddd"
                ctx.fillRect(m.pos.x - 4000, m.pos.y - 4000, 8000, 8000)
                level.exit.drawAndCheck();
                // level.enter.draw();

                //track what station the player is in
                if (m.pos.x > 0.55 * stationWidth + stationNumber * stationWidth) {
                    stationNumber++
                    // if ((stationNumber % stationList.length) == 0) stationNumber++ //skip the stationNumber that is the modulus of the length of the stationList
                    infrastructure(stationNumber * stationWidth)
                } else if (m.pos.x < -0.55 * stationWidth + stationNumber * stationWidth) {
                    stationNumber--
                    // if ((stationNumber % stationList.length) == 0) stationNumber--//skip the stationNumber that is the modulus of the length of the stationList
                    infrastructure(stationNumber * stationWidth)
                }
                stationCustom()
            };
            level.customTopLayer = () => {
                for (let i = 0; i < train.length; i++) train[i].draw()
                stationCustomTopLayer()
            };
            level.isProcedural = true //only used in generating text for the level builder
            simulation.draw.lineOfSightPrecalculation() //required precalculation for line of sight
            simulation.draw.drawMapPath = simulation.draw.drawMapSight
        },
        reservoir() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(700, 950, true)
            } else {
                level.announceText(-687, 950, true)
            }
            level.announceMobTypes()
            level.exit.x = 1700;
            level.exit.y = -4510;
            spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 25);
            level.setPosToSpawn(-500, 850); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.defaultZoom = 2300
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d8dadf";
            color.map = "#3d4240"
            powerUps.spawnStartingPowerUps(-575, -2925)
            //walls
            spawn.mapRect(-3500, -5000, 1500, 6500);
            spawn.mapRect(2000, -5000, 1500, 6500);
            spawn.mapRect(-2500, 1100, 5000, 400); //slime floor
            spawn.mapRect(-3500, -5475, 7000, 600); //top
            spawn.mapRect(-1925, -4900, 175, 375); //pipe
            spawn.mapRect(-1950, -4550, 225, 25); //pipe
            //top floor exit
            spawn.mapRect(1475, -4900, 50, 250);
            spawn.mapRect(1400, -4475, 650, 50);
            // ground
            spawn.mapVertex(-687, 1060, "700 0  -700 0  -450 -300  450 -300"); //left base
            spawn.mapVertex(863, 1060, "700 0  -700 0  -450 -300  450 -300"); //right base
            //entrance
            spawn.mapRect(-730, 525, 475, 50);
            spawn.mapRect(-730, 550, 50, 150);
            spawn.mapRect(-305, 550, 50, 500);
            spawn.bodyRect(-717, 700, 25, 100); //door
            spawn.bodyRect(-717, 800, 25, 100); //door
            //1st floor            //left
            spawn.mapVertex(-1125 + 437, -50, "490 0  350 80  -350 80  -490 0  -350 -80  350 -80");
            spawn.mapRect(-1225, -100, 1070, 100);
            if (Math.random() < 0.33) {
                spawn.mapVertex(-687, -1000, "-100 -300  0 -350  100 -300  100 300  0 350  -100 300");
            } else if (Math.random() < 0.5) {
                spawn.mapVertex(-687, -1000, "-150 -450  0 -525  150 -450  150 450  0 525  -150 450");
            } else {
                spawn.mapVertex(-687, -700, "-150 0  150 0  150 450  0 525  -150 450");
            }
            //right
            spawn.mapVertex(425 + 437, -50, "490 0  350 80  -350 80  -490 0  -350 -80  350 -80");
            spawn.mapRect(325, -100, 1070, 100);
            spawn.mapRect(175, 675, 425, 25);
            spawn.mapRect(1125, 225, 425, 25);
            spawn.mapRect(650, 450, 425, 25);
            if (Math.random() < 0.33) {
                spawn.mapVertex(855, -1000, "-100 -300  0 -350  100 -300  100 300  0 350  -100 300");
            } else if (Math.random() < 0.5) {
                spawn.mapVertex(855, -1000, "-150 -450  0 -525  150 -450  150 450  0 525  -150 450");
            } else {
                spawn.mapVertex(855, -700, "-150 0  150 0  150 450  0 525  -150 450");
            }
            //2nd floor
            spawn.mapVertex(-687, -1936, "-625 50  0 100  625 50  625 -50 -625 -50");
            spawn.mapVertex(855, -1936, "-625 50  0 100  625 50  625 -50 -625 -50");
            //2nd floor right building
            spawn.mapRect(550, -3050, 600, 75);
            spawn.bodyRect(-125, -2025, 475, 25);
            spawn.mapRect(-925, -2350, 675, 50);
            spawn.mapRect(-825, -2825, 425, 50);
            spawn.mapRect(-450, -3125, 50, 350);
            spawn.mapRect(-750, -3150, 350, 50);
            spawn.mapRect(-650, -3400, 250, 300);
            spawn.mapRect(-650, -3675, 200, 50);
            spawn.bodyRect(-375, -2150, 100, 150, 0.2);
            //2nd floor left pillar
            spawn.mapRect(-1400, -2625, 325, 25);
            spawn.mapRect(-1450, -3225, 425, 25);
            spawn.mapRect(-1512.5, -3825, 550, 25);

            spawn.randomMobPositions = [
                [1000, -275],
                [950, -1725],
                // [-725, -1775],
                [-200, -2075],
                [-550, -3500],
                // [375, -2125],
                [-700, -2450],
                [-1175, -2775],
                // [1025, -3200],
                [-525, -3750],
                // [1350, -2075],
                [1775, 1000],
                [-575, -2925, true]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(-400, -4400, 0);
            spawn.randomLevelBoss(825, -3500);
            spawn.secondaryBossChance(75, -1350)
            //spawn.randomHigherTierMob(955, -208)

            powerUps.addResearchToLevel() //needs to run after mobs are spawned
            const slime = level.hazard(-2000, -5000, 4000, 6060); //    hazard(x, y, width, height, damage = 0.003)
            slime.height -= slime.maxHeight - 60 //start slime at zero
            slime.min.y += slime.maxHeight
            slime.max.y = slime.min.y + slime.height
            const elevator1 = level.elevator(-1625, -90, 310, 800, -2000, 0.0025, { up: 0.1, down: 0.2 }) //x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
            const elevator2 = level.elevator(1175, -3050, 200, 250, -4475, 0.0025, { up: 0.12, down: 0.2 }) //x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
            let waterFallWidth = 0
            let waterFallX = 0
            let waterFallSmoothX = 0
            let isWaterfallFilling = false
            const riseRate = 0.30 + Math.min(1, simulation.difficulty * 0.005)
            const spinnerArray = []
            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                spawn.mapVertex(584, -2500, "0 0  300 0  150 600  0 600");
                spawn.mapVertex(1116, -2500, "0 0  300 0  300 600  150 600");
                spawn.bodyRect(-200, -125, 625, 25);
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                elevator1.holdX = -elevator1.holdX // flip the elevator horizontally
                elevator2.holdX = -elevator2.holdX // flip the elevator horizontally
                spinnerArray.push(level.spinner(-110, -3325, 45, 600, 0.003, 0, 0, 0.01)) //    spinner(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0) {
                const boost1 = level.boost(-900, -2000, 790)
                level.setPosToSpawn(500, 850); //normal spawn
                level.custom = () => {
                    ctx.fillStyle = "#c0c3c9" ///!!!!!!!!!!   for flipped x:  newX = -oldX - width
                    ctx.fillRect(1468, -1975, 2, 1915) //elevator track
                    ctx.fillRect(-1274, -4460, 2, 1425) //elevator track
                    ctx.fillRect(1225, -3825, 25, 1850); //small pillar background
                    ctx.fillStyle = "#d0d4d6"
                    ctx.fillRect(275, -1925, 825, 2925) //large pillar background
                    ctx.fillRect(-1275, -1925, 825, 2925) //large pillar background
                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(-2000, -4900, 525, 425)
                    level.exit.drawAndCheck();
                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    boost1.query();
                    elevator1.move();
                    elevator2.move();
                    ctx.fillStyle = "#233"
                    ctx.beginPath(); //central dot on spinners
                    ctx.arc(spinnerArray[0].pointA.x, spinnerArray[0].pointA.y, 9, 0, 2 * Math.PI);
                    for (let i = 0, len = spinnerArray.length; i < len; i++) {
                        ctx.moveTo(spinnerArray[i].pointA.x, spinnerArray[i].pointA.y)
                        ctx.arc(spinnerArray[i].pointA.x, spinnerArray[i].pointA.y, 9, 0, 2 * Math.PI);
                    }
                    ctx.fill();
                    //shadow
                    ctx.fillStyle = "rgba(0,10,30,0.1)"
                    ctx.fillRect(-1150, -3000, 600, 1025);
                    ctx.fillRect(450, -3100, 300, 275);
                    ctx.fillRect(450, -3625, 200, 225);
                    ctx.fillRect(400, -2775, 425, 450);
                    ctx.fillRect(250, -2300, 675, 300);
                    slime.query();
                    if (isWaterfallFilling) {
                        if (slime.height < 5500) {
                            //draw slime fill
                            ctx.fillStyle = `hsla(160, 100%, 43%,${0.3 + 0.07 * Math.random()})`
                            ctx.fillRect(waterFallX, -5050, waterFallWidth, 6175 - slime.height)
                            if (!m.isTimeDilated) {
                                waterFallWidth = 0.98 * waterFallWidth + 4.7 * Math.random()
                                waterFallSmoothX = 0.98 * waterFallSmoothX + 3.5 * Math.random()
                                waterFallX = 1857 - waterFallSmoothX
                                ctx.fillRect(waterFallX + waterFallWidth * Math.random(), -5050, 4, 6175 - slime.height)
                                //push player down if they go under waterfall
                                if (player.position.x > waterFallX && player.position.x < waterFallX + waterFallWidth && player.position.y < slime.height) {
                                    Matter.Body.setVelocity(player, {
                                        x: player.velocity.x,
                                        y: player.velocity.y + 2
                                    });
                                }
                            }
                            slime.levelRise(riseRate)
                        }
                    } else if (Vector.magnitudeSquared(Vector.sub(player.position, level.enter)) > 100000) {
                        isWaterfallFilling = true
                    }
                };
            } else { //not flipped
                spawn.mapVertex(1116, -2500, "0 0  300 0  150 600  0 600");
                spawn.mapVertex(584, -2500, "0 0  300 0  300 600  150 600");
                if (Math.random() < 0.1) {
                    spinnerArray.push(level.spinner(65, -300, 40, 450, 0.003, Math.PI / 2))
                } else if (Math.random() < 0.25) {
                    spinnerArray.push(level.spinner(65, -500, 40, 500, 0.003, 0, 0, -0.015)) //    spinner(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0) {
                    const r = 250
                    const hexagon = `${r} 0   ${r * Math.cos(5.236)} ${r * Math.sin(5.236)}    ${r * Math.cos(4.189)} ${r * Math.sin(4.189)}     ${-r} 0     ${r * Math.cos(2.0944)} ${r * Math.sin(2.0944)}      ${r * Math.cos(1.0472)} ${r * Math.sin(1.0472)}  `
                    Matter.Body.setVertices(spinnerArray[spinnerArray.length - 1].bodyB, Vertices.fromPath(hexagon))
                } else {
                    const W = 410;
                    const H = 30;
                    spawn.bodyRect(-120, -75, W, H, 1, spawn.propsIsNotHoldable)
                    let b = body[body.length - 1];
                    cons[cons.length] = Constraint.create({
                        pointA: {
                            x: b.position.x - (W / 2) + 50 - 211,
                            y: b.position.y - 1825
                        },
                        bodyB: b,
                        pointB: {
                            x: -(W / 2) + 50,
                            y: 0
                        },
                        damping: 0.01,
                        stiffness: 0.002,
                        length: 1800
                    });
                    cons[cons.length] = Constraint.create({
                        pointA: {
                            x: b.position.x + (W / 2) - 50 + 211,
                            y: b.position.y - 1825
                        },
                        bodyB: b,
                        pointB: {
                            x: (W / 2) - 50,
                            y: 0
                        },
                        damping: 0.01,
                        stiffness: 0.002,
                        length: 1800
                    });
                    Composite.add(engine.world, [cons[cons.length - 1], cons[cons.length - 2]])
                }

                spinnerArray.push(level.spinner(50, -3325, 45, 600, 0.003, 0, 0, 0.01)) //    spinner(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0) {
                if (Math.random() < 0.5) {
                    const r = 200
                    const hexagon = `${r} 0   ${r * Math.cos(5.236)} ${r * Math.sin(5.236)}    ${r * Math.cos(4.189)} ${r * Math.sin(4.189)}     ${-r} 0     ${r * Math.cos(2.0944)} ${r * Math.sin(2.0944)}      ${r * Math.cos(1.0472)} ${r * Math.sin(1.0472)}  `
                    Matter.Body.setVertices(spinnerArray[spinnerArray.length - 1].bodyB, Vertices.fromPath(hexagon))
                }

                const boost1 = level.boost(800, -2000, 790)

                level.custom = () => {
                    ctx.fillStyle = "#c0c3c9"
                    ctx.fillRect(-1470, -1975, 2, 1915) //elevator track
                    ctx.fillRect(1276, -4460, 2, 1425) //elevator track
                    ctx.fillRect(-1250, -3825, 25, 1850); //small pillar background
                    ctx.fillStyle = "#d0d4d6"
                    ctx.fillRect(-1100, -1925, 825, 2925) //large pillar background
                    ctx.fillRect(450, -1925, 825, 2925) //large pillar background
                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(1475, -4900, 525, 425)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };

                level.customTopLayer = () => {
                    boost1.query();
                    elevator1.move();
                    elevator2.move();

                    ctx.fillStyle = "#233"
                    ctx.beginPath(); //central dot on spinners
                    ctx.arc(spinnerArray[0].pointA.x, spinnerArray[0].pointA.y, 9, 0, 2 * Math.PI);
                    for (let i = 0, len = spinnerArray.length; i < len; i++) {
                        ctx.moveTo(spinnerArray[i].pointA.x, spinnerArray[i].pointA.y)
                        ctx.arc(spinnerArray[i].pointA.x, spinnerArray[i].pointA.y, 9, 0, 2 * Math.PI);
                    }
                    ctx.fill();
                    //shadow
                    ctx.fillStyle = "rgba(0,10,30,0.1)"
                    ctx.fillRect(550, -3000, 600, 1025);
                    ctx.fillRect(-750, -3100, 300, 275);
                    ctx.fillRect(-650, -3625, 200, 225);
                    ctx.fillRect(-825, -2775, 425, 450);
                    ctx.fillRect(-925, -2300, 675, 300);

                    slime.query();
                    if (isWaterfallFilling) {
                        if (slime.height < 5500) {
                            //draw slime fill
                            ctx.fillStyle = `hsla(160, 100%, 43%,${0.3 + 0.07 * Math.random()})`
                            ctx.fillRect(waterFallX, -5050, waterFallWidth, 6175 - slime.height)
                            if (!m.isTimeDilated) {
                                waterFallWidth = 0.98 * waterFallWidth + 4.7 * Math.random()
                                waterFallSmoothX = 0.98 * waterFallSmoothX + 3.5 * Math.random()
                                waterFallX = waterFallSmoothX - 1985
                                ctx.fillRect(waterFallX + waterFallWidth * Math.random(), -5050, 4, 6175 - slime.height)
                                //push player down if they go under waterfall
                                if (player.position.x > waterFallX && player.position.x < waterFallX + waterFallWidth && player.position.y < slime.height) {
                                    Matter.Body.setVelocity(player, {
                                        x: player.velocity.x,
                                        y: player.velocity.y + 2
                                    });
                                }
                            }
                            slime.levelRise(riseRate)
                        }
                    } else if (Vector.magnitudeSquared(Vector.sub(player.position, level.enter)) > 100000) {
                        isWaterfallFilling = true
                    }
                };
            }
        },
        reactor() {
            // if (simulation.isHorizontalFlipped) {
            //     level.announceText(650, -710, true)
            // } else {
            // }
            level.announceText(-550, -725, true)
            level.exit.x = 3500;
            level.exit.y = -42;
            spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 25);
            level.defaultZoom = 2000
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#c3d6df" //"#d8dadf";
            color.map = "#303639";
            // powerUps.spawnStartingPowerUps(1475, -1175);
            // spawn.debris(750, -2200, 3700, 16); //16 debris per level

            spawn.bodyRect(250, -70, 100, 70, 1);
            spawn.mapRect(-425, 0, 4500, 2100);
            spawn.mapRect(-475, -2825, 4500, 1025);
            // spawn.mapRect(1200, -1300, 600, 800);
            const a = 400 //side length
            const c = 100 //corner offset
            spawn.mapVertex(1487, -900, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off
            //entrance
            spawn.mapRect(-2025, -2825, 1250, 4925);
            spawn.mapRect(-900, -2825, 1125, 1725);
            spawn.mapRect(-900, -750, 1125, 2850);
            spawn.mapRect(-325, -1250, 550, 300);
            //exit
            spawn.mapRect(3800, -2825, 1225, 4925);
            spawn.mapRect(2750, -2150, 1325, 1775);
            spawn.mapRect(2750, -475, 550, 300);
            spawn.mapRect(2750, -7, 1050, 150); //exit room floor

            const doorIn = level.door(-313, -950, 525, 200, 190, 2) //x, y, width, height, distance, speed = 1
            const doorOut = level.door(2762, -175, 525, 200, 190, 2) //x, y, width, height, distance, speed = 1
            doorIn.collisionFilter.category = cat.map;
            doorOut.collisionFilter.category = cat.map; // to prevent boson composite from letting the player skip the level
            // doorOut.isClosing = true
            let isDoorsLocked = false
            let isFightOver = false
            let isSpawnedBoss = false

            level.setPosToSpawn(-550, -800); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

            const button = level.button(1400, 0)
            button.isUp = true

            level.custom = () => {
                //check for out of bounds mobs
                if (!(simulation.cycle % 180)) {
                    for (let i = 0; i < mob.length; i++) {
                        if ((mob[i].position.x < 0 || mob[i].position.x > 3000 || mob[i].position.y < -2000 || mob[i].position.y > 150) && !mob[i].isDarkMatter) {
                            Matter.Body.setPosition(mob[i], {
                                x: 1500 + 400 * (Math.random() - 0.5),
                                y: -1500 + 200 * (Math.random() - 0.5)
                            });
                        }
                    }
                }


                if (isDoorsLocked) {
                    if (player.position.x < -300) { //if player gets trapped inside starting room open up again
                        isDoorsLocked = false
                        doorIn.isClosing = false
                    }
                }
                doorIn.openClose();
                doorOut.openClose();
                ctx.fillStyle = "#d5ebef"
                ctx.fillRect(2750, -375, 1050, 375)
                level.enter.draw();
                level.exit.drawAndCheck();
                button.draw();
                if (button.isUp) {
                    button.query();
                } else if (!isSpawnedBoss) {
                    if (player.position.x > 0) {
                        if (!doorOut.isClosed() || !doorIn.isClosed()) {
                            doorIn.isClosing = true
                            doorOut.isClosing = true
                            //block caught in a door
                            if (Matter.Query.collides(doorOut, body).length > 1 || Matter.Query.collides(doorIn, body).length > 1) {
                                button.isUp = true
                                doorIn.isClosing = false
                                doorOut.isClosing = false
                            }
                        } else {
                            isSpawnedBoss = true
                            isDoorsLocked = true
                            for (let i = 0; i < 9; ++i) powerUps.spawn(1200 + 550 * Math.random(), -1700, "ammo")
                            for (let i = 0; i < 3; ++i) powerUps.spawn(1200 + 550 * Math.random(), -1700, "heal");
                            if (simulation.difficultyMode > 4) for (let i = 0; i < 8; i++) powerUps.spawn(1200 + 550 * Math.random(), -1700, "ammo"); //extra ammo on why difficulty
                            if (mobs.mobDeaths < level.levelsCleared && !simulation.isCheating) {
                                for (let i = 0; i < 250; i++) spawn.starter(300 + 2400 * Math.random(), -1300 - 500 * Math.random())
                            } else {
                                const count = Math.ceil(Math.pow(simulation.difficultyMode, 0.6))
                                if (Math.random() < 0.2) {
                                    // spawn.timeBoss(1487 + 200 * 0, -1525, 60, false);
                                    spawn.sprayBoss(1487 + 200 * 0, -1525, 30, false)
                                    if (count > 1) spawn.bounceBoss(1300 + 200 * 1, -1525, 80, false);
                                    if (count > 2) spawn.mineBoss(1300 + 200 * 2, -1525, 50, false);
                                    if (count > 3) spawn.laserScanBoss(1300 + 200 * 3, -1525, 50, false);
                                } else {
                                    if (Math.random() < 0.125) {
                                        for (let i = 0, len = count; i < len; ++i)spawn.laserScanBoss(1300 + 200 * i, -1525, 50, false);
                                    } else if (Math.random() < 0.25) {
                                        for (let i = 0, len = count; i < len; ++i)spawn.timeBoss(1300 + 200 * i, -1525, 80, false);
                                    } else if (Math.random() < 0.33) {
                                        for (let i = 0, len = count; i < len; ++i)spawn.bounceBoss(1300 + 200 * i, -1525, 80, false);
                                    } else if (Math.random() < 0.5) {
                                        for (let i = 0, len = count; i < len; ++i)spawn.sprayBoss(1300 + 200 * i, -1525, 30, false)
                                    } else {
                                        for (let i = 0, len = count; i < len; ++i)spawn.mineBoss(1300 + 200 * i, -1525, 50, false);
                                    }
                                }
                            }
                        }
                    } else {
                        doorIn.isClosing = false
                    }
                } else if (!isFightOver && !(simulation.cycle % 180)) {
                    let isFoundBoss = false
                    for (let i = 0; i < mob.length; i++) {
                        if (mob[i].isBoss) {
                            isFoundBoss = true
                            break
                        }
                    }
                    if (!isFoundBoss) {
                        isFightOver = true
                        doorIn.isClosing = false
                        doorOut.isClosing = false
                        // powerUps.spawnBossPowerUp(3600, -100)
                        powerUps.spawn(3650, -50, "tech")
                        powerUps.spawn(3650, -150, "tech")
                        powerUps.spawn(3650, -300, "tech")
                        // if (player.position.x < 2760 && player.position.x > 210) {}
                    }
                }
            };

            level.customTopLayer = () => {
                doorIn.draw();
                doorOut.draw();
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(-775, -1100, 1000, 350);
            };
            // }
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        chute() {
            level.announceMobTypes()
            level.announceText(905, 1513, true)
            level.setPosToSpawn(900, 1447);
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = -2610
            level.exit.y = -1617
            level.defaultZoom = 2500
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#c3c5c8" //"#d6d2d1"//"#d0d5d5";//"#dcdcde"
            color.map = "#444647"
            level.fallMode = "position"; //must set level.fallModeBounds in this mode to prevent player getting stuck left or right
            level.fallModeBounds = { left: -2700, right: 2800 } //used with level.fallMode = "position";

            const lasers = []
            //entrance laser
            lasers.push(level.laser({ x: 550, y: 1227 }, { x: 550, y: 1496 }))
            lasers[lasers.length - 1].oscillate = function () {
                const angle = Math.PI / 2 + 0.3 * Math.sin(simulation.cycle * 0.02) //wiggle from -80 to -100 degrees down
                this.look = { x: this.position.x + 300 * Math.cos(angle), y: this.position.y + 300 * Math.sin(angle) }
            }

            //laser angle rotates 180 degrees down
            lasers.push(level.laser({ x: 1700, y: -647 }, { x: 1700, y: -647 })) //oscillating laser
            lasers[lasers.length - 1].oscillate = function () {
                const angle = Math.PI / 2 + 0.98 * Math.sin(simulation.cycle * 0.005) //oscillate around down
                this.look = { x: this.position.x + 1500 * Math.cos(angle), y: this.position.y + 1500 * Math.sin(angle) }
            }

            // laser angle rotates from down to 30 degrees down-right
            // lasers.push(level.laser({ x: 552, y: -2595 }, { x: 552, y: -2595 })) //oscillating laser
            // lasers[lasers.length - 1].oscillate = function () {
            //     const angle = Math.PI / 3 + Math.PI / 6 * Math.cos(simulation.cycle * 0.01)
            //     this.look = { x: this.position.x + 2500 * Math.cos(angle), y: this.position.y + 2500 * Math.sin(angle) }
            // }

            //laser angle rotates from -15.5 to -56.5 degrees down-right
            lasers.push(level.laser({ x: -2877, y: -1367 }, { x: -2860, y: -1367 })) //oscillating laser
            lasers[lasers.length - 1].oscillate = function () {
                const angle = (43 - 26 * Math.cos(simulation.cycle * 0.005)) * Math.PI / 180
                this.look = { x: this.position.x + 3000 * Math.cos(angle), y: this.position.y + 3000 * Math.sin(angle) }
            }

            const oscillationPeriod = 1000
            const movingLaserRigs = []
            function addMovingLaserRig(pathStart, pathEnd, laserLength, phaseOffset = 0) {
                const emitterRadius = 30
                const emitterDiameter = emitterRadius * 2
                const laserClearance = 0.5
                const endSlack = 12
                const pathVector = Vector.sub(pathEnd, pathStart)
                const pathLength = Vector.magnitude(pathVector)
                const pathDirection = Vector.normalise(pathVector)
                const minConstraintLength = endSlack
                const maxConstraintLength = pathLength - emitterDiameter - endSlack
                const phase = ((simulation.cycle + phaseOffset) % oscillationPeriod) / oscillationPeriod
                const progress = 1 - Math.abs(2 * phase - 1)
                const initialLeftLength = minConstraintLength + (maxConstraintLength - minConstraintLength) * progress
                const initialRightLength = minConstraintLength + (maxConstraintLength - minConstraintLength) * (1 - progress)
                const emitterCenter = Vector.add(pathStart, Vector.mult(pathDirection, emitterRadius + initialLeftLength))

                const emitter = body[body.length] = Bodies.circle(emitterCenter.x, emitterCenter.y, emitterRadius, {
                    density: 0.0005,
                    friction: 1,
                    frictionStatic: 1,
                    frictionAir: 0,
                    restitution: 0.5,
                    isNotHoldable: true,
                })
                emitter.collisionFilter.category = cat.body
                emitter.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                Composite.add(engine.world, emitter)
                emitter.classType = "body"

                const stiffness = 0.08
                const damping = 0.003
                const leftConstraint = cons[cons.length] = Constraint.create({
                    pointA: pathStart,
                    pointB: {
                        x: -emitterRadius * pathDirection.x,
                        y: -emitterRadius * pathDirection.y,
                    },
                    bodyB: emitter,
                    length: initialLeftLength,
                    stiffness: stiffness,
                    damping: damping,
                })
                Composite.add(engine.world, leftConstraint)
                const rightConstraint = cons[cons.length] = Constraint.create({
                    pointA: pathEnd,
                    pointB: {
                        x: emitterRadius * pathDirection.x,
                        y: emitterRadius * pathDirection.y,
                    },
                    bodyB: emitter,
                    length: initialRightLength,
                    stiffness: stiffness,
                    damping: damping,
                })
                Composite.add(engine.world, rightConstraint)

                const laser = level.laser({ x: 0, y: 0 }, { x: 0, y: 0 })
                function updateLaserPosition() {
                    const laserAngle = Math.PI / 2 + emitter.angle
                    const direction = { x: Math.cos(laserAngle), y: Math.sin(laserAngle) }
                    const nozzleDistance = emitterRadius + laserClearance
                    laser.position.x = emitter.position.x + nozzleDistance * direction.x
                    laser.position.y = emitter.position.y + nozzleDistance * direction.y
                    laser.look.x = laser.position.x + laserLength * direction.x
                    laser.look.y = laser.position.y + laserLength * direction.y
                }
                updateLaserPosition()
                laser.emitterBody = emitter
                laser.oscillate = function () {
                    const phase = ((simulation.cycle + phaseOffset) % oscillationPeriod) / oscillationPeriod
                    const progress = 1 - Math.abs(2 * phase - 1) // 0 → 1 → 0
                    leftConstraint.length = minConstraintLength + (maxConstraintLength - minConstraintLength) * progress
                    rightConstraint.length = minConstraintLength + (maxConstraintLength - minConstraintLength) * (1 - progress)
                    updateLaserPosition()
                }
                movingLaserRigs.push({ emitter, leftConstraint, rightConstraint })
                lasers.push(laser)
            }

            //vertical laser on a physics-driven block that follows a diagonal path
            const laserPathStart = { x: -2224, y: -2097 }
            const laserPathEnd = { x: -550, y: -2620 }
            const laserPathLength = 1200
            addMovingLaserRig(laserPathStart, laserPathEnd, laserPathLength)

            //vertical laser on a physics-driven block that follows the right diagonal path
            const rightLaserPathStart = { x: 552, y: -2620 }
            const rightLaserPathEnd = { x: 2199, y: -2120 }
            const rightLaserPathLength = 2000
            addMovingLaserRig(rightLaserPathStart, rightLaserPathEnd, rightLaserPathLength, oscillationPeriod / 2)

            const boosts = [
                // level.boost(-2500, 100, 1350, 1.2), //60 degrees up-right
                level.boost(2210, -2145, 1400, 2), //centered near 2306 on the roof, 45 degrees up-left
                level.boost(2984, -271, 1650, 1.69), //slightly left, lands near 2570, -1858
            ]

            const wind = []
            wind.push(level.wind(-350, -2425, 175, 4475, { x: 0, y: 0.001 }))//vertical left column
            wind.push(level.wind(175, -2425, 175, 4825, { x: 0, y: -0.001 }, true))//vertical right column
            wind.push(level.wind(-350, 2050, 700, 400, { x: 0.005, y: 0 }, true))//bottom right
            wind.push(level.wind(-375, -2450, 750, 375, { x: -0.002, y: 0 }))//top left


            const windDir = [
                { x: 260, y: -1192, direction: -Math.PI / 2 },
                { x: 260, y: 750, direction: -Math.PI / 2 },
                { x: -260, y: -1125, direction: Math.PI / 2 },
                { x: -260, y: 827, direction: Math.PI / 2 },
            ]
            function drawWindDirArrows() {
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < windDir.length; i++) {
                    ctx.save();
                    ctx.translate(windDir[i].x, windDir[i].y);
                    ctx.rotate(windDir[i].direction);
                    for (let j = 0; j < 2; j++) {
                        const x = -80 + 80 * j;
                        ctx.moveTo(x - 24, -40);
                        ctx.lineTo(x + 24, 0);
                        ctx.lineTo(x - 24, 40);
                    }
                    ctx.restore();
                }
                ctx.strokeStyle = "rgb(164, 179, 201)";
                ctx.lineWidth = 12;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();
                ctx.restore();
            }
            level.custom = () => {
                for (let i = 0; i < boosts.length; i++) boosts[i].query()

                drawWindDirArrows();
                //diagonal laser paths
                // ctx.beginPath()
                // ctx.moveTo(laserPathStart.x, laserPathStart.y)
                // ctx.lineTo(laserPathEnd.x, laserPathEnd.y)
                // ctx.moveTo(rightLaserPathStart.x, rightLaserPathStart.y)
                // ctx.lineTo(rightLaserPathEnd.x, rightLaserPathEnd.y)
                // ctx.strokeStyle = "#a7a7a7"
                // ctx.lineWidth = 4
                // ctx.stroke()

                //draw the two working constraints on each laser-source block
                ctx.beginPath()
                for (let i = 0; i < movingLaserRigs.length; i++) {
                    const rig = movingLaserRigs[i]
                    const leftPoint = Vector.add(rig.emitter.position, Vector.rotate(rig.leftConstraint.pointB, rig.emitter.angle))
                    const rightPoint = Vector.add(rig.emitter.position, Vector.rotate(rig.rightConstraint.pointB, rig.emitter.angle))
                    ctx.moveTo(rig.leftConstraint.pointA.x, rig.leftConstraint.pointA.y)
                    ctx.lineTo(leftPoint.x, leftPoint.y)
                    ctx.moveTo(rig.rightConstraint.pointA.x, rig.rightConstraint.pointA.y)
                    ctx.lineTo(rightPoint.x, rightPoint.y)
                }
                ctx.strokeStyle = "rgba(0,0,0,0.25)"
                ctx.lineWidth = 2
                ctx.stroke()

                // for (let i = 0; i < lasers.length; i++) {
                for (let i = 0; i < lasers.length; i++) {
                    lasers[i].oscillate()
                    lasers[i].motionQuery()
                }
                //laser emitters
                ctx.fillStyle = color.map //"#999"
                ctx.beginPath()
                for (let i = 0; i < lasers.length; i++) {
                    if (!lasers[i].emitterBody) {
                        ctx.moveTo(lasers[i].position.x + 25, lasers[i].position.y)
                        ctx.arc(lasers[i].position.x, lasers[i].position.y, 25, 0, 2 * Math.PI)
                    }
                }
                ctx.fill()

                //exit room
                ctx.fillStyle = "#d5ebef"
                ctx.fillRect(-2800, -2000, 575, 450)
                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                if (!m.isTimeDilated) {
                    for (let i = 0; i < wind.length; i++) wind[i].do()
                }

                //wind glow
                // ctx.fillStyle = "rgba(0,0,155,0.05)"
                // ctx.fillRect(-350, -2450, 700, 4875);

                //shadows
                ctx.fillStyle = "rgba(0,0,0,0.07)"
                ctx.beginPath()
                ctx.rect(-525, -2550, 1050, 4975)
                ctx.rect(525, 1200, 535, 325)
                // ctx.rect(525, -675, 2250, 875)
                ctx.fill()
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.beginPath()
                ctx.rect(1860, -990, 780, 140)
                ctx.rect(2200, -1525, 450, 325)
                ctx.rect(2225, -2075, 275, 250)
                ctx.rect(-1900, -110, 800, 320)
                ctx.rect(1490, 55, 420, 120)
                ctx.rect(-1129.5, -920, 325, 220)
                ctx.rect(-1412, -1700, 425, 150);

                ctx.fill()
                // ctx.fillRect(2225, -2075, 250, 250);
                // ctx.fillRect(2225, -1525, 400, 325);
                // ctx.fillRect(2125, -1000, 550, 175);



                //exit room glow
                // ctx.fillStyle = "rgba(0,255,255,0.05)"
                // ctx.fillRect(4005, 1975, 725, 400);
            };

            //center column
            // spawn.bodyRectCorner(0, -1150, 350, 2000, 100, [true, false, false, true]); //top with gap
            // spawn.bodyRectCorner(0, 1150, 350, 2000, 100, [false, true, true, false]); //bottom with gap
            if (Math.random() > 0.5) {
                spawn.bodyRectCorner(0, 0, 350, 4325, 100); // unbroken center column:
            } else {
                spawn.bodyRectCorner(0, -1193.75, 350, 1937.5, 100, [true, false, false, true]); //above gap
                spawn.bodyRectCorner(0, 1181.25, 350, 1962.5, 100, [false, true, true, false]); //below gap
            }

            //bottom turn around in wind elevator
            spawn.mapRect(-550, 2400, 1100, 200);//horizontal base
            spawn.mapVertex(-350, 2400, "-200 -200  200 200  -200 200");  //triangle bottom left
            spawn.mapVertex(350, 2400, "200 -200  -200 200  200 200");  //triangle bottom right

            //top turn around in wind elevator
            spawn.mapRect(-550, -2625, 1050, 200);//horizontal top
            spawn.mapVertex(-350, -2400, "-200 200  200 -200  -200 -200");  //triangle bottom left
            spawn.mapVertex(350, -2400, "200 200  -200 -200  200 -200");  //triangle bottom right

            //vertical wind elevator side walls
            //left walls
            spawn.bodyRectCorner(-453, -2200, 200, 700, 100, [false, true, false, false]);
            spawn.bodyRectCorner(-453, -1275, 200, 550, 100, [false, true, false, false]);
            spawn.bodyRectCorner(-453, -425, 200, 500, 100, [false, true, false, false]);
            spawn.mapRect(-550, 125, 200, 2425);

            //right walls
            spawn.mapRect(350, -2625, 200, 600);
            spawn.mapRect(350, -1625, 200, 475);
            spawn.mapRect(350, -675, 200, 575);
            spawn.mapRect(350, 325, 200, 900);
            spawn.mapRect(350, 1650, 200, 900);

            //floor 1 entrance
            spawn.bodyRectCorner(812, 1600, 900, 200, 200, [false, false, false, true]); // topRight: false, bottomRight: true, bottomLeft: true, topLeft: false
            spawn.mapRect(525, 1025, 725, 200);
            spawn.mapRect(1050, 1025, 200, 673);

            // floor 2
            //left
            spawn.mapRect(-2550, 125, 2200, 200);
            // spawn.mapVertex(-1775, 100, "625 0   75 0   200 -100   500 -100"); //ramp
            spawn.bodyRectCorner(-1500, -180, 925, 270, 60);
            spawn.mapRect(-1962.5, 115, 925, 100);
            spawn.mapRect(-2550, -200, 225, 525);




            //right
            spawn.bodyRectCorner(1650, 275, 2575, 200, 200, [false, false, false, true]);
            // spawn.mapRect(350, -250, 500, 150);
            // spawn.mapRect(2525, -250, 400, 150);
            spawn.mapRect(2525, -250, 590, 150);
            spawn.mapRect(2775, -150, 150, 350);

            spawn.mapVertex(2350, 180, "625 0   75 0   200 -100   500 -100"); //ramp
            spawn.mapVertex(1050, 180, "625 0   75 0   200 -100   500 -100"); //ramp
            spawn.bodyRectCorner(1700, -35, 525, 200, 50); // topRight: false, bottomRight: true, bottomLeft: true, topLeft: false
            spawn.mapRect(1437.5, 165, 525, 100);

            //floor 3
            //right
            spawn.bodyRectCorner(1587.4, -750, 2450, 200, 200, [false, false, false, true]);
            spawn.bodyRectCorner(2250, -1117, 900, 300, 60); //lowest
            spawn.mapRect(1800, -860, 900, 100);
            spawn.mapRect(2200, -1850, 450, 350);
            spawn.mapRect(2200, -2125, 300, 75);
            spawn.mapRect(2200, -2075, 75, 275);
            spawn.mapRect(875, -862, 725, 75);
            spawn.mapRect(925, -874, 625, 75);

            //tower connecting 2 and 3 on right
            // spawn.mapRect(2950, -550, 250, 25);
            // spawn.mapRect(2950, -1050, 250, 25);
            // spawn.mapRect(2950, -1550, 250, 25);
            // spawn.mapRect(2950, -2050, 250, 25);

            //left
            spawn.mapRect(-1475, -700, 1125, 200);
            spawn.bodyRectCorner(-967, -1000, 425, 250, 50);
            spawn.mapRect(-1179.5, -710, 425, 100);

            //floor 4
            //right
            spawn.bodyRectCorner(762, -1650, 800, 200, 200, [false, false, false, true]);
            //left
            spawn.bodyRectCorner(-1200, -1840, 525, 300, 50);
            spawn.mapRect(-1462.5, -1585, 525, 100);

            spawn.mapRect(-2825, -1585, 600, 50);//exit room floor
            spawn.mapRect(-2900, -2100, 675, 100); //exit room ceiling
            spawn.mapRect(-2900, -2100, 100, 550); //exit room left wall
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20); //exit door step
            spawn.mapRect(-2325, -2100, 100, 325);
            spawn.mapRect(-2900, -1575, 2550, 200);

            //blocks
            //blocks in wind tunnels
            spawn.bodyRect(258, -760, 30, 40, 0.5)
            spawn.bodyRect(-298, 150, 50, 60, 0.5)
            spawn.bodyRect(-250, -1683, 20, 80, 0.5)
            spawn.bodyRect(258, -760, 40, 75, 0.5)
            spawn.bodyRect(-298, 150, 75, 75, 0.5)
            spawn.bodyRect(-250, -1683, 25, 100, 0.5)

            //mobs
            spawn.randomMobPositions = [
                [-1000, -25],
                [-1825, -325],
                [-2275, 100],
                [725, -350],
                [1625, -275],
                [2775, -425],
                [2425, -1400],
                [2400, -1975],
                [975, -1975],
                [-1225, -2200],
                [-1825, -1725],
                [-2425, -2200],
                [-800, -1700],
                [750, 50],
                [2300, -50],
                [3025, -1150],
                [700, -1425],
                [-1550, -1700],
                [-775, -1750],
                [-1075, -875]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            //bosses
            if (Math.random() < 0.33) {
                spawn.randomLevelBoss(1670, Math.random() < 0.3 ? -450 : -1678);
            } else if (Math.random() < 0.5) {
                spawn.randomLevelBoss(-2217, -629);
            } else {
                spawn.secondaryBossChance(-1145, -2217);
            }
            if (Math.random() < 0.33) {
                spawn.secondaryBossChance(837, -1978);
            } else if (Math.random() < 0.5) {
                spawn.secondaryBossChance(-1840, -1859);
            } else {
                spawn.secondaryBossChance(845, -1246);
            }

            powerUps.chooseRandomPowerUp(-288, -776);
            powerUps.chooseRandomPowerUp(245, -1356);
            powerUps.chooseRandomPowerUp(261, 964);
            powerUps.chooseRandomPowerUp(-243, 1645);
            powerUps.chooseRandomPowerUp(150, 2221);
            powerUps.chooseRandomPowerUp(140, -2000);
            powerUps.chooseRandomPowerUp(-149, -2000);
            powerUps.spawnStartingPowerUps(255, 78)
            if (Math.random() < 0.5) powerUps.chooseRandomPowerUp(50, -2682);
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        HVAC() {
            level.announceMobTypes()
            level.announceText(-4000, -900, true)
            level.setPosToSpawn(-4000, -975);
            // level.setPosToSpawn(3944, 501); //for testing and building far right spawn

            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = 4225
            level.exit.y = 2320
            level.defaultZoom = 2000
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#c3c5c8" //"#d6d2d1"//"#d0d5d5";
            color.map = "#444647"

            const spinnerArray = []
            spinnerArray.push(level.spinner(-100, -775, 30, 600, 0.001, Math.PI / 2)) //spinner(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0) {
            // spinnerArray.push(level.spinner(-100, 200, 50, 700))

            const fizzlers = []
            fizzlers.push(level.fizzler({ x: 4025, y: 1966 }, { x: 4025, y: 2382 }))

            let buttons = []
            buttons.push(level.button(-140, 480, 126, true, false, "hsl(330, 100%, 50%)"))
            buttons.push(level.button(4500, 2340, 126, true, false, "hsl(330, 100%, 50%)"))
            buttons.push(level.button(4325, -1916, 126, true, false, "hsl(141, 100%, 38%)"))
            buttons[0].isUp = true
            buttons[1].isUp = true

            const shadowRegions = [
                { x: -1900, y: -375, width: 1400, height: 775, fade: 0 },
                { x: 350, y: -375, width: 2000, height: 775, fade: 0 },
                { x: 2967, y: -744, width: 725, height: 1150, fade: 0 }
            ]
            const drawShadowRegion = (region) => {
                const isInside = m.pos.x > region.x && m.pos.x < region.x + region.width && m.pos.y > region.y && m.pos.y < region.y + region.height
                region.fade = Math.max(0, Math.min(30, region.fade + (isInside ? 1 : -1)))
                const coverAlpha = 1 - region.fade / 35 //35 so it doesn't fade all the way out
                if (coverAlpha > 0) {
                    ctx.save()
                    ctx.globalAlpha = coverAlpha
                    ctx.fillStyle = color.map
                    ctx.fillRect(region.x, region.y, region.width, region.height)
                    ctx.restore()
                }
            }
            let pushBlocksAway = function (button) {
                //push away blocks near button
                for (let i = body.length - 1; i > -1; i--) {
                    if (!body[i].isNotHoldable) {
                        sub = Vector.sub({ x: button.min.x + button.width / 2, y: button.min.y }, body[i].position);
                        dist = Vector.magnitude(sub);
                        if (dist < 300) {
                            knock = Vector.mult(Vector.normalise(sub), -0.1 * body[i].mass);
                            body[i].force.x += knock.x + 0.1 * (Math.random() - 0.5);
                            body[i].force.y += knock.y;
                        }
                    }
                }
            }

            const wind = []
            const startingDrawIndex = 3 //if adding new wind update wind[2].isFloat  and other hard index
            wind.push(level.wind(2250, 750, 275, 250, { x: 0, y: -0.005 }))//vertical not drawn //middle in right junction merge
            wind.push(level.wind(-600, -525, 1050, 1525, { x: 0, y: -0.0007 }))//vertical central area
            //left
            wind.push(level.wind(-2675, 550, 275, 225, { x: 0.02, y: -0.007 })) //corner not drawn
            wind.push(level.wind(-2650, -500, 250, 1050, { x: 0, y: 0.007 })) //vertical
            wind.push(level.wind(-2650, 550, 2050, 225, { x: 0.007, y: 0 }, true)) //horizontal
            //right
            wind.push(level.wind(450, 500, 3000, 525, { x: -0.007, y: 0 }, true)) //horizontal
            wind.push(level.wind(2350, -500, 150, 1000, { x: 0, y: 0.007 }, true))//vertical
            //far right
            wind.push(level.wind(4450, -1900, 300, 2925, { x: -0.001, y: 0.007 }, true))//vertical
            // wind.push(level.wind(4450, 825, 145, 175, { x: -0.01, y: 0 }))//horizontal
            wind.push(level.wind(3881, 1150, 125, 1200, { x: 0, y: 0.007 }, true))//vertical

            const windDir = [
                { x: -2575, y: -70, direction: Math.PI / 2 },
                { x: -1540, y: 670, direction: 0 },
                { x: 1200, y: 670, direction: Math.PI },
                { x: 2960, y: 920, direction: Math.PI },
                { x: 2420, y: 40, direction: Math.PI / 2 },
                { x: 4660, y: 630, direction: Math.PI / 2 },
                { x: 4660, y: -1660, direction: Math.PI / 2 },
                { x: 3950, y: 1590, direction: Math.PI / 2 }
            ]
            function drawWindDirArrows() {
                ctx.save();
                ctx.beginPath();
                for (let i = 0; i < windDir.length; i++) {
                    ctx.save();
                    ctx.translate(windDir[i].x, windDir[i].y);
                    ctx.rotate(windDir[i].direction);
                    for (let j = 0; j < 2; j++) {
                        const x = -80 + 80 * j;
                        ctx.moveTo(x - 24, -40);
                        ctx.lineTo(x + 24, 0);
                        ctx.lineTo(x - 24, 40);
                    }
                    ctx.restore();
                }
                ctx.strokeStyle = "rgb(164, 179, 201)";
                ctx.lineWidth = 12;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.stroke();
                ctx.restore();
            }
            level.custom = () => {
                //one button going up makes the other go down, and flips wind directions
                if (buttons[0].isUp || buttons[1].isUp) {
                    buttons[0].query()
                    buttons[1].query()
                    if (!buttons[0].isUp || !buttons[1].isUp) {
                        pushBlocksAway(buttons[2])
                        buttons[0].isUp = false
                        buttons[1].isUp = false
                        buttons[2].isUp = true //flip the other button up
                        level.inGameText(-70, 525, 'exhaust', 180)
                        for (let i = 0; i < wind.length; i++) {
                            wind[i].velocity.x *= -1
                            wind[i].velocity.y *= -1
                        }
                        for (let i = 0; i < windDir.length; i++) windDir[i].direction += Math.PI;
                        wind[2].isFloat = true //vertical wind needs to flip float for good player movement
                        wind[4].velocity.y = -0.002
                    }
                } else if (buttons[2].isUp) {
                    buttons[2].query()
                    if (!buttons[2].isUp) {
                        pushBlocksAway(buttons[0])
                        buttons[0].isUp = true //flip the other buttons up
                        buttons[1].isUp = true //flip the other buttons up
                        level.inGameText(4390, -1880, 'intake', 180)
                        for (let i = 0; i < wind.length; i++) {
                            wind[i].velocity.x *= -1
                            wind[i].velocity.y *= -1
                        }
                        for (let i = 0; i < windDir.length; i++) windDir[i].direction += Math.PI;
                        wind[2].isFloat = false //vertical wind needs to flip float for good player movement
                        wind[4].velocity.y = -0.002
                    }
                }
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].draw()
                }
                drawWindDirArrows();
                //supports
                ctx.fillStyle = "#bdbfc3" //"#c3c5c8"
                ctx.fillRect(-2400, -1175, 350, 625);
                ctx.fillRect(-3100, -1150, 350, 575);
                //exit room
                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                for (let i = 0; i < fizzlers.length; i++) fizzlers[i].query();
                if (!m.isTimeDilated) {
                    for (let i = 0; i < wind.length; i++) wind[i].do()
                }
                for (let i = startingDrawIndex; i < wind.length; i++) wind[i].draw()


                ctx.fillStyle = "#233"
                ctx.beginPath(); //central dot on spinners
                ctx.arc(spinnerArray[0].pointA.x, spinnerArray[0].pointA.y, 9, 0, 2 * Math.PI);
                for (let i = 0, len = spinnerArray.length; i < len; i++) {
                    ctx.moveTo(spinnerArray[i].pointA.x, spinnerArray[i].pointA.y)
                    ctx.arc(spinnerArray[i].pointA.x, spinnerArray[i].pointA.y, 9, 0, 2 * Math.PI);
                }
                ctx.fill();
                //shadows
                ctx.fillStyle = "rgba(0,0,0,0.13)"
                ctx.fillRect(-4450, -1350, 825, 475);
                ctx.fillRect(-1900, -725, 300, 150);
                ctx.fillStyle = "rgba(0,0,0,0.07)"
                ctx.fillRect(-4400, -800, 850, 225);
                // ctx.fillRect(3872, 825, 150, 200);
                //hidden passages
                for (let i = 0; i < shadowRegions.length; i++) drawShadowRegion(shadowRegions[i])

                //exit room glow
                ctx.fillStyle = "rgba(0,255,255,0.05)"
                ctx.fillRect(4005, 1975, 725, 400);

            };

            //outline of map
            spawn.mapRect(-6000, -4800, 13000, 2000); //map ceiling
            spawn.mapRect(-6000, -2875, 1225, 2475);//left wall
            spawn.mapRect(4725, -2975, 2275, 4125);//right map wall
            spawn.mapVertex(-4325, 237.5, "-1675 -787.5  1575 -787.5  1675 -687.5  1675 887.5  -1675 887.5");//left upper floor
            // spawn.mapRect(-6000, 1000, 13000, 3000); //floor

            //floor and exit room
            spawn.mapRect(4725, 1000, 2275, 3000);
            spawn.mapRect(3825, 2350, 1000, 1650);
            spawn.mapRect(4225, 2340, 100, 50); //exit door step
            spawn.mapVertex(3885, 2360, "-200 -200  200 200  -200 200");  //triangle
            spawn.mapVertex(-1056, 2500, "-9665 2800  -9665 -200   0 -200    225 -50   225 2800  0 2800");//floor and tiny left ramp into exit
            spawn.mapVertex(4375, 1510, "0 0   500 0    500 1000   -225 1000   -225 150");

            //entrance
            spawn.mapVertex(-3975, -1400, "-475 75  -475 -25  -425 -75  425 -75  475 -25  475 75");         //top, rounded upper corners
            spawn.mapVertex(-3975, -850, "-475 -75  475 -75  475 25  425 75  -425 75  -475 25"); //bottom, rounded lower corners
            spawn.mapRect(-3650, -1400, 150, 525); //right wall
            spawn.mapVertex(-4750, -1100, "0 -200    150 -50   150 50  0 200");//ledge

            // spawn.bodyRectCorner(-2573, -1200, 1150, 175, 50);
            spawn.bodyRectCorner(-2922, -1200, 450, 175, 50);
            spawn.bodyRectCorner(-2228, -1200, 450, 175, 50);
            spawn.bodyRectCorner(-1757, -851, 400, 300, 50);

            spawn.mapVertex(-3300, -615, "-200 0   -100 -50   100 -50   200 0");//bump
            spawn.mapVertex(-1325, -615, "-200 0   -100 -50   100 -50   200 0");//bump
            spawn.mapVertex(861, -615, "-200 0   -100 -50   100 -50   200 0");//bump
            spawn.mapVertex(1652, -615, "-200 0   -100 -50   100 -50   200 0");//bump
            spawn.mapVertex(3440, -745, "-200 0   -100 -50   100 -50   200 0");//bump

            //central
            spawn.mapVertex(-2650, 950, "-200 -200  200 200  -200 200  -4500 200  -4500 -200");  //left
            spawn.mapVertex(1350, 950, "200 -200  -200 200  200 200  2400 200  2000 -200");  //right
            spawn.mapVertex(-2653, 743, "-200 -200  200 200  -200 200");  //triangle

            spawn.bodyRectCorner(-75, 600, 450, 225, 63);


            //left C
            // spawn.bodyRectCorner(-1490, -475, 2000, 250, 100, [false, false, false, true]);
            spawn.bodyRectCorner(-1500, -475, 2000, 250, 100, [true, false, false, true]);
            spawn.bodyRectCorner(-1500, 475, 2000, 250, 100, [false, true, true, false]);
            spawn.mapRect(-2500, -500, 650, 1000);

            spawn.bodyRectCorner(-563, -50, 125, 300, 35, {
                topRight: false,
                bottomRight: true,
                bottomLeft: true,
                topLeft: false
            });
            spawn.bodyRectCorner(-950, 0, 500, 125, 35);
            spawn.bodyRectCorner(-1400, 300, 400, 300, 50, [true, false, false, true]);

            //right backwards C
            spawn.bodyRectCorner(1350, -475, 2000, 250, 100, [true, false, false, true]);
            spawn.bodyRectCorner(1350, 475, 2000, 250, 100, [false, true, true, false]);
            spawn.mapRect(2200, -500, 150, 750);//hidden path

            spawn.bodyRectCorner(1650, 25, 400, 450, 80);
            spawn.bodyRectCorner(850, 25, 400, 450, 80);

            //far right L + ' square
            spawn.mapVertex(3092, 600, "600 300  600 500  350 750  -350 750  -600 500  -600 300"); //bottom
            // spawn.mapVertex(3092, 600, "600 300  600 500  350 750  -450 750  -600 600  -600 300"); //bottom
            spawn.mapVertex(2751, -90, "100 -750  100 500  -400 500  -400 -500  -150 -750"); //left
            spawn.mapVertex(3441, -328, "0 -750  0 0  -100 100   -400 100  -500 0  -500 -750"); //right
            spawn.mapVertex(3050, 250, "0 -200    150 -50   150 200  0 200");//ledge
            spawn.mapVertex(3200, -125, "0 -200    -150 -50   -150 50  0 200");//ledge
            spawn.mapVertex(2975, -450, "0 -200    150 -50   150 50  0 200");//ledge

            //far right vertical pipe
            // spawn.mapVertex(4400, -570, "0 1750  0 -1000  -400 -1000  -400 1500  -150 1750"); //left
            spawn.mapVertex(4403, -570, "-50 1750  0 1700   0 -1000  -400 -1000  -400 1500  -150 1750"); //left
            spawn.bodyRectCorner(3947, 700, 250, 250, 50);
            spawn.mapVertex(4680, 1025, "200 -200  -200 200  200 200");  //triangle

            //blocks
            spawn.bodyRect(-3350, -750, 100, 100, 0.4);
            spawn.bodyRect(-3725, -1525, 125, 50, 0.4);
            spawn.bodyRect(-2875, -1425, 75, 125, 0.4);
            spawn.bodyRect(-2400, -1350, 75, 50, 0.3);
            spawn.bodyRect(-1900, -1100, 50, 100, 0.3);
            spawn.bodyRect(-1375, -775, 75, 125, 0.3);
            spawn.bodyRect(-700, -700, 50, 100, 0.3);
            spawn.bodyRect(500, -750, 100, 150, 0.3);
            spawn.bodyRect(2050, -700, 100, 100, 0.3);
            spawn.bodyRect(3400, -850, 125, 75, 0.3);
            spawn.bodyRect(2900, -800, 325, 25, 0.4);
            spawn.bodyRect(2200, 250, 150, 100, 0.6);
            spawn.bodyRect(-725, 275, 125, 75, 0.4);
            spawn.bodyRect(-4750, -725, 225, 125, 0.5);

            //mobs
            spawn.randomMobPositions = [
                [-1800, -1100],
                [-1150, -725],
                [600, -725],
                [1975, -750],
                [3425, -875],
                [4250, -2025],
                [500, 200],
                [1400, -75],
                [850, -275],
                [-1025, 225],
                [-1425, -200],
                [-125, 925],
                [-125, 175],
                [-325, -275],
                [0, -300],
                [3350, 275],
                [3675, 925],
                [3900, 300],
                [4275, 875],
                [-2950, -1450],
                [-2275, -1425],
                [-2125, -700],
                [825, -750],
                [1575, -900],
                [2900, -800],
                [-875, -850],
                [-125, -725],
                [225, -800],
                [4225, -2200],
                [4550, -2300],
                [-1700, 25],
                [-1200, -200],
                [2050, -75],
                [2050, 150],
                [-325, -325],
                [-200, -75],
                [125, -75],
                [150, -300]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            if (Math.random() < 0.33) {
                spawn.randomLevelBoss(856, -995);
                spawn.secondaryBossChance(1618, -933);
            } else if (Math.random() < 0.5) {
                spawn.randomLevelBoss(3907, -935);
                spawn.secondaryBossChance(3242, -972);
            } else {
                spawn.randomLevelBoss(3944, 237);
                spawn.secondaryBossChance(-69, -63);
            }
            powerUps.spawnStartingPowerUps(Math.random() < 0.5 ? 1300 : -1750, 234)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
            powerUps.chooseRandomPowerUp(-1081, -155);
            powerUps.chooseRandomPowerUp(1649, -235);
            powerUps.chooseRandomPowerUp(3198, 266);
            powerUps.chooseRandomPowerUp(4507, -1973);
            powerUps.chooseRandomPowerUp(3945, 557);
        },
        towers() {
            level.announceMobTypes()
            const isFlippedHorizontal = (simulation.isHorizontalFlipped && Math.random() < 0.33) ? true : false
            if (isFlippedHorizontal) {
                level.setPosToSpawn(9150 + 50, -2230 - 25);
                level.exit.x = 400 - 50;
                level.exit.y = -50 + 25;
                leftRoomColor = "#cff"
                rightRoomColor = "rgba(0,0,0,0.13)"
            } else {
                level.setPosToSpawn(400, -50);
                level.exit.x = 9150;
                level.exit.y = -2230;
            }
            if (isFlippedHorizontal) {
                level.announceText(9200, -2170, true)
            } else {
                level.announceText(400, 50, true)
            }

            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20); //bump for level entrance
            level.fallMode = "position"; //must set level.fallModeBounds in this mode to prevent player getting stuck left or right
            level.fallModeBounds = { left: level.enter.x, right: level.exit.x } //used with level.fallMode = "position";
            if (isFlippedHorizontal) level.fallModeBounds = { left: level.exit.x, right: level.enter.x } //used with level.fallMode = "position";
            simulation.fallHeight = 5000 //level.enter.y - 4000
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20); //bump for level exit
            level.defaultZoom = 2300
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#cdd9df";
            powerUps.spawnStartingPowerUps(6300, 1025)

            const boost1 = level.boost(7560, 1480, 1700, 1.75)
            const boost2 = level.boost(7098, 0, 1250, Math.PI / 3)  //x,y,push,angle radians
            const boost3 = level.boost(9700, -730, 1050, 1.95)
            const boost4 = level.boost(4300, -720, 1500, 1.25)
            const boost5 = level.boost(3000, -1215, 3000, 1.25)
            const boost6 = level.boost(8251, -619, 1200, 2.7)
            const boost7 = level.boost(7750, -1540, 1050, 1.2)
            // const boost6 = level.boost(8235, -619, 3500, 2.9)

            // const train1 = level.transport(3650, 100, 415, 500, 8); //x,y,width.height,VxGoal,force
            // const train2 = level.transport(1250, 100, 415, 500, -8); //x,y,width.height,VxGoal,force
            // const train3 = level.transport(4050, 100, 415, 500, 8); //x,y,width.height,VxGoal,force

            let portal1, portal2
            portal1 = level.portal({
                x: 3675,
                y: -2225 + 1025
            }, -Math.PI / 2, { //up
                x: 3675,
                y: -375
            }, Math.PI / 2) //down

            portal2 = level.portal({
                x: 6300,
                y: -1225
            }, -Math.PI / 2, { //up
                x: 6300,
                y: -375
            }, Math.PI / 2) //down
            level.custom = () => {
                boost1.query();
                boost2.query();
                boost3.query();
                boost4.query();
                boost5.query();
                boost6.query();
                boost7.query();

                ctx.fillStyle = "rgba(50,70,100,0.04)"
                ctx.fillRect(2500, -10000, 1800, 30000);
                ctx.fillRect(8300, -10000, 1800, 30000);
                ctx.fillRect(-500, -10000, 1800, 30000);
                ctx.fillRect(5400, -10000, 1800, 30000);

                portal1[2].query()
                portal1[3].query()
                portal2[2].query()
                portal2[3].query()

                ctx.fillStyle = "#cff"
                if (isFlippedHorizontal) {
                    ctx.fillRect(150, -300, 525, 325);  //entrance typically
                } else {
                    ctx.fillRect(8925, -2575, 525, 400) //exit typically
                }

                level.exit.drawAndCheck();
                level.enter.draw();

                //give player some horizontal traction and proper leg animation on specific moving blocks
                if (m.onGround) {
                    for (let i = 0; i < blocks.length; i++) {
                        if (m.standingOn === blocks[i]) {
                            m.moverX = blocks[i].velocity.x //helps sync leg movements
                            m.Vx = player.velocity.x - blocks[i].velocity.x //adds blocks velocity to player
                        }
                    }
                }
                ctx.beginPath();
                for (let i = 0, len = blocks.length; i < len; i++) {
                    let vertices = blocks[i].vertices;
                    ctx.moveTo(vertices[0].x, vertices[0].y);
                    for (let j = 1; j < vertices.length; j += 1) {
                        ctx.lineTo(vertices[j].x, vertices[j].y);
                    }
                    ctx.lineTo(vertices[0].x, vertices[0].y);
                }
                ctx.strokeStyle = "#000"
                ctx.lineWidth = 10
                ctx.stroke();

                //combination of a horizontal force on the block and changing the length of constraints keeps the block form rotating as it swings
                //these parameters need fine tuning, mostly amplitude
                const rate = 0.011
                blockCycle++
                blocks[0].force.x = 0.004 * Math.sin(blockCycle * rate + 0.2) * blocks[0].mass
                constraint1.length = 1550 + 1630 * Math.sin(blockCycle * rate)
                constraint2.length = 1550 + 1630 * Math.sin(blockCycle * rate + Math.PI)
                //draw
                //draw
                ctx.beginPath();
                ctx.moveTo(constraint1.pointA.x, constraint1.pointA.y);
                ctx.lineTo(constraint1.bodyB.position.x + constraint1.pointB.x, constraint1.bodyB.position.y + constraint1.pointB.y);
                ctx.moveTo(constraint2.pointA.x, constraint2.pointA.y);
                ctx.lineTo(constraint2.bodyB.position.x + constraint2.pointB.x, constraint2.bodyB.position.y + constraint2.pointB.y);
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.stroke();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,0,0,0.13)"
                ctx.fillRect(8300, -1950, 1550, 1275);
                ctx.fillRect(5400, 875, 1800, 650);
                ctx.fillRect(2950, -2200, 875, 1050);
                ctx.fillRect(5900, -1025, 800, 450);
                if (isFlippedHorizontal) {
                    ctx.fillRect(8925, -2575, 575, 400) //exit typically
                } else {
                    ctx.fillRect(150, -300, 525, 325);  //entrance typically
                }

                ctx.fillStyle = "rgba(0,0,0,0.5)"
                ctx.fillRect(7175, -1515, 125, 180);
                portal1[0].draw();
                portal1[1].draw();
                portal1[2].draw();
                portal1[3].draw();
                portal2[0].draw();
                portal2[1].draw();
                portal2[2].draw();
                portal2[3].draw();
            };

            // spawn.bodyVertex(0, -1500, "600 -100  600 100  550 150  -550 150  -600 100  -600 -100  -550 -150  550 -150");
            const shape = "300 -50  300 50  275 75  -275 75  -300 50  -300 -50  -275 -75  275 -75"

            //force on block to make gentle swinging motion
            spawn.bodyVertex(4900, 300, shape, {
                density: 0.0002,
                friction: 1,
                frictionStatic: 1,
                frictionAir: 0.2,
                isNotHoldable: true,
            });
            blockCycle = 180;
            const blocks = []
            blocks.push(body[body.length - 1]) //saved to blocks array to give player traction in level.custom
            blocks[0].isNotHoldable = true
            //apply heavy damping for just a second on spawn to prevent crazy shakes

            simulation.ephemera.push({
                count: 25, //cycles before it self removes
                do() {
                    this.count--
                    if (this.count < 0) {
                        simulation.removeEphemera(this)
                        blocks[0].frictionAir = 0.02
                    }
                },
            })
            const stiffness = 0.0015
            const constraint1 = cons[cons.length] = Constraint.create({
                pointA: { x: 1300, y: 100 },
                pointB: { x: -300, y: -50 }, //offset from bodyB
                bodyB: body[body.length - 1],
                stiffness: stiffness,
                // damping: 0, //I don't know why but this needs to be 0 or not included to properly transfer traction to the player
                // length: 1000,
            });
            Composite.add(engine.world, cons[cons.length - 1]);
            const constraint2 = cons[cons.length] = Constraint.create({
                pointA: { x: 5400, y: 100 },
                pointB: { x: 300, y: -50 }, //offset from bodyB
                bodyB: body[body.length - 1],
                stiffness: stiffness,
                // length: 1000,
            });
            Composite.add(engine.world, cons[cons.length - 1]);


            // four large rounded squares
            let a = 900 //side length
            let c = 100 //corner offset
            // spawn.mapVertex(3400, -1300, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off
            // spawn.mapVertex(9200, -1300, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off
            // spawn.mapVertex(6300, 900, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off
            spawn.mapVertex(400, 900, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off
            //lower 1st zone entrance /exit
            spawn.mapRect(100, -350, 575, 75);
            spawn.mapRect(100, -300, 75, 375);
            spawn.mapRect(600, -325, 75, 175);
            spawn.mapRect(600, -10, 75, 50);

            //2nd zone upper hollow square
            spawn.mapVertex(5650 - 2900, 900 - 2200, `${-a} ${-a + c}  ${-a + c} ${-a}   ${-400} ${-a}           ${-400} ${a}          ${-a + c} ${a}  ${-a} ${a - c}`); //1/2 square with edges cut off
            spawn.mapVertex(6950 - 2900, 900 - 2200, `${400} ${-a}        ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}       ${400} ${a}`); //1/2 square with edges cut off
            // spawn.mapRect(5600 - 2900, 1400 - 2200, 1350, 400);
            spawn.mapRect(2950, -1175, 650, 775);
            spawn.mapRect(3750, -1175, 100, 775);
            spawn.mapRect(3575, -1025, 200, 475);


            //4th zone   far right hollow square near exit
            spawn.mapVertex(9200, -2050, `${-a} ${-a + c}  ${-a + c} ${-a}     ${a - c} ${-a}  ${a} ${-a + c}       ${a} ${-600}          ${-a} ${-600}`); //square with edges cut off --- hollow top
            spawn.mapVertex(9200, -550, `${-a} ${600}   ${a} ${600}      ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off --- hollow bottom
            spawn.mapRect(9800, -2100, 300, 1600);  //hollow left wall
            spawn.mapVertex(8175, -1425, "-1400 -90  350 -90 400 -40   400 40   350 90  -1400 90");
            spawn.mapVertex(6856, -1425, "300 -90  -350 -90 -400 -40   -400 40   -350 90  300 90");
            //exit housing
            spawn.mapRect(8925, -2575, 575, 75);
            if (isFlippedHorizontal) {
                spawn.mapRect(8925, -2550, 75, 400);
                spawn.mapRect(9425, -2550, 75, 125);
                spawn.mapRect(9425, -2215, 75, 50);
                spawn.bodyRect(9425, -2425, 75, 210);
            } else {
                spawn.mapRect(9425, -2550, 75, 400);
                spawn.mapRect(8925, -2550, 75, 125);
                spawn.mapRect(8925, -2215, 75, 50);
            }

            //lower 3rd zone
            spawn.mapVertex(6300, 450, `${-a} ${-a + c}  ${-a + c} ${-a}     ${a - c} ${-a}  ${a} ${-a + c}       ${a} ${0}          ${-a} ${0}`); //square with edges cut off --- hollow top
            spawn.mapVertex(6300, 1200, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
            spawn.mapVertex(6450, 1650, `${-a} ${600}      ${a + 700} ${600}        ${a + 700} ${a - c}      ${a - c + 700} ${a}         ${-a + c} ${a}      ${-a} ${a - c}`); //square with edges cut off --- hollow bottom

            //upper 3rd zone
            a = 400 //side length
            c = 50 //corner offset
            // spawn.mapVertex(6300, -800, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off
            spawn.mapVertex(6073, -1100, `${-340} ${-400 + c}  ${-340 + c} ${-400}   ${0} ${-400}  ${0} ${-200}      ${-340} ${-200}`); //left
            spawn.mapVertex(6528, -1100, `${340} ${-400 + c} ${340 - c} ${-400} ${0} ${-400} ${0} ${-200} ${340} ${-200}`); //right
            spawn.mapRect(5900, -1075, 800, 75); //top portal floor
            spawn.mapRect(5900, -625, 800, 100);//bottom portal floor
            spawn.mapVertex(6073, -500, `${-340} ${400 - c} ${-340 + c} ${400} ${0} ${400} ${0} ${200} ${-340} ${200}`); //left
            spawn.mapVertex(6528, -500, `${340} ${400 - c} ${340 - c} ${400} ${0} ${400} ${0} ${200} ${340} ${200}`); //right
            // spawn.mapVertex(6300, -1100, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}     ${a} ${-200}      ${-a} ${-200}`); //right
            // spawn.mapVertex(6300, -1100, `${-a} ${-a + c}  ${-a + c} ${-a}   ${a - c} ${-a}  ${a} ${-a + c}     ${a} ${-200}      ${-a} ${-200}`); //square with edges cut off
            // spawn.mapVertex(6300, -500, `${-a} ${200}     ${a} ${200}   ${a} ${a - c}  ${a - c} ${a}  ${-a + c} ${a}  ${-a} ${a - c}`); //square with edges cut off

            spawn.mapVertex(5800, -1425, "-300 -40  -250 -90   250 -90 300 -40   300 40 250 90  -250 90 -300 40");
            spawn.mapVertex(5485, -1850, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
            spawn.mapVertex(7115, -1850, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40"); //long
            spawn.mapVertex(6300, -2175, "-300 -40  -250 -90   250 -90 300 -40   300 40 250 90  -250 90 -300 40");  //highest
            spawn.mapVertex(4450, -1850, "-200 -40  -150 -90   150 -90 200 -40   200 40 150 90  -150 90 -200 40");
            // spawn.mapVertex(5300, -300, "-300 -60  -270 -90   270 -90 300 -60   300 60 270 90  -270 90 -300 60");
            spawn.mapVertex(5300, -300, "-300 -40  -250 -90   250 -90 300 -40   300 40 250 90  -250 90 -300 40");
            spawn.mapVertex(4500, -590, "-300 -90   250 -90 300 -40   300 40 250 90  -300 90");
            // spawn.mapVertex(4600, -590, "-500 -90   170 -90 200 -60   200 60 170 90  -500 90");

            //no debris on this level, so spawn some heals and ammo
            powerUps.chooseRandomPowerUp(6275, 1425);
            powerUps.chooseRandomPowerUp(6300, -650);
            powerUps.chooseRandomPowerUp(9550, -750);

            //random blocks
            spawn.bodyRect(7725, -2200, 150, 250, 0.2);
            spawn.bodyRect(4625, -825, 75, 125, 0.2);
            spawn.bodyRect(3250, -1200, 25, 25, 0.2);
            spawn.bodyRect(3375, -1275, 25, 75, 0.2);
            spawn.bodyRect(3450, -1200, 50, 25, 0.2);
            spawn.bodyRect(2825, -2225, 25, 25, 0.2);
            spawn.bodyRect(4075, -2225, 50, 25, 0.2);
            spawn.bodyRect(8850, -800, 75, 100, 0.2);
            spawn.bodyRect(6900, -100, 75, 100, 0.2);
            spawn.bodyRect(8975, -1575, 50, 50, 0.2);
            spawn.bodyRect(5725, -1700, 125, 175, 0.2);
            spawn.bodyRect(6850, -1725, 150, 200, 0.2);
            spawn.bodyRect(500, -400, 100, 50, 0.3);
            spawn.bodyRect(6025, 1050, 100, 50, 0.2);
            spawn.bodyRect(6000, -800, 75, 200, 0.2);
            spawn.bodyRect(6775, -75, 125, 75, 0.5);
            spawn.bodyRect(7200, 1300, 50, 200, 0.5);

            //mobs
            spawn.randomMobPositions = [
                [5700, -75],
                [6200, -100],
                [6900, -100],
                [5550, -500],
                [4675, -850],
                [4450, -2050],
                [4050, -2325],
                [3350, -1325],
                [5300, -2050],
                [5675, -2050],
                [5850, -1625],
                [6775, -1600],
                [7700, -1625],
                [7850, -2000],
                [7225, -2000],
                [6350, -2400],
                [8850, -1650],
                [9500, -1300],
                [9250, -900],
                [8600, -875],
                [5575, 1350],
                [6075, 1025],
                [6300, 1025],
                [6525, 1425],
                [7125, 1450]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(4925, -2850, 1);
            spawn.randomLevelBoss(7275, -2475);
            spawn.secondaryBossChance(8400, -1025)
            //spawn.randomHigherTierMob(6644, -682)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        factory() {
            level.announceText(2238, -1715, true)
            level.announceMobTypes()
            // simulation.enableConstructMode() //remove this!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

            level.setPosToSpawn(2235, -1375); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20); //bump for level entrance
            level.exit.x = 7875;
            level.exit.y = -2480;

            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20); //bump for level exit
            level.defaultZoom = 1500
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d0d2d4";
            // color.map = "#262a2f"
            let isPowerLeft = true
            const movers = []
            //left side
            movers.push(level.mover(125, -140, 925, 35, -5))
            movers.push(level.mover(1100, -437, 1100, 35, -5))
            movers.push(level.mover(2000, -600, 850, 35, -5))
            //right side
            const moveSpeedStopGo = 8
            movers.push(level.mover(2700, -200, 3600, 35, 0))
            movers.push(level.mover(7175, -215, 2275, 50, 3))
            movers.push(level.mover(6475, -215, 275, 100, -3))
            movers.push(level.mover(6725, -500, 500, 375, 3))
            movers.push(level.mover(7675, -725, 500, 410, 0))
            movers.push(level.mover(6775, -1075, 375, 50, 0))
            movers.push(level.mover(5525, -1075, 450, 50, 0))
            movers.push(level.mover(6775, -2100, 375, 50, 0))
            movers.push(level.mover(5450, -1900, 525, 50, 0))

            function setMoverDirection(VxGoal) {
                for (let i = 7; i < movers.length; i++) movers[i].VxGoal = VxGoal
            }
            setMoverDirection(0)

            const buttonRight = level.button(7735, -1825)
            buttonRight.isUp = true
            const buttonLeft = level.button(5275, -1900)

            const lasers = []
            const laserX = 3390 //3882 - 1130 / 2
            const laserGap = 1295 //1130
            lasers.push(level.hazard(laserX, -500, 6, 300, 0.4))
            lasers.push(level.hazard(laserX + laserGap, -500, 6, 300, 0.4))
            lasers.push(level.hazard(laserX + laserGap * 2, -500, 6, 300, 0.4))
            for (let i = 0; i < lasers.length; i++) {
                lasers[i].isOn = false;
                spawn.mapRect(lasers[i].min.x - 55, -550, 110, 50);
                spawn.mapRect(lasers[i].min.x - 10, -500, 25, 20);
            }
            const button1 = level.button(2235, -200)
            button1.isUp = true
            let bonusAmmoCount = 0
            level.custom = () => {
                if (isPowerLeft) {
                    if (!(simulation.cycle % 90)) spawn.bodyRect(2730, -1600, 50, 50);
                } else {
                    // for (let i = 0; i < trains.length; i++) {
                    //     //oscillate back and forth
                    //     if (trains[i].position.x < 5275) {
                    //         trains[i].changeDirection(true) //go right
                    //     } else if (trains[i].position.x > 7875) {
                    //         trains[i].changeDirection(false) //go left
                    //     }
                    //     trains[i].move();
                    // }

                    const rate = 160 //multiples of 32!
                    if ((simulation.cycle % rate) === 80) {
                        for (let i = 0; i < lasers.length; i++) lasers[i].isOn = false;
                        movers[3].VxGoal = moveSpeedStopGo;
                        movers[3].force = 0.0005
                        movers[2].VxGoal = moveSpeedStopGo;
                        movers[2].force = 0.0005
                    } else if ((simulation.cycle % rate) === 0) {
                        movers[3].VxGoal = 0;
                        movers[3].force = 0
                        movers[2].VxGoal = 0;
                        movers[2].force = 0
                        spawn.bodyRect(2730, -1600, 50, 50);
                        if ((simulation.cycle % (rate * 3)) === 0) {
                            if (bonusAmmoCount < 3 && Math.random() < 0.5) { //some extra ammo because of all the extra mobs that don't drop ammo
                                bonusAmmoCount++
                                powerUps.spawn(2760, -1550, Math.random() < 0.5 ? "heal" : "ammo", false);
                            }

                            for (let i = 0; i < lasers.length; i++) lasers[i].isOn = true;
                            const block2Mob = (laserIndex) => { //convert block into mob
                                const laserHit = Matter.Query.ray(body, lasers[laserIndex].min, lasers[laserIndex].max) //check for collisions with 3rd laser
                                if (laserHit.length) {
                                    for (let i = 0; i < body.length; i++) {
                                        if (laserHit[0].body.id === body[i].id) { //need to find the block id so it can be removed
                                            const list = ["flutter", "flutter", "flutter", "hopper", "slasher", "slasher", "slasher", "stabber", "springer", "striker", "sneaker", "launcher", "launcherOne", "exploder", "sucker", "spinner", "grower", "beamer", "spawner", "ghoster"]
                                            const pick = list[Math.floor(Math.random() * list.length)]
                                            spawn[pick](lasers[laserIndex].max.x, lasers[laserIndex].max.y - 20);
                                            const who = mob[mob.length - 1]
                                            Matter.Body.setVelocity(who, { x: (8 + 5 * Math.random()), y: -(14 + 10 * Math.random()) });
                                            who.locatePlayer()
                                            who.leaveBody = false;
                                            who.isDropPowerUp = false
                                            //remove block
                                            Matter.Composite.remove(engine.world, body[i]);
                                            body.splice(i, 1);
                                            break
                                        }
                                    }
                                }
                            }
                            if (mob.length < (100 - 50 * localSettings.isHideHUD) && !m.isTimeDilated) {
                                block2Mob(0)
                                block2Mob(1)
                                block2Mob(2)
                            }
                        }
                    }
                }
                if (buttonLeft.isUp) {
                    buttonLeft.query();
                    if (!buttonLeft.isUp) {
                        setMoverDirection(7)
                        buttonRight.isUp = true //flip the other button up

                        //remove any blocks on top of right button
                        const badBlocks = Matter.Query.region(body, buttonRight)
                        //figure out block's index
                        for (let j = 0; j < badBlocks.length; j++) {
                            let index = null
                            for (let i = 0; i < body.length; i++) {
                                if (badBlocks[j] === body[i]) index = i
                            }
                            //remove block
                            // console.log(index, j)
                            if (index) {
                                Matter.Composite.remove(engine.world, badBlocks[j]);
                                body.splice(index, 1);
                            }
                        }

                    }
                } else if (buttonRight.isUp) {
                    buttonRight.query();
                    if (!buttonRight.isUp) {
                        setMoverDirection(-7)
                        //check for blocks and remove them
                        const list = Matter.Query.region(body, buttonLeft) //are any blocks colliding with this
                        buttonLeft.isUp = true //flip the other button up
                        if (list.length > 0) {
                            list[0].isRemoveMeNow = true
                            for (let i = 1; i < body.length; i++) { //find which index in body array it is and remove from array
                                if (body[i].isRemoveMeNow) {
                                    Matter.Composite.remove(engine.world, list[0]);
                                    body.splice(i, 1);
                                    break
                                }
                            }
                        }
                    }
                }

                if (button1.isUp) { //opens up secondary zone
                    button1.query();
                    if (!button1.isUp) {
                        isPowerLeft = false
                        for (let i = 0; i < 3; i++) {
                            movers[i].VxGoal = 0;
                            movers[i].force = movers[i].VxGoal > 0 ? 0.0005 : -0.0005
                        }
                        powerUps.spawnStartingPowerUps(2760, -1550);
                        spawn.randomMobPositions = [
                            [2700, -350],
                            [6975, -650],
                            // [6550, -325],
                            // [7350, -350],
                            [7925, -975],
                            // [7950, -1725],
                            [7000, -1375],
                            [5700, -1350],
                            // [5250, -1575],
                            [6325, -75],
                            // [7900, -1925],
                            [5300, -1975],
                            // [7875, -1900],
                            // [5325, -1975],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                        spawn.randomMobFromArray()

                        spawn.randomGroup(3900, -725, 0.4);
                        spawn.randomLevelBoss(6501, -1771);
                        spawn.secondaryBossChance(6063, -661)
                        powerUps.addResearchToLevel() //needs to run after mobs are spawned
                    }
                }
                buttonRight.draw();
                buttonLeft.draw();
                button1.draw();
                for (let i = 0; i < movers.length; i++) movers[i].push();
                level.exit.drawAndCheck();
                level.enter.draw();
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(6937, -2075, 50, 1775); //6937, -1050, 50, 675);
                ctx.fillStyle = "rgba(0,255,255,0.15)" //            ctx.fillStyle = "#f2f2f2"
                ctx.fillRect(7675, -2875, 500, 425); //exit room
            };
            level.customTopLayer = () => {
                if (isPowerLeft) {
                    ctx.fillStyle = "rgba(0,0,0,0.2)"
                    ctx.fillRect(2400, -1650, 7050, 2750) //right side
                    ctx.fillRect(4950, -3075, 3225, 1425);
                    ctx.beginPath()
                    ctx.moveTo(2407, -576);
                    ctx.lineTo(2000, -573)
                    ctx.lineTo(1950, -439)
                    ctx.lineTo(1100, -432)
                    ctx.lineTo(1020, -143)
                    ctx.lineTo(125, -137)
                    ctx.lineTo(-109, 300)
                    ctx.lineTo(-125, 1089)
                    ctx.lineTo(2372, 1081)
                    ctx.lineTo(2452, 65)
                    ctx.fill();
                } else {
                    // for (let i = 0; i < trains.length; i++) trains[i].draw()
                    ctx.beginPath()
                    ctx.moveTo(2526, -589);
                    ctx.lineTo(2531, -597)
                    ctx.lineTo(2506, -594)
                    ctx.lineTo(2850, -600)
                    ctx.lineTo(2890, -193)
                    ctx.lineTo(6300, -200)
                    ctx.lineTo(6618, 857)
                    ctx.lineTo(6622, 1100)
                    ctx.lineTo(2521, 1100)
                    ctx.fillStyle = "rgba(0,0,0,0.2)"
                    ctx.fill();
                    ctx.fillRect(-100, -1650, 2625, 2750) //left side
                    for (let i = 0; i < lasers.length; i++) lasers[i].opticalQuery()
                }
                ctx.fillStyle = "rgba(0,0,0,0.07)"
                ctx.fillRect(7675, -2200, 1775, 2025);
                ctx.fillRect(4950, -2075, 500, 1000);
                ctx.fillRect(2050, -1650, 350, 325) //entrance room
                for (let i = 0; i < movers.length; i++) movers[i].draw();
            };
            spawn.mapRect(-1550, -3050, 1450, 4150); //left wall
            spawn.mapRect(-1550, -3050, 6525, 1400); //ceiling
            spawn.mapRect(-1550, -3050, 6525, 1400);
            spawn.mapRect(3000, -1700, 1975, 675); //ceiling center

            spawn.mapRect(3800, -4000, 5650, 950);
            spawn.mapRect(3800, -4000, 1175, 2975);
            spawn.mapRect(8175, -4000, 1275, 3685); //right wall
            spawn.mapRect(8175, -200, 1275, 1300); //right wall

            spawn.mapRect(75, 0, 6275, 1100); //ground
            spawn.mapRect(6475, -200, 2750, 1300);
            spawn.mapRect(4975, -1087, 550, 62);
            spawn.mapRect(4975, -1100, 500, 75);

            spawn.mapRect(7875, -1100, 175, 25); //right 3 hop stairs
            spawn.mapRect(8075, -1450, 200, 25);
            spawn.mapRect(7675, -1825, 375, 25);
            spawn.mapRect(7675, -1800, 250, 725);

            spawn.mapRect(5125, -1275, 200, 25); //left 3 hop stairs
            spawn.mapRect(4900, -1575, 175, 25);
            spawn.mapRect(5125, -1900, 325, 25);
            spawn.mapRect(5225, -1875, 225, 625);
            spawn.mapRect(4950, -3075, 500, 1000);

            //exit
            spawn.mapRect(7675, -2450, 525, 250);
            spawn.mapRect(7675, -3050, 550, 175);
            spawn.mapRect(7675, -2925, 50, 175);

            spawn.mapRect(1925, -1325, 550, 50); //entrance
            spawn.mapRect(2050, -1675, 50, 175); //entrance
            spawn.mapRect(1700, -200, 750, 275); //button shelf
            if (Math.random() < 0.5) { //left side
                spawn.mapRect(625, -1100, 425, 300);
                spawn.mapRect(1375, -1100, 425, 300);
                spawn.mapRect(1750, -835, 100, 35);
                spawn.mapRect(-200, -525, 150, 35);
            } else {
                spawn.mapRect(800, -1125, 925, 400);
                spawn.mapRect(75, -775, 400, 50);
                spawn.mapRect(1700, -760, 75, 35);
                spawn.mapRect(-200, -425, 150, 35);
            }
            spawn.mapRect(2400, -600, 125, 675);
            spawn.mapRect(2400, -1750, 125, 1050);
            spawn.mapRect(2700, -1700, 125, 85);

            spawn.randomMobPositions = [
                [350, -325],
                // [875, -375],
                [1250, -575],
                // [1550, -600],
                // [1250, -175, true],
                [1500, -229, true],
                [1850, -300, true]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            //spawn.randomHigherTierMob(1491, -150)
            powerUps.spawn(5200, -1300, "ammo");
        },
        labs() {
            spawn.randomMobPositions = []
            level.announceMobTypes()
            level.isProcedural = true //used in generating text for the level builder
            level.defaultZoom = 1700
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d9d9de" //"#d3d3db" //"#dcdcdf";
            let isDoorLeft, isDoorRight, x, y
            doCustom = []
            doCustomTopLayer = []
            offset = { x: 0, y: 0 }
            const mobSpawnChance = 0 // Math.random() < chance + 0.07 * simulation.difficulty
            enterOptions = [
                (x = offset.x, y = offset.y) => { //lasers
                    level.announceText(x + 900, y - 1370)
                    level.setPosToSpawn(x + 1750, y - 800);
                    spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
                    spawn.mapRect(x + 1450, y - 1350, 50, 450); //entrance left wall
                    spawn.bodyRect(x + 1460, y - 900, 30, 150); //entrance door
                    spawn.mapRect(x + 1600, y - 350, 500, 100); //toggle shelf
                    const toggle = level.toggle(x + 1650, y - 350, true) //(x,y,isOn,isLockOn = true/false)
                    let hazard1
                    if (Math.random() > 0.5) {
                        spawn.mapRect(x + 550, y - 750, 1500, 50); //entrance shelf
                        // hazard1 = level.hazard(x + 850, y - 920, 600, 10, 0.4) //laser
                        hazard1 = level.laser({ x: x + 870, y: y - 915 }, { x: x + 1450, y: y - 915 })
                        spawn.mapRect(x + 860, y - 925, 10, 20); //laser nose
                        spawn.mapRect(x + 660, y - 975, 200, 120); //laser body
                    } else {
                        spawn.mapRect(x + 1350, y - 750, 700, 50); //entrance shelf
                        // hazard1 = level.hazard(x + 1040, y - 660, 1000, 10, 0.4) //laser
                        hazard1 = level.laser({ x: x + 1060, y: y - 655 }, { x: x + 2000, y: y - 655 })
                        spawn.mapRect(x + 1050, y - 665, 10, 20); //laser nose
                        spawn.mapRect(x + 650, y - 705, 400, 100); //laser body
                    }
                    // const hazard2 = level.hazard(x, y - 330, 450, 10, 0.4) //laser
                    const hazard2 = level.laser({ x: x + 5, y: y - 325 }, { x: x + 455, y: y - 325 })
                    spawn.mapRect(x + 440, y - 335, 10, 20); //laser nose
                    spawn.mapRect(x + 450, y - 375, 400, 100); //laser body
                    const Xoffset = Math.floor(400 * Math.random())
                    //level.hazard(x + Xoffset, y - 1300, 10, 1300, 0.4) //laser
                    const hazard3 = level.laser({ x: x + Xoffset + 5, y: y - 1290 }, { x: x + Xoffset + 5, y: y })
                    spawn.mapRect(x + Xoffset - 5, y - 1310, 20, 20); //laser nose
                    const Xoffset2 = 1650 + Math.floor(300 * Math.random())
                    // const hazard4 = level.hazard(x + Xoffset2, y - 240, 10, 250, 0.4) //laser
                    hazard4 = level.laser({ x: x + Xoffset2 + 5, y: y - 230 }, { x: x + Xoffset2 + 5, y: y - 230 + 250 })

                    spawn.mapRect(x + Xoffset2 - 5, y - 250, 20, 20); //laser nose
                    spawn.randomMobPositions.push(...[
                        [x + 150, y + -1100],
                        [x + 175, y + -775],
                        [x + 150, y + -350],
                        [x + 150, y + -75],
                        [x + 650, y + -125],
                        [x + 1200, y + -75],
                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                    // let isSpawnedMobs = false
                    doCustomTopLayer.push(
                        () => {
                            toggle.query();
                            if (toggle.isOn) {
                                if ((simulation.cycle % 120) > 60) {
                                    hazard1.query();
                                    hazard2.query();
                                } else {
                                    hazard3.query();
                                    hazard4.query()
                                }
                            }
                        }
                    )
                },
            ]
            exitOptions = [
                (x = offset.x, y = offset.y) => {
                    level.exit.x = x + 1725;
                    level.exit.y = y - 980;
                    spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
                    spawn.mapRect(x + 1500, y - 950, 500, 25); //exit platform
                    spawn.mapRect(x + 1550, y - 1300, 25, 175); //exit side wall
                    spawn.mapVertex(x + 1300, y - 125, "-400 0   -250 -400  250 -400   400 0");

                    spawn.bodyRect(x + 1075, y - 475, 125, 125, 0.25);
                    spawn.bodyRect(x + 500, y - 100, 125, 100, 0.25);
                    spawn.bodyRect(x + 200, y - 150, 100, 150, 0.25);
                    spawn.bodyRect(x + 1075, y - 1075, 100, 125, 0.25);
                    const density = 0.0015
                    const angle = Math.PI / 2
                    const variance = 0 //Math.PI
                    const frictionAir = 0.03
                    const angularVelocity = 0 //0.01
                    const spinVariance = 0 //0.02
                    balance1 = level.spinner(x + 200, y - 500, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5)) //    spinner(x, y, width, height, density = 0.001, angle=0,frictionAir=0.001,angularVelocity=0) {
                    balance2 = level.spinner(x + 200, y - 950, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))
                    balance3 = level.spinner(x + 650, y - 750, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))
                    balance4 = level.spinner(x + 1250, y - 1000, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))

                    let isInRoom = false
                    doCustom.push(
                        () => {
                            if (!isInRoom && m.pos.x > x - 100 && m.pos.x < x + 2700 && m.pos.y > y - 1300 && m.pos.y < y) { //check if player is in this room and run code once
                                isInRoom = true
                                spawn.randomMobPositions = [
                                    [x + 1175, y - 725],
                                    [x + 1450, y - 725],
                                    [x + 425, y - 100],
                                    [x + 1700, y - 300],
                                    [x + 1300, y - 375],
                                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                spawn.randomMobFromArray()
                                //spawn.randomHigherTierMob(x + 800, y - 1000);
                            }
                            ctx.fillStyle = "#d4f4f4"
                            ctx.fillRect(x + 1550, y - 1300, 450, 350)
                        }
                    )
                    doCustomTopLayer.push(
                        () => {
                            ctx.fillStyle = "#233"
                            ctx.beginPath();
                            ctx.arc(balance1.pointA.x, balance1.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.moveTo(balance2.pointA.x, balance2.pointA.y)
                            ctx.arc(balance2.pointA.x, balance2.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.moveTo(balance3.pointA.x, balance3.pointA.y)
                            ctx.arc(balance3.pointA.x, balance3.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.moveTo(balance4.pointA.x, balance4.pointA.y)
                            ctx.arc(balance4.pointA.x, balance4.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    )
                },
                (x = offset.x, y = offset.y) => {
                    level.exit.x = x + 1750;
                    level.exit.y = y - 980;
                    spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
                    spawn.mapRect(x + 1550, y - 950, 500, 25); //exit platform
                    spawn.mapRect(x + 1600, y - 1300, 25, 175); //exit side wall
                    spawn.bodyRect(x + 1275, y - 475, 125, 125, 0.25);
                    spawn.bodyRect(x + 500, y - 100, 125, 100, 0.25);
                    spawn.bodyRect(x + 800, y - 150, 100, 150, 0.25);
                    spawn.bodyRect(x + 875, y + -50, 50, 50);
                    spawn.bodyRect(x + 1025, y + -50, 50, 50);

                    if (Math.random() > 0.5) {
                        const density = 0.0012
                        const angle = Math.PI / 2
                        const variance = 0.2 //Math.PI
                        const frictionAir = 0.015
                        const height = 35
                        balance1 = level.spinner(x + 1300, y - 425, height, 410, density, angle + variance * (Math.random() - 0.5), frictionAir) //    spinner(x, y, width, height, density = 0.001, angle=0,frictionAir=0.001,angularVelocity=0) {
                        balance3 = level.spinner(x + 750, y - 650, height, 410, density, angle + variance * (Math.random() - 0.5), frictionAir)
                        balance2 = level.spinner(x + 300, y - 425, height, 410, density, angle + variance * (Math.random() - 0.5), frictionAir)
                        balance4 = level.spinner(x + 1250, y - 950, 50, 550, density, angle, 0.1)
                        const rotatingBlock = body[body.length - 1]
                        doCustom.push(
                            () => {
                                if (!isInRoom && m.pos.x > x - 100 && m.pos.x < x + 2700 && m.pos.y > y - 1300 && m.pos.y < y) { //check if player is in this room and run code once
                                    isInRoom = true
                                    spawn.randomMobPositions = [
                                        [x + 1175, y - 725],
                                        [x + 1450, y - 725],
                                        [x + 425, y - 100],
                                        [x + 1200, y - 125],
                                        [x + 1300, y - 375],
                                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                    spawn.randomMobFromArray()
                                    //spawn.randomHigherTierMob(x + 800, y - 1000);
                                }
                                ctx.fillStyle = "#d4f4f4"
                                ctx.fillRect(x + 1600, y - 1300, 400, 350)
                                rotatingBlock.torque += rotatingBlock.inertia * 0.000005
                            }
                        )
                    } else {
                        const density = 0.001
                        const angle = Math.PI / 2
                        const variance = Math.PI
                        const frictionAir = 0.015
                        const width = 200
                        const height = 200
                        const spinVariance = 0.05
                        balance1 = level.spinner(x + 175, y - 300, height, width, density, angle + variance * (Math.random() - 0.5), frictionAir, spinVariance * (Math.random() - 0.5)) //    spinner(x, y, width, height, density = 0.001, angle=0,frictionAir=0.001,angularVelocity=0) {
                        balance2 = level.spinner(x + 500, y - 525, height, width, density, angle + variance * (Math.random() - 0.5), frictionAir, spinVariance * (Math.random() - 0.5))
                        balance3 = level.spinner(x + 850, y - 700, height, width, density, angle + variance * (Math.random() - 0.5), frictionAir, spinVariance * (Math.random() - 0.5))
                        balance4 = level.spinner(x + 1250, y - 850, height, width, density, angle + variance * (Math.random() - 0.5), frictionAir, spinVariance * (Math.random() - 0.5))
                        doCustom.push(
                            () => {
                                if (!isInRoom && m.pos.x > x - 100 && m.pos.x < x + 2700 && m.pos.y > y - 1300 && m.pos.y < y) { //check if player is in this room and run code once
                                    isInRoom = true
                                    spawn.randomMobPositions = [
                                        [x + 1175, y - 725],
                                        [x + 1450, y - 725],
                                        [x + 425, y - 100],
                                        [x + 1200, y - 125],
                                        [x + 1300, y - 375],
                                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                    spawn.randomMobFromArray()
                                    //spawn.randomHigherTierMob(x + 800, y - 1000);
                                }
                                ctx.fillStyle = "#d4f4f4"
                                ctx.fillRect(x + 1600, y - 1300, 400, 350)
                            }
                        )
                    }
                    let isInRoom = false
                    doCustomTopLayer.push(
                        () => {
                            ctx.fillStyle = "#233"
                            ctx.beginPath();
                            ctx.arc(balance1.pointA.x, balance1.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.moveTo(balance2.pointA.x, balance2.pointA.y)
                            ctx.arc(balance2.pointA.x, balance2.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.moveTo(balance3.pointA.x, balance3.pointA.y)
                            ctx.arc(balance3.pointA.x, balance3.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.moveTo(balance4.pointA.x, balance4.pointA.y)
                            ctx.arc(balance4.pointA.x, balance4.pointA.y, 9, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    )
                }
            ]
            emptyOptions = [ //nothing good here except the starting power up, and duplicated bosses
                (x = offset.x, y = offset.y) => { //pulse
                    if (!isDoorLeft && isDoorRight) { //flipped, entering from the right
                        powerUps.spawnStartingPowerUps(x + 2000 - 1650, y + -400);
                        spawn.mapRect(x + 2000 - 1575 - 25, y + -625, 25, 375); //wall on top of wall
                        spawn.mapRect(x + 2000 - 1575 - 25, y + -1325, 25, 525); //wall on top of wall
                        spawn.mapRect(x + 2000 - 1525 - 250, y + -350, 250, 450); //wall
                        spawn.mapRect(x + 2000 - 245 - 300, y + -200, 300, 100); //gun
                        spawn.mapRect(x + 2000 - 530 - 25, y + -190, 25, 80); //gun nose
                        const button = level.button(x + 2000 - 290 - 140, y - 200)
                        button.isReadyToFire = true
                        doCustom.push(
                            () => {
                                ctx.fillStyle = "rgba(0,0,0,0.05)"; //"rgba(0,0,0,0.1)";
                                ctx.fillRect(x + 2000 - 255 - 280, y + -100, 280, 100);
                                button.query();
                                button.draw();
                                if (!button.isReadyToFire && button.isUp) {
                                    button.isReadyToFire = true
                                } else if (button.isReadyToFire && !button.isUp) {
                                    button.isReadyToFire = false
                                    b.pulse(90, Math.PI, {
                                        x: x + 2000 - 560,
                                        y: y - 150
                                    })
                                }
                            }
                        )
                        spawn.randomMobPositions.push(...[
                            [x + 2000 - 1600, y + -425],
                            [x + 2000 - 1725, y + -1250],
                            [x + 2000 - 1250, y + -1200],
                            [x + 2000 - 300, y + -1200],
                            [x + 2000 - 800, y + -125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        let pick = spawn.pickList[Math.floor(Math.random() * spawn.pickList.length)];
                        spawn[pick](x + 2000 - 1275, y + -150, 90 + Math.random() * 40); //one extra large mob
                    } else {
                        powerUps.spawnStartingPowerUps(x + 1650, y + -400);
                        spawn.mapRect(x + 1575, y + -625, 25, 375); //wall on top of wall
                        spawn.mapRect(x + 1575, y + -1325, 25, 525); //wall on top of wall
                        spawn.mapRect(x + 1525, y + -350, 250, 450); //wall
                        spawn.mapRect(x + 245, y + -200, 300, 100); //gun
                        spawn.mapRect(x + 530, y + -190, 25, 80); //gun nose
                        const button = level.button(x + 290, y - 200)
                        button.isReadyToFire = true

                        doCustom.push(
                            () => {
                                ctx.fillStyle = "rgba(0,0,0,0.05)"; //"rgba(0,0,0,0.1)";
                                ctx.fillRect(x + 255, y + -100, 280, 100);
                                button.query();
                                button.draw();
                                if (!button.isReadyToFire && button.isUp) {
                                    button.isReadyToFire = true
                                } else if (button.isReadyToFire && !button.isUp) {
                                    button.isReadyToFire = false
                                    b.pulse(90, 0, { x: x + 560, y: y - 150 })
                                }
                            }
                        )
                        spawn.randomMobPositions.push(...[
                            [x + 1600, y + -425],
                            [x + 1725, y + -1250],
                            [x + 1250, y + -1200],
                            [x + 300, y + -1200],
                            [x + 800, y + -125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        let pick = spawn.pickList[Math.floor(Math.random() * spawn.pickList.length)];
                        spawn[pick](x + 1275, y + -150, 90 + Math.random() * 40); //one extra large mob
                    }
                },
                (x = offset.x, y = offset.y) => { //spawn block and fire it
                    if (!isDoorLeft && isDoorRight) {
                        powerUps.spawnStartingPowerUps(x + 1650, y + -400);
                        spawn.mapRect(x + 2000 - 1575 - 25, y + -625, 25, 375); //wall on top of wall
                        spawn.mapRect(x + 2000 - 1575 - 25, y + -1325, 25, 525); //wall on top of wall
                        spawn.mapRect(x + 2000 - 1525 - 250, y + -350, 250, 450); //wall
                        spawn.mapRect(x + 2000 - 245 - 300, y + -200, 300, 100); //gun
                        spawn.mapRect(x + 2000 - 530 - 25, y + -190, 25, 80);
                        const button = level.button(x + 2000 - 290 - 140, y - 200)
                        button.isReadyToFire = true
                        doCustom.push(
                            () => {
                                ctx.fillStyle = "rgba(0,0,0,0.05)"; //"rgba(0,0,0,0.1)";
                                ctx.fillRect(x + 2000 - 255 - 280, y + -100, 280, 100);
                                button.query();
                                button.draw();
                                if (!button.isReadyToFire && button.isUp) {
                                    button.isReadyToFire = true
                                } else if (button.isReadyToFire && !button.isUp) {
                                    button.isReadyToFire = false
                                    fireBlock = function (xPos, yPos) {
                                        const index = body.length
                                        spawn.bodyRect(xPos, yPos, 35 + 50 * Math.random(), 35 + 50 * Math.random());
                                        const bodyBullet = body[body.length - 1]
                                        Matter.Body.setVelocity(body[index], { x: -120, y: -5 });
                                        body[index].isAboutToBeRemoved = true;
                                        setTimeout(() => { //remove block
                                            for (let i = 0; i < body.length; i++) {
                                                if (body[i] === bodyBullet) {
                                                    Matter.Composite.remove(engine.world, body[i]);
                                                    body.splice(i, 1);
                                                }
                                            }
                                        }, 1000);
                                    }
                                    fireBlock(x + 2000 - 90 - 560 + 30 * Math.random(), y - 140);
                                    fireBlock(x + 2000 - 90 - 560 + 30 * Math.random(), y - 160);
                                    fireBlock(x + 2000 - 90 - 560 + 30 * Math.random(), y - 180);
                                    fireBlock(x + 2000 - 90 - 560 + 30 * Math.random(), y - 200);
                                    fireBlock(x + 2000 - 90 - 560 + 30 * Math.random(), y - 220);
                                    fireBlock(x + 2000 - 90 - 560 + 30 * Math.random(), y - 240);
                                }
                            }
                        )
                        spawn.randomMobPositions.push(...[
                            [x + 2000 - 1600, y + -425],
                            [x + 2000 - 1725, y + -1250],
                            [x + 2000 - 1250, y + -1200],
                            [x + 2000 - 300, y + -1200],
                            [x + 2000 - 800, y + -125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        let pick = spawn.pickList[Math.floor(Math.random() * spawn.pickList.length)];
                        spawn[pick](x + 2000 - 1275, y + -150, 90 + Math.random() * 40); //one extra large mob
                    } else {
                        powerUps.spawnStartingPowerUps(x + 1650, y + -400);
                        spawn.mapRect(x + 1575, y + -625, 25, 375); //wall on top of wall
                        spawn.mapRect(x + 1575, y + -1325, 25, 525); //wall on top of wall
                        spawn.mapRect(x + 1525, y + -350, 250, 450); //wall
                        spawn.mapRect(x + 245, y + -200, 300, 100); //gun
                        spawn.mapRect(x + 530, y + -190, 25, 80);
                        const button = level.button(x + 290, y - 200)
                        button.isReadyToFire = true
                        doCustom.push(
                            () => {
                                ctx.fillStyle = "rgba(0,0,0,0.05)"; //"rgba(0,0,0,0.1)";
                                ctx.fillRect(x + 255, y + -100, 280, 100);
                                button.query();
                                button.draw();
                                if (!button.isReadyToFire && button.isUp) {
                                    button.isReadyToFire = true
                                } else if (button.isReadyToFire && !button.isUp) {
                                    button.isReadyToFire = false
                                    fireBlock = function (xPos, yPos) {
                                        const index = body.length
                                        spawn.bodyRect(xPos, yPos, 35 + 50 * Math.random(), 35 + 50 * Math.random());
                                        const bodyBullet = body[body.length - 1]
                                        Matter.Body.setVelocity(body[index], { x: 120, y: -5 });
                                        body[index].isAboutToBeRemoved = true;

                                        setTimeout(() => { //remove block
                                            for (let i = 0; i < body.length; i++) {
                                                if (body[i] === bodyBullet) {
                                                    Matter.Composite.remove(engine.world, body[i]);
                                                    body.splice(i, 1);
                                                }
                                            }
                                        }, 1000);
                                    }
                                    fireBlock(x + 560 + 30 * Math.random(), y - 140);
                                    fireBlock(x + 560 + 30 * Math.random(), y - 160);
                                    fireBlock(x + 560 + 30 * Math.random(), y - 180);
                                    fireBlock(x + 560 + 30 * Math.random(), y - 200);
                                    fireBlock(x + 560 + 30 * Math.random(), y - 220);
                                    fireBlock(x + 560 + 30 * Math.random(), y - 240);
                                }
                            }
                        )
                        spawn.randomMobPositions.push(...[
                            [x + 1600, y + -425],
                            [x + 1725, y + -1250],
                            [x + 1250, y + -1200],
                            [x + 300, y + -1200],
                            [x + 800, y + -125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        let pick = spawn.pickList[Math.floor(Math.random() * spawn.pickList.length)];
                        spawn[pick](x + 1275, y + -150, 90 + Math.random() * 40); //one extra large mob
                    }
                },
                (x = offset.x, y = offset.y) => { //fire an "ammo clip" of blocks
                    if (!isDoorLeft && isDoorRight) { //flipped, entering from the right
                        powerUps.spawnStartingPowerUps(x + 2000 - 1650, y + -400);
                        spawn.mapRect(x + 2000 - 1575 - 25, y + -625, 25, 375); //wall on top of wall
                        spawn.mapRect(x + 2000 - 1575 - 25, y + -1325, 25, 525); //wall on top of wall
                        spawn.mapRect(x + 2000 - 1525 - 250, y + -350, 250, 450); //wall
                        spawn.mapRect(x + 2000 - 175 - 370, y + -200, 370, 100); //gun
                        spawn.mapRect(x + 2000 - 530 - 25, y + -190, 25, 80);
                        spawn.mapRect(x + 2000 - 545 - 10, y + -770, 10, 325); //block loader for gun //walls
                        spawn.mapRect(x + 2000 - 620 - 10, y + -770, 10, 325); //walls
                        spawn.mapRect(x + 2000 + 50 - 150, y + -425, 150, 50);
                        spawn.mapRect(x + 2000 - 175 - 370, y + -650, 370, 50);
                        spawn.mapRect(x + 2000 - 540 - 95, y + -460, 95, 15); //bottom that opens and closes
                        const bulletDoor = map[map.length - 1] //keep track of this body so it can be make non-collide later
                        for (let i = 0; i < 6; i++) spawn.bodyRect(x + 2000 - 60 - 555 + Math.floor(Math.random() * 10), y + -520 - 50 * i, 50, 50); //bullets for gun
                        spawn.bodyRect(x + 2000 - 250 - 40, y + -700, 40, 50); //extra bullets 
                        spawn.bodyRect(x + 2000 - 350 - 30, y + -700, 30, 35);
                        spawn.bodyRect(x + 2000 - 425 - 40, y + -700, 40, 70);
                        const button = level.button(x + 2000 - 280 - 140, y - 200) //trigger for gun
                        button.isReadyToFire = true
                        doCustom.push(
                            () => {
                                ctx.fillStyle = "rgba(0,0,0,0.05)"; //"rgba(0,0,0,0.1)";
                                ctx.fillRect(x + 2000 - 200 - 325, y + -625, 325, 650);
                                button.query();
                                button.draw();
                                if (!button.isReadyToFire && button.isUp) {
                                    button.isReadyToFire = true
                                    bulletDoor.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                                } else if (button.isReadyToFire && !button.isUp) {
                                    button.isReadyToFire = false
                                    bulletDoor.collisionFilter.mask = 0 //cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                                } else if (!button.isUp) {
                                    const bounds = {
                                        min: {
                                            x: x + 2000 - 580,
                                            y: y - 125
                                        },
                                        max: {
                                            x: x + 2000 - 530,
                                            y: y - 110
                                        }
                                    }
                                    const list = Matter.Query.region(body, bounds)
                                    for (let i = 0, len = list.length; i < len; i++) {
                                        Matter.Body.setVelocity(list[i], {
                                            x: -120,
                                            y: -5
                                        });
                                    }
                                    if (Matter.Query.region([player], bounds).length) {
                                        Matter.Body.setVelocity(player, {
                                            x: -100,
                                            y: -5
                                        });
                                    }
                                    ctx.fillStyle = `rgba(255,0,255,${0.2 + 0.7 * Math.random()})`
                                    ctx.fillRect(bounds.min.x, y - 185, 38, 70);
                                }
                            }
                        )
                        spawn.randomMobPositions.push(...[
                            [x + 2000 - 1600, y + -425],
                            [x + 2000 - 1725, y + -1250],
                            [x + 2000 - 1250, y + -1200],
                            [x + 2000 - 300, y + -1200],
                            [x + 2000 - 800, y + -125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        let pick = spawn.pickList[Math.floor(Math.random() * spawn.pickList.length)];
                        spawn[pick](x + 2000 - 1275, y + -150, 90 + Math.random() * 40); //one extra large mob
                    } else {
                        powerUps.spawnStartingPowerUps(x + 1650, y + -400);
                        spawn.mapRect(x + 1575, y + -625, 25, 375); //wall on top of wall
                        spawn.mapRect(x + 1575, y + -1325, 25, 525); //wall on top of wall
                        spawn.mapRect(x + 1525, y + -350, 250, 450); //wall
                        spawn.mapRect(x + 175, y + -200, 370, 100); //gun
                        spawn.mapRect(x + 530, y + -190, 25, 80);
                        spawn.mapRect(x + 545, y + -770, 10, 325); //block loader for gun //walls
                        spawn.mapRect(x + 620, y + -770, 10, 325); //walls
                        spawn.mapRect(x - 50, y + -425, 150, 50);
                        spawn.mapRect(x + 175, y + -650, 370, 50);
                        spawn.mapRect(x + 540, y + -460, 95, 15); //bottom that opens and closes
                        const bulletDoor = map[map.length - 1] //keep track of this body so it can be make non-collide later
                        for (let i = 0; i < 6; i++) spawn.bodyRect(x + 555 + Math.floor(Math.random() * 10), y + -520 - 50 * i, 50, 50); //bullets for gun
                        spawn.bodyRect(x + 250, y + -700, 40, 50); //extra bullets 
                        spawn.bodyRect(x + 350, y + -700, 30, 35);
                        spawn.bodyRect(x + 425, y + -700, 40, 70);
                        const button = level.button(x + 280, y - 200) //trigger for gun
                        button.isReadyToFire = true
                        doCustom.push(
                            () => {
                                ctx.fillStyle = "rgba(0,0,0,0.05)"; //"rgba(0,0,0,0.1)";
                                ctx.fillRect(x + 200, y + -625, 325, 650);
                                button.query();
                                button.draw();
                                if (!button.isReadyToFire && button.isUp) {
                                    button.isReadyToFire = true
                                    bulletDoor.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                                } else if (button.isReadyToFire && !button.isUp) {
                                    button.isReadyToFire = false
                                    bulletDoor.collisionFilter.mask = 0 //cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                                } else if (!button.isUp) {
                                    const bounds = {
                                        min: {
                                            x: x + 530,
                                            y: y - 125
                                        },
                                        max: {
                                            x: x + 580,
                                            y: y - 110
                                        }
                                    }
                                    const list = Matter.Query.region(body, bounds)
                                    for (let i = 0, len = list.length; i < len; i++) {
                                        Matter.Body.setVelocity(list[i], {
                                            x: 120,
                                            y: -5
                                        });
                                    }
                                    if (Matter.Query.region([player], bounds).length) {
                                        Matter.Body.setVelocity(player, {
                                            x: 100,
                                            y: -5
                                        });
                                    }
                                    ctx.fillStyle = `rgba(255,0,255,${0.2 + 0.7 * Math.random()})`
                                    ctx.fillRect(bounds.min.x, y - 185, 38, 70);
                                }
                            }
                        )
                        spawn.randomMobPositions.push(...[
                            [x + 1600, y + -425],
                            [x + 1725, y + -1250],
                            [x + 1250, y + -1200],
                            [x + 300, y + -1200],
                            [x + 800, y + -125],
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall })))
                        let pick = spawn.pickList[Math.floor(Math.random() * spawn.pickList.length)];
                        spawn[pick](x + 1275, y + -150, 90 + Math.random() * 40); //one extra large mob
                    }
                }
            ]
            lootOptions = [ //has some power up reward //field, ammo, research, gun
                (x = offset.x, y = offset.y) => {
                    spawn.mapRect(x + 1925, y + -325, 125, 150); //4 wall ledges
                    spawn.mapRect(x + 1925, y + -865, 125, 150); //4 wall ledges
                    spawn.mapRect(x + -50, y + -325, 125, 150); //4 wall ledges
                    spawn.mapRect(x + -50, y + -865, 125, 150); //4 wall ledges
                    spawn.mapRect(x + 1700, y + -500, 200, 25);
                    spawn.mapRect(x + 75, y + -500, 200, 25);

                    let chamberY = -650
                    if (Math.random() > 0.5) { //upper chamber
                        chamberY = -650 - 640
                        spawn.mapRect(x + 550, y + -10 - 640, 900, 25); //raised floor 
                        spawn.mapRect(x + 450, y + -20 - 640, 1100, 25);
                        spawn.mapRect(x + 450, y + -675 - 640, 1100, 25); //chamber ceiling
                        powerUps.spawn(x + 998, y - 333 - 640, "tech", false);
                        spawn.mapVertex(x + 1000, y + -0, "575 0  -575 0  -450 -100  450 -100"); //base
                    } else { //lower chamber
                        spawn.mapRect(x + 400, y + -10, 1200, 50); //raised floor 
                        spawn.mapRect(x + 450, y + -20, 1100, 50);
                        spawn.mapRect(x + 450, y + -675, 1100, 25); //chamber ceiling
                        spawn.mapRect(x + 550, y + -685, 900, 25);
                        powerUps.spawn(x + 998, y - 333, "tech", false);
                    }
                    const powerUp1 = powerUp[powerUp.length - 1]
                    if (powerUp1) powerUp1.holdPosition = { x: powerUp1.position.x, y: powerUp1.position.y }
                    let isSpawnedMobs = false
                    doCustom.push(
                        () => {
                            ctx.fillStyle = "#e4e4e9" //"rgba(255,255,255,1)";
                            ctx.fillRect(x + 450, y + chamberY, 1100, 650); //chamber background
                            // if (!isInRoom && m.pos.x > x - 100 && m.pos.x < x + 2000 && m.pos.y > y - 1300 && m.pos.y < y) { //is player inside this room?
                            //     isInRoom = true
                            // } else 
                            if (powerUp1 && powerUp1.velocity.y !== 0) { //don't run this code if power up is gone //hack:  powerUp1.velocity.y !== 0 seems to only be true if the power up doesn't exist and is no longer being affected by gravity
                                ctx.strokeStyle = "#f0f"
                                ctx.lineWidth = 2;
                                if (Vector.magnitudeSquared(Vector.sub(m.pos, powerUp1.position)) < 90000) { //zone radius is 300
                                    //damage player and drain energy
                                    if (m.immuneCycle < m.cycle) {
                                        if (m.energy < 0.02) {
                                            //push out
                                            // const force = Vector.mult(Vector.normalise(Vector.sub(player.position, powerUp1.position)), 0.02 * player.mass)
                                            // player.force.x += force.x
                                            // player.force.y += force.y
                                            player.force.x += (player.position.x > powerUp1.position.x) ? 0.02 * player.mass : - 0.02 * player.mass

                                        } else {
                                            m.energy -= 0.01
                                            //friction
                                            Matter.Body.setVelocity(player, {
                                                x: player.velocity.x * 0.45,
                                                y: player.velocity.y * 0.98
                                            });
                                        }
                                    }

                                    //draw electricity going towards player
                                    const unit = Vector.normalise(Vector.sub(m.pos, powerUp1.position))
                                    let xElec = powerUp1.position.x + 40 * unit.x;
                                    let yElec = powerUp1.position.y + 40 * unit.y;
                                    ctx.beginPath();
                                    ctx.moveTo(xElec, yElec);
                                    const step = 40
                                    for (let i = 0; i < 6; i++) {
                                        xElec += step * (unit.x + 1.5 * (Math.random() - 0.5))
                                        yElec += step * (unit.y + 1.5 * (Math.random() - 0.5))
                                        ctx.lineTo(xElec, yElec);
                                    }
                                } else {
                                    //draw electricity going in random directions
                                    const angle = Math.random() * 2 * Math.PI
                                    const Dx = Math.cos(angle);
                                    const Dy = Math.sin(angle);
                                    let xElec = powerUp1.position.x + 40 * Dx;
                                    let yElec = powerUp1.position.y + 40 * Dy;
                                    ctx.beginPath();
                                    ctx.moveTo(xElec, yElec);
                                    const step = 40
                                    for (let i = 0; i < 6; i++) {
                                        xElec += step * (Dx + 1.5 * (Math.random() - 0.5))
                                        yElec += step * (Dy + 1.5 * (Math.random() - 0.5))
                                        ctx.lineTo(xElec, yElec);
                                    }
                                }
                                ctx.lineWidth = 2 * Math.random();
                                ctx.stroke(); //draw electricity

                                ctx.beginPath(); //outline damage zone
                                ctx.arc(powerUp1.position.x, powerUp1.position.y, 300, 0, 2 * Math.PI);
                                ctx.stroke();
                                //float power up in the air
                                Matter.Body.setPosition(powerUp1, {
                                    x: powerUp1.holdPosition.x + 4 * Math.random(), //1300 -2
                                    y: powerUp1.holdPosition.y + 4 * Math.random() //335 -2
                                });
                                Matter.Body.setVelocity(powerUp1, { x: 0, y: 0 });
                            } else if (!isSpawnedMobs) {
                                isSpawnedMobs = true
                                if (chamberY === -650) { //lower chamber
                                    spawn.randomMobPositions = [
                                        [x + 250, y + -650],
                                        [x + 1825, y + -600],
                                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                    spawn.randomMobFromArray()
                                    spawn.randomGroup(x + 275, y + -1050, mobSpawnChance);
                                    spawn.randomGroup(x + 675, y + -975, mobSpawnChance);
                                    spawn.randomGroup(x + 1225, y + -975, Infinity);
                                } else { //upper chamber
                                    spawn.randomMobPositions = [
                                        [x + 250, y + -650],
                                        [x + 1800, y + -625],
                                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                    spawn.randomMobFromArray()
                                    spawn.randomGroup(x + 300, y + -300, mobSpawnChance);
                                    spawn.randomGroup(x + 650, y + -275, mobSpawnChance);
                                    spawn.randomGroup(x + 1125, y + -300, Infinity);
                                }
                            }
                        }
                    )
                }
            ]
            upDownOptions = [ //extra tall vertical section 3000x3000  //this is where the level boss is
                (x = offset.x, y = offset.y) => { //mover
                    const button = level.button(x + 935, y + 0)
                    button.isUp = true
                    doCustomTopLayer.push(
                        () => {
                            button.draw();
                            if (button.isUp) {
                                button.query();
                                if (!button.isUp) {
                                    const mapStartingLength = map.length //track this so you know how many you added when running addMapToLevelInProgress
                                    addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the elements so they show up visually
                                        who.collisionFilter.category = cat.map;
                                        who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                                        Matter.Body.setStatic(who, true); //make static
                                        Composite.add(engine.world, who); //add to world
                                    }
                                    //map elements go here
                                    //box around portals
                                    spawn.mapRect(x + -50, y + -2700, 150, 110);
                                    spawn.mapRect(x + -50, y + -2440, 150, 25);
                                    spawn.mapRect(x + 1900, y + -2715, 150, 550);
                                    spawn.mapRect(x + 1900, y + -2015, 150, 50);
                                    spawn.mapRect(x + 1900, y + -1115, 150, 150);
                                    spawn.mapRect(x + 1900, y + -815, 150, 50);
                                    spawn.mapRect(x + -50, y + -340, 150, 50);
                                    // spawn.mapRect(x + -50, y + -640, 150, 150);
                                    spawn.mapRect(x + 1975, y - 1015, 50, 225);
                                    spawn.mapRect(x + 1975, y - 2190, 50, 200);
                                    spawn.mapRect(x + -25, y - 2615, 50, 200);
                                    spawn.mapRect(x + -25, y - 515, 75, 200);

                                    //ledge to get to upper left door
                                    // spawn.mapRect(x + -50, y - 1400, 100, 25);
                                    spawn.mapRect(x + -25, y - 1075, 250, 25);
                                    spawn.mapRect(x + -50, y - 1075, 150, 590);


                                    const rampSpeed = 8 //+ Math.floor(4 * Math.random())
                                    const mover4 = level.mover(x, y + -2425, 1000, 50, rampSpeed)
                                    const mover3 = level.mover(x + 1000, y + -2000, 1000, 50, rampSpeed)
                                    const mover2 = level.mover(x + 1000, y + -800, 1000, 50, -rampSpeed)
                                    const mover1 = level.mover(x, y + -325, 1000, 50, -rampSpeed)
                                    const portal1 = level.portal({
                                        x: x + 125,
                                        y: y - 415
                                    }, 2 * Math.PI, { //right
                                        x: x + 125,
                                        y: y - 2515
                                    }, 2 * Math.PI) //right

                                    const portal2 = level.portal({
                                        x: x + 1875,
                                        y: y - 890
                                    }, Math.PI, { //left
                                        x: x + 1875,
                                        y: y - 2090
                                    }, Math.PI) //left

                                    doCustom.push(() => {
                                        portal1[2].query()
                                        portal1[3].query()
                                        portal2[2].query()
                                        portal2[3].query()
                                        mover1.push();
                                        mover2.push();
                                        mover3.push();
                                        mover4.push();
                                    })
                                    doCustomTopLayer.push(() => {
                                        portal1[0].draw();
                                        portal1[1].draw();
                                        portal1[2].draw();
                                        portal1[3].draw();
                                        portal2[0].draw();
                                        portal2[1].draw();
                                        portal2[2].draw();
                                        portal2[3].draw();
                                        mover1.draw();
                                        mover2.draw();
                                        mover3.draw();
                                        mover4.draw();
                                    })
                                    for (let i = 0, numberOfMapElementsAdded = map.length - mapStartingLength; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])
                                    simulation.draw.setPaths() //update map graphics

                                    //blocks that ride the movers and portals
                                    spawn.bodyRect(x + 175, y + -2525, 50, 75);
                                    spawn.bodyRect(x + 300, y + -2525, 50, 50);
                                    spawn.bodyRect(x + 500, y + -2525, 80, 75);

                                    //mobs go here
                                    spawn.randomMobPositions = [
                                        [x + 175, y + -125],
                                        [x + 1775, y + -125],
                                        // [x + 1750, y + -525],
                                        [x + 225, y + -1000],
                                        [x + 1675, y + -1075],
                                        // [x + 1575, y + -2450],
                                        [x + 425, y + -1850],
                                        [x + 1425, y + -1200],
                                        [x + 350, y + -1000],
                                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                    spawn.randomMobFromArray()
                                    spawn.randomLevelBoss(x + 475, y + -1475);
                                    spawn.secondaryBossChance(x + 1425, y + -1425);
                                }
                            }
                        }
                    )
                },
                (x = offset.x, y = offset.y) => { //hopBoss2
                    const button = level.button(x + 935, y + 0)
                    button.isUp = true
                    // spawn.mapVertex(x + 5, y + -1318, "0 0  0 -250  125 -250"); //left ledges
                    // spawn.mapVertex(x + 1995, y + -1318, "0 0  0 -250  -125 -250"); // right ledges
                    doCustomTopLayer.push(
                        () => {
                            button.draw();
                            if (button.isUp) {
                                button.query();
                                if (!button.isUp) {
                                    const mapStartingLength = map.length //track this so you know how many you added when running addMapToLevelInProgress
                                    addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the elements so they show up visually
                                        who.collisionFilter.category = cat.map;
                                        who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                                        Matter.Body.setStatic(who, true); //make static
                                        Composite.add(engine.world, who); //add to world
                                    }
                                    //map elements go here
                                    spawn.mapRect(x + 150, y + -1400, 750, 50);
                                    spawn.mapRect(x + 1100, y + -1400, 750, 50);
                                    spawn.mapRect(x + 1825, y + -1050, 200, 50);
                                    spawn.mapRect(x + -25, y + -1050, 200, 50);
                                    spawn.mapRect(x + 1825, y + -325, 200, 50);
                                    spawn.mapRect(x + -25, y + -325, 200, 50);
                                    spawn.mapRect(x + 275, y + -700, 525, 50);
                                    spawn.mapRect(x + 1200, y + -700, 525, 50);
                                    spawn.mapRect(x + -25, y + -1400, 125, 1125); //side walls
                                    spawn.mapRect(x + 1900, y + -1400, 150, 1125);
                                    spawn.mapRect(x + 1900, y + -2700, 125, 1000);
                                    spawn.mapRect(x + -50, y + -2725, 150, 1025);
                                    spawn.mapRect(x + -25, y + -1750, 450, 50);
                                    spawn.mapRect(x + 1575, y + -1750, 450, 50);
                                    spawn.mapRect(x + 525, y + -1750, 950, 50);
                                    for (let i = 0, numberOfMapElementsAdded = map.length - mapStartingLength; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])
                                    simulation.draw.setPaths() //update map graphics
                                    //mobs go here
                                    powerUps.spawn(x + 50, y - 1525, "ammo");
                                    powerUps.spawn(x + 1950, y - 1525, "ammo");
                                    powerUps.spawn(x + 1900, y - 1525, "ammo");
                                    if (simulation.difficultyMode > 1 || level.levelsCleared > 1) {
                                        spawn.hopMotherBoss(x + 800, y + -2200)
                                    } else {
                                        powerUps.spawnBossPowerUp(2800, -1400)
                                    }
                                    for (let i = 0; i < 4; ++i) spawn.hopBullet(x + 150 + 750 * Math.random(), y + -1600)
                                    for (let i = 0; i < 4; ++i) spawn.hopBullet(x + 1100 + 750 * Math.random(), y + -1600)
                                    spawn.hopper(x + 1550, y + -775);
                                    spawn.hopper(x + 500, y + -775);
                                    spawn.hopper(x + 500, y + -2200);
                                    spawn.hopper(x + 1100, y + -2200);
                                    spawn.hopMother(x + 1400, y + -775);
                                    spawn.hopMother(x + 550, y + -775);
                                    spawn.hopMother(x + 525, y + -1475);
                                    spawn.hopMother(x + 1550, y + -1500);
                                }
                            }
                        }
                    )
                },
                (x = offset.x, y = offset.y) => {
                    // const toggle = level.toggle(x + 950, y + 0, false, true) //    toggle(x, y, isOn = false, isLockOn = false) {
                    // toggle.isAddedElements = false

                    const button = level.button(x + 935, y + 0)
                    button.isUp = true


                    spawn.mapVertex(x + 5, y + -1318, "0 0  0 -250  125 -250"); //left ledges
                    spawn.mapVertex(x + 1995, y + -1318, "0 0  0 -250  -125 -250"); // right ledges
                    doCustomTopLayer.push(
                        () => {
                            button.draw();
                            if (button.isUp) {
                                button.query();
                                if (!button.isUp) {
                                    // toggle.isAddedElements = true //only do this once
                                    addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all  the elements so they show up visually
                                        who.collisionFilter.category = cat.map;
                                        who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                                        Matter.Body.setStatic(who, true); //make static
                                        Composite.add(engine.world, who); //add to world
                                    }
                                    let r = 150
                                    let hexagon = `${r} 0   ${r * Math.cos(5.236)} ${r * Math.sin(5.236)}    ${r * Math.cos(4.189)} ${r * Math.sin(4.189)}     ${-r} 0     ${r * Math.cos(2.0944)} ${r * Math.sin(2.0944)}      ${r * Math.cos(1.0472)} ${r * Math.sin(1.0472)}  `
                                    //450 horizontal spread //  -130-130-130 = 390 vertical
                                    if (Math.random() < 0.5) {
                                        spawn.mapVertex(x + 775, y + -260, hexagon);
                                        spawn.mapVertex(x + 1225, y + -260, hexagon);

                                        spawn.mapVertex(x + 550, y + -650, hexagon);
                                        spawn.mapVertex(x + 1000, y + -650, hexagon);
                                        spawn.mapVertex(x + 1450, y + -650, hexagon);

                                        spawn.mapVertex(x + 325, y + -1040, hexagon);
                                        spawn.mapVertex(x + 775, y + -1040, hexagon);
                                        spawn.mapVertex(x + 1225, y + -1040, hexagon);
                                        spawn.mapVertex(x + 1675, y + -1040, hexagon);

                                        spawn.mapVertex(x + 550, y + -1430, hexagon);
                                        spawn.mapVertex(x + 1000, y + -1430, hexagon);
                                        spawn.mapVertex(x + 1450, y + -1430, hexagon);

                                        const numberOfMapElementsAdded = 12
                                        for (let i = 0; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])
                                        spawn.randomMobPositions = [
                                            [x + 225, y + -1775],
                                            [x + 700, y + -1750],
                                            [x + 1175, y + -1725],
                                            [x + 1700, y + -1700],
                                            [x + 1750, y + -250],
                                            [x + 125, y + -250],
                                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                        spawn.randomMobFromArray()
                                    } else {
                                        spawn.mapVertex(x + 775, y + -260, hexagon);
                                        spawn.mapVertex(x + 1225, y + -260, hexagon);

                                        spawn.mapVertex(x + 550, y + -650, hexagon);
                                        spawn.mapVertex(x + 1000, y + -650, hexagon);
                                        spawn.mapVertex(x + 1450, y + -650, hexagon);

                                        spawn.mapVertex(x + 775, y + -1040, hexagon);
                                        spawn.mapVertex(x + 1225, y + -1040, hexagon);

                                        spawn.mapVertex(x + 550, y + -1430, hexagon);
                                        spawn.mapVertex(x + 1000, y + -1430, hexagon);
                                        spawn.mapVertex(x + 1450, y + -1430, hexagon);

                                        spawn.mapVertex(x + 775, y + -1820, hexagon);
                                        spawn.mapVertex(x + 1225, y + -1820, hexagon);
                                        const numberOfMapElementsAdded = 12
                                        for (let i = 0; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])

                                        spawn.randomMobPositions = [
                                            [x + 225, y + -1025],
                                            [x + 250, y + -1025],
                                            [x + 200, y + -675],
                                            [x + 225, y + -200],
                                            [x + 1750, y + -1075],
                                            [x + 1700, y + -650],
                                            [x + 1725, y + -650],
                                            [x + 1675, y + -175],
                                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                        spawn.randomMobFromArray()
                                    }
                                    simulation.draw.setPaths() //update map graphics
                                    spawn.randomGroup(x + 300, y + -2200);
                                    spawn.randomGroup(x + 1625, y + -2200);
                                    spawn.randomLevelBoss(x + 700, y + -2300);
                                    spawn.secondaryBossChance(x + 1250, y + -2300)
                                }
                            }
                        }
                    )
                },
                (x = offset.x, y = offset.y) => {
                    // const toggle = level.toggle(x + 950, y + 0, false, true) //    toggle(x, y, isOn = false, isLockOn = false) {
                    // toggle.isAddedElements = false
                    const button = level.button(x + 935, y + 0)
                    button.isUp = true
                    //left ledges
                    spawn.mapVertex(x + 5, y + -1868, "0 0  0 -250  125 -250");
                    spawn.mapVertex(x + 5, y + -1318, "0 0  0 -250  125 -250"); //door
                    spawn.mapVertex(x + 5, y + -768, "0 0  0 -250  125 -250");
                    // right ledges
                    spawn.mapVertex(x + 2000, y + -1868, "0 0  0 -250  -125 -250");
                    spawn.mapVertex(x + 2000, y + -1318, "0 0  0 -250  -125 -250"); //door
                    spawn.mapVertex(x + 2000, y + -768, "0 0  0 -250  -125 -250");

                    doCustomTopLayer.push(
                        () => {
                            button.draw();
                            if (button.isUp) {
                                button.query();
                                if (!button.isUp) {
                                    addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all  the elements so they show up visually
                                        who.collisionFilter.category = cat.map;
                                        who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                                        Matter.Body.setStatic(who, true); //make static
                                        Composite.add(engine.world, who); //add to world
                                    }
                                    //right side hexagons
                                    let r = 300
                                    let hexagon = `${r} 0   ${r * Math.cos(5.236)} ${r * Math.sin(5.236)}    ${r * Math.cos(4.189)} ${r * Math.sin(4.189)}     ${-r} 0     ${r * Math.cos(2.0944)} ${r * Math.sin(2.0944)}      ${r * Math.cos(1.0472)} ${r * Math.sin(1.0472)}  `
                                    spawn.mapVertex(x + 1640, y + -365, hexagon);
                                    // r = 275
                                    // let hexagonHalf = `${r} 0   ${r*Math.cos(5.236)} ${r*Math.sin(5.236)}    ${r*Math.cos(4.189)} ${r*Math.sin(4.189)}     ${-r} 0 `
                                    // spawn.mapVertex(x + 2300, y + -75, hexagonHalf);
                                    r = 150
                                    const hexagon150 = `${r} 0   ${r * Math.cos(5.236)} ${r * Math.sin(5.236)}    ${r * Math.cos(4.189)} ${r * Math.sin(4.189)}     ${-r} 0     ${r * Math.cos(2.0944)} ${r * Math.sin(2.0944)}      ${r * Math.cos(1.0472)} ${r * Math.sin(1.0472)}  `
                                    // spawn.mapVertex(x + 1750, y + -550, hexagon150);
                                    spawn.mapVertex(x + 1750, y + -1100, hexagon150);
                                    spawn.mapVertex(x + 1750, y + -1650, hexagon150);
                                    spawn.mapVertex(x + 1750, y + -2200, hexagon150);

                                    //left side
                                    r = 350
                                    let hexagonHalf = `${r} 0   ${r * Math.cos(5.236)} ${r * Math.sin(5.236)}    ${r * Math.cos(4.189)} ${r * Math.sin(4.189)}     ${-r} 0 `
                                    spawn.mapVertex(x + 425, y + -90, hexagonHalf);

                                    spawn.mapVertex(x + 850, y + -500, hexagon150);
                                    spawn.mapVertex(x + 550, y + -850, hexagon150);
                                    spawn.mapVertex(x + 250, y + -1200, hexagon150);
                                    spawn.mapVertex(x + 250, y + -1700, hexagon150);
                                    spawn.mapVertex(x + 725, y + -1950, hexagon150);
                                    spawn.mapVertex(x + 1200, y + -2200, hexagon150);
                                    const numberOfMapElementsAdded = 11
                                    for (let i = 0; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])

                                    spawn.randomMobPositions = [
                                        [x + 1050, y + -1500],
                                        [x + 1075, y + -1500],
                                        [x + 325, y + -550],
                                        [x + 800, y + -925],
                                        [x + 1400, y + -1250],
                                        [x + 1325, y + -1725],
                                        [x + 1350, y + -1725],
                                        [x + 575, y + -1375],
                                        [x + 225, y + -2275],
                                        [x + 875, y + -2450],
                                        [x + 1550, y + -2525],
                                        [x + 1525, y + -2525],
                                    ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                                    spawn.randomMobFromArray()
                                    spawn.randomLevelBoss(x + 1075, y + -1500);
                                    spawn.secondaryBossChance(x + 1200, y + -1000)
                                    simulation.draw.setPaths() //update map graphics
                                }
                            }
                        }
                    )
                },
            ]
            //pick which type of room spawns
            enter = enterOptions[Math.floor(Math.random() * enterOptions.length)];
            exit = exitOptions[Math.floor(Math.random() * exitOptions.length)];
            empty = emptyOptions[Math.floor(Math.random() * emptyOptions.length)];
            loot = lootOptions[Math.floor(Math.random() * lootOptions.length)];
            upDown = upDownOptions[Math.floor(Math.random() * upDownOptions.length)];
            // upDown = upDownOptions[0] //controls what level spawns for map designing building //********************************* DO   !NOT!  RUN THIS LINE IN THE FINAL VERSION ***************************************
            //3x2:  4 short rooms (3000x1500),  1 double tall room (3000x3000)
            //rooms
            let rooms = ["exit", "loot", "enter", "empty"]
            rooms.sort(() => Math.random() - 0.5);
            //look... you and I both know there is a better way to do this, but it works so I'm gonna focus on other things
            while ( //makes sure that the exit and entrance aren't both on the same floor
                (rooms[0] === "enter" && rooms[2] === "exit") ||
                (rooms[2] === "enter" && rooms[0] === "exit") ||
                (rooms[1] === "enter" && rooms[3] === "exit") ||
                (rooms[3] === "enter" && rooms[1] === "exit")
            ) rooms.sort(() => Math.random() - 0.5);
            for (let i = 0; i < rooms.length; i++) {
                if (rooms[i] === "enter") rooms[i] = enter
                if (rooms[i] === "exit") rooms[i] = exit
                if (rooms[i] === "empty") rooms[i] = empty
                if (rooms[i] === "loot") rooms[i] = loot
            }
            // rooms = [enter, exit, loot, empty, ] //controls what level spawns for map designing building //********************************* DO   !NOT!  RUN THIS LINE IN THE FINAL VERSION ***************************************

            outline = (isLower = true) => {
                spawn.mapRect(offset.x - 100, offset.y - 1400, 2100, 100); //ceiling
                if (isLower) spawn.mapRect(offset.x - 100, offset.y, 2200, 100); //only draw floor if on the lower level
                if (!isDoorLeft) spawn.mapRect(offset.x - 100, offset.y - 1400, 100, 1500); //left wall
                if (isDoorRight) { //if door only add wall on right side
                    spawn.mapRect(offset.x + 2000, offset.y - 1400, 100, 1225); //right wall
                    spawn.mapRect(offset.x + 2000, offset.y - 10, 100, 20); //right doorstep
                    const doorWidth = 15 + Math.floor(100 * Math.random() * Math.random())
                    spawn.bodyRect(offset.x + 2050 - doorWidth / 2, offset.y - 175, doorWidth, 165); //block door
                } else {
                    spawn.mapRect(offset.x + 2000, offset.y - 1400, 100, 1500); //right wall
                }
            }
            outlineUpDown = () => {
                spawn.mapRect(offset.x - 100, offset.y + 0, 2100, 100); //floor
                spawn.mapRect(offset.x - 100, offset.y - 2800, 2100, 100); //ceiling
                if (!isDoorLeft) spawn.mapRect(offset.x - 100, offset.y - 2800, 100, 2900); //left wall
                if (isDoorRight) { //if door only add wall on right side
                    //upper door
                    spawn.mapRect(offset.x + 2000, offset.y - 2800, 100, 1225); //right wall
                    spawn.mapRect(offset.x + 2000, offset.y - 1410, 100, 20); //right doorstep
                    const doorWidth = 15 + Math.floor(100 * Math.random() * Math.random())
                    spawn.bodyRect(offset.x + 2050 - doorWidth / 2, offset.y - 1575, doorWidth, 165); //block door
                    //lower door
                    spawn.mapRect(offset.x + 2000, offset.y - 1400, 100, 1225); //right wall
                    spawn.mapRect(offset.x + 2000, offset.y - 10, 100, 20); //right doorstep
                    const doorWidth2 = 15 + Math.floor(100 * Math.random() * Math.random())
                    spawn.bodyRect(offset.x + 2050 - doorWidth2 / 2, offset.y - 175, doorWidth2, 165); //block door
                } else {
                    spawn.mapRect(offset.x + 2000, offset.y - 2800, 100, 2900); //right wall
                }
            }

            let columns = [
                () => {
                    offset.y = 0
                    outlineUpDown()
                    upDown()
                },
                () => {
                    offset.y = 0
                    outline()
                    rooms[0]()

                    offset.y = -1400
                    outline(false)
                    rooms[1]()
                },
                () => {
                    offset.y = 0
                    outline()
                    rooms[2]()

                    offset.y = -1400
                    outline(false)
                    rooms[3]()
                },
            ]
            columns.sort(() => Math.random() - 0.5);
            for (let i = 0; i < 3; i++) {
                if (i === 0) {
                    isDoorLeft = false
                    isDoorRight = true
                } else if (i === 1) {
                    isDoorLeft = true
                    isDoorRight = true
                } else {
                    isDoorLeft = true
                    isDoorRight = false
                }
                offset.x = i * 2100
                columns[i]()
            }
            spawn.randomMobFromArray()
            level.custom = () => {
                for (let i = 0, len = doCustom.length; i < len; i++) doCustom[i]() //runs all the active code from each room
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                for (let i = 0, len = doCustomTopLayer.length; i < len; i++) doCustomTopLayer[i]() //runs all the active code from each room
            };
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        pavilion() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(900, 300, true)
            } else {
                level.announceText(-900, 300, true)
            }

            level.announceMobTypes()
            level.fallMode = "start";
            const vanish = []
            level.exit.x = -850;
            level.exit.y = -1485;
            spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 25);
            level.setPosToSpawn(-900, 225); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.defaultZoom = 1500
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#dcdcde";
            // spawn.debris(-150, -775, 1425, 3); //16 debris per level
            // spawn.debris(1525, -25, 950, 3); //16 debris per level
            // spawn.debris(-650, -2100, 575, 2); //16 debris per level
            powerUps.chooseRandomPowerUp(2075, -1525);
            powerUps.chooseRandomPowerUp(2550, -1825);
            powerUps.chooseRandomPowerUp(1975, 250);
            //bottom floor
            //entrance
            spawn.mapRect(-200, -750, 1500, 100);
            // spawn.mapRect(-575, 0, 2150, 500);
            spawn.mapRect(-575, 0, 2150, 165);
            const mover = level.mover(-525, 270, 2050, 75, 15 * (simulation.isHorizontalFlipped ? -1 : 1))
            spawn.bodyRect(-1050, -75, 75, 75);
            spawn.bodyRect(-573, 170, 30, 105);

            // spawn.mapRect(-1275, 275, 875, 225);
            spawn.mapRect(-1300, 275, 4025, 3300);
            // spawn.mapRect(-1275, 275, 3975, 225);
            spawn.mapRect(-1050, 0, 325, 50);
            spawn.mapRect(-775, 0, 50, 140);
            vanish.push(level.vanish(-725, 13, 150, 25))
            spawn.mapRect(-200, -750, 100, 600);
            vanish.push(level.vanish(-525, -150, 425, 150))
            vanish.push(level.vanish(-475, -300, 275, 150))
            vanish.push(level.vanish(-425, -450, 225, 150))
            vanish.push(level.vanish(-375, -600, 175, 150))
            vanish.push(level.vanish(-325, -750, 125, 150))
            spawn.mapRect(2475, -1800, 250, 2300);
            spawn.mapRect(1200, -750, 100, 450);
            spawn.mapRect(1200, -375, 250, 75);
            powerUps.spawnStartingPowerUps(550, -100);
            spawn.mapRect(125, -10, 850, 50);
            spawn.mapRect(175, -20, 750, 50);
            spawn.bodyRect(1350, -175, 150, 175, 0.5);
            spawn.bodyRect(1350, -600, 125, 225, 0.2);

            spawn.bodyRect(1575, 50, 50, 225);
            vanish.push(level.vanish(1900, -25, 325, 25))
            vanish.push(level.vanish(1925, -375, 275, 25))
            vanish.push(level.vanish(1950, -725, 225, 25))
            vanish.push(level.vanish(1950, -1075, 225, 25))
            spawn.mapRect(1950, -1500, 225, 25);
            vanish.push(level.vanish(1350, -1075, 225, 25))
            vanish.push(level.vanish(1637, -1300, 225, 25))

            //middle floor
            spawn.bodyRect(215, -1175, 100, 100, 0.3);
            spawn.mapRect(-1300, -1800, 250, 2300);
            if (Math.random() < 0.5) {
                spawn.mapRect(500, -1350, 525, 425);
                spawn.mapRect(25, -1050, 300, 198);
            } else {
                spawn.mapRect(500, -1350, 525, 497);
                spawn.mapRect(25, -1050, 300, 150);
            }
            spawn.bodyRect(225, -850, 50, 100, 0.4);
            // spawn.mapRect(600, -1800, 325, 225);
            spawn.mapRect(650, -1800, 225, 225);
            vanish.push(level.vanish(600, -1575, 100, 225))
            vanish.push(level.vanish(825, -1575, 100, 225))

            spawn.bodyRect(1050, -1825, 250, 20, 0.2);

            vanish.push(level.vanish(1125, -1800, 625, 25))
            vanish.push(level.vanish(-50, -1800, 450, 25))
            //exit
            spawn.mapRect(-575, -1800, 50, 200);
            spawn.mapRect(-1050, -1800, 525, 75);
            spawn.mapRect(-1050, -1450, 700, 75);

            spawn.randomMobPositions = [
                [-1175, -1975],
                [275, -1500],
                [700, -1875],
                [2000, -800],
                [2600, -1850],
                [1425, -525],
                [2025, -1600],
                [1625, -1875],
                [-150, -1975],
                [900, -825, true],
                [1050, -50, true]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(750, -2150, -0.8)
            spawn.randomLevelBoss(2050, -2025)
            spawn.secondaryBossChance(100, -1500)
            //spawn.randomHigherTierMob(1232, -803)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                level.setPosToSpawn(900, 225); //normal spawn
                level.custom = () => {
                    ctx.fillStyle = "rgba(0, 10, 30, 0.04)"//"#d0d3d9"
                    ctx.fillRect(-2500, -1800, 3575, 2100);
                    ctx.fillStyle = "#c0c3c9"
                    ctx.fillRect(-2075, -1475, 25, 1800);
                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(550, -1800, 525, 350)

                    level.exit.drawAndCheck();
                    level.enter.draw();
                    mover.push();
                };
                level.customTopLayer = () => {
                    mover.draw();
                    //shadow
                    ctx.fillStyle = "rgba(0,10,30,0.1)"
                    ctx.fillRect(-1450, -300, 150, 325);
                    ctx.fillRect(-1300, -650, 1500, 650)
                    ctx.fillRect(725, 50, 325, 225)
                    ctx.fillRect(-325, -950, 300, 225)
                    ctx.fillRect(-1025, -1000, 525, 275);
                    ctx.fillRect(-875, -1600, 225, 275);
                    ctx.fillStyle = "rgba(68,68,68,0.93)"
                    ctx.fillRect(-1575, 150, 2150, 150);
                    for (let i = 0, len = vanish.length; i < len; i++) vanish[i].query()
                };

            } else {
                level.custom = () => {
                    ctx.fillStyle = "rgba(0, 10, 30, 0.04)"//"#d0d3d9"
                    ctx.fillRect(-1075, -1800, 3575, 2100);
                    ctx.fillStyle = "#c0c3c9"
                    ctx.fillRect(2050, -1475, 25, 1800);
                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(-1050, -1800, 525, 350)

                    level.exit.drawAndCheck();
                    level.enter.draw();
                    mover.push();
                };
                level.customTopLayer = () => {
                    mover.draw();
                    //shadow
                    ctx.fillStyle = "rgba(0,10,30,0.1)"
                    ctx.fillRect(1300, -300, 150, 325);
                    ctx.fillRect(-200, -675, 1500, 700)
                    ctx.fillRect(500, -950, 525, 225);
                    ctx.fillRect(650, -1600, 225, 275);
                    ctx.fillRect(-1050, 50, 325, 225)
                    ctx.fillRect(25, -950, 300, 225)
                    ctx.fillStyle = "rgba(68,68,68,0.93)"
                    ctx.fillRect(-575, 150, 2150, 150);
                    for (let i = 0, len = vanish.length; i < len; i++) vanish[i].query()
                };
            }
        },
        testChamber() {
            level.announceText(0, 20, true)
            level.announceMobTypes()
            level.setPosToSpawn(0, -50); //lower start
            level.exit.y = level.enter.y - 550;
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = level.enter.x;
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
            level.defaultZoom = 2200
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d0d5d5";
            color.map = "#444"
            spawn.mapRect(0, -1955, 175, 30);
            const removeIndex1 = map.length - 1 //so much work to catch blocks caught at the bottom of the vertical portals
            spawn.mapRect(1225, -1955, 175, 30);
            const removeIndex2 = map.length - 1 //so much work to catch blocks caught at the bottom of the vertical portals
            let portal, portal2, portal3
            // const hazard = level.hazard((simulation.isHorizontalFlipped ? -350 - 700 : 350), -2025, 700, 10, 0.4) //laser
            // const hazard2 = level.hazard((simulation.isHorizontalFlipped ? -1775 - 150 : 1775), -2550, 150, 10, 0.4) //laser
            // const hazard = level.laser({ x: (simulation.isHorizontalFlipped ? -350 - 700 : 350), y: -2025 }, { x: 700 + (simulation.isHorizontalFlipped ? -350 - 700 : 350), y: -2025 }) ////x, y, width, height, damage = 0.002)
            // const hazard2 = level.laser({ x: 145 + (simulation.isHorizontalFlipped ? -1775 - 150 : 1775), y: -2545 }, { x: (simulation.isHorizontalFlipped ? -1775 - 150 : 1775), y: -2545 }) ////x, y, width, height, damage = 0.002)
            let hazard, hazard2
            if (simulation.isHorizontalFlipped) {
                hazard = level.laser({ x: -360, y: -2020 }, { x: -1050, y: -2020 }) ////x, y, width, height, damage = 0.002)
                hazard2 = level.laser({ x: - 1920, y: -2545 }, { x: -1775, y: -2545 }) ////x, y, width, height, damage = 0.002)
            } else {
                hazard = level.laser({ x: 360, y: -2020 }, { x: 700 + 360, y: -2020 }) ////x, y, width, height, damage = 0.002)
                hazard2 = level.laser({ x: 145 + 1775, y: -2545 }, { x: 1775, y: -2545 }) ////x, y, width, height, damage = 0.002)
            }
            spawn.mapRect(340, -2032.5, 20, 25); //laser nose
            spawn.mapRect(1920, -2557.5, 20, 25); //laser nose
            const button = level.button(2100, -2600)
            const buttonDoor = level.button(600, -550)
            const door = level.door(312, -750, 25, 190, 185)

            level.custom = () => {
                if (!(m.cycle % 60)) { //so much work to catch blocks caught at the bottom of the vertical portals
                    let touching = Matter.Query.collides(map[removeIndex1], body)
                    if (touching.length) {
                        Matter.Composite.remove(engine.world, touching[0].bodyB);
                        for (let i = 0, len = body.length; i < len; i++) {
                            if (body[i].id === touching[0].bodyB.id) {
                                body.splice(i, 1);
                                break
                            }
                        }
                    }
                    touching = Matter.Query.collides(map[removeIndex2], body)
                    if (touching.length) {
                        Matter.Composite.remove(engine.world, touching[0].bodyB);
                        for (let i = 0, len = body.length; i < len; i++) {
                            if (body[i].id === touching[0].bodyB.id) {
                                body.splice(i, 1);
                                break
                            }
                        }
                    }
                }

                buttonDoor.query();
                buttonDoor.draw();
                if (buttonDoor.isUp) {
                    door.isClosing = true
                } else {
                    door.isClosing = false
                }
                door.openClose();

                portal[2].query()
                portal[3].query()
                portal2[2].query()
                portal2[3].query()
                portal3[2].query()
                portal3[3].query()
                button.query();
                button.draw();

                ctx.fillStyle = "#d4f4f4"
                ctx.fillRect(-300, -1000, 650, 500)
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                door.draw();
                if (!button.isUp) {
                    hazard.query();
                    hazard2.query();
                }

                portal[0].draw();
                portal[1].draw();
                portal[2].draw();
                portal[3].draw();
                portal2[0].draw();
                portal2[1].draw();
                portal2[2].draw();
                portal2[3].draw();
                portal3[0].draw();
                portal3[1].draw();
                portal3[2].draw();
                portal3[3].draw();
            };
            powerUps.spawnStartingPowerUps(1875, -3075);

            const powerUpPos = [{ //no debris on this level but 2 random spawn instead
                x: -150,
                y: -1775
            }, {
                x: 2400,
                y: -2650
            }, {
                x: -175,
                y: -1375
            }, {
                x: 1325,
                y: -150
            }];
            powerUpPos.sort(() => Math.random() - 0.5);
            powerUps.chooseRandomPowerUp(powerUpPos[0].x, powerUpPos[0].y);
            powerUps.chooseRandomPowerUp(powerUpPos[1].x, powerUpPos[1].y);
            //outer wall
            spawn.mapRect(2500, -3700, 1200, 3800); //right map wall
            spawn.mapRect(-1400, -3800, 1100, 3900); //left map wall
            spawn.mapRect(-1400, -4800, 5100, 1200); //map ceiling
            spawn.mapRect(-1400, 0, 5100, 1200); //floor
            //lower entrance /exit
            spawn.mapRect(300, -375, 50, 225);
            spawn.bodyRect(312, -150, 25, 140);
            spawn.mapRect(300, -10, 50, 50);
            spawn.mapVertex(1555, 0, "625 0   75 0   200 -100   500 -100"); //entrance ramp
            //upper entrance / exit
            spawn.mapRect(-400, -1050, 750, 50);
            spawn.mapRect(300, -1050, 50, 300);
            // spawn.bodyRect(312, -750, 25, 190);
            spawn.mapRect(300, -560, 50, 50);
            spawn.bodyRect(750, -725, 125, 125);
            spawn.mapRect(1150, -1050, 250, 575);
            spawn.mapRect(1725, -550, 50, 200); //walls around portal 3
            spawn.mapRect(1925, -550, 500, 200);
            spawn.mapRect(1750, -390, 200, 40);
            spawn.mapRect(-400, -550, 1800, 200);
            spawn.mapRect(-200, -1700, 150, 25); //platform above exit room
            spawn.mapRect(-200, -1325, 350, 25);
            //portal 3 angled
            spawn.mapRect(2425, -450, 100, 100);
            //portal 1 bottom
            spawn.mapRect(2290, -10, 375, 100);
            spawn.mapRect(2350, -20, 375, 100);
            spawn.mapRect(2410, -30, 375, 100);
            //portal 1 top
            spawn.mapRect(2290, -3010, 375, 50);
            spawn.mapRect(2350, -3020, 375, 50);
            spawn.mapRect(2410, -3030, 375, 50);
            spawn.mapRect(1400, -3000, 1300, 50); //floor
            spawn.mapRect(1750, -3050, 250, 75);
            spawn.mapRect(1400, -3625, 50, 200);
            spawn.mapRect(350, -3625, 50, 225);
            spawn.mapRect(350, -3260, 50, 60);
            spawn.mapRect(200, -3250, 1240, 50);
            spawn.mapRect(1400, -3260, 50, 310);
            spawn.bodyRect(1412, -3425, 25, 165);
            spawn.mapRect(-150, -2925, 150, 25);
            //portal 2
            spawn.mapRect(-300, -2600, 300, 675); //left platform
            spawn.mapRect(1400, -2600, 375, 675); //right platform
            spawn.mapRect(1925, -2600, 775, 675); //far right platform
            spawn.bodyRect(2130, -2660, 50, 50); //button's block
            spawn.mapRect(150, -2100, 200, 175);
            spawn.mapRect(1050, -2100, 200, 175);
            //mobs
            spawn.randomMobPositions = [
                [1075, -3500],
                [2175, -700],
                [-75, -850],
                [550, -3400],
                [0, -1175],
                [-75, -1150],
                [1075, -625],
                [800, -3400],
                [1225, -3375],
                [1200, -1125],
                [2050, -950],
                [2300, -2775],
                [600, -925],
                [1550, -2750],
                [1350, -1150],
                [-75, -1475]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            if (Math.random() < 0.5) {
                spawn.randomLevelBoss(700, -1550);
            } else {
                spawn.randomLevelBoss(675, -2775);
            }

            spawn.secondaryBossChance(1925, -1250)
            //spawn.randomHigherTierMob(87, -1421)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                // level.setPosToSpawn(0, -50); //-x  // no need since 0
                button.min.x = -button.min.x - 126 // flip the button horizontally
                button.max.x = -button.max.x + 126 // flip the button horizontally
                buttonDoor.min.x = -buttonDoor.min.x - 126 // flip the button horizontally
                buttonDoor.max.x = -buttonDoor.max.x + 126 // flip the button horizontally

                //this makes the hazard draw, but not collide for reasons I don't understand
                //so don't use it, instead just call the hazard differently based on this flip flag
                // hazard.min.x = -hazard.min.x - hazard.width //-x-width
                // hazard.max.x = -hazard.max.x - hazard.width //-x-width
                // hazard2.min.x = -hazard2.min.x - hazard2.width //-x-width
                // hazard2.max.x = -hazard2.max.x - hazard2.width //-x-width
                portal = level.portal({
                    x: -2475,
                    y: -140
                }, 2 * Math.PI, { //right
                    x: -2475,
                    y: -3140
                }, 2 * Math.PI) //right

                portal2 = level.portal({
                    x: -75,
                    y: -2150
                }, -Math.PI / 2, { //up
                    x: -1325,
                    y: -2150
                }, -Math.PI / 2) //up

                portal3 = level.portal({
                    x: -1850,
                    y: -585
                }, -Math.PI / 2, { //up
                    x: -2425,
                    y: -600
                }, -1 * Math.PI / 3) //up left

                // level.custom = () => { };
                // level.customTopLayer = () => {};

            } else {
                portal = level.portal({
                    x: 2475,
                    y: -140
                }, Math.PI, { //left
                    x: 2475,
                    y: -3140
                }, Math.PI) //left
                portal2 = level.portal({
                    x: 75,
                    y: -2150
                }, -Math.PI / 2, { //up
                    x: 1325,
                    y: -2150
                }, -Math.PI / 2) //up
                portal3 = level.portal({
                    x: 1850,
                    y: -585
                }, -Math.PI / 2, { //up
                    x: 2425,
                    y: -600
                }, -2 * Math.PI / 3) //up left
            }

        },
        interferometer() {
            level.announceText(-1825, 2025, true)
            level.isVerticalFLipLevel = true
            mobs.maxMobBody = 20 //normally 40, but set to 10 to avoid too much clutter
            simulation.fallHeight = 4000
            level.announceMobTypes()
            level.setPosToSpawn(-1825, 1950); //lower start
            level.exit.x = -1875
            level.exit.y = 1355
            level.defaultZoom = 2300
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d0d5d5";
            color.map = "#444"
            powerUps.chooseRandomPowerUp(-1550, 300);
            powerUps.chooseRandomPowerUp(200, 50);
            powerUps.chooseRandomPowerUp(-975, -1475);
            powerUps.chooseRandomPowerUp(2150, -750);
            powerUps.chooseRandomPowerUp(1850, 1925);

            let buttons = []
            let lasers = []
            let balance = []
            let boost = []
            level.isFlipped = false;
            level.isFlipping = false;
            let isSpawned = false
            const flipAnimationCycles = 120

            let elevator = body[body.length] = Bodies.rectangle(800, 500, 200, 50, {
                collisionFilter: {
                    category: cat.body, //cat.map,
                    mask: cat.player | cat.body | cat.bullet | cat.mob | cat.mobBullet //| cat.powerUp
                },
                density: 0.1,
                inertia: Infinity, //prevents rotation
                isNotHoldable: true,
                friction: 1,
                frictionStatic: 1,
                restitution: 0,
                frictionAir: 1,
                classType: "body",
                holdX: 1712,
                maxHeight: -1580,
                minHeight: 90,
                verticalForce: 0.02,
                isUp: false,
                drag: 0.01,
                move() {
                    this.force.y -= this.mass * simulation.g; //undo gravity
                    if (!m.isTimeDilated) {
                        if (level.isFlipped) {
                            ctx.fillStyle = "#ccc"
                            ctx.fillRect(this.holdX, -this.maxHeight, 5, this.maxHeight - this.minHeight) //draw path

                            if (elevator.isUp) {
                                elevator.force.y += elevator.verticalForce * elevator.mass
                                if (elevator.position.y > -elevator.maxHeight) {
                                    elevator.isUp = false
                                    Matter.Body.setPosition(elevator, { x: elevator.holdX, y: -elevator.maxHeight });
                                    Matter.Body.setVelocity(elevator, { x: 0, y: 0 });
                                }
                            } else {
                                elevator.force.y -= (elevator.verticalForce) * elevator.mass
                                if (elevator.position.y < -elevator.minHeight) {
                                    elevator.isUp = true
                                    Matter.Body.setPosition(elevator, { x: elevator.holdX, y: -elevator.minHeight });
                                    Matter.Body.setVelocity(elevator, { x: 0, y: 0 });
                                }
                            }
                            //vertical position limits 
                            if (this.position.y > -elevator.maxHeight) {
                                Matter.Body.setPosition(elevator, { x: elevator.holdX, y: -elevator.maxHeight });
                            } else if (this.position.y < -elevator.minHeight) {
                                Matter.Body.setPosition(elevator, { x: elevator.holdX, y: -elevator.minHeight });
                            }
                        } else {
                            ctx.fillStyle = "#ccc"
                            ctx.fillRect(this.holdX, this.maxHeight, 5, this.minHeight - this.maxHeight) //draw path

                            if (elevator.isUp) {
                                elevator.force.y -= elevator.verticalForce * elevator.mass
                                if (elevator.position.y < elevator.maxHeight) {
                                    elevator.isUp = false
                                    Matter.Body.setPosition(elevator, { x: elevator.holdX, y: elevator.maxHeight });
                                    Matter.Body.setVelocity(elevator, { x: 0, y: 0 });
                                }
                            } else {
                                elevator.force.y += (elevator.verticalForce) * elevator.mass
                                if (elevator.position.y > elevator.minHeight) {
                                    elevator.isUp = true
                                    Matter.Body.setPosition(elevator, { x: elevator.holdX, y: elevator.minHeight });
                                    Matter.Body.setVelocity(elevator, { x: 0, y: 0 });
                                }
                            }
                            //vertical position limits 
                            if (this.position.y < elevator.maxHeight) {
                                Matter.Body.setPosition(elevator, { x: elevator.holdX, y: elevator.maxHeight });
                            } else if (this.position.y > elevator.minHeight) {
                                Matter.Body.setPosition(elevator, { x: elevator.holdX, y: elevator.minHeight });
                            }
                        }
                    }
                    Matter.Body.setVelocity(elevator, { x: 0, y: elevator.velocity.y * this.drag }); //zero horizontal velocity and drag
                    Matter.Body.setPosition(elevator, { x: elevator.holdX, y: elevator.position.y }); //hold horizontal position
                },
            });
            Composite.add(engine.world, elevator); //add to world

            let buildMapOutline = function () {
                //boxes center on zero,zero with deep walls to hide background
                spawn.mapRect(2225, -2000, 1775, 4000); //right map wall
                spawn.mapRect(-4000, -2000, 2000, 4000); //left map wall
                spawn.mapRect(-4000, -5000, 8000, 3000); //map ceiling
                spawn.mapRect(-4000, 2000, 8000, 3000); //floor
            }
            let buildNormalMap = function () {
                //flip button 
                buttons.push(level.button(-1895, -1600, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons[buttons.length - 1].isUp = false
                spawn.mapRect(-1675, -2025, 50, 250);

                //disable laser button
                buttons.push(level.button(-1500, 1315, 126, true, true, "hsl(330, 100%, 50%)"))
                buttons[buttons.length - 1].isUp = true

                simulation.ephemera.push({
                    count: flipAnimationCycles + 30,
                    do() {
                        this.count--
                        if (this.count < 0) {
                            // for (let i = 0; i < buttons.length; i++) buttons[i].isUp = true
                            buttons[0].isUp = true
                            simulation.removeEphemera(this);
                            level.isFlipping = false
                        }
                    },
                })

                lasers.push(level.laser({ x: -1100, y: 1990 }, { x: -1100, y: -2000 }))
                spawn.mapRect(-1112, 1990, 25, 25); //laser entrance
                lasers.push(level.laser({ x: -600, y: 1990 }, { x: -600, y: -2000 }))
                spawn.mapRect(-612, 1990, 25, 25); //laser entrance
                lasers.push(level.laser({ x: -100, y: 1990 }, { x: -100, y: -2000 }))
                spawn.mapRect(-112, 1990, 25, 25); //laser entrance

                balance.push(level.rotor(-1250, 1755, 400, 25, 0.01, 0, 0.5)) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                balance.push(level.rotor(-750, 1755, 400, 25, 0.01, Math.PI / 2, 0.5))
                balance.push(level.rotor(-275, 1675, 550, 32, 0.01, 0, 0.5))

                // lasers.push(level.laser({ x: 1610, y: -850 }, { x: -1625, y: -850 }))

                boost.push(level.boost(1800, 1980, 3000, Math.PI / 2)) //floor
                boost.push(level.boost(1800, -2050, 3000, -Math.PI / 2)) //top

                //left side
                //level entrance
                spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
                spawn.mapRect(level.exit.x, level.exit.y - 40, 100, 20);
                spawn.mapRect(-2025, 1650, 400, 50);
                spawn.mapRect(-2100, -1600, 475, 2925);
                spawn.mapRect(-1675, 1500, 50, 325);

                spawn.mapVertex(-1375, 835, "-250 -475  0 -500  250 -475   250 475  -250 475");
                spawn.mapVertex(-850, 840, "-225 -475  0 -500  225 -475   225 475  -225 475");
                spawn.mapVertex(-350, 840, "-225 -475  0 -500  225 -475   225 475  -225 475");

                //lower right side
                //far right wall ledges
                spawn.mapRect(1925, -1700, 400, 200);
                spawn.mapRect(1925, -1200, 400, 200);
                spawn.mapRect(1925, -700, 400, 200);
                spawn.mapRect(1925, -200, 400, 200);
                spawn.mapRect(1925, 300, 400, 200);
                spawn.mapRect(1925, 800, 400, 200);
                spawn.mapRect(1925, 1300, 400, 200);

                spawn.mapRect(1250, 1650, 500, 25);
                spawn.mapRect(1300, 1125, 400, 25);
                spawn.mapRect(1350, 600, 300, 25);
                spawn.mapRect(1400, 75, 200, 25);

                spawn.mapRect(650, 1287, 475, 50);
                spawn.mapRect(650, 800, 500, 125);
                spawn.mapRect(650, 150, 500, 225);
                spawn.mapRect(350, 1300, 800, 375);
                spawn.mapRect(350, 950, 150, 400);
                spawn.mapRect(-25, 950, 525, 100);
                spawn.mapRect(-75, 525, 575, 200);
                spawn.mapRect(-75, 75, 575, 200);
                spawn.mapRect(475, 1990, 550, 50);

                //ceiling zone
                spawn.mapRect(1200, -1600, 400, 25);
                // spawn.mapRect(-75, -1725, 1075, 25);
                spawn.mapRect(-75, -1825, 1225, 25);

                spawn.mapRect(-575, -1625, 450, 25);
                spawn.mapRect(-1075, -1850, 450, 25);
                spawn.mapRect(-1075, -1425, 450, 25);
                spawn.mapRect(-1675, -1588, 550, 25);
            }
            let buildVerticalFLippedMap = function () { // flip Y with this -> spawn.mapRect(x, -y - h, w, h);
                //flip button
                buttons.push(level.button(-1895, 1600, 126, true, true, "hsl(330, 100%, 50%)"))
                buttons[buttons.length - 1].isUp = false
                spawn.mapRect(-1675, 2025 - 250, 50, 250);

                //disable laser button
                buttons.push(level.button(-1500, -1315, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons[buttons.length - 1].isUp = true

                simulation.ephemera.push({
                    count: flipAnimationCycles + 30,
                    do() {
                        this.count--
                        if (this.count < 0) {
                            if (buttons[0]) buttons[0].isUp = true
                            simulation.removeEphemera(this);
                            level.isFlipping = false
                        }
                    },
                })

                lasers.push(level.laser({ x: -1100, y: -1990 }, { x: -1100, y: 2000 })) ////x, y, width, height, damage = 0.002)
                spawn.mapRect(-1112, -1990 - 25, 25, 25); //laser entrance
                lasers.push(level.laser({ x: -600, y: -1990 }, { x: -600, y: 2000 })) ////x, y, width, height, damage = 0.002)
                spawn.mapRect(-612, -1990 - 25, 25, 25); //laser entrance
                lasers.push(level.laser({ x: -100, y: -1990 }, { x: -100, y: 2000 })) ////x, y, width, height, damage = 0.002)
                spawn.mapRect(-112, -1990 - 25, 25, 25); //laser entrance

                balance.push(level.rotor(-1250, -1755 - 25, 400, 25, 0.01, 0, 0.5)) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                balance.push(level.rotor(-750, -1755 - 25, 400, 25, 0.01, Math.PI / 2, 0.5))
                balance.push(level.rotor(-250, -1675 - 32, 500, 32, 0.01, 0, 0.5))

                // lasers.push(level.laser({ x: 1610, y: 850 }, { x: -1625, y: 850 })) ////x, y, width, height, damage = 0.002)
                // spawn.mapRect(1980, 862 - 25, 25, 25); //laser entrance
                // balance.push(level.rotor(1000, 910 - 32, 550, 32, 0.01, 0, 0.5))

                boost.push(level.boost(1800, -2050, 3000, -Math.PI / 2))
                boost.push(level.boost(1800, 1980, 3000, Math.PI / 2))


                //left side
                //level entrance
                spawn.mapRect(level.enter.x, level.enter.y - 20 - 20, 100, 20);
                spawn.mapRect(level.exit.x, level.exit.y + 40 - 20, 100, 20);
                spawn.mapRect(-2025, -1650 - 50, 400, 50);
                spawn.mapRect(-2100, +1600 - 2925, 475, 2925);
                spawn.mapRect(-1675, -1500 - 325, 50, 325);

                spawn.mapVertex(-1375, -835, "-250 -475   250 -475   250 475  0 500  -250 475");
                spawn.mapVertex(-850, -835, "-225 -475   225 -475   225 475  0 500  -225 475");
                spawn.mapVertex(-350, -835, "-225 -475   225 -475   225 475  0 500  -225 475");

                //far right wall ledges
                spawn.mapRect(1925, 1700 - 200, 400, 200);
                spawn.mapRect(1925, 1200 - 200, 400, 200);
                spawn.mapRect(1925, 700 - 200, 400, 200);
                spawn.mapRect(1925, 200 - 200, 400, 200);
                spawn.mapRect(1925, -300 - 200, 400, 200);
                spawn.mapRect(1925, -800 - 200, 400, 200);
                spawn.mapRect(1925, -1300 - 200, 400, 200);

                spawn.mapRect(1250, -1650 - 25, 500, 25);
                spawn.mapRect(1300, -1125 - 25, 400, 25);
                spawn.mapRect(1350, -600 - 25, 300, 25);
                spawn.mapRect(1400, -75 - 25, 200, 25);

                spawn.mapRect(650, -1287 - 50, 475, 50);
                spawn.mapRect(650, -800 - 125, 500, 125);
                spawn.mapRect(650, -150 - 225, 500, 225);
                spawn.mapRect(350, -1300 - 375, 800, 375);
                spawn.mapRect(350, -950 - 400, 150, 400);
                spawn.mapRect(-25, -950 - 100, 525, 100);
                spawn.mapRect(-75, -525 - 200, 575, 200);
                spawn.mapRect(-75, -75 - 200, 575, 200);
                spawn.mapRect(475, -1990 - 50, 550, 50);
                //ceiling zone

                spawn.mapRect(1200, 1575, 400, 25);
                spawn.mapRect(-75, 1800, 1225, 25);
                // spawn.mapRect(-75, 1700, 1075, 25);
                spawn.mapRect(-575, 1625 - 25, 450, 25);
                spawn.mapRect(-1075, 1850 - 25, 450, 25);

                spawn.mapRect(-1075, 1425 - 25, 450, 25);
                spawn.mapRect(-1675, 1588 - 25, 550, 25);
            }
            let flipAndRemove = function () {
                simulation.translatePlayerAndCamera({ x: player.position.x, y: -player.position.y })
                level.enter.y = -level.enter.y
                level.exit.y = -level.exit.y
                for (let i = body.length - 1; i > -1; i--) {
                    if (body[i].isRotor) body.splice(i, 1);
                }

                function removeAll(array) {
                    for (let i = 0; i < array.length; ++i) Matter.Composite.remove(engine.world, array[i]);
                }
                removeAll(map);
                map = [];
                removeAll(balance);
                balance = []
                removeAll(buttons);
                buttons = []
                lasers = []
                boost = []

                function invertVertical(array) {
                    for (let i = 0; i < array.length; ++i) {
                        Matter.Body.setPosition(array[i], { x: array[i].position.x, y: -array[i].position.y })
                    }
                }
                invertVertical(body);
                invertVertical(powerUp);
                invertVertical(bullet);
                invertVertical(mob);
                //fields
                if (m.fieldMode === 9 && m.hole.isOn) {
                    m.hole.pos1.y *= -1
                    m.hole.pos2.y *= -1
                } else if (m.fieldMode === 2) {
                    m.fieldPosition.y *= -1
                    m.fieldAngle *= -1
                }
                //history
                for (let i = 0; i < m.history.length; i++) {
                    m.history[i].position.y *= -1
                    m.history[i].angle *= -1
                    m.history[i].velocity.y *= -1
                }
                for (let i = 0; i < mob.length; i++) {
                    //stun to wipe history of all mobs, so they don't get confused about player position vertical swap
                    mobs.statusStun(mob[i], 1)
                    //edge cases
                    if (mob[i].history) {
                        for (let j = 0; j < mob[i].history.length; j++) mob[i].history[j].y *= -1
                    }
                    if (mob[i].laserArray) {
                        for (let j = 0; j < mob[i].laserArray.length; j++) {
                            mob[i].laserArray[j].a.y *= -1
                            mob[i].laserArray[j].b.y *= -1
                        }
                    }
                    if (mob[i].springTarget2) {
                        mob[i].springTarget.y *= -1
                        mob[i].springTarget2.y *= -1
                    }
                }
            }
            buildMapOutline()
            buildNormalMap()
            level.custom = () => {
                for (let i = 0; i < boost.length; i++) {
                    boost[i].query()
                }
                elevator.move()
                // console.log(elevator)
                // lasers[lasers.length - 1].look.y = elevator.position.y
                // lasers[lasers.length - 1].position.y = elevator.position.y

                buttons[1].draw()
                buttons[1].query();
                buttons[0].draw()
                if (buttons[0].isUp && !level.isFlipping) {
                    buttons[0].queryPlayer();
                    if (!buttons[0].isUp) {
                        level.isFlipping = true
                        if (level.isFlipped) {
                            const normalMap = function () {
                                level.isFlipped = false
                                flipAndRemove()
                                buildMapOutline()
                                buildNormalMap(); //rewrite flipped version of map
                                simulation.draw.setPaths() //update map graphics
                                level.addToWorld()
                            }
                            simulation.unFlipCameraVertical(flipAnimationCycles, normalMap)
                        } else {
                            const flipMap = function () {
                                level.isFlipped = true
                                flipAndRemove()
                                buildMapOutline()
                                buildVerticalFLippedMap(); //rewrite flipped version of map
                                simulation.draw.setPaths() //update map graphics
                                level.addToWorld()
                                if (!isSpawned) {
                                    isSpawned = true
                                    //spawn second wave of flipped mobs only once
                                    // spawn.randomMob(-1500, -1425, 0);
                                    // spawn.randomMob(-950, -1425, 0);
                                    // spawn.randomMob(-800, -1475, 0);
                                    // spawn.randomMob(-425, -1425, 0);
                                    // spawn.randomMob(850, -1750, 0.1);
                                    // spawn.randomMob(325, -850, 0.1);
                                    // spawn.randomMob(400, -400, 0.2);
                                    // spawn.randomMob(825, -475, 0.2);
                                    // spawn.randomMob(875, -1050, 0.3);
                                    // spawn.randomMob(1425, 1425, 0.4);
                                    // spawn.randomMob(675, 1450, 0.5);
                                    // spawn.randomMob(225, 1475, 0.6);
                                    // spawn.randomMob(-275, 1425, 1);
                                    // spawn.randomMob(-800, 1375, 1);

                                    spawn.secondaryBossChance(700, 1100)
                                }
                            }
                            simulation.flipCameraVertical(flipAnimationCycles, flipMap)
                        }
                    }
                }

                if (level.isFlipped) {
                    //background structure
                    ctx.fillStyle = "#c3c7c7"
                    ctx.fillRect(1487, -75 - 1925, 25, 1925);
                    ctx.fillRect(1925, -2050, 300, 4100);

                    //exit room
                    ctx.fillStyle = "#d4f4f4"
                    ctx.fillRect(-2000, -1325 - 350, 375, 350)
                    level.exit.drawAndCheck();
                    //draw flipped entrance
                    // ctx.translate(0, -3940)
                    ctx.beginPath();
                    ctx.moveTo(level.enter.x, level.enter.y - 30);
                    ctx.lineTo(level.enter.x, level.enter.y + 80);
                    ctx.bezierCurveTo(level.enter.x, level.enter.y + 170, level.enter.x + 100, level.enter.y + 170, level.enter.x + 100, level.enter.y + 80);
                    ctx.lineTo(level.enter.x + 100, level.enter.y - 30);
                    ctx.lineTo(level.enter.x, level.enter.y - 30);
                    ctx.fillStyle = "#ccc";
                    ctx.fill();
                    // ctx.translate(0, 3940)
                } else {
                    //background structure
                    ctx.fillStyle = "#c5c9c9"
                    ctx.fillRect(1487, 75, 25, 1925);
                    ctx.fillRect(1925, -2050, 300, 4100);

                    //draw flipped exit
                    ctx.fillStyle = "#d4f4f4"
                    ctx.fillRect(-2000, 1325, 375, 350)
                    ctx.beginPath();
                    ctx.moveTo(level.exit.x, level.exit.y - 30);
                    ctx.lineTo(level.exit.x, level.exit.y + 80);
                    ctx.bezierCurveTo(level.exit.x, level.exit.y + 170, level.exit.x + 100, level.exit.y + 170, level.exit.x + 100, level.exit.y + 80);
                    ctx.lineTo(level.exit.x + 100, level.exit.y - 30);
                    ctx.lineTo(level.exit.x, level.exit.y - 30);
                    ctx.fillStyle = "#0ff";
                    ctx.fill();
                    level.enter.draw();
                }
            };
            level.customTopLayer = () => {
                if (buttons[1].isUp) {
                    for (let i = 0; i < lasers.length; i++) lasers[i].query()
                    // if (simulation.cycle % 120 > 60) lasers[lasers.length - 1].query()

                    // else {
                    //     ctx.strokeStyle = "rgba(255,0,0,0.05)"
                    //     ctx.lineWidth = 10;
                    //     ctx.beginPath()
                    //     // console.log(lasers[lasers.length - 1])
                    //     ctx.moveTo(lasers[lasers.length - 1].position.x, lasers[lasers.length - 1].position.y)
                    //     ctx.lineTo(lasers[lasers.length - 1].look.x, lasers[lasers.length - 1].look.y)
                    //     ctx.stroke()
                    // }
                }
                ctx.fillStyle = "#233" //balances center dot
                ctx.beginPath();
                for (let i = 0; i < balance.length; i++) {
                    ctx.moveTo(balance[i].center.x, balance[i].center.y)
                    ctx.arc(balance[i].center.x, balance[i].center.y, 9, 0, 2 * Math.PI);
                    //rotor spins and stops at vertical and horizontal angles
                    if ((simulation.cycle % 90) < 15) {
                        balance[i].torque = 0.0002 * balance[i].inertia
                    } else if (Math.floor(10 * (balance[i].angle % (Math.PI / 2))) === 0) {
                        Matter.Body.setAngularVelocity(balance[i], balance[i].angularVelocity * 0.1)
                    }
                }
                ctx.fill();
                ctx.fillStyle = `rgba(255,255,255,${0 + 0.3 * Math.random()})`
                if (level.isFlipped) {
                    ctx.fillRect(-2025, 2025 - 450, 400, 450);
                    //shadows
                    ctx.fillStyle = "rgba(0,0,0,0.08)"
                    ctx.fillRect(-2025, -2075, 900, 775);
                    ctx.fillRect(-1075, -2025, 450, 725);
                    ctx.fillRect(-575, -2025, 450, 725);

                    ctx.fillRect(-25, -250 - 725, 525, 725);
                    ctx.fillRect(650, -350 - 975, 475, 975);
                    ctx.fillRect(375, -1650 - 400, 750, 400);
                    //ceiling



                    ctx.fillStyle = "rgba(0,0,0,0.04)"
                    ctx.fillRect(1225, 2025 - 450, 350, 450);
                    ctx.fillRect(-50, 1800, 1175, 225);
                    // ctx.fillRect(-50, 1700, 1025, 325);
                    ctx.fillRect(-550, 2025 - 425, 400, 425);
                    ctx.fillRect(-1050, 2025 - 625, 400, 625);
                    ctx.fillRect(-1625, 2025 - 450, 475, 450);
                } else {
                    ctx.fillRect(-2025, -2025, 400, 450);
                    //shadows
                    ctx.fillStyle = "rgba(0,0,0,0.08)"
                    ctx.fillRect(-2025, 1300, 900, 775);
                    ctx.fillRect(-1075, 1300, 450, 725);
                    ctx.fillRect(-575, 1300, 450, 725);

                    ctx.fillRect(-25, 250, 525, 725);
                    ctx.fillRect(650, 350, 475, 975);
                    ctx.fillRect(375, 1650, 750, 400);
                    //ceiling
                    ctx.fillStyle = "rgba(0,0,0,0.04)"
                    ctx.fillRect(1225, -2025, 350, 450);
                    ctx.fillRect(-50, -2025, 1175, 225);
                    // ctx.fillRect(-50, -2025, 1025, 325);
                    ctx.fillRect(-550, -2025, 400, 425);
                    ctx.fillRect(-1050, -2025, 400, 625);
                    ctx.fillRect(-1625, -2025, 475, 450);
                }
            };
            spawn.bodyRect(1325, -1775, 175, 175);
            spawn.bodyRect(-375, -1725, 100, 75, 0.5);
            spawn.bodyRect(-900, -1625, 125, 200, 0.5);
            spawn.bodyRect(875, -25, 200, 175);


            spawn.bodyRect(-1662, 1325, 25, 175);
            spawn.bodyRect(-1662, 1825, 25, 175);
            // spawn.bodyRect(-1670, 1825, 40, 100);
            // spawn.bodyRect(-1670, 1925, 40, 75);

            spawn.bodyRect(1900, 1875, 100, 125, 0.5);
            spawn.bodyRect(400, 1925, 225, 50, 0.1);
            spawn.bodyRect(950, 750, 75, 50, 0.1);
            spawn.bodyRect(200, -25, 150, 100, 0.1);
            spawn.bodyRect(300, 900, 75, 50, 0.1);
            spawn.bodyRect(1475, 1025, 100, 100, 0.1);
            spawn.bodyRect(250, 450, 75, 75, 0.1);
            spawn.bodyRect(775, 75, 75, 75, 0.1);
            spawn.bodyRect(1200, 1900, 125, 100, 0.1);

            spawn.randomMobPositions = [
                [125, -1900],
                [-375, -1875],
                [-1350, -1750],
                // [-875, -1575],
                [500, -1875],
                // [350, 825],
                // [375, 400],
                [1500, -25],
                // [650, -1950],
                // [775, 700],
                // [275, -50],
                [75, -1750],
                // [1750, -1425],
                // [950, 50],
                // [-1375, 175],
                // [-350, 175],
                // [725, 1175],
                [-850, -1950],
                // [-1400, -1725],
                [1400, -1700],
                // [-800, 200],
                // [1475, 1550],
                [1475, 500]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            powerUps.spawnStartingPowerUps(-875, -1925);

            spawn.randomLevelBoss(-875, -200);
            //spawn.randomHigherTierMob(821, 705)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        gravitron() {
            mobs.maxMobBody = 25 //normally 40, but set lower to avoid too much clutter
            level.announceText(-2375, 1030, true)
            level.isVerticalFLipLevel = true
            simulation.fallHeight = 4000
            level.announceMobTypes()
            level.setPosToSpawn(-2375, 950);
            level.exit.x = 3750
            level.exit.y = 165
            level.defaultZoom = 2600
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#c3d6e1";
            color.map = "#444"
            powerUps.chooseRandomPowerUp(-1825, 975);
            powerUps.chooseRandomPowerUp(-3975, 975);
            powerUps.chooseRandomPowerUp(3900, 925);

            let buttons = []
            // level.isFlipped = false;
            if (simulation.isInvertedVertical) {
                level.isFlipped = true
            } else {
                level.isFlipped = false
            }
            level.isFlipping = false;
            const flipAnimationCycles = 60

            let buildMapOutline = function () {
                //boxes center on zero,zero with deep walls to hide background
                spawn.mapRect(4000, -2000, 2000, 4000); //right map wall
                spawn.mapRect(-6000, -2000, 2000, 4000); //left map wall
                spawn.mapRect(-6000, -4000, 12000, 3000); //map ceiling
                spawn.mapRect(-6000, 1000, 12000, 3000); //floor
            }
            let buildNormalMap = function () {
                buttons.push(level.button(-3350, 985, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(-3350, -985, 126, true, true, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(150, 985, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(150, -985, 126, true, true, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(3725, 985, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(3725, -985, 126, true, true, "hsl(330, 100%, 50%)"))
                for (let i = 0; i < buttons.length; i++) buttons[i].isUp = false
                simulation.ephemera.push({
                    count: flipAnimationCycles,
                    do() {
                        this.count--
                        if (this.count < 0) {
                            for (let i = 0; i < buttons.length; i++) buttons[i].isUp = true
                            simulation.removeEphemera(this);
                            level.isFlipping = false
                        }
                    },
                })
                //far left zone
                spawn.mapRect(-2575, 990, 375, 100);
                spawn.mapRect(-2575, -600, 600, 1325);
                spawn.mapRect(-2200, 650, 225, 475);
                spawn.mapRect(-2575, 700, 35, 125);
                spawn.mapRect(-3500, -1050, 425, 60);
                spawn.mapRect(-3500, 990, 425, 50);
                spawn.mapVertex(-2275, -1000, "-400 0  -300 150  300 150  400 0");

                spawn.mapVertex(-3287, 0, "-213 -500  0 -550  213 -500  213 500  0 550  -213 500");
                spawn.mapVertex(-3750, -100, "-100 -200  -50 -250   50 -250 100 -200   100 200 50 250  -50 250 -100 200");
                spawn.mapVertex(-2825, 0, "-100 -400  -50 -450   50 -450 100 -400   100 400 50 450  -50 450 -100 400");

                //dense center left zone
                spawn.mapVertex(-1150, -750, "400 -75   425 0  400 75  -400 75  -425 0 -400 -75");
                spawn.mapVertex(-550, -450, "400 -75   425 0  400 75  -400 75  -425 0 -400 -75");

                spawn.mapVertex(-1685, 153, "-150 -500  0 -550  150 -500  150 750  -150 450");
                spawn.mapVertex(-1106, 707, "500 -150   550 0  500 150  -500 150  -800 -150");
                spawn.mapRect(-1645, 470, 200, 200);
                Matter.Body.setAngle(map[map.length - 1], Math.PI / 4)
                spawn.mapRect(-2085, 910, 200, 200);
                Matter.Body.setAngle(map[map.length - 1], Math.PI / 4)

                //open center right area with both bosses
                // spawn.mapRect(0, -450, 425, 1100);
                spawn.mapVertex(213, 0, "-213 -600   0 -550    213 -500    213 600     -213 500");
                //
                spawn.mapRect(0, -1050, 425, 60);
                spawn.mapRect(0, 990, 425, 50);
                spawn.mapVertex(1700, -1000, "-600 0  -400 400  400 400  600 0");
                spawn.mapVertex(2800, -1000, "-500 0  -400 150  400 150  500 0");
                spawn.mapVertex(1700, 700, "-400 -100  -450 0  -400 100  400 100  450 0  400 -100");
                spawn.mapVertex(2800, 375, "-400 -100  -450 0  -400 100  400 100  450 0  400 -100");

                //far right exit structure
                spawn.mapRect(3575, -1050, 425, 60);
                spawn.mapRect(3575, 990, 425, 50);
                spawn.mapVertex(3840, 450, "-250 -300   250 -300   250 300   -250 100");
                spawn.mapVertex(3840, -450, "-250 300   250 300   250 -300   -250 -100");
                spawn.mapRect(3750, 188, 100, 25);
            }
            let buildVerticalFLippedMap = function () { // flip Y with this -> spawn.mapRect(x, -y - h, w, h);
                buttons.push(level.button(-3350, 985, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(-3350, -985, 126, true, true, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(150, 985, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(150, -985, 126, true, true, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(3725, 985, 126, true, false, "hsl(330, 100%, 50%)"))
                buttons.push(level.button(3725, -985, 126, true, true, "hsl(330, 100%, 50%)"))
                for (let i = 0; i < buttons.length; i++) buttons[i].isUp = false

                simulation.ephemera.push({
                    count: flipAnimationCycles,
                    do() {
                        this.count--
                        if (this.count < 0) {
                            for (let i = 0; i < buttons.length; i++) buttons[i].isUp = true
                            simulation.removeEphemera(this);
                            level.isFlipping = false
                        }
                    },
                })

                //far left zone
                spawn.mapRect(-2575, -1087, 375, 100);
                spawn.mapRect(-2575, 600 - 1325, 600, 1325);
                spawn.mapRect(-2200, -650 - 475, 225, 475);
                spawn.mapRect(-2575, -700 - 125, 35, 125);
                spawn.mapRect(-3500, 1050 - 60, 425, 60);
                spawn.mapRect(-3500, -990 - 50, 425, 50);
                spawn.mapVertex(-2275, 1000, "-300 0  -400 150  400 150  300 0");

                spawn.mapVertex(-3287, 0, "-213 -500  0 -550  213 -500  213 500  0 550  -213 500");
                spawn.mapVertex(-3750, 100, "-100 -200  -50 -250   50 -250 100 -200   100 200 50 250  -50 250 -100 200");
                spawn.mapVertex(-2825, 0, "-100 -400  -50 -450   50 -450 100 -400   100 400 50 450  -50 450 -100 400");

                //dense center left zone
                spawn.mapVertex(-1150, 750, "400 -75   425 0  400 75  -400 75  -425 0 -400 -75");
                spawn.mapVertex(-550, 450, "400 -75   425 0  400 75  -400 75  -425 0 -400 -75");

                spawn.mapVertex(-1685, -153, "-150 500  0 550  150 500  150 -750  -150 -450");
                spawn.mapVertex(-1106, -707, "500 150   550 0  500 -150  -500 -150  -800 150");
                spawn.mapRect(-1645, -470 - 200, 200, 200);
                Matter.Body.setAngle(map[map.length - 1], Math.PI / 4)
                spawn.mapRect(-2085, -910 - 200, 200, 200);
                Matter.Body.setAngle(map[map.length - 1], Math.PI / 4)

                //open center right area with both bosses
                spawn.mapVertex(213, 0, "-213 -500  0 -550  213 -600  213 500  -213 600");

                spawn.mapRect(0, 1050 - 60, 425, 60);
                spawn.mapRect(0, -990 - 50, 425, 50);
                spawn.mapVertex(1700, 1000, "-400 0  -600 400  600 400  400 0");
                spawn.mapVertex(2800, 1000, "-400 0  -500 150  500 150  400 0");
                spawn.mapVertex(1700, -700, "-400 -100  -450 0  -400 100  400 100  450 0  400 -100");
                spawn.mapVertex(2800, -375, "-400 -100  -450 0  -400 100  400 100  450 0  400 -100");
                //far right building like exit structure
                spawn.mapRect(3575, 1050 - 60, 425, 60);
                spawn.mapRect(3575, -990 - 50, 425, 50);
                spawn.mapVertex(3840, 450, "-250 -300   250 -300   250 300   -250 100");
                spawn.mapVertex(3840, -450, "-250 300   250 300   250 -300   -250 -100");
                spawn.mapRect(3750, -212, 100, 25);
            }
            let flipAndRemove = function () {

                level.enter.y = -level.enter.y
                level.exit.y = -level.exit.y
                for (let i = body.length - 1; i > -1; i--) {
                    if (body[i].isRotor) body.splice(i, 1);
                }

                function removeAll(array) {
                    for (let i = 0; i < array.length; ++i) Matter.Composite.remove(engine.world, array[i]);
                }
                removeAll(map);
                map = [];
                removeAll(buttons);
                buttons = []

                simulation.translatePlayerAndCamera({ x: player.position.x, y: -player.position.y }, false)
                function invertVertical(array) {
                    for (let i = 0; i < array.length; ++i) {
                        Matter.Body.setPosition(array[i], { x: array[i].position.x, y: -array[i].position.y })
                    }
                }
                invertVertical(body);
                invertVertical(powerUp);
                invertVertical(bullet);
                invertVertical(mob);

                //fields
                if (m.fieldMode === 9 && m.hole.isOn) {
                    m.hole.pos1.y *= -1
                    m.hole.pos2.y *= -1
                } else if (m.fieldMode === 2) {
                    m.fieldPosition.y *= -1
                    m.fieldAngle *= -1
                }
                //history
                for (let i = 0; i < m.history.length; i++) {
                    m.history[i].position.y *= -1
                    m.history[i].angle *= -1
                    m.history[i].velocity.y *= -1
                }
                for (let i = 0; i < mob.length; i++) {
                    //stun to wipe history of all mobs, so they don't get confused about player position vertical swap
                    mobs.statusStun(mob[i], 1)
                    //edge cases
                    if (mob[i].history) {
                        for (let j = 0; j < mob[i].history.length; j++) mob[i].history[j].y *= -1
                    }
                    if (mob[i].laserArray) {
                        for (let j = 0; j < mob[i].laserArray.length; j++) {
                            mob[i].laserArray[j].a.y *= -1
                            mob[i].laserArray[j].b.y *= -1
                        }
                    }
                    if (mob[i].springTarget2) {
                        mob[i].springTarget.y *= -1
                        mob[i].springTarget2.y *= -1
                    }
                }
                if (tech.wire && tech.wire.segments.length) {
                    for (let i = 0; i < tech.wire.segments.length; i++) {
                        tech.wire.segments[i].y *= -1
                        tech.wire.segments[i].oldY *= -1
                    }
                }
            }
            buildMapOutline()
            buildNormalMap()
            level.custom = () => {
                //stuff floats near buttons
                // if ((player.position.x > -3505 && player.position.x < -3075) ||
                //     (player.position.x > 0 && player.position.x < 425) ||
                //     (player.position.x > 3575)) {
                //     if (player.position.y > 0) {
                //         player.force.y -= 0.8 * simulation.g * player.mass
                //     }
                // }
                for (let i = 0; i < body.length; i++) {
                    if ((body[i].position.x > -3505 && body[i].position.x < -3075) ||
                        (body[i].position.x > 0 && body[i].position.x < 425) ||
                        (body[i].position.x > 3575)
                    ) {
                        if (body[i].position.y > 0) {
                            body[i].force.y -= 1.04 * simulation.g * body[i].mass
                        } else {
                            body[i].force.y += 1.04 * simulation.g * body[i].mass
                        }
                    }
                }
                for (let i = 0; i < powerUp.length; i++) {
                    if ((powerUp[i].position.x > -3505 && powerUp[i].position.x < -3075) ||
                        (powerUp[i].position.x > 0 && powerUp[i].position.x < 425) ||
                        (powerUp[i].position.x > 3575)
                    ) {
                        if (powerUp[i].position.y > 0) {
                            powerUp[i].force.y -= 1.04 * simulation.g * powerUp[i].mass
                        } else {
                            powerUp[i].force.y += 1.04 * simulation.g * powerUp[i].mass
                        }
                    }
                }
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].draw()
                    if (buttons[i].isUp && !level.isFlipping) {
                        // buttons[i].query();
                        buttons[i].queryPlayer();
                        if (!buttons[i].isUp) {
                            level.isFlipping = true
                            if (level.isFlipped) {
                                const normalMap = function () {
                                    level.isFlipped = false
                                    flipAndRemove()
                                    buildMapOutline()
                                    buildNormalMap(); //rewrite flipped version of map
                                    simulation.draw.setPaths() //update map graphics
                                    level.addToWorld()
                                }
                                simulation.unFlipCameraVertical(flipAnimationCycles, normalMap)
                            } else {
                                const flipMap = function () {
                                    level.isFlipped = true
                                    flipAndRemove()
                                    buildMapOutline()
                                    buildVerticalFLippedMap(); //rewrite flipped version of map
                                    simulation.draw.setPaths() //update map graphics
                                    level.addToWorld()
                                }
                                simulation.flipCameraVertical(flipAnimationCycles, flipMap)
                            }
                            break
                        }
                    }
                }
                ctx.fillStyle = "#d4f4f4"
                ctx.fillRect(3575, -300, 475, 575);
                if (level.isFlipped) {
                    //draw flipped entrance
                    ctx.beginPath();
                    ctx.moveTo(level.enter.x, level.enter.y - 30);
                    ctx.lineTo(level.enter.x, level.enter.y + 80);
                    ctx.bezierCurveTo(level.enter.x, level.enter.y + 170, level.enter.x + 100, level.enter.y + 170, level.enter.x + 100, level.enter.y + 80);
                    ctx.lineTo(level.enter.x + 100, level.enter.y - 30);
                    ctx.lineTo(level.enter.x, level.enter.y - 30);
                    ctx.fillStyle = "#ccc";
                    ctx.fill();
                    //draw flipped exit
                    ctx.fillStyle = "#d4f4f4"
                    // ctx.fillRect(-2000, 1325, 375, 350)
                    ctx.beginPath();
                    ctx.moveTo(level.exit.x, level.exit.y - 30);
                    ctx.lineTo(level.exit.x, level.exit.y + 80);
                    ctx.bezierCurveTo(level.exit.x, level.exit.y + 170, level.exit.x + 100, level.exit.y + 170, level.exit.x + 100, level.exit.y + 80);
                    ctx.lineTo(level.exit.x + 100, level.exit.y - 30);
                    ctx.lineTo(level.exit.x, level.exit.y - 30);
                    ctx.fillStyle = "#0ff";
                    ctx.fill();
                } else {
                    level.exit.drawAndCheck();
                    level.enter.draw();
                }
            };
            level.customTopLayer = () => {
                ctx.fillStyle = `rgba(255,255,255,${0 + 0.3 * Math.random()})`
                ctx.fillRect(-3500, -1075, 425, 2100);
                ctx.fillRect(0, -1075, 425, 2100);
                ctx.fillRect(3575, -1075, 425, 2100);
                ctx.fillStyle = "rgba(0,0,0,0.08)"
                ctx.fillRect(-2575, -1025, 600, 2050);
                ctx.fillRect(1300, -1050, 800, 2100);
                ctx.fillRect(2400, -1050, 800, 2100);
            };

            // spawn.bodyRect(1900, 1875, 100, 125, 0.5);
            spawn.bodyRect(-2569, 825, 25, 165);

            spawn.randomMobPositions = [
                [-2275, -675],
                [-1200, 475],
                [525, 875],
                [1975, 900],
                [2800, 875],
                [-3275, -600],
                [-1250, -900],
                [-475, -600],
                [-1750, 850],
                [1700, 525],
                [2925, 175],
                [-2300, -825],
                [-1625, -450],
                [-225, 900],
                [275, -775],
                [2800, 875],
                [3825, -750],
                [2825, 150],
                [-1900, 875]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            //spawn.randomHigherTierMob(-1296, 407)
            powerUps.spawnStartingPowerUps(-825, -600);
            spawn.randomLevelBoss(1550, 200);
            spawn.secondaryBossChance(2675, -125)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        substructure() {
            level.announceText(-3800, -680, true)
            level.announceMobTypes()
            level.setPosToSpawn(-3800, -750);
            level.exit.x = 3750
            level.exit.y = -625
            level.defaultZoom = 2000
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d0d5d5";
            color.map = "#444"

            const boost1 = level.boost(-2225, 1000, 1750)
            const boost2 = level.boost(3400, 1000, 1750)

            const lasers = []
            const center = { x: 2800, y: 200 }
            map[map.length] = Matter.Bodies.polygon(center.x, center.y, 20, 100) //center circle with lasers
            lasers.push(level.laser({ x: center.x, y: center.y }, { x: center.x, y: center.y })) //oscillating laser
            lasers[lasers.length - 1].oscillate = function () {
                const angle = -0.45 + Math.PI / 2 - 1.47 * Math.sin(0.02 * simulation.cycle) //oscillate around circle
                this.position = {
                    x: center.x + 102 * Math.cos(angle),
                    y: center.y + 102 * Math.sin(angle)
                }
                this.look = {
                    x: center.x + 2000 * Math.cos(angle),
                    y: center.y + 2000 * Math.sin(angle)
                }
            }
            lasers.push(level.laser({ x: center.x, y: center.y }, { x: center.x, y: center.y })) //oscillating laser
            lasers[lasers.length - 1].oscillate = function () {
                const angle = -0.45 + -Math.PI / 2 + 1.47 * Math.sin(0.02 * simulation.cycle) //oscillate around circle
                this.position = {
                    x: center.x + 102 * Math.cos(angle),
                    y: center.y + 102 * Math.sin(angle)
                }
                this.look = {
                    x: center.x + 2000 * Math.cos(angle),
                    y: center.y + 2000 * Math.sin(angle)
                }
            }

            lasers.push(level.laser({ x: -1500, y: -963 }, { x: -1500, y: 0 })) //oscillating laser
            lasers[lasers.length - 1].oscillate = function () {
                // if (this.countDown === 0) {}
                const angle = Math.PI / 2 + 0.6 * Math.sin(simulation.cycle * 0.02) //oscillate around down
                this.look = {
                    x: this.position.x + 600 * Math.cos(angle),
                    y: this.position.y + 600 * Math.sin(angle)
                }
            }

            lasers.push(level.laser({ x: 600, y: 580 }, { x: 600, y: 1000 })) //scrolling laser
            lasers[lasers.length - 1].oscillate = function () {
                this.position.x = 600 + 200 * Math.sin(simulation.cycle * 0.03)
                this.look.x = 600 + 400 * Math.sin(simulation.cycle * 0.03)
            }

            lasers.push(level.laser({ x: -115, y: -853 }, { x: 600, y: -50 }))
            if (Math.random() < 0.33) {
                lasers[lasers.length - 1].oscillate = function () { this.look.x = 300 + Math.abs(600 * Math.sin(simulation.cycle * 0.017)) }
            } else if (Math.random() < 0.5) {
                lasers[lasers.length - 1].oscillate = function () { this.look.x = 600 + 300 * Math.sin(simulation.cycle * 0.017) }
            } else {
                lasers[lasers.length - 1].oscillate = function () { this.look.x = 300 + (4 * simulation.cycle % 600) }
            }
            lasers.push(level.laser({ x: 2375, y: -876 }, { x: 2375, y: -300 })) //exit top
            lasers[lasers.length - 1].oscillate = function () {
                const angle = 1.4 + 1.15 * Math.sin(simulation.cycle * 0.021) //oscillate around down
                this.look = {
                    x: this.position.x + 2000 * Math.cos(angle),
                    y: this.position.y + 2000 * Math.sin(angle)
                }
            }
            lasers.push(level.laser({ x: 2375, y: -876 }, { x: 2375, y: -876 })) //exit top
            lasers[lasers.length - 1].oscillate = function () {
                const angle = 1.4 + 1.15 * Math.cos(simulation.cycle * 0.021) //oscillate around down
                this.look = {
                    x: this.position.x + 2000 * Math.cos(angle),
                    y: this.position.y + 2000 * Math.sin(angle)
                }
            }

            lasers.push(level.laser({ x: -3565, y: -915 }, { x: -3565, y: -710 })) //entrance door
            lasers.push(level.laser({ x: 3535, y: -915 }, { x: 3535, y: -575 })) //exit door

            if (Math.random() < 0.33) {
                lasers.push(level.laser({ x: -400, y: -713 }, { x: -400, y: -295 })) //pillar top
            } else if (Math.random() < 0.5) {
                lasers.push(level.laser({ x: -400, y: -250 }, { x: -400, y: 200 })) //pillar mid
            } else {
                lasers.push(level.laser({ x: -400, y: 250 }, { x: -400, y: 750 })) //pillar low
            }

            level.custom = () => {
                boost1.query();
                boost2.query();

                ctx.fillStyle = "#cacfcf"
                ctx.fillRect(2787, -425, 25, 650);
                ctx.fillRect(-600, -1050, 400, 1800);

                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,255,255,0.1)" //"#d4f4f4" //exit
                ctx.fillRect(3535, -1050, 500, 475);

                //shadows
                ctx.fillStyle = "rgba(0,20,60,0.09)"
                ctx.fillRect(-4025, -1050, 1750, 2275);
                ctx.fillRect(-2025, -1050, 1050, 2175);
                ctx.fillRect(200, 0, 800, 975);
                ctx.fillRect(1400, -150, 650, 1175);
                ctx.fillRect(2200, -425, 1175, 1475);

                //rotate angle of lasers
                for (let i = 0; i < 7; i++) lasers[i].oscillate()
                for (let i = 0; i < lasers.length; i++) {
                    lasers[i].motionQuery()
                }
            };
            //boxes center on zero,zero with deep walls to hide background
            spawn.mapRect(4000, -2000, 2000, 4000); //right map wall
            spawn.mapRect(-6000, -2000, 2000, 4000); //left map wall
            spawn.mapRect(-6000, -4000, 12000, 3000); //map ceiling
            spawn.mapRect(-6000, 1000, 12000, 3000); //floor
            //entrance
            spawn.mapRect(-4000, -710, 450, 1800);
            spawn.mapVertex(-3565, -1013, "-140 0    -8 150   8 150   140 0"); //entrance door
            spawn.mapVertex(-3975, -975, "0 0    100 0   0 100"); //triangle at corner
            spawn.mapVertex(-2900, 272, "-650 0   0 -40   650 0    650 2000   -650 2000 ");  //angled floating structure
            spawn.mapVertex(-2900, -990, "-600 0  0 40  600 0"); //wide ceiling triangle
            //pillar 1
            spawn.mapVertex(-1500, -350, "-550 0   0 -40   550 0    550 350   0 390  -550 350 ");
            spawn.mapVertex(-1500, 535, "-550 0   0 -40   550 0    550 500   0 540  -550 500 ");
            spawn.mapVertex(-1500, -990, "-600 0  0 40  600 0");
            spawn.mapVertex(-1500, 990, "-550 0  0 -40  550 0   550 20   -550 20");
            //pillar 2
            spawn.mapVertex(-400, -875, "225 0  -225 0  -350 -300  350 -300");
            spawn.mapRect(-600, 200, 400, 50);
            spawn.mapRect(-600, -300, 400, 50);
            spawn.mapVertex(-400, 900, "350 0  -350 0  -225 -300  225 -300");
            //pillar 3
            spawn.mapVertex(600, 1000, "575 0  -575 0  -450 -100  450 -100");
            spawn.mapVertex(600, 500, "325 0  250 80  -250 80  -325 0  -250 -80  250 -80");
            spawn.mapRect(175, 450, 850, 100);
            spawn.mapVertex(600, 0, "425 -20  425 20  390 50  -390 50  -425 20  -425 -20  -390 -50  390 -50");
            //far right building
            spawn.mapRect(1600, 990, 450, 100);
            spawn.mapRect(2200, 990, 1175, 100);
            spawn.mapVertex(1500, 1015, "200 0  -200 0  -100 -100  100 -100");
            spawn.mapVertex(1500, 203, "-100 100  0 0   100 0   100 1000   -100 1000"); //left wall
            spawn.mapRect(1550, -300, 500, 200);
            spawn.mapVertex(2303.5, -347, "-100 100  0 0   100 0   100 500   -100 500"); //left wall
            spawn.mapRect(2350, -600, 1025, 200);
            spawn.mapVertex(2375, -975, "-140 0    -8 150   8 150   140 0");  //laser mount
            //exit
            spawn.mapRect(3525, -600, 550, 1675);
            spawn.mapRect(3750, -610, 100, 50);
            spawn.mapVertex(3535, -1013, "-140 0    -8 150   8 150   140 0"); //entrance door
            spawn.mapVertex(3975, -990, "0 0    100 0   100 100"); //triangle at corner

            spawn.randomMobPositions = [
                [-1150, 900],
                [675, 750],
                [3100, 875],
                [2975, -775],
                [1675, -550],
                [700, -300],
                [-325, -425],
                [-1375, -675],
                [-1425, 100],
                [-500, 75],
                [625, 250],
                [2125, 375],
                [-500, 600],
                [-1950, 875],
                [800, -400],
                [1675, -600],
                [2825, 75]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomLevelBoss(2400, 600);
            spawn.secondaryBossChance(800, -300)
            //spawn.randomHigherTierMob(-1499, 122)
            powerUps.chooseRandomPowerUp(600, 375);
            powerUps.chooseRandomPowerUp(600, 925);
            powerUps.spawnStartingPowerUps(1750, -325);
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
            powerUps.chooseRandomPowerUp(2825, 175);
            powerUps.chooseRandomPowerUp(2475, -650);
            powerUps.chooseRandomPowerUp(2100, 925);
            powerUps.chooseRandomPowerUp(625, -100);
        },
        corridor() {
            // simulation.fallHeight = 4000
            level.announceMobTypes()
            level.defaultZoom = 2400
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d0d5d5";
            color.map = "#444"

            powerUps.chooseRandomPowerUp(5925, -2125);
            powerUps.chooseRandomPowerUp(75, -4225);
            powerUps.chooseRandomPowerUp(2950, -1450);

            // level.isHorizontalFlipped = true
            if (simulation.isHorizontalFlipped) {
                level.announceText(14075, -550, true)
                level.setPosToSpawn(14075, -625);
                level.exit.x = -350
                level.exit.y = 505
                spawn.bodyRect(13525, -675, 50, 100);
                var color1 = "rgba(0,20,60,0.09)"
                var color2 = "rgba(0,255,255,0.1)"
                spawn.mapVertex(13800, -600, "0 -325  -50 -300  -50 300  50 300  50 -300");

            } else {
                level.announceText(-350, 580, true)
                level.setPosToSpawn(-350, 475);
                level.exit.x = 14025
                level.exit.y = -600
                spawn.bodyRect(-225, 475, 50, 50);
                var color1 = "rgba(0,255,255,0.1)"
                var color2 = "rgba(0,20,60,0.09)"
            }
            spawn.mapRect(14015, -585, 120, 75); //exit/entrance platform

            const buttonLeft = level.button(-4100, 991)
            const buttonRight = level.button(4050, 991)
            buttonLeft.isUp = true
            // const buttonCamera = level.button(940, -1545)
            // buttonRight.isUp = false
            const boosts = []
            boosts.push(level.boost(-3650, 990, 2700, 1.45))
            boosts.push(level.boost(3325, 990, 1600, 1.4))
            boosts.push(level.boost(7960, -1110, 1650, 2.3))
            boosts.push(level.boost(13345, -460, 2070, 2.35))

            const fizzlers = []
            fizzlers.push(level.fizzler({ x: -135, y: 265 }, { x: -135, y: 535 }))
            fizzlers.push(level.fizzler({ x: -3850, y: 650 }, { x: -3850, y: 1025 }))
            fizzlers.push(level.fizzler({ x: 3875, y: 675 }, { x: 3875, y: 1025 }))
            fizzlers.push(level.fizzler({ x: 13425, y: -1275 }, { x: 13425, y: -550 }))

            const movers = []
            const baseMoverSpeed = 15
            movers.push(level.mover(-3550, 995, 6875, 150, -baseMoverSpeed))
            movers.push(level.mover(225, -1190, 2450, 50, -baseMoverSpeed))
            movers.push(level.mover(-3000, -1190, 3000, 50, baseMoverSpeed))
            movers.push(level.mover(4000, -2025, 2000, 150, -23))
            movers.push(level.mover(8000, -1125, 2000, 150, -23))
            movers.push(level.mover(3775, -425, 1650, 150, 20))
            movers.push(level.mover(5425, -425, 1925, 150, 40))
            movers.push(level.mover(7350, -425, 6000, 150, 60))

            function setMoverDirection(index, VxGoal, force) {
                movers[index].VxGoal = VxGoal
                movers[index].force = force
            }
            level.custom = () => {
                // buttonCamera.query()
                // if (!buttonCamera.isUp) {
                //     simulation.setCameraPosition(100, -1000, 0.29)
                //     //block spawner
                //     spawn.mapRect(0, -2375, 200, 100);
                //     if (!(simulation.cycle % 10) && !m.isTimeDilated && body.length < 200) {
                //         const where = { x: 112, y: -3800 }
                //         // simulation.drawList.push({ x: where.x + 100 * (Math.random() - 0.5), y: where.y + 100 * (Math.random() - 0.5), radius: 11, color: "rgba(0,160,255,0.5)", time: 10 });

                //         let makeBlock = function (where, size) {
                //             const sides = Math.floor(4 + 6 * Math.random() * Math.random())
                //             body[body.length] = Matter.Bodies.polygon(where.x, where.y, sides, size, {
                //                 friction: 0.05,
                //                 frictionAir: 0.001,
                //                 collisionFilter: {
                //                     category: cat.body,
                //                     mask: cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                //                 },
                //                 classType: "body",
                //                 density: 0.001,
                //             });
                //             const who = body[body.length - 1]
                //             Composite.add(engine.world, who); //add to world
                //         }
                //         makeBlock({ x: where.x, y: where.y }, Math.floor(20 + 35 * Math.random() * Math.random()))
                //     }
                // }
                ctx.fillStyle = "#c8cccc"//background color is "#d0d5d5"
                ctx.fillRect(-2150, 675, 500, 400);
                ctx.fillRect(-1050, 675, 500, 400);
                ctx.fillRect(750, 675, 500, 400);
                ctx.fillRect(1850, 675, 500, 400);
                ctx.fillRect(-2250, -2425, 700, 1325);
                ctx.fillRect(-1150, -2400, 700, 1300);
                ctx.fillRect(650, -2375, 700, 1325);
                ctx.fillRect(1750, -2375, 700, 1350);
                ctx.fillRect(8000, -2425, 2000, 2225);
                ctx.fillRect(4000, -2375, 2000, 2100);
                ctx.fillRect(11125, -2425, 1000, 2150)
                level.exit.drawAndCheck();
                level.enter.draw();
                if (buttonRight.isUp) {
                    buttonRight.query();
                    if (!buttonRight.isUp) {
                        requestAnimationFrame(() => buttonLeft.isUp = true);
                        setMoverDirection(0, -baseMoverSpeed, -0.0005)
                        const list = Matter.Query.region(body, buttonLeft) //are any blocks colliding with this
                        if (list.length > 0) Matter.Body.setVelocity(list[0], { x: baseMoverSpeed, y: -20 });
                    }
                } else if (buttonLeft.isUp) {
                    buttonLeft.query();
                    if (!buttonLeft.isUp) {
                        requestAnimationFrame(() => buttonRight.isUp = true);
                        setMoverDirection(0, 20, 0.0005)
                        const list = Matter.Query.region(body, buttonRight) //are any blocks colliding with this
                        if (list.length > 0) Matter.Body.setVelocity(list[0], { x: -15, y: -20 });
                    }
                }
                buttonRight.draw();
                buttonLeft.draw();
                for (let i = 0; i < movers.length; i++) movers[i].push();
                for (let i = 0; i < boosts.length; i++) boosts[i].query();
            };
            level.customTopLayer = () => {
                for (let i = 0; i < fizzlers.length; i++) fizzlers[i].query();
                ctx.fillStyle = color1 //exit
                ctx.fillRect(13400, -1325, 1000, 825);
                //shadows
                ctx.fillStyle = color2
                ctx.fillRect(-500, 225, 494, 350);
                ctx.fillStyle = "rgba(0,5,10,0.06)"
                ctx.beginPath();
                ctx.moveTo(0, -1180)
                ctx.lineTo(225, -1180)
                ctx.lineTo(3220, 669)
                ctx.lineTo(3180, 1010)
                ctx.lineTo(-2960, 1010)
                ctx.lineTo(-2995, 674)
                ctx.fill()
                ctx.beginPath();
                //right button room
                ctx.beginPath();
                ctx.moveTo(3780, 720)
                ctx.lineTo(4325, 720)
                ctx.lineTo(4325, 1010)
                ctx.lineTo(3810, 1010)
                ctx.fill()
                //left button room
                ctx.beginPath();
                ctx.moveTo(-3755, 675)
                ctx.lineTo(-3785, 1010)
                ctx.lineTo(-4250, 1010)
                ctx.lineTo(-4250, 675)
                ctx.fill()
                ctx.fillStyle = "rgba(68, 68, 68,0.9)"
                ctx.fillRect(-50, -4300, 325, 1950);
                for (let i = 0; i < movers.length; i++) movers[i].draw();
            };
            spawn.mapRect(-6000, 1000, 12000, 3000); //floor
            spawn.mapRect(-6000, -4300, 6020, 1950);
            spawn.mapRect(205, -4300, 15120, 1950);
            spawn.mapVertex(-250, 602.5, "-200 0  235 0 400 50  400 150  -200 150");
            spawn.mapVertex(-3675, -2275, "0 0  500 0  0 500");
            spawn.mapVertex(13275, -2275, "0 0  -500 0  0 500");
            spawn.mapRect(-525, -1175, 525, 1450);
            spawn.mapRect(225, -1175, 3000, 1850);
            spawn.mapRect(-3000, -1175, 2525, 1850);
            spawn.mapRect(-4350, -2500, 600, 3175);
            spawn.mapRect(-6000, -2350, 1775, 3350);
            spawn.mapVertex(-1900, 675, "-350 0  -250 100  250 100  350 0");
            spawn.mapVertex(-800, 675, "-350 0  -250 100  250 100  350 0");
            spawn.mapVertex(1000, 675, "-350 0  -250 100  250 100  350 0");
            spawn.mapVertex(2100, 675, "-350 0  -250 100  250 100  350 0");

            spawn.mapVertex(-1900, -1450, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
            spawn.mapVertex(-800, -1450, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
            spawn.mapVertex(1000, -1450, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
            spawn.mapVertex(2100, -1450, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");

            spawn.mapVertex(-1900, -2350, "-450 0  -350 100  350 100  450 0");
            spawn.mapVertex(-800, -2350, "-450 0  -350 100  350 100  450 0");
            spawn.mapVertex(1000, -2350, "-450 0  -350 100  350 100  450 0");
            spawn.mapVertex(2100, -2350, "-450 0  -350 100  350 100  450 0");
            spawn.mapRect(-1500, 840, 300, 20);
            spawn.mapRect(1400, 840, 300, 20);
            //ramp to catch blocks
            spawn.mapVertex(3001, -1260, "0 0  400 -200  550 -200  550 75  0 75");
            spawn.mapVertex(4100, -1100, "-625 0  -600 -60  600 -60  625 0  600 60  -600 60");
            spawn.mapVertex(5550, -750, "-625 0  -600 -60  600 -60  625 0  600 60  -600 60");
            spawn.mapVertex(11625, -900, "-525 0  -500 -50  500 -50  525 0  500 50  -500 50");
            //base for mover
            spawn.mapVertex(5000, -1935, "-1050 0  -1000 -90  1000 -90  1050 0  1000 90  -1000 90");
            spawn.mapVertex(9000, -1035, "-1050 0  -1000 -90  1000 -90  1050 0  1000 90  -1000 90");
            spawn.mapVertex(5000, -2370, "-1200 0  -1000 100  1000 100  1200 0");
            spawn.mapVertex(9000, -2310, "-1200 0  -1000 100  1000 100  1200 0");
            spawn.mapVertex(11625, -2310, "-600 0  -500 100  500 100  600 0");
            spawn.mapRect(3775, -400, 675, 1125);
            spawn.mapRect(4300, -400, 11025, 4400);
            //exit
            spawn.mapRect(13400, -575, 1925, 300);
            spawn.mapRect(14275, -2375, 1050, 2050);
            spawn.mapRect(13400, -2375, 900, 1125);

            //blocks on movers
            spawn.bodyRect(-200, 950, 50, 50);
            spawn.bodyRect(-1100, 925, 65, 75);
            spawn.bodyRect(-2275, 975, 70, 25);
            spawn.bodyRect(-3325, 925, 75, 75);
            spawn.bodyRect(-2950, -1225, 90, 25);
            spawn.bodyRect(-1425, -1275, 45, 75);
            spawn.bodyRect(600, -1275, 70, 75);
            spawn.bodyRect(1900, -1225, 90, 50);
            spawn.bodyRect(4250, -2100, 115, 50);
            spawn.bodyRect(2175, 900, 100, 65);
            spawn.bodyRect(4075, -450, 75, 20);
            spawn.bodyRect(8350, -1175, 90, 50);
            spawn.bodyRect(6525, -525, 70, 100);
            spawn.bodyRect(12025, -475, 130, 50);
            spawn.bodyRect(625, 950, 55, 45);
            spawn.bodyRect(6250, -450, 55, 25);
            spawn.bodyRect(3950, -475, 46, 53);
            //other blocks
            spawn.bodyRect(3525, -1300, 100, 125, 0.6);
            spawn.bodyRect(11550, -1150, 100, 200, 0.4);

            spawn.randomMobPositions = [
                [-1775, -1650],
                [950, -1775],
                [1550, 775],
                [4500, -1250],
                [11400, -1300],
                [-800, -1675],
                [-1325, 775],
                [2050, -1625],
                [3100, -1475],
                [5400, -900],
                [11950, -1025],
                [-925, -1700],
                [2025, -1725],
                [1575, 775],
                [-1350, 775],
                [11925, -1275],
                [4325, -1425],
                [5425, -950],
                [3575, 375]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(5300, -1400, 1.3);
            // if (simulation.difficultyMode > 1 || level.levelsCleared > 1) {
            //     if (level.levelsCleared > 7) { //T3
            //         spawn.randomLevelBoss(2025, -1825, ["laserLayerBoss"]);
            //         spawn.secondaryBossChance(-1900, -1800, ["historyBoss"]);
            //     } else if (level.levelsCleared > 3) { //T2
            //         spawn.randomLevelBoss(2025, -1825, ["pulsarBoss", "spawnerBossCulture"]);
            //         spawn.secondaryBossChance(-1900, -1800, ["blockBoss"]);
            //     } else {  //T1
            //         spawn.randomLevelBoss(2025, -1825, ["shieldingBoss"]);
            //         spawn.secondaryBossChance(-1900, -1800, ["shooterBoss"]);
            //     }
            // } else {
            //     powerUps.spawnBossPowerUp(2800, -1400)
            // }
            if (simulation.difficultyMode > 1 || level.levelsCleared > 1) {
                const bossSpawn = [{ x: -1900, y: -1825 }, { x: 2025, y: -1825 }, { x: 950, y: -1825 }, { x: -850, y: -1825 }]
                const where = bossSpawn[Math.floor(Math.random() * bossSpawn.length)]
                if (level.levelsCleared > 7) { //T3
                    spawn.randomLevelBoss(where.x, where.y, ["historyBoss", "laserLayerBoss", "conductorBoss"]);
                } else if (level.levelsCleared > 3) { //T2
                    spawn.randomLevelBoss(where.x, where.y, ["blockBoss", "pulsarBoss", "spawnerBossCulture"]);
                } else {  //T1
                    spawn.randomLevelBoss(where.x, where.y, ["shooterBoss", "shieldingBoss"]);
                }
                spawn.secondaryBossChance(3486, -557, [Math.random() < 0.5 ? "trainBoss" : "trainBoss2"]);
                // spawn.secondaryBossChance(3486, -557, ["trainBoss2"]);
            } else {
                powerUps.spawnBossPowerUp(2800, -1400)
            }
            powerUps.spawnStartingPowerUps(11750, -1000);
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        refinery() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(4350, 325, true)
                level.setPosToSpawn(4350, 250);
                level.exit.x = -4375
                level.exit.y = 115
            } else {
                level.announceText(-4325, 175, true)
                level.setPosToSpawn(-4325, 100);
                level.exit.x = 4300
                level.exit.y = 270
            }
            level.defaultZoom = 2000
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#c8c5c3"
            color.map = "#474444"
            const backgroundMapColor = "#c1bdba"
            const backgroundRects = [
                { x: -1875, y: -150, width: 1000, height: 100 },
                { x: -3625, y: -700, width: 750, height: 100 },
                { x: -3125, y: -1025, width: 100, height: 725 },
                { x: -3275, y: 350, width: 100, height: 400 },
                { x: -1700, y: -450, width: 100, height: 915 },
                { x: -2000, y: -1075, width: 100, height: 1325 },
                { x: -600, y: 800, width: 100, height: 200 },
                { x: -1400, y: 750, width: 400, height: 100 },
                { x: 1025, y: 750, width: 950, height: 100 },
                { x: 775, y: -1100, width: 350, height: 2300 },
                { x: 2875, y: -1050, width: 350, height: 1000 },
                { x: 3275, y: 425, width: 300, height: 100 },
                { x: -850, y: -1025, width: 100, height: 575 },
                { x: -350, y: -1025, width: 100, height: 250 },
                { x: 1616, y: -581, width: 625, height: 100 }
            ]

            const buttons = []
            const buttonColor = "hsl(15, 100%, 65%)"
            //buttons across the furnace floor
            // buttons.push(level.button(-2465, 993, 126))
            const x = 2925
            buttons.push(level.button(887 - x, 963, 126))
            spawn.mapRect(630 - x, 990, 640, 100);
            spawn.mapRect(660 - x, 980, 580, 100);
            spawn.mapRect(690 - x, 970, 520, 100);


            buttons.push(level.button(887, 963, 126))
            spawn.mapRect(630, 990, 640, 100);
            spawn.mapRect(660, 980, 580, 100);
            spawn.mapRect(690, 970, 520, 100);

            // buttons.push(level.button(2335, 993, 126))
            //buttons on the safe doorway ledges
            buttons.push(level.button(-4075, 130, 126))
            buttons.push(level.button(3925, 133, 126))
            const hazard = level.hazard(-3600, -1000, 7150, 2000, 0.0006)
            const doors = []
            doors.push(level.door(-3650, -150, 35, 275, 225, 5))
            doors.push(level.door(3565, -150, 35, 325, 275, 5))
            const hazardCooldownCycles = 22 * 60
            const hazardPreviewCycles = 6 * 60
            let hazardState = "burning"
            let hazardStateCycles = 0

            const hangingBodyRadius = 70
            const hangingBodyHalfStraight = 330
            const hangingBodyEndSegments = 20
            const hangingBodyVertices = []
            for (let i = 0; i <= hangingBodyEndSegments; i++) {
                const angle = -Math.PI / 2 + Math.PI * i / hangingBodyEndSegments
                hangingBodyVertices.push(`${(hangingBodyHalfStraight + hangingBodyRadius * Math.cos(angle)).toFixed(3)} ${(hangingBodyRadius * Math.sin(angle)).toFixed(3)}`)
            }
            for (let i = 0; i <= hangingBodyEndSegments; i++) {
                const angle = Math.PI / 2 + Math.PI * i / hangingBodyEndSegments
                hangingBodyVertices.push(`${(-hangingBodyHalfStraight + hangingBodyRadius * Math.cos(angle)).toFixed(3)} ${(hangingBodyRadius * Math.sin(angle)).toFixed(3)}`)
            }
            spawn.bodyVertex(175, 500, hangingBodyVertices.join(" "))
            const hangingBody = body[body.length - 1]
            hangingBody.frictionAir = 0.001
            hangingBody.isNotHoldable = true
            const hangingConstraints = []
            hangingConstraints.push(cons[cons.length] = Constraint.create({
                pointA: { x: -300, y: -727 },
                pointB: { x: -350, y: -50 },
                bodyB: hangingBody,
                stiffness: 0.0005,
                damping: 0,
            }))
            Composite.add(engine.world, hangingConstraints[hangingConstraints.length - 1]);
            hangingConstraints.push(cons[cons.length] = Constraint.create({
                pointA: { x: 650, y: -724 },
                pointB: { x: 350, y: -50 },
                bodyB: hangingBody,
                stiffness: 0.0005,
                damping: 0
            }))
            Composite.add(engine.world, hangingConstraints[hangingConstraints.length - 1]);
            const hangingConstraintStartLengths = hangingConstraints.map(constraint => constraint.length)

            const hangingBodyTopX = 175
            const horizontalAngle = Math.asin((hangingConstraints[1].pointA.y - hangingConstraints[0].pointA.y) / (hangingConstraints[1].pointB.x - hangingConstraints[0].pointB.x))
            const horizontalCos = Math.cos(horizontalAngle)
            const horizontalSin = Math.sin(horizontalAngle)
            const leftAttachmentX = hangingBodyTopX + hangingConstraints[0].pointB.x * horizontalCos - hangingConstraints[0].pointB.y * horizontalSin
            const rightAttachmentX = hangingBodyTopX + hangingConstraints[1].pointB.x * horizontalCos - hangingConstraints[1].pointB.y * horizontalSin
            const hangingConstraintMinLengths = [
                leftAttachmentX - hangingConstraints[0].pointA.x,
                hangingConstraints[1].pointA.x - rightAttachmentX
            ]

            const hangingBodyTravelCycles = 4 * 60
            let hangingBodyMotionCycle = 0

            level.custom = () => {
                ctx.fillStyle = backgroundMapColor
                for (let i = 0; i < backgroundRects.length; i++) {
                    const rect = backgroundRects[i]
                    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
                }
                if (!m.isTimeDilated) {
                    hangingBodyMotionCycle = (hangingBodyMotionCycle + 1) % (2 * hangingBodyTravelCycles)
                    const phase = hangingBodyMotionCycle / hangingBodyTravelCycles
                    const progress = phase <= 1 ? phase : 2 - phase
                    const smoothProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress)
                    for (let i = 0; i < hangingConstraints.length; i++) {
                        hangingConstraints[i].length = hangingConstraintStartLengths[i] + (hangingConstraintMinLengths[i] - hangingConstraintStartLengths[i]) * smoothProgress
                    }
                }
                //give the player horizontal traction and keep leg animation synced on the suspended body
                if (m.onGround && m.standingOn === hangingBody) {
                    m.moverX = hangingBody.velocity.x
                    m.Vx = player.velocity.x - hangingBody.velocity.x
                }
                for (let i = 0; i < buttons.length; i++) {
                    if (hazardState === "cooldown") {
                        buttons[i].isUp = false
                    } else {
                        const wasUp = buttons[i].isUp
                        buttons[i].query();
                        if (wasUp && !buttons[i].isUp) {
                            hazard.isOn = false
                            hazardState = "cooldown"
                            hazardStateCycles = hazardCooldownCycles
                            level.inGameText(buttons[i].min.x + buttons[i].width / 2 + 5, buttons[i].max.y + 55, hazardState, 180)
                        }
                    }
                }
                if (hazardState === "cooldown") {
                    for (let i = 0; i < buttons.length; i++) buttons[i].isUp = false
                }
                for (let i = 0; i < buttons.length; i++) {
                    buttons[i].draw();
                }
                for (let i = 0; i < doors.length; i++) {
                    doors[i].isClosing = hazardState === "burning"
                    doors[i].openClose();
                }
                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                if (!m.isTimeDilated) {
                    if (hazardState === "burning") {
                        hazard.heatQuery();
                    } else if (hazardState === "cooldown") {
                        hazardStateCycles--
                        if (hazardStateCycles <= 0) {
                            hazardState = "preview"
                            hazardStateCycles = hazardPreviewCycles
                        }
                    } else {
                        const opacity = 0.3 * (1 - hazardStateCycles / hazardPreviewCycles) + 0.06 * Math.random()
                        hazard.heatWarning(opacity)
                        hazardStateCycles--
                        if (hazardStateCycles <= 0) {
                            hazard.isOn = true
                            hazardState = "burning"
                        }
                    }
                }
                if (hazardState !== "cooldown") {
                    ctx.beginPath()
                    for (let i = 0; i < 3; i++) {
                        const x = buttons[i].min.x + buttons[i].width / 2
                        const y = buttons[i].max.y
                        ctx.moveTo(x + 200, y)
                        ctx.arc(x, y, 150, 0, 2 * Math.PI)
                    }
                    ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.15 * Math.random()})`
                    ctx.fill()
                    ctx.beginPath()
                    for (let i = 0; i < 3; i++) {
                        const x = buttons[i].min.x + buttons[i].width / 2
                        const y = buttons[i].max.y
                        ctx.moveTo(x + 200, y)
                        ctx.arc(x, y, 325, 0, 2 * Math.PI)
                    }
                    ctx.fillStyle = `rgba(255,255,255,${0.07 + 0.07 * Math.random()})`
                    ctx.fill()
                    // ctx.strokeStyle = "#fff"
                    // ctx.lineWidth = 4
                    // ctx.stroke()
                }

                ctx.beginPath()
                for (let i = 0; i < hangingConstraints.length; i++) {
                    const constraint = hangingConstraints[i]
                    ctx.moveTo(constraint.pointA.x, constraint.pointA.y)
                    ctx.lineTo(constraint.bodyB.position.x + constraint.pointB.x, constraint.bodyB.position.y + constraint.pointB.y)
                }
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(0,0,0,0.2)"
                ctx.stroke()
                for (let i = 0; i < doors.length; i++) doors[i].draw();

                ctx.fillStyle = "rgba(0,20,60,0.09)"
                if (simulation.isHorizontalFlipped) {
                    ctx.fillRect(3550, -150, 975, 500);
                    ctx.fillStyle = "rgba(0,255,255,0.1)"
                    ctx.fillRect(-4525, -125, 925, 275);
                } else {
                    ctx.fillRect(-4525, -125, 925, 275);
                    ctx.fillStyle = "rgba(0,255,255,0.1)"
                    ctx.fillRect(3550, -150, 975, 500);
                }
            };

            //pipes
            const pipeJunction = (x, y, radius = 50) => {
                map[map.length] = Bodies.circle(x, y, radius, undefined, 32)
            }
            const diagonalPipe = (x1, y1, x2, y2) => {
                const dx = x2 - x1
                const dy = y2 - y1
                const segment = map[map.length] = Bodies.rectangle((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(dx, dy), 100)
                Matter.Body.setAngle(segment, Math.atan2(dy, dx))
            }
            spawn.mapRect(-3225, 700, 825, 100);
            spawn.mapRect(-2400, 415, 750, 100);
            spawn.mapRect(-2450, 465, 100, 285);
            pipeJunction(-2400, 750)
            pipeJunction(-2400, 465)
            pipeJunction(-3225, 750)
            pipeJunction(-1650, 465)

            spawn.mapRect(-2475, -150, 625, 100);
            spawn.mapRect(-3075, -350, 475, 100);
            diagonalPipe(-2600, -300, -2475, -100)
            pipeJunction(-2600, -300)
            pipeJunction(-2475, -100)
            pipeJunction(-3075, -300)
            pipeJunction(-1850, -100)

            spawn.mapRect(-2275, -500, 625, 100);
            spawn.mapRect(-2875, -700, 475, 100);
            diagonalPipe(-2400, -650, -2275, -450)
            pipeJunction(-2400, -650)
            pipeJunction(-2275, -450)
            pipeJunction(-2875, -650)
            pipeJunction(-1650, -450)

            spawn.mapRect(-1950, 200, 900, 100);
            spawn.mapRect(-1100, 250, 100, 550);
            spawn.mapRect(-1050, 750, 500, 100);
            pipeJunction(-1050, 250)
            pipeJunction(-1050, 800)
            pipeJunction(-1950, 250)
            pipeJunction(-550, 800)

            spawn.mapRect(-900, -150, 425, 100);
            spawn.mapRect(-525, -450, 100, 350);
            spawn.mapRect(-800, -500, 325, 100);
            pipeJunction(-475, -100)
            pipeJunction(-475, -450)
            pipeJunction(-800, -450)
            pipeJunction(-900, -100)

            //big pipe
            spawn.mapRect(950, -250, 2100, 350);
            spawn.mapRect(2225, -575, 350, 500);
            spawn.mapRect(775, -75, 350, 525);
            spawn.mapRect(-1575, 925, 350, 125);
            pipeJunction(3050, -75, 175)
            pipeJunction(950, -75, 175)
            pipeJunction(2400, -575, 175)
            pipeJunction(950, 450, 175)
            pipeJunction(-1400, 925, 175)

            spawn.mapRect(2850, 425, 425, 100);
            spawn.mapRect(2800, 475, 100, 325);
            spawn.mapRect(1975, 750, 875, 100);
            pipeJunction(2850, 475)
            pipeJunction(2850, 800)
            pipeJunction(3275, 475)
            pipeJunction(1975, 800)

            spawn.mapRect(-300, -825, 1650, 100);
            diagonalPipe(1350, -775, 1616, -531)
            pipeJunction(-300, -775)
            pipeJunction(1350, -775)
            pipeJunction(1616, -531)

            spawn.mapRect(-3650, 300, 425, 100);
            pipeJunction(-3225, 350)

            //outer shell
            spawn.mapRect(4500, -2000, 1500, 4000); //right wall
            spawn.mapRect(-6000, -2000, 1475, 4000); //left wall
            spawn.mapRect(-6000, -4000, 12000, 3000); //ceiling
            spawn.mapRect(-6000, 1000, 12000, 3000); //floor

            //entrance
            spawn.mapRect(-4550, -1050, 950, 925);
            spawn.mapRect(-4550, 140, 950, 900);
            spawn.mapRect(-4550, 130, 175, 25);
            spawn.mapRect(-4275, 130, 525, 100);
            spawn.mapRect(-3825, 120, 225, 100);

            //exit
            spawn.mapRect(4300, 290, 100, 25);
            spawn.mapRect(4050, 300, 475, 700);
            spawn.mapRect(3550, -1025, 1000, 900);
            spawn.mapRect(3550, 150, 625, 900);
            spawn.mapRect(3650, 140, 475, 25);
            spawn.mapVertex(4510, -135, "0 0  -500 0  0 500");

            //blocks//commented out because the blocks float up from the burn effect and can destroy mobs too early
            spawn.bodyRect(-2575, 550, 125, 150, 0.4);
            spawn.bodyRect(-2675, -475, 75, 125, 0.4);
            spawn.bodyRect(-650, -550, 300, 50, 0.4);
            spawn.bodyRect(1125, -425, 100, 175, 0.4);
            spawn.bodyRect(775, 800, 75, 200, 0.4);
            spawn.bodyRect(2575, -350, 100, 100, 0.4);
            spawn.bodyRect(2525, 625, 75, 125, 0.4);
            spawn.bodyRect(-3925, 175, 25, 25, 0.4);
            spawn.bodyRect(-3600, 225, 75, 75, 0.4);

            //mobs
            spawn.randomMobPositions = [
                [-2750, -800],
                [-775, -325],
                [500, -900],
                [2400, -800],
                [3275, -250],
                [3075, 275],
                [3150, 700],
                [2325, 625],
                [-375, 775],
                [-775, 650],
                [-1600, 100],
                [-2350, -275],
                [-3325, 150],
                [-3450, 750],
                [-2900, 925],
                [-2175, 300],
                [-1375, 125],
                [-700, -200],
                [-550, -650],
                [1175, -900],
                [1125, -300],
                [1050, 825],
                [1800, 925],
                [2250, 675],
                [3100, 900],
                [2850, -300],
                [-1550, 100],
                [-2225, 350]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()


            const bossSpawn = Math.random() < 0.5 ? { x: 944, y: -498 } : { x: -1327, y: -580 }
            spawn.randomLevelBoss(bossSpawn.x, bossSpawn.y)
            const secondaryBossSpawn = Math.random() < 0.5 ? { x: 1573, y: 506 } : { x: -697, y: 346 }
            spawn.secondaryBossChance(secondaryBossSpawn.x, secondaryBossSpawn.y)

            powerUps.chooseRandomPowerUp(-2520, -740);
            powerUps.chooseRandomPowerUp(-547, -608);
            powerUps.chooseRandomPowerUp(421, -870);
            powerUps.chooseRandomPowerUp(2631, -324);
            powerUps.chooseRandomPowerUp(-2641, -365);
            powerUps.chooseRandomPowerUp(2951, 975);
            powerUps.chooseRandomPowerUp(-1687, 948);
            powerUps.spawnStartingPowerUps(-606, -213)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

        },
        furnace() {
            level.announceMobTypes()
            if (simulation.isHorizontalFlipped) {
                level.announceText(4350, 325, true)
                level.setPosToSpawn(4350, 250);
                level.exit.x = -4375
                level.exit.y = 115
            } else {
                level.announceText(-4325, 175, true)
                level.setPosToSpawn(-4325, 100);
                level.exit.x = 4300
                level.exit.y = 270
            }
            level.defaultZoom = 2000
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#c8c5c3" //"#d6d2d1"//"#d0d5d5";
            color.map = "#474444"

            const hazards = [] //hazard(x, y, width, height, damage = 0.002) for slime
            const hazardOnCycles = 100 + 30 * simulation.difficultyMode
            const hazardOffCycles = 600 * (3 - 0.16 * simulation.difficultyMode)
            const dmg = 0.0006
            hazards.push(level.hazard(-3600, -1000, 1075, 2000, dmg))
            hazards[hazards.length - 1].countdown = 60
            hazards[hazards.length - 1].isOn = false
            hazards.push(level.hazard(-1425, -1000, 2475, 2000, dmg))
            hazards[hazards.length - 1].countdown = 60 + 1 / 3 * (hazardOffCycles + hazardOnCycles)
            hazards[hazards.length - 1].isOn = false
            hazards.push(level.hazard(2150, -1000, 1400, 2000, dmg))
            hazards[hazards.length - 1].countdown = 60 + 2 / 3 * (hazardOffCycles + hazardOnCycles)
            hazards[hazards.length - 1].isOn = false

            const spinners = [] //spinner(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0) {
            const blocks = []
            const movers = [] //mover(x, y, width, height, VxGoal = -6, force = VxGoal > 0 ? 0.0005 : -0.0005) {
            movers.push(level.mover(-2525, 720, 1100, 50, 0))
            movers.push(level.mover(1050, 620, 1100, 50, 0))

            level.custom = () => {
                // ctx.fillStyle = "#cacfcf"
                for (let i = 0; i < movers.length; i++) {
                    movers[i].push();
                    movers[i].draw();
                }
                level.exit.drawAndCheck();
                level.enter.draw();

                ctx.fillStyle = "#b9b9b9" //scaffolding
                //center
                ctx.fillRect(450, -600, 75, 1575);
                ctx.fillRect(-900, -600, 75, 1575);

                //right
                ctx.fillRect(2575, -1025, 50, 2100);
                ctx.fillRect(3050, -1025, 50, 2100);
            };
            level.customTopLayer = () => {
                if (!m.isTimeDilated) {
                    for (let i = 0; i < hazards.length; i++) {
                        if (!hazards[i].isOn) {
                            hazards[i].countdown--
                            if (hazards[i].countdown < 0) {
                                hazards[i].countdown = hazardOnCycles
                                hazards[i].isOn = true
                                //movers push player into the active hazards
                                const speed = Math.floor(2 + 1 * simulation.difficultyMode)
                                if (i === 0) {
                                    movers[0].VxGoal = -speed
                                    movers[0].force = -0.0005
                                } else if (i === 1) {
                                    movers[0].VxGoal = speed
                                    movers[0].force = 0.0005
                                    movers[1].VxGoal = -speed
                                    movers[1].force = -0.0005
                                } else {
                                    movers[1].VxGoal = speed
                                    movers[1].force = 0.0005
                                }
                            }
                            if (hazards[i].countdown < 240) {
                                const opacity = 0.3 * (1 - hazards[i].countdown / 240) + 0.06 * Math.random()
                                hazards[i].heatWarning(opacity)
                                // hazards[i].heatWarning()
                            }
                            // else if (hazards[i].countdown % (hazardOffCycles / 4) < 30) {
                            //     hazards[i].heatWarning()
                            // }
                        } else {
                            hazards[i].heatQuery();
                            hazards[i].countdown--
                            if (hazards[i].countdown < 0) {
                                hazards[i].isOn = false
                                hazards[i].countdown = hazardOffCycles
                                //stop movers
                                movers[0].VxGoal = 0
                                movers[0].force = 0
                                movers[1].VxGoal = 0
                                movers[1].force = 0
                            }
                        }
                    }

                }

                //give player some horizontal traction and proper leg animation on specific moving blocks
                if (m.onGround) {
                    for (let i = 0; i < blocks.length; i++) {
                        if (m.standingOn === blocks[i]) {
                            m.moverX = blocks[i].velocity.x //helps sync leg movements
                            m.Vx = player.velocity.x - blocks[i].velocity.x //adds blocks velocity to player
                        }
                    }
                }
                ctx.beginPath();
                ctx.moveTo(constraint1.pointA.x, constraint1.pointA.y);
                ctx.lineTo(constraint1.bodyB.position.x + constraint1.pointB.x, constraint1.bodyB.position.y + constraint1.pointB.y);
                ctx.moveTo(constraint2.pointA.x, constraint2.pointA.y);
                ctx.lineTo(constraint2.bodyB.position.x + constraint2.pointB.x, constraint2.bodyB.position.y + constraint2.pointB.y);
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.stroke();

                // ctx.beginPath();
                // for (let i = 0, len = blocks.length; i < len; i++) {
                //     let vertices = blocks[i].vertices;
                //     ctx.moveTo(vertices[0].x, vertices[0].y);
                //     for (let j = 1; j < vertices.length; j += 1) {
                //         ctx.lineTo(vertices[j].x, vertices[j].y);
                //     }
                //     ctx.lineTo(vertices[0].x, vertices[0].y);
                // }
                // ctx.strokeStyle = "#222"
                // ctx.lineWidth = 6
                // ctx.stroke();


                //central dot on spinners
                if (spinners.length) {
                    ctx.beginPath();
                    ctx.arc(spinners[0].pointA.x, spinners[0].pointA.y, 9, 0, 2 * Math.PI);
                    for (let i = 0, len = spinners.length; i < len; i++) {
                        ctx.moveTo(spinners[i].pointA.x, spinners[i].pointA.y)
                        ctx.arc(spinners[i].pointA.x, spinners[i].pointA.y, 9, 0, 2 * Math.PI);
                    }
                    ctx.fillStyle = "#233"
                    ctx.fill();
                }
                //shadows
                ctx.fillStyle = "rgba(0,20,60,0.09)"
                ctx.fillRect(-2525, -825, 1100, 1675);
                ctx.fillRect(1050, -825, 1100, 1675);
                ctx.fillRect(-269, 675, 163, 250);
                if (simulation.isHorizontalFlipped) {
                    ctx.fillRect(3550, -150, 975, 500);
                    ctx.fillStyle = "rgba(0,255,255,0.1)" //"#d4f4f4" //exit
                    ctx.fillRect(-4525, -125, 925, 275);
                } else {
                    ctx.fillRect(-4525, -125, 925, 275);
                    ctx.fillStyle = "rgba(0,255,255,0.1)" //"#d4f4f4" //exit
                    ctx.fillRect(3550, -150, 975, 500);
                }
            };

            //boxes center on zero,zero with deep walls to hide background
            spawn.mapRect(4500, -2000, 1500, 4000); //right map wall
            // spawn.mapRect(-6000, -2000, 2000, 4000); //left map wall
            spawn.mapRect(-6000, -2000, 1475, 4000);
            spawn.mapRect(-6000, -4000, 12000, 3000); //map ceiling
            spawn.mapRect(-6000, 1000, 12000, 3000); //floor

            //entrance
            spawn.mapRect(-4550, -1050, 950, 925);
            spawn.mapRect(-4550, 140, 950, 900);
            spawn.mapRect(-4550, 130, 175, 25);
            spawn.mapRect(-4275, 130, 225, 100);
            spawn.mapRect(-4050, 120, 225, 100);
            spawn.mapRect(-3825, 110, 225, 100);
            spawn.bodyRect(-3780, -125, 50, 235);

            //safe zone left
            spawn.mapVertex(-1975, 500, "225 -20  225 20  200 45  -200 45  -225 20  -225 -20  -200 -45  200 -45");
            spawn.mapVertex(-1975, -1000, "600 -250  600 250  550 300  -550 300  -600 250  -600 -250");
            spawn.mapVertex(-1975, 0, "600 -250  600 250  550 300  -550 300  -600 250  -600 -250  -550 -300  550 -300");
            spawn.mapVertex(-1975, 1000, "600 -250  600 250    -600 250  -600 -250  -550 -300  550 -300");
            spawn.mapRect(-1500, -525, 75, 275);
            powerUps.spawn(-2150, -375, "heal");
            powerUps.spawn(-1925, -375, "heal");
            powerUps.spawn(1325, -175, "heal");
            powerUps.spawn(-1525, -400, "heal");
            powerUps.spawn(125, 950, "heal");
            powerUps.spawn(-2150, -475, "ammo");
            powerUps.spawn(-1925, -475, "ammo");
            spawn.bodyRect(-1490, -725, 50, 200, 0.5);


            //ball on string
            spawn.bodyVertex(-3100, 450, "400 -50  400 50  350 100  -350 100  -400 50  -400 -50  -350 -100  350 -100")
            blocks.push(body[body.length - 1])
            blocks[0].isNotHoldable = true

            const constraint1 = cons[cons.length] = Constraint.create({
                pointA: { x: -3600, y: 150 },
                pointB: { x: -350, y: -50 }, //offset of point A from bodyB
                bodyB: body[body.length - 1],
                stiffness: 0.001
            });
            Composite.add(engine.world, cons[cons.length - 1]);
            const constraint2 = cons[cons.length] = Constraint.create({
                pointA: { x: -2575, y: 150 },
                pointB: { x: 350, y: -50 },//offset of point A from bodyB
                bodyB: body[body.length - 1],
                stiffness: 0.001
            });
            Composite.add(engine.world, cons[cons.length - 1]);

            // cons[cons.length] = Constraint.create({
            //     pointA: { x: -3100, y: 1000 },
            //     pointB: { x: 0, y: 50 },//offset of point A from bodyB
            //     bodyB: body[body.length - 1],
            //     stiffness: 0.001
            // });
            // Composite.add(engine.world, cons[cons.length - 1]);

            spinners.push(level.spinner(-3462, -175, 700, 50, 0.001, 0, 0, 0.1))
            Matter.Body.setAngularVelocity(spinners[spinners.length - 1].bodyB, 0);
            // spinners.push(level.spinner(-3462, 500, 700, 50, 0.001, 0, 0, 0.1))
            // Matter.Body.setAngularVelocity(spinners[spinners.length - 1].bodyB, 0);


            //center
            //top
            spawn.mapVertex(-862, -800, "-75 0   75 0   75 400   35 435   -35 435   -75 400");
            spawn.mapVertex(-189, -800, "-75 0   75 0   75 400   35 435   -35 435   -75 400");
            spawn.mapVertex(484, -800, "-75 0   75 0   75 400   35 435   -35 435   -75 400");
            //ground
            spawn.mapVertex(-862, 1060, "-50 0   -500 200   500 200   50 0");
            spawn.mapVertex(-189, 1000, "-100 0  -275 200  275 200  100 0");
            spawn.mapVertex(-189, 525, "-80 0  -35 -35   35 -35   80 0   80 300   -80 300");
            spawn.mapVertex(484, 1060, "-50 0   -500 200   500 200   50 0");
            //scaffolding
            spawn.mapRect(475, 650, 225, 25);
            spawn.mapRect(275, 325, 225, 25);
            spawn.mapRect(475, 0, 225, 25);
            spawn.mapRect(275, -325, 225, 25);

            //safe zone right
            spawn.mapVertex(1600, -1100, "600 -250  600 250  550 300  -550 300  -600 250  -600 -250");
            spawn.mapVertex(1600, 200, "600 -100  600 100  550 150  -550 150  -600 100  -600 -100  -550 -150  550 -150");
            spawn.mapVertex(1600, 900, "600 -250  600 250    -600 250  -600 -250  -550 -300  550 -300");
            spawn.mapRect(1050, -850, 75, 700);
            spawn.mapVertex(1600, 120, "-100 0   -500 200   500 200   100 0");
            // spawn.mapVertex(1600, -230, "-100 0  -35 -35   35 -35   100 0   100 200   -100 200");
            spawn.mapVertex(1600, -250, "275 -25  275 25  250 50  -250 50  -275 25  -275 -25  -250 -50  250 -50");

            //far right zone
            spawn.mapRect(2925, 750, 300, 25);
            spawn.mapRect(2450, 450, 300, 25);
            spawn.mapRect(2925, 150, 300, 25);
            spawn.mapRect(2450, -150, 300, 25);
            spawn.mapRect(2925, -450, 300, 25);
            spawn.mapRect(2450, -750, 300, 25);

            //exit
            // spawn.mapRect(3550, 150, 500, 900);
            // spawn.mapRect(3550, -1020, 500, 900);
            spawn.mapRect(4300, 290, 100, 25);
            spawn.mapRect(4050, 300, 475, 700);
            spawn.mapRect(3550, -1025, 1000, 900);
            spawn.mapRect(3550, 150, 625, 900);
            spawn.mapRect(3650, 140, 475, 25);
            spawn.mapVertex(4510, -135, "0 0  -500 0  0 500");
            spawn.bodyRect(3625, -125, 25, 274);

            spawn.bodyRect(-2325, -400, 75, 100, 0.7);
            spawn.bodyRect(1075, -50, 175, 100, 0.7);
            spawn.bodyRect(1950, -200, 75, 250, 0.6);

            spawn.randomMobPositions = [
                [-2100, 525],
                [-1900, -525],
                [1850, -50],
                [1975, 475],
                [2350, 900],
                [150, 950],
                [-525, 925],
                [-2325, 625],
                [-2275, -375],
                [1950, -50],
                [2675, -200],
                [3100, -500],
                [-125, 775],
                [-825, 800],
                [475, 825],
                [-2650, 900],
                [2825, 975],
                [-2925, 875]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            spawn.randomLevelBoss(-600, 500);
            spawn.secondaryBossChance(125, 100);

            powerUps.spawnStartingPowerUps(1625, 25)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
            powerUps.chooseRandomPowerUp(-1600, -350);
            powerUps.chooseRandomPowerUp(-175, 800);
            powerUps.chooseRandomPowerUp(1675, 0);
            powerUps.chooseRandomPowerUp(2825, 975);
            powerUps.chooseRandomPowerUp(-3175, 925);
        },
        lock() {
            level.announceText(0, 75, true)
            level.announceMobTypes()
            level.setPosToSpawn(0, -65); //lower start
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.y = 2010;
            level.exit.x = 2625;
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
            level.defaultZoom = 2200
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "hsl(138, 5%, 82%)";
            color.map = "#444"
            powerUps.spawnStartingPowerUps(1768, 870); //on left side
            const portal = level.portal({ x: 1070, y: -1485 }, -0.9, { x: 475, y: 50 }, -Math.PI / 2)
            const doorCenterRight = level.door(2787, 775, 25, 225, 195, 5) //x, y, width, height, distance, speed = 1
            const doorCenterLeft = level.door(2537, 775, 25, 225, 195, 5)
            const doorButtonRight = level.door(4462, 1010, 25, 225, 195, 5)
            const doorLeft = level.door(2538, 1825, 25, 225, 195, 5)
            const buttonLeft = level.button(4565, 1235)
            const buttonRight = level.button(4142, -355)
            // spawn.mapRect(4000, -350, 700, 125); //button platform
            spawn.mapRect(4000, -350, 600, 75);
            buttonLeft.isUp = true
            buttonRight.isUp = true
            const hazardSlimeLeft = level.hazard(900, -300, 1638, 2450) //hazard(x, y, width, height, damage = 0.002) {
            const hazardSlimeRight = level.hazard(2812, -300, 1650, 2450) //hazard(x, y, width, height, damage = 0.002) {
            const balance = []
            level.custom = () => {
                ctx.fillStyle = "hsl(175, 35%, 76%)" //exit
                ctx.fillRect(2537, 1775, 275, 275)
                level.exit.drawAndCheck();
                level.enter.draw();

                doorButtonRight.isClosing = hazardSlimeRight.min.y < 1275
                doorCenterRight.isClosing = hazardSlimeRight.min.y < 1000
                doorCenterLeft.isClosing = hazardSlimeLeft.min.y < 1000
                doorLeft.isClosing = hazardSlimeLeft.min.y < 2050
                doorButtonRight.openClose();
                doorCenterRight.openClose();
                doorCenterLeft.openClose();
                doorLeft.openClose();
                if (buttonRight.isUp) {
                    buttonRight.query();
                    if (!buttonRight.isUp) spawnRightMobs()
                }
                if (buttonLeft.isUp) {
                    buttonLeft.query();
                    if (!buttonLeft.isUp) spawnLeftMobs()
                }
                buttonRight.draw();
                buttonLeft.draw();
                if (hazardSlimeLeft.min.y < 2050) {
                    const drainRate = Math.min(Math.max(0.25, 4 - hazardSlimeLeft.min.y / 500), 4)
                    hazardSlimeLeft.level(buttonLeft.isUp, drainRate)
                }
                if (hazardSlimeRight.min.y < 2050) {
                    const drainRate = Math.min(Math.max(0.25, 4 - hazardSlimeRight.min.y / 500), 4)
                    hazardSlimeRight.level(buttonRight.isUp, drainRate)
                }
                portal[2].query()
                portal[3].query()
            };
            level.customTopLayer = () => {
                doorButtonRight.draw();
                doorCenterRight.draw();
                doorCenterLeft.draw();
                doorLeft.draw();
                hazardSlimeLeft.query();
                hazardSlimeRight.query();
                portal[0].draw();
                portal[1].draw();
                portal[2].draw();
                portal[3].draw();
                ctx.fillStyle = color.map //below portal
                ctx.fillRect(375, 150, 200, 2525);
                ctx.fillStyle = "rgba(0,0,0,0.1)" //shadows
                ctx.fillRect(-250, -1550, 1250, 1575);
                ctx.fillRect(2537, -350, 275, 2425);
                ctx.fillStyle = "rgba(0,0,0,0.05)" //exit
                ctx.fillRect(-175, -300, 375, 300)
                ctx.fillRect(4460, 950, 350, 325);
                ctx.fillStyle = "#233" //balances center dot
                ctx.beginPath();
                for (let i = 0; i < balance.length; i++) {
                    ctx.arc(balance[i].center.x, balance[i].center.y, 9, 0, 2 * Math.PI);
                }
                ctx.fill();
                // for (let i = 0, len = vanish.length; i < len; i++) vanish[i].query()
            };
            //entrance and outer walls
            spawn.mapRect(-1400, 0, 1800, 2675);
            spawn.mapRect(-1400, -1025, 1225, 1500);
            spawn.mapRect(-325, -15, 525, 225);
            spawn.mapRect(150, -350, 50, 175);

            spawn.mapRect(-1400, -3525, 1600, 3225);
            spawn.mapRect(550, 0, 450, 2675);

            spawn.mapRect(550, -1550, 450, 125);
            spawn.mapRect(150, -1550, 250, 125);
            spawn.mapRect(750, -1425, 1100, 175);
            spawn.mapRect(750, -1400, 250, 825);
            spawn.mapRect(750, -350, 250, 575);
            spawn.mapRect(625, 2100, 4300, 575); //floor
            spawn.mapRect(-1400, -4425, 7250, 1000); //ceiling
            //left button room  (on the far right in the
            spawn.mapRect(4450, -3525, 1400, 4500);
            spawn.mapRect(4450, 1235, 1400, 1440);
            spawn.mapRect(4775, 750, 1075, 825);
            spawn.mapRect(4450, 950, 50, 75);

            //right side
            if (Math.random() < 1) {
                spawn.mapVertex(3350, 350, "-100 0  100 0  100 700  0 750  -100 700");
                balance.push(level.rotor(3463, 150, 300, 25, 0.001, 0)) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                balance.push(level.rotor(3463, 500, 300, 25, 0.001, 0))
                spawn.mapVertex(3875, 350, "-100 0  100 0  100 700  0 750  -100 700");

                spawn.mapVertex(2900, 1743, "-100 0  70 0  100 30   100 1000   -100 1000");
                spawn.mapVertex(3025, 1811, "-150 0  120 0  150 30   150 600   -150 600");
                spawn.mapVertex(3200, 2079, "-150 0  120 0  150 30   150 600   -150 600");
                spawn.mapVertex(4425, 1743, "-150 30 -120 0  150 0   150 1000   -150 1000");
                spawn.mapVertex(4250, 1811, "-150 30 -120 0  150 0   150 600   -150 600");
                spawn.mapVertex(4075, 2079, "-150 30 -120 0  150 0   150 600   -150 600");

                //escape ledge when drowning
                spawn.mapRect(2750, 525, 100, 25);
                spawn.mapRect(2750, 125, 100, 25);
                spawn.mapRect(4425, 800, 75, 25);
                spawn.mapRect(4425, 325, 75, 25);
            }
            //left side
            if (Math.random() < 1) {
                // spawn.mapVertex(2325, 1325, "-150 0  150 0  150 150  0 225  -150 150");
                spawn.mapVertex(1285, 1275, "-150 0  150 0  150 150  0 225  -150 150");
                spawn.mapVertex(1033, 1750, "0 200  200 200  300 50  300 -50  200 -200  0 -200");
                spawn.mapVertex(1575, 1750, "0 200  -200 200  -300 50  -300 -50  -200 -200  0 -200  100 -50  100 50"); //larger "0 400  -250 400  -400 100  -400 -100  -250 -400  0 -400"

                spawn.mapVertex(1287, 2185, "-100 30   -80 0   80 0  100 30   100 300   -100 300");
                spawn.mapVertex(2050, 2050, "-150 30   -120 0   120 0  150 30   150 300   -150 300");

                // spawn.mapRect(1700, 1550, 275, 25);
                // spawn.mapRect(2175, 1275, 325, 25);
                spawn.mapRect(1600, 950, 375, 25);

                spawn.mapRect(1025, -50, 50, 25);
                spawn.mapRect(1025, 275, 175, 25);
                spawn.mapRect(1025, 600, 325, 25);
                spawn.mapRect(2450, -50, 50, 25);
                spawn.mapRect(2325, 275, 175, 25);
                spawn.mapRect(2175, 600, 325, 25);
                // spawn.mapVertex(3400, 1250, "-100 -300  0 -350  100 -300  100 300  0 350  -100 300");
            }

            //left button room in center divider
            spawn.mapRect(2525, -350, 300, 1100);
            spawn.mapRect(2525, 975, 300, 800);
            spawn.mapRect(2775, 650, 50, 125);
            spawn.mapRect(2525, 650, 50, 125);

            //exit room
            spawn.mapRect(2475, 2040, 350, 200);
            spawn.mapRect(2800, 1750, 25, 325);
            spawn.mapRect(2525, 1750, 50, 75);

            //safety edge blocks  //maybe remove?
            // spawn.mapRect(2525, -375, 25, 50);
            // spawn.mapRect(2800, -375, 25, 50);
            // spawn.mapRect(1825, -1450, 25, 50);
            // spawn.mapRect(4000, -375, 25, 50);

            //blocks
            spawn.bodyRect(150, -175, 50, 165, 0.2); //block at entrance
            spawn.bodyRect(1275, 825, 100, 100, 0.2);
            spawn.bodyRect(2600, -425, 150, 50, 0.2);
            spawn.bodyRect(3900, -150, 50, 100, 0.2);
            spawn.bodyRect(3350, 1950, 75, 100, 0.2);
            spawn.bodyRect(3850, 1975, 75, 75, 0.2);
            spawn.bodyRect(1600, 1950, 75, 100, 0.2);
            spawn.bodyRect(725, -1650, 150, 100, 0.2);
            spawn.bodyRect(800, -1700, 75, 50, 0.2);

            const spawnRightMobs = () => {
                spawn.randomMobPositions = [
                    [4200, 100],
                    [4200, 600],
                    [2975, 625],
                    [3050, 100],
                    [3400, -100],
                    [3825, -100],
                    [3625, 1950],
                    [3275, 1650],
                    [3075, 1375],
                    [4000, 1650],
                    [4100, 1425]
                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                spawn.randomMobFromArray()
                spawn.randomGroup(3025, 325, 1);
                spawn.secondaryBossChance(3520, 1169)
            }

            const spawnLeftMobs = () => {
                spawn.randomMobPositions = [
                    [2375, 1900],
                    [1825, 1325],
                    [2250, 1050],
                    [1675, 825],
                    [1250, 575],
                    [2400, 575],
                    [1250, 1575],
                    [1075, -100],
                    [2450, -100]
                ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                spawn.randomMobFromArray()
                spawn.randomGroup(1350, -775, 1);
                spawn.randomLevelBoss(1491, 495);
            }
            spawn.randomMobPositions = [
                [2650, -750],
                [300, -1725],
                [750, -1775],
                [550, -2225],
                [2700, -475],
                [2375, -200],
                [3350, -225]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            //spawn.randomHigherTierMob(2676, -424)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
        },
        sewers() {
            level.announceText(0, 25, true)
            level.announceMobTypes()
            const button1 = level.button(6600, 2675)
            // const hazard = level.hazard(4550, 2750, 4550, 150)
            const hazard = level.hazard(simulation.isHorizontalFlipped ? -4550 - 4550 : 4550, 2750, 4550, 150)
            let balance1, balance2, balance3, balance4, rotor

            const drip1 = level.drip(6100, 1900, 2900, 100) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
            const drip2 = level.drip(7300, 1900, 2900, 150)
            const drip3 = level.drip(8750, 1900, 2900, 70)
            level.custom = () => {
                drip1.draw();
                drip2.draw();
                drip3.draw();
                button1.query();
                button1.draw();
                ctx.fillStyle = "hsl(175, 15%, 76%)"
                ctx.fillRect(9100, 2200, 800, 400)
                ctx.fillStyle = "rgba(0,0,0,0.03)" //shadows
                ctx.fillRect(6250, 2025, 700, 650)
                ctx.fillRect(8000, 2025, 600, 575)
                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                rotor.rotate();

                ctx.fillStyle = "#233"
                ctx.beginPath();
                ctx.arc(balance1.center.x, balance1.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance2.center.x, balance2.center.y)
                ctx.arc(balance2.center.x, balance2.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance3.center.x, balance3.center.y)
                ctx.arc(balance3.center.x, balance3.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance4.center.x, balance4.center.y)
                ctx.arc(balance4.center.x, balance4.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance5.center.x, balance5.center.y)
                ctx.arc(balance5.center.x, balance5.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(rotor.center.x, rotor.center.y)
                ctx.arc(rotor.center.x, rotor.center.y, 9, 0, 2 * Math.PI);
                ctx.fill();
                hazard.query();
                hazard.level(button1.isUp)
            };

            level.setPosToSpawn(0, -50); //normal spawn

            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = 9700;
            level.exit.y = 2560;
            level.defaultZoom = 1800
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "hsl(138, 3%, 74%)";
            color.map = "#3d4240"
            powerUps.spawnStartingPowerUps(3475, 1775);
            spawn.debris(4575, 2550, 1600, 9); //16 debris per level
            spawn.debris(7000, 2550, 2000, 7); //16 debris per level

            spawn.mapRect(-500, -600, 200, 800); //left entrance wall
            spawn.mapRect(-400, -600, 3550, 200); //ceiling
            spawn.mapRect(-400, 0, 3000, 200); //floor
            // spawn.mapRect(300, -500, 50, 400); //right entrance wall
            // spawn.bodyRect(312, -100, 25, 100);
            spawn.bodyRect(1450, -300, 150, 50);

            const xPos = [600, 1250, 2000];
            xPos.sort(() => Math.random() - 0.5);
            spawn.mapRect(xPos[0], -200, 300, 100);
            spawn.mapRect(xPos[1], -250, 300, 300);
            spawn.mapRect(xPos[2], -150, 300, 200);

            spawn.bodyRect(3100, 410, 75, 100);
            spawn.bodyRect(2450, -25, 250, 25);

            spawn.mapRect(3050, -600, 200, 800); //right down tube wall
            spawn.mapRect(3100, 0, 1200, 200); //tube right exit ceiling
            spawn.mapRect(4200, 0, 200, 1900);
            spawn.mapVertex(3500, 1000, "-500 -500  -400 -600   400 -600 500 -500   500 500 400 600  -400 600 -500 500");
            spawn.mapVertex(3600, 1950, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
            spawn.mapRect(3925, 2290, 310, 50);
            spawn.mapRect(3980, 2280, 200, 50);

            spawn.mapRect(2625, 2290, 650, 50);
            spawn.mapRect(2700, 2280, 500, 50);

            spawn.mapRect(2400, 0, 200, 1925); //left down tube wall
            spawn.mapRect(600, 2300, 3750, 200);
            spawn.bodyRect(3800, 275, 125, 125);

            spawn.mapRect(4200, 1700, 5000, 200);
            spawn.mapRect(4150, 2300, 200, 400);

            spawn.mapRect(600, 1700, 2000, 200); //bottom left room ceiling
            spawn.mapRect(500, 1700, 200, 800); //left wall
            spawn.mapRect(675, 1875, 325, 150, 0.5);

            spawn.mapRect(4450, 2900, 4900, 200); //boss room floor
            spawn.mapRect(4150, 2600, 400, 500);
            spawn.mapRect(6250, 2675, 700, 325);
            spawn.mapRect(8000, 2600, 600, 400);
            spawn.bodyRect(5875, 2725, 200, 200);
            spawn.bodyRect(6800, 2490, 50, 50);
            spawn.bodyRect(6800, 2540, 50, 50);
            spawn.bodyRect(6800, 2590, 50, 50);
            spawn.bodyRect(8225, 2225, 100, 100);
            spawn.mapRect(6250, 1875, 700, 150);
            spawn.mapRect(8000, 1875, 600, 150);

            spawn.mapRect(9100, 1700, 900, 500); //exit
            spawn.mapRect(9100, 2600, 900, 500);
            spawn.mapRect(9900, 1700, 200, 1400); //back wall
            // spawn.mapRect(9300, 2150, 50, 250);
            spawn.mapRect(9300, 2590, 650, 25);
            spawn.mapRect(9700, 2580, 100, 50);


            spawn.randomGroup(1300, 2100, 0.1);
            spawn.randomMobPositions = [
                [8300, 2100],
                [2575, -75, true], //entrance
                [8125, 2450],
                [3200, 250, true],
                [2425, 2150],
                [3500, 250, true],
                [3800, 2175],
                [2500, -275, true], //entrance
                [4450, 2500],
                [6350, 2525]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(9200, 2400, 0.3);
            spawn.randomMobPositions = [
                [1900, -250, true], //entrance
                [1500, 2100],
                [1700, -150, true], //entrance
                [8800, 2725],
                [7300, 2200],
                [2075, 2025],
                [3475, 2175],
                [8900, 2825],
                [9600, 2425],
                [3600, 1725],
                [4100, 1225],
                [2825, 400]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomLevelBoss(6000, 2300);
            spawn.secondaryBossChance(7725, 2275)
            //spawn.randomHigherTierMob(2431, 2086)

            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                // rotor(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                // rotor = level.rotor(-5100, 2475, 0.001) //rotates other direction because flipped
                rotor = level.rotor(-5600, 2390, 850, 50, 0.001, 0, 0.01, 0, 0.001) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                balance1 = level.rotor(-300 - 25, -395, 25, 390, 0.001) //entrance
                balance2 = level.rotor(-2605 - 390, 500, 390, 25, 0.001) //falling
                balance3 = level.rotor(-2608 - 584, 1900, 584, 25, 0.001) //falling
                balance4 = level.rotor(-9300 - 25, 2205, 25, 380, 0.001) //exit
                balance5 = level.rotor(-2605 - 390, 1100, 390, 25, 0.001) //falling
                // boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                // boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                // level.setPosToSpawn(300, -700); //-x  // no need since 0
                button1.min.x = -button1.min.x - 126 // flip the button horizontally
                button1.max.x = -button1.max.x + 126 // flip the button horizontally
                drip1.x *= -1
                drip2.x *= -1
                drip3.x *= -1
                level.custom = () => {
                    drip1.draw();
                    drip2.draw();
                    drip3.draw();

                    button1.query();
                    button1.draw();
                    rotor.rotate();

                    ctx.fillStyle = "hsl(175, 15%, 76%)"
                    ctx.fillRect(-9900, 2200, 800, 400)
                    ctx.fillStyle = "rgba(0,0,0,0.03)" //shadows
                    ctx.fillRect(-6950, 2025, 700, 650)
                    ctx.fillRect(-8600, 2025, 600, 575)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                // level.customTopLayer = () => {};
            } else {
                // rotor = level.rotor(5100, 2475, -0.001)
                rotor = level.rotor(4700, 2390, 850, 50, 0.001, 0, 0.01, 0, -0.001) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                balance1 = level.rotor(300, -395, 25, 390, 0.001) //entrance
                balance2 = level.rotor(2605, 500, 390, 25, 0.001) //falling
                balance3 = level.rotor(2608, 1900, 584, 25, 0.001) //falling
                balance4 = level.rotor(9300, 2205, 25, 380, 0.001) //exit
                balance5 = level.rotor(2605, 1100, 390, 25, 0.001) //falling
            }
        },
        flocculation() {
            level.announceText(0, 25, true)
            level.announceMobTypes()
            const button0 = level.button(1125, 795)
            const button1 = level.button(6538, 2670)
            const button2 = level.button(1225, -100)
            button0.isUp = true
            button1.isUp = true
            button2.isUp = true
            // const hazard = level.hazard(4550, 2750, 4550, 150)
            const hazard = level.hazard(simulation.isHorizontalFlipped ? -7200 : 675, 50, 7500, 3000) //1869
            // hazard.min.y = 3000 //REMOVE THIS IN LIVE VERSION!!!!!   set slime to lowest level
            let balance1, balance2, balance3, rotor1, rotor2

            const drip1 = level.drip(6100, 1900, 2900, 100) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
            const drip2 = level.drip(7300, 1900, 2900, 150)
            const drip3 = level.drip(8750, 1900, 2900, 70)

            //up mode triggered by player contact
            const elevator0 = level.elevator(700, 1865, 200, 490, 1400, 0.011, { up: 0.01, down: 0.7 })
            const elevator1 = level.elevator(3995, 2335, 210, 150, 1700, 0.011, { up: 0.01, down: 0.7 })

            level.custom = () => {
                drip1.draw();
                drip2.draw();
                drip3.draw();
                if (button0.isUp) {
                    button0.query();
                    if (!button0.isUp) {  //summon second set of mobs
                        //1 boss, 1-2 groups, 11 mobs (all on lower ground level, where the slime is leaving)
                        spawn.randomMobPositions = [
                            [918, 2695],
                            [1818, 2719],
                            [2530, 2460],
                            [3109, 2665],
                            [3909, 2191],
                            [4705, 2711],
                            [5800, 2796],
                            [7287, 2757],
                            [5759, 2691],
                            [5675, 2225],
                            [7450, 2775]
                        ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                        spawn.randomMobFromArray()
                        spawn.randomGroup(6600, 2400, 0.1);
                        spawn.randomLevelBoss(6076, 2341);
                    }
                }
                button0.draw();
                if (button1.isUp) button1.query();
                button1.draw();
                if (button2.isUp) button2.query();
                button2.draw();
                ctx.fillStyle = "hsl(175, 15%, 76%)"
                ctx.fillRect(7625, 2625, 400, 300)
                ctx.fillStyle = "rgba(0,0,0,0.03)" //shadows
                ctx.fillRect(6250, 1875, 700, 875)
                ctx.fillRect(900, 1200, 600, 1725) //900, 1350, 600, 1600);
                ctx.fillRect(3000, 1200, 1000, 1750);
                ctx.fillRect(2200, 625, 400, 2050);

                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                elevator0.moveOnTouch()
                elevator1.moveOnTouch()
                rotor1.rotate();
                rotor2.rotate();

                ctx.fillStyle = "#233"
                ctx.beginPath();
                ctx.arc(balance1.center.x, balance1.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance2.center.x, balance2.center.y)
                ctx.arc(balance2.center.x, balance2.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance3.center.x, balance3.center.y)
                ctx.arc(balance3.center.x, balance3.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(balance5.center.x, balance5.center.y)
                ctx.arc(balance5.center.x, balance5.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(rotor1.center.x, rotor1.center.y)
                ctx.arc(rotor1.center.x, rotor1.center.y, 9, 0, 2 * Math.PI);
                ctx.moveTo(rotor2.center.x, rotor2.center.y)
                ctx.arc(rotor2.center.x, rotor2.center.y, 9, 0, 2 * Math.PI);
                ctx.fill();
                hazard.query();
                const drainRate = Math.max(1, 4 - hazard.min.y / 800)
                hazard.level(
                    (button2.isUp || hazard.height < 1150) &&
                    (button0.isUp || hazard.height < 350) &&
                    button1.isUp
                    , drainRate) //true = hold,  false = lower
                exitDoor.isClosing = hazard.min.y < 2900
                exitDoor.openClose();
                exitDoor.draw();
            };

            level.setPosToSpawn(0, -50); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = 7800;
            level.exit.y = 2865;
            const exitDoor = level.door(7637, 2680, 25, 225, 195, 5)

            level.defaultZoom = 1800
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "hsl(138, 3%, 74%)";
            color.map = "#3d4240"
            powerUps.spawnStartingPowerUps(3475, 1775);
            spawn.debris(4575, 2550, 1600, 6); //16 debris per level
            spawn.debris(750, 2550, 2250, 6); //16 debris per level

            spawn.mapRect(-500, -600, 200, 800); //left entrance wall
            spawn.mapRect(-400, -600, 3550, 200); //ceiling
            spawn.mapRect(-400, 0, 1400, 600);

            spawn.mapRect(575, 475, 250, 250);
            Matter.Body.setAngle(map[map.length - 1], map[map.length - 1].angle - Math.PI / 4);
            spawn.mapRect(4075, 75, 250, 250);
            Matter.Body.setAngle(map[map.length - 1], map[map.length - 1].angle - Math.PI / 4);
            spawn.mapRect(4259, 1559, 282.5, 282.5);
            Matter.Body.setAngle(map[map.length - 1], map[map.length - 1].angle - Math.PI / 4);

            spawn.mapRect(3140, -600, 200, 800); //right down tube wall
            spawn.mapRect(3150, 0, 1200, 200); //tube right exit ceiling
            spawn.mapVertex(2400, 500, "-200 -100  -100 -200   100 -200 200 -100   200 200   -200 200");
            spawn.mapVertex(2400, 1200, "-200  -200  200 -200    200 100 100 200  -100 200 -200 100");
            spawn.mapVertex(1200, 2150, "-300 -300   300 -300   300 200 200 300  -200 300 -300 200");
            spawn.mapVertex(1200, 1100, "-300 -200  -200 -300   200 -300 300 -200   300 300  -300 300");
            spawn.mapVertex(3500, 950, "-500 -450  -400 -550   400 -550 500 -450   500 450 400 550  -400 550 -500 450");
            spawn.mapVertex(3500, 1990, "-300 -40  -230 -110   230 -110 300 -40   300 40 230 110  -230 110 -300 40");
            // spawn.mapVertex(2400, 1940, "-200 -40  -150 -90   150 -90 200 -40   200 40 150 90  -150 90 -200 40");
            spawn.mapRect(2200, 1850, 400, 200);
            spawn.bodyRect(3825, 2240, 150, 75, 0.5);

            spawn.mapVertex(3500, 2452, "-500 -135    500 -135    500 35 400 135  -400 135 -500 35");
            spawn.mapVertex(1200, 2850, "-500 -100     500 -100 550 -50   550 300   -500 300");
            // spawn.mapVertex(1200, 2875, "-400 0  -300 -100   300 -100   400 0");

            spawn.mapVertex(1317, 275, "-500 0  -300 -200     300 -200 550 50     550  500    -500 500");
            spawn.mapVertex(1300, -357, "-300 0  -400 -100     400 -100 300 0");
            spawn.bodyRect(1550, -308, 50, 208, 0.5);
            spawn.bodyRect(2000, 965, 525, 25, 0.5);
            spawn.mapVertex(2400, 2850, "-350 -50  -300 -100     300 -100 350 -50   350 300   -350 300");
            spawn.mapVertex(6600, 1925, "-350 0  -450 -100     450 -100 350 0");
            spawn.mapVertex(6600, 2875, "-400 -50  -350 -100     350 -100 400 -50   400 300   -400 300");

            spawn.bodyRect(2375, 300, 100, 100, 0.6);
            spawn.bodyRect(1025, 1775, 100, 75, 0.6);
            spawn.bodyRect(1250, 1825, 50, 25, 0.6);
            spawn.bodyRect(3700, 275, 125, 125, 0.6);
            spawn.bodyRect(5875, 2725, 200, 200, 0.6);
            spawn.bodyRect(6900, 2590, 50, 50, 0.6);
            spawn.mapRect(4200, 2325, 250, 625);
            spawn.mapRect(-500, 50, 1200, 3050);
            spawn.mapRect(-500, 2900, 9600, 775);

            spawn.mapRect(4400, 0, 4700, 1900);
            spawn.mapRect(4200, 0, 200, 1700);
            // spawn.mapRect(6250, 2675, 700, 325);
            // spawn.mapRect(6250, 1875, 700, 150);

            //exit room
            spawn.mapRect(8000, 1775, 1100, 1375);
            spawn.mapRect(7625, 1825, 450, 825);
            spawn.mapRect(7625, 2625, 50, 75);
            spawn.mapRect(7625, 2890, 400, 25);
            spawn.mapRect(7800, 2880, 100, 25);

            spawn.randomMobPositions = [
                [2450, 250],
                [3250, 325],
                [3625, 350],
                [1750, -25],
                [1300, 1750],
                [2350, 1725],
                [3350, 1775],
                [1025, 750],
                [2400, 1775],
                [1250, 1725],
                [775, 1775]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.secondaryBossChance(1822, 1336)
            //spawn.randomHigherTierMob(6577, 2511)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                rotor1 = level.rotor(-5600, 2390, 850, 50, 0.001, 0, 0.01, 0, 0.001) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                rotor2 = level.rotor(-2175, 1900, 650, 50, 0.001, 0, 0.01, 0, 0.0007)

                balance1 = level.rotor(-800 - 25, -395, 25, 390, 0.001) //entrance
                balance2 = level.rotor(-2605 - 390, 500, 390, 25, 0.001) //falling
                balance3 = level.rotor(-2608 - 400, 1950, 400, 25, 0.001) //falling
                balance5 = level.rotor(-2605 - 390, 1020, 390, 25, 0.001) //falling

                button1.min.x = -button1.min.x - 126
                button1.max.x = -button1.max.x + 126
                button0.min.x = -button0.min.x - 126
                button0.max.x = -button0.max.x + 126
                button2.min.x = -button2.min.x - 126
                button2.max.x = -button2.max.x + 126 // flip the button horizontally
                drip1.x *= -1
                drip2.x *= -1
                drip3.x *= -1
                elevator0.holdX *= -1
                elevator1.holdX *= -1
                // console.log(hazard)
                hazard.min.x -= 840
                hazard.max.x -= 840

                level.custom = () => {
                    drip1.draw();
                    drip2.draw();
                    drip3.draw();

                    if (button0.isUp) {
                        button0.query();
                        if (!button0.isUp) {  //summon second set of mobs
                            //1 boss, 1-2 groups, 11 mobs (all on lower ground level, where the slime is leaving)
                            spawn.randomMobPositions = [
                                [-7475, 2800],
                                [-6475, 2500],
                                [-4575, 2775],
                                [-7575, 2850],
                                [-6425, 2575],
                                [-5750, 2775],
                                [-4675, 2800],
                                [-3425, 2800],
                                [-2475, 2475],
                                [-3350, 2250],
                                [-1275, 2725]
                            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
                            spawn.randomMobFromArray()
                            spawn.randomGroup(-6225, 2400, 0.1);
                            spawn.randomLevelBoss(-6250, 2350);
                        }
                    }
                    button0.draw();
                    if (button1.isUp) button1.query();
                    button1.draw();
                    if (button2.isUp) button2.query();
                    button2.draw();
                    rotor1.rotate();
                    rotor2.rotate();
                    ctx.fillStyle = "hsl(175, 15%, 76%)"
                    ctx.fillRect(-8025, 2625, 400, 300)
                    ctx.fillStyle = "rgba(0,0,0,0.03)" //shadows
                    ctx.fillRect(-6950, 1875, 700, 875)
                    ctx.fillRect(-4000, 1400, 1000, 1550);
                    ctx.fillRect(-2600, 675, 400, 2025);
                    ctx.fillRect(-1500, 1375, 600, 1500);

                    level.exit.drawAndCheck();
                    level.enter.draw();
                };
                // level.customTopLayer = () => {};
            } else {
                rotor1 = level.rotor(4700, 2390, 850, 50, 0.001, 0, 0.01, 0, -0.001) //balance(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
                rotor2 = level.rotor(1525, 1900, 650, 50, 0.001, 0, 0.01, 0, -0.0007)
                balance1 = level.rotor(800, -395, 25, 390, 0.001) //entrance
                balance2 = level.rotor(2605, 500, 390, 25, 0.001) //falling
                balance3 = level.rotor(2608, 1950, 400, 25, 0.001) //falling
                balance5 = level.rotor(2605, 1020, 390, 25, 0.001) //falling
            }

        },
        satellite() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(100, 275, true)
            } else {
                level.announceText(-100, 275, true)
            }
            level.announceMobTypes()
            level.fallMode = "start";
            const boost1 = level.boost(5825, 235, 1400)
            const elevator = level.elevator(4210, -1265, 380, 50, -3450) //, 0.003, { up: 0.01, down: 0.2 }
            level.custom = () => {
                boost1.query();

                ctx.fillStyle = "#d4f4f4"
                ctx.fillRect(-250, -750, 420, 450)
                ctx.fillStyle = "#d0d4d6"
                ctx.fillRect(-300, -1900, 500, 1100)
                ctx.fillRect(900, -2450, 450, 2050)
                ctx.fillRect(2000, -2800, 450, 2500)
                ctx.fillRect(3125, -3100, 450, 3300)
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,20,40,0.25)"
                ctx.fillRect(-250, -400, 1800, 775)
                ctx.fillRect(1800, -275, 850, 775)
                ctx.fillRect(5200, 125, 450, 200)
                ctx.fillStyle = "rgba(0,20,40,0.1)"
                ctx.fillRect(4000, -1200, 1050, 1500)
                ctx.fillRect(4100, -3450, 600, 2250)
                elevator.move()
            };

            level.setPosToSpawn(-100, 210); //normal spawn
            spawn.mapRect(-150, 240, 100, 30);
            level.exit.x = -100;
            level.exit.y = -425;
            spawn.mapRect(level.exit.x, level.exit.y + 15, 100, 50); //exit bump

            level.defaultZoom = 1700 // 4500 // 1400
            simulation.zoomTransition(level.defaultZoom)

            powerUps.spawnStartingPowerUps(4900, -500); //1 per level
            spawn.debris(1000, 20, 1800, 6); //16 debris per level
            // spawn.debris(4830, -1330, 850, 3); //16 debris per level
            // spawn.debris(3035, -3900, 1500, 3); //16 debris per level

            document.body.style.backgroundColor = "#dbdcde";

            //spawn start building

            spawn.mapRect(-575, -850, 325, 1400); //extended wall to fit text
            // spawn.mapRect(-350, -800, 100, 1100);
            // spawn.mapRect(-300, -10, 500, 50);
            spawn.mapRect(150, -510, 50, 365);
            spawn.bodyRect(170, -140, 20, 163, 1, spawn.propsFriction); //door to starting room
            spawn.mapVertex(175, 200, "625 0   300 0   425 -300   500 -300"); //entrance ramp
            // spawn.mapRect(-300, 0, 1000, 300); //ground
            spawn.mapRect(-350, 250, 6350, 300); //deeper ground
            spawn.bodyRect(2100, 50, 80, 80);
            spawn.bodyRect(2000, 50, 60, 60);
            // spawn.bodyRect(1650, 50, 300, 200);
            // spawn.mapRect(1800, Math.floor(Math.random() * 200), 850, 300); //stops above body from moving to right
            spawn.mapVertex(2225, 250, "575 0  -575 0  -450 -100  450 -100"); //base

            //exit building
            // spawn.mapRect(-100, -410, 100, 30);
            spawn.mapRect(-350, -850, 550, 100);
            spawn.mapRect(150, -800, 50, 110);
            spawn.bodyRect(170, -690, 14, 180, 1, spawn.propsFriction); //door to exit room
            spawn.mapRect(-300, -400, 500, 150); //far left starting ceiling

            //tall platform above exit
            spawn.mapRect(-500, -1900, 400, 50); //super high shade
            spawn.mapRect(0, -1900, 400, 50); //super high shade
            spawn.mapRect(-150, -1350, 200, 25); //super high shade
            spawn.bodyRect(140, -2100, 150, 200); //shield from laser

            //tall platform
            spawn.mapVertex(1125, -450, "325 0  250 80  -250 80  -325 0  -250 -80  250 -80"); //base
            spawn.mapRect(150, -500, 1410, 100); //far left starting ceiling
            spawn.mapRect(625, -2450, 1000, 50); //super high shade
            spawn.bodyRect(1300, -3600, 150, 150); //shield from laser
            //tall platform
            spawn.mapVertex(2225, -250, "325 0  250 80  -250 80  -325 0  -250 -80  250 -80"); //base
            spawn.mapRect(1725, -2800, 1000, 50); //super high shade
            spawn.mapRect(1790, -300, 870, 100); //far left starting ceiling
            spawn.bodyRect(2400, -2950, 150, 150); //shield from laser

            //tall platform
            spawn.mapVertex(3350, 175, "425 0  -425 0  -275 -300  275 -300"); //base
            spawn.bodyRect(3350, -150, 200, 120);
            spawn.mapRect(2850, -3150, 1000, 50); //super high shade
            spawn.bodyRect(3675, -3470, 525, 20); //plank
            spawn.bodyRect(3600, -3450, 200, 300); //plank support block

            //far right structure
            spawn.mapRect(5200, -725, 200, 870);
            spawn.mapRect(5300, -1075, 350, 1220);

            //structure bellow tall stairs
            spawn.mapRect(3900, -300, 450, 50);
            spawn.mapRect(4675, -375, 450, 50);

            // spawn.mapRect(4000, -1300, 1050, 100);
            spawn.mapRect(4000, -1300, 200, 100);
            spawn.mapRect(4600, -1300, 450, 100);

            //steep stairs
            spawn.mapRect(4100, -2250, 100, 650);
            spawn.mapRect(4100, -3450, 100, 850); //left top shelf
            spawn.mapRect(4600, -3450, 100, 1850);

            //steps up and down
            spawn.mapVertex(4525, 250, "-650 0  -625 -20  625 -20  650 0");
            spawn.mapVertex(4525, 237, "-550 0  -525 -20  525 -20  550 0");
            // spawn.mapVertex(4525, 225, "-400 0  -375 -20  375 -20  400 0");

            spawn.randomMobPositions = [
                [4400, -3500, true],
                [4800, -800, true],
                [800, -2600],
                [700, -600],
                [3100, -3600],
                [3300, -1000],
                [4200, -250],
                [4900, -1500],
                [3800, 175],
                [5750, 125],
                [5900, -1500],
                [4700, -800],
                [1400, 200],
                [2850, 175],
                [2000, -2800],
                [2400, -400],
                [4475, -3550]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(5000, -2150, 1);
            spawn.randomGroup(3700, -4100, 0.3);
            spawn.randomGroup(2700, -1600, 0.1);
            spawn.randomGroup(1600, -100, 0);
            spawn.randomGroup(5000, -3900, -0.3);


            if (simulation.difficultyMode > 1 || level.levelsCleared > 1) {
                if (Math.random() < 0.25) {
                    spawn.randomLevelBoss(2800, -1400);
                } else if (Math.random() < 0.25) {
                    spawn.laserBoss(2900 + 300 * Math.random(), -2950 + 150 * Math.random());
                } else if (Math.random() < 0.33) {
                    spawn.laserBoss(1800 + 250 * Math.random(), -2600 + 150 * Math.random());
                } else if (Math.random() < 0.5) {
                    spawn.laserBoss(3500 + 250 * Math.random(), -2600 + 1000 * Math.random());
                } else {
                    spawn.laserBoss(600 + 200 * Math.random(), -2150 + 250 * Math.random());
                }
            } else {
                powerUps.spawnBossPowerUp(2800, -1400)
            }

            spawn.secondaryBossChance(3950, -850)
            //spawn.randomHigherTierMob(5038, 100)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                level.setPosToSpawn(100, 210); //-x
                elevator.holdX = -elevator.holdX // flip the elevator horizontally
                level.custom = () => {
                    boost1.query();
                    ctx.fillStyle = "#d4f4f4"
                    ctx.fillRect(250 - 420, -750, 420, 450)
                    ctx.fillStyle = "#d0d4d6"
                    ctx.fillRect(300 - 500, -1900, 500, 1100)
                    ctx.fillRect(-900 - 450, -2450, 450, 2050)
                    ctx.fillRect(-2000 - 450, -2800, 450, 2500)
                    ctx.fillRect(-3125 - 450, -3100, 450, 3300)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    elevator.move()
                    ctx.fillStyle = "rgba(0,20,40,0.25)"
                    ctx.fillRect(250 - 1800, -400, 1800, 775)
                    ctx.fillRect(-1800 - 850, -275, 850, 775)
                    ctx.fillRect(-5200 - 450, 125, 450, 200)
                    ctx.fillStyle = "rgba(0,20,40,0.1)"
                    ctx.fillRect(-4000 - 1050, -1200, 1050, 1500)
                    ctx.fillRect(-4100 - 600, -3450, 600, 2250)
                };
            }
        },
        rooftops() {
            level.announceMobTypes()
            // level.fallPosition = { x: 5000, y:-4000}
            const elevator = level.elevator(1450, -990, 235, 45, -2000)
            const boost1 = level.boost(4950, 0, 1100)

            level.custom = () => {
                boost1.query();
                elevator.move();
                elevator.drawTrack();
                ctx.fillStyle = "#d4f4f4"
                if (isBackwards) {
                    ctx.fillRect(-650, -2300, 440, 300)
                } else {
                    ctx.fillRect(3460, -700, 1090, 800)
                }
                level.exit.drawAndCheck();
                level.enter.draw();
            };

            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(710, -2225, 580, 225)
                ctx.fillRect(3510, -1550, 330, 300)
                ctx.fillRect(1735, -900, 1515, 1900)
                ctx.fillRect(1735, -1550, 1405, 550)
                ctx.fillRect(1860, -1950, 630, 350)
                ctx.fillRect(-700, -1950, 2100, 2950)
                ctx.fillRect(3400, 100, 2150, 900)
                ctx.fillRect(4550, -725, 900, 725)
                ctx.fillRect(3460, -1250, 1080, 550)
                if (isBackwards) {
                    ctx.fillRect(3460, -700, 1090, 800)
                } else {
                    ctx.fillRect(-650, -2300, 440, 300)
                }
            };

            level.defaultZoom = 1700
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#dcdcde";

            // level.fallMode = "start";
            let isBackwards = false
            if (Math.random() < 0.75) {
                if (simulation.isHorizontalFlipped) {
                    level.announceText(450, -1975, true)
                } else {
                    level.announceText(-450, -1975, true)
                }
                //normal direction start in top left
                level.setPosToSpawn(-450, -2060);
                level.exit.x = 4225;
                level.exit.y = -30;
                spawn.mapRect(4225, -10, 100, 50); //ground bump wall
                //mobs that spawn in exit room
                spawn.bodyRect(4850, -750, 300, 25, 0.6); //
            } else {
                if (simulation.isHorizontalFlipped) {
                    level.announceText(-4225, 30, true)
                } else {
                    level.announceText(4225, 30, true)
                }
                isBackwards = true
                //reverse direction, start in bottom right
                level.setPosToSpawn(4225, -50);
                level.exit.x = -550;
                level.exit.y = -2030;
                spawn.mapRect(-550, -2015, 100, 50); //ground bump wall
            }
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

            spawn.debris(1650, -1800, 3800, 16); //16 debris per level
            powerUps.spawnStartingPowerUps(2450, -1675);

            //spawn.mapRect(-700, 0, 6250, 100); //ground
            spawn.mapRect(3400, 0, 2150, 100); //ground
            // spawn.mapRect(-700, -2000, 2125, 100); 
            spawn.mapRect(-850, -2000, 2275, 100);//Top left ledge
            spawn.bodyRect(1300, -2125, 50, 125, 0.8);
            spawn.bodyRect(1307, -2225, 50, 100, 0.8);
            spawn.mapRect(-700, -2350, 50, 400); //far left starting left wall
            spawn.mapRect(-700, -2010, 500, 50); //far left starting ground
            spawn.mapRect(-700, -2350, 500, 50); //far left starting ceiling
            spawn.mapRect(-250, -2350, 50, 200); //far left starting right part of wall
            spawn.bodyRect(-240, -2150, 30, 36); //door to starting room
            spawn.bodyRect(-240, -2115, 30, 36); //door to starting room
            spawn.bodyRect(-240, -2080, 30, 35); //door to starting room
            spawn.bodyRect(-240, -2045, 30, 35); //door to starting room
            spawn.mapRect(1850, -2000, 650, 50);
            spawn.bodyRect(200, -2150, 80, 220, 0.8);
            spawn.mapRect(700, -2275, 600, 50);
            spawn.mapRect(1000, -1350, 410, 50);
            spawn.bodyRect(1050, -2350, 30, 30, 0.8);
            // spawn.bodyRect(1625, -1100, 100, 75);
            // spawn.bodyRect(1350, -1025, 400, 25); // ground plank
            spawn.mapRect(-725, -1000, 2150, 100); //lower left ledge
            spawn.bodyRect(350, -1100, 200, 100, 0.8);
            spawn.bodyRect(370, -1200, 100, 100, 0.8);
            spawn.bodyRect(360, -1300, 100, 100, 0.8);
            spawn.bodyRect(950, -1050, 300, 50, 0.8);
            spawn.bodyRect(-575, -1150, 125, 150, 0.8);
            spawn.mapRect(1710, -1000, 1565, 100); //middle ledge
            spawn.mapRect(3400, -1000, 75, 25);
            spawn.bodyRect(2600, -1950, 100, 250, 0.8);
            spawn.bodyRect(2700, -1125, 125, 125, 0.8);
            spawn.bodyRect(2710, -1250, 125, 125, 0.8);
            spawn.bodyRect(2705, -1350, 75, 100, 0.8);
            spawn.mapRect(3500, -1600, 350, 50);
            spawn.mapRect(1725, -1600, 1435, 50);
            spawn.bodyRect(3100, -1015, 375, 15);
            spawn.bodyRect(3500, -850, 75, 125, 0.8);
            spawn.mapRect(3450, -1000, 50, 580); //left building wall
            spawn.bodyRect(3460, -420, 30, 144);
            spawn.mapRect(5450, -775, 100, 875); //right building wall
            spawn.bodyRect(3925, -1400, 100, 150, 0.8);
            spawn.mapRect(3450, -1250, 1090, 50);
            // spawn.mapRect(3450, -1225, 50, 75);
            spawn.mapRect(4500, -1250, 50, 415);
            spawn.mapRect(3450, -725, 1500, 50);
            spawn.mapRect(5100, -725, 400, 50);
            spawn.mapRect(4500, -735, 50, 635);
            spawn.bodyRect(4500, -100, 50, 100);
            spawn.mapRect(4500, -885, 100, 50);
            spawn.spawnStairs(3800, 0, 3, 150, 206); //stairs top exit
            spawn.mapRect(3400, -275, 450, 275); //exit platform

            spawn.randomMobPositions = [
                ...(isBackwards ? [] : [[4100, -100, true], [4600, -100, true], [3765, -450]]),
                [2200, -1775, true],
                [4000, -825, true],
                [-350, -3400, true],
                [4250, -1350],
                [2550, -1350],
                [1875, -1075],
                [1120, -1200],
                [3000, -1150],
                [3200, -1150],
                [3300, -1750],
                [3650, -1350],
                [3600, -1800],
                [5200, -100],
                [5275, -900],
                [0, -1075]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            spawn.randomGroup(600, -1575, 0);
            spawn.randomGroup(2225, -1325, 0.4);
            spawn.randomGroup(4900, -1200, 0);
            spawn.randomLevelBoss(3200, -1900);
            spawn.secondaryBossChance(2175, -2425)
            //spawn.randomHigherTierMob(4425, -1400);

            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

                boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                elevator.holdX = -elevator.holdX // flip the elevator horizontally

                if (isBackwards) {
                    level.setPosToSpawn(-4225, -50); //-x
                } else {
                    level.setPosToSpawn(450, -2060); //-x
                }
                level.custom = () => {
                    boost1.query();
                    elevator.move();
                    elevator.drawTrack();

                    ctx.fillStyle = "#d4f4f4"
                    if (isBackwards) {
                        ctx.fillRect(650 - 440, -2300, 440, 300)
                    } else {
                        ctx.fillRect(-3460 - 1090, -700, 1090, 800)
                    }
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.1)"
                    ctx.fillRect(-710 - 580, -2225, 580, 225)
                    ctx.fillRect(-3510 - 330, -1550, 330, 300)
                    ctx.fillRect(-1735 - 1515, -900, 1515, 1900)
                    ctx.fillRect(-1735 - 1405, -1550, 1405, 550)
                    ctx.fillRect(-1860 - 630, -1950, 630, 350)
                    ctx.fillRect(700 - 2100, -1950, 2100, 2950)
                    ctx.fillRect(-3400 - 2150, 100, 2150, 900)
                    ctx.fillRect(-4550 - 900, -725, 900, 725)
                    ctx.fillRect(-3460 - 1080, -1250, 1080, 550)
                    if (isBackwards) {
                        ctx.fillRect(-3460 - 1090, -700, 1090, 800)
                    } else {
                        ctx.fillRect(650 - 440, -2300, 440, 300)
                    }
                };
            }
            level.fallMode = "position"; //must set level.fallModeBounds in this mode to prevent player getting stuck left or right
            if (level.enter.x > level.exit.x) {
                level.fallModeBounds = { left: level.exit.x, right: level.enter.x } //used with level.fallMode = "position";
            } else {
                level.fallModeBounds = { left: level.enter.x, right: level.exit.x } //used with level.fallMode = "position";
            }
        },
        aerie() {
            level.announceMobTypes()
            level.fallMode = "start";
            const boost1 = level.boost(-425, 100, 1400)
            const boost2 = level.boost(5350, 275, 2850);

            level.custom = () => {
                boost1.query();
                boost2.query();
                if (backwards) {
                    ctx.fillStyle = "#d4f4f4"
                    ctx.fillRect(-275, -1275, 425, 300)
                } else {
                    ctx.fillStyle = "#d4f4f4"
                    ctx.fillRect(4025, -3675, 575, 450)
                }
                ctx.fillStyle = "#c7c7ca"
                ctx.fillRect(4200, -2200, 100, 2600)
                // ctx.fillStyle = "#c7c7ca"
                ctx.fillRect(-100, -1000, 1450, 1400)
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                if (backwards) {
                    ctx.fillStyle = "rgba(0,0,0,0.1)"
                    // ctx.fillRect(3750, -3650, 550, 400)
                    ctx.fillRect(4025, -3675, 575, 450);
                } else {
                    ctx.fillStyle = "rgba(0,0,0,0.1)"
                    ctx.fillRect(-275, -1275, 425, 300)
                }
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(3700, -3150, 1100, 950)
                ctx.fillRect(2000, -1110, 450, 1550)

                ctx.fillStyle = "rgba(0,0,0,0.04)"
                ctx.beginPath()
                ctx.moveTo(-100, -900)
                ctx.lineTo(300, -900)
                ctx.lineTo(150, 100)
                ctx.lineTo(-100, 100)

                ctx.moveTo(600, -900)
                ctx.lineTo(1350, -900)
                ctx.lineTo(1350, 100)
                ctx.lineTo(750, 100)
                ctx.fill()
            };

            level.defaultZoom = 2100
            simulation.zoomTransition(level.defaultZoom)

            const backwards = Math.random() < 0.25 ? true : false;
            if (backwards) {
                level.setPosToSpawn(4300, -3300); //normal spawn
                level.exit.x = -100;
                level.exit.y = -1025;
                if (simulation.isHorizontalFlipped) {
                    level.announceText(-4300, -3223, true)
                } else {
                    level.announceText(4300, -3225, true)
                }
            } else {
                level.setPosToSpawn(-50, -1050); //normal spawn
                level.exit.x = 4250;
                level.exit.y = -3275;
                if (simulation.isHorizontalFlipped) {
                    level.announceText(-975, -975, true)
                } else {
                    level.announceText(975, -975, true)
                }
            }

            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            spawn.mapRect(level.exit.x, level.exit.y + 15, 100, 20);

            powerUps.spawnStartingPowerUps(1075, -550);
            document.body.style.backgroundColor = "#dcdcde";

            // starting room
            spawn.mapRect(-300, -1000, 600, 100);
            spawn.mapRect(-300, -1300, 450, 50);
            spawn.mapRect(-300, -1300, 50, 350);
            if (!backwards) spawn.bodyRect(100, -1250, 200, 240); //remove on backwards
            //left building
            spawn.mapRect(-100, -975, 100, 975);
            spawn.mapRect(-500, 100, 1950, 400);
            spawn.mapRect(600, -1000, 750, 100);
            spawn.mapRect(900, -500, 550, 100);
            spawn.mapRect(1250, -975, 100, 375);
            spawn.bodyRect(1250, -600, 100, 100, 0.7);
            spawn.mapRect(1250, -450, 100, 450);
            spawn.bodyRect(1250, -1225, 100, 200, 0.7); //remove on backwards
            spawn.bodyRect(1200, -1025, 350, 35); //remove on backwards
            //middle super tower
            if (backwards) {
                spawn.bodyRect(2000, -800, 700, 35);
            } else {
                spawn.bodyRect(1750, -800, 700, 35);
            }
            spawn.mapVertex(2225, -2100, "0 0 450 0 300 -2500 150 -2500")
            spawn.mapRect(2000, -700, 450, 300);
            spawn.bodyRect(2360, -450, 100, 300, 0.6);
            spawn.mapRect(2000, -75, 450, 275);
            spawn.bodyRect(2450, 150, 150, 150, 0.4);
            spawn.mapRect(1550, 300, 4600, 200); //ground
            // spawn.mapRect(6050, -700, 450, 1200);
            spawn.mapRect(6050, -1060, 450, 1560);
            spawn.mapVertex(6275, -2100, "0 0 450 0 300 -2500 150 -2500")

            //right tall tower
            spawn.mapRect(3700, -3200, 100, 800);
            spawn.mapRect(4700, -2910, 100, 510);
            spawn.mapRect(3700, -2600, 300, 50);
            spawn.mapRect(4100, -2900, 900, 50);
            spawn.mapRect(3450, -2300, 750, 100);
            spawn.mapRect(4300, -2300, 750, 100);
            spawn.mapRect(4150, -1600, 200, 25);
            spawn.mapRect(4150, -700, 200, 25);
            //exit room on top of tower
            spawn.mapRect(4000, -3700, 600, 50);
            spawn.mapRect(4000, -3700, 50, 500);
            spawn.mapRect(4550, -3700, 50, 300);
            spawn.mapRect(3700, -3250, 1100, 100);

            spawn.randomGroup(350, -500, 1)
            spawn.randomMobPositions = [
                [-225, 25, true],
                [2100, -900, true],
                [4000, -250, true],
                [4450, -3000, true],
                [5600, 100, true],
                [4275, -2600],
                [1050, -700],
                [6050, -850],
                [2150, -300],
                [3900, -2700],
                [3600, -500],
                [3400, -200],
                // [1650, -1300],
                [425, 0],
                [4100, -50],
                [4100, -50],
                [1700, -50],
                [2350, -900],
                [4700, -150]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(4000, -350, 0.6);
            spawn.randomGroup(2750, -550, 0.1);
            spawn.randomMobPositions = [
                [2175, -925],
                [2750, 100],
                [4250, -1725],
                [3575, -2425],
                [3975, -3900],
                [1725, 125]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()


            if (simulation.difficultyMode > 1 || level.levelsCleared > 1) {
                if (Math.random() < 0.5) {
                    spawn.randomLevelBoss(4250, -250);
                    spawn.debris(-250, 50, 1650, 2); //16 debris per level
                    spawn.debris(2475, 0, 750, 2); //16 debris per level
                    spawn.debris(3450, 0, 2000, 16); //16 debris per level
                    spawn.debris(3500, -2350, 1500, 2); //16 debris per level
                } else {
                    powerUps.chooseRandomPowerUp(4000, 200);
                    powerUps.chooseRandomPowerUp(4000, 200);
                    //floor below right tall tower
                    spawn.bodyRect(3000, 50, 150, 250, 0.9);
                    spawn.bodyRect(4500, -500, 300, 250, 0.7);
                    spawn.bodyRect(3500, -100, 100, 150, 0.7);
                    spawn.bodyRect(4200, -500, 110, 30, 0.7);
                    spawn.bodyRect(3800, -500, 150, 130, 0.7);
                    spawn.bodyRect(4000, 50, 200, 150, 0.9);
                    spawn.bodyRect(4500, 50, 300, 200, 0.9);
                    spawn.bodyRect(4200, -350, 200, 50, 0.9);
                    spawn.bodyRect(4700, -350, 50, 200, 0.9);
                    spawn.bodyRect(4900, -100, 300, 300, 0.7);
                    spawn.suckerBoss(4500, -400);
                }
            } else {
                powerUps.spawnBossPowerUp(2800, -1400)
            }

            spawn.secondaryBossChance(5350, -325)
            //spawn.randomHigherTierMob(4437, -2466)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

                boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                boost2.boostBounds.min.x = -boost2.boostBounds.min.x - 100
                boost2.boostBounds.max.x = -boost2.boostBounds.max.x + 100


                if (backwards) {
                    level.setPosToSpawn(-4300, -3300); //-x
                } else {
                    level.setPosToSpawn(50, -1050); //-x
                }
                level.custom = () => {
                    boost1.query();
                    boost2.query();
                    if (backwards) {
                        ctx.fillStyle = "#d4f4f4"
                        ctx.fillRect(275 - 425, -1275, 425, 300)
                    } else {
                        ctx.fillStyle = "#d4f4f4"
                        ctx.fillRect(-4050 - 550, -3650, 550, 400)
                    }
                    ctx.fillStyle = "#c7c7ca"
                    ctx.fillRect(-4200 - 100, -2200, 100, 2600)
                    // ctx.fillStyle = "#c7c7ca"
                    ctx.fillRect(100 - 1450, -1000, 1450, 1400)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    if (backwards) {
                        ctx.fillStyle = "rgba(0,0,0,0.1)"
                        ctx.fillRect(-4050 - 550, -3650, 550, 400)
                    } else {
                        ctx.fillStyle = "rgba(0,0,0,0.1)"
                        ctx.fillRect(275 - 425, -1275, 425, 300)
                    }
                    ctx.fillStyle = "rgba(0,0,0,0.1)"
                    ctx.fillRect(-3700 - 1100, -3150, 1100, 950)
                    ctx.fillRect(-2000 - 450, -1110, 450, 1550)
                    ctx.fillStyle = "rgba(0,0,0,0.04)"
                    ctx.beginPath()
                    ctx.moveTo(100, -900)
                    ctx.lineTo(-300, -900)
                    ctx.lineTo(-150, 100)
                    ctx.lineTo(100, 100)
                    ctx.moveTo(-600, -900)
                    ctx.lineTo(-1350, -900)
                    ctx.lineTo(-1350, 100)
                    ctx.lineTo(-750, 100)
                    ctx.fill()
                };
            }
        },
        skyscrapers() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(50, 20, true)
            } else {
                level.announceText(-50, 20, true)
            }

            level.announceMobTypes()
            level.fallMode = "start";
            const boost1 = level.boost(475, 0, 1300)
            const boost2 = level.boost(4450, 0, 1300);
            level.custom = () => {
                boost1.query();
                boost2.query();
                ctx.fillStyle = "#d4f4f4"
                ctx.fillRect(1350, -2100, 400, 250)
                ctx.fillStyle = "#d4d4d7"
                ctx.fillRect(3350, -1300, 50, 1325)
                ctx.fillRect(1300, -1800, 750, 1800)
                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(2500, -1100, 450, 250)
                ctx.fillRect(2400, -550, 600, 150)
                ctx.fillRect(2550, -1650, 250, 200)
                ctx.fillStyle = "rgba(0,0,0,0.2)"
                ctx.fillRect(700, -110, 400, 110)
                ctx.fillRect(3800, -110, 400, 110)
                ctx.fillStyle = "rgba(0,0,0,0.15)"
                ctx.fillRect(-250, -300, 450, 300)
            };
            level.setPosToSpawn(-50, -60); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = 1500;
            level.exit.y = -1875;
            level.defaultZoom = 2000
            simulation.zoomTransition(level.defaultZoom)
            powerUps.spawnStartingPowerUps(1475, -1175);
            spawn.debris(750, -2200, 3700, 16); //16 debris per level
            document.body.style.backgroundColor = "#dcdcde";

            spawn.mapRect(-600, 0, 5400, 300); //***********ground
            spawn.mapRect(-300, -350, 50, 400); //far left starting left wall
            spawn.mapRect(-300, -10, 500, 50); //far left starting ground
            spawn.mapRect(-300, -350, 500, 50); //far left starting ceiling
            spawn.mapRect(150, -350, 50, 200); //far left starting right part of wall
            spawn.bodyRect(170, -130, 14, 140, 1, spawn.propsFriction); //door to starting room
            spawn.mapRect(700, -1100, 400, 990); //far left building
            spawn.mapRect(1600, -400, 1500, 500); //long center building
            spawn.mapRect(1345, -1100, 250, 25); //left platform
            spawn.mapRect(1755, -1100, 250, 25); //right platform
            spawn.mapRect(1300, -1850, 800, 50); //left higher platform
            spawn.mapRect(1300, -2150, 50, 350); //left higher platform left edge wall
            spawn.mapRect(1300, -2150, 450, 50); //left higher platform roof
            spawn.mapRect(1500, -1860, 100, 50); //ground bump wall
            spawn.mapRect(2400, -850, 600, 300); //center floating large square
            //spawn.bodyRect(2500, -1100, 25, 250); //wall before chasers
            spawn.mapRect(2500, -1450, 450, 350); //higher center floating large square
            spawn.mapRect(2500, -1675, 50, 300); //left wall on higher center floating large square
            spawn.mapRect(2500, -1700, 300, 50); //roof on higher center floating large square
            spawn.mapRect(3275, -750, 200, 25); //ledge by far right building
            spawn.mapRect(3275, -1300, 200, 25); //higher ledge by far right building
            spawn.mapRect(3800, -1100, 400, 990); //far right building

            spawn.bodyRect(3200, -1375, 300, 25, 0.9);
            spawn.bodyRect(1825, -1875, 400, 25, 0.9);
            // spawn.bodyRect(1800, -575, 250, 150, 0.8);
            spawn.bodyRect(1800, -600, 110, 150, 0.8);
            spawn.bodyRect(2557, -450, 35, 55, 0.7);
            spawn.bodyRect(2957, -450, 30, 15, 0.7);
            spawn.bodyRect(2900, -450, 60, 45, 0.7);
            spawn.bodyRect(915, -1200, 60, 100, 0.95);
            spawn.bodyRect(925, -1300, 50, 100, 0.95);
            if (Math.random() < 0.9) {
                spawn.bodyRect(2300, -1720, 400, 20);
                spawn.bodyRect(2590, -1780, 80, 80);
            }
            spawn.bodyRect(2925, -1100, 25, 250, 0.8);
            spawn.bodyRect(3325, -1550, 50, 200, 0.3);
            if (Math.random() < 0.8) {
                spawn.bodyRect(1400, -75, 200, 75); //block to get up ledge from ground
                spawn.bodyRect(1525, -125, 50, 50); //block to get up ledge from ground
            }
            spawn.bodyRect(1025, -1110, 400, 25, 0.9); //block on far left building
            spawn.bodyRect(1425, -1110, 115, 25, 0.9); //block on far left building
            spawn.bodyRect(1540, -1110, 300, 25, 0.9); //block on far left building

            spawn.randomMobPositions = [
                [-100, -1300],
                [1850, -600, true],
                [3200, -100, true],
                [4450, -100, true],
                [2700, -475, true],
                [2650, -975],
                [2650, -1550],
                [4150, -200],
                [1700, -1300],
                [1850, -1950],
                [2610, -1880],
                [3350, -950],
                [1690, -2250],
                [2200, -600],
                [850, -1300],
                [-100, -1700]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(3700, -1500, 0.4);
            spawn.randomGroup(1700, -900, 0.4);
            spawn.randomLevelBoss(2800 + 200 * Math.random(), -2200 + 200 * Math.random());
            spawn.secondaryBossChance(4000, -1825)
            //spawn.randomHigherTierMob(1675, -728)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                boost2.boostBounds.min.x = -boost2.boostBounds.min.x - 100
                boost2.boostBounds.max.x = -boost2.boostBounds.max.x + 100

                level.setPosToSpawn(50, -60); //-x
                level.custom = () => {
                    boost1.query();
                    boost2.query();
                    ctx.fillStyle = "#d4f4f4"
                    ctx.fillRect(-1350 - 400, -2100, 400, 250)
                    ctx.fillStyle = "#d4d4d7"
                    ctx.fillRect(-3350 - 50, -1300, 50, 1325)
                    ctx.fillRect(-1300 - 750, -1800, 750, 1800)

                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.1)"
                    ctx.fillRect(-2500 - 450, -1100, 450, 250)
                    ctx.fillRect(-2400 - 600, -550, 600, 150)
                    ctx.fillRect(-2550 - 250, -1650, 250, 200)
                    ctx.fillStyle = "rgba(0,0,0,0.2)"
                    ctx.fillRect(-700 - 400, -110, 400, 110)
                    ctx.fillRect(-3800 - 400, -110, 400, 110)
                    ctx.fillStyle = "rgba(0,0,0,0.15)"
                    ctx.fillRect(250 - 450, -300, 450, 300)
                };
            }
        },
        superstructure() {
            level.announceText(0, 1025, true)
            level.announceMobTypes()
            level.setPosToSpawn(0, 930);
            level.exit.x = 600
            level.exit.y = -2080
            spawn.mapRect(600, -2060, 100, 25);

            level.defaultZoom = 2400
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#d0d5d5"
            color.map = "#41424b"

            const boosts = []
            const blocks = []

            level.custom = () => {
                ctx.fillStyle = "#c1c7c7ff" //building backgrounds
                ctx.fillRect(-2500, -4900, 775, 6325);
                ctx.fillRect(-1000, -4900, 2000, 6375);
                ctx.fillRect(-1380, -1700, 50, 2775);
                ctx.fillRect(1400, -4900, 1475, 4200);
                //exit
                ctx.fillStyle = "#cff"
                ctx.fillRect(275, -2400, 725, 375);
                level.exit.drawAndCheck();
                level.enter.draw();

                for (let i = 0; i < boosts.length; i++) boosts[i].query();

                //give player some horizontal traction and proper leg animation on specific moving blocks
                if (m.onGround) {
                    for (let i = 0; i < blocks.length; i++) {
                        if (m.standingOn === blocks[i]) {
                            m.moverX = blocks[i].velocity.x //helps sync leg movements
                            m.Vx = player.velocity.x - blocks[i].velocity.x //adds blocks velocity to player
                        }
                    }
                }
                ctx.beginPath();
                for (let i = 0, len = blocks.length; i < len; i++) {
                    let vertices = blocks[i].vertices;
                    ctx.moveTo(vertices[0].x, vertices[0].y);
                    for (let j = 1; j < vertices.length; j += 1) {
                        ctx.lineTo(vertices[j].x, vertices[j].y);
                    }
                    ctx.lineTo(vertices[0].x, vertices[0].y);
                }
                ctx.strokeStyle = "#000"
                ctx.lineWidth = 10
                ctx.stroke();


                //combination of a horizontal force on the block and changing the length of constraints keeps the block form rotating as it swings
                //these parameters need fine tuning, mostly amplitude
                const rate = 0.015
                blocks[0].force.x = 0.002 * Math.sin(simulation.cycle * rate + 0.2) * blocks[0].mass
                constraint1.length = 1300 + 450 * Math.sin(simulation.cycle * rate)
                constraint2.length = 1300 + 450 * Math.sin(simulation.cycle * rate + Math.PI)


                //scale friciton with velocity
                //normal max speed is 15ish
                // const drag = (blocks[0].velocity.x > 15) ? 15 * blocks[0].velocity.x : 1
                // console.log(blocks[0].velocity.x)
                //the setVelocity is acting strang, making the blocks[0] fall?  no clue why
                //why does laser push move the block[0] down when pushing up?
                // Matter.Body.setVelocity(blocks[0], {
                //     x: blocks[0].velocity.x,
                //     y: blocks[0].velocity.y
                // });


                //draw
                ctx.beginPath();
                ctx.moveTo(constraint1.pointA.x, constraint1.pointA.y);
                ctx.lineTo(constraint1.bodyB.position.x + constraint1.pointB.x, constraint1.bodyB.position.y + constraint1.pointB.y);
                ctx.moveTo(constraint2.pointA.x, constraint2.pointA.y);
                ctx.lineTo(constraint2.bodyB.position.x + constraint2.pointB.x, constraint2.bodyB.position.y + constraint2.pointB.y);
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(0,0,0,0.2)";
                ctx.stroke();
            };
            level.customTopLayer = () => {
                //shadows
                ctx.fillStyle = "rgba(0,20,40,0.1)"
                ctx.fillRect(-1000, 700, 1700, 325);
                ctx.fillRect(-2125, 875, 400, 125);
                ctx.fillRect(-115, 250, 630, 150);
                ctx.fillRect(2425, -1575, 450, 375);
                ctx.fillRect(1900, -1200, 975, 475);
                ctx.fillRect(-2500, -550, 775, 1575);
                ctx.fillRect(-2500, -2225, 450, 875);
                ctx.fillRect(-2050, -1900, 325, 575);
                ctx.fillStyle = "rgba(0,0,0,0.06)"
                ctx.fillRect(-625, -2050, 825, 350);
            };
            spawn.mapRect(-2500, 1000, 3500, 3375);//ground
            // spawn.mapRect(-2125, -175, 400, 1062);//left wall
            // spawn.mapVertex(-1925, 360, "225 -500  225 500  200 525  -200 525  -225 500  -225 -500  -200 -525  200 -525");
            spawn.bodyRectCorner(-1925, 360, 500, 1050, 50)

            //left tower
            spawn.mapRect(-2125, 990, 400, 100); //tunnel
            boosts.push(level.boost(-2460, 990, 1250, 1.57 - 0.1)) //slight right angle
            // spawn.mapRect(-2500, -1375, 775, 875);//left wall
            spawn.mapVertex(-2397.5, -400, "0 0   300 0   50 300   0 300");
            spawn.mapRect(-2500, -225, 50, 650);
            spawn.bodyRect(-1850, -250, 125, 75, 0.7);

            //entrance
            spawn.mapRect(-1000, 990, 1700, 75);
            // spawn.mapRect(-1000, 400, 1700, 300);
            const h = 128
            // spawn.mapVertex(0, 550, `1025 -150  1025 150  1000 175  -1000 175  -1025 150  -1025 -150  -1000 -175  1000 -175`);
            spawn.mapVertex(-150, 550, `875 -${h}  875 ${h}  850 ${h + 25}  -850 ${h + 25}  -875 ${h}  -875 -${h}  -850 -${h + 25}  850 -${h + 25}`);


            spawn.mapRect(-225, 687, 450, 25);
            // spawn.mapRect(-225, 675, 450, 35);
            spawn.mapRect(-225, 980, 450, 125);
            spawn.mapRect(-175, 970, 350, 125);


            spawn.bodyRect(-995, 825, 15, 165); //door
            spawn.bodyRect(680, 825, 15, 165);//door
            spawn.mapRect(675, 650, 25, 175);
            spawn.mapRect(-1000, 675, 25, 150);
            boosts.push(level.boost(860, 965, 1500, 1.57 - 0.4)) //slight right angle
            boosts.push(level.boost(1357, 80, 1000, 1.57 + 1.08)) //angled left on side of right tower

            //above entrance
            spawn.bodyRect(-375, 275, 125, 125, 0.7);
            spawn.bodyRectCorner(200, 150, 700, 200, 35)

            //scafolding on left
            spawn.mapRect(-1485, 675, 250, 25);
            spawn.mapRect(-1485, 75, 250, 25);
            spawn.mapRect(-1485, -525, 250, 25);
            spawn.mapRect(-1485, -1125, 250, 25);
            spawn.mapRect(-1485, -1700, 250, 25);
            //floor 2
            boosts.push(level.boost(-800, 400, 1300))

            // spawn.mapRect(-525, -400, 1225, 275);
            //right tower
            spawn.mapRect(1400, -750, 1475, 5125);

            //floor 5
            //far right tower
            spawn.mapVertex(1750, -907, "350 -100  350 175  -350 175   -350 -100  -275 -175    275 -175");
            spawn.mapVertex(2725, -865, "150 -150  150 175  -150 175   -150 -150  -125 -175    125 -175");
            spawn.bodyRect(2775, -1175, 75, 125, 0.7);
            spawn.bodyRect(2100, -825, 175, 75, 0.7);
            spawn.bodyRect(2750, -1975, 125, 150, 0.7);


            spawn.mapVertex(2200, -1310, "325 -100  325 100  300 125  -300 125  -325 100  -325 -100  -300 -125  300 -125");
            spawn.mapVertex(2650, -1700, "250 -100  250 100  225 125  -225 125  -250 100  -250 -100  -225 -125  225 -125");

            spawn.mapRect(1400, -2050, 250, 25);
            spawn.mapRect(1900, -2050, 300, 25);
            spawn.bodyRect(925, -2075, 525, 25);
            spawn.bodyRect(1600, -2075, 375, 25);
            spawn.bodyRect(1450, -2075, 150, 25);
            spawn.bodyRect(1975, -2100, 125, 50);
            spawn.bodyRect(2100, -2125, 100, 75);

            //far left tower
            spawn.mapVertex(-2114, -975, "387 -350  387 500  -387 500   -387 -425    312 -425");
            spawn.bodyRect(-2175, -1425, 125, 75, 0.7);
            spawn.mapVertex(-2350, -1500, "150 -225  150 175  -150 175   -150 -225  -125 -250    125 -250");
            // spawn.mapVertex(-1850, -1925, "150 -100  150 100  125 125  -125 125  -150 100  -150 -100  -125 -125  125 -125");
            spawn.bodyRectCorner(-1900, -1925, 400, 200, 25) //centerX,centerY, w, h, c
            spawn.bodyRectCorner(-2275, -2300, 500, 200, 25) //centerX,centerY, w, h, c

            //exit
            spawn.mapVertex(600, -1875, "425 -150  425 150  400 175  -425 175             -425 -175             400 -175"); //right
            spawn.mapVertex(-800, -1875, "225 -175  225 175          -200 175  -225 150  -225 -150  -200 -175           ");//left
            spawn.mapRect(-350, -2050, 250, 25);
            spawn.mapRect(-600, -1725, 250, 25);
            spawn.mapRect(-100, -1725, 300, 25);
            spawn.bodyRect(-650, -2075, 450, 25);
            spawn.bodyRect(-200, -2075, 525, 25);
            spawn.bodyRectCorner(637.5, -2500, 795.3, 250, 35) //centerX,centerY, w, h, c
            spawn.mapRect(275, -2375, 25, 150);
            spawn.mapRect(975, -2375, 25, 150);




            // spawn.bodyVertex(0, -1500, "600 -100  600 100  550 150  -550 150  -600 100  -600 -100  -550 -150  550 -150");
            const shape = "300 -50  300 50  275 75  -275 75  -300 50  -300 -50  -275 -75  275 -75"

            //force on block to make gentle swinging motion
            spawn.bodyVertex(0, -500, shape, {
                density: 0.0002,
                friction: 1,
                frictionStatic: 1,
                frictionAir: 0.2,
                isNotHoldable: true,
            });
            blocks.push(body[body.length - 1]) //saved to blocks array to give player traction in level.custom
            blocks[0].isNotHoldable = true
            //apply heavy damping for just a second on spawn to prevent crazy shakes

            simulation.ephemera.push({
                count: 25, //cycles before it self removes
                do() {
                    this.count--
                    if (this.count < 0) {
                        simulation.removeEphemera(this)
                        blocks[0].frictionAir = 0.02
                    }
                },
            })
            const constraint1 = cons[cons.length] = Constraint.create({
                pointA: { x: -980, y: -1700 },
                pointB: { x: -300, y: -50 }, //offset from bodyB
                bodyB: body[body.length - 1],
                stiffness: 0.001,
                // damping: 0, //I don't know why but this needs to be 0 or not included to properly transfer traction to the player
                // length: 1000,
            });
            Composite.add(engine.world, cons[cons.length - 1]);
            const constraint2 = cons[cons.length] = Constraint.create({
                pointA: { x: 980, y: -1700 },
                pointB: { x: 300, y: -50 }, //offset from bodyB
                bodyB: body[body.length - 1],
                stiffness: 0.001,
                // length: 1000,
            });
            Composite.add(engine.world, cons[cons.length - 1]);

            spawn.randomMobPositions = [
                [-2000, -250],
                [-1400, 625],
                [-875, 225],
                [50, -50],
                [1750, -1150],
                [2425, -1050],
                [2200, -1550],
                [1550, -2175],
                [300, -2700],
                [-750, -2150],
                [-2250, -2450],
                [-2300, -1800],
                [-1900, -225],
                [-1400, -1175],
                [2200, -1500],
                [1600, -2175],
                [-700, -2175],
                [-2425, -2550]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()

            spawn.randomLevelBoss(1675, -1675);
            if (Math.random() < 0.33) {
                spawn.secondaryBossChance(-1375, -2250);
            } else if (Math.random() < 0.5) {
                spawn.secondaryBossChance(2275, -2575);
            } else {
                spawn.secondaryBossChance(-225, -2525);
            }
            spawn.randomGroup(2775, -2275, 0.1);

            powerUps.spawnStartingPowerUps(2350, -825)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
            powerUps.chooseRandomPowerUp(125, -1750);
            powerUps.chooseRandomPowerUp(650, -2675);
            powerUps.chooseRandomPowerUp(800, -2675);
        },
        highrise() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(175, -1085, true)
            } else {
                level.announceText(-175, -1085, true)
            }
            level.announceMobTypes()
            level.fallMode = "start";
            const elevator1 = level.elevator(-790, -190, 180, 25, -1150, 0.0025, { up: 0.01, down: 0.2 }, true) //x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
            elevator1.addConstraint();
            // const button1 = level.button(-500, -200)
            const toggle1 = level.toggle(-300, -200) //(x,y,isOn,isLockOn = true/false)

            const elevator2 = level.elevator(-3630, -970, 180, 25, -1740, 0.004) //x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
            elevator2.addConstraint();
            // const button2 = level.button(-3100, -1330) 
            const toggle2 = level.toggle(-3100, -1330) //(x,y,isOn, isLockOn = true/false)


            level.custom = () => {
                // ctx.fillStyle = "#d0d0d2"
                // ctx.fillRect(-2475, -2450, 25, 750)
                // ctx.fillRect(-2975, -2750, 25, 600)
                // ctx.fillRect(-3375, -2875, 25, 725)
                ctx.fillStyle = "#cff" //exit
                ctx.fillRect(-4425, -3050, 425, 275)
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                // button1.draw();
                toggle1.query();
                if (!toggle1.isOn) {
                    if (elevator1.isOn) {
                        elevator1.isOn = false
                        elevator1.frictionAir = 0.2
                        elevator1.addConstraint();
                    }
                } else if (!elevator1.isOn) {
                    elevator1.isOn = true
                    elevator1.isUp = false
                    elevator1.removeConstraint();
                    elevator1.frictionAir = 0.2 //elevator.isUp ? 0.01 : 0.2
                }
                if (elevator1.isOn) {
                    elevator1.move();
                    ctx.fillStyle = "#444"
                } else {
                    ctx.fillStyle = "#aaa"
                }
                ctx.fillRect(-700, -1140, 1, 975)

                toggle2.query();
                // button2.draw();
                if (!toggle2.isOn) {
                    if (elevator2.isOn) {
                        elevator2.isOn = false
                        elevator2.frictionAir = 0.2
                        elevator2.addConstraint();
                    }
                } else if (!elevator2.isOn) {
                    elevator2.isOn = true
                    elevator2.isUp = false
                    elevator2.removeConstraint();
                    elevator2.frictionAir = 0.2 //elevator.isUp ? 0.01 : 0.2                    
                }

                if (elevator2.isOn) {
                    elevator2.move();
                    ctx.fillStyle = "#444"
                } else {
                    ctx.fillStyle = "#aaa"
                }
                ctx.fillRect(-3540, -1720, 1, 770)

                ctx.fillStyle = "rgba(64,64,64,0.97)" //hidden section
                ctx.fillRect(-4450, -750, 800, 200)
                ctx.fillStyle = "rgba(0,0,0,0.12)"
                ctx.fillRect(-2500, -1975, 150, 300);
                ctx.fillRect(-1830, -1150, 2030, 1150)
                ctx.fillRect(-3410, -2150, 495, 1550)
                ctx.fillRect(-2585, -1675, 420, 1125)
                ctx.fillRect(-1650, -1575, 775, 450)
            };

            level.setPosToSpawn(-300, -700); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            level.exit.x = -4275;
            level.exit.y = -2805;

            level.defaultZoom = 1500
            simulation.zoomTransition(level.defaultZoom)

            powerUps.spawnStartingPowerUps(-2550, -700);
            document.body.style.backgroundColor = "#dcdcde" //"#fafcff";

            spawn.debris(-2325, -1825, 2400); //16 debris per level
            spawn.debris(-2625, -600, 600, 5); //16 debris per level
            spawn.debris(-2000, -60, 1200, 5); //16 debris per level

            //3 platforms that lead to exit
            // spawn.mapRect(-3440, -2875, 155, 25);
            // spawn.mapRect(-3025, -2775, 125, 25);
            // spawn.mapRect(-2525, -2475, 125, 25);
            // spawn.bodyRect(-2600, -2500, 225, 20, 0.7);
            // spawn.bodyRect(-3350, -2900, 25, 25, 0.5);
            // spawn.bodyRect(-3400, -2950, 50, 75, 0.5);

            powerUps.spawn(-4300, -700, "heal");
            powerUps.spawn(-4200, -700, "ammo");
            powerUps.spawn(-4000, -700, "ammo");
            spawn.mapRect(-4450, -1000, 100, 500);
            spawn.bodyRect(-3300, -750, 150, 150);

            //building 1
            spawn.bodyRect(-1000, -675, 25, 25);
            spawn.mapRect(-2225, 0, 2475, 150);
            spawn.mapRect(175, -1000, 75, 1100);
            spawn.mapRect(-600, -1075, 50, 475);
            spawn.mapRect(-600, -650, 625, 50);
            spawn.mapRect(-1300, -650, 500, 50);
            spawn.bodyRect(-75, -300, 50, 50);

            spawn.mapRect(-600, -200, 500, 250); //ledge for boarding elevator
            spawn.bodyRect(-500, -300, 100, 100, 0.6); //a nice block near the elevator

            spawn.bodyRect(-425, -1375, 400, 225);
            // spawn.mapRect(-925, -1575, 50, 475);
            spawn.mapRect(-925, -1575, 50, 325);

            spawn.bodyRect(-1475, -1275, 250, 125);

            // spawn.mapRect(-1650, -1575, 600, 50);
            // spawn.mapRect(-1875, -1575, 850, 50);
            spawn.mapRect(-1675, -1575, 650, 50);
            spawn.mapRect(-600, -1150, 850, 175);
            spawn.mapRect(-1850, -1150, 1050, 175);
            spawn.bodyRect(-1907, -1600, 550, 25);
            if (simulation.difficulty < 4) {
                spawn.bodyRect(-1600, -125, 125, 125);
                spawn.bodyRect(-1560, -200, 75, 75);
            } else {
                spawn.bodyRect(-1200, -125, 125, 125);
                spawn.bodyRect(-1160, -200, 75, 75);
            }
            //building 2
            spawn.mapRect(-4450, -600, 2300, 750);
            spawn.mapRect(-2225, -450, 175, 550);
            // spawn.mapRect(-2600, -975, 450, 50);
            spawn.mapRect(-3425, -1325, 525, 75);
            spawn.mapRect(-3425, -2200, 525, 50);
            spawn.mapRect(-2600, -1700, 450, 50);
            // spawn.mapRect(-2600, -2450, 450, 50);
            spawn.bodyRect(-2275, -2700, 50, 60);

            // spawn.bodyRect(-2560, -1925, 250, 225);
            // spawn.mapRect(-2525, -2025, 125, 25);
            // spawn.mapRect(-2525, -1900, 125, 225);
            // spawn.mapRect(-2600, -1975, 250, 25);
            spawn.mapRect(-2515, -2000, 180, 50);

            spawn.bodyRect(-3410, -1425, 50, 50);
            spawn.bodyRect(-3390, -1525, 40, 60);
            // spawn.bodyRect(-3245, -1425, 100, 100);
            //building 3
            spawn.mapRect(-4450, -1750, 800, 1050);
            // spawn.mapRect(-3850, -2000, 125, 400);
            spawn.mapRect(-4000, -2390, 200, 800);
            // spawn.mapRect(-4450, -2650, 475, 1000);
            spawn.mapRect(-4450, -2775, 475, 1125);
            spawn.bodyRect(-3715, -2050, 50, 50);
            // spawn.bodyRect(-3570, -1800, 50, 50);
            spawn.bodyRect(-2970, -2250, 50, 50);
            spawn.bodyRect(-3080, -2250, 40, 40);
            spawn.bodyRect(-3420, -650, 50, 50);

            //exit
            spawn.mapRect(-4450, -3075, 25, 300);
            spawn.mapRect(-4450, -3075, 450, 25);
            spawn.mapRect(-4025, -3075, 25, 100);
            spawn.mapRect(-4275, -2785, 100, 25);
            spawn.bodyRect(-3900, -2400, 50, 50);

            //mobs
            spawn.randomMobPositions = [
                [-2500, -2700],
                [-3200, -750],
                [-1875, -775],
                [-950, -1675],
                [-1525, -1750],
                [-1375, -1400],
                [-1625, -1275],
                [-1900, -1250],
                [-2250, -1850],
                [-2475, -2200],
                [-3000, -1475],
                [-3850, -2500],
                [-3650, -2125],
                [-4010, -3200],
                [-3500, -1825],
                [-975, -100],
                [-1050, -725],
                [-1525, -100],
                [-525, -1700],
                [-125, -1500],
                [-325, -1900],
                [-550, -100]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(-3250, -2700, 0.2);
            spawn.randomGroup(-2450, -1100, 0);
            spawn.randomLevelBoss(-2400, -2650);
            spawn.secondaryBossChance(-1825, -1975)
            //spawn.randomHigherTierMob(-2938, -830)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                // boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                // boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                level.setPosToSpawn(300, -700); //-x
                elevator1.holdX = -elevator1.holdX // flip the elevator horizontally
                elevator1.removeConstraint();
                elevator1.addConstraint();
                elevator2.holdX = -elevator2.holdX // flip the elevator horizontally
                elevator2.removeConstraint();
                elevator2.addConstraint();

                level.custom = () => {
                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(4425 - 425, -3050, 425, 275)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    toggle1.query();
                    if (!toggle1.isOn) {
                        if (elevator1.isOn) {
                            elevator1.isOn = false
                            elevator1.frictionAir = 0.2
                            elevator1.addConstraint();
                        }
                    } else if (!elevator1.isOn) {
                        elevator1.isOn = true
                        elevator1.isUp = false
                        elevator1.removeConstraint();
                        elevator1.frictionAir = 0.2 //elevator.isUp ? 0.01 : 0.2
                    }
                    if (elevator1.isOn) {
                        elevator1.move();
                        ctx.fillStyle = "#444"
                        ctx.fillRect(700 - 1, -1140, 1, 975)
                    } else {
                        ctx.fillStyle = "#aaa"
                        ctx.fillRect(700 - 1, -1140, 1, 975)
                    }

                    toggle2.query();
                    if (!toggle2.isOn) {
                        if (elevator2.isOn) {
                            elevator2.isOn = false
                            elevator2.frictionAir = 0.2
                            elevator2.addConstraint();
                        }
                    } else if (!elevator2.isOn) {
                        elevator2.isOn = true
                        elevator2.isUp = false
                        elevator2.removeConstraint();
                        elevator2.frictionAir = 0.2 //elevator.isUp ? 0.01 : 0.2                    
                    }

                    if (elevator2.isOn) {
                        elevator2.move();
                        ctx.fillStyle = "#444"
                        ctx.fillRect(3540 - 1, -1720, 1, 740)
                    } else {
                        ctx.fillStyle = "#aaa"
                        ctx.fillRect(3540 - 1, -1720, 1, 740)
                    }

                    ctx.fillStyle = "rgba(64,64,64,0.97)" //hidden section
                    ctx.fillRect(4450 - 800, -750, 800, 200)
                    ctx.fillStyle = "rgba(0,0,0,0.12)"
                    ctx.fillRect(2500 - 150, -1975, 150, 300);
                    ctx.fillRect(1830 - 2030, -1150, 2030, 1150)
                    ctx.fillRect(3410 - 495, -2150, 495, 1550)
                    ctx.fillRect(2585 - 420, -1675, 420, 1125)
                    ctx.fillRect(1650 - 750, -1575, 750, 450)
                };
            }
        },
        warehouse() {
            if (simulation.isHorizontalFlipped) {
                level.announceText(-25, 20, true)
            } else {
                level.announceText(25, 20, true)
            }
            level.announceMobTypes()
            level.fallMode = "start";
            level.custom = () => {
                ctx.fillStyle = "#444" //light fixtures
                ctx.fillRect(-920, -505, 40, 10)
                ctx.fillRect(-920, 95, 40, 10)
                ctx.fillRect(180, 95, 40, 10)
                ctx.fillRect(-20, 695, 40, 10)
                ctx.fillRect(-2320, 945, 40, 10)

                ctx.fillStyle = "#cff" //exit
                ctx.fillRect(300, -250, 350, 250)
                level.exit.drawAndCheck();

                level.enter.draw();
            };

            const lightingPath = new Path2D() //pre-draw the complex lighting path to save processing
            lightingPath.moveTo(-1800, -500)
            lightingPath.lineTo(-910, -500) //3rd floor light
            lightingPath.lineTo(-1300, 0)
            lightingPath.lineTo(-500, 0)
            lightingPath.lineTo(-890, -500)
            lightingPath.lineTo(-175, -500)
            lightingPath.lineTo(-175, -250)
            lightingPath.lineTo(175, -250)
            lightingPath.lineTo(175, 0)
            lightingPath.lineTo(-910, 100) //2nd floor light left
            lightingPath.lineTo(-1300, 600)
            lightingPath.lineTo(-500, 600)
            lightingPath.lineTo(-890, 100)
            lightingPath.lineTo(190, 100) //2nd floor light right
            lightingPath.lineTo(-200, 600)
            lightingPath.lineTo(600, 600)
            lightingPath.lineTo(210, 100)
            lightingPath.lineTo(1100, 100)
            lightingPath.lineTo(1100, 1400)
            lightingPath.lineTo(600, 1400) //1st floor light right
            lightingPath.lineTo(10, 700)
            lightingPath.lineTo(-10, 700)
            lightingPath.lineTo(-600, 1400)
            lightingPath.lineTo(-1950, 1400) //1st floor light left
            lightingPath.lineTo(-2290, 950)
            lightingPath.lineTo(-2310, 950)
            lightingPath.lineTo(-2650, 1400)
            lightingPath.lineTo(-3025, 1400)
            lightingPath.lineTo(-3025, 150)
            lightingPath.lineTo(-2590, 150)
            lightingPath.lineTo(-2600, -150)
            lightingPath.lineTo(-1800, -150)
            lightingPath.lineTo(-1800, -500) //top left end/start of path

            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,0,0,0.15)"; //shadows and lights
                ctx.fill(lightingPath);
            };

            level.setPosToSpawn(25, -55); //normal spawn
            level.exit.x = 425;
            level.exit.y = -30;

            level.defaultZoom = 1300
            simulation.zoomTransition(level.defaultZoom)

            spawn.debris(-2250, 1330, 3000, 6); //16 debris per level
            spawn.debris(-3000, -800, 3280, 6); //16 debris per level
            spawn.debris(-1400, 410, 2300, 5); //16 debris per level
            powerUps.spawnStartingPowerUps(25, 500);
            document.body.style.backgroundColor = "#dcdcde" //"#f2f5f3";

            spawn.mapRect(-1500, 0, 2750, 100);
            spawn.mapRect(175, -270, 125, 300);
            spawn.mapRect(-1900, -600, 1775, 100);
            spawn.mapRect(-1900, -550, 100, 1250);
            //house
            spawn.mapRect(-225, -550, 100, 400);
            spawn.mapRect(-225, -10, 400, 50);
            spawn.mapRect(-25, -20, 100, 50);

            //exit house
            spawn.mapRect(300, -10, 350, 50);
            spawn.mapRect(-150, -350, 800, 100);
            spawn.mapRect(600, -275, 50, 75);
            spawn.mapRect(425, -20, 100, 25);
            // spawn.mapRect(-1900, 600, 2700, 100);
            spawn.mapRect(1100, 0, 150, 1500);
            spawn.mapRect(-3150, 1400, 4400, 100);
            spawn.mapRect(-2375, 875, 1775, 75);
            spawn.mapRect(-1450, 865, 75, 435);
            spawn.mapRect(-1450, 662, 75, 100);
            spawn.bodyRect(-1418, 773, 11, 102, 1, spawn.propsFriction); //blocking path
            spawn.mapRect(-3150, 50, 125, 1450);
            spawn.mapRect(-2350, 600, 3150, 100);
            spawn.mapRect(-2125, 400, 250, 275);
            // spawn.mapRect(-1950, -400, 100, 25);
            spawn.mapRect(-3150, 50, 775, 100);
            spawn.mapRect(-2600, -250, 775, 100);

            let isElevators = false
            const warehouseCons = []
            let elevator1, elevator2, elevator3
            if (Math.random() < 0.5) {
                isElevators = true
                elevator1 = level.elevator(-1780, 500, 260, 40, 7, 0.0003) //    x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
                elevator2 = level.elevator(820, 1300, 260, 40, 607, 0.0003)
                elevator3 = level.elevator(-2850, 1250, 160, 40, 600, 0.007)
                if (simulation.isHorizontalFlipped) {
                    spawn.mapVertex(-2900, 225, "0 0  0 -500  -500 -500")
                } else {
                    spawn.mapVertex(-2900, 225, "0 0  0 -500  500 -500")
                }
                spawn.mapRect(-3050, 1175, 175, 300);
                spawn.bodyRect(-2375, 1300, 100, 100);
                spawn.bodyRect(-2325, 1250, 50, 50);
                spawn.bodyRect(-2275, 1350, 125, 50);


                level.custom = () => {
                    elevator1.move();
                    elevator1.drawTrack();
                    elevator2.move();
                    elevator2.drawTrack();
                    elevator3.move();
                    elevator3.drawTrack();

                    ctx.fillStyle = "#444" //light fixtures
                    ctx.fillRect(-920, -505, 40, 10)
                    ctx.fillRect(-920, 95, 40, 10)
                    ctx.fillRect(180, 95, 40, 10)
                    ctx.fillRect(-20, 695, 40, 10)
                    ctx.fillRect(-2320, 945, 40, 10)

                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(300, -250, 350, 250)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
            } else {
                spawn.mapRect(-2950, 1250, 175, 250);
                spawn.mapRect(-3050, 1100, 150, 400);

                spawn.bodyRect(-1450, -125, 125, 125, 1, spawn.propsSlide); //weight
                spawn.bodyRect(-1800, 0, 300, 100, 1, spawn.propsHoist); //hoist
                warehouseCons[0] = cons[cons.length] = Constraint.create({
                    pointA: {
                        x: -1650,
                        y: -500
                    },
                    bodyB: body[body.length - 1],
                    stiffness: 0.0003,
                    length: 1
                });
                Composite.add(engine.world, cons[cons.length - 1]);

                spawn.bodyRect(600, 525, 125, 125, 1, spawn.propsSlide); //weight
                spawn.bodyRect(800, 600, 300, 100, 1, spawn.propsHoist); //hoist
                warehouseCons[1] = cons[cons.length] = Constraint.create({
                    pointA: {
                        x: 950,
                        y: 100
                    },
                    bodyB: body[body.length - 1],
                    stiffness: 0.0003,
                    length: 1
                });
                Composite.add(engine.world, cons[cons.length - 1]);

                spawn.bodyRect(-2700, 1150, 100, 160, 1); //weight
                spawn.bodyRect(-2550, 1200, 150, 150, 1); //weight
                spawn.bodyRect(-2763, 1300, 350, 100, 1, spawn.propsHoist); //hoist
                warehouseCons[2] = cons[cons.length] = Constraint.create({
                    pointA: {
                        x: -2575,
                        y: 150
                    },
                    bodyB: body[body.length - 1],
                    stiffness: 0.0008,
                    length: 566
                });
                Composite.add(engine.world, cons[cons.length - 1]);
                level.custom = () => {
                    //draw all 3 constraints
                    ctx.beginPath();
                    for (let i = 0, len = warehouseCons.length; i < len; ++i) {
                        ctx.moveTo(warehouseCons[i].pointA.x, warehouseCons[i].pointA.y);
                        ctx.lineTo(warehouseCons[i].bodyB.position.x + warehouseCons[i].pointB.x, warehouseCons[i].bodyB.position.y + warehouseCons[i].pointB.y);
                    }
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "rgba(0,0,0,0.15)";
                    ctx.stroke();

                    ctx.fillStyle = "#444" //light fixtures
                    ctx.fillRect(-920, -505, 40, 10)
                    ctx.fillRect(-920, 95, 40, 10)
                    ctx.fillRect(180, 95, 40, 10)
                    ctx.fillRect(-20, 695, 40, 10)
                    ctx.fillRect(-2320, 945, 40, 10)

                    ctx.fillStyle = "#cff" //exit
                    ctx.fillRect(300, -250, 350, 250)
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
            }
            //blocks
            spawn.bodyRect(-212, -150, 30, 35, 1);
            spawn.bodyRect(-212, -115, 30, 35, 1);
            spawn.bodyRect(-212, -80, 30, 35, 1);
            spawn.bodyRect(-212, -45, 30, 35, 1);

            spawn.bodyRect(-750, 400, 150, 150, 0.5);
            spawn.bodyRect(-400, 1175, 100, 250, 1); //block to get to top path on bottom level

            spawn.bodyRect(-2525, -50, 145, 100, 0.5);
            spawn.bodyRect(-2325, -300, 150, 100, 0.5);
            spawn.bodyRect(-1275, -750, 200, 150, 0.5); //roof block
            spawn.bodyRect(-525, -700, 125, 100, 0.5); //roof block

            //mobs
            spawn.randomMobPositions = [
                [-1125, 550, true],
                [-2950, -50, true],
                [-2025, 175],
                [-2325, 450],
                [-2925, 675],
                [-2700, 300],
                [-2500, 300],
                [-2075, -425],
                [-1550, -725],
                [375, 1100],
                [-1575, 1100],
                [825, 300, true],
                [-800, -1750],
                [400, -750],
                [650, 1300],
                [-2450, 1050],
                [500, 400],
                [-75, -1700],
                [900, -800]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(-75, 1050, 0);
            spawn.randomGroup(-900, 1000, 0.2);
            spawn.randomGroup(-1300, -1100, 0);
            spawn.randomMobPositions = [
                [-2325, 800, true],
                [-900, 825, true]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomLevelBoss(-800, -1300)
            spawn.secondaryBossChance(300, -800)
            //spawn.randomHigherTierMob(- 98, 1044)
            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

                // boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
                // boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
                level.setPosToSpawn(-25, -55); //-x

                if (isElevators) {
                    elevator1.holdX = -elevator1.holdX // flip the elevator horizontally
                    elevator2.holdX = -elevator2.holdX // flip the elevator horizontally
                    elevator3.holdX = -elevator3.holdX // flip the elevator horizontally
                    level.custom = () => {
                        elevator1.move();
                        elevator1.drawTrack();
                        elevator2.move();
                        elevator2.drawTrack();
                        elevator3.move();
                        elevator3.drawTrack();

                        ctx.fillStyle = "#444" //light fixtures
                        ctx.fillRect(920 - 40, -505, 40, 10)
                        ctx.fillRect(920 - 40, 95, 40, 10)
                        ctx.fillRect(-180 - 40, 95, 40, 10)
                        ctx.fillRect(20 - 40, 695, 40, 10)
                        ctx.fillRect(2320 - 40, 945, 40, 10)

                        ctx.fillStyle = "#cff" //exit
                        ctx.fillRect(-300 - 350, -250, 350, 250)
                        level.exit.drawAndCheck();

                        level.enter.draw();
                    };
                } else {
                    level.custom = () => {

                        //draw all 3 constraints
                        ctx.beginPath();
                        for (let i = 0, len = warehouseCons.length; i < len; ++i) {
                            ctx.moveTo(warehouseCons[i].pointA.x, warehouseCons[i].pointA.y);
                            ctx.lineTo(warehouseCons[i].bodyB.position.x + warehouseCons[i].pointB.x, warehouseCons[i].bodyB.position.y + warehouseCons[i].pointB.y);
                        }
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "rgba(0,0,0,0.15)";
                        ctx.stroke();

                        ctx.fillStyle = "#444" //light fixtures
                        ctx.fillRect(920 - 40, -505, 40, 10)
                        ctx.fillRect(920 - 40, 95, 40, 10)
                        ctx.fillRect(-180 - 40, 95, 40, 10)
                        ctx.fillRect(20 - 40, 695, 40, 10)
                        ctx.fillRect(2320 - 40, 945, 40, 10)

                        ctx.fillStyle = "#cff" //exit
                        ctx.fillRect(-300 - 350, -250, 350, 250)
                        level.exit.drawAndCheck();

                        level.enter.draw();
                    };
                }
                level.customTopLayer = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.15)"; //shadows and lights
                    ctx.beginPath()
                    ctx.moveTo(1800, -500)
                    ctx.lineTo(910, -500) //3rd floor light
                    ctx.lineTo(1300, 0)
                    ctx.lineTo(500, 0)
                    ctx.lineTo(890, -500)
                    ctx.lineTo(175, -500)
                    ctx.lineTo(175, -250)
                    ctx.lineTo(-175, -250)
                    ctx.lineTo(-175, 0)
                    ctx.lineTo(910, 100) //2nd floor light left
                    ctx.lineTo(1300, 600)
                    ctx.lineTo(500, 600)
                    ctx.lineTo(890, 100)
                    ctx.lineTo(-190, 100) //2nd floor light right
                    ctx.lineTo(200, 600)
                    ctx.lineTo(-600, 600)
                    ctx.lineTo(-210, 100)
                    ctx.lineTo(-1100, 100)
                    ctx.lineTo(-1100, 1400)
                    ctx.lineTo(-600, 1400) //1st floor light right
                    ctx.lineTo(-10, 700)
                    ctx.lineTo(10, 700)
                    ctx.lineTo(600, 1400)
                    ctx.lineTo(1950, 1400) //1st floor light left
                    ctx.lineTo(2290, 950)
                    ctx.lineTo(2310, 950)
                    ctx.lineTo(2650, 1400)
                    ctx.lineTo(3025, 1400)
                    ctx.lineTo(3025, 150)
                    ctx.lineTo(2590, 150)
                    ctx.lineTo(2600, -150)
                    ctx.lineTo(1800, -150)
                    ctx.lineTo(1800, -500) //top left end/start of path
                    ctx.fill()
                };
            }
        },
        office() {
            level.announceMobTypes()
            let button, door
            let isReverse = false
            if (Math.random() < 0.8) { //normal direction start in top left
                if (simulation.isHorizontalFlipped) {
                    level.announceText(-1200, -1483, true)
                } else {
                    level.announceText(1200, -1483, true)
                }
                button = level.button(525, 0)
                door = level.door(1362, -400, 25, 400, 355, 1.5) //door(x, y, width, height, distance, speed = 1) {
                level.setPosToSpawn(1200, -1550); //normal spawn
                level.exit.x = 3088;
                level.exit.y = -630;
            } else { //reverse direction, start in bottom right
                if (simulation.isHorizontalFlipped) {
                    level.announceText(-3135, 30, true)
                } else {
                    level.announceText(3135, 30, true)
                }
                isReverse = true
                button = level.button(3800, 0)
                door = level.door(3012, -400, 25, 400, 355, 1.5)
                level.setPosToSpawn(3137, -650); //normal spawn
                level.exit.x = 1375;
                level.exit.y = -1530;
            }
            level.custom = () => {
                button.query();
                button.draw();
                if (button.isUp) {
                    door.isClosing = true
                } else {
                    door.isClosing = false
                }
                door.openClose();
                ctx.fillStyle = "#ccc"
                ctx.fillRect(2495, -500, 10, 525)
                ctx.fillStyle = "#dff"
                if (isReverse) {
                    ctx.fillRect(725, -1950, 825, 450)
                } else {
                    ctx.fillRect(3050, -950, 625, 500)
                }
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(3650, -1300, 1300, 1300)
                ctx.fillRect(3000, -1000, 650, 1000)
                ctx.fillRect(750, -1950, 800, 450)
                ctx.fillRect(750, -1450, 650, 1450)
                ctx.fillRect(-550, -1700, 1300, 1700)
                // ctx.fillRect(0, 0, 0, 0)
                door.draw();
            };
            level.defaultZoom = 1400
            simulation.zoomTransition(level.defaultZoom)
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 50); //ground bump wall
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            document.body.style.backgroundColor = "#e0e5e0";

            spawn.debris(-300, -200, 1000, 6); //ground debris //16 debris per level
            spawn.debris(3500, -200, 800, 5); //ground debris //16 debris per level
            spawn.debris(-300, -650, 1200, 5); //1st floor debris //16 debris per level
            powerUps.spawnStartingPowerUps(-525, -700);

            spawn.mapRect(-600, 0, 2000, 325); //ground
            spawn.mapRect(1400, 25, 1600, 300); //ground
            spawn.mapRect(3000, 0, 2000, 325); //ground
            spawn.mapRect(-600, -1700, 50, 2000 - 100); //left wall
            spawn.bodyRect(-295, -1540, 40, 40); //center block under wall
            spawn.bodyRect(-298, -1580, 40, 40); //center block under wall
            spawn.bodyRect(1500, -1540, 30, 30); //left of entrance
            spawn.mapRect(1550, -2000, 50, 550); //right wall
            // spawn.mapRect(1350, -2000 + 505, 50, 1295); 
            spawn.mapRect(1350, -1500, 50, 1125); //right wall
            spawn.mapRect(-600, -2000 + 250, 2000 - 700, 50); //roof left
            spawn.mapRect(-600 + 1300, -2000, 50, 300); //right roof wall

            // //center wall
            spawn.mapRect(700, -2025, 900, 75);

            map[map.length] = Bodies.polygon(725, -1700, 0, 15); //circle above door
            spawn.bodyRect(720, -1675, 15, 170, 1, spawn.propsDoor); // door
            body[body.length - 1].isNotHoldable = true;
            //makes door swing
            consBB[consBB.length] = Constraint.create({
                bodyA: body[body.length - 1],
                pointA: { x: 0, y: -90 },
                bodyB: map[map.length - 1],
                stiffness: 1
            });
            Composite.add(engine.world, consBB[consBB.length - 1]);

            spawn.mapRect(-600 + 300, -2000 * 0.75, 1900, 75); //3rd floor
            spawn.mapRect(-600 + 2000 * 0.7, -2000 * 0.74, 50, 375); //center wall
            spawn.bodyRect(-600 + 2000 * 0.7, -2000 * 0.5 - 106, 50, 106); //center block under wall
            spawn.mapRect(-600, -1000, 1100, 50); //2nd floor
            spawn.mapRect(600, -1000, 500, 50); //2nd floor
            spawn.spawnStairs(-600, -1000, 4, 250, 350); //stairs 2nd
            spawn.mapRect(375, -600, 350, 150); //center table
            spawn.mapRect(-300, -2000 * 0.25, 1690, 50); //1st floor
            spawn.spawnStairs(-610 + 2000 - 50, -500, 4, 250, 350, true); //stairs
            spawn.spawnStairs(-600, 0, 4, 250, 350); //stairs ground
            spawn.bodyRect(700, -200, 100, 100); //center block under wall
            spawn.bodyRect(700, -300, 100, 100); //center block under wall
            spawn.bodyRect(700, -400, 100, 100); //center block under wall
            spawn.mapRect(1390, 17, 30, 20); //step left
            spawn.mapRect(1390, 9, 20, 20); //step left
            spawn.mapRect(2980, 17, 30, 20); //step right
            spawn.mapRect(2990, 9, 30, 20); //step right
            spawn.bodyRect(4250, -700, 50, 100);
            spawn.mapRect(3000, -1000, 50, 625); //left wall
            spawn.mapRect(3000 + 2000 - 50, -1300, 50, 1100); //right wall
            spawn.mapRect(4150, -600, 350, 150); //table
            spawn.mapRect(3650, -1300, 50, 700); //exit wall
            spawn.mapRect(3650, -1325, 1350, 75); //exit wall
            spawn.bodyRect(3665, -600, 20, 100); //door

            spawn.mapRect(3025, -600, 250, 125);
            spawn.mapRect(3175, -550, 175, 75);
            // spawn.mapVertex(3160, -525, "625 0   300 0   300 -140   500 -140"); //entrance/exit ramp

            spawn.mapRect(3000, -2000 * 0.5, 700, 50); //exit roof
            spawn.mapRect(3010, -2000 * 0.25, 1690, 50); //1st floor
            spawn.spawnStairs(3000 + 2000 - 50, 0, 4, 250, 350, true); //stairs ground
            spawn.randomMobPositions = [
                [4575, -560, true],
                [1315, -880, true],
                [800, -600, true],
                [4100, -225],
                [-250, -700],
                [4500, -225],
                [3250, -225],
                [-100, -225],
                [1150, -225],
                [2000, -225],
                [450, -225],
                [100, -1200],
                [950, -1150]
            ].map(([x, y, isSmall = false]) => ({ x, y, isSmall }));
            spawn.randomMobFromArray()
            spawn.randomGroup(1800, -800, -0.2);
            spawn.randomGroup(4150, -1000, 0.6);

            if (simulation.difficultyMode > 1 || level.levelsCleared > 1) {
                if (Math.random() < 0.5) {
                    spawn.tetherBoss(2850, -80, { x: 2500, y: -500 })
                } else {
                    spawn.randomLevelBoss(2200, -450)
                }
            } else {
                powerUps.spawnBossPowerUp(2800, -1400)
            }

            spawn.secondaryBossChance(1875, -675)
            //spawn.randomHigherTierMob(-139, -610)

            powerUps.addResearchToLevel() //needs to run after mobs are spawned

            if (simulation.isHorizontalFlipped) { //flip the map horizontally
                level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
                if (isReverse) { //normal direction start in top left
                    level.setPosToSpawn(-3137, -650); //normal spawn
                } else { //reverse direction, start in bottom right
                    level.setPosToSpawn(-1200, -1550); //normal spawn //-x
                }
                button.min.x = -button.min.x - 126 // flip the button horizontally
                button.max.x = -button.max.x + 126 // flip the button horizontally
                level.custom = () => {
                    button.query();
                    button.draw();
                    if (button.isUp) {
                        door.isClosing = true
                    } else {
                        door.isClosing = false
                    }
                    door.openClose();
                    ctx.fillStyle = "#ccc"
                    ctx.fillRect(-2495 - 10, -500, 10, 525)
                    ctx.fillStyle = "#dff"
                    if (isReverse) {
                        ctx.fillRect(-725 - 825, -1950, 825, 450)
                    } else {
                        ctx.fillRect(-3050 - 625, -950, 625, 500)
                    }
                    level.exit.drawAndCheck();

                    level.enter.draw();
                };
                level.customTopLayer = () => {
                    ctx.fillStyle = "rgba(0,0,0,0.1)"
                    ctx.fillRect(-3650 - 1300, -1300, 1300, 1300)
                    ctx.fillRect(-3000 - 650, -1000, 650, 1000)
                    ctx.fillRect(-750 - 800, -1950, 800, 450)
                    ctx.fillRect(-750 - 650, -1450, 650, 1450)
                    ctx.fillRect(550 - 1300, -1700, 1300, 1700)
                    // ctx.fillRect(0, 0, 0, 0)
                    door.draw();
                };
            }

        },
    },
};
