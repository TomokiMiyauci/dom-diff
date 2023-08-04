// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

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

export interface SubstitutePatch<V> extends FromTo<V> {
  action: `${PatchType.Substitute}`;
}

export type DeletionPatch<V> = { action: `${PatchType.Delete}` } & V;

export type AdditionPatch<V> = { action: `${PatchType.Add}` } & V;

export interface MovementPatch extends FromTo<number> {
  action: `${PatchType.Move}`;
}

export interface DiffResult<T extends PropertyKey, V> extends Position {
  type: T;
  patch: V;
}

export interface Reconciler<T> {
  diff(oldNode: Node, newNode: Node): Iterable<T>;
  sync(node: Node, patch: T): void;
}

export interface Diff<R> {
  (oldNode: Node, newNode: Node): Iterable<R>;
}

export interface Sync<P> {
  (node: Node, patch: P): void;
}
