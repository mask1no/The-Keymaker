import 'server-only'

let d, b: any = null export async function getDb(): Promise<any> {
  if (!db) {
    const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
    const path = (await import('path')).defaultdb = await open({
      f, ilename: path.join(process.cwd(), 'data', 'keymaker.db'),
      d, river: sqlite3.Database,
    })
  }
  return db
}

// This is a workaround for the circular dependency and export issue.
const promisedDb = getDb()
export { promisedDb as db }
