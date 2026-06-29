function toIrExpression(node: any): any {
  if (!node) return null;

  switch (node.type) {
    case 'Identifier':
      return { type: 'IRVar', name: node.name };
    case 'Const':
      return { type: 'IRConst', value: node.value };
    case 'BinaryExpression':
      return {
        type: 'IRBinary',
        op: node.operator,
        left: toIrExpression(node.left),
        right: toIrExpression(node.right),
      };
    case 'ConditionalExpression':
      return {
        type: 'IRConditional',
        condition: toIrExpression(node.condition),
        whenTrue: toIrExpression(node.whenTrue),
        whenFalse: toIrExpression(node.whenFalse),
      };
    case 'PropertyAccessExpression':
      return {
        type: 'IRProperty',
        object: toIrExpression(node.expression),
        property: node.name,
      };
    case 'CallExpression':
      return {
        type: 'IRCall',
        callee: toIrExpression(node.expression),
        args: (node.arguments ?? []).map((arg: any) => toIrExpression(arg)),
      };
    case 'PrefixUnaryExpression':
      return {
        type: 'IRUnary',
        op: node.operator,
        expr: toIrExpression(node.operand),
      };
    case 'NewExpression':
      return {
        type: 'IRNew',
        class: node.expression,
        args: (node.arguments ?? []).map((arg: any) => toIrExpression(arg)),
      };
    case 'TemplateExpression':
      return {
        type: 'IRTemplate',
        parts: node.parts.map((part: any) => toIrExpression(part)),
      };
    default:
      return { type: 'IRUnknown', value: node };
  }
}

function toIrStatement(node: any): any {
  if (!node) return null;

  if (node.type === 'IfStatement') {
    return {
      type: 'IRIf',
      condition: toIrExpression(node.expression),
      then: (node.thenStatement ?? []).map((statement: any) => toIrStatement(statement)),
    };
  }

  if (node.type === 'Terminal') {
    if (node.kind === 'return') {
      return {
        type: 'IRReturn',
        value: toIrExpression(node.value),
      };
    }

    if (node.kind === 'throw') {
      return {
        type: 'IRThrow',
        error: toIrExpression(node.error),
      };
    }
  }

  return { type: 'IRUnknown', value: node };
}

export function createIr(ast: any): any {
  if (!ast) return [];

  const astFunctions = Array.isArray(ast) ? ast : [ast];

  return astFunctions
    .filter(Boolean)
    .map((item) => ({
      type: 'IRFunction',
      name: item.name,
      params: item.params?.map((param: any) => param.name) ?? [],
      imports: item.imports ?? [],
      body: (item.body ?? []).map((statement: any) => toIrStatement(statement)),
    }));
}
