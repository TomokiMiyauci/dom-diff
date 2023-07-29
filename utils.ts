// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { Path } from "./types.ts";

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
  paths: readonly Path[],
): Node | ChildNode | Attr | undefined {
  if (!paths.length) return node;

  const [first, ...rest] = paths;

  if (typeof first === "string") {
    if (node instanceof Element) {
      return (node.attributes as FixedNamedNodeMap)[first];
    }

    return;
  }
  const child = node.childNodes[first];

  if (!child) return;

  return resolvePaths(child, rest);
}

type FixedNamedNodeMap =
  & { [key in string]?: Attr }
  & NamedNodeMap;

export function replaceWith(newNode: Node, oldNode: Node): boolean {
  return !!oldNode.parentNode?.replaceChild(newNode, oldNode);
}

export function remove(node: Node): boolean {
  return !!node.parentNode?.removeChild(node);
}

export function removeAttributeNode(node: Attr): boolean {
  if (node.ownerElement) {
    node.ownerElement.removeAttributeNS(
      node.namespaceURI,
      node.localName,
    );
    return true;
  }

  return false;
}
