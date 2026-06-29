import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createAst } from './ast';
import { createCfg } from './cfg';
import { createJestTests } from './generator/jest';
import { createTestCaseSpecification } from './test-case-specification';
import { createIr } from './ir';
import { createPath } from './path';

type WriteOptions = {
  debugOutput: boolean;
};

export function createTests(
  inputFilePath: string,
  outputFilePath: string,
  options: WriteOptions = { debugOutput: false }
): string {
  const absoluteInputPath = path.isAbsolute(inputFilePath)
    ? inputFilePath
    : path.resolve(process.cwd(), inputFilePath);

  const absoluteOutputPath = path.isAbsolute(outputFilePath)
    ? outputFilePath
    : path.resolve(process.cwd(), outputFilePath);

  const ast = createAst(absoluteInputPath);
  const ir = createIr(ast);
  const cfg = createCfg(ir);
  const paths = cfg
    ? createPath(cfg)
    : {
        type: 'Paths' as const,
        function: 'unknown',
        paths: [],
      };
  const testCaseSpecification = createTestCaseSpecification(paths, {
    params: ir?.params ?? [],
  });
  const jestContent = createJestTests(testCaseSpecification, {
    functionName: ast?.name ?? 'sut',
    parameterOrder: (ast?.params ?? []).map((param: { name: string }) => param.name),
    sourceFilePath: absoluteInputPath,
    outputFilePath: absoluteOutputPath,
  });

  const outputDir = path.dirname(absoluteOutputPath);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(absoluteOutputPath, jestContent, 'utf-8');

  if (options.debugOutput) {
    const outputFileBase = path.basename(absoluteOutputPath, path.extname(absoluteOutputPath));

    writeFileSync(path.join(outputDir, `${outputFileBase}.ast.json`), JSON.stringify(ast, null, 2), 'utf-8');
    writeFileSync(path.join(outputDir, `${outputFileBase}.ir.json`), JSON.stringify(ir, null, 2), 'utf-8');
    writeFileSync(path.join(outputDir, `${outputFileBase}.cfg.json`), JSON.stringify(cfg, null, 2), 'utf-8');
    writeFileSync(path.join(outputDir, `${outputFileBase}.path.json`), JSON.stringify(paths, null, 2), 'utf-8');
    writeFileSync(path.join(outputDir, `${outputFileBase}.test-case-specification.json`), JSON.stringify(testCaseSpecification, null, 2), 'utf-8');
  }

  return absoluteOutputPath;
}
