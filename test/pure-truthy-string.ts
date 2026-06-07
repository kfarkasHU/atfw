export function pureTruthyString(value: string) {
  if (value) {
    return `truthy`;
  }

  return `falsy`;
}