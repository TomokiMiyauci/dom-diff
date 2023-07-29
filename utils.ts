// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

// deno-lint-ignore no-explicit-any
export function not<T extends (...args: any) => boolean>(fn: T): T {
  const proxy = new Proxy(fn, {
    apply: (target, thisArg, argArray) => {
      return !target.apply(thisArg, argArray);
    },
  });

  return proxy;
}

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
