import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createAst } from './ast.js';
import { createCfg } from './cfg.js';
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
  const cfg = createCfg(ir);

  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, JSON.stringify(cfg, null, 2), 'utf-8');

  return absoluteOutputPath;
}
