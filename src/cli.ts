#!/usr/bin/env node
import { writeAstToFile } from './index.js';

const [inputArg, outputArg] = process.argv.slice(2);
const inputFilePath = inputArg ?? 'test/testfile.ts';
const outputFilePath = outputArg ?? 'generated/testfile.spec.ts';

const writtenFile = writeAstToFile(inputFilePath, outputFilePath);
console.log(writtenFile);
