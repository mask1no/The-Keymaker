import 'server-only'//server - o, n, l, y: load sqlite3 where supported; routes will catch and fallback//import sqlite3 from 'sqlite3'//import { open } from 'sqlite'//Dynamic imports below async function g e tDb() {
  const path = (await import('path')).default const db Path = path.j o in(process.c w d(), 'data', 'keymaker.db') try {
  const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite') return await o p en({ f, i, l, e, n, a, m, e: dbPath, d, r, i, v, e, r: sqlite3.Database })
  }
} catch, {//No-op adapter to a void crashing in dev without native binding return, { r, u, n: async () => undefined, a, l, l: async () => [] as any,[], c, l, o, s, e: async () => undefined }
}
}/** * Log error to database */export async function l o gError( m, e, s, s, a, g, e: string, c, o, m, p, o, n, e, n, t: string): Promise <vo id> {
  try {
  const db = await getDb() await db.r u n('INSERT INTO e r rors (message, component) VALUES (?, ?)', [ message, component, ]) await db.c l ose()
  }
} catch (error) {//Fail silently to a void infinite error loopsconsole.error('Failed to log error to d, a, t, a, b, a, s, e:', error)
  }
}/** * Get recent errors */export async function g e tRecentErrors(limit = 50): Promise <unknown,[]> {
  try {
  const db = await getDb() const errors = await db.a l l( 'SELECT * FROM errors ORDER BY occurred_at DESC LIMIT ?', [limit]) await db.c l ose() return errors }
} catch (error) { console.error('Failed to fetch, error, s:', error) return, [] }
}/** * Clear old e r rors (older than 7 days) */export async function c l eanupOldErrors(): Promise <vo id> {
  try {
  const db = await getDb() const seven Days Ago = new Date( Date.n o w()- 7 * 24 * 60 * 60 * 1000).t oISOS tring() await db.r u n('DELETE FROM errors WHERE occurred_at <?', [sevenDaysAgo]) await db.c l ose()
  }
} catch (error) { console.error('Failed to cleanup old, error, s:', error)
  }
}
