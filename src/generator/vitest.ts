import path from 'node:path';
import { TestCaseSpecification, TestCaseSpecifications } from './model';

type VitestGeneratorOptions = {
  functionName: string;
  parameterOrder: string[];
  functionNames?: string[];
  parameterOrderByFunction?: Record<string, string[]>;
  sourceFilePath: string;
  outputFilePath: string;
};

function stripExtension(filePath: string): string {
  const extension = path.extname(filePath);
  return extension ? filePath.slice(0, -extension.length) : filePath;
}

function toImportSpecifier(outputFilePath: string, sourceFilePath: string): string {
  const fromDir = path.dirname(outputFilePath);
  const relativePath = path.relative(fromDir, sourceFilePath);
  const normalized = stripExtension(relativePath).split(path.sep).join('/');

  if (normalized.startsWith('.')) return normalized;
  return `./${normalized}`;
}

function resolveImportSpecifier(moduleSpecifier: string, sourceFilePath: string, outputFilePath: string): string {
  const sourceDir = path.dirname(sourceFilePath);
  const fromDir = path.dirname(outputFilePath);
  const rebasedPath = path.join(path.relative(fromDir, sourceDir), moduleSpecifier);
  const normalized = stripExtension(rebasedPath).split(path.sep).join('/');

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

  const parts = keys.map((key) => {
    const description = testCase.stateDescriptions?.[key];
    return `${key} is ${description ?? stableSerialize(testCase.inputs[key])}`;
  });
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

function buildMockModuleDeclarations(
  specs: TestCaseSpecification[],
  options: VitestGeneratorOptions,
): string[] {
  const modules = new Map<string, Set<string>>();

  for (const spec of specs) {
    for (const importSpec of spec.imports ?? []) {
      const resolvedSpecifier = resolveImportSpecifier(importSpec.module, options.sourceFilePath, options.outputFilePath);
      const names = modules.get(resolvedSpecifier) ?? new Set<string>();

      for (const name of importSpec.names ?? []) {
        names.add(name);
      }

      modules.set(resolvedSpecifier, names);
    }
  }

  return Array.from(modules.entries()).map(([moduleSpecifier, names]) => {
    const factoryEntries = Array.from(names).map((name) => `${name}: vi.fn()`);
    return `vi.mock(${JSON.stringify(moduleSpecifier)}, () => ({ ${factoryEntries.join(', ')} }));`;
  });
}

function buildMockImportStatements(
  specs: TestCaseSpecification[],
  options: VitestGeneratorOptions,
): string[] {
  const modules = new Map<string, Set<string>>();

  for (const spec of specs) {
    for (const importSpec of spec.imports ?? []) {
      const resolvedSpecifier = resolveImportSpecifier(importSpec.module, options.sourceFilePath, options.outputFilePath);
      const names = modules.get(resolvedSpecifier) ?? new Set<string>();

      for (const name of importSpec.names ?? []) {
        names.add(name);
      }

      modules.set(resolvedSpecifier, names);
    }
  }

  return Array.from(modules.entries()).map(([moduleSpecifier, names]) => `import { ${Array.from(names).join(', ')} } from ${JSON.stringify(moduleSpecifier)};`);
}

function buildBeforeEachBlock(mocks: Record<string, unknown> | undefined): string {
  const entries = Object.entries(mocks ?? {});
  if (!entries.length) return '';

  return [
    '        beforeEach(() => {',
    ...entries.map(([name, value]) => `          vi.mocked(${name}).mockReturnValue(${renderJsValue(value)});`),
    '        });',
  ].join('\n');
}

function buildSuite(spec: TestCaseSpecification, callableName: string, parameterOrder: string[]): string {
  const testBlocks = (spec.cases ?? []).map((testCase) => {
    const args = parameterOrder
      .map((param) => renderJsValue(testCase.inputs[param]))
      .join(', ');
    const stateMessage = toStateMessage(testCase, parameterOrder);
    const outcomeMessage = toOutcomeMessage(testCase);

    if (testCase.expected.type === 'throw') {
      const beforeEachBlock = buildBeforeEachBlock(testCase.mocks);
      return [
        `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
        beforeEachBlock,
        `        it(${JSON.stringify(outcomeMessage)}, () => {`,
        `          expect(() => ${callableName}(${args})).toThrow(${JSON.stringify(testCase.expected.message ?? '')});`,
        '        });',
        '      });',
      ].filter(Boolean).join('\n');
    }

    if (testCase.expected.value === 'undefined') {
      const beforeEachBlock = buildBeforeEachBlock(testCase.mocks);
      return [
        `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
        beforeEachBlock,
        `        it(${JSON.stringify(outcomeMessage)}, () => {`,
        `          const result = ${callableName}(${args});`,
        '          expect(result).toBeUndefined();',
        '        });',
        '      });',
      ].filter(Boolean).join('\n');
    }

    const beforeEachBlock = buildBeforeEachBlock(testCase.mocks);
    return [
      `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
      beforeEachBlock,
      `        it(${JSON.stringify(outcomeMessage)}, () => {`,
      `          const result = ${callableName}(${args});`,
      `          expect(result).toEqual(${renderJsValue(testCase.expected.value)});`,
      '        });',
      '      });',
    ].filter(Boolean).join('\n');
  });

  const body = testBlocks.length
    ? testBlocks.join('\n\n')
    : `      describe('and no cases are available', () => {\n        it('then it should keep the suite deterministic', () => {\n          expect(true).toBe(true);\n        });\n      });`;

  return [
    `describe(${JSON.stringify(`${spec.function ?? callableName}Specs`)}, () => {`,
    `  describe('given the test is initialized', () => {`,
    `    describe(${JSON.stringify(`when I call ${callableName}()`)}, () => {`,
      body.replace(
        `      describe('and no cases are available', () => {\n        it('then it should keep the suite deterministic', () => {\n          expect(true).toBe(true);\n        });\n      });`,
        `      describe('and no cases are available', () => {\n        it('then it should not throw', () => {\n          expect(() => ${callableName}(${parameterOrder.map(() => 'undefined').join(', ')})).not.toThrow();\n        });\n      });`
      ),
    '    });',
    '  });',
    '});',
  ].join('\n');
}

export function createVitestTests(spec: TestCaseSpecification | TestCaseSpecifications, options: VitestGeneratorOptions): string {
  const importSpecifier = toImportSpecifier(options.outputFilePath, options.sourceFilePath);
  const specs = Array.isArray(spec) ? spec : [spec];
  const functionNames = options.functionNames && options.functionNames.length
    ? options.functionNames
    : specs.map((item) => item.function).filter(Boolean);

  const importList = functionNames.length ? functionNames : [options.functionName];
  const mockImports = buildMockImportStatements(specs, options);
  const mockDeclarations = buildMockModuleDeclarations(specs, options);

  const suites = specs.map((singleSpec) => {
    const callableName = singleSpec.function ?? options.functionName;
    const parameterOrder = options.parameterOrderByFunction?.[callableName] ?? options.parameterOrder;

    return buildSuite(singleSpec, callableName, parameterOrder);
  });

  return [
    `import { beforeEach, describe, expect, it, vi } from 'vitest';`,
    `import { ${importList.join(', ')} } from ${JSON.stringify(importSpecifier)};`,
    ...mockImports,
    ...mockDeclarations,
    '',
    suites.join('\n\n'),
    '',
  ].join('\n');
}
