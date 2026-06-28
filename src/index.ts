import ts, { SyntaxKind } from "typescript";
import { builtinModules } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// CORE
type Nil = undefined | null;
type Nullable<T> = T | Nil;
const isNil = (obj: unknown): obj is Nil => obj === null || obj === undefined;
const isDefined = <T>(obj: unknown): obj is NonNullable<T> => obj !== null && obj !== undefined;

// Typings
interface Path {}

interface Node {
  type: string;
}

interface BlockNode extends Node {
  type: "node";
  nodeType: "block";
  nodes: ReadonlyArray<Node>;
}

interface Expression extends Node {
  type: "expression";
}

interface ConstantExpression extends Expression {
  expressionType: "constant";
}

interface DynamicExpression extends Expression {
  expressionType: "dynamic";
}

interface VariableExpression extends DynamicExpression {
  dynamicExpressionType: "variable";
  variableName: string;
}

interface NullExpression extends ConstantExpression {
  constantExpressionType: "null";
}

interface UndefinedExpression extends ConstantExpression {
  constantExpressionType: "undefined";
}

interface TrueExpression extends ConstantExpression {
  constantExpressionType: "true";
}

interface FalseExpression extends ConstantExpression {
  constantExpressionType: "false";
}

interface StringExpression extends ConstantExpression {
  constantExpressionType: "string";
  text: string;
}

interface NumberExpression extends ConstantExpression {
  constantExpressionType: "number";
  text: string;
}

interface TemplatePartExpression extends Expression {
  templateType: "part";
}

interface TemplateHeadExpression extends TemplatePartExpression {
  templatePartType: "head";
  literal: string;
}

interface TemplateSpanExpression extends TemplatePartExpression {
  templatePartType: "span";
  token: Expression;
  literal: string;
}

interface TemplateExpression extends Expression {
  expressionType: "template";
  parts: ReadonlyArray<Node>;
}

interface CallExpression extends Expression {
  expressionType: "call";
  expression: Node;
  arguments: ReadonlyArray<Node>;
}

interface LogicalExpression extends Expression {
  expressionType: "logical";
}

interface BinaryExpression extends LogicalExpression {
  logicalExpressionType: "binary";
  tokenSymbol: Node;
  left: Node;
  right: Node;
}

interface BinaryOperator extends Expression {
  expressionType: "operator";
  value: string;
}

interface UnaryExpression extends LogicalExpression {
  logicalExpressionType: "unary";
  operand: Node;
  operator: any;
}

interface NewExpression extends Expression {
  expressionType: "new";
  expression: Node;
  arguments: ReadonlyArray<Node>;
}

interface Statement extends Node {
  type: "statement";
}

interface VariableStatement extends Statement {
  statementType: "variable";
  declarations: ReadonlyArray<Node>;
}

interface VariableDeclaration extends Statement {
  statementType: "variable";
  variableName?: Node;
  variableType: string;
  variableInitializer?: Node;
}

interface TerminalStatement extends Statement {
  statementType: "terminal";
  expression?: Node;
}

interface TerminalReturnStatement extends TerminalStatement {
  terminalType: "return";
}

interface TerminalThrowStatement extends TerminalStatement {
  terminalType: "throw";
  expression: Node;
}

interface BranchStatement extends Statement {
  statementType: "branch";
  expression: Node;
}

interface BranchIfStatement extends BranchStatement {
  branchType: "if";
  whenTrue: Node;
  whenFalse?: Node;
}

interface BranchTernaryStatement extends BranchStatement {
  branchType: "ternary";
  whenTrue: Node;
  whenFalse: Node;
}


// TS UTILS
const NodeWithReturnTypes = [ts.SyntaxKind.FunctionDeclaration, ts.SyntaxKind.MethodDeclaration, ts.SyntaxKind.FunctionExpression, ts.SyntaxKind.ArrowFunction];
type NodeWithReturnType = ts.FunctionDeclaration | ts.MethodDeclaration | ts.FunctionExpression | ts.ArrowFunction;
const isFunctionDeclaration = (statement: ts.Node) => ts.isFunctionDeclaration(statement);
const isNodeWithReturnType = (node: ts.Node): node is NodeWithReturnType => NodeWithReturnTypes.includes(node.kind);
const isNodeVariableDeclaration = (node: ts.Node): node is ts.VariableDeclaration => node.kind === ts.SyntaxKind.VariableDeclaration;

const isSymbolExported = (
  symbol: Nullable<ts.Symbol>,
  checker: ts.TypeChecker
): boolean => {
  if (isNil(symbol)) return false;

  const realSymbol =
    (symbol.flags & ts.SymbolFlags.Alias)
      ? checker.getAliasedSymbol(symbol)
      : symbol;

  for (const decl of realSymbol.declarations ?? []) {
    const sourceFileSymbol = checker.getSymbolAtLocation(decl.getSourceFile());
    if (!sourceFileSymbol) continue;

    const exports = checker.getExportsOfModule(sourceFileSymbol);

    if (exports.includes(realSymbol)) {
      return true;
    }
  }

  return false;
};

const _isBlockNode = (node: Node): node is BlockNode => node.type === "block";

// LOGIC
const getAllPaths = (node: Node, parentTree: Array<Path>) => {

}

const getPaths = (node: Node): ReadonlyArray<Path> => {
  const result: Array<Path> = [];

  if (_isBlockNode(node)) {
    for (const child of node.nodes) {
      const currentPath = [];

    }
  }

  return result;
}

const isBlockNode = (node: ts.Node) => ts.isBlock(node);
const isTerminalNode = (node: ts.Node) => ts.isThrowStatement(node) || ts.isReturnStatement(node);
const isBranchNode = (node: ts.Node) => ts.isIfStatement(node) || ts.isConditionalExpression(node);

const createBlockNode = (node: ts.Block): BlockNode => {
  return {
    type: "node",
    nodeType: "block",
    nodes: node.statements.map(m => createNode(m))
  };
}

const createReturnStatement = (node: ts.ReturnStatement): TerminalReturnStatement => {
  return {
    type: "statement",
    statementType: "terminal",
    terminalType: "return",
    expression: isDefined(node.expression) ? createNode(node.expression) : undefined,
  }
}

const createThrowStatement = (node: ts.ThrowStatement): TerminalThrowStatement => {
  return {
    type: "statement",
    statementType: "terminal",
    terminalType: "throw",
    expression: createNode(node.expression)
  }
}

const createVariableStatement = (node: ts.VariableStatement): VariableStatement => {
  return {
    type: "statement",
    statementType: "variable",
    declarations: node.declarationList.declarations.map(m => createNode(m))
  }
}

const createVariableDeclaration = (node: ts.VariableDeclaration): VariableDeclaration => {
  return {
    type: "statement",
    statementType: "variable",
    variableName: createNode(node.name),
    variableInitializer: isDefined(node.initializer) ? createNode(node.initializer) : undefined,
    variableType: node.type?.getText() ?? "any"
  }
}

const createTerminalNode = (node: ts.ThrowStatement | ts.ReturnStatement): TerminalStatement => {
  if (ts.isReturnStatement(node)) return createReturnStatement(node);
  if (ts.isThrowStatement(node)) return createThrowStatement(node);
  throw `No terminal type was found in 'createTerminalNode'!`;
}

const createBranchTernaryNode = (node: ts.ConditionalExpression): BranchTernaryStatement => {
  return {
    type: "statement",
    statementType: "branch",
    branchType: "ternary",
    whenTrue: createNode(node.whenTrue),
    whenFalse: createNode(node.whenFalse),
    expression: createNode(node.condition)
  }
}

const createBranchIfNode = (node: ts.IfStatement): BranchIfStatement => {
  return {
    type: "statement",
    statementType: "branch",
    branchType: "if",
    whenTrue: createNode(node.thenStatement),
    whenFalse: isDefined(node.elseStatement) ? createNode(node.elseStatement) : undefined,
    expression: createNode(node.expression)
  }
}

const createBranchNode = (node: ts.IfStatement | ts.ConditionalExpression): BranchStatement => {
  if (ts.isIfStatement(node)) return createBranchIfNode(node);
  if (ts.isConditionalExpression(node)) return createBranchTernaryNode(node);
  throw `No terminal type was found in 'createTerminalNode'!`;
}

const createTemplateExpression = (expression: ts.TemplateExpression): TemplateExpression => {
  return {
    type: "expression",
    expressionType: "template",
    parts: [expression.head, ...expression.templateSpans].map(m => createNode(m))
  }
}

const createNullExpression = (): NullExpression => {
  return {
    type: "expression",
    expressionType: "constant",
    constantExpressionType: "null"
  };
}

const createUndefinedExpression = (): UndefinedExpression => {
  return {
    type: "expression",
    expressionType: "constant",
    constantExpressionType: "undefined"
  };
}

const createTrueExpression = (): TrueExpression => {
  return {
    type: "expression",
    expressionType: "constant",
    constantExpressionType: "true"
  };
}

const createFalseExpression = (): FalseExpression => {
  return {
    type: "expression",
    expressionType: "constant",
    constantExpressionType: "false"
  };
}

const createStringExpression = (node: ts.StringLiteral): StringExpression => {
  return {
    type: "expression",
    expressionType: "constant",
    constantExpressionType: "string",
    text: node.text
  };
}

const createNumberExpression = (node: ts.NumericLiteral): NumberExpression => {
  return {
    type: "expression",
    expressionType: "constant",
    constantExpressionType: "number",
    text: node.text
  };
}

const createCallExpression = (node: ts.CallExpression): CallExpression => {
  return {
    type: "expression",
    expressionType: "call",
    expression: createNode(node.expression),
    arguments: node.arguments.map(m => createNode(m))
  };
}

const createNewExpression = (node: ts.NewExpression): NewExpression => {
  return {
    type: "expression",
    expressionType: "new",
    expression: createNode(node.expression),
    arguments: node.arguments?.map(m => createNode(m)) ?? []
  };
}

const createBinaryExpression = (node: ts.BinaryExpression): BinaryExpression => {
  return {
    type: "expression",
    expressionType: "logical",
    logicalExpressionType: "binary",
    tokenSymbol: createNode(node.operatorToken),
    left: createNode(node.left),
    right: createNode(node.right),
  }
}

const createBinaryOperator = (node: ts.BinaryOperatorToken): BinaryOperator => {
  return {
    type: "expression",
    expressionType: "operator",
    value: getToken(node.kind)
  }
  function getToken(token: SyntaxKind) {
    switch (token) {
      case ts.SyntaxKind.AmpersandAmpersandToken: return "and";
      case ts.SyntaxKind.BarBarToken: return "or";
      case ts.SyntaxKind.ExclamationEqualsEqualsToken: return "neqeq";
      case ts.SyntaxKind.ExclamationEqualsToken: return "neq";
      case ts.SyntaxKind.EqualsEqualsToken: return "eqeq";
      case ts.SyntaxKind.EqualsEqualsEqualsToken: return "eqeqeq";
      case ts.SyntaxKind.GreaterThanToken: return "gt";
      case ts.SyntaxKind.LessThanToken: return "lt";
      case ts.SyntaxKind.LessThanEqualsToken: return "lte";
      case ts.SyntaxKind.GreaterThanEqualsToken: return "gte";
      default:
        throw `Cannot find token! '${token}'!`;
    }
  }
}

const createUnaryExpression = (node: ts.PrefixUnaryExpression): UnaryExpression => {
  function getOperator(operator: ts.SyntaxKind) {
    switch (operator) {
      case SyntaxKind.PlusPlusToken: return "plusplus";
      case SyntaxKind.MinusMinusToken: return "minusminus";
      case SyntaxKind.PlusToken: return "plus"
      case SyntaxKind.MinusToken: return "minus";
      case SyntaxKind.TildeToken: return "tilde";
      case SyntaxKind.ExclamationToken: return "exclamation";
      default: throw `Cannot determine operator for '${operator}'!`;
    }
  }

  return {
    type: "expression",
    expressionType: "logical",
    logicalExpressionType: "unary",
    operand: createNode(node.operand),
    operator: getOperator(node.operator)
  }
}

const createIdentifier = (identifier: ts.Identifier): Expression => {
  if (identifier.text === "undefined") return createUndefinedExpression();

  const result: VariableExpression = {
    type: "expression",
    expressionType: "dynamic",
    dynamicExpressionType: "variable",
    variableName: identifier.text,
  }

  return result;
}

const createTemplateHeadNode = (node: ts.TemplateHead): TemplateHeadExpression => {
  return {
    type: "expression",
    templateType: "part",
    templatePartType: "head",
    literal: node.text
  }
}

const createTemplateLiteralNode = (node: ts.TemplateSpan): TemplateSpanExpression => {
  return {
    type: "expression",
    templateType: "part",
    templatePartType: "span",
    literal: node.literal.text,
    token: createExpression(node.expression)
  }
}

const createExpression = (expression: ts.Expression): Expression => {
  if (ts.isTemplateExpression(expression)) return createTemplateExpression(expression);

  switch (expression.kind) {
    case ts.SyntaxKind.NullKeyword: return createNullExpression();
    case ts.SyntaxKind.TrueKeyword: return createTrueExpression();
    case ts.SyntaxKind.FalseKeyword: return createFalseExpression();
  }

  return undefined as unknown as Expression;
}

const createNode = (node: ts.Node): Node => {
  if (isBlockNode(node)) return createBlockNode(node);
  if (isTerminalNode(node)) return createTerminalNode(node);
  if (isBranchNode(node)) return createBranchNode(node);
  if (ts.isStringLiteral(node)) return createStringExpression(node);
  if (ts.isNumericLiteral(node)) return createNumberExpression(node);
  if (ts.isTemplateHead(node)) return createTemplateHeadNode(node);
  if (ts.isTemplateSpan(node)) return createTemplateLiteralNode(node);
  if (ts.isCallExpression(node)) return createCallExpression(node);
  if (ts.isNewExpression(node)) return createNewExpression(node);
  if (ts.isPrefixUnaryExpression(node)) return createUnaryExpression(node);
  if (ts.isBinaryExpression(node)) return createBinaryExpression(node);
  if (ts.isBinaryOperatorToken(node)) return createBinaryOperator(node);
  if (ts.isVariableStatement(node)) return createVariableStatement(node);
  if (ts.isVariableDeclaration(node)) return createVariableDeclaration(node);

  if (ts.isIdentifier(node)) return createIdentifier(node);
  if (ts.isExpression(node)) return createExpression(node);

  return undefined as unknown as Node;
}

const createNormalizedIR = (node: ts.Node): Node => {
  if (ts.isFunctionDeclaration(node)) {
    if (isNil(node.body)) throw `Body cannot be nil! In 'createAST'.`;
    return createNode(node.body);
  }
  throw `'node' is not 'FunctionDeclaration' in 'createAST'!`;
}

const getValueType = (
  checker: ts.TypeChecker,
  declaration: ts.VariableDeclaration
): ts.Type => checker.getTypeAtLocation(declaration);

const getReturnType = (
  checker: ts.TypeChecker,
  node: NodeWithReturnType
): ts.Type => {
  const signature = checker.getSignatureFromDeclaration(node);
  if (isNil(signature)) {
    throw `Cannot determine Type for '${node}' in 'getReturnType'!`;
  }
  return checker.getReturnTypeOfSignature(signature);
}

const getFunctionName = (
  node: ts.Node
) => {
  if (isFunctionDeclaration(node)) return node.name?.text;
  throw `Cannot get node name!`;
}

const getParametersWithType = (
  node: ts.Node
) => {
  if (isFunctionDeclaration(node)) return node.parameters.map((m,i ) => ({
    name: m.name.getText(),
    type: m.type?.getText() ?? "any",
    initializer: m.initializer,
    index: i,
    isSpread: m.dotDotDotToken ? true : false,
    isOptional: m.questionToken ? true : false,
  }));
  throw `Cannot determine node type in 'getParametersWithType'!`;
}

const getOutputType = (node: ts.Node, tc: ts.TypeChecker): ts.Type => {
  if (isNodeWithReturnType(node)) return getReturnType(tc, node);
  if (isNodeVariableDeclaration(node)) return getValueType(tc, node);
  throw `Cannot determine node output type in 'getOutputType'!`;
}

const getImports = (
  sourceFile: ts.SourceFile,
  party1stImportRegex: string,
  party2ndImportRegex: string,
  party3rdImportRegex: string
) => {
  const importDeclarations= sourceFile.statements.filter(ts.isImportDeclaration);

  const builtins = new Set([
    ...builtinModules,
    ...builtinModules.map(m => `node:${m}`),
  ]);

  const p1 = importDeclarations.filter(m => (m.moduleSpecifier as ts.StringLiteral).text.match(party1stImportRegex));
  const p2 = importDeclarations.filter(m => (m.moduleSpecifier as ts.StringLiteral).text.match(party2ndImportRegex));
  const p3 = importDeclarations.filter(m => (m.moduleSpecifier as ts.StringLiteral).text.match(party3rdImportRegex));
  const relative = importDeclarations.filter(m => (m.moduleSpecifier as ts.StringLiteral).text.startsWith("."));
  const builtInModules = importDeclarations.filter(m => builtins.has((m.moduleSpecifier as ts.StringLiteral).text));

  const matched = new Set([
    ...p1,
    ...p2,
    ...p3,
    ...relative,
    ...builtInModules,  
  ]);

  const external = importDeclarations.filter(m => !matched.has(m));

  return {
    p1: p1,
    p2: p2,
    p3: p3,
    relative: relative,
    external: external,
    builtIn: builtInModules,
  };
}

const getSchemantics = (
  node: ts.Node,
  tc: ts.TypeChecker
) => {
  const outputType = tc.typeToString(getOutputType(node, tc));
  const parameters = getParametersWithType(node);
  const name = getFunctionName(node)

  return { name, outputType, parameters };
}

const getTestableMethods = (
  exportedMembers: ReadonlyArray<ts.Node>,
) => {
  // TODO: Once we check classes and so, align this. TS will throw a type error anyways.
  return exportedMembers;
}

const getExportsFromFile = (
  sourceFile: ts.SourceFile,
  tc: ts.TypeChecker,
): ReadonlyArray<ts.Node> => {
  const exportedFunctions = sourceFile.statements.filter(m => isFunctionDeclaration(m) && m.name && isSymbolExported(tc.getSymbolAtLocation(m.name), tc));

  return [
    ...exportedFunctions,
  ]
}

const createProgramAndSourceFileAndTypechecker = (path: string) => {
  const program = ts.createProgram([path], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    jsx: ts.JsxEmit.Preserve,
  });
  const sourceFile = program.getSourceFile(path);

  if (isNil(sourceFile)) throw `Cannot create SourceFile object in 'createProgramAndSourceFileAndTypechecker'!`;

  const typeChecker = program.getTypeChecker();
  return { program, sourceFile, typeChecker };
}

// ENTRY
export const runATFW = (
  inputFilePath: string,
  outputFilePath: string,
  testFramework: "jest",
  party1stImportRegex: string = "(?!)",
  party2ndImportRegex: string = "(?!)",
  party3rdImportRegex: string = "(?!)"
) => {
  const { program, sourceFile, typeChecker } = createProgramAndSourceFileAndTypechecker(inputFilePath);
  const exportedMembers = getExportsFromFile(sourceFile, typeChecker);
  const objectsToTest = getTestableMethods(exportedMembers);

  const objectsToTestWithSchemanticsAndImports = objectsToTest.map(m => ({
    schematics: getSchemantics(m, typeChecker),
    imports: getImports(sourceFile, party1stImportRegex, party2ndImportRegex, party3rdImportRegex),
    nir: createNormalizedIR(m)
  }));

  const content = JSON.stringify(objectsToTestWithSchemanticsAndImports, undefined, 2);
  mkdirSync(dirname(outputFilePath), { recursive: true });
  writeFileSync(outputFilePath, content, "utf-8");
}