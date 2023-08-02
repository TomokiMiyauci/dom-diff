// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import type { CharacterDataDep, ElementDep } from "./generated.d.ts";

export interface Position {
  /** Absolute path to target node. */
  paths: readonly number[];
}

export enum PatchType {
  Substitute = "substitute",
  Add = "add",
  Delete = "delete",
  Move = "move",
}

interface FromTo<T> {
  from: T;
  to: T;
}

export interface SubstitutePatch<K extends PropertyKey, V> {
  patchType: `${PatchType.Substitute}`;
  dataType: K;
  data: FromTo<V>;
}

export interface DeletionPatch<K extends PropertyKey, V> {
  patchType: `${PatchType.Delete}`;
  dataType: K;
  data: V;
}

export interface AdditionPatch<K extends PropertyKey, V> {
  patchType: `${PatchType.Add}`;
  dataType: K;
  data: V;
}

export interface MovementPatch<K extends PropertyKey> {
  patchType: `${PatchType.Move}`;
  dataType: K;
  data: FromTo<number>;
}

export type EditPatch<K extends PropertyKey, V> =
  | SubstitutePatch<K, V>
  | DeletionPatch<K, V>
  | AdditionPatch<K, V>;

export type Patch<K extends PropertyKey, V> =
  | EditPatch<K, V>
  | MovementPatch<K>;

export type CharacterDataLike = Pick<CharacterData, CharacterDataDep>;

export type ElementLike = Pick<Element, ElementDep>;
