let bullet = [];

const b = {
  dmgScale: null, //scales all gun damage from momentum, but not raw .dmg //this is reset in game.reset
  gravity: 0.0006, //most other bodies have   gravity = 0.001
  activeGun: null, //current gun in use by player
  inventoryGun: 0,
  inventory: [0], //list of what guns player has  // 0 starts with basic gun
  giveGuns(gun = "all", ammoPacks = 2) {
    if (gun === "all") {
      b.activeGun = 0;
      for (let i = 0; i < b.guns.length; i++) {
        b.guns[i].have = true;
        b.guns[i].ammo = b.guns[i].ammoPack * ammoPacks;
        b.inventory[i] = i;
      }
    } else {
      if (!b.guns[gun].have) b.inventory.push(gun);
      b.activeGun = gun;
      b.guns[gun].have = true;
      b.guns[gun].ammo = b.guns[gun].ammoPack * ammoPacks;
    }
    game.makeGunHUD();
  },
  fireProps(cd, speed, dir, me) {
    mech.fireCDcycle = game.cycle + cd; // cool down
    Matter.Body.setVelocity(bullet[me], {
      x: mech.Vx / 2 + speed * Math.cos(dir),
      y: mech.Vy / 2 + speed * Math.sin(dir)
    });
    World.add(engine.world, bullet[me]); //add bullet to world
  },
  fireAttributes(dir) {
    return {
      // density: 0.0015,			//frictionAir: 0.01,			//restitution: 0,
      angle: dir,
      friction: 0.5,
      frictionAir: 0,
      dmg: 0, //damage done in addition to the damage from momentum
      classType: "bullet",
      collisionFilter: {
        category: 0x000100,
        mask: 0x000011 //mask: 0x000101,  //for self collision
      },
      minDmgSpeed: 10,
      onDmg() {}, //this.endCycle = 0  //triggers despawn
      onEnd() {}
    };
  },
  muzzleFlash(radius = 10) {
    ctx.fillStyle = "#fb0";
    ctx.beginPath();
    ctx.arc(mech.pos.x + 35 * Math.cos(mech.angle), mech.pos.y + 35 * Math.sin(mech.angle), radius, 0, 2 * Math.PI);
    ctx.fill();
  },
  drawOneBullet(vertices) {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let j = 1; j < vertices.length; j += 1) {
      ctx.lineTo(vertices[j].x, vertices[j].y);
    }
    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.fillStyle = "#000";
    ctx.fill();
  },
  removeConsBB(me) {
    for (let i = 0, len = consBB.length; i < len; ++i) {
      if (consBB[i].bodyA === me) {
        consBB[i].bodyA = consBB[i].bodyB;
        consBB.splice(i, 1);
        // b.removeConsBB(me);
        break;
      } else if (consBB[i].bodyB === me) {
        consBB[i].bodyB = consBB[i].bodyA;
        consBB.splice(i, 1);
        // b.removeConsBB(me);
        break;
      }
    }
  },
  explode(me) {
    // typically explode is used for some bullets with .onEnd

    //add dmg to draw queue
    game.drawList.push({
      x: bullet[me].position.x,
      y: bullet[me].position.y,
      radius: bullet[me].explodeRad,
      color: "rgba(255,0,0,0.4)",
      time: game.drawTime
    });
    let dist, sub, knock;
    const dmg = b.dmgScale * bullet[me].explodeRad * 0.01;

    const alertRange = 100 + bullet[me].explodeRad * 2; //alert range
    //add alert to draw queue
    game.drawList.push({
      x: bullet[me].position.x,
      y: bullet[me].position.y,
      radius: alertRange,
      color: "rgba(100,20,0,0.03)",
      time: game.drawTime
    });

    //player damage and knock back
    sub = Matter.Vector.sub(bullet[me].position, player.position);
    dist = Matter.Vector.magnitude(sub);
    if (dist < bullet[me].explodeRad) {
      mech.damage(bullet[me].explodeRad * 0.00035);
      knock = Matter.Vector.mult(Matter.Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 30);
      player.force.x += knock.x;
      player.force.y += knock.y;
      mech.drop();
    } else if (dist < alertRange) {
      knock = Matter.Vector.mult(Matter.Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 55);
      player.force.x += knock.x;
      player.force.y += knock.y;
      mech.drop();
    }

    //body knock backs
    for (let i = 0, len = body.length; i < len; ++i) {
      sub = Matter.Vector.sub(bullet[me].position, body[i].position);
      dist = Matter.Vector.magnitude(sub);
      if (dist < bullet[me].explodeRad) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 18);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 40);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      }
    }

    //power up knock backs
    for (let i = 0, len = powerUp.length; i < len; ++i) {
      sub = Matter.Vector.sub(bullet[me].position, powerUp[i].position);
      dist = Matter.Vector.magnitude(sub);
      if (dist < bullet[me].explodeRad) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 26);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 40);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      }
    }

    //bullet knock backs
    for (let i = 0, len = bullet.length; i < len; ++i) {
      if (me !== i) {
        sub = Matter.Vector.sub(bullet[me].position, bullet[i].position);
        dist = Matter.Vector.magnitude(sub);
        if (dist < bullet[me].explodeRad) {
          knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * bullet[i].mass) / 10);
          bullet[i].force.x += knock.x;
          bullet[i].force.y += knock.y;
        } else if (dist < alertRange) {
          knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * bullet[i].mass) / 20);
          bullet[i].force.x += knock.x;
          bullet[i].force.y += knock.y;
        }
      }
    }

    //destroy all bullets in range
    // for (let i = 0, len = bullet.length; i < len; ++i) {
    //     if (me != i) {
    //         sub = Matter.Vector.sub(bullet[me].position, bullet[i].position);
    //         dist = Matter.Vector.magnitude(sub);
    //         if (dist < bullet[me].explodeRad) {
    //             bullet[i].endCycle = game.cycle;
    //         }
    //     }
    // }

    //mob damage and knock back with no alert
    // for (let i = 0, len = mob.length; i < len; ++i) {
    //   if (mob[i].alive) {
    //     let vertices = mob[i].vertices;
    //     for (let j = 0, len = vertices.length; j < len; j++) {
    //       sub = Matter.Vector.sub(bullet[me].position, vertices[j]);
    //       dist = Matter.Vector.magnitude(sub);
    //       if (dist < bullet[me].explodeRad) {
    //         mob[i].damage(dmg);
    //         mob[i].locatePlayer();
    //         knock = Matter.Vector.mult(Matter.Vector.normalise(sub), -Math.sqrt(dmg) * mob[i].mass / 18);
    //         mob[i].force.x += knock.x;
    //         mob[i].force.y += knock.y;
    //         break;
    //       }
    //     }
    //   }
    // }

    //mob damage and knock back with alert
    let damageScale = 1; // reduce dmg for each new target to limit total AOE damage
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (mob[i].alive) {
        sub = Matter.Vector.sub(bullet[me].position, mob[i].position);
        dist = Matter.Vector.magnitude(sub);
        if (dist < bullet[me].explodeRad) {
          mob[i].damage(dmg * damageScale);
          mob[i].locatePlayer();
          knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 18);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
          damageScale *= 0.85
        } else if (!mob[i].seePlayer.recall && dist < alertRange) {
          mob[i].locatePlayer();
          knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 35);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
        }
      }
    }

    // Matter.Vector.magnitudeSquared(Matter.Vector.sub(bullet[me].position, mob[i].position))
  },
  guns: [
    // {
    //   name: "field emitter",
    //   ammo: Infinity,
    //   ammoPack: Infinity,
    //   have: true,
    //   fire() {}
    // },
    {
      name: "laser",
      ammo: 0,
      ammoPack: 350,
      have: false,
      fire() {
        //mech.fireCDcycle = game.cycle + 1
        let best;
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
        const checkforCollisions = function () {
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
        const laserHitMob = function (dmg) {
          if (best.who.alive) {
            dmg *= b.dmgScale * 0.065;
            best.who.damage(dmg);
            best.who.locatePlayer();
            //draw mob damage circle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(path[path.length - 1].x, path[path.length - 1].y, Math.sqrt(dmg) * 100, 0, 2 * Math.PI);
            ctx.fill();
          }
        };

        const reflection = function () {
          // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
          const n = Matter.Vector.perp(Matter.Vector.normalise(Matter.Vector.sub(best.v1, best.v2)));
          const d = Matter.Vector.sub(path[path.length - 1], path[path.length - 2]);
          const nn = Matter.Vector.mult(n, 2 * Matter.Vector.dot(d, n));
          const r = Matter.Vector.normalise(Matter.Vector.sub(d, nn));
          path[path.length] = Matter.Vector.add(Matter.Vector.mult(r, range), path[path.length - 1]);
        };
        //beam before reflection
        checkforCollisions();
        if (best.dist2 != Infinity) {
          //if hitting something
          path[path.length - 1] = {
            x: best.x,
            y: best.y
          };
          laserHitMob(1);

          //1st reflection beam
          reflection();
          //ugly bug fix: this stops the reflection on a bug where the beam gets trapped inside a body
          let who = best.who;
          checkforCollisions();
          if (best.dist2 != Infinity) {
            //if hitting something
            path[path.length - 1] = {
              x: best.x,
              y: best.y
            };
            laserHitMob(0.75);

            //2nd reflection beam
            //ugly bug fix: this stops the reflection on a bug where the beam gets trapped inside a body
            if (who !== best.who) {
              reflection();
              checkforCollisions();
              if (best.dist2 != Infinity) {
                //if hitting something
                path[path.length - 1] = {
                  x: best.x,
                  y: best.y
                };
                laserHitMob(0.5);
              }
            }
          }
        }
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineDashOffset = 300 * Math.random()
        // ctx.setLineDash([200 * Math.random(), 250 * Math.random()]);

        ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
        for (let i = 1, len = path.length; i < len; ++i) {
          ctx.beginPath();
          ctx.moveTo(path[i - 1].x, path[i - 1].y);
          ctx.lineTo(path[i].x, path[i].y);
          ctx.stroke();
          ctx.globalAlpha *= 0.5; //reflections are less intense
          // ctx.globalAlpha -= 0.1; //reflections are less intense
        }
        ctx.setLineDash([0, 0]);
        ctx.globalAlpha = 1;
      }
    },
    {
      name: "rapid fire",
      ammo: 0,
      ammoPack: 100,
      have: false,
      fire() {
        const me = bullet.length;
        b.muzzleFlash(15);
        // if (Math.random() > 0.2) mobs.alert(500);
        const dir = (Math.random() - 0.5) * 0.15 + mech.angle;
        bullet[me] = Bodies.rectangle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 17, 5, b.fireAttributes(dir));
        b.fireProps(5, 40, dir, me); //cd , speed
        bullet[me].endCycle = game.cycle + 60;
        bullet[me].frictionAir = 0.01;
        bullet[me].do = function () {
          this.force.y += this.mass * 0.001;
        };
      }
    },
    {
      name: "spray",
      ammo: 0,
      ammoPack: 8,
      have: false,
      fire() {
        b.muzzleFlash(35);
        // mobs.alert(650);
        for (let i = 0; i < 9; i++) {
          const me = bullet.length;
          const dir = (Math.random() - 0.5) * 0.6 + mech.angle;
          bullet[me] = Bodies.rectangle(
            mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5),
            mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5),
            11,
            11,
            b.fireAttributes(dir)
          );
          b.fireProps(30, 36 + Math.random() * 11, dir, me); //cd , speed
          bullet[me].endCycle = game.cycle + 60;
          bullet[me].frictionAir = 0.02;
          bullet[me].do = function () {
            this.force.y += this.mass * 0.001;
          };
        }
      }
    },
    {
      name: "needles",
      ammo: 0,
      ammoPack: 17,
      have: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(mech.angle), mech.pos.y + 40 * Math.sin(mech.angle), 31, 2, b.fireAttributes(dir));
        b.fireProps(20, 45, dir, me); //cd , speed
        bullet[me].endCycle = game.cycle + 180;
        bullet[me].dmg = 1;
        b.drawOneBullet(bullet[me].vertices);
        bullet[me].do = function () {
          //low gravity
          this.force.y += this.mass * 0.0002;
        };
      }
    },
    {
      name: "missiles",
      ammo: 0,
      ammoPack: 8,
      have: false,
      fireCycle: 0,
      ammoLoaded: 0,
      fire() {
        //calculate how many new missiles have loaded since the last time fired
        const ammoLoadTime = 36
        const maxLoaded = 6
        this.ammoLoaded += Math.floor(Math.abs(game.cycle - this.fireCycle) / ammoLoadTime)
        this.ammoLoaded = Math.min(maxLoaded, this.ammoLoaded)

        if (this.ammoLoaded < 1) {
          mech.fireCDcycle = game.cycle + ammoLoadTime; // cool down if no ammo loaded
          this.ammo++; //counteract the normal ammo reduction by adding back one if not firing
        } else {
          this.fireCycle = game.cycle //keep track of last time fired to calculate ammo loaded
          this.ammoLoaded--

          const thrust = 0.0003;
          let dir = mech.angle + 0.1 * (0.5 - Math.random());
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(mech.angle), mech.pos.y + 40 * Math.sin(mech.angle) - 3, 30, 4, b.fireAttributes(dir));
          b.fireProps(6, -5 - 3 * (0.5 - Math.random()), dir, me); //cd , speed
          b.drawOneBullet(bullet[me].vertices);
          // Matter.Body.setDensity(bullet[me], 0.01)  //doesn't help with reducing explosion knock backs
          bullet[me].force.y += 0.00045; //a small push down at first to make it seem like the missile is briefly falling
          bullet[me].frictionAir = 0
          bullet[me].endCycle = game.cycle + Math.floor(265 + Math.random() * 20);
          bullet[me].explodeRad = 145 + 40 * Math.random();
          bullet[me].lookFrequency = Math.floor(8 + Math.random() * 7);
          bullet[me].onEnd = b.explode; //makes bullet do explosive damage at end
          bullet[me].onDmg = function () {
            this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
          };
          bullet[me].lockedOn = null;
          bullet[me].do = function () {
            if (!(game.cycle % this.lookFrequency)) {
              this.close = null;
              this.lockedOn = null;
              let closeDist = Infinity;
              for (let i = 0, len = mob.length; i < len; ++i) {
                if (
                  mob[i].alive &&
                  mob[i].dropPowerUp &&
                  Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                  Matter.Query.ray(body, this.position, mob[i].position).length === 0
                ) {
                  const dist = Matter.Vector.magnitude(Matter.Vector.sub(this.position, mob[i].position));
                  if (dist < closeDist) {
                    this.close = mob[i].position;
                    closeDist = dist;
                    this.lockedOn = mob[i];
                  }
                }
              }
              //explode when bullet is close enough to target
              if (this.close && closeDist < this.explodeRad * 0.7) {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
              }

              if (this.lockedOn) {
                this.frictionAir = 0.04; //extra friction

                //draw locked on targeting
                ctx.beginPath();
                const vertices = this.lockedOn.vertices;
                ctx.moveTo(this.position.x, this.position.y);
                const mod = Math.floor((game.cycle / 3) % vertices.length);
                ctx.lineTo(vertices[mod].x, vertices[mod].y);
                ctx.strokeStyle = "rgba(0,0,155,0.35)"; //"#2f6";
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }

            //rotate missile towards the target
            if (this.close) {
              const face = {
                x: Math.cos(this.angle),
                y: Math.sin(this.angle)
              };
              const target = Matter.Vector.normalise(Matter.Vector.sub(this.position, this.close));
              if (Matter.Vector.dot(target, face) > -0.98) {
                if (Matter.Vector.cross(target, face) > 0) {
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
            ctx.arc(this.position.x - Math.cos(this.angle) * 27 + (Math.random() - 0.5) * 4, this.position.y - Math.sin(this.angle) * 27 + (Math.random() - 0.5) * 4, 11, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255,155,0,0.5)";
            ctx.fill();

          }
        }
      }
    },
    {
      name: "flak",
      ammo: 0,
      ammoPack: 9,
      have: false,
      fire() {
        b.muzzleFlash(30);
        const totalBullets = 7
        const angleStep = 0.08 / totalBullets
        let dir = mech.angle - angleStep * totalBullets / 2;
        for (let i = 0; i < totalBullets; i++) { //5 -> 7
          dir += angleStep
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 17, 4, b.fireAttributes(dir));
          b.fireProps(35, 25 + 25 * Math.random(), dir, me); //cd , speed
          //Matter.Body.setDensity(bullet[me], 0.00001);
          bullet[me].endCycle = game.cycle + 16 + Math.ceil(7 * Math.random())
          bullet[me].restitution = 0;
          bullet[me].friction = 1;
          bullet[me].explodeRad = 90 + (Math.random() - 0.5) * 50;
          bullet[me].onEnd = b.explode;
          bullet[me].onDmg = function () {
            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
          };
          bullet[me].do = function () {
            this.force.y += this.mass * 0.0004;
            // if (this.speed < 10) { //if slow explode
            //   for (let i = 0, len = bullet.length; i < len; i++) {
            //     bullet[i].endCycle = 0 //all other bullets explode
            //   }
            // }
          }
        }
      }
    },
    {
      name: "grenade",
      ammo: 0,
      ammoPack: 4,
      have: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 22, b.fireAttributes(dir));
        bullet[me].radius = 22; //used from drawing timer
        b.fireProps(40, 32, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
        Matter.Body.setDensity(bullet[me], 0.000001);
        bullet[me].endCycle = game.cycle + 140;
        // bullet[me].restitution = 0.3;
        // bullet[me].frictionAir = 0.01;
        // bullet[me].friction = 0.15;
        bullet[me].restitution = 0;
        bullet[me].friction = 1;

        bullet[me].explodeRad = 350 + Math.floor(Math.random() * 60);
        bullet[me].onEnd = b.explode; //makes bullet do explosive damage before despawn
        bullet[me].minDmgSpeed = 1;
        bullet[me].onDmg = function () {
          this.endCycle = 0; //bullet ends cycle after doing damage  //this triggers explosion
        };
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.0022;
          //draw timer
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
            ctx.fillStyle = "#f12";
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * (1 - (this.endCycle - game.cycle) / 140), 0, 2 * Math.PI);
            ctx.fill();
          }
        };
      }
    },
    {
      name: "M80",
      ammo: 0,
      ammoPack: 45,
      have: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle; // + Math.random() * 0.05;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 10, b.fireAttributes(dir));
        b.fireProps(8, 26, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
        Matter.Body.setDensity(bullet[me], 0.000001);
        bullet[me].totalCycles = 120;
        bullet[me].endCycle = game.cycle + bullet[me].totalCycles;
        bullet[me].restitution = 0.6;
        bullet[me].explodeRad = 125;
        bullet[me].onEnd = b.explode; //makes bullet do explosive damage before despawn
        bullet[me].minDmgSpeed = 1;
        bullet[me].dmg = 0.25;
        bullet[me].onDmg = function () {
          this.endCycle = 0; //bullet ends cycle after doing damage  //this triggers explosion
        };
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.0025;
        };
      }
    },
    {
      name: "one shot",
      ammo: 0,
      ammoPack: 4,
      have: false,
      fire() {
        b.muzzleFlash(45);
        // mobs.alert(800);
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 60, 25, b.fireAttributes(dir));
        b.fireProps(30, 54, dir, me); //cd , speed
        bullet[me].endCycle = game.cycle + 180;
        bullet[me].do = function () {
          this.force.y += this.mass * 0.0005;
        };
      }
    },
    {
      name: "super balls",
      ammo: 0,
      ammoPack: 10,
      have: false,
      fire() {
        b.muzzleFlash(20);
        // mobs.alert(450);
        let dir = mech.angle - 0.05;
        for (let i = 0; i < 3; i++) {
          const me = bullet.length;
          bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 7, b.fireAttributes(dir));
          b.fireProps(20, 30, dir, me); //cd , speed
          Matter.Body.setDensity(bullet[me], 0.0001);
          bullet[me].endCycle = game.cycle + 360;
          bullet[me].dmg = 0.5;
          bullet[me].minDmgSpeed = 0;
          bullet[me].restitution = 0.96;
          bullet[me].friction = 0;
          bullet[me].do = function () {
            this.force.y += this.mass * 0.001;
          };
          dir += 0.05;
        }
      }
    },
    {
      name: "wave beam",
      ammo: 0,
      ammoPack: 120,
      have: false,
      fire() {
        mech.fireCDcycle = game.cycle + 7; // cool down
        const endCycle = game.cycle + 94
        const bulletRadius = 5;
        const speed = 35;
        const spread = Math.PI / 2 * 0.65 // smaller = faster speed, larger = faster rotation?
        const dir = mech.angle
        const pos = {
          x: mech.pos.x + 20 * Math.cos(mech.angle),
          y: mech.pos.y + 20 * Math.sin(mech.angle)
        }
        const props = {
          angle: dir,
          endCycle: endCycle,
          inertia: Infinity,
          restitution: 1,
          friction: 1,
          frictionAir: -0.003,
          minDmgSpeed: 0,
          isConstrained: true,
          dmg: 0, //damage done in addition to the damage from momentum
          classType: "bullet",
          collisionFilter: {
            category: 0x000100,
            mask: 0x000010
          },
          onDmg() {
            if (this.isConstrained) {
              this.isConstrained = false
              b.removeConsBB(this)
              // this.endCycle = 0 //triggers despawn
            }
          },
          onEnd() {
            if (this.isConstrained) {
              this.isConstrained = false
              b.removeConsBB(this)
            }
          },
          do() {}
        }

        //first bullet
        const me = bullet.length;
        bullet[me] = Bodies.circle(pos.x, pos.y, bulletRadius, props);
        Matter.Body.setVelocity(bullet[me], {
          x: speed * Math.cos(dir + spread),
          y: speed * Math.sin(dir + spread)
        });
        World.add(engine.world, bullet[me]); //add bullet to world
        // Matter.Body.setDensity(bullet[me], 0.0005);  //0.001 is normal

        //second bullet
        const me2 = bullet.length;
        bullet[me2] = Bodies.circle(pos.x, pos.y, bulletRadius, props);
        Matter.Body.setVelocity(bullet[me2], {
          x: speed * Math.cos(dir - spread),
          y: speed * Math.sin(dir - spread)
        });
        World.add(engine.world, bullet[me2]); //add bullet to world
        // Matter.Body.setDensity(bullet[me2], 0.0005); //0.001 is normal

        //constraint
        const meCons = consBB.length
        consBB[meCons] = Constraint.create({
          bodyA: bullet[me],
          bodyB: bullet[me2],
          stiffness: 0.008
        });
        World.add(engine.world, consBB[meCons]);
      }
    }
  ],
  fire() {
    if (game.mouseDown && mech.fireCDcycle < game.cycle && !(keys[32] || game.mouseDownRight) && !mech.isHolding && b.inventory.length) {
      if (b.guns[this.activeGun].ammo > 0) {
        b.guns[this.activeGun].fire();
        b.guns[this.activeGun].ammo--;
        game.updateGunHUD();
      } else {
        mech.fireCDcycle = game.cycle + 30; //cooldown
        game.makeTextLog("<div style='font-size:140%;'>NO AMMO</div><span class = 'box'>E</span> / <span class = 'box'>Q</span>", 200);
      }
    }
  },
  gamepadFire() {
    if (game.gamepad.rightTrigger && mech.fireCDcycle < game.cycle && !(keys[32] || game.gamepad.leftTrigger) && !mech.isHolding && b.inventory.length) {
      if (b.guns[this.activeGun].ammo > 0) {
        b.guns[this.activeGun].fire();
        b.guns[this.activeGun].ammo--;
        game.updateGunHUD();
      } else {
        mech.fireCDcycle = game.cycle + 30; //cooldown
        game.makeTextLog("<div style='font-size:140%;'>NO AMMO</div><span class = 'box'>E</span> / <span class = 'box'>Q</span>", 200);
      }
    }
  },
  draw() {
    ctx.beginPath();
    let i = bullet.length;
    while (i--) {
      //draw
      let vertices = bullet[i].vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      //remove bullet if at endcycle for that bullet
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
    ctx.fillStyle = "#000";
    ctx.fill();
    //do things
    for (let i = 0, len = bullet.length; i < len; i++) {
      bullet[i].do();
    }
  }
};