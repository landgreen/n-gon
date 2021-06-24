// game Object ********************************************************
//*********************************************************************
const simulation = {
    loop() {}, //main game loop, gets set to normal or testing loop
    normalLoop() {
        simulation.gravity();
        Engine.update(engine, simulation.delta);
        simulation.wipe();
        simulation.textLog();
        if (m.onGround) {
            m.groundControl()
        } else {
            m.airControl()
        }
        m.move();
        m.look();
        simulation.checks();
        simulation.camera();
        level.custom();
        powerUps.do();
        mobs.draw();
        simulation.draw.cons();
        simulation.draw.body();
        mobs.loop();
        mobs.healthBar();
        m.draw();
        m.hold();
        // v.draw(); //working on visibility work in progress
        level.customTopLayer();
        simulation.draw.drawMapPath();
        b.fire();
        b.bulletRemove();
        b.bulletDraw();
        b.bulletDo();
        simulation.drawCircle();
        // simulation.clip();
        ctx.restore();
        simulation.drawCursor();
        // simulation.pixelGraphics();
    },
    testingLoop() {
        simulation.gravity();
        Engine.update(engine, simulation.delta);
        simulation.wipe();
        simulation.textLog();
        if (m.onGround) {
            m.groundControl()
        } else {
            m.airControl()
        }
        m.move();
        m.look();
        simulation.checks();
        simulation.camera();
        level.custom();
        m.draw();
        level.customTopLayer();
        simulation.draw.wireFrame();
        simulation.draw.cons();
        simulation.draw.testing();
        simulation.drawCircle();
        simulation.constructCycle()
        ctx.restore();
        simulation.testingOutput();
        simulation.drawCursor();
    },
    isTimeSkipping: false,
    timeSkip(cycles = 60) {
        simulation.isTimeSkipping = true;
        for (let i = 0; i < cycles; i++) {
            simulation.cycle++;
            m.cycle++;
            simulation.gravity();
            Engine.update(engine, simulation.delta);
            if (m.onGround) {
                m.groundControl()
            } else {
                m.airControl()
            }
            m.move();
            simulation.checks();
            mobs.loop();
            // m.draw();
            m.walk_cycle += m.flipLegs * m.Vx;

            m.hold();
            b.fire();
            b.bulletRemove();
            b.bulletDo();
        }
        simulation.isTimeSkipping = false;
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
    isHorizontalFlipped: false, //makes some maps flipped horizontally
    levelsCleared: 0,
    difficultyMode: 2, //normal difficulty is 2
    difficulty: 0,
    dmgScale: null, //set in levels.setDifficulty
    healScale: 1,
    accelScale: null, //set in levels.setDifficulty
    CDScale: null, //set in levels.setDifficulty
    lookFreqScale: null, //set in levels.setDifficulty
    isNoPowerUps: false,
    // dropFPS(cap = 40, time = 15) {
    //   simulation.fpsCap = cap
    //   simulation.fpsInterval = 1000 / simulation.fpsCap;
    //   simulation.defaultFPSCycle = simulation.cycle + time
    //   const normalFPS = function () {
    //     if (simulation.defaultFPSCycle < simulation.cycle) {
    //       simulation.fpsCap = 72
    //       simulation.fpsInterval = 1000 / simulation.fpsCap;
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
        ctx.moveTo(simulation.mouse.x - size, simulation.mouse.y);
        ctx.lineTo(simulation.mouse.x + size, simulation.mouse.y);
        ctx.moveTo(simulation.mouse.x, simulation.mouse.y - size);
        ctx.lineTo(simulation.mouse.x, simulation.mouse.y + size);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000"; //'rgba(0,0,0,0.4)'
        ctx.stroke(); // Draw it
    },
    drawList: [], //so you can draw a first frame of explosions.. I know this is bad
    drawTime: 8, //how long circles are drawn.  use to push into drawlist.time
    mobDmgColor: "rgba(255,0,0,0.7)", //color when a mob damages the player  // set by mass-energy tech
    playerDmgColor: "rgba(0,0,0,0.7)", //color when the player damages a mob
    drawCircle() {
        //draws a circle for two cycles, used for showing damage mostly
        let i = simulation.drawList.length;
        while (i--) {
            ctx.beginPath(); //draw circle
            ctx.arc(simulation.drawList[i].x, simulation.drawList[i].y, simulation.drawList[i].radius, 0, 2 * Math.PI);
            ctx.fillStyle = simulation.drawList[i].color;
            ctx.fill();
            if (simulation.drawList[i].time) {
                simulation.drawList[i].time--;
            } else {
                if (!m.isBodiesAsleep) simulation.drawList.splice(i, 1); //remove when timer runs out
            }
        }
    },
    lastLogTime: 0,
    // lastLogTimeBig: 0,
    boldActiveGunHUD() {
        if (b.inventory.length > 0) {
            for (let i = 0, len = b.inventory.length; i < len; ++i) document.getElementById(b.inventory[i]).style.opacity = "0.3";
            // document.getElementById(b.activeGun).style.fontSize = "30px";
            if (document.getElementById(b.activeGun)) document.getElementById(b.activeGun).style.opacity = "1";
        }

        if (tech.isEntanglement && document.getElementById("tech-entanglement")) {
            if (b.inventory[0] === b.activeGun) {
                let lessDamage = 1
                for (let i = 0, len = b.inventory.length; i < len; i++) lessDamage *= 0.87 // 1 - 0.13
                document.getElementById("tech-entanglement").innerHTML = " " + ((1 - lessDamage) * 100).toFixed(0) + "%"
            } else {
                document.getElementById("tech-entanglement").innerHTML = " 0%"
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
        simulation.boldActiveGunHUD();
    },
    updateTechHUD() {
        let text = ""
        for (let i = 0, len = tech.tech.length; i < len; i++) { //add tech
            if (tech.tech[i].isLost) {
                if (text) text += "<br>" //add a new line, but not on the first line
                text += `<span style="text-decoration: line-through;">${tech.tech[i].name}</span>`
            } else if (tech.tech[i].count > 0 && !tech.tech[i].isNonRefundable) {
                if (text) text += "<br>" //add a new line, but not on the first line
                text += tech.tech[i].name
                if (tech.tech[i].nameInfo) {
                    text += tech.tech[i].nameInfo
                    tech.tech[i].addNameInfo();
                }
                if (tech.tech[i].count > 1) text += ` (${tech.tech[i].count}x)`
            }
        }
        document.getElementById("tech").innerHTML = text
    },
    isTextLogOpen: true,
    // <!-- <path d="M832.41,106.64 V323.55 H651.57 V256.64 c0-82.5,67.5-150,150-150 Z" fill="#789" stroke="none" />
    // <path d="M827,112 h30 a140,140,0,0,1,140,140 v68 h-167 z" fill="#7ce" stroke="none" /> -->
    // SVGleftMouse: '<svg viewBox="750 0 200 765" class="mouse-icon" width="40px" height = "60px" stroke-linecap="round" stroke-linejoin="round" stroke-width="25px" stroke="#000" fill="none">  <path fill="#fff" stroke="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M832.41,106.64 V323.55 H651.57 V256.64 c0-82.5,67.5-150,150-150 Z" fill="#149" stroke="none" />  <path fill="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M657 317 h 340 h-170 v-207" />  <ellipse fill="#fff" cx="827.57" cy="218.64" rx="29" ry="68" />  </svg>',
    // SVGrightMouse: '<svg viewBox="750 0 200 765" class="mouse-icon" width="40px" height = "60px" stroke-linecap="round" stroke-linejoin="round" stroke-width="25px" stroke="#000" fill="none">  <path fill="#fff" stroke="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M827,112 h30 a140,140,0,0,1,140,140 v68 h-167 z" fill="#0cf" stroke="none" />  <path fill="none" d="M827,112 h30 a140,140,0,0,1,140,140 v268 a140,140,0,0,1-140,140 h-60 a140,140,0,0,1-140-140v-268 a140,140,0,0,1,140-140h60" />  <path d="M657 317 h 340 h-170 v-207" />  <ellipse fill="#fff" cx="827.57" cy="218.64" rx="29" ry="68" />  </svg>',
    makeTextLog(text, time = 180) {
        if (simulation.isTextLogOpen && !build.isExperimentSelection) {
            if (simulation.lastLogTime > m.cycle) { //if there is an older message
                document.getElementById("text-log").innerHTML = document.getElementById("text-log").innerHTML + '<br>' + text;
                simulation.lastLogTime = m.cycle + time;
            } else {
                document.getElementById("text-log").innerHTML = text;
                document.getElementById("text-log").style.opacity = 1;
                simulation.lastLogTime = m.cycle + time;
            }
        }
    },
    textLog() {
        if (simulation.lastLogTime && simulation.lastLogTime < m.cycle) {
            simulation.lastLogTime = 0;
            // document.getElementById("text-log").innerHTML = " ";
            document.getElementById("text-log").style.opacity = 0;
        }
    },
    nextGun() {
        if (b.inventory.length > 0 && !tech.isGunCycle) {
            b.inventoryGun++;
            if (b.inventoryGun > b.inventory.length - 1) b.inventoryGun = 0;
            simulation.switchGun();
        }
    },
    previousGun() {
        if (b.inventory.length > 0 && !tech.isGunCycle) {
            b.inventoryGun--;
            if (b.inventoryGun < 0) b.inventoryGun = b.inventory.length - 1;
            simulation.switchGun();
        }
    },
    switchGun() {
        if (tech.isCrouchAmmo) tech.isCrouchAmmo = 1 //this prevents hacking the tech by switching guns
        b.activeGun = b.inventory[b.inventoryGun];
        if (b.guns[b.activeGun].charge) b.guns[b.activeGun].charge = 0; //if switching into foam set charge to 0
        simulation.updateGunHUD();
        simulation.boldActiveGunHUD();
    },
    zoom: null,
    zoomScale: 1000,
    isAutoZoom: true,
    setZoom(zoomScale = simulation.zoomScale) { //use in window resize in index.js
        simulation.zoomScale = zoomScale
        simulation.zoom = canvas.height / zoomScale; //sets starting zoom scale
    },
    zoomTransition(newZoomScale, step = 2) {
        if (simulation.isAutoZoom) {
            const isBigger = (newZoomScale - simulation.zoomScale > 0) ? true : false;
            requestAnimationFrame(zLoop);
            const currentLevel = level.onLevel

            function zLoop() {
                if (currentLevel !== level.onLevel || simulation.isAutoZoom === false) return //stop the zoom if player goes to a new level

                if (isBigger) {
                    simulation.zoomScale += step
                    if (simulation.zoomScale >= newZoomScale) {
                        simulation.setZoom(newZoomScale);
                        return
                    }
                } else {
                    simulation.zoomScale -= step
                    if (simulation.zoomScale <= newZoomScale) {
                        simulation.setZoom(newZoomScale);
                        return
                    }
                }

                simulation.setZoom();
                requestAnimationFrame(zLoop);
            }
        }
    },
    zoomInFactor: 0,
    startZoomIn(time = 180) {
        simulation.zoom = 0;
        let count = 0;
        requestAnimationFrame(zLoop);

        function zLoop() {
            simulation.zoom += canvas.height / simulation.zoomScale / time;
            count++;
            if (count < time) {
                requestAnimationFrame(zLoop);
            } else {
                simulation.setZoom();
            }
        }
    },
    noCameraScroll() { //makes the camera not scroll after changing locations
        //only works if velocity is zero
        m.pos.x = player.position.x;
        m.pos.y = playerBody.position.y - m.yOff;
        const scale = 0.8;
        m.transSmoothX = canvas.width2 - m.pos.x - (simulation.mouse.x - canvas.width2) * scale;
        m.transSmoothY = canvas.height2 - m.pos.y - (simulation.mouse.y - canvas.height2) * scale;
        m.transX += (m.transSmoothX - m.transX) * 1;
        m.transY += (m.transSmoothY - m.transY) * 1;
    },
    edgeZoomOutSmooth: 1,
    camera() {
        //zoom out when mouse gets near the edge of the window
        const dx = simulation.mouse.x / window.innerWidth - 0.5 //x distance from mouse to window center scaled by window width
        const dy = simulation.mouse.y / window.innerHeight - 0.5 //y distance from mouse to window center scaled by window height
        const d = Math.max(dx * dx, dy * dy)
        simulation.edgeZoomOutSmooth = (1 + 4 * d * d) * 0.04 + simulation.edgeZoomOutSmooth * 0.96

        ctx.save();
        ctx.translate(canvas.width2, canvas.height2); //center
        ctx.scale(simulation.zoom / simulation.edgeZoomOutSmooth, simulation.zoom / simulation.edgeZoomOutSmooth); //zoom in once centered
        ctx.translate(-canvas.width2 + m.transX, -canvas.height2 + m.transY); //translate
        //calculate in game mouse position by undoing the zoom and translations
        simulation.mouseInGame.x = (simulation.mouse.x - canvas.width2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.width2 - m.transX;
        simulation.mouseInGame.y = (simulation.mouse.y - canvas.height2) / simulation.zoom * simulation.edgeZoomOutSmooth + canvas.height2 - m.transY;
    },
    restoreCamera() {
        ctx.restore();
    },
    trails() {
        const swapPeriod = 150
        const len = 30
        for (let i = 0; i < len; i++) {
            setTimeout(function() {
                simulation.wipe = function() { //set wipe to have trails
                    ctx.fillStyle = `rgba(221,221,221,${i*i*0.0005 +0.0025})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
            }, (i) * swapPeriod);
        }

        setTimeout(function() {
            simulation.wipe = function() { //set wipe to normal
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }, len * swapPeriod);
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
        addGravity(powerUp, simulation.g);
        addGravity(body, simulation.g);
        player.force.y += player.mass * simulation.g;
    },
    firstRun: true,
    splashReturn() {
        simulation.clearTimeouts();
        simulation.onTitlePage = true;
        document.getElementById("splash").onclick = function() {
            simulation.startGame();
        };
        document.getElementById("choose-grid").style.display = "none"
        document.getElementById("info").style.display = "inline";
        document.getElementById("experiment-button").style.display = "inline"
        document.getElementById("experiment-grid").style.display = "none"
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
        simulation.clearMap()
        if (!isBuildRun) { //if a build run logic flow returns to "experiment-button").addEventListener
            document.body.style.cursor = "none";
            document.body.style.overflow = "hidden"
        }
        simulation.onTitlePage = false;
        document.getElementById("choose-grid").style.display = "none"
        document.getElementById("experiment-grid").style.display = "none"
        document.getElementById("info").style.display = "none";
        document.getElementById("experiment-button").style.display = "none";
        document.getElementById("splash").onclick = null; //removes the onclick effect so the function only runs once
        document.getElementById("splash").style.display = "none"; //hides the element that spawned the function
        document.getElementById("dmg").style.display = "inline";
        document.getElementById("health-bg").style.display = "inline";
        ctx.globalCompositeOperation = "source-over"
        ctx.shadowBlur = 0;
        // ctx.shadowColor = '#000';
        if (!m.isShipMode) {
            m.draw = m.drawDefault //set the play draw to normal, undoing some junk tech
            m.spawn(); //spawns the player
            m.look = m.lookDefault
        } else {
            World.add(engine.world, [player])
        }

        simulation.isHorizontalFlipped = (Math.random() < 0.5) ? true : false //if true, some maps are flipped horizontally
        level.levels = level.playableLevels.slice(0) //copy array, not by just by assignment
        if (simulation.isCommunityMaps) {
            level.levels.push("stronghold");
            level.levels.push("basement");
            level.levels.push("crossfire");
            level.levels.push("vats")
            level.levels.push("n-gon")
            level.levels.push("house");
            level.levels.push("perplex");
            level.levels.push("coliseum");
            level.levels.push("tunnel");
            level.levels = shuffle(level.levels); //shuffles order of maps
            level.levels.splice(0, 9); //remove some random levels to make up for adding the community levels
        } else {
            level.levels = shuffle(level.levels); //shuffles order of maps
        }
        level.levels.unshift("intro"); //add level to the start of the randomized levels list
        level.levels.push("labs"); //add level to the end of the randomized levels list
        level.levels.push("gauntlet"); //add level to the end of the randomized levels list
        level.levels.push("final"); //add level to the end of the randomized levels list

        input.endKeySensing();
        b.removeAllGuns();
        simulation.isNoPowerUps = false;
        tech.setupAllTech(); //sets tech to default values
        tech.cancelCount = 0;
        for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
            if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
            if (b.guns[i].name === "nail gun") b.guns[i].chooseFireMethod()
            if (b.guns[i].name === "super balls") b.guns[i].chooseFireMethod()
        }
        tech.dynamoBotCount = 0;
        tech.nailBotCount = 0;
        tech.laserBotCount = 0;
        tech.orbitBotCount = 0;
        tech.foamBotCount = 0;
        tech.boomBotCount = 0;
        tech.plasmaBotCount = 0;
        tech.missileBotCount = 0;

        b.setFireMethod()
        b.setFireCD();
        // simulation.updateTechHUD();
        powerUps.tech.choiceLog = []
        powerUps.totalPowerUps = 0;
        powerUps.research.count = 0;
        m.setFillColors();
        // m.maxHealth = 1
        // m.maxEnergy = 1
        // m.energy = 1
        input.isPauseKeyReady = true
        simulation.wipe = function() { //set wipe to normal
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        m.hole.isOn = false
        simulation.paused = false;
        engine.timing.timeScale = 1;
        simulation.fpsCap = simulation.fpsCapDefault;
        simulation.isAutoZoom = true;
        simulation.makeGunHUD();
        simulation.lastLogTime = 0;

        level.onLevel = 0;
        level.levelsCleared = 0;
        //resetting difficulty
        simulation.dmgScale = 0; //increases in level.difficultyIncrease
        b.dmgScale = 1; //decreases in level.difficultyIncrease
        simulation.accelScale = 1;
        simulation.lookFreqScale = 1;
        simulation.CDScale = 1;
        simulation.difficulty = 0;
        simulation.difficultyMode = Number(document.getElementById("difficulty-select").value)
        build.isExperimentSelection = false;

        simulation.clearNow = true;
        document.getElementById("text-log").style.opacity = 0;
        document.getElementById("fade-out").style.opacity = 0;
        document.title = "n-gon";

        m.alive = true;
        m.setMaxHealth()
        m.health = 0;
        m.addHealth(0.25)
        m.drop();
        m.holdingTarget = null

        //set to default field
        tech.healMaxEnergyBonus = 0
        m.setMaxEnergy();
        m.fieldMode = 0;
        // simulation.makeTextLog(`${simulation.SVGrightMouse}<strong style='font-size:30px;'> ${m.fieldUpgrades[m.fieldMode].name}</strong><br><span class='faded'></span><br>${m.fieldUpgrades[m.fieldMode].description}`, 600);
        // simulation.makeTextLog(`
        // input.key.up <span class='color-symbol'>=</span> ["<span class='color-text'>${input.key.up}</span>", "<span class='color-text'>ArrowUp</span>"]
        // <br>input.key.left <span class='color-symbol'>=</span> ["<span class='color-text'>${input.key.left}</span>", "<span class='color-text'>ArrowLeft</span>"]
        // <br>input.key.down <span class='color-symbol'>=</span> ["<span class='color-text'>${input.key.down}</span>", "<span class='color-text'>ArrowDown</span>"]
        // <br>input.key.right <span class='color-symbol'>=</span> ["<span class='color-text'>${input.key.right}</span>", "<span class='color-text'>ArrowRight</span>"]
        // <br>
        // <br><span class='color-var'>m</span>.fieldMode <span class='color-symbol'>=</span> "<span class='color-text'>${m.fieldUpgrades[m.fieldMode].name}</span>"
        // <br>input.key.field <span class='color-symbol'>=</span> ["<span class='color-text'>${input.key.field}</span>", "<span class='color-text'>right mouse</span>"]
        // <br><span class='color-var'>m</span>.field.description <span class='color-symbol'>=</span> "<span class='color-text'>${m.fieldUpgrades[m.fieldMode].description}</span>"
        // `, 800);


        let delay = 500
        const step = 150
        setTimeout(function() {
            simulation.makeTextLog(`input.key.up<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.up}</span>", "<span class='color-text'>ArrowUp</span>"]`);
        }, delay += step);
        setTimeout(function() {
            simulation.makeTextLog(`input.key.left<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.left}</span>", "<span class='color-text'>ArrowLeft</span>"]`);
        }, delay += step);
        setTimeout(function() {
            simulation.makeTextLog(`input.key.down<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.down}</span>", "<span class='color-text'>ArrowDown</span>"]`);
        }, delay += step);
        setTimeout(function() {
            simulation.makeTextLog(`input.key.right<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.right}</span>", "<span class='color-text'>ArrowRight</span>"]`);
        }, delay += step);
        setTimeout(function() {
            simulation.makeTextLog(`<br><span class='color-var'>m</span>.fieldMode <span class='color-symbol'>=</span> "<span class='color-text'>${m.fieldUpgrades[m.fieldMode].name}</span>"`);
        }, delay += step);
        setTimeout(function() {
            simulation.makeTextLog(`input.key.field<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.field}</span>", "<span class='color-text'>MouseRight</span>"]`);
        }, delay += step);

        m.setField(m.fieldMode)
        // m.energy = 0;
        //exit testing
        if (simulation.testing) {
            simulation.testing = false;
            simulation.loop = simulation.normalLoop
            if (simulation.isConstructionMode) document.getElementById("construct").style.display = 'none'
        }
        simulation.isCheating = false
        simulation.firstRun = false;

        //setup FPS cap
        simulation.fpsInterval = 1000 / simulation.fpsCap;
        simulation.then = Date.now();
        requestAnimationFrame(cycle); //starts game loop

    },
    clearTimeouts() {
        let id = window.setTimeout(function() {}, 0);
        while (id--) {
            window.clearTimeout(id); // will do nothing if no timeout with id is present
        }
    },
    clearNow: false,
    clearMap() {
        if (tech.isMineAmmoBack) {
            let count = 0;
            for (i = 0, len = bullet.length; i < len; i++) { //count mines left on map
                if (bullet[i].bulletType === "mine") count++
            }
            for (i = 0, len = b.guns.length; i < len; i++) { //find which gun is mine
                if (b.guns[i].name === "mine") {
                    if (tech.isCrouchAmmo) count = Math.ceil(count / 2)
                    b.guns[i].ammo += count
                    simulation.updateGunHUD();
                    break;
                }
            }
        }

        if (tech.isMutualism && !tech.isEnergyHealth) {
            for (let i = 0; i < bullet.length; i++) {
                if (bullet[i].isMutualismActive) {
                    m.health += 0.005
                    if (m.health > m.maxHealth) m.health = m.maxHealth;
                    m.displayHealth();
                }
            }
        }

        if (tech.isEndLevelPowerUp) {
            for (let i = 0; i < powerUp.length; i++) {
                if (powerUp[i].name === "tech") {
                    tech.giveTech()
                } else if (powerUp[i].name === "gun") {
                    if (!tech.isOneGun) b.giveGuns("random")
                } else if (powerUp[i].name === "field") {
                    if (m.fieldMode === 0) m.setField(Math.ceil(Math.random() * (m.fieldUpgrades.length - 1))) //pick a random field, but not field 0
                } else {
                    powerUp[i].effect();
                }
            }
        }
        powerUps.totalPowerUps = powerUp.length

        let holdTarget; //if player is holding something this remembers it before it gets deleted
        if (m.holdingTarget) holdTarget = m.holdingTarget;

        tech.deathSpawnsFromBoss = 0;
        simulation.fallHeight = 3000;
        m.fireCDcycle = 0
        m.drop();
        m.hole.isOn = false;
        level.zones = [];
        simulation.drawList = [];

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
            Matter.Body.setPosition(body[len], m.pos);
            m.isHolding = true
            m.holdingTarget = body[len];
            m.holdingTarget.collisionFilter.category = 0;
            m.holdingTarget.collisionFilter.mask = 0;
            m.definePlayerMass(m.defaultMass + m.holdingTarget.mass * m.holdingMassScale)
        }
        //set fps back to default
        simulation.fpsCap = simulation.fpsCapDefault
        simulation.fpsInterval = 1000 / simulation.fpsCap;
    },
    // getCoords: {
    //   //used when building maps, outputs a draw rect command to console, only works in testing mode
    //   pos1: {
    //     x: 0,
    //     y: 0
    //   },
    //   pos2: {
    //     x: 0,
    //     y: 0
    //   },
    //   out() {
    //     if (keys[49]) {
    //       simulation.getCoords.pos1.x = Math.round(simulation.mouseInGame.x / 25) * 25;
    //       simulation.getCoords.pos1.y = Math.round(simulation.mouseInGame.y / 25) * 25;
    //     }
    //     if (keys[50]) {
    //       //press 1 in the top left; press 2 in the bottom right;copy command from console
    //       simulation.getCoords.pos2.x = Math.round(simulation.mouseInGame.x / 25) * 25;
    //       simulation.getCoords.pos2.y = Math.round(simulation.mouseInGame.y / 25) * 25;
    //       window.getSelection().removeAllRanges();
    //       var range = document.createRange();
    //       range.selectNode(document.getElementById("test"));
    //       window.getSelection().addRange(range);
    //       document.execCommand("copy");
    //       window.getSelection().removeAllRanges();
    //       console.log(`spawn.mapRect(${simulation.getCoords.pos1.x}, ${simulation.getCoords.pos1.y}, ${simulation.getCoords.pos2.x - simulation.getCoords.pos1.x}, ${simulation.getCoords.pos2.y - simulation.getCoords.pos1.y}); //`);
    //     }
    //   }
    // },
    checks() {
        if (!(simulation.cycle % 60) && !m.isBodiesAsleep) { //once a second
            //energy overfill 
            if (m.energy > m.maxEnergy) m.energy = m.maxEnergy + (m.energy - m.maxEnergy) * tech.overfillDrain //every second energy above max energy loses 25%
            if (tech.isFlipFlopEnergy && m.immuneCycle < m.cycle) {
                if (tech.isFlipFlopOn) {
                    m.energy += 0.22;
                } else {
                    m.energy -= 0.041;
                    if (m.energy < 0) m.energy = 0
                }
            }
            if (tech.relayIce && tech.isFlipFlopOn) {
                for (let j = 0; j < tech.relayIce; j++) {
                    for (let i = 0, len = Math.ceil(8 * Math.random()); i < len; i++) b.iceIX(2)
                }
            }

            if (m.pos.y > simulation.fallHeight) { // if 4000px deep
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
                        Matter.Body.setPosition(bullet[i], Vector.add(player.position, {
                            x: 250 * (Math.random() - 0.5),
                            y: 250 * (Math.random() - 0.5)
                        }));
                        Matter.Body.setVelocity(bullet[i], {
                            x: 0,
                            y: 0
                        });
                    }
                }
                m.damage(0.1 * simulation.difficultyMode);
                m.energy -= 0.1 * simulation.difficultyMode
            }

            // if (tech.isEnergyDamage) {
            //   document.getElementById("tech-capacitor").innerHTML = `(+${(m.energy/0.05).toFixed(0)}%)`
            // }
            // if (tech.restDamage) {
            //   if (player.speed < 1) {
            //     document.getElementById("tech-rest").innerHTML = `(+20%)`
            //   } else {
            //     document.getElementById("tech-rest").innerHTML = `(+0%)`
            //   }
            // }

            if (m.lastKillCycle + 300 > simulation.cycle) { //effects active for 5 seconds after killing a mob
                if (tech.isEnergyRecovery) m.energy += m.maxEnergy * 0.05
                if (tech.isHealthRecovery) m.addHealth(0.01 * m.maxHealth)
            }

            if (!(simulation.cycle % 420)) { //once every 7 seconds

                if (tech.cyclicImmunity && m.immuneCycle < m.cycle + tech.cyclicImmunity) m.immuneCycle = m.cycle + tech.cyclicImmunity; //player is immune to damage for 60 cycles

                fallCheck = function(who, save = false) {
                    let i = who.length;
                    while (i--) {
                        if (who[i].position.y > simulation.fallHeight) {
                            if (save) {
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


                //check for double crouch
                //crouch playerHead.position.y - player.position.y = 9.7  //positive
                //standing playerHead.position.y - player.position.y = -30 //negative
                // m.undoCrouch()
                // if (!m.crouch && ((playerHead.position.y - player.position.y) > 0)) {
                //     Matter.Body.translate(playerHead, {
                //         x: 0,
                //         y: 40
                //     });
                // } else if (m.crouch && ((playerHead.position.y - player.position.y) > 10)) {
                //     Matter.Body.translate(playerHead, {
                //         x: 0,
                //         y: 40
                //     });
                // }
            }
        }
    },
    testingOutput() {
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";
        ctx.fillText(`(${simulation.mouseInGame.x.toFixed(1)}, ${simulation.mouseInGame.y.toFixed(1)})`, simulation.mouse.x, simulation.mouse.y - 20);
    },
    draw: {
        // powerUp() { //is set by Bayesian tech
        //     // ctx.globalAlpha = 0.4 * Math.sin(m.cycle * 0.15) + 0.6;
        //     // for (let i = 0, len = powerUp.length; i < len; ++i) {
        //     //   ctx.beginPath();
        //     //   ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
        //     //   ctx.fillStyle = powerUp[i].color;
        //     //   ctx.fill();
        //     // }
        //     // ctx.globalAlpha = 1;
        // },
        // powerUpNormal() { //back up in case power up draw gets changed
        //     ctx.globalAlpha = 0.4 * Math.sin(m.cycle * 0.15) + 0.6;
        //     for (let i = 0, len = powerUp.length; i < len; ++i) {
        //         ctx.beginPath();
        //         ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
        //         ctx.fillStyle = powerUp[i].color;
        //         ctx.fill();
        //     }
        //     ctx.globalAlpha = 1;
        // },
        // powerUpBonus() { //draws crackle effect for bonus power ups
        //     ctx.globalAlpha = 0.4 * Math.sin(m.cycle * 0.15) + 0.6;
        //     for (let i = 0, len = powerUp.length; i < len; ++i) {
        //         ctx.beginPath();
        //         ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
        //         ctx.fillStyle = powerUp[i].color;
        //         ctx.fill();
        //     }
        //     ctx.globalAlpha = 1;
        //     for (let i = 0, len = powerUp.length; i < len; ++i) {
        //         if (powerUp[i].isDuplicated && Math.random() < 0.1) {
        //             //draw electricity
        //             const mag = 5 + powerUp[i].size / 5
        //             let unit = Vector.rotate({
        //                 x: mag,
        //                 y: mag
        //             }, 2 * Math.PI * Math.random())
        //             let path = {
        //                 x: powerUp[i].position.x + unit.x,
        //                 y: powerUp[i].position.y + unit.y
        //             }
        //             ctx.beginPath();
        //             ctx.moveTo(path.x, path.y);
        //             for (let i = 0; i < 6; i++) {
        //                 unit = Vector.rotate(unit, 3 * (Math.random() - 0.5))
        //                 path = Vector.add(path, unit)
        //                 ctx.lineTo(path.x, path.y);
        //             }
        //             ctx.lineWidth = 0.5 + 2 * Math.random();
        //             ctx.strokeStyle = "#000"
        //             ctx.stroke();
        //         }
        //     }
        // },

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
            simulation.draw.mapPath = new Path2D();
            for (let i = 0, len = map.length; i < len; ++i) {
                let vertices = map[i].vertices;
                simulation.draw.mapPath.moveTo(vertices[0].x, vertices[0].y);
                for (let j = 1; j < vertices.length; j += 1) {
                    simulation.draw.mapPath.lineTo(vertices[j].x, vertices[j].y);
                }
                simulation.draw.mapPath.lineTo(vertices[0].x, vertices[0].y);
            }
        },
        mapFill: "#444",
        bodyFill: "rgba(140,140,140,0.85)", //"#999",
        bodyStroke: "#222",
        drawMapPath() {
            ctx.fillStyle = simulation.draw.mapFill;
            ctx.fill(simulation.draw.mapPath);
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
            ctx.fillStyle = simulation.draw.bodyFill;
            ctx.fill();
            ctx.strokeStyle = simulation.draw.bodyStroke;
            ctx.stroke();
        },
        cons() {
            ctx.beginPath();
            for (let i = 0, len = cons.length; i < len; ++i) {
                ctx.moveTo(cons[i].pointA.x, cons[i].pointA.y);
                // ctx.lineTo(cons[i].bodyB.position.x, cons[i].bodyB.position.y);
                ctx.lineTo(cons[i].bodyB.position.x + cons[i].pointB.x, cons[i].bodyB.position.y + cons[i].pointB.y);
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
                for (let j = 1; j < vertices.length; j++) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.lineTo(vertices[0].x, vertices[0].y);
            }
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000";
            ctx.stroke();
        },
        testing() {
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
    constructMouseDownPosition: {
        x: 0,
        y: 0
    },
    constructMapString: [],
    constructCycle() {
        if (simulation.isConstructionMode && simulation.constructMouseDownPosition) {
            function round(num, round = 25) {
                return Math.ceil(num / round) * round;
            }
            const x = round(simulation.constructMouseDownPosition.x)
            const y = round(simulation.constructMouseDownPosition.y)
            const dx = Math.max(25, round(simulation.mouseInGame.x) - x)
            const dy = Math.max(25, round(simulation.mouseInGame.y) - y)

            ctx.strokeStyle = "#000"
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, dx, dy);
        }
    },
    enableConstructMode() {
        level.isProcedural = false //this is set to be true in levels like labs that need x+ and y+ in front of positions
        simulation.isConstructionMode = true;
        simulation.isHorizontalFlipped = false;
        simulation.isAutoZoom = false;
        simulation.zoomScale = 2600;
        simulation.setZoom();

        document.body.addEventListener("mouseup", (e) => {
            if (simulation.testing && simulation.constructMouseDownPosition) {
                function round(num, round = 25) {
                    return Math.ceil(num / round) * round;
                }
                //clean up positions
                const x = round(simulation.constructMouseDownPosition.x)
                const y = round(simulation.constructMouseDownPosition.y)
                const dx = Math.max(25, round(simulation.mouseInGame.x) - x)
                const dy = Math.max(25, round(simulation.mouseInGame.y) - y)

                if (e.which === 2) {
                    if (level.isProcedural) {
                        simulation.outputMapString(`spawn.randomMob(x+${x}, y+${y},0.5);`);
                    } else {
                        simulation.outputMapString(`spawn.randomMob(${x}, ${y},0.5);`);
                    }

                } else if (simulation.mouseInGame.x > simulation.constructMouseDownPosition.x && simulation.mouseInGame.y > simulation.constructMouseDownPosition.y) { //make sure that the width and height are positive
                    if (e.which === 1) { //add map
                        if (level.isProcedural) {
                            simulation.outputMapString(`spawn.mapRect(x+${x}, y+${y}, ${dx}, ${dy});`);
                        } else {
                            simulation.outputMapString(`spawn.mapRect(${x}, ${y}, ${dx}, ${dy});`);

                        }
                        //see map in world
                        spawn.mapRect(x, y, dx, dy);
                        len = map.length - 1
                        map[len].collisionFilter.category = cat.map;
                        map[len].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet;
                        Matter.Body.setStatic(map[len], true); //make static
                        World.add(engine.world, map[len]); //add to world
                        simulation.draw.setPaths() //update map graphics

                    } else if (e.which === 3) { //add body
                        if (level.isProcedural) {
                            simulation.outputMapString(`spawn.bodyRect(x+${x}, y+${y}, ${dx}, ${dy});`);
                        } else {
                            simulation.outputMapString(`spawn.bodyRect(${x}, ${y}, ${dx}, ${dy});`);
                        }

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
            simulation.constructMouseDownPosition.x = undefined
            simulation.constructMouseDownPosition.y = undefined
        });
        simulation.constructMouseDownPosition.x = undefined
        simulation.constructMouseDownPosition.y = undefined
        document.body.addEventListener("mousedown", (e) => {
            if (simulation.testing) {
                simulation.constructMouseDownPosition.x = simulation.mouseInGame.x
                simulation.constructMouseDownPosition.y = simulation.mouseInGame.y
            }
        });

        document.body.addEventListener("keydown", (e) => { // e.keyCode   z=90  m=77 b=66  shift = 16  c = 67
            if (simulation.testing && e.keyCode === 90 && simulation.constructMapString.length) {
                if (simulation.constructMapString[simulation.constructMapString.length - 1][6] === 'm') { //remove map from current level
                    const index = map.length - 1
                    Matter.World.remove(engine.world, map[index]);
                    map.splice(index, 1);
                    simulation.draw.setPaths() //update map graphics  
                } else if (simulation.constructMapString[simulation.constructMapString.length - 1][6] === 'b') { //remove body from current level
                    const index = body.length - 1
                    Matter.World.remove(engine.world, body[index]);
                    body.splice(index, 1);
                }
                simulation.constructMapString.pop();
                simulation.outputMapString();
            }
        });
    },
    outputMapString(string) {
        if (string) simulation.constructMapString.push(string) //store command as a string in the next element of an array
        let out = "" //combine set of map strings to one string
        let outHTML = ""
        for (let i = 0, len = simulation.constructMapString.length; i < len; i++) {
            out += simulation.constructMapString[i];
            outHTML += "<div>" + simulation.constructMapString[i] + "</div>"
        }
        console.log(out)
        navigator.clipboard.writeText(out).then(function() { /* clipboard successfully set */ }, function() { /* clipboard write failed */ console.log('copy failed') });
        document.getElementById("construct").innerHTML = outHTML
    },
    // copyToClipBoard(value) {
    //     // Create a fake textarea
    //     const textAreaEle = document.createElement('textarea');

    //     // Reset styles
    //     textAreaEle.style.border = '0';
    //     textAreaEle.style.padding = '0';
    //     textAreaEle.style.margin = '0';

    //     // Set the absolute position
    //     // User won't see the element
    //     textAreaEle.style.position = 'absolute';
    //     textAreaEle.style.left = '-9999px';
    //     textAreaEle.style.top = `0px`;

    //     // Set the value
    //     textAreaEle.value = value

    //     // Append the textarea to body
    //     document.body.appendChild(textAreaEle);

    //     // Focus and select the text
    //     textAreaEle.focus();
    //     textAreaEle.select();

    //     // Execute the "copy" command
    //     try {
    //         document.execCommand('copy');
    //     } catch (err) {
    //         // Unable to copy
    //         console.log(err)
    //     } finally {
    //         // Remove the textarea
    //         document.body.removeChild(textAreaEle);
    //     }
    // },
};