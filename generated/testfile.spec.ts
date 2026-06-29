import { checkUser } from "../test/testfile";

describe("checkUser Specs", () => {
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
