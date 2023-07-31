// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { CharacterDataDep, ElementDep } from "./generated.d.ts";

export interface Differ<P extends Patch> {
  (oldNode: Node, newNode: Node): Iterable<P>;
}

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

export interface MovementPatch<K extends string> {
  type: PatchType.Move;
  valueType: K;

  value: {
    from: number;
    to: number;
  };
}

export type EventHandlerName = `on${string}`;

export interface Patch<
  T extends string = string,
  K extends string = string,
  V = unknown,
> {
  type: T;
  valueType: K;
  value: V;
}

export interface SubstitutePatch<K extends string, V> {
  type: PatchType.Substitute;
  valueType: K;
  value: { from: V; to: V };
}

export type DiffResult<
  T extends string = string,
  K extends string = string,
  V = unknown,
> = Position & Patch<T, K, V>;

export interface DeletionPatch<K extends string, V> {
  type: PatchType.Delete;
  valueType: K;
  value: V;
}

export interface AdditionPatch<K extends string, V> {
  type: PatchType.Add;
  valueType: K;
  value: V;
}

export type CharacterDataLike = Pick<CharacterData, CharacterDataDep>;

export type ElementLike = Pick<Element, ElementDep>;
