export const HardwareVisualizer = ({
  registers,
  stage,
  currentInstruction,
  bus,
  flags
}) => {
  const isAddressBusActive = bus.addressBus !== null;
  const isDataBusActive = bus.dataBus !== null;
  const isReading = bus.controlSignals.readMem;
  const isWriting = bus.controlSignals.writeMem;
  const isAluActive = !!bus.controlSignals.aluOp;
  const formatHex = (val, pad = 2) => {
    if (val === null) return "--";
    const unsigned = (val < 0 ? val + 65536 : val) & 65535;
    return "0x" + unsigned.toString(16).toUpperCase().padStart(pad, "0");
  };
  return <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-2xl relative overflow-hidden">{
    /* Background Grid Pattern */
  }<div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />{
    /* Header */
  }<div className="flex items-center justify-between mb-4 relative z-10 border-b border-slate-800/80 pb-2"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]" /><h2 className="text-sm font-bold text-slate-200 tracking-wide">
            Interactive Von Neumann Architecture Datapath
          </h2></div><div className="flex items-center gap-3">{
    /* Micro-step indicator badge */
  }<div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800"><span className="text-slate-500">Micro-Cycle:</span><span className={`font-bold uppercase ${stage === "FETCH" ? "text-blue-400" : stage === "DECODE" ? "text-indigo-400" : stage === "EXECUTE" ? "text-amber-400" : "text-emerald-400"}`}>{stage}</span></div></div></div>{
    /* SVG Datapath & Bus Wiring Diagram */
  }<div className="relative w-full h-[420px] xl:h-[440px] flex items-center justify-center select-none"><svg
    viewBox="0 0 900 400"
    className="w-full h-full max-h-[440px]"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >{
    /* BUS LINES DEFINITION */
  }<defs><linearGradient id="addrGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient><linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#38bdf8" /></linearGradient><linearGradient id="ctrlGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#c084fc" /></linearGradient></defs>{
    /* 1. ADDRESS BUS (Gold) */
  }{
    /* Path from MAR to RAM */
  }<path
    d="M 400 130 L 640 130"
    stroke={isAddressBusActive ? "url(#addrGrad)" : "#334155"}
    strokeWidth={isAddressBusActive ? "4" : "2"}
    strokeDasharray={isAddressBusActive ? "6 6" : "none"}
    className={isAddressBusActive ? "animate-flow-right" : ""}
  />{
    /* Address Bus Label */
  }<rect x="470" y="112" width="100" height="18" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" /><text x="520" y="125" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ADDR: {formatHex(bus.addressBus, 2)}</text>{
    /* 2. DATA BUS (Cyan, Bidirectional) */
  }<path
    d="M 400 200 L 640 200"
    stroke={isDataBusActive ? "url(#dataGrad)" : "#334155"}
    strokeWidth={isDataBusActive ? "4" : "2"}
    strokeDasharray={isDataBusActive ? "6 6" : "none"}
    className={isWriting ? "animate-flow-right" : isReading ? "animate-flow-left" : ""}
  />{
    /* Data Bus Label */
  }<rect x="470" y="182" width="100" height="18" rx="4" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" /><text x="520" y="195" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
            DATA: {bus.dataBus !== null ? bus.dataBus : "--"}</text>{
    /* 3. CONTROL BUS (Purple) */
  }<path
    d="M 400 270 L 640 270"
    stroke={bus.controlSignals.busActive ? "url(#ctrlGrad)" : "#334155"}
    strokeWidth={bus.controlSignals.busActive ? "3" : "2"}
  />{
    /* Control Bus Label */
  }<rect x="470" y="252" width="100" height="18" rx="4" fill="#0f172a" stroke="#a855f7" strokeWidth="1" /><text x="520" y="265" textAnchor="middle" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">
            CTRL: {isReading ? "READ" : isWriting ? "WRITE" : "IDLE"}</text>{
    /* --- CPU BOX (Left Enclosure) --- */
  }<rect
    x="40"
    y="40"
    width="360"
    height="320"
    rx="12"
    fill="#090d16"
    stroke="#2563eb"
    strokeWidth="2"
    className="filter drop-shadow-[0_0_15px_rgba(37,99,235,0.25)]"
  /><text x="60" y="65" fill="#60a5fa" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
            CENTRAL PROCESSING UNIT (CPU)
          </text>{
    /* CU Box */
  }<rect x="60" y="80" width="140" height="85" rx="8" fill="#111827" stroke="#6366f1" strokeWidth="1.5" /><text x="75" y="100" fill="#a5b4fc" fontSize="11" fontWeight="bold">CONTROL UNIT</text><text x="75" y="118" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            Stage: <tspan fill="#38bdf8" fontWeight="bold">{stage}</tspan></text><text x="75" y="132" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            IR: <tspan fill="#fbbf24">{formatHex(registers.IR, 2)}</tspan></text><text x="75" y="146" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            PC: <tspan fill="#34d399">{formatHex(registers.PC, 2)}</tspan></text>{
    /* Registers Box */
  }<rect x="220" y="80" width="160" height="120" rx="8" fill="#111827" stroke="#38bdf8" strokeWidth="1.5" /><text x="235" y="100" fill="#7dd3fc" fontSize="11" fontWeight="bold">REGISTER FILE</text>{
    /* Quick Mini Register values */
  }<text x="235" y="120" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            R0: <tspan fill="#38bdf8" fontWeight="bold">{registers.R0}</tspan>  R1: <tspan fill="#38bdf8" fontWeight="bold">{registers.R1}</tspan></text><text x="235" y="138" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            R2: <tspan fill="#38bdf8" fontWeight="bold">{registers.R2}</tspan>  R3: <tspan fill="#38bdf8" fontWeight="bold">{registers.R3}</tspan></text><text x="235" y="156" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            MAR: <tspan fill="#fbbf24">{formatHex(registers.MAR, 2)}</tspan></text><text x="235" y="174" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            MBR: <tspan fill="#38bdf8">{registers.MBR}</tspan>  SP: <tspan fill="#c084fc">{formatHex(registers.SP, 2)}</tspan></text>{
    /* Internal Wire from Registers to MAR/MBR Bus Ports */
  }<path d="M 380 130 L 400 130" stroke="#f59e0b" strokeWidth="2" /><path d="M 380 180 L 400 200" stroke="#06b6d4" strokeWidth="2" />{
    /* ALU Trapezoid Box */
  }<g transform="translate(60, 190)"><polygon
    points="10,0 60,0 70,20 90,20 100,0 150,0 130,55 30,55"
    fill={isAluActive ? "#78350f" : "#111827"}
    stroke={isAluActive ? "#f59e0b" : "#d97706"}
    strokeWidth="1.5"
  /><text x="80" y="42" textAnchor="middle" fill="#fde68a" fontSize="11" fontWeight="bold">
              ALU {bus.controlSignals.aluOp || ""}</text>{
    /* Flags indicator under ALU */
  }<text x="10" y="75" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              Z:<tspan fill={flags.zero ? "#34d399" : "#64748b"}>{flags.zero ? "1" : "0"}</tspan>  
              N:<tspan fill={flags.negative ? "#f43f5e" : "#64748b"}>{flags.negative ? "1" : "0"}</tspan>  
              C:<tspan fill={flags.carry ? "#38bdf8" : "#64748b"}>{flags.carry ? "1" : "0"}</tspan>  
              V:<tspan fill={flags.overflow ? "#fbbf24" : "#64748b"}>{flags.overflow ? "1" : "0"}</tspan></text></g>{
    /* Internal CPU Bus from ALU to Registers */
  }<path
    d="M 190 220 L 220 180"
    stroke={isAluActive ? "#34d399" : "#334155"}
    strokeWidth="2"
    strokeDasharray={isAluActive ? "4 4" : "none"}
  />{
    /* --- RAM / MEMORY CHIP (Right Box) --- */
  }<rect
    x="640"
    y="40"
    width="220"
    height="320"
    rx="12"
    fill="#090d16"
    stroke={isReading ? "#38bdf8" : isWriting ? "#34d399" : "#10b981"}
    strokeWidth="2"
    className={`transition-all duration-300 ${isReading ? "filter drop-shadow-[0_0_15px_rgba(56,189,248,0.35)]" : isWriting ? "filter drop-shadow-[0_0_15px_rgba(52,211,153,0.35)]" : "filter drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]"}`}
  /><text x="660" y="65" fill="#34d399" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
            RAM / MAIN MEMORY
          </text><text x="660" y="80" fill="#64748b" fontSize="9" fontFamily="monospace">
            Capacity: 256 Words (16-bit)
          </text>{
    /* Visual Memory Segments on RAM chip */
  }{
    /* Code Segment preview */
  }<rect x="655" y="95" width="190" height="70" rx="6" fill="#111827" stroke="#334155" strokeWidth="1" /><text x="665" y="112" fill="#93c5fd" fontSize="10" fontWeight="bold">CODE SEGMENT [0x00 - 0x7F]</text><text x="665" y="130" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            PC points: <tspan fill="#fbbf24">{formatHex(registers.PC, 2)}</tspan></text><text x="665" y="148" fill="#64748b" fontSize="8" fontFamily="monospace" className="truncate">{currentInstruction ? currentInstruction.rawText : "Standing by"}</text>{
    /* Data Segment preview */
  }<rect x="655" y="175" width="190" height="75" rx="6" fill="#111827" stroke="#334155" strokeWidth="1" /><text x="665" y="192" fill="#6ee7b7" fontSize="10" fontWeight="bold">DATA SEGMENT [0x80 - 0xCF]</text><text x="665" y="210" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            Variables & Heap arrays
          </text><text x="665" y="228" fill="#94a3b8" fontSize="8" fontFamily="monospace">
            MAR: {formatHex(bus.addressBus, 2)} | Val: {bus.dataBus !== null ? bus.dataBus : "--"}</text>{
    /* Stack Segment preview */
  }<rect x="655" y="260" width="190" height="85" rx="6" fill="#111827" stroke="#334155" strokeWidth="1" /><text x="665" y="278" fill="#d8b4fe" fontSize="10" fontWeight="bold">STACK SEGMENT [0xD0 - 0xFF]</text><text x="665" y="296" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            SP Pointer: <tspan fill="#c084fc">{formatHex(registers.SP, 2)}</tspan></text><text x="665" y="314" fill="#94a3b8" fontSize="8" fontFamily="monospace">
            Return Addresses & Frames
          </text></svg></div>{
    /* Datapath Status Bar Legend */
  }<div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2"><div className="flex items-center gap-4"><div className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-amber-400" /><span className="text-[11px] font-mono">Address Bus</span></div><div className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-cyan-400" /><span className="text-[11px] font-mono">Data Bus</span></div><div className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-sm bg-purple-400" /><span className="text-[11px] font-mono">Control Bus</span></div></div><div className="text-[11px] font-mono text-slate-400">
          RAM Access:{" "}<span className={`font-bold ${isReading ? "text-cyan-400" : isWriting ? "text-emerald-400" : "text-slate-600"}`}>{isReading ? "READING FROM RAM" : isWriting ? "WRITING TO RAM" : "BUS IDLE"}</span></div></div></div>;
};
