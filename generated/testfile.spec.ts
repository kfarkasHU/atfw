import { describe, expect, it } from 'vitest';
import { checkUser } from "../test/testfile";

describe("checkUser", () => {
  it("C1 (P1) should return expected value", () => {
    const result = checkUser(11, {"blocked":false});
    expect(result).toEqual("A");
  });

  it("C2 (P2) should throw", () => {
    expect(() => checkUser(10, {"blocked":true})).toThrow("blocked");
  });

  it("C3 (P3) should return expected value", () => {
    const result = checkUser(10, {"blocked":false});
    expect(result).toEqual("B");
  });
});
