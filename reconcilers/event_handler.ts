// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { Named } from "./types.ts";
import { distinct } from "../deps.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  PatchType,
  type Reconciler,
  type SubstitutePatch,
} from "../types.ts";

export type EventHandlerName = `on${string}`;
interface EventHandlerSubstitutePatch extends Named, SubstitutePatch<unknown> {}

/** Patch for event handler. */
export type EventHandlerPatch =
  | AdditionPatch<EventHandlerData>
  | DeletionPatch<EventHandlerData>
  | EventHandlerSubstitutePatch;

interface EventHandlerData {
  name: EventHandlerName;
  listener: unknown;
}

/** Get all event handler properties. */
export function getEventHandlers(obj: object): Map<EventHandlerName, unknown> {
  const eventHandlers: Map<EventHandlerName, unknown> = new Map();

  for (const key in obj) {
    if (isEventHandlerName(key)) {
      eventHandlers.set(key, Reflect.get(obj, key));
    }
  }

  return eventHandlers;
}

/** Whether the {@linkcode name} is {@linkcode EventHandlerName} or not.
 * @see https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes
 */
export function isEventHandlerName(name: string): name is EventHandlerName {
  return /^on.+/.test(name);
}

export function* diffEventHandler(
  oldNode: object,
  newNode: object,
): Generator<EventHandlerPatch> {
  const oldEventHandlers = getEventHandlers(oldNode);
  const newEventHandlers = getEventHandlers(newNode);
  const allEventHandlerNames = distinct(
    [...oldEventHandlers.keys()].concat(...newEventHandlers.keys()),
  );

  for (const name of allEventHandlerNames) {
    if (!oldEventHandlers.has(name)) {
      const listener = Reflect.get(newNode, name);

      yield { action: PatchType.Add, name, listener };
      continue;
    }

    if (!newEventHandlers.has(name)) {
      const listener = oldEventHandlers.get(name);

      yield { action: PatchType.Delete, name, listener };
      continue;
    }

    const oldListener = oldEventHandlers.get(name);
    const newListener = newEventHandlers.get(name);

    if (oldListener !== newListener) {
      yield {
        action: PatchType.Substitute,
        name,
        from: oldListener,
        to: newListener,
      };
    }
  }
}

export function syncEventHandler(node: object, patch: EventHandlerPatch): void {
  switch (patch.action) {
    case PatchType.Add: {
      Reflect.set(node, patch.name, patch.listener);
      break;
    }

    case PatchType.Delete: {
      Reflect.set(node, patch.name, null);
      break;
    }

    case PatchType.Substitute: {
      Reflect.set(node, patch.name, patch.to);
      break;
    }
  }
}

/** Event handler reconciler.
 * @example
 * ```ts
 * import { EventHandlerReconciler } from "https://deno.land/x/dom_diff/reconcilers/event_handler.ts";
 * import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
 * declare const listener: () => {};
 * const reconciler = new EventHandlerReconciler();
 * const oldNode = document.createElement("button");
 * const newNode = document.createElement("button");
 *
 * newNode.onclick = listener;
 *
 * const patches = reconciler.diff(oldNode, newNode);
 * for (const patch of patches) reconciler.update(oldNode, patch);
 *
 * assertEquals(oldNode.onclick, listener);
 * ```
 */
export class EventHandlerReconciler implements Reconciler<EventHandlerPatch> {
  diff = diffEventHandler;

  update = syncEventHandler;
}
