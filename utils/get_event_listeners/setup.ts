import { EventMapRegistry } from "./registry.ts";
import { normalizeOptions } from "./utils.ts";
import { eventTargetRegistry } from "./constants.ts";

export function setup(
  addEventListener: EventTarget["addEventListener"],
  removeEventListener: EventTarget["removeEventListener"],
): void {
  const $addEventListener = new Proxy(addEventListener, {
    apply: (target, thisArg, argArray) => {
      const [type, listener, options] = argArray;

      if (eventTargetRegistry.has(thisArg)) {
        const map = eventTargetRegistry.get(thisArg)!;

        map.set(type, listener, options);
      } else {
        const map = new EventMapRegistry();
        map.set(type, listener, options);

        eventTargetRegistry.set(thisArg, map);
      }

      return target.apply(thisArg, argArray as never);
    },
  });

  const $removeEventListener = new Proxy(removeEventListener, {
    apply: (target, thisArg, argArray) => {
      if (eventTargetRegistry.has(thisArg)) {
        const [type, listener, options] = argArray;
        const { capture } = normalizeOptions(options);
        const eventRegistry = eventTargetRegistry.get(thisArg)!;

        eventRegistry.delete(type, listener, capture);
      }

      return target.apply(thisArg, argArray as never);
    },
  });

  EventTarget.prototype.addEventListener = $addEventListener;
  EventTarget.prototype.removeEventListener = $removeEventListener;
}
