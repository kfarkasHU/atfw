export function isObject(valueLike: unknown): valueLike is Record<string, unknown> {
  return typeof valueLike === 'object' && valueLike !== null && !Array.isArray(valueLike);
}