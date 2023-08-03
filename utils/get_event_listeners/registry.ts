import { normalizeOptions } from "./utils.ts";
import type { EventInfo } from "./types.ts";

export class EventMapRegistry {
  #eventMap: Map<string, EventInfo[]> = new Map();

  has(
    type: string,
    listener: EventListenerOrEventListenerObject,
    capture: boolean,
  ): boolean {
    if (!this.#eventMap.has(type)) return false;

    const info = this.#eventMap.get(type)!;

    return !!info.find((i) => i.listener === listener && i.capture === capture);
  }

  set(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    const normalized = normalizeOptions(options);

    if (this.has(type, listener, normalized.capture)) return;

    const set = this.#eventMap.get(type) ?? [];
    this.#eventMap.set(type, set.concat({ type, listener, ...normalized }));
  }

  delete(
    type: string,
    listener: EventListenerOrEventListenerObject,
    capture = false,
  ) {
    if (!this.#eventMap.has(type)) return false;

    const info = this.#eventMap.get(type)!;
    const index = info.findIndex((i) =>
      i.listener === listener && i.capture === capture
    );

    if (index >= 0) {
      info.splice(index, 1);

      return true;
    }

    return false;
  }

  *[Symbol.iterator]() {
    yield* this.#eventMap;
  }
}
