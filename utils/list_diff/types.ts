export interface Position {
  index: number;
}

export interface OrderedRecord {
  from: number;
  to: number;
}

export interface KeyingCallback<T = unknown, R = unknown> {
  (item: T, index: number, array: readonly T[]): R;
}
