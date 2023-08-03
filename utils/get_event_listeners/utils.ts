import type { NormalizedAddEventListenerOptions } from "./types.ts";

export function normalizeOptions(
  options: boolean | AddEventListenerOptions | undefined,
): NormalizedAddEventListenerOptions {
  if (typeof options === "boolean" || typeof options === "undefined") {
    return {
      capture: options ?? false,
      once: false,
      passive: false,
    };
  }

  const { capture = false, passive = false, once = false } = options;
  return { capture, passive, once };
}
