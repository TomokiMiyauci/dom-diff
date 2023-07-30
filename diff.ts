// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { enumerate, papplyRest, zip } from "./deps.ts";
import {
  diff as diffList,
  Patch as ListPatch,
  PatchType as ListPatchType,
} from "../list-diff/diff.ts";
import {
  DeletionPatch,
  Differ,
  InsertionPatch,
  MovementPatch,
  Patch,
  PatchType,
  Path,
  SubstitutePatch,
} from "./types.ts";
import { markupDiffer } from "./differ.ts";

export interface DiffOptions {
  differ: Differ;

  /**
   * @default []
   */
  paths: readonly Path[];
}

export function* diff(
  oldNode: Node,
  newNode: Node,
  { paths = [], differ = markupDiffer }: Partial<DiffOptions> = {},
): Iterable<Patch> {
  if (oldNode === newNode) return;

  if (oldNode.nodeName !== newNode.nodeName) {
    return yield new SubstitutePatch(paths, oldNode, newNode);
  }

  yield* differ(oldNode, newNode, paths);
  yield* diffChildren(oldNode.childNodes, newNode.childNodes, {
    paths,
    differ,
  });
}

export function* diffChildren(
  oldNode: NodeListOf<ChildNode>,
  newNode: NodeListOf<ChildNode>,
  { paths = [], differ }: DiffOptions,
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
  ) yield* diff(oldNode, newNode, { paths: paths.concat(index), differ });
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
