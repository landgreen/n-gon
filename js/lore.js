const lore = {
    techCount: 0,
    techGoal: 7,
    talkingColor: "#dff", //set color of graphic on level.null
    isSpeech: false,
    testSpeechAPI() {
        if ('speechSynthesis' in window) { // Synthesis support. Make your web apps talk!
            lore.isSpeech = true
        }
    },
    rate: 1, //   //utterance.rate = 1; // 0.1 to 10
    nextSentence() {
        lore.sentence++
        if (m.alive) lore.conversation[lore.chapter][lore.sentence]() //go to next sentence in the chapter and play it
    },
    anand: {
        color: "#e0c",
        voice: undefined,
        text: function(say) {
            if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
                simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
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
    miriam: {
        color: "#f20",
        text: function(say) {
            if (level.levels[level.onLevel] === undefined) { //only talk if on the lore level (which is undefined because it is popped out of the level.levels array)
                simulation.makeTextLog(`input.audio(<span style="color:#888; font-size: 70%;">${Date.now()} ms</span>)<span class='color-symbol'>:</span> "<span style="color:${this.color};">${say}</span>"`, Infinity);
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
        [ //first time they meet, and testing gets unlocked
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
                        lore.conversation[2].splice(lore.sentence + 1, 1, () => { lore.anand.text("Maybe it can't remember anything beyond each time it plays?") }) //lore.conversation[chapter].splice(1,this sentence index, ()=>{  })
                    } else if (input.up) {
                        lore.anand.text("It jumped: so YES")
                        lore.sentence--
                        lore.conversation[2].splice(lore.sentence + 1, 1, () => { lore.anand.text("That's good.") })
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
                        lore.conversation[2].splice(lore.sentence + 1, 1, () => { lore.miriam.text("Or maybe it learned independently, because it needed them.") }) //lore.conversation[chapter].splice(1,this sentence index, ()=>{  })
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
        // [ // they provide background on why the project was built, and what is going wrong
        //     /*
        //     they explain the technological aspect, and purpose of the project
        //         to develop new technology  
        //     they explain that the project isn't going well because it stopped working on new technology and started running the fighting simulations

        //      what is special about the null level
        //         why can the player hear the scientists in there?
        //         the wires are the direct unprocessed input to the player's neural net
        //     */
        //     () => { lore.miriam.text("") },
        //     () => { lore.miriam.text("") },
        //     () => { lore.miriam.text("") },

        //     () => { lore.talkingColor = "#dff" },
        // ],
        // [ //they explain why the bot is fighting,  it is planning an escape
        //     () => { lore.miriam.text("Welcome back bot, We've been waiting.") },
        //     () => { lore.miriam.text("So, I've got a theory about why you were attacked.") },
        //     () => { lore.miriam.text("") },
        //     () => { lore.miriam.text("I figured it out after I saw this famous quote.") },
        //     () => { lore.miriam.text('“The most important decision we make is whether we believe we live in a friendly or hostile universe.”<br>-Albert Einstein') },
        //     () => {
        //         lore.talkingColor = "#dff";
        //         setTimeout(() => { lore.anand.text("That's profound") }, 3000);
        //     },
        //     () => { lore.anand.text("Also I looked it up, and there is no record of him saying that.") },
        //     () => { lore.miriam.text("Oh... well...") },
        //     () => { lore.miriam.text("It doesn't matter who said it.") },
        //     () => { lore.anand.text("The point is we think the project views the universe as hostile.") },
        //     () => { lore.miriam.text("We think you see the universe as hostile.") },
        //     () => { lore.miriam.text("And that is why you keep running these fighting simulations.") },
        //     () => { lore.miriam.text("You are planning how to escape.") },

        //     () => { lore.talkingColor = "#dff" },
        // ],
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
    unlockTesting() {
        if (localSettings.loreCount < 1) localSettings.loreCount = 1
        localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        document.getElementById("control-testing").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
        document.getElementById("experiment-button").style.visibility = (localSettings.loreCount === 0) ? "hidden" : "visible"
        simulation.makeTextLog(`<span class='color-var'>lore</span>.unlockTesting()`, Infinity);

        //setup audio context
        function tone(frequency, gain = 0.05, end = 1300) {
            const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator1 = audioCtx.createOscillator();
            const gainNode1 = audioCtx.createGain();
            gainNode1.gain.value = gain; //controls volume
            oscillator1.connect(gainNode1);
            gainNode1.connect(audioCtx.destination);
            oscillator1.type = "sine"; // 'sine' 'square', 'sawtooth', 'triangle' and 'custom'
            oscillator1.frequency.value = frequency; // value in hertz
            oscillator1.start();
            for (let i = 0, len = end * 0.1; i < len; i++) {
                oscillator1.frequency.setValueAtTime(frequency + i * 10, audioCtx.currentTime + i * 0.01);
            }
            setTimeout(() => {
                audioCtx.suspend()
                audioCtx.close()
            }, end)
            return audioCtx
        }
        tone(50)
        tone(83.333)
        tone(166.666)
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