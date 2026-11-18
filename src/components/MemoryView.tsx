import React, { useState } from 'react';
import { MemoryCell } from '../types/cpu';

interface MemoryViewProps {
  memory: MemoryCell[];
  pc: number;
  sp: number;
  mar: number;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ memory, pc, sp, mar }) => {
  const [filterSegment, setFilterSegment] = useState<'all' | 'code' | 'data' | 'stack'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCells = memory.filter((cell) => {
    if (filterSegment !== 'all' && cell.segment !== filterSegment) {
      return false;
    }
    if (searchTerm) {
      const hexAddr = '0x' + cell.address.toString(16).toUpperCase();
      const addrMatch = cell.address.toString().includes(searchTerm) || hexAddr.includes(searchTerm.toUpperCase());
      const labelMatch = cell.label && cell.label.toLowerCase().includes(searchTerm.toLowerCase());
      const instMatch = cell.sourceInstruction && cell.sourceInstruction.toLowerCase().includes(searchTerm.toLowerCase());
      return addrMatch || labelMatch || instMatch;
    }
    return true;
  });

  const formatHex = (val: number, pad = 2) => {
    const unsigned = (val < 0 ? val + 0x10000 : val) & 0xffff;
    return '0x' + unsigned.toString(16).toUpperCase().padStart(pad, '0');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full max-h-[500px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Main Memory (RAM 256 Words)
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">MAR: {formatHex(mar, 2)}</span>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
          {(['all', 'code', 'data', 'stack'] as const).map((seg) => (
            <button
              key={seg}
              onClick={() => setFilterSegment(seg)}
              className={`px-2 py-1 rounded capitalize transition-all ${
                filterSegment === seg
                  ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search addr / var..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 flex-1 font-mono"
        />
      </div>

      {/* Memory Cells Grid / Table */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 border border-slate-800/80 rounded-lg bg-slate-950/60 divide-y divide-slate-850">
        <div className="grid grid-cols-12 text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 sticky top-0 border-b border-slate-800 z-10 font-bold">
          <div className="col-span-2">ADDR</div>
          <div className="col-span-2">HEX</div>
          <div className="col-span-2">DEC</div>
          <div className="col-span-3">LABEL</div>
          <div className="col-span-3">INSTRUCTION</div>
        </div>

        {filteredCells.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-600 font-mono">No memory cells match search.</div>
        ) : (
          filteredCells.map((cell) => {
            const isPC = cell.address === pc;
            const isSP = cell.address === sp;
            const isMAR = cell.address === mar;
            const isRead = cell.lastAccessed === 'read';
            const isWrite = cell.lastAccessed === 'write';

            return (
              <div
                key={cell.address}
                className={`grid grid-cols-12 text-xs font-mono px-2 py-1 items-center transition-all ${
                  isWrite
                    ? 'bg-emerald-950/70 border-l-2 border-emerald-400 text-emerald-200'
                    : isRead
                    ? 'bg-blue-950/70 border-l-2 border-cyan-400 text-cyan-200'
                    : isPC
                    ? 'bg-amber-950/40 border-l-2 border-amber-400 text-amber-200'
                    : isSP
                    ? 'bg-purple-950/40 border-l-2 border-purple-400 text-purple-200'
                    : isMAR
                    ? 'bg-slate-800/60 text-slate-200'
                    : 'hover:bg-slate-800/30 text-slate-300'
                }`}
                title={`Addr: ${formatHex(cell.address, 2)} (${cell.address})\nDec: ${cell.value}\nHex: ${formatHex(cell.value, 4)}\nSegment: ${cell.segment}`}
              >
                {/* Address */}
                <div className="col-span-2 font-semibold flex items-center gap-1">
                  <span>{formatHex(cell.address, 2)}</span>
                  {isPC && <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 font-bold">PC</span>}
                  {isSP && <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-400 font-bold">SP</span>}
                </div>

                {/* Hex Value */}
                <div className="col-span-2 text-slate-400 text-[11px]">
                  {formatHex(cell.value, 2)}
                </div>

                {/* Dec Value */}
                <div className="col-span-2 font-bold text-slate-100 truncate">
                  {cell.value}
                </div>

                {/* Variable Label */}
                <div className="col-span-3 truncate text-[11px]">
                  {cell.label ? (
                    <span className="text-emerald-400 font-medium bg-emerald-950/40 px-1 rounded border border-emerald-800/40">
                      {cell.label}
                    </span>
                  ) : (
                    <span className="text-slate-700">-</span>
                  )}
                </div>

                {/* Assembly instruction if code */}
                <div className="col-span-3 truncate text-[11px] text-cyan-400">
                  {cell.sourceInstruction || <span className="text-slate-700">-</span>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
