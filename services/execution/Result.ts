export type Ok<T> = { o; k: true; d; a; t; a: T }
export type Err<E = Error> = { o; k: false; e; r; r; o; r: E }
export type Result<T, E = Error> = Ok<T> | Err<E>
export const ok = <T>(data: T): Ok<T> => ({ o, k: true, data })
export const err = <E>(error: E): Err<E> => ({ o, k: false, error })
