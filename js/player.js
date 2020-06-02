//global player variables for use in matter.js physics
let player, jumpSensor, playerBody, playerHead, headSensor;

// player Object Prototype *********************************************
const mech = {
  spawn() {
    //load player in matter.js physic engine
    // let vector = Vertices.fromPath("0 40  50 40   50 115   0 115   30 130   20 130"); //player as a series of vertices
    let vertices = Vertices.fromPath("0,40, 50,40, 50,115, 30,130, 20,130, 0,115, 0,40"); //player as a series of vertices
    playerBody = Matter.Bodies.fromVertices(0, 0, vertices);
    jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
      //this sensor check if the player is on the ground to enable jumping
      sleepThreshold: 99999999999,
      isSensor: true
    });
    vertices = Vertices.fromPath("16 -82  2 -66  2 -37  43 -37  43 -66  30 -82");
    playerHead = Matter.Bodies.fromVertices(0, -55, vertices); //this part of the player lowers on crouch
    headSensor = Bodies.rectangle(0, -57, 48, 45, {
      //senses if the player's head is empty and can return after crouching
      sleepThreshold: 99999999999,
      isSensor: true
    });
    player = Body.create({
      //combine jumpSensor and playerBody
      parts: [playerBody, playerHead, jumpSensor, headSensor],
      inertia: Infinity, //prevents player rotation
      friction: 0.002,
      frictionAir: 0.001,
      //frictionStatic: 0.5,
      restitution: 0,
      sleepThreshold: Infinity,
      collisionFilter: {
        group: 0,
        category: cat.player,
        mask: cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
      },
      death() {
        mech.death();
      }
    });
    Matter.Body.setMass(player, mech.mass);
    World.add(engine.world, [player]);

    mech.holdConstraint = Constraint.create({
      //holding body constraint
      pointA: {
        x: 0,
        y: 0
      },
      bodyB: jumpSensor, //setting constraint to jump sensor because it has to be on something until the player picks up things
      stiffness: 0.4
    });
    World.add(engine.world, mech.holdConstraint);
  },
  cycle: 0,
  lastKillCycle: 0,
  lastHarmCycle: 0,
  width: 50,
  radius: 30,
  fillColor: "#fff", //changed by mod piezoelectric plating (damage immunity)
  fillColorDark: "#ccc",
  height: 42,
  yOffWhen: {
    crouch: 22,
    stand: 49,
    jump: 70
  },
  defaultMass: 5,
  mass: 5,
  FxNotHolding: 0.015,
  Fx: 0.016, //run Force on ground //
  jumpForce: 0.42,
  setMovement() {
    mech.Fx = 0.016 * mod.squirrelFx * mod.fastTime;
    mech.jumpForce = 0.42 * mod.squirrelJump * mod.fastTimeJump;
  },
  FxAir: 0.016, // 0.4/5/5  run Force in Air
  yOff: 70,
  yOffGoal: 70,
  onGround: false, //checks if on ground or in air
  standingOn: undefined,
  numTouching: 0,
  crouch: false,
  // isHeadClear: true,
  spawnPos: {
    x: 0,
    y: 0
  },
  spawnVel: {
    x: 0,
    y: 0
  },
  pos: {
    x: 0,
    y: 0
  },
  setPosToSpawn(xPos, yPos) {
    this.spawnPos.x = this.pos.x = xPos;
    this.spawnPos.y = this.pos.y = yPos;
    this.transX = this.transSmoothX = canvas.width2 - this.pos.x;
    this.transY = this.transSmoothY = canvas.height2 - this.pos.y;
    this.Vx = this.spawnVel.x;
    this.Vy = this.spawnVel.y;
    player.force.x = 0;
    player.force.y = 0;
    Matter.Body.setPosition(player, this.spawnPos);
    Matter.Body.setVelocity(player, this.spawnVel);
    // mech.transX = -player.position.x
    // mech.transY = player.position.y
  },
  Sy: 0, //adds a smoothing effect to vertical only
  Vx: 0,
  Vy: 0,
  gravity: 0.0024, //0.0019  //game.g is 0.001
  friction: {
    ground: 0.01,
    air: 0.0025
  },
  airSpeedLimit: 125, // 125/mass/mass = 5
  angle: 0,
  walk_cycle: 0,
  stepSize: 0,
  flipLegs: -1,
  hip: {
    x: 12,
    y: 24
  },
  knee: {
    x: 0,
    y: 0,
    x2: 0,
    y2: 0
  },
  foot: {
    x: 0,
    y: 0
  },
  legLength1: 55,
  legLength2: 45,
  transX: 0,
  transY: 0,
  move() {
    mech.pos.x = player.position.x;
    mech.pos.y = playerBody.position.y - mech.yOff;
    mech.Vx = player.velocity.x;
    mech.Vy = player.velocity.y;
  },
  transSmoothX: 0,
  transSmoothY: 0,
  lastGroundedPositionY: 0,
  // mouseZoom: 0,
  look() {
    //always on mouse look
    mech.angle = Math.atan2(
      game.mouseInGame.y - mech.pos.y,
      game.mouseInGame.x - mech.pos.x
    );
    //smoothed mouse look translations
    const scale = 0.8;
    mech.transSmoothX = canvas.width2 - mech.pos.x - (game.mouse.x - canvas.width2) * scale;
    mech.transSmoothY = canvas.height2 - mech.pos.y - (game.mouse.y - canvas.height2) * scale;

    mech.transX += (mech.transSmoothX - mech.transX) * 0.07;
    mech.transY += (mech.transSmoothY - mech.transY) * 0.07;
  },
  doCrouch() {
    if (!mech.crouch) {
      mech.crouch = true;
      mech.yOffGoal = mech.yOffWhen.crouch;
      Matter.Body.translate(playerHead, {
        x: 0,
        y: 40
      });
    }
  },
  undoCrouch() {
    if (mech.crouch) {
      mech.crouch = false;
      mech.yOffGoal = mech.yOffWhen.stand;
      Matter.Body.translate(playerHead, {
        x: 0,
        y: -40
      });
    }
  },
  hardLandCD: 0,
  checkHeadClear() {
    if (Matter.Query.collides(headSensor, map).length > 0) {
      return false
    } else {
      return true
    }
  },
  enterAir() {
    //triggered in engine.js on collision
    mech.onGround = false;
    mech.hardLandCD = 0 // disable hard landing
    if (mech.checkHeadClear()) {
      if (mech.crouch) {
        mech.undoCrouch();
      }
      mech.yOffGoal = mech.yOffWhen.jump;
    }
  },
  //triggered in engine.js on collision
  enterLand() {
    mech.onGround = true;
    if (mech.crouch) {
      if (mech.checkHeadClear()) {
        mech.undoCrouch();
      } else {
        mech.yOffGoal = mech.yOffWhen.crouch;
      }
    } else {
      //sets a hard land where player stays in a crouch for a bit and can't jump
      //crouch is forced in groundControl below
      const momentum = player.velocity.y * player.mass //player mass is 5 so this triggers at 26 down velocity, unless the player is holding something
      if (momentum > 130) {
        mech.doCrouch();
        mech.yOff = mech.yOffWhen.jump;
        mech.hardLandCD = mech.cycle + Math.min(momentum / 6.5 - 6, 40)

        // if (mod.isStomp) {
        //   const len = Math.min(25, (momentum - 120) * 0.1)
        //   for (let i = 0; i < len; i++) {
        //     b.spore(player) //spawn drone
        //   }
        // } else if (player.velocity.y > 27 && momentum > 180 * mod.squirrelFx) { //falling damage
        //   let dmg = Math.sqrt(momentum - 180) * 0.01
        //   dmg = Math.min(Math.max(dmg, 0.02), 0.20);
        //   mech.damage(dmg);
        // }
      } else {
        mech.yOffGoal = mech.yOffWhen.stand;
      }
    }
  },
  buttonCD_jump: 0, //cool down for player buttons
  groundControl() {
    if (mech.crouch) {
      if (!(keys[83] || keys[40]) && mech.checkHeadClear() && mech.hardLandCD < mech.cycle) mech.undoCrouch();
    } else if (keys[83] || keys[40] || mech.hardLandCD > mech.cycle) {
      mech.doCrouch(); //on ground && not crouched and pressing s or down
    } else if ((keys[87] || keys[38]) && mech.buttonCD_jump + 20 < mech.cycle && mech.yOffWhen.stand > 23) {
      mech.buttonCD_jump = mech.cycle; //can't jump again until 20 cycles pass

      //apply a fraction of the jump force to the body the player is jumping off of
      Matter.Body.applyForce(mech.standingOn, mech.pos, {
        x: 0,
        y: mech.jumpForce * 0.12 * Math.min(mech.standingOn.mass, 5)
      });

      player.force.y = -mech.jumpForce; //player jump force
      Matter.Body.setVelocity(player, { //zero player y-velocity for consistent jumps
        x: player.velocity.x,
        y: 0
      });
    }

    if (keys[65] || keys[37]) { //left / a
      // if (game.mouseDownRight && mech.fieldCDcycle < mech.cycle && !mech.crouch) {
      //   blink(-1)
      // } else {
      if (player.velocity.x > -2) {
        player.force.x -= mech.Fx * 1.5
      } else {
        player.force.x -= mech.Fx
      }
      // }
    } else if (keys[68] || keys[39]) { //right / d
      // if (game.mouseDownRight && mech.fieldCDcycle < mech.cycle && !mech.crouch) {
      //   blink(1)
      // } else {
      if (player.velocity.x < 2) {
        player.force.x += mech.Fx * 1.5
      } else {
        player.force.x += mech.Fx
      }
      // }
    } else {
      const stoppingFriction = 0.92;
      Matter.Body.setVelocity(player, {
        x: player.velocity.x * stoppingFriction,
        y: player.velocity.y * stoppingFriction
      });
    }
    //come to a stop if fast or if no move key is pressed
    if (player.speed > 4) {
      const stoppingFriction = (mech.crouch) ? 0.65 : 0.89; // this controls speed when crouched
      Matter.Body.setVelocity(player, {
        x: player.velocity.x * stoppingFriction,
        y: player.velocity.y * stoppingFriction
      });
    }
  },
  airControl() {
    //check for short jumps   //moving up   //recently pressed jump  //but not pressing jump key now
    if (mech.buttonCD_jump + 60 > mech.cycle && !(keys[87] || keys[38]) && mech.Vy < 0) {
      Matter.Body.setVelocity(player, {
        //reduce player y-velocity every cycle
        x: player.velocity.x,
        y: player.velocity.y * 0.94
      });
    }

    if (keys[65] || keys[37]) {
      if (player.velocity.x > -mech.airSpeedLimit / player.mass / player.mass) player.force.x -= mech.FxAir; // move player   left / a
    } else if (keys[68] || keys[39]) {
      if (player.velocity.x < mech.airSpeedLimit / player.mass / player.mass) player.force.x += mech.FxAir; //move player  right / d
    }
  },
  alive: false,
  death() {
    if (mod.isImmortal) { //if player has the immortality buff, spawn on the same level with randomized stats

      //count mods
      let totalMods = 0;
      for (let i = 0; i < mod.mods.length; i++) {
        totalMods += mod.mods[i].count
      }
      const totalGuns = b.inventory.length //count guns

      function randomizeMods() {
        for (let i = 0; i < totalMods; i++) {
          //find what mods I don't have
          let options = [];
          for (let i = 0, len = mod.mods.length; i < len; i++) {
            if (mod.mods[i].count < mod.mods[i].maxCount &&
              !mod.mods[i].isNonRefundable &&
              mod.mods[i].name !== "quantum immortality" &&
              mod.mods[i].name !== "determinism" &&
              mod.mods[i].allowed()
            ) options.push(i);
          }
          //add a new mod
          if (options.length > 0) {
            const choose = Math.floor(Math.random() * options.length)
            let newMod = options[choose]
            mod.giveMod(newMod)
            options.splice(choose, 1);
          }
        }
        game.updateModHUD();
      }

      function randomizeField() {
        mech.setField(Math.ceil(Math.random() * (mech.fieldUpgrades.length - 1)))
      }

      function randomizeHealth() {
        mech.health = 0.7 + Math.random()
        if (mech.health > 1) mech.health = 1;
        mech.displayHealth();
      }

      function randomizeGuns() {
        //removes guns and ammo  
        b.inventory = [];
        b.activeGun = null;
        b.inventoryGun = 0;
        for (let i = 0, len = b.guns.length; i < len; ++i) {
          b.guns[i].have = false;
          if (b.guns[i].ammo !== Infinity) b.guns[i].ammo = 0;
        }
        //give random guns
        for (let i = 0; i < totalGuns; i++) b.giveGuns()
        //randomize ammo
        for (let i = 0, len = b.inventory.length; i < len; i++) {
          if (b.guns[b.inventory[i]].ammo !== Infinity) {
            b.guns[b.inventory[i]].ammo = Math.max(0, Math.floor(6 * b.guns[b.inventory[i]].ammo * Math.sqrt(Math.random())))
          }
        }
        game.makeGunHUD(); //update gun HUD
      }

      game.wipe = function () { //set wipe to have trails
        ctx.fillStyle = "rgba(255,255,255,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      function randomizeEverything() {
        spawn.setSpawnList(); //new mob types
        game.clearNow = true; //triggers a map reset

        mod.setupAllMods(); //remove all mods
        for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
        bullet = []; //remove all bullets
        randomizeHealth()
        randomizeField()
        randomizeGuns()
        randomizeMods()
      }

      randomizeEverything()
      const swapPeriod = 1000
      for (let i = 0, len = 5; i < len; i++) {
        setTimeout(function () {
          randomizeEverything()
          game.replaceTextLog = true;
          game.makeTextLog(`probability amplitude will synchronize in ${len-i-1} seconds`, swapPeriod);
          game.wipe = function () { //set wipe to have trails
            ctx.fillStyle = `rgba(255,255,255,${(i+1)*(i+1)*0.006})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }, (i + 1) * swapPeriod);
      }

      setTimeout(function () {
        game.wipe = function () { //set wipe to normal
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        game.replaceTextLog = true;
        game.makeTextLog("your quantum probability has stabilized", 1000);
      }, 6 * swapPeriod);

    } else if (mech.alive) { //normal death code here
      mech.alive = false;
      game.paused = true;
      mech.health = 0;
      mech.displayHealth();
      document.getElementById("text-log").style.opacity = 0; //fade out any active text logs
      document.getElementById("fade-out").style.opacity = 1; //slowly fades out
      setTimeout(function () {
        game.splashReturn();
      }, 3000);
    }
  },
  health: 0,
  maxHealth: 1, //set in game.reset()
  drawHealth() {
    if (mech.health < 1) {
      ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      ctx.fillRect(mech.pos.x - mech.radius, mech.pos.y - 50, 60, 10);
      ctx.fillStyle = "#f00";
      ctx.fillRect(
        mech.pos.x - mech.radius,
        mech.pos.y - 50,
        60 * mech.health,
        10
      );
    }
  },
  displayHealth() {
    id = document.getElementById("health");
    id.style.width = Math.floor(300 * mech.health) + "px";
    //css animation blink if health is low
    if (mech.health < 0.3) {
      id.classList.add("low-health");
    } else {
      id.classList.remove("low-health");
    }
  },
  addHealth(heal) {
    if (!mod.isEnergyHealth) {
      mech.health += heal * game.healScale;
      if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
      mod.onHealthChange();
      mech.displayHealth();
    }
  },
  defaultFPSCycle: 0, //tracks when to return to normal fps
  immuneCycle: 0, //used in engine
  harmReduction() {
    let dmg = 1
    dmg *= mech.fieldHarmReduction
    dmg *= mod.isSlowFPS ? 0.85 : 1
    if (mod.energyRegen === 0) dmg *= 0.5 //0.22 + 0.78 * mech.energy //77% damage reduction at zero energy
    if (mod.isEntanglement && b.inventory[0] === b.activeGun) {
      for (let i = 0, len = b.inventory.length; i < len; i++) {
        dmg *= 0.84 // 1 - 0.16
      }
    }
    return dmg
  },
  damage(dmg) {
    mech.lastHarmCycle = mech.cycle

    //chance to build a drone on damage  from mod
    if (mod.isDroneOnDamage) {
      const len = (dmg - 0.06 * Math.random()) * 40
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.5) b.drone() //spawn drone
      }
    }
    // if (mod.isMineOnDamage && dmg > 0.004 + 0.05 * Math.random()) {
    //   b.mine({
    //     x: mech.pos.x,
    //     y: mech.pos.y - 80
    //   }, {
    //     x: 0,
    //     y: 0
    //   })
    // }


    if (mod.isEnergyHealth) {
      mech.energy -= dmg;
      if (mech.energy < 0 || isNaN(mech.energy)) {
        if (mod.isDeathAvoid && powerUps.reroll.rerolls) { //&& Math.random() < 0.5
          powerUps.reroll.changeRerolls(-1)

          mech.energy = mech.maxEnergy * 0.5
          // if (mech.energy < 0.05) mech.energy = 0.05
          mech.immuneCycle = mech.cycle + 120 //disable this.immuneCycle bonus seconds
          game.makeTextLog("<span style='font-size:115%;'> <strong>death</strong> avoided<br><strong>1</strong> <strong class='color-r'>reroll</strong> consumed</span>", 420)

          game.wipe = function () { //set wipe to have trails
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          setTimeout(function () {
            game.wipe = function () { //set wipe to normal
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }, 2000);

          return;
        } else {
          mech.health = 0;
          mech.energy = 0;
          mech.death();
          return;
        }
      }
    } else {
      dmg *= mech.harmReduction()
      mech.health -= dmg;
      if (mech.health < 0 || isNaN(mech.health)) {
        if (mod.isDeathAvoid && powerUps.reroll.rerolls > 0) { //&& Math.random() < 0.5
          powerUps.reroll.changeRerolls(-1)
          mech.health = mech.maxHealth * 0.5
          // if (mech.health < 0.05) mech.health = 0.05
          mech.immuneCycle = mech.cycle + 120 //disable this.immuneCycle bonus seconds
          game.makeTextLog("<span style='font-size:115%;'> <strong>death</strong> avoided<br><strong>1</strong> <strong class='color-r'>reroll</strong> consumed</span>", 420)

          game.wipe = function () { //set wipe to have trails
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          setTimeout(function () {
            game.wipe = function () { //set wipe to normal
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }, 2000);
        } else {
          mech.health = 0;
          mech.death();
          return;
        }
      }
      mod.onHealthChange();
      mech.displayHealth();
      document.getElementById("dmg").style.transition = "opacity 0s";
      document.getElementById("dmg").style.opacity = 0.1 + Math.min(0.6, dmg * 4);
    }

    if (dmg > 0.2 * mech.holdingMassScale) mech.drop(); //drop block if holding

    const normalFPS = function () {
      if (mech.defaultFPSCycle < mech.cycle) { //back to default values
        game.fpsCap = game.fpsCapDefault
        game.fpsInterval = 1000 / game.fpsCap;
        document.getElementById("dmg").style.transition = "opacity 1s";
        document.getElementById("dmg").style.opacity = "0";
      } else {
        requestAnimationFrame(normalFPS);
      }
    };

    if (mech.defaultFPSCycle < mech.cycle) requestAnimationFrame(normalFPS);
    if (mod.isSlowFPS) { // slow game 
      game.fpsCap = 30 //new fps
      game.fpsInterval = 1000 / game.fpsCap;
      //how long to wait to return to normal fps
      mech.defaultFPSCycle = mech.cycle + 20 + Math.min(90, Math.floor(200 * dmg))
    } else {
      if (dmg > 0.05) { // freeze game for high damage hits
        game.fpsCap = 4 //40 - Math.min(25, 100 * dmg)
        game.fpsInterval = 1000 / game.fpsCap;
      } else {
        game.fpsCap = game.fpsCapDefault
        game.fpsInterval = 1000 / game.fpsCap;
      }
      mech.defaultFPSCycle = mech.cycle
    }
  },
  hitMob(i, dmg) {
    //prevents damage happening too quick
  },
  buttonCD: 0, //cool down for player buttons
  drawLeg(stroke) {
    // if (game.mouseInGame.x > mech.pos.x) {
    if (mech.angle > -Math.PI / 2 && mech.angle < Math.PI / 2) {
      mech.flipLegs = 1;
    } else {
      mech.flipLegs = -1;
    }
    ctx.save();
    ctx.scale(mech.flipLegs, 1); //leg lines
    ctx.beginPath();
    ctx.moveTo(mech.hip.x, mech.hip.y);
    ctx.lineTo(mech.knee.x, mech.knee.y);
    ctx.lineTo(mech.foot.x, mech.foot.y);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 7;
    ctx.stroke();

    //toe lines
    ctx.beginPath();
    ctx.moveTo(mech.foot.x, mech.foot.y);
    ctx.lineTo(mech.foot.x - 15, mech.foot.y + 5);
    ctx.moveTo(mech.foot.x, mech.foot.y);
    ctx.lineTo(mech.foot.x + 15, mech.foot.y + 5);
    ctx.lineWidth = 4;
    ctx.stroke();

    //hip joint
    ctx.beginPath();
    ctx.arc(mech.hip.x, mech.hip.y, 11, 0, 2 * Math.PI);
    //knee joint
    ctx.moveTo(mech.knee.x + 7, mech.knee.y);
    ctx.arc(mech.knee.x, mech.knee.y, 7, 0, 2 * Math.PI);
    //foot joint
    ctx.moveTo(mech.foot.x + 6, mech.foot.y);
    ctx.arc(mech.foot.x, mech.foot.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = mech.fillColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },
  calcLeg(cycle_offset, offset) {
    mech.hip.x = 12 + offset;
    mech.hip.y = 24 + offset;
    //stepSize goes to zero if Vx is zero or not on ground (make mech transition cleaner)
    mech.stepSize = 0.8 * mech.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(mech.Vx))) * mech.onGround);
    //changes to stepsize are smoothed by adding only a percent of the new value each cycle
    const stepAngle = 0.034 * mech.walk_cycle + cycle_offset;
    mech.foot.x = 2.2 * mech.stepSize * Math.cos(stepAngle) + offset;
    mech.foot.y = offset + 1.2 * mech.stepSize * Math.sin(stepAngle) + mech.yOff + mech.height;
    const Ymax = mech.yOff + mech.height;
    if (mech.foot.y > Ymax) mech.foot.y = Ymax;

    //calculate knee position as intersection of circle from hip and foot
    const d = Math.sqrt((mech.hip.x - mech.foot.x) * (mech.hip.x - mech.foot.x) + (mech.hip.y - mech.foot.y) * (mech.hip.y - mech.foot.y));
    const l = (mech.legLength1 * mech.legLength1 - mech.legLength2 * mech.legLength2 + d * d) / (2 * d);
    const h = Math.sqrt(mech.legLength1 * mech.legLength1 - l * l);
    mech.knee.x = (l / d) * (mech.foot.x - mech.hip.x) - (h / d) * (mech.foot.y - mech.hip.y) + mech.hip.x + offset;
    mech.knee.y = (l / d) * (mech.foot.y - mech.hip.y) + (h / d) * (mech.foot.x - mech.hip.x) + mech.hip.y;
  },
  // collisionImmune: false,
  // beginCollisionImmune() {

  // },
  // endCollisionImmune() {

  // },
  draw() {
    ctx.fillStyle = mech.fillColor;
    mech.walk_cycle += mech.flipLegs * mech.Vx;

    //draw body
    ctx.save();
    ctx.globalAlpha = (mech.immuneCycle < mech.cycle) ? 1 : 0.7
    ctx.translate(mech.pos.x, mech.pos.y);
    mech.calcLeg(Math.PI, -3);
    mech.drawLeg("#4a4a4a");
    mech.calcLeg(0, 0);
    mech.drawLeg("#333");
    ctx.rotate(mech.angle);

    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, mech.fillColorDark);
    grd.addColorStop(1, mech.fillColor);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.arc(15, 0, 4, 0, 2 * Math.PI);
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
    // ctx.beginPath();
    // ctx.arc(15, 0, 3, 0, 2 * Math.PI);
    // ctx.fillStyle = '#9cf' //'#0cf';
    // ctx.fill()
    ctx.restore();
    mech.yOff = mech.yOff * 0.85 + mech.yOffGoal * 0.15; //smoothly move leg height towards height goal
  },
  // *********************************************
  // **************** fields *********************
  // *********************************************
  closest: {
    dist: 1000,
    index: 0
  },
  isHolding: false,
  isStealth: false,
  throwCharge: 0,
  fireCDcycle: 0,
  fieldCDcycle: 0,
  fieldMode: 0, //basic field mode before upgrades
  maxEnergy: 1, //can be increased by a mod
  holdingTarget: null,
  timeSkipLastCycle: 0,
  // these values are set on reset by setHoldDefaults()
  fieldRange: 155,
  fieldShieldingScale: 1,
  energy: 0,
  fieldRegen: 0,
  fieldMode: 0,
  fieldFire: false,
  fieldHarmReduction: 1,
  holdingMassScale: 0,
  fieldArc: 0,
  fieldThreshold: 0,
  calculateFieldThreshold() {
    mech.fieldThreshold = Math.cos(mech.fieldArc * Math.PI)
  },
  setHoldDefaults() {
    if (mech.energy < mech.maxEnergy) mech.energy = mech.maxEnergy;
    mech.fieldRegen = mod.energyRegen; //0.001
    mech.fieldMeterColor = "#0cf"
    mech.fieldShieldingScale = 1;
    mech.fieldBlockCD = 10;
    game.isBodyDamage = true;
    mech.fieldHarmReduction = 1;
    mech.fieldRange = 155;
    mech.fieldFire = false;
    mech.fieldCDcycle = 0;
    mech.isStealth = false;
    player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
    mech.airSpeedLimit = 125
    mech.drop();
    mech.holdingMassScale = 0.5;

    mech.fieldArc = 0.2; //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
    mech.calculateFieldThreshold(); //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
    mech.isBodiesAsleep = true;
    mech.wakeCheck();
  },
  fieldMeterColor: "#0cf",
  drawFieldMeter(bgColor = "rgba(0, 0, 0, 0.4)", range = 60) {
    if (mech.energy < mech.maxEnergy) {
      mech.energy += mech.fieldRegen;
      ctx.fillStyle = bgColor;
      const xOff = mech.pos.x - mech.radius * mech.maxEnergy
      const yOff = mech.pos.y - 50
      ctx.fillRect(xOff, yOff, range * mech.maxEnergy, 10);
      ctx.fillStyle = mech.fieldMeterColor;
      ctx.fillRect(xOff, yOff, range * mech.energy, 10);
    }
    if (mech.energy < 0) mech.energy = 0
    // else {
    //   mech.energy = mech.maxEnergy
    // }
  },
  lookingAt(who) {
    //calculate a vector from body to player and make it length 1
    const diff = Vector.normalise(Vector.sub(who.position, mech.pos));
    //make a vector for the player's direction of length 1
    const dir = {
      x: Math.cos(mech.angle),
      y: Math.sin(mech.angle)
    };
    //the dot product of diff and dir will return how much over lap between the vectors
    // console.log(Vector.dot(dir, diff))
    if (Vector.dot(dir, diff) > mech.fieldThreshold) {
      return true;
    }
    return false;
  },
  drop() {
    if (mech.isHolding) {
      mech.fieldCDcycle = mech.cycle + 15;
      mech.isHolding = false;
      mech.throwCharge = 0;
      mech.definePlayerMass()
      if (mech.holdingTarget) {
        mech.holdingTarget.collisionFilter.category = cat.body;
        mech.holdingTarget.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
        mech.holdingTarget = null;
      }
    }
  },
  definePlayerMass(mass = mech.defaultMass) {
    Matter.Body.setMass(player, mass);
    //reduce air and ground move forces
    mech.Fx = 0.08 / mass * mod.squirrelFx //base player mass is 5
    mech.FxAir = 0.4 / mass / mass //base player mass is 5
    //make player stand a bit lower when holding heavy masses
    mech.yOffWhen.stand = Math.max(mech.yOffWhen.crouch, Math.min(49, 49 - (mass - 5) * 6))
    if (mech.onGround && !mech.crouch) mech.yOffGoal = mech.yOffWhen.stand;
  },
  drawHold(target, stroke = true) {
    if (target) {
      const eye = 15;
      const len = target.vertices.length - 1;
      ctx.fillStyle = "rgba(110,170,200," + (0.2 + 0.4 * Math.random()) + ")";
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(
        mech.pos.x + eye * Math.cos(mech.angle),
        mech.pos.y + eye * Math.sin(mech.angle)
      );
      ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
      ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
      ctx.fill();
      if (stroke) ctx.stroke();
      for (let i = 0; i < len; i++) {
        ctx.beginPath();
        ctx.moveTo(
          mech.pos.x + eye * Math.cos(mech.angle),
          mech.pos.y + eye * Math.sin(mech.angle)
        );
        ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
        ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
        ctx.fill();
        if (stroke) ctx.stroke();
      }
    }
  },
  holding() {
    if (mech.holdingTarget) {
      mech.energy -= mech.fieldRegen;
      if (mech.energy < 0) mech.energy = 0;
      Matter.Body.setPosition(mech.holdingTarget, {
        x: mech.pos.x + 70 * Math.cos(mech.angle),
        y: mech.pos.y + 70 * Math.sin(mech.angle)
      });
      Matter.Body.setVelocity(mech.holdingTarget, player.velocity);
      Matter.Body.rotate(mech.holdingTarget, 0.01 / mech.holdingTarget.mass); //gently spin the block
    } else {
      mech.isHolding = false
    }
  },
  throwBlock() {
    if (mech.holdingTarget) {
      if (keys[32] || game.mouseDownRight) {
        if (mech.energy > 0.001) {
          mech.energy -= 0.001 / mod.throwChargeRate;
          mech.throwCharge += 0.5 * mod.throwChargeRate / mech.holdingTarget.mass
          //draw charge
          const x = mech.pos.x + 15 * Math.cos(mech.angle);
          const y = mech.pos.y + 15 * Math.sin(mech.angle);
          const len = mech.holdingTarget.vertices.length - 1;
          const edge = mech.throwCharge * mech.throwCharge * mech.throwCharge;
          const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
          grd.addColorStop(0, "rgba(255,50,150,0.3)");
          grd.addColorStop(1, "transparent");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(mech.holdingTarget.vertices[len].x, mech.holdingTarget.vertices[len].y);
          ctx.lineTo(mech.holdingTarget.vertices[0].x, mech.holdingTarget.vertices[0].y);
          ctx.fill();
          for (let i = 0; i < len; i++) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(mech.holdingTarget.vertices[i].x, mech.holdingTarget.vertices[i].y);
            ctx.lineTo(mech.holdingTarget.vertices[i + 1].x, mech.holdingTarget.vertices[i + 1].y);
            ctx.fill();
          }
        } else {
          mech.drop()
        }
      } else if (mech.throwCharge > 0) { //Matter.Query.region(mob, player.bounds)
        //throw the body
        mech.fieldCDcycle = mech.cycle + 15;
        mech.isHolding = false;
        //bullet-like collisions
        mech.holdingTarget.collisionFilter.category = cat.body; //cat.bullet;
        mech.holdingTarget.collisionFilter.mask = cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield;
        //check every second to see if player is away from thrown body, and make solid
        const solid = function (that) {
          const dx = that.position.x - player.position.x;
          const dy = that.position.y - player.position.y;
          if (dx * dx + dy * dy > 10000 && that !== mech.holdingTarget) {
            // that.collisionFilter.category = cat.body; //make solid
            that.collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet; //can hit player now
          } else {
            setTimeout(solid, 25, that);
          }
        };
        setTimeout(solid, 150, mech.holdingTarget);

        const charge = Math.min(mech.throwCharge / 5, 1)
        let speed = charge * Math.min(80, 64 / Math.pow(mech.holdingTarget.mass, 0.25));

        if (Matter.Query.collides(mech.holdingTarget, map).length !== 0) {
          speed *= 0.7 //drop speed by 30% if touching map
          if (Matter.Query.ray(map, mech.holdingTarget.position, mech.pos).length !== 0) speed = 0 //drop to zero if the center of the block can't see the center of the player through the map
          //|| Matter.Query.ray(body, mech.holdingTarget.position, mech.pos).length > 1
        }

        mech.throwCharge = 0;
        Matter.Body.setVelocity(mech.holdingTarget, {
          x: player.velocity.x * 0.5 + Math.cos(mech.angle) * speed,
          y: player.velocity.y * 0.5 + Math.sin(mech.angle) * speed
        });
        //player recoil //stronger in x-dir to prevent jump hacking

        Matter.Body.setVelocity(player, {
          x: player.velocity.x - Math.cos(mech.angle) * speed / (mech.crouch ? 30 : 10) * Math.sqrt(mech.holdingTarget.mass),
          y: player.velocity.y - Math.sin(mech.angle) * speed / 30 * Math.sqrt(mech.holdingTarget.mass)
        });
        mech.definePlayerMass() //return to normal player mass
      }
    } else {
      mech.isHolding = false
    }
  },
  drawField() {
    if (mech.holdingTarget) {
      ctx.fillStyle = "rgba(110,170,200," + (mech.energy * (0.05 + 0.05 * Math.random())) + ")";
      ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
    } else {
      ctx.fillStyle = "rgba(110,170,200," + (0.02 + mech.energy * (0.15 + 0.15 * Math.random())) + ")";
      ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
    }
    // const off = 2 * Math.cos(game.cycle * 0.1)
    const range = mech.fieldRange;
    ctx.beginPath();
    ctx.arc(mech.pos.x, mech.pos.y, range, mech.angle - Math.PI * mech.fieldArc, mech.angle + Math.PI * mech.fieldArc, false);
    ctx.lineWidth = 2;
    ctx.lineCap = "butt"
    ctx.stroke();
    let eye = 13;
    let aMag = 0.75 * Math.PI * mech.fieldArc
    let a = mech.angle + aMag
    let cp1x = mech.pos.x + 0.6 * range * Math.cos(a)
    let cp1y = mech.pos.y + 0.6 * range * Math.sin(a)
    ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + eye * Math.cos(mech.angle), mech.pos.y + eye * Math.sin(mech.angle))
    a = mech.angle - aMag
    cp1x = mech.pos.x + 0.6 * range * Math.cos(a)
    cp1y = mech.pos.y + 0.6 * range * Math.sin(a)
    ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + 1 * range * Math.cos(mech.angle - Math.PI * mech.fieldArc), mech.pos.y + 1 * range * Math.sin(mech.angle - Math.PI * mech.fieldArc))
    ctx.fill();
    // ctx.lineTo(mech.pos.x + eye * Math.cos(mech.angle), mech.pos.y + eye * Math.sin(mech.angle));

    //draw random lines in field for cool effect
    let offAngle = mech.angle + 1.7 * Math.PI * mech.fieldArc * (Math.random() - 0.5);
    ctx.beginPath();
    eye = 15;
    ctx.moveTo(mech.pos.x + eye * Math.cos(mech.angle), mech.pos.y + eye * Math.sin(mech.angle));
    ctx.lineTo(mech.pos.x + range * Math.cos(offAngle), mech.pos.y + range * Math.sin(offAngle));
    ctx.strokeStyle = "rgba(120,170,255,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
  },
  grabPowerUp() { //look for power ups to grab with field
    const grabPowerUpRange2 = 156000 //(mech.fieldRange + 220) * (mech.fieldRange + 220)
    for (let i = 0, len = powerUp.length; i < len; ++i) {
      const dxP = mech.pos.x - powerUp[i].position.x;
      const dyP = mech.pos.y - powerUp[i].position.y;
      const dist2 = dxP * dxP + dyP * dyP;
      // float towards player  if looking at and in range  or  if very close to player
      if (dist2 < grabPowerUpRange2 && (mech.lookingAt(powerUp[i]) || dist2 < 16000) && !(mech.health === mech.maxHealth && powerUp[i].name === "heal")) {
        powerUp[i].force.x += 7 * (dxP / dist2) * powerUp[i].mass;
        powerUp[i].force.y += 7 * (dyP / dist2) * powerUp[i].mass - powerUp[i].mass * game.g; //negate gravity
        //extra friction
        Matter.Body.setVelocity(powerUp[i], {
          x: powerUp[i].velocity.x * 0.11,
          y: powerUp[i].velocity.y * 0.11
        });
        if (dist2 < 5000 && !game.isChoosing) { //use power up if it is close enough
          if (mod.isMassEnergy) mech.energy = mech.maxEnergy * 2;
          Matter.Body.setVelocity(player, { //player knock back, after grabbing power up
            x: player.velocity.x + ((powerUp[i].velocity.x * powerUp[i].mass) / player.mass) * 0.3,
            y: player.velocity.y + ((powerUp[i].velocity.y * powerUp[i].mass) / player.mass) * 0.3
          });
          powerUp[i].effect();
          Matter.World.remove(engine.world, powerUp[i]);
          powerUp.splice(i, 1);
          return; //because the array order is messed up after splice
        }
      }
    }
  },
  pushMass(who) {
    const speed = Vector.magnitude(Vector.sub(who.velocity, player.velocity))
    const fieldBlockCost = (0.03 + Math.sqrt(who.mass) * speed * 0.003) * mech.fieldShieldingScale;
    const unit = Vector.normalise(Vector.sub(player.position, who.position))

    if (mech.energy > fieldBlockCost * 0.2) { //shield needs at least some of the cost to block
      mech.energy -= fieldBlockCost
      if (mech.energy < 0) {
        mech.energy = 0;
      }
      if (mech.energy > mech.maxEnergy) mech.energy = mech.maxEnergy;

      if (mod.blockDmg && mech.fieldUpgrades[mech.fieldMode].name === "standing wave harmonics") {
        who.damage(mod.blockDmg)
        //draw electricity
        const step = 40
        ctx.beginPath();
        for (let i = 0, len = 2 * mod.blockDmg; i < len; i++) {
          let x = mech.pos.x - 20 * unit.x;
          let y = mech.pos.y - 20 * unit.y;
          ctx.moveTo(x, y);
          for (let i = 0; i < 8; i++) {
            x += step * (-unit.x + 1.5 * (Math.random() - 0.5))
            y += step * (-unit.y + 1.5 * (Math.random() - 0.5))
            ctx.lineTo(x, y);
          }
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#f0f";
        ctx.stroke();
      } else {
        mech.drawHold(who);
      }
      // mech.holdingTarget = null
      //knock backs
      if (mech.fieldShieldingScale > 0) {
        const massRoot = Math.sqrt(Math.min(12, Math.max(0.15, who.mass))); // masses above 12 can start to overcome the push back
        Matter.Body.setVelocity(who, {
          x: player.velocity.x - (15 * unit.x) / massRoot,
          y: player.velocity.y - (15 * unit.y) / massRoot
        });
        mech.fieldCDcycle = mech.cycle + mech.fieldBlockCD;
        if (mech.crouch) {
          Matter.Body.setVelocity(player, {
            x: player.velocity.x + 0.4 * unit.x * massRoot,
            y: player.velocity.y + 0.4 * unit.y * massRoot
          });
        } else {
          Matter.Body.setVelocity(player, {
            x: player.velocity.x + 5 * unit.x * massRoot,
            y: player.velocity.y + 5 * unit.y * massRoot
          });
        }
      } else {
        if (mod.isStunField && mech.fieldUpgrades[mech.fieldMode].name === "perfect diamagnetism") mobs.statusStun(who, mod.isStunField)
        // mobs.statusSlow(who, mod.isStunField)
        const massRoot = Math.sqrt(Math.max(0.15, who.mass)); // masses above 12 can start to overcome the push back
        Matter.Body.setVelocity(who, {
          x: player.velocity.x - (20 * unit.x) / massRoot,
          y: player.velocity.y - (20 * unit.y) / massRoot
        });
        if (who.dropPowerUp && player.speed < 12) {
          const massRootCap = Math.sqrt(Math.min(10, Math.max(0.4, who.mass))); // masses above 12 can start to overcome the push back
          Matter.Body.setVelocity(player, {
            x: 0.9 * player.velocity.x + 0.6 * unit.x * massRootCap,
            y: 0.9 * player.velocity.y + 0.6 * unit.y * massRootCap
          });
        }
      }
    }
  },
  pushMobsFacing() { // find mobs in range and in direction looking
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (
        Vector.magnitude(Vector.sub(mob[i].position, player.position)) - mob[i].radius < mech.fieldRange &&
        mech.lookingAt(mob[i]) &&
        Matter.Query.ray(map, mob[i].position, mech.pos).length === 0
      ) {
        mob[i].locatePlayer();
        mech.pushMass(mob[i]);
      }
    }
  },
  pushMobs360(range = mech.fieldRange * 0.75) { // find mobs in range in any direction
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (
        Vector.magnitude(Vector.sub(mob[i].position, mech.pos)) < range &&
        Matter.Query.ray(map, mob[i].position, mech.pos).length === 0
      ) {
        mob[i].locatePlayer();
        mech.pushMass(mob[i]);
      }
    }
  },
  // pushBodyFacing() { // push all body in range and in direction looking
  //   for (let i = 0, len = body.length; i < len; ++i) {
  //     if (
  //       body[i].speed > 12 && body[i].mass > 2 &&
  //       Vector.magnitude(Vector.sub(body[i].position, mech.pos)) < mech.fieldRange &&
  //       mech.lookingAt(body[i]) &&
  //       Matter.Query.ray(map, body[i].position, mech.pos).length === 0
  //     ) {
  //       mech.pushMass(body[i]);
  //     }
  //   }
  // },
  // pushBody360(range = mech.fieldRange * 0.75) { // push all body in range and in direction looking
  //   for (let i = 0, len = body.length; i < len; ++i) {
  //     if (
  //       body[i].speed > 12 && body[i].mass > 2 &&
  //       Vector.magnitude(Vector.sub(body[i].position, mech.pos)) < range &&
  //       mech.lookingAt(body[i]) &&
  //       Matter.Query.ray(map, body[i].position, mech.pos).length === 0 &&
  //       body[i].collisionFilter.category === cat.body
  //     ) {
  //       mech.pushMass(body[i]);
  //     }
  //   }
  // },
  lookForPickUp() { //find body to pickup
    if (mech.energy > mech.fieldRegen) mech.energy -= mech.fieldRegen;
    const grabbing = {
      targetIndex: null,
      targetRange: 150,
      // lookingAt: false //false to pick up object in range, but not looking at
    };
    for (let i = 0, len = body.length; i < len; ++i) {
      if (Matter.Query.ray(map, body[i].position, mech.pos).length === 0) {
        //is mech next body a better target then my current best
        const dist = Vector.magnitude(Vector.sub(body[i].position, mech.pos));
        const looking = mech.lookingAt(body[i]);
        // if (dist < grabbing.targetRange && (looking || !grabbing.lookingAt) && !body[i].isNotHoldable) {
        if (dist < grabbing.targetRange && looking && !body[i].isNotHoldable) {
          grabbing.targetRange = dist;
          grabbing.targetIndex = i;
          // grabbing.lookingAt = looking;
        }
      }
    }
    // set pick up target for when mouse is released
    if (body[grabbing.targetIndex]) {
      mech.holdingTarget = body[grabbing.targetIndex];
      //
      ctx.beginPath(); //draw on each valid body
      let vertices = mech.holdingTarget.vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
      ctx.fill();

      ctx.globalAlpha = 0.2;
      mech.drawHold(mech.holdingTarget);
      ctx.globalAlpha = 1;
    } else {
      mech.holdingTarget = null;
    }
  },
  pickUp() {
    //triggers when a hold target exits and field button is released
    mech.isHolding = true;
    //conserve momentum when player mass changes
    totalMomentum = Vector.add(Vector.mult(player.velocity, player.mass), Vector.mult(mech.holdingTarget.velocity, mech.holdingTarget.mass))
    Matter.Body.setVelocity(player, Vector.mult(totalMomentum, 1 / (mech.defaultMass + mech.holdingTarget.mass)));

    mech.definePlayerMass(mech.defaultMass + mech.holdingTarget.mass * mech.holdingMassScale)
    //make block collide with nothing
    mech.holdingTarget.collisionFilter.category = 0;
    mech.holdingTarget.collisionFilter.mask = 0;
  },
  wakeCheck() {
    if (mech.isBodiesAsleep) {
      mech.isBodiesAsleep = false;

      function wake(who) {
        for (let i = 0, len = who.length; i < len; ++i) {
          Matter.Sleeping.set(who[i], false)
          if (who[i].storeVelocity) {
            Matter.Body.setVelocity(who[i], {
              x: who[i].storeVelocity.x,
              y: who[i].storeVelocity.y
            })
            Matter.Body.setAngularVelocity(who[i], who[i].storeAngularVelocity)
          }
        }
      }
      wake(mob);
      wake(body);
      wake(bullet);
      for (let i = 0, len = cons.length; i < len; i++) {
        if (cons[i].stiffness === 0) {
          cons[i].stiffness = cons[i].storeStiffness
        }
      }
      // wake(powerUp);
    }
  },
  hold() {},
  setField(index) {
    if (isNaN(index)) { //find index by name
      let found = false
      for (let i = 0; i < mech.fieldUpgrades.length; i++) {
        if (index === mech.fieldUpgrades[i].name) {
          index = i;
          found = true;
          break;
        }
      }
      if (!found) return //if you can't find the field don't give a field to avoid game crash
    }
    mech.fieldMode = index;
    document.getElementById("field").innerHTML = mech.fieldUpgrades[index].name
    mech.setHoldDefaults();
    mech.fieldUpgrades[index].effect();
  },
  fieldUpgrades: [{
      name: "field emitter",
      description: "use <strong class='color-f'>energy</strong> to <strong>shield</strong> yourself from <strong>harm</strong><br><strong>pick up</strong> and <strong>throw</strong> objects",
      isEasyToAim: false,
      effect: () => {
        game.replaceTextLog = true; //allow text over write
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp();
            if (mech.energy > 0.05) {
              mech.drawField();
              mech.pushMobsFacing();
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "standing wave harmonics",
      description: "three oscillating <strong>shields</strong> are permanently active<br>reduce <strong>harm</strong> by <strong>33%</strong>",
      isEasyToAim: true,
      effect: () => {
        mech.fieldHarmReduction = 0.67;
        mech.fieldBlockCD = 0;
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp();
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          if (mech.energy > 0.1 && mech.fieldCDcycle < mech.cycle) {
            const fieldRange1 = (0.7 + 0.3 * Math.sin(mech.cycle / 23)) * mech.fieldRange
            const fieldRange2 = (0.6 + 0.4 * Math.sin(mech.cycle / 37)) * mech.fieldRange
            const fieldRange3 = (0.55 + 0.45 * Math.sin(mech.cycle / 47)) * mech.fieldRange
            const netfieldRange = Math.max(fieldRange1, fieldRange2, fieldRange3)
            ctx.fillStyle = "rgba(110,170,200," + (0.04 + mech.energy * (0.12 + 0.13 * Math.random())) + ")";
            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, fieldRange1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, fieldRange2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, fieldRange3, 0, 2 * Math.PI);
            ctx.fill();
            mech.pushMobs360(netfieldRange);
            // mech.pushBody360(netfieldRange);  //can't throw block when pushhing blocks away
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "perfect diamagnetism",
      // description: "gain <strong class='color-f'>energy</strong> when <strong>blocking</strong><br>no <strong>recoil</strong> when <strong>blocking</strong>",
      description: "<strong>blocking</strong> does not drain <strong class='color-f'>energy</strong><br><strong>blocking</strong> has no <strong>cool down</strong> and less <strong>recoil</strong>",
      isEasyToAim: false,
      effect: () => {
        mech.fieldShieldingScale = 0;
        // mech.fieldMeterColor = "#0af"
        // mech.fieldArc = 0.3; //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        // mech.calculateFieldThreshold();
        mech.hold = function () {
          const wave = Math.sin(mech.cycle * 0.022);
          mech.fieldRange = 165 + 12 * wave
          mech.fieldArc = 0.3 + 0.035 * wave //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
          mech.calculateFieldThreshold();
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp();
            if (mech.energy > 0.05) {
              //draw field
              if (mech.holdingTarget) {
                ctx.fillStyle = "rgba(110,170,200," + (0.06 + 0.03 * Math.random()) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.35 + 0.05 * Math.random()) + ")"
              } else {
                ctx.fillStyle = "rgba(110,170,200," + (0.27 + 0.2 * Math.random() - 0.1 * wave) + ")";
                ctx.strokeStyle = "rgba(110, 200, 235, " + (0.4 + 0.5 * Math.random()) + ")"
              }
              ctx.beginPath();
              ctx.arc(mech.pos.x, mech.pos.y, mech.fieldRange, mech.angle - Math.PI * mech.fieldArc, mech.angle + Math.PI * mech.fieldArc, false);
              ctx.lineWidth = 2.5 - 1.5 * wave;
              ctx.lineCap = "butt"
              ctx.stroke();
              const curve = 0.57 + 0.04 * wave
              const aMag = (1 - curve * 1.2) * Math.PI * mech.fieldArc
              let a = mech.angle + aMag
              let cp1x = mech.pos.x + curve * mech.fieldRange * Math.cos(a)
              let cp1y = mech.pos.y + curve * mech.fieldRange * Math.sin(a)
              ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle))
              a = mech.angle - aMag
              cp1x = mech.pos.x + curve * mech.fieldRange * Math.cos(a)
              cp1y = mech.pos.y + curve * mech.fieldRange * Math.sin(a)
              ctx.quadraticCurveTo(cp1x, cp1y, mech.pos.x + 1 * mech.fieldRange * Math.cos(mech.angle - Math.PI * mech.fieldArc), mech.pos.y + 1 * mech.fieldRange * Math.sin(mech.angle - Math.PI * mech.fieldArc))
              ctx.fill();
              mech.pushMobsFacing();
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "nano-scale manufacturing",
      description: "excess <strong class='color-f'>energy</strong> used to build <strong>drones</strong><br><strong>2x</strong> <strong class='color-f'>energy</strong> regeneration",
      isEasyToAim: true,
      effect: () => {
        // mech.fieldRegen *= 2;
        mech.hold = function () {
          if (mech.energy > mech.maxEnergy - 0.02 && mech.fieldCDcycle < mech.cycle) {
            if (mod.isSporeField) {
              // mech.fieldCDcycle = mech.cycle + 10; // set cool down to prevent +energy from making huge numbers of drones
              const len = Math.floor(6 + 4 * Math.random())
              mech.energy -= len * 0.074;
              for (let i = 0; i < len; i++) {
                b.spore(player)
              }
            } else if (mod.isMissileField) {
              // mech.fieldCDcycle = mech.cycle + 10; // set cool down to prevent +energy from making huge numbers of drones
              mech.energy -= 0.6;
              b.missile({
                  x: mech.pos.x + 40 * Math.cos(mech.angle),
                  y: mech.pos.y + 40 * Math.sin(mech.angle) - 3
                },
                mech.angle + (0.5 - Math.random()) * (mech.crouch ? 0 : 0.2),
                -3 * (0.5 - Math.random()) + (mech.crouch ? 25 : -8) * b.fireCD,
                1, mod.babyMissiles)
            } else if (mod.isIceField) {
              // mech.fieldCDcycle = mech.cycle + 17; // set cool down to prevent +energy from making huge numbers of drones
              mech.energy -= 0.061;
              b.iceIX(1)
            } else {
              // mech.fieldCDcycle = mech.cycle + 10; // set cool down to prevent +energy from making huge numbers of drones
              mech.energy -= 0.33;
              b.drone(1)
            }

          }
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp();
            if (mech.energy > 0.05) {
              mech.drawField();
              mech.pushMobsFacing();
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.energy += mech.fieldRegen;
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "negative mass field",
      description: "use <strong class='color-f'>energy</strong> to nullify  &nbsp; <strong style='letter-spacing: 12px;'>gravity</strong><br>reduce <strong>harm</strong> by <strong>60%</strong>",
      fieldDrawRadius: 0,
      isEasyToAim: true,
      effect: () => {
        mech.fieldFire = true;
        mech.holdingMassScale = 0.03; //can hold heavier blocks with lower cost to jumping
        mech.fieldMeterColor = "#000"
        if (mod.isHarmReduce) {
          mech.fieldHarmReduction = 0.2;
        } else {
          mech.fieldHarmReduction = 0.4;
        }
        mech.hold = function () {
          mech.airSpeedLimit = 125 //5 * player.mass * player.mass
          mech.FxAir = 0.016
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //push away
            mech.grabPowerUp();
            mech.lookForPickUp();
            const DRAIN = 0.00035
            if (mech.energy > DRAIN) {
              mech.airSpeedLimit = 400 // 7* player.mass * player.mass
              mech.FxAir = 0.005
              // mech.pushMobs360();

              //repulse mobs
              // for (let i = 0, len = mob.length; i < len; ++i) {
              //   sub = Vector.sub(mob[i].position, mech.pos);
              //   dist2 = Vector.magnitudeSquared(sub);
              //   if (dist2 < this.fieldDrawRadius * this.fieldDrawRadius && mob[i].speed > 6) {
              //     const force = Vector.mult(Vector.perp(Vector.normalise(sub)), 0.00004 * mob[i].speed * mob[i].mass)
              //     mob[i].force.x = force.x
              //     mob[i].force.y = force.y
              //   }
              // }


              //look for nearby objects to make zero-g
              function zeroG(who, range, mag = 1.06) {
                for (let i = 0, len = who.length; i < len; ++i) {
                  sub = Vector.sub(who[i].position, mech.pos);
                  dist = Vector.magnitude(sub);
                  if (dist < range) {
                    who[i].force.y -= who[i].mass * (game.g * mag); //add a bit more then standard gravity
                  }
                }
              }
              // zeroG(bullet);  //works fine, but not that noticeable and maybe not worth the possible performance hit
              // zeroG(mob);  //mobs are too irregular to make this work?

              if (keys[83] || keys[40]) { //down
                player.force.y -= 0.5 * player.mass * mech.gravity;
                this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 400 * 0.03;
                zeroG(powerUp, this.fieldDrawRadius, 0.7);
                zeroG(body, this.fieldDrawRadius, 0.7);
              } else if (keys[87] || keys[38]) { //up
                mech.energy -= 5 * DRAIN;
                this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 850 * 0.03;
                player.force.y -= 1.45 * player.mass * mech.gravity;
                zeroG(powerUp, this.fieldDrawRadius, 1.38);
                zeroG(body, this.fieldDrawRadius, 1.38);
              } else {
                mech.energy -= DRAIN;
                this.fieldDrawRadius = this.fieldDrawRadius * 0.97 + 650 * 0.03;
                player.force.y -= 1.07 * player.mass * mech.gravity; // slow upward drift
                zeroG(powerUp, this.fieldDrawRadius);
                zeroG(body, this.fieldDrawRadius);
              }
              if (mech.energy < 0.001) {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.energy = 0;
              }
              //add extra friction for horizontal motion
              if (keys[65] || keys[68] || keys[37] || keys[39]) {
                Matter.Body.setVelocity(player, {
                  x: player.velocity.x * 0.99,
                  y: player.velocity.y * 0.98
                });
              } else { //slow rise and fall
                Matter.Body.setVelocity(player, {
                  x: player.velocity.x * 0.99,
                  y: player.velocity.y * 0.98
                });
              }

              //draw zero-G range
              ctx.beginPath();
              ctx.arc(mech.pos.x, mech.pos.y, this.fieldDrawRadius, 0, 2 * Math.PI);
              ctx.fillStyle = "#f5f5ff";
              ctx.globalCompositeOperation = "difference";
              ctx.fill();
              if (mod.isHawking) {
                for (let i = 0, len = mob.length; i < len; i++) {
                  if (mob[i].distanceToPlayer2() < this.fieldDrawRadius * this.fieldDrawRadius && Matter.Query.ray(map, mech.pos, mob[i].position).length === 0 && Matter.Query.ray(body, mech.pos, mob[i].position).length === 0) {
                    mob[i].damage(b.dmgScale * 0.085);
                    mob[i].locatePlayer();
                    //draw electricity
                    const sub = Vector.sub(mob[i].position, mech.pos)
                    const unit = Vector.normalise(sub);
                    const steps = 6
                    const step = Vector.magnitude(sub) / steps;
                    ctx.beginPath();
                    let x = mech.pos.x + 30 * unit.x;
                    let y = mech.pos.y + 30 * unit.y;
                    ctx.moveTo(x, y);
                    for (let i = 0; i < steps; i++) {
                      x += step * (unit.x + 0.7 * (Math.random() - 0.5))
                      y += step * (unit.y + 0.7 * (Math.random() - 0.5))
                      ctx.lineTo(x, y);
                    }
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "rgba(0,255,0,0.5)" //"#fff";
                    ctx.stroke();
                  }
                }
              }
              ctx.globalCompositeOperation = "source-over";
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
            this.fieldDrawRadius = 0
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
            this.fieldDrawRadius = 0
          }
          mech.drawFieldMeter("rgba(0,0,0,0.2)")
        }
      }
    },
    {
      name: "plasma torch",
      description: "use <strong class='color-f'>energy</strong> to emit short range plasma<br>plasma <strong class='color-d'>damages</strong> and <strong>pushes</strong> mobs",
      isEasyToAim: false,
      effect: () => {
        mech.fieldMeterColor = "#f0f"

        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp();
            const DRAIN = 0.0013
            if (mech.energy > DRAIN) {
              mech.energy -= DRAIN;
              if (mech.energy < 0) {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.energy = 0;
              }
              //calculate laser collision
              let best;
              let range = mod.isPlasmaRange * (140 + (mech.crouch ? 400 : 300) * Math.sqrt(Math.random())) //+ 100 * Math.sin(mech.cycle * 0.3);
              // const dir = mech.angle // + 0.04 * (Math.random() - 0.5)
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
                  // const angle = Math.atan2(player.position.y - best.who.position.y, player.position.x - best.who.position.x);
                  // const mass = Math.min(Math.sqrt(best.who.mass), 6);
                  // Matter.Body.setVelocity(best.who, {
                  //   x: best.who.velocity.x * 0.85 - 3 * Math.cos(angle) / mass,
                  //   y: best.who.velocity.y * 0.85 - 3 * Math.sin(angle) / mass
                  // });

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
              const Dx = Math.cos(mech.angle);
              const Dy = Math.sin(mech.angle);
              let x = mech.pos.x + 20 * Dx;
              let y = mech.pos.y + 20 * Dy;
              ctx.beginPath();
              ctx.moveTo(x, y);
              const step = Vector.magnitude(Vector.sub(path[0], path[1])) / 10

              for (let i = 0; i < 8; i++) {
                x += step * (Dx + 1.5 * (Math.random() - 0.5))
                y += step * (Dy + 1.5 * (Math.random() - 0.5))
                ctx.lineTo(x, y);
              }
              ctx.lineWidth = 2 * Math.random();
              ctx.stroke();
              //draw shield around player
              // ctx.beginPath();
              // ctx.arc(mech.pos.x, mech.pos.y, mech.fieldRange * 0.75, 0, 2 * Math.PI);
              // ctx.fillStyle = "rgba(255,0,255,0.05)"
              // ctx.fill();
              // mech.pushBody360(100); //disabled because doesn't work at short range
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter("rgba(0, 0, 0, 0.2)")
        }
      }
    },
    {
      name: "time dilation field",
      description: "use <strong class='color-f'>energy</strong> to <strong style='letter-spacing: 1px;'>stop time</strong><br><em>you can move and fire while time is stopped</em>",
      isEasyToAim: true,
      effect: () => {
        // mech.fieldMeterColor = "#000"
        mech.fieldFire = true;
        mech.isBodiesAsleep = false;
        mech.hold = function () {
          if (mech.isHolding) {
            mech.wakeCheck();
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
            mech.grabPowerUp();
            mech.lookForPickUp(180);

            const DRAIN = 0.0017
            if (mech.energy > DRAIN) {
              mech.energy -= DRAIN;
              if (mech.energy < DRAIN) {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.energy = 0;
                mech.wakeCheck();
              }
              //draw field everywhere
              ctx.globalCompositeOperation = "saturation"
              // ctx.fillStyle = "rgba(100,200,230," + (0.25 + 0.06 * Math.random()) + ")";
              ctx.fillStyle = "#ccc";
              ctx.fillRect(-100000, -100000, 200000, 200000)
              ctx.globalCompositeOperation = "source-over"
              //stop time
              mech.isBodiesAsleep = true;

              function sleep(who) {
                for (let i = 0, len = who.length; i < len; ++i) {
                  if (!who[i].isSleeping) {
                    who[i].storeVelocity = who[i].velocity
                    who[i].storeAngularVelocity = who[i].angularVelocity
                  }
                  Matter.Sleeping.set(who[i], true)
                }
              }
              sleep(mob);
              sleep(body);
              sleep(bullet);
              //doesn't really work, just slows down constraints
              for (let i = 0, len = cons.length; i < len; i++) {
                if (cons[i].stiffness !== 0) {
                  cons[i].storeStiffness = cons[i].stiffness;
                  cons[i].stiffness = 0;
                }
              }

              game.cycle--; //pause all functions that depend on game cycle increasing
              if (mod.isTimeSkip) {
                mech.immuneCycle = mech.cycle + 10;
                game.isTimeSkipping = true;
                mech.cycle++;
                game.gravity();
                Engine.update(engine, game.delta);
                // level.checkZones();
                // level.checkQuery();
                mech.move();
                game.checks();
                // mobs.loop();
                // mech.draw();
                mech.walk_cycle += mech.flipLegs * mech.Vx;
                // mech.hold();
                // mech.energy += DRAIN; // 1 to undo the energy drain from time speed up, 0.5 to cut energy drain in half
                b.fire();
                // b.bulletRemove();
                b.bulletDo();
                game.isTimeSkipping = false;
              }
              // game.cycle--; //pause all functions that depend on game cycle increasing
              // if (mod.isTimeSkip && !game.isTimeSkipping) { //speed up the rate of time
              //   game.timeSkip(1)
              //   mech.energy += 1.5 * DRAIN; //x1 to undo the energy drain from time speed up, x1.5 to cut energy drain in half
              // }
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.wakeCheck();
            mech.pickUp();
          } else {
            mech.wakeCheck();
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "phase decoherence field",
      description: "use <strong class='color-f'>energy</strong> to become <strong>intangible</strong><br><strong>firing</strong> and touching <strong>shields</strong> increases <strong>drain</strong>",
      isEasyToAim: true,
      effect: () => {
        mech.fieldFire = true;
        mech.fieldMeterColor = "#fff";
        mech.fieldPhase = 0;

        mech.hold = function () {
          // function expandField() {
          //   if (this.fieldRange < 2000) {
          //     this.fieldRange += 100
          //     drawField(this.fieldRange)
          //   }
          // }

          function drawField(radius) {
            radius *= 0.9 + 1 * mech.energy;
            const rotate = mech.cycle * 0.005;
            mech.fieldPhase += 0.5 - 0.5 * Math.sqrt(Math.max(0.01, Math.min(mech.energy, 1)));
            const off1 = 1 + 0.06 * Math.sin(mech.fieldPhase);
            const off2 = 1 - 0.06 * Math.sin(mech.fieldPhase);
            ctx.beginPath();
            ctx.ellipse(mech.pos.x, mech.pos.y, radius * off1, radius * off2, rotate, 0, 2 * Math.PI);
            if (mod.renormalization) {
              for (let i = 0; i < bullet.length; i++) {
                ctx.moveTo(bullet[i].position.x, bullet[i].position.y)
                ctx.arc(bullet[i].position.x, bullet[i].position.y, radius, 0, 2 * Math.PI);
              }
            } else {
              if (mech.fireCDcycle > mech.cycle && (keys[32] || game.mouseDownRight)) {
                ctx.lineWidth = 5;
                ctx.strokeStyle = `rgba(0, 204, 255,1)`
                ctx.stroke()
              }
            }
            ctx.fillStyle = "#fff" //`rgba(0,0,0,${0.5+0.5*mech.energy})`;
            ctx.globalCompositeOperation = "destination-in"; //in or atop
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            ctx.clip();
          }

          mech.isStealth = false //isStealth disables most uses of foundPlayer() 
          player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
          if (mech.isHolding) {
            if (this.fieldRange < 2000) {
              this.fieldRange += 100
              drawField(this.fieldRange)
            }
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if (keys[32] || game.mouseDownRight) {
            mech.grabPowerUp();
            mech.lookForPickUp();

            if (mech.fieldCDcycle < mech.cycle) {


              const DRAIN = 0.0003 + 0.00015 * player.speed + ((!mod.renormalization && mech.fireCDcycle > mech.cycle) ? 0.005 : 0.001)
              if (mech.energy > DRAIN) {
                mech.energy -= DRAIN;
                // if (mech.energy < 0.001) {
                //   mech.fieldCDcycle = mech.cycle + 120;
                //   mech.energy = 0;
                //   mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                // }
                this.fieldRange = this.fieldRange * 0.8 + 0.2 * 160
                drawField(this.fieldRange)

                mech.isStealth = true //isStealth disables most uses of foundPlayer() 
                player.collisionFilter.mask = cat.map


                let inPlayer = Matter.Query.region(mob, player.bounds)
                if (inPlayer.length > 0) {
                  for (let i = 0; i < inPlayer.length; i++) {
                    if (inPlayer[i].shield) {
                      mech.energy -= 0.005; //shields drain player energy
                      //draw outline of shield
                      ctx.fillStyle = `rgba(140,217,255,0.5)`
                      ctx.fill()
                    } else if (mod.superposition && inPlayer[i].dropPowerUp) {
                      // inPlayer[i].damage(0.4 * b.dmgScale); //damage mobs inside the player
                      // mech.energy += 0.005;

                      mobs.statusStun(inPlayer[i], 240)
                      //draw outline of mob in a few random locations to show blurriness
                      const vertices = inPlayer[i].vertices;
                      const off = 30
                      for (let k = 0; k < 3; k++) {
                        const xOff = off * (Math.random() - 0.5)
                        const yOff = off * (Math.random() - 0.5)
                        ctx.beginPath();
                        ctx.moveTo(xOff + vertices[0].x, yOff + vertices[0].y);
                        for (let j = 1, len = vertices.length; j < len; ++j) {
                          ctx.lineTo(xOff + vertices[j].x, yOff + vertices[j].y);
                        }
                        ctx.lineTo(xOff + vertices[0].x, yOff + vertices[0].y);
                        ctx.fillStyle = "rgba(0,0,0,0.1)"
                        ctx.fill()
                      }
                      break;
                    }
                  }
                }
              } else {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.energy = 0;
                mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
                drawField(this.fieldRange)
              }
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
            if (this.fieldRange < 2000) {
              this.fieldRange += 100
              drawField(this.fieldRange)
            }
          } else {
            // this.fieldRange = 3000
            if (this.fieldRange < 2000 && mech.holdingTarget === null) {
              this.fieldRange += 100
              drawField(this.fieldRange)
            }
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }

          if (mech.energy < mech.maxEnergy) {
            mech.energy += mech.fieldRegen;
            const xOff = mech.pos.x - mech.radius * mech.maxEnergy
            const yOff = mech.pos.y - 50
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.fillRect(xOff, yOff, 60 * mech.maxEnergy, 10);
            ctx.fillStyle = mech.fieldMeterColor;
            ctx.fillRect(xOff, yOff, 60 * mech.energy, 10);
            ctx.beginPath()
            ctx.rect(xOff, yOff, 60 * mech.maxEnergy, 10);
            ctx.strokeStyle = "rgb(0, 0, 0)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          if (mech.energy < 0) mech.energy = 0
        }
      }
    },
    {
      name: "pilot wave",
      description: "use <strong class='color-f'>energy</strong> to push <strong>blocks</strong> with your mouse<br>field <strong>radius</strong> decreases out of <strong>line of sight</strong>",
      isEasyToAim: false,
      effect: () => {
        game.replaceTextLog = true; //allow text over write
        game.isBodyDamage = false;
        mech.fieldPhase = 0;
        mech.fieldPosition = {
          x: game.mouseInGame.x,
          y: game.mouseInGame.y
        }
        mech.lastFieldPosition = {
          x: game.mouseInGame.x,
          y: game.mouseInGame.y
        }
        mech.fieldOn = false;
        mech.fieldRadius = 0;
        mech.drop();
        mech.hold = function () {
          if (keys[32] || game.mouseDownRight) {
            if (mech.fieldCDcycle < mech.cycle) {
              const scale = 25
              const bounds = {
                min: {
                  x: mech.fieldPosition.x - scale,
                  y: mech.fieldPosition.y - scale
                },
                max: {
                  x: mech.fieldPosition.x + scale,
                  y: mech.fieldPosition.y + scale
                }
              }
              const isInMap = Matter.Query.region(map, bounds).length
              // const isInMap = Matter.Query.point(map, mech.fieldPosition).length

              if (!mech.fieldOn) { // if field was off, and it starting up, teleport to new mouse location
                mech.fieldOn = true;
                mech.fieldPosition = { //smooth the mouse position
                  x: game.mouseInGame.x,
                  y: game.mouseInGame.y
                }
                mech.lastFieldPosition = { //used to find velocity of field changes
                  x: mech.fieldPosition.x,
                  y: mech.fieldPosition.y
                }
              } else { //when field is on it smoothly moves towards the mouse
                mech.lastFieldPosition = { //used to find velocity of field changes
                  x: mech.fieldPosition.x,
                  y: mech.fieldPosition.y
                }
                const smooth = isInMap ? 0.985 : 0.96;
                mech.fieldPosition = { //smooth the mouse position
                  x: mech.fieldPosition.x * smooth + game.mouseInGame.x * (1 - smooth),
                  y: mech.fieldPosition.y * smooth + game.mouseInGame.y * (1 - smooth),
                }
              }

              //grab power ups into the field
              for (let i = 0, len = powerUp.length; i < len; ++i) {
                const dxP = mech.fieldPosition.x - powerUp[i].position.x;
                const dyP = mech.fieldPosition.y - powerUp[i].position.y;
                const dist2 = dxP * dxP + dyP * dyP;
                // float towards field  if looking at and in range  or  if very close to player
                if (dist2 < mech.fieldRadius * mech.fieldRadius && (mech.lookingAt(powerUp[i]) || dist2 < 16000) && !(mech.health === mech.maxHealth && powerUp[i].name === "heal")) {
                  powerUp[i].force.x += 7 * (dxP / dist2) * powerUp[i].mass;
                  powerUp[i].force.y += 7 * (dyP / dist2) * powerUp[i].mass - powerUp[i].mass * game.g; //negate gravity
                  //extra friction
                  Matter.Body.setVelocity(powerUp[i], {
                    x: powerUp[i].velocity.x * 0.11,
                    y: powerUp[i].velocity.y * 0.11
                  });
                  if (dist2 < 5000 && !game.isChoosing) { //use power up if it is close enough
                    if (mod.isMassEnergy) mech.energy = mech.maxEnergy * 2;
                    powerUp[i].effect();
                    Matter.World.remove(engine.world, powerUp[i]);
                    powerUp.splice(i, 1);
                    // mech.fieldRadius += 50
                    break; //because the array order is messed up after splice
                  }
                }
              }
              //grab power ups normally too
              mech.grabPowerUp();

              if (mech.energy > 0.01) {
                //find mouse velocity
                const diff = Vector.sub(mech.fieldPosition, mech.lastFieldPosition)
                const speed = Vector.magnitude(diff)
                const velocity = Vector.mult(Vector.normalise(diff), Math.min(speed, 45)) //limit velocity
                let radius, radiusSmooth
                if (Matter.Query.ray(map, mech.fieldPosition, player.position).length) { //is there something block the player's view of the field
                  radius = 0
                  radiusSmooth = Math.max(0, isInMap ? 0.96 - 0.02 * speed : 0.995); //0.99
                } else {
                  radius = Math.max(50, 250 - 2 * speed)
                  radiusSmooth = 0.97
                }
                mech.fieldRadius = mech.fieldRadius * radiusSmooth + radius * (1 - radiusSmooth)

                for (let i = 0, len = body.length; i < len; ++i) {
                  if (Vector.magnitude(Vector.sub(body[i].position, mech.fieldPosition)) < mech.fieldRadius) {
                    const DRAIN = speed * body[i].mass * 0.000018
                    if (mech.energy > DRAIN) {
                      mech.energy -= DRAIN;
                      Matter.Body.setVelocity(body[i], velocity); //give block mouse velocity
                      Matter.Body.setAngularVelocity(body[i], body[i].angularVelocity * 0.8)
                      body[i].force.y -= body[i].mass * game.g; //remove gravity effects
                    } else {
                      mech.fieldCDcycle = mech.cycle + 120;
                      mech.fieldOn = false
                      mech.fieldRadius = 0
                      break
                    }
                  }
                }

                if (mod.isPilotFreeze) {
                  for (let i = 0, len = mob.length; i < len; ++i) {
                    if (Vector.magnitude(Vector.sub(mob[i].position, mech.fieldPosition)) < mech.fieldRadius) {
                      mobs.statusSlow(mob[i], 120)
                    }
                  }
                }

                ctx.beginPath();
                const rotate = mech.cycle * 0.008;
                mech.fieldPhase += 0.2 // - 0.5 * Math.sqrt(Math.min(mech.energy, 1));
                const off1 = 1 + 0.06 * Math.sin(mech.fieldPhase);
                const off2 = 1 - 0.06 * Math.sin(mech.fieldPhase);
                ctx.beginPath();
                ctx.ellipse(mech.fieldPosition.x, mech.fieldPosition.y, 1.2 * mech.fieldRadius * off1, 1.2 * mech.fieldRadius * off2, rotate, 0, 2 * Math.PI);
                ctx.globalCompositeOperation = "exclusion"; //"exclusion" "difference";
                ctx.fillStyle = "#fff"; //"#eef";
                ctx.fill();
                ctx.globalCompositeOperation = "source-over";
                ctx.beginPath();
                ctx.ellipse(mech.fieldPosition.x, mech.fieldPosition.y, 1.2 * mech.fieldRadius * off1, 1.2 * mech.fieldRadius * off2, rotate, 0, mech.energy * 2 * Math.PI);
                ctx.strokeStyle = "#000";
                ctx.lineWidth = 4;
                ctx.stroke();
              } else {
                mech.fieldCDcycle = mech.cycle + 120;
                mech.fieldOn = false
                mech.fieldRadius = 0
              }
            } else {
              mech.grabPowerUp();
            }
          } else {
            mech.fieldOn = false
            mech.fieldRadius = 0
          }
          mech.drawFieldMeter()
        }
      }
    },
  ],
};