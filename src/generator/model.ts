type TestCase = {
  id: string;
  pathId: string;
  inputs: Record<string, unknown>;
  stateDescriptions?: Record<string, string>;
  mocks?: Record<string, unknown>;
  callExpectations?: Array<{
    path: string[];
    args: unknown[][];
  }>;
  expected: {
    type: 'return' | 'throw';
    value?: unknown;
    message?: string;
  };
};

type ImportSpec = {
  module: string;
  names: string[];
};

export type TestCaseSpecification = {
  function: string;
  imports: ImportSpec[];
  cases: TestCase[];
};

export type TestCaseSpecifications = TestCaseSpecification[];

type PathDefinition = {
  id: string;
};

export type PathResult = {
  function: string;
  paths: PathDefinition[];
};

export type AstFunction = {
  name: string;
  params?: Array<{ name: string }>;
};

export type TestGenerationInput = {
  sourceFilePath: string;
  outputFilePath: string;
  specs: TestCaseSpecifications;
  functionName: string;
  functionNames: string[];
  parameterOrder: string[];
  parameterOrderByFunction: Record<string, string[]>;
};

type BuildTestGenerationInputArgs = {
  sourceFilePath: string;
  outputFilePath: string;
  astFunctions: AstFunction[];
  paths: PathResult[];
  testCaseSpecifications: TestCaseSpecification | TestCaseSpecifications;
};

function normalizeSpecs(specification: TestCaseSpecification | TestCaseSpecifications): TestCaseSpecifications {
  return Array.isArray(specification) ? specification : [specification];
}

function ensurePathTcsAlignment(paths: PathResult[], specs: TestCaseSpecifications) {
  const pathByFunction = new Map<string, PathResult>();
  const specByFunction = new Map<string, TestCaseSpecification>();

  for (const item of paths ?? []) {
    pathByFunction.set(item.function, item);
  }

  for (const item of specs ?? []) {
    specByFunction.set(item.function, item);
  }

  for (const [functionName] of pathByFunction.entries()) {
    if (!specByFunction.has(functionName)) {
      throw new Error(`[test-generation] Missing TCS for function "${functionName}"`);
    }
  }

  for (const [functionName] of specByFunction.entries()) {
    if (!pathByFunction.has(functionName)) {
      throw new Error(`[test-generation] Missing path data for function "${functionName}"`);
    }
  }

  for (const [functionName, pathResult] of pathByFunction.entries()) {
    const spec = specByFunction.get(functionName);
    if (!spec) continue;

    const pathIds = new Set((pathResult.paths ?? []).map((path) => path.id));
    const casePathIds = new Set((spec.cases ?? []).map((testCase) => testCase.pathId));

    for (const casePathId of casePathIds) {
      if (!pathIds.has(casePathId)) {
        throw new Error(`[test-generation] Missing path for TCS case "${functionName}/${casePathId}"`);
      }
    }
  }
}

export function buildTestGenerationInput(args: BuildTestGenerationInputArgs): TestGenerationInput {
  const specs = normalizeSpecs(args.testCaseSpecifications ?? []);
  ensurePathTcsAlignment(args.paths ?? [], specs);

  const functionNames = (args.astFunctions ?? []).map((item) => item.name).filter(Boolean);
  const parameterOrderByFunction = (args.astFunctions ?? []).reduce((accumulator: Record<string, string[]>, item) => {
    accumulator[item.name] = (item.params ?? []).map((param) => param.name);
    return accumulator;
  }, {});

  const functionName = functionNames[0] ?? specs[0]?.function ?? 'sut';

  return {
    sourceFilePath: args.sourceFilePath,
    outputFilePath: args.outputFilePath,
    specs,
    functionName,
    functionNames,
    parameterOrder: parameterOrderByFunction[functionName] ?? [],
    parameterOrderByFunction,
  };
}
