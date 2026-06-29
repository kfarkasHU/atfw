import { checkUser } from "../test/testfile";

describe("checkUser", () => {
  it("C1 (P1) should return expected value", () => {
    const result = checkUser("x_value", "user_value");
    expect(result).toEqual("A");
  });

  it("C2 (P2) should throw", () => {
    expect(() => checkUser("x_value", "user_value")).toThrow("blocked");
  });

  it("C3 (P3) should return expected value", () => {
    const result = checkUser("x_value", "user_value");
    expect(result).toEqual("B");
  });
});
