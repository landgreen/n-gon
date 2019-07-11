//main object for spawning things in a level
const spawn = {
  pickList: ["starter", "starter"],
  fullPickList: [
    "chaser", "chaser", "chaser",
    "striker", "striker",
    "spinner",
    "hopper", "hopper", "hopper", "hopper",
    "grower",
    "springer",
    "shooter", "shooter", "shooter", "shooter", "shooter",
    "beamer",
    "focuser",
    "laser", "laser",
    "blinker",
    "sucker",
    "exploder", "exploder", "exploder",
    "spawner",
    "ghoster",
    "sneaker",
  ],
  allowedBossList: ["chaser", "spinner", "striker", "springer", "laser", "focuser", "beamer", "exploder", "spawner", "shooter"], //"zoomer", 
  setSpawnList() {
    //this is run at the start of each new level to determine the possible mobs for the level
    //each level has 2 mobs: one new mob and one from the last level
    spawn.pickList.splice(0, 1);
    spawn.pickList.push(spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)]);
  },
  randomMob(x, y, chance = 1) {
    if (Math.random() < chance + 0.1 * (game.levelsCleared - 1) && mob.length < 4 + game.levelsCleared * 2) {
      const pick = this.pickList[Math.floor(Math.random() * this.pickList.length)];
      this[pick](x, y);
    }
  },
  randomSmallMob(
    x,
    y,
    num = Math.max(Math.min(Math.round(Math.random() * (game.levelsCleared - 1) * 0.5 - 0.4), 4), 0),
    size = 16 + Math.ceil(Math.random() * 15),
    chance = 1
  ) {
    if (Math.random() < chance + (game.levelsCleared - 1) * 0.03 && mob.length < 4 + game.levelsCleared * 2) {
      for (let i = 0; i < num; ++i) {
        const pick = this.pickList[Math.floor(Math.random() * this.pickList.length)];
        this[pick](x + Math.round((Math.random() - 0.5) * 20) + i * size * 2.5, y + Math.round((Math.random() - 0.5) * 20), size);
      }
    }
  },
  randomBoss(x, y, chance = 1) {
    if (Math.random() < chance + (game.levelsCleared - 1) * 0.15 && game.levelsCleared !== 1 && mob.length < 4 + game.levelsCleared * 2.1 || chance == Infinity) {
      //choose from the possible picklist
      let pick = this.pickList[Math.floor(Math.random() * this.pickList.length)];
      //is the pick able to be a boss?
      let canBeBoss = false;
      for (let i = 0, len = this.allowedBossList.length; i < len; ++i) {
        if (this.allowedBossList[i] === pick) {
          canBeBoss = true;
          break;
        }
      }
      if (canBeBoss) {
        if (Math.random() < 0.55) {
          this.nodeBoss(x, y, pick);
        } else {
          this.lineBoss(x, y, pick);
        }
      } else {
        if (Math.random() < 0.07) {
          this[pick](x, y, 90 + Math.random() * 40); //one extra large mob
        } else if (Math.random() < 0.35) {
          this.groupBoss(x, y) //hidden grouping blocks
        } else {
          pick = (Math.random() < 0.5) ? "randomList" : "random";
          if (Math.random() < 0.55) {
            this.nodeBoss(x, y, pick);
          } else {
            this.lineBoss(x, y, pick);
          }
        }
      }
    }
  },

  //mob templates *********************************************************************************************
  //***********************************************************************************************************
  groupBoss(x, y, num = 5 + Math.random() * 8) {
    for (let i = 0; i < num; i++) {
      const radius = 25 + Math.floor(Math.random() * 20)
      spawn.grouper(x + Math.random() * radius, y + Math.random() * radius, radius);
    }
  },
  grouper(x, y, radius = 27 + Math.floor(Math.random() * 10)) {
    mobs.spawn(x, y, 4, radius, "#777");
    let me = mob[mob.length - 1];
    me.g = 0.0002; //required if using 'gravity'
    me.accelMag = 0.0007;
    me.groupingRangeMax = 250000 + Math.random() * 100000;
    me.groupingRangeMin = (radius * 8) * (radius * 8);
    me.groupingStrength = 0.0005
    me.memory = 200;

    me.do = function () {
      this.gravity();
      if (this.seePlayer.recall) {
        this.seePlayerByDistAndLOS();
        this.healthBar();
        this.attraction();
        //tether to other blocks
        ctx.beginPath();
        for (let i = 0, len = mob.length; i < len; i++) {
          if (mob[i] != this && mob[i].dropPowerUp) { //don't tether to self, bullets, shields, ...
            const distance2 = Matter.Vector.magnitudeSquared(Matter.Vector.sub(this.position, mob[i].position))
            if (distance2 < this.groupingRangeMax) {
              if (!mob[i].seePlayer.recall) mob[i].seePlayerByDistAndLOS(); //wake up sleepy mobs
              if (distance2 > this.groupingRangeMin) {
                const angle = Math.atan2(mob[i].position.y - this.position.y, mob[i].position.x - this.position.x);
                const forceMag = this.groupingStrength * mob[i].mass;
                mob[i].force.x -= forceMag * Math.cos(angle);
                mob[i].force.y -= forceMag * Math.sin(angle);
              }
              ctx.moveTo(this.position.x, this.position.y);
              ctx.lineTo(mob[i].position.x, mob[i].position.y);
            }
          }
        }
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  },
  starter(x, y, radius = 30) {
    //easy mob for on level 1
    mobs.spawn(x, y, 8, radius, "#9ccdc6");
    let me = mob[mob.length - 1];
    me.accelMag = 0.00055;
    me.memory = 60;
    Matter.Body.setDensity(me, 0.0005) // normal density is 0.001 // this reduces life by half and decreases knockback

    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      this.attraction();
    };
  },
  chaser(x, y, radius = 35 + Math.ceil(Math.random() * 40)) {
    mobs.spawn(x, y, 8, radius, "#2c9790");
    let me = mob[mob.length - 1];
    // Matter.Body.setDensity(me, 0.0007); //extra dense //normal is 0.001 //makes effective life much lower
    me.friction = 0;
    me.frictionAir = 0;
    me.accelMag = 0.001;
    me.g = me.accelMag * 0.6; //required if using 'gravity'
    me.memory = 50;
    if (Math.random() < Math.min((game.levelsCleared - 1) * 0.1, 0.7)) spawn.shield(me, x, y);
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.seePlayerCheck();
      this.attraction();
    };
  },
  grower(x, y, radius = 15) {
    mobs.spawn(x, y, 7, radius, "hsl(144, 15%, 50%)");
    let me = mob[mob.length - 1];
    me.big = false; //required for grow
    me.accelMag = 0.00045;
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      this.attraction();
      this.grow();
    };
  },
  springer(x, y, radius = 20 + Math.ceil(Math.random() * 35)) {
    mobs.spawn(x, y, 8, radius, "#b386e8");
    let me = mob[mob.length - 1];
    me.friction = 0;
    me.frictionAir = 0.1;
    me.lookTorque = 0.000005;
    me.g = 0.0002; //required if using 'gravity'
    me.seePlayerFreq = Math.ceil(40 + 25 * Math.random());
    const springStiffness = 0.002;
    const springDampening = 0.1;

    me.springTarget = {
      x: me.position.x,
      y: me.position.y
    };
    const len = cons.length;
    cons[len] = Constraint.create({
      pointA: me.springTarget,
      bodyB: me,
      stiffness: springStiffness,
      damping: springDampening
    });
    cons[len].length = 100 + 1.5 * radius;
    me.cons = cons[len];

    me.springTarget2 = {
      x: me.position.x,
      y: me.position.y
    };
    const len2 = cons.length;
    cons[len2] = Constraint.create({
      pointA: me.springTarget2,
      bodyB: me,
      stiffness: springStiffness,
      damping: springDampening
    });
    cons[len2].length = 100 + 1.5 * radius;
    me.cons2 = cons[len2];

    me.onDeath = function () {
      this.removeCons();
    };
    if (Math.random() < Math.min((game.levelsCleared - 1) * 0.1, 0.7)) spawn.shield(me, x, y);
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.searchSpring();
    };
  },
  zoomer(x, y, radius = 20 + Math.ceil(Math.random() * 30)) {
    mobs.spawn(x, y, 6, radius, "#ffe2fd");
    let me = mob[mob.length - 1];
    me.trailLength = 20; //required for trails
    me.setupTrail(); //fill trails array up with the current position of mob
    me.trailFill = "#ff00f0";
    me.g = 0.001; //required if using 'gravity'
    me.frictionAir = 0.02;
    me.accelMag = 0.004;
    me.memory = 30;
    me.zoomMode = 150;
    me.onHit = function () {
      this.zoomMode = 150;
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerByDistAndLOS();
      this.zoom();
      this.gravity();
    };
  },
  hopper(x, y, radius = 30 + Math.ceil(Math.random() * 30)) {
    mobs.spawn(x, y, 5, radius, "rgb(0,200,180)");
    let me = mob[mob.length - 1];
    me.accelMag = 0.04;
    me.g = 0.0015; //required if using 'gravity'
    me.frictionAir = 0.018;
    me.restitution = 0;
    me.delay = 110;
    me.randomHopFrequency = 50 + Math.floor(Math.random() * 1000);
    me.randomHopCD = game.cycle + me.randomHopFrequency;
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.seePlayerCheck();
      this.hop();
      //randomly hob if not aware of player
      if (this.randomHopCD < game.cycle && this.speed < 1 && !this.seePlayer.recall) {
        this.randomHopCD = game.cycle + this.randomHopFrequency;
        //slowly change randomHopFrequency after each hop
        this.randomHopFrequency = Math.max(100, this.randomHopFrequency + (0.5 - Math.random()) * 200);
        const forceMag = (this.accelMag + this.accelMag * Math.random()) * this.mass * (0.1 + Math.random() * 0.3);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        this.force.x += forceMag * Math.cos(angle);
        this.force.y += forceMag * Math.sin(angle) - 0.04 * this.mass; //antigravity
      }
    };
  },
  spinner(x, y, radius = 30 + Math.ceil(Math.random() * 35)) {
    mobs.spawn(x, y, 5, radius, "#000000");
    let me = mob[mob.length - 1];
    me.fill = "#28b";
    me.rememberFill = me.fill;
    me.cdBurst1 = 0; //must add for burstAttraction
    me.cdBurst2 = 0; //must add for burstAttraction
    me.delay = 0;
    me.burstDir = {
      x: 0,
      y: 0
    };
    me.accelMag = 0.16;
    me.frictionAir = 0.022;
    me.lookTorque = 0.0000014;
    me.restitution = 0;
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      //accelerate towards the player after a delay
      if (this.seePlayer.recall) {
        if (this.cdBurst2 < game.cycle && this.angularSpeed < 0.01) {
          this.cdBurst2 = Infinity;
          this.cdBurst1 = game.cycle + 40;
          this.burstDir = Matter.Vector.normalise(Matter.Vector.sub(this.seePlayer.position, this.position));
        } else if (this.cdBurst1 < game.cycle) {
          this.cdBurst2 = game.cycle + this.delay;
          this.cdBurst1 = Infinity;
          this.force = Matter.Vector.mult(this.burstDir, this.mass * 0.25);
          this.fill = this.rememberFill;
        } else if (this.cdBurst1 != Infinity) {
          this.torque += 0.000035 * this.inertia;
          this.fill = randomColor({
            hue: "blue"
          });
          //draw attack vector
          const mag = this.radius * 2 + 200;
          const gradient = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, mag);
          gradient.addColorStop(0, "rgba(0,0,0,0.2)");
          gradient.addColorStop(1, "transparent");
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 5;
          ctx.setLineDash([10, 20]); //30
          const dir = Matter.Vector.add(this.position, Matter.Vector.mult(this.burstDir, mag));
          ctx.beginPath();
          ctx.moveTo(this.position.x, this.position.y);
          ctx.lineTo(dir.x, dir.y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          this.fill = this.rememberFill;
        }
      } else {
        this.cdBurst2 = 0;
      }
    };
  },
  sucker(x, y, radius = 30 + Math.ceil(Math.random() * 70)) {
    radius = 9 + radius / 8; //extra small
    mobs.spawn(x, y, 6, radius, "#000");
    let me = mob[mob.length - 1];
    me.stroke = "transparent"; //used for drawSneaker
    me.eventHorizon = radius * 23; //required for blackhole
    me.seeAtDistance2 = (me.eventHorizon + 500) * (me.eventHorizon + 500); //vision limit is event horizon
    me.accelMag = 0.00009;
    // me.frictionAir = 0.005;
    me.memory = 600;
    Matter.Body.setDensity(me, 0.004); //extra dense //normal is 0.001 //makes effective life much larger
    // me.collisionFilter.mask = 0x001100; //move through walls
    me.do = function () {
      //keep it slow, to stop issues from explosion knock backs
      if (this.speed > 5) {
        Matter.Body.setVelocity(this, {
          x: this.velocity.x * 0.99,
          y: this.velocity.y * 0.99
        });
      }
      this.seePlayerByDistOrLOS();
      if (this.seePlayer.recall) {
        //eventHorizon waves in and out
        eventHorizon = this.eventHorizon * (0.93 + 0.17 * Math.sin(game.cycle * 0.011))

        //accelerate towards the player
        const forceMag = this.accelMag * this.mass;
        const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
        this.force.x += forceMag * Math.cos(angle);
        this.force.y += forceMag * Math.sin(angle);

        //draw darkness
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, eventHorizon * 0.25, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, eventHorizon * 0.55, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, eventHorizon, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fill();

        this.healthBar();
        //when player is inside event horizon
        if (Matter.Vector.magnitude(Matter.Vector.sub(this.position, player.position)) < eventHorizon) {
          mech.damage(0.00015 * game.dmgScale);
          if (mech.fieldMeter > 0.1) mech.fieldMeter -= 0.01
          const angle = Math.atan2(player.position.y - this.position.y, player.position.x - this.position.x);
          player.force.x -= 1.25 * Math.cos(angle) * player.mass * game.g * (mech.onGround ? 1.8 : 1);
          player.force.y -= 0.96 * player.mass * game.g * Math.sin(angle);
          //draw line to player
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
      }
    }
  },
  beamer(x, y, radius = 15 + Math.ceil(Math.random() * 15)) {
    mobs.spawn(x, y, 4, radius, "rgb(255,0,190)");
    let me = mob[mob.length - 1];
    me.repulsionRange = 73000; //squared
    me.laserRange = 370;
    // me.seePlayerFreq = 2 + Math.round(Math.random() * 5);
    me.accelMag = 0.0005;
    me.frictionStatic = 0;
    me.friction = 0;
    if (Math.random() < Math.min(0.2 + (game.levelsCleared - 1) * 0.1, 0.7)) spawn.shield(me, x, y);
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      this.attraction();
      this.repulsion();
      //laser beam
      this.laserBeam();
    };
  },
  focuser(x, y, radius = 30 + Math.ceil(Math.random() * 10)) {
    radius = Math.ceil(radius * 0.7);
    mobs.spawn(x, y, 4, radius, "rgb(0,0,255)");
    let me = mob[mob.length - 1];
    Matter.Body.setDensity(me, 0.003); //extra dense //normal is 0.001
    me.restitution = 0;
    me.laserPos = me.position; //required for laserTracking
    me.repulsionRange = 1200000; //squared
    //me.seePlayerFreq = 2 + Math.round(Math.random() * 5);
    me.accelMag = 0.0002;
    me.frictionStatic = 0;
    me.friction = 0;
    me.onDamage = function () {
      this.laserPos = this.position;
    };
    // if (Math.random() < Math.min(0.2 + game.levelsCleared * 0.1, 0.7)) spawn.shield(me, x, y);
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      const dist2 = this.distanceToPlayer2();
      //laser Tracking
      if (this.seePlayer.yes && dist2 < 4000000) {
        this.attraction();
        const rangeWidth = 2000; //this is sqrt of 4000000 from above if()
        //targeting laser will slowly move from the mob to the player's position
        this.laserPos = Matter.Vector.add(this.laserPos, Matter.Vector.mult(Matter.Vector.sub(player.position, this.laserPos), 0.1));
        let targetDist = Matter.Vector.magnitude(Matter.Vector.sub(this.laserPos, mech.pos));
        const r = 10;

        // ctx.setLineDash([15, 200]);
        // ctx.lineDashOffset = 20*(game.cycle % 215);
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        if (targetDist < r + 15) {
          // || dist2 < 80000
          targetDist = r + 10;
          //charge at player
          const forceMag = this.accelMag * 40 * this.mass;
          const angle = Math.atan2(this.seePlayer.position.y - this.position.y, this.seePlayer.position.x - this.position.x);
          this.force.x += forceMag * Math.cos(angle);
          this.force.y += forceMag * Math.sin(angle);
        } else {
          //high friction if can't lock onto player
          Matter.Body.setVelocity(this, {
            x: this.velocity.x * 0.96,
            y: this.velocity.y * 0.96
          });
        }
        if (dist2 > 80000) {
          const laserWidth = 0.002;
          let laserOffR = Matter.Vector.rotateAbout(this.laserPos, (targetDist - r) * laserWidth, this.position);
          let sub = Matter.Vector.normalise(Matter.Vector.sub(laserOffR, this.position));
          laserOffR = Matter.Vector.add(laserOffR, Matter.Vector.mult(sub, rangeWidth));
          ctx.lineTo(laserOffR.x, laserOffR.y);

          let laserOffL = Matter.Vector.rotateAbout(this.laserPos, (targetDist - r) * -laserWidth, this.position);
          sub = Matter.Vector.normalise(Matter.Vector.sub(laserOffL, this.position));
          laserOffL = Matter.Vector.add(laserOffL, Matter.Vector.mult(sub, rangeWidth));
          ctx.lineTo(laserOffL.x, laserOffL.y);
          // ctx.fillStyle = "rgba(0,0,255,0.15)";
          var gradient = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, rangeWidth);
          gradient.addColorStop(0, `rgba(0,0,255,${((r + 5) * (r + 5)) / (targetDist * targetDist)})`);
          gradient.addColorStop(1, "transparent");
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      } else {
        this.laserPos = this.position;
      }
    };
  },
  laser(x, y, radius = 30) {
    //only on level 1
    mobs.spawn(x, y, 3, radius, "#f00");
    let me = mob[mob.length - 1];
    me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
    Matter.Body.rotate(me, Math.random() * Math.PI * 2);
    me.accelMag = 0.00007;
    me.onHit = function () {
      //run this function on hitting player
      this.explode();
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      this.attraction();
      this.laser();
    };
  },
  striker(x, y, radius = 15 + Math.ceil(Math.random() * 25)) {
    mobs.spawn(x, y, 5, radius, "rgb(221,102,119)");
    let me = mob[mob.length - 1];
    me.accelMag = 0.0004;
    me.g = 0.0002; //required if using 'gravity'
    me.frictionStatic = 0;
    me.friction = 0;
    me.delay = 60;
    Matter.Body.rotate(me, Math.PI * 0.1);
    me.onDamage = function () {
      this.cd = game.cycle + this.delay;
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerCheck();
      this.attraction();
      this.gravity();
      this.strike();
    };
  },
  sneaker(x, y, radius = 15 + Math.ceil(Math.random() * 25)) {
    let me;
    mobs.spawn(x, y, 5, radius, "transparent");
    me = mob[mob.length - 1];
    me.accelMag = 0.0007;
    me.g = 0.0002; //required if using 'gravity'
    me.stroke = "transparent"; //used for drawSneaker
    me.alpha = 1; //used in drawSneaker
    // me.leaveBody = false;
    me.canTouchPlayer = false; //used in drawSneaker
    me.collisionFilter.mask = 0x000111; //can't touch player
    // me.memory = 420;
    // me.seePlayerFreq = 60 + Math.round(Math.random() * 30);
    me.do = function () {
      this.seePlayerCheck();
      this.attraction();
      this.gravity();
      //draw
      if (this.seePlayer.yes) {
        if (this.alpha < 1) this.alpha += 0.01;
      } else {
        if (this.alpha > 0) this.alpha -= 0.03;
      }
      if (this.alpha > 0) {
        if (this.alpha > 0.95) {
          this.healthBar();
          if (!this.canTouchPlayer) {
            this.canTouchPlayer = true;
            this.collisionFilter.mask = 0x001111; //can   touch player
          }
        }
        //draw body
        ctx.beginPath();
        const vertices = this.vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1, len = vertices.length; j < len; ++j) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
        ctx.fillStyle = `rgba(0,0,0,${this.alpha * this.alpha})`;
        ctx.fill();
      } else if (this.canTouchPlayer) {
        this.canTouchPlayer = false;
        this.collisionFilter.mask = 0x000111; //can't   touch player
      }
    };
  },
  ghoster(x, y, radius = 40 + Math.ceil(Math.random() * 100)) {
    let me;
    mobs.spawn(x, y, 7, radius, "transparent");
    me = mob[mob.length - 1];
    me.seeAtDistance2 = 1000000;
    me.accelMag = 0.00014;
    if (map.length) me.searchTarget = map[Math.floor(Math.random() * (map.length - 1))].position; //required for search
    Matter.Body.setDensity(me, 0.00065); //normal is 0.001 //makes effective life much lower
    me.stroke = "transparent"; //used for drawGhost
    me.alpha = 1; //used in drawGhost
    me.canTouchPlayer = false; //used in drawGhost
    // me.leaveBody = false;
    me.collisionFilter.mask = 0x000100; //move through walls and player
    me.memory = 480;
    me.do = function () {
      //cap max speed
      if (this.speed > 5) {
        Matter.Body.setVelocity(mob[mob.length - 1], {
          x: this.velocity.x * 0.8,
          y: this.velocity.y * 0.8
        });
      }
      this.seePlayerCheckByDistance();
      this.attraction();
      this.search();
      //draw
      if (this.distanceToPlayer2() - this.seeAtDistance2 < 0) {
        if (this.alpha < 1) this.alpha += 0.004;
      } else {
        if (this.alpha > 0) this.alpha -= 0.03;
      }
      if (this.alpha > 0) {
        if (this.alpha > 0.9) {
          this.healthBar();
          if (!this.canTouchPlayer) {
            this.canTouchPlayer = true;
            this.collisionFilter.mask = 0x001110; //can   touch player but not walls
          }
        }
        //draw body
        ctx.beginPath();
        const vertices = this.vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1, len = vertices.length; j < len; ++j) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(0,0,0,${this.alpha * this.alpha})`;
        ctx.stroke();
      } else if (this.canTouchPlayer) {
        this.canTouchPlayer = false;
        this.collisionFilter.mask = 0x000110; //can't   touch player or walls
      }
    };
  },
  blinker(x, y, radius = 45 + Math.ceil(Math.random() * 70)) {
    mobs.spawn(x, y, 6, radius, "transparent");
    let me = mob[mob.length - 1];
    Matter.Body.setDensity(me, 0.0005); //normal is 0.001 //makes effective life much lower
    me.stroke = "rgb(0,200,255)"; //used for drawGhost
    Matter.Body.rotate(me, Math.random() * 2 * Math.PI);
    me.blinkRate = 40 + Math.round(Math.random() * 60); //required for blink
    me.blinkLength = 150 + Math.round(Math.random() * 200); //required for blink
    // me.collisionFilter.mask = 0x001100; //move through walls
    me.isStatic = true;
    // me.leaveBody = false;
    me.memory = 360;
    me.seePlayerFreq = 40 + Math.round(Math.random() * 30);
    me.isBig = false;
    me.scaleMag = Math.max(5 - me.mass, 1.75);
    me.onDeath = function () {
      if (this.isBig) {
        Matter.Body.scale(this, 1 / this.scaleMag, 1 / this.scaleMag);
        this.isBig = false;
      }
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerCheck();
      this.blink();
      //strike by expanding
      if (this.isBig) {
        if (this.cd - this.delay + 15 < game.cycle) {
          Matter.Body.scale(this, 1 / this.scaleMag, 1 / this.scaleMag);
          this.isBig = false;
        }
      } else if (this.seePlayer.yes && this.cd < game.cycle) {
        const dist = Matter.Vector.sub(this.seePlayer.position, this.position);
        const distMag2 = Matter.Vector.magnitudeSquared(dist);
        if (distMag2 < 80000) {
          this.cd = game.cycle + this.delay;
          Matter.Body.scale(this, this.scaleMag, this.scaleMag);
          this.isBig = true;
        }
      }
    };
  },
  // drifter(x, y, radius = 15 + Math.ceil(Math.random() * 40)) {
  //   mobs.spawn(x, y, 4.5, radius, "transparent");
  //   let me = mob[mob.length - 1];
  //   me.stroke = "rgb(0,200,255)"; //used for drawGhost
  //   Matter.Body.rotate(me, Math.random() * 2 * Math.PI);
  //   me.blinkRate = 30 + Math.round(Math.random() * 30); //required for blink/drift
  //   me.blinkLength = 160; //required for blink/drift
  //   //me.collisionFilter.mask = 0x001100; //move through walls
  //   me.isStatic = true;
  //   me.memory = 360;
  //   me.seePlayerFreq = 40 + Math.round(Math.random() * 30);
  //   me.do = function () {
  //     this.healthBar();
  //     this.seePlayerCheck();
  //     this.drift();
  //   };
  // },
  bomber(x, y, radius = 120 + Math.ceil(Math.random() * 70)) {
    //boss that drops bombs from above and holds a set distance from player
    mobs.spawn(x, y, 3, radius, "transparent");
    let me = mob[mob.length - 1];
    Matter.Body.setDensity(me, 0.0015 + 0.0005 * Math.sqrt(game.levelsCleared)); //extra dense //normal is 0.001 //makes effective life much larger

    me.stroke = "rgba(255,0,200)"; //used for drawGhost
    me.seeAtDistance2 = 2000000;
    me.fireFreq = Math.ceil(30 + 2000 / radius);
    me.searchTarget = map[Math.floor(Math.random() * (map.length - 1))].position; //required for search
    me.hoverElevation = 400 + (Math.random() - 0.5) * 200; //squared
    me.hoverXOff = (Math.random() - 0.5) * 100;
    me.accelMag = Math.floor(10 * (Math.random() + 5)) * 0.00001;
    me.g = 0.0002; //required if using 'gravity'   // gravity called in hoverOverPlayer
    me.frictionStatic = 0;
    me.friction = 0;
    me.frictionAir = 0.01;
    // me.memory = 300;
    // Matter.Body.setDensity(me, 0.0015); //extra dense //normal is 0.001
    me.collisionFilter.mask = 0x001100; //move through walls
    spawn.shield(me, x, y);
    me.onDeath = function () {
      if (Math.random() < 0.2 || mech.fieldMode === 0) powerUps.spawn(this.position.x, this.position.y, "field"); //bosss spawn field upgrades
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerCheckByDistance();
      this.hoverOverPlayer();
      this.bomb();
      this.search();
    };
  },
  shooter(x, y, radius = 25 + Math.ceil(Math.random() * 50)) {
    mobs.spawn(x, y, 3, radius, "rgb(255,100,150)");
    let me = mob[mob.length - 1];
    me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
    me.memory = 120;
    me.fireFreq = 0.007 + Math.random() * 0.005;
    me.noseLength = 0;
    me.fireAngle = 0;
    me.accelMag = 0.0005;
    me.frictionAir = 0.05;
    me.lookTorque = 0.0000025 * (Math.random() > 0.5 ? -1 : 1);
    me.fireDir = {
      x: 0,
      y: 0
    };
    if (Math.random() < Math.min(0.15 + (game.levelsCleared - 1) * 0.1, 0.7)) spawn.shield(me, x, y);
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      this.fire();
    };
  },
  shooterBoss(x, y, radius = 85 + Math.ceil(Math.random() * 50)) {
    //boss spawns on skyscraper level
    mobs.spawn(x, y, 3, radius, "rgb(255,70,180)");
    let me = mob[mob.length - 1];
    me.vertices = Matter.Vertices.rotate(me.vertices, Math.PI, me.position); //make the pointy side of triangle the front
    me.memory = 240;
    me.fireFreq = 0.02;
    me.noseLength = 0;
    me.fireAngle = 0;
    me.accelMag = 0.005;
    me.frictionAir = 0.1;
    me.lookTorque = 0.000005 * (Math.random() > 0.5 ? -1 : 1);
    me.fireDir = {
      x: 0,
      y: 0
    };
    Matter.Body.setDensity(me, 0.001 + 0.0005 * Math.sqrt(game.levelsCleared)); //extra dense //normal is 0.001 //makes effective life much larger
    spawn.shield(me, x, y);
    me.onDeath = function () {
      if (Math.random() < 0.2 || mech.fieldMode === 0) powerUps.spawn(this.position.x, this.position.y, "field"); //boss spawns field upgrades
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerByLookingAt();
      this.fire();
    };
  },
  bullet(x, y, radius = 6, sides = 0) {
    //bullets
    mobs.spawn(x, y, sides, radius, "rgb(255,0,0)");
    let me = mob[mob.length - 1];
    me.stroke = "transparent";
    me.onHit = function () {
      this.explode();
    };
    Matter.Body.setDensity(me, 0.002); //normal is 0.001
    me.timeLeft = 240;
    me.g = 0.001; //required if using 'gravity'
    me.frictionAir = 0;
    me.restitution = 0.8;
    me.leaveBody = false;
    me.dropPowerUp = false;
    // me.collisionFilter.mask = 0x001000;
    me.collisionFilter.category = 0x010000;
    me.do = function () {
      this.gravity();
      this.timeLimit();
    };
  },
  spawner(x, y, radius = 55 + Math.ceil(Math.random() * 50)) {
    mobs.spawn(x, y, 4, radius, "rgb(255,150,0)");
    let me = mob[mob.length - 1];
    me.g = 0.0004; //required if using 'gravity'
    me.leaveBody = false;
    // me.dropPowerUp = false;
    me.onDeath = function () {
      //run this function on death
      for (let i = 0; i < Math.ceil(this.mass * 0.2 + Math.random() * 3); ++i) {
        spawn.spawns(this.position.x + (Math.random() - 0.5) * radius * 2, this.position.y + (Math.random() - 0.5) * radius * 2);
        Matter.Body.setVelocity(mob[mob.length - 1], {
          x: (Math.random() - 0.5) * 25,
          y: (Math.random() - 0.5) * 25
        });
      }
    };
    if (Math.random() < Math.min((game.levelsCleared - 1) * 0.1, 0.5)) spawn.shield(me, x, y);
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.seePlayerCheck();
      this.attraction();
    };
  },
  spawns(x, y, radius = 15 + Math.ceil(Math.random() * 5)) {
    mobs.spawn(x, y, 4, radius, "rgb(255,0,0)");
    let me = mob[mob.length - 1];
    me.onHit = function () {
      //run this function on hitting player
      this.explode();
    };
    me.g = 0.0001; //required if using 'gravity'
    me.accelMag = 0.0003;
    me.memory = 30;
    me.leaveBody = false;
    me.seePlayerFreq = 80 + Math.round(Math.random() * 50);
    me.frictionAir = 0.002;
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.seePlayerCheck();
      this.attraction();
    };
  },
  exploder(x, y, radius = 25 + Math.ceil(Math.random() * 50)) {
    mobs.spawn(x, y, 4, radius, "rgb(255,0,0)");
    let me = mob[mob.length - 1];
    me.onHit = function () {
      //run this function on hitting player
      this.explode();
    };
    me.g = 0.0004; //required if using 'gravity'
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.seePlayerCheck();
      this.attraction();
    };
  },
  snaker(x, y, radius = 80) {
    //snake boss with a laser head
    mobs.spawn(x, y, 8, radius, "rgb(255,50,130)");
    let me = mob[mob.length - 1];
    me.accelMag = 0.0012;
    me.memory = 200;
    me.laserRange = 500;
    Matter.Body.setDensity(me, 0.001 + 0.0005 * Math.sqrt(game.levelsCleared)); //extra dense //normal is 0.001 //makes effective life much larger
    spawn.shield(me, x, y);
    if (Math.random() < Math.min((game.levelsCleared - 1) * 0.1, 0.7)) spawn.shield(me, x, y);
    me.onDeath = function () {
      if (Math.random() < 0.2 || mech.fieldMode === 0) powerUps.spawn(this.position.x, this.position.y, "field"); //boss spawns field upgrades
    };
    me.do = function () {
      this.healthBar();
      this.seePlayerCheck();
      this.attraction();
      this.laserBeam();
      // this.curl();
    };

    //snake tail
    const nodes = Math.min(3 + Math.ceil(Math.random() * game.levelsCleared + 2), 8)
    spawn.lineBoss(x + 105, y, "spawns", nodes);
    //constraint boss with first 3 mobs in lineboss
    consBB[consBB.length] = Constraint.create({
      bodyA: mob[mob.length - nodes],
      bodyB: mob[mob.length - 1 - nodes],
      stiffness: 0.05
    });
    consBB[consBB.length] = Constraint.create({
      bodyA: mob[mob.length - nodes + 1],
      bodyB: mob[mob.length - 1 - nodes],
      stiffness: 0.05
    });
    consBB[consBB.length] = Constraint.create({
      bodyA: mob[mob.length - nodes + 2],
      bodyB: mob[mob.length - 1 - nodes],
      stiffness: 0.05
    });

  },
  tether(x, y, radius = 90) {
    // constrained mob boss for the towers level
    // often has a ring of mobs around it
    mobs.spawn(x, y, 8, radius, "rgb(0,60,80)");
    let me = mob[mob.length - 1];
    me.g = 0.0001; //required if using 'gravity'
    me.accelMag = 0.002;
    me.memory = 20;
    Matter.Body.setDensity(me, 0.001 + 0.0005 * Math.sqrt(game.levelsCleared)); //extra dense //normal is 0.001 //makes effective life much larger
    spawn.shield(me, x, y);
    if (Math.random() < Math.min((game.levelsCleared - 1) * 0.1, 0.7)) spawn.shield(me, x, y);

    me.onDeath = function () {
      if (Math.random() < 0.2 || mech.fieldMode === 0) powerUps.spawn(this.position.x, this.position.y, "field"); //boss spawns field upgrades
      this.removeCons(); //remove constraint
    };
    me.do = function () {
      this.healthBar();
      this.gravity();
      this.seePlayerCheck();
      this.attraction();
    };
  },
  shield(target, x, y, stiffness = 0.4) {
    if (this.allowShields) {
      mobs.spawn(x, y, 9, target.radius + 20, "rgba(220,220,255,0.6)");
      let me = mob[mob.length - 1];
      me.stroke = "rgb(220,220,255)";
      Matter.Body.setDensity(me, 0.0001) //very low density to not mess with the original mob's motion
      me.shield = true;
      me.collisionFilter.mask = 0x000100; //don't collide with bodies, map, player, and mobs, only bullets
      consBB[consBB.length] = Constraint.create({
        //attach shield to last spawned mob
        bodyA: me,
        bodyB: target,
        stiffness: stiffness,
        damping: 0.1
      });
      me.onDamage = function () {
        //make sure the mob that owns the shield can tell when damage is done
        this.alertNearByMobs();
      };
      me.leaveBody = false;
      me.dropPowerUp = false;
      //swap order of shield and mob, so that mob is behind shield graphically
      mob[mob.length - 1] = mob[mob.length - 2];
      mob[mob.length - 2] = me;
      me.do = function () {};
    }
  },
  bossShield(nodes, x, y, radius) {
    mobs.spawn(x, y, 9, radius, "rgba(220,220,255,0.65)");
    let me = mob[mob.length - 1];
    me.stroke = "rgb(220,220,255)";
    Matter.Body.setDensity(me, 0.00005) //very low density to not mess with the original mob's motion
    me.frictionAir = 0;
    me.shield = true;
    me.collisionFilter.mask = 0x000100; //don't collide with bodies, map, and mobs, only bullets and player
    //constrain to all mob nodes in boss
    for (let i = 0; i < nodes; ++i) {
      consBB[consBB.length] = Constraint.create({
        bodyA: me,
        bodyB: mob[mob.length - i - 2],
        stiffness: 0.4,
        damping: 0.1
      });
    }
    me.onDamage = function () {
      //make sure the mob that owns the shield can tell when damage is done
      this.alertNearByMobs();
    };
    me.leaveBody = false;
    me.dropPowerUp = false;
    mob[mob.length - 1] = mob[mob.length - 1 - nodes];
    mob[mob.length - 1 - nodes] = me;
    me.do = function () {};
  },
  //complex constrained mob templates**********************************************************************
  //*******************************************************************************************************
  allowShields: true,
  nodeBoss(
    x,
    y,
    spawn = "striker",
    nodes = Math.min(2 + Math.ceil(Math.random() * (game.levelsCleared + 2)), 8),
    //Math.ceil(Math.random() * 3) + Math.min(4,Math.ceil(game.levelsCleared/2)),
    radius = Math.ceil(Math.random() * 10) + 17, // radius of each node mob
    sideLength = Math.ceil(Math.random() * 100) + 70, // distance between each node mob
    stiffness = Math.random() * 0.03 + 0.005
  ) {
    this.allowShields = false; //don't want shields on boss mobs
    const angle = 2 * Math.PI / nodes
    for (let i = 0; i < nodes; ++i) {
      let whoSpawn = spawn;
      if (spawn === "random") {
        whoSpawn = this.fullPickList[Math.floor(Math.random() * this.fullPickList.length)];
      } else if (spawn === "randomList") {
        whoSpawn = this.pickList[Math.floor(Math.random() * this.pickList.length)];
      }
      this[whoSpawn](x + sideLength * Math.sin(i * angle), y + sideLength * Math.cos(i * angle), radius);
    }
    if (Math.random() < 0.3) {
      this.constrain2AdjacentMobs(nodes, stiffness * 2, true);
    } else {
      this.constrainAllMobCombos(nodes, stiffness);
    }
    //spawn shield for entire boss
    if (nodes > 2 && Math.random() < 0.998) {
      this.bossShield(nodes, x, y, sideLength + 2.5 * radius + nodes * 6 - 25);
      // this.bossShield(nodes, x, y, sideLength / (2 * Math.sin(Math.PI / nodes)));
    }
    this.allowShields = true;
  },
  // nodeBoss(
  //   x,
  //   y,
  //   spawn = "striker",
  //   nodes = Math.min(2 + Math.round(Math.random() * game.levelsCleared), 8),
  //   //Math.ceil(Math.random() * 3) + Math.min(4,Math.ceil(game.levelsCleared/2)),
  //   radius = Math.ceil(Math.random() * 10) + 17, // radius of each node mob
  //   l = Math.ceil(Math.random() * 100) + 70, // distance between each node mob
  //   stiffness = Math.random() * 0.03 + 0.005
  // ) {
  //   this.allowShields = false; //dont' want shields on boss mobs
  //   let px = 0;
  //   let py = 0;
  //   let a = (2 * Math.PI) / nodes;
  //   for (let i = 0; i < nodes; ++i) {
  //     px += l * Math.cos(a * i);
  //     py += l * Math.sin(a * i);
  //     let whoSpawn = spawn;
  //     if (spawn === "random") {
  //       whoSpawn = this.fullPickList[Math.floor(Math.random() * this.fullPickList.length)];
  //     } else if (spawn === "randomList") {
  //       whoSpawn = this.pickList[Math.floor(Math.random() * this.pickList.length)];
  //     }
  //     this[whoSpawn](x + px, y + py, radius);
  //   }
  //   if (Math.random() < 0.3) {
  //     this.constrain2AdjacentMobs(nodes, stiffness * 2, true);
  //   } else {
  //     this.constrainAllMobCombos(nodes, stiffness);
  //   }
  //   this.allowShields = true;
  // },
  lineBoss(
    x,
    y,
    spawn = "striker",
    nodes = Math.min(3 + Math.ceil(Math.random() * game.levelsCleared + 2), 8),
    //Math.ceil(Math.random() * 3) + Math.min(4,Math.ceil(game.levelsCleared/2)),
    radius = Math.ceil(Math.random() * 10) + 17,
    l = Math.ceil(Math.random() * 80) + 30,
    stiffness = Math.random() * 0.06 + 0.01
  ) {
    this.allowShields = false; //dont' want shields on boss mobs
    for (let i = 0; i < nodes; ++i) {
      let whoSpawn = spawn;
      if (spawn === "random") {
        whoSpawn = this.fullPickList[Math.floor(Math.random() * this.fullPickList.length)];
      } else if (spawn === "randomList") {
        whoSpawn = this.pickList[Math.floor(Math.random() * this.pickList.length)];
      }
      this[whoSpawn](x + i * radius + i * l, y, radius);
    }
    this.constrain2AdjacentMobs(nodes, stiffness);
    this.allowShields = true;
  },
  //constraints ************************************************************************************************
  //*************************************************************************************************************
  constrainAllMobCombos(nodes, stiffness) {
    //runs through every combination of last 'num' bodies and constrains them
    for (let i = 1; i < nodes + 1; ++i) {
      for (let j = i + 1; j < nodes + 1; ++j) {
        consBB[consBB.length] = Constraint.create({
          bodyA: mob[mob.length - i],
          bodyB: mob[mob.length - j],
          stiffness: stiffness
        });
      }
    }
  },
  constrain2AdjacentMobs(nodes, stiffness, loop = false) {
    //runs through every combination of last 'num' bodies and constrains them
    for (let i = 0; i < nodes - 1; ++i) {
      consBB[consBB.length] = Constraint.create({
        bodyA: mob[mob.length - i - 1],
        bodyB: mob[mob.length - i - 2],
        stiffness: stiffness
      });
    }
    if (nodes > 2) {
      for (let i = 0; i < nodes - 2; ++i) {
        consBB[consBB.length] = Constraint.create({
          bodyA: mob[mob.length - i - 1],
          bodyB: mob[mob.length - i - 3],
          stiffness: stiffness
        });
      }
    }
    //optional connect the tail to head
    if (loop && nodes > 3) {
      consBB[consBB.length] = Constraint.create({
        bodyA: mob[mob.length - 1],
        bodyB: mob[mob.length - nodes],
        stiffness: stiffness
      });
      consBB[consBB.length] = Constraint.create({
        bodyA: mob[mob.length - 2],
        bodyB: mob[mob.length - nodes],
        stiffness: stiffness
      });
      consBB[consBB.length] = Constraint.create({
        bodyA: mob[mob.length - 1],
        bodyB: mob[mob.length - nodes + 1],
        stiffness: stiffness
      });
    }
  },
  constraintPB(x, y, bodyIndex, stiffness) {
    cons[cons.length] = Constraint.create({
      pointA: {
        x: x,
        y: y
      },
      bodyB: body[bodyIndex],
      stiffness: stiffness
    });
  },
  constraintBB(bodyIndexA, bodyIndexB, stiffness) {
    consBB[consBB.length] = Constraint.create({
      bodyA: body[bodyIndexA],
      bodyB: body[bodyIndexB],
      stiffness: stiffness
    });
  },
  // body and map spawns ******************************************************************************
  //**********************************************************************************************
  wireHead() {
    //not a mob, just a graphic for level 1
    const breakingPoint = 1300
    mobs.spawn(breakingPoint, -100, 0, 7.5, "transparent");
    let me = mob[mob.length - 1];
    //touch only walls
    me.collisionFilter.category = 0x100000;
    me.collisionFilter.mask = 0x100001;
    me.inertia = Infinity;
    me.g = 0.0004; //required for gravity
    me.restitution = 0;
    me.stroke = "transparent"
    me.freeOfWires = false;
    me.frictionStatic = 1;
    me.friction = 1;
    me.frictionAir = 0.01;

    me.do = function () {
      let wireX = -50;
      let wireY = -1000;
      if (this.freeOfWires) {
        this.gravity();
      } else {
        if (mech.pos.x > breakingPoint) {
          this.freeOfWires = true;
          this.fill = "#000"
          this.force.x += -0.003;
          player.force.x += 0.06;
          // player.force.y -= 0.15;
        }

        //player is extra heavy from wires
        Matter.Body.setVelocity(player, {
          x: player.velocity.x,
          y: player.velocity.y + 0.3
        })

        //player friction from the wires
        if (mech.pos.x > 700 && player.velocity.x > -2) {
          let wireFriction = 0.75 * Math.min(0.6, Math.max(0, 100 / (breakingPoint - mech.pos.x)));
          if (!mech.onGround) wireFriction *= 3
          Matter.Body.setVelocity(player, {
            x: player.velocity.x - wireFriction,
            y: player.velocity.y
          })
        }
        //move to player
        Matter.Body.setPosition(this, {
          x: mech.pos.x + (42 * Math.cos(mech.angle + Math.PI)),
          y: mech.pos.y + (42 * Math.sin(mech.angle + Math.PI))
        })
      }
      //draw wire
      ctx.beginPath();
      ctx.moveTo(wireX, wireY);
      ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
      if (!this.freeOfWires) ctx.lineTo(mech.pos.x + (30 * Math.cos(mech.angle + Math.PI)), mech.pos.y + (30 * Math.sin(mech.angle + Math.PI)));
      ctx.lineCap = "butt";
      ctx.lineWidth = 15;
      ctx.strokeStyle = "#000";
      ctx.stroke();
      ctx.lineCap = "round";
    };
  },
  wireKnee() {
    //not a mob, just a graphic for level 1
    const breakingPoint = 1425
    mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
    let me = mob[mob.length - 1];
    //touch only walls
    me.collisionFilter.category = 0x100000;
    me.collisionFilter.mask = 0x100001;
    me.g = 0.0003; //required for gravity
    // me.restitution = 0;
    me.stroke = "transparent"
    // me.inertia = Infinity;
    me.restitution = 0;
    me.freeOfWires = false;
    me.frictionStatic = 1;
    me.friction = 1;
    me.frictionAir = 0.01;

    me.do = function () {
      let wireX = -50 - 20;
      let wireY = -1000;

      if (this.freeOfWires) {
        this.gravity();
      } else {
        if (mech.pos.x > breakingPoint) {
          this.freeOfWires = true;
          this.force.x -= 0.0004;
          this.fill = "#222";
        }
        //move mob to player
        mech.calcLeg(0, 0);
        Matter.Body.setPosition(this, {
          x: mech.pos.x + mech.flipLegs * mech.knee.x - 5,
          y: mech.pos.y + mech.knee.y
        })
      }
      //draw wire
      ctx.beginPath();
      ctx.moveTo(wireX, wireY);
      ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#222";
      ctx.lineCap = "butt";
      ctx.stroke();
      ctx.lineCap = "round";
    };
  },
  wireKneeLeft() {
    //not a mob, just a graphic for level 1
    const breakingPoint = 1400
    mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
    let me = mob[mob.length - 1];
    //touch only walls
    me.collisionFilter.category = 0x100000;
    me.collisionFilter.mask = 0x100001;
    me.g = 0.0003; //required for gravity
    // me.restitution = 0;
    me.stroke = "transparent"
    // me.inertia = Infinity;
    me.restitution = 0;
    me.freeOfWires = false;
    me.frictionStatic = 1;
    me.friction = 1;
    me.frictionAir = 0.01;

    me.do = function () {
      let wireX = -50 - 35;
      let wireY = -1000;

      if (this.freeOfWires) {
        this.gravity();
      } else {
        if (mech.pos.x > breakingPoint) {
          this.freeOfWires = true;
          this.force.x += -0.0003;
          this.fill = "#333";
        }
        //move mob to player
        mech.calcLeg(Math.PI, -3);
        Matter.Body.setPosition(this, {
          x: mech.pos.x + mech.flipLegs * mech.knee.x - 5,
          y: mech.pos.y + mech.knee.y
        })
      }
      //draw wire
      ctx.beginPath();
      ctx.moveTo(wireX, wireY);
      ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
      ctx.lineWidth = 5;
      ctx.lineCap = "butt";
      ctx.strokeStyle = "#333";
      ctx.stroke();
      ctx.lineCap = "round";
    };
  },
  wireFoot() {
    //not a mob, just a graphic for level 1
    const breakingPoint = 1350
    mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
    let me = mob[mob.length - 1];
    //touch only walls
    me.collisionFilter.category = 0x100000;
    me.collisionFilter.mask = 0x100001;
    me.g = 0.0003; //required for gravity
    me.restitution = 0;
    me.stroke = "transparent"
    // me.inertia = Infinity;
    me.freeOfWires = false;
    // me.frictionStatic = 1;
    // me.friction = 1;
    me.frictionAir = 0.01;

    me.do = function () {
      let wireX = -50 + 16;
      let wireY = -1000;

      if (this.freeOfWires) {
        this.gravity();
      } else {
        if (mech.pos.x > breakingPoint) {
          this.freeOfWires = true;
          this.force.x += -0.0006;
          this.fill = "#222";
        }
        //move mob to player
        mech.calcLeg(0, 0);
        Matter.Body.setPosition(this, {
          x: mech.pos.x + mech.flipLegs * mech.foot.x - 5,
          y: mech.pos.y + mech.foot.y - 1
        })
      }
      //draw wire
      ctx.beginPath();
      ctx.moveTo(wireX, wireY);
      ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
      ctx.lineWidth = 5;
      ctx.lineCap = "butt";
      ctx.strokeStyle = "#222";
      ctx.stroke();
      ctx.lineCap = "round";
    };
  },
  wireFootLeft() {
    //not a mob, just a graphic for level 1
    const breakingPoint = 1325
    mobs.spawn(breakingPoint, -100, 0, 2, "transparent");
    let me = mob[mob.length - 1];
    //touch only walls
    me.collisionFilter.category = 0x100000;
    me.collisionFilter.mask = 0x100001;
    me.g = 0.0003; //required for gravity
    me.restitution = 0;
    me.stroke = "transparent"
    // me.inertia = Infinity;
    me.freeOfWires = false;
    // me.frictionStatic = 1;
    // me.friction = 1;
    me.frictionAir = 0.01;

    me.do = function () {
      let wireX = -50 + 26;
      let wireY = -1000;

      if (this.freeOfWires) {
        this.gravity();
      } else {
        if (mech.pos.x > breakingPoint) {
          this.freeOfWires = true;
          this.force.x += -0.0005;
          this.fill = "#333";
        }
        //move mob to player
        mech.calcLeg(Math.PI, -3);
        Matter.Body.setPosition(this, {
          x: mech.pos.x + mech.flipLegs * mech.foot.x - 5,
          y: mech.pos.y + mech.foot.y - 1
        })
      }
      //draw wire
      ctx.beginPath();
      ctx.moveTo(wireX, wireY);
      ctx.quadraticCurveTo(wireX, 0, this.position.x, this.position.y);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#333";
      ctx.lineCap = "butt";
      ctx.stroke();
      ctx.lineCap = "round";
    };
  },
  boost(x, y, height = 1000) {
    spawn.mapVertex(x + 50, y + 35, "120 40 -120 40 -50 -40 50 -40");
    // level.addZone(x, y, 100, 30, "fling", {Vx:Vx, Vy: Vy});
    level.addQueryRegion(x, y - 20, 100, 20, "boost", [
      [player], body, mob, powerUp, bullet
    ], -1.1 * Math.sqrt(Math.abs(height)));
    let color = "rgba(200,0,255,";
    level.fillBG.push({
      x: x,
      y: y - 25,
      width: 100,
      height: 25,
      color: color + "0.2)"
    });
    level.fillBG.push({
      x: x,
      y: y - 55,
      width: 100,
      height: 55,
      color: color + "0.1)"
    });
    level.fillBG.push({
      x: x,
      y: y - 120,
      width: 100,
      height: 120,
      color: color + "0.05)"
    });
  },
  laserZone(x, y, width, height, dmg) {
    level.addZone(x, y, width, height, "laser", {
      dmg
    });
    level.fill.push({
      x: x,
      y: y,
      width: width,
      height: height,
      color: "#f00"
    });
  },
  deathQuery(x, y, width, height) {
    level.addQueryRegion(x, y, width, height, "death", [
      [player], mob
    ]);
    level.fill.push({
      x: x,
      y: y,
      width: width,
      height: height,
      color: "#f00"
    });
  },
  platform(x, y, width, height) {
    const size = 20;
    spawn.mapRect(x, y + height, width, 30);
    level.fillBG.push({
      x: x + width / 2 - size / 2,
      y: y,
      width: size,
      height: height,
      color: "#f0f0f3"
    });
  },
  debris(x, y, width, number = Math.floor(3 + Math.random() * 11)) {
    for (let i = 0; i < number; ++i) {
      if (Math.random() < 0.15) {
        powerUps.chooseRandomPowerUp(x + Math.random() * width, y);
      } else {
        const size = 18 + Math.random() * 25;
        spawn.bodyRect(x + Math.random() * width, y, size * (0.6 + Math.random()), size * (0.6 + Math.random()), 1);
        // body[body.length] = Bodies.rectangle(x + Math.random() * width, y, size * (0.6 + Math.random()), size * (0.6 + Math.random()));
      }
    }
  },
  bodyRect(
    x,
    y,
    width,
    height,
    chance = 1,
    properties = {
      friction: 0.05,
      frictionAir: 0.01
    }
  ) {
    if (Math.random() < chance) {
      body[body.length] = Bodies.rectangle(x + width / 2, y + height / 2, width, height, properties);
    }
  },
  bodyVertex(x, y, vector, properties) {
    //addes shape to body array
    body[body.length] = Matter.Bodies.fromVertices(x, y, Vertices.fromPath(vector), properties);
  },
  mapRect(x, y, width, height, properties) {
    //addes reactangles to map array
    var len = map.length;
    map[len] = Bodies.rectangle(x + width / 2, y + height / 2, width, height, properties);
  },
  mapVertex(x, y, vector, properties) {
    //addes shape to map array
    var len = map.length;
    map[len] = Matter.Bodies.fromVertices(x, y, Vertices.fromPath(vector), properties);
  },
  //complex map templates
  spawnBuilding(x, y, w, h, leftDoor, rightDoor, walledSide) {
    this.mapRect(x, y, w, 25); //roof
    this.mapRect(x, y + h, w, 35); //ground
    if (walledSide === "left") {
      this.mapRect(x, y, 25, h); //wall left
    } else {
      this.mapRect(x, y, 25, h - 150); //wall left
      if (leftDoor) {
        this.bodyRect(x + 5, y + h - 150, 15, 150, this.propsFriction); //door left
      }
    }
    if (walledSide === "right") {
      this.mapRect(x - 25 + w, y, 25, h); //wall right
    } else {
      this.mapRect(x - 25 + w, y, 25, h - 150); //wall right
      if (rightDoor) {
        this.bodyRect(x + w - 20, y + h - 150, 15, 150, this.propsFriction); //door right
      }
    }
  },
  spawnStairs(x, y, num, w, h, stepRight) {
    w += 50;
    if (stepRight) {
      for (let i = 0; i < num; i++) {
        this.mapRect(x - (w / num) * (1 + i), y - h + (i * h) / num, w / num + 50, h - (i * h) / num + 50);
      }
    } else {
      for (let i = 0; i < num; i++) {
        this.mapRect(x + (i * w) / num, y - h + (i * h) / num, w / num + 50, h - (i * h) / num + 50);
      }
    }
  },
  //premade property options*************************************************************************************
  //*************************************************************************************************************
  //Object.assign({}, propsHeavy, propsBouncy, propsNoRotation)      //will combine properties into a new object
  propsFriction: {
    friction: 0.5,
    frictionAir: 0.02,
    frictionStatic: 1
  },
  propsFrictionMedium: {
    friction: 0.15,
    frictionStatic: 1
  },
  propsBouncy: {
    friction: 0,
    frictionAir: 0,
    frictionStatic: 0,
    restitution: 1
  },
  propsSlide: {
    friction: 0.003,
    frictionStatic: 0.4,
    restitution: 0,
    density: 0.002
  },
  propsLight: {
    density: 0.001
  },
  propsOverBouncy: {
    friction: 0,
    frictionAir: 0,
    frictionStatic: 0,
    restitution: 1.05
  },
  propsHeavy: {
    density: 0.01 //default density is 0.001
  },
  propsIsNotHoldable: {
    isNotHoldable: true
  },
  propsNoRotation: {
    inertia: Infinity //prevents rotation
  },
  propsHoist: {
    inertia: Infinity, //prevents rotation
    frictionAir: 0.001,
    friction: 0,
    frictionStatic: 0,
    restitution: 0,
    isNotHoldable: true
    // density: 0.0001
  },
  propsDoor: {
    density: 0.001, //default density is 0.001
    friction: 0,
    frictionAir: 0.03,
    frictionStatic: 0,
    restitution: 0
  },
  sandPaper: {
    friction: 1,
    frictionStatic: 1,
    restitution: 0
  }
};