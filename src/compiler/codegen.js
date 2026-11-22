export class CodeGenerator {
  instructions = [];
  labels = /* @__PURE__ */ new Map();
  labelCounter = 0;
  // Memory layout:
  // 0x00 - 0x7F: Code segment (128 words)
  // 0x80 - 0xCF: Data segment (80 words)
  // 0xD0 - 0xFF: Stack segment (48 words, grows down from 0xFF)
  dataSegmentStart = 128;
  currentDataAddr = 128;
  variables = /* @__PURE__ */ new Map();
  varSizes = /* @__PURE__ */ new Map();
  functions = /* @__PURE__ */ new Map();
  functionDeclarations = /* @__PURE__ */ new Map();
  currentFunction = null;
  functionEpilogues = /* @__PURE__ */ new Map();
  sourceMap = {};
  reverseSourceMap = {};
  uniqueLabel(prefix = "L") {
    return `${prefix}_${this.labelCounter++}`;
  }
  emit(opcode, operands, sourceLine, comment, targetLabel) {
    const rawText = `${opcode.padEnd(5)} ${operands.join(", ")}`;
    this.instructions.push({
      opcode,
      operands,
      rawText,
      sourceLine,
      comment,
      targetLabel
    });
  }
  markLabel(label) {
    this.labels.set(label, this.instructions.length);
  }
  compile(ast) {
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
      for (const stmt of ast.body) {
        if (stmt.type === "FunctionDeclaration") {
          const fn = stmt;
          this.functionDeclarations.set(fn.name, fn);
        }
      }
      const mainFunc = ast.body.find(
        (s) => s.type === "FunctionDeclaration" && s.name === "main"
      );
      const hasFunctions = ast.body.some((s) => s.type === "FunctionDeclaration");
      const mainLabel = hasFunctions ? this.uniqueLabel("entry_start") : null;
      if (mainLabel) {
        this.emit("JMP", [mainLabel], 1, "Jump to program start", mainLabel);
      }
      for (const stmt of ast.body) {
        if (stmt.type === "FunctionDeclaration") {
          this.genFunctionDeclaration(stmt);
        }
      }
      if (mainLabel) {
        this.markLabel(mainLabel);
      }
      for (const stmt of ast.body) {
        if (stmt.type !== "FunctionDeclaration") {
          this.genStatement(stmt);
        }
      }
      if (mainFunc) {
        this.emit("CALL", ["func_main"], mainFunc.line, "Execute C main() function", "func_main");
      }
      this.emit("HLT", [], ast.line, "End of execution");
      const finalInstructions = [];
      for (let i = 0; i < this.instructions.length; i++) {
        const inst = this.instructions[i];
        const resolvedOperands = inst.operands.map((op) => {
          if (this.labels.has(op)) {
            return `0x${this.labels.get(op).toString(16).toUpperCase().padStart(2, "0")}`;
          }
          return op;
        });
        const address = i;
        const line = inst.sourceLine;
        if (line !== void 0) {
          if (!this.sourceMap[line]) this.sourceMap[line] = [];
          this.sourceMap[line].push(address);
          this.reverseSourceMap[address] = line;
        }
        const rawText = `${inst.opcode.padEnd(5)} ${resolvedOperands.join(", ")}`;
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
      const memoryInitial = [];
      for (let addr = 0; addr < 256; addr++) {
        let segment = "data";
        if (addr < 128) segment = "code";
        else if (addr >= 208) segment = "stack";
        let value = 0;
        let label = void 0;
        let sourceInstruction = void 0;
        if (addr < finalInstructions.length) {
          const inst = finalInstructions[addr];
          sourceInstruction = inst.rawText;
          value = this.getOpcodeBinary(inst.opcode);
        }
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
      const variableAddressesObj = {};
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
    } catch (err) {
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
  genStatement(stmt) {
    switch (stmt.type) {
      case "VariableDeclaration":
        this.genVariableDeclaration(stmt);
        break;
      case "AssignmentStatement":
        this.genAssignmentStatement(stmt);
        break;
      case "IfStatement":
        this.genIfStatement(stmt);
        break;
      case "WhileStatement":
        this.genWhileStatement(stmt);
        break;
      case "ForStatement":
        this.genForStatement(stmt);
        break;
      case "ReturnStatement":
        this.genReturnStatement(stmt);
        break;
      case "ExpressionStatement":
        this.genExpressionStatement(stmt);
        break;
      case "Block":
        for (const inner of stmt.body) {
          this.genStatement(inner);
        }
        break;
    }
  }
  allocateVariable(name, size = 1) {
    if (!this.variables.has(name)) {
      const addr = this.currentDataAddr;
      this.variables.set(name, addr);
      this.varSizes.set(name, size);
      this.currentDataAddr += size;
      return addr;
    }
    return this.variables.get(name);
  }
  genVariableDeclaration(node) {
    if (node.isArray && node.init && node.init.type === "ArrayLiteral") {
      const elements = node.init.elements;
      const addr = this.allocateVariable(node.name, elements.length);
      for (let i = 0; i < elements.length; i++) {
        this.genExpression(elements[i], "R0");
        const elemAddr = `[0x${(addr + i).toString(16).toUpperCase()}]`;
        this.emit("STORE", [elemAddr, "R0"], node.line, `Init ${node.name}[${i}]`);
      }
    } else if (node.isArray) {
      const size = node.arraySize || 4;
      this.allocateVariable(node.name, size);
    } else {
      const addr = this.allocateVariable(node.name, 1);
      if (node.init) {
        this.genExpression(node.init, "R0");
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit("STORE", [memRef, "R0"], node.line, `Init variable '${node.name}'`);
      } else {
        this.emit("MOV", ["R0", "0"], node.line, `Init '${node.name}' to 0`);
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit("STORE", [memRef, "R0"], node.line);
      }
    }
  }
  genAssignmentStatement(node) {
    if (node.indexExpr) {
      const baseAddr = this.variables.get(node.target);
      if (baseAddr === void 0) {
        throw new Error(`Unknown array '${node.target}' at line ${node.line}`);
      }
      this.genExpression(node.value, "R0");
      this.emit("PUSH", ["R0"], node.line, "Save value on stack");
      this.genExpression(node.indexExpr, "R1");
      this.emit("ADD", ["R1", baseAddr.toString()], node.line, `Compute &${node.target}[idx]`);
      this.emit("POP", ["R0"], node.line, "Restore value");
      this.emit("STORE", ["[R1]", "R0"], node.line, `Store to ${node.target}[idx]`);
    } else {
      const addr = this.variables.get(node.target);
      if (addr === void 0) {
        const newAddr = this.allocateVariable(node.target, 1);
        this.genExpression(node.value, "R0");
        const memRef = `[0x${newAddr.toString(16).toUpperCase()}]`;
        this.emit("STORE", [memRef, "R0"], node.line, `Assign '${node.target}'`);
      } else {
        this.genExpression(node.value, "R0");
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit("STORE", [memRef, "R0"], node.line, `Assign '${node.target}'`);
      }
    }
  }
  genIfStatement(node) {
    const falseLabel = this.uniqueLabel("if_false");
    const endLabel = this.uniqueLabel("if_end");
    this.genCondition(node.condition, falseLabel);
    for (const stmt of node.consequent.body) {
      this.genStatement(stmt);
    }
    if (node.alternate) {
      this.emit("JMP", [endLabel], node.line, "Skip else branch", endLabel);
      this.markLabel(falseLabel);
      for (const stmt of node.alternate.body) {
        this.genStatement(stmt);
      }
      this.markLabel(endLabel);
    } else {
      this.markLabel(falseLabel);
    }
  }
  genWhileStatement(node) {
    const loopStart = this.uniqueLabel("while_start");
    const loopEnd = this.uniqueLabel("while_end");
    this.markLabel(loopStart);
    this.genCondition(node.condition, loopEnd);
    for (const stmt of node.body.body) {
      this.genStatement(stmt);
    }
    this.emit("JMP", [loopStart], node.line, "Repeat while loop", loopStart);
    this.markLabel(loopEnd);
  }
  genForStatement(node) {
    const loopStart = this.uniqueLabel("for_start");
    const loopEnd = this.uniqueLabel("for_end");
    if (node.init) {
      if (node.init.type === "VariableDeclaration") {
        this.genVariableDeclaration(node.init);
      } else {
        this.genAssignmentStatement(node.init);
      }
    }
    this.markLabel(loopStart);
    if (node.condition) {
      this.genCondition(node.condition, loopEnd);
    }
    for (const stmt of node.body.body) {
      this.genStatement(stmt);
    }
    if (node.update) {
      this.genAssignmentStatement(node.update);
    }
    this.emit("JMP", [loopStart], node.line, "Repeat for loop", loopStart);
    this.markLabel(loopEnd);
  }
  genFunctionDeclaration(node) {
    const funcLabel = `func_${node.name}`;
    const epilogueLabel = `epilogue_${node.name}`;
    this.markLabel(funcLabel);
    this.currentFunction = node.name;
    this.functionEpilogues.set(node.name, epilogueLabel);
    for (const p of node.params) {
      this.allocateVariable(p, 1);
    }
    this.emit("PUSH", ["BP"], node.line, "Save old base pointer");
    this.emit("MOV", ["BP", "SP"], node.line, "Set BP = SP");
    for (const stmt of node.body.body) {
      this.genStatement(stmt);
    }
    this.markLabel(epilogueLabel);
    this.emit("MOV", ["SP", "BP"], node.line, "Restore SP");
    this.emit("POP", ["BP"], node.line, "Restore BP");
    this.emit("RET", [], node.line, "Return to caller");
    this.currentFunction = null;
  }
  genReturnStatement(node) {
    if (node.argument) {
      this.genExpression(node.argument, "R0");
    }
    if (this.currentFunction) {
      const epilogue = this.functionEpilogues.get(this.currentFunction);
      this.emit("JMP", [epilogue], node.line, "Jump to return epilogue", epilogue);
    } else {
      this.emit("HLT", [], node.line, "Return from main program");
    }
  }
  genExpressionStatement(node) {
    this.genExpression(node.expression, "R0");
  }
  // --- Condition Generation ---
  genCondition(expr, falseLabel) {
    if (expr.type === "BinaryExpression") {
      const bin = expr;
      const op = bin.operator;
      if (["==", "!=", "<", "<=", ">", ">="].includes(op)) {
        this.genExpression(bin.left, "R0");
        this.genExpression(bin.right, "R1");
        this.emit("CMP", ["R0", "R1"], expr.line, `Compare ${op}`);
        switch (op) {
          case "==":
            this.emit("JNZ", [falseLabel], expr.line, "Jump if not equal", falseLabel);
            break;
          case "!=":
            this.emit("JZ", [falseLabel], expr.line, "Jump if equal", falseLabel);
            break;
          case "<":
            this.emit("JGE", [falseLabel], expr.line, "Jump if >= (not <)", falseLabel);
            break;
          case "<=":
            this.emit("JG", [falseLabel], expr.line, "Jump if > (not <=)", falseLabel);
            break;
          case ">":
            this.emit("JLE", [falseLabel], expr.line, "Jump if <= (not >)", falseLabel);
            break;
          case ">=":
            this.emit("JL", [falseLabel], expr.line, "Jump if < (not >=)", falseLabel);
            break;
        }
        return;
      }
    }
    this.genExpression(expr, "R0");
    this.emit("CMP", ["R0", "0"], expr.line, "Test truthiness");
    this.emit("JZ", [falseLabel], expr.line, "Jump if falsy", falseLabel);
  }
  // --- Expression Generation ---
  genExpression(expr, targetReg = "R0") {
    switch (expr.type) {
      case "Literal": {
        const lit = expr;
        this.emit("MOV", [targetReg, lit.value.toString()], expr.line, `Load ${lit.value}`);
        break;
      }
      case "Identifier": {
        const id = expr;
        const addr = this.variables.get(id.name);
        if (addr === void 0) {
          throw new Error(`Undefined variable '${id.name}' at line ${expr.line}`);
        }
        const memRef = `[0x${addr.toString(16).toUpperCase()}]`;
        this.emit("LOAD", [targetReg, memRef], expr.line, `Read '${id.name}'`);
        break;
      }
      case "ArrayAccess": {
        const acc = expr;
        const baseAddr = this.variables.get(acc.arrayName);
        if (baseAddr === void 0) {
          throw new Error(`Undefined array '${acc.arrayName}' at line ${expr.line}`);
        }
        this.genExpression(acc.index, "R2");
        this.emit("ADD", ["R2", baseAddr.toString()], expr.line, `Offset for ${acc.arrayName}[i]`);
        this.emit("LOAD", [targetReg, "[R2]"], expr.line, `Read ${acc.arrayName}[i]`);
        break;
      }
      case "BinaryExpression": {
        const bin = expr;
        this.genExpression(bin.left, "R0");
        this.emit("PUSH", ["R0"], expr.line, "Preserve left operand");
        this.genExpression(bin.right, "R1");
        this.emit("POP", ["R0"], expr.line, "Restore left operand");
        switch (bin.operator) {
          case "+":
            this.emit("ADD", ["R0", "R1"], expr.line, "ALU: R0 + R1");
            break;
          case "-":
            this.emit("SUB", ["R0", "R1"], expr.line, "ALU: R0 - R1");
            break;
          case "*":
            this.emit("MUL", ["R0", "R1"], expr.line, "ALU: R0 * R1");
            break;
          case "/":
            this.emit("DIV", ["R0", "R1"], expr.line, "ALU: R0 / R1");
            break;
          case "%":
            this.emit("MOD", ["R0", "R1"], expr.line, "ALU: R0 % R1");
            break;
          case "&":
            this.emit("AND", ["R0", "R1"], expr.line, "ALU: R0 & R1");
            break;
          case "|":
            this.emit("OR", ["R0", "R1"], expr.line, "ALU: R0 | R1");
            break;
          case "^":
            this.emit("XOR", ["R0", "R1"], expr.line, "ALU: R0 ^ R1");
            break;
          case "<<":
            this.emit("SHL", ["R0", "R1"], expr.line, "ALU: R0 << R1");
            break;
          case ">>":
            this.emit("SHR", ["R0", "R1"], expr.line, "ALU: R0 >> R1");
            break;
          default:
            throw new Error(`Unsupported binary operator ${bin.operator} at line ${expr.line}`);
        }
        if (targetReg !== "R0") {
          this.emit("MOV", [targetReg, "R0"], expr.line);
        }
        break;
      }
      case "UnaryExpression": {
        const un = expr;
        this.genExpression(un.argument, "R0");
        if (un.operator === "-") {
          this.emit("MOV", ["R1", "0"], expr.line);
          this.emit("SUB", ["R1", "R0"], expr.line);
          this.emit("MOV", ["R0", "R1"], expr.line, "Negate value");
        } else if (un.operator === "!") {
          this.emit("NOT", ["R0"], expr.line, "Logical NOT");
        }
        if (targetReg !== "R0") {
          this.emit("MOV", [targetReg, "R0"], expr.line);
        }
        break;
      }
      case "StringLiteral": {
        this.emit("MOV", [targetReg, "0"], expr.line, "String pointer");
        break;
      }
      case "FunctionCall": {
        const call = expr;
        if (["print", "printf", "puts", "console.log"].includes(call.callee)) {
          if (call.arguments.length > 0) {
            let argToPrint = call.arguments[0];
            if (call.callee === "printf" && call.arguments.length >= 2 && call.arguments[0].type === "StringLiteral") {
              argToPrint = call.arguments[1];
            }
            if (argToPrint.type === "StringLiteral") {
              const text = argToPrint.value;
              this.emit("PRINT", [`"${text}"`], expr.line, "Print string output");
            } else {
              this.genExpression(argToPrint, "R0");
              this.emit("PRINT", ["R0"], expr.line, "Output to console");
            }
          }
        } else {
          const targetFunc = this.functionDeclarations.get(call.callee);
          if (targetFunc && targetFunc.params.length > 0) {
            for (let i = 0; i < call.arguments.length; i++) {
              this.genExpression(call.arguments[i], "R0");
              this.emit("PUSH", ["R0"], expr.line, `Eval arg ${i}`);
            }
            for (let i = call.arguments.length - 1; i >= 0; i--) {
              const paramName = targetFunc.params[i];
              if (paramName) {
                const pAddr = this.allocateVariable(paramName, 1);
                this.emit("POP", ["R0"], expr.line, `Assign arg '${paramName}'`);
                this.emit(
                  "STORE",
                  [`[0x${pAddr.toString(16).toUpperCase()}]`, "R0"],
                  expr.line
                );
              } else {
                this.emit("POP", ["R0"], expr.line);
              }
            }
          } else {
            for (let i = call.arguments.length - 1; i >= 0; i--) {
              this.genExpression(call.arguments[i], "R0");
              this.emit("PUSH", ["R0"], expr.line, `Push arg ${i}`);
            }
          }
          const funcLabel = `func_${call.callee}`;
          this.emit("CALL", [funcLabel], expr.line, `Call ${call.callee}`, funcLabel);
          if (targetReg !== "R0") {
            this.emit("MOV", [targetReg, "R0"], expr.line);
          }
        }
        break;
      }
    }
  }
  getOpcodeBinary(op) {
    const table = {
      NOP: 0,
      MOV: 1,
      LOAD: 2,
      STORE: 3,
      ADD: 4,
      SUB: 5,
      MUL: 6,
      DIV: 7,
      MOD: 8,
      AND: 9,
      OR: 10,
      XOR: 11,
      NOT: 12,
      SHL: 13,
      SHR: 14,
      CMP: 15,
      JMP: 16,
      JZ: 17,
      JNZ: 18,
      JL: 19,
      JG: 20,
      JLE: 21,
      JGE: 22,
      PUSH: 23,
      POP: 24,
      CALL: 25,
      RET: 26,
      PRINT: 27,
      HLT: 255
    };
    return table[op] ?? 0;
  }
}
