// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { enumerate, imap, papplyRest, zip } from "./deps.ts";
import {
  diff as diffList,
  Patch as ListPatch,
  PatchType as ListPatchType,
} from "./utils/list_diff/diff.ts";
import {
  AdditionPatch,
  DeletionPatch,
  MovementPatch,
  Patch,
  PatchType,
  Position,
  SubstitutePatch,
} from "./types.ts";
import { ChildData, TargetType } from "./target.ts";

export interface DiffOptions<T extends Patch<PropertyKey, unknown>> {
  differ?: (oldNode: Node, newNode: Node) => Iterable<T>;

  /**
   * @default []
   */
  paths?: readonly number[];
}

export function* diff<T extends Patch<PropertyKey, unknown> = never>(
  oldNode: Node,
  newNode: Node,
  { paths = [], differ }: DiffOptions<T> = {},
): Iterable<
  & Position
  & (
    | T
    | AdditionPatch<TargetType.Children, ChildData>
    | DeletionPatch<TargetType.Children, ChildData>
    | MovementPatch<TargetType.Children>
    | SubstitutePatch<TargetType.Node, Node>
  )
> {
  if (oldNode === newNode) return;

  if (oldNode.nodeName !== newNode.nodeName) {
    return yield {
      paths,
      patchType: PatchType.Substitute,
      dataType: TargetType.Node,
      data: { from: oldNode, to: newNode },
    };
  }

  if (differ) {
    const iter = differ(oldNode, newNode);

    yield* imap(
      iter,
      (value) => ({ ...value, paths }),
    );
  }

  yield* diffChildren(oldNode.childNodes, newNode.childNodes, {
    paths,
    differ,
  });
}

export function* diffChildren<T extends Patch<PropertyKey, unknown> = never>(
  oldNode: Iterable<Node>,
  newNode: Iterable<Node>,
  { paths = [], differ }: DiffOptions<T> = {},
): Iterable<
  & Position
  & (
    | T
    | AdditionPatch<TargetType.Children, ChildData>
    | DeletionPatch<TargetType.Children, ChildData>
    | MovementPatch<TargetType.Children>
    | SubstitutePatch<TargetType.Node, Node>
  )
> {
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

function toKey(node: Node): string {
  return node.nodeName;
}

function toPatch(
  patch: ListPatch<Node>,
  paths: readonly number[],
):
  & Position
  & (
    | AdditionPatch<TargetType.Children, ChildData>
    | SubstitutePatch<TargetType.Node, Node>
    | DeletionPatch<TargetType.Children, ChildData>
    | MovementPatch<TargetType.Children>
  ) {
  switch (patch.type) {
    case ListPatchType.Insert: {
      return {
        paths,
        patchType: PatchType.Add,
        dataType: TargetType.Children,
        data: { pos: patch.index, node: patch.item },
      };
    }
    case ListPatchType.Move: {
      return {
        paths,
        patchType: PatchType.Move,
        dataType: TargetType.Children,
        data: { from: patch.from, to: patch.to },
      };
    }
    case ListPatchType.Remove: {
      return {
        paths,
        patchType: PatchType.Delete,
        dataType: TargetType.Children,
        data: { pos: patch.index, node: patch.item },
      };
    }

    // TODO(miyauci): support it
    case ListPatchType.Substitute: {
      return {
        paths: paths.concat(patch.index),
        patchType: PatchType.Substitute,
        dataType: TargetType.Node,
        data: { from: patch.from.item, to: patch.to.item },
      };
    }
  }
}
