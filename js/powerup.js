let powerUp = [];

const powerUps = {
  totalPowerUps: 0, //used for mods that count power ups at the end of a level
  choose(type, index) {
    if (type === "gun") {
      b.giveGuns(index)
      // game.replaceTextLog = true;
      // game.makeTextLog(`${game.SVGleftMouse} <strong style='font-size:30px;'>${b.guns[index].name}</strong><br><br>${b.guns[index].description}`, 500);
      // game.replaceTextLog = false;
    } else if (type === "field") {
      mech.setField(index)
      // game.replaceTextLog = true;
      // game.makeTextLog(`${game.SVGrightMouse}<strong style='font-size:30px;'> ${mech.fieldUpgrades[mech.fieldMode].name}</strong><br><span class='faded'></span><br>${mech.fieldUpgrades[mech.fieldMode].description}`, 600);
      // game.replaceTextLog = false;
    } else if (type === "mod") {
      mod.giveMod(index)
      // game.replaceTextLog = true;
      // game.makeTextLog(`<div class="circle mod"></div> &nbsp; <strong style='font-size:30px;'>${mod.mods[index].name}</strong><br><br> ${mod.mods[index].description}`, 500);
      // game.replaceTextLog = false;
    }
    powerUps.endDraft();
  },
  endDraft() {
    if (mod.manyWorlds && powerUps.reroll.rerolls < 1) {
      powerUps.spawn(mech.pos.x, mech.pos.y, "reroll");
      if (Math.random() < mod.bayesian) powerUps.spawn(mech.pos.x, mech.pos.y, "reroll");
    }
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
  reroll: {
    rerolls: 0,
    name: "reroll",
    color: "#f7b",
    size() {
      return 20;
    },
    effect() {
      powerUps.reroll.changeRerolls(1)
      game.makeTextLog("<div class='circle reroll'></div> &nbsp; <span style='font-size:115%;'> <strong>+1 reroll</strong></span>", 300)
    },
    changeRerolls(amount) {
      powerUps.reroll.rerolls += amount
      if (powerUps.reroll.rerolls < 0) powerUps.reroll.rerolls = 0

      if (mod.isRerollBots) {
        const limit = 3
        for (; powerUps.reroll.rerolls > limit - 1; powerUps.reroll.rerolls -= limit) {
          b.randomBot()
        }
      }
      if (mod.isDeathAvoid && document.getElementById("mod-anthropic")) {
        document.getElementById("mod-anthropic").innerHTML = `(${powerUps.reroll.rerolls})`
      }
      if (mod.isRerollHaste) {
        if (powerUps.reroll.rerolls === 0) {
          mod.rerollHaste = 0.66;
          b.setFireCD();
        } else {
          mod.rerollHaste = 1;
          b.setFireCD();
        }
      }
    },
    diceText() {
      const r = powerUps.reroll.rerolls
      const fullDice = Math.floor(r / 6)
      const lastDice = r % 6
      let out = ''
      for (let i = 0; i < fullDice; i++) {
        out += '⚅'
      }
      if (lastDice === 1) {
        out += '⚀'
      } else if (lastDice === 2) {
        out += '⚁'
      } else if (lastDice === 3) {
        out += '⚂'
      } else if (lastDice === 4) {
        out += '⚃'
      } else if (lastDice === 5) {
        out += '⚄'
      }
      return out
    },
    use(type) { //runs when you actually reroll a list of selections, type can be field, gun, or mod
      powerUps.reroll.changeRerolls(-1)
      powerUps[type].effect();
    },
  },
  heal: {
    name: "heal",
    color: "#0eb",
    size() {
      return 40 * Math.sqrt(0.1 + Math.random() * 0.5);
    },
    effect() {
      if (!mod.isEnergyHealth && mech.alive) {
        let heal = 0
        for (let i = 0; i < mod.recursiveHealing; i++) heal += ((this.size / 40) ** 2)
        if (heal > 0) {
          game.makeTextLog("<div class='circle heal'></div> &nbsp; <span style='font-size:115%;'> <strong style = 'letter-spacing: 2px;'>heal</strong>  " + (Math.min(mech.maxHealth - mech.health, heal) * game.healScale * 100).toFixed(0) + "%</span>", 300)
          mech.addHealth(heal);
        }
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
      if (b.inventory.length > 0) {
        if (mod.isAmmoForGun) {
          target = b.guns[b.activeGun];
        } else {
          //find a gun in your inventory
          target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]];
          //try 3 more times to give ammo to a gun with ammo, not Infinity
          if (target.ammo === Infinity) {
            target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]]
            if (target.ammo === Infinity) {
              target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]]
              if (target.ammo === Infinity) target = b.guns[b.inventory[Math.floor(Math.random() * (b.inventory.length))]]
            }
          }
        }
        //give ammo
        if (target.ammo === Infinity) {
          if (mech.energy < mech.maxEnergy) mech.energy = mech.maxEnergy;
          if (!game.lastLogTime) game.makeTextLog("<span style='font-size:115%;'><span class='color-f'>+energy</span></span>", 300);
        } else {
          let ammo = Math.ceil((target.ammoPack * (0.8 + 0.25 * Math.random())));
          // if (level.isBuildRun) ammo = Math.floor(ammo * 1.1) //extra ammo on build run because no ammo from getting a new gun
          target.ammo += ammo;
          game.updateGunHUD();
          game.makeTextLog("<div class='circle gun'></div> &nbsp; <span style='font-size:110%;'>+" + ammo + " ammo for " + target.name + "</span>", 300);
        }
      } else {
        // target = b.guns[Math.floor(Math.random() * b.guns.length)];         //if you don't have any guns just add ammo to a random gun you don't have yet
        if (mech.energy < mech.maxEnergy) mech.energy = mech.maxEnergy;
        if (!game.lastLogTime) game.makeTextLog("<span style='font-size:115%;'><span class='color-f'>+energy</span></span>", 300);
      }
    }
  },
  field: {
    name: "field",
    color: "#0cf",
    size() {
      return 45;
    },
    choiceLog: [], //records all previous choice options
    effect() {
      function pick(who, skip1 = -1, skip2 = -1, skip3 = -1, skip4 = -1) {
        let options = [];
        for (let i = 1; i < who.length; i++) {
          if (i !== mech.fieldMode && (!game.isEasyToAimMode || mech.fieldUpgrades[i].isEasyToAim) && i !== skip1 && i !== skip2 && i !== skip3 && i !== skip4) options.push(i);
        }
        //remove repeats from last selection
        const totalChoices = mod.isDeterminism ? 1 : 3 + mod.isExtraChoice * 2
        if (powerUps.field.choiceLog.length > totalChoices || powerUps.field.choiceLog.length === totalChoices) { //make sure this isn't the first time getting a power up and there are previous choices to remove
          for (let i = 0; i < totalChoices; i++) { //repeat for each choice from the last selection
            if (options.length > totalChoices) {
              for (let j = 0, len = options.length; j < len; j++) {
                if (powerUps.field.choiceLog[powerUps.field.choiceLog.length - 1 - i] === options[j]) {
                  options.splice(j, 1) //remove previous choice from option pool
                  break
                }
              }
            }
          }
        }
        if (options.length > 0) {
          return options[Math.floor(Math.random() * options.length)]
        }
      }

      let choice1 = pick(mech.fieldUpgrades)
      let choice2 = -1
      let choice3 = -1
      if (choice1 > -1) {
        let text = `<div class='cancel' onclick='powerUps.endDraft()'>✕</div><h3 style = 'color:#fff; text-align:left; margin: 0px;'>choose a field</h3>`
        text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice1})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice1].name}</div> ${mech.fieldUpgrades[choice1].description}</div>`
        if (!mod.isDeterminism) {
          choice2 = pick(mech.fieldUpgrades, choice1)
          if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice2})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice2].name}</div> ${mech.fieldUpgrades[choice2].description}</div>`
          choice3 = pick(mech.fieldUpgrades, choice1, choice2)
          if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice3})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice3].name}</div> ${mech.fieldUpgrades[choice3].description}</div>`
        }
        if (mod.isExtraChoice) {
          let choice4 = pick(mech.fieldUpgrades, choice1, choice2, choice3)
          if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice4})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice4].name}</div> ${mech.fieldUpgrades[choice4].description}</div>`
          let choice5 = pick(mech.fieldUpgrades, choice1, choice2, choice3, choice4)
          if (choice5 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choice5})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[choice5].name}</div> ${mech.fieldUpgrades[choice5].description}</div>`
          powerUps.field.choiceLog.push(choice4)
          powerUps.field.choiceLog.push(choice5)
        }
        powerUps.field.choiceLog.push(choice1)
        powerUps.field.choiceLog.push(choice2)
        powerUps.field.choiceLog.push(choice3)

        if (powerUps.reroll.rerolls) text += `<div class="choose-grid-module" onclick="powerUps.reroll.use('field')"><div class="grid-title"><div class="circle-grid reroll"></div> &nbsp; reroll <span class='dice'>${powerUps.reroll.diceText()}</span></div></div>`

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
    color: "hsl(246,100%,77%)", //"#a8f",
    size() {
      return 42;
    },
    choiceLog: [], //records all previous choice options
    effect() {

      function pick(skip1 = -1, skip2 = -1, skip3 = -1, skip4 = -1) {
        let options = [];
        for (let i = 0; i < mod.mods.length; i++) {
          if (mod.mods[i].count < mod.mods[i].maxCount && i !== skip1 && i !== skip2 && i !== skip3 && i !== skip4 && mod.mods[i].allowed()) {
            options.push(i);
          }
        }
        //remove repeats from last selection
        const totalChoices = mod.isDeterminism ? 1 : 3 + mod.isExtraChoice * 2
        if (powerUps.mod.choiceLog.length > totalChoices || powerUps.mod.choiceLog.length === totalChoices) { //make sure this isn't the first time getting a power up and there are previous choices to remove
          for (let i = 0; i < totalChoices; i++) { //repeat for each choice from the last selection
            if (options.length > totalChoices) {
              for (let j = 0, len = options.length; j < len; j++) {
                if (powerUps.mod.choiceLog[powerUps.mod.choiceLog.length - 1 - i] === options[j]) {
                  options.splice(j, 1) //remove previous choice from option pool
                  break
                }
              }
            }
          }
        }

        if (options.length > 0) {
          const choose = options[Math.floor(Math.random() * options.length)]
          text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choose})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[choose].name}</div> ${mod.mods[choose].description}</div>`
          return choose
        }

      }
      let text = `<div class='cancel' onclick='powerUps.endDraft()'>✕</div><h3 style = 'color:#fff; text-align:left; margin: 0px;'>choose a mod</h3>`
      let choice1 = pick()
      let choice2 = -1
      let choice3 = -1
      if (choice1 > -1) {
        if (!mod.isDeterminism) {
          choice2 = pick(choice1)
          // if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice2})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[choice2].name}</div> ${mod.mods[choice2].description}</div>`
          choice3 = pick(choice1, choice2)
          // if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice3})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[choice3].name}</div> ${mod.mods[choice3].description}</div>`
        }
        if (mod.isExtraChoice) {
          let choice4 = pick(choice1, choice2, choice3)
          // if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice4})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[choice4].name}</div> ${mod.mods[choice4].description}</div>`
          let choice5 = pick(choice1, choice2, choice3, choice4)
          // if (choice5 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('mod',${choice5})"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${mod.mods[choice5].name}</div> ${mod.mods[choice5].description}</div>`
          powerUps.mod.choiceLog.push(choice4)
          powerUps.mod.choiceLog.push(choice5)
        }
        powerUps.mod.choiceLog.push(choice1)
        powerUps.mod.choiceLog.push(choice2)
        powerUps.mod.choiceLog.push(choice3)
        if (powerUps.reroll.rerolls) text += `<div class="choose-grid-module" onclick="powerUps.reroll.use('mod')"><div class="grid-title"><div class="circle-grid reroll"></div> &nbsp; reroll <span class='dice'>${powerUps.reroll.diceText()}</span></div></div>`

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
    choiceLog: [], //records all previous choice options
    effect() {
      function pick(who, skip1 = -1, skip2 = -1, skip3 = -1, skip4 = -1) {
        let options = [];
        for (let i = 0; i < who.length; i++) {
          if (!who[i].have && (!game.isEasyToAimMode || b.guns[i].isEasyToAim) && i !== skip1 && i !== skip2 && i !== skip3 && i !== skip4) {
            options.push(i);
          }
        }

        //remove repeats from last selection
        const totalChoices = mod.isDeterminism ? 1 : 3 + mod.isExtraChoice * 2
        if (powerUps.gun.choiceLog.length > totalChoices || powerUps.gun.choiceLog.length === totalChoices) { //make sure this isn't the first time getting a power up and there are previous choices to remove
          for (let i = 0; i < totalChoices; i++) { //repeat for each choice from the last selection
            if (options.length > totalChoices) {
              for (let j = 0, len = options.length; j < len; j++) {
                if (powerUps.gun.choiceLog[powerUps.gun.choiceLog.length - 1 - i] === options[j]) {
                  options.splice(j, 1) //remove previous choice from option pool
                  break
                }
              }
            }
          }
        }
        if (options.length > 0) {
          return options[Math.floor(Math.random() * options.length)]
        }
      }

      let choice1 = pick(b.guns)
      let choice2 = -1
      let choice3 = -1
      if (choice1 > -1) {
        let text = `<div class='cancel' onclick='powerUps.endDraft()'>✕</div><h3 style = 'color:#fff; text-align:left; margin: 0px;'>choose a gun</h3>`
        text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice1})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice1].name}</div> ${b.guns[choice1].description}</div>`
        if (!mod.isDeterminism) {
          choice2 = pick(b.guns, choice1)
          if (choice2 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice2})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice2].name}</div> ${b.guns[choice2].description}</div>`
          choice3 = pick(b.guns, choice1, choice2)
          if (choice3 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice3})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice3].name}</div> ${b.guns[choice3].description}</div>`
        }
        if (mod.isExtraChoice) {
          let choice4 = pick(b.guns, choice1, choice2, choice3)
          if (choice4 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice4})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice4].name}</div> ${b.guns[choice4].description}</div>`
          let choice5 = pick(b.guns, choice1, choice2, choice3, choice4)
          if (choice5 > -1) text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choice5})">
          <div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choice5].name}</div> ${b.guns[choice5].description}</div>`
          powerUps.gun.choiceLog.push(choice4)
          powerUps.gun.choiceLog.push(choice5)
        }
        powerUps.gun.choiceLog.push(choice1)
        powerUps.gun.choiceLog.push(choice2)
        powerUps.gun.choiceLog.push(choice3)
        if (powerUps.reroll.rerolls) text += `<div class="choose-grid-module" onclick="powerUps.reroll.use('gun')"><div class="grid-title"><div class="circle-grid reroll"></div> &nbsp; reroll <span class='dice'>${powerUps.reroll.diceText()}</span></div></div>`

        // console.log(powerUps.gun.choiceLog)
        // console.log(choice1, choice2, choice3)

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
    if (ammo === Infinity) {
      b.guns[ammoTarget].ammo += ammo;
      game.makeTextLog("<span style='font-size:115%;'><span class='color-f'>+energy</span></span>", 300);
    } else {
      b.guns[ammoTarget].ammo += ammo;
      game.updateGunHUD();
      game.makeTextLog("<span style='font-size:110%;'>+" + ammo + " ammo for " + b.guns[ammoTarget].name + "</span>", 300);
    }
  },
  spawnRandomPowerUp(x, y) { //mostly used after mob dies 
    if ((Math.random() * Math.random() - 0.3 > Math.sqrt(mech.health) && !mod.isEnergyHealth) || Math.random() < 0.035) { //spawn heal chance is higher at low health
      powerUps.spawn(x, y, "heal");
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "heal");
      return;
    }
    if (Math.random() < 0.15 && b.inventory.length > 0 && !mod.bayesian) {
      powerUps.spawn(x, y, "ammo");
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "ammo");
      return;
    }
    if (Math.random() < 0.002 * (3 - b.inventory.length)) { //a new gun has a low chance for each not acquired gun up to 3
      powerUps.spawn(x, y, "gun");
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "gun");
      return;
    }
    if (Math.random() < 0.0027 * (15 - mod.totalCount)) { //a new mod has a low chance for each not acquired mod up to 15
      powerUps.spawn(x, y, "mod");
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "mod");
      return;
    }
    if (Math.random() < 0.006) {
      powerUps.spawn(x, y, "field");
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "field");
      return;
    }
    // if (Math.random() < 0.01) {
    //   powerUps.spawn(x, y, "reroll");
    //   if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "reroll");
    //   return;
    // }
  },
  randomPowerUpCounter: 0,
  spawnBossPowerUp(x, y) { //boss spawns field and gun mod upgrades

    if (game.difficultyMode < 2) { //easy and normal mode
      powerUps.randomPowerUpCounter += 0.5;
    } else if (game.difficultyMode === 3) { //hard mode
      powerUps.randomPowerUpCounter += 1;
    } else { //why mode
      powerUps.randomPowerUpCounter += 1.33;
      if (Math.random() < 0.6) { //why mode gets a free power up chance
        powerUps.randomPowerUpCounter *= 0.5
        spawnPowerUps()
      }
    }

    const chance = Math.max(level.levelsCleared, 10) * 0.1 //1 until level 10, then 1.1, 1.2, 1.3, ...

    if (Math.random() * chance < powerUps.randomPowerUpCounter) {
      powerUps.randomPowerUpCounter = 0;
      spawnPowerUps()
    } else {
      spawnHealthAmmo()
    }

    function spawnHealthAmmo() {
      if (mech.health < 0.65 && !mod.isEnergyHealth) {
        powerUps.spawn(x, y, "heal");
        powerUps.spawn(x, y, "heal");
        if (Math.random() < mod.bayesian) {
          powerUps.spawn(x, y, "heal");
          powerUps.spawn(x, y, "heal");
        }
      } else if (!mod.bayesian) {
        powerUps.spawn(x, y, "ammo");
        powerUps.spawn(x, y, "ammo");
      }
    }

    function spawnPowerUps() {
      if (mech.fieldMode === 0) {
        powerUps.spawn(x, y, "field")
        if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "field")
      } else if (Math.random() < 0.94) {
        powerUps.spawn(x, y, "mod")
        if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "mod")
      } else {
        powerUps.spawn(x, y, "gun")
        if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "gun")
      }
    }


  },
  chooseRandomPowerUp(x, y) { //100% chance to drop a random power up    //used in spawn.debris
    if (Math.random() < 0.01) {
      powerUps.spawn(x, y, "reroll");
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "reroll");
    } else if (Math.random() < 0.5) {
      powerUps.spawn(x, y, "heal", false);
      if (Math.random() < mod.bayesian) powerUps.spawn(x, y, "heal", false);
    } else if (!mod.bayesian) {
      powerUps.spawn(x, y, "ammo", false);
    }
  },
  addRerollToLevel() { //add a random power up to a location that has a mob,  mostly used to give each level one randomly placed reroll
    if (mob.length) {
      const index = Math.floor(Math.random() * mob.length)
      powerUps.spawn(mob[index].position.x, mob[index].position.y, "reroll");
      if (Math.random() < mod.bayesian) powerUps.spawn(mob[index].position.x, mob[index].position.y, "reroll");
    }
  },
  spawnStartingPowerUps(x, y) { //used for map specific power ups, mostly to give player a starting gun
    if (level.levelsCleared < 5) {
      if (b.inventory.length === 0) {
        powerUps.spawn(x, y, "gun", false);
      } else if (mod.totalCount === 0) {
        powerUps.spawn(x, y, "mod", false); //starting gun
      } else if (b.inventory.length < 2) {
        powerUps.spawn(x, y, "gun", false);
      } else {
        powerUps.spawnRandomPowerUp(x, y);
        powerUps.spawnRandomPowerUp(x, y);
        powerUps.spawnRandomPowerUp(x, y);
        powerUps.spawnRandomPowerUp(x, y);
      }
    } else {
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
      powerUps.spawnRandomPowerUp(x, y);
    }
  },
  spawn(x, y, target, moving = true, mode = null) {
    if (!(mod.isSuperDeterminism && (target === 'gun' || target === 'field' || target === 'reroll'))) {
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