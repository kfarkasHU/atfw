import path from 'node:path';
import { TestCaseSpecification, TestGenerationInput } from './model';

type CallExpectation = NonNullable<TestCaseSpecification['cases'][number]['callExpectations']>[number];

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

function toIdentifier(value: string): string {
  return value.replace(/[^A-Za-z0-9_$]/g, '_');
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
  input: TestGenerationInput,
): string[] {
  const modules = new Map<string, Set<string>>();

  for (const spec of specs) {
    for (const importSpec of spec.imports ?? []) {
      const resolvedSpecifier = resolveImportSpecifier(importSpec.module, input.sourceFilePath, input.outputFilePath);
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
  input: TestGenerationInput,
): string[] {
  const modules = new Map<string, Set<string>>();

  for (const spec of specs) {
    for (const importSpec of spec.imports ?? []) {
      const resolvedSpecifier = resolveImportSpecifier(importSpec.module, input.sourceFilePath, input.outputFilePath);
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
  return buildBeforeEachBlockWithCalls(mocks, []);
}

function buildBeforeEachBlockWithCalls(
  mocks: Record<string, unknown> | undefined,
  callExpectations: CallExpectation[] | undefined,
): string {
  const entries = Object.entries(mocks ?? {});
  const chainExpectations = (callExpectations ?? []).filter((item) => item.path.length > 1);
  if (!entries.length && !callExpectations?.length) return '';

  const declarations = new Set<string>();
  const lines = ['        beforeEach(() => {', '          vi.clearAllMocks();'];

  const chainRoots = new Map<string, Set<string[]>>();
  for (const expectation of chainExpectations) {
    const existing = chainRoots.get(expectation.path[0]) ?? new Set<string[]>();
    existing.add(expectation.path.slice(1));
    chainRoots.set(expectation.path[0], existing);
  }

  for (const [root, rawPaths] of chainRoots.entries()) {
    const pathList = Array.from(rawPaths.values());

    const buildObject = (segmentsList: string[][], key: string): { lines: string[]; objectVar: string } => {
      const objectVar = `${toIdentifier(root)}_${key || 'result'}Mock`;
      declarations.add(objectVar);
      const childNames = Array.from(new Set(segmentsList.map((segments) => segments[0]).filter(Boolean)));
      const localLines: string[] = [];

      for (const childName of childNames) {
        const childSegments = segmentsList
          .filter((segments) => segments[0] === childName)
          .map((segments) => segments.slice(1));

        if (childSegments.some((segments) => segments.length > 0)) {
          const childKey = key ? `${key}_${toIdentifier(childName)}_result` : `${toIdentifier(childName)}_result`;
          const childObject = buildObject(childSegments.filter((segments) => segments.length > 0), childKey);
          localLines.push(...childObject.lines);
          localLines.push(`          vi.mocked(${objectVar}.${childName}).mockReturnValue(${childObject.objectVar} as any);`);
        }
      }

      const factoryEntries = childNames.map((childName) => `${childName}: vi.fn()`);
      localLines.unshift(`          ${objectVar} = { ${factoryEntries.join(', ')} };`);

      return { lines: localLines, objectVar };
    };

    const rootObject = buildObject(pathList, 'result');
    lines.push(...rootObject.lines);
    lines.push(`          vi.mocked(${root}).mockReturnValue(${rootObject.objectVar} as any);`);
  }

  for (const [name, value] of entries) {
    if (chainRoots.has(name)) continue;
    lines.push(`          vi.mocked(${name}).mockReturnValue(${renderJsValue(value)});`);
  }

  lines.push('        });');

  return [
    ...Array.from(declarations).map((name) => `        let ${name}: any;`),
    ...lines,
  ].join('\n');
}

function buildCallAssertionLines(callExpectations: CallExpectation[] | undefined): string[] {
  if (!callExpectations?.length) return [];

  const resolveAccessor = (pathSegments: string[]): string => {
    if (pathSegments.length === 1) return pathSegments[0];
    const root = pathSegments[0];
    if (pathSegments.length === 2) {
      return `${toIdentifier(root)}_resultMock.${pathSegments[1]}`;
    }

    return `${toIdentifier(root)}_${pathSegments.slice(1, -1).map((part) => `${toIdentifier(part)}_result`).join('_')}Mock.${pathSegments[pathSegments.length - 1]}`;
  };

  return callExpectations.flatMap((expectation) => {
    const accessor = resolveAccessor(expectation.path);
    return [
      `          expect(${accessor}).toHaveBeenCalled();`,
      `          expect(${accessor}).toHaveBeenCalledTimes(${expectation.args.length});`,
      ...expectation.args.map((args) => `          expect(${accessor}).toHaveBeenCalledWith(${args.map((arg) => renderJsValue(arg)).join(', ')});`),
    ];
  });
}

function buildSuite(spec: TestCaseSpecification, callableName: string, parameterOrder: string[]): string {
  const testBlocks = (spec.cases ?? []).map((testCase) => {
    const args = parameterOrder
      .map((param) => renderJsValue(testCase.inputs[param]))
      .join(', ');
    const stateMessage = toStateMessage(testCase, parameterOrder);
    const outcomeMessage = toOutcomeMessage(testCase);

    if (testCase.expected.type === 'throw') {
      const beforeEachBlock = buildBeforeEachBlockWithCalls(testCase.mocks, testCase.callExpectations);
      const callAssertions = buildCallAssertionLines(testCase.callExpectations);
      return [
        `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
        beforeEachBlock,
        `        it(${JSON.stringify(outcomeMessage)}, () => {`,
        `          expect(() => ${callableName}(${args})).toThrow(${JSON.stringify(testCase.expected.message ?? '')});`,
        ...callAssertions,
        '        });',
        '      });',
      ].filter(Boolean).join('\n');
    }

    if (testCase.expected.value === 'undefined') {
      const beforeEachBlock = buildBeforeEachBlockWithCalls(testCase.mocks, testCase.callExpectations);
      const callAssertions = buildCallAssertionLines(testCase.callExpectations);
      return [
        `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
        beforeEachBlock,
        `        it(${JSON.stringify(outcomeMessage)}, () => {`,
        `          const result = ${callableName}(${args});`,
        '          expect(result).toBeUndefined();',
        ...callAssertions,
        '        });',
        '      });',
      ].filter(Boolean).join('\n');
    }

    const beforeEachBlock = buildBeforeEachBlockWithCalls(testCase.mocks, testCase.callExpectations);
    const callAssertions = buildCallAssertionLines(testCase.callExpectations);
    return [
      `      describe(${JSON.stringify(`and ${stateMessage}`)}, () => {`,
      beforeEachBlock,
      `        it(${JSON.stringify(outcomeMessage)}, () => {`,
      `          const result = ${callableName}(${args});`,
      `          expect(result).toEqual(${renderJsValue(testCase.expected.value)});`,
      ...callAssertions,
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

export function createVitestTests(input: TestGenerationInput): string {
  const importSpecifier = toImportSpecifier(input.outputFilePath, input.sourceFilePath);
  const specs = input.specs ?? [];
  const functionNames = input.functionNames?.length
    ? input.functionNames
    : specs.map((item) => item.function).filter(Boolean);

  const importList = functionNames.length ? functionNames : [input.functionName];
  const mockImports = buildMockImportStatements(specs, input);
  const mockDeclarations = buildMockModuleDeclarations(specs, input);

  const suites = specs.map((singleSpec) => {
    const callableName = singleSpec.function ?? input.functionName;
    const parameterOrder = input.parameterOrderByFunction?.[callableName] ?? input.parameterOrder;

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
