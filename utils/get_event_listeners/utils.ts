// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { NormalizedAddEventListenerOptions } from "./types.ts";

/** Normalize event listener options. */
export function normalizeOptions(
  options?: boolean | Omit<AddEventListenerOptions, "signal"> | undefined,
): NormalizedAddEventListenerOptions {
  if (typeof options === "boolean" || typeof options === "undefined") {
    return {
      useCapture: options ?? false,
      once: false,
      passive: false,
    };
  }

  const useCapture = options.capture ?? false;
  const { passive = false, once = false } = options;
  return { useCapture, passive, once };
}
