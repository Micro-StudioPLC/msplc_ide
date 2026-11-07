import React, { useRef, useState, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import { FileCode, PlusCircle, AlertCircle, Sparkles } from 'lucide-react';
import { CompileError } from '../types/embedded';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  errors: CompileError[];
  warnings: CompileError[];
  onCompile: () => void;
  currentExecutingLine?: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  errors,
  warnings,
  onCompile,
  currentExecutingLine
}) => {
  const [activeTab, setActiveTab] = useState<'main' | 'pins' | 'config'>('main');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const [pinsHeader] = useState(`// ========================================================
// PLC & Microcontroller I/O Pin Map
// ========================================================
#ifndef PLC_PINS_H
#define PLC_PINS_H

// Digital Inputs (24V Opto-Isolated)
#define DI_CH1          2   // Digital In 1 (Start Button)
#define DI_CH2          3   // Digital In 2 (Stop Button)
#define DI_CH3          4   // Digital In 3 (Aux Limit Switch)

// Relay Outputs (10A 250VAC Form-A)
#define RELAY_CH1       8   // Heavy Contactor 1
#define RELAY_CH2       7   // Siren / Warning Beacon 2

// Analog Inputs (0 - 10V DC)
#define AI_TEMP_SENSE   A0  // 4-20mA / 0-10V Temp Sensor
#define AI_PRESSURE     A1  // Pressure Transmitter

// Status Indicators
#define LED_HEARTBEAT   13  // On-Board CPU Indicator

#endif // PLC_PINS_H
`);

  const [configHeader] = useState(`// ========================================================
// System & Gateway Configuration Parameters
// ========================================================
#ifndef CONFIG_H
#define CONFIG_H

#define SYSTEM_VERSION     "0.9.4-GPL"
#define DEFAULT_BAUDRATE   115200
#define SCAN_TIME_MS       50
#define WATCHDOG_TIMEOUT   5000

#define HEATER_SETPOINT_C  55.0
#define HYSTERESIS_BAND_C  2.0

#endif // CONFIG_H
`);

  const lines = code.split('\n');

  // Sync scroll
  const handleScroll = () => {
    if (textareaRef.current) {
      const top = textareaRef.current.scrollTop;
      const left = textareaRef.current.scrollLeft;
      if (preRef.current) {
        preRef.current.scrollTop = top;
        preRef.current.scrollLeft = left;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const sync = () => {
      const top = textarea.scrollTop;
      const left = textarea.scrollLeft;
      if (preRef.current) {
        preRef.current.scrollTop = top;
        preRef.current.scrollLeft = left;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = top;
      }
    };
    textarea.addEventListener('scroll', sync, { passive: true });
    return () => textarea.removeEventListener('scroll', sync);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
      e.preventDefault();
      onCompile();
    }
  };

  const insertSnippet = (snippet: string) => {
    if (!textareaRef.current) return;
    const target = textareaRef.current;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    onChange(newCode);
    setTimeout(() => {
      if (textareaRef.current) {
        target.focus();
        target.selectionStart = target.selectionEnd = start + snippet.length;
      }
    }, 0);
  };

  // Syntax highlighting
  const highlightedCode = React.useMemo(() => {
    const activeText = activeTab === 'main' ? code : (activeTab === 'pins' ? pinsHeader : configHeader);
    try {
      return Prism.highlight(activeText, Prism.languages.cpp || Prism.languages.clike, 'cpp');
    } catch {
      return activeText;
    }
  }, [code, activeTab, pinsHeader, configHeader]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-[#30363d] overflow-hidden">
      {/* File Tabs & Snippet Toolbar */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-2 shrink-0 select-none">
        {/* Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'main'
                ? 'bg-[#0d1117] text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#21262d]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>sketch.ino</span>
            {errors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" title={`${errors.length} error(s)`} />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'pins'
                ? 'bg-[#0d1117] text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#21262d]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>plc_pins.h</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'bg-[#0d1117] text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-[#21262d]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>config.h</span>
          </button>
        </div>

        {/* Quick Snippets (only in main) */}
        {activeTab === 'main' && (
          <div className="hidden xl:flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-mono mr-1">Insert:</span>
            <button
              onClick={() => insertSnippet('\n  digitalWrite(13, HIGH);\n')}
              className="px-2 py-0.5 text-[11px] font-mono text-slate-300 bg-[#21262d] hover:bg-[#30363d] rounded border border-[#30363d] transition-colors"
              title="Insert digitalWrite(13, HIGH)"
            >
              digitalWrite()
            </button>
            <button
              onClick={() => insertSnippet('\n  int val = digitalRead(2);\n')}
              className="px-2 py-0.5 text-[11px] font-mono text-slate-300 bg-[#21262d] hover:bg-[#30363d] rounded border border-[#30363d] transition-colors"
              title="Insert digitalRead(2)"
            >
              digitalRead()
            </button>
            <button
              onClick={() => insertSnippet('\n  int sensor = analogRead(A0);\n')}
              className="px-2 py-0.5 text-[11px] font-mono text-slate-300 bg-[#21262d] hover:bg-[#30363d] rounded border border-[#30363d] transition-colors"
              title="Insert analogRead(A0)"
            >
              analogRead()
            </button>
            <button
              onClick={() => insertSnippet('\n  Serial.println("STATUS_OK");\n')}
              className="px-2 py-0.5 text-[11px] font-mono text-slate-300 bg-[#21262d] hover:bg-[#30363d] rounded border border-[#30363d] transition-colors"
              title="Insert Serial.println()"
            >
              Serial.print()
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 overflow-hidden flex">
        {/* Line Numbers Column */}
        <div
          ref={lineNumbersRef}
          className="w-12 bg-[#0d1117] border-r border-[#21262d] py-3 text-right pr-2.5 text-[12px] font-mono text-slate-600 select-none shrink-0 overflow-hidden"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const hasError = errors.some(e => e.line === lineNum);
            const hasWarning = warnings.some(w => w.line === lineNum);
            const isExec = currentExecutingLine === lineNum;

            return (
              <div key={lineNum} className="relative h-5 leading-5 flex items-center justify-end">
                {isExec && (
                  <span className="absolute left-1 text-[10px] text-emerald-400 font-bold" title="Current execution line">
                    ▶
                  </span>
                )}
                {hasError && (
                  <span className="absolute left-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Syntax Error" />
                )}
                {!hasError && hasWarning && (
                  <span className="absolute left-1 w-2 h-2 rounded-full bg-amber-500" title="Compiler Warning" />
                )}
                <span className={hasError ? 'text-rose-400 font-bold' : (isExec ? 'text-emerald-400 font-bold' : '')}>
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Text Container with synchronized syntax highlight layer */}
        <div className="relative flex-1 h-full overflow-hidden">
          {activeTab === 'main' ? (
            <>
              {/* Highlight layer */}
              <pre
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 m-0 py-3 pl-3 pr-6 text-[13px] font-mono leading-5 whitespace-pre overflow-hidden pointer-events-none text-slate-200"
                dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
              />

              {/* Editable transparent textarea layer */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => onChange(e.target.value)}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                className="absolute inset-0 w-full h-full m-0 py-3 pl-3 pr-6 text-[13px] font-mono leading-5 whitespace-pre bg-transparent text-transparent caret-blue-400 resize-none outline-none overflow-auto"
                style={{ tabSize: 2 }}
              />
            </>
          ) : (
            <div className="p-4 text-[13px] font-mono leading-5 text-slate-300 overflow-auto h-full">
              <pre
                className="whitespace-pre"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
              <div className="mt-4 text-xs text-slate-500 border-t border-[#21262d] pt-2">
                Header files are included automatically during compilation. Edit main logic in <code className="text-blue-400">sketch.ino</code>.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="h-6 bg-[#161b22] border-t border-[#21262d] px-3 flex items-center justify-between text-[11px] text-slate-500 select-none font-mono">
        <div className="flex items-center gap-3">
          <span>C++ (Arduino 2.3 Dialect)</span>
          <span>·</span>
          <span>UTF-8</span>
          <span>·</span>
          <span>{lines.length} lines</span>
          <span>·</span>
          <span>{code.length} chars</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Shortcuts: Ctrl+Enter (Compile)</span>
        </div>
      </div>
    </div>
  );
};
