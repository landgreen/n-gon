let body = []; //non static bodies
let map = []; //all static bodies
let cons = []; //all constraints between a point and a body
let consBB = []; //all constraints between two bodies
let composite = [] //rotors and other map elements that don't fit 
const level = {
    defaultZoom: 1400,
    onLevel: -1,
    levelsCleared: 0,
    // playableLevels: ["pavilion", "pavilion", "pavilion", "pavilion", "pavilion", "pavilion", "pavilion", "pavilion", "pavilion", "pavilion", "pavilion"],
    //see level.populateLevels:   (intro, ... , reservoir, reactor, ... , gauntlet, final)    added later
    playableLevels: ["labs", "rooftops", "skyscrapers", "warehouse", "highrise", "office", "aerie", "satellite", "sewers", "testChamber", "pavilion"],
    communityLevels: ["stronghold", "basement", "crossfire", "vats", "run", "n-gon", "house", "perplex", "coliseum", "tunnel", "islands", "temple", "dripp", "biohazard"],
    trainingLevels: ["walk", "crouch", "jump", "hold", "throw", "throwAt", "deflect", "heal", "fire", "nailGun", "shotGun", "superBall", "matterWave", "missile", "stack", "mine", "grenades", "harpoon"],
    levels: [],
    start() {
        if (level.levelsCleared === 0) { //this code only runs on the first level
            // simulation.enableConstructMode() //used to build maps in testing mode
            // level.difficultyIncrease(24 * 4) //30 is near max on hard  //60 is near max on why
            // simulation.isHorizontalFlipped = true
            // m.maxHealth = m.health = 100
            // tech.isRerollDamage = true
            // powerUps.research.changeRerolls(100000)
            // m.immuneCycle = Infinity //you can't take damage
            // tech.tech[297].frequency = 100
            // m.setField("time dilation") //molecular assembler  standing wave   time dilation   perfect diamagnetism   metamaterial cloaking   wormhole   negative mass
            // m.damage(0.1);
            // b.giveGuns("wave") //0 nail gun  1 shotgun  2 super balls 3 wave 4 missiles 5 grenades  6 spores  7 drones  8 foam  9 harpoon  10 mine  11 laser
            // b.guns[3].ammo = 1000000

            // tech.giveTech("phonon")
            // for (let i = 0; i < 4; ++i) tech.giveTech("bound state")
            // for (let i = 0; i < 1; ++i) tech.giveTech("isotropic")
            // tech.giveTech("sympathetic resonance")
            // for (let i = 0; i < 1; i++) tech.giveTech("uncertainty principle")
            // for (let i = 0; i < 10; i++) powerUps.directSpawn(450, -50, "tech");
            // for (let i = 0; i < 10; i++) powerUps.directSpawn(1750, -500, "boost");
            // for (let i = 0; i < 10; i++) powerUps.directSpawn(1750, -500, "coupling");

            // spawn.starter(1900, -500)
            // spawn.beetleBoss(2538, -1950)
            // for (let i = 0; i < 33; ++i) spawn.shooter(1000 + 5000 * Math.random(), -500 + 300 * Math.random())
            // tech.addJunkTechToPool(2)
            // tech.tech[322].frequency = 100
            // level.testing();
            // spawn.blowSuckBoss(1900, -500)
            // for (let i = 0; i < 13; ++i) powerUps.directSpawn(m.pos.x + 50 * Math.random(), m.pos.y + 50 * Math.random(), "research");
            // for (let i = 0; i < 4; ++i) powerUps.directSpawn(m.pos.x + 50 * Math.random(), m.pos.y + 50 * Math.random(), "tech");

            if (simulation.isTraining) { level.walk(); } else { level.intro(); } //normal starting level ************************************************
            // powerUps.research.changeRerolls(3000)
            // for (let i = 0; i < 30; i++) powerUps.spawn(player.position.x + Math.random() * 50, player.position.y - Math.random() * 50, "tech", false);
            // for (let i = 0; i < 3; i++) tech.giveTech("undefined")
            // lore.techCount = 3
            // simulation.isCheating = false //true;
            // localSettings.loreCount = 0; //this sets what conversation is heard
            // if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            // level.onLevel = -1 //this sets level.levels[level.onLevel] = undefined which is required to run the conversation
            // level.null()
            // lore.unlockTesting();
            // tech.giveTech("tinker"); //show junk tech in experiment mode

            // simulation.rumble()
        } else {
            spawn.setSpawnList(); //picks a couple mobs types for a themed random mob spawns
            // spawn.pickList = ["focuser", "focuser"]
            level[level.levels[level.onLevel]](); //picks the current map from the the levels array
            if (!simulation.isCheating && !build.isExperimentRun && !simulation.isTraining) {
                localSettings.runCount += level.levelsCleared //track the number of total runs locally
                localSettings.levelsClearedLastGame = level.levelsCleared
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
        }
        if (!simulation.isTraining) level.levelAnnounce();
        simulation.noCameraScroll();
        simulation.setZoom();
        level.addToWorld(); //add bodies to game engine
        simulation.draw.setPaths();
        b.respawnBots();
        m.resetHistory();
        spawn.quantumEraserCheck(); //remove mobs from tech: quantum eraser

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
        if (tech.isExtraMaxEnergy) {
            tech.healMaxEnergyBonus += 0.1 * powerUps.totalPowerUps //Math.min(0.02 * powerUps.totalPowerUps, 0.51)
            m.setMaxEnergy();
        }
        if (tech.isGunCycle) {
            b.inventoryGun++;
            if (b.inventoryGun > b.inventory.length - 1) b.inventoryGun = 0;
            simulation.switchGun();
        }
        if (tech.isSwitchReality && powerUps.research.count > 0) {
            powerUps.research.changeRerolls(-1);
            simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
            m.switchWorlds()
            simulation.trails()
            powerUps.spawn(player.position.x + Math.random() * 50, player.position.y - Math.random() * 50, "tech", false);
        }
        if (tech.isHealLowHealth) {
            const len = Math.ceil((m.maxHealth - m.health) / 0.29)
            for (let i = 0; i < len; i++) powerUps.spawn(player.position.x + 90 * (Math.random() - 0.5), player.position.y + 90 * (Math.random() - 0.5), "heal", false);
        }
        if (tech.isMACHO) spawn.MACHO()
        for (let i = 0; i < tech.wimpCount; i++) {
            spawn.WIMP()
            mob[mob.length - 1].isDecoupling = true //so you can find it to remove
            for (let j = 0, len = 5; j < len; j++) powerUps.spawn(level.exit.x + 100 * (Math.random() - 0.5), level.exit.y - 100 + 100 * (Math.random() - 0.5), "research", false)
        }
        // if (tech.isFlipFlopLevelReset && !tech.isFlipFlopOn) {
        if ((tech.isRelay || tech.isFlipFlop) && !tech.isFlipFlopOn) {
            tech.isFlipFlopOn = true
            if (tech.isFlipFlopHealth) m.setMaxHealth()
            if (tech.isRelayEnergy) m.setMaxEnergy()
            if (tech.isFlipFlopCoupling) {
                m.couplingChange(5)
                for (let i = 0; i < mob.length; i++) {
                    if (mob[i].isDecoupling) mob[i].alive = false //remove WIMP
                }
            }
            m.eyeFillColor = m.fieldMeterColor
            simulation.makeTextLog(`tech.isFlipFlopOn <span class='color-symbol'>=</span> true`);
        }
        if (tech.isSpawnExitTech) {
            for (let i = 0; i < 2; i++) powerUps.spawn(level.exit.x + 10 * (Math.random() - 0.5), level.exit.y - 100 + 10 * (Math.random() - 0.5), "tech", false) //exit
            // for (let i = 0; i < 2; i++) powerUps.spawn(player.position.x + 90 * (Math.random() - 0.5), player.position.y + 90 * (Math.random() - 0.5), "tech", false); //start
        }
        if (m.plasmaBall) m.plasmaBall.reset()
    },
    trainingText(say) {
        simulation.lastLogTime = 0; //clear previous messages
        simulation.isTextLogOpen = true
        simulation.makeTextLog(`<span style="font-size: 120%;line-height: 120%;"><span style="color:#51f;">supervised.learning</span>(<span style="color:#777; font-size: 80%;">${(Date.now()/1000).toFixed(0)} s</span>)<span class='color-symbol'>:</span><br>${say}</span>`, Infinity)
        simulation.isTextLogOpen = false
        // lore.trainer.text("Wow. Just a platform.")
    },
    trainingBackgroundColor: "#e1e1e1",
    custom() {},
    customTopLayer() {},
    setDifficulty() {
        simulation.difficulty = 0
        m.dmgScale = 1; //damage done by player decreases each level
        simulation.accelScale = 1 //mob acceleration increases each level
        simulation.CDScale = 1 //mob CD time decreases each level
        simulation.dmgScale = Math.max(0.1, 0.34 * simulation.difficulty) //damage done by mobs scales with total levels
        simulation.healScale = 1 / (1 + simulation.difficulty * 0.05) //a higher denominator makes for lower heals // m.health += heal * simulation.healScale;
    },
    difficultyIncrease(num = 1) {
        for (let i = 0; i < num; i++) {
            simulation.difficulty++
            m.dmgScale *= 0.922; //damage done by player decreases each level
            if (simulation.accelScale < 6) simulation.accelScale *= 1.025 //mob acceleration increases each level
            if (simulation.CDScale > 0.15) simulation.CDScale *= 0.965 //mob CD time decreases each level
        }
        simulation.dmgScale = Math.max(0.1, 0.34 * simulation.difficulty) //damage done by mobs scales with total levels
        simulation.healScale = 1 / (1 + simulation.difficulty * 0.05) //a higher denominator makes for lower heals // m.health += heal * simulation.healScale;
        // console.log(`CD = ${simulation.CDScale}`)
    },
    difficultyDecrease(num = 1) { //used in easy mode for simulation.reset()
        for (let i = 0; i < num; i++) {
            simulation.difficulty--
            m.dmgScale /= 0.922; //damage done by player decreases each level
            if (simulation.accelScale > 1) simulation.accelScale /= 1.025 //mob acceleration increases each level
            if (simulation.CDScale < 1) simulation.CDScale /= 0.965 //mob CD time decreases each level
        }
        if (simulation.difficulty < 1) simulation.difficulty = 0;
        simulation.dmgScale = Math.max(0.1, 0.34 * simulation.difficulty) //damage done by mobs scales with total levels
        simulation.healScale = 1 / (1 + simulation.difficulty * 0.05)
    },
    difficultyText() {
        if (simulation.difficultyMode === 1) {
            return "easy"
        } else if (simulation.difficultyMode === 2) {
            return "normal"
        } else if (simulation.difficultyMode === 4) {
            return "hard"
        } else if (simulation.difficultyMode === 6) {
            return "why"
        }
    },
    levelAnnounce() {
        const difficulty = simulation.isCheating ? "testing" : level.difficultyText()
        if (level.levelsCleared === 0) {
            document.title = "n-gon: (" + difficulty + ")";
        } else {
            document.title = `n-gon: ${level.levelsCleared} ${level.levels[level.onLevel]} (${difficulty})`
            simulation.makeTextLog(`<span class='color-var'>level</span>.onLevel <span class='color-symbol'>=</span> "<span class='color-text'>${level.levels[level.onLevel]}</span>"`);
        }
        // simulation.makeTextLog(`
        // input.key.up = ["<span class='color-text'>${input.key.up}</span>", "<span class='color-text'>ArrowUp</span>"]
        // <br>input.key.left = ["<span class='color-text'>${input.key.left}</span>", "<span class='color-text'>ArrowLeft</span>"]
        // <br>input.key.down = ["<span class='color-text'>${input.key.down}</span>", "<span class='color-text'>ArrowDown</span>"]
        // <br>input.key.right = ["<span class='color-text'>${input.key.right}</span>", "<span class='color-text'>ArrowRight</span>"]
        // <br>
        // <br><span class='color-var'>m</span>.fieldMode = "<span class='color-text'>${m.fieldUpgrades[m.fieldMode].name}</span>"
        // <br>input.key.field = ["<span class='color-text'>${input.key.field}</span>", "<span class='color-text'>right mouse</span>"]
        // <br><span class='color-var'>m</span>.field.description = "<span class='color-text'>${m.fieldUpgrades[m.fieldMode].description}</span>"
        // `, 1200);
    },
    disableExit: false,
    nextLevel() {
        if (!level.disableExit) {
            level.levelsCleared++;
            level.onLevel++; //cycles map to next level
            if (simulation.isTraining) {
                if (level.onLevel > level.levels.length - 1) {
                    level.disableExit = true
                    document.getElementById("health").style.display = "none"
                    document.getElementById("health-bg").style.display = "none"
                    document.getElementById("text-log").style.opacity = 0; //fade out any active text logs
                    document.getElementById("fade-out").style.opacity = 1; //slowly fades out
                    setTimeout(function() {
                        simulation.paused = true;
                        level.disableExit = false;
                        engine.world.bodies.forEach((body) => { Matter.Composite.remove(engine.world, body) })
                        Engine.clear(engine);
                        simulation.splashReturn();
                    }, 6000);
                    return
                } else {
                    level.setDifficulty()
                }
            } else {
                if (level.onLevel > level.levels.length - 1) level.onLevel = 0;
                level.difficultyIncrease(simulation.difficultyMode)
            }

            //reset lost tech display
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].isLost) tech.tech[i].isLost = false;
            }
            tech.isDeathAvoidedThisLevel = false;
            simulation.updateTechHUD();
            simulation.clearNow = true; //triggers in simulation.clearMap to remove all physics bodies and setup for new map
        }
    },
    populateLevels() { //run a second time if URL is loaded
        if (document.getElementById("banned").value) { //remove levels from ban list in settings
            const banList = document.getElementById("banned").value.replace(/,/g, ' ').replace(/\s\s+/g, ' ').replace(/[^\w\s]/g, '') //replace commas with spaces, replace double spaces with single, remove strange symbols
            const remove = banList.split(" ");
            console.log('remove these', remove)
            console.log('community levels before', level.communityLevels)
            for (let i = 0; i < remove.length; i++) {
                const index = level.communityLevels.indexOf(remove[i])
                if (index !== -1) level.communityLevels.splice(index, 1);
            }
            console.log('community levels after', level.communityLevels)
            console.log('Landgreen levels before', level.playableLevels)
            for (let i = 0; i < remove.length; i++) {
                if (level.playableLevels.length + level.communityLevels.length * simulation.isCommunityMaps < 10) break //can't remove too many levels
                const index = level.playableLevels.indexOf(remove[i])
                if (index !== -1) level.playableLevels.splice(index, 1);
            }
            console.log('Landgreen levels after', level.playableLevels)
        }

        if (document.getElementById("seed").value) { //check for player entered seed in settings
            Math.initialSeed = String(document.getElementById("seed").value)
            Math.seed = Math.abs(Math.hash(Math.initialSeed)) //update randomizer seed in case the player changed it
        }

        if (simulation.isTraining) {
            level.levels = level.trainingLevels.slice(0) //copy array, not by just by assignment
        } else { //add remove and shuffle levels for the normal game (not training levels)
            level.levels = level.playableLevels.slice(0) //copy array, not by just by assignment
            if (simulation.isCommunityMaps) {
                level.levels = level.levels.concat(level.communityLevels)
                simulation.isHorizontalFlipped = false;
            } else {
                simulation.isHorizontalFlipped = (Math.seededRandom() < 0.5) ? true : false //if true, some maps are flipped horizontally
            }
            level.levels = shuffle(level.levels); //shuffles order of maps with seeded random
            level.levels.length = 9 //remove any extra levels past 9
            level.levels.splice(Math.floor(Math.seededRandom(level.levels.length * 0.6, level.levels.length)), 0, "reservoir"); //add level to the back half of the randomized levels list
            level.levels.splice(Math.floor(Math.seededRandom(level.levels.length * 0.6, level.levels.length)), 0, "reactor"); //add level to the back half of the randomized levels list
            if (!build.isExperimentSelection || (build.hasExperimentalMode && !simulation.isCheating)) { //experimental mode is endless, unless you only have an experiment Tech
                level.levels.unshift("intro"); //add level to the start of the randomized levels list
                level.levels.push("gauntlet"); //add level to the end of the randomized levels list
                level.levels.push("final"); //add level to the end of the randomized levels list
            }
        }
        //set seeded random lists of mobs and bosses
        spawn.mobTypeSpawnOrder = []
        for (let i = 0; i < level.levels.length; i++) spawn.mobTypeSpawnOrder.push(spawn.fullPickList[Math.floor(Math.seededRandom(0, spawn.fullPickList.length))])
        spawn.bossTypeSpawnOrder = []
        for (let i = 0; i < level.levels.length * 2; i++) spawn.bossTypeSpawnOrder.push(spawn.randomBossList[Math.floor(Math.seededRandom(0, spawn.randomBossList.length))])
    },
    flipHorizontal() {
        const flipX = (who) => {
            for (let i = 0, len = who.length; i < len; i++) {
                Matter.Body.setPosition(who[i], { x: -who[i].position.x, y: who[i].position.y })
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
    exitCount: 0,
    // playerExitCheck() {
    //     if (
    //         player.position.x > level.exit.x &&
    //         player.position.x < level.exit.x + 100 &&
    //         player.position.y > level.exit.y - 150 &&
    //         player.position.y < level.exit.y - 40 &&
    //         player.velocity.y < 0.1
    //     ) {
    //         level.exitCount++
    //         if (level.exitCount > 120) {
    //             level.exitCount = 0
    //             level.nextLevel()
    //         }
    //     }
    // },
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
        m.fieldPosition = { x: m.pos.x, y: m.pos.y }
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
                player.position.y > level.exit.y - 150 &&
                player.position.y < level.exit.y - 0 &&
                player.velocity.y < 0.15
            ) {
                level.exitCount += input.down ? 8 : 2
            } else if (level.exitCount > 0) {
                level.exitCount -= 2
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
                ctx.strokeStyle = "#444"
                ctx.lineWidth = 2
                ctx.stroke();
                ctx.setLineDash([0, 0]);

                if (level.exitCount > 100) {
                    level.exitCount = 0
                    level.nextLevel()
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
        for (let i = 0; i < body.length; i++) {
            if (body[i] !== m.holdingTarget && !body[i].isNoSetCollision) {
                body[i].collisionFilter.category = cat.body;
                body[i].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
            }
            body[i].classType = "body";
            Composite.add(engine.world, body[i]); //add to world
        }
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
            isNoSetCollision: true,
            isNotHoldable: true,
            frictionAir: frictionAir,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
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
        return constraint
    },
    rotor(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
        x += width / 2
        y += height / 2
        const who = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.body,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            isNoSetCollision: true,
            isNotHoldable: true,
            frictionAir: frictionAir,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            rotationForce: rotationForce
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
        who.center = { x: who.position.x, y: who.position.y }
        who.rotate = function() {
            if (!m.isBodiesAsleep) {
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
        //         if (!m.isBodiesAsleep) {
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


        return who
    },
    boost(x, y, height = 1000) { //height is how high the player will be flung above y
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
            yVelocity: -1.21 * Math.sqrt(Math.abs(height)),
            query() {
                // check for collisions
                query = (who) => {
                    if (Matter.Query.region(who, this.boostBounds).length > 0) {
                        list = Matter.Query.region(who, this.boostBounds)
                        Matter.Body.setVelocity(list[0], {
                            x: list[0].velocity.x + (Math.random() - 0.5) * 2.5, //add a bit of horizontal drift to reduce endless bounces
                            y: this.yVelocity //give a upwards velocity
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
                            y: this.yVelocity //give a upwards velocity that will put the player that the height desired
                        });
                    }
                }

                //draw 
                ctx.fillStyle = "rgba(200,0,255,0.15)";
                ctx.fillRect(this.boostBounds.min.x, this.boostBounds.min.y - 10, 100, 30);
                ctx.fillStyle = "rgba(200,0,255,0.05)";
                ctx.fillRect(this.boostBounds.min.x, this.boostBounds.min.y - 50, 100, 70);
                // ctx.fillStyle = "rgba(200,0,255,0.02)";
                // ctx.fillRect(x, y - 120, 100, 120);
            },
        });
        return who
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
                mask: cat.map | cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            isNoSetCollision: true,
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            frictionAir: 0.001,
            holdX: x,
            move() {
                if (!m.isBodiesAsleep) {
                    if (this.isUp) { //moving up still with high air friction
                        this.force.y -= force * this.mass //hard force propels up, even with high friction

                        if (this.position.y < maxHeight) { //switch to down mode
                            this.isUp = false
                            this.frictionAir = friction.down
                            //adds a hard jerk at the top of vertical motion because it's fun
                            Matter.Body.setPosition(this, {
                                x: this.holdX,
                                y: maxHeight
                            });
                            Matter.Body.setVelocity(this, {
                                x: 0,
                                y: 0
                            });
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
                }
                //edge limits
                if (this.position.y < maxHeight) {
                    Matter.Body.setPosition(this, {
                        x: this.holdX,
                        y: maxHeight
                    });
                } else if (this.position.y > y) {
                    Matter.Body.setPosition(this, {
                        x: this.holdX,
                        y: y
                    });
                }
                // hold horizontal position
                Matter.Body.setPosition(this, {
                    x: this.holdX,
                    y: this.position.y
                });
                Matter.Body.setVelocity(this, {
                    x: 0,
                    y: this.velocity.y
                });
            },
            off() {
                Matter.Body.setPosition(this, {
                    x: this.holdX,
                    y: this.position.y
                });
                Matter.Body.setVelocity(this, {
                    x: 0,
                    y: this.velocity.y
                });
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
        return who
    },
    spring(x, y, v = "-100 0  100 0  70 40  0 50  -70 40", force = 0.01, distance = 300, angle = 0) {
        const who = body[body.length] = Matter.Bodies.fromVertices(x, y, Vertices.fromPath(v), {
            collisionFilter: {
                category: cat.body,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            frictionAir: 1,
            density: 0.1,
            isReady: true,
            isResetting: false,
            query() {
                if (this.isReady) {
                    if (Matter.Query.collides(this, [player]).length) {
                        this.isReady = false
                        this.constraint.stiffness = 0
                        this.constraint.damping = 0 //0.3
                        this.frictionAir = 0
                        Matter.Body.setVelocity(this, { x: 0, y: 0 });
                        //show graphically  being ready?

                    }
                } else {
                    if (this.isResetting) {
                        this.constraint.stiffness += 0.0005
                        if (this.constraint.stiffness > 0.1) {
                            this.isResetting = false
                            this.isReady = true
                        }
                    } else {
                        if (Vector.magnitudeSquared(Vector.sub(this.position, { x: x, y: y })) < distance * distance) {
                            this.force.y -= force * this.mass
                        } else {
                            this.constraint.damping = 1
                            this.frictionAir = 1
                            this.isResetting = true
                            Matter.Body.setVelocity(this, { x: 0, y: 0 });
                        }
                    }
                }
            }
        });
        who.constraint = Constraint.create({
            pointA: {
                x: who.position.x,
                y: who.position.y
            },
            bodyB: who,
            stiffness: 1,
            damping: 1
        });
        Composite.add(engine.world, who.constraint);
        return who
    },
    // rotor(x, y, rotate = 0, radius = 800, width = 40, density = 0.0005) {
    //     const rotor1 = Matter.Bodies.rectangle(x, y, width, radius, {
    //         density: density,
    //         isNotHoldable: true,
    //         isNonStick: true,
    //         collisionFilter: {
    //             category: cat.map,
    //             mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
    //         },
    //         isNoSetCollision: true,
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
    //         isNoSetCollision: true,
    //     });
    //     rotor = Body.create({ //combine rotor1 and rotor2
    //         parts: [rotor1, rotor2],
    //         restitution: 0,
    //         collisionFilter: {
    //             category: cat.map,
    //             mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
    //         },
    //         isNoSetCollision: true,
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
    //             if (!m.isBodiesAsleep) {
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
        map[map.length - 1].friction = 1;
        map[map.length - 1].frictionStatic = 1;
        spawn.bodyRect(x, y - 5, 120, 15) //toggle body called flip
        let flip = body[body.length - 1];
        flip.isNoSetCollision = true //prevents collision from being rewritten in level.addToWorld
        flip.collisionFilter.category = cat.body
        flip.collisionFilter.mask = cat.player | cat.body
        flip.isNotHoldable = true
        flip.frictionAir = 0.01
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
    button(x, y, width = 126) {
        spawn.mapVertex(x + 65, y + 2, "100 10 -100 10 -70 -10 70 -10");
        map[map.length - 1].restitution = 0;
        map[map.length - 1].friction = 1;
        map[map.length - 1].frictionStatic = 1;

        // const buttonSensor = Bodies.rectangle(x + 35, y - 1, 70, 20, {
        //   isSensor: true
        // });

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
                            Matter.Body.setVelocity(list[0], {
                                x: 0,
                                y: 0
                            });
                        }
                    }
                    this.isUp = false;
                }
            },
            draw() {
                ctx.fillStyle = "hsl(0, 100%, 70%)"
                if (this.isUp) {
                    ctx.fillRect(this.min.x, this.min.y - 10, this.width, 20)
                } else {
                    ctx.fillRect(this.min.x, this.min.y - 3, this.width, 25)
                }
            }
        }
    },
    vanish(x, y, width, height, isVertical = false, hide = { x: 0, y: 150 }) {
        x = x + width / 2
        y = y + height / 2
        const vertices = [{ x: x, y: y, index: 0, isInternal: false }, { x: x + width, y: y, index: 1, isInternal: false }, { x: x + width, y: y + height, index: 4, isInternal: false }, { x: x, y: y + height, index: 3, isInternal: false }]
        const block = body[body.length] = Bodies.fromVertices(x, y, vertices, {
            // const block = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            isNoSetCollision: true,
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
                    return [{ x: x, y: y * size, index: 0, isInternal: false }, { x: x + width, y: y * size, index: 1, isInternal: false }, { x: x + width, y: (y + height) * size, index: 4, isInternal: false }, { x: x, y: (y + height) * size, index: 3, isInternal: false }]
                } else {
                    return [{ x: x * size, y: y, index: 0, isInternal: false }, { x: (x + width) * size, y: y, index: 1, isInternal: false }, { x: (x + width) * size, y: y + height, index: 4, isInternal: false }, { x: x * size, y: y + height, index: 3, isInternal: false }]
                }
            },
            query() {
                if (this.isThere) {
                    if (this.isTouched) {
                        if (!m.isBodiesAsleep) {
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
                } else {
                    if (!m.isBodiesAsleep) {
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
                                //delete any overlapping mobs
                                // const mobsHits = Matter.Query.collides(this, mob)
                                // for (let i = 0; i < mobsHits.length; i++) {
                                //     if (mobsHits[i].bodyB !== this && mobsHits[i].bodyB !== m.holdingTarget) { //dont' delete yourself   <----- bug here maybe...
                                //         Matter.Composite.remove(engine.world, mobsHits[i].bodyB);
                                //         mobsHits[i].bodyB.isRemoveMeNow = true
                                //         for (let i = 1; i < mob.length; i++) { //find which index in body array it is and remove from array
                                //             if (mob[i].isRemoveMeNow) {
                                //                 mob.splice(i, 1);
                                //                 break
                                //             }
                                //         }
                                //     }
                                // }
                            }
                        }
                    }
                }
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x, v[0].y);
                for (let i = 1; i < v.length; ++i) ctx.lineTo(v[i].x, v[i].y);
                ctx.lineTo(v[0].x, v[0].y);
                ctx.fillStyle = "#586370"
                ctx.fill();
                // const color = 220 * (1 - this.fadeCount / this.fadeTime)
                // ctx.fillStyle = `rgb(${color},220, 200)`
                // ctx.fillStyle = `rgba(0,220,200,${this.fadeCount/this.fadeTime+0.05})` 
                // ctx.strokeStyle = `#bff`
                // ctx.stroke();
            },
        });
        Matter.Body.setStatic(block, true); //make static
        // Composite.add(engine.world, block); //add to world
        if (simulation.isHorizontalFlipped) x *= -1
        return block
    },
    door(x, y, width, height, distance, speed = 1) {
        x = x + width / 2
        y = y + height / 2
        const doorBlock = body[body.length] = Bodies.rectangle(x, y, width, height, {
            collisionFilter: {
                category: cat.map,
                mask: cat.player | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet //cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet
            },
            isNoSetCollision: true,
            inertia: Infinity, //prevents rotation
            isNotHoldable: true,
            friction: 1,
            frictionStatic: 1,
            restitution: 0,
            isClosing: false,
            openClose() {
                if (!m.isBodiesAsleep) {
                    if (this.isClosing) {
                        if (this.position.y < y) { //try to close
                            if (
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
                ctx.fillStyle = "#555"
                ctx.beginPath();
                const v = this.vertices;
                ctx.moveTo(v[0].x, v[0].y);
                for (let i = 1; i < v.length; ++i) {
                    ctx.lineTo(v[i].x, v[i].y);
                }
                ctx.lineTo(v[0].x, v[0].y);
                ctx.fill();
            }
        });
        Matter.Body.setStatic(doorBlock, true); //make static
        return doorBlock
    },
    portal(centerA, angleA, centerB, angleB) {
        const width = 50
        const height = 150
        const mapWidth = 200
        const unitA = Matter.Vector.rotate({
            x: 1,
            y: 0
        }, angleA)
        const unitB = Matter.Vector.rotate({
            x: 1,
            y: 0
        }, angleB)

        draw = function() {
            ctx.beginPath(); //portal
            let v = this.vertices;
            ctx.moveTo(v[0].x, v[0].y);
            for (let i = 1; i < v.length; ++i) {
                ctx.lineTo(v[i].x, v[i].y);
            }
            ctx.fillStyle = this.color
            ctx.fill();
        }
        query = function(isRemoveBlocks = false) {
            if (Matter.Query.collides(this, [player]).length === 0) { //not touching player
                if (player.isInPortal === this) player.isInPortal = null
            } else if (player.isInPortal !== this) { //touching player
                if (m.buttonCD_jump === m.cycle) player.force.y = 0 // undo a jump right before entering the portal
                m.buttonCD_jump = 0 //disable short jumps when letting go of jump key
                player.isInPortal = this.portalPair
                //teleport
                if (this.portalPair.angle % (Math.PI / 2)) { //if left, right up or down
                    if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                    Matter.Body.setPosition(player, this.portalPair.portal.position);
                } else { //if at some odd angle
                    if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                    Matter.Body.setPosition(player, this.portalPair.position);
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
                // move bots to player
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType) {
                        // Matter.Body.setPosition(bullet[i], this.portalPair.portal.position);
                        Matter.Body.setPosition(bullet[i], Vector.add(this.portalPair.portal.position, {
                            x: 250 * (Math.random() - 0.5),
                            y: 250 * (Math.random() - 0.5)
                        }));
                        Matter.Body.setVelocity(bullet[i], {
                            x: 0,
                            y: 0
                        });
                    }
                }
            }
            // if (body.length) {
            for (let i = 0, len = body.length; i < len; i++) {
                if (body[i] !== m.holdingTarget) {
                    // body[i].bounds.max.x - body[i].bounds.min.x < 100 && body[i].bounds.max.y - body[i].bounds.min.y < 100
                    if (Matter.Query.collides(this, [body[i]]).length === 0) {
                        if (body[i].isInPortal === this) body[i].isInPortal = null
                    } else if (body[i].isInPortal !== this) { //touching this portal, but for the first time
                        if (isRemoveBlocks) {
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
                        if (this.portalPair.angle !== 0 && this.portalPair.angle !== Math.PI) { //portal that fires the player up
                            mag = Math.max(10, Math.min(50, body[i].velocity.y * 0.8)) + 11
                        } else {
                            mag = Math.max(6, Math.min(50, Vector.magnitude(body[i].velocity)))
                        }
                        let v = Vector.mult(this.portalPair.unit, mag)
                        Matter.Body.setVelocity(body[i], v);
                    }
                }
            }
            // }

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
            angle: angleA,
            color: "hsla(197, 100%, 50%,0.7)",
            draw: draw,
        });
        const portalB = composite[composite.length] = Bodies.rectangle(centerB.x, centerB.y, width, height, {
            isSensor: true,
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
                if (!m.isBodiesAsleep) {
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
    isHazardRise: false,
    hazard(x, y, width, height, damage = 0.003) {
        return {
            min: {
                x: x,
                y: y
            },
            max: {
                x: x + width,
                y: y + height
            },
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
                            m.damage(damage)
                            simulation.drawList.push({ //add dmg to draw queue
                                x: player.position.x,
                                y: player.position.y,
                                radius: damage * 1500,
                                color: simulation.mobDmgColor,
                                time: 20
                            });
                        }
                    }
                    //collision with mobs
                    if (!(simulation.cycle % 5) && !m.isBodiesAsleep) {
                        query = Matter.Query.region(mob, this)
                        for (let i = 0; i < query.length; i++) query[i].damage(5 * damage)
                    }

                    // for (let i = 0, len = mob.length; i < len; i++) {
                    //     if (  !mob[i].isBoss) {
                    //         mob[i].damage(0.1 * damage)
                    //     }
                    // }
                }
            },
            query() {
                if (this.isOn) {
                    ctx.fillStyle = "hsla(160, 100%, 35%,0.75)"
                    const offset = 5 * Math.sin(simulation.cycle * 0.015)
                    ctx.fillRect(this.min.x, this.min.y + offset, this.width, this.height - offset)

                    if (this.height > 0 && Matter.Query.region([player], this).length) {
                        if (m.immuneCycle < m.cycle) {
                            const DRAIN = 0.0032 * (tech.isRadioactiveResistance ? 0.25 : 1)
                            if (m.energy > DRAIN) {
                                m.energy -= DRAIN
                                // m.damage(damage * (tech.isRadioactiveResistance ? 0.25 : 1) * 0.03) //still take 2% damage while you have energy
                            } else {
                                m.damage(damage * (tech.isRadioactiveResistance ? 0.25 : 1))
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
                        powerUpCollide[i].force.y -= buoyancy * 1.14 * powerUpCollide[i].mass * simulation.g;
                        Matter.Body.setVelocity(powerUpCollide[i], {
                            x: powerUpCollide[i].velocity.x,
                            y: 0.96 * powerUpCollide[i].velocity.y
                        });
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
                if (this.height < this.maxHeight && !m.isBodiesAsleep) {
                    this.height += growRate
                    this.min.y -= growRate
                    this.max.y = this.min.y + this.height
                }
            },
            levelFall(fallRate = 1) {
                if (this.height > 0 && !m.isBodiesAsleep) {
                    this.height -= fallRate
                    this.min.y += fallRate
                    this.max.y = this.min.y + this.height
                }
            },
            level(isFill, growSpeed = 1) {
                if (!m.isBodiesAsleep) {
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
    //******************************************************************************************************************
    //******************************************************************************************************************
    //******************************************************************************************************************
    //******************************************************************************************************************
    labs() {
        level.isProcedural = true //used in generating text it the level builder
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
                level.setPosToSpawn(x + 1750, y - 800);
                spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
                spawn.mapRect(x + 1450, y - 1350, 50, 450); //entrance left wall
                spawn.bodyRect(x + 1460, y - 900, 30, 150); //entrance door
                spawn.mapRect(x + 1600, y - 350, 500, 100); //toggle shelf
                const toggle = level.toggle(x + 1650, y - 350, true) //(x,y,isOn,isLockOn = true/false)
                let hazard1
                if (Math.random() > 0.5) {
                    spawn.mapRect(x + 550, y - 750, 1500, 50); //entrance shelf
                    hazard1 = level.hazard(x + 850, y - 920, 600, 10, 0.4) //laser
                    spawn.mapRect(x + 860, y - 925, 10, 20); //laser nose
                    spawn.mapRect(x + 660, y - 975, 200, 120); //laser body
                } else {
                    spawn.mapRect(x + 1350, y - 750, 700, 50); //entrance shelf
                    hazard1 = level.hazard(x + 1040, y - 660, 1000, 10, 0.4) //laser
                    spawn.mapRect(x + 1050, y - 665, 10, 20); //laser nose
                    spawn.mapRect(x + 650, y - 705, 400, 100); //laser body
                }
                const hazard2 = level.hazard(x, y - 330, 450, 10, 0.4) //laser
                spawn.mapRect(x + 440, y - 335, 10, 20); //laser nose
                spawn.mapRect(x + 450, y - 375, 400, 100); //laser body
                //exit hazards
                const Xoffset = Math.floor(400 * Math.random())
                const hazard3 = level.hazard(x + Xoffset, y - 1300, 10, 1300, 0.4) //laser
                spawn.mapRect(x + Xoffset - 5, y - 1310, 20, 20); //laser nose
                const Xoffset2 = 1650 + Math.floor(300 * Math.random())
                const hazard4 = level.hazard(x + Xoffset2, y - 240, 10, 250, 0.4) //laser
                spawn.mapRect(x + Xoffset2 - 5, y - 250, 20, 20); //laser nose
                spawn.randomMob(x + 150, y + -1100, mobSpawnChance);
                spawn.randomMob(x + 175, y + -775, mobSpawnChance);
                spawn.randomMob(x + 150, y + -350, mobSpawnChance);
                spawn.randomMob(x + 150, y + -75, mobSpawnChance);
                spawn.randomMob(x + 650, y + -125, mobSpawnChance);
                spawn.randomMob(x + 1200, y + -75, mobSpawnChance);
                // let isSpawnedMobs = false
                doCustomTopLayer.push(
                    () => {
                        toggle.query();
                        hazard1.isOn = toggle.isOn
                        hazard2.isOn = toggle.isOn
                        hazard3.isOn = toggle.isOn
                        hazard4.isOn = toggle.isOn
                        if ((simulation.cycle % 120) > 60) {
                            hazard1.opticalQuery();
                            hazard2.opticalQuery();
                        } else {
                            hazard3.opticalQuery();
                            hazard4.opticalQuery();
                        }
                        // if (!isSpawnedMobs && !toggle.isOn) {
                        //     isSpawnedMobs = true
                        //     spawn.randomMob(x + 150, y + -1100, mobSpawnChance);
                        //     spawn.randomMob(x + 175, y + -775, mobSpawnChance);
                        //     spawn.randomMob(x + 150, y + -350, mobSpawnChance);
                        //     spawn.randomMob(x + 150, y + -75, mobSpawnChance);
                        //     spawn.randomMob(x + 650, y + -125, mobSpawnChance);
                        //     spawn.randomMob(x + 1200, y + -75, mobSpawnChance);
                        // }
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
                const density = 0.0015 //+ (simulation.difficultyMode < 5 ? 0.0035 : 0)
                const angle = Math.PI / 2
                const variance = 0 //Math.PI
                const frictionAir = 0.03
                const angularVelocity = 0 //0.01
                const spinVariance = 0 //0.02
                balance1 = level.spinner(x + 200, y - 500, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5)) //    spinner(x, y, width, height, density = 0.001, angle=0,frictionAir=0.001,angularVelocity=0) {
                balance2 = level.spinner(x + 200, y - 950, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))
                balance3 = level.spinner(x + 650, y - 750, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))
                // balance4 = level.spinner(x + 750, y - 1050, 25, 350, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))
                balance4 = level.spinner(x + 1250, y - 1000, 30, 400, density, angle + variance * (Math.random() - 0.5), frictionAir, angularVelocity + spinVariance * (Math.random() - 0.5))

                let isInRoom = false
                doCustom.push(
                    () => {
                        if (!isInRoom && m.pos.x > x - 100 && m.pos.x < x + 2700 && m.pos.y > y - 1300 && m.pos.y < y) { //check if player is in this room and run code once
                            isInRoom = true
                            spawn.randomMob(x + 1175, y - 725, mobSpawnChance);
                            spawn.randomMob(x + 1450, y - 725, mobSpawnChance);
                            spawn.randomMob(x + 425, y - 100, mobSpawnChance);
                            spawn.randomMob(x + 1700, y - 300, mobSpawnChance);
                            spawn.randomMob(x + 1300, y - 375, mobSpawnChance);
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
                    const density = 0.0012 //+ (simulation.difficultyMode < 5 ? 0.003 : 0)
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
                                spawn.randomMob(x + 1175, y - 725, mobSpawnChance);
                                spawn.randomMob(x + 1450, y - 725, mobSpawnChance);
                                spawn.randomMob(x + 425, y - 100, mobSpawnChance);
                                spawn.randomMob(x + 1200, y - 125, mobSpawnChance);
                                spawn.randomMob(x + 1300, y - 375, mobSpawnChance);
                            }
                            ctx.fillStyle = "#d4f4f4"
                            ctx.fillRect(x + 1600, y - 1300, 400, 350)
                            rotatingBlock.torque += rotatingBlock.inertia * 0.000005
                        }
                    )
                } else {
                    const density = 0.001 //+ (simulation.difficultyMode < 5 ? 0.003 : 0)
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
                                spawn.randomMob(x + 1175, y - 725, mobSpawnChance);
                                spawn.randomMob(x + 1450, y - 725, mobSpawnChance);
                                spawn.randomMob(x + 425, y - 100, mobSpawnChance);
                                spawn.randomMob(x + 1200, y - 125, mobSpawnChance);
                                spawn.randomMob(x + 1300, y - 375, mobSpawnChance);
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
                                b.pulse(90, Math.PI, { x: x + 2000 - 560, y: y - 150 })
                            }
                        }
                    )
                    spawn.randomMob(x + 2000 - 1600, y + -425, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 1725, y + -1250, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 1250, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 300, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 800, y + -125, mobSpawnChance);
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
                    spawn.randomMob(x + 1600, y + -425, mobSpawnChance);
                    spawn.randomMob(x + 1725, y + -1250, mobSpawnChance);
                    spawn.randomMob(x + 1250, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 300, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 800, y + -125, mobSpawnChance);
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
                                fireBlock = function(xPos, yPos) {
                                    const index = body.length
                                    spawn.bodyRect(xPos, yPos, 35 + 50 * Math.random(), 35 + 50 * Math.random());
                                    const bodyBullet = body[body.length - 1]
                                    Matter.Body.setVelocity(body[index], {
                                        x: -120,
                                        y: -5
                                    });
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
                    spawn.randomMob(x + 2000 - 1600, y + -425, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 1725, y + -1250, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 1250, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 300, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 800, y + -125, mobSpawnChance);
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
                                fireBlock = function(xPos, yPos) {
                                    const index = body.length
                                    spawn.bodyRect(xPos, yPos, 35 + 50 * Math.random(), 35 + 50 * Math.random());
                                    const bodyBullet = body[body.length - 1]
                                    Matter.Body.setVelocity(body[index], {
                                        x: 120,
                                        y: -5
                                    });
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
                    spawn.randomMob(x + 1600, y + -425, mobSpawnChance);
                    spawn.randomMob(x + 1725, y + -1250, mobSpawnChance);
                    spawn.randomMob(x + 1250, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 300, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 800, y + -125, mobSpawnChance);
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
                    spawn.randomMob(x + 2000 - 1600, y + -425, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 1725, y + -1250, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 1250, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 300, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 2000 - 800, y + -125, mobSpawnChance);
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
                    spawn.randomMob(x + 1600, y + -425, mobSpawnChance);
                    spawn.randomMob(x + 1725, y + -1250, mobSpawnChance);
                    spawn.randomMob(x + 1250, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 300, y + -1200, mobSpawnChance);
                    spawn.randomMob(x + 800, y + -125, mobSpawnChance);
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
                    powerUps.directSpawn(x + 998, y - 333 - 640, "tech", false);
                    spawn.mapVertex(x + 1000, y + -0, "575 0  -575 0  -450 -100  450 -100"); //base
                } else { //lower chamber
                    spawn.mapRect(x + 400, y + -10, 1200, 50); //raised floor 
                    spawn.mapRect(x + 450, y + -20, 1100, 50);
                    spawn.mapRect(x + 450, y + -675, 1100, 25); //chamber ceiling
                    spawn.mapRect(x + 550, y + -685, 900, 25);
                    powerUps.directSpawn(x + 998, y - 333, "tech", false);
                }
                const powerUp1 = powerUp[powerUp.length - 1]
                powerUp1.holdPosition = { x: powerUp1.position.x, y: powerUp1.position.y }
                let isSpawnedMobs = false
                doCustom.push(
                    () => {
                        ctx.fillStyle = "#e4e4e9" //"rgba(255,255,255,1)";
                        ctx.fillRect(x + 450, y + chamberY, 1100, 650); //chamber background
                        // if (!isInRoom && m.pos.x > x - 100 && m.pos.x < x + 2000 && m.pos.y > y - 1300 && m.pos.y < y) { //is player inside this room?
                        //     isInRoom = true
                        // } else 
                        if (powerUp1.velocity.y !== 0) { //don't run this code if power up is gone //hack:  powerUp1.velocity.y !== 0 seems to only be true if the power up up doesn't exist and is no longer being affected by gravity
                            ctx.strokeStyle = "#f0f"
                            ctx.lineWidth = 2;
                            if (Vector.magnitudeSquared(Vector.sub(m.pos, powerUp1.position)) < 90000) { //zone radius is 300
                                //damage player and drain energy
                                if (m.immuneCycle < m.cycle) {
                                    m.damage(0.01);
                                    if (m.energy > 0.1) m.energy -= 0.02
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
                            Matter.Body.setVelocity(powerUp1, {
                                x: 0,
                                y: 0
                            });
                        } else if (!isSpawnedMobs) {
                            isSpawnedMobs = true
                            if (chamberY === -650) { //lower chamber
                                spawn.randomMob(x + 250, y + -650, mobSpawnChance);
                                spawn.randomMob(x + 1825, y + -600, mobSpawnChance);
                                spawn.randomGroup(x + 275, y + -1050, mobSpawnChance);
                                spawn.randomGroup(x + 675, y + -975, mobSpawnChance);
                                spawn.randomGroup(x + 1225, y + -975, Infinity);
                            } else { //upper chamber
                                spawn.randomMob(x + 250, y + -650, mobSpawnChance);
                                spawn.randomMob(x + 1800, y + -625, mobSpawnChance);
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
            // (x = offset.x, y = offset.y) => {
            //     // spawn.mapVertex(x + 5, y + -1318, "0 0  0 -250  125 -250"); //left ledges
            //     // spawn.mapVertex(x + 1995, y + -1318, "0 0  0 -250  -125 -250"); // right ledges

            //     let r = 150
            //     const hexagon = `${r} 0   ${r*Math.cos(5.236)} ${r*Math.sin(5.236)}    ${r*Math.cos(4.189)} ${r*Math.sin(4.189)}     ${-r} 0     ${r*Math.cos(2.0944)} ${r*Math.sin(2.0944)}      ${r*Math.cos(1.0472)} ${r*Math.sin(1.0472)}  `
            //     //450 horizontal spread //  -130-130-130 = 390 vertical


            //     let xOff = 100 + 225
            //     spawn.mapVertex(x + xOff + 0 * 450, y + -260 - 0 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -260 - 0 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -260 - 0 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -260 - 0 * 390, hexagon);

            //     xOff = 100
            //     // spawn.mapVertex(x + xOff + 0 * 450, y + 1 * -260 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -260 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -260 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -260 - 1 * 390, hexagon);
            //     // spawn.mapVertex(x + xOff + 4 * 450, y + 1 * -260 - 1 * 390, hexagon);

            //     xOff = 100 + 225
            //     spawn.mapVertex(x + xOff + 0 * 450, y + -260 - 2 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -260 - 2 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -260 - 2 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -260 - 2 * 390, hexagon);

            //     xOff = 100
            //     // spawn.mapVertex(x + xOff + 0 * 450, y + 1 * -260 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -260 - 3 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -260 - 3 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -260 - 3 * 390, hexagon);
            //     // spawn.mapVertex(x + xOff + 4 * 450, y + 1 * -260 - 1 * 390, hexagon);

            //     xOff = 100 + 225
            //     spawn.mapVertex(x + xOff + 0 * 450, y + -260 - 4 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -260 - 4 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -260 - 4 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -260 - 4 * 390, hexagon);


            //     //phase 2
            //     xOff = 100
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -130 - 0 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -130 - 0 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -130 - 0 * 390, hexagon);

            //     xOff = 100 + 225
            //     spawn.mapVertex(x + xOff + 0 * 450, y + -130 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -130 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -130 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -130 - 1 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 4 * 450, y + -130 - 1 * 390, hexagon);
            //     xOff = 100
            //     spawn.mapVertex(x + xOff + 1 * 450, y + -130 - 2 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 2 * 450, y + -130 - 2 * 390, hexagon);
            //     spawn.mapVertex(x + xOff + 3 * 450, y + -130 - 2 * 390, hexagon);

            //     // spawn.mapVertex(x + 550, y + 1 * -260, hexagon);
            //     // spawn.mapVertex(x + 550, y + 2 * -260, hexagon);
            //     // spawn.mapVertex(x + 550, y + 3 * -260, hexagon);
            //     // spawn.mapVertex(x + 550, y + 5 * -260, hexagon);
            //     // spawn.mapVertex(x + 550, y + 4 * -260, hexagon);

            //     // spawn.mapVertex(x + 775, y + -260, hexagon);
            //     // spawn.mapVertex(x + 1225, y + -260, hexagon);

            //     // spawn.mapVertex(x + 550, y + -650, hexagon);
            //     // spawn.mapVertex(x + 1000, y + -650, hexagon);
            //     // spawn.mapVertex(x + 1450, y + -650, hexagon);

            //     // spawn.mapVertex(x + 775, y + -1040, hexagon);
            //     // spawn.mapVertex(x + 1225, y + -1040, hexagon);

            //     // spawn.mapVertex(x + 550, y + -1430, hexagon);
            //     // spawn.mapVertex(x + 1000, y + -1430, hexagon);
            //     // spawn.mapVertex(x + 1450, y + -1430, hexagon);

            //     // spawn.mapVertex(x + 775, y + -1820, hexagon);
            //     // spawn.mapVertex(x + 1225, y + -1820, hexagon);

            //     let count = 0
            //     doCustomTopLayer.push(
            //         () => {



            //             if (!(count % 60)) {
            //                 addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the the elements so they show up visually
            //                     who.collisionFilter.category = cat.map;
            //                     who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
            //                     Matter.Body.setStatic(who, true); //make static
            //                     Composite.add(engine.world, who); //add to world
            //                 }
            //                 const numberOfMapElementsAdded = 0
            //                 for (let i = 0; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])

            //                 simulation.draw.setPaths() //update map graphics
            //             }
            //         })
            //     spawn.randomMob(x + 225, y + -1025, mobSpawnChance);
            //     spawn.randomMob(x + 200, y + -675, mobSpawnChance);
            //     spawn.randomMob(x + 225, y + -200, mobSpawnChance);
            //     spawn.randomMob(x + 1750, y + -1075, mobSpawnChance);
            //     spawn.randomMob(x + 1700, y + -650, mobSpawnChance);
            //     spawn.randomMob(x + 1675, y + -175, mobSpawnChance);

            //     spawn.randomGroup(x + 300, y + -2200);
            //     spawn.randomGroup(x + 1625, y + -2200);
            //     spawn.randomLevelBoss(x + 950, y + -2200);

            // },
            // (x = offset.x, y = offset.y) => { //hopBoss1
            //     const button = level.button(x + 935, y + 0)
            //     button.isUp = true
            //     // spawn.mapVertex(x + 5, y + -1318, "0 0  0 -250  125 -250"); //left ledges
            //     // spawn.mapVertex(x + 1995, y + -1318, "0 0  0 -250  -125 -250"); // right ledges
            //     doCustomTopLayer.push(
            //         () => {
            //             button.draw();
            //             if (button.isUp) {
            //                 button.query();
            //                 if (!button.isUp) {
            //                     // doCustomTopLayer.push(() => {
            //                     //     ctx.fillStyle = "rgba(150,255,220,0.15)"
            //                     //     ctx.fillRect(x + 250, y + -2725, 625, 725)
            //                     // })
            //                     const mapStartingLength = map.length //track this so you know how many you added when running addMapToLevelInProgress
            //                     addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the the elements so they show up visually
            //                         who.collisionFilter.category = cat.map;
            //                         who.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
            //                         Matter.Body.setStatic(who, true); //make static
            //                         Composite.add(engine.world, who); //add to world
            //                     }
            //                     //map elements go here
            //                     // spawn.mapRect(x + -50, y + -1875, 875, 200);
            //                     // spawn.mapRect(x + 650, y + -2700, 125, 625);
            //                     // spawn.mapRect(x + 1200, y + -2250, 250, 25);

            //                     spawn.mapRect(x + -25, y + -1875, 1250, 200);
            //                     // spawn.mapRect(x + 1075, y + -2700, 100, 650);
            //                     spawn.mapRect(x + 1325, y + -1875, 475, 200);
            //                     // spawn.mapRect(x + 1900, y + -1600, 125, 25);
            //                     // spawn.mapRect(x + 900, y + -1875, 325, 25);
            //                     // spawn.mapRect(x + 1375, y + -1875, 350, 25);

            //                     // spawn.mapRect(x + 675, y + -2725, 50, 650);
            //                     spawn.mapRect(x + 1900, y + -1675, 125, 25);
            //                     spawn.mapRect(x + 1700, y + -1400, 325, 25);
            //                     spawn.mapRect(x + -50, y + -1400, 325, 25);


            //                     spawn.mapRect(x + -25, y + -700, 500, 25);
            //                     spawn.mapRect(x + 675, y + -700, 600, 25);
            //                     spawn.mapRect(x + 1475, y + -700, 500, 25);

            //                     spawn.mapRect(x + 475, y + -1025, 200, 25);
            //                     spawn.mapRect(x + 1275, y + -1025, 200, 25);
            //                     spawn.mapRect(x + 475, y + -300, 200, 25);
            //                     spawn.mapRect(x + 1275, y + -300, 200, 25);


            //                     for (let i = 0, numberOfMapElementsAdded = map.length - mapStartingLength; i < numberOfMapElementsAdded; i++) addMapToLevelInProgress(map[map.length - 1 - i])
            //                     simulation.draw.setPaths() //update map graphics
            //                     //mobs go here
            //                     powerUps.directSpawn(x + 50, y - 1525, "ammo");
            //                     powerUps.directSpawn(x + 1950, y - 1525, "ammo");
            //                     spawn.hopMomBoss(x + 550, y + -2325)
            //                     for (let i = 0; i < 20; ++i) spawn.hopBullet(x + 50 + 1900 * Math.random(), y + -2325)
            //                     // spawn.hopper(x + 1500, y + -775);
            //                     // spawn.hopper(x + 525, y + -775);
            //                 }
            //             }
            //         }
            //     )
            // },
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
                                addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the the elements so they show up visually
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
                                powerUps.directSpawn(x + 50, y - 1525, "ammo");
                                powerUps.directSpawn(x + 1950, y - 1525, "ammo");
                                spawn.hopMomBoss(x + 800, y + -2200)
                                for (let i = 0; i < 10; ++i) spawn.hopBullet(x + 150 + 750 * Math.random(), y + -1600)
                                for (let i = 0; i < 10; ++i) spawn.hopBullet(x + 1100 + 750 * Math.random(), y + -1600)
                                spawn.hopper(x + 1500, y + -775);
                                spawn.hopper(x + 525, y + -775);
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
                                addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the the elements so they show up visually
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
                                    spawn.randomMob(x + 225, y + -1775, mobSpawnChance);
                                    spawn.randomMob(x + 700, y + -1750, mobSpawnChance);
                                    spawn.randomMob(x + 1175, y + -1725, mobSpawnChance);
                                    spawn.randomMob(x + 1700, y + -1700, mobSpawnChance);
                                    spawn.randomMob(x + 1750, y + -250, mobSpawnChance);
                                    spawn.randomMob(x + 125, y + -250, mobSpawnChance);
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

                                    spawn.randomMob(x + 225, y + -1025, mobSpawnChance);
                                    spawn.randomMob(x + 200, y + -675, mobSpawnChance);
                                    spawn.randomMob(x + 225, y + -200, mobSpawnChance);
                                    spawn.randomMob(x + 1750, y + -1075, mobSpawnChance);
                                    spawn.randomMob(x + 1700, y + -650, mobSpawnChance);
                                    spawn.randomMob(x + 1675, y + -175, mobSpawnChance);
                                }
                                simulation.draw.setPaths() //update map graphics
                                spawn.randomGroup(x + 300, y + -2200);
                                spawn.randomGroup(x + 1625, y + -2200);
                                spawn.randomLevelBoss(x + 700, y + -2300);
                                spawn.secondaryBossChance(x + 1250, y + -2300)
                            }
                        }
                        // toggle.query();
                        // if (toggle.isOn && !toggle.isAddedElements) { //this code runs once after the toggle is triggered

                        // }
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
                                addMapToLevelInProgress = (who) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the the elements so they show up visually
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

                                spawn.randomMob(x + 1075, y + -1500, mobSpawnChance);
                                spawn.randomMob(x + 325, y + -550, mobSpawnChance);
                                spawn.randomMob(x + 800, y + -925, mobSpawnChance);
                                spawn.randomMob(x + 1400, y + -1250, mobSpawnChance);
                                spawn.randomMob(x + 1350, y + -1725, mobSpawnChance);
                                spawn.randomMob(x + 575, y + -1375, mobSpawnChance);
                                spawn.randomMob(x + 225, y + -2275, mobSpawnChance);
                                spawn.randomMob(x + 875, y + -2450, mobSpawnChance);
                                spawn.randomMob(x + 1550, y + -2525, mobSpawnChance);
                                spawn.randomLevelBoss(x + 1075, y + -1500);
                                spawn.secondaryBossChance(x + 1200, y + -1000)
                                simulation.draw.setPaths() //update map graphics
                            }
                        }
                    }
                )
            },
            // (x = offset.x, y = offset.y) => {
            //     const elevator1 = level.elevator(x + 1100, y - 200, 250, 30, -2100, 0.0015) // x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }, isTeleport = false) {
            //     // const elevator1 = level.elevator(x + 175, y - 200, 250, 30, -1400, 0.001) 
            //     // const elevator2 = level.elevator(x + 2175, y - 200, 250, 30, -1400, 0.001)

            //     spawn.mapRect(-200, -1400, 350, 50); //up left door ledge
            //     spawn.mapRect(2450, -1400, 350, 50); //up right door ledge

            //     spawn.mapRect(225, -450, 350, 350); //left crawl zone
            //     // spawn.mapRect(725, -175, 275, 75);
            //     spawn.mapRect(725, -225, 350, 100);
            //     spawn.mapRect(275, -750, 200, 200);
            //     spawn.mapRect(1375, -700, 500, 750); //right side big elevator wall
            //     spawn.mapRect(2375, -325, 350, 50);
            //     spawn.mapRect(1800, -500, 250, 50);

            //     //up high elevator
            //     spawn.mapRect(1375, -2100, 500, 175);
            //     spawn.mapRect(600, -2100, 475, 175);

            //     if (simulation.difficulty > 3) spawn.randomLevelBoss(x + 1250, y - 1400);
            //     doCustomTopLayer.push(
            //         () => {
            //             elevator1.move()
            //         }
            //     )
            // }
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
        rooms = shuffle(rooms); //shuffles array order
        //look... you and I both know there is a better way to do this, but it works so I'm gonna focus on other things
        while ( //makes sure that the exit and entrance aren't both on the same floor
            (rooms[0] === "enter" && rooms[2] === "exit") ||
            (rooms[2] === "enter" && rooms[0] === "exit") ||
            (rooms[1] === "enter" && rooms[3] === "exit") ||
            (rooms[3] === "enter" && rooms[1] === "exit")
        ) rooms = shuffle(rooms); //shuffles array order
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
        columns = shuffle(columns) //********************************* RUN THIS LINE IN THE FINAL VERSION ***************************************
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
        level.custom = () => {
            for (let i = 0, len = doCustom.length; i < len; i++) doCustom[i]() //runs all the active code from each room
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            for (let i = 0, len = doCustomTopLayer.length; i < len; i++) doCustomTopLayer[i]() //runs all the active code from each room
        };
        powerUps.addResearchToLevel() //needs to run after mobs are spawned

        // level.setPosToSpawn(850, -40); //********************************* DO   !NOT!  RUN THIS LINE IN THE FINAL VERSION ***************************************
    },
    null() {
        level.levels.pop(); //remove lore level from rotation
        // level.onLevel--
        // console.log(level.onLevel, level.levels)
        //start a conversation based on the number of conversations seen
        if (localSettings.loreCount < lore.conversation.length && !simulation.isCheating) {
            lore.testSpeechAPI() //see if speech is working
            lore.chapter = localSettings.loreCount //set the chapter to listen to to be the lore level (you can't use the lore level because it changes during conversations)
            lore.sentence = 0 //what part of the conversation to start on
            lore.conversation[lore.chapter][lore.sentence]()
            localSettings.loreCount++ //hear the next conversation next time you win
            if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        }
        // const hazardSlime = level.hazard(-1800, 150, 3600, 650, 0.004, "hsla(160, 100%, 35%,0.75)")
        level.isHazardRise = false //this is set to true to make the slime rise up
        const hazardSlime = level.hazard(-1800, -800, 3600, 1600, 0.004, "hsla(160, 100%, 35%,0.75)")
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
        let sway = { x: 0, y: 0 }
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
        color.map = "#808f8f"

        spawn.mapRect(-3000, 800, 5000, 1200); //bottom
        spawn.mapRect(-2000, -2000, 5000, 1200); //ceiling
        spawn.mapRect(-3000, -2000, 1200, 3400); //left
        spawn.mapRect(1800, -1400, 1200, 3400); //right

        spawn.mapRect(-500, 0, 1000, 50); //center platform
        spawn.mapRect(-500, -25, 25, 50); //edge shelf
        spawn.mapRect(475, -25, 25, 50); //edge shelf
    },
    testing() {
        // const hazard = level.hazard(6000, -1000, 5, 1000, 0.4) //laser
        const button = level.button(1000, 0)
        spawn.bodyRect(1000, -50, 50, 50);

        level.custom = () => {
            ctx.fillStyle = "#d4d4d4"
            ctx.fillRect(2500, -475, 200, 300)

            ctx.fillStyle = "rgba(0,255,255,0.1)";
            ctx.fillRect(6400, -550, 300, 350);
            level.exit.drawAndCheck();
            level.enter.draw();
        };
        level.customTopLayer = () => {
            // hazard.opticalQuery();
            button.query();
            button.draw();
            ctx.fillStyle = "rgba(0,0,0,0.1)"
            ctx.fillRect(-150, -650, 900, 250)
        };
        level.setPosToSpawn(0, -450); //normal spawn
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.exit.x = 6500;
        level.exit.y = -230;

        // level.difficultyIncrease(14); //hard mode level 7
        level.defaultZoom = 1500
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#ddd";
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
        spawn.mapRect(2500, -200, 200, 300); //right wall
        spawn.mapRect(4500, -1200, 200, 650); //right wall
        blockDoor(4585, -310)
        spawn.mapRect(4500, -300, 200, 400); //right wall
        spawn.mapRect(6400, -1200, 400, 750); //right wall
        spawn.mapRect(6400, -200, 400, 300); //right wall
        spawn.mapRect(6700, -1800, 800, 2600); //right wall
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump
        //place to hide
        spawn.mapRect(4650, -300, 1150, 50);
        spawn.mapRect(5750, -300, 50, 200);
        spawn.mapRect(5575, -100, 50, 125);
        spawn.mapRect(5300, -275, 50, 175);
        spawn.mapRect(5050, -100, 50, 150);
        spawn.mapRect(4850, -275, 50, 175);
        spawn.mapRect(-950, -3250, 850, 1750);
        //roof
        spawn.mapRect(-175, -2975, 300, 1425);
        spawn.mapRect(75, -2650, 325, 1150);
        spawn.mapRect(375, -2225, 250, 650);
        spawn.mapRect(4075, -2125, 700, 800);
        spawn.mapRect(4450, -2950, 675, 1550);
        spawn.mapRect(4875, -3625, 725, 2225);
        spawn.mapRect(5525, -4350, 1725, 2925);
        spawn.mapRect(7200, -5125, 300, 3900);


        //???
        // level.difficultyIncrease(30) //30 is near max on hard  //60 is near max on why
        m.addHealth(Infinity)

        // spawn.starter(1900, -500, 200) //big boy
        // for (let i = 0; i < 10; ++i) spawn.launcher(1900, -500)
        // spawn.slashBoss(1900, -500)
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
    reactor() {
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
        spawn.mapVertex(1487, -900, `${-a} ${-a+c}  ${-a+c} ${-a}   ${a-c} ${-a}  ${a} ${-a+c}   ${a} ${a-c}  ${a-c} ${a}  ${-a+c} ${a}  ${-a} ${a-c}`); //square with edges cut off
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
        // doorOut.isClosing = true
        let isDoorsLocked = false
        let isFightOver = false
        let isSpawnedBoss = false

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
            level.setPosToSpawn(550, -800); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

            const button = level.button(-1500, 0)
            button.isUp = true

            level.custom = () => {
                if (isDoorsLocked) {
                    if (player.position.x > 300) { //if player gets trapped inside starting room open up again
                        isDoorsLocked = false
                        doorIn.isClosing = false
                    }
                }
                doorIn.openClose();
                doorOut.openClose();
                ctx.fillStyle = "#d5ebef"
                ctx.fillRect(-3800, -375, 1050, 375)
                level.enter.draw();
                level.exit.drawAndCheck();
                button.draw();
                if (button.isUp) {
                    button.query();
                } else if (!isSpawnedBoss) {
                    if (player.position.x < 0) {
                        if (!doorOut.isClosed() || !doorIn.isClosed()) {
                            doorIn.isClosing = true
                            doorOut.isClosing = true
                        } else {
                            isSpawnedBoss = true
                            isDoorsLocked = true
                            for (let i = 0; i < 9; ++i) powerUps.spawn(-1800 + 550 * Math.random(), -1700, "ammo")
                            for (let i = 0; i < 3; ++i) powerUps.spawn(-1800 + 550 * Math.random(), -1700, "heal");
                            const scale = Math.pow(simulation.difficulty, 0.7) //hard around 30, why around 54
                            if (Math.random() < 0.07 && simulation.difficulty > 35) {
                                for (let i = 0, len = scale * 0.25 / 6; i < len; ++i) spawn.timeBoss(-1327 - 200 * i, -1525, 60, false); //spawn 1-2 at difficulty 15 
                                for (let i = 0, len = scale * 0.1 / 6; i < len; ++i) spawn.bounceBoss(-1327 - 200 * i, -1525, 80, false);
                                for (let i = 0, len = scale * 0.15 / 6; i < len; ++i) spawn.sprayBoss(-1327 - 200 * i, -1525, 30, false)
                                for (let i = 0, len = scale * 0.26 / 6; i < len; ++i) spawn.mineBoss(-1327 - 200 * i, -1525, 50, false);
                            } else {
                                if (Math.random() < 0.25) {
                                    for (let i = 0, len = scale * 0.25; i < len; ++i) spawn.timeBoss(-1327 - 200 * i, -1525, 80, false); //spawn 1-2 at difficulty 15 
                                } else if (Math.random() < 0.33) {
                                    for (let i = 0, len = scale * 0.1; i < len; ++i) spawn.bounceBoss(-1327 - 200 * i, -1525, 80, false); //spawn 1-2 at difficulty 15 
                                } else if (Math.random() < 0.5) {
                                    for (let i = 0, len = scale * 0.15; i < len; ++i) spawn.sprayBoss(-1327 - 200 * i, -1525, 30, false) //spawn 2-3 at difficulty 15 
                                } else {
                                    for (let i = 0, len = scale * 0.26; i < len; ++i) spawn.mineBoss(-1327 - 200 * i, -1525, 50, false); //spawn 3-4 at difficulty 15 
                                }
                            }
                            spawn.secondaryBossChance(-2300, -800)
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
                        powerUps.spawnBossPowerUp(-3600, -100)
                        powerUps.spawn(-3650, -200, "tech")
                        // if (player.position.x < 2760 && player.position.x > 210) {}
                    }
                }
            };

            level.customTopLayer = () => {
                doorIn.draw();
                doorOut.draw();
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(-225, -1100, 1000, 350);
            };
        } else {
            level.setPosToSpawn(-550, -800); //normal spawn
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

            const button = level.button(1400, 0)
            button.isUp = true

            level.custom = () => {
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
                        } else {
                            isSpawnedBoss = true
                            isDoorsLocked = true
                            for (let i = 0; i < 9; ++i) powerUps.spawn(1200 + 550 * Math.random(), -1700, "ammo")
                            for (let i = 0; i < 3; ++i) powerUps.spawn(1200 + 550 * Math.random(), -1700, "heal");
                            const scale = Math.pow(simulation.difficulty, 0.7) //hard around 30, why around 54
                            if (Math.random() < 0.07 && simulation.difficulty > 35) {
                                for (let i = 0, len = scale * 0.25 / 6; i < len; ++i) spawn.timeBoss(1487 + 200 * i, -1525, 60, false); //spawn 1-2 at difficulty 15 
                                for (let i = 0, len = scale * 0.1 / 6; i < len; ++i) spawn.bounceBoss(1487 + 200 * i, -1525, 80, false);
                                for (let i = 0, len = scale * 0.15 / 6; i < len; ++i) spawn.sprayBoss(1487 + 200 * i, -1525, 30, false)
                                for (let i = 0, len = scale * 0.26 / 6; i < len; ++i) spawn.mineBoss(1487 + 200 * i, -1525, 50, false);
                            } else {
                                if (Math.random() < 0.25) {
                                    for (let i = 0, len = scale * 0.25; i < len; ++i) spawn.timeBoss(1487 + 200 * i, -1525, 80, false); //spawn 1-2 at difficulty 15 
                                } else if (Math.random() < 0.33) {
                                    for (let i = 0, len = scale * 0.1; i < len; ++i) spawn.bounceBoss(1487 + 200 * i, -1525, 80, false); //spawn 1-2 at difficulty 15 
                                } else if (Math.random() < 0.5) {
                                    for (let i = 0, len = scale * 0.15; i < len; ++i) spawn.sprayBoss(1487 + 200 * i, -1525, 30, false) //spawn 2-3 at difficulty 15 
                                } else {
                                    for (let i = 0, len = scale * 0.26; i < len; ++i) spawn.mineBoss(1487 + 200 * i, -1525, 50, false); //spawn 3-4 at difficulty 15 
                                }
                            }
                            spawn.secondaryBossChance(2200, -800)
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
                        powerUps.spawnBossPowerUp(3600, -100)
                        powerUps.spawn(3650, -200, "tech")
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
        }

        // if (simulation.difficulty > 1) spawn.randomLevelBoss(2200, -1300);
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
    },
    template() {
        level.custom = () => {
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {};
        level.setPosToSpawn(0, -50); //normal spawn
        level.exit.x = 1500;
        level.exit.y = -1875;
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.defaultZoom = 1800
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#d8dadf";
        // powerUps.spawnStartingPowerUps(1475, -1175);
        // spawn.debris(750, -2200, 3700, 16); //16 debris per level

        spawn.mapRect(-100, 0, 1000, 100);
        // spawn.bodyRect(1540, -1110, 300, 25, 0.9); 
        // spawn.randomSmallMob(1300, -70);
        // spawn.randomMob(2650, -975, 0.8);
        // spawn.randomGroup(1700, -900, 0.4);
        // if (simulation.difficulty > 1) spawn.randomLevelBoss(2200, -1300);
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
    },
    final() {
        level.custom = () => {
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            ctx.fillStyle = "rgba(0,255,255,0.1)"
            ctx.fillRect(5400, -550, 300, 350)
        };

        level.setPosToSpawn(0, -250); //normal spawn
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        spawn.mapRect(5500, -330 + 20, 100, 20); //spawn this because the real exit is in the wrong spot
        level.exit.x = 0;
        level.exit.y = -8000;

        level.defaultZoom = 2500
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#ddd";

        powerUps.spawn(1675, -50, "ammo");
        powerUps.spawn(3350, -75, "ammo");
        powerUps.spawn(3925, -50, "ammo");
        powerUps.spawn(4250, -75, "ammo");
        powerUps.spawn(4550, -75, "ammo");
        powerUps.spawn(5025, -50, "ammo");
        powerUps.spawn(4725, -50, "ammo");
        powerUps.spawn(4975, -350, "ammo");
        powerUps.spawn(5125, -350, "ammo");
        powerUps.spawn(5075, -425, "ammo");
        powerUps.spawn(5050, -400, "ammo");
        powerUps.spawn(5075, -425, "ammo");

        spawn.mapRect(-1950, 0, 8200, 1800); //ground
        spawn.mapRect(-1950, -1500, 1800, 1900); //left wall
        spawn.mapRect(-1950, -3300, 8200, 1800); //roof
        spawn.mapRect(-250, -200, 1000, 300); // shelf
        spawn.mapRect(-250, -1700, 1000, 1250); // shelf roof
        spawn.blockDoor(710, -210);

        spawn.finalBoss(3000, -750)

        spawn.mapRect(5400, -1700, 400, 1150); //right wall
        spawn.mapRect(5400, -300, 400, 400); //right wall
        spawn.mapRect(5700, -3300, 1800, 5100); //right wall
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump
        spawn.mapRect(5425, -650, 375, 450); //blocking exit
        // spawn.secondaryBossChance(4800, -500) //no bonus bosses on final level

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

            level.setPosToSpawn(0, -250);
            level.custom = () => {
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,255,255,0.1)"
                ctx.fillRect(-5400 - 300, -550, 300, 350)
            };
        }
    },
    gauntlet() {
        level.custom = () => {
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            ctx.fillStyle = "rgba(0,255,255,0.1)"
            ctx.fillRect(6400, -550, 300, 350)
            ctx.fillStyle = "rgba(0,0,0,0.1)"
            ctx.fillRect(-175, -975, 900, 575)
        };
        level.setPosToSpawn(0, -475); //normal spawn
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.exit.x = 6500;
        level.exit.y = -230;
        level.defaultZoom = 1500
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#ddd";

        // spawn.mapRect(-300, -1050, 300, 200);
        // Matter.Body.setAngle(map[map.length - 1], -Math.PI / 4)


        spawn.mapRect(-950, 0, 8200, 800); //ground
        spawn.mapRect(-950, -1200, 800, 1400); //left wall
        spawn.mapRect(-950, -1800, 8200, 800); //roof
        spawn.mapRect(175, -700, 575, 950);
        spawn.mapRect(-250, -425, 600, 650);
        spawn.mapRect(-250, -1200, 1000, 250); // shelf roof
        powerUps.spawnStartingPowerUps(600, -800);
        spawn.blockDoor(710, -710);
        spawn[spawn.pickList[0]](1500, -200, 150 + Math.random() * 30);
        spawn.mapRect(2500, -1200, 200, 750); //right wall
        spawn.blockDoor(2585, -210)
        spawn.mapRect(2500, -200, 200, 300); //right wall

        spawn.nodeGroup(3500, -200, spawn.allowedGroupList[Math.floor(Math.random() * spawn.allowedGroupList.length)]);
        spawn.mapRect(4500, -1200, 200, 750); //right wall
        spawn.blockDoor(4585, -210)
        spawn.mapRect(4500, -200, 200, 300); //right wall

        spawn.lineGroup(5000, -200, spawn.allowedGroupList[Math.floor(Math.random() * spawn.allowedGroupList.length)]);
        spawn.mapRect(6400, -1200, 400, 750); //right wall
        spawn.mapRect(6400, -200, 400, 300); //right wall
        spawn.mapRect(6700, -1800, 800, 2600); //right wall
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump
        for (let i = 0; i < 3; ++i) {
            if (simulation.difficulty * Math.random() > 15 * i) spawn.randomGroup(2000 + 500 * (Math.random() - 0.5), -800 + 200 * (Math.random() - 0.5), Infinity);
            if (simulation.difficulty * Math.random() > 10 * i) spawn.randomGroup(3500 + 500 * (Math.random() - 0.5), -800 + 200 * (Math.random() - 0.5), Infinity);
            if (simulation.difficulty * Math.random() > 7 * i) spawn.randomGroup(5000 + 500 * (Math.random() - 0.5), -800 + 200 * (Math.random() - 0.5), Infinity);
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(4125, -350)

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
            level.setPosToSpawn(0, -475);
            level.custom = () => {
                level.exit.drawAndCheck();

                level.enter.draw();
            };
            level.customTopLayer = () => {
                ctx.fillStyle = "rgba(0,255,255,0.1)"
                ctx.fillRect(-6400 - 300, -550, 300, 350)
                ctx.fillStyle = "rgba(0,0,0,0.1)"
                ctx.fillRect(175 - 900, -975, 900, 575)
            };
        }
    },
    intro() {
        if (level.levelsCleared === 0) { //if this is the 1st level of the game
            //wait to spawn power ups until unpaused
            //power ups don't spawn in experiment mode, so they don't get removed at the start of experiment mode
            function cycle() {
                if (simulation.cycle > 10) {
                    // powerUps.spawn(2500, -50, "research", false);
                    powerUps.spawn(2095 + 15 * (Math.random() - 0.5), -2070, "research", false);
                    powerUps.spawn(2095 + 15 * (Math.random() - 0.5), -2070 - 25, "heal", false);
                    powerUps.spawn(2095 + 15 * (Math.random() - 0.5), -2070 - 75, "heal", false);
                    powerUps.spawnStartingPowerUps(2095 + 15 * (Math.random() - 0.5), -2070 - 125);
                } else {
                    requestAnimationFrame(cycle);
                }
            }
            requestAnimationFrame(cycle);

            if (localSettings.levelsClearedLastGame < 3) {
                if (!simulation.isCheating && !m.isShipMode && !build.isExperimentRun) {
                    spawn.wireFoot();
                    spawn.wireFootLeft();
                    spawn.wireKnee();
                    spawn.wireKneeLeft();
                    spawn.wireHead();
                    // for (let i = 0; i < 3; i++) powerUps.spawn(2095, -1220 - 50 * i, "tech", false); //unavailable tech spawns
                    // spawn.mapRect(2000, -1025, 200, 25);
                }
            } else if (!build.isExperimentRun) {
                simulation.trails()
                //bonus power ups for clearing runs in the last game
                if (!simulation.isCheating && localSettings.levelsClearedLastGame > 1) {
                    for (let i = 0; i < localSettings.levelsClearedLastGame / 3; i++) powerUps.spawn(2095 + 2 * Math.random(), -1270 - 50 * i, "tech", false); //spawn a tech for levels cleared in last game
                    simulation.makeTextLog(`for (let i <span class='color-symbol'>=</span> 0; i <span class='color-symbol'><</span> localSettings.levelsClearedLastGame <span class='color-symbol'>/</span> 3; i<span class='color-symbol'>++</span>)`);
                    simulation.makeTextLog(`{ powerUps.spawn(m.pos.x, m.pos.y, "tech") <em>//simulation superposition</em>}`);
                    localSettings.levelsClearedLastGame = 0 //after getting bonus power ups reset run history
                    if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                }
            }
            spawn.mapRect(2025, 0, 150, 50); //lid to floor hole
        } else {
            for (let i = 0; i < 60; i++) {
                setTimeout(() => {
                    if (level.levels[level.onLevel] === "intro") spawn.sneaker(2100, -1500 - 50 * i);
                }, 2000 + 500 * i);
            }
        }
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

        level.custom = () => {
            //push around power ups stuck in the tube wall
            if (!(simulation.cycle % 30)) {
                for (let i = 0, len = powerUp.length; i < len; i++) {
                    if (powerUp[i].position.y < -1000) powerUp[i].force.x += 0.01 * (Math.random() - 0.5) * powerUp[i].mass
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

            //power up dispenser
            // ctx.beginPath()
            // for (let i = 2; i < 10; i++) {
            //     ctx.moveTo(2000, -100 * i)
            //     ctx.lineTo(2080, -100 * i)
            // }
            // ctx.strokeStyle = "#ddd"
            // ctx.lineWidth = 5;
            // ctx.stroke();

            // ctx.beginPath()
            // for (let i = 2; i < 10; i++) {
            //     ctx.arc(2040, -100 * i, 30, 0, 2 * Math.PI);
            //     ctx.moveTo(2040, -100 * i)
            // }
            // ctx.fillStyle = "rgba(0,0,0,0.3)"
            // ctx.fill()

            // ctx.fillStyle = "rgba(240,255,255,0.5)"
            // ctx.fillRect(2000, -1000, 80, 700)

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(2600, -600, 400, 300)

            // level.enter.draw();
            level.exit.drawAndCheck();
        };

        level.customTopLayer = () => {
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(2600, -600, 400, 300)
            //draw shade for ceiling tech
            ctx.fillStyle = "rgba(68, 68, 68,0.95)"
            ctx.fillRect(2030, -2800, 150, 1800);
            ctx.fillStyle = "rgba(68, 68, 68,0.95)"
            ctx.fillRect(2030, 0, 150, 1800);
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

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(3000, -2800, 2600, 4600); //right wall

        // spawn.mapRect(-250, 0, 3600, 1800); //ground
        spawn.mapRect(-250, 0, 2300, 1800); //split roof        
        spawn.mapRect(2150, 0, 1200, 1800); //split roof
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
        spawn.bodyRect(2500, -150, 100, 150); //exit step
    },
    reservoir() {
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
        // spawn.debris(750, -2200, 3700, 16); //16 debris per level            //no debris?

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
        // spawn.mapRect(225, 675, 375, 25);
        // spawn.mapRect(675, 450, 375, 25);
        // spawn.mapRect(1125, 225, 375, 25);
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
        // spawn.mapRect(550, -3050, 600, 175);
        spawn.mapRect(550, -3050, 600, 75);

        spawn.bodyRect(-125, -2025, 475, 25);
        //2nd floor left building
        // if (Math.random() > 0.5) {
        //     spawn.mapRect(-925, -2350, 675, 200);
        // } else {
        // }

        spawn.mapRect(-925, -2350, 675, 50);
        spawn.mapRect(-825, -2825, 425, 50);
        // spawn.mapRect(-825, -2825, 425, 275);
        spawn.mapRect(-450, -3125, 50, 350);
        spawn.mapRect(-750, -3150, 350, 50);
        spawn.mapRect(-650, -3400, 250, 300);
        spawn.mapRect(-650, -3675, 200, 50);
        spawn.bodyRect(-375, -2150, 100, 150, 0.2);
        //2nd floor left pillar
        spawn.mapRect(-1400, -2625, 325, 25);
        spawn.mapRect(-1450, -3225, 425, 25);
        // spawn.mapRect(-1500, -3825, 525, 25);
        spawn.mapRect(-1512.5, -3825, 550, 25);
        // spawn.mapRect(-1400, -3225, 325, 25);
        // spawn.mapRect(-1400, -3825, 325, 25);

        spawn.randomMob(1000, -275, 0.2);
        spawn.randomMob(950, -1725, 0.1);
        spawn.randomMob(-725, -1775, 0.1);
        spawn.randomMob(-200, -2075, 0);
        spawn.randomMob(-550, -3500, -0.2);
        spawn.randomMob(375, -2125, 0);
        spawn.randomMob(-700, -2450, -0.1);
        spawn.randomMob(-1175, -2775, -0.1);
        spawn.randomMob(1025, -3200, -0.2);
        spawn.randomMob(-525, -3750, -0.2);
        spawn.randomMob(1350, -2075, -0.3);
        spawn.randomMob(1775, 1000, -0.4);
        spawn.randomSmallMob(-575, -2925);
        spawn.randomGroup(-400, -4400, 0);
        if (simulation.difficulty > 1) {
            spawn.randomLevelBoss(825, -3500);
            spawn.secondaryBossChance(75, -1350)
        }
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

        // level.difficultyIncrease(30) //30 is near max on hard  //60 is near max on why
        // m.immuneCycle = Infinity //you can't take damage

        // simulation.isHorizontalFlipped = true
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
                        ctx.fillStyle = `hsla(160, 100%, 43%,${0.3+0.07*Math.random()})`
                        ctx.fillRect(waterFallX, -5050, waterFallWidth, 6175 - slime.height)
                        if (!m.isBodiesAsleep) {
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
                        ctx.fillStyle = `hsla(160, 100%, 43%,${0.3+0.07*Math.random()})`
                        ctx.fillRect(waterFallX, -5050, waterFallWidth, 6175 - slime.height)
                        if (!m.isBodiesAsleep) {
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
    pavilion() {
        const vanish = []
        level.exit.x = -850;
        level.exit.y = -1485;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 25);
        level.setPosToSpawn(-900, 225); //normal spawn
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.defaultZoom = 1500
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#dcdcde";
        spawn.debris(-150, -775, 1425, 3); //16 debris per level
        spawn.debris(1525, -25, 950, 3); //16 debris per level
        spawn.debris(-650, -2100, 575, 2); //16 debris per level

        //bottom floor
        //entrance
        spawn.mapRect(-200, -750, 1500, 100);
        spawn.mapRect(-575, 0, 2150, 500);
        // spawn.mapRect(-1275, 275, 875, 225);
        spawn.mapRect(-1275, 275, 3975, 225);
        spawn.mapRect(-1050, 0, 325, 50);
        spawn.mapRect(-775, 0, 50, 140);
        vanish.push(level.vanish(-725, 13, 150, 25))
        spawn.mapRect(-200, -750, 100, 600);
        // spawn.mapRect(1200, -750, 100, 600);
        vanish.push(level.vanish(-350, -225, 150, 225))
        vanish.push(level.vanish(-350, -450, 150, 223))
        spawn.mapRect(2475, -1800, 250, 2300);

        spawn.mapRect(1200, -750, 100, 450);
        spawn.mapRect(1200, -375, 250, 75);
        powerUps.spawnStartingPowerUps(550, -100);
        spawn.mapRect(125, -12, 850, 50);
        spawn.mapRect(175, -25, 750, 50);
        spawn.bodyRect(1350, -175, 150, 175, 0.5);
        spawn.bodyRect(1350, -600, 125, 225, 0.2);

        //middle floor
        spawn.bodyRect(215, -1175, 100, 100, 0.3);
        spawn.mapRect(-1300, -1800, 250, 2300);
        // spawn.mapRect(-1300, -2075, 250, 2575);
        if (Math.random() < 0.5) {
            spawn.mapRect(500, -1350, 525, 425);
            spawn.mapRect(25, -1050, 300, 198);
        } else {
            spawn.mapRect(500, -1350, 525, 497);
            spawn.mapRect(25, -1050, 300, 150);
        }
        if (Math.random() < 0.5) {
            vanish.push(level.vanish(400, -1600, 175, 25))
            vanish.push(level.vanish(950, -1600, 175, 25))
        } else {
            vanish.push(level.vanish(550, -1575, 50, 225))
            vanish.push(level.vanish(925, -1575, 50, 225))
        }

        // vanish.push(level.vanish(575, -1575, 375, 225))

        spawn.bodyRect(225, -850, 50, 100, 0.4);
        spawn.mapRect(600, -1800, 325, 225);
        spawn.mapRect(1900, -1500, 325, 25);
        spawn.bodyRect(1050, -1825, 250, 20, 0.2);
        if (Math.random() < 0.5) {
            vanish.push(level.vanish(1400, -1000, 200, 25))
            vanish.push(level.vanish(1625, -1250, 200, 25))
        } else {
            vanish.push(level.vanish(1400, -1075, 175, 175))
            vanish.push(level.vanish(1575, -1250, 175, 175))
        }
        vanish.push(level.vanish(1125, -1800, 625, 25))

        // vanish.push(level.vanish(1500, -1800, 225, 25))
        vanish.push(level.vanish(-50, -1800, 450, 25))

        //exit
        spawn.mapRect(-1050, -1450, 700, 25);
        spawn.mapRect(-1050, -1800, 525, 25);
        spawn.mapRect(-550, -1800, 25, 200);

        spawn.randomMob(-1175, -1975, -0.4);
        spawn.randomMob(275, -1500, -0.3);
        spawn.randomMob(700, -1875, -0.2);
        spawn.randomMob(2000, -800, -0.2);
        spawn.randomMob(2600, -1850, 0);
        spawn.randomMob(1425, -525, 0.1);
        spawn.randomMob(2025, -1600, 0.3);
        spawn.randomMob(1625, -1875, 0.3);
        spawn.randomMob(-150, -1975, 0.4);
        spawn.randomSmallMob(900, -825);
        spawn.randomSmallMob(1050, -50);

        if (simulation.difficulty > 1) {
            spawn.randomGroup(750, -2150, -0.8)
            spawn.randomLevelBoss(2050, -2025)
            spawn.secondaryBossChance(100, -1500)
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
            level.setPosToSpawn(900, 225); //normal spawn
            level.custom = () => {
                ctx.fillStyle = "#d0d3d9"
                ctx.fillRect(-2500, -1800, 3575, 2100);
                ctx.fillStyle = "#c0c3c9"
                ctx.fillRect(-2075, -1475, 25, 1800);
                ctx.fillStyle = "#cff" //exit
                ctx.fillRect(550, -1800, 525, 350)

                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                //shadow
                ctx.fillStyle = "rgba(0,10,30,0.1)"
                ctx.fillRect(-1450, -300, 150, 325);
                ctx.fillRect(-1300, -650, 1500, 650)
                ctx.fillRect(725, 50, 325, 225)
                ctx.fillRect(-325, -950, 300, 225)
                ctx.fillRect(-1025, -1000, 525, 275);
                ctx.fillRect(-925, -1600, 325, 275);
                for (let i = 0, len = vanish.length; i < len; i++) vanish[i].query()
            };

        } else {
            level.custom = () => {
                ctx.fillStyle = "#d0d3d9"
                ctx.fillRect(-1075, -1800, 3575, 2100);
                ctx.fillStyle = "#c0c3c9"
                ctx.fillRect(2050, -1475, 25, 1800);
                ctx.fillStyle = "#cff" //exit
                ctx.fillRect(-1050, -1800, 525, 350)

                level.exit.drawAndCheck();
                level.enter.draw();
            };
            level.customTopLayer = () => {
                //shadow
                ctx.fillStyle = "rgba(0,10,30,0.1)"
                ctx.fillRect(1300, -300, 150, 325);
                ctx.fillRect(-200, -675, 1500, 700)
                ctx.fillRect(500, -950, 525, 225);
                ctx.fillRect(600, -1600, 325, 275);
                ctx.fillRect(-1050, 50, 325, 225)
                ctx.fillRect(25, -950, 300, 225)
                for (let i = 0, len = vanish.length; i < len; i++) vanish[i].query()
            };
        }
    },
    testChamber() {
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
        const hazard = level.hazard((simulation.isHorizontalFlipped ? -350 - 700 : 350), -2025, 700, 10, 0.4) //laser
        spawn.mapRect(340, -2032.5, 20, 25); //laser nose
        const hazard2 = level.hazard((simulation.isHorizontalFlipped ? -1775 - 150 : 1775), -2550, 150, 10, 0.4) //laser
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

            if (button.isUp) {
                hazard.isOn = false;
                hazard2.isOn = false;
            } else {
                hazard.isOn = true;
                hazard2.isOn = true;
            }
            button.query();
            button.draw();

            ctx.fillStyle = "#d4f4f4"
            ctx.fillRect(-300, -1000, 650, 500)
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            door.draw();
            hazard.opticalQuery();
            hazard2.opticalQuery();
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

        const powerUpPos = shuffle([{ //no debris on this level but 2 random spawn instead
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
        }]);
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
        spawn.mapRect(2290, -12, 375, 100);
        spawn.mapRect(2350, -24, 375, 100);
        spawn.mapRect(2410, -36, 375, 100);
        //portal 1 top
        spawn.mapRect(2290, -3012, 375, 50);
        spawn.mapRect(2350, -3024, 375, 50);
        spawn.mapRect(2410, -3036, 375, 50);
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
        spawn.randomMob(1075, -3500, -0.3);
        spawn.randomMob(2175, -700, -0.2);
        spawn.randomMob(-75, -850, -0.1);
        spawn.randomMob(550, -3400, 0);
        spawn.randomMob(0, -1175, 0.5);
        spawn.randomMob(-75, -1150, 0.5);
        spawn.randomMob(1075, -625, 0.5);
        spawn.randomMob(800, -3400, -0.3);
        spawn.randomMob(1225, -3375, -0.2);
        spawn.randomMob(1200, -1125, -0.1);
        spawn.randomMob(2050, -950, 0.5);
        if (simulation.difficulty > 40) {
            spawn.randomMob(2300, -2775, -0.5);
            spawn.randomMob(600, -925, -0.5);
            spawn.randomMob(1550, -2750, -0.5);
            spawn.randomMob(1350, -1150, -0.5);
            spawn.randomMob(-75, -1475, 0);
            spawn.randomGroup(600, -2600, 0);
        }
        if (simulation.difficulty > 1) {
            if (Math.random() < 0.5) {
                spawn.randomLevelBoss(700, -1550);
            } else {
                spawn.randomLevelBoss(675, -2775); //["shooterBoss", "launcherBoss", "laserTargetingBoss", "streamBoss", "shieldingBoss", "pulsarBoss", "grenadierBoss"]
            }
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(1925, -1250)

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
    testChamber2() {
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
        const hazard = level.hazard((simulation.isHorizontalFlipped ? -350 - 700 : 350), -2025, 700, 10, 0.4) //laser
        spawn.mapRect(340, -2032.5, 20, 25); //laser nose
        const hazard2 = level.hazard((simulation.isHorizontalFlipped ? -1775 - 150 : 1775), -2550, 150, 10, 0.4) //laser
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

            if (button.isUp) {
                hazard.isOn = false;
                hazard2.isOn = false;
            } else {
                hazard.isOn = true;
                hazard2.isOn = true;
            }
            button.query();
            button.draw();

            ctx.fillStyle = "#d4f4f4"
            ctx.fillRect(-300, -1000, 650, 500)
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            door.draw();
            hazard.opticalQuery();
            hazard2.opticalQuery();
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

        const powerUpPos = shuffle([{ //no debris on this level but 2 random spawn instead
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
        }]);
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
        spawn.mapRect(2290, -12, 375, 100);
        spawn.mapRect(2350, -24, 375, 100);
        spawn.mapRect(2410, -36, 375, 100);
        //portal 1 top
        spawn.mapRect(2290, -3012, 375, 50);
        spawn.mapRect(2350, -3024, 375, 50);
        spawn.mapRect(2410, -3036, 375, 50);
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
        spawn.randomMob(1075, -3500, -0.3);
        spawn.randomMob(2175, -700, -0.2);
        spawn.randomMob(-75, -850, -0.1);
        spawn.randomMob(550, -3400, 0);
        spawn.randomMob(0, -1175, 0.5);
        spawn.randomMob(-75, -1150, 0.5);
        spawn.randomMob(1075, -625, 0.5);
        spawn.randomMob(800, -3400, -0.3);
        spawn.randomMob(1225, -3375, -0.2);
        spawn.randomMob(1200, -1125, -0.1);
        spawn.randomMob(2050, -950, 0.5);
        if (simulation.difficulty > 40) {
            spawn.randomMob(2300, -2775, -0.5);
            spawn.randomMob(600, -925, -0.5);
            spawn.randomMob(1550, -2750, -0.5);
            spawn.randomMob(1350, -1150, -0.5);
            spawn.randomMob(-75, -1475, 0);
            spawn.randomGroup(600, -2600, 0);
        }
        if (simulation.difficulty > 1) {
            if (Math.random() < 0.5) {
                spawn.randomLevelBoss(700, -1550);
            } else {
                spawn.randomLevelBoss(675, -2775); //["shooterBoss", "launcherBoss", "laserTargetingBoss", "streamBoss", "shieldingBoss", "pulsarBoss", "grenadierBoss"]
            }
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(1925, -1250)

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
    sewers() {
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

        const xPos = shuffle([600, 1250, 2000]);
        spawn.mapRect(xPos[0], -200, 300, 100);
        spawn.mapRect(xPos[1], -250, 300, 300);
        spawn.mapRect(xPos[2], -150, 300, 200);

        spawn.bodyRect(3100, 410, 75, 100);
        spawn.bodyRect(2450, -25, 250, 25);

        spawn.mapRect(3050, -600, 200, 800); //right down tube wall
        spawn.mapRect(3100, 0, 1200, 200); //tube right exit ceiling
        spawn.mapRect(4200, 0, 200, 1900);


        spawn.mapVertex(3500, 1000, "-500 -500  -400 -600   400 -600 500 -500   500 500 400 600  -400 600 -500 500");
        spawn.mapVertex(3600, 1940, "-400 -40  -350 -90   350 -90 400 -40   400 40 350 90  -350 90 -400 40");
        spawn.mapRect(3925, 2288, 310, 50);
        spawn.mapRect(3980, 2276, 200, 50);

        spawn.mapRect(2625, 2288, 650, 50);
        spawn.mapRect(2700, 2276, 500, 50);

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
        spawn.randomMob(8300, 2100, 0.1);
        spawn.randomSmallMob(2575, -75, 0.1); //entrance
        spawn.randomMob(8125, 2450, 0.1);
        spawn.randomSmallMob(3200, 250, 0.1);
        spawn.randomMob(2425, 2150, 0.1);
        spawn.randomSmallMob(3500, 250, 0.2);
        spawn.randomMob(3800, 2175, 0.2);
        spawn.randomSmallMob(2500, -275, 0.2); //entrance
        spawn.randomMob(4450, 2500, 0.2);
        spawn.randomMob(6350, 2525, 0.2);
        spawn.randomGroup(9200, 2400, 0.3);
        spawn.randomSmallMob(1900, -250, 0.3); //entrance
        spawn.randomMob(1500, 2100, 0.4);
        spawn.randomSmallMob(1700, -150, 0.4); //entrance
        spawn.randomMob(8800, 2725, 0.5);
        spawn.randomMob(7300, 2200, 0.5);
        spawn.randomMob(2075, 2025, 0.5);
        spawn.randomMob(3475, 2175, 0.5);
        spawn.randomMob(8900, 2825, 0.5);
        spawn.randomMob(9600, 2425, 0.9);
        spawn.randomMob(3600, 1725, 0.9);
        spawn.randomMob(4100, 1225, 0.9);
        spawn.randomMob(2825, 400, 0.9);
        if (simulation.difficulty > 1) spawn.randomLevelBoss(6000, 2300, ["dragonFlyBoss", "beetleBoss", "spiderBoss", "launcherBoss", "laserTargetingBoss", "blinkBoss", "streamBoss", "historyBoss", "orbitalBoss", "grenadierBoss", "blockBoss", "revolutionBoss", "slashBoss"]);
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(7725, 2275)

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
    satellite() {
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
        spawn.debris(1000, 20, 1800, 3); //16 debris per level //but less here because a few mobs die from laser
        spawn.debris(4830, -1330, 850, 3); //16 debris per level
        spawn.debris(3035, -3900, 1500, 3); //16 debris per level

        document.body.style.backgroundColor = "#dbdcde";

        //spawn start building
        spawn.mapRect(-350, -800, 100, 1100);
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
        spawn.mapRect(5200, -725, 100, 870);
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

        spawn.randomSmallMob(4400, -3500);
        spawn.randomSmallMob(4800, -800);
        spawn.randomMob(800, -2600);
        spawn.randomMob(700, -600, 0.3);
        spawn.randomMob(3100, -3600, 0.3);
        spawn.randomMob(3300, -1000, 0.3);
        spawn.randomMob(4200, -250, 0.3);
        spawn.randomMob(4900, -1500, 0.3);
        spawn.randomMob(3800, 175, 0.4);
        spawn.randomMob(5750, 125, 0.4);
        spawn.randomMob(5900, -1500, 0.4);
        spawn.randomMob(4700, -800, 0.4);
        spawn.randomMob(1400, 200, 0.3);
        spawn.randomMob(2850, 175, 0.4);
        spawn.randomMob(2000, -2800, 0.4);
        spawn.randomMob(2400, -400, 0.4);
        spawn.randomMob(4475, -3550, 0.3);
        spawn.randomGroup(5000, -2150, 1);
        spawn.randomGroup(3700, -4100, 0.3);
        spawn.randomGroup(2700, -1600, 0.1);
        spawn.randomGroup(1600, -100, 0);
        spawn.randomGroup(5000, -3900, -0.3);
        if (simulation.difficulty > 1) {
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
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(3950, -850)

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

        let isBackwards = false
        if (Math.random() < 0.75) {
            //normal direction start in top left
            level.setPosToSpawn(-450, -2060);
            level.exit.x = 3600;
            level.exit.y = -300;
            spawn.mapRect(3600, -285, 100, 50); //ground bump wall
            //mobs that spawn in exit room
            spawn.bodyRect(4850, -750, 300, 25, 0.6); //
            spawn.randomSmallMob(4100, -100);
            spawn.randomSmallMob(4600, -100);
            spawn.randomMob(3765, -450, 0.3);
        } else {
            isBackwards = true
            //reverse direction, start in bottom right
            level.setPosToSpawn(3650, -325);
            level.exit.x = -550;
            level.exit.y = -2030;
            spawn.mapRect(-550, -2015, 100, 50); //ground bump wall
        }
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

        spawn.debris(1650, -1800, 3800, 16); //16 debris per level
        powerUps.spawnStartingPowerUps(2450, -1675);

        //spawn.mapRect(-700, 0, 6250, 100); //ground
        spawn.mapRect(3400, 0, 2150, 100); //ground
        spawn.mapRect(-700, -2000, 2125, 50); //Top left ledge
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

        spawn.randomSmallMob(2200, -1775);
        spawn.randomSmallMob(4000, -825);
        spawn.randomSmallMob(-350, -3400);
        spawn.randomMob(4250, -1350, 0.8);
        spawn.randomMob(2550, -1350, 0.8);
        spawn.randomMob(1875, -1075, 0.3);
        spawn.randomMob(1120, -1200, 0.3);
        spawn.randomMob(3000, -1150, 0.2);
        spawn.randomMob(3200, -1150, 0.3);
        spawn.randomMob(3300, -1750, 0.3);
        spawn.randomMob(3650, -1350, 0.3);
        spawn.randomMob(3600, -1800, 0.1);
        spawn.randomMob(5200, -100, 0.3);
        spawn.randomMob(5275, -900, 0.2);
        spawn.randomMob(0, -1075, 0.3);
        spawn.randomGroup(600, -1575, 0);
        spawn.randomGroup(2225, -1325, 0.4);
        spawn.randomGroup(4900, -1200, 0);
        if (simulation.difficulty > 1) spawn.randomLevelBoss(3200, -1900);
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(2175, -2425)

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

            boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
            boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
            elevator.holdX = -elevator.holdX // flip the elevator horizontally

            if (isBackwards) {
                level.setPosToSpawn(-3650, -325); //-x
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
    },
    aerie() {
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
                ctx.fillRect(3750, -3650, 550, 400)
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
                ctx.fillRect(3750, -3650, 550, 400)
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

        // simulation.difficulty = 4; //for testing to simulate possible mobs spawns
        level.defaultZoom = 2100
        simulation.zoomTransition(level.defaultZoom)

        const backwards = (Math.random() < 0.25 && simulation.difficulty > 8) ? true : false;
        if (backwards) {
            level.setPosToSpawn(4000, -3300); //normal spawn
            level.exit.x = -100;
            level.exit.y = -1025;
        } else {
            level.setPosToSpawn(-50, -1050); //normal spawn
            level.exit.x = 3950;
            level.exit.y = -3275;
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
        spawn.mapRect(3700, -3700, 600, 50);
        spawn.mapRect(3700, -3700, 50, 500);
        spawn.mapRect(4250, -3700, 50, 300);
        spawn.mapRect(3700, -3250, 1100, 100);

        spawn.randomGroup(350, -500, 1)
        spawn.randomSmallMob(-225, 25);
        spawn.randomSmallMob(2100, -900);

        spawn.randomSmallMob(4000, -250);
        spawn.randomSmallMob(4450, -3000);
        spawn.randomSmallMob(5600, 100);
        spawn.randomMob(4275, -2600, 0.8);
        spawn.randomMob(1050, -700, 0.8)
        spawn.randomMob(6050, -850, 0.7);
        spawn.randomMob(2150, -300, 0.6)
        spawn.randomMob(3900, -2700, 0.8);
        spawn.randomMob(3600, -500, 0.8);
        spawn.randomMob(3400, -200, 0.8);
        // spawn.randomMob(1650, -1300, 0.7)
        spawn.randomMob(425, 0, 0.7);
        spawn.randomMob(4100, -50, 0.7);
        spawn.randomMob(4100, -50, 0.5);
        spawn.randomMob(1700, -50, 0.3)
        spawn.randomMob(2350, -900, 0.3)
        spawn.randomMob(4700, -150, 0.2);
        spawn.randomGroup(4000, -350, 0.6);
        spawn.randomGroup(2750, -550, 0.1);
        spawn.randomMob(2175, -925, 0.5);
        spawn.randomMob(2750, 100, 0.5);
        spawn.randomMob(4250, -1725, 0.5);
        spawn.randomMob(3575, -2425, 0.5);
        spawn.randomMob(3975, -3900, 0.5);
        spawn.randomMob(1725, 125, 0.5);
        if (simulation.difficulty > 1) {
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
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(5350, -325)

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit

            boost1.boostBounds.min.x = -boost1.boostBounds.min.x - 100
            boost1.boostBounds.max.x = -boost1.boostBounds.max.x + 100
            boost2.boostBounds.min.x = -boost2.boostBounds.min.x - 100
            boost2.boostBounds.max.x = -boost2.boostBounds.max.x + 100


            if (backwards) {
                level.setPosToSpawn(-4000, -3300); //-x
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
                    ctx.fillRect(-3750 - 550, -3650, 550, 400)
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
                    ctx.fillRect(-3750 - 550, -3650, 550, 400)
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

        spawn.mapRect(-300, 0, 5100, 300); //***********ground
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

        spawn.randomMob(-100, -1300, 0.5);
        spawn.randomSmallMob(1850, -600);
        spawn.randomSmallMob(3200, -100);
        spawn.randomSmallMob(4450, -100);
        spawn.randomSmallMob(2700, -475);
        spawn.randomMob(2650, -975, 0.8);
        spawn.randomMob(2650, -1550, 0.8);
        spawn.randomMob(4150, -200, 0.15);
        spawn.randomMob(1700, -1300, 0.2);
        spawn.randomMob(1850, -1950, 0.25);
        spawn.randomMob(2610, -1880, 0.25);
        spawn.randomMob(3350, -950, 0.25);
        spawn.randomMob(1690, -2250, 0.25);
        spawn.randomMob(2200, -600, 0.2);
        spawn.randomMob(850, -1300, 0.25);
        spawn.randomMob(-100, -1700, -0.2);
        spawn.randomGroup(3700, -1500, 0.4);
        spawn.randomGroup(1700, -900, 0.4);
        if (simulation.difficulty > 1) spawn.randomLevelBoss(2800 + 200 * Math.random(), -2200 + 200 * Math.random());
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(4000, -1825)

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
    highrise() {
        const elevator1 = level.elevator(-790, -190, 180, 25, -1150, 0.0025, { up: 0.01, down: 0.2 }, true) //x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
        elevator1.addConstraint();
        // const button1 = level.button(-500, -200)
        const toggle1 = level.toggle(-300, -200) //(x,y,isOn,isLockOn = true/false)

        const elevator2 = level.elevator(-3630, -1000, 180, 25, -1740) //x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
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
            ctx.fillRect(-3540, -1720, 1, 740)

            ctx.fillStyle = "rgba(64,64,64,0.97)" //hidden section
            ctx.fillRect(-4450, -750, 800, 200)
            ctx.fillStyle = "rgba(0,0,0,0.12)"
            ctx.fillRect(-2500, -1975, 150, 300);
            ctx.fillRect(-1830, -1150, 2030, 1150)
            ctx.fillRect(-3410, -2150, 495, 1550)
            ctx.fillRect(-2585, -1675, 420, 1125)
            ctx.fillRect(-1650, -1575, 750, 450)
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
        spawn.mapRect(-925, -1575, 50, 475);
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
        spawn.randomMob(-2500, -2700, 1);
        spawn.randomMob(-3200, -750, 1);
        spawn.randomMob(-1875, -775, 0.2);
        spawn.randomMob(-950, -1675, 0.2);
        spawn.randomMob(-1525, -1750, 0.2);
        spawn.randomMob(-1375, -1400, 0.2);
        spawn.randomMob(-1625, -1275, 0.2);
        spawn.randomMob(-1900, -1250, 0.2);
        spawn.randomMob(-2250, -1850, 0.2);
        spawn.randomMob(-2475, -2200, 0.2);
        spawn.randomMob(-3000, -1475, 0.2);
        spawn.randomMob(-3850, -2500, 0.2);
        spawn.randomMob(-3650, -2125, 0.2);
        spawn.randomMob(-4010, -3200, 0.2);
        spawn.randomMob(-3500, -1825, 0.2);
        spawn.randomMob(-975, -100, 0);
        spawn.randomMob(-1050, -725, 0.2);
        spawn.randomMob(-1525, -100, 0);
        spawn.randomMob(-525, -1700, -0.1);
        spawn.randomMob(-125, -1500, -0.1);
        spawn.randomMob(-325, -1900, -0.1);
        spawn.randomMob(-550, -100, -0.1);
        spawn.randomGroup(-3250, -2700, 0.2);
        spawn.randomGroup(-2450, -1100, 0);

        if (simulation.difficulty > 1) spawn.randomLevelBoss(-2400, -2650);
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(-1825, -1975)

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
            cons[cons.length] = Constraint.create({
                pointA: {
                    x: -1650,
                    y: -500
                },
                bodyB: body[body.length - 1],
                stiffness: 0.0001815,
                length: 1
            });
            Composite.add(engine.world, cons[cons.length - 1]);

            spawn.bodyRect(600, 525, 125, 125, 1, spawn.propsSlide); //weight
            spawn.bodyRect(800, 600, 300, 100, 1, spawn.propsHoist); //hoist
            cons[cons.length] = Constraint.create({
                pointA: {
                    x: 950,
                    y: 100
                },
                bodyB: body[body.length - 1],
                stiffness: 0.0001815,
                length: 1
            });
            Composite.add(engine.world, cons[cons.length - 1]);

            spawn.bodyRect(-2700, 1150, 100, 160, 1, spawn.propsSlide); //weight
            spawn.bodyRect(-2550, 1200, 150, 150, 1, spawn.propsSlide); //weight
            spawn.bodyRect(-2763, 1300, 350, 100, 1, spawn.propsHoist); //hoist
            cons[cons.length] = Constraint.create({
                pointA: {
                    x: -2575,
                    y: 150
                },
                bodyB: body[body.length - 1],
                stiffness: 0.0004,
                length: 566
            });
            Composite.add(engine.world, cons[cons.length - 1]);
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
        spawn.randomSmallMob(-1125, 550);
        spawn.randomSmallMob(-2950, -50);
        spawn.randomMob(-2025, 175, 0.3);
        spawn.randomMob(-2325, 450, 0.3);
        spawn.randomMob(-2925, 675, 0.2);
        spawn.randomMob(-2700, 300, 0.1);
        spawn.randomMob(-2500, 300, 0.1);
        spawn.randomMob(-2075, -425, 0.1);
        spawn.randomMob(-1550, -725, 0.1);
        spawn.randomMob(375, 1100, 0);
        spawn.randomMob(-1575, 1100, 0);
        spawn.randomSmallMob(825, 300);
        spawn.randomMob(-800, -1750, 0);
        spawn.randomMob(400, -750, -0.1);
        spawn.randomMob(650, 1300, -0.1);
        spawn.randomMob(-2450, 1050, -0.1);
        spawn.randomMob(500, 400, -0.1);
        spawn.randomMob(-75, -1700, -0.1);
        spawn.randomMob(900, -800, -0.2);
        spawn.randomGroup(-75, 1050, -0.1);
        spawn.randomGroup(-900, 1000, 0.2);
        spawn.randomGroup(-1300, -1100, -0.3);
        spawn.randomSmallMob(-2325, 800);
        spawn.randomSmallMob(-900, 825);

        if (simulation.difficulty > 1) {
            if (Math.random() < 0.80) {
                spawn.randomLevelBoss(-800, -1300)
            } else {
                spawn.dragonFlyBoss(-1000 + Math.random() * 2500, -1300); //boss snake with head
            }
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(300, -800)

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
        let button, door
        let isReverse = false
        if (Math.random() < 0.75) { //normal direction start in top left
            button = level.button(525, 0)
            door = level.door(1362, -200, 25, 200, 195)
            level.setPosToSpawn(1375, -1550); //normal spawn
            level.exit.x = 3088;
            level.exit.y = -630;
        } else { //reverse direction, start in bottom right
            isReverse = true
            button = level.button(3800, 0)
            door = level.door(3012, -200, 25, 200, 195)
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
        spawn.mapRect(1350, -2000 + 505, 50, 1295); //right wall
        spawn.mapRect(-600, -2000 + 250, 2000 - 700, 50); //roof left
        spawn.mapRect(-600 + 1300, -2000, 50, 300); //right roof wall
        spawn.mapRect(-600 + 1300, -2000, 900, 50); //center wall

        map[map.length] = Bodies.polygon(725, -1700, 0, 15); //circle above door
        spawn.bodyRect(720, -1675, 15, 170, 1, spawn.propsDoor); // door
        body[body.length - 1].isNotHoldable = true;
        //makes door swing
        consBB[consBB.length] = Constraint.create({
            bodyA: body[body.length - 1],
            pointA: {
                x: 0,
                y: -90
            },
            bodyB: map[map.length - 1],
            stiffness: 1
        });
        Composite.add(engine.world, consBB[consBB.length - 1]);
        spawn.mapRect(-600 + 300, -2000 * 0.75, 1900, 50); //3rd floor
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
        spawn.mapRect(1390, 13, 30, 20); //step left
        spawn.mapRect(2980, 13, 30, 20); //step right
        spawn.bodyRect(4250, -700, 50, 100);
        spawn.mapRect(3000, -1000, 50, 800); //left wall
        spawn.mapRect(3000 + 2000 - 50, -1300, 50, 1100); //right wall
        spawn.mapRect(4150, -600, 350, 150); //table
        spawn.mapRect(3650, -1300, 50, 700); //exit wall
        spawn.mapRect(3650, -1300, 1350, 50); //exit wall
        spawn.bodyRect(3665, -600, 20, 100); //door

        spawn.mapRect(3025, -600, 250, 125);
        spawn.mapRect(3175, -550, 175, 75);
        // spawn.mapVertex(3160, -525, "625 0   300 0   300 -140   500 -140"); //entrance/exit ramp

        spawn.mapRect(3000, -2000 * 0.5, 700, 50); //exit roof
        spawn.mapRect(3010, -2000 * 0.25, 1690, 50); //1st floor
        spawn.spawnStairs(3000 + 2000 - 50, 0, 4, 250, 350, true); //stairs ground
        spawn.randomSmallMob(4575, -560, 1);
        spawn.randomSmallMob(1315, -880, 1);
        spawn.randomSmallMob(800, -600);
        spawn.randomMob(4100, -225, 0.8);
        spawn.randomMob(-250, -700, 0.8);
        spawn.randomMob(4500, -225, 0.15);
        spawn.randomMob(3250, -225, 0.15);
        spawn.randomMob(-100, -225, 0.1);
        spawn.randomMob(1150, -225, 0.15);
        spawn.randomMob(2000, -225, 0.15);
        spawn.randomMob(450, -225, 0.15);
        spawn.randomMob(100, -1200, 1);
        spawn.randomMob(950, -1150, -0.1);
        spawn.randomGroup(1800, -800, -0.2);
        spawn.randomGroup(4150, -1000, 0.6);
        if (simulation.difficulty > 1) {
            if (Math.random() < 0.5) {
                spawn.tetherBoss(2850, -80, { x: 2500, y: -500 })
                //chance to spawn a ring of exploding mobs around this boss
                if (simulation.difficulty > 6) spawn.nodeGroup(2850, -80, "spawns", 8, 20, 105);
            } else {
                spawn.randomLevelBoss(2200, -450)
            }
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(1875, -675)

        if (simulation.isHorizontalFlipped) { //flip the map horizontally
            level.flipHorizontal(); //only flips map,body,mob,powerUp,cons,consBB, exit
            level.setPosToSpawn(50, -60);

            if (!isReverse) { //normal direction start in top left
                level.setPosToSpawn(-1375, -1550); //normal spawn //-x
            } else { //reverse direction, start in bottom right
                level.setPosToSpawn(-3137, -650); //normal spawn
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
    stronghold() { // player made level  by    Francois 👑 from discord
        simulation.makeTextLog(`<strong>stronghold</strong> by <span class='color-var'>Francois</span>`);

        const boost1 = level.boost(1470, -250, 1080)
        const boost2 = level.boost(-370, 0, 800)
        const boost3 = level.boost(4865, 0, 1800)
        level.custom = () => {
            boost1.query();
            boost2.query();
            boost3.query();
            ctx.fillStyle = "#edf9f9";
            ctx.fillRect(-500, -1220, 550, -480);
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.fillRect(0, -700, 1050, 700);
            ctx.fillRect(-550, -1170, 550, 1170);
            ctx.fillRect(1150, -1700, 250, 1700);
            ctx.fillRect(1100, -1700, 50, 450);
            ctx.fillRect(1050, -1200, 100, 1200);
            ctx.fillRect(1400, -250, 200, -1500);
            ctx.fillRect(1600, -550, 600, -1150);
            ctx.fillRect(2530, -550, 430, -1450);
            ctx.fillRect(3270, -1700, 80, 600);
            ctx.fillRect(3350, -1350, 700, 230);
            ctx.fillRect(4050, -1700, 600, 1290);
            ctx.fillRect(3650, -110, 1000, 170);
            ctx.fillRect(4865, -55, 100, 55);
            level.exit.drawAndCheck();
            level.enter.draw();
        };
        level.customTopLayer = () => {

        };

        level.setPosToSpawn(1900, -40); //normal spawn
        level.exit.x = -350;
        level.exit.y = -1250;

        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom)

        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 20); //exit bump
        spawn.debris(3800, -1480, 300, 12);
        spawn.debris(3600, -1130, 200, 2);
        document.body.style.backgroundColor = "#dbdcde";
        // simulation.draw.mapFill = "#444"
        // simulation.draw.bodyFill = "rgba(140,140,140,0.85)"
        // simulation.draw.bodyStroke = "#222"

        // __________________________________________________________________________________________________
        // Spawn Box
        spawn.mapRect(1600, -500, 50, 500); //Left Wall
        spawn.mapRect(1600, -550, 1500, 50); //Roof
        spawn.mapRect(2300, -500, 50, 300); //Right Wall

        spawn.mapRect(-550, 0, 4300, 200); //ground
        spawn.mapRect(3700, 55, 1300, 145); //2nd ground
        spawn.mapRect(5000, 0, 50, 200); //Last small part of the ground
        spawn.mapRect(3100, -1070, 50, 570); // vertical 2nd roof
        spawn.mapRect(3100, -1120, 950, 50); // Horizontal 2nd Roof
        spawn.mapRect(4050, -1750, 600, 50); // Roof after lift 
        spawn.mapRect(4600, -1700, 50, 100); // Petit retour de toit, après ascenseur

        //Spawn "Upstairs" 
        spawn.mapRect(3650, -160, 400, 50); //Thin Walk
        spawn.mapRect(4050, -410, 600, 300); //Large staircase block
        spawn.mapRect(4600, -1120, 50, 710); //Left Wall Wall upstairs
        spawn.mapRect(4550, -1170, 100, 50); //Bloque ascenseur
        spawn.mapVertex(3700, 35, "0 0 450 0 300 -60 150 -60"); //first slope
        spawn.mapVertex(4850, 35, "0 0 370 0 370 -65 150 -65"); //second slope

        spawn.bodyRect(3950, -280, 170, 120); //Bloc Marche Pour Monter À Ascenseur
        // spawn.bodyRect(-2700, 1150, 100, 160, 1, spawn.propsSlide); //weight
        // spawn.bodyRect(-2550, 1150, 200, 100, 1, spawn.propsSlide); //weight
        spawn.bodyRect(4050, -500, 275, 100, 1, spawn.propsSlide); //weight
        spawn.bodyRect(4235, -500, 275, 100, 1, spawn.propsSlide); //weight
        // spawn.bodyRect(-2775, 1300, 400, 100, 1, spawn.propsHoist); //hoist
        spawn.bodyRect(4025, -450, 550, 100, 1, spawn.propsHoist); //hoist
        cons[cons.length] = Constraint.create({
            pointA: {
                x: 4325,
                y: -1700,
            },
            bodyB: body[body.length - 1],
            stiffness: 0.0002, //1217,
            length: 200
        });
        Composite.add(engine.world, cons[cons.length - 1]);

        spawn.bodyRect(2799, -870, 310, 290); //Gros bloc angle toit
        spawn.mapRect(4000, -1750, 50, 400); //Right Wall Cuve
        spawn.mapRect(3400, -1400, 600, 50); // Bottom Cuve
        spawn.mapRect(3350, -1750, 50, 400); // Left Wall Cuve
        spawn.bodyRect(3400, -1470, 110, 70); //Moyen bloc dans la cuve
        spawn.mapRect(3270, -1750, 80, 50); // Rebord gauche cuve

        spawn.mapRect(2530, -2000, 430, 50); //First Plateforme
        spawn.mapRect(1600, -1750, 600, 50); // Middle plateforme
        spawn.mapRect(1100, -1750, 300, 50); //Derniere plateforme // Toit petite boite en [
        spawn.bodyRect(1830, -1980, 190, 230); // Fat bloc plateforme middle 
        spawn.bodyRect(1380, -1770, 250, 20) // Pont last plateforme

        spawn.mapRect(1000, -1250, 400, 50); //Sol de la petite boite en [
        spawn.mapRect(1100, -1550, 50, 190); //Mur gauche petite boite en [
        spawn.bodyRect(1100, -1380, 48, 109); //Bloc-porte petite boite en [

        spawn.mapRect(-100, -750, 1100, 50); //Sol last salle
        spawn.mapRect(1000, -1200, 50, 500) // Mur droit last salle
        spawn.mapRect(50, -1550, 1050, 50); // Toit last salle
        spawn.bodyRect(1, -900, 48, 150); //Bloc porte last salle
        spawn.mapRect(0, -1170, 50, 270); //Mur gauche en bas last salle
        spawn.bodyRect(920, -900, 120, 120); //Gros bloc last salle

        spawn.mapRect(0, -1700, 50, 320); // Mur droit salle exit / Mur gauche last salle
        spawn.mapRect(-550, -1220, 600, 50); // Sol exit room
        spawn.mapRect(-500, -1750, 550, 50); // Toit exit room
        spawn.mapRect(-550, -1750, 50, 530); // Mur gauche exit room
        spawn.bodyRect(-503, -1250, 30, 30); // Petit bloc exit room

        spawn.mapRect(500, -700, 100, 590); //Bloc noir un dessous last salle
        spawn.mapRect(1350, -250, 250, 250); //Black Block left from the spawn


        map[map.length] = Bodies.polygon(2325, -205, 0, 15); //circle above door
        spawn.bodyRect(2325, -180, 15, 170, 1, spawn.propsDoor); // door
        body[body.length - 1].isNotHoldable = true;
        //makes door swing
        consBB[consBB.length] = Constraint.create({
            bodyA: body[body.length - 1],
            pointA: {
                x: 0,
                y: -90
            },
            bodyB: map[map.length - 1],
            stiffness: 1
        });
        Composite.add(engine.world, consBB[consBB.length - 1]);
        spawn.bodyRect(650, 50, 70, 50);
        spawn.bodyRect(300, 0, 100, 60);
        spawn.bodyRect(400, 0, 100, 150);
        spawn.bodyRect(2545, -50, 70, 50);
        spawn.bodyRect(2550, 0, 100, 30);

        spawn.randomSmallMob(200, -1300, 0.5);
        spawn.randomSmallMob(300, -1300, 0.9);
        spawn.randomSmallMob(470, -650, 1);
        spawn.randomSmallMob(1000, -400, 1);
        spawn.randomSmallMob(2550, -560, 1);
        spawn.randomSmallMob(3350, -900, 1);
        spawn.randomSmallMob(3600, -1210, 1);
        spawn.randomSmallMob(700, -1950, 0.2);
        spawn.randomSmallMob(5050, -550);
        spawn.randomMob(-250, -250, 0.8);
        spawn.randomMob(-300, -600, 0.6);
        spawn.randomMob(350, -900, 0.5);
        spawn.randomMob(770, -950, 0.8)
        spawn.randomMob(900, -160, 1);
        spawn.randomMob(2360, -820, 0.8);
        spawn.randomMob(2700, -2020, 0.8);
        spawn.randomMob(3050, -1650, 0.8);
        spawn.randomMob(3350, -600, 0.8);
        spawn.randomMob(4400, -50, 1);
        spawn.randomGroup(1500, -1900, 0.5);
        spawn.randomGroup(2350, -850, 1);
        spawn.randomGroup(100, -450, 0.9);

        if (simulation.difficulty > 1) spawn.randomLevelBoss(1850, -1400);
        spawn.secondaryBossChance(1850, -1400)

        powerUps.addResearchToLevel() //needs to run after mobs are spawned
    },
    basement() { // player made level  by    Francois 👑 from discord
        simulation.makeTextLog(`<strong>basement</strong> by <span class='color-var'>Francois</span>`);
        let button, door, buttonDoor, buttonPlateformEnd, doorPlateform
        let isLevelReversed = Math.random();
        if (isLevelReversed < 0.7) {
            isLevelReversed = false;
        } else {
            isLevelReversed = true;
        }
        const elevator = level.elevator(4545, -220, 110, 30, -3000)
        const hazard = level.hazard(1675, -1050, 800, 150);
        const portal = level.portal({
            x: -620,
            y: -257
        }, Math.PI / 2, { //down
            x: 500,
            y: 2025
        }, -Math.PI / 2) //up
        spawn.mapRect(350, 2025, 300, 300); //Bloc portail n°2

        if (isLevelReversed === false) { /// Normal Spawn  
            button = level.button(2700, -1150);
            level.setPosToSpawn(2600, -2050); //normal spawn
            level.exit.x = level.enter.x + 4510;
            level.exit.y = level.enter.y + 600;
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        } else { /// Reversed spawn
            button = level.button(1450, -1150);
            buttonPlateformEnd = level.button(3530, -1150);
            buttonDoor = level.button(8033, -3625);
            door = level.door(7700, -3905, 25, 184, 184);
            doorPlateform = level.door(3200, -1225, 299, 80, 525);
            level.setPosToSpawn(7110, -1450); //normal spawn
            level.exit.x = level.enter.x - 4510;
            level.exit.y = level.enter.y - 600;
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
            spawn.mapRect(7675, -3935, 75, 25);
            spawn.mapRect(7675, -3715, 75, 25);
            spawn.bodyRect(8075, -3675, 50, 25);
        }
        const boost1 = level.boost(8290, -2100, 1800)
        level.custom = () => {
            boost1.query();

            level.exit.drawAndCheck();
            portal[2].query()
            portal[3].query()
            button.query();
            button.draw();
            if (isLevelReversed === true) { ///Reversed spawn
                buttonDoor.draw();
                buttonDoor.query();
                buttonPlateformEnd.draw();
                buttonPlateformEnd.query();
                // hazard.query(); //bug reported from discord?
                if (buttonDoor.isUp) {
                    door.isClosing = false
                } else {
                    door.isClosing = true
                }
                door.openClose();
                if (buttonPlateformEnd.isUp) {
                    doorPlateform.isClosing = true;
                } else {
                    doorPlateform.isClosing = false;
                }
                door.openClose();
                doorPlateform.openClose();
            }
            hazard.level(button.isUp)


            level.enter.draw();
            elevator.move();
            elevator.drawTrack();
        };

        level.customTopLayer = () => {
            ctx.fillStyle = "rgba(61,62,62,0.95)";
            ctx.fillRect(-750, -900, 750, 450);

            if (isLevelReversed === true) {
                door.draw();
                doorPlateform.draw();
            }
            portal[0].draw();
            portal[1].draw();
            portal[2].draw();
            portal[3].draw();
            hazard.query();
        };

        level.defaultZoom = 1300
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#c7c7c7";

        // GROUND //
        spawn.mapRect(-400, -2000, 400, 1430); //Gros left wall 
        spawn.mapRect(3700, -3000, 700, 2650); //Gros right wall //Puit
        spawn.mapRect(-400, -2000, 3700, 250); //Ground
        spawn.mapRect(2475, -1150, 1225, 250);
        spawn.mapRect(500, -1150, 1175, 250); //Ground level 3
        spawn.mapRect(350, -180, 4600, 1255); // Last ground
        spawn.mapRect(-400, -458, 750, 3337); //mur left sous-sol
        spawn.mapRect(-2850, -3375, 5300, 1375);
        spawn.mapRect(-2850, -4200, 8000, 825);
        spawn.mapRect(3700, -3375, 550, 375);
        spawn.mapRect(-2850, -5200, 10200, 1000);
        spawn.mapRect(5600, -1250, 3550, 2000);
        spawn.mapRect(9150, -5200, 1725, 5800);
        // SPAWN BOX //
        spawn.mapRect(2300, -3375, 950, 1000);
        spawn.mapRect(3550, -3375, 150, 1625);
        spawn.mapVertex(2020, -791, "  250 250  -860 250  -2200 0  250 0"); //map vertex en haut
        spawn.mapVertex(690, -295, "1700 0  -200 0  -200 -284  500 -284"); //map vertex en bas
        spawn.mapRect(2950, -900, 750, 250); //Extension ground apres map vertex
        if (isLevelReversed === false) {
            spawn.mapRect(3250, -1800, 50, 150); //Petit picot en haut, à gauche
            spawn.mapRect(3400, -1800, 50, 150); //Petit picot en haut, à droite
            spawn.mapRect(3150, -1300, 50, 200) //Petit picot en bas, à gauche
            spawn.mapRect(3500, -1300, 50, 200) //Petit picot en bas, à droite
            spawn.mapRect(3050, -3375, 500, 1260);
            spawn.mapRect(3400, -2265, 150, 515); //Mur fond tunnel
            spawn.bodyRect(3625, -1225, 75, 75); //Pitit bloc à droite en bas spawn
        } else {
            spawn.mapRect(3050, -3375, 500, 1000);
            spawn.mapRect(3400, -2400, 150, 650); //Mur fond tunnel
            spawn.bodyRect(3425, -1515, 75, 75); //Petit en bas spawn
            spawn.mapRect(3200, -1275, 300, 175);
        }

        // TRAMPOLING //
        if (isLevelReversed === false) { /// Normal spawn
            spawn.bodyRect(0, -1000, 500, 120, 1, spawn.propsHoist); //hoist
            cons[cons.length] = Constraint.create({
                pointA: {
                    x: 250,
                    y: -1750,
                },
                bodyB: body[body.length - 1],
                stiffness: 0.00014,
                length: 120
            });
            Composite.add(engine.world, cons[cons.length - 1]);
            spawn.bodyRect(0, -1250, 240, 190) //Fat cube ascenseur
        } else { /// Reversed spawn
            spawn.bodyRect(0, -650, 225, 175);
            spawn.mapRect(425, -950, 175, 50);
            spawn.mapRect(-25, -1150, 100, 50);
        }
        // PUIT //
        spawn.mapVertex(4200, -1810, "0 0 450 0 600 -2500 0 -2500")
        spawn.mapVertex(5000, -1809, "0 0 450 0 450 -2500 -150 -2500")
        spawn.mapRect(4800, -3000, 800, 5875); //big right Puit
        // BOSS AREA //
        spawn.mapRect(4800, -3150, 50, 200); //Premiere barriere
        spawn.mapRect(5100, -3530, 50, 380); //2nd barriere
        spawn.mapRect(5100, -3200, 150, 50); //Marche en dessous mapVertex 1
        spawn.mapVertex(5450, -3650, "220 0  200 30  -200 30  -220 0  -200 -30  200 -30");
        spawn.mapVertex(6225, -3350, "275 0  250 50  -250 50  -275 0  -250 -50  250 -50");
        spawn.mapRect(5600, -3000, 1600, 725); //ground Boss Area
        //Ouverture right boss area
        spawn.mapRect(7300, -3325, 50, 50); //petite marche pour accéder à l'ouverture 
        spawn.mapRect(7350, -4075, 850, 50); //Bouche
        spawn.mapRect(7400, -4050, 800, 50); //Bouche
        spawn.mapRect(7450, -4025, 750, 50); //Bouche
        spawn.mapRect(7500, -4000, 700, 50); //Bouche
        spawn.mapRect(7550, -3975, 650, 50); //Bouche
        spawn.mapRect(7350, -3600, 850, 50); //Bouche
        spawn.mapRect(7400, -3625, 800, 50); //Bouche
        spawn.mapRect(7450, -3650, 575, 50); //Bouche
        spawn.mapRect(7500, -3675, 525, 50); //Bouche
        spawn.mapRect(7550, -3700, 475, 50); //Bouche
        //Murs
        spawn.mapRect(7350, -5200, 1800, 1125);
        spawn.mapRect(8475, -4075, 675, 2825);
        spawn.mapRect(7300, -2100, 1175, 850);
        spawn.mapRect(7350, -3550, 850, 1275);
        //Escaliers
        spawn.mapRect(6600, -2100, 200, 75); //escaliers
        spawn.mapRect(6750, -2100, 750, 250); //escaliers
        spawn.mapRect(6950, -1850, 550, 200); //escaliers
        spawn.mapRect(6750, -1400, 750, 150); //escaliers
        spawn.mapRect(6550, -1625, 250, 375); //escaliers
        spawn.mapRect(6350, -1800, 250, 550); //escaliers
        spawn.mapRect(5600, -2275, 800, 1025); //escaliers
        // BLOCS
        if (isLevelReversed === false) { /// Normal spawn
            spawn.bodyRect(1350, -1175, 225, 25);
            spawn.bodyRect(1450, -1200, 25, 25);
        } else { /// Reversed spawn
            spawn.bodyRect(700, -1175, 225, 25);
            spawn.bodyRect(800, -1200, 25, 25);
        }
        spawn.bodyRect(1100, -1375, 225, 225);
        spawn.bodyRect(1775, -925, 75, 25);
        spawn.bodyRect(2225, -950, 75, 50);
        spawn.bodyRect(2000, -1000, 50, 100);
        spawn.bodyRect(3100, -1175, 50, 25);
        spawn.bodyRect(2200, -375, 50, 50);
        spawn.bodyRect(2200, -425, 50, 50);
        spawn.bodyRect(2200, -475, 50, 50);
        spawn.bodyRect(2200, -525, 50, 50);
        spawn.bodyRect(1050, -400, 50, 25);
        spawn.mapRect(2200, -650, 50, 125);
        spawn.mapRect(2200, -325, 50, 150);
        spawn.mapRect(2875, -225, 250, 50);
        spawn.mapRect(2050, -1225, 75, 100); //Plateforme over acid
        // MOBS
        if (isLevelReversed === false) { ///Normal spawn
            if (simulation.difficulty > 1) {
                if (Math.random() < 0.2) {
                    // tether ball
                    spawn.tetherBoss(7000, -3300, { x: 7300, y: -3300 })
                    if (simulation.difficulty > 4) spawn.nodeGroup(7000, -3300, "spawns", 8, 20, 105);
                } else {
                    spawn.randomLevelBoss(6100, -3600, ["shooterBoss", "launcherBoss", "laserTargetingBoss", "spiderBoss", "laserBoss", "pulsarBoss"]);
                }
            }
        } else { /// Reversed spawn
            if (simulation.difficulty > 1) {
                if (Math.random() < 0.2) {
                    // tether ball
                    spawn.tetherBoss(2300, -1300, { x: 2300, y: -1750 })
                    if (simulation.difficulty > 4) spawn.nodeGroup(2350, -1300, "spawns", 8, 20, 105);
                } else {
                    spawn.randomLevelBoss(2300, -1400, ["shooterBoss", "launcherBoss", "laserTargetingBoss", "spiderBoss", "laserBoss", "dragonFlyBoss", "pulsarBoss"]);
                }
            }
        }
        spawn.randomSmallMob(100, -1000, 1);
        spawn.randomSmallMob(1340, -675, 1);
        spawn.randomSmallMob(7000, -3750, 1);
        spawn.randomSmallMob(6050, -3200, 1);
        spawn.randomMob(1970 + 10 * Math.random(), -1150 + 20 * Math.random(), 1);
        spawn.randomMob(3500, -525, 0.8);
        spawn.randomMob(6700, -3700, 0.8);
        spawn.randomMob(2600, -1300, 0.7);
        spawn.randomMob(600, -1250, 0.7);
        spawn.randomMob(2450, -250, 0.6);
        spawn.randomMob(6200, -3200, 0.6);
        spawn.randomMob(900, -700, 0.5);
        spawn.randomMob(1960, -400, 0.5);
        spawn.randomMob(5430, -3520, 0.5);
        spawn.randomMob(400, -700, 0.5);
        spawn.randomMob(6500, -4000, 0.4);
        spawn.randomMob(3333, -400, 0.4);
        spawn.randomMob(3050, -1220, 0.4);
        spawn.randomMob(800, 1200, 0.3);
        spawn.randomMob(7200, -4000, 0.3);
        spawn.randomMob(250, -1550, 0.3);
        spawn.randomGroup(900, -1450, 0.3);
        spawn.randomGroup(2980, -400, 0.3);
        spawn.randomGroup(5750, -3860, 0.4);
        spawn.randomGroup(1130, 1300, 0.1);
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        powerUps.spawn(1900, -940, "heal");
        powerUps.spawn(3000, -230, "heal");
        powerUps.spawn(5450, -3675, "ammo");

        // SECRET BOSS AREA //
        //hidden house
        spawn.mapRect(-850, -2000, 600, 1150); //Toit hidden house
        spawn.mapRect(-2850, -2000, 2150, 4880); //Mur gauche hidden house
        spawn.mapRect(-850, -458, 500, 3340); //Bloc sol hidden house
        //
        spawn.mapRect(-400, 2025, 3450, 850); //Sol secret boss area
        spawn.mapRect(625, 1300, 225, 50); //Plateforme horizontale n°1 
        spawn.mapRect(850, 1775, 470, 50); //Plateforme horizontale n°2
        spawn.mapRect(1000, 1625, 100, 150); //Plateforme vertiale n°1
        spawn.mapRect(1400, 1275, 100, 100); //Plateforme carrée
        spawn.mapRect(1700, 1675, 75, 450); //Plateforme verticale n°2
        spawn.mapRect(2100, 1375, 450, 50); //Plateforme accroche boss
        spawn.mapRect(2900, 900, 175, 325); //Débord de toit droite haut
        spawn.mapRect(2900, 1675, 150, 350); //Muret en bas à droite
        spawn.mapRect(2900, 1225, 75, 100); //Picot haut entrée salle trésor
        spawn.mapRect(2900, 1575, 75, 100); //Picot bas entrée salle trésor
        spawn.mapRect(2800, 1575, 100, 25); //Plongeoir sortie salle trésor
        spawn.mapRect(3050, 1675, 400, 1200); //Sol sallle trésor
        spawn.mapRect(3075, 1075, 375, 150); //Plafond salle trésor
        spawn.mapRect(3300, 1075, 1500, 1800); //Mur droite salle trésor
        // tether ball
        spawn.tetherBoss(2330, 1850, { x: 2330, y: 1425 })
        spawn.secondaryBossChance(2330, 1850)
        //chance to spawn a ring of exploding mobs around this boss
        if (simulation.difficulty > 1) spawn.nodeGroup(2330, 1850, "spawns", 8, 20, 105);
        powerUps.chooseRandomPowerUp(3100, 1630);
    },
    // detours() { //by Francois from discord
    //     simulation.makeTextLog(`<strong>detours</strong> by <span class='color-var'>Francois</span>`);
    //     level.setPosToSpawn(0, 0); //lower start
    //     level.exit.y = 150;
    //     spawn.mapRect(level.enter.x, 45, 100, 20);
    //     level.exit.x = 10625;
    //     spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
    //     level.defaultZoom = 1400;
    //     simulation.zoomTransition(level.defaultZoom)
    //     document.body.style.backgroundColor = "#d5d5d5";
    //     const BGColor = "rgba(0,0,0,0.1)";
    //     // level.fill.push({
    //     //     x: -150,
    //     //     y: -250,
    //     //     width: 625,
    //     //     height: 325,
    //     //     color: BGColor
    //     // });
    //     // level.fill.push({
    //     //     x: 475,
    //     //     y: -520,
    //     //     width: 5375,
    //     //     height: 875,
    //     //     color: BGColor
    //     // });
    //     // level.fill.push({
    //     //     x: 5850,
    //     //     y: -1275,
    //     //     width: 2800,
    //     //     height: 2475,
    //     //     color: BGColor
    //     // });
    //     // level.fill.push({
    //     //     x: 8650,
    //     //     y: -500,
    //     //     width: 1600,
    //     //     height: 750,
    //     //     color: BGColor
    //     // });
    //     // level.fill.push({
    //     //     x: 10250,
    //     //     y: -700,
    //     //     width: 900,
    //     //     height: 950,
    //     //     color: BGColor
    //     // });
    //     const balance = level.spinner(5500, -412.5, 25, 660) //entrance
    //     const rotor = level.rotor(7000, 580, -0.001);
    //     const doorSortieSalle = level.door(8590, -520, 20, 800, 750)
    //     // let buttonSortieSalle
    //     // let portalEnBas
    //     let portalEnHaut
    //     // let door3isClosing = false;

    //     function drawOnTheMapMapRect(x, y, dx, dy) {
    //         spawn.mapRect(x, y, dx, dy);
    //         len = map.length - 1
    //         map[len].collisionFilter.category = cat.map;
    //         map[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
    //         Matter.Body.setStatic(map[len], true); //make static
    //         Composite.add(engine.world, map[len]); //add to world
    //         simulation.draw.setPaths() //update map graphics
    //     }

    //     function drawOnTheMapBodyRect(x, y, dx, dy) {
    //         spawn.bodyRect(x, y, dx, dy);
    //         len = body.length - 1
    //         body[len].collisionFilter.category = cat.body;
    //         body[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
    //         Composite.add(engine.world, body[len]); //add to world
    //         body[len].classType = "body"
    //     }

    //     function spawnCouloirEnHaut() {
    //         // level.fill.push({
    //         //     x: 2575,
    //         //     y: -1150,
    //         //     width: 2550,
    //         //     height: 630,
    //         //     color: BGColor
    //         // });
    //         // level.fill.push({
    //         //     x: 1900,
    //         //     y: -2300,
    //         //     width: 1650,
    //         //     height: 1150,
    //         //     color: BGColor
    //         // });
    //         // level.fill.push({
    //         //     x: 3550,
    //         //     y: -1625,
    //         //     width: 1650,
    //         //     height: 475,
    //         //     color: BGColor
    //         // });
    //         // level.fill.push({
    //         //     x: 1800,
    //         //     y: -1120,
    //         //     width: 775,
    //         //     height: 600,
    //         //     color: BGColor
    //         // });
    //         drawOnTheMapMapRect(3800, -270, 75, 75);
    //         drawOnTheMapMapRect(3900, -895, 500, 75);
    //         drawOnTheMapMapRect(3900, -1195, 75, 375);
    //         drawOnTheMapMapRect(3525, -1195, 450, 75);
    //         drawOnTheMapMapRect(3525, -1995, 50, 1575);
    //         drawOnTheMapMapRect(3325, -1995, 50, 1575);
    //         drawOnTheMapMapRect(3525, -1670, 1675, 75);
    //         drawOnTheMapMapRect(5100, -1670, 100, 1250);
    //         drawOnTheMapMapRect(1800, -1195, 1575, 75);
    //         drawOnTheMapMapRect(1800, -1520, 375, 400);
    //         drawOnTheMapMapRect(1800, -2370, 100, 1250);
    //         drawOnTheMapMapRect(2375, -1845, 375, 250);
    //         drawOnTheMapMapRect(2700, -1745, 650, 75);
    //         drawOnTheMapMapRect(1800, -2370, 1775, 100);
    //         drawOnTheMapMapRect(3525, -2370, 50, 775);
    //         drawOnTheMapMapRect(4650, -1220, 550, 75);
    //         drawOnTheMapBodyRect(3225, -1845, 100, 100);
    //         drawOnTheMapBodyRect(3575, 1255, 125, 25);
    //         drawOnTheMapBodyRect(2450, 2255, 25, 25);
    //         drawOnTheMapBodyRect(3975, -945, 175, 50);
    //         drawOnTheMapBodyRect(4825, -1295, 50, 75);
    //         drawOnTheMapBodyRect(4850, -720, 250, 200);
    //         drawOnTheMapBodyRect(4050, -970, 25, 25);
    //         drawOnTheMapBodyRect(3075, -1245, 50, 50);
    //         portalEnHaut = level.portal({
    //             x: 3650,
    //             y: -1470
    //         }, Math.PI / 2, {
    //             x: 3250,
    //             y: -1473
    //         }, Math.PI / 2)

    //         spawn.randomSmallMob(2500, -2070 + Math.random(), 1);
    //         spawn.randomSmallMob(5000, -1370, 1);
    //         spawn.randomMob(5000, -645, 0.9);
    //         spawn.randomMob(4050, -970, 0.9);
    //         spawn.randomSmallMob(2800, -1620, 0.7);
    //         spawn.randomMob(2400, -1370, 0.5);
    //         spawn.randomMob(3725, -1320, 0.3);
    //         spawn.randomGroup(2115, -2020, 0.1)

    //         powerUps.spawn(5000, -1275, "heal");

    //         levelCustom2();
    //     }
    //     //////////////////////////////////////////
    //     level.custom = () => {
    //         level.exit.drawAndCheck();
    //         rotor.rotate();
    //         // rotor2.rotate()

    //         level.enter.draw();
    //     };
    //     level.customTopLayer = () => {
    //         doorSortieSalle.draw();
    //         ctx.fillStyle = "#233"
    //         ctx.beginPath();
    //         ctx.arc(balance.pointA.x, balance.pointA.y, 9, 0, 2 * Math.PI);
    //         ctx.fill();
    //     };
    //     ////////////////////////////////////////
    //     function levelCustom2() {
    //         level.custom = () => {
    //             portalEnHaut[2].query();
    //             portalEnHaut[3].query();
    //             rotor.rotate();
    //             doorSortieSalle.openClose();
    //             level.exit.drawAndCheck();

    //             level.enter.draw();
    //         };
    //         // //////////////////////////////////////
    //         level.customTopLayer = () => {
    //             doorSortieSalle.draw();
    //             portalEnHaut[0].draw();
    //             portalEnHaut[1].draw();
    //             portalEnHaut[2].draw();
    //             portalEnHaut[3].draw();
    //             ctx.fillStyle = "#233"
    //             ctx.beginPath();
    //             ctx.arc(balance.pointA.x, balance.pointA.y, 9, 0, 2 * Math.PI);
    //             ctx.fill();

    //         };
    //     }
    //     //spawn box
    //     spawn.mapRect(-200, -295, 75, 425);
    //     spawn.mapRect(-200, 55, 700, 75);
    //     spawn.mapRect(-200, -295, 700, 75);
    //     spawn.bodyRect(470, -220, 25, 275); //porte spawn box
    //     //couloir
    //     spawn.mapRect(450, -520, 50, 300); //muret gauche haut
    //     spawn.mapRect(450, 55, 50, 300); //muret gauche bas
    //     spawn.mapRect(1700, -520, 50, 325); //muret 2 haut
    //     spawn.mapRect(1700, 55, 50, 300); //muret 2 bas
    //     spawn.mapRect(4375, 55, 50, 300);
    //     spawn.mapRect(4575, 55, 50, 300);
    //     spawn.bodyRect(4625, 155, 75, 100);
    //     spawn.bodyRect(4725, 230, 50, 25);
    //     if (Math.random() > 0.5) {
    //         powerUps.chooseRandomPowerUp(4500, 200);
    //     } else {
    //         powerUps.chooseRandomPowerUp(8350, -630);
    //     }
    //     //blocs
    //     spawn.bodyRect(7475, 1055, 50, 75);
    //     spawn.bodyRect(7775, 1105, 25, 25);
    //     spawn.bodyRect(6925, 1105, 125, 25);
    //     spawn.bodyRect(6375, 380, 50, 50);
    //     spawn.bodyRect(6425, -220, 125, 150);
    //     spawn.bodyRect(6475, -245, 125, 25);
    //     spawn.bodyRect(7675, -245, 100, 50);
    //     spawn.bodyRect(7075, -520, 50, 100);
    //     spawn.bodyRect(8400, -595, 100, 75);
    //     spawn.bodyRect(1700, 5, 50, 50);
    //     spawn.bodyRect(1700, -45, 50, 50);
    //     spawn.bodyRect(1700, -95, 50, 50);
    //     spawn.bodyRect(1700, -145, 50, 50);
    //     spawn.bodyRect(1700, -195, 50, 50);
    //     spawn.mapRect(450, -520, 1600, 100); //plafond 1
    //     spawn.mapRect(450, 255, 1600, 100); //sol 1
    //     spawn.mapRect(2250, -45, 1450, 75); //entresol
    //     spawn.mapRect(3900, -520, 2000, 100); //plafond 2
    //     spawn.mapRect(3900, 255, 2000, 100); //sol 2
    //     //grande salle
    //     spawn.bodyRect(5900, 830, 325, 300); //bloc en bas à gauche
    //     spawn.mapRect(5775, -1295, 2900, 100);
    //     spawn.mapRect(5775, 1130, 2900, 100); //plancher + sol grande salle
    //     spawn.mapRect(5925, -70, 650, 50); //plateforme middle entrée
    //     spawn.mapRect(7575, -520, 1100, 100); //sol salle en haut à droite
    //     spawn.mapRect(6800, -420, 450, 50); //petite plateforme transition vers salle en haut
    //     spawn.mapRect(7750, -1295, 75, 575); //mur gauche salle en haut à droite
    //     spawn.mapRect(6100, 430, 375, 50); //plateforme en bas, gauche rotor
    //     spawn.mapRect(7450, -195, 1225, 75); //longue plateforme
    //     //murs grande salle
    //     spawn.mapRect(5775, -1295, 125, 875);
    //     spawn.mapRect(5775, 255, 125, 975);
    //     spawn.mapRect(8550, -1295, 125, 875);
    //     spawn.mapRect(8550, 180, 125, 1050);
    //     //couloir 2
    //     spawn.mapRect(8875, -520, 1425, 325);
    //     spawn.mapRect(8550, -520, 1750, 100);
    //     spawn.mapRect(8550, 180, 2625, 100);
    //     spawn.mapRect(10175, -745, 125, 325);
    //     spawn.mapRect(10175, -745, 1000, 125);
    //     spawn.mapRect(11050, -745, 125, 1025);
    //     spawn.mapRect(8875, 80, 1425, 200);
    //     //MOBS
    //     spawn.randomSmallMob(900, -70, 1);
    //     spawn.randomMob(4300, 95, 1);
    //     spawn.randomSmallMob(6250, 630, 1);
    //     spawn.randomMob(6255, -835, 0.9);
    //     spawn.randomMob(8200, -900, 0.7);
    //     spawn.randomMob(5700, -270, 0.7);
    //     spawn.randomMob(8275, -320, 0.7);
    //     spawn.randomMob(2700, -270, 0.7);
    //     spawn.randomMob(7575, 950, 0.5);
    //     spawn.randomMob(7000, -695, 0.4);
    //     spawn.randomMob(1850, -345, 0.3);
    //     spawn.randomMob(3600, -270, 0.3);
    //     spawn.randomMob(1500, -270, 0.2);
    //     spawn.randomMob(1250, 55, 0.2);
    //     spawn.randomMob(8800, -45, 0.2);
    //     spawn.randomGroup(8025, -845, 0.2);

    //     if (simulation.difficulty > 2) {
    //         // if (Math.random() < 0.2) {
    //         //     // tether ball
    //         //     spawn.tetherBoss(8000, 630, { x: 8550, y: 680 })
    //         //     let me = mob[mob.length - 1];
    //         //     me.onDeath = function() { //please don't edit the onDeath function this causes serious bugs
    //         //         this.removeCons(); //remove constraint
    //         //         spawnCouloirEnHaut()
    //         //         doorSortieSalle.isClosing = false;
    //         //     };
    //         //     if (simulation.difficulty > 4) spawn.nodeGroup(8000, 630, "spawns", 8, 20, 105);
    //         // } else {
    //         spawn.randomLevelBoss(8000, 630, ["shooterBoss", "launcherBoss", "laserTargetingBoss", "spiderBoss", "laserBoss", "bomberBoss", "orbitalBoss", "pulsarBoss"]);
    //         spawn.secondaryBossChance(8000, 630)
    //         //find level boss index
    //         let me
    //         for (let i = 0, len = mob.length; i < len; i++) {
    //             if (mob[i].isBoss) me = mob[i]
    //         }
    //         if (me) {
    //             me.onDeath = function() { //please don't edit the onDeath function this causes serious bugs
    //                 spawnCouloirEnHaut()
    //                 doorSortieSalle.isClosing = false;
    //             };
    //         } else {
    //             spawnCouloirEnHaut()
    //             doorSortieSalle.isClosing = false;
    //         }
    //         // }
    //     } else {
    //         spawn.randomLevelBoss(8000, 630, ["shooterBoss"]);
    //         let me
    //         for (let i = 0, len = mob.length; i < len; i++) {
    //             if (mob[i].isBoss) me = mob[i]
    //         }
    //         if (me) {
    //             me.onDeath = function() { //please don't edit the onDeath function this causes serious bugs
    //                 spawnCouloirEnHaut()
    //                 doorSortieSalle.isClosing = false;
    //             };
    //         } else {
    //             spawnCouloirEnHaut()
    //             doorSortieSalle.isClosing = false;
    //         }
    //     }
    // },
    house() { //by Francois from discord
        simulation.makeTextLog(`<strong>house</strong> by <span class='color-var'>Francois</span>`);
        const rotor = level.rotor(4251, -325, 120, 20, 200, 0, 0.01, 0, -0.0001);
        const hazard = level.hazard(4350, -1000, 300, 110);
        const doorBedroom = level.door(1152, -1150, 25, 250, 250);
        const doorGrenier = level.door(1152, -1625, 25, 150, 160);
        const buttonBedroom = level.button(1250, -850);
        const voletLucarne1 = level.door(1401, -2150, 20, 26, 28);
        const voletLucarne2 = level.door(1401, -2125, 20, 26, 53);
        const voletLucarne3 = level.door(1401, -2100, 20, 26, 78);
        const voletLucarne4 = level.door(1401, -2075, 20, 26, 103);
        const voletLucarne5 = level.door(1401, -2050, 20, 26, 128);
        const voletLucarne6 = level.door(1401, -2025, 20, 26, 153);
        let hasAlreadyBeenActivated = false;
        let grd

        level.setPosToSpawn(0, -50); //normal spawn
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.exit.x = 3100;
        level.exit.y = -2480;
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
        level.defaultZoom = 1800
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "rgb(170 170 170)"

        level.custom = () => {
            ctx.fillStyle = "rgb(221, 221, 221)";
            ctx.fillRect(1175, -1425, 4000, 1200);
            ctx.fillStyle = "rgb(170 170 170)";
            ctx.fillRect(1650, -1300, 175, 150);
            ctx.fillStyle = "rgb(77, 76, 76)";
            ctx.fillRect(624, -1150, 28, 1075);
            ctx.fillStyle = "#ababab";
            ctx.fillRect(3420, -380, 285, 40);
            ctx.fillStyle = "#474747";
            ctx.fillRect(3555, -367.5, 15, 15);
            ctx.fillRect(3418, -344, 288, 8);
            ctx.fillRect(3555, -327.5, 15, 15);
            ctx.fillRect(3418, -304, 288, 8);
            ctx.fillRect(3555, -285, 15, 15);
            ctx.fillStyle = "#ababab";
            ctx.fillRect(3420, -340, 285, 40);
            ctx.fillRect(3420, -300, 285, 45);
            ctx.fillStyle = "rgba(141, 141, 141,1)";
            ctx.fillRect(3800, -1275, 250, 425);
            ctx.fillStyle = "#000";
            ctx.fillRect(3800, -1275, 250, 3);
            ctx.fillRect(4048, -1275, 3, 425);
            ctx.fillRect(3800, -1275, 3, 425);
            ctx.fillRect(3830, -1050, 35, 10);
            ctx.fillStyle = "rgba(225, 242, 245,0.6)";
            ctx.fillRect(4050, -1425, 1125, 600);
            ctx.fillStyle = "#444";
            ctx.fillRect(1736, -1300, 3, 150);
            ctx.fillRect(1650, -1224, 175, 3);
            ctx.fillStyle = "#5806ac";
            ctx.fillRect(3375, -625, 375, 175);
            ctx.fillStyle = "rgba(166, 166, 166,0.8)";
            ctx.fillRect(4050, -1425, 1, 600);
            ctx.fillRect(4090, -1425, 1, 600);
            ctx.fillRect(4130, -1425, 1, 600);
            ctx.fillRect(4170, -1425, 1, 600);
            ctx.fillRect(4210, -1425, 1, 600);
            ctx.fillRect(4250, -1425, 1, 600);
            ctx.fillRect(4290, -1425, 1, 600);
            ctx.fillRect(4330, -1425, 1, 600);
            ctx.fillRect(4370, -1425, 1, 600);
            ctx.fillRect(4410, -1425, 1, 600);
            ctx.fillRect(4450, -1425, 1, 600);
            ctx.fillRect(4490, -1425, 1, 600);
            ctx.fillRect(4530, -1425, 1, 600);
            ctx.fillRect(4570, -1425, 1, 600);
            ctx.fillRect(4610, -1425, 1, 600);
            ctx.fillRect(4650, -1425, 1, 600);
            ctx.fillRect(4690, -1425, 1, 600);
            ctx.fillRect(4730, -1425, 1, 600);
            ctx.fillRect(4770, -1425, 1, 600);
            ctx.fillRect(4810, -1425, 1, 600);
            ctx.fillRect(4850, -1425, 1, 600);
            ctx.fillRect(4890, -1425, 1, 600);
            ctx.fillRect(4930, -1425, 1, 600);
            ctx.fillRect(4970, -1425, 1, 600);
            ctx.fillRect(5010, -1425, 1, 600);
            ctx.fillRect(5050, -1425, 1, 600);
            ctx.fillRect(5090, -1425, 1, 600);
            ctx.fillRect(5130, -1425, 1, 600);
            ctx.fillRect(4050, -1425, 1125, 2);
            ctx.fillRect(4050, -1385, 1125, 2);
            ctx.fillRect(4050, -1345, 1125, 2);
            ctx.fillRect(4050, -1305, 1125, 2);
            ctx.fillRect(4050, -1265, 1125, 2);
            ctx.fillRect(4050, -1225, 1125, 2);
            ctx.fillRect(4050, -1185, 1125, 2);
            ctx.fillRect(4050, -1145, 1125, 2);
            ctx.fillRect(4050, -1105, 1125, 2);
            ctx.fillRect(4050, -1065, 1125, 2);
            ctx.fillRect(4050, -1025, 1125, 2);
            ctx.fillRect(4050, -985, 1125, 2);
            ctx.fillRect(4050, -945, 1125, 2);
            ctx.fillRect(4050, -905, 1125, 2);
            ctx.fillRect(4050, -865, 1125, 2);

            buttonBedroom.query();
            buttonBedroom.draw();
            if (buttonBedroom.isUp) {
                if (hasAlreadyBeenActivated == false) {
                    doorBedroom.isClosing = true;
                    doorGrenier.isClosing = true;
                    voletLucarne1.isClosing = true;
                    voletLucarne2.isClosing = true;
                    voletLucarne3.isClosing = true;
                    voletLucarne4.isClosing = true;
                    voletLucarne5.isClosing = true;
                    voletLucarne6.isClosing = true;
                }
            } else {
                doorBedroom.isClosing = false;
                doorGrenier.isClosing = false;
                voletLucarne1.isClosing = false;
                voletLucarne2.isClosing = false;
                voletLucarne3.isClosing = false;
                voletLucarne4.isClosing = false;
                voletLucarne5.isClosing = false;
                voletLucarne6.isClosing = false;
                if (hasAlreadyBeenActivated == false) {
                    hasAlreadyBeenActivated = true;
                }
            }
            doorBedroom.openClose();
            doorGrenier.openClose();
            voletLucarne1.openClose();
            voletLucarne2.openClose();
            voletLucarne3.openClose();
            voletLucarne4.openClose();
            voletLucarne5.openClose();
            voletLucarne6.openClose();
            rotor.rotate();
            ///
            grd = ctx.createRadialGradient(512.5, -1025, 5, 512.5, -1025, 100);
            grd.addColorStop(0, "rgb(255, 199, 43)");
            grd.addColorStop(1, "rgb(170 170 170)");
            ctx.fillStyle = grd;
            ctx.fillRect(450, -1025, 125, 100);
            ///
            grd = ctx.createRadialGradient(762.5, -1025, 5, 762.5, -1025, 100);
            grd.addColorStop(0, "rgb(255, 199, 43, 1)");
            grd.addColorStop(1, "rgb(170 170 170)");
            ctx.fillStyle = grd;
            ctx.fillRect(700, -1025, 125, 100);
            ///
            ctx.lineWidth = 7;
            ctx.strokeStyle = "#444444"
            ctx.strokeRect(1650, -1300, 175, 150);

            chair.force.y += chair.mass * simulation.g;
            chair2.force.y += chair2.mass * simulation.g;
            person.force.y += person.mass * simulation.g;
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            ctx.fillStyle = "rgba(64,64,64,0.97)";
            ctx.fillRect(2800, -400, 275, 175);

            hazard.query();
            doorBedroom.draw();
            doorGrenier.draw();
            voletLucarne1.draw();
            voletLucarne2.draw();
            voletLucarne3.draw();
            voletLucarne4.draw();
            voletLucarne5.draw();
            voletLucarne6.draw();
        };
        //chairs
        const part1 = Matter.Bodies.rectangle(4525, -255, 25, 200, {
            density: 0.0005,
            isNotHoldable: true,
        });
        const part2 = Matter.Bodies.rectangle(4562, -235, 100, 25, {
            density: 0.0005,
            isNotHoldable: true,
        });
        const part3 = Matter.Bodies.rectangle(4600, -202, 25, 91.5, {
            density: 0.0005,
            isNotHoldable: true,
        });
        const part4 = Matter.Bodies.rectangle(5100, -255, 25, 200, {
            density: 0.0005,
            isNotHoldable: true,
        });
        const part5 = Matter.Bodies.rectangle(5063, -235, 100, 25, {
            density: 0.0005,
            isNotHoldable: true,
        });
        const part6 = Matter.Bodies.rectangle(5025, -202, 25, 91.5, {
            density: 0.0005,
            isNotHoldable: true,
        });
        chair = Body.create({
            parts: [part1, part2, part3],
        });
        chair2 = Body.create({
            parts: [part4, part5, part6],
        });
        Composite.add(engine.world, [chair]);
        Composite.add(engine.world, [chair2]);
        composite[composite.length] = chair;
        composite[composite.length] = chair2;
        body[body.length] = part1;
        body[body.length] = part2;
        body[body.length] = part3;
        body[body.length] = part4;
        body[body.length] = part5;
        body[body.length] = part6;
        setTimeout(function() {
            chair.collisionFilter.category = cat.body;
            chair.collisionFilter.mask = cat.body | cat.player | cat.bullet | cat.mob | cat.mobBullet | cat.map
        }, 1000);
        setTimeout(function() {
            chair2.collisionFilter.category = cat.body;
            chair2.collisionFilter.mask = cat.body | cat.player | cat.bullet | cat.mob | cat.mobBullet | cat.map
        }, 1000);
        var head = Matter.Bodies.rectangle(300, -200 - 60, 34, 40, {
            isNotHoldable: true,
        });
        var chest = Matter.Bodies.rectangle(300, -200, 55, 80, {
            isNotHoldable: true,
        });
        var rightUpperArm = Matter.Bodies.rectangle(300 + 39, -200 - 15, 20, 40, {
            isNotHoldable: true,
        });
        var rightLowerArm = Matter.Bodies.rectangle(300 + 39, -200 + 25, 20, 60, {
            isNotHoldable: true,
        });
        var leftUpperArm = Matter.Bodies.rectangle(300 - 39, -200 - 15, 20, 40, {
            isNotHoldable: true,
        });
        var leftLowerArm = Matter.Bodies.rectangle(300 - 39, -200 + 25, 20, 60, {
            isNotHoldable: true,
        });
        var leftUpperLeg = Matter.Bodies.rectangle(300 - 20, -200 + 57, 20, 40, {
            isNotHoldable: true,
        });
        var leftLowerLeg = Matter.Bodies.rectangle(300 - 20, -200 + 97, 20, 60, {
            isNotHoldable: true,
        });
        var rightUpperLeg = Matter.Bodies.rectangle(300 + 20, -200 + 57, 20, 40, {
            isNotHoldable: true,
        });
        var rightLowerLeg = Matter.Bodies.rectangle(300 + 20, -200 + 97, 20, 60, {
            isNotHoldable: true,
        });

        //man 
        var person = Body.create({
            parts: [chest, head, leftLowerArm, leftUpperArm,
                rightLowerArm, rightUpperArm, leftLowerLeg,
                rightLowerLeg, leftUpperLeg, rightUpperLeg
            ],
        });
        Composite.add(engine.world, [person]);
        composite[composite.length] = person
        body[body.length] = chest
        body[body.length] = head
        body[body.length] = part3
        body[body.length] = leftLowerLeg
        body[body.length] = leftUpperLeg
        body[body.length] = leftUpperArm
        body[body.length] = leftLowerArm
        body[body.length] = rightLowerLeg
        body[body.length] = rightUpperLeg
        body[body.length] = rightLowerArm
        body[body.length] = rightUpperArm
        setTimeout(function() {
            person.collisionFilter.category = cat.body;
            person.collisionFilter.mask = cat.body | cat.player | cat.bullet | cat.mob | cat.mobBullet | cat.map
        }, 1000);

        //rez de chaussée
        spawn.mapRect(-200, 0, 5400, 100); //ground
        spawn.mapRect(1150, -255, 4050, 355); //additionnal ground
        spawn.mapRect(800, -255, 400, 90); //1st step
        spawn.mapRect(650, -170, 550, 90); //2nd step
        spawn.mapRect(500, -85, 700, 90); //3rd step
        spawn.mapRect(1150, -850, 50, 175); //porte entrée
        spawn.bodyRect(1162.5, -675, 25, 420) //porte entrée
        spawn.mapRect(1150, -850, 1500, 50); //plafond 1
        spawn.mapRect(3025, -850, 2175, 50); //plafond 2
        spawn.mapRect(5150, -850, 50, 650); //mur cuisine
        //lave-vaisselle
        spawn.mapRect(4225, -400, 25, 150);
        spawn.mapRect(4225, -400, 175, 25);
        spawn.mapRect(4375, -400, 25, 150);
        spawn.bodyRect(4350, -350, 20, 40);
        spawn.bodyRect(4325, -325, 20, 20);
        spawn.bodyRect(4325, -275, 20, 20);
        //escalier
        spawn.mapRect(3025, -850, 50, 225);
        spawn.mapRect(2925, -775, 150, 150);
        spawn.mapRect(2800, -700, 275, 75);
        spawn.mapRect(2575, -400, 175, 175);
        spawn.mapRect(2475, -325, 175, 100);
        spawn.mapRect(2675, -475, 400, 100);
        spawn.mapRect(2675, -475, 150, 250);
        //cuisine
        spawn.mapRect(4025, -850, 50, 175); //porte cuisine
        spawn.mapRect(4025, -375, 50, 125); //porte cuisine

        map[map.length] = Bodies.polygon(4050, -675, 0, 15); //circle above door
        spawn.bodyRect(4040, -650, 20, 260, 1, spawn.propsDoor); // door
        body[body.length - 1].isNotHoldable = true;
        //makes door swing
        consBB[consBB.length] = Constraint.create({
            bodyA: body[body.length - 1],
            pointA: {
                x: 0,
                y: -130
            },
            bodyB: map[map.length - 1],
            stiffness: 1
        });
        Composite.add(engine.world, consBB[consBB.length - 1]);

        //table + chaises
        spawn.mapRect(4025, -850, 50, 175);
        spawn.mapRect(4650, -375, 325, 25);
        spawn.mapRect(4700, -350, 25, 100);
        spawn.mapRect(4900, -350, 25, 100);
        spawn.bodyRect(4875, -400, 75, 25);
        spawn.bodyRect(4700, -400, 75, 25);

        //murs télé
        spawn.mapRect(3400, -400, 20, 150);
        spawn.mapRect(3705, -400, 20, 150);
        spawn.mapRect(3400, -400, 325, 20);
        //socle écran
        spawn.mapRect(3500, -415, 125, 17);
        spawn.mapRect(3550, -450, 25, 50);
        // ???
        spawn.bodyRect(3075, -375, 125, 125);
        spawn.bodyRect(3075, -400, 50, 25);
        spawn.bodyRect(3725, -325, 100, 75);
        spawn.bodyRect(3375, -275, 25, 25);
        // premier étage
        spawn.mapRect(1150, -1450, 4050, 50);
        spawn.mapRect(5150, -1450, 50, 650);
        spawn.mapRect(1150, -1450, 50, 300);
        spawn.mapRect(1150, -900, 50, 100);
        spawn.mapVertex(1066, -730, "-200 60  0 -60  100 -60  100 60")
        //chambre
        spawn.mapRect(2350, -1450, 50, 175); //porte chambre
        //lit
        spawn.mapRect(1475, -1025, 25, 225); //pied de lit 1
        spawn.mapRect(1850, -925, 25, 125); //pied de lit 2
        spawn.mapRect(1475, -925, 400, 50); //sommier
        spawn.bodyRect(1500, -950, 375, 25); //matelat 
        spawn.bodyRect(1500, -1000, 75, 50); //oreiller
        //table
        spawn.bodyRect(1950, -1000, 30, 150); //pied table
        spawn.bodyRect(2250, -1000, 30, 150); //pied table
        spawn.bodyRect(1920, -1025, 390, 25); //table 
        //salle de bain
        spawn.mapRect(4025, -1450, 50, 175); //porte salle de bain
        map[map.length] = Bodies.polygon(5050, -925, 0, 35.4);
        spawn.mapRect(5015, -960, 125, 40);
        spawn.mapRect(5050, -925, 90, 35.4);
        spawn.mapVertex(5086.5, -875, "100 60  -30 60   20 0 100 0")
        spawn.mapRect(5125, -1070, 15, 120)
        spawn.bodyRect(5016, -965, 108, 15)
        //baignoire
        spawn.mapVertex(4316, -965, "30 100  0 100   -80 -50  30 -50") //bord 1
        spawn.mapVertex(4675, -961.5, "30 100  0 100   0 -50  80 -50") //bord 2
        spawn.mapVertex(4400, -860, "0 -20  -20 20   20 20  0 -20") //pied 1
        spawn.mapVertex(4600, -860, "0 -20  -20 20   20 20  0 -20") //pied 2
        spawn.mapRect(4325, -900, 350, 25); //fond baignoire
        spawn.mapRect(4300, -1175, 25, 175);
        spawn.mapRect(4300, -1175, 125, 25);
        spawn.mapRect(4400, -1175, 25, 50); //pied pommeau de douche
        spawn.mapVertex(4412.5, -1105, "-20 -20  -30 40   30 40  20 -20") //pommeau de douche

        //grenier
        spawn.mapRect(1150, -1475, 50, 50);
        spawn.mapRect(1150, -1800, 50, 175);
        spawn.mapRect(5150, -1800, 50, 400); //murs
        spawn.mapVertex(1300, -1900, "-150 200  -200 200   50 0 100 0");
        spawn.mapVertex(1800, -2300, "-150 200  -200 200   175 -100 225 -100");
        spawn.mapRect(1390, -2180, 250, 30); //lucarne
        spawn.mapVertex(5050, -1900, "150 200  200 200   -50 0 -100 0");
        spawn.mapVertex(4550, -2300, "150 200  200 200   -175 -100 -225 -100");
        spawn.mapRect(4710, -2175, 250, 25); //lucarne 2
        spawn.mapRect(5150, -1450, 200, 50);
        //obstacles
        spawn.mapRect(3775, -1800, 99, 50);
        spawn.mapRect(2425, -2150, 50, 425);
        spawn.mapRect(2150, -1775, 325, 50);
        spawn.mapRect(3825, -2150, 50, 750);
        spawn.mapRect(3826, -2150, 149, 50);
        spawn.mapRect(4125, -2150, 149, 50);
        spawn.mapRect(4225, -2150, 50, 450);
        spawn.mapRect(4225, -1750, 250, 50);
        level.chain(2495, -2130, 0, true, 10);

        spawn.bodyRect(2950, -375, 120, 120) //bloc hidden zone
        spawn.bodyRect(2350, -1850, 75, 75);
        spawn.bodyRect(4275, -1900, 75, 100);
        spawn.bodyRect(4825, -1650, 325, 200);
        spawn.bodyRect(5025, -1725, 25, 25);
        spawn.bodyRect(4900, -1700, 200, 75);
        spawn.mapVertex(2950, -2096, "-75 -50  75 -50  75 0  0 100  -75 0")

        /*cheminée + roof*/
        spawn.mapRect(1963, -2450, 2425, 35);
        spawn.mapRect(2925, -2900, 125, 480);
        spawn.mapRect(2900, -2900, 175, 75);
        spawn.mapRect(2900, -2975, 25, 100);
        spawn.mapRect(3050, -2975, 25, 100);
        spawn.mapRect(2875, -3000, 225, 25);
        // lampadaire + jump 
        spawn.mapRect(1000, -1450, 200, 25);
        spawn.mapRect(500, -1150, 275, 25);
        spawn.mapRect(750, -1150, 25, 75);
        spawn.mapRect(500, -1150, 25, 75);
        spawn.mapRect(450, -1075, 125, 50);
        spawn.mapRect(700, -1075, 125, 50);
        spawn.mapRect(2985, -4600, 0.1, 1700)

        //bodyRects ~= debris
        spawn.bodyRect(1740, -475, 80, 220)
        spawn.bodyRect(1840, -290, 38, 23)
        spawn.bodyRect(1200 + 1475 * Math.random(), -350, 15 + 110 * Math.random(), 15 + 110 * Math.random());
        spawn.bodyRect(1200 + 1475 * Math.random(), -350, 15 + 110 * Math.random(), 15 + 110 * Math.random());
        spawn.bodyRect(3070 + 600 * Math.random(), -1100, 20 + 50 * Math.random(), 150 + 100 * Math.random())
        spawn.bodyRect(3050 + 1000 * Math.random(), -920, 30 + 100 * Math.random(), 15 + 65 * Math.random());
        spawn.bodyRect(1600 + 250 * Math.random(), -1540, 80, 220) //boss room
        spawn.debris(3070, -900, 1000, 3); //16 debris per level
        spawn.debris(1200, -350, 1475, 4); //16 debris per level
        spawn.debris(1250, -1550, 3565, 9); //16 debris per level

        powerUps.chooseRandomPowerUp(2860, -270);
        // Mobs

        spawn.randomSmallMob(1385, -600, 1);
        spawn.randomSmallMob(5000, -680, 1);
        spawn.randomSmallMob(4750, -925, 1);
        spawn.randomSmallMob(2300, -1830, 1);
        spawn.randomMob(3170, -720, 0.8);
        spawn.randomMob(3700, -975, 0.8);
        spawn.randomMob(2625, -1150, 0.7);
        spawn.randomMob(4175, -750, 0.7);
        spawn.randomMob(2100, -370, 0.7);
        spawn.randomMob(2000, -1230, 0.7);
        spawn.randomMob(4175, -1075, 0.6);
        spawn.randomMob(3965, -1650, 0.6)
        spawn.randomMob(4650, -1750, 0.6);
        spawn.randomMob(830, -1170, 0.5);
        spawn.randomGroup(3730, -1100, 0.5);
        spawn.randomMob(2650, -2250, 0.3);
        spawn.randomMob(1615, -2270, 0.3);
        spawn.randomMob(1380, -1280, 0.25);
        spawn.randomMob(2280, -650, 0.2);
        spawn.randomGroup(2450, -2650, 0.2);
        spawn.randomMob(3800, -580, 0.2);
        spawn.randomMob(4630, -425, 0.1);
        spawn.randomGroup(630, -1300, -0.1);
        spawn.randomGroup(3450, -2880, -0.2)
        if (simulation.difficulty > 3) {
            spawn.secondaryBossChance(3380, -1775)
            if (Math.random() < 0.16) {
                spawn.tetherBoss(3380, -1775, { x: 3775, y: -1775 })
                if (simulation.difficulty > 4) spawn.nodeGroup(3380, -1775, "spawns", 8, 20, 105); //chance to spawn a ring of exploding mobs around this boss
            } else {
                spawn.randomLevelBoss(3100, -1850, ["shooterBoss", "spiderBoss", "launcherBoss", "laserTargetingBoss", "dragonFlyBoss", "laserBoss"]);
            }
        }
    },
    perplex() { //by Oranger from discord
        simulation.makeTextLog(`<strong>perplex</strong> by <span class='color-var'>Oranger</span>`);
        document.body.style.backgroundColor = "#dcdcde";
        level.setPosToSpawn(-600, 400);
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.exit.x = 550;
        level.exit.y = -2730;
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);

        const portal = level.portal({ //main portals
            x: -1000,
            y: 50
        }, -Math.PI / 2, { //up
            x: 1000,
            y: 50
        }, -Math.PI / 2) //up
        const portal2 = level.portal({ //portals in upper right corner
            x: 1400,
            y: -2200
        }, -Math.PI / 2, { //up
            x: 1700,
            y: -1700
        }, -Math.PI / 2) //up
        //    rotor(x, y, width, height, density = 0.001, angle = 0, frictionAir = 0.001, angularVelocity = 0, rotationForce = 0.0005) {
        const rotor = level.rotor(-600, -1950, 800, 50, 0.001, 0, 0.01, 0, -0.001)

        level.custom = () => {
            portal[2].query(true)
            portal[3].query(true)
            portal2[2].query(true)
            portal2[3].query(true)
            rotor.rotate();

            ctx.fillStyle = "#d4f4f4";
            ctx.fillRect(375, -3000, 450, 300);
            level.exit.drawAndCheck();

            level.enter.draw();
        };

        level.customTopLayer = () => {
            portal[0].draw();
            portal[1].draw();
            portal[2].draw();
            portal[3].draw();
            portal2[0].draw();
            portal2[1].draw();
            portal2[2].draw();
            portal2[3].draw();
            ctx.fillStyle = "rgba(0,0,0,0.03)";
            ctx.fillRect(-875, -250, 1500, 700);
            ctx.fillRect(-925, -505, 930, 255);
            ctx.fillStyle = "rgba(0,0,0,0.1)";
            ctx.fillRect(725, -1400, 200, 200);
            ctx.fillRect(925, -2150, 150, 2175);
            ctx.fillRect(925, -3400, 150, 850);
            ctx.fillStyle = "rgba(0,0,0,0.03)";
            ctx.fillRect(1800, -2600, 400, 400);
            ctx.fillRect(2200, -2600, 400, 1250);

        };

        level.defaultZoom = 1700 // 4500 // 1400
        simulation.zoomTransition(level.defaultZoom)

        //section 1: before portals
        spawn.mapRect(-925, 450, 1850, 250); //1-1 base
        spawn.mapRect(-925, -300, 55, 755); //1 left wall
        spawn.mapRect(-875, 50, 1100, 50); //1-1 ceiling
        spawn.mapRect(620, -300, 305, 755); //1-1 and 1-2 right wall
        spawn.bodyRect(200, 350, 230, 100);
        spawn.bodyRect(300, 250, 150, 100);
        spawn.mapRect(-875, -300, 580, 50); //1-2 ceiling on left
        spawn.mapRect(0, -300, 625, 50); //1-2 ceiling on right
        spawn.mapRect(0, -650, 150, 350); //1-3 right wall
        spawn.mapRect(-925, -650, 975, 150); //1-3 ceiling
        spawn.mapRect(-1280, 100, 205, 150); //1-4 floor
        spawn.mapRect(-1280, 245, 360, 455); //bottom left corner
        spawn.mapRect(-1600, -200, 200, 50); //1-4 platform 1

        //section 2: lower central room (gone through main portals 1 time)
        spawn.mapRect(920, 245, 160, 455); //below right portal
        spawn.mapRect(1075, -300, 500, 1000); //2-1 right floor
        spawn.bodyRect(100, -1000, 50, 350);
        spawn.bodyRect(100, -1015, 250, 15);
        spawn.mapRect(-925, -1600, 100, 1000); //2-2 left wall
        spawn.mapRect(725, -2150, 200, 750); //2-2 right wall
        spawn.mapRect(725, -1200, 200, 200); //2-2 right wall 2
        spawn.mapRect(300, -1000, 625, 50); //2 central ledge
        //shute
        spawn.mapRect(1075, -2005, 550, 1055); //shute right wall
        spawn.mapRect(875, -1000, 50, 300); //shute left 1
        spawn.mapRect(860, -1030, 50, 300); //shute left 2
        spawn.mapRect(850, -1100, 50, 300); //shute left 3
        spawn.mapRect(830, -980, 50, 50); //shute left 4
        spawn.mapRect(1075, -1000, 50, 300); //shute right 1
        spawn.mapRect(1090, -1030, 50, 300); //shute right 2
        spawn.mapRect(1100, -1100, 50, 300); //shute right 3
        spawn.mapRect(1120, -980, 50, 50); //shute right 4
        spawn.mapRect(1850, -650, 400, 50); //drop from 4-1
        //section 3: upper left room and upper central room (gone through main portals 2 times)
        //3-2 is just the upper part of 2-2
        spawn.mapRect(-1775, -1000, 700, 300); //3-1 floor
        spawn.mapRect(-1900, -2300, 175, 1600); //3-1 left wall
        spawn.mapRect(-1375, -1300, 300, 50); //3-1 platform 1
        spawn.mapRect(-1600, -1650, 300, 50); //3-1 platform 2
        spawn.mapRect(-1775, -2300, 700, 300); //3-1 ceiling
        spawn.mapRect(-830, -1600, 300, 50); //3-2 left ledge
        spawn.mapRect(250, -2150, 675, 50); //3-2 right ledge
        spawn.mapRect(-925, -2300, 100, 300); //3-2 left wall
        spawn.mapRect(-600, -2700, 1525, 150); //3-2 ceiling
        spawn.mapRect(1075, -2150, 250, 150); //next to upper portal
        // level.fill.push({
        //     x: -1730,
        //     y: -2300,
        //     width: 870,
        //     height: 1600,
        //     color: "rgba(0,0,0,0.03)"
        // });

        //section 4: upper right portals
        spawn.mapRect(1475, -2700, 150, 700); //4-1 left wall
        spawn.mapRect(1775, -1650, 250, 150); //4-1 floor-ish
        spawn.mapRect(1575, -1505, 450, 555); //below upper right portal
        spawn.mapRect(1800, -2250, 400, 50); //4-1 platform 2
        spawn.bodyRect(2200, -2250, 15, 300);
        spawn.mapRect(2200, -1950, 400, 50); //4-1 platform 1
        //spawn.bodyRect(2575, -2600, 25, 650);
        spawn.mapRect(2600, -1650, 400, 50); //4-1 platform 0
        spawn.mapRect(2200, -1350, 400, 50); //4-1 platform -1
        spawn.bodyRect(2200, -1900, 15, 550);
        spawn.bodyRect(2585, -1650, 15, 300);

        spawn.mapRect(1800, -4200, 800, 1600); //4-2 right wall
        spawn.mapRect(800, -4200, 1800, -500); //4-2 ceiling
        spawn.mapRect(1075, -3400, 225, 850); //upper shute right wall
        spawn.mapRect(800, -3400, 125, 850); //upper shute left wall

        //section 5: after portals (gone through main portals 3 times)
        spawn.mapRect(-700, -2700, 100, 450); //5-1 right wall
        spawn.mapRect(-1450, -2700, 900, 50); //5-1 ceiling
        spawn.mapRect(-925, -2300, 325, 50); //5-1 right floor
        spawn.mapRect(-1900, -3000, 450, 50); //stair cover
        spawn.bodyRect(-1150, -2950, 150, 250); //5-2 block

        //top left corner stuff    
        spawn.mapRect(-1900, -2450, 250, 450); //
        //exit room
        spawn.mapRect(350, -3000, 50, 100); //exit room left wall
        spawn.mapRect(350, -3000, 450, -1700); //exit room ceiling
        spawn.bodyRect(350, -2900, 50, 50.5); //door
        spawn.bodyRect(350, -2850, 50, 50.5); //door
        spawn.bodyRect(350, -2800, 50, 50.5); //door
        spawn.bodyRect(350, -2750, 50, 50.5); //door

        spawn.debris(-400, 450, 400, 5); //16 debris per level
        spawn.debris(-1650, -2300, 250, 4); //16 debris per level
        spawn.debris(-750, -650, 750, 3); //16 debris per level

        //mobs
        spawn.randomMob(-650, -100, 0.7); //1-2 left
        spawn.randomMob(100, -150, 0.3); //1-2 right
        spawn.randomMob(-100, -400, 0); //1-3 right
        //spawn.randomMob(-1500, -300, 0.3);   //1-4 platform
        spawn.randomMob(1450, -450, 0); //2-1 right
        spawn.randomMob(1700, -800, 1); //2-1 off the edge. chance is 1 because some enemies just fall
        spawn.randomGroup(-550, -900, -0.3); //2-2 
        spawn.randomMob(-1550, -1800, 0.7); //3-1 upper platform
        //spawn.randomMob(-1225, -1400, 0.3);  //3-1 lower platform
        spawn.randomMob(450, -2350, 0.3); //3-2 right ledge
        //spawn.randomMob(1150, -2250, 0);     //3-2 far right
        spawn.randomGroup(2400, -2300, -0.3); //4-1 floating
        spawn.randomMob(2400, -1450, 0); //4-1 platform -1
        spawn.randomMob(2800, -1800, 0.5); //4-1 platform 0
        spawn.randomMob(-1700, -3200, 0.7); //5-2 left platform
        spawn.randomMob(-550, -2800, 0.3); //5-2 middle
        if (simulation.difficulty > 3) {
            if (Math.random() < 0.5) {
                spawn.randomLevelBoss(450, -1350, ["shooterBoss", "launcherBoss", "laserTargetingBoss", "streamBoss", "shieldingBoss", "pulsarBoss", "laserBoss"]);
            } else {
                spawn.randomLevelBoss(-300, -3200, ["shooterBoss", "launcherBoss", "laserTargetingBoss", "streamBoss", "shieldingBoss", "pulsarBoss", "laserBoss"]);
            }
        }
        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(7725, 2275)
    },
    coliseum() {
        simulation.makeTextLog(`<strong>coliseum</strong> by <span class='color-var'>iNoobBoi</span>`);
        level.custom = () => {
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {};
        level.defaultZoom = 1800
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#dcdcde";
        //Level
        level.setPosToSpawn(200, 50);
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

        level.exit.x = 8950;
        level.exit.y = 170;
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);

        //Map
        spawn.mapRect(-100, -400, 100, 600);
        spawn.mapRect(-100, 100, 700, 100);
        spawn.mapRect(500, 100, 100, 1700);
        spawn.mapRect(500, 1700, 4000, 100);
        spawn.mapRect(4100, 600, 400, 100);
        spawn.mapRect(4400, 600, 100, 1600);
        spawn.mapRect(4400, 2100, 4300, 100);
        spawn.mapRect(8600, 200, 100, 2000);
        spawn.mapRect(8600, 200, 700, 100);
        spawn.mapRect(9200, -300, 100, 600);
        spawn.mapRect(8600, -300, 700, 100);
        spawn.mapRect(8600, -700, 100, 500);
        spawn.mapRect(4400, -700, 4300, 100);
        spawn.mapRect(4400, -700, 100, 900);
        spawn.mapRect(-100, -400, 4600, 100);

        //Platforms
        spawn.mapRect(1100, 400, 300, 100);
        spawn.mapRect(500, 500, 300, 100);
        spawn.mapRect(1050, 800, 300, 100);
        spawn.mapRect(1770, 1050, 300, 100);
        spawn.mapRect(1800, 500, 300, 100);
        spawn.mapRect(2550, 900, 300, 100);
        spawn.mapRect(2800, 1400, 300, 100);
        spawn.mapRect(1250, 1350, 300, 100);
        spawn.mapRect(4750, 850, 300, 100);
        spawn.mapRect(3200, 1050, 300, 100);
        spawn.mapRect(4700, 100, 300, 100);
        spawn.mapRect(5350, 0, 300, 100);
        spawn.mapRect(3800, 900, 300, 100);
        spawn.mapRect(5100, 500, 300, 100);
        spawn.mapRect(5900, -300, 300, 100);
        spawn.mapRect(6500, -700, 300, 1300);
        spawn.mapRect(7900, 0, 300, 100);
        spawn.mapRect(8050, 800, 300, 100);
        spawn.mapRect(7800, 1900, 300, 100);
        spawn.mapRect(8300, 450, 300, 100);
        spawn.mapRect(8400, 1200, 300, 100);
        spawn.mapRect(7570, 1100, 300, 100);
        spawn.mapRect(6700, 1850, 300, 100);
        spawn.mapRect(8000, 1500, 300, 100);
        spawn.mapRect(7120, -100, 300, 100);
        spawn.mapRect(7000, 1500, 300, 100);
        spawn.mapRect(6500, 1000, 300, 1200);
        spawn.mapRect(5800, 1100, 300, 100);
        spawn.mapRect(5900, 1700, 300, 100);
        spawn.mapRect(5300, 1400, 300, 100);
        spawn.mapRect(5200, 1100, 300, 100);
        spawn.mapRect(6700, 1100, 300, 100);
        spawn.mapRect(4800, 1650, 300, 100);

        //Room 1 Spawning
        spawn.randomMob(1000, 700, 0.7);
        spawn.randomGroup(1100, 700, 0.5);
        spawn.randomMob(1900, 400, 0.7);
        spawn.randomGroup(2000, 400, 0.4);
        spawn.randomGroup(1800, 1100, 0.4);
        spawn.randomGroup(2700, 700, 0.5);
        spawn.randomMob(2900, 1200, 0.7);
        spawn.randomSmallMob(3200, 300, 0.9);
        spawn.randomSmallMob(3700, 800, 0.9);
        spawn.randomMob(1100, 700, 0.6);
        spawn.randomGroup(1200, 700, 0.5);
        spawn.randomMob(2000, 400, 0.8);
        spawn.randomGroup(2100, 400, 0.5);
        spawn.randomGroup(1900, 1100, 0.5);
        spawn.randomGroup(2800, 700, 0.5);
        spawn.randomMob(3000, 1200, 0.7);
        spawn.randomSmallMob(3200, 300, 0.9);
        spawn.randomSmallMob(3700, 800, 0.9);
        spawn.randomMob(800, 1500, 0.9);
        spawn.randomMob(1500, 1500, 0.7);
        spawn.randomMob(2200, 1500, 0.6);
        spawn.randomMob(2500, 1500, 0.7);
        spawn.randomMob(2800, 1500, 0.7);
        spawn.randomMob(3300, 1500, 0.6);

        //Room 2 Spawning
        spawn.randomGroup(4700, 2000, 0.9);
        spawn.randomMob(5000, 2000, 0.5);
        spawn.randomSmallMob(5700, 1500, 0.9);
        spawn.randomMob(8500, 2000, 0.6);
        spawn.randomGroup(8000, 1300, 0.9);
        spawn.randomMob(8300, -300, 0.4);
        spawn.randomSmallMob(7600, -200, 0.9);
        spawn.randomMob(5200, -300, 0.5);
        spawn.randomSmallMob(4700, -200, 0.5);
        spawn.randomGroup(4700, 2000, 0.8);
        spawn.randomMob(5000, 2000, 0.5);
        spawn.randomSmallMob(5700, 1500, 0.9);
        spawn.randomGroup(8500, 2000, 0.3);
        spawn.randomSmallMob(8000, 1300, 0.4);
        spawn.randomMob(8300, -300, 0.3);
        spawn.randomGroup(7600, -200, 0.5);
        spawn.randomMob(5200, -300, 0.3);
        spawn.randomGroup(4700, -200, 0.4);
        spawn.randomGroup(8650, -200, 0.9); //end guards
        spawn.randomMob(8650, -200, 0.9); //end guards


        //Boss Spawning 
        if (simulation.difficulty > 3) {
            spawn.randomLevelBoss(6000, 700, ["pulsarBoss", "laserTargetingBoss", "powerUpBoss", "bomberBoss", "historyBoss", "orbitalBoss"]);
            // if (simulation.difficulty > 10) spawn.shieldingBoss(7200, 500);
            // if (simulation.difficulty > 20) spawn.randomLevelBoss(2000, 300, ["historyBoss", "shooterBoss"]);
        }

        //Blocks
        spawn.bodyRect(550, -300, 50, 400); //spawn door
        spawn.bodyRect(4400, 200, 100, 400); //boss door
        spawn.bodyRect(6600, 600, 50, 400); //boss 2 door
        spawn.debris(400, 800, 400, 2);
        spawn.debris(3800, 1600, 1200, 6);
        spawn.debris(7500, 2000, 800, 4);
        spawn.debris(5500, 2000, 800, 4);

        //Powerups
        powerUps.spawnStartingPowerUps(1250, 1500);
        // powerUps.spawnStartingPowerUps(1500, 1500);
        powerUps.spawn(8650, -200, "ammo");
        // powerUps.spawn(8650, -200, "ammo");
        // powerUps.spawn(8650, -200, "ammo");
        // powerUps.spawn(8650, -200, "ammo");
        powerUps.spawn(200, 50, "heal");
        // powerUps.spawn(200, 50, "ammo");
        // powerUps.spawn(200, 50, "ammo");
        // powerUps.spawn(200, 50, "ammo");

        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        spawn.secondaryBossChance(6600, 600)
    },
    crossfire() {
        simulation.makeTextLog(`<strong>crossfire</strong> by <span class='color-var'>iNoobBoi</span>`);

        //*1.5
        //Level Setup
        const slimePitOne = level.hazard(0, 850, 3800, 120);
        const slimePitTwo = level.hazard(4600, 430, 2000, 120);
        const slimePitThree = level.hazard(6500, 200, 1000, 170);

        level.custom = () => {
            level.exit.drawAndCheck();

            level.enter.draw();
        };
        level.customTopLayer = () => {
            slimePitOne.query();
            slimePitTwo.query();
            slimePitThree.query();
        };

        level.setPosToSpawn(-500, 550); //normal spawn
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

        level.exit.x = 10300;
        level.exit.y = -830;
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);

        level.defaultZoom = 3000
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#dcdcde";

        //Map Elements
        spawn.mapRect(-800, -600, 800, 200);
        spawn.mapRect(-200, -600, 200, 800);
        spawn.mapRect(-800, -600, 200, 800);
        spawn.mapRect(-1000, 0, 1000, 200);
        spawn.mapRect(-1000, 0, 200, 800);
        spawn.mapRect(-1000, 600, 1400, 200);
        spawn.mapRect(0, 600, 200, 400);
        spawn.mapRect(0, 950, 4000, 100);
        spawn.mapRect(800, 800, 600, 200);
        spawn.mapRect(1700, 700, 500, 300);
        spawn.mapRect(2500, 600, 400, 400);
        spawn.mapRect(3200, 600, 1200, 200);
        spawn.mapRect(3800, 600, 200, 800); //
        spawn.mapRect(3800, 1200, 800, 200);
        spawn.mapRect(4400, 400, 300, 1000);
        spawn.mapRect(4400, 500, 2000, 100);
        spawn.mapRect(6500, 300, 1000, 100);
        spawn.mapRect(5000, 200, 700, 400);
        spawn.mapRect(6000, 0, 650, 600);
        spawn.mapRect(6900, -300, 700, 100);
        spawn.mapRect(7400, -600, 200, 1100);
        spawn.mapRect(7400, 300, 2600, 200);
        spawn.mapRect(9800, -800, 200, 1300);
        spawn.mapRect(9800, -800, 1000, 200);
        spawn.mapRect(10600, -1400, 200, 800);
        spawn.mapRect(9800, -1400, 200, 400);
        spawn.mapRect(7400, -1400, 3400, 200);
        spawn.mapRect(7400, -1600, 200, 800);
        spawn.mapRect(5400, -1600, 2200, 200);
        spawn.mapRect(6000, -1600, 200, 800);
        spawn.mapRect(5400, -1600, 200, 800);
        spawn.mapRect(4800, -1000, 1400, 200);
        spawn.mapRect(4800, -1000, 200, 600);
        spawn.mapRect(3800, -600, 1200, 200);
        spawn.mapRect(3200, -800, 800, 200);
        spawn.mapRect(3200, -800, 200, 800);
        spawn.mapRect(3800, -800, 200, 800);
        spawn.mapRect(-200, -200, 4200, 200);

        //Boss Room Platforms
        spawn.mapRect(7700, 100, 300, 40);
        spawn.mapRect(8600, 0, 300, 40);
        spawn.mapRect(9200, 100, 300, 40);
        spawn.mapRect(9400, -200, 300, 40);
        spawn.mapRect(8000, -200, 300, 40);
        spawn.mapRect(8500, -400, 300, 40);
        spawn.mapRect(9000, -600, 300, 40);
        spawn.mapRect(9400, -800, 300, 40);
        spawn.mapRect(8600, -1000, 300, 40);
        spawn.mapRect(7900, -800, 300, 40);

        //Mob Spawning
        spawn.randomMob(200, 400, 0.7);
        // spawn.randomMob(1200, 400, 0.7);
        spawn.randomMob(2000, 400, 0.7);
        // spawn.randomMob(3000, 400, 0.7);
        spawn.randomMob(5000, 0, 0.7);
        spawn.randomMob(5600, 0, 0.7);
        spawn.randomMob(6200, -200, 0.7);
        // spawn.randomMob(6600, -200, 0.7);
        spawn.randomMob(7200, -800, 0.7);
        spawn.randomSmallMob(800, 400, 0.9);
        spawn.randomSmallMob(1800, 400, 0.9);
        // spawn.randomSmallMob(2600, 400, 0.9);
        spawn.randomSmallMob(5200, 0, 0.9);
        // spawn.randomSmallMob(5400, 0, 0.9);
        spawn.randomSmallMob(6400, -200, 0.9);
        spawn.randomGroup(3800, 400, 0.5);
        spawn.randomGroup(4200, 400, 0.5);
        // spawn.randomGroup(4400, 200, 0.5);
        spawn.randomGroup(7000, -800, 0.5);
        // spawn.randomGroup(7700, 300, 0.5);
        spawn.randomGroup(9800, 300, 0.5);
        // spawn.randomGroup(7700, -1100, 0.5);
        spawn.randomGroup(9800, -1100, 0.5);

        if (simulation.difficulty > 3) spawn.randomLevelBoss(8600, -600, ["powerUpBoss", "bomberBoss", "dragonFlyBoss", "spiderBoss", "historyBoss"])
        spawn.secondaryBossChance(7900, -400)

        //Boss Spawning
        if (simulation.difficulty > 10) {
            spawn.pulsarBoss(3600, -400);
            powerUps.chooseRandomPowerUp(4006, 400);
            powerUps.chooseRandomPowerUp(4407, 400);
            powerUps.spawnStartingPowerUps(4400, 400);
            if (simulation.difficulty > 30) {
                powerUps.chooseRandomPowerUp(4002, 400);
                powerUps.chooseRandomPowerUp(4004, 400);
                spawn.pulsarBoss(4200, 1000);
                if (simulation.difficulty > 60) {
                    powerUps.chooseRandomPowerUp(4409, 400);
                    spawn.pulsarBoss(5800, -1200);
                    if (simulation.difficulty > 80) {
                        spawn.pulsarBoss(-400, -200);
                        if (simulation.difficulty > 100) {
                            spawn.pulsarBoss(3600, -400);
                            if (simulation.difficulty > 120) {
                                spawn.pulsarBoss(-400, -200);
                            }
                        }
                    }
                }
            }
        }

        //Powerup Spawning
        powerUps.spawnStartingPowerUps(4000, 400);
        powerUps.addResearchToLevel(); //needs to run after mobs are spawned

        //Block Spawning
        // spawn.bodyRect(-100, 200, 100, 400); //spawn door
        spawn.bodyRect(7450, -800, 25, 200); //boss room door
        spawn.bodyRect(9850, -1000, 25, 200); //end door
        spawn.mapRect(-200, 350, 200, 450);

        // spawn.mapRect(3875, -75, 50, 575);
        spawn.mapRect(3800, -75, 200, 525);
        spawn.mapRect(3875, 590, 50, 150);
        spawn.mapRect(3875, 350, 50, 140);

        const debrisCount = 3
        spawn.debris(1050, 700, 400, debrisCount);
        spawn.debris(1900, 600, 400, debrisCount);
        spawn.debris(2700, 500, 400, debrisCount);
        // spawn.debris(3500, 450, 400, debrisCount);
        spawn.debris(4150, 500, 400, debrisCount);
        spawn.debris(5300, 0, 400, debrisCount);
        spawn.debris(6300, -100, 400, debrisCount);
        spawn.debris(7200, -500, 400, debrisCount);
        spawn.debris(8000, -600, 400, debrisCount);
        spawn.debris(8700, -700, 400, debrisCount);
        spawn.debris(9300, -900, 400, debrisCount);
    },
    vats() { // Made by Dablux#6610 on Discord
        simulation.makeTextLog(`<strong>vats</strong> by <span class='color-var'>Dablux</span>`);

        simulation.zoomScale = 1500;
        level.setPosToSpawn(4400, -1060)
        spawn.mapRect(level.enter.x, level.enter.y + 30, 100, 20)
        level.exit.x = 3900;
        level.exit.y = 1060;
        spawn.mapRect(level.exit.x, level.exit.y + 30, 100, 20)
        document.body.style.backgroundColor = "#dcdcde";

        var nextBlockSpawn = simulation.cycle + Math.floor(Math.random() * 60 + 30)
        const door = level.door(475, 900, 50, 200, 201)
        const exitDoor = level.door(3375, 900, 50, 200, 201)
        const deliveryButton = level.button(3500, -410)
        const buttonGreen = level.button(-1600, 1090)
        const buttonYellow = level.button(-1600, -1160)
        const buttonRed = level.button(5874, -2410)
        let g = false;
        let y = false;
        let r = false;
        const deliverySlime = level.hazard(3700, -940, 100, 480)
        const deliverySlime2 = level.hazard(3700, -461, 100, 1141)
        const slimePit = level.hazard(700, 1200, 2500, 1300, 0.004, "hsla(160, 100%, 35%,0.75)")
        const topSlime = level.hazard(800, -460, 2900, 90, 0.004, "hsla(160, 100%, 35%,0.75)")
        // const rotor = level.rotor(0, -725, 0.001)
        const rotor = level.rotor(-400, -725, 800, 50, 0.001, 0, 0.01, 0, 0.001)


        const portal = level.portal({
            x: -135,
            y: 800
        }, Math.PI / 2, {
            x: 570,
            y: -395
        }, -Math.PI / 2)
        const portal2 = level.portal({
            x: -1800,
            y: 1900
        }, Math.PI, {
            x: 200,
            y: 1105
        }, -Math.PI / 2)
        const drip1 = level.drip(1875, -660, -400, 70)
        const drip2 = level.drip(3525, -940, -400, 150)
        const drip3 = level.drip(1975, 100, 1200, 100)
        door.isClosing = true;
        exitDoor.isClosing = true;

        // UPPER AREA //
        spawn.mapRect(4500, -2400, 1700, 2050)
        spawn.mapRect(3800, -1000, 700, 650)
        spawn.mapRect(4000, -1310, 50, 60)
        spawn.mapRect(4450, -1310, 50, 60)
        spawn.mapRect(4000, -1320, 500, 20)
        level.chain(4025, -1225, 0.5 * Math.PI, false, 5, 25)
        spawn.mapRect(3650, -460, 50, 90)
        spawn.mapRect(3525, -1000, 325, 20)
        spawn.mapRect(3650, -1000, 50, 440)
        spawn.mapRect(3300, -1000, 50, 450)
        spawn.mapRect(3325, -725, 150, 25)
        spawn.mapRect(3500, -980, 175, 35)
        spawn.mapRect(3325, -980, 50, 35)
        spawn.mapRect(-1800, -1250, 50, 120)
        spawn.mapRect(6150, -2500, 50, 120)
        spawn.bodyRect(3350, -1000, 175, 20, 1, spawn.propsIsNotHoldable) // Cover
        Matter.Body.setMass(body[body.length - 1], 0.7) // Make cover easier to remove
        spawn.mapRect(750, -475, 50, 75);
        for (let i = 1; i < 5; i++) {
            spawn.mapRect(800 + (i * 100) + (500 * (i - 1)), -460 + (i * -120) + (20 * (i - 1)), 500, 20)
        }

        // ARENA //
        spawn.mapRect(400, -400, 2950, 500)
        spawn.mapRect(-1800, -1150, 1800, 1950)
        spawn.mapRect(-1800, 1100, 780, 1800)
        spawn.mapRect(-300, 1100, 1000, 1800)
        //spawn.mapRect(-1800, -1450, 100, 2000)
        spawn.blockDoor(-1800, 1070)
        level.chain(-1000, 1120, 0, true, 18, 20)
        spawn.mapRect(700, 2500, 2500, 900)
        spawn.mapRect(400, 100, 200, 599)
        spawn.mapRect(400, 650, 75, 250)
        spawn.mapRect(525, 650, 75, 250)
        spawn.mapRect(3300, 650, 75, 250)
        spawn.mapRect(3425, 650, 75, 250)
        spawn.mapRect(3200, 1100, 1800, 2200)
        spawn.mapRect(3300, -400, 200, 1099) // STOP CHANGING THIS ONE!!!! 
        spawn.mapRect(3450, -400, 250, 1100)
        spawn.mapRect(3650, 680, 200, 20)
        spawn.mapRect(3800, -400, 1400, 1100)
        spawn.mapRect(4100, 700, 100, 300)
        spawn.mapRect(4900, -400, 1300, 2500)
        spawn.bodyRect(4100, 1000, 100, 100)

        spawn.bodyRect(-2100, 2050, 290, 30) //Portal platform
        let b = body[body.length - 1];
        b.isNotHoldable = true
        cons[cons.length] = Constraint.create({
            pointA: {
                x: -1820,
                y: 2065
            },
            bodyB: b,
            pointB: {
                x: -135,
                y: 0
            },
            stiffness: 1,
            length: 1
        });
        cons[cons.length] = Constraint.create({
            pointA: {
                x: -1800,
                y: 1400
            },
            bodyB: b,
            pointB: {
                x: 135,
                y: 0
            },
            stiffness: 0.005,
            length: 700
        });
        Composite.add(engine.world, [cons[cons.length - 2], cons[cons.length - 1]]);

        spawn.bodyRect(5225, -2525, 300, 75);
        spawn.bodyRect(4700, -2525, 100, 75, 0.5);
        spawn.bodyRect(4900, -2600, 50, 50, 0.4);
        spawn.bodyRect(5050, -2475, 500, 100, 0.4);
        spawn.bodyRect(2950, -950, 175, 75, 0.5);
        spawn.bodyRect(3050, -1000, 75, 50, 0.3);
        spawn.bodyRect(2300, -850, 75, 50, 0.7);
        spawn.bodyRect(2150, -575, 100, 175, 0.6);
        spawn.bodyRect(2500, -550, 400, 150, 0.2);
        spawn.bodyRect(1525, -500, 225, 100, 0.2);
        spawn.bodyRect(1625, -575, 100, 75);
        spawn.bodyRect(1000, -475, 100, 100, 0.8);
        spawn.bodyRect(1225, -450, 125, 50, 0.9);
        spawn.bodyRect(525, -500, 175, 125, 0.75);
        spawn.bodyRect(575, -600, 100, 75, 0.5);
        spawn.bodyRect(-925, -1225, 275, 75, 0.4);
        spawn.bodyRect(-1125, -1300, 200, 150, 0.7);
        spawn.bodyRect(-475, -1250, 200, 100, 0.8);
        spawn.bodyRect(-425, -1300, 100, 50, 0.75);
        spawn.bodyRect(-1225, -1200, 100, 25, 0.45);
        spawn.bodyRect(-1025, -1350, 75, 50, 0.5);
        spawn.bodyRect(-450, 1025, 75, 50, 0.5);
        spawn.bodyRect(-775, 1050, 50, 50, 0.6);
        spawn.bodyRect(-650, 975, 75, 75, 0.2);
        spawn.bodyRect(-475, 1025, 100, 50, 0.7);
        spawn.bodyRect(-450, 1025, 75, 50, 0.6);
        spawn.bodyRect(-800, 1050, 100, 50, 0.5);
        spawn.bodyRect(-600, 950, 75, 75, 0.3);
        spawn.bodyRect(-500, 1000, 75, 25, 0.2);
        spawn.bodyRect(-900, 1025, 150, 50);
        spawn.bodyRect(-1350, 1000, 100, 100, 0.4);
        spawn.bodyRect(-1225, 1075, 100, 25);
        spawn.debris(900, -1000, 2000, 16);

        // MOBS //
        spawn.randomSmallMob(2900, -1000)
        spawn.randomSmallMob(1750, -700)
        spawn.randomMob(4250, -1400)
        spawn.randomMob(4800, -2400, 0.3)
        spawn.randomMob(1000, 600, 0.3)
        spawn.randomMob(1650, 950, 0.2)
        spawn.randomMob(1300, -1250, 0)
        spawn.randomMob(-600, -1250, 0.1)
        spawn.randomMob(1000, -600, 0.4)
        spawn.randomMob(1800, -700, 0.4)
        spawn.randomMob(2200, 950, 0.2)
        spawn.randomMob(-1900, 1400, 0.3)
        spawn.randomMob(-750, -1000, 0.3)
        spawn.randomMob(3250, 1000, 0.1)
        spawn.randomMob(2000, -2800, 0.4)
        spawn.randomMob(2200, -500, 0)
        spawn.randomMob(1800, -450, 0.3)
        spawn.randomGroup(2300, -450, 1)
        spawn.randomGroup(3000, -450, 0.3)
        spawn.randomGroup(6000, -2700, 0)
        spawn.randomGroup(-1200, -1300, -0.3)
        powerUps.addResearchToLevel()

        if (simulation.difficulty > 3) {
            spawn.randomLevelBoss(1900, 400, ["shieldingBoss", "shooterBoss", "launcherBoss", "streamBoss"])
        } else {
            exitDoor.isClosing = false;
        }
        spawn.secondaryBossChance(800, -800)

        powerUps.spawn(4450, 1050, "heal");
        if (Math.random() > (0.2 + (simulation.difficulty / 60))) {
            powerUps.spawn(4500, 1050, "ammo");
            powerUps.spawn(4550, 1050, "ammo");
        } else {
            powerUps.spawn(4500, 1050, "tech");
            spawn.randomMob(4550, 1050, Infinity);
        }
        powerUps.spawnStartingPowerUps(3750, -940)

        const W = 500;
        const H = 20;
        for (let i = 1; i < 5; i++) {
            spawn.bodyRect(700 + (i * 100) + (W * (i - 1)), 1110, W, H, 1, spawn.propsIsNotHoldable)
            let b = body[body.length - 1];
            cons[cons.length] = Constraint.create({
                pointA: {
                    x: b.position.x - (W / 2) + 50,
                    y: b.position.y - 1025
                },
                bodyB: b,
                pointB: {
                    x: -(W / 2) + 50,
                    y: 0
                },
                stiffness: 0.002,
                length: 1000
            });
            cons[cons.length] = Constraint.create({
                pointA: {
                    x: b.position.x + (W / 2) - 50,
                    y: b.position.y - 1025
                },
                bodyB: b,
                pointB: {
                    x: (W / 2) - 50,
                    y: 0
                },
                stiffness: 0.002,
                length: 1000
            });
            Composite.add(engine.world, [cons[cons.length - 1], cons[cons.length - 2]])
        }
        const boost1 = level.boost(4400, -1385, 1200)

        level.custom = () => {
            boost1.query();
            buttonGreen.query()
            buttonYellow.query()
            buttonRed.query()

            if (!buttonGreen.isUp) {
                if (!g) {
                    Matter.Composite.remove(engine.world, cons[1])
                    cons.splice(1, 2)
                }
                g = true;
            }
            if (!buttonYellow.isUp) {
                y = true;
            }
            if (!buttonRed.isUp) {
                r = true;
            }

            if (g && y && r) {
                door.isClosing = false;
            } else {
                door.isClosing = true;
            }

            door.openClose()
            exitDoor.openClose()

            if (m.pos.y > 1600 && 700 < m.pos.x && m.pos.x < 3200) { // Saving player from slime pit
                Matter.Body.setVelocity(player, {
                    x: 0,
                    y: 0
                });
                Matter.Body.setPosition(player, {
                    x: 200,
                    y: 1000
                });
                // move bots
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
                m.damage(0.1 * simulation.difficultyMode)
                m.energy -= 0.1 * simulation.difficultyMode
            }

            if (simulation.cycle >= nextBlockSpawn && body.length < 100) {
                var len = body.length;
                body[len] = Matter.Bodies.polygon(Math.floor(Math.random() * 1700) + 1050, 100, Math.floor(Math.random() * 11) + 10, Math.floor(Math.random() * 20) + 15)
                body[len].collisionFilter.category = cat.body;
                body[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
                Composite.add(engine.world, body[len])
                nextBlockSpawn = simulation.cycle + Math.floor(Math.random() * 60 + 30)
            }

            if (exitDoor.isClosing) {
                exitDoor.isClosing = false;
                for (i = 0; i < mob.length; i++) {
                    if (mob[i].isBoss && 525 < mob[i].position.x < 3200 && -2500 < mob[i].position.y < 100) {
                        exitDoor.isClosing = true;
                    }
                }
            }

            for (let i = 0, len = body.length; i < len; i++) {
                if (body[i].position.x > 700 && body[i].position.x < 3200 && body[i].position.y > 1200 && !body[i].isNotHoldable) {
                    Matter.Body.scale(body[i], 0.99, 0.99);
                    if (body[i].velocity.y > 3) body[i].force.y -= 0.96 * body[i].mass * simulation.g
                    const slowY = (body[i].velocity.y > 0) ? Math.max(0.3, 1 - 0.0015 * body[i].velocity.y * body[i].velocity.y) : Math.max(0.98, 1 - 0.001 * Math.abs(body[i].velocity.y)) //down : up
                    Matter.Body.setVelocity(body[i], {
                        x: Math.max(0.6, 1 - 0.07 * Math.abs(body[i].velocity.x)) * body[i].velocity.x,
                        y: slowY * body[i].velocity.y
                    });
                    if (body[i].mass < 0.05) {
                        Matter.Composite.remove(engine.world, body[i])
                        body.splice(i, 1)
                        break
                    }
                }
            }

            for (let i = 0, len = mob.length; i < len; ++i) {
                if (mob[i].position.x > 700 && mob[i].position.x < 3200 && mob[i].alive && !mob[i].isShielded && mob[i].position.y > 1200) {
                    mobs.statusDoT(mob[i], 0.005, 30)
                }
            }

            ctx.beginPath()
            ctx.fillStyle = "#666";
            ctx.arc(buttonGreen.min.x - 50, buttonGreen.min.y - 70, 20, 0, 2 * Math.PI)
            ctx.fillRect(buttonGreen.min.x - 55, buttonGreen.max.y + 25, 10, -95)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(buttonYellow.min.x - 50, buttonYellow.min.y - 70, 20, 0, 2 * Math.PI)
            ctx.fillRect(buttonYellow.min.x - 55, buttonYellow.max.y + 25, 10, -95)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(buttonRed.min.x - 50, buttonRed.min.y - 70, 20, 0, 2 * Math.PI)
            ctx.fillRect(buttonRed.min.x - 55, buttonRed.max.y + 25, 10, -95)
            ctx.fill()

            ctx.beginPath()
            ctx.arc(buttonGreen.min.x - 50, buttonGreen.min.y - 70, 10, 0, 2 * Math.PI)
            ctx.fillStyle = (g ? `rgba(0, 255, 0, 0.9)` : `rgba(255, 0, 0, 0.9)`);
            ctx.fill()
            ctx.beginPath()
            ctx.arc(buttonYellow.min.x - 50, buttonYellow.min.y - 70, 10, 0, 2 * Math.PI)
            ctx.fillStyle = (y ? `rgba(0, 255, 0, 0.9)` : `rgba(255, 0, 0, 0.9)`);
            ctx.fill()
            ctx.beginPath()
            ctx.arc(buttonRed.min.x - 50, buttonRed.min.y - 70, 10, 0, 2 * Math.PI)
            ctx.fillStyle = (r ? `rgba(0, 255, 0, 0.9)` : `rgba(255, 0, 0, 0.9)`);
            ctx.fill()

            slimePit.query();
            ctx.shadowColor = 'hsla(160, 100%, 50%, 1)'
            ctx.shadowBlur = 100;
            // slimePit.draw()
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'rgba(0, 0, 0, 0)'

            deliveryButton.query()
            portal[2].query()
            //portal[3].query()
            portal2[2].query()
            //portal2[3].query()

            deliverySlime.level(deliveryButton.isUp)
            topSlime.level(!r)
            rotor.rotate()

            ctx.fillStyle = "#d4f4f4"
            ctx.fillRect(3500, 675, 600, 450)
            level.enter.draw()
            level.exit.drawAndCheck()
        }

        level.customTopLayer = () => {
            topSlime.query();
            deliverySlime.query()
            deliverySlime2.query()
            drip1.draw()
            drip2.draw()
            drip3.draw()

            ctx.fillStyle = `rgba(68, 68, 68, ${Math.max(0.3, Math.min((4200 - m.pos.x) / 100, 0.99))})`
            ctx.fillRect(4100, 650, 850, 500)

            ctx.fillStyle = "rgba(0,20,40,0.1)"
            ctx.fillRect(4025, -1300, 475, 300)
            ctx.fillRect(3325, -1000, 375, 600)
            ctx.fillRect(425, 100, 3050, 2400)
            ctx.fillRect(-1775, 800, 1750, 2100)
            ctx.fillStyle = "rgba(0,20,40,0.2)"
            ctx.fillRect(2725, -860, 450, 460)
            ctx.fillRect(2125, -760, 450, 360)
            ctx.fillRect(1525, -660, 450, 260)
            ctx.fillRect(925, -560, 450, 160)
            ctx.fillRect(3700, -980, 100, 1200)

            ctx.fillStyle = `#444`;
            ctx.fillRect(465, 690, 70, 209)
            ctx.fillRect(3365, 690, 70, 209)

            ctx.beginPath()
            ctx.arc(500, 870, 20, 0, 2 * Math.PI)
            ctx.arc(500, 820, 20, 0, 2 * Math.PI)
            ctx.arc(500, 770, 20, 0, 2 * Math.PI)
            ctx.fillStyle = "rgba(0, 0, 0, 0.3";
            ctx.fill()

            ctx.beginPath()
            ctx.arc(500, 870, 10, 0, 2 * Math.PI)
            ctx.fillStyle = (g ? `rgba(0, 255, 0, 0.9)` : `rgba(255, 0, 0, 0.9)`);
            ctx.fill()
            ctx.beginPath()
            ctx.arc(500, 820, 10, 0, 2 * Math.PI)
            ctx.fillStyle = (y ? `rgba(0, 255, 0, 0.9)` : `rgba(255, 0, 0, 0.9)`);
            ctx.fill()
            ctx.beginPath()
            ctx.arc(500, 770, 10, 0, 2 * Math.PI)
            ctx.fillStyle = (r ? `rgba(0, 255, 0, 0.9)` : `rgba(255, 0, 0, 0.9)`);
            ctx.fill()

            deliveryButton.draw()
            // deliverySlime.draw()
            // deliverySlime2.draw()
            // topSlime.draw()
            buttonGreen.draw()
            buttonYellow.draw()
            buttonRed.draw()
            portal[0].draw()
            portal[2].draw()
            portal2[0].draw()
            portal2[2].draw()
        }
    },
    "n-gon"() { //make by Oranger
        simulation.makeTextLog(`<strong>"n-gon"</strong> by <span class='color-var'>Oranger</span>`);

        document.body.style.backgroundColor = "#dcdcde";
        let needGravity = [];
        let s = { //mech statue
            x: -200,
            y: -2350,
            angle: 0,
            scale: 15,
            h: { //hip
                x: 12,
                y: 24
            },
            k: { //knee
                x: -30.96, //-17.38
                y: 58.34, //70.49
                //x2: -33.96, //x - 3
                //y2: 58.34 //same as y
            },
            f: { //foot
                x: 0,
                y: 91 //112
            },
            fillColor: "#ccc", //white
            fillColorDark: "#bbb", //25% from white
            lineColor: "#999", //#333
            lineColorLight: "#aaa" //#4a4a4a
        }
        const boost1 = level.boost(2550, 1500, 1700)
        const boost2 = level.boost(-3400, -2050, 2100)

        level.custom = () => {
            boost1.query();
            boost2.query();

            level.exit.drawAndCheck();

            level.enter.draw();
            for (let i = 0; i < needGravity.length; i++) {
                needGravity[i].force.y += needGravity[i].mass * simulation.g;
            }
            ctx.fillStyle = "#444" //light fixtures
            ctx.fillRect(2350, 995, 40, 10)
            //ctx.fillRect(2280, -6005, 40, 10)

            //statue
            ctx.save();
            ctx.translate(s.x, s.y);
            //statueLeg is at the bottom, below the enemies but above the NGON function
            statueLeg(-3, s.lineColorLight);
            statueLeg(0, s.lineColor);
            //head
            ctx.rotate(s.angle);
            ctx.beginPath();
            ctx.arc(0, 0, 30 * s.scale, 0, 2 * Math.PI);
            let grd = ctx.createLinearGradient(-30 * s.scale, 0, 30 * s.scale, 0);
            grd.addColorStop(0, s.fillColorDark);
            grd.addColorStop(1, s.fillColor);
            ctx.fillStyle = grd;
            ctx.fill();
            ctx.arc(15 * s.scale, 0, 4 * s.scale, 0, 2 * Math.PI);
            ctx.strokeStyle = s.lineColor;
            ctx.lineWidth = 2 * s.scale;
            ctx.stroke();
            ctx.restore();
        };

        level.customTopLayer = () => {
            //boost chute for lack of a better name
            ctx.fillStyle = "rgba(60,60,60,0.9)";
            ctx.fillRect(-3451, -4000, 202, 1500);
            ctx.fillRect(2499, -170, 202, 1170);

            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath(); //basement
            ctx.moveTo(2360, 1000);
            ctx.lineTo(2120, 900);
            ctx.lineTo(1500, 900);
            ctx.lineTo(1500, 1500);
            ctx.lineTo(3000, 1500);
            ctx.lineTo(3000, 1000);
            ctx.lineTo(2380, 1000);
            ctx.lineTo(2870, 1500);
            ctx.lineTo(1870, 1500);
            ctx.lineTo(2360, 1000);
            ctx.fill();
            // ctx.beginPath(); //exit
            // ctx.moveTo(1600, -6000);
            // ctx.lineTo(1600, -5000);
            // ctx.lineTo(3000, -5000);
            // ctx.lineTo(3000, -6000);
            // ctx.lineTo(2310, -6000);
            // ctx.lineTo(2600, -5000);
            // ctx.lineTo(2000, -5000);
            // ctx.lineTo(2290, -6000);
            // ctx.lineTo(1600, -6000);
            // ctx.fill();

            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.fillRect(1600, -1000, 1400, 830);
            ctx.fillRect(1600, -170, 520, 170);
            ctx.fillRect(-1300, -200, 2200, 200); //statue base
            ctx.fillRect(-800, -400, 1200, 200);
            ctx.fillRect(-500, -700, 600, 300);
            //ctx.fillRect(-4000, -6000, 2000, 1000); //left side
            ctx.fillRect(-4000, -2500, 2000, 2500);
        };

        level.setPosToSpawn(1810, 1450);
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.exit.x = 2700;
        level.exit.y = -4030;
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);
        level.defaultZoom = 3500
        simulation.zoomTransition(level.defaultZoom)

        // powerUps.spawnStartingPowerUps(1475, -1175);
        spawn.debris(2750, 1500, 200, 4); //16 debris per level
        spawn.debris(1770, -350, 120, 4); //16 debris per level
        spawn.debris(-3200, 0, 1000, 6); //16 debris per level

        //boundaries
        spawn.mapRect(-4100, 1500, 7200, 100); //base floor
        spawn.mapRect(3000, -4000, 100, 5600); //right barrier
        spawn.mapRect(-4100, -4000, 100, 5600); //left barrier
        //spawn.mapRect(1600, -10000, 1500, 4000); //upper right wall
        //spawn.mapRect(-4100, -10000, 2100, 4000); //upper left wall
        spawn.mapRect(1600, -4000, 1500, 3000); //right wall
        spawn.mapRect(-4100, 0, 5600, 1550); //floor

        //starting room  
        spawn.mapRect(1500, 0, 700, 900);
        spawn.mapRect(2120, -170, 380, 1170);
        spawn.mapRect(2700, -170, 400, 1170);
        //spawn.mapVertex(2296, 400, "0 0 0 1200 300 1200 400 0");
        //spawn.mapVertex(2904, 400, "0 0 0 1200 -300 1200 -400 0");

        //left area
        spawn.mapRect(-3500, -300, 300, 400); //floor 1
        spawn.mapRect(-3900, -600, 300, 100);
        spawn.mapRect(-3500, -900, 300, 100);
        spawn.mapRect(-3100, -1150, 1000, 150); //floor 2
        spawn.mapRect(-2200, -2600, 200, 1600);
        spawn.mapRect(-2700, -1450, 300, 100);
        spawn.mapRect(-3100, -1750, 300, 100);
        spawn.mapRect(-3500, -2050, 300, 100);
        spawn.mapRect(-4100, -4000, 650, 1500); //floor 3
        spawn.mapRect(-3250, -4000, 1250, 1500);

        //statue base
        spawn.mapRect(-700, -900, 1000, 200); //top
        //left
        spawn.mapRect(-700, -900, 200, 500);
        spawn.mapRect(-1000, -600, 500, 200);
        spawn.mapRect(-1000, -600, 200, 400);
        spawn.mapRect(-1300, -300, 500, 100);
        //right
        spawn.mapRect(100, -900, 200, 500);
        spawn.mapRect(100, -600, 500, 200);
        spawn.mapRect(400, -600, 200, 400);
        spawn.mapRect(400, -300, 500, 100);

        hangingNGON(-1900, -4000, 1, 1000, 1, false, {
            density: 0.001, //default density is 0.001
            friction: 0.0001,
            frictionAir: 0.001,
            frictionStatic: 0,
            restitution: 0,
            isNotHoldable: true
        });
        hangingNGON(1900, -4600, 0.2, 300, 0.0005, false, {
            density: 0.00005, //default density is 0.001
            friction: 0.0001,
            frictionAir: 0.003,
            frictionStatic: 0,
            restitution: 1,
            isNotHoldable: true
        });

        // // Never gonna give you up
        // spawn.bodyRect(-8000, -10100, 15, 100);
        // // Never gonna let you down
        // spawn.bodyRect(-7915, -10100, 15, 100);
        // // Never gonna run around and desert you
        // body[body.length] = Bodies.polygon(-7950, -10025, 0, 25, { //circle
        //     friction: 0.05,
        //     frictionAir: 0.001
        // });
        // // Never gonna make you cry
        // spawn.bodyRect(6985, -10100, 15, 100);
        // // Never gonna say goodbye
        // spawn.bodyRect(6900, -10100, 15, 100);
        // // Never gonna tell a lie and hurt you
        // body[body.length] = Bodies.polygon(6950, -10025, 0, 25, { //circle
        //     friction: 0.05,
        //     frictionAir: 0.001
        // });

        //pile of blocks
        spawn.bodyRect(1920, -400, 200, 400)
        spawn.bodyRect(1720, -250, 200, 250)
        spawn.bodyRect(1770, -300, 150, 50)
        spawn.bodyRect(2120, -280, 100, 100)
        spawn.bodyRect(1990, -500, 100, 100)

        //doors under statue
        spawn.bodyRect(850, -50, 50, 50)
        spawn.bodyRect(850, -100, 50, 50)
        spawn.bodyRect(850, -150, 50, 50)
        spawn.bodyRect(850, -200, 50, 50)
        spawn.bodyRect(-1300, -50, 50, 50)
        spawn.bodyRect(-1300, -100, 50, 50)
        spawn.bodyRect(-1300, -150, 50, 50)
        spawn.bodyRect(-1300, -200, 50, 50)

        // on the statue base
        spawn.randomMob(700 + Math.random() * 100, -500 + Math.random() * 100, 1);
        spawn.randomMob(400 + Math.random() * 100, -800 + Math.random() * 100, 0.4);
        spawn.randomMob(100 + Math.random() * 100, -1100 + Math.random() * 100, -0.2);
        spawn.randomGroup(-200, -1400, -0.4);
        spawn.randomMob(-600 + Math.random() * 100, -1100 + Math.random() * 100, -0.2);
        spawn.randomMob(-900 + Math.random() * 100, -800 + Math.random() * 100, 0.4);
        spawn.randomMob(-1200 + Math.random() * 100, -500 + Math.random() * 100, 1);

        //in the statue base
        spawn.randomSmallMob(400 + Math.random() * 300, -150 + Math.random() * 100, 0.2);
        spawn.randomSmallMob(-1100 + Math.random() * 300, -150 + Math.random() * 100, 0.2);

        //bottom left
        spawn.randomMob(-2600 + Math.random() * 300, -700 + Math.random() * 300, 0.6);
        spawn.randomSmallMob(-3000 + Math.random() * 300, -400 + Math.random() * 300, 0.2);
        spawn.randomSmallMob(-3000 + Math.random() * 300, -400 + Math.random() * 300, 0);
        spawn.randomMob(-3900 + Math.random() * 100, -200 + Math.random() * 100, 0.6);
        spawn.randomMob(-3400 + Math.random() * 100, -400, 0.4);
        spawn.randomSmallMob(-3800 + Math.random() * 100, -700, -0.4);
        spawn.randomMob(-3400 + Math.random() * 100, -1000, 0.6);
        spawn.randomMob(-3000 + Math.random() * 100, -1850, 0);
        spawn.randomGroup(-2700, -2000, 0.4);

        //top left
        spawn.randomSmallMob(-3800, -5800, -0.2);
        spawn.randomSmallMob(-2400, -5200, 0.2);

        //top right
        spawn.randomGroup(2000, -5700, 0.6);

        powerUps.addResearchToLevel() //needs to run after mobs are spawned
        let bosses = ["shooterBoss", "launcherBoss", "laserTargetingBoss", "streamBoss", "pulsarBoss", "spawnerBossCulture", "laserBoss", "growBossCulture"];
        let abc = Math.random();
        if (simulation.difficulty > 3) {
            if (abc < 0.6) {
                spawn.randomLevelBoss(-1500 + Math.random() * 250, -1100 + Math.random() * 200, bosses);
            } else if (abc < 0.85) {
                spawn.laserBoss(-350 + Math.random() * 300, -600 + Math.random() * 200);
            } else {
                spawn.randomLevelBoss(850 + Math.random() * 250, -1100 + Math.random() * 200, bosses);
            }
        }
        spawn.secondaryBossChance(850 + Math.random() * 250, -1100 + Math.random() * 200)

        //draw leg for statue
        function statueLeg(shift, color) {
            ctx.save();
            ctx.translate(shift, shift);
            //front leg
            let stroke = color;
            ctx.beginPath();
            ctx.moveTo((s.h.x + shift) * s.scale, (s.h.y + shift) * s.scale);
            ctx.lineTo((s.k.x + 2 * shift) * s.scale, (s.k.y + shift) * s.scale);
            ctx.lineTo((s.f.x + shift) * s.scale, (s.f.y + shift) * s.scale);
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 7 * s.scale;
            ctx.stroke();
            //toe lines
            ctx.beginPath();
            ctx.moveTo((s.f.x + shift) * s.scale, (s.f.y + shift) * s.scale);
            ctx.lineTo((s.f.x - 15 + shift) * s.scale, (s.f.y + 5 + shift) * s.scale);
            ctx.moveTo((s.f.x + shift) * s.scale, (s.f.y + shift) * s.scale);
            ctx.lineTo((s.f.x + 15 + shift) * s.scale, (s.f.y + 5 + shift) * s.scale);
            ctx.lineWidth = 4 * s.scale;
            ctx.stroke();
            //hip joint
            ctx.beginPath();
            ctx.arc((s.h.x + shift) * s.scale, (s.h.y + shift) * s.scale, 11 * s.scale, 0, 2 * Math.PI);
            //knee joint
            ctx.moveTo((s.k.x + 7 + 2 * shift) * s.scale, (s.k.y + shift) * s.scale);
            ctx.arc((s.k.x + 2 * shift) * s.scale, (s.k.y + shift) * s.scale, 7 * s.scale, 0, 2 * Math.PI);
            //foot joint
            ctx.moveTo((s.f.x + 6 + shift) * s.scale, (s.f.y + shift) * s.scale);
            ctx.arc((s.f.x + shift) * s.scale, (s.f.y + shift) * s.scale, 6 * s.scale, 0, 2 * Math.PI);
            ctx.fillStyle = s.fillColor;
            ctx.fill();
            ctx.lineWidth = 2 * s.scale;
            ctx.stroke();
            ctx.restore();
        }

        //       | | | | |
        //       n - g o n
        //when s = 1 (scale), it's 3408 long and 800 tall (height of g)
        function hangingNGON(x, y, s, height, stiffness, pin, properties) {
            //makes a compound part of 3 bodyVertex parts
            function compound3Parts(x1, y1, v1, x2, y2, v2, x3, y3, v3, properties) {
                const part1 = Matter.Bodies.fromVertices(x1, y1, Vertices.fromPath(v1), properties);
                const part2 = Matter.Bodies.fromVertices(x2, y2, Vertices.fromPath(v2), properties);
                const part3 = Matter.Bodies.fromVertices(x3, y3, Vertices.fromPath(v3), properties);
                const compoundParts = Body.create({
                    parts: [part1, part2, part3],
                });
                Composite.add(engine.world, [compoundParts]);
                needGravity[needGravity.length] = compoundParts;
                composite[composite.length] = compoundParts;
                body[body.length] = part1;
                body[body.length] = part2;
                body[body.length] = part3;
                setTimeout(function() {
                    compoundParts.collisionFilter.category = cat.body;
                    compoundParts.collisionFilter.mask = cat.body | cat.player | cat.bullet | cat.mob | cat.mobBullet | cat.map
                }, 1000);
            }

            //for attaching the block to a point
            function addConstraint(x, y, px, py, stiff, body, pin = false) {
                if (pin) {
                    map[map.length] = Bodies.polygon(x, y, 0, 15); //circle above
                }
                cons[cons.length] = Constraint.create({
                    pointA: {
                        x: x,
                        y: y
                    },
                    bodyB: body,
                    pointB: {
                        x: px,
                        y: py
                    },
                    stiffness: stiff
                });
                Composite.add(engine.world, cons[cons.length - 1]);
            }

            //I SINCERELY APOLOGIZE FOR THE ILLEGIBLE BLOCKS OF STRING CONCATENATION
            //s is scale

            //n
            compound3Parts(
                x + 100 * s,
                y + 310 * s,
                ("0 0 " + 200 * s + " 0 " + 200 * s + " " + 620 * s + " 0 " + 620 * s),
                x + 300 * s,
                y + 160 * s,
                (200 * s + " " + 40 * s + " " + 400 * s + " " + 40 * s + " " + 400 * s + " " + 280 * s + " " + 200 * s + " " + 280 * s),
                x + 499 * s,
                y + 333.3 * s,
                (400 * s + " " + 40 * s + " " + 540 * s + " " + 40 * s + " " + 600 * s + " " + 100 * s + " " + 600 * s + " " + 620 * s + " " + 400 * s + " " + 620 * s + " " + 400 * s + " " + 280 * s),
                properties
            );
            addConstraint(x + 300 * s, y - height, 0, -10 * s, stiffness, composite[composite.length - 1], pin);

            //-
            spawn.bodyRect(x + 800 * s, y + 250 * s, 200 * s, 100 * s, 1, properties);
            body[body.length - 1].frictionAir = 0.05 //friction to make jump easier
            addConstraint(x + 900 * s, y - height, 0, -30 * s, stiffness, body[body.length - 1], pin);

            //g
            compound3Parts(
                x + 1400 * s,
                y + 300 * s,
                ("0 0 " + 250 * s + " 0 " + 425 * s + " " + 175 * s + " " + 425 * s + " " + 450 * s + " " + 275 * s + " " + 600 * s + " 0 " + 600 * s + " " + -175 * s + " " + 425 * s + " " + -175 * s + " " + 175 * s),
                x + 1636 * s,
                y + 633 * s,
                (425 * s + " " + 450 * s + " " + 425 * s + " " + 750 * s + " " + 375 * s + " " + 800 * s + " " + 275 * s + " " + 675 * s + " " + 275 * s + " " + 600 * s),
                x + 1398 * s,
                y + 737 * s,
                (375 * s + " " + 800 * s + " " + -75 * s + " " + 800 * s + " " + -75 * s + " " + 675 * s + " " + 275 * s + " " + 675 * s),
                properties
            );
            addConstraint(x + 1500 * s, y - height, 0, -15 * s, stiffness, composite[composite.length - 1], pin);

            //o
            spawn.bodyVertex(
                x + 2300 * s,
                y + 300 * s,
                ("0 0 " + 250 * s + " 0 " + 425 * s + " " + 175 * s + " " + 425 * s + " " + 425 * s + " " + 250 * s + " " + 600 * s + " 0 " + 600 * s + " " + -175 * s + " " + 425 * s + " " + -175 * s + " " + 175 * s),
                properties
            );
            addConstraint(x + 2300 * s, y - height, 0, -10 * s, stiffness, body[body.length - 1], pin);

            //n
            compound3Parts(
                x + 2900 * s,
                y + 310 * s,
                ("0 0 " + 200 * s + " 0 " + 200 * s + " " + 620 * s + " 0 " + 620 * s),
                x + 3100 * s,
                y + 160 * s,
                (200 * s + " " + 40 * s + " " + 400 * s + " " + 40 * s + " " + 400 * s + " " + 280 * s + " " + 200 * s + " " + 280 * s),
                x + 3300 * s,
                y + 333.3 * s,
                (400 * s + " " + 40 * s + " " + 540 * s + " " + 40 * s + " " + 600 * s + " " + 100 * s + " " + 600 * s + " " + 620 * s + " " + 400 * s + " " + 620 * s + " " + 400 * s + " " + 280 * s),
                properties
            );
            addConstraint(x + 3100 * s, y - height, 0, -10 * s, stiffness, composite[composite.length - 1], pin);
        }
    },
    tunnel() { // by Scarlettt
        simulation.makeTextLog(`<strong>tunnel</strong> by <span class='color-var'>Scarlettt</span>`);

        level.custom = () => {
            level.exit.drawAndCheck();

            //enter
            ctx.beginPath();
            ctx.moveTo(level.enter.x, level.enter.y + 30);
            ctx.lineTo(level.enter.x, level.enter.y - 80);
            ctx.bezierCurveTo(level.enter.x, level.enter.y - 170, level.enter.x + 100, level.enter.y - 170, level.enter.x + 100, level.enter.y - 80);
            ctx.lineTo(level.enter.x + 100, level.enter.y + 30);
            ctx.lineTo(level.enter.x, level.enter.y + 30);
            ctx.fillStyle = "#013";
            ctx.fill();

            //exit
            ctx.beginPath();
            ctx.moveTo(level.exit.x, level.exit.y + 30);
            ctx.lineTo(level.exit.x, level.exit.y - 80);
            ctx.bezierCurveTo(level.exit.x, level.exit.y - 170, level.exit.x + 100, level.exit.y - 170, level.exit.x + 100, level.exit.y - 80);
            ctx.lineTo(level.exit.x + 100, level.exit.y + 30);
            ctx.lineTo(level.exit.x, level.exit.y + 30);
            ctx.fillStyle = "#9ff";
            ctx.fill();

            // hiding rooms in path to second floor
            ctx.fillStyle = "#322";
            ctx.fillRect(3750, -1650, 3500, 350);

            // prevent the user from getting into the secreter room without defeating all mobs
            if (m.pos.x > 1500 && m.pos.x < 2500 && m.pos.y > -4000 && m.pos.y < -3500 && mob.reduce((a, i) => {
                    return a || ((Math.sqrt((i.position.x - 3600) * (i.position.x - 3600) + (i.position.y + 3600) * (i.position.y + 3600)) < 20000) && i.isDropPowerUp);
                }, false) && !emergencyActivated) {
                Matter.Body.setPosition(player, {
                    x: 2800,
                    y: m.pos.y
                });
            }

            button.query();
            isButtonTapped = isButtonTapped || !button.isUp;
            hazard.level(!isButtonTapped);
            if (Matter.Query.region([player], hazard).length) m.energy -= 0.001;

            buttonSec.query();
            buttonSec.draw();
            if (!buttonSec.isUp && !hasSecretButton) {
                for (var i = 0; i < 5; i++) {
                    powerUps.spawn(3614, -3700, "ammo");
                }
                hasSecretButton = true;
            }
            buttonThird.query();
            buttonThird.draw();
            if (!buttonThird.isUp && !hasSecretButton2) {
                for (var i = 0; i < 4; i++) powerUps.spawn(1614, -3700, "research");
                hasSecretButton2 = true;
            }
            if (!buttonSec.isUp) {
                secretAnimTrans += 2;
                secretAnimTime = 1;
                secretAnimTrans = Math.max(0, Math.min(secretAnimTrans, 60));
            } else {
                secretAnimTrans--;
                if (secretAnimTime) secretAnimTrans += 3;
                secretAnimTrans = Math.min(60, Math.max(secretAnimTrans, 0));
            }
            if (secretAnimTime > 0) {
                secretAnimTime++;
                if (secretAnimTime > 150) secretAnimTime = 0;
            }

            if (emergencyActivated || !buttonThird.isUp) {
                secretAnimTrans2 += 2;
                secretAnimTime2 = 1;
                secretAnimTrans2 = Math.max(0, Math.min(secretAnimTrans2, 60));
            } else {
                secretAnimTrans2--;
                if (secretAnimTime2) secretAnimTrans2 += 3;
                secretAnimTrans2 = Math.min(60, Math.max(secretAnimTrans2, 0));
            }
            if (secretAnimTime2 > 0) {
                secretAnimTime2++;
                if (secretAnimTime2 > 150) secretAnimTime2 = 0;
            }



            ctx.beginPath();
            ctx.arc(m.pos.x, m.pos.y, 200, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff25";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(m.pos.x, m.pos.y, 400, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff22";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(m.pos.x, m.pos.y, 700, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff21";
            ctx.fill();
            elevator.move();
            elevator.drawTrack();
        };
        level.customTopLayer = () => {
            hazard.query();
            secretHazard.level(emergencyActivated);
            secretHazard.query();
            button.draw();

            // Fire damage
            let isInRange = flames.reduce((a, i) => a || Math.sqrt((m.pos.x - i[0]) * (m.pos.x - i[0]) + (m.pos.y + 90 - i[1]) * (m.pos.y + 90 - i[1])) < 50, false);

            if (isInRange) {
                fireDmgLevel++;
                fireDmgLevel = Math.min(fireDmgLevel, 100);
            } else {
                fireDmgLevel--;
                fireDmgLevel = Math.max(fireDmgLevel, -8);
            }

            if (fireDmgLevel > -8) {
                ctx.fillStyle = "#fa0b";
                ctx.fillRect(m.pos.x - 50, m.pos.y - 100, Math.min(fireDmgLevel * 12.5 + 100, 100), 15);
            }

            if (fireDmgLevel > 0) {
                ctx.fillStyle = "#f00c";
                ctx.fillRect(m.pos.x - 50, m.pos.y - 100, fireDmgLevel, 15);

                m.damage(0.001 * (1.5 * isInRange + 1));

                drawFlame(m.pos.x, m.pos.y + 90, "#d40", Math.PI / 2 + 1);
                drawFlame(m.pos.x, m.pos.y + 90, "#d40", Math.PI / 2 + 1);
                drawFlame(m.pos.x, m.pos.y + 90, "#d40", Math.PI / 2 + 1);
                drawFlame(m.pos.x, m.pos.y + 90, "#d40", Math.PI / 2 - 1);
                drawFlame(m.pos.x, m.pos.y + 90, "#d40", Math.PI / 2 - 1);
                drawFlame(m.pos.x, m.pos.y + 90, "#d40", Math.PI / 2 - 1);
                drawFlame(m.pos.x, m.pos.y + 90, "#f70", Math.PI / 2);
                drawFlame(m.pos.x, m.pos.y + 90, "#f70", Math.PI / 2);
                drawFlame(m.pos.x, m.pos.y + 90, "#f70", Math.PI / 2);
            }

            for (let j = 0; j < 5; j++) {
                drawFlame(1130 + j * 10, -1700)
                for (let i = 0; i < 7; i++) drawFlame(2550 + i * 200, -2800);
                for (let i = 0; i < 10; i++) drawFlame(2800 + i * 500, -1650);
                for (let i = 0; i < 9; i++) drawFlame(1595 + i * 95, -3860);
                drawFlame(4850, -1300);
                drawFlame(6350, -1300);
            }
            ctx.fillStyle = "#541";
            for (let i = 0; i < 9; i++) {
                ctx.fillRect(1592 + i * 95, -3860, 6, 70);
            }

            if (m.pos.x > 1500 && m.pos.x < 3750 && m.pos.y > -5000 && m.pos.y < -3300) {
                secretRoomTrans -= 5;
                secretRoomTrans = Math.max(secretRoomTrans, 85);
            } else {
                secretRoomTrans += 5;
                secretRoomTrans = Math.min(secretRoomTrans, 250);
            }


            let hasMob = mob.reduce((a, i) => {
                return a || ((Math.sqrt((i.position.x - 3600) * (i.position.x - 3600) + (i.position.y + 3600) * (i.position.y + 3600)) < 20000) && i.isDropPowerUp);
            }, false) && !emergencyActivated;

            door.isClosing = hasMob;

            door.openClose();
            ctx.fillStyle = "#444444" + secretRoomTrans.toString(16);
            ctx.fillRect(1480, -5000, 2270, 1710);
            if (hasMob) {
                ctx.fillStyle = "#444";
                ctx.fillRect(1480, -5000, 1070, 1710);
            }

            if (secretAnimTrans > 0) {
                drawProject([3614, -3530], [2900, -3900], [3400, -3600], secretAnimTrans, 60);
                if (secretAnimTrans >= 42) {
                    ctx.font = "27px monospace";
                    ctx.textAlign = "start"
                    ctx.fillStyle = "#00ffff" + Math.floor((secretAnimTrans - 40) * 12.75).toString(16);
                    ctx.fillText("Waste Discharge Interruption:", 2910, -3870);
                    ctx.fillText("Owner 'Scarlet' not found", 2910, -3830);
                    ctx.fillText("Detected user: 'm'", 2910, -3790);
                    ctx.fillStyle = (hasMob ? "#ff6644" : "#ffff44") + Math.floor((secretAnimTrans - 40) * 12.75).toString(16);
                    ctx.fillText(hasMob ? "AREA HAS MOBS." : "Area clear.", 2910, -3710);
                    ctx.fillText(hasMob ? "'openDoor' failed." : "'openDoor' complete.", 2910, -3670);
                    ctx.strokeStyle = "#00ff00" + Math.floor((secretAnimTrans - 40) * 6).toString(16);
                    ctx.beginPath();
                    ctx.arc(3300, -3730, 60, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.arc(3330, -3730, 8, 0, 2 * Math.PI);
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#00ffff" + Math.floor((secretAnimTrans - 40) * 12.75).toString(16);
                    ctx.font = "30px monospace";
                    ctx.fillText("n-gon inc", 3300, -3630);

                    ctx.font = "25px Arial";
                }
            }
            if (secretAnimTrans2 > 0) {
                drawProject([1614, -3530], [2050, -3900], [1550, -3600], secretAnimTrans2, 60);
                if (secretAnimTrans2 >= 42) {
                    ctx.font = "27px monospace";
                    ctx.textAlign = "start";
                    ctx.fillStyle = "#00ffff" + Math.floor((secretAnimTrans2 - 40) * 12.75).toString(16);
                    ctx.fillText("SECURITY BREACH DETECTED", 1560, -3870);
                    ctx.fillText("Entity name: m", 1560, -3830);
                    ctx.fillStyle = (tech.totalCount < 25 ? (tech.totalCount < 10 ? "#ffff44" : "#22ff22") : "#ff6644") + Math.floor((secretAnimTrans2 - 40) * 12.75).toString(16);
                    ctx.fillText("Threat level: " + (tech.totalCount < 25 ? (tech.totalCount < 10 ? "Low" : "Medium") : "HIGH"), 1560, -3790);
                    if (tech.totalCount >= 15) ctx.fillText("PROCEDURE ACTIVATED", 1560, -3750);
                    ctx.strokeStyle = "#00ff00" + Math.floor((secretAnimTrans2 - 40) * 6).toString(16);
                    ctx.beginPath();
                    ctx.arc(1950, -3730, 60, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.arc(1980, -3730, 8, 0, 2 * Math.PI);
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#00ffff" + Math.floor((secretAnimTrans2 - 40) * 12.75).toString(16);
                    ctx.font = "30px monospace";
                    ctx.fillText("n-gon inc", 1950, -3630);

                    ctx.font = "25px Arial";
                    if (secretAnimTrans2 >= 60) {
                        if (!emergencyActivated && tech.totalCount >= 10) {
                            for (let i = 0; i < 5; i++) {
                                spawn.exploder(1614, -3900);
                                if (tech.totalCount >= 25) spawn.randomMob(1614, -3900, Infinity);
                            }
                            emergencyActivated = true;
                        }
                    }
                }
            }
        };
        level.setPosToSpawn(0, -50); //normal spawn
        level.exit.x = 8500;
        level.exit.y = 680;
        level.defaultZoom = 1800
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#123";
        // powerUps.spawnStartingPowerUps(1475, -1175);
        // spawn.debris(750, -2200, 3700, 16); //16 debris per level

        // spawn blocks
        spawn.mapRect(-100, 0, 1050, 100);
        spawn.mapRect(900, -300, 50, 300);
        spawn.mapRect(700, -300, 50, 200);

        // first room
        spawn.mapRect(-100, -350, 850, 50);
        spawn.mapRect(900, -350, 850, 50);
        spawn.mapRect(-100, -1550, 50, 1200);
        spawn.mapRect(1700, -1550, 50, 1200);
        spawn.mapRect(-100, -1550, 850, 50);
        spawn.mapRect(900, -1550, 850, 50);
        spawn.bodyRect(700, -400, 50, 50);
        spawn.bodyRect(900, -400, 50, 50);

        spawn.mapRect(500, -650, 650, 25);
        spawn.mapRect(200, -1000, 200, 25);
        spawn.mapRect(1250, -1000, 200, 25);
        spawn.mapRect(600, -1300, 450, 25);

        spawn.mapRect(700, -1650, 50, 100);
        spawn.mapRect(900, -1650, 50, 100);


        // pathway to second room
        spawn.mapRect(950, -1650, 3050, 50);
        spawn.mapRect(1100, -1700, 100, 50);

        // second room
        spawn.mapRect(0, -5000, 1500, 3000);
        spawn.mapRect(1500, -2050, 300, 50);
        spawn.mapRect(2000, -3100, 300, 1100);
        spawn.mapRect(1500, -5000, 2250, 1000);
        spawn.mapRect(1500, -3500, 1050, 225);
        spawn.mapRect(4000, -5000, 500, 3000);
        spawn.mapRect(3748, -5000, 252, 1550);

        spawn.mapRect(1700, -2400, 300, 50);
        spawn.mapRect(1500, -2750, 300, 50);

        spawn.mapRect(2300, -3000, 1700, 50);
        spawn.mapRect(2300, -2800, 1700, 800);
        spawn.mapRect(2450, -3300, 1300, 100);

        // secret room in second room
        spawn.mapRect(2700, -3500, 1050, 50);
        spawn.mapRect(2549, -5000, 1201, 1000);

        const buttonSec = level.button(3550, -3500);
        const buttonThird = level.button(1550, -3500);
        let hasSecretButton = false,
            hasSecretButton2 = false,
            secretAnimTrans = 0,
            secretAnimTime = 0,
            secretAnimTrans2 = 0,
            secretAnimTime2 = 0;
        let emergencyActivated = false;

        const door = level.door(2450, -4000, 100, 500, 490);
        const secretHazard = level.hazard(1500, -4000, 1000, 510, 0.01);

        // hazards
        const button = level.button(3800, -3000);
        const hazard = level.hazard(2300, -3090, 1700, 110, 0.005);
        let isButtonTapped = false;

        // if (b.inventory.length < 5) powerUps.spawn(3800, -3200, "gun");
        powerUps.spawn(3900, -3100, "heal", true, null, 30);
        powerUps.spawn(3900, -3100, "heal", true, null, 30);

        // path to the third room
        spawn.mapRect(2000, -1850, 50, 200);
        spawn.mapRect(2200, -2000, 50, 200);
        spawn.mapRect(2400, -1850, 50, 200);

        spawn.mapRect(4200, -1650, 1300, 50);
        spawn.mapRect(5700, -1650, 1300, 50);
        spawn.mapRect(7200, -1650, 750, 50);

        spawn.mapRect(3700, -1600, 50, 350);
        spawn.mapRect(7250, -1600, 50, 350);
        spawn.mapRect(3750, -1300, 3500, 50);
        spawn.mapRect(4500, -2150, 3550, 50)

        // third room
        spawn.mapRect(7900, -1600, 50, 1000);
        spawn.mapRect(8050, -3000, 50, 2400);
        spawn.mapRect(7000, -600, 950, 50);
        spawn.mapRect(8050, -600, 950, 50);
        spawn.mapRect(7000, -600, 50, 1000);
        spawn.mapRect(8950, -600, 50, 1000);
        spawn.mapRect(7000, 400, 950, 50);
        spawn.mapRect(8050, 400, 950, 50);
        spawn.mapRect(7900, 400, 50, 300);
        spawn.mapRect(7900, 700, 1000, 50);

        const elevator = level.elevator(7962.5, 500, 75, 50, -1800)


        // fire damage
        const flames = [];
        flames.push([1150, -1700], [1150, -1770]);
        for (let i = 0; i < 10; i++) flames.push([2800 + i * 500, -1650], [2800 + i * 500, -1720]);
        flames.push([4850, -1300], [6350, -1300], [4850, -1370], [6350, -1370]);

        let fireDmgLevel = -8;

        let secretRoomTrans = 250;

        // mobs
        let mobList1 = [
            [500, -750],
            [1150, -750],
            [825, -1100],
            [300, -1100],
            [1350, -1100]
        ];
        while (mobList1.length > 5 - Math.sqrt(simulation.difficulty * 2.5) && mobList1.length) {
            let rand = Math.floor(Math.random() * mobList1.length);
            spawn[["hopper", "sneaker", "striker"][Math.floor(Math.random() * 3)]](mobList1[rand][0], mobList1[rand][1], 60 + Math.random() * 10);
            mobList1.splice(rand, 1);
        }

        let hasLaser = spawn.pickList.includes("laser");
        if (hasLaser) spawn.pickList.splice(spawn.pickList.indexOf("laser"), 1);
        let mobList2 = [
            [50, -1400],
            [1600, -450],
            [50, -450],
            [1600, -1400]
        ];
        for (let i = 0; i < 10; i++) mobList2.push([2800 + i * 500, -1800]);
        while (mobList2.length && mob.length < -1 + 16 * Math.log10(simulation.difficulty + 1)) {
            let rand = Math.floor(Math.random() * mobList2.length);
            spawn.randomMob(...mobList2[rand]);
            mobList2.splice(rand, 1);
        }

        let groupList = ["spawn.randomGroup(8250, 575);",
            `spawn.randomGroup(3200, -3700);
        if (simulation.difficulty > 15) 
            spawn.randomGroup(3500, -3700, 0.3);`,
            "spawn.randomGroup(7800, -1800, 0.5);"
        ];
        while (groupList.length > 0) {
            let ind = Math.floor(Math.random() * groupList.length);
            Function(groupList[ind])();
            groupList.splice(ind, 1);
        }
        if (hasLaser) spawn.pickList.push("laser");

        spawn.shieldingBoss(3900, -3200, 70);

        let randomBoss = Math.floor(Math.random() * 2);
        if (simulation.difficulty > 5) spawn[["shooterBoss", "launcherBoss"][randomBoss]](7500, -150, 100, false);
        else spawn[["shooter", "launcher"][randomBoss]](7500, -150, 150);
        spawn[["shooter", "launcher"][randomBoss]](8500, -150, 150);

        // canvas stuff
        function drawFlame(x, y, color = "#f81", angle = Math.PI / 2) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                let randAng = (Math.random() - 0.5) * 2 + angle;
                randLen = 30 + Math.random() * 10;

                x = x + Math.cos(randAng) * randLen;
                y = y - Math.sin(randAng) * randLen;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        function drawProject(startPos, endPos1, endPos2, tValue, tValueM) {
            ctx.strokeStyle = "#003";
            ctx.fillStyle = "#0055aa" + ('0' + (tValue * 60 / tValueM).toString(16)).slice(-2);

            let inter = (tValueM - tValue) / tValueM;
            let endpos1i = endPos1.map((i, j) => (startPos[j] - i) * inter),
                endpos2i = endPos2.map((i, j) => (startPos[j] - i) * inter);

            ctx.beginPath();
            ctx.moveTo(endPos1[0] + endpos1i[0], endPos1[1] + endpos1i[1]);
            ctx.lineTo(...startPos);
            ctx.lineTo(endPos2[0] + endpos2i[0], endPos1[1] + endpos1i[1]);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(endPos1[0] + endpos1i[0], endPos1[1] + endpos1i[1]);
            ctx.lineTo(...startPos);
            ctx.lineTo(endPos1[0] + endpos1i[0], endPos2[1] + endpos2i[1]);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(endPos1[0] + endpos1i[0], endPos2[1] + endpos2i[1]);
            ctx.lineTo(...startPos);
            ctx.lineTo(endPos2[0] + endpos2i[0], endPos2[1] + endpos2i[1]);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(endPos2[0] + endpos2i[0], endPos2[1] + endpos2i[1]);
            ctx.lineTo(...startPos);
            ctx.lineTo(endPos2[0] + endpos2i[0], endPos1[1] + endpos1i[1]);
            ctx.fill();
            ctx.stroke();

            if (tValue >= tValueM * 2 / 3) {
                ctx.fillStyle = "#0055aa" + ('0' + Math.floor((tValue - tValueM * 2 / 3) * 6.25 * 60 / tValueM).toString(16)).slice(-2);
                ctx.strokeStyle = "#000033" + ('0' + Math.floor((tValue - tValueM * 2 / 3) * 12.75 * 60 / tValueM).toString(16)).slice(-2);
                ctx.fillRect(endPos1[0], endPos1[1], endPos2[0] - endPos1[0], endPos2[1] - endPos1[1]);
                ctx.shadowColor = "#00aaaa" + ('0' + Math.floor((tValue - tValueM * 2 / 3) * 12.75 * 60 / tValueM).toString(16)).slice(-2);
                ctx.shadowBlur = 10;
                ctx.strokeRect(endPos1[0], endPos1[1], endPos2[0] - endPos1[0], endPos2[1] - endPos1[1]);
                ctx.shadowBlur = 0;
                ctx.shadowColor = "#0000";
            }
        }
    },
    run() {
        simulation.makeTextLog(`<strong>run</strong> by <span class='color-var'>iNoobBoi</span>`);

        addPartToMap = (len) => { //adds new map elements to the level while the level is already running  //don't forget to run simulation.draw.setPaths() after you all the the elements so they show up visually
            map[len].collisionFilter.category = cat.map;
            map[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
            Matter.Body.setStatic(map[len], true); //make static
            Composite.add(engine.world, map[len]);
        }

        anotherBoss = (x, y) => {
            if (tech.isDuplicateBoss && Math.random() < tech.duplicationChance()) {
                tech.isScaleMobsWithDuplication = true
                spawn.randomLevelBoss(x, y, ["historyBoss"]);
                tech.isScaleMobsWithDuplication = false
            } else if (tech.isResearchBoss) {
                if (powerUps.research.count > 3) {
                    powerUps.research.changeRerolls(-4)
                    simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span> <span class='color-symbol'>-=</span> 4<br>${powerUps.research.count}`)
                } else {
                    tech.addJunkTechToPool(0.49)
                }
                spawn.randomLevelBoss(x, y, ["historyBoss"]);
            }
        }

        const climbPad = level.boost(8200, -200, 500);
        var climbTime = false;
        var climbGroup = 0;
        var initialSpawn = false;
        var endTime = false;

        let runMobList = [
            "hopper",
            "slasher",
            "striker",
            "stabber",
            "springer",
            "pulsar",
            "sneaker",
            "spinner",
            "grower",
            "focuser",
            "spawner",
        ];

        let removeList = [];

        level.custom = () => {
            level.exit.drawAndCheck();

            level.enter.draw();

            climbPad.query();

            if (m.pos.x > 8000 && climbTime === false) {
                spawn.mapRect(7800, -900, 200, 900);
                addPartToMap(map.length - 1);
                simulation.draw.setPaths();

                simulation.makeTextLog(`<strong>UNKNOWN</strong>: "Well done. Now climb."`, 600);
                simulation.makeTextLog(`<strong>UNKNOWN</strong>: "I left a gift at the top."`, 600);

                climbTime = true;
            } //toggles on a mapRect when player passes a certain area

            if (m.pos.x > 9000 && endTime === false) {
                simulation.makeTextLog("<strong>UNKNOWN</strong>: \"Good luck. I hope you get out of here.\"", 600);
                endTime = true;
            }

            for (i in mob) {
                mob[i].damageReduction = 0;
                Matter.Body.setVelocity(mob[i], {
                    x: mob[i].velocity.x * 0.97,
                    y: mob[i].velocity.y * 0.97
                });
            } //makes everything slow and immune
        };

        level.customTopLayer = () => {
            ctx.fillStyle = "#888";

            if (climbGroup === 0) {
                //toggle on fillRect: 1
                ctx.fillRect(8000, -900, 300, 100);
                ctx.fillRect(8500, -1800, 300, 100);
                ctx.fillRect(8300, -2700, 300, 100);
                ctx.fillRect(8000, -3600, 300, 100);
                ctx.fillRect(8200, -4500, 300, 100);
            } else if (climbGroup === 1) {
                //toggle on fillRect: 2
                ctx.fillRect(8300, -1200, 300, 100);
                ctx.fillRect(8500, -2100, 300, 100);
                ctx.fillRect(8100, -3000, 300, 100);
                ctx.fillRect(8000, -3900, 300, 100);
                ctx.fillRect(8200, -4800, 300, 100);
            } else if (climbGroup === 2) {
                //toggle on fillRect: 0
                ctx.fillRect(8500, -600, 300, 100);
                ctx.fillRect(8100, -1500, 300, 100);
                ctx.fillRect(8000, -2400, 300, 100);
                ctx.fillRect(8500, -3300, 300, 100);
                ctx.fillRect(8500, -4200, 300, 100);
            }

            if ((simulation.cycle % 120) === 0) {
                for (var i = 0; i < map.length; i++) {
                    if (map[i].isRemove) {
                        Matter.Composite.remove(engine.world, map[i]);
                        map.splice(i, 1);
                    }
                }

                if (climbGroup === 0) {
                    //toggle on platforms: 0
                    spawn.mapRect(8000, -900, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8500, -1800, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8300, -2700, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8000, -3600, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8200, -4500, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;

                    climbGroup = 1;
                } else if (climbGroup === 1) {
                    //toggle on platforms: 1
                    spawn.mapRect(8300, -1200, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8500, -2100, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8100, -3000, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8000, -3900, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8200, -4800, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;

                    climbGroup = 2;
                } else if (climbGroup === 2) {
                    //toggle on platforms: 2
                    spawn.mapRect(8500, -600, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8100, -1500, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8000, -2400, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8500, -3300, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;
                    spawn.mapRect(8500, -4200, 300, 100);
                    addPartToMap(map.length - 1);
                    map[map.length - 1].isRemove = true;

                    climbGroup = 0;
                }

                simulation.draw.setPaths(); //update map graphics
            } //every 120 cycles, first deletes previous group, then cycles through one of 3 toggle groups
        };

        if (!initialSpawn) {
            level.defaultZoom = 1300 //was 800 I changed this
            simulation.zoomTransition(level.defaultZoom)
            document.body.style.backgroundColor = "#dcdcde";
            //Level
            level.setPosToSpawn(-100, -1450);
            spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);

            level.exit.x = 9300;
            level.exit.y = -5130;
            spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 20);

            //Map
            spawn.mapRect(-1400, -2200, 1700, 200);
            spawn.mapRect(100, -2200, 200, 1000);
            spawn.mapRect(-600, -1400, 8600, 200);
            spawn.mapRect(-1400, -2200, 200, 1000);
            spawn.mapRect(-2800, -1400, 1600, 200);
            spawn.mapRect(-2800, -1400, 200, 1400);
            spawn.mapRect(-2800, -200, 11800, 200);
            spawn.mapRect(-900, -600, 600, 600);
            spawn.mapRect(200, -800, 500, 100);
            spawn.mapRect(1300, -1400, 200, 900);
            spawn.mapRect(1300, -600, 500, 100);
            spawn.mapRect(2300, -800, 200, 200);
            spawn.mapRect(2900, -400, 100, 400);
            spawn.mapRect(3200, -600, 100, 600);
            spawn.mapRect(3500, -800, 100, 800);
            spawn.mapRect(4400, -900, 500, 100);
            spawn.mapRect(4400, -600, 500, 100);
            spawn.mapRect(4800, -900, 100, 400);
            spawn.mapRect(5300, -550, 600, 550);
            spawn.mapRect(5600, -900, 300, 800);
            spawn.mapRect(6300, -300, 1100, 300);
            spawn.mapRect(6600, -400, 500, 200);
            spawn.mapRect(6600, -800, 500, 100);
            spawn.mapRect(7000, -1400, 100, 700);
            spawn.mapRect(7800, -5900, 200, 5100);
            spawn.mapRect(7800, -5900, 1900, 200);
            spawn.mapRect(9500, -5900, 200, 1000);
            spawn.mapRect(8800, -5100, 900, 200);
            spawn.mapRect(8800, -5100, 200, 5100);

            //Text
            spawn.mapRect(400, -1600, 100, 10);
            spawn.mapRect(400, -1600, 10, 100);
            spawn.mapRect(490, -1600, 10, 40);
            spawn.mapRect(400, -1570, 100, 10);
            spawn.mapRect(400, -1540, 100, 10);
            spawn.mapRect(490, -1540, 10, 40);

            spawn.mapRect(600, -1600, 10, 100);
            spawn.mapRect(600, -1510, 100, 10);
            spawn.mapRect(690, -1600, 10, 100);

            spawn.mapRect(800, -1600, 100, 10);
            spawn.mapRect(800, -1600, 10, 100);
            spawn.mapRect(890, -1600, 10, 100);

            spawn.mapRect(0, 0, 1, 1); //dont ask why i have these
            spawn.mapRect(1, 0, 1, 1); //dont ask why i have these
            spawn.mapRect(0, 1, 1, 1); //dont ask why i have these
            spawn.mapRect(1, 1, 1, 1); //dont ask why i have these
            spawn.mapRect(-1, 0, 1, 1); //dont ask why i have these
            spawn.mapRect(0, -1, 1, 1); //dont ask why i have these
            spawn.mapRect(-1, -1, 1, 1); //dont ask why i have these
            spawn.mapRect(1, -1, 1, 1); //dont ask why i have these
            spawn.mapRect(-1, 1, 1, 1); //dont ask why i have these

            //Mob Spawning
            setTimeout(() => {
                simulation.makeTextLog("<strong>UNKNOWN</strong>: \"You cannot kill them.\"", 600);
            }, 2000);

            setTimeout(() => {
                simulation.makeTextLog("<strong>UNKNOWN</strong>: \"But I have slowed them down for you.\"", 600);
            }, 6000);


            spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](200, -400);
            spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](1800, -1000);
            spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](3200, -1000);
            spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](6200, -400);

            if (simulation.difficulty > 10) {
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](1000, -400);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](2400, -400);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](4000, -400);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](6600, -1000);

                setTimeout(() => {
                    simulation.makeTextLog("<strong>UNKNOWN</strong>: \"Run.\"", 600);
                }, 10000);
            } //some of the mobs
            if (simulation.difficulty > 20) {
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](1000, -1000);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](3100, -300);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](4200, -1000);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](7400, -800);

                setTimeout(() => {
                    simulation.makeTextLog("<strong>UNKNOWN</strong>: \"RUN!\"", 600);
                }, 11000);
            } //most of the mobs
            if (simulation.difficulty > 30) {
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](200, -1000);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](3400, -300);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](5200, -800);
                spawn[runMobList[Math.floor(Math.random() * runMobList.length)]](7500, -300);

                setTimeout(() => {
                    simulation.makeTextLog("<strong>UNKNOWN</strong>: \"GET OUT OF HERE.\"", 600);
                }, 12000);
            } //all the mobs

            //Boss Spawning 
            if (simulation.difficulty > 5) {
                spawn.randomLevelBoss(-2200, -700, ["powerUpBossBaby", "blockBoss", "revolutionBoss"]);

                setTimeout(() => {
                    simulation.makeTextLog("<strong>UNKNOWN</strong>: \"They are coming for you.\"", 600);
                }, 14000);
            }
            anotherBoss(-1800, -700); //custom second boss spawn

            //Blocks
            spawn.bodyRect(1300, -500, 200, 100);
            spawn.bodyRect(1400, -500, 200, 100);
            spawn.bodyRect(1500, -500, 200, 100);

            spawn.bodyRect(5700, -1200, 100, 100);
            spawn.bodyRect(5700, -1100, 100, 100);
            spawn.bodyRect(5700, -1000, 100, 100);

            spawn.bodyRect(6800, -700, 100, 100);
            spawn.bodyRect(6800, -600, 100, 100);
            spawn.bodyRect(6800, -500, 100, 100);

            spawn.debris(4400, -300, 500, 16);
            spawn.debris(3300, -600, 200, 6);
            spawn.debris(3000, -500, 20, 6);
            spawn.debris(2300, -300, 200, 6);
            spawn.debris(200, -300, 500, 16);

            //Powerups
            if (simulation.difficulty > 10) {
                powerUps.spawn(1600, -700, "tech");
            }
            powerUps.spawnRandomPowerUp(1700, -700);

            // if (simulation.difficulty > 20) {
            //     powerUps.spawn(4600, -700, "tech");
            // }
            powerUps.spawnRandomPowerUp(4700, -700);

            // if (simulation.difficulty > 30) {
            //     powerUps.spawn(6800, -1000, "tech");
            // }
            powerUps.spawnRandomPowerUp(6900, -1000);

            powerUps.spawn(9200, -5400, "tech");

            if (simulation.difficulty > 10) {
                powerUps.spawn(9200, -5500, "tech");
            }
            // if (simulation.difficulty > 20) {
            //     powerUps.spawn(9200, -5600, "tech");
            // }
            // if (simulation.difficulty > 30) {
            //     powerUps.spawn(9200, -5700, "tech");
            // }
            powerUps.addResearchToLevel() //needs to run after mobs are spawned
            initialSpawn == true;
        }
    },
    islands() {
        simulation.makeTextLog(`<strong>islands</strong> by <span class='color-var'>Richard0820</span>`);

        const boost1 = level.boost(58500, -18264, 1300);
        let portal2, portal3;
        // const removeIndex1 = map.length - 1;
        const drip1 = level.drip(59300, -18975, -18250, 100); // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
        const drip2 = level.drip(60000, -18953, -18250, 150);
        const drip3 = level.drip(60905, -18652, -18250, 70);
        const slimePit1 = level.hazard(58850, -18300, 2275, 100, 0.01); //hazard(x, y, width, height, damage = 0.003) spawn.mapRect(58850, -18300, 2275, 100);
        const slimePit2 = level.hazard(74400, -18075, 350, 100, 0.01);
        let isSpawnedBoss = false;
        level.custom = () => {
            level.exit.drawAndCheck();
            boost1.query();
            level.enter.draw();
            drip1.draw();
            drip2.draw();
            drip3.draw();
            //      portal[2].query();
            //      portal[3].query();
            //      portal[0].draw();
            //      portal[1].draw();
            //      portal[2].draw();
            //      portal[3].draw();
            portal2[2].query();
            portal2[3].query();
            portal2[0].draw();
            portal2[1].draw();
            portal2[2].draw();
            portal2[3].draw();
            portal3[2].query();
            portal3[3].query();
            portal3[0].draw();
            portal3[1].draw();
            portal3[2].draw();
            portal3[3].draw();
        };
        level.customTopLayer = () => {
            slimePit1.query();
            slimePit2.query();
            ctx.fillStyle = `rgba(68, 68, 68, ${Math.max(0.3,Math.min((-17650 - m.pos.y) / 100, 0.99))})`;
            ctx.fillRect(58390, -17655, 1490, 740);
        };
        document.body.style.backgroundColor = "hsl(138, 3%, 74%)";
        level.setPosToSpawn(57680, -18330);
        level.exit.x = 76343;
        level.exit.y = -18020;
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 30);
        spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 30);
        level.defaultZoom = 2000;
        simulation.zoomTransition(level.defaultZoom);
        // spawn.setSpawnList = [
        //     "hopper",
        //     "slasher",
        //     "striker",
        //     "stabber",
        //     "springer",
        //     "pulsar",
        //     "sneaker",
        //     "spinner",
        //     "grower",
        //     "focuser",
        //     "spawner",
        // ];
        spawn.mapRect(57800, -18550, 50, 100);
        spawn.mapRect(57500, -18550, 50, 275);
        spawn.mapRect(66900, -18675, 300, 200);
        spawn.mapRect(66925, -19050, 125, 225);
        spawn.mapRect(67825, -16975, 125, 100);
        spawn.mapRect(74900, -18075, 225, 100);
        spawn.mapRect(73925, -18225, 150, 275);
        spawn.mapRect(76200, -18325, 50, 125);
        spawn.mapRect(76525, -18325, 75, 400);
        spawn.mapRect(61325, -18350, 50, 25);
        spawn.mapRect(61450, -18425, 50, 25);
        spawn.mapRect(61475, -18450, 25, 25);
        spawn.mapRect(58725, -18350, 125, 50);
        spawn.mapRect(58675, -18275, 50, 75);
        spawn.mapRect(58600, -18275, 75, 75);
        spawn.mapRect(58675, -18325, 50, 50);
        spawn.mapRect(58250, -16925, 1825, 1050);
        spawn.mapRect(57500, -18200, 4475, 550);
        spawn.mapRect(61500, -18475, 475, 275);
        spawn.mapRect(62175, -18575, 325, 400);
        spawn.mapRect(62900, -18850, 525, 375);
        spawn.mapRect(63900, -18925, 450, 400);
        spawn.mapRect(64725, -19000, 625, 500);
        spawn.mapRect(65825, -19050, 675, 400);
        spawn.mapRect(66800, -18950, 400, 400);
        spawn.mapRect(68775, -18850, 525, 400);
        spawn.mapRect(67375, -16900, 1800, 1450);
        spawn.mapRect(67375, -17475, 325, 575);
        spawn.mapRect(68900, -17500, 250, 500);
        spawn.mapRect(69425, -17050, 500, 475);
        spawn.mapRect(70400, -17150, 425, 175);
        spawn.mapRect(71175, -17325, 450, 325);
        spawn.mapRect(72000, -17425, 325, 300);
        spawn.mapRect(72725, -17450, 350, 275);
        spawn.mapRect(70050, -18800, 550, 350);
        spawn.mapRect(67750, -19400, 375, 1200);
        spawn.mapRect(67750, -18200, 1425, 700);
        spawn.mapRect(66800, -18550, 575, 1650);
        spawn.mapRect(66800, -16900, 575, 1450);
        spawn.mapRect(67350, -18175, 250, 750);
        spawn.mapRect(71050, -18450, 725, 275);
        spawn.mapRect(72100, -18150, 475, 200);
        spawn.mapRect(73325, -17975, 3275, 475);
        spawn.mapRect(73175, -17775, 150, 300);
        spawn.mapRect(72975, -17675, 225, 250);
        spawn.mapRect(76200, -18325, 400, 75);
        spawn.mapRect(76525, -18250, 75, 275);
        spawn.mapRect(76200, -18250, 50, 50);
        spawn.mapRect(57500, -17675, 900, 1800);
        spawn.mapRect(59875, -17675, 1975, 1800);
        spawn.mapRect(57550, -18275, 225, 75);
        spawn.mapRect(61375, -18375, 50, 50);
        spawn.mapRect(61100, -18350, 75, 50);
        spawn.mapRect(61175, -18325, 50, 25);
        spawn.mapRect(61850, -16525, 250, 175);
        spawn.mapRect(57500, -18500, 50, 325);
        spawn.mapRect(57500, -18550, 350, 50);
        spawn.mapRect(57800, -18500, 50, 50);
        spawn.mapRect(61275, -18325, 375, 125);
        spawn.mapRect(61425, -18400, 200, 75);
        spawn.mapRect(62125, -18575, 125, 75);
        spawn.mapRect(62250, -18200, 175, 125);
        spawn.mapRect(62850, -18725, 100, 75);
        spawn.mapRect(63075, -18550, 225, 225);
        spawn.mapRect(62800, -18275, 75, 75);
        spawn.mapRect(62500, -18475, 75, 50);
        spawn.mapRect(63825, -18900, 150, 50);
        spawn.mapRect(63950, -18575, 150, 125);
        spawn.mapRect(64200, -18550, 100, 250);
        spawn.mapRect(64925, -18525, 200, 275);
        spawn.mapRect(64625, -18425, 75, 125);
        spawn.mapRect(65225, -18675, 150, 175);
        spawn.mapRect(65350, -18950, 75, 100);
        spawn.mapRect(65950, -18575, 75, 150);
        spawn.mapRect(66000, -18725, 225, 175);
        spawn.mapRect(66275, -18675, 75, 125);
        spawn.mapRect(66275, -18550, 75, 75);
        spawn.mapRect(66150, -18550, 100, 50);
        spawn.mapRect(66225, -18875, 25, 150);
        spawn.mapRect(66200, -18750, 75, 25);
        spawn.mapRect(66925, -19100, 125, 150);
        spawn.mapRect(66000, -19100, 75, 50);
        spawn.mapRect(65000, -19075, 100, 75);
        spawn.mapRect(66750, -18625, 100, 100);
        spawn.mapRect(68050, -18500, 350, 350);
        spawn.mapRect(68125, -18975, 150, 475);
        spawn.mapRect(69850, -18675, 150, 200);
        spawn.mapRect(70000, -18625, 150, 50);
        spawn.mapRect(68850, -18575, 325, 225);
        spawn.mapRect(69100, -18400, 75, 100);
        spawn.mapRect(70150, -18525, 125, 200);
        spawn.mapRect(70425, -18525, 125, 200);
        spawn.mapRect(70250, -18350, 175, 225);
        spawn.mapRect(70325, -18475, 50, 150);
        spawn.mapRect(70275, -18450, 150, 150);
        spawn.mapRect(71175, -18250, 525, 250);
        spawn.mapRect(71050, -18200, 150, 375);
        spawn.mapRect(70925, -18300, 200, 250);
        spawn.mapRect(71425, -18525, 175, 150);
        spawn.mapRect(70225, -18950, 275, 250);
        spawn.mapRect(70475, -17050, 225, 175);
        spawn.mapRect(70625, -17250, 100, 150);
        spawn.mapRect(71300, -17150, 200, 350);
        spawn.mapRect(71100, -17250, 125, 100);
        spawn.mapRect(71550, -17400, 150, 150);
        spawn.mapRect(67675, -17150, 225, 300);
        spawn.mapRect(68225, -17000, 100, 125);
        spawn.mapRect(67900, -16975, 375, 100);
        spawn.mapRect(68275, -16950, 150, 50);
        spawn.bodyRect(76200, -18200, 50, 200);
        spawn.mapRect(76200, -18000, 50, 25);
        spawn.bodyRect(57800, -18450, 50, 175);
        spawn.mapRect(68725, -17600, 300, 250);
        spawn.mapRect(68625, -17550, 175, 100);
        spawn.mapRect(68850, -17400, 150, 125);
        spawn.mapRect(69325, -16900, 200, 225);
        spawn.mapRect(69575, -16625, 175, 275);
        spawn.mapRect(69850, -16875, 250, 200);
        spawn.mapRect(69875, -16650, 150, 300);
        spawn.mapRect(69825, -16800, 375, 325);
        spawn.mapRect(69650, -16775, 325, 475);
        spawn.mapRect(71975, -17325, 100, 125);
        spawn.mapRect(72075, -17200, 150, 150);
        spawn.mapRect(72275, -17350, 150, 150);
        spawn.mapRect(72325, -17275, 150, 225);
        spawn.mapRect(72225, -18050, 200, 225);
        spawn.mapRect(71925, -18150, 250, 175);
        spawn.mapRect(72075, -18275, 125, 175);
        spawn.mapRect(72500, -18025, 125, 175);
        spawn.mapRect(72400, -17975, 150, 175);
        spawn.mapRect(73925, -18225, 350, 275);
        spawn.mapRect(74750, -18125, 275, 175);
        spawn.mapRect(74250, -18100, 150, 75);
        spawn.mapRect(74275, -18050, 200, 75);
        spawn.mapRect(73750, -18100, 275, 125);
        spawn.mapRect(73075, -17475, 3525, 300);
        spawn.mapRect(73275, -17600, 3325, 225);
        spawn.mapRect(57775, -18250, 150, 50);
        spawn.mapRect(57775, -18275, 75, 25);
        spawn.mapRect(57925, -18225, 50, 25);
        spawn.debris(68300, -17000, 3700, 16);
        spawn.mapRect(62000, -16525, 100, 200);
        spawn.mapRect(59125, -19125, 325, 200);
        spawn.mapRect(59925, -19175, 350, 225);
        spawn.mapRect(60800, -18850, 275, 200);
        spawn.mapRect(75025, -18075, 200, 100);
        spawn.mapRect(75225, -18025, 100, 50);
        spawn.bodyRect(74300, -18150, 50, 25);
        spawn.bodyRect(73850, -18150, 75, 75);
        spawn.bodyRect(74700, -18000, 75, 50);
        spawn.bodyRect(74250, -18325, 25, 25);
        spawn.bodyRect(74275, -18325, 25, 25);
        spawn.bodyRect(74275, -18325, 25, 25);
        spawn.bodyRect(74300, -18325, 100, 25);
        //    portal = level.portal(
        //      {
        //        x: 58625,
        //        y: -16925,
        //      },
        //      1.5 * Math.PI,
        //      {
        //        //right
        //        x: 58625,
        //        y: -17650,
        //      },
        //      2.5 * Math.PI
        //    ); //right
        portal2 = level.portal({
                x: 61920,
                y: -16525,
            },
            1.5 * Math.PI, {
                //right
                x: 58400,
                y: -17325,
            },
            2 * Math.PI
        );
        portal3 = level.portal({
                x: 59865,
                y: -17300,
            },
            3 * Math.PI, {
                //right
                x: 60820,
                y: -31130,
            },
            2.5 * Math.PI
        );

        spawn.mapRect(60275, -32250, 975, 400);
        spawn.mapRect(60375, -31925, 275, 225);
        spawn.mapRect(61025, -31950, 175, 300);
        spawn.mapRect(60825, -31725, 100, 350);
        spawn.mapRect(60675, -31875, 200, 225);
        spawn.mapRect(60225, -31950, 100, 725);
        spawn.mapRect(60250, -31525, 250, 375);
        spawn.mapRect(60675, -31475, 425, 350);
        spawn.mapRect(60625, -32500, 225, 300);
        spawn.mapRect(61025, -32325, 125, 175);
        spawn.mapRect(60375, -32325, 175, 150);
        spawn.mapRect(60250, -19075, 100, 100);
        spawn.randomMob(59850, -18825, Infinity);
        spawn.randomMob(62325, -18800, Infinity);
        spawn.randomMob(61725, -18800, Infinity);
        spawn.randomMob(63050, -19025, Infinity);
        spawn.randomMob(64100, -19200, Infinity);
        spawn.randomMob(64225, -19100, Infinity);
        spawn.randomMob(64875, -19300, Infinity);
        spawn.randomMob(65125, -19325, Infinity);
        spawn.randomMob(65850, -19275, Infinity);
        spawn.randomMob(66200, -19300, Infinity);
        spawn.randomMob(65975, -19425, Infinity);
        spawn.randomMob(67925, -19600, Infinity);
        spawn.randomMob(66975, -19275, Infinity);
        spawn.randomMob(67550, -18750, Infinity);
        spawn.randomMob(69625, -17275, Infinity);
        spawn.randomMob(70550, -17350, Infinity);
        spawn.randomMob(71375, -17475, Infinity);
        spawn.randomMob(72200, -17600, Infinity);
        spawn.randomMob(73000, -18025, Infinity);
        spawn.randomMob(73850, -18350, Infinity);
        spawn.randomMob(75725, -18300, Infinity);
        spawn.randomMob(75875, -18275, Infinity);
        spawn.randomMob(75700, -18200, Infinity);
        spawn.randomMob(75550, -18275, Infinity);
        spawn.randomMob(75825, -18150, Infinity);
        spawn.randomMob(75575, -18150, Infinity);
        spawn.randomGroup(75575, -18150, 0);
        level.chain(67250, -19325, 0, true, 14, 20);
        spawn.mapRect(58725, -18300, 125, 100);
        spawn.mapRect(61100, -18300, 175, 100);
        spawn.mapRect(67175, -19375, 100, 100);
        spawn.mapRect(59125, -19125, 325, 200);
        spawn.mapRect(59925, -19175, 350, 225);
        spawn.mapRect(60800, -18850, 275, 200);
        spawn.mapRect(60850, -18725, 50, 200);
        spawn.mapRect(60950, -18675, 50, 200);
        spawn.mapRect(59975, -19025, 50, 250);
        spawn.mapRect(60125, -19025, 50, 400);
        spawn.mapRect(60075, -19025, 50, 450);
        spawn.mapRect(59425, -19075, 100, 100);
        spawn.mapRect(59175, -19000, 100, 225);
        spawn.mapRect(59325, -19000, 75, 450);
        spawn.mapRect(59050, -19000, 100, 100);
        spawn.mapRect(61050, -18775, 100, 75);
        spawn.mapRect(60725, -18850, 125, 125);
        spawn.bodyRect(61850, -16525, 250, 175);
        if (simulation.difficulty > 1) {
            spawn.randomGroup(75575, -18150, 0);
            spawn.randomLevelBoss(68450, -17300);
        }
        if (!isSpawnedBoss) {
            isSpawnedBoss = true;
            if (Math.random() < 0.33) {
                for (
                    let i = 0, len = Math.min(simulation.difficulty / 20, 6); i < len;
                    ++i
                )
                    spawn.bounceBoss(59025, -17325, 50, false);
            } else if (Math.random() < 0.5) {
                for (
                    let i = 0, len = Math.min(simulation.difficulty / 9, 8); i < len;
                    ++i
                )
                    spawn.sprayBoss(59025, -17325, 50, false);
            } else {
                for (
                    let i = 0, len = Math.min(simulation.difficulty / 6, 10); i < len;
                    ++i
                )
                    spawn.mineBoss(59025, -17325, 50, false);
            }
            powerUps.spawn(59352, -17115, "tech");
            // for (let i = 0, len = 3 + simulation.difficulty / 20; i < len; ++i) spawn.mantisBoss(1487 + 300 * i, -1525, 35, false)
        }
        simulation.fallHeight = -15000;
        powerUps.addResearchToLevel();
        powerUps.spawn(3000, -230, "heal");
        // level.difficultyIncrease(60)
    },
    temple() {
        simulation.makeTextLog(`<strong>temple</strong> by <span class='color-var'>Scar1337</span>`);

        const V = Vector;
        const Equation = (function() {
            function Equation(a, b, c) {
                this.a = a;
                this.b = b;
                this.c = c;
            }
            Equation.prototype.getXfromY = function(y) {
                return (-this.b * y - this.c) / this.a;
            }
            Equation.prototype.getYfromX = function(x) {
                return (-this.a * x - this.c) / this.b;
            }
            Equation.fromPoints = function(v1, v2) {
                if (v1.x === v2.x) return new Equation(1, 0, -v1.x);
                if (v1.y === v2.y) return new Equation(0, 1, -v1.y);
                const d = (v2.y - v1.y) / (v2.x - v1.x);
                return new Equation(-d, 1, d * v1.x - v1.y);
            };
            return Equation;
        })();
        const Rect = (function() {
            function Rect(x, y, w, h) {
                this.pos = { x, y };
                this.width = w;
                this.height = h;
            }
            Rect.prototype.has = function({ x, y }) {
                return x >= this.pos.x && x <= this.pos.x + this.width &&
                    y >= this.pos.y && y <= this.pos.y + this.height;
            }
            Rect.prototype.hasLine = function(eq) {
                const leftInter = eq.getYfromX(this.pos.x);
                const rightInter = eq.getYfromX(this.pos.x + this.width);
                const topInter = eq.getXfromY(this.pos.y);
                return (leftInter >= this.pos.y && leftInter <= this.pos.y + this.height) ||
                    (rightInter >= this.pos.y && rightInter <= this.pos.y + this.height) ||
                    (topInter >= this.pos.x && topInter <= this.pos.x + this.width);
            }
            Rect.prototype.addToMap = function() {
                spawn.mapRect(this.pos.x, this.pos.y, this.width, this.height);
            }
            Object.defineProperty(Rect.prototype, "midPos", {
                get() {
                    return V.add(this.pos, { x: this.width / 2, y: this.height / 2 });
                }
            });
            Rect.fromBounds = function(min, max) {
                return new Rect(min.x, min.y, max.x - min.x, max.y - min.y);
            }
            Rect.prototype.isCollidingWith = function(other) {
                const tc = {
                    p1: [this.pos.x, this.pos.y],
                    p2: [this.pos.x + this.width, this.pos.y + this.height]
                };
                const oc = {
                    p1: [other.pos.x, other.pos.y],
                    p2: [other.pos.x + other.width, other.pos.y + other.height]
                };

                // If one rectangle is on left side of other
                if (tc.p1[0] >= oc.p2[0] || oc.p1[0] >= tc.p2[0])
                    return false;

                // If one rectangle is above other
                if (tc.p1[1] >= oc.p2[1] || oc.p1[1] >= tc.p2[1])
                    return false;

                return true;
            }
            return Rect;
        })();

        function isInBound(bound) {
            return bound.has(player.bounds.min) || bound.has(player.bounds.max);
        }

        function addWIMP(x, y) {
            spawn.WIMP(x, y);
            const me = mob[mob.length - 1];
            me.isWIMP = true;
        }

        function relocateWIMPs(x, y) {
            for (const i of mob) {
                if (i.isWIMP) {
                    setPos(i, { x: x + 300 * (Math.random() - 0.5), y: y + 300 * (Math.random() - 0.5) });
                }
            }
        }

        function secondRoomSuckerBoss(x, y, isDark = false, radius = 25) {
            mobs.spawn(x, y, 12, radius, isDark ? "#000" : "#fff");
            let me = mob[mob.length - 1];
            me.isBoss = true;
            me.isDark = isDark;

            me.stroke = "transparent";
            me.eventHorizon = 500; // How family friendly content much do I have to reduce this
            me.seeAtDistance2 = 5e6; // Basically just see at all times, in the context it's given
            me.accelMag = 0.00003 * simulation.accelScale;
            me.collisionFilter.mask = cat.player | cat.bullet;
            me.memory = 1600;
            me.randomPRNGMult = Math.random() * 500;

            me.attackCycle = 0;
            me.lastAttackCycle = 0;
            Matter.Body.setDensity(me, 0.012); // extra dense, normal is 0.001 // makes effective life much larger
            me.onDeath = function() {
                // applying forces to player doesn't seem to work inside this method, not sure why
                powerUps.spawn(this.position.x + 20, this.position.y, "ammo");
                if (Math.random() > 0.5) powerUps.spawn(this.position.x, this.position.y, "ammo");
                if (Math.random() > 0.3) powerUps.spawn(this.position.x, this.position.y, "heal", true, null, 30 * (simulation.healScale ** 0.25) * Math.sqrt(tech.largerHeals) * Math.sqrt(0.1 + Math.random() * 0.5));
            };
            me.damageReduction = 0.25 / (tech.isScaleMobsWithDuplication ? 1 + tech.duplicationChance() : 1);
            me.do = function() {
                // keep it slow, to stop issues from explosion knock backs
                if (this.speed > 1) {
                    Matter.Body.setVelocity(this, {
                        x: this.velocity.x * 0.95,
                        y: this.velocity.y * 0.95
                    });
                }
                if (!(simulation.cycle % this.seePlayerFreq)) {
                    if (this.distanceToPlayer2() < this.seeAtDistance2) { // ignore cloak for black holes
                        this.locatePlayer();
                        if (!this.seePlayer.yes) this.seePlayer.yes = true;
                    } else if (this.seePlayer.recall) {
                        this.lostPlayer();
                    }
                }
                this.checkStatus();
                if (this.seePlayer.recall) {
                    // accelerate towards the player
                    const forceMag = this.accelMag * this.mass;
                    const dx = this.seePlayer.position.x - this.position.x
                    const dy = this.seePlayer.position.y - this.position.y
                    const mag = Math.sqrt(dx * dx + dy * dy)
                    this.force.x += forceMag * dx / mag;
                    this.force.y += forceMag * dy / mag;

                    // eventHorizon waves in and out
                    const eventHorizon = this.eventHorizon * (1 + 0.2 * Math.sin(simulation.cycle * 0.008));

                    // draw darkness
                    ctx.fillStyle = this.isDark ? "rgba(0,20,40,0.6)" : "rgba(225,215,255,0.6)";
                    DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.2, 0, 2 * Math.PI);
                    ctx.fillStyle = this.isDark ? "rgba(0,20,40,0.4)" : "rgba(225,215,255,0.4)";
                    DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.4, 0, 2 * Math.PI);
                    ctx.fillStyle = this.isDark ? "rgba(0,20,40,0.3)" : "rgba(225,215,255,0.3)";
                    DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.6, 0, 2 * Math.PI);
                    ctx.fillStyle = this.isDark ? "rgba(0,20,40,0.2)" : "rgba(225,215,255,0.2)";
                    DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.8, 0, 2 * Math.PI);
                    ctx.fillStyle = this.isDark ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
                    DrawTools.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
                    // when player is inside event horizon
                    if (distance(this.position, player.position) < eventHorizon) {
                        if (this.isDark) {
                            // Standard black hole stuff
                            if (m.immuneCycle < m.cycle) {
                                if (m.energy > 0) m.energy -= 0.003;
                                if (m.energy < 0.1) m.damage(0.00015 * simulation.dmgScale);
                            }
                            const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                            player.force.x -= 0.0005 * Math.cos(angle) * player.mass * (m.onGround ? 1.7 : 1);
                            player.force.y -= 0.0005 * Math.sin(angle) * player.mass;
                            // draw line to player
                            ctx.lineWidth = Math.min(60, this.radius * 2);
                            ctx.strokeStyle = "rgba(0,0,0,0.5)";
                            DrawTools.line([this.position, m.pos]);
                            ctx.fillStyle = "rgba(0,0,0,0.3)";
                            DrawTools.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                        } else {
                            // Lightning attacks
                            this.attackCycle++;
                            if (this.attackCycle >= 30) {
                                this.attackCycle = 0;
                                this.lastAttackCycle = simulation.cycle;
                                Matter.Body.setVelocity(player, V.add(player.velocity, { x: 0, y: -10 }));
                                if (m.immuneCycle < m.cycle) {
                                    if (m.energy > 0) m.energy -= 0.03;
                                    m.damage(0.005 * simulation.dmgScale);
                                }
                            }
                            DrawTools.lightning(this.position, m.pos, this.lastAttackCycle, this.randomPRNGMult);
                            ctx.fillStyle = `rgba(255,240,127,${0.12 * Math.max(15 - simulation.cycle + this.lastAttackCycle, 0)})`;
                            DrawTools.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                        }
                    }
                }
            }
        };

        function secondRoomPlacerBoss(x, y, isDark = false, size = 70) {
            mobs.spawn(x, y, isDark ? 3 : 4, size, isDark ? "#0008" : "#fff8");
            let me = mob[mob.length - 1];
            me.isBoss = true;
            me.isDark = isDark;

            me.stroke = isDark ? "#000" : "#fff";
            me.seeAtDistance2 = 5e6; // Basically just see at all times, in the context it's given
            me.accelMag = 0.0001 * simulation.accelScale;
            me.collisionFilter.mask = cat.player | cat.bullet;
            me.memory = 1600;
            me.randomPRNGMult = Math.random() * 500;

            me.attackCycle = 0;
            me.maxAttackCycle = isDark ? 90 : 240;
            Matter.Body.setDensity(me, 0.006); // extra dense, normal is 0.001 // makes effective life much larger
            me.onDeath = function() {
                powerUps.spawn(this.position.x + 20, this.position.y, "ammo");
                if (Math.random() > 0.5) powerUps.spawn(this.position.x, this.position.y, "ammo");
                if (Math.random() > 0.3) powerUps.spawn(this.position.x, this.position.y, "heal", true, null, 30 * (simulation.healScale ** 0.25) * Math.sqrt(tech.largerHeals) * Math.sqrt(0.1 + Math.random() * 0.5));
            };
            me.damageReduction = 0.25 / (tech.isScaleMobsWithDuplication ? 1 + tech.duplicationChance() : 1);
            me.do = function() {
                // keep it slow, to stop issues from explosion knock backs
                if (this.speed > 2) {
                    Matter.Body.setVelocity(this, {
                        x: this.velocity.x * 0.95,
                        y: this.velocity.y * 0.95
                    });
                }
                if (!(simulation.cycle % this.seePlayerFreq)) {
                    if (this.distanceToPlayer2() < this.seeAtDistance2) { // ignore cloak
                        this.locatePlayer();
                        if (!this.seePlayer.yes) this.seePlayer.yes = true;
                    } else if (this.seePlayer.recall) {
                        this.lostPlayer();
                    }
                }
                this.checkStatus();
                if (this.seePlayer.recall) {
                    // accelerate towards the player
                    const forceMag = this.accelMag * this.mass;
                    const dx = this.seePlayer.position.x - this.position.x
                    const dy = this.seePlayer.position.y - this.position.y
                    const mag = Math.sqrt(dx * dx + dy * dy)
                    this.force.x += forceMag * dx / mag;
                    this.force.y += forceMag * dy / mag;
                    this.attackCycle++;
                    if (this.attackCycle > this.maxAttackCycle) {
                        this.attackCycle = 0;
                        secondRoomObstacle(this.position.x, this.position.y, this.isDark, size);
                    }
                }
            }
        };

        function secondRoomObstacle(x, y, isDark = false, size = 70) {
            mobs.spawn(x, y, isDark ? 3 : 4, size, isDark ? "#0004" : "#fff4");
            let me = mob[mob.length - 1];

            me.stroke = isDark ? "#000b" : "#fffb";
            me.collisionFilter.mask = isDark ? cat.player | cat.bullet : 0;
            me.isDropPowerUp = false;
            me.showHealthBar = false;
            me.leaveBody = false;
            me.timeLeft = 1200;
            me.isObstacle = true;
            me.damageReduction = isDark ? 0.5 / (tech.isScaleMobsWithDuplication ? 1 + tech.duplicationChance() : 1) : 0;
            if (!isDark) {
                me.isBadTarget = true;
                me.attackCycle = 0;
                me.maxAttackCycle = 10;
                me.inertia = Infinity;
            }
            me.do = isDark ? function() {
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.95,
                    y: this.velocity.y * 0.95
                });
            } : function() {
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.95,
                    y: this.velocity.y * 0.95
                });
                if (Rect.fromBounds(this.bounds.min, this.bounds.max).isCollidingWith(Rect.fromBounds(player.bounds.min, player.bounds.max))) {
                    this.attackCycle++;
                    this.attackCycle = Math.min(this.attackCycle, 10);
                } else {
                    this.attackCycle--;
                    this.attackCycle = Math.max(this.attackCycle, 0);
                }
                if (this.attackCycle > 0) {
                    ctx.beginPath();
                    const vertices = this.vertices;
                    ctx.moveTo(vertices[0].x, vertices[0].y);
                    for (let j = 1, len = vertices.length; j < len; ++j) ctx.lineTo(vertices[j].x, vertices[j].y);
                    ctx.lineTo(vertices[0].x, vertices[0].y);
                    if (this.attackCycle >= 10) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = "rgb(255, 210, 64)";
                    }
                    ctx.fillStyle = `rgba(255, 210, 64, ${this.attackCycle / 15})`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    if (this.attackCycle >= 10) {
                        DrawTools.lightning(this.position, m.pos, simulation.cycle);
                        m.damage(0.003 * simulation.dmgScale);
                    }
                }
                this.timeLimit();
            }
        }

        function mobGrenade(...args) {
            spawn.grenade(...args);
            const pulseRadius = args[3] || Math.min(550, 250 + simulation.difficulty * 3)
            let me = mob[mob.length - 1];
            me.fill = "#ace";
            me.damageReduction = 0;
            me.onDeath = function() {
                //damage player if in range
                if (distance(player.position, this.position) < pulseRadius && m.immuneCycle < m.cycle) {
                    m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage
                    m.damage(0.02 * simulation.dmgScale);
                }
                simulation.drawList.push({ //add dmg to draw queue
                    x: this.position.x,
                    y: this.position.y,
                    radius: pulseRadius,
                    color: "rgba(170,204,238,0.3)",
                    time: simulation.drawTime
                });
            };
            me.do = function() {
                this.timeLimit();
                ctx.beginPath(); //draw explosion outline
                ctx.arc(this.position.x, this.position.y, pulseRadius * (1.01 - this.timeLeft / this.lifeSpan), 0, 2 * Math.PI); //* this.fireCycle / this.fireDelay
                ctx.fillStyle = "rgba(170,204,238,0.1)";
                ctx.fill();
            };
        }
        // Todo: nerf ThirdRoomBoss a bit?
        function thirdRoomBoss(x, y) {
            mobs.spawn(x, y, 6, 60, "#000");
            let me = mob[mob.length - 1];
            // Fix in place
            me.constraint = Constraint.create({
                pointA: {
                    x: me.position.x,
                    y: me.position.y
                },
                bodyB: me,
                stiffness: 1,
                damping: 1
            });
            Composite.add(engine.world, me.constraint);
            me.isBoss = true;

            me.stroke = "transparent";
            me.eventHorizon = 900;
            me.collisionFilter.mask = cat.player | cat.bullet | cat.body;

            me.memory = Infinity;
            me.attackCycle = 0;
            me.lastAttackCycle = 0;
            me.spawnCycle = 0;
            Matter.Body.setDensity(me, 0.08); //extra dense //normal is 0.001 //makes effective life much larger
            me.onDeath = function() {
                for (let j = 0; j < 8; j++) { //in case some mobs leave things after they die
                    for (let i = 0, len = mob.length; i < len; ++i) {
                        if (mob[i] !== this) {
                            if (mob[i].isInvulnerable) { //disable invulnerability
                                mob[i].isInvulnerable = false
                                mob[i].damageReduction = 1
                            }
                            mob[i].damage(Infinity, true);
                        }
                    }
                }
                // You earned it: One more tech
                powerUps.spawn(this.position.x, this.position.y, "tech");
                powerUps.spawnBossPowerUp(this.position.x, this.position.y);
                templePlayer.room3ToEndAnim = 1;
            };
            me.nextHealthThreshold = 0.75;
            me.trapCycle = 0;
            me.onDamage = function() {
                if (this.health < this.nextHealthThreshold) {
                    this.health = this.nextHealthThreshold - 0.01
                    this.nextHealthThreshold = Math.floor(this.health * 4) / 4 //0.75,0.5,0.25
                    this.trapCycle = 1;
                    this.isInvulnerable = true;
                    this.damageReduction = 0;
                }
            };
            me.damageReduction = 0.25 / (tech.isScaleMobsWithDuplication ? 1 + tech.duplicationChance() : 1);
            me.rings = [{
                colour: "#65f",
                radius: 300,
                id: 0
            }, {
                colour: "#0f0",
                radius: 400,
                id: 1
            }, {
                colour: "#f00",
                radius: 500,
                id: 2
            }];
            me.ring = function() {
                if (this.isInvulnerable) return;
                ctx.lineWidth = 10;
                for (const ring of this.rings) {
                    const radius = ring.radius * (1 + 0.3 * Math.sin(simulation.cycle / 60 * (ring.id + 2)));
                    if (Math.abs(distance(player.position, this.position) - radius) < 60 && m.immuneCycle < simulation.cycle) {
                        m.damage(0.4 / radius);
                    }
                    ctx.strokeStyle = ring.colour;
                    DrawTools.arcOut(this.position.x, this.position.y, radius, 0, Math.PI * 2);
                }
            }
            me.horizon = function() {
                if (this.isInvulnerable) return this.fill = "#f00";
                // eventHorizon waves in and out
                const eventHorizon = this.eventHorizon * (1 + 0.2 * Math.sin(simulation.cycle * 0.008));

                const charge = this.attackCycle / 90;
                this.fill = `rgb(${charge * 255},${charge * 255},${charge * 255})`;
                // draw darkness
                ctx.fillStyle = `rgba(${charge * 225},${20 + charge * 195},${40 + charge * 215},0.6)`;
                DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.2, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(${charge * 225},${20 + charge * 195},${40 + charge * 215},0.4)`;
                DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.4, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(${charge * 225},${20 + charge * 195},${40 + charge * 215},0.3)`;
                DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.6, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(${charge * 225},${20 + charge * 195},${40 + charge * 215},0.2)`;
                DrawTools.arc(this.position.x, this.position.y, eventHorizon * 0.8, 0, 2 * Math.PI);
                ctx.fillStyle = `rgba(${charge * 255},${charge * 255},${charge * 255},0.05)`;
                DrawTools.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);

                // when player is inside event horizon
                if (V.magnitude(V.sub(this.position, player.position)) < eventHorizon) {
                    // Standard black hole stuff
                    if (m.immuneCycle < m.cycle) {
                        if (m.energy > 0) m.energy -= 0.004;
                        if (m.energy < 0.1) m.damage(0.0002 * simulation.dmgScale);
                    }
                    const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                    player.force.x -= 0.001 * Math.cos(angle) * player.mass * (m.onGround ? 1.7 : 1);
                    player.force.y -= 0.001 * Math.sin(angle) * player.mass;
                    // draw line to player
                    ctx.lineWidth = Math.min(60, this.radius * 2);
                    ctx.strokeStyle = "rgba(0,0,0,0.5)";
                    DrawTools.line([this.position, m.pos]);
                    ctx.fillStyle = "rgba(0,0,0,0.3)";
                    DrawTools.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                    // Lightning attacks
                    this.attackCycle++;
                    if (this.attackCycle >= 90) {
                        this.attackCycle = 0;
                        this.lastAttackCycle = simulation.cycle;
                        Matter.Body.setVelocity(player, V.add(player.velocity, { x: 0, y: -20 }));
                        if (m.immuneCycle < m.cycle) {
                            m.damage(0.012 * simulation.dmgScale);
                        }
                    }
                    const lightningCycle = simulation.cycle * 2 / 3 + this.lastAttackCycle / 3;
                    DrawTools.lightning(this.position, m.pos, lightningCycle, 1, 12);
                    DrawTools.lightning(this.position, m.pos, lightningCycle, 2, 12);
                    ctx.fillStyle = `rgba(255,240,127,${0.12 * Math.max(15 - simulation.cycle + this.lastAttackCycle, 0)})`;
                    DrawTools.arc(m.pos.x, m.pos.y, 40, 0, 2 * Math.PI);
                }
            }
            me.periodicSpawns = function() {
                if (this.isInvulnerable) return;
                this.spawnCycle++;
                // Spawn annoying purple thing(s) that chases the player
                if (!(this.spawnCycle % 180)) {
                    spawn.seeker(this.position.x, this.position.y, 15 * (0.7 + 0.5 * Math.random()), 7);
                    spawn.seeker(this.position.x, this.position.y, 4 * (0.7 + 0.5 * Math.random()), 7);
                    spawn.seeker(this.position.x, this.position.y, 4 * (0.7 + 0.5 * Math.random()), 7);
                }
                // Spawn the annoying pink (now blue) exploder that doesn't chase the player
                if (!(this.spawnCycle % 300)) {
                    for (let i = 0; i < 3; i++) {
                        mobGrenade(1100 + 700 * i, -13030, undefined, Math.min(700, 300 + simulation.difficulty * 4), 10);
                        setVel(mob[mob.length - 1], { x: 0, y: -10 });
                        mobGrenade(1100 + 700 * i, -14370, undefined, Math.min(700, 300 + simulation.difficulty * 4), 10);
                        setVel(mob[mob.length - 1], { x: 0, y: 10 });
                    }
                }
                // Spawn a bunch of mobs
                if (simulation.difficulty > 10 && !(this.spawnCycle % 600)) {
                    // This is just ripped off of spawn.nodeGroup because I don't want the shield
                    const nodes = 3;
                    const radius = Math.ceil(Math.random() * 10) + 18;
                    const sideLength = Math.ceil(Math.random() * 100) + 70;
                    const stiffness = Math.random() * 0.03 + 0.005;
                    spawn.allowShields = false; //don't want shields on individual group mobs
                    const angle = 2 * Math.PI / nodes
                    for (let i = 0; i < nodes; ++i) {
                        spawn.focuser(x + sideLength * Math.sin(i * angle), y + sideLength * Math.cos(i * angle), radius);
                    }
                    spawn.constrainAllMobCombos(nodes, stiffness);
                    spawn.allowShields = true;
                }
            }
            me.invulnerableTrap = function() {
                if (this.trapCycle < 1) return;
                this.trapCycle++;
                // 24 is just an arbitrarily large number
                const spawnCycles = Math.min(24, Math.max(6, 4 + Math.floor(simulation.difficulty / 3)));
                // I have no idea how to balance at all, please help me
                const spawnDelay = Math.floor(5 + 10 / (1 + Math.sqrt(simulation.difficulty) / 5));
                if (this.trapCycle >= 90) {
                    const cycle = this.trapCycle - 90;
                    if (!(cycle % spawnDelay)) {
                        const radius = Math.min(500, 200 + simulation.difficulty * 3);
                        mobGrenade(600, -13050, 30, radius);
                        Matter.Body.setVelocity(mob[mob.length - 1], { x: 35, y: 0 });
                        mobGrenade(3000, -13050, 30, radius);
                        Matter.Body.setVelocity(mob[mob.length - 1], { x: -35, y: 0 });
                        mobGrenade(600, -14350, 30, radius);
                        Matter.Body.setVelocity(mob[mob.length - 1], { x: 35, y: 0 });
                        mobGrenade(3000, -14350, 30, radius);
                        Matter.Body.setVelocity(mob[mob.length - 1], { x: -35, y: 0 });
                        if (Math.floor(cycle / spawnDelay) >= spawnCycles - 1) {
                            this.trapCycle = 0;
                            this.isInvulnerable = false;
                            this.damageReduction = 0.25 / (tech.isScaleMobsWithDuplication ? 1 + tech.duplicationChance() : 1);
                        }
                    }
                }
                ctx.font = "100px Arial";
                ctx.fillStyle = "#f00";
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#f00";
                ctx.textAlign = "center";
                ctx.textBaseLine = "middle";
                ctx.fillText("!", 900, -13050);
                ctx.fillText("!", 900, -14350);
                ctx.fillText("!", 1800, -13050);
                ctx.fillText("!", 1800, -14350);
                ctx.fillText("!", 2700, -13050);
                ctx.fillText("!", 2700, -14350);
                ctx.shadowBlur = 0;
            }
            me.do = function() {
                this.checkStatus();
                this.horizon();
                this.ring();
                this.periodicSpawns();
                this.invulnerableTrap();
            }
        };
        let oldNextLevel = level.nextLevel;
        const oldFallHeight = simulation.fallHeight;
        level.nextLevel = () => {
            color.map = "#444";
            m.death = m.oldDeath;
            canvas.style.filter = "";
            level.nextLevel = oldNextLevel;
            simulation.fallHeight = oldFallHeight;
            oldNextLevel();
        }
        let bounds = [];
        let mobPositionsQueue = Array.from(Array(10), () => []);
        m.oldDeath = m.death;
        m.death = function() {
            if (!tech.isImmortal) {
                requestAnimationFrame(() => color.map = "#444");
                m.death = m.oldDeath;
                canvas.style.filter = "";
                level.nextLevel = oldNextLevel;
                simulation.fallHeight = oldFallHeight;
                m.oldDeath();
            } else {
                m.switchWorlds();
                Matter.Body.setPosition(player, {
                    x: level.enter.x + 50,
                    y: level.enter.y - 20
                });
                makeLore("How did you not die?");
                setTimeout(() => makeLore("I'll let you off this one time."), 2000);
                tech.isImmortal = false;
            }
        }
        let name = "⥟ᘊ5⪊Ыᳪៗⱕ␥ዘᑧ⍗";
        addPartToMap = (len = map.length - 1) => {
            map[len].collisionFilter.category = cat.map;
            map[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
            Matter.Body.setStatic(map[len], true); // make static
            Composite.add(engine.world, map[len]);
        }
        level.setPosToSpawn(50, -50); // normal spawn
        // Make the level exit really far away so WIMP powerups don't show up at all
        level.exit.x = 1e6;
        level.exit.y = -1e6;
        Promise.resolve().then(() => {
            // Clear all WIMPS and their research
            for (let i = 0; i < mob.length; i++) {
                while (mob[i] && !mob[i].isMACHO) {
                    mob[i].replace(i);
                }
            }
            for (let i = 0; i < powerUp.length; i++) {
                while (powerUp[i] && powerUp[i].name === "research") {
                    Matter.Composite.remove(engine.world, powerUp[i]);
                    powerUp.splice(i, 1);
                }
            }
            level.exit.x = 1500;
            level.exit.y = -30;
        });
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        spawn.mapRect(1500, -10, 100, 20);
        level.defaultZoom = 1800
        simulation.setZoom(1200);
        document.body.style.backgroundColor = "#daa69f";
        color.map = "#600";

        function box(x, y, w, h, s) {
            spawn.mapRect(x, y, w, s);
            spawn.mapRect(x, y, s, h);
            spawn.mapRect(x + w - s, y, s, h);
            spawn.mapRect(x, y + h - s, w, s);
        }

        function diamond(x, y, s) {
            spawn.mapVertex(x, y, `0 -${s}  -${s} 0  0 ${s}  ${s} 0`);
        }

        // Fake level
        bounds.push(new Rect(-200, -500, 2000, 600));
        box(-200, -500, 2000, 600, 100);

        // Actual level, Room 1
        const firstRoomBounds = new Rect(-200, -4000, 5000, 2100);
        bounds.push(firstRoomBounds);

        box(-200, -4000, 5000, 2100, 100);
        spawn.mapRect(-200, -2500, 1300, 100);
        spawn.mapRect(3500, -2500, 1300, 100);
        spawn.mapRect(-200, -4000, 1000, 1600);
        spawn.mapRect(3800, -4000, 1000, 1600);
        // Enter and Exit platforms
        spawn.mapRect(0, -2010, 100, 20);
        spawn.mapRect(4500, -2010, 100, 20);

        // Altar of Room 1
        spawn.mapRect(2100, -2200, 100, 300);
        spawn.mapRect(2400, -2200, 100, 300);
        spawn.mapRect(2070, -2200, 460, 20);

        spawn.debris(1700, -2100, 300, 10);
        spawn.debris(2500, -2100, 300, 10);

        // Actual level, Room 2
        const secondRoomBounds = new Rect(-1500, -10500, 3000, 3600);
        bounds.push(secondRoomBounds);

        box(-1500, -10500, 3000, 3600, 100);
        spawn.mapRect(-2000, -8500, 1600, 1600);
        spawn.mapRect(400, -8500, 1600, 1600);
        // Enter and Exit platforms
        spawn.mapRect(-50, -7010, 100, 20);
        spawn.mapRect(-50, -10010, 100, 20);

        // Hazard traversing
        spawn.mapRect(-300, -7320, 800, 20);
        spawn.mapRect(175, -7600, 325, 20);
        spawn.mapRect(200, -7775, 300, 20);
        spawn.mapRect(-500, -7600, 325, 20);
        spawn.mapRect(-500, -7775, 300, 20);
        spawn.mapRect(-500, -7950, 800, 20);
        spawn.mapRect(-300, -8100, 800, 20);
        spawn.mapRect(-500, -8250, 800, 20);
        for (let i = 0; i < 2; i++) spawn.mapRect(-250, -8400 + 150 * i, 500, 60);
        const room2SlimePit = level.hazard(-400, -8410, 800, 1090);
        room2SlimePit.logic = function() {
            if (this.height > 0 && Matter.Query.region([player], this).length) {
                if (m.immuneCycle < m.cycle) {
                    // Trolled
                    const hasCPT = tech.isRewindAvoidDeath;
                    tech.isRewindAvoidDeath = false;
                    const DRAIN = 0.002 * (tech.isRadioactiveResistance ? 0.25 : 1) + 0.001;
                    if (m.energy > DRAIN && !tech.isEnergyHealth) {
                        m.energy -= DRAIN;
                    }
                    m.damage(0.00015 * (tech.isRadioactiveResistance ? 0.25 : 1));
                    if (tech.isEnergyHealth) {
                        const previousEnergy = m.energy;
                        m.regenEnergy();
                        const energyRegenerated = m.energy - previousEnergy;
                        if (energyRegenerated > 0) {
                            m.energy = previousEnergy;
                            m.damage(energyRegenerated);
                        }
                    }
                    tech.isRewindAvoidDeath = hasCPT;
                }
                player.force.y -= 0.3 * player.mass * simulation.g;
                setVel(player, Vector.sub(player.velocity, { x: 0, y: player.velocity.y * 0.02 }));
            }
            // Float power ups
            powerUpCollide = Matter.Query.region(powerUp, this)
            for (let i = 0, len = powerUpCollide.length; i < len; i++) {
                const diameter = 2 * powerUpCollide[i].size
                const buoyancy = 1 - 0.2 * Math.max(0, Math.min(diameter, this.min.y - powerUpCollide[i].position.y + powerUpCollide[i].size)) / diameter
                powerUpCollide[i].force.y -= buoyancy * 1.14 * powerUpCollide[i].mass * simulation.g;
                setVel(powerUpCollide[i], { x: powerUpCollide[i].velocity.x, y: 0.96 * powerUpCollide[i].velocity.y });
            }
        }
        room2SlimePit.draw = function() {
            if (this.isOn) {
                ctx.fillStyle = "hsla(160, 100%, 35%, 0.75)";
                ctx.fillRect(this.min.x, this.min.y, this.width, this.height);
            }
        }
        // Room 2 spawning bounds
        const secondRoomSpawnBounds = new Rect(-1500, -10500, 3000, 2000);
        spawn.mapRect(-700, -8700, 150, 20);
        spawn.mapRect(550, -8700, 150, 20);
        spawn.mapRect(-400, -8900, 800, 20);
        diamond(-600, -9800, 30);
        diamond(0, -9800, 30);
        diamond(600, -9800, 30);

        spawn.mapRect(-1000, -10000, 2000, 30);

        // Actual level, Room 3 (Final Boss?)
        const thirdRoomBounds = new Rect(-200, -14500, 4000, 1600);
        bounds.push(thirdRoomBounds);
        box(-200, -14500, 4000, 1600, 100);
        spawn.mapRect(-200, -14500, 800, 1100);
        spawn.mapRect(3000, -14500, 800, 1100);
        // Enter and Exit platforms
        spawn.mapRect(0, -13110, 100, 20);
        spawn.mapRect(-200, -13100, 800, 200);
        spawn.mapRect(3500, -13110, 100, 20);
        spawn.mapRect(3000, -13100, 800, 200);
        for (let i = 0; i < 4; i++) spawn.bodyRect(570, -13400 + i * 75, 30, 75);

        for (let i = 0; i < 3; i++) {
            diamond(1100 + 700 * i, -13000, 30, 30);
            diamond(1100 + 700 * i, -14400, 30, 30);
        }

        const Objects = {
            altar: {
                get isHeal() {
                    return simulation.cycle % 600 >= 300;
                },
                pos: {
                    x: 2300,
                    y: -2200
                },
                get isActive() {
                    const roughPlayerCentre = V.add(m.pos, { x: 0, y: 40 });
                    return distance(roughPlayerCentre, this.pos) < 240 &&
                        (Math.abs(angle(roughPlayerCentre, this.pos) - Math.PI / 2) < 1);
                },
                logic() {
                    if (!this.isActive) return;
                    if (this.isHeal) {
                        m.energy += 0.005;
                    } else {
                        m.energy = Math.max(m.energy - 0.006, 0);
                        if (m.energy <= 0.01 && m.immuneCycle < m.cycle) m.damage(0.002);
                    }
                },
                drawTop() {
                    if (!isInBound(firstRoomBounds)) return;
                    const colour = this.isHeal ? m.fieldMeterColor : "#f00";
                    DrawTools.flame([2300, -2200, 26, 4, colour], 7);
                    ctx.fillStyle = colour;
                    ctx.fillRect(2200, -2200, 200, 200);
                },
                drawBottom() {
                    ctx.fillStyle = this.isHeal ? "#fff5" : "#0005";
                    for (const radius of [230, 180, 130, 80, 30]) {
                        DrawTools.arc(2300, -2200, radius, 0, Math.PI, true);
                    }
                }
            },
            room2Initiator: {
                pos: {
                    x: 0,
                    y: -9050
                },
                get distance() {
                    return distance(player.position, this.pos);
                },
                range: 120,
                rings: [{
                    colour: [102, 85, 255],
                    radius: 200
                }, {
                    colour: [0, 255, 0],
                    radius: 300
                }, {
                    colour: [255, 0, 0],
                    radius: 400
                }],
                get ringNumber() {
                    return this.rings.length;
                },
                get cap() {
                    return (this.ringNumber + 1) * 90 + 240;
                },
                get capped() {
                    return templePlayer.room2.spawnInitiatorCycles > this.cap;
                },
                logic() {
                    if (this.distance < this.range) {
                        templePlayer.room2.spawnInitiatorCycles++;
                    }
                },
                draw() {
                    Promise.resolve().then(() => {
                        const cycle = templePlayer.room2.spawnInitiatorCycles;
                        if (!this.capped && this.distance < 400) {
                            ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, (400 - this.distance) / (400 - this.range)) * 0.9})`;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        ctx.save();
                        simulation.camera();
                        if (this.distance < this.range && !this.capped) {
                            DrawTools.lightning(V.sub(this.pos, { x: 300, y: 300 }), V.add(this.pos, { x: 300, y: 300 }), simulation.cycle - 5);
                            DrawTools.lightning(V.add(this.pos, { x: -300, y: 300 }), V.add(this.pos, { x: 300, y: -300 }), simulation.cycle - 5);
                        }
                        if (!this.capped && cycle >= this.cap - 200) {
                            const multCoeff = (cycle - this.cap + 200) * 0.4
                            ctx.translate((Math.random() - 0.5) * multCoeff, (Math.random() - 0.5) * multCoeff);
                        }
                        ctx.shadowBlur = 20;
                        ctx.lineWidth = 12;
                        ctx.strokeStyle = (templePlayer.room2.cycles % 60 < 30) ? "#fff" : "#000";
                        ctx.shadowColor = (templePlayer.room2.cycles % 60 < 30) ? "#fff" : "#000";
                        DrawTools.arcOut(this.pos.x, this.pos.y, 100, 0, Math.PI * 2);
                        if (templePlayer.room2.cycles <= 100) {
                            for (let i = 0; i < this.ringNumber; i++) {
                                if (cycle < i * 90 + 90) break;
                                const ring = this.rings[i];
                                ctx.shadowColor = `rgb(${ring.colour.join(",")})`;
                                const opacity = this.capped ? 1 - 0.01 * templePlayer.room2.cycles : (cycle / 180 - i / 2 - 0.5);
                                ctx.strokeStyle = `rgba(${ring.colour.join(",")}, ${Math.min(opacity, 1)})`;
                                const radius = (this.capped ? 1 + 0.07 * templePlayer.room2.cycles : Math.sin(Math.min(cycle - i * 90 - 90, 45) / 90 * Math.PI)) * ring.radius;
                                DrawTools.arcOut(this.pos.x, this.pos.y, radius, 0, Math.PI * 2);
                            }
                        }
                        ctx.restore();
                    });
                }
            },
            room2Lightning: {
                one: [{ x: -1400, y: -10400 }, { x: 1400, y: -8500 }],
                two: [{ x: -1400, y: -8500 }, { x: 1400, y: -10400 }],
                get isHeal() {
                    return simulation.cycle % 360 < 180;
                },
                get oneEq() {
                    return Equation.fromPoints(this.one[0], this.one[1]);
                },
                get twoEq() {
                    return Equation.fromPoints(this.two[0], this.two[1]);
                },
                logic() {
                    if (!isInBound(secondRoomSpawnBounds) || !templePlayer.room2.cycles) return;

                    const playerbounds = Rect.fromBounds(player.bounds.min, player.bounds.max);
                    if (playerbounds.hasLine(this.oneEq) || playerbounds.hasLine(this.twoEq)) {
                        if (this.isHeal) {
                            m.energy += 0.003;
                        } else if (m.immuneCycle < m.cycle) {
                            m.energy -= 0.003;
                        }
                    }
                },
                draw() {
                    if (!isInBound(secondRoomBounds) || !templePlayer.room2.cycles) return;

                    const colour = this.isHeal ? undefined : [0, 0, 0];
                    DrawTools.lightning(...this.one, Math.floor(simulation.cycle / 15) * 15, 1, 9, colour);
                    DrawTools.lightning(...this.two, Math.floor(simulation.cycle / 15) * 15, 2, 9, colour);
                }
            },
            room2GeneratedPath: {
                rects: (function() {
                    const rects = [];
                    for (let i = 0; i < 4; i++) {
                        rects.push(new Rect(-1405 + (i & 1) * 200, -9700 + i * 300, 205, 30));
                        rects.push(new Rect(1200 - (i & 1) * 200, -9700 + i * 300, 205, 30));
                    }
                    return rects;
                })(),
                logic() {
                    if (templePlayer.room2.readyPathCycle && simulation.cycle - templePlayer.room2.readyPathCycle === 180) {
                        for (const r of this.rects) {
                            r.addToMap();
                            addPartToMap();
                            simulation.draw.setPaths();
                        }
                    }
                },
                draw() {
                    if (templePlayer.room2.readyPathCycle && simulation.cycle - templePlayer.room2.readyPathCycle < 180) {
                        ctx.fillStyle = "#fe79";
                        for (const r of this.rects) {
                            ctx.fillRect(r.pos.x, r.pos.y, r.width, r.height);
                        }
                    } else if (simulation.cycle - templePlayer.room2.readyPathCycle < 195) {
                        for (const r of this.rects) {
                            DrawTools.lightning(Objects.room2Initiator.pos, r.midPos, templePlayer.room2.readyPathCycle + 180);
                        }
                    }
                }
            },
            room3Rotors: {
                rotor1: (function() {
                    const rotor = level.spinner(900, -13700, 200, 30);
                    rotor.rotate = function() {
                        Matter.Body.setAngularVelocity(this.bodyB, (this.bodyB.angularVelocity + 0.01) * 0.9)
                    }
                    return rotor;
                })(),
                rotor2: (function() {
                    const rotor = level.spinner(2700, -13700, 200, 30);
                    rotor.rotate = function() {
                        Matter.Body.setAngularVelocity(this.bodyB, (this.bodyB.angularVelocity - 0.01) * 0.9)
                    }
                    return rotor;
                })(),
                logic() {
                    this.rotor1.rotate();
                    this.rotor2.rotate();
                }
            },
            room3SlimePits: {
                pit1: level.hazard(-100, -13400, 0, 0, 0.004),
                pit2: level.hazard(3700, -13400, 0, 0, 0.004),
                logic() {
                    if (templePlayer.room2ToRoom3Anim >= 1320 && templePlayer.room2ToRoom3Anim <= 1570) {
                        this.pit1.height = this.pit2.height = 300;
                        this.pit1.max.y = this.pit2.max.y = -13100;
                        this.pit1.width = this.pit2.width = templePlayer.room2ToRoom3Anim * 2 - 2640;
                        this.pit1.max.x = this.pit1.min.x + this.pit1.width;
                        this.pit2.min.x = this.pit2.max.x - this.pit2.width;
                    }
                    if (templePlayer.room3ToEndAnim) {
                        this.pit1.height = this.pit1.width = 0;
                        this.pit2.height = this.pit2.width = 0;
                    }
                },
                draw() {
                    this.pit1.query();
                    this.pit2.query();
                }
            }
        };
        let templePlayer = {
            room1: {
                cycles: 300
            },
            room2: {
                spawnInitiatorCycles: 0,
                cycles: 0,
                readyPathCycle: 0
            },
            stage: 1,
            startAnim: 0,
            room1ToRoom2Anim: 0,
            room2ToRoom3Anim: 0,
            room3ToEndAnim: 0,
            initialTrapY: 0,
            clearedCycle: 0,
            drawExit: true
        };

        const RoomTransitionHandler = {
            room0() {
                if (templePlayer.startAnim <= 0) return;
                templePlayer.startAnim++;
                if (templePlayer.startAnim == 120) {
                    makeLore("Not so fast.");
                }
                if (templePlayer.startAnim < 360) {
                    trapPlayer(1000, templePlayer.initialTrapY);
                } else {
                    level.exit.x = 4500;
                    level.exit.y = -2030;
                    relocateTo(50, -2050);
                    simulation.fallHeight = -1000;
                    simulation.setZoom(1800);
                    templePlayer.startAnim = -1;
                    templePlayer.drawExit = false;
                }
            },
            room1() {
                if (templePlayer.room1ToRoom2Anim <= 0) return;
                if (templePlayer.room1ToRoom2Anim === 1) {
                    level.exit.x = -50;
                    level.exit.y = -10030;
                    makeLore("Pathetic.");
                }
                if (templePlayer.room1ToRoom2Anim === 121) {
                    makeLore("You will never succeed.");
                }
                if (templePlayer.room1ToRoom2Anim >= 360 && templePlayer.room1ToRoom2Anim <= 720) {
                    const factor = 200 - 200 * Math.cos((templePlayer.room1ToRoom2Anim / 120 - 3) * Math.PI);
                    ctx.translate(factor, factor);
                    Promise.resolve().then(() => {
                        ctx.save();
                        ctx.globalCompositeOperation = "color-burn";
                        ctx.fillStyle = DrawTools.randomColours;
                        DrawTools.updateRandomColours(5);
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.restore();
                    });
                }
                if (templePlayer.room1ToRoom2Anim === 720) {
                    makeLore("You are trying too hard.");
                    relocateTo(0, -7050);
                    simulation.fallHeight = -6000;
                    templePlayer.stage = 2;
                }
                if (templePlayer.room1ToRoom2Anim === 960) {
                    makeLore("I have mastered the understandings of the universe.");
                }
                if (templePlayer.room1ToRoom2Anim === 1200) {
                    // Congrats, you discovered the actual words by looking at the source code. Are you happy now?
                    const x = (
                        ["a speck of dust", "an insignificant hindrance", "a tiny obstacle"]
                    )[Math.floor(Math.random() * 3)].split("");
                    for (let i = 0; i < x.length / 1.6; i++) {
                        const randomIndex = Math.floor(Math.random() * x.length);
                        if (x[randomIndex] !== " ") {
                            x[randomIndex] = String.fromCharCode(Math.floor(Math.random() * 50) + 192);
                        }
                    };
                    makeLore(`You are no more than ${x.join("")} to me.</h3></h2>`);
                    relocateWIMPs(0, -10030);
                }
                templePlayer.room1ToRoom2Anim++;
            },
            room2() {
                if (templePlayer.room2ToRoom3Anim <= 0) return;
                if (templePlayer.room2ToRoom3Anim === 1) {
                    level.exit.x = 3500;
                    level.exit.y = -13130;
                    makeLore("Do not try me.");
                }
                if (templePlayer.room2ToRoom3Anim === 180) {
                    makeLore("I have absolute power over you.");
                    canvas.style.filter = "hue-rotate(90deg)";
                }
                if (templePlayer.room2ToRoom3Anim === 360) {
                    makeLore("You will not succeed...");
                    canvas.style.filter = "invert(0.2)";
                }
                if (templePlayer.room2ToRoom3Anim === 420) {
                    makeLore("<h6 style='display: inline-block'>...</h6>");
                    canvas.style.filter = "invert(0.4)";
                }
                if (templePlayer.room2ToRoom3Anim > 480 && templePlayer.room2ToRoom3Anim <= 660) {
                    canvas.style.filter = `sepia(${(templePlayer.room2ToRoom3Anim - 480) / 180}) invert(${0.5 + (templePlayer.room2ToRoom3Anim - 480) / 180})`;
                }
                if (templePlayer.room2ToRoom3Anim === 780) {
                    makeLore("Do not interfere with me.");
                    templePlayer.stage = 3;
                    relocateTo(50, -13150);
                    simulation.fallHeight = -10000;
                    simulation.zoomTransition(1800);
                    templePlayer.startAnim = -1;
                    // Might be a bit harsh to the player if the WIMPs are involved in the third level
                    for (let i = 0; i < mob.length; i++) {
                        while (mob[i] && !mob[i].isWIMP) {
                            mob[i].replace(i);
                        }
                    }
                }
                if (templePlayer.room2ToRoom3Anim > 780 && templePlayer.room2ToRoom3Anim <= 960) {
                    canvas.style.filter = `sepia(${(960 - templePlayer.room2ToRoom3Anim) / 180}) invert(${(960 - templePlayer.room2ToRoom3Anim) / 180})`;
                }
                templePlayer.room2ToRoom3Anim++;
            },
            room3() {
                if (templePlayer.room3ToEndAnim <= 0) return;
                if (templePlayer.room3ToEndAnim === 1) {
                    makeLore("No.");
                }
                if (templePlayer.room3ToEndAnim === 120) {
                    makeLore("This cannot be.");
                }
                if (templePlayer.room3ToEndAnim === 240) {
                    makeLore("Has my power failed me?");
                }
                if (templePlayer.room3ToEndAnim === 360) {
                    makeLore("Was it worth it, destroying this place?");
                }
                if (templePlayer.room3ToEndAnim === 600) {
                    makeLore("No one is greater than me.");
                }
                const text = "noone-";
                for (let i = 0; i < 12; i++) {
                    if (templePlayer.room3ToEndAnim === 720 + i * 20) {
                        name = name.slice(0, -1);
                        simulation.makeTextLog(`<span style="font-size: 1em"><span style="color: #f00">${name}:</span> &nbsp; ${text[i % 6]}</span>`);
                        canvas.style.filter = `brightness(${1 - i / 22})`;
                    }
                }
                if (templePlayer.room3ToEndAnim === 1060) {
                    templePlayer.drawExit = true;
                    for (let i = 0; i < 5 * tech.wimpCount; i++) {
                        powerUps.spawn(level.exit.x + 100 * (Math.random() - 0.5), level.exit.y - 100 + 100 * (Math.random() - 0.5), "research", false);
                    }
                    canvas.style.filter = "";
                }
                templePlayer.room3ToEndAnim++;
            },
            end() {
                if (!templePlayer.clearedCycle) return;
                Promise.resolve().then(() => {
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.fillStyle = `rgba(0, 0, 0, ${(simulation.cycle - templePlayer.clearedCycle) / 300})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                });
                if (simulation.cycle - templePlayer.clearedCycle > 420) level.nextLevel();
            }
        };
        const LogicHandler = {
            bounds() {
                let isInBounds = false;
                for (const b of bounds) {
                    if (isInBound(b)) {
                        isInBounds = true;
                        break;
                    }
                }
                if (!isInBounds) {
                    m.damage(0.1 * simulation.difficultyMode);
                    trapPlayer(level.enter.x, level.enter.y);
                    simulation.makeTextLog("<span style='color: #f00'>" + name + "</span>: &nbsp; You thought I could let you get away with that?");
                }
            },
            room0() {
                // Block the player from entering the first seemingly innocuous exit
                if ((m.pos.x > 1000) && templePlayer.startAnim === 0) {
                    spawn.mapRect(1200, -500, 100, 600);
                    templePlayer.initialTrapY = Math.min(player.position.y, -75);
                    trapPlayer(1000, templePlayer.initialTrapY);

                    addPartToMap();
                    simulation.draw.setPaths();
                    templePlayer.startAnim = 1;
                }
            },
            room1() {
                WaveHandler.room1();
                Objects.altar.logic();
            },
            room2() {
                room2SlimePit.logic();
                Objects.room2Initiator.logic();
                Objects.room2Lightning.logic();
                Objects.room2GeneratedPath.logic();
                WaveHandler.room2();
            },
            room3() {
                Objects.room3Rotors.logic();
                Objects.room3SlimePits.logic();
                WaveHandler.room3();
            },
            exit() {
                if (!templePlayer.drawExit) return;
                if (player.position.x > level.exit.x &&
                    player.position.x < level.exit.x + 100 &&
                    player.position.y > level.exit.y - 150 &&
                    player.position.y < level.exit.y - 40 &&
                    player.velocity.y < 0.1 &&
                    level.exitCount + (input.down ? 8 : 2) > 100) {
                    if (templePlayer.stage === 1) {
                        templePlayer.drawExit = false;
                        level.exitCount = 0;
                        templePlayer.room1ToRoom2Anim = 1;
                    } else if (templePlayer.stage === 2) {
                        templePlayer.drawExit = false;
                        templePlayer.room2ToRoom3Anim = 1;
                        level.exitCount = 0;
                    } else {
                        level.exitCount = 99 - (input.down ? 8 : 2);
                        if (!templePlayer.clearedCycle) templePlayer.clearedCycle = simulation.cycle;
                    }
                }
            }
        };
        const DrawHandler = {
            // Bottom layer
            base() {
                // Draw base red background
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = color.map;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();

                // Draw the normal bg on the bounds
                ctx.fillStyle = "#eab6af";
                for (const b of bounds) {
                    if (isInBound(b)) ctx.fillRect(b.pos.x + 2, b.pos.y + 2, b.width - 4, b.height - 4);
                }
            },
            entrance() {
                ctx.beginPath();
                ctx.moveTo(level.enter.x, level.enter.y + 30);
                ctx.lineTo(level.enter.x, level.enter.y - 80);
                ctx.bezierCurveTo(level.enter.x, level.enter.y - 170, level.enter.x + 100, level.enter.y - 170, level.enter.x + 100, level.enter.y - 80);
                ctx.lineTo(level.enter.x + 100, level.enter.y + 30);
                ctx.lineTo(level.enter.x, level.enter.y + 30);
                ctx.fillStyle = "#fca";
                ctx.fill();
            },
            room1() {
                if (!isInBound(firstRoomBounds)) return;

                // Draw Cross
                ctx.fillStyle = "#fed";
                ctx.fillRect(2200, -3300, 200, 800);
                ctx.fillRect(2000, -3100, 600, 200);

                // Final boss-like spawn fire thing. Was it necessary? No!
                const spawnFlameAngle = Math.min(Math.min(templePlayer.room1.cycles, 2520) % 600, 120) * Math.PI / 30 + Math.PI / 2;
                DrawTools.flame([2300, -3000, 26, 4, "#f60", spawnFlameAngle], 7);

                Objects.altar.drawBottom();
            },
            room2() {
                if (!isInBound(secondRoomBounds)) return;

                if (templePlayer.room2.cycles) {
                    ctx.fillStyle = "#0006";
                    ctx.fillRect(secondRoomBounds.pos.x + 2, secondRoomBounds.pos.y + 2, secondRoomBounds.width - 4, secondRoomBounds.height - 4);
                }
                room2SlimePit.draw();
            },
            room3() {
                if (!isInBound(thirdRoomBounds)) return;
                ctx.fillStyle = "#0006";
                ctx.fillRect(thirdRoomBounds.pos.x + 2, thirdRoomBounds.pos.y + 2, thirdRoomBounds.width - 4, thirdRoomBounds.height - 4);
                Objects.room3SlimePits.draw();
            },
            // Top layer
            mobTrails() {
                if (simulation.cycle % 4 === 0) {
                    let newMobPositions = [];
                    for (const i of mob) {
                        if (!(i.isMACHO || i.isWIMP || i.isObstacle)) newMobPositions.push({ x: i.position.x, y: i.position.y });
                    }
                    mobPositionsQueue.shift();
                    mobPositionsQueue.push(newMobPositions);
                }
                // Draw "holy" trails for mobs for no particular reason at all
                ctx.strokeStyle = "#bae";
                ctx.lineWidth = 3;
                for (let i = 0; i < 10; i++) {
                    const p = mobPositionsQueue[i];
                    for (const m of p) {
                        DrawTools.holy(m.x, m.y, i / 2 + 10);
                    }
                }
                ctx.shadowBlur = 0;
            },
            waveTimer() {
                const roomConditions = [
                    isInBound(firstRoomBounds) && templePlayer.room1.cycles < 2400,
                    isInBound(secondRoomBounds) && templePlayer.room2.cycles > 0 && templePlayer.room2.cycles < 2160,
                    isInBound(thirdRoomBounds) && templePlayer.room2ToRoom3Anim < 1320
                ];
                Promise.resolve(roomConditions).then(roomConditions => {
                    // First Room
                    if (roomConditions[0]) {
                        ctx.save();
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        ctx.fillStyle = "#0004";
                        ctx.fillRect(canvas.width2 - 288, 50, 576, 20);
                        ctx.fillStyle = "#0cf";
                        ctx.fillRect(canvas.width2 - 288, 50, 0.96 * (600 - templePlayer.room1.cycles % 600), 20);
                        ctx.restore();
                    }
                    // Second Room
                    if (roomConditions[1]) {
                        ctx.save();
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        ctx.fillStyle = "#0004";
                        ctx.fillRect(canvas.width2 - 288, 50, 576, 20);
                        ctx.fillStyle = (Math.ceil(templePlayer.room2.cycles / 720) & 1) ? "#000" : "#e1d7ff";
                        ctx.fillRect(canvas.width2 - 288, 50, 0.8 * (720 - templePlayer.room2.cycles % 720), 20);
                        ctx.restore();
                    }
                    // Third Room
                    if (roomConditions[2]) {
                        ctx.save();
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                        ctx.fillStyle = "#0004";
                        ctx.fillRect(canvas.width2 - 288, 50, 576, 20);
                        ctx.fillStyle = "#000";
                        ctx.fillRect(canvas.width2 - 288, 50, 1.6 * (1320 - templePlayer.room2ToRoom3Anim), 20);
                        ctx.restore();
                    }
                });
            },
            room2Top() {
                if (!isInBound(secondRoomBounds)) return;
                Objects.room2Lightning.draw();
                Objects.room2GeneratedPath.draw();
                Objects.room2Initiator.draw();
            }
        };
        const WaveHandler = {
            room1() {
                if (!isInBound(firstRoomBounds)) return;
                if (templePlayer.room1.cycles === 0) powerUps.spawnStartingPowerUps(0, -2050);
                templePlayer.room1.cycles++;
                if (templePlayer.room1.cycles === 2400) {
                    spawn.secondaryBossChance(2300, -2800);
                    powerUps.addResearchToLevel();
                }
                if (templePlayer.room1.cycles % 600 === 0 && templePlayer.room1.cycles <= 2400) {
                    const spawnAmt = Math.min(3 + Math.pow(simulation.difficulty / 1.7, 0.6), 10) + Math.floor(templePlayer.room1.cycles / 720);
                    for (let i = 0; i < spawnAmt; i++) {
                        if (Math.random() < 0.5 + 0.07 * simulation.difficulty) {
                            spawn.randomMob(800 + Math.random() * 3e3, -2400 - Math.random() * 600, Infinity);
                        }
                    }
                    spawn.randomMob(800 + Math.random() * 3e3, -2400 - Math.random() * 600, Infinity);
                }
                if (templePlayer.room1.cycles === 2520) {
                    templePlayer.drawExit = true;
                }
            },
            room2() {
                if (!isInBound(secondRoomBounds)) return;
                if (templePlayer.room2.spawnInitiatorCycles > Objects.room2Initiator.cap) {
                    const randomSecondRoomBoss = [secondRoomSuckerBoss, secondRoomPlacerBoss];
                    if (templePlayer.room2.cycles % 720 === 0 && templePlayer.room2.cycles <= 2160) {
                        const isOdd = Math.floor(templePlayer.room2.cycles / 720) & 1;
                        randomSecondRoomBoss[Math.floor(randomSecondRoomBoss.length * Math.random())](-600, -9800, isOdd);
                        randomSecondRoomBoss[Math.floor(randomSecondRoomBoss.length * Math.random())](600, -9800, isOdd);
                        randomSecondRoomBoss[Math.floor(randomSecondRoomBoss.length * Math.random())](0, -9800, !isOdd);
                    }
                    templePlayer.room2.cycles++;
                    if (templePlayer.room2.cycles === 2400) {
                        templePlayer.drawExit = true;
                        templePlayer.room2.readyPathCycle = simulation.cycle;
                    }
                }
            },
            room3() {
                if (templePlayer.room2ToRoom3Anim === 1320) {
                    thirdRoomBoss(1800, -13700);
                    for (let i = 0; i < 3; i++) {
                        powerUps.spawn(m.spawnPos.x, m.spawnPos.y, "heal");
                    }
                }
            }
        };
        const DrawTools = {
            get randomColours() {
                return `rgb(${this._randomColours.join(",")})`
            },
            _randomColours: [Math.random() * 255, Math.random() * 255, Math.random() * 255],
            updateRandomColours(x = 0.8) {
                for (let i = 0; i < this._randomColours.length; i++) {
                    this._randomColours[i] = Math.max(Math.min(this._randomColours[i] + (this.randFact() * x * 2) - x, 255), 0);
                }
            },
            randFact() {
                return Math.random() * 0.8 + Math.sin(Date.now() / 300) * 0.2;
            },

            line(vecs) {
                ctx.beginPath();
                ctx.moveTo(vecs[0].x, vecs[0].y);
                for (const v of vecs.slice(1)) ctx.lineTo(v.x, v.y);
                ctx.stroke();
            },
            arc(...x) {
                ctx.beginPath();
                ctx.arc(...x);
                ctx.fill();
            },
            arcOut(...x) {
                ctx.beginPath();
                ctx.arc(...x);
                ctx.stroke();
            },
            flame(props, repeat) {
                for (let i = 0; i < repeat; i++) this.singleFlame(...props);
            },
            singleFlame(x, y, size = 10, repeat = 3, color = "#f00", angle = Math.PI / 2) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                const path = [{ x, y }];
                for (let i = 0; i < repeat; i++) {
                    const randAng = (Math.random() - 0.5) * 2 + angle;
                    const randLen = 2 * size + Math.random() * size;

                    x += Math.cos(randAng) * randLen;
                    y -= Math.sin(randAng) * randLen;
                    path.push({ x, y })
                }
                DrawTools.line(path);
            },
            lightning(from, to, cycle, randomPRNGMult = 1, width = 8, color = [255, 240, 127]) {
                const diff = simulation.cycle - cycle;
                if (diff >= 15) return;
                ctx.strokeStyle = `rgba(${color.join(",")},${(1 - diff / 15) * 255})`;
                ctx.lineWidth = width * (1 - diff / 15);
                ctx.shadowColor = `rgb(${color.join(",")})`;
                ctx.shadowBlur = 20;
                const path = [{ x: from.x, y: from.y }];
                let vector = { x: from.x, y: from.y };
                let distanceLeft = V.magnitude(V.sub(from, to));
                const d = distanceLeft > 800 ? distanceLeft / 40 : 20;
                const normalised = V.normalise(V.sub(to, from));
                while (1) {
                    const randOffset = rotateVector({ y: RNG(Math.floor(cycle * randomPRNGMult + distanceLeft)) * 2 * d - d, x: 0 }, normalised);
                    const randLen = RNG(Math.floor(cycle * (randomPRNGMult + 1) + distanceLeft)) * d + d;
                    distanceLeft -= randLen;
                    if (distanceLeft <= 0) {
                        path.push({ x: to.x, y: to.y });
                        break;
                    }
                    vector = V.add(vector, V.mult(normalised, randLen));
                    path.push({ x: vector.x + randOffset.x, y: vector.y + randOffset.y });
                }
                DrawTools.line(path);
                ctx.shadowBlur = 0;
            },
            holy(x, y, size = 12) {
                this.line([{ x, y: y - size }, { x: x - size, y },
                    { x, y: y + size }, { x: x + size, y }, { x, y: y - size }
                ]);
            }
        };

        function RNG(x) {
            x += Math.seed;
            let start = Math.pow(x % 97, 4.3) * 232344573;
            const a = 15485863;
            const b = 521791;
            start = (start * a) % b;
            for (let i = 0; i < (x * x) % 90 + 90; i++) {
                start = (start * a) % b;
            }
            return start / b;
        }

        function rotateVector(v, ang) {
            const c = typeof ang === "number" ? { x: Math.cos(ang), y: Math.sin(ang) } : V.normalise(ang);
            return { x: v.x * c.x - v.y * c.y, y: v.y * c.x + v.x * c.y };
        }

        function trapPlayer(x, y) {
            setPosAndFreeze(player, { x, y });
            const bLen = bullet.length;
            for (let i = 0; i < bLen; i++) {
                if (bullet[i].botType) setPosAndFreeze(bullet[i], V.add(player.position, { x: 100 * (RNG(i) - 0.5), y: 100 * (RNG(i + bLen) - 0.5) }));
            }
        }

        function relocateTo(x, y) {
            level.setPosToSpawn(x, y);
            trapPlayer(x, y);
            for (let i = 0; i < mob.length; i++) {
                if (mob[i].isMACHO) {
                    setPos(mob[i], { x, y });
                    break;
                }
            }
            m.resetHistory();
        }
        const distance = (a, b) => V.magnitude(V.sub(a, b));
        const angle = (a, b) => Math.atan2(b.y - a.y, a.x - b.x);
        const setPos = (a, b) => Matter.Body.setPosition(a, b);
        const setVel = (a, b) => Matter.Body.setVelocity(a, b);
        const freeze = a => setVel(a, { x: 0, y: 0 });
        const setPosAndFreeze = (a, b) => {
            setPos(a, b);
            freeze(a);
        };
        const makeLore = (x, t) => simulation.makeTextLog(`<h2 style='color: #f00; display: inline-block'>${name}:</h2> &nbsp; <h3 style='display: inline-block'>${x}</h3>`, t);
        level.custom = () => {
            // All the logic gets handled here. How nice!
            for (const i in LogicHandler) {
                LogicHandler[i]();
            }

            // Animations and lore for things that seem like exits
            for (const i in RoomTransitionHandler) {
                RoomTransitionHandler[i]();
            }

            // Bottom layer graphics
            DrawHandler.base();
            DrawHandler.room1();
            DrawHandler.room2();
            DrawHandler.room3();
            DrawHandler.entrance();
            if (templePlayer.drawExit) level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            // Top layer graphics
            DrawHandler.mobTrails();
            Objects.altar.drawTop();
            DrawHandler.waveTimer();
            DrawHandler.room2Top();
        };
    },
    dripp() {
        simulation.makeTextLog(`<strong>dripp</strong> by <span class='color-var'>M. B.</span>`);

        const door = level.door(780, -350, 15, 400, 265);
        const buttonDoor = level.button(420, -10);
        const boost = level.boost(130, -445);
        const hazard = level.hazard(690, -1050, 10, 700, 0.4)
        const hazard2 = level.hazard(2470, -1515, 162, 14, 0.4)
        const hazard3 = level.hazard(740, -1050, 10, 700, 0.4)
        const hazard4 = level.hazard(3400, -380, 350, 6, 0.2)
        const hazard5 = level.hazard(3425, -1420, 400, 8, 0.2)
        const slimePit = level.hazard(2250, -100, 2700, 200, 0.004, "hsla(160, 100%, 35%,0.75)")
        const door2 = level.door(3131, -898, 40, 520, 522)
        const buttonDoor2 = level.button(2495, -270)
        const toggle = level.toggle(1463, -708, true)
        const elevator = level.elevator(4310, -150, 200, 50, -1443, 0.0025, { up: 0.1, down: 0.2 })
        const portal = level.portal({ //main portals
            x: 2117,
            y: -1560
        }, -2 * Math.PI, { //up
            x: -80,
            y: -475
        }, -Math.PI / 100) //up

        const drip1 = level.drip(4100 + 1000 * Math.random(), -1900, 50, 100) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
        const drip2 = level.drip(4100 + 1000 * Math.random(), -1900, 50, 207) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
        const drip3 = level.drip(4100 + 1000 * Math.random(), -1900, 50, 133) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {
        const drip4 = level.drip(4100 + 1000 * Math.random(), -1900, 50, 157) // drip(x, yMin, yMax, period = 100, color = "hsla(160, 100%, 35%, 0.5)") {

        level.custom = () => {
            level.exit.drawAndCheck();

            drip1.draw()
            drip2.draw()
            drip3.draw()
            drip4.draw()
            buttonDoor.query();
            buttonDoor.draw();
            if (buttonDoor.isUp) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();

            buttonDoor2.query();
            buttonDoor2.draw();
            if (buttonDoor2.isUp) {
                door2.isClosing = true
            } else {
                door2.isClosing = false
            }
            door2.openClose();

            // shadow/shades builds  
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
            ctx.fillRect(3169, -900, 891, 580)
            ctx.fillRect(417, -1057, 380, 730)
            ctx.fillRect(930, -515, 207, 520)
            ctx.fillRect(930, -1280, 207, 760)
            ctx.fillRect(1220, -1280, 54, 800)
            ctx.fillRect(1221, -1394, 451, 1398)
            ctx.fillRect(1924, -800, 219, 674)
            ctx.fillRect(2264, -1488, 214, 1550)
            ctx.fillRect(2631, -1488, 201, 1550)
            ctx.fillRect(2889, -930, 237, 1090)
            ctx.fillRect(3124, -311, 957, 360)
            ctx.fillRect(1919, -1480, 220, 700)
            // ctx.fillRect(1768, -1200, 71, 500)
            level.enter.draw();
            elevator.move();
            toggle.query();
        };
        level.customTopLayer = () => {
            boost.query();
            hazard.opticalQuery();
            hazard2.opticalQuery();
            hazard3.opticalQuery();
            hazard4.opticalQuery();
            hazard5.opticalQuery();
            slimePit.query();
            // slimePit.draw();
            hazard.isOn = toggle.isOn
            hazard3.isOn = toggle.isOn
            portal[0].draw();
            portal[1].draw();
            portal[2].draw();
            portal[2].query()
            portal[3].query()
        };
        level.setPosToSpawn(0, -50); //normal spawn
        level.exit.x = 1400;
        level.exit.y = -1500;
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);
        level.defaultZoom = 1800
        simulation.zoomTransition(level.defaultZoom)
        document.body.style.backgroundColor = "#d8dadf";

        //builds   
        spawn.mapRect(-100, 0, 1485, 100);
        spawn.mapRect(-279, -750, 200, 850);
        spawn.mapRect(1781, -125, 375, 75);
        spawn.mapRect(1670, -100, 590, 200);
        spawn.mapRect(2261, 50, 3100, 50);
        spawn.mapRect(2420, -260, 300, 50);
        spawn.bodyRect(235, -240, 50, 50, 1, spawn.propSLide)
        spawn.mapRect(410, -1100, 400, 50);
        spawn.mapRect(1220, -1470, 420, 80)
        spawn.mapRect(927, -1325, 220, 50);
        spawn.mapRect(4950, -200, 425, 375);
        spawn.bodyRect(5200, -300, 100, 100);

        //random builds
        spawn.mapRect(2150, 50, 225, 50);

        //large border walls
        spawn.mapRect(-300, -2375, 6075, 475);
        spawn.mapRect(-951, -2374, 675, 2476);
        spawn.mapRect(-950, 100, 6950, 500);
        spawn.mapRect(5300, -2374, 700, 2700);

        // create enemies
        spawn.randomMob(3000, -300, 0.5);
        spawn.randomMob(1900, -1000, 0.5);
        spawn.randomMob(2960, -800, 0.6)
        spawn.randomMob(3500, -1700, 0.4)
        spawn.randomMob(800, -1700, 0.6)
        spawn.randomMob(100, -1150, 0.6)
        spawn.randomMob(1095, -700, 0.6)

        //powerUps    
        powerUps.spawn(590, -200, "ammo")
        powerUps.spawn(600, -200, "heal")
        // powerUps.spawn(590, -200, "gun")
        powerUps.spawnStartingPowerUps(590, -200);

        // more builds
        spawn.blockDoor(1230, -1490)
        // spawn.blockDoor(728, -1130);
        spawn.mapRect(-100, -380, 900, 50);
        spawn.mapRect(-279, -1400, 200, 650);
        spawn.mapRect(-279, -1900, 200, 650);
        // spawn.mapRect(-100, -1900, 2300, 75);
        // spawn.mapRect(2200, -1900, 1025, 75);
        // spawn.mapRect(2700, -1900, 2000, 75);
        spawn.mapRect(2270, -1530, 199, 50);
        spawn.mapRect(2633, -1530, 199, 50)
        // spawn.mapRect(4570, -1825, 125, 1925);
        spawn.mapRect(3106, -400, 300, 50)
        spawn.mapRect(3750, -400, 330, 50)
        spawn.mapRect(3130, -1030, 930, 130);
        spawn.mapRect(4015, -900, 46, 275);
        spawn.blockDoor(4016, -400)
        spawn.mapRect(3168, -1440, 290, 50);
        spawn.mapRect(3771, -1440, 294, 50);
        spawn.mapRect(3106, -355, 974, 42);
        spawn.mapRect(3228, -1395, 834, 380);
        spawn.mapRect(3129, -1350, 100, 325);
        spawn.mapRect(3129, -1400, 175, 100);
        spawn.mapRect(3129, -1437, 125, 75);
        spawn.mapRect(1382, 0, 295, 100);
        spawn.mapRect(1600, -50, 560, 85);
        spawn.mapRect(2264, -945, 220, 50);
        spawn.mapRect(1925, -800, 220, 50);
        spawn.mapRect(1390, -700, 260, 50);
        spawn.mapRect(927, -520, 220, 50);
        spawn.mapRect(2894, -948, 300, 50)
        spawn.mapRect(1230, -1825, 440, 81);
        spawn.mapRect(1616, -1750, 54, 360);
        spawn.mapRect(3128, -1440, 50, 50);
        spawn.mapRect(1705, -120, 125, 75);
        spawn.mapRect(1550, -25, 150, 50);
        spawn.mapRect(1628, -75, 100, 50);
        spawn.mapRect(1729, -130, 650, 75);
        //ground for blue portal
        spawn.mapRect(1917, -1484, 300, 50);
        spawn.mapRect(1917, -1950, 200, 325);
        spawn.mapRect(1917, -1825, 50, 375);

        //split
        spawn.mapRect(1221, -1420, 57, 465);
        spawn.mapRect(1221, -634, 57, 450);
        spawn.bodyRect(1227, -105, 42, 189, 1, spawn.propSlide)
        // spawn.mapRect(1770, -1900, 70, 750);
        spawn.mapRect(1770, -780, 70, 400)
        spawn.bodyRect(1783, -289, 38, 250, 1, spawn.propSlide)
        if (simulation.difficulty > 1) spawn.randomLevelBoss(4800, -750);
        spawn.secondaryBossChance(4700, -1500)

        powerUps.addResearchToLevel() //needs to run after mobs are spawned
    },
    biohazard() {
        // MAP BY INOOBBOI AND THESHWARMA
        simulation.makeTextLog(`<strong>biohazard</strong> by <span class='color-var'>INOOBBOI</span> and <span class='color-var'>THESHWARMA</span>`);

        // set here for the cutscene later
        level.setPosToSpawn(-2800, -150)

        // set up cutscenes
        simulation.cutscene = (locations, speed, stay, xPos = m.pos.x, yPos = m.pos.y) => {
            // locations: an array of location vectors, reversed for the pop ahead
            locations.reverse()
            // speed: the speed of the cutscene transition (0 to 1)
            // stay: how much to stay in the destination (ticks)
            // xPos & yPos: the initial location, also used as the current location

            // start by disabling the default camera draw. Don't worry, it's backed up
            const camera = simulation.camera
            // create a new camera function
            simulation.camera = () => {
                ctx.save()
                ctx.translate(canvas.width2, canvas.height2) //center
                ctx.scale(simulation.zoom, simulation.zoom)
                const xScaled = canvas.width2 - xPos
                const yScaled = canvas.height2 - yPos
                ctx.translate(-canvas.width2 + xScaled, -canvas.height2 + yScaled) //translate
            }

            // and set a restoring function
            const restore = () => (simulation.camera = camera)

            // then choose the next destination. There should be always at least one destination,
            // if there isn't there's no point checking, the game should and will crash
            let dest = locations.pop()
            // animate the camera
            const lerp = (first, second, percent) => first * (1 - percent) + second * percent
            const speedDelta = speed / 5
            // wait timer
            let wait = 0
            // polls the animation, should be called every tick
            const poll = () => {
                // update position
                xPos = lerp(xPos, dest.x, speedDelta)
                yPos = lerp(yPos, dest.y, speedDelta)
                // if position is close enough, wait and go to the next position
                const TOO_CLOSE = 100
                if (Math.abs(dest.x - xPos) < TOO_CLOSE && Math.abs(dest.y - yPos) < TOO_CLOSE) {
                    // wait for a bit
                    if (++wait > stay) {
                        // if there is another target, reset the wait timer and go there
                        // otherwise end the cutscene
                        wait = 0
                        if (!(dest = locations.pop())) {
                            // no more locations! End
                            restore()
                            return true
                        }
                    }
                }
                // early return if the player skips by fielding
                if (input.field) {
                    restore()
                    return true
                }
                return false
            }
            return poll
        }

        const boost1 = level.boost(-1400, -100, 900)
        const boost2 = level.boost(500, -900, 2500)
        const boost3 = level.boost(4200, -100, 900)
        const boost4 = level.boost(2200, -900, 2500)

        const toggle = level.toggle(1340, -600, false, true)

        let bossInit = false

        const cutscenePoll = simulation.cutscene([{ x: 230, y: -2700 }, { x: 3500, y: -1400 }, { x: 1450, y: -1150 }, m.pos], 0.1, 10)
        let hasEnded = false

        // ** PROPS ** 
        // create some drips
        const rndInRange = (min, max) => Math.random() * (max - min) + min

        const amount = Math.round(5 + 20 * Math.random())
        const drips = []
        for (let i = 0; i < amount; i++) {
            const locX = rndInRange(-2000, 4800)
            drips.push(level.drip(locX, -3100, 1500, 200 + Math.random() * 500))
        }

        // a barrel of radioactive waste, which can drop ammo and heals
        const barrelMob = (x, y, dirVector) => {
            const MAX_WIDTH = 150
            const personalWidth = MAX_WIDTH / 2
            mobs.spawn(x, y, 4, personalWidth, 'rgb(232, 191, 40)')
            const me = mob[mob.length - 1]
            // steal some vertices
            const betterVertices = Matter.Bodies.rectangle(x, y, personalWidth, personalWidth * 1.7).vertices
            me.vertices = betterVertices
            me.collisionFilter.mask = cat.player | cat.map | cat.body | cat.mob | cat.bullet
            me.g = simulation.g
            me.leaveBody = me.isDropPowerUp = false
            me.do = function() {
                this.gravity()
                // apply shock damage when touching the map, if it's fast
                if (this.speed > 5) {
                    const collision = Matter.Query.collides(this, map)
                    if (collision.length > 0) {
                        // on collision reduce health
                        this.health = this.health - this.speed / 250
                        // die when it's too low, doesn't register for some reason
                    }
                }
                // becomes more radioactive as it gets damaged!
                this.fill = `rgb(${232 * this.health}, 191, 40)`
            }

            me.onDeath = function() {
                const END = Math.floor(input.down ? 10 : 7)
                const totalBullets = 10
                const angleStep = (input.down ? 0.4 : 1.3) / totalBullets
                let dir = m.angle - (angleStep * totalBullets) / 2
                for (let i = 0; i < totalBullets; i++) {
                    //5 -> 7
                    dir += angleStep
                    const me = bullet.length
                    bullet[me] = Bodies.rectangle(
                        this.position.x + 50 * Math.cos(this.angle),
                        this.position.y + 50 * Math.sin(this.angle),
                        17,
                        4,
                        b.fireAttributes(dir)
                    )
                    const end = END + Math.random() * 4
                    bullet[me].endCycle = 2 * end + simulation.cycle
                    const speed = (25 * end) / END
                    const dirOff = dir + (Math.random() - 0.5) * 3
                    Matter.Body.setVelocity(bullet[me], {
                        x: speed * Math.cos(dirOff),
                        y: speed * Math.sin(dirOff)
                    })
                    bullet[me].onEnd = function() {
                        b.explosion(
                            this.position,
                            150 + (Math.random() - 0.5) * 40
                        ) //makes bullet do explosive damage at end
                    }
                    bullet[me].beforeDmg = function() {
                        this.endCycle = 0 //bullet ends cycle after hitting a mob and triggers explosion
                    }
                    bullet[me].do = function() {}
                    Composite.add(engine.world, bullet[me]) //add bullet to world
                }
                // barrels drop a ton of ammo and some heals, scales up with difficulty because I have mercy
                const amount = ~~(5 * Math.random() * simulation.difficulty / 10)
                for (let i = 0; i < amount; i++) {
                    powerUps.spawn(this.position.x, this.position.y, 'ammo', true)
                    if (Math.random() > 0.7) {
                        powerUps.spawn(this.position.x, this.position.y, 'heal', true)
                    }
                }
            }
            Matter.Body.rotate(me, Math.random() * Math.PI)
            Matter.Body.setVelocity(me, dirVector)
        }

        // creates a platform with shadow
        const platformShadow = (x, y, width, height, shadowList) => {
            // faster than making manual shadows... Why not just calculate them semi-realsitically?
            // the shadows are calculated on the object creation, so if you add map blocks it won't update.
            // shadowList is an array of shadows that'll be rendered. When the platform shadow is ready,
            // it is added to the list.
            // some helper functions first
            const perpCollision = point => {
                // takes a point, and finds a collision with the map downwards
                // the end of the ray, 3000 units down
                const lowerPoint = Vector.add(point, { x: 0, y: 3000 })
                // the destination point. If a collision was not found, then it defaults to some
                // arbiterary point 3000 units down.
                let dest = lowerPoint
                for (const mapBody of map) {
                    const check = simulation.checkLineIntersection(point, lowerPoint, mapBody.vertices[0], mapBody.vertices[1])
                    // a collision was found
                    if (check.onLine1 && check.onLine2) {
                        dest = { x: check.x, y: check.y }
                        break
                    }
                }
                return dest
            }
            const boundsToRectangle = (firstBound, secondBound) => {
                // takes two bounds and returns an (x, y, width, height) rectangle. The first one
                // must be the top left, and the second one must be the bottom right
                // sub to find the width and height
                const width = Math.abs(firstBound.x - secondBound.x)
                const height = Math.abs(firstBound.y - secondBound.y)
                // compile to an object
                return { x: firstBound.x, y: firstBound.y, width, height }
            }
            // create the actual platform
            spawn.mapRect(x, y, width, height)
            const me = map[map.length - 1]
            // the bottom vertices are the third and fourth ones
            const first = me.vertices[3]
            const second = me.vertices[2]
            // cast shadows to find the last shadow location.
            // iterate over all map objects, and check for collisions between a perpendicular ray
            // cast from the vertex down to the map object's top panel
            // const firstDown = perpCollision(first) // not needed in a rectangle settings
            const secondDown = perpCollision(second)
            // possible TODO: make it multirect for efficiency
            // create a single rectangle and return
            shadowList.push(boundsToRectangle(first, secondDown))
        }

        // cages with mobs, One of them holds the boss pre mutation
        const cage = (x, y, maxChainLength, drawList, mobType = null, isTheBoss = false) => {
            // the drawList is an array that the drawing function is added to
            // if the cage containing the boss it has a 50% chance to just not spawn. Spices things a bit
            if (!isTheBoss && Math.random() > 0.5) {
                return
            }
            if (!mobType) {
                // if mob type is null, then it picks a random mob
                mobType = spawn.fullPickList[~~(Math.random() * spawn.fullPickList.length)]
            }
            // create the chain length, must take into account the radius of the mob.
            // therefore, it'll create a pseudo mob of that type, take it radius and instantly kill it
            const chainLength = maxChainLength / 5 + maxChainLength * Math.random()

            // spawn and insantly kill a mob of the same type to get the radius.
            // this is used to prevent spawning the mob too short, it's a horrible
            // solution but it works
            spawn[mobType](0, 0)
            mob[mob.length - 1].leaveBody = mob[mob.length - 1].isDropPowerUp = false
            const radius = mob[mob.length - 1].radius
            mob[mob.length - 1].alive = false
            // spawn the mob. Disable shields first
            spawn.allowShields = false
            spawn[mobType](x, y + chainLength + radius * 2)
            const trappedMob = mob[mob.length - 1]
            // destroy its mind so it won't attack
            trappedMob.do = () => {}
            // spawn the cage
            mobs.spawn(x, y + chainLength + radius * 2, 4, trappedMob.radius + 50, 'rgba(150, 255, 150, 0.3)')
            const cage = mob[mob.length - 1]
            cage.g = simulation.g
            cage.do = function() {
                this.gravity()
            }
            // label it
            cage.label = 'Cage'
            // a special orb when hit
            let damageTick = 0
            cage.onDamage = (dmg) => {
                // add some damage ticks, if the trapped mob is still alive.
                // activating the boss by this method is almost impossible, since you need 10x damage
                if (trappedMob.alive) damageTick += ~~(isTheBoss ? 5 * dmg : 50 * dmg)
            }
            // collision filter
            trappedMob.collisionFilter.mask = cage.collisionFilter.mask = cat.player | cat.map | cat.bullet
            // constrain together
            spawn.constrain2AdjacentMobs(2, 0.05, false)
            // move them to be together
            trappedMob.position = Vector.clone(cage.position) // make sure you clone... Otherwise........
            // invincibility, make homing bullets not hit these, remove health bar
            trappedMob.health = cage.health = Infinity
            trappedMob.isBadTarget = cage.isBadTarget = true
            trappedMob.showHealthBar = cage.showHealthBar = false
            trappedMob.leaveBody = trappedMob.isDropPowerUp = cage.leaveBody = trappedMob.isDropPowerUp = false
            // cross all edges of the cage with the rope, and see where it collides. Attach the rope there
            const verts = cage.vertices
            // the crossing location, doesn't stay null
            let cross = null
            for (let i = 0; i < verts.length; i++) {
                // iterate over all vertices to form lines
                const v1 = verts[i]
                const v2 = verts[(i + 1) % verts.length]
                const result = simulation.checkLineIntersection(cage.position, { x, y }, v1, v2)
                if (result.onLine1 && result.onLine2) {
                    // both lines cross!
                    cross = result
                    break
                }
            }

            if (!cross) {
                // for some odd reason, sometimes it never finds a collision. I have no idea why
                // just default to the center then
                console.error("Couldn't find a cross... Origin: ", { x, y }, " center: ", cage.position, ' vertices: ', cage.vertices)
                cross = cage.position
            }
            // create the rope
            const rope = Constraint.create({
                pointA: {
                    x,
                    y
                },
                // offset the point be in the attachment point
                pointB: Vector.sub(cross, cage.position),
                bodyB: cage,
                // the longer the rope, the looser it is
                stiffness: Math.max(0.0005 - chainLength / 10000000, 0.00000001),
                length: chainLength
            })
            Matter.Composite.add(engine.world, rope)
            // create and return a function for drawing the rope
            const draw = () => {
                // draw a little recantagle at the base
                ctx.fillStyle = color.map
                ctx.fillRect(x - 20, y - 5, 40, 25)
                // if the cage was destroyed... Do nothing beyond
                if (!cage.alive) {
                    return
                }
                // draw the rope
                ctx.beginPath()
                ctx.moveTo(x, y)
                // line to the crossing point
                // ctx.lineTo(cons[i].bodyB.position.x, cons[i].bodyB.position.y);
                ctx.lineTo(cage.position.x + rope.pointB.x, cage.position.y + rope.pointB.y);
                ctx.lineWidth = 7
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.stroke()
                // now draw a mystic hit orb if touched
                if (damageTick) damageTick-- // reduce the ticks
                ctx.beginPath()
                ctx.arc(cage.position.x, cage.position.y, cage.radius + 30, 0, Math.PI * 2)
                ctx.lineWidth = 10
                ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(1, damageTick / 2000)})`
                ctx.strokeStyle = `rgba(255, 100, 0, ${Math.min(1, damageTick / 1000)})`
                ctx.setLineDash([125 * Math.random(), 125 * Math.random()])
                ctx.stroke()
                ctx.setLineDash([])
                ctx.fill()
                // if it's the boss, draw sucking arcs
                if (isTheBoss && bossInit) {
                    for (const entity of mob) {
                        // suck the health of all mobs
                        // I hate string manipulation in control flow but heh
                        if (entity.alive) {
                            ctx.beginPath()
                            ctx.moveTo(entity.position.x, entity.position.y)
                            ctx.lineTo(trappedMob.position.x, trappedMob.position.y)
                            ctx.lineWidth = 10
                            ctx.strokeStyle = 'rgba(38, 0, 255, 0.67)'
                            ctx.stroke()
                            // damage the mob
                            entity.damage(1)
                            // damage itself bonus
                            cage.damage(1)
                        }
                    }
                    cage.damage(5)
                }

                // ok if it's too much, explode
                if (damageTick > 2000) {
                    b.explosion(cage.position, cage.radius * 10)
                    // die a silent death
                    trappedMob.alive = cage.alive = false
                    damageTick = 0
                    if (isTheBoss) {
                        // become the real boss
                        geneticBoss(trappedMob.position.x, trappedMob.position.y)
                    }
                }
            }
            // restore the shields
            spawn.allowShields = true
            // add the drawing function
            drawList.push(draw)
        }

        // platform shadows
        const shadows = []
        // cages
        const cages = []

        level.custom = () => {
            level.exit.drawAndCheck() //draws the exit
            level.enter.draw() //draws the entrance

            player.force.y -= player.mass * simulation.g * 0.25 //this gets rid of some gravity on player

            // if the cutscene is yet to end, continue polling
            if (!hasEnded) {
                hasEnded = cutscenePoll()
            }

            for (const drip of drips) drip.draw()
            // throw some barrels after the boss spawns
            if (Math.random() > 0.999 && bossInit && !hasEnded) {
                const spawnLocs = [-1415, -30, 1345, 2815, 4285]
                // const randVec = Vector.mult({ x: Math.cos(randAngle), y: Math.sin(randAngle) }, Math.random() * 15)
                barrelMob(spawnLocs[~~(spawnLocs.length * Math.random())], -4200, { x: 0, y: 0 })
            }

            // platform shadow
            ctx.beginPath()
            for (const shadow of shadows) {
                ctx.rect(shadow.x, shadow.y, shadow.width, shadow.height)
            }
            ctx.fillStyle = 'rgba(0,10,30,0.1)'
            ctx.fill()

            // player pressed lever
            if (toggle.isOn && !bossInit) {
                bossInit = true
            }
            // draw the cage
        } //for dynamic stuff that updates while playing that is one Z layer below the player

        level.customTopLayer = () => {
            boost1.query()
            boost2.query()
            boost3.query()
            boost4.query()
            toggle.query()

            // shadow holes
            ctx.fillStyle = 'rgba(68, 68, 68,0.95)'
            ctx.fillRect(-1450 - 10, -4350, 150 + 20, 1250)
            ctx.fillRect(-50 - 10, -4350, 150 + 20, 1250)
            ctx.fillRect(1325 - 10, -4350, 150 + 20, 1250)
            ctx.fillRect(2800 - 10, -4350, 150 + 20, 1250)
            ctx.fillRect(4275 - 10, -4350, 150 + 20, 1250)

            for (const drawCage of cages) {
                drawCage()
            }
        } //for dynamic stuff that updates while playing that is one Z layer above the player

        const anotherBoss = (x, y) => {
            if (tech.isDuplicateBoss && Math.random() < tech.duplicationChance()) {
                tech.isScaleMobsWithDuplication = true
                spawn.historyBoss(x, y)
                tech.isScaleMobsWithDuplication = false
            } else if (tech.isResearchBoss) {
                if (powerUps.research.count > 3) {
                    powerUps.research.changeRerolls(-4)
                    simulation.makeTextLog(
                        `<span class='color-var'>m</span>.<span class='color-r'>research</span> <span class='color-symbol'>-=</span> 4<br>${powerUps.research.count}`
                    )
                } else {
                    tech.addJunkTechToPool(0.49)
                }
                spawn.historyBoss(x, y)
            }
        }

        //GENETICBOSS
        function drawEnergyBar(mob) {
            if (mob.seePlayer.recall && mob.energy > 0) {
                const h = mob.radius * 0.3
                const w = mob.radius * 2
                const x = mob.position.x - w / 2
                const y = mob.position.y - w * 0.9
                ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
                ctx.fillRect(x, y, w, h)
                ctx.fillStyle = '#0cf'
                ctx.fillRect(x, y, w * mob.energy, h)
            }
        }

        function generateGenome() {
            // creates a random genome and returns it
            const genome = {
                density: Math.random() * 0.001,
                size: 15 + Math.random() * 15,
                speed: Math.random() * 0.1,
                // color and vertex properties are "trash" genes as they don't really contribute to the orb
                color: [Math.random() * 255, Math.random() * 255, Math.random() * 255, 50 + Math.random() * 205],
                vertexCount: Math.floor(Math.random() * 5) + 3,
                // TODO fix possible concaving
                vertexOffset: null // placeholder
            }
            // initialized here as it depends on vertexCount. I could use `new function()` but nah.
            genome.vertexOffset = Array(genome.vertexCount)
                .fill()
                .map(() => ({ x: Math.random() - 0.5, y: Math.random() - 0.5 }))
            return genome
        }

        function mutateGenome(genome) {
            // takes an existing genome and applies tiny changes
            const randomInRange = (min, max) => Math.random() * (max - min) + min
            const tinyChange = x => randomInRange(-x, x)

            const vertexMutator = x => ({ x: x.x + tinyChange(0.5), y: x.y + tinyChange(0.5) })
            // mutates a genome and returns the mutated version.
            const newGenome = {
                density: genome.density + tinyChange(0.0005),
                size: genome.size + tinyChange(5),
                speed: genome.speed + tinyChange(0.05),
                color: genome.color.map(x => (x + tinyChange(10)) % 255), // wrap around
                vertexCount: Math.max(genome.vertexCount + Math.round(tinyChange(1)), 3),
                vertexOffset: genome.vertexOffset.map(vertexMutator)
            }
            if (genome.vertexOffset.length < newGenome.vertexCount) {
                const vo = newGenome.vertexOffset
                vo.push(vertexMutator(vo[~~(vo.length * Math.random())]))
            } else if (genome.vertexOffset.length > newGenome.vertexCount) {
                newGenome.vertexOffset.pop()
            }

            return newGenome
        }

        function calculateGenomeCost(genome) {
            // calculates the cost of a genome and returns it. The cost is used to
            // determine how "costly" the genome is to make, and after the orb's life ends it
            // is used together with the orb success score to determine the fittest orb.
            const score = (1 / (genome.density * genome.size * genome.speed)) * 0.000001
            return score
        }
        // distance functions
        const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
        const dist = (a, b) => Math.sqrt(dist2(a, b))

        // ** MAP SPECIFIC MOBS **
        function energyTransferBall(origin, target, boss, charge) {
            // transports energy to the boss
            // when the boss is hit by it, how much of the energy stored the boss actually recives
            const ENERGY_TRANSFER_RATE = 80 /*%*/
            // add 1 to the active ball list
            boss.activeBalls++
            const color = `rgba(${150 + 105 * charge}, 81, 50, 0.6)`
            mobs.spawn(origin.x, origin.y, 12, 20 + 20 * charge, color)
            const me = mob[mob.length - 1]
            me.end = function() {
                simulation.drawList.push({
                    // some nice graphics
                    x: this.position.x,
                    y: this.position.y,
                    radius: this.radius,
                    color: '#f3571d',
                    time: ~~(Math.random() * 20 + 10)
                })
                // on death spawn and explode a bomb
                if (Math.random() > 0.95) {
                    spawn.bomb(this.position.x, this.position.y, this.radius, this.vertices.length)
                    mob[mob.length - 1].death()
                }
                // remove 1 from the active ball list
                boss.activeBalls--
                this.death()
            }
            me.collisionFilter.mask = cat.player | cat.map
            // me.onHit = this.end
            me.life = 0
            me.isDropPowerUp = false
            me.leaveBody = false
            me.do = function() {
                // die on collision with the map
                if (Matter.Query.collides(this, map).length > 0) {
                    this.end()
                }
                // die if too much time passes. Stronger bullets explode earlier
                if (++this.life > 200 - charge * 100) {
                    this.end()
                }
                // if the orb collides with the boss, die but give energy to the boss
                if (Matter.Query.collides(this, [boss]).length > 0) {
                    boss.energy = Math.min(charge * (ENERGY_TRANSFER_RATE / 100) + boss.energy, 1)
                    // also make the boss fire once regardless of energy
                    boss.spawnOrbs()
                    this.end()
                }
                const movement = Vector.normalise(Vector.sub(target, origin))
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x + movement.x,
                    y: this.velocity.y + movement.y
                })
                // nice graphics
                simulation.drawList.push({
                    x: this.position.x,
                    y: this.position.y,
                    radius: this.radius,
                    color: '#e81e1e',
                    time: 3
                })
                simulation.drawList.push({
                    x: this.position.x,
                    y: this.position.y,
                    radius: this.radius,
                    color: '#e87f1e',
                    time: 6
                })
                simulation.drawList.push({
                    x: this.position.x,
                    y: this.position.y,
                    radius: this.radius,
                    color: '#e8e41e',
                    time: 9
                })
            }
            me.onDamage = me.end
        }

        function energyBeacon(x, y, parentBoss) {
            // an unmoving beacon that charges the genetic boss with energy either stolen
            // from the player or generated. That energy is used to create stronger mobs.
            mobs.spawn(x, y, 3, 50, '') // default color, changed an instant later
            const me = mob[mob.length - 1]
            me.laserRange = 500
            me.leaveBody = false
            me.isDropPowerUp = false
            // custom variables
            // max energy is 1
            me.energy = 0
            me.seed = simulation.cycle // seed to make sure this mob is unique render wise
            me.chargeTicks = 0 // used to time charging the boss
            me.bossPos = null // the position that the mob remembers when charging
            me.density = me.density * 2
            Matter.Body.setDensity(me, 0.0022 * 3 + 0.0002 * Math.sqrt(simulation.difficulty)) //extra dense
            me.do = function() {
                // if the boss is dead, die
                if (!parentBoss.alive) {
                    this.death()
                }
                // slowly rotate
                Matter.Body.setAngularVelocity(this, 0.01)
                this.fill = `rgba(${this.energy * 255}, 29, 136, 0.80)`
                this.seePlayerCheck()
                // steal energy from player
                // this.harmZone() // regular harmZone
                // custom effects on top of that
                if (this.distanceToPlayer() < this.laserRange) {
                    if (m.immuneCycle < m.cycle) {
                        // suck extra energy from the player if it's in range
                        if (m.energy > 0.1 && this.energy < 1 - 0.012) {
                            m.energy -= 0.012
                            this.energy += 0.012
                        }
                        // special "sucking" graphics
                        ctx.beginPath()
                        ctx.moveTo(this.position.x, this.position.y)
                        ctx.lineTo(m.pos.x, m.pos.y)
                        ctx.lineWidth = 3 + Math.abs(Math.sin((simulation.cycle + this.seed) / 100)) * 2
                        ctx.strokeStyle = `rgb(${(
							Math.abs(Math.sin((simulation.cycle + this.seed + 100) / 100)) * 255
						).toFixed(3)}, 204, 255)`
                        ctx.setLineDash([125 * Math.random(), 125 * Math.random()])
                        ctx.stroke()
                        ctx.setLineDash([])
                    }
                }
                // if the mob's energy is at least 50% full, try to send that energy to the boss.
                // don't send that energy yet if more than 5 other transfer balls are active
                if (this.energy > 0.5 && parentBoss.energy < 1 && parentBoss.activeBalls <= 5 && this.chargeTicks === 0) {
                    const seesBoss = Matter.Query.ray(map, this.position, parentBoss.position).length === 0
                    if (seesBoss) {
                        this.chargeTicks = 100
                        this.bossPos = Vector.clone(parentBoss.position)
                    }
                }
                if (this.chargeTicks > 0) {
                    if (--this.chargeTicks === 0) {
                        // spawn the orb
                        const location = Vector.add(
                            Vector.mult(Vector.normalise(Vector.sub(this.bossPos, this.position)), this.radius * 3),
                            this.position
                        )
                        energyTransferBall(location, this.bossPos, parentBoss, this.energy)
                        this.energy = 0
                    }
                    // create a beam and aim it at the bossPos
                    ctx.beginPath()
                    ctx.moveTo(this.position.x, this.position.y)
                    ctx.lineTo(this.bossPos.x, this.bossPos.y)
                    ctx.lineWidth = 10 + Math.abs(Math.sin((simulation.cycle + this.seed) / 100)) * 5
                    ctx.strokeStyle = `rgb(${(
						Math.abs(Math.sin((simulation.cycle + this.seed + 100) / 100)) * 255
					).toFixed(3)}, 204, 255)`
                    ctx.setLineDash([125 * Math.random(), 125 * Math.random()])
                    ctx.stroke()
                    ctx.setLineDash([])
                }
                // generate (0.15 * difficulty / 4)% energy per tick
                if (this.energy < 1) this.energy += 0.0015 * (simulation.difficulty / 4)
                // draw energy bar
                drawEnergyBar(this)
            }
            me.onDeath = function() {
                // remove itself from the list
                const beacons = parentBoss.energyBeacons
                beacons.splice(beacons.indexOf(this), 1)
                // explode with the strength of its energy!
                this.alive = false // to prevent retriggering infinitly
                b.explosion(this.position, this.energy * this.radius * 15)
                // when it dies, it reduces some of the boss' energy
                parentBoss.energy -= 0.025
                // and stuns it
                mobs.statusStun(parentBoss, 70 + ~~(100 / simulation.difficulty))
            }
        }

        function geneticSeeker(x, y, genome, parentBoss) {
            // special bullets that get score based on their performance.
            mobs.spawn(x, y, genome.vertexCount, genome.size, '#' + genome.color.map(it => (~~it).toString(16)).join(''))
            const me = mob[mob.length - 1]
            // apply genome
            Matter.Body.setDensity(me, genome.density)
            me.accelMag = genome.speed
            // apply vertex offset
            for (let i = 0; i < me.vertices.length; i++) {
                const vertex = me.vertices[i]
                const offset = genome.vertexOffset[i]
                if (!offset) console.log(genome, me)
                vertex.x += offset.x
                vertex.y += offset.y
            }

            me.stroke = 'transparent'
            Matter.Body.setDensity(me, 0.00001) //normal is 0.001
            // increased if the orb done things that are deemed successful
            me.score = 30
            me.timeLeft = 9001 / 9
            me.accelMag = 0.00017 * simulation.accelScale //* (0.8 + 0.4 * Math.random())
            me.frictionAir = 0.01
            me.restitution = 0.5
            me.leaveBody = false
            me.isDropPowerUp = false
            me.isBadTarget = true
            me.isMobBullet = true
            me.showHealthBar = false
            me.collisionFilter.category = cat.mobBullet
            me.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet
            me.do = function() {
                this.alwaysSeePlayer()
                this.attraction()
                this.timeLimit()

                if (Matter.Query.collides(this, map).length > 0) {
                    // colliding with the map gives a score reduction, 0.5 per tick
                    this.score -= 0.5
                }
                // default score is slowly reduced every tick to give mobs that reached the player faster a benefit
                this.score -= 0.05
                if (this.score < 0) {
                    this.alive = false // no point continuing if this orb is that bad! Silent death
                }
                // give a bonus if some projectile is nearby or the mouse position is close (like laser pointing)
                // if a mob survives this for long, then it gets a score benefit.
                const bulletCloseToOrb = bullet.some(it => dist2(this.position, it.position) < 10000 /* 100 ^ 2 */ )
                // player shoots and aims close
                const mouseCloseToOrb = dist2(this.position, simulation.mouseInGame) < 10000 && input.fire
                if (bulletCloseToOrb || mouseCloseToOrb) {
                    this.score += 1
                }
                // die if too far from the boss... It would be incredibly difficult to dodge otherwise
                if (dist2(this.position, parentBoss.position) > 2000 * 2000) {
                    this.alive = false
                }
                // DEBUG score printer
                // ctx.font = '48px sans-serif'
                // ctx.fillStyle = 'rgba(252, 0, 143, 1)'
                // ctx.fillText(~~this.score, this.position.x - this.radius, this.position.y - this.radius)
            }
            me.onHit = function() {
                // hitting the player gives a 50 points score bonus
                this.score += 50
                this.score += this.mass * 2 // bigger mass = bigger damage, add that too
                // a marker for later
                this.hitPlayer = true
                this.explode(this.mass)
            }
            me.onDeath = function() {
                if (!this.hitPlayer) {
                    // if it didn't hit the player, give it a score based on its distance
                    this.score += 10000 / this.distanceToPlayer()
                }
                // 3% chance to drop ammo
                if (Math.random() > 0.97) {
                    powerUps.spawn(this.position.x, this.position.y, 'ammo', true)
                }
                parentBoss.deadOrbs.push({ genome: genome, score: this.score })
            }
        }

        function geneticBoss(x, y, radius = 130, spawnBossPowerUp = true) {
            // a modified orb shooting boss that evolves its orbs.
            // the way this boss works is different from the regular orb shooting boss,
            // because the orbs have evolving properties via a "machine learning" scoring algorithm.
            const MAX_BEACONS = Math.round(3 + Math.random() * simulation.difficulty / 3)
            mobs.spawn(x, y, 8, radius, 'rgb(83, 32, 58)')
            let me = mob[mob.length - 1]
            me.isBoss = true

            me.accelMag = 0.0001 * simulation.accelScale
            me.fireFreq = Math.floor((330 * simulation.CDScale) / simulation.difficulty)
            me.frictionStatic = 0
            me.friction = 0
            me.frictionAir = 0.02
            me.memory = (420 / 69) * 42 // 🧌
            me.repulsionRange = 1000000
            me.energyBeacons = []
            me.activeBalls = 0
            // starts by random, or by the stored genomes if they exist
            const init = () => ({ genome: generateGenome(), score: 0 })
            me.fittestOrbs = (localStorage && localStorage.genome) ? JSON.parse(localStorage.genome) : [init(), init(), init()] // best genomes so far. Size of three
            // when an orb died it's moved here. When a new spawn cycle starts, their scores get calculated
            // and they get put in the fittest orbs array, if they are better than the old ones.
            me.deadOrbs = []
            me.energy = 1
            // this boss has no orbitals, because it's not meant to ever attack on its own
            me.damageReduction = 0.25 / (tech.isScaleMobsWithDuplication ? 1 + tech.duplicationChance() : 1)
            // has a shield and sustains that shield
            spawn.shield(me, x, y, Infinity)
            me.fireFreq = 30
            me.ionizeFreq = 20
            me.ionized = []
            me.laserRange = radius * 4

            Matter.Body.setDensity(me, 0.0022 * 4 + 0.0002 * Math.sqrt(simulation.difficulty)) //extra dense //normal is 0.001 //makes effective life much larger
            me.onDeath = function() {
                if (spawnBossPowerUp) {
                    powerUps.spawnBossPowerUp(this.position.x, this.position.y)
                    const amount = ~~(5 * Math.random() * simulation.difficulty / 10) * 2
                    for (let i = 0; i < amount; i++) {
                        powerUps.spawn(this.position.x, this.position.y, 'ammo', true)
                        if (Math.random() > 0.7) {
                            powerUps.spawn(this.position.x, this.position.y, 'heal', true)
                        }
                    }
                }
                // keep the best genome and use it next fight...
                if (localStorage) {
                    localStorage.setItem("genome", JSON.stringify(this.fittestOrbs))
                }

                // stop spawning barrels
                bossInit = false
            }
            me.onDamage = function() {}
            me.spawnBeacon = function() {
                // the vertex to spawn the beacon from
                const vert = this.vertices[~~(Math.random() * this.vertices.length)]
                // the position should be a little to the side to prevent crashing into the boss
                // TODO check for collisions with the wall
                const spawnPos = Vector.add(vert, Vector.mult(Vector.normalise(Vector.sub(this.position, vert)), -60))
                // some velocity
                const velocity = Vector.mult(Vector.normalise(Vector.sub(this.position, vert)), -5)
                energyBeacon(spawnPos.x, spawnPos.y, this) // spawn the beacon, a bit ahead
                const beacon = mob[mob.length - 1]
                this.energyBeacons.push(beacon)
                Matter.Body.setVelocity(beacon, {
                    x: this.velocity.x + velocity.x,
                    y: this.velocity.y + velocity.y
                })
            }
            me.spawnOrbs = function() {
                Matter.Body.setAngularVelocity(this, 0.11)
                // sort the vertices by the distance to the player
                const sorted = [...this.vertices].sort(dist2)
                // spawn the bullets based on how close they are to the player.
                // the way it works is it picks the fittest three orbs and clones them.
                // but start by taking old mobs and checking if they are better than the new ones
                let next
                while ((next = this.deadOrbs.pop())) {
                    // material costs are calculated as a contra to the score
                    const cost = calculateGenomeCost(next.genome) * 500 // normalize via multiplication
                    const totalScore = next.score - cost
                    // try to insert itself into the best orbs, if it can
                    for (let i = 0; i < this.fittestOrbs.length; i++) {
                        const fitEntry = this.fittestOrbs[i]
                        if (fitEntry.score < totalScore) {
                            this.fittestOrbs[i] = next
                            break
                        }
                    }
                }
                // finally sort them using their score
                this.fittestOrbs.sort((a, b) => a.score - b.score)
                // only take the genome, the score doesn't matter here
                const bestOrbs = this.fittestOrbs.map(it => it.genome)
                for (let vertex of sorted) {
                    // pick a random fit orb and try to spawn it. If the cost is too high, it'll attempt
                    // to generate a new random orb instead. If that orb is too expensive too, just ignore this vertex.
                    // the evolution part comes here, as the genome is mutated first.
                    let randGenome = mutateGenome(bestOrbs[~~(Math.random() * bestOrbs.length)])
                    const cost = calculateGenomeCost(randGenome) * 2
                    if (this.energy - cost < 0) {
                        // okay this orb is too expensive for the boss to spawn,
                        // make a new orb from scratch
                        randGenome = generateGenome()
                        const secondCost = calculateGenomeCost(randGenome)
                        if (this.energy - secondCost < 0) {
                            // that was too expensive too, heh
                            continue
                        }
                    } else {
                        // alright the boss can afford that
                        this.energy -= Math.abs(cost) // TODO: Fix this, why the heck can it even be negative??
                    }

                    geneticSeeker(vertex.x, vertex.y, randGenome, this)
                    // give the bullet a rotational velocity as if they were attached to a vertex
                    const velocity = Vector.mult(
                        Vector.perp(Vector.normalise(Vector.sub(this.position, vertex))),
                        -10
                    )
                    Matter.Body.setVelocity(mob[mob.length - 1], {
                        x: this.velocity.x + velocity.x,
                        y: this.velocity.y + velocity.y
                    })
                }
            }
            me.do = function() {
                this.seePlayerCheck()
                this.checkStatus()
                this.attraction()
                this.repulsion()
                // draw laser arcs if it sees the player
                this.harmZone()
                // 
                const regularChance = Math.random() > 0.99
                const biggerChance = Math.random() > 0.95 && this.energy > 0.25
                // start by making sure there is always at least one beacon
                if (this.energyBeacons.length === 0) {
                    this.spawnBeacon()
                }
                // then, spawn some energy beacons if there are less than the maximum.
                // small chance if there's no energy, bigger chance if there is at least 10% (which is drained)
                if ((this.energyBeacons.length < MAX_BEACONS && biggerChance) || regularChance) {
                    if (biggerChance) {
                        // if the spawn was a selection of bigger chance, reduce 10% energy
                        this.energy -= 0.10
                    }
                    this.spawnBeacon()
                }
                // then, spawn genetic seekers
                if (this.seePlayer.recall && !(simulation.cycle % this.fireFreq)) {
                    // fire a bullet from each vertex if there's enough energy
                    if (this.energy > 0.15) {
                        this.spawnOrbs()
                    }
                }

                if (this.energy > 1) {
                    // clean excess energy
                    this.energy -= 0.003
                } else {
                    // or slowly generate energy
                    this.energy += 0.001
                }
                // the boss will ionize every bullet in its radius, but that will cause its energy to deplete
                if (!(simulation.cycle % this.ionizeFreq)) {
                    for (let i = 0; i < bullet.length; i++) {
                        const it = bullet[i]
                        // if it's not a bot and it's close
                        if (!it.botType && dist(this.position, it.position) < this.laserRange) {
                            // add it to the ionized list
                            this.ionized.push({ target: it, ticks: 0 })
                        }
                    }
                }

                for (let i = 0; i < this.ionized.length; i++) {
                    const entry = this.ionized[i]

                    // skip if there's not enough energy
                    if (this.energy <= 0) break

                    // terminate if it's no longer in the radius
                    if (dist(this.position, entry.target.position) > this.laserRange) {
                        this.ionized.splice(i, 1)
                        continue
                    }
                    // terminate after some ticks
                    if (++entry.ticks === 10) {
                        entry.target.endCycle = 0
                        // draw nice popping graphics
                        simulation.drawList.push({
                            x: entry.target.position.x,
                            y: entry.target.position.y,
                            radius: 5,
                            color: '#f24',
                            time: ~~(Math.random() * 20 + 10)
                        })
                        // and remove
                        this.ionized.splice(i, 1)
                        continue
                    }
                    // draw line
                    ctx.beginPath()
                    ctx.moveTo(this.position.x, this.position.y)
                    ctx.lineTo(entry.target.position.x, entry.target.position.y)
                    ctx.lineWidth = 7
                    ctx.strokeStyle = `rgb(${60 - entry.ticks * 2}, 50, 50)`
                    ctx.stroke()
                    // reduce energy, as it's hard to ionize
                    this.energy -= entry.target.mass / 25
                }

                // if it has energy, shield itself and drain energy
                if (!this.isShielded && this.energy > 0.5) {
                    spawn.shield(this, this.position.x, this.position.y, Infinity)
                    this.energy -= 0.25
                }
                drawEnergyBar(this)
                // change fill color
                this.fill = `rgb(${((Math.sin(simulation.cycle / 100) + 1) / 2) * 100}, 32, 58)`
            }
            // start by spawning several beacons to gain initial energy
            const amount = Math.ceil(2 + Math.random() * simulation.difficulty / 5)
            for (let i = 0; i < amount; i++)
                me.spawnBeacon()
        }

        // LEVEL SETUP
        spawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20) //don't change this

        level.exit.x = 5700 //you exit at x
        level.exit.y = -130 //you exit at y
        spawn.mapRect(5800, -110, -100, 10)

        level.defaultZoom = 2000 //how far out you want the image to be zoomed at (lower = zoom in, higher = zoom out)
        simulation.zoomTransition(level.defaultZoom) //makes the level transition to have the zoom at the start of a level
        document.body.style.backgroundColor = 'hsl(138, 3%, 74%)' //sets background color

        //LEVEL STRUCTURE
        spawn.mapRect(-3100, -100, 9200, 100)
        spawn.mapRect(-3100, -600, 100, 500)
        spawn.mapRect(-3100, -600, 1100, 100)
        spawn.mapRect(-2100, -3100, 100, 2700)
        spawn.mapRect(4800, -3100, 100, 2600)
        spawn.mapRect(4800, -600, 1300, 100)
        spawn.mapRect(6000, -600, 100, 600)

        spawn.mapRect(400, -200, 2000, 100)
        spawn.mapRect(600, -300, 1600, 100)
        spawn.mapRect(800, -400, 1200, 100)
        spawn.mapRect(1000, -500, 800, 100)
        spawn.mapRect(1200, -600, 400, 100)
        // roof
        spawn.mapRect(-2100, -4350, 650, 1250)
        spawn.mapRect(-1300, -4350, 1250, 1250)
        spawn.mapRect(100, -4350, 1225, 1250)
        spawn.mapRect(1475, -4350, 1325, 1250)
        spawn.mapRect(2950, -4350, 1325, 1250)
        spawn.mapRect(4425, -4350, 475, 1250)

        // arc
        // spawn.mapVertex(1400, -892, '700, -800, 700, -900, 1000, -1000, 1800, -1000, 2100, -900, 2100, -800')


        //PLATFORMS
        platformShadow(-1200, -500, 300, 100, shadows)
        platformShadow(-400, -700, 300, 100, shadows)
        platformShadow(400, -900, 300, 100, shadows)
        platformShadow(-2000, -800, 300, 100, shadows)
        platformShadow(-1000, -1000, 300, 100, shadows)
        platformShadow(-400, -1300, 300, 100, shadows)
        platformShadow(-1600, -1300, 300, 100, shadows)
        platformShadow(-1300, -1600, 300, 100, shadows)
        platformShadow(-2000, -1700, 300, 100, shadows)
        platformShadow(-700, -1800, 300, 100, shadows)
        platformShadow(-1500, -2100, 300, 100, shadows)
        platformShadow(-600, -2200, 300, 100, shadows)
        platformShadow(-2000, -2500, 300, 100, shadows)
        platformShadow(-1100, -2400, 300, 100, shadows)
        platformShadow(-500, -2700, 300, 100, shadows)
        platformShadow(100, -2400, 300, 100, shadows)
        platformShadow(700, -2700, 300, 100, shadows)

        platformShadow(3700, -500, 300, 100, shadows)
        platformShadow(2900, -700, 300, 100, shadows)
        platformShadow(2100, -900, 300, 100, shadows)
        platformShadow(4500, -800, 300, 100, shadows)
        platformShadow(3500, -1000, 300, 100, shadows)
        platformShadow(4100, -1300, 300, 100, shadows)
        platformShadow(2900, -1300, 300, 100, shadows)
        platformShadow(3800, -1600, 300, 100, shadows)
        platformShadow(4500, -1700, 300, 100, shadows)
        platformShadow(3200, -1800, 300, 100, shadows)
        platformShadow(4000, -2100, 300, 100, shadows)
        platformShadow(3100, -2200, 300, 100, shadows)
        platformShadow(4500, -2500, 300, 100, shadows)
        platformShadow(3600, -2400, 300, 100, shadows)
        platformShadow(3000, -2700, 300, 100, shadows)
        platformShadow(2400, -2400, 300, 100, shadows)
        platformShadow(1800, -2700, 300, 100, shadows)

        // cages
        cage(-1492, -1200, 100, cages)
        cage(-875, -2300, 300, cages)
        cage(-1600, -3100, 1000, cages)
        cage(225, -2300, 1000, cages)
        cage(-750, -3100, 700, cages)
        cage(-625, -1700, 1200, cages)
        cage(2200, -3100, 500, cages)
        cage(3275, -1700, 500, cages)
        cage(3650, -900, 300, cages)
        cage(2500, -2300, 300, cages)
        cage(3625, -2300, 300, cages)
        cage(3875, -1500, 300, cages)
        cage(4025, -3100, 300, cages)

        // boss cage
        platformShadow(1275, -2150, 250, 100, shadows)
        cage(1400, -2050, 500, cages, 'starter', true)
        map[map.length] = Bodies.trapezoid(1400, -2193, 250, 100, 0.5)

        //DEBRIS
        //idk just put the debris wherever you want
        spawn.debris(-550, -225, 100)
        spawn.debris(-1150, -1725, 75)
        spawn.debris(-275, -1400, 50)
        spawn.debris(2850, -2075, 150)
        spawn.debris(4250, -2250, 150)

        //BOSS
        // geneticBoss(1400, -3800)
        anotherBoss(0, 0) //will only spawn historyBoss if there is an additional boss

        //POWERUPS

    },

    // ********************************************************************************************************
    // ********************************************************************************************************
    // ***************************************** training levels **********************************************
    // ********************************************************************************************************
    // ********************************************************************************************************
    walk() { //learn to walk
        m.addHealth(Infinity)
        document.getElementById("health").style.display = "none" //hide your health bar
        document.getElementById("health-bg").style.display = "none"

        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        simulation.lastLogTime = 0; //clear previous messages
        let instruction = 0
        level.trainingText(`move <strong>↔</strong> with <strong class="key-input-train">${input.key.left.replace('Key', '').replace('Digit', '')}</strong> and <strong class="key-input-train">${input.key.right.replace('Key', '').replace('Digit', '')}</strong>`)

        level.custom = () => {
            if (instruction === 0 && input.right) {
                instruction++
                level.trainingText(`<s>move <strong>↔</strong> with <strong class="key-input-train">${input.key.left.replace('Key', '').replace('Digit', '')}</strong> and <strong class="key-input-train">${input.key.right.replace('Key', '').replace('Digit', '')}</strong></s>
                <br>exit through the blue door`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };
        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 0, 3500, 1800); //floor
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof
        spawn.mapRect(700, -8, 50, 25);
        spawn.mapRect(725, -16, 75, 25);
        spawn.mapRect(1375, -16, 50, 50);
        spawn.mapRect(1400, -8, 50, 25);
        spawn.mapRect(750, -24, 650, 100);
        spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
    crouch() { //learn to crouch
        if (localSettings.isTrainingNotAttempted) { //after making it to the second training level 
            localSettings.isTrainingNotAttempted = false // this makes the training button less obvious at the start screen
            if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        }

        m.addHealth(Infinity)
        level.setPosToSpawn(75, -100); //normal spawn
        spawn.mapRect(25, -60, 100, 20); //small platform for player
        spawn.mapRect(0, -50, 150, 25); //stairs
        spawn.mapRect(-25, -40, 200, 25);
        spawn.mapRect(-50, -30, 250, 25);
        spawn.mapRect(-75, -20, 300, 25);
        spawn.mapRect(-100, -10, 350, 25);
        spawn.mapRect(-150, -50, 175, 75);

        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        let instruction = 0
        level.trainingText(`press <strong class="key-input-train">${input.key.down.replace('Key', '').replace('Digit', '')}</strong> to crouch`)
        level.custom = () => {
            if (instruction === 0 && input.down) {
                instruction++
                level.trainingText(`<s>press <strong class="key-input-train">${input.key.down.replace('Key', '').replace('Digit', '')}</strong> to crouch</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1625, -350, 375, 350)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1625, -350, 375, 350)
            //dark
            ctx.fillStyle = "rgba(0,0,0,0.2)"
            ctx.fillRect(500, -100, 1125, 175);
        };

        // spawn.mapRect(1025, -675, 300, 623); //crouch wall
        // spawn.mapRect(625, -650, 1025, 550);
        spawn.mapRect(500, -650, 1125, 550);
        spawn.mapRect(-200, -650, 875, 300);

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof


        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        spawn.mapRect(1600, -1200, 500, 850); //exit roof
    },
    jump() { //learn to jump
        m.addHealth(Infinity)
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        let instruction = 0
        level.trainingText(`hold down <strong class="key-input-train">${input.key.up.replace('Key', '').replace('Digit', '')}</strong> longer to jump higher`)

        level.custom = () => {
            if (instruction === 0 && m.pos.x > 300) {
                instruction++
                level.trainingText(`<s>hold down <strong class="key-input-train">${input.key.up.replace('Key', '').replace('Digit', '')}</strong> longer to jump higher</s>`)
            }
            m.health = 1 //can't die
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //dark
            ctx.fillStyle = "rgba(0,0,0,0.2)"
            ctx.fillRect(1000, 0, 450, 1800)
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(275, -350, 200, 375);
        spawn.mapRect(-250, 0, 1250, 1800); //floor
        spawn.mapRect(1450, 0, 1075, 1800); //floor
        spawn.mapRect(-250, -2800, 1250, 2200); //roof
        spawn.mapRect(1450, -2800, 1075, 2200); //roof
        spawn.mapVertex(375, 0, "150 0  -150 0  -100 -50  100 -50"); //base

        spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall

        //roof steps
        spawn.mapRect(1000, -650, 25, 25);
        spawn.mapRect(1000, -675, 50, 25);
        spawn.mapRect(1000, -700, 75, 25);
        spawn.mapRect(1000, -725, 100, 25);
        spawn.mapRect(1425, -650, 25, 25);
        spawn.mapRect(1400, -675, 50, 25);
        spawn.mapRect(1375, -700, 75, 25);
        spawn.mapRect(1350, -725, 100, 25);
        spawn.mapRect(1325, -750, 150, 25);
        spawn.mapRect(1300, -775, 150, 25);
        spawn.mapRect(1000, -750, 125, 25);
        spawn.mapRect(1275, -2800, 200, 2025);
        spawn.mapRect(975, -2800, 200, 2025);
        spawn.mapRect(1000, -775, 150, 25);
    },
    hold() { //put block on button to open door
        m.addHealth(Infinity)
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        spawn.bodyRect(1025, -75, 50, 50); //block to go on button
        const buttonDoor = level.button(500, 0)
        const door = level.door(1612.5, -175, 25, 190, 185, 3)

        let instruction = 0
        level.trainingText(`activate your <strong class='color-f'>field</strong> with <strong class="key-input-train">${input.key.field.replace('Key', '').replace('Digit', '')}</strong> or <strong>right mouse</strong>`)

        level.custom = () => {
            if (instruction === 0 && input.field) {
                instruction++
                level.trainingText(`<s>activate your <strong class='color-f'>field</strong> with <strong class="key-input-train">${input.key.field.replace('Key', '').replace('Digit', '')}</strong> or <strong>right mouse</strong></s><br>release your <strong class='color-f'>field</strong> on a <strong class='color-block'>block</strong> to pick it up`)
            } else if (instruction === 1 && m.isHolding) {
                instruction++
                level.trainingText(`<s>activate your <strong class='color-f'>field</strong> with <strong class="key-input-train">${input.key.field.replace('Key', '').replace('Digit', '')}</strong> or <strong>right mouse</strong><br>release your <strong class='color-f'>field</strong> on a <strong class='color-block'>block</strong> to pick it up</s><br>drop the <strong class='color-block'>block</strong> on the red button to open the door`)
            } else if (instruction === 2 && !buttonDoor.isUp && Vector.magnitudeSquared(Vector.sub(body[0].position, buttonDoor.min)) < 10000) {
                instruction++
                level.trainingText(`<s>activate your <strong class='color-f'>field</strong> with <strong class="key-input-train">${input.key.field.replace('Key', '').replace('Digit', '')}</strong> or <strong>right mouse</strong><br>release your <strong class='color-f'>field</strong> on a <strong class='color-block'>block</strong> to pick it up<br>drop the <strong class='color-block'>block</strong> on the red button to open the door</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            buttonDoor.query();
            buttonDoor.draw();
            if (buttonDoor.isUp) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
    throw () { //throw a block on button to open door
        m.addHealth(Infinity)
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        spawn.bodyRect(1025, -75, 50, 50); //block to go on button
        const buttonDoor = level.button(1635, -400)
        const door = level.door(1612.5, -175, 25, 190, 185, 3)

        // activate your <strong class='color-f'>field</strong> with <strong class="key-input-train">${input.key.field.replace('Key', '').replace('Digit', '')}</strong> or <strong>right mouse</strong>
        let instruction = 0
        level.trainingText(`pick up the <strong class='color-block'>block</strong> with your <strong class='color-f'>field</strong>`)

        level.custom = () => {
            if (instruction === 0 && m.isHolding) {
                instruction++
                level.trainingText(`<s>pick up the <strong class='color-block'>block</strong> with your <strong class='color-f'>field</strong></s>
                <br>hold your <strong class='color-f'>field</strong> down to charge up then release to throw a <strong class='color-block'>block</strong>`)
            } else if (instruction === 1 && m.throwCharge > 2) {
                instruction++
                level.trainingText(`<s>pick up the <strong class='color-block'>block</strong> with your <strong class='color-f'>field</strong>
                <br>hold your <strong class='color-f'>field</strong> down to charge up then release to throw a <strong class='color-block'>block</strong></s>
                <br>throw the <strong class='color-block'>block</strong> onto the button`)
                // the <strong class='color-block'>block</strong> at the button
            } else if (instruction === 2 && !buttonDoor.isUp && Vector.magnitudeSquared(Vector.sub(body[0].position, buttonDoor.min)) < 10000) {
                instruction++
                level.trainingText(`<s>pick up the <strong class='color-block'>block</strong> with your <strong class='color-f'>field</strong>
                <br>hold your <strong class='color-f'>field</strong> down to charge up then release to throw a <strong class='color-block'>block</strong>
                <br>throw the <strong class='color-block'>block</strong> onto the button</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            buttonDoor.query();
            buttonDoor.draw();
            if (buttonDoor.isUp) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        // spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1790, -600, 250, 225); //button left wall
        spawn.mapRect(1625, -400, 400, 50);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
    throwAt() { //throw a block at mob to open door
        m.addHealth(Infinity)
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        const door = level.door(1612.5, -175, 25, 190, 185, 3)

        let instruction = 0
        level.trainingText(`throw the <strong class='color-block'>block</strong> at the <strong>mobs</strong> to open the door`)

        level.custom = () => {
            if (instruction === 0 && !mob.length) {
                instruction++
                level.trainingText(`<s>throw the <strong class='color-block'>block</strong> at the <strong>mobs</strong> to open the door</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            if (mob.length > 0) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        // spawn.mapRect(1600, -1200, 500, 850); //exit roof
        // spawn.mapRect(1790, -600, 250, 225); //button left wall
        // spawn.mapRect(1625, -400, 400, 50);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
        spawn.mapRect(1600, -600, 425, 250);

        spawn.bodyRect(1025, -75, 50, 50); //block to go on button
        spawn.starter(425, -350, 35)
        spawn.starter(800, -350, 44)
    },
    fire() { //throw a block at mob to open door
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = 15;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        const door = level.door(1612.5, -125, 25, 190, 185, 3)
        const buttonDoor = level.button(400, 0)

        let instruction = 0
        level.trainingText(`use your <strong class='color-f'>field</strong> to pick up the gun power up`)

        level.custom = () => {
            if (instruction === 0 && simulation.isChoosing) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up the gun power up</s>
                <br>choose a <strong class='color-g'>gun</strong>`)
            } else if (instruction === 1 && !simulation.isChoosing) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up the gun power up
                <br>choose a <strong class='color-g'>gun</strong></s>
                <br>use the <strong>left mouse</strong> button to shoot the <strong>mobs</strong>`)
            } else if (instruction === 2 && mob.length === 0) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up the gun power up
                <br>choose a <strong class='color-g'>gun</strong>
                <br>use the <strong>left mouse</strong> button to shoot the <strong>mobs</strong></s>
                <br>drop a <strong class='color-block'>block</strong> on the red button to open the door`)
            } else if (instruction === 3 && !door.isClosing) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up the gun power up
                <br>choose a <strong class='color-g'>gun</strong>
                <br>use the <strong>left mouse</strong> button to shoot the <strong>mobs</strong>
                <br>put a <strong class='color-block'>block</strong> on the red button to open the door</s>`)
            }
            if (!powerUp.length) {
                //spawn ammo if you run out
                if (b.inventory.length && b.guns[b.activeGun].ammo === 0) powerUps.directSpawn(1300, -2000, "ammo", false);
                //spawn a gun power up if don't have one or a gun
                if (!b.inventory.length && !simulation.isChoosing) powerUps.directSpawn(1300, -2000, "gun", false);

            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -350, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            buttonDoor.query();
            buttonDoor.draw();
            if (buttonDoor.isUp) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -350, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)"
            ctx.fillRect(1250, -2800, 100, 2200)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(-150, -2800, 1400, 2200); //roof with tunnel for ammo
        spawn.mapRect(1350, -2800, 675, 2200);

        //ceiling steps
        spawn.mapRect(725, -588, 50, 25);
        spawn.mapRect(725, -600, 75, 25);
        spawn.mapRect(750, -612, 75, 25);
        spawn.mapRect(-275, -650, 1025, 87);

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);

        spawn.mapRect(1600, -600, 425, 300);
        spawn.mapRect(1600, -400, 50, 275);

        powerUps.directSpawn(1300, -1500, "gun", false);
        spawn.starter(900, -300, 35)
        spawn.starter(1400, -400, 44)
    },
    deflect() { //learn to jump
        m.addHealth(Infinity)
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        let instruction = 0
        // activate your <strong class='color-f'>field</strong> with <strong>${input.key.field.replace('Key', '').replace('Digit', '')}</strong> or <strong>right mouse</strong>
        level.trainingText(`use your <strong class='color-f'>field</strong> to <strong>deflect</strong> the <strong style="color:rgb(215,0,145);">mobs</strong>`)

        level.custom = () => {
            if (instruction === 0 && m.pos.x > 1350) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to <strong>deflect</strong> the <strong style="color:rgb(215,0,145);">mobs</strong></s>`)
            }
            //teleport to start if hit
            if (m.immuneCycle > m.cycle) {
                m.energy = m.maxEnergy
                Matter.Body.setPosition(player, { x: 60, y: -50 })
            }
            //spawn bullets
            if (!(simulation.cycle % 5)) {
                spawn.sniperBullet(660 + 580 * Math.random(), -2000, 10, 4);
                const who = mob[mob.length - 1]
                Matter.Body.setVelocity(who, { x: 0, y: 8 });
                who.timeLeft = 300
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //dark
            ctx.fillStyle = "rgba(0,0,0,0.05)"
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
            //center falling bullets
            ctx.fillStyle = "rgba(255,0,255,0.013)" //pink?
            ctx.fillRect(650, -2800, 600, 2800)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall

        spawn.mapRect(-250, 0, 3000, 1800); //floor
        spawn.mapRect(-250, -2800, 900, 2200); //roof
        spawn.mapRect(1250, -2800, 1275, 2200); //roof
        spawn.mapVertex(950, 0, "400 0  -400 0  -300 -50  300 -50"); //base

        spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall

        //spawn bullets on load to avoid rush
        for (let i = 0; i < 32; i++) {
            spawn.sniperBullet(660 + 580 * Math.random(), -2000 + 40 * i, 10, 4);
            const who = mob[mob.length - 1]
            Matter.Body.setVelocity(who, { x: 0, y: 8 });
            who.timeLeft = 300
        }
    },
    heal() { //learn to heal
        m.addHealth(Infinity)
        m.health = 0;
        m.addHealth(0.25)
        document.getElementById("health").style.display = "inline" //show your health bar
        document.getElementById("health-bg").style.display = "inline"

        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor

        let instruction = 0
        level.trainingText(`your <strong>health</strong> is displayed in the top left corner
        <br>use your <strong class='color-f'>field</strong> to pick up <div class="heal-circle" style = "border: none;"></div> until your <strong>health</strong> is full`)

        level.custom = () => {
            if (instruction === 0 && m.health === 1) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up <div class="heal-circle" style = "border: none;"></div> until your <strong>health</strong> is full</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            if (m.health !== 1) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 0, 3500, 1800); //floor

        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof

        spawn.mapRect(700, -8, 50, 25);
        spawn.mapRect(725, -16, 75, 25);
        spawn.mapRect(1375, -16, 50, 50);
        spawn.mapRect(1400, -8, 50, 25);
        spawn.mapRect(750, -24, 650, 100);
        powerUps.directSpawn(875, -40, "heal", false, null, 15);
        powerUps.directSpawn(1075, -50, "heal", false, null, 25);
        powerUps.directSpawn(1275, -65, "heal", false, null, 35);

        const door = level.door(1612.5, -175, 25, 190, 185, 3)
        spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
    nailGun() {
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("nail gun")
        b.guns[b.activeGun].ammo = 0
        simulation.updateGunHUD();

        const door = level.door(1612.5, -175, 25, 190, 185, 3)
        let instruction = 0
        level.trainingText(`use your <strong class='color-f'>field</strong> to pick up <div class="ammo-circle" style = "border: none;"></div> for your <strong class='color-g'>nail gun</strong>`)

        level.custom = () => {
            if (instruction === 0 && b.inventory.length && b.guns[b.activeGun].ammo > 0) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up <div class="ammo-circle" style = "border: none;"></div> for your <strong class='color-g'>nail gun</strong></s>
                <br>use the <strong>left mouse</strong> button to shoot the <strong>mobs</strong>`)
            } else if (instruction === 1 && mob.length === 0) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to pick up <div class="ammo-circle" style = "border: none;"></div> for your <strong class='color-g'>nail gun</strong>
                <br>use the <strong>left mouse</strong> button to shoot the <strong>mobs</strong></s>`)
            }
            //spawn ammo if you run out
            let isAmmo = false
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === 'ammo') isAmmo = true
            }
            if (!isAmmo && b.inventory.length && b.guns[b.activeGun].ammo === 0) {
                powerUps.directSpawn(1300, -2000, "ammo", false);
                powerUps.directSpawn(1301, -2200, "ammo", false);
            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            if (mob.length > 0) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)"
            ctx.fillRect(1250, -2800, 100, 2200)
        };

        if (m.health < 1) {
            powerUps.directSpawn(1298, -3500, "heal", false, 23);
            powerUps.directSpawn(1305, -3000, "heal", false, 35);
        }
        for (let i = 0; i < 2; i++) {
            spawn.spinner(1300 + i, -3000 - 200 * i, 25 + 5 * i)
            Matter.Body.setVelocity(mob[mob.length - 1], { x: 0, y: 62 });
        }

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-150, -2800, 1400, 2200); //roof with tunnel for ammo
        spawn.mapRect(1350, -2800, 675, 2200);

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        // spawn.mapRect(1600, -1200, 500, 850); //exit roof
        // spawn.mapRect(1790, -600, 250, 225); //button left wall
        // spawn.mapRect(1625, -400, 400, 50);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
        spawn.mapRect(1600, -600, 425, 250);
    },
    shotGun() {
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("shotgun")
        // b.guns[b.activeGun].ammo = 0
        // simulation.updateGunHUD();
        const door = level.door(1612.5, -175, 25, 190, 185, 3)
        let instruction = 0
        level.trainingText(`use your <strong class='color-g'>shotgun</strong> to clear the room of mobs`)

        level.custom = () => {
            if (instruction === 0 && mob.length === 0) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-g'>shotgun</strong> to clear the room of mobs</s>`)
            }
            //spawn ammo if you run out
            let isAmmo = false
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === 'ammo') isAmmo = true
            }
            if (!isAmmo && b.inventory.length && b.guns[b.activeGun].ammo === 0) {
                powerUps.directSpawn(1300, -2000, "ammo", false);
                powerUps.directSpawn(1301, -2200, "ammo", false);
            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            if (mob.length > 0) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)"
            ctx.fillRect(1250, -2800, 100, 2200)
        };

        if (m.health < 1) {
            powerUps.directSpawn(1298, -3500, "heal", false, 23);
            powerUps.directSpawn(1305, -3000, "heal", false, 35);
        }
        for (let i = 0; i < 3; i++) {
            spawn.hopper(1300 + i, -3000 - 2000 * i, 25 + 5 * i)
            // Matter.Body.setVelocity(mob[mob.length - 1], { x: 0, y: 0 });
        }
        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-150, -2800, 1400, 2200); //roof with tunnel for ammo
        spawn.mapRect(1350, -2800, 675, 2200);

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
        spawn.mapRect(1600, -600, 425, 250);
    },
    superBall() {
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("super balls")
        // b.guns[b.activeGun].ammo = 0
        // simulation.updateGunHUD();
        const door = level.door(1612.5, -175, 25, 190, 185, 3)
        let instruction = 0
        level.trainingText(`use <strong class='color-g'>super balls</strong> to clear the room of mobs`)

        level.custom = () => {
            if (instruction === 0 && mob.length === 0) {
                instruction++
                level.trainingText(`<s>use <strong class='color-g'>super balls</strong> to clear the room of mobs</s>`)
            }
            //spawn ammo if you run out
            let isAmmo = false
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === 'ammo') isAmmo = true
            }
            if (!isAmmo && b.inventory.length && b.guns[b.activeGun].ammo === 0) {
                powerUps.directSpawn(1300, -2000, "ammo", false);
                powerUps.directSpawn(1301, -2200, "ammo", false);
            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            if (mob.length > 0) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.2)"
            // ctx.fillRect(1225, -2800, 125, 2450)
            ctx.fillRect(-150, -2800, 1500, 2450);
        };

        if (m.health < 1) {
            powerUps.directSpawn(1298, -3500, "heal", false, 23);
            powerUps.directSpawn(1305, -3000, "heal", false, 35);
        }
        for (let i = 0; i < 6; i++) {
            spawn.spawner(i * 230, -800)
            // Matter.Body.setVelocity(mob[mob.length - 1], { x: 0, y: 0 });
        }
        spawn.mapVertex(510, -430, "725 0  725  80  -650 80 -650 -80  650 -80"); //upper room with mobs
        spawn.mapRect(-225, -2800, 1450, 2000);
        spawn.mapRect(1350, -2800, 675, 2450);

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
    matterWave() { //fire wave through the map to kill mosb
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("wave")
        // b.guns[b.activeGun].ammo = 0
        // simulation.updateGunHUD();
        const door = level.door(1612.5, -175, 25, 190, 185, 3)
        let instruction = 0
        level.trainingText(`use <strong class='color-g'>wave</strong> to clear the room of mobs`)

        level.custom = () => {
            if (instruction === 0 && mob.length === 0) {
                instruction++
                level.trainingText(`<s>use <strong class='color-g'>wave</strong> to clear the room of mobs</s>`)
            }
            //spawn ammo if you run out
            let isAmmo = false
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === 'ammo') isAmmo = true
            }
            if (!isAmmo && b.inventory.length && b.guns[b.activeGun].ammo === 0) {
                powerUps.directSpawn(1300, -2000, "ammo", false);
                powerUps.directSpawn(1301, -2200, "ammo", false);
            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            if (mob.length > 0) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.2)"
            // ctx.fillRect(1225, -2800, 125, 2450)
            ctx.fillRect(-150, -2800, 1500, 2450);
        };

        if (m.health < 1) {
            powerUps.directSpawn(1298, -3500, "heal", false, 23);
            powerUps.directSpawn(1305, -3000, "heal", false, 35);
        }
        for (let i = 0; i < 6; i++) {
            spawn.springer(i * 200, -800)
            // Matter.Body.setVelocity(mob[mob.length - 1], { x: 0, y: 0 });
        }
        spawn.springer(1825, -330, 20);

        spawn.mapRect(1175, -850, 50, 500); //upper room with mobs
        spawn.mapRect(-225, -400, 1450, 50);
        spawn.mapRect(-225, -2800, 1450, 2000);
        spawn.mapRect(1350, -2800, 675, 2450);

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
    missile() { //fire a missile to kill mobs and trigger button
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 30); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("missiles")
        // b.guns[b.activeGun].ammo = 0
        // simulation.updateGunHUD();
        const buttonDoor = level.button(2500, 50)
        const door = level.door(1612.5, -175, 25, 190, 185, 3)
        let instruction = 0
        level.trainingText(`use <strong class='color-g'>missiles</strong> to drop a <strong class='color-block'>block</strong> on the button`)

        level.custom = () => {
            if (instruction === 0 && mob.length === 0) {
                instruction++
                level.trainingText(`<s>use <strong class='color-g'>missiles</strong> to drop a <strong class='color-block'>block</strong> on the button</s>`)
            }
            //spawn ammo if you run out
            let isAmmo = false
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === 'ammo') isAmmo = true
            }
            if (!isAmmo && b.inventory.length && b.guns[b.activeGun].ammo === 0) {
                powerUps.directSpawn(1300, -2000, "ammo", false);
                powerUps.directSpawn(1301, -2200, "ammo", false);
            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            buttonDoor.query();
            buttonDoor.draw();
            if (buttonDoor.isUp) {
                door.isClosing = true
            } else {
                door.isClosing = false
            }
            door.openClose();
            door.draw();

            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
            //tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)"
            ctx.fillRect(1250, -2800, 100, 2200)
            ctx.fillRect(1550, 25, 475, 25);
        };
        if (m.health < 1) {
            powerUps.directSpawn(1298, -3500, "heal", false, 23);
            powerUps.directSpawn(1305, -3000, "heal", false, 35);
        }
        for (let i = 0; i < 10; i++) {
            spawn.springer(2100 + i * 100, -250)
            // Matter.Body.setVelocity(mob[mob.length - 1], { x: 0, y: 0 });
        }

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        // spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(3050, -2800, 1550, 4600);
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(-150, -2800, 1400, 2200); //roof with tunnel for ammo
        spawn.mapRect(1350, -2800, 675, 2200);

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        // spawn.mapRect(1350, 0, 675, 30);
        spawn.mapRect(1550, 0, 475, 35);
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
        spawn.mapRect(1600, -600, 425, 250);

        spawn.mapRect(1975, -600, 50, 625);
        spawn.mapRect(2025, -2800, 1075, 2450);
    },
    stack() { //stack blocks to get to exit
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -685;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        let instruction = 0
        level.trainingText(`use your <strong class='color-f'>field</strong> to stack the <strong class='color-block'>blocks</strong>`)

        level.custom = () => {
            if (instruction === 0 && m.pos.x > 1635) {
                instruction++
                level.trainingText(`<s>use your <strong class='color-f'>field</strong> to stack the <strong class='color-block'>blocks</strong></s>`)
            }

            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -1050, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -1050, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)"
            ctx.fillRect(250, -2800, 200, 1800)
        };

        if (m.health < 1) {
            powerUps.directSpawn(298, -3500, "heal", false, 23);
            powerUps.directSpawn(305, -3000, "heal", false, 35);
        }
        for (let i = 0; i < 15; i++) {
            spawn.bodyRect(280, -2000 - 500 * i, 30 + 80 * Math.random(), 30 + 80 * Math.random());
        }
        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 0, 3500, 1800); //floor
        spawn.mapRect(1600, -650, 450, 775);
        spawn.mapRect(-150, -2800, 400, 1800); //roof with tunnel for ammo
        spawn.mapRect(450, -2800, 1675, 1800);
        spawn.mapVertex(1300, 0, "400 0  -500 0  -300 -125  400 -125"); //base
    },
    mine() { //kill mobs and tack their bodies
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(300, -50); //normal spawn
        spawn.mapRect(250, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -685;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("mine")

        let instruction = 0
        level.trainingText(`press the red <strong>button</strong> to spawn a <strong>mob</strong>`)
        const button = level.button(-100, -200)
        button.isUp = true
        spawn.mapRect(-150, -200, 240, 425);

        level.custom = () => {
            if (instruction === 0 && !button.isUp) {
                instruction++
                level.trainingText(`<s>press the red <strong>button</strong> to spawn a <strong>mob</strong></s><br>turn the <strong>mobs</strong> into <strong class='color-block'>blocks</strong>`)
            } else if (instruction === 1 && body.length > 2) {
                instruction++
                level.trainingText(`<s>press the red <strong>button</strong> to spawn a <strong>mob</strong><br>turn the <strong>mobs</strong> into <strong class='color-block'>blocks</strong></s><br>use your <strong class='color-f'>field</strong> to stack the <strong class='color-block'>blocks</strong>`)
            } else if (instruction === 2 && m.pos.x > 1635) {
                instruction++
                level.trainingText(`<s>press the red <strong>button</strong> to spawn a <strong>mob</strong><br>turn the <strong>mobs</strong> into <strong class='color-block'>blocks</strong><br>use your <strong class='color-f'>field</strong> to stack the <strong class='color-block'>blocks</strong></s>`)
            }
            //spawn ammo if you run out
            let isAmmo = false
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === 'ammo') isAmmo = true
            }
            if (!isAmmo && b.inventory.length && b.guns[b.activeGun].ammo === 0) {
                powerUps.directSpawn(1300, -2000, "ammo", false);
                powerUps.directSpawn(1301, -2200, "ammo", false);
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -1050, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            button.query();
            button.draw();
            if (!button.isUp) {
                if (button.isReady) {
                    button.isReady = false
                    spawn.exploder(335, -1700)
                    Matter.Body.setVelocity(mob[mob.length - 1], { x: 0, y: 20 });
                    ctx.fillStyle = "rgba(255,0,0,0.9)"
                    ctx.fillRect(550, -2800, 200, 1800)
                }
            } else {
                button.isReady = true
            }
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -1050, 400, 400)
            //ammo tunnel shadow
            ctx.fillStyle = "rgba(0,0,0,0.4)"
            ctx.fillRect(550, -2800, 200, 1800)
        };

        if (m.health < 1) {
            powerUps.directSpawn(298, -3500, "heal", false, 23);
            powerUps.directSpawn(305, -3000, "heal", false, 35);
        }
        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 0, 3500, 1800); //floor
        spawn.mapRect(1600, -650, 450, 775);
        spawn.mapRect(-150, -2800, 700, 1800); //roof with tunnel for ammo
        spawn.mapRect(750, -2800, 1675, 1800);
        spawn.mapVertex(1300, 0, "400 0  -600 0  -300 -125  400 -125"); //base
    },
    grenades() { //jump at the top of the elevator's path to go extra high
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(0, -50); //normal spawn
        spawn.mapRect(-50, -10, 100, 20); //small platform for player
        level.exit.x = 1900;
        level.exit.y = -2835;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("grenades")

        const elevator1 = level.elevator(550, -100, 180, 25, -840, 0.003, { up: 0.05, down: 0.2 }) // x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
        elevator1.addConstraint();
        const toggle1 = level.toggle(275, 0) //(x,y,isOn,isLockOn = true/false)

        const elevator2 = level.elevator(1400, -950, 180, 25, -2400, 0.0025) // x, y, width, height, maxHeight, force = 0.003, friction = { up: 0.01, down: 0.2 }) {
        elevator2.addConstraint();
        const button2 = level.button(1000, -850)

        let instruction = 0
        level.trainingText(`flip the <strong>switch</strong> to turn on the <strong>elevator</strong>`)
        level.custom = () => {
            if (instruction === 0 && elevator1.isOn) {
                instruction++
                level.trainingText(`<s>flip the <strong>switch</strong> to turn on the <strong>elevator</strong></s>
                <br>put a <strong class='color-block'>block</strong> on the <strong>button</strong> to active the <strong>elevator</strong>`)
            } else if (instruction === 1 && elevator2.isOn) {
                instruction++
                level.trainingText(`<s>flip the <strong>switch</strong> to turn on the <strong>elevator</strong><br>put a <strong class='color-block'>block</strong> on the <strong>button</strong> to active the <strong>elevator</strong></s>
                <br>hold <strong>jump</strong> before the <strong>elevator's</strong> <strong>apex</strong> to reach the <strong>exit</strong>`)
            } else if (instruction === 2 && m.pos.x > 1635) {
                instruction++
                level.trainingText(`<s>flip the <strong>switch</strong> to turn on the <strong>elevator</strong><br>put a <strong class='color-block'>block</strong> on the <strong>button</strong> to active the <strong>elevator</strong><br>hold <strong>jump</strong> before the <strong>elevator's</strong> <strong>apex</strong> to reach the <strong>exit</strong></s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1725, -3100, 375, 300);

            level.enter.draw();
            level.exit.drawAndCheck();
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
            } else {
                ctx.fillStyle = "#aaa"
            }
            ctx.fillRect(640, -825, 1, 745)

            button2.query();
            button2.draw();
            if (button2.isUp) {
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
            ctx.fillRect(1490, -2300, 1, 1375)
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1725, -3100, 375, 300);
            //shadows
            ctx.fillStyle = "rgba(0,0,0,0.05)"
            ctx.fillRect(-150, -250, 300, 250);
            let grd = ctx.createLinearGradient(0, -150, 0, -2300);
            grd.addColorStop(0, "rgba(0,0,0,0.35)");
            grd.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grd //"rgba(0,0,100,0.01)"
            ctx.fillRect(-200, -2300, 1825, 2300);
        };

        if (m.health < 1) {
            powerUps.directSpawn(298, -3500, "heal", false, 23);
            powerUps.directSpawn(305, -3000, "heal", false, 35);
        }
        spawn.mapRect(-2750, -4800, 2600, 6600); //left wall
        spawn.mapRect(1600, -2800, 3000, 4600); //right wall
        spawn.mapRect(-150, -4800, 300, 4550);
        spawn.mapRect(2125, -4775, 2475, 2050);
        spawn.mapRect(-250, 0, 3500, 1800); //floor
        spawn.mapRect(750, -850, 950, 950);
        spawn.mapRect(125, -275, 25, 100);
        spawn.mapRect(2100, -3150, 50, 350);
        spawn.mapRect(1725, -3150, 50, 175);
        spawn.mapRect(1725, -3150, 425, 50);

        spawn.nodeGroup(1200, -1500, "grenadier", 7);
    },
    harpoon() { //jump at the top of the elevator's path to go extra high
        level.difficultyIncrease(1) //difficulty on training mode resets to zero with each new level
        level.setPosToSpawn(0, -50); //normal spawn
        spawn.mapRect(-50, -10, 100, 20); //small platform for player
        level.exit.x = 1900;
        level.exit.y = -2835;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor
        b.removeAllGuns();
        b.giveGuns("harpoon")

        let instruction = 0
        level.trainingText(`climb up to the exit`)
        level.custom = () => {
            if (instruction === 0 && m.pos.x > 1635) {
                instruction++
                level.trainingText(`<s>climb up to the exit</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1725, -3100, 375, 300);

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1725, -3100, 375, 300);
            //shadows
            ctx.fillStyle = "rgba(0,90,100,0.05)"
            ctx.fillRect(-150, -250, 300, 250);
            let grd = ctx.createLinearGradient(0, -150, 0, -2300);
            grd.addColorStop(0, "rgba(0,90,100,0.35)");
            grd.addColorStop(1, "rgba(0,90,100,0)");
            ctx.fillStyle = grd //"rgba(0,0,100,0.01)"
            ctx.fillRect(-200, -2300, 1825, 2300);
            vanish1.query();
            vanish2.query();
            vanish3.query();
            vanish4.query();
            vanish5.query();
            vanish6.query();
            vanish7.query();
            vanish8.query();
            vanish9.query();
            vanish10.query();
            vanish11.query();
            vanish12.query();
        };
        const vanish1 = level.vanish(175, -325, 175, 25); //x, y, width, height, hide = { x: 0, y: 100 }  //hide should just be somewhere behind the map so the player can't see it
        const vanish2 = level.vanish(525, -625, 175, 25);
        const vanish3 = level.vanish(1125, -1125, 175, 25);
        const vanish4 = level.vanish(1500, -1450, 100, 25);
        const vanish5 = level.vanish(1125, -1675, 175, 25);
        const vanish6 = level.vanish(750, -1950, 175, 25);
        const vanish7 = level.vanish(550, -1950, 175, 25);
        const vanish8 = level.vanish(350, -1950, 175, 25);
        const vanish9 = level.vanish(150, -1950, 175, 25);
        const vanish10 = level.vanish(325, -2300, 200, 25);
        const vanish11 = level.vanish(725, -2550, 100, 25);
        const vanish12 = level.vanish(1125, -2700, 150, 25);

        if (m.health < 1) {
            powerUps.directSpawn(298, -3500, "heal", false, 23);
            powerUps.directSpawn(305, -3000, "heal", false, 35);
        }
        spawn.mapRect(-2750, -4800, 2600, 6600); //left wall
        spawn.mapRect(1600, -2800, 3000, 4600); //right wall
        spawn.mapRect(-150, -4800, 300, 4550);
        spawn.mapRect(2125, -4775, 2475, 2050);
        spawn.mapRect(-250, 0, 3500, 1800); //floor
        spawn.mapRect(750, -850, 950, 950);
        spawn.mapRect(125, -275, 25, 100);
        spawn.mapRect(2100, -3150, 50, 350);
        spawn.mapRect(1725, -3150, 50, 175);
        spawn.mapRect(1725, -3150, 425, 50);

        spawn.grower(250, -375);
        spawn.grower(1000, -900)
        spawn.grower(1475, -925);
        spawn.grower(275, -2000);
        spawn.grower(650, -2000);
        spawn.grower(1475, -975);
        spawn.grower(1575, -1525);
        spawn.grower(1700, -2850);
    },
    trainingTemplate() { //learn to crouch
        m.addHealth(Infinity)
        document.getElementById("health").style.display = "none" //hide your health bar
        document.getElementById("health-bg").style.display = "none"

        level.setPosToSpawn(60, -50); //normal spawn
        spawn.mapRect(10, -10, 100, 20); //small platform for player
        level.exit.x = 1775;
        level.exit.y = -35;
        spawn.mapRect(level.exit.x, level.exit.y + 25, 100, 100); //exit bump
        simulation.zoomScale = 1400 //1400 is normal
        level.defaultZoom = 1400
        simulation.zoomTransition(level.defaultZoom, 1)
        document.body.style.backgroundColor = level.trainingBackgroundColor


        let instruction = 0
        level.trainingText(`press <strong class="key-input-train">${input.key.down.replace('Key', '').replace('Digit', '')}</strong> to crouch`)

        level.custom = () => {
            if (instruction === 0 && input.down) {
                instruction++

                level.trainingText(`<s>press <strong class="key-input-train">${input.key.down.replace('Key', '').replace('Digit', '')}</strong> to crouch</s>`)
            }
            //exit room
            ctx.fillStyle = "#f2f2f2"
            ctx.fillRect(1600, -400, 400, 400)

            level.enter.draw();
            level.exit.drawAndCheck();
        };
        level.customTopLayer = () => {
            //exit room glow
            ctx.fillStyle = "rgba(0,255,255,0.05)"
            ctx.fillRect(1600, -400, 400, 400)
        };

        spawn.mapRect(-2750, -2800, 2600, 4600); //left wall
        spawn.mapRect(2000, -2800, 2600, 4600); //right wall
        spawn.mapRect(-250, 50, 3500, 1750); //floor
        spawn.mapRect(-200, 0, 950, 100);
        spawn.mapRect(1575, 0, 500, 100);
        spawn.mapRect(-250, -2800, 3500, 2200); //roof

        spawn.mapRect(725, 12, 50, 25);
        spawn.mapRect(725, 25, 75, 25);
        spawn.mapRect(750, 38, 75, 25);
        spawn.mapRect(1525, 25, 75, 50);
        spawn.mapRect(1500, 38, 50, 25);
        spawn.mapRect(1550, 12, 50, 25);
        spawn.mapRect(1600, -1200, 500, 850); //exit roof
        spawn.mapRect(1600, -400, 50, 225); //exit room left upper wall
    },
};