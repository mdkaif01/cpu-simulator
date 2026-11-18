import React from 'react';
import { RegisterName } from '../types/cpu';

interface RegistersViewProps {
  registers: Record<RegisterName, number>;
  modifiedRegisters?: Set<RegisterName>;
}

export const RegistersView: React.FC<RegistersViewProps> = ({ registers }) => {
  const gpRegisters: RegisterName[] = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'];
  const specialRegisters: { name: RegisterName; desc: string }[] = [
    { name: 'PC', desc: 'Program Counter (Next instruction address)' },
    { name: 'IR', desc: 'Instruction Register (Current opcode)' },
    { name: 'SP', desc: 'Stack Pointer (Top of stack)' },
    { name: 'BP', desc: 'Base Pointer (Current frame base)' },
    { name: 'MAR', desc: 'Memory Address Register (Bus address)' },
    { name: 'MBR', desc: 'Memory Buffer Register (Bus data)' }
  ];

  const formatHex = (val: number, pad = 4) => {
    const unsigned = (val < 0 ? val + 0x10000 : val) & 0xffff;
    return '0x' + unsigned.toString(16).toUpperCase().padStart(pad, '0');
  };

  const formatBin = (val: number) => {
    const unsigned = val & 0xff;
    return '0b' + unsigned.toString(2).padStart(8, '0');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Register File
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">16-bit RISC Core</span>
      </div>

      {/* General Purpose Registers */}
      <div className="mb-3">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">General Purpose</div>
        <div className="grid grid-cols-3 gap-1.5">
          {gpRegisters.map((reg) => {
            const val = registers[reg] ?? 0;
            return (
              <div
                key={reg}
                className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all rounded p-1.5 text-center group relative cursor-help"
                title={`${reg}: Decimal ${val}, Hex ${formatHex(val, 2)}, Binary ${formatBin(val)}`}
              >
                <div className="text-[10px] font-mono font-bold text-cyan-400 flex items-center justify-between">
                  <span>{reg}</span>
                  <span className="text-[9px] text-slate-600 font-normal">{formatHex(val, 2)}</span>
                </div>
                <div className="text-sm font-mono font-semibold text-slate-100 truncate mt-0.5">
                  {val}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Purpose Registers */}
      <div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Special Purpose</div>
        <div className="grid grid-cols-2 gap-1.5">
          {specialRegisters.map(({ name, desc }) => {
            const val = registers[name] ?? 0;
            const isPC = name === 'PC';
            const isSP = name === 'SP';

            return (
              <div
                key={name}
                className={`bg-slate-950/80 border transition-all rounded p-1.5 group relative cursor-help ${
                  isPC
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : isSP
                    ? 'border-purple-500/40 bg-purple-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                title={`${name}: ${desc}\nValue: ${val} (${formatHex(val, 2)})`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold ${isPC ? 'text-amber-400' : isSP ? 'text-purple-400' : 'text-slate-300'}`}>
                    {name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">{formatHex(val, 2)}</span>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-200 mt-0.5">
                  {val}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
