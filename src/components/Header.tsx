import React from 'react';
import { Cpu, Play, Pause, Zap, HardDrive, BookOpen, Download, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TargetBoard, TargetBoardId } from '../types/embedded';
import { TARGET_BOARDS } from '../data/boards';
import { EXAMPLES } from '../data/examples';

interface HeaderProps {
  currentTarget: TargetBoard;
  onSelectTarget: (board: TargetBoard) => void;
  onCompile: () => void;
  isCompiling: boolean;
  compileStatus: 'idle' | 'compiling' | 'success' | 'error';
  onToggleSimulate: () => void;
  isSimulating: boolean;
  isPaused: boolean;
  onResetSimulate: () => void;
  onFlashTarget: () => void;
  isFlashing: boolean;
  onLoadExample: (exampleId: string) => void;
  onDownloadSketch: () => void;
  activeExampleId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTarget,
  onSelectTarget,
  onCompile,
  isCompiling,
  compileStatus,
  onToggleSimulate,
  isSimulating,
  isPaused,
  onResetSimulate,
  onFlashTarget,
  isFlashing,
  onLoadExample,
  onDownloadSketch,
  activeExampleId
}) => {
  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            Web MCU Studio
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#21262d] text-slate-400 border border-[#30363d]">
              GPL v3
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation, Target selector & Examples */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Target Board Selector */}
        <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs">
          <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Target:</span>
          <select
            value={currentTarget.id}
            onChange={(e) => {
              const selected = TARGET_BOARDS.find(b => b.id === (e.target.value as TargetBoardId));
              if (selected) onSelectTarget(selected);
            }}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
          >
            {TARGET_BOARDS.map((board) => (
              <option key={board.id} value={board.id} className="bg-[#161b22] text-slate-200">
                {board.name} ({board.mcu})
              </option>
            ))}
          </select>
        </div>

        {/* Examples Dropdown */}
        <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Sketches:</span>
          <select
            value={activeExampleId || ''}
            onChange={(e) => {
              if (e.target.value) onLoadExample(e.target.value);
            }}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[190px] truncate"
          >
            <option value="" disabled className="bg-[#161b22] text-slate-400">Load PLC / MCU Sketch...</option>
            {EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-[#161b22] text-slate-200">
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        {/* Export / Download Sketch */}
        <button
          onClick={onDownloadSketch}
          title="Download C++ Source (.ino)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-lg border border-[#30363d] transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* Zone 3: The 3-Button Pipeline */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 1. COMPILE BUTTON */}
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
            isCompiling
              ? 'bg-blue-800 text-blue-200 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
          title="Verify and build native C++ binaries"
        >
          <Cpu className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
          <span>{isCompiling ? 'Compiling...' : '⚙️ Compile'}</span>
          {compileStatus === 'success' && <CheckCircle className="w-3 h-3 text-emerald-300 ml-0.5" />}
          {compileStatus === 'error' && <AlertTriangle className="w-3 h-3 text-rose-300 ml-0.5" />}
        </button>

        {/* 2. SIMULATE BUTTON */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleSimulate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              isSimulating
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/40'
                : 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-50'
            }`}
            title="Execute simulation in sandboxed virtual MCU"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? (isPaused ? '▶️ Resume' : '⏸️ Pause') : '▶️ Simulate'}</span>
          </button>
          
          {isSimulating && (
            <button
              onClick={onResetSimulate}
              title="Reset MCU Execution State"
              className="p-1.5 text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-lg border border-[#30363d] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. FLASH TARGET BUTTON */}
        <button
          onClick={onFlashTarget}
          disabled={isFlashing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
            isFlashing
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-amber-600/90 hover:bg-amber-500 text-white'
          }`}
          title="Connect via WebSerial API to flash physical USB target"
        >
          <Zap className="w-3.5 h-3.5 text-amber-200" />
          <span>{isFlashing ? 'Flashing...' : '🔌 Flash'}</span>
        </button>
      </div>
    </header>
  );
};
