"use strict";
/* TODO:  *******************************************
*****************************************************

field power up effects
  field produces a whirlpool effect of force around player
  field allows player to hold and throw living mobs

other power up ideas
  killing a mob triggers:  a spore bullet
    maybe you could replace the power method with a new one to get this to work

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

add bullet on damage effects
	effects could:
		add to the array mob.do new mob behaviors
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