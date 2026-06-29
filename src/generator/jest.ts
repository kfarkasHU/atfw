import path from 'node:path';
import { TestCaseSpecification, TestCaseSpecifications } from './model';

type JestGeneratorOptions = {
  functionName: string;
  parameterOrder: string[];
  functionNames?: string[];
  parameterOrderByFunction?: Record<string, string[]>;
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

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(', ')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entryValue]) => `${JSON.stringify(key)}: ${stableSerialize(entryValue)}`);

  return `{${entries.join(', ')}}`;
}

function toStateMessage(testCase: TestCaseSpecification['cases'][number], parameterOrder: string[]): string {
  const orderedKeys = parameterOrder.filter((name) => name in testCase.inputs);
  const otherKeys = Object.keys(testCase.inputs)
    .filter((name) => !orderedKeys.includes(name))
    .sort((a, b) => a.localeCompare(b));

  const keys = [...orderedKeys, ...otherKeys];
  if (!keys.length) {
    return 'the inputs are defaulted';
  }

  const parts = keys.map((key) => `${key} is ${stableSerialize(testCase.inputs[key])}`);
  return parts.join(', ');
}

function toOutcomeMessage(testCase: TestCaseSpecification['cases'][number]): string {
  if (testCase.expected.type === 'throw') {
    if (testCase.expected.message) {
      return `should throw an error with message ${JSON.stringify(testCase.expected.message)}`;
    }
    return 'should throw an error';
  }

  if (testCase.expected.value === 'undefined') {
    return 'should return undefined';
  }

  return `should return ${stableSerialize(testCase.expected.value)}`;
}

function buildSuite(spec: TestCaseSpecification, callableName: string, parameterOrder: string[]): string {
  const testBlocks = (spec.cases ?? []).map((testCase) => {
    const args = parameterOrder
      .map((param) => renderJsValue(testCase.inputs[param]))
      .join(', ');
    const stateMessage = toStateMessage(testCase, parameterOrder);
    const outcomeMessage = toOutcomeMessage(testCase);

    if (testCase.expected.type === 'throw') {
      return [
        `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
        `        it(${JSON.stringify(outcomeMessage)}, () => {`,
        `          expect(() => ${callableName}(${args})).toThrow(${JSON.stringify(testCase.expected.message ?? '')});`,
        '        });',
        '      });',
      ].join('\n');
    }

    if (testCase.expected.value === 'undefined') {
      return [
        `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
        `        it(${JSON.stringify(outcomeMessage)}, () => {`,
        `          const result = ${callableName}(${args});`,
        '          expect(result).toBeUndefined();',
        '        });',
        '      });',
      ].join('\n');
    }

    return [
      `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
      `        it(${JSON.stringify(outcomeMessage)}, () => {`,
      `          const result = ${callableName}(${args});`,
      `          expect(result).toEqual(${renderJsValue(testCase.expected.value)});`,
      '        });',
      '      });',
    ].join('\n');
  });

  const body = testBlocks.length
    ? testBlocks.join('\n\n')
    : `      describe('and no cases are available', () => {\n        it('then it should keep the suite deterministic', () => {\n          expect(true).toBe(true);\n        });\n      });`;

  return [
    `describe(${JSON.stringify(`${spec.function ?? callableName}Specs`)}, () => {`,
    `  describe('given the test is initialized', () => {`,
    `    describe(${JSON.stringify(`when I call ${callableName}()`)}, () => {`,
    body,
    '    });',
    '  });',
    '});',
  ].join('\n');
}

export function createJestTests(spec: TestCaseSpecification | TestCaseSpecifications, options: JestGeneratorOptions): string {
  const importSpecifier = toImportSpecifier(options.outputFilePath, options.sourceFilePath);
  const specs = Array.isArray(spec) ? spec : [spec];
  const functionNames = options.functionNames && options.functionNames.length
    ? options.functionNames
    : specs.map((item) => item.function).filter(Boolean);

  const importList = functionNames.length ? functionNames : [options.functionName];

  const suites = specs.map((singleSpec) => {
    const callableName = singleSpec.function ?? options.functionName;
    const parameterOrder = options.parameterOrderByFunction?.[callableName] ?? options.parameterOrder;

    return buildSuite(singleSpec, callableName, parameterOrder);
  });

  return [
    `import { ${importList.join(', ')} } from ${JSON.stringify(importSpecifier)};`,
    '',
    suites.join('\n\n'),
    '',
  ].join('\n');
}
