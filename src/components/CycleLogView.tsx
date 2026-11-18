import React from 'react';
import { ExecutionLogEntry } from '../types/cpu';
import { Activity, BookOpen } from 'lucide-react';

interface CycleLogViewProps {
  logs: ExecutionLogEntry[];
  explanation: string;
}

export const CycleLogView: React.FC<CycleLogViewProps> = ({ logs, explanation }) => {
  const badgeColor = (cat: ExecutionLogEntry['category']) => {
    switch (cat) {
      case 'alu':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'memory':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'fetch':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'decode':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60';
      case 'jump':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'io':
        return 'bg-teal-950/80 text-teal-300 border-teal-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full max-h-[300px]">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Cycle-by-Cycle Hardware Explainer
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Live Execution Feed</span>
      </div>

      {/* Active Instant Explanation Banner */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-500/30 rounded-lg p-2.5 mb-2 shadow-inner">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-cyan-400 mb-0.5 tracking-wider">
          <BookOpen className="w-3 h-3" />
          <span>Current Micro-Operation</span>
        </div>
        <p className="text-xs text-slate-200 font-mono leading-relaxed">
          {explanation}
        </p>
      </div>

      {/* Historical Execution Log */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-4">No cycle logs yet. Step or Play to generate.</div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800/80 rounded p-1.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-500 font-bold">
                  Cycle #{log.cycle} (Inst #{log.instructionCount})
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${badgeColor(log.category)}`}>
                  {log.stage}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                {log.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
