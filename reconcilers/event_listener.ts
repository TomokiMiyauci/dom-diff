// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { distinct } from "../deps.ts";
import {
  type AdditionPatch,
  type DeletionPatch,
  PatchType,
  type Reconciler,
} from "../types.ts";
import {
  type EventListeners,
  type GetEventListeners,
  type Listener,
} from "../utils/get_event_listeners/mod.ts";
import {
  compositeSymbol,
} from "https://deno.land/x/composite_key@1.0.0/mod.ts";

export {
  setup as setupEventListeners,
} from "../utils/get_event_listeners/mod.ts";
export type { EventListeners, GetEventListeners };

/** Event listener patch. */
export type EventListenerPatch =
  | AdditionPatch<Listener>
  | DeletionPatch<Listener>;

export function* diffEventLister(
  oldNode: object,
  newNode: object,
  getEventListeners: GetEventListeners,
): Generator<EventListenerPatch> {
  yield* generatePatches(
    getEventListeners(oldNode),
    getEventListeners(newNode),
  );
}

function listener2Entry(listener: Listener): [key: symbol, listener: Listener] {
  return [
    compositeSymbol(listener.type, listener.listener, listener.useCapture),
    listener,
  ];
}

function listeners2Entries(
  listeners: readonly Listener[],
): [key: symbol, listener: Listener][] {
  return listeners.map(listener2Entry);
}

export function* generatePatches(
  oldListeners: EventListeners,
  newListeners: EventListeners,
): Generator<EventListenerPatch> {
  const oldEntries = Object.values(oldListeners).flatMap(listeners2Entries);
  const newEntries = Object.values(newListeners).flatMap(listeners2Entries);
  const oldMaps = new Map<symbol, Listener>(oldEntries);
  const newMaps = new Map<symbol, Listener>(newEntries);
  const allKeys = distinct([...oldMaps.keys(), ...newMaps.keys()]);

  for (const key of allKeys) {
    if (!oldMaps.has(key)) {
      const listener = newMaps.get(key)!;

      yield { ...listener, action: PatchType.Add };
      continue;
    }

    if (!newMaps.has(key)) {
      const listener = oldMaps.get(key)!;

      yield { ...listener, action: PatchType.Delete };
      continue;
    }
  }
}

export function syncEventListener(
  target: EventTarget,
  patch: EventListenerPatch,
) {
  const { type, listener, action, ...options } = patch;

  switch (action) {
    case PatchType.Add: {
      const { useCapture: capture, once, passive } = options;
      target.addEventListener(type, listener, { capture, once, passive });
      break;
    }

    case PatchType.Delete: {
      target.removeEventListener(type, listener, {
        capture: options.useCapture,
      });
      break;
    }
  }
}

/** Event listener reconciler.
 *
 * @example
 * ```ts
 * import { EventListenerReconciler, setupEventListeners } from "https://deno.land/x/dom_diff/reconcilers/event_listener.ts";
 * import { assertSpyCalls, spy } from "https://deno.land/std/testing/mock.ts";
 *
 * const getEventListeners = setupEventListeners();
 * const reconciler = new EventListenerReconciler(getEventListeners);
 * const oldNode = document.createElement("button");
 * const newNode = document.createElement("button");
 * const listener = spy(() => {});
 * newNode.addEventListener("click", listener);
 *
 * const patches = reconciler.diff(oldNode, newNode);
 * for (const patch of patches) reconciler.update(oldNode, patch);
 *
 * oldNode.dispatchEvent(new MouseEvent("click"));
 * assertSpyCalls(listener, 1);
 * ```
 */
export class EventListenerReconciler implements Reconciler<EventListenerPatch> {
  /**
   * @example
   * ```ts
   * import { setup } from "https://deno.land/x/dom_diff/utils/get_event_listeners/mod.ts";
   * import { EventListenerReconciler } from "https://deno.land/x/dom_diff/reconcilers/event_listener.ts";
   *
   * const getEventListeners = setup();
   * const reconciler = new EventListenerReconciler(getEventListeners);
   * ```
   */
  constructor(public getEventListeners: GetEventListeners) {}

  diff(oldNode: object, newNode: object): Generator<EventListenerPatch> {
    return diffEventLister(oldNode, newNode, this.getEventListeners);
  }
  update = syncEventListener;
}
