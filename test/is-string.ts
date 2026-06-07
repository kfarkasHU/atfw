export function isString(valueLike: unknown): valueLike is string {
  return typeof valueLike === `string`;
}