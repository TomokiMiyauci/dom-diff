import { zip } from "./deps.ts";

export function bisectLeft(
  arr: readonly number[],
  target: number,
  lo = 0,
  hi = arr.length,
): number {
  while (lo < hi) {
    const mid = (lo + hi) / 2 | 0;

    if (target > arr[mid]!) lo = mid + 1;
    else hi = mid;
  }

  return lo;
}

export function lis(array: readonly number[], strict = false): number[] {
  const lisDP: number[] = [];
  const indexList: number[] = [];
  const bisector = strict ? bisectLeft : bisectRight;

  array.forEach((item, i) => {
    const ind = bisector(lisDP, item);
    lisDP[ind] = item;
    indexList[i] = ind;
  });

  const targetIndex = Math.max(...indexList);

  const { list } = zip(indexList, array.slice()).reduceRight(
    (acc, [index, value]) => {
      if (index === acc.targetIndex) {
        acc.list.unshift(value);
        acc.targetIndex--;

        return acc;
      }

      return acc;
    },
    { targetIndex, list: [] } as {
      targetIndex: number;
      list: number[];
    },
  );

  return list;
}

export const bisectRight = (
  array: number[],
  x: number,
  lo = 0,
  hi = array.length,
) => {
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    x < array[mid]! ? (hi = mid) : (lo = mid + 1);
  }
  return lo;
};

export interface Index {
  index: number;
}

export interface Box<T> {
  item: T;
}

export interface BoxWithIndex<T = unknown> extends Box<T>, Index {}

export function enumerate<T>(
  array: readonly T[],
): BoxWithIndex<T>[] {
  return array.map((item, index) => ({ index, item }));
}

export function* ene<T>(
  iterable: Iterable<T>,
  start = 0,
): Iterable<[index: number, item: T]> {
  for (const item of iterable) {
    yield [start++, item];
  }
}

export function* concat<T>(left: Iterable<T>, right: Iterable<T>): Iterable<T> {
  yield* left;
  yield* right;
}
