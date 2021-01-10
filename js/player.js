//global player variables for use in matter.js physics
let player, jumpSensor, playerBody, playerHead, headSensor;

// player Object Prototype *********************************************
const mech = {
    spawn() {
        //load player in matter.js physic engine
        // let vector = Vertices.fromPath("0 40  50 40   50 115   0 115   30 130   20 130"); //player as a series of vertices
        let vertices = Vertices.fromPath("0,40, 50,40, 50,115, 30,130, 20,130, 0,115, 0,40"); //player as a series of vertices
        playerBody = Bodies.fromVertices(0, 0, vertices);
        jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
            //this sensor check if the player is on the ground to enable jumping
            sleepThreshold: 99999999999,
            isSensor: true
        });
        vertices = Vertices.fromPath("16 -82  2 -66  2 -37  43 -37  43 -66  30 -82");
        playerHead = Bodies.fromVertices(0, -55, vertices); //this part of the player lowers on crouch
        headSensor = Bodies.rectangle(0, -57, 48, 45, {
            //senses if the player's head is empty and can return after crouching
            sleepThreshold: 99999999999,
            isSensor: true
        });
        player = Body.create({
            //combine jumpSensor and playerBody
            parts: [playerBody, playerHead, jumpSensor, headSensor],
            inertia: Infinity, //prevents player rotation
            friction: 0.002,
            frictionAir: 0.001,
            //frictionStatic: 0.5,
            restitution: 0,
            sleepThreshold: Infinity,
            collisionFilter: {
                group: 0,
                category: cat.player,
                mask: cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
            },
            death() {
                mech.death();
            }
        });
        Matter.Body.setMass(player, mech.mass);
        World.add(engine.world, [player]);

        mech.holdConstraint = Constraint.create({
            //holding body constraint
            pointA: {
                x: 0,
                y: 0
            },
            bodyB: jumpSensor, //setting constraint to jump sensor because it has to be on something until the player picks up things
            stiffness: 0.4
        });
        World.add(engine.world, mech.holdConstraint);
    },
    cycle: 300, //starts at 300 cycles instead of 0 to prevent bugs with mech.history
    lastKillCycle: 0,
    lastHarmCycle: 0,
    width: 50,
    radius: 30,
    fillColor: "#fff",
    fillColorDark: "#ccc",
    color: {
        hue: 0,
        sat: 0,
        light: 100,
    },
    setFillColors() {
        this.fillColor = `hsl(${mech.color.hue},${mech.color.sat}%,${mech.color.light}%)`
        this.fillColorDark = `hsl(${mech.color.hue},${mech.color.sat}%,${mech.color.light-20}%)`
    },
    height: 42,
    yOffWhen: {
        crouch: 22,
        stand: 49,
        jump: 70
    },
    defaultMass: 5,
    mass: 5,
    FxNotHolding: 0.015,
    Fx: 0.016, //run Force on ground //
    jumpForce: 0.42,
    setMovement() {
        mech.Fx = 0.016 * tech.squirrelFx * tech.fastTime;
        mech.jumpForce = 0.42 * tech.squirrelJump * tech.fastTimeJump;
    },
    FxAir: 0.016, // 0.4/5/5  run Force in Air
    yOff: 70,
    yOffGoal: 70,
    onGround: false, //checks if on ground or in air
    standingOn: undefined,
    numTouching: 0,
    crouch: false,
    // isHeadClear: true,
    spawnPos: {
        x: 0,
        y: 0
    },
    spawnVel: {
        x: 0,
        y: 0
    },
    pos: {
        x: 0,
        y: 0
    },
    yPosDifference: 24.285923217549026, //player.position.y - mech.pos.y
    Sy: 0, //adds a smoothing effect to vertical only
    Vx: 0,
    Vy: 0,
    friction: {
        ground: 0.01,
        air: 0.0025
    },
    airSpeedLimit: 125, // 125/mass/mass = 5
    angle: 0,
    walk_cycle: 0,
    stepSize: 0,
    flipLegs: -1,
    hip: {
        x: 12,
        y: 24
    },
    knee: {
        x: 0,
        y: 0,
        x2: 0,
        y2: 0
    },
    foot: {
        x: 0,
        y: 0
    },
    legLength1: 55,
    legLength2: 45,
    transX: 0,
    transY: 0,
    history: [], //tracks the last second of player position
    resetHistory() {
        for (let i = 0; i < 600; i++) { //reset history
            mech.history[i] = {
                position: {
                    x: player.position.x,
                    y: player.position.y,
                },
                velocity: {
                    x: player.velocity.x,
                    y: player.velocity.y
                },
                angle: mech.angle,
                health: mech.health,
                energy: mech.energy,
            }
        }
    },
    move() {
        mech.pos.x = player.position.x;
        mech.pos.y = playerBody.position.y - mech.yOff;
        mech.Vx = player.velocity.x;
        mech.Vy = player.velocity.y;

        //tracks the last 10s of player information
        // console.log(mech.history)
        mech.history.splice(mech.cycle % 600, 1, {
            position: {
                x: player.position.x,
                y: player.position.y,
            },
            velocity: {
                x: player.velocity.x,
                y: player.velocity.y
            },
            angle: mech.angle,
            health: mech.health,
            energy: mech.energy,
            activeGun: b.activeGun
        });
        // const back = 59  // 59 looks at 1 second ago //29 looks at 1/2 a second ago
        // historyIndex = (mech.cycle - back) % 600
    },
    transSmoothX: 0,
    transSmoothY: 0,
    lastGroundedPositionY: 0,
    // mouseZoom: 0,
    look() {
        //always on mouse look
        mech.angle = Math.atan2(
            simulation.mouseInGame.y - mech.pos.y,
            simulation.mouseInGame.x - mech.pos.x
        );
        //smoothed mouse look translations
        const scale = 0.8;
        mech.transSmoothX = canvas.width2 - mech.pos.x - (simulation.mouse.x - canvas.width2) * scale;
        mech.transSmoothY = canvas.height2 - mech.pos.y - (simulation.mouse.y - canvas.height2) * scale;

        mech.transX += (mech.transSmoothX - mech.transX) * 0.07;
        mech.transY += (mech.transSmoothY - mech.transY) * 0.07;
    },
    doCrouch() {
        if (!mech.crouch) {
            mech.crouch = true;
            mech.yOffGoal = mech.yOffWhen.crouch;
            if ((playerHead.position.y - player.position.y) < 0) {

                Matter.Body.setPosition(playerHead, {
                    x: player.position.x,
                    y: player.position.y + 9.1740767
                })


                // Matter.Body.translate(playerHead, {
                //     x: 0,
                //     y: 40
                // });
            }
            // playerHead.collisionFilter.group = -1
            // playerHead.collisionFilter.category = 0
            // playerHead.collisionFilter.mask = -1
            // playerHead.isSensor = true;  //works, but has a 2 second lag...
            // collisionFilter: {
            //     group: 0,
            //     category: cat.player,
            //     mask: cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
            // },
        }
    },
    undoCrouch() {
        if (mech.crouch) {
            mech.crouch = false;
            mech.yOffGoal = mech.yOffWhen.stand;
            if ((playerHead.position.y - player.position.y) > 0) {
                Matter.Body.setPosition(playerHead, {
                    x: player.position.x,
                    y: player.position.y - 30.28592321
                })
                // Matter.Body.translate(playerHead, {
                //     x: 0,
                //     y: -40
                // });
            }

            // playerHead.collisionFilter = {
            //     group: 0,
            //     category: cat.player,
            //     mask: cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
            // }
            // playerHead.isSensor = false;
            // playerHead.collisionFilter.category = cat.player
            // playerHead.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
        }
    },
    hardLandCD: 0,
    checkHeadClear() {
        if (Matter.Query.collides(headSensor, map).length > 0) {
            return false
        } else {
            return true
        }
    },
    buttonCD_jump: 0, //cool down for player buttons
    groundControl() {
        //check for crouch or jump
        if (mech.crouch) {
            if (!(input.down) && mech.checkHeadClear() && mech.hardLandCD < mech.cycle) mech.undoCrouch();
        } else if (input.down || mech.hardLandCD > mech.cycle) {
            mech.doCrouch(); //on ground && not crouched and pressing s or down
        } else if ((input.up) && mech.buttonCD_jump + 20 < mech.cycle && mech.yOffWhen.stand > 23) {
            mech.buttonCD_jump = mech.cycle; //can't jump again until 20 cycles pass
            //apply a fraction of the jump force to the body the player is jumping off of
            Matter.Body.applyForce(mech.standingOn, mech.pos, {
                x: 0,
                y: mech.jumpForce * 0.12 * Math.min(mech.standingOn.mass, 5)
            });
            player.force.y = -mech.jumpForce; //player jump force
            Matter.Body.setVelocity(player, { //zero player y-velocity for consistent jumps
                x: player.velocity.x,
                y: 0
            });
        }

        if (input.left) {
            if (player.velocity.x > -2) {
                player.force.x -= mech.Fx * 1.5
            } else {
                player.force.x -= mech.Fx
            }
            // }
        } else if (input.right) {
            if (player.velocity.x < 2) {
                player.force.x += mech.Fx * 1.5
            } else {
                player.force.x += mech.Fx
            }
        } else {
            const stoppingFriction = 0.92;
            Matter.Body.setVelocity(player, {
                x: player.velocity.x * stoppingFriction,
                y: player.velocity.y * stoppingFriction
            });
        }
        //come to a stop if fast or if no move key is pressed
        if (player.speed > 4) {
            const stoppingFriction = (mech.crouch) ? 0.65 : 0.89; // this controls speed when crouched
            Matter.Body.setVelocity(player, {
                x: player.velocity.x * stoppingFriction,
                y: player.velocity.y * stoppingFriction
            });
        }
    },
    airControl() {
        //check for short jumps   //moving up   //recently pressed jump  //but not pressing jump key now
        if (mech.buttonCD_jump + 60 > mech.cycle && !(input.up) && mech.Vy < 0) {
            Matter.Body.setVelocity(player, {
                //reduce player y-velocity every cycle
                x: player.velocity.x,
                y: player.velocity.y * 0.94
            });
        }

        if (input.left) {
            if (player.velocity.x > -mech.airSpeedLimit / player.mass / player.mass) player.force.x -= mech.FxAir; // move player   left / a
        } else if (input.right) {
            if (player.velocity.x < mech.airSpeedLimit / player.mass / player.mass) player.force.x += mech.FxAir; //move player  right / d
        }
    },
    alive: false,
    death() {
        if (tech.isImmortal) { //if player has the immortality buff, spawn on the same level with randomized damage
            simulation.isTextLogOpen = false;
            //count tech
            let totalTech = 0;
            for (let i = 0; i < tech.tech.length; i++) {
                if (!tech.tech[i].isNonRefundable) totalTech += tech.tech[i].count
            }
            if (tech.isDeterminism) totalTech -= 3 //remove the bonus tech 
            if (tech.isSuperDeterminism) totalTech -= 2 //remove the bonus tech 
            totalTech = totalTech * 1.15 + 1 // a few extra to make it stronger
            const totalGuns = b.inventory.length //count guns

            function randomizeTech() {
                for (let i = 0; i < totalTech; i++) {
                    //find what tech I don't have
                    let options = [];
                    for (let i = 0, len = tech.tech.length; i < len; i++) {
                        if (tech.tech[i].count < tech.tech[i].maxCount &&
                            !tech.tech[i].isNonRefundable &&
                            tech.tech[i].name !== "quantum immortality" &&
                            tech.tech[i].name !== "Born rule" &&
                            tech.tech[i].allowed()
                        ) options.push(i);
                    }
                    //add a new tech
                    if (options.length > 0) {
                        const choose = Math.floor(Math.random() * options.length)
                        let newTech = options[choose]
                        tech.giveTech(newTech)
                        options.splice(choose, 1);
                    }
                }
                simulation.updateTechHUD();
            }

            function randomizeField() {
                mech.setField(Math.ceil(Math.random() * (mech.fieldUpgrades.length - 1)))
            }

            function randomizeHealth() {
                mech.health = 0.7 + Math.random()
                if (mech.health > 1) mech.health = 1;
                mech.displayHealth();
            }

            function randomizeGuns() {
                //removes guns and ammo  
                b.inventory = [];
                b.activeGun = null;
                b.inventoryGun = 0;
                for (let i = 0, len = b.guns.length; i < len; ++i) {
                    b.guns[i].have = false;
                    if (b.guns[i].ammo !== Infinity) b.guns[i].ammo = 0;
                }
                //give random guns
                for (let i = 0; i < totalGuns; i++) b.giveGuns()
                //randomize ammo
                for (let i = 0, len = b.inventory.length; i < len; i++) {
                    if (b.guns[b.inventory[i]].ammo !== Infinity) {
                        b.guns[b.inventory[i]].ammo = Math.max(0, Math.floor(6 * b.guns[b.inventory[i]].ammo * Math.sqrt(Math.random())))
                    }
                }
                simulation.makeGunHUD(); //update gun HUD
            }

            simulation.wipe = function() { //set wipe to have trails
                ctx.fillStyle = "rgba(255,255,255,0)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            function randomizeEverything() {
                spawn.setSpawnList(); //new mob types
                simulation.clearNow = true; //triggers a map reset

                tech.setupAllTech(); //remove all tech
                for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
                bullet = []; //remove all bullets
                randomizeHealth()
                randomizeField()
                randomizeGuns()
                randomizeTech()
            }

            randomizeEverything()
            const swapPeriod = 1000
            for (let i = 0, len = 5; i < len; i++) {
                setTimeout(function() {
                    randomizeEverything()
                    simulation.isTextLogOpen = true;
                    simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> 0.${len-i-1}`, swapPeriod);
                    simulation.isTextLogOpen = false;
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = `rgba(255,255,255,${(i+1)*(i+1)*0.006})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        // pixelWindows()
                    }
                }, (i + 1) * swapPeriod);
            }

            setTimeout(function() {
                simulation.wipe = function() { //set wipe to normal
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                simulation.isTextLogOpen = true;
                simulation.makeTextLog("simulation.amplitude <span class='color-symbol'>=</span> null");
            }, 6 * swapPeriod);

        } else if (mech.alive) { //normal death code here
            mech.alive = false;
            simulation.paused = true;
            mech.health = 0;
            mech.displayHealth();
            document.getElementById("text-log").style.opacity = 0; //fade out any active text logs
            document.getElementById("fade-out").style.opacity = 1; //slowly fades out
            // build.shareURL(false)
            setTimeout(function() {
                World.clear(engine.world);
                Engine.clear(engine);
                simulation.splashReturn();
            }, 3000);
        }
    },
    health: 0,
    maxHealth: 1, //set in simulation.reset()
    drawHealth() {
        if (mech.health < 1) {
            ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
            ctx.fillRect(mech.pos.x - mech.radius, mech.pos.y - 50, 60, 10);
            ctx.fillStyle = "#f00";
            ctx.fillRect(
                mech.pos.x - mech.radius,
                mech.pos.y - 50,
                60 * mech.health,
                10
            );
        }
    },
    displayHealth() {
        id = document.getElementById("health");
        // health display follows a x^1.5 rule to make it seem like the player has lower health, this makes the player feel more excitement
        id.style.width = Math.floor(300 * Math.pow(mech.health, 1.5)) + "px";
        //css animation blink if health is low
        if (mech.health < 0.3) {
            id.classList.add("low-health");
        } else {
            id.classList.remove("low-health");
        }
    },
    addHealth(heal) {
        if (!tech.isEnergyHealth) {
            mech.health += heal * simulation.healScale;
            if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
            mech.displayHealth();
        }
    },
    baseHealth: 1,
    setMaxHealth() {
        mech.maxHealth = mech.baseHealth + tech.bonusHealth + tech.armorFromPowerUps
        simulation.makeTextLog(`<span class='color-var'>mech</span>.<span class='color-h'>maxHealth</span> <span class='color-symbol'>=</span> ${mech.maxHealth.toFixed(2)}`)
        if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
        mech.displayHealth();
    },

    defaultFPSCycle: 0, //tracks when to return to normal fps
    immuneCycle: 0, //used in engine
    harmReduction() {
        let dmg = 1
        dmg *= mech.fieldHarmReduction
        if (tech.isSpeedHarm) dmg *= 1 - Math.min(player.speed * 0.0185, 0.55)
        if (tech.isSlowFPS) dmg *= 0.85
        if (tech.isPiezo) dmg *= 0.85
        if (tech.isHarmReduce && mech.fieldUpgrades[mech.fieldMode].name === "negative mass field" && mech.isFieldActive) dmg *= 0.6
        if (tech.isBotArmor) dmg *= 0.97 ** tech.totalBots()
        if (tech.isHarmArmor && mech.lastHarmCycle + 600 > mech.cycle) dmg *= 0.33;
        if (tech.isNoFireDefense && mech.cycle > mech.fireCDcycle + 120) dmg *= 0.6
        if (tech.energyRegen === 0) dmg *= 0.4
        if (tech.isTurret && mech.crouch) dmg *= 0.5;
        if (tech.isEntanglement && b.inventory[0] === b.activeGun) {
            for (let i = 0, len = b.inventory.length; i < len; i++) dmg *= 0.87 // 1 - 0.15
        }
        return dmg
    },
    rewind(steps) { // mech.rewind(Math.floor(Math.min(599, 137 * mech.energy)))
        if (tech.isRewindGrenade) {
            for (let i = 1, len = Math.floor(2 + steps / 40); i < len; i++) {
                b.grenade(Vector.add(mech.pos, { x: 10 * (Math.random() - 0.5), y: 10 * (Math.random() - 0.5) }), -i * Math.PI / len) //fire different angles for each grenade
                const who = bullet[bullet.length - 1]
                if (tech.isVacuumBomb) {
                    Matter.Body.setVelocity(who, {
                        x: who.velocity.x * 0.5,
                        y: who.velocity.y * 0.5
                    });
                } else if (tech.isRPG) {
                    who.endCycle = (who.endCycle - simulation.cycle) * 0.2 + simulation.cycle
                } else if (tech.isNeutronBomb) {
                    Matter.Body.setVelocity(who, {
                        x: who.velocity.x * 0.3,
                        y: who.velocity.y * 0.3
                    });
                } else {
                    Matter.Body.setVelocity(who, {
                        x: who.velocity.x * 0.5,
                        y: who.velocity.y * 0.5
                    });
                    who.endCycle = (who.endCycle - simulation.cycle) * 0.5 + simulation.cycle
                }
            }
        }
        let history = mech.history[(mech.cycle - steps) % 600]
        Matter.Body.setPosition(player, history.position);
        Matter.Body.setVelocity(player, { x: history.velocity.x, y: history.velocity.y });

        // b.activeGun = history.activeGun
        // for (let i = 0; i < b.inventory.length; i++) {
        //     if (b.inventory[i] === b.activeGun) b.inventoryGun = i
        // }
        // simulation.updateGunHUD();
        // simulation.boldActiveGunHUD();

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
        mech.energy = Math.max(mech.energy - steps / 136, 0.01)
        mech.immuneCycle = mech.cycle + 30; //player is immune to collision damage for 30 cycles

        let isDrawPlayer = true
        const shortPause = function() {
            if (mech.defaultFPSCycle < mech.cycle) { //back to default values
                simulation.fpsCap = simulation.fpsCapDefault
                simulation.fpsInterval = 1000 / simulation.fpsCap;
                document.getElementById("dmg").style.transition = "opacity 1s";
                document.getElementById("dmg").style.opacity = "0";
            } else {
                requestAnimationFrame(shortPause);
                if (isDrawPlayer) {
                    isDrawPlayer = false
                    ctx.save();
                    ctx.translate(canvas.width2, canvas.height2); //center
                    ctx.scale(simulation.zoom / simulation.edgeZoomOutSmooth, simulation.zoom / simulation.edgeZoomOutSmooth); //zoom in once centered
                    ctx.translate(-canvas.width2 + mech.transX, -canvas.height2 + mech.transY); //translate
                    for (let i = 1; i < steps; i++) {
                        history = mech.history[(mech.cycle - i) % 600]
                        mech.pos.x = history.position.x
                        mech.pos.y = history.position.y
                        mech.draw();
                    }
                    ctx.restore();
                    mech.resetHistory()
                }
            }
        };

        if (mech.defaultFPSCycle < mech.cycle) requestAnimationFrame(shortPause);
        simulation.fpsCap = 3 //1 is longest pause, 4 is standard
        simulation.fpsInterval = 1000 / simulation.fpsCap;
        mech.defaultFPSCycle = mech.cycle
        if (tech.isRewindBot) {
            const len = steps * 0.042 * tech.isRewindBot
            for (let i = 0; i < len; i++) {
                const where = mech.history[Math.abs(mech.cycle - i * 40) % 600].position //spread out spawn locations along past history
                b.randomBot({
                    x: where.x + 100 * (Math.random() - 0.5),
                    y: where.y + 100 * (Math.random() - 0.5)
                }, false, false)
                bullet[bullet.length - 1].endCycle = simulation.cycle + 360 + Math.floor(180 * Math.random()) //6-9 seconds
            }
        }
    },
    damage(dmg) {
        if (tech.isRewindAvoidDeath && mech.energy > 0.66) {
            const steps = Math.floor(Math.min(299, 137 * mech.energy))
            simulation.makeTextLog(`<span class='color-var'>mech</span>.rewind(${steps})`)
            mech.rewind(steps)
            return
        }
        mech.lastHarmCycle = mech.cycle
        if (tech.isDroneOnDamage) { //chance to build a drone on damage  from tech
            const len = Math.min((dmg - 0.06 * Math.random()) * 40, 40)
            for (let i = 0; i < len; i++) {
                if (Math.random() < 0.5) b.drone() //spawn drone
            }
        }

        if (tech.isEnergyHealth) {
            mech.energy -= dmg;
            if (mech.energy < 0 || isNaN(mech.energy)) { //taking deadly damage
                if (tech.isDeathAvoid && powerUps.research.research && !tech.isDeathAvoidedThisLevel) {
                    tech.isDeathAvoidedThisLevel = true
                    powerUps.research.changeRerolls(-1)
                    simulation.makeTextLog(`<span class='color-var'>mech</span>.<span class='color-r'>research</span><span class='color-symbol'>--</span><br>${powerUps.research.research}`)
                    for (let i = 0; i < 6; i++) {
                        powerUps.spawn(mech.pos.x, mech.pos.y, "heal", false);
                    }
                    mech.energy = mech.maxEnergy
                    mech.immuneCycle = mech.cycle + 360 //disable this.immuneCycle bonus seconds
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = "rgba(255,255,255,0.03)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    setTimeout(function() {
                        simulation.wipe = function() { //set wipe to normal
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                    }, 3000);
                    return;
                } else { //death
                    mech.health = 0;
                    mech.energy = 0;
                    mech.death();
                    return;
                }
            }
        } else {
            dmg *= mech.harmReduction()
            mech.health -= dmg;
            if (mech.health < 0 || isNaN(mech.health)) {
                if (tech.isDeathAvoid && powerUps.research.research > 0 && !tech.isDeathAvoidedThisLevel) { //&& Math.random() < 0.5
                    tech.isDeathAvoidedThisLevel = true
                    mech.health = 0.05
                    powerUps.research.changeRerolls(-1)
                    simulation.makeTextLog(`<span class='color-var'>mech</span>.<span class='color-r'>research</span><span class='color-symbol'>--</span>
                    <br>${powerUps.research.research}`)
                    for (let i = 0; i < 6; i++) powerUps.spawn(mech.pos.x + 10 * Math.random(), mech.pos.y + 10 * Math.random(), "heal", false);
                    mech.immuneCycle = mech.cycle + 360 //disable this.immuneCycle bonus seconds
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = "rgba(255,255,255,0.03)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    setTimeout(function() {
                        simulation.wipe = function() { //set wipe to normal
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                    }, 3000);
                } else {
                    mech.health = 0;
                    mech.death();
                    return;
                }
            }
            mech.displayHealth();
            document.getElementById("dmg").style.transition = "opacity 0s";
            document.getElementById("dmg").style.opacity = 0.1 + Math.min(0.6, dmg * 4);
        }

        if (dmg > 0.06 / mech.holdingMassScale) mech.drop(); //drop block if holding
        const normalFPS = function() {
            if (mech.defaultFPSCycle < mech.cycle) { //back to default values
                simulation.fpsCap = simulation.fpsCapDefault
                simulation.fpsInterval = 1000 / simulation.fpsCap;
                document.getElementById("dmg").style.transition = "opacity 1s";
                document.getElementById("dmg").style.opacity = "0";
            } else {
                requestAnimationFrame(normalFPS);
            }
        };

        if (mech.defaultFPSCycle < mech.cycle) requestAnimationFrame(normalFPS);
        if (tech.isSlowFPS) { // slow game 
            simulation.fpsCap = 30 //new fps
            simulation.fpsInterval = 1000 / simulation.fpsCap;
            //how long to wait to return to normal fps
            mech.defaultFPSCycle = mech.cycle + 20 + Math.min(90, Math.floor(200 * dmg))
            if (tech.isHarmFreeze) { //freeze all mobs
                for (let i = 0, len = mob.length; i < len; i++) {
                    mobs.statusSlow(mob[i], 300)
                }
            }
        } else {
            if (dmg > 0.05) { // freeze game for high damage hits
                simulation.fpsCap = 4 //40 - Math.min(25, 100 * dmg)
                simulation.fpsInterval = 1000 / simulation.fpsCap;
            } else {
                simulation.fpsCap = simulation.fpsCapDefault
                simulation.fpsInterval = 1000 / simulation.fpsCap;
            }
            mech.defaultFPSCycle = mech.cycle
        }
        // if (!noTransition) {
        //   document.getElementById("health").style.transition = "width 0s ease-out"
        // } else {
        //   document.getElementById("health").style.transition = "width 1s ease-out"
        // }
    },
    hitMob(i, dmg) {
        //prevents damage happening too quick
    },
    buttonCD: 0, //cool down for player buttons
    drawLeg(stroke) {
        // if (simulation.mouseInGame.x > mech.pos.x) {
        if (mech.angle > -Math.PI / 2 && mech.angle < Math.PI / 2) {
            mech.flipLegs = 1;
        } else {
            mech.flipLegs = -1;
        }
        ctx.save();
        ctx.scale(mech.flipLegs, 1); //leg lines
        ctx.beginPath();
        ctx.moveTo(mech.hip.x, mech.hip.y);
        ctx.lineTo(mech.knee.x, mech.knee.y);
        ctx.lineTo(mech.foot.x, mech.foot.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 7;
        ctx.stroke();

        //toe lines
        ctx.beginPath();
        ctx.moveTo(mech.foot.x, mech.foot.y);
        ctx.lineTo(mech.foot.x - 15, mech.foot.y + 5);
        ctx.moveTo(mech.foot.x, mech.foot.y);
        ctx.lineTo(mech.foot.x + 15, mech.foot.y + 5);
        ctx.lineWidth = 4;
        ctx.stroke();

        //hip joint
        ctx.beginPath();
        ctx.arc(mech.hip.x, mech.hip.y, 11, 0, 2 * Math.PI);
        //knee joint
        ctx.moveTo(mech.knee.x + 7, mech.knee.y);
        ctx.arc(mech.knee.x, mech.knee.y, 7, 0, 2 * Math.PI);
        //foot joint
        ctx.moveTo(mech.foot.x + 6, mech.foot.y);
        ctx.arc(mech.foot.x, mech.foot.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = mech.fillColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    },
    calcLeg(cycle_offset, offset) {
        mech.hip.x = 12 + offset;
        mech.hip.y = 24 + offset;
        //stepSize goes to zero if Vx is zero or not on ground (make mech transition cleaner)
        mech.stepSize = 0.8 * mech.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(mech.Vx))) * mech.onGround);
        //changes to stepsize are smoothed by adding only a percent of the new value each cycle
        const stepAngle = 0.034 * mech.walk_cycle + cycle_offset;
        mech.foot.x = 2.2 * mech.stepSize * Math.cos(stepAngle) + offset;
        mech.foot.y = offset + 1.2 * mech.stepSize * Math.sin(stepAngle) + mech.yOff + mech.height;
        const Ymax = mech.yOff + mech.height;
        if (mech.foot.y > Ymax) mech.foot.y = Ymax;

        //calculate knee position as intersection of circle from hip and foot
        const d = Math.sqrt((mech.hip.x - mech.foot.x) * (mech.hip.x - mech.foot.x) + (mech.hip.y - mech.foot.y) * (mech.hip.y - mech.foot.y));
        const l = (mech.legLength1 * mech.legLength1 - mech.legLength2 * mech.legLength2 + d * d) / (2 * d);
        const h = Math.sqrt(mech.legLength1 * mech.legLength1 - l * l);
        mech.knee.x = (l / d) * (mech.foot.x - mech.hip.x) - (h / d) * (mech.foot.y - mech.hip.y) + mech.hip.x + offset;
        mech.knee.y = (l / d) * (mech.foot.y - mech.hip.y) + (h / d) * (mech.foot.x - mech.hip.x) + mech.hip.y;
    },
    draw() {
        ctx.fillStyle = mech.fillColor;
        mech.walk_cycle += mech.flipLegs * mech.Vx;

        //draw body
        ctx.save();
        ctx.globalAlpha = (mech.immuneCycle < mech.cycle) ? 1 : 0.7
        ctx.translate(mech.pos.x, mech.pos.y);
        mech.calcLeg(Math.PI, -3);
        mech.drawLeg("#4a4a4a");
        mech.calcLeg(0, 0);
        mech.drawLeg("#333");
        ctx.rotate(mech.angle);

        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        let grd = ctx.createLinearGradient(-30, 0, 30, 0);
        grd.addColorStop(0, mech.fillColorDark);
        grd.addColorStop(1, mech.fillColor);
        ctx.fillStyle = grd;
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
        mech.yOff = mech.yOff * 0.85 + mech.yOffGoal * 0.15; //smoothly move leg height towards height goal
    },
    // *********************************************
    // **************** fields *********************
    // *********************************************
    closest: {
        dist: 1000,
        index: 0
    },
    isHolding: false,
    isCloak: false,
    throwCharge: 0,
    fireCDcycle: 0,
    fieldCDcycle: 0,
    fieldMode: 0, //basic field mode before upgrades
    maxEnergy: 1, //can be increased by a tech
    holdingTarget: null,
    timeSkipLastCycle: 0,
    // these values are set on reset by setHoldDefaults()
    grabPowerUpRange2: 0,
    isFieldActive: false,
    fieldRange: 155,
    fieldShieldingScale: 1,
    fieldDamage: 1,
    duplicateChance: 0,
    energy: 0,
    fieldRegen: 0,
    fieldMode: 0,
    fieldFire: false,
    fieldHarmReduction: 1,
    holdingMassScale: 0,
    hole: {
        isOn: false,
        isReady: true,
        pos1: {
            x: 0,
            y: 0
        },
        pos2: {
            x: 0,
            y: 0
        },
    },
    fieldArc: 0,
    fieldThreshold: 0,
    calculateFieldThreshold() {
        mech.fieldThreshold = Math.cos(mech.fieldArc * Math.PI)
    },
    setHoldDefaults() {
        if (mech.energy < mech.maxEnergy) mech.energy = mech.maxEnergy;
        mech.fieldRegen = tech.energyRegen; //0.001
        mech.fieldMeterColor = "#0cf"
        mech.fieldShieldingScale = 1;
        mech.fieldBlockCD = 10;
        mech.fieldHarmReduction = 1;
        mech.fieldDamage = 1
        mech.duplicateChance = 0
        if (tech.duplicationChance() === 0) simulation.draw.powerUp = simulation.draw.powerUpNormal
        mech.grabPowerUpRange2 = 156000;
        mech.fieldRange = 155;
        mech.fieldFire = false;
        mech.fieldCDcycle = 0;
        mech.isCloak = false;
        player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
        mech.airSpeedLimit = 125
        mech.drop();
        mech.holdingMassScale = 0.5;
        mech.isFieldActive = false; //only being used by negative mass field
        mech.fieldArc = 0.2; //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        mech.calculateFieldThreshold(); //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        mech.isBodiesAsleep = true;
        mech.wakeCheck();
        mech.setMaxEnergy();
        mech.hole = {
            isOn: false,
            isReady: true,
            pos1: {
                x: 0,
                y: 0
            },
            pos2: {
                x: 0,
                y: 0
            },
        }
    },
    setMaxEnergy() {
        mech.maxEnergy = (tech.isMaxEnergyTech ? 0.5 : 1) + tech.bonusEnergy + tech.healMaxEnergyBonus
        simulation.makeTextLog(`<span class='color-var'>mech</span>.<span class='color-f'>maxEnergy</span> <span class='color-symbol'>=</span> ${(mech.maxEnergy.toFixed(2))}`)
    },
    fieldMeterColor: "#0cf",
    drawFieldMeter(bgColor = "rgba(0, 0, 0, 0.4)", range = 60) {
        if (mech.energy < mech.maxEnergy) {
            mech.energy += mech.fieldRegen;
            if (mech.energy < 0) mech.energy = 0
            ctx.fillStyle = bgColor;
            const xOff = mech.pos.x - mech.radius * mech.maxEnergy
            const yOff = mech.pos.y - 50
            ctx.fillRect(xOff, yOff, range * mech.maxEnergy, 10);
            ctx.fillStyle = mech.fieldMeterColor;
            ctx.fillRect(xOff, yOff, range * mech.energy, 10);
        } else if (mech.energy > mech.maxEnergy + 0.05) {
            ctx.fillStyle = bgColor;
            const xOff = mech.pos.x - mech.radius * mech.energy
            const yOff = mech.pos.y - 50
            // ctx.fillRect(xOff, yOff, range * mech.maxEnergy, 10);
            ctx.fillStyle = mech.fieldMeterColor;
            ctx.fillRect(xOff, yOff, range * mech.energy, 10);
        }
        // else {
        //   mech.energy = mech.maxEnergy
        // }
    },
    lookingAt(who) {
        //calculate a vector from body to player and make it length 1
        const diff = Vector.normalise(Vector.sub(who.position, mech.pos));
        //make a vector for the player's direction of length 1
        const dir = {
            x: Math.cos(mech.angle),
            y: Math.sin(mech.angle)
        };
        //the dot product of diff and dir will return how much over lap between the vectors
        // console.log(Vector.dot(dir, diff))
        if (Vector.dot(dir, diff) > mech.fieldThreshold) {
            return true;
        }
        return false;
    },
    drop() {
        if (mech.isHolding) {
            mech.fieldCDcycle = mech.cycle + 15;
            mech.isHolding = false;
            mech.throwCharge = 0;
            mech.definePlayerMass()
            if (mech.holdingTarget) {
                mech.holdingTarget.collisionFilter.category = cat.body;
                mech.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                mech.holdingTarget = null;
            }
        }
    },
    definePlayerMass(mass = mech.defaultMass) {
        Matter.Body.setMass(player, mass);
        //reduce air and ground move forces
        mech.Fx = 0.08 / mass * tech.squirrelFx //base player mass is 5
        mech.FxAir = 0.4 / mass / mass //base player mass is 5
        //make player stand a bit lower when holding heavy masses
        mech.yOffWhen.stand = Math.max(mech.yOffWhen.crouch, Math.min(49, 49 - (mass - 5) * 6))
        if (mech.onGround && !mech.crouch) mech.yOffGoal = mech.yOffWhen.stand;
    },
    drawHold(target, stroke = true) {
        if (target) {
            const eye = 15;
            const len = target.vertices.length - 1;
            ctx.fillStyle = "rgba(110,170,200," + (0.2 + 0.4 * Math.random()) + ")";
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000";
            ctx.beginPath();
            ctx.moveTo(
                mech.pos.x + eye * Math.cos(mech.angle),
                mech.pos.y + eye * Math.sin(mech.angle)
            );
            ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
            ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
            ctx.fill();
            if (stroke) ctx.stroke();
            for (let i = 0; i < len; i++) {
                ctx.beginPath();
                ctx.moveTo(
                    mech.pos.x + eye * Math.cos(mech.angle),
                    mech.pos.y + eye * Math.sin(mech.angle)
                );
                ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
                ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
                ctx.fill();
                if (stroke) ctx.stroke();
            }
        }
    },
    holding() {
        if (mech.fireCDcycle < mech.cycle) mech.fireCDcycle = mech.cycle - 1
        if (mech.holdingTarget) {
            mech.energy -= mech.fieldRegen;
            if (mech.energy < 0) mech.energy = 0;
            Matter.Body.setPosition(mech.holdingTarget, {
                x: mech.pos.x + 70 * Math.cos(mech.angle),
                y: mech.pos.y + 70 * Math.sin(mech.angle)
            });
            Matter.Body.setVelocity(mech.holdingTarget, player.velocity);
            Matter.Body.rotate(mech.holdingTarget, 0.01 / mech.holdingTarget.mass); //gently spin the block
        } else {
            mech.isHolding = false
        }
    },
    throwBlock() {
        if (mech.holdingTarget) {
            if (input.field) {
                if (mech.energy > 0.001) {
                    if (mech.fireCDcycle < mech.cycle) mech.fireCDcycle = mech.cycle
                    mech.energy -= 0.001 / tech.throwChargeRate;
                    mech.throwCharge += 0.5 * tech.throwChargeRate / mech.holdingTarget.mass
                    //draw charge
                    const x = mech.pos.x + 15 * Math.cos(mech.angle);
                    const y = mech.pos.y + 15 * Math.sin(mech.angle);
                    const len = mech.holdingTarget.vertices.length - 1;
                    const edge = mech.throwCharge * mech.throwCharge * mech.throwCharge;
                    const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
                    grd.addColorStop(0, "rgba(255,50,150,0.3)");
                    grd.addColorStop(1, "transparent");
                    ctx.fillStyle = grd;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(mech.holdingTarget.vertices[len].x, mech.holdingTarget.vertices[len].y);
                    ctx.lineTo(mech.holdingTarget.vertices[0].x, mech.holdingTarget.vertices[0].y);
                    ctx.fill();
                    for (let i = 0; i < len; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(mech.holdingTarget.vertices[i].x, mech.holdingTarget.vertices[i].y);
                        ctx.lineTo(mech.holdingTarget.vertices[i + 1].x, mech.holdingTarget.vertices[i + 1].y);
                        ctx.fill();
                    }
                } else {
                    mech.drop()
                }
            } else if (mech.throwCharge > 0) { //Matter.Query.region(mob, player.bounds)
                //throw the body
                mech.fieldCDcycle = mech.cycle + 15;
                mech.isHolding = false;
                //bullet-like collisions
                mech.holdingTarget.collisionFilter.category = cat.body; //cat.bullet;
                mech.holdingTarget.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield;
                //check every second to see if player is away from thrown body, and make solid
                const solid = function(that) {
                    const dx = that.position.x - player.position.x;
                    const dy = that.position.y - player.position.y;
                    if (dx * dx + dy * dy > 10000 && that !== mech.holdingTarget) {
                        // that.collisionFilter.category = cat.body; //make solid
                        that.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet; //can hit player now
                    } else {
                        setTimeout(solid, 25, that);
                    }
                };
                setTimeout(solid, 150, mech.holdingTarget);

                const charge = Math.min(mech.throwCharge / 5, 1)
                //***** scale throw speed with the first number, 80 *****
                let speed = 80 * charge * Math.min(1, 0.8 / Math.pow(mech.holdingTarget.mass, 0.25));

                if (Matter.Query.collides(mech.holdingTarget, map).length !== 0) {
                    speed *= 0.7 //drop speed by 30% if touching map
                    if (Matter.Query.ray(map, mech.holdingTarget.position, mech.pos).length !== 0) speed = 0 //drop to zero if the center of the block can't see the center of the player through the map
                    //|| Matter.Query.ray(body, mech.holdingTarget.position, mech.pos).length > 1
                }

                mech.throwCharge = 0;
                Matter.Body.setVelocity(mech.holdingTarget, {
                    x: player.velocity.x * 0.5 + Math.cos(mech.angle) * speed,
                    y: player.velocity.y * 0.5 + Math.sin(mech.angle) * speed
                });
                //player recoil //stronger in x-dir to prevent jump hacking

                Matter.Body.setVelocity(player, {
                    x: player.velocity.x - Math.cos(mech.angle) * speed / (mech.crouch ? 30 : 10) * Math.sqrt(mech.holdingTarget.mass),
                    y: player.velocity.y - Math.sin(mech.angle) * speed / 30 * Math.sqrt(mech.holdingTarget.mass)
                });
                mech.definePlayerMass() //return to normal player mass
            }
        } else {
            mech.isHolding = false
        }
    },
    drawField() {
        if (mech.holdingTarget) {
            ctx.fillStyle = "rgba(110,170,200," + (mech.energy * (0.05 + 0.05 * Math.random())) + ")";
            ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
        } else {
            ctx.fillStyle = "rgba(110,170,200," + (0.02 + mech.energy * (0.15 + 0.15 * Math.random())) + ")";
            ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
        }
        // const off = 2 * Math.cos(simulation.cycle * 0.1)
        const range = mech.fieldRange;
        ctx.beginPath();
        ctx.arc(mech.pos.x, mech.pos.y, range, mech.angle - Math.PI * mech.fieldArc, mech.angle + Math.PI * mech.fieldArc, false);
        ctx.lineWidth = 2;
        ctx.lineCap = "butt"
        ctx.stroke();
        let eye = 13;
        let aMag = 0.75 * Math.PI * mech.fieldArc
        let a = mech.angle + aMag
        let cp1x = mech.pos.x + 0.6 * range * Math.cos(a)
        let cp1y = mech.pos.y + 0.6 * range * Math.sin(a)
        ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + eye * Math.cos(mech.angle), mech.pos.y + eye * Math.sin(mech.angle))
        a = mech.angle - aMag
        cp1x = mech.pos.x + 0.6 * range * Math.cos(a)
        cp1y = mech.pos.y + 0.6 * range * Math.sin(a)
        ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + 1 * range * Math.cos(mech.angle - Math.PI * mech.fieldArc), mech.pos.y + 1 * range * Math.sin(mech.angle - Math.PI * mech.fieldArc))
        ctx.fill();
        // ctx.lineTo(mech.pos.x + eye * Math.cos(mech.angle), mech.pos.y + eye * Math.sin(mech.angle));

        //draw random lines in field for cool effect
        let offAngle = mech.angle + 1.7 * Math.PI * mech.fieldArc * (Math.random() - 0.5);
        ctx.beginPath();
        eye = 15;
        ctx.moveTo(mech.pos.x + eye * Math.cos(mech.angle), mech.pos.y + eye * Math.sin(mech.angle));
        ctx.lineTo(mech.pos.x + range * Math.cos(offAngle), mech.pos.y + range * Math.sin(offAngle));
        ctx.strokeStyle = "rgba(120,170,255,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
    },
    grabPowerUp() { //look for power ups to grab with field
        if (mech.fireCDcycle < mech.cycle) mech.fireCDcycle = mech.cycle - 1
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            const dxP = mech.pos.x - powerUp[i].position.x;
            const dyP = mech.pos.y - powerUp[i].position.y;
            const dist2 = dxP * dxP + dyP * dyP;
            // float towards player  if looking at and in range  or  if very close to player
            if (dist2 < mech.grabPowerUpRange2 &&
                (mech.lookingAt(powerUp[i]) || dist2 < 16000) &&
                !(mech.health === mech.maxHealth && powerUp[i].name === "heal") &&
                Matter.Query.ray(map, powerUp[i].position, mech.pos).length === 0
            ) {
                powerUp[i].force.x += 0.05 * (dxP / Math.sqrt(dist2)) * powerUp[i].mass;
                powerUp[i].force.y += 0.05 * (dyP / Math.sqrt(dist2)) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                //extra friction
                Matter.Body.setVelocity(powerUp[i], {
                    x: powerUp[i].velocity.x * 0.11,
                    y: powerUp[i].velocity.y * 0.11
                });
                if (dist2 < 5000 && !simulation.isChoosing) { //use power up if it is close enough
                    powerUps.onPickUp(powerUp[i]);
                    Matter.Body.setVelocity(player, { //player knock back, after grabbing power up
                        x: player.velocity.x + powerUp[i].velocity.x / player.mass * 5,
                        y: player.velocity.y + powerUp[i].velocity.y / player.mass * 5
                    });
                    powerUp[i].effect();
                    Matter.World.remove(engine.world, powerUp[i]);
                    powerUp.splice(i, 1);
                    return; //because the array order is messed up after splice
                }
            }
        }
    },
    pushMass(who) {
        const speed = Vector.magnitude(Vector.sub(who.velocity, player.velocity))
        const fieldBlockCost = (0.03 + Math.sqrt(who.mass) * speed * 0.003) * mech.fieldShieldingScale;
        const unit = Vector.normalise(Vector.sub(player.position, who.position))

        if (mech.energy > fieldBlockCost * 0.2) { //shield needs at least some of the cost to block
            mech.energy -= fieldBlockCost
            if (mech.energy < 0) {
                mech.energy = 0;
            }
            // if (mech.energy > mech.maxEnergy) mech.energy = mech.maxEnergy;

            if (tech.blockDmg) {
                who.damage(tech.blockDmg * b.dmgScale)
                //draw electricity
                const step = 40
                ctx.beginPath();
                for (let i = 0, len = 2.5 * tech.blockDmg; i < len; i++) {
                    let x = mech.pos.x - 20 * unit.x;
                    let y = mech.pos.y - 20 * unit.y;
                    ctx.moveTo(x, y);
                    for (let i = 0; i < 8; i++) {
                        x += step * (-unit.x + 1.5 * (Math.random() - 0.5))
                        y += step * (-unit.y + 1.5 * (Math.random() - 0.5))
                        ctx.lineTo(x, y);
                    }
                }
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#f0f";
                ctx.stroke();
            } else {
                mech.drawHold(who);
            }
            // if (tech.isFreezeMobs) mobs.statusSlow(who, 60) //this works but doesn't have a fun effect

            // mech.holdingTarget = null
            //knock backs
            if (mech.fieldShieldingScale > 0) {
                const massRoot = Math.sqrt(Math.min(12, Math.max(0.15, who.mass))); // masses above 12 can start to overcome the push back
                Matter.Body.setVelocity(who, {
                    x: player.velocity.x - (15 * unit.x) / massRoot,
                    y: player.velocity.y - (15 * unit.y) / massRoot
                });
                mech.fieldCDcycle = mech.cycle + mech.fieldBlockCD;
                if (mech.crouch) {
                    Matter.Body.setVelocity(player, {
                        x: player.velocity.x + 0.4 * unit.x * massRoot,
                        y: player.velocity.y + 0.4 * unit.y * massRoot
                    });
                } else {
                    Matter.Body.setVelocity(player, {
                        x: player.velocity.x + 5 * unit.x * massRoot,
                        y: player.velocity.y + 5 * unit.y * massRoot
                    });
                }
            } else {
                if (tech.isStunField && mech.fieldUpgrades[mech.fieldMode].name === "perfect diamagnetism") mobs.statusStun(who, tech.isStunField)
                // mobs.statusSlow(who, tech.isStunField)
                const massRoot = Math.sqrt(Math.max(0.15, who.mass)); // masses above 12 can start to overcome the push back
                Matter.Body.setVelocity(who, {
                    x: player.velocity.x - (20 * unit.x) / massRoot,
                    y: player.velocity.y - (20 * unit.y) / massRoot
                });
                if (who.dropPowerUp && player.speed < 12) {
                    const massRootCap = Math.sqrt(Math.min(10, Math.max(0.4, who.mass))); // masses above 12 can start to overcome the push back
                    Matter.Body.setVelocity(player, {
                        x: 0.9 * player.velocity.x + 0.6 * unit.x * massRootCap,
                        y: 0.9 * player.velocity.y + 0.6 * unit.y * massRootCap
                    });
                }
            }
        }
    },
    pushMobsFacing() { // find mobs in range and in direction looking
        for (let i = 0, len = mob.length; i < len; ++i) {
            if (
                Vector.magnitude(Vector.sub(mob[i].position, player.position)) - mob[i].radius < mech.fieldRange &&
                mech.lookingAt(mob[i]) &&
                Matter.Query.ray(map, mob[i].position, mech.pos).length === 0
            ) {
                mob[i].locatePlayer();
                mech.pushMass(mob[i]);
            }
        }
    },
    pushMobs360(range = mech.fieldRange * 0.75) { // find mobs in range in any direction
        for (let i = 0, len = mob.length; i < len; ++i) {
            if (
                Vector.magnitude(Vector.sub(mob[i].position, mech.pos)) < range &&
                Matter.Query.ray(map, mob[i].position, mech.pos).length === 0
            ) {
                mob[i].locatePlayer();
                mech.pushMass(mob[i]);
            }
        }
    },
    lookForPickUp() { //find body to pickup
        if (mech.energy > mech.fieldRegen) mech.energy -= mech.fieldRegen;
        const grabbing = {
            targetIndex: null,
            targetRange: 150,
            // lookingAt: false //false to pick up object in range, but not looking at
        };
        for (let i = 0, len = body.length; i < len; ++i) {
            if (Matter.Query.ray(map, body[i].position, mech.pos).length === 0) {
                //is mech next body a better target then my current best
                const dist = Vector.magnitude(Vector.sub(body[i].position, mech.pos));
                const looking = mech.lookingAt(body[i]);
                // if (dist < grabbing.targetRange && (looking || !grabbing.lookingAt) && !body[i].isNotHoldable) {
                if (dist < grabbing.targetRange && looking && !body[i].isNotHoldable) {
                    grabbing.targetRange = dist;
                    grabbing.targetIndex = i;
                    // grabbing.lookingAt = looking;
                }
            }
        }
        // set pick up target for when mouse is released
        if (body[grabbing.targetIndex]) {
            mech.holdingTarget = body[grabbing.targetIndex];
            //
            ctx.beginPath(); //draw on each valid body
            let vertices = mech.holdingTarget.vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            ctx.lineTo(vertices[0].x, vertices[0].y);
            ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
            ctx.fill();

            ctx.globalAlpha = 0.2;
            mech.drawHold(mech.holdingTarget);
            ctx.globalAlpha = 1;
        } else {
            mech.holdingTarget = null;
        }
    },
    pickUp() {
        //triggers when a hold target exits and field button is released
        mech.isHolding = true;
        //conserve momentum when player mass changes
        totalMomentum = Vector.add(Vector.mult(player.velocity, player.mass), Vector.mult(mech.holdingTarget.velocity, mech.holdingTarget.mass))
        Matter.Body.setVelocity(player, Vector.mult(totalMomentum, 1 / (mech.defaultMass + mech.holdingTarget.mass)));

        mech.definePlayerMass(mech.defaultMass + mech.holdingTarget.mass * mech.holdingMassScale)
        //make block collide with nothing
        mech.holdingTarget.collisionFilter.category = 0;
        mech.holdingTarget.collisionFilter.mask = 0;
    },
    wakeCheck() {
        if (mech.isBodiesAsleep) {
            mech.isBodiesAsleep = false;

            function wake(who) {
                for (let i = 0, len = who.length; i < len; ++i) {
                    Matter.Sleeping.set(who[i], false)
                    if (who[i].storeVelocity) {
                        Matter.Body.setVelocity(who[i], {
                            x: who[i].storeVelocity.x,
                            y: who[i].storeVelocity.y
                        })
                        Matter.Body.setAngularVelocity(who[i], who[i].storeAngularVelocity)
                    }
                }
            }
            if (tech.isFreezeMobs) {
                for (let i = 0, len = mob.length; i < len; ++i) {
                    Matter.Sleeping.set(mob[i], false)
                    mobs.statusSlow(mob[i], 60)
                }
            } else {
                wake(mob);
            }
            wake(body);
            wake(bullet);
            for (let i = 0, len = cons.length; i < len; i++) {
                if (cons[i].stiffness === 0) {
                    cons[i].stiffness = cons[i].storeStiffness
                }
            }
            // wake(powerUp);
        }
    },
    hold() {},
    setField(index) {
        if (isNaN(index)) { //find index by name
            let found = false
            for (let i = 0; i < mech.fieldUpgrades.length; i++) {
                if (index === mech.fieldUpgrades[i].name) {
                    index = i;
                    found = true;
                    break;
                }
            }
            if (!found) return //if you can't find the field don't give a field to avoid game crash
        }
        mech.fieldMode = index;
        document.getElementById("field").innerHTML = mech.fieldUpgrades[index].name
        mech.setHoldDefaults();
        mech.fieldUpgrades[index].effect();
    },
    fieldUpgrades: [{
            name: "field emitter",
            description: "use <strong class='color-f'>energy</strong> to <strong>block</strong> mobs,<br><strong>grab</strong> power ups, and <strong>throw</strong> blocks",
            effect: () => {
                mech.hold = function() {
                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if ((input.field && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                        if (mech.energy > 0.05) {
                            mech.drawField();
                            mech.pushMobsFacing();
                        }
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.pickUp();
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    mech.drawFieldMeter()
                }
            }
        },
        {
            name: "standing wave harmonics",
            description: "<strong>3</strong> oscillating <strong>shields</strong> are permanently active<br><strong>blocking</strong> drains <strong class='color-f'>energy</strong> with no <strong>cool down</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>15%</strong>",
            effect: () => {
                // mech.fieldHarmReduction = 0.80;
                mech.fieldBlockCD = 0;
                mech.fieldHarmReduction = 0.85;
                mech.hold = function() {
                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if ((input.field) && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.pickUp();
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    if (mech.energy > 0.1 && mech.fieldCDcycle < mech.cycle) {
                        const fieldRange1 = (0.7 + 0.3 * Math.sin(mech.cycle / 23)) * mech.fieldRange
                        const fieldRange2 = (0.63 + 0.37 * Math.sin(mech.cycle / 37)) * mech.fieldRange
                        const fieldRange3 = (0.65 + 0.35 * Math.sin(mech.cycle / 47)) * mech.fieldRange
                        const netfieldRange = Math.max(fieldRange1, fieldRange2, fieldRange3)
                        ctx.fillStyle = "rgba(110,170,200," + (0.04 + mech.energy * (0.12 + 0.13 * Math.random())) + ")";
                        ctx.beginPath();
                        ctx.arc(mech.pos.x, mech.pos.y, fieldRange1, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(mech.pos.x, mech.pos.y, fieldRange2, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.arc(mech.pos.x, mech.pos.y, fieldRange3, 0, 2 * Math.PI);
                        ctx.fill();
                        mech.pushMobs360(netfieldRange);
                        // mech.pushBody360(netfieldRange);  //can't throw block when pushhing blocks away
                    }
                    mech.drawFieldMeter()
                }
            }
        },
        {
            name: "perfect diamagnetism",
            // description: "gain <strong class='color-f'>energy</strong> when <strong>blocking</strong><br>no <strong>recoil</strong> when <strong>blocking</strong>",
            description: "<strong>blocking</strong> does not drain <strong class='color-f'>energy</strong><br><strong>blocking</strong> has no <strong>cool down</strong> and less <strong>recoil</strong><br><strong>attract</strong> power ups from <strong>far away</strong>",
            effect: () => {
                mech.fieldShieldingScale = 0;
                mech.grabPowerUpRange2 = 10000000
                mech.hold = function() {
                    const wave = Math.sin(mech.cycle * 0.022);
                    mech.fieldRange = 170 + 12 * wave
                    mech.fieldArc = 0.33 + 0.045 * wave //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
                    mech.calculateFieldThreshold();
                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if ((input.field && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                        if (mech.energy > 0.05) {
                            //draw field
                            if (mech.holdingTarget) {
                                ctx.fillStyle = "rgba(110,170,200," + (0.06 + 0.03 * Math.random()) + ")";
                                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.35 + 0.05 * Math.random()) + ")"
                            } else {
                                ctx.fillStyle = "rgba(110,170,200," + (0.27 + 0.2 * Math.random() - 0.1 * wave) + ")";
                                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.4 + 0.5 * Math.random()) + ")"
                            }
                            ctx.beginPath();
                            ctx.arc(mech.pos.x, mech.pos.y, mech.fieldRange, mech.angle - Math.PI * mech.fieldArc, mech.angle + Math.PI * mech.fieldArc, false);
                            ctx.lineWidth = 2.5 - 1.5 * wave;
                            ctx.lineCap = "butt"
                            ctx.stroke();
                            const curve = 0.57 + 0.04 * wave
                            const aMag = (1 - curve * 1.2) * Math.PI * mech.fieldArc
                            let a = mech.angle + aMag
                            let cp1x = mech.pos.x + curve * mech.fieldRange * Math.cos(a)
                            let cp1y = mech.pos.y + curve * mech.fieldRange * Math.sin(a)
                            ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle))
                            a = mech.angle - aMag
                            cp1x = mech.pos.x + curve * mech.fieldRange * Math.cos(a)
                            cp1y = mech.pos.y + curve * mech.fieldRange * Math.sin(a)
                            ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + 1 * mech.fieldRange * Math.cos(mech.angle - Math.PI * mech.fieldArc), mech.pos.y + 1 * mech.fieldRange * Math.sin(mech.angle - Math.PI * mech.fieldArc))
                            ctx.fill();
                            mech.pushMobsFacing();
                        }
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.pickUp();
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    mech.drawFieldMeter()

                    if (tech.isPerfectBrake) { //cap mob speed around player
                        const range = 160 + 140 * wave + 150 * mech.energy
                        for (let i = 0; i < mob.length; i++) {
                            const distance = Vector.magnitude(Vector.sub(mech.pos, mob[i].position))
                            if (distance < range) {
                                const cap = mob[i].isShielded ? 8.5 : 4.5
                                if (mob[i].speed > cap && Vector.dot(mob[i].velocity, Vector.sub(mech.pos, mob[i].position)) > 0) { // if velocity is directed towards player
                                    Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(mob[i].velocity), cap)); //set velocity to cap, but keep the direction
                                }
                            }
                        }
                        ctx.beginPath();
                        ctx.arc(mech.pos.x, mech.pos.y, range, 0, 2 * Math.PI);
                        ctx.fillStyle = "hsla(200,50%,61%,0.08)";
                        ctx.fill();
                    }
                }
            }
        },
        {
            name: "nano-scale manufacturing",
            description: "use <strong class='color-f'>energy</strong> to <strong>block</strong> mobs<br>excess <strong class='color-f'>energy</strong> used to build <strong>drones</strong><br><strong>double</strong> your default <strong class='color-f'>energy</strong> regeneration",
            effect: () => {
                mech.hold = function() {
                    if (mech.energy > mech.maxEnergy - 0.02 && mech.fieldCDcycle < mech.cycle && !input.field && bullet.length < 200) {
                        if (tech.isSporeField) {
                            // const len = Math.floor(5 + 4 * Math.random())
                            const len = Math.ceil(mech.energy * 10)
                            mech.energy = 0;
                            for (let i = 0; i < len; i++) b.spore(mech.pos)
                        } else if (tech.isMissileField) {
                            mech.energy -= 0.5;
                            b.missile({ x: mech.pos.x, y: mech.pos.y - 40 }, -Math.PI / 2, 0, 1)
                        } else if (tech.isIceField) {
                            mech.energy -= 0.057;
                            b.iceIX(1)
                        } else {
                            mech.energy -= 0.45;
                            b.drone(1)
                        }
                    }

                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if ((input.field && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                        if (mech.energy > 0.05) {
                            mech.drawField();
                            mech.pushMobsFacing();
                        }
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.pickUp();
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    mech.energy += mech.fieldRegen;
                    mech.drawFieldMeter()
                }
            }
        },
        {
            name: "negative mass field",
            description: "use <strong class='color-f'>energy</strong> to nullify &nbsp;<strong style='letter-spacing: 7px;'>gravity</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>45%</strong><br><strong>blocks</strong> held by the field have a lower <strong>mass</strong>",
            fieldDrawRadius: 0,
            effect: () => {
                mech.fieldFire = true;
                mech.holdingMassScale = 0.03; //can hold heavier blocks with lower cost to jumping
                mech.fieldMeterColor = "#000"
                mech.fieldHarmReduction = 0.55;
                mech.fieldDrawRadius = 0;

                mech.hold = function() {
                    mech.airSpeedLimit = 125 //5 * player.mass * player.mass
                    mech.FxAir = 0.016
                    mech.isFieldActive = false;
                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if (input.field && mech.fieldCDcycle < mech.cycle) { //push away
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                        const DRAIN = 0.00035
                        if (mech.energy > DRAIN) {
                            mech.isFieldActive = true; //used with tech.isHarmReduce
                            mech.airSpeedLimit = 400 // 7* player.mass * player.mass
                            mech.FxAir = 0.005
                            // mech.pushMobs360();

                            //repulse mobs
                            // for (let i = 0, len = mob.length; i < len; ++i) {
                            //   sub = Vector.sub(mob[i].position, mech.pos);
                            //   dist2 = Vector.magnitudeSquared(sub);
                            //   if (dist2 < this.fieldDrawRadius * this.fieldDrawRadius && mob[i].speed > 6) {
                            //     const force = Vector.mult(Vector.perp(Vector.normalise(sub)), 0.00004 * mob[i].speed * mob[i].mass)
                            //     mob[i].force.x = force.x
                            //     mob[i].force.y = force.y
                            //   }
                            // }
                            //look for nearby objects to make zero-g
                            function zeroG(who, range, mag = 1.06) {
                                for (let i = 0, len = who.length; i < len; ++i) {
                                    sub = Vector.sub(who[i].position, mech.pos);
                                    dist = Vector.magnitude(sub);
                                    if (dist < range) {
                                        who[i].force.y -= who[i].mass * (simulation.g * mag); //add a bit more then standard gravity
                                    }
                                }
                            }
                            // zeroG(bullet);  //works fine, but not that noticeable and maybe not worth the possible performance hit
                            // zeroG(mob);  //mobs are too irregular to make this work?

                            if (input.down) { //down
                                player.force.y -= 0.5 * player.mass * simulation.g;
                                this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 400 * 0.03;
                                zeroG(powerUp, this.fieldDrawRadius, 0.7);
                                zeroG(body, this.fieldDrawRadius, 0.7);
                            } else if (input.up) { //up
                                mech.energy -= 5 * DRAIN;
                                this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 850 * 0.03;
                                player.force.y -= 1.45 * player.mass * simulation.g;
                                zeroG(powerUp, this.fieldDrawRadius, 1.38);
                                zeroG(body, this.fieldDrawRadius, 1.38);
                            } else {
                                mech.energy -= DRAIN;
                                this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 650 * 0.03;
                                player.force.y -= 1.07 * player.mass * simulation.g; // slow upward drift
                                zeroG(powerUp, this.fieldDrawRadius);
                                zeroG(body, this.fieldDrawRadius);
                            }
                            if (mech.energy < 0.001) {
                                mech.fieldCDcycle = mech.cycle + 120;
                                mech.energy = 0;
                            }
                            //add extra friction for horizontal motion
                            if (input.down || input.up || input.left || input.right) {
                                Matter.Body.setVelocity(player, {
                                    x: player.velocity.x * 0.99,
                                    y: player.velocity.y * 0.98
                                });
                            } else { //slow rise and fall
                                Matter.Body.setVelocity(player, {
                                    x: player.velocity.x * 0.99,
                                    y: player.velocity.y * 0.98
                                });
                            }
                            if (tech.isFreezeMobs) {
                                const ICE_DRAIN = 0.0005
                                for (let i = 0, len = mob.length; i < len; i++) {
                                    if (((mob[i].distanceToPlayer() + mob[i].radius) < this.fieldDrawRadius) && !mob[i].shield && !mob[i].isShielded) {
                                        if (mech.energy > ICE_DRAIN * 2) {
                                            mech.energy -= ICE_DRAIN;
                                            this.fieldDrawRadius -= 2;
                                            mobs.statusSlow(mob[i], 45)
                                        } else {
                                            break;
                                        }
                                    }
                                }
                            }

                            //draw zero-G range
                            ctx.beginPath();
                            ctx.arc(mech.pos.x, mech.pos.y, this.fieldDrawRadius, 0, 2 * Math.PI);
                            ctx.fillStyle = "#f5f5ff";
                            ctx.globalCompositeOperation = "difference";
                            ctx.fill();
                            ctx.globalCompositeOperation = "source-over";
                        }
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.pickUp();
                        this.fieldDrawRadius = 0
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                        this.fieldDrawRadius = 0
                    }
                    mech.drawFieldMeter("rgba(0,0,0,0.2)")
                }
            }
        },
        {
            name: "plasma torch",
            description: "use <strong class='color-f'>energy</strong> to emit short range <strong class='color-plasma'>plasma</strong><br><strong class='color-d'>damages</strong> and <strong>pushes</strong> mobs away",
            effect() {
                mech.fieldMeterColor = "#f0f"
                mech.hold = function() {
                    b.isExtruderOn = false
                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if (input.field && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                        if (tech.isExtruder) {
                            b.extruder();
                        } else {
                            b.plasma();
                        }
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.pickUp();
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    mech.drawFieldMeter("rgba(0, 0, 0, 0.2)")

                    if (tech.isExtruder) {
                        if (input.field) {
                            b.wasExtruderOn = true
                        } else {
                            b.wasExtruderOn = false
                            b.canExtruderFire = true
                        }
                        ctx.lineWidth = 5;
                        ctx.strokeStyle = "#f07"
                        ctx.beginPath(); //draw all the wave bullets
                        for (let i = 0, len = bullet.length; i < len; i++) {
                            if (bullet[i].isWave) {
                                if (bullet[i].isBranch) {
                                    ctx.stroke();
                                    ctx.beginPath(); //draw all the wave bullets
                                } else {
                                    ctx.lineTo(bullet[i].position.x, bullet[i].position.y)
                                }
                            }
                        }
                        if (b.wasExtruderOn && b.isExtruderOn) ctx.lineTo(mech.pos.x + 15 * Math.cos(mech.angle), mech.pos.y + 15 * Math.sin(mech.angle))
                        ctx.stroke();
                    }
                }
            }
        },
        {
            name: "time dilation field",
            description: "use <strong class='color-f'>energy</strong> to <strong style='letter-spacing: 1px;'>stop time</strong><br><strong>move</strong> and <strong>fire</strong> while time is stopped",
            effect: () => {
                // mech.fieldMeterColor = "#000"
                mech.fieldFire = true;
                mech.isBodiesAsleep = false;
                mech.hold = function() {
                    if (mech.isHolding) {
                        mech.wakeCheck();
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if (input.field && mech.fieldCDcycle < mech.cycle) {
                        mech.grabPowerUp();
                        mech.lookForPickUp(180);

                        const DRAIN = 0.0013
                        if (mech.energy > DRAIN) {
                            mech.energy -= DRAIN;
                            if (mech.energy < DRAIN) {
                                mech.fieldCDcycle = mech.cycle + 120;
                                mech.energy = 0;
                                mech.wakeCheck();
                            }
                            //draw field everywhere
                            ctx.globalCompositeOperation = "saturation"
                            ctx.fillStyle = "#ccc";
                            ctx.fillRect(-100000, -100000, 200000, 200000)
                            ctx.globalCompositeOperation = "source-over"
                            //stop time
                            mech.isBodiesAsleep = true;

                            function sleep(who) {
                                for (let i = 0, len = who.length; i < len; ++i) {
                                    if (!who[i].isSleeping) {
                                        who[i].storeVelocity = who[i].velocity
                                        who[i].storeAngularVelocity = who[i].angularVelocity
                                    }
                                    Matter.Sleeping.set(who[i], true)
                                }
                            }
                            sleep(mob);
                            sleep(body);
                            sleep(bullet);
                            //doesn't really work, just slows down constraints
                            for (let i = 0, len = cons.length; i < len; i++) {
                                if (cons[i].stiffness !== 0) {
                                    cons[i].storeStiffness = cons[i].stiffness;
                                    cons[i].stiffness = 0;
                                }
                            }

                            simulation.cycle--; //pause all functions that depend on game cycle increasing
                            if (tech.isTimeSkip) {
                                mech.immuneCycle = mech.cycle + 10;
                                simulation.isTimeSkipping = true;
                                mech.cycle++;
                                simulation.gravity();
                                Engine.update(engine, simulation.delta);
                                // level.checkZones();
                                // level.checkQuery();
                                mech.move();
                                simulation.checks();
                                // mobs.loop();
                                // mech.draw();
                                mech.walk_cycle += mech.flipLegs * mech.Vx;
                                // mech.hold();
                                // mech.energy += DRAIN; // 1 to undo the energy drain from time speed up, 0.5 to cut energy drain in half
                                b.fire();
                                // b.bulletRemove();
                                b.bulletDo();
                                simulation.isTimeSkipping = false;
                            }
                            // simulation.cycle--; //pause all functions that depend on game cycle increasing
                            // if (tech.isTimeSkip && !simulation.isTimeSkipping) { //speed up the rate of time
                            //   simulation.timeSkip(1)
                            //   mech.energy += 1.5 * DRAIN; //x1 to undo the energy drain from time speed up, x1.5 to cut energy drain in half
                            // }
                        }
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                        mech.wakeCheck();
                        mech.pickUp();
                    } else {
                        mech.wakeCheck();
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    mech.drawFieldMeter()
                }
            }
        },
        {
            name: "metamaterial cloaking", //"weak photonic coupling" "electromagnetically induced transparency" "optical non-coupling" "slow light field" "electro-optic transparency"
            description: "<strong class='color-cloaked'>cloak</strong> after not using your gun or field<br>while <strong class='color-cloaked'>cloaked</strong> mobs can't see you<br>increase <strong class='color-d'>damage</strong> by <strong>133%</strong>",
            effect: () => {
                mech.fieldFire = true;
                mech.fieldMeterColor = "#fff";
                mech.fieldPhase = 0;
                mech.isCloak = false
                mech.fieldDamage = 2.33 // 1 + 111/100
                mech.fieldDrawRadius = 0
                const drawRadius = 1000

                mech.hold = function() {
                    if (mech.isHolding) {
                        mech.drawHold(mech.holdingTarget);
                        mech.holding();
                        mech.throwBlock();
                    } else if (input.field && mech.fieldCDcycle < mech.cycle) { //not hold and field button is pressed
                        mech.grabPowerUp();
                        mech.lookForPickUp();
                    } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding target exists, and field button is not pressed
                        mech.pickUp();
                    } else {
                        mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }

                    //120 cycles after shooting (or using field) enable cloak
                    if (mech.energy < 0.05 && mech.fireCDcycle < mech.cycle && !input.fire) mech.fireCDcycle = mech.cycle
                    if (mech.fireCDcycle + 50 < mech.cycle) {
                        if (!mech.isCloak) {
                            mech.isCloak = true //enter cloak
                            if (tech.isIntangible) {
                                for (let i = 0; i < bullet.length; i++) {
                                    if (bullet[i].botType && bullet[i].botType !== "orbit") bullet[i].collisionFilter.mask = cat.map | cat.bullet | cat.mobBullet | cat.mobShield
                                }
                            }
                        }
                    } else if (mech.isCloak) { //exit cloak
                        mech.isCloak = false
                        if (tech.isIntangible) {
                            for (let i = 0; i < bullet.length; i++) {
                                if (bullet[i].botType && bullet[i].botType !== "orbit") bullet[i].collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
                            }
                        }
                        if (tech.isCloakStun) { //stun nearby mobs after exiting cloak
                            let isMobsAround = false
                            const stunRange = mech.fieldDrawRadius * 1.15
                            const drain = 0.3 * mech.energy
                            for (let i = 0, len = mob.length; i < len; ++i) {
                                if (
                                    Vector.magnitude(Vector.sub(mob[i].position, mech.pos)) < stunRange &&
                                    Matter.Query.ray(map, mob[i].position, mech.pos).length === 0
                                ) {
                                    isMobsAround = true
                                    mobs.statusStun(mob[i], 30 + drain * 300)
                                }
                            }
                            if (isMobsAround && mech.energy > drain) {
                                mech.energy -= drain
                                simulation.drawList.push({
                                    x: mech.pos.x,
                                    y: mech.pos.y,
                                    radius: stunRange,
                                    color: "hsla(0,50%,100%,0.6)",
                                    time: 4
                                });
                                // ctx.beginPath();
                                // ctx.arc(mech.pos.x, mech.pos.y, 800, 0, 2 * Math.PI);
                                // ctx.fillStyle = "#000"
                                // ctx.fill();
                            }
                        }
                    }

                    function drawField() {
                        mech.fieldPhase += 0.007 + 0.07 * (1 - energy)
                        const wiggle = 0.15 * Math.sin(mech.fieldPhase * 0.5)
                        ctx.beginPath();
                        ctx.ellipse(mech.pos.x, mech.pos.y, mech.fieldDrawRadius * (1 - wiggle), mech.fieldDrawRadius * (1 + wiggle), mech.fieldPhase, 0, 2 * Math.PI);
                        if (mech.fireCDcycle > mech.cycle && (input.field)) {
                            ctx.lineWidth = 5;
                            ctx.strokeStyle = `rgba(0, 204, 255,1)`
                            ctx.stroke()
                        }
                        ctx.fillStyle = "#fff" //`rgba(0,0,0,${0.5+0.5*mech.energy})`;
                        ctx.globalCompositeOperation = "destination-in"; //in or atop
                        ctx.fill();
                        ctx.globalCompositeOperation = "source-over";
                        ctx.clip();
                    }

                    const energy = Math.max(0.01, Math.min(mech.energy, 1))
                    if (mech.isCloak) {
                        this.fieldRange = this.fieldRange * 0.9 + 0.1 * drawRadius
                        mech.fieldDrawRadius = this.fieldRange * Math.min(1, 0.3 + 0.5 * Math.min(1, energy * energy));
                        drawField()
                    } else {
                        if (this.fieldRange < 3000) {
                            this.fieldRange += 200
                            mech.fieldDrawRadius = this.fieldRange * Math.min(1, 0.3 + 0.5 * Math.min(1, energy * energy));
                            drawField()
                        }
                    }
                    if (tech.isIntangible) {
                        if (mech.isCloak) {
                            player.collisionFilter.mask = cat.map
                            let inPlayer = Matter.Query.region(mob, player.bounds)
                            if (inPlayer.length > 0) {
                                for (let i = 0; i < inPlayer.length; i++) {
                                    if (mech.energy > 0) {
                                        if (inPlayer[i].shield) { //shields drain player energy
                                            mech.energy -= 0.014;
                                        } else {
                                            mech.energy -= 0.004;
                                        }
                                    }
                                }
                            }
                        } else {
                            player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
                        }
                    }

                    if (mech.energy < mech.maxEnergy) { // replaces mech.drawFieldMeter() with custom code
                        mech.energy += mech.fieldRegen;
                        if (mech.energy < 0) mech.energy = 0
                        const xOff = mech.pos.x - mech.radius * mech.maxEnergy
                        const yOff = mech.pos.y - 50
                        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
                        ctx.fillRect(xOff, yOff, 60 * mech.maxEnergy, 10);
                        ctx.fillStyle = mech.fieldMeterColor;
                        ctx.fillRect(xOff, yOff, 60 * mech.energy, 10);
                        ctx.beginPath()
                        ctx.rect(xOff, yOff, 60 * mech.maxEnergy, 10);
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
        },
        // {
        //   name: "phase decoherence field",
        //   description: "use <strong class='color-f'>energy</strong> to become <strong>intangible</strong><br><strong>firing</strong> and touching <strong>shields</strong> <strong>drains</strong> <strong class='color-f'>energy</strong><br>unable to <strong>see</strong> and be <strong>seen</strong> by mobs",
        //   effect: () => {
        //     mech.fieldFire = true;
        //     mech.fieldMeterColor = "#fff";
        //     mech.fieldPhase = 0;

        //     mech.hold = function () {
        //       function drawField(radius) {
        //         radius *= Math.min(4, 0.9 + 2.2 * mech.energy * mech.energy);
        //         const rotate = mech.cycle * 0.005;
        //         mech.fieldPhase += 0.5 - 0.5 * Math.sqrt(Math.max(0.01, Math.min(mech.energy, 1)));
        //         const off1 = 1 + 0.06 * Math.sin(mech.fieldPhase);
        //         const off2 = 1 - 0.06 * Math.sin(mech.fieldPhase);
        //         ctx.beginPath();
        //         ctx.ellipse(mech.pos.x, mech.pos.y, radius * off1, radius * off2, rotate, 0, 2 * Math.PI);
        //         if (mech.fireCDcycle > mech.cycle && (input.field)) {
        //           ctx.lineWidth = 5;
        //           ctx.strokeStyle = `rgba(0, 204, 255,1)`
        //           ctx.stroke()
        //         }
        //         ctx.fillStyle = "#fff" //`rgba(0,0,0,${0.5+0.5*mech.energy})`;
        //         ctx.globalCompositeOperation = "destination-in"; //in or atop
        //         ctx.fill();
        //         ctx.globalCompositeOperation = "source-over";
        //         ctx.clip();
        //       }

        //       mech.isCloak = false //isCloak disables most uses of foundPlayer() 
        //       player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
        //       if (mech.isHolding) {
        //         if (this.fieldRange < 2000) {
        //           this.fieldRange += 100
        //           drawField(this.fieldRange)
        //         }
        //         mech.drawHold(mech.holdingTarget);
        //         mech.holding();
        //         mech.throwBlock();
        //       } else if (input.field) {
        //         mech.grabPowerUp();
        //         mech.lookForPickUp();

        //         if (mech.fieldCDcycle < mech.cycle) {
        //           // simulation.draw.bodyFill = "transparent"
        //           // simulation.draw.bodyStroke = "transparent"

        //           const DRAIN = 0.00013 + (mech.fireCDcycle > mech.cycle ? 0.005 : 0)
        //           if (mech.energy > DRAIN) {
        //             mech.energy -= DRAIN;
        //             // if (mech.energy < 0.001) {
        //             //   mech.fieldCDcycle = mech.cycle + 120;
        //             //   mech.energy = 0;
        //             //   mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //             // }
        //             this.fieldRange = this.fieldRange * 0.8 + 0.2 * 160
        //             drawField(this.fieldRange)

        //             mech.isCloak = true //isCloak disables most uses of foundPlayer() 
        //             player.collisionFilter.mask = cat.map


        //             let inPlayer = Matter.Query.region(mob, player.bounds)
        //             if (inPlayer.length > 0) {
        //               for (let i = 0; i < inPlayer.length; i++) {
        //                 if (inPlayer[i].shield) {
        //                   mech.energy -= 0.005; //shields drain player energy
        //                   //draw outline of shield
        //                   ctx.fillStyle = `rgba(140,217,255,0.5)`
        //                   ctx.fill()
        //                 } else if (tech.superposition && inPlayer[i].dropPowerUp) {
        //                   // inPlayer[i].damage(0.4 * b.dmgScale); //damage mobs inside the player
        //                   // mech.energy += 0.005;

        //                   mobs.statusStun(inPlayer[i], 300)
        //                   //draw outline of mob in a few random locations to show blurriness
        //                   const vertices = inPlayer[i].vertices;
        //                   const off = 30
        //                   for (let k = 0; k < 3; k++) {
        //                     const xOff = off * (Math.random() - 0.5)
        //                     const yOff = off * (Math.random() - 0.5)
        //                     ctx.beginPath();
        //                     ctx.moveTo(xOff + vertices[0].x, yOff + vertices[0].y);
        //                     for (let j = 1, len = vertices.length; j < len; ++j) {
        //                       ctx.lineTo(xOff + vertices[j].x, yOff + vertices[j].y);
        //                     }
        //                     ctx.lineTo(xOff + vertices[0].x, yOff + vertices[0].y);
        //                     ctx.fillStyle = "rgba(0,0,0,0.1)"
        //                     ctx.fill()
        //                   }
        //                   break;
        //                 }
        //               }
        //             }
        //           } else {
        //             mech.fieldCDcycle = mech.cycle + 120;
        //             mech.energy = 0;
        //             mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //             drawField(this.fieldRange)
        //           }
        //         }
        //       } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
        //         mech.pickUp();
        //         if (this.fieldRange < 2000) {
        //           this.fieldRange += 100
        //           drawField(this.fieldRange)
        //         }
        //       } else {
        //         // this.fieldRange = 3000
        //         if (this.fieldRange < 2000 && mech.holdingTarget === null) {
        //           this.fieldRange += 100
        //           drawField(this.fieldRange)
        //         }
        //         mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //       }

        //       if (mech.energy < mech.maxEnergy) {
        //         mech.energy += mech.fieldRegen;
        //         const xOff = mech.pos.x - mech.radius * mech.maxEnergy
        //         const yOff = mech.pos.y - 50
        //         ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        //         ctx.fillRect(xOff, yOff, 60 * mech.maxEnergy, 10);
        //         ctx.fillStyle = mech.fieldMeterColor;
        //         ctx.fillRect(xOff, yOff, 60 * mech.energy, 10);
        //         ctx.beginPath()
        //         ctx.rect(xOff, yOff, 60 * mech.maxEnergy, 10);
        //         ctx.strokeStyle = "rgb(0, 0, 0)";
        //         ctx.lineWidth = 1;
        //         ctx.stroke();
        //       }
        //       if (mech.energy < 0) mech.energy = 0
        //     }
        //   }
        // },
        {
            name: "pilot wave",
            description: "use <strong class='color-f'>energy</strong> to push <strong>blocks</strong> with your mouse<br>field <strong>radius</strong> decreases out of <strong>line of sight</strong><br>allows <strong class='color-m'>tech</strong> that normally require other <strong class='color-f'>fields</strong>",
            effect: () => {
                mech.fieldPhase = 0;
                mech.fieldPosition = {
                    x: simulation.mouseInGame.x,
                    y: simulation.mouseInGame.y
                }
                mech.lastFieldPosition = {
                    x: simulation.mouseInGame.x,
                    y: simulation.mouseInGame.y
                }
                mech.fieldOn = false;
                mech.fieldRadius = 0;
                mech.drop();
                mech.hold = function() {
                    if (input.field) {
                        if (mech.fieldCDcycle < mech.cycle) {
                            const scale = 25
                            const bounds = {
                                min: {
                                    x: mech.fieldPosition.x - scale,
                                    y: mech.fieldPosition.y - scale
                                },
                                max: {
                                    x: mech.fieldPosition.x + scale,
                                    y: mech.fieldPosition.y + scale
                                }
                            }
                            const isInMap = Matter.Query.region(map, bounds).length
                            // const isInMap = Matter.Query.point(map, mech.fieldPosition).length

                            if (!mech.fieldOn) { // if field was off, and it starting up, teleport to new mouse location
                                mech.fieldOn = true;
                                mech.fieldPosition = { //smooth the mouse position
                                    x: simulation.mouseInGame.x,
                                    y: simulation.mouseInGame.y
                                }
                                mech.lastFieldPosition = { //used to find velocity of field changes
                                    x: mech.fieldPosition.x,
                                    y: mech.fieldPosition.y
                                }
                            } else { //when field is on it smoothly moves towards the mouse
                                mech.lastFieldPosition = { //used to find velocity of field changes
                                    x: mech.fieldPosition.x,
                                    y: mech.fieldPosition.y
                                }
                                const smooth = isInMap ? 0.985 : 0.96;
                                mech.fieldPosition = { //smooth the mouse position
                                    x: mech.fieldPosition.x * smooth + simulation.mouseInGame.x * (1 - smooth),
                                    y: mech.fieldPosition.y * smooth + simulation.mouseInGame.y * (1 - smooth),
                                }
                            }

                            //grab power ups into the field
                            for (let i = 0, len = powerUp.length; i < len; ++i) {
                                const dxP = mech.fieldPosition.x - powerUp[i].position.x;
                                const dyP = mech.fieldPosition.y - powerUp[i].position.y;
                                const dist2 = dxP * dxP + dyP * dyP;
                                // float towards field  if looking at and in range  or  if very close to player
                                if (dist2 < mech.fieldRadius * mech.fieldRadius && (mech.lookingAt(powerUp[i]) || dist2 < 16000) && !(mech.health === mech.maxHealth && powerUp[i].name === "heal")) {
                                    powerUp[i].force.x += 7 * (dxP / dist2) * powerUp[i].mass;
                                    powerUp[i].force.y += 7 * (dyP / dist2) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                                    //extra friction
                                    Matter.Body.setVelocity(powerUp[i], {
                                        x: powerUp[i].velocity.x * 0.11,
                                        y: powerUp[i].velocity.y * 0.11
                                    });
                                    if (dist2 < 5000 && !simulation.isChoosing) { //use power up if it is close enough
                                        powerUps.onPickUp(powerUp[i]);
                                        powerUp[i].effect();
                                        Matter.World.remove(engine.world, powerUp[i]);
                                        powerUp.splice(i, 1);
                                        // mech.fieldRadius += 50
                                        break; //because the array order is messed up after splice
                                    }
                                }
                            }
                            //grab power ups normally too
                            mech.grabPowerUp();

                            if (mech.energy > 0.01) {
                                //find mouse velocity
                                const diff = Vector.sub(mech.fieldPosition, mech.lastFieldPosition)
                                const speed = Vector.magnitude(diff)
                                const velocity = Vector.mult(Vector.normalise(diff), Math.min(speed, 45)) //limit velocity
                                let radius, radiusSmooth
                                if (Matter.Query.ray(map, mech.fieldPosition, player.position).length) { //is there something block the player's view of the field
                                    radius = 0
                                    radiusSmooth = Math.max(0, isInMap ? 0.96 - 0.02 * speed : 0.995); //0.99
                                } else {
                                    radius = Math.max(50, 250 - 2 * speed)
                                    radiusSmooth = 0.97
                                }
                                mech.fieldRadius = mech.fieldRadius * radiusSmooth + radius * (1 - radiusSmooth)

                                for (let i = 0, len = body.length; i < len; ++i) {
                                    if (Vector.magnitude(Vector.sub(body[i].position, mech.fieldPosition)) < mech.fieldRadius && !body[i].isNotHoldable) {
                                        const DRAIN = speed * body[i].mass * 0.000013
                                        if (mech.energy > DRAIN) {
                                            mech.energy -= DRAIN;
                                            Matter.Body.setVelocity(body[i], velocity); //give block mouse velocity
                                            Matter.Body.setAngularVelocity(body[i], body[i].angularVelocity * 0.8)
                                            // body[i].force.y -= body[i].mass * simulation.g; //remove gravity effects
                                            //blocks drift towards center of pilot wave
                                            const sub = Vector.sub(mech.fieldPosition, body[i].position)
                                            const unit = Vector.mult(Vector.normalise(sub), 0.00005 * Vector.magnitude(sub))
                                            body[i].force.x += unit.x
                                            body[i].force.y += unit.y - body[i].mass * simulation.g //remove gravity effects
                                        } else {
                                            mech.fieldCDcycle = mech.cycle + 120;
                                            mech.fieldOn = false
                                            mech.fieldRadius = 0
                                            break
                                        }
                                    }
                                }

                                if (tech.isFreezeMobs) {
                                    for (let i = 0, len = mob.length; i < len; ++i) {
                                        if (Vector.magnitude(Vector.sub(mob[i].position, mech.fieldPosition)) < mech.fieldRadius) {
                                            mobs.statusSlow(mob[i], 120)
                                        }
                                    }
                                }

                                ctx.beginPath();
                                const rotate = mech.cycle * 0.008;
                                mech.fieldPhase += 0.2 // - 0.5 * Math.sqrt(Math.min(mech.energy, 1));
                                const off1 = 1 + 0.06 * Math.sin(mech.fieldPhase);
                                const off2 = 1 - 0.06 * Math.sin(mech.fieldPhase);
                                ctx.beginPath();
                                ctx.ellipse(mech.fieldPosition.x, mech.fieldPosition.y, 1.2 * mech.fieldRadius * off1, 1.2 * mech.fieldRadius * off2, rotate, 0, 2 * Math.PI);
                                ctx.globalCompositeOperation = "exclusion"; //"exclusion" "difference";
                                ctx.fillStyle = "#fff"; //"#eef";
                                ctx.fill();
                                ctx.globalCompositeOperation = "source-over";
                                ctx.beginPath();
                                ctx.ellipse(mech.fieldPosition.x, mech.fieldPosition.y, 1.2 * mech.fieldRadius * off1, 1.2 * mech.fieldRadius * off2, rotate, 0, 2 * Math.PI * mech.energy / mech.maxEnergy);
                                ctx.strokeStyle = "#000";
                                ctx.lineWidth = 4;
                                ctx.stroke();
                            } else {
                                mech.fieldCDcycle = mech.cycle + 120;
                                mech.fieldOn = false
                                mech.fieldRadius = 0
                            }
                        } else {
                            mech.grabPowerUp();
                        }
                    } else {
                        mech.fieldOn = false
                        mech.fieldRadius = 0
                    }
                    mech.drawFieldMeter()
                }
            }
        },
        {
            name: "wormhole",
            description: "use <strong class='color-f'>energy</strong> to <strong>tunnel</strong> through a <strong class='color-worm'>wormhole</strong><br><strong class='color-worm'>wormholes</strong> attract blocks and power ups<br><strong>10%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong>", //<br>bullets may also traverse <strong class='color-worm'>wormholes</strong>
            effect: function() {
                mech.drop();
                mech.duplicateChance = 0.1
                simulation.draw.powerUp = simulation.draw.powerUpBonus //change power up draw

                // if (tech.isRewindGun) {
                //     mech.hold = this.rewind
                // } else {
                mech.hold = this.teleport
                // }
            },
            rewindCount: 0,
            // rewind: function() {
            //     if (input.down) {
            //         if (input.field && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
            //             const DRAIN = 0.01
            //             if (this.rewindCount < 289 && mech.energy > DRAIN) {
            //                 mech.energy -= DRAIN


            //                 if (this.rewindCount === 0) {
            //                     const shortPause = function() {
            //                         if (mech.defaultFPSCycle < mech.cycle) { //back to default values
            //                             simulation.fpsCap = simulation.fpsCapDefault
            //                             simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                             // document.getElementById("dmg").style.transition = "opacity 1s";
            //                             // document.getElementById("dmg").style.opacity = "0";
            //                         } else {
            //                             requestAnimationFrame(shortPause);
            //                         }
            //                     };
            //                     if (mech.defaultFPSCycle < mech.cycle) requestAnimationFrame(shortPause);
            //                     simulation.fpsCap = 4 //1 is longest pause, 4 is standard
            //                     simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                     mech.defaultFPSCycle = mech.cycle
            //                 }


            //                 this.rewindCount += 10;
            //                 simulation.wipe = function() { //set wipe to have trails
            //                     // ctx.fillStyle = "rgba(255,255,255,0)";
            //                     ctx.fillStyle = `rgba(221,221,221,${0.004})`;
            //                     ctx.fillRect(0, 0, canvas.width, canvas.height);
            //                 }
            //                 let history = mech.history[(mech.cycle - this.rewindCount) % 300]
            //                 Matter.Body.setPosition(player, history.position);
            //                 Matter.Body.setVelocity(player, { x: history.velocity.x, y: history.velocity.y });
            //                 if (history.health > mech.health) {
            //                     mech.health = history.health
            //                     mech.displayHealth();
            //                 }
            //                 //grab power ups
            //                 for (let i = 0, len = powerUp.length; i < len; ++i) {
            //                     const dxP = player.position.x - powerUp[i].position.x;
            //                     const dyP = player.position.y - powerUp[i].position.y;
            //                     if (dxP * dxP + dyP * dyP < 50000 && !simulation.isChoosing && !(mech.health === mech.maxHealth && powerUp[i].name === "heal")) {
            //                         powerUps.onPickUp(player.position);
            //                         powerUp[i].effect();
            //                         Matter.World.remove(engine.world, powerUp[i]);
            //                         powerUp.splice(i, 1);
            //                         const shortPause = function() {
            //                             if (mech.defaultFPSCycle < mech.cycle) { //back to default values
            //                                 simulation.fpsCap = simulation.fpsCapDefault
            //                                 simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                                 // document.getElementById("dmg").style.transition = "opacity 1s";
            //                                 // document.getElementById("dmg").style.opacity = "0";
            //                             } else {
            //                                 requestAnimationFrame(shortPause);
            //                             }
            //                         };
            //                         if (mech.defaultFPSCycle < mech.cycle) requestAnimationFrame(shortPause);
            //                         simulation.fpsCap = 3 //1 is longest pause, 4 is standard
            //                         simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                         mech.defaultFPSCycle = mech.cycle
            //                         break; //because the array order is messed up after splice
            //                     }
            //                 }
            //                 mech.immuneCycle = mech.cycle + 5; //player is immune to collision damage for 30 cycles
            //             } else {
            //                 mech.fieldCDcycle = mech.cycle + 30;
            //                 // mech.resetHistory();
            //             }
            //         } else {
            //             if (this.rewindCount !== 0) {
            //                 mech.fieldCDcycle = mech.cycle + 30;
            //                 mech.resetHistory();
            //                 this.rewindCount = 0;
            //                 simulation.wipe = function() { //set wipe to normal
            //                     ctx.clearRect(0, 0, canvas.width, canvas.height);
            //                 }
            //             }
            //             mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
            //         }
            //     }
            //     mech.drawFieldMeter()
            // },
            teleport: function() {
                // mech.hole = {  //this is reset with each new field, but I'm leaving it here for reference
                //   isOn: false,
                //   isReady: true,
                //   pos1: {x: 0,y: 0},
                //   pos2: {x: 0,y: 0},
                //   angle: 0,
                //   unit:{x:0,y:0},
                // }
                if (mech.hole.isOn) {
                    // draw holes
                    mech.fieldRange = 0.97 * mech.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                    const semiMajorAxis = mech.fieldRange + 30
                    const edge1a = Vector.add(Vector.mult(mech.hole.unit, semiMajorAxis), mech.hole.pos1)
                    const edge1b = Vector.add(Vector.mult(mech.hole.unit, -semiMajorAxis), mech.hole.pos1)
                    const edge2a = Vector.add(Vector.mult(mech.hole.unit, semiMajorAxis), mech.hole.pos2)
                    const edge2b = Vector.add(Vector.mult(mech.hole.unit, -semiMajorAxis), mech.hole.pos2)
                    ctx.beginPath();
                    ctx.moveTo(edge1a.x, edge1a.y)
                    ctx.bezierCurveTo(mech.hole.pos1.x, mech.hole.pos1.y, mech.hole.pos2.x, mech.hole.pos2.y, edge2a.x, edge2a.y);
                    ctx.lineTo(edge2b.x, edge2b.y)
                    ctx.bezierCurveTo(mech.hole.pos2.x, mech.hole.pos2.y, mech.hole.pos1.x, mech.hole.pos1.y, edge1b.x, edge1b.y);
                    ctx.fillStyle = `rgba(255,255,255,${200 / mech.fieldRange / mech.fieldRange})` //"rgba(0,0,0,0.1)"
                    ctx.fill();
                    ctx.beginPath();
                    ctx.ellipse(mech.hole.pos1.x, mech.hole.pos1.y, mech.fieldRange, semiMajorAxis, mech.hole.angle, 0, 2 * Math.PI)
                    ctx.ellipse(mech.hole.pos2.x, mech.hole.pos2.y, mech.fieldRange, semiMajorAxis, mech.hole.angle, 0, 2 * Math.PI)
                    ctx.fillStyle = `rgba(255,255,255,${32 / mech.fieldRange})`
                    ctx.fill();

                    //suck power ups
                    for (let i = 0, len = powerUp.length; i < len; ++i) {
                        //which hole is closer
                        const dxP1 = mech.hole.pos1.x - powerUp[i].position.x;
                        const dyP1 = mech.hole.pos1.y - powerUp[i].position.y;
                        const dxP2 = mech.hole.pos2.x - powerUp[i].position.x;
                        const dyP2 = mech.hole.pos2.y - powerUp[i].position.y;
                        let dxP, dyP, dist2
                        if (dxP1 * dxP1 + dyP1 * dyP1 < dxP2 * dxP2 + dyP2 * dyP2) {
                            dxP = dxP1
                            dyP = dyP1
                        } else {
                            dxP = dxP2
                            dyP = dyP2
                        }
                        dist2 = dxP * dxP + dyP * dyP;
                        if (dist2 < 600000 && !(mech.health === mech.maxHealth && powerUp[i].name === "heal")) {
                            powerUp[i].force.x += 4 * (dxP / dist2) * powerUp[i].mass; // float towards hole
                            powerUp[i].force.y += 4 * (dyP / dist2) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                            Matter.Body.setVelocity(powerUp[i], { //extra friction
                                x: powerUp[i].velocity.x * 0.05,
                                y: powerUp[i].velocity.y * 0.05
                            });
                            if (dist2 < 1000 && !simulation.isChoosing) { //use power up if it is close enough
                                mech.fieldRange *= 0.8
                                powerUps.onPickUp(powerUp[i]);
                                powerUp[i].effect();
                                Matter.World.remove(engine.world, powerUp[i]);
                                powerUp.splice(i, 1);
                                break; //because the array order is messed up after splice
                            }
                        }
                    }
                    //suck and shrink blocks
                    const suckRange = 500
                    const shrinkRange = 100
                    const shrinkScale = 0.97;
                    const slowScale = 0.9
                    for (let i = 0, len = body.length; i < len; i++) {
                        if (!body[i].isNotHoldable) {
                            const dist1 = Vector.magnitude(Vector.sub(mech.hole.pos1, body[i].position))
                            const dist2 = Vector.magnitude(Vector.sub(mech.hole.pos2, body[i].position))
                            if (dist1 < dist2) {
                                if (dist1 < suckRange) {
                                    const pull = Vector.mult(Vector.normalise(Vector.sub(mech.hole.pos1, body[i].position)), 1)
                                    const slow = Vector.mult(body[i].velocity, slowScale)
                                    Matter.Body.setVelocity(body[i], Vector.add(slow, pull));
                                    //shrink
                                    if (Vector.magnitude(Vector.sub(mech.hole.pos1, body[i].position)) < shrinkRange) {
                                        Matter.Body.scale(body[i], shrinkScale, shrinkScale);
                                        if (body[i].mass < 0.05) {
                                            Matter.World.remove(engine.world, body[i]);
                                            body.splice(i, 1);
                                            mech.fieldRange *= 0.8
                                            if (tech.isWormholeEnergy) mech.energy += 0.5
                                            if (tech.isWormSpores) { //pandimensionalspermia
                                                for (let i = 0, len = Math.ceil(3 * Math.random()); i < len; i++) {
                                                    b.spore(Vector.add(mech.hole.pos2, Vector.rotate({
                                                        x: mech.fieldRange * 0.4,
                                                        y: 0
                                                    }, 2 * Math.PI * Math.random())))
                                                    Matter.Body.setVelocity(bullet[bullet.length - 1], Vector.mult(Vector.rotate(mech.hole.unit, Math.PI / 2), -15));
                                                }
                                            }
                                            break
                                        }
                                    }
                                }
                            } else if (dist2 < suckRange) {
                                const pull = Vector.mult(Vector.normalise(Vector.sub(mech.hole.pos2, body[i].position)), 1)
                                const slow = Vector.mult(body[i].velocity, slowScale)
                                Matter.Body.setVelocity(body[i], Vector.add(slow, pull));
                                //shrink
                                if (Vector.magnitude(Vector.sub(mech.hole.pos2, body[i].position)) < shrinkRange) {
                                    Matter.Body.scale(body[i], shrinkScale, shrinkScale);
                                    if (body[i].mass < 0.05) {
                                        Matter.World.remove(engine.world, body[i]);
                                        body.splice(i, 1);
                                        mech.fieldRange *= 0.8
                                        // if (tech.isWormholeEnergy && mech.energy < mech.maxEnergy * 2) mech.energy = mech.maxEnergy * 2
                                        if (tech.isWormholeEnergy) mech.energy += 0.5
                                        if (tech.isWormSpores) { //pandimensionalspermia
                                            for (let i = 0, len = Math.ceil(3 * Math.random()); i < len; i++) {
                                                b.spore(Vector.add(mech.hole.pos1, Vector.rotate({
                                                    x: mech.fieldRange * 0.4,
                                                    y: 0
                                                }, 2 * Math.PI * Math.random())))
                                                Matter.Body.setVelocity(bullet[bullet.length - 1], Vector.mult(Vector.rotate(mech.hole.unit, Math.PI / 2), 15));
                                            }
                                        }
                                        break
                                    }
                                }
                            }
                        }
                    }
                    if (tech.isWormBullets) {
                        //teleport bullets
                        for (let i = 0, len = bullet.length; i < len; ++i) { //teleport bullets from hole1 to hole2
                            if (!bullet[i].botType && !bullet[i].isInHole) { //don't teleport bots
                                if (Vector.magnitude(Vector.sub(mech.hole.pos1, bullet[i].position)) < mech.fieldRange) { //find if bullet is touching hole1
                                    Matter.Body.setPosition(bullet[i], Vector.add(mech.hole.pos2, Vector.sub(mech.hole.pos1, bullet[i].position)));
                                    mech.fieldRange += 5
                                    bullet[i].isInHole = true
                                } else if (Vector.magnitude(Vector.sub(mech.hole.pos2, bullet[i].position)) < mech.fieldRange) { //find if bullet is touching hole1
                                    Matter.Body.setPosition(bullet[i], Vector.add(mech.hole.pos1, Vector.sub(mech.hole.pos2, bullet[i].position)));
                                    mech.fieldRange += 5
                                    bullet[i].isInHole = true
                                }
                            }
                        }
                        // mobs get pushed away
                        for (let i = 0, len = mob.length; i < len; i++) {
                            if (Vector.magnitude(Vector.sub(mech.hole.pos1, mob[i].position)) < 200) {
                                const pull = Vector.mult(Vector.normalise(Vector.sub(mech.hole.pos1, mob[i].position)), -0.07)
                                Matter.Body.setVelocity(mob[i], Vector.add(mob[i].velocity, pull));
                            }
                            if (Vector.magnitude(Vector.sub(mech.hole.pos2, mob[i].position)) < 200) {
                                const pull = Vector.mult(Vector.normalise(Vector.sub(mech.hole.pos2, mob[i].position)), -0.07)
                                Matter.Body.setVelocity(mob[i], Vector.add(mob[i].velocity, pull));
                            }
                        }
                    }
                }

                if (input.field && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
                    const justPastMouse = Vector.add(Vector.mult(Vector.normalise(Vector.sub(simulation.mouseInGame, mech.pos)), 50), simulation.mouseInGame)
                    const scale = 60
                    // console.log(Matter.Query.region(map, bounds))
                    if (mech.hole.isReady &&
                        (
                            Matter.Query.region(map, {
                                min: {
                                    x: simulation.mouseInGame.x - scale,
                                    y: simulation.mouseInGame.y - scale
                                },
                                max: {
                                    x: simulation.mouseInGame.x + scale,
                                    y: simulation.mouseInGame.y + scale
                                }
                            }).length === 0 &&
                            Matter.Query.ray(map, mech.pos, justPastMouse).length === 0
                            // Matter.Query.ray(map, mech.pos, simulation.mouseInGame).length === 0 &&
                            // Matter.Query.ray(map, player.position, simulation.mouseInGame).length === 0 &&
                            // Matter.Query.ray(map, player.position, justPastMouse).length === 0
                        )
                    ) {
                        const sub = Vector.sub(simulation.mouseInGame, mech.pos)
                        const mag = Vector.magnitude(sub)
                        const drain = 0.03 + 0.005 * Math.sqrt(mag)
                        if (mech.energy > drain && mag > 300) {
                            mech.energy -= drain
                            mech.hole.isReady = false;
                            mech.fieldRange = 0
                            Matter.Body.setPosition(player, simulation.mouseInGame);
                            mech.buttonCD_jump = 0 //this might fix a bug with jumping
                            const velocity = Vector.mult(Vector.normalise(sub), 18)
                            Matter.Body.setVelocity(player, {
                                x: velocity.x,
                                y: velocity.y - 4 //an extra vertical kick so the player hangs in place longer
                            });
                            mech.immuneCycle = mech.cycle + 15; //player is immune to collision damage 
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

                            //set holes
                            mech.hole.isOn = true;
                            mech.hole.pos1.x = mech.pos.x
                            mech.hole.pos1.y = mech.pos.y
                            mech.hole.pos2.x = player.position.x
                            mech.hole.pos2.y = player.position.y
                            mech.hole.angle = Math.atan2(sub.y, sub.x)
                            mech.hole.unit = Vector.perp(Vector.normalise(sub))

                            if (tech.isWormholeDamage) {
                                who = Matter.Query.ray(mob, mech.pos, simulation.mouseInGame, 80)
                                for (let i = 0; i < who.length; i++) {
                                    if (who[i].body.alive) {
                                        mobs.statusDoT(who[i].body, 0.6, 420)
                                        mobs.statusStun(who[i].body, 240)
                                    }
                                }
                            }
                        } else {
                            mech.grabPowerUp();
                        }
                    } else {
                        mech.grabPowerUp();
                    }
                } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
                    mech.pickUp();
                } else {
                    mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    mech.hole.isReady = true;
                }
                mech.drawFieldMeter()
            },
        },
    ],
};