// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  diffEventHandler,
  type EventHandlerName,
  type EventHandlerPatch,
  getEventHandlers,
  isEventHandlerName,
  syncEventHandler,
} from "./event_handler.ts";
import { assertEquals, describe, it } from "../_dev_deps.ts";

describe("isEventHandlerName", () => {
  it("should return true if the name satisfy event handler name", () => {
    const table: [string, boolean][] = [
      ["onclick", true],
      ["ontest", true],
      ["onCLICK", true],
      ["onx", true],
      [" onclick", false],
      ["on", false],
    ];

    table.forEach(([name, expected]) => {
      assertEquals(isEventHandlerName(name), expected);
    });
  });
});

describe("getEventHandlers", () => {
  it("should return event handler properties", () => {
    const fn = () => {};
    const table: [object, Record<EventHandlerName, unknown>][] = [
      [{}, {}],
      [{ onclick: null }, { onclick: null }],
      [{ onclick: null, a: "", b: "", c: "" }, { onclick: null }],
      [{ onclick: null, onblur: fn, on: fn, " onx": fn }, {
        onclick: null,
        onblur: fn,
      }],
    ];

    table.forEach(([obj, expected]) => {
      const result = Object.fromEntries(getEventHandlers(obj));

      assertEquals(result, expected);
    });
  });
});

describe("diffEventHandler", () => {
  it("should", () => {
    const fn = () => {};
    const fn2 = () => {};
    const table: [object, object, EventHandlerPatch[]][] = [
      [{}, {}, []],
      [{ onclick: null }, {}, [{
        action: "delete",
        name: "onclick",
        listener: null,
      }]],
      [{}, { onclick: null }, [{
        action: "add",
        name: "onclick",
        listener: null,
      }]],
      [{ onclick: null }, { onclick: null }, []],
      [{ onclick: fn }, { onclick: fn }, []],
      [{ onclick: fn }, { onclick: fn2 }, [
        { action: "substitute", name: "onclick", from: fn, to: fn2 },
      ]],
      [
        { ona: fn, onb: fn2, onc: null },
        { ona: null, onb: fn2, onc: fn2, onclick: fn2 },
        [
          { action: "substitute", name: "ona", from: fn, to: null },
          { action: "substitute", name: "onc", from: null, to: fn2 },
          { action: "add", name: "onclick", listener: fn2 },
        ],
      ],
    ];

    table.forEach(([oldNode, newNode, expected]) => {
      assertEquals([...diffEventHandler(oldNode, newNode)], expected);
    });
  });
});

describe("syncEventHandler", () => {
  it("should", () => {
    const fn = () => {};
    const table: [object, EventHandlerPatch, object][] = [
      [{}, { action: "add", name: "onclick", listener: null }, {
        onclick: null,
      }],
      [{ onclick: null }, {
        action: "substitute",
        name: "onclick",
        from: null,
        to: fn,
      }, {
        onclick: fn,
      }],
      [{ onclick: fn }, {
        action: "delete",
        name: "onclick",
        listener: fn,
      }, { onclick: null }],
    ];

    table.forEach(([node, patch, expected]) => {
      syncEventHandler(node, patch);
      assertEquals(node, expected);
    });
  });
});
