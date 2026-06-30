export function isDefined<T>(valueLike: T | undefined): valueLike is T {
  return valueLike !== undefined;
}