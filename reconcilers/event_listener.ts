// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { distinct } from "../deps.ts";
import type { AdditionPatch, DeletionPatch, Reconciler } from "../types.ts";
import {
  type EventInfo,
  getEventListeners,
} from "../utils/get_event_listeners/mod.ts";

export type EventListenerPatch =
  | AdditionPatch<EventInfo>
  | DeletionPatch<EventInfo>;

export function* diffEventLister(
  oldNode: Node,
  newNode: Node,
): Generator<EventListenerPatch> {
  const oldListeners = new Map<string, EventInfo[]>(
    Object.entries(getEventListeners(oldNode)),
  );
  const newListeners = new Map<string, EventInfo[]>(
    Object.entries(getEventListeners(newNode)),
  );

  const allEvents = distinct([...oldListeners.keys(), ...newListeners.keys()]);

  for (const event of allEvents) {
    if (!oldListeners.has(event)) {
      const events = newListeners.get(event)!;

      for (const event of events) {
        yield { ...event, action: "add" };
      }

      return;
    }

    if (!newListeners.has(event)) {
      const events = oldListeners.get(event)!;

      for (const event of events) {
        yield { ...event, action: "delete" };
      }

      return;
    }

    const lefts = oldListeners.get(event)!;
    const rights = newListeners.get(event)!;

    const commons = intersectBy(
      lefts,
      rights,
      equalsListenerObject,
    );
    const leftsOnly = lefts.filter((left) =>
      commons.find((right) => !equalsListenerObject(left, right))
    );
    const rightsOnly = rights.filter((right) =>
      commons.find((left) => !equalsListenerObject(right, left))
    );

    for (const listener of leftsOnly) {
      yield { action: "delete", ...listener };
    }

    for (const listener of rightsOnly) {
      yield { action: "add", ...listener };
    }
  }
}

export function syncEventListener(
  target: EventTarget,
  patch: EventListenerPatch,
) {
  const { type, listener, action, ...options } = patch;

  switch (action) {
    case "add": {
      target.addEventListener(type, listener, options);
      break;
    }
    case "delete": {
      target.removeEventListener(type, listener, { capture: options.capture });
      break;
    }
  }
}

function equalsListenerObject(left: EventInfo, right: EventInfo): boolean {
  return left.listener === right.listener && left.capture === right.capture;
}

function intersectBy<T>(
  lefts: readonly T[],
  rights: readonly T[],
  equals: (left: T, right: T) => boolean,
): T[] {
  const result = lefts.reduce((acc, left) => {
    const matched = rights.find((right) => equals(left, right));

    if (matched) acc.push(left);

    return acc;
  }, [] as T[]);

  return result;
}

export class EventListenerReconciler implements Reconciler<EventInfo> {
  diff = diffEventLister;
  sync = syncEventListener;
}
