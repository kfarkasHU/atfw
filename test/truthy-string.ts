export function hasText(value: boolean) {
  if (value) {
    return 'text';
  }

  return 'empty';
}