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
import { format } from "./deps.ts";

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

  if (!node) throw new Error(Msg.notExist(Name.TargetNode));

  if (patch.isAttr()) {
    if (node instanceof Attr) {
      if (!node.ownerElement) throw new Error(Msg.notExist(Name.OwnerElement));

      node.ownerElement.setAttributeNS(
        patch.new.namespaceURI,
        patch.new.name,
        patch.new.value,
      );
      return;
    }
  }

  const result = replaceWith(patch.new, node);

  if (!result) throw new Error(Msg.fail("replace node"));
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

export function applyDeletionPatch(root: Node, patch: DeletionPatch): void {
  const node = resolvePaths(root, patch.paths);

  if (!node) throw new Error(Msg.notExist(Name.TargetNode));

  if (node instanceof Attr) {
    const result = removeAttributeNode(node);

    if (!result) throw new Error(Msg.fail("remove attribute node"));
    return;
  }

  remove(node);
}

export function applyInsertionPatch(root: Node, patch: InsertionPatch): void {
  const node = resolvePaths(root, patch.paths);

  if (!node) throw new Error(Msg.notExist(Name.TargetNode));

  const toPos = resolvePaths(root, patch.to);

  node.insertBefore(patch.node, toPos ?? null);
}

export function applyMovementPatch(root: Node, patch: MovementPatch): void {
  const parent = resolvePaths(root, patch.paths);

  if (!parent) throw new Error(Msg.notExist(Name.ParentNode));

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

const enum Template {
  NotExist = "{name} does not exist",
  Fail = "fail to {what}",
}

const enum Name {
  TargetNode = "target node",
  OwnerElement = "owner element",
  ParentNode = "parent node",
}

class Msg {
  static notExist(name: string): string {
    return format(Template.NotExist, { name });
  }
  static fail(what: string): string {
    return format(Template.Fail, { what });
  }
}
