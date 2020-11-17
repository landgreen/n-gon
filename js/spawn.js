//main object for spawning things in a level
const spawn = {
    pickList: ["starter", "starter"],
    fullPickList: [
        "hopper", "hopper", "hopper", "hopper",
        "shooter", "shooter", "shooter",
        "chaser", "chaser",
        "striker", "striker",
        "laser", "laser",
        "exploder", "exploder",
        "stabber", "stabber",
        "launcher", "launcher",
        "sniper",
        "spinner",
        "grower",
        "springer",
        "beamer",
        "focuser",
        "sucker",
        "spawner",
        "ghoster",
        "sneaker",
    ],
    allowedBossList: ["chaser", "spinner", "striker", "springer", "laser", "focuser", "beamer", "exploder", "spawner", "shooter", "launcher", "stabber", "sniper"],
    setSpawnList() { //this is run at the start of each new level to determine the possible mobs for the level
        //each level has 2 mobs: one new mob and one from the last level
        spawn.pickList.splice(0, 1);
        spawn.pickList.push(spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)]);
    },
    spawnChance(chance) {
        return Math.random() < chance + 0.07 * game.difficulty && mob.length < -1 + 16 * Math.log10(game.difficulty + 1)
    },
    randomMob(x, y, chance = 1) {
        if (spawn.spawnChance(chance) || chance === Infinity) {
            const pick = this.pickList[Math.floor(Math.random() * this.pickList.length)];
            this[pick](x, y);
        }
    },
    randomSmallMob(x, y,
        num = Math.max(Math.min(Math.round(Math.random() * game.difficulty * 0.2), 4), 0),
        size = 16 + Math.ceil(Math.random() * 15),
        chance = 1) {
        if (spawn.spawnChance(chance)) {
            for (let i = 0; i < num; ++i) {
                const pick = this.pickList[Math.floor(Math.random() * this.pickList.length)];
                this[pick](x + Math.round((Math.random() - 0.5) * 20) + i * size * 2.5, y + Math.round((Math.random() - 0.5) * 20), size);
            }
        }
    },
    randomBoss(x, y, chance = 1) {
        if (spawn.spawnChance(chance) && game.difficulty > 2 || chance == Infinity) {
            //choose from the possible picklist
            let pick = this.pickList[Math.floor(Math.random() * this.pickList.length)];
            //is the pick able to be a boss?
            let canBeBoss = false;
            for (let i = 0, len = this.allowedBossList.length; i < len; ++i) {
                if (this.allowedBossList[i] === pick) {
                    canBeBoss = true;
                    break;
                }
            }
            if (canBeBoss) {
                if (Math.random() < 0.55) {
                    this.nodeBoss(x, y, pick);
                } else {
                    this.lineBoss(x, y, pick);
                }
            } else {
                if (Math.random() < 0.07) {
                    this[pick](x, y, 90 + Math.random() * 40); //one extra large mob
                } else if (Math.random() < 0.35) {
                    this.groupBoss(x, y) //hidden grouping blocks
                } else {
                    pick = (Math.random() < 0.5) ? "randomList" : "random";
                    if (Math.random() < 0.55) {
                        this.nodeBoss(x, y, pick);
                    } else {
                        this.lineBoss(x, y, pick);
                    }
                }
            }
        }
    },
    randomLevelBoss(x, y, options = ["shooterBoss", "cellBossCulture", "bomberBoss", "spiderBoss", "launcherBoss", "laserTargetingBoss", "powerUpBoss", "snakeBoss"]) {
        // other bosses: suckerBoss, laserBoss, tetherBoss,    //all need a particular level to work so they are not included
        spawn[options[Math.floor(Math.random() * options.length)]](x, y)
    },
    //mob templates *********************************************************************************************
    //***********************************************************************************************************
    finalBoss(x, y, radius = 300) {
        mobs.spawn(x, y, 6, radius, "rgb(150,150,255)");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.frictionAir = 0.01;
        me.memory = Infinity;
        me.locatePlayer();
        const density = 1
        Matter.Body.setDensity(me, density); //extra dense //normal is 0.001 //makes effective life much larger
        // spawn.shield(me, x, y, 1);
        me.onDeath = function() {
            level.bossKilled = true;
            level.exit.x = 5500;
            level.exit.y = -330;
        };
        me.onDamage = function() {};
        me.cycle = 420;
        me.endCycle = 720;
        me.mode = 0;
        me.do = function() {
            Matter.Body.setPosition(this, { //hold position
                x: x,
                y: y
            });
            Matter.Body.setVelocity(this, {
                x: 0,
                y: 0
            });
            this.modeDo(); //this does different things based on the mode
            this.checkStatus();
            this.cycle++; //switch modes÷
            // if (!mech.isBodiesAsleep) {
            if (this.health > 0.25) {
                if (this.cycle > this.endCycle) {
                    this.cycle = 0;
                    this.mode++
                    if (this.mode > 2) {
                        this.mode = 0;
                        this.fill = "#50f";
                        this.rotateVelocity = Math.abs(this.rotateVelocity) * (player.position.x > this.position.x ? 1 : -1) //rotate so that the player can get away                    
                        this.modeDo = this.modeLasers
                        //push blocks and player away, since this is the end of suck, and suck causes blocks to fall on the boss and stun it
                        Matter.Body.scale(this, 10, 10);
                        Matter.Body.setDensity(me, density); //extra dense //normal is 0.001 //makes effective life much larger
                        if (!this.isShielded) spawn.shield(this, x, y, 1); // regen shield to also prevent stun
                        for (let i = 0, len = body.length; i < len; ++i) {
                            if (body[i].position.x > this.position.x) {
                                body[i].force.x = 0.5
                            } else {
                                body[i].force.x = -0.5
                            }
                        }
                    } else if (this.mode === 1) {
                        this.fill = "#50f"; // this.fill = "rgb(150,150,255)";
                        this.modeDo = this.modeSpawns
                    } else if (this.mode === 2) {
                        this.fill = "#000";
                        this.modeDo = this.modeSuck
                        Matter.Body.scale(this, 0.1, 0.1);
                        Matter.Body.setDensity(me, 100 * density); //extra dense //normal is 0.001 //makes effective life much larger
                    }
                }
            } else if (this.mode !== 3) { //all three modes at once
                this.cycle = 0;
                Matter.Body.setDensity(me, density); //extra dense //normal is 0.001 //makes effective life much larger
                if (this.mode === 2) {
                    Matter.Body.scale(this, 5, 5);
                } else {
                    Matter.Body.scale(this, 0.5, 0.5);
                }
                this.mode = 3
                this.fill = "#000";
                this.eventHorizon = 750
                this.spawnInterval = 600
                this.rotateVelocity = 0.001 * (player.position.x > this.position.x ? 1 : -1) //rotate so that the player can get away                    
                if (!this.isShielded) spawn.shield(this, x, y, 1); //regen shield here ?
                this.modeDo = this.modeAll
            }
            // }
        };
        me.modeDo = function() {}
        me.modeAll = function() {
            this.modeSpawns()
            this.modeSuck()
            this.modeLasers()
        }
        me.spawnInterval = 302
        me.modeSpawns = function() {
            if (!(this.cycle % this.spawnInterval) && !mech.isBodiesAsleep && mob.length < 40) {
                if (this.mode !== 3) Matter.Body.setAngularVelocity(this, 0.1)
                //fire a bullet from each vertex
                let whoSpawn = spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)];
                for (let i = 0, len = this.vertices.length; i < len; i++) {
                    spawn[whoSpawn](this.vertices[i].x, this.vertices[i].y);
                    //give the bullet a rotational velocity as if they were attached to a vertex
                    const velocity = Vector.mult(Vector.perp(Vector.normalise(Vector.sub(this.position, this.vertices[i]))), -18)
                    Matter.Body.setVelocity(mob[mob.length - 1], {
                        x: this.velocity.x + velocity.x,
                        y: this.velocity.y + velocity.y
                    });
                }
                if (game.difficulty > 60) {
                    spawn.randomLevelBoss(3000, -1100)
                    if (game.difficulty > 100) {
                        spawn.randomLevelBoss(3000, -1300)
                    }
                }
            }
        }
        me.eventHorizon = 1300
        me.eventHorizonCycleRate = 4 * Math.PI / me.endCycle
        me.modeSuck = function() {
            //eventHorizon waves in and out
            const eventHorizon = this.eventHorizon * (1 - 0.25 * Math.cos(game.cycle * this.eventHorizonCycleRate)) //0.014
            //draw darkness
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, eventHorizon * 0.2, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(0,20,40,0.6)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, eventHorizon * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(0,20,40,0.4)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, eventHorizon * 0.6, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(0,20,40,0.3)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, eventHorizon * 0.8, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(0,20,40,0.2)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(0,0,0,0.05)";
            ctx.fill();
            //when player is inside event horizon
            if (Vector.magnitude(Vector.sub(this.position, player.position)) < eventHorizon) {
                if (mech.energy > 0) mech.energy -= 0.01
                if (mech.energy < 0.15) {
                    mech.damage(0.0004 * game.dmgScale);
                }
                const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                player.force.x -= 0.0017 * Math.cos(angle) * player.mass * (mech.onGround ? 1.7 : 1);
                player.force.y -= 0.0017 * Math.sin(angle) * player.mass;
                //draw line to player
                ctx.beginPath();
                ctx.moveTo(this.position.x, this.position.y);
                ctx.lineTo(mech.pos.x, mech.pos.y);
                ctx.lineWidth = Math.min(60, this.radius * 2);
                ctx.strokeStyle = "rgba(0,0,0,0.5)";
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(mech.pos.x, mech.pos.y, 40, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,0,0,0.3)";
                ctx.fill();
            }
            this.curl(eventHorizon);
        }
        me.rotateVelocity = 0.0025
        me.rotateCount = 0;
        me.modeLasers = function() {
            if (!mech.isBodiesAsleep && !this.isStunned) {
                let slowed = false //check if slowed
                for (let i = 0; i < this.status.length; i++) {
                    if (this.status[i].type === "slow") {
                        slowed = true
                        break
                    }
                }
                if (!slowed) {
                    this.rotateCount++
                    Matter.Body.setAngle(this, this.rotateCount * this.rotateVelocity)
                    Matter.Body.setAngularVelocity(this, 0)
                    Matter
                }
            }
            if (this.cycle < 240) { //damage scales up over 2 seconds to give player time to move
                const scale = this.cycle / 240
                const dmg = 0.14 * game.dmgScale * scale
                ctx.beginPath();
                this.laser(this.vertices[0], this.angle + Math.PI / 6, dmg);
                this.laser(this.vertices[1], this.angle + 3 * Math.PI / 6, dmg);
                this.laser(this.vertices[2], this.angle + 5 * Math.PI / 6, dmg);
                this.laser(this.vertices[3], this.angle + 7 * Math.PI / 6, dmg);
                this.laser(this.vertices[4], this.angle + 9 * Math.PI / 6, dmg);
                this.laser(this.vertices[5], this.angle + 11 * Math.PI / 6, dmg);
                ctx.strokeStyle = "#50f";
                ctx.lineWidth = 1.5 * scale;
                ctx.setLineDash([70 + 300 * Math.random(), 55 * Math.random()]);
                ctx.stroke(); // Draw it
                ctx.setLineDash([0, 0]);
                ctx.lineWidth = 20;
                ctx.strokeStyle = `rgba(80,0,255,${0.07*scale})`;
                ctx.stroke(); // Draw it
            } else {
                ctx.beginPath();
                this.laser(this.vertices[0], this.angle + Math.PI / 6);
                this.laser(this.vertices[1], this.angle + 3 * Math.PI / 6);
                this.laser(this.vertices[2], this.angle + 5 * Math.PI / 6);
                this.laser(this.vertices[3], this.angle + 7 * Math.PI / 6);
                this.laser(this.vertices[4], this.angle + 9 * Math.PI / 6);
                this.laser(this.vertices[5], this.angle + 11 * Math.PI / 6);
                ctx.strokeStyle = "#50f";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([70 + 300 * Math.random(), 55 * Math.random()]);
                ctx.stroke(); // Draw it
                ctx.setLineDash([0, 0]);
                ctx.lineWidth = 20;
                ctx.strokeStyle = "rgba(80,0,255,0.07)";
                ctx.stroke(); // Draw it
            }
            me.laser = function(where, angle, dmg = 0.14 * game.dmgScale) {
                const vertexCollision = function(v1, v1End, domain) {
                    for (let i = 0; i < domain.length; ++i) {
                        let vertices = domain[i].vertices;
                        const len = vertices.length - 1;
                        for (let j = 0; j < len; j++) {
                            results = game.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
                            if (results.onLine1 && results.onLine2) {
                                const dx = v1.x - results.x;
                                const dy = v1.y - results.y;
                                const dist2 = dx * dx + dy * dy;
                                if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) best = {
                                    x: results.x,
                                    y: results.y,
                                    dist2: dist2,
                                    who: domain[i],
                                    v1: vertices[j],
                                    v2: vertices[j + 1]
                                };
                            }
                        }
                        results = game.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
                        if (results.onLine1 && results.onLine2) {
                            const dx = v1.x - results.x;
                            const dy = v1.y - results.y;
                            const dist2 = dx * dx + dy * dy;
                            if (dist2 < best.dist2) best = {
                                x: results.x,
                                y: results.y,
                                dist2: dist2,
                                who: domain[i],
                                v1: vertices[0],
                                v2: vertices[len]
                            };
                        }
                    }
                };

                const seeRange = 7000;
                best = {
                    x: null,
                    y: null,
                    dist2: Infinity,
                    who: null,
                    v1: null,
                    v2: null
                };
                const look = {
                    x: where.x + seeRange * Math.cos(angle),
                    y: where.y + seeRange * Math.sin(angle)
                };
                // vertexCollision(where, look, mob);
                vertexCollision(where, look, map);
                vertexCollision(where, look, body);
                if (!mech.isCloak) vertexCollision(where, look, [player]);
                if (best.who && best.who === player && mech.immuneCycle < mech.cycle) {
                    mech.immuneCycle = mech.cycle + mod.collisionImmuneCycles; //player is immune to collision damage for 30 cycles
                    mech.damage(dmg);
                    game.drawList.push({ //add dmg to draw queue
                        x: best.x,
                        y: best.y,
                        radius: dmg * 1500,
                        color: "rgba(80,0,255,0.5)",
                        time: 20
                    });
                }
                //draw beam
                if (best.dist2 === Infinity) best = look;
                ctx.moveTo(where.x, where.y);
                ctx.lineTo(best.x, best.y);
            }
        }
    },
    groupBoss(x, y, num = 3 + Math.random() * 8) {
        for (let i = 0; i < num; i++) {
            const radius = 25 + Math.floor(Math.random() * 20)
            spawn.grouper(x + Math.random() * radius, y + Math.random() * radius, radius);
        }
    },
    grouper(x, y, radius = 25 + Math.floor(Math.random() * 20)) {
        mobs.spawn(x, y, 4, radius, "#777");
        let me = mob[mob.length - 1];
        me.g = 0.00015; //required if using 'gravity'
        me.accelMag = 0.0008 * game.accelScale;
        me.groupingRangeMax = 250000 + Math.random() * 100000;
        me.groupingRangeMin = (radius * 8) * (radius * 8);
        me.groupingStrength = 0.0005
        me.memory = 200;
        me.isGrouper = true;

        me.do = function() {
            this.gravity();
            this.checkStatus();
            if (this.seePlayer.recall) {
                this.seePlayerCheck();
                this.attraction();
                //tether to other blocks
                ctx.beginPath();
                for (let i = 0, len = mob.length; i < len; i++) {
                    if (mob[i].isGrouper && mob[i] != this && mob[i].dropPowerUp) { //don't tether to self, bullets, shields, ...
                        const distance2 = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position))
                        if (distance2 < this.groupingRangeMax) {
                            if (!mob[i].seePlayer.recall) mob[i].seePlayerCheck(); //wake up sleepy mobs
                            if (distance2 > this.groupingRangeMin) {
                                const angle = Math.atan2(mob[i].position.y - this.position.y, mob[i].position.x - this.position.x);
                                const forceMag = this.groupingStrength * mob[i].mass;
                                mob[i].force.x -= forceMag * Math.cos(angle);
                                mob[i].force.y -= forceMag * Math.sin(angle);
                            }
                            ctx.moveTo(this.position.x, this.position.y);
                            ctx.lineTo(mob[i].position.x, mob[i].position.y);
                        }
                    }
                }
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    },
    starter(x, y, radius = Math.floor(20 + 20 * Math.random())) {
        //easy mob for on level 1
        mobs.spawn(x, y, 8, radius, "#9ccdc6");
        let me = mob[mob.length - 1];
        // console.log(`mass=${me.mass}, radius = ${radius}`)
        me.accelMag = 0.0005 * game.accelScale;
        me.memory = 60;
        me.seeAtDistance2 = 1400000 //1200 vision range
        Matter.Body.setDensity(me, 0.0005) // normal density is 0.001 // this reduces life by half and decreases knockback

        me.do = function() {
            this.seePlayerByLookingAt();
            this.attraction();
            this.checkStatus();
        };
    },
    cellBossCulture(x, y, radius = 20, num = 5) {
        for (let i = 0; i < num; i++) {
            spawn.cellBoss(x, y, radius)
        }
    },
    cellBoss(x, y, radius = 20) {
        mobs.spawn(x + Math.random(), y + Math.random(), 20, radius * (1 + 1.2 * Math.random()), "rgba(0,150,155,0.7)");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.isCell = true;
        me.accelMag = 0.00015 * game.accelScale;
        me.memory = 40;
        me.isVerticesChange = true
        me.frictionAir = 0.012
        me.seePlayerFreq = Math.floor(11 + 7 * Math.random())
        me.seeAtDistance2 = 1400000;
        me.cellMassMax = 70

        me.collisionFilter.mask = cat.player | cat.bullet
        Matter.Body.setDensity(me, 0.0005) // normal density is 0.001 // this reduces life by half and decreases knockback
        // console.log(me.mass, me.radius)
        const k = 642 //k=r^2/m
        me.split = function() {
            Matter.Body.scale(this, 0.4, 0.4);
            this.radius = Math.sqrt(this.mass * k / Math.PI)
            spawn.cellBoss(this.position.x, this.position.y, this.radius);
            mob[mob.length - 1].health = this.health
        }
        me.onHit = function() { //run this function on hitting player
            this.health = 1;
            this.split();
        };
        me.onDamage = function(dmg) {
            if (Math.random() < 0.33 * dmg * Math.sqrt(this.mass) && this.health > dmg) this.split();
        }
        me.do = function() {
            if (!mech.isBodiesAsleep) {
                this.seePlayerByDistOrLOS();
                this.checkStatus();
                this.attraction();

                if (this.seePlayer.recall && this.mass < this.cellMassMax) { //grow cell radius
                    const scale = 1 + 0.0002 * this.cellMassMax / this.mass;
                    Matter.Body.scale(this, scale, scale);
                    this.radius = Math.sqrt(this.mass * k / Math.PI)
                }
                if (!(game.cycle % this.seePlayerFreq)) { //move away from other mobs
                    const repelRange = 200
                    const attractRange = 800
                    for (let i = 0, len = mob.length; i < len; i++) {
                        if (mob[i].isCell && mob[i].id !== this.id) {
                            const sub = Vector.sub(this.position, mob[i].position)
                            const dist = Vector.magnitude(sub)
                            if (dist < repelRange) {
                                this.force = Vector.mult(Vector.normalise(sub), this.mass * 0.006)
                            } else if (dist > attractRange) {
                                this.force = Vector.mult(Vector.normalise(sub), -this.mass * 0.004)
                            }
                        }
                    }
                }
            }
        };
        me.onDeath = function() {
            this.isCell = false;
            let count = 0 //count other cells
            for (let i = 0, len = mob.length; i < len; i++) {
                if (mob[i].isCell) count++
            }
            if (count < 1) { //only drop a power up if this is the last cell
                powerUps.spawnBossPowerUp(this.position.x, this.position.y)
            } else {
                this.leaveBody = false;
                this.dropPowerUp = false;
            }
        }
    },
    powerUpBoss(x, y, vertices = 9, radius = 130) {
        mobs.spawn(x, y, vertices, radius, "transparent");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.frictionAir = 0.01
        me.seeAtDistance2 = 1000000;
        me.accelMag = 0.0005 * game.accelScale;
        Matter.Body.setDensity(me, 0.0006); //normal is 0.001
        me.collisionFilter.mask = cat.bullet | cat.player
        me.memory = Infinity;
        me.seePlayerFreq = 30

        me.lockedOn = null;
        if (vertices === 9) {
            //on primary spawn
            powerUps.spawnBossPowerUp(me.position.x, me.position.y)
            powerUps.spawn(me.position.x, me.position.y, "heal");
            powerUps.spawn(me.position.x, me.position.y, "ammo");
        } else if (!mech.isCloak) {
            me.foundPlayer();
        }
        me.onHit = function() { //run this function on hitting player
            powerUps.ejectMod()
            powerUps.spawn(mech.pos.x, mech.pos.y, "heal");
            powerUps.spawn(mech.pos.x, mech.pos.y, "heal");
        };
        me.onDeath = function() {
            this.leaveBody = false;
            this.dropPowerUp = false;

            if (vertices > 3) spawn.powerUpBoss(this.position.x, this.position.y, vertices - 1)
            for (let i = 0; i < powerUp.length; i++) {
                powerUp[i].collisionFilter.mask = cat.map | cat.powerUp
            }
        };
        me.do = function() {
            this.stroke = `hsl(0,0%,${80+25*Math.sin(game.cycle*0.01)}%)`

            //steal all power ups
            for (let i = 0; i < Math.min(powerUp.length, this.vertices.length); i++) {
                powerUp[i].collisionFilter.mask = 0
                Matter.Body.setPosition(powerUp[i], this.vertices[i])
                Matter.Body.setVelocity(powerUp[i], {
                    x: 0,
                    y: 0
                })
            }

            this.seePlayerCheckByDistance();
            this.attraction();
            this.checkStatus();
        };
    },
    chaser(x, y, radius = 35 + Math.ceil(Math.random() * 40)) {
        mobs.spawn(x, y, 8, radius, "rgb(255,150,100)"); //"#2c9790"
        let me = mob[mob.length - 1];
        // Matter.Body.setDensity(me, 0.0007); //extra dense //normal is 0.001 //makes effective life much lower
        me.friction = 0;
        me.frictionAir = 0;
        me.accelMag = 0.001 * Math.sqrt(game.accelScale);
        me.g = me.accelMag * 0.6; //required if using 'gravity'
        me.memory = 50;
        spawn.shield(me, x, y);
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
        };
    },
    grower(x, y, radius = 15) {
        mobs.spawn(x, y, 7, radius, "hsl(144, 15%, 50%)");
        let me = mob[mob.length - 1];
        me.isVerticesChange = true
        me.big = false; //required for grow
        me.accelMag = 0.00045 * game.accelScale;
        me.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.player //can't touch other mobs
        // me.onDeath = function () { //helps collisions functions work better after vertex have been changed
        //   this.vertices = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices))
        // }
        me.do = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            this.attraction();
            this.grow();
        };
    },
    springer(x, y, radius = 20 + Math.ceil(Math.random() * 35)) {
        mobs.spawn(x, y, 10, radius, "#b386e8");
        let me = mob[mob.length - 1];
        me.friction = 0;
        me.frictionAir = 0.006;
        me.lookTorque = 0.0000008; //controls spin while looking for player
        me.g = 0.0002; //required if using 'gravity'
        me.seePlayerFreq = Math.round((40 + 25 * Math.random()) * game.lookFreqScale);
        const springStiffness = 0.00014;
        const springDampening = 0.0005;

        me.springTarget = {
            x: me.position.x,
            y: me.position.y
        };
        const len = cons.length;
        cons[len] = Constraint.create({
            pointA: me.springTarget,
            bodyB: me,
            stiffness: springStiffness,
            damping: springDampening
        });
        World.add(engine.world, cons[cons.length - 1]);

        cons[len].length = 100 + 1.5 * radius;
        me.cons = cons[len];

        me.springTarget2 = {
            x: me.position.x,
            y: me.position.y
        };
        const len2 = cons.length;
        cons[len2] = Constraint.create({
            pointA: me.springTarget2,
            bodyB: me,
            stiffness: springStiffness,
            damping: springDampening
        });
        World.add(engine.world, cons[cons.length - 1]);
        cons[len2].length = 100 + 1.5 * radius;
        me.cons2 = cons[len2];


        me.onDeath = function() {
            this.removeCons();
        };
        spawn.shield(me, x, y);
        me.do = function() {
            this.gravity();
            this.searchSpring();
            this.checkStatus();
            this.springAttack();
        };
    },
    hopper(x, y, radius = 30 + Math.ceil(Math.random() * 30)) {
        mobs.spawn(x, y, 5, radius, "rgb(0,200,180)");
        let me = mob[mob.length - 1];
        me.accelMag = 0.04;
        me.g = 0.0017; //required if using 'gravity'
        me.frictionAir = 0.01;
        me.restitution = 0;
        me.delay = 120 * game.CDScale;
        me.randomHopFrequency = 200 + Math.floor(Math.random() * 150);
        me.randomHopCD = game.cycle + me.randomHopFrequency;
        spawn.shield(me, x, y);
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            if (this.seePlayer.recall) {
                if (this.cd < game.cycle && (Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length)) {
                    this.cd = game.cycle + this.delay;
                    const forceMag = (this.accelMag + this.accelMag * Math.random()) * this.mass;
                    const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
                    this.force.x += forceMag * Math.cos(angle);
                    this.force.y += forceMag * Math.sin(angle) - (Math.random() * 0.07 + 0.02) * this.mass; //antigravity
                }
            } else {
                //randomly hob if not aware of player
                if (this.randomHopCD < game.cycle && (Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length)) {
                    this.randomHopCD = game.cycle + this.randomHopFrequency;
                    //slowly change randomHopFrequency after each hop
                    this.randomHopFrequency = Math.max(100, this.randomHopFrequency + (0.5 - Math.random()) * 200);
                    const forceMag = (this.accelMag + this.accelMag * Math.random()) * this.mass * (0.1 + Math.random() * 0.3);
                    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
                    this.force.x += forceMag * Math.cos(angle);
                    this.force.y += forceMag * Math.sin(angle) - 0.05 * this.mass; //antigravity
                }
            }
        };
    },
    spinner(x, y, radius = 30 + Math.ceil(Math.random() * 35)) {
        mobs.spawn(x, y, 5, radius, "#000000");
        let me = mob[mob.length - 1];
        me.fill = "#28b";
        me.rememberFill = me.fill;
        me.cd = 0;
        me.burstDir = {
            x: 0,
            y: 0
        };
        me.frictionAir = 0.022;
        me.lookTorque = 0.0000014;
        me.restitution = 0;
        spawn.shield(me, x, y);
        me.look = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            if (this.seePlayer.recall && this.cd < game.cycle) {
                this.burstDir = Vector.normalise(Vector.sub(this.seePlayer.position, this.position));
                this.cd = game.cycle + 40;
                this.do = this.spin
            }
        }
        me.do = me.look
        me.spin = function() {
            this.checkStatus();
            this.torque += 0.000035 * this.inertia;
            this.fill = randomColor({
                hue: "blue"
            });
            //draw attack vector
            const mag = this.radius * 2.5 + 50;
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 20]); //30
            const dir = Vector.add(this.position, Vector.mult(this.burstDir, mag));
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(dir.x, dir.y);
            ctx.stroke();
            ctx.setLineDash([]);
            if (this.cd < game.cycle) {
                this.fill = this.rememberFill;
                this.cd = game.cycle + 180 * game.CDScale
                this.do = this.look
                this.force = Vector.mult(this.burstDir, this.mass * 0.25);
            }
        }
    },
    sucker(x, y, radius = 40 + Math.ceil(Math.random() * 50)) {
        radius = 9 + radius / 8; //extra small
        mobs.spawn(x, y, 6, radius, "#000");
        let me = mob[mob.length - 1];
        me.stroke = "transparent"; //used for drawSneaker
        me.eventHorizon = radius * 23; //required for blackhole
        me.seeAtDistance2 = (me.eventHorizon + 200) * (me.eventHorizon + 200); //vision limit is event horizon
        me.accelMag = 0.0001 * game.accelScale;
        me.frictionAir = 0.025;
        me.collisionFilter.mask = cat.player | cat.bullet
        me.memory = Infinity;
        Matter.Body.setDensity(me, 0.004); //extra dense //normal is 0.001 //makes effective life much larger
        me.do = function() {
            //keep it slow, to stop issues from explosion knock backs
            if (this.speed > 5) {
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.99,
                    y: this.velocity.y * 0.99
                });
            }
            // this.seePlayerByDistOrLOS();
            this.seePlayerCheckByDistance()
            this.checkStatus();
            if (this.seePlayer.recall) {
                //eventHorizon waves in and out
                const eventHorizon = this.eventHorizon * (0.93 + 0.17 * Math.sin(game.cycle * 0.011))

                //accelerate towards the player
                const forceMag = this.accelMag * this.mass;
                const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
                this.force.x += forceMag * Math.cos(angle);
                this.force.y += forceMag * Math.sin(angle);

                //draw darkness
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon * 0.25, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,0,0,0.9)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon * 0.55, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.fill();

                //when player is inside event horizon
                if (Vector.magnitude(Vector.sub(this.position, player.position)) < eventHorizon) {
                    if (mech.energy > 0) mech.energy -= 0.004
                    if (mech.energy < 0.1) {
                        mech.damage(0.00015 * game.dmgScale);
                    }
                    const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                    player.force.x -= 0.00125 * player.mass * Math.cos(angle) * (mech.onGround ? 1.8 : 1);
                    player.force.y -= 0.0001 * player.mass * Math.sin(angle);
                    //draw line to player
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(mech.pos.x, mech.pos.y);
                    ctx.lineWidth = Math.min(60, this.radius * 2);
                    ctx.strokeStyle = "rgba(0,0,0,0.5)";
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(mech.pos.x, mech.pos.y, 40, 0, 2 * Math.PI);
                    ctx.fillStyle = "rgba(0,0,0,0.3)";
                    ctx.fill();
                }
            }
        }
    },
    suckerBoss(x, y, radius = 25) {
        mobs.spawn(x, y, 12, radius, "#000");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.stroke = "transparent"; //used for drawSneaker
        me.eventHorizon = 1100; //required for black hole
        me.seeAtDistance2 = (me.eventHorizon + 1000) * (me.eventHorizon + 1000); //vision limit is event horizon
        me.accelMag = 0.00003 * game.accelScale;
        me.collisionFilter.mask = cat.player | cat.bullet
        // me.frictionAir = 0.005;
        me.memory = 1600;
        Matter.Body.setDensity(me, 0.05); //extra dense //normal is 0.001 //makes effective life much larger
        me.onDeath = function() {
            //applying forces to player doesn't seem to work inside this method, not sure why
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
            if (game.difficulty > 5) {
                //teleport everything to center
                function toMe(who, where, range) {
                    for (let i = 0, len = who.length; i < len; i++) {
                        const SUB = Vector.sub(who[i].position, where)
                        const DISTANCE = Vector.magnitude(SUB)
                        if (DISTANCE < range) {
                            Matter.Body.setPosition(who[i], where)
                        }
                    }
                }
                toMe(body, this.position, this.eventHorizon)
                toMe(mob, this.position, this.eventHorizon)
                // toMe(bullet, this.position, this.eventHorizon)
            }
        };
        me.do = function() {
            //keep it slow, to stop issues from explosion knock backs
            if (this.speed > 1) {
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.95,
                    y: this.velocity.y * 0.95
                });
            }
            this.seePlayerByDistOrLOS();
            this.checkStatus();
            if (this.seePlayer.recall) {
                //accelerate towards the player
                const forceMag = this.accelMag * this.mass;
                const dx = this.seePlayer.position.x - this.position.x
                const dy = this.seePlayer.position.y - this.position.y
                const mag = Math.sqrt(dx * dx + dy * dy)
                this.force.x += forceMag * dx / mag;
                this.force.y += forceMag * dy / mag;

                //eventHorizon waves in and out
                const eventHorizon = this.eventHorizon * (1 + 0.2 * Math.sin(game.cycle * 0.008))
                //  zoom camera in and out with the event horizon

                //draw darkness
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon * 0.2, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,20,40,0.6)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon * 0.4, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,20,40,0.4)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon * 0.6, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,20,40,0.3)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon * 0.8, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,20,40,0.2)";
                ctx.fill();
                ctx.beginPath();
                ctx.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0,0,0,0.05)";
                ctx.fill();
                //when player is inside event horizon
                if (Vector.magnitude(Vector.sub(this.position, player.position)) < eventHorizon) {
                    if (mech.energy > 0) mech.energy -= 0.006
                    if (mech.energy < 0.1) {
                        mech.damage(0.0002 * game.dmgScale);
                    }
                    const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
                    player.force.x -= 0.0013 * Math.cos(angle) * player.mass * (mech.onGround ? 1.7 : 1);
                    player.force.y -= 0.0013 * Math.sin(angle) * player.mass;
                    //draw line to player
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    ctx.lineTo(mech.pos.x, mech.pos.y);
                    ctx.lineWidth = Math.min(60, this.radius * 2);
                    ctx.strokeStyle = "rgba(0,0,0,0.5)";
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(mech.pos.x, mech.pos.y, 40, 0, 2 * Math.PI);
                    ctx.fillStyle = "rgba(0,0,0,0.3)";
                    ctx.fill();
                }
                this.curl(eventHorizon);
            }
        }
    },
    spiderBoss(x, y, radius = 60 + Math.ceil(Math.random() * 10)) {
        let targets = [] //track who is in the node boss, for shields
        mobs.spawn(x, y, 6, radius, "#b386e8");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        targets.push(me.id) //add to shield protection
        me.friction = 0;
        me.frictionAir = 0.0065;
        me.lookTorque = 0.0000008; //controls spin while looking for player
        me.g = 0.0002; //required if using 'gravity'
        me.seePlayerFreq = Math.round((30 + 20 * Math.random()) * game.lookFreqScale);
        const springStiffness = 0.00014;
        const springDampening = 0.0005;

        me.springTarget = {
            x: me.position.x,
            y: me.position.y
        };
        const len = cons.length;
        cons[len] = Constraint.create({
            pointA: me.springTarget,
            bodyB: me,
            stiffness: springStiffness,
            damping: springDampening
        });
        World.add(engine.world, cons[cons.length - 1]);
        cons[len].length = 100 + 1.5 * radius;
        me.cons = cons[len];

        me.springTarget2 = {
            x: me.position.x,
            y: me.position.y
        };
        const len2 = cons.length;
        cons[len2] = Constraint.create({
            pointA: me.springTarget2,
            bodyB: me,
            stiffness: springStiffness,
            damping: springDampening,
            length: 0
        });
        World.add(engine.world, cons[cons.length - 1]);
        cons[len2].length = 100 + 1.5 * radius;
        me.cons2 = cons[len2];

        me.onDeath = function() {
            this.removeCons();
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
        };
        me.do = function() {
            this.gravity();
            this.searchSpring();
            this.checkStatus();
            this.springAttack();
        };

        radius = 22 // radius of each node mob
        const sideLength = 100 // distance between each node mob
        const nodes = 6
        const angle = 2 * Math.PI / nodes

        spawn.allowShields = false; //don't want shields on individual boss mobs

        for (let i = 0; i < nodes; ++i) {
            spawn.stabber(x + sideLength * Math.sin(i * angle), y + sideLength * Math.cos(i * angle), radius, 12);
            targets.push(mob[mob.length - 1].id) //track who is in the node boss, for shields
        }

        const attachmentStiffness = 0.05
        spawn.constrain2AdjacentMobs(nodes, attachmentStiffness, true); //loop mobs together

        for (let i = 0; i < nodes; ++i) { //attach to center mob
            consBB[consBB.length] = Constraint.create({
                bodyA: me,
                bodyB: mob[mob.length - i - 1],
                stiffness: attachmentStiffness,
                damping: 0.01
            });
            World.add(engine.world, consBB[consBB.length - 1]);
        }
        //spawn shield around all nodes
        spawn.bossShield(targets, x, y, sideLength + 1 * radius + nodes * 5 - 25);
        spawn.allowShields = true;
    },
    timeSkipBoss(x, y, radius = 55) {
        mobs.spawn(x, y, 6, radius, '#000');
        let me = mob[mob.length - 1];
        me.isBoss = true;
        // me.stroke = "transparent"; //used for drawSneaker
        me.timeSkipLastCycle = 0
        me.eventHorizon = 1800; //required for black hole
        me.seeAtDistance2 = (me.eventHorizon + 2000) * (me.eventHorizon + 2000); //vision limit is event horizon + 2000
        me.accelMag = 0.0004 * game.accelScale;
        // me.frictionAir = 0.005;
        // me.memory = 1600;
        // Matter.Body.setDensity(me, 0.02); //extra dense //normal is 0.001 //makes effective life much larger
        Matter.Body.setDensity(me, 0.0015 + 0.0005 * Math.sqrt(game.difficulty)); //extra dense //normal is 0.001 //makes effective life much larger
        spawn.shield(me, x, y, 1);


        me.onDeath = function() {
            //applying forces to player doesn't seem to work inside this method, not sure why
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
        };
        me.do = function() {
            //keep it slow, to stop issues from explosion knock backs
            if (this.speed > 8) {
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.99,
                    y: this.velocity.y * 0.99
                });
            }
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction()
            if (!game.isTimeSkipping) {
                const compress = 1
                if (this.timeSkipLastCycle < game.cycle - compress &&
                    Vector.magnitude(Vector.sub(this.position, player.position)) < this.eventHorizon) {
                    this.timeSkipLastCycle = game.cycle
                    game.timeSkip(compress)

                    this.fill = `rgba(0,0,0,${0.4+0.6*Math.random()})`
                    this.stroke = "#014"
                    this.isShielded = false;
                    this.dropPowerUp = true;
                    this.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob; //can't touch bullets

                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
                    ctx.fillStyle = "#fff";
                    ctx.globalCompositeOperation = "destination-in"; //in or atop
                    ctx.fill();
                    ctx.globalCompositeOperation = "source-over";
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
                    ctx.clip();

                    // ctx.beginPath();
                    // ctx.arc(this.position.x, this.position.y, 9999, 0, 2 * Math.PI);
                    // ctx.fillStyle = "#000";
                    // ctx.fill();
                    // ctx.strokeStyle = "#000";
                    // ctx.stroke();

                    // ctx.beginPath();
                    // ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
                    // ctx.fillStyle = `rgba(0,0,0,${0.05*Math.random()})`;
                    // ctx.fill();
                    // ctx.strokeStyle = "#000";
                    // ctx.stroke();
                } else {
                    this.isShielded = true;
                    this.dropPowerUp = false;
                    this.seePlayer.recall = false
                    this.fill = "transparent"
                    this.stroke = "transparent"
                    this.collisionFilter.mask = cat.player | cat.map | cat.body | cat.mob; //can't touch bullets
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(0,0,0,${0.05*Math.random()})`;
                    ctx.fill();
                }
            }
        }
    },
    beamer(x, y, radius = 15 + Math.ceil(Math.random() * 15)) {
        mobs.spawn(x, y, 4, radius, "rgb(255,0,190)");
        let me = mob[mob.length - 1];
        me.repulsionRange = 73000; //squared
        me.laserRange = 370;
        me.accelMag = 0.0005 * game.accelScale;
        me.frictionStatic = 0;
        me.friction = 0;
        spawn.shield(me, x, y);
        me.do = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            this.attraction();
            this.repulsion();
            //laser beam
            this.laserBeam();
        };
    },
    focuser(x, y, radius = 30 + Math.ceil(Math.random() * 10)) {
        radius = Math.ceil(radius * 0.7);
        mobs.spawn(x, y, 4, radius, "rgb(0,0,255)");
        let me = mob[mob.length - 1];
        Matter.Body.setDensity(me, 0.003); //extra dense //normal is 0.001
        me.restitution = 0;
        me.laserPos = me.position; //required for laserTracking
        me.repulsionRange = 1200000; //squared
        me.accelMag = 0.00009 * game.accelScale;
        me.frictionStatic = 0;
        me.friction = 0;
        me.onDamage = function() {
            this.laserPos = this.position;
        };
        spawn.shield(me, x, y);
        me.do = function() {
            if (!mech.isBodiesAsleep) {
                this.seePlayerByLookingAt();
                this.checkStatus();
                this.attraction();
                const dist2 = this.distanceToPlayer2();
                //laser Tracking
                if (this.seePlayer.yes && dist2 < 4000000) {
                    const rangeWidth = 2000; //this is sqrt of 4000000 from above if()
                    //targeting laser will slowly move from the mob to the player's position
                    this.laserPos = Vector.add(this.laserPos, Vector.mult(Vector.sub(player.position, this.laserPos), 0.1));
                    let targetDist = Vector.magnitude(Vector.sub(this.laserPos, mech.pos));
                    const r = 12;
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    if (targetDist < r + 16) {
                        targetDist = r + 10;
                        //charge at player
                        const forceMag = this.accelMag * 30 * this.mass;
                        const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
                        this.force.x += forceMag * Math.cos(angle);
                        this.force.y += forceMag * Math.sin(angle);
                    } else {
                        //high friction if can't lock onto player
                        // Matter.Body.setVelocity(this, {
                        //   x: this.velocity.x * 0.98,
                        //   y: this.velocity.y * 0.98
                        // });
                    }
                    if (dist2 > 80000) {
                        const laserWidth = 0.002;
                        let laserOffR = Vector.rotateAbout(this.laserPos, (targetDist - r) * laserWidth, this.position);
                        let sub = Vector.normalise(Vector.sub(laserOffR, this.position));
                        laserOffR = Vector.add(laserOffR, Vector.mult(sub, rangeWidth));
                        ctx.lineTo(laserOffR.x, laserOffR.y);

                        let laserOffL = Vector.rotateAbout(this.laserPos, (targetDist - r) * -laserWidth, this.position);
                        sub = Vector.normalise(Vector.sub(laserOffL, this.position));
                        laserOffL = Vector.add(laserOffL, Vector.mult(sub, rangeWidth));
                        ctx.lineTo(laserOffL.x, laserOffL.y);
                        ctx.fillStyle = `rgba(0,0,255,${Math.max(0,0.3*r/targetDist)})`
                        ctx.fill();
                    }
                } else {
                    this.laserPos = this.position;
                }
            };
        }
    },
    laserTargetingBoss(x, y, radius = 80) {
        const color = "#05f"
        mobs.spawn(x, y, 3, radius, color);
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
        Matter.Body.rotate(me, Math.random() * Math.PI * 2);
        me.accelMag = 0.0002 * Math.sqrt(game.accelScale);
        me.seePlayerFreq = Math.floor(30 * game.lookFreqScale);
        me.memory = 420;
        me.restitution = 1;
        me.frictionAir = 0.01;
        me.frictionStatic = 0;
        me.friction = 0;

        me.lookTorque = 0.000001 * (Math.random() > 0.5 ? -1 : 1);

        me.fireDir = {
            x: 0,
            y: 0
        }
        Matter.Body.setDensity(me, 0.023); //extra dense //normal is 0.001 //makes effective life much larger
        spawn.shield(me, x, y, 1);
        me.onHit = function() {
            //run this function on hitting player
            // this.explode();
        };
        // spawn.shield(me, x, y, 1);  //not working, not sure why
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
        };
        me.do = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            this.attraction();

            if (this.seePlayer.recall) {
                //set direction to turn to fire
                if (!(game.cycle % this.seePlayerFreq)) {
                    this.fireDir = Vector.normalise(Vector.sub(this.seePlayer.position, this.position));
                    // this.fireDir.y -= Math.abs(this.seePlayer.position.x - this.position.x) / 1600; //gives the bullet an arc
                }

                //rotate towards fireAngle
                const angle = this.angle + Math.PI / 2;
                c = Math.cos(angle) * this.fireDir.x + Math.sin(angle) * this.fireDir.y;
                const threshold = 0.4;
                if (c > threshold) {
                    this.torque += 0.000004 * this.inertia;
                } else if (c < -threshold) {
                    this.torque -= 0.000004 * this.inertia;
                }
                // if (Math.abs(c) < 0.3) {
                //   const mag = 0.05
                //   this.force.x += mag * Math.cos(this.angle)
                //   this.force.y += mag * Math.sin(this.angle)
                // }

                const vertexCollision = function(v1, v1End, domain) {
                    for (let i = 0; i < domain.length; ++i) {
                        let vertices = domain[i].vertices;
                        const len = vertices.length - 1;
                        for (let j = 0; j < len; j++) {
                            results = game.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
                            if (results.onLine1 && results.onLine2) {
                                const dx = v1.x - results.x;
                                const dy = v1.y - results.y;
                                const dist2 = dx * dx + dy * dy;
                                if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) {
                                    best = {
                                        x: results.x,
                                        y: results.y,
                                        dist2: dist2,
                                        who: domain[i],
                                        v1: vertices[j],
                                        v2: vertices[j + 1]
                                    };
                                }
                            }
                        }
                        results = game.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
                        if (results.onLine1 && results.onLine2) {
                            const dx = v1.x - results.x;
                            const dy = v1.y - results.y;
                            const dist2 = dx * dx + dy * dy;
                            if (dist2 < best.dist2) {
                                best = {
                                    x: results.x,
                                    y: results.y,
                                    dist2: dist2,
                                    who: domain[i],
                                    v1: vertices[0],
                                    v2: vertices[len]
                                };
                            }
                        }
                    }
                };

                const seeRange = 8000;
                best = {
                    x: null,
                    y: null,
                    dist2: Infinity,
                    who: null,
                    v1: null,
                    v2: null
                };
                const look = {
                    x: this.position.x + seeRange * Math.cos(this.angle),
                    y: this.position.y + seeRange * Math.sin(this.angle)
                };
                vertexCollision(this.position, look, map);
                vertexCollision(this.position, look, body);
                if (!mech.isCloak) vertexCollision(this.position, look, [player]);
                // hitting player
                if (best.who === player) {
                    if (mech.immuneCycle < mech.cycle) {
                        const dmg = 0.001 * game.dmgScale;
                        mech.damage(dmg);
                        //draw damage
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(best.x, best.y, dmg * 10000, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                }
                //draw beam
                if (best.dist2 === Infinity) {
                    best = look;
                }
                ctx.beginPath();
                ctx.moveTo(this.vertices[1].x, this.vertices[1].y);
                ctx.lineTo(best.x, best.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
                ctx.stroke();
                ctx.setLineDash([0, 0]);
            }
        };
    },
    laser(x, y, radius = 30) {
        mobs.spawn(x, y, 3, radius, "#f00");
        let me = mob[mob.length - 1];
        me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
        Matter.Body.rotate(me, Math.random() * Math.PI * 2);
        me.accelMag = 0.00007 * game.accelScale;
        me.onHit = function() {
            //run this function on hitting player
            this.explode();
        };
        me.do = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            this.attraction();
            this.laser();
        };
    },
    laserBoss(x, y, radius = 30) {
        mobs.spawn(x, y, 3, radius, "#f00");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.startingPosition = {
            x: x,
            y: y
        }
        me.count = 0;
        me.frictionAir = 0.03;
        // me.torque -= me.inertia * 0.002
        Matter.Body.setDensity(me, 0.03); //extra dense //normal is 0.001 //makes effective life much larger
        // spawn.shield(me, x, y, 1);  //not working, not sure why
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
        };
        me.rotateVelocity = Math.min(0.0045, 0.0015 * game.accelScale * game.accelScale) * (level.levelsCleared > 8 ? 1 : -1)
        me.do = function() {
            this.fill = '#' + Math.random().toString(16).substr(-6); //flash colors
            this.checkStatus();

            if (!this.isStunned) {
                if (!mech.isBodiesAsleep) {
                    //check if slowed
                    let slowed = false
                    for (let i = 0; i < this.status.length; i++) {
                        if (this.status[i].type === "slow") {
                            slowed = true
                            break
                        }
                    }
                    if (!slowed) {
                        this.count++
                        Matter.Body.setAngle(this, this.count * this.rotateVelocity)
                        Matter.Body.setAngularVelocity(this, 0)
                    }
                }
                ctx.beginPath();
                this.laser(this.vertices[0], this.angle + Math.PI / 3);
                this.laser(this.vertices[1], this.angle + Math.PI);
                this.laser(this.vertices[2], this.angle - Math.PI / 3);
                ctx.strokeStyle = "#50f";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([70 + 300 * Math.random(), 55 * Math.random()]);
                ctx.stroke(); // Draw it
                ctx.setLineDash([0, 0]);
                ctx.lineWidth = 20;
                ctx.strokeStyle = "rgba(80,0,255,0.07)";
                ctx.stroke(); // Draw it
            }


            Matter.Body.setVelocity(this, {
                x: 0,
                y: 0
            });
            Matter.Body.setPosition(this, this.startingPosition);

        };
        me.laser = function(where, angle) {
            const vertexCollision = function(v1, v1End, domain) {
                for (let i = 0; i < domain.length; ++i) {
                    let vertices = domain[i].vertices;
                    const len = vertices.length - 1;
                    for (let j = 0; j < len; j++) {
                        results = game.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
                        if (results.onLine1 && results.onLine2) {
                            const dx = v1.x - results.x;
                            const dy = v1.y - results.y;
                            const dist2 = dx * dx + dy * dy;
                            if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) best = {
                                x: results.x,
                                y: results.y,
                                dist2: dist2,
                                who: domain[i],
                                v1: vertices[j],
                                v2: vertices[j + 1]
                            };
                        }
                    }
                    results = game.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
                    if (results.onLine1 && results.onLine2) {
                        const dx = v1.x - results.x;
                        const dy = v1.y - results.y;
                        const dist2 = dx * dx + dy * dy;
                        if (dist2 < best.dist2) best = {
                            x: results.x,
                            y: results.y,
                            dist2: dist2,
                            who: domain[i],
                            v1: vertices[0],
                            v2: vertices[len]
                        };
                    }
                }
            };

            const seeRange = 7000;
            best = {
                x: null,
                y: null,
                dist2: Infinity,
                who: null,
                v1: null,
                v2: null
            };
            const look = {
                x: where.x + seeRange * Math.cos(angle),
                y: where.y + seeRange * Math.sin(angle)
            };
            // vertexCollision(where, look, mob);
            vertexCollision(where, look, map);
            vertexCollision(where, look, body);
            if (!mech.isCloak) vertexCollision(where, look, [player]);
            if (best.who && best.who === player && mech.immuneCycle < mech.cycle) {
                mech.immuneCycle = mech.cycle + mod.collisionImmuneCycles; //player is immune to collision damage for 30 cycles
                const dmg = 0.14 * game.dmgScale;
                mech.damage(dmg);
                game.drawList.push({ //add dmg to draw queue
                    x: best.x,
                    y: best.y,
                    radius: dmg * 1500,
                    color: "rgba(80,0,255,0.5)",
                    time: 20
                });
            }
            //draw beam
            if (best.dist2 === Infinity) best = look;
            ctx.moveTo(where.x, where.y);
            ctx.lineTo(best.x, best.y);
        }
    },
    stabber(x, y, radius = 25 + Math.ceil(Math.random() * 12), spikeMax = 9) {
        if (radius > 80) radius = 65;
        mobs.spawn(x, y, 6, radius, "rgb(220,50,205)"); //can't have sides above 6 or collision events don't work (probably because of a convex problem)
        let me = mob[mob.length - 1];
        me.isVerticesChange = true
        me.accelMag = 0.0006 * game.accelScale;
        // me.g = 0.0002; //required if using 'gravity'
        me.delay = 360 * game.CDScale;
        me.spikeVertex = 0;
        me.spikeLength = 0;
        me.isSpikeGrowing = false;
        me.isSpikeReset = true;
        me.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.player //can't touch other mobs
        Matter.Body.rotate(me, Math.PI * 0.1);
        spawn.shield(me, x, y);
        // me.onDamage = function () {};
        me.onDeath = function() {
            if (this.spikeLength > 4) {
                this.spikeLength = 4
                const spike = Vector.mult(Vector.normalise(Vector.sub(this.vertices[this.spikeVertex], this.position)), this.radius * this.spikeLength)
                this.vertices[this.spikeVertex].x = this.position.x + spike.x
                this.vertices[this.spikeVertex].y = this.position.y + spike.y
                // this.vertices = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices))
            }
        };
        me.do = function() {
            if (!mech.isBodiesAsleep) {
                // this.gravity();
                this.seePlayerByLookingAt();
                this.checkStatus();
                this.attraction();

                if (this.isSpikeReset) {
                    if (this.seePlayer.recall) {
                        const dist = Vector.sub(this.seePlayer.position, this.position);
                        const distMag = Vector.magnitude(dist);
                        if (distMag < this.radius * 7) {
                            //find nearest vertex
                            let nearestDistance = Infinity
                            for (let i = 0, len = this.vertices.length; i < len; i++) {
                                //find distance to player for each vertex
                                const dist = Vector.sub(this.seePlayer.position, this.vertices[i]);
                                const distMag = Vector.magnitude(dist);
                                //save the closest distance
                                if (distMag < nearestDistance) {
                                    this.spikeVertex = i
                                    nearestDistance = distMag
                                }
                            }
                            this.spikeLength = 1
                            this.isSpikeGrowing = true;
                            this.isSpikeReset = false;
                            Matter.Body.setAngularVelocity(this, 0)
                        }
                    }
                } else {
                    if (this.isSpikeGrowing) {
                        this.spikeLength += 1
                        if (this.spikeLength > spikeMax) {
                            this.isSpikeGrowing = false;
                        }
                    } else {

                        //reduce rotation
                        Matter.Body.setAngularVelocity(this, this.angularVelocity * 0.8)

                        this.spikeLength -= 0.2
                        if (this.spikeLength < 1) {
                            this.spikeLength = 1
                            this.isSpikeReset = true
                        }
                    }
                    const spike = Vector.mult(Vector.normalise(Vector.sub(this.vertices[this.spikeVertex], this.position)), this.radius * this.spikeLength)
                    this.vertices[this.spikeVertex].x = this.position.x + spike.x
                    this.vertices[this.spikeVertex].y = this.position.y + spike.y
                }
            }
        };
    },
    striker(x, y, radius = 14 + Math.ceil(Math.random() * 25)) {
        mobs.spawn(x, y, 5, radius, "rgb(221,102,119)");
        let me = mob[mob.length - 1];
        me.accelMag = 0.0003 * game.accelScale;
        me.g = 0.0002; //required if using 'gravity'
        me.frictionStatic = 0;
        me.friction = 0;
        me.delay = 90 * game.CDScale;
        me.cd = Infinity;
        Matter.Body.rotate(me, Math.PI * 0.1);
        spawn.shield(me, x, y);
        me.onDamage = function() {
            this.cd = game.cycle + this.delay;
        };
        me.do = function() {
            this.gravity();
            if (!(game.cycle % this.seePlayerFreq)) { // this.seePlayerCheck();  from mobs
                if (
                    this.distanceToPlayer2() < this.seeAtDistance2 &&
                    Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 &&
                    Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0 &&
                    !mech.isCloak
                ) {
                    this.foundPlayer();
                    if (this.cd === Infinity) this.cd = game.cycle + this.delay * 0.7;
                } else if (this.seePlayer.recall) {
                    this.lostPlayer();
                    this.cd = Infinity
                }
            }
            this.checkStatus();
            this.attraction();
            if (this.seePlayer.recall && this.cd < game.cycle) {
                const dist = Vector.sub(this.seePlayer.position, this.position);
                const distMag = Vector.magnitude(dist);
                if (distMag < 400) {
                    this.cd = game.cycle + this.delay;
                    ctx.beginPath();
                    ctx.moveTo(this.position.x, this.position.y);
                    Matter.Body.translate(this, Vector.mult(Vector.normalise(dist), distMag - 20 - radius));
                    ctx.lineTo(this.position.x, this.position.y);
                    ctx.lineWidth = radius * 2;
                    ctx.strokeStyle = this.fill; //"rgba(0,0,0,0.5)"; //'#000'
                    ctx.stroke();
                }
            }
        };
    },
    sneaker(x, y, radius = 15 + Math.ceil(Math.random() * 25)) {
        let me;
        mobs.spawn(x, y, 5, radius, "transparent");
        me = mob[mob.length - 1];
        me.accelMag = 0.0007 * game.accelScale;
        me.g = 0.0002; //required if using 'gravity'
        me.stroke = "transparent"; //used for drawSneaker
        me.alpha = 1; //used in drawSneaker
        // me.leaveBody = false;
        me.canTouchPlayer = false; //used in drawSneaker
        me.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob //can't touch player
        me.showHealthBar = false;
        // me.memory = 420;
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
            //draw
            if (!mech.isBodiesAsleep) {
                if (this.seePlayer.yes) {
                    if (this.alpha < 1) this.alpha += 0.01;
                } else {
                    if (this.alpha > 0) this.alpha -= 0.03;
                }
            }
            if (this.alpha > 0) {
                if (this.alpha > 0.95) {
                    this.healthBar();
                    if (!this.canTouchPlayer) {
                        this.canTouchPlayer = true;
                        this.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob; //can touch player
                    }
                }
                //draw body
                ctx.beginPath();
                const vertices = this.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let j = 1, len = vertices.length; j < len; ++j) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.lineTo(vertices[0].x, vertices[0].y);
                ctx.fillStyle = `rgba(0,0,0,${this.alpha * this.alpha})`;
                ctx.fill();
            } else if (this.canTouchPlayer) {
                this.canTouchPlayer = false;
                this.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob //can't touch player
            }
        };
    },
    ghoster(x, y, radius = 40 + Math.ceil(Math.random() * 100)) {
        let me;
        mobs.spawn(x, y, 7, radius, "transparent");
        me = mob[mob.length - 1];
        me.seeAtDistance2 = 300000;
        me.accelMag = 0.00012 * game.accelScale;
        if (map.length) me.searchTarget = map[Math.floor(Math.random() * (map.length - 1))].position; //required for search
        Matter.Body.setDensity(me, 0.00065); //normal is 0.001 //makes effective life much lower
        me.stroke = "transparent"; //used for drawGhost
        me.alpha = 1; //used in drawGhost
        me.canTouchPlayer = false; //used in drawGhost
        // me.leaveBody = false;
        me.collisionFilter.mask = cat.bullet
        me.showHealthBar = false;
        me.memory = 480;
        me.do = function() {
            //cap max speed
            if (this.speed > 5) {
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.8,
                    y: this.velocity.y * 0.8
                });
            }
            this.seePlayerCheckByDistance();
            this.checkStatus();
            this.attraction();
            this.search();
            //draw
            if (this.distanceToPlayer2() - this.seeAtDistance2 < 0) {
                if (this.alpha < 1) this.alpha += 0.004;
            } else {
                if (this.alpha > 0) this.alpha -= 0.03;
            }
            if (this.alpha > 0) {
                if (this.alpha > 0.9 && this.seePlayer.recall) {
                    this.healthBar();
                    if (!this.canTouchPlayer) {
                        this.canTouchPlayer = true;
                        this.collisionFilter.mask = cat.player | cat.bullet
                    }
                }
                //draw body
                ctx.beginPath();
                const vertices = this.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let j = 1, len = vertices.length; j < len; ++j) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.lineTo(vertices[0].x, vertices[0].y);
                ctx.lineWidth = 1;
                ctx.strokeStyle = `rgba(0,0,0,${this.alpha * this.alpha})`;
                ctx.stroke();
            } else if (this.canTouchPlayer) {
                this.canTouchPlayer = false;
                this.collisionFilter.mask = cat.bullet; //can't touch player or walls
            }
        };
    },
    // blinker(x, y, radius = 45 + Math.ceil(Math.random() * 70)) {
    //   mobs.spawn(x, y, 6, radius, "transparent");
    //   let me = mob[mob.length - 1];
    //   Matter.Body.setDensity(me, 0.0005); //normal is 0.001 //makes effective life much lower
    //   me.stroke = "rgb(0,200,255)"; //used for drawGhost
    //   Matter.Body.rotate(me, Math.random() * 2 * Math.PI);
    //   me.blinkRate = 40 + Math.round(Math.random() * 60); //required for blink
    //   me.blinkLength = 150 + Math.round(Math.random() * 200); //required for blink
    //   me.isStatic = true;
    //   me.memory = 360;
    //   me.seePlayerFreq = Math.round((40 + 30 * Math.random()) * game.lookFreqScale);
    //   // me.isBig = false;
    //   // me.scaleMag = Math.max(5 - me.mass, 1.75);
    //   me.onDeath = function () {
    //     // if (this.isBig) {
    //     //   Matter.Body.scale(this, 1 / this.scaleMag, 1 / this.scaleMag);
    //     //   this.isBig = false;
    //     // }
    //   };
    //   me.onHit = function () {
    //     game.timeSkip(120)
    //   };
    //   me.do = function () {
    //     this.seePlayerCheck();
    //     this.blink();
    //     //strike by expanding
    //     // if (this.isBig) {
    //     //   if (this.cd - this.delay + 15 < game.cycle) {
    //     //     Matter.Body.scale(this, 1 / this.scaleMag, 1 / this.scaleMag);
    //     //     this.isBig = false;
    //     //   }
    //     // } else 
    //     if (this.seePlayer.yes && this.cd < game.cycle) {
    //       const dist = Vector.sub(this.seePlayer.position, this.position);
    //       const distMag2 = Vector.magnitudeSquared(dist);
    //       if (distMag2 < 80000) {
    //         this.cd = game.cycle + this.delay;

    //         // Matter.Body.scale(this, this.scaleMag, this.scaleMag);
    //         // this.isBig = true;
    //       }
    //     }
    //   };
    // },
    bomberBoss(x, y, radius = 88) {
        //boss that drops bombs from above and holds a set distance from player
        mobs.spawn(x, y, 3, radius, "transparent");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        Matter.Body.setDensity(me, 0.0014 + 0.0003 * Math.sqrt(game.difficulty)); //extra dense //normal is 0.001 //makes effective life much larger

        me.stroke = "rgba(255,0,200)"; //used for drawGhost
        me.seeAtDistance2 = 1500000;
        me.fireFreq = Math.floor(120 * game.CDScale);
        me.searchTarget = map[Math.floor(Math.random() * (map.length - 1))].position; //required for search
        me.hoverElevation = 460 + (Math.random() - 0.5) * 200; //squared
        me.hoverXOff = (Math.random() - 0.5) * 100;
        me.accelMag = Math.floor(10 * (Math.random() + 4.5)) * 0.00001 * game.accelScale;
        me.g = 0.0002; //required if using 'gravity'   // gravity called in hoverOverPlayer
        me.frictionStatic = 0;
        me.friction = 0;
        me.frictionAir = 0.01;
        // me.memory = 300;
        // Matter.Body.setDensity(me, 0.0015); //extra dense //normal is 0.001
        me.collisionFilter.mask = cat.player | cat.bullet
        spawn.shield(me, x, y, 1);
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
        };
        me.do = function() {
            this.seePlayerCheckByDistance();
            this.checkStatus();
            if (this.seePlayer.recall) {
                this.hoverOverPlayer();
                this.bomb();
                this.search();
            }
        };
    },
    shooter(x, y, radius = 25 + Math.ceil(Math.random() * 50)) {
        mobs.spawn(x, y, 3, radius, "rgb(255,100,150)");
        let me = mob[mob.length - 1];
        // me.vertices = Matter.Vertices.clockwiseSort(Matter.Vertices.rotate(me.vertices, Math.PI, me.position)); //make the pointy side of triangle the front
        me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
        me.isVerticesChange = true
        // Matter.Body.rotate(me, Math.PI)

        me.memory = 120;
        me.fireFreq = 0.007 + Math.random() * 0.005;
        me.noseLength = 0;
        me.fireAngle = 0;
        me.accelMag = 0.0005 * game.accelScale;
        me.frictionStatic = 0;
        me.friction = 0;
        me.frictionAir = 0.05;
        me.lookTorque = 0.0000025 * (Math.random() > 0.5 ? -1 : 1);
        me.fireDir = {
            x: 0,
            y: 0
        };
        me.onDeath = function() { //helps collisions functions work better after vertex have been changed
            // this.vertices = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices))
        }
        // spawn.shield(me, x, y);
        me.do = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            this.fire();
        };
    },
    shooterBoss(x, y, radius = 110) {
        mobs.spawn(x, y, 3, radius, "rgb(255,70,180)");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
        me.isVerticesChange = true
        me.memory = 240;
        me.homePosition = {
            x: x,
            y: y
        };
        me.fireFreq = 0.025;
        me.noseLength = 0;
        me.fireAngle = 0;
        me.accelMag = 0.005 * game.accelScale;
        me.frictionAir = 0.05;
        me.lookTorque = 0.000007 * (Math.random() > 0.5 ? -1 : 1);
        me.fireDir = {
            x: 0,
            y: 0
        };
        Matter.Body.setDensity(me, 0.03 + 0.0008 * Math.sqrt(game.difficulty)); //extra dense //normal is 0.001 //makes effective life much larger
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
            // this.vertices = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices)) //helps collisions functions work better after vertex have been changed
        };

        me.do = function() {
            this.seePlayerByLookingAt();
            this.checkStatus();
            this.fire();
            //gently return to starting location
            const sub = Vector.sub(this.homePosition, this.position)
            const dist = Vector.magnitude(sub)
            if (dist > 50) this.force = Vector.mult(Vector.normalise(sub), this.mass * 0.0002)
        };
    },
    bullet(x, y, radius = 6, sides = 0) {
        //bullets
        mobs.spawn(x, y, sides, radius, "rgb(255,0,0)");
        let me = mob[mob.length - 1];
        me.stroke = "transparent";
        me.onHit = function() {
            this.explode(this.mass * 20);
        };
        Matter.Body.setDensity(me, 0.00005); //normal is 0.001
        me.timeLeft = 200;
        me.g = 0.001; //required if using 'gravity'
        me.frictionAir = 0;
        me.restitution = 0.8;
        me.leaveBody = false;
        me.dropPowerUp = false;
        me.showHealthBar = false;
        me.collisionFilter.category = cat.mobBullet;
        me.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet;
        me.do = function() {
            this.gravity();
            this.timeLimit();
        };
    },
    bomb(x, y, radius = 6, sides = 5) {
        mobs.spawn(x, y, sides, radius, "rgb(255,0,0)");
        let me = mob[mob.length - 1];
        me.stroke = "transparent";
        me.onHit = function() {
            this.explode(this.mass * 120);
        };
        me.onDeath = function() {
            if (game.difficulty > 4) {
                spawn.bullet(this.position.x, this.position.y, this.radius / 3, 5);
                spawn.bullet(this.position.x, this.position.y, this.radius / 3, 5);
                spawn.bullet(this.position.x, this.position.y, this.radius / 3, 5);
                const mag = 8
                const v1 = Vector.rotate({
                    x: 1,
                    y: 1
                }, 2 * Math.PI * Math.random())
                const v2 = Vector.rotate({
                    x: 1,
                    y: 1
                }, 2 * Math.PI * Math.random())
                const v3 = Vector.normalise(Vector.add(v1, v2)) //last vector is opposite the sum of the other two to look a bit like momentum is conserved

                Matter.Body.setVelocity(mob[mob.length - 1], {
                    x: mag * v1.x,
                    y: mag * v1.y
                });
                Matter.Body.setVelocity(mob[mob.length - 2], {
                    x: mag * v2.x,
                    y: mag * v2.y
                });
                Matter.Body.setVelocity(mob[mob.length - 3], {
                    x: -mag * v3.x,
                    y: -mag * v3.y
                });
            }
        }
        Matter.Body.setDensity(me, 0.00005); //normal is 0.001
        me.timeLeft = 140 + Math.floor(Math.random() * 30);
        me.g = 0.001; //required if using 'gravity'
        me.frictionAir = 0;
        me.restitution = 1;
        me.leaveBody = false;
        me.dropPowerUp = false;
        me.showHealthBar = false;
        me.collisionFilter.category = cat.mobBullet;
        me.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet;
        me.do = function() {
            this.gravity();
            this.timeLimit();
        };
    },
    sniper(x, y, radius = 35 + Math.ceil(Math.random() * 30)) {
        mobs.spawn(x, y, 3, radius, "transparent"); //"rgb(25,0,50)")
        let me = mob[mob.length - 1];
        me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
        me.isVerticesChange = true
        // Matter.Body.rotate(me, Math.PI)
        me.stroke = "transparent"; //used for drawSneaker
        me.alpha = 1; //used in drawSneaker
        me.showHealthBar = false;
        me.frictionStatic = 0;
        me.friction = 0;
        me.canTouchPlayer = false; //used in drawSneaker
        me.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob //can't touch player

        me.memory = 60 //140;
        me.fireFreq = 0.006 + Math.random() * 0.002;
        me.noseLength = 0;
        me.fireAngle = 0;
        me.accelMag = 0.0005 * game.accelScale;
        me.frictionAir = 0.05;
        me.torque = 0.0001 * me.inertia;
        me.fireDir = {
            x: 0,
            y: 0
        };
        me.onDeath = function() { //helps collisions functions work better after vertex have been changed
            // this.vertices = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices))
        }
        // spawn.shield(me, x, y);
        me.do = function() {
            // this.seePlayerByLookingAt();
            this.seePlayerCheck();
            this.checkStatus();

            if (!mech.isBodiesAsleep) {
                const setNoseShape = () => {
                    const mag = this.radius + this.radius * this.noseLength;
                    this.vertices[1].x = this.position.x + Math.cos(this.angle) * mag;
                    this.vertices[1].y = this.position.y + Math.sin(this.angle) * mag;
                };
                //throw a mob/bullet at player
                if (this.seePlayer.recall) {
                    //set direction to turn to fire
                    if (!(game.cycle % this.seePlayerFreq)) {
                        this.fireDir = Vector.normalise(Vector.sub(this.seePlayer.position, this.position));
                        // this.fireDir.y -= Math.abs(this.seePlayer.position.x - this.position.x) / 1600; //gives the bullet an arc
                    }
                    //rotate towards fireAngle
                    const angle = this.angle + Math.PI / 2;
                    c = Math.cos(angle) * this.fireDir.x + Math.sin(angle) * this.fireDir.y;
                    const threshold = 0.2;
                    if (c > threshold) {
                        this.torque += 0.000004 * this.inertia;
                    } else if (c < -threshold) {
                        this.torque -= 0.000004 * this.inertia;
                    } else if (this.noseLength > 1.5) {
                        //fire
                        spawn.sniperBullet(this.vertices[1].x, this.vertices[1].y, 5 + Math.ceil(this.radius / 15), 4);
                        const v = 20 * game.accelScale;
                        Matter.Body.setVelocity(mob[mob.length - 1], {
                            x: this.velocity.x + this.fireDir.x * v + Math.random(),
                            y: this.velocity.y + this.fireDir.y * v + Math.random()
                        });
                        this.noseLength = 0;
                        // recoil
                        this.force.x -= 0.005 * this.fireDir.x * this.mass;
                        this.force.y -= 0.005 * this.fireDir.y * this.mass;
                    }
                    if (this.noseLength < 1.5) this.noseLength += this.fireFreq;
                    setNoseShape();
                } else if (this.noseLength > 0.1) {
                    this.noseLength -= this.fireFreq / 2;
                    setNoseShape();
                }
                // else if (this.noseLength < -0.1) {
                //   this.noseLength += this.fireFreq / 4;
                //   setNoseShape();
                // }

                if (this.seePlayer.recall) {
                    if (this.alpha < 1) this.alpha += 0.01;
                } else {
                    if (this.alpha > 0) this.alpha -= 0.03;
                }
            }
            //draw
            if (this.alpha > 0) {
                if (this.alpha > 0.95) {
                    this.healthBar();
                    if (!this.canTouchPlayer) {
                        this.canTouchPlayer = true;
                        this.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob; //can touch player
                    }
                }
                //draw body
                ctx.beginPath();
                const vertices = this.vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let j = 1, len = vertices.length; j < len; ++j) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.lineTo(vertices[0].x, vertices[0].y);
                ctx.fillStyle = `rgba(25,0,50,${this.alpha * this.alpha})`;
                ctx.fill();
            } else if (this.canTouchPlayer) {
                this.canTouchPlayer = false;
                this.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob //can't touch player
            }
        };
    },
    sniperBullet(x, y, radius = 6, sides = 4) {
        //bullets
        mobs.spawn(x, y, sides, radius, "rgb(255,0,155)");
        let me = mob[mob.length - 1];
        me.stroke = "transparent";
        me.onHit = function() {
            this.explode(this.mass * 20);
        };
        Matter.Body.setDensity(me, 0.00005); //normal is 0.001
        me.timeLeft = 240;
        me.g = 0.001; //required if using 'gravity'
        me.frictionAir = 0;
        me.restitution = 0;
        me.leaveBody = false;
        me.dropPowerUp = false;
        me.showHealthBar = false;
        me.collisionFilter.category = cat.mobBullet;
        me.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet;
        me.do = function() {
            this.timeLimit();
            if (Matter.Query.collides(this, map).length > 0 || Matter.Query.collides(this, body).length > 0 && this.speed < 3) {
                this.dropPowerUp = false;
                this.death(); //death with no power up
            }
        };
    },
    launcher(x, y, radius = 30 + Math.ceil(Math.random() * 40)) {
        mobs.spawn(x, y, 3, radius, "rgb(150,150,255)");
        let me = mob[mob.length - 1];
        me.accelMag = 0.00004 * game.accelScale;
        me.fireFreq = Math.floor(420 + 90 * Math.random() * game.CDScale)
        me.frictionStatic = 0;
        me.friction = 0;
        me.frictionAir = 0.02;
        spawn.shield(me, x, y);
        me.onDamage = function() {};
        me.do = function() {
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
            if (this.seePlayer.recall && !(game.cycle % this.fireFreq) && !mech.isBodiesAsleep) {
                Matter.Body.setAngularVelocity(this, 0.14)
                //fire a bullet from each vertex
                for (let i = 0, len = this.vertices.length; i < len; i++) {
                    spawn.seeker(this.vertices[i].x, this.vertices[i].y, 6)
                    //give the bullet a rotational velocity as if they were attached to a vertex
                    const velocity = Vector.mult(Vector.perp(Vector.normalise(Vector.sub(this.position, this.vertices[i]))), -8)
                    Matter.Body.setVelocity(mob[mob.length - 1], {
                        x: this.velocity.x + velocity.x,
                        y: this.velocity.y + velocity.y
                    });
                }
            }
        };
    },
    launcherBoss(x, y, radius = 85) {
        mobs.spawn(x, y, 6, radius, "rgb(150,150,255)");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.accelMag = 0.00008 * game.accelScale;
        me.fireFreq = Math.floor(360 * game.CDScale)
        me.frictionStatic = 0;
        me.friction = 0;
        me.frictionAir = 0.02;
        me.memory = 420 * game.CDScale;
        me.repulsionRange = 1200000; //squared
        spawn.shield(me, x, y, 1);
        Matter.Body.setDensity(me, 0.004 + 0.0005 * Math.sqrt(game.difficulty)); //extra dense //normal is 0.001 //makes effective life much larger
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
            // this.vertices = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices)) //helps collisions functions work better after vertex have been changed
        };
        me.onDamage = function() {};
        me.do = function() {
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
            this.repulsion();
            if (this.seePlayer.recall && !(game.cycle % this.fireFreq) && !mech.isBodiesAsleep) {
                Matter.Body.setAngularVelocity(this, 0.11)
                //fire a bullet from each vertex
                for (let i = 0, len = this.vertices.length; i < len; i++) {
                    spawn.seeker(this.vertices[i].x, this.vertices[i].y, 7)
                    //give the bullet a rotational velocity as if they were attached to a vertex
                    const velocity = Vector.mult(Vector.perp(Vector.normalise(Vector.sub(this.position, this.vertices[i]))), -10)
                    Matter.Body.setVelocity(mob[mob.length - 1], {
                        x: this.velocity.x + velocity.x,
                        y: this.velocity.y + velocity.y
                    });
                }
            }
        };
    },
    seeker(x, y, radius = 5, sides = 0) {
        //bullets
        mobs.spawn(x, y, sides, radius, "rgb(255,0,255)");
        let me = mob[mob.length - 1];
        me.stroke = "transparent";
        me.onHit = function() {
            this.explode(this.mass * 20);
        };
        Matter.Body.setDensity(me, 0.00002); //normal is 0.001
        me.timeLeft = 420 * (0.8 + 0.4 * Math.random());
        me.accelMag = 0.00017 * (0.8 + 0.4 * Math.random()) * game.accelScale;
        me.frictionAir = 0.01 * (0.8 + 0.4 * Math.random());
        me.restitution = 0.5;
        me.leaveBody = false;
        me.dropPowerUp = false;
        me.showHealthBar = false;
        me.collisionFilter.category = cat.mobBullet;
        me.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet;
        me.do = function() {
            // this.seePlayer.yes = false;
            this.alwaysSeePlayer()
            this.attraction();
            this.timeLimit();
        };
    },
    spawner(x, y, radius = 55 + Math.ceil(Math.random() * 50)) {
        mobs.spawn(x, y, 4, radius, "rgb(255,150,0)");
        let me = mob[mob.length - 1];
        me.g = 0.0004; //required if using 'gravity'
        me.leaveBody = false;
        // me.dropPowerUp = false;
        me.onDeath = function() { //run this function on death
            for (let i = 0; i < Math.ceil(this.mass * 0.15 + Math.random() * 2.5); ++i) {
                spawn.spawns(this.position.x + (Math.random() - 0.5) * radius * 2.5, this.position.y + (Math.random() - 0.5) * radius * 2.5);
                Matter.Body.setVelocity(mob[mob.length - 1], {
                    x: this.velocity.x + (Math.random() - 0.5) * 15,
                    y: this.velocity.x + (Math.random() - 0.5) * 15
                });
            }
        };
        spawn.shield(me, x, y);
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
        };
    },
    spawns(x, y, radius = 15 + Math.ceil(Math.random() * 5)) {
        mobs.spawn(x, y, 4, radius, "rgb(255,0,0)");
        let me = mob[mob.length - 1];
        me.onHit = function() {
            //run this function on hitting player
            this.explode();
        };
        me.g = 0.0001; //required if using 'gravity'
        me.accelMag = 0.0003 * game.accelScale;
        me.memory = 30;
        me.leaveBody = false;
        me.seePlayerFreq = Math.round((80 + 50 * Math.random()) * game.lookFreqScale);
        me.frictionAir = 0.002;
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
        };
    },
    exploder(x, y, radius = 40 + Math.ceil(Math.random() * 50)) {
        mobs.spawn(x, y, 4, radius, "rgb(255,0,0)");
        let me = mob[mob.length - 1];
        me.onHit = function() {
            //run this function on hitting player
            this.explode();
        };
        me.g = 0.0004; //required if using 'gravity'
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
        };
    },
    snakeBoss(x, y, radius = 75) { //snake boss with a laser head
        mobs.spawn(x, y, 8, radius, "rgb(255,50,130)");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.accelMag = 0.0011 * game.accelScale;
        me.memory = 250;
        me.laserRange = 500;
        Matter.Body.setDensity(me, 0.0013 + 0.0005 * Math.sqrt(game.difficulty)); //extra dense //normal is 0.001 //makes effective life much larger
        spawn.shield(me, x, y, 1);
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
        };
        me.do = function() {
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
            this.laserBeam();
        };

        //snake tail
        const nodes = 2 + Math.min(3 + Math.ceil(Math.random() * game.difficulty + 2), 8)
        spawn.lineBoss(x + 105, y, "snakeBody", nodes);
        //constraint boss with first 3 mobs in lineboss
        consBB[consBB.length] = Constraint.create({
            bodyA: mob[mob.length - nodes],
            bodyB: mob[mob.length - 1 - nodes],
            stiffness: 0.05
        });
        World.add(engine.world, consBB[consBB.length - 1]);
        consBB[consBB.length] = Constraint.create({
            bodyA: mob[mob.length - nodes + 1],
            bodyB: mob[mob.length - 1 - nodes],
            stiffness: 0.05
        });
        World.add(engine.world, consBB[consBB.length - 1]);
        consBB[consBB.length] = Constraint.create({
            bodyA: mob[mob.length - nodes + 2],
            bodyB: mob[mob.length - 1 - nodes],
            stiffness: 0.05
        });
        World.add(engine.world, consBB[consBB.length - 1]);

    },
    snakeBody(x, y, radius = 20) {
        mobs.spawn(x, y, 4, radius, "rgb(255,0,0)");
        let me = mob[mob.length - 1];
        me.onHit = function() {
            //run this function on hitting player
            this.explode();
        };
        me.collisionFilter.mask = cat.bullet | cat.player
        // me.g = 0.0002; //required if using 'gravity'
        // me.accelMag = 0 //0.001 * game.accelScale;
        // me.memory = 0;
        me.leaveBody = false;
        // me.seePlayerFreq = Math.round((80 + 50 * Math.random()) * game.lookFreqScale);
        me.frictionAir = 0.02;
        me.do = function() {
            // this.gravity();
            // this.seePlayerCheck();
            this.checkStatus();
            // this.attraction();
        };
    },
    tetherBoss(x, y, radius = 90) {
        // constrained mob boss for the towers level
        // often has a ring of mobs around it
        mobs.spawn(x, y, 8, radius, "rgb(0,60,80)");
        let me = mob[mob.length - 1];
        me.isBoss = true;
        me.g = 0.0001; //required if using 'gravity'
        me.accelMag = 0.002 * game.accelScale;
        me.memory = 20;
        Matter.Body.setDensity(me, 0.001 + 0.0005 * Math.sqrt(game.difficulty)); //extra dense //normal is 0.001 //makes effective life much larger
        spawn.shield(me, x, y, 1);
        me.onDeath = function() {
            powerUps.spawnBossPowerUp(this.position.x, this.position.y)
            this.removeCons(); //remove constraint
        };
        me.do = function() {
            this.gravity();
            this.seePlayerCheck();
            this.checkStatus();
            this.attraction();
        };
    },
    shield(target, x, y, chance = Math.min(0.02 + game.difficulty * 0.005, 0.2)) {
        if (this.allowShields && Math.random() < chance) {
            mobs.spawn(x, y, 9, target.radius + 30, "rgba(220,220,255,0.9)");
            let me = mob[mob.length - 1];
            me.stroke = "rgb(220,220,255)";
            Matter.Body.setDensity(me, 0.00001) //very low density to not mess with the original mob's motion
            me.shield = true;
            me.collisionFilter.category = cat.mobShield
            me.collisionFilter.mask = cat.bullet;
            consBB[consBB.length] = Constraint.create({
                bodyA: me,
                bodyB: target, //attach shield to target
                stiffness: 0.4,
                damping: 0.1
            });
            World.add(engine.world, consBB[consBB.length - 1]);

            me.onDamage = function() {
                //make sure the mob that owns the shield can tell when damage is done
                this.alertNearByMobs();
                this.fill = `rgba(220,220,255,${0.3 + 0.6 *this.health})`
            };
            me.leaveBody = false;
            me.dropPowerUp = false;
            me.showHealthBar = false;

            me.shieldTargetID = target.id
            target.isShielded = true;
            me.onDeath = function() {
                //clear isShielded status from target
                for (let i = 0, len = mob.length; i < len; i++) {
                    if (mob[i].id === this.shieldTargetID) mob[i].isShielded = false;
                }
            };
            //swap order of shield and mob, so that mob is behind shield graphically
            mob[mob.length - 1] = mob[mob.length - 2];
            mob[mob.length - 2] = me;
            me.do = function() {
                this.checkStatus();
            };
        }
    },
    bossShield(targets, x, y, radius, stiffness = 0.4) {
        const nodes = targets.length
        mobs.spawn(x, y, 9, radius, "rgba(220,220,255,0.9)");
        let me = mob[mob.length - 1];
        me.stroke = "rgb(220,220,255)";
        Matter.Body.setDensity(me, 0.00001) //very low density to not mess with the original mob's motion
        me.frictionAir = 0;
        me.shield = true;
        me.collisionFilter.category = cat.mobShield
        me.collisionFilter.mask = cat.bullet;
        for (let i = 0; i < nodes; ++i) {
            mob[mob.length - i - 2].isShielded = true;
            //constrain to all mob nodes in boss
            consBB[consBB.length] = Constraint.create({
                bodyA: me,
                bodyB: mob[mob.length - i - 2],
                stiffness: stiffness,
                damping: 0.1
            });
            World.add(engine.world, consBB[consBB.length - 1]);
        }
        me.onDamage = function() {
            this.alertNearByMobs(); //makes sure the mob that owns the shield can tell when damage is done
            this.fill = `rgba(220,220,255,${0.3 + 0.6 *this.health})`
        };
        me.onDeath = function() {
            //clear isShielded status from target
            for (let j = 0; j < targets.length; j++) {
                for (let i = 0, len = mob.length; i < len; i++) {
                    if (mob[i].id === targets[j]) mob[i].isShielded = false;
                }
            }
        };
        me.leaveBody = false;
        me.dropPowerUp = false;
        me.showHealthBar = false;
        mob[mob.length - 1] = mob[mob.length - 1 - nodes];
        mob[mob.length - 1 - nodes] = me;
        me.do = function() {
            this.checkStatus();
        };
    },
    //fan made mobs  *****************************************************************************************
    //*******************************************************************************************************
    //complex constrained mob templates**********************************************************************
    //*******************************************************************************************************
    allowShields: true,
    nodeBoss(
        x,
        y,
        spawn = "striker",
        nodes = Math.min(2 + Math.ceil(Math.random() * (game.difficulty + 2)), 8),
        //Math.ceil(Math.random() * 3) + Math.min(4,Math.ceil(game.difficulty/2)),
        radius = Math.ceil(Math.random() * 10) + 17, // radius of each node mob
        sideLength = Math.ceil(Math.random() * 100) + 70, // distance between each node mob
        stiffness = Math.random() * 0.03 + 0.005
    ) {
        this.allowShields = false; //don't want shields on individual boss mobs
        const angle = 2 * Math.PI / nodes
        let targets = []
        for (let i = 0; i < nodes; ++i) {
            let whoSpawn = spawn;
            if (spawn === "random") {
                whoSpawn = this.fullPickList[Math.floor(Math.random() * this.fullPickList.length)];
            } else if (spawn === "randomList") {
                whoSpawn = this.pickList[Math.floor(Math.random() * this.pickList.length)];
            }
            this[whoSpawn](x + sideLength * Math.sin(i * angle), y + sideLength * Math.cos(i * angle), radius);
            targets.push(mob[mob.length - 1].id) //track who is in the node boss, for shields
        }
        if (Math.random() < 0.3) {
            this.constrain2AdjacentMobs(nodes, stiffness * 2, true);
        } else {
            this.constrainAllMobCombos(nodes, stiffness);
        }
        //spawn shield for entire boss
        if (nodes > 2 && Math.random() < 0.998) {
            this.bossShield(targets, x, y, sideLength + 2.5 * radius + nodes * 6 - 25);
        }
        this.allowShields = true;
    },
    lineBoss(
        x,
        y,
        spawn = "striker",
        nodes = Math.min(3 + Math.ceil(Math.random() * game.difficulty + 2), 8),
        //Math.ceil(Math.random() * 3) + Math.min(4,Math.ceil(game.difficulty/2)),
        radius = Math.ceil(Math.random() * 10) + 17,
        l = Math.ceil(Math.random() * 80) + 30,
        stiffness = Math.random() * 0.06 + 0.01
    ) {
        this.allowShields = false; //don't want shields on individual boss mobs
        for (let i = 0; i < nodes; ++i) {
            let whoSpawn = spawn;
            if (spawn === "random") {
                whoSpawn = this.fullPickList[Math.floor(Math.random() * this.fullPickList.length)];
            } else if (spawn === "randomList") {
                whoSpawn = this.pickList[Math.floor(Math.random() * this.pickList.length)];
            }
            this[whoSpawn](x + i * radius + i * l, y, radius);
        }
        this.constrain2AdjacentMobs(nodes, stiffness);
        this.allowShields = true;
    },
    //constraints ************************************************************************************************
    //*************************************************************************************************************
    constrainAllMobCombos(nodes, stiffness) {
        //runs through every combination of last 'num' bodies and constrains them
        for (let i = 1; i < nodes + 1; ++i) {
            for (let j = i + 1; j < nodes + 1; ++j) {
                consBB[consBB.length] = Constraint.create({
                    bodyA: mob[mob.length - i],
                    bodyB: mob[mob.length - j],
                    stiffness: stiffness
                });
                World.add(engine.world, consBB[consBB.length - 1]);
            }
        }
    },
    constrain2AdjacentMobs(nodes, stiffness, loop = false) {
        //runs through every combination of last 'num' bodies and constrains them
        for (let i = 0; i < nodes - 1; ++i) {
            consBB[consBB.length] = Constraint.create({
                bodyA: mob[mob.length - i - 1],
                bodyB: mob[mob.length - i - 2],
                stiffness: stiffness
            });
            World.add(engine.world, consBB[consBB.length - 1]);
        }
        if (nodes > 2) {
            for (let i = 0; i < nodes - 2; ++i) {
                consBB[consBB.length] = Constraint.create({
                    bodyA: mob[mob.length - i - 1],
                    bodyB: mob[mob.length - i - 3],
                    stiffness: stiffness
                });
                World.add(engine.world, consBB[consBB.length - 1]);
            }
        }
        //optional connect the tail to head
        if (loop && nodes > 3) {
            consBB[consBB.length] = Constraint.create({
                bodyA: mob[mob.length - 1],
                bodyB: mob[mob.length - nodes],
                stiffness: stiffness
            });
            World.add(engine.world, consBB[consBB.length - 1]);
            consBB[consBB.length] = Constraint.create({
                bodyA: mob[mob.length - 2],
                bodyB: mob[mob.length - nodes],
                stiffness: stiffness
            });
            World.add(engine.world, consBB[consBB.length - 1]);
            consBB[consBB.length] = Constraint.create({
                bodyA: mob[mob.length - 1],
                bodyB: mob[mob.length - nodes + 1],
                stiffness: stiffness
            });
            World.add(engine.world, consBB[consBB.length - 1]);
        }
    },
    constraintPB(x, y, bodyIndex, stiffness) {
        cons[cons.length] = Constraint.create({
            pointA: {
                x: x,
                y: y
            },
            bodyB: body[bodyIndex],
            stiffness: stiffness
        });
        World.add(engine.world, cons[cons.length - 1]);
    },
    constraintBB(bodyIndexA, bodyIndexB, stiffness) {
        consBB[consBB.length] = Constraint.create({
            bodyA: body[bodyIndexA],
            bodyB: body[bodyIndexB],
            stiffness: stiffness
        });
        World.add(engine.world, consBB[consBB.length - 1]);
    },
    // body and map spawns ******************************************************************************
    //**********************************************************************************************
    wireHead() {
        //not a mob, just a graphic for level 1
        const breakingPoint = 1300
        mobs.spawn(breakingPoint, -100, 0, 7.5, "transparent");
        let me = mob[mob.length - 1];
        me.collisionFilter.category = cat.body;
        me.collisionFilter.mask = cat.map;
        me.inertia = Infinity;
        me.g = 0.0004; //required for gravity
        me.restitution = 0;
        me.stroke = "transparent"
        me.freeOfWires = false;
        me.frictionStatic = 1;
        me.friction = 1;
        me.frictionAir = 0.01;
        me.dropPowerUp = false;
        me.showHealthBar = false;

        me.do = function() {
            let wireX = -50;
            let wireY = -1000;
            if (this.freeOfWires) {
                this.gravity();
            } else {
                if (mech.pos.x > breakingPoint) {
                    this.freeOfWires = true;
                    this.fill = "#000"
                    this.force.x += -0.003;
                    player.force.x += 0.06;
                    // player.force.y -= 0.15;
                }

                //player is extra heavy from wires
                Matter.Body.setVelocity(player, {
                    x: player.velocity.x,
                    y: player.velocity.y + 0.3
                })

                //player friction from the wires
                if (mech.pos.x > 700 && player.velocity.x > -2) {
                    let wireFriction = 0.75 * Math.min(0.6, Math.max(0, 100 / (breakingPoint - mech.pos.x)));
                    if (!mech.onGround) wireFriction *= 3
                    Matter.Body.setVelocity(player, {
                        x: player.velocity.x - wireFriction,
                        y: player.velocity.y
                    })
                }
                //move to player
                Matter.Body.setPosition(this, {
                    x: mech.pos.x + (42 * Math.cos(mech.angle + Math.PI)),
                    y: mech.pos.y + (42 * Math.sin(mech.angle + Math.PI))
                })
            }
            //draw wire
            ctx.beginPath();
            ctx.moveTo(wireX, wireY);
            ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
            if (!this.freeOfWires) ctx.lineTo(mech.pos.x + (30 * Math.cos(mech.angle + Math.PI)), mech.pos.y + (30 * Math.sin(mech.angle + Math.PI)));
            ctx.lineCap = "butt";
            ctx.lineWidth = 15;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            ctx.lineCap = "round";
        };
    },
    wireKnee() {
        //not a mob, just a graphic for level 1
        const breakingPoint = 1425
        mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
        let me = mob[mob.length - 1];
        //touch nothing
        me.collisionFilter.category = cat.body;
        me.collisionFilter.mask = cat.map;
        me.g = 0.0003; //required for gravity
        // me.restitution = 0;
        me.stroke = "transparent"
        // me.inertia = Infinity;
        me.restitution = 0;
        me.freeOfWires = false;
        me.frictionStatic = 1;
        me.friction = 1;
        me.frictionAir = 0.01;
        me.dropPowerUp = false;
        me.showHealthBar = false;

        me.do = function() {
            let wireX = -50 - 20;
            let wireY = -1000;

            if (this.freeOfWires) {
                this.gravity();
            } else {
                if (mech.pos.x > breakingPoint) {
                    this.freeOfWires = true;
                    this.force.x -= 0.0004;
                    this.fill = "#222";
                }
                //move mob to player
                mech.calcLeg(0, 0);
                Matter.Body.setPosition(this, {
                    x: mech.pos.x + mech.flipLegs * mech.knee.x - 5,
                    y: mech.pos.y + mech.knee.y
                })
            }
            //draw wire
            ctx.beginPath();
            ctx.moveTo(wireX, wireY);
            ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#222";
            ctx.lineCap = "butt";
            ctx.stroke();
            ctx.lineCap = "round";
        };
    },
    wireKneeLeft() {
        //not a mob, just a graphic for level 1
        const breakingPoint = 1400
        mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
        let me = mob[mob.length - 1];
        //touch nothing
        me.collisionFilter.category = cat.body;
        me.collisionFilter.mask = cat.map;
        me.g = 0.0003; //required for gravity
        // me.restitution = 0;
        me.stroke = "transparent"
        // me.inertia = Infinity;
        me.restitution = 0;
        me.freeOfWires = false;
        me.frictionStatic = 1;
        me.friction = 1;
        me.frictionAir = 0.01;
        me.dropPowerUp = false;
        me.showHealthBar = false;

        me.do = function() {
            let wireX = -50 - 35;
            let wireY = -1000;

            if (this.freeOfWires) {
                this.gravity();
            } else {
                if (mech.pos.x > breakingPoint) {
                    this.freeOfWires = true;
                    this.force.x += -0.0003;
                    this.fill = "#333";
                }
                //move mob to player
                mech.calcLeg(Math.PI, -3);
                Matter.Body.setPosition(this, {
                    x: mech.pos.x + mech.flipLegs * mech.knee.x - 5,
                    y: mech.pos.y + mech.knee.y
                })
            }
            //draw wire
            ctx.beginPath();
            ctx.moveTo(wireX, wireY);
            ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
            ctx.lineWidth = 5;
            ctx.lineCap = "butt";
            ctx.strokeStyle = "#333";
            ctx.stroke();
            ctx.lineCap = "round";
        };
    },
    wireFoot() {
        //not a mob, just a graphic for level 1
        const breakingPoint = 1350
        mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
        let me = mob[mob.length - 1];
        //touch nothing
        me.collisionFilter.category = cat.body;
        me.collisionFilter.mask = cat.map;
        me.g = 0.0003; //required for gravity
        me.restitution = 0;
        me.stroke = "transparent"
        // me.inertia = Infinity;
        me.freeOfWires = false;
        // me.frictionStatic = 1;
        // me.friction = 1;
        me.frictionAir = 0.01;
        me.dropPowerUp = false;
        me.showHealthBar = false;

        me.do = function() {
            let wireX = -50 + 16;
            let wireY = -1000;

            if (this.freeOfWires) {
                this.gravity();
            } else {
                if (mech.pos.x > breakingPoint) {
                    this.freeOfWires = true;
                    this.force.x += -0.0006;
                    this.fill = "#111";
                }
                //move mob to player
                mech.calcLeg(0, 0);
                Matter.Body.setPosition(this, {
                    x: mech.pos.x + mech.flipLegs * mech.foot.x - 5,
                    y: mech.pos.y + mech.foot.y - 1
                })
            }
            //draw wire
            ctx.beginPath();
            ctx.moveTo(wireX, wireY);
            ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
            ctx.lineWidth = 5;
            ctx.lineCap = "butt";
            ctx.strokeStyle = "#111";
            ctx.stroke();
            ctx.lineCap = "round";
        };
    },
    wireFootLeft() {
        //not a mob, just a graphic for level 1
        const breakingPoint = 1325
        mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
        let me = mob[mob.length - 1];
        //touch nothing
        me.collisionFilter.category = cat.body;
        me.collisionFilter.mask = cat.map;
        me.g = 0.0003; //required for gravity
        me.restitution = 0;
        me.stroke = "transparent"
        // me.inertia = Infinity;
        me.freeOfWires = false;
        // me.frictionStatic = 1;
        // me.friction = 1;
        me.frictionAir = 0.01;
        me.dropPowerUp = false;
        me.showHealthBar = false;

        me.do = function() {
            let wireX = -50 + 26;
            let wireY = -1000;

            if (this.freeOfWires) {
                this.gravity();
            } else {
                if (mech.pos.x > breakingPoint) {
                    this.freeOfWires = true;
                    this.force.x += -0.0005;
                    this.fill = "#222";
                }
                //move mob to player
                mech.calcLeg(Math.PI, -3);
                Matter.Body.setPosition(this, {
                    x: mech.pos.x + mech.flipLegs * mech.foot.x - 5,
                    y: mech.pos.y + mech.foot.y - 1
                })
            }
            //draw wire
            ctx.beginPath();
            ctx.moveTo(wireX, wireY);
            ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#222";
            ctx.lineCap = "butt";
            ctx.stroke();
            ctx.lineCap = "round";
        };
    },
    boost(x, y, height = 1000) {
        spawn.mapVertex(x + 50, y + 35, "120 40 -120 40 -50 -40 50 -40");
        // level.addZone(x, y, 100, 30, "fling", {Vx:Vx, Vy: Vy});
        level.addQueryRegion(x, y - 20, 100, 20, "boost", [
            [player], body, mob, powerUp, bullet
        ], -1.21 * Math.sqrt(Math.abs(height)));
        let color = "rgba(200,0,255,";
        level.fillBG.push({
            x: x,
            y: y - 25,
            width: 100,
            height: 25,
            color: color + "0.2)"
        });
        level.fillBG.push({
            x: x,
            y: y - 55,
            width: 100,
            height: 55,
            color: color + "0.1)"
        });
        level.fillBG.push({
            x: x,
            y: y - 120,
            width: 100,
            height: 120,
            color: color + "0.05)"
        });
    },
    laserZone(x, y, width, height, dmg) {
        level.addZone(x, y, width, height, "laser", {
            dmg
        });
        level.fill.push({
            x: x,
            y: y,
            width: width,
            height: height,
            color: "#f00"
        });
    },
    deathQuery(x, y, width, height) {
        level.addQueryRegion(x, y, width, height, "death", [
            [player], mob
        ]);
        level.fill.push({
            x: x,
            y: y,
            width: width,
            height: height,
            color: "#f00"
        });
    },
    platform(x, y, width, height) {
        const size = 20;
        spawn.mapRect(x, y + height, width, 30);
        level.fillBG.push({
            x: x + width / 2 - size / 2,
            y: y,
            width: size,
            height: height,
            color: "#f0f0f3"
        });
    },
    blockDoor(x, y, blockSize = 60) {
        spawn.mapRect(x, y - 290, 40, 60); // door lip
        spawn.mapRect(x, y, 40, 50); // door lip
        for (let i = 0; i < 4; ++i) {
            spawn.bodyRect(x + 5, y - 260 + i * blockSize + i * 3, 30, blockSize);
        }
    },
    debris(x, y, width, number = Math.floor(2 + Math.random() * 9)) {
        for (let i = 0; i < number; ++i) {
            if (Math.random() < 0.15) {
                powerUps.chooseRandomPowerUp(x + Math.random() * width, y);
            } else {
                const size = 18 + Math.random() * 25;
                spawn.bodyRect(x + Math.random() * width, y, size * (0.6 + Math.random()), size * (0.6 + Math.random()), 1);
                // body[body.length] = Bodies.rectangle(x + Math.random() * width, y, size * (0.6 + Math.random()), size * (0.6 + Math.random()));
            }
        }
    },
    bodyRect(x, y, width, height, chance = 1, properties = {
        friction: 0.05,
        frictionAir: 0.001,
    }) {
        if (Math.random() < chance) body[body.length] = Bodies.rectangle(x + width / 2, y + height / 2, width, height, properties);
    },
    bodyVertex(x, y, vector, properties) { //adds shape to body array
        body[body.length] = Matter.Bodies.fromVertices(x, y, Vertices.fromPath(vector), properties);
    },
    mapRect(x, y, width, height, properties) { //adds rectangle to map array
        map[map.length] = Bodies.rectangle(x + width / 2, y + height / 2, width, height, properties);
    },
    mapVertex(x, y, vector, properties) { //adds shape to map array
        map[map.length] = Matter.Bodies.fromVertices(x, y, Vertices.fromPath(vector), properties);
    },
    //complex map templates
    spawnBuilding(x, y, w, h, leftDoor, rightDoor, walledSide) {
        this.mapRect(x, y, w, 25); //roof
        this.mapRect(x, y + h, w, 35); //ground
        if (walledSide === "left") {
            this.mapRect(x, y, 25, h); //wall left
        } else {
            this.mapRect(x, y, 25, h - 150); //wall left
            if (leftDoor) {
                this.bodyRect(x + 5, y + h - 150, 15, 150, this.propsFriction); //door left
            }
        }
        if (walledSide === "right") {
            this.mapRect(x - 25 + w, y, 25, h); //wall right
        } else {
            this.mapRect(x - 25 + w, y, 25, h - 150); //wall right
            if (rightDoor) {
                this.bodyRect(x + w - 20, y + h - 150, 15, 150, this.propsFriction); //door right
            }
        }
    },
    spawnStairs(x, y, num, w, h, stepRight) {
        w += 50;
        if (stepRight) {
            for (let i = 0; i < num; i++) {
                this.mapRect(x - (w / num) * (1 + i), y - h + (i * h) / num, w / num + 50, h - (i * h) / num + 50);
            }
        } else {
            for (let i = 0; i < num; i++) {
                this.mapRect(x + (i * w) / num, y - h + (i * h) / num, w / num + 50, h - (i * h) / num + 50);
            }
        }
    },
    //pre-made property options*************************************************************************************
    //*************************************************************************************************************
    //Object.assign({}, propsHeavy, propsBouncy, propsNoRotation)      //will combine properties into a new object
    propsFriction: {
        friction: 0.5,
        frictionAir: 0.02,
        frictionStatic: 1
    },
    propsFrictionMedium: {
        friction: 0.15,
        frictionStatic: 1
    },
    propsBouncy: {
        friction: 0,
        frictionAir: 0,
        frictionStatic: 0,
        restitution: 1
    },
    propsSlide: {
        friction: 0.003,
        frictionStatic: 0.4,
        restitution: 0,
        density: 0.002
    },
    propsLight: {
        density: 0.001
    },
    propsOverBouncy: {
        friction: 0,
        frictionAir: 0,
        frictionStatic: 0,
        restitution: 1.05
    },
    propsHeavy: {
        density: 0.01 //default density is 0.001
    },
    propsIsNotHoldable: {
        isNotHoldable: true
    },
    propsNoRotation: {
        inertia: Infinity //prevents rotation
    },
    propsHoist: {
        inertia: Infinity, //prevents rotation
        frictionAir: 0.001,
        friction: 0.0001,
        frictionStatic: 0,
        restitution: 0,
        isNotHoldable: true
        // density: 0.0001
    },
    propsDoor: {
        density: 0.001, //default density is 0.001
        friction: 0,
        frictionAir: 0.03,
        frictionStatic: 0,
        restitution: 0
    },
    sandPaper: {
        friction: 1,
        frictionStatic: 1,
        restitution: 0
    }
};