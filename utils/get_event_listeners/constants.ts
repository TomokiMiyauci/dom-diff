import type { EventMapRegistry } from "./registry.ts";

export const eventTargetRegistry = new WeakMap<object, EventMapRegistry>();
