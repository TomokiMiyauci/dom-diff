// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

/// <reference lib="dom" />

import type { AttrDep, ElementDep } from "../generated.d.ts";

export interface Named {
  name: string;
}

export type ElementLike = Pick<Element, ElementDep>;
export type AttrLike = Pick<Attr, AttrDep>;
