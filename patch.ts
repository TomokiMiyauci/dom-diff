// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import type { DiffResult } from "./types.ts";
import { resolvePaths } from "./utils/node.ts";
import { format } from "./deps.ts";

export interface Sync<P> {
  (node: Node, patch: P): void;
}

export function applyPatch<T extends DiffResult<PropertyKey, unknown>>(
  root: Node,
  results: Iterable<T>,
  syncs: {
    [k in T["type"]]: Sync<Extract<T, { type: k }>["patch"]>;
  },
): void {
  for (const result of results) {
    const node = resolvePaths(root, result.paths);

    if (!node) throw new Error(Msg.notExist(Name.TargetNode));

    syncs[result.type as T["type"]](node, result.patch);
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
