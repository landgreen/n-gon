//matter.js ***********************************************************
// module aliases
const Engine = Matter.Engine,
    World = Matter.World,
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
                        (obj === playerBody || obj === playerHead) &&
                        // (obj === player) &&
                        !(tech.isFreezeHarmImmune && (mob[k].isSlowed || mob[k].isStunned))
                    ) {
                        mob[k].foundPlayer();
                        let dmg = Math.min(Math.max(0.025 * Math.sqrt(mob[k].mass), 0.05), 0.3) * simulation.dmgScale; //player damage is capped at 0.3*dmgScale of 1.0
                        if (tech.isRewindAvoidDeath && m.energy > 0.66) { //CPT reversal runs in m.damage, but it stops the rest of the collision code here too
                            m.damage(dmg);
                            return
                        }

                        if (tech.isFlipFlopHarm) {
                            if (!tech.isFlipFlopHarmImmune) {
                                tech.isFlipFlopHarmImmune = true
                                if (document.getElementById("tech-flip-flop")) document.getElementById("tech-flip-flop").innerHTML = ` = <strong>on</strong>`
                                m.damage(dmg * 1.25); //damage triggers immune to next hit with extra 10% damage
                            } else {
                                tech.isFlipFlopHarmImmune = false //immune to damage this hit, lose immunity for next hit
                                if (document.getElementById("tech-flip-flop")) document.getElementById("tech-flip-flop").innerHTML = ` = <strong>off</strong>`
                            }
                        } else {
                            m.damage(dmg); //normal damage
                        }

                        if (tech.isPiezo) m.energy += 20.48;
                        if (tech.isBayesian) powerUps.ejectTech()
                        if (mob[k].onHit) mob[k].onHit(k);
                        m.immuneCycle = m.cycle + tech.collisionImmuneCycles; //player is immune to collision damage for 30 cycles
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

                        if (tech.isAnnihilation && !mob[k].shield && !mob[k].isShielded && mob[k].dropPowerUp && m.energy > 0.34 * m.maxEnergy) {
                            m.energy -= 0.33 * m.maxEnergy
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
                        let dmg = b.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)))
                        if (tech.isCrit && mob[k].isStunned) dmg *= 4
                        mob[k].foundPlayer();
                        mob[k].damage(dmg);
                        simulation.drawList.push({ //add dmg to draw queue
                            x: pairs[i].activeContacts[0].vertex.x,
                            y: pairs[i].activeContacts[0].vertex.y,
                            radius: Math.log(2 * dmg + 1.1) * 40,
                            color: simulation.playerDmgColor,
                            time: simulation.drawTime
                        });
                        return;
                    }
                    //mob + body collisions
                    if (obj.classType === "body" && obj.speed > 6) {
                        const v = Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity));
                        if (v > 9) {
                            let dmg = 0.05 * b.dmgScale * v * obj.mass * tech.throwChargeRate;
                            if (mob[k].isShielded) dmg *= 0.35
                            mob[k].damage(dmg, true);
                            if (tech.isBlockPowerUps && !mob[k].alive && mob[k].dropPowerUp) {
                                let type = tech.isEnergyNoAmmo ? "heal" : "ammo"
                                if (Math.random() < 0.4) {
                                    type = "heal"
                                } else if (Math.random() < 0.3 && !tech.isSuperDeterminism) {
                                    type = "research"
                                }
                                powerUps.spawn(mob[k].position.x, mob[k].position.y, type);
                                // for (let i = 0, len = Math.ceil(2 * Math.random()); i < len; i++) {}
                            }

                            const stunTime = dmg / Math.sqrt(obj.mass)
                            if (stunTime > 0.5) mobs.statusStun(mob[k], 30 + 60 * Math.sqrt(stunTime))
                            if (mob[k].distanceToPlayer2() < 1000000 && !m.isCloak) mob[k].foundPlayer();
                            if (tech.fragments && obj.speed > 10 && !obj.hasFragmented) {
                                obj.hasFragmented = true;
                                b.targetedNail(obj.position, tech.fragments * 4)
                            }
                            simulation.drawList.push({
                                x: pairs[i].activeContacts[0].vertex.x,
                                y: pairs[i].activeContacts[0].vertex.y,
                                radius: Math.log(2 * dmg + 1.1) * 40,
                                color: simulation.playerDmgColor,
                                time: simulation.drawTime
                            });
                            return;
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