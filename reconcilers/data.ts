// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import { PatchType, type Reconciler, type SubstitutePatch } from "../types.ts";

/** Patch for `data` property. */
export type DataPatch = SubstitutePatch<unknown>;

export function* diffData(
  oldNode: object,
  newNode: object,
): Generator<DataPatch> {
  if (
    !("data" in oldNode && "data" in newNode) ||
    oldNode.data === newNode.data
  ) return;

  yield { action: PatchType.Substitute, from: oldNode.data, to: newNode.data };
}

export function syncData(node: object, patch: DataPatch): void {
  if (!("data" in node)) throw new Error("node should have \`data\` property");

  node.data = patch.to;
}

/** `data` property reconciler.
 *
 * @example
 * ```ts
 * import { DataReconciler } from "https://deno.land/x/dom_diff/reconcilers/data.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 * declare const data1: string;
 * declare const data2: string;
 * const oldNode = document.createTextNode(data1);
 * const newNode = document.createTextNode(data2);
 * const reconciler = new DataReconciler();
 * const patches = reconciler.diff(oldNode, newNode);
 *
 * for (const patch of patches) {
 *  reconciler.update(oldNode, patch);
 * }
 *
 * assertEquals(oldNode.data, data2);
 * ```
 */
export class DataReconciler implements Reconciler<DataPatch> {
  diff = diffData;
  update = syncData;
}
