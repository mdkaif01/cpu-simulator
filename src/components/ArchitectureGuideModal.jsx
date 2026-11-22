import { X, Cpu, Layers, HardDrive, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
export const ArchitectureGuideModal = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"><div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">{
    /* Header */
  }<div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400"><Cpu className="w-5 h-5" /></div><div><h2 className="text-base font-bold text-white">How a Computer Works Internally</h2><p className="text-xs text-slate-400">
                A visual guide to the Von Neumann Architecture & the Fetch-Decode-Execute Cycle
              </p></div></div><button
    onClick={onClose}
    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
  ><X className="w-5 h-5" /></button></div>{
    /* Scrollable Content */
  }<div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">{
    /* Section 1: The Von Neumann Architecture */
  }<div className="space-y-2"><h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2"><HardDrive className="w-4 h-4" />
              1. The Von Neumann Architecture
            </h3><p className="text-slate-300 leading-relaxed text-xs">
              Every modern computer is based on the <strong>Von Neumann Architecture</strong> (invented by John von Neumann in 1945). Its revolutionary insight was that <strong>both program instructions and program data share the same unified memory space (RAM)</strong>.
            </p><div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2"><div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-xs font-bold text-blue-400 block mb-1">CPU (Core Processor)</span><p className="text-[11px] text-slate-400 leading-relaxed">
                  The "brain". Contains the <strong>Control Unit (CU)</strong> to sequence operations, the <strong>ALU</strong> for arithmetic, and <strong>Registers</strong> for ultrafast temporary storage.
                </p></div><div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-xs font-bold text-emerald-400 block mb-1">RAM (Main Memory)</span><p className="text-[11px] text-slate-400 leading-relaxed">
                  A numbered linear grid of storage cells. In our simulator, addresses <code>0x00–0x7F</code> hold machine code, <code>0x80–0xCF</code> store variables, and <code>0xD0–0xFF</code> host the call stack.
                </p></div><div className="bg-slate-950 p-3 rounded-xl border border-slate-800"><span className="text-xs font-bold text-purple-400 block mb-1">System Buses</span><p className="text-[11px] text-slate-400 leading-relaxed">
                  High-speed parallel electrical pathways: <strong>Address Bus</strong> (specifies memory location), <strong>Data Bus</strong> (carries values), and <strong>Control Bus</strong> (signals Read/Write commands).
                </p></div></div></div>{
    /* Section 2: The 4-Stage Micro-Architecture Cycle */
  }<div className="space-y-3 pt-2"><h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4" />
              2. The 4 Micro-Cycle Stages (Clock Ticks)
            </h3><p className="text-slate-300 leading-relaxed text-xs">
              Computers do not execute instructions all at once. Every instruction is broken into micro-cycles driven by quartz crystal clock pulses:
            </p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1"><span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px]">1</span>
                  FETCH STAGE
                </div><p className="text-[11px] text-slate-400 leading-relaxed">
                  The CPU puts the <strong>Program Counter (PC)</strong> value onto the Address Bus. RAM decodes the address, places the instruction onto the Data Bus, and loads it into the <strong>Instruction Register (IR)</strong>. PC increments by 1.
                </p></div><div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-indigo-400 font-bold text-xs mb-1"><span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">2</span>
                  DECODE STAGE
                </div><p className="text-[11px] text-slate-400 leading-relaxed">
                  The Control Unit analyzes the opcode (e.g., <code>ADD</code>, <code>LOAD</code>, <code>CMP</code>) and operands. It activates internal multiplexers and determines if operands need reading from registers or memory.
                </p></div><div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1"><span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">3</span>
                  EXECUTE STAGE
                </div><p className="text-[11px] text-slate-400 leading-relaxed">
                  The operation takes place! For math/logic, the <strong>ALU</strong> computes the result and sets the <strong>FLAGS (Zero, Negative, Carry)</strong>. For jumps, the CPU tests the flags to alter the PC.
                </p></div><div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3"><div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1"><span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">4</span>
                  WRITEBACK STAGE
                </div><p className="text-[11px] text-slate-400 leading-relaxed">
                  The final result is written back to its destination register (e.g., <code>R0</code>) or dispatched to RAM via the Data Bus. The CPU is now ready for the next instruction!
                </p></div></div></div>{
    /* Section 3: How High-Level Code Compiles to Hardware */
  }<div className="space-y-3 pt-2"><h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4" />
              3. From High-Level Code to Hardware
            </h3><div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs"><div className="text-slate-400 mb-1 font-bold text-[11px]">Example: Variable Addition</div><div className="bg-slate-900 p-2 rounded text-cyan-300 mb-2">
                let sum = a + b;
              </div><div className="flex items-center gap-2 text-slate-500 text-[11px] my-1"><ArrowRight className="w-3.5 h-3.5 text-amber-400" /><span>Compiler generates 3 assembly machine instructions:</span></div><div className="bg-slate-900 p-2 rounded text-slate-300 space-y-1 text-[11px]"><div><span className="text-amber-400 font-bold">LOAD</span> R0, [0x80]  <span className="text-slate-500">; Read variable 'a' into register R0</span></div><div><span className="text-amber-400 font-bold">LOAD</span> R1, [0x81]  <span className="text-slate-500">; Read variable 'b' into register R1</span></div><div><span className="text-amber-400 font-bold">ADD</span>  R0, R1      <span className="text-slate-500">; ALU adds R0 + R1</span></div><div><span className="text-amber-400 font-bold">STORE</span> [0x82], R0  <span className="text-slate-500">; Store result into 'sum' memory cell</span></div></div></div></div>{
    /* Section 4: Registers Glossary */
  }<div className="space-y-2 pt-2"><h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
              4. Hardware Registers Reference
            </h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono"><div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-cyan-400 font-bold">R0 - R5</span><p className="text-slate-400 text-[10px] mt-0.5">General-purpose accumulator registers for temporary calculations.</p></div><div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-amber-400 font-bold">PC (Program Counter)</span><p className="text-slate-400 text-[10px] mt-0.5">Holds the memory address of the next instruction to execute.</p></div><div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-amber-400 font-bold">IR (Instruction Reg)</span><p className="text-slate-400 text-[10px] mt-0.5">Holds the current instruction currently being executed.</p></div><div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-purple-400 font-bold">SP (Stack Pointer)</span><p className="text-slate-400 text-[10px] mt-0.5">Points to the top item on the execution call stack in RAM.</p></div><div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-blue-400 font-bold">MAR (Memory Address)</span><p className="text-slate-400 text-[10px] mt-0.5">Holds the address to place onto the Address Bus.</p></div><div className="bg-slate-950 p-2 rounded border border-slate-800"><span className="text-emerald-400 font-bold">MBR (Memory Buffer)</span><p className="text-slate-400 text-[10px] mt-0.5">Holds data just read from or about to be written to RAM.</p></div></div></div></div>{
    /* Footer */
  }<div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between"><div className="text-xs text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-cyan-400" /><span>Try stepping with <strong>Micro-Step</strong> to see each phase in real time!</span></div><button
    onClick={onClose}
    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
  >
            Got it, Let's Simulate!
          </button></div></div></div>;
};
