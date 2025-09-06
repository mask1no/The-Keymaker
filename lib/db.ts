// import { open, Database } from 'sqlite'
import 'server-only'
// import path from 'path'

let db: any = null

export async function getDb(): Promise<any> {
  if (!db) {
    const sqlite3 = (await import('sqlite3')).default
    const { open } = await import('sqlite')
    const path = (await import('path')).default
    db = await open({
      filename: path.join(process.cwd(), 'data', 'keymaker.db'),
      driver: sqlite3.Database,
    })
  }
  return db
}
