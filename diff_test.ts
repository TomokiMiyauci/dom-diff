// deno-lint-ignore-file no-explicit-any
// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import { diff, diffChildren } from "./diff.ts";
import { DiffResult } from "./types.ts";
import { assertEquals, describe, it } from "./_dev_deps.ts";
import {
  Document,
  Node as _Node,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const document = new Document();
const div = document.createElement("div");
const div2 = document.createElement("div");
const span = document.createElement("span");
const textA = document.createTextNode("testA");
const textB = document.createTextNode("testB");
const fragment = document.createDocumentFragment();

describe("diff", () => {
  type TextCase = [
    from: _Node,
    to: _Node,
    expected: DiffResult<PropertyKey, unknown>[],
    description?: string,
  ];

  it("should detect root node value difference by default, it should return substitute patch with from and to node", () => {
    const table: TextCase[] = [
      [
        div,
        div,
        [],
        "same reference",
      ],
      [
        document.createElement("div"),
        document.createElement("div"),
        [],
        "not same reference but same node type and tag name",
      ],
      [
        div,
        span,
        [{
          paths: [],
          type: "node",
          patch: { action: "substitute", from: div, to: span },
        }],
        "not same tag name",
      ],
      [textA, textB, [], "same node type(#text)"],
      [
        div,
        textA,
        [{
          paths: [],
          type: "node",
          patch: { action: "substitute", from: div, to: textA },
        }],
        "not same node type(#element, #text)",
      ],
      [
        div,
        fragment,
        [
          {
            paths: [],
            type: "node",
            patch: { action: "substitute", from: div, to: fragment },
          },
        ],
        "not same node type(#element, #document-fragment)",
      ],
    ];

    table.forEach(([from, to, expected]) => {
      assertEquals([
        ...diff(from as any as Node, to as any as Node),
      ], expected);
    });
  });

  it("should return 1 depth", () => {
    const root = tree(div, div);
    const div3 = document.createElement("div");

    const table: TextCase[] = [
      [root, root, []],
      [tree(div, div), tree(div, div2), []],
      [tree(div, div3), tree(div, textA), [
        {
          paths: [0],
          type: "node",
          patch: { action: "delete", node: div3 },
        },
        {
          paths: [],
          type: "node",
          patch: { action: "add", pos: 0, node: textA },
        },
      ]],
    ];

    table.forEach(([from, to, expected]) => {
      assertEquals([
        ...diff(from as any as Node, to as any as Node),
      ], expected);
    });
  });
});

describe("diffChildren", () => {
  type TextCase = [
    from: Iterable<_Node>,
    to: Iterable<_Node>,
    expected: (DiffResult<PropertyKey, unknown>)[],
    description?: string,
  ];

  it("should return 1 depth children diff", () => {
    const table: TextCase[] = [
      [[], [], []],
      [[div], [], [{
        paths: [0],
        type: "node",
        patch: { action: "delete", node: div },
      }]],
      [[], [div], [{
        paths: [],

        type: "node",
        patch: { action: "add", pos: 0, node: div },
      }]],
      [[div], [div], []],
      [[div], [div2], [], "same node value but not same reference"],
      [[div], [span], [{
        paths: [0],
        type: "node",
        patch: { action: "delete", node: div },
      }, {
        paths: [],
        type: "node",
        patch: { action: "add", pos: 0, node: span },
      }], "TODO: As SES, substitute is correct"],
      [[textA], [span], [{
        paths: [0],
        type: "node",
        patch: { action: "delete", node: textA },
      }, {
        paths: [],
        type: "node",
        patch: { action: "add", pos: 0, node: span },
      }], "TODO: As SES, substitute is correct"],
      [[div, div], [div], [
        {
          paths: [1],
          type: "node",
          patch: { action: "delete", node: div },
        },
      ]],
      [[div], [div, div], [
        {
          paths: [],
          type: "node",
          patch: { action: "add", pos: 1, node: div },
        },
      ]],
      [[div, div2], [div, div2], []],
      [[div, span], [div, div], [
        {
          paths: [1],
          type: "node",
          patch: { action: "delete", node: span },
        },
        {
          paths: [],
          type: "node",
          patch: { action: "add", pos: 1, node: div },
        },
      ]],
      [[span, div], [div, div], [
        {
          paths: [0],
          type: "node",
          patch: { action: "delete", node: span },
        },
        {
          paths: [],
          type: "node",
          patch: { action: "add", pos: 1, node: div },
        },
      ]],
      [[span, div], [div, span], [
        {
          paths: [0],
          type: "node",
          patch: { action: "move", from: 0, to: 1 },
        },
      ]],
    ];

    table.forEach(([from, to, expected]) => {
      assertEquals([
        ...diffChildren(
          from as any as Iterable<Node>,
          to as any as Iterable<Node>,
        ),
      ], expected);
    });
  });
});

function tree(root: _Node, ...children: _Node[]): _Node {
  root = root.cloneNode(true);

  for (const child of children) {
    root.appendChild(child);
  }

  return root;
}
