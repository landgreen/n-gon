//global game variables
let body = []; //non static bodies
let map = []; //all static bodies
let cons = []; //all constaints between a point and a body
let consBB = []; //all constaints between two bodies
//main object for spawning levels
const level = {
  onLevel: undefined,
  start: function() {
    // game.levelsCleared = 3; //for testing to simulate all possible mobs spawns
    // game.draw.setMapColors();
    spawn.setSpawnList(); //picks a couple mobs types for a themed random mob spawns
    // this.procedural();
    this.testingMap();
    //this.warehouse(); //this.highrise();    //this.towers();    // this.skyscrapers();    //this.rooftops();
    this.addToWorld(); //add map to world
    game.draw.setPaths();
    this.levelAnnounce();
  },
  //******************************************************************************************************************
  //******************************************************************************************************************
  //empty map for testing mobs
  testingMap: function() {
    // game.levelsCleared = 5; //for testing to simulate all possible mobs spawns
    // for (let i = 0; i < 5; i++) {
    //   game.dmgScale += 0.4; //damage done by mobs increases each level
    //   b.dmgScale *= 0.9; //damage done by player decreases each level
    // }
    mech.setPosToSpawn(-75, -60); //normal spawn
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y + 20;

    level.exit.x = 3500;
    level.exit.y = -870;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");
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
    for (let i = 0; i < 17; i++) {
      powerUps.spawn(450, -125, "gun", false);
    }
    for (let i = 0; i < 5; i++) {
      powerUps.spawn(2500 + i * 20, -1300, "gun", false);
      powerUps.spawn(2500 + i * 20, -1100, "ammo", false);
    }
    spawn.bodyRect(700, -50, 50, 50);
    spawn.bodyRect(700, -100, 50, 50);
    spawn.bodyRect(700, -150, 50, 50);
    spawn.bodyRect(700, -200, 50, 50);
    spawn.bodyRect(-100, -260, 250, 10);
    // spawn.springer(100, -550);
    // spawn.grower(100, -550);
    // spawn.chaser(100, -550);
    // spawn.striker(100, -550);
    // spawn.spinner(100, -550);
    // spawn.hopper(100, -550);
    // spawn.grower(100, -550);
    // spawn.springer(100, -550);
    // spawn.zoomer(100, -550);
    // spawn.shooter(100, -550);
    // spawn.beamer(100, -550);
    // spawn.focuser(100, -550);
    // spawn.laser(100, -550);
    // spawn.blinker(100, -550);
    // spawn.drifter(100, -550);
    // spawn.sucker(100, -550);
    // spawn.exploder(100, -550);
    // spawn.spawner(100, -550);
    // spawn.ghoster(100, -550);
    // spawn.sneaker(100, -550);
    // spawn.bomber(100, -550);

    // spawn.flocker(-600, -650);

    // spawn.flocker(-600, -550);
    // spawn.flocker(-600, -750);
    // spawn.starter(-600, -550);
    // spawn.flocker(-900, -850);
    // spawn.flocker(-600, -550);
    // spawn.flocker(-600, -750);
    spawn.starter(-600, -550);
    // for (let i = 0; i < 4; ++i) {
    //   spawn.shooter(800, -1150);
    // }
    // spawn.nodeBoss(900, -1070, "shooter", 9);
    // spawn.randomBoss(-100, -1470);
    // spawn.randomBoss(500, -1470);
    // spawn.randomBoss(900, -1470);
    // spawn.randomBoss(900, -1000);
  },
  //****************************************************************************************************
  //****************************************************************************************************
  //****************************************************************************************************
  //****************************************************************************************************
  //****************************************************************************************************
  procedural: function() {
    const mobChance = 0.3;
    const maxJump = 390;
    const boostScale = 0.000023;
    //
    mech.setPosToSpawn(0, -10); //normal spawn
    level.enter.x = mech.spawnPos.x - 50;
    level.enter.y = mech.spawnPos.y - 15;
    //starting zone
    spawn.mapRect(-250, -320, 50, 400); //far left starting left wall
    spawn.mapRect(-250, -0, 500, 110); //far left starting ground
    spawn.mapRect(-250, -340, 500, 50); //far left starting ceiling
    spawn.mapRect(200, -320, 50, 180); //far left starting right part of wall
    spawn.bodyRect(220, -120, 14, 140, 1, spawn.propsFriction); //door to starting room
    spawn.mapRect(-50, -10, 100, 50);
    spawn.mapRect(0, 10, 400, 100); //***********ground
    if (b.inventory.length < 3) {
      powerUps.spawn(550, -50, "gun", false); //starting gun
    } else {
      powerUps.spawnRandomPowerUp(550, -50);
    }
    level.fill.push({
      x: -250,
      y: -300,
      width: 500,
      height: 300,
      color: "rgba(0,0,0,0.15)"
    });

    let o = { x: 400, y: 10 }; //keeps track of where the next mapNode should be added
    mapNode = [
      function() {
        //one or two shelves
        let nodeRange = { x: 650 + Math.round(Math.random() * 900), y: 0 };
        spawn.mapRect(o.x, o.y, nodeRange.x, 100);
        spawn.randomMob(o.x + 200 + 600 * Math.random(), o.y - 50, mobChance);
        spawn.debris(o.x + 50, o.y, nodeRange.x - 100, 2);

        //shelf(s)
        const shelfElevation = 230 + 200 * Math.random();
        const shelfWidth = nodeRange.x - 200 - 300 * Math.random();
        if (Math.random() < 0.85 && shelfWidth > 650) {
          const len = 1 + Math.ceil(Math.random() * Math.random() * Math.random() * 5);
          const sep = 50 + 100 * Math.random();
          const x1 = o.x + nodeRange.x / 2 - shelfWidth / 2;
          const x2 = o.x + nodeRange.x / 2 + sep;
          for (let i = 1; i < len; ++i) {
            //two shelves
            spawn.mapRect(x1, o.y - shelfElevation * i, shelfWidth / 2 - sep, 50);
            spawn.mapRect(x2, o.y - shelfElevation * i, shelfWidth / 2 - sep, 50);
            //plank connecting shelves
            spawn.bodyRect(
              o.x + (nodeRange.x - shelfWidth) / 2 + shelfWidth / 2 - sep - 75,
              o.y - shelfElevation * i - 30,
              sep + 250,
              10,
              0.6,
              spawn.propsFrictionMedium
            );
          }
          level.fillBG.push({
            x: x1,
            y: o.y - shelfElevation * (len - 1),
            width: shelfWidth / 2 - sep,
            height: shelfElevation * (len - 1),
            color: "#f0f0f3"
          });
          level.fillBG.push({
            x: x2,
            y: o.y - shelfElevation * (len - 1),
            width: shelfWidth / 2 - sep,
            height: shelfElevation * (len - 1),
            color: "#f0f0f3"
          });
        } else {
          const len = 1 + Math.ceil(Math.random() * Math.random() * Math.random() * 5);
          for (let i = 1; i < len; ++i) {
            //one shelf
            spawn.mapRect(o.x + (nodeRange.x - shelfWidth) / 2, o.y - shelfElevation * i, shelfWidth, 50);
            level.fillBG.push({
              x: o.x + (nodeRange.x - shelfWidth) / 2,
              y: o.y - shelfElevation * (len - 1),
              width: shelfWidth,
              height: shelfElevation * (len - 1),
              color: "#f0f0f3"
            });
          }
        }

        //square block
        const blockSize = 60 + Math.random() * 120;
        if (shelfElevation > blockSize + 100) {
          spawn.bodyRect(o.x + 100 + Math.random() * (nodeRange.x - 200), o.y - blockSize, blockSize, blockSize, 0.3);
        } else {
          spawn.bodyRect(o.x + 50 + (nodeRange.x - shelfWidth) / 2, o.y - shelfElevation - blockSize, blockSize, blockSize, 0.3);
        }
        spawn.randomMob(o.x + (nodeRange.x - shelfWidth) / 2, o.y - shelfElevation - 100, mobChance); //mob above shelf
        spawn.debris(o.x + 50 + (nodeRange.x - shelfWidth) / 2, o.y - shelfElevation - 50, shelfWidth - 100, 1);
        // set starting position for new mapNode
        o.x += nodeRange.x;
        o.y += nodeRange.y;
      },
      function() {
        //several platforms that rise up
        const wide = 120 + Math.floor(Math.random() * Math.random() * 450);
        let nodeRange = { x: 100, y: -Math.floor(200 + Math.random() * 150) };
        for (let i = 0, len = 1 + Math.ceil(Math.random() * 4); i < len; i++) {
          spawn.platform(o.x + nodeRange.x, o.y, wide, nodeRange.y);
          spawn.debris(o.x + nodeRange.x - 120, o.y - 50, wide + 250, Math.floor(Math.random() * 0.8 + 0.5));
          if (Math.random() < 0.3) {
            spawn.randomBoss(o.x + nodeRange.x + 20 + (wide - 40) * Math.random(), o.y + nodeRange.y - 450, mobChance);
          } else {
            spawn.randomMob(o.x + nodeRange.x + 20 + (wide - 40) * Math.random(), o.y + nodeRange.y - 50, mobChance); //mob above shelf
          }
          nodeRange.x += Math.floor(wide + 155 + Math.random() * 200);
          nodeRange.y -= Math.floor(115 + Math.random() * 200);
        }
        spawn.mapRect(o.x, o.y, nodeRange.x, 100); //ground
        spawn.mapRect(o.x + nodeRange.x, o.y + nodeRange.y + 15, 100, -nodeRange.y + 85); //right wall
        // set starting position for new mapNode
        o.x += nodeRange.x;
        o.y += nodeRange.y;
      },
      function() {
        //s-shaped building goes up 2 levels
        const floorHeight = maxJump - Math.floor(Math.random() * 150); //maxJump = 390
        let nodeRange = { x: 700 + Math.floor(Math.random() * 800), y: -floorHeight * 2 };
        const wallWidth = 20 + Math.floor(Math.random() * 40);
        const numberOfFloors = 2 + Math.floor(Math.random() * 2);
        const frontYardWidth = 250;
        o.x += frontYardWidth;
        spawn.mapRect(o.x - frontYardWidth, o.y, nodeRange.x + frontYardWidth, 100); //first floor  ground
        let floorWidth = nodeRange.x - wallWidth - 250 - Math.random() * Math.random() * nodeRange.x * 0.4; //possible open area with only half long 2nd floor
        spawn.mapRect(o.x + wallWidth, o.y - floorHeight, floorWidth, wallWidth); //second floor
        spawn.mapRect(o.x + 300, o.y - floorHeight * 2, nodeRange.x - 300, wallWidth); //third floor
        if (numberOfFloors > 2) spawn.mapRect(o.x, o.y - floorHeight * 3, nodeRange.x, wallWidth); //optional roof
        spawn.mapRect(o.x, o.y - floorHeight * numberOfFloors, wallWidth, floorHeight * numberOfFloors - 175); //left building wall
        if (Math.random() < 0.8) {
          spawn.mapRect(o.x + nodeRange.x - wallWidth, o.y - floorHeight * 2 + wallWidth, wallWidth, floorHeight * 2); //right building wall
        } else {
          spawn.mapRect(o.x + nodeRange.x - wallWidth, o.y - floorHeight * 2 + wallWidth, wallWidth, floorHeight * 2 - 175 - wallWidth); //right building wall with right door
        }
        level.fill.push({
          x: o.x,
          y: o.y - floorHeight * numberOfFloors,
          width: nodeRange.x,
          height: floorHeight * numberOfFloors,
          color: "rgba(0,0,0,0.1)"
        });

        //random extras
        const debrisRange = nodeRange.x - wallWidth * 4;
        spawn.debris(o.x + wallWidth, o.y - 50, debrisRange, 1);
        spawn.debris(o.x + wallWidth, o.y - 50 - floorHeight, debrisRange - 250, 1);
        spawn.debris(o.x + wallWidth + 250, o.y - 50 - floorHeight * 2, debrisRange - 250, 1);
        spawn.randomSmallMob(o.x + wallWidth + Math.random() * debrisRange, o.y - 80, 3);
        spawn.randomSmallMob(o.x + wallWidth + Math.random() * (debrisRange - 250), o.y - 80 - floorHeight);
        spawn.randomSmallMob(o.x + wallWidth + 250 + Math.random() * (debrisRange - 250), o.y - 80 - floorHeight * 2);
        let blockSize = 70 + Math.random() * 70;
        spawn.bodyRect(o.x - blockSize + nodeRange.x - wallWidth - Math.random() * 30, o.y - blockSize, blockSize, blockSize, 0.4);
        blockSize = 70 + Math.random() * 100;
        spawn.bodyRect(o.x + wallWidth + Math.random() * 30, o.y - floorHeight - blockSize, blockSize, blockSize, 0.4);

        o.x += nodeRange.x;
        if (Math.random() < 0.5) o.y += nodeRange.y; //start the next level at the top floor of the building
      },
      function() {
        //building with several floors that goes down a couple levels
        const numberOfFloors = 2 + Math.floor(Math.random() * 2);
        const floorHeight = maxJump - Math.floor(Math.random() * 150); //maxJump = 390
        let nodeRange = { x: 825 + Math.floor(Math.random() * 800), y: floorHeight * numberOfFloors };
        const wallWidth = 20 + Math.floor(Math.random() * 40);
        const frontYardWidth = 250;
        o.x += frontYardWidth;
        spawn.mapRect(o.x, o.y - floorHeight * 2, nodeRange.x, wallWidth); //roof level 2
        if (Math.random() < 0.5) {
          spawn.mapRect(o.x + 300, o.y - floorHeight, nodeRange.x - 600, wallWidth); //level 1
        } else if (Math.random() < 0.5) {
          spawn.mapRect(o.x + 300, o.y - floorHeight, nodeRange.x - 600, wallWidth + floorHeight); //level 1
        }
        spawn.mapRect(o.x - frontYardWidth, o.y, nodeRange.x + frontYardWidth - 300, wallWidth); //ground
        // spawn.mapRect(o.x - frontYardWidth, o.y + 10, frontYardWidth, 100 - 10); // makes the front yard look 100 deep
        let floorWidth = nodeRange.x - wallWidth - 250 - Math.random() * Math.random() * nodeRange.x * 0.4; //possible open area with only half long 2nd floor
        spawn.mapRect(o.x + nodeRange.x - floorWidth, o.y + floorHeight, floorWidth, wallWidth); //B1 floor
        spawn.mapRect(o.x, o.y + floorHeight * numberOfFloors, nodeRange.x, 100); //B2 floor

        spawn.mapRect(o.x, o.y - floorHeight * 2, wallWidth, floorHeight * 2 - 175); //left building wall above ground
        spawn.mapRect(o.x, o.y + wallWidth, wallWidth, floorHeight * numberOfFloors); //left building wall lower
        spawn.mapRect(o.x + nodeRange.x - wallWidth, o.y + wallWidth - floorHeight * 2, wallWidth, floorHeight * (numberOfFloors + 2) - wallWidth - 175); //right building wall with right door

        level.fill.push({
          x: o.x,
          y: o.y - floorHeight * 2,
          width: nodeRange.x,
          height: floorHeight * (numberOfFloors + 2),
          color: "rgba(0,0,0,0.1)"
        });
        //random extras
        spawn.debris(o.x, o.y - 50, nodeRange.x - 300, 1); //ground
        spawn.debris(o.x, o.y + floorHeight * 2 - 50, nodeRange.x, 1); //B2
        spawn.randomSmallMob(o.x + wallWidth + Math.random() * nodeRange.x - 300, o.y - 50); //ground
        if (numberOfFloors === 3) {
          spawn.randomBoss(o.x + nodeRange.x / 2, o.y + floorHeight * 2 - 50);
        } else {
          spawn.randomSmallMob(o.x + wallWidth + Math.random() * nodeRange.x * 0.8, o.y + floorHeight - 50); //B1
          spawn.randomSmallMob(o.x + wallWidth + Math.random() * nodeRange.x * 0.8, o.y + floorHeight * numberOfFloors - 50); //B2
        }

        o.x += nodeRange.x;
        o.y += nodeRange.y; //start the next level at the top floor of the building
      },
      function() {
        //large room with boost to roof exit
        const wallWidth = 20 + Math.floor(Math.random() * 40);
        const boostX = 500 + Math.floor(Math.random() * 1500);
        const boostPadding = 35 + Math.floor(Math.random() * 200);
        let nodeRange = { x: boostX + 500 + Math.floor(Math.random() * 500), y: 700 + Math.floor(Math.random() * 600) };
        //optional basement mode
        if (Math.random() < 0.75 && boostX > 1000) {
          spawn.mapRect(o.x, o.y, 200 + wallWidth, wallWidth); //ground entrance
          const basementDepth = Math.min(400 + Math.floor(Math.random() * 300), nodeRange.y - 200);
          o.y += basementDepth;
          o.x += 200;
          spawn.mapRect(o.x, o.y, nodeRange.x, 100); //basement ground
          spawn.mapRect(o.x, o.y - nodeRange.y + 15, wallWidth, nodeRange.y - 200 - basementDepth); //left building wall
          spawn.mapRect(o.x, o.y - basementDepth + 15, wallWidth, basementDepth); //left basement wall
        } else {
          spawn.mapRect(o.x, o.y, nodeRange.x + 200, 100); //ground
          o.x += 200;
          spawn.mapRect(o.x, o.y - nodeRange.y + 15, wallWidth, nodeRange.y - 200); //left building wall
        }
        spawn.mapRect(o.x + nodeRange.x - wallWidth, o.y - nodeRange.y + 15, wallWidth, nodeRange.y); //right building wall
        spawn.mapRect(o.x, o.y - nodeRange.y, boostX - boostPadding, wallWidth); //left roof
        spawn.mapRect(o.x + boostX + 100 + boostPadding, o.y - nodeRange.y, nodeRange.x - boostX - 100 - boostPadding, wallWidth); //right roof

        if (boostPadding < 100 && nodeRange.y < 1300) {
          spawn.boost(o.x + boostX, o.y, nodeRange.y + 600);
          spawn.bodyRect(o.x + boostX - boostPadding - 100, o.y - nodeRange.y - 20, 300 + 2 * boostPadding, 10, 1);
        } else {
          spawn.boost(o.x + boostX, o.y, nodeRange.y);
        }
        spawn.debris(o.x, o.y - nodeRange.y - 50, boostX - boostPadding, 1); //on roof
        spawn.debris(o.x, o.y - 50, boostX - boostPadding, 1); //on ground
        let blockSize = 60 + Math.random() * 150;
        spawn.bodyRect(o.x + wallWidth + Math.random() * (boostX - blockSize - wallWidth), o.y - blockSize, blockSize, blockSize, 0.8); //left
        spawn.bodyRect(o.x + nodeRange.x - blockSize - 10, o.y - blockSize, blockSize, blockSize, 0.8); //right

        const ledgeHeight = 500 + Math.random() * (nodeRange.y - 900) - 150;
        if (Math.random() < 0.5) {
          spawn.randomMob(o.x + 200, o.y - ledgeHeight, mobChance); //mob in left top corner
          spawn.randomBoss(o.x + boostX + 100 + boostPadding + 100, o.y - nodeRange.y - 500, mobChance); //boss above right roof
        } else {
          spawn.randomBoss(o.x + 300, o.y - ledgeHeight); //mob in left top corner
          spawn.randomMob(o.x + boostX + 100 + boostPadding + 100, o.y - ledgeHeight, mobChance); //mob above right ledge
        }

        level.fill.push({
          x: o.x,
          y: o.y - nodeRange.y,
          width: nodeRange.x,
          height: nodeRange.y,
          color: "rgba(0,0,0,0.1)"
        });
        o.x += nodeRange.x;
        if (Math.random() < 0.5) o.y -= nodeRange.y; //start the next level at the top floor of the building or not
      },
      function() {
        //series of platforming ledges
        //first platform to get up to top height
        let wallWidth = 25 + Math.floor(Math.random() * 30);
        const startingX = o.x;
        const frontYard = 200;
        let firstPlatW = 800 + Math.floor(Math.random() * 350);
        o.x += frontYard;
        //optional extra lower floor
        let zeroFloor = 0;
        if (Math.random() < 0.7) {
          zeroFloor = maxJump - 100;
          spawn.mapRect(o.x, o.y - zeroFloor, firstPlatW + 100, zeroFloor + 15); //0th floor
        }
        const firstFloorH = maxJump - Math.floor(Math.random() * 50) + zeroFloor;
        const fullHeight = firstFloorH + 300 + 300;

        const totalCases = 4;
        switch (Math.ceil(Math.random() * totalCases)) {
          case 1:
            spawn.mapRect(o.x, o.y - firstFloorH, firstPlatW, 100); //1st floor
            spawn.mapRect(o.x, o.y - firstFloorH - 300, 100, 315); //1st floor left wall
            spawn.mapRect(o.x + 300, o.y - fullHeight, firstPlatW - 400, 450); //2st floor

            level.fill.push({
              //darkness under first floor left building
              x: o.x,
              y: o.y - firstFloorH,
              width: firstPlatW,
              height: firstFloorH - zeroFloor,
              color: "rgba(0,0,0,0.15)"
            });
            level.fill.push({
              //darkness under second floor left building
              x: o.x + 300,
              y: o.y - firstFloorH - 300,
              width: firstPlatW - 400,
              height: firstFloorH - zeroFloor,
              color: "rgba(0,0,0,0.2)"
            });
            break;
          case 2:
            if (Math.random() < 0.1) {
              spawn.mapRect(o.x + 200, o.y - firstFloorH, 200, firstFloorH + 15 - zeroFloor);
            } else {
              const size = 50 + Math.floor(Math.random() * 100);
              for (let i = 0, len = Math.ceil(Math.random() * 8); i < len; ++i) {
                spawn.bodyRect(o.x + 200, o.y - zeroFloor - size * (1 + i), size, size);
              }
            }
            spawn.boost(o.x + firstPlatW - 100, o.y - zeroFloor, fullHeight); //-0.007
            break;
          case 3:
            spawn.mapRect(o.x + 200, o.y - firstFloorH, firstPlatW - 200, 100); //1st floor
            spawn.mapRect(o.x + 400, o.y - firstFloorH - 300, firstPlatW - 400, 315); //1st floor left wall
            spawn.mapRect(o.x + 600, o.y - fullHeight, firstPlatW - 600, 450); //2st floor
            level.fill.push({
              //darkness under second floor left building
              x: o.x + 200,
              y: o.y - firstFloorH,
              width: firstPlatW - 200,
              height: firstFloorH - zeroFloor,
              color: "rgba(0,0,0,0.1)"
            });
            break;
          case 4:
            const poleWidth = 50;
            const platWidth = 200;
            const secondPlatX = platWidth + 125;
            const totalWidth = platWidth + secondPlatX;
            spawn.mapRect(o.x + firstPlatW - totalWidth, o.y - firstFloorH - 350, platWidth, wallWidth);
            spawn.mapRect(o.x + firstPlatW - totalWidth, o.y - firstFloorH + 100, platWidth, wallWidth);
            spawn.mapRect(o.x + secondPlatX + firstPlatW - totalWidth, o.y - firstFloorH - 100, platWidth, wallWidth);
            spawn.mapRect(o.x + secondPlatX + firstPlatW - totalWidth, o.y - fullHeight, platWidth, wallWidth);
            level.fillBG.push({
              x: o.x + platWidth / 2 - poleWidth / 2 + firstPlatW - totalWidth,
              y: o.y - firstFloorH - 350,
              width: poleWidth,
              height: firstFloorH + 350 - zeroFloor,
              color: "rgba(0,0,0,0.2)"
            });
            level.fillBG.push({
              x: o.x + platWidth / 2 - poleWidth / 2 + secondPlatX + firstPlatW - totalWidth,
              y: o.y - fullHeight,
              width: poleWidth,
              height: fullHeight - zeroFloor,
              color: "rgba(0,0,0,0.2)"
            });
            if (Math.random() < 0.9) {
              const platX = firstPlatW - totalWidth - platWidth - 125;
              spawn.mapRect(o.x + platX, o.y - firstFloorH - 100, platWidth, wallWidth);
              spawn.mapRect(o.x + platX, o.y - fullHeight, platWidth, wallWidth);

              level.fillBG.push({
                x: o.x + platWidth / 2 - poleWidth / 2 + platX,
                y: o.y - fullHeight,
                width: poleWidth,
                height: fullHeight - zeroFloor,
                color: "rgba(0,0,0,0.2)"
              });
            }
            break;
        }
        spawn.debris(o.x, o.y - zeroFloor - 50, firstPlatW, 2);
        spawn.randomMob(o.x + firstPlatW - 200 - Math.random() * 600, o.y - zeroFloor - 100, mobChance); //in shadow
        spawn.randomMob(o.x + firstPlatW - 200 - Math.random() * 400, o.y - fullHeight - 100, mobChance); //top
        spawn.randomBoss(o.x + firstPlatW - 200, o.y - fullHeight - 500, mobChance); //top

        //random platforms
        let offX = o.x + firstPlatW;
        const len = Math.ceil(Math.random() * Math.random() * 4.5);
        for (let i = 0; i < len; i++) {
          const totalCases = 3;
          switch (Math.ceil(Math.random() * totalCases)) {
            case 1:
              const width = 150 + Math.floor(Math.random() * 500);
              const middle = Math.floor(width / 2);
              spawn.mapRect(offX + 300, o.y - fullHeight, width, wallWidth); //top platform
              if (Math.random() < 0.5) spawn.mapRect(offX + 300, o.y - 50, width, 65); //ground bump
              //optional room on second floor
              if (width > 400) {
                roomHeight = Math.min(maxJump, width) - 100;
                roomLipWidth = 200;
                spawn.mapRect(offX + 300 + width - wallWidth, o.y - fullHeight - roomHeight, wallWidth, roomHeight + 15); //room right wall
                spawn.mapRect(offX + 300 + roomLipWidth, o.y - fullHeight - roomHeight, width - roomLipWidth, wallWidth); //room roof
                level.fill.push({
                  x: offX + 300 + roomLipWidth,
                  y: o.y - fullHeight - roomHeight + wallWidth,
                  width: width - roomLipWidth,
                  height: roomHeight - wallWidth,
                  color: "rgba(0,0,0,0.1)"
                });
              } else if (Math.random() < 0.5) {
                spawn.mapRect(offX + 300, o.y - firstFloorH, width, wallWidth); //middle platform
                spawn.bodyRect(offX + 300 - Math.floor(Math.random() * 100), o.y - fullHeight - 20, width + Math.floor(Math.random() * 300), 20, 0.7); //plank on top platform)
              }
              level.fillBG.push({
                x: offX + 300 + middle - 25,
                y: o.y - fullHeight,
                width: 50,
                height: fullHeight,
                color: "rgba(0,0,0,0.2)"
              });
              spawn.debris(offX + 300, o.y - 50, width, 1);
              spawn.randomMob(offX + 300 + Math.random() * width, o.y - fullHeight - 100, 1); //top
              offX += 300 + width;
              break;
            case 2:
              const width2 = 500 + Math.floor(Math.random() * 400);
              const forkDepth = 300;
              const forkBaseHeight = fullHeight - forkDepth - (maxJump - 100) - 250;
              spawn.mapRect(offX + 300, o.y - maxJump + 100, width2, maxJump - 100); //base
              spawn.mapRect(offX + 300, o.y - fullHeight + forkDepth, width2, forkBaseHeight); //fork base
              if (Math.random() < 0.7) spawn.mapRect(offX + 300, o.y - fullHeight, 100, forkDepth); //left fork
              spawn.mapRect(offX + 300 + width2 - 100, o.y - fullHeight, 100, forkDepth); //right fork

              level.fill.push({
                x: offX + 300,
                y: o.y - fullHeight + forkDepth + forkBaseHeight,
                width: width2,
                height: fullHeight - forkDepth - forkBaseHeight - maxJump + 100,
                color: "rgba(0,0,0,0.1)"
              });
              spawn.debris(offX + 300, o.y - maxJump - 100, width2, 1);
              spawn.randomMob(offX + 450 + Math.random() * (width2 - 300), o.y - fullHeight + 200, 1); //top
              offX += 300 + width2;
              break;
            case 3:
              const width3 = 200 + Math.floor(Math.random() * 300);
              if (Math.random() < 0.7) {
                spawn.mapRect(offX + 300, o.y - fullHeight, width3, fullHeight - 150); //top platform

                level.fill.push({
                  x: offX + 300,
                  y: o.y - 150,
                  width: width3,
                  height: 150,
                  color: "rgba(0,0,0,0.25)"
                });
              } else {
                //add a gap
                const gap = (fullHeight - 150) / 2 + 100;
                spawn.mapRect(offX + 300, o.y - fullHeight, width3, fullHeight - 150 - gap); //top platform
                spawn.mapRect(offX + 300, o.y - fullHeight + gap, width3, fullHeight - 150 - gap); //top platform
                level.fill.push({
                  x: offX + 300,
                  y: o.y - 150,
                  width: width3,
                  height: 150,
                  color: "rgba(0,0,0,0.25)"
                });
                level.fill.push({
                  x: offX + 300,
                  y: o.y - 150 - gap,
                  width: width3,
                  height: 200,
                  color: "rgba(0,0,0,0.25)"
                });
              }
              spawn.randomMob(offX + 300 + Math.random() * width3, o.y - fullHeight - 100, mobChance); //top
              spawn.debris(offX + 300, o.y - fullHeight - 100, width3, 1);
              offX += 300 + width3;
              break;
          }
        }
        o.x += offX - o.x + 200;
        spawn.mapRect(startingX, o.y, o.x - startingX + 15, 100); //ground
        spawn.mapRect(o.x, o.y - fullHeight + 15, 100, fullHeight + 85); //right wall
        o.y -= fullHeight;
      },
      function() {
        const width = 200 + Math.ceil(Math.random() * 200);
        const height = (maxJump - 50) * (1 - Math.random() * 0.4);
        const len = 2 + Math.ceil(Math.random() * 4);
        const gapWidth = 150 + Math.ceil(Math.random() * 325);
        const stairsUp = function() {
          const x = o.x;
          for (let i = 0; i < len; ++i) {
            if (Math.random() < 0.4 && height > 200 && i !== 0) {
              //hidden alcove
              spawn.mapRect(o.x, o.y, width, 50); //ledge
              spawn.mapRect(o.x + width - 50, o.y, (len - i - 1) * width + 50, height + 15); //back wall
              level.fill.push({
                x: o.x,
                y: o.y + 50,
                width: width - 50,
                height: height - 50,
                color: "rgba(0,0,0,0.15)"
              });
              spawn.randomMob(o.x + width - 100, o.y + height / 2 + 50);
            } else {
              spawn.mapRect(o.x, o.y, (len - i) * width, height + 15); //ledge
            }
            if (Math.random() < 0.5) spawn.debris(o.x, o.y - 50, width, 1);
            o.x += width;
            o.y -= height;
          }
          o.y += height;
        };
        const stairsDown = function() {
          const x = o.x;
          for (let i = 0; i < len; ++i) {
            if (Math.random() < 0.4 && height > 200 && i !== len - 1) {
              //hidden alcove
              spawn.mapRect(o.x, o.y, width, 50); //ledge
              spawn.mapRect(x, o.y, -x + o.x + 50, height + 15); //back wall
              level.fill.push({
                x: o.x + 50,
                y: o.y + 50,
                width: width - 50,
                height: height - 50,
                color: "rgba(0,0,0,0.15)"
              });
              spawn.randomSmallMob(o.x + 100, o.y + height / 2 + 50);
            } else {
              spawn.mapRect(x, o.y, width - x + o.x, height + 15); //ledge
            }
            if (Math.random() < 0.5) spawn.debris(o.x, o.y - 50, width, 1);
            o.x += width;
            o.y += height;
          }
          o.y -= height;
        };
        const spawnGapBoss = function() {
          if (game.levelsCleared !== 0 || Math.random() < 0.3 + game.levelsCleared * 0.11) {
            spawn.bodyRect(o.x - 50, o.y - 15, gapWidth + 100, 15); //plank over gap to catch boss
            spawn.randomBoss(o.x + gapWidth / 2 - 50, o.y - 500);
          } else if (game.levelsCleared < 1) {
            spawn.bodyRect(o.x - 50, o.y - 15, gapWidth + 100, 15); //plank over gap
          }
        };
        if (Math.random() < 0.1) {
          spawn.mapRect(o.x, o.y, len * width + 300, 100); //front porch
          o.x += 300;
          spawn.mapRect(o.x + len * width + gapWidth, o.y, len * width + 300, 100); //back porch
          o.y -= height;
          stairsUp();
          spawnGapBoss();
          o.x += gapWidth;
          stairsDown();
          o.y += height;
          o.x += 300;
        } else {
          spawn.mapRect(o.x, o.y, 300, 100); //front porch
          o.x += 275;
          stairsDown();
          spawnGapBoss();
          o.x += gapWidth;
          stairsUp();
        }
        o.x -= 15;
      }
      // function() {
      //   platform = function(x, y, width, height, extend = 0) {
      //     spawn.mapRect(x, y - height, width, 50);
      //     level.fillBG.push({
      //       x: x + width / 2 - 25,
      //       y: y - height,
      //       width: 50,
      //       height: height + extend,
      //       color: "rgba(0,0,0,0.15)"
      //     });
      //     spawn.debris(x, y - height - 50, width, Math.floor(Math.random() * 1.5));
      //     spawn.randomMob(x + Math.random() * (width - 50) + 25, y - height - 50, mobChance);
      //   };
      //   let nodeRange = { x: 1500 + Math.floor(Math.random() * 500), y: 0, down: false, up: false };
      //   // const wallWidth = 20 + Math.floor(Math.random() * 40);
      //   //level 1
      //   const ledge = { width: nodeRange.x / 2, height: Math.max((maxJump - 200) * Math.random() + 200, 200) };
      //   if (Math.random() < 0.33) {
      //     //flat ground
      //     spawn.mapRect(o.x, o.y, nodeRange.x, 100); //ground
      //     ledge.height = 0;
      //   } else {
      //     if (Math.random() < 0.5) {
      //       //level down
      //       nodeRange.down = true;
      //       spawn.mapRect(o.x, o.y, ledge.width + 100 - 25, 100); //ground
      //       spawn.mapRect(o.x + ledge.width, o.y, 100, ledge.height + 100); //ledge wall
      //       o.y += ledge.height;
      //       spawn.mapRect(o.x + ledge.width, o.y, nodeRange.x - ledge.width, 100); //ground
      //       const wide = Math.min(250 + Math.random() * (ledge.width - 250), nodeRange.x - ledge.width - 350);
      //       platform(o.x + 250 + ledge.width, o.y, wide, ledge.height);
      //     } else {
      //       //level up
      //       nodeRange.down = false;
      //       spawn.mapRect(o.x, o.y, ledge.width + 100, 100); //ground
      //       spawn.mapRect(o.x + ledge.width, o.y - ledge.height, 100, ledge.height + 100); //ledge wall
      //       const wide = Math.min(250 + Math.random() * (ledge.width - 250), ledge.width - 250);
      //       platform(o.x + 150, o.y, wide, ledge.height);
      //       o.y -= ledge.height;
      //       spawn.mapRect(o.x + ledge.width + 25, o.y, nodeRange.x - ledge.width - 25, 100); //ground
      //     }
      //   }

      //   // platform(x, o.y, width, maxJump * 2 - 100);
      //   o.x += nodeRange.x;
      // }
      // function() {
      //   platform = function(x, y, width, height) {
      //     spawn.mapRect(x, y - height, width, 50);
      //     level.fillBG.push({
      //       x: x + width / 2 - 25,
      //       y: y - height,
      //       width: 50,
      //       height: height,
      //       color: "rgba(0,0,0,0.15)"
      //     });
      //     spawn.debris(x, y - height - 50, width, Math.floor(Math.random() * 1.5));
      //     spawn.randomMob(x + Math.random() * (width - 50) + 25, y - height - 50, mobChance);
      //   };
      //   let nodeRange = { x: 1500 + Math.floor(Math.random() * 500), y: 0, down: false, up: false };
      //   let level = maxJump - 100 * Math.random();

      //   // platform(x, o.y, width, maxJump * 2 - 100);
      //   o.x += nodeRange.x;
      // }
    ];
    //
    //
    //randomized zone spawns
    const mapNodes = Math.min(4, 2 + game.levelsCleared);
    // const mapNodes = 1;
    for (let i = 0; i < mapNodes; ++i) {
      // mapNode[1]();
      mapNode[Math.floor(Math.random() * mapNode.length)](); //run a random mapNode
    }
    //ending zone
    o.x += 200;
    level.exit.x = o.x + 200;
    level.exit.y = o.y - 35;
    this.addZone(level.exit.x, level.exit.y, 100, 30, "nextLevel");
    spawn.mapRect(o.x + 200, o.y - 20, 100, 50);
    spawn.mapRect(o.x + 450, o.y - 330, 50, 380);
    spawn.mapRect(o.x - 200, o.y - 10, 700, 110);
    spawn.mapRect(o.x, o.y - 325, 50, 100);
    spawn.mapRect(o.x, o.y - 350, 500, 50);
    // spawn.mapRect(o.x - 200, o.y, 300, 200);
    // spawn.mapGunPowerUp(o.x - 50, o.y + 0); //spawns a gun on most early levels
    // level.fillBG.push({
    //   x: o.x,
    //   y: o.y,
    //   width: 450,
    //   height: -350,
    //   color: "#dff"
    // });
    level.fill.push({
      x: o.x,
      y: o.y,
      width: 450,
      height: -350,
      color: "rgba(0, 255, 255, 0.15)"
    });
    //set new fall height
    game.fallHeight = o.y + 15000;
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
    draw: function() {
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
    draw: function() {
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
  drawFillBGs: function() {
    for (let i = 0, len = level.fillBG.length; i < len; ++i) {
      const f = level.fillBG[i];
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x, f.y, f.width, f.height);
    }
  },

  fill: [],
  drawFills: function() {
    for (let i = 0, len = level.fill.length; i < len; ++i) {
      const f = level.fill[i];
      ctx.fillStyle = f.color;
      ctx.fillRect(f.x, f.y, f.width, f.height);
    }
  },
  zones: [], //zone do actions when player is in a region   // to effect everything use a query
  checkZones: function() {
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
  addZone: function(x, y, width, height, action, info) {
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
    fling: function(i) {
      Matter.Body.setVelocity(player, {
        x: level.zones[i].info.Vx,
        y: level.zones[i].info.Vy
      });
    },
    nextLevel: function() {
      //enter when player isn't falling
      if (player.velocity.y < 0.1) {
        game.dmgScale += 0.3; //damage done by mobs increases each level
        b.dmgScale *= 0.92; //damage done by player decreases each level
        game.levelsCleared++;
        game.clearNow = true; //triggers in the physics engine to remove all physics bodies
      }
    },
    death: function() {
      mech.death();
    },
    laser: function(i) {
      //draw these in game with spawn.background
      mech.damage(level.zones[i].info.dmg);
    },
    slow: function() {
      Matter.Body.setVelocity(player, {
        x: player.velocity.x * 0.5,
        y: player.velocity.y * 0.5
      });
    }
  },
  queryList: [], //queries do actions on many objects in regions  (for only player use a zone)
  checkQuery: function() {
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
  addQueryRegion: function(x, y, width, height, action, groups = [[player], body, mob, powerUp, bullet], info) {
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
    bounce: function(target, info) {
      //jerky fling upwards
      Matter.Body.setVelocity(target, {
        x: info.Vx + (Math.random() - 0.5) * 6,
        y: info.Vy
      });
      target.torque = (Math.random() - 0.5) * 2 * target.mass;
    },
    boost: function(target, info) {
      if (target.velocity.y < 0) {
        mech.buttonCD_jump = 0; //reset short jump counter to pre vent short jumps on boosts
        Matter.Body.setVelocity(target, {
          x: target.velocity.x,
          y: info
        });
      }
    },
    force: function(target, info) {
      if (target.velocity.y < 0) {
        //gently force up if already on the way up
        target.force.x += info.Vx * target.mass;
        target.force.y += info.Vy * target.mass;
      } else {
        target.force.y -= 0.0007 * target.mass; //gently fall in on the way down
      }
    },
    antiGrav: function(target) {
      target.force.y -= 0.0011 * target.mass;
    },
    death: function(target) {
      target.death();
    }
  },
  levelAnnounce: function() {
    // let text = "n-gon L" + (game.levelsCleared + 1) + " " + level.levels[level.onLevel];
    let text = "n-gon Level " + (game.levelsCleared + 1);
    document.title = text;
    // text = "Level " + (game.levelsCleared + 1) + ": " + spawn.pickList[0] + "s + " + spawn.pickList[1] + "s";
    // game.makeTextLog(text, 300);

    // text = text + " with population: ";
    // for (let i = 0, len = spawn.pickList.length; i < len; ++i) {
    //     if (spawn.pickList[i] != spawn.pickList[i - 1]) {
    //         text += spawn.pickList[i] + ", ";
    //     }
    // }
    // this.speech(text);
    // game.makeTextLog(text, 360);
  },
  addToWorld: function(mapName) {
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
