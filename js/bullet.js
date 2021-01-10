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
                if (tech.isCrouchAmmo && mech.crouch) {
                    if (tech.isCrouchAmmo % 2) {
                        b.guns[b.activeGun].ammo--;
                        simulation.updateGunHUD();
                    }
                    tech.isCrouchAmmo++ //makes the no ammo toggle off and on
                } else {
                    b.guns[b.activeGun].ammo--;
                    simulation.updateGunHUD();
                }
            } else {
                if (tech.isAmmoFromHealth) {
                    if (mech.health > 0.05) {
                        mech.damage(0.05 / mech.harmReduction()); //  /mech.harmReduction() undoes  damage increase from difficulty
                        if (!(tech.isRewindAvoidDeath && mech.energy > 0.66)) { //don't give ammo if CPT triggered
                            for (let i = 0; i < 3; i++) powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
                        }
                    }
                } else {
                    simulation.makeTextLog(`${b.guns[b.activeGun].name}.<span class='color-gun'>ammo</span><span class='color-symbol'>:</span> 0`);
                }
                mech.fireCDcycle = mech.cycle + 30; //fire cooldown        
            }
            if (mech.holdingTarget) mech.drop();
        }
    },
    giveGuns(gun = "random", ammoPacks = 10) {
        if (tech.isOneGun) b.removeAllGuns();
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
        simulation.makeGunHUD();
        b.setFireCD();
    },
    removeGun(gun, isRemoveSelection = false) {
        for (let i = 0; i < b.guns.length; i++) {
            if (b.guns[i].name === gun) {
                b.guns[i].have = false
                for (let j = 0; j < b.inventory.length; j++) {
                    if (b.inventory[j] === i) {
                        b.inventory.splice(j, 1)
                        break
                    }
                }
                if (b.inventory.length) {
                    b.activeGun = b.inventory[0];
                } else {
                    b.activeGun = null;
                }
                simulation.makeGunHUD();
                if (isRemoveSelection) b.guns.splice(i, 1) //also remove gun from gun pool array
                break
            }
        }
        b.setFireCD();
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
            if (bullet[i].endCycle < simulation.cycle) {
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
        b.fireCD = tech.fireRate * tech.slowFire * tech.researchHaste * tech.aimDamage / tech.fastTime
        if (tech.isFireRateForGuns) b.fireCD *= Math.pow(0.85, b.inventory.length)
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
        radius *= tech.explosiveRadius
        let dist, sub, knock;
        let dmg = radius * 0.013;
        if (tech.isExplosionHarm) radius *= 1.8 //    1/sqrt(2) radius -> area
        if (tech.isSmallExplosion) {
            radius *= 0.8
            dmg *= 1.6
        }

        simulation.drawList.push({ //add dmg to draw queue
            x: where.x,
            y: where.y,
            radius: radius,
            color: "rgba(255,25,0,0.6)",
            time: simulation.drawTime
        });

        const alertRange = 100 + radius * 2; //alert range
        simulation.drawList.push({ //add alert to draw queue
            x: where.x,
            y: where.y,
            radius: alertRange,
            color: "rgba(100,20,0,0.03)",
            time: simulation.drawTime
        });

        //player damage and knock back
        sub = Vector.sub(where, player.position);
        dist = Vector.magnitude(sub);

        if (dist < radius) {
            if (tech.isImmuneExplosion) {
                const mitigate = Math.min(1, Math.max(1 - mech.energy * 0.7, 0))
                mech.damage(mitigate * radius * (tech.isExplosionHarm ? 0.0004 : 0.0001));
            } else {
                mech.damage(radius * (tech.isExplosionHarm ? 0.0004 : 0.0001));
            }
            // if (!(tech.isImmuneExplosion && mech.energy > 0.97)) {
            //   if (tech.isExplosionHarm) {
            //     mech.damage(radius * 0.0004); //300% more player damage from explosions
            //   } else {
            //     mech.damage(radius * 0.0001); //normal player damage from explosions
            //   }
            //   mech.drop();
            // }
            knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass * 0.013);
            player.force.x += knock.x;
            player.force.y += knock.y;
        } else if (dist < alertRange) {
            knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass * 0.005);
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
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) * 0.011);
                body[i].force.x += knock.x;
                body[i].force.y += knock.y;
            }
        }

        //power up knock backs
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            sub = Vector.sub(where, powerUp[i].position);
            dist = Vector.magnitude(sub);
            if (dist < radius) {
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) * 0.013);
                powerUp[i].force.x += knock.x;
                powerUp[i].force.y += knock.y;
            } else if (dist < alertRange) {
                knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) * 0.007);
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
                    results = simulation.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
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
                results = simulation.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
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
        if (tech.isPulseAim) { //find mobs in line of sight
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

        if (tech.isPulseStun) {
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
            simulation.drawList.push({
                x: path[0].x + sub.x * dist + 13 * (Math.random() - 0.5),
                y: path[0].y + sub.y * dist + 13 * (Math.random() - 0.5),
                radius: 1 + 4 * Math.random(),
                color: "rgba(255,0,0,0.5)",
                time: Math.floor(2 + 33 * Math.random() * Math.random())
            });
        }
    },
    grenade() {

    },
    setGrenadeMode() {
        grenadeDefault = function(where = { x: mech.pos.x + 30 * Math.cos(mech.angle), y: mech.pos.y + 30 * Math.sin(mech.angle) }, angle = mech.angle) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0005);
            bullet[me].explodeRad = 275;
            bullet[me].onEnd = function() {
                b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                if (tech.fragments) b.targetedNail(this.position, tech.fragments * 5)
            }
            bullet[me].minDmgSpeed = 1;
            bullet[me].beforeDmg = function() {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            speed = mech.crouch ? 43 : 32
            Matter.Body.setVelocity(bullet[me], {
                x: mech.Vx / 2 + speed * Math.cos(angle),
                y: mech.Vy / 2 + speed * Math.sin(angle)
            });
            bullet[me].endCycle = simulation.cycle + Math.floor(mech.crouch ? 120 : 80);
            bullet[me].restitution = 0.4;
            bullet[me].do = function() {
                this.force.y += this.mass * 0.0025; //extra gravity for harder arcs
            };
            World.add(engine.world, bullet[me]); //add bullet to world
        }
        grenadeRPG = function(where = { x: mech.pos.x + 30 * Math.cos(mech.angle), y: mech.pos.y + 30 * Math.sin(mech.angle) }, angle = mech.angle) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0005);
            bullet[me].explodeRad = 300;
            bullet[me].onEnd = function() {
                b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                if (tech.fragments) b.targetedNail(this.position, tech.fragments * 5)
            }
            bullet[me].minDmgSpeed = 1;
            bullet[me].beforeDmg = function() {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            speed = mech.crouch ? 46 : 32
            Matter.Body.setVelocity(bullet[me], {
                x: mech.Vx / 2 + speed * Math.cos(angle),
                y: mech.Vy / 2 + speed * Math.sin(angle)
            });
            World.add(engine.world, bullet[me]); //add bullet to world

            bullet[me].endCycle = simulation.cycle + 70;
            bullet[me].frictionAir = 0.07;
            const MAG = 0.015
            bullet[me].thrust = {
                x: bullet[me].mass * MAG * Math.cos(angle),
                y: bullet[me].mass * MAG * Math.sin(angle)
            }
            bullet[me].do = function() {
                this.force.x += this.thrust.x;
                this.force.y += this.thrust.y;
                if (Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length) {
                    this.endCycle = 0; //explode if touching map or blocks
                }
            };
        }
        grenadeRPGVacuum = function(where = { x: mech.pos.x + 30 * Math.cos(mech.angle), y: mech.pos.y + 30 * Math.sin(mech.angle) }, angle = mech.angle) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 15, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0005);
            bullet[me].explodeRad = 350 + Math.floor(Math.random() * 50);;
            bullet[me].onEnd = function() {
                b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                if (tech.fragments) b.targetedNail(this.position, tech.fragments * 5)
            }
            bullet[me].minDmgSpeed = 1;
            bullet[me].beforeDmg = function() {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
            };
            speed = mech.crouch ? 46 : 32
            Matter.Body.setVelocity(bullet[me], {
                x: mech.Vx / 2 + speed * Math.cos(angle),
                y: mech.Vy / 2 + speed * Math.sin(angle)
            });
            World.add(engine.world, bullet[me]); //add bullet to world

            bullet[me].endCycle = simulation.cycle + 70;
            bullet[me].frictionAir = 0.07;
            const MAG = 0.015
            bullet[me].thrust = {
                x: bullet[me].mass * MAG * Math.cos(angle),
                y: bullet[me].mass * MAG * Math.sin(angle)
            }
            bullet[me].do = function() {
                const suckCycles = 40
                if (simulation.cycle > this.endCycle - suckCycles || Matter.Query.collides(this, map).length || Matter.Query.collides(this, body).length) { //suck
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
                    if (simulation.cycle > this.endCycle - 5) {
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
                    const radius = 2.75 * this.explodeRad * (this.endCycle - simulation.cycle) / suckCycles
                    ctx.fillStyle = "rgba(0,0,0,0.1)";
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                } else {
                    this.force.x += this.thrust.x;
                    this.force.y += this.thrust.y;
                }
            };
        }
        grenadeVacuum = function(where = { x: mech.pos.x + 30 * Math.cos(mech.angle), y: mech.pos.y + 30 * Math.sin(mech.angle) }, angle = mech.angle) {
            const me = bullet.length;
            bullet[me] = Bodies.circle(where.x, where.y, 20, b.fireAttributes(angle, false));
            Matter.Body.setDensity(bullet[me], 0.0003);
            bullet[me].explodeRad = 325 + Math.floor(Math.random() * 50);;
            bullet[me].onEnd = function() {
                b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                if (tech.fragments) b.targetedNail(this.position, tech.fragments * 7)
            }
            bullet[me].beforeDmg = function() {};
            bullet[me].restitution = 0.4;
            bullet[me].do = function() {
                this.force.y += this.mass * 0.0025; //extra gravity for harder arcs

                const suckCycles = 40
                if (simulation.cycle > this.endCycle - suckCycles) { //suck
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
                    if (simulation.cycle > this.endCycle - 5) {
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
                    const radius = 2.75 * this.explodeRad * (this.endCycle - simulation.cycle) / suckCycles
                    ctx.fillStyle = "rgba(0,0,0,0.1)";
                    ctx.beginPath();
                    ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            };
            speed = 35
            bullet[me].endCycle = simulation.cycle + 70;
            if (mech.crouch) {
                speed += 9
                bullet[me].endCycle += 20;
            }
            Matter.Body.setVelocity(bullet[me], {
                x: mech.Vx / 2 + speed * Math.cos(angle),
                y: mech.Vy / 2 + speed * Math.sin(angle)
            });
            World.add(engine.world, bullet[me]); //add bullet to world
        }

        grenadeNeutron = function(where = { x: mech.pos.x + 30 * Math.cos(mech.angle), y: mech.pos.y + 30 * Math.sin(mech.angle) }, angle = mech.angle) {
            const me = bullet.length;
            bullet[me] = Bodies.polygon(where.x, where.y, 10, 4, b.fireAttributes(angle, false));
            b.fireProps(mech.crouch ? 45 : 25, mech.crouch ? 35 : 20, angle, me); //cd , speed
            Matter.Body.setDensity(bullet[me], 0.000001);
            bullet[me].endCycle = Infinity;
            bullet[me].frictionAir = 0;
            bullet[me].friction = 1;
            bullet[me].frictionStatic = 1;
            bullet[me].restitution = 0;
            bullet[me].minDmgSpeed = 0;
            bullet[me].damageRadius = 100;
            bullet[me].maxDamageRadius = 450 + 130 * tech.isNeutronSlow + 130 * tech.isNeutronImmune //+ 150 * Math.random()
            bullet[me].radiusDecay = (0.81 + 0.15 * tech.isNeutronSlow + 0.15 * tech.isNeutronImmune) / tech.isBulletsLastLonger
            bullet[me].stuckTo = null;
            bullet[me].stuckToRelativePosition = null;
            bullet[me].vacuumSlow = 0.97;

            if (tech.isRPG) {
                const SCALE = 2
                Matter.Body.scale(bullet[me], SCALE, SCALE);

                speed = mech.crouch ? 25 : 15
                Matter.Body.setVelocity(bullet[me], {
                    x: mech.Vx / 2 + speed * Math.cos(angle),
                    y: mech.Vy / 2 + speed * Math.sin(angle)
                });

                const MAG = 0.005
                bullet[me].thrust = {
                    x: bullet[me].mass * MAG * Math.cos(angle),
                    y: bullet[me].mass * MAG * Math.sin(angle)
                }
            }

            bullet[me].beforeDmg = function() {};
            bullet[me].stuck = function() {};
            bullet[me].do = function() {
                function onCollide(that) {
                    that.collisionFilter.mask = 0; //non collide with everything
                    Matter.Body.setVelocity(that, {
                        x: 0,
                        y: 0
                    });
                    if (tech.isRPG) that.thrust = {
                        x: 0,
                        y: 0
                    }
                    that.do = that.radiationMode;
                    // if (Matter.Query.collides(that, map).length || Matter.Query.collides(that, body).length || Matter.Query.collides(that, mob).length) {
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
                        } else if (tech.isRPG) { //if colliding with nothing
                            this.force.x += this.thrust.x;
                            this.force.y += this.thrust.y;
                        } else {
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
                        if (!tech.isNeutronImmune && Vector.magnitude(Vector.sub(player.position, this.position)) < this.damageRadius) {
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
                                if (tech.isNeutronSlow) {
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
                        if (tech.isNeutronSlow) {
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
                            if (!tech.isNeutronImmune) slow([player], this.damageRadius)
                        }
                    }
                }
            }
        }


        if (tech.isNeutronBomb) {
            b.grenade = grenadeNeutron
        } else if (tech.isRPG) {
            if (tech.isVacuumBomb) {
                b.grenade = grenadeRPGVacuum
            } else {
                b.grenade = grenadeRPG
            }
        } else if (tech.isVacuumBomb) {
            b.grenade = grenadeVacuum
        } else {
            b.grenade = grenadeDefault
        }
    },
    missile(where, angle, speed, size = 1) {
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(where.x, where.y, 30 * size, 4 * size, {
            angle: angle,
            friction: 0.5,
            frictionAir: 0.045,
            dmg: 0, //damage done in addition to the damage from momentum
            classType: "bullet",
            endCycle: simulation.cycle + Math.floor((230 + 40 * Math.random()) * tech.isBulletsLastLonger),
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
                if (tech.fragments) b.targetedNail(this.position, tech.fragments * 5)
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
        const thrust = 0.0066 * bullet[me].mass * (tech.missileSize ? 0.6 : 1);
        Matter.Body.setVelocity(bullet[me], {
            x: mech.Vx / 2 + speed * Math.cos(angle),
            y: mech.Vy / 2 + speed * Math.sin(angle)
        });
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    lastAngle: 0,
    wasExtruderOn: false,
    isExtruderOn: false,
    didExtruderDrain: false,
    canExtruderFire: true,
    extruder() {
        const DRAIN = 0.0007 + mech.fieldRegen
        if (mech.energy > DRAIN && b.canExtruderFire) {
            mech.energy -= DRAIN
            if (mech.energy < 0) {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.energy = 0;
            }
            b.isExtruderOn = true
            const SPEED = 10
            const me = bullet.length;
            const where = Vector.add(mech.pos, player.velocity)
            bullet[me] = Bodies.polygon(where.x + 20 * Math.cos(mech.angle), where.y + 20 * Math.sin(mech.angle), 4, 0.01, {
                cycle: -0.5,
                isWave: true,
                endCycle: simulation.cycle + 10 + 40 * tech.isPlasmaRange,
                inertia: Infinity,
                frictionAir: 0,
                isInHole: true, //this keeps the bullet from entering wormholes
                minDmgSpeed: 0,
                dmg: b.dmgScale * 1.25, //damage also changes when you divide by mob.mass on in .do()
                classType: "bullet",
                isBranch: false,
                restitution: 0,
                collisionFilter: {
                    // category: 0,
                    // mask: 0, //cat.mob | cat.mobBullet | cat.mobShield
                    category: cat.bullet,
                    mask: cat.map, //cat.mob | cat.mobBullet | cat.mobShield
                },
                beforeDmg() {},
                onEnd() {},
                do() {
                    if (!mech.isBodiesAsleep) {
                        if (this.endCycle < simulation.cycle + 1) this.isWave = false
                        if (Matter.Query.point(map, this.position).length) { //check if inside map
                            this.isBranch = true;
                        } else { //check if inside a body
                            const q = Matter.Query.point(mob, this.position)
                            for (let i = 0; i < q.length; i++) {
                                Matter.Body.setVelocity(q[i], {
                                    x: q[i].velocity.x * 0.6,
                                    y: q[i].velocity.y * 0.6
                                });
                                Matter.Body.setPosition(this, Vector.add(this.position, q[i].velocity)) //move with the medium
                                let dmg = this.dmg / Math.min(10, q[i].mass)
                                q[i].damage(dmg);
                                q[i].foundPlayer();
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: this.position.x,
                                    y: this.position.y,
                                    radius: Math.log(2 * dmg + 1.1) * 40,
                                    color: "rgba(255, 0, 119, 0.5)",
                                    time: simulation.drawTime
                                });
                            }
                        }
                        this.cycle++
                        const wiggleMag = (mech.crouch ? 6 : 12) * Math.cos(simulation.cycle * 0.09)
                        const wiggle = Vector.mult(transverse, wiggleMag * Math.cos(this.cycle * 0.36)) //+ wiggleMag * Math.cos(simulation.cycle * 0.3))
                        const velocity = Vector.mult(player.velocity, 0.3) //move with player
                        Matter.Body.setPosition(this, Vector.add(velocity, Vector.add(this.position, wiggle)))
                        // Matter.Body.setPosition(this, Vector.add(this.position, wiggle))
                    }
                }
            });
            World.add(engine.world, bullet[me]); //add bullet to world
            Matter.Body.setVelocity(bullet[me], {
                x: SPEED * Math.cos(mech.angle),
                y: SPEED * Math.sin(mech.angle)
            });
            const transverse = Vector.normalise(Vector.perp(bullet[me].velocity))
            if (180 - Math.abs(Math.abs(b.lastAngle - mech.angle) - 180) > 0.3) bullet[me].isBranch = true; //don't draw stroke for this bullet
            b.lastAngle = mech.angle //track last angle for the above angle difference calculation
            if (!b.wasExtruderOn) bullet[me].isBranch = true;
        } else {
            b.canExtruderFire = false;
        }
    },
    plasma() {
        const DRAIN = 0.00008 + mech.fieldRegen
        if (mech.energy > DRAIN) {
            mech.energy -= DRAIN;
            if (mech.energy < 0) {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.energy = 0;
            }

            //calculate laser collision
            let best;
            let range = tech.isPlasmaRange * (120 + (mech.crouch ? 400 : 300) * Math.sqrt(Math.random())) //+ 100 * Math.sin(mech.cycle * 0.3);
            // const dir = mech.angle // + 0.04 * (Math.random() - 0.5)
            const path = [{
                    x: mech.pos.x + 20 * Math.cos(mech.angle),
                    y: mech.pos.y + 20 * Math.sin(mech.angle)
                },
                {
                    x: mech.pos.x + range * Math.cos(mech.angle),
                    y: mech.pos.y + range * Math.sin(mech.angle)
                }
            ];
            const vertexCollision = function(v1, v1End, domain) {
                for (let i = 0; i < domain.length; ++i) {
                    let vertices = domain[i].vertices;
                    const len = vertices.length - 1;
                    for (let j = 0; j < len; j++) {
                        results = simulation.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
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
                    results = simulation.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
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
                    simulation.drawList.push({
                        x: path[1].x,
                        y: path[1].y,
                        radius: Math.sqrt(dmg) * 50,
                        color: "rgba(255,0,255,0.2)",
                        time: simulation.drawTime * 4
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
            const Dx = Math.cos(mech.angle);
            const Dy = Math.sin(mech.angle);
            let x = mech.pos.x + 20 * Dx;
            let y = mech.pos.y + 20 * Dy;
            ctx.beginPath();
            ctx.moveTo(x, y);
            const step = Vector.magnitude(Vector.sub(path[0], path[1])) / 10
            for (let i = 0; i < 8; i++) {
                x += step * (Dx + 1.5 * (Math.random() - 0.5))
                y += step * (Dy + 1.5 * (Math.random() - 0.5))
                ctx.lineTo(x, y);
            }
            ctx.lineWidth = 2 * Math.random();
            ctx.stroke();
        }
    },
    laser(where = {
        x: mech.pos.x + 20 * Math.cos(mech.angle),
        y: mech.pos.y + 20 * Math.sin(mech.angle)
    }, whereEnd = {
        x: where.x + 3000 * Math.cos(mech.angle),
        y: where.y + 3000 * Math.sin(mech.angle)
    }, dmg = tech.laserDamage, reflections = tech.laserReflections, isThickBeam = false, push = 1) {
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
                    results = simulation.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
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
                results = simulation.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
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
                simulation.drawList.push({ //add dmg to draw queue
                    x: path[path.length - 1].x,
                    y: path[path.length - 1].y,
                    radius: Math.sqrt(damage) * 100,
                    color: "rgba(255,0,0,0.5)",
                    time: simulation.drawTime
                });

                if (tech.isLaserPush) { //push mobs away
                    // console.log(-0.003 * Math.min(4, best.who.mass), dmg)
                    const index = path.length - 1
                    // const force = Vector.mult(Vector.normalise(Vector.sub(path[Math.max(0, index - 1)], path[index])), -0.003 * Math.min(4, best.who.mass))
                    // const push = -0.004 / (1 + tech.beamSplitter + tech.wideLaser + tech.historyLaser)
                    // console.log(push)
                    const force = Vector.mult(Vector.normalise(Vector.sub(path[index], path[Math.max(0, index - 1)])), 0.003 * push * Math.min(6, best.who.mass))
                    Matter.Body.applyForce(best.who, path[index], force)
                    // Matter.Body.setVelocity(best.who, { //friction
                    //     x: best.who.velocity.x * 0.7,
                    //     y: best.who.velocity.y * 0.7
                    // });
                }

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
    laserMine(position, velocity = { x: 0, y: -8 }) {
        const me = bullet.length;
        bullet[me] = Bodies.polygon(position.x, position.y, 3, 25, {
            bulletType: "mine",
            angle: mech.angle,
            friction: 0,
            frictionAir: 0.05,
            restitution: 0.5,
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 60 + Math.floor(7 * Math.random()),
            drain: tech.isLaserDiode * tech.laserFieldDrain,
            isArmed: false,
            torqueMagnitude: 0.000003 * (Math.round(Math.random()) ? 1 : -1),
            range: 1500,
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
            },
            beforeDmg() {},
            onEnd() {
                if (tech.isMineAmmoBack && (!this.isArmed || Math.random() < 0.2)) { //get ammo back from tech.isMineAmmoBack
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun
                        if (b.guns[i].name === "mine") {
                            b.guns[i].ammo++
                            simulation.updateGunHUD();
                            break;
                        }
                    }
                }
            },
            do() {
                if (!(simulation.cycle % this.lookFrequency) && mech.energy > this.drain) { //find mob targets
                    for (let i = 0, len = mob.length; i < len; ++i) {
                        if (
                            Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position)) < 2000000 &&
                            mob[i].dropPowerUp &&
                            Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                            Matter.Query.ray(body, this.position, mob[i].position).length === 0
                        ) {
                            this.do = this.laserSpin
                            this.endCycle = simulation.cycle + 300
                            // if (this.angularSpeed < 0.01) this.torque += this.inertia * this.torqueMagnitude * 5 //spin
                            this.isArmed = true
                        }
                    }
                }
            },
            reflections: Math.max(0, tech.laserReflections - 2),
            laserSpin() {
                //drain energy
                if (mech.energy > this.drain) {
                    mech.energy -= this.drain
                    if (this.angularSpeed < 0.02) this.torque += this.inertia * this.torqueMagnitude //spin

                    //fire lasers
                    ctx.strokeStyle = "#f00";
                    ctx.lineWidth = 1.5
                    // ctx.globalAlpha = 1;
                    ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const where = this.vertices[i]
                        const endPoint = Vector.add(where, Vector.mult(Vector.normalise(Vector.sub(where, this.position)), 2500))
                        b.laser(where, endPoint, tech.laserDamage * 10, this.reflections, true)
                    }
                    ctx.stroke();
                    // ctx.globalAlpha = 1;
                }
            }
        })
        Matter.Body.setVelocity(bullet[me], velocity);
        World.add(engine.world, bullet[me]); //add bullet to world
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
                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield //  | cat.bullet   //doesn't collide with other bullets until it lands  (was crashing into bots)
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
                                    if (tech.isMineSentry) {
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
                    if (tech.isMineSentry) {
                        this.sentry();
                    } else {
                        this.arm();
                    }
                }
            },
            sentry() {
                this.collisionFilter.mask = cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield | cat.bullet //can now collide with other bullets
                this.lookFrequency = simulation.cycle + 60
                this.endCycle = simulation.cycle + 1080
                this.do = function() { //overwrite the do method for this bullet
                    this.force.y += this.mass * 0.002; //extra gravity
                    if (simulation.cycle > this.lookFrequency) {
                        this.lookFrequency = 10 + Math.floor(3 * Math.random())
                        this.do = function() { //overwrite the do method for this bullet
                            this.force.y += this.mass * 0.002; //extra gravity
                            if (!(simulation.cycle % this.lookFrequency) && !mech.isBodiesAsleep) { //find mob targets
                                this.endCycle -= 10
                                b.targetedNail(this.position, 1, 45 + 5 * Math.random(), 1100, false)
                                if (!(simulation.cycle % (this.lookFrequency * 6))) {
                                    simulation.drawList.push({
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
                this.collisionFilter.mask = cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield | cat.bullet //can now collide with other bullets
                this.lookFrequency = simulation.cycle + 60
                this.do = function() { //overwrite the do method for this bullet
                    this.force.y += this.mass * 0.002; //extra gravity
                    if (simulation.cycle > this.lookFrequency) {
                        this.isArmed = true
                        this.lookFrequency = 50 + Math.floor(27 * Math.random())
                        simulation.drawList.push({
                            x: this.position.x,
                            y: this.position.y,
                            radius: 10,
                            color: "#f00",
                            time: 4
                        });
                        this.do = function() { //overwrite the do method for this bullet
                            this.force.y += this.mass * 0.002; //extra gravity
                            if (!(simulation.cycle % this.lookFrequency)) { //find mob targets
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
                if (isAmmoBack) { //get ammo back from tech.isMineAmmoBack
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun
                        if (b.guns[i].name === "mine") {
                            b.guns[i].ammo++
                            simulation.updateGunHUD();
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
    spore(where, isFreeze = tech.isSporeFreeze) { //used with the tech upgrade in mob.death()
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
            thrust: (tech.isFastSpores ? 0.001 : 0.0004) * (1 + 0.3 * (Math.random() - 0.5)),
            dmg: tech.isMutualism ? 10 : 4, //2x bonus damage from tech.isMutualism
            lookFrequency: 100 + Math.floor(117 * Math.random()),
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.mob | cat.mobBullet | cat.mobShield //no collide with body
            },
            endCycle: simulation.cycle + Math.floor((600 + Math.floor(Math.random() * 420)) * tech.isBulletsLastLonger),
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
                if (tech.isMutualism && this.isMutualismActive && !tech.isEnergyHealth) {
                    mech.health += 0.005
                    if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
                    mech.displayHealth();
                }
            },
            do() {
                if (this.lockedOn && this.lockedOn.alive) {
                    this.force = Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), this.mass * this.thrust)
                } else {
                    if (!(simulation.cycle % this.lookFrequency)) { //find mob targets
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
                    if (tech.isSporeFollow && this.lockedOn === null) { //move towards player
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

                // if (!this.lockedOn && !(simulation.cycle % this.lookFrequency)) { //find mob targets
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
                // } else if (tech.isSporeFollow && this.lockedOn !== undefined) { //move towards player
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

        if (tech.isMutualism && mech.health > 0.02) {
            mech.health -= 0.005
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
            dmg: 0.29, //damage done in addition to the damage from momentum
            lookFrequency: 14 + Math.floor(8 * Math.random()),
            endCycle: simulation.cycle + 120 * tech.isBulletsLastLonger, //Math.floor((1200 + 420 * Math.random()) * tech.isBulletsLastLonger),
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield //self collide
            },
            minDmgSpeed: 0,
            lockedOn: null,
            isFollowMouse: true,
            beforeDmg(who) {
                mobs.statusSlow(who, 120)
                this.endCycle = simulation.cycle
                // if (tech.isHeavyWater) mobs.statusDoT(who, 0.15, 300)
                if (tech.iceEnergy && !who.shield && !who.isShielded && who.dropPowerUp && who.alive) {
                    setTimeout(function() {
                        if (!who.alive) {
                            mech.energy += tech.iceEnergy * 0.8
                            mech.addHealth(tech.iceEnergy * 0.04)
                        }
                    }, 10);
                }
            },
            onEnd() {},
            do() {
                // this.force.y += this.mass * 0.0002;
                //find mob targets
                if (!(simulation.cycle % this.lookFrequency)) {
                    const scale = 1 - 0.08 / tech.isBulletsLastLonger //0.9 * tech.isBulletsLastLonger;
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
        const THRUST = tech.isFastDrones ? 0.0023 : 0.0015
        // const FRICTION = tech.isFastDrones ? 0.008 : 0.0005
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
            endCycle: simulation.cycle + Math.floor((1100 + 420 * Math.random()) * tech.isBulletsLastLonger),
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
                if (tech.isIncendiary) {
                    const max = Math.min(this.endCycle - simulation.cycle, 1500)
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
                    if (this.endCycle > simulation.cycle + this.deathCycles) {
                        this.endCycle -= 60
                        if (simulation.cycle + this.deathCycles > this.endCycle) this.endCycle = simulation.cycle + this.deathCycles
                    }
                }
            },
            onEnd() {},
            do() {
                if (simulation.cycle + this.deathCycles > this.endCycle) { //fall shrink and die
                    this.force.y += this.mass * 0.0012;
                    this.restitution = 0.2;
                    const scale = 0.99;
                    Matter.Body.scale(this, scale, scale);
                } else {
                    this.force.y += this.mass * 0.0002;
                    //find mob targets
                    if (!(simulation.cycle % this.lookFrequency)) {
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
                        if (!this.lockedOn && !tech.isArmorFromPowerUps && !this.isImproved) { //grab a power up
                            let closeDist = Infinity;
                            for (let i = 0, len = powerUp.length; i < len; ++i) {
                                if (
                                    (powerUp[i].name !== "heal" || mech.health < 0.9 * mech.maxHealth || tech.isDroneGrab) &&
                                    (powerUp[i].name !== "field" || !tech.isDeterminism)
                                ) {
                                    //pick up nearby power ups
                                    if (Vector.magnitudeSquared(Vector.sub(this.position, powerUp[i].position)) < 60000 && !simulation.isChoosing) {
                                        powerUps.onPickUp(powerUp[i]);
                                        powerUp[i].effect();
                                        Matter.World.remove(engine.world, powerUp[i]);
                                        powerUp.splice(i, 1);
                                        if (tech.isDroneGrab) {
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
                        this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, simulation.mouseInGame)), -this.mass * THRUST)
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
        // radius *= Math.sqrt(tech.bulletSize)
        const me = bullet.length;
        bullet[me] = Bodies.polygon(position.x, position.y, 20, radius, {
            // angle: 0,
            density: 0.000001, //  0.001 is normal density
            inertia: Infinity,
            frictionAir: 0.003,
            // friction: 0.2,
            // restitution: 0.2,
            dmg: 0, //damage on impact
            damage: tech.isFastFoam ? 0.048 : 0.012, //damage done over time
            scale: 1 - 0.006 / tech.isBulletsLastLonger * (tech.isFastFoam ? 1.6 : 1),
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
                            this.target.damage(b.dmgScale * this.damage, true); //shield damage bypass
                            //shrink if mob is shielded
                            const SCALE = 1 - 0.014 / tech.isBulletsLastLonger
                            Matter.Body.scale(this, SCALE, SCALE);
                            this.radius *= SCALE;
                        } else {
                            this.target.damage(b.dmgScale * this.damage);
                        }
                    } else if (this.target !== null) { //look for a new target
                        this.target = null
                        this.collisionFilter.category = cat.bullet;
                        this.collisionFilter.mask = cat.mob //| cat.mobShield //cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
                        if (tech.isFoamGrowOnDeath && bullet.length < 300) {
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
        bullet[me] = Bodies.rectangle(pos.x, pos.y, 25 * tech.biggerNails, 2 * tech.biggerNails, b.fireAttributes(Math.atan2(velocity.y, velocity.x)));
        Matter.Body.setVelocity(bullet[me], velocity);
        World.add(engine.world, bullet[me]); //add bullet to world
        bullet[me].endCycle = simulation.cycle + 60 + 18 * Math.random();
        bullet[me].dmg = dmg
        bullet[me].beforeDmg = function(who) { //beforeDmg is rewritten with ice crystal tech
            if (tech.isNailPoison) mobs.statusDoT(who, dmg * 0.24, 120) // one tick every 30 cycles
            if (tech.isNailCrit && !who.shield && Vector.dot(Vector.normalise(Vector.sub(who.position, this.position)), Vector.normalise(this.velocity)) > 0.99) this.dmg *= 5 //crit if hit near center
        };
        bullet[me].do = function() {};
    },
    // **************************************************************************************************
    // **************************************************************************************************
    // ********************************         Bots        *********************************************
    // **************************************************************************************************
    // **************************************************************************************************
    respawnBots() {
        for (let i = 0; i < tech.laserBotCount; i++) b.laserBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        for (let i = 0; i < tech.nailBotCount; i++) b.nailBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        for (let i = 0; i < tech.foamBotCount; i++) b.foamBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        for (let i = 0; i < tech.boomBotCount; i++) b.boomBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        for (let i = 0; i < tech.orbitBotCount; i++) b.orbitBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        for (let i = 0; i < tech.plasmaBotCount; i++) b.plasmaBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        for (let i = 0; i < tech.missileBotCount; i++) b.missileBot({ x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, false)
        if (tech.isIntangible && mech.isCloak) {
            for (let i = 0; i < bullet.length; i++) {
                if (bullet[i].botType) bullet[i].collisionFilter.mask = cat.map | cat.bullet | cat.mobBullet | cat.mobShield
            }
        }
    },
    randomBot(where = mech.pos, isKeep = true, isAll = true) {
        if (Math.random() < 0.2 && isAll) {
            b.laserBot(where)
            if (isKeep) tech.laserBotCount++;
        } else if (Math.random() < 0.25 && isAll) {
            b.orbitBot(where);
            if (isKeep) tech.orbitBotCount++;
        } else if (Math.random() < 0.33) {
            b.nailBot(where)
            if (isKeep) tech.nailBotCount++;
        } else if (Math.random() < 0.5) {
            b.foamBot(where)
            if (isKeep) tech.foamBotCount++;
        } else {
            b.boomBot(where)
            if (isKeep) tech.boomBotCount++;
        }
    },
    nailBot(position = { x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.nailBot()`);
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (12 + 4 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 4, RADIUS, {
            isUpgraded: tech.isNailBotUpgrade,
            botType: "nail",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            restitution: 0.6 * (1 + 0.5 * Math.random()),
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            // lookFrequency: 56 + Math.floor(17 * Math.random()) - isUpgraded * 20,
            lastLookCycle: simulation.cycle + 60 * Math.random(),
            acceleration: 0.005 * (1 + 0.5 * Math.random()),
            range: 70 * (1 + 0.3 * Math.random()),
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            beforeDmg() {},
            onEnd() {},
            do() {
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > this.range) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
                } else { //close to player
                    Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity

                    if (this.lastLookCycle < simulation.cycle && !mech.isCloak) {
                        this.lastLookCycle = simulation.cycle + (this.isUpgraded ? 15 : 80)
                        let target
                        for (let i = 0, len = mob.length; i < len; i++) {
                            const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                            if (dist < 3000000 && //1400*1400
                                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                                Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                                target = Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))
                                const SPEED = 50
                                const unit = Vector.normalise(Vector.sub(target, this.position))
                                b.nail(this.position, Vector.mult(unit, SPEED), 0.4)
                                this.force = Vector.mult(unit, -0.01 * this.mass)
                                break;
                            }
                        }
                    }
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    missileBot(position = { x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.missileBot()`);
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(position.x, position.y, 28, 11, {
            botType: "foam",
            angle: mech.angle,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.055,
            restitution: 0.7,
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 70,
            cd: 0,
            delay: 90,
            range: 80,
            endCycle: Infinity,
            classType: "bullet",
            collisionFilter: {
                category: cat.bullet,
                mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
            },
            beforeDmg() {},
            onEnd() {},
            do() {
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > this.range) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * 0.006)
                } else { //close to player
                    Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity

                    if (this.cd < simulation.cycle && !(simulation.cycle % this.lookFrequency) && !mech.isCloak) {
                        for (let i = 0, len = mob.length; i < len; i++) {
                            const dist2 = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                            if (Matter.Query.ray(map, this.position, mob[i].position).length === 0 && dist2 > 250000) {
                                this.cd = simulation.cycle + this.delay;
                                const angle = Vector.angle(this.position, mob[i].position)
                                Matter.Body.setAngle(this, angle)
                                // Matter.Body.setAngularVelocity(this, 0.025)
                                this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, mob[i].position)), this.mass * 0.02)
                                b.missile(this.position, angle, -8, 0.7 * (tech.missileSize ? 1.5 : 1))
                                break;
                            }
                        }
                    }
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    foamBot(position = { x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.foamBot()`);
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (10 + 5 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 6, RADIUS, {
            isUpgraded: tech.isFoamBotUpgrade,
            botType: "foam",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.05,
            restitution: 0.6 * (1 + 0.5 * Math.random()),
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 60 + Math.floor(17 * Math.random()) - 30 * tech.isFoamBotUpgrade,
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
            beforeDmg() {},
            onEnd() {},
            do() {
                const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
                if (distanceToPlayer > this.range) { //if far away move towards player
                    this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
                } else { //close to player
                    Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17))); //add player's velocity

                    if (this.cd < simulation.cycle && !(simulation.cycle % this.lookFrequency) && !mech.isCloak) {
                        let target
                        for (let i = 0, len = mob.length; i < len; i++) {
                            const dist2 = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                            if (dist2 < 1000000 && Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
                                this.cd = simulation.cycle + this.delay;
                                target = Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist2) / 60))
                                const radius = 6 + 7 * Math.random()
                                const SPEED = 29 - radius * 0.5; //(mech.crouch ? 32 : 20) - radius * 0.7;
                                const velocity = Vector.mult(Vector.normalise(Vector.sub(target, this.position)), SPEED)
                                b.foam(this.position, velocity, radius + 7 * this.isUpgraded)
                                break;
                            }
                        }
                    }
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    laserBot(position = { x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.laserBot()`);
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (14 + 6 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 3, RADIUS, {
            isUpgraded: tech.isLaserBotUpgrade,
            botType: "laser",
            angle: dir,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0.008 * (1 + 0.3 * Math.random()),
            restitution: 0.5 * (1 + 0.5 * Math.random()),
            dmg: 0, // 0.14   //damage done in addition to the damage from momentum
            minDmgSpeed: 2,
            lookFrequency: 40 + Math.floor(7 * Math.random()),
            drainThreshold: tech.isEnergyHealth ? 0.5 : 0.33,
            acceleration: 0.0015 * (1 + 0.3 * Math.random()),
            range: 700 * (1 + 0.1 * Math.random()) + 300 * tech.isLaserBotUpgrade,
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
                if (!(simulation.cycle % this.lookFrequency)) {
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
                    mech.energy -= tech.laserFieldDrain * tech.isLaserDiode
                    b.laser(this.vertices[0], this.lockedOn.position, b.dmgScale * (0.38 * tech.laserDamage + this.isUpgraded * 0.21), tech.laserReflections, false, 0.4) //tech.laserDamage = 0.16
                    // laser(where = {
                    //     x: mech.pos.x + 20 * Math.cos(mech.angle),
                    //     y: mech.pos.y + 20 * Math.sin(mech.angle)
                    // }, whereEnd = {
                    //     x: where.x + 3000 * Math.cos(mech.angle),
                    //     y: where.y + 3000 * Math.sin(mech.angle)
                    // }, dmg = tech.laserDamage, reflections = tech.laserReflections, isThickBeam = false, push = 1) {
                }
            }
        })
        World.add(engine.world, bullet[me]); //add bullet to world
    },
    boomBot(position = { x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.boomBot()`);
        const me = bullet.length;
        const dir = mech.angle;
        const RADIUS = (7 + 2 * Math.random())
        bullet[me] = Bodies.polygon(position.x, position.y, 4, RADIUS, {
            isUpgraded: tech.isBoomBotUpgrade,
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
            range: 500 * (1 + 0.1 * Math.random()) + 350 * tech.isBoomBotUpgrade,
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
                    if (!(simulation.cycle % this.lookFrequency) && !mech.isCloak) {
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
    plasmaBot(position = { x: mech.pos.x + 50 * (Math.random() - 0.5), y: mech.pos.y + 50 * (Math.random() - 0.5) }, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.plasmaBot()`);
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
            drainThreshold: tech.isEnergyHealth ? 0.4 : 0.2,
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
                if (!(simulation.cycle % this.lookFrequency)) {
                    this.lockedOn = null;
                    if (!mech.isCloak) {
                        let closeDist = tech.isPlasmaRange * 1000;
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
                    if (DIST < tech.isPlasmaRange * 450 && mech.energy > this.drainThreshold) {
                        mech.energy -= 0.005;
                        // if (mech.energy < 0) {
                        //     mech.fieldCDcycle = mech.cycle + 120;
                        //     mech.energy = 0;
                        // }
                        //calculate laser collision
                        let best;
                        let range = tech.isPlasmaRange * (120 + 300 * Math.sqrt(Math.random()))
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
                                    results = simulation.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
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
                                results = simulation.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
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
                                const dmg = 0.6 * b.dmgScale; //********** SCALE DAMAGE HERE *********************
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
                                simulation.drawList.push({
                                    x: path[1].x,
                                    y: path[1].y,
                                    radius: Math.sqrt(dmg) * 50,
                                    color: "rgba(255,0,255,0.2)",
                                    time: simulation.drawTime * 4
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
    orbitBot(position = mech.pos, isConsole = true) {
        if (isConsole) simulation.makeTextLog(`<span class='color-var'>b</span>.orbitBot()`);
        const me = bullet.length;
        bullet[me] = Bodies.polygon(position.x, position.y, 9, 12, {
            isUpgraded: tech.isOrbitBotUpgrade,
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
            range: 190 + 60 * tech.isOrbitBotUpgrade, //range is set in bot upgrade too! //150 + (80 + 100 * tech.isOrbitBotUpgrade) * Math.random(), // + 5 * tech.orbitBotCount,
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
                        const dmg = 0.5 * b.dmgScale * (this.isUpgraded ? 2.5 : 1) * (tech.isCrit ? 4 : 1)
                        q[i].damage(dmg);
                        q[i].foundPlayer();
                        simulation.drawList.push({ //add dmg to draw queue
                            x: this.position.x,
                            y: this.position.y,
                            radius: Math.log(2 * dmg + 1.1) * 40,
                            color: 'rgba(0,0,0,0.4)',
                            time: simulation.drawTime
                        });
                    }
                }
                //orbit player
                const time = simulation.cycle * this.orbitalSpeed + this.phase
                const orbit = {
                    x: Math.cos(time),
                    y: Math.sin(time) //*1.1
                }
                Matter.Body.setPosition(this, Vector.add(mech.pos, Vector.mult(orbit, this.range))) //bullets move with player
            }
        })
        // bullet[me].orbitalSpeed = Math.sqrt(0.7 / bullet[me].range)
        bullet[me].orbitalSpeed = Math.sqrt(0.25 / bullet[me].range) //also set in bot upgrade too!
        // bullet[me].phase = (index / tech.orbitBotCount) * 2 * Math.PI
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
                if (tech.nailFireRate) { //fire delay decreases as you hold fire, down to 3 from 15
                    if (tech.nailInstantFireRate) {
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
                const speed = 30 + 6 * Math.random() + 9 * tech.nailInstantFireRate
                const angle = mech.angle + (Math.random() - 0.5) * (Math.random() - 0.5) * (mech.crouch ? 1.35 : 3.2) / CD
                if (tech.isIncendiary) {
                    const me = bullet.length;
                    bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 25, 2, {
                        density: 0.0001, //frictionAir: 0.01,			//restitution: 0,
                        angle: angle,
                        friction: 0.5,
                        frictionAir: 0,
                        dmg: 0, //damage done in addition to the damage from momentum
                        endCycle: Math.floor(mech.crouch ? 28 : 13) + Math.random() * 5 + simulation.cycle,
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
                    if (tech.isIceCrystals) {
                        bullet[bullet.length - 1].beforeDmg = function(who) {
                            mobs.statusSlow(who, 30)
                            if (tech.isNailPoison) mobs.statusDoT(who, dmg * 0.24, 120) // one tick every 30 cycles
                            if (tech.isNailCrit && !who.shield && Vector.dot(Vector.normalise(Vector.sub(who.position, this.position)), Vector.normalise(this.velocity)) > 0.99) this.dmg *= 5 //crit if hit near center
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
                    if (tech.isShotgunImmune) mech.immuneCycle = mech.cycle + Math.floor(58 * b.fireCD); //player is immune to collision damage for 30 cycles
                    knock = 0.01
                } else {
                    mech.fireCDcycle = mech.cycle + Math.floor(45 * b.fireCD); // cool down
                    if (tech.isShotgunImmune) mech.immuneCycle = mech.cycle + Math.floor(47 * b.fireCD); //player is immune to collision damage for 30 cycles
                    spread = 1.3
                    knock = 0.1
                }

                if (tech.isShotgunRecoil) {
                    mech.fireCDcycle -= 0.66 * (45 * b.fireCD)
                    player.force.x -= 2 * knock * Math.cos(mech.angle)
                    player.force.y -= 2 * knock * Math.sin(mech.angle) //reduce knock back in vertical direction to stop super jumps
                } else {
                    player.force.x -= knock * Math.cos(mech.angle)
                    player.force.y -= knock * Math.sin(mech.angle) * 0.3 //reduce knock back in vertical direction to stop super jumps
                }

                b.muzzleFlash(35);

                if (tech.isSlugShot) {
                    const me = bullet.length;
                    const dir = mech.angle + 0.02 * (Math.random() - 0.5)
                    bullet[me] = Bodies.rectangle(mech.pos.x + 35 * Math.cos(mech.angle), mech.pos.y + 35 * Math.sin(mech.angle), 45, 20, b.fireAttributes(dir));
                    Matter.Body.setDensity(bullet[me], 0.0022);
                    World.add(engine.world, bullet[me]); //add bullet to world
                    const SPEED = (mech.crouch ? 52 : 43) + Math.random() * 7
                    Matter.Body.setVelocity(bullet[me], {
                        x: SPEED * Math.cos(dir),
                        y: SPEED * Math.sin(dir)
                    });
                    if (tech.isIncendiary) {
                        bullet[me].endCycle = simulation.cycle + 60
                        bullet[me].onEnd = function() {
                            b.explosion(this.position, 250 + (Math.random() - 0.5) * 60); //makes bullet do explosive damage at end
                        }
                        bullet[me].beforeDmg = function() {
                            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
                        };
                    } else {
                        bullet[me].endCycle = simulation.cycle + 180
                    }
                    bullet[me].minDmgSpeed = 15
                    // bullet[me].restitution = 0.4
                    bullet[me].frictionAir = 0.006;
                    bullet[me].do = function() {
                        this.force.y += this.mass * 0.002

                        //rotates bullet to face current velocity?
                        if (this.speed > 6) {
                            const facing = {
                                x: Math.cos(this.angle),
                                y: Math.sin(this.angle)
                            }
                            const mag = 0.0033
                            if (Vector.cross(Vector.normalise(this.velocity), facing) < 0) {
                                this.torque += mag
                            } else {
                                this.torque -= mag
                            }
                        }
                    };
                    if (tech.fragments) {
                        bullet[me].beforeDmg = function() {
                            if (this.speed > 4) {
                                b.targetedNail(this.position, tech.fragments * 8)
                                this.endCycle = 0 //triggers despawn
                            }
                        }
                    }
                } else if (tech.isIncendiary) {
                    const SPEED = mech.crouch ? 35 : 25
                    const END = Math.floor(mech.crouch ? 9 : 6);
                    const totalBullets = 8
                    const angleStep = (mech.crouch ? 0.15 : 0.4) / totalBullets
                    let dir = mech.angle - angleStep * totalBullets / 2;
                    for (let i = 0; i < totalBullets; i++) { //5 -> 7
                        dir += angleStep
                        const me = bullet.length;
                        bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 17, 4, b.fireAttributes(dir));
                        const end = END + Math.random() * 3
                        bullet[me].endCycle = 2 * end + simulation.cycle
                        const speed = SPEED * end / END
                        const dirOff = dir + 0.15 * (Math.random() - 0.5)
                        Matter.Body.setVelocity(bullet[me], {
                            x: speed * Math.cos(dirOff),
                            y: speed * Math.sin(dirOff)
                        });
                        bullet[me].onEnd = function() {
                            b.explosion(this.position, 80 + (Math.random() - 0.5) * 30); //makes bullet do explosive damage at end
                        }
                        bullet[me].beforeDmg = function() {
                            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
                        };
                        bullet[me].do = function() {}
                        World.add(engine.world, bullet[me]); //add bullet to world
                    }
                } else if (tech.isNailShot) {
                    if (mech.crouch) {
                        for (let i = 0; i < 11; i++) {
                            const dir = mech.angle + (Math.random() - 0.5) * 0.015
                            const pos = {
                                x: mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5),
                                y: mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5)
                            }
                            speed = 39 + 7 * Math.random()
                            const velocity = {
                                x: speed * Math.cos(dir),
                                y: speed * Math.sin(dir)
                            }
                            b.nail(pos, velocity, 1.2)
                        }
                    } else {
                        for (let i = 0; i < 15; i++) {
                            const dir = mech.angle + (Math.random() - 0.5) * 0.42
                            const pos = {
                                x: mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5),
                                y: mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5)
                            }
                            speed = 34 + 6 * Math.random()
                            const velocity = {
                                x: speed * Math.cos(dir),
                                y: speed * Math.sin(dir)
                            }
                            b.nail(pos, velocity, 1.2)
                        }
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
                        bullet[me].endCycle = simulation.cycle + 40
                        bullet[me].minDmgSpeed = 15
                        // bullet[me].restitution = 0.4
                        bullet[me].frictionAir = 0.034;
                        bullet[me].do = function() {
                            if (!mech.isBodiesAsleep) {
                                const scale = 1 - 0.034 / tech.isBulletsLastLonger
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
                if (tech.oneSuperBall) {
                    let dir = mech.angle
                    const me = bullet.length;
                    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 20 * tech.bulletSize, b.fireAttributes(dir, false));
                    World.add(engine.world, bullet[me]); //add bullet to world
                    Matter.Body.setVelocity(bullet[me], {
                        x: SPEED * Math.cos(dir),
                        y: SPEED * Math.sin(dir)
                    });
                    // Matter.Body.setDensity(bullet[me], 0.0001);
                    bullet[me].endCycle = simulation.cycle + Math.floor(300 + 60 * Math.random());
                    bullet[me].minDmgSpeed = 0;
                    bullet[me].restitution = 1;
                    bullet[me].friction = 0;
                    bullet[me].do = function() {
                        this.force.y += this.mass * 0.0012;
                    };
                    bullet[me].beforeDmg = function(who) {
                        mobs.statusStun(who, 180) // (2.3) * 2 / 14 ticks (2x damage over 7 seconds)
                        if (tech.isIncendiary) {
                            b.explosion(this.position, this.mass * 250); //makes bullet do explosive damage at end
                            this.endCycle = 0
                        }
                    };
                } else {
                    b.muzzleFlash(20);
                    const SPREAD = mech.crouch ? 0.08 : 0.15
                    let dir = mech.angle - SPREAD * (tech.superBallNumber - 1) / 2;
                    for (let i = 0; i < tech.superBallNumber; i++) {
                        const me = bullet.length;
                        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 7.5 * tech.bulletSize, b.fireAttributes(dir, false));
                        World.add(engine.world, bullet[me]); //add bullet to world
                        Matter.Body.setVelocity(bullet[me], {
                            x: SPEED * Math.cos(dir),
                            y: SPEED * Math.sin(dir)
                        });
                        // Matter.Body.setDensity(bullet[me], 0.0001);
                        bullet[me].endCycle = simulation.cycle + Math.floor((300 + 60 * Math.random()) * tech.isBulletsLastLonger);
                        bullet[me].minDmgSpeed = 0;
                        bullet[me].restitution = 0.99;
                        bullet[me].friction = 0;
                        bullet[me].do = function() {
                            this.force.y += this.mass * 0.001;
                        };
                        bullet[me].beforeDmg = function() {
                            if (tech.isIncendiary) {
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
            ammoPack: 75,
            defaultAmmoPack: 75,
            have: false,
            count: 0, //used to track how many shots are in a volley before a big CD
            lastFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
            fire() {
                function makeFlechette(angle = mech.angle + 0.02 * (Math.random() - 0.5)) {
                    const me = bullet.length;
                    bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(mech.angle), mech.pos.y + 40 * Math.sin(mech.angle), 45, 1, b.fireAttributes(angle));
                    bullet[me].collisionFilter.mask = tech.pierce ? 0 : cat.body; //cat.mobShield | //cat.map | cat.body |
                    Matter.Body.setDensity(bullet[me], 0.00001); //0.001 is normal
                    bullet[me].endCycle = simulation.cycle + 180;
                    bullet[me].dmg = 0;
                    bullet[me].immuneList = []
                    bullet[me].do = function() {
                        const whom = Matter.Query.collides(this, mob)
                        if (whom.length && this.speed > 20) { //if touching a mob 
                            who = whom[0].bodyA
                            if (who && who.mob) {
                                if (tech.pierce) {
                                    let immune = false
                                    for (let i = 0; i < this.immuneList.length; i++) {
                                        if (this.immuneList[i] === who.id) immune = true
                                    }
                                    if (!immune) {
                                        this.immuneList.push(who.id)
                                        who.foundPlayer();
                                        if (tech.isFastDot) {
                                            mobs.statusDoT(who, 3.78, 30)
                                        } else {
                                            mobs.statusDoT(who, 0.63, tech.isSlowDot ? 360 : 180)
                                        }
                                        simulation.drawList.push({ //add dmg to draw queue
                                            x: this.position.x,
                                            y: this.position.y,
                                            radius: 40,
                                            color: "rgba(0,80,80,0.3)",
                                            time: simulation.drawTime
                                        });
                                    }
                                } else {
                                    this.endCycle = 0;
                                    if (tech.isFlechetteExplode && !who.shield && Vector.dot(Vector.normalise(Vector.sub(who.position, this.position)), Vector.normalise(this.velocity)) > 0.97) {
                                        this.explodeRad = 300 + 60 * Math.random();
                                        b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
                                    }
                                    who.foundPlayer();
                                    if (tech.isFastDot) {
                                        mobs.statusDoT(who, 4, 30)
                                    } else {
                                        mobs.statusDoT(who, 0.7, tech.isSlowDot ? 360 : 180)
                                    }
                                    simulation.drawList.push({ //add dmg to draw queue
                                        x: this.position.x,
                                        y: this.position.y,
                                        radius: 40,
                                        color: "rgba(0,80,80,0.3)",
                                        time: simulation.drawTime
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
                    Matter.Body.setDensity(bullet[me], 0.00001);
                    World.add(engine.world, bullet[me]); //add bullet to world
                }
                makeFlechette()
                if (tech.isFlechetteMultiShot) {
                    makeFlechette(mech.angle + 0.02 + 0.005 * Math.random())
                    makeFlechette(mech.angle - 0.02 - 0.005 * Math.random())
                }

                const CD = (mech.crouch) ? 40 : 15
                if (this.lastFireCycle + CD < mech.cycle) this.count = 0 //reset count if it cycles past the CD
                this.lastFireCycle = mech.cycle
                if (this.count > ((mech.crouch) ? 8 : 1)) {
                    this.count = 0
                    mech.fireCDcycle = mech.cycle + Math.floor(CD * b.fireCD); // cool down
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
                if (tech.waveHelix === 2) {
                    wiggleMag = (mech.crouch ? 6 : 12) * (1 + Math.sin(mech.cycle * 0.1))
                } else {
                    wiggleMag = mech.crouch ? 6 : 12
                }
                // const wiggleMag = tech.waveHelix ? (mech.crouch ? 6 + 6 * Math.sin(mech.cycle * 0.1) : 13 + 13 * Math.sin(mech.cycle * 0.1)) : (mech.crouch ? 6 : 12)
                const size = 5 * (tech.waveHelix === 1 ? 1 : 0.7)
                for (let i = 0; i < tech.waveHelix; i++) {
                    const me = bullet.length;
                    bullet[me] = Bodies.polygon(mech.pos.x + 25 * Math.cos(dir), mech.pos.y + 25 * Math.sin(dir), 7, size, {
                        angle: dir,
                        cycle: -0.5,
                        endCycle: simulation.cycle + Math.floor((tech.isWaveReflect ? 600 : 120) * tech.isBulletsLastLonger),
                        inertia: Infinity,
                        frictionAir: 0,
                        slow: 0,
                        minDmgSpeed: 0,
                        dmg: b.dmgScale * (tech.waveHelix === 1 ? 0.6 : 0.75), //control damage also when you divide by mob.mass
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
                                if (tech.isWaveReflect) {
                                    // check if inside a mob
                                    q = Matter.Query.point(mob, this.position)
                                    for (let i = 0; i < q.length; i++) {
                                        let dmg = this.dmg / Math.min(10, q[i].mass)
                                        q[i].damage(dmg);
                                        q[i].foundPlayer();
                                        simulation.drawList.push({ //add dmg to draw queue
                                            x: this.position.x,
                                            y: this.position.y,
                                            radius: Math.log(2 * dmg + 1.1) * 40,
                                            color: 'rgba(0,0,0,0.4)',
                                            time: simulation.drawTime
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
                                        slowCheck = tech.waveSpeedMap
                                    } else { //check if inside a body
                                        let q = Matter.Query.point(body, this.position)
                                        if (q.length) {
                                            slowCheck = tech.waveSpeedBody
                                            Matter.Body.setPosition(this, Vector.add(this.position, q[0].velocity)) //move with the medium
                                        } else { // check if inside a mob
                                            q = Matter.Query.point(mob, this.position)
                                            for (let i = 0; i < q.length; i++) {
                                                slowCheck = 0.3;
                                                Matter.Body.setPosition(this, Vector.add(this.position, q[i].velocity)) //move with the medium
                                                let dmg = this.dmg / Math.min(10, q[i].mass)
                                                q[i].damage(dmg);
                                                q[i].foundPlayer();
                                                simulation.drawList.push({ //add dmg to draw queue
                                                    x: this.position.x,
                                                    y: this.position.y,
                                                    radius: Math.log(2 * dmg + 1.1) * 40,
                                                    color: 'rgba(0,0,0,0.4)',
                                                    time: simulation.drawTime
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
                                //6 * Math.cos(this.cycle * 0.1) +
                                // Math.cos(simulation.cycle * 0.09) *
                                const wiggle = Vector.mult(transverse, wiggleMag * Math.cos(this.cycle * 0.35) * ((i % 2) ? -1 : 1))
                                Matter.Body.setPosition(this, Vector.add(this.position, wiggle))
                            }
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
            description: "launch <strong>homing</strong> missiles that <strong class='color-e'>explode</strong><br>crouch to <strong>rapidly</strong> launch smaller missiles",
            ammo: 0,
            ammoPack: 3.5,
            have: false,
            fireCycle: 0,
            ammoLoaded: 0,
            fire() {
                const countReduction = Math.pow(0.9, tech.missileCount)
                if (mech.crouch) {
                    mech.fireCDcycle = mech.cycle + 10 * b.fireCD / countReduction; // cool down

                    const size = countReduction * (tech.missileSize ? 1.32 : 0.88)
                    const where = {
                        x: mech.pos.x,
                        y: mech.pos.y - 40
                    }
                    for (let i = 0; i < tech.missileCount; i++) {
                        b.missile(where, -Math.PI / 2 + 0.2 * (Math.random() - 0.5) * Math.sqrt(tech.missileCount), -2, size)
                        bullet[bullet.length - 1].force.x += 0.004 * size * (i - (tech.missileCount - 1) / 2);
                    }
                } else {
                    mech.fireCDcycle = mech.cycle + 50 * b.fireCD / countReduction; // cool down

                    const size = countReduction * (tech.missileSize ? 1.5 : 1)
                    const direction = {
                        x: Math.cos(mech.angle),
                        y: Math.sin(mech.angle)
                    }
                    const push = Vector.mult(Vector.perp(direction), 0.02 * size / Math.sqrt(tech.missileCount))
                    const where = {
                        x: mech.pos.x + 40 * direction.x,
                        y: mech.pos.y + 40 * direction.y
                    }
                    for (let i = 0; i < tech.missileCount; i++) {
                        b.missile(where, mech.angle, 0, size)
                        bullet[bullet.length - 1].force.x += push.x * (i - (tech.missileCount - 1) / 2);
                        bullet[bullet.length - 1].force.y += push.y * (i - (tech.missileCount - 1) / 2);
                    }
                }


                // if (tech.missileCount) {
                //     if (mech.crouch) {
                //         for (let i = 0; i < 3; i++) {
                //             b.missile({
                //                 x: mech.pos.x,
                //                 y: mech.pos.y - 40
                //             }, -Math.PI / 2 + 0.08 * (1 - i) + 0.3 * (Math.random() - 0.5), 0, 0.6 * (tech.missileSize ? 1.5 : 1))
                //             bullet[bullet.length - 1].force.x -= 0.015 * (i - 1);
                //         }
                //     } else {
                //         mech.fireCDcycle = mech.cycle + 80 * b.fireCD; // cool down
                //         const direction = {
                //             x: Math.cos(mech.angle),
                //             y: Math.sin(mech.angle)
                //         }
                //         const push = Vector.mult(Vector.perp(direction), 0.02)
                //         for (let i = 0; i < 3; i++) {
                //             b.missile({
                //                 x: mech.pos.x + 40 * direction.x,
                //                 y: mech.pos.y + 40 * direction.y
                //             }, mech.angle + 0.06 * (Math.random() - 0.5), 5, 0.7 * (tech.missileSize ? 1.5 : 1))
                //             bullet[bullet.length - 1].force.x += push.x * (i - 1);
                //             bullet[bullet.length - 1].force.y += push.y * (i - 1);
                //         }
                //     }
                // } else {
                //     if (mech.crouch) {
                //         mech.fireCDcycle = mech.cycle + 10 * b.fireCD; // cool down
                //         const off = Math.random() - 0.5
                //         b.missile({
                //                 x: mech.pos.x,
                //                 y: mech.pos.y - 40
                //             },
                //             -Math.PI / 2 + 0.15 * off, 0, 0.83 * (tech.missileSize ? 1.5 : 1))
                //         bullet[bullet.length - 1].force.x += off * 0.03;
                //         // bullet[bullet.length - 1].force.y += push.y * (i - 1);
                //     } else {
                //         mech.fireCDcycle = mech.cycle + 55 * b.fireCD; // cool down

                //         // bullet[bullet.length - 1].force.y += 0.01; //a small push down at first to make it seem like the missile is briefly falling
                //     }

                // }
            }
        },
        {
            name: "grenades",
            description: "lob a single <strong>bouncy</strong> projectile<br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after one second",
            ammo: 0,
            ammoPack: 5,
            have: false,
            fire() {
                mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 40 : 30) * b.fireCD); // cool down
                b.grenade()
            },
        },
        {
            name: "mine",
            description: "toss a <strong>proximity</strong> mine that <strong>sticks</strong> to walls<br>fires <strong>nails</strong> at mobs within range",
            ammo: 0,
            ammoPack: 2.7,
            have: false,
            fire() {
                if (tech.isLaserMine) { //laser mine
                    const speed = mech.crouch ? 50 : 20
                    const velocity = { x: speed * Math.cos(mech.angle), y: speed * Math.sin(mech.angle) }
                    b.laserMine(mech.pos, velocity)
                } else { //normal mines
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
                    }, 0, tech.isMineAmmoBack)
                }
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
                bullet[me].totalSpores = 8 + 2 * tech.isFastSpores + 2 * tech.isSporeFreeze
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
                        if (tech.isSporeGrowth && !(simulation.cycle % 60)) { //release a spore
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
        // {
        //     name: "ice IX",
        //     description: "synthesize <strong>short-lived</strong> ice crystals<br>crystals <strong>seek</strong> out and <strong class='color-s'>freeze</strong> mobs",
        //     ammo: 0,
        //     ammoPack: 64,
        //     have: false,
        //     fire() {
        //         if (mech.crouch) {
        //             b.iceIX(10, 0.3)
        //             mech.fireCDcycle = mech.cycle + Math.floor(8 * b.fireCD); // cool down
        //         } else {
        //             b.iceIX(2)
        //             mech.fireCDcycle = mech.cycle + Math.floor(3 * b.fireCD); // cool down
        //         }

        //     }
        // },
        {
            name: "foam",
            description: "spray bubbly foam that <strong>sticks</strong> to mobs<br><strong class='color-s'>slows</strong> mobs and does <strong class='color-d'>damage</strong> over time",
            ammo: 0,
            ammoPack: 35,
            have: false,
            fire() {
                mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 20 : 6) * b.fireCD); // cool down
                const radius = (mech.crouch ? 10 + 5 * Math.random() : 4 + 6 * Math.random()) + (tech.isAmmoFoamSize && this.ammo < 300) * 12
                const SPEED = 18 - radius * 0.4;
                const dir = mech.angle + 0.2 * (Math.random() - 0.5)
                const velocity = {
                    x: SPEED * Math.cos(dir),
                    y: SPEED * Math.sin(dir)
                }
                const position = {
                    x: mech.pos.x + 30 * Math.cos(mech.angle),
                    y: mech.pos.y + 30 * Math.sin(mech.angle)
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
                            if (tech.isRailAreaDamage) {
                                mob[i].force.x += 2 * FORCE.x;
                                mob[i].force.y += 2 * FORCE.y;
                                const damage = b.dmgScale * 0.13 * Math.sqrt(DEPTH)
                                mob[i].damage(damage);
                                mob[i].locatePlayer();
                                simulation.drawList.push({ //add dmg to draw queue
                                    x: mob[i].position.x,
                                    y: mob[i].position.y,
                                    radius: Math.log(2 * damage + 1.1) * 40,
                                    color: "rgba(100,0,200,0.25)",
                                    time: simulation.drawTime
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
                            body[i].force.y += FORCE.y - body[i].mass * simulation.g * 1.5; //kick up a bit to give them some arc
                        }
                    }
                }

                if (tech.isCapacitor) {
                    if (mech.energy > 0.16 || tech.isRailEnergyGain) {
                        mech.energy += 0.16 * (tech.isRailEnergyGain ? 6 : -1)
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
                            endCycle: simulation.cycle + 140,
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
                                if (tech.fragments && this.speed > 10) {
                                    b.targetedNail(this.position, tech.fragments * 10)
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
                                    const unitVector = Vector.normalise(Vector.sub(simulation.mouseInGame, mech.pos))
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
                            if (tech.fragments && this.speed > 10) {
                                b.targetedNail(this.position, tech.fragments * 16)
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
                        if (mech.energy < 0.005 && !tech.isRailEnergyGain) {
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
                            this.endCycle = simulation.cycle + 140
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
                            if (tech.isRailEnergyGain) {
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
                                        results = simulation.checkLineIntersection(v1, v1End, vertices[j], vertices[j + 1]);
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
                                    results = simulation.checkLineIntersection(v1, v1End, vertices[0], vertices[len]);
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
                            const unitVector = Vector.normalise(Vector.sub(simulation.mouseInGame, mech.pos))
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
            description: "emit a <strong>beam</strong> of collimated coherent <strong class='color-laser'>light</strong><br>drains <strong class='color-f'>energy</strong> instead of ammunition",
            ammo: 0,
            ammoPack: Infinity,
            have: false,
            nextFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
            fire() {

            },
            chooseFireMethod() {
                if (tech.isPulseLaser) {
                    this.fire = this.firePulse
                } else if (tech.beamSplitter) {
                    this.fire = this.fireSplit
                } else if (tech.historyLaser) {
                    this.fire = this.fireHistory
                } else if (tech.isWideLaser) {
                    this.fire = this.fireWideBeam
                } else {
                    this.fire = this.fireLaser
                }
            },
            fireLaser() {
                if (mech.energy < tech.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + tech.laserFieldDrain * tech.isLaserDiode
                    b.laser();
                }
            },

            // laser(where = {
            //     x: mech.pos.x + 20 * Math.cos(mech.angle),
            //     y: mech.pos.y + 20 * Math.sin(mech.angle)
            // }, whereEnd = {
            //     x: where.x + 3000 * Math.cos(mech.angle),
            //     y: where.y + 3000 * Math.sin(mech.angle)
            // }, dmg = tech.laserDamage, reflections = tech.laserReflections, isThickBeam = false, push = 1) {
            fireSplit() {
                if (mech.energy < tech.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + tech.laserFieldDrain * tech.isLaserDiode
                    const divergence = mech.crouch ? 0.15 : 0.2
                    const scale = Math.pow(0.9, tech.beamSplitter)
                    const pushScale = scale * scale
                    let dmg = tech.laserDamage * scale //Math.pow(0.9, tech.laserDamage)
                    const where = {
                        x: mech.pos.x + 20 * Math.cos(mech.angle),
                        y: mech.pos.y + 20 * Math.sin(mech.angle)
                    }
                    b.laser(where, {
                        x: where.x + 3000 * Math.cos(mech.angle),
                        y: where.y + 3000 * Math.sin(mech.angle)
                    }, dmg, tech.laserReflections, false, pushScale)
                    for (let i = 1; i < 1 + tech.beamSplitter; i++) {
                        b.laser(where, {
                            x: where.x + 3000 * Math.cos(mech.angle + i * divergence),
                            y: where.y + 3000 * Math.sin(mech.angle + i * divergence)
                        }, dmg, tech.laserReflections, false, pushScale)
                        b.laser(where, {
                            x: where.x + 3000 * Math.cos(mech.angle - i * divergence),
                            y: where.y + 3000 * Math.sin(mech.angle - i * divergence)
                        }, dmg, tech.laserReflections, false, pushScale)
                    }
                }
            },
            fireWideBeam() {
                if (mech.energy < tech.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + tech.laserFieldDrain * tech.isLaserDiode
                    const dmg = 0.55 * tech.laserDamage //  3.5 * 0.55 = 200% more damage
                    const eye = {
                        x: mech.pos.x + 16 * Math.cos(mech.angle),
                        y: mech.pos.y + 16 * Math.sin(mech.angle)
                    }
                    const wideLaser = function(where = {
                        x: mech.pos.x + 30 * Math.cos(mech.angle),
                        y: mech.pos.y + 30 * Math.sin(mech.angle)
                    }, angle = mech.angle) {
                        ctx.strokeStyle = "#f00";
                        ctx.lineWidth = 8
                        ctx.globalAlpha = 0.5;
                        ctx.beginPath();
                        const off = 7.5
                        b.laser(where, {
                            x: eye.x + 3000 * Math.cos(angle),
                            y: eye.y + 3000 * Math.sin(angle)
                        }, dmg, 0, true, 0.3)

                        for (let i = 1; i < tech.wideLaser; i++) {
                            let whereOff = Vector.add(where, {
                                x: i * off * Math.cos(angle + Math.PI / 2),
                                y: i * off * Math.sin(angle + Math.PI / 2)
                            })
                            if (Matter.Query.ray(map, eye, whereOff).length === 0) {
                                ctx.moveTo(eye.x, eye.y)
                                ctx.lineTo(whereOff.x, whereOff.y)
                                b.laser(whereOff, {
                                    x: whereOff.x + 3000 * Math.cos(angle),
                                    y: whereOff.y + 3000 * Math.sin(angle)
                                }, dmg, 0, true, 0.3)
                            }
                            whereOff = Vector.add(where, {
                                x: i * off * Math.cos(angle - Math.PI / 2),
                                y: i * off * Math.sin(angle - Math.PI / 2)
                            })
                            if (Matter.Query.ray(map, eye, whereOff).length === 0) {
                                ctx.moveTo(eye.x, eye.y)
                                ctx.lineTo(whereOff.x, whereOff.y)
                                b.laser(whereOff, {
                                    x: whereOff.x + 3000 * Math.cos(angle),
                                    y: whereOff.y + 3000 * Math.sin(angle)
                                }, dmg, 0, true, 0.3)
                            }
                        }
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                    wideLaser();
                }
            },
            fireHistory() {
                if (mech.energy < tech.laserFieldDrain) {
                    mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
                } else {
                    mech.fireCDcycle = mech.cycle
                    mech.energy -= mech.fieldRegen + tech.laserFieldDrain * tech.isLaserDiode
                    const dmg = 0.4 * tech.laserDamage //  3.5 * 0.55 = 200% more damage
                    const spacing = Math.ceil(5.2 - 0.2 * tech.historyLaser)
                    ctx.beginPath();
                    b.laser({
                        x: mech.pos.x + 20 * Math.cos(mech.angle),
                        y: mech.pos.y + 20 * Math.sin(mech.angle)
                    }, {
                        x: mech.pos.x + 3000 * Math.cos(mech.angle),
                        y: mech.pos.y + 3000 * Math.sin(mech.angle)
                    }, dmg, 0, true, 0.2);
                    for (let i = 1, len = 5 + tech.historyLaser * 5; i < len; i++) {
                        const history = mech.history[(mech.cycle - i * spacing) % 600]
                        b.laser({
                            x: history.position.x + 20 * Math.cos(history.angle),
                            y: history.position.y + 20 * Math.sin(history.angle) - mech.yPosDifference
                        }, {
                            x: history.position.x + 3000 * Math.cos(history.angle),
                            y: history.position.y + 3000 * Math.sin(history.angle) - mech.yPosDifference
                        }, dmg, 0, true, 0.2);
                    }
                    ctx.strokeStyle = "#f00";
                    ctx.lineWidth = 1
                    ctx.stroke();
                }
            },
            firePulse() {
                mech.fireCDcycle = mech.cycle + Math.floor((tech.isPulseAim ? 25 : 50) * b.fireCD); // cool down
                let energy = 0.27 * Math.min(mech.energy, 1.5)
                mech.energy -= energy * tech.isLaserDiode
                if (tech.beamSplitter) {
                    energy *= Math.pow(0.9, tech.beamSplitter)
                    b.pulse(energy, mech.angle)
                    for (let i = 1; i < 1 + tech.beamSplitter; i++) {
                        b.pulse(energy, mech.angle - i * 0.27)
                        b.pulse(energy, mech.angle + i * 0.27)
                    }
                } else {
                    b.pulse(energy, mech.angle)
                }
            },
        },
    ],
    gunRewind: { //this gun is added with a tech
        name: "CPT gun",
        description: "use <strong class='color-f'>energy</strong> to <strong>rewind</strong> your <strong class='color-h'>health</strong>, <strong>velocity</strong>,<br> and <strong>position</strong> up to <strong>10</strong> seconds",
        ammo: 0,
        ammoPack: Infinity,
        have: false,
        isRewinding: false,
        lastFireCycle: 0,
        holdCount: 0,
        activeGunIndex: null,
        fire() {
            if (this.lastFireCycle === mech.cycle - 1) { //button has been held down
                this.rewindCount += 8;
                const DRAIN = 0.01
                let history = mech.history[(mech.cycle - this.rewindCount) % 600]
                if (this.rewindCount > 599 || mech.energy < DRAIN || history.activeGun !== this.activeGunIndex) {
                    this.rewindCount = 0;
                    mech.resetHistory();
                    mech.fireCDcycle = mech.cycle + Math.floor(120 * b.fireCD); // cool down
                } else {
                    mech.energy -= DRAIN
                    mech.immuneCycle = mech.cycle + 30; //player is immune to collision damage for 5 cycles
                    Matter.Body.setPosition(player, history.position);
                    Matter.Body.setVelocity(player, { x: history.velocity.x, y: history.velocity.y });
                    if (mech.health !== history.health) {
                        mech.health = history.health
                        mech.displayHealth();
                    }
                }
            } else { //button is held the first time
                this.rewindCount = 0;
                this.activeGunIndex = b.activeGun
            }
            this.lastFireCycle = mech.cycle;
        }
    }
};