export function pureFalsyString(value: string) {
  if (!value) {
    return `falsy`;
  }

  return `truthy`;
}