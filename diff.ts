/// <reference lib="dom" />

import { distinct, zip } from "./deps.ts";
import {
  diff as diffList,
  Patch as ListPatch,
  PatchType as ListPatchType,
} from "../list-diff/diff.ts";
import { not } from "./utils.ts";

export type Path = string | number;

export interface DeletionPatch extends Position {
  type: PatchType.Delete;
}

interface Position {
  paths: Path[];
}

interface BasePatch extends Position {
  type: PatchType;
}

class BasePatch implements Position {
  paths: Path[];

  constructor(paths: Path[]) {
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

  constructor(paths: Path[], from: T, to: T, isAttr: boolean = false) {
    super(paths);
    this.old = from;
    this.new = to;
    this.#isAttr = isAttr;
  }
}

export class InsertionPatch extends BasePatch {
  type: PatchType.Insert = PatchType.Insert;
  to: Path[];
  node: Node;
  constructor(paths: Path[], to: Path[], node: Node) {
    super(paths);
    this.to = to;
    this.node = node;
  }
}

export interface AddPatch extends BasePatch {
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
  paths: Path[];
  from: number;
  to: number;
}

export type Patch<T = Node> =
  | SubstitutePatch<T>
  | AddPatch
  | DeletionPatch
  | MovementPatch
  | InsertionPatch;

interface Differ {
  (oldNode: Node, newNode: Node, paths: Path[], differ: Differ): Patch[];
}

export function diff(
  oldNode: Node,
  newNode: Node,
  paths: Path[] = [],
  differ: Differ = defaultDiffer,
): Patch[] {
  if (oldNode.isEqualNode(newNode)) return [];

  if (oldNode.nodeType !== newNode.nodeType) {
    return [new SubstitutePatch(paths, oldNode, newNode)];
  }

  const differences = differ(oldNode, newNode, paths, differ);

  if (!differences) return [];

  if (Array.isArray(differences)) return differences;

  return [differences];
}

function defaultDiffer(
  oldNode: Node,
  newNode: Node,
  paths: Path[],
  differ: Differ,
): Patch[] {
  if (oldNode instanceof Element && newNode instanceof Element) {
    const parentDiff = diffElement(oldNode, newNode, paths);
    if (oldNode.hasChildNodes() || newNode.hasChildNodes()) {
      const subDifferences = diffChildren(
        oldNode.childNodes,
        newNode.childNodes,
        paths,
        differ,
      );
      return parentDiff.concat(subDifferences);
    }

    return parentDiff;
  }

  if (oldNode instanceof CharacterData && newNode instanceof CharacterData) {
    return diffCharacterData(oldNode, newNode, paths);
  }

  return [];
}

export function diffElement(
  oldNode: Element,
  newNode: Element,
  paths: Path[],
): Patch[] {
  if (oldNode.tagName !== newNode.tagName) {
    return [new SubstitutePatch(paths, oldNode, newNode)];
  }

  const attributeDifferences = diffAttribute(oldNode, newNode, paths);

  return attributeDifferences;
}

export function diffCharacterData(
  oldNode: CharacterData,
  newNode: CharacterData,
  paths: Path[],
): Patch[] {
  if (oldNode.data === newNode.data) return [];

  return [new SubstitutePatch(paths, oldNode, newNode)];
}

export function diffAttribute(
  oldNode: Element,
  newNode: Element,
  paths: Path[],
): Patch[] {
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

  return allAttributeNames
    .filter(not(equalsAttribute))
    .map(diffAttr);
}

export function diffChildren(
  oldNode: NodeListOf<ChildNode>,
  newNode: NodeListOf<ChildNode>,
  paths: Path[],
  differ: Differ,
): Patch[] {
  const oldNodes = Array.from(oldNode);
  const newNodes = Array.from(newNode);
  const patches = diffList(oldNodes, newNodes, toKey);
  const sequentialDifferences = patches.map((patch) => toPatch(patch, paths));
  const reorderedNodes = patches.reduce((acc, patch) => {
    switch (patch.type) {
      case ListPatchType.Insert: {
        acc.splice(patch.index, 0, patch.item);
        return acc;
      }
      case ListPatchType.Move: {
        const items = acc.splice(patch.from, 1);
        acc.splice(patch.to, 0, ...items);

        return acc;
      }
      case ListPatchType.Remove: {
        acc.splice(patch.index, 1);

        return acc;
      }
    }
  }, oldNodes.slice());
  const childrenDifferences = zip(reorderedNodes, newNodes).flatMap((
    [oldNode, newNode],
    index,
  ) => differ(oldNode, newNode, paths.concat(index), differ));

  return (sequentialDifferences as Patch[]).concat(childrenDifferences);
}

function toKey(node: ChildNode): string {
  return node.nodeName;
}

function toPatch<T extends Node>(
  patch: ListPatch<T>,
  paths: Path[],
): InsertionPatch | MovementPatch | DeletionPatch {
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
  }
}
