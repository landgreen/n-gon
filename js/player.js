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
        category: 0x001000,
        mask: 0x010011
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
  width: 50,
  radius: 30,
  fillColor: "#fff",
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
  Fx: 0.015, //run Force on ground  //this is reset in b.setModDefaults()
  FxAir: 0.015, //run Force in Air
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
  },
  Sy: 0, //adds a smoothing effect to vertical only
  Vx: 0,
  Vy: 0,
  jumpForce: 0.38, //this is reset in b.setModDefaults()
  gravity: 0.0019,
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
    this.pos.x = player.position.x;
    this.pos.y = playerBody.position.y - this.yOff;
    this.Vx = player.velocity.x;
    this.Vy = player.velocity.y;
  },
  transSmoothX: 0,
  transSmoothY: 0,
  lastGroundedPositionY: 0,
  // mouseZoom: 0,
  look() {
    //always on mouse look
    this.angle = Math.atan2(
      game.mouseInGame.y - this.pos.y,
      game.mouseInGame.x - this.pos.x
    );
    //smoothed mouse look translations
    const scale = 0.8;
    this.transSmoothX = canvas.width2 - this.pos.x - (game.mouse.x - canvas.width2) * scale;
    this.transSmoothY = canvas.height2 - this.pos.y - (game.mouse.y - canvas.height2) * scale;

    this.transX += (this.transSmoothX - this.transX) * 0.07;
    this.transY += (this.transSmoothY - this.transY) * 0.07;
  },
  doCrouch() {
    if (!this.crouch) {
      this.crouch = true;
      this.yOffGoal = this.yOffWhen.crouch;
      Matter.Body.translate(playerHead, {
        x: 0,
        y: 40
      });
    }
  },
  undoCrouch() {
    if (this.crouch) {
      this.crouch = false;
      this.yOffGoal = this.yOffWhen.stand;
      Matter.Body.translate(playerHead, {
        x: 0,
        y: -40
      });
    }
  },
  hardLandCD: 0,
  enterAir() {
    //triggered in engine.js on collision
    this.onGround = false;
    this.hardLandCD = 0 // disable hard landing
    if (this.isHeadClear) {
      if (this.crouch) {
        this.undoCrouch();
      }
      this.yOffGoal = this.yOffWhen.jump;
    }
  },
  //triggered in engine.js on collision
  enterLand() {
    this.onGround = true;
    if (this.crouch) {
      if (this.isHeadClear) {
        this.undoCrouch();
      } else {
        this.yOffGoal = this.yOffWhen.crouch;
      }
    } else {
      //sets a hard land where player stays in a crouch for a bit and can't jump
      //crouch is forced in keyMove() on ground section below
      const momentum = player.velocity.y * player.mass //player mass is 5 so this triggers at 20 down velocity, unless the player is holding something
      if (momentum > 120) {
        this.doCrouch();
        this.yOff = this.yOffWhen.jump;
        this.hardLandCD = mech.cycle + Math.min(momentum / 6 - 6, 40)

        if (game.isBodyDamage && player.velocity.y > 26 && momentum > 165) { //falling damage
          mech.damageImmune = mech.cycle + 30; //player is immune to collision damage for 30 cycles
          let dmg = Math.sqrt(momentum - 165) * 0.01
          dmg = Math.min(Math.max(dmg, 0.02), 0.20);
          mech.damage(dmg);
        }
      } else {
        this.yOffGoal = this.yOffWhen.stand;
      }
    }
  },
  buttonCD_jump: 0, //cool down for player buttons
  keyMove() {
    if (this.onGround) { //on ground **********************
      if (this.crouch) {
        if (!(keys[83] || keys[40]) && this.isHeadClear && this.hardLandCD < mech.cycle) this.undoCrouch();
      } else if (keys[83] || keys[40] || this.hardLandCD > mech.cycle) {
        this.doCrouch(); //on ground && not crouched and pressing s or down
      } else if ((keys[87] || keys[38]) && this.buttonCD_jump + 20 < mech.cycle && this.yOffWhen.stand > 23) {
        this.buttonCD_jump = mech.cycle; //can't jump again until 20 cycles pass

        //apply a fraction of the jump force to the body the player is jumping off of
        Matter.Body.applyForce(mech.standingOn, mech.pos, {
          x: 0,
          y: this.jumpForce * 0.12 * Math.min(mech.standingOn.mass, 5)
        });

        player.force.y = -this.jumpForce; //player jump force
        Matter.Body.setVelocity(player, { //zero player y-velocity for consistent jumps
          x: player.velocity.x,
          y: 0
        });
      }

      //horizontal move on ground
      //apply a force to move
      if (keys[65] || keys[37]) { //left / a
        if (player.velocity.x > -2) {
          player.force.x -= this.Fx * 1.5
        } else {
          player.force.x -= this.Fx
        }
      } else if (keys[68] || keys[39]) { //right / d
        if (player.velocity.x < 2) {
          player.force.x += this.Fx * 1.5
        } else {
          player.force.x += this.Fx
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
        const stoppingFriction = (this.crouch) ? 0.65 : 0.89; // this controls speed when crouched
        Matter.Body.setVelocity(player, {
          x: player.velocity.x * stoppingFriction,
          y: player.velocity.y * stoppingFriction
        });
      }

    } else { // in air **********************************
      //check for short jumps
      if (
        this.buttonCD_jump + 60 > mech.cycle && //just pressed jump
        !(keys[87] || keys[38]) && //but not pressing jump key
        this.Vy < 0 //moving up
      ) {
        Matter.Body.setVelocity(player, {
          //reduce player y-velocity every cycle
          x: player.velocity.x,
          y: player.velocity.y * 0.94
        });
      }
      const limit = 125 / player.mass / player.mass
      if (keys[65] || keys[37]) {
        if (player.velocity.x > -limit) player.force.x -= this.FxAir; // move player   left / a
      } else if (keys[68] || keys[39]) {
        if (player.velocity.x < limit) player.force.x += this.FxAir; //move player  right / d
      }
    }

    //smoothly move leg height towards height goal
    this.yOff = this.yOff * 0.85 + this.yOffGoal * 0.15;
  },
  alive: true,
  death() {
    if (b.modIsImmortal) { //if player has the immortality buff, spawn on the same level with randomized stats
      spawn.setSpawnList(); //new mob types
      game.clearNow = true; //triggers a map reset

      //count mods
      let totalMods = -2; //lose the immortality mod and one more, so -2 
      for (let i = 0; i < b.mods.length; i++) {
        if (b.mods[i].have) totalMods++
      }

      function randomizeMods() {
        b.setModDefaults(); //remove all mods
        for (let i = 0; i < totalMods; i++) {
          //find what mods I don't have
          let options = [];
          for (let i = 0; i < b.mods.length; i++) {
            //can't get quantum immortality again 
            if (i !== 7 && !b.mods[i].have) options.push(i);
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
        if (game.difficulty * (Math.random() + 0.27) > 2) {
          mech.fieldUpgrades[Math.floor(Math.random() * (mech.fieldUpgrades.length))].effect();
        } else {
          mech.fieldUpgrades[0].effect();
        }
      }

      function randomizeHealth() {
        mech.health = 0.5 + Math.random()
        if (mech.health > 1) mech.health = 1;
        mech.displayHealth();
      }

      function randomizeGuns() {
        const length = Math.round(b.inventory.length * (1 + 0.4 * (Math.random() - 0.5)))
        //removes guns and ammo  
        b.inventory = [];
        b.activeGun = null;
        b.inventoryGun = 0;
        for (let i = 0, len = b.guns.length; i < len; ++i) {
          b.guns[i].have = false;
          if (b.guns[i].ammo !== Infinity) b.guns[i].ammo = 0;
        }
        for (let i = 0; i < length; i++) {
          powerUps.gun.effect();
        }

        //randomize ammo
        for (let i = 0, len = b.inventory.length; i < len; i++) {
          if (b.guns[b.inventory[i]].ammo !== Infinity) {
            b.guns[b.inventory[i]].ammo = Math.max(0, Math.floor(6 * b.guns[b.inventory[i]].ammo * (Math.random() - 0.3)))
          }
        }
        game.makeGunHUD(); //update gun HUD
      }

      game.wipe = function () { //set wipe to have trails
        ctx.fillStyle = "rgba(255,255,255,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      randomizeMods()
      randomizeGuns()
      randomizeField()
      randomizeHealth()
      for (let i = 0, len = 7; i < len; i++) {
        setTimeout(function () {
          randomizeMods()
          randomizeGuns()
          randomizeField()
          randomizeHealth()
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
        document.title = "n-gon: L" + (game.difficulty) + " " + level.levels[level.onLevel];
      }, 8000);

    } else if (this.alive) { //normal death code here
      this.alive = false;
      game.paused = true;
      this.health = 0;
      this.displayHealth();
      document.getElementById("text-log").style.opacity = 0; //fade out any active text logs
      document.getElementById("fade-out").style.opacity = 1; //slowly fades out
      setTimeout(function () {
        game.splashReturn();
      }, 3000);
    }
  },
  health: 0,
  drawHealth() {
    if (this.health < 1) {
      ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
      ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, 60, 10);
      ctx.fillStyle = "#f00";
      ctx.fillRect(
        this.pos.x - this.radius,
        this.pos.y - 50,
        60 * this.health,
        10
      );
    }
  },
  displayHealth() {
    id = document.getElementById("health");
    id.style.width = Math.floor(300 * this.health) + "px";
    //css animation blink if health is low
    if (this.health < 0.3) {
      id.classList.add("low-health");
    } else {
      id.classList.remove("low-health");
    }
  },
  addHealth(heal) {
    this.health += heal;
    if (this.health > 1 || b.isModFullHeal) this.health = 1;
    this.displayHealth();
  },
  defaultFPSCycle: 0, //tracks when to return to normal fps
  damage(dmg) {
    if (b.isModMonogamy && b.inventory[0] === b.activeGun) {
      for (let i = 0, len = b.inventory.length; i < len; i++) {
        dmg *= 0.93
      }
    }
    this.health -= dmg;
    if (this.health < 0) {
      this.health = 0;
      this.death();
      return;
    }
    this.displayHealth();
    document.getElementById("dmg").style.transition = "opacity 0s";
    document.getElementById("dmg").style.opacity = 0.1 + Math.min(0.6, dmg * 4);

    //chance to build a drone on damage  from mod
    if (b.isModDroneOnDamage) {
      const len = (dmg - 0.08 + 0.05 * Math.random()) / 0.05
      for (let i = 0; i < len; i++) {
        if (Math.random() < 0.6) b.guns[13].fire() //spawn drone
      }
    }

    // freeze game and display a full screen red color
    if (dmg > 0.05) {
      this.drop(); //drop block if holding
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
    //     this.drop(); //drop block if holding
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
  damageImmune: 0,
  hitMob(i, dmg) {
    //prevents damage happening too quick
  },
  buttonCD: 0, //cool down for player buttons
  usePowerUp(i) {
    powerUp[i].effect();
    Matter.World.remove(engine.world, powerUp[i]);
    powerUp.splice(i, 1);
    if (b.isModMassEnergy) {
      mech.fieldMeter = 1;
      mech.addHealth(0.03);
    }
  },
  drawLeg(stroke) {
    // if (game.mouseInGame.x > this.pos.x) {
    if (mech.angle > -Math.PI / 2 && mech.angle < Math.PI / 2) {
      this.flipLegs = 1;
    } else {
      this.flipLegs = -1;
    }
    ctx.save();
    ctx.scale(this.flipLegs, 1); //leg lines
    ctx.beginPath();
    ctx.moveTo(this.hip.x, this.hip.y);
    ctx.lineTo(this.knee.x, this.knee.y);
    ctx.lineTo(this.foot.x, this.foot.y);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 7;
    ctx.stroke();

    //toe lines
    ctx.beginPath();
    ctx.moveTo(this.foot.x, this.foot.y);
    ctx.lineTo(this.foot.x - 15, this.foot.y + 5);
    ctx.moveTo(this.foot.x, this.foot.y);
    ctx.lineTo(this.foot.x + 15, this.foot.y + 5);
    ctx.lineWidth = 4;
    ctx.stroke();

    //hip joint
    ctx.beginPath();
    ctx.arc(this.hip.x, this.hip.y, 11, 0, 2 * Math.PI);
    //knee joint
    ctx.moveTo(this.knee.x + 7, this.knee.y);
    ctx.arc(this.knee.x, this.knee.y, 7, 0, 2 * Math.PI);
    //foot joint
    ctx.moveTo(this.foot.x + 6, this.foot.y);
    ctx.arc(this.foot.x, this.foot.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = this.fillColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  },
  calcLeg(cycle_offset, offset) {
    this.hip.x = 12 + offset;
    this.hip.y = 24 + offset;
    //stepSize goes to zero if Vx is zero or not on ground (make this transition cleaner)
    this.stepSize = 0.8 * this.stepSize + 0.2 * (7 * Math.sqrt(Math.min(9, Math.abs(this.Vx))) * this.onGround);
    //changes to stepsize are smoothed by adding only a percent of the new value each cycle
    const stepAngle = 0.034 * this.walk_cycle + cycle_offset;
    this.foot.x = 2.2 * this.stepSize * Math.cos(stepAngle) + offset;
    this.foot.y = offset + 1.2 * this.stepSize * Math.sin(stepAngle) + this.yOff + this.height;
    const Ymax = this.yOff + this.height;
    if (this.foot.y > Ymax) this.foot.y = Ymax;

    //calculate knee position as intersection of circle from hip and foot
    const d = Math.sqrt((this.hip.x - this.foot.x) * (this.hip.x - this.foot.x) + (this.hip.y - this.foot.y) * (this.hip.y - this.foot.y));
    const l = (this.legLength1 * this.legLength1 - this.legLength2 * this.legLength2 + d * d) / (2 * d);
    const h = Math.sqrt(this.legLength1 * this.legLength1 - l * l);
    this.knee.x = (l / d) * (this.foot.x - this.hip.x) - (h / d) * (this.foot.y - this.hip.y) + this.hip.x + offset;
    this.knee.y = (l / d) * (this.foot.y - this.hip.y) + (h / d) * (this.foot.x - this.hip.x) + this.hip.y;
  },
  draw() {
    ctx.fillStyle = this.fillColor;
    this.walk_cycle += this.flipLegs * this.Vx;

    //draw body
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    this.calcLeg(Math.PI, -3);
    this.drawLeg("#4a4a4a");
    this.calcLeg(0, 0);
    this.drawLeg("#333");
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, 2 * Math.PI);
    let grd = ctx.createLinearGradient(-30, 0, 30, 0);
    grd.addColorStop(0, this.fillColorDark);
    grd.addColorStop(1, this.fillColor);
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
  // these values are set on reset by setHoldDefaults()
  fieldMeter: 0,
  fieldRegen: 0,
  fieldMode: 0,
  fieldFire: false,
  holdingMassScale: 0,
  throwChargeRate: 0,
  throwChargeMax: 0,
  fieldFireCD: 0,
  fieldShieldingScale: 0,
  grabRange: 0,
  fieldArc: 0,
  fieldThreshold: 0,
  calculateFieldThreshold() {
    this.fieldThreshold = Math.cos(this.fieldArc * Math.PI)
  },
  setHoldDefaults() {
    this.fieldMeter = 1;
    this.fieldRegen = 0.001;
    this.fieldFire = false;
    this.fieldCDcycle = 0;
    this.isStealth = false;
    player.collisionFilter.mask = 0x010011 //0x010011 is normal
    this.holdingMassScale = 0.5;
    this.fieldFireCD = 15;
    this.fieldShieldingScale = 1; //scale energy loss after collision with mob
    this.grabRange = 175;
    this.fieldArc = 0.2; //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
    this.calculateFieldThreshold(); //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
    mech.isBodiesAsleep = true;
    mech.wakeCheck();
    // this.phaseBlocks(0x011111)
  },
  drawFieldMeter(range = 60) {
    if (this.fieldMeter < 1) {
      mech.fieldMeter += mech.fieldRegen;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, range, 10);
      ctx.fillStyle = "#0cf";
      ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, range * this.fieldMeter, 10);
    } else {
      mech.fieldMeter = 1
    }
  },
  lookingAt(who) {
    //calculate a vector from body to player and make it length 1
    const diff = Matter.Vector.normalise(Matter.Vector.sub(who.position, mech.pos));
    //make a vector for the player's direction of length 1
    const dir = {
      x: Math.cos(mech.angle),
      y: Math.sin(mech.angle)
    };
    //the dot product of diff and dir will return how much over lap between the vectors
    // console.log(Matter.Vector.dot(dir, diff))
    if (Matter.Vector.dot(dir, diff) > this.fieldThreshold) {
      return true;
    }
    return false;
  },
  drop() {
    if (this.isHolding) {
      this.isHolding = false;
      this.definePlayerMass()
      this.holdingTarget.collisionFilter.category = 0x010000;
      this.holdingTarget.collisionFilter.mask = 0x011111;
      this.holdingTarget = null;
      this.throwCharge = 0;
    }
  },
  definePlayerMass(mass = mech.defaultMass) {
    Matter.Body.setMass(player, mass);
    //reduce air and ground move forces
    this.Fx = 0.075 / mass * b.modSquirrelFx
    this.FxAir = 0.375 / mass / mass
    //make player stand a bit lower when holding heavy masses
    this.yOffWhen.stand = Math.max(this.yOffWhen.crouch, Math.min(49, 49 - (mass - 5) * 6))
    if (this.onGround && !this.crouch) this.yOffGoal = this.yOffWhen.stand;
  },
  drawHold(target, stroke = true) {
    const eye = 15;
    const len = target.vertices.length - 1;
    ctx.fillStyle = "rgba(110,170,200," + (0.2 + 0.4 * Math.random()) + ")";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(
      mech.pos.x + eye * Math.cos(this.angle),
      mech.pos.y + eye * Math.sin(this.angle)
    );
    ctx.lineTo(target.vertices[len].x, target.vertices[len].y);
    ctx.lineTo(target.vertices[0].x, target.vertices[0].y);
    ctx.fill();
    if (stroke) ctx.stroke();
    for (let i = 0; i < len; i++) {
      ctx.beginPath();
      ctx.moveTo(
        mech.pos.x + eye * Math.cos(this.angle),
        mech.pos.y + eye * Math.sin(this.angle)
      );
      ctx.lineTo(target.vertices[i].x, target.vertices[i].y);
      ctx.lineTo(target.vertices[i + 1].x, target.vertices[i + 1].y);
      ctx.fill();
      if (stroke) ctx.stroke();
    }
  },
  holding() {
    this.fieldMeter -= this.fieldRegen;
    if (this.fieldMeter < 0) this.fieldMeter = 0;
    Matter.Body.setPosition(this.holdingTarget, {
      x: mech.pos.x + 70 * Math.cos(this.angle),
      y: mech.pos.y + 70 * Math.sin(this.angle)
    });
    Matter.Body.setVelocity(this.holdingTarget, player.velocity);
    Matter.Body.rotate(this.holdingTarget, 0.01 / this.holdingTarget.mass); //gently spin the block
  },
  throw () {
    if ((keys[32] || game.mouseDownRight)) {
      if (this.fieldMeter > 0.0007) {
        this.fieldMeter -= 0.0007;
        this.throwCharge += this.throwChargeRate;;
        //draw charge
        const x = mech.pos.x + 15 * Math.cos(this.angle);
        const y = mech.pos.y + 15 * Math.sin(this.angle);
        const len = this.holdingTarget.vertices.length - 1;
        const edge = this.throwCharge * this.throwCharge * 0.02;
        const grd = ctx.createRadialGradient(x, y, edge, x, y, edge + 5);
        grd.addColorStop(0, "rgba(255,50,150,0.3)");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(this.holdingTarget.vertices[len].x, this.holdingTarget.vertices[len].y);
        ctx.lineTo(this.holdingTarget.vertices[0].x, this.holdingTarget.vertices[0].y);
        ctx.fill();
        for (let i = 0; i < len; i++) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(this.holdingTarget.vertices[i].x, this.holdingTarget.vertices[i].y);
          ctx.lineTo(this.holdingTarget.vertices[i + 1].x, this.holdingTarget.vertices[i + 1].y);
          ctx.fill();
        }
      } else {
        this.drop()
      }
    } else if (this.throwCharge > 0) {
      //throw the body
      this.fireCDcycle = mech.cycle + this.fieldFireCD;
      this.isHolding = false;
      //bullet-like collisions
      this.holdingTarget.collisionFilter.category = 0x000100;
      this.holdingTarget.collisionFilter.mask = 0x110111;
      //check every second to see if player is away from thrown body, and make solid
      const solid = function (that) {
        const dx = that.position.x - player.position.x;
        const dy = that.position.y - player.position.y;
        if (dx * dx + dy * dy > 10000 && that.speed < 3 && that !== mech.holdingTarget) {
          that.collisionFilter.category = 0x010000; //make solid
          that.collisionFilter.mask = 0x011111;
        } else {
          setTimeout(solid, 50, that);
        }
      };
      setTimeout(solid, 200, this.holdingTarget);
      //throw speed scales a bit with mass
      const speed = Math.min(85, Math.min(54 / this.holdingTarget.mass + 5, 48) * Math.min(this.throwCharge, this.throwChargeMax) / 50);

      this.throwCharge = 0;
      Matter.Body.setVelocity(this.holdingTarget, {
        x: player.velocity.x + Math.cos(this.angle) * speed,
        y: player.velocity.y + Math.sin(this.angle) * speed
      });
      //player recoil //stronger in x-dir to prevent jump hacking
      Matter.Body.setVelocity(player, {
        x: player.velocity.x - Math.cos(this.angle) * speed / 20 * Math.sqrt(this.holdingTarget.mass),
        y: player.velocity.y - Math.sin(this.angle) * speed / 80 * Math.sqrt(this.holdingTarget.mass)
      });
      this.definePlayerMass() //return to normal player mass
    }
  },
  drawField() {
    if (mech.holdingTarget) {
      ctx.fillStyle = "rgba(110,170,200," + (mech.fieldMeter * (0.05 + 0.05 * Math.random())) + ")";
      ctx.strokeStyle = "rgba(110, 200, 235, " + (0.3 + 0.08 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
    } else {
      ctx.fillStyle = "rgba(110,170,200," + (0.02 + mech.fieldMeter * (0.15 + 0.15 * Math.random())) + ")";
      ctx.strokeStyle = "rgba(110, 200, 235, " + (0.6 + 0.2 * Math.random()) + ")" //"#9bd" //"rgba(110, 200, 235, " + (0.5 + 0.1 * Math.random()) + ")"
    }
    // const off = 2 * Math.cos(game.cycle * 0.1)
    const range = this.grabRange - 20;
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
    if (mech.fieldCDcycle < mech.cycle) {
      const grabPowerUpRange2 = (this.grabRange + 220) * (this.grabRange + 220)
      for (let i = 0, len = powerUp.length; i < len; ++i) {
        const dxP = mech.pos.x - powerUp[i].position.x;
        const dyP = mech.pos.y - powerUp[i].position.y;
        const dist2 = dxP * dxP + dyP * dyP;
        // float towards player  if looking at and in range  or  if very close to player
        if (dist2 < grabPowerUpRange2 && this.lookingAt(powerUp[i]) || dist2 < 16000) {
          if (dist2 < 5000) { //use power up if it is close enough
            Matter.Body.setVelocity(player, { //player knock back, after grabbing power up
              x: player.velocity.x + ((powerUp[i].velocity.x * powerUp[i].mass) / player.mass) * 0.3,
              y: player.velocity.y + ((powerUp[i].velocity.y * powerUp[i].mass) / player.mass) * 0.3
            });
            mech.usePowerUp(i);
            return;
          }
          this.fieldMeter -= this.fieldRegen * 0.5;
          powerUp[i].force.x += 7 * (dxP / dist2) * powerUp[i].mass;
          powerUp[i].force.y += 7 * (dyP / dist2) * powerUp[i].mass - powerUp[i].mass * game.g; //negate gravity
          //extra friction
          Matter.Body.setVelocity(powerUp[i], {
            x: powerUp[i].velocity.x * 0.11,
            y: powerUp[i].velocity.y * 0.11
          });
        }
      }
    }
  },
  pushMass(who) {
    const fieldBlockCost = Math.max(0.02, who.mass * 0.012) //0.012
    if (this.fieldMeter > fieldBlockCost) {
      this.fieldMeter -= fieldBlockCost * this.fieldShieldingScale;
      if (this.fieldMeter < 0) this.fieldMeter = 0;
      this.drawHold(who);
      //knock backs
      const angle = Math.atan2(player.position.y - who.position.y, player.position.x - who.position.x);
      const mass = Math.min(Math.sqrt(who.mass), 4);
      Matter.Body.setVelocity(who, {
        x: player.velocity.x - (15 * Math.cos(angle)) / mass,
        y: player.velocity.y - (15 * Math.sin(angle)) / mass
      });
      Matter.Body.setVelocity(player, {
        x: player.velocity.x + 5 * Math.cos(angle) * mass,
        y: player.velocity.y + 5 * Math.sin(angle) * mass
      });
    }
  },
  pushMobsFacing() { // find mobs in range and in direction looking
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (
        Matter.Vector.magnitude(Matter.Vector.sub(mob[i].position, this.pos)) < this.grabRange &&
        this.lookingAt(mob[i]) &&
        Matter.Query.ray(map, mob[i].position, this.pos).length === 0
      ) {
        mob[i].locatePlayer();
        mech.pushMass(mob[i]);
      }
    }
  },
  pushMobs360(range = this.grabRange * 0.75) { // find mobs in range in any direction
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (
        Matter.Vector.magnitude(Matter.Vector.sub(mob[i].position, this.pos)) < range &&
        Matter.Query.ray(map, mob[i].position, this.pos).length === 0
      ) {
        mob[i].locatePlayer();
        mech.pushMass(mob[i]);
      }
    }
  },
  pushBodyFacing() { // push all body in range and in direction looking
    for (let i = 0, len = body.length; i < len; ++i) {
      if (
        body[i].speed > 12 && body[i].mass > 2 &&
        Matter.Vector.magnitude(Matter.Vector.sub(body[i].position, this.pos)) < this.grabRange &&
        this.lookingAt(body[i]) &&
        Matter.Query.ray(map, body[i].position, this.pos).length === 0
      ) {
        mech.pushMass(body[i]);
      }
    }
  },
  pushBody360(range = this.grabRange * 0.75) { // push all body in range and in direction looking
    for (let i = 0, len = body.length; i < len; ++i) {
      if (
        body[i].speed > 12 && body[i].mass > 2 &&
        Matter.Vector.magnitude(Matter.Vector.sub(body[i].position, this.pos)) < range &&
        this.lookingAt(body[i]) &&
        Matter.Query.ray(map, body[i].position, this.pos).length === 0 &&
        body[i].collisionFilter.category === 0x010000
      ) {
        mech.pushMass(body[i]);
      }
    }
  },
  lookForPickUp(range = this.grabRange) { //find body to pickup
    this.fieldMeter -= this.fieldRegen;
    const grabbing = {
      targetIndex: null,
      targetRange: range,
      // lookingAt: false //false to pick up object in range, but not looking at
    };
    for (let i = 0, len = body.length; i < len; ++i) {
      if (Matter.Query.ray(map, body[i].position, this.pos).length === 0) {
        //is this next body a better target then my current best
        const dist = Matter.Vector.magnitude(Matter.Vector.sub(body[i].position, this.pos));
        const looking = this.lookingAt(body[i]);
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
      this.holdingTarget = body[grabbing.targetIndex];
      //
      ctx.beginPath(); //draw on each valid body
      let vertices = this.holdingTarget.vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      ctx.fillStyle = "rgba(190,215,230," + (0.3 + 0.7 * Math.random()) + ")";
      ctx.fill();

      ctx.globalAlpha = 0.2;
      this.drawHold(this.holdingTarget);
      ctx.globalAlpha = 1;
    } else {
      this.holdingTarget = null;
    }
  },
  pickUp() {
    //triggers when a hold target exits and field button is released
    this.isHolding = true;
    this.definePlayerMass(mech.defaultMass + this.holdingTarget.mass * this.holdingMassScale)
    //collide with nothing
    this.holdingTarget.collisionFilter.category = 0x000000;
    this.holdingTarget.collisionFilter.mask = 0x000000;
    // if (this.holdingTarget) {
    //   this.holdingTarget.collisionFilter.category = 0x010000;
    //   this.holdingTarget.collisionFilter.mask = 0x011111;
    // }
    // combine momentum   // this doesn't feel right in game
    // const px = player.velocity.x * player.mass + this.holdingTarget.velocity.x * this.holdingTarget.mass;
    // const py = player.velocity.y * player.mass + this.holdingTarget.velocity.y * this.holdingTarget.mass;
    // Matter.Body.setVelocity(player, {
    //   x: px / (player.mass + this.holdingTarget.mass),
    //   y: py / (player.mass + this.holdingTarget.mass)
    // });
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
  fieldText() {
    game.replaceTextLog = true;
    game.makeTextLog(`${game.SVGrightMouse}<strong style='font-size:30px;'> ${mech.fieldUpgrades[mech.fieldMode].name}</strong><br><span class='faded'></span><br>${mech.fieldUpgrades[mech.fieldMode].description}`, 1000);
    game.replaceTextLog = false;
    document.getElementById("field").innerHTML = mech.fieldUpgrades[mech.fieldMode].name //add field
  },
  fieldUpgrades: [{
      name: "field emitter",
      description: "use <strong class='color-f'>energy</strong> to <strong>shield</strong> yourself from <strong class='color-d'>damage</strong><br>lets you <strong>pick up</strong> and <strong>throw</strong> objects",
      effect: () => {
        mech.fieldMode = 0;
        mech.fieldText();
        game.replaceTextLog = true; //allow text over write
        // game.makeTextLog("<strong style='font-size:30px;'></strong><br> <strong class='faded'>(right click or space bar)</strong><p></p>", 1200);
        mech.setHoldDefaults();
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight && mech.fieldMeter > 0.1)) { //not hold but field button is pressed
            mech.drawField();
            mech.grabPowerUp();
            mech.pushMobsFacing();
            mech.pushBodyFacing();
            mech.lookForPickUp();
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
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
      effect: () => {
        mech.fieldMode = 1;
        mech.fieldText();
        mech.setHoldDefaults();
        mech.fieldFire = true;
        mech.grabRange = 130
        mech.isBodiesAsleep = false;
        mech.hold = function () {
          if (mech.isHolding) {
            mech.wakeCheck();
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
            const DRAIN = 0.0027
            if (mech.fieldMeter > DRAIN) {
              mech.fieldMeter -= DRAIN;

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
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
            mech.wakeCheck();
            mech.pickUp();
          } else {
            mech.wakeCheck();
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          mech.drawFieldMeter()
          if (mech.fieldMode !== 1) {
            //wake up if this is no longer the current field mode, like after a new power up
            mech.wakeCheck();

          }
        }
      }
    },
    {
      name: "plasma torch",
      description: "use <strong class='color-f'>energy</strong> to emit <strong class='color-d'>damaging</strong> plasma<br><strong>decreased</strong> <strong>shield</strong> range and efficiency",
      effect: () => {
        mech.fieldMode = 2;
        mech.fieldText();
        mech.setHoldDefaults();
        // mech.fieldShieldingScale = 2;
        // mech.grabRange = 125;
        mech.fieldArc = 0.1 //run calculateFieldThreshold after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        mech.calculateFieldThreshold(); //run after setting fieldArc, used for powerUp grab and mobPush with lookingAt(mob)
        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //not hold but field button is pressed
            const DRAIN = 0.0006
            if (mech.fieldMeter > DRAIN) {
              mech.fieldMeter -= DRAIN;

              //calculate laser collision
              let best;
              let range = 80 + (mech.crouch ? 500 : 300) * Math.sqrt(Math.random()) //+ 100 * Math.sin(mech.cycle * 0.3);
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
                  const dmg = 0.35 * b.dmgScale; //********** SCALE DAMAGE HERE *********************
                  best.who.damage(dmg);
                  best.who.locatePlayer();

                  //push mobs away
                  const force = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(mech.pos, path[1])), -0.01 * Math.sqrt(best.who.mass))
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
                  const force = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(mech.pos, path[1])), -0.006 * Math.sqrt(Math.sqrt(best.who.mass)))
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
              ctx.beginPath();
              ctx.moveTo(path[0].x, path[0].y);
              ctx.lineTo(path[1].x, path[1].y);
              ctx.stroke();

              //draw electricity
              const Dx = Math.cos(mech.angle);
              const Dy = Math.sin(mech.angle);
              let x = mech.pos.x + 20 * Dx;
              let y = mech.pos.y + 20 * Dy;
              ctx.beginPath();
              ctx.moveTo(x, y);
              const step = range / 10
              for (let i = 0; i < 8; i++) {
                x += step * (Dx + 1.5 * (Math.random() - 0.5))
                y += step * (Dy + 1.5 * (Math.random() - 0.5))
                ctx.lineTo(x, y);
              }
              ctx.lineWidth = 2 * Math.random();
              ctx.stroke();

              mech.pushMobs360(110);
              // mech.pushBody360(100); //disabled because doesn't work at short range
              mech.grabPowerUp();
              mech.lookForPickUp();
            } else {
              mech.fieldCDcycle = mech.cycle + 120; //if out of energy
            }
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
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
      description: "use <strong class='color-f'>energy</strong> to nullify &nbsp; <strong style='letter-spacing: 10px;'>gravity</strong><br><em>can fire bullets while active</em>",
      effect: () => {
        mech.fieldMode = 3;
        mech.fieldText();
        mech.setHoldDefaults();
        mech.fieldFire = true;

        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) { //push away
            const DRAIN = 0.0004
            if (mech.fieldMeter > DRAIN) {
              mech.pushMobs360(170);
              mech.pushBody360(180);
              mech.grabPowerUp();
              mech.lookForPickUp(170);
              //look for nearby objects to make zero-g
              function zeroG(who, mag = 1.06) {
                for (let i = 0, len = who.length; i < len; ++i) {
                  sub = Matter.Vector.sub(who[i].position, mech.pos);
                  dist = Matter.Vector.magnitude(sub);
                  if (dist < mech.grabRange) {
                    who[i].force.y -= who[i].mass * (game.g * mag); //add a bit more then standard gravity
                  }
                }
              }
              // zeroG(bullet);  //works fine, but not that noticeable and maybe not worth the possible performance hit
              // zeroG(mob);  //mobs are too irregular to make this work?

              Matter.Body.setVelocity(player, {
                x: player.velocity.x,
                y: player.velocity.y * 0.97
              });

              if (keys[83] || keys[40]) { //down
                player.force.y -= 0.8 * player.mass * mech.gravity;
                mech.grabRange = mech.grabRange * 0.97 + 400 * 0.03;
                zeroG(powerUp, 0.85);
                zeroG(body, 0.85);
              } else if (keys[87] || keys[38]) { //up
                mech.fieldMeter -= 5 * DRAIN;
                mech.grabRange = mech.grabRange * 0.97 + 750 * 0.03;
                player.force.y -= 1.2 * player.mass * mech.gravity;
                zeroG(powerUp, 1.13);
                zeroG(body, 1.13);
              } else {
                mech.fieldMeter -= DRAIN;
                mech.grabRange = mech.grabRange * 0.97 + 650 * 0.03;
                player.force.y -= 1.07 * player.mass * mech.gravity; // slow upward drift
                zeroG(powerUp);
                zeroG(body);
              }

              //add extra friction for horizontal motion
              if (keys[65] || keys[68] || keys[37] || keys[39]) {
                Matter.Body.setVelocity(player, {
                  x: player.velocity.x * 0.85,
                  y: player.velocity.y
                });
              }

              //draw zero-G range
              ctx.beginPath();
              ctx.arc(mech.pos.x, mech.pos.y, mech.grabRange, 0, 2 * Math.PI);
              ctx.fillStyle = "#f5f5ff";
              ctx.globalCompositeOperation = "difference";
              ctx.fill();
              ctx.globalCompositeOperation = "source-over";
            } else {
              //trigger cool down
              mech.fieldCDcycle = mech.cycle + 120;
            }
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
            mech.pickUp();
            mech.grabRange = 0
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
            mech.grabRange = 0
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "standing wave harmonics",
      description: "oscillating <strong>shields</strong> surround you <strong>constantly</strong><br> <strong>decreased</strong> <strong class='color-f'>energy</strong> regeneration",
      effect: () => {
        mech.fieldMode = 4;
        mech.fieldText();
        mech.setHoldDefaults();
        mech.fieldRegen *= 0.3;

        mech.hold = function () {
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight && mech.fieldMeter > 0.1)) { //not hold but field button is pressed
            mech.grabPowerUp();
            mech.lookForPickUp(180);
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle) { //holding, but field button is released
            mech.pickUp();
          } else {
            mech.holdingTarget = null; //clears holding target (this is so you only pick up right after the field button is released and a hold target exists)
          }
          if (mech.fieldMeter > 0.1) {
            const grabRange1 = 90 + 60 * Math.sin(mech.cycle / 23)
            const grabRange2 = 85 + 70 * Math.sin(mech.cycle / 37)
            const grabRange3 = 80 + 80 * Math.sin(mech.cycle / 47)
            const netGrabRange = Math.max(grabRange1, grabRange2, grabRange3)
            ctx.fillStyle = "rgba(110,170,200," + (0.04 + mech.fieldMeter * (0.12 + 0.13 * Math.random())) + ")";
            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, grabRange1, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, grabRange2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(mech.pos.x, mech.pos.y, grabRange3, 0, 2 * Math.PI);
            ctx.fill();
            mech.pushMobs360(netGrabRange);
            mech.pushBody360(netGrabRange);
          }
          mech.drawFieldMeter()
        }
      }
    },
    {
      name: "nano-scale manufacturing",
      description: "excess <strong class='color-f'>energy</strong> used to build <strong>drones</strong><br><strong>3x</strong> <strong class='color-f'>energy</strong> regeneration",
      effect: () => {
        let gunIndex = 13 //Math.random() < 0.5 ? 13 : 14
        mech.fieldMode = 5;
        mech.fieldText();
        mech.setHoldDefaults();
        mech.fieldRegen *= 3;
        mech.hold = function () {
          if (mech.fieldMeter === 1) {
            mech.fieldMeter -= 0.43;
            b.guns[gunIndex].fire() //spawn drone
            mech.fireCDcycle = mech.cycle + 25; // set fire cool down to prevent +energy from making huge numbers of drones
          }
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight && mech.fieldMeter > 0.1)) { //not hold but field button is pressed
            mech.pushMobsFacing();
            mech.pushBodyFacing();
            mech.drawField();
            mech.grabPowerUp();
            mech.lookForPickUp();
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
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
      description: "use <strong class='color-f'>energy</strong> to to become <strong>intangible</strong><br><em style='opacity: 0.6;'>can't see or be seen outside field</em>",
      effect: () => {
        mech.fieldMode = 6;
        mech.fieldText();
        mech.setHoldDefaults();
        // mech.grabRange = 230
        mech.hold = function () {
          mech.isStealth = false //isStealth is checked in mob foundPlayer()
          player.collisionFilter.mask = 0x010011 //0x010011 is normal
          if (mech.isHolding) {
            mech.drawHold(mech.holdingTarget);
            mech.holding();
            mech.throw();
          } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
            const DRAIN = 0.0015
            if (mech.fieldMeter > DRAIN) {
              mech.fieldMeter -= DRAIN;

              mech.isStealth = true //isStealth is checked in mob foundPlayer() 
              player.collisionFilter.mask = 0x000001 //0x010011 is normals

              ctx.beginPath();
              ctx.arc(mech.pos.x, mech.pos.y, mech.grabRange, 0, 2 * Math.PI);
              ctx.globalCompositeOperation = "destination-in"; //in or atop
              ctx.fillStyle = `rgba(255,255,255,${mech.fieldMeter*0.5})`;
              ctx.fill();
              ctx.globalCompositeOperation = "source-over";
              ctx.strokeStyle = "#000"
              ctx.lineWidth = 2;
              ctx.stroke();

              mech.grabPowerUp();
              mech.lookForPickUp(110);
            } else {
              mech.fieldCDcycle = mech.cycle + 120;
            }
          } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
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
    //     // mech.grabRange = 230
    //     mech.hold = function () {
    //       mech.isStealth = false //isStealth is checked in mob foundPlayer()
    //       player.collisionFilter.mask = 0x010011 //0x010011 is normal
    //       if (mech.isHolding) {
    //         mech.hackProgress = 0
    //         mech.drawHold(mech.holdingTarget);
    //         mech.holding();
    //         mech.throw();
    //       } else if ((keys[32] || game.mouseDownRight) && mech.fieldCDcycle < mech.cycle) {
    //         const DRAIN = 0.0005
    //         if (mech.fieldMeter > DRAIN) {
    //           mech.fieldMeter -= DRAIN;

    //           //try to hack a mob
    //           for (let i = 0, len = mob.length; i < len; ++i) {
    //             if (
    //               Matter.Vector.magnitude(Matter.Vector.sub(mob[i].position, this.pos)) < this.grabRange &&
    //               this.lookingAt(mob[i]) &&
    //               Matter.Query.ray(map, mob[i].position, this.pos).length === 0
    //             ) {
    //               if (mech.hackProgress > 180) { //hack the mob
    //                 mech.fieldMeter = 0;
    //                 mob[i].hackedTarget = null;
    //                 mob[i].seePlayerFreq = Math.round((30 + 30 * Math.random()) * game.lookFreqScale)
    //                 mob[i].do = function () {
    //                   this.healthBar();
    //                   this.hacked();
    //                 }
    //               } else { //hold the mob still
    //                 mech.hackProgress++
    //                 range = this.grabRange * 0.9
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
    //       } else if (mech.holdingTarget && mech.fireCDcycle < mech.cycle && mech.fieldMeter > 0.05) { //holding, but field button is released
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