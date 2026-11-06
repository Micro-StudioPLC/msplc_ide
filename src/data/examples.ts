import { ExampleProject } from '../types/embedded';

export const EXAMPLES: ExampleProject[] = [
  {
    id: 'plc_conveyor_interlock',
    title: 'Industrial Motor Interlock (Start / Stop / E-Stop)',
    category: 'Industrial Automation',
    target: 'industrial_plc',
    description: 'Classic 3-wire PLC motor starter with momentary Start button (Pin 2), Stop button (Pin 3), safety interlock relay (Pin 8), and running beacon (Pin 13).',
    code: `// ========================================================
// Industrial Conveyor / Motor Starter Interlock Logic
// Web MCU Studio - C++ PLC Architecture
// ========================================================

const int PIN_BTN_START  = 2;   // Opto-Isolated Input 1 (NO)
const int PIN_BTN_STOP   = 3;   // Opto-Isolated Input 2 (NC)
const int PIN_RELAY_MAIN = 8;   // 10A Heavy Relay Output 1
const int PIN_RELAY_AUX  = 7;   // Aux Warning Siren Relay 2
const int PIN_LED_RUN    = 13;  // Front Panel Run Indicator

bool motorRunning = false;
unsigned long runStartTime = 0;
unsigned long lastTelemetry = 0;

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_BTN_START, INPUT_PULLUP);
  pinMode(PIN_BTN_STOP, INPUT_PULLUP);
  pinMode(PIN_RELAY_MAIN, OUTPUT);
  pinMode(PIN_RELAY_AUX, OUTPUT);
  pinMode(PIN_LED_RUN, OUTPUT);

  digitalWrite(PIN_RELAY_MAIN, LOW);
  digitalWrite(PIN_RELAY_AUX, LOW);
  digitalWrite(PIN_LED_RUN, LOW);

  Serial.println("[PLC INIT] Controllino/Opta Kernel Ready.");
  Serial.println("[PLC INIT] Safety circuit energized. Waiting for Start command.");
}

void loop() {
  // Read inputs (active LOW with internal pullups)
  bool startPressed = (digitalRead(PIN_BTN_START) == LOW);
  bool stopPressed  = (digitalRead(PIN_BTN_STOP) == LOW);

  // Safety E-Stop / Stop takes immediate precedence
  if (stopPressed && motorRunning) {
    motorRunning = false;
    digitalWrite(PIN_RELAY_MAIN, LOW);
    digitalWrite(PIN_RELAY_AUX, LOW);
    digitalWrite(PIN_LED_RUN, LOW);
    Serial.println("[ALERT] Motor STOPPED by operator interlock.");
  }
  // Start sequence
  else if (startPressed && !motorRunning) {
    motorRunning = true;
    runStartTime = millis();
    digitalWrite(PIN_RELAY_MAIN, HIGH);
    digitalWrite(PIN_LED_RUN, HIGH);
    Serial.println("[PLC] Motor contactor ENGAGED (Relay 1 ON).");
  }

  // Periodic diagnostics telemetry (every 1000ms)
  if (millis() - lastTelemetry >= 1000) {
    lastTelemetry = millis();
    if (motorRunning) {
      unsigned long uptimeSec = (millis() - runStartTime) / 1000;
      Serial.print("[STATUS] MOTOR: ACTIVE | Run Time: ");
      Serial.print(uptimeSec);
      Serial.println("s | Coil: ENERGIZED (24V)");
    } else {
      Serial.println("[STATUS] MOTOR: STANDBY | Safety OK | Ready to Start");
    }
  }

  delay(50); // PLC scan cycle pacing
}
`
  },
  {
    id: 'smart_thermostat_lcd',
    title: 'Smart Thermostat & Tank Heating with LCD',
    category: 'Control Systems',
    target: 'industrial_plc',
    description: 'Closed-loop temperature & tank heater with analog sensor (A0), hysteresis deadband, Relay 1 heater, and 16x2 character LCD telemetry.',
    code: `// ========================================================
// Smart Thermostat & Tank Heater with Virtual 16x2 LCD
// Web MCU Studio - Temperature Feedback Controller
// ========================================================

const int PIN_TEMP_SENSOR = A0;  // 0-10V Analog Temp Sensor (0 - 100 C)
const int PIN_SETPOINT_POT = A1; // Operator Setpoint Potentiometer
const int PIN_RELAY_HEATER = 8;  // High-Power Heater Relay (Relay 1)
const int PIN_LED_HEATING  = 13; // Heating Active Status LED

const float HYSTERESIS = 2.0; // +/- 2 deg C deadband
bool heatingActive = false;
unsigned long lastLcdUpdate = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_HEATER, OUTPUT);
  pinMode(PIN_LED_HEATING, OUTPUT);
  digitalWrite(PIN_RELAY_HEATER, LOW);

  Serial.println("[SYSTEM] Tank Thermostat Controller V1.0");
  Serial.println("[SYSTEM] Initializing 16x2 Alphanumeric Display...");
}

void loop() {
  // Read analog temperature sensor (0-1023 mapped to 10.0 - 90.0 C)
  int rawTemp = analogRead(PIN_TEMP_SENSOR);
  float currentTemp = 10.0 + (rawTemp / 1023.0) * 80.0;

  // Read target setpoint (mapped to 30.0 - 75.0 C)
  int rawSet = analogRead(PIN_SETPOINT_POT);
  float targetTemp = 30.0 + (rawSet / 1023.0) * 45.0;

  // Bang-bang control with hysteresis
  if (currentTemp < (targetTemp - HYSTERESIS) && !heatingActive) {
    heatingActive = true;
    digitalWrite(PIN_RELAY_HEATER, HIGH);
    digitalWrite(PIN_LED_HEATING, HIGH);
    Serial.println("[HEATER] ON -> Temp below setpoint deadband.");
  } 
  else if (currentTemp > (targetTemp + HYSTERESIS) && heatingActive) {
    heatingActive = false;
    digitalWrite(PIN_RELAY_HEATER, LOW);
    digitalWrite(PIN_LED_HEATING, LOW);
    Serial.println("[HEATER] OFF -> Target temperature reached.");
  }

  // Update virtual 16x2 LCD and serial every 500ms
  if (millis() - lastLcdUpdate >= 500) {
    lastLcdUpdate = millis();

    Serial.print("[TELEMETRY] Current: ");
    Serial.print(currentTemp, 1);
    Serial.print("C | Target: ");
    Serial.print(targetTemp, 1);
    Serial.print("C | State: ");
    Serial.println(heatingActive ? "HEATING" : "IDLE");
  }

  delay(50);
}
`
  },
  {
    id: 'serial_command_gateway',
    title: 'Serial Command Gateway & IoT Relay Controller',
    category: 'IoT & Gateways',
    target: 'esp32_gateway',
    description: 'ASCII text protocol parser over Serial UART. Type commands like "RELAY1 ON", "RELAY1 OFF", "STATUS", or "READ A0" directly in the Serial Monitor!',
    code: `// ========================================================
// Serial Command Gateway / ASCII UART Parser
// Send commands via Serial Monitor:
//   "ON"        -> Turn Relay 1 ON
//   "OFF"       -> Turn Relay 1 OFF
//   "TOGGLE"    -> Toggle Relay 1
//   "STATUS"    -> Query system health & inputs
//   "READ"      -> Read Analog Channels A0 & A1
// ========================================================

const int PIN_RELAY_1 = 8;
const int PIN_RELAY_2 = 7;
const int PIN_LED_SYS = 13;

bool r1State = false;
bool r2State = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);
  pinMode(PIN_LED_SYS, OUTPUT);

  digitalWrite(PIN_RELAY_1, LOW);
  digitalWrite(PIN_RELAY_2, LOW);
  digitalWrite(PIN_LED_SYS, HIGH);

  Serial.println("=========================================");
  Serial.println("  ESP32 Serial Gateway Ready @ 115200  ");
  Serial.println("  Type 'HELP', 'ON', 'OFF', or 'STATUS' ");
  Serial.println("=========================================");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    cmd.toUpperCase();

    if (cmd == "ON" || cmd == "RELAY1 ON") {
      r1State = true;
      digitalWrite(PIN_RELAY_1, HIGH);
      Serial.println("+OK: Relay 1 ENERGIZED");
    }
    else if (cmd == "OFF" || cmd == "RELAY1 OFF") {
      r1State = false;
      digitalWrite(PIN_RELAY_1, LOW);
      Serial.println("+OK: Relay 1 DE-ENERGIZED");
    }
    else if (cmd == "TOGGLE") {
      r1State = !r1State;
      digitalWrite(PIN_RELAY_1, r1State ? HIGH : LOW);
      Serial.print("+OK: Relay 1 toggled to ");
      Serial.println(r1State ? "ON" : "OFF");
    }
    else if (cmd == "STATUS") {
      Serial.println("+STATUS REPORT:");
      Serial.print("  - Relay 1: ");
      Serial.println(r1State ? "ACTIVE" : "OFF");
      Serial.print("  - Analog A0: ");
      Serial.println(analogRead(A0));
      Serial.print("  - System Uptime: ");
      Serial.print(millis() / 1000);
      Serial.println(" seconds");
    }
    else if (cmd == "READ") {
      Serial.print("+ADC: A0=");
      Serial.print(analogRead(A0));
      Serial.print(" A1=");
      Serial.println(analogRead(A1));
    }
    else if (cmd == "HELP") {
      Serial.println("Supported Commands: ON, OFF, TOGGLE, STATUS, READ");
    }
    else if (cmd.length() > 0) {
      Serial.print("-ERR: Unknown command '");
      Serial.print(cmd);
      Serial.println("'. Type HELP for syntax.");
    }
  }

  // Heartbeat pulse on Pin 13
  static unsigned long lastBeat = 0;
  if (millis() - lastBeat >= 1000) {
    lastBeat = millis();
    digitalWrite(PIN_LED_SYS, !digitalRead(PIN_LED_SYS));
  }

  delay(20);
}
`
  },
  {
    id: 'pwm_motor_valve',
    title: 'PWM Proportional Valve & Analog Positioner',
    category: 'Control Systems',
    target: 'arduino_uno',
    description: 'Proportional-Integral position control reading analog command on A0 and outputting high-frequency PWM on Pin 9 with live bargraph telemetry.',
    code: `// ========================================================
// PWM Proportional Actuator / Positioner
// Maps Analog Potentiometer A0 (0-1023) to Pin 9 PWM (0-255)
// ========================================================

const int PIN_POT_INPUT = A0;
const int PIN_PWM_VALVE = 9;   // High-speed PWM pin
const int PIN_LED_WARN  = 13;

int valveDutyCycle = 0;
int lastRaw = -1;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PWM_VALVE, OUTPUT);
  pinMode(PIN_LED_WARN, OUTPUT);

  Serial.println("[VALVE CTRL] Proportional 0-100% Modulator Active.");
}

void loop() {
  int rawInput = analogRead(PIN_POT_INPUT);
  
  // Calculate PWM duty (0 - 255) and percentage (0 - 100%)
  valveDutyCycle = map(rawInput, 0, 1023, 0, 255);
  int percent = map(valveDutyCycle, 0, 255, 0, 100);

  // Apply PWM signal
  analogWrite(PIN_PWM_VALVE, valveDutyCycle);

  // Warning LED lights up if valve is driven > 90%
  digitalWrite(PIN_LED_WARN, (percent > 90) ? HIGH : LOW);

  // Print telemetry only if moved by at least 10 units
  if (abs(rawInput - lastRaw) > 10) {
    lastRaw = rawInput;
    Serial.print("[VALVE] In: ");
    Serial.print(rawInput);
    Serial.print(" | PWM: ");
    Serial.print(valveDutyCycle);
    Serial.print("/255 (");
    Serial.print(percent);
    Serial.println("%)");
  }

  delay(40);
}
`
  },
  {
    id: 'traffic_light_fsm',
    title: 'Traffic & Pedestrian Controller (Finite State Machine)',
    category: 'Basics',
    target: 'arduino_uno',
    description: 'State machine controlling Red, Yellow, Green LEDs with a pedestrian crossing request pushbutton on Pin 2.',
    code: `// ========================================================
// Traffic Intersection & Pedestrian Crossing FSM
// Pin 13: Red LED | Pin 12: Yellow LED | Pin 11: Green LED
// Pin 2: Pedestrian Walk Request Button
// ========================================================

const int PIN_RED    = 13;
const int PIN_YELLOW = 12;
const int PIN_GREEN  = 11;
const int PIN_BUTTON = 2;

enum TrafficState {
  STATE_GREEN,
  STATE_YELLOW,
  STATE_RED,
  STATE_WALK
};

TrafficState currentState = STATE_GREEN;
unsigned long stateEnteredTime = 0;
bool pedestrianRequested = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RED, OUTPUT);
  pinMode(PIN_YELLOW, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_BUTTON, INPUT_PULLUP);

  setLights(LOW, LOW, HIGH); // Start with Green
  stateEnteredTime = millis();
  Serial.println("[INTERSECTION] Traffic Controller Online. State: GREEN");
}

void setLights(int red, int yellow, int green) {
  digitalWrite(PIN_RED, red);
  digitalWrite(PIN_YELLOW, yellow);
  digitalWrite(PIN_GREEN, green);
}

void loop() {
  unsigned long now = millis();
  unsigned long elapsed = now - stateEnteredTime;

  // Check pedestrian button
  if (digitalRead(PIN_BUTTON) == LOW && !pedestrianRequested) {
    pedestrianRequested = true;
    Serial.println("[PEDESTRIAN] Button pressed! Service scheduled after green cycle.");
  }

  switch (currentState) {
    case STATE_GREEN:
      if (elapsed > 3000 || (pedestrianRequested && elapsed > 1500)) {
        currentState = STATE_YELLOW;
        stateEnteredTime = now;
        setLights(LOW, HIGH, LOW);
        Serial.println("[STATE] Transition -> YELLOW (Caution)");
      }
      break;

    case STATE_YELLOW:
      if (elapsed > 1000) {
        currentState = STATE_RED;
        stateEnteredTime = now;
        setLights(HIGH, LOW, LOW);
        Serial.println("[STATE] Transition -> RED (Stop)");
      }
      break;

    case STATE_RED:
      if (pedestrianRequested) {
        currentState = STATE_WALK;
        stateEnteredTime = now;
        Serial.println("[STATE] Transition -> PEDESTRIAN WALK PHASE (4s)");
      } else if (elapsed > 2500) {
        currentState = STATE_GREEN;
        stateEnteredTime = now;
        setLights(LOW, LOW, HIGH);
        Serial.println("[STATE] Transition -> GREEN (Flow)");
      }
      break;

    case STATE_WALK:
      // Walk phase: Red stays on, pedestrian safe
      if (elapsed > 3000) {
        pedestrianRequested = false;
        currentState = STATE_GREEN;
        stateEnteredTime = now;
        setLights(LOW, LOW, HIGH);
        Serial.println("[STATE] Transition -> GREEN (Resume vehicle flow)");
      }
      break;
  }

  delay(50);
}
`
  }
];
