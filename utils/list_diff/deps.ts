export { zip } from "https://deno.land/std@0.195.0/collections/zip.ts";
export { distinct } from "https://deno.land/std@0.195.0/collections/distinct.ts";
export { partition } from "https://deno.land/std@0.195.0/collections/partition.ts";
export { maxBy } from "https://deno.land/std@0.195.0/collections/max_by.ts";
export { filterValues } from "https://deno.land/std@0.195.0/collections/filter_values.ts";
export { isNumber } from "https://deno.land/x/isx@1.5.0/is_number.ts";
export { emplace } from "https://deno.land/x/upsert@1.2.0/mod.ts";
export { headTail } from "https://deno.land/x/seqtools@1.0.0/head_tail.ts";

export function prop<K extends PropertyKey>(
  key: K,
): <R>(obj: Record<K, R>) => R {
  return (obj) => obj[key];
}

export function identify<T>(input: T): T {
  return input;
}

export function construct<A extends readonly unknown[], R>(
  ctor: { new (...args: A): R },
): (...args: A) => R {
  return (...args: A) => {
    return new ctor(...args);
  };
}
