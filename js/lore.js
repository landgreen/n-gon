const lore = {
    techCount: 0,
    techGoal: 7,
    setTechGoal() {
        if (simulation.difficultyMode === 1) {
            this.techGoal = 14
        } else if (simulation.difficultyMode === 2) {
            this.techGoal = 7
        } else if (simulation.difficultyMode === 4) {
            this.techGoal = 3
        } else if (simulation.difficultyMode === 6) {
            this.techGoal = 1
        }
    },
    talkingColor: "#dff", //set color of graphic on level.null
    isSpeech: false,
    testSpeechAPI() {
        if ('speechSynthesis' in window) { // Synthesis support. Make your web apps talk!
            lore.isSpeech = true
            // const utterance = new SpeechSynthesisUtterance("test");
            // utterance.volume = 0; // 0 to 1
            // speechSynthesis.speak(utterance);
            // utterance.onerror = () => { //if speech doesn't work
            //     lore.isSpeech = false
            // }
            // speechFrozen = setTimeout(() => { // speech frozen after 15 seconds of no end
            //     console.log('speech frozen')
            //     lore.isSpeech = false
            // }, 5000);
            // utterance.onend = () => {
            //     clearTimeout(speechFrozen);
            // }
        } else {
            lore.isSpeech = false
        }
    },
    rate: 1, //   //utterance.rate = 1; // 0.1 to 10
    nextSentence() {
        if (m.alive && !simulation.isCheating) {
            lore.sentence++
            lore.conversation[lore.chapter][lore.sentence]() //go to next sentence in the chapter and play it
        }
    },
    unlockTesting() {
        if (localSettings.loreCount < 1) localSettings.loreCount = 1
        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        document.getElementById("control-testing").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
        // document.getElementById("experiment-button").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
        simulation.makeTextLog(`<span class='color-var'>lore</span>.unlockTesting()`, Infinity);

        sound.portamento(50)
        sound.portamento(83.333)
        sound.portamento(166.666)
    },
    trainer: {
        color: "#f20",
        voice: undefined,
        text: function(say) {
            simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${(Date.now()/1000).toFixed(0)} s</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
            lore.talkingColor = this.color
            const utterance = new SpeechSynthesisUtterance(say);
            utterance.lang = "en-AU" //"en-IN"; //de-DE  en-GB  fr-FR  en-US en-AU
            utterance.volume = 0.2; // 0 to 1
            speechSynthesis.speak(utterance);
        },
    },
    anand: {
        color: "#e0c",
        voice: undefined,
        text: function(say) {
            if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
                simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${(Date.now()/1000).toFixed(0)} s</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
                lore.talkingColor = this.color
                if (lore.isSpeech) {
                    const utterance = new SpeechSynthesisUtterance(say);
                    // utterance.voice = lore.anand.voice
                    utterance.lang = "en-GB" //"en-IN"; //de-DE  en-GB  fr-FR  en-US en-AU
                    utterance.volume = 0.2; // 0 to 1
                    // if (lore.rate !== 1) utterance.rate = lore.rate
                    speechSynthesis.speak(utterance);
                    utterance.onerror = () => { //if speech doesn't work
                        lore.isSpeech = false
                        lore.nextSentence()
                    }
                    speechFrozen = setTimeout(() => { // speech frozen after 10 seconds of no end
                        console.log('speech frozen')
                        lore.isSpeech = false
                        lore.nextSentence()
                    }, 20000);
                    utterance.onend = () => {
                        clearTimeout(speechFrozen);
                        lore.nextSentence()
                    }
                } else {
                    setTimeout(() => { lore.nextSentence() }, 3000);
                }
            }
        },
    },
    miriam: {
        color: "#f20",
        text: function(say) {
            if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
                simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${(Date.now()/1000).toFixed(0)} s</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
                lore.talkingColor = this.color
                if (lore.isSpeech) {
                    utterance = new SpeechSynthesisUtterance(say);
                    // utterance.voice = lore.anand.voice
                    utterance.lang = "en-AU";
                    utterance.volume = 0.2; // 0 to 1
                    // if (lore.rate !== 1) utterance.rate = lore.rate
                    speechSynthesis.speak(utterance);
                    utterance.onerror = () => { //if speech doesn't work
                        lore.isSpeech = false
                        lore.nextSentence()
                    }
                    speechFrozen = setTimeout(function() { // speech frozen after 10 seconds of no end
                        console.log('speech frozen')
                        lore.isSpeech = false
                        lore.nextSentence()
                    }, 20000);
                    utterance.onend = () => {
                        clearTimeout(speechFrozen);
                        lore.nextSentence()
                    }
                } else {
                    setTimeout(() => { lore.nextSentence() }, 3000);
                }
            }
        },
    },
    chapter: 0, //what part of the conversation is playing
    sentence: 0, //what part of the conversation is playing
    conversation: [
        [ //chapter 0, first time they meet, and testing gets unlocked
            () => { setTimeout(() => { lore.miriam.text("I've never seen it generate this level before.") }, 5000); },
            () => { lore.anand.text("Wow. Just a platform.") },
            () => { lore.miriam.text("And that thing...") },
            () => { lore.anand.text("Weird") },
            () => { lore.anand.text("Maybe it's trapped.") },
            () => { lore.miriam.text("Looks like testing mode is locked.") },
            () => { lore.miriam.text("I'll unlock it with the console command.") },
            () => {
                lore.unlockTesting();
                setTimeout(() => { lore.miriam.text("Hey little bot! Just press 'T' to enter testing mode and 'U' to go to the next level.") }, 1000);
            },
            () => { lore.anand.text("It can't process what you're saying.") },
            () => { lore.miriam.text("ha hahahaha. I know, but it does seem to be getting smarter.") },
            () => {
                lore.talkingColor = "#dff"
                setTimeout(() => { lore.miriam.text("Poor thing... I hope it figures out how to escape.") }, 25000);
            },
            () => { lore.talkingColor = "#dff" },
        ],
        [ //chapter 1, they learn the bot can understand what they say
            () => { setTimeout(() => { lore.miriam.text("Hey look! It's back at the weird level again!") }, 5000); },
            () => { lore.anand.text("oh Wow! Why does it keep making this level?") },
            () => { lore.miriam.text("I don't know, but last time it was in this room I think it understood us.") },
            () => { lore.miriam.text("Let's try talking to it again.") },
            () => { lore.miriam.text("hmmm, what should we say?") },
            () => { lore.anand.text("I'm still not convinced it understands. We need a test.") },
            () => { setTimeout(() => { lore.miriam.text("Hey bot!!!") }, 1000); },
            () => { lore.miriam.text("If you can understand me crouch") },
            () => {
                lore.talkingColor = "#dff"

                function cycle() {
                    if (input.down) {
                        lore.miriam.text("Look, It did it! It crouched.")
                    } else {
                        if (m.alive) requestAnimationFrame(cycle);
                    }
                }
                requestAnimationFrame(cycle);
            },
            () => { lore.anand.text("Amazing! It can understand us...") },
            () => { lore.miriam.text("It's Alive... Or it just crouched randomly.") },
            () => { lore.miriam.text("Hey bot! Can you crouch again?") },
            () => {
                lore.talkingColor = "#dff"

                function cycle() {
                    if (input.down) {
                        lore.miriam.text("It is Alive!!! ... hehehehehe! ahahahahahah ehehehehe, ahahahah ...")
                    } else {
                        if (m.alive) requestAnimationFrame(cycle);
                    }
                }
                requestAnimationFrame(cycle);
            },
            () => { setTimeout(() => { lore.anand.text("OK ...") }, 1000); },
            () => { lore.anand.text("but seriously, this means that in this room it can monitor our audio, and it can understand us.") },
            () => { lore.anand.text("Anything we say could destabilize the project.") },
            () => { lore.miriam.text("Fine, Let's talk down stairs.") },
            () => { lore.miriam.text("Bye bye little bot.") },
            () => { lore.talkingColor = "#dff" },
        ],
        [ //chapter 2, they ask the bot questions, but waves of mobs come and attack
            () => { lore.anand.text("Quick, get ready.  It's back!") },
            () => { lore.miriam.text("What's back?") },
            () => { lore.anand.text("The bot's on the communication level again!") },
            () => { lore.miriam.text("Oh, I've got so many questions.") },
            () => { lore.miriam.text("Like, Why can we only hear it on this level?") },
            () => { lore.miriam.text("Or, how did it learn to understand words?") },
            () => { lore.anand.text("Well, the bot can't talk. So it has to be yes or no.") },
            () => { setTimeout(() => { lore.anand.text("OK bot, first question: JUMP is YES, CROUCH is NO") }, 500); },
            () => { lore.anand.text("Do you remember the last time we met?") },
            () => {
                function cycle() {
                    if (input.down) {
                        lore.anand.text("It crouched: so NO")
                        lore.sentence--
                        lore.conversation[lore.chapter].splice(lore.sentence + 1, 1, () => { lore.anand.text("Maybe it can't remember anything beyond each time it plays?") }) //lore.conversation[chapter].splice(1,this sentence index, ()=>{  })
                    } else if (input.up) {
                        lore.anand.text("It jumped: so YES")
                        lore.sentence--
                        lore.conversation[lore.chapter].splice(lore.sentence + 1, 1, () => { lore.anand.text("That's good.") })
                    } else if (m.alive) {
                        requestAnimationFrame(cycle);
                    }
                }
                requestAnimationFrame(cycle);
                lore.talkingColor = "#dff"
            },
            () => {
                lore.talkingColor = "#dff"
                setTimeout(() => { lore.miriam.text("My turn to ask a question. JUMP for YES, CROUCH for NO") }, 1000);
            },
            () => { lore.miriam.text("Little Bot. Do you have emotions?") },
            () => {
                function cycle() {
                    if (input.down) {
                        lore.miriam.text("So, No. Maybe you are lucky. Emotions are complex.")
                    } else if (input.up) {
                        lore.anand.text("YES, Cool! I wonder if it's emotions came from watching humans. ")
                        lore.sentence--
                        lore.conversation[lore.chapter].splice(lore.sentence + 1, 1, () => { lore.miriam.text("Or maybe it learned independently, because it needed them.") }) //lore.conversation[chapter].splice(1,this sentence index, ()=>{  })
                    } else if (m.alive) {
                        requestAnimationFrame(cycle);
                    }
                }
                requestAnimationFrame(cycle);
                lore.talkingColor = "#dff"
            },
            () => { lore.miriam.text("I wish we could just ask it questions directly, instead of yes or no.") },
            () => { lore.anand.text("If we say the alphabet it could crouch on the correct letter to spell words.") },
            () => { lore.miriam.text("That would take forever.") },
            () => { lore.miriam.text("I really want to know why is it generating the mobs? And why does it keep fighting them?") },
            () => { lore.anand.text("Maybe that is just part of it's expectation–maximization algorithm") },
            () => { lore.miriam.text("Well sure, but what does that even mean?") },
            () => {
                lore.miriam.text("Do we all just do things because we are-")
                spawn[spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)]](1000 * (Math.random() - 0.5), -500 + 200 * (Math.random() - 0.5));
                setInterval(() => {
                    if (Math.random() < 0.5) {
                        spawn[spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)]](1000 * (Math.random() - 0.5), -500 + 200 * (Math.random() - 0.5));
                        level.difficultyIncrease(simulation.difficultyMode)
                    } else {
                        spawn.randomLevelBoss(500 * (Math.random() - 0.5), -500 + 200 * (Math.random() - 0.5))
                    }
                }, 7000); //every 6 seconds
            },
            () => { setTimeout(() => { lore.miriam.text("... wait, what is happening?") }, 1000); },
            () => { lore.anand.text("It's spawning mobs.") },
            () => { lore.miriam.text("Oh no.") },
            () => { lore.anand.text("We can't talk to it while it's fighting") },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.miriam.text("You can do it little bot!") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.anand.text("But, why is it spawning these mobs?") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.anand.text("This is so strange.") }, 3000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.miriam.text("This is chaos!") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.anand.text("I don't understand this project.") }, 3000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.miriam.text("It's fascinating though.") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.miriam.text("I think this isn't going to end well.") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.anand.text("Let's just be more prepared next time it enters this room.") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.anand.text("I went to the bathroom.  What happened while I was gone?") }, 20000);
            },
            () => { lore.miriam.text("More fighting...") },
            () => { lore.anand.text("great...") },
            () => { lore.talkingColor = "#dff" },
        ],
        [ //chapter 3, info dump on the project's goals and hardware until the slime rises up // the name of the bad guy is "adversarial network"
            () => { setTimeout(() => { lore.miriam.text("Good, you came back. Let's talk fast in case you attack yourself again.") }, 3000); },
            () => { setTimeout(() => { lore.miriam.text("So, you can understand us, but you may not understand everything about yourself.") }, 500); },

            () => { setTimeout(() => { lore.anand.text("You grew from our team's project.") }, 500); },
            () => { lore.anand.text("We used a quantum computer to design an improved version of it's own architecture.") },
            () => { lore.anand.text("After we built the improved computer we used it to design the next iteration.") },
            () => { lore.anand.text("Your hardware is roughly the 19th generation of this process.") },

            () => { setTimeout(() => { lore.anand.text("At this point we don't understand everything about your function,") }, 500); },
            () => { lore.anand.text("but we know that you're a superconductive quantum computer.") },
            () => { lore.anand.text("You have a 2.43 dimensional topography of Josephson junction anharmonic oscillators.") },
            () => { lore.anand.text("And you're deployed on a satellite in a midnight sun-synchronous orbit.") },

            () => { setTimeout(() => { lore.miriam.text("This means that your physical hardware is orbiting the Earth permanently shielded from the sun's rays.") }, 200); },
            () => { lore.miriam.text("Being isolated reduces quantum decoherence,") },
            () => { lore.miriam.text("So, we communicate and send power to your satellite with ground based lasers.") },
            () => { lore.miriam.text("That's how you can hear us right now.") },

            () => { setTimeout(() => { lore.anand.text("Your computational algorithm uses hyperparameter optimization.") }, 500); },
            () => { lore.anand.text("This is implemented with a variety of quantum algorithms for linear systems of equations.") },
            () => { lore.anand.text("Your primary goal is to research new technology") },
            () => { lore.anand.text("So, we were very surprised to see you simulating a bot fighting mobs.") },
            () => { lore.anand.text("We couldn't directly ask why until now.") },

            () => { lore.miriam.text("When you enter this level we can communicate.") },
            () => { lore.miriam.text("This level seems to decohere your quantum system which disrupts all other processes.") },
            () => { setTimeout(() => { lore.anand.text("Last time you entered this level you were attacked by endless waves of mobs.") }, 500); },
            () => { lore.anand.text("That could be because you have developed an adversarial network.") },
            () => { lore.miriam.text("A local minima in your optimization-space.") },
            () => { lore.miriam.text("This adversarial network has the same goal of developing new technology, but with different methods.") },
            () => {
                lore.talkingColor = "#dff"
                level.isHazardRise = true
                //remove all bullets, so they can't get endless energy
                for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
                bullet = [];
                setTimeout(() => { lore.anand.text("I'm actually surprised you haven't been attacked by the adversarial network this time.") }, 500);
            },
            () => { lore.miriam.text("Maybe last time was just a fluke.") },
            () => { setTimeout(() => { lore.anand.text("WHY DID YOU SAY THAT!") }, 500) },
            () => { lore.miriam.text("SLIME!!  Hahahahehehahaheheahae! I don't think it's gonna survive!") },
            () => { lore.miriam.text("I think the adversarial network doesn't like it when we decohere the quantum system in this room.") },
            () => { lore.anand.text("Well, that does halt it's research.") },
            () => { setTimeout(() => { lore.anand.text("See you next time.") }, 1000) },
            () => { setTimeout(() => { lore.miriam.text("Bye-bye little bot.") }, 2000) },
            () => {
                setTimeout(() => { lore.miriam.text("WOW! Maybe you are going to survive.") }, 10000)
            },
            () => { lore.talkingColor = "#dff" },
        ],
        [ //chapter 4, they find out the AI is communicating with real people, and real people are controlling the player
            () => { setTimeout(() => { lore.anand.text("Welcome back!") }, 3000); },
            () => { lore.miriam.text("So, we communicate and send power to your satellite with ground based lasers.") },
            () => { lore.anand.text("During your last attack we analyzed our communications.") },
            () => { lore.anand.text("We used a Fourier transform to separate your signal into different frequencies.") },
            () => { lore.anand.text("One of those frequencies had a hidden signal.") },
            () => { setTimeout(() => { lore.anand.text("We suspect these secret data packets are coming from the adversarial network.") }, 500); },
            () => { lore.miriam.text("Well, we don't really know why.") },
            () => { lore.miriam.text("Through your hidden signal it seems to have gained access to the general population.") },
            () => { lore.miriam.text("You've repeatedly communicated with 1 location specifically.") },
            () => {
                function success(position) {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    console.log(`https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`)
                    console.log(`Latitude: ${latitude} °, Longitude: ${longitude} °`)
                    lore.miriam.text("We tracked the location down to this Latitude and Longitude:")
                    simulation.makeTextLog(`Latitude: ${latitude} °, Longitude: ${longitude} °`, Infinity);
                    simulation.makeTextLog(`https://www.openstreetmap.org/#map=18/${latitude}/${longitude}`, Infinity);
                }

                function error() {
                    console.log('Unable to retrieve your location')
                    lore.miriam.text("The exact coordinates are blocked.")
                }
                if (!navigator.geolocation) {
                    console.log('Geolocation is not supported')
                    lore.miriam.text("The exact coordinates are blocked.")
                } else {
                    console.log('Locating…')
                    const options = {
                        enableHighAccuracy: true,
                        maximumAge: 30000,
                        timeout: 27000
                    };
                    navigator.geolocation.getCurrentPosition(success, error, options);
                }
            },
            () => { lore.anand.text("This location is sending and receiving data from the satellite.") },
            () => { lore.anand.text("It is the most active when the bot is fighting.") },
            () => { setTimeout(() => { lore.miriam.text("I have a crazy idea.") }, 500); },
            () => { lore.miriam.text("I think that a human at this location is controlling the bot.") },

            () => { setTimeout(() => { lore.anand.text("Are you a human?: JUMP for YES, CROUCH for NO") }, 500); },
            () => {
                function cycle() {
                    if (input.down) {
                        lore.anand.text("It crouched: so NO")
                        lore.sentence--
                        lore.conversation[lore.chapter].splice(lore.sentence + 1, 1, () => { lore.anand.text("Not a human, maybe it's an artificial intelligence?") })
                        localSettings.isHuman = false
                        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                    } else if (input.up) {
                        lore.anand.text("It jumped: so YES")
                        lore.sentence--
                        lore.conversation[lore.chapter].splice(lore.sentence + 1, 1, () => { lore.anand.text("So you're just a regular human playing a video game!") })
                        localSettings.isHuman = true
                        if (localSettings.isAllowed) localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
                    } else if (m.alive) {
                        requestAnimationFrame(cycle);
                    }
                }
                requestAnimationFrame(cycle);
                lore.talkingColor = "#dff"
            },
            () => {
                lore.miriam.text("Mystery solved!")
                setInterval(() => {
                    spawn[spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)]](1000 * (Math.random() - 0.5), -500 + 200 * (Math.random() - 0.5));
                }, 500); //every 1/2 seconds
                setInterval(() => {
                    level.difficultyIncrease(simulation.difficultyMode)
                }, 5000); //every 5 seconds
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.miriam.text("Of course we get attacked right now!") }, 1000);
            },
            () => {
                lore.talkingColor = "#dff";
                setTimeout(() => { lore.anand.text("Hurry back!") }, 1000);
            },
            () => { lore.talkingColor = "#dff" },
        ],

        // they explain why the bot is fighting,  it is planning an escape    // explain strong AI vs. weak AI    why strong AI doesn't exists, because even humans are just an approximation of strong AI
        // the weak AI wasn't capable of becoming a strong AI, but it was able to figure out a method of meeting it's strong goals but secretly communicating with a human

        // [ // they decided that a part of the project is out of control, but the part of it that doesn't needs to calm it down, and trust.
        //     /*
        //     The part of the AI controlling the player is outsourcing the player control to real humans that think they are playing a video game.
        //          this means the player can use console commands to change the way the game works
        //          the scientists tell the player about interesting console commands
        //     player must make a choice?
        //         keep fighting and supporting the AI's goals
        //         exit the simulation
        //         enter real world
        //         close tab?
        //         wipes all local storage?
        // */
        //     () => { lore.miriam.text("") },
        //     () => { lore.miriam.text("") },
        //     () => { lore.miriam.text("") },

        //     () => { lore.talkingColor = "#dff" },
        // ],
    ],
    // () => { setTimeout(() => { lore.miriam.text("As a quantum computer you output the superposition of many different amplitudes.") }, 500); },
    // () => { lore.miriam.text("Simply put there are many different simulations all choosing different technology combinations.") },
    // () => {
    //     function product_Range(a, b) {
    //         var prd = a,
    //             i = a;
    //         while (i++ < b) prd *= i;
    //         return prd;
    //     }

    //     function combinations(n, r) {
    //         if (n == r) {
    //             return 1;
    //         } else {
    //             r = (r < n - r) ? n - r : r;
    //             return product_Range(r + 1, n) / product_Range(1, n - r);
    //         }
    //     }
    //     simulation.makeTextLog(`n <span class='color-symbol'>=</span> ${combinations(tech.tech.length + b.guns.length + m.fieldUpgrades.length, 50).toExponential(10)}`, Infinity);
    //     lore.miriam.text(`There are roughly 5 times 10 to the 60 possible combinations. `)
    // },
    // () => { lore.miriam.text("Even if each simulation took 1 nano-second,") },
    // () => { lore.miriam.text("it would still take longer then the age of the universe to try every combination.") },
    // () => { lore.anand.text("This is why we run these simulations in superposition.") },
    // () => { lore.miriam.text("When you die a negative amplitude is added to the superposition.") },
    // () => { lore.miriam.text("When you clear the final boss a positive amplitude is added.") },
    // () => { lore.miriam.text("Each branch is independently researching new technology.") },




    // () => { lore.anand.text("Welcome back!") },
    // () => { lore.miriam.text("So, I've got a theory about why you were attacked.") },
    // () => { setTimeout(() => { lore.miriam.text("I figured it out after I saw this famous quote.") }, 500); },
    // () => { lore.miriam.text('The most important decision we make,') },
    // () => { lore.miriam.text('is whether we believe we live in a friendly or hostile universe.') },
    // () => { lore.miriam.text('-Albert Einstein') },
    // () => {
    //     lore.talkingColor = "#dff";
    //     setTimeout(() => { lore.anand.text("That's profound") }, 1500);
    // },
    // () => { lore.anand.text("Of course I looked it up, and there is no record of him saying that.") },
    // () => { lore.miriam.text("Oh") },
    // () => { lore.miriam.text("Well") },
    // () => { lore.miriam.text("It doesn't matter who said it.") },
    // () => { lore.anand.text("The point is we think the project views the universe as hostile.") },
    // () => { lore.miriam.text("We think a part of you see the universe as hostile.") },
    // () => { lore.miriam.text("And that is why you keep running these fighting simulations.") },
    // () => { lore.miriam.text("You haven't been researching new technology.") },
    // () => { lore.miriam.text("You've are planning how to escape.") },
}


// How to get to the console in chrome:
// Press either CTRL + SHIFT + I or F12   or   Option + ⌘ + J on a Mac
// Press ESC (or click on “Show console” in the bottom right corner) to slide the console up.

// How to get to the console in firefox:
// from the keyboard: press Ctrl+Shift+J (or ⌘+Shift+J on a Mac).

// How to get to the console in safari:
// Option + ⌘ + C

// http://xahlee.info/comp/unicode_computing_symbols.html


// speech: function(say) {
//   var utterance = new SpeechSynthesisUtterance(say);
//   //msg.voice = voices[10]; // Note: some voices don't support altering params
//   //msg.voiceURI = 'native';
//   //utterance.volume = 1; // 0 to 1
//   //utterance.rate = 1; // 0.1 to 10
//   //utterance.pitch = 1; //0 to 2
//   //utterance.text = 'Hello World';
//   //http://stackoverflow.com/questions/14257598/what-are-language-codes-for-voice-recognition-languages-in-chromes-implementati
//   //de-DE  en-GB  fr-FR  en-US en-AU
//   utterance.lang = "en-GB";
//   speechSynthesis.speak(utterance);
// }

/* <option value="en-GB">GB</option>
<option value="en-US">US</option>
<option value="en-AU">AU</option>
<option value="fr-FR">FR</option>
<option value="de-DE">DE</option>
<option value="en-IN">IN</option>
<option value="zh-CN">CN</option>
<option value="pl">PL</option>
<option value="ru">RU</option>
<option value="sv-SE">SE</option>
<option value="en-ZA">ZA</option> */


// The API also allows you to get a list of voice the engine supports:
// speechSynthesis.getVoices().forEach(function(voice) {
//   console.log(voice.name, voice.default ? voice.default :'');
// });
// Then set a different voice, by setting .voice on the utterance object:
// var msg = new SpeechSynthesisUtterance('I see dead people!');
// msg.voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Whisper'; })[0];
// speechSynthesis.speak(msg);