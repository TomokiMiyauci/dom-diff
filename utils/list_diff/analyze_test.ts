import { analyze } from "./analyze.ts";
import { assertEquals, describe, it } from "./_dev_deps.ts";
import testcase from "./testcase.json" assert { type: "json" };

const defaults = {
  inserts: [],
  moves: [],
  sames: [],
  removes: [],
};

describe("analyze should return diff", () => {
  testcase.cases.forEach((testCase) => {
    it(`${Deno.inspect(testCase.prev)} -> ${Deno.inspect(testCase.new)}`, () => {
      assertEquals(analyze(testCase.prev, testCase.new, (v) => v), {
        ...defaults,
        ...testCase.diff,
      });
    });
  });
});
