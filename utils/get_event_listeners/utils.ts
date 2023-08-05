// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { NormalizedAddEventListenerOptions } from "./types.ts";

/** Normalize event listener options. */
export function normalizeOptions(
  options?: boolean | Omit<AddEventListenerOptions, "signal"> | undefined,
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
