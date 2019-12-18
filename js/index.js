"use strict";
/* TODO:  *******************************************
*****************************************************

add builds with combinations of gun, field and mobs
  use the pull down menu

dynamically generate html about fields, guns and mods

add grid check to improve queries over large body arrays
  something about broad phase
  having trouble with this, might give up

gun: like drones, but fast moving and short lived
  dies after doing damage

gun:  Spirit Bomb (singularity)
  use charge up like rail gun
  electricity graphics like plasma torch
  suck in nearby mobs, power ups?, blocks?
    sucked in stuff increase size
  uses energy

mod: auto pick up guns, heals, ammo
  use the same rule for drones
  maybe give some other bonus too?

rework junk bot
  it's behavior is too unpredictable
    range is unclear
    having the bullets last long after doing dmg isn't fun
  we want a fun gun that acts like a melee weapon

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

mod power ups ideas
  double jump
  bullet on mob damage effects
    add to the array mob.do new mob behaviors
        add a damage over time
        add a freeze

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


// collision info:
            category    mask
powerUp:    0x100000   0x100001
body:       0x010000   0x011111
player:     0x001000   0x010011
bullet:     0x000100   0x010011
mob:        0x000010   0x011111
mobBullet:  0x000010   0x011101
mobShield:  0x000010   0x001100
map:        0x000001   0x111111




*/
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

    if (build.list.length < 5) { //add to build array
      // who.style.border = "2px solid #333"
      who.style.backgroundColor = "#919ba8" //"#868f9a"
      build.list[build.list.length] = {
        who: who,
        index: index,
        type: type
      }
    }
  },
  startBuildRun() {
    spawn.setSpawnList();
    spawn.setSpawnList();
    game.startGame();
    game.difficulty = 6;
    level.isBuildRun = true;
    for (let i = 0; i < build.list.length; i++) {
      if (build.list[i].type === "field") {
        mech.fieldUpgrades[build.list[i].index].effect();
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
    document.getElementById("controls").style.display = 'inline'
    document.getElementById("settings").style.display = 'inline'
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
    document.getElementById("controls").style.display = 'none'
    document.getElementById("settings").style.display = 'none'
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
  } else if (value === '72') {
    game.fpsCapDefault = 72
  } else if (value === '60') {
    game.fpsCapDefault = 60
  } else if (value === '45') {
    game.fpsCapDefault = 45
  } else if (value === '30') {
    game.fpsCapDefault = 30
  } else if (value === '15') {
    game.fpsCapDefault = 15
  }
});

document.getElementById("body-damage").addEventListener("input", () => {
  game.isBodyDamage = document.getElementById("body-damage").checked
});

// function playSound(id) {
//   //play sound
//   if (false) {
//     //sounds are turned off for now
//     // if (document.getElementById(id)) {
//     var sound = document.getElementById(id); //setup audio
//     sound.currentTime = 0; //reset position of playback to zero  //sound.load();
//     sound.play();
//   }
// }

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}



//main loop ************************************************************
//**********************************************************************
function cycle() {
  if (!game.paused) requestAnimationFrame(cycle);
  const now = Date.now();
  const elapsed = now - game.then; // calc elapsed time since last loop
  if (elapsed > game.fpsInterval) { // if enough time has elapsed, draw the next frame
    game.then = now - (elapsed % game.fpsInterval); // Get ready for next frame by setting then=now.   Also, adjust for fpsInterval not being multiple of 16.67
    game.loop();
  }
}