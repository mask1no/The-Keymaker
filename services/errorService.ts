import 'server-only'
// server-only: load sqlite3 where supported; routes will catch and fallback
// import sqlite3 from 'sqlite3'
// import { open } from 'sqlite' // Dynamic imports belowasync function getDb() {
  const path = (await import('path')).defaultconst dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
  try {
    const sqlite3 = (await import('sqlite3')).defaultconst { open } = await import('sqlite')
    return await open({ filename: dbPath, driver: sqlite3.Database })
  } catch {
    // No-op adapter to avoid crashing in dev without native bindingreturn {
      run: async () => undefined,
      all: async () => [] as any[],
      close: async () => undefined,
    }
  }
}

/**
 * Log error to database
 */
export async function logError(
  message: string,
  component: string,
): Promise<void> {
  try {
    const db = await getDb()

    await db.run('INSERT INTO errors (message, component) VALUES (?, ?)', [
      message,
      component,
    ])

    await db.close()
  } catch (error) {
    // Fail silently to avoid infinite error loopsconsole.error('Failed to log error to database:', error)
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
