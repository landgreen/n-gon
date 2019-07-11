//global game variables
let body = []; //non static bodies
let map = []; //all static bodies
let cons = []; //all constraints between a point and a body
let consBB = []; //all constraints between two bodies
//main object for spawning levels
const level = {
  maxJump: 390,
  boostScale: 0.000023,
  levels: ["skyscrapers", "rooftops", "warehouse", "highrise", "towers"],
  onLevel: 0,
  start() {
    // game.zoomScale = 1400 //1400
    if (game.levelsCleared === 0) {
      this.intro();
      // spawn.setSpawnList();
      // game.levelsCleared = 3; //for testing to simulate all possible mobs spawns
      // this.bosses();
      // this.testingMap();
      // this.skyscrapers();
      // this.rooftops();
      // this.warehouse();
      // this.highrise();
      // this.towers();
    } else {
      spawn.setSpawnList(); //picks a couple mobs types for a themed random mob spawns
      this[this.levels[this.onLevel]](); //picks the current map from the the levels array
      this.levelAnnounce();
    }
    game.setZoom();
    this.addToWorld(); //add bodies to game engine
    game.draw.setPaths();
  },
  //******************************************************************************************************************
  //******************************************************************************************************************
  testingMap() {
    game.zoomScale = 1400 //1400 is normal
    game.zoomTransition(1400)
    spawn.setSpawnList();
    game.levelsCleared = 7; //for testing to simulate all possible mobs spawns
    for (let i = 0; i < 7; i++) {
      game.dmgScale += 0.4; //damage done by mobs increases each level
      b.dmgScale *= 0.9; //damage done by player decreases each level
    }
    mech.setPosToSpawn(-75, -60); //normal spawn
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;

    level.exit.x = 3500;
    level.exit.y = -870;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");

    //start with all guns
    b.giveGuns("all", 1000)


    // this.addZone(250, -1000, 500, 1500, "laser");
    //spawn.debris(0, -900, 4500, 10); //15 debris per level
    // setTimeout(function() {
    //   document.body.style.backgroundColor = "#eee";
    // }, 1);
    document.body.style.backgroundColor = "#fff";
    // document.body.style.backgroundColor = "#fafcff";
    // document.body.style.backgroundColor = "#bbb";
    // document.body.style.backgroundColor = "#eee4e4";
    // document.body.style.backgroundColor = "#dcdcde";
    // document.body.style.backgroundColor = "#e0e5e0";

    // this.addQueryRegion(550, -25, 100, 50, "bounce", { Vx: 0, Vy: -25 });
    // level.fillBG.push({ x: 550, y: -25, width: 100, height: 50, color: "#ff0" });

    spawn.mapRect(-1200, 0, 2200, 300); //left ground
    spawn.mapRect(3500, -860, 100, 50); //ground bump wall
    spawn.mapVertex(1250, 0, "0 0 0 300 -500 600 -500 300");
    spawn.mapRect(1500, -300, 2000, 300); //upper ground
    spawn.mapVertex(3750, 0, "0 600 0 300 -500 0 -500 300");
    spawn.mapRect(4000, 0, 1000, 300); //right lower ground
    spawn.mapRect(2200, -600, 600, 50); //center platform
    spawn.mapRect(1300, -850, 700, 50); //center platform
    spawn.mapRect(3000, -850, 700, 50); //center platform
    // spawn.mapRect(0, -2000, 3000, 50); //center platform
    spawn.spawnBuilding(-200, -250, 275, 240, false, true, "left"); //far left; player spawns in side
    // spawn.boost(350, 0, -1000);
    // for (let i = 0; i < 10; i++) {
    //   powerUps.spawn(950, -425, "gun", false);
    // }
    // for (let i = 0; i < 5; i++) {
    //   powerUps.spawn(2500 + i * 20, -1300, "gun", false);
    //   powerUps.spawn(2500 + i * 20, -1100, "ammo", false);
    // }
    // spawn.nodeBoss(-500, -600, spawn.allowedBossList[Math.floor(Math.random() * spawn.allowedBossList.length)]);
    // spawn.lineBoss(-500, -600, spawn.allowedBossList[Math.floor(Math.random() * spawn.allowedBossList.length)]);
    // spawn.bodyRect(-135, -50, 50, 50);
    // spawn.bodyRect(-140, -100, 50, 50);
    // spawn.bodyRect(-145, -150, 60, 50);
    // spawn.bodyRect(-140, -200, 50, 50);
    // spawn.bodyRect(-95, -50, 40, 50);
    // spawn.bodyRect(-90, -100, 60, 50);
    // spawn.bodyRect(300, -150, 140, 50);
    // spawn.bodyRect(300, -150, 30, 30);
    // spawn.bodyRect(300, -150, 20, 20);
    // spawn.bodyRect(300, -150, 40, 100);
    // spawn.bodyRect(300, -150, 40, 90);
    // spawn.bodyRect(300, -150, 30, 60);
    // spawn.bodyRect(300, -150, 40, 70);
    // spawn.bodyRect(300, -150, 40, 60);
    // spawn.bodyRect(300, -150, 20, 20);
    // spawn.bodyRect(500, -150, 140, 110);
    // spawn.bodyRect(600, -150, 140, 100);
    // spawn.bodyRect(400, -150, 140, 160);
    // spawn.bodyRect(500, -150, 110, 110);
    powerUps.spawn(400, -400, "field", false, '4');
    // powerUps.spawn(400, -400, "gun", false);
    // spawn.bodyRect(-45, -100, 40, 50);
    // spawn.starter(800, -1150);
    // spawn.groupBoss(-600, -550);
    // for (let i = 0; i < 1; ++i) {
    //   spawn.chaser(800, -1150);
    // }
    spawn.groupBoss(900, -1070);
    // for (let i = 0; i < 20; i++) {
    //   spawn.randomBoss(-100, -1470);
    // }
  },
  bosses() {
    game.zoomTransition(1500)

    // spawn.setSpawnList();
    // spawn.setSpawnList();
    // game.levelsCleared = 7; //for testing to simulate all possible mobs spawns
    // for (let i = 0; i < game.levelsCleared; i++) {
    //   game.dmgScale += 0.4; //damage done by mobs increases each level
    //   b.dmgScale *= 0.9; //damage done by player decreases each level
    // }

    document.body.style.backgroundColor = "#444";

    level.fillBG.push({
      x: -150,
      y: -1150,
      width: 7000,
      height: 1200,
      color: "#eee"
    });

    level.fill.push({
      x: 6400,
      y: -550,
      width: 300,
      height: 350,
      color: "rgba(0,255,255,0.1)"
    });

    mech.setPosToSpawn(0, -750); //normal spawn
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;
    level.exit.x = 6500;
    level.exit.y = -230;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");

    spawn.mapRect(-250, 0, 7000, 200); //ground
    spawn.mapRect(-350, -1200, 200, 1400); //left wall
    spawn.mapRect(-250, -1200, 7000, 200); //roof
    spawn.mapRect(-250, -700, 1000, 900); // shelf
    spawn.mapRect(-250, -1200, 1000, 250); // shelf roof
    powerUps.spawnStartingPowerUps(600, -800);

    function blockDoor(x, y, blockSize = 58) {
      spawn.mapRect(x, y - 290, 40, 60); // door lip
      spawn.mapRect(x, y, 40, 50); // door lip
      for (let i = 0; i < 4; ++i) {
        spawn.bodyRect(x + 5, y - 260 + i * blockSize, 30, blockSize);
      }
    }
    blockDoor(710, -710);

    spawn[spawn.pickList[0]](1500, -200, 100 + game.levelsCleared * 8);
    spawn.mapRect(2500, -1200, 200, 750); //right wall
    blockDoor(2585, -210)
    spawn.mapRect(2500, -200, 200, 300); //right wall

    spawn.nodeBoss(3500, -200, spawn.allowedBossList[Math.floor(Math.random() * spawn.allowedBossList.length)]);
    spawn.mapRect(4500, -1200, 200, 750); //right wall
    blockDoor(4585, -210)
    spawn.mapRect(4500, -200, 200, 300); //right wall

    spawn.lineBoss(5000, -200, spawn.allowedBossList[Math.floor(Math.random() * spawn.allowedBossList.length)]);
    spawn.mapRect(6400, -1200, 400, 750); //right wall
    spawn.mapRect(6400, -200, 400, 300); //right wall
    spawn.mapRect(6700, -1200, 200, 1400); //right wall
    spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump

    for (let i = 0; i < 5; ++i) {
      if (game.levelsCleared * Math.random() > 3 * i) {
        spawn.randomBoss(2000 + 500 * (Math.random() - 0.5), -800 + 200 * (Math.random() - 0.5), Infinity);
      }
      if (game.levelsCleared * Math.random() > 2.6 * i) {
        spawn.randomBoss(3500 + 500 * (Math.random() - 0.5), -800 + 200 * (Math.random() - 0.5), Infinity);
      }
      if (game.levelsCleared * Math.random() > 2.4 * i) {
        spawn.randomBoss(5000 + 500 * (Math.random() - 0.5), -800 + 200 * (Math.random() - 0.5), Infinity);
      }
    }
  },
  //empty map for testing mobs
  intro() {
    game.zoomScale = 1000 //1400 is normal
    game.zoomTransition(1600, 1)

    mech.setPosToSpawn(460, -100); //normal spawn
    level.enter.x = -1000000; //offscreen
    level.enter.y = -400;
    level.exit.x = 2800;
    level.exit.y = -335;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");
    document.body.style.backgroundColor = "#444";
    //controls instructions
    // game.makeTextLog(
    //   "<br><br><div class='wrapper'> <div class = 'grid-box'> <span class = 'box'>W</span><br> <span class = 'box'>A</span> <span class = 'box'>S</span> <span class = 'box'>D</span></div> <div class = 'grid-box'> <span class = 'mouse'>️<span class='mouse-line'></span></span> </div></div>",
    //   Infinity
    // );

    game.makeTextLog(
      "<br><br><br><br><div class='wrapper'> <div class = 'grid-box'><strong>right mouse / space bar:</strong><br>pick up things</div> <div class = 'grid-box'> <span class = 'mouse'>️<span class='mouse-line'></span></span> </div></div>",
      Infinity
    );
    level.fill.push({
      x: -150,
      y: -1150,
      width: 2750,
      height: 1200,
      color: "rgba(0,70,80,0.1)"
    });

    level.fillBG.push({
      x: -150,
      y: -1150,
      width: 2900,
      height: 1200,
      color: "#fff"
    });
    level.fillBG.push({
      x: 2600,
      y: -600,
      width: 400,
      height: 500,
      color: "#edf9f9"
    });

    level.fillBG.push({
      x: 1600,
      y: -500,
      width: 100,
      height: 100,
      color: "#eee"
    });

    level.fillBG.push({
      x: -55,
      y: -283,
      width: 12,
      height: 100,
      color: "#eee"
    });

    //faster way to draw a wire
    function wallWire(x, y, width, height, front = false) {
      if (front) {
        level.fill.push({
          x: x,
          y: y,
          width: width,
          height: height,
          color: "#aaa"
        });
      } else {
        level.fillBG.push({
          x: x,
          y: y,
          width: width,
          height: height,
          color: "#eee"
        });
      }
    }

    for (let i = 0; i < 3; i++) {
      wallWire(100 - 10 * i, -1050 - 10 * i, 5, 800);
      wallWire(100 - 10 * i, -255 - 10 * i, -300, 5);
    }
    for (let i = 0; i < 5; i++) {
      wallWire(1000 + 10 * i, -1050 - 10 * i, 5, 600);
      wallWire(1000 + 10 * i, -450 - 10 * i, 150, 5);
      wallWire(1150 + 10 * i, -450 - 10 * i, 5, 500);
    }
    for (let i = 0; i < 3; i++) {
      wallWire(2650 - 10 * i, -700 - 10 * i, -300, 5);
      wallWire(2350 - 10 * i, -700 - 10 * i, 5, 800);
    }
    for (let i = 0; i < 5; i++) {
      wallWire(1625 + 10 * i, -1050, 5, 1200);
    }
    for (let i = 0; i < 4; i++) {
      wallWire(1650, -470 + i * 10, 670 - i * 10, 5);
      wallWire(1650 + 670 - i * 10, -470 + i * 10, 5, 600);
    }
    for (let i = 0; i < 3; i++) {
      wallWire(-200 - i * 10, -245 + i * 10, 1340, 5);
      wallWire(1140 - i * 10, -245 + i * 10, 5, 300);
      wallWire(-200 - i * 10, -215 + i * 10, 660, 5);
      wallWire(460 - i * 10, -215 + i * 10, 5, 300);
    }
    spawn.mapRect(-250, 0, 3000, 200); //ground
    spawn.mapRect(-350, -1200, 200, 1400); //left wall
    spawn.mapRect(3000, -1200, 200, 1400); //right wall
    spawn.mapRect(-250, -1200, 3000, 200); //roof
    spawn.mapRect(2600, -300, 500, 500); //exit shelf
    spawn.mapRect(2600, -1200, 500, 600); //exit roof
    spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100); //exit bump
    spawn.mapRect(-95, -1100, 80, 110); //wire source
    spawn.mapRect(410, -10, 90, 20); //small platform for player

    // spawn.bodyRect(-35, -50, 50, 50);
    // spawn.bodyRect(-40, -100, 50, 50);
    // spawn.bodyRect(-45, -150, 60, 50);
    // spawn.bodyRect(-40, -200, 50, 50);
    // spawn.bodyRect(5, -50, 40, 50);
    // spawn.bodyRect(10, -100, 60, 50);
    // spawn.bodyRect(-10, -150, 40, 50);
    // spawn.bodyRect(55, -100, 40, 50);
    // spawn.bodyRect(-150, -300, 100, 100);
    // spawn.bodyRect(-150, -200, 100, 100);
    // spawn.bodyRect(-150, -100, 100, 100);

    // spawn.bodyRect(1790, -50, 40, 50);
    // spawn.bodyRect(1875, -100, 200, 90);
    spawn.bodyRect(2425, -120, 70, 50);
    spawn.bodyRect(2400, -100, 100, 60);
    spawn.bodyRect(2500, -150, 100, 150); //exit step

    mech.health = 0.25;
    mech.displayHealth();
    powerUps.spawn(-100, 0, "heal", false); //starting gun
    powerUps.spawn(1900, -150, "heal", false); //starting gun
    powerUps.spawn(2050, -150, "heal", false); //starting gun
    // powerUps.spawn(2050, -150, "field", false); //starting gun
    powerUps.spawn(2300, -150, "gun", false); //starting gun

    spawn.wireFoot();
    spawn.wireFootLeft();
    spawn.wireKnee();
    spawn.wireKneeLeft();
    spawn.wireHead();
  },

  rooftops() {
    game.zoomTransition(1700) //1400 is normal

    document.body.style.backgroundColor = "#dcdcde";

    if (Math.random() < 0.75) {
      //normal direction start in top left
      mech.setPosToSpawn(-450, -2050);
      level.exit.x = 3600;
      level.exit.y = -300;
      spawn.mapRect(3600, -285, 100, 50); //ground bump wall
      //mobs that spawn in exit room
      spawn.randomSmallMob(4100, -100);
      spawn.randomSmallMob(4600, -100);
      spawn.randomMob(3765, -450, 0.3);
      level.fill.push({
        x: -650,
        y: -2300,
        width: 450,
        height: 300,
        color: "rgba(0,0,0,0.15)"
      });
    } else {
      //reverse direction, start in bottom right
      mech.setPosToSpawn(3650, -310);
      level.exit.x = -550;
      level.exit.y = -2030;
      spawn.mapRect(-550, -2015, 100, 50); //ground bump wall
      spawn.boost(4950, 0, 1600);
      level.fillBG.push({
        x: -650,
        y: -2300,
        width: 450,
        height: 300,
        color: "#d4f4f4"
      });
    }
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");

    spawn.debris(1650, -1800, 3800, 20); //20 debris per level
    powerUps.spawnStartingPowerUps(2450, -1675);

    //foreground

    level.fill.push({
      x: 3450,
      y: -1250,
      width: 1100,
      height: 1250,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 4550,
      y: -725,
      width: 900,
      height: 725,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 3400,
      y: 100,
      width: 2150,
      height: 900,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: -700,
      y: -1950,
      width: 2100,
      height: 2950,
      color: "rgba(0,0,0,0.1)"
    });

    level.fill.push({
      x: 1950,
      y: -1950,
      width: 600,
      height: 350,
      color: "rgba(0,0,0,0.1)"
    });

    level.fill.push({
      x: 1950,
      y: -1550,
      width: 1025,
      height: 550,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 1600,
      y: -900,
      width: 1650,
      height: 1900,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 3450,
      y: -1550,
      width: 350,
      height: 300,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 700,
      y: -2225,
      width: 700,
      height: 225,
      color: "rgba(0,0,0,0.1)"
    });

    //spawn.mapRect(-700, 0, 6250, 100); //ground
    spawn.mapRect(3400, 0, 2150, 100); //ground
    spawn.mapRect(-700, -2000, 2100, 50); //Top left ledge
    spawn.bodyRect(1300, -2125, 50, 125, 0.8);
    spawn.bodyRect(1307, -2225, 50, 100, 0.8);
    spawn.mapRect(-700, -2350, 50, 400); //far left starting left wall
    spawn.mapRect(-700, -2010, 500, 50); //far left starting ground
    spawn.mapRect(-700, -2350, 500, 50); //far left starting ceiling
    spawn.mapRect(-250, -2350, 50, 200); //far left starting right part of wall
    spawn.bodyRect(-240, -2150, 30, 36); //door to starting room
    spawn.bodyRect(-240, -2115, 30, 36); //door to starting room
    spawn.bodyRect(-240, -2080, 30, 35); //door to starting room
    spawn.bodyRect(-240, -2045, 30, 35); //door to starting room


    spawn.mapRect(1950, -2000, 600, 50);


    spawn.bodyRect(200, -2150, 200, 220, 0.8);
    spawn.mapRect(700, -2275, 700, 50);
    spawn.bodyRect(1050, -2350, 30, 30, 0.8);
    spawn.boost(1800, -1000, 1200);
    spawn.bodyRect(1625, -1100, 100, 75);
    spawn.bodyRect(1350, -1025, 400, 25); // ground plank
    spawn.mapRect(-700, -1000, 2100, 100); //lower left ledge
    spawn.bodyRect(350, -1100, 200, 100, 0.8);
    spawn.bodyRect(370, -1200, 100, 100, 0.8);
    spawn.bodyRect(360, -1300, 100, 100, 0.8);
    spawn.bodyRect(950, -1050, 300, 50, 0.8);
    spawn.bodyRect(-600, -1250, 400, 250, 0.8);
    spawn.mapRect(1600, -1000, 1650, 100); //middle ledge
    spawn.bodyRect(2600, -1950, 100, 250, 0.8);
    spawn.bodyRect(2700, -1125, 125, 125, 0.8);
    spawn.bodyRect(2710, -1250, 125, 125, 0.8);
    spawn.bodyRect(2705, -1350, 75, 100, 0.8);
    spawn.mapRect(3450, -1600, 350, 50);
    spawn.mapRect(1950, -1600, 1025, 50);
    spawn.bodyRect(3100, -1015, 375, 15);
    spawn.bodyRect(3500, -850, 75, 125, 0.8);
    spawn.mapRect(3450, -1000, 50, 580); //left building wall
    spawn.bodyRect(3460, -420, 30, 144);


    spawn.mapRect(5450, -775, 100, 875); //right building wall
    spawn.bodyRect(4850, -750, 300, 25, 0.8);
    spawn.bodyRect(3925, -1400, 100, 150, 0.8);
    spawn.mapRect(3450, -1250, 1100, 50);
    spawn.mapRect(3450, -1225, 50, 75);
    spawn.mapRect(4500, -1225, 50, 350);
    spawn.mapRect(3450, -725, 1500, 50);
    spawn.mapRect(5100, -725, 400, 50);
    spawn.mapRect(4500, -700, 50, 600);
    spawn.bodyRect(4510, -100, 30, 100, 0.8);
    spawn.mapRect(4500, -925, 100, 50);

    spawn.spawnStairs(3800, 0, 3, 150, 206); //stairs top exit
    spawn.mapRect(3400, -275, 450, 275); //exit platform


    spawn.randomSmallMob(2200, -1775);
    spawn.randomSmallMob(4000, -825);
    spawn.randomSmallMob(-350, -2400);
    spawn.randomMob(4250, -1350, 0.8);
    spawn.randomMob(2550, -1350, 0.8);
    spawn.randomMob(1225, -2400, 0.3);
    spawn.randomMob(1120, -1200, 0.3);
    spawn.randomMob(3000, -1150, 0.2);
    spawn.randomMob(3200, -1150, 0.3);
    spawn.randomMob(3300, -1750, 0.3);
    spawn.randomMob(3650, -1350, 0.3);
    spawn.randomMob(3600, -1800, 0.1);
    spawn.randomMob(5200, -100, 0.3);
    spawn.randomMob(5275, -900, 0.2);
    spawn.randomMob(900, -2125, 0.3);
    spawn.randomBoss(600, -1575, 0);
    spawn.randomBoss(2225, -1325, 0.4);
    spawn.randomBoss(4900, -1200, 0);
    //spawn.randomBoss(4850, -1250,0.7);
    if (game.levelsCleared > 4) spawn.bomber(2500, -2400, 100);
  },
  skyscrapers() {
    game.zoomTransition(2000) //1400 is normal

    mech.setPosToSpawn(-50, -50); //normal spawn
    //mech.setPosToSpawn(1550, -1200); //spawn left high
    //mech.setPosToSpawn(1800, -2000); //spawn near exit
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;
    level.exit.x = 1500;
    level.exit.y = -1875;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");

    powerUps.spawnStartingPowerUps(1475, -1175);
    spawn.debris(0, -2200, 4500, 20); //20 debris per level
    document.body.style.backgroundColor = "#dcdcde";

    //foreground
    level.fill.push({
      x: 2500,
      y: -1100,
      width: 450,
      height: 250,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 2400,
      y: -550,
      width: 600,
      height: 150,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 2550,
      y: -1650,
      width: 250,
      height: 200,
      color: "rgba(0,0,0,0.1)"
    });
    //level.fill.push({ x: 1350, y: -2100, width: 400, height: 250, color: "rgba(0,255,255,0.1)" });
    level.fill.push({
      x: 700,
      y: -110,
      width: 400,
      height: 110,
      color: "rgba(0,0,0,0.2)"
    });
    level.fill.push({
      x: 3600,
      y: -110,
      width: 400,
      height: 110,
      color: "rgba(0,0,0,0.2)"
    });
    level.fill.push({
      x: -250,
      y: -300,
      width: 450,
      height: 300,
      color: "rgba(0,0,0,0.15)"
    });

    //background
    level.fillBG.push({
      x: 1300,
      y: -1800,
      width: 750,
      height: 1800,
      color: "#d4d4d7"
    });
    level.fillBG.push({
      x: 3350,
      y: -1325,
      width: 50,
      height: 1325,
      color: "#d4d4d7"
    });
    level.fillBG.push({
      x: 1350,
      y: -2100,
      width: 400,
      height: 250,
      color: "#d4f4f4"
    });

    spawn.mapRect(-300, 0, 5000, 300); //***********ground
    spawn.mapRect(-300, -350, 50, 400); //far left starting left wall
    spawn.mapRect(-300, -10, 500, 50); //far left starting ground
    spawn.mapRect(-300, -350, 500, 50); //far left starting ceiling
    spawn.mapRect(150, -350, 50, 200); //far left starting right part of wall
    spawn.bodyRect(170, -130, 14, 140, 1, spawn.propsFriction); //door to starting room
    spawn.boost(475, 0, 1300);
    spawn.mapRect(700, -1100, 400, 990); //far left building
    spawn.mapRect(1600, -400, 1500, 500); //long center building
    spawn.mapRect(1345, -1100, 250, 25); //left platform
    spawn.mapRect(1755, -1100, 250, 25); //right platform
    spawn.mapRect(1300, -1850, 750, 50); //left higher platform
    spawn.mapRect(1300, -2150, 50, 350); //left higher platform left edge wall
    spawn.mapRect(1300, -2150, 450, 50); //left higher platform roof
    spawn.mapRect(1500, -1860, 100, 50); //ground bump wall
    spawn.mapRect(2400, -850, 600, 300); //center floating large square
    //spawn.bodyRect(2500, -1100, 25, 250); //wall before chasers
    spawn.mapRect(2500, -1450, 450, 350); //higher center floating large square
    spawn.mapRect(2500, -1675, 50, 300); //left wall on higher center floating large square
    spawn.mapRect(2500, -1700, 300, 50); //roof on higher center floating large square
    spawn.mapRect(3300, -850, 150, 25); //ledge by far right building
    spawn.mapRect(3300, -1350, 150, 25); //higher ledge by far right building
    spawn.mapRect(3600, -1100, 400, 990); //far right building
    spawn.boost(4150, 0, 1300);

    spawn.bodyRect(3200, -1375, 300, 25, 0.9);
    spawn.bodyRect(1825, -1875, 400, 25, 0.9);
    // spawn.bodyRect(1800, -575, 250, 150, 0.8);
    spawn.bodyRect(1800, -600, 250, 200, 0.8);
    spawn.bodyRect(2557, -450, 35, 55, 0.7);
    spawn.bodyRect(2957, -450, 30, 15, 0.7);
    spawn.bodyRect(2900, -450, 60, 45, 0.7);
    spawn.bodyRect(915, -1200, 60, 100, 0.95);
    spawn.bodyRect(925, -1300, 50, 100, 0.95);
    if (Math.random() < 0.9) {
      spawn.bodyRect(2300, -1720, 400, 20);
      spawn.bodyRect(2590, -1780, 80, 80);
    }
    spawn.bodyRect(2925, -1100, 25, 250, 0.8);
    spawn.bodyRect(3325, -1550, 50, 200, 0.3);
    if (Math.random() < 0.8) {
      spawn.bodyRect(1400, -75, 200, 75); //block to get up ledge from ground
      spawn.bodyRect(1525, -125, 50, 50); //block to get up ledge from ground
    }
    spawn.bodyRect(1025, -1110, 400, 25, 0.9); //block on far left building
    spawn.bodyRect(1425, -1110, 115, 25, 0.9); //block on far left building
    spawn.bodyRect(1540, -1110, 300, 25, 0.9); //block on far left building

    if (game.levelsCleared > 2) spawn.shooterBoss(2200, -1300);
    spawn.randomSmallMob(1300, -70);
    spawn.randomSmallMob(3200, -100);
    spawn.randomSmallMob(4450, -100);
    spawn.randomSmallMob(2700, -475);
    spawn.randomMob(2650, -975, 0.8);
    spawn.randomMob(2650, -1550, 0.8);
    spawn.randomMob(4150, -200, 0.15);
    spawn.randomMob(1700, -1300, 0.2);
    spawn.randomMob(1850, -1950, 0.25);
    spawn.randomMob(2610, -1880, 0.25);
    spawn.randomMob(3350, -950, 0.25);
    spawn.randomMob(1690, -2250, 0.25);
    spawn.randomMob(2200, -600, 0.2);
    spawn.randomMob(850, -1300, 0.25);
    spawn.randomMob(-100, -900, -0.2);
    spawn.randomBoss(3700, -1500, 0.4);
    spawn.randomBoss(1700, -900, 0.4);
  },
  highrise() {
    game.zoomTransition(1500) //1400 is normal
    document.body.style.backgroundColor = "#dcdcde" //"#fafcff";
    mech.setPosToSpawn(0, -700); //normal spawn
    //mech.setPosToSpawn(-2000, -1700); // left ledge spawn
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;
    level.exit.x = -4275;
    level.exit.y = -2805;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");
    powerUps.spawnStartingPowerUps(-2550, -700);

    // spawn.laserZone(-550, -350, 10, 400, 0.3)
    // spawn.deathQuery(-550, -350, 50, 400)

    // spawn.debris(-3950, -2575, 1050, 4); //20 debris per level
    spawn.debris(-2325, -1825, 2400); //20 debris per level
    spawn.debris(-2625, -600, 925); //20 debris per level
    // if (!game.levelsCleared) powerUps.spawn(2450, -1675, "gun", false);
    //background
    level.fillBG.push({
      x: -4425,
      y: -3050,
      width: 425,
      height: 275,
      color: "#cff"
    });
    //foreground
    level.fill.push({
      x: -1650,
      y: -1575,
      width: 550,
      height: 425,
      color: "rgba(0,0,0,0.12)"
    });
    level.fill.push({
      x: -2600,
      y: -2400,
      width: 450,
      height: 1800,
      color: "rgba(0,0,0,0.12)"
    });
    level.fill.push({
      x: -3425,
      y: -2150,
      width: 525,
      height: 1550,
      color: "rgba(0,0,0,0.12)"
    });
    level.fill.push({
      x: -1850,
      y: -1150,
      width: 2025,
      height: 1150,
      color: "rgba(0,0,0,0.12)"
    });

    //hidden zone
    level.fill.push({
      x: -4450,
      y: -955,
      width: 1025,
      height: 360,
      color: "rgba(64,64,64,0.97)"
    });
    // level.fill.push({
    //   x: -4050,
    //   y: -955,
    //   width: 625,
    //   height: 360,
    //   color: "#444"
    // }); 
    powerUps.spawn(-4300, -700, "heal");
    powerUps.spawn(-4200, -700, "ammo");
    powerUps.spawn(-4100, -700, "gun");
    spawn.mapRect(-4450, -1000, 100, 500);
    spawn.bodyRect(-3576, -750, 150, 150);


    //building 1
    spawn.bodyRect(-1000, -675, 25, 25);
    spawn.mapRect(-2225, 0, 2475, 150);
    spawn.mapRect(175, -1000, 75, 1100);

    spawn.mapRect(-175, -985, 25, 175);
    spawn.bodyRect(-170, -810, 14, 160, 1, spawn.propsFriction); //door to starting room
    spawn.mapRect(-600, -650, 825, 50);
    spawn.mapRect(-1300, -650, 500, 50);
    spawn.mapRect(-175, -250, 425, 300);
    spawn.bodyRect(-75, -300, 50, 50);

    // spawn.boost(-750, 0, 0, -0.01);
    spawn.boost(-750, 0, 1700);
    spawn.bodyRect(-425, -1375, 400, 225);
    spawn.mapRect(-1125, -1575, 50, 475);
    spawn.bodyRect(-1475, -1275, 250, 125);
    spawn.bodyRect(-825, -1160, 250, 10);

    spawn.mapRect(-1650, -1575, 400, 50);
    spawn.mapRect(-600, -1150, 850, 175);

    spawn.mapRect(-1850, -1150, 1050, 175);
    spawn.bodyRect(-1907, -1600, 550, 25);
    spawn.bodyRect(-1400, -125, 125, 125);
    spawn.bodyRect(-1100, -125, 150, 125);
    spawn.bodyRect(-1360, -200, 75, 75);
    spawn.bodyRect(-1200, -75, 75, 75);

    //building 2
    spawn.mapRect(-4450, -600, 2300, 750);
    spawn.mapRect(-2225, -500, 175, 550);
    spawn.boost(-2800, -600, 1000);
    spawn.mapRect(-3450, -1325, 550, 50);
    spawn.mapRect(-3425, -2200, 525, 50);
    spawn.mapRect(-2600, -1750, 450, 50);
    spawn.mapRect(-2600, -2450, 450, 50);
    spawn.bodyRect(-2275, -2700, 50, 60);
    spawn.bodyRect(-2600, -1975, 250, 225);
    spawn.bodyRect(-3415, -1425, 100, 100);
    spawn.bodyRect(-3400, -1525, 100, 100);
    spawn.bodyRect(-3305, -1425, 100, 100);

    //building 3
    spawn.mapRect(-4450, -1750, 1025, 1000);
    spawn.mapRect(-3750, -2000, 175, 275);
    spawn.mapRect(-4000, -2350, 275, 675);
    // spawn.mapRect(-4450, -2650, 475, 1000);
    spawn.mapRect(-4450, -2775, 475, 1125);
    spawn.bodyRect(-3715, -2050, 50, 50);
    spawn.bodyRect(-3570, -1800, 50, 50);
    spawn.bodyRect(-2970, -2250, 50, 50);
    spawn.bodyRect(-3080, -2250, 40, 40);
    spawn.bodyRect(-3420, -650, 50, 50);

    //exit
    spawn.mapRect(-4450, -3075, 25, 300);
    spawn.mapRect(-4450, -3075, 450, 25);
    spawn.mapRect(-4025, -3075, 25, 100);
    spawn.mapRect(-4275, -2785, 100, 25);

    //mobs
    spawn.randomMob(-2500, -2700, 1);
    spawn.randomMob(-3200, -750, 1);
    spawn.randomMob(-1875, -775, 0.2);
    spawn.randomMob(-950, -1675, 0.2);
    spawn.randomMob(-1525, -1750, 0.2);
    spawn.randomMob(-1375, -1400, 0.2);
    spawn.randomMob(-1625, -1275, 0.2);
    spawn.randomMob(-1900, -1250, 0.2);
    spawn.randomMob(-2250, -1850, 0.2);
    spawn.randomMob(-2475, -2200, 0.2);
    spawn.randomMob(-3000, -1475, 0.2);
    spawn.randomMob(-3850, -2500, 0.2);
    spawn.randomMob(-3650, -2125, 0.2);
    spawn.randomMob(-4010, -3200, 0.2);
    spawn.randomMob(-3500, -1825, 0.2);
    spawn.randomMob(-975, -100, 0);
    spawn.randomMob(-1050, -725, 0.2);
    spawn.randomMob(-1525, -100, 0);
    spawn.randomMob(-525, -1700, -0.1);
    spawn.randomMob(-125, -1500, -0.1);
    spawn.randomMob(-325, -1900, -0.1);
    spawn.randomMob(-550, -100, -0.1);
    spawn.randomBoss(-3250, -2700, 0.2);
    spawn.randomBoss(-2450, -1100, 0);
  },
  warehouse() {
    game.zoomTransition(1300)
    document.body.style.backgroundColor = "#bbb";
    mech.setPosToSpawn(25, -60); //normal spawn
    //mech.setPosToSpawn(-2000, -1700); // left ledge spawn
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;
    level.exit.x = 425;
    level.exit.y = -35;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");
    //level.addQueryRegion(-600, -250, 180, 420, "death", [[player]],{});

    spawn.debris(-2250, 1330, 3000, 7); //20 debris per level
    spawn.debris(-3000, -800, 3280, 7); //20 debris per level
    spawn.debris(-1400, 410, 2300, 6); //20 debris per level
    powerUps.spawnStartingPowerUps(25, 500);

    //foreground
    // level.fill.push({ x: -3025, y: 50, width: 4125, height: 1350, color: "rgba(0,0,0,0.05)"});
    // level.fill.push({ x: -1800, y: -500, width: 1975, height: 550, color: "rgba(0,0,0,0.05)"});
    // level.fill.push({ x: -2600, y: -150, width: 700, height: 200, color: "rgba(0,0,0,0.05)"});
    //background
    const BGColor = "#f3f3ea";
    level.fillBG.push({
      x: -3025,
      y: 50,
      width: 4125,
      height: 1350,
      color: BGColor
    });
    level.fillBG.push({
      x: -1800,
      y: -500,
      width: 1625,
      height: 555,
      color: BGColor
    });
    level.fillBG.push({
      x: -177,
      y: -250,
      width: 350,
      height: 300,
      color: "#e3e3da"
    });
    level.fillBG.push({
      x: -2600,
      y: -150,
      width: 700,
      height: 205,
      color: BGColor
    });
    level.fillBG.push({
      x: 300,
      y: -250,
      width: 350,
      height: 250,
      color: "#cff"
    });
    spawn.mapRect(-1500, 0, 2750, 100);
    spawn.mapRect(175, -270, 125, 300);
    spawn.mapRect(-1900, -600, 1775, 100);
    spawn.mapRect(-1900, -600, 100, 1300);
    //house
    spawn.mapRect(-175, -550, 50, 400);
    spawn.mapRect(-175, -15, 350, 50);
    spawn.mapRect(-25, -25, 100, 50);
    // spawn.mapRect(-175, -275, 350, 25);
    // spawn.mapRect(-175, -250, 25, 75);
    // spawn.bodyRect(-170, -175, 14, 160, 1, spawn.propsFriction); //door to starting room
    //exit house
    spawn.mapRect(300, -15, 350, 50);
    spawn.mapRect(-150, -300, 800, 50);
    spawn.mapRect(600, -275, 50, 75);
    spawn.mapRect(425, -25, 100, 25);
    // spawn.mapRect(-1900, 600, 2700, 100);
    spawn.mapRect(1100, 0, 150, 1500);
    spawn.mapRect(-2850, 1400, 4100, 100);
    spawn.mapRect(-2375, 875, 1775, 100);
    spawn.mapRect(-1450, 950, 75, 346);
    spawn.mapRect(-1433, 662, 41, 111);
    spawn.bodyRect(-1418, 773, 11, 102, 1, spawn.propsFriction); //blocking path
    spawn.mapRect(-2950, 1250, 175, 250);
    spawn.mapRect(-3050, 1100, 150, 400);
    spawn.mapRect(-3150, 50, 125, 1450);
    spawn.mapRect(-2375, 600, 3175, 100);
    spawn.mapRect(-2125, 400, 250, 275);
    // spawn.mapRect(-1950, -400, 100, 25);
    spawn.mapRect(-3150, 50, 775, 100);
    spawn.mapRect(-2600, -250, 775, 100);
    spawn.bodyRect(-1350, -200, 200, 200, 1, spawn.propsSlide); //weight
    spawn.bodyRect(-1800, 0, 300, 100, 1, spawn.propsHoist); //hoist
    cons[cons.length] = Constraint.create({
      pointA: {
        x: -1650,
        y: -500
      },
      bodyB: body[body.length - 1],
      stiffness: 0.000076,
      length: 1
    });

    spawn.bodyRect(400, 400, 200, 200, 1, spawn.propsSlide); //weight
    spawn.bodyRect(800, 600, 300, 100, 1, spawn.propsHoist); //hoist
    cons[cons.length] = Constraint.create({
      pointA: {
        x: 950,
        y: 100
      },
      bodyB: body[body.length - 1],
      stiffness: 0.000076,
      length: 1
    });

    spawn.bodyRect(-2775, 1150, 190, 150, 1, spawn.propsSlide); //weight
    spawn.bodyRect(-2575, 1150, 200, 150, 1, spawn.propsSlide); //weight
    spawn.bodyRect(-2775, 1300, 400, 100, 1, spawn.propsHoist); //hoist
    cons[cons.length] = Constraint.create({
      pointA: {
        x: -2575,
        y: 150
      },
      bodyB: body[body.length - 1],
      stiffness: 0.000076,
      length: 220
    });

    //blocks
    //spawn.bodyRect(-155, -150, 10, 140, 1, spawn.propsFriction);
    spawn.bodyRect(-165, -150, 30, 35, 1);
    spawn.bodyRect(-165, -115, 30, 35, 1);
    spawn.bodyRect(-165, -80, 30, 35, 1);
    spawn.bodyRect(-165, -45, 30, 35, 1);

    spawn.bodyRect(-750, 400, 150, 150, 0.5);
    spawn.bodyRect(-200, 1175, 250, 225, 1); //block to get to top path on bottom level
    // spawn.bodyRect(-1450, 737, 75, 103, 0.5); //blocking path

    spawn.bodyRect(-2525, -50, 145, 100, 0.5);
    spawn.bodyRect(-2325, -300, 150, 100, 0.5);
    spawn.bodyRect(-1275, -750, 200, 150, 0.5); //roof block
    spawn.bodyRect(-525, -700, 125, 100, 0.5); //roof block

    //mobs
    spawn.randomSmallMob(-1125, 550);
    spawn.randomSmallMob(-2325, 800);
    spawn.randomSmallMob(-2950, -50);
    spawn.randomSmallMob(825, 300);
    spawn.randomSmallMob(-900, 825);
    spawn.randomMob(-2025, 175, 0.6);
    spawn.randomMob(-2325, 450, 0.6);
    spawn.randomMob(-2925, 675, 0.5);
    spawn.randomMob(-2700, 300, 0.2);
    spawn.randomMob(-2500, 300, 0.2);
    spawn.randomMob(-2075, -425, 0.2);
    spawn.randomMob(-1550, -725, 0.2);
    spawn.randomMob(375, 1100, 0.1);
    spawn.randomMob(-1425, -100, 0.1);
    spawn.randomMob(-800, -750, 0);
    spawn.randomMob(400, -350, 0);
    spawn.randomMob(650, 1300, 0);
    spawn.randomMob(-750, -150, 0);
    spawn.randomMob(475, 300, 0);
    spawn.randomMob(-75, -700, 0);
    spawn.randomMob(900, -200, -0.1);
    spawn.randomBoss(-125, 275, -0.2);
    spawn.randomBoss(-825, 1000, 0.2);
    spawn.randomBoss(-1300, -1100, -0.3);
    //spawn.randomBoss(600, -1575, 0);
    //spawn.randomMob(1120, -1200, 0.3);
    //spawn.randomSmallMob(2200, -1775);

    if (game.levelsCleared > 2) spawn.snaker(-1300 + Math.random() * 2000, -2200); //boss snake with head
  },
  towers() {
    game.zoomTransition(1400)
    if (Math.random() < 0.75) {
      //normal direction start in top left
      mech.setPosToSpawn(1375, -1550); //normal spawn
      level.exit.x = 3250;
      level.exit.y = -530;
      // spawn.randomSmallMob(3550, -550);
    } else {
      //reverse direction, start in bottom right
      mech.setPosToSpawn(3250, -530); //normal spawn
      level.exit.x = 1375;
      level.exit.y = -1530;
      spawn.bodyRect(3655, -650, 40, 150); //door
    }
    spawn.mapRect(level.exit.x, level.exit.y + 20, 100, 50); //ground bump wall
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");

    document.body.style.backgroundColor = "#e0e5e0";
    //foreground
    level.fill.push({
      x: -550,
      y: -1700,
      width: 1300,
      height: 1700,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 750,
      y: -1450,
      width: 650,
      height: 1450,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 750,
      y: -1950,
      width: 800,
      height: 450,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 3000,
      y: -1000,
      width: 650,
      height: 1000,
      color: "rgba(0,0,0,0.1)"
    });
    level.fill.push({
      x: 3650,
      y: -1300,
      width: 1300,
      height: 1300,
      color: "rgba(0,0,0,0.1)"
    });

    //mech.setPosToSpawn(600, -1200); //normal spawn
    //mech.setPosToSpawn(525, -150); //ground first building
    //mech.setPosToSpawn(3150, -700); //near exit spawn
    spawn.debris(-300, -200, 1000, 5); //ground debris //20 debris per level
    spawn.debris(3500, -200, 800, 5); //ground debris //20 debris per level
    spawn.debris(-300, -650, 1200, 5); //1st floor debris //20 debris per level
    spawn.debris(3500, -650, 800, 5); //1st floor debris //20 debris per level
    powerUps.spawnStartingPowerUps(-525, -700);

    spawn.mapRect(-600, 25, 5600, 300); //ground
    spawn.mapRect(-600, 0, 2000, 50); //ground
    spawn.mapRect(-600, -1700, 50, 2000 - 100); //left wall
    spawn.bodyRect(-295, -1540, 40, 40); //center block under wall
    spawn.bodyRect(-298, -1580, 40, 40); //center block under wall
    spawn.bodyRect(1500, -1540, 30, 30); //left of entrance

    spawn.mapRect(1550, -2000, 50, 550); //right wall
    spawn.mapRect(1350, -2000 + 505, 50, 1295); //right wall
    spawn.mapRect(-600, -2000 + 250, 2000 - 700, 50); //roof left
    spawn.mapRect(-600 + 1300, -2000, 50, 300); //right roof wall
    spawn.mapRect(-600 + 1300, -2000, 900, 50); //center wall
    map[map.length] = Bodies.polygon(425, -1700, 0, 15); //circle above door
    spawn.bodyRect(420, -1675, 15, 170, 1, spawn.propsDoor); // door
    body[body.length - 1].isNotHoldable = true;
    //makes door swing
    consBB[consBB.length] = Constraint.create({
      bodyA: body[body.length - 1],
      pointA: {
        x: 0,
        y: -90
      },
      bodyB: map[map.length - 1],
      stiffness: 1
    });
    spawn.mapRect(-600 + 300, -2000 * 0.75, 1900, 50); //3rd floor
    spawn.mapRect(-600 + 2000 * 0.7, -2000 * 0.74, 50, 375); //center wall
    spawn.bodyRect(-600 + 2000 * 0.7, -2000 * 0.5 - 106, 50, 106); //center block under wall
    spawn.mapRect(-600, -1000, 1100, 50); //2nd floor
    spawn.mapRect(600, -1000, 500, 50); //2nd floor
    spawn.spawnStairs(-600, -1000, 4, 250, 350); //stairs 2nd
    spawn.mapRect(350, -600, 350, 150); //center table
    spawn.mapRect(-600 + 300, -2000 * 0.25, 2000 - 300, 50); //1st floor
    spawn.spawnStairs(-600 + 2000 - 50, -500, 4, 250, 350, true); //stairs 1st
    spawn.spawnStairs(-600, 0, 4, 250, 350); //stairs ground
    spawn.bodyRect(700, -200, 100, 100); //center block under wall
    spawn.bodyRect(700, -300, 100, 100); //center block under wall
    spawn.bodyRect(700, -400, 100, 100); //center block under wall
    spawn.mapRect(1390, 13, 30, 20); //step left
    spawn.mapRect(2980, 13, 30, 20); //step right
    spawn.mapRect(3000, 0, 2000, 50); //ground
    spawn.bodyRect(4250, -700, 50, 100);
    spawn.bodyRect(3000, -200, 50, 200); //door
    spawn.mapRect(3000, -1000, 50, 800); //left wall
    spawn.mapRect(3000 + 2000 - 50, -1300, 50, 1100); //right wall
    spawn.mapRect(4150, -600, 350, 150); //table
    spawn.mapRect(3650, -1300, 50, 650); //exit wall
    spawn.mapRect(3650, -1300, 1350, 50); //exit wall

    spawn.mapRect(3000, -2000 * 0.5, 700, 50); //exit roof
    spawn.mapRect(3000, -2000 * 0.25, 2000 - 300, 50); //1st floor
    spawn.spawnStairs(3000 + 2000 - 50, 0, 4, 250, 350, true); //stairs ground

    // tether ball
    if (game.levelsCleared > 2) {
      level.fillBG.push({
        x: 2495,
        y: -500,
        width: 10,
        height: 525,
        color: "#ccc"
      });
      spawn.tether(2850, -80)
      cons[cons.length] = Constraint.create({
        pointA: {
          x: 2500,
          y: -500
        },
        bodyB: mob[mob.length - 1],
        stiffness: 0.00012
      });
      //chance to spawn a ring of exploding mobs around this boss
      if (game.levelsCleared > 4) spawn.nodeBoss(2850, -80, "spawns", 8, 20, 105);
    }

    spawn.randomSmallMob(4575, -560, 1);
    spawn.randomSmallMob(1315, -880, 1);
    spawn.randomSmallMob(800, -600);
    spawn.randomSmallMob(-100, -1600);
    spawn.randomMob(4100, -225, 0.8);
    spawn.randomMob(-250, -700, 0.8);
    spawn.randomMob(4500, -225, 0.15);
    spawn.randomMob(3250, -225, 0.15);
    spawn.randomMob(-100, -225, 0.1);
    spawn.randomMob(1150, -225, 0.15);
    spawn.randomMob(2000, -225, 0.15);
    spawn.randomMob(450, -225, 0.15);
    spawn.randomMob(100, -1200, 1);
    spawn.randomMob(950, -1150, -0.1);
    spawn.randomBoss(1800, -800, -0.2);
    spawn.randomBoss(4150, -1000, 0.6);
  },
  //*****************************************************************************************************************
  //*****************************************************************************************************************
  //*****************************************************************************************************************
  //*****************************************************************************************************************
  //*****************************************************************************************************************
  //*****************************************************************************************************************
  //*****************************************************************************************************************
  enter: {
    x: 0,
    y: 0,
    draw() {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 30);
      ctx.lineTo(this.x, this.y - 80);
      ctx.bezierCurveTo(this.x, this.y - 170, this.x + 100, this.y - 170, this.x + 100, this.y - 80);
      ctx.lineTo(this.x + 100, this.y + 30);
      ctx.lineTo(this.x, this.y + 30);
      ctx.fillStyle = "#ccc";
      ctx.fill();
    }
  },
  exit: {
    x: 0,
    y: 0,
    draw() {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + 30);
      ctx.lineTo(this.x, this.y - 80);
      ctx.bezierCurveTo(this.x, this.y - 170, this.x + 100, this.y - 170, this.x + 100, this.y - 80);
      ctx.lineTo(this.x + 100, this.y + 30);
      ctx.lineTo(this.x, this.y + 30);
      ctx.fillStyle = "#0ff";
      ctx.fill();
    }
  },
  fillBG: [],
  drawFillBGs() {
    for (let i = 0, len = level.fillBG.length; i < len; ++i) {
      const f = level.fillBG[i];
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x, f.y, f.width, f.height);
    }
  },

  fill: [],
  drawFills() {
    for (let i = 0, len = level.fill.length; i < len; ++i) {
      const f = level.fill[i];
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x, f.y, f.width, f.height);
    }
  },
  zones: [], //zone do actions when player is in a region   // to effect everything use a query
  checkZones() {
    for (let i = 0, len = this.zones.length; i < len; ++i) {
      if (
        player.position.x > this.zones[i].x1 &&
        player.position.x < this.zones[i].x2 &&
        player.position.y > this.zones[i].y1 &&
        player.position.y < this.zones[i].y2
      ) {
        this.zoneActions[this.zones[i].action](i);
        break;
      }
    }
  },
  addZone(x, y, width, height, action, info) {
    this.zones[this.zones.length] = {
      x1: x,
      y1: y - 150,
      x2: x + width,
      y2: y + height - 70, //-70 to adjust for player height
      action: action,
      info: info
    };
  },
  zoneActions: {
    fling(i) {
      Matter.Body.setVelocity(player, {
        x: level.zones[i].info.Vx,
        y: level.zones[i].info.Vy
      });
    },
    nextLevel() {
      //enter when player isn't falling
      if (player.velocity.y < 0.1) {
        //increases difficulty
        game.levelsCleared++;
        if (game.levelsCleared > 1) {
          game.dmgScale += 0.25; //damage done by mobs increases each level
          b.dmgScale *= 0.93; //damage done by player decreases each level
        }
        //cycles map to next level
        level.onLevel++;
        if (level.onLevel > level.levels.length - 1) level.onLevel = 0;

        game.clearNow = true; //triggers in the physics engine to remove all physics bodies
      }
    },
    death() {
      mech.death();
    },
    laser(i) {
      //draw these in game with spawn.background
      mech.damage(level.zones[i].info.dmg);
    },
    slow() {
      Matter.Body.setVelocity(player, {
        x: player.velocity.x * 0.5,
        y: player.velocity.y * 0.5
      });
    }
  },
  queryList: [], //queries do actions on many objects in regions  (for only player use a zone)
  checkQuery() {
    let bounds, action, info;

    function isInZone(targetArray) {
      let results = Matter.Query.region(targetArray, bounds);
      for (let i = 0, len = results.length; i < len; ++i) {
        level.queryActions[action](results[i], info);
      }
    }
    for (let i = 0, len = level.queryList.length; i < len; ++i) {
      bounds = level.queryList[i].bounds;
      action = level.queryList[i].action;
      info = level.queryList[i].info;
      for (let j = 0, l = level.queryList[i].groups.length; j < l; ++j) {
        isInZone(level.queryList[i].groups[j]);
      }
    }
  },
  //oddly query regions can't get smaller than 50 width?
  addQueryRegion(x, y, width, height, action, groups = [
    [player], body, mob, powerUp, bullet
  ], info) {
    this.queryList[this.queryList.length] = {
      bounds: {
        min: {
          x: x,
          y: y
        },
        max: {
          x: x + width,
          y: y + height
        }
      },
      action: action,
      groups: groups,
      info: info
    };
  },
  queryActions: {
    bounce(target, info) {
      //jerky fling upwards
      Matter.Body.setVelocity(target, {
        x: info.Vx + (Math.random() - 0.5) * 6,
        y: info.Vy
      });
      target.torque = (Math.random() - 0.5) * 2 * target.mass;
    },
    boost(target, info) {
      // if (target.velocity.y < 0) {
      // mech.undoCrouch();
      // mech.enterAir();
      mech.buttonCD_jump = 0; // reset short jump counter to prevent short jumps on boosts
      mech.hardLandCD = 0 // disable hard landing
      Matter.Body.setVelocity(target, {
        x: target.velocity.x + (Math.random() - 0.5) * 2,
        y: info
      });
    },
    force(target, info) {
      if (target.velocity.y < 0) {
        //gently force up if already on the way up
        target.force.x += info.Vx * target.mass;
        target.force.y += info.Vy * target.mass;
      } else {
        target.force.y -= 0.0007 * target.mass; //gently fall in on the way down
      }
    },
    antiGrav(target) {
      target.force.y -= 0.0011 * target.mass;
    },
    death(target) {
      target.death();
    }
  },
  levelAnnounce() {
    let text = "L" + (game.levelsCleared) + " " + level.levels[level.onLevel];
    if (game.levelsCleared === 0) text = "";
    // text = "Level " + (game.levelsCleared + 1) + ": " + spawn.pickList[0] + "s + " + spawn.pickList[1] + "s";
    game.makeTextLog(text, 300);
    document.title = "n-gon: " + text;

    // text = text + " with population: ";
    // for (let i = 0, len = spawn.pickList.length; i < len; ++i) {
    //     if (spawn.pickList[i] != spawn.pickList[i - 1]) {
    //         text += spawn.pickList[i] + ", ";
    //     }
    // }
    // this.speech(text);
    // game.makeTextLog(text, 360);
  },
  addToWorld(mapName) {
    //needs to be run to put bodies into the world
    for (let i = 0; i < body.length; i++) {
      //body[i].collisionFilter.group = 0;
      body[i].collisionFilter.category = 0x0000001;
      body[i].collisionFilter.mask = 0x011111;
      body[i].classType = "body";
      World.add(engine.world, body[i]); //add to world
    }
    for (let i = 0; i < map.length; i++) {
      //map[i].collisionFilter.group = 0;
      map[i].collisionFilter.category = 0x000001;
      map[i].collisionFilter.mask = 0x111111;
      Matter.Body.setStatic(map[i], true); //make static
      World.add(engine.world, map[i]); //add to world
    }
    for (let i = 0; i < cons.length; i++) {
      World.add(engine.world, cons[i]);
    }
    for (let i = 0; i < consBB.length; i++) {
      World.add(engine.world, consBB[i]);
    }
  }
};