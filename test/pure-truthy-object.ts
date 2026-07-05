export function pureTruthyObject(value: object | null) {
  if (value) {
    return 'truthy';
  }

  return 'falsy';
}