import { ALU } from "./alu";
import { MemoryUnit } from "./memory";
import { RegisterFile } from "./registers";
export class VirtualMachine {
  registers;
  memory;
  flags;
  alu;
  bus;
  stage;
  clockCycle;
  instructionCount;
  isHalted;
  outputConsole;
  executionLog;
  instructions = [];
  reverseSourceMap = {};
  history = [];
  maxHistory = 200;
  currentInstruction = null;
  activeExplanation = "System ready. Press Step or Play to begin execution.";
  // Temporary registers across micro-cycles
  decodedOpcode = null;
  decodedOperands = [];
  execTempResult = null;
  execDestReg = null;
  execMemWriteAddr = null;
  execMemWriteVal = null;
  constructor() {
    this.registers = new RegisterFile();
    this.memory = new MemoryUnit();
    this.flags = { zero: false, negative: false, carry: false, overflow: false };
    this.alu = { operandA: 0, operandB: 0, operation: null, result: 0, active: false };
    this.bus = {
      addressBus: null,
      dataBus: null,
      controlSignals: {
        readMem: false,
        writeMem: false,
        aluOp: null,
        regWrite: null,
        busActive: false
      }
    };
    this.stage = "FETCH";
    this.clockCycle = 0;
    this.instructionCount = 0;
    this.isHalted = false;
    this.outputConsole = [];
    this.executionLog = [];
  }
  loadProgram(instructions, initialMemory, reverseSourceMap = {}) {
    this.instructions = instructions;
    this.reverseSourceMap = reverseSourceMap;
    this.memory = new MemoryUnit(initialMemory);
    this.reset();
  }
  reset() {
    this.registers.reset();
    this.memory.clearAccessFlags();
    this.flags = { zero: false, negative: false, carry: false, overflow: false };
    this.alu = { operandA: 0, operandB: 0, operation: null, result: 0, active: false };
    this.bus = {
      addressBus: null,
      dataBus: null,
      controlSignals: {
        readMem: false,
        writeMem: false,
        aluOp: null,
        regWrite: null,
        busActive: false
      }
    };
    this.stage = "FETCH";
    this.clockCycle = 0;
    this.instructionCount = 0;
    this.isHalted = false;
    this.outputConsole = [];
    this.executionLog = [];
    this.history = [];
    this.currentInstruction = null;
    this.activeExplanation = "Simulation initialized. PC points to 0x00.";
    this.decodedOpcode = null;
    this.decodedOperands = [];
    this.execTempResult = null;
    this.execDestReg = null;
    this.execMemWriteAddr = null;
    this.execMemWriteVal = null;
  }
  clearConsole() {
    this.outputConsole = [];
  }
  saveSnapshot() {
    const snapshot = {
      registers: this.registers.getAll(),
      flags: { ...this.flags },
      memory: this.memory.getCells(),
      alu: { ...this.alu },
      bus: {
        addressBus: this.bus.addressBus,
        dataBus: this.bus.dataBus,
        controlSignals: { ...this.bus.controlSignals }
      },
      currentStage: this.stage,
      currentInstruction: this.currentInstruction ? { ...this.currentInstruction } : null,
      clockCycle: this.clockCycle,
      instructionCount: this.instructionCount,
      isHalted: this.isHalted,
      outputConsole: [...this.outputConsole],
      callStackFrames: this.getCallStackFrames(),
      explanation: this.activeExplanation
    };
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }
  stepBack() {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    for (const [k, v] of Object.entries(prev.registers)) {
      this.registers.set(k, v);
    }
    this.flags = { ...prev.flags };
    this.memory = new MemoryUnit(prev.memory);
    this.alu = { ...prev.alu };
    this.bus = {
      addressBus: prev.bus.addressBus,
      dataBus: prev.bus.dataBus,
      controlSignals: { ...prev.bus.controlSignals }
    };
    this.stage = prev.currentStage;
    this.currentInstruction = prev.currentInstruction;
    this.clockCycle = prev.clockCycle;
    this.instructionCount = prev.instructionCount;
    this.isHalted = prev.isHalted;
    this.outputConsole = [...prev.outputConsole];
    this.activeExplanation = prev.explanation;
    return true;
  }
  canStepBack() {
    return this.history.length > 0;
  }
  /**
   * Executes a single micro-cycle stage (FETCH -> DECODE -> EXECUTE -> WRITEBACK)
   */
  stepMicroCycle() {
    if (this.isHalted) return;
    this.saveSnapshot();
    this.clockCycle++;
    this.registers.clearModified();
    this.memory.clearAccessFlags();
    switch (this.stage) {
      case "FETCH":
        this.doFetchStage();
        this.stage = "DECODE";
        break;
      case "DECODE":
        this.doDecodeStage();
        this.stage = "EXECUTE";
        break;
      case "EXECUTE":
        this.doExecuteStage();
        this.stage = "WRITEBACK";
        break;
      case "WRITEBACK":
        this.doWritebackStage();
        this.stage = "FETCH";
        this.instructionCount++;
        break;
    }
  }
  /**
   * Completes the entire current instruction (cycles through remaining stages)
   */
  stepInstruction() {
    if (this.isHalted) return;
    do {
      this.stepMicroCycle();
    } while (this.stage !== "FETCH" && !this.isHalted);
  }
  /**
   * Steps until the high-level source line changes or execution halts
   */
  stepSourceLine() {
    if (this.isHalted) return;
    const currentPc = this.registers.get("PC");
    const startLine = this.reverseSourceMap[currentPc];
    let safetyCount = 0;
    while (!this.isHalted && safetyCount < 1e3) {
      this.stepInstruction();
      safetyCount++;
      const nextPc = this.registers.get("PC");
      const nextLine = this.reverseSourceMap[nextPc];
      if (nextLine !== void 0 && nextLine !== startLine) {
        break;
      }
    }
  }
  // --- Stage 1: FETCH ---
  doFetchStage() {
    const pc = this.registers.get("PC");
    this.registers.set("MAR", pc);
    this.bus.addressBus = pc;
    this.bus.controlSignals = {
      readMem: true,
      writeMem: false,
      aluOp: null,
      regWrite: null,
      busActive: true
    };
    if (pc >= this.instructions.length) {
      this.isHalted = true;
      this.activeExplanation = `PC (0x${pc.toString(16)}) is beyond program code bounds. Processor halted.`;
      return;
    }
    const inst = this.instructions[pc];
    this.currentInstruction = inst;
    const opcodeVal = this.memory.read(pc);
    this.registers.set("MBR", opcodeVal);
    this.bus.dataBus = opcodeVal;
    this.registers.set("IR", opcodeVal);
    this.registers.set("PC", pc + 1);
    this.activeExplanation = `[FETCH] Cycle ${this.clockCycle}: Sent PC (0x${pc.toString(16).padStart(2, "0")}) onto Address Bus. Read instruction "${inst.rawText}" into IR. Incremented PC to 0x${(pc + 1).toString(16).padStart(2, "0")}.`;
    this.addLogEntry("fetch", "FETCH", this.activeExplanation);
  }
  // --- Stage 2: DECODE ---
  doDecodeStage() {
    if (!this.currentInstruction) return;
    const inst = this.currentInstruction;
    this.decodedOpcode = inst.opcode;
    this.decodedOperands = inst.operands;
    this.bus.addressBus = null;
    this.bus.dataBus = null;
    this.bus.controlSignals = {
      readMem: false,
      writeMem: false,
      aluOp: null,
      regWrite: null,
      busActive: false
    };
    this.alu.active = false;
    this.activeExplanation = `[DECODE] Cycle ${this.clockCycle}: Control Unit decoded opcode "${inst.opcode}" with operands [${inst.operands.join(", ")}]. Preparing internal datapath routing.`;
    this.addLogEntry("decode", "DECODE", this.activeExplanation);
  }
  // --- Stage 3: EXECUTE ---
  doExecuteStage() {
    if (!this.decodedOpcode) return;
    const op = this.decodedOpcode;
    const args = this.decodedOperands;
    this.execTempResult = null;
    this.execDestReg = null;
    this.execMemWriteAddr = null;
    this.execMemWriteVal = null;
    switch (op) {
      case "NOP": {
        this.activeExplanation = `[EXECUTE] No operation performed.`;
        break;
      }
      case "HLT": {
        this.isHalted = true;
        this.activeExplanation = `[EXECUTE] HLT instruction reached. CPU clock stopped cleanly.`;
        break;
      }
      case "MOV": {
        const dest = args[0];
        const val = this.resolveValue(args[1]);
        this.execDestReg = dest;
        this.execTempResult = val;
        this.bus.dataBus = val;
        this.activeExplanation = `[EXECUTE] Prepared value ${val} to load into register ${dest}.`;
        break;
      }
      case "LOAD": {
        const dest = args[0];
        const memAddr = this.resolveAddress(args[1]);
        this.registers.set("MAR", memAddr);
        this.bus.addressBus = memAddr;
        this.bus.controlSignals.readMem = true;
        this.bus.controlSignals.busActive = true;
        const memVal = this.memory.read(memAddr);
        this.registers.set("MBR", memVal);
        this.bus.dataBus = memVal;
        this.execDestReg = dest;
        this.execTempResult = memVal;
        this.activeExplanation = `[EXECUTE] Read value ${memVal} from RAM address 0x${memAddr.toString(16).toUpperCase()} into MBR.`;
        break;
      }
      case "STORE": {
        const memAddr = this.resolveAddress(args[0]);
        const val = this.resolveValue(args[1]);
        this.registers.set("MAR", memAddr);
        this.registers.set("MBR", val);
        this.bus.addressBus = memAddr;
        this.bus.dataBus = val;
        this.bus.controlSignals.writeMem = true;
        this.bus.controlSignals.busActive = true;
        this.execMemWriteAddr = memAddr;
        this.execMemWriteVal = val;
        this.activeExplanation = `[EXECUTE] Prepared to write value ${val} into RAM address 0x${memAddr.toString(16).toUpperCase()}.`;
        break;
      }
      case "ADD":
      case "SUB":
      case "MUL":
      case "DIV":
      case "MOD":
      case "AND":
      case "OR":
      case "XOR":
      case "SHL":
      case "SHR": {
        const dest = args[0];
        const opA = this.registers.get(dest);
        const opB = this.resolveValue(args[1]);
        this.alu.operandA = opA;
        this.alu.operandB = opB;
        this.alu.operation = op;
        this.alu.active = true;
        const aluRes = ALU.execute(op, opA, opB, this.flags);
        this.alu.result = aluRes.result;
        this.flags = aluRes.flags;
        this.execDestReg = dest;
        this.execTempResult = aluRes.result;
        this.bus.dataBus = aluRes.result;
        this.bus.controlSignals.aluOp = op;
        this.activeExplanation = `[EXECUTE] ${aluRes.explanation}. FLAGS: Z=${this.flags.zero ? 1 : 0}, N=${this.flags.negative ? 1 : 0}, C=${this.flags.carry ? 1 : 0}.`;
        this.addLogEntry("alu", "EXECUTE", this.activeExplanation);
        return;
      }
      case "NOT": {
        const dest = args[0];
        const opA = this.registers.get(dest);
        const aluRes = ALU.execute("NOT", opA, 0, this.flags);
        this.alu.operandA = opA;
        this.alu.operation = "NOT";
        this.alu.result = aluRes.result;
        this.alu.active = true;
        this.flags = aluRes.flags;
        this.execDestReg = dest;
        this.execTempResult = aluRes.result;
        this.activeExplanation = `[EXECUTE] ${aluRes.explanation}.`;
        break;
      }
      case "CMP": {
        const opA = this.resolveValue(args[0]);
        const opB = this.resolveValue(args[1]);
        const aluRes = ALU.execute("CMP", opA, opB, this.flags);
        this.alu.operandA = opA;
        this.alu.operandB = opB;
        this.alu.operation = "CMP";
        this.alu.result = aluRes.result;
        this.alu.active = true;
        this.flags = aluRes.flags;
        this.activeExplanation = `[EXECUTE] ${aluRes.explanation}. Set condition flags: Zero=${this.flags.zero ? 1 : 0}, Negative=${this.flags.negative ? 1 : 0}.`;
        this.addLogEntry("alu", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JMP": {
        const target = this.resolveAddress(args[0]);
        this.registers.set("PC", target);
        this.activeExplanation = `[EXECUTE] Unconditional Jump: set PC to 0x${target.toString(16).toUpperCase()}.`;
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JZ": {
        const target = this.resolveAddress(args[0]);
        if (this.flags.zero) {
          this.registers.set("PC", target);
          this.activeExplanation = `[EXECUTE] Jump Taken (Zero flag is 1): jumping PC to 0x${target.toString(16).toUpperCase()}.`;
        } else {
          this.activeExplanation = `[EXECUTE] Jump Not Taken (Zero flag is 0): continuing sequence.`;
        }
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JNZ": {
        const target = this.resolveAddress(args[0]);
        if (!this.flags.zero) {
          this.registers.set("PC", target);
          this.activeExplanation = `[EXECUTE] Jump Taken (Zero flag is 0): jumping PC to 0x${target.toString(16).toUpperCase()}.`;
        } else {
          this.activeExplanation = `[EXECUTE] Jump Not Taken (Zero flag is 1): continuing sequence.`;
        }
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JL": {
        const target = this.resolveAddress(args[0]);
        const condition = this.flags.negative !== this.flags.overflow;
        if (condition) {
          this.registers.set("PC", target);
          this.activeExplanation = `[EXECUTE] Jump Taken (Less condition true): jumping PC to 0x${target.toString(16).toUpperCase()}.`;
        } else {
          this.activeExplanation = `[EXECUTE] Jump Not Taken (Not Less).`;
        }
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JG": {
        const target = this.resolveAddress(args[0]);
        const condition = !this.flags.zero && this.flags.negative === this.flags.overflow;
        if (condition) {
          this.registers.set("PC", target);
          this.activeExplanation = `[EXECUTE] Jump Taken (Greater condition true): jumping PC to 0x${target.toString(16).toUpperCase()}.`;
        } else {
          this.activeExplanation = `[EXECUTE] Jump Not Taken (Not Greater).`;
        }
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JLE": {
        const target = this.resolveAddress(args[0]);
        const condition = this.flags.zero || this.flags.negative !== this.flags.overflow;
        if (condition) {
          this.registers.set("PC", target);
          this.activeExplanation = `[EXECUTE] Jump Taken (Less or Equal condition true): jumping PC to 0x${target.toString(16).toUpperCase()}.`;
        } else {
          this.activeExplanation = `[EXECUTE] Jump Not Taken.`;
        }
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "JGE": {
        const target = this.resolveAddress(args[0]);
        const condition = this.flags.negative === this.flags.overflow;
        if (condition) {
          this.registers.set("PC", target);
          this.activeExplanation = `[EXECUTE] Jump Taken (Greater or Equal condition true): jumping PC to 0x${target.toString(16).toUpperCase()}.`;
        } else {
          this.activeExplanation = `[EXECUTE] Jump Not Taken.`;
        }
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "PUSH": {
        const val = this.resolveValue(args[0]);
        let sp = this.registers.get("SP");
        sp = sp - 1 & 255;
        this.registers.set("SP", sp);
        this.registers.set("MAR", sp);
        this.registers.set("MBR", val);
        this.execMemWriteAddr = sp;
        this.execMemWriteVal = val;
        this.activeExplanation = `[EXECUTE] Decremented SP to 0x${sp.toString(16).toUpperCase()}. Prepared to push ${val} onto the stack.`;
        this.addLogEntry("memory", "EXECUTE", this.activeExplanation);
        return;
      }
      case "POP": {
        const dest = args[0];
        const sp = this.registers.get("SP");
        this.registers.set("MAR", sp);
        const val = this.memory.read(sp);
        this.registers.set("MBR", val);
        this.execDestReg = dest;
        this.execTempResult = val;
        const nextSp = sp + 1 & 255;
        this.registers.set("SP", nextSp);
        this.activeExplanation = `[EXECUTE] Popped value ${val} from stack at 0x${sp.toString(16).toUpperCase()}. Incremented SP to 0x${nextSp.toString(16).toUpperCase()}.`;
        this.addLogEntry("memory", "EXECUTE", this.activeExplanation);
        return;
      }
      case "CALL": {
        const target = this.resolveAddress(args[0]);
        const retAddr = this.registers.get("PC");
        let sp = this.registers.get("SP");
        sp = sp - 1 & 255;
        this.registers.set("SP", sp);
        this.memory.write(sp, retAddr);
        this.registers.set("PC", target);
        this.activeExplanation = `[EXECUTE] Function CALL: Pushed return address 0x${retAddr.toString(16).toUpperCase()} to stack. Jumped PC to 0x${target.toString(16).toUpperCase()}.`;
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "RET": {
        const sp = this.registers.get("SP");
        const retAddr = this.memory.read(sp);
        this.registers.set("SP", sp + 1 & 255);
        this.registers.set("PC", retAddr);
        this.activeExplanation = `[EXECUTE] RET: Popped return address 0x${retAddr.toString(16).toUpperCase()} from stack into PC.`;
        this.addLogEntry("jump", "EXECUTE", this.activeExplanation);
        return;
      }
      case "PRINT": {
        let text = "";
        const rawArg = args[0] ? args[0].trim() : "";
        if (rawArg.startsWith('"') && rawArg.endsWith('"')) {
          text = rawArg.slice(1, -1);
        } else {
          const val = this.resolveValue(rawArg);
          text = val.toString();
        }
        this.outputConsole.push(text);
        this.activeExplanation = `[EXECUTE] Console output: ${text}`;
        this.addLogEntry("io", "EXECUTE", this.activeExplanation);
        return;
      }
    }
    this.addLogEntry("alu", "EXECUTE", this.activeExplanation);
  }
  // --- Stage 4: WRITEBACK ---
  doWritebackStage() {
    if (this.execDestReg !== null && this.execTempResult !== null) {
      this.registers.set(this.execDestReg, this.execTempResult);
      this.bus.controlSignals.regWrite = this.execDestReg;
      this.activeExplanation = `[WRITEBACK] Cycle ${this.clockCycle}: Stored value ${this.execTempResult} into register ${this.execDestReg}.`;
    } else if (this.execMemWriteAddr !== null && this.execMemWriteVal !== null) {
      this.memory.write(this.execMemWriteAddr, this.execMemWriteVal);
      this.activeExplanation = `[WRITEBACK] Cycle ${this.clockCycle}: Wrote value ${this.execMemWriteVal} to RAM[0x${this.execMemWriteAddr.toString(16).toUpperCase()}].`;
    } else {
      this.activeExplanation = `[WRITEBACK] Cycle ${this.clockCycle}: Instruction finished without additional register or RAM writeback.`;
    }
    this.alu.active = false;
    this.bus.controlSignals.busActive = false;
    this.addLogEntry("memory", "WRITEBACK", this.activeExplanation);
  }
  // Helper: resolves operand to integer (e.g. 'R0' -> register value, '42' -> 42, '0x20' -> 32)
  resolveValue(operand) {
    const trimmed = operand.trim();
    if (this.isRegister(trimmed)) {
      return this.registers.get(trimmed);
    }
    if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
      return parseInt(trimmed, 16);
    }
    return parseInt(trimmed, 10) || 0;
  }
  // Helper: resolves memory address syntax, e.g. '[0x80]' -> 0x80, '[R1]' -> value in R1, '[BP + 2]' -> BP + 2
  resolveAddress(operand) {
    let clean = operand.trim();
    if (clean.startsWith("[") && clean.endsWith("]")) {
      clean = clean.slice(1, -1).trim();
    }
    const offsetMatch = clean.match(/^([A-Za-z0-9_]+)\s*([\+\-])\s*([0-9]+|0x[0-9a-fA-F]+)$/);
    if (offsetMatch) {
      const baseReg = offsetMatch[1];
      const sign = offsetMatch[2];
      const offsetVal = offsetMatch[3].startsWith("0x") || offsetMatch[3].startsWith("0X") ? parseInt(offsetMatch[3], 16) : parseInt(offsetMatch[3], 10);
      let baseVal = 0;
      if (this.isRegister(baseReg)) {
        baseVal = this.registers.get(baseReg);
      }
      return sign === "+" ? baseVal + offsetVal & 255 : baseVal - offsetVal & 255;
    }
    if (this.isRegister(clean)) {
      return this.registers.get(clean);
    }
    if (clean.startsWith("0x") || clean.startsWith("0X")) {
      return parseInt(clean, 16);
    }
    return parseInt(clean, 10) || 0;
  }
  isRegister(name) {
    return ["R0", "R1", "R2", "R3", "R4", "R5", "PC", "IR", "SP", "BP", "MAR", "MBR"].includes(name);
  }
  addLogEntry(category, stage, description) {
    const pc = this.registers.get("PC");
    this.executionLog.unshift({
      cycle: this.clockCycle,
      instructionCount: this.instructionCount,
      stage,
      pc,
      description,
      category
    });
    if (this.executionLog.length > 300) {
      this.executionLog.pop();
    }
  }
  getCallStackFrames() {
    const frames = [];
    const sp = this.registers.get("SP");
    const bp = this.registers.get("BP");
    if (sp < 255) {
      frames.push({
        functionName: "Active Frame",
        returnAddress: this.memory.read(sp),
        framePointer: bp,
        parameters: [],
        localVariables: []
      });
    }
    return frames;
  }
  // Getters for UI State
  getState() {
    return {
      registers: this.registers.getAll(),
      flags: { ...this.flags },
      memory: this.memory.getCells(),
      alu: { ...this.alu },
      bus: {
        addressBus: this.bus.addressBus,
        dataBus: this.bus.dataBus,
        controlSignals: { ...this.bus.controlSignals }
      },
      currentStage: this.stage,
      currentInstruction: this.currentInstruction ? { ...this.currentInstruction } : null,
      clockCycle: this.clockCycle,
      instructionCount: this.instructionCount,
      isHalted: this.isHalted,
      outputConsole: [...this.outputConsole],
      callStackFrames: this.getCallStackFrames(),
      explanation: this.activeExplanation
    };
  }
  getExecutionLog() {
    return this.executionLog;
  }
}
