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

export interface MovementPatch<K extends PropertyKey> {
  type: PatchType.Move;
  value: { type: K; from: number; to: number };
}

export type EventHandlerName = `on${string}`;

export type Patch<K extends PropertyKey, V> =
  | EditPatch<K, V>
  | MovementPatch<K>;

export interface SubstitutePatch<T extends PropertyKey, V> {
  type: PatchType.Substitute;
  value: { type: T; from: V; to: V };
}

export interface DeletionPatch<T extends PropertyKey, V> {
  type: PatchType.Delete;
  value: { type: T; value: V };
}

export interface AdditionPatch<T extends PropertyKey, V> {
  type: PatchType.Add;
  value: { type: T; value: V };
}

export type EditPatch<K extends PropertyKey, V> =
  | SubstitutePatch<K, V>
  | DeletionPatch<K, V>
  | AdditionPatch<K, V>;

export type CharacterDataLike = Pick<CharacterData, CharacterDataDep>;

export type ElementLike = Pick<Element, ElementDep>;
