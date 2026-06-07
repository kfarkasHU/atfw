export function isPrimitiveOr(valueLike: unknown): valueLike is string | number | boolean {
  return typeof valueLike === `string` || typeof valueLike === `number` || typeof valueLike === `boolean`;
}