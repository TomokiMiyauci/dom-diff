// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import type { ElementLike, Named } from "./types.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  PatchType,
  type Reconciler,
  type SubstitutePatch,
} from "../types.ts";
import { distinct, not } from "../deps.ts";

interface AttributeSubstitutePatch extends Named, SubstitutePatch<string> {}

interface AttributeData extends Named {
  value: string;
}

/** Patch for attribute. */
export type AttributePatch =
  | AdditionPatch<AttributeData>
  | DeletionPatch<AttributeData>
  | AttributeSubstitutePatch;

export function* diffAttribute(
  oldNode: Node | ElementLike,
  newNode: Node | ElementLike,
): Generator<AttributePatch> {
  if (!("getAttributeNames" in oldNode && "getAttributeNames" in newNode)) {
    return;
  }

  const oldEl = oldNode;
  const newEl = newNode;
  const oldAttributeNames = oldEl.getAttributeNames();
  const newAttributeNames = newEl.getAttributeNames();
  const allAttributeNames = distinct(
    oldAttributeNames.concat(newAttributeNames),
  );
  const patches = allAttributeNames.filter(not(equalsAttribute)).map(diffAttr);

  for (const patch of patches) yield patch;

  function equalsAttribute(name: string): boolean {
    return oldEl.hasAttribute(name) && newEl.hasAttribute(name) &&
      oldEl.getAttribute(name) === newEl.getAttribute(name);
  }

  function diffAttr(qualifiedName: string): AttributePatch {
    if (!oldEl.hasAttribute(qualifiedName)) {
      const attrStr = newEl.getAttribute(qualifiedName)!;

      return { action: PatchType.Add, name: qualifiedName, value: attrStr };
    }

    if (!newEl.hasAttribute(qualifiedName)) {
      const value = oldEl.getAttribute(qualifiedName)!;

      return { action: PatchType.Delete, name: qualifiedName, value };
    }

    const leftAttr = oldEl.getAttribute(qualifiedName)!;
    const rightAttr = newEl.getAttribute(qualifiedName)!;

    return {
      action: PatchType.Substitute,
      name: qualifiedName,
      from: leftAttr,
      to: rightAttr,
    };
  }
}

export function syncAttribute(
  node: Node | ElementLike,
  patch: AttributePatch,
): void {
  switch (patch.action) {
    case PatchType.Add: {
      if ("setAttribute" in node) {
        node.setAttribute(patch.name, patch.value);
        break;
      }

      throw new Error(Msg.NotElement);
    }

    case PatchType.Delete: {
      if ("removeAttribute" in node) {
        node.removeAttribute(patch.name);
        break;
      }

      throw new Error(Msg.NotElement);
    }

    case PatchType.Substitute: {
      if ("setAttribute" in node) {
        node.setAttribute(patch.name, patch.to);
        break;
      }

      throw new Error(Msg.NotElement);
    }
  }
}

/** Attribute reconciler.
 *
 * @example
 * ```ts
 * import { AttributeReconciler } from "https://deno.land/x/dom_diff/reconcilers/attribute.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 * const parser = new DOMParser();
 * const oldNode = `<div></div>`;
 * const newNode = `<div title="test"></div>`;
 * const oldRoot = parser.parseFromString(oldNode, "text/html");
 * const newRoot = parser.parseFromString(newNode, "text/html");
 * const reconciler = new AttributeReconciler();
 * const patches = reconciler.diff(
 *   oldRoot.body.firstChild!,
 *   newRoot.body.firstChild!,
 * );
 *
 * for (const patch of patches) {
 *   reconciler.update(oldRoot.body.firstChild!, patch);
 * }
 *
 * assertEquals(oldRoot.body.innerHTML, newNode);
 * ```
 */
export class AttributeReconciler implements Reconciler<AttributePatch> {
  diff = diffAttribute;
  update = syncAttribute;
}

const enum Msg {
  NotElement = "target node should be Element",
}
