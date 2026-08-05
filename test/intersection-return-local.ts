type B = { id: number };
type C = { name: string };
export type A = B & C;

export function createIntersectionLocal(flag: boolean): A {
  if (flag) {
    return { id: 1, name: `alpha` };
  }

  return { id: 2, name: `beta` };
}