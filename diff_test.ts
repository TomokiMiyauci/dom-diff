// deno-lint-ignore-file no-explicit-any
// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import { diff, diffChildren } from "./diff.ts";
import { Patch, Position } from "./types.ts";
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
    expected: (Position & Patch)[],
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
          type: "substitute",
          valueType: "node",
          value: { from: div, to: span },
        }],
        "not same tag name",
      ],
      [textA, textB, [], "same node type(#text)"],
      [
        div,
        textA,
        [{
          paths: [],
          type: "substitute",
          valueType: "node",
          value: { from: div, to: textA },
        }],
        "not same node type(#element, #text)",
      ],
      [
        div,
        fragment,
        [
          {
            paths: [],
            type: "substitute",
            valueType: "node",
            value: { from: div, to: fragment },
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
          type: "delete",
          paths: [],
          valueType: "children",
          value: {
            pos: 0,
            node: div3,
          },
        },
        {
          type: "add",
          paths: [],
          valueType: "children",
          value: {
            pos: 0,
            node: textA,
          },
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
    expected: (Position & Patch)[],
    description?: string,
  ];

  it("should return 1 depth children diff", () => {
    const table: TextCase[] = [
      [[], [], []],
      [[div], [], [{
        paths: [],
        type: "delete",
        valueType: "children",
        value: { pos: 0, node: div },
      }]],
      [[], [div], [{
        paths: [],
        type: "add",
        valueType: "children",
        value: { pos: 0, node: div },
      }]],
      [[div], [div], []],
      [[div], [div2], [], "same node value but not same reference"],
      [[div], [span], [{
        paths: [],
        type: "delete",
        valueType: "children",
        value: { pos: 0, node: div },
      }, {
        paths: [],
        type: "add",
        valueType: "children",
        value: { pos: 0, node: span },
      }], "TODO: As SES, substitute is correct"],
      [[textA], [span], [{
        paths: [],
        type: "delete",
        valueType: "children",
        value: { pos: 0, node: textA },
      }, {
        paths: [],
        type: "add",
        valueType: "children",
        value: { pos: 0, node: span },
      }], "TODO: As SES, substitute is correct"],
      [[div, div], [div], [
        {
          paths: [],
          type: "delete",
          valueType: "children",
          value: {
            pos: 1,
            node: div,
          },
        },
      ]],
      [[div], [div, div], [
        {
          paths: [],
          type: "add",
          valueType: "children",
          value: {
            pos: 1,
            node: div,
          },
        },
      ]],
      [[div, div2], [div, div2], []],
      [[div, span], [div, div], [
        {
          type: "delete",
          paths: [],
          valueType: "children",
          value: {
            pos: 1,
            node: span,
          },
        },
        {
          type: "add",
          paths: [],
          valueType: "children",
          value: {
            pos: 1,
            node: div,
          },
        },
      ]],
      [[span, div], [div, div], [
        {
          type: "delete",
          paths: [],
          valueType: "children",
          value: { pos: 0, node: span },
        },
        {
          type: "add",
          paths: [],
          valueType: "children",
          value: { pos: 1, node: div },
        },
      ]],
      [[span, div], [div, span], [
        {
          type: "move",
          paths: [],
          valueType: "children",
          value: { from: 0, to: 1 },
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
