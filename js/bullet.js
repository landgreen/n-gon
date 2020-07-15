let bullet = [];

const b = {
  dmgScale: null, //scales all gun damage from momentum, but not raw .dmg //set in levels.setDifficulty
  gravity: 0.0006, //most other bodies have   gravity = 0.001
  activeGun: null, //current gun in use by player
  inventoryGun: 0,
  inventory: [], //list of what guns player has  // 0 starts with basic gun
  fire() {
    if (game.mouseDown && mech.fireCDcycle < mech.cycle && (!(keys[32] || game.mouseDownRight) || mech.fieldFire) && b.inventory.length) {
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
            mech.damage(mod.isAmmoFromHealth * mech.maxHealth);
            powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
            if (Math.random() < mod.bayesian) powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
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
    b.fireCD = mod.fireRate * mod.slowFire * mod.rerollHaste / mod.fastTime
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
        onDmg() {}, //this.endCycle = 0  //triggers despawn
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
        onDmg() {}, //this.endCycle = 0  //triggers despawn
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
  explosion(where, radius) {
    radius *= mod.explosionRadius
    // typically explode is used for some bullets with .onEnd
    //add dmg to draw queue
    game.drawList.push({
      x: where.x,
      y: where.y,
      radius: radius,
      color: "rgba(255,25,0,0.6)",
      time: game.drawTime
    });
    let dist, sub, knock;
    let dmg = b.dmgScale * radius * 0.009;

    const alertRange = 100 + radius * 2; //alert range
    //add alert to draw queue
    game.drawList.push({
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
        mech.energy += Math.max(radius * 0.0003, 0.15)
      } else {
        mech.damage(radius * 0.0002); //normal player damage from explosions
        mech.drop();
      }
      knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 30);
      player.force.x += knock.x;
      player.force.y += knock.y;
    } else if (dist < alertRange) {
      knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 55);
      player.force.x += knock.x;
      player.force.y += knock.y;
    }

    //body knock backs
    for (let i = 0, len = body.length; i < len; ++i) {
      sub = Vector.sub(where, body[i].position);
      dist = Vector.magnitude(sub);
      if (dist < radius) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 18);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 40);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      }
    }

    //power up knock backs
    for (let i = 0, len = powerUp.length; i < len; ++i) {
      sub = Vector.sub(where, powerUp[i].position);
      dist = Vector.magnitude(sub);
      if (dist < radius) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 30);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 45);
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
          if (mob[i].shield) dmg *= 3 //balancing explosion dmg to shields
          if (Matter.Query.ray(map, mob[i].position, where).length > 0) dmg *= 0.5 //reduce damage if a wall is in the way
          mob[i].damage(dmg * damageScale);
          mob[i].locatePlayer();
          knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 50);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
          radius *= 0.95 //reduced range for each additional explosion target
          damageScale *= 0.85 //reduced damage for each additional explosion target
        } else if (!mob[i].seePlayer.recall && dist < alertRange) {
          mob[i].locatePlayer();
          knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 80);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
        }
      }
    }
  },
  missile(where, dir, speed, size = 1, spawn = 0) {
    const me = bullet.length;
    bullet[me] = Bodies.rectangle(where.x, where.y, 30 * size, 4 * size, b.fireAttributes(dir));
    const thrust = 0.00417 * bullet[me].mass;
    Matter.Body.setVelocity(bullet[me], {
      x: mech.Vx / 2 + speed * Math.cos(dir),
      y: mech.Vy / 2 + speed * Math.sin(dir)
    });
    World.add(engine.world, bullet[me]); //add bullet to world
    bullet[me].frictionAir = 0.023
    bullet[me].endCycle = game.cycle + Math.floor((280 + 40 * Math.random()) * mod.isBulletsLastLonger);
    bullet[me].explodeRad = 170 + 60 * Math.random();
    bullet[me].lookFrequency = Math.floor(21 + Math.random() * 7);
    bullet[me].onEnd = function () {
      b.explosion(this.position, this.explodeRad * size); //makes bullet do explosive damage at end
      for (let i = 0; i < spawn; i++) {
        b.missile(this.position, 2 * Math.PI * Math.random(), 0, 0.7 * size)
      }
    }
    bullet[me].onDmg = function () {
      this.tryToLockOn();
      this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
    };
    bullet[me].lockedOn = null;
    bullet[me].tryToLockOn = function () {
      this.lockedOn = null;
      let closeDist = Infinity;

      //look for closest target to where the missile will be in 30 cycles
      const futurePos = Vector.add(this.position, Vector.mult(this.velocity, 30))
      for (let i = 0, len = mob.length; i < len; ++i) {
        if (
          mob[i].alive && mob[i].dropPowerUp &&
          Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
          Matter.Query.ray(body, this.position, mob[i].position).length === 0
        ) {
          const futureDist = Vector.magnitude(Vector.sub(futurePos, mob[i].position));
          if (futureDist < closeDist) {
            closeDist = futureDist;
            this.lockedOn = mob[i];
            this.frictionAir = 0.05; //extra friction once a target it locked
          }
        }
      }
      //explode when bullet is close enough to target
      if (this.lockedOn && Vector.magnitude(Vector.sub(this.position, this.lockedOn.position)) < this.explodeRad) {
        // console.log('hit')
        this.endCycle = 0; //bullet ends cycle after doing damage  //also triggers explosion
        this.lockedOn.damage(b.dmgScale * 4 * size); //does extra damage to target
      }
    };
    bullet[me].do = function () {
      if (!mech.isBodiesAsleep) {
        if (!(mech.cycle % this.lookFrequency)) {
          this.tryToLockOn();
        }

        //rotate missile towards the target
        if (this.lockedOn) {
          const face = {
            x: Math.cos(this.angle),
            y: Math.sin(this.angle)
          };
          const target = Vector.normalise(Vector.sub(this.position, this.lockedOn.position));
          if (Vector.dot(target, face) > -0.98) {
            if (Vector.cross(target, face) > 0) {
              Matter.Body.rotate(this, 0.08);
            } else {
              Matter.Body.rotate(this, -0.08);
            }
          }
        }
        //accelerate in direction bullet is facing
        const dir = this.angle; // + (Math.random() - 0.5);
        this.force.x += Math.cos(dir) * thrust;
        this.force.y += Math.sin(dir) * thrust;

        //draw rocket
        ctx.beginPath();
        ctx.arc(this.position.x - Math.cos(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          this.position.y - Math.sin(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          11 * size, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,155,0,0.5)";
        ctx.fill();
      } else {
        //draw rocket  with time stop
        ctx.beginPath();
        ctx.arc(this.position.x - Math.cos(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          this.position.y - Math.sin(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          11 * size, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,155,0,0.5)";
        ctx.fill();
      }
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
      onDmg() {},
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
                  this.arm();

                  //sometimes the mine can't attach to map and it just needs to be reset
                  const that = this
                  setTimeout(function () {
                    if (Matter.Query.collides(that, map).length === 0 || Matter.Query.point(map, that.position).length > 0) {
                      // console.log(that)
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

            }
          }
        } else {
          if (this.speed < 1 && this.angularSpeed < 0.01 && !mech.isBodiesAsleep) {
            this.stillCount++
          }
        }
        if (this.stillCount > 25) this.arm();
      },
      arm() {
        this.lookFrequency = game.cycle + 60
        this.do = function () { //overwrite the do method for this bullet
          this.force.y += this.mass * 0.002; //extra gravity

          if (game.cycle > this.lookFrequency) {
            this.isArmed = true
            this.lookFrequency = 50 + Math.floor(27 * Math.random())
            game.drawList.push({
              //add dmg to draw queue
              x: this.position.x,
              y: this.position.y,
              radius: 10,
              color: "#f00",
              time: 4
            });
            this.do = function () { //overwrite the do method for this bullet
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
    bullet[bIndex] = Bodies.polygon(where.x, where.y, 5, side, {
      // density: 0.0015,			//frictionAir: 0.01,
      inertia: Infinity,
      isFreeze: isFreeze,
      restitution: 0.5,
      angle: Math.random() * 2 * Math.PI,
      friction: 0,
      frictionAir: 0.025,
      thrust: (mod.isFastSpores ? 0.001 : 0.0004) * (1 + 0.3 * (Math.random() - 0.5)),
      dmg: mod.isMutualism ? 5.6 : 2.8, //2x bonus damage from mod.isMutualism
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
      onDmg(who) {
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
      onDmg(who) {
        mobs.statusSlow(who, 60)
        this.endCycle = game.cycle
        if (mod.isHeavyWater) mobs.statusDoT(who, 0.1, 180)
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
    const THRUST = mod.isFastDrones ? 0.0025 : 0.0015
    const FRICTION = mod.isFastDrones ? 0.008 : 0.0005
    const dir = mech.angle + 0.4 * (Math.random() - 0.5);
    const RADIUS = (4.5 + 3 * Math.random())
    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 8, RADIUS, {
      angle: dir,
      inertia: Infinity,
      friction: 0.05,
      frictionAir: FRICTION,
      restitution: 1,
      dmg: 0.28, //damage done in addition to the damage from momentum
      lookFrequency: 100 + Math.floor(23 * Math.random()),
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
      onDmg(who) {
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
            if (!this.lockedOn && !mod.isArmorFromPowerUps) {
              //grab a power up if it is (ammo) or (a heal when player is low)
              let closeDist = Infinity;
              for (let i = 0, len = powerUp.length; i < len; ++i) {
                if (
                  ((powerUp[i].name !== "field" && powerUp[i].name !== "heal") || (powerUp[i].name === "heal" && mech.health < 0.9 * mech.maxHealth)) &&
                  Matter.Query.ray(map, this.position, powerUp[i].position).length === 0 &&
                  Matter.Query.ray(body, this.position, powerUp[i].position).length === 0
                ) {
                  const TARGET_VECTOR = Vector.sub(this.position, powerUp[i].position)
                  const DIST = Vector.magnitude(TARGET_VECTOR);
                  if (DIST < closeDist) {
                    if (DIST < 60) { //eat the power up if close enough
                      powerUp[i].effect();
                      Matter.World.remove(engine.world, powerUp[i]);
                      powerUp.splice(i, 1);
                      break;
                    }
                    closeDist = DIST;
                    this.lockedOn = powerUp[i]
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
    radius *= Math.sqrt(mod.bulletSize)
    const me = bullet.length;
    bullet[me] = Bodies.polygon(position.x, position.y, 20, radius, {
      angle: 0,
      density: 0.00005, //  0.001 is normal density
      inertia: Infinity,
      frictionAir: 0.003,
      friction: 0.2,
      restitution: 0.2,
      dmg: 0.1, //damage done in addition to the damage from momentum
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
      onDmg(who) {
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
          //check for touching map

          // if (Matter.Query.collides(this, map).length > 0) {
          if (Matter.Query.point(map, this.position).length > 0) {
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
          if (this.count < 20) {
            this.count++
            //grow
            const SCALE = 1.06
            Matter.Body.scale(this, SCALE, SCALE);
            this.radius *= SCALE;
          } else {
            //shrink
            const SCALE = 1 - 0.005 / mod.isBulletsLastLonger
            Matter.Body.scale(this, SCALE, SCALE);
            this.radius *= SCALE;
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
              this.target.damage(b.dmgScale * 0.005, true); //shield damage bypass
              //shrink if mob is shielded
              const SCALE = 1 - 0.016 / mod.isBulletsLastLonger
              Matter.Body.scale(this, SCALE, SCALE);
              this.radius *= SCALE;
            } else {
              this.target.damage(b.dmgScale * 0.005);
            }
          } else if (this.target !== null) { //look for a new target
            this.target = null
            this.collisionFilter.category = cat.bullet;
            this.collisionFilter.mask = cat.mob //| cat.mobShield //cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
            if (mod.isFoamGrowOnDeath) {
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
          }
        }
      }
    });
    World.add(engine.world, bullet[me]); //add bullet to world
    Matter.Body.setVelocity(bullet[me], velocity);
  },
  targetedNail(position, num = 1, speed = 50 + 10 * Math.random(), range = 1200) {
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
      } else { // aim in random direction
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
    bullet[me] = Bodies.rectangle(pos.x, pos.y, 25, 2, b.fireAttributes(Math.atan2(velocity.y, velocity.x)));
    Matter.Body.setVelocity(bullet[me], velocity);
    World.add(engine.world, bullet[me]); //add bullet to world
    bullet[me].endCycle = game.cycle + 60 + 18 * Math.random();
    bullet[me].dmg = dmg
    bullet[me].onDmg = function (who) {
      if (mod.isNailPoison) {
        mobs.statusDoT(who, dmg * 0.055, 300) //66% / (360 / 30)  one tick every 30 cycles in 360 cycles total
      }
    };
    bullet[me].do = function () {};
  },
  randomBot(where = mech.pos, isKeep = true) {
    if (Math.random() < 0.05) { //very low chance of plasma bot
      b.plasmaBot(where)
      if (isKeep) mod.plasmaBotCount++;
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
      angle: dir,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.05,
      restitution: 0.6 * (1 + 0.5 * Math.random()),
      dmg: 0, // 0.14   //damage done in addition to the damage from momentum
      minDmgSpeed: 2,
      lookFrequency: 56 + Math.floor(17 * Math.random()),
      acceleration: 0.005 * (1 + 0.5 * Math.random()),
      range: 70 * (1 + 0.3 * Math.random()),
      endCycle: Infinity,
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
      },
      lockedOn: null,
      onDmg() {
        this.lockedOn = null
      },
      onEnd() {},
      do() {
        if (!(game.cycle % this.lookFrequency) && !mech.isStealth) {
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
          // this.frictionAir = 0.1
        } else { //close to player
          // this.frictionAir = 0
          //add player's velocity
          Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17)));
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
      angle: dir,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.05,
      restitution: 0.6 * (1 + 0.5 * Math.random()),
      dmg: 0, // 0.14   //damage done in addition to the damage from momentum
      minDmgSpeed: 2,
      lookFrequency: 47 + Math.floor(17 * Math.random()),
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
      onDmg() {
        this.lockedOn = null
      },
      onEnd() {},
      do() {
        if (this.cd < game.cycle && !(game.cycle % this.lookFrequency) && !mech.isStealth) {
          let target
          for (let i = 0, len = mob.length; i < len; i++) {
            const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
            if (dist < 1000000 && Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
              this.cd = game.cycle + this.delay;
              target = Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))
              const radius = 6 + 7 * Math.random()
              const SPEED = 29 - radius * 0.5; //(mech.crouch ? 32 : 20) - radius * 0.7;
              const velocity = Vector.mult(Vector.normalise(Vector.sub(target, this.position)), SPEED)
              b.foam(this.position, velocity, radius)
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
  plasmaBot(position = mech.pos) {
    const me = bullet.length;
    const dir = mech.angle;
    const RADIUS = 21
    bullet[me] = Bodies.polygon(position.x, position.y, 5, RADIUS, {
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
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
      },
      lockedOn: null,
      onDmg() {
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

        //fire plasma at target


        if (this.lockedOn && this.lockedOn.alive && mech.fieldCDcycle < mech.cycle) {
          const sub = Vector.sub(this.lockedOn.position, this.position)
          const DIST = Vector.magnitude(sub);
          const unit = Vector.normalise(sub)

          const DRAIN = 0.0022
          if (DIST < mod.isPlasmaRange * 550 && mech.energy > DRAIN) {
            mech.energy -= DRAIN;
            if (mech.energy < 0) {
              mech.fieldCDcycle = mech.cycle + 120;
              mech.energy = 0;
            }
            //calculate laser collision
            let best;
            let range = mod.isPlasmaRange * (140 + 300 * Math.sqrt(Math.random()))
            const path = [{
                x: this.position.x,
                y: this.position.y
              },
              {
                x: this.position.x + range * unit.x,
                y: this.position.y + range * unit.y
              }
            ];
            const vertexCollision = function (v1, v1End, domain) {
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
  boomBot(position = mech.pos) {
    const me = bullet.length;
    const dir = mech.angle;
    const RADIUS = (7 + 2 * Math.random())
    bullet[me] = Bodies.polygon(position.x, position.y, 4, RADIUS, {
      angle: dir,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.05,
      restitution: 1,
      dmg: 0,
      minDmgSpeed: 0,
      lookFrequency: 35 + Math.floor(7 * Math.random()),
      acceleration: 0.005 * (1 + 0.5 * Math.random()),
      range: 500 * (1 + 0.1 * Math.random()),
      endCycle: Infinity,
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
      },
      lockedOn: null,
      explode: 0,
      onDmg() {
        if (this.lockedOn) {
          const explosionRadius = Math.min(170, Vector.magnitude(Vector.sub(this.position, mech.pos)) - 30)
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
          if (!(game.cycle % this.lookFrequency) && !mech.isStealth) {
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
        if (this.lockedOn && this.lockedOn.alive) {
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
  laserBot(position = mech.pos) {
    const me = bullet.length;
    const dir = mech.angle;
    const RADIUS = (14 + 6 * Math.random())
    bullet[me] = Bodies.polygon(position.x, position.y, 3, RADIUS, {
      angle: dir,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.008 * (1 + 0.3 * Math.random()),
      restitution: 0.5 * (1 + 0.5 * Math.random()),
      dmg: 0, // 0.14   //damage done in addition to the damage from momentum
      minDmgSpeed: 2,
      lookFrequency: 27 + Math.floor(17 * Math.random()),
      acceleration: 0.0015 * (1 + 0.3 * Math.random()),
      range: 600 * (1 + 0.2 * Math.random()),
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
      onDmg() {
        this.lockedOn = null
      },
      onEnd() {},
      do() {
        //move in a circle
        // const radius = 1.5
        // this.offPlayer.x -= radius * Math.cos(game.cycle * 0.02)
        // this.offPlayer.y -= radius * Math.sin(game.cycle * 0.02)

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
        if (!(game.cycle % this.lookFrequency) && !mech.isStealth) {
          this.lockedOn = null;
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

          //randomize position relative to player
          if (Math.random() < 0.15) {
            this.offPlayer = {
              x: 120 * (Math.random() - 0.5),
              y: 120 * (Math.random() - 0.5) - 20,
            }
          }
        }

        //hit target with laser
        if (this.lockedOn && this.lockedOn.alive && mech.energy > 0.15) {
          mech.energy -= 0.0014 * mod.isLaserDiode
          //make sure you can still see vertex
          const DIST = Vector.magnitude(Vector.sub(this.vertices[0], this.lockedOn.position));
          if (DIST - this.lockedOn.radius < this.range + 150 &&
            Matter.Query.ray(map, this.vertices[0], this.lockedOn.position).length === 0 &&
            Matter.Query.ray(body, this.vertices[0], this.lockedOn.position).length === 0) {
            //move towards the target
            this.force = Vector.add(this.force, Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), 0.0013))

            //find the closest vertex
            let bestVertexDistance = Infinity
            let bestVertex = null
            for (let i = 0; i < this.lockedOn.vertices.length; i++) {
              const dist = Vector.magnitude(Vector.sub(this.vertices[0], this.lockedOn.vertices[i]));
              if (dist < bestVertexDistance) {
                bestVertex = i
                bestVertexDistance = dist
              }
            }
            const dmg = b.dmgScale * 0.05;
            this.lockedOn.damage(dmg);
            this.lockedOn.locatePlayer();

            ctx.beginPath(); //draw laser
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            ctx.lineTo(this.lockedOn.vertices[bestVertex].x, this.lockedOn.vertices[bestVertex].y);
            ctx.strokeStyle = "#f00";
            ctx.lineWidth = "2"
            ctx.lineDashOffset = 300 * Math.random()
            ctx.setLineDash([50 + 100 * Math.random(), 100 * Math.random()]);
            ctx.stroke();
            ctx.setLineDash([0, 0]);
            ctx.beginPath();
            ctx.arc(this.lockedOn.vertices[bestVertex].x, this.lockedOn.vertices[bestVertex].y, Math.sqrt(dmg) * 100, 0, 2 * Math.PI);
            ctx.fillStyle = "#f00";
            ctx.fill();
          }
        }
      }
    })
    World.add(engine.world, bullet[me]); //add bullet to world
  },
  giveGuns(gun = "random", ammoPacks = 6) {
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
      name: "minigun",
      description: "<strong>rapidly</strong> fire a stream of small <strong>bullets</strong><br>fire <strong>delay</strong> decreases as you shoot",
      ammo: 0,
      ammoPack: 75,
      defaultAmmoPack: 75,
      recordedAmmo: 0,
      have: false,
      isEasyToAim: false,
      nextFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
      startingHoldCycle: 0,
      fire() {
        const me = bullet.length;
        const dir = mech.angle + (Math.random() - 0.5) * ((mech.crouch) ? 0.01 : 0.1);
        bullet[me] = Bodies.rectangle(mech.pos.x + 23 * Math.cos(mech.angle), mech.pos.y + 23 * Math.sin(mech.angle), 20 * mod.bulletSize, 6 * mod.bulletSize, b.fireAttributes(dir));


        //fire delay decreases as you hold fire, down to 3 from 15
        if (this.nextFireCycle + 1 < mech.cycle) this.startingHoldCycle = mech.cycle //reset if not constantly firing
        const CD = Math.max(11 - 0.06 * (mech.cycle - this.startingHoldCycle), 2) //CD scales with cycles fire is held down
        this.nextFireCycle = mech.cycle + CD * b.fireCD //predict next fire cycle if the fire button is held down
        b.fireProps(CD, mech.crouch ? 38 : 34, dir, me); //cd , speed
        // b.fireProps(mech.crouch ? 7 : 4, mech.crouch ? 40 : 34, dir, me); //cd , speed

        bullet[me].endCycle = game.cycle + 70;
        bullet[me].dmg = 0.25;
        bullet[me].frictionAir = mech.crouch ? 0.001 : 0.003;
        if (mod.isIceCrystals) {
          bullet[me].onDmg = function (who) {
            mobs.statusSlow(who, 30)
          };
          mech.energy -= mech.fieldRegen + 0.0075
          if (mech.energy < 0.02) {
            mech.fireCDcycle = mech.cycle + 60; // cool down
          }
        }
        bullet[me].do = function () {
          this.force.y += this.mass * 0.0003;
        };
      }
    },
    {
      name: "shotgun",
      description: "fire a <strong>burst</strong> of short range <strong> bullets</strong> <br><em>crouch to reduce recoil</em>",
      ammo: 0,
      ammoPack: 9,
      have: false,
      isEasyToAim: true,
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
          knock = 0.08
        }

        if (mod.isShotgunRecoil) {
          mech.fireCDcycle -= 15
          player.force.x -= 2 * knock * Math.cos(mech.angle)
          player.force.y -= 2 * knock * Math.sin(mech.angle) //reduce knock back in vertical direction to stop super jumps
        } else {
          player.force.x -= knock * Math.cos(mech.angle)
          player.force.y -= knock * Math.sin(mech.angle) * 0.3 //reduce knock back in vertical direction to stop super jumps
        }



        b.muzzleFlash(35);
        if (mod.isNailShot) {
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
            b.nail(pos, velocity, 0.6)
          }
        } else {
          const side = 19 * mod.bulletSize
          for (let i = 0; i < 15; i++) {
            const me = bullet.length;
            const dir = mech.angle + (Math.random() - 0.5) * spread
            bullet[me] = Bodies.rectangle(mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5), mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5), side, side, b.fireAttributes(dir));
            World.add(engine.world, bullet[me]); //add bullet to world
            const SPEED = 50 + Math.random() * 10
            Matter.Body.setVelocity(bullet[me], {
              x: SPEED * Math.cos(dir),
              y: SPEED * Math.sin(dir)
            });
            bullet[me].endCycle = game.cycle + 40
            bullet[me].minDmgSpeed = 20
            // bullet[me].dmg = 0.1
            bullet[me].frictionAir = 0.034;
            bullet[me].do = function () {
              if (!mech.isBodiesAsleep) {
                const scale = 1 - 0.035 / mod.isBulletsLastLonger
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
      ammoPack: 15,
      have: false,
      num: 5,
      isEasyToAim: true,
      fire() {
        const SPEED = mech.crouch ? 40 : 30
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 28 : 20) * b.fireCD); // cool down
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
          bullet[me].endCycle = game.cycle + Math.floor((300 + 60 * Math.random()) * mod.isBulletsLastLonger);
          bullet[me].minDmgSpeed = 0;
          bullet[me].restitution = 0.999;
          bullet[me].friction = 0;
          bullet[me].do = function () {
            this.force.y += this.mass * 0.001;
          };
          bullet[me].onDmg = function (who) {
            mobs.statusStun(who, 180) // (2.3) * 2 / 14 ticks (2x damage over 7 seconds)
          };
        } else {
          b.muzzleFlash(20);
          const SPREAD = mech.crouch ? 0.08 : 0.15
          let dir = mech.angle - SPREAD * (mod.superBallNumber - 1) / 2;
          for (let i = 0; i < mod.superBallNumber; i++) {
            const me = bullet.length;
            bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 7 * mod.bulletSize, b.fireAttributes(dir, false));
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
            bullet[me].do = function () {
              this.force.y += this.mass * 0.001;
            };
            dir += SPREAD;
          }
        }
      }
    },
    {
      name: "flechettes",
      description: "fire a volley of <strong class='color-p'>uranium-235</strong> <strong>needles</strong><br>does <strong class='color-d'>damage</strong> over <strong>3</strong> seconds",
      ammo: 0,
      ammoPack: 42,
      defaultAmmoPack: 42,
      have: false,
      isEasyToAim: false,
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
          bullet[me].do = function () {
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
                      mobs.statusDoT(who, 3.6, 30)
                    } else {
                      mobs.statusDoT(who, 0.6, mod.isSlowDot ? 360 : 180)
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
              this.do = function () {}
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

        const CD = (mech.crouch) ? 68 : 35
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
      description: "emit a <strong>sine wave</strong> of oscillating particles<br>particles <strong>slowly</strong> propagate through <strong>solids</strong>",
      ammo: 0,
      ammoPack: 110,
      have: false,
      isEasyToAim: false,
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
            onDmg() {},
            onEnd() {},
            do() {
              if (!mech.isBodiesAsleep) {
                if (mod.isWaveReflect) {
                  // check if inside a mob
                  q = Matter.Query.point(mob, this.position)
                  for (let i = 0; i < q.length; i++) {
                    let dmg = b.dmgScale * 0.40 / Math.sqrt(q[i].mass) * (mod.waveHelix === 1 ? 1 : 0.6) //1 - 0.4 = 0.6 for helix mod 40% damage reduction
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
                        let dmg = b.dmgScale * 0.37 / Math.sqrt(q[i].mass) * (mod.waveHelix === 1 ? 1 : 0.6) //1 - 0.4 = 0.6 for helix mod 40% damage reduction
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
      ammoPack: 4,
      have: false,
      isEasyToAim: true,
      fireCycle: 0,
      ammoLoaded: 0,
      fire() {
        if (mod.is3Missiles) {
          if (mech.crouch) {
            mech.fireCDcycle = mech.cycle + 60 * b.fireCD; // cool down
            const direction = {
              x: Math.cos(mech.angle),
              y: Math.sin(mech.angle)
            }
            const push = Vector.mult(Vector.perp(direction), 0.0007)
            for (let i = 0; i < 3; i++) {
              //missile(where, dir, speed, size = 1, spawn = 0) {
              b.missile({
                x: mech.pos.x + 40 * direction.x,
                y: mech.pos.y + 40 * direction.y
              }, mech.angle + 0.06 * (1 - i), 0, 0.7, mod.babyMissiles)
              bullet[bullet.length - 1].force.x += push.x * (i - 1);
              bullet[bullet.length - 1].force.y += push.y * (i - 1);
            }
          } else {
            mech.fireCDcycle = mech.cycle + 45 * b.fireCD; // cool down
            const direction = {
              x: Math.cos(mech.angle),
              y: Math.sin(mech.angle)
            }
            const push = Vector.mult(Vector.perp(direction), 0.0008)
            for (let i = 0; i < 3; i++) {
              //missile(where, dir, speed, size = 1, spawn = 0) {
              b.missile({
                x: mech.pos.x + 40 * direction.x,
                y: mech.pos.y + 40 * direction.y
              }, mech.angle, 0, 0.7, mod.babyMissiles)
              bullet[bullet.length - 1].force.x += push.x * (i - 1);
              bullet[bullet.length - 1].force.y += push.y * (i - 1);
            }
          }
        } else {
          mech.fireCDcycle = mech.cycle + Math.floor(mech.crouch ? 45 : 30) * b.fireCD; // cool down
          b.missile({
              x: mech.pos.x + 40 * Math.cos(mech.angle),
              y: mech.pos.y + 40 * Math.sin(mech.angle) - 3
            },
            mech.angle + (0.5 - Math.random()) * (mech.crouch ? 0 : 0.2),
            -3 * (0.5 - Math.random()) + (mech.crouch ? 25 : -8) * b.fireCD,
            1, mod.babyMissiles)
          bullet[bullet.length - 1].force.y += 0.0006; //a small push down at first to make it seem like the missile is briefly falling
        }
      }
    },
    {
      name: "flak",
      description: "fire a <strong>cluster</strong> of short range <strong>projectiles</strong><br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after half a second",
      ammo: 0,
      ammoPack: 7,
      defaultAmmoPack: 7, //use to revert ammoPack after mod changes drop rate
      have: false,
      isEasyToAim: false,
      fire() {
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 25 : 10) * b.fireCD); // cool down
        b.muzzleFlash(30);
        const SPEED = mech.crouch ? 29 : 25
        const END = Math.floor(mech.crouch ? 30 : 18);
        const side1 = 17
        const side2 = 4
        const totalBullets = 6
        const angleStep = (mech.crouch ? 0.06 : 0.25) / totalBullets
        let dir = mech.angle - angleStep * totalBullets / 2;

        for (let i = 0; i < totalBullets; i++) { //5 -> 7
          dir += angleStep
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), side1, side2, b.fireAttributes(dir));
          World.add(engine.world, bullet[me]); //add bullet to world
          Matter.Body.setVelocity(bullet[me], {
            x: (SPEED + 15 * Math.random() - 2 * i) * Math.cos(dir),
            y: (SPEED + 15 * Math.random() - 2 * i) * Math.sin(dir)
          });

          bullet[me].endCycle = 2 * i + game.cycle + END
          bullet[me].restitution = 0;
          bullet[me].friction = 1;
          bullet[me].explodeRad = (mech.crouch ? 95 : 75) + (Math.random() - 0.5) * 50;
          bullet[me].onEnd = function () {
            b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
          }
          bullet[me].onDmg = function () {
            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
          };
          bullet[me].do = function () {
            this.force.y += this.mass * 0.0004;
          }
        }
      }
    },
    {
      name: "grenades",
      description: "lob a single <strong>bouncy</strong> projectile<br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after one second",
      ammo: 0,
      ammoPack: 7,
      have: false,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle; // + Math.random() * 0.05;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20, b.fireAttributes(dir, false));
        Matter.Body.setDensity(bullet[me], 0.0005);
        bullet[me].explodeRad = 275;
        bullet[me].onEnd = function () {
          b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
          if (mod.grenadeFragments) b.targetedNail(this.position, mod.grenadeFragments)
        }
        bullet[me].minDmgSpeed = 1;
        bullet[me].onDmg = function () {
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
          bullet[me].do = function () {
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
          bullet[me].explodeRad = 275;
          bullet[me].do = function () {
            //extra gravity for harder arcs
            this.force.y += this.mass * 0.0025;
          };
        }


      }
    },
    {
      name: "vacuum bomb",
      description: "fire a bomb that <strong>sucks</strong> before <strong class='color-e'>exploding</strong><br><strong>click</strong> left mouse again to <strong>detonate</strong>",
      ammo: 0,
      ammoPack: 3,
      have: false,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 35, b.fireAttributes(dir, false));
        b.fireProps(10, mech.crouch ? 42 : 28, dir, me); //cd , speed

        Matter.Body.setDensity(bullet[me], 0.0002);
        bullet[me].restitution = 0.2;
        bullet[me].friction = 0.3;
        bullet[me].endCycle = Infinity
        bullet[me].explodeRad = 440 + Math.floor(Math.random() * 30);
        bullet[me].onEnd = function () {
          b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end

          //also damage all mobs
          if (mod.isVacuumShield) {
            for (let i = 0, len = mob.length; i < len; ++i) {
              if (mob[i].shield) {
                const dist = Vector.magnitude(Vector.sub(this.position, mob[i].position)) - mob[i].radius;
                if (dist < this.explodeRad) mob[i].damage(Infinity);
              } else if (mob[i].alive && !mob[i].isShielded) {
                const dist = Vector.magnitude(Vector.sub(this.position, mob[i].position)) - mob[i].radius;
                if (dist < this.explodeRad) mob[i].damage(0.8 * b.dmgScale);
              }
            }
          }
        }
        bullet[me].onDmg = function () {
          // this.endCycle = 0; //bullet ends cycle after doing damage  //this triggers explosion
        };
        bullet[me].radius = 22; //used from drawing timer
        bullet[me].isArmed = false;
        bullet[me].isSucking = false;
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.0022;

          //set armed and sucking status
          if (!this.isArmed && !game.mouseDown) {
            this.isArmed = true
          } else if (this.isArmed && game.mouseDown && !this.isSucking) {
            this.isSucking = true;
            this.endCycle = game.cycle + 50;
          }

          if (this.isSucking) {
            if (!mech.isBodiesAsleep) {
              const that = this
              let mag = 0.1

              function suck(who, radius = that.explodeRad * 3.5) {
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
              if (game.cycle > this.endCycle - 5) {
                mag = -0.22
                suck(mob, this.explodeRad * 3)
                suck(body, this.explodeRad * 2)
                suck(powerUp, this.explodeRad * 1.5)
                suck(bullet, this.explodeRad * 1.5)
                suck([player], this.explodeRad * 1.5)
              } else {
                mag = 0.1
                suck(mob, this.explodeRad * 3)
                suck(body, this.explodeRad * 2)
                suck(powerUp, this.explodeRad * 1.5)
                suck(bullet, this.explodeRad * 1.5)
                suck([player], this.explodeRad * 1.5)
              }
              //keep bomb in place
              Matter.Body.setVelocity(this, {
                x: 0,
                y: 0
              });
              //draw suck
              const radius = 3 * this.explodeRad * (this.endCycle - game.cycle) / 50
              ctx.fillStyle = "rgba(0,0,0,0.1)";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
              ctx.fill();
            }
          } else {
            mech.fireCDcycle = mech.cycle + 10 //can't fire until after the explosion

            // flashing lights to show armed
            if (!(game.cycle % 10)) {
              if (this.isFlashOn) {
                this.isFlashOn = false;
              } else {
                this.isFlashOn = true;
              }
            }
            if (this.isFlashOn) {
              ctx.fillStyle = "#000";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
              ctx.fill();
              //draw clock on timer
              ctx.fillStyle = "#f04";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, this.radius * 0.7, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }
    },
    {
      name: "neutron bomb",
      description: "toss a chunk of <strong class='color-p'>Cf-252</strong> that emits <strong class='color-p'>neutrons</strong><br><strong class='color-d'>damages</strong> and drains <strong class='color-f'>energy</strong> in area of effect",
      ammo: 0,
      ammoPack: 7,
      have: false,
      isEasyToAim: true,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 10, 4, b.fireAttributes(dir, false));
        b.fireProps(mech.crouch ? 30 : 15, mech.crouch ? 28 : 18, dir, me); //cd , speed
        Matter.Body.setDensity(bullet[me], 0.000001);
        bullet[me].endCycle = Infinity;
        bullet[me].frictionAir = 0;
        bullet[me].friction = 1;
        bullet[me].frictionStatic = 1;
        bullet[me].restitution = 0;
        bullet[me].minDmgSpeed = 0;
        bullet[me].damageRadius = 100;
        bullet[me].maxDamageRadius = (425 + 125 * Math.random()) * (mod.isNeutronImmune ? 1.2 : 1)
        bullet[me].stuckTo = null;
        bullet[me].stuckToRelativePosition = null;
        bullet[me].onDmg = function () {};
        bullet[me].stuck = function () {};
        bullet[me].do = function () {
          function onCollide(that) {
            that.collisionFilter.mask = 0; //non collide with everything
            Matter.Body.setVelocity(that, {
              x: 0,
              y: 0
            });
            // that.frictionAir = 1;
            that.do = that.radiationMode;

            if (mod.isNeutronStun) {
              //push blocks
              const dist = that.maxDamageRadius * 0.9
              for (let i = 0, len = body.length; i < len; ++i) {
                const SUB = Vector.sub(body[i].position, that.position)
                const DISTANCE = Vector.magnitude(SUB)
                if (DISTANCE < dist) {
                  const FORCE = Vector.mult(Vector.normalise(SUB), 0.04 * body[i].mass)
                  body[i].force.x += FORCE.x;
                  body[i].force.y += FORCE.y - body[i].mass * game.g * 5; //kick up a bit to give them some arc
                }
              }
              //stun mobs
              for (let i = 0, len = mob.length; i < len; ++i) {
                if (Vector.magnitude(Vector.sub(mob[i].position, that.position)) < dist) {
                  mobs.statusStun(mob[i], mod.isNeutronStun)
                }
              }
            }
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
            this.stuck = function () {
              if (this.stuckTo && this.stuckTo.alive) {
                const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
              } else {
                this.collisionFilter.mask = cat.map | cat.body | cat.player | cat.mob; //non collide with everything but map
                this.stuck = function () {
                  this.force.y += this.mass * 0.001;
                }
              }
            }
          } else {
            const bodyCollisions = Matter.Query.collides(this, body)
            if (bodyCollisions.length) {


              if (!bodyCollisions[0].bodyA.isNotSticky) {
                onCollide(this)
                this.stuckTo = bodyCollisions[0].bodyA
                //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
              } else {
                this.do = this.radiationMode;
              }
              this.stuck = function () {
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

                // this.stuck = function () {
                // Matter.Body.setVelocity(this, {
                //   x: 0,
                //   y: 0
                // });
                // }
              } else { //if colliding with nothing just fall
                this.force.y += this.mass * 0.001;
              }
            }
          }
        }
        bullet[me].radiationMode = function () {
          this.stuck(); //runs different code based on what the bullet is stuck to

          if (!mech.isBodiesAsleep) {
            this.damageRadius = this.damageRadius * 0.85 + 0.15 * this.maxDamageRadius //smooth radius towards max
            this.maxDamageRadius -= 0.8 / mod.isBulletsLastLonger //+ 0.5 * Math.sin(game.cycle * 0.1) //slowly shrink max radius

            if (this.damageRadius < 15) {
              this.endCycle = 0;
            } else {
              //aoe damage to player

              if (!mod.isNeutronImmune && Vector.magnitude(Vector.sub(player.position, this.position)) < this.damageRadius) {
                const DRAIN = 0.0015
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
                  let dmg = b.dmgScale * 0.023
                  if (Matter.Query.ray(map, mob[i].position, this.position).length > 0) dmg *= 0.5 //reduce damage if a wall is in the way
                  if (mob[i].shield) dmg *= 5 //x5 to make up for the /5 that shields normally take
                  mob[i].damage(dmg);
                  mob[i].locatePlayer();
                }
              }
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, this.damageRadius, 0, 2 * Math.PI);
              ctx.globalCompositeOperation = "lighter"
              ctx.fillStyle = `rgba(25,139,170,${0.2+0.06*Math.random()})`;
              ctx.fill();
              ctx.globalCompositeOperation = "source-over"
            }
          }
        }
      }
    },
    {
      name: "mine",
      description: "toss a <strong>proximity</strong> mine that <strong>sticks</strong> to walls<br>fires <strong>nails</strong> at mobs within range",
      ammo: 0,
      ammoPack: 3,
      have: false,
      isEasyToAim: true,
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
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 60 : 20) * b.fireCD); // cool down
      }
    },
    {
      name: "spores",
      description: "fire a <strong>sporangium</strong> that discharges <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> seek out nearby mobs",
      ammo: 0,
      ammoPack: 5,
      have: false,
      isEasyToAim: true,
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
        bullet[me].stuck = function () {};
        bullet[me].onDmg = function () {};
        bullet[me].do = function () {
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
            this.stuck = function () {
              if (this.stuckTo && this.stuckTo.alive) {
                const rotate = Vector.rotate(this.stuckToRelativePosition, this.stuckTo.angle) //add in the mob's new angle to the relative position vector
                Matter.Body.setPosition(this, Vector.add(Vector.add(rotate, this.stuckTo.velocity), this.stuckTo.position))
                Matter.Body.setVelocity(this, this.stuckTo.velocity); //so that it will move properly if it gets unstuck
              } else {
                this.collisionFilter.mask = cat.map; //non collide with everything but map
                this.stuck = function () {
                  this.force.y += this.mass * 0.0006;
                }
              }
            }
          } else {
            const bodyCollisions = Matter.Query.collides(this, body)
            if (bodyCollisions.length) {
              if (!bodyCollisions[0].bodyA.isNotSticky) {
                onCollide(this)
                this.stuckTo = bodyCollisions[0].bodyA
                //find the relative position for when the mob is at angle zero by undoing the mobs rotation
                this.stuckToRelativePosition = Vector.rotate(Vector.sub(this.position, this.stuckTo.position), -this.stuckTo.angle)
              } else {
                this.do = this.grow;
              }
              this.stuck = function () {
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

        bullet[me].grow = function () {
          this.stuck(); //runs different code based on what the bullet is stuck to
          if (!mech.isBodiesAsleep) {
            let scale = 1.01
            if (this.stuckTo && this.stuckTo.alive) scale = 1.03
            Matter.Body.scale(this, scale, scale);
            this.radius *= scale
            if (this.radius > this.maxRadius) this.endCycle = 0;
          }

          // this.force.y += this.mass * 0.00045;

          //draw green glow
          ctx.fillStyle = "rgba(0,200,125,0.16)";
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, this.maxRadius, 0, 2 * Math.PI);
          ctx.fill();
        };

        //spawn bullets on end
        bullet[me].onEnd = function () {
          const NUM = 10
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
      isEasyToAim: true,
      fire() {
        b.drone(mech.crouch ? 45 : 1)
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 13 : 5) * b.fireCD); // cool down
      }
    },
    {
      name: "ice IX",
      description: "synthesize <strong>short-lived</strong> ice crystals<br>crystals <strong>seek</strong> out and <strong class='color-s'>freeze</strong> mobs",
      ammo: 0,
      ammoPack: 73,
      have: false,
      isEasyToAim: true,
      fire() {
        if (mech.crouch) {
          b.iceIX(10, 0.3)
          mech.fireCDcycle = mech.cycle + Math.floor(10 * b.fireCD); // cool down
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
      ammoPack: 50,
      have: false,
      isEasyToAim: false,
      fire() {
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 20 : 6) * b.fireCD); // cool down
        const radius = mech.crouch ? 10 + 7 * Math.random() : 4 + 6 * Math.random() //(4 + (mech.crouch ? 15 : 6) * Math.random())
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
      ammoPack: 4,
      have: false,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(0, 0, 0.015, 0.0015, {
          density: 0.01, //0.001 is normal
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
          onDmg(who) {
            if (who.shield) {
              for (let i = 0, len = mob.length; i < len; i++) {
                if (mob[i].id === who.shieldTargetID) { //apply some knock back to shield mob before shield breaks
                  Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(this.velocity), 10));
                  break
                }
              }
              Matter.Body.setVelocity(this, {
                x: -0.1 * this.velocity.x,
                y: -0.1 * this.velocity.y
              });
              Matter.Body.setDensity(this, 0.001);
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
        bullet[me].do = function () {
          if ((!game.mouseDown && this.charge > 0.6) || mech.energy < 0.005) { //fire on mouse release
            if (mech.energy < 0.005) {
              this.charge = 0.1;
              mech.fireCDcycle = mech.cycle + 120; // cool down if out of energy
              //normal bullet behavior occurs after firing, overwrite this function
              this.do = function () {
                this.force.y += this.mass * 0.001; //normal gravity
              }
            } else {
              mech.fireCDcycle = mech.cycle + 2; // set fire cool down
              //normal bullet behavior occurs after firing, overwrite this function
              this.do = function () {
                this.force.y += this.mass * 0.0003 / this.charge; // low gravity that scales with charge
              }
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

            //push away blocks when firing
            let range = 700 * this.charge
            for (let i = 0, len = body.length; i < len; ++i) {
              const SUB = Vector.sub(body[i].position, mech.pos)
              const DISTANCE = Vector.magnitude(SUB)

              if (DISTANCE < range) {
                const DEPTH = Math.min(range - DISTANCE, 300)
                const FORCE = Vector.mult(Vector.normalise(SUB), 0.003 * Math.sqrt(DEPTH) * body[i].mass)
                body[i].force.x += FORCE.x;
                body[i].force.y += FORCE.y - body[i].mass * (game.g * 1.5); //kick up a bit to give them some arc
              }
            }
            for (let i = 0, len = mob.length; i < len; ++i) {
              const SUB = Vector.sub(mob[i].position, mech.pos)
              const DISTANCE = Vector.magnitude(SUB)

              if (DISTANCE < range) {
                const DEPTH = Math.min(range - DISTANCE, 300)
                const FORCE = Vector.mult(Vector.normalise(SUB), 0.003 * Math.sqrt(DEPTH) * mob[i].mass)
                mob[i].force.x += 1.5 * FORCE.x;
                mob[i].force.y += 1.5 * FORCE.y;
              }
            }
          } else if (mech.energy > 0.005) { // charging on mouse down
            mech.fireCDcycle = Infinity //can't fire until mouse is released
            const lastCharge = this.charge
            let chargeRate = (mech.crouch) ? 0.975 : 0.987
            chargeRate *= Math.pow(b.fireCD, 0.03)
            this.charge = this.charge * chargeRate + (1 - chargeRate) // this.charge converges to 1
            mech.energy -= (this.charge - lastCharge) * 0.28 //energy drain is proportional to charge gained, but doesn't stop normal mech.fieldRegen

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
            const vertexCollision = function (v1, v1End, domain) {
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
    },
    {
      name: "laser",
      description: "emit a <strong>beam</strong> of collimated coherent <strong>light</strong><br>drains <strong class='color-f'>energy</strong> instead of ammunition",
      ammo: 0,
      ammoPack: Infinity,
      have: false,
      isEasyToAim: false,
      fire() {
        const reflectivity = 1 - 1 / (mod.laserReflections * 1.5)
        let damage = b.dmgScale * mod.laserDamage
        if (mech.energy < mod.laserFieldDrain) {
          mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
        } else {
          mech.energy -= mech.fieldRegen + mod.laserFieldDrain * mod.isLaserDiode
          let best = {
            x: null,
            y: null,
            dist2: Infinity,
            who: null,
            v1: null,
            v2: null
          };
          const color = "#f00";
          const range = 3000;
          const path = [{
              x: mech.pos.x + 20 * Math.cos(mech.angle),
              y: mech.pos.y + 20 * Math.sin(mech.angle)
            },
            {
              x: mech.pos.x + range * Math.cos(mech.angle),
              y: mech.pos.y + range * Math.sin(mech.angle)
            }
          ];
          const vertexCollision = function (v1, v1End, domain) {
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

          const checkForCollisions = function () {
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
          const laserHitMob = function () {
            if (best.who.alive) {
              best.who.damage(damage);
              best.who.locatePlayer();
              ctx.fillStyle = color; //draw mob damage circle
              ctx.beginPath();
              ctx.arc(path[path.length - 1].x, path[path.length - 1].y, Math.sqrt(damage) * 100, 0, 2 * Math.PI);
              ctx.fill();
            }
          };
          const reflection = function () { // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
            const n = Vector.perp(Vector.normalise(Vector.sub(best.v1, best.v2)));
            const d = Vector.sub(path[path.length - 1], path[path.length - 2]);
            const nn = Vector.mult(n, 2 * Vector.dot(d, n));
            const r = Vector.normalise(Vector.sub(d, nn));
            path[path.length] = Vector.add(Vector.mult(r, range), path[path.length - 1]);
          };

          checkForCollisions();
          let lastBestOdd
          let lastBestEven = best.who //used in hack below
          if (best.dist2 !== Infinity) {
            //if hitting something
            path[path.length - 1] = {
              x: best.x,
              y: best.y
            };
            laserHitMob();
            for (let i = 0; i < mod.laserReflections; i++) {
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

          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
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
      }
    },
    {
      name: "pulse",
      description: "convert <strong>25%</strong> of your <strong class='color-f'>energy</strong> into a pulsed laser<br>instantly initiates a fusion <strong class='color-e'>explosion</strong>",
      ammo: 0,
      ammoPack: Infinity,
      have: false,
      isEasyToAim: false,
      fire() {
        //calculate laser collision
        let best, energy, explosionRange;
        let range = 3000
        const path = [{
            x: mech.pos.x + 20 * Math.cos(mech.angle),
            y: mech.pos.y + 20 * Math.sin(mech.angle)
          },
          {
            x: mech.pos.x + range * Math.cos(mech.angle),
            y: mech.pos.y + range * Math.sin(mech.angle)
          }
        ];
        const vertexCollision = function (v1, v1End, domain) {
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
          energy = 0.25 * Math.min(mech.energy, 1.75)
          explosionRange = 1000 * energy
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

        if (mod.isPulseAim) {
          mech.energy -= energy * mod.isLaserDiode
          if (best.who) b.explosion(path[1], explosionRange, true)
          mech.fireCDcycle = mech.cycle + Math.floor(25 * b.fireCD); // cool down
        } else {
          energy = 0.3 * Math.min(mech.energy, 1.75)
          mech.energy -= energy * mod.isLaserDiode
          explosionRange = 1000 * energy
          if (best.who) b.explosion(path[1], explosionRange, true)
          mech.fireCDcycle = mech.cycle + Math.floor(50 * b.fireCD); // cool down
        }
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
    },
    // {
    //   name: "dwarf star", //14
    //   description: "drop a mine that gravitational pulls in matter",
    //   ammo: 0,
    //   ammoPack: 1000,
    //   have: false,
    //   isStarterGun: false,
    //   fire() {
    //     const me = bullet.length;
    //     const dir = mech.angle
    //     const TOTAL_CYCLES = 1020
    //     bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(dir), mech.pos.y + 30 * Math.sin(dir), 3 , {
    //       density: 0.05,
    //       //frictionAir: 0.01,			
    //       restitution: 0,
    //       angle: 0,
    //       friction: 1,
    //       // frictionAir: 1,
    //       endCycle: game.cycle + TOTAL_CYCLES,
    //       dmg: 0, //damage done in addition to the damage from momentum
    //       classType: "bullet",
    //       collisionFilter: {
    //         category: 0x000100,
    //         mask: 0x010011 //mask: 0x000101,  //for self collision
    //       },
    //       minDmgSpeed: 5,
    //       range: 0,
    //       onDmg() {
    //         this.endCycle = 0;
    //       }, //this.endCycle = 0  //triggers despawn
    //       onEnd() {},
    //       do() {
    //         this.force.y += this.mass * 0.005;
    //         this.range += 0.5

    //         //damage nearby mobs
    //         const dmg = b.dmgScale * 0.02
    //         for (let i = 0, len = mob.length; i < len; ++i) {
    //           if (mob[i].alive) {
    //             sub = Vector.sub(this.position, mob[i].position);
    //             dist = Vector.magnitude(sub) - mob[i].radius;
    //             if (dist < this.range) {
    //               mob[i].damage(dmg);
    //               mob[i].locatePlayer();
    //             }
    //           }
    //         }

    //         //pull in body, and power ups?, and bullets?
    //         for (let i = 0, len = body.length; i < len; ++i) {
    //           sub = Vector.sub(this.position, body[i].position);
    //           dist = Vector.magnitude(sub)
    //           if (dist < this.range) {
    //             this.range += body[i].mass * 2
    //             Matter.World.remove(engine.world, body[i]);
    //             body.splice(i, 1);
    //             break;
    //           }
    //         }

    //         //draw
    //         const opacity = (this.endCycle - game.cycle) / TOTAL_CYCLES
    //         ctx.fillStyle = `rgba(170,220,255,${opacity})`;
    //         ctx.beginPath();
    //         ctx.arc(this.position.x, this.position.y, this.range, 0, 2 * Math.PI);
    //         ctx.fill();
    //       }
    //     });
    //     b.fireProps(60, 0, dir, me); //cd , speed
    //   }
    // },
    // {
    //   name: "kinetic slugs", //1
    //   description: "fire a large <strong>rod</strong> that does excessive physical <strong class='color-d'>damage</strong><br><em>high recoil</em>",
    //   ammo: 0,
    //   ammoPack: 5,
    //   have: false,
    //   
    //   fire() {
    //     b.muzzleFlash(45);
    //     // mobs.alert(800);
    //     const me = bullet.length;
    //     const dir = mech.angle;
    //     bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 70 , 30 , b.fireAttributes(dir));
    //     b.fireProps(mech.crouch ? 55 : 40, 50, dir, me); //cd , speed
    //     bullet[me].endCycle = game.cycle + Math.floor(180 * mod.isBulletsLastLonger);
    //     bullet[me].do = function () {
    //       this.force.y += this.mass * 0.0005;
    //     };

    //     //knock back
    //     const KNOCK = ((mech.crouch) ? 0.025 : 0.25)
    //     player.force.x -= KNOCK * Math.cos(dir)
    //     player.force.y -= KNOCK * Math.sin(dir) * 0.3 //reduce knock back in vertical direction to stop super jumps
    //   },
  ]
};