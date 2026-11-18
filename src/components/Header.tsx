import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  StepForward,
  RotateCcw,
  Undo2,
  Cpu,
  BookOpen,
  Gauge
} from 'lucide-react';
import { PRESETS } from '../compiler/presets';

interface HeaderProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepMicro: () => void;
  onStepInstruction: () => void;
  onStepLine: () => void;
  onStepBack: () => void;
  canStepBack: boolean;
  onReset: () => void;
  speedHz: number;
  onSpeedChange: (speed: number) => void;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenGuide: () => void;
  isHalted: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  onTogglePlay,
  onStepMicro,
  onStepInstruction,
  onStepLine,
  onStepBack,
  canStepBack,
  onReset,
  speedHz,
  onSpeedChange,
  selectedPresetId,
  onSelectPreset,
  onOpenGuide,
  isHalted
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 select-none">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                SiliconSim
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                Computer Architecture Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-Level Code &bull; Registers &bull; ALU &bull; Memory &bull; Micro-Cycles
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono hidden md:inline">Presets:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            disabled={isRunning}
            className="bg-slate-950 border border-slate-750 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[220px]"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Execution Control Center */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          {/* Step Back / Undo */}
          <button
            onClick={onStepBack}
            disabled={!canStepBack || isRunning}
            className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1 transition-all ${
              canStepBack && !isRunning
                ? 'bg-slate-850 hover:bg-slate-800 text-slate-200 active:scale-95'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Step Back 1 Micro-Cycle (Undo / Time Travel)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            disabled={isHalted}
            className={`px-3 py-2 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all ${
              isHalted
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/40 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 active:scale-95'
            }`}
            title="Play / Pause CPU Execution (Spacebar)"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>

          {/* Micro-Step */}
          <button
            onClick={onStepMicro}
            disabled={isRunning || isHalted}
            className="px-2.5 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-cyan-300 text-xs font-mono flex items-center gap-1 border border-slate-750 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step 1 Micro-Cycle (Fetch -> Decode -> Execute -> Writeback) [F11]"
          >
            <StepForward className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Micro-Step</span>
          </button>

          {/* Step Instruction */}
          <button
            onClick={onStepInstruction}
            disabled={isRunning || isHalted}
            className="px-2.5 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-amber-300 text-xs font-mono flex items-center gap-1 border border-slate-750 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step 1 Full Machine Instruction [F10]"
          >
            <SkipForward className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Instruction</span>
          </button>

          {/* Step High-Level Line */}
          <button
            onClick={onStepLine}
            disabled={isRunning || isHalted}
            className="px-2.5 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-emerald-300 text-xs font-mono flex items-center gap-1 border border-slate-750 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Step 1 High-Level Code Line"
          >
            <span className="text-emerald-400 font-bold">Line</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs transition-all active:scale-95"
            title="Reset CPU & Memory to initial state [F8]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Slider & Guide Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono text-slate-400">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={speedHz}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
              title={`Clock speed: ${speedHz} Hz (${(1000 / speedHz).toFixed(0)}ms per cycle)`}
            />
            <span className="text-[11px] font-mono text-cyan-400 font-bold w-12 text-right">
              {speedHz} Hz
            </span>
          </div>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-xs font-semibold transition-all shadow-md active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Hardware Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
