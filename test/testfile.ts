// export function test(isVisible: boolean, name: string, title?: string) {
//   if (!isVisible) return undefined;
//   if (title && title !== "Dr") throw new Error("Title must be Dr or nil!");
//   return `${title} ${name}`;
// }

export function checkUser(x: number, user: { blocked: boolean }) {
  if (x > 10) {
    return "A";
  }

  if (user.blocked) {
    throw new Error("blocked");
  }

  return "B";
}