import type { GeneratedType23 } from './tmp-generated-indexed-source';

type ExtractGeneratedParamType<T> = T extends { parameters: infer P }
  ? P extends { type: infer U }
    ? U
    : never
  : never;

type MyType = ExtractGeneratedParamType<GeneratedType23>;

export function tmpGeneratedInferIndexed(input: MyType): string {
  return input.kind;
}
