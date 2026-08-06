type Input = { kind: 'A' | 'B' | 'C' } | { kind: 'C' };
export function tmpLiteralObjectUnion(input: Input): string {
  return input.kind;
}
