let powerUp = [];

const powerUps = {
  heal: {
    name: "heal",
    color: "#0f9",
    size() {
      return 40 * Math.sqrt(0.1 + Math.random() * 0.5);
    },
    effect() {
      let heal = (this.size / 40) ** 2
      heal = Math.min(1 - mech.health, heal)
      mech.addHealth(heal);
      if (!game.lastLogTime && heal > 0) game.makeTextLog('heal for ' + (heal * 100).toFixed(0) + '%', 180)
    }
  },
  field: {
    name: "field",
    color: "#f9f",
    size() {
      return 40;
    },
    effect() {
      const previousMode = mech.fieldMode

      if (!this.mode) { //this.mode is set if the power up has been ejected from player
        mode = mech.fieldMode
        while (mode === mech.fieldMode) {
          mode = Math.ceil(Math.random() * (mech.fieldUpgrades.length - 1))
        }
        mech.fieldUpgrades[mode](); //choose random field upgrade that you don't already have
      } else {
        mech.fieldUpgrades[this.mode](); //set a predetermined power up
      }
      //pop the old field out in case player wants to swap back
      if (previousMode !== 0) {
        mech.fieldCDcycle = mech.cycle + 40; //trigger fieldCD to stop power up grab automatic pick up of spawn
        powerUps.spawn(mech.pos.x, mech.pos.y - 15, "field", false, previousMode);
      }
    }
  },
  mod: {
    name: "mod",
    color: "#479",
    size() {
      return 42;
    },
    effect() {
      const previousMode = b.mod

      if (this.mode === null) { //this.mode is set if the power up has been ejected from player
        mode = b.mod //start with current mob
        while (mode === b.mod) {
          mode = Math.floor(Math.random() * b.mods.length)
        }
        b.mods[mode](); //choose random upgrade that you don't already have
      } else {
        b.mods[this.mode](); //set a predetermined power up
      }
      if (previousMode != null) { //pop the old field out in case player wants to swap back
        mech.fieldCDcycle = mech.cycle + 40; //trigger fieldCD to stop power up grab automatic pick up of spawn
        powerUps.spawn(mech.pos.x, mech.pos.y - 15, "mod", false, previousMode);
      }
    }
  },
  ammo: {
    name: "ammo",
    color: "#467",
    size() {
      return 17;
    },
    effect() {
      //only get ammo for guns player has
      let target;
      // console.log(b.inventory.length)
      if (b.inventory.length > 0) {
        //add ammo to a gun in inventory
        target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]];
        //try 3 more times to give ammo to a gun with ammo, not Infinity
        if (target.ammo === Infinity) {
          target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]]
          if (target.ammo === Infinity) {
            target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]]
            if (target.ammo === Infinity) target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]]
          }
        }
      } else {
        //if you don't have any guns just add ammo to a random gun you don't have yet
        target = b.guns[Math.floor(Math.random() * b.guns.length)];
      }
      if (target.ammo === Infinity) {
        mech.fieldMeter = 1;
        if (!game.lastLogTime) game.makeTextLog("+energy", 180);
      } else {
        //ammo given scales as mobs take more hits to kill
        const ammo = Math.ceil((target.ammoPack * (0.6 + 0.05 * Math.random())) / b.dmgScale);
        target.ammo += ammo;
        game.updateGunHUD();
        if (!game.lastLogTime) game.makeTextLog("+" + ammo + " ammo: " + target.name, 180);
      }
    }
  },
  gun: {
    name: "gun",
    color: "#0cf",
    size() {
      return 30;
    },
    effect() {
      //find what guns I don't have
      let options = [];
      for (let i = 0; i < b.guns.length; ++i) {
        if (!b.guns[i].have) options.push(i);
      }
      //give player a gun they don't already have if possible
      if (options.length > 0) {
        let newGun = options[Math.floor(Math.random() * options.length)];
        // newGun = 4; //makes every gun you pick up this type  //enable for testing one gun
        if (b.activeGun === null) {
          b.activeGun = newGun //if no active gun switch to new gun
          game.makeTextLog(
            // "<br><br><br><br><div class='wrapper'> <div class = 'grid-box'><strong>left mouse</strong>: fire weapon</div> <div class = 'grid-box'> <span class = 'mouse'>️<span class='mouse-line'></span></span> </div></div>",
            "Use <strong>left mouse</strong> to fire weapon.",
            Infinity
          );
        }
        if (b.inventory.length === 1) { //on the second gun pick up tell player how to change guns
          game.makeTextLog(`<strong style='font-size:30px;'>${b.guns[newGun].name}</strong><br>(left click)<br>(<strong>Q</strong>, <strong>E</strong>, and <strong>mouse wheel</strong> change weapons)<p>${b.guns[newGun].description}</p>`, 1000);
        } else {
          game.makeTextLog(`<strong style='font-size:30px;'>${b.guns[newGun].name}</strong><br> (left click)<p>${b.guns[newGun].description}</p>`, 1000);
        }
        b.guns[newGun].have = true;
        b.inventory.push(newGun);
        b.guns[newGun].ammo += b.guns[newGun].ammoPack * 2;
        game.makeGunHUD();
      } else {
        //if you have all guns then get ammo
        const ammoTarget = Math.floor(Math.random() * (b.guns.length));
        const ammo = Math.ceil(b.guns[ammoTarget].ammoPack * 2);
        b.guns[ammoTarget].ammo += ammo;
        game.updateGunHUD();
        game.makeTextLog("+" + ammo + " ammo: " + b.guns[ammoTarget].name, 180);
      }
    }
  },
  spawnRandomPowerUp(x, y) { //mostly used after mob dies 
    if (Math.random() * Math.random() - 0.25 > Math.sqrt(mech.health) || Math.random() < 0.04) { //spawn heal chance is higher at low health
      powerUps.spawn(x, y, "heal");
      return;
    }
    if (Math.random() < 0.19) {
      if (b.inventory.length > 0) powerUps.spawn(x, y, "ammo");
      return;
    }
    if (Math.random() < 0.004 * (5 - b.inventory.length)) { //a new gun has a low chance for each not acquired gun to drop
      powerUps.spawn(x, y, "gun");
      return;
    }
    if (Math.random() < 0.005) {
      powerUps.spawn(x, y, "field");
      return;
    }
    if (Math.random() < 0.005) {
      powerUps.spawn(x, y, "mod");
      return;
    }
  },
  spawnBossPowerUp(x, y) { //boss spawns field and gun mod upgrades
    if (mech.fieldMode === 0) {
      powerUps.spawn(x, y, "field")
    } else if (b.mod === null) {
      powerUps.spawn(x, y, "mod")
    } else if (Math.random() < 0.2) {
      powerUps.spawn(x, y, "mod")
    } else if (Math.random() < 0.2) {
      powerUps.spawn(x, y, "field");
    } else if (Math.random() < 0.15) {
      powerUps.spawn(x, y, "gun")
    } else if (mech.health < 0.5) {
      powerUps.spawn(x, y, "heal");
    } else {
      powerUps.spawn(x, y, "ammo");
    }
  },
  chooseRandomPowerUp(x, y) { //100% chance to drop a random power up    //used in spawn.debris
    if (Math.random() < 0.5) {
      powerUps.spawn(x, y, "heal", false);
    } else {
      powerUps.spawn(x, y, "ammo", false);
    }
  },
  spawnStartingPowerUps(x, y) {
    if (b.inventory.length < 2) {
      powerUps.spawn(x, y, "gun", false); //starting gun
    } else {
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
    }
  },
  spawn(x, y, target, moving = true, mode = null) {
    let i = powerUp.length;
    target = powerUps[target];
    size = target.size();
    powerUp[i] = Matter.Bodies.polygon(x, y, 0, size, {
      density: 0.001,
      frictionAir: 0.01,
      restitution: 0.8,
      inertia: Infinity, //prevents rotation
      collisionFilter: {
        group: 0,
        category: 0x100000,
        mask: 0x100001
      },
      color: target.color,
      effect: target.effect,
      mode: mode,
      name: target.name,
      size: size
    });
    if (moving) {
      Matter.Body.setVelocity(powerUp[i], {
        x: (Math.random() - 0.5) * 15,
        y: Math.random() * -9 - 3
      });
    }
    World.add(engine.world, powerUp[i]); //add to world
  },
  attractionLoop() {
    for (let i = 0, len = powerUp.length; i < len; ++i) {
      const dxP = player.position.x - powerUp[i].position.x;
      const dyP = player.position.y - powerUp[i].position.y;
      const dist2 = dxP * dxP + dyP * dyP;
      //gravitation for pickup
      if (dist2 < 100000 && (powerUp[i].name != "heal" || mech.health < 1)) {
        if (dist2 < 2000) {
          //knock back from grabbing power up
          Matter.Body.setVelocity(player, {
            x: player.velocity.x + ((powerUp[i].velocity.x * powerUp[i].mass) / player.mass) * 0.25,
            y: player.velocity.y + ((powerUp[i].velocity.y * powerUp[i].mass) / player.mass) * 0.25
          });
          mech.usePowerUp(i);
          break;
        }
        //power up needs to be able to see player to gravitate
        if (Matter.Query.ray(map, powerUp[i].position, player.position).length === 0) { // && Matter.Query.ray(body, powerUp[i].position, player.position).length === 0
          //extra friction
          Matter.Body.setVelocity(powerUp[i], {
            x: powerUp[i].velocity.x * 0.97,
            y: powerUp[i].velocity.y * 0.97
          });
          //float towards player
          powerUp[i].force.x += (dxP / dist2) * powerUp[i].mass * 1.6;
          powerUp[i].force.y += (dyP / dist2) * powerUp[i].mass * 1.6 - powerUp[i].mass * game.g; //negate gravity
          //draw the pulling effect
          ctx.globalAlpha = 0.2;
          mech.drawHold(powerUp[i], false);
          ctx.globalAlpha = 1;
        }
      }
    }
  }
};