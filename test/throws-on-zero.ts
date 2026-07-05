export function failOnZero(value: number) {
  if (value === 0) {
    throw new Error('value cannot be zero');
  }

  return 'ok';
}