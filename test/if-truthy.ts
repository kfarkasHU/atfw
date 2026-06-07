export function ifTruthy(valueLike: unknown) {
  if (valueLike) {
    return `truthy branch`;
  }

  return `falsy branch`;
}