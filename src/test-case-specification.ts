type IrExpr = {
  type: string;
  [key: string]: any;
};

type PathConstraint = {
  condition: string;
  expr: IrExpr;
  value: boolean;
};

type PathOutcome = {
  type: 'return' | 'throw';
  expr: IrExpr;
};

type PathItem = {
  id: string;
  constraints: PathConstraint[];
  outcome: PathOutcome;
};

type PathInput = {
  type: string;
  function: string;
  paths: PathItem[];
};

type ConstraintsCase = {
  id: string;
  pathId: string;
  inputs: Record<string, unknown>;
  expected: {
    type: 'return' | 'throw';
    value?: unknown;
    message?: string;
  };
};

type ConstraintsOutput = {
  function: string;
  cases: ConstraintsCase[];
};

type InferredType = 'boolean' | 'number' | 'string' | 'unknown';

function assignVar(inputs: Record<string, unknown>, name: string, value: unknown, overwrite = false) {
  if (overwrite || !(name in inputs)) {
    inputs[name] = value;
  }
}

function inferConstType(value: unknown): InferredType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  return 'unknown';
}

function markType(typeMap: Record<string, InferredType>, name: string, type: InferredType) {
  if (!name || type === 'unknown') return;

  const existing = typeMap[name];
  if (!existing || existing === 'unknown') {
    typeMap[name] = type;
  }
}

function collectExprTypes(expr: IrExpr | null | undefined, typeMap: Record<string, InferredType>) {
  if (!expr) return;

  if (expr.type === 'IRTemplate') {
    for (const part of expr.parts ?? []) {
      if (part?.type === 'IRVar') {
        markType(typeMap, part.name, 'string');
      }
    }
  }

  if (expr.type === 'IRBinary') {
    const left = expr.left;
    const right = expr.right;

    if (expr.op === '!==') {
      if (left?.type === 'IRVar' && right?.type === 'IRConst') {
        markType(typeMap, left.name, inferConstType(right.value));
      }

      if (left?.type === 'IRConst' && right?.type === 'IRVar') {
        markType(typeMap, right.name, inferConstType(left.value));
      }
    }

    collectExprTypes(left, typeMap);
    collectExprTypes(right, typeMap);
  }

  if (expr.type === 'IRUnary') {
    collectExprTypes(expr.expr, typeMap);
  }
}

function defaultValueForVar(name: string, inferredType: InferredType): unknown {
  if (inferredType === 'boolean') return true;
  if (inferredType === 'number') return 1;
  if (inferredType === 'string') return `${name}_value`;
  return `${name}_value`;
}

function fillMissingInputs(inputs: Record<string, unknown>, typeMap: Record<string, InferredType>) {
  for (const [name, inferredType] of Object.entries(typeMap)) {
    if (!(name in inputs)) {
      inputs[name] = defaultValueForVar(name, inferredType);
    }
  }
}

function alternativeValue(current: unknown): unknown {
  if (typeof current === 'string') return `${current}_x`;
  if (typeof current === 'number') return current + 1;
  if (typeof current === 'boolean') return !current;
  return 'x';
}

function satisfyExpr(
  expr: IrExpr | null | undefined,
  expected: boolean,
  inputs: Record<string, unknown>,
  typeMap: Record<string, InferredType>,
) {
  if (!expr) return;

  if (expr.type === 'IRUnary' && expr.op === '!' && expr.expr?.type === 'IRVar') {
    markType(typeMap, expr.expr.name, 'boolean');
    assignVar(inputs, expr.expr.name, !expected);
    return;
  }

  if (expr.type === 'IRVar') {
    markType(typeMap, expr.name, 'boolean');
    assignVar(inputs, expr.name, expected);
    return;
  }

  if (expr.type === 'IRBinary' && expr.op === '&&') {
    if (expected) {
      satisfyExpr(expr.left, true, inputs, typeMap);
      satisfyExpr(expr.right, true, inputs, typeMap);
      return;
    }

    // For false conjunction, one side must be false. Prefer the side that can
    // produce more concrete assignments (comparisons over plain vars).
    const rightLooksRicher = expr.right?.type === 'IRBinary' || expr.right?.type === 'IRUnary';

    if (rightLooksRicher) {
      satisfyExpr(expr.left, true, inputs, typeMap);
      satisfyExpr(expr.right, false, inputs, typeMap);
      return;
    }

    satisfyExpr(expr.left, false, inputs, typeMap);
    return;
  }

  if (expr.type === 'IRBinary' && expr.op === '!==') {
    const left = expr.left;
    const right = expr.right;

    if (left?.type === 'IRVar' && right?.type === 'IRConst') {
      markType(typeMap, left.name, inferConstType(right.value));
      assignVar(inputs, left.name, expected ? alternativeValue(right.value) : right.value, true);
      return;
    }

    if (left?.type === 'IRConst' && right?.type === 'IRVar') {
      markType(typeMap, right.name, inferConstType(left.value));
      assignVar(inputs, right.name, expected ? alternativeValue(left.value) : left.value, true);
      return;
    }
  }
}

function evaluateExpr(expr: IrExpr | null | undefined, inputs: Record<string, unknown>): unknown {
  if (!expr) return null;

  if (expr.type === 'IRConst') return expr.value;

  if (expr.type === 'IRVar') {
    if (expr.name === 'undefined') return 'undefined';
    if (expr.name in inputs) return inputs[expr.name];
    return expr.name;
  }

  if (expr.type === 'IRTemplate') {
    const parts = (expr.parts ?? []).map((part: IrExpr) => {
      if (part.type === 'IRConst') return String(part.value ?? '');
      if (part.type === 'IRVar') return String(inputs[part.name] ?? '');
      return '';
    });

    return parts.join('');
  }

  if (expr.type === 'IRNew' && expr.class === 'Error') {
    const firstArg = expr.args?.[0];
    if (firstArg?.type === 'IRConst') return String(firstArg.value ?? '');
    return 'Error';
  }

  return null;
}

function buildCase(path: PathItem, index: number): ConstraintsCase {
  const inputs: Record<string, unknown> = {};
  const typeMap: Record<string, InferredType> = {};

  for (const constraint of path.constraints) {
    collectExprTypes(constraint.expr, typeMap);
  }
  collectExprTypes(path.outcome.expr, typeMap);

  for (const constraint of path.constraints) {
    satisfyExpr(constraint.expr, constraint.value, inputs, typeMap);
  }

  fillMissingInputs(inputs, typeMap);

  if (path.outcome.type === 'throw') {
    return {
      id: `C${index + 1}`,
      pathId: path.id,
      inputs,
      expected: {
        type: 'throw',
        message: String(evaluateExpr(path.outcome.expr, inputs) ?? ''),
      },
    };
  }

  return {
    id: `C${index + 1}`,
    pathId: path.id,
    inputs,
    expected: {
      type: 'return',
      value: evaluateExpr(path.outcome.expr, inputs),
    },
  };
}

export function createTestCaseSpecification(pathResult: PathInput): ConstraintsOutput {
  if (!pathResult) {
    return {
      function: 'unknown',
      cases: [],
    };
  }

  return {
    function: pathResult.function ?? 'unknown',
    cases: (pathResult.paths ?? []).map((path, index) => buildCase(path, index)),
  };
}
