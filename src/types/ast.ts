// Abstract Syntax Tree (AST) definitions for High-Level Language & C

export type ASTNodeType =
  | 'Program'
  | 'VariableDeclaration'
  | 'AssignmentStatement'
  | 'IfStatement'
  | 'WhileStatement'
  | 'ForStatement'
  | 'FunctionDeclaration'
  | 'ReturnStatement'
  | 'ExpressionStatement'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'Identifier'
  | 'Literal'
  | 'StringLiteral'
  | 'FunctionCall'
  | 'ArrayAccess'
  | 'ArrayLiteral'
  | 'Block';

export interface ASTNodeBase {
  type: ASTNodeType;
  line: number;
}

export interface ProgramNode extends ASTNodeBase {
  type: 'Program';
  body: StatementNode[];
}

export interface VariableDeclarationNode extends ASTNodeBase {
  type: 'VariableDeclaration';
  name: string;
  init: ExpressionNode | null;
  isArray?: boolean;
  arraySize?: number;
  varType?: string;
}

export interface AssignmentStatementNode extends ASTNodeBase {
  type: 'AssignmentStatement';
  target: string;
  indexExpr?: ExpressionNode; // for arr[i] = val
  value: ExpressionNode;
}

export interface IfStatementNode extends ASTNodeBase {
  type: 'IfStatement';
  condition: ExpressionNode;
  consequent: BlockNode;
  alternate: BlockNode | null;
}

export interface WhileStatementNode extends ASTNodeBase {
  type: 'WhileStatement';
  condition: ExpressionNode;
  body: BlockNode;
}

export interface ForStatementNode extends ASTNodeBase {
  type: 'ForStatement';
  init: VariableDeclarationNode | AssignmentStatementNode | null;
  condition: ExpressionNode | null;
  update: AssignmentStatementNode | null;
  body: BlockNode;
}

export interface FunctionDeclarationNode extends ASTNodeBase {
  type: 'FunctionDeclaration';
  name: string;
  returnType?: string;
  params: string[];
  body: BlockNode;
}

export interface ReturnStatementNode extends ASTNodeBase {
  type: 'ReturnStatement';
  argument: ExpressionNode | null;
}

export interface ExpressionStatementNode extends ASTNodeBase {
  type: 'ExpressionStatement';
  expression: ExpressionNode;
}

export interface BlockNode extends ASTNodeBase {
  type: 'Block';
  body: StatementNode[];
}

export type StatementNode =
  | VariableDeclarationNode
  | AssignmentStatementNode
  | IfStatementNode
  | WhileStatementNode
  | ForStatementNode
  | FunctionDeclarationNode
  | ReturnStatementNode
  | ExpressionStatementNode
  | BlockNode;

export interface BinaryExpressionNode extends ASTNodeBase {
  type: 'BinaryExpression';
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryExpressionNode extends ASTNodeBase {
  type: 'UnaryExpression';
  operator: string;
  argument: ExpressionNode;
}

export interface IdentifierNode extends ASTNodeBase {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends ASTNodeBase {
  type: 'Literal';
  value: number;
  raw: string;
}

export interface StringLiteralNode extends ASTNodeBase {
  type: 'StringLiteral';
  value: string;
}

export interface FunctionCallNode extends ASTNodeBase {
  type: 'FunctionCall';
  callee: string;
  arguments: ExpressionNode[];
}

export interface ArrayAccessNode extends ASTNodeBase {
  type: 'ArrayAccess';
  arrayName: string;
  index: ExpressionNode;
}

export interface ArrayLiteralNode extends ASTNodeBase {
  type: 'ArrayLiteral';
  elements: ExpressionNode[];
}

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | IdentifierNode
  | LiteralNode
  | StringLiteralNode
  | FunctionCallNode
  | ArrayAccessNode
  | ArrayLiteralNode;
