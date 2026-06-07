export function categorizeByLength(items: unknown[]) {
  if (items.length > 2) {
    return `long`;
  }

  return `short`;
}