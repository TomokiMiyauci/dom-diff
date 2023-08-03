// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { assoc, imap } from "../deps.ts";
import { AttributePatch, diffAttribute, syncAttribute } from "./attribute.ts";
import {
  CharacterDataPatch,
  diffCharacterData,
  syncCharacterData,
} from "./character_data.ts";

enum DataType {
  Attribute = "attribute",
  CharacterData = "character-data",
}

interface TypedCharacterDataPatch extends CharacterDataPatch {
  type: DataType.CharacterData;
}

type TypedAttributePatch = AttributePatch & {
  type: DataType.Attribute;
};

export type MarkupPatch =
  | TypedAttributePatch
  | TypedCharacterDataPatch;

const injectTypeOfAttribute = assoc("type", DataType.Attribute);
const injectTypeOfCharacterData = assoc("type", DataType.CharacterData);

export function* diffMarkup(
  oldNode: Node,
  newNode: Node,
): IterableIterator<MarkupPatch> {
  yield* imap(diffAttribute(oldNode, newNode), injectTypeOfAttribute);
  yield* imap(diffCharacterData(oldNode, newNode), injectTypeOfCharacterData);
}

export function syncMarkup(node: Node, patch: MarkupPatch): void {
  switch (patch.type) {
    case DataType.Attribute:
      return syncAttribute(node, patch);
    case DataType.CharacterData:
      return syncCharacterData(node, patch);
  }
}

export class MarkupReconciler {
  static diff = diffMarkup;
  static sync = syncMarkup;
}
