type A = ({ property: string }) & ({ key: string });

export function echoParenthesizedIntersection(user: A): A {
  return user;
}