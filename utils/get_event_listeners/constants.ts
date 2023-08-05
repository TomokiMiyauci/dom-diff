// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { EventListenerMap } from "./map.ts";

export const eventTargetRegistry = /*@__PURE__*/ new WeakMap<
  object,
  EventListenerMap
>();
