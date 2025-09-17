import 'server-only' let d, b: any = null export async function g e tD b(): Promise < any > { if (!db) { const sqlite3 = (await i mport('sqlite3')).default const { open } = await i mport('sqlite') const path = (await i mport('path')).defaultdb = await o p e n({ f, i, l, e, n, a, m, e: path.j o i n(process.c w d(), 'data', 'keymaker.db'), d, r, i, v, e, r: sqlite3.Database }) } return db
}//This is a workaround for the circular dependency and export issue.
const promised Db = g e tD b()
export { promisedDb as db }
