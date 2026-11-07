import React, { useRef } from 'react';
import { Cpu, Play, Pause, Zap, HardDrive, Download, RefreshCw, CheckCircle, AlertTriangle, User, LogOut, FileJson, Leaf, FolderOpen, Save } from 'lucide-react';
import { TargetBoard, TargetBoardId } from '../types/embedded';
import { TARGET_BOARDS } from '../data/boards';
import { User as UserType } from '../types/auth';

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
  onOpenCode: (code: string, fileName?: string) => void;
  onSaveCode: () => void;
  onDownloadSketch: () => void;
  currentUser: UserType | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenUsersJsonViewer: () => void;
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
  onOpenCode,
  onSaveCode,
  onDownloadSketch,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenUsersJsonViewer
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content !== undefined) {
        onOpenCode(content, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset so reopening the same file works
  };

  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Leaf className="w-4 h-4" />
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

      {/* Zone 2: Open / Save buttons, Target Controller selector */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Hidden file input for Open */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".ino,.cpp,.c,.msp,.txt,.h"
          className="hidden"
        />

        {/* Open Button (to the left of Target list) */}
        <button
          onClick={handleOpenClick}
          title="Open code file from computer (.msp, .ino, .cpp)"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-lg border border-[#30363d] transition-colors cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Open</span>
        </button>

        {/* Save Button (to the left of Target list) */}
        <button
          onClick={onSaveCode}
          title="Save code to computer"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-lg border border-[#30363d] transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 text-blue-400" />
          <span>Save</span>
        </button>

        {/* Target Controller Selector: Only Intermediary Language Specs (MSPv1) */}
        <div className="flex items-center gap-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400 text-[11px]">Target:</span>
          <select
            value={currentTarget.id}
            onChange={(e) => {
              const selected = TARGET_BOARDS.find(b => b.id === (e.target.value as TargetBoardId));
              if (selected) onSelectTarget(selected);
            }}
            className="bg-transparent text-emerald-300 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
          >
            {TARGET_BOARDS.map((board) => (
              <option key={board.id} value={board.id} className="bg-[#161b22] text-slate-200">
                {board.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export Binary / Source */}
        <button
          onClick={onDownloadSketch}
          title="Export code file"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-lg border border-[#30363d] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>

        {/* Inspect users.json button */}
        <button
          onClick={onOpenUsersJsonViewer}
          title="Inspect data/users.json database"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-300 hover:text-emerald-100 bg-emerald-950/40 hover:bg-emerald-900/60 rounded-lg border border-emerald-700/40 transition-colors cursor-pointer"
        >
          <FileJson className="w-3.5 h-3.5 text-emerald-400" />
          <span>users.json</span>
        </button>
      </div>

      {/* Zone 3: The 3-Button Pipeline + User Profile */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 1. COMPILE BUTTON */}
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            isCompiling
              ? 'bg-blue-800 text-blue-200 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
          title="Verify and build Intermediary Binary Language"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
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
              className="p-1.5 text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] rounded-lg border border-[#30363d] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3. FLASH TARGET BUTTON */}
        <button
          onClick={onFlashTarget}
          disabled={isFlashing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
            isFlashing
              ? 'bg-amber-600 text-white animate-pulse'
              : 'bg-amber-600/90 hover:bg-amber-500 text-white'
          }`}
          title="Connect via WebSerial API to flash physical USB target"
        >
          <Zap className="w-3.5 h-3.5 text-amber-200" />
          <span>{isFlashing ? 'Flashing...' : '🔌 Flash'}</span>
        </button>

        {/* User Account / Profile */}
        <div className="h-5 w-[1px] bg-[#30363d] mx-1" />

        {currentUser ? (
          <div className="flex items-center gap-2 bg-[#0d1f17] border border-emerald-600/40 rounded-lg px-2.5 py-1">
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center font-bold text-[11px]">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-medium text-emerald-200 max-w-[100px] truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[9px] font-mono text-emerald-400/80 leading-none">
                {currentUser.role ? currentUser.role.split(' ')[0] : 'Engineer'}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1 text-emerald-400/70 hover:text-rose-400 hover:bg-emerald-950/80 rounded transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/40 transition-colors shadow-sm cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
