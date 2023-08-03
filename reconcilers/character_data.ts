// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { type CharacterDataLike, type SubstitutePatch } from "../types.ts";

export type CharacterDataPatch = SubstitutePatch<string>;

export function* diffCharacterData(
  oldNode: Node | CharacterDataLike,
  newNode: Node | CharacterDataLike,
): Generator<CharacterDataPatch> {
  if (!("data" in oldNode && "data" in newNode)) return;
  if (equalsData(oldNode, newNode)) return;

  yield { action: "substitute", from: oldNode.data, to: newNode.data };
}

export function syncCharacterData(
  node: Node | CharacterDataLike,
  patch: CharacterDataPatch,
): void {
  if ("data" in node) {
    node.data = patch.to;
    return;
  }

  throw new Error("target node should have data property");
}

export class CharacterDataReconciler {
  static diff = diffCharacterData;
  static sync = syncCharacterData;
}

export function equalsData(
  left: { data: unknown },
  right: { data: unknown },
): boolean {
  return left.data === right.data;
}
