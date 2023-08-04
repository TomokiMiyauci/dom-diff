// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  type AttributePatch,
  AttributeReconciler,
  diffAttribute,
  syncAttribute,
} from "./attribute.ts";
import {
  assert,
  assertEquals,
  assertThrows,
  describe,
  it,
} from "../_dev_deps.ts";
import {
  DOMParser,
  Node as _Node,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const parser = new DOMParser();

describe("diffAttribute", () => {
  it("should return substitute, add and delete patch.", () => {
    const table: [string, string, AttributePatch[]][] = [
      ["<div></div>", "<div></div>", []],
      [`<div title="test"></div>`, "<div></div>", [{
        action: "delete",
        name: "title",
        value: "test",
      }]],
      [`<div></div>`, `<div title="test">></div>`, [{
        action: "add",
        name: "title",
        value: "test",
      }]],
      [`<div title="test"></div>`, `<div title="test">></div>`, []],
      [`<div title="test"></div>`, `<div title="test2">></div>`, [{
        action: "substitute",
        name: "title",
        from: "test",
        to: "test2",
      }]],
      [
        `<svg xml:lang="en-US" class="struct" height="1" width="1">Click me</svg>`,
        `<svg xmlns="http://www.w3.org/2000/svg"></svg>`,
        [
          { action: "delete", name: "lang", value: "en-US" },
          { action: "delete", name: "class", value: "struct" },
          { action: "delete", name: "height", value: "1" },
          { action: "delete", name: "width", value: "1" },
          { action: "add", name: "xmlns", value: "http://www.w3.org/2000/svg" },
        ],
      ],
    ];

    table.forEach(([oldNode, newNode, expected]) => {
      assertEquals([
        ...diffAttribute(
          parser.parseFromString(oldNode, "text/html")!.body
            .firstChild as unknown as Node,
          parser.parseFromString(newNode, "text/html")!.body
            .firstChild as unknown as Node,
        ),
      ], expected);
    });
  });
});

describe("syncAttribute", () => {
  it("should update attribute patch", () => {
    const table: [string, AttributePatch, string][] = [
      [
        "<div></div>",
        { action: "add", name: "title", value: "test" },
        `<div title="test"></div>`,
      ],
      [
        `<div title="test"></div>`,
        { action: "delete", name: "title", value: "test" },
        `<div></div>`,
      ],
      [
        `<div xml:title="test"></div>`,
        { action: "delete", name: "xml:title", value: "test" },
        `<div></div>`,
      ],
      [
        `<div xml:title="test"></div>`,
        { action: "substitute", name: "xml:title", from: "test", to: "test2" },
        `<div xml:title="test2"></div>`,
      ],
    ];

    table.forEach(([node, patch, expected]) => {
      const root = parser.parseFromString(node, "text/html");

      syncAttribute(root?.body.firstChild, patch);
      assertEquals(root?.body.innerHTML, expected);
    });
  });

  it("should throw error if the node is not Element", () => {
    const table: [string, AttributePatch][] = [
      [
        "text",
        { action: "add", name: "title", value: "test" },
      ],
    ];

    table.forEach(([node, patch]) => {
      const root = parser.parseFromString(node, "text/html");

      assertThrows(
        () => syncAttribute(root?.body.firstChild, patch),
        Error,
        `target node should be Element`,
      );
    });
  });
});

describe("AttributeReconciler", () => {
  it("diff should equal to diffAttribute", () => {
    assert(new AttributeReconciler().diff === diffAttribute);
  });

  it("update should equal to syncAttribute", () => {
    assert(new AttributeReconciler().update === syncAttribute);
  });
});
