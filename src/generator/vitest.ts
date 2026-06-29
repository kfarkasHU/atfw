import path from 'node:path';

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

type TestCaseSpecification = {
  function: string;
  cases: TestCase[];
};

type VitestGeneratorOptions = {
  functionName: string;
  parameterOrder: string[];
  sourceFilePath: string;
  outputFilePath: string;
};

function stripExtension(filePath: string): string {
  return filePath.replace(/\.[^.]+$/, '');
}

function toImportSpecifier(outputFilePath: string, sourceFilePath: string): string {
  const fromDir = path.dirname(outputFilePath);
  const relativePath = path.relative(fromDir, sourceFilePath);
  const normalized = stripExtension(relativePath).split(path.sep).join('/');

  if (normalized.startsWith('.')) return normalized;
  return `./${normalized}`;
}

function renderJsValue(value: unknown): string {
  if (typeof value === 'string') {
    if (value === 'undefined') return 'undefined';
    return JSON.stringify(value);
  }

  if (value === undefined) return 'undefined';
  return JSON.stringify(value);
}

export function createVitestTests(spec: TestCaseSpecification, options: VitestGeneratorOptions): string {
  const importSpecifier = toImportSpecifier(options.outputFilePath, options.sourceFilePath);
  const callableName = options.functionName;

  const testBlocks = (spec.cases ?? []).map((testCase) => {
    const args = options.parameterOrder
      .map((param) => renderJsValue(testCase.inputs[param]))
      .join(', ');

    if (testCase.expected.type === 'throw') {
      return [
        `  it(${JSON.stringify(`${testCase.id} (${testCase.pathId}) should throw`)}, () => {`,
        `    expect(() => ${callableName}(${args})).toThrow(${JSON.stringify(testCase.expected.message ?? '')});`,
        '  });',
      ].join('\n');
    }

    if (testCase.expected.value === 'undefined') {
      return [
        `  it(${JSON.stringify(`${testCase.id} (${testCase.pathId}) should return undefined`)}, () => {`,
        `    const result = ${callableName}(${args});`,
        '    expect(result).toBeUndefined();',
        '  });',
      ].join('\n');
    }

    return [
      `  it(${JSON.stringify(`${testCase.id} (${testCase.pathId}) should return expected value`)}, () => {`,
      `    const result = ${callableName}(${args});`,
      `    expect(result).toEqual(${renderJsValue(testCase.expected.value)});`,
      '  });',
    ].join('\n');
  });

  const body = testBlocks.length
    ? testBlocks.join('\n\n')
    : `  it('has no generated cases', () => {\n    expect(true).toBe(true);\n  });`;

  return [
    `import { describe, expect, it } from 'vitest';`,
    `import { ${options.functionName} } from ${JSON.stringify(importSpecifier)};`,
    '',
    `describe(${JSON.stringify(spec.function ?? options.functionName)}, () => {`,
    body,
    '});',
    '',
  ].join('\n');
}
