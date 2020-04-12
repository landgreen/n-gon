let bullet = [];

const b = {
  dmgScale: null, //scales all gun damage from momentum, but not raw .dmg //set in levels.setDifficulty
  gravity: 0.0006, //most other bodies have   gravity = 0.001
  //variables use for gun mod upgrades
  modCount: null,
  modFireRate: null,
  modExplosionRadius: null,
  modBulletSize: null,
  modEnergySiphon: null,
  modHealthDrain: null,
  modNoAmmo: null,
  isModBulletsLastLonger: null,
  isModImmortal: null,
  modSporesOnDeath: null,
  isModImmuneExplosion: null,
  isModExplodeMob: null,
  isModDroneOnDamage: null,
  isModMineOnDamage: null,
  modAcidDmg: null,
  isModAcidDmg: null,
  annihilation: null,
  modRecursiveHealing: null,
  modSquirrelFx: null,
  isModCrit: null,
  isModBayesian: null,
  isModLowHealthDmg: null,
  isModFarAwayDmg: null,
  isModEntanglement: null,
  isModMassEnergy: null,
  isModFourOptions: null,
  modLaserBotCount: null,
  modNailBotCount: null,
  modCollisionImmuneCycles: null,
  modBlockDmg: null,
  isModPiezo: null,
  isModDroneCollide: null,
  isModFastSpores: null,
  isModStomp: null,
  modSuperBallNumber: null,
  modOneSuperBall: null,
  modLaserReflections: null,
  modLaserDamage: null,
  modLaserFieldDrain: null,
  isModNoAmmo: null,
  isModAmmoFromHealth: null,
  modMobDieAtHealth: null,
  isModEnergyRecovery: null,
  isModHealthRecovery: null,
  isModEnergyLoss: null,
  isModFoamShieldHit: null,
  isModDeathAvoid: null,
  isModDeathAvoidOnCD: null,
  modWaveSpeedMap: null,
  modWaveSpeedBody: null,
  isModSporeField: null,
  isModMissileField: null,
  isModIceField: null,
  isModFlechetteMultiShot: null,
  isModMineAmmoBack: null,
  isModPlasmaRange: null,
  isModRailNails: null,
  isModHawking: null,
  modBabyMissiles: null,
  isModIceCrystals: null,
  modThrowChargeRate: null,
  isModBlockStun: null,
  isModStunField: null,
  isModHarmDamage: null,
  isModAlphaRadiation: null,
  modEnergyRegen: null,
  isModVacuumShield: null,
  modRenormalization: null,
  modGrenadeFragments: null,
  isModEnergyDamage: null,
  isModBotSpawner: null,
  modWaveHelix: null,
  isModSporeFollow: null,
  isModNailPoison: null,
  isModEnergyHealth: null,
  modOnHealthChange() { //used with acid mod
    if (b.isModAcidDmg && mech.health > 0.8) {
      b.modAcidDmg = 0.5
      if (!build.isCustomSelection) {
        setTimeout(function () {
          if (document.getElementById("mod-acid")) document.getElementById("mod-acid").innerHTML = " (on)"
        }, 10);
      }
    } else {
      b.modAcidDmg = 0
      if (!build.isCustomSelection) {
        setTimeout(function () {
          if (document.getElementById("mod-acid")) document.getElementById("mod-acid").innerHTML = " (off)"
        }, 10);
      }
    }
    if (b.isModLowHealthDmg) {
      if (!build.isCustomSelection) {
        setTimeout(function () {
          if (document.getElementById("mod-low-health-damage")) document.getElementById("mod-low-health-damage").innerHTML = " +" + (((3 / (2 + Math.min(mech.health, 1))) - 1) * 100).toFixed(0) + "%"
        }, 10);
      }
    }
  },
  resetModText() {
    setTimeout(function () {
      if (document.getElementById("mod-acid")) document.getElementById("mod-acid").innerHTML = "";
      if (document.getElementById("mod-low-health-damage")) document.getElementById("mod-low-health-damage").innerHTML = "";
    }, 10);
  },
  mods: [{
      name: "capacitor",
      nameInfo: "<span id='mod-capacitor'></span>",
      description: "increase <strong class='color-d'>damage</strong> based on stored <strong class='color-f'>energy</strong><br><strong>+1%</strong> <strong class='color-d'>damage</strong> for every <strong>5%</strong> <strong class='color-f'>energy</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModEnergyDamage = true // used in mech.grabPowerUp
      },
      remove() {
        b.isModEnergyDamage = false;
      }
    },
    {
      name: "kinetic bombardment",
      description: "do up to <strong>33%</strong> more <strong class='color-d'>damage</strong> at a distance<br><em>increase maxes out at about 40 steps away</em>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModFarAwayDmg = true; //used in mob.damage()
      },
      remove() {
        b.isModFarAwayDmg = false;
      }
    },
    {
      name: "fracture analysis",
      description: "<strong>5x</strong> physical <strong class='color-d'>damage</strong> to unaware mobs<br><em>unaware mobs don't have a health bar</em>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.isModFarAwayDmg
      },
      requires: "kinetic bombardment",
      effect() {
        b.isModCrit = true;
      },
      remove() {
        b.isModCrit = false;
      }
    },
    {
      name: "fluoroantimonic acid",
      nameInfo: "<span id='mod-acid'></span>",
      description: "each <strong>bullet</strong> does instant <strong class='color-p'>acid</strong> <strong class='color-d'>damage</strong><br><strong>active</strong> when you are above <strong>80%</strong> base health",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.health > 0.8 || build.isCustomSelection
      },
      requires: "health above 80%",
      effect() {
        b.isModAcidDmg = true;
        b.modOnHealthChange();
      },
      remove() {
        b.modAcidDmg = 0;
        b.isModAcidDmg = false;
        game.playerDmgColor = "rgba(0,0,0,0.7)"
      }
    },
    {
      name: "negative feedback",
      nameInfo: "<span id='mod-low-health-damage'></span>",
      description: "do extra <strong class='color-d'>damage</strong> at low health<br><em>up to <strong>50%</strong> increase when near death</em>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.health < 0.8 || build.isCustomSelection
      },
      requires: "health below 80%",
      effect() {
        b.isModLowHealthDmg = true; //used in mob.damage()
      },
      remove() {
        b.isModLowHealthDmg = false;
      }
    },
    {
      name: "radiative equilibrium",
      description: "after receiving any <strong>harm</strong><br>do <strong>2x</strong> <strong class='color-d'>damage</strong> for <strong>5 seconds</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.isModLowHealthDmg
      },
      requires: "negative feedback",
      effect() {
        b.isModHarmDamage = true;
      },
      remove() {
        b.isModHarmDamage = false;
      }
    },
    {
      name: "thermal runaway",
      description: "mobs <strong class='color-e'>explode</strong> when they <strong>die</strong><br><em>be careful</em>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModExplodeMob = true;
      },
      remove() {
        b.isModExplodeMob = false;
      }
    },
    {
      name: "auto-loading heuristics",
      description: "your <strong>delay</strong> after firing is <strong>+14% shorter</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modFireRate *= 0.86
      },
      remove() {
        b.modFireRate = 1;
      }
    },
    {
      name: "desublimated ammunition",
      description: "use <strong>50%</strong> less <strong>ammo</strong> when <strong>crouching</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modNoAmmo = 1
      },
      remove() {
        b.modNoAmmo = 0;
      }
    },
    {
      name: "mass driver",
      description: "<strong>blocks</strong> do <strong>3x</strong> more <strong class='color-d'>damage</strong> to mobs<br>charge <strong>throws</strong> in <strong>3x</strong> less time",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modThrowChargeRate = 3
      },
      remove() {
        b.modThrowChargeRate = 1
      }
    },
    {
      name: "laser-bot",
      description: "a bot <strong>defends</strong> the space around you<br>uses a <strong>short range</strong> laser that drains <strong class='color-f'>energy</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modLaserBotCount++;
        b.laserBot();
      },
      remove() {
        b.modLaserBotCount = 0;
      }
    },
    {
      name: "nail-bot",
      description: "a bot fires <strong>nails</strong> at targets in line of sight",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modNailBotCount++;
        b.nailBot();
      },
      remove() {
        b.modNailBotCount = 0;
      }
    },
    {
      name: "scrap bots",
      description: "<strong>+16%</strong> chance to build a <strong>bot</strong> after killing a mob<br>the bot will follow you until you <strong>exit</strong> the map",
      maxCount: 6,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModBotSpawner += 0.16;
      },
      remove() {
        b.isModBotSpawner = 0;
      }
    },
    {
      name: "ablative mines",
      description: "rebuild your broken parts as a <strong>mine</strong><br>chance to occur after being <strong>harmed</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModMineOnDamage = true;
        b.mine({
          x: mech.pos.x,
          y: mech.pos.y - 80
        }, {
          x: 0,
          y: 0
        })
      },
      remove() {
        b.isModMineOnDamage = false;
      }
    },
    {
      name: "ablative drones",
      description: "rebuild your broken parts as <strong>drones</strong><br>chance to occur after being <strong>harmed</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModDroneOnDamage = true;
        for (let i = 0; i < 4; i++) {
          b.drone() //spawn drone
        }
      },
      remove() {
        b.isModDroneOnDamage = false;
      }
    },
    {
      name: "zoospore vector",
      description: "mobs discharge <strong class='color-p' style='letter-spacing: 2px;'>spores</strong> on <strong>death</strong><br><strong>+11%</strong> chance",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modSporesOnDeath += 0.11;
        for (let i = 0; i < 10; i++) {
          b.spore(player)
        }
      },
      remove() {
        b.modSporesOnDeath = 0;
      }
    },
    {
      name: "reaction inhibitor",
      description: "mobs <strong>die</strong> if their life goes below <strong>12%</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.modMobDieAtHealth = 0.15
      },
      remove() {
        b.modMobDieAtHealth = 0.05;
      }
    },
    {
      name: "waste energy recovery",
      description: "regen <strong>7%</strong> of max <strong class='color-f'>energy</strong> every second<br>active for <strong>5 seconds</strong> after a mob <strong>dies</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModEnergyRecovery = true;
      },
      remove() {
        b.isModEnergyRecovery = false;
      }
    },
    {
      name: "scrap recycling",
      description: "<strong class='color-h'>heal</strong> up to <strong>1%</strong> of max health every second<br>active for <strong>5 seconds</strong> after a mob <strong>dies</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.isModEnergyRecovery
      },
      requires: "waste energy recovery",
      effect() {
        b.isModHealthRecovery = true;
      },
      remove() {
        b.isModHealthRecovery = false;
      }
    },
    {
      name: "acute stress response",
      description: "increase <strong class='color-d'>damage</strong> by <strong>33%</strong><br>but, after a mob <strong>dies</strong> lose <strong>1/2</strong> your <strong class='color-f'>energy</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.isModEnergyRecovery
      },
      requires: "waste energy recovery",
      effect() {
        b.isModEnergyLoss = true;
      },
      remove() {
        b.isModEnergyLoss = false;
      }
    },
    {
      name: "squirrel-cage rotor",
      description: "<strong>jump</strong> higher and <strong>move</strong> faster<br>reduced <strong>harm</strong> from <strong>falling</strong> ",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() { // good with melee builds, content skipping builds
        b.modSquirrelFx += 0.2;
        mech.Fx = 0.016 * b.modSquirrelFx;
        mech.jumpForce += 0.038;
      },
      remove() {
        b.modSquirrelFx = 1;
        mech.Fx = 0.016; //if this changes update the values in  definePlayerMass
        mech.jumpForce = 0.42; //was 0.38 at 0.0019 gravity
      }
    },
    {
      name: "basidio-stomp",
      description: "hard <strong>landings</strong> disrupt <strong class='color-p' style='letter-spacing: 2px;'>spores</strong> in the ground<br>immune to <strong>harm</strong> from <strong>falling</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.modSquirrelFx > 1
      },
      requires: "squirrel-cage rotor",
      effect() {
        b.isModStomp = true
      },
      remove() {
        b.isModStomp = false;
      }
    },
    {
      name: "Pauli exclusion",
      description: `unable to <strong>collide</strong> with mobs for <strong>+2</strong> seconds<br>activates after being <strong>harmed</strong> from a collision`,
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modCollisionImmuneCycles += 120;
        mech.collisionImmuneCycle = mech.cycle + b.modCollisionImmuneCycles; //player is immune to collision damage for 30 cycles
      },
      remove() {
        b.modCollisionImmuneCycles = 30;
      }
    },
    {
      name: "quantum immortality",
      description: "after <strong>dying</strong>, continue in an <strong>alternate reality</strong><br><em>guns, ammo, field, and mods are randomized</em>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModImmortal = true;
      },
      remove() {
        b.isModImmortal = false;
      }
    },
    {
      name: "weak anthropic principle",
      description: "<strong>fatal harm</strong> can't happen<br><strong>saves</strong> you up to once every <strong>3</strong> seconds",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.isModImmortal
      },
      requires: "quantum immortality",
      effect() {
        b.isModDeathAvoid = true;
        b.isModDeathAvoidOnCD = false;
      },
      remove() {
        b.isModDeathAvoid = false;
        b.isModDeathAvoidOnCD = false;
      }
    },
    {
      name: "entanglement",
      nameInfo: "<span id = 'mod-entanglement'></span>",
      description: "<strong>16%</strong> less <strong>harm</strong> for each gun in your <strong>inventory</strong><br> while your <strong>first gun</strong> is equipped",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.isModEntanglement = true
        setTimeout(function () {
          game.boldActiveGunHUD();
        }, 10);

      },
      remove() {
        b.isModEntanglement = false;
      }
    },
    {
      name: "mass-energy equivalence",
      description: "your <strong class='color-f'>energy</strong> replaces your <strong>health</strong><br>you can't <strong>die</strong> if your <strong class='color-f'>energy</strong> is above <strong>zero</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return !b.isModPiezo
      },
      requires: "not piezoelectricity",
      effect: () => {
        mech.health = 0
        b.modOnHealthChange();
        mech.displayHealth();
        b.isModEnergyHealth = true;
      },
      remove() {
        b.isModEnergyHealth = false;
        mech.health = mech.energy;
      }
    },
    {
      name: "piezoelectricity",
      description: "<strong>colliding</strong> with mobs fills your <strong class='color-f'>energy</strong><br><strong>15%</strong> less <strong>harm</strong> from mob collisions",
      maxCount: 1,
      count: 0,
      allowed() {
        return !b.isModEnergyHealth
      },
      requires: "not mass-energy equivalence",
      effect() {
        b.isModPiezo = true;
        mech.energy = mech.fieldEnergyMax;
      },
      remove() {
        b.isModPiezo = false;
      }
    },
    {
      name: "ground state",
      description: "reduce <strong>harm</strong> by <strong>50%</strong><br>you <strong>no longer</strong> passively regenerate <strong class='color-f'>energy</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.isModPiezo
      },
      requires: "piezoelectricity",
      effect: () => {
        b.modEnergyRegen = 0;
        mech.fieldRegen = b.modEnergyRegen;
      },
      remove() {
        b.modEnergyRegen = 0.001;
        mech.fieldRegen = b.modEnergyRegen;
      }
    },
    {
      name: "energy conservation",
      description: "<strong>15%</strong> of <strong class='color-d'>damage</strong> done is recovered as <strong class='color-f'>energy</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modEnergySiphon += 0.15;
        mech.energy = mech.fieldEnergyMax
      },
      remove() {
        b.modEnergySiphon = 0;
      }
    },
    {
      name: "entropy exchange",
      description: "<strong class='color-h'>heal</strong> for <strong>1.5%</strong> of <strong class='color-d'>damage</strong> done",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        b.modHealthDrain += 0.015;
      },
      remove() {
        b.modHealthDrain = 0;
      }
    },
    {
      name: "overcharge",
      description: "increase your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>+50%</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        mech.fieldEnergyMax += 0.5
        mech.energy += 0.5
      },
      remove() {
        mech.fieldEnergyMax = 1;
      }
    },
    {
      name: "supersaturation",
      description: "increase your <strong>maximum</strong> <strong class='color-h'>health</strong> by <strong>+50%</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect() {
        mech.maxHealth += 0.50
        mech.addHealth(0.50)
      },
      remove() {
        mech.maxHealth = 1;
        b.modOnHealthChange();
        mech.displayHealth();
      }
    },
    {
      name: "recursive healing",
      description: "<strong class='color-h'>healing</strong> <strong>power ups</strong> trigger a <strong>2nd</strong> time",
      maxCount: 9,
      count: 0,
      allowed() {
        return mech.health < 0.7 || build.isCustomSelection
      },
      requires: "health below 70%",
      effect() {
        b.modRecursiveHealing += 1
      },
      remove() {
        b.modRecursiveHealing = 1;
      }
    },
    {
      name: "pair production",
      description: "<strong>power ups</strong> overfill your <strong class='color-f'>energy</strong><br>temporarily gain <strong>twice</strong> your maximum",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModMassEnergy = true // used in mech.grabPowerUp
        mech.energy = mech.fieldEnergyMax * 2
      },
      remove() {
        b.isModMassEnergy = false;
      }
    },
    {
      name: "Bayesian inference",
      description: "<strong>20%</strong> chance for double <strong>power ups</strong> to drop<br>one fewer <strong>choice</strong> when selecting <strong>power ups</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModBayesian = 0.20;
      },
      remove() {
        b.isModBayesian = 0;
      }
    },
    {
      name: "cardinality",
      description: "one extra <strong>choice</strong> when selecting <strong>power ups</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModFourOptions = true;
      },
      remove() {
        b.isModFourOptions = false;
      }
    },
    {
      name: "catabolism",
      description: "gain <strong>ammo</strong> when you <strong>fire</strong> while <strong>out</strong> of <strong>ammo</strong><br>drains <strong>3%</strong> of current remaining <strong>health</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModAmmoFromHealth = 0.03;
      },
      remove() {
        b.isModAmmoFromHealth = 0;
      }
    },
    {
      name: "leveraged investment",
      description: "<strong>remove</strong> all future <strong>ammo</strong> power ups<br>spawn <strong>6</strong> <strong class='color-m'>mods</strong> and <strong>3</strong> <strong class='color-h'>healing</strong> power ups",
      maxCount: 1,
      count: 0,
      allowed() {
        return true
      },
      requires: "",
      effect: () => {
        b.isModNoAmmo = true;
        for (let i = 0; i < 6; i++) { //if you change the six also change it in Born rule
          powerUps.spawn(mech.pos.x, mech.pos.y, "mod");
          if (Math.random() < b.isModBayesian) powerUps.spawn(mech.pos.x, mech.pos.y, "mod");
        }
        for (let i = 0; i < 3; i++) { // spawn new mods
          powerUps.spawn(mech.pos.x, mech.pos.y, "heal");
          if (Math.random() < b.isModBayesian) powerUps.spawn(mech.pos.x, mech.pos.y, "heal");
        }
      },
      remove() {
        b.isModNoAmmo = false;
      }
    },
    {
      name: "reallocation",
      description: "convert <strong>1</strong> random <strong class='color-m'>mod</strong> into <strong>2</strong> new <strong>guns</strong><br><em>recursive mods can lose all stacks</em>",
      maxCount: 1,
      count: 0,
      allowed() {
        return (b.modCount > 0) && !build.isCustomSelection
      },
      requires: "at least 1 mod",
      effect: () => {
        const have = [] //find which mods you have
        for (let i = 0; i < b.mods.length; i++) {
          if (b.mods[i].count > 0) have.push(i)
        }
        const choose = have[Math.floor(Math.random() * have.length)]
        b.mods[choose].remove(); // remove a random mod form the list of mods you have
        b.mods[choose].count = 0;
        game.updateModHUD();

        for (let i = 0; i < 2; i++) {
          powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
          if (Math.random() < b.isModBayesian) powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
        }
      },
      remove() {
        //nothing to remove
      }
    },
    {
      name: "Born rule",
      description: "<strong>remove</strong> all current <strong class='color-m'>mods</strong><br>spawn new <strong class='color-m'>mods</strong> to replace them",
      maxCount: 1,
      count: 0,
      allowed() {
        return (b.modCount > 6) && !build.isCustomSelection
      },
      requires: "more than 6 mods",
      effect: () => {
        //remove bullets  //mostly to get rid of bots
        for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
        bullet = [];

        let count = b.modCount
        if (b.isModNoAmmo) count - 6 //remove the 6 bonus mods when getting rid of leveraged investment
        for (let i = 0; i < count; i++) { // spawn new mods
          powerUps.spawn(mech.pos.x, mech.pos.y, "mod");
        }
        b.setupAllMods(); // remove all mods
        //have state is checked in mech.death()
      },
      remove() {
        //nothing to undo
      }
    },
    {
      name: "depleted uranium rounds",
      description: `your <strong>bullets</strong> are <strong>+16%</strong> larger<br>increased mass and physical <strong class='color-d'>damage</strong>`,
      count: 0,
      maxCount: 9,
      allowed() {
        return b.haveGunCheck("minigun") || b.haveGunCheck("shotgun") || b.haveGunCheck("super balls")
      },
      requires: "minigun, shotgun, super balls",
      effect() {
        b.modBulletSize += 0.16
      },
      remove() {
        b.modBulletSize = 1;
      }
    },
    {
      name: "ice crystal nucleation",
      description: "your <strong>minigun</strong> uses <strong class='color-f'>energy</strong> to condense<br>unlimited <strong class='color-s'>freezing</strong> <strong>bullets</strong> from water vapor",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("minigun")
      },
      requires: "minigun",
      effect() {
        b.isModIceCrystals = true;
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "minigun") {
            b.guns[i].ammoPack = Infinity
            b.guns[i].recordedAmmo = b.guns[i].ammo
            b.guns[i].ammo = Infinity
            game.updateGunHUD();
            break;
          }
        }
      },
      remove() {
        b.isModIceCrystals = false;
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "minigun") {
            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
            b.guns[i].ammo = b.guns[i].recordedAmmo
            game.updateGunHUD();
            break;
          }
        }
      }
    },
    {
      name: "shotgun spin-statistics",
      description: "firing the <strong>shotgun</strong> makes you <br><strong>immune</strong> to collisions for <strong>1 second</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("shotgun")
      },
      requires: "shotgun",
      effect() {
        b.isModShotgunImmune = true;
      },
      remove() {
        b.isModShotgunImmune = false;
      }
    },
    {
      name: "super duper",
      description: "fire <strong>+2</strong> additional <strong>super balls</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return b.haveGunCheck("super balls") && !b.modOneSuperBall
      },
      requires: "super balls",
      effect() {
        b.modSuperBallNumber += 2
      },
      remove() {
        b.modSuperBallNumber = 4;
      }
    },
    {
      name: "super ball",
      description: "fire one <strong>large</strong> super <strong>ball</strong><br>that <strong>stuns</strong> mobs for <strong>3</strong> second",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("super balls") && b.modSuperBallNumber === 4
      },
      requires: "super balls",
      effect() {
        b.modOneSuperBall = true;
      },
      remove() {
        b.modOneSuperBall = false;
      }
    },
    {
      name: "flechettes cartridges",
      description: "<strong>flechettes</strong> release <strong>three</strong> needles in each shot<br><strong>ammo</strong> cost are increases by <strong>3x</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("flechettes")
      },
      requires: "flechettes",
      effect() {
        b.isModFlechetteMultiShot = true;
        //cut current ammo by 1/3
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "flechettes") b.guns[i].ammo = Math.ceil(b.guns[i].ammo / 3);
        }
        //cut ammo packs by 1/3
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun
          if (b.guns[i].name === "flechettes") b.guns[i].ammoPack = Math.ceil(b.guns[i].defaultAmmoPack / 3);
        }
        game.updateGunHUD();
      },
      remove() {
        b.isModFlechetteMultiShot = false;
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "flechettes") b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 3);
        }
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "flechettes") b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
        }
        game.updateGunHUD();
      }
    },
    {
      name: "irradiated needles",
      description: "<strong>needles</strong> are exposed to <strong class='color-p'>plutonium-238</strong><br><strong>2x</strong> <strong class='color-d'>damage</strong> spread over <strong>6</strong> seconds",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("flechettes")
      },
      requires: "flechettes",
      effect() {
        b.isModDotFlechette = true;
      },
      remove() {
        b.isModDotFlechette = false;
      }
    },
    {
      name: "wave phase velocity",
      description: "the <strong>wave beam</strong> propagates faster in solids",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("wave beam")
      },
      requires: "wave beam",
      effect() {
        b.modWaveSpeedMap = 3
        b.modWaveSpeedBody = 1.9
      },
      remove() {
        b.modWaveSpeedMap = 0.08
        b.modWaveSpeedBody = 0.25
      }
    },
    {
      name: "double helix",
      description: "<strong>wave beam</strong> emits <strong>two</strong> out of phase particles<br>wave particles do <strong>40%</strong> less <strong class='color-d'>damage</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("wave beam")
      },
      requires: "wave beam",
      effect() {
        b.modWaveHelix = 2
      },
      remove() {
        b.modWaveHelix = 1
      }
    },

    {
      name: "pocket universe",
      description: "<strong>wave beam</strong> bullets last <strong>4</strong> times longer<br>bullets are <strong>confined</strong> to a <strong>region</strong> around player",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("wave beam")
      },
      requires: "wave beam",
      effect() {
        b.isModWaveReflect = true
      },
      remove() {
        b.isModWaveReflect = false
      }
    },
    {
      name: "high explosives",
      description: "<strong class='color-e'>explosions</strong> do <strong>+20%</strong> more <strong class='color-d'>damage</strong><br><strong class='color-e'>explosive</strong> area is <strong>+44% larger</strong>",
      maxCount: 3,
      count: 0,
      allowed() {
        return b.haveGunCheck("missiles") || b.haveGunCheck("flak") || b.haveGunCheck("grenades") || b.haveGunCheck("vacuum bomb") || b.haveGunCheck("pulse") || b.isModMissileField;
      },
      requires: "an explosive gun",
      effect: () => {
        b.modExplosionRadius += 0.2;
      },
      remove() {
        b.modExplosionRadius = 1;
      }
    },
    {
      name: "electric reactive armor",
      description: "<strong class='color-e'>explosions</strong> give you <strong class='color-f'>energy</strong><br>instead of <strong>harming</strong> you",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("missiles") || b.haveGunCheck("flak") || b.haveGunCheck("grenades") || b.haveGunCheck("vacuum bomb") || b.haveGunCheck("pulse") || b.isModMissileField;
      },
      requires: "an explosive gun",
      effect: () => {
        b.isModImmuneExplosion = true;
      },
      remove() {
        b.isModImmuneExplosion = false;
      }
    },
    {
      name: "self-replication",
      description: "when <strong>missiles</strong> <strong class='color-e'>explode</strong><br>they fire <strong>+1</strong> smaller <strong>missiles</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return b.haveGunCheck("missiles") || b.isModMissileField
      },
      requires: "missiles",
      effect() {
        b.modBabyMissiles++
      },
      remove() {
        b.modBabyMissiles = 0;
      }
    },
    {
      name: "optimized shell packing",
      description: "<strong>flak</strong> ammo drops contain <strong>3x</strong> more shells",
      maxCount: 3,
      count: 0,
      allowed() {
        return b.haveGunCheck("flak")
      },
      requires: "flak",
      effect() {
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "flak") b.guns[i].ammoPack = b.guns[i].defaultAmmoPack * (3 + this.count);
        }
      },
      remove() {
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
          if (b.guns[i].name === "flak") b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
        }
      }
    },
    {
      name: "fragmentation grenade",
      description: "<strong>grenades</strong> are loaded with <strong>+5</strong> nails<br>on detonation <strong>nails</strong> are ejected towards mobs",
      maxCount: 9,
      count: 0,
      allowed() {
        return b.haveGunCheck("grenades")
      },
      requires: "grenades",
      effect() {
        b.modGrenadeFragments += 5
      },
      remove() {
        b.modGrenadeFragments = 0
      }
    },
    {
      name: "electromagnetic pulse",
      description: "<strong>vacuum bomb's </strong> <strong class='color-e'>explosion</strong> destroys <strong>shields</strong><br>and does <strong>20%</strong> more <strong class='color-d'>damage</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("vacuum bomb")
      },
      requires: "vacuum bomb",
      effect() {
        b.isModVacuumShield = true;
      },
      remove() {
        b.isModVacuumShield = false;
      }
    },
    {
      name: "mine reclamation",
      description: "retrieve <strong>ammo</strong> from all undetonated <strong>mines</strong><br>and <strong>20%</strong> of <strong>mines</strong> after detonation",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("mine")
      },
      requires: "mine",
      effect() {
        b.isModMineAmmoBack = true;
      },
      remove() {
        b.isModMineAmmoBack = false;
      }
    },
    {
      name: "irradiated nails",
      description: "<strong>nails</strong> are made with a <strong class='color-p'>cobalt-60</strong> alloy<br><strong>66%</strong> extra <strong class='color-d'>damage</strong> over <strong>6</strong> seconds",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.modNailBotCount || b.haveGunCheck("mine") || b.modGrenadeFragments || b.isModRailNails || b.isModBotSpawner
      },
      requires: "nails",
      effect() {
        b.isModNailPoison = true;
      },
      remove() {
        b.isModNailPoison = false;
      }
    },
    {
      name: "tinsellated flagella",
      description: "<strong class='color-p' style='letter-spacing: 2px;'>spores</strong> accelerate <strong>50% faster</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("spores") || b.modSporesOnDeath > 0 || b.isModStomp || b.isModSporeField
      },
      requires: "spores",
      effect() {
        b.isModFastSpores = true
      },
      remove() {
        b.isModFastSpores = false
      }
    },
    {
      name: "diplochory",
      description: "<strong class='color-p' style='letter-spacing: 2px;'>spores</strong> use the player for <strong>dispersal</strong><br>until they <strong>locate</strong> a viable host",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("spores") || b.modSporesOnDeath > 0 || b.isModStomp || b.isModSporeField
      },
      requires: "spores",
      effect() {
        b.isModSporeFollow = true
      },
      remove() {
        b.isModSporeFollow = false
      }
    },
    {
      name: "Lorentzian topology",
      description: "your <strong>bullets</strong> last <strong>+33% longer</strong>",
      maxCount: 3,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" || b.haveGunCheck("spores") || b.haveGunCheck("drones") || b.haveGunCheck("super balls") || b.haveGunCheck("foam") || b.haveGunCheck("wave beam") || b.haveGunCheck("ice IX")
      },
      requires: "drones, spores, super balls,<br> foam, wave beam, or ice IX",
      effect() {
        b.isModBulletsLastLonger += 0.33
      },
      remove() {
        b.isModBulletsLastLonger = 1;
      }
    },
    {
      name: "redundant systems",
      description: "<strong>drone</strong> collisions no longer reduce their <strong>lifespan</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("drones") || (mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(b.isModSporeField || b.isModMissileField || b.isModIceField))
      },
      requires: "drones",
      effect() {
        b.isModDroneCollide = true
      },
      remove() {
        b.isModDroneCollide = true;
      }
    },
    {
      name: "heavy water",
      description: "<strong>ice IX</strong> is synthesized with unstable isotopes<br>does <strong class='color-p'>radioactive</strong> <strong class='color-d'>damage</strong> over 3 seconds",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("ice IX") || (mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && b.isModIceField)
      },
      requires: "ice IX",
      effect() {
        b.isModAlphaRadiation = true
      },
      remove() {
        b.isModAlphaRadiation = false;
      }
    },
    {
      name: "foam stabilization",
      description: "<strong>foam</strong> can stick to <strong>shields</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("foam")
      },
      requires: "foam",
      effect() {
        b.isModFoamShieldHit = true;
      },
      remove() {
        b.isModFoamShieldHit = false;
      }
    },
    {
      name: "fragmenting projectiles",
      description: "<strong>rail gun</strong> fragments into <strong>nails</strong><br>after hitting mobs at high speeds",
      maxCount: 1,
      count: 0,
      allowed() {
        return b.haveGunCheck("rail gun")
      },
      requires: "rail gun",
      effect() {
        b.isModRailNails = true;
      },
      remove() {
        b.isModRailNails = false;
      }
    },
    {
      name: "specular reflection",
      description: "<strong>laser</strong> beams gain <strong>+1</strong> reflection<br><strong>+50%</strong> laser <strong class='color-d'>damage</strong> and <strong class='color-f'>energy</strong> drain",
      maxCount: 9,
      count: 0,
      allowed() {
        return b.haveGunCheck("laser")
      },
      requires: "laser",
      effect() {
        b.modLaserReflections++;
        b.modLaserDamage += 0.035; //base is 0.06
        b.modLaserFieldDrain += 0.001 //base is 0.002
      },
      remove() {
        b.modLaserReflections = 2;
        b.modLaserDamage = 0.07;
        b.modLaserFieldDrain = 0.002;
      }
    },
    {
      name: "flux pinning",
      description: "blocking with <strong>perfect diamagnetism</strong><br><strong>stuns</strong> mobs for <strong>+1</strong> second",
      maxCount: 9,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "perfect diamagnetism"
      },
      requires: "perfect diamagnetism",
      effect() {
        b.isModStunField += 60;
      },
      remove() {
        b.isModStunField = 0;
      }
    },
    {
      name: "timelike world line",
      description: "<strong>time dilation</strong> increases your time <strong>rate</strong> by <strong>2x</strong><br>while <strong class='color-f'>energy</strong> <strong>drain</strong> is decreased by <strong>2x</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "time dilation field"
      },
      requires: "time dilation field",
      effect() {
        b.isModTimeSkip = true;
      },
      remove() {
        b.isModTimeSkip = false;
      }
    },
    {
      name: "plasma jet",
      description: "increase <strong>plasma torch's</strong> range by <strong>33%</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "plasma torch"
      },
      requires: "plasma torch",
      effect() {
        b.isModPlasmaRange += 0.33;
      },
      remove() {
        b.isModPlasmaRange = 1;
      }
    },
    {
      name: "annihilation",
      description: "after <strong>touching</strong> mobs, they are <strong>annihilated</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "negative mass field"
      },
      requires: "negative mass field",
      effect() {
        b.isModAnnihilation = true
      },
      remove() {
        b.isModAnnihilation = false;
      }
    },
    {
      name: "Hawking radiation",
      description: "<strong>negative mass field</strong> leaks virtual particles<br>mobs inside the field take <strong class='color-d'>damage</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "negative mass field"
      },
      requires: "negative mass field",
      effect() {
        b.isModHawking = true;
      },
      remove() {
        b.isModHawking = 0;
      }
    },
    {
      name: "bremsstrahlung radiation",
      description: "<strong>blocking</strong> with your field does <strong class='color-d'>damage</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "standing wave harmonics"
      },
      requires: "standing wave harmonics",
      effect() {
        b.modBlockDmg += 0.5 //if you change this value also update the for loop in the electricity graphics in mech.pushMass
      },
      remove() {
        b.modBlockDmg = 0;
      }
    },
    {
      name: "frequency resonance",
      description: "<strong>standing wave harmonics</strong> shield is retuned<br>increase <strong>size</strong> and <strong>blocking</strong> efficiency by <strong>30%</strong>",
      maxCount: 9,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "standing wave harmonics"
      },
      requires: "standing wave harmonics",
      effect() {
        mech.fieldRange += 175 * 0.2
        mech.fieldShieldingScale *= 0.7
      },
      remove() {
        mech.fieldRange = 175;
        mech.fieldShieldingScale = 1;
      }
    },
    {
      name: "mycelium manufacturing",
      description: "<strong>nano-scale manufacturing</strong> is repurposed<br>excess <strong class='color-f'>energy</strong> used to grow <strong class='color-p' style='letter-spacing: 2px;'>spores</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(b.isModMissileField || b.isModIceField)
      },
      requires: "nano-scale manufacturing",
      effect() {
        b.isModSporeField = true;
      },
      remove() {
        b.isModSporeField = false;
      }
    },
    {
      name: "missile manufacturing",
      description: "<strong>nano-scale manufacturing</strong> is repurposed<br>excess <strong class='color-f'>energy</strong> used to construct <strong>missiles</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(b.isModSporeField || b.isModIceField)
      },
      requires: "nano-scale manufacturing",
      effect() {
        b.isModMissileField = true;
      },
      remove() {
        b.isModMissileField = false;
      }
    },
    {
      name: "ice IX manufacturing",
      description: "<strong>nano-scale manufacturing</strong> is repurposed<br>excess <strong class='color-f'>energy</strong> used to synthesize <strong>ice IX</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(b.isModSporeField || b.isModMissileField)
      },
      requires: "nano-scale manufacturing",
      effect() {
        b.isModIceField = true;
      },
      remove() {
        b.isModIceField = false;
      }
    },
    {
      name: "renormalization",
      description: "<strong>phase decoherence field</strong> has <strong>3x visibility</strong><br>and <strong>3x</strong> less <strong class='color-f'>energy</strong> drain when <strong>firing</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "phase decoherence field"
      },
      requires: "phase decoherence field",
      effect() {
        b.modRenormalization = 3;
      },
      remove() {
        b.modRenormalization = 1;
      }
    },
    {
      name: "superposition",
      // description: "<strong>phase decoherence field</strong> applies a <strong>stun</strong><br> to unshielded <strong>mobs</strong> for <strong>2</strong> seconds",
      description: "apply a <strong>4</strong> second <strong>stun</strong> to unshielded <strong>mobs</strong><br>that <strong>overlap</strong> with <strong>phase decoherence field</strong>",
      maxCount: 1,
      count: 0,
      allowed() {
        return mech.fieldUpgrades[mech.fieldMode].name === "phase decoherence field"
      },
      requires: "phase decoherence field",
      effect() {
        b.superposition = true;
      },
      remove() {
        b.superposition = false;
      }
    },
  ],
  removeMod(index) {
    b.mods[index].remove();
    b.mods[index].count = 0;
    game.updateModHUD();
  },
  setupAllMods() {
    for (let i = 0, len = b.mods.length; i < len; i++) {
      b.mods[i].remove();
      b.mods[i].count = 0
    }
    b.modCount = 0;
    game.updateModHUD();
  },
  // setupAllMods() {
  //   for (let i = 0, len = b.mods.length; i < len; i++) {
  //     if (b.mods[i].count) b.mods[i].remove();
  //     b.mods[i].count = 0
  //   }
  //   b.modCount = 0;
  //   game.updateModHUD();
  // },
  giveMod(index = 'random') {
    if (index === 'random') {
      let options = [];
      for (let i = 0; i < b.mods.length; i++) {
        if (b.mods[i].count < b.mods[i].maxCount && b.mods[i].allowed())
          options.push(i);
      }

      // give a random mod from the mods I don't have
      if (options.length > 0) {
        let newMod = options[Math.floor(Math.random() * options.length)]
        b.giveMod(newMod)
      }
    } else {
      if (isNaN(index)) { //find index by name
        for (let i = 0; i < b.mods.length; i++) {
          if (index === b.mods[i].name) index = i
        }
      }

      b.mods[index].effect(); //give specific mod
      b.mods[index].count++
      b.modCount++ //used in power up randomization
      game.updateModHUD();
    }
  },
  haveGunCheck(name) {
    for (i = 0, len = b.inventory.length; i < len; i++) {
      if (b.guns[b.inventory[i]].name === name) return true
    }
    return false
  },
  activeGun: null, //current gun in use by player
  inventoryGun: 0,
  inventory: [], //list of what guns player has  // 0 starts with basic gun
  fire() {
    if (game.mouseDown && mech.fireCDcycle < mech.cycle && (!(keys[32] || game.mouseDownRight) || mech.fieldFire) && b.inventory.length) {
      if (b.guns[b.activeGun].ammo > 0) {
        b.guns[b.activeGun].fire();
        if (b.modNoAmmo && mech.crouch) {
          if (b.modNoAmmo % 2) {
            b.guns[b.activeGun].ammo--;
            game.updateGunHUD();
          }
          b.modNoAmmo++ //makes the no ammo toggle off and on
        } else {
          b.guns[b.activeGun].ammo--;
          game.updateGunHUD();
        }
      } else {
        if (b.isModAmmoFromHealth && mech.health > 0.05) {
          mech.damage(Math.max(0.01, b.isModAmmoFromHealth * mech.health));
          powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
          if (Math.random() < b.isModBayesian) powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
        }
        mech.fireCDcycle = mech.cycle + 30; //fire cooldown
        game.replaceTextLog = true;
        game.makeTextLog("<div style='font-size:140%;'>NO AMMO</div> <p style='font-size:90%;'><strong>Q</strong>, <strong>E</strong>, and <strong>mouse wheel</strong> change weapons</p>", 200);
      }
      if (mech.holdingTarget) {
        mech.drop();
      }
    }
  },
  bulletRemove() { //run in main loop
    //remove bullet if at end cycle for that bullet
    let i = bullet.length;
    while (i--) {
      if (bullet[i].endCycle < game.cycle) {
        bullet[i].onEnd(i); //some bullets do stuff on end
        if (bullet[i]) {
          Matter.World.remove(engine.world, bullet[i]);
          bullet.splice(i, 1);
        } else {
          break; //if bullet[i] doesn't exist don't complete the for loop, because the game probably reset
        }
      }
    }
  },
  bulletDraw() {
    ctx.beginPath();
    for (let i = 0, len = bullet.length; i < len; i++) {
      let vertices = bullet[i].vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
    }
    ctx.fillStyle = "#000";
    ctx.fill();
  },
  bulletDo() {
    for (let i = 0, len = bullet.length; i < len; i++) {
      bullet[i].do();
    }
  },
  fireProps(cd, speed, dir, me) {
    mech.fireCDcycle = mech.cycle + Math.floor(cd * b.modFireRate); // cool down
    Matter.Body.setVelocity(bullet[me], {
      x: mech.Vx / 2 + speed * Math.cos(dir),
      y: mech.Vy / 2 + speed * Math.sin(dir)
    });
    World.add(engine.world, bullet[me]); //add bullet to world
  },
  fireAttributes(dir, rotate = true) {
    if (rotate) {
      return {
        // density: 0.0015,			//frictionAir: 0.01,			//restitution: 0,
        angle: dir,
        friction: 0.5,
        frictionAir: 0,
        dmg: 0, //damage done in addition to the damage from momentum
        classType: "bullet",
        collisionFilter: {
          category: cat.bullet,
          mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
        },
        minDmgSpeed: 10,
        onDmg() {}, //this.endCycle = 0  //triggers despawn
        onEnd() {}
      };
    } else {
      return {
        // density: 0.0015,			//frictionAir: 0.01,			//restitution: 0,
        inertia: Infinity, //prevents rotation
        angle: dir,
        friction: 0.5,
        frictionAir: 0,
        dmg: 0, //damage done in addition to the damage from momentum
        classType: "bullet",
        collisionFilter: {
          category: cat.bullet,
          mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
        },
        minDmgSpeed: 10,
        onDmg() {}, //this.endCycle = 0  //triggers despawn
        onEnd() {}
      };
    }
  },
  muzzleFlash(radius = 10) {
    ctx.fillStyle = "#fb0";
    ctx.beginPath();
    ctx.arc(mech.pos.x + 35 * Math.cos(mech.angle), mech.pos.y + 35 * Math.sin(mech.angle), radius, 0, 2 * Math.PI);
    ctx.fill();
  },
  removeConsBB(me) {
    for (let i = 0, len = consBB.length; i < len; ++i) {
      if (consBB[i].bodyA === me) {
        consBB[i].bodyA = consBB[i].bodyB;
        consBB.splice(i, 1);
        // b.removeConsBB(me);
        break;
      } else if (consBB[i].bodyB === me) {
        consBB[i].bodyB = consBB[i].bodyA;
        consBB.splice(i, 1);
        // b.removeConsBB(me);
        break;
      }
    }
  },
  onCollision(event) {
    const pairs = event.pairs;
    for (let i = 0, j = pairs.length; i != j; i++) {
      //map + bullet collisions
      if (pairs[i].bodyA.collisionFilter.category === cat.map && pairs[i].bodyB.collisionFilter.category === cat.bullet) {
        collideBulletStatic(pairs[i].bodyB)
      } else if (pairs[i].bodyB.collisionFilter.category === cat.map && pairs[i].bodyA.collisionFilter.category === cat.bullet) {
        collideBulletStatic(pairs[i].bodyA)
      }

      function collideBulletStatic(obj) {
        if (obj.onWallHit) obj.onWallHit();
      }
    }
  },
  explosion(where, radius, isBurn = false) {
    radius *= b.modExplosionRadius
    // typically explode is used for some bullets with .onEnd
    //add dmg to draw queue
    game.drawList.push({
      x: where.x,
      y: where.y,
      radius: radius,
      color: "rgba(255,25,0,0.6)",
      time: game.drawTime
    });
    let dist, sub, knock;
    let dmg = b.dmgScale * radius * 0.009;

    const alertRange = 100 + radius * 2; //alert range
    //add alert to draw queue
    game.drawList.push({
      x: where.x,
      y: where.y,
      radius: alertRange,
      color: "rgba(100,20,0,0.03)",
      time: game.drawTime
    });

    //player damage and knock back
    sub = Vector.sub(where, player.position);
    dist = Vector.magnitude(sub);

    if (dist < radius) {
      if (b.isModImmuneExplosion) {
        mech.energy += Math.max(radius * 0.0003, 0.15)
      } else {
        mech.damage(radius * 0.0002); //normal player damage from explosions
      }

      knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 30);
      player.force.x += knock.x;
      player.force.y += knock.y;
      mech.drop();
    } else if (dist < alertRange) {
      knock = Vector.mult(Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 55);
      player.force.x += knock.x;
      player.force.y += knock.y;
      mech.drop();
    }

    //body knock backs
    for (let i = 0, len = body.length; i < len; ++i) {
      sub = Vector.sub(where, body[i].position);
      dist = Vector.magnitude(sub);
      if (dist < radius) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 18);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 40);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      }
    }

    //power up knock backs
    for (let i = 0, len = powerUp.length; i < len; ++i) {
      sub = Vector.sub(where, powerUp[i].position);
      dist = Vector.magnitude(sub);
      if (dist < radius) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 30);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 45);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      }
    }

    //mob damage and knock back with alert
    let damageScale = 1.5; // reduce dmg for each new target to limit total AOE damage
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (mob[i].alive && !mob[i].isShielded) {
        sub = Vector.sub(where, mob[i].position);
        dist = Vector.magnitude(sub) - mob[i].radius;
        if (dist < radius) {
          if (mob[i].shield) dmg *= 3 //balancing explosion dmg to shields
          mob[i].damage(dmg * damageScale);
          mob[i].locatePlayer();
          knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 50);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
          radius *= 0.93 //reduced range for each additional explosion target
          damageScale *= 0.8 //reduced damage for each additional explosion target
        } else if (!mob[i].seePlayer.recall && dist < alertRange) {
          mob[i].locatePlayer();
          knock = Vector.mult(Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 80);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
        }
      }
    }
  },
  missile(where, dir, speed, size = 1, spawn = 0) {
    const me = bullet.length;
    bullet[me] = Bodies.rectangle(where.x, where.y, 30 * size, 4 * size, b.fireAttributes(dir));
    const thrust = 0.00417 * bullet[me].mass;
    Matter.Body.setVelocity(bullet[me], {
      x: mech.Vx / 2 + speed * Math.cos(dir),
      y: mech.Vy / 2 + speed * Math.sin(dir)
    });
    World.add(engine.world, bullet[me]); //add bullet to world
    bullet[me].frictionAir = 0.023
    bullet[me].endCycle = game.cycle + Math.floor((280 + 40 * Math.random()) * b.isModBulletsLastLonger);
    bullet[me].explodeRad = 170 + 60 * Math.random();
    bullet[me].lookFrequency = Math.floor(21 + Math.random() * 7);
    bullet[me].onEnd = function () {
      b.explosion(this.position, this.explodeRad * size); //makes bullet do explosive damage at end
      for (let i = 0; i < spawn; i++) {
        b.missile(this.position, 2 * Math.PI * Math.random(), 0, 0.75)
      }
    }
    bullet[me].onDmg = function () {
      this.tryToLockOn();
      // this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
    };
    bullet[me].lockedOn = null;
    bullet[me].tryToLockOn = function () {
      this.lockedOn = null;
      let closeDist = Infinity;

      //look for closest target to where the missile will be in 30 cycles
      const futurePos = Vector.add(this.position, Vector.mult(this.velocity, 30))
      for (let i = 0, len = mob.length; i < len; ++i) {
        if (
          mob[i].alive && mob[i].dropPowerUp &&
          Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
          Matter.Query.ray(body, this.position, mob[i].position).length === 0
        ) {
          const futureDist = Vector.magnitude(Vector.sub(futurePos, mob[i].position));
          if (futureDist < closeDist) {
            closeDist = futureDist;
            this.lockedOn = mob[i];
            this.frictionAir = 0.05; //extra friction once a target it locked
          }
        }
      }
      //explode when bullet is close enough to target
      if (this.lockedOn && Vector.magnitude(Vector.sub(this.position, this.lockedOn.position)) < this.explodeRad) {
        // console.log('hit')
        this.endCycle = 0; //bullet ends cycle after doing damage  //also triggers explosion
        this.lockedOn.damage(b.dmgScale * 5 * size); //does extra damage to target
      }
    };
    bullet[me].do = function () {
      if (!mech.isBodiesAsleep) {
        if (!(mech.cycle % this.lookFrequency)) {
          this.tryToLockOn();
        }

        //rotate missile towards the target
        if (this.lockedOn) {
          const face = {
            x: Math.cos(this.angle),
            y: Math.sin(this.angle)
          };
          const target = Vector.normalise(Vector.sub(this.position, this.lockedOn.position));
          if (Vector.dot(target, face) > -0.98) {
            if (Vector.cross(target, face) > 0) {
              Matter.Body.rotate(this, 0.08);
            } else {
              Matter.Body.rotate(this, -0.08);
            }
          }
        }
        //accelerate in direction bullet is facing
        const dir = this.angle; // + (Math.random() - 0.5);
        this.force.x += Math.cos(dir) * thrust;
        this.force.y += Math.sin(dir) * thrust;

        //draw rocket
        ctx.beginPath();
        ctx.arc(this.position.x - Math.cos(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          this.position.y - Math.sin(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          11 * size, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,155,0,0.5)";
        ctx.fill();
      } else {
        //draw rocket  with time stop
        ctx.beginPath();
        ctx.arc(this.position.x - Math.cos(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          this.position.y - Math.sin(this.angle) * (30 * size - 3) + (Math.random() - 0.5) * 4,
          11 * size, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,155,0,0.5)";
        ctx.fill();
      }
    }
  },
  mine(where, velocity, angle = 0, isAmmoBack = false) {
    const bIndex = bullet.length;
    bullet[bIndex] = Bodies.rectangle(where.x, where.y, 45, 16, {
      angle: angle,
      friction: 1,
      frictionStatic: 1,
      frictionAir: 0,
      restitution: 0,
      dmg: 0, //damage done in addition to the damage from momentum
      classType: "bullet",
      bulletType: "mine",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield | cat.bullet
      },
      minDmgSpeed: 5,
      stillCount: 0,
      isArmed: false,
      endCycle: Infinity,
      lookFrequency: 41 + Math.floor(23 * Math.random()),
      range: 700,
      onDmg() {},
      do() {
        this.force.y += this.mass * 0.002; //extra gravity
        let collide = Matter.Query.collides(this, map) //check if collides with map
        if (collide.length > 0) {
          for (let i = 0; i < collide.length; i++) {
            if (collide[i].bodyA.collisionFilter.category === cat.map || collide[i].bodyB.collisionFilter.category === cat.map) {
              const angle = Matter.Vector.angle(collide[i].normal, {
                x: 1,
                y: 0
              })
              Matter.Body.setAngle(this, Math.atan2(collide[i].tangent.y, collide[i].tangent.x))
              //move until touching map again after rotation
              for (let j = 0; j < 10; j++) {
                if (Matter.Query.collides(this, map).length > 0) {
                  if (angle > -0.2 || angle < -1.5) { //don't stick to level ground
                    Matter.Body.setStatic(this, true) //don't set to static if not touching map
                  } else {
                    Matter.Body.setVelocity(this, {
                      x: 0,
                      y: 0
                    });
                    Matter.Body.setAngularVelocity(this, 0)
                  }
                  this.arm();

                  //sometimes the mine can't attach to map and it just needs to be reset
                  const that = this
                  setTimeout(function () {
                    if (Matter.Query.collides(that, map).length === 0) {
                      that.endCycle = 0 // if not touching map explode
                      that.isArmed = false
                      b.mine(that.position, that.velocity, that.angle)
                    }
                  }, 100, that);
                  break
                }
                //move until you are touching the wall
                Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(collide[i].normal, 2)))
              }

            }
          }
        } else {
          if (this.speed < 1 && this.angularSpeed < 0.01 && !mech.isBodiesAsleep) {
            this.stillCount++
          }
        }
        if (this.stillCount > 25) this.arm();
      },
      arm() {
        this.isArmed = true
        game.drawList.push({
          //add dmg to draw queue
          x: this.position.x,
          y: this.position.y,
          radius: 10,
          color: "#f00",
          time: 4
        });

        this.do = function () { //overwrite the do method for this bullet
          this.force.y += this.mass * 0.002; //extra gravity
          if (!(game.cycle % this.lookFrequency)) { //find mob targets
            for (let i = 0, len = mob.length; i < len; ++i) {
              if (Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position)) < 500000 &&
                mob[i].dropPowerUp &&
                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                this.endCycle = 0 //end life if mob is near and visible
                if (Math.random() < 0.8) isAmmoBack = false; //20% chance to get ammo back after detonation
              }
            }
          }
        }
      },
      onEnd() {
        if (this.isArmed) {
          const targets = [] //target nearby mobs
          for (let i = 0, len = mob.length; i < len; i++) {
            if (mob[i].dropPowerUp) {
              const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
              if (dist < 1440000 && //1200*1200
                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                targets.push(Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))) //predict where the mob will be in a few cycles
              }
            }
          }
          for (let i = 0; i < 16; i++) {
            const speed = 53 + 10 * Math.random()
            if (targets.length > 0) { // aim near a random target in array
              const index = Math.floor(Math.random() * targets.length)
              const SPREAD = 150 / targets.length
              const WHERE = {
                x: targets[index].x + SPREAD * (Math.random() - 0.5),
                y: targets[index].y + SPREAD * (Math.random() - 0.5)
              }
              b.nail(this.position, Vector.mult(Vector.normalise(Vector.sub(WHERE, this.position)), speed), 1.1)
            } else { // aim in random direction
              const ANGLE = 2 * Math.PI * Math.random()
              b.nail(this.position, {
                x: speed * Math.cos(ANGLE),
                y: speed * Math.sin(ANGLE)
              })
            }
          }
        }
        if (isAmmoBack) { //get ammo back from b.isModMineAmmoBack
          for (i = 0, len = b.guns.length; i < len; i++) { //find which gun
            if (b.guns[i].name === "mine") {
              b.guns[i].ammo++
              game.updateGunHUD();
              break;
            }
          }
        }
      }
    });
    bullet[bIndex].torque += bullet[bIndex].inertia * 0.0002 * (0.5 - Math.random())
    Matter.Body.setVelocity(bullet[bIndex], velocity);
    World.add(engine.world, bullet[bIndex]); //add bullet to world
  },
  spore(who) { //used with the mod upgrade in mob.death()
    const bIndex = bullet.length;
    const side = 4;
    bullet[bIndex] = Bodies.polygon(who.position.x, who.position.y, 5, side, {
      // density: 0.0015,			//frictionAir: 0.01,
      inertia: Infinity,
      restitution: 0.5,
      angle: Math.random() * 2 * Math.PI,
      friction: 0,
      frictionAir: 0.025,
      thrust: b.isModFastSpores ? 0.001 : 0.0004,
      dmg: 2.8, //damage done in addition to the damage from momentum
      lookFrequency: 97 + Math.floor(117 * Math.random()),
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.mob | cat.mobBullet | cat.mobShield //no collide with body
      },
      endCycle: game.cycle + Math.floor((540 + Math.floor(Math.random() * 360)) * b.isModBulletsLastLonger),
      minDmgSpeed: 0,
      playerOffPosition: { //used when following player to keep spores separate
        x: 100 * (Math.random() - 0.5),
        y: 100 * (Math.random() - 0.5)
      },
      onDmg() {
        this.endCycle = 0; //bullet ends cycle after doing damage 
      },
      onEnd() {},
      do() {
        if (!(game.cycle % this.lookFrequency)) { //find mob targets
          this.closestTarget = null;
          this.lockedOn = null;
          let closeDist = Infinity;
          for (let i = 0, len = mob.length; i < len; ++i) {
            if (mob[i].dropPowerUp && Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
              // Matter.Query.ray(body, this.position, mob[i].position).length === 0
              const targetVector = Vector.sub(this.position, mob[i].position)
              const dist = Vector.magnitude(targetVector);
              if (dist < closeDist) {
                this.closestTarget = mob[i].position;
                closeDist = dist;
                this.lockedOn = mob[i] //Vector.normalise(targetVector);
                if (0.3 > Math.random()) break //doesn't always target the closest mob
              }
            }
          }
        }

        if (this.lockedOn && this.lockedOn.alive) { //accelerate towards mobs
          this.force = Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), this.mass * this.thrust)
        } else if (b.isModSporeFollow && this.lockedOn !== undefined) { //move towards player
          //checking for undefined means that the spores don't go after the player until it has looked and not found a target
          const dx = this.position.x - mech.pos.x;
          const dy = this.position.y - mech.pos.y;
          if (dx * dx + dy * dy > 10000) {
            this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, Vector.add(this.playerOffPosition, this.position))), this.mass * this.thrust)
          }
          // this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.thrust)

        } else {
          this.force.y += this.mass * 0.0001; //gravity
        }
      },
    });
    const SPEED = 4 + 8 * Math.random();
    const ANGLE = 2 * Math.PI * Math.random()
    Matter.Body.setVelocity(bullet[bIndex], {
      x: SPEED * Math.cos(ANGLE),
      y: SPEED * Math.sin(ANGLE)
    });
    World.add(engine.world, bullet[bIndex]); //add bullet to world
  },
  iceIX(speed = 0, spread = 2 * Math.PI) {
    const me = bullet.length;
    const THRUST = 0.004
    const dir = mech.angle + spread * (Math.random() - 0.5);
    const RADIUS = 18
    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 3, RADIUS, {
      angle: dir - Math.PI,
      inertia: Infinity,
      friction: 0,
      frictionAir: 0.10,
      restitution: 0.3,
      dmg: 0.18, //damage done in addition to the damage from momentum
      lookFrequency: 10 + Math.floor(7 * Math.random()),
      endCycle: game.cycle + 120 * b.isModBulletsLastLonger, //Math.floor((1200 + 420 * Math.random()) * b.isModBulletsLastLonger),
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield //self collide
      },
      minDmgSpeed: 0,
      lockedOn: null,
      isFollowMouse: true,
      onDmg(who) {
        mobs.statusSlow(who, 60)
        this.endCycle = game.cycle
        if (b.isModAlphaRadiation) mobs.statusDoT(who, 0.1, 180)
      },
      onEnd() {},
      do() {
        // this.force.y += this.mass * 0.0002;
        //find mob targets
        if (!(game.cycle % this.lookFrequency)) {
          const scale = 1 - 0.09 / b.isModBulletsLastLonger //0.9 * b.isModBulletsLastLonger;
          Matter.Body.scale(this, scale, scale);
          this.lockedOn = null;
          let closeDist = Infinity;
          for (let i = 0, len = mob.length; i < len; ++i) {
            if (
              mob[i].dropPowerUp &&
              Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
              Matter.Query.ray(body, this.position, mob[i].position).length === 0
            ) {
              const TARGET_VECTOR = Vector.sub(this.position, mob[i].position)
              const DIST = Vector.magnitude(TARGET_VECTOR);
              if (DIST < closeDist) {
                closeDist = DIST;
                this.lockedOn = mob[i]
              }
            }
          }
        }
        if (this.lockedOn) { //accelerate towards mobs
          this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, this.lockedOn.position)), -this.mass * THRUST)
        } else {
          this.force = Vector.mult(Vector.normalise(this.velocity), this.mass * THRUST)
        }
      }
    })

    World.add(engine.world, bullet[me]); //add bullet to world
    // Matter.Body.setAngularVelocity(bullet[me], 2 * (0.5 - Math.random()))  //doesn't work due to high friction
    Matter.Body.setVelocity(bullet[me], {
      x: speed * Math.cos(dir),
      y: speed * Math.sin(dir)
    });
    // Matter.Body.setVelocity(bullet[me], {
    //   x: mech.Vx / 2 + speed * Math.cos(dir),
    //   y: mech.Vy / 2 + speed * Math.sin(dir)
    // });
  },
  drone(speed = 1) {
    const me = bullet.length;
    const THRUST = 0.0015
    const dir = mech.angle + 0.2 * (Math.random() - 0.5);
    const RADIUS = (4.5 + 3 * Math.random())
    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 8, RADIUS, {
      angle: dir,
      inertia: Infinity,
      friction: 0.05,
      frictionAir: 0.0005,
      restitution: 1,
      dmg: 0.17, //damage done in addition to the damage from momentum
      lookFrequency: 83 + Math.floor(41 * Math.random()),
      endCycle: game.cycle + Math.floor((1200 + 420 * Math.random()) * b.isModBulletsLastLonger),
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield //self collide
      },
      minDmgSpeed: 0,
      lockedOn: null,
      isFollowMouse: true,
      onDmg() {
        this.lockedOn = null
        if (this.endCycle > game.cycle + 180 && b.isModDroneCollide) {
          this.endCycle -= 60
          if (game.cycle + 180 > this.endCycle) this.endCycle = game.cycle + 180
        }
      },
      onEnd() {},
      do() {
        if (game.cycle + 180 > this.endCycle) { //fall and die
          this.force.y += this.mass * 0.0012;
          this.restitution = 0.2;
        } else {
          this.force.y += this.mass * 0.0002;
          //find mob targets
          if (!(game.cycle % this.lookFrequency)) {
            this.lockedOn = null;
            let closeDist = Infinity;
            for (let i = 0, len = mob.length; i < len; ++i) {
              if (
                mob[i].dropPowerUp &&
                Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                Matter.Query.ray(body, this.position, mob[i].position).length === 0
              ) {
                const TARGET_VECTOR = Vector.sub(this.position, mob[i].position)
                const DIST = Vector.magnitude(TARGET_VECTOR);
                if (DIST < closeDist) {
                  closeDist = DIST;
                  this.lockedOn = mob[i]
                }
              }
            }
            if (!this.lockedOn) {
              //grab a power up if it is (ammo) or (a heal when player is low)
              let closeDist = Infinity;
              for (let i = 0, len = powerUp.length; i < len; ++i) {
                if (
                  ((powerUp[i].name !== "field" && powerUp[i].name !== "heal") || (powerUp[i].name === "heal" && mech.health < 0.8)) &&
                  Matter.Query.ray(map, this.position, powerUp[i].position).length === 0 &&
                  Matter.Query.ray(body, this.position, powerUp[i].position).length === 0
                ) {
                  const TARGET_VECTOR = Vector.sub(this.position, powerUp[i].position)
                  const DIST = Vector.magnitude(TARGET_VECTOR);
                  if (DIST < closeDist) {
                    if (DIST < 50) { //eat the power up if close enough
                      powerUp[i].effect();
                      Matter.World.remove(engine.world, powerUp[i]);
                      powerUp.splice(i, 1);
                      break;
                    }
                    closeDist = DIST;
                    this.lockedOn = powerUp[i]
                  }
                }
              }
            }
          }
          if (this.lockedOn) { //accelerate towards mobs
            this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, this.lockedOn.position)), -this.mass * THRUST)
          } else { //accelerate towards mouse
            this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, game.mouseInGame)), -this.mass * THRUST)
          }
          // speed cap instead of friction to give more agility
          if (this.speed > 6) {
            Matter.Body.setVelocity(this, {
              x: this.velocity.x * 0.97,
              y: this.velocity.y * 0.97
            });
          }
        }
      }
    })
    World.add(engine.world, bullet[me]); //add bullet to world
    Matter.Body.setVelocity(bullet[me], {
      x: speed * Math.cos(dir),
      y: speed * Math.sin(dir)
    });
  },
  nail(pos, velocity, dmg = 0) {
    const me = bullet.length;
    bullet[me] = Bodies.rectangle(pos.x, pos.y, 25, 2, b.fireAttributes(Math.atan2(velocity.y, velocity.x)));
    Matter.Body.setVelocity(bullet[me], velocity);
    World.add(engine.world, bullet[me]); //add bullet to world
    bullet[me].endCycle = game.cycle + 60 + 18 * Math.random();
    bullet[me].dmg = dmg
    bullet[me].onDmg = function (who) {
      if (b.isModNailPoison) {
        mobs.statusDoT(who, dmg * 0.055, 300) //66% / (360 / 30)  one tick every 30 cycles in 360 cycles total
      }
    };
    bullet[me].do = function () {};
  },
  nailBot(speed = 1) {
    const me = bullet.length;
    const dir = mech.angle;
    const RADIUS = (10 + 5 * Math.random())
    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 4, RADIUS, {
      angle: dir,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.05,
      restitution: 0.6 * (1 + 0.5 * Math.random()),
      dmg: 0, // 0.14   //damage done in addition to the damage from momentum
      minDmgSpeed: 2,
      lookFrequency: 56 + Math.floor(17 * Math.random()),
      acceleration: 0.005 * (1 + 0.5 * Math.random()),
      range: 70 * (1 + 0.3 * Math.random()),
      endCycle: Infinity,
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
      },
      lockedOn: null,
      onDmg() {
        this.lockedOn = null
      },
      onEnd() {},
      do() {
        if (!(game.cycle % this.lookFrequency) && !mech.isStealth) {
          let target
          for (let i = 0, len = mob.length; i < len; i++) {
            const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
            if (dist < 3000000 && //1400*1400
              Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
              Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
              target = Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))
              const SPEED = 50
              b.nail(this.position, Vector.mult(Vector.normalise(Vector.sub(target, this.position)), SPEED), 0.4)
              break;
            }
          }
        }

        const distanceToPlayer = Vector.magnitude(Vector.sub(this.position, mech.pos))
        if (distanceToPlayer > this.range) { //if far away move towards player
          this.force = Vector.mult(Vector.normalise(Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
          // this.frictionAir = 0.1
        } else { //close to player
          // this.frictionAir = 0
          //add player's velocity
          Matter.Body.setVelocity(this, Vector.add(Vector.mult(this.velocity, 0.90), Vector.mult(player.velocity, 0.17)));
        }
      }
    })
    World.add(engine.world, bullet[me]); //add bullet to world
    Matter.Body.setVelocity(bullet[me], {
      x: speed * Math.cos(dir),
      y: speed * Math.sin(dir)
    });
  },
  laserBot(speed = 1) {
    const me = bullet.length;
    const dir = mech.angle;
    const RADIUS = (14 + 6 * Math.random())
    bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 3, RADIUS, {
      angle: dir,
      friction: 0,
      frictionStatic: 0,
      frictionAir: 0.008 * (1 + 0.3 * Math.random()),
      restitution: 0.5 * (1 + 0.5 * Math.random()),
      dmg: 0, // 0.14   //damage done in addition to the damage from momentum
      minDmgSpeed: 2,
      lookFrequency: 27 + Math.floor(17 * Math.random()),
      acceleration: 0.0015 * (1 + 0.3 * Math.random()),
      range: 600 * (1 + 0.2 * Math.random()),
      followRange: 150 + Math.floor(30 * Math.random()),
      offPlayer: {
        x: 0,
        y: 0,
      },
      endCycle: Infinity,
      classType: "bullet",
      collisionFilter: {
        category: cat.bullet,
        mask: cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet | cat.mobShield
      },
      lockedOn: null,
      onDmg() {
        this.lockedOn = null
      },
      onEnd() {},
      do() {
        //move in a circle
        // const radius = 1.5
        // this.offPlayer.x -= radius * Math.cos(game.cycle * 0.02)
        // this.offPlayer.y -= radius * Math.sin(game.cycle * 0.02)

        const playerPos = Vector.add(Vector.add(this.offPlayer, mech.pos), Vector.mult(player.velocity, 20)) //also include an offset unique to this bot to keep many bots spread out
        const farAway = Math.max(0, (Vector.magnitude(Vector.sub(this.position, playerPos))) / this.followRange) //linear bounding well 
        const mag = Math.min(farAway, 4) * this.mass * this.acceleration
        this.force = Vector.mult(Vector.normalise(Vector.sub(playerPos, this.position)), mag)
        //manual friction to not lose rotational velocity
        Matter.Body.setVelocity(this, {
          x: this.velocity.x * 0.95,
          y: this.velocity.y * 0.95
        });

        //find targets
        if (!(game.cycle % this.lookFrequency) && !mech.isStealth) {
          this.lockedOn = null;
          let closeDist = this.range;
          for (let i = 0, len = mob.length; i < len; ++i) {
            const DIST = Vector.magnitude(Vector.sub(this.vertices[0], mob[i].position));
            if (DIST - mob[i].radius < closeDist &&
              !mob[i].isShielded &&
              Matter.Query.ray(map, this.vertices[0], mob[i].position).length === 0 &&
              Matter.Query.ray(body, this.vertices[0], mob[i].position).length === 0) {
              closeDist = DIST;
              this.lockedOn = mob[i]
            }
          }

          //randomize position relative to player
          if (Math.random() < 0.15) {
            this.offPlayer = {
              x: 100 * (Math.random() - 0.5),
              y: 90 * (Math.random() - 0.5),
            }
          }
        }

        //hit target with laser
        if (this.lockedOn && this.lockedOn.alive && mech.energy > 0.15) {
          mech.energy -= 0.0014
          //make sure you can still see vertex
          const DIST = Vector.magnitude(Vector.sub(this.vertices[0], this.lockedOn.position));
          if (DIST - this.lockedOn.radius < this.range + 150 &&
            Matter.Query.ray(map, this.vertices[0], this.lockedOn.position).length === 0 &&
            Matter.Query.ray(body, this.vertices[0], this.lockedOn.position).length === 0) {
            //move towards the target
            this.force = Vector.add(this.force, Vector.mult(Vector.normalise(Vector.sub(this.lockedOn.position, this.position)), 0.0013))

            //find the closest vertex
            let bestVertexDistance = Infinity
            let bestVertex = null
            for (let i = 0; i < this.lockedOn.vertices.length; i++) {
              const dist = Vector.magnitude(Vector.sub(this.vertices[0], this.lockedOn.vertices[i]));
              if (dist < bestVertexDistance) {
                bestVertex = i
                bestVertexDistance = dist
              }
            }
            const dmg = b.dmgScale * 0.05;
            this.lockedOn.damage(dmg);
            this.lockedOn.locatePlayer();

            ctx.beginPath(); //draw laser
            ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
            ctx.lineTo(this.lockedOn.vertices[bestVertex].x, this.lockedOn.vertices[bestVertex].y);
            ctx.strokeStyle = "#f00";
            ctx.lineWidth = "2"
            ctx.lineDashOffset = 300 * Math.random()
            ctx.setLineDash([50 + 100 * Math.random(), 100 * Math.random()]);
            ctx.stroke();
            ctx.setLineDash([0, 0]);
            ctx.beginPath();
            ctx.arc(this.lockedOn.vertices[bestVertex].x, this.lockedOn.vertices[bestVertex].y, Math.sqrt(dmg) * 100, 0, 2 * Math.PI);
            ctx.fillStyle = "#f00";
            ctx.fill();
          }
        }
      }
    })
    World.add(engine.world, bullet[me]); //add bullet to world
    Matter.Body.setVelocity(bullet[me], {
      x: speed * Math.cos(dir),
      y: speed * Math.sin(dir)
    });
  },
  giveGuns(gun = "random", ammoPacks = 6) {
    if (gun === "random") {
      //find what guns player doesn't have
      options = []
      for (let i = 0, len = b.guns.length; i < len; i++) {
        if (!b.guns[i].have) options.push(i)
      }
      if (options.length === 0) return
      //randomly pick from list of possible guns
      gun = options[Math.floor(Math.random() * options.length)]
    }
    if (gun === "all") {
      b.activeGun = 0;
      b.inventoryGun = 0;
      for (let i = 0; i < b.guns.length; i++) {
        b.inventory[i] = i;
        b.guns[i].have = true;
        b.guns[i].ammo = Math.floor(b.guns[i].ammoPack * ammoPacks);
      }
    } else {
      if (isNaN(gun)) { //find gun by name
        for (let i = 0; i < b.guns.length; i++) {
          if (gun === b.guns[i].name) gun = i
        }
      }
      if (!b.guns[gun].have) b.inventory.push(gun);
      b.guns[gun].have = true;
      b.guns[gun].ammo = Math.floor(b.guns[gun].ammoPack * ammoPacks);
      if (b.activeGun === null) b.activeGun = gun //if no active gun switch to new gun
    }
    game.makeGunHUD();
  },
  guns: [{
      name: "minigun", //0
      description: "<strong>rapidly</strong> fire a stream of small <strong>bullets</strong>",
      ammo: 0,
      ammoPack: 65,
      defaultAmmoPack: 65,
      recordedAmmo: 0,
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle + (Math.random() - 0.5) * ((mech.crouch) ? 0.03 : 0.1);
        bullet[me] = Bodies.rectangle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20 * b.modBulletSize, 6 * b.modBulletSize, b.fireAttributes(dir));
        b.fireProps(mech.crouch ? 8 : 4, mech.crouch ? 52 : 38, dir, me); //cd , speed
        bullet[me].endCycle = game.cycle + 70;
        bullet[me].dmg = 0.07;
        bullet[me].frictionAir = mech.crouch ? 0.007 : 0.01;
        if (b.isModIceCrystals && mech.energy > 0.01) {
          mech.energy -= mech.fieldRegen + 0.007
          bullet[me].onDmg = function (who) {
            mobs.statusSlow(who, 30)
          };
          //ice muzzleFlash
          ctx.fillStyle = "rgb(0,100,255)";

          ctx.beginPath();
          ctx.arc(mech.pos.x + 35 * Math.cos(mech.angle), mech.pos.y + 35 * Math.sin(mech.angle), 15, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          b.muzzleFlash(15);
        }
        bullet[me].do = function () {
          this.force.y += this.mass * 0.0005;
        };
      }
    },
    {
      name: "shotgun", //1
      description: "fire a <strong>burst</strong> of short range bullets<br><em>crouch to reduce recoil</em>",
      ammo: 0,
      ammoPack: 11,
      have: false,
      isStarterGun: true,
      isEasyToAim: true,
      fire() {
        let knock, spread
        if (mech.crouch) {
          mech.fireCDcycle = mech.cycle + Math.floor(55 * b.modFireRate); // cool down
          spread = 0.75
          knock = 0.01 * b.modBulletSize * b.modBulletSize
        } else {
          mech.fireCDcycle = mech.cycle + Math.floor(45 * b.modFireRate); // cool down
          spread = 1.3
          knock = 0.08 * b.modBulletSize * b.modBulletSize
        }
        player.force.x -= knock * Math.cos(mech.angle)
        player.force.y -= knock * Math.sin(mech.angle) * 0.3 //reduce knock back in vertical direction to stop super jumps
        if (b.isModShotgunImmune) mech.collisionImmuneCycle = mech.cycle + 60; //player is immune to collision damage for 30 cycles
        b.muzzleFlash(35);
        const side = 19 * b.modBulletSize
        for (let i = 0; i < 15; i++) {
          const me = bullet.length;
          const dir = mech.angle + (Math.random() - 0.5) * spread
          bullet[me] = Bodies.rectangle(mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5), mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5), side, side, b.fireAttributes(dir));
          World.add(engine.world, bullet[me]); //add bullet to world
          const SPEED = 50 + Math.random() * 10
          Matter.Body.setVelocity(bullet[me], {
            x: SPEED * Math.cos(dir),
            y: SPEED * Math.sin(dir)
          });
          bullet[me].endCycle = game.cycle + 40
          bullet[me].minDmgSpeed = 20
          // bullet[me].dmg = 0.1
          bullet[me].frictionAir = 0.034;
          bullet[me].do = function () {
            if (!mech.isBodiesAsleep) {
              const scale = 1 - 0.035 / b.isModBulletsLastLonger
              Matter.Body.scale(this, scale, scale);
            }
          };
        }
      }
    },
    {
      name: "super balls", //2
      description: "fire <strong>four</strong> balls in a wide arc<br>balls <strong>bounce</strong> with no momentum loss",
      ammo: 0,
      ammoPack: 14,
      have: false,
      num: 5,
      isStarterGun: true,
      isEasyToAim: true,
      fire() {
        const SPEED = mech.crouch ? 40 : 30
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 28 : 20) * b.modFireRate); // cool down
        if (b.modOneSuperBall) {
          let dir = mech.angle
          const me = bullet.length;
          bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 20 * b.modBulletSize, b.fireAttributes(dir, false));
          World.add(engine.world, bullet[me]); //add bullet to world
          Matter.Body.setVelocity(bullet[me], {
            x: SPEED * Math.cos(dir),
            y: SPEED * Math.sin(dir)
          });
          // Matter.Body.setDensity(bullet[me], 0.0001);
          bullet[me].endCycle = game.cycle + Math.floor((300 + 60 * Math.random()) * b.isModBulletsLastLonger);
          bullet[me].minDmgSpeed = 0;
          bullet[me].restitution = 0.999;
          bullet[me].friction = 0;
          bullet[me].do = function () {
            this.force.y += this.mass * 0.001;
          };
          bullet[me].onDmg = function (who) {
            mobs.statusStun(who, 180) // (2.3) * 2 / 14 ticks (2x damage over 7 seconds)
          };
        } else {
          b.muzzleFlash(20);
          const SPREAD = mech.crouch ? 0.08 : 0.15
          let dir = mech.angle - SPREAD * (b.modSuperBallNumber - 1) / 2;
          for (let i = 0; i < b.modSuperBallNumber; i++) {
            const me = bullet.length;
            bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 12, 7 * b.modBulletSize, b.fireAttributes(dir, false));
            World.add(engine.world, bullet[me]); //add bullet to world
            Matter.Body.setVelocity(bullet[me], {
              x: SPEED * Math.cos(dir),
              y: SPEED * Math.sin(dir)
            });
            // Matter.Body.setDensity(bullet[me], 0.0001);
            bullet[me].endCycle = game.cycle + Math.floor((300 + 60 * Math.random()) * b.isModBulletsLastLonger);
            bullet[me].minDmgSpeed = 0;
            bullet[me].restitution = 0.99;
            bullet[me].friction = 0;
            bullet[me].do = function () {
              this.force.y += this.mass * 0.001;
            };
            dir += SPREAD;
          }
        }
      }
    },
    {
      name: "flechettes", //3
      description: "fire a volley of <strong class='color-p'>uranium-235</strong> <strong>needles</strong><br>does <strong class='color-d'>damage</strong> over <strong>3</strong> seconds",
      ammo: 0,
      ammoPack: 23,
      defaultAmmoPack: 23,
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      count: 0, //used to track how many shots are in a volley before a big CD
      lastFireCycle: 0, //use to remember how longs its been since last fire, used to reset count
      fire() {
        const CD = (mech.crouch) ? 45 : 25
        if (this.lastFireCycle + CD < mech.cycle) this.count = 0 //reset count if it cycles past the CD
        this.lastFireCycle = mech.cycle
        if (this.count > ((mech.crouch) ? 6 : 1)) {
          this.count = 0
          mech.fireCDcycle = mech.cycle + Math.floor(CD * b.modFireRate); // cool down
        } else {
          this.count++
          mech.fireCDcycle = mech.cycle + Math.floor(2 * b.modFireRate); // cool down
        }

        function makeFlechette(angle = mech.angle) {
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(mech.angle), mech.pos.y + 40 * Math.sin(mech.angle), 45, 1.4, b.fireAttributes(angle));
          // Matter.Body.setDensity(bullet[me], 0.0001); //0.001 is normal
          bullet[me].endCycle = game.cycle + 180;
          bullet[me].dmg = 0;
          bullet[me].onDmg = function (who) {
            if (b.isModDotFlechette) {
              mobs.statusDoT(who, 0.33, 360) // (2.3) * 2 / 14 ticks (2x damage over 7 seconds)
            } else {
              mobs.statusDoT(who, 0.33, 180) // (2.3) / 6 ticks (3 seconds)
            }
          };

          bullet[me].do = function () {
            if (this.speed < 10) this.force.y += this.mass * 0.0003; //no gravity until it slows don to improve aiming
          };
          const SPEED = 50
          Matter.Body.setVelocity(bullet[me], {
            x: mech.Vx / 2 + SPEED * Math.cos(angle),
            y: mech.Vy / 2 + SPEED * Math.sin(angle)
          });
          World.add(engine.world, bullet[me]); //add bullet to world
        }
        makeFlechette()
        if (b.isModFlechetteMultiShot) {
          makeFlechette(mech.angle + 0.01 + 0.01 * Math.random())
          makeFlechette(mech.angle - 0.01 - 0.01 * Math.random())
        }
      }
    },
    {
      name: "wave beam", //4
      description: "emit a <strong>sine wave</strong> of oscillating particles<br>particles <strong>slowly</strong> propagate through <strong>solids</strong>",
      ammo: 0,
      ammoPack: 110,
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      fire() {
        mech.fireCDcycle = mech.cycle + Math.floor(3 * b.modFireRate); // cool down
        const dir = mech.angle
        const SPEED = 10
        const wiggleMag = mech.crouch ? 6 : 12
        const size = 5 * (b.modWaveHelix === 1 ? 1 : 0.7)
        for (let i = 0; i < b.modWaveHelix; i++) {
          const me = bullet.length;
          bullet[me] = Bodies.polygon(mech.pos.x + 25 * Math.cos(dir), mech.pos.y + 25 * Math.sin(dir), 7, size, {
            angle: dir,
            cycle: -0.5,
            endCycle: game.cycle + Math.floor((b.isModWaveReflect ? 480 : 120) * b.isModBulletsLastLonger),
            inertia: Infinity,
            frictionAir: 0,
            slow: 0,
            minDmgSpeed: 0,
            dmg: 0,
            isJustReflected: false,
            classType: "bullet",
            collisionFilter: {
              category: 0,
              mask: 0, //cat.mob | cat.mobBullet | cat.mobShield
            },
            onDmg() {},
            onEnd() {},
            do() {
              if (!mech.isBodiesAsleep) {
                let slowCheck = 1;
                if (Matter.Query.point(map, this.position).length) { //check if inside map
                  slowCheck = b.modWaveSpeedMap
                } else { //check if inside a body
                  let q = Matter.Query.point(body, this.position)
                  if (q.length) {
                    slowCheck = b.modWaveSpeedBody
                    Matter.Body.setPosition(this, Vector.add(this.position, q[0].velocity)) //move with the medium
                  } else { // check if inside a mob
                    q = Matter.Query.point(mob, this.position)
                    for (let i = 0; i < q.length; i++) {
                      slowCheck = 0.3;
                      Matter.Body.setPosition(this, Vector.add(this.position, q[i].velocity)) //move with the medium
                      let dmg = b.dmgScale * 0.43 / Math.sqrt(q[i].mass) * (b.modWaveHelix === 1 ? 1 : 0.6) //1 - 0.4 = 0.6 for helix mod 40% damage reduction
                      q[i].damage(dmg);
                      q[i].foundPlayer();
                      game.drawList.push({ //add dmg to draw queue
                        x: this.position.x,
                        y: this.position.y,
                        radius: Math.log(2 * dmg + 1.1) * 40,
                        color: 'rgba(0,0,0,0.4)',
                        time: game.drawTime
                      });
                    }
                  }
                }
                if (slowCheck !== this.slow) { //toggle velocity based on inside and outside status change
                  this.slow = slowCheck
                  Matter.Body.setVelocity(this, Vector.mult(Vector.normalise(this.velocity), SPEED * slowCheck));
                }
                this.cycle++
                const wiggle = Vector.mult(transverse, wiggleMag * Math.cos(this.cycle * 0.35) * ((i % 2) ? -1 : 1))
                Matter.Body.setPosition(this, Vector.add(this.position, wiggle))
              }
              // if (b.isModWaveReflect) { //single reflection
              //   const sub = Vector.sub(this.position, mech.pos)
              //   if (Vector.magnitude(sub) > 630) {
              //     // Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(Vector.normalise(sub), -2 * POCKET_RANGE))) //teleport to opposite side
              //     if (!this.isJustReflected) {
              //       Matter.Body.setVelocity(this, Vector.mult(this.velocity, -1)); //reflect
              //       this.isJustReflected = true;
              //     }
              //   }
              // }

              if (b.isModWaveReflect) {
                Matter.Body.setPosition(this, Vector.add(this.position, player.velocity)) //bullets move with player
                const sub = Vector.sub(this.position, mech.pos)
                if (Vector.magnitude(sub) > 630) {
                  Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(Vector.normalise(sub), -2 * 630))) //teleport to opposite side
                }
              }

              // if (b.isModWaveReflect) {
              //   Matter.Body.setPosition(this, Vector.add(this.position, player.velocity))  //bullets move with player

              // Matter.Body.setPosition(this, Vector.add(this.position, Vector.mult(Vector.normalise(sub), -2 * POCKET_RANGE))) //teleport to opposite side

              // const sub = Vector.sub(this.position, mech.pos)
              // if (Vector.magnitude(sub) > 630) {  
              //   if (!this.isJustReflected) {
              //     Matter.Body.setVelocity(this, Vector.mult(this.velocity, -1)); //reflect
              //     this.isJustReflected = true;
              //   }
              // } else {
              //   this.isJustReflected = false
              // }
              // }
            }
          });
          World.add(engine.world, bullet[me]); //add bullet to world
          Matter.Body.setVelocity(bullet[me], {
            x: SPEED * Math.cos(dir),
            y: SPEED * Math.sin(dir)
          });
          const transverse = Vector.normalise(Vector.perp(bullet[me].velocity))
        }
      }
    },
    {
      name: "missiles",
      description: "fire missiles that <strong>accelerate</strong> towards <strong>mobs</strong><br><strong class='color-e'>explodes</strong> when near target",
      ammo: 0,
      ammoPack: 4,
      have: false,
      isStarterGun: false,
      isEasyToAim: true,
      fireCycle: 0,
      ammoLoaded: 0,
      fire() {
        mech.fireCDcycle = mech.cycle + Math.floor(mech.crouch ? 50 : 25); // cool down
        b.missile({
            x: mech.pos.x + 40 * Math.cos(mech.angle),
            y: mech.pos.y + 40 * Math.sin(mech.angle) - 3
          },
          mech.angle + (0.5 - Math.random()) * (mech.crouch ? 0 : 0.2),
          -3 * (0.5 - Math.random()) + (mech.crouch ? 25 : -8) * b.modFireRate,
          1, b.modBabyMissiles)
        bullet[bullet.length - 1].force.y += 0.0006; //a small push down at first to make it seem like the missile is briefly falling
      }
    },
    {
      name: "flak",
      description: "fire a <strong>cluster</strong> of short range <strong>projectiles</strong><br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after half a second",
      ammo: 0,
      ammoPack: 6,
      defaultAmmoPack: 6, //use to revert ammoPack after mod changes drop rate
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      fire() {
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 25 : 10) * b.modFireRate); // cool down
        b.muzzleFlash(30);
        const SPEED = mech.crouch ? 29 : 25
        const END = Math.floor(mech.crouch ? 30 : 18);
        const side1 = 17
        const side2 = 4
        const totalBullets = 6
        const angleStep = (mech.crouch ? 0.06 : 0.25) / totalBullets
        let dir = mech.angle - angleStep * totalBullets / 2;

        for (let i = 0; i < totalBullets; i++) { //5 -> 7
          dir += angleStep
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), side1, side2, b.fireAttributes(dir));
          World.add(engine.world, bullet[me]); //add bullet to world
          Matter.Body.setVelocity(bullet[me], {
            x: (SPEED + 15 * Math.random() - 2 * i) * Math.cos(dir),
            y: (SPEED + 15 * Math.random() - 2 * i) * Math.sin(dir)
          });

          bullet[me].endCycle = 2 * i + game.cycle + END
          bullet[me].restitution = 0;
          bullet[me].friction = 1;
          bullet[me].explodeRad = (mech.crouch ? 95 : 75) + (Math.random() - 0.5) * 50;
          bullet[me].onEnd = function () {
            b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
          }
          bullet[me].onDmg = function () {
            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
          };
          bullet[me].do = function () {
            this.force.y += this.mass * 0.0004;
          }
        }
      }
    },
    {
      name: "grenades", //7
      description: "lob a single <strong>bouncy</strong> projectile<br><strong class='color-e'>explodes</strong> on <strong>contact</strong> or after one second",
      ammo: 0,
      ammoPack: 7,
      have: false,
      isStarterGun: false,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle; // + Math.random() * 0.05;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20, b.fireAttributes(dir, true));
        b.fireProps(mech.crouch ? 30 : 20, mech.crouch ? 43 : 32, dir, me); //cd , speed
        Matter.Body.setDensity(bullet[me], 0.0005);
        bullet[me].totalCycles = 100;
        bullet[me].endCycle = game.cycle + Math.floor(mech.crouch ? 120 : 80);
        bullet[me].restitution = 0.2;
        bullet[me].explodeRad = 275;
        bullet[me].onEnd = function () {
          b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end
          if (b.modGrenadeFragments) {
            const targets = [] //target nearby mobs
            for (let i = 0, len = mob.length; i < len; i++) {
              if (mob[i].dropPowerUp) {
                const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                if (dist < 1440000 && //1200*1200
                  Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                  Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                  targets.push(Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))) //predict where the mob will be in a few cycles
                }
              }
            }
            for (let i = 0; i < b.modGrenadeFragments; i++) {
              const speed = 53 + 10 * Math.random()
              if (targets.length > 0) { // aim near a random target in array
                const index = Math.floor(Math.random() * targets.length)
                const SPREAD = 150 / targets.length
                const WHERE = {
                  x: targets[index].x + SPREAD * (Math.random() - 0.5),
                  y: targets[index].y + SPREAD * (Math.random() - 0.5)
                }
                b.nail(this.position, Vector.mult(Vector.normalise(Vector.sub(WHERE, this.position)), speed), 1.1)
              } else { // aim in random direction
                const ANGLE = 2 * Math.PI * Math.random()
                b.nail(this.position, {
                  x: speed * Math.cos(ANGLE),
                  y: speed * Math.sin(ANGLE)
                })
              }
            }
          }
        }
        bullet[me].minDmgSpeed = 1;
        bullet[me].onDmg = function () {
          this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
        };
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.0025;
        };
      }
    },
    {
      name: "vacuum bomb", //8
      description: "fire a bomb that <strong>sucks</strong> before <strong class='color-e'>exploding</strong><br><strong>click</strong> left mouse again to <strong>detonate</strong>",
      ammo: 0,
      ammoPack: 3,
      have: false,
      isStarterGun: false,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 35, b.fireAttributes(dir, false));
        b.fireProps(10, mech.crouch ? 42 : 28, dir, me); //cd , speed

        Matter.Body.setDensity(bullet[me], 0.0002);
        bullet[me].restitution = 0.2;
        bullet[me].friction = 0.3;
        bullet[me].endCycle = Infinity
        bullet[me].explodeRad = 440 + Math.floor(Math.random() * 30);
        bullet[me].onEnd = function () {
          b.explosion(this.position, this.explodeRad); //makes bullet do explosive damage at end

          //also damage all mobs
          if (b.isModVacuumShield) {
            for (let i = 0, len = mob.length; i < len; ++i) {
              if (mob[i].shield) {
                const dist = Vector.magnitude(Vector.sub(this.position, mob[i].position)) - mob[i].radius;
                if (dist < this.explodeRad) mob[i].damage(Infinity);
              } else if (mob[i].alive && !mob[i].isShielded) {
                const dist = Vector.magnitude(Vector.sub(this.position, mob[i].position)) - mob[i].radius;
                if (dist < this.explodeRad) mob[i].damage(0.8 * b.dmgScale);
              }
            }
          }
        }
        bullet[me].onDmg = function () {
          // this.endCycle = 0; //bullet ends cycle after doing damage  //this triggers explosion
        };
        bullet[me].radius = 22; //used from drawing timer
        bullet[me].isArmed = false;
        bullet[me].isSucking = false;
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.0022;

          //set armed and sucking status
          if (!this.isArmed && !game.mouseDown) {
            this.isArmed = true
          } else if (this.isArmed && game.mouseDown && !this.isSucking) {
            this.isSucking = true;
            this.endCycle = game.cycle + 50;
          }

          if (this.isSucking) {
            if (!mech.isBodiesAsleep) {
              const that = this
              let mag = 0.1

              function suck(who, radius = that.explodeRad * 3.5) {
                for (i = 0, len = who.length; i < len; i++) {
                  const sub = Vector.sub(that.position, who[i].position);
                  const dist = Vector.magnitude(sub);
                  if (dist < radius && dist > 150) {
                    knock = Vector.mult(Vector.normalise(sub), mag * who[i].mass / Math.sqrt(dist));
                    who[i].force.x += knock.x;
                    who[i].force.y += knock.y;
                  }
                }
              }
              if (game.cycle > this.endCycle - 5) {
                mag = -0.22
                suck(mob, this.explodeRad * 3)
                suck(body, this.explodeRad * 2)
                suck(powerUp, this.explodeRad * 1.5)
                suck(bullet, this.explodeRad * 1.5)
                suck([player], this.explodeRad * 1.5)
              } else {
                mag = 0.1
                suck(mob, this.explodeRad * 3)
                suck(body, this.explodeRad * 2)
                suck(powerUp, this.explodeRad * 1.5)
                suck(bullet, this.explodeRad * 1.5)
                suck([player], this.explodeRad * 1.5)
              }
              //keep bomb in place
              Matter.Body.setVelocity(this, {
                x: 0,
                y: 0
              });
              //draw suck
              const radius = 3 * this.explodeRad * (this.endCycle - game.cycle) / 50
              ctx.fillStyle = "rgba(0,0,0,0.1)";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
              ctx.fill();
            }
          } else {
            mech.fireCDcycle = mech.cycle + 10 //can't fire until after the explosion

            // flashing lights to show armed
            if (!(game.cycle % 10)) {
              if (this.isFlashOn) {
                this.isFlashOn = false;
              } else {
                this.isFlashOn = true;
              }
            }
            if (this.isFlashOn) {
              ctx.fillStyle = "#000";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
              ctx.fill();
              //draw clock on timer
              ctx.fillStyle = "#f04";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, this.radius * 0.7, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }
    },
    {
      name: "mine", //9
      description: "toss a <strong>proximity</strong> mine that <strong>sticks</strong> to walls<br>fires <strong>nails</strong> at mobs within range",
      ammo: 0,
      ammoPack: 3,
      have: false,
      isStarterGun: false,
      isEasyToAim: true,
      fire() {
        const speed = mech.crouch ? 36 : 22
        b.mine({
          x: mech.pos.x + 30 * Math.cos(mech.angle),
          y: mech.pos.y + 30 * Math.sin(mech.angle)
        }, {
          x: speed * Math.cos(mech.angle),
          y: speed * Math.sin(mech.angle)
        }, 0, b.isModMineAmmoBack)
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 70 : 45) * b.modFireRate); // cool down
      }
    },
    {
      name: "spores", //10
      description: "fire a <strong>sporangium</strong> that discharges <strong class='color-p' style='letter-spacing: 2px;'>spores</strong>",
      ammo: 0,
      ammoPack: (game.difficultyMode > 3) ? 3 : 4,
      have: false,
      isStarterGun: false,
      isEasyToAim: true,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20, 4.5, b.fireAttributes(dir, false));
        b.fireProps(mech.crouch ? 60 : 40, mech.crouch ? 28 : 14, dir, me); //cd , speed
        Matter.Body.setDensity(bullet[me], 0.000001);
        bullet[me].endCycle = game.cycle + 80;
        bullet[me].frictionAir = 0;
        bullet[me].friction = 0.5;
        bullet[me].restitution = 0.3;
        bullet[me].minDmgSpeed = 0;
        bullet[me].onDmg = function () {};
        bullet[me].do = function () {
          if (!mech.isBodiesAsleep) {
            const SCALE = 1.022
            Matter.Body.scale(this, SCALE, SCALE);
            this.frictionAir += 0.00023;
          }

          this.force.y += this.mass * 0.00045;

          //draw green glow
          ctx.fillStyle = "rgba(0,200,125,0.16)";
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, 26, 0, 2 * Math.PI);
          ctx.fill();
        };

        //spawn bullets on end
        bullet[me].onEnd = function () {
          const NUM = 10;
          for (let i = 0; i < NUM; i++) {
            b.spore(this)
          }
        }

      }
    },
    {
      name: "drones", //11
      description: "deploy drones that <strong>crash</strong> into mobs<br>collisions reduce their <strong>lifespan</strong> by 1 second",
      ammo: 0,
      ammoPack: 12,
      have: false,
      isStarterGun: true,
      isEasyToAim: true,
      fire() {
        b.drone(mech.crouch ? 45 : 1)
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 25 : 5) * b.modFireRate); // cool down
      }
    },
    {
      name: "ice IX", //11
      description: "synthesize <strong>short-lived</strong> ice crystals<br>crystals <strong>seek</strong> out and <strong class='color-s'>freeze</strong> mobs",
      ammo: 0,
      ammoPack: 80,
      have: false,
      isStarterGun: true,
      isEasyToAim: true,
      fire() {
        if (mech.crouch) {
          b.iceIX(20, 0.3)
          mech.fireCDcycle = mech.cycle + Math.floor(10 * b.modFireRate); // cool down
        } else {
          b.iceIX(2)
          mech.fireCDcycle = mech.cycle + Math.floor(3 * b.modFireRate); // cool down
        }

      }
    },
    {
      name: "foam", //12
      description: "spray bubbly foam that <strong>sticks</strong> to mobs<br><strong class='color-s'>slows</strong> mobs and does <strong class='color-d'>damage</strong> over time",
      ammo: 0,
      ammoPack: 35,
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      fire() {
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 12 : 5) * b.modFireRate); // cool down
        const me = bullet.length;
        const dir = mech.angle + 0.2 * (Math.random() - 0.5)
        const RADIUS = (8 + 16 * Math.random())
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 25, RADIUS, {
          angle: dir,
          density: 0.00005, //  0.001 is normal density
          inertia: Infinity,
          frictionAir: 0.003,
          friction: 0.2,
          restitution: 0.2,
          dmg: 0.1, //damage done in addition to the damage from momentum
          classType: "bullet",
          collisionFilter: {
            category: cat.bullet,
            mask: cat.map | cat.body | cat.mob | cat.mobShield
          },
          minDmgSpeed: 0,
          endCycle: Infinity,
          count: 0,
          radius: RADIUS,
          target: null,
          targetVertex: null,
          onDmg(who) {
            if (!this.target && who.alive && (who.dropPowerUp || b.isModFoamShieldHit) && (!who.isShielded || b.isModFoamShieldHit)) {
              this.target = who;
              this.collisionFilter.category = cat.body;
              this.collisionFilter.mask = null;

              let bestVertexDistance = Infinity
              let bestVertex = null
              for (let i = 0; i < this.target.vertices.length; i++) {
                const dist = Vector.magnitude(Vector.sub(this.position, this.target.vertices[i]));
                if (dist < bestVertexDistance) {
                  bestVertex = i
                  bestVertexDistance = dist
                }
              }
              this.targetVertex = bestVertex
            }
          },
          onEnd() {},
          do() {
            // ctx.beginPath() //draw white circle
            // ctx.arc(this.position.x, this.position.y, this.radius * 0.97 - 1.6, 0, 2 * Math.PI);
            // ctx.fillStyle = "#fff"
            // ctx.fill()

            if (!mech.isBodiesAsleep) { //if time dilation isn't active
              this.force.y += this.mass * 0.00006; //gravity

              if (this.count < 17) {
                this.count++
                //grow
                const SCALE = 1.08
                Matter.Body.scale(this, SCALE, SCALE);
                this.radius *= SCALE;
              } else {
                //shrink
                const SCALE = 1 - 0.0035 / b.isModBulletsLastLonger
                Matter.Body.scale(this, SCALE, SCALE);
                this.radius *= SCALE;
                if (this.radius < 14) this.endCycle = 0;
              }

              if (this.target && this.target.alive) { //if stuck to a target
                Matter.Body.setPosition(this, this.target.vertices[this.targetVertex])
                Matter.Body.setVelocity(this.target, Vector.mult(this.target.velocity, 0.9))
                Matter.Body.setAngularVelocity(this.target, this.target.angularVelocity * 0.9)
                if (this.target.isShielded) {
                  this.target.damage(b.dmgScale * 0.001);
                } else {
                  this.target.damage(b.dmgScale * 0.005);
                }

              } else if (this.target !== null) { //look for a new target
                this.target = null
                this.collisionFilter.category = cat.bullet;
                this.collisionFilter.mask = cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
              }
            }
          }
        });
        World.add(engine.world, bullet[me]); //add bullet to world
        const SPEED = mech.crouch ? 22 : 12 - RADIUS * 0.25;
        Matter.Body.setVelocity(bullet[me], {
          x: SPEED * Math.cos(dir),
          y: SPEED * Math.sin(dir)
        });
      }
    },
    {
      name: "rail gun", //13
      description: "use <strong class='color-f'>energy</strong> to launch a high-speed <strong>dense</strong> rod<br><strong>hold</strong> left mouse to charge, <strong>release</strong> to fire",
      ammo: 0,
      ammoPack: 4,
      have: false,
      isStarterGun: false,
      isEasyToAim: false,
      fire() {
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(0, 0, 0.015, 0.0015, {
          density: 0.01, //0.001 is normal
          //frictionAir: 0.01,			//restitution: 0,
          // angle: 0,
          // friction: 0.5,
          frictionAir: 0,
          dmg: 0, //damage done in addition to the damage from momentum
          classType: "bullet",
          collisionFilter: {
            category: 0,
            mask: cat.map | cat.body | cat.mob | cat.mobBullet | cat.mobShield
          },
          minDmgSpeed: 5,
          onDmg(who) {
            if (who.shield) {
              for (let i = 0, len = mob.length; i < len; i++) {
                if (mob[i].id === who.shieldTargetID) { //apply some knock back to shield mob before shield breaks
                  const force = Matter.Vector.mult(this.velocity, 15 / mob[i].mass)
                  Matter.Body.setVelocity(mob[i], {
                    x: mob[i].velocity.x + force.x,
                    y: mob[i].velocity.y + force.y
                  });
                  break
                }
              }
              Matter.Body.setVelocity(this, {
                x: -0.1 * this.velocity.x,
                y: -0.1 * this.velocity.y
              });
              Matter.Body.setDensity(this, 0.001);
            }
            if (b.isModRailNails && this.speed > 10) {
              const targets = [] //target nearby mobs
              for (let i = 0, len = mob.length; i < len; i++) {
                if (mob[i].dropPowerUp) {
                  const dist = Vector.magnitudeSquared(Vector.sub(this.position, mob[i].position));
                  if (dist < 1000000 && //1000*1000
                    Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                    Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                    targets.push(Vector.add(mob[i].position, Vector.mult(mob[i].velocity, Math.sqrt(dist) / 60))) //predict where the mob will be in a few cycles
                  }
                }
              }
              for (let i = 0; i < this.speed - 10; i++) {
                const speed = 50 + 10 * Math.random()
                if (targets.length > 0) { // aim near a random target in array
                  const index = Math.floor(Math.random() * targets.length)
                  const SPREAD = 150 / targets.length
                  const WHERE = {
                    x: targets[index].x + SPREAD * (Math.random() - 0.5),
                    y: targets[index].y + SPREAD * (Math.random() - 0.5)
                  }
                  b.nail(this.position, Vector.mult(Vector.normalise(Vector.sub(WHERE, this.position)), speed), 1.1)
                } else { // aim in random direction
                  const ANGLE = 2 * Math.PI * Math.random()
                  b.nail(this.position, {
                    x: speed * Math.cos(ANGLE),
                    y: speed * Math.sin(ANGLE)
                  })
                }
              }
              this.endCycle = 0 //triggers despawn
            }
          },
          onEnd() {}
        });
        mech.fireCDcycle = Infinity; // cool down
        World.add(engine.world, bullet[me]); //add bullet to world
        bullet[me].endCycle = Infinity
        bullet[me].charge = 0;
        bullet[me].do = function () {
          if ((!game.mouseDown && this.charge > 0.6)) { //fire on mouse release
            //normal bullet behavior occurs after firing, overwrite this function
            this.do = function () {
              this.force.y += this.mass * 0.0003 / this.charge; // low gravity that scales with charge
            }

            mech.fireCDcycle = mech.cycle + 2; // set fire cool down
            Matter.Body.scale(this, 8000, 8000) // show the bullet by scaling it up  (don't judge me...  I know this is a bad way to do it)
            this.endCycle = game.cycle + 140
            this.collisionFilter.category = cat.bullet
            Matter.Body.setPosition(this, {
              x: mech.pos.x,
              y: mech.pos.y
            })
            Matter.Body.setAngle(this, mech.angle)
            const speed = 90
            Matter.Body.setVelocity(this, {
              x: mech.Vx / 2 + speed * this.charge * Math.cos(mech.angle),
              y: mech.Vy / 2 + speed * this.charge * Math.sin(mech.angle)
            });

            //knock back
            const KNOCK = ((mech.crouch) ? 0.1 : 0.5) * this.charge * this.charge
            player.force.x -= KNOCK * Math.cos(mech.angle)
            player.force.y -= KNOCK * Math.sin(mech.angle) * 0.35 //reduce knock back in vertical direction to stop super jumps

            //push away blocks when firing
            let range = 700 * this.charge
            for (let i = 0, len = body.length; i < len; ++i) {
              const SUB = Vector.sub(body[i].position, mech.pos)
              const DISTANCE = Vector.magnitude(SUB)

              if (DISTANCE < range) {
                const DEPTH = Math.min(range - DISTANCE, 300)
                const FORCE = Vector.mult(Vector.normalise(SUB), 0.003 * Math.sqrt(DEPTH) * body[i].mass)
                body[i].force.x += FORCE.x;
                body[i].force.y += FORCE.y - body[i].mass * (game.g * 1.5); //kick up a bit to give them some arc
              }
            }
            for (let i = 0, len = mob.length; i < len; ++i) {
              const SUB = Vector.sub(mob[i].position, mech.pos)
              const DISTANCE = Vector.magnitude(SUB)

              if (DISTANCE < range) {
                const DEPTH = Math.min(range - DISTANCE, 300)
                const FORCE = Vector.mult(Vector.normalise(SUB), 0.003 * Math.sqrt(DEPTH) * mob[i].mass)
                mob[i].force.x += 1.5 * FORCE.x;
                mob[i].force.y += 1.5 * FORCE.y;
              }
            }
          } else if (mech.energy > 0.005) { // charging on mouse down
            mech.fireCDcycle = Infinity //can't fire until mouse is released
            const lastCharge = this.charge
            let chargeRate = (mech.crouch) ? 0.975 : 0.987
            chargeRate *= Math.pow(b.modFireRate, 0.04)
            this.charge = this.charge * chargeRate + (1 - chargeRate) // this.charge converges to 1
            mech.energy -= (this.charge - lastCharge) * 0.28 //energy drain is proportional to charge gained, but doesn't stop normal mech.fieldRegen

            //draw targeting
            let best;
            let range = 3000
            const dir = mech.angle
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
                    if (dist2 < best.dist2) {
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
            }

            //draw beam
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            ctx.lineTo(path[1].x, path[1].y);
            ctx.strokeStyle = `rgba(100,0,180,0.7)`;
            ctx.lineWidth = this.charge * 1
            ctx.setLineDash([10, 20]);
            ctx.stroke();
            ctx.setLineDash([0, 0]);

            //draw magnetic field
            const X = mech.pos.x
            const Y = mech.pos.y
            const unitVector = Vector.normalise(Vector.sub(game.mouseInGame, mech.pos))
            const unitVectorPerp = Vector.perp(unitVector)

            function magField(mag, arc) {
              ctx.moveTo(X, Y);
              ctx.bezierCurveTo(
                X + unitVector.x * mag, Y + unitVector.y * mag,
                X + unitVector.x * mag + unitVectorPerp.x * arc, Y + unitVector.y * mag + unitVectorPerp.y * arc,
                X + unitVectorPerp.x * arc, Y + unitVectorPerp.y * arc)
              ctx.bezierCurveTo(
                X - unitVector.x * mag + unitVectorPerp.x * arc, Y - unitVector.y * mag + unitVectorPerp.y * arc,
                X - unitVector.x * mag, Y - unitVector.y * mag,
                X, Y)
            }
            ctx.fillStyle = `rgba(50,0,100,0.05)`;
            for (let i = 3; i < 7; i++) {
              const MAG = 8 * i * i * this.charge * (0.93 + 0.07 * Math.random())
              const ARC = 6 * i * i * this.charge * (0.93 + 0.07 * Math.random())
              ctx.beginPath();
              magField(MAG, ARC)
              magField(MAG, -ARC)
              ctx.fill();
            }
          }
        }
      }
    },
    {
      name: "laser", //14
      description: "emit a <strong>beam</strong> of collimated coherent <strong>light</strong><br>drains <strong class='color-f'>energy</strong> instead of ammunition",
      ammo: 0,
      ammoPack: Infinity,
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      fire() {
        const reflectivity = 1 - 1 / (b.modLaserReflections * 1.5)
        let damage = b.dmgScale * b.modLaserDamage
        if (mech.energy < b.modLaserFieldDrain) {
          mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
        } else {
          mech.energy -= mech.fieldRegen + b.modLaserFieldDrain
          let best = {
            x: null,
            y: null,
            dist2: Infinity,
            who: null,
            v1: null,
            v2: null
          };
          const color = "#f00";
          const range = 3000;
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

          const checkForCollisions = function () {
            best = {
              x: null,
              y: null,
              dist2: Infinity,
              who: null,
              v1: null,
              v2: null
            };
            vertexCollision(path[path.length - 2], path[path.length - 1], mob);
            vertexCollision(path[path.length - 2], path[path.length - 1], map);
            vertexCollision(path[path.length - 2], path[path.length - 1], body);
          };
          const laserHitMob = function () {
            if (best.who.alive) {
              best.who.damage(damage);
              best.who.locatePlayer();
              ctx.fillStyle = color; //draw mob damage circle
              ctx.beginPath();
              ctx.arc(path[path.length - 1].x, path[path.length - 1].y, Math.sqrt(damage) * 100, 0, 2 * Math.PI);
              ctx.fill();
            }
          };
          const reflection = function () { // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
            const n = Vector.perp(Vector.normalise(Vector.sub(best.v1, best.v2)));
            const d = Vector.sub(path[path.length - 1], path[path.length - 2]);
            const nn = Vector.mult(n, 2 * Vector.dot(d, n));
            const r = Vector.normalise(Vector.sub(d, nn));
            path[path.length] = Vector.add(Vector.mult(r, range), path[path.length - 1]);
          };

          checkForCollisions();
          let lastBestOdd
          let lastBestEven = best.who //used in hack below
          if (best.dist2 !== Infinity) {
            //if hitting something
            path[path.length - 1] = {
              x: best.x,
              y: best.y
            };
            laserHitMob();
            for (let i = 0; i < b.modLaserReflections; i++) {
              reflection();
              checkForCollisions();
              if (best.dist2 !== Infinity) { //if hitting something
                lastReflection = best

                path[path.length - 1] = {
                  x: best.x,
                  y: best.y
                };
                damage *= reflectivity
                laserHitMob();
                //I'm not clear on how this works, but it gets ride of a bug where the laser reflects inside a block, often vertically.
                //I think it checks to see if the laser is reflecting off a different part of the same block, if it is "inside" a block
                if (i % 2) {
                  if (lastBestOdd === best.who) break
                } else {
                  lastBestOdd = best.who
                  if (lastBestEven === best.who) break
                }
              } else {
                break
              }
            }
          }

          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.lineDashOffset = 300 * Math.random()
          ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
          for (let i = 1, len = path.length; i < len; ++i) {
            ctx.beginPath();
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
            ctx.globalAlpha *= reflectivity; //reflections are less intense
          }
          ctx.setLineDash([0, 0]);
          ctx.globalAlpha = 1;
        }
      }
    },
    {
      name: "pulse", //15
      description: "convert <strong>25%</strong> of your <strong class='color-f'>energy</strong> into a pulsed laser<br>instantly initiates a fusion <strong class='color-e'>explosion</strong>",
      ammo: 0,
      ammoPack: Infinity,
      have: false,
      isStarterGun: true,
      isEasyToAim: false,
      fire() {
        //calculate laser collision
        let best;
        let range = 3000
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
        }

        //use energy to explode
        const energy = 0.3 * Math.min(mech.energy, 1.75)
        mech.energy -= energy
        if (best.who) b.explosion(path[1], 1000 * energy, true)
        mech.fireCDcycle = mech.cycle + Math.floor(60 * b.modFireRate); // cool down

        //draw laser beam
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        ctx.lineTo(path[1].x, path[1].y);
        ctx.strokeStyle = "rgba(255,0,0,0.13)"
        ctx.lineWidth = 60 * energy / 0.2
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,0,0,0.2)"
        ctx.lineWidth = 18
        ctx.stroke();
        ctx.strokeStyle = "#f00";
        ctx.lineWidth = 4
        ctx.stroke();

        //draw little dots along the laser path
        const sub = Vector.sub(path[1], path[0])
        const mag = Vector.magnitude(sub)
        for (let i = 0, len = Math.floor(mag * 0.03 * energy / 0.2); i < len; i++) {
          const dist = Math.random()
          game.drawList.push({
            x: path[0].x + sub.x * dist + 13 * (Math.random() - 0.5),
            y: path[0].y + sub.y * dist + 13 * (Math.random() - 0.5),
            radius: 1 + 4 * Math.random(),
            color: "rgba(255,0,0,0.5)",
            time: Math.floor(2 + 33 * Math.random() * Math.random())
          });
        }
      }
    },
    // {
    //   name: "dwarf star", //14
    //   description: "drop a mine that gravitational pulls in matter",
    //   ammo: 0,
    //   ammoPack: 1000,
    //   have: false,
    //   isStarterGun: false,
    //   fire() {
    //     const me = bullet.length;
    //     const dir = mech.angle
    //     const TOTAL_CYCLES = 1020
    //     bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(dir), mech.pos.y + 30 * Math.sin(dir), 3 , {
    //       density: 0.05,
    //       //frictionAir: 0.01,			
    //       restitution: 0,
    //       angle: 0,
    //       friction: 1,
    //       // frictionAir: 1,
    //       endCycle: game.cycle + TOTAL_CYCLES,
    //       dmg: 0, //damage done in addition to the damage from momentum
    //       classType: "bullet",
    //       collisionFilter: {
    //         category: 0x000100,
    //         mask: 0x010011 //mask: 0x000101,  //for self collision
    //       },
    //       minDmgSpeed: 5,
    //       range: 0,
    //       onDmg() {
    //         this.endCycle = 0;
    //       }, //this.endCycle = 0  //triggers despawn
    //       onEnd() {},
    //       do() {
    //         this.force.y += this.mass * 0.005;
    //         this.range += 0.5

    //         //damage nearby mobs
    //         const dmg = b.dmgScale * 0.02
    //         for (let i = 0, len = mob.length; i < len; ++i) {
    //           if (mob[i].alive) {
    //             sub = Vector.sub(this.position, mob[i].position);
    //             dist = Vector.magnitude(sub) - mob[i].radius;
    //             if (dist < this.range) {
    //               mob[i].damage(dmg);
    //               mob[i].locatePlayer();
    //             }
    //           }
    //         }

    //         //pull in body, and power ups?, and bullets?
    //         for (let i = 0, len = body.length; i < len; ++i) {
    //           sub = Vector.sub(this.position, body[i].position);
    //           dist = Vector.magnitude(sub)
    //           if (dist < this.range) {
    //             this.range += body[i].mass * 2
    //             Matter.World.remove(engine.world, body[i]);
    //             body.splice(i, 1);
    //             break;
    //           }
    //         }

    //         //draw
    //         const opacity = (this.endCycle - game.cycle) / TOTAL_CYCLES
    //         ctx.fillStyle = `rgba(170,220,255,${opacity})`;
    //         ctx.beginPath();
    //         ctx.arc(this.position.x, this.position.y, this.range, 0, 2 * Math.PI);
    //         ctx.fill();
    //       }
    //     });
    //     b.fireProps(60, 0, dir, me); //cd , speed
    //   }
    // },
    // {
    //   name: "kinetic slugs", //1
    //   description: "fire a large <strong>rod</strong> that does excessive physical <strong class='color-d'>damage</strong><br><em>high recoil</em>",
    //   ammo: 0,
    //   ammoPack: 5,
    //   have: false,
    //   isStarterGun: true,
    //   fire() {
    //     b.muzzleFlash(45);
    //     // mobs.alert(800);
    //     const me = bullet.length;
    //     const dir = mech.angle;
    //     bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 70 , 30 , b.fireAttributes(dir));
    //     b.fireProps(mech.crouch ? 55 : 40, 50, dir, me); //cd , speed
    //     bullet[me].endCycle = game.cycle + Math.floor(180 * b.isModBulletsLastLonger);
    //     bullet[me].do = function () {
    //       this.force.y += this.mass * 0.0005;
    //     };

    //     //knock back
    //     const KNOCK = ((mech.crouch) ? 0.025 : 0.25)
    //     player.force.x -= KNOCK * Math.cos(dir)
    //     player.force.y -= KNOCK * Math.sin(dir) * 0.3 //reduce knock back in vertical direction to stop super jumps
    //   },
    // {
    //   name: "triboelectricty", //14
    //   description: "release <strong>particles</strong> that quickly seek out targets",
    //   ammo: 0,
    //   ammoPack: 40,
    //   have: false,
    //   isStarterGun: true,
    //   fire() {
    //     const dir = mech.angle + 0.2 * (Math.random() - 0.5);
    //     const me = bullet.length;
    //     const RADIUS = 6
    //     bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), RADIUS, {
    //       angle: dir,
    //       inertia: Infinity,
    //       // friction: 0.05,
    //       // frictionAir: 0.05,
    //       restitution: 0.8,
    //       dmg: 0.14, //damage done in addition to the damage from momentum
    //       lookFrequency: 3,
    //       endCycle: game.cycle + Math.floor(120 * b.isModBulletsLastLonger),
    //       classType: "bullet",
    //       collisionFilter: {
    //         category: 0x000100,
    //         mask: 0x010111 //self collide
    //       },
    //       minDmgSpeed: 0,
    //       lockedOn: null,
    //       isFollowMouse: true,
    //       onDmg() {
    //         this.endCycle = 0;
    //       },
    //       onEnd() {},
    //       do() {
    //         if (this.lockedOn) { //accelerate towards mobs
    //           this.force = Vector.mult(Vector.normalise(Vector.sub(this.position, this.lockedOn.position)), -this.mass * 0.01)
    //           Matter.Body.setVelocity(this, {
    //             x: this.velocity.x * 0.93,
    //             y: this.velocity.y * 0.93
    //           });
    //         } else {
    //           this.force.y += this.mass * 0.0004;
    //         }
    //       }
    //     })

    //     b.fireProps(mech.crouch ? 19 : 15, mech.crouch ? 45 : 30, dir, me); //cd , speed

    //     //find mob targets
    //     let closeDist = Infinity;
    //     for (let i = 0, len = mob.length; i < len; ++i) {
    //       if (
    //         Matter.Query.ray(map, bullet[me].position, mob[i].position).length === 0 &&
    //         Matter.Query.ray(body, bullet[me].position, mob[i].position).length === 0
    //       ) {
    //         const TARGET_VECTOR = Vector.sub(bullet[me].position, mob[i].position)
    //         const DIST = Vector.magnitude(TARGET_VECTOR);
    //         if (DIST < closeDist) {
    //           closeDist = DIST;
    //           bullet[me].lockedOn = mob[i]
    //         }
    //       }
    //     }
    //   }
    // },
    // {
  ]
};