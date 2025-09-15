import 'server-only'

let db: any = nullexport async function getDb(): Promise<any> {
  if (!db) {
    const sqlite3 = (await import('sqlite3')).defaultconst { open } = await import('sqlite')
    const path = (await import('path')).defaultdb = await open({
      filename: path.join(process.cwd(), 'data', 'keymaker.db'),
      driver: sqlite3.Database,
    })
  }
  return db
}

// This is a workaround for the circular dependency and export issue.
const promisedDb = getDb()
export { promisedDb as db }
