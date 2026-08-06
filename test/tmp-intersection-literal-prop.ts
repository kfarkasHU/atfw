type Input = { id: number } & { kind: 'A' | 'B' | 'C' };
export function tmpIntersectionLiteralProp(input: Input): string { return input.kind; }
