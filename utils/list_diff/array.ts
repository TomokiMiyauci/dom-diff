export function move<T>(array: readonly T[], from: number, to: number): T[] {
  if (
    from === to || from < 0 || to < 0 ||
    from >= array.length || to >= array.length
  ) return array as T[];

  const newArray = array.slice();
  const movedElement = newArray.splice(from, 1);

  newArray.splice(to, 0, ...movedElement);

  return newArray;
}

export function remove<T>(array: readonly T[], index: number): T[] {
  const newArray = array.slice();

  newArray.splice(index, 1);

  return newArray;
}

export function insert<T>(array: readonly T[], index: number, item: T): T[] {
  if (index < 0 || index > array.length) return array as T[];

  const newArray = array.slice();
  newArray.splice(index, 0, item);

  return newArray;
}
