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
  imports?: Array<{ module: string; names: string[] }>;
  locals?: Record<string, unknown>;
  paths: PathItem[];
};

type ConstraintsCase = {
  id: string;
  pathId: string;
  inputs: Record<string, unknown>;
  stateDescriptions?: Record<string, string>;
  mocks?: Record<string, unknown>;
  expected: {
    type: 'return' | 'throw';
    value?: unknown;
    message?: string;
  };
};

type ConstraintsOutput = {
  function: string;
  imports: Array<{ module: string; names: string[] }>;
  cases: ConstraintsCase[];
};

type TestCaseSpecificationOptions = {
  params?: Array<string | { name: string; type?: string }>;
  paramsByFunction?: Record<string, Array<string | { name: string; type?: string }>>;
};

type InferredType = 'boolean' | 'number' | 'string' | 'object' | 'unknown';

type ParamMeta = {
  name: string;
  type?: string;
};

type ConstraintState = {
  inputs: Record<string, unknown>;
  stateDescriptions: Record<string, string>;
};

function assignVar(inputs: Record<string, unknown>, name: string, value: unknown, overwrite = false) {
  if (overwrite || !(name in inputs)) {
    inputs[name] = value;
  }
}

function assignDescription(stateDescriptions: Record<string, string>, name: string, value: string) {
  stateDescriptions[name] = value;
}

function inferConstType(value: unknown): InferredType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  if (value !== null && typeof value === 'object') return 'object';
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

  if (expr.type === 'IRTypeOf') {
    if (expr.expr?.type === 'IRVar') {
      markType(typeMap, expr.expr.name, 'unknown');
    }
    collectExprTypes(expr.expr, typeMap);
    return;
  }

  if (expr.type === 'IRArray') {
    for (const element of expr.elements ?? []) {
      collectExprTypes(element, typeMap);
    }
    return;
  }

  if (expr.type === 'IRProperty') {
    if (expr.object?.type === 'IRVar') {
      markType(typeMap, expr.object.name, 'object');
    }
    return;
  }

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

    if (expr.op === '===' || expr.op === '!==') {
      const typeOfTarget = extractTypeOfTarget(left) ?? extractTypeOfTarget(right);
      const typeConst = left?.type === 'IRConst' && typeof left.value === 'string'
        ? left.value
        : right?.type === 'IRConst' && typeof right.value === 'string'
          ? right.value
          : null;

      if (typeOfTarget && typeConst && ['string', 'number', 'boolean'].includes(typeConst)) {
        markType(typeMap, typeOfTarget, typeConst as InferredType);
      }
    }

    if (expr.op === '!==') {
      if (left?.type === 'IRVar' && right?.type === 'IRConst') {
        markType(typeMap, left.name, inferConstType(right.value));
      }

      if (left?.type === 'IRConst' && right?.type === 'IRVar') {
        markType(typeMap, right.name, inferConstType(left.value));
      }
    }

    if (['>', '>=', '<', '<='].includes(expr.op)) {
      if (left?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
        markType(typeMap, left.name, 'number');
      }

      if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRVar') {
        markType(typeMap, right.name, 'number');
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
  if (inferredType === 'object') return {};
  return `${name}_value`;
}

function fillMissingInputs(inputs: Record<string, unknown>, typeMap: Record<string, InferredType>) {
  for (const [name, inferredType] of Object.entries(typeMap)) {
    if (!(name in inputs)) {
      inputs[name] = defaultValueForVar(name, inferredType);
    }
  }
}

function normalizeParams(params: Array<string | { name: string; type?: string }>): ParamMeta[] {
  return params.map((param) => {
    if (typeof param === 'string') {
      return { name: param };
    }

    return { name: param.name, type: param.type };
  });
}

function defaultFromDeclaredType(type: string | undefined, name: string): unknown {
  if (!type) return `${name}_value`;

  const normalized = type.replace(/\?$/, '').trim();

  if (normalized === 'boolean') return false;
  if (normalized === 'number') return 1;
  if (normalized === 'string') return `${name}_value`;

  if (normalized.startsWith('{') && normalized.endsWith('}')) {
    const content = normalized.slice(1, -1).trim();
    if (!content) return {};

    const objectValue: Record<string, unknown> = {};
    const members = content.split(/[;,]/).map((member) => member.trim()).filter(Boolean);

    for (const member of members) {
      const match = member.match(/^([A-Za-z0-9_]+)\??\s*:\s*(.+)$/);
      if (!match) continue;

      const [, property, propertyTypeRaw] = match;
      const propertyType = propertyTypeRaw.trim();

      if (propertyType === 'boolean') {
        objectValue[property] = false;
      } else if (propertyType === 'number') {
        objectValue[property] = 1;
      } else if (propertyType === 'string') {
        objectValue[property] = `${property}_value`;
      } else {
        objectValue[property] = null;
      }
    }

    return objectValue;
  }

  return `${name}_value`;
}

function fillMissingParams(inputs: Record<string, unknown>, params: ParamMeta[], typeMap: Record<string, InferredType>) {
  for (const param of params) {
    if (!(param.name in inputs)) {
      const inferredType = typeMap[param.name] ?? 'unknown';
      if (inferredType !== 'unknown') {
        inputs[param.name] = defaultValueForVar(param.name, inferredType);
      } else {
        inputs[param.name] = defaultFromDeclaredType(param.type, param.name);
      }
    }
  }
}

function alternativeValue(current: unknown): unknown {
  if (typeof current === 'string') {
    if (/^[A-Za-z][A-Za-z0-9 _-]*$/.test(current) && !current.startsWith('not ')) {
      return `not ${current}`;
    }

    return `${current}_x`;
  }
  if (typeof current === 'number') return current + 1;
  if (typeof current === 'boolean') return !current;
  return 'x';
}

function sampleValueForPrimitiveType(typeName: string, variableName: string): unknown {
  if (typeName === 'string') return `${variableName}_value`;
  if (typeName === 'number') return 1;
  if (typeName === 'boolean') return true;
  return `${variableName}_value`;
}

function sampleNonMatchingPrimitiveValue(typeName: string): unknown {
  if (['string', 'number', 'boolean'].includes(typeName)) return {};
  return {};
}

function sampleNegativeWitnesses(): unknown[] {
  return [{}, null, undefined];
}

function extractTypeOfTarget(expr: IrExpr | null | undefined): string | null {
  if (!expr) return null;

  if (expr.type === 'IRTypeOf' && expr.expr?.type === 'IRVar') {
    return expr.expr.name;
  }

  if (expr.type === 'IRUnknown' && typeof expr.value?.text === 'string') {
    const match = expr.value.text.match(/^typeof\s+([A-Za-z0-9_]+)$/);
    if (match) return match[1];
  }

  return null;
}

function extractStringArray(expr: IrExpr | null | undefined): string[] | null {
  if (!expr || expr.type !== 'IRArray') return null;

  const strings = (expr.elements ?? []).map((value: IrExpr) => {
    if (value.type !== 'IRConst' || typeof value.value !== 'string') return null;
    return value.value;
  });

  return strings.every((value: string | null) => typeof value === 'string') ? (strings as string[]) : null;
}

function describeConstraintValue(value: unknown, negated: boolean): string {
  const rendered = typeof value === 'string' ? `'${value}'` : JSON.stringify(value);
  return negated ? `not ${rendered}` : rendered;
}

function truthyValueForType(name: string, inferredType: InferredType): unknown {
  if (inferredType === 'boolean') return true;
  if (inferredType === 'number') return 1;
  if (inferredType === 'string') return `${name}_value`;
  if (inferredType === 'object') return {};
  return true;
}

function falsyValueForType(inferredType: InferredType): unknown {
  if (inferredType === 'boolean') return false;
  if (inferredType === 'number') return 0;
  if (inferredType === 'string') return '';
  if (inferredType === 'object') return null;
  return false;
}

function comparisonWitnessValues(comparator: string, constant: number, expected: boolean): number[] {
  if (comparator === '>') return expected ? [constant + 1] : [constant, constant - 1];
  if (comparator === '>=') return expected ? [constant, constant + 1] : [constant - 1];
  if (comparator === '<') return expected ? [constant - 1] : [constant, constant + 1];
  if (comparator === '<=') return expected ? [constant, constant - 1] : [constant + 1];
  return [constant];
}

function arrayWithLength(length: number): unknown[] {
  const safeLength = Math.max(0, length);
  return Array.from({ length: safeLength }, (_, index) => index + 1);
}

function arrayWitnessesForComparison(comparator: string, constant: number, expected: boolean): unknown[][] {
  return comparisonWitnessValues(comparator, constant, expected).map((value) => arrayWithLength(value));
}

function defaultIncludesSearchValue(): unknown {
  return 1;
}

function isBooleanLikeExpr(expr: IrExpr | null | undefined): boolean {
  if (!expr) return false;

  if (expr.type === 'IRVar' || expr.type === 'IRProperty' || expr.type === 'IRUnary') {
    return true;
  }

  if (expr.type === 'IRCall') {
    return expr.callee?.type === 'IRProperty' && ['isArray', 'includes'].includes(expr.callee.property);
  }

  return expr.type === 'IRBinary' && ['===', '!==', '&&', '||', '>', '>=', '<', '<='].includes(expr.op);
}

function expandConstraintVariants(
  expr: IrExpr | null | undefined,
  expected: boolean,
  state: ConstraintState,
  typeMap: Record<string, InferredType>,
): ConstraintState[] {
  if (!expr) return [{ inputs: { ...state.inputs }, stateDescriptions: { ...state.stateDescriptions } }];

  if (expr.type === 'IRUnary' && expr.op === '!') {
    return expandConstraintVariants(expr.expr, !expected, state, typeMap);
  }

  if (expr.type === 'IRBinary' && expr.op === '&&') {
    if (expected) {
      return expandConstraintVariants(expr.left, true, state, typeMap)
        .flatMap((nextState) => expandConstraintVariants(expr.right, true, nextState, typeMap));
    }

    return [
      ...expandConstraintVariants(expr.left, false, { inputs: { ...state.inputs }, stateDescriptions: { ...state.stateDescriptions } }, typeMap),
      ...expandConstraintVariants(expr.left, true, { inputs: { ...state.inputs }, stateDescriptions: { ...state.stateDescriptions } }, typeMap)
        .flatMap((nextState) => expandConstraintVariants(expr.right, false, nextState, typeMap)),
    ];
  }

  if (expr.type === 'IRBinary' && expr.op === '||') {
    if (expected) {
      return [
        ...expandConstraintVariants(expr.left, true, { inputs: { ...state.inputs }, stateDescriptions: { ...state.stateDescriptions } }, typeMap),
        ...expandConstraintVariants(expr.left, false, { inputs: { ...state.inputs }, stateDescriptions: { ...state.stateDescriptions } }, typeMap)
          .flatMap((nextState) => expandConstraintVariants(expr.right, true, nextState, typeMap)),
      ];
    }

    return expandConstraintVariants(expr.left, false, state, typeMap)
      .flatMap((nextState) => expandConstraintVariants(expr.right, false, nextState, typeMap));
  }

  if (expr.type === 'IRBinary' && ['>', '>=', '<', '<='].includes(expr.op)) {
    const left = expr.left;
    const right = expr.right;

    if (left?.type === 'IRProperty' && left.property === 'length' && left.object?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      markType(typeMap, left.object.name, 'object');
      return arrayWitnessesForComparison(expr.op, right.value, expected).map((value) => ({
        inputs: {
          ...state.inputs,
          [left.object.name]: value,
        },
        stateDescriptions: { ...state.stateDescriptions },
      }));
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRProperty' && right.property === 'length' && right.object?.type === 'IRVar') {
      const reversedComparator: Record<string, string> = {
        '>': '<',
        '>=': '<=',
        '<': '>',
        '<=': '>=',
      };

      markType(typeMap, right.object.name, 'object');
      return arrayWitnessesForComparison(reversedComparator[expr.op], left.value, expected).map((value) => ({
        inputs: {
          ...state.inputs,
          [right.object.name]: value,
        },
        stateDescriptions: { ...state.stateDescriptions },
      }));
    }

    if (left?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      markType(typeMap, left.name, 'number');
      return comparisonWitnessValues(expr.op, right.value, expected).map((value) => ({
        inputs: {
          ...state.inputs,
          [left.name]: value,
        },
        stateDescriptions: { ...state.stateDescriptions },
      }));
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRVar') {
      const reversedComparator: Record<string, string> = {
        '>': '<',
        '>=': '<=',
        '<': '>',
        '<=': '>=',
      };

      markType(typeMap, right.name, 'number');
      return comparisonWitnessValues(reversedComparator[expr.op], left.value, expected).map((value) => ({
        inputs: {
          ...state.inputs,
          [right.name]: value,
        },
        stateDescriptions: { ...state.stateDescriptions },
      }));
    }
  }

  if (expr.type === 'IRBinary' && ['===', '!=='].includes(expr.op)) {
    const left = expr.left;
    const right = expr.right;

    if (left?.type === 'IRProperty' && left.property === 'length' && left.object?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      markType(typeMap, left.object.name, 'object');
      const existing = state.inputs[left.object.name];
      const existingLength = Array.isArray(existing) ? existing.length : null;
      const alreadySatisfies = existingLength !== null
        ? (expr.op === '===' ? (existingLength === right.value) === expected : (existingLength !== right.value) === expected)
        : false;

      const witnessLength = alreadySatisfies
        ? existingLength!
        : expr.op === '==='
          ? (expected ? right.value : right.value + 1)
          : (expected ? right.value + 1 : right.value);

      return [{
        inputs: {
          ...state.inputs,
          [left.object.name]: arrayWithLength(witnessLength),
        },
        stateDescriptions: { ...state.stateDescriptions },
      }];
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRProperty' && right.property === 'length' && right.object?.type === 'IRVar') {
      markType(typeMap, right.object.name, 'object');
      const existing = state.inputs[right.object.name];
      const existingLength = Array.isArray(existing) ? existing.length : null;
      const alreadySatisfies = existingLength !== null
        ? (expr.op === '===' ? (existingLength === left.value) === expected : (existingLength !== left.value) === expected)
        : false;

      const witnessLength = alreadySatisfies
        ? existingLength!
        : expr.op === '==='
          ? (expected ? left.value : left.value + 1)
          : (expected ? left.value + 1 : left.value);

      return [{
        inputs: {
          ...state.inputs,
          [right.object.name]: arrayWithLength(witnessLength),
        },
        stateDescriptions: { ...state.stateDescriptions },
      }];
    }
  }

  if (expr.type === 'IRCall' && expr.callee?.type === 'IRProperty' && expr.callee.property === 'isArray') {
    const target = expr.args?.[0];
    if (target?.type === 'IRVar') {
      markType(typeMap, target.name, 'object');
      return [{
        inputs: {
          ...state.inputs,
          [target.name]: expected ? [] : {},
        },
        stateDescriptions: { ...state.stateDescriptions },
      }];
    }
  }

  if (expr.type === 'IRCall' && expr.callee?.type === 'IRProperty' && expr.callee.property === 'includes') {
    const typeTarget = extractTypeOfTarget(expr.args?.[0]);
    const primitiveTypes = extractStringArray(expr.callee.object);

    if (typeTarget && primitiveTypes?.length) {
      const matchingTypes = primitiveTypes.filter((value) => ['string', 'number', 'boolean'].includes(value));

      if (expected) {
        return matchingTypes.map((typeName) => ({
          inputs: {
            ...state.inputs,
            [typeTarget]: sampleValueForPrimitiveType(typeName, typeTarget),
          },
          stateDescriptions: { ...state.stateDescriptions },
        }));
      }

      return sampleNegativeWitnesses().map((witness) => ({
        inputs: {
          ...state.inputs,
          [typeTarget]: witness,
        },
        stateDescriptions: { ...state.stateDescriptions },
      }));
    }

    if (expr.callee.object?.type === 'IRVar') {
      const arrayName = expr.callee.object.name;
      const searchArg = expr.args?.[0];
      const searchValue = searchArg?.type === 'IRConst' ? searchArg.value : defaultIncludesSearchValue();

      const nextInputs = {
        ...state.inputs,
        [arrayName]: expected ? [searchValue] : [],
      } as Record<string, unknown>;

      if (searchArg?.type === 'IRVar') {
        nextInputs[searchArg.name] = searchValue;
      }

      markType(typeMap, arrayName, 'object');

      return [{
        inputs: nextInputs,
        stateDescriptions: { ...state.stateDescriptions },
      }];
    }
  }

  const nextState: ConstraintState = {
    inputs: { ...state.inputs },
    stateDescriptions: { ...state.stateDescriptions },
  };
  satisfyExpr(expr, expected, nextState.inputs, typeMap, nextState.stateDescriptions);
  return [nextState];
}

function getCalleeName(expr: IrExpr | null | undefined): string | null {
  if (!expr) return null;
  if (expr.type === 'IRVar') return expr.name;
  if (expr.type === 'IRCall') {
    return getCalleeName(expr.callee);
  }
  return null;
}

function evaluateExpr(
  expr: IrExpr | null | undefined,
  inputs: Record<string, unknown>,
  locals: Record<string, unknown>,
  mocks: Record<string, unknown>,
): unknown {
  if (!expr) return null;

  if (expr.type === 'IRConst') return expr.value;

  if (expr.type === 'IRArray') {
    return (expr.elements ?? []).map((element: IrExpr) => evaluateExpr(element, inputs, locals, mocks));
  }

  if (expr.type === 'IRTypeOf') {
    return typeof evaluateExpr(expr.expr, inputs, locals, mocks);
  }

  if (expr.type === 'IRVar') {
    if (expr.name === 'undefined') return 'undefined';
    if (expr.name in locals) return locals[expr.name];
    if (expr.name in inputs) return inputs[expr.name];
    if (expr.name in mocks) return mocks[expr.name];
    return expr.name;
  }

  if (expr.type === 'IRCall') {
    const calleeName = getCalleeName(expr.callee);
    if (calleeName && calleeName in mocks) {
      return mocks[calleeName];
    }

    if (expr.callee?.type === 'IRProperty' && expr.callee.property === 'isArray') {
      return Array.isArray(evaluateExpr(expr.args?.[0], inputs, locals, mocks));
    }

    if (expr.callee?.type === 'IRProperty' && expr.callee.property === 'includes') {
      const collection = evaluateExpr(expr.callee.object, inputs, locals, mocks);
      const searchValue = evaluateExpr(expr.args?.[0], inputs, locals, mocks);
      if (Array.isArray(collection)) {
        return collection.includes(searchValue);
      }
    }

    return null;
  }

  if (expr.type === 'IRProperty') {
    const objectValue = evaluateExpr(expr.object, inputs, locals, mocks);
    if (objectValue && typeof objectValue === 'object') {
      return (objectValue as Record<string, unknown>)[expr.property];
    }
    return null;
  }

  if (expr.type === 'IRConditional') {
    const conditionValue = evaluateExpr(expr.condition, inputs, locals, mocks);
    if (conditionValue === true) {
      return evaluateExpr(expr.whenTrue, inputs, locals, mocks);
    }
    if (conditionValue === false) {
      return evaluateExpr(expr.whenFalse, inputs, locals, mocks);
    }
    return null;
  }

  if (expr.type === 'IRUnary' && expr.op === '!') {
    return !Boolean(evaluateExpr(expr.expr, inputs, locals, mocks));
  }

  if (expr.type === 'IRBinary') {
    const leftValue = evaluateExpr(expr.left, inputs, locals, mocks);
    const rightValue = evaluateExpr(expr.right, inputs, locals, mocks);

    if (expr.op === '===') return leftValue === rightValue;
    if (expr.op === '!==') return leftValue !== rightValue;
    if (expr.op === '&&') return Boolean(leftValue) && Boolean(rightValue);
    if (expr.op === '||') return Boolean(leftValue) || Boolean(rightValue);
    if (expr.op === '>') return Number(leftValue) > Number(rightValue);
    if (expr.op === '>=') return Number(leftValue) >= Number(rightValue);
    if (expr.op === '<') return Number(leftValue) < Number(rightValue);
    if (expr.op === '<=') return Number(leftValue) <= Number(rightValue);
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

function expandExpectedOutcomes(
  expr: IrExpr | null | undefined,
  inputs: Record<string, unknown>,
  locals: Record<string, unknown>,
  importedNames: Set<string>,
  mocks: Record<string, unknown> = {},
): Array<{ value: unknown; mocks: Record<string, unknown>; inputs?: Record<string, unknown> }> {
  if (!expr) {
    return [{ value: null, mocks }];
  }

  if (expr.type === 'IRCall') {
    const calleeName = getCalleeName(expr.callee);
    if (calleeName && importedNames.has(calleeName)) {
      return [
        { value: true, mocks: { ...mocks, [calleeName]: true } },
        { value: false, mocks: { ...mocks, [calleeName]: false } },
      ];
    }
  }

  if (expr.type === 'IRConditional') {
    const calleeName = getCalleeName(expr.condition);
    if (calleeName && importedNames.has(calleeName)) {
      return [
        ...expandExpectedOutcomes(expr.whenTrue, inputs, locals, importedNames, { ...mocks, [calleeName]: true }),
        ...expandExpectedOutcomes(expr.whenFalse, inputs, locals, importedNames, { ...mocks, [calleeName]: false }),
      ];
    }

    const conditionValue = evaluateExpr(expr.condition, inputs, locals, mocks);
    if (conditionValue === true) {
      return expandExpectedOutcomes(expr.whenTrue, inputs, locals, importedNames, mocks);
    }

    if (conditionValue === false) {
      return expandExpectedOutcomes(expr.whenFalse, inputs, locals, importedNames, mocks);
    }

    return [{ value: evaluateExpr(expr, inputs, locals, mocks), mocks }];
  }

  if (isBooleanLikeExpr(expr)) {
    const typeMap: Record<string, InferredType> = {};
    collectExprTypes(expr, typeMap);

    const outcomes = [true, false].flatMap((expected) =>
      expandConstraintVariants(expr, expected, { inputs: { ...inputs }, stateDescriptions: {} }, typeMap).map((state) => ({
        value: expected,
        mocks,
        inputs: state.inputs,
        stateDescriptions: state.stateDescriptions,
      })),
    );

    if (outcomes.length) {
      return outcomes.filter((outcome) => evaluateExpr(expr, { ...inputs, ...(outcome.inputs ?? {}) }, locals, outcome.mocks) === outcome.value);
    }
  }

  return [{ value: evaluateExpr(expr, inputs, locals, mocks), mocks }];
}

function satisfyExpr(
  expr: IrExpr | null | undefined,
  expected: boolean,
  inputs: Record<string, unknown>,
  typeMap: Record<string, InferredType>,
  stateDescriptions: Record<string, string> = {},
) {
  if (!expr) return;

  if (expr.type === 'IRUnary' && expr.op === '!' && expr.expr?.type === 'IRVar') {
    markType(typeMap, expr.expr.name, 'boolean');
    assignVar(inputs, expr.expr.name, !expected);
    return;
  }

  if (expr.type === 'IRVar') {
    if (expr.name === 'undefined') return;
    const inferredType = typeMap[expr.name] ?? 'unknown';
    if (inferredType === 'unknown') {
      markType(typeMap, expr.name, 'boolean');
      assignVar(inputs, expr.name, expected);
      return;
    }

    assignVar(inputs, expr.name, expected ? truthyValueForType(expr.name, inferredType) : falsyValueForType(inferredType), true);
    return;
  }

  if (expr.type === 'IRProperty') {
    const targetObject = expr.object;
    if (targetObject?.type === 'IRVar' && expr.property) {
      markType(typeMap, targetObject.name, 'object');
      const current = inputs[targetObject.name];
      const objectValue = current && typeof current === 'object' ? { ...(current as Record<string, unknown>) } : {};
      objectValue[expr.property] = expected;
      assignVar(inputs, targetObject.name, objectValue, true);
    }
    return;
  }

  if (expr.type === 'IRCall' && expr.callee?.type === 'IRProperty' && expr.callee.property === 'includes') {
    const targetArray = expr.callee.object;
    if (targetArray?.type === 'IRVar') {
      const searchArg = expr.args?.[0];
      const searchValue = searchArg?.type === 'IRConst' ? searchArg.value : defaultIncludesSearchValue();
      assignVar(inputs, targetArray.name, expected ? [searchValue] : [], true);
      markType(typeMap, targetArray.name, 'object');

      if (searchArg?.type === 'IRVar') {
        assignVar(inputs, searchArg.name, searchValue, true);
      }
    }
    return;
  }

  if (expr.type === 'IRCall' && expr.callee?.type === 'IRProperty' && expr.callee.property === 'isArray') {
    const target = expr.args?.[0];
    if (target?.type === 'IRVar') {
      markType(typeMap, target.name, 'object');
      assignVar(inputs, target.name, expected ? [] : {}, true);
    }
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

    const typeTarget = extractTypeOfTarget(left) ?? extractTypeOfTarget(right);
    const typeConst = left?.type === 'IRConst' && typeof left.value === 'string'
      ? left.value
      : right?.type === 'IRConst' && typeof right.value === 'string'
        ? right.value
        : null;

    if (typeTarget && typeConst && ['string', 'number', 'boolean'].includes(typeConst)) {
      markType(typeMap, typeTarget, typeConst as InferredType);
      assignVar(inputs, typeTarget, expected ? sampleNonMatchingPrimitiveValue(typeConst) : sampleValueForPrimitiveType(typeConst, typeTarget), true);
      assignDescription(stateDescriptions, typeTarget, describeConstraintValue(typeConst, expected));
      return;
    }

    if (left?.type === 'IRVar' && right?.type === 'IRConst') {
      markType(typeMap, left.name, inferConstType(right.value));
      assignVar(inputs, left.name, expected ? alternativeValue(right.value) : right.value, true);
      assignDescription(stateDescriptions, left.name, describeConstraintValue(right.value, expected));
      return;
    }

    if (left?.type === 'IRConst' && right?.type === 'IRVar') {
      markType(typeMap, right.name, inferConstType(left.value));
      assignVar(inputs, right.name, expected ? alternativeValue(left.value) : left.value, true);
      assignDescription(stateDescriptions, right.name, describeConstraintValue(left.value, expected));
      return;
    }
  }

  if (expr.type === 'IRBinary' && expr.op === '===') {
    const left = expr.left;
    const right = expr.right;

    if (left?.type === 'IRProperty' && left.property === 'length' && left.object?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      markType(typeMap, left.object.name, 'object');
      const witnessLength = expected ? right.value : right.value + 1;
      assignVar(inputs, left.object.name, arrayWithLength(witnessLength), true);
      return;
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRProperty' && right.property === 'length' && right.object?.type === 'IRVar') {
      markType(typeMap, right.object.name, 'object');
      const witnessLength = expected ? left.value : left.value + 1;
      assignVar(inputs, right.object.name, arrayWithLength(witnessLength), true);
      return;
    }

    const typeTarget = extractTypeOfTarget(left) ?? extractTypeOfTarget(right);
    const typeConst = left?.type === 'IRConst' && typeof left.value === 'string'
      ? left.value
      : right?.type === 'IRConst' && typeof right.value === 'string'
        ? right.value
        : null;

    if (typeTarget && typeConst && ['string', 'number', 'boolean'].includes(typeConst)) {
      markType(typeMap, typeTarget, typeConst as InferredType);
      assignVar(inputs, typeTarget, expected ? sampleValueForPrimitiveType(typeConst, typeTarget) : sampleNonMatchingPrimitiveValue(typeConst), true);
      assignDescription(stateDescriptions, typeTarget, describeConstraintValue(typeConst, !expected));
      return;
    }

    if (left?.type === 'IRVar' && right?.type === 'IRVar' && right.name === 'undefined') {
      markType(typeMap, left.name, 'unknown');
      assignVar(inputs, left.name, expected ? undefined : alternativeValue(undefined), true);
      assignDescription(stateDescriptions, left.name, describeConstraintValue(undefined, !expected));
      return;
    }

    if (left?.type === 'IRVar' && right?.type === 'IRConst') {
      markType(typeMap, left.name, inferConstType(right.value));
      assignVar(inputs, left.name, expected ? right.value : alternativeValue(right.value), true);
      assignDescription(stateDescriptions, left.name, describeConstraintValue(right.value, !expected));
      return;
    }

    if (left?.type === 'IRConst' && right?.type === 'IRVar') {
      if (left.value === 'undefined') {
        markType(typeMap, right.name, 'unknown');
        assignVar(inputs, right.name, expected ? undefined : alternativeValue(undefined), true);
        assignDescription(stateDescriptions, right.name, describeConstraintValue(undefined, !expected));
        return;
      }

      markType(typeMap, right.name, inferConstType(left.value));
      assignVar(inputs, right.name, expected ? left.value : alternativeValue(left.value), true);
      assignDescription(stateDescriptions, right.name, describeConstraintValue(left.value, !expected));
      return;
    }
  }

  if (expr.type === 'IRBinary' && ['>', '>=', '<', '<='].includes(expr.op)) {
    const left = expr.left;
    const right = expr.right;

    if (left?.type === 'IRProperty' && left.property === 'length' && left.object?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      markType(typeMap, left.object.name, 'object');
      assignVar(inputs, left.object.name, arrayWithLength(comparisonWitnessValues(expr.op, right.value, expected)[0]), true);
      return;
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRProperty' && right.property === 'length' && right.object?.type === 'IRVar') {
      const reversedComparator: Record<string, string> = {
        '>': '<',
        '>=': '<=',
        '<': '>',
        '<=': '>=',
      };

      markType(typeMap, right.object.name, 'object');
      assignVar(inputs, right.object.name, arrayWithLength(comparisonWitnessValues(reversedComparator[expr.op], left.value, expected)[0]), true);
      return;
    }

    const assignFromComparison = (
      variableName: string,
      comparator: string,
      constant: number,
      shouldSatisfy: boolean,
    ) => {
      markType(typeMap, variableName, 'number');

      let value = constant;
      if (comparator === '>') value = shouldSatisfy ? constant + 1 : constant;
      if (comparator === '>=') value = shouldSatisfy ? constant : constant - 1;
      if (comparator === '<') value = shouldSatisfy ? constant - 1 : constant;
      if (comparator === '<=') value = shouldSatisfy ? constant : constant + 1;

      assignVar(inputs, variableName, value, true);
    };

    if (left?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      assignFromComparison(left.name, expr.op, right.value, expected);
      return;
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRVar') {
      const reversedComparator: Record<string, string> = {
        '>': '<',
        '>=': '<=',
        '<': '>',
        '<=': '>=',
      };
      assignFromComparison(right.name, reversedComparator[expr.op], left.value, expected);
      return;
    }
  }

  if (expr.type === 'IRBinary' && expr.op === '!==') {
    const left = expr.left;
    const right = expr.right;

    if (left?.type === 'IRProperty' && left.property === 'length' && left.object?.type === 'IRVar' && right?.type === 'IRConst' && typeof right.value === 'number') {
      markType(typeMap, left.object.name, 'object');
      const witnessLength = expected ? right.value + 1 : right.value;
      assignVar(inputs, left.object.name, arrayWithLength(witnessLength), true);
      return;
    }

    if (left?.type === 'IRConst' && typeof left.value === 'number' && right?.type === 'IRProperty' && right.property === 'length' && right.object?.type === 'IRVar') {
      markType(typeMap, right.object.name, 'object');
      const witnessLength = expected ? left.value + 1 : left.value;
      assignVar(inputs, right.object.name, arrayWithLength(witnessLength), true);
      return;
    }
  }
}

function buildCase(
  path: PathItem,
  index: number,
  params: ParamMeta[],
  imports: Array<{ module: string; names: string[] }>,
  locals: Record<string, unknown>,
): ConstraintsCase[] {
  const typeMap: Record<string, InferredType> = {};
  const importedNames = new Set<string>(imports.flatMap((item) => item.names));

  for (const constraint of path.constraints) {
    collectExprTypes(constraint.expr, typeMap);
  }
  collectExprTypes(path.outcome.expr, typeMap);

  const inputStates = path.constraints.reduce<ConstraintState[]>(
    (states, constraint) => states.flatMap((state) => expandConstraintVariants(constraint.expr, constraint.value, state, typeMap)),
    [{ inputs: {}, stateDescriptions: {} }],
  );

  const cases: ConstraintsCase[] = [];

  for (const state of inputStates) {
    const baseInputs = { ...state.inputs };
    const baseStateDescriptions = { ...state.stateDescriptions };
    fillMissingInputs(baseInputs, typeMap);
    fillMissingParams(baseInputs, params, typeMap);

    const expandedOutcomes = expandExpectedOutcomes(path.outcome.expr, baseInputs, locals, importedNames);

    for (const expandedOutcome of expandedOutcomes) {
      const caseInputs = {
        ...baseInputs,
        ...(expandedOutcome.inputs ?? {}),
      };

      fillMissingInputs(caseInputs, typeMap);
      fillMissingParams(caseInputs, params, typeMap);

      cases.push({
        id: `C${index + 1}.${cases.length + 1}`,
        pathId: path.id,
        inputs: caseInputs,
        stateDescriptions: {
          ...baseStateDescriptions,
          ...((expandedOutcome as { stateDescriptions?: Record<string, string> }).stateDescriptions ?? {}),
        },
        mocks: expandedOutcome.mocks,
        expected: path.outcome.type === 'throw'
          ? {
              type: 'throw' as const,
              message: String(expandedOutcome.value ?? ''),
            }
          : {
              type: 'return' as const,
              value: expandedOutcome.value,
            },
      });
    }
  }

  return cases;
}

export function createTestCaseSpecification(
  pathResult: PathInput | PathInput[],
  options: TestCaseSpecificationOptions = {},
): ConstraintsOutput[] {
  if (!pathResult) return [];

  const pathResults = Array.isArray(pathResult) ? pathResult : [pathResult];

  return pathResults
    .filter(Boolean)
    .map((singlePathResult) => {
      const paramsFromMap = options.paramsByFunction?.[singlePathResult.function ?? 'unknown'] ?? [];
      const params = normalizeParams(paramsFromMap.length ? paramsFromMap : (options.params ?? []));
      const imports = singlePathResult.imports ?? [];
      const locals = singlePathResult.locals ?? {};

      return {
        function: singlePathResult.function ?? 'unknown',
        imports,
        cases: (singlePathResult.paths ?? []).flatMap((path, index) => buildCase(path, index, params, imports, locals)),
      };
    });
}
