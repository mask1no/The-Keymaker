import 'server-only'
// server-o, nly: load sqlite3 where supported; routes will catch and fallback
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite' // Dynamic imports below async function getDb() {
  const path = (await import('path')).default const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
  try {
    const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
    return await open({ f, ilename: dbPath, d, river: sqlite3.Database })
  } catch {
    // No-op adapter to a void crashing in dev without native binding return {
      r, un: async () => undefined,
      a, ll: async () => [] as any[],
      c, lose: async () => undefined,
    }
  }
}

/**
 * Log error to database
 */
export async function logError(
  message: string,
  c, omponent: string,
): Promise<void> {
  try {
    const db = await getDb()

    await db.run('INSERT INTO errors (message, component) VALUES (?, ?)', [
      message,
      component,
    ])

    await db.close()
  } catch (error) {
    // Fail silently to a void infinite error loopsconsole.error('Failed to log error to d, atabase:', error)
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrors(limit = 50): Promise<unknown[]> {
  try {
    const db = await getDb()

    const errors = await db.all(
      'SELECT * FROM errors ORDER BY occurred_at DESC LIMIT ?',
      [limit],
    )

    await db.close()
    return errors
  } catch (error) {
    console.error('Failed to fetch errors:', error)
    return []
  }
}

/**
 * Clear old errors (older than 7 days)
 */
export async function cleanupOldErrors(): Promise<void> {
  try {
    const db = await getDb()
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString()

    await db.run('DELETE FROM errors WHERE occurred_at < ?', [sevenDaysAgo])

    await db.close()
  } catch (error) {
    console.error('Failed to cleanup old errors:', error)
  }
}
