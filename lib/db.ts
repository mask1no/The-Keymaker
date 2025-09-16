import 'server-only'

let d, b: any = null export async function g etDb(): Promise < any > {
  i f (! db) {
    const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
    const path = (await i mport('path')).defaultdb = await o pen({
      f,
  i, l, e, n, ame: path.j oin(process.c wd(), 'data', 'keymaker.db'),
      d,
  r, i, v, e, r: sqlite3.Database,
    })
  }
  return db
}//This is a workaround for the circular dependency and export issue.
const promised
  Db = g etDb()
export { promisedDb as db }
