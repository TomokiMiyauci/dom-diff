// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export { distinct } from "https://deno.land/std@0.195.0/collections/distinct.ts";
export { zip } from "https://deno.land/std@0.195.0/collections/zip.ts";
export { enumerate, imap } from "https://esm.sh/itertools@2.1.2";
export { format } from "https://deno.land/x/format@1.0.1/mod.ts";
export { papplyRest } from "https://deno.land/x/curry@1.1.0/partial.ts";
export { headTail } from "https://deno.land/x/seqtools@1.0.0/head_tail.ts";
export { mapValues } from "https://deno.land/std@0.196.0/collections/map_values.ts";

// deno-lint-ignore no-explicit-any
export function not<T extends (...args: any) => boolean>(fn: T): T {
  const proxy = new Proxy(fn, {
    apply: (target, thisArg, argArray) => {
      return !target.apply(thisArg, argArray);
    },
  });

  return proxy;
}

export function assoc<const K extends PropertyKey, const V>(
  key: K,
  value: V,
): <T extends object>(target: T) => T & { [k in K]: V } {
  return <T extends object>(target: T) => {
    return Object.assign(target, { [key]: value }) as T & { [k in K]: V };
  };
}
