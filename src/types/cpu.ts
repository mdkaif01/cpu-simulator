// CPU and Simulation Type Definitions

export type RegisterName = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'PC' | 'IR' | 'SP' | 'BP' | 'MAR' | 'MBR';

export interface CpuFlags {
  zero: boolean;      // Z: Result is zero
  negative: boolean;  // N: Result is negative
  carry: boolean;     // C: Arithmetic carry
  overflow: boolean;  // V: Signed overflow
}

export type MicroCycleStage = 'FETCH' | 'DECODE' | 'EXECUTE' | 'WRITEBACK';

export type BusType = 'ADDRESS' | 'DATA' | 'CONTROL';

export interface BusState {
  addressBus: number | null;
  dataBus: number | null;
  controlSignals: {
    readMem: boolean;
    writeMem: boolean;
    aluOp: string | null;
    regWrite: RegisterName | null;
    busActive: boolean;
  };
}

export type AluOperation = 
  | 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MOD'
  | 'AND' | 'OR' | 'XOR' | 'NOT'
  | 'SHL' | 'SHR' | 'CMP' | 'PASS';

export interface AluState {
  operandA: number;
  operandB: number;
  operation: AluOperation | null;
  result: number;
  active: boolean;
}

export interface MemoryCell {
  address: number;
  value: number;
  label?: string;
  sourceInstruction?: string;
  segment: 'code' | 'data' | 'stack';
  lastAccessed?: 'read' | 'write' | null;
}

export type Opcode =
  | 'NOP'
  | 'MOV'     // MOV dest, src
  | 'LOAD'    // LOAD dest, [addr]
  | 'STORE'   // STORE [addr], src
  | 'ADD'     // ADD dest, src
  | 'SUB'     // SUB dest, src
  | 'MUL'     // MUL dest, src
  | 'DIV'     // DIV dest, src
  | 'MOD'     // MOD dest, src
  | 'AND'     // AND dest, src
  | 'OR'      // OR dest, src
  | 'XOR'     // XOR dest, src
  | 'NOT'     // NOT dest
  | 'SHL'     // SHL dest, amt
  | 'SHR'     // SHR dest, amt
  | 'CMP'     // CMP reg1, reg2/imm
  | 'JMP'     // JMP label/addr
  | 'JZ'      // Jump if Zero
  | 'JNZ'     // Jump if Not Zero
  | 'JL'      // Jump if Less (Negative != Overflow)
  | 'JG'      // Jump if Greater
  | 'JLE'     // Jump if Less or Equal
  | 'JGE'     // Jump if Greater or Equal
  | 'PUSH'    // PUSH src
  | 'POP'     // POP dest
  | 'CALL'    // CALL label/addr
  | 'RET'     // RET
  | 'PRINT'   // PRINT reg/imm/str
  | 'HLT';    // Halt execution

export interface Instruction {
  id: string;
  address: number;
  opcode: Opcode;
  operands: string[];
  rawText: string;
  sourceLine?: number; // Maps back to high-level code line (1-indexed)
  comment?: string;
}

export interface ExecutionLogEntry {
  cycle: number;
  instructionCount: number;
  stage: MicroCycleStage;
  pc: number;
  description: string;
  details?: string;
  category: 'fetch' | 'decode' | 'alu' | 'memory' | 'jump' | 'io' | 'system';
}

export interface MachineSnapshot {
  registers: Record<RegisterName, number>;
  flags: CpuFlags;
  memory: MemoryCell[];
  alu: AluState;
  bus: BusState;
  currentStage: MicroCycleStage;
  currentInstruction: Instruction | null;
  clockCycle: number;
  instructionCount: number;
  isHalted: boolean;
  outputConsole: string[];
  callStackFrames: StackFrame[];
  explanation: string;
}

export interface StackFrame {
  functionName: string;
  returnAddress: number;
  framePointer: number;
  parameters: { name: string; value: number }[];
  localVariables: { name: string; value: number; address: number }[];
}

export interface CompilationResult {
  success: boolean;
  instructions: Instruction[];
  memoryInitial: MemoryCell[];
  variableAddresses: Record<string, number>;
  sourceMap: Record<number, number[]>; // High-level line -> Assembly addresses
  reverseSourceMap: Record<number, number>; // Assembly address -> High-level line
  error?: string;
  errorLine?: number;
}
