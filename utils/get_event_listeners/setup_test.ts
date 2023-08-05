// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  getEventListeners,
  handleAddEventListener,
  handlerRemoveEventListener,
  setup,
} from "./setup.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertSpyCallArgs,
  assertSpyCalls,
  describe,
  it,
  spy,
} from "../../_dev_deps.ts";
import { EventListenerMap } from "./map.ts";

describe("handleAddEventListener", () => {
  it("should add listener", () => {
    const registry = new WeakMap<object, EventListenerMap>();
    const thisArg = {};
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", null] as [string, null];

    assertEquals(handleAddEventListener(listener, thisArg, args, registry), 1);
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertEquals([...registry.get(thisArg)!], [["click", [{
      listener: null,
      once: false,
      passive: false,
      type: "click",
      useCapture: false,
    }]]]);
  });

  it("should add listener if the registry has it", () => {
    const thisArg = {};
    const addEventListener = spy(() => {
      return 1;
    });
    const clickHandler = {
      listener: null,
      once: false,
      passive: false,
      type: "click",
      useCapture: false,
    };
    const registry = new WeakMap<object, EventListenerMap>([[
      thisArg,

      new EventListenerMap([clickHandler]),
    ]]);
    const args = ["click", null, true] as [string, null, true];

    assertEquals(
      handleAddEventListener(addEventListener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(addEventListener, 1);
    assertSpyCallArgs(addEventListener, 0, args);
    assertEquals([...registry.get(thisArg)!], [["click", [clickHandler, {
      ...clickHandler,
      useCapture: true,
    }]]]);
  });
});

describe("handlerRemoveEventListener", () => {
  it("should not do anything if the listener is not exist", () => {
    const thisArg = {};
    const registry = new WeakMap<object, EventListenerMap>();
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", null] as [string, null];

    assertEquals(
      handlerRemoveEventListener(listener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertFalse(registry.has(thisArg));
  });

  it("should delete listener if exist", () => {
    const thisArg = {};
    const clickHandler = {
      listener: null,
      once: false,
      passive: false,
      type: "click",
      useCapture: false,
    };
    const registry = new WeakMap<object, EventListenerMap>(
      [[thisArg, new EventListenerMap([clickHandler])]],
    );
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", null] as [string, null];

    assertEquals(
      handlerRemoveEventListener(listener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertEquals([...registry.get(thisArg)!], []);
  });
});

describe("setup", () => {
  it("should override EventTarget prototype", () => {
    const { addEventListener, removeEventListener } = EventTarget.prototype;

    setup();

    assert(EventTarget.prototype.addEventListener !== addEventListener);
    assert(EventTarget.prototype.removeEventListener !== removeEventListener);
  });

  it("should return getEventListeners", () => {
    assert(setup() === getEventListeners);
  });

  it("getEventListeners should return event listeners", () => {
    const getEventListeners = setup();

    assertEquals(getEventListeners(EventTarget.prototype), {});
  });

  it("getEventListeners should return registered event listeners", () => {
    const getEventListeners = setup();

    const target = new EventTarget();
    const listener = () => {};
    target.addEventListener("click", listener);

    assertEquals(getEventListeners(target), {
      "click": [{
        listener,
        type: "click",
        passive: false,
        useCapture: false,
        once: false,
      }],
    });
  });

  it("getEventListeners should return empty", () => {
    const getEventListeners = setup();
    const target = new EventTarget();
    const target2 = new EventTarget();
    target.addEventListener("click", () => {});

    assertEquals(getEventListeners(target2), {});
  });
});
