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
// engine.enableSleeping = true

//to reduce lag, maybe
engine.constraintIterations = 1; //default is 2
// engine.positionIterations = 4; //default is 6
// engine.velocityIterations = 2; //default is 4



// const removalQueue = [];

// // Helper to queue any type of removal
// function queueRemoval(type, index) {
//     // Avoid duplicate entries
//     if (!removalQueue.some(r => r.type === type && r.index === index)) {
//         removalQueue.push({ type, index });
//     }
// }

// Events.on(engine, 'afterUpdate', () => {
//     // Grouped by type, sort each group descending so splices don't shift indices
//     const types = ['map', 'body', 'mob', 'powerUp', 'cons', 'consBB', 'bullet', 'composite'];

//     types.forEach(type => {
//         const entries = removalQueue
//             .filter(r => r.type === type)
//             .map(r => r.index)
//             .sort((a, b) => b - a);

//         entries.forEach(i => {
//             switch (type) {
//                 case 'map':
//                     Matter.Composite.remove(engine.world, map[i]);
//                     map.splice(i, 1);
//                     break;
//                 case 'body':
//                     Matter.Composite.remove(engine.world, body[i]);
//                     body.splice(i, 1);
//                     break;
//                 case 'mob':
//                     Matter.Composite.remove(engine.world, mob[i]);
//                     mob.splice(i, 1);
//                     break;
//                 case 'powerUp':
//                     Matter.Composite.remove(engine.world, powerUp[i]);
//                     powerUp.splice(i, 1);
//                     break;
//                 case 'cons':
//                     Matter.Composite.remove(engine.world, cons[i]);
//                     cons.splice(i, 1);
//                     break;
//                 case 'consBB':
//                     Matter.Composite.remove(engine.world, consBB[i]);
//                     consBB.splice(i, 1);
//                     break;
//                 case 'bullet':
//                     Matter.Composite.remove(engine.world, bullet[i]);
//                     bullet.splice(i, 1);
//                     break;
//                 case 'composite':
//                     Matter.Composite.remove(engine.world, composite[i]);
//                     composite.splice(i, 1);
//                     break;
//             }
//         });
//     });

//     removalQueue.length = 0;
// });








// matter events
function playerOnGroundCheck(event) {
    //runs on collisions events
    function enter() {
        m.numTouching++;
        // m.groundCount++
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
                if (momentum > m.hardLanding && !(input.up && Math.abs(player.velocity.x) > 7.5)) { //&& !input.up
                    m.doCrouch();
                    m.yOff = m.yOffWhen.jump;
                    m.hardLandCD = m.cycle + m.hardLandCDScale * Math.min(momentum / 6.5 - 6, 40)
                    // m.hardLandCD = m.cycle + m.hardLandCDScale * Math.min(0.2 * momentum - 7.5, 60)
                    if (tech.isFallWave && tech.isFallingDamage && momentum < 150) {
                        simulation.ephemera.push({
                            count: Math.floor(0.13 * m.hardLandCDScale * (momentum / 6.5 - 6)), //cycles before it self removes
                            where: { x: m.pos.x, y: m.pos.y + 140 },
                            do() {
                                this.count--
                                if (this.count < 0) simulation.removeEphemera(this)
                                b.isoWave360Solo(this.where, 39 * Math.sqrt(tech.bulletsLastLonger))
                            },
                        })
                    }
                } else {
                    m.yOffGoal = m.yOffWhen.stand;
                }
                //falling damage
                if (tech.isFallingDamage && m.immuneCycle < m.cycle && momentum > 150) {
                    // m.takeDamage(Math.min(Math.sqrt(momentum - 100) * 0.02, 0.4) * spawn.dmgToPlayerByLevelsCleared());
                    const dmg = Math.min(Math.sqrt(momentum - 100) * 0.04, 0.8)
                    m.takeDamage(dmg);
                    if (tech.isFallWave) {
                        simulation.ephemera.push({
                            count: Math.floor(0.13 * m.hardLandCDScale * (momentum / 6.5 - 6)), //cycles before it self removes
                            where: { x: m.pos.x, y: m.pos.y + 140 },
                            do() {
                                this.count--
                                if (this.count < 0) simulation.removeEphemera(this)
                                b.isoWave360Solo(this.where, 333 * Math.sqrt(tech.bulletsLastLonger))
                            },
                        })
                    }
                    if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                }
            }
        }
    }


    for (let i = 0, j = event.pairs.length; i != j; ++i) {
        if (event.pairs[i].bodyA === jumpSensor) {
            m.standingOn = event.pairs[i].bodyB; //keeping track to correctly provide recoil on jump
            if (m.standingOn.alive !== true || m.immuneCycle > m.cycle) enter();
        }

        //doesn't seem to need to check bodyB (this might be because the player is added so it's earlier in array?)
        // else if (event.pairs[i].bodyB === jumpSensor) {
        //     m.standingOn = event.pairs[i].bodyA; //keeping track to correctly provide recoil on jump
        //     if (m.standingOn.alive !== true || m.immuneCycle > m.cycle) enter();
        // }
    }
    m.numTouching = 0;
}

function playerOffGroundCheck(event) {
    //runs on collisions events
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; ++i) {
        if (pairs[i].bodyA === jumpSensor) { //|| pairs[i].bodyB === jumpSensor) {
            if (m.onGround && m.numTouching === 0) {
                m.onGround = false;
                // m.groundCount = 0
                m.lastOnGroundCycle = m.cycle;
                m.hardLandCD = 0 // disable hard landing
                // if (m.checkHeadClear()) {
                //     if (m.crouch) {
                //         m.undoCrouch();
                //     }
                //     m.yOffGoal = m.yOffWhen.jump;
                // }
                if (m.crouch && m.checkHeadClear()) {
                    m.undoCrouch();
                }
                m.yOffGoal = m.yOffWhen.jump;
            }
        }
    }
}

function collisionChecks(event) {
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; i++) {
        //mob + (player,bullet,body) collisions
        const pair = pairs[i]
        const bodyA = pair.bodyA.parent && pair.bodyA.parent.mob ? pair.bodyA.parent : pair.bodyA
        const bodyB = pair.bodyB.parent && pair.bodyB.parent.mob ? pair.bodyB.parent : pair.bodyB
        let who
        let obj
        if (bodyA.mob && bodyA.alive) {
            who = bodyA
            obj = bodyB
        } else if (bodyB.mob && bodyB.alive) {
            who = bodyB
            obj = bodyA
        } else {
            continue
        }

        collideMob(who, obj, pair)
    }

    function collideMob(who, obj, pair) {
                    //player + mob collision
                    if (
                        m.immuneCycle < m.cycle &&
                        (obj === playerBody || obj === playerHead) &&
                        !who.isSlowed && !who.isStunned
                    ) {
                        let dmg = Math.min(Math.max(0.025 * Math.sqrt(who.mass), 0.05), 0.3) * who.damageScale();
                        who.foundPlayer();
                        if (tech.isRewindAvoidDeath && m.energy > 0.85 * Math.min(1, m.maxEnergy) && dmg > 0.01) { //CPT reversal runs in m.damage, but it stops the rest of the collision code here too
                            m.takeDamage(dmg);
                            return
                        }
                        m.takeDamage(dmg); //normal damage

                        if (tech.isCollisionRealitySwitch && m.alive) {
                            m.switchWorlds("Hilbert space")
                            simulation.trails(90)
                            simulation.inGameConsole(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
                        }
                        if (tech.isPiezo) {
                            m.energy += 20.48 * level.isReducedRegen;
                            for (let i = 0; i < 9; i++)simulation.energyGenGraphic()
                        }
                        if (tech.isConchoidal) {
                            m.damageDone /= tech.conchoidalDamage
                            tech.conchoidalDamage = 1
                        }

                        if (tech.isCouplingNoHit && m.coupling > 0) {
                            m.couplingChange(-3)

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
                        }
                        if (tech.isHarpoonDefense) { //fire harpoons at mobs after getting hit
                            const maxCount = 10 + 3 * tech.extraHarpoons //scale the number of hooks fired
                            let count = maxCount - 1
                            const angle = Math.atan2(who.position.y - player.position.y, who.position.x - player.position.x);
                            const mass = 0.75 * ((tech.isLargeHarpoon) ? 1 + Math.min(0.05 * Math.sqrt(b.guns[9].ammo), 10) : 1)
                            b.harpoon(m.pos, who, angle, mass, true, 7, false) // harpoon(where, target, angle = m.angle, harpoonSize = 1, isReturn = false, totalCycles = 35, isReturnAmmo = true, thrust = 0.1) {
                            bullet[bullet.length - 1].drain = 0
                            for (; count > 0; count--) {
                                b.harpoon(m.pos, who, angle + count * 2 * Math.PI / maxCount, mass, true, 7, false)
                                bullet[bullet.length - 1].drain = 0
                            }
                        }
                        if (tech.isStimulatedEmission) powerUps.ejectTech()
                        if (who.onHit) who.onHit();
                        if (m.immuneCycle < m.cycle + m.collisionImmuneCycles) m.immuneCycle = m.cycle + m.collisionImmuneCycles; //player is immune to damage for 30 cycles
                        //extra kick between player and mob              //this section would be better with forces but they don't work...
                        let angle = Math.atan2(player.position.y - who.position.y, player.position.x - who.position.x);
                        Matter.Body.setVelocity(player, { x: player.velocity.x + 8 * Math.cos(angle), y: player.velocity.y + 8 * Math.sin(angle) });
                        Matter.Body.setVelocity(who, { x: who.velocity.x - 8 * Math.cos(angle), y: who.velocity.y - 8 * Math.sin(angle) });
                        if (tech.isAnnihilation && !who.shield && !who.isShielded && !who.isBoss && who.isDropPowerUp && m.energy > 0.08 && who.damageReduction > 0) {
                            m.energy -= 0.08 //* Math.max(m.maxEnergy, m.energy) //0.33 * m.energy
                            if (m.immuneCycle === m.cycle + m.collisionImmuneCycles) m.immuneCycle = 0; //player doesn't go immune to collision damage
                            who.death();
                            simulation.drawList.push({ //add dmg to draw queue
                                x: pair.activeContacts[0].vertex.x,
                                y: pair.activeContacts[0].vertex.y,
                                radius: Math.sqrt(dmg) * 500,
                                color: "rgba(255,0,255,0.2)",
                                time: simulation.drawTime
                            });
                        } else {
                            simulation.drawList.push({ //add dmg to draw queue
                                x: pair.activeContacts[0].vertex.x,
                                y: pair.activeContacts[0].vertex.y,
                                radius: Math.sqrt(dmg) * 200,
                                color: simulation.mobDmgColor,
                                time: simulation.drawTime
                            });
                        }
                        // return;
                        // }
                    } else {
                        //mob + bullet collisions
                        if (obj.classType === "bullet" && obj.speed > obj.minDmgSpeed && !m.isTimeDilated && who.damageReduction) {

                            obj.beforeDmg(who); //some bullets do actions when they hits things, like despawn //forces don't seem to work here
                            let dmg = (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(who.velocity, obj.velocity)))
                            if (tech.isCrit && who.isStunned) dmg *= 4
                            if (!obj.isNotCollisionsDmg) who.damage(dmg, false, { x: pair.activeContacts[0].vertex.x, y: pair.activeContacts[0].vertex.y }, true)
                            if (who.alive) who.foundPlayer();
                            simulation.drawList.push({ //add dmg to draw queue
                                x: pair.activeContacts[0].vertex.x,
                                y: pair.activeContacts[0].vertex.y,
                                radius: Math.log(dmg + 1.1) * 40 * who.damageReduction + 3,
                                color: simulation.playerDmgColor,
                                time: simulation.drawTime
                            });
                            if (tech.isLessDamageReduction && !who.shield) who.damageReduction *= who.isBoss ? (who.isFinalBoss ? 1.0005 : 1.0025) : 1.05

                            return;
                        }
                        //mob + body collisions
                        if (obj.classType === "body" && obj.speed > 9) {
                            const v = Vector.magnitude(Vector.sub(who.velocity, obj.velocity));
                            if (v > 11) {
                                let dmg = tech.blockDamage * v * obj.mass * (tech.isMobBlockFling ? 2.5 : 1) * (tech.isBlockRestitution ? 2.5 : 1) * ((m.fieldMode === 0 || m.fieldMode === 8) ? 1 + 0.05 * m.coupling : 1);
                                if (who.isShielded) dmg *= 0.7

                                if (tech.isIrradiated) {
                                    mobs.statusDoT(who, dmg * 0.62, tech.isLongRadiation ? 715392000 : 180) // one tick every 30 cycles
                                    dmg *= 0.5
                                }
                                who.damage(dmg, false, { x: pair.activeContacts[0].vertex.x, y: pair.activeContacts[0].vertex.y }, true)

                                if (tech.isBlockPowerUps && !who.alive && who.isDropPowerUp && Math.random() < 0.5) {
                                    options = ["coupling", "boost", "heal", "research", "ammo"]
                                    powerUps.spawn(who.position.x, who.position.y, options[Math.floor(Math.random() * options.length)]);
                                }

                                const stunTime = dmg / Math.sqrt(obj.mass)
                                if (stunTime > 0.5 && who.memory !== Infinity) mobs.statusStun(who, 60 + 60 * Math.sqrt(stunTime))
                                if (who.alive && who.distanceToPlayer2() < 1000000 && !m.isCloak) who.foundPlayer();
                                if (tech.fragments && obj.speed > 10 && !obj.hasFragmented) {
                                    obj.hasFragmented = true;
                                    b.targetedNail(obj.position, tech.fragments * 4)
                                }
                                if (who.damageReduction) {
                                    simulation.drawList.push({
                                        x: pair.activeContacts[0].vertex.x,
                                        y: pair.activeContacts[0].vertex.y,
                                        radius: Math.log(dmg + 1.1) * 40 * who.damageReduction + 3,
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

function trackLastTouchedBlock(event) {
    const isPlayerPart = who => who === playerBody || who === playerHead || who === jumpSensor
    for (let i = 0; i < event.pairs.length; i++) {
        const pair = event.pairs[i]
        let candidate = null
        if (isPlayerPart(pair.bodyA)) {
            candidate = pair.bodyB
        } else if (isPlayerPart(pair.bodyB)) {
            candidate = pair.bodyA
        }
        if (candidate && candidate.parent && candidate.parent !== candidate && candidate.parent.classType === "body") candidate = candidate.parent
        if (candidate && candidate.classType === "body" && !candidate.isNotHoldable && !candidate.isInvulnerable && body.includes(candidate)) {
            lastTouchedBlock = candidate
        }
    }
}


Events.on(engine, "collisionStart", function (event) {
    playerOnGroundCheck(event);
    trackLastTouchedBlock(event);
    // playerHeadCheck(event);
    collisionChecks(event);


    // //do we need to also check bodyB
    // for (let i = 0, j = event.pairs.length; i != j; ++i) {
    //     if (event.pairs[i].bodyA === jumpSensor) {
    //         player.collision.isJump = true
    //     } else if (event.pairs[i].bodyA === playerBody) {
    //         player.collision.isBody = true
    //     } else if (event.pairs[i].bodyA === playerHead) {
    //         player.collision.isHead = true
    //     } else if (event.pairs[i].bodyA === headSensor) {
    //         player.collision.isHeadSensor = true
    //     }
    // }
});
Events.on(engine, "collisionActive", function (event) {
    playerOnGroundCheck(event);
    // playerHeadCheck(event);
});
Events.on(engine, "collisionEnd", function (event) {
    playerOffGroundCheck(event);

    // for (let i = 0, j = event.pairs.length; i != j; ++i) {
    //     if (event.pairs[i].bodyA === jumpSensor) {
    //         player.collision.isJump = false
    //     } else if (event.pairs[i].bodyA === playerBody) {
    //         player.collision.isBody = false
    //     } else if (event.pairs[i].bodyA === playerHead) {
    //         player.collision.isHead = false
    //     } else if (event.pairs[i].bodyA === headSensor) {
    //         player.collision.isHeadSensor = false
    //     }
    // }
});
