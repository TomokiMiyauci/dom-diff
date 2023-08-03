// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { enumerate, imap, papplyRest, zip } from "./deps.ts";
import {
  diff as diffList,
  type Patch as ListPatch,
  PatchType as ListPatchType,
} from "./utils/list_diff/diff.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  type DiffResult,
  type MovementPatch,
  PatchType,
  type Position,
  type SubstitutePatch,
} from "./types.ts";
import { replaceWith } from "./utils/node.ts";
import { type Yield } from "./utils/iter.ts";

interface Differ<R> {
  (oldNode: Node, newNode: Node): Iterable<R>;
}

type ToEntry<T extends Record<PropertyKey, Differ<unknown>>> = {
  [k in keyof T]: { type: k; patch: Yield<ReturnType<T[k]>> };
}[keyof T];

export interface DiffOptions {
  /**
   * @default []
   */
  paths?: readonly number[];
}

const enum DataType {
  Node = "node",
  Children = "children",
}

export type NodePatch = SubstitutePatch<Node>;

interface ChildData {
  node: Node;
  pos: number;
}
export type ChildrenPatch =
  | MovementPatch
  | AdditionPatch<ChildData>
  | DeletionPatch<ChildData>;

export function* diff<T extends Record<PropertyKey, Differ<unknown>> = never>(
  oldNode: Node,
  newNode: Node,
  differs: T = {} as T,
  options?: DiffOptions,
): Iterable<
  | DiffResult<DataType.Children, ChildrenPatch>
  | DiffResult<DataType.Node, NodePatch>
  | (
    & Position
    & (ToEntry<T>)
  )
> {
  if (oldNode === newNode) return;

  const paths = options?.paths ?? [];

  if (oldNode.nodeName !== newNode.nodeName) {
    return yield {
      paths,
      type: DataType.Node,
      patch: { action: PatchType.Substitute, from: oldNode, to: newNode },
    };
  }

  for (const key in differs) {
    const differ = differs[key]!;

    yield* imap(differ(oldNode, newNode), (patch) =>
      ({
        paths,
        type: key,
        patch,
      }) as (
        & Position
        & (ToEntry<T>)
      ));
  }

  yield* diffChildren(oldNode.childNodes, newNode.childNodes, differs, {
    paths,
  });
}

export function* diffChildren<
  T extends Record<PropertyKey, Differ<unknown>> = never,
>(
  oldNode: Iterable<Node>,
  newNode: Iterable<Node>,
  differs: T = {} as T,
  options: DiffOptions,
): Iterable<
  | DiffResult<DataType.Children, ChildrenPatch>
  | DiffResult<DataType.Node, NodePatch>
  | (
    & Position
    & (ToEntry<T>)
  )
> {
  const oldNodes = Array.from(oldNode);
  const newNodes = Array.from(newNode);
  const patches = diffList(oldNodes, newNodes, { keying: toKey });
  const paths = options.paths ?? [];
  const $toPatch = papplyRest(toPatch, paths);

  yield* patches.map($toPatch);

  const reorderedOldNodes = patches.reduce(patchArray, oldNodes.slice());
  const reorderedOldNodesAndNewNodes = zip(reorderedOldNodes, newNodes);

  for (
    const [index, [oldNode, newNode]] of enumerate(reorderedOldNodesAndNewNodes)
  ) yield* diff(oldNode, newNode, differs, { paths: paths.concat(index) });
}

export function patchArray<T>(array: T[], patch: ListPatch<T>): T[] {
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

export function toKey(node: Node): string {
  return node.nodeName;
}

export function toPatch(
  patch: ListPatch<Node>,
  paths: readonly number[],
):
  | DiffResult<DataType.Children, ChildrenPatch>
  | DiffResult<DataType.Node, NodePatch> {
  switch (patch.type) {
    case ListPatchType.Insert: {
      return {
        paths,
        type: DataType.Children,
        patch: {
          action: PatchType.Add,
          pos: patch.index,
          node: patch.item,
        },
      };
    }
    case ListPatchType.Move: {
      return {
        paths,
        type: DataType.Children,
        patch: {
          action: PatchType.Move,
          from: patch.from,
          to: patch.to,
        },
      };
    }
    case ListPatchType.Remove: {
      return {
        paths,
        type: DataType.Children,
        patch: {
          action: PatchType.Delete,
          pos: patch.index,
          node: patch.item,
        },
      };
    }

    // TODO(miyauci): support it
    case ListPatchType.Substitute: {
      return {
        paths: paths.concat(patch.index),
        type: DataType.Node,
        patch: {
          action: PatchType.Substitute,
          from: patch.from.item,
          to: patch.to.item,
        },
      };
    }
  }
}

export function syncNode(node: Node, patch: NodePatch): void {
  replaceWith(patch.to, node);
}

export function syncChildren(parent: Node, patch: ChildrenPatch): void {
  switch (patch.action) {
    case "add": {
      const toPos = parent.childNodes[patch.pos];

      parent.insertBefore(patch.node, toPos ?? null);
      break;
    }
    case "delete": {
      const target = parent.childNodes[patch.pos];

      if (!target) throw new Error("target node does not exist");

      target.remove();
      break;
    }
    case "move": {
      const sourceNode = parent.childNodes[patch.from];

      if (!sourceNode) throw new Error("source node does not exist");

      const targetNode = parent.childNodes[patch.to];
      const isLeft2Right = patch.from < patch.to;

      if (isLeft2Right) {
        if (!targetNode) throw new Error("target node does not exist");

        parent.insertBefore(sourceNode, targetNode.nextSibling);

        return;
      }

      parent.insertBefore(sourceNode, targetNode ?? null);
    }
  }
}
