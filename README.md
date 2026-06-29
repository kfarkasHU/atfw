# atfw

A CLI + lib to generate your unit tests for Typescript apps.

**No AI. No slop.**

Just a tools.

```
npm run dev -- test/testfile.ts generated/testfile.spec.ts --debug-output --runner jest
npm run dev -- test/testfile.ts generated/testfile.spec.ts --debug-output --runner vitest
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
