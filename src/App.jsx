import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "./components/Header";
import { CodeEditor } from "./components/CodeEditor";
import { AssemblyViewer } from "./components/AssemblyViewer";
import { HardwareVisualizer } from "./components/HardwareVisualizer";
import { RegistersView } from "./components/RegistersView";
import { AluView } from "./components/AluView";
import { ControlUnitView } from "./components/ControlUnitView";
import { ConsoleView } from "./components/ConsoleView";
import { ArchitectureGuideModal } from "./components/ArchitectureGuideModal";
import { PRESETS } from "./compiler/presets";
import { tokenize } from "./compiler/lexer";
import { Parser } from "./compiler/parser";
import { CodeGenerator } from "./compiler/codegen";
import { VirtualMachine } from "./cpu/machine";
import { Code2, FileCode2 } from "lucide-react";
export const App = () => {
  const [selectedPresetId, setSelectedPresetId] = useState("variables-math");
  const [sourceCode, setSourceCode] = useState(PRESETS[0].code);
  const [lastCompiledCode, setLastCompiledCode] = useState("");
  const [compilation, setCompilation] = useState(null);
  const [compileError, setCompileError] = useState();
  const [compileErrorLine, setCompileErrorLine] = useState();
  const vmRef = useRef(new VirtualMachine());
  const [vmState, setVmState] = useState(() => vmRef.current.getState());
  const [isRunning, setIsRunning] = useState(false);
  const [speedHz, setSpeedHz] = useState(3);
  const [breakpoints, setBreakpoints] = useState(/* @__PURE__ */ new Set());
  const [codeTab, setCodeTab] = useState("highlevel");
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const handleCodeChange = (newCode) => {
    setSourceCode(newCode);
    if (compileError) {
      setCompileError(void 0);
      setCompileErrorLine(void 0);
    }
  };
  const compileAndLoad = useCallback((codeToCompile) => {
    try {
      setCompileError(void 0);
      setCompileErrorLine(void 0);
      const tokens = tokenize(codeToCompile);
      const parser = new Parser(tokens);
      const ast = parser.parse();
      const codegen = new CodeGenerator();
      const result = codegen.compile(ast);
      if (!result.success) {
        setCompileError(result.error);
        const match = result.error?.match(/line (\d+)/i);
        const line = match ? parseInt(match[1], 10) : void 0;
        setCompileErrorLine(result.errorLine ?? line);
        return false;
      }
      setCompilation(result);
      setLastCompiledCode(codeToCompile);
      vmRef.current.loadProgram(result.instructions, result.memoryInitial, result.reverseSourceMap);
      setVmState(vmRef.current.getState());
      setIsRunning(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const match = msg.match(/line (\d+)/i);
      const line = match ? parseInt(match[1], 10) : void 0;
      setCompileError(msg);
      setCompileErrorLine(line);
      return false;
    }
  }, []);
  useEffect(() => {
    compileAndLoad(sourceCode);
  }, []);
  const handleSelectPreset = (presetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(presetId);
    setSourceCode(preset.code);
    setIsRunning(false);
    compileAndLoad(preset.code);
  };
  const handleToggleBreakpoint = (line) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  };
  const handleStepMicro = useCallback(() => {
    if (vmState.isHalted) return;
    vmRef.current.stepMicroCycle();
    setVmState(vmRef.current.getState());
  }, [vmState.isHalted]);
  const handleStepInstruction = useCallback(() => {
    if (vmState.isHalted) return;
    vmRef.current.stepInstruction();
    setVmState(vmRef.current.getState());
  }, [vmState.isHalted]);
  const handleStepLine = useCallback(() => {
    if (vmState.isHalted) return;
    vmRef.current.stepSourceLine();
    setVmState(vmRef.current.getState());
  }, [vmState.isHalted]);
  const handleStepBack = useCallback(() => {
    if (isRunning) setIsRunning(false);
    const stepped = vmRef.current.stepBack();
    if (stepped) {
      setVmState(vmRef.current.getState());
    }
  }, [isRunning]);
  const handleReset = useCallback(() => {
    setIsRunning(false);
    vmRef.current.reset();
    setVmState(vmRef.current.getState());
  }, []);
  const handleTogglePlay = useCallback(() => {
    if (vmState.isHalted) {
      handleReset();
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  }, [vmState.isHalted, handleReset]);
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.max(20, Math.floor(1e3 / speedHz));
    const timer = setInterval(() => {
      vmRef.current.stepMicroCycle();
      const state = vmRef.current.getState();
      setVmState(state);
      if (state.currentStage === "FETCH" && compilation) {
        const activeLine2 = compilation.reverseSourceMap[state.registers.PC];
        if (activeLine2 && breakpoints.has(activeLine2)) {
          setIsRunning(false);
        }
      }
      if (state.isHalted) {
        setIsRunning(false);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isRunning, speedHz, compilation, breakpoints]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "F11") {
        e.preventDefault();
        handleStepMicro();
      } else if (e.code === "F10") {
        e.preventDefault();
        handleStepInstruction();
      } else if (e.code === "F8") {
        e.preventDefault();
        handleReset();
      } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        handleStepBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlay, handleStepMicro, handleStepInstruction, handleReset, handleStepBack]);
  const activeLine = compilation && vmState.currentInstruction ? vmState.currentInstruction.sourceLine : compilation ? compilation.reverseSourceMap[vmState.registers.PC] : void 0;
  return <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">{
    /* Top Navigation & Controls */
  }<Header
    isRunning={isRunning}
    onTogglePlay={handleTogglePlay}
    onStepMicro={handleStepMicro}
    onStepInstruction={handleStepInstruction}
    onStepLine={handleStepLine}
    onStepBack={handleStepBack}
    canStepBack={vmRef.current.canStepBack()}
    onReset={handleReset}
    speedHz={speedHz}
    onSpeedChange={setSpeedHz}
    selectedPresetId={selectedPresetId}
    onSelectPreset={handleSelectPreset}
    onOpenGuide={() => setIsGuideOpen(true)}
    isHalted={vmState.isHalted}
  />{
    /* Main Simulator Workspace */
  }<main className="flex-1 p-3 max-w-[1750px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">{
    /* LEFT COLUMN: Code & Assembly (4 cols on lg/xl) */
  }<section className="lg:col-span-4 flex flex-col gap-3 h-full">{
    /* Code Tab Switcher */
  }<div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0"><button
    onClick={() => setCodeTab("highlevel")}
    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${codeTab === "highlevel" ? "bg-slate-800 text-cyan-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
  ><Code2 className="w-3.5 h-3.5" /><span>High-Level Code</span></button><button
    onClick={() => setCodeTab("assembly")}
    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${codeTab === "assembly" ? "bg-slate-800 text-amber-300 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
  ><FileCode2 className="w-3.5 h-3.5" /><span>Assembly</span>{compilation && <span className="text-[10px] bg-slate-950 px-1.5 py-0.2 rounded font-mono text-slate-400">{compilation.instructions.length}</span>}</button></div>{
    /* Active Code Panel */
  }<div className="h-[520px] lg:h-[540px] shrink-0 overflow-hidden">{codeTab === "highlevel" ? <CodeEditor
    code={sourceCode}
    onChange={handleCodeChange}
    onCompile={() => compileAndLoad(sourceCode)}
    activeLine={activeLine}
    breakpoints={breakpoints}
    onToggleBreakpoint={handleToggleBreakpoint}
    error={compileError}
    errorLine={compileErrorLine}
    isRunning={isRunning}
    isDirty={sourceCode !== lastCompiledCode}
  /> : <AssemblyViewer
    instructions={compilation ? compilation.instructions : []}
    currentPc={vmState.registers.PC}
    highlightedLine={activeLine}
  />}</div>{
    /* Bottom Left: Terminal Console (Stretches to fill vertical height, eliminating bottom gap) */
  }<div className="flex-1 min-h-[260px] overflow-hidden"><ConsoleView
    output={vmState.outputConsole}
    onClear={() => {
      vmRef.current.clearConsole();
      setVmState(vmRef.current.getState());
    }}
  /></div></section>{
    /* RIGHT COLUMN: Hardware Datapath, Control Unit, Registers & ALU (8 cols on lg/xl) */
  }<section className="lg:col-span-8 flex flex-col gap-3">{
    /* Main SVG Animated Datapath */
  }<HardwareVisualizer
    registers={vmState.registers}
    stage={vmState.currentStage}
    currentInstruction={vmState.currentInstruction}
    bus={vmState.bus}
    flags={vmState.flags}
    memory={vmState.memory}
    clockCycle={vmState.clockCycle}
  />{
    /* Control Unit & Micro-Cycle Timing */
  }<ControlUnitView
    stage={vmState.currentStage}
    currentInstruction={vmState.currentInstruction}
    bus={vmState.bus}
    clockCycle={vmState.clockCycle}
    instructionCount={vmState.instructionCount}
  />{
    /* Active Cycle Explanation Card */
  }<div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg"><div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center justify-between"><span>Active Cycle Explanation</span><span className="text-cyan-400 font-mono">Stage: {vmState.currentStage}</span></div><p className="text-xs font-mono text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-850">{vmState.explanation}</p></div>{
    /* Registers and ALU side-by-side */
  }<div className="grid grid-cols-1 md:grid-cols-2 gap-3"><RegistersView registers={vmState.registers} /><AluView alu={vmState.alu} flags={vmState.flags} /></div></section></main>{
    /* Architecture Guide Modal */
  }<ArchitectureGuideModal
    isOpen={isGuideOpen}
    onClose={() => setIsGuideOpen(false)}
  /></div>;
};
export default App;
