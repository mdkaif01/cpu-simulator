import React from 'react';
import { BusState, Instruction, MicroCycleStage } from '../types/cpu';

interface ControlUnitViewProps {
  stage: MicroCycleStage;
  currentInstruction: Instruction | null;
  bus: BusState;
  clockCycle: number;
  instructionCount: number;
}

export const ControlUnitView: React.FC<ControlUnitViewProps> = ({
  stage,
  currentInstruction,
  bus,
  clockCycle,
  instructionCount
}) => {
  const stages: { key: MicroCycleStage; label: string; desc: string; color: string }[] = [
    { key: 'FETCH', label: '1. FETCH', desc: 'Read instruction from RAM[PC] into IR', color: 'from-blue-500 to-cyan-500' },
    { key: 'DECODE', label: '2. DECODE', desc: 'Extract opcode & operands', color: 'from-indigo-500 to-purple-500' },
    { key: 'EXECUTE', label: '3. EXECUTE', desc: 'ALU calculation / evaluate branch', color: 'from-amber-500 to-orange-500' },
    { key: 'WRITEBACK', label: '4. WRITEBACK', desc: 'Write result to Register or RAM', color: 'from-emerald-500 to-teal-500' }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          Control Unit (CU) & Timing
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Cycle: <span className="text-amber-400 font-bold">{clockCycle}</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Inst: <span className="text-cyan-400 font-bold">{instructionCount}</span>
          </span>
        </div>
      </div>

      {/* 4-Stage Micro-Cycle Pipeline Bar */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {stages.map((st) => {
          const isActive = stage === st.key;
          return (
            <div
              key={st.key}
              className={`p-1.5 rounded-lg border text-center transition-all ${
                isActive
                  ? 'bg-slate-850 border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60'
              }`}
              title={st.desc}
            >
              <div
                className={`text-[10px] font-bold font-mono tracking-wide ${
                  isActive ? 'text-cyan-300' : 'text-slate-500'
                }`}
              >
                {st.label}
              </div>
              <div
                className={`w-full h-1 mt-1 rounded-full ${
                  isActive ? `bg-gradient-to-r ${st.color} animate-pulse` : 'bg-slate-800'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Current Decoded Instruction */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 mb-2 flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">
            Active Instruction (IR)
          </span>
          <span className="text-xs font-mono font-bold text-amber-300">
            {currentInstruction ? currentInstruction.rawText : 'NO INSTRUCTION LOADED'}
          </span>
        </div>
        {currentInstruction?.comment && (
          <span className="text-[10px] text-slate-500 font-mono italic max-w-[150px] truncate">
            {currentInstruction.comment}
          </span>
        )}
      </div>

      {/* Hardware Control Signals Bus */}
      <div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
          Active Control Signals
        </span>
        <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
          <div
            className={`py-1 rounded border transition-all ${
              bus.controlSignals.readMem
                ? 'bg-blue-950/80 border-blue-500/80 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            MEM_RD
          </div>
          <div
            className={`py-1 rounded border transition-all ${
              bus.controlSignals.writeMem
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            MEM_WR
          </div>
          <div
            className={`py-1 rounded border transition-all ${
              bus.controlSignals.aluOp
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            ALU_EN
          </div>
          <div
            className={`py-1 rounded border transition-all ${
              bus.controlSignals.regWrite
                ? 'bg-purple-950/80 border-purple-500/80 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                : 'bg-slate-950 border-slate-800 text-slate-600'
            }`}
          >
            REG_LD
          </div>
        </div>
      </div>
    </div>
  );
};
