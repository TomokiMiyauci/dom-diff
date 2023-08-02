// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export function mergeGenerator<
  // deno-lint-ignore no-explicit-any
  T extends ((...args: readonly any[]) => Iterable<unknown>)[],
>(
  ...fns: T
): (...args: Parameters<T[number]>) => Generator<Yield<ReturnType<T[number]>>> {
  return function* (...args: Parameters<T[number]>) {
    for (const fn of fns) {
      yield* fn(...args) as Iterable<Yield<ReturnType<T[number]>>>;
    }
  };
}

export type Yield<T> = T extends Iterable<infer U> ? U : never;
