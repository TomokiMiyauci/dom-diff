import { type EventInfo } from "./types.ts";
import { eventTargetRegistry } from "./constants.ts";

export { setup } from "./setup.ts";
export type { EventInfo } from "./types.ts";
export function getEventListeners(
  target: EventTarget,
): Record<string, EventInfo[]> {
  const eventMap = eventTargetRegistry.get(target);

  if (!eventMap) return {};

  return Object.fromEntries(eventMap);
}
