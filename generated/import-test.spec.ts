import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toTest } from "../test/import-test";
import { toMock } from "../test/import-source";
vi.mock("../test/import-source", () => ({ toMock: vi.fn() }));

describe("toTestSpecs", () => {
  describe('given the test is initialized', () => {
    describe("when I call toTest()", () => {
      describe("and the inputs are defaulted", () => {
        beforeEach(() => {
          vi.mocked(toMock).mockReturnValue(true);
        });
        it("should return false", () => {
          const result = toTest();
          expect(result).toEqual(false);
        });
      });

      describe("and the inputs are defaulted", () => {
        beforeEach(() => {
          vi.mocked(toMock).mockReturnValue(false);
        });
        it("should return true", () => {
          const result = toTest();
          expect(result).toEqual(true);
        });
      });
    });
  });
});
