export class Parser {
  tokens;
  current = 0;
  constructor(tokens) {
    this.tokens = tokens;
  }
  peek() {
    return this.tokens[this.current] || { type: "EOF", value: "", line: -1, column: -1 };
  }
  previous() {
    return this.tokens[this.current - 1];
  }
  isAtEnd() {
    return this.peek().type === "EOF";
  }
  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  check(type, value) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== void 0 && token.value !== value) return false;
    return true;
  }
  match(type, value) {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }
  consume(type, value, message) {
    if (this.check(type, value)) {
      return this.advance();
    }
    const current = this.peek();
    const prev = this.previous();
    const isSemicolonMissingOnPrevLine = value === ";" && prev && (current.type === "EOF" || current.line > prev.line);
    const errLine = isSemicolonMissingOnPrevLine ? prev.line : current.line > 0 ? current.line : prev?.line ?? 1;
    const errCol = isSemicolonMissingOnPrevLine ? prev.column + (prev.value?.length || 1) : Math.max(1, current.column);
    const desc = message || `Expected '${value || type}' but got '${current.value}'`;
    throw new Error(`${desc} at line ${errLine}, col ${errCol}`);
  }
  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      if (this.match("PUNCTUATION", ";")) continue;
      statements.push(this.statement());
    }
    return {
      type: "Program",
      line: statements.length > 0 ? statements[0].line : 1,
      body: statements
    };
  }
  statement() {
    const token = this.peek();
    if (token.type === "TYPE" || token.type === "KEYWORD" && ["let", "var", "const"].includes(token.value)) {
      return this.typeOrVarOrFunctionDeclaration();
    }
    if (token.type === "KEYWORD") {
      if (token.value === "function") {
        return this.functionDeclaration();
      }
      if (token.value === "if") {
        return this.ifStatement();
      }
      if (token.value === "while") {
        return this.whileStatement();
      }
      if (token.value === "for") {
        return this.forStatement();
      }
      if (token.value === "return") {
        return this.returnStatement();
      }
      if (token.value === "print" || token.value === "printf" || token.value === "puts") {
        return this.printOrPrintfStatement();
      }
    }
    if (this.check("PUNCTUATION", "{")) {
      return this.block();
    }
    return this.assignmentOrExpressionStatement();
  }
  // Handles:
  // int main() { ... }
  // int add(int a, int b) { ... }
  // int x = 10;
  // int arr[5];
  // int arr[] = {1, 2, 3};
  // let x = 5;
  typeOrVarOrFunctionDeclaration() {
    const typeToken = this.advance();
    let varType = typeToken.value;
    while (this.match("OPERATOR", "*")) {
      varType += "*";
    }
    let nameToken;
    if (this.check("IDENTIFIER") || this.check("KEYWORD") && this.peek().value === "main") {
      nameToken = this.advance();
    } else {
      throw new Error(`Expected identifier after type '${varType}' at line ${typeToken.line}`);
    }
    if (this.check("PUNCTUATION", "(")) {
      return this.finishFunctionDeclaration(nameToken.value, typeToken.line, varType);
    }
    const declarations = [];
    const parseDeclarator = (vName) => {
      let isArr = false;
      let arrSize = void 0;
      if (this.match("PUNCTUATION", "[")) {
        isArr = true;
        if (this.check("NUMBER")) {
          arrSize = parseInt(this.advance().value, 10);
        }
        this.consume("PUNCTUATION", "]", "Expected ']' in array declaration");
      }
      let vInit = null;
      if (this.match("PUNCTUATION", "=")) {
        if (this.match("PUNCTUATION", "{")) {
          const elements = [];
          if (!this.check("PUNCTUATION", "}")) {
            do {
              elements.push(this.expression());
            } while (this.match("PUNCTUATION", ","));
          }
          this.consume("PUNCTUATION", "}", "Expected '}' after array initializer");
          isArr = true;
          arrSize = elements.length;
          vInit = {
            type: "ArrayLiteral",
            line: typeToken.line,
            elements
          };
        } else {
          vInit = this.expression();
          if (vInit.type === "ArrayLiteral") {
            isArr = true;
            arrSize = vInit.elements.length;
          }
        }
      }
      return {
        type: "VariableDeclaration",
        line: typeToken.line,
        name: vName,
        init: vInit,
        isArray: isArr,
        arraySize: arrSize,
        varType
      };
    };
    declarations.push(parseDeclarator(nameToken.value));
    while (this.match("PUNCTUATION", ",")) {
      if (this.check("IDENTIFIER")) {
        const nextName = this.advance();
        declarations.push(parseDeclarator(nextName.value));
      } else {
        break;
      }
    }
    if (this.check("IDENTIFIER") && this.peek().line === typeToken.line) {
      const extra = this.peek();
      throw new Error(
        `Unexpected identifier '${extra.value}' \u2014 missing ',' between variable declarations at line ${extra.line}, col ${extra.column}`
      );
    }
    this.consume("PUNCTUATION", ";", "Expected ';' after variable declaration");
    if (declarations.length === 1) {
      return declarations[0];
    }
    return {
      type: "Block",
      line: typeToken.line,
      body: declarations
    };
  }
  finishFunctionDeclaration(name, line, returnType) {
    this.consume("PUNCTUATION", "(", "Expected '(' after function name");
    const params = [];
    if (!this.check("PUNCTUATION", ")")) {
      if (this.check("TYPE", "void") && this.tokens[this.current + 1]?.value === ")") {
        this.advance();
      } else {
        do {
          if (this.peek().type === "TYPE") {
            this.advance();
            while (this.match("OPERATOR", "*")) {
            }
          }
          const paramToken = this.consume("IDENTIFIER", void 0, "Expected parameter name");
          if (this.match("PUNCTUATION", "[")) {
            this.match("PUNCTUATION", "]");
          }
          params.push(paramToken.value);
        } while (this.match("PUNCTUATION", ","));
      }
    }
    if (this.check("TYPE") || this.check("IDENTIFIER")) {
      const extra = this.peek();
      throw new Error(
        `Unexpected parameter '${extra.value}' \u2014 missing ',' between function parameters at line ${extra.line}, col ${extra.column}`
      );
    }
    this.consume("PUNCTUATION", ")", "Expected ')' after parameters");
    const body = this.block();
    return {
      type: "FunctionDeclaration",
      line,
      name,
      returnType,
      params,
      body
    };
  }
  functionDeclaration() {
    const funcToken = this.advance();
    const nameToken = this.consume("IDENTIFIER", void 0, "Expected function name");
    return this.finishFunctionDeclaration(nameToken.value, funcToken.line);
  }
  assignmentOrExpressionStatement(requireSemicolon = true) {
    const startToken = this.peek();
    if (this.check("OPERATOR", "++") || this.check("OPERATOR", "--")) {
      const op = this.advance().value;
      const targetToken = this.consume("IDENTIFIER", void 0, "Expected variable after increment/decrement");
      if (requireSemicolon) {
        this.consume("PUNCTUATION", ";", "Expected ';' after increment/decrement");
      }
      return {
        type: "AssignmentStatement",
        line: startToken.line,
        target: targetToken.value,
        value: {
          type: "BinaryExpression",
          line: startToken.line,
          operator: op === "++" ? "+" : "-",
          left: { type: "Identifier", line: startToken.line, name: targetToken.value },
          right: { type: "Literal", line: startToken.line, value: 1, raw: "1" }
        }
      };
    }
    if (this.check("IDENTIFIER")) {
      const idToken = this.advance();
      if (this.match("OPERATOR", "++") || this.match("OPERATOR", "--")) {
        const op = this.previous().value;
        if (requireSemicolon) {
          this.consume("PUNCTUATION", ";", "Expected ';' after increment/decrement");
        }
        return {
          type: "AssignmentStatement",
          line: idToken.line,
          target: idToken.value,
          value: {
            type: "BinaryExpression",
            line: idToken.line,
            operator: op === "++" ? "+" : "-",
            left: { type: "Identifier", line: idToken.line, name: idToken.value },
            right: { type: "Literal", line: idToken.line, value: 1, raw: "1" }
          }
        };
      }
      if (["+=", "-=", "*=", "/=", "%="].includes(this.peek().value)) {
        const compoundOp = this.advance().value;
        const binaryOp = compoundOp[0];
        const valExpr = this.expression();
        if (requireSemicolon) {
          this.consume("PUNCTUATION", ";", "Expected ';' after assignment");
        }
        return {
          type: "AssignmentStatement",
          line: idToken.line,
          target: idToken.value,
          value: {
            type: "BinaryExpression",
            line: idToken.line,
            operator: binaryOp,
            left: { type: "Identifier", line: idToken.line, name: idToken.value },
            right: valExpr
          }
        };
      }
      if (this.match("PUNCTUATION", "=")) {
        const value = this.expression();
        if (requireSemicolon) {
          this.consume("PUNCTUATION", ";", "Expected ';' after assignment");
        }
        return {
          type: "AssignmentStatement",
          line: idToken.line,
          target: idToken.value,
          value
        };
      }
      if (this.match("PUNCTUATION", "[")) {
        const indexExpr = this.expression();
        this.consume("PUNCTUATION", "]", "Expected ']' after array index");
        this.consume("PUNCTUATION", "=", "Expected '=' in array assignment");
        const value = this.expression();
        if (requireSemicolon) {
          this.consume("PUNCTUATION", ";", "Expected ';' after array assignment");
        }
        return {
          type: "AssignmentStatement",
          line: idToken.line,
          target: idToken.value,
          indexExpr,
          value
        };
      }
      if (this.match("PUNCTUATION", "(")) {
        const args = [];
        if (!this.check("PUNCTUATION", ")")) {
          do {
            args.push(this.expression());
          } while (this.match("PUNCTUATION", ","));
        }
        this.consume("PUNCTUATION", ")", "Expected ')' after function arguments");
        if (requireSemicolon) {
          this.consume("PUNCTUATION", ";", "Expected ';' after function call");
        }
        return {
          type: "ExpressionStatement",
          line: idToken.line,
          expression: {
            type: "FunctionCall",
            line: idToken.line,
            callee: idToken.value,
            arguments: args
          }
        };
      }
      this.current--;
    }
    const expr = this.expression();
    if (requireSemicolon) {
      this.consume("PUNCTUATION", ";", "Expected ';' after expression statement");
    }
    return {
      type: "ExpressionStatement",
      line: startToken.line,
      expression: expr
    };
  }
  ifStatement() {
    const ifToken = this.advance();
    this.consume("PUNCTUATION", "(", "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume("PUNCTUATION", ")", "Expected ')' after if condition");
    const consequent = this.blockOrSingleStatement();
    let alternate = null;
    if (this.match("KEYWORD", "else")) {
      if (this.check("KEYWORD", "if")) {
        const nestedIf = this.ifStatement();
        alternate = {
          type: "Block",
          line: nestedIf.line,
          body: [nestedIf]
        };
      } else {
        alternate = this.blockOrSingleStatement();
      }
    }
    return {
      type: "IfStatement",
      line: ifToken.line,
      condition,
      consequent,
      alternate
    };
  }
  whileStatement() {
    const whileToken = this.advance();
    this.consume("PUNCTUATION", "(", "Expected '(' after 'while'");
    const condition = this.expression();
    this.consume("PUNCTUATION", ")", "Expected ')' after while condition");
    const body = this.blockOrSingleStatement();
    return {
      type: "WhileStatement",
      line: whileToken.line,
      condition,
      body
    };
  }
  forStatement() {
    const forToken = this.advance();
    this.consume("PUNCTUATION", "(", "Expected '(' after 'for'");
    let init = null;
    if (!this.match("PUNCTUATION", ";")) {
      if (this.check("TYPE") || this.check("KEYWORD") && ["let", "var", "const"].includes(this.peek().value)) {
        const decl = this.typeOrVarOrFunctionDeclaration();
        if (decl.type === "VariableDeclaration") {
          init = decl;
        }
      } else {
        const stmt = this.assignmentOrExpressionStatement();
        if (stmt.type === "AssignmentStatement") {
          init = stmt;
        }
      }
    }
    let condition = null;
    if (!this.check("PUNCTUATION", ";")) {
      condition = this.expression();
    }
    this.consume("PUNCTUATION", ";", "Expected ';' after for loop condition");
    let update = null;
    if (!this.check("PUNCTUATION", ")")) {
      const stmt = this.assignmentOrExpressionStatement(false);
      if (stmt.type === "AssignmentStatement") {
        update = stmt;
      }
    }
    this.consume("PUNCTUATION", ")", "Expected ')' after for clauses");
    const body = this.blockOrSingleStatement();
    return {
      type: "ForStatement",
      line: forToken.line,
      init,
      condition,
      update,
      body
    };
  }
  returnStatement() {
    const returnToken = this.advance();
    let argument = null;
    if (!this.check("PUNCTUATION", ";") && !this.check("PUNCTUATION", "}")) {
      argument = this.expression();
    }
    this.consume("PUNCTUATION", ";", "Expected ';' after return statement");
    return {
      type: "ReturnStatement",
      line: returnToken.line,
      argument
    };
  }
  // Handles:
  // print(x);
  // printf("%d\n", sum);
  // printf("Hello World");
  // puts("Hello");
  printOrPrintfStatement() {
    const printToken = this.advance();
    this.consume("PUNCTUATION", "(", "Expected '(' after print/printf");
    const args = [];
    if (!this.check("PUNCTUATION", ")")) {
      do {
        args.push(this.expression());
      } while (this.match("PUNCTUATION", ","));
    }
    this.consume("PUNCTUATION", ")", "Expected ')' after print arguments");
    this.consume("PUNCTUATION", ";", "Expected ';' after print statement");
    if (printToken.value === "printf" && args.length >= 2 && args[0].type === "StringLiteral") {
      if (args.length > 2) {
        const body = [];
        for (let i = 1; i < args.length; i++) {
          body.push({
            type: "ExpressionStatement",
            line: printToken.line,
            expression: {
              type: "FunctionCall",
              line: printToken.line,
              callee: "print",
              arguments: [args[i]]
            }
          });
        }
        return {
          type: "Block",
          line: printToken.line,
          body
        };
      } else {
        return {
          type: "ExpressionStatement",
          line: printToken.line,
          expression: {
            type: "FunctionCall",
            line: printToken.line,
            callee: "print",
            arguments: [args[1]]
          }
        };
      }
    }
    const actualArg = args[0] || {
      type: "Literal",
      line: printToken.line,
      value: 0,
      raw: "0"
    };
    return {
      type: "ExpressionStatement",
      line: printToken.line,
      expression: {
        type: "FunctionCall",
        line: printToken.line,
        callee: "print",
        arguments: [actualArg]
      }
    };
  }
  blockOrSingleStatement() {
    if (this.check("PUNCTUATION", "{")) {
      return this.block();
    }
    const stmt = this.statement();
    return {
      type: "Block",
      line: stmt.line,
      body: [stmt]
    };
  }
  block() {
    const openBrace = this.consume("PUNCTUATION", "{", "Expected '{' to start block");
    const statements = [];
    while (!this.check("PUNCTUATION", "}") && !this.isAtEnd()) {
      if (this.match("PUNCTUATION", ";")) continue;
      statements.push(this.statement());
    }
    this.consume("PUNCTUATION", "}", "Expected '}' to close block");
    return {
      type: "Block",
      line: openBrace.line,
      body: statements
    };
  }
  // --- Expressions & Precedence Parsing ---
  expression() {
    const expr = this.logicalOr();
    while (!this.isAtEnd()) {
      const next = this.peek();
      const prev = this.previous();
      const lastLine = prev ? prev.line : expr.line;
      if (next.line > lastLine || next.type === "EOF") {
        break;
      }
      if (next.type === "PUNCTUATION" && [";", ",", ")", "]", "}", ":", "?"].includes(next.value)) {
        break;
      }
      if (next.type === "KEYWORD" || next.type === "TYPE") {
        break;
      }
      if (next.type === "IDENTIFIER" || next.type === "NUMBER" || next.type === "STRING") {
        const nextNext = this.tokens[this.current + 1];
        if (next.type === "IDENTIFIER" && nextNext && (nextNext.value === "=" || ["+=", "-=", "*=", "/=", "%="].includes(nextNext.value))) {
          throw new Error(
            `Expected ';' before '${next.value}' at line ${next.line}, col ${next.column}`
          );
        }
        const prevName = prev ? `'${prev.value}'` : "previous expression";
        throw new Error(
          `Unexpected ${next.type.toLowerCase()} '${next.value}' after expression \u2014 missing operator between ${prevName} and '${next.value}' at line ${next.line}, col ${next.column}`
        );
      }
      throw new Error(
        `Unexpected token '${next.value}' after expression at line ${next.line}, col ${next.column}`
      );
    }
    return expr;
  }
  logicalOr() {
    let expr = this.logicalAnd();
    while (this.match("OPERATOR", "||")) {
      const op = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  logicalAnd() {
    let expr = this.bitwiseOr();
    while (this.match("OPERATOR", "&&")) {
      const op = this.previous().value;
      const right = this.bitwiseOr();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  bitwiseOr() {
    let expr = this.bitwiseXor();
    while (this.match("OPERATOR", "|")) {
      const op = this.previous().value;
      const right = this.bitwiseXor();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  bitwiseXor() {
    let expr = this.bitwiseAnd();
    while (this.match("OPERATOR", "^")) {
      const op = this.previous().value;
      const right = this.bitwiseAnd();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  bitwiseAnd() {
    let expr = this.equality();
    while (this.match("OPERATOR", "&")) {
      const op = this.previous().value;
      const right = this.equality();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  equality() {
    let expr = this.comparison();
    while (this.match("OPERATOR", "==") || this.match("OPERATOR", "!=")) {
      const op = this.previous().value;
      const right = this.comparison();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  comparison() {
    let expr = this.shift();
    while (this.match("OPERATOR", "<") || this.match("OPERATOR", "<=") || this.match("OPERATOR", ">") || this.match("OPERATOR", ">=")) {
      const op = this.previous().value;
      const right = this.shift();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  shift() {
    let expr = this.term();
    while (this.match("OPERATOR", "<<") || this.match("OPERATOR", ">>")) {
      const op = this.previous().value;
      const right = this.term();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  term() {
    let expr = this.factor();
    while (this.match("OPERATOR", "+") || this.match("OPERATOR", "-")) {
      const op = this.previous().value;
      const right = this.factor();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  factor() {
    let expr = this.unary();
    while (this.match("OPERATOR", "*") || this.match("OPERATOR", "/") || this.match("OPERATOR", "%")) {
      const op = this.previous().value;
      const right = this.unary();
      expr = {
        type: "BinaryExpression",
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }
  unary() {
    if (this.match("OPERATOR", "+")) {
      return this.unary();
    }
    if (this.match("OPERATOR", "&")) {
      return this.unary();
    }
    if (this.match("OPERATOR", "!") || this.match("OPERATOR", "-")) {
      const op = this.previous().value;
      const argument = this.unary();
      return {
        type: "UnaryExpression",
        line: argument.line,
        operator: op,
        argument
      };
    }
    return this.primary();
  }
  primary() {
    if (this.check("STRING")) {
      const token = this.advance();
      return {
        type: "StringLiteral",
        line: token.line,
        value: token.value
      };
    }
    if (this.check("NUMBER")) {
      const token = this.advance();
      const val = token.value.startsWith("0x") || token.value.startsWith("0X") ? parseInt(token.value, 16) : parseInt(token.value, 10);
      return {
        type: "Literal",
        line: token.line,
        value: val,
        raw: token.value
      };
    }
    if (this.match("PUNCTUATION", "[") || this.match("PUNCTUATION", "{")) {
      const closeChar = this.previous().value === "[" ? "]" : "}";
      const elements = [];
      if (!this.check("PUNCTUATION", closeChar)) {
        do {
          elements.push(this.expression());
        } while (this.match("PUNCTUATION", ","));
      }
      this.consume("PUNCTUATION", closeChar, `Expected '${closeChar}' after array elements`);
      return {
        type: "ArrayLiteral",
        line: this.previous().line,
        elements
      };
    }
    if (this.check("IDENTIFIER") || this.check("KEYWORD") && ["print", "printf", "puts", "console", "main"].includes(this.peek().value)) {
      const idToken = this.advance();
      let name = idToken.value;
      if (name === "console" && this.match("PUNCTUATION", ".")) {
        const subId = this.consume("IDENTIFIER", void 0, "Expected 'log' after console.");
        name = `console.${subId.value}`;
      }
      if (this.match("PUNCTUATION", "(")) {
        const args = [];
        if (!this.check("PUNCTUATION", ")")) {
          do {
            args.push(this.expression());
          } while (this.match("PUNCTUATION", ","));
        }
        this.consume("PUNCTUATION", ")", "Expected ')' after function arguments");
        return {
          type: "FunctionCall",
          line: idToken.line,
          callee: name,
          arguments: args
        };
      }
      if (this.match("PUNCTUATION", "[")) {
        const index = this.expression();
        this.consume("PUNCTUATION", "]", "Expected ']' after index expression");
        return {
          type: "ArrayAccess",
          line: idToken.line,
          arrayName: name,
          index
        };
      }
      return {
        type: "Identifier",
        line: idToken.line,
        name
      };
    }
    if (this.match("PUNCTUATION", "(")) {
      const expr = this.expression();
      this.consume("PUNCTUATION", ")", "Expected ')' after expression");
      return expr;
    }
    const next = this.peek();
    const prev = this.previous();
    if (prev && prev.type === "OPERATOR") {
      const errLine = next.line > 0 ? next.line : prev.line;
      const errCol = next.column > 0 ? next.column : prev.column;
      throw new Error(
        `Expected expression after operator '${prev.value}' but got '${next.value || next.type}' at line ${errLine}, col ${errCol}`
      );
    }
    if (prev && prev.type === "PUNCTUATION" && prev.value === "=") {
      const errLine = next.line > 0 ? next.line : prev.line;
      const errCol = next.column > 0 ? next.column : prev.column;
      throw new Error(
        `Expected expression after '=' but got '${next.value || next.type}' at line ${errLine}, col ${errCol}`
      );
    }
    if (prev && prev.type === "PUNCTUATION" && prev.value === ",") {
      const errLine = next.line > 0 ? next.line : prev.line;
      const errCol = next.column > 0 ? next.column : prev.column;
      throw new Error(
        `Expected expression after ',' but got '${next.value || next.type}' at line ${errLine}, col ${errCol}`
      );
    }
    if (next.type === "PUNCTUATION" && next.value === ";") {
      throw new Error(
        `Expected expression before ';' at line ${next.line}, col ${next.column}`
      );
    }
    if (next.type === "PUNCTUATION" && next.value === ")") {
      throw new Error(
        `Expected expression before ')' at line ${next.line}, col ${next.column}`
      );
    }
    throw new Error(
      `Unexpected token '${next.value}' at line ${next.line}, column ${next.column}`
    );
  }
}
