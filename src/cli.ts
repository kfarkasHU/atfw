#!/usr/bin/env node
import { createTests } from './index.js';

const [inputArg, outputArg, debugOutputArg] = process.argv.slice(2);
const inputFilePath = inputArg ?? 'test/testfile.ts';
const outputFilePath = outputArg ?? 'generated/testfile.spec.ts';
const debugOutput = debugOutputArg === '--debug-output';

const writtenFile = createTests(inputFilePath, outputFilePath, { debugOutput });
debugOutput && console.log(writtenFile);
