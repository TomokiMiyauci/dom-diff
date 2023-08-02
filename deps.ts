// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export { distinct } from "https://deno.land/std@0.195.0/collections/distinct.ts";
export { zip } from "https://deno.land/std@0.195.0/collections/zip.ts";
export { enumerate, imap } from "https://esm.sh/itertools@2.1.2";
export { format } from "https://deno.land/x/format@1.0.1/mod.ts";
export { papplyRest } from "https://deno.land/x/curry@1.1.0/partial.ts";
export { headTail } from "https://deno.land/x/seqtools@1.0.0/head_tail.ts";

export type UnionToIntersection<U> =
  // deno-lint-ignore no-explicit-any
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I
    : never;
