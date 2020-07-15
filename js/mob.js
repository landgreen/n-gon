//create array of mobs
let mob = [];
//method to populate the array above
const mobs = {
  loop() {
    let i = mob.length;
    while (i--) {
      if (mob[i].alive) {
        mob[i].do();
      } else {
        mob[i].replace(i); //removing mob and replace with body, this is done here to avoid an array index bug with drawing I think
      }
    }
  },
  draw() {
    ctx.lineWidth = 2;
    let i = mob.length;
    while (i--) {
      ctx.beginPath();
      const vertices = mob[i].vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1, len = vertices.length; j < len; ++j) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      ctx.fillStyle = mob[i].fill;
      ctx.strokeStyle = mob[i].stroke;
      ctx.fill();
      ctx.stroke();
    }
  },
  healthBar() {
    for (let i = 0, len = mob.length; i < len; i++) {
      if (mob[i].seePlayer.recall && mob[i].showHealthBar) {
        const h = mob[i].radius * 0.3;
        const w = mob[i].radius * 2;
        const x = mob[i].position.x - w / 2;
        const y = mob[i].position.y - w * 0.7;
        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(255,0,0,0.7)";
        ctx.fillRect(x, y, w * mob[i].health, h);
      }
    }
  },
  statusSlow(who, cycles = 60) {
    applySlow(who)
    //look for mobs near the target
    if (mod.isAoESlow) {
      const range = (220 + 150 * Math.random()) ** 2
      for (let i = 0, len = mob.length; i < len; i++) {
        if (Vector.magnitudeSquared(Vector.sub(who.position, mob[i].position)) < range) applySlow(mob[i])
      }
      game.drawList.push({
        x: who.position.x,
        y: who.position.y,
        radius: Math.sqrt(range),
        color: "rgba(0,100,255,0.05)",
        time: 3
      });
    }


    function applySlow(target) {
      if (!target.shield && !target.isShielded && !mech.isBodiesAsleep) {
        if (target.isBoss) cycles = Math.floor(cycles * 0.25)

        let i = target.status.length
        while (i--) {
          if (target.status[i].type === "slow") target.status.splice(i, 1); //remove other "slow" effects on this mob
        }
        target.status.push({
          effect() {
            Matter.Body.setVelocity(target, {
              x: 0,
              y: 0
            });
            Matter.Body.setAngularVelocity(target, 0);
            ctx.beginPath();
            ctx.moveTo(target.vertices[0].x, target.vertices[0].y);
            for (let j = 1, len = target.vertices.length; j < len; ++j) {
              ctx.lineTo(target.vertices[j].x, target.vertices[j].y);
            }
            ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
            ctx.strokeStyle = "rgba(0,100,255,0.8)";
            ctx.lineWidth = 15;
            ctx.stroke();
            ctx.fillStyle = target.fill
            ctx.fill();
          },
          type: "slow",
          endCycle: game.cycle + cycles,
        })
      }
    }
  },
  statusStun(who, cycles = 180) {
    if (!who.shield && !who.isShielded && !mech.isBodiesAsleep) {
      Matter.Body.setVelocity(who, {
        x: who.velocity.x * 0.8,
        y: who.velocity.y * 0.8
      });
      Matter.Body.setAngularVelocity(who, who.angularVelocity * 0.8);
      //remove other "stun" effects on this mob
      let i = who.status.length
      while (i--) {
        if (who.status[i].type === "stun") who.status.splice(i, 1);
      }
      who.status.push({
        effect() {
          who.seePlayer.yes = false;
          who.seePlayer.recall = 0;
          who.seePlayer.position = {
            x: who.position.x + 100 * (Math.random() - 0.5),
            y: who.position.y + 100 * (Math.random() - 0.5)
          }
          if (who.velocity.y < 2) who.force.y += who.mass * 0.0004 //extra gravity
          ctx.beginPath();
          ctx.moveTo(who.vertices[0].x, who.vertices[0].y);
          for (let j = 1, len = who.vertices.length; j < len; ++j) {
            ctx.lineTo(who.vertices[j].x, who.vertices[j].y);
          }
          ctx.lineTo(who.vertices[0].x, who.vertices[0].y);
          ctx.stroke();
          ctx.fillStyle = `rgba(${Math.floor(255*Math.random())},${Math.floor(255*Math.random())},${Math.floor(255*Math.random())},0.5)`
          // ctx.fillStyle = `rgba(255,255,255,${Math.random()})`
          ctx.fill();
        },
        type: "stun",
        endCycle: game.cycle + cycles,
      })
    }
  },
  statusDoT(who, tickDamage, cycles = 180) {
    if (!who.isShielded && !mech.isBodiesAsleep) {
      who.status.push({
        effect() {
          if ((game.cycle - this.startCycle) % 30 === 0) {
            let dmg = b.dmgScale * tickDamage
            who.damage(dmg);
            game.drawList.push({ //add dmg to draw queue
              x: who.position.x + (Math.random() - 0.5) * who.radius * 0.5,
              y: who.position.y + (Math.random() - 0.5) * who.radius * 0.5,
              radius: Math.log(2 * dmg + 1.1) * 40,
              color: "rgba(0,80,80,0.9)",
              time: game.drawTime
            });
          }
          if (true) {
            //check for nearby mobs

          }
        },
        // type: "DoT",
        endCycle: game.cycle + cycles,
        startCycle: game.cycle
      })
    }
  },
  // statusBurn(who, tickDamage, cycles = 90 + Math.floor(90 * Math.random())) {
  //   if (!who.isShielded) {
  //     //remove other "burn" effects on this mob
  //     let i = who.status.length
  //     while (i--) {
  //       if (who.status[i].type === "burn") who.status.splice(i, 1);
  //     }
  //     who.status.push({
  //       effect() {
  //         if ((game.cycle - this.startCycle) % 15 === 0) {
  //           let dmg = b.dmgScale * tickDamage * 0.5 * (1 + Math.random())
  //           who.damage(dmg);
  //           game.drawList.push({ //add dmg to draw queue
  //             x: who.position.x,
  //             y: who.position.y,
  //             radius: Math.log(2 * dmg + 1.1) * 40,
  //             color: `rgba(255,${Math.floor(200*Math.random())},0,0.9)`,
  //             time: game.drawTime
  //           });
  //         }
  //       },
  //       type: "burn",
  //       endCycle: game.cycle + cycles,
  //       startCycle: game.cycle
  //     })
  //   }
  // },

  //**********************************************************************************************
  //**********************************************************************************************
  spawn(xPos, yPos, sides, radius, color) {
    let i = mob.length;
    mob[i] = Matter.Bodies.polygon(xPos, yPos, sides, radius, {
      //inertia: Infinity, //prevents rotation
      mob: true,
      density: 0.001,
      //friction: 0,
      frictionAir: 0.005,
      //frictionStatic: 0,
      restitution: 0.5,
      collisionFilter: {
        group: 0,
        category: cat.mob,
        mask: cat.player | cat.map | cat.body | cat.bullet | cat.mob
      },
      onHit: undefined,
      alive: true,
      index: i,
      health: mod.mobSpawnWithHealth,
      showHealthBar: true,
      accelMag: 0.001 * game.accelScale,
      cd: 0, //game cycle when cooldown will be over
      delay: 60, //static: time between cooldowns
      fill: color,
      stroke: "#000",
      seePlayer: {
        yes: false,
        recall: 0,
        position: {
          x: xPos,
          y: yPos
        }
      },
      radius: radius,
      spawnPos: {
        x: xPos,
        y: yPos
      },
      status: [], // [ { effect(), endCycle } ]
      checkStatus() {
        let j = this.status.length;
        while (j--) {
          this.status[j].effect();
          if (this.status[j].endCycle < game.cycle) this.status.splice(j, 1);
        }
      },
      seeAtDistance2: Infinity, //sqrt(4000000) = 2000 = max seeing range
      distanceToPlayer() {
        const dx = this.position.x - player.position.x;
        const dy = this.position.y - player.position.y;
        return Math.sqrt(dx * dx + dy * dy);
      },
      distanceToPlayer2() {
        const dx = this.position.x - player.position.x;
        const dy = this.position.y - player.position.y;
        return dx * dx + dy * dy;
      },
      gravity() {
        this.force.y += this.mass * this.g;
      },
      seePlayerFreq: Math.floor((30 + 30 * Math.random()) * game.lookFreqScale), //how often NPC checks to see where player is, lower numbers have better vision
      foundPlayer() {
        this.locatePlayer();
        if (!this.seePlayer.yes) {
          this.alertNearByMobs();
          this.seePlayer.yes = true;
        }
      },
      lostPlayer() {
        this.seePlayer.yes = false;
        this.seePlayer.recall -= this.seePlayerFreq;
        if (this.seePlayer.recall < 0) this.seePlayer.recall = 0;
      },
      memory: 120, //default time to remember player's location
      locatePlayer() { // updates mob's memory of player location
        this.seePlayer.recall = this.memory + Math.round(this.memory * Math.random()); //seconds before mob falls a sleep
        this.seePlayer.position.x = player.position.x;
        this.seePlayer.position.y = player.position.y;
      },
      // locatePlayerByDist() {
      //   if (this.distanceToPlayer2() < this.locateRange) {
      //     this.locatePlayer();
      //   }
      // },
      seePlayerCheck() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            this.distanceToPlayer2() < this.seeAtDistance2 &&
            Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 &&
            Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0 &&
            !mech.isStealth
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      seePlayerCheckByDistance() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (this.distanceToPlayer2() < this.seeAtDistance2 && !mech.isStealth) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      seePlayerByDistOrLOS() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            (this.distanceToPlayer2() < this.seeAtDistance2 || (Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 && Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0)) &&
            !mech.isStealth
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      seePlayerByDistAndLOS() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            this.distanceToPlayer2() < this.seeAtDistance2 &&
            Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 &&
            Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0 &&
            !mech.isStealth
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      isLookingAtPlayer(threshold) {
        const diff = Vector.normalise(Vector.sub(player.position, this.position));
        //make a vector for the mob's direction of length 1
        const dir = {
          x: Math.cos(this.angle),
          y: Math.sin(this.angle)
        };
        //the dot product of diff and dir will return how much over lap between the vectors
        const dot = Vector.dot(dir, diff);
        // console.log(Math.cos(dot)*180/Math.PI)
        if (dot > threshold) {
          return true;
        } else {
          return false;
        }
      },
      lookRange: 0.2 + Math.random() * 0.2,
      lookTorque: 0.0000004 * (Math.random() > 0.5 ? -1 : 1),
      seePlayerByLookingAt() {
        if (!(game.cycle % this.seePlayerFreq) && (this.seePlayer.recall || this.isLookingAtPlayer(this.lookRange))) {
          if (
            this.distanceToPlayer2() < this.seeAtDistance2 &&
            Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 &&
            Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0 &&
            !mech.isStealth
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
        //if you don't recall player location rotate and draw to show where you are looking
        if (!this.seePlayer.recall) {
          this.torque = this.lookTorque * this.inertia;
          //draw
          const range = Math.PI * this.lookRange;
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, this.radius * 2.5, this.angle - range, this.angle + range);
          ctx.arc(this.position.x, this.position.y, this.radius * 1.4, this.angle + range, this.angle - range, true);
          ctx.fillStyle = "rgba(0,0,0,0.07)";
          ctx.fill();
        }
      },
      mechPosRange() {
        return {
          x: player.position.x, // + (Math.random() - 0.5) * 50,
          y: player.position.y + (Math.random() - 0.5) * 110
        };
      },
      // hacked() { //set this.hackedTarget variable before running this method
      //   //find a new target
      //   if (!(game.cycle % this.seePlayerFreq)) {
      //     this.hackedTarget = null
      //     for (let i = 0, len = mob.length; i < len; i++) {
      //       if (mob[i] !== this) {
      //         // const DIST = Vector.magnitude(Vector.sub(this.position, mob[j]));
      //         if (Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
      //           Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
      //           this.hackedTarget = mob[i]
      //         }
      //       }
      //     }
      //   }
      //   //acceleration towards targets
      //   if (this.hackedTarget) {
      //     this.force = Vector.mult(Vector.normalise(Vector.sub(this.hackedTarget.position, this.position)), this.mass * 0.0015)
      //   }
      // },
      laserBeam() {
        if (game.cycle % 7 && this.seePlayer.yes) {
          ctx.setLineDash([125 * Math.random(), 125 * Math.random()]);
          // ctx.lineDashOffset = 6*(game.cycle % 215);
          if (this.distanceToPlayer() < this.laserRange && !mech.isStealth) {
            if (mech.immuneCycle < mech.cycle) mech.damage(0.0003 * game.dmgScale);
            if (mech.energy > 0.1) mech.energy -= 0.003
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.lineTo(mech.pos.x, mech.pos.y);
            ctx.lineTo(mech.pos.x + (Math.random() - 0.5) * 3000, mech.pos.y + (Math.random() - 0.5) * 3000);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgb(255,0,170)";
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, 40, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255,0,170,0.15)";
            ctx.fill();

          }
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, this.laserRange * 0.9, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(255,0,170,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,0,170,0.03)";
          ctx.fill();
        }
      },
      laser() {
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
        if (this.seePlayer.recall) {
          this.torque = this.lookTorque * this.inertia * 2;

          const seeRange = 2500;
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
          if (!mech.isStealth) vertexCollision(this.position, look, [player]);
          // hitting player
          if (best.who === player) {
            if (mech.immuneCycle < mech.cycle) {
              const dmg = 0.0012 * game.dmgScale;
              mech.damage(dmg);
              //draw damage
              ctx.fillStyle = "#f00";
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
          ctx.moveTo(this.position.x, this.position.y);
          ctx.lineTo(best.x, best.y);
          ctx.strokeStyle = "#f00"; // Purple path
          ctx.lineWidth = 1;
          ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
          ctx.stroke(); // Draw it
          ctx.setLineDash([0, 0]);
        }
      },
      searchSpring() {
        //draw the two dots on the end of the springs
        ctx.beginPath();
        ctx.arc(this.cons.pointA.x, this.cons.pointA.y, 6, 0, 2 * Math.PI);
        ctx.arc(this.cons2.pointA.x, this.cons2.pointA.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "#222";
        ctx.fill();

        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            (this.seePlayer.recall || this.isLookingAtPlayer(this.lookRange)) &&
            this.distanceToPlayer2() < this.seeAtDistance2 &&
            Matter.Query.ray(map, this.position, player.position).length === 0 &&
            Matter.Query.ray(body, this.position, player.position).length === 0 &&
            !mech.isStealth
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      springAttack() {
        // set new values of the ends of the spring constraints
        if (this.seePlayer.recall && Matter.Query.ray(map, this.position, player.position).length === 0) {
          if (!(game.cycle % (this.seePlayerFreq * 2))) {
            this.springTarget.x = this.seePlayer.position.x;
            this.springTarget.y = this.seePlayer.position.y;
            this.cons.length = -200;
            this.cons2.length = 100 + 1.5 * this.radius;
          } else {
            this.springTarget2.x = this.seePlayer.position.x;
            this.springTarget2.y = this.seePlayer.position.y;
            this.cons.length = 100 + 1.5 * this.radius;
            this.cons2.length = -200;
          }
        } else {
          this.torque = this.lookTorque * this.inertia;
          //draw looking around arcs
          const range = Math.PI * this.lookRange;
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, this.radius * 2.5, this.angle - range, this.angle + range);
          ctx.arc(this.position.x, this.position.y, this.radius * 1.4, this.angle + range, this.angle - range, true);
          ctx.fillStyle = "rgba(0,0,0,0.07)";
          ctx.fill();
          //spring to random place on map
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
          //move to a random location
          if (!(game.cycle % (this.seePlayerFreq * 5))) {
            best = {
              x: null,
              y: null,
              dist2: Infinity,
              who: null,
              v1: null,
              v2: null
            };
            const seeRange = 3000;
            const look = {
              x: this.position.x + seeRange * Math.cos(this.angle),
              y: this.position.y + seeRange * Math.sin(this.angle)
            };
            vertexCollision(this.position, look, map);
            if (best.dist2 != Infinity) {
              this.springTarget.x = best.x;
              this.springTarget.y = best.y;
              this.cons.length = 100 + 1.5 * this.radius;
              this.cons2.length = 100 + 1.5 * this.radius;
            }
          }
        }
      },
      alertNearByMobs() {
        //this.alertRange2 is set at the very bottom of this mobs, after mob is made
        for (let i = 0; i < mob.length; i++) {
          if (!mob[i].seePlayer.recall && Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position)) < this.alertRange2) {
            mob[i].locatePlayer();
          }
        }
      },
      curl(range = 1000, mag = -10) {
        //cause all mobs, and bodies to rotate in a circle
        applyCurl = function (center, array) {
          for (let i = 0; i < array.length; ++i) {
            const sub = Vector.sub(center, array[i].position)
            const radius2 = Vector.magnitudeSquared(sub);

            //if too close, like center mob or shield, don't curl   // if too far don't curl
            if (radius2 < range * range && radius2 > 10000) {
              const curlVector = Vector.mult(Vector.perp(Vector.normalise(sub)), mag)
              //apply curl force
              Matter.Body.setVelocity(array[i], {
                x: array[i].velocity.x * 0.94 + curlVector.x * 0.06,
                y: array[i].velocity.y * 0.94 + curlVector.y * 0.06
              })
              // //draw curl
              // ctx.beginPath();
              // ctx.moveTo(array[i].position.x, array[i].position.y);
              // ctx.lineTo(array[i].position.x + curlVector.x * 10, array[i].position.y + curlVector.y * 10);
              // ctx.lineWidth = 2;
              // ctx.strokeStyle = "#000";
              // ctx.stroke();
            }
          }
        }
        applyCurl(this.position, mob);
        applyCurl(this.position, body);
        applyCurl(this.position, powerUp);
        // applyCurl(this.position, bullet);  // too powerful, just stops all bullets need to write a curl function just for bullets
        // applyCurl(this.position, [player]);

        //draw limit
        // ctx.beginPath();
        // ctx.arc(this.position.x, this.position.y, range, 0, 2 * Math.PI);
        // ctx.fillStyle = "rgba(55,255,255, 0.1)";
        // ctx.fill();
      },
      pullPlayer() {
        if (this.seePlayer.yes && Vector.magnitudeSquared(Vector.sub(this.position, player.position)) < 1000000) {
          const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
          player.force.x -= game.accelScale * 0.00113 * player.mass * Math.cos(angle) * (mech.onGround ? 2 : 1);
          player.force.y -= game.accelScale * 0.00084 * player.mass * Math.sin(angle);

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
      },
      repelBullets() {
        if (this.seePlayer.yes) {
          ctx.lineWidth = "8";
          ctx.strokeStyle = this.fill;
          ctx.beginPath();
          for (let i = 0, len = bullet.length; i < len; ++i) {
            const dx = bullet[i].position.x - this.position.x;
            const dy = bullet[i].position.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 500) {
              ctx.moveTo(this.position.x, this.position.y);
              ctx.lineTo(bullet[i].position.x, bullet[i].position.y);
              const angle = Math.atan2(dy, dx);
              const mag = (1500 * bullet[i].mass * game.g) / dist;
              bullet[i].force.x += mag * Math.cos(angle);
              bullet[i].force.y += mag * Math.sin(angle);
            }
          }
          ctx.stroke();
        }
      },
      attraction() {
        //accelerate towards the player
        if (this.seePlayer.recall) {
          // && dx * dx + dy * dy < 2000000) {
          const forceMag = this.accelMag * this.mass;
          const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
          this.force.x += forceMag * Math.cos(angle);
          this.force.y += forceMag * Math.sin(angle);
        }
      },
      repulsionRange: 500000,
      repulsion() {
        //accelerate towards the player
        if (this.seePlayer.recall && this.distanceToPlayer2() < this.repulsionRange) {
          // && dx * dx + dy * dy < 2000000) {
          const forceMag = this.accelMag * this.mass;
          const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
          this.force.x -= 2 * forceMag * Math.cos(angle);
          this.force.y -= 2 * forceMag * Math.sin(angle); // - 0.0007 * this.mass; //antigravity
        }
      },
      hoverOverPlayer() {
        if (this.seePlayer.recall) {
          // vertical positioning
          const rangeY = 250;
          if (this.position.y > this.seePlayer.position.y - this.hoverElevation + rangeY) {
            this.force.y -= this.accelMag * this.mass;
          } else if (this.position.y < this.seePlayer.position.y - this.hoverElevation - rangeY) {
            this.force.y += this.accelMag * this.mass;
          }
          // horizontal positioning
          const rangeX = 150;
          if (this.position.x > this.seePlayer.position.x + this.hoverXOff + rangeX) {
            this.force.x -= this.accelMag * this.mass;
          } else if (this.position.x < this.seePlayer.position.x + this.hoverXOff - rangeX) {
            this.force.x += this.accelMag * this.mass;
          }
        }
        // else {
        //   this.gravity();
        // }
      },
      grow() {
        if (!mech.isBodiesAsleep) {
          if (this.seePlayer.recall) {
            if (this.radius < 80) {
              const scale = 1.01;
              Matter.Body.scale(this, scale, scale);
              this.radius *= scale;
              // this.torque = -0.00002 * this.inertia;
              this.fill = `hsl(144, ${this.radius}%, 50%)`;
            }
          } else {
            if (this.radius > 15) {
              const scale = 0.99;
              Matter.Body.scale(this, scale, scale);
              this.radius *= scale;
              this.fill = `hsl(144, ${this.radius}%, 50%)`;
            }
          }
        }
      },
      search() {
        //be sure to declare searchTarget in mob spawn
        //accelerate towards the searchTarget
        if (!this.seePlayer.recall) {
          const newTarget = function (that) {
            if (Math.random() < 0.0005) {
              that.searchTarget = player.position; //chance to target player
            } else {
              //target random body
              that.searchTarget = map[Math.floor(Math.random() * (map.length - 1))].position;
            }
          };

          const sub = Vector.sub(this.searchTarget, this.position);
          if (Vector.magnitude(sub) > this.radius * 2) {
            // ctx.beginPath();
            // ctx.strokeStyle = "#aaa";
            // ctx.moveTo(this.position.x, this.position.y);
            // ctx.lineTo(this.searchTarget.x,this.searchTarget.y);
            // ctx.stroke();
            //accelerate at 0.1 of normal acceleration
            this.force = Vector.mult(Vector.normalise(sub), this.accelMag * this.mass * 0.2);
          } else {
            //after reaching random target switch to new target
            newTarget(this);
          }
          //switch to a new target after a while
          if (!(game.cycle % (this.seePlayerFreq * 15))) {
            newTarget(this);
          }
        }
      },
      blink() {
        //teleport towards player as a way to move
        if (this.seePlayer.recall && !(game.cycle % this.blinkRate)) {
          ctx.beginPath();
          ctx.moveTo(this.position.x, this.position.y);
          const dist = Vector.sub(this.seePlayer.position, this.position);
          const distMag = Vector.magnitude(dist);
          const unitVector = Vector.normalise(dist);
          const rando = (Math.random() - 0.5) * 50;
          if (distMag < this.blinkLength) {
            Matter.Body.translate(this, Vector.mult(unitVector, distMag + rando));
          } else {
            Matter.Body.translate(this, Vector.mult(unitVector, this.blinkLength + rando));
          }
          ctx.lineTo(this.position.x, this.position.y);
          ctx.lineWidth = radius * 2;
          ctx.strokeStyle = this.stroke; //"rgba(0,0,0,0.5)"; //'#000'
          ctx.stroke();
        }
      },
      drift() {
        //teleport towards player as a way to move
        if (this.seePlayer.recall && !(game.cycle % this.blinkRate)) {
          // && !mech.lookingAtMob(this,0.5)){
          ctx.beginPath();
          ctx.moveTo(this.position.x, this.position.y);
          const dist = Vector.sub(this.seePlayer.position, this.position);
          const distMag = Vector.magnitude(dist);
          const vector = Vector.mult(Vector.normalise(dist), this.blinkLength);
          if (distMag < this.blinkLength) {
            Matter.Body.setPosition(this, this.seePlayer.position);
            Matter.Body.translate(this, {
              x: (Math.random() - 0.5) * 50,
              y: (Math.random() - 0.5) * 50
            });
          } else {
            vector.x += (Math.random() - 0.5) * 200;
            vector.y += (Math.random() - 0.5) * 200;
            Matter.Body.translate(this, vector);
          }
          ctx.lineTo(this.position.x, this.position.y);
          ctx.lineWidth = radius * 2;
          ctx.strokeStyle = this.stroke;
          ctx.stroke();
        }
      },
      bomb() {
        //throw a mob/bullet at player
        if (
          !(game.cycle % this.fireFreq) &&
          Math.abs(this.position.x - this.seePlayer.position.x) < 400 && //above player
          Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 && //see player
          Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0
        ) {
          spawn.bomb(this.position.x, this.position.y + this.radius * 0.5, 10 + Math.ceil(this.radius / 15), 5);
          //add spin and speed
          Matter.Body.setAngularVelocity(mob[mob.length - 1], (Math.random() - 0.5) * 0.5);
          Matter.Body.setVelocity(mob[mob.length - 1], {
            x: this.velocity.x,
            y: this.velocity.y
          });
          //spin for mob as well
          Matter.Body.setAngularVelocity(this, (Math.random() - 0.5) * 0.25);
        }
      },
      fire() {
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
              this.fireDir.y -= Math.abs(this.seePlayer.position.x - this.position.x) / 1600; //gives the bullet an arc
            }
            //rotate towards fireAngle
            const angle = this.angle + Math.PI / 2;
            c = Math.cos(angle) * this.fireDir.x + Math.sin(angle) * this.fireDir.y;
            const threshold = 0.1;
            if (c > threshold) {
              this.torque += 0.000004 * this.inertia;
            } else if (c < -threshold) {
              this.torque -= 0.000004 * this.inertia;
            } else if (this.noseLength > 1.5) {
              //fire
              spawn.bullet(this.vertices[1].x, this.vertices[1].y, 5 + Math.ceil(this.radius / 15), 5);
              const v = 15;
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
        }
      },
      // launch() {
      //     if (this.seePlayer.recall) {
      //       //fire
      //       spawn.seeker(this.vertices[1].x, this.vertices[1].y, 5 + Math.ceil(this.radius / 15), 5);
      //       const v = 15;
      //       Matter.Body.setVelocity(mob[mob.length - 1], {
      //         x: this.velocity.x + this.fireDir.x * v + Math.random(),
      //         y: this.velocity.y + this.fireDir.y * v + Math.random()
      //       });
      //       // recoil
      //       this.force.x -= 0.005 * this.fireDir.x * this.mass;
      //       this.force.y -= 0.005 * this.fireDir.y * this.mass;
      //     }
      // },
      turnToFacePlayer() {
        //turn to face player
        const dx = player.position.x - this.position.x;
        const dy = -player.position.y + this.position.y;
        const dist = this.distanceToPlayer();
        const angle = this.angle + Math.PI / 2;
        c = Math.cos(angle) * dx - Math.sin(angle) * dy;
        // if (c > 0.04) {
        //   Matter.Body.rotate(this, 0.01);
        // } else if (c < 0.04) {
        //   Matter.Body.rotate(this, -0.01);
        // }
        if (c > 0.04 * dist) {
          this.torque += 0.002 * this.mass;
        } else if (c < 0.04) {
          this.torque -= 0.002 * this.mass;
        }
      },
      facePlayer() {
        const unitVector = Vector.normalise(Vector.sub(this.seePlayer.position, this.position));
        const angle = Math.atan2(unitVector.y, unitVector.x);
        Matter.Body.setAngle(this, angle - Math.PI);
      },
      explode(mass = this.mass) {
        mech.damage(Math.min(Math.max(0.02 * Math.sqrt(mass), 0.01), 0.35) * game.dmgScale);
        this.dropPowerUp = false;
        this.death(); //death with no power up or body
      },
      timeLimit() {
        if (!mech.isBodiesAsleep) {
          this.timeLeft--;
          if (this.timeLeft < 0) {
            this.dropPowerUp = false;
            this.death(); //death with no power up
          }
        }
      },
      healthBar() { //draw health by mob //most health bars are drawn in mobs.healthbar();
        if (this.seePlayer.recall) {
          const h = this.radius * 0.3;
          const w = this.radius * 2;
          const x = this.position.x - w / 2;
          const y = this.position.y - w * 0.7;
          ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
          ctx.fillRect(x, y, w, h);
          ctx.fillStyle = "rgba(255,0,0,0.7)";
          ctx.fillRect(x, y, w * this.health, h);
        }
      },
      damage(dmg, isBypassShield = false) {
        if (!this.isShielded || isBypassShield) {
          dmg *= mod.damageFromMods()
          //mobs specific damage changes
          if (mod.isFarAwayDmg) dmg *= 1 + Math.sqrt(Math.max(500, Math.min(3000, this.distanceToPlayer())) - 500) * 0.0067 //up to 50% dmg at max range of 3500
          if (this.shield) dmg *= 0.05

          //energy and heal drain should be calculated after damage boosts
          if (mod.energySiphon && dmg !== Infinity && this.dropPowerUp) {
            mech.energy += Math.min(this.health, dmg) * mod.energySiphon
            if (mech.energy > mech.maxEnergy) mech.energy = mech.maxEnergy
          }
          if (mod.healthDrain && dmg !== Infinity && this.dropPowerUp) {
            mech.addHealth(Math.min(this.health, dmg) * mod.healthDrain)
            if (mech.health > mech.maxHealth) mech.health = mech.maxHealth
          }
          dmg /= Math.sqrt(this.mass)
          this.health -= dmg
          //this.fill = this.color + this.health + ')';
          this.onDamage(dmg); //custom damage effects
          if (this.health < 0.05 && this.alive) this.death();
        }
      },
      onDamage() {
        // a placeholder for custom effects on mob damage
        //to use declare custom method in mob spawn
      },
      onDeath() {
        // a placeholder for custom effects on mob death
        // to use declare custom method in mob spawn
      },
      leaveBody: true,
      dropPowerUp: true,
      death() {
        this.onDeath(this); //custom death effects
        this.removeConsBB();
        this.alive = false; //triggers mob removal in mob[i].replace(i)
        if (this.dropPowerUp) {
          if (mod.isEnergyLoss) mech.energy *= 0.66;
          powerUps.spawnRandomPowerUp(this.position.x, this.position.y);
          mech.lastKillCycle = mech.cycle; //tracks the last time a kill was made, mostly used in game.checks()
          if (Math.random() < mod.sporesOnDeath) {
            const len = Math.min(30, Math.floor(4 + this.mass * Math.random()))
            for (let i = 0; i < len; i++) {
              b.spore(this.position)
            }
          }
          if (Math.random() < mod.isBotSpawner) b.randomBot(this.position, false)
          if (mod.isExplodeMob) b.explosion(this.position, Math.min(450, Math.sqrt(this.mass + 3) * 80))
          if (mod.nailsDeathMob) b.targetedNail(this.position, mod.nailsDeathMob)
        } else if (mod.isShieldAmmo && this.shield) {
          let type = "ammo"
          if (Math.random() < 0.33 || mod.bayesian) {
            type = "heal"
          } else if (Math.random() < 0.5 && !mod.isSuperDeterminism) {
            type = "reroll"
          }
          for (let i = 0, len = 1 + Math.ceil(2 * Math.random()); i < len; i++) {
            powerUps.spawn(this.position.x, this.position.y, type);
            if (Math.random() < mod.bayesian) powerUps.spawn(this.position.x, this.position.y, type);
          }
        }
      },
      removeConsBB() {
        for (let i = 0, len = consBB.length; i < len; ++i) {
          if (consBB[i].bodyA === this) {
            if (consBB[i].bodyB.shield) {
              consBB[i].bodyB.do = function () {
                this.death();
              };
            }
            consBB[i].bodyA = consBB[i].bodyB;
            consBB.splice(i, 1);
            this.removeConsBB();
            break;
          } else if (consBB[i].bodyB === this) {
            if (consBB[i].bodyA.shield) {
              consBB[i].bodyA.do = function () {
                this.death();
              };
            }
            consBB[i].bodyB = consBB[i].bodyA;
            consBB.splice(i, 1);
            this.removeConsBB();
            break;
          }
        }
      },
      removeCons() {
        for (let i = 0, len = cons.length; i < len; ++i) {
          if (cons[i].bodyA === this) {
            cons[i].bodyA = cons[i].bodyB;
            cons.splice(i, 1);
            this.removeCons();
            break;
          } else if (cons[i].bodyB === this) {
            cons[i].bodyB = cons[i].bodyA;
            cons.splice(i, 1);
            this.removeCons();
            break;
          }
        }
      },
      //replace dead mob with a regular body
      replace(i) {
        //if there are too many bodies don't turn into blocks to help performance
        if (this.leaveBody && body.length < 60 && this.mass < 100) {
          const len = body.length;
          const v = Matter.Vertices.hull(Matter.Vertices.clockwiseSort(this.vertices)) //might help with vertex collision issue, not sure
          body[len] = Matter.Bodies.fromVertices(this.position.x, this.position.y, v);
          Matter.Body.setVelocity(body[len], Vector.mult(this.velocity, 0.5));
          Matter.Body.setAngularVelocity(body[len], this.angularVelocity);
          body[len].collisionFilter.category = cat.body;
          body[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet;
          // if (body[len].mass > 10 || 45 + 10 * Math.random() < body.length) {
          //   body[len].collisionFilter.mask = cat.player | cat.bullet | cat.mob | cat.mobBullet;
          // }
          body[len].classType = "body";
          World.add(engine.world, body[len]); //add to world

          //large mobs shrink so they don't block paths
          if (body[len].mass > 10) {
            const shrink = function (that, massLimit) {
              if (that.mass > massLimit) {
                const scale = 0.95;
                Matter.Body.scale(that, scale, scale);
                setTimeout(shrink, 20, that, massLimit);
              }
            };
            shrink(body[len], 9 + 5 * Math.random())
          }
        }
        Matter.World.remove(engine.world, this);
        mob.splice(i, 1);
      }
    });
    mob[i].alertRange2 = Math.pow(mob[i].radius * 3.5 + 550, 2);
    World.add(engine.world, mob[i]); //add to world
  }
};