#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTests } from './index';
import { Runner } from './runner.type';

type FileInputTuple = [string, string];

type CliConfig = {
	debugOutput?: boolean;
	runner?: Runner;
	inputs?: FileInputTuple[];
	fileInputs?: FileInputTuple[];
	inputFilePath?: string;
	outputFilePath?: string;
};

function isRunner(value: string): value is Runner {
	return value === `jest` || value === `vitest`;
}

function normalizeInputTuples(value: unknown): FileInputTuple[] {
	if (!Array.isArray(value)) return [];
	if (!value.length) return [];

	const tuples = value.filter((entry): entry is unknown[] => Array.isArray(entry) && entry.length === 2);
	if (!tuples.length) {
		throw new Error(`Invalid config: inputs must be an array of tuples [[inputFile, outputFile]]`);
	}

	const normalized = tuples.map(([inputFilePath, outputFilePath]) => {
		if (typeof inputFilePath !== `string` || typeof outputFilePath !== `string`) {
			throw new Error(`Invalid config: each tuple must contain two string values [inputFile, outputFile]`);
		}

		return [inputFilePath, outputFilePath] as FileInputTuple;
	});

	return normalized;
}

function loadConfig(configArg: string): CliConfig {
	const resolvedConfigPath = path.isAbsolute(configArg)
		? configArg
		: path.resolve(process.cwd(), configArg);

	if (path.basename(resolvedConfigPath) !== `atfw.config.json`) {
		throw new Error(`Config file must be named atfw.config.json`);
	}

	let parsedConfig: unknown;
	try {
		parsedConfig = JSON.parse(readFileSync(resolvedConfigPath, `utf-8`));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to read config file at ${resolvedConfigPath}: ${message}`);
	}

	if (!parsedConfig || typeof parsedConfig !== `object`) {
		throw new Error(`Invalid config: expected a JSON object in ${resolvedConfigPath}`);
	}

	return parsedConfig as CliConfig;
}

function parseArgs(args: string[]) {
	const positional: string[] = [];
	const flags: string[] = [];

	for (const arg of args) {
		if (arg.startsWith(`--`)) {
			flags.push(arg);
			continue;
		}

		if (flags.length && flags[flags.length - 1] === `--runner`) {
			flags.push(arg);
			continue;
		}

		if (flags.length && flags[flags.length - 1] === `--config`) {
			flags.push(arg);
			continue;
		}

		positional.push(arg);
	}

	let debugOutput = false;
	let runner: Runner = `jest`;
	let configFilePath: string | undefined;

	for (let i = 0; i < flags.length; i += 1) {
		const flag = flags[i];

		if (flag === `--debug-output`) {
			debugOutput = true;
			continue;
		}

		if (flag === `--runner` && flags[i + 1]) {
			const nextValue = flags[i + 1]?.toLowerCase();
			if (isRunner(nextValue)) {
				runner = nextValue;
				i += 1;
			}
			continue;
		}

		if (flag === `--config` && flags[i + 1]) {
			configFilePath = flags[i + 1];
			i += 1;
			continue;
		}
	}

	if (!configFilePath && positional.length === 1 && positional[0]?.toLowerCase?.().endsWith(`.json`)) {
		configFilePath = positional[0];
	}

	if (configFilePath) {
		const config = loadConfig(configFilePath);

		const configRunner = typeof config.runner === `string` && isRunner(config.runner)
			? config.runner
			: undefined;
		const configDebugOutput = typeof config.debugOutput === `boolean`
			? config.debugOutput
			: undefined;

		const inputTuples = normalizeInputTuples(config.inputs ?? config.fileInputs ?? []);
		if (!inputTuples.length) {
			if (typeof config.inputFilePath === `string` && typeof config.outputFilePath === `string`) {
				return {
					inputs: [[config.inputFilePath, config.outputFilePath] as FileInputTuple],
					debugOutput,
					runner,
					configDebugOutput,
					configRunner,
				};
			}

			throw new Error(`Invalid config: provide inputs as [[inputFile, outputFile]] tuples`);
		}

		return {
			inputs: inputTuples,
			debugOutput,
			runner,
			configDebugOutput,
			configRunner,
		};
	}

	const [inputArg, outputArg] = positional;

	return {
		inputs: inputArg && outputArg ? [[inputArg, outputArg] as FileInputTuple] : [],
		debugOutput,
		runner,
	};
}

const { inputs, debugOutput, runner, configDebugOutput, configRunner } = parseArgs(process.argv.slice(2));

if (!inputs.length) throw new Error(`Input file path is required`);

const finalDebugOutput = configDebugOutput ?? debugOutput;
const finalRunner = configRunner ?? runner;

for (const [inputFilePath, outputFilePath] of inputs) {
	const writtenFile = createTests(inputFilePath, outputFilePath, { debugOutput: finalDebugOutput, runner: finalRunner });
	if (finalDebugOutput) console.log(writtenFile);
}
