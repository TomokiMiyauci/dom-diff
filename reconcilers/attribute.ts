// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import type { ElementLike, Named } from "./types.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  type Reconciler,
  type SubstitutePatch,
} from "../types.ts";
import { distinct, not } from "../deps.ts";

interface AttributeSubstitutePatch extends Named, SubstitutePatch<string> {}

interface AttributeData extends Named {
  value: string;
}

export type AttributePatch =
  | AdditionPatch<AttributeData>
  | DeletionPatch<AttributeData>
  | AttributeSubstitutePatch;

export function* diffAttribute(
  oldNode: Node | ElementLike,
  newNode: Node | ElementLike,
): Generator<AttributePatch, void, undefined> {
  if (!("getAttributeNames" in oldNode && "getAttributeNames" in newNode)) {
    return;
  }

  const oldEl = oldNode;
  const newEl = newNode;
  const allAttributeNames = distinct(
    oldEl.getAttributeNames().concat(newEl.getAttributeNames()),
  );

  function equalsAttribute(name: string): boolean {
    return oldEl.hasAttribute(name) && newEl.hasAttribute(name) &&
      oldEl.getAttributeNode(name)!.isEqualNode(
        newEl.getAttributeNode(name),
      );
  }

  function diffAttr(
    qualifiedName: string,
  ): AttributePatch {
    if (!oldEl.hasAttribute(qualifiedName)) {
      const attrStr = newEl.getAttribute(qualifiedName)!;

      return { action: "add", name: qualifiedName, value: attrStr };
    }

    if (!newEl.hasAttribute(qualifiedName)) {
      const value = newEl.getAttribute(qualifiedName)!;

      return { action: "delete", name: qualifiedName, value };
    }

    const leftAttr = oldEl.getAttribute(qualifiedName)!;
    const rightAttr = newEl.getAttribute(qualifiedName)!;

    return {
      action: "substitute",
      name: qualifiedName,
      from: leftAttr,
      to: rightAttr,
    };
  }

  yield* allAttributeNames
    .filter(not(equalsAttribute))
    .map(diffAttr);
}

export function syncAttribute(
  node: Node | ElementLike,
  patch: AttributePatch,
): void {
  switch (patch.action) {
    case "add": {
      if ("setAttribute" in node) {
        node.setAttribute(patch.name, patch.value);
        break;
      }

      throw new Error("target node should be element");
    }
    case "delete": {
      if ("removeAttribute" in node) {
        node.removeAttribute(patch.name);
        break;
      }

      throw new Error("target node should be element");
    }
    case "substitute": {
      if ("setAttribute" in node) {
        node.setAttribute(patch.name, patch.to);
        break;
      }

      throw new Error("target node should be element");
    }
  }
}

export class AttributeReconciler implements Reconciler<AttributePatch> {
  diff = diffAttribute;
  sync = syncAttribute;
}
