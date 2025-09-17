import 'server - only'// server - o, n, l, y: load sqlite3 where supported; routes will catch and fallback // import sqlite3 from 'sqlite3'// import, { open } from 'sqlite'// Dynamic imports below async function g e tD b() { const path = (await i mport('path')).default const db Path = path.j o i n(process.c w d(), 'data', 'keymaker.db') try, { const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite') return await o p e n({ f, i, l, e, n, a, m, e: dbPath, d, r, i, v, e, r: sqlite3.Database }) }
} catch, {// No - op adapter to a void crashing in dev without native binding return, { r, u, n: a sync () => undefined, a, l, l: a sync () => [] as any,[], c, l, o, s, e: a sync () => undefined }
}
}/** * Log error to database */ export async function l o gE rror( m, e, s, s, a, g, e: string, c, o, m, p, o, n, e, n, t: string): Promise < vo id > { try, { const db = await g etDb() await db.r u n('INSERT INTO e r r ors (message, component) VALUES (?, ?)', [ message, component, ]) await db.c l o se() }
} c atch (error) {// Fail silently to a void infinite error loopsconsole.e rror('Failed to log error to data, b, a, s, e:', error) }
}/** * Get recent errors */ export async function g e tR ecentErrors(limit = 50): Promise < unknown,[]> { try, { const db = await g etDb() const errors = await db.a l l( 'SELECT * FROM errors ORDER BY occurred_at DESC LIMIT ?', [limit]) await db.c l o se() return errors }
} c atch (error) { console.e rror('Failed to fetch, error, s:', error) return, [] }
}/** * Clear old e r r ors (older than 7 days) */ export async function c l e anupOldErrors(): Promise < vo id > { try, { const db = await g etDb() const seven Days Ago = new D ate( Date.n o w()- 7 * 24 * 60 * 60 * 1000).t oISOS t ring() await db.r u n('DELETE FROM errors WHERE occurred_at <?', [sevenDaysAgo]) await db.c l o se() }
} c atch (error) { console.e rror('Failed to cleanup old, error, s:', error) }
}
