type TestCase = {
  id: string;
  pathId: string;
  inputs: Record<string, unknown>;
  expected: {
    type: 'return' | 'throw';
    value?: unknown;
    message?: string;
  };
};

export type TestCaseSpecification = {
  function: string;
  cases: TestCase[];
};

export type TestCaseSpecifications = TestCaseSpecification[];
