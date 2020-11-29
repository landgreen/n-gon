let bullet = [];

const b = {
    dmgScale: null, //scales all gun damage from momentum, but not raw .dmg //set in levels.setDifficulty
    gravity: 0.0006, //most other bodies have   gravity = 0.001
    activeGun: null, //current gun in use by player
    inventoryGun: 0,
    inventory: [], //list of what guns player has  // 0 starts with basic gun
    fire() {
        if (input.fire && mech.fireCDcycle < mech.cycle && (!input.field || mech.fieldFire) && b.inventory.length) {
            if (b.guns[b.activeGun].ammo > 0) {
                b.guns[b.activeGun].fire();
                if (mod.isCrouchAmmo && mech.crouch) {
                    if (mod.isCrouchAmmo % 2) {
                        b.guns[b.activeGun].ammo--;
                        game.updateGunHUD();
                    }
                    mod.isCrouchAmmo++ //makes the no ammo toggle off and on
                } else {
                    b.guns[b.activeGun].ammo--;
                    game.updateGunHUD();
                }
            } else {
                if (mod.isAmmoFromHealth) {
                    if (mech.health > 2 * mod.isAmmoFromHealth * mech.maxHealth) {
                        mech.damage(mod.isAmmoFromHealth * mech.maxHealth / mech.harmReduction());
                        powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
                    } else {
                        game.replaceTextLog = true;
                        game.makeTextLog("not enough health for catabolism to produce ammo", 120);
                    }
                } else {
                    game.replaceTextLog = true;
                    game.makeTextLog("<div style='font-size:140%;'>NO AMMO</div> <p style='font-size:90%;'><strong>Q</strong>, <strong>E</strong>, and <strong>mouse wheel</strong> change weapons</p>", 200);
                }
                mech.fireCDcycle = mech.cycle + 30; //fire cooldown        
            }
            if (mech.holdingTarget) {
                mech.drop();
            }
        }
    },
    removeAllGuns() {
        b.inventory = []; //removes guns and ammo  
        for (let i = 0, len = b.guns.length; i < len; ++i) {
            b.guns[i].count = 0;
            b.guns[i].have = false;
            if (b.guns[i].ammo != Infinity) b.guns[i].ammo = 0;
        }
        b.activeGun = null;
    },
    bulletRemove() { //run in main loop
        //remove bullet if at end cycle for that bullet
        let i = bullet.length;
        while (i--) {
            if (bullet[i].endCycle < game.cycle) {
                bullet[i].onEnd(i); //some bullets do stuff on end
                if (bullet[i]) {
                    Matter.World.remove(engine.world, bullet[i]);
                    bullet.splice(i, 1);
                } else {
                    break; //if bullet[i] doesn't exist don't complete the for loop, because the game probably reset
                }
            }
        }
    },
    bulletDraw() {
        ctx.beginPath();
        for (let i = 0, len = bullet.length; i < len; i++) {
            let vertices = bullet[i].vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < vertices.length; j += 1) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            ctx.lineTo(vertices[0].x, vertices[0].y);
        }
        ctx.fillStyle = "#000";
        ctx.fill();
    },
    bulletDo() {
        for (let i = 0, len = bullet.length; i < len; i++) {
            bullet[i].do();
        }
    },
    fireProps(cd, speed, dir, me) {
        mech.fireCDcycle = mech.cycle + Math.floor(cd * b.fireCD); // cool down
        Matter.Body.setVelocity(bullet[me], {
            x: mech.Vx / 2 + speed * Math.cos(dir),
            y: mech.Vy / 2 + speed * Math.sin(dir)
        });
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    fireCD: 1,
    setFireCD() {
        b.fireCD = mod.fireRate * mod.slowFire * mod.rerollHaste * mod.aimDamage / mod.fastTime
    },
    fireAttributes(dir, rotate = true) {
        if (rotate) {
            return {
                // density: 0.0015,			//frictionAir: 0.01,			//restitution: 0,
                angle: dir,
                friction: 0.5,
                frictionAir: 0,
                dmg: 0, //damage done in addition to the damage from momentum
                classType: "bullet",
                collisionFilter: {
                    category: cat.bullet,
                    mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                },
                minDmgSpeed: 10,
                beforeDmg() {}, //this.endCycle = 0  //triggers despawn
                onEnd() {}
            };
        } else {
            return {
                // density: 0.0015,			//frictionAir: 0.01,			//restitution: 0,
                inertia: Infinity, //prevents rotation
                angle: dir,
                friction: 0.5,
                frictionAir: 0,
                dmg: 0, //damage done in addition to the damage from momentum
                classType: "bullet",
                collisionFilter: {
                    category: cat.bullet,
                    mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                },
                minDmgSpeed: 10,
                beforeDmg() {}, //this.endCycle = 0  //triggers despawn
                onEnd() {}
            };
        }
    },
    muzzleFlash(radius = 10) {
        ctx.fillStyle = "#fb0";
        ctx.beginPath();
        ctx.arc(mech.pos.x + 35 * Math.cos(mech.angle), mech.pos.y + 35 * Math.sin(mech.angle), radius, 0, 2 * Math.PI);
        ctx.fill();
    },
    removeConsBB(me) {
        for (let i = 0, len = consBB.length; i < len; ++i) {
            if (consBB[i].bodyA === me) {
                consBB[i].bodyA = consBB[i].bodyB;
                consBB.splice(i, 1);
                break;
            } else if (consBB[i].bodyB === me) {
                consBB[i].bodyB = consBB[i].bodyA;
                consBB.splice(i, 1);
                break;
            }
        }
    },
    onCollision(event) {
        const pairs = event.pairs;
        for (let i = 0, j = pairs.length; i != j; i++) {
            //map + bullet collisions
            if (pairs[i].bodyA.collisionFilter.category === cat.map && pairs[i].bodyB.collisionFilter.category === cat.bullet) {
                collideBulletStatic(pairs[i].bodyB)
            } else if (pairs[i].bodyB.collisionFilter.category === cat.map && pairs[i].bodyA.collisionFilter.category === cat.bullet) {
                collideBulletStatic(pairs[i].bodyA)
            }

            function collideBulletStatic(obj) {
                if (obj.onWallHit) obj.onWallHit();
            }
        }
    },
    explosion(where, radius) { // typically explode is used for some bullets with .onEnd
        radius *= mod.explosiveRadius
        let dist, sub, knock;
        let dmg = radius * 0.013;
        if (mod.isExplosionHarm) radius *= 1.8 //    1/sqrt(2) radius -> area
        if (mod.isSmallExplosion) {
            radius *= 0.8
            dmg *= 1.6
        }

        game.drawList.push({ //add dmg to draw queue
            x: where.x,
            y: where.y,
            radius: radius,
            color: "rgba(255,25,0,0.6)",
            time: game.drawTime
        });

        const alertRange = 100 + radius * 2; //alert range
        game.drawList.push({ //add alert to draw queue
            x: where.x,
            y: where.y,
            radius: alertRange,
            color: "rgba(100,20,0,0.03)",
            time: game.drawTime
        });

        //player damage and knock back
        sub = Vector.sub(where, player.position);
        dist = Vector.magnitude(sub);

        if (dist < radius) {

            if (mod.isImmuneExplosion) {
                const mitigate = Math.min(1, Math.max(1 - mech.energy * 0.7, 0))
                mech.damage(mitigate * radius * (mod.isExplosionHarm ? 0.0004 : 0.0001));
            } else {
                mech.damage(radius * (mod.isExplosionHarm ? 0.0004 : 0.0001));
            }

            // if (!(mod.isImmuneExplosion && mech.energy > 0.97)) {
            //   if (mod.isExplosionHarm) {
            //     mech.damage(radius * 0.0004); //300% more player damage from explosions
            //   } else {
            //     mech.damage(radius * 0.0001); //normal player damage from explosions
            //   }
            //   mech.drop();
            // }
            knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass * 0.015);
            player.force.x += knock.x;
            player.force.y += knock.y;
        } else if (dist < alertRange) {
            knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass * 0.008);
            player.force.x += knock.x;
            player.force.y += knock.y;
        }

        //body knock backs
        for (let i = 0, len = body.length; i < len; ++i) {
            sub = Vector.sub(where, body[i].position);
            dist = Vector.magnitude(sub);
            if (dist < radius) {
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) * 0.022);
                body[i].force.x += knock.x;
                body[i].force.y += knock.y;
            } else if (dist < alertRange) {
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) * 0.013);
                body[i].force.x += knock.x;
                body[i].force.y += knock.y;
            }
        }

        //power up knock backs
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            sub = Vector.sub(where, powerUp[i].position);
            dist = Vector.magnitude(sub);
            if (dist < radius) {
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) * 0.015);
                powerUp[i].force.x += knock.x;
                powerUp[i].force.y += knock.y;
            } else if (dist < alertRange) {
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) * 0.01);
                powerUp[i].force.x += knock.x;
                powerUp[i].force.y += knock.y;
            }
        }

        //mob damage and knock back with alert
        let damageScale = 1.5; // reduce dmg for each new target to limit total AOE damage
        for (let i = 0, len = mob.length; i < len; ++i) {
            if (mob[i].alive && !mob[i].isShielded) {
                sub = Vector.sub(where, mob[i].position);
                dist = Vector.magnitude(sub) - mob[i].radius;
                if (dist < radius) {
                    if (mob[i].shield) dmg *= 2.5 //balancing explosion dmg to shields
                    if (Matter.Query.ray(map, mob[i].position, where).length > 0) dmg *= 0.5 //reduce damage if a wall is in the way
                    mob[i].damage(dmg * damageScale * b.dmgScale);
                    mob[i].locatePlayer();
                    knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) * 0.01);
                    mob[i].force.x += knock.x;
                    mob[i].force.y += knock.y;
                    radius *= 0.95 //reduced range for each additional explosion target
                    damageScale *= 0.87 //reduced damage for each additional explosion target
                } else if (!mob[i].seePlayer.recall && dist < alertRange) {
                    mob[i].locatePlayer();
                    knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) * 0.006);
                    mob[i].force.x += knock.x;
                    mob[i].force.y += knock.y;
                }
            }
        }
    },
    missile(where, angle, speed, size = 1, spawn = 0) {
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(where.x, where.y, 30 * size, 4 * size, {
            angle: angle,
            friction: 0.5,
            frictionAir: 0.045,
            dmg: 0, //damage done in addition to the damage from momentum
            classType: "bullet",
            endCycle: game.cycle + Math.floor((230 + 40 * Math.random()) * mod.isBulletsLastLonger),
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
            },
            minDmgSpeed: 10,
            lookFrequency: Math.floor(10 + Math.random() * 3),
            explodeRad: 180 + 60 * Math.random(),
            density: 0.02, //0.001 is normal
            beforeDmg() {
                Matter.Body.setDensity(this, 0.0001); //reduce density to normal
                this.tryToLockOn();
                this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
            },
            onEnd() {
                b.explosion(this.position, this.explodeRad * size); //makes bullet do explosive damage at end
                if (spawn) {
                    for (let i = 0; i < mod.recursiveMissiles; i++) {
                        if (0.2 - 0.02 * i > Math.random()) {
                            b.missile(this.position, this.angle + Math.PI + 0.5 * (Math.random() - 0.5), 0, 0.33 + size, mod.recursiveMissiles)
                            break;
                        }
                    }
                }
            },
            lockedOn: null,
            tryToLockOn() {
                let closeDist = Infinity;
                const futurePos = Vector.add(this.position, Vector.mult(this.velocity, 30)) //look for closest target to where the missile will be in 30 cycles
                this.lockedOn = null;
                // const futurePos = this.lockedOn ? :Vector.add(this.position, Vector.mult(this.velocity, 50))
                for (let i = 0, len = mob.length; i < len; ++i) {
                    if (
                        mob[i].alive && mob[i].dropPowerUp &&
                        Matter.Query.ray(map, this.position, mob[i].position).length === 0
                        // && Matter.Query.ray(body, this.position, mob[i].position).length === 0
                    ) {
                        const futureDist = Vector.magnitude(Vector.sub(futurePos, mob[i].position));
                        if (futureDist < closeDist) {
                            closeDist = futureDist;
                            this.lockedOn = mob[i];
                            // this.frictionAir = 0.04; //extra friction once a target it locked
                        }
                        if (Vector.magnitude(Vector.sub(this.position, mob[i].position) < this.explodeRad)) {
                            this.endCycle = 0; //bullet ends cycle after doing damage  //also triggers explosion
                            mob[i].lockedOn.damage(b.dmgScale * 2 * size); //does extra damage to target
                        }
                    }
                }
                //explode when bullet is close enough to target
                if (this.lockedOn && Vector.magnitude(Vector.sub(this.position, this.lockedOn.position)) < this.explodeRad) {
                    this.endCycle = 0; //bullet ends cycle after doing damage  //also triggers explosion
                    this.lockedOn.damage(b.dmgScale * 4 * size); //does extra damage to target
                }
            },
            do() {
                if (!mech.isBodiesAsleep) {
                    if (!(mech.cycle % this.lookFrequency)) this.tryToLockOn();
                    if (this.lockedOn) { //rotate missile towards the target
                        const face = {
                            x: Math.cos(this.angle),
                            y: Math.sin(this.angle)
                        };
                        const target = Vector.normalise(Vector.sub(this.position, this.lockedOn.position));
                        // const target = Vector.normalise(Vector.sub(this.position, this.lockedOn.position));
                        const dot = Vector.dot(target, face)
                        const aim = Math.min(0.08, (1 + dot) * 1)
                        if (Vector.cross(target, face) > 0) {
                            Matter.Body.rotate(this, aim);
                        } else {
                            Matter.Body.rotate(this, -aim);
                        }
                        this.frictionAir = Math.min(0.1, Math.max(0.04, (1 + dot) * 1)) //0.08; //extra friction if turning
                    }
                    //accelerate in direction bullet is facing
                    const dir = this.angle;
                    this.force.x += thrust * Math.cos(dir);
                    this.force.y += thrust * Math.sin(dir);

                    ctx.beginPath(); //draw rocket
                    ctx.arc(this.position.x - Math.cos(this.angle) * (25 * size - 3) + (Math.random() - 0.5) * 4,
                        this.position.y - Math.sin(this.angle) * (25 * size - 3) + (Math.random() - 0.5) * 4,
                        11 * size, 0, 2 * Math.PI);
                    ctx.fillStyle = "rgba(255,155,0,0.5)";
                    ctx.fill();
                } else {
                    //draw rocket  with time stop
                    ctx.beginPath();
                    ctx.arc(this.position.x - Math.cos(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
                        this.position.y - Math.sin(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
                        2 + 9 * size, 0, 2 * Math.PI);
                    ctx.fillStyle = "rgba(255,155,0,0.5)";
                    ctx.fill();
                }
            },
        });
        const thrust = 0.0065 * bullet[me].mass;
        Matter.Body.setVelocity(bullet[me], {
            x: mech.Vx / 2 + speed * Math.cos(angle),
            y: mech.Vy / 2 + speed * Math.sin(angle)
        });
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    laser(where = {
        x: mech.pos.x + 20 * Math.cos(mech.angle),
        y: mech.pos.y + 20 * Math.sin(mech.angle)
    }, whereEnd = {
        x: where.x + 3000 * Math.cos(mech.angle),
        y: where.y + 3000 * Math.sin(mech.angle)
    }, dmg = mod.laserDamage, reflections = mod.laserReflections, isThickBeam = false) {
        const reflectivity = 1 - 1 / (reflections * 1.5)
        let damage = b.dmgScale * dmg
        let best = {
            x: null,
            y: null,
            dist2: Infinity,
            who: null,
            v1: null,
            v2: null
        };
        const color = "#f00";
        const path = [{
                x: where.x,
                y: where.y
            },
            {
                x: whereEnd.x,
                y: whereEnd.y
            }
        ];
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
                    if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) {
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

        const checkForCollisions = function() {
            best = {
                x: null,
                y: null,
                dist2: Infinity,
                who: null,
                v1: null,
                v2: null
            };
            vertexCollision(path[path.length - 2], path[path.length - 1], mob);
            vertexCollision(path[path.length - 2], path[path.length - 1], map);
            vertexCollision(path[path.length - 2], path[path.length - 1], body);
        };
        const laserHitMob = function() {
            if (best.who.alive) {
                best.who.damage(damage);
                best.who.locatePlayer();
                game.drawList.push({ //add dmg to draw queue
                    x: path[path.length - 1].x,
                    y: path[path.length - 1].y,
                    radius: Math.sqrt(damage) * 100,
                    color: "rgba(255,0,0,0.5)",
                    time: game.drawTime
                });
            }
            // ctx.fillStyle = color; //draw mob damage circle
            // ctx.beginPath();
            // ctx.arc(path[path.length - 1].x, path[path.length - 1].y, Math.sqrt(damage) * 100, 0, 2 * Math.PI);
            // ctx.fill();
        };
        const reflection = function() { // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
            const n = Vector.perp(Vector.normalise(Vector.sub(best.v1, best.v2)));
            const d = Vector.sub(path[path.length - 1], path[path.length - 2]);
            const nn = Vector.mult(n, 2 * Vector.dot(d, n));
            const r = Vector.normalise(Vector.sub(d, nn));
            path[path.length] = Vector.add(Vector.mult(r, 3000), path[path.length - 1]);
        };

        checkForCollisions();
        let lastBestOdd
        let lastBestEven = best.who //used in hack below
        if (best.dist2 !== Infinity) { //if hitting something
            path[path.length - 1] = {
                x: best.x,
                y: best.y
            };
            laserHitMob();
            for (let i = 0; i < reflections; i++) {
                reflection();
                checkForCollisions();
                if (best.dist2 !== Infinity) { //if hitting something
                    lastReflection = best

                    path[path.length - 1] = {
                        x: best.x,
                        y: best.y
                    };
                    damage *= reflectivity
                    laserHitMob();
                    //I'm not clear on how this works, but it gets ride of a bug where the laser reflects inside a block, often vertically.
                    //I think it checks to see if the laser is reflecting off a different part of the same block, if it is "inside" a block
                    if (i % 2) {
                        if (lastBestOdd === best.who) break
                    } else {
                        lastBestOdd = best.who
                        if (lastBestEven === best.who) break
                    }
                } else {
                    break
                }
            }
        }
        if (isThickBeam) {
            for (let i = 1, len = path.length; i < len; ++i) {
                ctx.moveTo(path[i - 1].x, path[i - 1].y);
                ctx.lineTo(path[i].x, path[i].y);
            }
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2
            ctx.lineDashOffset = 300 * Math.random()
            ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
            for (let i = 1, len = path.length; i < len; ++i) {
                ctx.beginPath();
                ctx.moveTo(path[i - 1].x, path[i - 1].y);
                ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
                ctx.globalAlpha *= reflectivity; //reflections are less intense
            }
            ctx.setLineDash([0, 0]);
            ctx.globalAlpha = 1;
        }
    },
    mine(where, velocity, angle = 0, isAmmoBack = false) {
        const bIndex = bullet.length;
        bullet[bIndex] = Bodies.rectangle(where.x, where.y, 45, 16, {
            angle: angle,
            friction: 1,
            frictionStatic: 1,
            frictionAir: 0,
            restitution: 0,
            dmg: 0, //damage done in addition to the damage from momentum
            classType: "bullet",
            bulletType: "mine",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield | cat.bullet
            },
            minDmgSpeed: 5,
            stillCount: 0,
            isArmed: false,
            endCycle: Infinity,
            lookFrequency: 0,
            range: 700,
            beforeDmg() {},
            do() {
                this.force.y += this.mass * 0.002; //extra gravity
                let collide = Matter.Query.collides(this, map) //check if collides with map
                if (collide.length > 0) {
                    for (let i = 0; i < collide.length; i++) {
                        if (collide[i].bodyA.collisionFilter.category === cat.map) { // || collide[i].bodyB.collisionFilter.category === cat.map) {
                            const angle = Vector.angle(collide[i].normal, {
                                x: 1,
                                y: 0
                            })
                            Matter.Body.setAngle(this, Math.atan2(collide[i].tangent.y, collide[i].tangent.x))
                            //move until touching map again after rotation
                            for (let j = 0; j < 10; j++) {
                                if (Matter.Query.collides(this, map).length > 0) { //touching map
                                    if (angle > -0.2 || angle < -1.5) { //don't stick to level ground
                                        Matter.Body.setStatic(this, true) //don't set to static if not touching map
                                        this.collisionFilter.mask = cat.map | cat.bullet
                                    } else {
                                        Matter.Body.setVelocity(this, {
                                            x: 0,
                                            y: 0
                                        });
                                        Matter.Body.setAngularVelocity(this, 0)
                                    }
                                    if (mod.isMineSentry) {
                                        this.sentry();
                                    } else {
                                        this.arm();
                                    }

                                    //sometimes the mine can't attach to map and it just needs to be reset
                                    const that = this
                                    setTimeout(function() {
                                        if (Matter.Query.collides(that, map).length === 0 || Matter.Query.point(map, that.position).length > 0) {
                                            that.endCycle = 0 // if not touching map explode
                                            that.isArmed = false
                                            b.mine(that.position, that.velocity, that.angle)
                                        }
                                    }, 100, that);
                                    break
                                }
                                //move until you are touching the wall
                                Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(collide[i].normal, 2)))
                            }
                            break
                        }
                    }
                } else {
                    if (this.speed < 1 && this.angularSpeed < 0.01 && !mech.isBodiesAsleep) {
                        this.stillCount++
                    }
                }
                if (this.stillCount > 25) {
                    if (mod.isMineSentry) {
                        this.sentry();
                    } else {
                        this.arm();
                    }
                }
            },
            sentry() {
                this.lookFrequency = game.cycle + 60
                this.endCycle = game.cycle + 1080
                this.do = function() { //overwrite the do method for this bullet
                    this.force.y += this.mass * 0.002; //extra gravity
                    if (game.cycle > this.lookFrequency) {
                        this.lookFrequency = 10 + Math.floor(3 * Math.random())
                        this.do = function() { //overwrite the do method for this bullet
                            this.force.y += this.mass * 0.002; //extra gravity
                            if (!(game.cycle % this.lookFrequency) && !mech.isBodiesAsleep) { //find mob targets
                                this.endCycle -= 10
                                b.targetedNail(this.position, 1, 45 + 5 * Math.random(), 1100, false)
                                if (!(game.cycle % (this.lookFrequency * 6))) {
                                    game.drawList.push({
                                        x: this.position.x,
                                        y: this.position.y,
                                        radius: 8,
                                        color: "#fe0",
                                        time: 4
                                    });
                                }
                            }
                        }
                    }
                }
            },
            arm() {
                this.lookFrequency = game.cycle + 60
                this.do = function() { //overwrite the do method for this bullet
                    this.force.y += this.mass * 0.002; //extra gravity
                    if (game.cycle > this.lookFrequency) {
                        this.isArmed = true
                        this.lookFrequency = 50 + Math.floor(27 * Math.random())
                        game.drawList.push({
                            x: this.position.x,
                            y: this.position.y,
                            radius: 10,
                            color: "#f00",
                            time: 4
                        });
                        this.do = function() { //overwrite the do method for this bullet
                            this.force.y += this.mass * 0.002; //extra gravity
                            if (!(game.cycle % this.lookFrequency)) { //find mob targets
                                for (let i = 0, len = mob.length; i < len; ++i) {
                                    if (Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position)) < 500000 &&
                                        mob[i].dropPowerUp &&
                                        Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                                        Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                                        this.endCycle = 0 //end life if mob is near and visible
                                        if (Math.random() < 0.8) isAmmoBack = false; //20% chance to get ammo back after detonation
                                    }
                                }
                            }
                        }
                    }
                }
            },
            onEnd() {
                if (this.isArmed) {
                    b.targetedNail(this.position, 15)
                }
                if (isAmmoBack) { //get ammo back from mod.isMineAmmoBack
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun
                        if (b.guns[i].name === "mine") {
                            b.guns[i].ammo++
                            game.updateGunHUD();
                            break;
                        }
                    }
                }
            }
        });
        bullet[bIndex].torque += bullet[bIndex].inertia * 0.0002 * (0.5 - Math.random())
        Matter.Body.setVelocity(bullet[bIndex], velocity);
        World.add(engine.world, bullet[bIndex]); //add bullet to world
    },
    spore(where, isFreeze = mod.isSporeFreeze) { //used with the mod upgrade in mob.death()
        const bIndex = bullet.length;
        const side = 4;
        bullet[bIndex] = Bodies.polygon(where.x, where.y, 4, side, {
            // density: 0.0015,			//frictionAir: 0.01,
            inertia: Infinity,
            isFreeze: isFreeze,
            restitution: 0.5,
            angle: Math.random() * 2 * Math.PI,
            friction: 0,
            frictionAir: 0.025,
            thrust: (mod.isFastSpores ? 0.001 : 0.0004) * (1 + 0.3 * (Math.random() - 0.5)),
            dmg: mod.isMutualism ? 6 : 3, //2x bonus damage from mod.isMutualism
            lookFrequency: 97 + Math.floor(117 * Math.random()),
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.mob | cat.mobBullet | cat.mobShield //no collide with body
            },
            endCycle: game.cycle + Math.floor((540 + Math.floor(Math.random() * 360)) * mod.isBulletsLastLonger),
            minDmgSpeed: 0,
            playerOffPosition: { //used when following player to keep spores separate
                x: 100 * (Math.random() - 0.5),
                y: 100 * (Math.random() - 0.5)
            },
            beforeDmg(who) {
                this.endCycle = 0; //bullet ends cycle after doing damage 
                if (this.isFreeze) mobs.statusSlow(who, 60)
            },
            onEnd() {
                if (mod.isMutualism && this.isMutualismActive && !mod.isEnergyHealth) {
                    mech.health += 0.01
                    if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
                    mech.displayHealth();
                }
            },
            do() {
                if (this.lockedOn && this.lockedOn.alive) {
                    this.force = Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), this.mass * this.thrust)
                } else {
                    if (!(game.cycle % this.lookFrequency)) { //find mob targets
                        this.closestTarget = null;
                        this.lockedOn = null;
                        let closeDist = Infinity;
                        for (let i = 0, len = mob.length; i < len; ++i) {
                            if (mob[i].dropPowerUp && Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
                                const targetVector = Vector.sub(this.position, mob[i].position)
                                const dist = Vector.magnitude(targetVector) * (Math.random() + 0.5);
                                if (dist < closeDist) {
                                    this.closestTarget = mob[i].position;
                                    closeDist = dist;
                                    this.lockedOn = mob[i]
                                    if (0.3 > Math.random()) break //doesn't always target the closest mob
                                }
                            }
                        }
                    }
                    if (mod.isSporeFollow && this.lockedOn === null) { //move towards player
                        //checking for null means that the spores don't go after the player until it has looked and not found a target
                        const dx = this.position.x - mech.pos.x;
                        const dy = this.position.y - mech.pos.y;
                        if (dx * dx + dy * dy > 10000) {
                            this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, Vector.add(this.playerOffPosition, this.position))), this.mass * this.thrust)
                        }
                    } else {
                        this.force.y += this.mass * 0.0001; //gravity
                    }

                }

                // if (!this.lockedOn && !(game.cycle % this.lookFrequency)) { //find mob targets
                //   this.closestTarget = null;
                //   this.lockedOn = null;
                //   let closeDist = Infinity;
                //   for (let i = 0, len = mob.length; i < len; ++i) {
                //     if (mob[i].dropPowerUp && Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
                //       // Matter.Query.ray(body, this.position, mob[i].position).length === 0
                //       const targetVector = Vector.sub(this.position, mob[i].position)
                //       const dist = Vector.magnitude(targetVector);
                //       if (dist < closeDist) {
                //         this.closestTarget = mob[i].position;
                //         closeDist = dist;
                //         this.lockedOn = mob[i] //Vector.normalise(targetVector);
                //         if (0.3 > Math.random()) break //doesn't always target the closest mob
                //       }
                //     }
                //   }
                // }
                // if (this.lockedOn && this.lockedOn.alive) { //accelerate towards mobs
                //   this.force = Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), this.mass * this.thrust)
                // } else if (mod.isSporeFollow && this.lockedOn !== undefined) { //move towards player
                //   //checking for undefined means that the spores don't go after the player until it has looked and not found a target
                //   const dx = this.position.x - mech.pos.x;
                //   const dy = this.position.y - mech.pos.y;
                //   if (dx * dx + dy * dy > 10000) {
                //     this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, Vector.add(this.playerOffPosition, this.position))), this.mass * this.thrust)
                //   }
                //   // this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.thrust)
                // } else {
                //   this.force.y += this.mass * 0.0001; //gravity
                // }
            },
        });
        const SPEED = 4 + 8 * Math.random();
        const ANGLE = 2 * Math.PI * Math.random()
        Matter.Body.setVelocity(bullet[bIndex], {
            x: SPEED * Math.cos(ANGLE),
            y: SPEED * Math.sin(ANGLE)
        });
        World.add(engine.world, bullet[bIndex]); //add bullet to world

        if (mod.isMutualism && mech.health > 0.02) {
            mech.health -= 0.01
            mech.displayHealth();
            bullet[bIndex].isMutualismActive = true
        }
    },
    iceIX(speed = 0, spread = 2 * Math.PI) {
        const me = bullet.length;
        const THRUST = 0.004
        const dir = mech.angle + spread * (Math.random() - 0.5);
        const RADIUS = 18
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 3, RADIUS, {
            angle: dir - Math.PI,
            inertia: Infinity,
            friction: 0,
            frictionAir: 0.10,
            restitution: 0.3,
            dmg: 0.15, //damage done in addition to the damage from momentum
            lookFrequency: 10 + Math.floor(7 * Math.random()),
            endCycle: game.cycle + 120 * mod.isBulletsLastLonger, //Math.floor((1200 + 420 * Math.random()) * mod.isBulletsLastLonger),
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield //self collide
            },
            minDmgSpeed: 0,
            lockedOn: null,
            isFollowMouse: true,
            beforeDmg(who) {
                mobs.statusSlow(who, 60)
                this.endCycle = game.cycle
                if (mod.isHeavyWater) mobs.statusDoT(who, 0.15, 300)
                if (mod.iceEnergy && !who.shield && !who.isShielded && who.dropPowerUp && who.alive) {
                    setTimeout(function() {
                        if (!who.alive) {
                            mech.energy += mod.iceEnergy * 0.5 * mech.maxEnergy
                            mech.addHealth(mod.iceEnergy * 0.04)
                        }
                    }, 10);
                }
            },
            onEnd() {},
            do() {
                // this.force.y += this.mass * 0.0002;
                //find mob targets
                if (!(game.cycle % this.lookFrequency)) {
                    const scale = 1 - 0.09 / mod.isBulletsLastLonger //0.9 * mod.isBulletsLastLonger;
                    Matter.Body.scale(this, scale, scale);
                    this.lockedOn = null;
                    let closeDist = Infinity;
                    for (let i = 0, len = mob.length; i < len; ++i) {
                        if (
                            mob[i].dropPowerUp &&
                            Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                            Matter.Query.ray(body, this.position, mob[i].position).length === 0
                        ) {
                            const TARGET_VECTOR = Vector.sub(this.position, mob[i].position)
                            const DIST = Vector.magnitude(TARGET_VECTOR);
                            if (DIST < closeDist) {
                                closeDist = DIST;
                                this.lockedOn = mob[i]
                            }
                        }
                    }
                }
                if (this.lockedOn) { //accelerate towards mobs
                    this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, this.lockedOn.position)), -this.mass * THRUST)
                } else {
                    this.force = Vector.mult(Vector.normalise(this.velocity), this.mass * THRUST)
                }
            }
        })

        World.add(engine.world, bullet[me]); //add bullet to world
        // Matter.Body.setAngularVelocity(bullet[me], 2 * (0.5 - Math.random()))  //doesn't work due to high friction
        Matter.Body.setVelocity(bullet[me], {
            x: speed * Math.cos(dir),
            y: speed * Math.sin(dir)
        });
        // Matter.Body.setVelocity(bullet[me], {
        //   x: mech.Vx / 2 + speed * Math.cos(dir),
        //   y: mech.Vy / 2 + speed * Math.sin(dir)
        // });
    },
    drone(speed = 1) {
        const me = bullet.length;
        const THRUST = mod.isFastDrones ? 0.0023 : 0.0015
        // const FRICTION = mod.isFastDrones ? 0.008 : 0.0005
        const dir = mech.angle + 0.4 * (Math.random() - 0.5);
        const RADIUS = (4.5 + 3 * Math.random())
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle) + Math.random(), mech.pos.y + 30 * Math.sin(mech.angle) + Math.random(), 8, RADIUS, {
            angle: dir,
            inertia: Infinity,
            friction: 0.05,
            frictionAir: 0,
            restitution: 1,
            dmg: 0.24, //damage done in addition to the damage from momentum
            lookFrequency: 80 + Math.floor(23 * Math.random()),
            endCycle: game.cycle + Math.floor((1100 + 420 * Math.random()) * mod.isBulletsLastLonger),
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield //self collide
            },
            minDmgSpeed: 0,
            lockedOn: null,
            isFollowMouse: true,
            deathCycles: 110 + RADIUS * 5,
            isImproved: false,
            beforeDmg(who) {
                if (mod.isIncendiary) {
                    const max = Math.min(this.endCycle - game.cycle, 1500)
                    b.explosion(this.position, max * 0.08 + this.isImproved * 100 + 60 * Math.random()); //makes bullet do explosive damage at end
                    this.endCycle -= max
                } else {
                    //move away from target after hitting
                    const unit = Vector.mult(Vector.normalise(Vector.sub(this.position, who.position)), -20)
                    Matter.Body.setVelocity(this, {
                        x: unit.x,
                        y: unit.y
                    });
                    this.lockedOn = null
                    if (this.endCycle > game.cycle + this.deathCycles) {
                        this.endCycle -= 60
                        if (game.cycle + this.deathCycles > this.endCycle) this.endCycle = game.cycle + this.deathCycles
                    }
                }
            },
            onEnd() {},
            do() {
                if (game.cycle + this.deathCycles > this.endCycle) { //fall shrink and die
                    this.force.y += this.mass * 0.0012;
                    this.restitution = 0.2;
                    const scale = 0.99;
                    Matter.Body.scale(this, scale, scale);
                } else {
                    this.force.y += this.mass * 0.0002;
                    //find mob targets
                    if (!(game.cycle % this.lookFrequency)) {
                        this.lockedOn = null;
                        let closeDist = Infinity;
                        for (let i = 0, len = mob.length; i < len; ++i) {
                            if (
                                mob[i].dropPowerUp &&
                                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                                Matter.Query.ray(body, this.position, mob[i].position).length === 0
                            ) {
                                const TARGET_VECTOR = Vector.sub(this.position, mob[i].position)
                                const DIST = Vector.magnitude(TARGET_VECTOR);
                                if (DIST < closeDist) {
                                    closeDist = DIST;
                                    this.lockedOn = mob[i]
                                }
                            }
                        }
                        if (!this.lockedOn && !mod.isArmorFromPowerUps && !this.isImproved) { //grab a power up
                            let closeDist = Infinity;
                            for (let i = 0, len = powerUp.length; i < len; ++i) {
                                if (
                                    (powerUp[i].name !== "heal" || mech.health < 0.9 * mech.maxHealth || mod.isDroneGrab) &&
                                    (powerUp[i].name !== "field" || !mod.isDeterminism)
                                ) {
                                    //pick up nearby power ups
                                    if (Vector.magnitudeSquared(Vector.sub(this.position, powerUp[i].position)) < 60000 && !game.isChoosing) {
                                        powerUps.onPickUp(this.position);
                                        powerUp[i].effect();
                                        Matter.World.remove(engine.world, powerUp[i]);
                                        powerUp.splice(i, 1);
                                        if (mod.isDroneGrab) {
                                            this.isImproved = true;
                                            const SCALE = 3
                                            Matter.Body.scale(this, SCALE, SCALE);
                                            this.lookFrequency = 30;
                                            this.endCycle += 2500
                                            this.frictionAir = 0
                                        }
                                        break;
                                    }
                                    //look for power ups to lock onto
                                    if (
                                        Matter.Query.ray(map, this.position, powerUp[i].position).length === 0 &&
                                        Matter.Query.ray(body, this.position, powerUp[i].position).length === 0
                                    ) {
                                        const TARGET_VECTOR = Vector.sub(this.position, powerUp[i].position)
                                        const DIST = Vector.magnitude(TARGET_VECTOR);
                                        if (DIST < closeDist) {
                                            closeDist = DIST;
                                            this.lockedOn = powerUp[i]
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (this.lockedOn) { //accelerate towards mobs
                        this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, this.lockedOn.position)), -this.mass * THRUST)
                    } else { //accelerate towards mouse
                        this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, game.mouseInGame)), -this.mass * THRUST)
                    }
                    // speed cap instead of friction to give more agility
                    if (this.speed > 6) {
                        Matter.Body.setVelocity(this, {
                            x: this.velocity.x * 0.97,
                            y: this.velocity.y * 0.97
                        });
                    }
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
        Matter.Body.setVelocity(bullet[me], {
            x: speed * Math.cos(dir),
            y: speed * Math.sin(dir)
        });
    },
    foam(position, velocity, radius) {
        // radius *= Math.sqrt(mod.bulletSize)
        const me = bullet.length;
        bullet[me] = Bodies.polygon(position.x, position.y, 20, radius, {
            // angle: 0,
            density: 0.00005, //  0.001 is normal density
            inertia: Infinity,
            frictionAir: 0.003,
            // friction: 0.2,
            // restitution: 0.2,
            dmg: mod.isFastFoam ? 0.02 : 0.0055, //damage done in addition to the damage from momentum
            scale: 1 - 0.005 / mod.isBulletsLastLonger * (mod.isFastFoam ? 1.6 : 1),
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.mob | cat.mobBullet // cat.map | cat.body | cat.mob | cat.mobShield
            },
            minDmgSpeed: 0,
            endCycle: Infinity,
            count: 0,
            radius: radius,
            target: null,
            targetVertex: null,
            targetRelativePosition: null,
            beforeDmg(who) {
                if (!this.target && who.alive) {
                    this.target = who;
                    if (who.radius < 20) {
                        this.targetRelativePosition = {
                            x: 0,
                            y: 0
                        } //find relative position vector for zero mob rotation
                    } else if (Matter.Query.collides(this, [who]).length > 0) {
                        const normal = Matter.Query.collides(this, [who])[0].normal
                        this.targetRelativePosition = Vector.rotate(Vector.sub(Vector.sub(this.position, who.position), Vector.mult(normal, -this.radius)), -who.angle) //find relative position vector for zero mob rotation
                    } else {
                        this.targetRelativePosition = Vector.rotate(Vector.sub(this.position, who.position), -who.angle) //find relative position vector for zero mob rotation
                    }
                    this.collisionFilter.category = cat.body;
                    this.collisionFilter.mask = null;

                    let bestVertexDistance = Infinity
                    let bestVertex = null
                    for (let i = 0; i < this.target.vertices.length; i++) {
                        const dist = Vector.magnitude(Vector.sub(this.position, this.target.vertices[i]));
                        if (dist < bestVertexDistance) {
                            bestVertex = i
                            bestVertexDistance = dist
                        }
                    }
                    this.targetVertex = bestVertex
                }
            },
            onEnd() {},
            do() {
                if (!mech.isBodiesAsleep) { //if time dilation isn't active
                    if (this.count < 20) {
                        this.count++
                        //grow
                        const SCALE = 1.06
                        Matter.Body.scale(this, SCALE, SCALE);
                        this.radius *= SCALE;
                    } else {
                        //shrink
                        Matter.Body.scale(this, this.scale, this.scale);
                        this.radius *= this.scale;
                        if (this.radius < 8) this.endCycle = 0;
                    }

                    if (this.target && this.target.alive) { //if stuck to a target
                        const rotate = Vector.rotate(this.targetRelativePosition, this.target.angle) //add in the mob's new angle to the relative position vector
                        if (this.target.isVerticesChange) {
                            Matter.Body.setPosition(this, this.target.vertices[this.targetVertex])
                        } else {
                            Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.target.velocity), this.target.position))
                        }
                        Matter.Body.setVelocity(this.target, Vector.mult(this.target.velocity, 0.9))
                        Matter.Body.setAngularVelocity(this.target, this.target.angularVelocity * 0.9);

                        // Matter.Body.setAngularVelocity(this.target, this.target.angularVelocity * 0.9)
                        if (this.target.isShielded) {
                            this.target.damage(b.dmgScale * this.dmg, true); //shield damage bypass
                            //shrink if mob is shielded
                            const SCALE = 1 - 0.018 / mod.isBulletsLastLonger
                            Matter.Body.scale(this, SCALE, SCALE);
                            this.radius *= SCALE;
                        } else {
                            this.target.damage(b.dmgScale * this.dmg);
                        }
                    } else if (this.target !== null) { //look for a new target
                        this.target = null
                        this.collisionFilter.category = cat.bullet;
                        this.collisionFilter.mask = cat.mob //| cat.mobShield //cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                        if (mod.isFoamGrowOnDeath && bullet.length < 300) {
                            let targets = []
                            for (let i = 0, len = mob.length; i < len; i++) {
                                const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                                if (dist < 1000000) {
                                    targets.push(mob[i])
                                }
                            }
                            const radius = Math.min(this.radius * 0.5, 10)
                            for (let i = 0; i < 2; i++) {
                                if (targets.length - i > 0) {
                                    const index = Math.floor(Math.random() * targets.length)
                                    const speed = 10 + 10 * Math.random()
                                    const velocity = Vector.mult(Vector.normalise(Vector.sub(targets[index].position, this.position)), speed)
                                    b.foam(this.position, Vector.rotate(velocity, 0.5 * (Math.random() - 0.5)), radius)
                                } else {
                                    b.foam(this.position, Vector.rotate({
                                        x: 15 + 10 * Math.random(),
                                        y: 0
                                    }, 2 * Math.PI * Math.random()), radius)
                                }
                            }
                        }
                    } else if (Matter.Query.point(map, this.position).length > 0) { //slow when touching map or blocks
                        const slow = 0.85
                        Matter.Body.setVelocity(this, {
                            x: this.velocity.x * slow,
                            y: this.velocity.y * slow
                        });
                        const SCALE = 0.96
                        Matter.Body.scale(this, SCALE, SCALE);
                        this.radius *= SCALE;
                        // } else if (Matter.Query.collides(this, body).length > 0) {
                    } else if (Matter.Query.point(body, this.position).length > 0) {
                        const slow = 0.9
                        Matter.Body.setVelocity(this, {
                            x: this.velocity.x * slow,
                            y: this.velocity.y * slow
                        });
                        const SCALE = 0.96
                        Matter.Body.scale(this, SCALE, SCALE);
                        this.radius *= SCALE;
                    } else {
                        this.force.y += this.mass * 0.00008; //gravity
                    }
                }
            }
        });
        World.add(engine.world, bullet[me]); //add bullet to world
        Matter.Body.setVelocity(bullet[me], velocity);
    },
    targetedNail(position, num = 1, speed = 50 + 10 * Math.random(), range = 1200, isRandomAim = true) {
        const targets = [] //target nearby mobs
        for (let i = 0, len = mob.length; i < len; i++) {
            if (mob[i].dropPowerUp) {
                const dist = Vector.magnitude(Vector.sub(position, mob[i].position));
                if (dist < range &&
                    Matter.Query.ray(map, position, mob[i].position).length === 0 &&
                    Matter.Query.ray(body, position, mob[i].position).length === 0) {
                    targets.push(Vector.add(mob[i].position, Vector.mult(mob[i].velocity, dist / 60))) //predict where the mob will be in a few cycles
                }
            }
        }
        for (let i = 0; i < num; i++) {
            if (targets.length > 0) { // aim near a random target in array
                const index = Math.floor(Math.random() * targets.length)
                const SPREAD = 150 / targets.length
                const WHERE = {
                    x: targets[index].x + SPREAD * (Math.random() - 0.5),
                    y: targets[index].y + SPREAD * (Math.random() - 0.5)
                }
                b.nail(position, Vector.mult(Vector.normalise(Vector.sub(WHERE, position)), speed), 1.1)
            } else if (isRandomAim) { // aim in random direction
                const ANGLE = 2 * Math.PI * Math.random()
                b.nail(position, {
                    x: speed * Math.cos(ANGLE),
                    y: speed * Math.sin(ANGLE)
                })
            }
        }
    },
    nail(pos, velocity, dmg = 0) {
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(pos.x, pos.y, 25 * mod.biggerNails, 2 * mod.biggerNails, b.fireAttributes(Math.atan2(velocity.y, velocity.x)));
        Matter.Body.setVelocity(bullet[me], velocity);
        World.add(engine.world, bullet[me]); //add bullet to world
        bullet[me].endCycle = game.cycle + 60 + 18 * Math.random();
        bullet[me].dmg = dmg
        bullet[me].beforeDmg = function(who) { //beforeDmg is rewritten with ice crystal mod
            if (mod.isNailPoison) mobs.statusDoT(who, dmg * 0.22, 120) // one tick every 30 cycles
            if (mod.isNailCrit && !who.shield && Vector.dot(Vector.normalise(Vector.sub(who.position, this.position)), Vector.normalise(this.velocity)) > 0.99) this.dmg *= 5 //crit if hit near center
        };
        bullet[me].do = function() {};
    },
    // **************************************************************************************************
    // **************************************************************************************************
    // ********************************         Bots        *********************************************
    // **************************************************************************************************
    // **************************************************************************************************
    respawnBots() {
        for (let i = 0; i < mod.laserBotCount; i++) b.laserBot()
        for (let i = 0; i < mod.nailBotCount; i++) b.nailBot()
        for (let i = 0; i < mod.foamBotCount; i++) b.foamBot()
        for (let i = 0; i < mod.boomBotCount; i++) b.boomBot()
        for (let i = 0; i < mod.plasmaBotCount; i++) b.plasmaBot()
        for (let i = 0; i < mod.orbitBotCount; i++) b.orbitBot()
        if (mod.isIntangible && mech.isCloak) {
            for (let i = 0; i < bullet.length; i++) {
                if (bullet[i].botType) bullet[i].collisionFilter.mask = cat.map | cat.bullet | cat.mobBullet | cat.mobShield
            }
        }
    },
    randomBot(where = mech.pos, isKeep = true) {
        if (Math.random() < 0.2) {
            b.orbitBot();
            if (isKeep) mod.orbitBotCount++;
        } else if (Math.random() < 0.25) {
            b.nailBot(where)
            if (isKeep) mod.nailBotCount++;
        } else if (Math.random() < 0.33) {
            b.laserBot(where)
            if (isKeep) mod.laserBotCount++;
        } else if (Math.random() < 0.5) {
            b.foamBot(where)
            if (isKeep) mod.foamBotCount++;
        } else {
            b.boomBot(where)
            if (isKeep) mod.boomBotCount++;
        }
    },
    nailBot(position = mech.pos) {
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (12 + 4 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 4, RADIUS, {
            isUpgraded: mod.isNailBotUpgrade,
            botType: "nail",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            restitution: 0.6 * (1 + 0.5 * Math.random()),
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            // lookFrequency: 56 + Math.floor(17 * Math.random()) - isUpgraded * 20,
            lastLookCycle: game.cycle + 60 * Math.random(),
            acceleration: 0.005 * (1 + 0.5 * Math.random()),
            range: 70 * (1 + 0.3 * Math.random()),
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            lockedOn: null,
            beforeDmg() {
                this.lockedOn = null
            },
            onEnd() {},
            do() {
                if (this.lastLookCycle < game.cycle && !mech.isCloak) {
                    this.lastLookCycle = game.cycle + 80 - this.isUpgraded * 65
                    let target
                    for (let i = 0, len = mob.length; i < len; i++) {
                        const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                        if (dist < 3000000 && //1400*1400
                            Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                            Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                            target = Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))
                            const SPEED = 50
                            b.nail(this.position, Vector.mult(Vector.normalise(Vector.sub(target, this.position)), SPEED), 0.4)
                            break;
                        }
                    }
                }
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > this.range) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
                } else { //close to player
                    Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    foamBot(position = mech.pos) {
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (10 + 5 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 6, RADIUS, {
            isUpgraded: mod.isFoamBotUpgrade,
            botType: "foam",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            restitution: 0.6 * (1 + 0.5 * Math.random()),
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 60 + Math.floor(17 * Math.random()) - 20 * mod.isFoamBotUpgrade,
            cd: 0,
            delay: 100,
            acceleration: 0.005 * (1 + 0.5 * Math.random()),
            range: 70 * (1 + 0.3 * Math.random()),
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            lockedOn: null,
            beforeDmg() {
                this.lockedOn = null
            },
            onEnd() {},
            do() {
                if (this.cd < game.cycle && !(game.cycle % this.lookFrequency) && !mech.isCloak) {
                    let target
                    for (let i = 0, len = mob.length; i < len; i++) {
                        const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                        if (dist < 1000000 && Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
                            this.cd = game.cycle + this.delay;
                            target = Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))
                            const radius = 6 + 7 * Math.random()
                            const SPEED = 29 - radius * 0.5; //(mech.crouch ? 32 : 20) - radius * 0.7;
                            const velocity = Vector.mult(Vector.normalise(Vector.sub(target, this.position)), SPEED)
                            b.foam(this.position, velocity, radius + 9 * this.isUpgraded)
                            break;
                        }
                    }
                }
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > this.range) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
                } else { //close to player
                    Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    laserBot(position = mech.pos) {
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (14 + 6 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 3, RADIUS, {
            isUpgraded: mod.isLaserBotUpgrade,
            botType: "laser",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.008 * (1 + 0.3 * Math.random()),
            restitution: 0.5 * (1 + 0.5 * Math.random()),
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 40 + Math.floor(7 * Math.random()),
            drainThreshold: mod.isEnergyHealth ? 0.5 : 0.15,
            acceleration: 0.0015 * (1 + 0.3 * Math.random()),
            range: 700 * (1 + 0.1 * Math.random()) + 300 * mod.isLaserBotUpgrade,
            followRange: 150 + Math.floor(30 * Math.random()),
            offPlayer: {
                x: 0,
                y: 0,
            },
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            lockedOn: null,
            beforeDmg() {
                this.lockedOn = null
            },
            onEnd() {},
            do() {
                const playerPos = Vector.add(Vector.add(this.offPlayer, mech.pos), Vector.mult(player.velocity, 20)) //also include an offset unique to this bot to keep many bots spread out
                const farAway = Math.max(0, (Vector.magnitude(Vector.sub(this.position, playerPos))) / this.followRange) //linear bounding well 
                const mag = Math.min(farAway, 4) * this.mass * this.acceleration
                this.force = Vector.mult(Vector.normalise(Vector.sub(playerPos, this.position)), mag)
                //manual friction to not lose rotational velocity
                Matter.Body.setVelocity(this, {
                    x: this.velocity.x * 0.95,
                    y: this.velocity.y * 0.95
                });
                //find targets
                if (!(game.cycle % this.lookFrequency)) {
                    this.lockedOn = null;
                    if (!mech.isCloak) {
                        let closeDist = this.range;
                        for (let i = 0, len = mob.length; i < len; ++i) {
                            const DIST = Vector.magnitude(Vector.sub(this.vertices[0], mob[i].position));
                            if (DIST - mob[i].radius < closeDist &&
                                !mob[i].isShielded &&
                                Matter.Query.ray(map, this.vertices[0], mob[i].position).length === 0 &&
                                Matter.Query.ray(body, this.vertices[0], mob[i].position).length === 0) {
                                closeDist = DIST;
                                this.lockedOn = mob[i]
                            }
                        }
                    }
                    //randomize position relative to player
                    if (Math.random() < 0.15) {
                        this.offPlayer = {
                            x: 120 * (Math.random() - 0.5),
                            y: 120 * (Math.random() - 0.5) - 20,
                        }
                    }
                }
                //hit target with laser
                if (this.lockedOn && this.lockedOn.alive && mech.energy > this.drainThreshold) {
                    mech.energy -= 0.0012 * mod.isLaserDiode
                    b.laser(this.vertices[0], this.lockedOn.position, b.dmgScale * (0.06 + 0.15 * this.isUpgraded))
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    boomBot(position = mech.pos) {
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (7 + 2 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 4, RADIUS, {
            isUpgraded: mod.isBoomBotUpgrade,
            botType: "boom",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            restitution: 1,
            dmg: 0,
            minDmgSpeed: 0,
            lookFrequency: 43 + Math.floor(7 * Math.random()),
            acceleration: 0.005 * (1 + 0.5 * Math.random()),
            range: 500 * (1 + 0.1 * Math.random()) + 350 * mod.isBoomBotUpgrade,
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            lockedOn: null,
            explode: 0,
            beforeDmg() {
                if (this.lockedOn) {
                    const explosionRadius = Math.min(170 + 200 * this.isUpgraded, Vector.magnitude(Vector.sub(this.position, mech.pos)) - 30)
                    if (explosionRadius > 60) {
                        this.explode = explosionRadius
                        // 
                        //push away from player, because normal explosion knock doesn't do much
                        // const sub = Vector.sub(this.lockedOn.position, mech.pos)
                        // mag = Math.min(35, 20 / Math.sqrt(this.lockedOn.mass))
                        // Matter.Body.setVelocity(this.lockedOn, Vector.mult(Vector.normalise(sub), mag))
                    }
                    this.lockedOn = null //lose target so bot returns to player
                }
            },
            onEnd() {},
            do() {
                if (this.explode) {
                    b.explosion(this.position, this.explode); //makes bullet do explosive damage at end
                    this.explode = 0;
                }
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > 100) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
                } else if (distanceToPlayer < 250) { //close to player
                    Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity
                    //find targets
                    if (!(game.cycle % this.lookFrequency) && !mech.isCloak) {
                        this.lockedOn = null;
                        let closeDist = this.range;
                        for (let i = 0, len = mob.length; i < len; ++i) {
                            const DIST = Vector.magnitude(Vector.sub(this.position, mob[i].position)) - mob[i].radius;
                            if (DIST < closeDist && mob[i].dropPowerUp &&
                                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                                Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                                closeDist = DIST;
                                this.lockedOn = mob[i]
                            }
                        }
                    }
                }
                //punch target
                if (this.lockedOn && this.lockedOn.alive && !mech.isCloak) {
                    const DIST = Vector.magnitude(Vector.sub(this.vertices[0], this.lockedOn.position));
                    if (DIST - this.lockedOn.radius < this.range &&
                        Matter.Query.ray(map, this.position, this.lockedOn.position).length === 0) {
                        //move towards the target
                        this.force = Vector.add(this.force, Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), 0.012 * this.mass))
                    }
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    plasmaBot(position = mech.pos) {
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = 21
        bullet[me] = Bodies.polygon(position.x, position.y, 5, RADIUS, {
            botType: "plasma",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            restitution: 1,
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 25,
            cd: 0,
            acceleration: 0.009,
            endCycle: Infinity,
            drainThreshold: mod.isEnergyHealth ? 0.5 : 0.15,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            lockedOn: null,
            beforeDmg() {
                this.lockedOn = null
            },
            onEnd() {},
            do() {
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > 150) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
                }
                Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity
                //find closest
                if (!(game.cycle % this.lookFrequency)) {
                    this.lockedOn = null;
                    if (!mech.isCloak) {
                        let closeDist = mod.isPlasmaRange * 1000;
                        for (let i = 0, len = mob.length; i < len; ++i) {
                            const DIST = Vector.magnitude(Vector.sub(this.position, mob[i].position)) - mob[i].radius;
                            if (DIST < closeDist &&
                                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                                Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                                closeDist = DIST;
                                this.lockedOn = mob[i]
                            }
                        }
                    }
                }
                //fire plasma at target
                if (this.lockedOn && this.lockedOn.alive && mech.fieldCDcycle < mech.cycle) {
                    const sub = Vector.sub(this.lockedOn.position, this.position)
                    const DIST = Vector.magnitude(sub);
                    const unit = Vector.normalise(sub)
                    if (DIST < mod.isPlasmaRange * 450 && mech.energy > this.drainThreshold) {
                        mech.energy -= 0.0012;
                        if (mech.energy < 0) {
                            mech.fieldCDcycle = mech.cycle + 120;
                            mech.energy = 0;
                        }
                        //calculate laser collision
                        let best;
                        let range = mod.isPlasmaRange * (120 + 300 * Math.sqrt(Math.random()))
                        const path = [{
                                x: this.position.x,
                                y: this.position.y
                            },
                            {
                                x: this.position.x + range * unit.x,
                                y: this.position.y + range * unit.y
                            }
                        ];
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
                                    if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) {
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
                        //check for collisions
                        best = {
                            x: null,
                            y: null,
                            dist2: Infinity,
                            who: null,
                            v1: null,
                            v2: null
                        };
                        vertexCollision(path[0], path[1], mob);
                        vertexCollision(path[0], path[1], map);
                        vertexCollision(path[0], path[1], body);
                        if (best.dist2 != Infinity) { //if hitting something
                            path[path.length - 1] = {
                                x: best.x,
                                y: best.y
                            };
                            if (best.who.alive) {
                                const dmg = 0.8 * b.dmgScale; //********** SCALE DAMAGE HERE *********************
                                best.who.damage(dmg);
                                best.who.locatePlayer();
                                //push mobs away
                                const force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, path[1])), -0.01 * Math.min(5, best.who.mass))
                                Matter.Body.applyForce(best.who, path[1], force)
                                Matter.Body.setVelocity(best.who, { //friction
                                    x: best.who.velocity.x * 0.7,
                                    y: best.who.velocity.y * 0.7
                                });
                                //draw mob damage circle
                                game.drawList.push({
                                    x: path[1].x,
                                    y: path[1].y,
                                    radius: Math.sqrt(dmg) * 50,
                                    color: "rgba(255,0,255,0.2)",
                                    time: game.drawTime * 4
                                });
                            } else if (!best.who.isStatic) {
                                //push blocks away
                                const force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, path[1])), -0.007 * Math.sqrt(Math.sqrt(best.who.mass)))
                                Matter.Body.applyForce(best.who, path[1], force)
                            }
                        }
                        //draw blowtorch laser beam
                        ctx.strokeStyle = "rgba(255,0,255,0.1)"
                        ctx.lineWidth = 14
                        ctx.beginPath();
                        ctx.moveTo(path[0].x, path[0].y);
                        ctx.lineTo(path[1].x, path[1].y);
                        ctx.stroke();
                        ctx.strokeStyle = "#f0f";
                        ctx.lineWidth = 2
                        ctx.stroke();
                        //draw electricity
                        let x = this.position.x + 20 * unit.x;
                        let y = this.position.y + 20 * unit.y;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        const step = Vector.magnitude(Vector.sub(path[0], path[1])) / 5
                        for (let i = 0; i < 4; i++) {
                            x += step * (unit.x + 1.5 * (Math.random() - 0.5))
                            y += step * (unit.y + 1.5 * (Math.random() - 0.5))
                            ctx.lineTo(x, y);
                        }
                        ctx.lineWidth = 2 * Math.random();
                        ctx.stroke();
                    }
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    orbitBot(position = mech.pos) {
        const me = bullet.length;
        bullet[me] = Bodies.polygon(position.x, position.y, 9, 12, {
            isUpgraded: mod.isOrbitBotUpgrade,
            botType: "orbit",
            friction: 0,
            frictionStatic: 0,
            frictionAir: 1,
            isStatic: true,
            isSensor: true,
            restitution: 0,
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 0,
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: 0 //cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            beforeDmg() {},
            onEnd() {
                //reorder orbital bot positions around a circle
                let totalOrbitalBots = 0
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'orbit' && bullet[i] !== this) totalOrbitalBots++
                }
                let index = 0
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'orbit' && bullet[i] !== this) {
                        bullet[i].phase = (index / totalOrbitalBots) * 2 * Math.PI
                        index++
                    }
                }
            },
            range: 190 + 60 * mod.isOrbitBotUpgrade, //range is set in bot upgrade too! //150 + (80 + 100 * mod.isOrbitBotUpgrade) * Math.random(), // + 5 * mod.orbitBotCount,
            orbitalSpeed: 0,
            phase: 2 * Math.PI * Math.random(),
            do() {
                //check for damage
                if (!mech.isCloak && !mech.isBodiesAsleep) { //if time dilation isn't active
                    // q = Matter.Query.point(mob, this.position)
                    // q = Matter.Query.collides(this, mob)
                    const size = 33
                    q = Matter.Query.region(mob, {
                        min: {
                            x: this.position.x - size,
                            y: this.position.y - size
                        },
                        max: {
                            x: this.position.x + size,
                            y: this.position.y + size
                        }
                    })
                    for (let i = 0; i < q.length; i++) {
                        mobs.statusStun(q[i], 180)
                        const dmg = 0.5 * b.dmgScale * (this.isUpgraded ? 2.5 : 1) * (mod.isCrit ? 4 : 1)
                        q[i].damage(dmg);
                        q[i].foundPlayer();
                        game.drawList.push({ //add dmg to draw queue
                            x: this.position.x,
                            y: this.position.y,
                            radius: Math.log(2 * dmg + 1.1) * 40,
                            color: 'rgba(0,0,0,0.4)',
                            time: game.drawTime
                        });
                    }
                }
                //orbit player
                const time = game.cycle * this.orbitalSpeed + this.phase
                const orbit = {
                    x: Math.cos(time),
                    y: Math.sin(time) //*1.1
                }
                Matter.Body.setPosition(this, Vector.add(mech.pos, Vector.mult(orbit, this.range))) //bullets move with player
            }
        })
        // bullet[me].orbitalSpeed = Math.sqrt(0.7 / bullet[me].range)
        bullet[me].orbitalSpeed = Math.sqrt(0.25 / bullet[me].range) //also set in bot upgrade too!
        // bullet[me].phase = (index / mod.orbitBotCount) * 2 * Math.PI
        World.add(engine.world, bullet[me]); //add bullet to world

        //reorder orbital bot positions around a circle
        let totalOrbitalBots = 0
        for (let i = 0; i < bullet.length; i++) {
            if (bullet[i].botType === 'orbit') totalOrbitalBots++
        }
        let index = 0
        for (let i = 0; i < bullet.length; i++) {
            if (bullet[i].botType === 'orbit') {
                bullet[i].phase = (index / totalOrbitalBots) * 2 * Math.PI
                index++
            }
        }
    },
    // **************************************************************************************************
    // **************************************************************************************************
    // ********************************         Guns        *********************************************
    // **************************************************************************************************
    // **************************************************************************************************
    giveGuns(gun = "random", ammoPacks = 10) {
        if (mod.isOneGun) b.removeAllGuns();
        if (gun === "random") {
            //find what guns player doesn't have
            options = []
            for (let i = 0, len = b.guns.length; i < len; i++) {
                if (!b.guns[i].have) options.push(i)
            }
            if (options.length === 0) return
            //randomly pick from list of possible guns
            gun = options[Math.floor(Math.random() * options.length)]
        }
        if (gun === "all") {
            b.activeGun = 0;
            b.inventoryGun = 0;
            for (let i = 0; i < b.guns.length; i++) {
                b.inventory[i] = i;
                b.guns[i].have = true;
                b.guns[i].ammo = Math.floor(b.guns[i].ammoPack * ammoPacks);
            }
        } else {
            if (isNaN(gun)) { //find gun by name
                let found = false;
                for (let i = 0; i < b.guns.length; i++) {
                    if (gun === b.guns[i].name) {
                        gun = i
                        found = true;
                        break
                    }
                }
                if (!found) return //if no gun found don't give a gun
            }
            if (!b.guns[gun].have) b.inventory.push(gun);
            b.guns[gun].have = true;
            b.guns[gun].ammo = Math.floor(b.guns[gun].ammoPack * ammoPacks);
            if (b.activeGun === null) b.activeGun = gun //if no active gun switch to new gun
        }
        game.makeGunHUD();
    },
    guns: [{
            name: "nail gun",
            description: "use compressed air to fire a stream of <strong>nails</strong><br><strong>delay</strong> after firing <strong>decreases</strong> as you shoot",
            ammo: 0,
            ammoPack: 55,
            defaultAmmoPack: 55,
            recordedAmmo: 0,
            have: false,
            nextFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
            startingHoldCycle: 0,
            fire() {
                let CD
                if (mod.nailFireRate) { //fire delay decreases as you hold fire, down to 3 from 15
                    if (mod.nailInstantFireRate) {
                        CD = 2
                    } else {
                        if (this.nextFireCycle + 1 < mech.cycle) this.startingHoldCycle = mech.cycle //reset if not constantly firing
                        CD = Math.max(7.5 - 0.06 * (mech.cycle - this.startingHoldCycle), 2) //CD scales with cycles fire is held down
                        this.nextFireCycle = mech.cycle + CD * b.fireCD //predict next fire cycle if the fire button is held down
                    }
                } else {
                    if (this.nextFireCycle + 1 < mech.cycle) this.startingHoldCycle = mech.cycle //reset if not constantly firing
                    CD = Math.max(11 - 0.06 * (mech.cycle - this.startingHoldCycle), 2) //CD scales with cycles fire is held down
                    this.nextFireCycle = mech.cycle + CD * b.fireCD //predict next fire cycle if the fire button is held down
                }
                mech.fireCDcycle = mech.cycle + Math.floor(CD * b.fireCD); // cool down
                const speed = 30 + 6 * Math.random() + 9 * mod.nailInstantFireRate
                const angle = mech.angle + (Math.random() - 0.5) * (Math.random() - 0.5) * (mech.crouch ? 1.35 : 3.2) / CD
                if (mod.isIncendiary) {
                    const me = bullet.length;
                    bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 25, 2, {
                        density: 0.0001, //frictionAir: 0.01,			//restitution: 0,
                        angle: angle,
                        friction: 0.5,
                        frictionAir: 0,
                        dmg: 0, //damage done in addition to the damage from momentum
                        endCycle: Math.floor(mech.crouch ? 28 : 13) + Math.random() * 5 + game.cycle,
                        classType: "bullet",
                        collisionFilter: {
                            category: cat.bullet,
                            mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                        },
                        minDmgSpeed: 10,
                        beforeDmg() {
                            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
                        },
                        onEnd() {
                            b.explosion(this.position, 72 + (Math.random() - 0.5) * 30); //makes bullet do explosive damage at end
                        },
                        do() {}
                    });
                    Matter.Body.setVelocity(bullet[me], {
                        x: speed * Math.cos(angle),
                        y: speed * Math.sin(angle)
                    });
                    World.add(engine.world, bullet[me]); //add bullet to world
                } else {
                    const dmg = 0.9
                    b.nail({
                        x: mech.pos.x + 30 * Math.cos(mech.angle),
                        y: mech.pos.y + 30 * Math.sin(mech.angle)
                    }, {
                        x: mech.Vx / 2 + speed * Math.cos(angle),
                        y: mech.Vy / 2 + speed * Math.sin(angle)
                    }, dmg) //position, velocity, damage
                    if (mod.isIceCrystals) {
                        bullet[bullet.length - 1].beforeDmg = function(who) {
                            mobs.statusSlow(who, 30)
                            if (mod.isNailPoison) mobs.statusDoT(who, dmg * 0.22, 120) // one tick every 30 cycles
                            if (mod.isNailCrit && !who.shield && Vector.dot(Vector.normalise(Vector.sub(who.position, this.position)), Vector.normalise(this.velocity)) > 0.99) this.dmg *= 5 //crit if hit near center
                        };

                        if (mech.energy < 0.01) {
                            mech.fireCDcycle = mech.cycle + 60; // cool down
                        } else {
                            mech.energy -= mech.fieldRegen + 0.01
                        }
                    }
                }

            }
        },
        {
            name: "shotgun",
            description: "fire a <strong>burst</strong> of short range <strong> bullets</strong>",
            ammo: 0,
            ammoPack: 5.5,
            defaultAmmoPack: 5.5,
            have: false,
            fire() {
                let knock, spread
                if (mech.crouch) {
                    spread = 0.75
                    mech.fireCDcycle = mech.cycle + Math.floor(55 * b.fireCD); // cool down
                    if (mod.isShotgunImmune) mech.immuneCycle = mech.cycle + Math.floor(58 * b.fireCD); //player is immune to collision damage for 30 cycles
                    knock = 0.01
                } else {
                    mech.fireCDcycle = mech.cycle + Math.floor(45 * b.fireCD); // cool down
                    if (mod.isShotgunImmune) mech.immuneCycle = mech.cycle + Math.floor(47 * b.fireCD); //player is immune to collision damage for 30 cycles
                    spread = 1.3
                    knock = 0.1
                }

                if (mod.isShotgunRecoil) {
                    mech.fireCDcycle -= 0.66 * (45 * b.fireCD)
                    player.force.x -= 2 * knock * Math.cos(mech.angle)
                    player.force.y -= 2 * knock * Math.sin(mech.angle) //reduce knock back in vertical direction to stop super jumps
                } else {
                    player.force.x -= knock * Math.cos(mech.angle)
                    player.force.y -= knock * Math.sin(mech.angle) * 0.3 //reduce knock back in vertical direction to stop super jumps
                }

                b.muzzleFlash(35);
                if (mod.isIncendiary) {
                    const SPEED = mech.crouch ? 35 : 25
                    const END = Math.floor(mech.crouch ? 9 : 6);
                    const totalBullets = 8
                    const angleStep = (mech.crouch ? 0.1 : 0.33) / totalBullets
                    let dir = mech.angle - angleStep * totalBullets / 2;
                    for (let i = 0; i < totalBullets; i++) { //5 -> 7
                        dir += angleStep
                        const me = bullet.length;
                        bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 17, 4, b.fireAttributes(dir));
                        const end = END + Math.random() * 3
                        bullet[me].endCycle = 2 * end + game.cycle
                        const speed = SPEED * end / END
                        const dirOff = dir + 0.15 * (Math.random() - 0.5)
                        Matter.Body.setVelocity(bullet[me], {
                            x: speed * Math.cos(dirOff),
                            y: speed * Math.sin(dirOff)
                        });
                        bullet[me].onEnd = function() {
                            b.explosion(this.position, 60 + (Math.random() - 0.5) * 40); //makes bullet do explosive damage at end
                        }
                        bullet[me].beforeDmg = function() {
                            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
                        };
                        bullet[me].do = function() {}
                        World.add(engine.world, bullet[me]); //add bullet to world
                    }
                    // for (let i = 0; i < totalBullets; i++) { //5 -> 7
                    //     dir += angleStep
                    //     const me = bullet.length;
                    //     bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 17, 4, b.fireAttributes(dir));
                    //     World.add(engine.world, bullet[me]); //add bullet to world
                    //     Matter.Body.setVelocity(bullet[me], {
                    //         x: (SPEED + 15 * Math.random() - 2 * i) * Math.cos(dir),
                    //         y: (SPEED + 15 * Math.random() - 2 * i) * Math.sin(dir)
                    //     });
                    //     bullet[me].endCycle = 2 * i + END
                    //     bullet[me].restitution = 0;
                    //     bullet[me].friction = 1;
                    //     bullet[me].onEnd = function() {
                    //         b.explosion(this.position, (mech.crouch ? 95 : 75) + (Math.random() - 0.5) * 50); //makes bullet do explosive damage at end
                    //     }
                    //     bullet[me].beforeDmg = function() {
                    //         this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
                    //     };
                    //     bullet[me].do = function() {
                    //         // this.force.y += this.mass * 0.0004;
                    //     }
                    // }

                } else if (mod.isNailShot) {
                    for (let i = 0; i < 14; i++) {
                        const dir = mech.angle + (Math.random() - 0.5) * spread * 0.2
                        const pos = {
                            x: mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5),
                            y: mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5)
                        }
                        speed = 35 + 15 * Math.random()
                        const velocity = {
                            x: speed * Math.cos(dir),
                            y: speed * Math.sin(dir)
                        }
                        b.nail(pos, velocity, 1.2)
                    }
                } else {
                    const side = 22
                    for (let i = 0; i < 17; i++) {
                        const me = bullet.length;
                        const dir = mech.angle + (Math.random() - 0.5) * spread
                        bullet[me] = Bodies.rectangle(mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5), mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5), side, side, b.fireAttributes(dir));
                        World.add(engine.world, bullet[me]); //add bullet to world
                        const SPEED = 52 + Math.random() * 8
                        Matter.Body.setVelocity(bullet[me], {
                            x: SPEED * Math.cos(dir),
                            y: SPEED * Math.sin(dir)
                        });
                        bullet[me].endCycle = game.cycle + 40
                        bullet[me].minDmgSpeed = 15
                        // bullet[me].restitution = 0.4
                        bullet[me].frictionAir = 0.034;
                        bullet[me].do = function() {
                            if (!mech.isBodiesAsleep) {
                                const scale = 1 - 0.034 / mod.isBulletsLastLonger
                                Matter.Body.scale(this, scale, scale);
                            }
                        };
                    }
                }
            }
        },
        {
            name: "super balls",
            description: "fire <strong>four</strong> balls in a wide arc<br>balls <strong>bounce</strong> with no momentum loss",
            ammo: 0,
            ammoPack: 12,
            have: false,
            num: 5,
            fire() {
                const SPEED = mech.crouch ? 43 : 32
                mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 25 : 18) * b.fireCD); // cool down
                if (mod.oneSuperBall) {
                    let dir = mech.angle
                    const me = bullet.length;
                    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 20 * mod.bulletSize, b.fireAttributes(dir, false));
                    World.add(engine.world, bullet[me]); //add bullet to world
                    Matter.Body.setVelocity(bullet[me], {
                        x: SPEED * Math.cos(dir),
                        y: SPEED * Math.sin(dir)
                    });
                    // Matter.Body.setDensity(bullet[me], 0.0001);
                    bullet[me].endCycle = game.cycle + Math.floor(300 + 60 * Math.random());
                    bullet[me].minDmgSpeed = 0;
                    bullet[me].restitution = 1;
                    bullet[me].friction = 0;
                    bullet[me].do = function() {
                        this.force.y += this.mass * 0.0012;
                    };
                    bullet[me].beforeDmg = function(who) {
                        mobs.statusStun(who, 180) // (2.3) * 2 / 14 ticks (2x damage over 7 seconds)
                        if (mod.isIncendiary) {
                            b.explosion(this.position, this.mass * 250); //makes bullet do explosive damage at end
                            this.endCycle = 0
                        }
                    };
                } else {
                    b.muzzleFlash(20);
                    const SPREAD = mech.crouch ? 0.08 : 0.15
                    let dir = mech.angle - SPREAD * (mod.superBallNumber - 1) / 2;
                    for (let i = 0; i < mod.superBallNumber; i++) {
                        const me = bullet.length;
                        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 7.5 * mod.bulletSize, b.fireAttributes(dir, false));
                        World.add(engine.world, bullet[me]); //add bullet to world
                        Matter.Body.setVelocity(bullet[me], {
                            x: SPEED * Math.cos(dir),
                            y: SPEED * Math.sin(dir)
                        });
                        // Matter.Body.setDensity(bullet[me], 0.0001);
                        bullet[me].endCycle = game.cycle + Math.floor((300 + 60 * Math.random()) * mod.isBulletsLastLonger);
                        bullet[me].minDmgSpeed = 0;
                        bullet[me].restitution = 0.99;
                        bullet[me].friction = 0;
                        bullet[me].do = function() {
                            this.force.y += this.mass * 0.001;
                        };
                        bullet[me].beforeDmg = function() {
                            if (mod.isIncendiary) {
                                b.explosion(this.position, this.mass * 330 + 40 * Math.random()); //makes bullet do explosive damage at end
                                this.endCycle = 0
                            }
                        };
                        dir += SPREAD;
                    }
                }
            }
        },
        {
            name: "flechettes",
            description: "fire a volley of <strong class='color-p'>uranium-235</strong> <strong>needles</strong><br>does <strong class='color-p'>radioactive</strong> <strong class='color-d'>damage</strong> over <strong>3</strong> seconds",
            ammo: 0,
            ammoPack: 55,
            defaultAmmoPack: 55,
            have: false,
            count: 0, //used to track how many shots are in a volley before a big CD
            lastFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
            fire() {
                function makeFlechette(angle = mech.angle + 0.02 * (Math.random() - 0.5)) {
                    const me = bullet.length;
                    bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(mech.angle), mech.pos.y + 40 * Math.sin(mech.angle), 45, 1.4, b.fireAttributes(angle));
                    bullet[me].collisionFilter.mask = mod.pierce ? 0 : cat.body; //cat.mobShield | //cat.map | cat.body |
                    Matter.Body.setDensity(bullet[me], 0.00001); //0.001 is normal
                    bullet[me].endCycle = game.cycle + 180;
                    bullet[me].dmg = 0;
                    bullet[me].immuneList = []
                    bullet[me].do = function() {
                        const whom = Matter.Query.collides(this, mob)
                        if (whom.length && this.speed > 20) { //if touching a mob 
                            who = whom[0].bodyA
                            if (who && who.mob) {
                                if (mod.pierce) {
                                    let immune = false
                                    for (let i = 0; i < this.immuneList.length; i++) {
                                        if (this.immuneList[i] === who.id) immune = true
                                    }
                                    if (!immune) {
                                        this.immuneList.push(who.id)
                                        who.foundPlayer();
                                        if (mod.isFastDot) {
                                            mobs.statusDoT(who, 4, 30)
                                        } else {
                                            mobs.statusDoT(who, 0.66, mod.isSlowDot ? 360 : 180)
                                        }
                                        game.drawList.push({ //add dmg to draw queue
                                            x: this.position.x,
                                            y: this.position.y,
                                            radius: 40,
                                            color: "rgba(0,80,80,0.3)",
                                            time: game.drawTime
                                        });
                                    }
                                } else {
                                    this.endCycle = 0;
                                    if (mod.isFlechetteExplode && !who.shield && Vector.dot(Vector.normalise(Vector.sub(who.position, this.position)), Vector.normalise(this.velocity)) > 0.975) {
                                        // mobs.statusStun(who, 120)
                                        this.explodeRad = 300 + 60 * Math.random();
                                        b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                                    }
                                    who.foundPlayer();
                                    if (mod.isFastDot) {
                                        mobs.statusDoT(who, 3.78, 30)
                                    } else {
                                        mobs.statusDoT(who, 0.63, mod.isSlowDot ? 360 : 180)
                                    }
                                    game.drawList.push({ //add dmg to draw queue
                                        x: this.position.x,
                                        y: this.position.y,
                                        radius: 40,
                                        color: "rgba(0,80,80,0.3)",
                                        time: game.drawTime
                                    });
                                }
                            }
                        } else if (Matter.Query.collides(this, map).length) { //stick in walls
                            this.collisionFilter.mask = 0;
                            Matter.Body.setAngularVelocity(this, 0)
                            Matter.Body.setVelocity(this, {
                                x: 0,
                                y: 0
                            });
                            this.do = function() {}
                        } else if (this.speed < 30) {
                            this.force.y += this.mass * 0.0007; //no gravity until it slows down to improve aiming
                        }
                    };
                    const SPEED = 50
                    Matter.Body.setVelocity(bullet[me], {
                        x: mech.Vx / 2 + SPEED * Math.cos(angle),
                        y: mech.Vy / 2 + SPEED * Math.sin(angle)
                    });
                    World.add(engine.world, bullet[me]); //add bullet to world
                }
                makeFlechette()
                if (mod.isFlechetteMultiShot) {
                    makeFlechette(mech.angle + 0.02 + 0.005 * Math.random())
                    makeFlechette(mech.angle - 0.02 - 0.005 * Math.random())
                }

                const CD = (mech.crouch) ? 60 : 30
                if (this.lastFireCycle + CD < mech.cycle) this.count = 0 //reset count if it cycles past the CD
                this.lastFireCycle = mech.cycle
                if (this.count > ((mech.crouch) ? 7 : 1)) {
                    this.count = 0
                    mech.fireCDcycle = mech.cycle + Math.floor(CD * b.fireCD); // cool down
                    const who = bullet[bullet.length - 1]
                    Matter.Body.setDensity(who, 0.00001);
                } else {
                    this.count++
                    mech.fireCDcycle = mech.cycle + Math.floor(2 * b.fireCD); // cool down
                }
            }
        },
        {
            name: "wave beam",
            description: "emit a <strong>sine wave</strong> of oscillating particles<br>propagates through <strong>walls</strong>",
            ammo: 0,
            ammoPack: 70,
            have: false,
            fire() {
                mech.fireCDcycle = mech.cycle + Math.floor(3 * b.fireCD); // cool down
                const dir = mech.angle
                const SPEED = 10
                let wiggleMag
                if (mod.waveHelix === 2) {
                    wiggleMag = (mech.crouch ? 6 : 12) * (1 + Math.sin(mech.cycle * 0.1))
                } else {
                    wiggleMag = mech.crouch ? 6 : 12
                }
                // const wiggleMag = mod.waveHelix ? (mech.crouch ? 6 + 6 * Math.sin(mech.cycle * 0.1) : 13 + 13 * Math.sin(mech.cycle * 0.1)) : (mech.crouch ? 6 : 12)
                const size = 5 * (mod.waveHelix === 1 ? 1 : 0.7)
                for (let i = 0; i < mod.waveHelix; i++) {
                    const me = bullet.length;
                    bullet[me] = Bodies.polygon(mech.pos.x + 25 * Math.cos(dir), mech.pos.y + 25 * Math.sin(dir), 7, size, {
                        angle: dir,
                        cycle: -0.5,
                        endCycle: game.cycle + Math.floor((mod.isWaveReflect ? 600 : 120) * mod.isBulletsLastLonger),
                        inertia: Infinity,
                        frictionAir: 0,
                        slow: 0,
                        minDmgSpeed: 0,
                        dmg: 0,
                        isJustReflected: false,
                        classType: "bullet",
                        collisionFilter: {
                            category: 0,
                            mask: 0, //cat.mob | cat.mobBullet | cat.mobShield
                        },
                        beforeDmg() {},
                        onEnd() {},
                        do() {
                            if (!mech.isBodiesAsleep) {
                                if (mod.isWaveReflect) {
                                    // check if inside a mob
                                    q = Matter.Query.point(mob, this.position)
                                    for (let i = 0; i < q.length; i++) {
                                        let dmg = b.dmgScale * 0.4 / Math.sqrt(q[i].mass) * (mod.waveHelix === 1 ? 1 : 0.8) //1 - 0.4 = 0.6 for helix mod 40% damage reduction
                                        q[i].damage(dmg);
                                        q[i].foundPlayer();
                                        game.drawList.push({ //add dmg to draw queue
                                            x: this.position.x,
                                            y: this.position.y,
                                            radius: Math.log(2 * dmg + 1.1) * 40,
                                            color: 'rgba(0,0,0,0.4)',
                                            time: game.drawTime
                                        });
                                    }
                                    Matter.Body.setPosition(this, Vector.add(this.position, player.velocity)) //bullets move with player
                                    const sub = Vector.sub(this.position, mech.pos)
                                    const range = 558 //93 * x
                                    if (Vector.magnitude(sub) > range) {
                                        // Matter.Body.setPosition(this, Vector.sub(this.position, Vector.mult(Vector.normalise(sub), 2 * range))) //teleport to opposite side
                                        Matter.Body.setVelocity(this, Vector.mult(this.velocity, -1));
                                        Matter.Body.setPosition(this, Vector.add(mech.pos, Vector.mult(Vector.normalise(sub), range))) //reflect
                                    }
                                } else {
                                    let slowCheck = 1
                                    if (Matter.Query.point(map, this.position).length) { //check if inside map
                                        slowCheck = mod.waveSpeedMap
                                    } else { //check if inside a body
                                        let q = Matter.Query.point(body, this.position)
                                        if (q.length) {
                                            slowCheck = mod.waveSpeedBody
                                            Matter.Body.setPosition(this, Vector.add(this.position, q[0].velocity)) //move with the medium
                                        } else { // check if inside a mob
                                            q = Matter.Query.point(mob, this.position)
                                            for (let i = 0; i < q.length; i++) {
                                                slowCheck = 0.3;
                                                Matter.Body.setPosition(this, Vector.add(this.position, q[i].velocity)) //move with the medium
                                                let dmg = b.dmgScale * 0.4 / Math.sqrt(q[i].mass) * (mod.waveHelix === 1 ? 1 : 0.8) //1 - 0.4 = 0.6 for helix mod 40% damage reduction
                                                q[i].damage(dmg);
                                                q[i].foundPlayer();
                                                game.drawList.push({ //add dmg to draw queue
                                                    x: this.position.x,
                                                    y: this.position.y,
                                                    radius: Math.log(2 * dmg + 1.1) * 40,
                                                    color: 'rgba(0,0,0,0.4)',
                                                    time: game.drawTime
                                                });
                                            }
                                        }
                                    }
                                    if (slowCheck !== this.slow) { //toggle velocity based on inside and outside status change
                                        this.slow = slowCheck
                                        Matter.Body.setVelocity(this, Vector.mult(Vector.normalise(this.velocity), SPEED * slowCheck));
                                    }
                                }
                                this.cycle++
                                const wiggle = Vector.mult(transverse, wiggleMag * Math.cos(this.cycle * 0.35) * ((i % 2) ? -1 : 1))
                                Matter.Body.setPosition(this, Vector.add(this.position, wiggle))
                            }
                            // if (mod.isWaveReflect) { //single reflection
                            //   const sub = Vector.sub(this.position, mech.pos)
                            //   if (Vector.magnitude(sub) > 630) {
                            //     // Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(Vector.normalise(sub), -2 * POCKET_RANGE))) //teleport to opposite side
                            //     if (!this.isJustReflected) {
                            //       Matter.Body.setVelocity(this, Vector.mult(this.velocity, -1)); //reflect
                            //       this.isJustReflected = true;
                            //     }
                            //   }
                            // }

                            // if (mod.isWaveReflect) {
                            //   Matter.Body.setPosition(this, Vector.add(this.position, player.velocity))  //bullets move with player

                            // Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(Vector.normalise(sub), -2 * POCKET_RANGE))) //teleport to opposite side

                            // const sub = Vector.sub(this.position, mech.pos)
                            // if (Vector.magnitude(sub) > 630) {  
                            //   if (!this.isJustReflected) {
                            //     Matter.Body.setVelocity(this, Vector.mult(this.velocity, -1)); //reflect
                            //     this.isJustReflected = true;
                            //   }
                            // } else {
                            //   this.isJustReflected = false
                            // }
                            // }
                        }
                    });
                    World.add(engine.world, bullet[me]); //add bullet to world
                    Matter.Body.setVelocity(bullet[me], {
                        x: SPEED * Math.cos(dir),
                        y: SPEED * Math.sin(dir)
                    });
                    const transverse = Vector.normalise(Vector.perp(bullet[me].velocity))
                }
            }
        },
        {
            name: "missiles",
            description: "launch missiles that <strong>accelerate</strong> towards <strong>mobs</strong><br><strong class='color-e'>explodes</strong> when near target",
            ammo: 0,
            ammoPack: 3.3,
            have: false,
            fireCycle: 0,
            ammoLoaded: 0,
            fire() {
                //missile(where, dir, speed, size = 1, spawn = 0) {
                if (mod.is3Missiles) {
                    if (mech.crouch) {
                        mech.fireCDcycle = mech.cycle + 17 * b.fireCD; // cool down
                        for (let i = 0; i < 3; i++) {
                            b.missile({
                                x: mech.pos.x,
                                y: mech.pos.y - 40
                            }, -Math.PI / 2 + 0.08 * (1 - i) + 0.3 * (Math.random() - 0.5), 0, 0.7, mod.recursiveMissiles)
                            bullet[bullet.length - 1].force.x -= 0.015 * (i - 1);
                        }
                    } else {
                        mech.fireCDcycle = mech.cycle + 55 * b.fireCD; // cool down
                        const direction = {
                            x: Math.cos(mech.angle),
                            y: Math.sin(mech.angle)
                        }
                        const push = Vector.mult(Vector.perp(direction), 0.02)
                        for (let i = 0; i < 3; i++) {
                            b.missile({
                                x: mech.pos.x + 40 * direction.x,
                                y: mech.pos.y + 40 * direction.y
                            }, mech.angle + 0.06 * (Math.random() - 0.5), 5, 0.7, mod.recursiveMissiles)
                            bullet[bullet.length - 1].force.x += push.x * (i - 1);
                            bullet[bullet.length - 1].force.y += push.y * (i - 1);
                        }
                    }
                } else {
                    if (mech.crouch) {
                        mech.fireCDcycle = mech.cycle + 17 * b.fireCD; // cool down
                        const off = Math.random() - 0.5
                        b.missile({
                                x: mech.pos.x,
                                y: mech.pos.y - 40
                            },
                            -Math.PI / 2 + 0.15 * off, 0, 1, mod.recursiveMissiles)
                        bullet[bullet.length - 1].force.x += off * 0.03;
                        // bullet[bullet.length - 1].force.y += push.y * (i - 1);
                    } else {
                        mech.fireCDcycle = mech.cycle + 55 * b.fireCD; // cool down
                        b.missile({
                                x: mech.pos.x + 40 * Math.cos(mech.angle),
                                y: mech.pos.y + 40 * Math.sin(mech.angle) - 3
                            },
                            mech.angle + (0.5 - Math.random()) * (mech.crouch ? 0 : 0.2), 20, 1, mod.recursiveMissiles)
                        // bullet[bullet.length - 1].force.y += 0.01; //a small push down at first to make it seem like the missile is briefly falling
                    }

                }
            }
        },
        // {
        //     name: "flak",
        //     description: "fire a <strong>cluster</strong> of short range <strong>projectiles</strong><br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after half a second",
        //     ammo: 0,
        //     ammoPack: 4,
        //     defaultAmmoPack: 4, //use to revert ammoPack after mod changes drop rate
        //     have: false,
        //     fire() {
        //         mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 25 : 10) * b.fireCD); // cool down
        //         b.muzzleFlash(30);
        //         const SPEED = mech.crouch ? 29 : 25
        //         const END = Math.floor(mech.crouch ? 30 : 18);
        //         const side1 = 17
        //         const side2 = 4
        //         const totalBullets = 6
        //         const angleStep = (mech.crouch ? 0.06 : 0.25) / totalBullets
        //         let dir = mech.angle - angleStep * totalBullets / 2;
        //         for (let i = 0; i < totalBullets; i++) { //5 -> 7
        //             dir += angleStep
        //             const me = bullet.length;
        //             bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), side1, side2, b.fireAttributes(dir));
        //             World.add(engine.world, bullet[me]); //add bullet to world
        //             Matter.Body.setVelocity(bullet[me], {
        //                 x: (SPEED + 15 * Math.random() - 2 * i) * Math.cos(dir),
        //                 y: (SPEED + 15 * Math.random() - 2 * i) * Math.sin(dir)
        //             });
        //             bullet[me].endCycle = 2 * i + game.cycle + END
        //             bullet[me].restitution = 0;
        //             bullet[me].friction = 1;
        //             bullet[me].explodeRad = (mech.crouch ? 95 : 75) + (Math.random() - 0.5) * 50;
        //             bullet[me].onEnd = function() {
        //                 b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
        //             }
        //             bullet[me].beforeDmg = function() {
        //                 this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
        //             };
        //             bullet[me].do = function() {
        //                 // this.force.y += this.mass * 0.0004;
        //             }
        //         }
        //     }
        // },
        {
            name: "grenades",
            description: "lob a single <strong>bouncy</strong> projectile<br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after one second",
            ammo: 0,
            ammoPack: 5,
            have: false,
            fire() {

            },
            fireNormal() {
                const me = bullet.length;
                const dir = mech.angle; // + Math.random() * 0.05;
                bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 15, b.fireAttributes(dir, false));
                Matter.Body.setDensity(bullet[me], 0.0005);
                bullet[me].explodeRad = 275;
                bullet[me].onEnd = function() {
                    b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                    if (mod.grenadeFragments) b.targetedNail(this.position, mod.grenadeFragments)
                }
                bullet[me].minDmgSpeed = 1;
                bullet[me].beforeDmg = function() {
                    this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
                };
                if (mod.isRPG) {
                    b.fireProps(35, mech.crouch ? 60 : -15, dir, me); //cd , speed
                    bullet[me].endCycle = game.cycle + 70;
                    bullet[me].frictionAir = 0.07;
                    const MAG = 0.015
                    bullet[me].thrust = {
                        x: bullet[me].mass * MAG * Math.cos(dir),
                        y: bullet[me].mass * MAG * Math.sin(dir)
                    }
                    bullet[me].do = function() {
                        this.force.x += this.thrust.x;
                        this.force.y += this.thrust.y;
                        if (Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length) {
                            this.endCycle = 0; //explode if touching map or blocks
                        }
                    };
                } else {
                    b.fireProps(mech.crouch ? 40 : 30, mech.crouch ? 43 : 32, dir, me); //cd , speed
                    bullet[me].endCycle = game.cycle + Math.floor(mech.crouch ? 120 : 80);
                    bullet[me].restitution = 0.4;
                    bullet[me].do = function() {
                        this.force.y += this.mass * 0.0025; //extra gravity for harder arcs
                    };
                }
            },
            fireNeutron() {
                const me = bullet.length;
                const dir = mech.angle;
                bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 10, 4, b.fireAttributes(dir, false));
                b.fireProps(mech.crouch ? 45 : 25, mech.crouch ? 35 : 20, dir, me); //cd , speed
                Matter.Body.setDensity(bullet[me], 0.000001);
                bullet[me].endCycle = Infinity;
                bullet[me].frictionAir = 0;
                bullet[me].friction = 1;
                bullet[me].frictionStatic = 1;
                bullet[me].restitution = 0;
                bullet[me].minDmgSpeed = 0;
                bullet[me].damageRadius = 100;
                bullet[me].maxDamageRadius = 450 + 130 * mod.isNeutronSlow + 130 * mod.isNeutronImmune //+ 150 * Math.random()
                bullet[me].radiusDecay = (0.81 + 0.15 * mod.isNeutronSlow + 0.15 * mod.isNeutronImmune) / mod.isBulletsLastLonger
                bullet[me].stuckTo = null;
                bullet[me].stuckToRelativePosition = null;
                bullet[me].vacuumSlow = 0.97;
                bullet[me].beforeDmg = function() {};
                bullet[me].stuck = function() {};
                bullet[me].do = function() {
                    function onCollide(that) {
                        that.collisionFilter.mask = 0; //non collide with everything
                        Matter.Body.setVelocity(that, {
                            x: 0,
                            y: 0
                        });
                        that.do = that.radiationMode;
                    }

                    const mobCollisions = Matter.Query.collides(this, mob)
                    if (mobCollisions.length) {
                        onCollide(this)
                        this.stuckTo = mobCollisions[0].bodyA
                        mobs.statusDoT(this.stuckTo, 0.5, 360) //apply radiation damage status effect on direct hits

                        if (this.stuckTo.isVerticesChange) {
                            this.stuckToRelativePosition = {
                                x: 0,
                                y: 0
                            }
                        } else {
                            //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                            this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
                        }
                        this.stuck = function() {
                            if (this.stuckTo && this.stuckTo.alive) {
                                const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                                Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                                Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
                            } else {
                                this.collisionFilter.mask = cat.map | cat.body | cat.player | cat.mob; //non collide with everything but map
                                this.stuck = function() {
                                    this.force.y += this.mass * 0.001;
                                }
                            }
                        }
                    } else {
                        const bodyCollisions = Matter.Query.collides(this, body)
                        if (bodyCollisions.length) {
                            if (!bodyCollisions[0].bodyA.isNotHoldable) {
                                onCollide(this)
                                this.stuckTo = bodyCollisions[0].bodyA
                                //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                                this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
                            } else {
                                this.do = this.radiationMode;
                            }
                            this.stuck = function() {
                                if (this.stuckTo) {
                                    const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                                    Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                                    // Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
                                } else {
                                    this.force.y += this.mass * 0.001;
                                }
                            }
                        } else {
                            if (Matter.Query.collides(this, map).length) {
                                onCollide(this)
                            } else { //if colliding with nothing just fall
                                this.force.y += this.mass * 0.001;
                            }
                        }
                    }
                }
                bullet[me].radiationMode = function() { //the do code after the bullet is stuck on something,  projects a damaging radiation field
                    this.stuck(); //runs different code based on what the bullet is stuck to
                    if (!mech.isBodiesAsleep) {
                        this.damageRadius = this.damageRadius * 0.85 + 0.15 * this.maxDamageRadius //smooth radius towards max
                        this.maxDamageRadius -= this.radiusDecay
                        if (this.damageRadius < 15) {
                            this.endCycle = 0;
                        } else {
                            //aoe damage to player
                            if (!mod.isNeutronImmune && Vector.magnitude(Vector.sub(player.position, this.position)) < this.damageRadius) {
                                const DRAIN = 0.0023
                                if (mech.energy > DRAIN) {
                                    mech.energy -= DRAIN
                                } else {
                                    mech.energy = 0;
                                    mech.damage(0.00015)
                                }
                            }
                            //aoe damage to mobs
                            for (let i = 0, len = mob.length; i < len; i++) {
                                if (Vector.magnitude(Vector.sub(mob[i].position, this.position)) < this.damageRadius) {
                                    let dmg = b.dmgScale * 0.082
                                    if (Matter.Query.ray(map, mob[i].position, this.position).length > 0) dmg *= 0.25 //reduce damage if a wall is in the way
                                    if (mob[i].shield) dmg *= 4 //x5 to make up for the /5 that shields normally take
                                    mob[i].damage(dmg);
                                    mob[i].locatePlayer();
                                    if (mod.isNeutronSlow) {
                                        Matter.Body.setVelocity(mob[i], {
                                            x: mob[i].velocity.x * this.vacuumSlow,
                                            y: mob[i].velocity.y * this.vacuumSlow
                                        });
                                    }
                                }
                            }
                            ctx.beginPath();
                            ctx.arc(this.position.x, this.position.y, this.damageRadius, 0, 2 * Math.PI);
                            ctx.globalCompositeOperation = "lighter"
                            ctx.fillStyle = `rgba(25,139,170,${0.2+0.06*Math.random()})`;
                            ctx.fill();
                            ctx.globalCompositeOperation = "source-over"
                            if (mod.isNeutronSlow) {
                                const that = this

                                function slow(who, radius = that.explodeRad * 3.2) {
                                    for (i = 0, len = who.length; i < len; i++) {
                                        const sub = Vector.sub(that.position, who[i].position);
                                        const dist = Vector.magnitude(sub);
                                        if (dist < radius) {
                                            Matter.Body.setVelocity(who[i], {
                                                x: who[i].velocity.x * that.vacuumSlow,
                                                y: who[i].velocity.y * that.vacuumSlow
                                            });
                                        }
                                    }
                                }
                                slow(body, this.damageRadius)
                                slow([player], this.damageRadius)
                            }
                        }
                    }
                }
            },
            fireVacuum() {
                const me = bullet.length;
                const dir = mech.angle; // + Math.random() * 0.05;
                bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20, b.fireAttributes(dir, false));
                Matter.Body.setDensity(bullet[me], 0.0003);
                bullet[me].explodeRad = 350 + Math.floor(Math.random() * 50);;
                bullet[me].onEnd = function() {
                    b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                    if (mod.grenadeFragments) b.targetedNail(this.position, mod.grenadeFragments)
                }
                bullet[me].beforeDmg = function() {};
                const cd = mech.crouch ? 90 : 75
                b.fireProps(cd, mech.crouch ? 46 : 35, dir, me); //cd , speed
                bullet[me].endCycle = game.cycle + cd;
                bullet[me].restitution = 0.4;
                bullet[me].do = function() {
                    this.force.y += this.mass * 0.0025; //extra gravity for harder arcs

                    const suckCycles = 40
                    if (game.cycle > this.endCycle - suckCycles) { //suck
                        const that = this

                        function suck(who, radius = that.explodeRad * 3.2) {
                            for (i = 0, len = who.length; i < len; i++) {
                                const sub = Vector.sub(that.position, who[i].position);
                                const dist = Vector.magnitude(sub);
                                if (dist < radius && dist > 150) {
                                    knock = Vector.mult(Vector.normalise(sub), mag * who[i].mass / Math.sqrt(dist));
                                    who[i].force.x += knock.x;
                                    who[i].force.y += knock.y;
                                }
                            }
                        }
                        let mag = 0.1
                        if (game.cycle > this.endCycle - 5) {
                            mag = -0.22
                            suck(mob, this.explodeRad * 3)
                            suck(body, this.explodeRad * 2)
                            suck(powerUp, this.explodeRad * 1.5)
                            suck(bullet, this.explodeRad * 1.5)
                            suck([player], this.explodeRad * 1.3)
                        } else {
                            mag = 0.11
                            suck(mob, this.explodeRad * 3)
                            suck(body, this.explodeRad * 2)
                            suck(powerUp, this.explodeRad * 1.5)
                            suck(bullet, this.explodeRad * 1.5)
                            suck([player], this.explodeRad * 1.3)
                        }
                        //keep bomb in place
                        Matter.Body.setVelocity(this, {
                            x: 0,
                            y: 0
                        });
                        //draw suck
                        const radius = 2.75 * this.explodeRad * (this.endCycle - game.cycle) / suckCycles
                        ctx.fillStyle = "rgba(0,0,0,0.1)";
                        ctx.beginPath();
                        ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
                        ctx.fill();
                    }
                };
            }
        },
        {
            name: "mine",
            description: "toss a <strong>proximity</strong> mine that <strong>sticks</strong> to walls<br>fires <strong>nails</strong> at mobs within range",
            ammo: 0,
            ammoPack: 2.7,
            have: false,
            fire() {
                const pos = {
                    x: mech.pos.x + 30 * Math.cos(mech.angle),
                    y: mech.pos.y + 30 * Math.sin(mech.angle)
                }
                let speed = mech.crouch ? 36 : 22
                if (Matter.Query.point(map, pos).length > 0) { //don't fire if mine will spawn inside map
                    speed = -2
                }
                b.mine(pos, {
                    x: speed * Math.cos(mech.angle),
                    y: speed * Math.sin(mech.angle)
                }, 0, mod.isMineAmmoBack)
                mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 50 : 25) * b.fireCD); // cool down
            }
        },
        {
            name: "spores",
            description: "fire a <strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> that discharges <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> seek out nearby mobs",
            ammo: 0,
            ammoPack: 3,
            have: false,
            fire() {
                const me = bullet.length;
                const dir = mech.angle;
                bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20, 4.5, b.fireAttributes(dir, false));
                b.fireProps(mech.crouch ? 50 : 30, mech.crouch ? 30 : 16, dir, me); //cd , speed
                Matter.Body.setDensity(bullet[me], 0.000001);
                bullet[me].endCycle = Infinity;
                bullet[me].frictionAir = 0;
                bullet[me].friction = 0.5;
                bullet[me].radius = 4.5;
                bullet[me].maxRadius = 30;
                bullet[me].restitution = 0.3;
                bullet[me].minDmgSpeed = 0;
                bullet[me].totalSpores = 8 + 2 * mod.isFastSpores + 2 * mod.isSporeFreeze
                bullet[me].stuck = function() {};
                bullet[me].beforeDmg = function() {};
                bullet[me].do = function() {
                    function onCollide(that) {
                        that.collisionFilter.mask = 0; //non collide with everything
                        Matter.Body.setVelocity(that, {
                            x: 0,
                            y: 0
                        });
                        that.do = that.grow;
                    }

                    const mobCollisions = Matter.Query.collides(this, mob)
                    if (mobCollisions.length) {
                        onCollide(this)
                        this.stuckTo = mobCollisions[0].bodyA

                        if (this.stuckTo.isVerticesChange) {
                            this.stuckToRelativePosition = {
                                x: 0,
                                y: 0
                            }
                        } else {
                            //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                            this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
                        }
                        this.stuck = function() {
                            if (this.stuckTo && this.stuckTo.alive) {
                                const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                                Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                                Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
                            } else {
                                this.collisionFilter.mask = cat.map; //non collide with everything but map
                                this.stuck = function() {
                                    this.force.y += this.mass * 0.0006;
                                }
                            }
                        }
                    } else {
                        const bodyCollisions = Matter.Query.collides(this, body)
                        if (bodyCollisions.length) {
                            if (!bodyCollisions[0].bodyA.isNotHoldable) {
                                onCollide(this)
                                this.stuckTo = bodyCollisions[0].bodyA
                                //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                                this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
                            } else {
                                this.do = this.grow;
                            }
                            this.stuck = function() {
                                if (this.stuckTo) {
                                    const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                                    Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                                    // Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
                                } else {
                                    this.force.y += this.mass * 0.0006;
                                }
                            }
                        } else {
                            if (Matter.Query.collides(this, map).length) {
                                onCollide(this)
                            } else { //if colliding with nothing just fall
                                this.force.y += this.mass * 0.0006;
                            }
                        }
                    }
                    //draw green glow
                    ctx.fillStyle = "rgba(0,200,125,0.16)";
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.maxRadius, 0, 2 * Math.PI);
                    ctx.fill();
                }

                bullet[me].grow = function() {
                    this.stuck(); //runs different code based on what the bullet is stuck to
                    if (!mech.isBodiesAsleep) {
                        let scale = 1.01
                        if (mod.isSporeGrowth && !(game.cycle % 60)) { //release a spore
                            b.spore(this.position)
                            // this.totalSpores--
                            scale = 0.94
                            if (this.stuckTo && this.stuckTo.alive) scale = 0.88
                            Matter.Body.scale(this, scale, scale);
                            this.radius *= scale
                        } else {
                            if (this.stuckTo && this.stuckTo.alive) scale = 1.03
                            Matter.Body.scale(this, scale, scale);
                            this.radius *= scale
                            if (this.radius > this.maxRadius) this.endCycle = 0;
                        }
                    }

                    // this.force.y += this.mass * 0.00045;

                    //draw green glow
                    ctx.fillStyle = "rgba(0,200,125,0.16)";
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, this.maxRadius, 0, 2 * Math.PI);
                    ctx.fill();
                };

                //spawn bullets on end
                bullet[me].onEnd = function() {
                    const NUM = this.totalSpores
                    for (let i = 0; i < NUM; i++) {
                        b.spore(this.position)
                    }
                }
            }
        },
        {
            name: "drones",
            description: "deploy drones that <strong>crash</strong> into mobs<br>crashes reduce their <strong>lifespan</strong> by 1 second",
            ammo: 0,
            ammoPack: 14,
            have: false,
            fire() {
                if (mech.crouch) {
                    b.drone(45)
                    mech.fireCDcycle = mech.cycle + Math.floor(13 * b.fireCD); // cool down
                } else {
                    b.drone(1)
                    mech.fireCDcycle = mech.cycle + Math.floor(6 * b.fireCD); // cool down
                }
            }
        },
        {
            name: "ice IX",
            description: "synthesize <strong>short-lived</strong> ice crystals<br>crystals <strong>seek</strong> out and <strong class='color-s'>freeze</strong> mobs",
            ammo: 0,
            ammoPack: 64,
            have: false,
            fire() {
                if (mech.crouch) {
                    b.iceIX(10, 0.3)
                    mech.fireCDcycle = mech.cycle + Math.floor(8 * b.fireCD); // cool down
                } else {
                    b.iceIX(2)
                    mech.fireCDcycle = mech.cycle + Math.floor(3 * b.fireCD); // cool down
                }

            }
        },
        {
            name: "foam",
            description: "spray bubbly foam that <strong>sticks</strong> to mobs<br><strong class='color-s'>slows</strong> mobs and does <strong class='color-d'>damage</strong> over time",
            ammo: 0,
            ammoPack: 40,
            have: false,
            fire() {
                mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 20 : 6) * b.fireCD); // cool down
                const radius = (mech.crouch ? 10 + 7 * Math.random() : 4 + 6 * Math.random())
                const dir = mech.angle + 0.2 * (Math.random() - 0.5)
                const position = {
                    x: mech.pos.x + 30 * Math.cos(mech.angle),
                    y: mech.pos.y + 30 * Math.sin(mech.angle)
                }
                const SPEED = 21 - radius * 0.7; //(mech.crouch ? 32 : 20) - radius * 0.7;
                const velocity = {
                    x: SPEED * Math.cos(dir),
                    y: SPEED * Math.sin(dir)
                }
                b.foam(position, velocity, radius)
            }
        },
        {
            name: "rail gun",
            description: "use <strong class='color-f'>energy</strong> to launch a high-speed <strong>dense</strong> rod<br><strong>hold</strong> left mouse to charge, <strong>release</strong> to fire",
            ammo: 0,
            ammoPack: 3.15,
            have: false,
            fire() {
                function pushAway(range) { //push away blocks when firing
                    for (let i = 0, len = mob.length; i < len; ++i) {
                        const SUB = Vector.sub(mob[i].position, mech.pos)
                        const DISTANCE = Vector.magnitude(SUB)
                        if (DISTANCE < range) {
                            const DEPTH = Math.min(range - DISTANCE, 1500)
                            const FORCE = Vector.mult(Vector.normalise(SUB), 0.001 * Math.sqrt(DEPTH) * mob[i].mass)
                            mob[i].force.x += FORCE.x;
                            mob[i].force.y += FORCE.y;
                            if (mod.isRailAreaDamage) {
                                mob[i].force.x += 2 * FORCE.x;
                                mob[i].force.y += 2 * FORCE.y;
                                const damage = b.dmgScale * 0.1 * Math.sqrt(DEPTH)
                                mob[i].damage(damage);
                                mob[i].locatePlayer();
                                game.drawList.push({ //add dmg to draw queue
                                    x: mob[i].position.x,
                                    y: mob[i].position.y,
                                    radius: Math.log(2 * damage + 1.1) * 40,
                                    color: "rgba(100,0,200,0.25)",
                                    time: game.drawTime
                                });
                            }
                        }
                    }
                    for (let i = 0, len = body.length; i < len; ++i) {
                        const SUB = Vector.sub(body[i].position, mech.pos)
                        const DISTANCE = Vector.magnitude(SUB)
                        if (DISTANCE < range) {
                            const DEPTH = Math.min(range - DISTANCE, 500)
                            const FORCE = Vector.mult(Vector.normalise(SUB), 0.002 * Math.sqrt(DEPTH) * body[i].mass)
                            body[i].force.x += FORCE.x;
                            body[i].force.y += FORCE.y - body[i].mass * game.g * 1.5; //kick up a bit to give them some arc
                        }
                    }
                }

                if (mod.isCapacitor) {
                    if (mech.energy > 0.16 || mod.isRailEnergyGain) {
                        mech.energy += 0.16 * (mod.isRailEnergyGain ? 6 : -1)
                        mech.fireCDcycle = mech.cycle + Math.floor(30 * b.fireCD);
                        const me = bullet.length;
                        bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 60, 14, {
                            density: 0.005, //0.001 is normal
                            restitution: 0,
                            frictionAir: 0,
                            angle: mech.angle,
                            dmg: 0, //damage done in addition to the damage from momentum
                            classType: "bullet",
                            collisionFilter: {
                                category: cat.bullet,
                                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                            },
                            minDmgSpeed: 5,
                            endCycle: game.cycle + 140,
                            beforeDmg(who) {
                                if (who.shield) {
                                    for (let i = 0, len = mob.length; i < len; i++) {
                                        if (mob[i].id === who.shieldTargetID) { //apply some knock back to shield mob before shield breaks
                                            Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(this.velocity), 10));
                                            break
                                        }
                                    }
                                    Matter.Body.setVelocity(this, {
                                        x: -0.5 * this.velocity.x,
                                        y: -0.5 * this.velocity.y
                                    });
                                    // Matter.Body.setDensity(this, 0.001);
                                }
                                if (mod.isRailNails && this.speed > 10) {
                                    b.targetedNail(this.position, (Math.min(40, this.speed) - 10) * 0.6) // 0.6 as many nails as the normal rail gun
                                    this.endCycle = 0 //triggers despawn
                                }
                            },
                            onEnd() {},
                            drawCycle: Math.floor(10 * b.fireCD),
                            do() {
                                this.force.y += this.mass * 0.0003; // low gravity that scales with charge
                                if (this.drawCycle > 0) {
                                    this.drawCycle--
                                    //draw magnetic field
                                    const X = mech.pos.x
                                    const Y = mech.pos.y
                                    const unitVector = Vector.normalise(Vector.sub(game.mouseInGame, mech.pos))
                                    const unitVectorPerp = Vector.perp(unitVector)

                                    function magField(mag, arc) {
                                        ctx.moveTo(X, Y);
                                        ctx.bezierCurveTo(
                                            X + unitVector.x * mag, Y + unitVector.y * mag,
                                            X + unitVector.x * mag + unitVectorPerp.x * arc, Y + unitVector.y * mag + unitVectorPerp.y * arc,
                                            X + unitVectorPerp.x * arc, Y + unitVectorPerp.y * arc)
                                        ctx.bezierCurveTo(
                                            X - unitVector.x * mag + unitVectorPerp.x * arc, Y - unitVector.y * mag + unitVectorPerp.y * arc,
                                            X - unitVector.x * mag, Y - unitVector.y * mag,
                                            X, Y)
                                    }
                                    ctx.fillStyle = `rgba(50,0,100,0.05)`;
                                    for (let i = 3; i < 7; i++) {
                                        const MAG = 8 * i * i * (0.93 + 0.07 * Math.random()) * (0.95 + 0.1 * Math.random())
                                        const ARC = 6 * i * i * (0.93 + 0.07 * Math.random()) * (0.95 + 0.1 * Math.random())
                                        ctx.beginPath();
                                        magField(MAG, ARC)
                                        magField(MAG, -ARC)
                                        ctx.fill();
                                    }
                                }
                            }
                        });
                        World.add(engine.world, bullet[me]); //add bullet to world

                        const speed = 67
                        Matter.Body.setVelocity(bullet[me], {
                            x: mech.Vx / 2 + speed * Math.cos(mech.angle),
                            y: mech.Vy / 2 + speed * Math.sin(mech.angle)
                        });

                        //knock back
                        const KNOCK = mech.crouch ? 0.08 : 0.34
                        player.force.x -= KNOCK * Math.cos(mech.angle)
                        player.force.y -= KNOCK * Math.sin(mech.angle) * 0.35 //reduce knock back in vertical direction to stop super jumps

                        pushAway(800)
                    } else {
                        mech.fireCDcycle = mech.cycle + Math.floor(120);
                    }
                } else {
                    const me = bullet.length;
                    bullet[me] = Bodies.rectangle(0, 0, 0.015, 0.0015, {
                        density: 0.008, //0.001 is normal
                        //frictionAir: 0.01,			//restitution: 0,
                        // angle: 0,
                        // friction: 0.5,
                        restitution: 0,
                        frictionAir: 0,
                        dmg: 0, //damage done in addition to the damage from momentum
                        classType: "bullet",
                        collisionFilter: {
                            category: 0,
                            mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                        },
                        minDmgSpeed: 5,
                        beforeDmg(who) {
                            if (who.shield) {
                                for (let i = 0, len = mob.length; i < len; i++) {
                                    if (mob[i].id === who.shieldTargetID) { //apply some knock back to shield mob before shield breaks
                                        Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(this.velocity), 10));
                                        break
                                    }
                                }
                                Matter.Body.setVelocity(this, {
                                    x: -0.5 * this.velocity.x,
                                    y: -0.5 * this.velocity.y
                                });
                                // Matter.Body.setDensity(this, 0.001);
                            }
                            if (mod.isRailNails && this.speed > 10) {
                                b.targetedNail(this.position, Math.min(40, this.speed) - 10)
                                this.endCycle = 0 //triggers despawn
                            }
                        },
                        onEnd() {}
                    });
                    mech.fireCDcycle = Infinity; // cool down
                    World.add(engine.world, bullet[me]); //add bullet to world
                    bullet[me].endCycle = Infinity
                    bullet[me].charge = 0;
                    bullet[me].do = function() {
                        if (mech.energy < 0.005 && !mod.isRailEnergyGain) {
                            mech.energy += 0.05 + this.charge * 0.3
                            mech.fireCDcycle = mech.cycle + 120; // cool down if out of energy
                            this.endCycle = 0;
                            return
                        }

                        if ((!input.fire && this.charge > 0.6)) { //fire on mouse release or on low energy
                            mech.fireCDcycle = mech.cycle + 2; // set fire cool down
                            //normal bullet behavior occurs after firing, overwrites this function
                            this.do = function() {
                                this.force.y += this.mass * 0.0003 / this.charge; // low gravity that scales with charge
                            }

                            Matter.Body.scale(this, 8000, 8000) // show the bullet by scaling it up  (don't judge me...  I know this is a bad way to do it)
                            this.endCycle = game.cycle + 140
                            this.collisionFilter.category = cat.bullet
                            Matter.Body.setPosition(this, {
                                x: mech.pos.x,
                                y: mech.pos.y
                            })
                            Matter.Body.setAngle(this, mech.angle)
                            const speed = 90
                            Matter.Body.setVelocity(this, {
                                x: mech.Vx / 2 + speed * this.charge * Math.cos(mech.angle),
                                y: mech.Vy / 2 + speed * this.charge * Math.sin(mech.angle)
                            });

                            //knock back
                            const KNOCK = ((mech.crouch) ? 0.1 : 0.5) * this.charge * this.charge
                            player.force.x -= KNOCK * Math.cos(mech.angle)
                            player.force.y -= KNOCK * Math.sin(mech.angle) * 0.35 //reduce knock back in vertical direction to stop super jumps
                            pushAway(1200 * this.charge)
                        } else { // charging on mouse down
                            mech.fireCDcycle = Infinity //can't fire until mouse is released
                            const previousCharge = this.charge
                            let smoothRate = 0.98 * (mech.crouch ? 0.99 : 1) * (0.98 + 0.02 * b.fireCD) //small b.fireCD = faster shots, b.fireCD=1 = normal shot,  big b.fireCD = slower chot
                            this.charge = this.charge * smoothRate + 1 * (1 - smoothRate)
                            if (mod.isRailEnergyGain) {
                                mech.energy += (this.charge - previousCharge) * 2 //energy drain is proportional to charge gained, but doesn't stop normal mech.fieldRegen
                            } else {
                                mech.energy -= (this.charge - previousCharge) * 0.33 //energy drain is proportional to charge gained, but doesn't stop normal mech.fieldRegen
                            }
                            //draw targeting
                            let best;
                            let range = 3000
                            const dir = mech.angle
                            const path = [{
                                    x: mech.pos.x + 20 * Math.cos(dir),
                                    y: mech.pos.y + 20 * Math.sin(dir)
                                },
                                {
                                    x: mech.pos.x + range * Math.cos(dir),
                                    y: mech.pos.y + range * Math.sin(dir)
                                }
                            ];
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
                                            if (dist2 < best.dist2) {
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

                            //check for collisions
                            best = {
                                x: null,
                                y: null,
                                dist2: Infinity,
                                who: null,
                                v1: null,
                                v2: null
                            };
                            vertexCollision(path[0], path[1], mob);
                            vertexCollision(path[0], path[1], map);
                            vertexCollision(path[0], path[1], body);
                            if (best.dist2 != Infinity) { //if hitting something
                                path[path.length - 1] = {
                                    x: best.x,
                                    y: best.y
                                };
                            }

                            //draw beam
                            ctx.beginPath();
                            ctx.moveTo(path[0].x, path[0].y);
                            ctx.lineTo(path[1].x, path[1].y);
                            ctx.strokeStyle = `rgba(100,0,180,0.7)`;
                            ctx.lineWidth = this.charge * 1
                            ctx.setLineDash([10, 20]);
                            ctx.stroke();
                            ctx.setLineDash([0, 0]);

                            //draw magnetic field
                            const X = mech.pos.x
                            const Y = mech.pos.y
                            const unitVector = Vector.normalise(Vector.sub(game.mouseInGame, mech.pos))
                            const unitVectorPerp = Vector.perp(unitVector)

                            function magField(mag, arc) {
                                ctx.moveTo(X, Y);
                                ctx.bezierCurveTo(
                                    X + unitVector.x * mag, Y + unitVector.y * mag,
                                    X + unitVector.x * mag + unitVectorPerp.x * arc, Y + unitVector.y * mag + unitVectorPerp.y * arc,
                                    X + unitVectorPerp.x * arc, Y + unitVectorPerp.y * arc)
                                ctx.bezierCurveTo(
                                    X - unitVector.x * mag + unitVectorPerp.x * arc, Y - unitVector.y * mag + unitVectorPerp.y * arc,
                                    X - unitVector.x * mag, Y - unitVector.y * mag,
                                    X, Y)
                            }
                            ctx.fillStyle = `rgba(50,0,100,0.05)`;
                            for (let i = 3; i < 7; i++) {
                                const MAG = 8 * i * i * this.charge * (0.93 + 0.07 * Math.random())
                                const ARC = 6 * i * i * this.charge * (0.93 + 0.07 * Math.random())
                                ctx.beginPath();
                                magField(MAG, ARC)
                                magField(MAG, -ARC)
                                ctx.fill();
                            }
                        }
                    }
                }
            }
        },
        {
            name: "laser",
            description: "emit a <strong>beam</strong> of collimated coherent <strong>light</strong><br>drains <strong class='color-f'>energy</strong> instead of ammunition",
            ammo: 0,
            ammoPack: Infinity,
            have: false,
            nextFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
            fire() {

            },
            chooseFireMethod() {
                if (mod.isPulseLaser) {
                    this.fire = this.firePulse
                } else if (mod.beamSplitter) {
                    this.fire = this.fireSplit
                } else if (mod.historyLaser) {
                    this.fire = this.fireHistory
                } else if (mod.isWideLaser) {
                    this.fire = this.fireWideBeam
                } else {
                    this.fire = this.fireLaser
                }
            },
            fireLaser() {
                if (mech.energy < mod.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + mod.laserFieldDrain * mod.isLaserDiode
                    b.laser();
                }
            },
            fireSplit() {
                if (mech.energy < mod.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + mod.laserFieldDrain * mod.isLaserDiode
                    const divergence = mech.crouch ? 0.15 : 0.2
                    let dmg = 0.1 + mod.laserDamage * Math.pow(0.9, mod.laserDamage)
                    const where = {
                        x: mech.pos.x + 20 * Math.cos(mech.angle),
                        y: mech.pos.y + 20 * Math.sin(mech.angle)
                    }
                    b.laser(where, {
                        x: where.x + 3000 * Math.cos(mech.angle),
                        y: where.y + 3000 * Math.sin(mech.angle)
                    }, dmg)
                    for (let i = 1; i < 1 + mod.beamSplitter; i++) {
                        b.laser(where, {
                            x: where.x + 3000 * Math.cos(mech.angle + i * divergence),
                            y: where.y + 3000 * Math.sin(mech.angle + i * divergence)
                        }, dmg)
                        b.laser(where, {
                            x: where.x + 3000 * Math.cos(mech.angle - i * divergence),
                            y: where.y + 3000 * Math.sin(mech.angle - i * divergence)
                        }, dmg)
                    }
                }
            },
            fireWideBeam() {
                if (mech.energy < mod.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + mod.laserFieldDrain * mod.isLaserDiode
                    const dmg = 0.55 * mod.laserDamage //  3.5 * 0.55 = 200% more damage
                    const wideLaser = function(where = {
                        x: mech.pos.x + 20 * Math.cos(mech.angle),
                        y: mech.pos.y + 20 * Math.sin(mech.angle)
                    }, angle = mech.angle) {
                        ctx.strokeStyle = "#f00";
                        ctx.lineWidth = 8
                        ctx.globalAlpha = 0.5;
                        ctx.beginPath();
                        const off = 7.5
                        b.laser(where, {
                            x: where.x + 3000 * Math.cos(angle),
                            y: where.y + 3000 * Math.sin(angle)
                        }, dmg, 0, true)
                        for (let i = 1; i < mod.wideLaser; i++) {
                            let whereOff = Vector.add(where, {
                                x: i * off * Math.cos(angle + Math.PI / 2),
                                y: i * off * Math.sin(angle + Math.PI / 2)
                            })
                            b.laser(whereOff, {
                                x: whereOff.x + 3000 * Math.cos(angle),
                                y: whereOff.y + 3000 * Math.sin(angle)
                            }, dmg, 0, true)
                            whereOff = Vector.add(where, {
                                x: i * off * Math.cos(angle - Math.PI / 2),
                                y: i * off * Math.sin(angle - Math.PI / 2)
                            })
                            b.laser(whereOff, {
                                x: whereOff.x + 3000 * Math.cos(angle),
                                y: whereOff.y + 3000 * Math.sin(angle)
                            }, dmg, 0, true)
                        }
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    wideLaser();
                }
            },
            fireHistory() {
                if (mech.energy < mod.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + mod.laserFieldDrain * mod.isLaserDiode
                    const dmg = 0.5 * mod.laserDamage //  3.5 * 0.55 = 200% more damage
                    ctx.strokeStyle = "#f00";
                    let spacing, len
                    if (mod.wideLaser === 3) {
                        ctx.lineWidth = 2
                        spacing = 2
                        len = 10 + mod.historyLaser * 5
                    } else if (mod.wideLaser === 4) {
                        ctx.lineWidth = 3
                        spacing = 1
                        len = 15 + mod.historyLaser * 5
                    } else {
                        ctx.lineWidth = 1
                        spacing = 5
                        len = 5 + mod.historyLaser * 5
                    }
                    ctx.beginPath();
                    b.laser({
                        x: mech.pos.x + 20 * Math.cos(mech.angle),
                        y: mech.pos.y + 20 * Math.sin(mech.angle)
                    }, {
                        x: mech.pos.x + 3000 * Math.cos(mech.angle),
                        y: mech.pos.y + 3000 * Math.sin(mech.angle)
                    }, dmg, 0, true);
                    for (let i = 1; i < len; i++) {
                        const history = mech.history[(mech.cycle - i * spacing) % 300]
                        b.laser({
                            x: history.position.x + 20 * Math.cos(history.angle),
                            y: history.position.y + 20 * Math.sin(history.angle)
                        }, {
                            x: history.position.x + 3000 * Math.cos(history.angle),
                            y: history.position.y + 3000 * Math.sin(history.angle)
                        }, dmg, 0, true);
                    }
                    ctx.stroke();
                }
            },
            firePulse() {
                mech.fireCDcycle = mech.cycle + Math.floor((mod.isPulseAim ? 25 : 50) * b.fireCD); // cool down
                let energy = 0.27 * Math.min(mech.energy, 1.5)
                mech.energy -= energy * mod.isLaserDiode
                if (mod.beamSplitter) {
                    energy *= 0.66
                    b.pulse(energy, mech.angle)
                    for (let i = 1; i < 1 + mod.beamSplitter; i++) {
                        energy *= 0.9
                        b.pulse(energy, mech.angle - i * 0.27)
                        b.pulse(energy, mech.angle + i * 0.27)
                    }
                } else {
                    b.pulse(energy, mech.angle)
                }
            },
        },
    ],
    pulse(energy, angle = mech.angle) {
        let best;
        let explosionRange = 1560 * energy
        let range = 3000
        const path = [{
                x: mech.pos.x + 20 * Math.cos(angle),
                y: mech.pos.y + 20 * Math.sin(angle)
            },
            {
                x: mech.pos.x + range * Math.cos(angle),
                y: mech.pos.y + range * Math.sin(angle)
            }
        ];
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
                    if (dist2 < best.dist2 && (!domain[i].mob || domain[i].alive)) {
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
        //check for collisions
        best = {
            x: null,
            y: null,
            dist2: Infinity,
            who: null,
            v1: null,
            v2: null
        };
        if (mod.isPulseAim) { //find mobs in line of sight
            let dist = 2200
            for (let i = 0, len = mob.length; i < len; i++) {
                const newDist = Vector.magnitude(Vector.sub(path[0], mob[i].position))
                if (explosionRange < newDist &&
                    newDist < dist &&
                    Matter.Query.ray(map, path[0], mob[i].position).length === 0 &&
                    Matter.Query.ray(body, path[0], mob[i].position).length === 0) {
                    dist = newDist
                    best.who = mob[i]
                    path[path.length - 1] = mob[i].position
                }
            }
        }
        if (!best.who) {
            vertexCollision(path[0], path[1], mob);
            vertexCollision(path[0], path[1], map);
            vertexCollision(path[0], path[1], body);
            if (best.dist2 != Infinity) { //if hitting something
                path[path.length - 1] = {
                    x: best.x,
                    y: best.y
                };
            }
        }
        if (best.who) b.explosion(path[1], explosionRange, true)

        if (mod.isPulseStun) {
            const range = 100 + 2000 * energy
            for (let i = 0, len = mob.length; i < len; ++i) {
                if (mob[i].alive && !mob[i].isShielded) {
                    dist = Vector.magnitude(Vector.sub(path[1], mob[i].position)) - mob[i].radius;
                    if (dist < range) mobs.statusStun(mob[i], 30 + Math.floor(energy * 60))
                }
            }
        }
        //draw laser beam
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        ctx.lineTo(path[1].x, path[1].y);
        ctx.strokeStyle = "rgba(255,0,0,0.13)"
        ctx.lineWidth = 60 * energy / 0.2
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,0,0,0.2)"
        ctx.lineWidth = 18
        ctx.stroke();
        ctx.strokeStyle = "#f00";
        ctx.lineWidth = 4
        ctx.stroke();

        //draw little dots along the laser path
        const sub = Vector.sub(path[1], path[0])
        const mag = Vector.magnitude(sub)
        for (let i = 0, len = Math.floor(mag * 0.03 * energy / 0.2); i < len; i++) {
            const dist = Math.random()
            game.drawList.push({
                x: path[0].x + sub.x * dist + 13 * (Math.random() - 0.5),
                y: path[0].y + sub.y * dist + 13 * (Math.random() - 0.5),
                radius: 1 + 4 * Math.random(),
                color: "rgba(255,0,0,0.5)",
                time: Math.floor(2 + 33 * Math.random() * Math.random())
            });
        }
    }
};