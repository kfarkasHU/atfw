export function normalize(value: unknown): string {
  if (typeof value === `string`) {
    return value;
  }

  return `${value}`;
}
