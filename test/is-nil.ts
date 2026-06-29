export function isNil(valueLike: unknown): valueLike is undefined | null {
if (valueLike === null) {
    return true;
  }
  if (valueLike === undefined) {
    return true;
  }
  return false;
}
