import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createAst } from './ast.js';
import { createIr } from './ir.js';

export function writeAstToFile(inputFilePath: string, outputFilePath: string): string {
  const absoluteInputPath = path.isAbsolute(inputFilePath)
    ? inputFilePath
    : path.resolve(process.cwd(), inputFilePath);
  const absoluteOutputPath = path.isAbsolute(outputFilePath)
    ? outputFilePath
    : path.resolve(process.cwd(), outputFilePath);

  const ast = createAst(absoluteInputPath);
  const ir = createIr(ast);

  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, JSON.stringify(ir, null, 2));

  return absoluteOutputPath;
}
