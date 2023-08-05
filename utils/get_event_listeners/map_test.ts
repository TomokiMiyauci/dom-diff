// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import { EventListenerMap } from "./map.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  describe,
  it,
} from "../../_dev_deps.ts";
import { Listener } from "./mod.ts";

const clickListener = {
  type: "click",
  listener: () => {},
  useCapture: false,
  passive: false,
  once: false,
};
const clickListener2 = {
  ...clickListener,
  listener: () => {},
};
const clickListenerNotSameCapture = {
  ...clickListener,
  useCapture: true,
};

const blurListener = {
  ...clickListener,
  type: "blur",
};

describe("EventListenerMap", () => {
  describe("set", () => {
    it("should", () => {
      const map = new EventListenerMap();

      map.set(clickListener);

      assertEquals([...map], [["click", [clickListener]]]);
    });

    it("should return this", () => {
      const map = new EventListenerMap();

      map.set(clickListener);

      assertEquals(map, map.set(clickListener));
    });

    it("should not set if the listener is duplicated", () => {
      const map = new EventListenerMap();

      map.set(clickListener);
      map.set(clickListener);

      assertEquals([...map], [["click", [clickListener]]]);
    });

    it("should not set if the listener is duplicated", () => {
      const map = new EventListenerMap();

      map.set(clickListener);
      map.set({ ...clickListener, passive: true, once: true });

      assertEquals([...map], [["click", [clickListener]]]);
    });

    it("should set if the listener is duplicated", () => {
      const map = new EventListenerMap();

      map.set(clickListener);
      map.set(blurListener);

      assertEquals([...map], [
        ["click", [clickListener]],
        ["blur", [blurListener]],
      ]);
    });

    it("should set if the listener is duplicated", () => {
      const map = new EventListenerMap();

      map.set(clickListener);
      map.set(clickListener2);

      assertEquals([...map], [
        ["click", [clickListener, clickListener2]],
      ]);
    });

    it("should set if the listener is duplicated", () => {
      const map = new EventListenerMap();

      map.set(clickListener);
      map.set(clickListener2);

      assertEquals([...map], [
        ["click", [clickListener, clickListener2]],
      ]);
    });
  });

  describe("has", () => {
    it("should return false", () => {
      const table: [Iterable<Listener>, Listener][] = [
        [[], clickListener],
        [[clickListener], clickListener2],
        [[clickListener], clickListenerNotSameCapture],
        [[clickListener], blurListener],
      ];

      table.forEach(([listeners, listener]) => {
        assertFalse(
          new EventListenerMap(listeners)
            .has(listener),
        );
      });
    });

    it("should return true", () => {
      assert(new EventListenerMap([clickListener]).has(clickListener));
    });
  });

  describe("delete", () => {
    it("should delete listener", () => {
      const table: [
        Iterable<Listener>,
        Listener,
        [type: string, listeners: Listener[]][],
      ][] = [
        [[], clickListener, []],
        [[clickListener], clickListener, []],
        [[clickListener], clickListener2, [["click", [clickListener]]]],
        [[clickListener, clickListener2], clickListenerNotSameCapture, [[
          "click",
          [clickListener, clickListener2],
        ]]],
        [[clickListener, clickListener2], clickListener, [[
          "click",
          [clickListener2],
        ]]],
        [[clickListener, blurListener], clickListener2, [
          [
            "click",
            [clickListener],
          ],
          [
            "blur",
            [blurListener],
          ],
        ]],
        [
          [clickListener, clickListener2, clickListenerNotSameCapture],
          blurListener,
          [
            [
              "click",
              [clickListener, clickListener2, clickListenerNotSameCapture],
            ],
          ],
        ],
        [
          [clickListener, clickListener2, clickListenerNotSameCapture],
          clickListener2,
          [
            [
              "click",
              [clickListener, clickListenerNotSameCapture],
            ],
          ],
        ],
        [[clickListener, blurListener], blurListener, [
          ["click", [clickListener]],
        ]],
      ];

      table.forEach(([listeners, listener, yields]) => {
        const map = new EventListenerMap(listeners);
        map.delete(listener);

        assertEquals([...map], yields);
      });
    });

    it("should return true if deletion is success", () => {
      assert(new EventListenerMap([clickListener]).delete(clickListener));
    });

    it("should return false if deletion is fail", () => {
      assertFalse(new EventListenerMap([clickListener]).delete(clickListener2));
    });
  });
});
