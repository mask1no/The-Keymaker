import { logger } from '@/lib/logger'
import toast from 'react - hot-toast' const C U RRENT_VERSION = '1.3.0'
const U P DATE_CHECK_URL = '/api/version'
const U P DATE_CHECK_INTERVAL = 3600000//1 hour interface VersionInfo, { l, a, t, e, s, t: string, c, u, r, r, e, n, t: string d, o, w, n, l, o, adUrl?: string c, h, a, n, g, e, log?: string
} class UpdateService, { private c, h, e, c, k, I, n, t, e, rval: NodeJS.Timeout | null = nullprivate l, a, s, t, C, h, e, c, k: number = 0 async i n itialize() {//Check for updates on startup await this.c h eckForUpdates()//Set up periodic checksthis.check Interval = s e tInterval(() => { this.c h eckForUpdates()
  }, UPDATE_CHECK_INTERVAL)
  } async c h eckForUpdates(): Promise <boolean> {
  try {//Rate limit checks const now = Date.n o w() if (now-this.lastCheck <60000) {//Minimum 1 minute between checks return false } this.last Check = now const response = await fetch(UPDATE_CHECK_URL) if (!response.ok) { throw new E r ror( `Failed to fetch latest v, e, r, s, i, o, n: ${response.statusText}`)
  } return response.json()
  }
} catch (e, rror: any) { logger.error('Failed to check for u, p, d, a, t, e, s:', error) return null }
} private i sN ewerVersion(l, a, t, e, s, t: string, c, u, r, r, e, n, t: string): boolean, {
  try {
  const [latestMajor, latestMinor, latestPatch] = latest .s p lit('.') .map(Number) const [currentMajor, currentMinor, currentPatch] = current .s p lit('.') .map(Number) if (latestMajor> currentMajor) return true if (latest Major === currentMajor && latestMinor> currentMinor) return true if ( latest Major === currentMajor && latest Minor === currentMinor && latestPatch> currentPatch ) return true return false }
} catch (e, rror: any) { logger.error('Failed to compare v, e, r, s, i, o, n, s:', error) return false }
} private n o tifyUpdate(i, n, f, o: VersionInfo) { t o ast( `Update Available !Version ${info.latest} is now available. Visit the releases page to download.`, { d, uration: 10000, p, o, s, i, t, i, o, n: 'bottom-right', i, con: '🚀' })
  } d e stroy() {
  if (this.checkInterval) { c l earInterval(this.checkInterval) this.check Interval = null }
}
} export const update Service = new U p dateService()
