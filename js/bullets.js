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
  modIsImmortal: null,
  modSpores: null,
  isModTempResist: null,
  isModDroneOnDamage: null,
  modExtraDmg: null,
  annihilation: null,
  fullHeal: null,
  modSquirrelFx: null,
  modIsCrit: null,
  modMoreDrops: null,
  isModLowHealthDmg: null,
  isModFarAwayDmg: null,
  isModMonogamy: null,
  isModMassEnergy: null,
  setModDefaults() {
    b.modCount = 0;
    b.modFireRate = 1;
    b.modExplosionRadius = 1;
    b.isModTempResist = false;
    b.modBulletSize = 1;
    b.isModDroneOnDamage = false;
    b.modEnergySiphon = 0;
    b.modHealthDrain = 0;
    b.modNoAmmo = 0;
    b.isModBulletsLastLonger = 1;
    b.modIsImmortal = false;
    b.modSpores = 0;
    b.modExtraDmg = 0;
    b.modAnnihilation = false;
    b.isModFullHeal = false;
    b.modSquirrelFx = 1;
    b.modIsCrit = false;
    b.modMoreDrops = 0;
    b.isModLowHealthDmg = false;
    b.isModFarAwayDmg = false;
    b.isModMonogamy = false;
    b.isModMassEnergy = false;
    mech.Fx = 0.015;
    mech.jumpForce = 0.38;
    mech.throwChargeRate = 2;
    mech.throwChargeMax = 50;
    for (let i = 0; i < b.mods.length; i++) {
      b.mods[i].have = false;
    }
  },
  mods: [{
      name: "depleted uranium rounds",
      description: "your <strong>bullets</strong> are 10% larger<br>increased mass and physical <strong class='color-d'>damage</strong>",
      have: false, //0
      effect: () => {
        //good for guns that do mostly projectile damage:
        //testing at 1.08:  spray(point blank)(+0.25), one shot(+0.16), wave beam(point blank)(+0.14)
        b.modBulletSize = 1.1;
      }
    },
    {
      name: "auto-loading heuristics",
      description: "your <strong>delay</strong> after firing is 15% <strong>shorter</strong>",
      have: false, //1
      effect: () => { //good for guns with extra ammo: needles, M80, rapid fire, flak, super balls
        b.modFireRate = 0.85
      }
    },
    {
      name: "desublimated ammunition",
      description: "use 50% less <strong>ammo</strong> when <strong>crouching</strong>",
      have: false, //2
      effect: () => { //good with guns that have less ammo: one shot, grenades, missiles, super balls, spray
        b.modNoAmmo = 1
      }
    },
    {
      name: "Lorentzian topology",
      description: "your <strong>bullets</strong> last 40% <strong>longer</strong>",
      have: false, //3
      effect: () => { //good with: drones, super balls, spore, missiles, wave beam(range), rapid fire(range), flak(range)
        b.isModBulletsLastLonger = 1.40
      }
    },
    {
      name: "anti-matter cores",
      description: "the <strong>radius</strong> of your <strong class='color-e'>explosions</strong> is doubled<br><strong style='opacity:0.3;'>be careful</strong>",
      have: false, //4
      effect: () => { //at 1.4 gives a flat 40% increase, and increased range,  balanced by limited guns and self damage
        //testing at 1.3: grenade(+0.3), missiles, flak, M80
        b.modExplosionRadius = 1.8; //good for guns with explosions
      }
    },
    {
      name: "ceramic plating",
      description: "protection from to high <strong>temperatures</strong><br>5x less <strong class='color-d'>damage</strong> from <strong class='color-e'>explosions</strong>, lasers",
      have: false, //5
      effect: () => {
        b.isModTempResist = true; //good for guns with explosions
      }
    },
    {
      name: "ablative synthesis",
      description: "rebuild your broken parts as <strong>drones</strong><br>chance to occur after taking <strong class='color-d'>damage</strong>",
      have: false, //6
      effect: () => { //makes dangerous situations more survivable
        b.isModDroneOnDamage = true;
      }
    },
    {
      name: "zoospore vector",
      description: "enemies can discharge <strong style='letter-spacing: 2px;'>spores</strong> on <strong>death</strong><br><strong style='letter-spacing: 2px;'>spores</strong> seek out enemies",
      have: false, //7
      effect: () => { //good late game maybe?
        b.modSpores = 0.20;
      }
    },
    {
      name: "energy transfer",
      description: "gain <strong class='color-f'>energy</strong> proportional to <strong class='color-d'>damage</strong> done",
      have: false, //8
      effect: () => { //good with laser, and all fields
        b.modEnergySiphon = 0.2;
      }
    },
    {
      name: "entropy transfer",
      description: "<strong class='color-h'>heal</strong> proportional to <strong class='color-d'>damage</strong> done",
      have: false, //9
      effect: () => { //good with guns that overkill: one shot, grenade
        b.modHealthDrain = 0.015;
      }
    },
    {
      name: "quantum immortality",
      description: "after <strong>dying</strong>, continue in an <em>alternate reality</em><br>guns, ammo, and field are randomized",
      have: false, //10
      effect: () => {
        b.modIsImmortal = true;
      }
    },
    {
      name: "fluoroantimonic acid",
      description: "each bullet does extra chemical <strong class='color-d'>damage</strong><br>instant damage, unaffected by momentum",
      have: false, //11
      effect: () => { //good with guns that fire many bullets at low speeds, minigun, drones, junk-bots, shotgun, superballs, wavebeam
        b.modExtraDmg = 0.1
      }
    },
    {
      name: "annihilation",
      description: "after <strong>touching</strong> enemies, they are annihilated<br><em>doesn't trigger health or energy transfer</em>",
      have: false, //12
      effect: () => { //good with mods that heal: superconductive healing, entropy transfer 
        b.modAnnihilation = true
      }
    },
    {
      name: "recursive healing",
      description: "<strong class='color-h'>healing</strong> power ups bring you to <strong>full health</strong>",
      have: false, //13
      effect: () => { // good with ablative synthesis, melee builds
        b.isModFullHeal = true
      }
    },
    {
      name: "Gauss rifle",
      description: "<strong>launch blocks</strong> at much higher speeds<br>carry more massive blocks",
      have: false, //14
      effect: () => { // good with guns that run out of ammo
        mech.throwChargeRate = 4;
        mech.throwChargeMax = 150;
        mech.holdingMassScale = 0.05; //can hold heavier blocks with lower cost to jumping
      }
    },
    {
      name: "squirrel-cage rotor",
      description: "your legs produce 20% more force<br><strong>jump</strong> higher and <strong>move</strong> faster",
      have: false, //15
      effect: () => { // good with melee builds, content skipping builds
        b.modSquirrelFx = 1.2;
        mech.Fx = 0.015 * b.modSquirrelFx;
        mech.jumpForce = 0.38 * 1.1;
      }
    },
    {
      name: "fracture analysis",
      description: "<strong>5x</strong> physical <strong class='color-d'>damage</strong> to unaware enemies<br><em>unaware enemies don't have a health bar</em>",
      have: false, //16
      effect: () => { // good with high damage guns that strike from a distance: rail gun, drones, flechettes, spores, grenade, vacuum bomb
        b.modIsCrit = true;
      }
    },
    {
      name: "kinetic bombardment",
      description: "do extra <strong class='color-d'>damage</strong> from a distance<br><em>up to 50% increase at about 30 steps away</em>",
      have: false, //17
      effect: () => { // good with annihilation, melee builds
        b.isModFarAwayDmg = true; //used in mob.damage()
      }
    },
    {
      name: "quasistatic equilibrium",
      description: "do extra <strong class='color-d'>damage</strong> at low health<br><em>up to 50% increase when near death</em>",
      have: false, //18
      effect: () => { // good with annihilation, melee builds
        b.isModLowHealthDmg = true; //used in mob.damage()
      }
    },
    {
      name: "Bayesian inference",
      description: "<strong>20%</strong> chance for double <strong>power ups</strong> to drop",
      have: false, //19
      effect: () => { // good with long term planning
        b.modMoreDrops = 0.20;
      }
    },
    {
      name: "entanglement",
      description: "using your first gun reduces <strong class='color-d'>damage</strong> taken<br><em>scales by <strong>7%</strong> for each gun in your inventory</em>",
      have: false, //20
      effect: () => { // good with long term planning
        b.isModMonogamy = true
      }
    },
    {
      name: "mass-energy equivalence",
      description: "change the mass of <strong>power ups</strong> into <strong class='color-f'>energy</strong><br>power ups fill your <strong class='color-f'>energy</strong> and <strong class='color-h'>heal</strong> for +3%",
      have: false, //21
      effect: () => { // good with long term planning
        b.isModMassEnergy = true // used in mech.usePowerUp
      }
    },
  ],
  giveMod(i) {
    b.mods[i].effect(); //give specific mod
    b.modCount++
    b.mods[i].have = true
    game.updateModHUD();
  },
  activeGun: null, //current gun in use by player
  inventoryGun: 0,
  inventory: [], //list of what guns player has  // 0 starts with basic gun
  giveGuns(gun = "all", ammoPacks = 2) {
    if (gun === "all") {
      b.activeGun = 0;
      b.inventoryGun = 0;
      for (let i = 0; i < b.guns.length; i++) {
        b.guns[i].have = true;
        b.guns[i].ammo = b.guns[i].ammoPack * ammoPacks;
        b.inventory[i] = i;
      }
    } else {
      if (!b.guns[gun].have) b.inventory.push(gun);
      if (b.activeGun === null) b.activeGun = gun //if no active gun switch to new gun
      b.guns[gun].have = true;
      b.guns[gun].ammo = b.guns[gun].ammoPack * ammoPacks;
    }
    game.makeGunHUD();
  },
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
        mech.fireCDcycle = mech.cycle + 30; //cooldown
        // game.makeTextLog("<div style='font-size:140%;'>NO AMMO</div><strong class = 'box'>E</strong> / <strong class = 'box'>Q</strong>", 200);
        game.replaceTextLog = true;
        game.makeTextLog("<div style='font-size:140%;'>NO AMMO</div> <p style='font-size:90%;'><strong>Q</strong>, <strong>E</strong>, and <strong>mouse wheel</strong> change weapons</p>", 200);
      }
      if (mech.isHolding) {
        mech.drop();
      }
    }
  },
  draw() {
    ctx.beginPath();
    let i = bullet.length;
    while (i--) {
      //draw
      let vertices = bullet[i].vertices;
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j += 1) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      //remove bullet if at end cycle for that bullet
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
    ctx.fillStyle = "#000";
    ctx.fill();
    //do things
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
        dmg: b.modExtraDmg, //damage done in addition to the damage from momentum
        classType: "bullet",
        collisionFilter: {
          category: 0x000100,
          mask: 0x010011 //mask: 0x000101,  //for self collision
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
          category: 0x000100,
          mask: 0x010011 //mask: 0x000101,  //for self collision
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
  drawOneBullet(vertices) {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let j = 1; j < vertices.length; j += 1) {
      ctx.lineTo(vertices[j].x, vertices[j].y);
    }
    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.fillStyle = "#000";
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
  explode(me) {
    // typically explode is used for some bullets with .onEnd
    const radius = bullet[me].explodeRad * b.modExplosionRadius
    //add dmg to draw queue
    game.drawList.push({
      x: bullet[me].position.x,
      y: bullet[me].position.y,
      radius: radius,
      color: "rgba(255,25,0,0.6)",
      time: game.drawTime
    });
    let dist, sub, knock;
    const dmg = b.dmgScale * radius * 0.009;

    const alertRange = 100 + radius * 2; //alert range
    //add alert to draw queue
    game.drawList.push({
      x: bullet[me].position.x,
      y: bullet[me].position.y,
      radius: alertRange,
      color: "rgba(100,20,0,0.03)",
      time: game.drawTime
    });

    //player damage and knock back
    sub = Matter.Vector.sub(bullet[me].position, player.position);
    dist = Matter.Vector.magnitude(sub);
    if (dist < radius) {
      if (b.isModTempResist) {
        mech.damage(radius * 0.00004);
      } else {
        mech.damage(radius * 0.0002);
      }
      knock = Matter.Vector.mult(Matter.Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 30);
      player.force.x += knock.x;
      player.force.y += knock.y;
      mech.drop();
    } else if (dist < alertRange) {
      knock = Matter.Vector.mult(Matter.Vector.normalise(sub), -Math.sqrt(dmg) * player.mass / 55);
      player.force.x += knock.x;
      player.force.y += knock.y;
      mech.drop();
    }

    //body knock backs
    for (let i = 0, len = body.length; i < len; ++i) {
      sub = Matter.Vector.sub(bullet[me].position, body[i].position);
      dist = Matter.Vector.magnitude(sub);
      if (dist < radius) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 18);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * body[i].mass) / 40);
        body[i].force.x += knock.x;
        body[i].force.y += knock.y;
      }
    }

    //power up knock backs
    for (let i = 0, len = powerUp.length; i < len; ++i) {
      sub = Matter.Vector.sub(bullet[me].position, powerUp[i].position);
      dist = Matter.Vector.magnitude(sub);
      if (dist < radius) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 26);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      } else if (dist < alertRange) {
        knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg) * powerUp[i].mass) / 40);
        powerUp[i].force.x += knock.x;
        powerUp[i].force.y += knock.y;
      }
    }

    //mob damage and knock back with alert
    let damageScale = 1; // reduce dmg for each new target to limit total AOE damage
    for (let i = 0, len = mob.length; i < len; ++i) {
      if (mob[i].alive) {
        sub = Matter.Vector.sub(bullet[me].position, mob[i].position);
        dist = Matter.Vector.magnitude(sub) - mob[i].radius;
        if (dist < radius) {
          mob[i].damage(dmg * damageScale);
          mob[i].locatePlayer();
          knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 18);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
          damageScale *= 0.8 //reduced damage for each additional explosion target 
        } else if (!mob[i].seePlayer.recall && dist < alertRange) {
          mob[i].locatePlayer();
          knock = Matter.Vector.mult(Matter.Vector.normalise(sub), (-Math.sqrt(dmg * damageScale) * mob[i].mass) / 35);
          mob[i].force.x += knock.x;
          mob[i].force.y += knock.y;
        }
      }
    }

    // Matter.Vector.magnitudeSquared(Matter.Vector.sub(bullet[me].position, mob[i].position))
  },
  spore(who) { //used with the mod upgrade in mob.death()
    const bIndex = bullet.length;
    const RADIUS = 3 * b.modBulletSize;
    bullet[bIndex] = Bodies.circle(who.position.x, who.position.y, RADIUS, {
      // density: 0.0015,			//frictionAir: 0.01,
      inertia: Infinity,
      restitution: 0.5,
      angle: Math.random() * 2 * Math.PI,
      friction: 0,
      frictionAir: 0.011,
      dmg: 1.8, //damage done in addition to the damage from momentum
      classType: "bullet",
      collisionFilter: {
        category: 0x000100,
        mask: 0x000011 //no collide with body
      },
      endCycle: game.cycle + Math.floor((360 + Math.floor(Math.random() * 240)) * b.isModBulletsLastLonger),
      minDmgSpeed: 0,
      onDmg() {
        this.endCycle = 0; //bullet ends cycle after doing damage 
      },
      onEnd() {},
      lookFrequency: 67 + Math.floor(47 * Math.random()),
      do() {
        //find mob targets
        if (!(game.cycle % this.lookFrequency)) {
          this.closestTarget = null;
          this.lockedOn = null;
          let closeDist = Infinity;
          for (let i = 0, len = mob.length; i < len; ++i) {
            if (Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
              // Matter.Query.ray(body, this.position, mob[i].position).length === 0
              const targetVector = Matter.Vector.sub(this.position, mob[i].position)
              const dist = Matter.Vector.magnitude(targetVector);
              if (dist < closeDist) {
                this.closestTarget = mob[i].position;
                closeDist = dist;
                this.lockedOn = Matter.Vector.normalise(targetVector);
                if (0.3 > Math.random()) break //doesn't always target the closest mob
              }
            }
          }
        }
        //accelerate towards mobs
        const THRUST = this.mass * 0.0009
        if (this.lockedOn) {
          this.force.x -= THRUST * this.lockedOn.x
          this.force.y -= THRUST * this.lockedOn.y
        } else {
          this.force.y += this.mass * 0.00027; //gravity
        }
      },
    });
    const SPEED = 9;
    const ANGLE = 2 * Math.PI * Math.random()
    Matter.Body.setVelocity(bullet[bIndex], {
      x: SPEED * Math.cos(ANGLE),
      y: SPEED * Math.sin(ANGLE)
    });
    World.add(engine.world, bullet[bIndex]); //add bullet to world
  },
  guns: [{
      name: "laser", //0
      description: "emit a beam of <strong class='color-d'>damaging</strong> coherent light<br>uses  <strong class='color-f'>energy</strong> instead of ammunition",
      ammo: 0,
      // ammoPack: 350,
      ammoPack: Infinity,
      have: false,
      isStarterGun: true,
      fire() {
        // mech.fireCDcycle = mech.cycle + 1
        //laser drains energy as well as bullets
        const FIELD_DRAIN = 0.002
        const damage = 0.05
        if (mech.fieldMeter < FIELD_DRAIN) {
          mech.fireCDcycle = mech.cycle + 100; // cool down if out of energy
        } else {
          mech.fieldMeter -= mech.fieldRegen + FIELD_DRAIN
          let best;
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
          const laserHitMob = function (dmg) {
            if (best.who.alive) {
              dmg *= b.dmgScale * damage;
              best.who.damage(dmg);
              best.who.locatePlayer();
              //draw mob damage circle
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(path[path.length - 1].x, path[path.length - 1].y, Math.sqrt(dmg) * 100, 0, 2 * Math.PI);
              ctx.fill();
            }
          };

          const reflection = function () {
            // https://math.stackexchange.com/questions/13261/how-to-get-a-reflection-vector
            const n = Matter.Vector.perp(Matter.Vector.normalise(Matter.Vector.sub(best.v1, best.v2)));
            const d = Matter.Vector.sub(path[path.length - 1], path[path.length - 2]);
            const nn = Matter.Vector.mult(n, 2 * Matter.Vector.dot(d, n));
            const r = Matter.Vector.normalise(Matter.Vector.sub(d, nn));
            path[path.length] = Matter.Vector.add(Matter.Vector.mult(r, range), path[path.length - 1]);
          };
          //beam before reflection
          checkForCollisions();
          if (best.dist2 != Infinity) {
            //if hitting something
            path[path.length - 1] = {
              x: best.x,
              y: best.y
            };
            laserHitMob(1);

            //1st reflection beam
            reflection();
            //ugly bug fix: this stops the reflection on a bug where the beam gets trapped inside a body
            let who = best.who;
            checkForCollisions();
            if (best.dist2 != Infinity) {
              //if hitting something
              path[path.length - 1] = {
                x: best.x,
                y: best.y
              };
              laserHitMob(0.75);

              //2nd reflection beam
              //ugly bug fix: this stops the reflection on a bug where the beam gets trapped inside a body
              if (who !== best.who) {
                reflection();
                checkForCollisions();
                if (best.dist2 != Infinity) {
                  //if hitting something
                  path[path.length - 1] = {
                    x: best.x,
                    y: best.y
                  };
                  laserHitMob(0.5);
                }
              }
            }
          }
          ctx.fillStyle = color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.lineDashOffset = 300 * Math.random()
          // ctx.setLineDash([200 * Math.random(), 250 * Math.random()]);

          ctx.setLineDash([50 + 120 * Math.random(), 50 * Math.random()]);
          for (let i = 1, len = path.length; i < len; ++i) {
            ctx.beginPath();
            ctx.moveTo(path[i - 1].x, path[i - 1].y);
            ctx.lineTo(path[i].x, path[i].y);
            ctx.stroke();
            ctx.globalAlpha *= 0.5; //reflections are less intense
            // ctx.globalAlpha -= 0.1; //reflections are less intense
          }
          ctx.setLineDash([0, 0]);
          ctx.globalAlpha = 1;
        }
      }
    },
    {
      name: "rail gun", //1
      description: "electro-magnetically launch a dense rod<br><strong>hold</strong> left mouse to charge, <strong>release</strong> to fire", //and <strong>repel</strong> enemies
      ammo: 0,
      ammoPack: 7,
      have: false,
      isStarterGun: false,
      fire() {
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(0, 0, 0.012 * b.modBulletSize, 0.0025 * b.modBulletSize, {
          density: 0.01, //0.001 is normal
          //frictionAir: 0.01,			//restitution: 0,
          // angle: 0,
          // friction: 0.5,
          frictionAir: 0,
          dmg: b.modExtraDmg, //damage done in addition to the damage from momentum
          classType: "bullet",
          collisionFilter: {
            category: 0x000000,
            mask: 0x010011 //mask: 0x000101,  //for self collision
          },
          minDmgSpeed: 5,
          onDmg() {}, //this.endCycle = 0  //triggers despawn
          onEnd() {}
        });
        mech.fireCDcycle = Infinity; // cool down
        World.add(engine.world, bullet[me]); //add bullet to world
        bullet[me].endCycle = Infinity
        bullet[me].isCharging = true;
        bullet[me].charge = 0;
        bullet[me].do = function () {
          if (this.isCharging) {
            if ((!game.mouseDown && this.charge > 0.6)) { //fire on mouse release
              this.isCharging = false
              mech.fireCDcycle = mech.cycle + 2; // set fire cool down
              Matter.Body.scale(this, 8000, 8000) // show the bullet by scaling it up  (don't judge me...  I know this is a bad way to do it)
              this.endCycle = game.cycle + Math.floor(140 * b.isModBulletsLastLonger)
              this.collisionFilter.category = 0x000100
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
              const KNOCK = ((mech.crouch) ? 0.1 : 0.5) * b.modBulletSize * b.modBulletSize * this.charge * this.charge
              player.force.x -= KNOCK * Math.cos(mech.angle)
              player.force.y -= KNOCK * Math.sin(mech.angle) * 0.35 //reduce knock back in vertical direction to stop super jumps

              //push away blocks when firing
              let range = 450 * this.charge
              for (let i = 0, len = body.length; i < len; ++i) {
                const SUB = Matter.Vector.sub(body[i].position, mech.pos)
                const DISTANCE = Matter.Vector.magnitude(SUB)

                if (DISTANCE < range) {
                  const DEPTH = Math.max(range - DISTANCE, 100)
                  const FORCE = Matter.Vector.mult(Matter.Vector.normalise(SUB), 0.005 * Math.sqrt(DEPTH) * Math.sqrt(body[i].mass))
                  body[i].force.x += FORCE.x;
                  body[i].force.y += FORCE.y - body[i].mass * (game.g * 1.5); //kick up a bit to give them some arc
                }
              }
              for (let i = 0, len = mob.length; i < len; ++i) {
                const SUB = Matter.Vector.sub(mob[i].position, mech.pos)
                const DISTANCE = Matter.Vector.magnitude(SUB)

                if (DISTANCE < range) {
                  const DEPTH = Math.max(range - DISTANCE, 100)
                  const FORCE = Matter.Vector.mult(Matter.Vector.normalise(SUB), 0.005 * Math.sqrt(DEPTH) * Math.sqrt(mob[i].mass))
                  mob[i].force.x += 1.5 * FORCE.x;
                  mob[i].force.y += 1.5 * FORCE.y;
                }
              }
              //push mobs around player when firing
              // range = 600 * this.charge
              // for (let i = 0, len = mob.length; i < len; ++i) {
              //   const SUB = Matter.Vector.sub(mob[i].position, mech.pos)
              //   const DISTANCE = Matter.Vector.magnitude(SUB)
              //   if (DISTANCE < range) {
              //     const DEPTH = range - DISTANCE
              //     const FORCE = Matter.Vector.mult(Matter.Vector.normalise(SUB), 0.00000001 * DEPTH * DEPTH * DEPTH * Math.sqrt(mob[i].mass))
              //     mob[i].force.x += FORCE.x
              //     mob[i].force.y += FORCE.y
              //   }
              // }
            } else { // charging on mouse down
              mech.fireCDcycle = Infinity //can't fire until mouse is released
              if (mech.crouch) {
                this.charge = this.charge * 0.97 + 0.03 // this.charge converges to 1
              } else {
                this.charge = this.charge * 0.987 + 0.013 // this.charge converges to 1
              }

              //gently push away mobs while charging
              // const RANGE = 270 * this.charge
              // for (let i = 0, len = mob.length; i < len; ++i) {
              //   const SUB = Matter.Vector.sub(mob[i].position, mech.pos)
              //   const DISTANCE = Matter.Vector.magnitude(SUB)
              //   // if (DISTANCE < RANGE) {
              //   //   Matter.Body.setVelocity(mob[i], Matter.Vector.rotate(mob[i].velocity, 0.1))
              //   // }
              //   // const DRAIN = 0.0002  //&& mech.fieldMeter > DRAIN
              //   if (DISTANCE < RANGE) {
              //     // mech.fieldMeter -= DRAIN + mech.fieldRegen;
              //     const DEPTH = RANGE - DISTANCE
              //     const FORCE = Matter.Vector.mult(Matter.Vector.normalise(SUB), 0.000000001 * DEPTH * DEPTH * DEPTH * Math.sqrt(mob[i].mass))
              //     mob[i].force.x += FORCE.x
              //     mob[i].force.y += FORCE.y
              //   }
              // }

              //draw laser targeting
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

              //draw laser beam
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
              const unitVector = Matter.Vector.normalise(Matter.Vector.sub(game.mouseInGame, mech.pos))
              const unitVectorPerp = Matter.Vector.perp(unitVector)

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
          } else { //normal bullet behavior
            this.force.y += this.mass * 0.00015 / this.charge; // low gravity that scales with charge
          }
        }
      }
    },
    {
      name: "minigun", //2
      description: "rapidly fire a stream of small <strong>bullets</strong>",
      ammo: 0,
      ammoPack: 105,
      have: false,
      isStarterGun: true,
      fire() {
        const me = bullet.length;
        b.muzzleFlash(15);
        // if (Math.random() > 0.2) mobs.alert(500);
        const dir = mech.angle + (Math.random() - 0.5) * ((mech.crouch) ? 0.03 : 0.14);
        bullet[me] = Bodies.rectangle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 17 * b.modBulletSize, 5 * b.modBulletSize, b.fireAttributes(dir));
        b.fireProps(mech.crouch ? 11 : 5, mech.crouch ? 44 : 36, dir, me); //cd , speed
        bullet[me].endCycle = game.cycle + Math.floor(65 * b.isModBulletsLastLonger);
        bullet[me].frictionAir = mech.crouch ? 0.007 : 0.01;
        bullet[me].do = function () {
          this.force.y += this.mass * 0.0005;
        };
      }
    }, {
      name: "wave beam", //3
      description: "emit a <strong>sine wave</strong> of oscillating particles<br>particles propagate through <strong>walls</strong>",
      ammo: 0,
      ammoPack: 85,
      have: false,
      isStarterGun: true,
      fire() {
        const me = bullet.length;
        const DIR = mech.angle
        const SCALE = (mech.crouch ? 0.963 : 0.95)
        const wiggleMag = ((mech.flipLegs === 1) ? 1 : -1) * ((mech.crouch) ? 0.004 : 0.005)
        bullet[me] = Bodies.circle(mech.pos.x + 25 * Math.cos(DIR), mech.pos.y + 25 * Math.sin(DIR), 10 * b.modBulletSize, {
          angle: DIR,
          cycle: -0.43, //adjust this number until the bullets line up with the cross hairs
          endCycle: game.cycle + Math.floor((mech.crouch ? 155 : 120) * b.isModBulletsLastLonger),
          inertia: Infinity,
          frictionAir: 0,
          minDmgSpeed: 0,
          dmg: 0.13 + b.modExtraDmg, //damage done in addition to the damage from momentum
          classType: "bullet",
          collisionFilter: {
            category: 0x000100,
            mask: 0x000010
          },
          onDmg() {},
          onEnd() {},
          do() {
            if (!mech.isBodiesAsleep) {
              this.cycle++
              const THRUST = wiggleMag * Math.cos(this.cycle * 0.3)
              this.force = Matter.Vector.mult(Matter.Vector.normalise(this.direction), this.mass * THRUST) //wiggle

              if (this.cycle > 0 && !(Math.floor(this.cycle) % 6)) Matter.Body.scale(this, SCALE, SCALE); //shrink
            }
          }
        });
        World.add(engine.world, bullet[me]); //add bullet to world
        mech.fireCDcycle = mech.cycle + Math.floor((mech.crouch ? 8 : 4) * b.modFireRate); // cool down
        const SPEED = mech.crouch ? 5.2 : 4.5;
        Matter.Body.setVelocity(bullet[me], {
          x: SPEED * Math.cos(DIR),
          y: SPEED * Math.sin(DIR)
        });
        bullet[me].direction = Matter.Vector.perp(bullet[me].velocity)
        // if (mech.angle + Math.PI / 2 > 0) {
        //   bullet[me].direction = Matter.Vector.perp(bullet[me].velocity, true)
        // } else {
        //   bullet[me].direction = Matter.Vector.perp(bullet[me].velocity)
        // }

        World.add(engine.world, bullet[me]); //add bullet to world
      }
    }, {
      name: "super balls", //4
      description: "fire balls that <strong>bounce</strong> with no momentum loss",
      ammo: 0,
      ammoPack: 11,
      have: false,
      isStarterGun: true,
      fire() {
        b.muzzleFlash(20);
        // mobs.alert(450);
        const SPREAD = mech.crouch ? 0.04 : 0.14
        let dir = mech.angle - SPREAD;
        for (let i = 0; i < 3; i++) {
          const me = bullet.length;
          bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 7 * b.modBulletSize, b.fireAttributes(dir, false));
          b.fireProps(mech.crouch ? 40 : 20, mech.crouch ? 34 : 26, dir, me); //cd , speed
          Matter.Body.setDensity(bullet[me], 0.0001);
          bullet[me].endCycle = game.cycle + Math.floor(360 * b.isModBulletsLastLonger);
          bullet[me].dmg = 0.5 + b.modExtraDmg;
          bullet[me].minDmgSpeed = 0;
          bullet[me].restitution = 0.96;
          bullet[me].friction = 0;
          bullet[me].do = function () {
            this.force.y += this.mass * 0.001;
          };
          dir += SPREAD;
        }
      }
    }, {
      name: "shotgun", //5
      description: "fire a <strong>burst</strong> of short range bullets<br><em>crouch to reduce recoil</em>",
      ammo: 0,
      ammoPack: 9,
      have: false,
      isStarterGun: true,
      fire() {
        b.muzzleFlash(35);
        // mobs.alert(650);
        const side = 11 * b.modBulletSize
        for (let i = 0; i < 9; i++) {
          const me = bullet.length;
          const dir = mech.angle + (Math.random() - 0.5) * (mech.crouch ? 0.22 : 0.7)
          bullet[me] = Bodies.rectangle(mech.pos.x + 35 * Math.cos(mech.angle) + 15 * (Math.random() - 0.5), mech.pos.y + 35 * Math.sin(mech.angle) + 15 * (Math.random() - 0.5), side, side, b.fireAttributes(dir));
          b.fireProps(mech.crouch ? 65 : 45, 40 + Math.random() * 11, dir, me); //cd , speed
          bullet[me].endCycle = game.cycle + Math.floor(55 * b.isModBulletsLastLonger);
          bullet[me].frictionAir = 0.03;
          bullet[me].do = function () {
            this.force.y += this.mass * 0.001;
          };
        }

        //knock back
        const KNOCK = ((mech.crouch) ? 0.015 : 0.15) * b.modBulletSize * b.modBulletSize
        player.force.x -= KNOCK * Math.cos(mech.angle)
        player.force.y -= KNOCK * Math.sin(mech.angle) * 0.3 //reduce knock back in vertical direction to stop super jumps
      }
    }, {
      name: "fléchettes", //6
      description: "fire a flight of long range needles",
      ammo: 0,
      ammoPack: 25,
      have: false,
      isStarterGun: true,
      fire() {
        function spawnFlechette(dir = mech.angle, speed, size = 1) {
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(dir), mech.pos.y + 40 * Math.sin(dir), 32 * size * b.modBulletSize, 0.8 * size * b.modBulletSize, b.fireAttributes(dir));
          bullet[me].endCycle = game.cycle + Math.floor(180 * b.isModBulletsLastLonger);
          bullet[me].dmg = 0.15 * size + b.modExtraDmg;
          b.drawOneBullet(bullet[me].vertices);
          bullet[me].do = function () {
            this.force.y += this.mass * 0.0002; //low gravity
          };
          Matter.Body.setVelocity(bullet[me], {
            x: mech.Vx / 2 + speed * Math.cos(dir),
            y: mech.Vy / 2 + speed * Math.sin(dir)
          });
          World.add(engine.world, bullet[me]); //add bullet to world
        }

        if (mech.crouch) {
          for (let i = 0; i < 3; i++) {
            spawnFlechette(mech.angle + 0.02 * (Math.random() - 0.5), 35 + 4 * i, 1.55)
          }
        } else {
          for (let i = 0; i < 9; i++) {
            spawnFlechette(mech.angle + 0.12 * (Math.random() - 0.5), 30 + 8 * Math.random())
          }
        }
        mech.fireCDcycle = mech.cycle + Math.floor(40 * b.modFireRate); // cool down
      }
    }, {
      name: "missiles", //7
      description: "fire missiles that accelerate towards enemies<br><strong class='color-e'>explodes</strong> when near target",
      ammo: 0,
      ammoPack: 8,
      have: false,
      isStarterGun: false,
      fireCycle: 0,
      ammoLoaded: 0,
      fire() {
        const thrust = 0.0003;
        let dir = mech.angle + (0.5 - Math.random()) * (mech.crouch ? 0 : 0.2);
        const me = bullet.length;
        bullet[me] = Bodies.rectangle(mech.pos.x + 40 * Math.cos(mech.angle), mech.pos.y + 40 * Math.sin(mech.angle) - 3, 30 * b.modBulletSize, 4 * b.modBulletSize, b.fireAttributes(dir));
        b.fireProps(mech.crouch ? 70 : 30, -3 * (0.5 - Math.random()) + (mech.crouch ? 25 : -8), dir, me); //cd , speed

        b.drawOneBullet(bullet[me].vertices);
        // Matter.Body.setDensity(bullet[me], 0.01)  //doesn't help with reducing explosion knock backs
        bullet[me].force.y += 0.00045; //a small push down at first to make it seem like the missile is briefly falling
        bullet[me].frictionAir = 0
        bullet[me].endCycle = game.cycle + Math.floor((265 + Math.random() * 20) * b.isModBulletsLastLonger);
        bullet[me].explodeRad = 170 + 60 * Math.random();
        bullet[me].lookFrequency = Math.floor(8 + Math.random() * 7);
        bullet[me].onEnd = b.explode; //makes bullet do explosive damage at end
        bullet[me].onDmg = function () {
          this.endCycle = 0; //bullet ends cycle after doing damage  // also triggers explosion
        };
        bullet[me].lockedOn = null;
        bullet[me].do = function () {
          if (!mech.isBodiesAsleep) {
            if (!(mech.cycle % this.lookFrequency)) {
              this.closestTarget = null;
              this.lockedOn = null;
              let closeDist = Infinity;

              //look for targets
              for (let i = 0, len = mob.length; i < len; ++i) {
                if (
                  mob[i].alive &&
                  mob[i].dropPowerUp &&
                  Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                  Matter.Query.ray(body, this.position, mob[i].position).length === 0
                ) {
                  const dist = Matter.Vector.magnitude(Matter.Vector.sub(this.position, mob[i].position));
                  if (dist < closeDist) {
                    this.closestTarget = mob[i].position;
                    closeDist = dist;
                    this.lockedOn = mob[i];
                  }
                }
              }
              //explode when bullet is close enough to target
              if (this.closestTarget && closeDist < this.explodeRad) {
                this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
              }

              if (this.lockedOn) {
                this.frictionAir = 0.04; //extra friction

                //draw locked on targeting
                ctx.beginPath();
                const vertices = this.lockedOn.vertices;
                ctx.moveTo(this.position.x, this.position.y);
                const mod = Math.floor((game.cycle / 3) % vertices.length);
                ctx.lineTo(vertices[mod].x, vertices[mod].y);
                ctx.strokeStyle = "rgba(0,0,155,0.35)"; //"#2f6";
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }

            //rotate missile towards the target
            if (this.closestTarget) {
              const face = {
                x: Math.cos(this.angle),
                y: Math.sin(this.angle)
              };
              const target = Matter.Vector.normalise(Matter.Vector.sub(this.position, this.closestTarget));
              if (Matter.Vector.dot(target, face) > -0.98) {
                if (Matter.Vector.cross(target, face) > 0) {
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
            ctx.arc(this.position.x - Math.cos(this.angle) * 27 + (Math.random() - 0.5) * 4, this.position.y - Math.sin(this.angle) * 27 + (Math.random() - 0.5) * 4, 11, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255,155,0,0.5)";
            ctx.fill();
          } else {
            //draw rocket  with time stop
            ctx.beginPath();
            ctx.arc(this.position.x - Math.cos(this.angle) * 27, this.position.y - Math.sin(this.angle) * 27, 11, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255,155,0,0.5)";
            ctx.fill();
          }
        }
      }
    }, {
      name: "flak", //8
      description: "fire a cluster of short range projectiles<br><strong class='color-e'>explodes</strong> on contact or after half a second",
      ammo: 0,
      ammoPack: 20,
      have: false,
      isStarterGun: true,
      fire() {
        b.muzzleFlash(30);
        const totalBullets = 5
        const angleStep = (mech.crouch ? 0.06 : 0.25) / totalBullets
        const SPEED = mech.crouch ? 29 : 25
        const CD = mech.crouch ? 30 : 11
        const END = Math.floor((mech.crouch ? 30 : 18) * b.isModBulletsLastLonger);
        let dir = mech.angle - angleStep * totalBullets / 2;
        const side1 = 17 * b.modBulletSize
        const side2 = 4 * b.modBulletSize

        for (let i = 0; i < totalBullets; i++) { //5 -> 7
          dir += angleStep
          const me = bullet.length;
          bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), side1, side2, b.fireAttributes(dir));
          b.fireProps(CD, SPEED + 15 * Math.random() - 2 * i, dir, me); //cd , speed
          // Matter.Body.setDensity(bullet[me], 0.005);
          bullet[me].endCycle = 2 * i + game.cycle + END
          bullet[me].restitution = 0;
          bullet[me].friction = 1;
          // bullet[me].dmg = 0.15;
          bullet[me].explodeRad = (mech.crouch ? 70 : 50) + (Math.random() - 0.5) * 50;
          bullet[me].onEnd = b.explode;
          bullet[me].onDmg = function () {
            this.endCycle = 0; //bullet ends cycle after hitting a mob and triggers explosion
          };
          bullet[me].do = function () {
            this.force.y += this.mass * 0.0004;
            // if (this.speed < 10) { //if slow explode
            //   for (let i = 0, len = bullet.length; i < len; i++) {
            //     bullet[i].endCycle = 0 //all other bullets explode
            //   }
            // }
          }
        }
      }
    }, {
      name: "grenades", //9
      description: "lob a single bouncy projectile<br><strong class='color-e'>explodes</strong> on contact or after one second",
      ammo: 0,
      ammoPack: 9,
      have: false,
      isStarterGun: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle; // + Math.random() * 0.05;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 15 * b.modBulletSize, b.fireAttributes(dir, false));
        b.fireProps(mech.crouch ? 40 : 20, mech.crouch ? 43 : 32, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
        // Matter.Body.setDensity(bullet[me], 0.000001);
        bullet[me].totalCycles = 100;
        bullet[me].endCycle = game.cycle + Math.floor((mech.crouch ? 120 : 60) * b.isModBulletsLastLonger);
        bullet[me].restitution = 0.5;
        bullet[me].explodeRad = 210;
        bullet[me].onEnd = b.explode; //makes bullet do explosive damage before despawn
        bullet[me].minDmgSpeed = 1;
        bullet[me].onDmg = function () {
          this.endCycle = 0; //bullet ends cycle after doing damage  //this also triggers explosion
        };
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.002;
        };
      }
    }, {
      name: "vacuum bomb", //10
      description: "fire a bomb that <strong>sucks</strong> before <strong class='color-e'>exploding</strong><br>click left mouse again to <strong>detonate</strong>",
      ammo: 0,
      ammoPack: 5,
      have: false,
      isStarterGun: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 26 * b.modBulletSize, b.fireAttributes(dir, false));
        bullet[me].radius = 22; //used from drawing timer
        b.fireProps(10, mech.crouch ? 42 : 26, dir, me); //cd , speed

        b.drawOneBullet(bullet[me].vertices);
        bullet[me].endCycle = Infinity
        // bullet[me].restitution = 0.3;
        // bullet[me].frictionAir = 0.01;
        // bullet[me].friction = 0.15;
        bullet[me].inertia = Infinity; //prevents rotation
        bullet[me].restitution = 0;
        bullet[me].friction = 1;

        bullet[me].explodeRad = 380 + Math.floor(Math.random() * 60);
        bullet[me].onEnd = b.explode; //makes bullet do explosive damage before despawn
        bullet[me].onDmg = function () {
          // this.endCycle = 0; //bullet ends cycle after doing damage  //this triggers explosion
        };
        bullet[me].isArmed = false;
        bullet[me].isSucking = false;
        bullet[me].do = function () {
          //extra gravity for harder arcs
          this.force.y += this.mass * 0.0022;
          mech.fireCDcycle = mech.cycle + 10 //can't fire until after the explosion

          //set armed and sucking status
          if (!this.isArmed && !game.mouseDown) {
            this.isArmed = true
          } else if (this.isArmed && game.mouseDown && !this.isSucking) {
            this.isSucking = true;
            this.endCycle = game.cycle + 35;
          }

          if (this.isSucking) {
            if (!mech.isBodiesAsleep) {
              const that = this
              let mag = 0.1

              function suck(who, radius = that.explodeRad * 2) {
                for (i = 0, len = who.length; i < len; i++) {
                  const sub = Matter.Vector.sub(that.position, who[i].position);
                  const dist = Matter.Vector.magnitude(sub);
                  if (dist < radius && dist > 150) {
                    knock = Matter.Vector.mult(Matter.Vector.normalise(sub), mag * who[i].mass / Math.sqrt(dist));
                    who[i].force.x += knock.x;
                    who[i].force.y += knock.y;
                  }
                }
              }
              if (game.cycle > this.endCycle - 5) {
                mag = -0.22
                suck(body)
                suck(mob)
                suck(powerUp)
                suck(bullet)
                suck([player])
              } else {
                mag = 0.1
                suck(body)
                suck(mob)
                suck(powerUp)
                suck(bullet)
                suck([player])
              }
              //keep bomb in place
              Matter.Body.setVelocity(this, {
                x: 0,
                y: 0
              });
              //draw suck
              const radius = 2.5 * this.explodeRad * (this.endCycle - game.cycle) / 35
              ctx.fillStyle = "rgba(0,0,0,0.1)";
              ctx.beginPath();
              ctx.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
              ctx.fill();
            }
          } else {
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
              ctx.arc(this.position.x, this.position.y, this.radius * 0.5, 0, 2 * Math.PI);
              ctx.fill();
            }
          }
        }
      }
    }, {
      name: "ferro frag", //11
      description: "fire a <strong>grenade</strong> that ejects magnetized nails<br>nails are <strong>attracted</strong> to enemies",
      ammo: 0,
      ammoPack: 8,
      have: false,
      isStarterGun: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 15 * b.modBulletSize, b.fireAttributes(dir, false));
        b.fireProps(mech.crouch ? 40 : 30, mech.crouch ? 34 : 22, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
        bullet[me].endCycle = game.cycle + Math.floor(60 * b.isModBulletsLastLonger);
        bullet[me].restitution = 0.3;
        // bullet[me].frictionAir = 0.01;
        // bullet[me].friction = 0.15;
        // bullet[me].friction = 1;
        bullet[me].onEnd = () => {}
        bullet[me].do = function () {
          this.force.y += this.mass * 0.0018; //extra gravity for grenades

          if (game.cycle > this.endCycle - 1) {
            if (!mech.isBodiesAsleep) {
              //target nearby mobs
              const targets = []
              for (let i = 0, len = mob.length; i < len; i++) {
                if (mob[i].dropPowerUp) {
                  const sub = Matter.Vector.sub(this.position, mob[i].position);
                  const dist = Matter.Vector.magnitude(sub);
                  if (dist < 1400 &&
                    Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                    Matter.Query.ray(body, this.position, mob[i].position).length === 0) {
                    targets.push(
                      Matter.Vector.add(mob[i].position, Matter.Vector.mult(mob[i].velocity, dist / 60))
                    )
                  }
                }
              }
              for (let i = 0; i < 14; i++) {
                const speed = 55 + 10 * Math.random()
                if (targets.length > 0) { // aim near a random target
                  const index = Math.floor(Math.random() * targets.length)
                  const SPREAD = 150 / targets.length
                  const WHERE = {
                    x: targets[index].x + SPREAD * (Math.random() - 0.5),
                    y: targets[index].y + SPREAD * (Math.random() - 0.5)
                  }
                  needle(this.position, Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(WHERE, this.position)), speed))
                } else { // aim in random direction
                  const ANGLE = 2 * Math.PI * Math.random()
                  needle(this.position, {
                    x: speed * Math.cos(ANGLE),
                    y: speed * Math.sin(ANGLE)
                  })
                }

                function needle(pos, velocity) {
                  const me = bullet.length;
                  bullet[me] = Bodies.rectangle(pos.x, pos.y, 25 * b.modBulletSize, 2 * b.modBulletSize, b.fireAttributes(Math.atan2(velocity.y, velocity.x)));
                  Matter.Body.setVelocity(bullet[me], velocity);
                  World.add(engine.world, bullet[me]); //add bullet to world
                  bullet[me].endCycle = game.cycle + 60 + 15 * Math.random();
                  // bullet[me].dmg = 1.1+b.modExtraDmg;
                  bullet[me].do = function () {};
                }
              }
            }
          }
        }
      }
    }, {
      name: "spores", //12
      description: "fire orbs that discharge <strong style='letter-spacing: 2px;'>spores</strong><br><strong style='letter-spacing: 2px;'>spores</strong> seek out enemies",
      ammo: 0,
      ammoPack: 5,
      have: false,
      isStarterGun: false,
      fire() {
        const me = bullet.length;
        const dir = mech.angle;
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 20, 4.5, b.fireAttributes(dir, false));
        b.fireProps(mech.crouch ? 75 : 55, mech.crouch ? 25 : 14, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
        Matter.Body.setDensity(bullet[me], 0.000001);
        bullet[me].endCycle = game.cycle + 100;
        bullet[me].frictionAir = 0;
        bullet[me].friction = 0.5;
        bullet[me].restitution = 0.3;
        bullet[me].minDmgSpeed = 0;
        bullet[me].onDmg = function () {};
        bullet[me].do = function () {
          if (!mech.isBodiesAsleep) {
            const SCALE = 1.017
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
          const NUM = 9;
          for (let i = 0; i < NUM; i++) {
            const bIndex = bullet.length;
            const RADIUS = 3 * b.modBulletSize;
            bullet[bIndex] = Bodies.circle(this.position.x, this.position.y, RADIUS, {
              // density: 0.0015,			//frictionAir: 0.01,
              inertia: Infinity,
              restitution: 0.5,
              angle: dir,
              friction: 0,
              frictionAir: 0.011,
              dmg: 1.8 + b.modExtraDmg, //damage done in addition to the damage from momentum
              classType: "bullet",
              collisionFilter: {
                category: 0x000100,
                mask: 0x000011 //no collide with body
              },
              endCycle: game.cycle + Math.floor((360 + Math.floor(Math.random() * 240)) * b.isModBulletsLastLonger),
              minDmgSpeed: 0,
              onDmg() {
                this.endCycle = 0; //bullet ends cycle after doing damage 
              },
              onEnd() {},
              lookFrequency: 67 + Math.floor(47 * Math.random()),
              do() {
                //find mob targets
                if (!(game.cycle % this.lookFrequency)) {
                  this.closestTarget = null;
                  this.lockedOn = null;
                  let closeDist = Infinity;
                  for (let i = 0, len = mob.length; i < len; ++i) {
                    if (Matter.Query.ray(map, this.position, mob[i].position).length === 0) {
                      // Matter.Query.ray(body, this.position, mob[i].position).length === 0
                      const targetVector = Matter.Vector.sub(this.position, mob[i].position)
                      const dist = Matter.Vector.magnitude(targetVector);
                      if (dist < closeDist) {
                        this.closestTarget = mob[i].position;
                        closeDist = dist;
                        this.lockedOn = Matter.Vector.normalise(targetVector);
                        if (0.3 > Math.random()) break //doesn't always target the closest mob
                      }
                    }
                  }
                }
                //accelerate towards mobs
                const THRUST = this.mass * 0.0009
                if (this.lockedOn) {
                  this.force.x -= THRUST * this.lockedOn.x
                  this.force.y -= THRUST * this.lockedOn.y
                } else {
                  this.force.y += this.mass * 0.00025; //gravity
                }
              },
            });
            const SPEED = 9;
            const ANGLE = 2 * Math.PI * Math.random()
            Matter.Body.setVelocity(bullet[bIndex], {
              x: SPEED * Math.cos(ANGLE),
              y: SPEED * Math.sin(ANGLE)
            });
            World.add(engine.world, bullet[bIndex]); //add bullet to world
          }
        }

      }
    },
    {
      name: "drones", //13
      description: "deploy <strong>drones</strong> that seek out enemies<br>collisions reduce drone <strong>cycles</strong> by 1 second",
      ammo: 0,
      ammoPack: 17,
      have: false,
      isStarterGun: true,
      fire() {
        const THRUST = 0.0015
        const dir = mech.angle + 0.2 * (Math.random() - 0.5);
        const me = bullet.length;
        const RADIUS = (4.5 + 3 * Math.random()) * b.modBulletSize
        bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), RADIUS, {
          angle: dir,
          inertia: Infinity,
          friction: 0.05,
          frictionAir: 0.0005,
          restitution: 1,
          dmg: 0.13 + b.modExtraDmg, //damage done in addition to the damage from momentum
          lookFrequency: 83 + Math.floor(41 * Math.random()),
          endCycle: game.cycle + Math.floor((1080 + 360 * Math.random()) * b.isModBulletsLastLonger),
          classType: "bullet",
          collisionFilter: {
            category: 0x000100,
            mask: 0x010111 //self collide
          },
          minDmgSpeed: 0,
          lockedOn: null,
          isFollowMouse: true,
          onDmg() {
            this.lockedOn = null
            if (this.endCycle > game.cycle + 180) {
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
                    Matter.Query.ray(map, this.position, mob[i].position).length === 0 &&
                    Matter.Query.ray(body, this.position, mob[i].position).length === 0
                  ) {
                    const TARGET_VECTOR = Matter.Vector.sub(this.position, mob[i].position)
                    const DIST = Matter.Vector.magnitude(TARGET_VECTOR);
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
                      const TARGET_VECTOR = Matter.Vector.sub(this.position, powerUp[i].position)
                      const DIST = Matter.Vector.magnitude(TARGET_VECTOR);
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
                this.force = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(this.position, this.lockedOn.position)), -this.mass * THRUST)
              } else { //accelerate towards mouse
                this.force = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(this.position, game.mouseInGame)), -this.mass * THRUST)
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
        b.fireProps(mech.crouch ? 14 : 10, mech.crouch ? 40 : 1, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
      }
    },
    {
      name: "laser-bot", //14
      description: "deploy bots that <strong>defend</strong> against close threats<br>lasts one level, but drains <strong class='color-f'>energy</strong>",
      ammo: 0,
      ammoPack: 1,
      have: false,
      isStarterGun: false,
      fire() {
        const dir = mech.angle;
        const me = bullet.length;
        const RADIUS = (13 + 10 * Math.random()) * b.modBulletSize //(22 + 10 * Math.random()) * b.modBulletSize
        bullet[me] = Bodies.polygon(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), 3, RADIUS, {
          angle: dir,
          friction: 0,
          frictionStatic: 0,
          restitution: 0.5 + 0.5 * Math.random(),
          dmg: b.modExtraDmg, // 0.14   //damage done in addition to the damage from momentum
          minDmgSpeed: 2,
          lookFrequency: 37 + Math.floor(27 * Math.random()),
          acceleration: 0.0015 + 0.0013 * Math.random(),
          range: 500 + Math.floor(200 * Math.random()),
          endCycle: Infinity,
          classType: "bullet",
          collisionFilter: {
            category: 0x000100,
            mask: 0x010111 //self, mob,map,body collide
          },
          lockedOn: null,
          onDmg() {
            this.lockedOn = null
          },
          onEnd() {},
          do() {
            if (!(game.cycle % this.lookFrequency)) {
              this.lockedOn = null;
              let closeDist = this.range;
              for (let i = 0, len = mob.length; i < len; ++i) {
                const DIST = Matter.Vector.magnitude(Matter.Vector.sub(this.vertices[0], mob[i].position));
                if (DIST - mob[i].radius < closeDist &&
                  Matter.Query.ray(map, this.vertices[0], mob[i].position).length === 0 &&
                  Matter.Query.ray(body, this.vertices[0], mob[i].position).length === 0) {
                  closeDist = DIST;
                  this.lockedOn = mob[i]
                }
              }
            }

            const FIELD_DRAIN = 0.0016
            if (this.lockedOn && this.lockedOn.alive && mech.fieldMeter > FIELD_DRAIN) { //hit target with laser
              mech.fieldMeter -= FIELD_DRAIN

              //make sure you can still see target
              const DIST = Matter.Vector.magnitude(Matter.Vector.sub(this.vertices[0], this.lockedOn.position));
              if (DIST - this.lockedOn.radius < this.range + 150 &&
                Matter.Query.ray(map, this.vertices[0], this.lockedOn.position).length === 0 &&
                Matter.Query.ray(body, this.vertices[0], this.lockedOn.position).length === 0) {
                //find the closest vertex
                let bestVertexDistance = Infinity
                let bestVertex = null
                for (let i = 0; i < this.lockedOn.vertices.length; i++) {
                  const dist = Matter.Vector.magnitude(Matter.Vector.sub(this.vertices[0], this.lockedOn.vertices[i]));
                  if (dist < bestVertexDistance) {
                    bestVertex = i
                    bestVertexDistance = dist
                  }
                }
                const dmg = b.dmgScale * 0.03;
                this.lockedOn.damage(dmg);
                this.lockedOn.locatePlayer();

                //draw laser
                ctx.beginPath();
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

            const distanceToPlayer = Matter.Vector.magnitude(Matter.Vector.sub(this.position, mech.pos))
            if (distanceToPlayer > this.range * 0.2) { //if far away move towards player
              this.force = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(mech.pos, this.position)), this.mass * this.acceleration)
              this.frictionAir = 0.02
            } else { //close to player
              this.frictionAir = 0
              //add player's velocity
              Matter.Body.setVelocity(this, Matter.Vector.add(Matter.Vector.mult(this.velocity, 1), Matter.Vector.mult(player.velocity, 0.02)));
            }
          }
        })
        b.fireProps(mech.crouch ? 60 : 30, 15, dir, me); //cd , speed
        b.drawOneBullet(bullet[me].vertices);
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
    //     bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(dir), mech.pos.y + 30 * Math.sin(dir), 3 * b.modBulletSize, {
    //       density: 0.05,
    //       //frictionAir: 0.01,			
    //       restitution: 0,
    //       angle: 0,
    //       friction: 1,
    //       // frictionAir: 1,
    //       endCycle: game.cycle + TOTAL_CYCLES,
    //       dmg: b.modExtraDmg, //damage done in addition to the damage from momentum
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
    //             sub = Matter.Vector.sub(this.position, mob[i].position);
    //             dist = Matter.Vector.magnitude(sub) - mob[i].radius;
    //             if (dist < this.range) {
    //               mob[i].damage(dmg);
    //               mob[i].locatePlayer();
    //             }
    //           }
    //         }

    //         //pull in body, and power ups?, and bullets?
    //         for (let i = 0, len = body.length; i < len; ++i) {
    //           sub = Matter.Vector.sub(this.position, body[i].position);
    //           dist = Matter.Vector.magnitude(sub)
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
    //     bullet[me] = Bodies.rectangle(mech.pos.x + 50 * Math.cos(mech.angle), mech.pos.y + 50 * Math.sin(mech.angle), 70 * b.modBulletSize, 30 * b.modBulletSize, b.fireAttributes(dir));
    //     b.fireProps(mech.crouch ? 55 : 40, 50, dir, me); //cd , speed
    //     bullet[me].endCycle = game.cycle + Math.floor(180 * b.isModBulletsLastLonger);
    //     bullet[me].do = function () {
    //       this.force.y += this.mass * 0.0005;
    //     };

    //     //knock back
    //     const KNOCK = ((mech.crouch) ? 0.025 : 0.25) * b.modBulletSize * b.modBulletSize
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
    //     const RADIUS = 6 * b.modBulletSize
    //     bullet[me] = Bodies.circle(mech.pos.x + 30 * Math.cos(mech.angle), mech.pos.y + 30 * Math.sin(mech.angle), RADIUS, {
    //       angle: dir,
    //       inertia: Infinity,
    //       // friction: 0.05,
    //       // frictionAir: 0.05,
    //       restitution: 0.8,
    //       dmg: 0.14 + b.modExtraDmg, //damage done in addition to the damage from momentum
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
    //           this.force = Matter.Vector.mult(Matter.Vector.normalise(Matter.Vector.sub(this.position, this.lockedOn.position)), -this.mass * 0.01)
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
    //     b.drawOneBullet(bullet[me].vertices);

    //     //find mob targets
    //     let closeDist = Infinity;
    //     for (let i = 0, len = mob.length; i < len; ++i) {
    //       if (
    //         Matter.Query.ray(map, bullet[me].position, mob[i].position).length === 0 &&
    //         Matter.Query.ray(body, bullet[me].position, mob[i].position).length === 0
    //       ) {
    //         const TARGET_VECTOR = Matter.Vector.sub(bullet[me].position, mob[i].position)
    //         const DIST = Matter.Vector.magnitude(TARGET_VECTOR);
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