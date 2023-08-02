// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { headTail } from "./deps.ts";

// deno-lint-ignore no-explicit-any
export function not<T extends (...args: any) => boolean>(fn: T): T {
  const proxy = new Proxy(fn, {
    apply: (target, thisArg, argArray) => {
      return !target.apply(thisArg, argArray);
    },
  });

  return proxy;
}

export function resolvePaths(
  node: Node,
  paths: readonly number[],
): Node | ChildNode | undefined {
  if (!paths.length) return node;

  const [first, rest] = headTail(paths as [number, ...number[]]);
  const child = node.childNodes[first];

  if (!child) return;

  return resolvePaths(child, rest);
}

export function replaceWith(newNode: Node, oldNode: Node): boolean {
  return !!oldNode.parentNode?.replaceChild(newNode, oldNode);
}
