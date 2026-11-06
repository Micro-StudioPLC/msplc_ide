import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { TARGET_BOARDS } from './data/boards';
import { EXAMPLES } from './data/examples';
import { TargetBoard, CompilationResult, SimulationState, WebSerialStatus } from './types/embedded';
import { CompilerEngine } from './services/compilerEngine';
import { SimulatorRuntime } from './services/simulatorRuntime';
import { webSerialFlasher } from './services/webSerialFlasher';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { HardwareBoard } from './components/HardwareBoard';
import { BottomConsole } from './components/BottomConsole';

export default function App() {
  // Target Microcontroller / PLC Board
  const [currentTarget, setCurrentTarget] = useState<TargetBoard>(TARGET_BOARDS[0]);
  
  // Active Sketch Code
  const [activeExampleId, setActiveExampleId] = useState<string>(EXAMPLES[0].id);
  const [code, setCode] = useState<string>(EXAMPLES[0].code);

  // Compiler State
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilation, setCompilation] = useState<CompilationResult | null>(null);

  // Simulator Runtime & State
  const simRuntimeRef = useRef<SimulatorRuntime | null>(null);
  const [simState, setSimState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    speed: 1.0,
    cycles: 0,
    simulatedTimeMs: 0,
    lcdLines: ['TANK CONTROLLER ', 'STATUS: STANDBY '],
    relays: { 7: false, 8: false },
    analogInputs: { A0: 450, A1: 220, A2: 100, A3: 0 },
    digitalInputs: { 2: 1, 3: 1, 4: 1 },
    activeOutputs: { 13: 0 },
    pwmOutputs: { 9: 0, 10: 0 },
    serialOutput: ['[V-MCU] Virtual Target powered on. Ready.']
  });

  // WebSerial Flasher State
  const [webSerialStatus, setWebSerialStatus] = useState<WebSerialStatus>(webSerialFlasher.getStatus());
  const [webSerialLogs, setWebSerialLogs] = useState<{ timestamp: string; text: string; type: 'sys' | 'info' | 'err' | 'rx' | 'tx' }[]>([
    { timestamp: new Date().toLocaleTimeString(), text: 'WebSerial Flasher subsystem initialized.', type: 'sys' }
  ]);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Initialize Simulator on Mount
  useEffect(() => {
    const sim = new SimulatorRuntime(currentTarget);
    sim.setCallback((newState) => {
      setSimState(newState);
    });
    simRuntimeRef.current = sim;

    // WebSerial Flasher callbacks
    webSerialFlasher.setCallbacks(
      (status) => {
        setWebSerialStatus(status);
        if (status.stage === 'writing' || status.stage === 'syncing' || status.stage === 'requesting' || status.stage === 'erasing') {
          setIsFlashing(true);
        } else {
          setIsFlashing(false);
        }
      },
      (logEntry) => {
        setWebSerialLogs((prev) => [...prev.slice(-300), logEntry]);
      }
    );

    // Initial silent compile for memory metrics
    const initialResult = CompilerEngine.compile(code, currentTarget);
    setCompilation(initialResult);

    return () => {
      sim.stop();
      webSerialFlasher.disconnect();
    };
  }, []);

  // Update simulator when board changes
  const handleSelectTarget = (newBoard: TargetBoard) => {
    setCurrentTarget(newBoard);
    if (simRuntimeRef.current) {
      simRuntimeRef.current.updateTargetBoard(newBoard);
    }
    // Re-run compilation to update target memory footprint
    const res = CompilerEngine.compile(code, newBoard);
    setCompilation(res);
  };

  // Load Example Sketch
  const handleLoadExample = (exampleId: string) => {
    const ex = EXAMPLES.find(e => e.id === exampleId);
    if (!ex) return;
    setActiveExampleId(exampleId);
    setCode(ex.code);
    const target = TARGET_BOARDS.find(b => b.id === ex.target) || TARGET_BOARDS[0];
    setCurrentTarget(target);
    if (simRuntimeRef.current) {
      simRuntimeRef.current.updateTargetBoard(target);
      if (simState.isRunning) {
        simRuntimeRef.current.start(ex.code);
      }
    }
    const res = CompilerEngine.compile(ex.code, target);
    setCompilation(res);
  };

  // Compile Pipeline Action
  const handleCompile = () => {
    setIsCompiling(true);
    setTimeout(() => {
      const result = CompilerEngine.compile(code, currentTarget);
      setCompilation(result);
      setIsCompiling(false);
    }, 400);
  };

  // Simulate Action
  const handleToggleSimulate = () => {
    if (!simRuntimeRef.current) return;

    if (simState.isRunning) {
      if (simState.isPaused) {
        simRuntimeRef.current.resume();
      } else {
        simRuntimeRef.current.pause();
      }
    } else {
      // Ensure compiled first
      if (!compilation || compilation.status !== 'success') {
        const res = CompilerEngine.compile(code, currentTarget);
        setCompilation(res);
        if (res.status !== 'success') {
          return;
        }
      }
      simRuntimeRef.current.start(code);
    }
  };

  const handleResetSimulate = () => {
    if (simRuntimeRef.current) {
      simRuntimeRef.current.start(code);
    }
  };

  // Flash Target Action
  const handleFlashTarget = async () => {
    // 1. Ensure compilation is up-to-date
    let hexPayload = compilation?.intelHex;
    if (!compilation || compilation.status !== 'success' || !hexPayload) {
      const res = CompilerEngine.compile(code, currentTarget);
      setCompilation(res);
      if (res.status !== 'success') {
        setWebSerialLogs(prev => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString(), text: 'Cannot flash: Build errors exist in C++ sketch.', type: 'err' }
        ]);
        return;
      }
      hexPayload = res.intelHex;
    }

    setIsFlashing(true);
    const success = await webSerialFlasher.flashFirmware(hexPayload, currentTarget.name);
    setIsFlashing(false);

    if (success) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch {}
    }
  };

  // Download .ino sketch
  const handleDownloadSketch = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTarget.id}_sketch.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Jump to error line
  const handleJumpToLine = (line: number) => {
    // line indicator is highlighted in CodeEditor
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0d1117] text-slate-200">
      {/* 1. Header with Top-Bar Contract & 3-Button Pipeline */}
      <Header
        currentTarget={currentTarget}
        onSelectTarget={handleSelectTarget}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        compileStatus={compilation?.status || 'idle'}
        onToggleSimulate={handleToggleSimulate}
        isSimulating={simState.isRunning}
        isPaused={simState.isPaused}
        onResetSimulate={handleResetSimulate}
        onFlashTarget={handleFlashTarget}
        isFlashing={isFlashing}
        onLoadExample={handleLoadExample}
        onDownloadSketch={handleDownloadSketch}
        activeExampleId={activeExampleId}
      />

      {/* 2. Workspace: Code Editor (Left) & Simulated Hardware View (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: C++ Code Editor */}
        <div className="flex-1 h-full min-w-0">
          <CodeEditor
            code={code}
            onChange={(newCode) => setCode(newCode)}
            errors={compilation?.errors || []}
            warnings={compilation?.warnings || []}
            onCompile={handleCompile}
            currentExecutingLine={simState.isRunning ? simState.currentExecutingLine : undefined}
          />
        </div>

        {/* Right: Simulated Hardware View */}
        <div className="w-[380px] xl:w-[420px] h-full shrink-0">
          <HardwareBoard
            targetBoard={currentTarget}
            simState={simState}
            onSetAnalog={(pin, val) => simRuntimeRef.current?.setAnalogInput(pin, val)}
            onSetDigital={(pin, val) => simRuntimeRef.current?.setDigitalInput(pin, val)}
            onPlayRelaySound={() => simRuntimeRef.current?.playRelayClickSound()}
          />
        </div>
      </div>

      {/* 3. Bottom Console Dock (Serial Monitor, Diagnostics, Disassembly, WebSerial Flasher) */}
      <BottomConsole
        compilation={compilation}
        targetBoard={currentTarget}
        serialLogs={simState.serialOutput}
        onSendSerial={(cmd) => {
          simRuntimeRef.current?.sendSerialInput(cmd);
          webSerialFlasher.sendSerial(cmd);
        }}
        onClearSerial={() => {
          setSimState(prev => ({ ...prev, serialOutput: [] }));
        }}
        webSerialStatus={webSerialStatus}
        webSerialLogs={webSerialLogs}
        onFlashTarget={handleFlashTarget}
        onToggleLoopback={(enabled) => webSerialFlasher.setLoopbackMock(enabled)}
        onSetBaudRate={(baud) => webSerialFlasher.setBaudRate(baud)}
        onJumpToLine={handleJumpToLine}
      />
    </div>
  );
}
