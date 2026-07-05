export function signFromValue(value: number) {
  return value >= 0 ? 'non-negative' : 'negative';
}