import type { KeyingCallback, Position } from "./types.ts";
import { distinct, emplace, zip } from "./deps.ts";

interface With<T> {
  item: T;
}

export interface Diff<T> {
  inserts: (Position & With<T>)[];
  removes: (Position & With<T>)[];
  moves: { prev: Position & With<T>; current: Position & With<T> }[];
  sames: (Position & { oldItem: T; newItem: T })[];
}

interface Index {
  index: number;
}

interface Box<T> {
  item: T;
}

function reducer<T>(
  map: Map<unknown, BoxWithIndex<T>[]>,
  [key, value]: readonly [key: unknown, value: T],
  index: number,
) {
  const box = { item: value, index };
  emplace(map, key, {
    insert: () => {
      return [box];
    },
    update: (v) => v.concat(box),
  });

  return map;
}

interface BoxWithIndex<T = unknown> extends Box<T>, Index {}

export function analyze<T>(
  prevList: readonly T[],
  list: readonly T[],
  keying: KeyingCallback<T>,
): Diff<T> {
  const prevKeyMap = prevList.map((v, i, array) =>
    [keying(v, i, array), v] as const
  )
    .reduce(
      reducer,
      new Map<unknown, BoxWithIndex<T>[]>(),
    );
  const keyedMap = list.map((v, i, array) => [keying(v, i, array), v] as const)
    .reduce(
      reducer,
      new Map<unknown, BoxWithIndex<T>[]>(),
    );

  const allKeys = distinct([...prevKeyMap.keys(), ...keyedMap.keys()]);

  const { inserts, removes, sames, moves } = allKeys.reduce(
    (acc: Diff<T>, key) => {
      if (!keyedMap.has(key)) {
        const set = prevKeyMap.get(key)!;
        acc.removes.push(...set);

        return acc;
      }

      if (!prevKeyMap.has(key)) {
        const set = keyedMap.get(key)!;

        acc.inserts.push(...set);

        return acc;
      }

      const prevSet = prevKeyMap.get(key)!;
      const currentSet = keyedMap.get(key)!;

      const existances = zip(prevSet, currentSet);

      acc.removes.push(...prevSet.slice(currentSet.length));
      acc.inserts.push(...currentSet.slice(prevSet.length));

      for (
        const [
          { index: prevIndex, item: prevItem },
          { index: currentIndex, item: currentItem },
        ] of existances
      ) {
        if (prevIndex === currentIndex) {
          acc.sames.push({
            index: prevIndex,
            oldItem: prevItem,
            newItem: currentItem,
          });

          continue;
        }

        acc.moves.push({
          prev: { index: prevIndex, item: prevItem },
          current: { index: currentIndex, item: currentItem },
        });

        continue;
      }

      return acc;
    },
    { removes: [], inserts: [], sames: [], moves: [] } as Diff<T>,
  );

  return { inserts, removes, sames, moves };
}
