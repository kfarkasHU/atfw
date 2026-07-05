export function hasObject(value: boolean) {
  if (value) {
    return 'present';
  }

  return 'missing';
}