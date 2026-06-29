import path from 'node:path';
import { TestCaseSpecification } from './model';

type JestGeneratorOptions = {
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

export function createJestTests(spec: TestCaseSpecification, options: JestGeneratorOptions): string {
  const importSpecifier = toImportSpecifier(options.outputFilePath, options.sourceFilePath);
  const callableName = options.functionName;

  const testBlocks = (spec.cases ?? []).map((testCase) => {
    const args = options.parameterOrder
      .map((param) => renderJsValue(testCase.inputs[param]))
      .join(', ');
    const stateMessage = toStateMessage(testCase, options.parameterOrder);
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
    `import { ${options.functionName} } from ${JSON.stringify(importSpecifier)};`,
    '',
    `describe(${JSON.stringify(`${spec.function ?? options.functionName} Specs`)}, () => {`,
    `  describe('given the test is initialized', () => {`,
    `    describe(${JSON.stringify(`when I call ${callableName}()`)}, () => {`,
    body,
    '    });',
    '  });',
    '});',
    '',
  ].join('\n');
}
