
let player = {
    sleep: 70,
    iq: 70,
    hunger: 50,
    stress: 30,
    entertainment: 60
};

let currentEvent = 0;
let dayNumber = 1;
let timeLeft = 120;

let timerInterval = null;
let transitionTimeout = null;

let dayFeedback = [];
let gameOver = false;
let endingPending = false;

let quizDue = false;
let quizAvailableFromDay = 0;
let quizShownForDay = false;


// ========================================
// EVENTS
// ========================================

const events = [
    {
        title: "You're invited to a party! 🎉",
        story: "You have a test tomorrow. What will you do?",
        choices: [
            {
                text: "Attend the party (+10 Entertainment, -10 Sleep)",
                changes: {
                    entertainment: 10,
                    sleep: -10,
                    stress: -5
                },
                feedback: "You made time for fun, but lost some sleep."
            },
            {
                text: "Stay home and study (+10 IQ, +10 Stress)",
                changes: {
                    iq: 10,
                    stress: 10,
                    entertainment: -10
                },
                feedback: "You studied for your test, but remember to manage stress.",
                brainInfo: true
            }
        ]
    },

    {
        title: "Breakfast time! 🍳",
        story: "You wake up before a busy day. What's your move?",
        choices: [
            {
                text: "Eat breakfast (+15 Hunger)",
                changes: {
                    hunger: 15
                },
                feedback: "You ate breakfast and gave your brain energy for the day."
            },
            {
                text: "Skip breakfast (-10 Hunger, +10 Stress)",
                changes: {
                    hunger: -10,
                    stress: 10
                },
                feedback: "You skipped breakfast and missed an opportunity to fuel your day."
            }
        ]
    },

    {
        title: "It's time to study! 📚",
        story: "You have more work to do, but your brain needs a break too.",
        choices: [
            {
                text: "Study for an hour (+10 IQ, +10 Stress, -10 Sleep)",
                changes: {
                    iq: 10,
                    stress: 10,
                    sleep: -10
                },
                feedback: "You practised your work, but studying without enough rest can catch up with you."
            },
            {
                text: "Take a break (+15 Entertainment, -10 Stress)",
                changes: {
                    entertainment: 15,
                    stress: -10
                },
                feedback: "You took a break and gave yourself time to recharge."
            }
        ]
    }
];


// ========================================
// UPDATE STATS AND VISUAL EFFECTS
// ========================================

function updateStats() {
    for (let stat in player) {
        const valueElement = document.getElementById(stat + "-value");
        const barElement = document.getElementById(stat + "-bar");

        if (valueElement) {
            valueElement.textContent = player[stat];
        }

        if (barElement) {
            barElement.style.width = player[stat] + "%";
        }
    }

    updateVisualEffects();
}


function updateVisualEffects() {
    document.body.classList.remove(
        "sleep-low",
        "iq-low",
        "hunger-low",
        "entertainment-low",
        "stress-high",
        "stress-crisis",
        "stress-warning-on"
    );

    if (player.sleep <= 25) {
        document.body.classList.add("sleep-low");
    }

    if (player.iq <= 25) {
        document.body.classList.add("iq-low");
    }

    if (player.hunger <= 20) {
        document.body.classList.add("hunger-low");
    }

    if (player.entertainment <= 20) {
        document.body.classList.add("entertainment-low");
    }

    if (player.stress >= 70) {
        document.body.classList.add("stress-high");
    }

    // FLASHING WARNING WHEN STRESS IS ABOVE 80
    if (player.stress > 80 && player.stress < 100) {
        document.body.classList.add("stress-warning-on");
    }
}


// ========================================
// CHANGE STATS
// ========================================

function changeStats(changes) {
    for (let stat in changes) {
        player[stat] += changes[stat];

        player[stat] = Math.max(
            0,
            Math.min(100, player[stat])
        );
    }

    updateStats();
    checkCriticalStats();
}


// ========================================
// MENU NAVIGATION
// ========================================

function showInstructions() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("instructions-screen").style.display = "block";
}


function backToMenu() {
    document.getElementById("instructions-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
}


function backToMenuFromGame() {
    clearInterval(timerInterval);
    clearTimeout(transitionTimeout);

    gameOver = true;
    endingPending = false;

    document.body.classList.remove(
        "game-over-red",
        "stress-crisis",
        "stress-high",
        "stress-warning-on",
        "sleep-low",
        "iq-low",
        "hunger-low",
        "entertainment-low"
    );

    document.getElementById("game-screen").style.display = "none";
    document.getElementById("event-box").style.display = "none";
    document.getElementById("event-box").classList.remove("brain-info");
    document.getElementById("start-screen").style.display = "block";
}


// ========================================
// START GAME
// ========================================

function startGame() {
    clearInterval(timerInterval);
    clearTimeout(transitionTimeout);

    player = {
        sleep: 70,
        iq: 70,
        hunger: 50,
        stress: 30,
        entertainment: 60
    };

    currentEvent = 0;
    dayNumber = 1;
    timeLeft = 120;

    dayFeedback = [];
    gameOver = false;
    endingPending = false;

    quizDue = false;
    quizAvailableFromDay = 0;
    quizShownForDay = false;

    document.body.classList.remove(
        "game-over-red",
        "stress-crisis",
        "stress-high",
        "stress-warning-on",
        "sleep-low",
        "iq-low",
        "hunger-low",
        "entertainment-low"
    );

    document.getElementById("event-box").classList.remove("brain-info");

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("instructions-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("event-box").style.display = "none";

    document.getElementById("day-number").textContent = "Day 1";

    updateStats();
    updateTimer();

    // ONE CONTINUOUS TWO-MINUTE TIMER
    timerInterval = setInterval(function() {
        if (gameOver) return;

        timeLeft--;
        updateTimer();

        if (timeLeft <= 0) {
            finishGame("time");
        }
    }, 1000);

    // FIRST EVENT APPEARS AFTER ONE SECOND
    transitionTimeout = setTimeout(function() {
        if (!gameOver) {
            showNextEvent();
        }
    }, 1000);
}


// ========================================
// TIMER
// ========================================

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    document.getElementById("timer").textContent =
        "Time left: " + minutes + ":" +
        String(seconds).padStart(2, "0");
}


// ========================================
// EVENT POPUPS
// ========================================

function showEvent(title, story, choices) {
    const eventBox = document.getElementById("event-box");
    const choicesBox = document.getElementById("choices");

    document.getElementById("scenario").textContent = title;
    document.getElementById("story").textContent = story;

    choicesBox.innerHTML = "";
    eventBox.style.display = "block";

    choices.forEach(function(choice) {
        const button = document.createElement("button");

        button.textContent = choice.text;

        button.onclick = function() {
            if (gameOver && !choice.action) return;
            if (endingPending && !choice.action) return;

            // PREVENT MULTIPLE CLICKS
            choicesBox.querySelectorAll("button").forEach(function(btn) {
                btn.disabled = true;
            });

            // SPECIAL BUTTONS
            if (choice.action) {
                choice.action();
                return;
            }

            // QUIZ ANSWER
            if (choice.isQuiz) {
                changeStats(choice.changes);

                if (gameOver || endingPending) return;

                dayFeedback.push(choice.feedback);
                quizDue = false;

                hidePopupAndWait(function() {
                    showNextEvent();
                });

                return;
            }

            // APPLY THE PLAYER'S CHOICE
            changeStats(choice.changes);

            // STOP IF A CRITICAL STAT WAS REACHED
            if (gameOver || endingPending) return;

            dayFeedback.push(choice.feedback);
            currentEvent++;

            // SHOW BRAIN INFORMATION AFTER STUDYING
            if (choice.brainInfo) {
                hidePopupAndWait(function() {
                    showBrainInfo();
                });

                return;
            }

            // HIDE POPUP FOR TWO SECONDS
            hidePopupAndWait(function() {
                showNextEvent();
            });
        };

        choicesBox.appendChild(button);
    });
}


// ========================================
// TEMPORARILY HIDE POPUP
// ========================================

function hidePopupAndWait(callback) {
    if (gameOver || endingPending) return;

    document.getElementById("event-box").style.display = "none";

    clearTimeout(transitionTimeout);

    transitionTimeout = setTimeout(function() {
        if (!gameOver && !endingPending) {
            callback();
        }
    }, 2000);
}


// ========================================
// BRAIN INFORMATION
// ========================================

function showBrainInfo() {
    const eventBox = document.getElementById("event-box");

    eventBox.classList.add("brain-info");

    showEvent(
        "🧠 READ THIS, IT MATTERS!",
        "YOUR BRAIN CAN CHANGE AS YOU LEARN AND PRACTISE. THIS ABILITY IS CALLED NEUROPLASTICITY. MAKE SURE YOU REMEMBER THIS — YOU WILL BE QUIZZED TOMORROW!",
        [
            {
                text: "I'VE READ IT! 🧠",
                action: function() {
                    eventBox.classList.remove("brain-info");

                    quizDue = true;
                    quizAvailableFromDay = dayNumber + 1;

                    hidePopupAndWait(function() {
                        showNextEvent();
                    });
                }
            }
        ]
    );
}


// ========================================
// NEXT-DAY MEMORY QUIZ
// ========================================

function showBrainQuiz() {
    quizShownForDay = true;

    showEvent(
        "🧠 MEMORY CHECK!",
        "WHAT IS NEUROPLASTICITY?",
        [
            {
                text: "The brain's ability to change with experience",
                isQuiz: true,
                changes: {
                    iq: 10
                },
                feedback: "You remembered the idea! Learning and experience can change connections in the brain."
            },
            {
                text: "The brain's inability to change",
                isQuiz: true,
                changes: {
                    iq: -5
                },
                feedback: "Not quite! Neuroplasticity refers to the brain's capacity to change with experience."
            }
        ]
    );
}


// ========================================
// DAILY EVENTS
// ========================================

function showNextEvent() {
    if (gameOver || endingPending) return;

    // QUIZ THE PLAYER ON THE NEXT DAY
    if (
        quizDue &&
        dayNumber >= quizAvailableFromDay &&
        !quizShownForDay
    ) {
        showBrainQuiz();
        return;
    }

    // ALL DAILY EVENTS ARE COMPLETE
    if (currentEvent >= events.length) {
        showDailyDebrief();
        return;
    }

    const event = events[currentEvent];

    showEvent(event.title, event.story, event.choices);
}


// ========================================
// DAILY DEBRIEF
// ========================================

function showDailyDebrief() {
    const doingWell =
        player.sleep >= 40 &&
        player.iq >= 40 &&
        player.hunger >= 40 &&
        player.stress <= 60 &&
        player.entertainment >= 30;

    const title = doingWell
        ? "Good job! 🩵"
        : "Do better tomorrow! 🌱";

    const story = dayFeedback.join(" ") +
        " Your choices affect your character's wellbeing.";

    showEvent(title, story, [
        {
            text: "NEXT DAY →",
            action: nextDay
        },
        {
            text: "BACK TO MENU",
            action: backToMenuFromGame
        }
    ]);
}


function nextDay() {
    if (gameOver || endingPending) return;

    dayNumber++;
    currentEvent = 0;
    dayFeedback = [];
    quizShownForDay = false;

    document.getElementById("day-number").textContent =
        "Day " + dayNumber;

    hidePopupAndWait(function() {
        showNextEvent();
    });
}


// ========================================
// CRITICAL STATS AND INSTANT GAME OVER
// ========================================

function checkCriticalStats() {
    if (gameOver || endingPending) return;

    // STRESS AT 100 = IMMEDIATE YOU LOSE
    if (player.stress >= 100) {
        endingPending = true;

        document.body.classList.add("stress-crisis");
        document.body.classList.remove("stress-warning-on");

        clearInterval(timerInterval);
        clearTimeout(transitionTimeout);

        finishGame("stress");
        return;
    }

    let reason = null;

    if (player.sleep <= 0) {
        reason = "sleep";
    } else if (player.hunger <= 0) {
        reason = "hunger";
    } else if (player.iq <= 0) {
        reason = "iq";
    } else if (player.entertainment <= 0) {
        reason = "entertainment";
    }

    if (reason) {
        endingPending = true;

        clearInterval(timerInterval);
        clearTimeout(transitionTimeout);

        finishGame(reason);
    }
}


// ========================================
// GAME OVER AND FINAL DEBRIEF
// ========================================

function finishGame(reason) {
    if (gameOver) return;

    gameOver = true;
    endingPending = false;

    clearInterval(timerInterval);
    clearTimeout(transitionTimeout);

    document.getElementById("event-box").classList.remove("brain-info");

    document.getElementById("timer").textContent =
        reason === "time" ? "Time's up!" : "Game over!";

    const score = (
        player.sleep +
        player.iq +
        player.hunger +
        (100 - player.stress) +
        player.entertainment
    ) / 5;

    let title;
    let story;

    if (reason === "stress") {
        title = "YOU LOSE";
        story = "Your stress reached its critical level. In real life, stress can be managed, and rest, support and healthy coping strategies can help.";

    } else if (reason === "sleep") {
        title = "TOO EXHAUSTED";
        story = "Your sleep level became critically low. Sleep supports attention, learning and memory. Your character needs more rest.";

    } else if (reason === "hunger") {
        title = "YOU NEED NOURISHMENT";
        story = "Your nourishment level became critically low. Food provides energy and nutrients your brain and body need.";

    } else if (reason === "iq") {
        title = "TIME TO REBUILD YOUR KNOWLEDGE";
        story = "Your learning score became critically low in this game. Learning takes practice, support and time. This score does not measure your real intelligence.";

    } else if (reason === "entertainment") {
        title = "YOU NEED A BREAK";
        story = "Your character had no entertainment left. Rest and enjoyable activities can be part of a balanced routine.";

    } else if (score >= 70) {
        title = "YOU'RE THRIVING! 🌟";
        story = "You balanced your needs well. Keep making choices that support learning, rest, nourishment and fun.";

    } else if (score >= 45) {
        title = "YOU'RE FINDING YOUR BALANCE! 🌱";
        story = "Some choices helped you, while others made life harder. Think about what you could change tomorrow.";

    } else {
        title = "TIME FOR A RESET 🩵";
        story = "Some of your character's needs were neglected. Rest, nourishment, stress management and learning all matter.";
    }

    showEvent(title, story, [
        {
            text: "BACK TO MENU",
            action: backToMenuFromGame
        }
    ]);
}


// ========================================
// INITIALISE
// ========================================

updateStats();
