//matter.js ***********************************************************
// module aliases
const Engine = Matter.Engine,
    Events = Matter.Events,
    Composites = Matter.Composites,
    Composite = Matter.Composite,
    Constraint = Matter.Constraint,
    Vertices = Matter.Vertices,
    Query = Matter.Query,
    Body = Matter.Body,
    Bodies = Matter.Bodies,
    Vector = Matter.Vector;

// create an engine
const engine = Engine.create();
engine.world.gravity.scale = 0; //turn off gravity (it's added back in later)
// engine.velocityIterations = 100
// engine.positionIterations = 100
// engine.enableSleeping = true

// matter events
function playerOnGroundCheck(event) {
    //runs on collisions events
    function enter() {
        m.numTouching++;
        if (!m.onGround) {
            m.onGround = true;
            if (m.crouch) {
                if (m.checkHeadClear()) {
                    m.undoCrouch();
                } else {
                    m.yOffGoal = m.yOffWhen.crouch;
                }
            } else {
                //sets a hard land where player stays in a crouch for a bit and can't jump
                //crouch is forced in groundControl below
                const momentum = player.velocity.y * player.mass //player mass is 5 so this triggers at 26 down velocity, unless the player is holding something
                if (momentum > 130) {
                    m.doCrouch();
                    m.yOff = m.yOffWhen.jump;
                    m.hardLandCD = m.cycle + Math.min(momentum / 6.5 - 6, 40)
                    //falling damage
                    if (tech.isFallingDamage && m.immuneCycle < m.cycle && momentum > 150) {
                        m.damage(Math.min(Math.sqrt(momentum - 133) * 0.01, 0.25));
                        if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                    }
                } else {
                    m.yOffGoal = m.yOffWhen.stand;
                }
            }
        }
    }

    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; ++i) {
        let pair = pairs[i];
        if (pair.bodyA === jumpSensor) {
            m.standingOn = pair.bodyB; //keeping track to correctly provide recoil on jump
            if (m.standingOn.alive !== true) enter();
        } else if (pair.bodyB === jumpSensor) {
            m.standingOn = pair.bodyA; //keeping track to correctly provide recoil on jump
            if (m.standingOn.alive !== true) enter();
        }
    }
    m.numTouching = 0;
}

function playerOffGroundCheck(event) {
    //runs on collisions events
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; ++i) {
        if (pairs[i].bodyA === jumpSensor || pairs[i].bodyB === jumpSensor) {
            if (m.onGround && m.numTouching === 0) {
                m.onGround = false;
                m.lastOnGroundCycle = m.cycle;
                m.hardLandCD = 0 // disable hard landing
                if (m.checkHeadClear()) {
                    if (m.crouch) {
                        m.undoCrouch();
                    }
                    m.yOffGoal = m.yOffWhen.jump;
                }
            }
        }
    }
}

function collisionChecks(event) {
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; i++) {
        //mob + (player,bullet,body) collisions
        for (let k = 0; k < mob.length; k++) {
            if (mob[k].alive) {
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
                        (obj === playerBody || obj === playerHead) &&
                        !mob[k].isSlowed && !mob[k].isStunned
                    ) {
                        let dmg = Math.min(Math.max(0.025 * Math.sqrt(mob[k].mass), 0.05), 0.3) * simulation.dmgScale; //player damage is capped at 0.3*dmgScale of 1.0
                        if (m.isCloak) dmg *= 0.75
                        mob[k].foundPlayer();
                        if (tech.isRewindAvoidDeath && m.energy > 0.66 && dmg > 0.01) { //CPT reversal runs in m.damage, but it stops the rest of the collision code here too
                            m.damage(dmg);
                            return
                        }
                        if (tech.isFlipFlop) {
                            if (tech.isFlipFlopOn) {
                                tech.isFlipFlopOn = false
                                if (document.getElementById("tech-flip-flop")) document.getElementById("tech-flip-flop").innerHTML = ` = <strong>OFF</strong>`
                                m.eyeFillColor = 'transparent'
                                m.damage(dmg);
                                if (tech.isFlipFlopCoupling) {
                                    m.couplingChange(-5)
                                    for (let i = 0; i < mob.length; i++) {
                                        if (mob[i].isDecoupling) mob[i].alive = false //remove WIMP
                                    }
                                    spawn.WIMP()
                                    mob[mob.length - 1].isDecoupling = true //so you can find it to remove
                                }
                            } else {
                                tech.isFlipFlopOn = true //immune to damage this hit, lose immunity for next hit
                                if (document.getElementById("tech-flip-flop")) document.getElementById("tech-flip-flop").innerHTML = ` = <strong>ON</strong>`
                                m.eyeFillColor = m.fieldMeterColor //'#0cf'
                                if (!tech.isFlipFlopHarm) m.damage(dmg);
                                if (tech.isFlipFlopCoupling) {
                                    m.couplingChange(5)
                                    for (let i = 0; i < mob.length; i++) {
                                        if (mob[i].isDecoupling) mob[i].alive = false //remove WIMP
                                    }
                                }
                            }
                            if (tech.isFlipFlopHealth) {
                                m.setMaxHealth();
                                for (let i = 0; i < powerUp.length; i++) {
                                    if (powerUp[i].name === "heal") {
                                        const oldSize = powerUp[i].size
                                        powerUp[i].size = powerUps.heal.size() //update current heals
                                        const scale = powerUp[i].size / oldSize
                                        Matter.Body.scale(powerUp[i], scale, scale); //grow    
                                    }
                                }
                            }
                        } else {
                            m.damage(dmg); //normal damage
                        }

                        if (tech.isCollisionRealitySwitch) {
                            m.switchWorlds()
                            simulation.trails()
                            simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
                        }
                        if (tech.isPiezo) m.energy += 20.48;
                        if (tech.isCouplingNoHit && m.coupling > 0) {
                            m.couplingChange(-0.5)

                            const unit = Vector.rotate({ x: 1, y: 0 }, 6.28 * Math.random())
                            let where = Vector.add(m.pos, Vector.mult(unit, 17))
                            simulation.drawList.push({ //add dmg to draw queue
                                x: where.x,
                                y: where.y,
                                radius: 22,
                                color: 'rgba(0, 171, 238, 0.33)',
                                time: 8
                            });
                            where = Vector.add(m.pos, Vector.mult(unit, 60))
                            simulation.drawList.push({ //add dmg to draw queue
                                x: where.x,
                                y: where.y,
                                radius: 18,
                                color: 'rgba(0, 171, 238, 0.5)',
                                time: 16
                            });
                            where = Vector.add(m.pos, Vector.mult(unit, 100))
                            simulation.drawList.push({ //add dmg to draw queue
                                x: where.x,
                                y: where.y,
                                radius: 14,
                                color: 'rgba(0, 171, 238, 0.6)',
                                time: 24
                            });
                            where = Vector.add(m.pos, Vector.mult(unit, 135))
                            simulation.drawList.push({ //add dmg to draw queue
                                x: where.x,
                                y: where.y,
                                radius: 10,
                                color: 'rgba(0, 171, 238, 0.7)',
                                time: 32
                            });
                            // simulation.drawList.push({ //add dmg to draw queue
                            //     x: m.pos.x,
                            //     y: m.pos.y,
                            //     radius: 150,
                            //     color: 'rgba(0, 171, 238, 0.33)',
                            //     time: 6
                            // });
                            // simulation.drawList.push({ //add dmg to draw queue
                            //     x: m.pos.x,
                            //     y: m.pos.y,
                            //     radius: 75,
                            //     color: 'rgba(0, 171, 238, 0.5)',
                            //     time: 16
                            // });
                            // simulation.drawList.push({ //add dmg to draw queue
                            //     x: m.pos.x,
                            //     y: m.pos.y,
                            //     radius: 25,
                            //     color: 'rgba(0, 171, 238, 0.75)',
                            //     time: 25
                            // });
                        }
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

                        if (tech.isAnnihilation && !mob[k].shield && !mob[k].isShielded && !mob[k].isBoss && mob[k].isDropPowerUp && m.energy > 0.34 * m.maxEnergy && mob[k].damageReduction > 0) {
                            m.energy -= 0.33 * Math.max(m.maxEnergy, m.energy) //0.33 * m.energy
                            if (m.immuneCycle === m.cycle + m.collisionImmuneCycles) m.immuneCycle = 0; //player doesn't go immune to collision damage
                            mob[k].death();
                            simulation.drawList.push({ //add dmg to draw queue
                                x: pairs[i].activeContacts[0].vertex.x,
                                y: pairs[i].activeContacts[0].vertex.y,
                                radius: Math.sqrt(dmg) * 500,
                                color: "rgba(255,0,255,0.2)",
                                time: simulation.drawTime
                            });
                        } else {
                            simulation.drawList.push({ //add dmg to draw queue
                                x: pairs[i].activeContacts[0].vertex.x,
                                y: pairs[i].activeContacts[0].vertex.y,
                                radius: Math.sqrt(dmg) * 200,
                                color: simulation.mobDmgColor,
                                time: simulation.drawTime
                            });
                        }
                        // return;
                        // }
                    } else {
                        //mob + bullet collisions
                        if (obj.classType === "bullet" && obj.speed > obj.minDmgSpeed) {
                            obj.beforeDmg(mob[k]); //some bullets do actions when they hits things, like despawn //forces don't seem to work here
                            let dmg = m.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)))
                            if (tech.isCrit && mob[k].isStunned) dmg *= 4
                            // console.log(dmg) //remove this
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
                            if (tech.isLessDamageReduction && !mob[k].shield) mob[k].damageReduction *= mob[k].isBoss ? (mob[k].isFinalBoss ? 1.0005 : 1.0025) : 1.05
                            return;
                        }
                        //mob + body collisions
                        if (obj.classType === "body" && obj.speed > 6) {
                            const v = Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity));
                            if (v > 9) {
                                if (tech.blockDmg) { //electricity
                                    Matter.Body.setVelocity(mob[k], { x: 0.5 * mob[k].velocity.x, y: 0.5 * mob[k].velocity.y });
                                    if (tech.isBlockRadiation && !mob[k].isShielded && !mob[k].isMobBullet) {
                                        mobs.statusDoT(mob[k], tech.blockDmg * m.dmgScale * 4 / 12, 360) //200% increase -> x (1+2) //over 7s -> 360/30 = 12 half seconds -> 3/12
                                    } else {
                                        mob[k].damage(tech.blockDmg * m.dmgScale)
                                        simulation.drawList.push({
                                            x: pairs[i].activeContacts[0].vertex.x,
                                            y: pairs[i].activeContacts[0].vertex.y,
                                            radius: 28 * mob[k].damageReduction + 3,
                                            color: "rgba(255,0,255,0.8)",
                                            time: 4
                                        });
                                    }
                                }

                                let dmg = tech.blockDamage * m.dmgScale * v * obj.mass * (tech.isMobBlockFling ? 2.5 : 1) * (tech.isBlockRestitution ? 2.5 : 1) * ((m.fieldMode === 0 || m.fieldMode === 8) ? 1 + 0.4 * m.coupling : 1);
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
                                }

                                const stunTime = dmg / Math.sqrt(obj.mass)
                                if (stunTime > 0.5 && mob[k].memory !== Infinity) mobs.statusStun(mob[k], 60 + 60 * Math.sqrt(stunTime))
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

//determine if player is on the ground
Events.on(engine, "collisionStart", function(event) {
    playerOnGroundCheck(event);
    // playerHeadCheck(event);
    collisionChecks(event);
});
Events.on(engine, "collisionActive", function(event) {
    playerOnGroundCheck(event);
    // playerHeadCheck(event);
});
Events.on(engine, "collisionEnd", function(event) {
    playerOffGroundCheck(event);
});