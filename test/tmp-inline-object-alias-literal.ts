type Kind = 'A' | 'B' | 'C';

export function tmpInlineObjectAliasLiteral(input: { kind: Kind }): string {
  if (input.kind === 'A') {
    return 'A';
  }

  return 'other';
}
