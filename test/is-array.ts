export function isArray(valueLike: unknown): valueLike is unknown[] {
  return Array.isArray(valueLike);
}