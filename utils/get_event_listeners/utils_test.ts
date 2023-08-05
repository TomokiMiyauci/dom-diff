// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import { normalizeOptions } from "./utils.ts";
import { assertEquals, describe, it } from "../../_dev_deps.ts";

describe("normalizeOptions", () => {
  it("should return all false if the option is undefined, false or empty object", () => {
    const table: Parameters<typeof normalizeOptions>[0][] = [
      undefined,
      false,
      {},
      { capture: false },
      { once: false },
      { passive: false },
    ];

    table.forEach((options) => {
      assertEquals(normalizeOptions(options), {
        useCapture: false,
        once: false,
        passive: false,
      });
    });
  });

  it("should be capture true if the option is true", () => {
    assertEquals(normalizeOptions(true), {
      useCapture: true,
      once: false,
      passive: false,
    });
  });

  it("should return as is", () => {
    assertEquals(normalizeOptions({ capture: true }), {
      useCapture: true,
      once: false,
      passive: false,
    });
  });
});
