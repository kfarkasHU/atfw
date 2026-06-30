export function isPrimitive(primitiveLike: unknown): primitiveLike is string | number | boolean {
  const primitiveTypes = ['boolean', 'string', 'number'];
  return primitiveTypes.includes(typeof primitiveLike);
}