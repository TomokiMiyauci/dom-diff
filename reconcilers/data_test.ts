// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import { DataPatch, DataReconciler, diffData, syncData } from "./data.ts";
import {
  assert,
  assertEquals,
  assertThrows,
  describe,
  it,
} from "../_dev_deps.ts";

describe("diffData", () => {
  it("should yield substitute patch if the data property is not equal", () => {
    const table: [object, object, DataPatch[]][] = [
      [{}, {}, []],
      [{ data: "test" }, { data: "test" }, []],
      [{ data: "test" }, {}, []],
      [{}, { data: "test" }, []],
      [{ data: "test" }, { data: "test2" }, [
        { action: "substitute", from: "test", to: "test2" },
      ]],
    ];

    table.forEach(([oldNode, newNode, expected]) => {
      assertEquals([...diffData(oldNode, newNode)], expected);
    });
  });
});

describe("syncData", () => {
  it("should sync node", () => {
    const table: [object, DataPatch, object][] = [
      [
        { data: "test" },
        { action: "substitute", from: "test", to: "test2" },
        { data: "test2" },
      ],
      [
        { data: "test" },
        { action: "substitute", from: "", to: "test2" },
        { data: "test2" },
      ],
    ];

    table.forEach(([node, patch, expected]) => {
      syncData(node, patch);
      assertEquals(node, expected);
    });
  });

  it("should throw error if node does not have data property", () => {
    assertThrows(
      () => syncData({}, { action: "substitute", from: "test", to: "test2" }),
      Error,
      "node should have \`data\` property",
    );
  });
});

describe("DataReconciler", () => {
  it("diff should equal to diffData", () => {
    assert(new DataReconciler().diff === diffData);
  });

  it("update should equal to syncData", () => {
    assert(new DataReconciler().update === syncData);
  });
});
