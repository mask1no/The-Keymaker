import { open, Database } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'data', 'keymaker.db'),
      driver: sqlite3.Database,
    })
  }
  return db
}
