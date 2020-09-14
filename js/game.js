// game Object ********************************************************
//*********************************************************************
const game = {
  loop() {}, //main game loop, gets se tto normal or testing loop
  normalLoop() {
    game.gravity();
    Engine.update(engine, game.delta);
    game.wipe();
    game.textLog();
    if (mech.onGround) {
      mech.groundControl()
    } else {
      mech.airControl()
    }
    // level.checkZones();
    level.checkQuery();
    mech.move();
    mech.look();
    game.checks();
    ctx.save();
    game.camera();
    level.drawFillBGs();
    level.exit.draw();
    level.enter.draw();
    level.custom();
    game.draw.powerUp();
    mobs.draw();
    game.draw.cons();
    game.draw.body();
    mobs.loop();
    mobs.healthBar();
    mech.draw();
    mech.hold();
    // v.draw(); //working on visibility work in progress
    level.drawFills();
    level.customTopLayer();
    game.draw.drawMapPath();
    b.fire();
    b.bulletRemove();
    b.bulletDraw();
    b.bulletDo();
    game.drawCircle();
    // game.clip();
    ctx.restore();
    game.drawCursor();
    // game.pixelGraphics();
  },
  testingLoop() {
    game.gravity();
    Engine.update(engine, game.delta);
    game.wipe();
    game.textLog();
    if (mech.onGround) {
      mech.groundControl()
    } else {
      mech.airControl()
    }
    // level.checkZones();
    level.custom();
    level.checkQuery();
    mech.move();
    mech.look();
    game.checks();
    ctx.save();
    game.camera();
    mech.draw();
    level.customTopLayer();
    game.draw.wireFrame();
    game.draw.cons();
    game.draw.testing();
    game.drawCircle();
    game.constructCycle()
    ctx.restore();
    game.testingOutput();
    game.drawCursor();
  },
  isTimeSkipping: false,
  timeSkip(cycles = 60) {
    game.isTimeSkipping = true;
    for (let i = 0; i < cycles; i++) {
      game.cycle++;
      mech.cycle++;
      game.gravity();
      Engine.update(engine, game.delta);
      if (mech.onGround) {
        mech.groundControl()
      } else {
        mech.airControl()
      }

      level.checkZones();
      level.checkQuery();
      mech.move();
      game.checks();
      mobs.loop();
      // mech.draw();
      mech.walk_cycle += mech.flipLegs * mech.Vx;

      mech.hold();
      b.fire();
      b.bulletRemove();
      b.bulletDo();
    }
    game.isTimeSkipping = false;
  },
  mouse: {
    x: canvas.width / 2,
    y: canvas.height / 2
  },
  mouseInGame: {
    x: 0,
    y: 0
  },
  g: 0.0024, // applies to player, bodies, and power ups  (not mobs)
  onTitlePage: true,
  isCheating: false,
  paused: false,
  isChoosing: false,
  testing: false, //testing mode: shows wire frame and some variables
  cycle: 0, //total cycles, 60 per second
  fpsCap: null, //limits frames per second to 144/2=72,  on most monitors the fps is capped at 60fps by the hardware
  fpsCapDefault: 72, //use to change fpsCap back to normal after a hit from a mob
  isCommunityMaps: false,
  cyclePaused: 0,
  fallHeight: 3000, //below this y position the player dies
  lastTimeStamp: 0, //tracks time stamps for measuring delta
  delta: 1000 / 60, //speed of game engine //looks like it has to be 16 to match player input
  buttonCD: 0,
  isBodyDamage: true,
  levelsCleared: 0,
  difficultyMode: 1,
  isEasyMode: false,
  difficulty: 0,
  dmgScale: null, //set in levels.setDifficulty
  healScale: 1,
  accelScale: null, //set in levels.setDifficulty
  CDScale: null, //set in levels.setDifficulty
  lookFreqScale: null, //set in levels.setDifficulty
  mouseDown: false,
  // dropFPS(cap = 40, time = 15) {
  //   game.fpsCap = cap
  //   game.fpsInterval = 1000 / game.fpsCap;
  //   game.defaultFPSCycle = game.cycle + time
  //   const normalFPS = function () {
  //     if (game.defaultFPSCycle < game.cycle) {
  //       game.fpsCap = 72
  //       game.fpsInterval = 1000 / game.fpsCap;
  //     } else {
  //       requestAnimationFrame(normalFPS);
  //     }
  //   };
  //   requestAnimationFrame(normalFPS);
  // },
  // clip() {

  // },
  pixelGraphics() {
    //copy current canvas pixel data
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imgData.data;
    //change pixel data


    // const off = 4 * Math.floor(x) + 4 * canvas.width * Math.floor(y);
    // multiple windows
    for (let i = data.length / 2; i < data.length; i += 4) {
      index = i % (canvas.width * canvas.height * 2) // + canvas.width*4*canvas.height

      data[i + 0] = data[index + 0]; // red
      data[i + 1] = data[index + 1]; // red
      data[i + 2] = data[index + 2]; // red
      data[i + 3] = data[index + 3]; // red
    }

    for (let x = 0; x < len; x++) {

    }



    // const startX = 2 * canvas.width + 2 * canvas.width * canvas.height
    // const endX = 4 * canvas.width + 4 * canvas.width * canvas.height
    // const startY = 2 * canvas.width + 2 * canvas.width * canvas.height
    // const endY = 4 * canvas.width + 4 * canvas.width * canvas.height
    // for (let x = startX; x < endX; x++) {
    //   for (let y = startY; y < endY; y++) {

    //   }
    // }




    //strange draw offset
    // const off = canvas.height * canvas.width * 4 / 2
    // for (let index = 0; index < data.length; index += 4) {
    //   data[index + 0] = data[index + 0 + off]; // red
    //   data[index + 1] = data[index + 1 + off]; // red
    //   data[index + 2] = data[index + 2 + off]; // red
    //   data[index + 3] = data[index + 3 + off]; // red
    // }

    //change all pixels
    // for (let index = 0; index < data.length; index += 4) {
    // data[index + 0] = 255; // red
    // data[index + 1] = 255; // green
    // data[index + 2] = 255; // blue
    // data[index + 3] = 255; // alpha 
    // }

    //change random pixels
    // for (let i = 0, len = Math.floor(data.length / 10); i < len; ++i) {
    //   const index = Math.floor((Math.random() * data.length) / 4) * 4;
    //   data[index + 0] = 255; // red
    //   data[index + 1] = 0; // green
    //   data[index + 2] = 0; // blue
    //   data[index + 3] = 255 //Math.floor(Math.random() * Math.random() * 255); // alpha
    // }

    // //change random pixels
    // for (let i = 0, len = Math.floor(data.length / 1000); i < len; ++i) {
    //   const index = Math.floor((Math.random() * data.length) / 4) * 4;
    //   // data[index] = data[index] ^ 255; // Invert Red
    //   // data[index + 1] = data[index + 1] ^ 255; // Invert Green
    //   // data[index + 2] = data[index + 2] ^ 255; // Invert Blue
    //   data[index + 0] = 0; // red
    //   data[index + 1] = 0; // green
    //   data[index + 2] = 0; // blue
    //   // data[index + 3] = 255 //Math.floor(Math.random() * Math.random() * 255); // alpha
    // }

    //draw new pixel data to canvas
    ctx.putImageData(imgData, 0, 0);
  },
  drawCursor() {
    const size = 10;
    ctx.beginPath();
    ctx.moveTo(game.mouse.x - size, game.mouse.y);
    ctx.lineTo(game.mouse.x + size, game.mouse.y);
    ctx.moveTo(game.mouse.x, game.mouse.y - size);
    ctx.lineTo(game.mouse.x, game.mouse.y + size);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000"; //'rgba(0,0,0,0.4)'
    ctx.stroke(); // Draw it
  },
  drawList: [], //so you can draw a first frame of explosions.. I know this is bad
  drawTime: 8, //how long circles are drawn.  use to push into drawlist.time
  mobDmgColor: "rgba(255,0,0,0.7)", //used top push into drawList.color
  playerDmgColor: "rgba(0,0,0,0.7)", //used top push into drawList.color
  drawCircle() {
    //draws a circle for two cycles, used for showing damage mostly
    let i = game.drawList.length;
    while (i--) {
      ctx.beginPath(); //draw circle
      ctx.arc(game.drawList[i].x, game.drawList[i].y, game.drawList[i].radius, 0, 2 * Math.PI);
      ctx.fillStyle = game.drawList[i].color;
      ctx.fill();
      if (game.drawList[i].time) {
        //remove when timer runs out
        game.drawList[i].time--;
      } else {
        game.drawList.splice(i, 1);
      }
    }
  },
  lastLogTime: 0,
  lastLogTimeBig: 0,
  boldActiveGunHUD() {
    if (b.inventory.length > 0) {
      for (let i = 0, len = b.inventory.length; i < len; ++i) {
        // document.getElementById(b.inventory[i]).style.fontSize = "25px";
        document.getElementById(b.inventory[i]).style.opacity = "0.3";
      }
      // document.getElementById(b.activeGun).style.fontSize = "30px";
      if (document.getElementById(b.activeGun)) document.getElementById(b.activeGun).style.opacity = "1";
    }

    if (mod.isEntanglement && document.getElementById("mod-entanglement")) {
      if (b.inventory[0] === b.activeGun) {
        let lessDamage = 1
        for (let i = 0, len = b.inventory.length; i < len; i++) {
          lessDamage *= 0.87 // 1 - 0.15
        }
        document.getElementById("mod-entanglement").innerHTML = " " + ((1 - lessDamage) * 100).toFixed(0) + "%"
      } else {
        document.getElementById("mod-entanglement").innerHTML = " 0%"
      }
    }
  },
  updateGunHUD() {
    for (let i = 0, len = b.inventory.length; i < len; ++i) {
      document.getElementById(b.inventory[i]).innerHTML = b.guns[b.inventory[i]].name + " - " + b.guns[b.inventory[i]].ammo;
    }
  },
  makeGunHUD() {
    //remove all nodes
    const myNode = document.getElementById("guns");
    while (myNode.firstChild) {
      myNode.removeChild(myNode.firstChild);
    }
    //add nodes
    for (let i = 0, len = b.inventory.length; i < len; ++i) {
      const node = document.createElement("div");
      node.setAttribute("id", b.inventory[i]);
      let textnode = document.createTextNode(b.guns[b.inventory[i]].name + " - " + b.guns[b.inventory[i]].ammo);
      node.appendChild(textnode);
      document.getElementById("guns").appendChild(node);
    }
    game.boldActiveGunHUD();
  },
  updateModHUD() {
    let text = ""
    for (let i = 0, len = mod.mods.length; i < len; i++) { //add mods
      if (mod.mods[i].isLost) {
        if (text) text += "<br>" //add a new line, but not on the first line
        text += `<span style="text-decoration: line-through;">${mod.mods[i].name}</span>`
      } else if (mod.mods[i].count > 0) {
        if (text) text += "<br>" //add a new line, but not on the first line
        text += mod.mods[i].name
        if (mod.mods[i].nameInfo) {
          text += mod.mods[i].nameInfo
          mod.mods[i].addNameInfo();
        }
        if (mod.mods[i].count > 1) text += ` (${mod.mods[i].count}x)`
      }
    }
    document.getElementById("mods").innerHTML = text
  },
  replaceTextLog: true,
  // <!-- <path d="M832.41,106.64 V323.55 H651.57 V256.64 c0-82.5,67.5-150,150-150 Z" fill="#789" stroke="none" />
  // <path d="M827,112 h30 a140,140,0,0,1,140,140 v68 h-167 z" fill="#7ce" stroke="none" /> -->
  // SVGleftMouse: '<svg viewBox="750 0 200 765" class="mouse-icon" width="40px" height = "60px" stroke-linecap="round" stroke-linejoin="round" stroke-width="25px" stroke="#000" fill="none">  <path fill="#fff" stroke="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M832.41,106.64 V323.55 H651.57 V256.64 c0-82.5,67.5-150,150-150 Z" fill="#149" stroke="none" />  <path fill="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M657 317 h 340 h-170 v-207" />  <ellipse fill="#fff" cx="827.57" cy="218.64" rx="29" ry="68" />  </svg>',
  SVGrightMouse: '<svg viewBox="750 0 200 765" class="mouse-icon" width="40px" height = "60px" stroke-linecap="round" stroke-linejoin="round" stroke-width="25px" stroke="#000" fill="none">  <path fill="#fff" stroke="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M827,112 h30 a140,140,0,0,1,140,140 v68 h-167 z" fill="#0cf" stroke="none" />  <path fill="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M657 317 h 340 h-170 v-207" />  <ellipse fill="#fff" cx="827.57" cy="218.64" rx="29" ry="68" />  </svg>',
  makeTextLog(text, time = 180) {
    if (game.replaceTextLog) {
      document.getElementById("text-log").innerHTML = text;
      document.getElementById("text-log").style.opacity = 1;
      game.lastLogTime = mech.cycle + time;
    }
  },
  textLog() {
    if (game.lastLogTime && game.lastLogTime < mech.cycle) {
      game.lastLogTime = 0;
      game.replaceTextLog = true
      // document.getElementById("text-log").innerHTML = " ";
      document.getElementById("text-log").style.opacity = 0;
    }
  },
  nextGun() {
    if (b.inventory.length > 0 && !mod.isGunCycle) {
      b.inventoryGun++;
      if (b.inventoryGun > b.inventory.length - 1) b.inventoryGun = 0;
      game.switchGun();
    }
  },
  previousGun() {
    if (b.inventory.length > 0 && !mod.isGunCycle) {
      b.inventoryGun--;
      if (b.inventoryGun < 0) b.inventoryGun = b.inventory.length - 1;
      game.switchGun();
    }
  },
  switchGun() {
    if (mod.isCrouchAmmo) mod.isCrouchAmmo = 1 //this prevents hacking the mod by switching guns
    b.activeGun = b.inventory[b.inventoryGun];
    game.updateGunHUD();
    game.boldActiveGunHUD();
    // mech.drop();
  },
  keyPress() { //runs on key down event
    //full screen toggle
    // if (keys[13]) {
    //   //enter key
    //   var doc = window.document;
    //   var docEl = doc.documentElement;

    //   var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    //   var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    //   if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    //     requestFullScreen.call(docEl);
    //   } else {
    //     cancelFullScreen.call(doc);
    //   }
    //   setupCanvas();
    // }

    //color testing
    // if (keys[49]) {
    //   mech.color.hue--
    //   mech.setFillColors();
    // } else if (keys[50]) {
    //   mech.color.hue++
    //   mech.setFillColors();
    // } else if (keys[51]) {
    //   mech.color.sat--
    //   mech.setFillColors();
    // } else if (keys[52]) {
    //   mech.color.sat++
    //   mech.setFillColors();
    // } else if (keys[53]) {
    //   mech.color.light--
    //   mech.setFillColors();
    // } else if (keys[54]) {
    //   mech.color.light++
    //   mech.setFillColors();
    // }

    if (keys[69]) { // e    swap to next active gun
      game.nextGun();
    } else if (keys[81]) { //q    swap to previous active gun
      game.previousGun();
    }
    if (keys[80] && !game.isChoosing) { //p  for pause
      if (game.paused) {
        build.unPauseGrid()
        game.paused = false;
        level.levelAnnounce();
        document.body.style.cursor = "none";
        requestAnimationFrame(cycle);
      } else {
        game.paused = true;
        game.replaceTextLog = true;
        // game.makeTextLog("<h1>PAUSED</h1>", 1);
        //display grid
        // document.title = "PAUSED: press P to resume";
        build.pauseGrid()
        document.body.style.cursor = "auto";
      }
    }

    //toggle testing mode
    if (keys[84]) {
      // 84 = t
      if (game.testing) {
        game.testing = false;
        game.loop = game.normalLoop
        if (game.isConstructionMode) {
          document.getElementById("construct").style.display = 'none'
        }
      } else { //if (keys[191])
        game.testing = true;
        game.isCheating = true;
        if (game.isConstructionMode) {
          document.getElementById("construct").style.display = 'inline'
        }
        game.loop = game.testingLoop
      }
    }
    //in testing mode
    if (game.testing) {

      if (keys[79]) {
        // - key
        game.isAutoZoom = false;
        game.zoomScale /= 0.9;
        game.setZoom();
      } else if (keys[73]) {
        // = key
        game.isAutoZoom = false;
        game.zoomScale *= 0.9;
        game.setZoom();
      }

      if (keys[192]) { // `
        powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "reroll");
      } else if (keys[49]) { // give power ups with 1
        powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "heal");
      } else if (keys[50]) { // 2
        powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "ammo");
      } else if (keys[51]) { // 3
        powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "gun");
      } else if (keys[52]) { // 4
        powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "field");
      } else if (keys[53]) { // 5
        powerUps.directSpawn(game.mouseInGame.x, game.mouseInGame.y, "mod");
      } else if (keys[54]) { // 6  spawn mob
        const pick = spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)];
        spawn.allowShields = false;
        spawn[pick](game.mouseInGame.x, game.mouseInGame.y);
        spawn.allowShields = true;
      } else if (keys[55]) { // 7  spawn body
        index = body.length
        spawn.bodyRect(game.mouseInGame.x, game.mouseInGame.y, 50, 50);
        body[index].collisionFilter.category = cat.body;
        body[index].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
        body[index].classType = "body";
        World.add(engine.world, body[index]); //add to world
      } else if (keys[70]) { //cycle fields with F
        const mode = (mech.fieldMode === mech.fieldUpgrades.length - 1) ? 0 : mech.fieldMode + 1
        mech.setField(mode)
      } else if (keys[71]) { // give all guns with G
        b.giveGuns("all", 1000)
      } else if (keys[72]) { // heal with H
        mech.addHealth(Infinity)
        mech.energy = mech.maxEnergy;
      } else if (keys[89]) { //add mods with y
        mod.giveMod()
      } else if (keys[82]) { // teleport to mouse with R
        Matter.Body.setPosition(player, game.mouseInGame);
        Matter.Body.setVelocity(player, {
          x: 0,
          y: 0
        });
        // move bots to follow player
        for (let i = 0; i < bullet.length; i++) {
          if (bullet[i].botType) {
            Matter.Body.setPosition(bullet[i], player.position);
            Matter.Body.setVelocity(bullet[i], {
              x: 0,
              y: 0
            });
          }
        }
        // game.noCameraScroll()
      } else if (keys[85]) { // next level with U
        level.nextLevel();
      } else if (keys[88] && keys[90]) {
        mech.death();
      }
    }
  },
  zoom: null,
  zoomScale: 1000,
  isAutoZoom: true,
  setZoom(zoomScale = game.zoomScale) { //use in window resize in index.js
    game.zoomScale = zoomScale
    game.zoom = canvas.height / zoomScale; //sets starting zoom scale
  },
  zoomTransition(newZoomScale, step = 2) {
    if (game.isAutoZoom) {
      const isBigger = (newZoomScale - game.zoomScale > 0) ? true : false;
      requestAnimationFrame(zLoop);
      const currentLevel = level.onLevel

      function zLoop() {
        if (currentLevel !== level.onLevel || game.isAutoZoom === false) return //stop the zoom if player goes to a new level

        if (isBigger) {
          game.zoomScale += step
          if (game.zoomScale >= newZoomScale) {
            game.setZoom(newZoomScale);
            return
          }
        } else {
          game.zoomScale -= step
          if (game.zoomScale <= newZoomScale) {
            game.setZoom(newZoomScale);
            return
          }
        }

        game.setZoom();
        requestAnimationFrame(zLoop);
      }
    }
  },
  zoomInFactor: 0,
  startZoomIn(time = 180) {
    game.zoom = 0;
    let count = 0;
    requestAnimationFrame(zLoop);

    function zLoop() {
      game.zoom += canvas.height / game.zoomScale / time;
      count++;
      if (count < time) {
        requestAnimationFrame(zLoop);
      } else {
        game.setZoom();
      }
    }
  },
  noCameraScroll() { //makes the camera not scroll after changing locations
    //only works if velocity is zero
    mech.pos.x = player.position.x;
    mech.pos.y = playerBody.position.y - mech.yOff;
    const scale = 0.8;
    mech.transSmoothX = canvas.width2 - mech.pos.x - (game.mouse.x - canvas.width2) * scale;
    mech.transSmoothY = canvas.height2 - mech.pos.y - (game.mouse.y - canvas.height2) * scale;
    mech.transX += (mech.transSmoothX - mech.transX) * 1;
    mech.transY += (mech.transSmoothY - mech.transY) * 1;
  },
  edgeZoomOutSmooth: 1,
  camera() {
    //zoom out when mouse gets near the edge of the window
    const dx = game.mouse.x / window.innerWidth - 0.5 //x distance from mouse to window center scaled by window width
    const dy = game.mouse.y / window.innerHeight - 0.5 //y distance from mouse to window center scaled by window height
    const d = Math.max(dx * dx, dy * dy)
    game.edgeZoomOutSmooth = (1 + 4 * d * d) * 0.04 + game.edgeZoomOutSmooth * 0.96


    ctx.save();
    ctx.translate(canvas.width2, canvas.height2); //center
    ctx.scale(game.zoom / game.edgeZoomOutSmooth, game.zoom / game.edgeZoomOutSmooth); //zoom in once centered
    ctx.translate(-canvas.width2 + mech.transX, -canvas.height2 + mech.transY); //translate
    //calculate in game mouse position by undoing the zoom and translations
    game.mouseInGame.x = (game.mouse.x - canvas.width2) / game.zoom * game.edgeZoomOutSmooth + canvas.width2 - mech.transX;
    game.mouseInGame.y = (game.mouse.y - canvas.height2) / game.zoom * game.edgeZoomOutSmooth + canvas.height2 - mech.transY;
  },
  restoreCamera() {
    ctx.restore();
  },
  wipe() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },
  gravity() {
    function addGravity(bodies, magnitude) {
      for (var i = 0; i < bodies.length; i++) {
        bodies[i].force.y += bodies[i].mass * magnitude;
      }
    }
    addGravity(powerUp, game.g);
    addGravity(body, game.g);
    player.force.y += player.mass * game.g;
  },
  reset() { //run on first run, and each later run after you die
    b.removeAllGuns();
    mod.setupAllMods(); //sets mods to default values
    b.setFireCD();
    game.updateModHUD();
    powerUps.totalPowerUps = 0;
    powerUps.reroll.rerolls = 0;
    mech.setFillColors();
    mech.maxHealth = 1
    mech.maxEnergy = 1
    mech.energy = 1
    game.paused = false;
    engine.timing.timeScale = 1;
    game.fpsCap = game.fpsCapDefault;
    game.isAutoZoom = true;
    game.makeGunHUD();
    mech.drop();
    mech.holdingTarget = null
    mech.addHealth(Infinity);
    mech.alive = true;
    level.onLevel = 0;
    level.levelsCleared = 0;

    //resetting difficulty
    game.dmgScale = 1;
    b.dmgScale = 0.7;
    game.accelScale = 1;
    game.lookFreqScale = 1;
    game.CDScale = 1;
    game.difficulty = 0;
    game.difficultyMode = Number(document.getElementById("difficulty-select").value)
    build.isCustomSelection = false;
    if (game.difficultyMode === 0) {
      game.isEasyMode = true;
      game.difficultyMode = 1
      level.difficultyDecrease(6); //if this stops being -6  change in build.calculateCustomDifficulty()
    }
    if (game.difficultyMode === 4) level.difficultyIncrease(3)

    game.clearNow = true;
    document.getElementById("text-log").style.opacity = 0;
    document.getElementById("fade-out").style.opacity = 0;
    document.title = "n-gon";
    //set to default field
    mech.fieldMode = 0;
    game.replaceTextLog = true;
    game.makeTextLog(`${game.SVGrightMouse}<strong style='font-size:30px;'> ${mech.fieldUpgrades[mech.fieldMode].name}</strong><br><span class='faded'></span><br>${mech.fieldUpgrades[mech.fieldMode].description}`, 600);
    mech.setField(mech.fieldMode)
    //exit testing
    if (game.testing) {
      game.testing = false;
      game.loop = game.normalLoop
      if (game.isConstructionMode) {
        document.getElementById("construct").style.display = 'none'
      }
    }
    game.isCheating = false
  },
  firstRun: true,
  splashReturn() {
    game.onTitlePage = true;
    // document.getElementById('splash').onclick = 'run(this)';
    document.getElementById("splash").onclick = function () {
      game.startGame();
    };
    document.getElementById("choose-grid").style.display = "none"
    document.getElementById("info").style.display = "inline";
    document.getElementById("build-button").style.display = "inline"
    document.getElementById("build-grid").style.display = "none"
    document.getElementById("pause-grid-left").style.display = "none"
    document.getElementById("pause-grid-right").style.display = "none"
    document.getElementById("splash").style.display = "inline";
    document.getElementById("dmg").style.display = "none";
    document.getElementById("health-bg").style.display = "none";
    document.body.style.cursor = "auto";
  },
  fpsInterval: 0, //set in startGame
  then: null,
  startGame(isBuildRun = false) {
    if (!isBuildRun) { //if a build run logic flow returns to "build-button").addEventListener
      document.body.style.cursor = "none";
      document.body.style.overflow = "hidden"
    }
    game.onTitlePage = false;
    document.getElementById("choose-grid").style.display = "none"
    document.getElementById("build-grid").style.display = "none"
    document.getElementById("info").style.display = "none";
    document.getElementById("build-button").style.display = "none";
    document.getElementById("splash").onclick = null; //removes the onclick effect so the function only runs once
    document.getElementById("splash").style.display = "none"; //hides the element that spawned the function
    document.getElementById("dmg").style.display = "inline";
    document.getElementById("health-bg").style.display = "inline";

    if (game.firstRun) {
      mech.spawn(); //spawns the player
      if (game.isCommunityMaps) {
        level.levels.push("stronghold");
        level.levels.push("basement");
        level.levels.push("house");
        // level.levels.push("newLevel");
      }
      level.levels = shuffle(level.levels); //shuffles order of maps
      level.levels.unshift("bosses"); //add bosses level to the end of the randomized levels list
    }
    game.reset();
    game.firstRun = false;

    //setup FPS cap
    game.fpsInterval = 1000 / game.fpsCap;
    game.then = Date.now();
    requestAnimationFrame(cycle); //starts game loop
  },
  clearNow: false,
  clearMap() {
    if (mod.isMineAmmoBack) {
      let count = 0;
      for (i = 0, len = bullet.length; i < len; i++) { //count mines left on map
        if (bullet[i].bulletType === "mine") count++
      }
      for (i = 0, len = b.guns.length; i < len; i++) { //find which gun is mine
        if (b.guns[i].name === "mine") {
          if (mod.isCrouchAmmo) count = Math.ceil(count / 2)
          b.guns[i].ammo += count
          game.updateGunHUD();
          break;
        }
      }
    }

    if (mod.isMutualism && !mod.isEnergyHealth) {
      for (let i = 0; i < bullet.length; i++) {
        if (bullet[i].isMutualismActive) {
          mech.health += 0.01
          if (mech.health > mech.maxHealth) mech.health = mech.maxHealth;
          mech.displayHealth();
        }
      }
    }

    powerUps.totalPowerUps = powerUp.length

    let holdTarget; //if player is holding something this remembers it before it gets deleted
    if (mech.holdingTarget) holdTarget = mech.holdingTarget;

    mech.fireCDcycle = 0
    mech.drop();
    level.fill = [];
    level.fillBG = [];
    level.zones = [];
    level.queryList = [];
    game.drawList = [];

    function removeAll(array) {
      for (let i = 0; i < array.length; ++i) Matter.World.remove(engine.world, array[i]);
    }
    removeAll(map);
    map = [];
    removeAll(body);
    body = [];
    removeAll(mob);
    mob = [];
    removeAll(powerUp);
    powerUp = [];
    removeAll(cons);
    cons = [];
    removeAll(consBB);
    consBB = [];
    removeAll(bullet);
    bullet = [];
    removeAll(composite);
    composite = [];
    // if player was holding something this makes a new copy to hold
    if (holdTarget) {
      len = body.length;
      body[len] = Matter.Bodies.fromVertices(0, 0, holdTarget.vertices, {
        friction: holdTarget.friction,
        frictionAir: holdTarget.frictionAir,
        frictionStatic: holdTarget.frictionStatic
      });
      Matter.Body.setPosition(body[len], mech.pos);
      mech.isHolding = true
      mech.holdingTarget = body[len];
      mech.holdingTarget.collisionFilter.category = 0;
      mech.holdingTarget.collisionFilter.mask = 0;
    }
    //set fps back to default
    game.fpsCap = game.fpsCapDefault
    game.fpsInterval = 1000 / game.fpsCap;
  },
  getCoords: {
    //used when building maps, outputs a draw rect command to console, only works in testing mode
    pos1: {
      x: 0,
      y: 0
    },
    pos2: {
      x: 0,
      y: 0
    },
    out() {
      if (keys[49]) {
        game.getCoords.pos1.x = Math.round(game.mouseInGame.x / 25) * 25;
        game.getCoords.pos1.y = Math.round(game.mouseInGame.y / 25) * 25;
      }
      if (keys[50]) {
        //press 1 in the top left; press 2 in the bottom right;copy command from console
        game.getCoords.pos2.x = Math.round(game.mouseInGame.x / 25) * 25;
        game.getCoords.pos2.y = Math.round(game.mouseInGame.y / 25) * 25;
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(document.getElementById("test"));
        window.getSelection().addRange(range);
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
        console.log(`spawn.mapRect(${game.getCoords.pos1.x}, ${game.getCoords.pos1.y}, ${game.getCoords.pos2.x - game.getCoords.pos1.x}, ${game.getCoords.pos2.y - game.getCoords.pos1.y}); //`);
      }
    }
  },
  checks() {
    if (!(mech.cycle % 60)) { //once a second
      if (mech.pos.y > game.fallHeight) { // if 4000px deep
        if (game.difficultyMode > 2) {
          mech.death();
        } else {

          // Matter.Body.setPosition(player, {
          //   x: player.position.x,
          //   y: level.enter.y - 5000
          // });

          // mech.pos.x = player.position.x;
          // mech.pos.y = playerBody.position.y - mech.yOff;
          // const scale = 0.8;
          // const velocityScale = 12
          // mech.transSmoothX = canvas.width2 - mech.pos.x - (game.mouse.x - canvas.width2) * scale + player.velocity.x * velocityScale;
          // mech.transSmoothY = canvas.height2 - mech.pos.y - (game.mouse.y - canvas.height2) * scale + player.velocity.y * velocityScale;
          // mech.transX += (mech.transSmoothX - mech.transX) * 1;
          // mech.transY += (mech.transSmoothY - mech.transY) * 1;

          Matter.Body.setVelocity(player, {
            x: 0,
            y: 0
          });
          Matter.Body.setPosition(player, {
            x: level.enter.x + 50,
            y: level.enter.y - 20
          });
          // move bots
          for (let i = 0; i < bullet.length; i++) {
            if (bullet[i].botType) {
              Matter.Body.setPosition(bullet[i], player.position);
              Matter.Body.setVelocity(bullet[i], {
                x: 0,
                y: 0
              });
            }
          }
          if (game.difficultyMode === 2) mech.damage(0.25);
          if (game.difficultyMode === 1) mech.damage(0.1);
          mech.energy = 0.01;
        }
      }

      // if (mod.isEnergyDamage) {
      //   document.getElementById("mod-capacitor").innerHTML = `(+${(mech.energy/0.05).toFixed(0)}%)`
      // }
      // if (mod.isRest) {
      //   if (player.speed < 1) {
      //     document.getElementById("mod-rest").innerHTML = `(+20%)`
      //   } else {
      //     document.getElementById("mod-rest").innerHTML = `(+0%)`
      //   }
      // }

      if (mech.lastKillCycle + 300 > mech.cycle) { //effects active for 5 seconds after killing a mob
        if (mod.isEnergyRecovery && mech.energy < mech.maxEnergy) mech.energy += mech.maxEnergy * 0.06
        if (mod.isHealthRecovery) mech.addHealth(0.01)
      }

      if (!(game.cycle % 420)) { //once every 7 seconds
        fallCheck = function (who, save = false) {
          let i = who.length;
          while (i--) {
            if (who[i].position.y > game.fallHeight) {
              if (save && game.difficultyMode < 3) {
                Matter.Body.setVelocity(who[i], {
                  x: 0,
                  y: 0
                });
                Matter.Body.setPosition(who[i], {
                  x: level.exit.x + 30 * (Math.random() - 0.5),
                  y: level.exit.y + 30 * (Math.random() - 0.5)
                });
              } else {
                Matter.World.remove(engine.world, who[i]);
                who.splice(i, 1);
              }
            }
          }
        };
        fallCheck(mob);
        fallCheck(body);
        fallCheck(powerUp, true);
      }
    }
  },
  testingOutput() {
    ctx.fillStyle = "#000";
    if (!game.isConstructionMode) {
      // ctx.textAlign = "right";
      ctx.fillText("T: exit testing mode", canvas.width / 2, canvas.height - 10);
      // let line = 500;
      // const x = canvas.width - 5;
      // ctx.fillText("T: exit testing mode", x, line);
      // line += 20;
      // ctx.fillText("Y: give all mods", x, line);
      // line += 20;
      // ctx.fillText("R: teleport to mouse", x, line);
      // line += 20;
      // ctx.fillText("F: cycle field", x, line);
      // line += 20;
      // ctx.fillText("G: give all guns", x, line);
      // line += 20;
      // ctx.fillText("H: heal", x, line);
      // line += 20;
      // ctx.fillText("U: next level", x, line);
      // line += 20;
      // ctx.fillText("1-7: spawn things", x, line);
    }
    ctx.textAlign = "center";
    ctx.fillText(`(${game.mouseInGame.x.toFixed(1)}, ${game.mouseInGame.y.toFixed(1)})`, game.mouse.x, game.mouse.y - 20);
  },
  draw: {
    powerUp() {
      ctx.globalAlpha = 0.4 * Math.sin(mech.cycle * 0.15) + 0.6;
      for (let i = 0, len = powerUp.length; i < len; ++i) {
        ctx.beginPath();
        ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
        ctx.fillStyle = powerUp[i].color;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    // map: function() {
    //     ctx.beginPath();
    //     for (let i = 0, len = map.length; i < len; ++i) {
    //         let vertices = map[i].vertices;
    //         ctx.moveTo(vertices[0].x, vertices[0].y);
    //         for (let j = 1; j < vertices.length; j += 1) {
    //             ctx.lineTo(vertices[j].x, vertices[j].y);
    //         }
    //         ctx.lineTo(vertices[0].x, vertices[0].y);
    //     }
    //     ctx.fillStyle = "#444";
    //     ctx.fill();
    // },
    mapPath: null, //holds the path for the map to speed up drawing
    setPaths() {
      //runs at each new level to store the path for the map since the map doesn't change
      game.draw.mapPath = new Path2D();
      for (let i = 0, len = map.length; i < len; ++i) {
        let vertices = map[i].vertices;
        game.draw.mapPath.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j += 1) {
          game.draw.mapPath.lineTo(vertices[j].x, vertices[j].y);
        }
        game.draw.mapPath.lineTo(vertices[0].x, vertices[0].y);
      }
    },
    mapFill: "#444",
    bodyFill: "rgba(140,140,140,0.85)", //"#999",
    bodyStroke: "#222",
    drawMapPath() {
      ctx.fillStyle = game.draw.mapFill;
      ctx.fill(game.draw.mapPath);
    },
    body() {
      ctx.beginPath();
      for (let i = 0, len = body.length; i < len; ++i) {
        let vertices = body[i].vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j++) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
      }
      ctx.lineWidth = 2;
      ctx.fillStyle = game.draw.bodyFill;
      ctx.fill();
      ctx.strokeStyle = game.draw.bodyStroke;
      ctx.stroke();
    },
    cons() {
      ctx.beginPath();
      for (let i = 0, len = cons.length; i < len; ++i) {
        ctx.moveTo(cons[i].pointA.x, cons[i].pointA.y);
        ctx.lineTo(cons[i].bodyB.position.x, cons[i].bodyB.position.y);
      }
      for (let i = 0, len = consBB.length; i < len; ++i) {
        ctx.moveTo(consBB[i].bodyA.position.x, consBB[i].bodyA.position.y);
        ctx.lineTo(consBB[i].bodyB.position.x, consBB[i].bodyB.position.y);
      }
      ctx.lineWidth = 2;
      // ctx.strokeStyle = "#999";
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.stroke();
    },
    wireFrame() {
      // ctx.textAlign = "center";
      // ctx.textBaseline = "middle";
      // ctx.fillStyle = "#999";
      const bodies = Composite.allBodies(engine.world);
      ctx.beginPath();
      for (let i = 0; i < bodies.length; ++i) {
        //ctx.fillText(bodies[i].id,bodies[i].position.x,bodies[i].position.y);  //shows the id of every body
        let vertices = bodies[i].vertices;
        ctx.moveTo(vertices[0].x, vertices[0].y);
        for (let j = 1; j < vertices.length; j += 1) {
          ctx.lineTo(vertices[j].x, vertices[j].y);
        }
        ctx.lineTo(vertices[0].x, vertices[0].y);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#000";
      ctx.stroke();
    },
    testing() {
      //query zones
      // ctx.beginPath();
      // for (let i = 0, len = level.queryList.length; i < len; ++i) {
      //   ctx.rect(
      //     level.queryList[i].bounds.max.x,
      //     level.queryList[i].bounds.max.y,
      //     level.queryList[i].bounds.min.x - level.queryList[i].bounds.max.x,
      //     level.queryList[i].bounds.min.y - level.queryList[i].bounds.max.y
      //   );
      // }
      // ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
      // ctx.fill();
      //jump
      ctx.beginPath();
      let bodyDraw = jumpSensor.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.fill();
      // ctx.strokeStyle = "#000";
      // ctx.stroke();
      //main body
      ctx.beginPath();
      bodyDraw = playerBody.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(0, 255, 255, 0.25)";
      ctx.fill();
      // ctx.stroke();
      //head
      ctx.beginPath();
      bodyDraw = playerHead.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(255, 255, 0, 0.4)";
      ctx.fill();
      // ctx.stroke();
      //head sensor
      ctx.beginPath();
      bodyDraw = headSensor.vertices;
      ctx.moveTo(bodyDraw[0].x, bodyDraw[0].y);
      for (let j = 1; j < bodyDraw.length; ++j) {
        ctx.lineTo(bodyDraw[j].x, bodyDraw[j].y);
      }
      ctx.lineTo(bodyDraw[0].x, bodyDraw[0].y);
      ctx.fillStyle = "rgba(0, 0, 255, 0.25)";
      ctx.fill();
      // ctx.stroke();
    }
  },
  checkLineIntersection(v1, v1End, v2, v2End) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    let denominator, a, b, numerator1, numerator2;
    let result = {
      x: null,
      y: null,
      onLine1: false,
      onLine2: false
    };
    denominator = (v2End.y - v2.y) * (v1End.x - v1.x) - (v2End.x - v2.x) * (v1End.y - v1.y);
    if (denominator == 0) {
      return result;
    }
    a = v1.y - v2.y;
    b = v1.x - v2.x;
    numerator1 = (v2End.x - v2.x) * a - (v2End.y - v2.y) * b;
    numerator2 = (v1End.x - v1.x) * a - (v1End.y - v1.y) * b;
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = v1.x + a * (v1End.x - v1.x);
    result.y = v1.y + a * (v1End.y - v1.y);
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) result.onLine1 = true;
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) result.onLine2 = true;
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
  },
  copyToClipBoard(value) {
    // Create a fake textarea
    const textAreaEle = document.createElement('textarea');

    // Reset styles
    textAreaEle.style.border = '0';
    textAreaEle.style.padding = '0';
    textAreaEle.style.margin = '0';

    // Set the absolute position
    // User won't see the element
    textAreaEle.style.position = 'absolute';
    textAreaEle.style.left = '-9999px';
    textAreaEle.style.top = `0px`;

    // Set the value
    textAreaEle.value = value

    // Append the textarea to body
    document.body.appendChild(textAreaEle);

    // Focus and select the text
    textAreaEle.focus();
    textAreaEle.select();

    // Execute the "copy" command
    try {
      document.execCommand('copy');
    } catch (err) {
      // Unable to copy
      console.log(err)
    } finally {
      // Remove the textarea
      document.body.removeChild(textAreaEle);
    }
  },
  constructMouseDownPosition: {
    x: 0,
    y: 0
  },
  constructMapString: [],
  constructCycle() {
    if (game.isConstructionMode && game.constructMouseDownPosition) {
      function round(num, round = 25) {
        return Math.ceil(num / round) * round;
      }
      const x = round(game.constructMouseDownPosition.x)
      const y = round(game.constructMouseDownPosition.y)
      const dx = Math.max(25, round(game.mouseInGame.x) - x)
      const dy = Math.max(25, round(game.mouseInGame.y) - y)

      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, dx, dy);
    }
  },
  outputMapString(string) {
    if (string) game.constructMapString.push(string) //store command as a string in the next element of an array
    let out = "" //combine set of map strings to one string
    let outHTML = ""
    for (let i = 0, len = game.constructMapString.length; i < len; i++) {
      out += game.constructMapString[i];
      outHTML += "<div>" + game.constructMapString[i] + "</div>"
    }
    console.log(out)
    game.copyToClipBoard(out)
    document.getElementById("construct").innerHTML = outHTML
  },
  enableConstructMode() {
    game.isConstructionMode = true;
    game.isAutoZoom = false;
    game.zoomScale = 2600;
    game.setZoom();

    document.body.addEventListener("mouseup", (e) => {
      if (game.testing && game.constructMouseDownPosition) {
        function round(num, round = 25) {
          return Math.ceil(num / round) * round;
        }
        //clean up positions
        const x = round(game.constructMouseDownPosition.x)
        const y = round(game.constructMouseDownPosition.y)
        const dx = Math.max(25, round(game.mouseInGame.x) - x)
        const dy = Math.max(25, round(game.mouseInGame.y) - y)

        if (e.which === 2) {
          game.outputMapString(`spawn.randomMob(${x}, ${y},0.5);`);
        } else if (game.mouseInGame.x > game.constructMouseDownPosition.x && game.mouseInGame.y > game.constructMouseDownPosition.y) { //make sure that the width and height are positive
          if (e.which === 1) { //add map
            game.outputMapString(`spawn.mapRect(${x}, ${y}, ${dx}, ${dy});`);

            //see map in world
            spawn.mapRect(x, y, dx, dy);
            len = map.length - 1
            map[len].collisionFilter.category = cat.map;
            map[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
            Matter.Body.setStatic(map[len], true); //make static
            World.add(engine.world, map[len]); //add to world

            game.draw.setPaths() //update map graphics
          } else if (e.which === 3) { //add body
            game.outputMapString(`spawn.bodyRect(${x}, ${y}, ${dx}, ${dy});`);

            //see map in world
            spawn.bodyRect(x, y, dx, dy);
            len = body.length - 1
            body[len].collisionFilter.category = cat.body;
            body[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
            World.add(engine.world, body[len]); //add to world
            body[len].classType = "body"
          }
        }
      }
      game.constructMouseDownPosition.x = undefined
      game.constructMouseDownPosition.y = undefined
    });
    game.constructMouseDownPosition.x = undefined
    game.constructMouseDownPosition.y = undefined
    document.body.addEventListener("mousedown", (e) => {
      if (game.testing) {
        game.constructMouseDownPosition.x = game.mouseInGame.x
        game.constructMouseDownPosition.y = game.mouseInGame.y
      }
    });

    document.body.addEventListener("keydown", (e) => { // e.keyCode   z=90  m=77 b=66  shift = 16  c = 67
      if (game.testing && e.keyCode === 90 && game.constructMapString.length) {
        if (game.constructMapString[game.constructMapString.length - 1][6] === 'm') { //remove map from current level
          const index = map.length - 1
          Matter.World.remove(engine.world, map[index]);
          map.splice(index, 1);
          game.draw.setPaths() //update map graphics  
        } else if (game.constructMapString[game.constructMapString.length - 1][6] === 'b') { //remove body from current level
          const index = body.length - 1
          Matter.World.remove(engine.world, body[index]);
          body.splice(index, 1);
        }
        game.constructMapString.pop();
        game.outputMapString();
      }
    });
  }
};