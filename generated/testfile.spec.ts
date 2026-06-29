import { test } from "../test/testfile";

describe("test", () => {
  it("C1 (P1) should return undefined", () => {
    const result = test(false, "name_value", "title_value");
    expect(result).toBeUndefined();
  });

  it("C2 (P2) should throw", () => {
    expect(() => test(true, "name_value", "Dr_x")).toThrow("Title must be Dr or nil!");
  });

  it("C3 (P3) should return expected value", () => {
    const result = test(true, "name_value", "Dr");
    expect(result).toEqual("Dr name_value");
  });
});
