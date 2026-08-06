export function tmpInlineObjectParamLiteralNullable(input: { kind: 'A' | 'B' | 'C' | null }): string { return input.kind ?? 'missing'; }
