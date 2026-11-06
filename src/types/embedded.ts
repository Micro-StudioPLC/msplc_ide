export type TargetBoardId = 'arduino_uno' | 'esp32_gateway' | 'industrial_plc' | 'rp2040_pico';

export interface TargetBoard {
  id: TargetBoardId;
  name: string;
  mcu: string;
  architecture: string;
  clockSpeed: string;
  flashSize: number; // in bytes
  ramSize: number;   // in bytes
  eepromSize: number;
  voltage: string;
  defaultBaud: number;
  digitalPins: number[];
  analogPins: string[];
  pwmPins: number[];
  hasRelays: boolean;
  relayCount: number;
  description: string;
}

export interface PinState {
  pin: number | string;
  name: string;
  mode: 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
  digitalValue: number; // 0 or 1
  analogValue: number;  // 0 to 1023 (input) or 0 to 255 (PWM output)
  isPwm: boolean;
  label?: string;
}

export interface CompileError {
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface CompilationResult {
  status: 'idle' | 'compiling' | 'success' | 'error';
  timestamp?: string;
  targetId: TargetBoardId;
  flashUsedBytes: number;
  flashTotalBytes: number;
  ramUsedBytes: number;
  ramTotalBytes: number;
  compileTimeMs: number;
  errors: CompileError[];
  warnings: CompileError[];
  intelHex: string;
  disassembly: string[];
  symbols: { name: string; address: string; size: number; section: string }[];
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speed: number; // 0.25, 0.5, 1, 2
  cycles: number;
  simulatedTimeMs: number;
  lcdLines: [string, string];
  relays: Record<number, boolean>;
  analogInputs: Record<string, number>; // e.g. A0: 512, A1: 256
  digitalInputs: Record<number, number>; // e.g. 2: 1, 3: 0
  activeOutputs: Record<number, number>; // pin -> 0 or 1
  pwmOutputs: Record<number, number>;    // pin -> 0 to 255
  serialOutput: string[];
  currentExecutingLine?: number;
}

export interface WebSerialStatus {
  supported: boolean;
  connected: boolean;
  portName?: string;
  baudRate: number;
  stage: 'idle' | 'requesting' | 'syncing' | 'erasing' | 'writing' | 'verifying' | 'completed' | 'error';
  progress: number;
  error?: string;
  isLoopbackMock: boolean;
}

export interface ExampleProject {
  id: string;
  title: string;
  category: 'Basics' | 'Industrial Automation' | 'IoT & Gateways' | 'Control Systems';
  target: TargetBoardId;
  description: string;
  code: string;
  config?: string;
}
