"use strict";
/* TODO:  *******************************************
*****************************************************

make player legs just slide if the player is above the normal speed
  like when you fire the one shot

make power ups keep moving to player if the field is turned off

levels spawn by having the map aspects randomly fly into place

new map with repeating endlessness
  get ideas from Manifold Garden game
  if falling, get teleported above the map
    this can apply to blocks mobs, and power ups as well


when paused show details on field, mods, guns?

Find a diegetic way to see player damage  (and or field meter too)
  a health meter, like the field meter above player?  (doesn't work with the field meter)

Add field upgrade, and mod to a permanent display
  left side
    separate box below guns
 

cap guns to 3
  can up the drop rate on guns, and lower ammo amount or drop rate
cap mods to 2
  can up the drop rate a bit
  check if there are any double mod compatibility issues
cap field to 1

what about no cap to mods?
  mods without caps can't have major negatives
  do I want to support a power ramping game play?
  more upgrades are OK as long as they change game play
    no flat damage, or flat defense buffs
  This makes skipping content a bad idea for the player
    Is that maybe good?  No need to nerf content skipping buffs
      content skipping is a cool play style, but not core game play


field power up effects
  field produces a whirlpool effect of force around player
  field allows player to hold and throw living mobs

Move mods, to power up object
  mods can be about more than the gun, defensive, traversal mods
gun mod power ups
  bullet on mob damage effects
    add to the array mob.do new mob behaviors
        add a damage over time
        add a freeze
  fire a few smaller bullets
  killing a mob triggers:  a spore bullet
    maybe you could replace the power method with a new one to get this to work
negative mods for balancing
  self damage on fire
  knock back
  lower fire rate
  smaller bullets
  smaller explosions
  shorter lasting bullets

give mobs more animal-like behaviors
  like rainworld
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

track foot positions with velocity better as the player walks/crouch/runs

Boss ideas
  boss grows and spilt, if you don't kill it fast
    sensor that locks you in after you enter the boss room
  boss that eats other mobs and gains stats from them
    chance to spawn on any level (past level 5)
  boss that knows how to shoot (player) bullets that collide with player 
    overwrite custom engine collision bullet mob function.



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
  game.mouseDown = false;
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