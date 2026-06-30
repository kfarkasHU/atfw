export function isBoolean(valueLike: unknown): valueLike is boolean {
  return typeof valueLike === 'boolean';
}