// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import { EventListenerMap } from "./map.ts";
import { normalizeOptions } from "./utils.ts";
import { eventTargetRegistry } from "./constants.ts";
import type { EventListeners, Listener } from "./types.ts";

/** Setup options. */
export interface SetupOptions {
  /**
   * @default EventTarget.prototype.addEventListener
   */
  addEventListener?: EventTarget["addEventListener"];

  /**
   * @default EventTarget.prototype.removeEventListener
   */
  removeEventListener?: EventTarget["removeEventListener"];
}

export interface GetEventListeners {
  (target: EventTarget): EventListeners;
}

/** Setup event listener monitoring.
 * Performs a side effect and changes the prototype of `EventTarget`.
 */
export function setup(options?: SetupOptions): GetEventListeners {
  const addEventListener = options?.addEventListener ??
    EventTarget.prototype.addEventListener;
  const removeEventListener = options?.removeEventListener ??
    EventTarget.prototype.removeEventListener;

  const $addEventListener = new Proxy(addEventListener, {
    apply: (target, thisArg, argArray) =>
      handleAddEventListener(
        target,
        thisArg,
        argArray as Parameters<typeof EventTarget.prototype.addEventListener>,
        eventTargetRegistry,
      ),
  });

  const $removeEventListener = new Proxy(removeEventListener, {
    apply: (target, thisArg, argArray) =>
      handlerRemoveEventListener(
        target,
        thisArg,
        argArray as Parameters<
          typeof EventTarget.prototype.removeEventListener
        >,
        eventTargetRegistry,
      ),
  });

  EventTarget.prototype.addEventListener = $addEventListener;
  EventTarget.prototype.removeEventListener = $removeEventListener;

  return getEventListeners;
}

export function handleAddEventListener<T extends object, R>(
  target: (
    this: T,
    ...args: Parameters<typeof EventTarget.prototype.addEventListener>
  ) => R,
  thisArg: T,
  argArray: Parameters<typeof EventTarget.prototype.addEventListener>,
  registry: WeakMap<T, EventListenerMap>,
): R {
  const [type, listener, options] = argArray;
  const $listener: Listener = { type, listener, ...normalizeOptions(options) };

  if (registry.has(thisArg)) {
    const map = registry.get(thisArg)!;

    map.set($listener);
  } else {
    const map = new EventListenerMap([$listener]);

    registry.set(thisArg, map);
  }

  return target.apply(thisArg, argArray);
}

export function handlerRemoveEventListener<T extends object, R>(
  target: (
    this: T,
    ...args: Parameters<typeof EventTarget.prototype.removeEventListener>
  ) => R,
  thisArg: T,
  argArray: Parameters<typeof EventTarget.prototype.removeEventListener>,
  registry: WeakMap<T, EventListenerMap>,
): R {
  if (registry.has(thisArg)) {
    const eventRegistry = registry.get(thisArg)!;
    const [type, listener, options] = argArray;

    eventRegistry.delete({ type, listener, ...normalizeOptions(options) });
  }

  return target.apply(thisArg, argArray);
}

/** Get {@linkcode EventListeners}.
 * Before this can be done, {@linkcode setup} must be performed.
 */
export function getEventListeners(target: EventTarget): EventListeners {
  const eventMap = eventTargetRegistry.get(target);

  if (!eventMap) return {};

  return Object.fromEntries(eventMap);
}
