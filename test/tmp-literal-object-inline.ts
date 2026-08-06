type Input = { kind: 'A' | 'B' | 'C' };
export function tmpLiteralObjectInline(input: Input): string {
  return input.kind;
}
