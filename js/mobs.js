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
  alert(range) {
    range = range * range;
    for (let i = 0; i < mob.length; i++) {
      if (mob[i].distanceToPlayer2() < range) mob[i].locatePlayer();
    }
  },
  startle(amount) {
    for (let i = 0; i < mob.length; i++) {
      if (!mob[i].seePlayer.yes) {
        mob[i].force.x += amount * mob[i].mass * (Math.random() - 0.5);
        mob[i].force.y += amount * mob[i].mass * (Math.random() - 0.5);
      }
    }
  },
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
        category: 0x000010,
        mask: 0x001111
      },
      onHit: undefined,
      alive: true,
      index: i,
      health: 1,
      accelMag: 0.001,
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
      seeAtDistance2: 4000000, //sqrt(4000000) = 2000 = max seeing range
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
      seePlayerFreq: 20 + Math.round(Math.random() * 20), //how often NPC checks to see where player is, lower numbers have better vision
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
      locatePlayer() {
        // updates mob's memory of player location
        this.seePlayer.recall = this.memory + Math.round(this.memory * Math.random()); //seconds before mob falls a sleep
        this.seePlayer.position.x = player.position.x;
        this.seePlayer.position.y = player.position.y;
      },
      locatePlayerByDist() {
        if (this.distanceToPlayer2() < this.locateRange) {
          this.locatePlayer();
        }
      },
      seePlayerCheck() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            this.distanceToPlayer2() < this.seeAtDistance2 &&
            Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 &&
            Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      seePlayerCheckByDistance() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (this.distanceToPlayer2() < this.seeAtDistance2) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      seePlayerByDistOrLOS() {
        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            this.distanceToPlayer2() < this.seeAtDistance2 ||
            (Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 && Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0)
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
            (Matter.Query.ray(map, this.position, this.mechPosRange()).length === 0 && Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0)
          ) {
            this.foundPlayer();
          } else if (this.seePlayer.recall) {
            this.lostPlayer();
          }
        }
      },
      isLookingAtPlayer(threshold) {
        const diff = Matter.Vector.normalise(Matter.Vector.sub(player.position, this.position));
        //make a vector for the mob's direction of length 1
        const dir = {
          x: Math.cos(this.angle),
          y: Math.sin(this.angle)
        };
        //the dot product of diff and dir will return how much over lap between the vectors
        const dot = Matter.Vector.dot(dir, diff);
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
            Matter.Query.ray(body, this.position, this.mechPosRange()).length === 0
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
        //mob vision for testing
        // ctx.beginPath();
        // ctx.lineWidth = "5";
        // ctx.strokeStyle = "#ff0";
        // ctx.moveTo(this.position.x, this.position.y);
        // ctx.lineTo(targetPos.x, targetPos.y);
        // ctx.stroke();
        // return targetPos;
      },
      laserBeam() {
        if (game.cycle % 7 && this.seePlayer.yes) {
          ctx.setLineDash([125 * Math.random(), 125 * Math.random()]);
          // ctx.lineDashOffset = 6*(game.cycle % 215);
          if (this.distanceToPlayer() < this.laserRange) {
            //if (Math.random()>0.2 && this.seePlayer.yes && this.distanceToPlayer2()<800000) {
            mech.damage(0.0004 * game.dmgScale);
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
          vertexCollision(this.position, look, [player]);
          // hitting player
          if (best.who === player) {
            dmg = 0.004 * game.dmgScale;
            mech.damage(dmg);
            //draw damage
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(best.x, best.y, dmg * 2000, 0, 2 * Math.PI);
            ctx.fill();
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
        ctx.beginPath();
        ctx.arc(this.cons.pointA.x, this.cons.pointA.y, 6, 0, 2 * Math.PI);
        ctx.arc(this.cons2.pointA.x, this.cons2.pointA.y, 6, 0, 2 * Math.PI);
        // ctx.arc(this.cons.bodyB.position.x, this.cons.bodyB.position.y,6,0,2*Math.PI);
        ctx.fillStyle = "#222";
        ctx.fill();

        if (!(game.cycle % this.seePlayerFreq)) {
          if (
            (this.seePlayer.recall || this.isLookingAtPlayer(this.lookRange)) &&
            this.distanceToPlayer2() < this.seeAtDistance2 &&
            Matter.Query.ray(map, this.position, player.position).length === 0 &&
            Matter.Query.ray(body, this.position, player.position).length === 0
          ) {
            this.foundPlayer();
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
          const seeRange = 3000;
          if (!(game.cycle % (this.seePlayerFreq * 10))) {
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
            if (best.dist2 != Infinity) {
              this.springTarget.x = best.x;
              this.springTarget.y = best.y;
              this.cons.length = 100 + 1.5 * this.radius;
              this.cons2.length = 100 + 1.5 * this.radius;
            }
          }
          if (!((game.cycle + this.seePlayerFreq * 5) % (this.seePlayerFreq * 10))) {
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
            if (best.dist2 != Infinity) {
              this.springTarget2.x = best.x;
              this.springTarget2.y = best.y;
              this.cons.length = 100 + 1.5 * this.radius;
              this.cons2.length = 100 + 1.5 * this.radius;
            }
          }
        }
      },
      alertNearByMobs() {
        //this.alertRange2 is set at the very bottom of this mobs, after mob is made
        for (let i = 0; i < mob.length; i++) {
          if (!mob[i].seePlayer.recall && Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.position, mob[i].position)) < this.alertRange2) {
            mob[i].locatePlayer();
          }
        }
        //add alert to draw queue
        // game.drawList.push({
        //     x: this.position.x,
        //     y: this.position.y,
        //     radius: Math.sqrt(this.alertRange2),
        //     color: "rgba(0,0,0,0.02)",
        //     time: game.drawTime
        // });
      },
      zoom() {
        this.zoomMode--;
        if (this.zoomMode > 150) {
          this.drawTrail();
          if (this.seePlayer.recall) {
            //attraction to player
            const forceMag = this.accelMag * this.mass;
            const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
            this.force.x += forceMag * Math.cos(angle);
            this.force.y += forceMag * Math.sin(angle);
          }
        } else if (this.zoomMode < 0) {
          this.zoomMode = 300;
          this.setupTrail();
        }
      },
      setupTrail() {
        this.trail = [];
        for (let i = 0; i < this.trailLength; ++i) {
          this.trail.push({
            x: this.position.x,
            y: this.position.y
          });
        }
      },
      drawTrail() {
        //dont' forget to run setupTrail() after mob spawn
        const t = this.trail;
        const len = t.length;
        t.pop();
        t.unshift({
          x: this.position.x,
          y: this.position.y
        });
        //draw
        ctx.strokeStyle = this.trailFill;
        ctx.beginPath();
        // ctx.moveTo(t[0].x, t[0].y);
        // ctx.lineTo(t[0].x, t[0].y);
        // ctx.globalAlpha = 0.2;
        // ctx.lineWidth = this.radius * 3;
        // ctx.stroke();
        ctx.globalAlpha = 0.5 / len;
        ctx.lineWidth = this.radius * 1.95;
        for (let i = 0; i < len; ++i) {
          // ctx.lineWidth *= 0.96;
          ctx.lineTo(t[i].x, t[i].y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      },
      // darkness() {
      //   // var grd = ctx.createRadialGradient(this.position.x, this.position.y, this.eventHorizon/3, this.position.x, this.position.y, this.eventHorizon);
      //   // grd.addColorStop(0, "rgba(0,0,0,1)");
      //   // grd.addColorStop(1, "rgba(0,0,0,0)");
      //   // ctx.fillStyle=grd;
      //   // ctx.beginPath();
      //   // ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
      //   // ctx.fill();

      //   ctx.beginPath();
      //   ctx.arc(this.position.x, this.position.y, this.eventHorizon * 0.33, 0, 2 * Math.PI);
      //   ctx.fillStyle = "rgba(0,0,0,0.7)";
      //   ctx.fill();
      //   ctx.beginPath();
      //   ctx.arc(this.position.x, this.position.y, this.eventHorizon * 0.66, 0, 2 * Math.PI);
      //   ctx.fillStyle = "rgba(0,0,0,0.4)";
      //   ctx.fill();
      //   ctx.beginPath();
      //   ctx.arc(this.position.x, this.position.y, this.eventHorizon, 0, 2 * Math.PI);
      //   ctx.fillStyle = "rgba(0,0,0,0.1)";
      //   ctx.fill();
      // },
      curl() {
        //cause all mobs, and bodies to rotate in a circle
        const range = 1000

        applyCurl = function (center, array) {
          for (let i = 0; i < array.length; ++i) {
            const sub = Matter.Vector.sub(center, array[i].position)
            const radius2 = Matter.Vector.magnitudeSquared(sub);

            //if too close, like center mob or shield, don't curl   // if too far don't curl
            if (radius2 < range * range && radius2 > 10000) {
              const curlVector = Matter.Vector.perp(Matter.Vector.normalise(sub))

              //apply curl force
              const mag = Matter.Vector.mult(curlVector, 10)
              Matter.Body.setVelocity(array[i], {
                x: array[i].velocity.x * 0.99 + mag.x * 0.01,
                y: array[i].velocity.y * 0.99 + mag.y * 0.01
              })

              //draw curl
              ctx.beginPath();
              ctx.moveTo(array[i].position.x, array[i].position.y);
              ctx.lineTo(array[i].position.x + curlVector.x * 100, array[i].position.y + curlVector.y * 100);
              ctx.lineWidth = 2;
              ctx.strokeStyle = "#000";
              ctx.stroke();
            }
          }
        }
        applyCurl(this.position, mob);
        applyCurl(this.position, body);


        //draw limit
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, range, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(55,255,255, 0.1)";
        ctx.fill();
      },
      pullPlayer() {
        if (this.seePlayer.yes && Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.position, player.position)) < 1000000) {
          const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
          player.force.x -= 1.3 * Math.cos(angle) * (mech.onGround ? 2 * player.mass * game.g : player.mass * game.g);
          player.force.y -= 0.97 * player.mass * game.g * Math.sin(angle);

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
      hop() {
        //accelerate towards the player after a delay
        if (this.cd < game.cycle && this.seePlayer.recall && this.speed < 1) {
          this.cd = game.cycle + this.delay;
          const forceMag = (this.accelMag + this.accelMag * Math.random()) * this.mass;
          const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
          this.force.x += forceMag * Math.cos(angle);
          this.force.y += forceMag * Math.sin(angle) - 0.04 * this.mass; //antigravity
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
      },
      search() {
        //be sure to declare searchTarget in mob spawn
        //accelerate towards the searchTarget
        if (!this.seePlayer.recall) {
          const newTarget = function (that) {
            if (Math.random() < 0.05) {
              that.searchTarget = player.position; //chance to target player
            } else {
              //target random body
              that.searchTarget = map[Math.floor(Math.random() * (map.length - 1))].position;
            }
          };

          const sub = Matter.Vector.sub(this.searchTarget, this.position);
          if (Matter.Vector.magnitude(sub) > this.radius * 2) {
            // ctx.beginPath();
            // ctx.strokeStyle = "#aaa";
            // ctx.moveTo(this.position.x, this.position.y);
            // ctx.lineTo(this.searchTarget.x,this.searchTarget.y);
            // ctx.stroke();
            //accelerate at 0.1 of normal acceleration
            this.force = Matter.Vector.mult(Matter.Vector.normalise(sub), this.accelMag * this.mass * 0.2);
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
      strike() {
        //teleport to player when close enough on CD
        if (this.seePlayer.recall && this.cd < game.cycle) {
          const dist = Matter.Vector.sub(this.seePlayer.position, this.position);
          const distMag = Matter.Vector.magnitude(dist);
          if (distMag < 430) {
            this.cd = game.cycle + this.delay;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            Matter.Body.translate(this, Matter.Vector.mult(Matter.Vector.normalise(dist), distMag - 20 - radius));
            ctx.lineTo(this.position.x, this.position.y);
            ctx.lineWidth = radius * 2;
            ctx.strokeStyle = this.fill; //"rgba(0,0,0,0.5)"; //'#000'
            ctx.stroke();
          }
        }
      },
      blink() {
        //teleport towards player as a way to move
        if (this.seePlayer.recall && !(game.cycle % this.blinkRate)) {
          ctx.beginPath();
          ctx.moveTo(this.position.x, this.position.y);
          const dist = Matter.Vector.sub(this.seePlayer.position, this.position);
          const distMag = Matter.Vector.magnitude(dist);
          const unitVector = Matter.Vector.normalise(dist);
          const rando = (Math.random() - 0.5) * 50;
          if (distMag < this.blinkLength) {
            Matter.Body.translate(this, Matter.Vector.mult(unitVector, distMag + rando));
          } else {
            Matter.Body.translate(this, Matter.Vector.mult(unitVector, this.blinkLength + rando));
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
          const dist = Matter.Vector.sub(this.seePlayer.position, this.position);
          const distMag = Matter.Vector.magnitude(dist);
          const vector = Matter.Vector.mult(Matter.Vector.normalise(dist), this.blinkLength);
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
          spawn.bullet(this.position.x, this.position.y + this.radius * 0.5, 10 + Math.ceil(this.radius / 15), 5);
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
        const setNoseShape = () => {
          const mag = this.radius + this.radius * this.noseLength;
          this.vertices[1].x = this.position.x + Math.cos(this.angle) * mag;
          this.vertices[1].y = this.position.y + Math.sin(this.angle) * mag;
        };
        //throw a mob/bullet at player
        if (this.seePlayer.recall) {
          //set direction to turn to fire
          if (!(game.cycle % this.seePlayerFreq)) {
            this.fireDir = Matter.Vector.normalise(Matter.Vector.sub(this.seePlayer.position, this.position));
            this.fireDir.y -= Math.abs(this.seePlayer.position.x - this.position.x) / 1600; //gives the bullet an arc
            this.fireAngle = Math.atan2(this.fireDir.y, this.fireDir.x);
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
      },
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
        const unitVector = Matter.Vector.normalise(Matter.Vector.sub(this.seePlayer.position, this.position));
        const angle = Math.atan2(unitVector.y, unitVector.x);
        Matter.Body.setAngle(this, angle - Math.PI);
      },
      explode() {
        mech.damage(Math.min(Math.max(0.02 * Math.sqrt(this.mass), 0.05), 0.35) * game.dmgScale);
        this.dropPowerUp = false;
        this.death(); //death with no power up or body
      },
      timeLimit() {
        this.timeLeft--;
        if (this.timeLeft < 0) {
          this.dropPowerUp = false;
          this.death(); //death with no power up
        }
      },
      healthBar() {
        //draw health bar
        if (this.seePlayer.recall) {
          // && this.health < 1
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
      damage(dmg) {
        this.health -= dmg / Math.sqrt(this.mass);
        //this.fill = this.color + this.health + ')';
        if (this.health < 0.1) this.death();
        this.onDamage(this); //custom damage effects
      },
      onDamage() {
        // a placeholder for custom effects on mob damage
        //to use declare custom method in mob spawn
      },
      onDeath() {
        // a placeholder for custom effects on mob death
        //to use declare custom method in mob spawn
      },
      leaveBody: true,
      dropPowerUp: true,
      death() {
        this.onDeath(this); //custom death effects
        this.removeConsBB();
        this.alive = false;
        if (this.dropPowerUp) powerUps.spawnRandomPowerUp(this.position.x, this.position.y, this.mass, radius);
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
        if (this.leaveBody) {
          const len = body.length;
          body[len] = Matter.Bodies.fromVertices(this.position.x, this.position.y, this.vertices);
          Matter.Body.setVelocity(body[len], this.velocity);
          Matter.Body.setAngularVelocity(body[len], this.angularVelocity);
          body[len].collisionFilter.category = 0x000001;
          body[len].collisionFilter.mask = 0x011111;
          // body[len].collisionFilter.category = body[len].collisionFilter.category //0x000001;
          // body[len].collisionFilter.mask = body[len].collisionFilter.mask //0x011111;

          //large mobs or too many bodyes go intangible and fall until removed from game to help performance
          if (body[len].mass > 10 || 40 + 30 * Math.random() < body.length) {
            body[len].collisionFilter.mask = 0x000100;
          }
          body[len].classType = "body";
          World.add(engine.world, body[len]); //add to world
        }
        Matter.World.remove(engine.world, this);
        mob.splice(i, 1);
      }
    });
    mob[i].alertRange2 = Math.pow(mob[i].radius * 3 + 200, 2);
    World.add(engine.world, mob[i]); //add to world
  }
};