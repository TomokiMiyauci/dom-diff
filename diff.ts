// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { enumerate, imap, papplyRest, zip } from "./deps.ts";
import {
  diff as diffList,
  Patch as ListPatch,
  PatchType as ListPatchType,
} from "../list-diff/diff.ts";
import {
  AdditionPatch,
  DeletionPatch,
  Differ,
  MovementPatch,
  Patch,
  PatchType,
  Position,
  SubstitutePatch,
} from "./types.ts";
import { ChildData, TargetType } from "./target.ts";

export interface DiffOptions<R extends Patch> {
  differs?: Differ<R>[];

  /**
   * @default []
   */
  paths?: readonly number[];
}

export function* diff<P extends Patch = never>(
  oldNode: Node,
  newNode: Node,
  { paths = [], differs = [] }: DiffOptions<P> = {},
): Iterable<
  & Position
  & (
    | P
    | AdditionPatch<TargetType.Children, ChildData>
    | SubstitutePatch<TargetType.Children, ChildData>
    | DeletionPatch<TargetType.Children, ChildData>
    | MovementPatch<TargetType.Children>
    | SubstitutePatch<TargetType.Node, Node>
  )
> {
  if (oldNode === newNode) return;

  if (oldNode.nodeName !== newNode.nodeName) {
    return yield {
      type: PatchType.Substitute,
      valueType: TargetType.Node,
      paths,
      value: { from: oldNode, to: newNode },
    };
  }

  for (const differ of differs) {
    const iter = differ(oldNode, newNode);

    yield* imap(
      iter,
      (value) => ({ ...value, paths }),
    );
  }

  yield* diffChildren(oldNode.childNodes, newNode.childNodes, {
    paths,
    differs,
  });
}

export function* diffChildren<P extends Patch = never>(
  oldNode: NodeListOf<ChildNode>,
  newNode: NodeListOf<ChildNode>,
  { paths = [], differs = [] }: DiffOptions<P>,
): Iterable<
  & Position
  & (
    | P
    | AdditionPatch<TargetType.Children, ChildData>
    | SubstitutePatch<TargetType.Children, ChildData>
    | DeletionPatch<TargetType.Children, ChildData>
    | MovementPatch<TargetType.Children>
    | SubstitutePatch<TargetType.Node, Node>
  )
> {
  const oldNodes = Array.from(oldNode);
  const newNodes = Array.from(newNode);
  const patches = diffList(oldNodes, newNodes, { keying: toKey });
  const $toPatch = papplyRest(toPatch);

  yield* patches.map($toPatch).map((value) => ({ ...value, paths }));

  const reorderedOldNodes = patches.reduce(patchArray, oldNodes.slice());
  const reorderedOldNodesAndNewNodes = zip(reorderedOldNodes, newNodes);

  for (
    const [index, [oldNode, newNode]] of enumerate(reorderedOldNodesAndNewNodes)
  ) yield* diff(oldNode, newNode, { paths: paths.concat(index), differs });
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

function toPatch(
  patch: ListPatch<Node>,
):
  | AdditionPatch<TargetType.Children, ChildData>
  | SubstitutePatch<TargetType.Children, ChildData>
  | DeletionPatch<TargetType.Children, ChildData>
  | MovementPatch<TargetType.Children> {
  switch (patch.type) {
    case ListPatchType.Insert: {
      return {
        type: PatchType.Add,
        valueType: TargetType.Children,
        value: {
          pos: patch.index,
          node: patch.item,
        },
      };
    }
    case ListPatchType.Move: {
      return {
        type: PatchType.Move,
        valueType: TargetType.Children,
        value: {
          from: patch.from,
          to: patch.to,
        },
      };
    }
    case ListPatchType.Remove: {
      return {
        type: PatchType.Delete,
        valueType: TargetType.Children,
        value: {
          pos: patch.index,
          node: patch.item,
        },
      };
    }
    case ListPatchType.Substitute: {
      return {
        type: PatchType.Substitute,
        valueType: TargetType.Children,
        value: {
          from: {
            pos: patch.index,
            node: patch.from.item,
          },
          to: {
            pos: patch.index,
            node: patch.to.item,
          },
        },
      };
    }
  }
}
