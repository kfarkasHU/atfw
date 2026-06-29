import { describe, expect, it } from 'vitest';
import { test, checkUser } from "../test/testfile";

describe("testSpecs", () => {
  describe('given the test is initialized', () => {
    describe("when I call test()", () => {
      describe("and isVisible is false, name is \"name_value\", title is \"title_value\"", () => {
        it("should return undefined", () => {
          const result = test(false, "name_value", "title_value");
          expect(result).toBeUndefined();
        });
      });

      describe("and isVisible is true, name is \"name_value\", title is \"Dr_x\"", () => {
        it("should throw an error with message \"Title must be Dr or nil!\"", () => {
          expect(() => test(true, "name_value", "Dr_x")).toThrow("Title must be Dr or nil!");
        });
      });

      describe("and isVisible is true, name is \"name_value\", title is \"Dr\"", () => {
        it("should return \"Dr name_value\"", () => {
          const result = test(true, "name_value", "Dr");
          expect(result).toEqual("Dr name_value");
        });
      });
    });
  });
});

describe("checkUserSpecs", () => {
  describe('given the test is initialized', () => {
    describe("when I call checkUser()", () => {
      describe("and x is 11, user is {\"blocked\": false}", () => {
        it("should return \"A\"", () => {
          const result = checkUser(11, {"blocked":false});
          expect(result).toEqual("A");
        });
      });

      describe("and x is 10, user is {\"blocked\": true}", () => {
        it("should throw an error with message \"blocked\"", () => {
          expect(() => checkUser(10, {"blocked":true})).toThrow("blocked");
        });
      });

      describe("and x is 10, user is {\"blocked\": false}", () => {
        it("should return \"B\"", () => {
          const result = checkUser(10, {"blocked":false});
          expect(result).toEqual("B");
        });
      });
    });
  });
});
