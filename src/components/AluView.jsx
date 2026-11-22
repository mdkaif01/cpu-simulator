export const AluView = ({ alu, flags }) => {
  const opSymbol = (op) => {
    switch (op) {
      case "ADD":
        return "+";
      case "SUB":
        return "-";
      case "MUL":
        return "\xD7";
      case "DIV":
        return "\xF7";
      case "MOD":
        return "%";
      case "AND":
        return "&";
      case "OR":
        return "|";
      case "XOR":
        return "^";
      case "NOT":
        return "~";
      case "SHL":
        return "<<";
      case "SHR":
        return ">>";
      case "CMP":
        return "\u21C4";
      default:
        return "IDLE";
    }
  };
  return <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg"><div className="flex items-center justify-between mb-2"><h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${alu.active ? "bg-amber-400 animate-ping" : "bg-slate-600"}`} />
          Arithmetic Logic Unit (ALU)
        </h3><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${alu.active ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-500"}`}>{alu.operation || "STANDBY"}</span></div>{
    /* Trapezoid ALU Hardware Visual */
  }<div className="relative py-2 flex flex-col items-center">{
    /* Input Operands */
  }<div className="flex justify-between w-full max-w-[240px] px-2 mb-1"><div className="text-center"><span className="text-[10px] text-slate-500 font-mono block">Input A</span><div className={`px-2 py-1 rounded font-mono text-xs font-bold border transition-all ${alu.active ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-200" : "bg-slate-950 border-slate-800 text-slate-400"}`}>{alu.operandA}</div></div><div className="flex items-center"><span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">{opSymbol(alu.operation)}</span></div><div className="text-center"><span className="text-[10px] text-slate-500 font-mono block">Input B</span><div className={`px-2 py-1 rounded font-mono text-xs font-bold border transition-all ${alu.active ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-200" : "bg-slate-950 border-slate-800 text-slate-400"}`}>{alu.operandB}</div></div></div>{
    /* SVG V-shaped / Trapezoid Body */
  }<div className="w-full max-w-[240px] relative"><svg viewBox="0 0 200 60" className="w-full h-12 overflow-visible">{
    /* ALU Shape */
  }<polygon
    points="10,0 70,0 85,25 115,25 130,0 190,0 160,60 40,60"
    className={`transition-all duration-300 ${alu.active ? "fill-amber-950/40 stroke-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "fill-slate-950 stroke-slate-700"}`}
    strokeWidth="2"
  />{
    /* Logic circuit lines */
  }<line x1="40" y1="0" x2="40" y2="15" stroke={alu.active ? "#38bdf8" : "#334155"} strokeWidth="1.5" /><line x1="160" y1="0" x2="160" y2="15" stroke={alu.active ? "#38bdf8" : "#334155"} strokeWidth="1.5" /><line x1="100" y1="45" x2="100" y2="60" stroke={alu.active ? "#34d399" : "#334155"} strokeWidth="2" /></svg></div>{
    /* Output Result */
  }<div className="text-center mt-1"><span className="text-[10px] text-slate-500 font-mono block">Result Bus Y</span><div className={`px-3 py-1 rounded font-mono text-sm font-bold border transition-all ${alu.active ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]" : "bg-slate-950 border-slate-800 text-slate-400"}`}>{alu.result}</div></div></div>{
    /* CPU Condition Flags (Status LEDs) */
  }<div className="mt-3 pt-2 border-t border-slate-800/80"><div className="flex items-center justify-between mb-1.5"><span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status Flags</span><span className="text-[9px] text-slate-600 font-mono">PSR / FLAGS</span></div><div className="grid grid-cols-4 gap-1.5">{
    /* Zero Flag */
  }<div
    className={`border rounded p-1 text-center transition-all cursor-help ${flags.zero ? "bg-emerald-950/60 border-emerald-500/60 shadow-[0_0_8px_rgba(52,211,153,0.25)]" : "bg-slate-950/60 border-slate-800"}`}
    title="Zero Flag (Z): Set to 1 if ALU result equals 0"
  ><div className="text-[10px] font-mono font-bold flex items-center justify-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${flags.zero ? "bg-emerald-400" : "bg-slate-700"}`} /><span className={flags.zero ? "text-emerald-300" : "text-slate-500"}>Z</span></div><div className={`text-[11px] font-mono font-semibold ${flags.zero ? "text-emerald-200" : "text-slate-600"}`}>{flags.zero ? "1" : "0"}</div></div>{
    /* Negative Flag */
  }<div
    className={`border rounded p-1 text-center transition-all cursor-help ${flags.negative ? "bg-rose-950/60 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.25)]" : "bg-slate-950/60 border-slate-800"}`}
    title="Negative Flag (N): Set to 1 if ALU result is negative (MSB = 1)"
  ><div className="text-[10px] font-mono font-bold flex items-center justify-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${flags.negative ? "bg-rose-400" : "bg-slate-700"}`} /><span className={flags.negative ? "text-rose-300" : "text-slate-500"}>N</span></div><div className={`text-[11px] font-mono font-semibold ${flags.negative ? "text-rose-200" : "text-slate-600"}`}>{flags.negative ? "1" : "0"}</div></div>{
    /* Carry Flag */
  }<div
    className={`border rounded p-1 text-center transition-all cursor-help ${flags.carry ? "bg-cyan-950/60 border-cyan-500/60 shadow-[0_0_8px_rgba(56,189,248,0.25)]" : "bg-slate-950/60 border-slate-800"}`}
    title="Carry Flag (C): Set to 1 if an arithmetic carry/borrow occurred"
  ><div className="text-[10px] font-mono font-bold flex items-center justify-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${flags.carry ? "bg-cyan-400" : "bg-slate-700"}`} /><span className={flags.carry ? "text-cyan-300" : "text-slate-500"}>C</span></div><div className={`text-[11px] font-mono font-semibold ${flags.carry ? "text-cyan-200" : "text-slate-600"}`}>{flags.carry ? "1" : "0"}</div></div>{
    /* Overflow Flag */
  }<div
    className={`border rounded p-1 text-center transition-all cursor-help ${flags.overflow ? "bg-amber-950/60 border-amber-500/60 shadow-[0_0_8px_rgba(251,191,36,0.25)]" : "bg-slate-950/60 border-slate-800"}`}
    title="Overflow Flag (V): Set to 1 if signed arithmetic overflow occurred"
  ><div className="text-[10px] font-mono font-bold flex items-center justify-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${flags.overflow ? "bg-amber-400" : "bg-slate-700"}`} /><span className={flags.overflow ? "text-amber-300" : "text-slate-500"}>V</span></div><div className={`text-[11px] font-mono font-semibold ${flags.overflow ? "text-amber-200" : "text-slate-600"}`}>{flags.overflow ? "1" : "0"}</div></div></div></div></div>;
};
