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

// function playerHeadCheck(event) {
//   //runs on collisions events
//   if (mech.crouch) {
//     mech.isHeadClear = true;
//     const pairs = event.pairs;
//     for (let i = 0, j = pairs.length; i != j; ++i) {
//       if (pairs[i].bodyA === headSensor) {
//         mech.isHeadClear = false;
//       } else if (pairs[i].bodyB === headSensor) {
//         mech.isHeadClear = false;
//       }
//     }
//   }
// }

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
    // if (game.isBodyDamage) {
    //   if (pairs[i].bodyA === playerBody || pairs[i].bodyA === playerHead) {
    //     collidePlayer(pairs[i].bodyB)
    //   } else if (pairs[i].bodyB === playerBody || pairs[i].bodyB === playerHead) {
    //     collidePlayer(pairs[i].bodyA)
    //   }
    // }

    // function collidePlayer(obj) {
    //   //player dmg from hitting a body
    //   if (obj.classType === "body" && obj.speed > 10 && mech.immuneCycle < mech.cycle) {
    //     const velocityThreshold = 30 //keep this lines up with player.enterLand numbers  (130/5 = 26)
    //     if (player.position.y > obj.position.y) { //block is above the player look at total momentum difference
    //       const velocityDiffMag = Vector.magnitude(Vector.sub(player.velocity, obj.velocity))
    //       if (velocityDiffMag > velocityThreshold) hit(velocityDiffMag - velocityThreshold)
    //     } else { //block is below player only look at horizontal momentum difference
    //       const velocityDiffMagX = Math.abs(obj.velocity.x - player.velocity.x)
    //       if (velocityDiffMagX > velocityThreshold) hit(velocityDiffMagX - velocityThreshold)
    //     }

    //     function hit(dmg) {
    //       mech.immuneCycle = mech.cycle + mod.collisionImmuneCycles; //player is immune to collision damage for 30 cycles
    //       dmg = Math.min(Math.max(Math.sqrt(dmg) * obj.mass * 0.01, 0.02), 0.15);
    //       mech.damage(dmg);
    //       game.drawList.push({ //add dmg to draw queue
    //         x: pairs[i].activeContacts[0].vertex.x,
    //         y: pairs[i].activeContacts[0].vertex.y,
    //         radius: dmg * 500,
    //         color: game.mobDmgColor,
    //         time: game.drawTime
    //       });
    //     }
    //   }
    // }

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
          if (mech.immuneCycle < mech.cycle && (obj === playerBody || obj === playerHead)) {
            // const a = Object.values(event.pairs[0].contacts)
            // contains = Matter.Bounds.contains({
            //   max: {
            //     x: player.position.x + 60,
            //     y: player.position.y + 120
            //   },
            //   min: {
            //     x: player.position.x - 60,
            //     y: player.position.y + 40
            //   }
            // }, {
            //   x: a[0].vertex.x,
            //   y: a[0].vertex.y
            // })
            // // Matter.Query.point([jumpSensor], point)
            // console.log(contains)
            // if (!contains) {

            mech.immuneCycle = mech.cycle + mod.collisionImmuneCycles; //player is immune to collision damage for 30 cycles
            mob[k].foundPlayer();
            let dmg = Math.min(Math.max(0.025 * Math.sqrt(mob[k].mass), 0.05), 0.3) * game.dmgScale; //player damage is capped at 0.3*dmgScale of 1.0
            if (mod.isPiezo) {
              mech.energy = mech.maxEnergy;
              dmg *= 0.85
            }
            mech.damage(dmg);
            if (mob[k].onHit) mob[k].onHit(k);

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

            if (mod.isAnnihilation && !mob[k].shield && !mob[k].isShielded && mech.energy > 0.2) {
              mech.energy -= 0.2
              mech.immuneCycle = 0; //player doesn't go immune to collision damage
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
            return;
            // }
          }
          //mob + bullet collisions
          if (obj.classType === "bullet" && obj.speed > obj.minDmgSpeed) {
            // const dmg = b.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)));
            let dmg = b.dmgScale * (obj.dmg + 0.15 * obj.mass * Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity)))
            if (mod.isCrit && !mob[k].seePlayer.recall && !mob[k].shield) dmg *= 5
            mob[k].foundPlayer();
            mob[k].damage(dmg);
            obj.onDmg(mob[k]); //some bullets do actions when they hits things, like despawn //forces don't seem to work here
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
          if (obj.classType === "body" && obj.speed > 6) {
            const v = Vector.magnitude(Vector.sub(mob[k].velocity, obj.velocity));
            if (v > 9) {
              let dmg = b.dmgScale * v * obj.mass * 0.065 * mod.throwChargeRate;
              if (mod.isCrit && !mob[k].seePlayer.recall && !mob[k].shield) dmg *= 5
              if (mob[k].isShielded) dmg *= 0.5
              mob[k].damage(dmg, true);
              if (mob[k].distanceToPlayer2() < 1000000) mob[k].foundPlayer();
              game.drawList.push({
                x: pairs[i].activeContacts[0].vertex.x,
                y: pairs[i].activeContacts[0].vertex.y,
                radius: Math.log(2 * dmg + 1.1) * 40,
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
  // playerHeadCheck(event);
  collisionChecks(event);
});
Events.on(engine, "collisionActive", function (event) {
  playerOnGroundCheck(event);
  // playerHeadCheck(event);
});
Events.on(engine, "collisionEnd", function (event) {
  playerOffGroundCheck(event);
});