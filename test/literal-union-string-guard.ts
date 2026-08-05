export function guardedLiteralUnion(value: `a` | `b`): number {
  if (typeof value === `string`) {
    return value.charCodeAt(0);
  }

  return 0;
}