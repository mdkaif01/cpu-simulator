import React from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface ConsoleViewProps {
  output: string[];
  onClear?: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({ output, onClear }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            I/O Terminal (Standard Output)
          </span>
        </div>
        {onClear && output.length > 0 && (
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1"
            title="Clear console"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 bg-slate-950 rounded-lg p-2 font-mono text-xs overflow-y-auto text-emerald-400 border border-slate-800/80 min-h-[90px]">
        {output.length === 0 ? (
          <div className="text-slate-600 italic select-none">
            &gt; Waiting for program output via print(...)...
          </div>
        ) : (
          output.map((line, idx) => (
            <div key={idx} className="leading-5 flex items-center gap-1.5">
              <span className="text-slate-600 select-none">&gt;</span>
              <span className="text-emerald-300 font-semibold">{line}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
