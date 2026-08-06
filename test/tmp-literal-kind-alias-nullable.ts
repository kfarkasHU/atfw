type Kind = 'A' | 'B' | 'C';
type Input = { kind: Kind | null };
export function tmpLiteralKindAliasNullable(input: Input): string { return input.kind ?? 'missing'; }
