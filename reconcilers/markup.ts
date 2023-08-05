// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { assoc, imap } from "../deps.ts";
import { AttributePatch, diffAttribute, syncAttribute } from "./attribute.ts";
import { DataPatch, diffData, syncData } from "./data.ts";
import type { Reconciler } from "../types.ts";

export const enum DataType {
  Attribute = "attribute",
  Data = "data",
}

interface TypedDataPatch extends DataPatch {
  type: DataType.Data;
}

type TypedAttributePatch = AttributePatch & {
  type: DataType.Attribute;
};

/** Markup patch. */
export type MarkupPatch =
  | TypedAttributePatch
  | TypedDataPatch;

const injectTypeOfAttribute = /*@__PURE__*/ assoc("type", DataType.Attribute);
const injectTypeOfCharacterData = /*@__PURE__*/ assoc("type", DataType.Data);

export function* diffMarkup(
  oldNode: Node,
  newNode: Node,
): Generator<MarkupPatch, void, undefined> {
  yield* imap(diffAttribute(oldNode, newNode), injectTypeOfAttribute);
  yield* imap(diffData(oldNode, newNode), injectTypeOfCharacterData);
}

export function syncMarkup(node: Node, patch: MarkupPatch): void {
  switch (patch.type) {
    case DataType.Attribute:
      return syncAttribute(node, patch);
    case DataType.Data:
      return syncData(node, patch);
  }
}

/** Markup reconciler.
 * @example
 * ```ts
 * import { MarkupReconciler } from "https://deno.land/x/dom_diff/reconcilers/markup.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 * const parser = new DOMParser();
 * const oldNode = `<div></div>`;
 * const newNode = `<div title="test"></div>`;
 * const oldRoot = parser.parseFromString(oldNode, "text/html");
 * const newRoot = parser.parseFromString(newNode, "text/html");
 * const reconciler = new MarkupReconciler();
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
export class MarkupReconciler implements Reconciler<MarkupPatch> {
  diff = diffMarkup;
  update = syncMarkup;
}
