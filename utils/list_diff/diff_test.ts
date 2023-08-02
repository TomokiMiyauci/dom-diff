// deno-lint-ignore-file no-explicit-any
import {
  diffToPatch,
  InsertPatch,
  MovePatch,
  orderChanged,
  Patch,
  PatchType,
  RemovePatch,
} from "./diff.ts";
import { assertEquals, describe, it } from "./_dev_deps.ts";
import { Diff } from "./analyze.ts";
import testcase from "./testcase.json" assert { type: "json" };
import liscase from "./lis.json" assert { type: "json" };
// import { insert, move, remove } from "./array.ts";

const defaults: Diff<unknown> = {
  inserts: [],
  moves: [],
  removes: [],
  sames: [],
};

interface Box {
  index: number;
  item: number;
}

interface Pos {
  from: number;
  to: number;
}

function toPatch(
  value:
    & { type: string }
    & (Box | Pos | { from: { item: unknown }; to: { item: unknown } }),
): Patch<unknown> {
  switch (value.type) {
    case "insert": {
      if ("index" in value) {
        const { index, item } = value;

        return new InsertPatch({ index, item });
      }

      throw new Error("invalid field: index");
    }
    case "remove": {
      if ("index" in value) {
        const { index, item } = value;
        return new RemovePatch({ index, item });
      }

      throw new Error("invalid field: index");
    }
    case "move": {
      if (
        "from" in value && typeof value.from === "number" && "to" in value &&
        typeof value.to === "number"
      ) {
        return new MovePatch({ from: value.from, to: value.to });
      } else {
        throw new Error("invalid field: from");
      }
    }

    case "substitute": {
      if (
        "index" in value && typeof value["index"] === "number" &&
        "from" in value && typeof value.from === "object" && "to" in value &&
        typeof value.to === "object"
      ) {
        return {
          type: PatchType.Substitute,
          index: value.index,
          from: value.from as any,
          to: value.to as any,
        };
      } else {
        throw new Error("invalid field: from");
      }
    }

    default: {
      throw new Error(`unknown type: ${value.type}`);
    }
  }
}

describe("diffToPatch should return patch sequence", () => {
  testcase.cases.forEach(
    ({ diff, patches, prev, new: newValue }) => {
      describe(`${Deno.inspect(prev)} -> ${Deno.inspect(newValue)}`, () => {
        it(`moveable`, () => {
          assertEquals(
            diffToPatch({ ...defaults, ...diff }),
            patches.map(toPatch),
          );
        });

        // TODO(miyauci): pass the test
        // it(`moveable + substitutable`, () => {
        //   const patches = substitutable.map(toPatch);
        //   assertEquals(
        //     diffToPatch({ ...defaults, ...diff }, { substitutable: true }),
        //     patches,
        //   );

        //   const modified = patches.reduce((acc: unknown[], patch) => {
        //     switch (patch.type) {
        //       case PatchType.Insert:
        //         return insert(acc, patch.index, patch.item);

        //       case PatchType.Move:
        //         return move(acc, patch.from, patch.to);

        //       case PatchType.Remove:
        //         return remove(acc, patch.index);

        //       case PatchType.Substitute: {
        //         acc.splice(patch.index, 1, patch.to.item);
        //         return acc;
        //       }
        //     }
        //   }, prev);
        //   assertEquals(newValue, modified);
        // });
      });
    },
  );
});

describe("orderChanged", () => {
  liscase.cases.forEach((test) => {
    if (test.broad.operations) {
      it(`${Deno.inspect(test.input)} -> ${Deno.inspect(test.broad.operations)}`, () => {
        assertEquals(orderChanged(test.input), test.broad.operations);

        const moved = test.broad.operations!.reduce((acc, { from, to }) => {
          const elementToMove = acc[from]!;
          acc.splice(from, 1);
          acc.splice(to, 0, elementToMove);

          return acc;
        }, test.input.slice());
        assertEquals(test.input.toSorted(), moved);
      });
    }
  });
});
