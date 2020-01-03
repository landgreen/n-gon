"use strict";
/* TODO:  *******************************************
*****************************************************

mod: fields do damage on blocking
  name: something about radiation?

mod: do something at the end of each level
  heal to full
    should still be effected by the heal reduction at higher difficulty
  give ammo to current gun
  give goals/quests for each level
    how to track goals?
    take no damage
    don't shoot

selection options for field to stay with current

custom mode grey out mods that are bad, like selection based mods
  not important

custom mode can't use recursive mods

field graphics too dark at high energy
  not important

rewrite pause as a change to the main loop
  not important
  like testing loop

game setting for slower computers
  fewer blocks
  fewer debris
  fewer mobs

mod: gain energy after taking damage
  use piezoelectric name  (already used)

mod: ground stomp on enterLand()

mod: if you fire when out of ammo you gain 1 ammo pack at the cost of
  10% max health
  20% of your current health

Boss mob:  triangle that fires three lasers

mob: has 2 or 3 shields that can regenerate over time
  could be just a boss

gun:  Spirit Bomb (singularity)
  use charge up like rail gun
  electricity graphics like plasma torch
  suck in nearby mobs, power ups?, blocks?
    sucked in stuff increase size
  uses energy

atmosphere levels
  large rotating fan that the player has to move through
  give the user a rest, between combat
  low combat
    nonaggressive mobs
      one mob attacking the passive mobs
  more graphics
  
Boss levels
  boss grows and spilt, if you don't kill it fast
    sensor that locks you in after you enter the boss room
  boss that eats other mobs and gains stats from them
    chance to spawn on any level (past level 5)
  boss that knows how to shoot (player) bullets that collide with player 
    overwrite custom engine collision bullet mob function.

add a key that player picks up and needs to set on the exit door to open it

make power ups keep moving to player if the pickup field is turned off before they get picked up
  not sure how to do this without adding a constant check

animate new level spawn by having the map aspects randomly fly into place

new map with repeating endlessness
  get ideas from Manifold Garden game
  if falling, get teleported above the map
    I tried it, but had trouble getting the camera to adjust to the teleportation
    this can apply to blocks mobs, and power ups as well
    
field power up effects
  field allows player to hold and throw living mobs
    of hack mobs

give mobs more animal-like behaviors
  like rain world
  give mobs something to do when they don't see player
    explore map
    eat power ups
      drop power up (if killed after eating one)
  mobs some times aren't aggressive
    when low on life or after taking a large hit
  mobs can fight each other
    this might be hard to code
  isolated mobs try to group up.
    
game mechanics
  mechanics that support the physics engine
    add rope/constraint
  get ideas from game: limbo / inside
  environmental hazards
    laser
    lava
  button / switch
  door
  fizzler
  moving platform
  map zones
    water
    low friction ground
    bouncy ground

*/

//  local storage
let localSettings = JSON.parse(localStorage.getItem("localSettings"));
// console.log(localSettings)
if (localSettings) {
  game.isBodyDamage = localSettings.isBodyDamage
  document.getElementById("body-damage").checked = localSettings.isBodyDamage

  game.difficultyMode = localSettings.difficultyMode
  document.getElementById("difficulty-select").value = localSettings.difficultyMode

  if (localSettings.fpsCapDefault === 'max') {
    game.fpsCapDefault = 999999999;
  } else {
    game.fpsCapDefault = Number(localSettings.fpsCapDefault)
  }
  document.getElementById("fps-select").value = localSettings.fpsCapDefault
} else {
  localSettings = {
    isBodyDamage: true,
    difficultyMode: '1',
    fpsCapDefault: '72',
  };
  localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}







//collision groups
//   cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet | cat.mobShield
const cat = {
  player: 0x1,
  map: 0x10,
  body: 0x100,
  bullet: 0x1000,
  powerUp: 0x10000,
  mob: 0x100000,
  mobBullet: 0x1000000,
  mobShield: 0x10000000,
}


//build build grid display
const build = {
  isShowingBuilds: false,
  list: [],
  choosePowerUp(who, index, type) {
    //check if matching a current power up
    // if (type === "field" || type === "gun") {
    for (let i = 0; i < build.list.length; i++) {
      if (build.list[i].index === index && build.list[i].type === type) { //if already click, toggle off
        build.list.splice(i, 1);
        who.style.backgroundColor = "#fff"
        return
      }
    }
    //check if trying to get a second field
    if (type === "field") {
      for (let i = 0; i < build.list.length; i++) {
        if (build.list[i].type === "field") { //if already click, toggle off
          build.list[i].who.style.backgroundColor = "#fff"
          build.list.splice(i, 1);
        }
      }
    }
    // } else { //type is mod

    //   //count each mod type to check for recursion caps
    //   let counts = []
    //   for (let i = 0; i < build.list.length; i++) {
    //     if (build.list[i].type === "mod") {
    //       if (!counts[build.list[i].index]) {
    //         counts[build.list[i].index] = 1
    //       } else {
    //         counts[build.list[i].index] = counts[build.list[i].index] + 1
    //       }
    //     }
    //   }

    //   for (let i = 0; i < build.list.length; i++) {
    //     //if above max count, toggle off
    //     if (build.list[i].index === index && build.list[i].type === type &&
    //       counts[index] >= b.mods[index].maxCount) {
    //       //remove all versions of mod


    //       who.style.backgroundColor = "#fff"
    //       return
    //     }
    //   }
    // }

    if (build.list.length < 5) { //add to build array
      who.style.backgroundColor = "#919ba8" //"#868f9a"
      build.list[build.list.length] = {
        who: who,
        index: index,
        type: type,
      }
    }
    console.log(build.list)
  },
  removeMod(index) {
    for (let i = build.list.length - 1; i > -1; i--) {
      if (build.list[i].type === "mod" && build.list[i].index === index) build.list.splice(i, 1);
    }
  },
  startBuildRun() {
    spawn.setSpawnList();
    spawn.setSpawnList(); //gives random mobs,  not starter
    game.startGame();
    game.difficulty = 6;
    level.isBuildRun = true;
    for (let i = 0; i < build.list.length; i++) {
      if (build.list[i].type === "field") {
        mech.setField(build.list[i].index)
      } else if (build.list[i].type === "gun") {
        b.giveGuns(build.list[i].index)
      } else if (build.list[i].type === "mod") {
        b.giveMod(build.list[i].index)
      }
    }
  }
}

document.getElementById("build-button").addEventListener("click", () => {
  document.getElementById("build-button").style.display = "none";
  const el = document.getElementById("build-grid")
  if (build.isShowingBuilds) {
    el.style.display = "none"
    build.isShowingBuilds = false
    document.body.style.overflow = "hidden"
    document.getElementById("info").style.display = 'inline'
  } else {
    build.list = []
    // let text = '<p>choose up to 5 powers<br>	<button type="button" id="build-begin-button" onclick="build.startBuildRun()">Begin Run</button></p>'
    let text =
      `<div style="display: flex; justify-content: center; align-items: center;">
        <svg class="SVG-button" onclick="build.startBuildRun()" width="90" height="40">
          <g stroke='none' fill='#333' stroke-width="2" font-size="30px" font-family="Ariel, sans-serif">
            <text x="15" y="31">start</text>
          </g>
        </svg>
      </div>
      <div class="build-grid-module" style="font-size: 1.05em; line-height: 170%;">
        Choose five power ups.<br>Click start to begin.
      </div>`
    for (let i = 1, len = mech.fieldUpgrades.length; i < len; i++) {
      text += `<div class="build-grid-module" onclick="build.choosePowerUp(this,${i},'field')"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[i].name}</div> ${mech.fieldUpgrades[i].description}</div>`
    }
    for (let i = 0, len = b.guns.length; i < len; i++) {
      text += `<div class="build-grid-module" onclick="build.choosePowerUp(this,${i},'gun')"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[i].name}</div> ${b.guns[i].description}</div>`
    }
    for (let i = 0, len = b.mods.length; i < len; i++) {
      text += `<div class="build-grid-module" onclick="build.choosePowerUp(this,${i},'mod')"><div class="grid-title"><div class="circle-grid mod"></div> &nbsp; ${b.mods[i].name}</div> ${b.mods[i].description}</div>`
    }
    el.innerHTML = text
    el.style.display = "grid"
    build.isShowingBuilds = true
    document.body.style.overflowY = "scroll";
    document.body.style.overflowX = "hidden";
    document.getElementById("info").style.display = 'none'
  }
});

//set up canvas
var canvas = document.getElementById("canvas");
//using "const" causes problems in safari when an ID shares the same name.
const ctx = canvas.getContext("2d");
document.body.style.backgroundColor = "#fff";

//disable pop up menu on right click
document.oncontextmenu = function () {
  return false;
}

function setupCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.width2 = canvas.width / 2; //precalculated because I use this often (in mouse look)
  canvas.height2 = canvas.height / 2;
  canvas.diagonal = Math.sqrt(canvas.width2 * canvas.width2 + canvas.height2 * canvas.height2);
  ctx.font = "15px Arial";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // ctx.lineCap='square';
  game.setZoom();
}
setupCanvas();
window.onresize = () => {
  setupCanvas();
};

//mouse move input
document.body.addEventListener("mousemove", (e) => {
  game.mouse.x = e.clientX;
  game.mouse.y = e.clientY;
});

document.body.addEventListener("mouseup", (e) => {
  // game.buildingUp(e); //uncomment when building levels
  // game.mouseDown = false;
  // console.log(e)
  if (e.which === 3) {
    game.mouseDownRight = false;
  } else {
    game.mouseDown = false;
  }
});

document.body.addEventListener("mousedown", (e) => {
  if (e.which === 3) {
    game.mouseDownRight = true;
  } else {
    game.mouseDown = true;
  }
});

//keyboard input
const keys = [];
document.body.addEventListener("keydown", (e) => {
  keys[e.keyCode] = true;
  game.keyPress();
});

document.body.addEventListener("keyup", (e) => {
  keys[e.keyCode] = false;
});

document.body.addEventListener("wheel", (e) => {
  if (e.deltaY > 0) {
    game.nextGun();
  } else {
    game.previousGun();
  }
}, {
  passive: true
});

document.getElementById("fps-select").addEventListener("input", () => {
  let value = document.getElementById("fps-select").value
  if (value === 'max') {
    game.fpsCapDefault = 999999999;
  } else {
    game.fpsCapDefault = Number(value)
  }
  localSettings.fpsCapDefault = value
  localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

document.getElementById("body-damage").addEventListener("input", () => {
  game.isBodyDamage = document.getElementById("body-damage").checked
  localSettings.isBodyDamage = game.isBodyDamage
  localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

document.getElementById("difficulty-select").addEventListener("input", () => {
  game.difficultyMode = Number(document.getElementById("difficulty-select").value)
  localSettings.difficultyMode = game.difficultyMode
  localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

//main loop ************************************************************
//**********************************************************************
game.loop = game.normalLoop;

function cycle() {
  if (!game.paused) requestAnimationFrame(cycle);
  const now = Date.now();
  const elapsed = now - game.then; // calc elapsed time since last loop
  if (elapsed > game.fpsInterval) { // if enough time has elapsed, draw the next frame
    game.then = now - (elapsed % game.fpsInterval); // Get ready for next frame by setting then=now.   Also, adjust for fpsInterval not being multiple of 16.67

    game.cycle++; //tracks game cycles
    mech.cycle++; //tracks player cycles  //used to alow time to stop for everything, but the player
    if (game.clearNow) {
      game.clearNow = false;
      game.clearMap();
      level.start();
    }

    game.loop();
    // for (let i = 0, len = loop.length; i < len; i++) {
    //   loop[i]()
    // }
  }
}