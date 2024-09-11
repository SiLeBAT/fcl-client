export type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>> &
  Omit<T, K>;
export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>> &
  Omit<T, K>;

export type NotNullish<T> = {
  [Property in keyof T]: Exclude<T[Property], undefined | null>;
};
export type NotNullishPick<T, K extends keyof T> = Required<{
  [Property in K]: Exclude<T[Property], undefined | null>;
}> &
  Omit<T, K>;

export type NonEmptyArray<T> = [T, ...T[]];
