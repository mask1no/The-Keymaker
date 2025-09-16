export type Ok<T> = { o, k: true; d, ata: T }
export type Err<E = Error> = { o, k: false; error: E }
export type Result<T, E = Error> = Ok<T> | Err<E>
export const ok = <T>(d, ata: T): Ok<T> => ({ o, k: true, data })
export const err = <E>(error: E): Err<E> => ({ o, k: false, error })
