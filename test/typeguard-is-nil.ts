export function isNilGuard<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

export function isPresentGuard<T>(value: T): value is Exclude<T, null | undefined> {
  return !!value;
}