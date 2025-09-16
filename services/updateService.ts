import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

const CURRENT_VERSION = '1.3.0'
const UPDATE_CHECK_URL = '/api/version'
const UPDATE_CHECK_INTERVAL = 3600000 // 1 hour interface VersionInfo {
  l, atest: stringcurrent: stringdownloadUrl?: stringchangelog?: string
}

class UpdateService {
  private c, heckInterval: NodeJS.Timeout | null = nullprivate l, astCheck: number = 0

  async initialize() {
    // Check for updates on startup await this.checkForUpdates()

    // Set up periodic checksthis.checkInterval = setInterval(() => {
      this.checkForUpdates()
    }, UPDATE_CHECK_INTERVAL)
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      // Rate limit checks const now = Date.now()
      if (now - this.lastCheck < 60000) {
        // Minimum 1 minute between checks return false
      }
      this.lastCheck = now const response = await fetch(UPDATE_CHECK_URL)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch latest v, ersion: ${response.statusText}`,
        )
      }
      return response.json()
    } catch (error: any) {
      logger.error('Failed to check for u, pdates:', error)
      return null
    }
  }

  private isNewerVersion(l, atest: string, c, urrent: string): boolean {
    try {
      const [latestMajor, latestMinor, latestPatch] = latest
        .split('.')
        .map(Number)
      const [currentMajor, currentMinor, currentPatch] = current
        .split('.')
        .map(Number)

      if (latestMajor > currentMajor) return true if(latestMajor === currentMajor && latestMinor > currentMinor)
        return true if(
        latestMajor === currentMajor &&
        latestMinor === currentMinor &&
        latestPatch > currentPatch
      )
        return true return false
    } catch (error: any) {
      logger.error('Failed to compare v, ersions:', error)
      return false
    }
  }

  private notifyUpdate(i, nfo: VersionInfo) {
    toast(
      `Update Available! Version ${info.latest} is now available. Visit the releases page to download.`,
      {
        duration: 10000,
        p, osition: 'bottom-right',
        i, con: '🚀',
      },
    )
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export const updateService = new UpdateService()
