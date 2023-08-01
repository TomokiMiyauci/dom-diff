// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { distinct } from "./deps.ts";
import { not } from "./utils.ts";
import {
  CharacterDataLike,
  EditPatch,
  ElementLike,
  EventHandlerName,
  PatchType,
  SubstitutePatch,
} from "./types.ts";
import { AttributeTarget, EventHandlerTarget, TargetType } from "./target.ts";

export function* diffMarkup(
  oldNode: Node | ElementLike | CharacterDataLike,
  newNode: Node | ElementLike | CharacterDataLike,
): Generator<
  | EditPatch<TargetType.Attribute, AttributeTarget>
  | SubstitutePatch<TargetType.CharacterData, string>,
  void,
  undefined
> {
  if ("attributes" in oldNode && "attributes" in newNode) {
    return yield* diffElement(oldNode, newNode);
  }

  if ("data" in oldNode && "data" in newNode) {
    return yield* diffCharacterData(oldNode, newNode);
  }
}

export class EventHandlerDiffer {
  #eventNames: Set<EventHandlerName>;
  constructor(eventNames: readonly string[]) {
    this.#eventNames = new Set<EventHandlerName>(
      eventNames.map((v) => `on${v}` as const),
    );
  }

  *diff(
    oldNode: Node,
    newNode: Node,
  ): IterableIterator<
    EditPatch<TargetType.EventHandler, EventHandlerTarget>
  > {
    const filteredNames = [...this.#eventNames.values()].filter((name) =>
      Reflect.has(oldNode, name) || Reflect.has(newNode, name)
    );

    for (const name of filteredNames) {
      if (!Reflect.has(oldNode, name)) {
        const newEventHandler = Reflect.get(newNode, name);

        yield {
          type: PatchType.Add,
          value: {
            type: TargetType.EventHandler,
            value: { name, handler: newEventHandler },
          },
        };

        return;
      }

      if (!Reflect.has(newNode, name)) {
        const oldEventHandler = Reflect.get(oldNode, name);

        yield {
          type: PatchType.Delete,
          value: {
            type: TargetType.EventHandler,
            value: { name, handler: oldEventHandler },
          },
        };
        return;
      }

      const oldEventHandler = Reflect.get(oldNode, name);
      const newEventHandler = Reflect.get(newNode, name);

      if (oldEventHandler !== newEventHandler) {
        yield {
          type: PatchType.Substitute,
          value: {
            type: TargetType.EventHandler,
            from: { name, handler: oldEventHandler },
            to: { name, handler: newEventHandler },
          },
        };
      }
    }
  }
}

export function* diffElement(
  oldNode: ElementLike,
  newNode: ElementLike,
): Generator<
  EditPatch<TargetType.Attribute, AttributeTarget>,
  void,
  undefined
> {
  yield* diffAttribute(oldNode, newNode);
}

export function* diffCharacterData(
  oldNode: CharacterDataLike,
  newNode: CharacterDataLike,
): Generator<SubstitutePatch<TargetType.CharacterData, string>> {
  if (equalsCharacterData(oldNode, newNode)) return;

  yield {
    type: PatchType.Substitute,
    value: {
      type: TargetType.CharacterData,
      from: oldNode.data,
      to: newNode.data,
    },
  };
}

export function equalsCharacterData(
  left: CharacterDataLike,
  right: CharacterDataLike,
): boolean {
  return left.data === right.data;
}

export function* diffAttribute(
  oldNode: ElementLike,
  newNode: ElementLike,
): Generator<
  EditPatch<TargetType.Attribute, AttributeTarget>,
  void,
  undefined
> {
  const allAttributeNames = distinct(
    oldNode.getAttributeNames().concat(newNode.getAttributeNames()),
  );

  function equalsAttribute(name: string): boolean {
    return oldNode.hasAttribute(name) && newNode.hasAttribute(name) &&
      oldNode.getAttributeNode(name)!.isEqualNode(
        newNode.getAttributeNode(name),
      );
  }

  function diffAttr(
    qualifiedName: string,
  ): EditPatch<TargetType.Attribute, AttributeTarget> {
    if (!oldNode.hasAttribute(qualifiedName)) {
      const attrStr = newNode.getAttribute(qualifiedName)!;

      return {
        type: PatchType.Add,
        value: {
          type: TargetType.Attribute,
          value: { name: qualifiedName, value: attrStr },
        },
      };
    }

    if (!newNode.hasAttribute(qualifiedName)) {
      const value = newNode.getAttribute(qualifiedName)!;

      return {
        type: PatchType.Delete,

        value: {
          type: TargetType.Attribute,
          value: { name: qualifiedName, value },
        },
      };
    }

    const leftAttr = oldNode.getAttribute(qualifiedName)!;
    const rightAttr = newNode.getAttribute(qualifiedName)!;

    return {
      type: PatchType.Substitute,
      value: {
        type: TargetType.Attribute,
        from: { name: qualifiedName, value: leftAttr },
        to: { name: qualifiedName, value: rightAttr },
      },
    };
  }

  yield* allAttributeNames
    .filter(not(equalsAttribute))
    .map(diffAttr);
}
