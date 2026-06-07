export function isNumber(valueLike: unknown): valueLike is number {
  return typeof valueLike === `number`;
}