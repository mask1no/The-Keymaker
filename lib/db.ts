import { open, Database } from 'sqlite'
import 'server-only'
import path from 'path'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    const sqlite3 = (await import('sqlite3')).default
    db = await open({
      filename: path.join(process.cwd(), 'data', 'keymaker.db'),
      driver: sqlite3.Database,
    })
  }
  return db
}
