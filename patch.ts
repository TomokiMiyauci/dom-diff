// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import {
  AdditionPatch,
  DeletionPatch,
  InsertionPatch,
  MovementPatch,
  Patch,
  PatchType,
  Path,
  SubstitutePatch,
} from "./diff.ts";
import { remove, removeAttributeNode, replaceWith } from "./utils.ts";

export function applyPatch(root: Node, patches: Iterable<Patch>): void {
  for (const patch of patches) {
    switch (patch.type) {
      case PatchType.Substitute:
        applySubstitutePatch(root, patch);
        break;

      case PatchType.Add:
        applyAdditionPatch(root, patch);
        break;

      case PatchType.Delete:
        applyDeletionPatch(root, patch);
        break;

      case PatchType.Insert:
        applyInsertionPatch(root, patch);
        break;

      case PatchType.Move:
        applyMovementPatch(root, patch);
        break;
    }
  }
}

function applySubstitutePatch(root: Node, patch: SubstitutePatch): void {
  const node = resolvePaths(root, patch.paths);

  if (!node) throw new Error("target node does not exist");

  if (patch.isAttr()) {
    if (node instanceof Attr) {
      if (!node.ownerElement) {
        throw new Error("owner element does not exist");
      }

      node.ownerElement.setAttributeNS(
        patch.new.namespaceURI,
        patch.new.name,
        patch.new.value,
      );
      return;
    }
  }

  const result = replaceWith(patch.new, node);

  if (!result) throw new Error("fail to replace node");
}

export function applyAdditionPatch(root: Node, patch: AdditionPatch): void {
  const node = resolvePaths(root, patch.paths);

  if (node instanceof Element) {
    node.setAttributeNS(
      patch.node.namespaceURI,
      patch.node.name,
      patch.node.value,
    );
    return;
  }

  throw new Error("target is not element");
}

export function applyDeletionPatch(root: Node, patch: DeletionPatch) {
  const node = resolvePaths(root, patch.paths);

  if (!node) throw new Error("target does not exist");

  if (node instanceof Attr) {
    const result = removeAttributeNode(node);

    if (!result) throw new Error(`fail to remove ${node}`);
    return;
  }

  remove(node);
}

export function applyInsertionPatch(root: Node, patch: InsertionPatch) {
  const node = resolvePaths(root, patch.paths);

  if (!node) throw new Error("target does not exist");

  const toPos = resolvePaths(root, patch.to);

  node.insertBefore(patch.node, toPos ?? null);
}

export function applyMovementPatch(root: Node, patch: MovementPatch) {
  const parent = resolvePaths(root, patch.paths);

  if (!parent) throw new Error("parent node does not exists");

  const sourceNode = parent.childNodes[patch.from];
  const targetNode = parent.childNodes[patch.to];
  const isLeft2Right = patch.from < patch.to;

  if (isLeft2Right) {
    parent.insertBefore(sourceNode, targetNode.nextSibling);
    return;
  }

  parent.insertBefore(sourceNode, targetNode);
}

export function resolvePaths(
  node: Node,
  paths: readonly Path[],
): Node | Attr | undefined {
  if (!paths.length) return node;

  const [first, ...rest] = paths;

  if (typeof first === "string") {
    if (node instanceof Element) {
      return (node.attributes as FixedNamedNodeMap)[first];
    }

    return;
  }
  const child = node.childNodes[first];

  if (!child) return;

  return resolvePaths(child, rest);
}

type FixedNamedNodeMap =
  & { [key in string]?: Attr }
  & NamedNodeMap;
