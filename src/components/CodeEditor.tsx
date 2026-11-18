import React, { useRef, useEffect, useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Bookmark
} from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  onCompile: () => void;
  activeLine?: number;
  breakpoints: Set<number>;
  onToggleBreakpoint: (line: number) => void;
  error?: string;
  errorLine?: number;
  isRunning: boolean;
  isDirty?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onCompile,
  activeLine,
  breakpoints,
  onToggleBreakpoint,
  error,
  errorLine,
  isRunning,
  isDirty = false
}) => {
  const lines = code.split('\n');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [copied, setCopied] = useState(false);

  // Synchronize vertical scroll between textarea and line number gutter
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Auto-scroll when activeLine changes during CPU execution
  useEffect(() => {
    if (activeLine && textareaRef.current && gutterRef.current) {
      const lineHeight = 20; // 20px per line
      const targetScroll = Math.max(0, (activeLine - 4) * lineHeight);
      textareaRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
      gutterRef.current.scrollTop = targetScroll;
    }
  }, [activeLine]);

  // Track cursor line & col
  const handleSelectOrChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const pos = el.selectionStart || 0;
    const textBefore = code.substring(0, pos);
    const lineNum = textBefore.split('\n').length;
    const lastLine = textBefore.split('\n').pop() || '';
    setCursorPos({ line: lineNum, col: lastLine.length + 1 });
  };

  // Keyboard shortcuts: Tab key (4 spaces), Ctrl+Enter or Ctrl+S to compile
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
      e.preventDefault();
      onCompile();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    ';
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      onChange(newCode);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            High-Level Source Code
          </span>
          <span className="text-[10px] text-cyan-400/90 font-mono font-semibold">
            (C Language & High-Level)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy Code */}
          <button
            onClick={handleCopy}
            className="p-1 px-2 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all flex items-center gap-1 border border-slate-750"
            title="Copy code to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Compile & Load Button */}
          <button
            onClick={onCompile}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
              isRunning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : isDirty
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-950/60 ring-2 ring-amber-400/60 active:scale-95'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-900/40 active:scale-95'
            }`}
            title="Compile high-level code to assembly and reload CPU RAM (Ctrl+Enter)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Compile & Load</span>
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse ml-0.5" title="Uncompiled changes" />
            )}
          </button>
        </div>
      </div>

      {/* Editor Body with Synchronized Gutter and Textarea */}
      <div className="relative flex-1 font-mono text-xs overflow-hidden rounded-lg border border-slate-800 bg-slate-950 flex">
        {/* Line Numbers Gutter (Syncs scroll with textarea) */}
        <div
          ref={gutterRef}
          className="w-11 bg-slate-900/90 border-r border-slate-800 select-none py-2 text-right pr-2.5 text-slate-600 font-mono overflow-hidden shrink-0 pointer-events-auto"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const hasBreakpoint = breakpoints.has(lineNum);
            const isActive = activeLine === lineNum;
            const isErr = errorLine === lineNum;

            return (
              <div
                key={lineNum}
                onClick={() => onToggleBreakpoint(lineNum)}
                className={`h-5 flex items-center justify-end cursor-pointer group leading-5 relative transition-colors ${
                  isActive
                    ? 'text-amber-400 font-bold bg-amber-500/20'
                    : isErr
                    ? 'text-rose-400 font-bold bg-rose-500/20'
                    : 'hover:text-slate-300 hover:bg-slate-800/50'
                }`}
                title={`Line ${lineNum} (Click to toggle breakpoint)`}
              >
                {/* Breakpoint Dot */}
                {hasBreakpoint && (
                  <span className="absolute left-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
                )}
                {/* Active Line Arrow */}
                {isActive && !hasBreakpoint && (
                  <span className="absolute left-1 text-[10px] text-amber-400 animate-pulse">▶</span>
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area & Line Highlight Layer Container */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Scrollable Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value);
              handleSelectOrChange(e);
            }}
            onScroll={handleScroll}
            onClick={handleSelectOrChange}
            onKeyUp={handleSelectOrChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full h-full bg-transparent text-slate-200 resize-none outline-none p-2 leading-5 font-mono whitespace-pre z-10 overflow-auto selection:bg-cyan-500/30"
          />
        </div>
      </div>

      {/* Editor Status & Information Footer */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
        {error ? (
          <div className="p-1.5 px-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center gap-2 text-rose-300 w-full shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <div className="truncate">
              <span className="font-bold">Error on Line {errorLine ?? '?'}:</span> {error}
            </div>
          </div>
        ) : isDirty ? (
          <>
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Uncompiled Changes — Click &apos;Compile &amp; Load&apos; (or Ctrl+Enter)</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-rose-400" />
                <span>{breakpoints.size} Breakpoints</span>
              </span>
              <span>
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compiled &amp; Synced with CPU Memory</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span className="flex items-center gap-1">
                <Bookmark className="w-3 h-3 text-rose-400" />
                <span>{breakpoints.size} Breakpoints</span>
              </span>
              <span>
                Ln {cursorPos.line}, Col {cursorPos.col}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
