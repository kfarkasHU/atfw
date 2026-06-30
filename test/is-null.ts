export function isNull(valueLike: unknown): valueLike is null {
  return valueLike === null;
}