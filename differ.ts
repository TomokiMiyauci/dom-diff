// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { distinct } from "./deps.ts";
import { not } from "./utils.ts";
import { Patch, PatchType, Path, SubstitutePatch } from "./types.ts";

export function* markupDiffer(
  oldNode: Node,
  newNode: Node,
  paths: readonly Path[],
): Iterable<Patch> {
  if (oldNode instanceof Element && newNode instanceof Element) {
    yield* diffElement(oldNode, newNode, paths);
  }

  if (oldNode instanceof CharacterData && newNode instanceof CharacterData) {
    yield* diffCharacterData(oldNode, newNode, paths);
  }
}

export function* diffElement(
  oldNode: Element,
  newNode: Element,
  paths: readonly Path[],
): Iterable<Patch> {
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
