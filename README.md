# atfw

A CLI + lib to generate your unit tests for Typescript apps.

**No AI. No slop.**

Just a tool.

```
npm run dev -- test/testfile.ts generated/testfile.spec.ts --debug-output --runner jest
npm run dev -- test/testfile.ts generated/testfile.spec.ts --debug-output --runner vitest
npm run dev -- atfw.config.json
npm run dev -- --config atfw.config.json
```

## CLI args

| Arg | Required | Values | Default | Description |
| --- | --- | --- | --- | --- |
| `inputFilePath` | Yes | Path to source TypeScript file | - | Input file to analyze and generate tests for |
| `outputFilePath` | Yes | Path to generated test file | - | Main output file (generated Jest/Vitest test file) |
| `--debug-output` | No | Flag | `false` | Writes debug artifacts (`.ast.json`, `.ir.json`, `.cfg.json`, `.path.json`, `.test-case-specification.json`) |
| `--runner` | No | `jest` \| `vitest` | `jest` | Selects generated test framework |

Supported `--runner` forms:

```bash
--runner jest
--runner vitest
```

## Config file

You can run ATFW using a config file named `atfw.config.json`.

The config supports the same CLI options, and file inputs must be provided as an array of tuples:

```json
{
	"runner": "jest",
	"debugOutput": true,
	"customHeader": [
		"/* eslint-disable @typescript-eslint/no-explicit-any */",
		"// @ts-nocheck"
	],
	"inputs": [
		["test/testfile.ts", "generated/jest/testfile.spec.ts"],
		["test/import-test.ts", "generated/jest/import-test.spec.ts"]
	]
}
```

Run with either:

```bash
atfw atfw.config.json
atfw --config atfw.config.json
```

## .gitignore example

If you do not want generated specs and debug artifacts in source control, you can add:

```gitignore

# ATFW debug artifacts
*.ast.json
*.ir.json
*.cfg.json
*.path.json
*.test-case-specification.json
```
