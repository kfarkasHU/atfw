type B = { id: number };
type C = { name: string };
export type A = B | C;

export function createUnionLocal(flag: boolean): A {
  if (flag) {
    return { id: 1 };
  }

  return { name: `beta` };
}