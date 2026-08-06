type Input = { kind: 'A' | 'B' } | { kind: 'C' };
export function tmpUnionObjectsLiteralProp(input: Input): string { return input.kind; }
