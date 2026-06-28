export function test(isVisible: boolean, name: string, title?: string) {
  if (!isVisible) return undefined;
  if (title && title !== "Dr") throw new Error("Title must be Dr or nil!");
  return `${title} ${name}`;
}
