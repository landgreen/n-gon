//global player variables
let player, jumpSensor, playerBody, playerHead, headSensor;

// player Object Prototype *********************************************
mech = {

}

const mech = {
    spawn: function () {
        //player as a series of vertices
        let vector = Vertices.fromPath('0 40  0 115  20 130  30 130  50 115  50 40');
        playerBody = Matter.Bodies.fromVertices(0, 0, vector);
        //this sensor check if the player is on the ground to enable jumping
        jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
            sleepThreshold: 99999999999,
            isSensor: true,
        });
        //this part of the player lowers on crouch
        vector = Vertices.fromPath('0 -66 18 -82  0 -37 50 -37 50 -66 32 -82');
        playerHead = Matter.Bodies.fromVertices(0, -55, vector);
        //a part of player that senses if the player's head is empty and can return after crouching
        headSensor = Bodies.rectangle(0, -57, 48, 45, {
            sleepThreshold: 99999999999,
            isSensor: true,
        });
        player = Body.create({ //combine jumpSensor and playerBody
            parts: [playerBody, playerHead, jumpSensor, headSensor],
            inertia: Infinity, //prevents player rotation
            friction: 0.002,
            //frictionStatic: 0.5,
            restitution: 0.3,
            sleepThreshold: Infinity,
            collisionFilter: {
                group: 0,
                category: 0x001000,
                mask: 0x010001
            },
        });
        //Matter.Body.setPosition(player, mech.spawnPos);
        //Matter.Body.setVelocity(player, mech.spawnVel);
        Matter.Body.setMass(player, mech.mass);
        World.add(engine.world, [player]);
        //holding body constraint
        const holdConstraint = Constraint.create({
            pointA: {
                x: 0,
                y: 0
            },
            //setting constaint to jump sensor because it has to be on something until the player picks up things
            bodyB: jumpSensor,
            stiffness: 0.4,
        });
        World.add(engine.world, holdConstraint);
    },
    width: 50,
    radius: 30,
    fillColor: '#fff',
    fillColorDark: '#ddd',
    fireCDcycle: 0,
    gun: 'machine', //current gun in use
    gunOptions: { //keeps track of keys that switch guns (used in the onkeypress event)
        49: 'machine',
        50: 'needle',
        51: 'shot',
        52: 'rail',
        53: 'cannon',
        54: 'super',
        55: 'lob',
        // 55: 'spiritBomb',
        // 56: 'experimental'
    }
    height: 42,
    yOffWhen: {
        crouch: 22,
        stand: 49,
        jump: 70
    },
    yOff: 70,
    yOffGoal: 70,
    onGround: false, //checks if on ground or in air
    onBody: {
        id: 0,
        index: 0,
        type: "map",
        action: ''
    },
    numTouching = 0,
    crouch = false,
    isHeadClear = true,
    spawnPos = {
        x: 0,
        y: 0
    },
    spawnVel = {
        x: 0,
        y: 0
    },
    pos = {
        x: this.spawnPos.x,
        y: this.spawnPos.y
    },
    setPosToSpawn = function (xPos, yPos) {
        this.spawnPos.x = xPos
        this.spawnPos.y = yPos
        this.pos.x = xPos;
        this.pos.y = yPos;
        this.Vx = this.spawnVel.x;
        this.Vy = this.spawnVel.y;
        Matter.Body.setPosition(player, this.spawnPos);
        Matter.Body.setVelocity(player, this.spawnVel);
    };
    this.Sy = this.pos.y; //adds a smoothing effect to vertical only
    this.Vx = 0;
    this.Vy = 0;
    this.VxMax = 7;
    this.mass = 5;
    this.Fx = 0.004 * this.mass; //run Force on ground
    this.FxAir = 0.0006 * this.mass; //run Force in Air
    this.Fy = -0.05 * this.mass; //jump Force
    this.angle = 0;
    this.walk_cycle = 0;
    this.stepSize = 0;
    this.flipLegs = -1;
    this.hip = {
        x: 12,
        y: 24,
    };
    this.knee = {
        x: 0,
        y: 0,
        x2: 0,
        y2: 0
    };
    this.foot = {
        x: 0,
        y: 0
    };
    this.legLength1 = 55;
    this.legLength2 = 45;
    this.canvasX = canvas.width / 2;
    this.canvasY = canvas.height / 2;
    this.transX = this.canvasX - this.pos.x;
    this.transY = this.canvasX - this.pos.x;
    this.mouse = {
        x: canvas.width / 3,
        y: canvas.height
    };
    this.getMousePos = function (x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    };
    this.testingMoveLook = function () {
        //move
        this.pos.x = player.position.x;
        this.pos.y = playerBody.position.y - this.yOff;
        this.Vx = player.velocity.x;
        this.Vy = player.velocity.y;
        //look
        this.canvasX = canvas.width / 2
        this.canvasY = canvas.height / 2
        this.transX = this.canvasX - this.pos.x;
        this.transY = this.canvasY - this.pos.y;
        this.angle = Math.atan2(this.mouse.y - this.canvasY, this.mouse.x - this.canvasX);
    }

    this.move = function () {
        this.pos.x = player.position.x;
        this.pos.y = playerBody.position.y - this.yOff;
        this.Vx = player.velocity.x;
        this.Vy = player.velocity.y;
    };
    this.look = function () {
        //set a max on mouse look
        let mX = this.mouse.x;
        if (mX > canvas.width * 0.8) {
            mX = canvas.width * 0.8;
        } else if (mX < canvas.width * 0.2) {
            mX = canvas.width * 0.2;
        }
        let mY = this.mouse.y;
        if (mY > canvas.height * 0.8) {
            mY = canvas.height * 0.8;
        } else if (mY < canvas.height * 0.2) {
            mY = canvas.height * 0.2;
        }
        //set mouse look
        this.canvasX = this.canvasX * 0.94 + (canvas.width - mX) * 0.06;
        this.canvasY = this.canvasY * 0.94 + (canvas.height - mY) * 0.06;

        //set translate values
        this.transX = this.canvasX - this.pos.x;
        this.Sy = 0.99 * this.Sy + 0.01 * (this.pos.y);
        //hard caps how behind y position tracking can get.
        if (this.Sy - this.pos.y > canvas.height / 2) {
            this.Sy = this.pos.y + canvas.height / 2;
        } else if (this.Sy - this.pos.y < -canvas.height / 2) {
            this.Sy = this.pos.y - canvas.height / 2;
        }
        this.transY = this.canvasY - this.Sy; //gradual y camera tracking
        //this.transY = this.canvasY - this.pos.y;  //normal y camera tracking

        //make player head angled towards mouse
        //this.angle = Math.atan2(this.mouse.y - this.canvasY, this.mouse.x - this.canvasX);
        this.angle = Math.atan2(this.mouse.y + (this.Sy - this.pos.y) * game.zoom - this.canvasY, this.mouse.x - this.canvasX);
    };
    this.doCrouch = function () {
        if (!this.crouch) {
            this.crouch = true;
            this.yOffGoal = this.yOffWhen.crouch;
            Matter.Body.translate(playerHead, {
                x: 0,
                y: 40
            })
        }
    }
    this.undoCrouch = function () {
        this.crouch = false;
        this.yOffGoal = this.yOffWhen.stand;
        Matter.Body.translate(playerHead, {
            x: 0,
            y: -40
        })
    }
    this.enterAir = function () {
        this.onGround = false;
        player.frictionAir = 0.001;
        if (this.isHeadClear) {
            if (this.crouch) {
                this.undoCrouch();
            }
            this.yOffGoal = this.yOffWhen.jump;
        };
    }
    this.enterLand = function () {
        this.onGround = true;
        if (this.crouch) {
            if (this.isHeadClear) {
                this.undoCrouch();
                player.frictionAir = 0.12;
            } else {
                this.yOffGoal = this.yOffWhen.crouch;
                player.frictionAir = 0.5;
            }
        } else {
            this.yOffGoal = this.yOffWhen.stand;
            player.frictionAir = 0.12;
        }
    };
    this.buttonCD_jump = 0; //cooldown for player buttons
    this.keyMove = function () {
        if (this.onGround) { //on ground **********************
            if (this.crouch) { //crouch
                if (!(keys[40] || keys[83]) && this.isHeadClear) { //not pressing crouch anymore
                    this.undoCrouch();
                    player.frictionAir = 0.12;
                }
            } else if (keys[40] || keys[83]) { //on ground && not crouched and pressing s or down
                this.doCrouch();
                player.frictionAir = 0.5;
            } else if ((keys[32] || keys[38] || keys[87]) && this.buttonCD_jump + 20 < game.cycle) { //jump
                this.buttonCD_jump = game.cycle; //can't jump until 20 cycles pass
                Matter.Body.setVelocity(player, { //zero player velocity for consistant jumps
                    x: player.velocity.x,
                    y: 0
                });
                player.force.y = this.Fy / game.delta; //jump force / delta so that force is the same on game slowdowns
            }
            //horizontal move on ground
            if (keys[37] || keys[65]) { //left or a
                if (player.velocity.x > -this.VxMax) {
                    player.force.x += -this.Fx / game.delta;
                }
            } else if (keys[39] || keys[68]) { //right or d
                if (player.velocity.x < this.VxMax) {
                    player.force.x += this.Fx / game.delta;
                }
            }

        } else { // in air **********************************
            //check for short jumps
            if (this.buttonCD_jump + 60 > game.cycle && //just pressed jump
                !(keys[32] || keys[38] || keys[87]) && //but not pressing jump key
                this.Vy < 0) { // and velocity is up
                Matter.Body.setVelocity(player, { //reduce player velocity every cycle until not true
                    x: player.velocity.x,
                    y: player.velocity.y * 0.94
                });
            }
            if (keys[37] || keys[65]) { // move player   left / a
                if (player.velocity.x > -this.VxMax + 2) {
                    player.force.x += -this.FxAir / game.delta;
                }
            } else if (keys[39] || keys[68]) { //move player  right / d
                if (player.velocity.x < this.VxMax - 2) {
                    player.force.x += this.FxAir / game.delta;
                }
            }
        }
        //smoothly move height towards height goal ************
        this.yOff = this.yOff * 0.85 + this.yOffGoal * 0.15
    };
    this.death = function () {
        location.reload();
        //Matter.Body.setPosition(player, this.spawnPos);
        //Matter.Body.setVelocity(player, this.spawnVel);
        //this.dropBody();
        //game.zoom = 0;    //zooms out all the way
        //this.health = 1;
    }
    this.health = 1;
    this.regen = function () {
        if (this.health < 1 && game.cycle % 15 === 0) {
            this.addHealth(0.01);
        }
    };
    this.drawHealth = function () {
        if (this.health < 1) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, 60, 10);
            ctx.fillStyle = "#f00";
            ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, 60 * this.health, 10);
        }
    };
    this.addHealth = function (heal) {
        this.health += heal;
        if (this.health > 1) this.health = 1;
    }
    this.damage = function (dmg) {
        this.health -= dmg;
        if (this.health <= 0) {
            this.death();
        }
    }
    this.deathCheck = function () {
        if (this.pos.y > game.fallHeight) { // if player is 4000px deep reset to spawn Position and Velocity
            this.death();
        }
    };
    this.hitMob = function (i, dmg) {
        this.damage(dmg);
        playSound("dmg" + Math.floor(Math.random() * 4));
        //extra kick between player and mob
        //this section would be better with forces but they don't work...
        let angle = Math.atan2(player.position.y - mob[i].position.y, player.position.x - mob[i].position.x);
        Matter.Body.setVelocity(player, {
            x: player.velocity.x + 8 * Math.cos(angle),
            y: player.velocity.y + 8 * Math.sin(angle)
        });
        Matter.Body.setVelocity(mob[i], {
            x: mob[i].velocity.x - 8 * Math.cos(angle),
            y: mob[i].velocity.y - 8 * Math.sin(angle)
        });
    }

    this.buttonCD = 0; //cooldown for player buttons
    this.eaten = [];
    this.eat = function () {
        if (keys[81] && this.buttonCD < game.cycle) {
            this.buttonCD = game.cycle + 5;
            this.findClosestBody();
            let i = this.closest.index
            if (this.closest.dist < 150) {
                //draw eating
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#5f9';
                ctx.beginPath();
                ctx.moveTo(this.pos.x + 15 * Math.cos(this.angle), this.pos.y + 15 * Math.sin(this.angle));
                ctx.lineTo(body[i].position.x, body[i].position.y);
                ctx.stroke();
                //set to eaten
                body[i].eaten = true;
                //drop body
                body[i].frictionAir = 0;
                this.isHolding = false;
                holdConstraint.bodyB = jumpSensor; //set on sensor to get the constraint on somethign else
                //add to eaten
                body[i].collisionFilter.category = 0x000000;
                body[i].collisionFilter.mask = 0x000000;
                //Matter.Body.setStatic(body[i], true)
                Matter.Sleeping.set(body[i], true)
                Matter.Body.scale(body[i], 0.5, 0.5)
                Matter.Body.setVelocity(body[i], {
                    x: 0,
                    y: 0
                });
                Matter.Body.setAngularVelocity(body[i], 0.08) //(Math.random()*0.5-1)*0.1)
                //Matter.World.remove(engine.world, body[i]);
                //body.splice(i, 1);
                this.eaten[this.eaten.length] = {
                    index: i,
                    cycle: game.cycle
                }
            }
        }
        //control behavior of eaten bodies
        for (let j = 0; j < this.eaten.length; j++) {
            const pos = {
                x: this.pos.x + 60 * Math.cos((game.cycle + this.eaten[j].cycle) * 0.05),
                y: this.pos.y + 30 * Math.sin((game.cycle + this.eaten[j].cycle) * 0.05),
            }
            Matter.Body.setPosition(body[this.eaten[j].index], pos);
            //Matter.Body.setVelocity(body[this.eaten[j].index],{x:0, y:0});

        }

        if (keys[69] && this.buttonCD < game.cycle && this.eaten.length) {
            this.buttonCD = game.cycle + 5;
            let i = this.eaten[this.eaten.length - 1].index;
            body[i].eaten = false;
            body[i].collisionFilter.category = 0x000001;
            body[i].collisionFilter.mask = 0x000101;
            Matter.Body.setVelocity(body[i], {
                x: 0,
                y: 0
            });
            //Matter.Body.setStatic(body[i], false)
            Matter.Sleeping.set(body[i], false)
            Matter.Body.scale(body[i], 2, 2);
            Matter.Body.setPosition(body[i], {
                x: this.pos.x + 20 * Math.cos(this.angle),
                y: this.pos.y + 20 * Math.sin(this.angle)
            });
            const impulse = 0.06 * body[i].mass;
            const f = {
                x: impulse * Math.cos(this.angle) / game.delta,
                y: impulse * Math.sin(this.angle) / game.delta
            }
            body[i].force = f;
            this.eaten.pop();
        }
    };

    this.holdKeyDown = 0;
    this.keyHold = function () { //checks for holding/dropping/picking up bodies
        if (this.isHolding) {
            //give the constaint more length and less stiffness if it is pulled out of position
            const Dx = body[this.holdingBody].position.x - holdConstraint.pointA.x;
            const Dy = body[this.holdingBody].position.y - holdConstraint.pointA.y;
            holdConstraint.length = Math.sqrt(Dx * Dx + Dy * Dy) * 0.95;
            holdConstraint.stiffness = -0.01 * holdConstraint.length + 1;
            if (holdConstraint.length > 90) this.dropBody(); //drop it if the constraint gets too long
            holdConstraint.pointA = { //set constraint position
                x: this.pos.x + 50 * Math.cos(this.angle), //just in front of player nose
                y: this.pos.y + 50 * Math.sin(this.angle)
            };
            if (keys[81]) { // q = rotate the body
                body[this.holdingBody].torque = 0.05 * body[this.holdingBody].mass;
            }
            //look for dropping held body
            if (this.buttonCD < game.cycle) {
                if (keys[69]) { //if holding e drops
                    this.holdKeyDown++;
                } else if (this.holdKeyDown && !keys[69]) {
                    this.dropBody(); //if you hold down e long enough the body is thrown
                    this.throwBody();
                }
            }
        } else if (keys[69]) { //when not holding  e = pick up body
            this.findClosestBody();
            if (this.closest.dist < 150) { //pick up if distance closer then 100*100
                this.isHolding = true;
                this.holdKeyDown = 0;
                this.buttonCD = game.cycle + 20;
                this.holdingBody = this.closest.index; //set new body to be the holdingBody
                //body[this.closest.index].isSensor = true; //sensor seems a bit inconsistant
                //body[this.holdingBody].collisionFilter.group = -2; //don't collide with player
                body[mech.holdingBody].collisionFilter.category = 0x000001;
                body[mech.holdingBody].collisionFilter.mask = 0x000001;
                body[this.holdingBody].frictionAir = 0.1; //makes the holding body less jittery
                holdConstraint.bodyB = body[this.holdingBody];
                holdConstraint.length = 0;
                holdConstraint.pointA = {
                    x: this.pos.x + 50 * Math.cos(this.angle),
                    y: this.pos.y + 50 * Math.sin(this.angle)
                };
            }
        }
    };
    this.dropBody = function () {
        let timer; //reset player collision
        function resetPlayerCollision() {
            timer = setTimeout(function () {
                const dx = mech.pos.x - body[mech.holdingBody].position.x
                const dy = mech.pos.y - body[mech.holdingBody].position.y
                if (dx * dx + dy * dy > 15000) {
                    body[mech.holdingBody].collisionFilter.category = 0x000001;
                    body[mech.holdingBody].collisionFilter.mask = 0x001101;
                    //body[mech.holdingBody].collisionFilter.group = 2; //can collide with player
                } else {
                    resetPlayerCollision();
                }
            }, 100);
        }
        resetPlayerCollision();
        this.isHolding = false;
        body[this.holdingBody].frictionAir = 0.01;
        holdConstraint.bodyB = jumpSensor; //set on sensor to get the constaint on somethign else
    };
    this.throwMax = 150;
    this.throwBody = function () {
        let throwMag = 0;
        if (this.holdKeyDown > 20) {
            if (this.holdKeyDown > this.throwMax) this.holdKeyDown = this.throwMax;
            //scale fire with mass and with holdKeyDown time
            throwMag = body[this.holdingBody].mass * this.holdKeyDown * 0.001;
        }
        body[this.holdingBody].force.x = throwMag * Math.cos(this.angle);
        body[this.holdingBody].force.y = throwMag * Math.sin(this.angle);
    };
    this.isHolding = false;
    this.holdingBody = 0;
    this.closest = {
        dist: 1000,
        index: 0
    };
    this.lookingAtMob = function (mob, threshold) {
        //calculate a vector from mob to player and make it length 1
        const diff = Matter.Vector.normalise(Matter.Vector.sub(mob.position, player.position));
        const dir = { //make a vector for the player's direction of length 1
            x: Math.cos(mech.angle),
            y: Math.sin(mech.angle)
        }
        //the dot prodcut of diff and dir will return how much over lap between the vectors
        const dot = Matter.Vector.dot(dir, diff);
        if (dot > threshold) {
            return true;
        } else {
            return false;
        }
    }
    this.lookingAt = function (i) {
        //calculate a vector from mob to player and make it length 1
        const diff = Matter.Vector.normalise(Matter.Vector.sub(body[i].position, player.position));
        const dir = { //make a vector for the player's direction of length 1
            x: Math.cos(mech.angle),
            y: Math.sin(mech.angle)
        }
        //the dot prodcut of diff and dir will return how much over lap between the vectors
        const dot = Matter.Vector.dot(dir, diff);
        //console.log(dot);
        if (dot > 0.9) {
            return true;
        } else {
            return false;
        }
    }
    this.findClosestBody = function () {
        let mag = 100000;
        let index = 0;
        for (let i = 0; i < body.length; i++) {
            let isLooking = this.lookingAt(i);
            let collisionM = Matter.Query.ray(map, body[i].position, this.pos)
            //let collisionB = Matter.Query.ray(body, body[i].position, this.pos)
            if (collisionM.length) isLooking = false;
            //magnitude of the distance between the poistion vectors of player and each body
            const dist = Matter.Vector.magnitude(Matter.Vector.sub(body[i].position, this.pos));
            if (dist < mag && body[i].mass < player.mass && isLooking && !body[i].eaten) {
                mag = dist;
                index = i;
            }
        }
        this.closest.dist = mag;
        this.closest.index = index;
    };
    this.exit = function () {
        game.nextLevel();
        window.location.reload(false);
    }
    this.standingOnActions = function () {
        if (this.onBody.type === 'map') {
            var that = this; //brings the thisness of the player deeper into the actions object
            var actions = {
                'death': function () {
                    that.death();
                },
                'exit': function () {
                    that.exit();
                },
                'slow': function () {
                    Matter.Body.setVelocity(player, { //reduce player velocity every cycle until not true
                        x: player.velocity.x * 0.5,
                        y: player.velocity.y * 0.5
                    });
                },
                'launch': function () {
                    //that.dropBody();
                    Matter.Body.setVelocity(player, { //zero player velocity for consistant jumps
                        x: player.velocity.x,
                        y: 0
                    });
                    player.force.y = -0.1 * that.mass / game.delta;
                },
                'default': function () {}
            };
            (actions[map[this.onBody.index].action] || actions['default'])();
        }
    }
    this.drawLeg = function (stroke) {
        ctx.save();
        ctx.scale(this.flipLegs, 1); //leg lines
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(this.hip.x, this.hip.y);
        ctx.lineTo(this.knee.x, this.knee.y);
        ctx.lineTo(this.foot.x, this.foot.y);
        ctx.stroke();
        //toe lines
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.foot.x, this.foot.y);
        ctx.lineTo(this.foot.x - 15, this.foot.y + 5);
        ctx.moveTo(this.foot.x, this.foot.y);
        ctx.lineTo(this.foot.x + 15, this.foot.y + 5);
        ctx.stroke();
        //hip joint
        ctx.strokeStyle = '#333';
        ctx.fillStyle = this.fillColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.hip.x, this.hip.y, 11, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        //knee joint
        ctx.beginPath();
        ctx.arc(this.knee.x, this.knee.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        //foot joint
        ctx.beginPath();
        ctx.arc(this.foot.x, this.foot.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };
    this.calcLeg = function (cycle_offset, offset) {
        this.hip.x = 12 + offset;
        this.hip.y = 24 + offset;
        //stepSize goes to zero if Vx is zero or not on ground (make this transition cleaner)
        this.stepSize = 0.9 * this.stepSize + 0.1 * (8 * Math.sqrt(Math.abs(this.Vx)) * this.onGround);
        //changes to stepsize are smoothed by adding only a percent of the new value each cycle
        const stepAngle = 0.037 * this.walk_cycle + cycle_offset;
        this.foot.x = 2 * this.stepSize * Math.cos(stepAngle) + offset;
        this.foot.y = offset + this.stepSize * Math.sin(stepAngle) + this.yOff + this.height;
        const Ymax = this.yOff + this.height;
        if (this.foot.y > Ymax) this.foot.y = Ymax;

        //calculate knee position as intersection of circle from hip and foot
        const d = Math.sqrt((this.hip.x - this.foot.x) * (this.hip.x - this.foot.x) +
            (this.hip.y - this.foot.y) * (this.hip.y - this.foot.y));
        const l = (this.legLength1 * this.legLength1 - this.legLength2 * this.legLength2 + d * d) / (2 * d);
        const h = Math.sqrt(this.legLength1 * this.legLength1 - l * l);
        this.knee.x = l / d * (this.foot.x - this.hip.x) - h / d * (this.foot.y - this.hip.y) + this.hip.x + offset;
        this.knee.y = l / d * (this.foot.y - this.hip.y) + h / d * (this.foot.x - this.hip.x) + this.hip.y;
    };
    this.draw = function () {
        ctx.fillStyle = this.fillColor;
        if (this.mouse.x > canvas.width / 2) {
            this.flipLegs = 1;
        } else {
            this.flipLegs = -1;
        }
        this.walk_cycle += this.flipLegs * this.Vx;

        //draw body
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        this.calcLeg(Math.PI, -3);
        this.drawLeg('#444');
        this.calcLeg(0, 0);
        this.drawLeg('#333');
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        //ctx.fillStyle = this.fillColor;
        let grd = ctx.createLinearGradient(-30, 0, 30, 0);
        grd.addColorStop(0, this.fillColorDark);
        grd.addColorStop(1, this.fillColor);
        ctx.fillStyle = grd;
        ctx.beginPath();
        //ctx.moveTo(0, 0);
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.arc(15, 0, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        //draw holding graphics
        if (this.isHolding) {
            if (this.holdKeyDown > 20) {
                if (this.holdKeyDown > this.throwMax) {
                    ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
                } else {
                    ctx.strokeStyle = 'rgba(255, 0, 255, ' + (0.2 + 0.4 * this.holdKeyDown / this.throwMax) + ')';
                }
            } else {
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            }
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(holdConstraint.bodyB.position.x + Math.random() * 2,
                holdConstraint.bodyB.position.y + Math.random() * 2);
            ctx.lineTo(this.pos.x + 15 * Math.cos(this.angle), this.pos.y + 15 * Math.sin(this.angle));
            //ctx.lineTo(holdConstraint.pointA.x,holdConstraint.pointA.y);
            ctx.stroke();
        }
    };
};




//global player variables
let player, jumpSensor, playerBody, playerHead, headSensor;

// player Object Prototype *********************************************
const mechProto = function () {
    this.spawn = function () {
        //player as a series of vertices
        let vector = Vertices.fromPath('0 40  0 115  20 130  30 130  50 115  50 40');
        playerBody = Matter.Bodies.fromVertices(0, 0, vector);
        //this sensor check if the player is on the ground to enable jumping
        jumpSensor = Bodies.rectangle(0, 46, 36, 6, {
            sleepThreshold: 99999999999,
            isSensor: true,
        });
        //this part of the player lowers on crouch
        vector = Vertices.fromPath('0 -66 18 -82  0 -37 50 -37 50 -66 32 -82');
        playerHead = Matter.Bodies.fromVertices(0, -55, vector);
        //a part of player that senses if the player's head is empty and can return after crouching
        headSensor = Bodies.rectangle(0, -57, 48, 45, {
            sleepThreshold: 99999999999,
            isSensor: true,
        });
        player = Body.create({ //combine jumpSensor and playerBody
            parts: [playerBody, playerHead, jumpSensor, headSensor],
            inertia: Infinity, //prevents player rotation
            friction: 0.002,
            //frictionStatic: 0.5,
            restitution: 0.3,
            sleepThreshold: Infinity,
            collisionFilter: {
                group: 0,
                category: 0x001000,
                mask: 0x010001
            },
        });
        //Matter.Body.setPosition(player, mech.spawnPos);
        //Matter.Body.setVelocity(player, mech.spawnVel);
        Matter.Body.setMass(player, mech.mass);
        World.add(engine.world, [player]);
        //holding body constraint
        const holdConstraint = Constraint.create({
            pointA: {
                x: 0,
                y: 0
            },
            //setting constaint to jump sensor because it has to be on something until the player picks up things
            bodyB: jumpSensor,
            stiffness: 0.4,
        });
        World.add(engine.world, holdConstraint);
    };
    this.width = 50;
    this.radius = 30;
    this.fillColor = '#fff';
    this.fillColorDark = '#ddd';
    // const hue = '353';
    // const sat = '100';
    // const lit = '90';
    // this.fillColor = 'hsl('+hue+','+sat+'%,'+lit+'%)';
    // this.fillColorDark = 'hsl('+hue+','+(sat-10)+'%,'+(lit-10)+'%)';
    // this.guns = {
    // 	machine: {
    // 		key: 49,
    // 		ammo: infinite,
    // 		isActive: true,
    // 		isAvailable: true,
    // 	},
    // 	needle: {
    // 		key: 50,
    // 		ammo: 10,
    // 		isActive: false,
    // 		isAvailable: true,
    // 	},
    // 	shot: {
    // 		key: 51,
    // 		ammo: 10,
    // 		isActive: false,
    // 		isAvailable: true,
    // 	}
    // }
    this.fireCDcycle = 0;
    this.gun = 'machine'; //current gun in use
    this.gunOptions = { //keeps track of keys that switch guns (used in the onkeypress event)
        49: 'machine',
        50: 'needle',
        51: 'shot',
        52: 'rail',
        53: 'cannon',
        54: 'super',
        55: 'lob',
        // 55: 'spiritBomb',
        // 56: 'experimental'
    }
    this.height = 42;
    this.yOffWhen = {
        crouch: 22,
        stand: 49,
        jump: 70
    }
    this.yOff = 70;
    this.yOffGoal = 70;
    this.onGround = false; //checks if on ground or in air
    this.onBody = {
        id: 0,
        index: 0,
        type: "map",
        action: ''
    };
    this.numTouching = 0;
    this.crouch = false;
    this.isHeadClear = true;
    this.spawnPos = {
        x: 0,
        y: 0
    };
    this.spawnVel = {
        x: 0,
        y: 0
    };
    this.pos = {
        x: this.spawnPos.x,
        y: this.spawnPos.y
    };
    this.setPosToSpawn = function (xPos, yPos) {
        this.spawnPos.x = xPos
        this.spawnPos.y = yPos
        this.pos.x = xPos;
        this.pos.y = yPos;
        this.Vx = this.spawnVel.x;
        this.Vy = this.spawnVel.y;
        Matter.Body.setPosition(player, this.spawnPos);
        Matter.Body.setVelocity(player, this.spawnVel);
    };
    this.Sy = this.pos.y; //adds a smoothing effect to vertical only
    this.Vx = 0;
    this.Vy = 0;
    this.VxMax = 7;
    this.mass = 5;
    this.Fx = 0.004 * this.mass; //run Force on ground
    this.FxAir = 0.0006 * this.mass; //run Force in Air
    this.Fy = -0.05 * this.mass; //jump Force
    this.angle = 0;
    this.walk_cycle = 0;
    this.stepSize = 0;
    this.flipLegs = -1;
    this.hip = {
        x: 12,
        y: 24,
    };
    this.knee = {
        x: 0,
        y: 0,
        x2: 0,
        y2: 0
    };
    this.foot = {
        x: 0,
        y: 0
    };
    this.legLength1 = 55;
    this.legLength2 = 45;
    this.canvasX = canvas.width / 2;
    this.canvasY = canvas.height / 2;
    this.transX = this.canvasX - this.pos.x;
    this.transY = this.canvasX - this.pos.x;
    this.mouse = {
        x: canvas.width / 3,
        y: canvas.height
    };
    this.getMousePos = function (x, y) {
        this.mouse.x = x;
        this.mouse.y = y;
    };
    this.testingMoveLook = function () {
        //move
        this.pos.x = player.position.x;
        this.pos.y = playerBody.position.y - this.yOff;
        this.Vx = player.velocity.x;
        this.Vy = player.velocity.y;
        //look
        this.canvasX = canvas.width / 2
        this.canvasY = canvas.height / 2
        this.transX = this.canvasX - this.pos.x;
        this.transY = this.canvasY - this.pos.y;
        this.angle = Math.atan2(this.mouse.y - this.canvasY, this.mouse.x - this.canvasX);
    }

    this.move = function () {
        this.pos.x = player.position.x;
        this.pos.y = playerBody.position.y - this.yOff;
        this.Vx = player.velocity.x;
        this.Vy = player.velocity.y;
    };
    this.look = function () {
        //set a max on mouse look
        let mX = this.mouse.x;
        if (mX > canvas.width * 0.8) {
            mX = canvas.width * 0.8;
        } else if (mX < canvas.width * 0.2) {
            mX = canvas.width * 0.2;
        }
        let mY = this.mouse.y;
        if (mY > canvas.height * 0.8) {
            mY = canvas.height * 0.8;
        } else if (mY < canvas.height * 0.2) {
            mY = canvas.height * 0.2;
        }
        //set mouse look
        this.canvasX = this.canvasX * 0.94 + (canvas.width - mX) * 0.06;
        this.canvasY = this.canvasY * 0.94 + (canvas.height - mY) * 0.06;

        //set translate values
        this.transX = this.canvasX - this.pos.x;
        this.Sy = 0.99 * this.Sy + 0.01 * (this.pos.y);
        //hard caps how behind y position tracking can get.
        if (this.Sy - this.pos.y > canvas.height / 2) {
            this.Sy = this.pos.y + canvas.height / 2;
        } else if (this.Sy - this.pos.y < -canvas.height / 2) {
            this.Sy = this.pos.y - canvas.height / 2;
        }
        this.transY = this.canvasY - this.Sy; //gradual y camera tracking
        //this.transY = this.canvasY - this.pos.y;  //normal y camera tracking

        //make player head angled towards mouse
        //this.angle = Math.atan2(this.mouse.y - this.canvasY, this.mouse.x - this.canvasX);
        this.angle = Math.atan2(this.mouse.y + (this.Sy - this.pos.y) * game.zoom - this.canvasY, this.mouse.x - this.canvasX);
    };
    this.doCrouch = function () {
        if (!this.crouch) {
            this.crouch = true;
            this.yOffGoal = this.yOffWhen.crouch;
            Matter.Body.translate(playerHead, {
                x: 0,
                y: 40
            })
        }
    }
    this.undoCrouch = function () {
        this.crouch = false;
        this.yOffGoal = this.yOffWhen.stand;
        Matter.Body.translate(playerHead, {
            x: 0,
            y: -40
        })
    }
    this.enterAir = function () {
        this.onGround = false;
        player.frictionAir = 0.001;
        if (this.isHeadClear) {
            if (this.crouch) {
                this.undoCrouch();
            }
            this.yOffGoal = this.yOffWhen.jump;
        };
    }
    this.enterLand = function () {
        this.onGround = true;
        if (this.crouch) {
            if (this.isHeadClear) {
                this.undoCrouch();
                player.frictionAir = 0.12;
            } else {
                this.yOffGoal = this.yOffWhen.crouch;
                player.frictionAir = 0.5;
            }
        } else {
            this.yOffGoal = this.yOffWhen.stand;
            player.frictionAir = 0.12;
        }
    };
    this.buttonCD_jump = 0; //cooldown for player buttons
    this.keyMove = function () {
        if (this.onGround) { //on ground **********************
            if (this.crouch) { //crouch
                if (!(keys[40] || keys[83]) && this.isHeadClear) { //not pressing crouch anymore
                    this.undoCrouch();
                    player.frictionAir = 0.12;
                }
            } else if (keys[40] || keys[83]) { //on ground && not crouched and pressing s or down
                this.doCrouch();
                player.frictionAir = 0.5;
            } else if ((keys[32] || keys[38] || keys[87]) && this.buttonCD_jump + 20 < game.cycle) { //jump
                this.buttonCD_jump = game.cycle; //can't jump until 20 cycles pass
                Matter.Body.setVelocity(player, { //zero player velocity for consistant jumps
                    x: player.velocity.x,
                    y: 0
                });
                player.force.y = this.Fy / game.delta; //jump force / delta so that force is the same on game slowdowns
            }
            //horizontal move on ground
            if (keys[37] || keys[65]) { //left or a
                if (player.velocity.x > -this.VxMax) {
                    player.force.x += -this.Fx / game.delta;
                }
            } else if (keys[39] || keys[68]) { //right or d
                if (player.velocity.x < this.VxMax) {
                    player.force.x += this.Fx / game.delta;
                }
            }

        } else { // in air **********************************
            //check for short jumps
            if (this.buttonCD_jump + 60 > game.cycle && //just pressed jump
                !(keys[32] || keys[38] || keys[87]) && //but not pressing jump key
                this.Vy < 0) { // and velocity is up
                Matter.Body.setVelocity(player, { //reduce player velocity every cycle until not true
                    x: player.velocity.x,
                    y: player.velocity.y * 0.94
                });
            }
            if (keys[37] || keys[65]) { // move player   left / a
                if (player.velocity.x > -this.VxMax + 2) {
                    player.force.x += -this.FxAir / game.delta;
                }
            } else if (keys[39] || keys[68]) { //move player  right / d
                if (player.velocity.x < this.VxMax - 2) {
                    player.force.x += this.FxAir / game.delta;
                }
            }
        }
        //smoothly move height towards height goal ************
        this.yOff = this.yOff * 0.85 + this.yOffGoal * 0.15
    };
    this.death = function () {
        location.reload();
        //Matter.Body.setPosition(player, this.spawnPos);
        //Matter.Body.setVelocity(player, this.spawnVel);
        //this.dropBody();
        //game.zoom = 0;    //zooms out all the way
        //this.health = 1;
    }
    this.health = 1;
    this.regen = function () {
        if (this.health < 1 && game.cycle % 15 === 0) {
            this.addHealth(0.01);
        }
    };
    this.drawHealth = function () {
        if (this.health < 1) {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
            ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, 60, 10);
            ctx.fillStyle = "#f00";
            ctx.fillRect(this.pos.x - this.radius, this.pos.y - 50, 60 * this.health, 10);
        }
    };
    this.addHealth = function (heal) {
        this.health += heal;
        if (this.health > 1) this.health = 1;
    }
    this.damage = function (dmg) {
        this.health -= dmg;
        if (this.health <= 0) {
            this.death();
        }
    }
    this.deathCheck = function () {
        if (this.pos.y > game.fallHeight) { // if player is 4000px deep reset to spawn Position and Velocity
            this.death();
        }
    };
    this.hitMob = function (i, dmg) {
        this.damage(dmg);
        playSound("dmg" + Math.floor(Math.random() * 4));
        //extra kick between player and mob
        //this section would be better with forces but they don't work...
        let angle = Math.atan2(player.position.y - mob[i].position.y, player.position.x - mob[i].position.x);
        Matter.Body.setVelocity(player, {
            x: player.velocity.x + 8 * Math.cos(angle),
            y: player.velocity.y + 8 * Math.sin(angle)
        });
        Matter.Body.setVelocity(mob[i], {
            x: mob[i].velocity.x - 8 * Math.cos(angle),
            y: mob[i].velocity.y - 8 * Math.sin(angle)
        });
    }

    this.buttonCD = 0; //cooldown for player buttons
    this.eaten = [];
    this.eat = function () {
        if (keys[81] && this.buttonCD < game.cycle) {
            this.buttonCD = game.cycle + 5;
            this.findClosestBody();
            let i = this.closest.index
            if (this.closest.dist < 150) {
                //draw eating
                ctx.lineWidth = 10;
                ctx.strokeStyle = '#5f9';
                ctx.beginPath();
                ctx.moveTo(this.pos.x + 15 * Math.cos(this.angle), this.pos.y + 15 * Math.sin(this.angle));
                ctx.lineTo(body[i].position.x, body[i].position.y);
                ctx.stroke();
                //set to eaten
                body[i].eaten = true;
                //drop body
                body[i].frictionAir = 0;
                this.isHolding = false;
                holdConstraint.bodyB = jumpSensor; //set on sensor to get the constraint on somethign else
                //add to eaten
                body[i].collisionFilter.category = 0x000000;
                body[i].collisionFilter.mask = 0x000000;
                //Matter.Body.setStatic(body[i], true)
                Matter.Sleeping.set(body[i], true)
                Matter.Body.scale(body[i], 0.5, 0.5)
                Matter.Body.setVelocity(body[i], {
                    x: 0,
                    y: 0
                });
                Matter.Body.setAngularVelocity(body[i], 0.08) //(Math.random()*0.5-1)*0.1)
                //Matter.World.remove(engine.world, body[i]);
                //body.splice(i, 1);
                this.eaten[this.eaten.length] = {
                    index: i,
                    cycle: game.cycle
                }
            }
        }
        //control behavior of eaten bodies
        for (let j = 0; j < this.eaten.length; j++) {
            const pos = {
                x: this.pos.x + 60 * Math.cos((game.cycle + this.eaten[j].cycle) * 0.05),
                y: this.pos.y + 30 * Math.sin((game.cycle + this.eaten[j].cycle) * 0.05),
            }
            Matter.Body.setPosition(body[this.eaten[j].index], pos);
            //Matter.Body.setVelocity(body[this.eaten[j].index],{x:0, y:0});

        }

        if (keys[69] && this.buttonCD < game.cycle && this.eaten.length) {
            this.buttonCD = game.cycle + 5;
            let i = this.eaten[this.eaten.length - 1].index;
            body[i].eaten = false;
            body[i].collisionFilter.category = 0x000001;
            body[i].collisionFilter.mask = 0x000101;
            Matter.Body.setVelocity(body[i], {
                x: 0,
                y: 0
            });
            //Matter.Body.setStatic(body[i], false)
            Matter.Sleeping.set(body[i], false)
            Matter.Body.scale(body[i], 2, 2);
            Matter.Body.setPosition(body[i], {
                x: this.pos.x + 20 * Math.cos(this.angle),
                y: this.pos.y + 20 * Math.sin(this.angle)
            });
            const impulse = 0.06 * body[i].mass;
            const f = {
                x: impulse * Math.cos(this.angle) / game.delta,
                y: impulse * Math.sin(this.angle) / game.delta
            }
            body[i].force = f;
            this.eaten.pop();
        }
    };

    this.holdKeyDown = 0;
    this.keyHold = function () { //checks for holding/dropping/picking up bodies
        if (this.isHolding) {
            //give the constaint more length and less stiffness if it is pulled out of position
            const Dx = body[this.holdingBody].position.x - holdConstraint.pointA.x;
            const Dy = body[this.holdingBody].position.y - holdConstraint.pointA.y;
            holdConstraint.length = Math.sqrt(Dx * Dx + Dy * Dy) * 0.95;
            holdConstraint.stiffness = -0.01 * holdConstraint.length + 1;
            if (holdConstraint.length > 90) this.dropBody(); //drop it if the constraint gets too long
            holdConstraint.pointA = { //set constraint position
                x: this.pos.x + 50 * Math.cos(this.angle), //just in front of player nose
                y: this.pos.y + 50 * Math.sin(this.angle)
            };
            if (keys[81]) { // q = rotate the body
                body[this.holdingBody].torque = 0.05 * body[this.holdingBody].mass;
            }
            //look for dropping held body
            if (this.buttonCD < game.cycle) {
                if (keys[69]) { //if holding e drops
                    this.holdKeyDown++;
                } else if (this.holdKeyDown && !keys[69]) {
                    this.dropBody(); //if you hold down e long enough the body is thrown
                    this.throwBody();
                }
            }
        } else if (keys[69]) { //when not holding  e = pick up body
            this.findClosestBody();
            if (this.closest.dist < 150) { //pick up if distance closer then 100*100
                this.isHolding = true;
                this.holdKeyDown = 0;
                this.buttonCD = game.cycle + 20;
                this.holdingBody = this.closest.index; //set new body to be the holdingBody
                //body[this.closest.index].isSensor = true; //sensor seems a bit inconsistant
                //body[this.holdingBody].collisionFilter.group = -2; //don't collide with player
                body[mech.holdingBody].collisionFilter.category = 0x000001;
                body[mech.holdingBody].collisionFilter.mask = 0x000001;
                body[this.holdingBody].frictionAir = 0.1; //makes the holding body less jittery
                holdConstraint.bodyB = body[this.holdingBody];
                holdConstraint.length = 0;
                holdConstraint.pointA = {
                    x: this.pos.x + 50 * Math.cos(this.angle),
                    y: this.pos.y + 50 * Math.sin(this.angle)
                };
            }
        }
    };
    this.dropBody = function () {
        let timer; //reset player collision
        function resetPlayerCollision() {
            timer = setTimeout(function () {
                const dx = mech.pos.x - body[mech.holdingBody].position.x
                const dy = mech.pos.y - body[mech.holdingBody].position.y
                if (dx * dx + dy * dy > 15000) {
                    body[mech.holdingBody].collisionFilter.category = 0x000001;
                    body[mech.holdingBody].collisionFilter.mask = 0x001101;
                    //body[mech.holdingBody].collisionFilter.group = 2; //can collide with player
                } else {
                    resetPlayerCollision();
                }
            }, 100);
        }
        resetPlayerCollision();
        this.isHolding = false;
        body[this.holdingBody].frictionAir = 0.01;
        holdConstraint.bodyB = jumpSensor; //set on sensor to get the constaint on somethign else
    };
    this.throwMax = 150;
    this.throwBody = function () {
        let throwMag = 0;
        if (this.holdKeyDown > 20) {
            if (this.holdKeyDown > this.throwMax) this.holdKeyDown = this.throwMax;
            //scale fire with mass and with holdKeyDown time
            throwMag = body[this.holdingBody].mass * this.holdKeyDown * 0.001;
        }
        body[this.holdingBody].force.x = throwMag * Math.cos(this.angle);
        body[this.holdingBody].force.y = throwMag * Math.sin(this.angle);
    };
    this.isHolding = false;
    this.holdingBody = 0;
    this.closest = {
        dist: 1000,
        index: 0
    };
    this.lookingAtMob = function (mob, threshold) {
        //calculate a vector from mob to player and make it length 1
        const diff = Matter.Vector.normalise(Matter.Vector.sub(mob.position, player.position));
        const dir = { //make a vector for the player's direction of length 1
            x: Math.cos(mech.angle),
            y: Math.sin(mech.angle)
        }
        //the dot prodcut of diff and dir will return how much over lap between the vectors
        const dot = Matter.Vector.dot(dir, diff);
        if (dot > threshold) {
            return true;
        } else {
            return false;
        }
    }
    this.lookingAt = function (i) {
        //calculate a vector from mob to player and make it length 1
        const diff = Matter.Vector.normalise(Matter.Vector.sub(body[i].position, player.position));
        const dir = { //make a vector for the player's direction of length 1
            x: Math.cos(mech.angle),
            y: Math.sin(mech.angle)
        }
        //the dot prodcut of diff and dir will return how much over lap between the vectors
        const dot = Matter.Vector.dot(dir, diff);
        //console.log(dot);
        if (dot > 0.9) {
            return true;
        } else {
            return false;
        }
    }
    this.findClosestBody = function () {
        let mag = 100000;
        let index = 0;
        for (let i = 0; i < body.length; i++) {
            let isLooking = this.lookingAt(i);
            let collisionM = Matter.Query.ray(map, body[i].position, this.pos)
            //let collisionB = Matter.Query.ray(body, body[i].position, this.pos)
            if (collisionM.length) isLooking = false;
            //magnitude of the distance between the poistion vectors of player and each body
            const dist = Matter.Vector.magnitude(Matter.Vector.sub(body[i].position, this.pos));
            if (dist < mag && body[i].mass < player.mass && isLooking && !body[i].eaten) {
                mag = dist;
                index = i;
            }
        }
        this.closest.dist = mag;
        this.closest.index = index;
    };
    this.exit = function () {
        game.nextLevel();
        window.location.reload(false);
    }
    this.standingOnActions = function () {
        if (this.onBody.type === 'map') {
            var that = this; //brings the thisness of the player deeper into the actions object
            var actions = {
                'death': function () {
                    that.death();
                },
                'exit': function () {
                    that.exit();
                },
                'slow': function () {
                    Matter.Body.setVelocity(player, { //reduce player velocity every cycle until not true
                        x: player.velocity.x * 0.5,
                        y: player.velocity.y * 0.5
                    });
                },
                'launch': function () {
                    //that.dropBody();
                    Matter.Body.setVelocity(player, { //zero player velocity for consistant jumps
                        x: player.velocity.x,
                        y: 0
                    });
                    player.force.y = -0.1 * that.mass / game.delta;
                },
                'default': function () {}
            };
            (actions[map[this.onBody.index].action] || actions['default'])();
        }
    }
    this.drawLeg = function (stroke) {
        ctx.save();
        ctx.scale(this.flipLegs, 1); //leg lines
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(this.hip.x, this.hip.y);
        ctx.lineTo(this.knee.x, this.knee.y);
        ctx.lineTo(this.foot.x, this.foot.y);
        ctx.stroke();
        //toe lines
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.foot.x, this.foot.y);
        ctx.lineTo(this.foot.x - 15, this.foot.y + 5);
        ctx.moveTo(this.foot.x, this.foot.y);
        ctx.lineTo(this.foot.x + 15, this.foot.y + 5);
        ctx.stroke();
        //hip joint
        ctx.strokeStyle = '#333';
        ctx.fillStyle = this.fillColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.hip.x, this.hip.y, 11, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        //knee joint
        ctx.beginPath();
        ctx.arc(this.knee.x, this.knee.y, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        //foot joint
        ctx.beginPath();
        ctx.arc(this.foot.x, this.foot.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    };
    this.calcLeg = function (cycle_offset, offset) {
        this.hip.x = 12 + offset;
        this.hip.y = 24 + offset;
        //stepSize goes to zero if Vx is zero or not on ground (make this transition cleaner)
        this.stepSize = 0.9 * this.stepSize + 0.1 * (8 * Math.sqrt(Math.abs(this.Vx)) * this.onGround);
        //changes to stepsize are smoothed by adding only a percent of the new value each cycle
        const stepAngle = 0.037 * this.walk_cycle + cycle_offset;
        this.foot.x = 2 * this.stepSize * Math.cos(stepAngle) + offset;
        this.foot.y = offset + this.stepSize * Math.sin(stepAngle) + this.yOff + this.height;
        const Ymax = this.yOff + this.height;
        if (this.foot.y > Ymax) this.foot.y = Ymax;

        //calculate knee position as intersection of circle from hip and foot
        const d = Math.sqrt((this.hip.x - this.foot.x) * (this.hip.x - this.foot.x) +
            (this.hip.y - this.foot.y) * (this.hip.y - this.foot.y));
        const l = (this.legLength1 * this.legLength1 - this.legLength2 * this.legLength2 + d * d) / (2 * d);
        const h = Math.sqrt(this.legLength1 * this.legLength1 - l * l);
        this.knee.x = l / d * (this.foot.x - this.hip.x) - h / d * (this.foot.y - this.hip.y) + this.hip.x + offset;
        this.knee.y = l / d * (this.foot.y - this.hip.y) + h / d * (this.foot.x - this.hip.x) + this.hip.y;
    };
    this.draw = function () {
        ctx.fillStyle = this.fillColor;
        if (this.mouse.x > canvas.width / 2) {
            this.flipLegs = 1;
        } else {
            this.flipLegs = -1;
        }
        this.walk_cycle += this.flipLegs * this.Vx;

        //draw body
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        this.calcLeg(Math.PI, -3);
        this.drawLeg('#444');
        this.calcLeg(0, 0);
        this.drawLeg('#333');
        ctx.rotate(this.angle);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        //ctx.fillStyle = this.fillColor;
        let grd = ctx.createLinearGradient(-30, 0, 30, 0);
        grd.addColorStop(0, this.fillColorDark);
        grd.addColorStop(1, this.fillColor);
        ctx.fillStyle = grd;
        ctx.beginPath();
        //ctx.moveTo(0, 0);
        ctx.arc(0, 0, 30, 0, 2 * Math.PI);
        ctx.arc(15, 0, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        //draw holding graphics
        if (this.isHolding) {
            if (this.holdKeyDown > 20) {
                if (this.holdKeyDown > this.throwMax) {
                    ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
                } else {
                    ctx.strokeStyle = 'rgba(255, 0, 255, ' + (0.2 + 0.4 * this.holdKeyDown / this.throwMax) + ')';
                }
            } else {
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            }
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(holdConstraint.bodyB.position.x + Math.random() * 2,
                holdConstraint.bodyB.position.y + Math.random() * 2);
            ctx.lineTo(this.pos.x + 15 * Math.cos(this.angle), this.pos.y + 15 * Math.sin(this.angle));
            //ctx.lineTo(holdConstraint.pointA.x,holdConstraint.pointA.y);
            ctx.stroke();
        }
    };
};




//makes the player object based on mechprototype
const mech = new mechProto();