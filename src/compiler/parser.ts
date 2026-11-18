// Enhanced Parser for C and High-Level Simulation Language

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
  BlockNode,
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
import { Token } from './lexer';

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', line: -1, column: -1 };
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: string, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  private match(type: string, value?: string): boolean {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: string, value?: string, message?: string): Token {
    if (this.check(type, value)) {
      return this.advance();
    }
    const current = this.peek();
    const prev = this.previous();
    // If expecting a semicolon and the current token is on a subsequent line or at EOF,
    // the missing semicolon belongs at the end of the previous statement's line.
    const isSemicolonMissingOnPrevLine =
      value === ';' && prev && (current.type === 'EOF' || current.line > prev.line);
    const errLine = isSemicolonMissingOnPrevLine ? prev.line : (current.line > 0 ? current.line : (prev?.line ?? 1));
    const errCol = isSemicolonMissingOnPrevLine ? (prev.column + (prev.value?.length || 1)) : Math.max(1, current.column);
    const desc = message || `Expected '${value || type}' but got '${current.value}'`;
    throw new Error(`${desc} at line ${errLine}, col ${errCol}`);
  }

  public parse(): ProgramNode {
    const statements: StatementNode[] = [];
    while (!this.isAtEnd()) {
      // Ignore stray semicolons
      if (this.match('PUNCTUATION', ';')) continue;
      statements.push(this.statement());
    }
    return {
      type: 'Program',
      line: statements.length > 0 ? statements[0].line : 1,
      body: statements
    };
  }

  private statement(): StatementNode {
    const token = this.peek();

    // C Type or JS let/var/const declaration or function declaration
    if (token.type === 'TYPE' || (token.type === 'KEYWORD' && ['let', 'var', 'const'].includes(token.value))) {
      return this.typeOrVarOrFunctionDeclaration();
    }

    if (token.type === 'KEYWORD') {
      if (token.value === 'function') {
        return this.functionDeclaration();
      }
      if (token.value === 'if') {
        return this.ifStatement();
      }
      if (token.value === 'while') {
        return this.whileStatement();
      }
      if (token.value === 'for') {
        return this.forStatement();
      }
      if (token.value === 'return') {
        return this.returnStatement();
      }
      if (token.value === 'print' || token.value === 'printf' || token.value === 'puts') {
        return this.printOrPrintfStatement();
      }
    }

    if (this.check('PUNCTUATION', '{')) {
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
  private typeOrVarOrFunctionDeclaration(): StatementNode {
    const typeToken = this.advance(); // 'int', 'void', 'let', 'const', etc.
    let varType = typeToken.value;

    // Optional pointer stars e.g. int* or char*
    while (this.match('OPERATOR', '*')) {
      varType += '*';
    }

    // Name token
    let nameToken: Token;
    if (this.check('IDENTIFIER') || (this.check('KEYWORD') && this.peek().value === 'main')) {
      nameToken = this.advance();
    } else {
      throw new Error(`Expected identifier after type '${varType}' at line ${typeToken.line}`);
    }

    // Check if this is a function declaration: e.g. int main(...) or void foo(...)
    if (this.check('PUNCTUATION', '(')) {
      return this.finishFunctionDeclaration(nameToken.value, typeToken.line, varType);
    }

    const declarations: StatementNode[] = [];

    const parseDeclarator = (vName: string): VariableDeclarationNode => {
      let isArr = false;
      let arrSize: number | undefined = undefined;

      if (this.match('PUNCTUATION', '[')) {
        isArr = true;
        if (this.check('NUMBER')) {
          arrSize = parseInt(this.advance().value, 10);
        }
        this.consume('PUNCTUATION', ']', "Expected ']' in array declaration");
      }

      let vInit: ExpressionNode | null = null;
      if (this.match('PUNCTUATION', '=')) {
        if (this.match('PUNCTUATION', '{')) {
          const elements: ExpressionNode[] = [];
          if (!this.check('PUNCTUATION', '}')) {
            do {
              elements.push(this.expression());
            } while (this.match('PUNCTUATION', ','));
          }
          this.consume('PUNCTUATION', '}', "Expected '}' after array initializer");
          isArr = true;
          arrSize = elements.length;
          vInit = {
            type: 'ArrayLiteral',
            line: typeToken.line,
            elements
          };
        } else {
          vInit = this.expression();
          if (vInit.type === 'ArrayLiteral') {
            isArr = true;
            arrSize = (vInit as ArrayLiteralNode).elements.length;
          }
        }
      }

      return {
        type: 'VariableDeclaration',
        line: typeToken.line,
        name: vName,
        init: vInit,
        isArray: isArr,
        arraySize: arrSize,
        varType
      };
    };

    declarations.push(parseDeclarator(nameToken.value));

    while (this.match('PUNCTUATION', ',')) {
      if (this.check('IDENTIFIER')) {
        const nextName = this.advance();
        declarations.push(parseDeclarator(nextName.value));
      } else {
        break;
      }
    }

    if (this.check('IDENTIFIER') && this.peek().line === typeToken.line) {
      const extra = this.peek();
      throw new Error(
        `Unexpected identifier '${extra.value}' — missing ',' between variable declarations at line ${extra.line}, col ${extra.column}`
      );
    }

    this.consume('PUNCTUATION', ';', "Expected ';' after variable declaration");

    if (declarations.length === 1) {
      return declarations[0];
    }
    return {
      type: 'Block',
      line: typeToken.line,
      body: declarations
    };
  }

  private finishFunctionDeclaration(name: string, line: number, returnType?: string): FunctionDeclarationNode {
    this.consume('PUNCTUATION', '(', "Expected '(' after function name");
    const params: string[] = [];

    if (!this.check('PUNCTUATION', ')')) {
      // Check for void parameter list like main(void)
      if (this.check('TYPE', 'void') && this.tokens[this.current + 1]?.value === ')') {
        this.advance(); // consume 'void'
      } else {
        do {
          // Optional parameter type in C: int a
          if (this.peek().type === 'TYPE') {
            this.advance();
            // optional pointers e.g. char*
            while (this.match('OPERATOR', '*')) {}
          }
          const paramToken = this.consume('IDENTIFIER', undefined, 'Expected parameter name');
          // optional array syntax in param e.g. int arr[]
          if (this.match('PUNCTUATION', '[')) {
            this.match('PUNCTUATION', ']');
          }
          params.push(paramToken.value);
        } while (this.match('PUNCTUATION', ','));
      }
    }
    if (this.check('TYPE') || this.check('IDENTIFIER')) {
      const extra = this.peek();
      throw new Error(
        `Unexpected parameter '${extra.value}' — missing ',' between function parameters at line ${extra.line}, col ${extra.column}`
      );
    }
    this.consume('PUNCTUATION', ')', "Expected ')' after parameters");

    const body = this.block();

    return {
      type: 'FunctionDeclaration',
      line,
      name,
      returnType,
      params,
      body
    };
  }

  private functionDeclaration(): FunctionDeclarationNode {
    const funcToken = this.advance(); // 'function'
    const nameToken = this.consume('IDENTIFIER', undefined, 'Expected function name');
    return this.finishFunctionDeclaration(nameToken.value, funcToken.line);
  }

  private assignmentOrExpressionStatement(requireSemicolon: boolean = true): StatementNode {
    const startToken = this.peek();

    // Prefix increment / decrement: ++i; or --i;
    if (this.check('OPERATOR', '++') || this.check('OPERATOR', '--')) {
      const op = this.advance().value;
      const targetToken = this.consume('IDENTIFIER', undefined, 'Expected variable after increment/decrement');
      if (requireSemicolon) {
        this.consume('PUNCTUATION', ';', "Expected ';' after increment/decrement");
      }
      return {
        type: 'AssignmentStatement',
        line: startToken.line,
        target: targetToken.value,
        value: {
          type: 'BinaryExpression',
          line: startToken.line,
          operator: op === '++' ? '+' : '-',
          left: { type: 'Identifier', line: startToken.line, name: targetToken.value },
          right: { type: 'Literal', line: startToken.line, value: 1, raw: '1' }
        }
      };
    }

    // Identifier-based statements
    if (this.check('IDENTIFIER')) {
      const idToken = this.advance();

      // Postfix increment / decrement: i++; or i--;
      if (this.match('OPERATOR', '++') || this.match('OPERATOR', '--')) {
        const op = this.previous().value;
        if (requireSemicolon) {
          this.consume('PUNCTUATION', ';', "Expected ';' after increment/decrement");
        }
        return {
          type: 'AssignmentStatement',
          line: idToken.line,
          target: idToken.value,
          value: {
            type: 'BinaryExpression',
            line: idToken.line,
            operator: op === '++' ? '+' : '-',
            left: { type: 'Identifier', line: idToken.line, name: idToken.value },
            right: { type: 'Literal', line: idToken.line, value: 1, raw: '1' }
          }
        };
      }

      // Compound assignment: i += 5; i -= 2; i *= 3; i /= 2; i %= 4;
      if (['+=', '-=', '*=', '/=', '%='].includes(this.peek().value)) {
        const compoundOp = this.advance().value; // e.g. '+='
        const binaryOp = compoundOp[0]; // '+'
        const valExpr = this.expression();
        if (requireSemicolon) {
          this.consume('PUNCTUATION', ';', "Expected ';' after assignment");
        }
        return {
          type: 'AssignmentStatement',
          line: idToken.line,
          target: idToken.value,
          value: {
            type: 'BinaryExpression',
            line: idToken.line,
            operator: binaryOp,
            left: { type: 'Identifier', line: idToken.line, name: idToken.value },
            right: valExpr
          }
        };
      }

      // Simple assignment: x = expr;
      if (this.match('PUNCTUATION', '=')) {
        const value = this.expression();
        if (requireSemicolon) {
          this.consume('PUNCTUATION', ';', "Expected ';' after assignment");
        }
        return {
          type: 'AssignmentStatement',
          line: idToken.line,
          target: idToken.value,
          value
        };
      }

      // Array indexed assignment: arr[idx] = expr;
      if (this.match('PUNCTUATION', '[')) {
        const indexExpr = this.expression();
        this.consume('PUNCTUATION', ']', "Expected ']' after array index");
        this.consume('PUNCTUATION', '=', "Expected '=' in array assignment");
        const value = this.expression();
        if (requireSemicolon) {
          this.consume('PUNCTUATION', ';', "Expected ';' after array assignment");
        }
        return {
          type: 'AssignmentStatement',
          line: idToken.line,
          target: idToken.value,
          indexExpr,
          value
        };
      }

      // Function call as statement: foo(...);
      if (this.match('PUNCTUATION', '(')) {
        const args: ExpressionNode[] = [];
        if (!this.check('PUNCTUATION', ')')) {
          do {
            args.push(this.expression());
          } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', ')', "Expected ')' after function arguments");
        if (requireSemicolon) {
          this.consume('PUNCTUATION', ';', "Expected ';' after function call");
        }
        return {
          type: 'ExpressionStatement',
          line: idToken.line,
          expression: {
            type: 'FunctionCall',
            line: idToken.line,
            callee: idToken.value,
            arguments: args
          }
        };
      }

      // Rollback if just standalone expression
      this.current--;
    }

    const expr = this.expression();
    if (requireSemicolon) {
      this.consume('PUNCTUATION', ';', "Expected ';' after expression statement");
    }
    return {
      type: 'ExpressionStatement',
      line: startToken.line,
      expression: expr
    };
  }

  private ifStatement(): IfStatementNode {
    const ifToken = this.advance(); // 'if'
    this.consume('PUNCTUATION', '(', "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume('PUNCTUATION', ')', "Expected ')' after if condition");

    const consequent = this.blockOrSingleStatement();
    let alternate: BlockNode | null = null;

    if (this.match('KEYWORD', 'else')) {
      if (this.check('KEYWORD', 'if')) {
        const nestedIf = this.ifStatement();
        alternate = {
          type: 'Block',
          line: nestedIf.line,
          body: [nestedIf]
        };
      } else {
        alternate = this.blockOrSingleStatement();
      }
    }

    return {
      type: 'IfStatement',
      line: ifToken.line,
      condition,
      consequent,
      alternate
    };
  }

  private whileStatement(): WhileStatementNode {
    const whileToken = this.advance(); // 'while'
    this.consume('PUNCTUATION', '(', "Expected '(' after 'while'");
    const condition = this.expression();
    this.consume('PUNCTUATION', ')', "Expected ')' after while condition");
    const body = this.blockOrSingleStatement();

    return {
      type: 'WhileStatement',
      line: whileToken.line,
      condition,
      body
    };
  }

  private forStatement(): ForStatementNode {
    const forToken = this.advance(); // 'for'
    this.consume('PUNCTUATION', '(', "Expected '(' after 'for'");

    let init: VariableDeclarationNode | AssignmentStatementNode | null = null;
    if (!this.match('PUNCTUATION', ';')) {
      if (
        this.check('TYPE') ||
        (this.check('KEYWORD') && ['let', 'var', 'const'].includes(this.peek().value))
      ) {
        const decl = this.typeOrVarOrFunctionDeclaration();
        if (decl.type === 'VariableDeclaration') {
          init = decl;
        }
      } else {
        const stmt = this.assignmentOrExpressionStatement();
        if (stmt.type === 'AssignmentStatement') {
          init = stmt;
        }
      }
    }

    let condition: ExpressionNode | null = null;
    if (!this.check('PUNCTUATION', ';')) {
      condition = this.expression();
    }
    this.consume('PUNCTUATION', ';', "Expected ';' after for loop condition");

    let update: AssignmentStatementNode | null = null;
    if (!this.check('PUNCTUATION', ')')) {
      const stmt = this.assignmentOrExpressionStatement(false);
      if (stmt.type === 'AssignmentStatement') {
        update = stmt;
      }
    }
    this.consume('PUNCTUATION', ')', "Expected ')' after for clauses");

    const body = this.blockOrSingleStatement();

    return {
      type: 'ForStatement',
      line: forToken.line,
      init,
      condition,
      update,
      body
    };
  }

  private returnStatement(): ReturnStatementNode {
    const returnToken = this.advance(); // 'return'
    let argument: ExpressionNode | null = null;
    if (!this.check('PUNCTUATION', ';') && !this.check('PUNCTUATION', '}')) {
      argument = this.expression();
    }
    this.consume('PUNCTUATION', ';', "Expected ';' after return statement");
    return {
      type: 'ReturnStatement',
      line: returnToken.line,
      argument
    };
  }

  // Handles:
  // print(x);
  // printf("%d\n", sum);
  // printf("Hello World");
  // puts("Hello");
  private printOrPrintfStatement(): StatementNode {
    const printToken = this.advance(); // 'print', 'printf', 'puts'
    this.consume('PUNCTUATION', '(', "Expected '(' after print/printf");

    const args: ExpressionNode[] = [];
    if (!this.check('PUNCTUATION', ')')) {
      do {
        args.push(this.expression());
      } while (this.match('PUNCTUATION', ','));
    }
    this.consume('PUNCTUATION', ')', "Expected ')' after print arguments");
    this.consume('PUNCTUATION', ';', "Expected ';' after print statement");

    // In C: printf("%d\n", sum) or printf("%d %d\n", a, b)
    if (printToken.value === 'printf' && args.length >= 2 && args[0].type === 'StringLiteral') {
      if (args.length > 2) {
        const body: StatementNode[] = [];
        for (let i = 1; i < args.length; i++) {
          body.push({
            type: 'ExpressionStatement',
            line: printToken.line,
            expression: {
              type: 'FunctionCall',
              line: printToken.line,
              callee: 'print',
              arguments: [args[i]]
            }
          });
        }
        return {
          type: 'Block',
          line: printToken.line,
          body
        };
      } else {
        return {
          type: 'ExpressionStatement',
          line: printToken.line,
          expression: {
            type: 'FunctionCall',
            line: printToken.line,
            callee: 'print',
            arguments: [args[1]]
          }
        };
      }
    }

    const actualArg: ExpressionNode = args[0] || {
      type: 'Literal',
      line: printToken.line,
      value: 0,
      raw: '0'
    };

    return {
      type: 'ExpressionStatement',
      line: printToken.line,
      expression: {
        type: 'FunctionCall',
        line: printToken.line,
        callee: 'print',
        arguments: [actualArg]
      }
    };
  }

  private blockOrSingleStatement(): BlockNode {
    if (this.check('PUNCTUATION', '{')) {
      return this.block();
    }
    const stmt = this.statement();
    return {
      type: 'Block',
      line: stmt.line,
      body: [stmt]
    };
  }

  private block(): BlockNode {
    const openBrace = this.consume('PUNCTUATION', '{', "Expected '{' to start block");
    const statements: StatementNode[] = [];
    while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
      if (this.match('PUNCTUATION', ';')) continue;
      statements.push(this.statement());
    }
    this.consume('PUNCTUATION', '}', "Expected '}' to close block");

    return {
      type: 'Block',
      line: openBrace.line,
      body: statements
    };
  }

  // --- Expressions & Precedence Parsing ---

  public expression(): ExpressionNode {
    const expr = this.logicalOr();

    // Check if another operand or unexpected token immediately follows on the same line without an operator
    while (!this.isAtEnd()) {
      const next = this.peek();
      const prev = this.previous();
      const lastLine = prev ? prev.line : expr.line;

      // If the next token is on a subsequent line or at EOF, expression has ended
      if (next.line > lastLine || next.type === 'EOF') {
        break;
      }

      // Valid expression delimiters that legally terminate an expression:
      // ';' statement terminator
      // ',' separator in arguments, array elements, or multiple declarations
      // ')' closing paren for group, condition, or function call
      // ']' closing bracket for array access
      // '}' closing brace for array literal or block
      // ':' ternary colon
      // '?' ternary question mark
      if (
        next.type === 'PUNCTUATION' &&
        [';', ',', ')', ']', '}', ':', '?'].includes(next.value)
      ) {
        break;
      }

      // If next token starts a new statement keyword (e.g. 'return', 'if', 'while', 'for')
      // or type declaration (e.g. 'int', 'void', 'let', 'const')
      if (next.type === 'KEYWORD' || next.type === 'TYPE') {
        break; // Leave for statement parser to consume ';' and report "Expected ';' before '<keyword>'"
      }

      // Check for two consecutive operands on the same line: e.g. "a b", "a 10", "10 20"
      if (
        next.type === 'IDENTIFIER' ||
        next.type === 'NUMBER' ||
        next.type === 'STRING'
      ) {
        // Check if next token is actually a new assignment statement on the same line, like "x = 5 y = 10;"
        const nextNext = this.tokens[this.current + 1];
        if (
          next.type === 'IDENTIFIER' &&
          nextNext &&
          (nextNext.value === '=' || ['+=', '-=', '*=', '/=', '%='].includes(nextNext.value))
        ) {
          throw new Error(
            `Expected ';' before '${next.value}' at line ${next.line}, col ${next.column}`
          );
        }

        const prevName = prev ? `'${prev.value}'` : 'previous expression';
        throw new Error(
          `Unexpected ${next.type.toLowerCase()} '${next.value}' after expression — missing operator between ${prevName} and '${next.value}' at line ${next.line}, col ${next.column}`
        );
      }

      // Any other unexpected token on the same line
      throw new Error(
        `Unexpected token '${next.value}' after expression at line ${next.line}, col ${next.column}`
      );
    }

    return expr;
  }

  private logicalOr(): ExpressionNode {
    let expr = this.logicalAnd();
    while (this.match('OPERATOR', '||')) {
      const op = this.previous().value;
      const right = this.logicalAnd();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private logicalAnd(): ExpressionNode {
    let expr = this.bitwiseOr();
    while (this.match('OPERATOR', '&&')) {
      const op = this.previous().value;
      const right = this.bitwiseOr();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private bitwiseOr(): ExpressionNode {
    let expr = this.bitwiseXor();
    while (this.match('OPERATOR', '|')) {
      const op = this.previous().value;
      const right = this.bitwiseXor();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private bitwiseXor(): ExpressionNode {
    let expr = this.bitwiseAnd();
    while (this.match('OPERATOR', '^')) {
      const op = this.previous().value;
      const right = this.bitwiseAnd();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private bitwiseAnd(): ExpressionNode {
    let expr = this.equality();
    while (this.match('OPERATOR', '&')) {
      const op = this.previous().value;
      const right = this.equality();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private equality(): ExpressionNode {
    let expr = this.comparison();
    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const op = this.previous().value;
      const right = this.comparison();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private comparison(): ExpressionNode {
    let expr = this.shift();
    while (
      this.match('OPERATOR', '<') ||
      this.match('OPERATOR', '<=') ||
      this.match('OPERATOR', '>') ||
      this.match('OPERATOR', '>=')
    ) {
      const op = this.previous().value;
      const right = this.shift();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private shift(): ExpressionNode {
    let expr = this.term();
    while (this.match('OPERATOR', '<<') || this.match('OPERATOR', '>>')) {
      const op = this.previous().value;
      const right = this.term();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private term(): ExpressionNode {
    let expr = this.factor();
    while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-')) {
      const op = this.previous().value;
      const right = this.factor();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private factor(): ExpressionNode {
    let expr = this.unary();
    while (
      this.match('OPERATOR', '*') ||
      this.match('OPERATOR', '/') ||
      this.match('OPERATOR', '%')
    ) {
      const op = this.previous().value;
      const right = this.unary();
      expr = {
        type: 'BinaryExpression',
        line: expr.line,
        operator: op,
        left: expr,
        right
      };
    }
    return expr;
  }

  private unary(): ExpressionNode {
    if (this.match('OPERATOR', '+')) {
      return this.unary(); // Unary positive
    }
    if (this.match('OPERATOR', '&')) {
      return this.unary(); // Address-of
    }
    if (this.match('OPERATOR', '!') || this.match('OPERATOR', '-')) {
      const op = this.previous().value;
      const argument = this.unary();
      return {
        type: 'UnaryExpression',
        line: argument.line,
        operator: op,
        argument
      };
    }
    return this.primary();
  }

  private primary(): ExpressionNode {
    // String Literal: "..."
    if (this.check('STRING')) {
      const token = this.advance();
      return {
        type: 'StringLiteral',
        line: token.line,
        value: token.value
      };
    }

    // Number Literal
    if (this.check('NUMBER')) {
      const token = this.advance();
      const val =
        token.value.startsWith('0x') || token.value.startsWith('0X')
          ? parseInt(token.value, 16)
          : parseInt(token.value, 10);
      return {
        type: 'Literal',
        line: token.line,
        value: val,
        raw: token.value
      };
    }

    // Array Literal: [1, 2, 3] or {1, 2, 3}
    if (this.match('PUNCTUATION', '[') || this.match('PUNCTUATION', '{')) {
      const closeChar = this.previous().value === '[' ? ']' : '}';
      const elements: ExpressionNode[] = [];
      if (!this.check('PUNCTUATION', closeChar)) {
        do {
          elements.push(this.expression());
        } while (this.match('PUNCTUATION', ','));
      }
      this.consume('PUNCTUATION', closeChar, `Expected '${closeChar}' after array elements`);
      return {
        type: 'ArrayLiteral',
        line: this.previous().line,
        elements
      };
    }

    // Identifier, Function Call, or Array Access
    if (
      this.check('IDENTIFIER') ||
      (this.check('KEYWORD') &&
        ['print', 'printf', 'puts', 'console', 'main'].includes(this.peek().value))
    ) {
      const idToken = this.advance();
      let name = idToken.value;

      // Handle console.log(...)
      if (name === 'console' && this.match('PUNCTUATION', '.')) {
        const subId = this.consume('IDENTIFIER', undefined, "Expected 'log' after console.");
        name = `console.${subId.value}`;
      }

      // Check function call: name(...)
      if (this.match('PUNCTUATION', '(')) {
        const args: ExpressionNode[] = [];
        if (!this.check('PUNCTUATION', ')')) {
          do {
            args.push(this.expression());
          } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', ')', "Expected ')' after function arguments");
        return {
          type: 'FunctionCall',
          line: idToken.line,
          callee: name,
          arguments: args
        };
      }

      // Check array indexing: arr[index]
      if (this.match('PUNCTUATION', '[')) {
        const index = this.expression();
        this.consume('PUNCTUATION', ']', "Expected ']' after index expression");
        return {
          type: 'ArrayAccess',
          line: idToken.line,
          arrayName: name,
          index
        };
      }

      return {
        type: 'Identifier',
        line: idToken.line,
        name
      };
    }

    // Grouping: (expr)
    if (this.match('PUNCTUATION', '(')) {
      const expr = this.expression();
      this.consume('PUNCTUATION', ')', "Expected ')' after expression");
      return expr;
    }

    const next = this.peek();
    const prev = this.previous();
    if (prev && prev.type === 'OPERATOR') {
      const errLine = next.line > 0 ? next.line : prev.line;
      const errCol = next.column > 0 ? next.column : prev.column;
      throw new Error(
        `Expected expression after operator '${prev.value}' but got '${next.value || next.type}' at line ${errLine}, col ${errCol}`
      );
    }
    if (prev && prev.type === 'PUNCTUATION' && prev.value === '=') {
      const errLine = next.line > 0 ? next.line : prev.line;
      const errCol = next.column > 0 ? next.column : prev.column;
      throw new Error(
        `Expected expression after '=' but got '${next.value || next.type}' at line ${errLine}, col ${errCol}`
      );
    }
    if (prev && prev.type === 'PUNCTUATION' && prev.value === ',') {
      const errLine = next.line > 0 ? next.line : prev.line;
      const errCol = next.column > 0 ? next.column : prev.column;
      throw new Error(
        `Expected expression after ',' but got '${next.value || next.type}' at line ${errLine}, col ${errCol}`
      );
    }
    if (next.type === 'PUNCTUATION' && next.value === ';') {
      throw new Error(
        `Expected expression before ';' at line ${next.line}, col ${next.column}`
      );
    }
    if (next.type === 'PUNCTUATION' && next.value === ')') {
      throw new Error(
        `Expected expression before ')' at line ${next.line}, col ${next.column}`
      );
    }
    throw new Error(
      `Unexpected token '${next.value}' at line ${next.line}, column ${next.column}`
    );
  }
}
