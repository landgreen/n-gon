/*  http://brm.io/matter-js/docs/
http://brm.io/matter-js/demo/#mixed
https://github.com/liabru/matter-js/blob/master/demo/js/Demo.js

git hub gist:
https://gist.github.com/lilgreenland/8f2a2c033fdf3d5546a0ca5d73a2ae11

  todo:
can you render bullets a different color? // red?

maybe add the ability to put up shields to survive collisions?
maybe add durability regeneration

fix new mass spawn so that it will pick a new location if the first spawn location already has a mass

 */
function planetesimals() {

    //pause n-gon
    // if (!simulation.isChoosing && input.isPauseKeyReady && m.alive) {
    //     input.isPauseKeyReady = false
    //     setTimeout(function() {
    //         input.isPauseKeyReady = true
    //     }, 300);
    //     if (simulation.paused) {
    //         build.unPauseGrid()
    //         simulation.paused = false;
    //         // level.levelAnnounce();
    //         document.body.style.cursor = "none";
    //         requestAnimationFrame(cycle);
    //     } else {
    //         simulation.paused = true;
    //         build.pauseGrid()
    //         document.body.style.cursor = "auto";

    //         if (tech.isGunSwitchField || simulation.testing) {
    //             document.getElementById("pause-field").addEventListener("click", () => {
    //                 const energy = m.energy
    //                 m.setField((m.fieldMode === m.fieldUpgrades.length - 1) ? 1 : m.fieldMode + 1) //cycle to next field
    //                 m.energy = energy
    //                 document.getElementById("pause-field").innerHTML = `<div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[m.fieldMode].name}</div> ${m.fieldUpgrades[m.fieldMode].description}`
    //             });
    //         }
    //     }
    // }

    "use strict"; //strict mode to catch errors
    //game objects values
    var game = {
        cycle: 0,
        width: 0,
        height: 0,
        scale: 0.5,
        gravity: 0.00011,
        totalMass: 0,
        massSize: 0,
        level: 1,
        startingMassValue: 0,
        massSegment: 0,
        clearThreshold: 0.2, // there must be less than this percent to move on to the next level
        currentMass: 0,
        explodeMin: 8000,
        HUD: true,
    };

    function levelScaling() {
        //game.gravity = 0.00011; // + 0.000012 * game.level;
        game.width = 2000 * game.level; //shapes walls and spawn locations
        game.height = 2000 * game.level; //shapes walls and spawn locations
        game.scale = 1.2 / (Math.log(game.level + 1)); //0.6 + 1.0 / (game.level); //controls map zoom
        game.totalMass = 3 + game.level * 1; //how many masses to spawn at start of level
        game.massSize = 3 + game.level * 3; //adds the average length of a segment on a masses's vertices
        game.massSegment = 0.1 + 0.1 / game.level;
    }

    //looks for key presses and logs them
    var keys = [];
    document.body.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e) {
        keys[e.keyCode] = false;
    });

    // module aliases
    var Engine = Matter.Engine,
        World = Matter.World,
        Events = Matter.Events,
        Composite = Matter.Composite,
        Vertices = Matter.Vertices,
        Body = Matter.Body,
        Bodies = Matter.Bodies;

    // create an engine
    var engine = Engine.create();
    //turn off gravity
    engine.world.gravity.y = 0;
    // run the engine
    // Engine.run(engine);
    Matter.Runner.run(engine)

    function addWalls() {
        //add the walls
        var wallSettings = {
            size: 200,
            isStatic: true,
            render: {
                restitution: 0,
                fillStyle: 'rgba(0, 0, 0, 0.0)',
                strokeStyle: '#00ffff'
            }
        };
        World.add(engine.world, [
            Bodies.rectangle(game.width * 0.5, -wallSettings.size * 0.5, game.width, wallSettings.size, wallSettings), //top
            Bodies.rectangle(game.width * 0.5, game.height + wallSettings.size * 0.5, game.width, wallSettings.size, wallSettings), //bottom
            Bodies.rectangle(-wallSettings.size * 0.5, game.height * 0.5, wallSettings.size, game.height + wallSettings.size * 2, wallSettings), //left
            Bodies.rectangle(game.width + wallSettings.size * 0.5, game.height * 0.5, wallSettings.size, game.height + wallSettings.size * 2, wallSettings) //right
        ]);

    }
    //add the masses
    var mass = [];

    function addPlayer() {
        //add the player object as the first mass in the array
        mass.push();
        //var arrow = Vertices.fromPath('100 0 75 50 100 100 25 100 0 50 25 0');
        var arrow = Vertices.fromPath('0 15 -10 -15 10 -15');
        mass[0] = Matter.Bodies.fromVertices(Math.random() * game.width, Math.random() * game.height, arrow, {
            //density: 0.001,
            alive: true,
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0,
            restitution: 0, //bounce 1 = 100% elastic
            density: 0.003333,
            thrust: 0.0004, //forward acceleration, if mass goes up this needs to go up
            yaw: 0.00133, //angular acceleration, needs to be higher with  larger mass
            rotationLimit: 0.05, //max acceleration for player in radians/cycle
            angularFriction: 0.98, // 1 = no friction,  0.9 = high friction
            durability: 1,
            fireCD: 0,
            lastPlayerVelocity: { //for keeping track of damamge from too much acceleration
                x: 0,
                y: 0
            },
        });
        World.add(engine.world, mass[0]);
    }

    function randomConvexPolygon(size) { //returns a string of vectors that make a convex polygon
        var polyVector = '';
        var x = 0;
        var y = 0;
        var r = 0;
        var angle = 0;
        for (var i = 1; i < 60; i++) {
            angle += 0.1 + Math.random() * game.massSegment; //change in angle in radians
            if (angle > 2 * Math.PI) {
                break; //stop before it becomes convex
            }
            r = 2 + Math.random() * 2;
            x = Math.round(x + r * Math.cos(angle));
            y = Math.round(y + r * Math.sin(angle));
            polyVector = polyVector.concat(x * size + ' ' + y * size + ' ');
        }
        return polyVector;
    }

    function addMassVector(x, y, Vx, Vy, size) {
        var verticies = [];
        var vector = Vertices.fromPath(randomConvexPolygon(size));
        var i = mass.length;
        mass.push();
        mass[i] = Matter.Bodies.fromVertices(x, y, vector, { // x,y,vectors,{options}
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0,
            restitution: 1,
            angle: Math.random() * 2 * Math.PI
        });
        Matter.Body.setVelocity(mass[i], {
            x: Vx,
            y: Vy
        });
        Matter.Body.setAngularVelocity(mass[i], (Math.random() - 0.5) * 0.03);
        World.add(engine.world, mass[i]);
    }

    function addMass(x, y, r, sides, Vx, Vy) {
        var i = mass.length;
        mass.push();
        mass[i] = Bodies.polygon(x, y, sides, r, {
            friction: 0,
            frictionStatic: 0,
            frictionAir: 0,
            restitution: 1,
        });
        Matter.Body.setVelocity(mass[i], {
            x: Vx,
            y: Vy
        });
        Matter.Body.setAngularVelocity(mass[i], (Math.random() - 0.5) * 0.03);
        World.add(engine.world, mass[i]);
    }

    function clearMasses() {
        World.clear(engine.world, false);
        console.log('clear')
        mass = [];
    }

    function spawnSetup() {
        //make the level indicator more clear on a new level
        // document.getElementById("level").innerHTML = 'system ' + game.level;
        // document.getElementById("level").style.color = 'white';
        // document.getElementById("level").style.fontSize = '500%';
        // document.getElementById("level").style.left = '40%';
        // document.getElementById("level").style.position = 'absolute';
        // setTimeout(levelFontSize, 3000);
        //after 3 seconds return to normal style
        // function levelFontSize(size) {
        //     document.getElementById("level").style.color = 'grey';
        //     document.getElementById("level").style.position = '';
        //     document.getElementById("level").style.left = '';
        //     document.getElementById("level").style.fontSize = '100%';
        // }
        levelScaling();
        clearMasses();
        addWalls();
        addPlayer();
        //add  other masses
        for (var j = 0; j < game.totalMass; j++) {
            // addMassVector(x,y,Vx,Vy,size)
            addMassVector(game.width * 0.2 + Math.random() * game.width * 0.6,
                game.height * 0.2 + Math.random() * game.height * 0.6,
                0, //(0.5 - Math.random()) * 4,
                0,
                Math.random() * 3 + game.massSize
            );
        }
        //determine how much mass is in the game at the start
        game.startingMassValue = 0;
        for (var i = 0; i < mass.length; i++) {
            game.startingMassValue += mass[i].mass;
        }
        game.currentMass = game.startingMassValue;
    }

    spawnSetup();

    function repopulateMasses() {
        game.currentMass = 0;
        for (var i = 0; i < mass.length; i++) {
            game.currentMass += mass[i].mass;
        }
        if (game.currentMass < game.startingMassValue * game.clearThreshold) {
            game.level++;
            spawnSetup();
            mass[0].durability = 1;
        }
    }

    var bullet = [];

    function fireBullet() { //addMass(x, y, r, sides, Vx, Vy)
        var i = bullet.length;
        var angle = mass[0].angle + Math.PI * 0.5;
        var speed = 9;
        var playerDist = 25;
        bullet.push();
        bullet[i] = Bodies.polygon(
            mass[0].position.x + playerDist * Math.cos(angle),
            mass[0].position.y + playerDist * Math.sin(angle),
            3, //sides
            2, { //radius
                angle: Math.random() * 6.28,
                friction: 0,
                frictionStatic: 0,
                frictionAir: 0,
                restitution: 1,
                endCycle: game.cycle + 90, // life span for a bullet (60 per second)
            });
        Matter.Body.setVelocity(bullet[i], {
            x: mass[0].velocity.x + speed * Math.cos(angle),
            y: mass[0].velocity.y + speed * Math.sin(angle)
        });
        Matter.Body.setAngularVelocity(bullet[i], (Math.random() - 0.5) * 1);
        World.add(engine.world, bullet[i]);
    }

    function bulletEndCycle() {
        for (var i = 0; i < bullet.length; i++) {
            if (bullet[i].endCycle < game.cycle) {
                Matter.World.remove(engine.world, bullet[i]);
                bullet.splice(i, 1);
            }
        }
    }

    function controls() {
        if (mass[0].alive) {
            if (keys[32] && mass[0].fireCD < game.cycle) {
                mass[0].fireCD = game.cycle + 10; // ?/60 seconds of cooldown before you can fire
                fireBullet();
            }

            if (keys[38] || keys[87]) { //forward thrust
                mass[0].force.x += mass[0].thrust * Math.cos(mass[0].angle + Math.PI * 0.5);
                mass[0].force.y += mass[0].thrust * Math.sin(mass[0].angle + Math.PI * 0.5);
                thrustGraphic();
            } else if (keys[40] || keys[83]) { //reverse thrust
                mass[0].force = {
                    x: -mass[0].thrust * 0.5 * Math.cos(mass[0].angle + Math.PI * 0.5),
                    y: -mass[0].thrust * 0.5 * Math.sin(mass[0].angle + Math.PI * 0.5)
                };
                torqueGraphic(-1);
                torqueGraphic(1);
            }
            //rotate left and right
            if ((keys[37] || keys[65])) { //&& mass[0].angularVelocity > -mass[0].rotationLimit) {
                mass[0].torque = -mass[0].yaw; //counter clockwise
                torqueGraphic(-1);
            } else if ((keys[39] || keys[68])) { //&& mass[0].angularVelocity < mass[0].rotationLimit) {
                mass[0].torque = mass[0].yaw; //clockwise
                torqueGraphic(1);
            }
            //angular friction if spinning too fast
            if (Math.abs(mass[0].angularVelocity) > mass[0].rotationLimit) {
                Matter.Body.setAngularVelocity(mass[0], mass[0].angularVelocity * mass[0].angularFriction);
            }
        }
    }

    function torqueGraphic(dir) { //thrust graphic when holding rotation keys
        ctx.save();
        //ctx.translate(0.5 * canvas.width, 0.5 * canvas.height)
        ctx.rotate(mass[0].angle - Math.PI * 0.6 * dir);
        ctx.translate(0, -23);
        var grd = ctx.createLinearGradient(0, 0, 0, 15);
        grd.addColorStop(0.1, 'rgba(0, 0, 0, 0)');
        grd.addColorStop(1, 'rgba(160, 192, 255, 1)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(dir * 6 * (Math.random() - 0.5) + 12 * dir, 6 * (Math.random() - 0.5));
        ctx.lineTo(dir * 8, 14);
        ctx.lineTo(dir * 12, 14);
        ctx.fill();
        ctx.restore();
    }

    function thrustGraphic() {
        //ctx.fillStyle= "#90b0ff";
        ctx.save();
        //ctx.translate(0.5 * canvas.width, 0.5 * canvas.height)
        ctx.rotate(mass[0].angle);
        ctx.translate(0, -33);
        var grd = ctx.createLinearGradient(0, 0, 0, 15);
        grd.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grd.addColorStop(1, 'rgba(160, 192, 255, 1)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(10 * (Math.random() - 0.5), 10 * (Math.random() - 0.5));
        ctx.lineTo(7, 20);
        ctx.lineTo(-7, 20);
        ctx.fill();
        ctx.restore();
    }

    function gravity() {
        var length = mass.length;
        var Dx = 0;
        var Dy = 0;
        var force = 0;
        var angle = 0;
        var i = 0;
        var j = 0;
        //gravity for array masses, but not player: mass[0]
        for (i = 0; i < length; i++) {
            for (j = 0; j < length; j++) {
                if (i != j) {
                    Dx = mass[j].position.x - mass[i].position.x;
                    Dy = mass[j].position.y - mass[i].position.y;
                    force = game.gravity * mass[j].mass * mass[i].mass / (Math.sqrt(Dx * Dx + Dy * Dy));
                    angle = Math.atan2(Dy, Dx);
                    mass[i].force.x += force * Math.cos(angle);
                    mass[i].force.y += force * Math.sin(angle);
                }
            }
        }
        //gravity for bullets
        var Blength = bullet.length;
        for (i = 0; i < Blength; i++) {
            for (j = 0; j < length; j++) { //bullets only  feel gravity, they don't create it
                Dx = mass[j].position.x - bullet[i].position.x;
                Dy = mass[j].position.y - bullet[i].position.y;
                force = game.gravity * mass[j].mass * bullet[i].mass / (Math.sqrt(Dx * Dx + Dy * Dy));
                angle = Math.atan2(Dy, Dx);
                bullet[i].force.x += force * Math.cos(angle);
                bullet[i].force.y += force * Math.sin(angle);
            }
        }
    }

    function damage() { //changes player health if velocity changes too much
        var limit2 = 9; //square of velocity damamge limit
        var dX = Math.abs(mass[0].lastPlayerVelocity.x - mass[0].velocity.x);
        var dY = Math.abs(mass[0].lastPlayerVelocity.y - mass[0].velocity.y);
        var dV2 = dX * dX + dY * dY; //we are skipping the square root
        if (dV2 > limit2) { //did velocity change enough to take damage
            mass[0].durability -= Math.sqrt(dV2 - limit2) * 0.02; //player takes damage
            if (mass[0].durability < 0 && mass[0].alive) { //player dead?
                mass[0].alive = false;
                //spawn player explosion debris
                for (var j = 0; j < 10; j++) { //addMass(x, y, r, sides, Vx, Vy)
                    addMass(mass[0].position.x + 10 * (0.5 - Math.random()),
                        mass[0].position.y + 10 * (0.5 - Math.random()),
                        5,
                        3,
                        (0.5 - Math.random()) * 8 + mass[0].velocity.x,
                        (0.5 - Math.random()) * 8 + mass[0].velocity.y);
                }
                //shrink player to match debris size
                Matter.Body.scale(mass[0], 0.4, 0.4);
                //reset masses after a few seconds
                window.setTimeout(spawnSetup, 6000);
            }
        }
        //keep track of last player velocity to calculate changes in velocity
        mass[0].lastPlayerVelocity.x = mass[0].velocity.x;
        mass[0].lastPlayerVelocity.y = mass[0].velocity.y;
    }

    //bullet collision event
    Events.on(engine, 'collisionStart', function(event) {

        //slice the polygon up into sections
        function slicePoly(m, start, end) { //cut a mass into two sectons
            //build new string vector array that matches some of the reference mass
            var polyVector = '';
            for (var i = start; i < end; i++) {
                polyVector = polyVector.concat(mass[m].vertices[i].x + ' ' + mass[m].vertices[i].y + ' ');
            }
            //buggy: making polygons noncolide. not sure why
            //if (end = mass[m].vertices.length) { //catch the first vertices if the polygon hits the last
            //  polyVector = polyVector.concat(mass[m].vertices[0].x + ' ' + mass[m].vertices[0].y + ' ');    }
            var verticies = []; //build the polygon in matter.js
            var vector = Vertices.fromPath(polyVector);

            //add string vector array to game as a polygon
            var len = mass.length;
            mass.push();
            mass[len] = Matter.Bodies.fromVertices(0, 0, vector, { // x,y,vectors,{options}
                friction: 0,
                frictionStatic: 0,
                frictionAir: 0,
                restitution: 1
            });
            World.add(engine.world, mass[len]);
            //scale down the polygon a bit to help with collisions
            Matter.Body.scale(mass[len], 0.9, 0.9);
            //move polygon into position
            var vectorPos = Matter.Vertices.centre(vector); //find the center of new polygon
            Matter.Body.translate(mass[len], {
                x: vectorPos.x,
                y: vectorPos.y
            });
            //give a velocity pointed away from the old mass's center so it explodes
            var angle = Math.atan2(mass[len].position.y - mass[m].position.y, mass[len].position.x - mass[m].position.x);
            Matter.Body.setVelocity(mass[len], {
                x: mass[m].velocity.x + 2 * Math.cos(angle),
                y: mass[m].velocity.y + 2 * Math.sin(angle)
            });
            //add some spin
            Matter.Body.setAngularVelocity(mass[len], (Math.random() - 0.5) * 0.1);
        }

        function hit(i, b, m) {
            //match the collisions pair id to the mass
            for (var j = 1; j < mass.length; j++) { //start at 1 to skip the player
                if (mass[j].id === m.id) {
                    //remove bullet
                    Matter.World.remove(engine.world, bullet[i]);
                    bullet.splice(i, 1);

                    // explosion graphics
                    var driftSpeed = 1;
                    var length = mass[j].vertices.length - 1;
                    var dx = (mass[j].vertices[length].x - mass[j].position.x);
                    var dy = (mass[j].vertices[length].y - mass[j].position.y);
                    var r = Math.sqrt(dx * dx + dy * dy) * 1.5; // *1.5 give the explosion outward spread
                    var angle = Math.atan2(dy, dx);
                    boom.push({ //the line form the 1st and last vertex
                        x1: mass[j].vertices[length].x,
                        y1: mass[j].vertices[length].y,
                        x2: mass[j].vertices[0].x,
                        y2: mass[j].vertices[0].y,
                        alpha: 1,
                        driftVx: mass[j].velocity.x + (Math.random() - 0.5) * driftSpeed + r * mass[j].angularSpeed * Math.cos(angle),
                        driftVy: mass[j].velocity.y + (Math.random() - 0.5) * driftSpeed + r * mass[j].angularSpeed * Math.sin(angle),
                    });

                    for (var n = 0; n < length; n++) {
                        dx = (mass[j].vertices[n].x - mass[j].position.x);
                        dy = (mass[j].vertices[n].y - mass[j].position.y);
                        r = Math.sqrt(dx * dx + dy * dy);
                        angle = Math.atan2(dy, dx);
                        boom.push({
                            x1: mass[j].vertices[n].x,
                            y1: mass[j].vertices[n].y,
                            x2: mass[j].vertices[n + 1].x,
                            y2: mass[j].vertices[n + 1].y,
                            alpha: 1,
                            driftVx: mass[j].velocity.x + (Math.random() - 0.5) * driftSpeed + r * mass[j].angularSpeed * Math.cos(angle),
                            driftVy: mass[j].velocity.y + (Math.random() - 0.5) * driftSpeed + r * mass[j].angularSpeed * Math.sin(angle),
                        });
                    }

                    //choose to slice
                    if (mass[j].vertices.length > 13) {
                        var cut = 6 + Math.floor(Math.random() * 4);
                        slicePoly(j, 0, cut);
                        //sliceChoices(mass.length - 1);
                        slicePoly(j, cut - 1, mass[j].vertices.length);
                        //sliceChoices(mass.length - 1);
                        Matter.World.remove(engine.world, mass[j]);
                        mass.splice(j, 1);
                    } else {
                        Matter.World.remove(engine.world, mass[j]);
                        mass.splice(j, 1);

                    }

                    return;
                }
            }
        }
        //check to see if one of the collisison pairs is a bullet
        var pairs = event.pairs;
        for (var i = 0, j = pairs.length; i != j; ++i) {
            var pair = pairs[i];
            for (var k = 0; k < bullet.length; k++) {
                if (pair.bodyA === bullet[k]) {
                    hit(k, pair.bodyA, pair.bodyB);
                    repopulateMasses();
                    break;
                } else if (pair.bodyB === bullet[k]) {
                    hit(k, pair.bodyB, pair.bodyA);
                    repopulateMasses();
                    break;
                }
            }
        }
    });

    var boom = [];

    function explosions() {
        var i = boom.length;
        ctx.lineWidth = 1.5;
        while (i--) {
            ctx.strokeStyle = 'rgba(255, 255, 255, ' + boom[i].alpha + ')';
            //drift vector lines around
            boom[i].x1 += boom[i].driftVx;
            boom[i].y1 += boom[i].driftVy;
            boom[i].x2 += boom[i].driftVx;
            boom[i].y2 += boom[i].driftVy;
            //draw vector lines
            ctx.beginPath();
            ctx.moveTo(boom[i].x1, boom[i].y1);
            ctx.lineTo(boom[i].x2, boom[i].y2);
            ctx.stroke();
            //remove vector lines if they are too old
            boom[i].alpha -= 0.03;
            if (boom[i].alpha < 0.01) {
                boom.splice(i, 1);
            }
        }
    }

    //set up render
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    //make canvas fill window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    window.onresize = function(event) {
        ctx.canvas.width = window.innerWidth;
        ctx.canvas.height = window.innerHeight;
        starsMoveRandom();
    };

    (function cycle() { //render loop
        game.cycle++;
        //ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; //trails simulate a old arcade cathode look
        //ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height); //clear canvas for new cycle
        bulletEndCycle();

        damage();
        gravity();
        //background graphics
        drawStars();

        HUD();
        ctx.save(); //move camera

        ctx.translate(window.innerWidth * 0.5, window.innerHeight * 0.5);
        ctx.scale(game.scale, game.scale);
        controls();
        ctx.translate(-mass[0].position.x, -mass[0].position.y);
        //primary graphics
        render();
        drawVectors();
        explosions();
        ctx.restore(); //undo previous translation
        //foreground graphics
        miniMap();
        completionBar();
        durabilityBar();
        window.requestAnimationFrame(cycle);
    })();

    function render() { //draw all the objects from matter.js physics engine
        var bodies = Composite.allBodies(engine.world); //draw every object
        //fill and stroke each body
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#050505'; //'#111'; //'#0a0606';
        ctx.beginPath();
        for (var i = 0; i < bodies.length; i++) {
            var vertices = bodies[i].vertices;
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (var j = 1; j < vertices.length; j++) {
                ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            ctx.lineTo(vertices[0].x, vertices[0].y);
        }
        ctx.fill();
        ctx.stroke();
    }

    function drawVectors() { //render force and velocity vectors for each mass
        if (game.HUD) {
            var length = mass.length;
            ctx.lineWidth = 1;
            //velocity vector
            //ctx.strokeStyle = 'rgba(0, 255, 255, 1)';
            ctx.strokeStyle = '#00ffff';
            ctx.beginPath();
            for (var i = 0; i < length; i++) {
                ctx.moveTo(mass[i].position.x, mass[i].position.y);
                ctx.lineTo(mass[i].position.x + 10 * mass[i].velocity.x,
                    mass[i].position.y + 10 * mass[i].velocity.y);
            }
            ctx.stroke();
            //force vector
            //ctx.strokeStyle = 'rgba(255, 0, 255, 1)';
            ctx.strokeStyle = '#ff00ff';
            ctx.beginPath();
            for (i = 0; i < length; i++) {
                ctx.moveTo(mass[i].position.x, mass[i].position.y);
                ctx.lineTo(mass[i].position.x + 600000 * mass[i].force.x / mass[i].mass,
                    mass[i].position.y + 600000 * mass[i].force.y / mass[i].mass);
            }
            ctx.stroke();
            //angular motion vector
            /*   ctx.strokeStyle = 'rgba(255, 255, 00, 0.5)';//'#ff00ff';
              ctx.beginPath();
              if (mass[0].angularVelocity>0){
                ctx.arc(mass[0].position.x,mass[0].position.y,20,Math.PI*0.5,53*mass[0].angularVelocity+Math.PI*0.5);
              }else{
                ctx.arc(mass[0].position.x,mass[0].position.y,20,53*mass[0].angularVelocity+Math.PI*0.5,Math.PI*0.5);
              }
              ctx.stroke(); */
        }
    }

    function HUD() { //player data
        //    document.getElementById("level").innerHTML = 'system ' + game.level
        if (game.HUD) { //testing and development data
            document.getElementById("hud").innerHTML = '<table> ' +
                //'<tr> <td>#:</td>    <td>' + mass.length + '</td> </tr>' +
                //'<tr> <td>level: </td>    <td>' + game.level + '</td> </tr>' +
                '<tr> <td>&nbsp;t:</td>    <td>' + engine.timing.timestamp.toFixed(0) + '</td> </tr>' +
                '<tr> <td style="color:#77f;">&nbsp;m:</td>    <td>' + mass[0].mass.toFixed(2) + '</td> </tr>' +
                '<tr> <td style="color:#77f;">&nbsp;θ:</td>    <td>' + (Math.abs(mass[0].angle % (Math.PI * 2))).toFixed(2) + '</td> </tr>' +
                '<tr> <td style="color:#77f;">dθ:</td>   <td>' + mass[0].angularVelocity.toFixed(3) + '</td> </tr>' +
                '<tr> <td style="color:#77f;">&nbsp;x:</td>    <td>' + mass[0].position.x.toFixed(0) + '</td> </tr>' +
                '<tr> <td style="color:#77f;">&nbsp;y:</td>    <td>' + mass[0].position.y.toFixed(0) + '</td> </tr>' +
                '<tr> <td style="color:#0dd;">Vx:</td>   <td>' + mass[0].velocity.x.toFixed(2) + '</td> </tr>' +
                '<tr> <td style="color:#0dd;">Vy:</td>   <td>' + mass[0].velocity.y.toFixed(2) + '</td> </tr>' +
                '<tr> <td style="color:#d0d;">Fx:</td>   <td>' + mass[0].force.x.toFixed(6) + '</td> </tr>' +
                '<tr> <td style="color:#d0d;">Fy:</td>   <td>' + mass[0].force.y.toFixed(6) + '</td> </tr>' + '</table>';
        } else {
            document.getElementById("hud").innerHTML = "";
        }
    }

    function durabilityBar() { // player health bar
        var size = 200;
        var x = 6;
        var y = 6;
        //ctx.lineWidth = 2;
        //ctx.strokeStyle = '#999';
        //ctx.strokeRect(x - 1, y - 1, size + 2, 12); //draw outline
        //ctx.fillStyle = '#512';
        ctx.fillStyle = 'rgba(255, 85, 119, 0.3)'
        ctx.fillRect(x, y, size, 10); //draw bar
        if (mass[0].alive) { //only draw bar if player is alive
            ctx.fillStyle = 'rgba(255, 85, 119, 0.9)'
            ctx.fillRect(x, y, size * mass[0].durability, 10); //draw bar
        }
    }

    function completionBar() {
        var size = 152;
        var x = canvas.width - size - 4;
        var y = 5;

        //ctx.fillStyle = '#000007';
        //ctx.fillRect(x, y, size, 5); //draw bar
        ctx.fillStyle = 'rgba(85, 85, 170, 0.3)'
        //ctx.fillStyle = '#55a';
        ctx.fillRect(x, y, size, 5); //draw bar
        //ctx.fillStyle = '#55a';
        ctx.fillStyle = 'rgba(85, 85, 170, 0.9)'
        ctx.fillRect(x, y, size * game.currentMass / game.startingMassValue, 5); //draw bar
        //goal line
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(x + size * game.clearThreshold, y, 1, 5); //draw bar
        //outline of bar
        //ctx.lineWidth = 1;
        //ctx.strokeStyle = '#88f';
        //ctx.strokeRect(x, y, size, 5); //draw outline
    }

    function miniMap() {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#88f';
        ctx.beginPath();
        var xOff = canvas.width - 5;
        var yOff = 10;
        var size = 150;
        var scale = size / game.width;
        ctx.fillStyle = 'rgba(0, 0, 50, 0.5)'
        ctx.rect(xOff, yOff, -size, size);
        ctx.stroke();
        ctx.fill();
        //draw dot for masses
        ctx.fillStyle = '#aaf';
        for (var i = 1; i < mass.length; i++) {
            ctx.fillRect(mass[i].position.x * scale + xOff - size, mass[i].position.y * scale + yOff, 3, 3);
        }
        //draw player's dot
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(mass[0].position.x * scale + xOff - size, mass[0].position.y * scale + yOff, 5, 5);
    }

    var star = [];
    var totalStars = 100;
    for (var i = 0; i < totalStars; i++) {
        star.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
        });
    }

    function starsMoveRandom() {
        for (var i = 0; i < totalStars; i++) {
            star[i].x = Math.random() * window.innerWidth;
            star[i].y = Math.random() * window.innerHeight;
        }
    }

    function drawStars() {
        ctx.fillStyle = '#ffffff'; //'darkgrey'; //'rgba(255, 255, 255, 0.5)'
        var parallax = 1;
        var Vx = mass[0].velocity.x * game.scale;
        var Vy = mass[0].velocity.y * game.scale;
        var width = window.innerWidth;
        var height = window.innerHeight;
        for (var i = 0; i < totalStars; i++) {
            star[i].x -= Vx;
            star[i].y -= Vy;
            ctx.fillRect(star[i].x, star[i].y, 1, 1);
            if (star[i].x < 0) {
                star[i].x = width;
                star[i].y = Math.random() * height;
            }
            if (star[i].x > width) {
                star[i].x = 0;
                star[i].y = Math.random() * height;
            }
            if (star[i].y < 0) {
                star[i].y = height;
                star[i].x = Math.random() * width;
            }
            if (star[i].y > height) {
                star[i].y = 0;
                star[i].x = Math.random() * width;
            }
        }
    }
}