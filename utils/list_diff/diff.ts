import { KeyingCallback, OrderedRecord, Position } from "./types.ts";
import { analyze, Diff } from "./analyze.ts";
import {
  construct,
  distinct,
  headTail,
  identify,
  isNumber,
  prop,
} from "./deps.ts";
import { bisectRight, BoxWithIndex, concat, lis } from "./utils.ts";
import { ene } from "./utils.ts";

export type Patch<T> =
  | InsertPatch<T>
  | RemovePatch<T>
  | MovePatch
  | SubstitutePatch<T>;

interface Node {
  type: PatchType;
}

interface BasePatch extends Node, Position {}

export class InsertPatch<T> implements BasePatch {
  type: PatchType.Insert = PatchType.Insert;
  item: T;
  index: number;

  constructor(arg: Position & { item: T }) {
    this.index = arg.index;
    this.item = arg.item;
  }
}

export class RemovePatch<T = unknown> implements BasePatch {
  type: PatchType.Remove = PatchType.Remove;

  index: number;
  item: T;

  constructor(position: Position & { item: T }) {
    this.index = position.index;
    this.item = position.item;
  }
}

export class MovePatch implements Node {
  type: PatchType.Move = PatchType.Move;
  from: number;
  to: number;

  constructor(arg: { from: number; to: number }) {
    this.from = arg.from;
    this.to = arg.to;
  }
}

export interface SubstitutePatch<T> extends Node {
  type: PatchType.Substitute;
  index: number;
  from: {
    item: T;
  };
  to: {
    item: T;
  };
}

export enum PatchType {
  Insert = "insert",
  Move = "move",
  Remove = "remove",
  Substitute = "substitute",
}

interface DiffOptions<T> {
  /**
   * @default false
   */
  substitutable?: boolean;
  keying?: KeyingCallback<T>;
}

export function diff<T>(
  prevList: readonly T[],
  list: readonly T[],
  options: DiffOptions<T> = {},
): Patch<T>[] {
  const different = analyze(prevList, list, options.keying ?? identify);

  return diffToPatch(different, options);
}

interface Options {
  /**
   * @default false
   */
  substitutable?: boolean;
}

export function diffToPatch<T>(
  diff: Readonly<Diff<T>>,
  options: Options = { substitutable: false },
): Patch<T>[] {
  const { inserts, removes, moves, sames } = diff;

  const orderPriority = moves.map(({ prev, current }) =>
    [prev.index, current.index] as [number, number]
  )
    .concat(sames.map(getIndex).map(tuple))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, [] as number[]).filter(isNumber);

  const ordered = orderChanged(orderPriority);
  const movePatches = ordered.map(createMovePatch);

  if (!options.substitutable) {
    const removePatches: Patch<T>[] = removes
      .toSorted(({ index: a }, { index: b }) => b - a)
      .map(createRemovePatch);
    const insertPatches = inserts.map(createInsertPatch);

    return removePatches
      .concat(movePatches)
      .concat(insertPatches);
  }

  const removeMap = new Map<number, BoxWithIndex<T>>(
    removes.map((box) => [box.index, box]),
  );
  const insertMap = new Map<number, BoxWithIndex<T>>(
    inserts.map((box) => [box.index, box]),
  );

  const result = distinct(concat(removeMap.keys(), insertMap.keys())).reduce(
    (acc, index) => {
      if (!removeMap.has(index)) {
        const box = insertMap.get(index)!;
        acc.inserts.push(createInsertPatch(box));
        return acc;
      }

      if (!insertMap.has(index)) {
        const box = removeMap.get(index)!;
        acc.removes.unshift(createRemovePatch(box));
        return acc;
      }

      const fromBox = removeMap.get(index)!;
      const toBox = insertMap.get(index)!;

      const substitutes: SubstitutePatch<T> = {
        type: PatchType.Substitute,
        index,
        from: { item: fromBox.item },
        to: { item: toBox.item },
      };

      acc.substitutes.push(substitutes);

      return acc;
    },
    {
      removes: [],
      inserts: [],
      substitutes: [],
    } as {
      removes: RemovePatch[];
      inserts: InsertPatch<T>[];
      substitutes: SubstitutePatch<T>[];
    },
  );

  return (result.removes as Patch<T>[]).concat(result.substitutes).concat(
    movePatches,
  ).concat(
    result.inserts,
  );
}

const createRemovePatch = construct(RemovePatch);
const createMovePatch = construct(MovePatch);
const createInsertPatch = construct(InsertPatch);
const getIndex = prop("index");

export function orderChanged(priorityList: readonly number[]): OrderedRecord[] {
  const l = lis(priorityList);

  return rec(priorityList, l);
}

function rec(
  seq: readonly number[],
  lis: readonly number[],
  ope: OrderedRecord[] = [],
): OrderedRecord[] {
  if (seq.length <= lis.length) return ope;

  for (const [index, item] of ene(seq)) {
    const lisValue = lis[index];

    if (item === lisValue) continue;

    const indexedLis = zi(seq, lis);
    const insertPosition = bisectRight(zi(seq, lis).map(prop("item")), item);
    const to = insertPosition
      ? indexedLis[insertPosition - 1]!.index > index
        ? indexedLis[insertPosition - 1]!.index
        : indexedLis[insertPosition - 1]!.index + 1
      : 0;

    ope.push({ from: index, to });
    const newSeq = seq.slice();
    const items = newSeq.splice(index, 1);
    newSeq.splice(to, 0, ...items);

    const newLis: number[] = lis.slice();
    newLis.splice(insertPosition, 0, item);

    return rec(newSeq, newLis, ope);
  }

  return ope;
}

function tuple<T>(input: T): [T, T] {
  return [input, input];
}

function zi(
  base: readonly number[],
  finds: readonly number[],
  count = 0,
  init: { index: number; item: number }[] = [],
): { index: number; item: number }[] {
  if (!finds.length || !base.length) return init;

  const [first, rest] = headTail(base as [number, ...number[]]);
  const [f, r] = headTail(finds as [number, ...number[]]);
  const c = count + 1;

  if (f === first) {
    const cache = init.concat({ index: count, item: f });
    return zi(rest, r, c, cache);
  }

  return zi(rest, finds, c, init);
}
