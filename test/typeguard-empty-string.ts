export function isEmptyStringGuard(value: unknown): value is '' {
  return value === '';
}