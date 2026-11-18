// Code Generator: Compiles AST to Virtual Machine Assembly & Memory

import {
  ProgramNode,
  StatementNode,
  VariableDeclarationNode,
  AssignmentStatementNode,
  IfStatementNode,
  WhileStatementNode,
  ForStatementNode,
  FunctionDeclarationNode,
  ReturnStatementNode,
  ExpressionStatementNode,
  ExpressionNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  IdentifierNode,
  LiteralNode,
  StringLiteralNode,
  FunctionCallNode,
  ArrayAccessNode,
  ArrayLiteralNode
} from '../types/ast';
import { CompilationResult, Instruction, MemoryCell, Opcode } from '../types/cpu';

interface IntermediateInstruction {
  opcode: Opcode;
  operands: string[];
  rawText: string;
  sourceLine?: number;
  comment?: string;
  targetLabel?: string;
}

export class CodeGenerator {
  private instructions: IntermediateInstruction[] = [];
  private labels: Map<string, number> = new Map();
  private labelCounter: number = 0;

  // Memory layout:
  // 0x00 - 0x7F: Code segment (128 words)
  // 0x80 - 0xCF: Data segment (80 words)
  // 0xD0 - 0xFF: Stack segment (48 words, grows down from 0xFF)
  private dataSegmentStart = 0x80;
  private currentDataAddr = 0x80;
  private variables: Map<string, number> = new Map();
  private varSizes: Map<string, number> = new Map();
  private functions: Map<string, number> = new Map();
  private functionDeclarations: Map<string, FunctionDeclarationNode> = new Map();
  private currentFunction: string | null = null;
  private functionEpilogues: Map<string, string> = new Map();

  private sourceMap: Record<number, number[]> = {};
  private reverseSourceMap: Record<number, number> = {};

  private uniqueLabel(prefix = 'L'): string {
    return `${prefix}_${this.labelCounter++}`;
  }

  private emit(
    opcode: Opcode,
    operands: string[],
    sourceLine?: number,
    comment?: string,
    targetLabel?: string
  ): void {
    const rawText = `${opcode.padEnd(5)} ${operands.join(', ')}`;
    this.instructions.push({
      opcode,
      operands,
      rawText,
      sourceLine,
      comment,
      targetLabel
    });
  }

  private markLabel(label: string): void {
    this.labels.set(label, this.instructions.length);
  }

  public compile(ast: ProgramNode): CompilationResult {
    try {
      this.instructions = [];
      this.labels.clear();
      this.labelCounter = 0;
      this.currentDataAddr = this.dataSegmentStart;
      this.variables.clear();
      this.varSizes.clear();
      this.functions.clear();
      this.functionDeclarations.clear();
      this.currentFunction = null;
      this.functionEpilogues.clear();
      this.sourceMap = {};
      this.reverseSourceMap = {};

      // Register all function declarations first
      for (const stmt of ast.body) {
        if (stmt.type === 'FunctionDeclaration') {
          const fn = stmt as FunctionDeclarationNode;
          this.functionDeclarations.set(fn.name, fn);
        }
      }

      // Check if program defines a 'main' function (standard in C)
      const mainFunc = ast.body.find(
        (s) => s.type === 'FunctionDeclaration' && (s as FunctionDeclarationNode).name === 'main'
      ) as FunctionDeclarationNode | undefined;

      // If there are function declarations, emit jump over them to main entry code
      const hasFunctions = ast.body.some((s) => s.type === 'FunctionDeclaration');
      const mainLabel = hasFunctions ? this.uniqueLabel('entry_start') : null;

      if (mainLabel) {
        this.emit('JMP', [mainLabel], 1, 'Jump to program start', mainLabel);
      }

      // First pass: generate functions if any
      for (const stmt of ast.body) {
        if (stmt.type === 'FunctionDeclaration') {
          this.genFunctionDeclaration(stmt);
        }
      }

      // Mark main entry start
      if (mainLabel) {
        this.markLabel(mainLabel);
      }

      // Generate statements in main program body (globals, script statements)
      for (const stmt of ast.body) {
        if (stmt.type !== 'FunctionDeclaration') {
          this.genStatement(stmt);
        }
      }

      // If C main function exists, call main() automatically!
      if (mainFunc) {
        this.emit('CALL', ['func_main'], mainFunc.line, 'Execute C main() function', 'func_main');
      }

      // Final halt instruction
      this.emit('HLT', [], ast.line, 'End of execution');

      // Second pass: resolve labels into actual instruction addresses
      const finalInstructions: Instruction[] = [];
      for (let i = 0; i < this.instructions.length; i++) {
        const inst = this.instructions[i];
        const resolvedOperands = inst.operands.map((op) => {
          if (this.labels.has(op)) {
            return `0x${this.labels.get(op)!.toString(16).toUpperCase().padStart(2, '0')}`;
          }
          return op;
        });

        const address = i;
        const line = inst.sourceLine;

        if (line !== undefined) {
          if (!this.sourceMap[line]) this.sourceMap[line] = [];
          this.sourceMap[line].push(address);
          this.reverseSourceMap[address] = line;
        }

        const rawText = `${inst.opcode.padEnd(5)} ${resolvedOperands.join(', ')}`;

        finalInstructions.push({
          id: `inst-${address}`,
          address,
          opcode: inst.opcode,
          operands: resolvedOperands,
          rawText,
          sourceLine: line,
          comment: inst.comment
        });
      }

      // Initialize memory cells (256 words)
      const memoryInitial: MemoryCell[] = [];
      for (let addr = 0; addr < 256; addr++) {
        let segment: 'code' | 'data' | 'stack' = 'data';
        if (addr < 0x80) segment = 'code';
        else if (addr >= 0xD0) segment = 'stack';

        let value = 0;
        let label: string | undefined = undefined;
        let sourceInstruction: string | undefined = undefined;

        if (addr < finalInstructions.length) {
          const inst = finalInstructions[addr];
          sourceInstruction = inst.rawText;
          // Opcode numeric representation
          value = this.getOpcodeBinary(inst.opcode);
        }

        // Check if this address is a variable
        for (const [vName, vAddr] of this.variables.entries()) {
          const size = this.varSizes.get(vName) || 1;
          if (addr >= vAddr && addr < vAddr + size) {
            const offset = addr - vAddr;
            label = size > 1 ? `${vName}[${offset}]` : vName;
          }
        }

        memoryInitial.push({
          address: addr,
          value,
          label,
          sourceInstruction,
          segment,
          lastAccessed: null
        });
      }

      const variableAddressesObj: Record<string, number> = {};
      for (const [k, v] of this.variables.entries()) {
        variableAddressesObj[k] = v;
      }

      return {
        success: true,
        instructions: finalInstructions,
        memoryInitial,
        variableAddresses: variableAddressesObj,
        sourceMap: this.sourceMap,
        reverseSourceMap: this.reverseSourceMap
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        instructions: [],
        memoryInitial: [],
        variableAddresses: {},
        sourceMap: {},
        reverseSourceMap: {},
        error: message
      };
    }
  }

  private genStatement(stmt: StatementNode): void {
    switch (stmt.type) {
      case 'VariableDeclaration':
        this.genVariableDeclaration(stmt);
        break;
      case 'AssignmentStatement':
        this.genAssignmentStatement(stmt);
        break;
      case 'IfStatement':
        this.genIfStatement(stmt);
        break;
      case 'WhileStatement':
        this.genWhileStatement(stmt);
        break;
      case 'ForStatement':
        this.genForStatement(stmt);
        break;
      case 'ReturnStatement':
        this.genReturnStatement(stmt);
        break;
      case 'ExpressionStatement':
        this.genExpressionStatement(stmt);
        break;
      case 'Block':
        for (const inner of stmt.body) {
          this.genStatement(inner);
        }
        break;
    }
  }

  private allocateVariable(name: string, size = 1): number {
    if (!this.variables.has(name)) {
      const addr = this.currentDataAddr;
      this.variables.set(name, addr);
      this.varSizes.set(name, size);
      this.currentDataAddr += size;
      return addr;
    }
    return this.variables.get(name)!;
  }

  private genVariableDeclaration(node: VariableDeclarationNode): void {
    if (node.isArray && node.init && node.init.type === 'ArrayLiteral') {
      const elements = (node.init as ArrayLiteralNode).elements;
      const addr = this.allocateVariable(node.name, elements.length);
      for (let i = 0; i < elements.length; i++) {
        this.genExpression(elements[i], 'R0');
        const elemAddr = `[0x${(addr + i).toString(16).toUpperCase()}]`;
        this.emit('STORE', [elemAddr, 'R0'], node.line, `Init ${node.name}[${i}]`);
      }
    } else if (node.isArray) {
      const size = node.arraySize || 4;
      this.allocateVariable(node.name, size);
    } else {
      const addr = this.allocateVariable(node.name, 1);
      if (node.init) {
        this.genExpression(node.init, 'R0');
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit('STORE', [memRef, 'R0'], node.line, `Init variable '${node.name}'`);
      } else {
        // Default init to 0
        this.emit('MOV', ['R0', '0'], node.line, `Init '${node.name}' to 0`);
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit('STORE', [memRef, 'R0'], node.line);
      }
    }
  }

  private genAssignmentStatement(node: AssignmentStatementNode): void {
    if (node.indexExpr) {
      // Array element assignment: arr[idx] = val
      const baseAddr = this.variables.get(node.target);
      if (baseAddr === undefined) {
        throw new Error(`Unknown array '${node.target}' at line ${node.line}`);
      }
      // Compute value into R0
      this.genExpression(node.value, 'R0');
      this.emit('PUSH', ['R0'], node.line, 'Save value on stack');

      // Compute index into R1
      this.genExpression(node.indexExpr, 'R1');
      // Add base address: R1 = R1 + baseAddr
      this.emit('ADD', ['R1', baseAddr.toString()], node.line, `Compute &${node.target}[idx]`);
      // Restore value into R0
      this.emit('POP', ['R0'], node.line, 'Restore value');
      // Indirect store: STORE [R1], R0
      this.emit('STORE', ['[R1]', 'R0'], node.line, `Store to ${node.target}[idx]`);
    } else {
      // Simple variable assignment: x = val
      const addr = this.variables.get(node.target);
      if (addr === undefined) {
        // Auto-allocate if not declared with let
        const newAddr = this.allocateVariable(node.target, 1);
        this.genExpression(node.value, 'R0');
        const memRef = `[0x${newAddr.toString(16).toUpperCase()}]`;
        this.emit('STORE', [memRef, 'R0'], node.line, `Assign '${node.target}'`);
      } else {
        this.genExpression(node.value, 'R0');
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit('STORE', [memRef, 'R0'], node.line, `Assign '${node.target}'`);
      }
    }
  }

  private genIfStatement(node: IfStatementNode): void {
    const falseLabel = this.uniqueLabel('if_false');
    const endLabel = this.uniqueLabel('if_end');

    this.genCondition(node.condition, falseLabel);

    // Consequent block
    for (const stmt of node.consequent.body) {
      this.genStatement(stmt);
    }

    if (node.alternate) {
      this.emit('JMP', [endLabel], node.line, 'Skip else branch', endLabel);
      this.markLabel(falseLabel);
      for (const stmt of node.alternate.body) {
        this.genStatement(stmt);
      }
      this.markLabel(endLabel);
    } else {
      this.markLabel(falseLabel);
    }
  }

  private genWhileStatement(node: WhileStatementNode): void {
    const loopStart = this.uniqueLabel('while_start');
    const loopEnd = this.uniqueLabel('while_end');

    this.markLabel(loopStart);
    this.genCondition(node.condition, loopEnd);

    for (const stmt of node.body.body) {
      this.genStatement(stmt);
    }

    this.emit('JMP', [loopStart], node.line, 'Repeat while loop', loopStart);
    this.markLabel(loopEnd);
  }

  private genForStatement(node: ForStatementNode): void {
    const loopStart = this.uniqueLabel('for_start');
    const loopEnd = this.uniqueLabel('for_end');

    // 1. Initializer
    if (node.init) {
      if (node.init.type === 'VariableDeclaration') {
        this.genVariableDeclaration(node.init);
      } else {
        this.genAssignmentStatement(node.init);
      }
    }

    // 2. Loop start & condition
    this.markLabel(loopStart);
    if (node.condition) {
      this.genCondition(node.condition, loopEnd);
    }

    // 3. Loop body
    for (const stmt of node.body.body) {
      this.genStatement(stmt);
    }

    // 4. Update
    if (node.update) {
      this.genAssignmentStatement(node.update);
    }

    // 5. Jump back to condition
    this.emit('JMP', [loopStart], node.line, 'Repeat for loop', loopStart);
    this.markLabel(loopEnd);
  }

  private genFunctionDeclaration(node: FunctionDeclarationNode): void {
    const funcLabel = `func_${node.name}`;
    const epilogueLabel = `epilogue_${node.name}`;
    this.markLabel(funcLabel);
    this.currentFunction = node.name;
    this.functionEpilogues.set(node.name, epilogueLabel);

    // Pre-allocate parameters so they are valid variable identifiers in the function
    for (const p of node.params) {
      this.allocateVariable(p, 1);
    }

    // Function Prologue: save BP, set BP = SP
    this.emit('PUSH', ['BP'], node.line, 'Save old base pointer');
    this.emit('MOV', ['BP', 'SP'], node.line, 'Set BP = SP');

    // Function body
    for (const stmt of node.body.body) {
      this.genStatement(stmt);
    }

    // Function Epilogue
    this.markLabel(epilogueLabel);
    this.emit('MOV', ['SP', 'BP'], node.line, 'Restore SP');
    this.emit('POP', ['BP'], node.line, 'Restore BP');
    this.emit('RET', [], node.line, 'Return to caller');

    this.currentFunction = null;
  }

  private genReturnStatement(node: ReturnStatementNode): void {
    if (node.argument) {
      this.genExpression(node.argument, 'R0');
    }
    if (this.currentFunction) {
      const epilogue = this.functionEpilogues.get(this.currentFunction)!;
      this.emit('JMP', [epilogue], node.line, 'Jump to return epilogue', epilogue);
    } else {
      this.emit('HLT', [], node.line, 'Return from main program');
    }
  }

  private genExpressionStatement(node: ExpressionStatementNode): void {
    this.genExpression(node.expression, 'R0');
  }

  // --- Condition Generation ---
  private genCondition(expr: ExpressionNode, falseLabel: string): void {
    if (expr.type === 'BinaryExpression') {
      const bin = expr as BinaryExpressionNode;
      const op = bin.operator;

      if (['==', '!=', '<', '<=', '>', '>='].includes(op)) {
        this.genExpression(bin.left, 'R0');
        this.genExpression(bin.right, 'R1');
        this.emit('CMP', ['R0', 'R1'], expr.line, `Compare ${op}`);

        // Branch to falseLabel if condition is NOT met
        switch (op) {
          case '==':
            this.emit('JNZ', [falseLabel], expr.line, 'Jump if not equal', falseLabel);
            break;
          case '!=':
            this.emit('JZ', [falseLabel], expr.line, 'Jump if equal', falseLabel);
            break;
          case '<':
            this.emit('JGE', [falseLabel], expr.line, 'Jump if >= (not <)', falseLabel);
            break;
          case '<=':
            this.emit('JG', [falseLabel], expr.line, 'Jump if > (not <=)', falseLabel);
            break;
          case '>':
            this.emit('JLE', [falseLabel], expr.line, 'Jump if <= (not >)', falseLabel);
            break;
          case '>=':
            this.emit('JL', [falseLabel], expr.line, 'Jump if < (not >=)', falseLabel);
            break;
        }
        return;
      }
    }

    // Default: evaluate expr into R0 and test if zero
    this.genExpression(expr, 'R0');
    this.emit('CMP', ['R0', '0'], expr.line, 'Test truthiness');
    this.emit('JZ', [falseLabel], expr.line, 'Jump if falsy', falseLabel);
  }

  // --- Expression Generation ---
  private genExpression(expr: ExpressionNode, targetReg: string = 'R0'): void {
    switch (expr.type) {
      case 'Literal': {
        const lit = expr as LiteralNode;
        this.emit('MOV', [targetReg, lit.value.toString()], expr.line, `Load ${lit.value}`);
        break;
      }
      case 'Identifier': {
        const id = expr as IdentifierNode;
        const addr = this.variables.get(id.name);
        if (addr === undefined) {
          throw new Error(`Undefined variable '${id.name}' at line ${expr.line}`);
        }
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit('LOAD', [targetReg, memRef], expr.line, `Read '${id.name}'`);
        break;
      }
      case 'ArrayAccess': {
        const acc = expr as ArrayAccessNode;
        const baseAddr = this.variables.get(acc.arrayName);
        if (baseAddr === undefined) {
          throw new Error(`Undefined array '${acc.arrayName}' at line ${expr.line}`);
        }
        // Calculate index in R2
        this.genExpression(acc.index, 'R2');
        this.emit('ADD', ['R2', baseAddr.toString()], expr.line, `Offset for ${acc.arrayName}[i]`);
        // Indirect load: LOAD targetReg, [R2]
        this.emit('LOAD', [targetReg, '[R2]'], expr.line, `Read ${acc.arrayName}[i]`);
        break;
      }
      case 'BinaryExpression': {
        const bin = expr as BinaryExpressionNode;
        // Evaluate left into R0, right into R1
        this.genExpression(bin.left, 'R0');
        this.emit('PUSH', ['R0'], expr.line, 'Preserve left operand');
        this.genExpression(bin.right, 'R1');
        this.emit('POP', ['R0'], expr.line, 'Restore left operand');

        switch (bin.operator) {
          case '+':
            this.emit('ADD', ['R0', 'R1'], expr.line, 'ALU: R0 + R1');
            break;
          case '-':
            this.emit('SUB', ['R0', 'R1'], expr.line, 'ALU: R0 - R1');
            break;
          case '*':
            this.emit('MUL', ['R0', 'R1'], expr.line, 'ALU: R0 * R1');
            break;
          case '/':
            this.emit('DIV', ['R0', 'R1'], expr.line, 'ALU: R0 / R1');
            break;
          case '%':
            this.emit('MOD', ['R0', 'R1'], expr.line, 'ALU: R0 % R1');
            break;
          case '&':
            this.emit('AND', ['R0', 'R1'], expr.line, 'ALU: R0 & R1');
            break;
          case '|':
            this.emit('OR', ['R0', 'R1'], expr.line, 'ALU: R0 | R1');
            break;
          case '^':
            this.emit('XOR', ['R0', 'R1'], expr.line, 'ALU: R0 ^ R1');
            break;
          case '<<':
            this.emit('SHL', ['R0', 'R1'], expr.line, 'ALU: R0 << R1');
            break;
          case '>>':
            this.emit('SHR', ['R0', 'R1'], expr.line, 'ALU: R0 >> R1');
            break;
          default:
            throw new Error(`Unsupported binary operator ${bin.operator} at line ${expr.line}`);
        }

        if (targetReg !== 'R0') {
          this.emit('MOV', [targetReg, 'R0'], expr.line);
        }
        break;
      }
      case 'UnaryExpression': {
        const un = expr as UnaryExpressionNode;
        this.genExpression(un.argument, 'R0');
        if (un.operator === '-') {
          // Negate: R1 = 0; SUB R1, R0; MOV R0, R1
          this.emit('MOV', ['R1', '0'], expr.line);
          this.emit('SUB', ['R1', 'R0'], expr.line);
          this.emit('MOV', ['R0', 'R1'], expr.line, 'Negate value');
        } else if (un.operator === '!') {
          this.emit('NOT', ['R0'], expr.line, 'Logical NOT');
        }
        if (targetReg !== 'R0') {
          this.emit('MOV', [targetReg, 'R0'], expr.line);
        }
        break;
      }
      case 'StringLiteral': {
        this.emit('MOV', [targetReg, '0'], expr.line, 'String pointer');
        break;
      }
      case 'FunctionCall': {
        const call = expr as FunctionCallNode;
        if (['print', 'printf', 'puts', 'console.log'].includes(call.callee)) {
          if (call.arguments.length > 0) {
            let argToPrint = call.arguments[0];
            // In C: printf("%d\n", sum) -> print the 2nd argument!
            if (
              call.callee === 'printf' &&
              call.arguments.length >= 2 &&
              call.arguments[0].type === 'StringLiteral'
            ) {
              argToPrint = call.arguments[1];
            }

            if (argToPrint.type === 'StringLiteral') {
              const text = (argToPrint as StringLiteralNode).value;
              this.emit('PRINT', [`"${text}"`], expr.line, 'Print string output');
            } else {
              this.genExpression(argToPrint, 'R0');
              this.emit('PRINT', ['R0'], expr.line, 'Output to console');
            }
          }
        } else {
          // Check if callee is a declared function with parameters
          const targetFunc = this.functionDeclarations.get(call.callee);
          if (targetFunc && targetFunc.params.length > 0) {
            // Evaluate all arguments first and push to stack to prevent clobbering
            for (let i = 0; i < call.arguments.length; i++) {
              this.genExpression(call.arguments[i], 'R0');
              this.emit('PUSH', ['R0'], expr.line, `Eval arg ${i}`);
            }
            // Pop in reverse order and store into parameter memory locations
            for (let i = call.arguments.length - 1; i >= 0; i--) {
              const paramName = targetFunc.params[i];
              if (paramName) {
                const pAddr = this.allocateVariable(paramName, 1);
                this.emit('POP', ['R0'], expr.line, `Assign arg '${paramName}'`);
                this.emit(
                  'STORE',
                  [`[0x${pAddr.toString(16).toUpperCase()}]`, 'R0'],
                  expr.line
                );
              } else {
                this.emit('POP', ['R0'], expr.line);
              }
            }
          } else {
            // Push arguments in reverse order
            for (let i = call.arguments.length - 1; i >= 0; i--) {
              this.genExpression(call.arguments[i], 'R0');
              this.emit('PUSH', ['R0'], expr.line, `Push arg ${i}`);
            }
          }

          const funcLabel = `func_${call.callee}`;
          this.emit('CALL', [funcLabel], expr.line, `Call ${call.callee}`, funcLabel);

          if (targetReg !== 'R0') {
            this.emit('MOV', [targetReg, 'R0'], expr.line);
          }
        }
        break;
      }
    }
  }

  private getOpcodeBinary(op: Opcode): number {
    const table: Record<Opcode, number> = {
      NOP: 0x00,
      MOV: 0x01,
      LOAD: 0x02,
      STORE: 0x03,
      ADD: 0x04,
      SUB: 0x05,
      MUL: 0x06,
      DIV: 0x07,
      MOD: 0x08,
      AND: 0x09,
      OR: 0x0A,
      XOR: 0x0B,
      NOT: 0x0C,
      SHL: 0x0D,
      SHR: 0x0E,
      CMP: 0x0F,
      JMP: 0x10,
      JZ: 0x11,
      JNZ: 0x12,
      JL: 0x13,
      JG: 0x14,
      JLE: 0x15,
      JGE: 0x16,
      PUSH: 0x17,
      POP: 0x18,
      CALL: 0x19,
      RET: 0x1A,
      PRINT: 0x1B,
      HLT: 0xFF
    };
    return table[op] ?? 0;
  }
}
