// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  DataType,
  diffMarkup,
  type MarkupPatch,
  MarkupReconciler,
  syncMarkup,
} from "./markup.ts";
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

describe("diffMarkup", () => {
  it("should return attribute or data patch", () => {
    const table: [string, string, MarkupPatch[]][] = [
      ["<div></div>", "<div></div>", []],
      [`<div title="test"></div>`, "<div></div>", [{
        action: "delete",
        type: DataType.Attribute,
        name: "title",
        value: "test",
      }]],
      [`<div></div>`, `<div title="test">></div>`, [{
        action: "add",
        type: DataType.Attribute,
        name: "title",
        value: "test",
      }]],
      [`<div title="test"></div>`, `<div title="test">></div>`, []],
      [`<div title="test"></div>`, `<div title="test2">></div>`, [{
        action: "substitute",
        type: DataType.Attribute,
        name: "title",
        from: "test",
        to: "test2",
      }]],
      [
        `<svg xml:lang="en-US" class="struct" height="1" width="1">Click me</svg>`,
        `<svg xmlns="http://www.w3.org/2000/svg"></svg>`,
        [
          {
            action: "delete",
            type: DataType.Attribute,
            name: "lang",
            value: "en-US",
          },
          {
            action: "delete",
            type: DataType.Attribute,
            name: "class",
            value: "struct",
          },
          {
            action: "delete",
            type: DataType.Attribute,
            name: "height",
            value: "1",
          },
          {
            action: "delete",
            type: DataType.Attribute,
            name: "width",
            value: "1",
          },
          {
            action: "add",
            type: DataType.Attribute,
            name: "xmlns",
            value: "http://www.w3.org/2000/svg",
          },
        ],
      ],
      ["text", "text", []],
      ["text", "text2", [{
        type: DataType.Data,
        action: "substitute",
        from: "text",
        to: "text2",
      }]],
    ];

    table.forEach(([oldNode, newNode, expected]) => {
      assertEquals([
        ...diffMarkup(
          parser.parseFromString(oldNode, "text/html")!.body
            .firstChild as unknown as Node,
          parser.parseFromString(newNode, "text/html")!.body
            .firstChild as unknown as Node,
        ),
      ], expected);
    });
  });
});

describe("syncMarkup", () => {
  it("should update attribute patch", () => {
    const table: [string, MarkupPatch, string][] = [
      [
        "<div></div>",
        {
          action: "add",
          type: DataType.Attribute,
          name: "title",
          value: "test",
        },
        `<div title="test"></div>`,
      ],
      [
        `<div title="test"></div>`,
        {
          action: "delete",
          type: DataType.Attribute,
          name: "title",
          value: "test",
        },
        `<div></div>`,
      ],
      [
        `<div xml:title="test"></div>`,
        {
          action: "delete",
          type: DataType.Attribute,
          name: "xml:title",
          value: "test",
        },
        `<div></div>`,
      ],
      [
        `<div xml:title="test"></div>`,
        {
          action: "substitute",
          type: DataType.Attribute,
          name: "xml:title",
          from: "test",
          to: "test2",
        },
        `<div xml:title="test2"></div>`,
      ],
      [
        `test`,
        {
          action: "substitute",
          type: DataType.Data,
          from: "test",
          to: "test2",
        },
        `test2`,
      ],
    ];

    table.forEach(([node, patch, expected]) => {
      const root = parser.parseFromString(node, "text/html");

      syncMarkup(root?.body.firstChild, patch);
      assertEquals(root?.body.innerHTML, expected);
    });
  });

  it("should throw error if the node is not Element", () => {
    const table: [string, MarkupPatch][] = [
      [
        "text",
        {
          action: "add",
          type: DataType.Attribute,
          name: "title",
          value: "test",
        },
      ],
      [
        "<div></div>",
        {
          action: "substitute",
          type: DataType.Data,
          from: "text",
          to: "text2",
        },
      ],
    ];

    table.forEach(([node, patch]) => {
      const root = parser.parseFromString(node, "text/html");

      assertThrows(
        () => syncMarkup(root?.body.firstChild, patch),
      );
    });
  });
});

describe("MarkupReconciler", () => {
  it("diff should equal to diffMarkup", () => {
    assert(new MarkupReconciler().diff === diffMarkup);
  });

  it("update should equal to syncMarkup", () => {
    assert(new MarkupReconciler().update === syncMarkup);
  });
});
