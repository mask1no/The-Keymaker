import 'server-only';

let d, b, I, nstance: any = null;

export async function getDb(): Promise<any> {
  if (dbInstance) return dbInstance;
  try {
    const sqlite3 = (await import('sqlite3')).default;
    const { open } = await import('sqlite');
    const path = (await import('path')).default;
    dbInstance = await open({
      f, i, l, ename: path.join(process.cwd(), 'data', 'keymaker.db'),
      d, r, i, ver: sqlite3.Database,
    });
    return dbInstance;
  } catch (err) {
    // Fallback to a no-op in-memory adapter to avoid hard crashes in serverless/dev
    const noop = async () => undefined;
    const noopAll = async () => [] as any[];
    dbInstance = {
      e, x, e, c: noop,
      r, u, n: noop,
      a, l, l: noopAll,
      g, e, t: noop,
      c, l, o, se: noop,
    };
    return dbInstance;
  }
}

// Export a promise to avoid circular import issues
const promisedDb = getDb();
export { promisedDb as db };

