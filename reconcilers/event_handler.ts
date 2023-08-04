// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import type { Named } from "./types.ts";
import { imap } from "../deps.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  type Reconciler,
  type SubstitutePatch,
} from "../types.ts";

export type EventHandlerPatch =
  | AdditionPatch<EventHandlerData>
  | DeletionPatch<EventHandlerData>
  | EventHandlerSubstitutePatch;

interface EventHandlerData extends Named {
  handler: unknown;
}

interface EventHandlerSubstitutePatch extends Named, SubstitutePatch<unknown> {}

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

export class EventHandlerReconciler implements Reconciler<EventHandlerPatch> {
  #eventNames: Set<EventHandlerName>;
  constructor(events: Iterable<string>) {
    this.#eventNames = new Set<EventHandlerName>(imap(events, on));
  }

  diff(oldNode: Node, newNode: Node): IterableIterator<EventHandlerPatch> {
    return diffEventHandler(oldNode, newNode, this.#eventNames);
  }

  sync = syncEventHandler;
}

type EventHandlerName = `on${string}`;

function on(name: string): EventHandlerName {
  return `on${name}`;
}
