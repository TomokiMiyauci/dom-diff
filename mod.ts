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
export {
  type EventListenerPatch,
  EventListenerReconciler,
  type GetEventListeners,
  setupEventListeners,
} from "./reconcilers/event_listener.ts";
export { type Reconciler } from "./types.ts";
