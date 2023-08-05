// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { Listener } from "./types.ts";

type EqualityDeps = "type" | "listener" | "useCapture";

/** Map for event listener. */
export class EventListenerMap {
  #eventMap: Map<string, Listener[]> = new Map();

  constructor(listeners: Iterable<Listener> = []) {
    for (const listener of listeners) this.set(listener);
  }

  /** Whether the {@linkcode listener} exist or not. */
  has(listener: Pick<Listener, EqualityDeps>): boolean {
    if (!this.#eventMap.has(listener.type)) return false;

    const listeners = this.#eventMap.get(listener.type)!;

    return !!listeners.find((left) =>
      left.listener === listener.listener &&
      left.useCapture === listener.useCapture
    );
  }

  /** Add {@linkcode listener}.
   * If it already exists, nothing is done.
   */
  set(listener: Listener): this {
    if (this.has(listener)) return this;

    const set = this.#eventMap.get(listener.type) ?? [];
    this.#eventMap.set(listener.type, set.concat(listener));

    return this;
  }

  /** Delete {@linkcode listener}.
   * If it is not present, nothing is done.
   */
  delete(listener: Pick<Listener, EqualityDeps>): boolean {
    if (!this.#eventMap.has(listener.type)) return false;

    const listeners = this.#eventMap.get(listener.type)!;
    const index = listeners.findIndex((left) =>
      left.listener === listener.listener &&
      left.useCapture === listener.useCapture
    );

    if (index < 0) return false;

    listeners.splice(index, 1);

    if (!listeners.length) {
      this.#eventMap.delete(listener.type);
    }

    return true;
  }

  *[Symbol.iterator](): Generator<
    [type: string, listeners: Listener[]],
    void,
    undefined
  > {
    yield* this.#eventMap;
  }
}
