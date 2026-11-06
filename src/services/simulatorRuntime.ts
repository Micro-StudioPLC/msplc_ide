import { SimulationState, TargetBoard } from '../types/embedded';

export type SimulationCallback = (state: SimulationState) => void;

export class SimulatorRuntime {
  private state: SimulationState;
  private targetBoard: TargetBoard;
  private isSimulating: boolean = false;
  private loopTimer: any = null;
  private callback?: SimulationCallback;
  private audioCtx: AudioContext | null = null;

  // Virtual memory & execution environment
  private variables: Map<string, any> = new Map();
  private pinModes: Map<number, string> = new Map();
  private serialRxQueue: string[] = [];
  private virtualTime: number = 0;
  private lastDelayExpiry: number = 0;
  private astStatements: { line: number; raw: string; type: string; payload?: any }[] = [];
  private currentAstIndex: number = 0;
  private inSetupPhase: boolean = true;
  private userSourceCode: string = '';

  constructor(targetBoard: TargetBoard) {
    this.targetBoard = targetBoard;
    this.state = this.getInitialState();
  }

  private getInitialState(): SimulationState {
    return {
      isRunning: false,
      isPaused: false,
      speed: 1.0,
      cycles: 0,
      simulatedTimeMs: 0,
      lcdLines: ['TANK CONTROLLER ', 'STATUS: STANDBY '],
      relays: { 7: false, 8: false },
      analogInputs: { A0: 450, A1: 220, A2: 100, A3: 0 },
      digitalInputs: { 2: 1, 3: 1, 4: 1 }, // High by default (pull-up)
      activeOutputs: { 13: 0 },
      pwmOutputs: { 9: 0, 10: 0 },
      serialOutput: ['[V-MCU] Virtual Target powered on. Ready.']
    };
  }

  public setCallback(cb: SimulationCallback) {
    this.callback = cb;
  }

  public updateTargetBoard(board: TargetBoard) {
    this.targetBoard = board;
  }

  public setAnalogInput(pin: string, value: number) {
    this.state.analogInputs[pin] = Math.max(0, Math.min(1023, value));
    this.notify();
  }

  public setDigitalInput(pin: number, value: number) {
    this.state.digitalInputs[pin] = value ? 1 : 0;
    this.notify();
  }

  public sendSerialInput(text: string) {
    this.serialRxQueue.push(text);
    this.logSerial(`[UART RX] << ${text}`);
  }

  public playRelayClickSound() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        // Synthesize short physical relay contact click
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.04);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public start(code: string) {
    this.stop();
    this.userSourceCode = code;
    this.state = this.getInitialState();
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.isSimulating = true;
    this.virtualTime = 0;
    this.variables.clear();
    this.pinModes.clear();
    this.inSetupPhase = true;
    this.currentAstIndex = 0;
    this.serialRxQueue = [];

    // Parse AST instructions
    this.parseCode(code);

    this.logSerial(`[BOOT] Initializing ${this.targetBoard.name} (${this.targetBoard.mcu}) at ${this.targetBoard.clockSpeed}...`);
    this.runTickLoop();
    this.notify();
  }

  public pause() {
    this.state.isPaused = true;
    this.notify();
  }

  public resume() {
    this.state.isPaused = false;
    this.notify();
  }

  public step() {
    if (!this.state.isRunning) return;
    this.executeSingleInstruction();
    this.notify();
  }

  public stop() {
    this.isSimulating = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.activeOutputs = { 13: 0 };
    this.state.relays = { 7: false, 8: false };
    this.notify();
  }

  public setSpeed(speed: number) {
    this.state.speed = speed;
    this.notify();
  }

  private notify() {
    if (this.callback) {
      this.callback({ ...this.state });
    }
  }

  private logSerial(msg: string) {
    const timeStr = new Date().toLocaleTimeString();
    this.state.serialOutput.push(`[${timeStr}] ${msg}`);
    if (this.state.serialOutput.length > 500) {
      this.state.serialOutput.shift();
    }
    this.notify();
  }

  private parseCode(code: string) {
    this.astStatements = [];
    const lines = code.split('\n');

    let inSetup = false;
    let inLoop = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) continue;

      if (/void\s+setup\s*\(/.test(line)) {
        inSetup = true;
        inLoop = false;
        continue;
      }
      if (/void\s+loop\s*\(/.test(line)) {
        inSetup = false;
        inLoop = true;
        continue;
      }

      // Inside setup or loop
      this.astStatements.push({
        line: i + 1,
        raw: line,
        type: inSetup ? 'setup_stmt' : (inLoop ? 'loop_stmt' : 'global_stmt')
      });
    }
  }

  private runTickLoop() {
    if (!this.isSimulating) return;

    if (!this.state.isPaused) {
      const stepCount = Math.max(1, Math.round(4 * this.state.speed));
      for (let s = 0; s < stepCount; s++) {
        this.executeSingleInstruction();
      }
    }

    const interval = Math.max(10, Math.round(50 / this.state.speed));
    this.loopTimer = setTimeout(() => {
      this.runTickLoop();
    }, interval);
  }

  private executeSingleInstruction() {
    this.state.cycles++;
    this.virtualTime += 20;
    this.state.simulatedTimeMs = this.virtualTime;

    if (this.astStatements.length === 0) return;

    if (this.currentAstIndex >= this.astStatements.length) {
      // Loop around loop_stmts
      const firstLoopIdx = this.astStatements.findIndex(s => s.type === 'loop_stmt');
      this.currentAstIndex = firstLoopIdx !== -1 ? firstLoopIdx : 0;
      this.inSetupPhase = false;
    }

    const stmt = this.astStatements[this.currentAstIndex];
    this.state.currentExecutingLine = stmt.line;
    this.currentAstIndex++;

    this.interpretStatement(stmt.raw);
  }

  private interpretStatement(rawStmt: string) {
    const s = rawStmt.replace(/;$/, '').trim();

    // 1. Serial.print / println
    const serialMatch = s.match(/Serial\.(println|print)\s*\((.*)\)/);
    if (serialMatch) {
      const arg = serialMatch[2].trim();
      const val = this.evaluateExpression(arg);
      this.logSerial(`> ${val}`);
      return;
    }

    // 2. pinMode(pin, mode)
    const pinModeMatch = s.match(/pinMode\s*\(\s*([^,]+),\s*([^)]+)\)/);
    if (pinModeMatch) {
      const pin = this.evaluateExpression(pinModeMatch[1].trim());
      const mode = pinModeMatch[2].trim();
      this.pinModes.set(Number(pin), mode);
      return;
    }

    // 3. digitalWrite(pin, value)
    const digitalWrMatch = s.match(/digitalWrite\s*\(\s*([^,]+),\s*([^)]+)\)/);
    if (digitalWrMatch) {
      const pin = Number(this.evaluateExpression(digitalWrMatch[1].trim()));
      const valRaw = digitalWrMatch[2].trim();
      const val = valRaw.toUpperCase().includes('HIGH') || valRaw === '1' || valRaw.toUpperCase().includes('TRUE') ? 1 : 0;

      const prevOut = this.state.activeOutputs[pin] || 0;
      this.state.activeOutputs[pin] = val;

      // Pin 8 & 7 drive Relays
      if (pin === 8 || pin === 7) {
        const prevRelay = !!this.state.relays[pin];
        this.state.relays[pin] = val === 1;
        if (prevRelay !== (val === 1)) {
          this.playRelayClickSound();
          this.logSerial(`[HARDWARE] Relay on Pin ${pin} clicked ${val === 1 ? 'CLOSED (ON)' : 'OPEN (OFF)'}`);
        }
      }

      // Update virtual LCD status if relevant
      if (pin === 8) {
        this.state.lcdLines[1] = val === 1 ? 'RELAY1: [ON] 24V ' : 'RELAY1: [OFF]    ';
      }

      return;
    }

    // 4. analogWrite(pin, pwm)
    const analogWrMatch = s.match(/analogWrite\s*\(\s*([^,]+),\s*([^)]+)\)/);
    if (analogWrMatch) {
      const pin = Number(this.evaluateExpression(analogWrMatch[1].trim()));
      const val = Math.max(0, Math.min(255, Number(this.evaluateExpression(analogWrMatch[2].trim()))));
      this.state.pwmOutputs[pin] = val;
      return;
    }

    // 5. Variable assignment / updates
    const assignMatch = s.match(/(?:(?:int|float|bool|long|unsigned)\s+)?([a-zA-Z0-9_]+)\s*=\s*(.*)/);
    if (assignMatch) {
      const varName = assignMatch[1].trim();
      const expr = assignMatch[2].trim();
      const val = this.evaluateExpression(expr);
      this.variables.set(varName, val);
      return;
    }

    // 6. If conditions (simple evaluation)
    if (s.startsWith('if')) {
      const condMatch = s.match(/if\s*\((.*)\)/);
      if (condMatch) {
        const cond = condMatch[1].trim();
        const res = this.evaluateCondition(cond);
        if (!res) {
          // If condition is false, advance to next statement
          this.currentAstIndex++;
        }
      }
    }
  }

  private evaluateExpression(expr: string): any {
    const clean = expr.trim();

    // String literal
    if (clean.startsWith('"') && clean.endsWith('"')) {
      return clean.slice(1, -1);
    }

    // millis()
    if (clean.includes('millis()')) {
      return this.virtualTime;
    }

    // digitalRead(pin)
    const dReadMatch = clean.match(/digitalRead\s*\(\s*([^)]+)\)/);
    if (dReadMatch) {
      const pinVal = Number(this.evaluateExpression(dReadMatch[1]));
      return this.state.digitalInputs[pinVal] ?? 1;
    }

    // analogRead(pin)
    const aReadMatch = clean.match(/analogRead\s*\(\s*([^)]+)\)/);
    if (aReadMatch) {
      const pinStr = aReadMatch[1].trim();
      return this.state.analogInputs[pinStr] ?? (pinStr === 'A0' ? 512 : 256);
    }

    // Serial.available()
    if (clean.includes('Serial.available()')) {
      return this.serialRxQueue.length > 0 ? 1 : 0;
    }

    // Serial.readStringUntil(...)
    if (clean.includes('Serial.readStringUntil')) {
      return this.serialRxQueue.shift() || '';
    }

    // Constants
    if (clean === 'HIGH') return 1;
    if (clean === 'LOW') return 0;
    if (clean === 'true') return true;
    if (clean === 'false') return false;

    // Check variable map
    if (this.variables.has(clean)) {
      return this.variables.get(clean);
    }

    // Numeric literal
    const num = Number(clean);
    if (!isNaN(num)) return num;

    return clean;
  }

  private evaluateCondition(cond: string): boolean {
    if (cond.includes('==')) {
      const [left, right] = cond.split('==');
      return this.evaluateExpression(left) == this.evaluateExpression(right);
    }
    if (cond.includes('!=')) {
      const [left, right] = cond.split('!=');
      return this.evaluateExpression(left) != this.evaluateExpression(right);
    }
    if (cond.includes('>=')) {
      const [left, right] = cond.split('>=');
      return Number(this.evaluateExpression(left)) >= Number(this.evaluateExpression(right));
    }
    if (cond.includes('<=')) {
      const [left, right] = cond.split('<=');
      return Number(this.evaluateExpression(left)) <= Number(this.evaluateExpression(right));
    }
    if (cond.includes('>')) {
      const [left, right] = cond.split('>');
      return Number(this.evaluateExpression(left)) > Number(this.evaluateExpression(right));
    }
    if (cond.includes('<')) {
      const [left, right] = cond.split('<');
      return Number(this.evaluateExpression(left)) < Number(this.evaluateExpression(right));
    }
    return Boolean(this.evaluateExpression(cond));
  }
}
