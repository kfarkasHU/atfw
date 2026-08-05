type A = { a: string };
type B = { b: number };
type C = { c: boolean };
type D = { d: string };

type MOCK = (A & B) | (A & C) | (D & B);

export function readUnionOfIntersections(value: MOCK): string {
  const candidate = value as { a?: string; d?: string };

  return candidate.a ?? candidate.d ?? `missing`;
}
