// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  diffEventLister,
  EventListenerPatch,
  EventListenerReconciler,
  type EventListeners,
  generatePatches,
  syncEventListener,
} from "./event_listener.ts";
import { type Listener } from "../utils/get_event_listeners/mod.ts";
import {
  assert,
  assertEquals,
  assertSpyCallArgs,
  assertSpyCalls,
  describe,
  it,
  spy,
  stub,
} from "../_dev_deps.ts";

const clickListener: Listener = {
  type: "click",
  listener: () => {},
  once: false,
  useCapture: false,
  passive: false,
};
const clickListener2: Listener = {
  ...clickListener,
  listener: () => {},
};
const capturedClickListener: Listener = {
  ...clickListener,
  useCapture: true,
};
const blurListener: Listener = {
  ...clickListener,
  type: "blur",
};

describe("generatePatches", () => {
  it("should generate patches", () => {
    const table: [EventListeners, EventListeners, EventListenerPatch[]][] = [
      [{}, {}, []],
      [{ click: [] }, {}, []],
      [{}, { click: [] }, []],
      [{ click: [] }, { click: [] }, []],
      [{ click: [clickListener] }, {}, [{
        action: "delete",
        ...clickListener,
      }]],
      [{}, { click: [clickListener] }, [{
        action: "add",
        ...clickListener,
      }]],
      [{ click: [clickListener] }, { click: [clickListener] }, []],
      [{ click: [clickListener] }, { click: [clickListener2] }, [{
        action: "delete",
        ...clickListener,
      }, { action: "add", ...clickListener2 }]],
      [{ click: [clickListener] }, { click: [capturedClickListener] }, [{
        action: "delete",
        ...clickListener,
      }, { action: "add", ...capturedClickListener }]],
      [{ click: [clickListener], blur: [blurListener] }, {}, [{
        action: "delete",
        ...clickListener,
      }, { action: "delete", ...blurListener }]],
      [{ click: [clickListener], blur: [blurListener] }, {
        click: [clickListener],
        blur: [blurListener],
      }, []],
      [{ click: [clickListener, clickListener], blur: [blurListener] }, {
        click: [clickListener],
        blur: [blurListener],
      }, []],
      [{ click: [clickListener2, clickListener], blur: [blurListener] }, {
        click: [clickListener],
        blur: [blurListener],
      }, [{ action: "delete", ...clickListener2 }]],
      [
        { click: [clickListener], blur: [blurListener] },
        { click: [clickListener2, clickListener], blur: [blurListener] },
        [{ action: "add", ...clickListener2 }],
      ],
      [
        { click: [clickListener, clickListener, clickListener] },
        { click: [] },
        [{ action: "delete", ...clickListener }],
      ],
      [
        { click: [] },
        { click: [clickListener, clickListener, clickListener] },
        [{ action: "add", ...clickListener }],
      ],
      [
        { click: [clickListener] },
        { click: [clickListener, clickListener, clickListener] },
        [],
      ],
    ];

    table.forEach(([source, target, expected]) => {
      assertEquals([...generatePatches(source, target)], expected);
    });
  });
});

describe("diffEventLister", () => {
  const oldTarget = {};
  const newTarget = {};

  it("should not yield if all event handler are same", () => {
    assertEquals([...diffEventLister(oldTarget, newTarget, () => {
      return <EventListeners> { click: [clickListener] };
    })], []);
  });

  it("should yield delete and add patch", () => {
    assertEquals([...diffEventLister(oldTarget, newTarget, (target) => {
      if (target === oldTarget) {
        return <EventListeners> { click: [clickListener] };
      }

      return <EventListeners> {
        blur: [blurListener],
      };
    })], [
      { action: "delete", ...clickListener },
      { action: "add", ...blurListener },
    ]);
  });

  it("should yield delete patch", () => {
    assertEquals([...diffEventLister(oldTarget, newTarget, (target) => {
      if (target === oldTarget) {
        return <EventListeners> { click: [clickListener] };
      }

      return <EventListeners> {};
    })], [
      { action: "delete", ...clickListener },
    ]);
  });

  it("should yield add patch", () => {
    assertEquals([...diffEventLister(oldTarget, newTarget, (target) => {
      if (target === oldTarget) {
        return <EventListeners> {};
      }

      return <EventListeners> {
        click: [clickListener],
      };
    })], [
      { action: "add", ...clickListener },
    ]);
  });

  it("should not yield if the listener is same", () => {
    assertEquals([...diffEventLister(oldTarget, newTarget, (target) => {
      if (target === oldTarget) {
        return <EventListeners> {
          click: [clickListener],
        };
      }

      return <EventListeners> {
        blur: [clickListener],
      };
    })], []);
  });
});

describe("syncEventListener", () => {
  it("should call addEventListener if the patch is add", () => {
    const target = new EventTarget();
    const listener = spy(() => {});

    stub(target, "addEventListener", listener);

    syncEventListener(target, { action: "add", ...clickListener });

    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, [
      clickListener.type,
      clickListener.listener,
      {
        once: clickListener.once,
        passive: clickListener.passive,
        capture: clickListener.useCapture,
      },
    ]);
  });

  it("should call removeEventListener if the patch is delete", () => {
    const target = new EventTarget();
    const listener = spy(() => {});

    stub(target, "removeEventListener", listener);

    syncEventListener(target, { action: "delete", ...clickListener });

    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, [
      clickListener.type,
      clickListener.listener,
      { capture: clickListener.useCapture },
    ]);
  });
});

describe("EventListenerReconciler", () => {
  it("should work as diffEventLister and syncEventListener", () => {
    const oldNode = {};
    const newNode = {};
    const reconciler = new EventListenerReconciler((target) => {
      if (target === oldNode) {
        return <EventListeners> { click: [clickListener] };
      }

      return {};
    });

    assert(reconciler.update === syncEventListener);
    assertEquals([...reconciler.diff(oldNode, newNode)], [{
      action: "delete",
      ...clickListener,
    }]);
  });
});
