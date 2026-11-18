import React from 'react';
import { MemoryCell, StackFrame } from '../types/cpu';
import { Layers } from 'lucide-react';

interface StackViewProps {
  memory: MemoryCell[];
  sp: number;
  bp: number;
  callStackFrames: StackFrame[];
}

export const StackView: React.FC<StackViewProps> = ({ memory, sp, bp }) => {
  // Stack segment is 0xD0 to 0xFF (top of memory)
  const stackCells = memory.filter((c) => c.address >= 0xd0).sort((a, b) => b.address - a.address);

  const formatHex = (val: number) => {
    return '0x' + val.toString(16).toUpperCase().padStart(2, '0');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full max-h-[300px]">
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Call Stack (Grows Downward)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/60">
            SP: {formatHex(sp)}
          </span>
          <span className="text-blue-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/60">
            BP: {formatHex(bp)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
        {stackCells.map((cell) => {
          const isSP = cell.address === sp;
          const isBP = cell.address === bp;
          const hasData = cell.value !== 0;

          return (
            <div
              key={cell.address}
              className={`p-1.5 rounded border transition-all flex items-center justify-between ${
                isSP
                  ? 'bg-purple-950/70 border-purple-500/80 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                  : isBP
                  ? 'bg-blue-950/50 border-blue-500/60 text-blue-200'
                  : hasData
                  ? 'bg-slate-950 border-slate-700/80 text-slate-200'
                  : 'bg-slate-950/40 border-slate-800/50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">{formatHex(cell.address)}</span>
                {isSP && (
                  <span className="text-[9px] font-bold px-1 rounded bg-purple-500/30 text-purple-300">
                    &lt;-- SP
                  </span>
                )}
                {isBP && (
                  <span className="text-[9px] font-bold px-1 rounded bg-blue-500/30 text-blue-300">
                    &lt;-- BP
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500">{formatHex(cell.value)}</span>
                <span className="font-bold text-slate-100">{cell.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
