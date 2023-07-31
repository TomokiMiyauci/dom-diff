// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import { Patch, Position } from "./types.ts";
import { resolvePaths } from "./utils.ts";
import { format } from "./deps.ts";

export function applyPatch<T extends Patch>(
  root: Node,
  patches: Iterable<T & Position>,
  sync: {
    [k in T["valueType"]]: {
      [i in Extract<T, { valueType: k }>["type"]]: (
        node: Node,
        data: Extract<Extract<T, { valueType: k }>, { type: i }>["value"],
      ) => void;
    };
  },
): void {
  for (const patch of patches) {
    const node = resolvePaths(root, patch.paths);

    if (!node) throw new Error(Msg.notExist(Name.TargetNode));

    sync[patch.valueType as T["valueType"]]
      [patch.type as Extract<T, { valueType: string }>["type"]](
        node,
        patch.value,
      );
  }
}

const enum Template {
  NotExist = "{name} does not exist",
  Fail = "fail to {what}",
}

const enum Name {
  TargetNode = "target node",
  OwnerElement = "owner element",
  ParentNode = "parent node",
}

class Msg {
  static notExist(name: string): string {
    return format(Template.NotExist, { name });
  }
  static fail(what: string): string {
    return format(Template.Fail, { what });
  }
}
