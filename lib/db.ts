import 'server-only'

let dbInstance: any = null

export async function getDb(): Promise<any> {
	if (dbInstance) return dbInstance
	try {
		const sqlite3 = (await import('sqlite3')).default
		const { open } = await import('sqlite')
		const path = (await import('path')).default
		dbInstance = await open({
			filename: path.join(process.cwd(), 'data', 'keymaker.db'),
			driver: sqlite3.Database,
		})
		return dbInstance
	} catch (err) {
		// Fallback to a no-op in-memory adapter to avoid hard crashes in serverless/dev
		const noop = async () => undefined
		const noopAll = async () => [] as any[]
		dbInstance = {
			exec: noop,
			run: noop,
			all: noopAll,
			get: noop,
			close: noop,
		}
		return dbInstance
	}
}

// Export a promise to avoid circular import issues
const promisedDb = getDb()
export { promisedDb as db } 