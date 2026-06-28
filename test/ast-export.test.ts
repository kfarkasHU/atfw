import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeAstToFile } from '../src/index.js';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'atfw-'));
const outputFile = path.join(tempDir, 'nested', 'ast.json');

try {
  const writtenFile = writeAstToFile(path.resolve('test/testfile.ts'), outputFile);
  assert.equal(writtenFile, outputFile);

  const ast = JSON.parse(readFileSync(outputFile, 'utf8'));
  assert.equal(ast.type, 'Function');
  assert.equal(ast.name, 'test');
  assert.equal(ast.exported, true);
  assert.equal(ast.params[2].type, 'string?');
  assert.equal(ast.body[0].expression.type, 'PrefixUnaryExpression');
  assert.equal(ast.body[1].expression.type, 'BinaryExpression');
  assert.equal(ast.body[1].expression.right.type, 'BinaryExpression');
  assert.equal(ast.body[2].value.type, 'TemplateExpression');
  assert.equal(ast.body[2].value.parts[0].type, 'Identifier');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
