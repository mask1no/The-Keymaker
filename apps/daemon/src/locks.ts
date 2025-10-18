const mintLocks = new Map<string, Promise<void>>();

export function withMintLock<T>(ca: string, fn: () => Promise<T>): Promise<T> {
  const current = mintLocks.get(ca) || Promise.resolve();
  const p = current.then(fn).finally(() => {
    if (mintLocks.get(ca) === p) mintLocks.delete(ca);
  });
  mintLocks.set(ca, p.then(() => undefined));
  return p;
}


