export type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>> & Omit<T, K>;
export type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

export type NotNullish<T> = {[Property in keyof T]: Exclude<T[Property], undefined | null>};
export type NotNullishPick<T, K extends keyof T> = Required<{[Property in K]: Exclude<T[Property], undefined | null>}> & Omit<T, K>;

export type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
export type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];

export type NonEmptyArray<T> = [T, ...T[]];
export type ArrayWith2OrMoreElements<T> = [T, T, ...T[]];

export type DeepReadonly<T> = Readonly<{
    [K in keyof T]:
      // Is it a primitive? Then make it readonly
      T[K] extends (number | string | symbol) ? Readonly<T[K]>
      // Is it an array of items? Then make the array readonly and the item as well
      : T[K] extends Array<infer A> ? Readonly<Array<DeepReadonly<A>>>
      // It is some other object, make it readonly as well
      : DeepReadonly<T[K]>;
  }>;
