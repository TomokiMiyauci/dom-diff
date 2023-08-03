// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { imap } from "../deps.ts";

export type EventHandlerPatch =
  | EventHandlerAdditionOrDeletionPatch
  | EventHandlerSubstitutePatch;

interface EventHandlerAdditionOrDeletionPatch {
  action: "add" | "delete";
  name: string;
  handler: unknown;
}

interface EventHandlerSubstitutePatch {
  action: "substitute";
  name: string;
  from: unknown;
  to: unknown;
}

export function* diffEventHandler(
  oldNode: Node,
  newNode: Node,
  events: Set<EventHandlerName>,
): IterableIterator<EventHandlerPatch> {
  const filteredNames = [...events.values()].filter((name) =>
    Reflect.has(oldNode, name) || Reflect.has(newNode, name)
  );

  for (const name of filteredNames) {
    if (!Reflect.has(oldNode, name)) {
      const newEventHandler = Reflect.get(newNode, name);

      yield { action: "add", name, handler: newEventHandler };
      continue;
    }

    if (!Reflect.has(newNode, name)) {
      const oldEventHandler = Reflect.get(oldNode, name);

      yield { action: "delete", name, handler: oldEventHandler };
      continue;
    }

    const oldEventHandler = Reflect.get(oldNode, name);
    const newEventHandler = Reflect.get(newNode, name);

    if (oldEventHandler !== newEventHandler) {
      yield {
        action: "substitute",
        name,
        from: oldEventHandler,
        to: newEventHandler,
      };
    }
  }
}

export function syncEventHandler(node: Node, patch: EventHandlerPatch): void {
  switch (patch.action) {
    case "add": {
      Reflect.set(node, patch.name, patch.handler);
      break;
    }
    case "delete": {
      Reflect.set(node, patch.name, null);

      break;
    }
    case "substitute": {
      Reflect.set(node, patch.name, patch.to);

      break;
    }
  }
}

export class EventHandlerReconciler {
  #eventNames: Set<EventHandlerName>;
  constructor(events: Iterable<string>) {
    this.#eventNames = new Set<EventHandlerName>(imap(events, on));
  }

  diff = (oldNode: Node, newNode: Node) => {
    return diffEventHandler(oldNode, newNode, this.#eventNames);
  };

  sync = syncEventHandler;
}

type EventHandlerName = `on${string}`;

function on(name: string): EventHandlerName {
  return `on${name}`;
}
