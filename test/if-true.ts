export function ifTrue(valueLike: boolean) {
  if (valueLike === true) {
    return `true branch`;
  }

  return `false branch`;
}