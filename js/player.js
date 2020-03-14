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
  Fx: 0.015, //run Force on ground //
  FxAir: 0.016, //run Force in Air
  yOff: 70,
  yOffGoal: 70,
  onGround: false, //checks if on ground or in air
  standingOn: undefined,
  numTouching: 0,
  crouch: false,
  isHeadClear: true,
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
  jumpForce: 0.38, //0.38 //this is reset in b.setupAllMods()
  gravity: 0.0024, //0.0019  //game.g is 0.001
  friction: {
    ground: 0.01,
    air: 0.0025
  },
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
  enterAir() {
    //triggered in engine.js on collision
    mech.onGround = false;
    mech.hardLandCD = 0 // disable hard landing
    if (mech.isHeadClear) {
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
      if (mech.isHeadClear) {
        mech.undoCrouch();
      } else {
        mech.yOffGoal = mech.yOffWhen.crouch;
      }
    } else {
      //sets a hard land where player stays in a crouch for a bit and can't jump
      //crouch is forced in keyMove() on ground section below
      const momentum = player.velocity.y * player.mass //player mass is 5 so this triggers at 20 down velocity, unless the player is holding something
      if (momentum > 130) {
        mech.doCrouch();
        mech.yOff = mech.yOffWhen.jump;
        mech.hardLandCD = mech.cycle + Math.min(momentum / 6.5 - 6, 40)

        // if (b.isModStompPauli) {
        //   mech.collisionImmuneCycle = mech.cycle + b.modCollisionImmuneCycles; //player is immune to collision damage for 30 cycles
        // }
        if (b.isModStomp) {
          const len = Math.min(25, (momentum - 120) * 0.1)
          for (let i = 0; i < len; i++) {
            b.spore(player) //spawn drone
          }
        } else if (game.isBodyDamage && player.velocity.y > 27 && momentum > 180 * b.modSquirrelFx) { //falling damage
          let dmg = Math.sqrt(momentum - 180) * 0.01
          dmg = Math.min(Math.max(dmg, 0.02), 0.20);
          mech.damage(dmg);
        }
      } else {
        mech.yOffGoal = mech.yOffWhen.stand;
      }
    }
  },
  buttonCD_jump: 0, //cool down for player buttons
  keyMove() {
    if (mech.onGround) { //on ground **********************
      if (mech.crouch) {
        if (!(keys[83] || keys[40]) && mech.isHeadClear && mech.hardLandCD < mech.cycle) mech.undoCrouch();
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

      //horizontal move on ground
      //apply a force to move
      if (keys[65] || keys[37]) { //left / a
        if (player.velocity.x > -2) {
          player.force.x -= mech.Fx * 1.5
        } else {
          player.force.x -= mech.Fx
        }
      } else if (keys[68] || keys[39]) { //right / d
        if (player.velocity.x < 2) {
          player.force.x += mech.Fx * 1.5
        } else {
          player.force.x += mech.Fx
        }
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
    } else { // in air **********************************
      //check for short jumps
      if (
        mech.buttonCD_jump + 60 > mech.cycle && //just pressed jump
        !(keys[87] || keys[38]) && //but not pressing jump key
        mech.Vy < 0 //moving up
      ) {
        Matter.Body.setVelocity(player, {
          //reduce player y-velocity every cycle
          x: player.velocity.x,
          y: player.velocity.y * 0.94
        });
      }
      const limit = 125 / player.mass / player.mass
      if (keys[65] || keys[37]) {
        if (player.velocity.x > -limit) player.force.x -= mech.FxAir; // move player   left / a
      } else if (keys[68] || keys[39]) {
        if (player.velocity.x < limit) player.force.x += mech.FxAir; //move player  right / d
      }
      // if ((keys[83] || keys[40])) { //ground stomp when pressing down
      //   player.force.y += 0.1;
      //   if (player.velocity.y > 50) {
      //     Matter.Body.setVelocity(player, {
      //       x: 0,
      //       y: 50
      //     });
      //   }
      // }
    }

    //smoothly move leg height towards height goal
    mech.yOff = mech.yOff * 0.85 + mech.yOffGoal * 0.15;
  },
  alive: false,
  death() {
    if (b.isModImmortal) { //if player has the immortality buff, spawn on the same level with randomized stats
      spawn.setSpawnList(); //new mob types
      game.clearNow = true; //triggers a map reset

      //count mods
      let totalMods = 0;
      for (let i = 0; i < b.mods.length; i++) {
        totalMods += b.mods[i].count
      }

      function randomizeMods() {
        b.setupAllMods(); //remove all mods
        //remove all bullets
        for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
        bullet = [];
        for (let i = 0; i < totalMods; i++) {
          //find what mods I don't have
          let options = [];
          for (let i = 0, len = b.mods.length; i < len; i++) {
            if (b.mods[i].count < b.mods[i].maxCount &&
              b.mods[i].name !== "quantum immortality" &&
              b.mods[i].name !== "Born rule" &&
              b.mods[i].name !== "leveraged investment" &&
              b.mods[i].allowed()
            ) options.push(i);
          }
          //add a new mod
          if (options.length > 0) {
            const choose = Math.floor(Math.random() * options.length)
            let newMod = options[choose]
            b.giveMod(newMod)
            options.splice(choose, 1);
          }
        }
        game.updateModHUD();
      }

      function randomizeField() {
        mech.setField(Math.floor(Math.random() * (mech.fieldUpgrades.length)))
      }

      function randomizeHealth() {
        mech.health = 0.55 + Math.random()
        if (mech.health > 1) mech.health = 1;
        mech.displayHealth();
      }

      function randomizeGuns() {
        // const length = Math.round(b.inventory.length * (1 + 0.4 * (Math.random() - 0.5)))
        const length = b.inventory.length
        //removes guns and ammo  
        b.inventory = [];
        b.activeGun = null;
        b.inventoryGun = 0;
        for (let i = 0, len = b.guns.length; i < len; ++i) {
          b.guns[i].have = false;
          if (b.guns[i].ammo !== Infinity) b.guns[i].ammo = 0;
        }
        //give random guns
        for (let i = 0; i < length; i++) b.giveGuns()
        //randomize ammo
        for (let i = 0, len = b.inventory.length; i < len; i++) {
          if (b.guns[b.inventory[i]].ammo !== Infinity) {
            b.guns[b.inventory[i]].ammo = Math.max(0, Math.floor(6 * b.guns[b.inventory[i]].ammo * (Math.random() - 0.1)))
          }
        }
        game.makeGunHUD(); //update gun HUD
      }

      game.wipe = function () { //set wipe to have trails
        ctx.fillStyle = "rgba(255,255,255,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      randomizeHealth()
      randomizeField()
      randomizeGuns()
      randomizeMods()
      for (let i = 0, len = 7; i < len; i++) {
        setTimeout(function () {
          randomizeHealth()
          randomizeField()
          randomizeGuns()
          randomizeMods()
          game.replaceTextLog = true;
          game.makeTextLog(`probability amplitude will synchronize in ${len-i-1} seconds`, 1000);
          game.wipe = function () { //set wipe to have trails
            ctx.fillStyle = `rgba(255,255,255,${(i+1)*(i+1)*0.006})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
        }, (i + 1) * 1000);
      }

      setTimeout(function () {
        game.wipe = function () { //set wipe to normal
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        game.replaceTextLog = true;
        game.makeTextLog("your quantum probability has stabilized", 1000);
      }, 8000);

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
  maxHealth: null, //set in game.reset()
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
    mech.health += heal * game.healScale;
    if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
    b.modOnHealthChange();
    mech.displayHealth();
  },
  defaultFPSCycle: 0, //tracks when to return to normal fps
  collisionImmuneCycle: 0, //used in engine
  damage(dmg) {
    dmg *= mech.fieldDamageResistance
    if (b.isModEntanglement && b.inventory[0] === b.activeGun) {
      for (let i = 0, len = b.inventory.length; i < len; i++) {
        dmg *= 0.9
      }
    }
    mech.health -= dmg;
    if (mech.health < 0) {
      if (b.isModDeathAvoid && !b.isModDeathAvoidOnCD) { //&& Math.random() < 0.5
        b.isModDeathAvoidOnCD = true;
        mech.health += dmg //undo the damage
        if (mech.health < 0.05) mech.health = 0.05
        mech.collisionImmuneCycle = mech.cycle + 30 //disable this.collisionImmuneCycle bonus seconds

        game.wipe = function () { //set wipe to have trails
          ctx.fillStyle = "rgba(255,255,255,0.02)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        setTimeout(function () {
          game.wipe = function () { //set wipe to normal
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          // game.replaceTextLog = true;
          // game.makeTextLog("death avoided", 360);
          b.isModDeathAvoidOnCD = false;
        }, 3000);

        return;
      } else {
        mech.health = 0;
        mech.death();
        return;
      }
    }
    b.modOnHealthChange();
    mech.displayHealth();
    document.getElementById("dmg").style.transition = "opacity 0s";
    document.getElementById("dmg").style.opacity = 0.1 + Math.min(0.6, dmg * 4);

    //chance to build a drone on damage  from mod
    if (b.isModDroneOnDamage) {
      const len = (dmg - 0.06 * Math.random()) * 40
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.75) b.drone() //spawn drone
      }
    }

    // freeze game and display a full screen red color
    if (dmg > 0.05) {
      if (dmg > 0.07 && mech.holdingMassScale > 0.2) mech.drop(); //drop block if holding
      game.fpsCap = 4 //40 - Math.min(25, 100 * dmg)
      game.fpsInterval = 1000 / game.fpsCap;
    } else {
      game.fpsCap = game.fpsCapDefault
      game.fpsInterval = 1000 / game.fpsCap;
    }
    mech.defaultFPSCycle = mech.cycle

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
    requestAnimationFrame(normalFPS);

    // // freeze game and display a full screen red color
    // if (dmg > 0.05) {
    //   if (dmg > 0.07) {
    //     mech.drop(); //drop block if holding
    //   }

    //   game.fpsCap = 4 //40 - Math.min(25, 100 * dmg)
    //   game.fpsInterval = 1000 / game.fpsCap;
    // } else {
    //   game.fpsCap = game.fpsCapDefault
    //   game.fpsInterval = 1000 / game.fpsCap;
    // }
    // mech.defaultFPSCycle = mech.cycle

    // const normalFPS = function () {
    //   if (mech.defaultFPSCycle < mech.cycle) { //back to default values
    //     game.fpsCap = game.fpsCapDefault
    //     game.fpsInterval = 1000 / game.fpsCap;
    //     document.getElementById("dmg").style.transition = "opacity 1s";
    //     document.getElementById("dmg").style.opacity = "0";
    //   } else {
    //     requestAnimationFrame(normalFPS);
    //   }
    // };
    // requestAnimationFrame(normalFPS);
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
  draw() {
    // mech.fillColor = (mech.collisionImmuneCycle < mech.cycle) ? "#fff" : "rgba(255,255,255,0.1)" //"#cff"
    ctx.fillStyle = mech.fillColor;
    mech.walk_cycle += mech.flipLegs * mech.Vx;

    //draw body
    ctx.save();
    ctx.globalAlpha = (mech.collisionImmuneCycle < mech.cycle) ? 1 : 0.7
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
  },
  // *********************************************
  // **************** holding ********************
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
  fieldEnergyMax: 1, //can be increased by a mod
  holdingTarget: null,
  fieldShieldingScale: 1,
  fieldRange: 175,
  // these values are set on reset by setHoldDefaults()
  energy: 0,
  fieldRegen: 0,
  fieldMode: 0,
  fieldFire: false,
  fieldDamageResistance: 1,
  holdingMassScale: 0,
  fieldArc: 0,
  fieldThreshold: 0,
  calculateFieldThreshold() {
    mech.fieldThreshold = Math.cos(mech.fieldArc * Math.PI)
  },
  setHoldDefaults() {
    if (mech.energy < mech.fieldEnergyMax) mech.energy = mech.fieldEnergyMax;
    mech.fieldRegen = 0.001;
    mech.fieldShieldingScale = 1;
    mech.fieldDamageResistance = 1;
    mech.fieldFire = false;
    mech.fieldCDcycle = 0;
    mech.isStealth = false;
    player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield
    mech.holdingMassScale = 0.5;
    mech.fieldArc = 0.2; //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
    mech.calculateFieldThreshold(); //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
    mech.isBodiesAsleep = true;
    mech.wakeCheck();
  },
  drawFieldMeter(range = 60) {
    if (mech.energy < mech.fieldEnergyMax) {
      mech.energy += mech.fieldRegen;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      const xOff = mech.pos.x - mech.radius * mech.fieldEnergyMax
      const yOff = mech.pos.y - 50
      ctx.fillRect(xOff, yOff, range * mech.fieldEnergyMax, 10);
      ctx.fillStyle = "#0cf";
      ctx.fillRect(xOff, yOff, range * mech.energy, 10);
    }
    // else {
    //   mech.energy = mech.fieldEnergyMax
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
    mech.Fx = 0.08 / mass * b.modSquirrelFx //base player mass is 5
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
        if (mech.energy > 0.0007) {
          mech.energy -= 0.0007;
          mech.throwCharge += 1 / mech.holdingTarget.mass * b.modThrowChargeRate
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
      } else if (mech.throwCharge > 0) {
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
        const speed = charge * Math.min(80, 64 / Math.pow(mech.holdingTarget.mass, 0.25));

        mech.throwCharge = 0;
        Matter.Body.setVelocity(mech.holdingTarget, {
          x: player.velocity.x + Math.cos(mech.angle) * speed,
          y: player.velocity.y + Math.sin(mech.angle) * speed
        });
        //player recoil //stronger in x-dir to prevent jump hacking

        Matter.Body.setVelocity(player, {
          x: player.velocity.x - Math.cos(mech.angle) * speed / (mech.crouch ? 30 : 5) * Math.sqrt(mech.holdingTarget.mass),
          y: player.velocity.y - Math.sin(mech.angle) * speed / 40 * Math.sqrt(mech.holdingTarget.mass)
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
    const range = mech.fieldRange - 20;
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
        if (dist2 < 5000) { //use power up if it is close enough
          if (b.isModMassEnergy) {
            mech.energy = mech.fieldEnergyMax * 1.5;
            // mech.addHealth(0.01);
          }
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
    if (mech.energy > fieldBlockCost * 0.2) { //shield needs at least some of the cost to block
      mech.energy -= fieldBlockCost
      if (mech.energy < 0) mech.energy = 0;
      if (mech.energy > mech.fieldEnergyMax) mech.energy = mech.fieldEnergyMax;
      mech.drawHold(who);
      mech.fieldCDcycle = mech.cycle + 10;
      mech.holdingTarget = null
      const unit = Vector.normalise(Vector.sub(player.position, who.position))
      if (b.modBlockDmg) {
        who.damage(b.modBlockDmg)
        //draw electricity
        const step = 40
        ctx.beginPath();
        for (let i = 0, len = 2 * b.modBlockDmg / 0.7; i < len; i++) {
          let x = mech.pos.x - 20 * unit.x;
          let y = mech.pos.y - 20 * unit.y;
          ctx.moveTo(x, y);
          for (let i = 0; i < 8; i++) {
            x += step * (-unit.x + 1.5 * (Math.random() - 0.5))
            y += step * (-unit.y + 1.5 * (Math.random() - 0.5))
            ctx.lineTo(x, y);
          }
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#f0f";
        ctx.stroke();
      }
      //knock backs
      const massRoot = Math.sqrt(Math.min(12, Math.max(0.15, who.mass))); // masses above 12 can start to overcome the push back
      Matter.Body.setVelocity(who, {
        x: player.velocity.x - (15 * unit.x) / massRoot,
        y: player.velocity.y - (15 * unit.y) / massRoot
      });
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

    }
  },
  pushMobsFacing() { // find mobs in range and in direction looking
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (
        Vector.magnitude(Vector.sub(mob[i].position, player.position)) < mech.fieldRange &&
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
    mech.energy -= mech.fieldRegen;
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
      for (let i = 0; i < mech.fieldUpgrades.length; i++) {
        if (index === mech.fieldUpgrades[i].name) index = i
      }
    }
    mech.fieldMode = index;
    document.getElementById("field").innerHTML = mech.fieldUpgrades[index].name
    mech.setHoldDefaults();
    mech.fieldUpgrades[index].effect();
  },
  fieldUpgrades: [{
      name: "field emitter",
      description: "use <strong class='color-f'>energy</strong> to <strong>shield</strong> yourself from <strong class='color-d'>damage</strong><br>lets you <strong>pick up</strong> and <strong>throw</strong> objects",
      isEasyToAim: false,
      effect: () => {
        game.replaceTextLog = true; //allow text over write
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight && mech.energy > 0.05 && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
            mech.drawField();
            mech.grabPowerUp();
            mech.lookForPickUp();
            mech.pushMobsFacing();
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "time dilation field",
      description: "use <strong class='color-f'>energy</strong> to <strong style='letter-spacing: 1px;'>stop time</strong><br><em>can fire bullets while field is active</em>",
      isEasyToAim: true,
      effect: () => {
        mech.fieldFire = true;
        mech.isBodiesAsleep = false;
        mech.hold = function () {
          if (mech.isHolding) {
            mech.wakeCheck();
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
            const DRAIN = 0.0023
            if (mech.energy > DRAIN) {
              mech.energy -= DRAIN;

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

              mech.grabPowerUp();
              mech.lookForPickUp(180);
            } else {
              mech.wakeCheck();
              mech.fieldCDcycle = mech.cycle + 120;
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
            mech.wakeCheck();
            mech.pickUp();
          } else {
            mech.wakeCheck();
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
          if (mech.fieldMode !== 1) mech.wakeCheck(); //wake up if this is no longer the current field mode, like after a new power up
        }
      }
    },
    {
      name: "plasma torch",
      description: "use <strong class='color-f'>energy</strong> to emit <strong class='color-d'>damaging</strong> plasma<br><em>effective at close range</em>",
      isEasyToAim: false,
      effect: () => {
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
            const DRAIN = 0.0005
            if (mech.energy > DRAIN) {
              mech.energy -= DRAIN;
              mech.grabPowerUp();
              mech.lookForPickUp();
              // mech.pushMobs360();
              // mech.pushMobsFacing();

              //calculate laser collision
              let best;
              let range = b.isModPlasmaRange * (175 + (mech.crouch ? 450 : 350) * Math.sqrt(Math.random())) //+ 100 * Math.sin(mech.cycle * 0.3);
              const dir = mech.angle // + 0.04 * (Math.random() - 0.5)
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
                  const dmg = 0.5 * b.dmgScale; //********** SCALE DAMAGE HERE *********************
                  best.who.damage(dmg);
                  best.who.locatePlayer();

                  //push mobs away
                  const force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, path[1])), -0.01 * Math.sqrt(best.who.mass))
                  Matter.Body.applyForce(best.who, path[1], force)
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
                  const force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, path[1])), -0.006 * Math.sqrt(Math.sqrt(best.who.mass)))
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
            } else {
              mech.fieldCDcycle = mech.cycle + 120; //if out of energy
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "negative mass field",
      description: "use <strong class='color-f'>energy</strong> to nullify  &nbsp; <strong style='letter-spacing: 12px;'>gravity</strong><br>and reduce <strong>harm</strong> by <strong>66%</strong>", //<br><strong>launch</strong> larger blocks at much higher speeds
      fieldDrawRadius: 0,
      isEasyToAim: true,
      effect: () => {
        mech.fieldFire = true;
        mech.holdingMassScale = 0.03; //can hold heavier blocks with lower cost to jumping

        mech.hold = function () {
          mech.fieldDamageResistance = 1;
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //push away
            const DRAIN = 0.00035
            if (mech.energy > DRAIN) {
              mech.fieldDamageResistance = 0.33; // 1 - 0.66
              mech.grabPowerUp();
              mech.lookForPickUp();
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

              //add extra friction for horizontal motion
              if (keys[65] || keys[68] || keys[37] || keys[39]) {
                Matter.Body.setVelocity(player, {
                  x: player.velocity.x * 0.99,
                  y: player.velocity.y * 0.97
                });
              } else { //slow rise and fall
                Matter.Body.setVelocity(player, {
                  x: player.velocity.x,
                  y: player.velocity.y * 0.97
                });
              }

              //draw zero-G range
              ctx.beginPath();
              ctx.arc(mech.pos.x, mech.pos.y, this.fieldDrawRadius, 0, 2 * Math.PI);
              ctx.fillStyle = "#f5f5ff";
              ctx.globalCompositeOperation = "difference";
              ctx.fill();
              if (b.isModHawking) {
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
            } else {
              //trigger cool down
              mech.fieldCDcycle = mech.cycle + 120;
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
            mech.pickUp();
            this.fieldDrawRadius = 0
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
            this.fieldDrawRadius = 0
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "standing wave harmonics",
      description: "three oscillating <strong>shields</strong> are permanently active<br><strong class='color-f'>energy</strong> regenerates while field is active",
      isEasyToAim: true,
      effect: () => {
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if (((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle && mech.energy > 0)) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp();
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          if (mech.energy > 0.1 && mech.fieldCDcycle < mech.cycle) {
            const fieldRange1 = (0.55 + 0.35 * Math.sin(mech.cycle / 23)) * mech.fieldRange
            const fieldRange2 = (0.5 + 0.4 * Math.sin(mech.cycle / 37)) * mech.fieldRange
            const fieldRange3 = (0.45 + 0.45 * Math.sin(mech.cycle / 47)) * mech.fieldRange
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
      name: "nano-scale manufacturing",
      description: "excess <strong class='color-f'>energy</strong> used to build <strong>drones</strong><br><strong>2x</strong> <strong class='color-f'>energy</strong> regeneration",
      isEasyToAim: true,
      effect: () => {
        mech.fieldRegen *= 2;
        mech.fieldShieldingScale = b.modFieldEfficiency;
        mech.hold = function () {
          if (mech.energy > mech.fieldEnergyMax - 0.02 && mech.fieldCDcycle < mech.cycle) {
            mech.fieldCDcycle = mech.cycle + 17; // set cool down to prevent +energy from making huge numbers of drones
            if (b.isModSporeField) {
              const len = Math.floor(6 + 3 * Math.random())
              mech.energy -= len * 0.08;
              for (let i = 0; i < len; i++) {
                b.spore(player)
              }
            } else if (b.isModMissileField) {
              mech.energy -= 0.55;
              b.missile({
                  x: mech.pos.x + 40 * Math.cos(mech.angle),
                  y: mech.pos.y + 40 * Math.sin(mech.angle) - 3
                },
                mech.angle + (0.5 - Math.random()) * (mech.crouch ? 0 : 0.2),
                -3 * (0.5 - Math.random()) + (mech.crouch ? 25 : -8) * b.modFireRate,
                1, b.modBabyMissiles)
            } else {
              mech.energy -= 0.33;
              b.drone(1)
            }

          }
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight && mech.energy > 0.1 && mech.fieldCDcycle < mech.cycle)) { //not hold but field button is pressed
            mech.drawField();
            mech.grabPowerUp();
            mech.lookForPickUp();
            mech.pushMobsFacing();
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "phase decoherence field",
      description: "use <strong class='color-f'>energy</strong> to become <strong>intangible</strong><br><strong>moving</strong> and touching <strong>shields</strong> amplifies <strong>cost</strong>",
      isEasyToAim: true,
      effect: () => {
        mech.hold = function () {
          mech.isStealth = false //isStealth disables most uses of foundPlayer() 
          player.collisionFilter.mask = cat.body | cat.map | cat.mob | cat.mobBullet | cat.mobShield //normal collisions
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throwBlock();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
            const DRAIN = 0.0001 + 0.00017 * player.speed
            if (mech.energy > DRAIN) {
              mech.energy -= DRAIN;

              mech.isStealth = true //isStealth disables most uses of foundPlayer() 
              player.collisionFilter.mask = cat.map

              ctx.beginPath();
              ctx.arc(mech.pos.x, mech.pos.y, mech.fieldRange, 0, 2 * Math.PI);
              ctx.globalCompositeOperation = "destination-in"; //in or atop
              ctx.fillStyle = `rgba(255,255,255,${mech.energy*0.5})`;
              ctx.fill();
              ctx.globalCompositeOperation = "source-over";
              ctx.strokeStyle = "#000"
              ctx.lineWidth = 2;
              ctx.stroke();

              mech.grabPowerUp();
              mech.lookForPickUp();

              let inPlayer = Matter.Query.region(mob, player.bounds)
              if (inPlayer.length > 0) {
                for (let i = 0; i < inPlayer.length; i++) {
                  if (inPlayer[i].shield) {
                    mech.energy -= 0.005; //shields drain player energy
                    //draw outline of shield
                    ctx.fillStyle = `rgba(0, 204, 255,0.6)`
                    ctx.fill()
                  } else if (b.isModPhaseFieldDamage && mech.energy > 0.006 && inPlayer[i].dropPowerUp && !inPlayer[i].isShielded) {
                    inPlayer[i].damage(0.4 * b.dmgScale); //damage mobs inside the player
                    mech.energy -= 0.002;

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
                      // ctx.strokeStyle = "#000"
                      // ctx.lineWidth = 1
                      // ctx.stroke()
                      ctx.fillStyle = "rgba(0,0,0,0.3)"
                      ctx.fill()
                    }
                    break;
                  }
                }
              }
            } else {
              mech.fieldCDcycle = mech.cycle + 120;
            }
          } else if (mech.holdingTarget && mech.fieldCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
        }
      }
    },
    // {
    //   name: "code injection field",
    //   description: "capture an enemy in your field for 3 seconds<br>rewrite thier behavior to target your enemies",
    //   effect: () => {
    //     mech.fieldMode = 7;
    //     mech.fieldText();
    //     mech.setHoldDefaults();
    //     mech.hackProgress = 0;
    //     mech.hold = function () {
    //       mech.isStealth = false //isStealth is checked in mob foundPlayer()
    //       player.collisionFilter.mask = 0x010011
    //       if (mech.isHolding) {
    //         mech.hackProgress = 0
    //         mech.drawHold(mech.holdingTarget);
    //         mech.holding();
    //         mech.throwBlock();
    //       } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
    //         const DRAIN = 0.0005
    //         if (mech.energy > DRAIN) {
    //           mech.energy -= DRAIN;

    //           //try to hack a mob
    //           for (let i = 0, len = mob.length; i < len; ++i) {
    //             if (
    //               Vector.magnitude(Vector.sub(mob[i].position, this.pos)) < this.fieldRange &&
    //               this.lookingAt(mob[i]) &&
    //               Matter.Query.ray(map, mob[i].position, this.pos).length === 0
    //             ) {
    //               if (mech.hackProgress > 180) { //hack the mob
    //                 mech.energy = 0;
    //                 mob[i].hackedTarget = null;
    //                 mob[i].seePlayerFreq = Math.round((30 + 30 * Math.random()) * game.lookFreqScale)
    //                 mob[i].do = function () {
    //                   this.healthBar();
    //                   this.hacked();
    //                 }
    //               } else { //hold the mob still
    //                 mech.hackProgress++
    //                 range = this.fieldRange * 0.9
    //                 Matter.Body.setPosition(mob[i], {
    //                   x: mech.pos.x + range * Math.cos(mech.angle),
    //                   y: mech.pos.y + range * Math.sin(mech.angle),
    //                 });
    //                 Matter.Body.setVelocity(mob[i], player.velocity);
    //               }

    //             }
    //           }


    //           mech.pushBodyFacing();
    //           mech.drawField();
    //           mech.grabPowerUp();
    //           mech.lookForPickUp();
    //         } else {
    //           mech.hackProgress = 0
    //           mech.fieldCDcycle = mech.cycle + 120;
    //         }
    //       } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.energy > 0.05) { //holding, but field button is released
    //         mech.pickUp();
    //         mech.hackProgress = 0
    //       } else {
    //         mech.hackProgress = 0
    //         mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
    //       }
    //       mech.drawFieldMeter()
    //     }
    //   }
    // },
  ],
};