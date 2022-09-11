//global player variables for use in matter.js physics
let player, jumpSensor, playerBody, playerHead, headSensor;

// player Object Prototype *********************************************
const m = {
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
            // death() {
            //     m.death();
            // }
        });
        Matter.Body.setMass(player, m.mass);
        Composite.add(engine.world, [player]);
    },
    cycle: 600, //starts at 600 cycles instead of 0 to prevent bugs with m.history
    lastKillCycle: 0,
    lastHarmCycle: 0,
    width: 50,
    radius: 30,
    eyeFillColor: null,
    fillColor: null, //set by setFillColors
    fillColorDark: null, //set by setFillColors
    bodyGradient: null, //set by setFillColors
    color: {
        hue: 0,
        sat: 0,
        light: 100,
    },
    setFillColors() {
        m.fillColor = `hsl(${m.color.hue},${m.color.sat}%,${m.color.light}%)`
        m.fillColorDark = `hsl(${m.color.hue},${m.color.sat}%,${m.color.light - 25}%)`
        let grd = ctx.createLinearGradient(-30, 0, 30, 0);
        grd.addColorStop(0, m.fillColorDark);
        grd.addColorStop(1, m.fillColor);
        m.bodyGradient = grd
    },
    setFillColorsAlpha(alpha = 0.5) {
        m.fillColor = `hsla(${m.color.hue},${m.color.sat}%,${m.color.light}%,${alpha})`
        m.fillColorDark = `hsla(${m.color.hue},${m.color.sat}%,${m.color.light - 25}%,${alpha})`
        let grd = ctx.createLinearGradient(-30, 0, 30, 0);
        grd.addColorStop(0, m.fillColorDark);
        grd.addColorStop(1, m.fillColor);
        m.bodyGradient = grd
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
        // m.Fx = 0.08 / mass * tech.squirrelFx 
        // m.FxAir = 0.4 / mass / mass 
        m.Fx = tech.baseFx * m.fieldFx * tech.squirrelFx * (tech.isFastTime ? 1.5 : 1) / player.mass //base player mass is 5
        m.jumpForce = tech.baseJumpForce * m.fieldJump * tech.squirrelJump * (tech.isFastTime ? 1.13 : 1) / player.mass / player.mass //base player mass is 5
    },
    FxAir: 0.016, // 0.4/5/5  run Force in Air
    yOff: 70,
    yOffGoal: 70,
    onGround: false, //checks if on ground or in air
    lastOnGroundCycle: 0, //use to calculate coyote time
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
    yPosDifference: 24.2859, //player.position.y - m.pos.y  //24.285923217549026
    // yPosDifferenceCrouched: -2.7140767824453604,
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
    history: new Array(600), //[], //tracks the last second of player position
    rewindCount: 0, //used with CPT
    resetHistory() {
        const set = {
            position: {
                x: player.position.x,
                y: player.position.y,
            },
            velocity: {
                x: player.velocity.x,
                y: player.velocity.y
            },
            yOff: m.yOff,
            angle: m.angle,
            health: m.health,
            energy: m.energy,
            activeGun: b.activeGun
        }
        for (let i = 0; i < 600; i++) { //reset history
            m.history[i] = set
        }
    },
    move() {
        m.pos.x = player.position.x;
        m.pos.y = playerBody.position.y - m.yOff;
        m.Vx = player.velocity.x;
        m.Vy = player.velocity.y;

        //tracks the last 10s of player information
        m.history.splice(m.cycle % 600, 1, {
            position: {
                x: player.position.x,
                y: player.position.y,
            },
            velocity: {
                x: player.velocity.x,
                y: player.velocity.y
            },
            yOff: m.yOff,
            angle: m.angle,
            health: m.health,
            energy: m.energy,
            activeGun: b.activeGun
        });
        // const back = 59  // 59 looks at 1 second ago //29 looks at 1/2 a second ago
        // historyIndex = (m.cycle - back) % 600
    },
    transSmoothX: 0,
    transSmoothY: 0,
    lastGroundedPositionY: 0,
    // mouseZoom: 0,
    lookSmoothing: 0.07, //1 is instant jerky,  0.001 is slow smooth zoom, 0.07 is standard
    look() {}, //set to lookDefault()
    lookDefault() {
        //always on mouse look
        m.angle = Math.atan2(
            simulation.mouseInGame.y - m.pos.y,
            simulation.mouseInGame.x - m.pos.x
        );
        //smoothed mouse look translations
        const scale = 0.8;
        m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
        m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;

        m.transX += (m.transSmoothX - m.transX) * m.lookSmoothing;
        m.transY += (m.transSmoothY - m.transY) * m.lookSmoothing;
    },
    doCrouch() {
        if (!m.crouch) {
            m.crouch = true;
            m.yOffGoal = m.yOffWhen.crouch;
            if ((playerHead.position.y - player.position.y) < 0) {
                Matter.Body.setPosition(playerHead, {
                    x: player.position.x,
                    y: player.position.y + 9.1740767
                })
            }
        }
    },
    undoCrouch() {
        if (m.crouch) {
            m.crouch = false;
            m.yOffGoal = m.yOffWhen.stand;
            if ((playerHead.position.y - player.position.y) > 0) {
                Matter.Body.setPosition(playerHead, {
                    x: player.position.x,
                    y: player.position.y - 30.28592321
                })
            }
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
    jump() {
        // if (!m.onGround) m.lastOnGroundCycle = 0 //m.cycle - tech.coyoteTime
        m.buttonCD_jump = m.cycle; //can't jump again until 20 cycles pass
        //apply a fraction of the jump force to the body the player is jumping off of
        Matter.Body.applyForce(m.standingOn, m.pos, {
            x: 0,
            y: m.jumpForce * 0.12 * Math.min(m.standingOn.mass, 5)
        });

        player.force.y = -m.jumpForce; //player jump force
        Matter.Body.setVelocity(player, { //zero player y-velocity for consistent jumps
            x: player.velocity.x,
            y: Math.max(-10, Math.min(m.standingOn.velocity.y, 10)) //cap velocity contribution from blocks you are standing on to 10 in the vertical
        });
    },
    groundControl() {
        //check for crouch or jump
        if (m.crouch) {
            if (!(input.down) && m.checkHeadClear() && m.hardLandCD < m.cycle) m.undoCrouch();
        } else if (input.down || m.hardLandCD > m.cycle) {
            m.doCrouch(); //on ground && not crouched and pressing s or down
        } else if (input.up && m.buttonCD_jump + 20 < m.cycle && m.yOffWhen.stand > 23) {
            m.jump()
        }

        if (input.left) {
            if (player.velocity.x > -2) {
                player.force.x -= m.Fx * 1.5
            } else {
                player.force.x -= m.Fx
            }
            // }
        } else if (input.right) {
            if (player.velocity.x < 2) {
                player.force.x += m.Fx * 1.5
            } else {
                player.force.x += m.Fx
            }
        } else {
            const stoppingFriction = 0.92; //come to a stop if no move key is pressed
            Matter.Body.setVelocity(player, {
                x: player.velocity.x * stoppingFriction,
                y: player.velocity.y * stoppingFriction
            });
        }
        //come to a stop if fast 
        if (player.speed > 4) {
            const stoppingFriction = (m.crouch) ? 0.65 : 0.89; // this controls speed when crouched
            Matter.Body.setVelocity(player, {
                x: player.velocity.x * stoppingFriction,
                y: player.velocity.y * stoppingFriction
            });
        }
    },
    airControl() {
        //check for coyote time jump
        // if (input.up && m.buttonCD_jump + 20 + tech.coyoteTime < m.cycle && m.yOffWhen.stand > 23 && m.lastOnGroundCycle + tech.coyoteTime > m.cycle) m.jump()
        if (input.up && m.buttonCD_jump + 20 < m.cycle && m.yOffWhen.stand > 23 && m.lastOnGroundCycle + 5 > m.cycle) m.jump()

        //check for short jumps   //moving up   //recently pressed jump  //but not pressing jump key now
        if (m.buttonCD_jump + 60 > m.cycle && !(input.up) && m.Vy < 0) {
            Matter.Body.setVelocity(player, {
                //reduce player y-velocity every cycle
                x: player.velocity.x,
                y: player.velocity.y * 0.94
            });
        }

        if (input.left) {
            if (player.velocity.x > -m.airSpeedLimit / player.mass / player.mass) player.force.x -= m.FxAir; // move player   left / a
        } else if (input.right) {
            if (player.velocity.x < m.airSpeedLimit / player.mass / player.mass) player.force.x += m.FxAir; //move player  right / d
        }
    },
    alive: false,
    switchWorlds() {
        powerUps.boost.endCycle = 0
        const totalGuns = b.inventory.length
        //track ammo/ ammoPack count
        let ammoCount = 0
        for (let i = 0, len = b.inventory.length; i < len; i++) {
            if (b.guns[b.inventory[i]].ammo !== Infinity) {
                ammoCount += b.guns[b.inventory[i]].ammo / b.guns[b.inventory[i]].ammoPack
            } else {
                ammoCount += 5
            }
        }

        simulation.isTextLogOpen = false; //prevent console spam
        //remove all tech and count current tech total
        let totalTech = 0;
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (tech.tech[i].isJunk) tech.tech[i].frequency = 0
            if (tech.tech[i].count > 0 && !tech.tech[i].isLore) {
                if (tech.tech[i].frequencyDefault) {
                    tech.tech[i].frequency = tech.tech[i].frequencyDefault
                } else {
                    tech.tech[i].frequency = 1
                }
                if (
                    !tech.tech[i].isNonRefundable &&
                    !tech.tech[i].isFromAppliedScience &&
                    tech.tech[i].name !== "many-worlds" &&
                    tech.tech[i].name !== "Ψ(t) collapse" &&
                    tech.tech[i].name !== "Hilbert space" &&
                    tech.tech[i].name !== "-quantum leap-"
                ) {
                    totalTech += tech.tech[i].count
                    tech.tech[i].remove();
                    tech.tech[i].isLost = false
                    tech.tech[i].count = 0
                }
            }
        }
        // lore.techCount = 0;
        // tech.removeLoreTechFromPool();
        // tech.addLoreTechToPool();
        // tech.removeJunkTechFromPool();
        tech.cancelCount = 0;
        tech.extraMaxHealth = 0;
        tech.totalCount = 0;
        const randomBotCount = b.totalBots()
        b.zeroBotCount()
        //remove all bullets, respawn bots
        for (let i = 0; i < bullet.length; ++i) Matter.Composite.remove(engine.world, bullet[i]);
        bullet = [];

        //randomize health
        m.health = m.health * (1 + 0.5 * (Math.random() - 0.5))
        if (m.health > 1) m.health = 1;
        m.displayHealth();
        //randomize field
        m.setField(Math.ceil(Math.random() * (m.fieldUpgrades.length - 1)))
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

        //randomize ammo based on ammo/ammoPack count
        for (let i = 0, len = b.inventory.length; i < len; i++) {
            if (b.guns[b.inventory[i]].ammo !== Infinity) b.guns[b.inventory[i]].ammo = Math.max(0, Math.floor(ammoCount / b.inventory.length * b.guns[b.inventory[i]].ammoPack * (1.05 + 0.3 * (Math.random() - 0.5))))
        }

        //randomize tech
        for (let i = 0; i < totalTech; i++) {
            //find what tech I could get
            let options = [];
            for (let i = 0, len = tech.tech.length; i < len; i++) {
                if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isBadRandomOption && !tech.tech[i].isLore && !tech.tech[i].isJunk) {
                    for (let j = 0; j < tech.tech[i].frequency; j++) options.push(i);
                }
            }
            //add a new tech from options pool
            if (options.length > 0) tech.giveTech(options[Math.floor(Math.random() * options.length)])
        }
        b.respawnBots();
        for (let i = 0; i < randomBotCount; i++) b.randomBot()
        simulation.makeGunHUD(); //update gun HUD
        simulation.updateTechHUD();
        simulation.isTextLogOpen = true;
        m.drop();
        if (simulation.paused) build.pauseGrid() //update the build when paused
    },
    dmgScale: null, //scales all damage, but not raw .dmg //set in levels.setDifficulty
    death() {
        if (tech.isImmortal) { //if player has the immortality buff, spawn on the same level with randomized damage
            //remove immortality tech
            // for (let i = 0; i < tech.tech.length; i++) {
            //     if (tech.tech[i].name === "quantum immortality") tech.removeTech(i)
            // }

            m.setMaxHealth()
            m.health = 1;
            // m.addHealth(1)

            simulation.wipe = function() { //set wipe to have trails
                ctx.fillStyle = "rgba(255,255,255,0)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            spawn.setSpawnList(); //new mob types
            simulation.clearNow = true; //triggers a map reset

            m.switchWorlds()
            const swapPeriod = 1000
            for (let i = 0, len = 5; i < len; i++) {
                setTimeout(function() {
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = "rgba(255,255,255,0)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    spawn.setSpawnList(); //new mob types
                    simulation.clearNow = true; //triggers a map reset
                    m.switchWorlds()
                    simulation.isTextLogOpen = true;
                    simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> 0.${len - i - 1}`, swapPeriod);
                    simulation.isTextLogOpen = false;
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = `rgba(255,255,255,${(i + 1) * (i + 1) * 0.006})`;
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }, (i + 1) * swapPeriod);
            }
            setTimeout(function() {
                simulation.wipe = function() { //set wipe to normal
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                simulation.isTextLogOpen = true;
                simulation.makeTextLog("simulation.amplitude <span class='color-symbol'>=</span> null");
                tech.isImmortal = false //disable future immortality
            }, 6 * swapPeriod);
        } else if (m.alive) { //normal death code here
            m.alive = false;
            simulation.paused = true;
            m.health = 0;
            m.displayHealth();
            document.getElementById("text-log").style.opacity = 0; //fade out any active text logs
            document.getElementById("fade-out").style.opacity = 0.9; //slowly fade to 90% white on top of canvas
            // build.shareURL(false)
            setTimeout(function() {
                Composite.clear(engine.world);
                Engine.clear(engine);
                simulation.splashReturn();
            }, 5000);
        }
    },
    health: 0,
    maxHealth: 1, //set in simulation.reset()
    drawHealth() {
        if (m.health < 1) {
            ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
            ctx.fillRect(m.pos.x - m.radius, m.pos.y - 50, 60, 10);
            ctx.fillStyle = "#f00";
            ctx.fillRect(
                m.pos.x - m.radius,
                m.pos.y - 50,
                60 * m.health,
                10
            );
        }
    },
    displayHealth() {
        id = document.getElementById("health");
        // health display is a x^1.5 rule to make it seem like the player has lower health, this makes the player feel more excitement
        id.style.width = Math.floor(300 * m.maxHealth * Math.pow(m.health / m.maxHealth, 1.4)) + "px";
        //css animation blink if health is low
        if (m.health < 0.3) {
            id.classList.add("low-health");
        } else {
            id.classList.remove("low-health");
        }
    },
    addHealth(heal) {
        if (!tech.isEnergyHealth) {
            m.health += heal * simulation.healScale;
            if (m.health > m.maxHealth) m.health = m.maxHealth;
            m.displayHealth();
        }
    },
    baseHealth: 1,
    setMaxHealth() {
        m.maxHealth = m.baseHealth + tech.extraMaxHealth + tech.isFallingDamage + 4 * tech.isFlipFlop * tech.isFlipFlopOn * tech.isFlipFlopHealth //+ (m.fieldMode === 0 || m.fieldMode === 5) * 0.5 * m.coupling
        document.getElementById("health-bg").style.width = `${Math.floor(300 * m.maxHealth)}px`
        simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-h'>maxHealth</span> <span class='color-symbol'>=</span> ${m.maxHealth.toFixed(2)}`)
        if (m.health > m.maxHealth) m.health = m.maxHealth;
        m.displayHealth();
    },

    defaultFPSCycle: 0, //tracks when to return to normal fps
    immuneCycle: 0, //used in engine
    harmReduction() {
        let dmg = 1
        dmg *= m.fieldHarmReduction
        // if (!tech.isFlipFlopOn && tech.isFlipFlopHealth) dmg *= 0.5
        if (tech.isZeno) dmg *= 0.15
        if (tech.isFieldHarmReduction) dmg *= 0.5
        if (tech.isHarmMACHO) dmg *= 0.4
        if (tech.isImmortal) dmg *= 0.66
        if (tech.isSlowFPS) dmg *= 0.8
        if (tech.energyRegen === 0) dmg *= 0.34
        if (tech.healthDrain) dmg *= 1 + 3.33 * tech.healthDrain //tech.healthDrain = 0.03 at one stack //cause more damage
        if (m.fieldMode === 0 || m.fieldMode === 3) dmg *= 0.73 ** m.coupling
        if (tech.isLowHealthDefense) dmg *= 1 - Math.max(0, 1 - m.health) * 0.8
        if (tech.isHarmReduceNoKill && m.lastKillCycle + 300 < m.cycle) dmg *= 0.33
        if (tech.squirrelFx !== 1) dmg *= 1 + (tech.squirrelFx - 1) / 5 //cause more damage
        if (tech.isAddBlockMass && m.isHolding) dmg *= 0.15
        if (tech.isSpeedHarm) dmg *= 1 - Math.min(player.speed * 0.0165, 0.66)
        if (tech.isHarmReduce && input.field && m.fieldCDcycle < m.cycle) dmg *= 0.25
        if (tech.isNeutronium && input.field && m.fieldCDcycle < m.cycle) dmg *= 0.1
        if (tech.isBotArmor) dmg *= 0.94 ** b.totalBots()
        if (tech.isHarmArmor && m.lastHarmCycle + 600 > m.cycle) dmg *= 0.33;
        if (tech.isNoFireDefense && m.cycle > m.fireCDcycle + 120) dmg *= 0.3
        if (tech.isTurret && m.crouch) dmg *= 0.34;
        if (tech.isEntanglement && b.inventory[0] === b.activeGun) {
            for (let i = 0, len = b.inventory.length; i < len; i++) dmg *= 0.87 // 1 - 0.15
        }
        return dmg
    },
    rewind(steps) { // m.rewind(Math.floor(Math.min(599, 137 * m.energy)))
        if (tech.isRewindGrenade) {
            const immunityDuration = 65
            const immunityCycle = m.cycle + immunityDuration + 10 + tech.isPetalsExplode * 30 + tech.isCircleExplode * 21
            if (m.immuneCycle < immunityCycle) m.immuneCycle = immunityCycle; //player is immune to damage until after grenades might explode...

            for (let i = 1, len = Math.floor(4 + steps / 40); i < len; i++) {
                b.grenade(Vector.add(m.pos, { x: 10 * (Math.random() - 0.5), y: 10 * (Math.random() - 0.5) }), -i * Math.PI / len) //fire different angles for each grenade
                const who = bullet[bullet.length - 1]

                if (tech.isNeutronBomb) {
                    Matter.Body.setVelocity(who, {
                        x: who.velocity.x * 0.3,
                        y: who.velocity.y * 0.3
                    });
                } else if (tech.isVacuumBomb) {
                    Matter.Body.setVelocity(who, {
                        x: who.velocity.x * 0.5,
                        y: who.velocity.y * 0.5
                    });
                    who.endCycle = simulation.cycle + immunityDuration

                } else if (tech.isRPG) {
                    who.endCycle = simulation.cycle + 10
                } else {
                    Matter.Body.setVelocity(who, {
                        x: who.velocity.x * 0.5,
                        y: who.velocity.y * 0.5
                    });
                    who.endCycle = simulation.cycle + immunityDuration
                }
            }
        }

        let history = m.history[(m.cycle - steps) % 600]
        Matter.Body.setPosition(player, history.position);
        Matter.Body.setVelocity(player, { x: history.velocity.x, y: history.velocity.y });
        m.yOff = history.yOff
        if (m.yOff < 48) {
            m.doCrouch()
        } else {
            m.undoCrouch()
        }

        // b.activeGun = history.activeGun
        // for (let i = 0; i < b.inventory.length; i++) {
        //     if (b.inventory[i] === b.activeGun) b.inventoryGun = i
        // }
        // simulation.updateGunHUD();
        // simulation.boldActiveGunHUD();

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
        m.energy = Math.max(m.energy - steps / 150, 0.01)
        if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles

        let isDrawPlayer = true
        const shortPause = function() {
            if (m.defaultFPSCycle < m.cycle) { //back to default values
                simulation.fpsCap = simulation.fpsCapDefault
                simulation.fpsInterval = 1000 / simulation.fpsCap;
                document.getElementById("dmg").style.transition = "opacity 1s";
                document.getElementById("dmg").style.opacity = "0";
            } else {
                requestAnimationFrame(shortPause);
                if (isDrawPlayer) {
                    isDrawPlayer = false
                    ctx.save();
                    ctx.globalCompositeOperation = "lighter";
                    ctx.translate(canvas.width2, canvas.height2); //center
                    ctx.scale(simulation.zoom / simulation.edgeZoomOutSmooth, simulation.zoom / simulation.edgeZoomOutSmooth); //zoom in once centered
                    ctx.translate(-canvas.width2 + m.transX, -canvas.height2 + m.transY); //translate
                    for (let i = 1; i < steps; i++) {
                        history = m.history[(m.cycle - i) % 600]
                        m.pos.x = history.position.x
                        m.pos.y = history.position.y + m.yPosDifference - history.yOff
                        m.yOff = history.yOff
                        m.draw();
                    }
                    ctx.restore();
                    m.resetHistory()
                }
            }
        };

        if (m.defaultFPSCycle < m.cycle) requestAnimationFrame(shortPause);
        simulation.fpsCap = 3 //1 is longest pause, 4 is standard
        simulation.fpsInterval = 1000 / simulation.fpsCap;
        m.defaultFPSCycle = m.cycle
        if (tech.isRewindBot) {
            const len = steps * 0.07 * tech.isRewindBot
            const botStep = Math.floor(steps / len)
            for (let i = 0; i < len; i++) {
                const where = m.history[Math.abs(m.cycle - i * botStep) % 600].position //spread out spawn locations along past history
                b.randomBot({
                    x: where.x + 20 * (Math.random() - 0.5),
                    y: where.y + 20 * (Math.random() - 0.5)
                }, false, false)
                bullet[bullet.length - 1].endCycle = simulation.cycle + 480 + Math.floor(120 * Math.random()) //8-10 seconds
            }
        }
    },
    collisionImmuneCycles: 30,
    damage(dmg) {
        // if (tech.isCouplingNoHit) {
        //     for (let i = 0, len = tech.tech.length; i < len; i++) {
        //         if (tech.tech[i].name === "fine-structure constant") powerUps.ejectTech(i, true)
        //     }
        // }
        if (tech.isRewindAvoidDeath && m.energy > 0.6 && dmg > 0.01) {
            const steps = Math.floor(Math.min(299, 150 * m.energy))
            simulation.makeTextLog(`<span class='color-var'>m</span>.rewind(${steps})`)
            m.rewind(steps)
            return
        }
        m.lastHarmCycle = m.cycle
        if (tech.isDroneOnDamage && bullet.length < 150) { //chance to build a drone on damage  from tech
            const len = Math.min((dmg - 0.06 * Math.random()) * 40, 40) / tech.droneEnergyReduction
            for (let i = 0; i < len; i++) {
                if (Math.random() < 0.5) b.drone({ x: m.pos.x + 30 * Math.cos(m.angle) + 100 * (Math.random() - 0.5), y: m.pos.y + 30 * Math.sin(m.angle) + 100 * (Math.random() - 0.5) }) //spawn drone
            }
        }

        if (tech.isEnergyHealth) {
            m.energy -= dmg
            if (m.energy < 0 || isNaN(m.energy)) { //taking deadly damage
                if (tech.isDeathAvoid && powerUps.research.count && !tech.isDeathAvoidedThisLevel) {
                    tech.isDeathAvoidedThisLevel = true
                    powerUps.research.changeRerolls(-1)
                    simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span><span class='color-symbol'>--</span><br>${powerUps.research.count}`)
                    for (let i = 0; i < 5; i++) powerUps.spawn(m.pos.x + 100 * (Math.random() - 0.5), m.pos.y + 100 * (Math.random() - 0.5), "heal", false);
                    m.energy = m.maxEnergy
                    if (m.immuneCycle < m.cycle + 300) m.immuneCycle = m.cycle + 300 //disable this.immuneCycle bonus seconds
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = "rgba(255,255,255,0.03)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    setTimeout(function() {
                        tech.maxDuplicationEvent()
                        simulation.wipe = function() { //set wipe to normal
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                    }, 3000);
                } else { //death
                    m.health = 0;
                    m.energy = 0;
                    m.death();
                }
                return;
            }
        } else {
            dmg *= m.harmReduction()
            m.health -= dmg;
            if (m.health < 0 || isNaN(m.health)) {
                if (tech.isDeathAvoid && powerUps.research.count > 0 && !tech.isDeathAvoidedThisLevel) { //&& Math.random() < 0.5
                    tech.isDeathAvoidedThisLevel = true
                    m.health = 0.05
                    powerUps.research.changeRerolls(-1)
                    simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-r'>research</span><span class='color-symbol'>--</span>
                    <br>${powerUps.research.count}`)
                    for (let i = 0; i < 5; i++) powerUps.spawn(m.pos.x + 100 * (Math.random() - 0.5), m.pos.y + 100 * (Math.random() - 0.5), "heal", false);
                    if (m.immuneCycle < m.cycle + 300) m.immuneCycle = m.cycle + 300 //disable this.immuneCycle bonus seconds
                    simulation.wipe = function() { //set wipe to have trails
                        ctx.fillStyle = "rgba(255,255,255,0.03)";
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    setTimeout(function() {
                        tech.maxDuplicationEvent()
                        simulation.wipe = function() { //set wipe to normal
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                    }, 3000);
                } else {
                    m.health = 0;
                    m.displayHealth();
                    m.death();
                    return;
                }
            }
            m.displayHealth();
            document.getElementById("dmg").style.transition = "opacity 0s";
            document.getElementById("dmg").style.opacity = 0.1 + Math.min(0.6, dmg * 4);
        }

        if (dmg > 0.03) {
            m.lastHit = dmg;
            if (dmg > 0.06 / m.holdingMassScale) m.drop(); //drop block if holding  // m.holdingMassScale = 0.5 for most fields
            if (m.isCloak) m.fireCDcycle = m.cycle //forced exit cloak
        }
        const normalFPS = function() {
            if (m.defaultFPSCycle < m.cycle) { //back to default values
                simulation.fpsCap = simulation.fpsCapDefault
                simulation.fpsInterval = 1000 / simulation.fpsCap;
                document.getElementById("dmg").style.transition = "opacity 1s";
                document.getElementById("dmg").style.opacity = "0";
            } else {
                requestAnimationFrame(normalFPS);
            }
        };

        if (m.defaultFPSCycle < m.cycle) requestAnimationFrame(normalFPS);
        if (tech.isSlowFPS) { // slow game 
            simulation.fpsCap = 30 //new fps
            simulation.fpsInterval = 1000 / simulation.fpsCap;
            //how long to wait to return to normal fps
            m.defaultFPSCycle = m.cycle + 20 + Math.min(90, Math.floor(200 * dmg))
            if (tech.isHarmFreeze) { //freeze all mobs
                for (let i = 0, len = mob.length; i < len; i++) {
                    mobs.statusSlow(mob[i], 450)
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
            m.defaultFPSCycle = m.cycle
        }
        // if (!noTransition) {
        //   document.getElementById("health").style.transition = "width 0s ease-out"
        // } else {
        //   document.getElementById("health").style.transition = "width 1s ease-out"
        // }
    },
    buttonCD: 0, //cool down for player buttons
    drawLeg(stroke) {
        // if (simulation.mouseInGame.x > m.pos.x) {
        if (m.angle > -Math.PI / 2 && m.angle < Math.PI / 2) {
            m.flipLegs = 1;
        } else {
            m.flipLegs = -1;
        }
        ctx.save();
        ctx.scale(m.flipLegs, 1); //leg lines
        ctx.beginPath();
        ctx.moveTo(m.hip.x, m.hip.y);
        ctx.lineTo(m.knee.x, m.knee.y);
        ctx.lineTo(m.foot.x, m.foot.y);
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 7;
        ctx.stroke();

        //toe lines
        ctx.beginPath();
        ctx.moveTo(m.foot.x, m.foot.y);
        ctx.lineTo(m.foot.x - 15, m.foot.y + 5);
        ctx.moveTo(m.foot.x, m.foot.y);
        ctx.lineTo(m.foot.x + 15, m.foot.y + 5);
        ctx.lineWidth = 4;
        ctx.stroke();

        //hip joint
        ctx.beginPath();
        ctx.arc(m.hip.x, m.hip.y, 11, 0, 2 * Math.PI);
        //knee joint
        ctx.moveTo(m.knee.x + 7, m.knee.y);
        ctx.arc(m.knee.x, m.knee.y, 7, 0, 2 * Math.PI);
        //foot joint
        ctx.moveTo(m.foot.x + 6, m.foot.y);
        ctx.arc(m.foot.x, m.foot.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = m.fillColor;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    },
    calcLeg(cycle_offset, offset) {
        m.hip.x = 12 + offset;
        m.hip.y = 24 + offset;
        //stepSize goes to zero if Vx is zero or not on ground (make m transition cleaner)
        m.stepSize = 0.8 * m.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(m.Vx))) * m.onGround);
        //changes to stepsize are smoothed by adding only a percent of the new value each cycle
        const stepAngle = 0.034 * m.walk_cycle + cycle_offset;
        m.foot.x = 2.2 * m.stepSize * Math.cos(stepAngle) + offset;
        m.foot.y = offset + 1.2 * m.stepSize * Math.sin(stepAngle) + m.yOff + m.height;
        const Ymax = m.yOff + m.height;
        if (m.foot.y > Ymax) m.foot.y = Ymax;

        //calculate knee position as intersection of circle from hip and foot
        const d = Math.sqrt((m.hip.x - m.foot.x) * (m.hip.x - m.foot.x) + (m.hip.y - m.foot.y) * (m.hip.y - m.foot.y));
        const l = (m.legLength1 * m.legLength1 - m.legLength2 * m.legLength2 + d * d) / (2 * d);
        const h = Math.sqrt(m.legLength1 * m.legLength1 - l * l);
        m.knee.x = (l / d) * (m.foot.x - m.hip.x) - (h / d) * (m.foot.y - m.hip.y) + m.hip.x + offset;
        m.knee.y = (l / d) * (m.foot.y - m.hip.y) + (h / d) * (m.foot.x - m.hip.x) + m.hip.y;
    },
    draw() {},
    drawFlipFlop() {
        ctx.fillStyle = m.fillColor;
        m.walk_cycle += m.flipLegs * m.Vx;

        //draw body
        ctx.save();
        ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.5
        ctx.translate(m.pos.x, m.pos.y);

        m.calcLeg(Math.PI, -3);
        m.drawLeg("#4a4a4a");
        m.calcLeg(0, 0);
        m.drawLeg("#333");

        ctx.rotate(m.angle);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.fillStyle = m.bodyGradient
        ctx.fill();
        ctx.arc(15, 0, 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
        //draw eye
        ctx.beginPath();
        ctx.arc(15, 0, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = m.eyeFillColor;
        ctx.fill()
        ctx.restore();

        m.yOff = m.yOff * 0.85 + m.yOffGoal * 0.15; //smoothly move leg height towards height goal
        powerUps.boost.draw()
    },
    drawDefault() {
        ctx.fillStyle = m.fillColor;
        m.walk_cycle += m.flipLegs * m.Vx;
        ctx.save();
        ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.5 //|| (m.cycle % 40 > 20)
        ctx.translate(m.pos.x, m.pos.y);
        m.calcLeg(Math.PI, -3);
        m.drawLeg("#4a4a4a");
        m.calcLeg(0, 0);
        m.drawLeg("#333");
        ctx.rotate(m.angle);
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.fillStyle = m.bodyGradient
        ctx.fill();
        ctx.arc(15, 0, 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        m.yOff = m.yOff * 0.85 + m.yOffGoal * 0.15; //smoothly move leg height towards height goal
        powerUps.boost.draw()
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
    coupling: 0,
    // these values are set on reset by setHoldDefaults()
    fieldFx: 1,
    fieldJump: 1,
    blockingRecoil: 4,
    grabPowerUpRange2: 0,
    isFieldActive: false,
    fieldRange: 155,
    fieldShieldingScale: 1,
    // fieldDamage: 1,
    isSneakAttack: false,
    lastHit: 0, //stores value of last damage player took above a threshold, in m.damage
    sneakAttackCycle: 0,
    enterCloakCycle: 0,
    duplicateChance: 0,
    energy: 0,
    fieldRegen: 0.001,
    fieldMode: 0,
    fieldFire: false,
    fieldHarmReduction: 1,
    holdingMassScale: 0,
    hole: {
        isOn: false,
        isReady: false,
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
        m.fieldThreshold = Math.cos((m.fieldArc) * Math.PI)
    },
    setHoldDefaults() {
        if (tech.isFreeWormHole && m.fieldUpgrades[m.fieldMode].name !== "wormhole") {
            const removed = tech.removeTech("charmed baryon") //neutronum can get player stuck so it has to be removed if player has wrong field
            if (removed) powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
        }
        if (tech.isNeutronium && m.fieldUpgrades[m.fieldMode].name !== "negative mass") {
            const removed = tech.removeTech("neutronium") //neutronum can get player stuck so it has to be removed if player has wrong field
            if (removed) powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
        }
        if (m.energy < m.maxEnergy) m.energy = m.maxEnergy;
        m.fieldMeterColor = "#0cf"
        m.eyeFillColor = m.fieldMeterColor
        m.fieldShieldingScale = 1;
        m.fieldBlockCD = 10;
        m.fieldHarmReduction = 1;
        m.lastHit = 0
        m.isSneakAttack = false
        m.duplicateChance = 0
        m.grabPowerUpRange2 = 156000;
        m.blockingRecoil = 4;
        m.fieldRange = 155;
        m.fieldFire = false;
        m.fieldCDcycle = 0;
        m.isCloak = false;
        player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
        m.airSpeedLimit = 125
        m.fieldFx = 1
        m.fieldJump = 1
        m.setFieldRegen();
        m.setMovement();
        m.drop();
        m.holdingMassScale = 0.5;
        m.fieldArc = 0.2; //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        m.calculateFieldThreshold(); //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        m.isBodiesAsleep = true;
        m.wakeCheck();
        m.setMaxEnergy();
        m.setMaxHealth();
        m.couplingChange()
        m.hole = {
            isOn: false,
            isReady: false,
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
        // (m.fieldMode === 0 || m.fieldMode === 1) * 0.4 * m.coupling +
        m.maxEnergy = (tech.isMaxEnergyTech ? 0.5 : 1) + tech.bonusEnergy + tech.healMaxEnergyBonus + tech.harmonicEnergy + 2 * tech.isGroundState + 3 * tech.isRelay * tech.isFlipFlopOn * tech.isRelayEnergy + 0.6 * (m.fieldUpgrades[m.fieldMode].name === "standing wave")
        // if (tech.isEnergyHealth) m.maxEnergy *= Math.sqrt(m.harmReduction())
        simulation.makeTextLog(`<span class='color-var'>m</span>.<span class='color-f'>maxEnergy</span> <span class='color-symbol'>=</span> ${(m.maxEnergy.toFixed(2))}`)
    },
    fieldMeterColor: "#0cf",
    drawRegenEnergy(bgColor = "rgba(0, 0, 0, 0.4)", range = 60) {
        if (m.energy < m.maxEnergy) {
            m.regenEnergy();
            ctx.fillStyle = bgColor;
            const xOff = m.pos.x - m.radius * m.maxEnergy
            const yOff = m.pos.y - 50
            ctx.fillRect(xOff, yOff, range * m.maxEnergy, 10);
            ctx.fillStyle = m.fieldMeterColor;
            ctx.fillRect(xOff, yOff, range * m.energy, 10);
        } else if (m.energy > m.maxEnergy + 0.05) {
            ctx.fillStyle = bgColor;
            const xOff = m.pos.x - m.radius * m.energy
            const yOff = m.pos.y - 50
            // ctx.fillRect(xOff, yOff, range * m.maxEnergy, 10);
            ctx.fillStyle = m.fieldMeterColor;
            ctx.fillRect(xOff, yOff, range * m.energy, 10);
        }
    },
    drawRegenEnergyCloaking: function() {
        if (m.energy < m.maxEnergy) { // replaces m.drawRegenEnergy() with custom code
            m.regenEnergy();
            const xOff = m.pos.x - m.radius * m.maxEnergy
            const yOff = m.pos.y - 50
            ctx.fillStyle = "rgba(0, 0, 0, 0.2)" //
            ctx.fillRect(xOff, yOff, 60 * m.maxEnergy, 10);
            ctx.fillStyle = "#fff" //m.cycle > m.lastKillCycle + 300 ? "#000" : "#fff" //"#fff";
            ctx.fillRect(xOff, yOff, 60 * m.energy, 10);
            ctx.beginPath()
            ctx.rect(xOff, yOff, 60 * m.maxEnergy, 10);
            ctx.strokeStyle = m.fieldMeterColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },
    setFieldRegen() {
        if (m.fieldMode === 6) {
            m.fieldRegen = 0.003 //18 energy per second
        } else if (m.fieldMode === 4) {
            m.fieldRegen = 0.002 //12 energy per second
        } else {
            m.fieldRegen = 0.001 //6 energy per second
        }
        if (m.fieldMode === 0 || m.fieldMode === 4) m.fieldRegen += 0.001 * m.coupling
        if (tech.isTimeCrystals) {
            m.fieldRegen *= 3
        } else if (tech.isGroundState) {
            m.fieldRegen *= 0.5
        }
    },
    regenEnergy: function() { //used in drawRegenEnergy  // rewritten by some tech
        if (m.immuneCycle < m.cycle) m.energy += m.fieldRegen;
        if (m.energy < 0) m.energy = 0
    },
    regenEnergyDefault: function() {
        if (m.immuneCycle < m.cycle) m.energy += m.fieldRegen;
        if (m.energy < 0) m.energy = 0
    },
    lookingAt(who) {
        //calculate a vector from body to player and make it length 1
        const diff = Vector.normalise(Vector.sub(who.position, m.pos));
        //make a vector for the player's direction of length 1
        const dir = {
            x: Math.cos(m.angle),
            y: Math.sin(m.angle)
        };
        //the dot product of diff and dir will return how much over lap between the vectors
        if (Vector.dot(dir, diff) > m.fieldThreshold) {
            return true;
        }
        return false;
    },
    drop() {
        if (m.isHolding) {
            m.fieldCDcycle = m.cycle + 15;
            m.isHolding = false;
            m.throwCharge = 0;
            m.definePlayerMass()
        }
        if (m.holdingTarget) {
            m.holdingTarget.collisionFilter.category = cat.body;
            m.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
            m.holdingTarget = null;
        }
    },
    definePlayerMass(mass = m.defaultMass) {
        Matter.Body.setMass(player, mass);
        //reduce air and ground move forces
        m.setMovement()
        // m.Fx = 0.08 / mass * tech.squirrelFx //base player mass is 5
        // m.FxAir = 0.4 / mass / mass //base player mass is 5
        //make player stand a bit lower when holding heavy masses
        m.yOffWhen.stand = Math.max(m.yOffWhen.crouch, Math.min(49, 49 - (mass - 5) * 6))
        if (m.onGround && !m.crouch) m.yOffGoal = m.yOffWhen.stand;
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
                m.pos.x + eye * Math.cos(m.angle),
                m.pos.y + eye * Math.sin(m.angle)
            );
            ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
            ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
            ctx.fill();
            if (stroke) ctx.stroke();
            for (let i = 0; i < len; i++) {
                ctx.beginPath();
                ctx.moveTo(
                    m.pos.x + eye * Math.cos(m.angle),
                    m.pos.y + eye * Math.sin(m.angle)
                );
                ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
                ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
                ctx.fill();
                if (stroke) ctx.stroke();
            }
        }
    },
    holding() {
        if (m.fireCDcycle < m.cycle) m.fireCDcycle = m.cycle - 1
        if (m.holdingTarget) {
            m.energy -= m.fieldRegen;
            if (m.energy < 0) m.energy = 0;
            Matter.Body.setPosition(m.holdingTarget, {
                x: m.pos.x + 70 * Math.cos(m.angle),
                y: m.pos.y + 70 * Math.sin(m.angle)
            });
            Matter.Body.setVelocity(m.holdingTarget, player.velocity);
            Matter.Body.rotate(m.holdingTarget, 0.01 / m.holdingTarget.mass); //gently spin the block
        } else {
            m.isHolding = false
        }
    },
    throwBlock() {
        if (m.holdingTarget) {
            if (input.field) {
                if (m.energy > 0.001) {
                    if (m.fireCDcycle < m.cycle) m.fireCDcycle = m.cycle
                    if (tech.isCapacitor && m.throwCharge < 4) m.throwCharge = 4
                    m.throwCharge += 0.5 / m.holdingTarget.mass / b.fireCDscale

                    if (m.throwCharge < 6) m.energy -= 0.001 / b.fireCDscale; // m.throwCharge caps at 5 

                    //trajectory path prediction
                    if (tech.isTokamak) {
                        //draw charge
                        const x = m.pos.x + 15 * Math.cos(m.angle);
                        const y = m.pos.y + 15 * Math.sin(m.angle);
                        const len = m.holdingTarget.vertices.length - 1;
                        const opacity = m.throwCharge > 4 ? 0.65 : m.throwCharge * 0.06
                        ctx.fillStyle = `rgba(255,0,255,${opacity})`;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(m.holdingTarget.vertices[len].x, m.holdingTarget.vertices[len].y);
                        ctx.lineTo(m.holdingTarget.vertices[0].x, m.holdingTarget.vertices[0].y);
                        ctx.fill();
                        for (let i = 0; i < len; i++) {
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(m.holdingTarget.vertices[i].x, m.holdingTarget.vertices[i].y);
                            ctx.lineTo(m.holdingTarget.vertices[i + 1].x, m.holdingTarget.vertices[i + 1].y);
                            ctx.fill();
                        }
                    } else {
                        //draw charge
                        const x = m.pos.x + 15 * Math.cos(m.angle);
                        const y = m.pos.y + 15 * Math.sin(m.angle);
                        const len = m.holdingTarget.vertices.length - 1;
                        const edge = m.throwCharge * m.throwCharge * m.throwCharge;
                        const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
                        grd.addColorStop(0, "rgba(255,50,150,0.3)");
                        grd.addColorStop(1, "transparent");
                        ctx.fillStyle = grd;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(m.holdingTarget.vertices[len].x, m.holdingTarget.vertices[len].y);
                        ctx.lineTo(m.holdingTarget.vertices[0].x, m.holdingTarget.vertices[0].y);
                        ctx.fill();
                        for (let i = 0; i < len; i++) {
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(m.holdingTarget.vertices[i].x, m.holdingTarget.vertices[i].y);
                            ctx.lineTo(m.holdingTarget.vertices[i + 1].x, m.holdingTarget.vertices[i + 1].y);
                            ctx.fill();
                        }
                        //trajectory prediction
                        const cycles = 30
                        const charge = Math.min(m.throwCharge / 5, 1)
                        const speed = 80 * charge * Math.min(0.85, 0.8 / Math.pow(m.holdingTarget.mass, 0.25));
                        const v = { x: speed * Math.cos(m.angle), y: speed * Math.sin(m.angle) } //m.Vy / 2 + removed to make the path less jerky
                        ctx.beginPath()
                        for (let i = 1, len = 10; i < len + 1; i++) {
                            const time = cycles * i / len
                            ctx.lineTo(m.pos.x + time * v.x, m.pos.y + time * v.y + 0.34 * time * time)
                        }
                        ctx.strokeStyle = "rgba(68, 68, 68, 0.15)" //color.map
                        ctx.lineWidth = 2
                        ctx.stroke()
                    }
                } else {
                    m.drop()
                }
            } else if (m.throwCharge > 0) { //Matter.Query.region(mob, player.bounds)
                //throw the body
                m.fieldCDcycle = m.cycle + 15;
                m.isHolding = false;

                if (tech.isTokamak && m.throwCharge > 4) { //remove the block body and pulse  in the direction you are facing
                    //m.throwCharge > 5 seems to be when the field full colors in a block you are holding
                    m.throwCycle = m.cycle + 180 //used to detect if a block was thrown in the last 3 seconds
                    if (m.immuneCycle < m.cycle) m.energy += 0.25 * Math.sqrt(m.holdingTarget.mass) * Math.min(5, m.throwCharge)
                    m.throwCharge = 0;
                    m.definePlayerMass() //return to normal player mass
                    //remove block before pulse, so it doesn't get in the way
                    for (let i = 0; i < body.length; i++) {
                        if (body[i] === m.holdingTarget) {
                            Matter.Composite.remove(engine.world, body[i]);
                            body.splice(i, 1);
                        }
                    }
                    b.pulse(60 * Math.pow(m.holdingTarget.mass, 0.25), m.angle)
                } else { //normal throw
                    //bullet-like collisions
                    m.holdingTarget.collisionFilter.category = cat.bullet
                    m.holdingTarget.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield;
                    if (tech.isBlockRestitution) {
                        m.holdingTarget.restitution = 0.999 //extra bouncy
                        m.holdingTarget.friction = m.holdingTarget.frictionStatic = m.holdingTarget.frictionAir = 0.001
                    }
                    //check every second to see if player is away from thrown body, and make solid
                    const solid = function(that) {
                        const dx = that.position.x - player.position.x;
                        const dy = that.position.y - player.position.y;
                        if (that.speed < 3 && dx * dx + dy * dy > 10000 && that !== m.holdingTarget) {
                            that.collisionFilter.category = cat.body; //make solid
                            that.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet; //can hit player now
                        } else {
                            setTimeout(solid, 40, that);
                        }
                    };
                    setTimeout(solid, 200, m.holdingTarget);

                    const charge = Math.min(m.throwCharge / 5, 1)
                    //***** scale throw speed with the first number, 80 *****
                    let speed = 80 * charge * Math.min(0.85, 0.8 / Math.pow(m.holdingTarget.mass, 0.25));
                    if (Matter.Query.collides(m.holdingTarget, map).length !== 0) {
                        speed *= 0.7 //drop speed by 30% if touching map
                        if (Matter.Query.ray(map, m.holdingTarget.position, m.pos).length !== 0) speed = 0 //drop to zero if the center of the block can't see the center of the player through the map
                    }
                    m.throwCharge = 0;
                    m.throwCycle = m.cycle + 180 //used to detect if a block was thrown in the last 3 seconds
                    Matter.Body.setVelocity(m.holdingTarget, {
                        x: player.velocity.x * 0.5 + Math.cos(m.angle) * speed,
                        y: player.velocity.y * 0.5 + Math.sin(m.angle) * speed
                    });
                    Matter.Body.setVelocity(player, {
                        x: player.velocity.x - Math.cos(m.angle) * speed / (m.crouch ? 30 : 10) * Math.sqrt(m.holdingTarget.mass),
                        y: player.velocity.y - Math.sin(m.angle) * speed / 30 * Math.sqrt(m.holdingTarget.mass)
                    });
                    m.definePlayerMass() //return to normal player mass

                    if (tech.isAddBlockMass) {
                        const expand = function(that, massLimit) {
                            if (that.mass < massLimit) {
                                const scale = 1.05;
                                Matter.Body.scale(that, scale, scale);
                                setTimeout(expand, 20, that, massLimit);
                            }
                        };
                        expand(m.holdingTarget, Math.min(20, m.holdingTarget.mass * 3))
                    }
                }
            }
        } else {
            m.isHolding = false
        }
    },
    drawField() {
        if (m.holdingTarget) {
            ctx.fillStyle = "rgba(110,170,200," + (m.energy * (0.05 + 0.05 * Math.random())) + ")";
            ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
        } else {
            ctx.fillStyle = "rgba(110,170,200," + (0.02 + m.energy * (0.15 + 0.15 * Math.random())) + ")";
            ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
        }
        // const off = 2 * Math.cos(simulation.cycle * 0.1)
        const range = m.fieldRange;
        ctx.beginPath();
        ctx.arc(m.pos.x, m.pos.y, range, m.angle - Math.PI * m.fieldArc, m.angle + Math.PI * m.fieldArc, false);
        ctx.lineWidth = 2;
        ctx.stroke();
        let eye = 13;
        let aMag = 0.75 * Math.PI * m.fieldArc
        let a = m.angle + aMag
        let cp1x = m.pos.x + 0.6 * range * Math.cos(a)
        let cp1y = m.pos.y + 0.6 * range * Math.sin(a)
        ctx.quadraticCurveTo(cp1x, cp1y, m.pos.x + eye * Math.cos(m.angle), m.pos.y + eye * Math.sin(m.angle))
        a = m.angle - aMag
        cp1x = m.pos.x + 0.6 * range * Math.cos(a)
        cp1y = m.pos.y + 0.6 * range * Math.sin(a)
        ctx.quadraticCurveTo(cp1x, cp1y, m.pos.x + 1 * range * Math.cos(m.angle - Math.PI * m.fieldArc), m.pos.y + 1 * range * Math.sin(m.angle - Math.PI * m.fieldArc))
        ctx.fill();
        // ctx.lineTo(m.pos.x + eye * Math.cos(m.angle), m.pos.y + eye * Math.sin(m.angle));

        //draw random lines in field for cool effect
        let offAngle = m.angle + 1.7 * Math.PI * m.fieldArc * (Math.random() - 0.5);
        ctx.beginPath();
        eye = 15;
        ctx.moveTo(m.pos.x + eye * Math.cos(m.angle), m.pos.y + eye * Math.sin(m.angle));
        ctx.lineTo(m.pos.x + range * Math.cos(offAngle), m.pos.y + range * Math.sin(offAngle));
        ctx.strokeStyle = "rgba(120,170,255,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
    },
    grabPowerUp() { //look for power ups to grab with field
        if (m.fireCDcycle < m.cycle) m.fireCDcycle = m.cycle - 1
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            const dxP = m.pos.x - powerUp[i].position.x;
            const dyP = m.pos.y - powerUp[i].position.y;
            const dist2 = dxP * dxP + dyP * dyP + 10;
            // float towards player  if looking at and in range  or  if very close to player
            if (
                dist2 < m.grabPowerUpRange2 &&
                (m.lookingAt(powerUp[i]) || dist2 < 16000) &&
                Matter.Query.ray(map, powerUp[i].position, m.pos).length === 0
            ) {
                powerUp[i].force.x += 0.05 * (dxP / Math.sqrt(dist2)) * powerUp[i].mass;
                powerUp[i].force.y += 0.05 * (dyP / Math.sqrt(dist2)) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                //extra friction
                Matter.Body.setVelocity(powerUp[i], {
                    x: powerUp[i].velocity.x * 0.11,
                    y: powerUp[i].velocity.y * 0.11
                });
                if ( //use power up if it is close enough
                    dist2 < 5000 &&
                    !simulation.isChoosing &&
                    (powerUp[i].name !== "heal" || m.health !== m.maxHealth || tech.isOverHeal)
                ) {
                    powerUps.onPickUp(powerUp[i]);
                    Matter.Body.setVelocity(player, { //player knock back, after grabbing power up
                        x: player.velocity.x + powerUp[i].velocity.x / player.mass * 5,
                        y: player.velocity.y + powerUp[i].velocity.y / player.mass * 5
                    });
                    powerUp[i].effect();
                    Matter.Composite.remove(engine.world, powerUp[i]);
                    powerUp.splice(i, 1);
                    return; //because the array order is messed up after splice
                }
            }
        }
    },
    pushMass(who, fieldBlockCost = (0.025 + Math.sqrt(who.mass) * Vector.magnitude(Vector.sub(who.velocity, player.velocity)) * 0.002) * m.fieldShieldingScale) {
        if (m.energy > fieldBlockCost * 0.2) { //shield needs at least some of the cost to block
            m.energy -= fieldBlockCost
            if (m.energy < 0) m.energy = 0;
            m.fieldCDcycle = m.cycle + m.fieldBlockCD;
            if (!who.isInvulnerable && (m.coupling && m.fieldMode < 3) && bullet.length < 250) { //for standing wave mostly
                for (let i = 0; i < m.coupling; i++) {
                    if (m.coupling - i > Math.random()) {
                        const sub = Vector.mult(Vector.normalise(Vector.sub(who.position, m.pos)), (m.fieldRange * m.harmonicRadius) * (0.4 + 0.3 * Math.random())) //m.harmonicRadius should be 1 unless you are standing wave expansion
                        const rad = Vector.rotate(sub, 1 * (Math.random() - 0.5))
                        const angle = Math.atan2(sub.y, sub.x)
                        b.iceIX(6 + 6 * Math.random(), angle + 3 * (Math.random() - 0.5), Vector.add(m.pos, rad))
                    }
                }

                // let count = 0
                // for(let j=0; j<100;j++){
                //     const len = m.coupling + 0.5 * (Math.random() - 0.5)
                //     for (let i = 0; i < len; i++) {
                //         count++
                //     }
                // }
                // console.log(count)

            }
            const unit = Vector.normalise(Vector.sub(player.position, who.position))
            if (tech.blockDmg) {
                Matter.Body.setVelocity(who, { x: 0.5 * who.velocity.x, y: 0.5 * who.velocity.y });

                if (who.isShielded) {
                    for (let i = 0, len = mob.length; i < len; i++) {
                        if (mob[i].id === who.shieldID) mob[i].damage(tech.blockDmg * m.dmgScale * (tech.isBlockRadiation ? 6 : 2), true)
                    }
                } else if (tech.isBlockRadiation) {
                    if (who.isMobBullet) {
                        who.damage(tech.blockDmg * m.dmgScale * 3, true)
                    } else {
                        mobs.statusDoT(who, tech.blockDmg * m.dmgScale * 4 / 12, 360) //200% increase -> x (1+2) //over 7s -> 360/30 = 12 half seconds -> 3/12
                    }
                } else {
                    who.damage(tech.blockDmg * m.dmgScale, true)
                }

                //draw electricity
                const step = 40
                ctx.beginPath();
                for (let i = 0, len = 0.8 * tech.blockDmg; i < len; i++) {
                    let x = m.pos.x - 20 * unit.x;
                    let y = m.pos.y - 20 * unit.y;
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
                m.drawHold(who);
            }
            // if (tech.isFreezeMobs) mobs.statusSlow(who, 60) //this works but doesn't have a fun effect
            if (tech.isStunField) mobs.statusStun(who, tech.isStunField)
            // m.holdingTarget = null
            //knock backs
            const massRoot = Math.sqrt(Math.min(12, Math.max(0.15, who.mass))); // masses above 12 can start to overcome the push back
            Matter.Body.setVelocity(who, {
                x: player.velocity.x - (15 * unit.x) / massRoot,
                y: player.velocity.y - (15 * unit.y) / massRoot
            });
            if (who.isUnstable) {
                if (m.fieldCDcycle < m.cycle + 30) m.fieldCDcycle = m.cycle + 10
                who.death();
            }

            if (m.crouch) {
                Matter.Body.setVelocity(player, {
                    x: player.velocity.x + 0.1 * m.blockingRecoil * unit.x * massRoot,
                    y: player.velocity.y + 0.1 * m.blockingRecoil * unit.y * massRoot
                });
            } else {
                Matter.Body.setVelocity(player, {
                    x: player.velocity.x + m.blockingRecoil * unit.x * massRoot,
                    y: player.velocity.y + m.blockingRecoil * unit.y * massRoot
                });
            }
        }
    },
    pushMobsFacing() { // find mobs in range and in direction looking
        for (let i = 0, len = mob.length; i < len; ++i) {
            if (
                Vector.magnitude(Vector.sub(mob[i].position, m.pos)) - mob[i].radius < m.fieldRange &&
                m.lookingAt(mob[i]) &&
                !mob[i].isUnblockable &&
                Matter.Query.ray(map, mob[i].position, m.pos).length === 0
            ) {
                mob[i].locatePlayer();
                m.pushMass(mob[i]);
                if (mob[i].isShielded) {
                    m.fieldCDcycle = m.cycle + 60
                } else if (tech.deflectEnergy && !mob[i].isInvulnerable) {
                    m.energy += tech.deflectEnergy
                }
            }
        }
    },
    lookForPickUp() { //find body to pickup
        const grabbing = {
            targetIndex: null,
            targetRange: 150,
            // lookingAt: false //false to pick up object in range, but not looking at
        };
        for (let i = 0, len = body.length; i < len; ++i) {
            if (Matter.Query.ray(map, body[i].position, m.pos).length === 0) {
                //is m next body a better target then my current best
                const dist = Vector.magnitude(Vector.sub(body[i].position, m.pos));
                const looking = m.lookingAt(body[i]);
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
            m.holdingTarget = body[grabbing.targetIndex];
            //
            ctx.beginPath(); //draw on each valid body
            let vertices = m.holdingTarget.vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            ctx.lineTo(vertices[0].x, vertices[0].y);
            ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
            ctx.fill();

            ctx.globalAlpha = 0.2;
            m.drawHold(m.holdingTarget);
            ctx.globalAlpha = 1;
        } else {
            m.holdingTarget = null;
        }
    },
    pickUp() {
        //triggers when a hold target exits and field button is released
        m.isHolding = true;
        //conserve momentum when player mass changes
        totalMomentum = Vector.add(Vector.mult(player.velocity, player.mass), Vector.mult(m.holdingTarget.velocity, m.holdingTarget.mass))
        Matter.Body.setVelocity(player, Vector.mult(totalMomentum, 1 / (m.defaultMass + m.holdingTarget.mass)));

        m.definePlayerMass(m.defaultMass + m.holdingTarget.mass * m.holdingMassScale)
        //make block collide with nothing
        m.holdingTarget.collisionFilter.category = 0;
        m.holdingTarget.collisionFilter.mask = 0;
    },
    wakeCheck() {
        if (m.isBodiesAsleep) {
            m.isBodiesAsleep = false;

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
            // if (tech.isFreezeMobs) {
            //     for (let i = 0, len = mob.length; i < len; ++i) {
            //         const ICE_DRAIN = 0.0005
            //         if (m.energy > ICE_DRAIN) m.energy -= ICE_DRAIN;
            //         Matter.Sleeping.set(mob[i], false)
            //         mobs.statusSlow(mob[i], 60)
            //     }
            // } else {
            //     wake(mob);
            // }
            wake(mob);
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
    couplingDescription(couple = m.coupling) {
        switch (m.fieldMode) {
            case 0: //field emitter
                return `gain the <strong class='color-coupling'>coupling</strong> effects of <strong>all</strong> <strong class='color-f'>fields</strong>`
            case 1: //standing wave
                return `<span style = 'font-size:95%;'><strong>deflecting</strong> condenses +${couple.toFixed(1)} <strong class='color-s'>ice IX</strong></span>`
            case 2: //perfect diamagnetism
                return `<span style = 'font-size:95%;'><strong>deflecting</strong> condenses +${couple.toFixed(1)} <strong class='color-s'>ice IX</strong></span>`
                // return `<span style = 'font-size:89%;'><strong>invulnerable</strong> <strong>+${2*couple}</strong> seconds post collision</span>`
            case 3: //negative mass
                return `<strong>+${((1-0.73 ** couple)*100).toFixed(1)}%</strong> <strong class='color-defense'>defense</strong>`
            case 4: //assembler
                return `generate <strong>${(6*couple).toFixed(0)}</strong> <strong class='color-f'>energy</strong> per second`
            case 5: //plasma
                return `<strong>+${(15*couple).toFixed(0)}%</strong> <strong class='color-d'>damage</strong>`
            case 6: //time dilation
                return `<strong>+${(30*couple).toFixed(0)}%</strong> longer <strong style='letter-spacing: 2px;'>stopped time</strong>` //<strong>movement</strong>, <strong>jumping</strong>, and 
            case 7: //cloaking
                return `<strong>+${(33*couple).toFixed(0)}%</strong> ambush <strong class='color-d'>damage</strong>`
            case 8: //pilot wave
                return `<strong>+${(40*couple).toFixed(0)}%</strong> <strong class='color-block'>block</strong> collision <strong class='color-d'>damage</strong>`
            case 9: //wormhole
                return `<span style = 'font-size:89%;'>after eating <strong class='color-block'>blocks</strong> <strong>+${(20*couple).toFixed(0)}</strong> <strong class='color-f'>energy</strong></span>`
        }
    },
    couplingChange(change = 0) {
        if (change > 0) simulation.makeTextLog(`m.coupling <span class='color-symbol'>+=</span> ${change}`, 60);
        m.coupling += change
        if (m.coupling < 0) m.coupling = 0 //can't go negative
        // m.setMaxEnergy();
        // m.setMaxHealth();
        m.setFieldRegen()
        mobs.setMobSpawnHealth();
        powerUps.setDupChance();

        if ((m.fieldMode === 0 || m.fieldMode === 9) && !build.isExperimentSelection && !simulation.isTextLogOpen) simulation.circleFlare(0.4);
        // m.collisionImmuneCycles = 30 + m.coupling * 120 //2 seconds
        // switch (m.fieldMode) {
        //     case 0: //field emitter
        //         // m.fieldFireRate = 0.8 ** (m.coupling)
        //         // b.setFireCD();
        //         break
        //         // case 1: //standing wave
        //         //     break
        //         // case 2: //perfect diamagnetism
        //         //     break
        //         // case 3: //negative mass
        //         //     break
        //         // case 4: //assembler
        //         //     break
        //         // case 5: //plasma
        //         //     break
        //     case 6: //time dilation
        //         // m.fieldFireRate = 0.75 * 0.8 ** (m.coupling)
        //         break
        //         // case 7: //cloaking
        //         //     break
        //         // case 8: //pilot wave
        //         //     break
        //         // case 9: //wormhole
        //         //     break
        // }
    },
    setField(index) {
        if (isNaN(index)) { //find index by name
            let found = false
            for (let i = 0; i < m.fieldUpgrades.length; i++) {
                if (index === m.fieldUpgrades[i].name) {
                    index = i;
                    found = true;
                    break;
                }
            }
            if (!found) return //if you can't find the field don't give a field to avoid game crash
        }
        m.fieldMode = index;
        document.getElementById("field").innerHTML = m.fieldUpgrades[index].name
        m.setHoldDefaults();
        m.fieldUpgrades[index].effect();
        simulation.makeTextLog(`<span class='color-var'>m</span>.setField("<span class='color-text'>${m.fieldUpgrades[m.fieldMode].name}</span>")`);
    },
    fieldUpgrades: [{
            name: "field emitter",
            description: `use <strong class='color-f'>energy</strong> to <strong>deflect</strong> mobs
            <br><strong>100</strong> max <strong class='color-f'>energy</strong>
            <br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second`,
            effect: () => {
                m.hold = function() {
                    if (m.isHolding) {
                        m.drawHold(m.holdingTarget);
                        m.holding();
                        m.throwBlock();
                    } else if ((input.field && m.fieldCDcycle < m.cycle)) { //not hold but field button is pressed
                        if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                        m.grabPowerUp();
                        m.lookForPickUp();
                        if (m.energy > 0.05) {
                            m.drawField();
                            m.pushMobsFacing();
                        }
                    } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                        m.pickUp();
                    } else {
                        m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    m.drawRegenEnergy()
                }
            }
        },
        {
            name: "standing wave",
            //<strong>deflecting</strong> protects you in every <strong>direction</strong>
            description: `<strong>3</strong> oscillating <strong>shields</strong> are permanently active
            <br><strong>+60</strong> max <strong class='color-f'>energy</strong>
            <br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second`,
            drainCD: 0,
            effect: () => {
                m.fieldBlockCD = 0;
                m.blockingRecoil = 2 //4 is normal
                m.fieldRange = 175
                m.fieldShieldingScale = (tech.isStandingWaveExpand ? 0.9 : 1.3) * Math.pow(0.6, (tech.harmonics - 2))
                // m.fieldHarmReduction = 0.66; //33% reduction

                m.harmonic3Phase = () => { //normal standard 3 different 2-d circles
                    const fieldRange1 = (0.75 + 0.3 * Math.sin(m.cycle / 23)) * m.fieldRange * m.harmonicRadius
                    const fieldRange2 = (0.68 + 0.37 * Math.sin(m.cycle / 37)) * m.fieldRange * m.harmonicRadius
                    const fieldRange3 = (0.7 + 0.35 * Math.sin(m.cycle / 47)) * m.fieldRange * m.harmonicRadius
                    const netfieldRange = Math.max(fieldRange1, fieldRange2, fieldRange3)
                    ctx.fillStyle = "rgba(110,170,200," + Math.min(0.6, (0.04 + m.energy * (0.1 + 0.11 * Math.random()))) + ")";
                    ctx.beginPath();
                    ctx.arc(m.pos.x, m.pos.y, fieldRange1, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(m.pos.x, m.pos.y, fieldRange2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(m.pos.x, m.pos.y, fieldRange3, 0, 2 * Math.PI);
                    ctx.fill();
                    //360 block
                    for (let i = 0, len = mob.length; i < len; ++i) {
                        if (Vector.magnitude(Vector.sub(mob[i].position, m.pos)) - mob[i].radius < netfieldRange && !mob[i].isUnblockable) { // && Matter.Query.ray(map, mob[i].position, m.pos).length === 0
                            mob[i].locatePlayer();
                            if (this.drainCD > m.cycle) {
                                m.pushMass(mob[i], 0);
                            } else {
                                m.pushMass(mob[i]);
                                this.drainCD = m.cycle + 15
                            }
                            if (mob[i].isShielded || mob[i].shield) m.fieldCDcycle = m.cycle + 20
                        }
                    }
                }
                m.harmonicRadius = 1 //for smoothing function when player holds mouse (for harmonicAtomic)
                m.harmonicAtomic = () => { //several ellipses spinning about different axises
                    const rotation = simulation.cycle * 0.0031
                    const phase = simulation.cycle * 0.023
                    const radius = m.fieldRange * m.harmonicRadius
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "rgba(110,170,200,0.8)"
                    ctx.fillStyle = "rgba(110,170,200," + Math.min(0.6, m.energy * (0.11 + 0.1 * Math.random()) * (3 / tech.harmonics)) + ")";
                    // ctx.fillStyle = "rgba(110,170,200," + Math.min(0.7, m.energy * (0.22 - 0.01 * tech.harmonics) * (0.5 + 0.5 * Math.random())) + ")";
                    for (let i = 0; i < tech.harmonics; i++) {
                        ctx.beginPath();
                        ctx.ellipse(m.pos.x, m.pos.y, radius * Math.abs(Math.sin(phase + i / tech.harmonics * Math.PI)), radius, rotation + i / tech.harmonics * Math.PI, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.stroke();
                    }
                    //360 block
                    for (let i = 0, len = mob.length; i < len; ++i) {
                        if (Vector.magnitude(Vector.sub(mob[i].position, m.pos)) - mob[i].radius < radius && !mob[i].isUnblockable) { // && Matter.Query.ray(map, mob[i].position, m.pos).length === 0
                            mob[i].locatePlayer();
                            if (this.drainCD > m.cycle) {
                                m.pushMass(mob[i], 0);
                            } else {
                                m.pushMass(mob[i]);
                                this.drainCD = m.cycle + 15
                            }
                        }
                    }
                }
                if (tech.harmonics === 2) {
                    m.harmonicShield = m.harmonic3Phase
                } else {
                    m.harmonicShield = m.harmonicAtomic
                }
                m.hold = function() {
                    if (m.isHolding) {
                        m.drawHold(m.holdingTarget);
                        m.holding();
                        m.throwBlock();
                    } else if ((input.field) && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
                        if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                        m.grabPowerUp();
                        m.lookForPickUp();
                    } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                        m.pickUp();
                    } else {
                        m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    if (m.energy > 0.1 && m.fieldCDcycle < m.cycle) {
                        if (tech.isStandingWaveExpand) {
                            if (input.field) {
                                // const oldHarmonicRadius = m.harmonicRadius
                                m.harmonicRadius = 0.99 * m.harmonicRadius + 0.01 * 4
                                // m.energy -= 0.1 * (m.harmonicRadius - oldHarmonicRadius)
                            } else {
                                m.harmonicRadius = 0.994 * m.harmonicRadius + 0.006
                            }
                        }
                        if (!simulation.isTimeSkipping) m.harmonicShield()
                    }
                    m.drawRegenEnergy()
                }
            }
        },
        {
            name: "perfect diamagnetism",
            description: "<strong>deflecting</strong> does not drain <strong class='color-f'>energy</strong><br>maintains <strong>functionality</strong> while <strong>inactive</strong><br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second",
            // <br><strong>attract</strong> power ups from <strong>far away</strong>
            // description: "<strong>attract</strong> power ups from <strong>far away</strong><br><strong>deflecting</strong> doesn't drain <strong class='color-f'>energy</strong><br>thrown <strong class='color-block'>blocks</strong> have",
            // description: "gain <strong class='color-f'>energy</strong> when <strong>blocking</strong><br>no <strong>recoil</strong> when <strong>blocking</strong>",
            effect: () => {
                m.fieldMeterColor = "#48f" //"#0c5"
                m.eyeFillColor = m.fieldMeterColor

                m.fieldShieldingScale = 0;
                m.fieldBlockCD = 3;
                m.grabPowerUpRange2 = 10000000
                m.fieldPosition = { x: m.pos.x, y: m.pos.y }
                m.fieldAngle = m.angle
                m.perfectPush = (isFree = false) => {
                    if (m.fieldCDcycle < m.cycle) {
                        for (let i = 0, len = mob.length; i < len; ++i) {
                            if (
                                Vector.magnitude(Vector.sub(mob[i].position, m.fieldPosition)) - mob[i].radius < m.fieldRange &&
                                !mob[i].isUnblockable &&
                                Vector.dot({ x: Math.cos(m.fieldAngle), y: Math.sin(m.fieldAngle) }, Vector.normalise(Vector.sub(mob[i].position, m.fieldPosition))) > m.fieldThreshold &&
                                Matter.Query.ray(map, mob[i].position, m.fieldPosition).length === 0
                            ) {
                                mob[i].locatePlayer();
                                const unit = Vector.normalise(Vector.sub(m.fieldPosition, mob[i].position))
                                m.fieldCDcycle = m.cycle + m.fieldBlockCD + (mob[i].isShielded ? 15 : 0);
                                if (!mob[i].isInvulnerable && bullet.length < 250) {
                                    for (let i = 0; i < m.coupling; i++) {
                                        if (m.coupling - i > Math.random()) {
                                            const angle = m.fieldAngle + 4 * m.fieldArc * (Math.random() - 0.5)
                                            const radius = m.fieldRange * (0.6 + 0.3 * Math.random())
                                            b.iceIX(6 + 6 * Math.random(), angle, Vector.add(m.fieldPosition, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }))
                                        }
                                    }
                                }
                                if (tech.blockDmg) { //electricity
                                    Matter.Body.setVelocity(mob[i], { x: 0.5 * mob[i].velocity.x, y: 0.5 * mob[i].velocity.y });

                                    if (mob[i].isShielded) {
                                        for (let j = 0, len = mob.length; j < len; j++) {
                                            if (mob[j].id === mob[i].shieldID) mob[j].damage(tech.blockDmg * m.dmgScale * (tech.isBlockRadiation ? 6 : 2), true)
                                        }
                                    } else if (tech.isBlockRadiation) {
                                        if (mob[i].isMobBullet) {
                                            mob[i].damage(tech.blockDmg * m.dmgScale * 3, true)
                                        } else {
                                            mobs.statusDoT(mob[i], tech.blockDmg * m.dmgScale * 4 / 12, 360) //200% increase -> x (1+2) //over 7s -> 360/30 = 12 half seconds -> 3/12
                                        }
                                    } else {
                                        mob[i].damage(tech.blockDmg * m.dmgScale, true)
                                    }
                                    // if (mob[i].isShielded) {
                                    //     for (let j = 0, len = mob.length; j < len; j++) {
                                    //         if (mob[j].id === mob[i].shieldID) mob[j].damage(tech.blockDmg * m.dmgScale * (tech.isBlockRadiation ? 3 : 1), true)
                                    //     }
                                    // } else {
                                    //     if (tech.isBlockRadiation && !mob[i].isMobBullet) {
                                    //         mobs.statusDoT(mob[i], tech.blockDmg * m.dmgScale * 4 / 12, 360) //200% increase -> x (1+2) //over 7s -> 360/30 = 12 half seconds -> 3/12
                                    //     } else {
                                    //         mob[i].damage(tech.blockDmg * m.dmgScale)
                                    //     }
                                    // }
                                    const step = 40
                                    ctx.beginPath();
                                    for (let i = 0, len = 0.8 * tech.blockDmg; i < len; i++) {
                                        let x = m.fieldPosition.x - 20 * unit.x;
                                        let y = m.fieldPosition.y - 20 * unit.y;
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
                                } else if (isFree) {
                                    ctx.lineWidth = 2; //when blocking draw this graphic
                                    ctx.fillStyle = `rgba(110,150,220, ${0.2 + 0.4 * Math.random()})`
                                    ctx.strokeStyle = "#000";
                                    const len = mob[i].vertices.length - 1;
                                    const mag = mob[i].radius
                                    ctx.beginPath();
                                    ctx.moveTo(mob[i].vertices[len].x + mag * (Math.random() - 0.5), mob[i].vertices[len].y + mag * (Math.random() - 0.5))
                                    for (let j = 0; j < len; j++) {
                                        ctx.lineTo(mob[i].vertices[j].x + mag * (Math.random() - 0.5), mob[i].vertices[j].y + mag * (Math.random() - 0.5));
                                    }
                                    ctx.lineTo(mob[i].vertices[len].x + mag * (Math.random() - 0.5), mob[i].vertices[len].y + mag * (Math.random() - 0.5))
                                    ctx.fill();
                                    ctx.stroke();
                                } else {

                                    const eye = 15; //when blocking draw this graphic
                                    const len = mob[i].vertices.length - 1;
                                    ctx.lineWidth = 1;
                                    ctx.fillStyle = `rgba(110,150,220, ${0.2 + 0.4 * Math.random()})`
                                    ctx.strokeStyle = "#000";
                                    ctx.beginPath();
                                    ctx.moveTo(m.fieldPosition.x + eye * Math.cos(m.fieldAngle), m.fieldPosition.y + eye * Math.sin(m.fieldAngle));
                                    ctx.lineTo(mob[i].vertices[len].x, mob[i].vertices[len].y);
                                    ctx.lineTo(mob[i].vertices[0].x, mob[i].vertices[0].y);
                                    ctx.fill();
                                    ctx.stroke();
                                    for (let j = 0; j < len; j++) {
                                        ctx.beginPath();
                                        ctx.moveTo(m.fieldPosition.x + eye * Math.cos(m.fieldAngle), m.fieldPosition.y + eye * Math.sin(m.fieldAngle));
                                        ctx.lineTo(mob[i].vertices[j].x, mob[i].vertices[j].y);
                                        ctx.lineTo(mob[i].vertices[j + 1].x, mob[i].vertices[j + 1].y);
                                        ctx.fill();
                                        ctx.stroke();
                                    }
                                }
                                if (tech.isStunField) mobs.statusStun(mob[i], tech.isStunField)
                                //mob knock backs
                                const massRoot = Math.sqrt(Math.max(1, mob[i].mass));
                                Matter.Body.setVelocity(mob[i], {
                                    x: player.velocity.x - (30 * unit.x) / massRoot,
                                    y: player.velocity.y - (30 * unit.y) / massRoot
                                });
                                if (mob[i].isUnstable) {
                                    if (m.fieldCDcycle < m.cycle + 10) m.fieldCDcycle = m.cycle + 6
                                    mob[i].death();
                                }
                                if (!isFree) { //player knock backs
                                    if (mob[i].isDropPowerUp && player.speed < 12) {
                                        const massRootCap = Math.sqrt(Math.min(10, Math.max(0.2, mob[i].mass)));
                                        Matter.Body.setVelocity(player, {
                                            x: 0.9 * player.velocity.x + 0.6 * unit.x * massRootCap,
                                            y: 0.9 * player.velocity.y + 0.6 * unit.y * massRootCap
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                m.hold = function() {
                    const wave = Math.sin(m.cycle * 0.022);
                    m.fieldRange = 180 + 12 * wave + 100 * tech.isBigField
                    m.fieldArc = 0.35 + 0.045 * wave + 0.065 * tech.isBigField //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
                    m.calculateFieldThreshold();
                    if (m.isHolding) {
                        m.drawHold(m.holdingTarget);
                        m.holding();
                        m.throwBlock();
                    } else if (input.field) { //not hold but field button is pressed
                        if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                        m.grabPowerUp();
                        m.lookForPickUp();
                        m.fieldPosition = { x: m.pos.x, y: m.pos.y }
                        m.fieldAngle = m.angle
                        //draw field attached to player
                        if (m.holdingTarget) {
                            ctx.fillStyle = `rgba(110,150,220, ${0.06 + 0.03 * Math.random()})`
                            ctx.strokeStyle = `rgba(110,150,220, ${0.35 + 0.05 * Math.random()})`
                        } else {
                            ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                            ctx.strokeStyle = `rgba(110,150,220, ${0.4 + 0.5 * Math.random()})`
                        }
                        ctx.beginPath();
                        ctx.arc(m.pos.x, m.pos.y, m.fieldRange, m.angle - Math.PI * m.fieldArc, m.angle + Math.PI * m.fieldArc, false);
                        ctx.lineWidth = 2.5 - 1.5 * wave;
                        ctx.stroke();
                        const curve = 0.57 + 0.04 * wave
                        const aMag = (1 - curve * 1.2) * Math.PI * m.fieldArc
                        let a = m.angle + aMag
                        let cp1x = m.pos.x + curve * m.fieldRange * Math.cos(a)
                        let cp1y = m.pos.y + curve * m.fieldRange * Math.sin(a)
                        ctx.quadraticCurveTo(cp1x, cp1y, m.pos.x + 30 * Math.cos(m.angle), m.pos.y + 30 * Math.sin(m.angle))
                        a = m.angle - aMag
                        cp1x = m.pos.x + curve * m.fieldRange * Math.cos(a)
                        cp1y = m.pos.y + curve * m.fieldRange * Math.sin(a)
                        ctx.quadraticCurveTo(cp1x, cp1y, m.pos.x + 1 * m.fieldRange * Math.cos(m.angle - Math.PI * m.fieldArc), m.pos.y + 1 * m.fieldRange * Math.sin(m.angle - Math.PI * m.fieldArc))
                        ctx.fill();
                        m.perfectPush();
                    } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                        m.pickUp();
                    } else {
                        m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                        if (!input.field) { //&& tech.isFieldFree
                            //draw field free of player
                            ctx.fillStyle = `rgba(110,150,220, ${0.27 + 0.2 * Math.random() - 0.1 * wave})`
                            ctx.strokeStyle = `rgba(110,180,255, ${0.4 + 0.5 * Math.random()})`
                            ctx.beginPath();
                            ctx.arc(m.fieldPosition.x, m.fieldPosition.y, m.fieldRange, m.fieldAngle - Math.PI * m.fieldArc, m.fieldAngle + Math.PI * m.fieldArc, false);
                            ctx.lineWidth = 2.5 - 1.5 * wave;
                            ctx.stroke();
                            const curve = 0.8 + 0.06 * wave
                            const aMag = (1 - curve * 1.2) * Math.PI * m.fieldArc
                            let a = m.fieldAngle + aMag
                            ctx.quadraticCurveTo(m.fieldPosition.x + curve * m.fieldRange * Math.cos(a), m.fieldPosition.y + curve * m.fieldRange * Math.sin(a), m.fieldPosition.x + 1 * m.fieldRange * Math.cos(m.fieldAngle - Math.PI * m.fieldArc), m.fieldPosition.y + 1 * m.fieldRange * Math.sin(m.fieldAngle - Math.PI * m.fieldArc))
                            ctx.fill();
                            m.perfectPush(true);
                        }
                    }
                    // m.drawRegenEnergy()
                    m.drawRegenEnergy("rgba(0,0,0,0.2)")
                    if (tech.isPerfectBrake) { //cap mob speed around player
                        const range = 200 + 140 * wave + 150 * m.energy
                        for (let i = 0; i < mob.length; i++) {
                            const distance = Vector.magnitude(Vector.sub(m.pos, mob[i].position))
                            if (distance < range) {
                                const cap = mob[i].isShielded ? 8 : 4
                                if (mob[i].speed > cap && Vector.dot(mob[i].velocity, Vector.sub(m.pos, mob[i].position)) > 0) { // if velocity is directed towards player
                                    Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(mob[i].velocity), cap)); //set velocity to cap, but keep the direction
                                }
                            }
                        }
                        ctx.beginPath();
                        ctx.arc(m.pos.x, m.pos.y, range, 0, 2 * Math.PI);
                        ctx.fillStyle = "hsla(200,50%,61%,0.08)";
                        ctx.fill();
                    }
                }
            }
        },
        {
            name: "negative mass",
            //<br>hold <strong class='color-block'>blocks</strong> as if they have a lower <strong>mass</strong>
            description: "use <strong class='color-f'>energy</strong> to nullify &nbsp;<strong style='letter-spacing: 7px;'>gravity</strong><br><strong>+55%</strong> <strong class='color-defense'>defense</strong><br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second",
            fieldDrawRadius: 0,
            effect: () => {
                m.fieldFire = true;
                m.holdingMassScale = 0.01; //can hold heavier blocks with lower cost to jumping
                m.fieldMeterColor = "#333"
                m.eyeFillColor = m.fieldMeterColor
                m.fieldHarmReduction = 0.45; //55% reduction
                m.fieldDrawRadius = 0;

                m.hold = function() {
                    m.airSpeedLimit = 125 //5 * player.mass * player.mass
                    m.FxAir = 0.016
                    if (m.isHolding) {
                        m.drawHold(m.holdingTarget);
                        m.holding();
                        m.throwBlock();
                    } else if (input.field && m.fieldCDcycle < m.cycle) { //push away
                        if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                        m.grabPowerUp();
                        m.lookForPickUp();
                        const DRAIN = 0.00035
                        if (m.energy > DRAIN) {
                            if (tech.isFlyFaster) {
                                //look for nearby objects to make zero-g
                                function moveThis(who, range, mag = 1.06) {
                                    for (let i = 0, len = who.length; i < len; ++i) {
                                        sub = Vector.sub(who[i].position, m.pos);
                                        dist = Vector.magnitude(sub);
                                        if (dist < range) {
                                            who[i].force.y -= who[i].mass * (simulation.g * mag); //add a bit more then standard gravity
                                            if (input.left) { //blocks move horizontally with the same force as the player
                                                who[i].force.x -= m.FxAir * who[i].mass / 10; // move player   left / a
                                            } else if (input.right) {
                                                who[i].force.x += m.FxAir * who[i].mass / 10; //move player  right / d
                                            }
                                            //loose attraction to player
                                            // const sub = Vector.sub(m.pos, body[i].position)
                                            // const unit = Vector.mult(Vector.normalise(sub), who[i].mass * 0.0000002 * Vector.magnitude(sub))
                                            // body[i].force.x += unit.x
                                            // body[i].force.y += unit.y
                                        }
                                    }
                                }
                                //control horizontal acceleration
                                m.airSpeedLimit = 1000 // 7* player.mass * player.mass
                                m.FxAir = 0.01
                                //control vertical acceleration
                                if (input.down) { //down
                                    player.force.y += 0.5 * player.mass * simulation.g;
                                    this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 500 * 0.03;
                                    moveThis(powerUp, this.fieldDrawRadius, 0);
                                    moveThis(body, this.fieldDrawRadius, 0);
                                } else if (input.up) { //up
                                    m.energy -= 5 * DRAIN;
                                    this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 1100 * 0.03;
                                    player.force.y -= 2.25 * player.mass * simulation.g;
                                    moveThis(powerUp, this.fieldDrawRadius, 1.8);
                                    moveThis(body, this.fieldDrawRadius, 1.8);
                                } else {
                                    m.energy -= DRAIN;
                                    this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 800 * 0.03;
                                    player.force.y -= 1.07 * player.mass * simulation.g; // slow upward drift
                                    moveThis(powerUp, this.fieldDrawRadius);
                                    moveThis(body, this.fieldDrawRadius);
                                }
                            } else {
                                //look for nearby objects to make zero-g
                                function verticalForce(who, range, mag = 1.06) {
                                    for (let i = 0, len = who.length; i < len; ++i) {
                                        sub = Vector.sub(who[i].position, m.pos);
                                        dist = Vector.magnitude(sub);
                                        if (dist < range) who[i].force.y -= who[i].mass * (simulation.g * mag);
                                    }
                                }
                                //control horizontal acceleration
                                m.airSpeedLimit = 400 // 7* player.mass * player.mass
                                m.FxAir = 0.005
                                //control vertical acceleration
                                if (input.down) { //down
                                    player.force.y -= 0.5 * player.mass * simulation.g;
                                    this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 400 * 0.03;
                                    verticalForce(powerUp, this.fieldDrawRadius, 0.7);
                                    verticalForce(body, this.fieldDrawRadius, 0.7);
                                } else if (input.up) { //up
                                    m.energy -= 5 * DRAIN;
                                    this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 850 * 0.03;
                                    player.force.y -= 1.45 * player.mass * simulation.g;
                                    verticalForce(powerUp, this.fieldDrawRadius, 1.38);
                                    verticalForce(body, this.fieldDrawRadius, 1.38);
                                } else {
                                    m.energy -= DRAIN;
                                    this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 650 * 0.03;
                                    player.force.y -= 1.07 * player.mass * simulation.g; // slow upward drift
                                    verticalForce(powerUp, this.fieldDrawRadius);
                                    verticalForce(body, this.fieldDrawRadius);
                                }
                            }

                            if (m.energy < 0.001) {
                                m.fieldCDcycle = m.cycle + 120;
                                m.energy = 0;
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
                            // if (tech.isFreezeMobs) {
                            //     const ICE_DRAIN = 0.0005
                            //     for (let i = 0, len = mob.length; i < len; i++) {
                            //         if (!mob[i].isMobBullet && !mob[i].shield && !mob[i].isShielded && ((mob[i].distanceToPlayer() + mob[i].radius) < this.fieldDrawRadius)) {
                            //             if (m.energy > ICE_DRAIN * 2) {
                            //                 m.energy -= ICE_DRAIN;
                            //                 this.fieldDrawRadius -= 2;
                            //                 mobs.statusSlow(mob[i], 60)
                            //             } else {
                            //                 break;
                            //             }
                            //         }
                            //     }
                            // }
                            //draw zero-G range
                            if (!simulation.isTimeSkipping) {
                                ctx.beginPath();
                                ctx.arc(m.pos.x, m.pos.y, this.fieldDrawRadius, 0, 2 * Math.PI);
                                ctx.fillStyle = "#f5f5ff";
                                ctx.globalCompositeOperation = "difference";
                                ctx.fill();
                                ctx.globalCompositeOperation = "source-over";
                            }
                        }
                    } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                        m.pickUp();
                        this.fieldDrawRadius = 0
                    } else {
                        m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                        this.fieldDrawRadius = 0
                    }
                    m.drawRegenEnergy("rgba(0,0,0,0.2)")
                }
            }
        },
        {
            name: "molecular assembler",
            description: `excess <strong class='color-f'>energy</strong> used to build ${simulation.molecularMode === 0 ? "<strong class='color-p' style='letter-spacing: 2px;'>spores" : simulation.molecularMode === 1 ? "<strong>missiles" : simulation.molecularMode === 2 ? "<strong class='color-s'>ice IX" : "<strong>drones"}</strong><br>use <strong class='color-f'>energy</strong> to <strong>deflect</strong> mobs<br>generate <strong>12</strong> <strong class='color-f'>energy</strong> per second`,
            //   simulation.molecularMode: Math.floor(4 * Math.random()), //0 spores, 1 missile, 2 ice IX, 3 drones
            setDescription() {
                return `excess <strong class='color-f'>energy</strong> used to build ${simulation.molecularMode === 0 ? "<strong class='color-p' style='letter-spacing: 2px;'>spores" : simulation.molecularMode === 1 ? "<strong>missiles" : simulation.molecularMode === 2 ? "<strong class='color-s'>ice IX" : "<strong>drones"}</strong><br>use <strong class='color-f'>energy</strong> to <strong>deflect</strong> mobs<br>generate <strong>12</strong> <strong class='color-f'>energy</strong> per second`
            },
            effect: () => {
                m.fieldMeterColor = "#ff0"
                m.eyeFillColor = m.fieldMeterColor
                m.hold = function() {
                    if (m.energy > m.maxEnergy - 0.02 && m.fieldCDcycle < m.cycle && !input.field && bullet.length < 300 && (m.cycle % 2)) {
                        if (simulation.molecularMode === 0) {
                            if (tech.isSporeFlea) {
                                const drain = 0.18 + (Math.max(bullet.length, 130) - 130) * 0.02
                                if (m.energy > drain) {
                                    m.energy -= drain
                                    const speed = m.crouch ? 20 + 8 * Math.random() : 10 + 3 * Math.random()
                                    b.flea({ x: m.pos.x + 35 * Math.cos(m.angle), y: m.pos.y + 35 * Math.sin(m.angle) }, { x: speed * Math.cos(m.angle), y: speed * Math.sin(m.angle) })
                                }
                            } else if (tech.isSporeWorm) {
                                const drain = 0.18 + (Math.max(bullet.length, 130) - 130) * 0.02
                                if (m.energy > drain) {
                                    m.energy -= drain
                                    b.worm({ x: m.pos.x + 35 * Math.cos(m.angle), y: m.pos.y + 35 * Math.sin(m.angle) })
                                    const SPEED = 2 + 1 * Math.random();
                                    Matter.Body.setVelocity(bullet[bullet.length - 1], {
                                        x: SPEED * Math.cos(m.angle),
                                        y: SPEED * Math.sin(m.angle)
                                    });
                                }
                            } else {
                                const drain = 0.1 + (Math.max(bullet.length, 130) - 130) * 0.01
                                for (let i = 0, len = Math.random() * 20; i < len; i++) {
                                    if (m.energy > drain) {
                                        m.energy -= drain
                                        b.spore(m.pos)
                                    } else {
                                        break
                                    }
                                }
                            }
                        } else if (simulation.molecularMode === 1) {
                            m.energy -= 0.33;
                            const direction = {
                                x: Math.cos(m.angle),
                                y: Math.sin(m.angle)
                            }
                            const push = Vector.mult(Vector.perp(direction), 0.08)
                            b.missile({ x: m.pos.x + 30 * direction.x, y: m.pos.y + 30 * direction.y }, m.angle, -15)
                            bullet[bullet.length - 1].force.x += push.x * (Math.random() - 0.5)
                            bullet[bullet.length - 1].force.y += 0.005 + push.y * (Math.random() - 0.5)

                            // b.missile({ x: m.pos.x, y: m.pos.y - 40 }, -Math.PI / 2 + 0.5 * (Math.random() - 0.5), 0, 1)
                        } else if (simulation.molecularMode === 2) {
                            m.energy -= 0.045;
                            b.iceIX(1)
                        } else if (simulation.molecularMode === 3) {
                            if (tech.isDroneRadioactive) {
                                const drain = 0.8 + (Math.max(bullet.length, 50) - 50) * 0.01
                                if (m.energy > drain) {
                                    m.energy -= drain
                                    b.droneRadioactive({ x: m.pos.x + 30 * Math.cos(m.angle) + 10 * (Math.random() - 0.5), y: m.pos.y + 30 * Math.sin(m.angle) + 10 * (Math.random() - 0.5) }, 25)
                                }
                            } else {
                                //every bullet above 100 adds 0.005 to the energy cost per drone
                                //at 200 bullets the energy cost is 0.45 + 100*0.006 = 1.05
                                const drain = (0.45 + (Math.max(bullet.length, 100) - 100) * 0.006) * tech.droneEnergyReduction
                                if (m.energy > drain) {
                                    m.energy -= drain
                                    b.drone()
                                }
                            }
                        }
                    }

                    if (m.isHolding) {
                        m.drawHold(m.holdingTarget);
                        m.holding();
                        m.throwBlock();
                    } else if ((input.field && m.fieldCDcycle < m.cycle)) { //not hold but field button is pressed
                        if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                        m.grabPowerUp();
                        m.lookForPickUp();
                        if (m.energy > 0.05) {
                            m.drawField();
                            m.pushMobsFacing();
                        }
                    } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                        m.pickUp();
                    } else {
                        m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    m.drawRegenEnergy()
                }
            }
        },
        // {
        //     name: "plasma torch",
        //     description: "use <strong class='color-f'>energy</strong> to emit short range <strong class='color-plasma'>plasma</strong><br><strong class='color-d'>damages</strong> and <strong>pushes</strong> mobs away",
        //     effect() {
        //         m.fieldMeterColor = "#f0f"
        //         m.eyeFillColor = m.fieldMeterColor
        //         m.hold = function() {
        //             b.isExtruderOn = false
        //             if (m.isHolding) {
        //                 m.drawHold(m.holdingTarget);
        //                 m.holding();
        //                 m.throwBlock();
        //             } else if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
        //                 m.grabPowerUp();
        //                 m.lookForPickUp();
        //                 if (tech.isExtruder) {
        //                     b.extruder();
        //                 } else {
        //                     b.plasma();
        //                 }
        //             } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
        //                 m.pickUp();
        //             } else {
        //                 m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //             }
        //             m.drawRegenEnergy("rgba(0, 0, 0, 0.2)")

        //             if (tech.isExtruder) {
        //                 if (input.field) {
        //                     b.wasExtruderOn = true
        //                 } else {
        //                     b.wasExtruderOn = false
        //                     b.canExtruderFire = true
        //                 }
        //                 ctx.beginPath(); //draw all the wave bullets
        //                 for (let i = 0, len = bullet.length; i < len; i++) {
        //                     if (bullet[i].isWave) {
        //                         if (bullet[i].isBranch) {
        //                             ctx.moveTo(bullet[i].position.x, bullet[i].position.y)
        //                         } else {
        //                             ctx.lineTo(bullet[i].position.x, bullet[i].position.y)
        //                         }
        //                     }
        //                 }
        //                 if (b.wasExtruderOn && b.isExtruderOn) ctx.lineTo(m.pos.x + 15 * Math.cos(m.angle), m.pos.y + 15 * Math.sin(m.angle))
        //                 ctx.lineWidth = 4;
        //                 ctx.strokeStyle = "#f07"
        //                 ctx.stroke();
        //                 ctx.lineWidth = tech.extruderRange;
        //                 ctx.strokeStyle = "rgba(255,0,110,0.05)"
        //                 ctx.stroke();
        //             }
        //         }
        //     }
        // },
        {
            name: "plasma torch",
            description: "use <strong class='color-f'>energy</strong> to emit short range <strong class='color-plasma'>plasma</strong><br><strong class='color-d'>damages</strong> and <strong>pushes</strong> mobs away<br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second",
            set() {
                b.isExtruderOn = false
                // m.fieldCDcycleAlternate = 0

                if (m.plasmaBall) {
                    m.plasmaBall.reset()
                    Matter.Composite.remove(engine.world, m.plasmaBall);
                }
                if (tech.isPlasmaBall) {
                    const circleRadiusScale = 2
                    m.plasmaBall = Bodies.circle(m.pos.x + 10 * Math.cos(m.angle), m.pos.y + 10 * Math.sin(m.angle), 1, {
                        // collisionFilter: {
                        //     group: 0,
                        //     category: 0,
                        //     mask: 0 //cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
                        // },
                        isSensor: true,
                        frictionAir: 0,
                        alpha: 0.7,
                        isPopping: false,
                        isAttached: false,
                        isOn: false,
                        drain: 0.0017,
                        radiusLimit: 10,
                        damage: 0.8,
                        setPositionToNose() {
                            const nose = { x: m.pos.x + 10 * Math.cos(m.angle), y: m.pos.y + 10 * Math.sin(m.angle) }
                            Matter.Body.setPosition(this, Vector.add(nose, Vector.mult(Vector.normalise(Vector.sub(nose, m.pos)), circleRadiusScale * this.circleRadius)));
                        },
                        fire() {
                            this.isAttached = false;
                            const speed = 10 //scale with mass?
                            Matter.Body.setVelocity(this, {
                                x: player.velocity.x * 0.4 + speed * Math.cos(m.angle),
                                y: speed * Math.sin(m.angle)
                            });
                            m.plasmaBall.setPositionToNose()
                            if (this.circleRadius < 10) this.isPopping = true
                        },
                        scale(scale) {
                            Matter.Body.scale(m.plasmaBall, scale, scale); //shrink fast
                            if (this.circleRadius < this.radiusLimit) this.reset()
                        },
                        reset() {
                            const scale = 1 / m.plasmaBall.circleRadius
                            Matter.Body.scale(m.plasmaBall, scale, scale); //grow
                            this.alpha = 0.7
                            this.isOn = false
                            this.isPopping = false
                        },
                        do() {
                            if (this.isOn) {
                                //collisions with map
                                if (Matter.Query.collides(this, map).length > 0) {
                                    if (this.isAttached) {
                                        this.scale(Math.max(0.9, 0.998 - 0.1 / m.plasmaBall.circleRadius))
                                    } else {
                                        this.isPopping = true
                                    }
                                }
                                if (this.isPopping) {
                                    this.alpha -= 0.03
                                    if (this.alpha < 0.1) {
                                        this.reset()
                                    } else {
                                        const scale = 1.04 + 4 / Math.max(1, m.plasmaBall.circleRadius)
                                        Matter.Body.scale(m.plasmaBall, scale, scale); //grow
                                    }
                                    // if (this.speed > 2.5) {
                                    //     const slow = 0.9
                                    //     Matter.Body.setVelocity(this, {
                                    //         x: slow * this.velocity.x,
                                    //         y: slow * this.velocity.y
                                    //     });
                                    // }
                                }
                                //collisions with mobs
                                // const whom = Matter.Query.collides(this, mob)
                                // const dmg = this.damage * m.dmgScale
                                // for (let i = 0, len = whom.length; i < len; i++) {
                                //     const mobHit = (who) => {
                                //         if (who.alive) {
                                //             if (!this.isAttached && !who.isMobBullet) this.isPopping = true
                                //             who.damage(dmg);
                                //             // if (who.shield) this.scale(Math.max(0.9, 0.99 - 0.5 / m.plasmaBall.circleRadius))
                                //             if (who.speed > 5) {
                                //                 Matter.Body.setVelocity(who, { //friction
                                //                     x: who.velocity.x * 0.6,
                                //                     y: who.velocity.y * 0.6
                                //                 });
                                //             } else {
                                //                 Matter.Body.setVelocity(who, { //friction
                                //                     x: who.velocity.x * 0.93,
                                //                     y: who.velocity.y * 0.93
                                //                 });
                                //             }
                                //         }
                                //     }
                                //     mobHit(whom[i].bodyA)
                                //     mobHit(whom[i].bodyB)
                                // }

                                //damage nearby mobs
                                const dmg = this.damage * m.dmgScale
                                const arcList = []
                                const damageRadius = circleRadiusScale * this.circleRadius
                                const dischargeRange = 150 + 1600 * tech.plasmaDischarge + 1.3 * damageRadius
                                for (let i = 0, len = mob.length; i < len; i++) {
                                    if (mob[i].alive && (!mob[i].isBadTarget || mob[i].isMobBullet) && !mob[i].isInvulnerable) {
                                        const sub = Vector.magnitude(Vector.sub(this.position, mob[i].position))
                                        if (sub < damageRadius + mob[i].radius) {
                                            // if (!this.isAttached && !mob[i].isMobBullet) this.isPopping = true
                                            mob[i].damage(dmg);
                                            if (mob[i].speed > 5) {
                                                Matter.Body.setVelocity(mob[i], { //friction
                                                    x: mob[i].velocity.x * 0.6,
                                                    y: mob[i].velocity.y * 0.6
                                                });
                                            } else {
                                                Matter.Body.setVelocity(mob[i], { //friction
                                                    x: mob[i].velocity.x * 0.93,
                                                    y: mob[i].velocity.y * 0.93
                                                });
                                            }
                                        } else if (sub < dischargeRange + mob[i].radius && Matter.Query.ray(map, mob[i].position, this.position).length === 0) {
                                            arcList.push(mob[i]) //populate electrical arc list
                                        }
                                    }
                                }
                                for (let i = 0; i < arcList.length; i++) {
                                    if (tech.plasmaDischarge > Math.random()) {
                                        const who = arcList[Math.floor(Math.random() * arcList.length)]
                                        who.damage(dmg * 4);
                                        //draw arcs
                                        const sub = Vector.sub(who.position, this.position)
                                        const unit = Vector.normalise(sub)
                                        let len = 12
                                        const step = Vector.magnitude(sub) / (len + 2)
                                        let x = this.position.x
                                        let y = this.position.y
                                        ctx.beginPath();
                                        ctx.moveTo(x, y);
                                        for (let i = 0; i < len; i++) {
                                            x += step * (unit.x + (Math.random() - 0.5))
                                            y += step * (unit.y + (Math.random() - 0.5))
                                            ctx.lineTo(x, y);
                                        }
                                        ctx.lineTo(who.position.x, who.position.y);
                                        ctx.strokeStyle = "#88f";
                                        ctx.lineWidth = 4 + 3 * Math.random();
                                        ctx.stroke();
                                        if (who.damageReduction) {
                                            simulation.drawList.push({
                                                x: who.position.x,
                                                y: who.position.y,
                                                radius: 15,
                                                color: "rgba(150,150,255,0.4)",
                                                time: 15
                                            });
                                        }
                                    }
                                }


                                //slowly slow down if too fast
                                if (this.speed > 10) {
                                    const scale = 0.998
                                    Matter.Body.setVelocity(this, {
                                        x: scale * this.velocity.x,
                                        y: scale * this.velocity.y
                                    });
                                }

                                //graphics
                                const radius = circleRadiusScale * this.circleRadius * (0.99 + 0.02 * Math.random()) + 3 * Math.random()
                                const gradient = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, radius);
                                const alpha = this.alpha + 0.1 * Math.random()
                                gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
                                gradient.addColorStop(0.35 + 0.1 * Math.random(), `rgba(255,150,255,${alpha})`);
                                gradient.addColorStop(1, `rgba(255,0,255,${alpha})`);
                                // gradient.addColorStop(1, `rgba(255,150,255,${alpha})`);
                                ctx.fillStyle = gradient
                                ctx.beginPath();
                                ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
                                ctx.fill();
                                //draw arcs
                                const unit = Vector.rotate({ x: 1, y: 0 }, Math.random() * 6.28)
                                let len = 8
                                const step = this.circleRadius / len
                                let x = this.position.x
                                let y = this.position.y
                                ctx.beginPath();
                                if (Math.random() < 0.5) {
                                    x += step * (unit.x + 6 * (Math.random() - 0.5))
                                    y += step * (unit.y + 6 * (Math.random() - 0.5))
                                    len -= 2
                                }
                                if (Math.random() < 0.5) {
                                    x += step * (unit.x + 6 * (Math.random() - 0.5))
                                    y += step * (unit.y + 6 * (Math.random() - 0.5))
                                    len -= 2
                                }
                                ctx.moveTo(x, y);

                                for (let i = 0; i < len; i++) {
                                    x += step * (unit.x + 1.9 * (Math.random() - 0.5))
                                    y += step * (unit.y + 1.9 * (Math.random() - 0.5))
                                    ctx.lineTo(x, y);
                                }
                                ctx.strokeStyle = "#88f";
                                ctx.lineWidth = 2 * Math.random();
                                ctx.stroke();
                            }
                        },
                    });

                    Composite.add(engine.world, m.plasmaBall);
                    // m.plasmaBall.startingVertices = m.plasmaBall.vertices.slice();
                    m.hold = function() {
                        if (m.isHolding) {
                            m.drawHold(m.holdingTarget);
                            m.holding();
                            m.throwBlock();
                        } else if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
                            if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                            m.grabPowerUp();
                            m.lookForPickUp();

                            //field is active
                            if (!m.plasmaBall.isAttached) { //return ball to player
                                if (m.plasmaBall.isOn) {
                                    m.plasmaBall.isPopping = true
                                } else {
                                    m.plasmaBall.isAttached = true
                                    m.plasmaBall.isOn = true
                                    m.plasmaBall.isPopping = false
                                    m.plasmaBall.alpha = 0.7
                                    m.plasmaBall.setPositionToNose()
                                    // m.plasmaBall.reset()

                                }
                                // const scale = 0.7
                                // Matter.Body.scale(m.plasmaBall, scale, scale); //shrink fast
                                // if (m.plasmaBall.circleRadius < m.plasmaBall.radiusLimit) {
                                // m.plasmaBall.isAttached = true
                                // m.plasmaBall.isOn = true
                                // m.plasmaBall.setPositionToNose()
                                // }
                            } else if (m.energy > m.plasmaBall.drain) { //charge up when attached
                                if (tech.isCapacitor) {
                                    m.energy -= m.plasmaBall.drain * 2;
                                    const scale = 1 + 48 * Math.pow(Math.max(1, m.plasmaBall.circleRadius), -1.8)
                                    Matter.Body.scale(m.plasmaBall, scale, scale); //grow
                                } else {
                                    m.energy -= m.plasmaBall.drain;
                                    const scale = 1 + 16 * Math.pow(Math.max(1, m.plasmaBall.circleRadius), -1.8)
                                    Matter.Body.scale(m.plasmaBall, scale, scale); //grow    
                                }
                                if (m.energy > m.maxEnergy) {
                                    m.energy -= m.plasmaBall.drain * 2;
                                    const scale = 1 + 16 * Math.pow(Math.max(1, m.plasmaBall.circleRadius), -1.8)
                                    Matter.Body.scale(m.plasmaBall, scale, scale); //grow    
                                }
                                m.plasmaBall.setPositionToNose()

                                //add friction for player when holding ball, more friction in vertical
                                // const floatScale = Math.sqrt(m.plasmaBall.circleRadius)
                                // const friction = 0.0002 * floatScale
                                // const slowY = (player.velocity.y > 0) ? Math.max(0.8, 1 - friction * player.velocity.y * player.velocity.y) : Math.max(0.98, 1 - friction * Math.abs(player.velocity.y)) //down : up
                                // Matter.Body.setVelocity(player, {
                                //     x: Math.max(0.95, 1 - friction * Math.abs(player.velocity.x)) * player.velocity.x,
                                //     y: slowY * player.velocity.y
                                // });

                                // if (player.velocity.y > 7) player.force.y -= 0.95 * player.mass * simulation.g //less gravity when falling fast
                                // player.force.y -= Math.min(0.95, 0.05 * floatScale) * player.mass * simulation.g; //undo some gravity on up or down

                                //float
                                const slowY = (player.velocity.y > 0) ? Math.max(0.8, 1 - 0.002 * player.velocity.y * player.velocity.y) : Math.max(0.98, 1 - 0.001 * Math.abs(player.velocity.y)) //down : up
                                Matter.Body.setVelocity(player, {
                                    x: Math.max(0.95, 1 - 0.003 * Math.abs(player.velocity.x)) * player.velocity.x,
                                    y: slowY * player.velocity.y
                                });
                                if (player.velocity.y > 5) {
                                    player.force.y -= 0.9 * player.mass * simulation.g //less gravity when falling fast
                                } else {
                                    player.force.y -= 0.5 * player.mass * simulation.g;
                                }
                            } else {
                                m.fieldCDcycle = m.cycle + 90;
                                m.plasmaBall.fire()
                            }
                        } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                            m.pickUp();
                            if (m.plasmaBall.isAttached) {
                                m.fieldCDcycle = m.cycle + 30;
                                m.plasmaBall.fire()
                            }
                        } else {
                            m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                            if (m.plasmaBall.isAttached) {
                                m.fieldCDcycle = m.cycle + 30;
                                m.plasmaBall.fire()
                            }
                        }
                        m.drawRegenEnergy("rgba(0, 0, 0, 0.2)")
                        m.plasmaBall.do()
                    }
                } else if (tech.isExtruder) {
                    m.hold = function() {
                        b.isExtruderOn = false
                        if (m.isHolding) {
                            m.drawHold(m.holdingTarget);
                            m.holding();
                            m.throwBlock();
                        } else if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
                            if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                            m.grabPowerUp();
                            m.lookForPickUp();
                            b.extruder();
                        } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                            m.pickUp();
                        } else {
                            m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                        }
                        m.drawRegenEnergy("rgba(0, 0, 0, 0.2)")
                        if (input.field) {
                            b.wasExtruderOn = true
                        } else {
                            b.wasExtruderOn = false
                            b.canExtruderFire = true
                        }
                        ctx.beginPath(); //draw all the wave bullets
                        for (let i = 1, len = bullet.length; i < len; i++) { //skip the first bullet (which is is oldest bullet)
                            if (bullet[i].isWave) {
                                if (bullet[i].isBranch || bullet[i - 1].isBranch) {
                                    ctx.moveTo(bullet[i].position.x, bullet[i].position.y)
                                } else {
                                    ctx.lineTo(bullet[i].position.x, bullet[i].position.y)
                                }
                            }
                        }
                        if (b.wasExtruderOn && b.isExtruderOn) ctx.lineTo(m.pos.x + 15 * Math.cos(m.angle), m.pos.y + 15 * Math.sin(m.angle))
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = "#f07"
                        ctx.stroke();
                        ctx.lineWidth = tech.extruderRange;
                        ctx.strokeStyle = "rgba(255,0,110,0.06)"
                        ctx.stroke();
                    }
                } else {
                    m.hold = function() {
                        if (m.isHolding) {
                            m.drawHold(m.holdingTarget);
                            m.holding();
                            m.throwBlock();
                        } else if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
                            if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                            m.grabPowerUp();
                            m.lookForPickUp();
                            b.plasma();
                        } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                            m.pickUp();
                        } else {
                            m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                        }
                        m.drawRegenEnergy("rgba(0, 0, 0, 0.2)")
                    }
                }
            },
            effect() {
                m.fieldMeterColor = "#f0f"
                m.eyeFillColor = m.fieldMeterColor
                this.set();
            }
        },
        {
            name: "time dilation",
            description: "use <strong class='color-f'>energy</strong> to <strong style='letter-spacing: 2px;'>stop time</strong><br><strong>+25%</strong> movement and <strong><em>fire rate</em></strong><br>generate <strong>18</strong> <strong class='color-f'>energy</strong> per second",
            set() {
                // m.fieldMeterColor = "#0fc"
                // m.fieldMeterColor = "#ff0"
                m.fieldMeterColor = "#3fe"
                m.eyeFillColor = m.fieldMeterColor
                m.fieldFx = 1.3
                // m.fieldJump = 1.09
                m.setMovement();

                const timeStop = () => {
                    m.immuneCycle = m.cycle + 10; //immune to harm while time is stopped,  this also disables regen
                    //draw field everywhere
                    ctx.globalCompositeOperation = "saturation"
                    ctx.fillStyle = "#ccc";
                    ctx.fillRect(-100000, -100000, 200000, 200000)
                    ctx.globalCompositeOperation = "source-over"
                    //stop time
                    m.isBodiesAsleep = true;

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
                    simulation.cycle--; //pause all functions that depend on game cycle increasing
                }
                if (tech.isRewindField) {
                    this.rewindCount = 0
                    m.grabPowerUpRange2 = 300000
                    m.hold = function() {
                        console.log(m.fieldCDcycle)
                        m.grabPowerUp();
                        // //grab power ups
                        // for (let i = 0, len = powerUp.length; i < len; ++i) {
                        //     if (
                        //         Vector.magnitudeSquared(Vector.sub(m.pos, powerUp[i].position)) < 100000 &&
                        //         !simulation.isChoosing &&
                        //         (powerUp[i].name !== "heal" || m.health !== m.maxHealth || tech.isOverHeal)
                        //     ) {
                        //         powerUps.onPickUp(powerUp[i]);
                        //         powerUp[i].effect();
                        //         Matter.Composite.remove(engine.world, powerUp[i]);
                        //         powerUp.splice(i, 1);
                        //         break; //because the array order is messed up after splice
                        //     }
                        // }
                        if (m.isHolding) {
                            m.drawHold(m.holdingTarget);
                            m.holding();
                            m.throwBlock();
                            m.wakeCheck();
                        } else if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
                            const drain = 0.002 / (1 + 0.3 * m.coupling)
                            if (m.energy > drain) m.energy -= drain

                            m.grabPowerUp();
                            if (this.rewindCount === 0) m.lookForPickUp();

                            if (!m.holdingTarget) {
                                this.rewindCount += 6;
                                const DRAIN = 0.003
                                let history = m.history[(m.cycle - this.rewindCount) % 600]
                                if (this.rewindCount > 599 || m.energy < DRAIN) {
                                    this.rewindCount = 0;
                                    m.resetHistory();
                                    if (m.fireCDcycle < m.cycle + 60) m.fieldCDcycle = m.cycle + 60
                                    m.immuneCycle = m.cycle //if you reach the end of the history disable harm immunity
                                } else {
                                    //draw field everywhere
                                    ctx.globalCompositeOperation = "saturation"
                                    ctx.fillStyle = "#ccc";
                                    ctx.fillRect(-100000, -100000, 200000, 200000)
                                    ctx.globalCompositeOperation = "source-over"
                                    // m.grabPowerUp(); //a second grab power up to make the power ups easier to grab, and they more fast which matches the time theme
                                    m.energy -= DRAIN
                                    if (m.immuneCycle < m.cycle + 60) m.immuneCycle = m.cycle + 60; //player is immune to damage for __ cycles
                                    Matter.Body.setPosition(player, history.position);
                                    Matter.Body.setVelocity(player, { x: history.velocity.x, y: history.velocity.y });
                                    if (m.health < history.health) {
                                        m.health = history.health
                                        if (m.health > m.maxHealth) m.health = m.maxHealth
                                        m.displayHealth();
                                    }
                                    m.yOff = history.yOff
                                    if (m.yOff < 48) {
                                        m.doCrouch()
                                    } else {
                                        m.undoCrouch()
                                    }
                                    if (!(this.rewindCount % 30)) {
                                        if (tech.isRewindBot) {
                                            for (let i = 0; i < tech.isRewindBot; i++) {
                                                b.randomBot(m.pos, false, false)
                                                bullet[bullet.length - 1].endCycle = simulation.cycle + 480 + Math.floor(120 * Math.random()) //8-9 seconds
                                            }
                                        }
                                        if (tech.isRewindGrenade) {
                                            b.grenade(m.pos, this.rewindCount) //Math.PI / 2
                                            const who = bullet[bullet.length - 1]
                                            who.endCycle = simulation.cycle + 60
                                        }
                                    }
                                }
                            }
                            m.wakeCheck();
                        } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                            m.pickUp();
                            this.rewindCount = 0;
                            m.wakeCheck();
                        } else if (tech.isTimeStop && player.speed < 1 && m.onGround && !input.fire) {
                            timeStop();
                            this.rewindCount = 0;
                        } else {
                            m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                            this.rewindCount = 0;
                            m.wakeCheck();
                        }
                        m.drawRegenEnergy() // this calls  m.regenEnergy(); also
                    }
                } else {
                    m.fieldFire = true;
                    m.isBodiesAsleep = false;
                    m.hold = function() {
                        if (m.isHolding) {
                            m.wakeCheck();
                            m.drawHold(m.holdingTarget);
                            m.holding();
                            m.throwBlock();
                        } else if (input.field && m.fieldCDcycle < m.cycle) {
                            const drain = 0.0026 / (1 + 0.3 * m.coupling)
                            if (m.energy > drain) m.energy -= drain
                            m.grabPowerUp();
                            m.lookForPickUp(); //this drains energy 0.001
                            if (m.energy > drain) {
                                timeStop();
                            } else { //holding, but field button is released
                                m.fieldCDcycle = m.cycle + 120;
                                m.energy = 0;
                                m.wakeCheck();
                                m.wakeCheck();
                            }
                        } else if (tech.isTimeStop && player.speed < 1 && m.onGround && m.fireCDcycle < m.cycle && !input.fire) {
                            timeStop();
                            //makes things move at 1/5 time rate, but has an annoying flicker for mob graphics, and other minor bugs
                            // if (!(m.cycle % 4)) {
                            //     // requestAnimationFrame(() => {
                            //     m.wakeCheck();
                            //     // simulation.timePlayerSkip(1)
                            //     // }); //wrapping in animation frame prevents errors, probably          
                            //     ctx.globalCompositeOperation = "saturation"
                            //     ctx.fillStyle = "#ccc";
                            //     ctx.fillRect(-100000, -100000, 200000, 200000)
                            //     ctx.globalCompositeOperation = "source-over"
                            // } else {
                            //     timeStop();
                            // }
                        } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
                            m.wakeCheck();
                            m.pickUp();
                        } else {
                            m.wakeCheck();
                            m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                        }
                        m.drawRegenEnergy()
                    }
                }
            },
            effect() {
                if (tech.isTimeStop) {
                    m.fieldHarmReduction = 0.66; //33% reduction
                } else {
                    m.fieldHarmReduction = 1;
                }
                this.set();
            }
        },
        {
            name: "metamaterial cloaking",
            description: "when not firing activate <strong class='color-cloaked'>cloaking</strong><br><span style = 'font-size:92%;'>after <strong class='color-cloaked'>decloaking</strong> <strong>+333%</strong> <strong class='color-d'>damage</strong> for up to <strong>2</strong> s</span><br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second",
            effect: () => {
                m.fieldFire = true;
                m.fieldMeterColor = "#333";
                m.eyeFillColor = m.fieldMeterColor
                m.fieldPhase = 0;
                m.isCloak = false
                m.fieldDrawRadius = 0
                m.isSneakAttack = true;
                m.sneakAttackCycle = 0;
                m.enterCloakCycle = 0;
                m.drawCloak = function() {
                    m.fieldPhase += 0.007
                    const wiggle = 0.15 * Math.sin(m.fieldPhase * 0.5)
                    ctx.beginPath();
                    ctx.ellipse(m.pos.x, m.pos.y, m.fieldDrawRadius * (1 - wiggle), m.fieldDrawRadius * (1 + wiggle), m.fieldPhase, 0, 2 * Math.PI);
                    ctx.fillStyle = "#fff"
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#000"
                    ctx.stroke()
                    ctx.globalCompositeOperation = "destination-in";
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";
                    ctx.clip();
                }
                m.hold = function() {
                    if (m.isHolding) {
                        m.drawHold(m.holdingTarget);
                        m.holding();
                        m.throwBlock();
                    } else if (input.field && m.fieldCDcycle < m.cycle) { //not hold and field button is pressed
                        if (m.energy > m.fieldRegen) m.energy -= m.fieldRegen
                        m.grabPowerUp();
                        m.lookForPickUp();
                    } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding target exists, and field button is not pressed
                        m.pickUp();
                    } else {
                        m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                    }
                    //not shooting (or using field) enable cloak
                    if (m.energy < 0.05 && m.fireCDcycle < m.cycle && !input.fire) m.fireCDcycle = m.cycle
                    if (m.fireCDcycle + 30 < m.cycle && !input.fire) { //automatically cloak if not firing
                        if (!m.isCloak) {
                            m.isCloak = true //enter cloak

                            // m.color = {
                            //     hue: 0,
                            //     sat: 0,
                            //     light: 100
                            // }
                            // m.setFillColorsAlpha(0)


                            m.enterCloakCycle = m.cycle
                            if (tech.isCloakHealLastHit && m.lastHit > 0) {
                                const heal = Math.min(0.75 * m.lastHit, m.energy)
                                m.energy -= heal
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: m.pos.x,
                                    y: m.pos.y,
                                    radius: Math.sqrt(heal) * 200,
                                    color: "rgba(0,255,200,0.6)",
                                    time: 16
                                });
                                m.addHealth(heal); //heal from last hit
                                // if (tech.isEnergyHealth) {
                                //     simulation.drawList.push({ //add dmg to draw queue
                                //         x: m.pos.x,
                                //         y: m.pos.y,
                                //         radius: Math.sqrt(heal) * 200,
                                //         color: "#0ad", //simulation.mobDmgColor
                                //         time: 16
                                //     });
                                //     m.energy += heal
                                // } else {
                                // }
                                m.lastHit = 0
                                // simulation.makeTextLog(`<span class='color-var'>m</span>.health <span class='color-symbol'>+=</span> ${(heal).toFixed(3)}`) // <br>${m.health.toFixed(3)}
                            }
                            if (tech.isIntangible) {
                                for (let i = 0; i < bullet.length; i++) {
                                    if (bullet[i].botType && bullet[i].botType !== "orbit") bullet[i].collisionFilter.mask = cat.map | cat.bullet | cat.mobBullet | cat.mobShield
                                }
                            }
                        }
                    } else if (m.isCloak) { //exit cloak
                        m.sneakAttackCycle = m.cycle
                        m.isCloak = false
                        if (tech.isIntangible) {
                            for (let i = 0; i < bullet.length; i++) {
                                if (bullet[i].botType && bullet[i].botType !== "orbit") bullet[i].collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
                            }
                        }
                        if (tech.isCloakStun) { //stun nearby mobs after exiting cloak
                            let isMobsAround = false
                            const stunRange = m.fieldDrawRadius * 1.5
                            const drain = 0.2
                            if (m.energy > drain) {
                                for (let i = 0, len = mob.length; i < len; ++i) {
                                    if (Vector.magnitude(Vector.sub(mob[i].position, m.pos)) < stunRange && Matter.Query.ray(map, mob[i].position, m.pos).length === 0 && !mob[i].isBadTarget) {
                                        isMobsAround = true
                                        mobs.statusStun(mob[i], 180)
                                    }
                                }
                                if (isMobsAround) {
                                    m.energy -= drain
                                    simulation.drawList.push({
                                        x: m.pos.x,
                                        y: m.pos.y,
                                        radius: stunRange,
                                        color: "hsla(0,50%,100%,0.7)",
                                        time: 7
                                    });
                                }
                            }
                        }
                    }
                    if (m.isCloak) {
                        m.fieldRange = m.fieldRange * 0.9 + 80
                        m.fieldDrawRadius = m.fieldRange * 0.88 //* Math.min(1, 0.3 + 0.5 * Math.min(1, energy * energy));
                        m.drawCloak()
                    } else if (m.fieldRange < 4000) {
                        m.fieldRange += 50
                        m.fieldDrawRadius = m.fieldRange //* Math.min(1, 0.3 + 0.5 * Math.min(1, energy * energy));
                        m.drawCloak()
                    }
                    if (tech.isIntangible) {
                        if (m.isCloak) {
                            player.collisionFilter.mask = cat.map
                            let inPlayer = Matter.Query.region(mob, player.bounds)
                            if (inPlayer.length > 0) {
                                for (let i = 0; i < inPlayer.length; i++) {
                                    if (m.energy > 0) {
                                        if (!inPlayer[i].isUnblockable) m.energy -= 0.007;
                                        if (inPlayer[i].shield) m.energy -= 0.025;
                                    }
                                }
                            }
                        } else {
                            player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
                        }
                    }
                    this.drawRegenEnergyCloaking()
                    //show sneak attack status 
                    // if (m.cycle > m.lastKillCycle + 240) {
                    // if (m.sneakAttackCharge > 0) {
                    if (m.sneakAttackCycle + Math.min(120, 0.7 * (m.cycle - m.enterCloakCycle)) > m.cycle) {
                        ctx.strokeStyle = "rgba(0,0,0,0.5)" //m.fieldMeterColor; //"rgba(255,255,0,0.2)" //ctx.strokeStyle = `rgba(0,0,255,${0.5+0.5*Math.random()})`
                        ctx.beginPath();
                        ctx.arc(m.pos.x, m.pos.y, 28, 0, 2 * Math.PI);
                        ctx.lineWidth = 3
                        ctx.stroke();
                    }
                }
            }
        },
        // {
        //   name: "phase decoherence field",
        //   description: "use <strong class='color-f'>energy</strong> to become <strong>intangible</strong><br><strong>firing</strong> and touching <strong>shields</strong> <strong>drains</strong> <strong class='color-f'>energy</strong><br>unable to <strong>see</strong> and be <strong>seen</strong> by mobs",
        //   effect: () => {
        //     m.fieldFire = true;
        //     m.fieldMeterColor = "#fff";
        //     m.fieldPhase = 0;

        //     m.hold = function () {
        //       function drawField(radius) {
        //         radius *= Math.min(4, 0.9 + 2.2 * m.energy * m.energy);
        //         const rotate = m.cycle * 0.005;
        //         m.fieldPhase += 0.5 - 0.5 * Math.sqrt(Math.max(0.01, Math.min(m.energy, 1)));
        //         const off1 = 1 + 0.06 * Math.sin(m.fieldPhase);
        //         const off2 = 1 - 0.06 * Math.sin(m.fieldPhase);
        //         ctx.beginPath();
        //         ctx.ellipse(m.pos.x, m.pos.y, radius * off1, radius * off2, rotate, 0, 2 * Math.PI);
        //         if (m.fireCDcycle > m.cycle && (input.field)) {
        //           ctx.lineWidth = 5;
        //           ctx.strokeStyle = `rgba(0, 204, 255,1)`
        //           ctx.stroke()
        //         }
        //         ctx.fillStyle = "#fff" //`rgba(0,0,0,${0.5+0.5*m.energy})`;
        //         ctx.globalCompositeOperation = "destination-in"; //in or atop
        //         ctx.fill();
        //         ctx.globalCompositeOperation = "source-over";
        //         ctx.clip();
        //       }

        //       m.isCloak = false //isCloak disables most uses of foundPlayer() 
        //       player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
        //       if (m.isHolding) {
        //         if (this.fieldRange < 2000) {
        //           this.fieldRange += 100
        //           drawField(this.fieldRange)
        //         }
        //         m.drawHold(m.holdingTarget);
        //         m.holding();
        //         m.throwBlock();
        //       } else if (input.field) {
        //         m.grabPowerUp();
        //         m.lookForPickUp();

        //         if (m.fieldCDcycle < m.cycle) {
        //           // simulation.draw.bodyFill = "transparent"
        //           // simulation.draw.bodyStroke = "transparent"

        //           const DRAIN = 0.00013 + (m.fireCDcycle > m.cycle ? 0.005 : 0)
        //           if (m.energy > DRAIN) {
        //             m.energy -= DRAIN;
        //             // if (m.energy < 0.001) {
        //             //   m.fieldCDcycle = m.cycle + 120;
        //             //   m.energy = 0;
        //             //   m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //             // }
        //             this.fieldRange = this.fieldRange * 0.8 + 0.2 * 160
        //             drawField(this.fieldRange)

        //             m.isCloak = true //isCloak disables most uses of foundPlayer() 
        //             player.collisionFilter.mask = cat.map


        //             let inPlayer = Matter.Query.region(mob, player.bounds)
        //             if (inPlayer.length > 0) {
        //               for (let i = 0; i < inPlayer.length; i++) {
        //                 if (inPlayer[i].shield) {
        //                   m.energy -= 0.005; //shields drain player energy
        //                   //draw outline of shield
        //                   ctx.fillStyle = `rgba(140,217,255,0.5)`
        //                   ctx.fill()
        //                 } else if (tech.superposition && inPlayer[i].isDropPowerUp) {
        //                   // inPlayer[i].damage(0.4 * m.dmgScale); //damage mobs inside the player
        //                   // m.energy += 0.005;

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
        //             m.fieldCDcycle = m.cycle + 120;
        //             m.energy = 0;
        //             m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //             drawField(this.fieldRange)
        //           }
        //         }
        //       } else if (m.holdingTarget && m.fieldCDcycle < m.cycle) { //holding, but field button is released
        //         m.pickUp();
        //         if (this.fieldRange < 2000) {
        //           this.fieldRange += 100
        //           drawField(this.fieldRange)
        //         }
        //       } else {
        //         // this.fieldRange = 3000
        //         if (this.fieldRange < 2000 && m.holdingTarget === null) {
        //           this.fieldRange += 100
        //           drawField(this.fieldRange)
        //         }
        //         m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
        //       }

        //       if (m.energy < m.maxEnergy) {
        //         m.energy += m.fieldRegen;
        //         const xOff = m.pos.x - m.radius * m.maxEnergy
        //         const yOff = m.pos.y - 50
        //         ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        //         ctx.fillRect(xOff, yOff, 60 * m.maxEnergy, 10);
        //         ctx.fillStyle = m.fieldMeterColor;
        //         ctx.fillRect(xOff, yOff, 60 * m.energy, 10);
        //         ctx.beginPath()
        //         ctx.rect(xOff, yOff, 60 * m.maxEnergy, 10);
        //         ctx.strokeStyle = "rgb(0, 0, 0)";
        //         ctx.lineWidth = 1;
        //         ctx.stroke();
        //       }
        //       if (m.energy < 0) m.energy = 0
        //     }
        //   }
        // },
        {
            name: "pilot wave",
            //<br><strong class='color-block'>blocks</strong> can't <strong>collide</strong> with <strong>intangible</strong> mobs
            //field <strong>radius</strong> decreases out of <strong>line of sight</strong>
            description: "use <strong class='color-f'>energy</strong> to guide <strong class='color-block'>blocks</strong><br><strong>unlock</strong> <strong class='color-m'>tech</strong> from other <strong class='color-f'>fields</strong><br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second",
            effect: () => {
                m.fieldMeterColor = "#333"
                m.eyeFillColor = m.fieldMeterColor

                m.fieldPhase = 0;
                m.fieldPosition = {
                    x: simulation.mouseInGame.x,
                    y: simulation.mouseInGame.y
                }
                m.lastFieldPosition = {
                    x: simulation.mouseInGame.x,
                    y: simulation.mouseInGame.y
                }
                m.fieldOn = false;
                m.fieldRadius = 0;
                m.drop();
                m.hold = function() {
                    if (input.field) {
                        if (m.fieldCDcycle < m.cycle) {
                            const scale = 25
                            const bounds = {
                                min: {
                                    x: m.fieldPosition.x - scale,
                                    y: m.fieldPosition.y - scale
                                },
                                max: {
                                    x: m.fieldPosition.x + scale,
                                    y: m.fieldPosition.y + scale
                                }
                            }
                            const isInMap = Matter.Query.region(map, bounds).length
                            // const isInMap = Matter.Query.point(map, m.fieldPosition).length

                            if (!m.fieldOn) { // if field was off, and it starting up, teleport to new mouse location
                                m.fieldOn = true;
                                // m.fieldPosition = { //smooth the mouse position,  set to starting at player
                                //     x: m.pos.x,
                                //     y: m.pos.y
                                // }
                                m.fieldPosition = { //smooth the mouse position, set to mouse's current location
                                    x: simulation.mouseInGame.x,
                                    y: simulation.mouseInGame.y
                                }
                                m.lastFieldPosition = { //used to find velocity of field changes
                                    x: m.fieldPosition.x,
                                    y: m.fieldPosition.y
                                }
                            } else { //when field is on it smoothly moves towards the mouse
                                m.lastFieldPosition = { //used to find velocity of field changes
                                    x: m.fieldPosition.x,
                                    y: m.fieldPosition.y
                                }
                                const smooth = isInMap ? 0.985 : 0.96;
                                m.fieldPosition = { //smooth the mouse position
                                    x: m.fieldPosition.x * smooth + simulation.mouseInGame.x * (1 - smooth),
                                    y: m.fieldPosition.y * smooth + simulation.mouseInGame.y * (1 - smooth),
                                }
                            }

                            //grab power ups into the field
                            for (let i = 0, len = powerUp.length; i < len; ++i) {
                                const dxP = m.fieldPosition.x - powerUp[i].position.x;
                                const dyP = m.fieldPosition.y - powerUp[i].position.y;
                                const dist2 = dxP * dxP + dyP * dyP + 200;
                                // float towards field  if looking at and in range  or  if very close to player
                                if (
                                    dist2 < m.fieldRadius * m.fieldRadius &&
                                    (m.lookingAt(powerUp[i]) || dist2 < 16000)
                                ) {
                                    powerUp[i].force.x += 0.05 * (dxP / Math.sqrt(dist2)) * powerUp[i].mass;
                                    powerUp[i].force.y += 0.05 * (dyP / Math.sqrt(dist2)) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                                    //extra friction
                                    Matter.Body.setVelocity(powerUp[i], {
                                        x: powerUp[i].velocity.x * 0.11,
                                        y: powerUp[i].velocity.y * 0.11
                                    });
                                    if (
                                        dist2 < 5000 &&
                                        !simulation.isChoosing &&
                                        (powerUp[i].name !== "heal" || m.health !== m.maxHealth || tech.isOverHeal)
                                        // (powerUp[i].name !== "heal" || m.health < 0.94 * m.maxHealth)
                                        // (powerUp[i].name !== "ammo" || b.guns[b.activeGun].ammo !== Infinity)
                                    ) { //use power up if it is close enough
                                        powerUps.onPickUp(powerUp[i]);
                                        powerUp[i].effect();
                                        Matter.Composite.remove(engine.world, powerUp[i]);
                                        powerUp.splice(i, 1);
                                        // m.fieldRadius += 50
                                        break; //because the array order is messed up after splice
                                    }
                                }
                            }
                            //grab power ups normally too
                            m.grabPowerUp();

                            if (m.energy > 0.01) {
                                //find mouse velocity
                                const diff = Vector.sub(m.fieldPosition, m.lastFieldPosition)
                                const speed = Vector.magnitude(diff)
                                const velocity = Vector.mult(Vector.normalise(diff), Math.min(speed, 60)) //limit velocity
                                let radius, radiusSmooth
                                if (Matter.Query.ray(map, m.fieldPosition, player.position).length) { //is there something block the player's view of the field
                                    radius = 0
                                    radiusSmooth = Math.max(0, isInMap ? 0.96 - 0.02 * speed : 0.995); //0.99
                                } else {
                                    radius = Math.max(50, 250 - 2 * speed)
                                    radiusSmooth = 0.97
                                }
                                m.fieldRadius = m.fieldRadius * radiusSmooth + radius * (1 - radiusSmooth)

                                for (let i = 0, len = body.length; i < len; ++i) {
                                    if (Vector.magnitude(Vector.sub(body[i].position, m.fieldPosition)) < m.fieldRadius && !body[i].isNotHoldable) {
                                        const DRAIN = speed * body[i].mass * 0.0000035 // * (1 + m.energy * m.energy) //drain more energy when you have more energy
                                        if (m.energy > DRAIN) {
                                            m.energy -= DRAIN;
                                            Matter.Body.setVelocity(body[i], velocity); //give block mouse velocity
                                            Matter.Body.setAngularVelocity(body[i], body[i].angularVelocity * 0.8)
                                            // body[i].force.y -= body[i].mass * simulation.g; //remove gravity effects
                                            //blocks drift towards center of pilot wave
                                            const sub = Vector.sub(m.fieldPosition, body[i].position)
                                            const push = Vector.mult(Vector.normalise(sub), 0.0001 * body[i].mass * Vector.magnitude(sub))
                                            body[i].force.x += push.x
                                            body[i].force.y += push.y - body[i].mass * simulation.g //remove gravity effects
                                            // if (body[i].collisionFilter.category !== cat.bullet) {
                                            //     body[i].collisionFilter.category = cat.bullet;
                                            // }
                                        } else {
                                            m.fieldCDcycle = m.cycle + 120;
                                            m.fieldOn = false
                                            m.fieldRadius = 0
                                            break
                                        }
                                    }
                                }


                                // m.holdingTarget.collisionFilter.category = cat.bullet;
                                // m.holdingTarget.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield;
                                // //check every second to see if player is away from thrown body, and make solid
                                // const solid = function(that) {
                                //     const dx = that.position.x - player.position.x;
                                //     const dy = that.position.y - player.position.y;
                                //     if (that.speed < 3 && dx * dx + dy * dy > 10000 && that !== m.holdingTarget) {
                                //         that.collisionFilter.category = cat.body; //make solid
                                //         that.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet; //can hit player now
                                //     } else {
                                //         setTimeout(solid, 40, that);
                                //     }
                                // };
                                // setTimeout(solid, 200, m.holdingTarget);



                                // if (tech.isFreezeMobs) {
                                //     for (let i = 0, len = mob.length; i < len; ++i) {
                                //         if (!mob[i].isMobBullet && !mob[i].shield && !mob[i].isShielded && Vector.magnitude(Vector.sub(mob[i].position, m.fieldPosition)) < m.fieldRadius + mob[i].radius) {
                                //             const ICE_DRAIN = 0.0005
                                //             if (m.energy > ICE_DRAIN) m.energy -= ICE_DRAIN;
                                //             mobs.statusSlow(mob[i], 180)
                                //         }
                                //     }
                                // }

                                ctx.beginPath();
                                const rotate = m.cycle * 0.008;
                                m.fieldPhase += 0.2 // - 0.5 * Math.sqrt(Math.min(m.energy, 1));
                                const off1 = 1 + 0.06 * Math.sin(m.fieldPhase);
                                const off2 = 1 - 0.06 * Math.sin(m.fieldPhase);
                                ctx.beginPath();
                                ctx.ellipse(m.fieldPosition.x, m.fieldPosition.y, 1.2 * m.fieldRadius * off1, 1.2 * m.fieldRadius * off2, rotate, 0, 2 * Math.PI);
                                ctx.globalCompositeOperation = "exclusion"; //"exclusion" "difference";
                                ctx.fillStyle = "#fff"; //"#eef";
                                ctx.fill();
                                ctx.globalCompositeOperation = "source-over";
                                ctx.beginPath();
                                ctx.ellipse(m.fieldPosition.x, m.fieldPosition.y, 1.2 * m.fieldRadius * off1, 1.2 * m.fieldRadius * off2, rotate, 0, 2 * Math.PI * m.energy / m.maxEnergy);
                                ctx.strokeStyle = "#000";
                                ctx.lineWidth = 4;
                                ctx.stroke();
                            } else {
                                m.fieldCDcycle = m.cycle + 120;
                                m.fieldOn = false
                                m.fieldRadius = 0
                            }
                        } else {
                            m.grabPowerUp();
                        }
                    } else {
                        m.fieldOn = false
                        m.fieldRadius = 0
                    }
                    m.drawRegenEnergy("rgba(0,0,0,0.2)")
                }
            }
        },
        {
            name: "wormhole",
            //<strong class='color-worm'>wormholes</strong> attract <strong class='color-block'>blocks</strong> and power ups<br>
            description: "use <strong class='color-f'>energy</strong> to <strong>tunnel</strong> through a <strong class='color-worm'>wormhole</strong><br><strong>+3%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong><br>generate <strong>6</strong> <strong class='color-f'>energy</strong> per second", //<br>bullets may also traverse <strong class='color-worm'>wormholes</strong>
            drain: 0,
            effect: function() {
                m.fieldMeterColor = "#bbf" //"#0c5"
                m.eyeFillColor = m.fieldMeterColor

                m.duplicateChance = 0.03
                m.fieldRange = 0
                powerUps.setDupChance(); //needed after adjusting duplication chance

                m.hold = function() {
                    // m.hole = {  //this is reset with each new field, but I'm leaving it here for reference
                    //   isOn: false,
                    //   isReady: true,
                    //   pos1: {x: 0,y: 0},
                    //   pos2: {x: 0,y: 0},
                    //   angle: 0,
                    //   unit:{x:0,y:0},
                    // }
                    if (m.hole.isOn) {
                        // draw holes
                        m.fieldRange = 0.97 * m.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                        const semiMajorAxis = m.fieldRange + 30
                        const edge1a = Vector.add(Vector.mult(m.hole.unit, semiMajorAxis), m.hole.pos1)
                        const edge1b = Vector.add(Vector.mult(m.hole.unit, -semiMajorAxis), m.hole.pos1)
                        const edge2a = Vector.add(Vector.mult(m.hole.unit, semiMajorAxis), m.hole.pos2)
                        const edge2b = Vector.add(Vector.mult(m.hole.unit, -semiMajorAxis), m.hole.pos2)
                        ctx.beginPath();
                        ctx.moveTo(edge1a.x, edge1a.y)
                        ctx.bezierCurveTo(m.hole.pos1.x, m.hole.pos1.y, m.hole.pos2.x, m.hole.pos2.y, edge2a.x, edge2a.y);
                        ctx.lineTo(edge2b.x, edge2b.y)
                        ctx.bezierCurveTo(m.hole.pos2.x, m.hole.pos2.y, m.hole.pos1.x, m.hole.pos1.y, edge1b.x, edge1b.y);
                        ctx.fillStyle = `rgba(255,255,255,${200 / m.fieldRange / m.fieldRange})` //"rgba(0,0,0,0.1)"
                        ctx.fill();
                        ctx.beginPath();
                        ctx.ellipse(m.hole.pos1.x, m.hole.pos1.y, m.fieldRange, semiMajorAxis, m.hole.angle, 0, 2 * Math.PI)
                        ctx.ellipse(m.hole.pos2.x, m.hole.pos2.y, m.fieldRange, semiMajorAxis, m.hole.angle, 0, 2 * Math.PI)
                        ctx.fillStyle = `rgba(255,255,255,${32 / m.fieldRange})`
                        ctx.fill();

                        //suck power ups
                        for (let i = 0, len = powerUp.length; i < len; ++i) {
                            //which hole is closer
                            const dxP1 = m.hole.pos1.x - powerUp[i].position.x;
                            const dyP1 = m.hole.pos1.y - powerUp[i].position.y;
                            const dxP2 = m.hole.pos2.x - powerUp[i].position.x;
                            const dyP2 = m.hole.pos2.y - powerUp[i].position.y;
                            let dxP, dyP, dist2
                            if (dxP1 * dxP1 + dyP1 * dyP1 < dxP2 * dxP2 + dyP2 * dyP2) {
                                dxP = dxP1
                                dyP = dyP1
                            } else {
                                dxP = dxP2
                                dyP = dyP2
                            }
                            dist2 = dxP * dxP + dyP * dyP;
                            if (dist2 < 600000) { //&& !(m.health === m.maxHealth && powerUp[i].name === "heal")
                                powerUp[i].force.x += 4 * (dxP / dist2) * powerUp[i].mass; // float towards hole
                                powerUp[i].force.y += 4 * (dyP / dist2) * powerUp[i].mass - powerUp[i].mass * simulation.g; //negate gravity
                                Matter.Body.setVelocity(powerUp[i], { //extra friction
                                    x: powerUp[i].velocity.x * 0.05,
                                    y: powerUp[i].velocity.y * 0.05
                                });
                                if (dist2 < 1000 && !simulation.isChoosing) { //use power up if it is close enough

                                    // if (true) { //AoE radiation effect
                                    //     const range = 800

                                    //     for (let i = 0, len = mob.length; i < len; ++i) {
                                    //         if (mob[i].alive && !mob[i].isShielded) {
                                    //             dist = Vector.magnitude(Vector.sub(powerUp[i].position, mob[i].position)) - mob[i].radius;
                                    //             if (dist < range) mobs.statusDoT(mob[i], 0.5) //apply radiation damage status effect on direct hits
                                    //         }
                                    //     }

                                    //     simulation.drawList.push({
                                    //         x: powerUp[i].position.x,
                                    //         y: powerUp[i].position.y,
                                    //         radius: range,
                                    //         color: "rgba(0,150,200,0.3)",
                                    //         time: 4
                                    //     });
                                    // }

                                    m.fieldRange *= 0.8
                                    powerUps.onPickUp(powerUp[i]);
                                    powerUp[i].effect();
                                    Matter.Composite.remove(engine.world, powerUp[i]);
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
                                const dist1 = Vector.magnitude(Vector.sub(m.hole.pos1, body[i].position))
                                const dist2 = Vector.magnitude(Vector.sub(m.hole.pos2, body[i].position))
                                if (dist1 < dist2) {
                                    if (dist1 < suckRange) {
                                        const pull = Vector.mult(Vector.normalise(Vector.sub(m.hole.pos1, body[i].position)), 1)
                                        const slow = Vector.mult(body[i].velocity, slowScale)
                                        Matter.Body.setVelocity(body[i], Vector.add(slow, pull));
                                        //shrink
                                        if (Vector.magnitude(Vector.sub(m.hole.pos1, body[i].position)) < shrinkRange) {
                                            Matter.Body.scale(body[i], shrinkScale, shrinkScale);
                                            if (body[i].mass < 0.05) {
                                                Matter.Composite.remove(engine.world, body[i]);
                                                body.splice(i, 1);
                                                m.fieldRange *= 0.8
                                                if ((m.fieldMode === 0 || m.fieldMode === 9) && m.immuneCycle < m.cycle) m.energy += 0.2 * m.coupling
                                                if (tech.isWormholeWorms) { //pandimensional spermia
                                                    b.worm(Vector.add(m.hole.pos2, Vector.rotate({ x: m.fieldRange * 0.4, y: 0 }, 2 * Math.PI * Math.random())))
                                                    Matter.Body.setVelocity(bullet[bullet.length - 1], Vector.mult(Vector.rotate(m.hole.unit, Math.PI / 2), -10));
                                                    // for (let i = 0, len = Math.ceil(1.25 * Math.random()); i < len; i++) {
                                                    // }
                                                }
                                                break
                                            }
                                        }
                                    }
                                } else if (dist2 < suckRange) {
                                    const pull = Vector.mult(Vector.normalise(Vector.sub(m.hole.pos2, body[i].position)), 1)
                                    const slow = Vector.mult(body[i].velocity, slowScale)
                                    Matter.Body.setVelocity(body[i], Vector.add(slow, pull));
                                    //shrink
                                    if (Vector.magnitude(Vector.sub(m.hole.pos2, body[i].position)) < shrinkRange) {
                                        Matter.Body.scale(body[i], shrinkScale, shrinkScale);
                                        if (body[i].mass < 0.05) {
                                            Matter.Composite.remove(engine.world, body[i]);
                                            body.splice(i, 1);
                                            m.fieldRange *= 0.8
                                            // if (tech.isWormholeEnergy && m.energy < m.maxEnergy * 2) m.energy = m.maxEnergy * 2
                                            // if (tech.isWormholeEnergy && m.immuneCycle < m.cycle) m.energy += 0.5
                                            if ((m.fieldMode === 0 || m.fieldMode === 9) && m.immuneCycle < m.cycle) m.energy += 0.2 * m.coupling
                                            if (m.fieldMode === 0 || m.fieldMode === 9) m.energy += 0.2 * m.coupling
                                            if (tech.isWormholeWorms) { //pandimensional spermia
                                                b.worm(Vector.add(m.hole.pos1, Vector.rotate({ x: m.fieldRange * 0.4, y: 0 }, 2 * Math.PI * Math.random())))
                                                Matter.Body.setVelocity(bullet[bullet.length - 1], Vector.mult(Vector.rotate(m.hole.unit, Math.PI / 2), 5));
                                                // for (let i = 0, len = Math.ceil(1.25 * Math.random()); i < len; i++) {
                                                // }
                                            }
                                            break
                                        }
                                    }
                                }
                            }
                        }
                        if (tech.isWormHoleBullets) {
                            //teleport bullets
                            for (let i = 0, len = bullet.length; i < len; ++i) { //teleport bullets from hole1 to hole2
                                if (!bullet[i].botType && !bullet[i].isInHole) { //don't teleport bots
                                    if (Vector.magnitude(Vector.sub(m.hole.pos1, bullet[i].position)) < m.fieldRange) { //find if bullet is touching hole1
                                        Matter.Body.setPosition(bullet[i], Vector.add(m.hole.pos2, Vector.sub(m.hole.pos1, bullet[i].position)));
                                        m.fieldRange += 5
                                        bullet[i].isInHole = true
                                    } else if (Vector.magnitude(Vector.sub(m.hole.pos2, bullet[i].position)) < m.fieldRange) { //find if bullet is touching hole1
                                        Matter.Body.setPosition(bullet[i], Vector.add(m.hole.pos1, Vector.sub(m.hole.pos2, bullet[i].position)));
                                        m.fieldRange += 5
                                        bullet[i].isInHole = true
                                    }
                                }
                            }
                            // mobs get pushed away
                            for (let i = 0, len = mob.length; i < len; i++) {
                                if (Vector.magnitude(Vector.sub(m.hole.pos1, mob[i].position)) < 200) {
                                    const pull = Vector.mult(Vector.normalise(Vector.sub(m.hole.pos1, mob[i].position)), -0.07)
                                    Matter.Body.setVelocity(mob[i], Vector.add(mob[i].velocity, pull));
                                }
                                if (Vector.magnitude(Vector.sub(m.hole.pos2, mob[i].position)) < 200) {
                                    const pull = Vector.mult(Vector.normalise(Vector.sub(m.hole.pos2, mob[i].position)), -0.07)
                                    Matter.Body.setVelocity(mob[i], Vector.add(mob[i].velocity, pull));
                                }
                            }
                        }
                    }

                    if (m.fieldCDcycle < m.cycle) {
                        const scale = 60
                        const justPastMouse = Vector.add(Vector.mult(Vector.normalise(Vector.sub(simulation.mouseInGame, m.pos)), 50), simulation.mouseInGame)
                        const sub = Vector.sub(simulation.mouseInGame, m.pos)
                        const mag = Vector.magnitude(sub)

                        if (input.field) {
                            if (tech.isWormHolePause) {
                                const drain = m.fieldRegen + 0.0004
                                if (m.energy > drain) {
                                    m.energy -= drain
                                    if (m.immuneCycle < m.cycle + 1) m.immuneCycle = m.cycle + 1; //player is immune to damage for 1 cycle
                                    m.isBodiesAsleep = true;

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
                                    simulation.cycle--; //pause all functions that depend on game cycle increasing
                                    Matter.Body.setVelocity(player, { //keep player frozen
                                        x: 0,
                                        y: -55 * player.mass * simulation.g //undo gravity before it is added
                                    });
                                    player.force.x = 0
                                    player.force.y = 0
                                } else {
                                    m.wakeCheck();
                                    m.energy = 0;
                                }
                            }

                            m.grabPowerUp();
                            //draw possible wormhole
                            if (tech.isWormholeMapIgnore && Matter.Query.ray(map, m.pos, justPastMouse).length !== 0) {
                                this.drain = (0.06 + 0.006 * Math.sqrt(mag)) * 2
                            } else {
                                this.drain = tech.isFreeWormHole ? 0 : 0.06 + 0.006 * Math.sqrt(mag)
                            }
                            const unit = Vector.perp(Vector.normalise(sub))
                            const where = { x: m.pos.x + 30 * Math.cos(m.angle), y: m.pos.y + 30 * Math.sin(m.angle) }
                            m.fieldRange = 0.97 * m.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                            const edge2a = Vector.add(Vector.mult(unit, 1.5 * m.fieldRange), simulation.mouseInGame)
                            const edge2b = Vector.add(Vector.mult(unit, -1.5 * m.fieldRange), simulation.mouseInGame)
                            ctx.beginPath();
                            ctx.moveTo(where.x, where.y)
                            ctx.bezierCurveTo(where.x, where.y, simulation.mouseInGame.x, simulation.mouseInGame.y, edge2a.x, edge2a.y);
                            ctx.moveTo(where.x, where.y)
                            ctx.bezierCurveTo(where.x, where.y, simulation.mouseInGame.x, simulation.mouseInGame.y, edge2b.x, edge2b.y);
                            if (
                                mag > 250 && m.energy > this.drain &&
                                (tech.isWormholeMapIgnore || Matter.Query.ray(map, m.pos, justPastMouse).length === 0) &&
                                Matter.Query.region(map, {
                                    min: {
                                        x: simulation.mouseInGame.x - scale,
                                        y: simulation.mouseInGame.y - scale
                                    },
                                    max: {
                                        x: simulation.mouseInGame.x + scale,
                                        y: simulation.mouseInGame.y + scale
                                    }
                                }).length === 0
                            ) {
                                m.hole.isReady = true;
                                // ctx.fillStyle = "rgba(255,255,255,0.5)"
                                // ctx.fill();
                                ctx.lineWidth = 1
                                ctx.strokeStyle = "#000"
                                ctx.stroke();
                            } else {
                                m.hole.isReady = false;
                                ctx.lineWidth = 1
                                ctx.strokeStyle = "#000"
                                ctx.lineDashOffset = 30 * Math.random()
                                ctx.setLineDash([20, 40]);
                                ctx.stroke();
                                ctx.setLineDash([]);
                            }
                        } else {
                            if (tech.isWormHolePause && m.isBodiesAsleep) m.wakeCheck();

                            //make new wormhole
                            if (
                                m.hole.isReady && mag > 250 && m.energy > this.drain &&
                                (tech.isWormholeMapIgnore || Matter.Query.ray(map, m.pos, justPastMouse).length === 0) &&
                                Matter.Query.region(map, {
                                    min: {
                                        x: simulation.mouseInGame.x - scale,
                                        y: simulation.mouseInGame.y - scale
                                    },
                                    max: {
                                        x: simulation.mouseInGame.x + scale,
                                        y: simulation.mouseInGame.y + scale
                                    }
                                }).length === 0
                            ) {
                                m.energy -= this.drain
                                m.hole.isReady = false;
                                m.fieldRange = 0
                                Matter.Body.setPosition(player, simulation.mouseInGame);
                                m.buttonCD_jump = 0 //this might fix a bug with jumping
                                const velocity = Vector.mult(Vector.normalise(sub), 20)
                                Matter.Body.setVelocity(player, {
                                    x: velocity.x,
                                    y: velocity.y - 4 //an extra vertical kick so the player hangs in place longer
                                });
                                if (m.immuneCycle < m.cycle + 5) m.immuneCycle = m.cycle + 5; //player is immune to damage for 1/4 seconds 
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

                                //set holes
                                m.hole.isOn = true;
                                m.hole.pos1.x = m.pos.x
                                m.hole.pos1.y = m.pos.y
                                m.hole.pos2.x = player.position.x
                                m.hole.pos2.y = player.position.y
                                m.hole.angle = Math.atan2(sub.y, sub.x)
                                m.hole.unit = Vector.perp(Vector.normalise(sub))

                                if (tech.isWormholeDamage) {
                                    who = Matter.Query.ray(mob, m.pos, simulation.mouseInGame, 100)
                                    for (let i = 0; i < who.length; i++) {
                                        if (who[i].body.alive) {
                                            mobs.statusDoT(who[i].body, 1, 420)
                                            mobs.statusStun(who[i].body, 360)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
                    //     const justPastMouse = Vector.add(Vector.mult(Vector.normalise(Vector.sub(simulation.mouseInGame, m.pos)), 50), simulation.mouseInGame)
                    //     const scale = 60
                    //     const sub = Vector.sub(simulation.mouseInGame, m.pos)
                    //     const mag = Vector.magnitude(sub)
                    //     const drain = tech.isFreeWormHole ? 0 : 0.06 + 0.006 * Math.sqrt(mag)
                    //     if (m.hole.isReady && mag > 250 && m.energy > drain) {
                    //         if (
                    //             Matter.Query.region(map, {
                    //                 min: {
                    //                     x: simulation.mouseInGame.x - scale,
                    //                     y: simulation.mouseInGame.y - scale
                    //                 },
                    //                 max: {
                    //                     x: simulation.mouseInGame.x + scale,
                    //                     y: simulation.mouseInGame.y + scale
                    //                 }
                    //             }).length === 0 &&
                    //             Matter.Query.ray(map, m.pos, justPastMouse).length === 0
                    //             // Matter.Query.ray(map, m.pos, simulation.mouseInGame).length === 0 &&
                    //             // Matter.Query.ray(map, player.position, simulation.mouseInGame).length === 0 &&
                    //             // Matter.Query.ray(map, player.position, justPastMouse).length === 0
                    //         ) {
                    //             m.energy -= drain
                    //             m.hole.isReady = false;
                    //             m.fieldRange = 0
                    //             Matter.Body.setPosition(player, simulation.mouseInGame);
                    //             m.buttonCD_jump = 0 //this might fix a bug with jumping
                    //             const velocity = Vector.mult(Vector.normalise(sub), 20)
                    //             Matter.Body.setVelocity(player, {
                    //                 x: velocity.x,
                    //                 y: velocity.y - 4 //an extra vertical kick so the player hangs in place longer
                    //             });
                    //             if (m.immuneCycle < m.cycle + 15) m.immuneCycle = m.cycle + 15; //player is immune to damage for 1/4 seconds 
                    //             // move bots to player
                    //             for (let i = 0; i < bullet.length; i++) {
                    //                 if (bullet[i].botType) {
                    //                     Matter.Body.setPosition(bullet[i], Vector.add(player.position, {
                    //                         x: 250 * (Math.random() - 0.5),
                    //                         y: 250 * (Math.random() - 0.5)
                    //                     }));
                    //                     Matter.Body.setVelocity(bullet[i], {
                    //                         x: 0,
                    //                         y: 0
                    //                     });
                    //                 }
                    //             }

                    //             //set holes
                    //             m.hole.isOn = true;
                    //             m.hole.pos1.x = m.pos.x
                    //             m.hole.pos1.y = m.pos.y
                    //             m.hole.pos2.x = player.position.x
                    //             m.hole.pos2.y = player.position.y
                    //             m.hole.angle = Math.atan2(sub.y, sub.x)
                    //             m.hole.unit = Vector.perp(Vector.normalise(sub))

                    //             if (tech.isWormholeDamage) {
                    //                 who = Matter.Query.ray(mob, m.pos, simulation.mouseInGame, 100)
                    //                 for (let i = 0; i < who.length; i++) {
                    //                     if (who[i].body.alive) {
                    //                         mobs.statusDoT(who[i].body, 1, 420)
                    //                         mobs.statusStun(who[i].body, 360)
                    //                     }
                    //                 }
                    //             }
                    //         } else {
                    //             //draw failed wormhole
                    //             const unit = Vector.perp(Vector.normalise(Vector.sub(simulation.mouseInGame, m.pos)))
                    //             const where = { x: m.pos.x + 30 * Math.cos(m.angle), y: m.pos.y + 30 * Math.sin(m.angle), }
                    //             m.fieldRange = 0.97 * m.fieldRange + 0.03 * (50 + 10 * Math.sin(simulation.cycle * 0.025))
                    //             const edge2a = Vector.add(Vector.mult(unit, 1.5 * m.fieldRange), simulation.mouseInGame)
                    //             const edge2b = Vector.add(Vector.mult(unit, -1.5 * m.fieldRange), simulation.mouseInGame)
                    //             ctx.beginPath();
                    //             ctx.moveTo(where.x, where.y)
                    //             ctx.bezierCurveTo(where.x, where.y, simulation.mouseInGame.x, simulation.mouseInGame.y, edge2a.x, edge2a.y);
                    //             ctx.lineTo(edge2b.x, edge2b.y)
                    //             ctx.bezierCurveTo(simulation.mouseInGame.x, simulation.mouseInGame.y, where.x, where.y, where.x, where.y);
                    //             // ctx.fillStyle = "rgba(255,255,255,0.5)"
                    //             // ctx.fill();
                    //             ctx.lineWidth = 1
                    //             ctx.strokeStyle = "#000"
                    //             ctx.lineDashOffset = 30 * Math.random()
                    //             ctx.setLineDash([20, 40]);
                    //             ctx.stroke();
                    //             ctx.setLineDash([]);
                    //         }
                    //     }
                    //     m.grabPowerUp();
                    // } else {
                    //     m.hole.isReady = true;
                    // }
                    m.drawRegenEnergy()
                }
            },

            // rewind: function() {
            //     if (input.down) {
            //         if (input.field && m.fieldCDcycle < m.cycle) { //not hold but field button is pressed
            //             const DRAIN = 0.01
            //             if (this.rewindCount < 289 && m.energy > DRAIN) {
            //                 m.energy -= DRAIN


            //                 if (this.rewindCount === 0) {
            //                     const shortPause = function() {
            //                         if (m.defaultFPSCycle < m.cycle) { //back to default values
            //                             simulation.fpsCap = simulation.fpsCapDefault
            //                             simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                             // document.getElementById("dmg").style.transition = "opacity 1s";
            //                             // document.getElementById("dmg").style.opacity = "0";
            //                         } else {
            //                             requestAnimationFrame(shortPause);
            //                         }
            //                     };
            //                     if (m.defaultFPSCycle < m.cycle) requestAnimationFrame(shortPause);
            //                     simulation.fpsCap = 4 //1 is longest pause, 4 is standard
            //                     simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                     m.defaultFPSCycle = m.cycle
            //                 }


            //                 this.rewindCount += 10;
            //                 simulation.wipe = function() { //set wipe to have trails
            //                     // ctx.fillStyle = "rgba(255,255,255,0)";
            //                     ctx.fillStyle = `rgba(221,221,221,${0.004})`;
            //                     ctx.fillRect(0, 0, canvas.width, canvas.height);
            //                 }
            //                 let history = m.history[(m.cycle - this.rewindCount) % 300]
            //                 Matter.Body.setPosition(player, history.position);
            //                 Matter.Body.setVelocity(player, { x: history.velocity.x, y: history.velocity.y });
            //                 if (history.health > m.health) {
            //                     m.health = history.health
            //                     m.displayHealth();
            //                 }
            //                 //grab power ups
            //                 for (let i = 0, len = powerUp.length; i < len; ++i) {
            //                     const dxP = player.position.x - powerUp[i].position.x;
            //                     const dyP = player.position.y - powerUp[i].position.y;
            //                     if (dxP * dxP + dyP * dyP < 50000 && !simulation.isChoosing && !(m.health === m.maxHealth && powerUp[i].name === "heal")) {
            //                         powerUps.onPickUp(player.position);
            //                         powerUp[i].effect();
            //                         Matter.Composite.remove(engine.world, powerUp[i]);
            //                         powerUp.splice(i, 1);
            //                         const shortPause = function() {
            //                             if (m.defaultFPSCycle < m.cycle) { //back to default values
            //                                 simulation.fpsCap = simulation.fpsCapDefault
            //                                 simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                                 // document.getElementById("dmg").style.transition = "opacity 1s";
            //                                 // document.getElementById("dmg").style.opacity = "0";
            //                             } else {
            //                                 requestAnimationFrame(shortPause);
            //                             }
            //                         };
            //                         if (m.defaultFPSCycle < m.cycle) requestAnimationFrame(shortPause);
            //                         simulation.fpsCap = 3 //1 is longest pause, 4 is standard
            //                         simulation.fpsInterval = 1000 / simulation.fpsCap;
            //                         m.defaultFPSCycle = m.cycle
            //                         break; //because the array order is messed up after splice
            //                     }
            //                 }
            //                 m.immuneCycle = m.cycle + 5; //player is immune to damage for 30 cycles
            //             } else {
            //                 m.fieldCDcycle = m.cycle + 30;
            //                 // m.resetHistory();
            //             }
            //         } else {
            //             if (this.rewindCount !== 0) {
            //                 m.fieldCDcycle = m.cycle + 30;
            //                 m.resetHistory();
            //                 this.rewindCount = 0;
            //                 simulation.wipe = function() { //set wipe to normal
            //                     ctx.clearRect(0, 0, canvas.width, canvas.height);
            //                 }
            //             }
            //             m.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
            //         }
            //     }
            //     m.drawRegenEnergy()
            // },
        },
    ],
    //************************************************************************************
    //************************************************************************************
    //*************************************  SHIP  ***************************************
    //************************************************************************************
    //************************************************************************************
    isShipMode: false,
    shipMode(thrust = 0.03, drag = 0.99, torque = 1.15, rotationDrag = 0.92) { //  m.shipMode() //thrust = 0.03, drag = 0.99, torque = 1.15, rotationDrag = 0.92
        if (!m.isShipMode) {
            //if wires remove them
            for (let i = 0; i < mob.length; i++) {
                if (!mob[i].freeOfWires) mob[i].freeOfWires = true
            }
            m.isShipMode = true
            // simulation.isCheating = true
            const points = [
                { x: 29.979168754143455, y: 4.748337243898336 },
                { x: 27.04503734408824, y: 13.7801138209198 },
                { x: 21.462582474874278, y: 21.462582475257523 },
                { x: 13.780113820536943, y: 27.045037344471485 },
                { x: 4.74833724351507, y: 29.979168754526473 },
                { x: -4.748337245049098, y: 29.979168754526473 },
                { x: -13.780113822071026, y: 27.045037344471485 },
                { x: -21.46258247640829, y: 21.462582475257523 },
                { x: -27.045037345621797, y: 13.7801138209198 },
                { x: -29.979168755677012, y: 4.748337243898336 },
                { x: -29.979168755677012, y: -4.7483372446656045 },
                { x: -27.045037345621797, y: -13.78011382168726 },
                { x: -21.46258247640829, y: -21.462582476024817 },
                { x: -13.780113822071026, y: -27.045037345239006 },
                { x: -4.748337245049098, y: -29.97916875529422 },
                { x: 4.74833724351507, y: -29.97916875529422 },
                { x: 13.780113820536943, y: -27.045037345239006 },
                { x: 21.462582474874278, y: -21.462582476024817 },
                { x: 27.04503734408824, y: -13.78011382168726 },
                { x: 29.979168754143455, y: -4.7483372446656045 }
            ]
            // 
            Matter.Body.setVertices(player, Matter.Vertices.create(points, player))
            player.parts.pop()
            player.parts.pop()
            player.parts.pop()
            player.parts.pop()
            // Matter.Body.setDensity(player, 0.01); //extra dense //normal is 0.001 //makes effective life much larger
            m.defaultMass = 30
            Matter.Body.setMass(player, m.defaultMass);
            player.friction = 0.01
            player.restitution = 0.2
            // player.frictionStatic = 0.1
            // Matter.Body.setInertia(player, Infinity); //disable rotation

            // const circle = Bodies.polygon(player.position.x, player.position.x, 30, 30)
            // player.parts[0] = circle
            // Matter.Body.setVertices(player.parts[0], Matter.Vertices.create(points, player.parts[0]))
            m.spin = 0
            // m.groundControl = () => {}         //disable entering ground
            m.onGround = false
            m.lastOnGroundCycle = 0
            // playerOnGroundCheck = () => {}
            m.airControl = () => { //tank controls
                player.force.y -= player.mass * simulation.g; //undo gravity
                Matter.Body.setVelocity(player, {
                    x: drag * player.velocity.x,
                    y: drag * player.velocity.y
                });
                if (input.up) { //forward thrust
                    player.force.x += thrust * Math.cos(m.angle) * tech.squirrelJump
                    player.force.y += thrust * Math.sin(m.angle) * tech.squirrelJump
                } else if (input.down) {
                    player.force.x -= 0.6 * thrust * Math.cos(m.angle)
                    player.force.y -= 0.6 * thrust * Math.sin(m.angle)
                }
                //rotation
                Matter.Body.setAngularVelocity(player, player.angularVelocity * rotationDrag)
                if (input.right) {
                    player.torque += torque
                } else if (input.left) {
                    player.torque -= torque
                }
                m.angle += m.spin
                m.angle = player.angle
            }





            // level.exit.drawAndCheck = () => { //fix this
            //     if (
            //         player.position.x > level.exit.x &&
            //         player.position.x < level.exit.x + 100 &&
            //         player.position.y > level.exit.y - 150 &&
            //         player.position.y < level.exit.y + 40
            //     ) {
            //         level.nextLevel()
            //     }
            // }
            m.move = () => {
                m.pos.x = player.position.x;
                m.pos.y = player.position.y;
                m.Vx = player.velocity.x;
                m.Vy = player.velocity.y;

                //tracks the last 10s of player information
                m.history.splice(m.cycle % 600, 1, {
                    position: {
                        x: player.position.x,
                        y: player.position.y,
                    },
                    velocity: {
                        x: player.velocity.x,
                        y: player.velocity.y
                    },
                    yOff: m.yOff,
                    angle: m.angle,
                    health: m.health,
                    energy: m.energy,
                    activeGun: b.activeGun
                });
            }

            m.look = () => { //disable mouse aiming
                const scale = 0.8;
                m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
                m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;

                m.transX += (m.transSmoothX - m.transX) * 0.07;
                m.transY += (m.transSmoothY - m.transY) * 0.07;
            }

            simulation.camera = () => {
                const dx = simulation.mouse.x / window.innerWidth - 0.5 //x distance from mouse to window center scaled by window width
                const dy = simulation.mouse.y / window.innerHeight - 0.5 //y distance from mouse to window center scaled by window height
                const d = Math.max(dx * dx, dy * dy)
                simulation.edgeZoomOutSmooth = (1 + 4 * d * d) * 0.04 + simulation.edgeZoomOutSmooth * 0.96

                ctx.save();
                ctx.translate(canvas.width2, canvas.height2); //center
                ctx.scale(simulation.zoom / simulation.edgeZoomOutSmooth, simulation.zoom / simulation.edgeZoomOutSmooth); //zoom in once centered
                ctx.translate(-canvas.width2 + m.transX, -canvas.height2 + m.transY); //translate
                //calculate in game mouse position by undoing the zoom and translations
                simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.width2 - m.transX;
                simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.height2 - m.transY;
            }

            m.draw = () => { //just draw the circle
                ctx.save();
                ctx.globalAlpha = (m.immuneCycle < m.cycle) ? 1 : 0.5
                ctx.translate(player.position.x, player.position.y);
                ctx.rotate(player.angle);

                //thrust
                if (input.up) {
                    var grd2 = ctx.createLinearGradient(0, 0, -150, 0);
                    // grd2.addColorStop(0, 'rgba(255, 255, 155, 0.8)');
                    // grd2.addColorStop(1, 'rgba(255, 200, 0, 0.1)');
                    grd2.addColorStop(0, 'rgba(150, 200, 255, 0.7)');
                    grd2.addColorStop(1, 'rgba(150, 200, 255, 0)');
                    ctx.fillStyle = grd2;
                    ctx.beginPath();
                    ctx.moveTo(-18, -25);
                    //10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5)
                    ctx.lineTo(-18, 25);
                    ctx.lineTo(-50 - 100 * Math.random(), 0);
                    ctx.fill();
                } else if (input.down) {
                    var grd2 = ctx.createLinearGradient(0, 0, 80, 0);
                    grd2.addColorStop(0, 'rgba(150, 200, 255, 0.7)');
                    grd2.addColorStop(1, 'rgba(150, 200, 255, 0)');
                    ctx.fillStyle = grd2;
                    ctx.beginPath();
                    ctx.moveTo(20, -16);
                    //10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5)
                    ctx.lineTo(20, 16);
                    ctx.lineTo(35 + 43 * Math.random(), 0);
                    ctx.fill();
                }

                //body
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, 2 * Math.PI);
                ctx.fillStyle = m.bodyGradient
                ctx.fill();
                ctx.arc(15, 0, 4, 0, 2 * Math.PI);
                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }

            //fix collisions
            collisionChecks = (event) => {
                const pairs = event.pairs;
                for (let i = 0, j = pairs.length; i != j; i++) {
                    //mob + (player,bullet,body) collisions
                    for (let k = 0; k < mob.length; k++) {
                        if (mob[k].alive && m.alive) {
                            if (pairs[i].bodyA === mob[k]) {
                                collideMob(pairs[i].bodyB);
                                break;
                            } else if (pairs[i].bodyB === mob[k]) {
                                collideMob(pairs[i].bodyA);
                                break;
                            }

                            function collideMob(obj) {
                                //player + mob collision
                                if (
                                    m.immuneCycle < m.cycle &&
                                    // (obj === playerBody || obj === playerHead) &&
                                    (obj === player) &&
                                    !mob[k].isSlowed && !mob[k].isStunned
                                ) {
                                    mob[k].foundPlayer();
                                    let dmg = Math.min(Math.max(0.025 * Math.sqrt(mob[k].mass), 0.05), 0.3) * simulation.dmgScale; //player damage is capped at 0.3*dmgScale of 1.0
                                    if (tech.isRewindAvoidDeath && m.energy > 0.66) { //CPT reversal runs in m.damage, but it stops the rest of the collision code here too
                                        m.damage(dmg);
                                        return
                                    }
                                    m.damage(dmg);
                                    if (tech.isPiezo) m.energy += 20.48;
                                    if (tech.isStimulatedEmission) powerUps.ejectTech()
                                    if (mob[k].onHit) mob[k].onHit();
                                    if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                                    //extra kick between player and mob              //this section would be better with forces but they don't work...
                                    let angle = Math.atan2(player.position.y - mob[k].position.y, player.position.x - mob[k].position.x);
                                    Matter.Body.setVelocity(player, {
                                        x: player.velocity.x + 8 * Math.cos(angle),
                                        y: player.velocity.y + 8 * Math.sin(angle)
                                    });
                                    Matter.Body.setVelocity(mob[k], {
                                        x: mob[k].velocity.x - 8 * Math.cos(angle),
                                        y: mob[k].velocity.y - 8 * Math.sin(angle)
                                    });

                                    if (tech.isAnnihilation && !mob[k].shield && !mob[k].isShielded && !mob[k].isBoss && mob[k].isDropPowerUp && m.energy > 0.34 * m.maxEnergy) {
                                        m.energy -= 0.33 * Math.max(m.maxEnergy, m.energy)
                                        m.immuneCycle = 0; //player doesn't go immune to collision damage
                                        mob[k].death();
                                        simulation.drawList.push({ //add dmg to draw queue
                                            x: pairs[i].activeContacts[0].vertex.x,
                                            y: pairs[i].activeContacts[0].vertex.y,
                                            radius: dmg * 2000,
                                            color: "rgba(255,0,255,0.2)",
                                            time: simulation.drawTime
                                        });
                                    } else {
                                        simulation.drawList.push({ //add dmg to draw queue
                                            x: pairs[i].activeContacts[0].vertex.x,
                                            y: pairs[i].activeContacts[0].vertex.y,
                                            radius: dmg * 500,
                                            color: simulation.mobDmgColor,
                                            time: simulation.drawTime
                                        });
                                    }
                                    return;
                                    // }
                                }
                                //mob + bullet collisions
                                if (obj.classType === "bullet" && obj.speed > obj.minDmgSpeed) {
                                    obj.beforeDmg(mob[k]); //some bullets do actions when they hits things, like despawn //forces don't seem to work here
                                    let dmg = m.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)))
                                    if (tech.isCrit && mob[k].isStunned) dmg *= 4
                                    mob[k].damage(dmg);
                                    if (mob[k].alive) mob[k].foundPlayer();
                                    if (mob[k].damageReduction) {
                                        simulation.drawList.push({ //add dmg to draw queue
                                            x: pairs[i].activeContacts[0].vertex.x,
                                            y: pairs[i].activeContacts[0].vertex.y,
                                            radius: Math.log(dmg + 1.1) * 40 * mob[k].damageReduction + 3,
                                            color: simulation.playerDmgColor,
                                            time: simulation.drawTime
                                        });
                                    }
                                    return;
                                }
                                //mob + body collisions
                                if (obj.classType === "body" && obj.speed > 6) {
                                    const v = Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity));
                                    if (v > 9) {
                                        let dmg = tech.blockDamage * m.dmgScale * v * obj.mass * (tech.isMobBlockFling ? 2 : 1);
                                        if (mob[k].isShielded) dmg *= 0.7
                                        mob[k].damage(dmg, true);
                                        if (tech.isBlockPowerUps && !mob[k].alive && mob[k].isDropPowerUp && m.throwCycle > m.cycle) {
                                            let type = tech.isEnergyNoAmmo ? "heal" : "ammo"
                                            if (Math.random() < 0.4) {
                                                type = "heal"
                                            } else if (Math.random() < 0.4 && !tech.isSuperDeterminism) {
                                                type = "research"
                                            }
                                            powerUps.spawn(mob[k].position.x, mob[k].position.y, type);
                                            // for (let i = 0, len = Math.ceil(2 * Math.random()); i < len; i++) {}
                                        }

                                        const stunTime = dmg / Math.sqrt(obj.mass)
                                        if (stunTime > 0.5) mobs.statusStun(mob[k], 30 + 60 * Math.sqrt(stunTime))
                                        if (mob[k].alive && mob[k].distanceToPlayer2() < 1000000 && !m.isCloak) mob[k].foundPlayer();
                                        if (tech.fragments && obj.speed > 10 && !obj.hasFragmented) {
                                            obj.hasFragmented = true;
                                            b.targetedNail(obj.position, tech.fragments * 4)
                                        }
                                        if (mob[k].damageReduction) {
                                            simulation.drawList.push({
                                                x: pairs[i].activeContacts[0].vertex.x,
                                                y: pairs[i].activeContacts[0].vertex.y,
                                                radius: Math.log(dmg + 1.1) * 40 * mob[k].damageReduction + 3,
                                                color: simulation.playerDmgColor,
                                                time: simulation.drawTime
                                            });
                                        }
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
};