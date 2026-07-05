export function pureFalsyNumber(value: number) {
  if (!value) {
    return 'falsy';
  }

  return 'truthy';
}