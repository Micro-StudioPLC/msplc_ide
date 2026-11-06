import React, { useState } from 'react';
import { TargetBoard, SimulationState } from '../types/embedded';
import { Volume2, VolumeX, Activity, Power, Sliders, ToggleLeft, Gauge, Radio } from 'lucide-react';

interface HardwareBoardProps {
  targetBoard: TargetBoard;
  simState: SimulationState;
  onSetAnalog: (pin: string, value: number) => void;
  onSetDigital: (pin: number, value: number) => void;
  onPlayRelaySound?: () => void;
}

export const HardwareBoard: React.FC<HardwareBoardProps> = ({
  targetBoard,
  simState,
  onSetAnalog,
  onSetDigital,
  onPlayRelaySound
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Digital pin states
  const pin13State = simState.activeOutputs[13] === 1;
  const relay1State = simState.relays[8] || simState.activeOutputs[8] === 1;
  const relay2State = simState.relays[7] || simState.activeOutputs[7] === 1;
  const pwm9Val = simState.pwmOutputs[9] || 0;
  const pwm9Percent = Math.round((pwm9Val / 255) * 100);

  // Button pressed states (active LOW for pull-ups)
  const btn2Pressed = simState.digitalInputs[2] === 0;
  const btn3Pressed = simState.digitalInputs[3] === 0;
  const btn4Pressed = simState.digitalInputs[4] === 0;

  const handleButtonDown = (pin: number) => {
    onSetDigital(pin, 0); // Active LOW pressed
  };

  const handleButtonUp = (pin: number) => {
    onSetDigital(pin, 1); // Released
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] overflow-y-auto select-none border-l border-[#30363d]">
      {/* Top Header of Hardware Panel */}
      <div className="px-4 py-3 bg-[#1c2128] border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Virtual Target Simulator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title={soundEnabled ? 'Relay Sound FX Enabled' : 'Relay Sound FX Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
            simState.isRunning
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-[#21262d] text-slate-400 border border-[#30363d]'
          }`}>
            {simState.isRunning ? (simState.isPaused ? 'PAUSED' : 'ONLINE') : 'STOPPED'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Board Enclosure Graphic / DIN-Rail Industrial Core */}
        <div className="bg-[#0d1117] rounded-xl border border-[#30363d] p-3 shadow-inner relative overflow-hidden">
          {/* Subtle PCB grid lines background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#388bfd_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Device Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#21262d] mb-3">
            <div>
              <div className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                <span>{targetBoard.name}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {targetBoard.mcu} · {targetBoard.clockSpeed} · {targetBoard.voltage}
              </div>
            </div>
            {/* 24V Power Indicator */}
            <div className="flex items-center gap-1.5 bg-[#161b22] px-2 py-1 rounded border border-[#21262d]">
              <span className={`w-2 h-2 rounded-full ${simState.isRunning ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-mono text-slate-400">PWR</span>
            </div>
          </div>

          {/* Visual Built-in Pin 13 LED */}
          <div className="bg-[#161b22] rounded-lg p-3 border border-[#21262d] flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                    pin13State
                      ? 'bg-rose-500 border-rose-400 shadow-[0_0_18px_#f43f5e]'
                      : 'bg-[#21262d] border-[#30363d]'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${pin13State ? 'bg-rose-200' : 'bg-[#30363d]'}`} />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">Built-in LED (Pin 13)</div>
                <div className="text-[11px] font-mono text-slate-500">
                  State: <span className={pin13State ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {pin13State ? 'HIGH (1)' : 'LOW (0)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Micro toggle indicator */}
            <div className="text-right">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                pin13State ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-[#21262d] text-slate-500'
              }`}>
                {pin13State ? 'ENERGIZED' : 'IDLE'}
              </span>
            </div>
          </div>

          {/* 16x2 Character Alphanumeric LCD Matrix */}
          <div className="mb-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
              <span>HD44780 Alphanumeric LCD (16x2)</span>
              <span className="text-[10px] text-slate-500">I2C 0x27</span>
            </div>
            <div className="bg-[#244222] rounded-lg p-3 border-2 border-[#193018] shadow-inner font-mono text-sm tracking-widest text-[#a8ff9c] [text-shadow:0_0_6px_rgba(168,255,156,0.6)]">
              <div className="h-5 leading-5 truncate select-text">
                {simState.lcdLines[0].padEnd(16, ' ')}
              </div>
              <div className="h-5 leading-5 truncate select-text">
                {simState.lcdLines[1].padEnd(16, ' ')}
              </div>
            </div>
          </div>

          {/* Industrial Relay Modules (Pins 8 & 7) */}
          <div className="space-y-2 mb-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Industrial Relay Outputs (Form-A)</span>
              <span className="text-[10px] text-slate-500">250V / 10A</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Relay 1 */}
              <div className={`p-2.5 rounded-lg border transition-all ${
                relay1State
                  ? 'bg-amber-950/40 border-amber-600/60 shadow-[0_0_12px_rgba(217,119,6,0.2)]'
                  : 'bg-[#161b22] border-[#21262d]'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Relay 1 (Pin 8)</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    relay1State ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-[#30363d]'
                  }`} />
                </div>
                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  Contact: <span className={relay1State ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    {relay1State ? 'CLOSED (NO)' : 'OPEN (NC)'}
                  </span>
                </div>
                <div className="w-full bg-[#21262d] rounded h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${relay1State ? 'bg-amber-500 w-full' : 'w-0'}`}
                  />
                </div>
              </div>

              {/* Relay 2 */}
              <div className={`p-2.5 rounded-lg border transition-all ${
                relay2State
                  ? 'bg-amber-950/40 border-amber-600/60 shadow-[0_0_12px_rgba(217,119,6,0.2)]'
                  : 'bg-[#161b22] border-[#21262d]'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Relay 2 (Pin 7)</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    relay2State ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-[#30363d]'
                  }`} />
                </div>
                <div className="text-[11px] font-mono text-slate-400 mb-2">
                  Contact: <span className={relay2State ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                    {relay2State ? 'CLOSED (NO)' : 'OPEN (NC)'}
                  </span>
                </div>
                <div className="w-full bg-[#21262d] rounded h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${relay2State ? 'bg-amber-500 w-full' : 'w-0'}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Digital Input Pushbuttons */}
          <div className="mb-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Interactive Digital Inputs</span>
              <span className="text-[10px] text-slate-500">Hold / Click</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Button Pin 2: Start */}
              <button
                onMouseDown={() => handleButtonDown(2)}
                onMouseUp={() => handleButtonUp(2)}
                onTouchStart={() => handleButtonDown(2)}
                onTouchEnd={() => handleButtonUp(2)}
                className={`py-2 px-2 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  btn2Pressed
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_#10b981]'
                    : 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">START</span>
                <span className="text-[10px] font-mono text-slate-400">Pin 2 (DI 1)</span>
              </button>

              {/* Button Pin 3: Stop */}
              <button
                onMouseDown={() => handleButtonDown(3)}
                onMouseUp={() => handleButtonUp(3)}
                onTouchStart={() => handleButtonDown(3)}
                onTouchEnd={() => handleButtonUp(3)}
                className={`py-2 px-2 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  btn3Pressed
                    ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_12px_#ef4444]'
                    : 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">STOP / E-STOP</span>
                <span className="text-[10px] font-mono text-slate-400">Pin 3 (DI 2)</span>
              </button>

              {/* Button Pin 4: Aux */}
              <button
                onMouseDown={() => handleButtonDown(4)}
                onMouseUp={() => handleButtonUp(4)}
                onTouchStart={() => handleButtonDown(4)}
                onTouchEnd={() => handleButtonUp(4)}
                className={`py-2 px-2 rounded-lg border flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  btn4Pressed
                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_#3b82f6]'
                    : 'bg-[#161b22] hover:bg-[#21262d] border-[#30363d] text-slate-300'
                }`}
              >
                <span className="text-xs font-bold">AUX IN</span>
                <span className="text-[10px] font-mono text-slate-400">Pin 4 (DI 3)</span>
              </button>
            </div>
          </div>

          {/* Interactive Analog Sensors (Potentiometer / 0-10V Transmitter) */}
          <div className="space-y-3 mb-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between">
              <span>Analog Sensors & Setpoints</span>
              <span className="text-[10px] text-slate-500">10-bit ADC (0-1023)</span>
            </div>

            {/* Pot A0 */}
            <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#21262d]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">A0: Temp / Process Sensor</span>
                <span className="font-mono text-blue-400 font-bold">
                  {simState.analogInputs.A0 || 0} ({( (simState.analogInputs.A0 || 0) * (5.0 / 1023.0) ).toFixed(2)}V)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1023"
                value={simState.analogInputs.A0 || 0}
                onChange={(e) => onSetAnalog('A0', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Pot A1 */}
            <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#21262d]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-200">A1: Target Setpoint / Speed</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {simState.analogInputs.A1 || 0} ({Math.round(((simState.analogInputs.A1 || 0) / 1023) * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1023"
                value={simState.analogInputs.A1 || 0}
                onChange={(e) => onSetAnalog('A1', parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* PWM Output Actuator (Pin 9) */}
          <div className="bg-[#161b22] p-2.5 rounded-lg border border-[#21262d]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">PWM Output (Pin 9)</span>
              <span className="font-mono text-purple-400 font-bold">{pwm9Val} / 255 ({pwm9Percent}%)</span>
            </div>
            <div className="w-full bg-[#21262d] rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-100"
                style={{ width: `${pwm9Percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
