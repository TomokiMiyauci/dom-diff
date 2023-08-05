// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export { Differ } from "./diff.ts";
export { type DataPatch, DataReconciler } from "./reconcilers/data.ts";
export {
  type AttributePatch,
  AttributeReconciler,
} from "./reconcilers/attribute.ts";
export { type MarkupPatch, MarkupReconciler } from "./reconcilers/markup.ts";
export {
  type EventHandlerPatch,
  EventHandlerReconciler,
} from "./reconcilers/event_handler.ts";
export { EventListenerReconciler } from "./reconcilers/event_listener.ts";
export { setup as setupEventListener } from "./utils/get_event_listeners/mod.ts";
export { type Reconciler } from "./types.ts";
