ffrom flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello World"

if __name__ == "__main__":
    app.run()

robots = {
    1: "Soil Monitoring Robot",
    2: "Irrigation Robot",
    3: "Crop Monitoring Robot",
    4: "Fertilizer Robot",
    5: "Farm Transport Robot"
}

system_data = {
    "soil_moisture": 50,
    "soil_condition": "Normal",
    "water_level": 80,
    "temperature": 25,
    "battery": 100,
    "pump": False,
    "automatic_irrigation": False,
    "robot_status": "STOPPED",
    "selected_robot": None,
    "robot_working": False,
    "robot_task": "Waiting for instruction",
    "alert": "System operating normally."
}


@app.route("/")
def home():
    return jsonify({
        "message": "Smart Irrigation Robot Backend is running!",
        "status": "online"
    })


@app.route("/api/status", methods=["GET"])
def get_status():
    return jsonify(system_data)


@app.route("/api/soil", methods=["POST"])
def set_soil():
    data = request.get_json() or {}

    system_data["soil_moisture"] = data.get(
        "moisture",
        system_data["soil_moisture"]
    )

    system_data["soil_condition"] = data.get(
        "condition",
        system_data["soil_condition"]
    )

    return jsonify({
        "success": True,
        "soil_moisture": system_data["soil_moisture"],
        "soil_condition": system_data["soil_condition"]
    })


@app.route("/api/water", methods=["POST"])
def set_water():
    data = request.get_json() or {}

    system_data["water_level"] = data.get(
        "water_level",
        system_data["water_level"]
    )

    if system_data["water_level"] <= 20:
        system_data["alert"] = "Warning: Water tank is very low."
    else:
        system_data["alert"] = "System operating normally."

    return jsonify(system_data)


@app.route("/api/temperature", methods=["POST"])
def set_temperature():
    data = request.get_json() or {}

    system_data["temperature"] = data.get(
        "temperature",
        system_data["temperature"]
    )

    return jsonify(system_data)


@app.route("/api/pump", methods=["POST"])
def control_pump():
    data = request.get_json() or {}

    status = data.get("status", "off")

    if status == "on":
        system_data["pump"] = True
        system_data["robot_task"] = "Water pump is running"
    else:
        system_data["pump"] = False
        system_data["robot_task"] = "Water pump is OFF"

    return jsonify({
        "success": True,
        "pump": system_data["pump"],
        "robot_task": system_data["robot_task"],
        "robot_status": system_data["robot_status"]
    })


@app.route("/api/automatic", methods=["POST"])
def automatic_irrigation():
    data = request.get_json() or {}

    enabled = bool(data.get("enabled", False))

    system_data["automatic_irrigation"] = enabled

    if enabled:
        system_data["robot_working"] = True
        system_data["robot_status"] = "WORKING"
        system_data["pump"] = True
        system_data["robot_task"] = "Automatic irrigation is working"
        system_data["alert"] = "Automatic irrigation is active."

    else:
        system_data["robot_working"] = False
        system_data["robot_status"] = "STOPPED"
        system_data["pump"] = False
        system_data["robot_task"] = "Automatic irrigation stopped"
        system_data["alert"] = "Automatic irrigation stopped."

    return jsonify({
        "success": True,
        "automatic_irrigation":
            system_data["automatic_irrigation"],
        "pump": system_data["pump"],
        "robot_working":
            system_data["robot_working"],
        "robot_status":
            system_data["robot_status"],
        "robot_task":
            system_data["robot_task"],
        "alert":
            system_data["alert"]
    })


@app.route("/api/robot/select", methods=["POST"])
def select_robot():
    data = request.get_json() or {}

    robot_number = data.get("robot")

    try:
        robot_number = int(robot_number)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid robot number."
        }), 400

    if robot_number not in robots:
        return jsonify({
            "success": False,
            "message": "Invalid robot."
        }), 400

    system_data["selected_robot"] = robot_number
    system_data["robot_working"] = False
    system_data["robot_status"] = "READY"
    system_data["robot_task"] = (
        robots[robot_number] + " is ready to work."
    )

    return jsonify({
        "success": True,
        "robot": robots[robot_number],
        "robot_status": "READY",
        "robot_working": False,
        "robot_task": system_data["robot_task"]
    })


@app.route("/api/robot/work", methods=["POST"])
def robot_work():
    data = request.get_json() or {}

    working = bool(data.get("working", False))

    if system_data["selected_robot"] is None:
        return jsonify({
            "success": False,
            "message": "Please select a robot first.",
            "robot_task": "No robot selected."
        }), 400

    selected_robot = system_data["selected_robot"]
    robot_name = robots[selected_robot]

    if working:

        system_data["robot_working"] = True
        system_data["robot_status"] = "WORKING"

        if selected_robot == 1:
            task = "Monitoring soil moisture"

        elif selected_robot == 2:
            task = "Irrigating crops"

        elif selected_robot == 3:
            task = "Monitoring crops"

        elif selected_robot == 4:
            task = "Applying fertilizer"

        else:
            task = "Transporting farm materials"

        system_data["robot_task"] = task
        system_data["alert"] = (
            robot_name + " is working."
        )

        # Irrigation robot automatically turns on pump
        if selected_robot == 2:
            system_data["pump"] = True

    else:

        system_data["robot_working"] = False
        system_data["robot_status"] = "PAUSED"

        system_data["robot_task"] = (
            robot_name + " work paused."
        )

        system_data["alert"] = (
            robot_name + " has been paused."
        )

        system_data["pump"] = False

    return jsonify({
        "success": True,
        "robot": robot_name,
        "robot_working":
            system_data["robot_working"],
        "robot_status":
            system_data["robot_status"],
        "robot_task":
            system_data["robot_task"],
        "pump":
            system_data["pump"],
        "alert":
            system_data["alert"]
    })


@app.route("/api/robot/stop", methods=["POST"])
def stop_robot():

    system_data["robot_working"] = False
    system_data["robot_status"] = "STOPPED"
    system_data["pump"] = False
    system_data["robot_task"] = "Robot stopped."
    system_data["alert"] = "Robot has been stopped."

    return jsonify({
        "success": True,
        "robot_working": False,
        "robot_status": "STOPPED",
        "robot_task": "Robot stopped.",
        "pump": False,
        "alert": "Robot has been stopped."
    })


@app.route("/api/alerts", methods=["GET"])
def get_alerts():

    alerts = []

    if system_data["water_level"] <= 20:
        alerts.append(
            "Warning: Water tank is very low."
        )

    if system_data["battery"] <= 20:
        alerts.append(
            "Warning: Battery is very low."
        )

    if system_data["temperature"] >= 35:
        alerts.append(
            "Warning: High temperature detected."
        )

    if not alerts:
        alerts.append(
            system_data["alert"]
        )

    return jsonify({
        "alerts": alerts
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )