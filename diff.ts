// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { distinct, enumerate, papplyRest, zip } from "./deps.ts";
import {
  diff as diffList,
  Patch as ListPatch,
  PatchType as ListPatchType,
} from "../list-diff/diff.ts";
import { not } from "./utils.ts";
import type { Path } from "./types.ts";

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

interface Differ {
  (
    oldNode: Node,
    newNode: Node,
    paths: readonly Path[],
    differ: Differ,
  ): Iterable<Patch>;
}

export function* diff(
  oldNode: Node,
  newNode: Node,
  paths: readonly Path[] = [],
  differ: Differ = defaultDiffer,
): Iterable<Patch> {
  if (oldNode === newNode) return;

  if (oldNode.nodeType !== newNode.nodeType) {
    return yield new SubstitutePatch(paths, oldNode, newNode);
  }

  const differences = differ(oldNode, newNode, paths, differ);

  return yield* differences;
}

function* defaultDiffer(
  oldNode: Node,
  newNode: Node,
  paths: readonly Path[],
  differ: Differ,
): Iterable<Patch> {
  if (oldNode instanceof Element && newNode instanceof Element) {
    yield* diffElement(oldNode, newNode, paths);
  }

  if (oldNode instanceof CharacterData && newNode instanceof CharacterData) {
    yield* diffCharacterData(oldNode, newNode, paths);
  }

  if (oldNode.hasChildNodes() || newNode.hasChildNodes()) {
    yield* diffChildren(oldNode.childNodes, newNode.childNodes, paths, differ);
  }
}

export function* diffElement(
  oldNode: Element,
  newNode: Element,
  paths: readonly Path[],
): Iterable<Patch> {
  if (oldNode.tagName !== newNode.tagName) {
    return yield new SubstitutePatch(paths, oldNode, newNode);
  }

  yield* diffAttribute(oldNode, newNode, paths);
}

export function* diffCharacterData(
  oldNode: CharacterData,
  newNode: CharacterData,
  paths: readonly Path[],
): Iterable<SubstitutePatch<CharacterData>> {
  if (equalsCharacterData(oldNode, newNode)) return;

  yield new SubstitutePatch(paths, oldNode, newNode);
}

export function equalsCharacterData(
  left: CharacterData,
  right: CharacterData,
): boolean {
  return left.data === right.data;
}

export function* diffAttribute(
  oldNode: Element,
  newNode: Element,
  paths: readonly Path[],
): Iterable<Patch> {
  const allAttributeNames = distinct(
    oldNode.getAttributeNames().concat(newNode.getAttributeNames()),
  );

  function equalsAttribute(name: string): boolean {
    return oldNode.hasAttribute(name) && newNode.hasAttribute(name) &&
      oldNode.getAttributeNode(name)!.isEqualNode(
        newNode.getAttributeNode(name),
      );
  }

  function diffAttr(qualifiedName: string): Patch {
    if (!oldNode.hasAttribute(qualifiedName)) {
      const node = newNode.getAttributeNode(qualifiedName)!;

      return { type: PatchType.Add, node, paths };
    }

    if (!newNode.hasAttribute(qualifiedName)) {
      return {
        type: PatchType.Delete,
        paths: paths.concat(qualifiedName),
      };
    }

    const leftAttr = oldNode.getAttributeNode(qualifiedName)!;
    const rightAttr = newNode.getAttributeNode(qualifiedName)!;

    return new SubstitutePatch(
      paths.concat(qualifiedName),
      leftAttr,
      rightAttr,
      true,
    );
  }

  yield* allAttributeNames
    .filter(not(equalsAttribute))
    .map(diffAttr);
}

export function* diffChildren(
  oldNode: NodeListOf<ChildNode>,
  newNode: NodeListOf<ChildNode>,
  paths: readonly Path[],
  differ: Differ,
): IterableIterator<Patch> {
  const oldNodes = Array.from(oldNode);
  const newNodes = Array.from(newNode);
  const patches = diffList(oldNodes, newNodes, { keying: toKey });
  const $toPatch = papplyRest(toPatch, paths);

  yield* patches.map($toPatch);

  const reorderedOldNodes = patches.reduce(patchArray, oldNodes.slice());
  const reorderedOldNodesAndNewNodes = zip(reorderedOldNodes, newNodes);

  for (
    const [index, [oldNode, newNode]] of enumerate(reorderedOldNodesAndNewNodes)
  ) yield* differ(oldNode, newNode, paths.concat(index), differ);
}

function patchArray<T>(array: T[], patch: ListPatch<T>): T[] {
  switch (patch.type) {
    case ListPatchType.Insert: {
      array.splice(patch.index, 0, patch.item);
      return array;
    }

    case ListPatchType.Move: {
      const items = array.splice(patch.from, 1);
      array.splice(patch.to, 0, ...items);

      return array;
    }

    case ListPatchType.Remove: {
      array.splice(patch.index, 1);

      return array;
    }

    case ListPatchType.Substitute: {
      array.splice(patch.index, 1, patch.to.item);

      return array;
    }
  }
}

function toKey(node: ChildNode): string {
  return node.nodeName;
}

function toPatch<T extends Node>(
  patch: ListPatch<T>,
  paths: readonly Path[],
): InsertionPatch | MovementPatch | DeletionPatch | SubstitutePatch<T> {
  switch (patch.type) {
    case ListPatchType.Insert: {
      return new InsertionPatch(paths, paths.concat(patch.index), patch.item);
    }
    case ListPatchType.Move: {
      return {
        type: PatchType.Move,
        paths,
        from: patch.from,
        to: patch.to,
      };
    }
    case ListPatchType.Remove: {
      return {
        type: PatchType.Delete,
        paths: paths.concat(patch.index),
      };
    }
    case ListPatchType.Substitute: {
      return new SubstitutePatch(
        paths.concat(patch.index),
        patch.from.item,
        patch.to.item,
      );
    }
  }
}
