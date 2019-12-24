let powerUp = [];

const powerUps = {
  heal: {
    name: "heal",
    color: "#0eb",
    size() {
      return 40 * Math.sqrt(0.1 + Math.random() * 0.5);
    },
    effect() {
      let heal = (this.size / 40) ** 2
      heal = Math.min(mech.maxHealth - mech.health, heal)
      if (b.isModFullHeal) heal = mech.maxHealth
      mech.addHealth(heal);
      if (heal > 0) game.makeTextLog("<div class='circle heal'></div> &nbsp; <span style='font-size:115%;'> <strong style = 'letter-spacing: 2px;'>heal</strong>  " + (heal * 100).toFixed(0) + "%</span>", 300)
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
        mech.fieldMeter = mech.fieldEnergyMax;
        if (!game.lastLogTime) game.makeTextLog("<span style='font-size:115%;'><span class='color-f'>+energy</span></span>", 300);
      } else {
        //ammo given scales as mobs take more hits to kill
        let ammo = Math.ceil((target.ammoPack * (0.45 + 0.06 * Math.random())) / Math.sqrt(b.dmgScale));
        if (level.isBuildRun) ammo = Math.floor(ammo * 1.2)
        target.ammo += ammo;
        game.updateGunHUD();
        game.makeTextLog("<div class='circle gun'></div> &nbsp; <span style='font-size:110%;'>+" + ammo + " ammo for " + target.name + "</span>", 300);
      }
    }
  },
  field: {
    name: "field",
    color: "#0cf",
    size() {
      return 45;
    },
    effect() {
      const previousMode = mech.fieldMode
      if (this.mode) { //this.mode is set if the power up has been ejected from player
        mech.fieldUpgrades[this.mode].effect(); //set a predetermined power up
      } else { //choose a random mode that you don't already have
        availableModes = []
        for (let i = 1; i < mech.fieldUpgrades.length; i++) { //start on 1 to skip the default field
          if (i !== previousMode) {
            availableModes.push(i)
          }
        }
        const mode = availableModes[Math.floor(Math.random() * availableModes.length)]
        mech.fieldUpgrades[mode].effect();
      }
      //pop the old field out in case player wants to swap back
      if (previousMode !== 0) {
        mech.fieldCDcycle = mech.cycle + 40; //trigger fieldCD to stop power up grab automatic pick up of spawn
        setTimeout(function () {
          powerUps.spawn(mech.pos.x, mech.pos.y - 15, "field", false, previousMode);
        }, 100);

      }
    }
  },
  mod: {
    name: "mod",
    color: "#a8f",
    size() {
      return 42;
    },
    effect() {
      //find what mods I don't have
      let options = [];
      for (let i = 0; i < b.mods.length; i++) {
        if (!b.mods[i].have) options.push(i);
      }
      //give a random mod from the mods I don't have
      if (options.length > 0) {
        let newMod = options[Math.floor(Math.random() * options.length)]
        b.giveMod(newMod)
        game.replaceTextLog = true;
        game.makeTextLog(`<div class="circle mod"></div> &nbsp; <strong style='font-size:30px;'>${b.mods[newMod].name}</strong><br><br> ${b.mods[newMod].description}`, 1000);
        game.replaceTextLog = false;
      }
    }
  },
  gun: {
    name: "gun",
    color: "#26a",
    size() {
      return 35;
    },
    effect() {
      //find what guns I don't have
      let options = [];
      if (b.activeGun === null && game.difficulty < 3) {
        //choose the first gun to be one that is good for the early game
        for (let i = 0; i < b.guns.length; ++i) {
          if (!b.guns[i].have && b.guns[i].isStarterGun) options.push(i);
        }
      } else {
        //choose a gun you don't have
        for (let i = 0; i < b.guns.length; ++i) {
          if (!b.guns[i].have) options.push(i);
        }
      }
      //give player a gun they don't already have if possible
      game.replaceTextLog = true;
      if (options.length > 0) {
        let newGun = options[Math.floor(Math.random() * options.length)];
        if (b.activeGun === null) b.activeGun = newGun //if no active gun switch to new gun
        game.makeTextLog(`${game.SVGleftMouse} <strong style='font-size:30px;'>${b.guns[newGun].name}</strong><br><br>${b.guns[newGun].description}`, 900);
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
        game.makeTextLog("<span style='font-size:110%;'>+" + ammo + " ammo for " + b.guns[ammoTarget].name + "</span>", 300);
      }
      game.replaceTextLog = false
    }
  },
  spawnRandomPowerUp(x, y) { //mostly used after mob dies 
    if (Math.random() * Math.random() - 0.25 > Math.sqrt(mech.health) || Math.random() < 0.04) { //spawn heal chance is higher at low health
      powerUps.spawn(x, y, "heal");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "heal");
      return;
    }
    if (Math.random() < 0.2 && b.inventory.length > 0) {
      powerUps.spawn(x, y, "ammo");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "ammo");
      return;
    }
    if (Math.random() < 0.004 * (4 - b.inventory.length)) { //a new gun has a low chance for each not acquired gun to drop
      powerUps.spawn(x, y, "gun");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "gun");
      return;
    }
    if (Math.random() < 0.0035 * (7 - b.modCount)) {
      powerUps.spawn(x, y, "mod");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "mod");
      return;
    }
    if (Math.random() < 0.005) {
      powerUps.spawn(x, y, "field");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "field");
      return;
    }
  },
  spawnBossPowerUp(x, y) { //boss spawns field and gun mod upgrades
    if (mech.fieldMode === 0) {
      powerUps.spawn(x, y, "field")
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "field")
    } else if (Math.random() < 0.27) {
      powerUps.spawn(x, y, "mod")
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "mod")
    } else if (Math.random() < 0.27) {
      powerUps.spawn(x, y, "field");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "field");
    } else if (Math.random() < 0.27) {
      powerUps.spawn(x, y, "gun")
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "gun")
    } else if (mech.health < 0.6) {
      powerUps.spawn(x, y, "heal");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "heal");
    } else {
      powerUps.spawn(x, y, "ammo");
      if (Math.random() < b.modMoreDrops) powerUps.spawn(x, y, "ammo");
    }
  },
  chooseRandomPowerUp(x, y) { //100% chance to drop a random power up    //used in spawn.debris
    if (Math.random() < 0.5) {
      powerUps.spawn(x, y, "heal", false);
    } else {
      powerUps.spawn(x, y, "ammo", false);
    }
  },
  spawnStartingPowerUps(x, y) { //used for map specific power ups, mostly to give player a starting gun
    if (b.inventory.length < 2 || game.isEasyMode) {
      powerUps.spawn(x, y, "gun", false); //starting gun
    } else {
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
    }
  },
  spawn(x, y, target, moving = true, mode = null) {
    if (!level.isBuildRun || target === "heal" || target === "ammo") {
      let index = powerUp.length;
      target = powerUps[target];
      size = target.size();
      powerUp[index] = Matter.Bodies.polygon(x, y, 0, size, {
        density: 0.001,
        frictionAir: 0.01,
        restitution: 0.8,
        inertia: Infinity, //prevents rotation
        collisionFilter: {
          group: 0,
          category: cat.powerUp,
          mask: cat.map | cat.powerUp
        },
        color: target.color,
        effect: target.effect,
        name: target.name,
        size: size
      });
      if (mode) {
        console.log(mode)
        powerUp[index].mode = mode
      }
      if (moving) {
        Matter.Body.setVelocity(powerUp[index], {
          x: (Math.random() - 0.5) * 15,
          y: Math.random() * -9 - 3
        });
      }
      World.add(engine.world, powerUp[index]); //add to world
    }
  },
};