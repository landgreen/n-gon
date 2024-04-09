let powerUp = [];

const powerUps = {
    ejectGraphic(color = "68, 102, 119") {
        simulation.drawList.push({
            x: m.pos.x,
            y: m.pos.y,
            radius: 100,
            color: `rgba(${color}, 0.8)`,
            time: 4
        });
        simulation.drawList.push({
            x: m.pos.x,
            y: m.pos.y,
            radius: 75,
            color: `rgba(${color}, 0.6)`,
            time: 8
        });
        simulation.drawList.push({
            x: m.pos.x,
            y: m.pos.y,
            radius: 50,
            color: `rgba(${color}, 0.3)`,
            time: 12
        });
        simulation.drawList.push({
            x: m.pos.x,
            y: m.pos.y,
            radius: 25,
            color: `rgba(${color}, 0.15)`,
            time: 16
        });
    },
    healGiveMaxEnergy: false, //for tech 1st ionization energy
    orb: {
        research(num = 1) {
            switch (num) {
                case 1:
                    return `<div class="research-circle"></div> `
                case 2:
                    return `<span style="position:relative;">
                    <div class="research-circle" style="position:absolute; top:1.5px; left:0;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:7px;"></div>
                    </span> &nbsp; &nbsp; &nbsp; &nbsp;`
                case 3:
                    return `<span style="position:relative;">
                    <div class="research-circle" style="position:absolute; top:1.5px; left:0;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:8px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:16px;"></div>
                    </span> &nbsp; &nbsp; &nbsp; &nbsp; &thinsp; `
                case 4:
                    return `<span style="position:relative;">
                    <div class="research-circle" style="position:absolute; top:1.5px; left:0;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:8px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:16px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:24px;"></div>
                    </span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; `
                case 5:
                    return `<span style="position:relative;">
                    <div class="research-circle" style="position:absolute; top:1.5px; left:0;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:8px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:16px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:24px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:32px;"></div>
                    </span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; `
                case 6:
                    return `<span style="position:relative;">
                    <div class="research-circle" style="position:absolute; top:1.5px; left:0;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:8px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:16px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:24px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:32px;"></div>
                    <div class="research-circle" style="position:absolute; top:1.5px; left:40px;"></div>
                    </span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; `
            }
            let text = '<span style="position:relative;">'
            for (let i = 0; i < num; i++) {
                text += `<div class="research-circle" style="position:absolute; top:1.5px; left:${i * 8}px;"></div>`
            }
            text += '</span> &nbsp; &nbsp; '
            for (let i = 0; i < num; i++) {
                text += '&nbsp; '
            }
            return text
        },
        ammo(num = 1) {
            switch (num) {
                case 1:
                    return `<div class="ammo-circle"></div>`
            }
            let text = '<span style="position:relative;">'
            for (let i = 0; i < num; i++) {
                text += `<div class="ammo-circle" style="position:absolute; top:1.5px; left:${i * 8}px;"></div>`
            }
            text += '</span> &nbsp; &nbsp; '
            for (let i = 0; i < num; i++) {
                text += '&nbsp; '
            }
            return text
        },
        heal(num = 1) {
            if (powerUps.healGiveMaxEnergy) {
                switch (num) {
                    case 1:
                        return `<div class="heal-circle-energy"></div>`
                }
                let text = '<span style="position:relative;">'
                for (let i = 0; i < num; i++) {
                    text += `<div class="heal-circle-energy" style="position:absolute; top:1px; left:${i * 10}px;"></div>`
                }
                text += '</span> &nbsp; &nbsp; '
                for (let i = 0; i < num; i++) {
                    text += '&nbsp; '
                }
                return text
            } else {
                switch (num) {
                    case 1:
                        return `<div class="heal-circle"></div>`
                }
                let text = '<span style="position:relative;">'
                for (let i = 0; i < num; i++) {
                    text += `<div class="heal-circle" style="position:absolute; top:1px; left:${i * 10}px;"></div>`
                }
                text += '</span> &nbsp; &nbsp; '
                for (let i = 0; i < num; i++) {
                    text += '&nbsp; '
                }
                return text
            }
        },
        tech(num = 1) {
            return `<div class="tech-circle"></div>`
        },
        coupling(num = 1) {
            switch (num) {
                case 1:
                    return `<div class="coupling-circle"></div>`
            }
            let text = '<span style="position:relative;">'
            for (let i = 0; i < num; i++) {
                text += `<div class="coupling-circle" style="position:absolute; top:1.5px; left:${i * 6}px;"></div>`
            }
            text += '</span> &nbsp; &nbsp;'
            for (let i = 0; i < num; i++) {
                text += '&thinsp; '
            }
            return text
        },
        boost(num = 1) {
            switch (num) {
                case 1:
                    return `<div class="boost-circle"></div>`
            }
            let text = '<span style="position:relative;">'
            for (let i = 0; i < num; i++) {
                text += `<div class="boost-circle" style="position:absolute; top:1.5px; left:${i * 8}px;"></div>`
            }
            text += '</span> &nbsp; &nbsp; '
            for (let i = 0; i < num; i++) {
                text += '&nbsp; '
            }
            return text
        },
    },
    totalPowerUps: 0, //used for tech that count power ups at the end of a level
    do() { },
    setPowerUpMode() {
        if (tech.duplicationChance() > 0 || tech.isAnthropicTech) {
            powerUps.draw = powerUps.drawDup
            if (tech.isPowerUpsVanish) {
                if (tech.isHealAttract) {
                    powerUps.do = () => {
                        powerUps.dupExplode();
                        powerUps.draw();
                        powerUps.attractHeal();
                    }
                } else {
                    powerUps.do = () => {
                        powerUps.dupExplode();
                        powerUps.draw();
                    }
                }
            } else if (tech.isHealAttract) {
                powerUps.do = () => {
                    powerUps.draw();
                    powerUps.attractHeal();
                }
            } else {
                powerUps.do = () => powerUps.draw();
            }
            tech.maxDuplicationEvent() //check to see if hitting 100% duplication
        } else {
            powerUps.draw = powerUps.drawCircle
            if (tech.isHealAttract) {
                powerUps.do = () => {
                    powerUps.draw();
                    powerUps.attractHeal();
                }
            } else {
                powerUps.do = powerUps.draw
            }
        }
    },
    draw() { },
    drawCircle() {
        ctx.globalAlpha = 0.4 * Math.sin(simulation.cycle * 0.15) + 0.6;
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            ctx.beginPath();
            ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
            ctx.fillStyle = powerUp[i].color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },
    drawDup() {
        ctx.globalAlpha = 0.4 * Math.sin(simulation.cycle * 0.15) + 0.6;
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            ctx.beginPath();
            if (powerUp[i].isDuplicated) {
                let vertices = powerUp[i].vertices;
                ctx.moveTo(vertices[0].x, vertices[0].y);
                for (let j = 1; j < vertices.length; j++) {
                    ctx.lineTo(vertices[j].x, vertices[j].y);
                }
                ctx.lineTo(vertices[0].x, vertices[0].y);
            } else {
                ctx.arc(powerUp[i].position.x, powerUp[i].position.y, powerUp[i].size, 0, 2 * Math.PI);
            }
            ctx.fillStyle = powerUp[i].color;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },
    attractHeal() {
        for (let i = 0; i < powerUp.length; i++) { //attract heal power ups to player
            if (powerUp[i].name === "heal") {
                let attract = Vector.mult(Vector.normalise(Vector.sub(m.pos, powerUp[i].position)), 0.015 * powerUp[i].mass)
                powerUp[i].force.x += attract.x;
                powerUp[i].force.y += attract.y - powerUp[i].mass * simulation.g; //negate gravity
                Matter.Body.setVelocity(powerUp[i], Vector.mult(powerUp[i].velocity, 0.7));
            }
        }
    },
    dupExplode() {
        for (let i = 0, len = powerUp.length; i < len; ++i) {
            if (powerUp[i].isDuplicated) {
                if (Math.random() < 0.003 && !m.isBodiesAsleep) { //  (1-0.003)^240 = chance to be removed after 4 seconds,   240 = 4 seconds * 60 cycles per second
                    b.explosion(powerUp[i].position, 175 + (11 + 3 * Math.random()) * powerUp[i].size);
                    Matter.Composite.remove(engine.world, powerUp[i]);
                    powerUp.splice(i, 1);
                    break
                }
                if (Math.random() < 0.3) {  //draw electricity
                    const mag = 4 + powerUp[i].size / 5
                    let unit = Vector.rotate({ x: mag, y: mag }, 2 * Math.PI * Math.random())
                    let path = { x: powerUp[i].position.x + unit.x, y: powerUp[i].position.y + unit.y }
                    ctx.beginPath();
                    ctx.moveTo(path.x, path.y);
                    for (let i = 0; i < 6; i++) {
                        unit = Vector.rotate(unit, 4 * (Math.random() - 0.5))
                        path = Vector.add(path, unit)
                        ctx.lineTo(path.x, path.y);
                    }
                    ctx.lineWidth = 0.5 + 2 * Math.random();
                    ctx.strokeStyle = "#000"
                    ctx.stroke();
                }
            }
        }
    },
    choose(type, index) {
        if (type === "gun") {
            b.giveGuns(index)
            let text = `b.giveGuns("<span class='color-text'>${b.guns[index].name}</span>")`
            if (b.inventory.length === 1) text += `<br>input.key.gun<span class='color-symbol'>:</span> ["<span class='color-text'>MouseLeft</span>"]`
            if (b.inventory.length === 2) text += `
            <br>input.key.nextGun<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.nextGun}</span>","<span class='color-text'>MouseWheel</span>"]
            <br>input.key.previousGun<span class='color-symbol'>:</span> ["<span class='color-text'>${input.key.previousGun}</span>","<span class='color-text'>MouseWheel</span>"]`
            simulation.makeTextLog(text);
        } else if (type === "field") {
            m.setField(index)
        } else if (type === "tech") {
            // if (tech.isBanish && tech.tech[index].isBanished) tech.tech[index].isBanished = false
            simulation.makeTextLog(`<span class='color-var'>tech</span>.giveTech("<span class='color-text'>${tech.tech[index].name}</span>")`);
            tech.giveTech(index)
        }
        powerUps.endDraft(type);
    },
    showDraft() {
        //disable clicking for 1/2 a second to prevent mistake clicks
        document.getElementById("choose-grid").style.pointerEvents = "none";
        document.body.style.cursor = "none";
        setTimeout(() => {
            // if (!tech.isNoDraftPause) 
            document.body.style.cursor = "auto";
            document.getElementById("choose-grid").style.pointerEvents = "auto";
            document.getElementById("choose-grid").style.transitionDuration = "0s";
        }, 400);
        simulation.isChoosing = true; //stops p from un pausing on key down

        if (!simulation.paused) {
            if (tech.isNoDraftPause) {
                document.getElementById("choose-grid").style.opacity = "1"
            } else {
                simulation.paused = true;
                document.getElementById("choose-grid").style.opacity = "1"
            }
            document.getElementById("choose-grid").style.transitionDuration = "0.5s"; //how long is the fade in on
            document.getElementById("choose-grid").style.visibility = "visible"

            requestAnimationFrame(() => {
                ctx.fillStyle = `rgba(150,150,150,0.9)`; //`rgba(221,221,221,0.6)`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });
            // document.getElementById("pause-grid-right").style.opacity = "0.7"
            // document.getElementById("pause-grid-left").style.opacity = "0.7"
        }
        // build.pauseGrid()
    },
    endDraft(type, isCanceled = false) { //type should be a gun, tech, or field
        if (isCanceled) {
            if (tech.isCancelDuplication) {
                const value = 0.05
                tech.duplication += value
                tech.maxDuplicationEvent()
                simulation.makeTextLog(`tech.duplicationChance() <span class='color-symbol'>+=</span> ${value}`)
                simulation.circleFlare(value);
            }
            if (tech.isCancelRerolls) {
                for (let i = 0, len = 10 + 4 * Math.random(); i < len; i++) {
                    let spawnType
                    if (Math.random() < 0.4 && !tech.isEnergyNoAmmo) {
                        spawnType = "ammo"
                    } else if (Math.random() < 0.33 && !tech.isSuperDeterminism) {
                        spawnType = "research"
                    } else {
                        spawnType = "heal"
                    }
                    powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), spawnType, false);
                }
            }
            if (tech.isCancelCouple) powerUps.spawnDelay("coupling", 8)
            if (tech.isCancelTech && tech.cancelTechCount === 0 && type !== "entanglement") {
                tech.cancelTechCount++
                // powerUps.research.use('tech')
                powerUps[type].effect();
                return
            }
        }
        tech.cancelTechCount = 0
        if (tech.isAnsatz && powerUps.research.count < 1) {
            for (let i = 0; i < 3; i++) powerUps.spawn(m.pos.x + 40 * (Math.random() - 0.5), m.pos.y + 40 * (Math.random() - 0.5), "research", false);
        }
        // document.getElementById("choose-grid").style.display = "none"
        document.getElementById("choose-grid").style.visibility = "hidden"
        document.getElementById("choose-grid").style.opacity = "0"

        document.body.style.cursor = "none";
        // document.body.style.overflow = "hidden"
        // if (m.alive){}
        if (simulation.paused) requestAnimationFrame(cycle);
        if (m.alive) simulation.paused = false;
        simulation.isChoosing = false; //stops p from un pausing on key down
        build.unPauseGrid()
        if (m.immuneCycle < m.cycle + 15) m.immuneCycle = m.cycle + 15; //player is immune to damage for 30 cycles
        if (m.holdingTarget) m.drop();
    },
    animatePowerUpGrab(color) {
        simulation.ephemera.push({
            // name: "",
            count: 25, //cycles before it self removes
            do() {
                this.count -= 2
                if (this.count < 5) simulation.removeEphemera(this.name)

                ctx.beginPath();
                ctx.arc(m.pos.x, m.pos.y, Math.max(3, this.count), 0, 2 * Math.PI);
                ctx.fillStyle = color
                ctx.fill();
                // ctx.strokeStyle = "hsla(200,50%,61%,0.18)";
                // ctx.stroke();
            },
        })

    },
    coupling: {
        name: "coupling",
        color: "#0ae", //"#0cf",
        size() {
            return 13;
        },
        effect() {
            powerUps.animatePowerUpGrab('rgba(0, 170, 238,0.3)')

            m.couplingChange(1)
        },
        // spawnDelay(num) {
        //     let count = num
        //     let respawnDrones = () => {
        //         if (count > 0) {
        //             requestAnimationFrame(respawnDrones);
        //             if (!simulation.paused && !simulation.isChoosing) { //&& !(simulation.cycle % 2)
        //                 count--
        //                 const where = { x: m.pos.x + 50 * (Math.random() - 0.5), y: m.pos.y + 50 * (Math.random() - 0.5) }
        //                 powerUps.spawn(where.x, where.y, "coupling");
        //             }
        //         }
        //     }
        //     requestAnimationFrame(respawnDrones);
        // }
    },
    boost: {
        name: "boost",
        color: "#f55", //"#0cf",
        size() {
            return 11;
        },
        endCycle: 0,
        duration: null, //set by "tech: band gap"
        damage: null, //set by "tech: band gap"
        effect() {
            powerUps.animatePowerUpGrab('rgba(255, 0, 0, 0.5)')
            powerUps.boost.endCycle = m.cycle + Math.floor(Math.max(0, powerUps.boost.endCycle - m.cycle) * 0.6) + powerUps.boost.duration //duration+seconds plus 2/3 of current time left
        },
        draw() {
            // console.log(this.endCycle)
            if (powerUps.boost.endCycle > m.cycle) {
                ctx.strokeStyle = "rgba(255,0,0,0.8)" //m.fieldMeterColor; //"rgba(255,255,0,0.2)" //ctx.strokeStyle = `rgba(0,0,255,${0.5+0.5*Math.random()})`
                ctx.beginPath();
                const arc = (powerUps.boost.endCycle - m.cycle) / powerUps.boost.duration
                ctx.arc(m.pos.x, m.pos.y, 28, m.angle - Math.PI * arc, m.angle + Math.PI * arc); //- Math.PI / 2
                ctx.lineWidth = 4
                ctx.stroke();
            }
        },
    },
    research: {
        count: 0,
        name: "research",
        color: "#f7b",
        size() {
            return 20;
        },
        effect() {
            powerUps.animatePowerUpGrab('rgba(255, 119, 187,0.3)')
            powerUps.research.changeRerolls(1)
        },
        isMakingBots: false, //to prevent bot fabrication from running 2 sessions at once
        changeRerolls(amount) {
            if (amount !== 0) powerUps.research.count += amount
            if (tech.isRerollBots && !this.isMakingBots) {
                let cycle = () => {
                    const cost = 2 + Math.floor(0.2 * b.totalBots())
                    if (m.alive && powerUps.research.count >= cost) {
                        requestAnimationFrame(cycle);
                        this.isMakingBots = true

                        if (!simulation.paused && !simulation.isChoosing && !(simulation.cycle % 60)) {
                            powerUps.research.count -= cost
                            b.randomBot()
                            if (tech.renormalization) {
                                for (let i = 0; i < cost; i++) {
                                    if (Math.random() < 0.47) {
                                        m.fieldCDcycle = m.cycle + 20;
                                        powerUps.spawn(m.pos.x + 100 * (Math.random() - 0.5), m.pos.y + 100 * (Math.random() - 0.5), "research");
                                    }
                                }
                            }
                        }
                    } else {
                        this.isMakingBots = false
                    }
                }
                requestAnimationFrame(cycle);
            }

            if (tech.isDeathAvoid && document.getElementById("tech-anthropic")) {
                document.getElementById("tech-anthropic").innerHTML = `-${powerUps.research.count}`
            }
            if (tech.renormalization && Math.random() < 0.47 && amount < 0) {
                for (let i = 0, len = -amount; i < len; i++) powerUps.spawn(m.pos.x, m.pos.y, "research");
            }
            if (tech.isRerollHaste) {
                if (powerUps.research.count === 0) {
                    tech.researchHaste = 0.5;
                    b.setFireCD();
                } else {
                    tech.researchHaste = 1;
                    b.setFireCD();
                }
            }
        },
        currentRerollCount: 0,
        use(type) { //runs when you actually research a list of selections, type can be field, gun, or tech
            if (tech.isJunkResearch && powerUps.research.currentRerollCount < 2) {
                tech.addJunkTechToPool(0.01)
            } else {
                powerUps.research.changeRerolls(-1)
            }
            if (tech.isResearchDamage) {
                tech.damage *= 1.05
                simulation.makeTextLog(`<strong>1.05x</strong> <strong class='color-d'>damage</strong>`);
                tech.addJunkTechToPool(0.01)
            }
            powerUps.research.currentRerollCount++
            // if (tech.isBanish && type === 'tech') { // banish researched tech
            //     const banishLength = tech.isDeterminism ? 1 : 3 + tech.extraChoices * 2
            //     for (let i = 0; i < banishLength; i++) {
            //         const index = powerUps.tech.choiceLog.length - i - 1
            //         if (powerUps.tech.choiceLog[index] && tech.tech[powerUps.tech.choiceLog[index]]) tech.tech[powerUps.tech.choiceLog[index]].isBanished = true
            //     }
            //     simulation.makeTextLog(`powerUps.tech.length: ${Math.max(0,powerUps.tech.lastTotalChoices - banishLength)}`)
            // }
            if (tech.isResearchReality) {
                m.switchWorlds()
                simulation.trails()
                simulation.makeTextLog(`simulation.amplitude <span class='color-symbol'>=</span> ${Math.random()}`);
            }
            powerUps[type].effect();
        },
    },
    heal: {
        name: "heal",
        color: "#0eb",
        size() {
            return Math.sqrt(0.1 + 0.25) * 40 * (simulation.healScale ** 0.25) * Math.sqrt(tech.largerHeals * (tech.isHalfHeals ? 0.5 : 1)) * (tech.isFlipFlopOn && tech.isFlipFlopHealth ? Math.sqrt(2) : 1); //(simulation.healScale ** 0.25)  gives a smaller radius as heal scale goes down
        },
        effect() {
            if (!tech.isEnergyHealth && m.alive) {
                powerUps.animatePowerUpGrab('rgba(0, 238, 187,0.25)')
                let heal = (this.size / 40 / (simulation.healScale ** 0.25)) ** 2 //simulation.healScale is undone here because heal scale is already properly affected on m.addHealth()
                if (heal > 0) {
                    let overHeal = m.health + heal * simulation.healScale - m.maxHealth //used with tech.isOverHeal
                    const healOutput = Math.min(m.maxHealth - m.health, heal) * simulation.healScale
                    m.addHealth(heal);
                    if (healOutput > 0) simulation.makeTextLog(`<span class='color-var'>m</span>.health <span class='color-symbol'>+=</span> ${(healOutput).toFixed(3)}`) // <br>${m.health.toFixed(3)}
                    if (tech.isOverHeal && overHeal > 0) { //tech quenching
                        overHeal *= 2 //double the over heal converted to max health
                        //make sure overHeal doesn't kill player
                        if (m.health - overHeal * m.defense() < 0) overHeal = m.health - 0.01
                        tech.extraMaxHealth += overHeal //increase max health
                        m.setMaxHealth();
                        m.damage(overHeal);
                        overHeal *= m.defense() // account for defense after m.damage() so the text log is accurate
                        simulation.makeTextLog(`<span class='color-var'>m</span>.health <span class='color-symbol'>-=</span> ${(overHeal).toFixed(3)}`) // <br>${m.health.toFixed(3)}
                        simulation.drawList.push({ //add dmg to draw queue
                            x: m.pos.x,
                            y: m.pos.y,
                            radius: overHeal * 500 * simulation.healScale,
                            color: simulation.mobDmgColor,
                            time: simulation.drawTime
                        });
                    } else if (overHeal > 0.13) { //if leftover heals spawn a new spammer heal power up
                        requestAnimationFrame(() => {
                            powerUps.directSpawn(this.position.x, this.position.y, "heal", true, null, overHeal * 40 * (simulation.healScale ** 0.25))//    directSpawn(x, y, target, moving = true, mode = null, size = powerUps[target].size()) {
                        });
                    }
                    if (tech.isHealBrake) {
                        const totalTime = 1020
                        //check if you already have this effect
                        let foundActiveEffect = false
                        for (let i = 0; i < simulation.ephemera.length; i++) {
                            if (simulation.ephemera[i].name === "healPush") {
                                foundActiveEffect = true
                                simulation.ephemera[i].count = 0.5 * simulation.ephemera[i].count + totalTime //add time
                                simulation.ephemera[i].scale = 0.5 * (simulation.ephemera[i].scale + Math.min(Math.max(0.6, heal * 6), 2.3)) //take average of scale
                            }
                        }
                        if (!foundActiveEffect) {
                            simulation.ephemera.push({
                                name: "healPush",
                                count: totalTime, //cycles before it self removes
                                range: 0,
                                scale: Math.min(Math.max(0.7, heal * 4), 2.2), //typically heal is 0.35
                                do() {
                                    this.count--
                                    if (this.count < 0) simulation.removeEphemera(this.name)
                                    this.range = this.range * 0.99 + 0.01 * (300 * this.scale + 100 * Math.sin(m.cycle * 0.022))
                                    if (this.count < 120) this.range -= 5 * this.scale
                                    this.range = Math.max(this.range, 1) //don't go negative
                                    // const range = 300 + 100 * Math.sin(m.cycle * 0.022)
                                    for (let i = 0; i < mob.length; i++) {
                                        const distance = Vector.magnitude(Vector.sub(m.pos, mob[i].position))
                                        if (distance < this.range) {
                                            const cap = mob[i].isShielded ? 3 : 1
                                            if (mob[i].speed > cap && Vector.dot(mob[i].velocity, Vector.sub(m.pos, mob[i].position)) > 0) { // if velocity is directed towards player
                                                Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(mob[i].velocity), cap)); //set velocity to cap, but keep the direction
                                            }
                                        }
                                    }
                                    ctx.beginPath();
                                    ctx.arc(m.pos.x, m.pos.y, this.range, 0, 2 * Math.PI);
                                    ctx.fillStyle = "hsla(200,50%,61%,0.18)";
                                    ctx.fill();
                                },
                            })
                        }
                    }
                }
            }
            if (powerUps.healGiveMaxEnergy) {
                tech.healMaxEnergyBonus += 0.14 * tech.largerHeals * (tech.isHalfHeals ? 0.5 : 1)
                m.setMaxEnergy();
            }
        },
        spawn(x, y, size) { //used to spawn a heal with a specific size / heal amount, not normally used
            powerUps.directSpawn(x, y, "heal", false, null, size)
            if (Math.random() < tech.duplicationChance()) {
                powerUps.directSpawn(x, y, "heal", false, null, size)
                powerUp[powerUp.length - 1].isDuplicated = true
            }
        }
    },
    ammo: {
        name: "ammo",
        color: "#467",
        size() {
            return 17;
        },
        effect() {
            const couplingExtraAmmo = (m.fieldMode === 10 || m.fieldMode === 0) ? 1 + 0.04 * m.coupling : 1
            if (b.inventory.length > 0) {
                powerUps.animatePowerUpGrab('rgba(68, 102, 119,0.25)')
                if (tech.isAmmoForGun && b.activeGun !== null) { //give extra ammo to one gun only with tech logistics
                    const target = b.guns[b.activeGun]
                    if (target.ammo !== Infinity) {
                        if (tech.ammoCap) {
                            target.ammo = Math.ceil(2 * target.ammoPack * tech.ammoCap * couplingExtraAmmo)
                        } else {
                            target.ammo += Math.ceil(2 * (Math.random() + Math.random()) * target.ammoPack * couplingExtraAmmo)
                        }
                    }
                } else { //give ammo to all guns in inventory
                    for (let i = 0, len = b.inventory.length; i < len; i++) {
                        const target = b.guns[b.inventory[i]]
                        if (target.ammo !== Infinity) {
                            if (tech.ammoCap) {
                                target.ammo = Math.ceil(target.ammoPack * tech.ammoCap * couplingExtraAmmo)
                            } else { //default ammo behavior
                                target.ammo += Math.ceil((Math.random() + Math.random()) * target.ammoPack * couplingExtraAmmo)
                            }
                        }
                    }
                }
                simulation.updateGunHUD();
            }
        }
    },
    cancelText(type) {
        // if (localSettings.isHideImages) {          }

        if (tech.isSuperDeterminism) {
            return `<div></div>`
        } else if (tech.isCancelTech && tech.cancelTechCount === 0) {
            return `<div class='cancel-card' onclick='powerUps.endDraft("${type}",true)' style="width: 115px;">randomize</div>`
        } else if (level.levelsCleared === 0 && localSettings.isTrainingNotAttempted && b.inventory.length === 0) { //don't show cancel if on initial level and haven't done tutorial
            return `<div class='cancel-card'  style="visibility: hidden;"></div>`
        } else {
            return `<div class='cancel-card' onclick='powerUps.endDraft("${type}",true)' style="width: 85px;">cancel</div>`
        }
    },
    researchText(type) {
        let text = ""
        if (type === "entanglement") {
            text += `<div class='choose-grid-module entanglement flipX' onclick='powerUps.endDraft("${type}",true)'>entanglement</div>`
        } else if (tech.isJunkResearch && powerUps.research.currentRerollCount < 2) {
            text += `<div onclick="powerUps.research.use('${type}')" class='research-card'>` // style = "margin-left: 192px; margin-right: -192px;"
            text += `<div><div> <span style="position:relative;">`
            text += `<div class="circle-grid junk" style="position:absolute; top:0; left:${15 * i}px ;opacity:0.8; border: 1px #fff solid;width: 1.15em;height: 1.15em;"></div>`
            text += `</span>&nbsp; <span class='research-select'>pseudoscience</span></div></div></div>`
        } else if (powerUps.research.count > 0) {
            text += `<div onclick="powerUps.research.use('${type}')" class='research-card' >` // style = "margin-left: 192px; margin-right: -192px;"
            text += `<div><div><span style="position:relative;">`
            for (let i = 0, len = Math.min(powerUps.research.count, 30); i < len; i++) text += `<div class="circle-grid research" style="font-size:0.82em; position:absolute; top:0; left:${(18 - len * 0.21) * i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
            text += `</span>&nbsp; <span class='research-select'>${tech.isResearchReality ? "<span class='alt'>alternate reality</span>" : "research"}</span></div></div></div>`
        } else {
            text += `<div></div>`
        }
        return text
    },
    researchAndCancelText(type) {
        let text = `<div class='research-cancel'>`
        if (type === "entanglement") {
            text += `<span class='research-card entanglement flipX' style="width: 275px;" onclick='powerUps.endDraft("${type}",true)'><span style="letter-spacing: 6px;">entanglement</span></span>`  //&zwnj;
        } else if (tech.isJunkResearch && powerUps.research.currentRerollCount < 2) {
            text += `<span onclick="powerUps.research.use('${type}')" class='research-card' style="width: 275px;float: left;">` // style = "margin-left: 192px; margin-right: -192px;"
            text += `<div><div><span style="position:relative;">`
            text += `<div class="circle-grid junk" style="position:absolute; top:0; left:${15 * i}px ;opacity:0.8; border: 1px #fff solid;width: 1.15em;height: 1.15em;"></div>`
            text += `</span>&nbsp; <span class='research-select'>${tech.isResearchReality ? "<span class='alt'>alternate reality</span>" : "research"}</span></div></div></span>`
        } else if (powerUps.research.count > 0) {
            text += `<span onclick="powerUps.research.use('${type}')" class='research-card' style="width: 275px;float: left;">` // style = "margin-left: 192px; margin-right: -192px;"
            text += `<div><div><span style="position:relative;">`
            let researchCap = 18
            if (tech.isCancelTech && tech.cancelTechCount === 0) researchCap -= 2
            if (canvas.width < 1951) researchCap -= 3
            if (canvas.width < 1711) researchCap -= 4
            for (let i = 0, len = Math.min(powerUps.research.count, researchCap); i < len; i++) {
                text += `<div class="circle-grid research" style="font-size:0.82em; position:absolute; top:0; left:${(18 - len * 0.21) * i}px ;opacity:0.8; border: 1px #fff solid;"></div>`
            }
            text += `</span>&nbsp; <span class='research-select'>${tech.isResearchReality ? "<span class='alt'>alternate reality</span>" : "research"}</span></div></div></span>`
        } else {
            text += `<span class='research-card' style="width: 275px;float: right; background-color: #aaa;color:#888;">research</span>` //&zwnj;
        }
        if (tech.isSuperDeterminism) {
            text += `<span class='cancel-card' style="width: 95px;float: right;background-color: #aaa;color:#888;">cancel</span>`
        } else if (tech.isCancelTech && tech.cancelTechCount === 0) {
            text += `<span class='cancel-card' onclick='powerUps.endDraft("${type}",true)' style="width: 115px;float: right;font-size:0.9em;padding-top:5px">randomize</span>`
        } else if (level.levelsCleared === 0 && localSettings.isTrainingNotAttempted && b.inventory.length === 0) {
            text += `<span class='cancel-card' style="visibility: hidden;">cancel</span>` //don't show cancel if on initial level and haven't done tutorial
        } else {
            text += `<span class='cancel-card' onclick='powerUps.endDraft("${type}",true)' style="width: 95px;float: right;">cancel</span>`
        }
        return text + "</div>"
    },
    buildColumns(totalChoices, type) {
        let width
        if (canvas.width < 1710) {
            width = "285px"
        } else if (canvas.width < 1950) {
            width = "340px"
        } else {
            width = "384px"
        }

        let text = ""
        if (localSettings.isHideImages) {
            document.getElementById("choose-grid").style.gridTemplateColumns = width
            text += powerUps.researchAndCancelText(type)
        } else if (totalChoices === 0) {
            document.getElementById("choose-grid").style.gridTemplateColumns = width
            text += powerUps.researchAndCancelText(type)
        } else if (totalChoices === 1 || canvas.width < 1200) {
            document.getElementById("choose-grid").style.gridTemplateColumns = width
            text += powerUps.researchAndCancelText(type)
            // console.log('hi')
            // text += powerUps.cancelText(type)
            // text += powerUps.researchText(type)
        } else if (totalChoices === 2) {
            document.getElementById("choose-grid").style.gridTemplateColumns = `repeat(2, ${width})`
            text += powerUps.researchText(type)
            text += powerUps.cancelText(type)
        } else {
            document.getElementById("choose-grid").style.gridTemplateColumns = `repeat(3, ${width})`
            text += "<div></div>"
            text += powerUps.researchText(type)
            text += powerUps.cancelText(type)
        }
        return text
    },
    hideStyle: `style="height:auto; border: none; background-color: transparent;"`,
    gunText(choose, click) {
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/gun/${b.guns[choose].name}.webp');"`
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}" ${style}>
        <div class="card-text">
        <div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choose].name}</div>
        ${b.guns[choose].descriptionFunction()}</div></div>`
    },
    fieldText(choose, click) {
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/field/${m.fieldUpgrades[choose].name}${choose === 0 ? Math.floor(Math.random() * 10) : ""}.webp');"`
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
        <div class="card-text">
        <div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choose].name}</div>
        ${m.fieldUpgrades[choose].description}</div></div>`
    },
    techText(choose, click) {
        const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
        const style = localSettings.isHideImages || tech.tech[choose].isLore ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
                <div class="card-text">
                <div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
    },
    instantTechText(choose, click) {
        const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
        const style = localSettings.isHideImages || tech.tech[choose].isLore ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
        // <div class="circle-grid tech"></div>
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
                <div class="card-text">
                <div class="grid-title"> <div class="circle-grid-instant"></div> &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
    },
    skinTechText(choose, click) {
        const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
                <div class="card-text">
                <div class="grid-title">         
                <span style="position:relative;">
                    <div class="circle-grid-skin"></div>
                    <div class="circle-grid-skin-eye"></div>
                </span>
                &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
    },
    fieldTechText(choose, click) {
        const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
                <div class="card-text">
                <div class="grid-title">
                <span style="position:relative;">
                    <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                    <div class="circle-grid field" style="position:absolute; top:0; left:10px;opacity:0.65;"></div>
                </span>
                &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
    },
    gunTechText(choose, click) {
        const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
        return `<div class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
                <div class="card-text">
                <div class="grid-title">         
                <span style="position:relative;">
                    <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                    <div class="circle-grid gun" style="position:absolute; top:0; left:10px; opacity:0.65;"></div>
                </span>
                &nbsp; &nbsp; &nbsp; &nbsp;  &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
    },
    junkTechText(choose, click) {
        const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-size: contain;background-repeat: no-repeat;background-image: url('img/junk.webp');"`
        if (!localSettings.isHideImages) {
            setTimeout(() => { //delay so that the html element exists
                if (tech.tech[choose].url === undefined) { //if on url has been set yet
                    const url = "https://images.search.yahoo.com/search/images?p=" + tech.tech[choose].name;
                    fetch(url, { signal: AbortSignal.timeout(1000) }) //give up if it takes over 1 second
                        .then((response) => response.text())
                        .then((html) => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, "text/html");
                            const elements = doc.getElementsByClassName("ld");
                            // console.log(i, elements[i].getAttribute("data"), JSON.parse(elements[i].getAttribute("data")).iurl)
                            const index = Math.floor(Math.random() * 4) //randomly choose from the first 4 images
                            if (parseInt(JSON.parse(elements[index].getAttribute("data")).s.slice(0, -2)) < 500) { //make sure it isn't too big
                                tech.tech[choose].url = JSON.parse(elements[index].getAttribute("data")).iurl //store the url
                                document.getElementById(`junk-${choose}`).style.backgroundImage = `url('${tech.tech[choose].url}')` //make the url the background image
                            } else if (parseInt(JSON.parse(elements[index + 1].getAttribute("data")).s.slice(0, -2)) < 500) { //try a different images and see if it is smaller
                                tech.tech[choose].url = JSON.parse(elements[index + 1].getAttribute("data")).iurl
                                document.getElementById(`junk-${choose}`).style.backgroundImage = `url('${tech.tech[choose].url}')`
                            } else if (parseInt(JSON.parse(elements[index + 2].getAttribute("data")).s.slice(0, -2)) < 500) { //try a different images and see if it is smaller
                                tech.tech[choose].url = JSON.parse(elements[index + 2].getAttribute("data")).iurl
                                document.getElementById(`junk-${choose}`).style.backgroundImage = `url('${tech.tech[choose].url}')`
                            }
                        });
                } else {
                    document.getElementById(`junk-${choose}`).style.backgroundImage = `url('${tech.tech[choose].url}')`
                }
            }, 1);
        }
        return `<div id = "junk-${choose}" class="choose-grid-module card-background" onclick="${click}" onauxclick="${click}"${style}>
                <div class="card-text">
                <div class="grid-title"><div class="circle-grid junk"></div> &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
    },
    incoherentTechText(choose, click) {
        // text += `<div class="choose-grid-module" style = "background-color: #efeff5; border: 0px; opacity:0.5; font-size: 60%; line-height: 130%; margin: 1px; padding-top: 6px; padding-bottom: 6px;"><div class="grid-title">${tech.tech[choose].name} <span style = "color: #aaa;font-weight: normal;font-size:80%;">- incoherent</span></div></div>`
        const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
        return `<div class="choose-grid-module card-background" ${style}>
                <div class="card-text" style = "background-color: #efeff5;">
                <div class="grid-title" style = "color: #ddd;font-weight: normal;">incoherent</div> <br> <br>
                </div></div>`
    },
    gun: {
        name: "gun",
        color: "#26a",
        size() {
            return 35;
        },
        effect() {
            if (m.alive) {
                let options = [];
                for (let i = 0; i < b.guns.length; i++) {
                    if (!b.guns[i].have) options.push(i);
                }
                // console.log(options.length)
                if (options.length > 0 || !tech.isSuperDeterminism) {
                    let totalChoices = Math.min(options.length, (tech.isDeterminism ? 1 : 2 + tech.extraChoices + 2 * (m.fieldMode === 8)))
                    if (tech.isFlipFlopChoices) totalChoices += tech.isRelay ? (tech.isFlipFlopOn ? -1 : 7) : (tech.isFlipFlopOn ? 7 : -1) //flip the order for relay
                    function removeOption(index) {
                        for (let i = 0; i < options.length; i++) {
                            if (options[i] === index) {
                                options.splice(i, 1) //remove a previous choice from option pool
                                return
                            }
                        }
                    }
                    //check for guns that were a choice last time and remove them
                    for (let i = 0; i < b.guns.length; i++) {
                        if (options.length - 1 < totalChoices) break //you have to repeat choices if there are not enough choices left to display
                        if (b.guns[i].isRecentlyShown) removeOption(i)
                    }
                    for (let i = 0; i < b.guns.length; i++) b.guns[i].isRecentlyShown = false //reset recently shown back to zero
                    // if (options.length > 0) {
                    let text = powerUps.buildColumns(totalChoices, "gun")
                    for (let i = 0; i < totalChoices; i++) {
                        const choose = options[Math.floor(Math.seededRandom(0, options.length))] //pick an element from the array of options                        
                        // text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${choose})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[choose].name}</div> ${b.guns[choose].description}</div>`
                        text += powerUps.gunText(choose, `powerUps.choose('gun',${choose})`)

                        b.guns[choose].isRecentlyShown = true
                        removeOption(choose)
                        if (options.length < 1) break
                    }
                    if (tech.isExtraBotOption) {
                        const botTech = [] //make an array of bot options
                        for (let i = 0, len = tech.tech.length; i < len; i++) {
                            if (tech.tech[i].isBotTech && tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed()) botTech.push(i)
                        }
                        if (botTech.length > 0) { //pick random bot tech
                            const choose = botTech[Math.floor(Math.random() * botTech.length)];
                            const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
                            const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
                            text += `<div class="choose-grid-module card-background" onclick="powerUps.choose('tech',${choose})" ${style}>
                                    <div class="card-text">
                                    <div class="grid-title"><span  style = "font-size: 150%;font-family: 'Courier New', monospace;">⭓▸●■</span> &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                                    ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
                        }
                    }
                    if (tech.isOneGun && b.inventory.length > 0) text += `<div style = "color: #f24">replaces your current gun</div>`
                    document.getElementById("choose-grid").innerHTML = text
                    powerUps.showDraft();
                }
                // }
            }
        },
    },
    field: {
        name: "field",
        color: "#0cf",
        size() {
            return 45;
        },
        effect() {
            if (m.alive) {
                let options = [];
                for (let i = 1; i < m.fieldUpgrades.length; i++) { //skip field emitter
                    if (i !== m.fieldMode) options.push(i);
                }
                let totalChoices = Math.min(options.length, (tech.isDeterminism ? 1 : 2 + tech.extraChoices + 2 * (m.fieldMode === 8)))
                if (tech.isFlipFlopChoices) totalChoices += tech.isRelay ? (tech.isFlipFlopOn ? -1 : 7) : (tech.isFlipFlopOn ? 7 : -1) //flip the order for relay

                function removeOption(index) {
                    for (let i = 0; i < options.length; i++) {
                        if (options[i] === index) {
                            options.splice(i, 1) //remove a previous choice from option pool
                            return
                        }
                    }
                }
                //check for fields that were a choice last time and remove them
                for (let i = 0; i < m.fieldUpgrades.length; i++) {
                    if (options.length - 1 < totalChoices) break //you have to repeat choices if there are not enough choices left to display
                    if (m.fieldUpgrades[i].isRecentlyShown) removeOption(i)
                }
                for (let i = 0; i < m.fieldUpgrades.length; i++) m.fieldUpgrades[i].isRecentlyShown = false //reset recently shown back to zero

                if (options.length > 0 || tech.isExtraBotOption) {
                    let text = powerUps.buildColumns(totalChoices, "field")
                    for (let i = 0; i < totalChoices; i++) {
                        const choose = options[Math.floor(Math.seededRandom(0, options.length))] //pick an element from the array of options
                        //text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${choose})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[choose].name}</div> ${m.fieldUpgrades[choose].description}</div>`                         //default
                        text += powerUps.fieldText(choose, `powerUps.choose('field',${choose})`)
                        m.fieldUpgrades[choose].isRecentlyShown = true
                        removeOption(choose)
                        if (options.length < 1) break
                    }
                    if (tech.isExtraBotOption) {
                        const botTech = [] //make an array of bot options
                        for (let i = 0, len = tech.tech.length; i < len; i++) {
                            if (tech.tech[i].isBotTech && tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed()) botTech.push(i)
                        }
                        if (botTech.length > 0) { //pick random bot tech
                            const choose = botTech[Math.floor(Math.random() * botTech.length)];
                            const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
                            const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
                            text += `<div class="choose-grid-module card-background" onclick="powerUps.choose('tech',${choose})" ${style}>
                                    <div class="card-text">
                                    <div class="grid-title"><span  style = "font-size: 150%;font-family: 'Courier New', monospace;">⭓▸●■</span> &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                                    ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
                        }
                    }
                    document.getElementById("choose-grid").innerHTML = text
                    powerUps.showDraft();
                }
            }
        },
    },
    tech: {
        name: "tech",
        color: "hsl(246,100%,77%)", //"#a8f",
        size() {
            return 42;
        },
        effect() {
            if (m.alive) {
                // powerUps.animatePowerUpGrab('hsla(246, 100%, 77%,0.5)')
                let options = []; //generate all options
                optionLengthNoDuplicates = 0
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isBanished) {
                        if (tech.tech[i].frequency > 0) optionLengthNoDuplicates++
                        for (let j = 0, len = tech.tech[i].frequency; j < len; j++) options.push(i);
                    }
                }
                function removeOption(index) {
                    for (let i = options.length - 1; i > -1; i--) {
                        if (index === options[i]) {
                            options.splice(i, 1) //remove all copies of that option form the options array (some tech are in the options array multiple times because of frequency)
                            optionLengthNoDuplicates--
                        }
                        if (options.length < 1) return;
                    }
                }
                //set total choices
                let totalChoices = (tech.isDeterminism ? 1 : 3 + tech.extraChoices + 2 * (m.fieldMode === 8))
                if (tech.isFlipFlopChoices) totalChoices += tech.isRelay ? (tech.isFlipFlopOn ? -1 : 7) : (tech.isFlipFlopOn ? 7 : -1) //flip the order for relay
                if (optionLengthNoDuplicates < totalChoices + 1) { //if not enough options for all the choices
                    totalChoices = optionLengthNoDuplicates
                    if (tech.isBanish) { //when you run out of options eject banish
                        for (let i = 0, len = tech.tech.length; i < len; i++) {
                            if (tech.tech[i].name === "decoherence") powerUps.ejectTech(i, true)
                        }
                        simulation.makeTextLog(`decoherence <span class='color-var'>tech</span> ejected`)
                        simulation.makeTextLog(`options reset`)
                    }
                }
                if (tech.tooManyTechChoices) {
                    tech.tooManyTechChoices = false
                    totalChoices = optionLengthNoDuplicates
                }
                if (optionLengthNoDuplicates > totalChoices) { //check for tech that were a choice last time and remove them
                    for (let i = 0; i < tech.tech.length; i++) {
                        if (optionLengthNoDuplicates > totalChoices) {
                            if (tech.tech[i].isRecentlyShown) removeOption(i)
                        } else {
                            break //you have to repeat choices if there are not enough choices left to display
                        }

                    }
                }
                for (let i = 0; i < tech.tech.length; i++) tech.tech[i].isRecentlyShown = false //reset recently shown back to zero
                if (options.length > 0) {
                    let text = powerUps.buildColumns(totalChoices, "tech")
                    for (let i = 0; i < totalChoices; i++) {
                        if (options.length < 1) break
                        const choose = options[Math.floor(Math.seededRandom(0, options.length))] //pick an element from the array of options
                        if (tech.isBanish) {
                            tech.tech[choose].isBanished = true
                            if (i === 0) simulation.makeTextLog(`options.length = ${optionLengthNoDuplicates} <span class='color-text'>//tech removed from pool by decoherence</span>`)
                        }
                        removeOption(choose) //move from future options pool to avoid repeats on this selection
                        tech.tech[choose].isRecentlyShown = true //this flag prevents this option from being shown the next time you pick up a tech power up
                        if (Math.random() < tech.junkChance) { // choose is set to a random JUNK tech
                            const list = []
                            for (let i = 0; i < tech.tech.length; i++) {
                                if (tech.tech[i].isJunk) list.push(i)
                            }
                            chooseJUNK = list[Math.floor(Math.random() * list.length)]
                            text += powerUps.junkTechText(chooseJUNK, `powerUps.choose('tech',${chooseJUNK})`)
                        } else {
                            if (tech.tech[choose].isFieldTech) {
                                text += powerUps.fieldTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isGunTech) {
                                text += powerUps.gunTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isJunk) {
                                text += powerUps.junkTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isSkin) {
                                text += powerUps.skinTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isInstant) {
                                text += powerUps.instantTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else { //normal tech
                                text += powerUps.techText(choose, `powerUps.choose('tech',${choose})`)
                            }
                            if (options.length < 1) break
                        }
                    }
                    if (tech.isExtraBotOption) {
                        const botTech = [] //make an array of bot options
                        for (let i = 0, len = tech.tech.length; i < len; i++) {
                            if (tech.tech[i].isBotTech && tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed() && !tech.tech[i].isRecentlyShown) botTech.push(i)
                        }
                        if (botTech.length > 0) { //pick random bot tech
                            // const choose = botTech[Math.floor(Math.random() * botTech.length)];
                            // const isCount = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count+1}x)` : "";
                            // text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title">          <span  style = "font-size: 150%;font-family: 'Courier New', monospace;">⭓▸●■</span>  &nbsp; ${tech.tech[choose].name} ${isCount}</div>          ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div>`
                            const choose = botTech[Math.floor(Math.random() * botTech.length)];
                            const techCountText = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
                            const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
                            text += `<div class="choose-grid-module card-background" onclick="powerUps.choose('tech',${choose})" ${style}>
                                    <div class="card-text">
                                    <div class="grid-title"><span  style = "font-size: 150%;font-family: 'Courier New', monospace;">⭓▸●■</span> &nbsp; ${tech.tech[choose].name} ${techCountText}</div>
                                    ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
                        }
                    }
                    if (tech.isMassProduction) {
                        // const techOptions = [] //make an array of bot options
                        // for (let i = 0, len = tech.tech.length; i < len; i++) {
                        //     if (tech.tech[i].isMassProduction) techOptions.push(i)
                        // }
                        // if (techOptions.length > 0) { //pick random bot tech
                        //     const choose = techOptions[Math.floor(Math.random() * techOptions.length)];
                        //     const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[choose].name}.webp');"`
                        //     text += `<div class="choose-grid-module card-background" onclick="powerUps.choose('tech',${choose})" ${style}>
                        //             <div class="card-text">
                        //             <div class="grid-title">${tech.tech[choose].name}</div>
                        //             ${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div></div>`
                        // }
                        for (let i = 0, len = tech.tech.length; i < len; i++) {
                            if (tech.tech[i].isMassProduction) {
                                const style = localSettings.isHideImages ? powerUps.hideStyle : `style="background-image: url('img/${tech.tech[i].name}.webp');"`
                                text += `<div class="choose-grid-module card-background" onclick="powerUps.choose('tech',${i})" ${style}>
                                        <div class="card-text">
                                        <div class="grid-title">${tech.tech[i].name}</div>
                                        ${tech.tech[i].descriptionFunction ? tech.tech[i].descriptionFunction() : tech.tech[i].description}</div></div>`
                            }
                        }
                    }
                    if (tech.isExtraGunField) {
                        if (Math.random() > 0.5 && b.inventory.length < b.guns.length) {
                            let gunOptions = [];
                            for (let i = 0; i < b.guns.length; i++) {
                                if (!b.guns[i].have) gunOptions.push(i);
                            }
                            const pick = gunOptions[Math.floor(Math.seededRandom(0, gunOptions.length))] //pick an element from the array of options
                            // text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${pick})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[pick].name}</div> ${b.guns[pick].description}</div>`
                            text += powerUps.gunText(pick, `powerUps.choose('gun',${pick})`)
                        } else {
                            let fieldOptions = [];
                            for (let i = 1; i < m.fieldUpgrades.length; i++) { //skip field emitter
                                if (i !== m.fieldMode) fieldOptions.push(i);
                            }
                            const pick = fieldOptions[Math.floor(Math.seededRandom(0, fieldOptions.length))] //pick an element from the array of options
                            // text += `<div class="choose-grid-module" onclick="powerUps.choose('field',${pick})"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${m.fieldUpgrades[pick].name}</div> ${m.fieldUpgrades[pick].description}</div>`
                            text += powerUps.fieldText(pick, `powerUps.choose('field',${pick})`)
                        }
                    }
                    if (tech.isBrainstorm && !tech.isBrainstormActive && !simulation.isChoosing) {
                        tech.isBrainstormActive = true
                        let count = 1
                        let timeStart = performance.now()
                        const cycle = (timestamp) => {
                            // if (timeStart === undefined) timeStart = timestamp
                            // console.log(timestamp, timeStart)
                            if (timestamp - timeStart > tech.brainStormDelay * count && simulation.isChoosing) {
                                count++
                                powerUps.tech.effect();
                                document.getElementById("choose-grid").style.pointerEvents = "auto"; //turn off the normal 500ms delay
                                document.body.style.cursor = "auto";
                                document.getElementById("choose-grid").style.transitionDuration = "0s";
                            }
                            if (count < 10 && simulation.isChoosing) {
                                requestAnimationFrame(cycle);
                            } else {
                                tech.isBrainstormActive = false
                            }
                        }
                        requestAnimationFrame(cycle);
                    }
                    document.getElementById("choose-grid").innerHTML = text
                    powerUps.showDraft();
                }
            }
        },
    },
    entanglement: {
        name: "entanglement",
        color: "#fff", //"hsl(248,100%,65%)",
        size() {
            return 40
        },
        effect() {
            if (m.alive && localSettings.entanglement) {
                // let text = ""
                // document.getElementById("choose-grid").style.gridTemplateColumns = "384px 384px 384px"
                let text = powerUps.buildColumns(3, "entanglement")

                // text += powerUps.researchText('tech')
                // text += "<div></div>"
                // text += "<div class='choose-grid-module entanglement flipX'>entanglement</div>"
                // text += `<div class='choose-grid-module' onclick='powerUps.endDraft("tech",true)' style="width: 82px; text-align: center;font-size: 1.1em;font-weight: 100;justify-self: end;">cancel</div>` //powerUps.cancelText('tech')
                if (localSettings.entanglement.fieldIndex && localSettings.entanglement.fieldIndex !== m.fieldMode) {
                    const choose = localSettings.entanglement.fieldIndex //add field
                    text += powerUps.fieldText(choose, `powerUps.choose('field',${choose})`)
                }
                for (let i = 0; i < localSettings.entanglement.gunIndexes.length; i++) { //add guns
                    const choose = localSettings.entanglement.gunIndexes[i]
                    //check if you always have this gun
                    let alreadyHasGun = false
                    for (let j = 0; j < b.inventory.length; j++) {
                        if (b.inventory[j] === choose) alreadyHasGun = true
                    }
                    // text += `<div class="choose-grid-module" onclick="powerUps.choose('gun',${gun})"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[gun].name}</div> ${b.guns[gun].description}</div>`
                    if (!alreadyHasGun) text += powerUps.gunText(choose, `powerUps.choose('gun',${choose})`)
                }
                for (let i = 0; i < localSettings.entanglement.techIndexes.length; i++) { //add tech
                    let choose = localSettings.entanglement.techIndexes[i]
                    if (tech.tech[choose]) {
                        const isCount = tech.tech[choose].count > 0 ? `(${tech.tech[choose].count + 1}x)` : "";
                        if (choose === null || tech.tech[choose].count + 1 > tech.tech[choose].maxCount || !tech.tech[choose].allowed()) {
                            // text += `<div class="choose-grid-module" style = "background-color: #efeff5; border: 0px; opacity:0.5; font-size: 60%; line-height: 130%; margin: 1px; padding-top: 6px; padding-bottom: 6px;"><div class="grid-title">${tech.tech[choose].name} <span style = "color: #aaa;font-weight: normal;font-size:80%;">- incoherent</span></div></div>`
                            text += powerUps.incoherentTechText(choose)
                        } else {
                            if (tech.tech[choose].isFieldTech) {
                                text += powerUps.fieldTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isGunTech) {
                                text += powerUps.gunTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isLore) {
                                text += `<div class="choose-grid-module" onclick="powerUps.choose('tech',${choose})"><div class="grid-title lore-text"><div class="circle-grid lore"></div> &nbsp; ${tech.tech[choose].name} ${isCount}</div>${tech.tech[choose].descriptionFunction ? tech.tech[choose].descriptionFunction() : tech.tech[choose].description}</div>`
                            } else if (tech.tech[choose].isJunk) {
                                text += powerUps.junkTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isSkin) {
                                text += powerUps.skinTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else if (tech.tech[choose].isInstant) {
                                text += powerUps.instantTechTextTechText(choose, `powerUps.choose('tech',${choose})`)
                            } else { //normal tech
                                text += powerUps.techText(choose, `powerUps.choose('tech',${choose})`)
                            }
                        }
                    }
                }
                // document.getElementById("choose-grid").classList.add("flipX");
                document.getElementById("choose-grid").innerHTML = text
                powerUps.showDraft();
                localSettings.entanglement = undefined
                if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            }
        },
    },
    spawnDelay(type, count) {
        count *= 2
        let cycle = () => {
            if (count > 0) {
                if (m.alive) requestAnimationFrame(cycle);
                if (!simulation.paused && !simulation.isChoosing) { //&& !(simulation.cycle % 2)
                    count--
                    if (!(count % 2)) {
                        const where = { x: m.pos.x + 50 * (Math.random() - 0.5), y: m.pos.y + 50 * (Math.random() - 0.5) }
                        powerUps.spawn(where.x, where.y, type);
                    }
                }
            }
        }
        requestAnimationFrame(cycle);
    },
    onPickUp(who) {
        powerUps.research.currentRerollCount = 0
        if (tech.isTechDamage && who.name === "tech") m.damage(0.1)
        if (tech.isMassEnergy) m.energy += 2;
        if (tech.isMineDrop && bullet.length < 150 && Math.random() < 0.5) {
            if (tech.isLaserMine && input.down) {
                b.laserMine(who.position)
            } else {
                b.mine(who.position, { x: 0, y: 0 }, 0)
            }
        }
        if (tech.isRelay) {
            if (tech.isFlipFlopOn) {
                tech.isFlipFlopOn = false
                if (document.getElementById("tech-switch")) document.getElementById("tech-switch").innerHTML = ` = <strong>OFF</strong>`
                m.eyeFillColor = 'transparent'
            } else {
                tech.isFlipFlopOn = true //immune to damage this hit, lose immunity for next hit
                if (document.getElementById("tech-switch")) document.getElementById("tech-switch").innerHTML = ` = <strong>ON</strong>`
                m.eyeFillColor = m.fieldMeterColor //'#0cf'
            }
            if (tech.isRelayEnergy) m.setMaxEnergy();
        }
    },
    spawnRandomPowerUp(x, y) { //mostly used after mob dies,  doesn't always return a power up
        if (!tech.isEnergyHealth && (Math.random() * Math.random() - 0.3 > Math.sqrt(m.health)) || Math.random() < 0.04) { //spawn heal chance is higher at low health
            powerUps.spawn(x, y, "heal");
            return;
        }
        if (Math.random() < 0.15 && b.inventory.length > 0) {
            powerUps.spawn(x, y, "ammo");
            return;
        }
        if (Math.random() < 0.0007 * (3 - b.inventory.length)) { //a new gun has a low chance for each not acquired gun up to 3
            powerUps.spawn(x, y, "gun");
            return;
        }
        // if (Math.random() < 0.0027 * (22 - tech.totalCount)) { //a new tech has a low chance for each not acquired tech up to 25
        if (Math.random() < 0.005 * (10 - level.levelsCleared)) { //a new tech has a low chance that decreases in later levels
            powerUps.spawn(x, y, "tech");
            return;
        }
        if (Math.random() < 0.0015) {
            powerUps.spawn(x, y, "field");
            return;
        }
        if (tech.isCouplingPowerUps && Math.random() < 0.17) {
            powerUps.spawn(x, y, "coupling");
            return;
        }
        if (tech.isBoostPowerUps && Math.random() < 0.14) {
            powerUps.spawn(x, y, "boost");
            return;
        }
        // if (Math.random() < 0.01) {
        //   powerUps.spawn(x, y, "research");
        //   return;
        // }
    },
    randomPowerUpCounter: 0,
    isFieldSpawned: false, //makes it so a field spawns once but not more times
    spawnBossPowerUp(x, y) { //boss spawns field and gun tech upgrades
        if (level.levels[level.onLevel] !== "final") {
            // if (level.levelsCleared === 1) powerUps.spawn(x, y, "field")
            // if (m.fieldMode === 0 && !m.coupling) {
            if (!powerUps.isFieldSpawned) {
                powerUps.isFieldSpawned = true
                powerUps.spawn(x, y, "field")
            } else {
                powerUps.randomPowerUpCounter++;
                powerUpChance(Math.max(level.levelsCleared, 10) * 0.1)
            }
            if (!(simulation.difficulty > spawn.secondaryBossThreshold)) {
                powerUps.randomPowerUpCounter += 0.6;
                powerUpChance(Math.max(level.levelsCleared, 6) * 0.1)
            }

            function powerUpChance(chanceToFail) {
                if (Math.random() * chanceToFail < powerUps.randomPowerUpCounter) {
                    powerUps.randomPowerUpCounter = 0;
                    if (Math.random() < 0.97) {
                        powerUps.spawn(x, y, "tech")
                    } else {
                        powerUps.spawn(x, y, "gun")
                    }
                } else {
                    if (m.health < 0.65 && !tech.isEnergyHealth) {
                        powerUps.spawn(x, y, "heal");
                        powerUps.spawn(x, y, "heal");
                    } else {
                        powerUps.spawn(x, y, "ammo");
                        powerUps.spawn(x, y, "ammo");
                    }
                }
            }
            if (tech.isAddRemoveMaxHealth) {
                powerUps.spawn(x + 20, y, "tech", false)
                powerUps.spawn(x - 20, y, "research", false)
                powerUps.spawn(x - 40, y, "research", false)
                powerUps.spawn(x + 40, y, "research", false)
                powerUps.spawn(x, y + 20, "research", false)
                powerUps.spawn(x, y - 20, "heal", false)
                powerUps.spawn(x, y + 40, "heal", false)
                powerUps.spawn(x, y - 40, "heal", false)
            }
            if (tech.isResearchReality) powerUps.spawnDelay("research", 5)
            if (tech.isBanish) powerUps.spawnDelay("research", 2)
            if (tech.isCouplingNoHit) powerUps.spawnDelay("coupling", 9)
            // if (tech.isRerollDamage) powerUps.spawnDelay("research", 1)
        }
    },
    chooseRandomPowerUp(x, y) { //100% chance to drop a random power up    //used in spawn.debris
        if (Math.random() < 0.5) {
            powerUps.spawn(x, y, "heal", false);
        } else {
            powerUps.spawn(x, y, "ammo", false);
        }
    },
    addResearchToLevel() { //add a random power up to a location that has a mob,  mostly used to give each level one randomly placed research
        if (mob.length && Math.random() < 0.45 - 0.3 * (simulation.difficultyMode > 4)) { //lower chance on why difficulty
            const index = Math.floor(Math.random() * mob.length)
            powerUps.spawn(mob[index].position.x, mob[index].position.y, "research");
        }
    },
    spawnStartingPowerUps(x, y) { //used for map specific power ups, mostly to give player a starting gun
        if (level.levelsCleared < 4) { //runs on first 4 levels on all difficulties
            if (level.levelsCleared > 1) powerUps.spawn(x, y, "tech")
            if (b.inventory.length === 0) {
                powerUps.spawn(x, y, "gun", false); //first gun
            } else if (tech.totalCount === 0) { //first tech
                powerUps.spawn(x, y, "tech", false);
            } else if (b.inventory.length === 1) { //second gun or extra ammo
                if (Math.random() < 0.4) {
                    powerUps.spawn(x, y, "gun", false);
                } else {
                    for (let i = 0; i < 5; i++) powerUps.spawn(x, y, "ammo", false);
                }
            } else {
                for (let i = 0; i < 4; i++) powerUps.spawnRandomPowerUp(x, y);
            }
        } else { //after the first 4 levels just spawn a random power up
            for (let i = 0; i < 3; i++) powerUps.spawnRandomPowerUp(x, y);
        }
    },
    ejectTech(choose = 'random', isOverride = false) {
        if (!simulation.isChoosing || isOverride) {
            // console.log(tech.tech[choose].name, tech.tech[choose].count, tech.tech[choose].isInstant)
            //find which tech you have
            if (choose === 'random') {
                const have = []
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].count > 0 && !tech.tech[i].isInstant) have.push(i)
                }
                // if (have.length === 0) {
                //     for (let i = 0; i < tech.tech.length; i++) {
                //         if (tech.tech[i].count > 0) have.push(i)
                //     }
                // }

                if (have.length) {
                    choose = have[Math.floor(Math.random() * have.length)]
                    simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)

                    for (let i = 0; i < tech.tech[choose].count; i++) {
                        powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
                        // powerUp[powerUp.length - 1].isDuplicated = true
                    }
                    // remove a random tech from the list of tech you have
                    tech.removeCount += tech.tech[choose].count
                    tech.tech[choose].remove();
                    tech.tech[choose].count = 0;
                    tech.tech[choose].isLost = true;
                    simulation.updateTechHUD();
                    m.fieldCDcycle = m.cycle + 30; //disable field so you can't pick up the ejected tech
                    return true
                } else {
                    return false
                }
            } else if (tech.tech[choose].count && !tech.tech[choose].isInstant) {
                simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)

                for (let i = 0; i < tech.tech[choose].count; i++) {
                    powerUps.directSpawn(m.pos.x, m.pos.y, "tech");
                    powerUp[powerUp.length - 1].isDuplicated = true
                }
                // remove a random tech from the list of tech you have
                tech.tech[choose].remove();
                tech.removeCount += tech.tech[choose].count
                tech.tech[choose].count = 0;
                tech.tech[choose].isLost = true;
                simulation.updateTechHUD();
                m.fieldCDcycle = m.cycle + 30; //disable field so you can't pick up the ejected tech
                return true
            } else {
                return false
            }
        }
    },
    pauseEjectTech(index) {
        if ((tech.isPauseEjectTech || simulation.testing) && !simulation.isChoosing && !tech.tech[index].isInstant) {
            // if (tech.tech[index].bonusResearch !== undefined && tech.tech[index].bonusResearch > powerUps.research.count) {
            //     tech.removeTech(index)
            // } else {
            // }
            powerUps.ejectTech(index)
            m.damage(0.04)
            document.getElementById(`${index}-pause-tech`).style.textDecoration = "line-through"
            document.getElementById(`${index}-pause-tech`).style.animation = ""
            document.getElementById(`${index}-pause-tech`).onclick = null
        }
    },
    randomize(where) { //makes a random power up convert into a random different power up
        //put 10 power ups close together
        const len = Math.min(10, powerUp.length)
        for (let i = 0; i < len; i++) { //collide the first 10 power ups
            const unit = Vector.rotate({ x: 1, y: 0 }, 6.28 * Math.random())
            Matter.Body.setPosition(powerUp[i], Vector.add(where, Vector.mult(unit, 20 + 25 * Math.random())));
            Matter.Body.setVelocity(powerUp[i], Vector.mult(unit, 20));
        }

        //count big power ups and small power ups
        let options = ["heal", "research", "ammo"]
        if (m.coupling) options.push("coupling")
        if (tech.isBoostPowerUps) options.push("boost")
        let bigIndexes = []
        let smallIndexes = []
        for (let i = 0; i < powerUp.length; i++) {
            if (powerUp[i].name === "tech" || powerUp[i].name === "gun" || powerUp[i].name === "field") {
                bigIndexes.push(i)
            } else {
                smallIndexes.push(i)
            }
        }
        if (bigIndexes.length > 0) {
            // console.log("at least 1 big will always spilt")
            const index = bigIndexes[Math.floor(Math.random() * bigIndexes.length)]
            for (let i = 0; i < 3; i++) powerUps.directSpawn(where.x, where.y, options[Math.floor(Math.random() * options.length)], false)

            Matter.Composite.remove(engine.world, powerUp[index]);
            powerUp.splice(index, 1);
        } else if (smallIndexes.length > 2 && Math.random() < 0.33) {
            // console.log("no big, at least 3 small can combine")
            for (let j = 0; j < 3; j++) {
                for (let i = 0; i < powerUp.length; i++) {
                    if (powerUp[i].name === "heal" || powerUp[i].name === "research" || powerUp[i].name === "ammo" || powerUp[i].name === "coupling" || powerUp[i].name === "boost") {
                        Matter.Composite.remove(engine.world, powerUp[i]);
                        powerUp.splice(i, 1);
                        break
                    }
                }
            }

            options = ["tech", "gun", "field"]
            powerUps.directSpawn(where.x, where.y, options[Math.floor(Math.random() * options.length)], false)
        } else if (smallIndexes.length > 0) {
            // console.log("no big, at least 1 small will swap flavors")
            const index = Math.floor(Math.random() * powerUp.length)
            options = options.filter(e => e !== powerUp[index].name); //don't repeat the current power up type
            powerUps.directSpawn(where.x, where.y, options[Math.floor(Math.random() * options.length)], false)
            Matter.Composite.remove(engine.world, powerUp[index]);
            powerUp.splice(index, 1);
        }
    },
    directSpawn(x, y, target, moving = true, mode = null, size = powerUps[target].size(), isDuplicated = false) {
        let index = powerUp.length;
        let properties = {
            density: 0.001,
            frictionAir: 0.03,
            restitution: 0.85,
            collisionFilter: {
                group: 0,
                category: cat.powerUp,
                mask: cat.map | cat.powerUp
            },
            color: powerUps[target].color,
            effect: powerUps[target].effect,
            name: powerUps[target].name,
            size: size
        }
        let polygonSides
        if (isDuplicated) {
            polygonSides = tech.isPowerUpsVanish ? 3 : Math.floor(4 + 2 * Math.random())
            properties.isDuplicated = true
        } else {
            properties.inertia = Infinity //prevents rotation for circles only
            polygonSides = 0
        }
        powerUp[index] = Matter.Bodies.polygon(x, y, polygonSides, size, properties);
        if (mode) powerUp[index].mode = mode
        if (moving) Matter.Body.setVelocity(powerUp[index], { x: (Math.random() - 0.5) * 15, y: Math.random() * -9 - 3 });
        Composite.add(engine.world, powerUp[index]);
    },
    spawn(x, y, target, moving = true, mode = null, size = powerUps[target].size()) {
        if (
            (!tech.isSuperDeterminism || (target !== 'research')) &&
            !(tech.isEnergyNoAmmo && target === 'ammo')
        ) {
            if (tech.isBoostReplaceAmmo && target === 'ammo') target = 'boost'
            powerUps.directSpawn(x, y, target, moving, mode, size)
            if (Math.random() < tech.duplicationChance()) {
                powerUps.directSpawn(x, y, target, moving, mode, size, true)
                powerUp[powerUp.length - 1].isDuplicated = true
                // if (tech.isPowerUpsVanish) powerUp[powerUp.length - 1].endCycle = simulation.cycle + 300
            }
        }
    },
};