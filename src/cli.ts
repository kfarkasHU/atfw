#!/usr/bin/env node
import { createTests } from './index';
import { Runner } from './runner.type';

function parseArgs(args: string[]) {
	const [inputArg, outputArg, ...flags] = args;

	let debugOutput = false;
	let runner: Runner = 'jest';

	for (let i = 0; i < flags.length; i += 1) {
		const flag = flags[i];

		if (flag === '--debug-output') {
			debugOutput = true;
			continue;
		}

		if (flag === '--runner' && flags[i + 1]) {
			const nextValue = flags[i + 1]?.toLowerCase();
			if (nextValue === 'jest' || nextValue === 'vitest') {
				runner = nextValue as Runner;
				i += 1;
			}
			continue;
		}
	}

	return {
		inputFilePath: inputArg,
		outputFilePath: outputArg,
		debugOutput,
		runner,
	};
}

const { inputFilePath, outputFilePath, debugOutput, runner } = parseArgs(process.argv.slice(2));

if (!inputFilePath) throw new Error('Input file path is required');
if (!outputFilePath) throw new Error('Output file path is required');

const writtenFile = createTests(inputFilePath, outputFilePath, { debugOutput, runner });
if (debugOutput) console.log(writtenFile);
