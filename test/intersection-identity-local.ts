type B = { id: number };
type C = { name: string };
export type A = B & C;

export function echoIntersectionLocal(user: A): A {
  return user;
}