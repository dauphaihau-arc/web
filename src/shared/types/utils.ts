export type UndefinableFields<T, Fields> = {
  [K in keyof T]: K extends Fields
    ? T[K] | undefined
    : T[K]
};

export type Override<T extends object, K extends { [P in keyof T]?: unknown }> = Omit<T, keyof K> & K;

export type ElementType<T extends Iterable<unknown>> = T extends Iterable<infer E>
  ? E
  : never;

export type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> };

export type PickPartial<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
