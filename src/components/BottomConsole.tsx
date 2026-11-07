import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Cpu, Binary, Zap, Send, Trash2, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { CompilationResult, TargetBoard, WebSerialStatus } from '../types/embedded';

interface BottomConsoleProps {
  compilation: CompilationResult | null;
  targetBoard: TargetBoard;
  serialLogs: string[];
  onSendSerial: (cmd: string) => void;
  onClearSerial: () => void;
  webSerialStatus: WebSerialStatus;
  webSerialLogs: { timestamp: string; text: string; type: 'sys' | 'info' | 'err' | 'rx' | 'tx' }[];
  onFlashTarget: () => void;
  onToggleLoopback: (enabled: boolean) => void;
  onSetBaudRate: (baud: number) => void;
  onJumpToLine?: (line: number) => void;
}

export const BottomConsole: React.FC<BottomConsoleProps> = ({
  compilation,
  targetBoard,
  serialLogs,
  onSendSerial,
  onClearSerial,
  webSerialStatus,
  webSerialLogs,
  onFlashTarget,
  onToggleLoopback,
  onSetBaudRate,
  onJumpToLine
}) => {
  const [activeTab, setActiveTab] = useState<'serial' | 'compiler' | 'disasm' | 'flasher'>('serial');
  const [inputCmd, setInputCmd] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const serialBottomRef = useRef<HTMLDivElement>(null);
  const flasherBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && activeTab === 'serial') {
      serialBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, autoScroll, activeTab]);

  useEffect(() => {
    if (autoScroll && activeTab === 'flasher') {
      flasherBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [webSerialLogs, autoScroll, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    onSendSerial(inputCmd);
    setInputCmd('');
  };

  const downloadHex = () => {
    if (!compilation || !compilation.intelHex) return;
    const blob = new Blob([compilation.intelHex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firmware_${targetBoard.id}.hex`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Memory calculations
  const flashUsed = compilation?.flashUsedBytes || 0;
  const flashTotal = targetBoard.flashSize;
  const flashPercent = Math.min(100, Math.round((flashUsed / flashTotal) * 100));

  const ramUsed = compilation?.ramUsedBytes || 0;
  const ramTotal = targetBoard.ramSize;
  const ramPercent = Math.min(100, Math.round((ramUsed / ramTotal) * 100));

  return (
    <div className="h-64 bg-[#0d1117] border-t border-[#30363d] flex flex-col shrink-0 select-none">
      {/* Dock Header Tabs */}
      <div className="h-9 bg-[#161b22] border-b border-[#30363d] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('serial')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'serial'
                ? 'bg-[#21262d] text-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Serial Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('compiler')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'compiler'
                ? 'bg-[#21262d] text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Compiler Diagnostics</span>
            {compilation?.status === 'error' && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
            {compilation?.status === 'success' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('disasm')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'disasm'
                ? 'bg-[#21262d] text-purple-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Disassembly &amp; HEX</span>
          </button>

          <button
            onClick={() => setActiveTab('flasher')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition-colors ${
              activeTab === 'flasher'
                ? 'bg-[#21262d] text-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>WebSerial Flasher</span>
            {webSerialStatus.connected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Tab-specific toolbar actions */}
        <div className="flex items-center gap-2 text-xs">
          {activeTab === 'serial' && (
            <>
              <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded bg-[#21262d] border-[#30363d] text-blue-500"
                />
                <span>Autoscroll</span>
              </label>
              <button
                onClick={onClearSerial}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#21262d] rounded transition-colors"
                title="Clear Serial Buffer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {activeTab === 'disasm' && compilation?.intelHex && (
            <button
              onClick={downloadHex}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 bg-[#21262d] hover:bg-[#30363d] text-slate-200 rounded border border-[#30363d] transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download .HEX</span>
            </button>
          )}
        </div>
      </div>

      {/* Dock Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* TAB 1: SERIAL MONITOR */}
        {activeTab === 'serial' && (
          <div className="flex flex-col h-full bg-[#0d1117]">
            {/* Log Stream */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 select-text">
              {serialLogs.length === 0 ? (
                <div className="text-slate-600 italic">Serial Monitor idle. Start simulation or flash device to view UART stream.</div>
              ) : (
                serialLogs.map((log, i) => (
                  <div key={i} className="leading-tight text-slate-300">
                    {log.startsWith('>') ? (
                      <span className="text-emerald-400 font-semibold">{log}</span>
                    ) : log.startsWith('[HARDWARE]') ? (
                      <span className="text-amber-400">{log}</span>
                    ) : log.startsWith('[ALERT]') || log.includes('ERR') ? (
                      <span className="text-rose-400">{log}</span>
                    ) : log.startsWith('[STATUS]') || log.startsWith('[TELEMETRY]') ? (
                      <span className="text-blue-300">{log}</span>
                    ) : (
                      <span className="text-slate-400">{log}</span>
                    )}
                  </div>
                ))
              )}
              <div ref={serialBottomRef} />
            </div>

            {/* Serial Send Input Form */}
            <form onSubmit={handleSend} className="h-9 bg-[#161b22] border-t border-[#30363d] px-3 flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-emerald-400 font-bold">&gt;</span>
              <input
                type="text"
                value={inputCmd}
                onChange={(e) => setInputCmd(e.target.value)}
                placeholder="Type Serial command (e.g. 'ON', 'OFF', 'STATUS', 'READ') and press Enter..."
                className="flex-1 bg-transparent text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-1 transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: COMPILER DIAGNOSTICS */}
        {activeTab === 'compiler' && (
          <div className="h-full overflow-y-auto p-4 bg-[#0d1117] text-xs">
            {compilation ? (
              <div className="space-y-4">
                {/* Memory Footprint Gauges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                  {/* Flash ROM */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">Flash Program Storage (ROM)</span>
                      <span className="font-mono text-blue-400 font-bold">
                        {flashUsed.toLocaleString()} / {flashTotal.toLocaleString()} bytes ({flashPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#21262d] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          flashPercent > 90 ? 'bg-rose-500' : (flashPercent > 70 ? 'bg-amber-500' : 'bg-blue-500')
                        }`}
                        style={{ width: `${flashPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Target limit: {Math.round(flashTotal / 1024)} KB for {targetBoard.mcu}
                    </div>
                  </div>

                  {/* RAM SRAM */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200">Dynamic Memory (SRAM)</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {ramUsed.toLocaleString()} / {ramTotal.toLocaleString()} bytes ({ramPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#21262d] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          ramPercent > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${ramPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Target limit: {Math.round(ramTotal / 1024)} KB for global variables &amp; stack
                    </div>
                  </div>
                </div>

                {/* Compilation Status & Diagnostics */}
                {compilation.status === 'success' ? (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-semibold text-emerald-300">Compilation Successful</span>
                        <div className="text-[11px] text-emerald-400/80">
                          Built Intermediary Binary Language for {targetBoard.name} in {compilation.compileTimeMs}ms at {compilation.timestamp}.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="font-semibold text-rose-300">Compilation Failed ({compilation.errors.length} error(s))</span>
                    </div>
                    <div className="space-y-1">
                      {compilation.errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-2 font-mono text-[11px] text-rose-300">
                          <button
                            onClick={() => onJumpToLine && onJumpToLine(err.line)}
                            className="bg-rose-900/40 hover:bg-rose-900/80 px-1.5 py-0.5 rounded text-rose-200 underline cursor-pointer"
                          >
                            Line {err.line}{err.column ? `:${err.column}` : ''}
                          </button>
                          <span>{err.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symbol Table */}
                {compilation.symbols.length > 0 && (
                  <div>
                    <div className="font-semibold text-slate-300 mb-2">Memory Segment Symbols:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
                      {compilation.symbols.map((sym, i) => (
                        <div key={i} className="bg-[#161b22] p-2 rounded border border-[#21262d]">
                          <div className="text-blue-400 truncate">{sym.name}</div>
                          <div className="text-slate-400 text-[10px]">{sym.address} · {sym.size}B</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 italic">No build executed yet. Click &quot;⚙️ Compile&quot; in the top bar.</div>
            )}
          </div>
        )}

        {/* TAB 3: DISASSEMBLY & HEX */}
        {activeTab === 'disasm' && (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-[#0d1117] font-mono text-xs">
            {/* Left: Disassembly */}
            <div className="border-r border-[#21262d] overflow-y-auto p-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                Machine Disassembly ({targetBoard.architecture})
              </div>
              {compilation && compilation.disassembly.length > 0 ? (
                compilation.disassembly.map((line, i) => (
                  <div key={i} className="leading-snug text-slate-300 select-text">
                    {line.startsWith(';') || line.startsWith('//') ? (
                      <span className="text-slate-500 italic">{line}</span>
                    ) : line.includes('<') && line.endsWith(':') ? (
                      <span className="text-purple-400 font-bold">{line}</span>
                    ) : (
                      <span className="text-slate-300">{line}</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-600 italic">Compile code to inspect assembly disassembly.</div>
              )}
            </div>

            {/* Right: Intel HEX Record */}
            <div className="overflow-y-auto p-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                MSPv1 Intermediary Binary Payload (Intel HEX)
              </div>
              {compilation && compilation.intelHex ? (
                <div className="text-blue-300 select-text leading-tight whitespace-pre">
                  {compilation.intelHex}
                </div>
              ) : (
                <div className="text-slate-600 italic">Compile code to generate Intel HEX payload.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WEBSERIAL FLASHER */}
        {activeTab === 'flasher' && (
          <div className="h-full flex flex-col bg-[#0d1117] text-xs">
            {/* Flasher Status Bar */}
            <div className="p-3 bg-[#161b22] border-b border-[#21262d] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-semibold text-slate-200">WebSerial USB Flasher</div>
                  <div className="text-[11px] text-slate-400">
                    Baud: {webSerialStatus.baudRate} · Target: {targetBoard.name}
                  </div>
                </div>

                {/* Baud Rate Picker */}
                <select
                  value={webSerialStatus.baudRate}
                  onChange={(e) => onSetBaudRate(parseInt(e.target.value, 10))}
                  className="bg-[#0d1117] text-slate-200 text-xs border border-[#30363d] rounded px-2 py-1 font-mono"
                >
                  <option value={115200}>115200 Baud</option>
                  <option value={57600}>57600 Baud</option>
                  <option value={38400}>38400 Baud</option>
                  <option value={19200}>19200 Baud</option>
                  <option value={9600}>9600 Baud</option>
                </select>

                {/* Mock Mode Checkbox */}
                <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer bg-[#21262d] px-2 py-1 rounded border border-[#30363d]">
                  <input
                    type="checkbox"
                    checked={webSerialStatus.isLoopbackMock}
                    onChange={(e) => onToggleLoopback(e.target.checked)}
                    className="rounded bg-[#0d1117] text-blue-500"
                  />
                  <span>Loopback Mock Target</span>
                </label>
              </div>

              {/* Flash Action Button */}
              <button
                onClick={onFlashTarget}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded shadow transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Start Flash Sequence</span>
              </button>
            </div>

            {/* Flashing Progress Bar (when active) */}
            {webSerialStatus.progress > 0 && (
              <div className="px-4 py-2 bg-[#1c2128] border-b border-[#30363d] shrink-0">
                <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                  <span className="text-amber-300 uppercase font-semibold">
                    Stage: {webSerialStatus.stage}
                  </span>
                  <span className="text-slate-300 font-bold">{webSerialStatus.progress}%</span>
                </div>
                <div className="w-full bg-[#21262d] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-150"
                    style={{ width: `${webSerialStatus.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Flasher Log Stream */}
            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1 select-text">
              {webSerialLogs.length === 0 ? (
                <div className="text-slate-600 italic">
                  Flasher terminal idle. Connect target MCU via USB and click &quot;🔌 Flash Target&quot;.
                </div>
              ) : (
                webSerialLogs.map((log, i) => (
                  <div key={i} className="leading-snug">
                    <span className="text-slate-600 mr-2">[{log.timestamp}]</span>
                    {log.type === 'err' ? (
                      <span className="text-rose-400 font-bold">{log.text}</span>
                    ) : log.type === 'sys' ? (
                      <span className="text-blue-400 font-semibold">{log.text}</span>
                    ) : log.type === 'rx' ? (
                      <span className="text-emerald-400">{log.text}</span>
                    ) : log.type === 'tx' ? (
                      <span className="text-amber-300">{log.text}</span>
                    ) : (
                      <span className="text-slate-300">{log.text}</span>
                    )}
                  </div>
                ))
              )}
              <div ref={flasherBottomRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
