export function ifFalsy(valueLike: unknown) {
  if (!valueLike) {
    return 'falsy branch';
  }

  return 'truthy branch';
}