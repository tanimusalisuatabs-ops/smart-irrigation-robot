let API_URL = "https://smart-irrigation-robot-1234.onrender.com/api";

let selectedRobotNumber = null;
let robotWorking = false;
let workTimer = null;
let farmRobotPosition = 15;
let audioContext = null;


/* =========================
   SOUND
========================= */

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    return audioContext;
}


function playSound(
    frequency = 600,
    duration = 200,
    type = "sine",
    volume = 0.25
) {
    try {
        const context = getAudioContext();

        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            frequency,
            context.currentTime
        );

        gain.gain.setValueAtTime(
            volume,
            context.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + duration / 1000
        );

        oscillator.start();

        oscillator.stop(
            context.currentTime + duration / 1000
        );

    } catch (error) {
        console.log("Audio error:", error);
    }
}


function playAlertSound() {

    playSound(950, 300, "square", 0.3);

    setTimeout(() => {
        playSound(950, 300, "square", 0.3);
    }, 400);

    setTimeout(() => {
        playSound(700, 450, "square", 0.25);
    }, 800);
}


/* =========================
   LOGIN
========================= */

function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    if (username === "" || password === "") {

        document.getElementById("loginMessage").textContent =
            "Please enter username and password.";

        playAlertSound();

        return;
    }

    getAudioContext();

    document.getElementById("loginPage").style.display = "none";

    document.getElementById("dashboardPage")
        .classList.remove("hidden");

    playSound(700, 120);

    setTimeout(() => {
        playSound(900, 150);
    }, 150);

    startSystem();
}


function logout() {

    stopRobotWork();

    document.getElementById("dashboardPage")
        .classList.add("hidden");

    document.getElementById("loginPage").style.display = "flex";

    document.getElementById("username").value = "";
    document.getElementById("password").value = "";

    selectedRobotNumber = null;

    playSound(300, 200, "square", 0.2);
}


/* =========================
   NAVIGATION
========================= */

function goToSection(sectionId) {

    const section =
        document.getElementById(sectionId);

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    playSound(650, 100);
}


/* =========================
   SOIL
========================= */

function selectMoisture(condition, percentage) {

    document.getElementById("soilMoisture").textContent =
        percentage + "%";

    document.getElementById("soilCondition").textContent =
        condition;

    document.getElementById("soilMoistureDisplay").textContent =
        percentage + "%";

    document.getElementById("soilConditionDisplay").textContent =
        condition;

    document.getElementById("moistureFill").style.width =
        percentage + "%";

    playSound(500, 200);

    fetch(`${API_URL}/soil`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            moisture: percentage,
            condition: condition
        })

    }).catch(error => {
        console.log("Soil error:", error);
    });
}


/* =========================
   WATER
========================= */

function selectWaterLevel(percentage) {

    document.getElementById("waterLevel").textContent =
        percentage + "%";

    document.getElementById("waterLevelDisplay").textContent =
        percentage + "%";

    document.getElementById("tankWater").style.height =
        percentage + "%";

    playSound(350, 250);

    setTimeout(() => {
        playSound(450, 180);
    }, 150);

    fetch(`${API_URL}/water`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            water_level: percentage
        })

    }).catch(error => {
        console.log("Water error:", error);
    });
}


/* =========================
   TEMPERATURE
========================= */

function selectTemperature(temperature) {

    document.getElementById("temperature").textContent =
        temperature + "°C";

    document.getElementById("temperatureDisplay").textContent =
        temperature + "°C";

    playSound(650, 150);

    fetch(`${API_URL}/temperature`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            temperature: temperature
        })

    }).catch(error => {
        console.log("Temperature error:", error);
    });
}


/* =========================
   PUMP
========================= */

function controlPump(status) {

    playSound(
        status === "on" ? 300 : 250,
        200,
        "square",
        0.2
    );

    fetch(`${API_URL}/pump`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            status: status
        })

    })

    .then(response => response.json())

    .then(data => {

        updatePumpDisplay(data.pump);

        if (data.robot_task) {
            document.getElementById("robotTask").textContent =
                data.robot_task;
        }

    })

    .catch(error => {
        console.log("Pump error:", error);
    });
}


function updatePumpDisplay(isOn) {

    const status =
        document.getElementById("pumpStatus");

    const indicator =
        document.getElementById("pumpIndicator");

    if (!status || !indicator) return;

    status.textContent =
        isOn ? "ON" : "OFF";

    indicator.textContent =
        isOn ? "ON" : "OFF";

    indicator.classList.remove("on", "off");

    indicator.classList.add(
        isOn ? "on" : "off"
    );
}


/* =========================
   AUTOMATIC IRRIGATION
========================= */

function setAutomaticMode(enabled) {

    fetch(`${API_URL}/automatic`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            enabled: enabled
        })

    })

    .then(response => response.json())

    .then(data => {

        updateAutomaticDisplay(
            data.automatic_irrigation
        );

        updatePumpDisplay(data.pump);

        if (data.robot_task) {
            document.getElementById("robotTask").textContent =
                data.robot_task;
        }

    })

    .catch(error => {
        console.log("Automatic error:", error);
    });
}


function updateAutomaticDisplay(isOn) {

    const status =
        document.getElementById("automaticStatus");

    const indicator =
        document.getElementById("automaticIndicator");

    if (!status || !indicator) return;

    status.textContent =
        isOn ? "ON" : "OFF";

    indicator.textContent =
        isOn ? "ON" : "OFF";

    indicator.classList.remove("on", "off");

    indicator.classList.add(
        isOn ? "on" : "off"
    );
}


/* =========================
   SELECT FARM ROBOT
========================= */

function selectFarmRobot(robotNumber) {

    console.log("Selecting robot:", robotNumber);

    selectedRobotNumber = robotNumber;

    // Save selected robot in browser
    localStorage.setItem(
        "selectedRobot",
        robotNumber
    );

    const robotNames = {
        1: "Soil Monitoring Robot",
        2: "Irrigation Robot",
        3: "Crop Monitoring Robot",
        4: "Fertilizer Robot",
        5: "Farm Transport Robot"
    };

    const robotName =
        robotNames[robotNumber];

    // Update dashboard immediately
    document.getElementById("selectedRobotName").textContent =
        robotName;

    document.getElementById("robotWorkStatus").textContent =
        "READY";

    document.getElementById("farmRobotStatus").textContent =
        "READY";

    document.getElementById("robotTask").textContent =
        robotName + " is ready to work.";

    playSound(750, 100);

    // Tell backend
    fetch(`${API_URL}/robot/select`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            robot: robotNumber
        })

    })

    .then(response => response.json())

    .then(data => {

        console.log(
            "Robot selected:",
            data
        );

        if (data.success === true) {

            selectedRobotNumber = robotNumber;

            localStorage.setItem(
                "selectedRobot",
                robotNumber
            );

            document.getElementById(
                "selectedRobotName"
            ).textContent = data.robot;

            document.getElementById(
                "robotTask"
            ).textContent =
                data.robot_task ||
                data.robot + " is ready to work.";

        }

    })

    .catch(error => {

        console.log(
            "Backend selection error:",
            error
        );

        // IMPORTANT:
        // The browser selection remains valid
        // even if backend connection fails.

        document.getElementById(
            "robotTask"
        ).textContent =
            robotName + " selected and ready.";

    });
}


/* =========================
   START ROBOT WORK
========================= */

function startRobotWork() {

    console.log(
        "START WORK clicked."
    );

    console.log(
        "Selected robot:",
        selectedRobotNumber
    );

    // Try to recover robot from browser storage
    if (!selectedRobotNumber) {

        const savedRobot =
            localStorage.getItem(
                "selectedRobot"
            );

        if (savedRobot) {
            selectedRobotNumber =
                Number(savedRobot);
        }
    }

    // If STILL no robot
    if (!selectedRobotNumber) {

        alert(
            "Please select a robot first."
        );

        return;
    }

    const robotNames = {
        1: "Soil Monitoring Robot",
        2: "Irrigation Robot",
        3: "Crop Monitoring Robot",
        4: "Fertilizer Robot",
        5: "Farm Transport Robot"
    };

    const robotName =
        robotNames[selectedRobotNumber];

    console.log(
        "Starting:",
        robotName
    );

    // Immediately show working
    robotWorking = true;

    document.getElementById(
        "robotWorkStatus"
    ).textContent = "WORKING";

    document.getElementById(
        "farmRobotStatus"
    ).textContent = "WORKING";

    document.getElementById(
        "robotTask"
    ).textContent =
        "Starting " + robotName + "...";

    document.getElementById(
        "workingRobot"
    ).classList.add("working");

    playSound(700, 150);

    setTimeout(() => {
        playSound(900, 150);
    }, 180);


    // Send selected robot AND working status
    fetch(`${API_URL}/robot/select`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            robot: selectedRobotNumber
        })

    })

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Could not select robot on backend."
            );
        }

        return response.json();
    })

    .then(selectData => {

        console.log(
            "Backend robot selection:",
            selectData
        );

        // Now start work
        return fetch(
            `${API_URL}/robot/work`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    working: true
                })

            }
        );

    })

    .then(response => {

        if (!response.ok) {

            return response.json()
                .then(data => {

                    throw new Error(
                        data.message ||
                        "Robot could not start."
                    );

                });
        }

        return response.json();

    })

    .then(data => {

        console.log(
            "Robot work response:",
            data
        );

        robotWorking = true;

        document.getElementById(
            "robotWorkStatus"
        ).textContent = "WORKING";

        document.getElementById(
            "farmRobotStatus"
        ).textContent = "WORKING";

        document.getElementById(
            "robotTask"
        ).textContent =
            data.robot_task ||
            "Robot is working.";

        document.getElementById(
            "workingRobot"
        ).classList.add("working");

        updatePumpDisplay(
            data.pump || false
        );

        startFarmWork();

    })

    .catch(error => {

        console.log(
            "Backend work error:",
            error
        );

        // Keep the visual robot working
        // even if backend is temporarily unavailable.

        document.getElementById(
            "robotTask"
        ).textContent =
            robotName + " is working.";

        startFarmWork();
    });
}


/* =========================
   FARM WORK ANIMATION
========================= */

function startFarmWork() {

    clearInterval(workTimer);

    workTimer = setInterval(() => {

        if (!robotWorking) {
            return;
        }

        moveWorkingRobot();

    }, 2500);
}


function moveWorkingRobot() {

    const robot =
        document.getElementById(
            "workingRobot"
        );

    if (!robot) return;

    farmRobotPosition += 8;

    if (farmRobotPosition >= 80) {
        farmRobotPosition = 15;
    }

    robot.style.left =
        farmRobotPosition + "%";

    document.getElementById(
        "farmRobotStatus"
    ).textContent =
        "WORKING • CHECKING CROPS";

    setTimeout(() => {

        if (!robotWorking) return;

        document.getElementById(
            "farmRobotStatus"
        ).textContent =
            "WORKING • IRRIGATING";

    }, 1000);
}


/* =========================
   PAUSE
========================= */

function pauseRobotWork() {

    robotWorking = false;

    clearInterval(workTimer);

    fetch(`${API_URL}/robot/work`, {

        method: "POST",

        headers: {
            "Content-Type":
                "application/json"
        },

        body: JSON.stringify({
            working: false
        })

    })

    .then(response => response.json())

    .then(data => {

        document.getElementById(
            "robotWorkStatus"
        ).textContent = "PAUSED";

        document.getElementById(
            "farmRobotStatus"
        ).textContent = "PAUSED";

        document.getElementById(
            "robotTask"
        ).textContent =
            data.robot_task ||
            "Robot work paused.";

        document.getElementById(
            "workingRobot"
        ).classList.remove("working");

        updatePumpDisplay(
            data.pump || false
        );

    })

    .catch(error => {

        console.log(
            "Pause error:",
            error
        );

        document.getElementById(
            "robotWorkStatus"
        ).textContent = "PAUSED";

        document.getElementById(
            "farmRobotStatus"
        ).textContent = "PAUSED";

        document.getElementById(
            "robotTask"
        ).textContent =
            "Robot work paused.";

        document.getElementById(
            "workingRobot"
        ).classList.remove("working");
    });

    playSound(400, 150);
}


/* =========================
   STOP
========================= */

function stopRobotWork() {

    robotWorking = false;

    clearInterval(workTimer);

    fetch(`${API_URL}/robot/stop`, {
        method: "POST"
    })

    .then(response => response.json())

    .then(data => {

        document.getElementById(
            "robotWorkStatus"
        ).textContent = "STOPPED";

        document.getElementById(
            "farmRobotStatus"
        ).textContent = "STOPPED";

        document.getElementById(
            "robotTask"
        ).textContent =
            data.robot_task ||
            "Robot stopped.";

        document.getElementById(
            "workingRobot"
        ).classList.remove("working");

        updatePumpDisplay(false);

    })

    .catch(error => {

        console.log(
            "Stop error:",
            error
        );

        document.getElementById(
            "robotWorkStatus"
        ).textContent = "STOPPED";

        document.getElementById(
            "farmRobotStatus"
        ).textContent = "STOPPED";

        document.getElementById(
            "robotTask"
        ).textContent =
            "Robot stopped.";

        document.getElementById(
            "workingRobot"
        ).classList.remove("working");
    });

    playSound(
        250,
        200,
        "square",
        0.2
    );
}


/* =========================
   ALERT
========================= */

function testAlertSound() {

    getAudioContext();

    playAlertSound();

    document.getElementById(
        "systemAlert"
    ).textContent =
        "🔊 TEST ALERT: Sound is working.";
}


function checkSystemAlert() {

    playAlertSound();

    fetch(`${API_URL}/alerts`)

    .then(response => response.json())

    .then(data => {

        document.getElementById(
            "systemAlert"
        ).textContent =
            data.alerts.join(" | ");

    })

    .catch(error => {

        console.log(
            "Alert error:",
            error
        );

    });
}


/* =========================
   LOAD SYSTEM STATUS
========================= */

function loadSystemStatus() {

    fetch(`${API_URL}/status`)

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Backend not responding."
            );
        }

        return response.json();

    })

    .then(data => {

        document.getElementById(
            "soilMoisture"
        ).textContent =
            data.soil_moisture + "%";

        document.getElementById(
            "soilCondition"
        ).textContent =
            data.soil_condition;

        document.getElementById(
            "soilMoistureDisplay"
        ).textContent =
            data.soil_moisture + "%";

        document.getElementById(
            "soilConditionDisplay"
        ).textContent =
            data.soil_condition;

        document.getElementById(
            "moistureFill"
        ).style.width =
            data.soil_moisture + "%";

        document.getElementById(
            "waterLevel"
        ).textContent =
            data.water_level + "%";

        document.getElementById(
            "waterLevelDisplay"
        ).textContent =
            data.water_level + "%";

        document.getElementById(
            "tankWater"
        ).style.height =
            data.water_level + "%";

        document.getElementById(
            "temperature"
        ).textContent =
            data.temperature + "°C";

        document.getElementById(
            "temperatureDisplay"
        ).textContent =
            data.temperature + "°C";

        document.getElementById(
            "battery"
        ).textContent =
            data.battery + "%";

        updatePumpDisplay(data.pump);

        updateAutomaticDisplay(
            data.automatic_irrigation
        );

    })

    .catch(error => {

        console.log(
            "Backend error:",
            error
        );

        document.getElementById(
            "systemAlert"
        ).textContent =
            "⚠️ Backend is offline.";

    });
}


/* =========================
   START SYSTEM
========================= */

function startSystem() {

    // Recover previously selected robot
    const savedRobot =
        localStorage.getItem(
            "selectedRobot"
        );

    if (savedRobot) {

        selectedRobotNumber =
            Number(savedRobot);

        console.log(
            "Recovered robot:",
            selectedRobotNumber
        );
    }

    loadSystemStatus();
}