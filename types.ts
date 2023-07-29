// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export type Path = string | number;

export interface Differ {
  (
    oldNode: Node,
    newNode: Node,
    paths: readonly Path[],
  ): Iterable<Patch>;
}

export interface Position {
  /** Absolute path to target. */
  paths: readonly Path[];
}

export interface DeletionPatch extends Position {
  type: PatchType.Delete;
}

interface BasePatch extends Position {
  type: PatchType;
}

class BasePatch implements Position {
  paths: readonly Path[];

  constructor(paths: readonly Path[]) {
    this.paths = paths;
  }
}

export class SubstitutePatch<T = Node> extends BasePatch {
  type: PatchType.Substitute = PatchType.Substitute;
  old: T;
  new: T;

  #isAttr: boolean;

  isAttr(): this is SubstitutePatch<Attr> {
    return this.#isAttr;
  }

  constructor(paths: readonly Path[], from: T, to: T, isAttr: boolean = false) {
    super(paths);
    this.old = from;
    this.new = to;
    this.#isAttr = isAttr;
  }
}

export class InsertionPatch extends BasePatch {
  type: PatchType.Insert = PatchType.Insert;
  to: readonly Path[];
  node: Node;
  constructor(paths: readonly Path[], to: readonly Path[], node: Node) {
    super(paths);
    this.to = to;
    this.node = node;
  }
}

export interface AdditionPatch extends BasePatch {
  type: PatchType.Add;
  node: Attr;
}

export enum PatchType {
  Insert = "insert",
  Substitute = "substitute",
  Add = "add",
  Delete = "delete",
  Move = "move",
}

export interface MovementPatch {
  type: PatchType.Move;
  paths: readonly Path[];
  from: number;
  to: number;
}

export type Patch<T = Node> =
  | SubstitutePatch<T>
  | AdditionPatch
  | DeletionPatch
  | MovementPatch
  | InsertionPatch;
