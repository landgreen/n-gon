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

// matter events *********************************************************
//************************************************************************
//************************************************************************
//************************************************************************

function playerOnGroundCheck(event) {
  //runs on collisions events
  function enter() {
    mech.numTouching++;
    if (!mech.onGround) mech.enterLand();
  }
  const pairs = event.pairs;
  for (let i = 0, j = pairs.length; i != j; ++i) {
    let pair = pairs[i];
    if (pair.bodyA === jumpSensor) {
      mech.standingOn = pair.bodyB; //keeping track to correctly provide recoil on jump
      if (mech.standingOn.alive !== true) enter();
    } else if (pair.bodyB === jumpSensor) {
      mech.standingOn = pair.bodyA; //keeping track to correctly provide recoil on jump
      if (mech.standingOn.alive !== true) enter();
    }
  }
  mech.numTouching = 0;
}

function playerOffGroundCheck(event) {
  //runs on collisions events
  function enter() {
    if (mech.onGround && mech.numTouching === 0) mech.enterAir();
  }
  const pairs = event.pairs;
  for (let i = 0, j = pairs.length; i != j; ++i) {
    if (pairs[i].bodyA === jumpSensor) {
      enter();
    } else if (pairs[i].bodyB === jumpSensor) {
      enter();
    }
  }
}

function playerHeadCheck(event) {
  //runs on collisions events
  if (mech.crouch) {
    mech.isHeadClear = true;
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; ++i) {
      if (pairs[i].bodyA === headSensor) {
        mech.isHeadClear = false;
      } else if (pairs[i].bodyB === headSensor) {
        mech.isHeadClear = false;
      }
    }
  }
}

function collisionChecks(event) {
  const pairs = event.pairs;
  for (let i = 0, j = pairs.length; i != j; i++) {

    // //map + bullet collisions
    // if (pairs[i].bodyA.collisionFilter.category === cat.map && pairs[i].bodyB.collisionFilter.category === cat.bullet) {
    //   collideBulletStatic(pairs[i].bodyB)
    // } else if (pairs[i].bodyB.collisionFilter.category === cat.map && pairs[i].bodyA.collisionFilter.category === cat.bullet) {
    //   collideBulletStatic(pairs[i].bodyA)
    // }
    // //triggers when the bullets hits something static
    // function collideBulletStatic(obj, speedThreshold = 12, massThreshold = 2) {
    //   if (obj.onWallHit) obj.onWallHit();
    // }


    //body + player collision
    if (game.isBodyDamage) {
      if (pairs[i].bodyA === playerBody || pairs[i].bodyA === playerHead) {
        collidePlayer(pairs[i].bodyB)
      } else if (pairs[i].bodyB === playerBody || pairs[i].bodyB === playerHead) {
        collidePlayer(pairs[i].bodyA)
      }
    }

    function collidePlayer(obj, speedThreshold = 12, massThreshold = 2) {
      if (obj.classType === "body" && obj.speed > speedThreshold && obj.mass > massThreshold) { //dmg from hitting a body
        const v = Vector.magnitude(Vector.sub(player.velocity, obj.velocity));
        if (v > speedThreshold && mech.collisionImmune < mech.cycle) {
          mech.collisionImmune = mech.cycle + b.modCollisionImmuneCycles; //player is immune to collision damage for 30 cycles
          let dmg = Math.sqrt((v - speedThreshold + 0.1) * (obj.mass - massThreshold)) * 0.01;
          dmg = Math.min(Math.max(dmg, 0.02), 0.15);
          mech.damage(dmg);
          game.drawList.push({ //add dmg to draw queue
            x: pairs[i].activeContacts[0].vertex.x,
            y: pairs[i].activeContacts[0].vertex.y,
            radius: dmg * 500,
            color: game.mobDmgColor,
            time: game.drawTime
          });
          return;
        }
      }
    }

    //mob + (player,bullet,body) collisions
    for (let k = 0; k < mob.length; k++) {
      if (mob[k].alive && mech.alive) {
        if (pairs[i].bodyA === mob[k]) {
          collideMob(pairs[i].bodyB);
          break;
        } else if (pairs[i].bodyB === mob[k]) {
          collideMob(pairs[i].bodyA);
          break;
        }

        function collideMob(obj) {
          //player + mob collision
          if (mech.collisionImmune < mech.cycle && (obj === playerBody || obj === playerHead)) {
            mech.collisionImmune = mech.cycle + b.modCollisionImmuneCycles; //player is immune to collision damage for 30 cycles
            mob[k].foundPlayer();
            let dmg = Math.min(Math.max(0.025 * Math.sqrt(mob[k].mass), 0.05), 0.3) * game.dmgScale; //player damage is capped at 0.3*dmgScale of 1.0
            mech.damage(dmg);
            if (mob[k].onHit) mob[k].onHit(k);
            if (b.isModPiezo) mech.fieldMeter = mech.fieldEnergyMax;
            if (b.isModAnnihilation && mob[k].dropPowerUp && !mob[k].isShielded) {
              mob[k].death();
              game.drawList.push({
                //add dmg to draw queue
                x: pairs[i].activeContacts[0].vertex.x,
                y: pairs[i].activeContacts[0].vertex.y,
                radius: dmg * 2000,
                color: "rgba(255,0,255,0.2)",
                time: game.drawTime
              });
            } else {
              game.drawList.push({
                //add dmg to draw queue
                x: pairs[i].activeContacts[0].vertex.x,
                y: pairs[i].activeContacts[0].vertex.y,
                radius: dmg * 500,
                color: game.mobDmgColor,
                time: game.drawTime
              });

            }
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
            return;
          }
          //mob + bullet collisions
          if (obj.classType === "bullet" && obj.speed > obj.minDmgSpeed) {
            // const dmg = b.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)));
            let dmg = b.dmgScale * (obj.dmg + b.modAcidDmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)))
            if (b.isModCrit && !mob[k].seePlayer.recall && !mob[k].shield) dmg *= 5
            mob[k].foundPlayer();
            mob[k].damage(dmg);
            obj.onDmg(mob[k]); //some bullets do actions when they hits things, like despawn
            game.drawList.push({ //add dmg to draw queue
              x: pairs[i].activeContacts[0].vertex.x,
              y: pairs[i].activeContacts[0].vertex.y,
              radius: Math.log(2 * dmg + 1.1) * 40,
              color: game.playerDmgColor,
              time: game.drawTime
            });
            return;
          }
          //mob + body collisions
          if (obj.classType === "body" && obj.speed > 5) {
            const v = Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity));
            if (v > 8) {
              let dmg = b.dmgScale * (b.modAcidDmg + v * Math.sqrt(obj.mass) * 0.07);
              mob[k].damage(dmg);
              if (mob[k].distanceToPlayer2() < 1000000) mob[k].foundPlayer();
              game.drawList.push({
                //add dmg to draw queue
                x: pairs[i].activeContacts[0].vertex.x,
                y: pairs[i].activeContacts[0].vertex.y,
                radius: Math.sqrt(dmg) * 40,
                color: game.playerDmgColor,
                time: game.drawTime
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
Events.on(engine, "collisionStart", function (event) {
  playerOnGroundCheck(event);
  playerHeadCheck(event);
  collisionChecks(event);
});
Events.on(engine, "collisionActive", function (event) {
  playerOnGroundCheck(event);
  playerHeadCheck(event);
});
Events.on(engine, "collisionEnd", function (event) {
  playerOffGroundCheck(event);
});