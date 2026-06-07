import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createAst } from './ast';
import { createCfg } from './cfg';
import { createJestTests } from './generator/jest';
import { buildTestGenerationInput } from './generator/model';
import { createVitestTests } from './generator/vitest';
import { createTestCaseSpecification } from './test-case-specification';
import { createIr } from './ir';
import { createPath } from './path';
import { Runner } from './runner.type';

type WriteOptions = {
  debugOutput: boolean;
  runner: Runner;
};

export function createTests(
  inputFilePath: string,
  outputFilePath: string,
  options: WriteOptions = { debugOutput: false, runner: `jest` }
): string {
  const absoluteInputPath = path.isAbsolute(inputFilePath)
    ? inputFilePath
    : path.resolve(process.cwd(), inputFilePath);

  const absoluteOutputPath = path.isAbsolute(outputFilePath)
    ? outputFilePath
    : path.resolve(process.cwd(), outputFilePath);

  const ast = createAst(absoluteInputPath);
  const astFunctions = Array.isArray(ast) ? ast : [];
  const paramsByFunction = astFunctions.reduce((accumulator: Record<string, any[]>, item: any) => {
    accumulator[item.name] = item.params ?? [];
    return accumulator;
  }, {});

  const ir = createIr(astFunctions);
  const cfg = createCfg(ir);
  const paths = createPath(cfg);
  const testCaseSpecification = createTestCaseSpecification(paths, { paramsByFunction });

  const generationInput = buildTestGenerationInput({
    sourceFilePath: absoluteInputPath,
    outputFilePath: absoluteOutputPath,
    astFunctions,
    paths,
    testCaseSpecifications: testCaseSpecification,
  });

  const testFileContent =
    options.runner === `vitest` ? createVitestTests(generationInput) :
    createJestTests(generationInput);

  const outputDir = path.dirname(absoluteOutputPath);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(absoluteOutputPath, testFileContent, `utf-8`);

  if (options.debugOutput) {
    const outputFileBase = path.basename(absoluteOutputPath, path.extname(absoluteOutputPath));

    writeFileSync(path.join(outputDir, `${outputFileBase}.ast.json`), JSON.stringify(ast, null, 2), `utf-8`);
    writeFileSync(path.join(outputDir, `${outputFileBase}.ir.json`), JSON.stringify(ir, null, 2), `utf-8`);
    writeFileSync(path.join(outputDir, `${outputFileBase}.cfg.json`), JSON.stringify(cfg, null, 2), `utf-8`);
    writeFileSync(path.join(outputDir, `${outputFileBase}.path.json`), JSON.stringify(paths, null, 2), `utf-8`);
    writeFileSync(path.join(outputDir, `${outputFileBase}.test-case-specification.json`), JSON.stringify(testCaseSpecification, null, 2), `utf-8`);
  }

  return absoluteOutputPath;
}
