// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { distinct } from "./deps.ts";
import { not } from "./utils.ts";
import {
  AdditionPatch,
  DeletionPatch,
  EventHandlerName,
  PatchType,
  SubstitutePatch,
} from "./types.ts";
import { AttributeTarget, EventHandlerTarget, TargetType } from "./target.ts";

export function* markupDiffer(
  oldNode: Node,
  newNode: Node,
): IterableIterator<
  | AdditionPatch<TargetType.Attribute, AttributeTarget>
  | DeletionPatch<TargetType.Attribute, AttributeTarget>
  | SubstitutePatch<TargetType.Attribute, AttributeTarget>
  | SubstitutePatch<TargetType.CharacterData, string>
> {
  if (oldNode instanceof Element && newNode instanceof Element) {
    return yield* diffElement(oldNode, newNode);
  }

  if (oldNode instanceof CharacterData && newNode instanceof CharacterData) {
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
    | AdditionPatch<TargetType.EventHandler, EventHandlerTarget>
    | DeletionPatch<TargetType.EventHandler, EventHandlerTarget>
    | SubstitutePatch<TargetType.EventHandler, EventHandlerTarget>
  > {
    const filteredNames = [...this.#eventNames.values()].filter((name) =>
      Reflect.has(oldNode, name) || Reflect.has(newNode, name)
    );

    for (const name of filteredNames) {
      if (!Reflect.has(oldNode, name)) {
        const newEventHandler = Reflect.get(newNode, name);

        yield {
          type: PatchType.Add,
          valueType: TargetType.EventHandler,
          value: { name, handler: newEventHandler },
        };

        return;
      }

      if (!Reflect.has(newNode, name)) {
        const oldEventHandler = Reflect.get(oldNode, name);

        yield {
          type: PatchType.Delete,
          valueType: TargetType.EventHandler,
          value: { name, handler: oldEventHandler },
        };
        return;
      }

      const oldEventHandler = Reflect.get(oldNode, name);
      const newEventHandler = Reflect.get(newNode, name);

      if (oldEventHandler !== newEventHandler) {
        yield {
          type: PatchType.Substitute,
          valueType: TargetType.EventHandler,
          value: {
            from: { name, handler: oldEventHandler },
            to: { name, handler: newEventHandler },
          },
        };
      }
    }
  }
}

export function* diffElement(
  oldNode: Element,
  newNode: Element,
): IterableIterator<
  | AdditionPatch<TargetType.Attribute, AttributeTarget>
  | DeletionPatch<TargetType.Attribute, AttributeTarget>
  | SubstitutePatch<TargetType.Attribute, AttributeTarget>
> {
  yield* diffAttribute(oldNode, newNode);
}

export function* diffCharacterData(
  oldNode: CharacterData,
  newNode: CharacterData,
): IterableIterator<SubstitutePatch<TargetType.CharacterData, string>> {
  if (equalsCharacterData(oldNode, newNode)) return;

  yield {
    type: PatchType.Substitute,
    valueType: TargetType.CharacterData,
    value: { from: oldNode.data, to: newNode.data },
  };
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
) {
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
  ):
    | AdditionPatch<TargetType.Attribute, AttributeTarget>
    | DeletionPatch<TargetType.Attribute, AttributeTarget>
    | SubstitutePatch<TargetType.Attribute, AttributeTarget> {
    if (!oldNode.hasAttribute(qualifiedName)) {
      const value = newNode.getAttribute(qualifiedName)!;

      return {
        type: PatchType.Add,
        valueType: TargetType.Attribute,
        value: { name: qualifiedName, value },
      };
    }

    if (!newNode.hasAttribute(qualifiedName)) {
      const value = newNode.getAttribute(qualifiedName)!;

      return {
        type: PatchType.Delete,
        valueType: TargetType.Attribute,
        value: { name: qualifiedName, value },
      };
    }

    const leftAttr = oldNode.getAttribute(qualifiedName)!;
    const rightAttr = newNode.getAttribute(qualifiedName)!;

    return {
      type: PatchType.Substitute,
      valueType: TargetType.Attribute,
      value: {
        from: { name: qualifiedName, value: leftAttr },
        to: { name: qualifiedName, value: rightAttr },
      },
    };
  }

  yield* allAttributeNames
    .filter(not(equalsAttribute))
    .map(diffAttr);
}
