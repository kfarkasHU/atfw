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
