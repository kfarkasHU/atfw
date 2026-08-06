type Kind = 'A' | 'B' | 'C';
type Input = { kind: Kind };
export function tmpLiteralKindAlias(input: Input): string { return input.kind; }
