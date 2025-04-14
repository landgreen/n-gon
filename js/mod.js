//Mod menu block
mod = {}
mod.injected = false
mod.modMenuHTML = '<div>\n            <details id="modmenu">\n                <summary>mods</summary>\n                <div id="modmenu-div" class="details-div" style="font-size: 70%;height: 400px;overflow: scroll;max-width: 50rem;">\n                  <input onclick="mod.qolToggle();" type="checkbox" id="mod-qol" name="QoL mod" style="width:17px; height:17px;">\n                    <label for="mod-qol" title="Enable QoL mod">QoL mod</label>\n                    <br>\n                  <input onclick="mod.sytheToggle();" type="checkbox" id="mod-sythe" name="Sythe mods" style="width:17px; height:17px;">\n                    <label for="mod-sythe" title="Enable the sythe mods.">Sythe mods</label>\n                    <br>\n                  <input onclick="mod.randToggle();" type="checkbox" id="mod-rand" name="Random mod" style="width:17px; height:17px;">\n                    <label for="mod-sythe" title="Enable Random ideas mod">Random ideas mod</label>\n                    <br>\n                  <input onclick="mod.mobileToggle();" type="checkbox" id="mod-mobile" name="Mobile UI" style="width:17px; height:17px;">\n                    <label for="mod-mobile" title="Add Mobile UI">Mobile UI</label>\n                    <br>\n                  <input onclick="mod.controllerToggle();" type="checkbox" id="mod-controller" name="Controller" style="width:17px; height:17px;">\n                    <label for="mod-controller" title="Add Controller usage">Controller</label>\n                    <br>\n                  <input onclick="mod.stopwatchToggle();" type="checkbox" id="mod-stopwatch" name="Stopwatch" style="width:17px; height:17px;">\n                    <label for="mod-stopwatch" title="Add speedrun timer">Stopwatch</label>\n                    <br>\n                  <input onclick="mod.glassCannonToggle();" type="checkbox" id="mod-GC" name="Glass Cannon mod" style="width:17px; height:17px;">\n                    <label for="mod-GC" title="Enable glass cannon mod">Glass Cannon mod</label>\n                  <br>\n                  <label for="mod-GC-dmgMult" title="Damage multiplier" style="margin-left: 15px;">Damage multiplier:</label>\n                  <input type="text" id="mod-GC-dmgMult" name="damage multiplier" autocomplete="off" spellcheck="false" minlength="1" style="width: 120px;">\n                  <br>\n                  <label for="mod-GC-dmgTakenMult" title="Damage Taken multiplier" style="margin-left: 15px;">Damage Taken multiplier:</label>\n                  <input type="text" id="mod-GC-dmgTakenMult" name="damage taken multiplier" autocomplete="off" spellcheck="false" minlength="1" style="width: 120px;">\n                  <svg class="SVG-button SVG-button-splash" id="save-GC-button" width="81" height="20" stroke="none" fill="#333" font-size="10px" font-family="Arial, sans-serif" onclick="mod.saveGC()" style="margin-left: 15px;">\n                  <text x="10" y="10">Save</text>\n                  </svg>\n                  <br>\n                  <input onclick="mod.autoInjectToggle();" type="checkbox" id="mod-autoInject" name="AutoInject" style="width:17px; height:17px;">\n                    <label for="mod-autoInject" title="Automaticly inject mods when page opens.">AutoInjector</label>\n                    <br>\n                  <input onclick="mod.forceLoreToggle();" type="checkbox" id="mod-forceLore" name="ForceLore" style="width:17px; height:17px;">\n                    <label for="mod-forceLore" title="Force lore even with mods enabled.">Force Lore</label>\n                    <br>\n                  <svg class="SVG-button SVG-button-splash" id="inject-button" width="82" height="45" stroke="none" fill="#333" font-size="30px" font-family="Arial, sans-serif" onclick="mod.inject()">\n                  <text x="10" y="32">Inject</text>\n                  </svg>\n                </div>\n            </details>\n        </div>'
document.getElementById("info").innerHTML += mod.modMenuHTML
mod.aboutHTML = '<br><strong>Then some rando named btcool came along and modified my work.</strong><br>Credit to <a href="https://github.com/Whyisthisnotavalable/n-scythe"> Whyisthisnotavalable</a> for making the sythe mods.<br>Credit to <a href="https://github.com/Ant-Throw-Pology/n-qol">Ant-Throw-Pology</a> for making the QoL mod.<br>Credit to <a href="https://github.com/kgurchiek/">kgurchiek</a> for making the mobile mod and the controller mod and the stopwatch mod.<br>And of course, credit to <a href="https://github.com/landgreen/">landgreen</a> for making n-gon itself.'
document.getElementById("info").children[3].children[0].children[1].children[1].innerHTML += mod.aboutHTML
//Settings block
if (localSettings.doQoL === undefined) localSettings.doQoL = false
document.getElementById("mod-qol").checked = localSettings.doQoL
if (localSettings.doSythe === undefined) localSettings.doSythe = false
document.getElementById("mod-sythe").checked = localSettings.doSythe
if (localSettings.doRand === undefined) localSettings.doRand = false
document.getElementById("mod-rand").checked = localSettings.doRand
if (localSettings.doGlassCannon === undefined) localSettings.doGlassCannon = false
document.getElementById("mod-GC").checked = localSettings.doGlassCannon
if (localSettings.dmgTakenMult === undefined) localSettings.dmgTakenMult = 100
document.getElementById("mod-GC-dmgTakenMult").value = localSettings.dmgTakenMult
if (localSettings.dmgMult === undefined) localSettings.dmgMult = 100
document.getElementById("mod-GC-dmgMult").value = localSettings.dmgMult
if (localSettings.doMobile === undefined) localSettings.doMobile = false
document.getElementById("mod-mobile").checked = localSettings.doMobile
if (localSettings.doController === undefined) localSettings.doController = false
document.getElementById("mod-controller").checked = localSettings.doController
if (localSettings.doStopwatch === undefined) localSettings.doStopwatch = false
document.getElementById("mod-stopwatch").checked = localSettings.doStopwatch
if (localSettings.forceLore === undefined) localSettings.forceLore === false
document.getElementById("mod-forceLore").checked = localSettings.forceLore
if (localSettings.autoInject === undefined) localSettings.autoInject === false
document.getElementById("mod-autoInject").checked = localSettings.autoInject

//toggle block
mod.qolToggle = function() {
   localSettings.doQoL = !localSettings.doQoL
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.sytheToggle = function() {
   localSettings.doSythe = !localSettings.doSythe
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.randToggle = function() {
   localSettings.doRand = !localSettings.doRand
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.glassCannonToggle = function() {
   localSettings.doGlassCannon = !localSettings.doGlassCannon
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.autoInjectToggle = function() {
   localSettings.autoInject = !localSettings.autoInject
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.saveGC = function() {
  localSettings.dmgMult = document.getElementById("mod-GC-dmgMult").value
  localSettings.dmgTakenMult = document.getElementById("mod-GC-dmgTakenMult").value
  if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.mobileToggle = function() { 
  localSettings.doMobile = !localSettings.doMobile;
  if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.controllerToggle = function() { 
  localSettings.doController = !localSettings.doController;
  if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.stopwatchToggle = function() { 
  localSettings.doStopwatch = !localSettings.doStopwatch;
  if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
mod.forceLoreToggle = function() {
  localSettings.forceLore = !localSettings.forceLore;
  if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
}
//inject function
mod.inject = function() {
  mod.injected = true
  if (localSettings.doQoL) {mod.qol()};
  if (localSettings.doSythe) {mod.sythe(); mod.sword(); mod.spear(); mod.tachyon(); mod.fluid(); mod.minmap()};
  if (localSettings.doGlassCannon) {mod.glassCannon()};
  if (localSettings.doMobile) {mod.mobile()};
  if (localSettings.doController) {mod.controller()};
  if (localSettings.doStopwatch) {mod.stopwatch()};
  if (localSettings.doRand) {mod.randomID()};
  document.getElementById("inject-button").setAttribute("onclick",'alert("Already injected mods.")')
  document.getElementById("inject-button").setAttribute("disabled","disabled")
  document.getElementById("mod-qol").setAttribute("disabled","disabled")
  document.getElementById("mod-sythe").setAttribute("disabled","disabled")
  document.getElementById("mod-rand").setAttribute("disabled","disabled")
  document.getElementById("mod-GC").setAttribute("disabled","disabled")
  document.getElementById("mod-mobile").setAttribute("disabled","disabled")
  document.getElementById("mod-controller").setAttribute("disabled","disabled")
  document.getElementById("mod-stopwatch").setAttribute("disabled","disabled")
  if (!localSettings.forceLore) {mod.startGameOld = simulation.startGame; simulation.startGame = function() {mod.startGameOld(); tech.setCheating()}; mod.oldGeneratePauseLeft = build.generatePauseLeft; build.generatePauseLeft = function() { mod.oldGeneratePauseLeft(); document.getElementById("pause-grid-left").innerHTML = document.getElementById("pause-grid-left").innerHTML.replace("lore disabled","lore disabled due to mods")}}
  console.log("Injected mods");
}

//qol block
mod.qol = function() {const r=new XMLHttpRequest;r.open("GET", "https://raw.githubusercontent.com/Ant-Throw-Pology/n-qol/main/index.js");r.onloadend=function(){new Function(r.responseText)();};r.send();}
//spear block
mod.spear = function() {var r = new XMLHttpRequest(); r.open("GET", 'https://raw.githubusercontent.com/Whyisthisnotavalable/n-scythe/main/spear.js', true); r.onloadend = function (oEvent) {new Function(r.responseText)();}; r.send();}
//sword block
mod.sword = function() {var r = new XMLHttpRequest(); r.open("GET", 'https://raw.githubusercontent.com/Whyisthisnotavalable/n-scythe/main/sword.js', true); r.onloadend = function (oEvent) {new Function(r.responseText)();}; r.send();}

//sythe block
mod.sythe = function() {var r = new XMLHttpRequest(); r.open("GET", 'https://raw.githubusercontent.com/Whyisthisnotavalable/n-scythe/main/scythe.js', true); r.onloadend = function (oEvent) {new Function(r.responseText)();}; r.send();}

//tachyon block
mod.tachyon = function() {var r = new XMLHttpRequest(); r.open("GET", 'https://raw.githubusercontent.com/Whyisthisnotavalable/n-scythe/refs/heads/main/tachyonic field.js', true); r.onloadend = function (oEvent) {new Function(r.responseText)();}; r.send();}
// minmap block
mod.fluid = function() {var r = new XMLHttpRequest(); r.open("GET", 'https://raw.githubusercontent.com/Whyisthisnotavalable/n-scythe/main/fluid.js', true); r.onloadend = function (oEvent) {new Function(r.responseText)();}; r.send();}
mod.minmap = function() {var r = new XMLHttpRequest(); r.open("GET", 'https://raw.githubusercontent.com/Whyisthisnotavalable/n-scythe/main/minmap.js', true); r.onloadend = function (oEvent) {new Function(r.responseText)();}; r.send();}
// Random ideas block
mod.randomID = function() {
  alert("Random ideas not complete.");
  const t = [
		{
			name: "hazmat suit",
			descriptionFunction() {
				return `slime doesn't hurt you<br><strong>0.66x</strong> passive <strong>energy</strong> generation`
			},
			isFieldTech: true,
			maxCount: 1,
			count: 0,
			frequency: 2,
			frequencyDefault: 2,
			allowed() {
				return m.fieldMode === 1
			},
			requires: "standing wave",
			effect() {
				tech.hazmatSuit = true;
        m.setFieldRegen()
			},
			remove() {
				tech.hazmatSuit = false;
        m.setFieldRegen()
			}
		},
    {
			name: "partial time dialation",
			descriptionFunction() {
				return `slows mobs but not you. <strong>2x</strong> time slow length`
			},
			isFieldTech: true,
			maxCount: 1,
			count: 0,
			frequency: 2,
			frequencyDefault: 2,
			allowed() {
				return (m.fieldMode === 6 && !tech.isRewindField)
			},
			requires: "time dialation, not retro causality",
			effect() {
				tech.partTime = true;
        timeDilation.oldEffect = timeDilation.effect;
        timeDilation.effect = function() {
            ctx.globalCompositeOperation = "saturation"
            ctx.fillStyle = "#ccc";
            ctx.fillRect(-50000, -50000, 100000, 100000)
            ctx.globalCompositeOperation = "source-over"
        };
        eph = {
          name: "partTime",
          do() { for (let i = 0; i < mob.length; i++) {Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(mob[i].velocity), 0.3)); mob[i].angle = mob[i].anglePrev}} 
        };
        simulation.ephemera.push(eph);
      },
			remove() {
				tech.partTime = false;
        timeDilation.effect = timedilation.oldEffect;
			}
		},
    {
			name: "partial time dilation",
			descriptionFunction() {
				return `slows mobs but not you. <strong>2x</strong> time slow length`
			},
			isFieldTech: true,
			maxCount: 1,
			count: 0,
			frequency: 2,
			frequencyDefault: 2,
			allowed() {
				return (m.fieldMode === 6 && !tech.isRewindField)
			},
			requires: "time dilation, not retro causality",
			effect() {
        tech.partTime = true;
        eph = {
          name: "partTime",
          do() { for (let i = 0; i < mob.length; i++) {Matter.Body.setVelocity(mob[i], Vector.mult(Vector.normalise(mob[i].velocity), 0.3)); mob[i].angle = mob[i].anglePrev}} 
        };
        simulation.ephemera.push(eph);
        m.fieldUpgrades.find(function(input) {return input.name === "time dilation"}).effect = function() { console.log("hi") };
			},
			remove() {
				tech.partTime = false;
        simulation.removeEphemera("partTime");
			}
		},
    {
			name: "bipod",
			descriptionFunction() {
				return `<strong>shotgun</strong> has <strong>0.2x</strong> spread while crouching`
			},
			isGunTech: true,
			maxCount: 1,
			count: 0,
			frequency: 2,
			frequencyDefault: 2,
			allowed() {
				return (tech.haveGunCheck("shotgun") && tech.isNeedles && !tech.sniper)
			},
			requires: "shotgun, needlegun",
			effect() {
        tech.bipod = true
			},
			remove() {
				tech.bipod = false;
			}
		},
    {
			name: "sniper",
			descriptionFunction() {
				return `<strong>shotgun</strong> has <strong>negligible</strong> spread while crouching<br>supercedes bipod`
			},
			isGunTech: true,
			maxCount: 1,
			count: 0,
			frequency: 2,
			frequencyDefault: 2,
			allowed() {
				return (tech.haveGunCheck("shotgun") && tech.isNeedles && tech.bipod)
			},
			requires: "shotgun, needlegun, bipod",
			effect() {
        tech.sniper = true;
        tech.removeTech("bipod");
			},
			remove() {
				tech.sniper = false;
			}
		},
    {
			name: "world peace",
			descriptionFunction() {
				return `<strong>shotgun</strong> has <strong>negligible</strong> spread while crouching<br>supercedes bipod`
			},
			isJunkTech: true,
			maxCount: 1,
			count: 0,
			frequency: 2,
			frequencyDefault: 2,
			allowed() {
				return true
			},
			requires: "",
			effect() {
        tech.worldPeace = true;
        oldDefense = m.defense;
        oldDamage = tech.damageFromTech;
        m.defense = function() {return 0}; 
        tech.damageFromTech = function() {return 0}
			},
			remove() {
				tech.worldPeace = false;
        m.defense = oldDefense;
        tech.damageFromTech = oldDamage
			}
		}
  ]
  shotgun = b.guns.find(function(input) {return input.name === "shotgun"});
  timeDilation = m.fieldUpgrades.find(function(input) {return input.name === "time dilation"})
  shotgun.fire = eval("(" + shotgun.fire.toString().replace(/const spread = \(m.crouch \? 0.03 : 0.05\)/, "const spread = (m.crouch ? ((tech.bipod || tech.sniper) ? (tech.sniper ? 0.0005 : 0.006) : 0.03) : 0.05)").replace(/fire\(\)/, "function()") + ")");
  level.hazard = eval("(function " + level.hazard.toString().replace(/\(tech.isRadioactiveResistance\ \?\ 0.2\ : 1\)/g, "(tech.isRadioactiveResistance ? 0.2 : 1) * (tech.hazmatSuit ? 0 : 1)") + ")")
  m.setFieldRegen = eval("(function " + m.setFieldRegen.toString().replace(/else if \(tech.isGroundState\) {/, "else if (tech.hazmatSuit) { m.fieldRegen *=0.66 } else if (tech.isGroundState) {") + ")")
  tech.tech.push(t[0]);
  //tech.tech.push(t[1]);
  //tech.tech.push(t[2]);
  tech.tech.push(t[3]);
  tech.tech.push(t[4]);
  tech.tech.push(t[5]);
}
// Mobile block
mod.mobile = (async () => { const scriptText = await (await fetch('https://raw.githubusercontent.com/kgurchiek/n-gon-mobile/main/main.js')).text(); var script = document.createElement('script'); script.type = 'text/javascript'; script.textContent = scriptText; document.head.appendChild(script); })
// Controller block
mod.controller = async () => { const scriptText = await (await fetch('https://raw.githubusercontent.com/kgurchiek/n-gon-controller/main/main.js')).text(); var script = document.createElement('script'); script.type = 'text/javascript'; script.textContent = scriptText; document.head.appendChild(script); }
// Stopwatch block
mod.stopwatch = async () => { const scriptText = await (await fetch('https://raw.githubusercontent.com/kgurchiek/n-gon-stopwatch/main/main.js')).text(); var script = document.createElement('script'); script.type = 'text/javascript'; script.textContent = scriptText; document.head.appendChild(script); }
// Glass cannon block
mod.glassCannon = function() { 
  mod.glass_oldDefense = m.defense;
  mod.glass_oldDamage = tech.damageFromTech;
  m.defense = function() {return localSettings.dmgTakenMult * mod.glass_oldDefense()}; 
  tech.damageFromTech = function() {return localSettings.dmgMult * mod.glass_oldDamage()}
}

// This must remain at the bottom for all this to work.
if (localSettings.autoInject) {mod.inject()}
