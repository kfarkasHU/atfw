export function categorizeByContains(items: number[], value: number) {
  if (items.includes(value)) {
    return `contains`;
  }

  return `missing`;
}