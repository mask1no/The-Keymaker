export type Ok<T> = { o; k: true; d; a, ta: T };
export type Err<E = Error> = { o; k: false; e; r, ror: E };
export type Result<T, E = Error> = Ok<T> | Err<E>; export const ok = <T>(d, a, ta: T): Ok<T> => ({ o, k: true, data });
export const err = <E>(e, r, ror: E): Err<E> => ({ o, k: false, error });
