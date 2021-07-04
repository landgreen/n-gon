const lore = {
    techCount: 0,
    techGoal: 7,
    talkingColor: "#dff", //set color of graphic on level.null
    // anand: {
    //     color: "#e0c",
    //     text: function(say, isSpeech = false) {
    //         if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
    //             simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
    //             lore.talkingColor = this.color
    //             if (isSpeech) this.speech(say)
    //         }
    //     },
    //     speech: function(say) {
    //         var utterance = new SpeechSynthesisUtterance(say);
    //         utterance.lang = "en-IN";
    //         utterance.volume = 0.2; // 0 to 1
    //         speechSynthesis.speak(utterance);
    //     }
    // },
    // miriamOld: {
    //     color: "#f20",
    //     text: function(say, isSpeech = false) {
    //         if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
    //             simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
    //             lore.talkingColor = this.color
    //             if (isSpeech) this.speech(say)
    //         }
    //     },
    //     speech: function(say) {
    //         var utterance = new SpeechSynthesisUtterance(say);
    //         utterance.lang = "en-AU";
    //         utterance.volume = 0.2; // 0 to 1
    //         speechSynthesis.speak(utterance);
    //     }
    // },

    // voices = synth.getVoices();

    // for(i = 0; i < voices.length ; i++) {
    //   var option = document.createElement('option');
    //   option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

    //   if(voices[i].default) {
    //     option.textContent += ' -- DEFAULT';
    //   }

    //   option.setAttribute('data-lang', voices[i].lang);
    //   option.setAttribute('data-name', voices[i].name);
    //   voiceSelect.appendChild(option);
    // }
    setVoices() {
        window.speechSynthesis.onvoiceschanged = () => {
            const synth = window.speechSynthesis
            console.log(synth.getVoices())
            const voiceArray = synth.getVoices()
            lore.anand.voice = voiceArray[0]
            lore.miriam.voice = voiceArray[1]
            console.log(voiceArray[0], voiceArray[1])
        };
        // console.log('before')
        // if ('speechSynthesis' in window) {

        // } else {
        //     console.log('Text-to-speech not supported.');
        // }
    },
    anand: {
        color: "#e0c",
        voice: undefined,
        text: function(say) {
            if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
                simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
                lore.talkingColor = this.color
                const utterance = new SpeechSynthesisUtterance(say);
                // utterance.voice = lore.anand.voice
                utterance.lang = "en-GB" //"en-IN"; //de-DE  en-GB  fr-FR  en-US en-AU
                utterance.volume = 0.2; // 0 to 1
                // utterance.rate = 1.5
                speechSynthesis.speak(utterance);
                utterance.onerror = (event) => { //if speech doesn't work try again without the lang set
                    console.log("speech error", event.error)
                    const utterance = new SpeechSynthesisUtterance(say);
                    utterance.volume = 0.2; // 0 to 1
                    speechSynthesis.speak(utterance);
                    utterance.onend = () => {
                        lore.sentence++
                        if (m.alive) lore.conversation[lore.chapter][lore.sentence]() //go to next sentence in the chapter and play it
                    }
                }
                utterance.onend = () => {
                    lore.sentence++
                    if (m.alive) lore.conversation[lore.chapter][lore.sentence]() //go to next sentence in the chapter and play it
                }
            }
        },
    },
    miriam: {
        color: "#f20",
        text: function(say) {
            if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
                simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
                lore.talkingColor = this.color
                utterance = new SpeechSynthesisUtterance(say);
                // utterance.voice = lore.anand.voice
                utterance.lang = "en-AU";
                utterance.volume = 0.2; // 0 to 1
                // utterance.rate = 1.5
                speechSynthesis.speak(utterance);
                utterance.onerror = (event) => { //if speech doesn't work try again without the lang set
                    console.log("speech error", event.error)
                    const utterance = new SpeechSynthesisUtterance(say);
                    utterance.volume = 0.2; // 0 to 1
                    speechSynthesis.speak(utterance);
                    utterance.onend = () => {
                        lore.sentence++
                        if (m.alive) lore.conversation[lore.chapter][lore.sentence]() //go to next sentence in the chapter and play it
                    }
                }
                utterance.onend = () => {
                    lore.sentence++
                    if (m.alive) lore.conversation[lore.chapter][lore.sentence]() //go to next sentence in the chapter and play it
                }
            }
        },
    },
    // setTimeout(() => {}, 2000);
    // lore.miriam.text("")
    // lore.miriam.utterance.addEventListener('end', () => {
    // })
    chapter: 0, //what part of the conversation is playing
    sentence: 0, //what part of the conversation is playing
    conversation: [
        [ //first time they meet, and testing gets unlocked
            () => {
                // lore.setVoices();
                setTimeout(() => {
                    lore.miriam.text("I've never seen it generate this level before.")
                }, 5000);
            },
            () => { lore.anand.text("Wow. Just a platform.") },
            () => { lore.miriam.text("And that thing...") },
            () => { lore.anand.text("Weird") },
            () => { lore.anand.text("Maybe it's trapped.") },
            () => {
                lore.miriam.text("Hey little bot! Just press 'T' to enter testing mode and 'U' to go to the next level.")
                lore.unlockTesting();
            },
            () => { lore.anand.text("I don't think it's connected to the audio input, and I'm sure it can't understand what you're saying.") },
            () => { lore.miriam.text("ha hahahaha. I know, but it does seem to be getting smarter.") },
            () => {
                lore.talkingColor = "#dff"
                setTimeout(() => {
                    lore.miriam.text("Poor thing... I hope it figures out how to escape.")
                }, 25000);
            },
            () => { lore.talkingColor = "#dff" },
        ],
        [ //they learn the bot can understand what they say
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
        [ //they ask the bot questions, but waves of mobs come and attack
            () => { lore.anand.text("Quick, get ready.  It's back!") },
            () => { lore.miriam.text("What's back?") },
            () => { lore.anand.text("The bot is back on the communication level!") },
            () => { lore.miriam.text("Oh good, I've got so many questions.") },
            () => { lore.miriam.text("Is it self aware?") },
            () => { lore.miriam.text("How did it learn to understand words?") },
            () => { lore.miriam.text("Why can it only hear what we are saying on this level?") },
            () => { lore.miriam.text("I wish we could just ask it questions directly, instead of yes or no.") },
            () => { lore.anand.text("We could ask it to spell words by saying letters and having it crouching on the correct letter.") },
            () => { lore.miriam.text("Well, that would take forever.") },
            () => { lore.miriam.text("I really want to know: Why is it generating the mobs? and why does it keep fighting them?") },
            () => {
                lore.anand.text("Maybe that is just part of it's expectation–maximization algorithm")

                //endlessly spawning mobs until the player dies
                function cycle() {
                    if (!(simulation.cycle % 360)) {
                        const pick = spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)];
                        spawn[pick](1000 * (Math.random() - 0.5), -500 + 200 * (Math.random() - 0.5));
                        level.difficultyIncrease(simulation.difficultyMode)
                    }
                    if (!(simulation.cycle % 900)) spawn.randomLevelBoss(500 * (Math.random() - 0.5), -500 + 200 * (Math.random() - 0.5))
                    if (m.alive) requestAnimationFrame(cycle);
                }
                requestAnimationFrame(cycle);
            },
            () => { lore.miriam.text("Well sure, but what does that even mean?") },
            () => { lore.miriam.text("Do we all just do things because we are-") },
            () => { lore.miriam.text("... what is going on?") },
            () => { setTimeout(() => { lore.anand.text("it's spawning mobs and fighting them") }, 1000); },
            () => { lore.miriam.text("oh no.") },
            () => { lore.anand.text("We can't really communicate with it while it's fighting") },
            () => { lore.miriam.text("You can do it little bot!") },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.anand.text("But, why is it spawning these bots?")
                }, 1000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.anand.text("This is so strange.")
                }, 3000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.miriam.text("This is chaos!")
                }, 1000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.anand.text("I don't understand this project.")
                }, 3000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.miriam.text("It's fascinating though.")
                }, 1000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.miriam.text("I think this isn't going to end well.")
                }, 1000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.anand.text("Let's just be more prepared next time it enters this room.")
                }, 1000);
            },
            () => {
                setTimeout(() => {
                    lore.talkingColor = "#dff";
                    lore.anand.text("I had to go to the bathroom.  What happened while I was gone?")
                }, 20000);
            },
            () => { lore.miriam.text("More fighting...") },
            () => { lore.anand.text("great...") },

            () => { lore.talkingColor = "#dff" },
        ],
        // scientist try to think of a way to communicate since the bot can't talk
        // they give up on getting the bot to respond, and just start ask questions and thinking of explanations with each other
        // when and how did it become self-aware
        // why is the bot fighting things in these simulated locations?
        //   it wasn't designed to be violent
        // the bot was just designed to automate research and testing of new technology
        //   3D architecture superconducting quantum computer
        //   running machine learning algorithms
        // as the scientist start to get agitated bots arrive and player dies
        //   bots come in Infinite waves that increase game difficulty each wave
        //     only ending is testing mode + next level or player death
        //     scientist have some lines in between each wave of mobs


        // () => {
        //     if (localSettings.loreCount < 2) {
        //         localSettings.loreCount = 2
        //         localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        //     }
        //     setTimeout(() => {
        //         lore.miriam.text("Hey look! It's back at the weird level again!")
        //         lore.miriam.utterance.addEventListener('end', () => {
        //             lore.anand.text("oh Wow! Why does it keep making this level?")
        //             lore.anand.utterance.addEventListener('end', () => {
        //                 lore.miriam.text("I don't know, but last time it was in this room I think it understood us.")
        //                 lore.miriam.utterance.addEventListener('end', () => {
        //                     lore.miriam.text("Let's try talking to it again.")
        //                     lore.miriam.utterance.addEventListener('end', () => {
        //                         lore.miriam.text("hmmm, what should we say?")
        //                         lore.miriam.utterance.addEventListener('end', () => {
        //                             lore.anand.text("I'm still not convinced it understands. We need a test.")
        //                             lore.anand.utterance.addEventListener('end', () => {
        //                                 lore.miriam.text("Hey bot!!!")
        //                                 lore.miriam.utterance.addEventListener('end', () => {
        //                                     lore.miriam.text("If you can understand me crouch")
        //                                     lore.miriam.utterance.addEventListener('end', () => {
        //                                         lore.talkingColor = "#dff"

        //                                         function cycle() {
        //                                             if (input.down) {
        //                                                 lore.miriam.text("Look, It did it! It crouched.")
        //                                                 lore.miriam.utterance.addEventListener('end', () => {
        //                                                     lore.anand.text("Amazing! It can understand us...")
        //                                                     lore.anand.utterance.addEventListener('end', () => {
        //                                                         lore.miriam.text("It's Alive... Or it just crouched randomly.")
        //                                                         lore.miriam.utterance.addEventListener('end', () => {
        //                                                             lore.miriam.text("Hey bot! Can you crouch again?")
        //                                                             lore.miriam.utterance.addEventListener('end', () => {
        //                                                                 lore.talkingColor = "#dff"

        //                                                                 function cycle() {
        //                                                                     if (input.down) {
        //                                                                         lore.miriam.text("It is Alive!!! ... hehehehehe! ahahahahahah ehehehehe, ahahahah ...")
        //                                                                         lore.miriam.utterance.addEventListener('end', () => {
        //                                                                             setTimeout(() => {
        //                                                                                 lore.anand.text("OK ...")
        //                                                                                 lore.anand.utterance.addEventListener('end', () => {
        //                                                                                     lore.anand.text("but seriously, this means that in this room it can monitor our audio, and it can understand us.")
        //                                                                                     lore.anand.utterance.addEventListener('end', () => {
        //                                                                                         lore.anand.text("Anything we say could destabilize the project.")
        //                                                                                         lore.anand.utterance.addEventListener('end', () => {
        //                                                                                             lore.miriam.text("Fine, Let's talk down stairs.")
        //                                                                                             lore.miriam.utterance.addEventListener('end', () => {
        //                                                                                                 lore.miriam.text("Bye bye little bot.")
        //                                                                                                 lore.miriam.utterance.addEventListener('end', () => {
        //                                                                                                     lore.talkingColor = "#dff"
        //                                                                                                 })
        //                                                                                             })
        //                                                                                         })
        //                                                                                     })
        //                                                                                 })
        //                                                                             }, 1500);
        //                                                                         })
        //                                                                     } else {
        //                                                                         if (m.alive) requestAnimationFrame(cycle);
        //                                                                     }
        //                                                                 }
        //                                                                 requestAnimationFrame(cycle);
        //                                                             })
        //                                                         })
        //                                                     })
        //                                                 })
        //                                             } else {
        //                                                 if (m.alive) requestAnimationFrame(cycle);
        //                                             }
        //                                         }
        //                                         requestAnimationFrame(cycle);
        //                                     });
        //                                 });
        //                             });
        //                         });
        //                     });
        //                 });
        //             });
        //         });
        //     }, 6000);
        // },
        // () => {
        //     setTimeout(() => {
        //         lore.miriam.text("I've never seen it generate this level before.")
        //         lore.miriam.utterance.addEventListener('end', () => {
        //             lore.anand.text("Wow. Just a platform.")
        //             lore.anand.utterance.addEventListener('end', () => {
        //                 lore.miriam.text("And that thing...")
        //                 lore.miriam.utterance.addEventListener('end', () => {
        //                     lore.anand.text("Weird")
        //                     lore.anand.utterance.addEventListener('end', () => {
        //                         lore.anand.text("Maybe it's trapped.")
        //                         lore.anand.utterance.addEventListener('end', () => {
        //                             lore.miriam.text("Hey little bot! Just press 'T' to enter testing mode and 'U' to go to the next level.")
        //                             lore.unlockTesting();
        //                             lore.miriam.utterance.addEventListener('end', () => {
        //                                 lore.anand.text("I don't think it's connected to the audio input, and I'm sure it can't understand what you're saying.")
        //                                 lore.anand.utterance.addEventListener('end', () => {
        //                                     lore.miriam.text("ha hahahaha. I know, but it does seem to be getting smarter.")
        //                                     lore.miriam.utterance.addEventListener('end', () => {
        //                                         lore.talkingColor = "#dff" // when no one is talking
        //                                         setTimeout(() => {
        //                                             lore.miriam.text("Poor thing... I hope it figures out how to escape.")
        //                                             lore.miriam.utterance.addEventListener('end', () => { lore.talkingColor = "#dff" })
        //                                         }, 25000);
        //                                     });
        //                                 });
        //                             });
        //                         });
        //                     });
        //                 });
        //             });
        //         });
        //     }, 6000);
        // },
        // () => {
        //     if (localSettings.loreCount < 2) {
        //         localSettings.loreCount = 2
        //         localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        //     }
        //     let delay = 6000
        //     setTimeout(() => { lore.miriam.text("Hey look! It's back at the weird level again!", true) }, delay);
        //     delay += 2500
        //     setTimeout(() => { lore.anand.text("oh Wow! Why does it keep making this level?", true) }, delay);
        //     delay += 2900
        //     setTimeout(() => { lore.miriam.text("I don't know, but last time it was in this room I think it understood us.", true) }, delay);
        //     delay += 4000
        //     setTimeout(() => { lore.miriam.text("Let's try talking to it again.", true) }, delay);
        //     delay += 2500
        //     setTimeout(() => { lore.miriam.text("hmmm, what should we say?", true) }, delay);
        //     delay += 2500
        //     setTimeout(() => { lore.anand.text("I'm still not convinced it understands. We need a test.", true) }, delay);
        //     delay += 4000
        //     setTimeout(() => { lore.miriam.text("Hey bot!!!", true) }, delay);
        //     delay += 1300
        //     setTimeout(() => { lore.miriam.text("If you can understand me crouch", true) }, delay);
        //     delay += 1500
        //     setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        //     setTimeout(() => {
        //         function cycle() {
        //             if (input.down) {
        //                 let delay = 500 //reset delay time
        //                 setTimeout(() => { lore.miriam.text("Look, It did it! It crouched.", true) }, delay);
        //                 delay += 2000
        //                 setTimeout(() => { lore.anand.text("Amazing! It can understand us...", true) }, delay);
        //                 delay += 2700
        //                 setTimeout(() => { lore.miriam.text("It's Alive... Or it just crouched randomly.", true) }, delay);
        //                 delay += 2800
        //                 setTimeout(() => { lore.miriam.text("Hey bot! Can you crouch again?", true) }, delay);
        //                 delay += 2000
        //                 setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        //                 setTimeout(() => {
        //                     function cycle() {
        //                         if (input.down) {
        //                             let delay = 500 //reset delay time
        //                             setTimeout(() => { lore.miriam.text("It is Alive!!! ... hehehehehe ahahahahahah ehehehehe ahahahah", true) }, delay);
        //                             delay += 3500
        //                             setTimeout(() => { lore.anand.text("OK...", true) }, delay);
        //                             delay += 2700
        //                             setTimeout(() => { lore.anand.text("but seriously, this means that in this room it can monitor our audio, and it can understand us.", true) }, delay);
        //                             delay += 6400
        //                             setTimeout(() => { lore.anand.text("Anything we say could destabilize the project.", true) }, delay);
        //                             delay += 4200
        //                             setTimeout(() => { lore.miriam.text("Fine, Let's talk down stairs.", true) }, delay);
        //                             delay += 3000
        //                             setTimeout(() => { lore.miriam.text("Bye bye little bot.", true) }, delay);
        //                             delay += 2000
        //                             setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        //                         } else {
        //                             requestAnimationFrame(cycle);
        //                         }
        //                     }
        //                     requestAnimationFrame(cycle);
        //                 }, delay);
        //             } else {
        //                 requestAnimationFrame(cycle);
        //             }
        //         }
        //         requestAnimationFrame(cycle);
        //     }, delay);
        // },
        // () => {
        //     let delay = 6000
        //     setTimeout(() => { lore.miriam.text("I've never seen it generate this level before.", true) }, delay);
        //     delay += 2700
        //     setTimeout(() => { lore.anand.text("Wow. Just a platform.", true) }, delay);
        //     delay += 2200
        //     setTimeout(() => { lore.miriam.text("And that thing...", true) }, delay);
        //     delay += 1500
        //     setTimeout(() => { lore.anand.text("Weird", true) }, delay);
        //     delay += 1500
        //     setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        //     delay += 1000
        //     setTimeout(() => { lore.anand.text("Maybe it's trapped.", true) }, delay);
        //     delay += 2300
        //     setTimeout(() => { lore.unlockTesting() }, delay);
        //     setTimeout(() => { lore.miriam.text('Hey little bot! Just press "T" to enter testing mode and "U" to go to the next level.', true) }, delay);
        //     delay += 5400
        //     setTimeout(() => { lore.anand.text("I don't think it's connected to the audio input, and I'm sure it can't understand what you're saying.", true) }, delay);
        //     delay += 5300
        //     setTimeout(() => { lore.miriam.text("ha hahahaha. I know, but it does seem to be getting smarter.", true) }, delay);
        //     delay += 3700
        //     setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        //     delay += 25000
        //     setTimeout(() => {
        //         if (!simulation.isCheating) {
        //             lore.miriam.text("Poor thing... I hope it figures out how to escape.", true)
        //             delay += 3500
        //             setTimeout(() => { lore.talkingColor = "#dff" }, delay); //set color of graphic on level.null when no one is talking
        //         }
        //     }, delay);

        // },
    ],
    unlockTesting() {
        if (localSettings.loreCount < 1) localSettings.loreCount = 1
        localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        document.getElementById("control-testing").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
        document.getElementById("experiment-button").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
        simulation.makeTextLog(`lore.unlockTesting()`, Infinity);
    },
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
{
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
}