// @ts-nocheck
import fs from 'fs'
import path from 'path'
export type JournalEvent = Record<string,unknown>
export interface Journal { write(e: JournalEvent): Promise<void> }
export function createNdjsonJournal(filePath: string): Journal {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const stream = fs.createWriteStream(filePath, { flags:'a' })
  return { write(e){ return new Promise((ok,err)=>stream.write(JSON.stringify({ t:Date.now(), ...e })+'\n', x=>x?err(x):ok())) } }
}

