import type { Input } from './tmp-inline-object-alias-literal-source';

export function tmpInlineObjectAliasLiteralImported(input: Input): string {
  if (input.kind === 'A') {
    return 'A';
  }

  return 'other';
}
