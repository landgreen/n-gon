"use strict";
/* TODO:  *******************************************
*****************************************************

run fast when shift is pressed
  drains fieldMeter

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
  when not near other mobs they try to group up.
    
gun power ups
  +explosion radius
  +dmg
  life steal
  +bullet size
  get bonus ammo / reduced ammo use
  bullets pass through walls
  unlimited ammo capacity
    add in a max ammo capacity



mutators (as a power up)
  infinite ammo
    or just more ammo from drops?
    or 50% chance to not use up a bullet?
  increased fire rate for guns
    how to make laser fire faster?
  orbiting orb fires at random targets
    missiles at random targets

  low gravity
  double jumps
  higher horizontal run speed?

  vampire damage
  shield (recharges fast, but only upto 10% of life)

Active use abilities (can get ideas from spacetime)
  blink (short distance teleport)
    would reverse if they end up in solid wall
  beacon teleport
  push (push blocks, mobs, and bullets away from player)
  invulnerability (force field that stops mobs and bullets)
  burst of speed
  intangible (can move through bodies, bullets, and mobs.  Not map elements)
  
game mechanics
  mechanics that support the physics engine
    add rope/constraint
  store/spawn bodies in player (like the game Starfall)
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

 give each foot a sensor to check for ground collisions
  	feet with not go into the ground even on slanted ground
 	this might be not worth it, but it might look really cool

track foot positions with velocity better as the player walks/crouch/runs

add bullet on damage effects
	effects could:
		add to the array mod.do new mob behaviors
			add a damage over time
			add a freeze
		change mob traits
			mass
			friction
			damage done
		change things about the bullet
			bounce the bullet again in a new direction
			fire several bullets as shrapnel
			increase the bullet size to do AOE dmg?? (how)
				just run a for loop over all mobs, and do damage to the one that are close
			bullets return to player
				use a constraint? does bullet just start with a constraint or is it added on damage?
		change the player
			vampire bullets heal for the damage done
				or give the player a shield??
				or only heal if the mob dies (might be tricky)
		remove standing on player actions
			replace with check if player feet are in an area.

unused ideas
passive: walk through blocks  (difficult to implement)






//collision info:
         category    mask
powerUp: 0x 100000   0x 100001
mobBull: 0x 010000   0x 001001
player:  0x 001000   0x 010011
bullet:  0x 000100   0x 000011
mob:     0x 000010   0x 001101
map:     0x 000001   0x 111111
body:    0x 000001   0x 011111

? hold:  0x 000001   0x 000001


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


// window.addEventListener("gamepadconnected", function (e) {
//   console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
//     e.gamepad.index, e.gamepad.id,
//     e.gamepad.buttons.length, e.gamepad.axes.length);

// });

game.loop = game.mouseLoop;
window.addEventListener("gamepadconnected", function (e) {
  console.log('gamepad connected')
  document.getElementById("gamepad").style.display = "inline";
  game.gamepad.connected = true;
  polGamepadCycle();
  game.loop = game.gamepadLoop;
});
window.addEventListener("gamepaddisconnected", function (e) {
  disconnectGamepad()
});

function disconnectGamepad() {
  console.log('gamepad disconnected')
  document.getElementById("gamepad").style.display = "none";
  game.gamepad.connected = false;
  game.loop = game.mouseLoop;
}

//this runs to get gamepad data even when paused
function polGamepadCycle() {
  game.gamepad.cycle++
  if (game.gamepad.connected) requestAnimationFrame(polGamepadCycle);
  game.polGamepad()
}


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