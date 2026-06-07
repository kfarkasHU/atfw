export function isAboveTen(x: number) {
  return x > 10;
}

export function compareToTen(x: number) {
  if (x < 10) {
    return `lt`;
  }

  if (x === 10) {
    return `eq`;
  }

  return `gt`;
}