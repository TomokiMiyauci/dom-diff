import { lis } from "./utils.ts";
import { assertEquals, describe, it } from "./_dev_deps.ts";
import lisCase from "./lis.json" assert { type: "json" };

describe("lis", () => {
  lisCase.cases.forEach((test) => {
    it(`broad increasing: ${Deno.inspect(test.input)} -> ${Deno.inspect(test.broad.lis)}`, () => {
      assertEquals(lis(test.input), test.broad.lis);
    });

    it(`strict increasing: ${Deno.inspect(test.input)} -> ${Deno.inspect(test.strict.lis)}`, () => {
      assertEquals(lis(test.input, true), test.strict.lis);
    });
  });
});
