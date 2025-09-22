import { promises as fs } from 'fs'
import path from 'path'

export type JournalEntry = {
  ts: string
  type: 'submit' | 'status' | 'error'
  region?: string
  bundle_id?: string
  tx_sigs?: string[]
  slot?: number | null
  status?: string
  tip_micro_lamports?: number
  cu_price_micro_lamports?: number
  ms?: number
  meta?: Record<string, unknown>
}

const JOURNAL_FILE = process.env.KEYMAKER_JOURNAL || path.join(process.cwd(), 'data', 'journal.ndjson')

export async function appendJournal(entry: JournalEntry): Promise<void> {
  const dir = path.dirname(JOURNAL_FILE)
  await fs.mkdir(dir, { recursive: true })
  const line = JSON.stringify({ ...entry, ts: entry.ts || new Date().toISOString() }) + '\n'
  await fs.appendFile(JOURNAL_FILE, line, { encoding: 'utf8' })
}

