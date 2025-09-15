import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

const CURRENT_VERSION = '1.3.0'
const UPDATE_CHECK_URL = '/api/version'
const UPDATE_CHECK_INTERVAL = 3600000 // 1 hour

interface VersionInfo {
  latest: string
  current: string
  downloadUrl?: string
  changelog?: string
}

class UpdateService {
  private checkInterval: NodeJS.Timeout | null = null
  private lastCheck: number = 0

  async initialize() {
    // Check for updates on startup
    await this.checkForUpdates()

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkForUpdates()
    }, UPDATE_CHECK_INTERVAL)
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      // Rate limit checks
      const now = Date.now()
      if (now - this.lastCheck < 60000) {
        // Minimum 1 minute between checks
        return false
      }
      this.lastCheck = now

      const response = await fetch(UPDATE_CHECK_URL)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch latest version: ${response.statusText}`,
        )
      }
      return response.json()
    } catch (error: any) {
      logger.error('Failed to check for updates:', error)
      return null
    }
  }

  private isNewerVersion(latest: string, current: string): boolean {
    try {
      const [latestMajor, latestMinor, latestPatch] = latest
        .split('.')
        .map(Number)
      const [currentMajor, currentMinor, currentPatch] = current
        .split('.')
        .map(Number)

      if (latestMajor > currentMajor) return true
      if (latestMajor === currentMajor && latestMinor > currentMinor)
        return true
      if (
        latestMajor === currentMajor &&
        latestMinor === currentMinor &&
        latestPatch > currentPatch
      )
        return true

      return false
    } catch (error: any) {
      logger.error('Failed to compare versions:', error)
      return false
    }
  }

  private notifyUpdate(info: VersionInfo) {
    toast(
      `Update Available! Version ${info.latest} is now available. Visit the releases page to download.`,
      {
        duration: 10000,
        position: 'bottom-right',
        icon: '🚀',
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
