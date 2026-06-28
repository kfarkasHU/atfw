// export function returnUndefined() {
//   return undefined;
// }

// export function returnNull() {
//   return null;
// }

// export function returnHello() {
//   return "hello";
// }

// export function returnTrue() {
//   return true;
// }

// export function returnFalse() {
//   return false;
// }

// export function returnParamString(param: string) {
//   return param;
// }

// export function returnParamNumber(param: number) {
//   return param;
// }

// export function returnZero() {
//   return 0;
// }

// export function returnInterpolated(name: string) {
//   return `Hello ${name}!`;
// }

// export function throwString() {
//   throw "error";
// }

// export function throwNumber() {
//   throw 1;
// }

// export function throwBoolean() {
//   throw false;
// }

// export function throwParam(param: any) {
//   throw param;
// }

// export function throwErrorWithMessage(error: string) {
//   throw Error(`message: ${error}`);
// }

// export function throwNewErrorWithMessage() {
//   throw new Error();
// }

// export function returnIfTrue(input: boolean) {
//   return input ? "left" : "right";
// }

export function test(isVisible: boolean, name: string, title?: string) {
  if (!isVisible) return undefined;
  if (title && title !== "Dr") throw new Error("Title must be Dr or nil!");
  return `${title} ${name}`;
}

// function loadData(): { id: string }[] {
//   return [];
// }

// export function loadDataAndMap() {
//   const data = loadData();
//   if(!data) return [];
//   const result = data.map(m => ({ name: m.id }));
//   return result;
// }