import { Cpu } from "lucide-react";
export const AssemblyViewer = ({
  instructions,
  currentPc,
  highlightedLine,
  onSelectInstruction
}) => {
  const formatHex = (val) => {
    return "0x" + val.toString(16).toUpperCase().padStart(2, "0");
  };
  return <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col h-full"><div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800"><div className="flex items-center gap-2"><Cpu className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Compiled Assembly (RISC Machine Code)
          </span></div><span className="text-[10px] text-slate-500 font-mono">
          Total: {instructions.length} instructions
        </span></div>{
    /* Assembly Instructions List */
  }<div className="flex-1 overflow-y-auto pr-1 border border-slate-800 rounded-lg bg-slate-950 divide-y divide-slate-850 font-mono text-xs"><div className="grid grid-cols-12 text-[10px] text-slate-500 px-2 py-1 sticky top-0 bg-slate-950 border-b border-slate-800 font-bold z-10"><div className="col-span-2">ADDR</div><div className="col-span-3">OPCODE</div><div className="col-span-4">OPERANDS</div><div className="col-span-3">SOURCE</div></div>{instructions.length === 0 ? <div className="text-center py-8 text-xs text-slate-600">No assembly instructions loaded.</div> : instructions.map((inst) => {
    const isPC = inst.address === currentPc;
    const matchesLine = highlightedLine !== void 0 && inst.sourceLine === highlightedLine;
    return <div
      key={inst.id}
      onClick={() => onSelectInstruction?.(inst)}
      className={`grid grid-cols-12 px-2 py-1 items-center cursor-pointer transition-colors ${isPC ? "bg-amber-950/60 border-l-2 border-amber-400 text-amber-200 font-bold" : matchesLine ? "bg-cyan-950/40 text-cyan-200" : "hover:bg-slate-850/60 text-slate-300"}`}
      title={`Addr: ${formatHex(inst.address)}
Instruction: ${inst.rawText}
Source Line: ${inst.sourceLine || "N/A"}
Comment: ${inst.comment || ""}`}
    >{
      /* Address */
    }<div className="col-span-2 font-mono text-[11px] text-slate-500 flex items-center gap-1"><span>{formatHex(inst.address)}</span>{isPC && <span className="text-amber-400 text-[10px]">▶</span>}</div>{
      /* Opcode */
    }<div className="col-span-3 font-bold font-mono text-cyan-400">{inst.opcode}</div>{
      /* Operands */
    }<div className="col-span-4 font-mono text-slate-200 truncate text-[11px]">{inst.operands.join(", ")}</div>{
      /* Source Line reference */
    }<div className="col-span-3 font-mono text-[10px] text-slate-500 flex items-center justify-between"><span>{inst.sourceLine ? `Line ${inst.sourceLine}` : "-"}</span>{inst.comment && <span className="text-slate-600 truncate max-w-[60px]" title={inst.comment}>
                      ; {inst.comment}</span>}</div></div>;
  })}</div></div>;
};
