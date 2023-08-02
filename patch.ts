// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import {
  AdditionPatch,
  DeletionPatch,
  MovementPatch,
  Patch,
  PatchType,
  Position,
  SubstitutePatch,
} from "./types.ts";
import { resolvePaths } from "./utils.ts";
import { format, UnionToIntersection } from "./deps.ts";
import {
  AddSync,
  DeleteSync,
  MoveSync,
  SubstituteSync,
} from "./synchronizer.ts";

export type PatchToSync<T extends Patch<PropertyKey, unknown>> = T extends
  SubstitutePatch<infer K, infer V> ? {
    [k in K]: SubstituteSync<V>;
  }
  : T extends AdditionPatch<infer K, infer V> ? {
      [k in K]: AddSync<V>;
    }
  : T extends DeletionPatch<infer K, infer V> ? {
      [k in K]: DeleteSync<V>;
    }
  : T extends MovementPatch<infer K> ? {
      [k in K]: MoveSync;
    }
  : never;

export function applyPatch<T extends Patch<PropertyKey, unknown>>(
  root: Node,
  patches: Iterable<T & Position>,
  sync: UnionToIntersection<PatchToSync<T>>,
): void {
  for (const patch of patches) {
    const node = resolvePaths(root, patch.paths);

    if (!node) throw new Error(Msg.notExist(Name.TargetNode));

    const valueType = patch.dataType;

    switch (patch.patchType) {
      case PatchType.Substitute: {
        ((sync as Record<PropertyKey, SubstituteSync<unknown>>)[valueType]!)
          .substitute(
            node,
            patch.data.to,
            patch.data.from,
          );
        break;
      }
      case PatchType.Add: {
        (sync as Record<PropertyKey, AddSync<unknown>>)[valueType]!.add(
          node,
          patch.data,
        );
        break;
      }
      case PatchType.Delete: {
        (sync as Record<PropertyKey, DeleteSync<unknown>>)[valueType]!.delete(
          node,
          patch.data,
        );
        break;
      }
      case PatchType.Move: {
        (sync as Record<PropertyKey, MoveSync>)[valueType]!.move(
          node,
          patch.data.to,
          patch.data.from,
        );
        break;
      }
    }
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
