// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.
// deno-lint-ignore-file no-explicit-any

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { enumerate, imap, mapValues, papplyRest, zip } from "./deps.ts";
import {
  diff as diffList,
  type Patch as ListPatch,
  PatchType as ListPatchType,
} from "./utils/list_diff/diff.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  type Diff,
  type DiffResult,
  type MovementPatch,
  PatchType,
  type Position,
  type Reconciler,
  type SubstitutePatch,
  Sync,
} from "./types.ts";
import { replaceWith } from "./utils/node.ts";
import { type Yield } from "./utils/iter.ts";
import { applyPatch } from "./patch.ts";

export class Differ {
  #diffMap: Record<string, Diff<unknown>>;
  #syncMap: Record<string, Sync<any>>;
  constructor(...reconcilers: Reconciler<any>[]) {
    const reconcilerMap = Object.fromEntries(Object.entries(reconcilers));
    const differs = mapValues(
      reconcilerMap,
      (reconciler) => reconciler.diff.bind(reconciler),
    );
    this.#diffMap = differs;
    const syncs = mapValues(
      reconcilerMap,
      (reconciler) => reconciler.sync.bind(reconciler),
    );
    this.#syncMap = { ...syncs, node: syncNode };
  }

  apply(
    oldNode: Node,
    newNode: Node,
    options?: { keying(node: Node): unknown },
  ): void {
    const results = diff(oldNode, newNode, this.#diffMap, options);

    applyPatch(oldNode, results, this.#syncMap);
  }
}

type ToEntry<T extends Record<PropertyKey, Diff<unknown>>> = {
  [k in keyof T]: { type: k; patch: Yield<ReturnType<T[k]>> };
}[keyof T];

export interface DiffOptions {
  /**
   * @default []
   */
  paths?: readonly number[];
  keying?(node: Node): unknown;
}

const enum DataType {
  Node = "node",
  Children = "children",
}

export type NodePatch =
  | SubstitutePatch<Node>
  | MovementPatch
  | DeletionPatch<{ node: Node }>
  | AdditionPatch<ChildData>;

interface ChildData {
  node: Node;
  pos: number;
}

export function* diff<T extends Record<PropertyKey, Diff<unknown>> = never>(
  oldNode: Node,
  newNode: Node,
  differs: T = {} as T,
  options?: DiffOptions,
): Iterable<
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

    yield* imap(
      differ(oldNode, newNode),
      (patch) =>
        ({ paths, type: key, patch }) as (
          & Position
          & (ToEntry<T>)
        ),
    );
  }

  const keying = options?.keying ?? toKey;

  yield* diffChildren(oldNode.childNodes, newNode.childNodes, differs, {
    paths,
    keying,
  });
}

export function* diffChildren<
  T extends Record<PropertyKey, Diff<unknown>> = never,
>(
  oldNode: Iterable<Node>,
  newNode: Iterable<Node>,
  differs: T = {} as T,
  options: DiffOptions = {},
): Iterable<
  | DiffResult<DataType.Node, NodePatch>
  | (
    & Position
    & (ToEntry<T>)
  )
> {
  const oldNodes = Array.from(oldNode);
  const newNodes = Array.from(newNode);
  const keying = options.keying ?? toKey;
  const patches = diffList(oldNodes, newNodes, { keying });
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
): DiffResult<DataType.Node, NodePatch> {
  switch (patch.type) {
    case ListPatchType.Insert: {
      return {
        paths,
        type: DataType.Node,
        patch: {
          action: PatchType.Add,
          pos: patch.index,
          node: patch.item,
        },
      };
    }
    case ListPatchType.Move: {
      return {
        paths: paths.concat(patch.from),
        type: DataType.Node,
        patch: {
          action: PatchType.Move,
          from: patch.from,
          to: patch.to,
        },
      };
    }
    case ListPatchType.Remove: {
      return {
        paths: paths.concat(patch.index),
        type: DataType.Node,
        patch: { action: PatchType.Delete, node: patch.item },
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
  switch (patch.action) {
    case PatchType.Substitute: {
      replaceWith(patch.to, node);

      break;
    }

    case PatchType.Move: {
      const isLeft2Right = patch.from < patch.to;
      const parent = node.parentNode!;
      const targetNode = node.parentNode!.childNodes[patch.to];

      if (isLeft2Right) {
        if (!targetNode) throw new Error("target node does not exist");

        parent.insertBefore(node, targetNode.nextSibling);

        return;
      }

      parent.insertBefore(node, targetNode ?? null);
      break;
    }

    case PatchType.Delete: {
      const parent = node.parentNode;

      if (!parent) throw new Error("target parent does not exist");

      parent.removeChild(node);
      break;
    }
    case PatchType.Add: {
      const toPos = node.childNodes[patch.pos];

      node.insertBefore(patch.node, toPos ?? null);
      break;
    }
  }
}
