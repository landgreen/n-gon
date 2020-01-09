let powerUp = [];

const powerUps = {
  choose(type, index) {
    if (type === "gun") {
      b.giveGuns(index)
      // game.replaceTextLog = true;
      // game.makeTextLog(`${game.SVGleftMouse} <strong style='font-size:30px;'>${b.guns[index].name}</strong><br><br>${b.guns[index].description}`, 500);
      // game.replaceTextLog = false;
    } else if (type === "field") {
      mech.setField(index)
    } else if (type === "mod") {
      b.giveMod(index)
      // game.replaceTextLog = true;
      // game.makeTextLog(`<div class="circle mod"></div> &nbsp; <strong style='font-size:30px;'>${b.mods[index].name}</strong><br><br> ${b.mods[index].description}`, 500);
      // game.replaceTextLog = false;
    }
    document.body.style.cursor = "none";
    document.getElementById("choose-grid").style.display = "none"
    document.getElementById("choose-background").style.display = "none"
    game.paused = false;
    game.isChoosing = false; //stops p from un pausing on key down
    requestAnimationFrame(cycle);
  },
  cancel() {
    document.body.style.cursor = "none";
    document.getElementById("choose-grid").style.display = "none"
    document.getElementById("choose-background").style.display = "none"
    game.paused = false;
    game.isChoosing = false; //stops p from un pausing on key down
    requestAnimationFrame(cycle);
  },
  showDraft() {
    document.getElementById("choose-grid").style.display = "grid"
    document.getElementById("choose-background").style.display = "inline"
    document.body.style.cursor = "auto";
    game.paused = true;
    game.isChoosing = true; //stops p from un pausing on key down
  },
  heal: {
    name: "heal",
    color: "#0eb",
    size() {
      return 40 * Math.sqrt(0.1 + Math.random() * 0.5);
    },
    effect() {
      let heal = 0
      for (let i = 0; i < b.modRecursiveHealing; i++) heal += ((this.size / 40) ** 2)
      if (heal > 0) game.makeTextLog("<div class='circle heal'></div> &nbsp; <span style='font-size:115%;'> <strong style = 'letter-spacing: 2px;'>heal</strong>  " + (Math.min(mech.maxHealth - mech.health, heal) * game.healScale * 100).toFixed(0) + "%</span>", 300)
      mech.addHealth(heal);
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
        let ammo = Math.ceil((target.ammoPack * (1 + 0.1 * Math.random())));
        if (level.isBuildRun) ammo = Math.floor(ammo * 1.1) //extra ammo on build run because no ammo from getting a new gun
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
      function doNotHave(who, skip1 = -1, skip2 = -1, skip3 = -1) {
        let options = [];
        for (let i = 1; i < who.length; i++) {
          if (i !== mech.fieldMode && i !== skip1 && i !== skip2 && i !== skip3) options.push(i);
        }
        if (options.length > 0) return options[Math.floor(Math.random() * options.length)]
      }

      let choice1 = doNotHave(mech.fieldUpgrades)
      let choice2 = doNotHave(mech.fieldUpgrades, choice1)
      let choice3 = -1
      if (choice1 > -1) {
        let text = `<div class='cancel' onclick='powerUps.cancel()'>✕</div><h3 style = 'color:#fff; text-align:left; margin: 0px;'>choose a field</h3>`
        text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice1})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice1].name}</div> ${mech.fieldUpgrades[choice1].description}</div>`
        if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice2})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice2].name}</div> ${mech.fieldUpgrades[choice2].description}</div>`
        if (!b.isModBayesian) {
          choice3 = doNotHave(mech.fieldUpgrades, choice1, choice2)
          if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice3})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice3].name}</div> ${mech.fieldUpgrades[choice3].description}</div>`
        }
        if (b.isModFourOptions) {
          let choice4 = doNotHave(mech.fieldUpgrades, choice1, choice2, choice3)
          if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice4})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice4].name}</div> ${mech.fieldUpgrades[choice4].description}</div>`
        }
        // text += `<div style = 'color:#fff'>${game.SVGrightMouse} activate the shield with the right mouse<br>fields shield you from damage <br>and let you pick up and throw blocks</div>`
        document.getElementById("choose-grid").innerHTML = text
        powerUps.showDraft();
      } else {
        powerUps.giveRandomAmmo()
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
      function doNotHave(who, skip1 = -1, skip2 = -1, skip3 = -1) {
        let options = [];
        for (let i = 0; i < who.length; i++) {
          if (who[i].count < who[i].maxCount && i !== skip1 && i !== skip2 && i !== skip3) options.push(i);
        }
        if (options.length > 0) return options[Math.floor(Math.random() * options.length)]
      }

      let choice1 = doNotHave(b.mods)
      let choice2 = doNotHave(b.mods, choice1)
      let choice3 = -1
      if (choice1 > -1) {
        let text = "<div class='cancel' onclick='powerUps.cancel()'>✕</div><h3 style = 'color:#fff; text-align:left; margin: 0px;'>choose a mod</h3>"
        text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice1})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${b.mods[choice1].name}</div> ${b.mods[choice1].description}</div>`
        if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice2})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${b.mods[choice2].name}</div> ${b.mods[choice2].description}</div>`
        if (!b.isModBayesian) {
          choice3 = doNotHave(b.mods, choice1, choice2)
          if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice3})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${b.mods[choice3].name}</div> ${b.mods[choice3].description}</div>`
        }
        if (b.isModFourOptions) {
          let choice4 = doNotHave(b.mods, choice1, choice2, choice3)
          if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice4})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${b.mods[choice4].name}</div> ${b.mods[choice4].description}</div>`
        }
        document.getElementById("choose-grid").innerHTML = text
        powerUps.showDraft();
      } else {
        powerUps.giveRandomAmmo()
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
      function doNotHave(who, skip1 = -1, skip2 = -1, skip3 = -1) {
        let options = [];
        for (let i = 0; i < who.length; i++) {
          if (!who[i].have && i !== skip1 && i !== skip2 && i !== skip3) options.push(i);
        }
        if (options.length > 0) return options[Math.floor(Math.random() * options.length)]
      }

      let choice1 = doNotHave(b.guns)
      let choice2 = doNotHave(b.guns, choice1)
      let choice3 = -1
      if (choice1 > -1) {
        let text = "<div class='cancel' onclick='powerUps.cancel()'>✕</div><h3 style = 'color:#fff; text-align:left; margin: 0px;'>choose a gun</h3>"
        text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice1})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice1].name}</div> ${b.guns[choice1].description}</div>`
        if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice2})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice2].name}</div> ${b.guns[choice2].description}</div>`
        if (!b.isModBayesian) {
          choice3 = doNotHave(b.guns, choice1, choice2)
          if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice3})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice3].name}</div> ${b.guns[choice3].description}</div>`
        }
        if (b.isModFourOptions) {
          let choice4 = doNotHave(b.guns, choice1, choice2, choice3)
          if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice4})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice4].name}</div> ${b.guns[choice4].description}</div>`
        }
        document.getElementById("choose-grid").innerHTML = text
        powerUps.showDraft();
      } else {
        powerUps.giveRandomAmmo()
      }
    }
  },
  giveRandomAmmo() {
    const ammoTarget = Math.floor(Math.random() * (b.guns.length));
    const ammo = Math.ceil(b.guns[ammoTarget].ammoPack * 6);
    b.guns[ammoTarget].ammo += ammo;
    game.updateGunHUD();
    game.makeTextLog("<span style='font-size:110%;'>+" + ammo + " ammo for " + b.guns[ammoTarget].name + "</span>", 300);
  },
  spawnRandomPowerUp(x, y) { //mostly used after mob dies 
    if (Math.random() * Math.random() - 0.3 > Math.sqrt(mech.health) || Math.random() < 0.035) { //spawn heal chance is higher at low health
      powerUps.spawn(x, y, "heal");
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "heal");
      return;
    }
    if (Math.random() < 0.15 && b.inventory.length > 0) {
      powerUps.spawn(x, y, "ammo");
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "ammo");
      return;
    }
    if (Math.random() < 0.0035 * (3 - b.inventory.length)) { //a new gun has a low chance for each not acquired gun up to 4
      powerUps.spawn(x, y, "gun");
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "gun");
      return;
    }
    if (Math.random() < 0.0032 * (10 - b.modCount)) { //a new mod has a low chance for each not acquired mod up to 7
      powerUps.spawn(x, y, "mod");
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "mod");
      return;
    }
    if (Math.random() < 0.003) {
      powerUps.spawn(x, y, "field");
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "field");
      return;
    }
  },
  spawnBossPowerUp(x, y) { //boss spawns field and gun mod upgrades
    if (mech.fieldMode === 0) {
      powerUps.spawn(x, y, "field")
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "field")
    } else if (Math.random() < 0.6) {
      powerUps.spawn(x, y, "mod")
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "mod")
    } else if (Math.random() < 0.1) {
      powerUps.spawn(x, y, "gun")
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "gun")
    } else if (Math.random() < 0.1) {
      powerUps.spawn(x, y, "field");
      if (Math.random() < b.isModBayesian) powerUps.spawn(x, y, "field");
    } else if (mech.health < 0.65) {
      powerUps.spawn(x, y, "heal");
      powerUps.spawn(x, y, "heal");
      powerUps.spawn(x, y, "heal");
      if (Math.random() < b.isModBayesian) {
        powerUps.spawn(x, y, "heal");
      }
    } else {
      powerUps.spawn(x, y, "ammo");
      powerUps.spawn(x, y, "ammo");
      powerUps.spawn(x, y, "ammo");
      if (Math.random() < b.isModBayesian) {
        powerUps.spawn(x, y, "ammo");
      }
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
    if (b.modCount < 1) {
      powerUps.spawn(x, y, "mod", false); //starting gun
    } else if (b.inventory.length < 2) {
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
        // console.log(mode)
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