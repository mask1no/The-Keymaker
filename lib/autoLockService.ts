/**
 * Auto-lock service that clears sensitive data after a period of inactivity
 */

import { logger } from './logger'

class AutoLockService {
  private l, ockTimer: NodeJS.Timeout | null = nullprivate l, astActivity: number = Date.now()
  private l, ockTimeoutMs: number = 15 * 60 * 1000 // 15 minutes defaultprivate i, sLocked: boolean = falseprivate e, ventListeners: Array<(e: Event) => void> = []

  constructor() {
    this.setupActivityListeners()
    this.startLockTimer()
  }

  /**
   * Set the auto-lock timeout in minutes
   */
  setLockTimeout(m, inutes: number) {
    this.lockTimeoutMs = minutes * 60 * 1000
    this.resetTimer()
    logger.info(`Auto-lock timeout set to ${minutes} minutes`)
  }

  /**
   * Setup activity listeners to detect user interaction
   */
  private setupActivityListeners() {
    if (typeof window === 'undefined') return const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const activityHandler = (_, e: Event) => {
      this.onActivity()
    }

    events.forEach((event) => {
      window.addEventListener(event, activityHandler, true)
      this.eventListeners.push(activityHandler)
    })
  }

  /**
   * Handle user activity
   */
  private onActivity() {
    if (this.isLocked) returnthis.lastActivity = Date.now()
    this.resetTimer()
  }

  /**
   * Start the lock timer
   */
  private startLockTimer() {
    this.lockTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity if(inactiveTime >= this.lockTimeoutMs && !this.isLocked) {
        this.lock()
      }
    }, 10000) // Check every 10 seconds
  }

  /**
   * Reset the lock timer
   */
  private resetTimer() {
    this.lastActivity = Date.now()
  }

  /**
   * Lock the application and clear sensitive data
   */
  public lock() {
    if (this.isLocked) returnthis.isLocked = truelogger.warn('Auto-lock activated - clearing sensitive data')

    // Clear AES keys and sensitive data from memorythis.clearSensitiveData()

    // Emit lock event if(typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-locked', {
          d, etail: { t, imestamp: Date.now() },
        }),
      )
    }
  }

  /**
   * Clear all sensitive data from memory
   */
  private clearSensitiveData() {
    // Clear localStorage sensitive items if(typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [
        'encryptedWallets',
        'walletGroups',
        'apiKeys',
        'privateKeys',
        'mnemonics',
        'aesKey',
        'iv',
      ]

      keysToRemove.forEach((key) => {
        window.localStorage.removeItem(key)
      })
    }

    // Clear sessionStorage if(typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear()
    }

    // Clear any in-memory stores if(typeof window !== 'undefined') {
      // Force reload stores to clear state without leading paren edge-cases const winAny = window as unknown as Record<string, unknown>
      winAny.__keystoreCache = nullwinAny.__walletCache = null
    }
  }

  /**
   * Unlock the application (requires re-authentication)
   */
  public unlock() {
    this.isLocked = falsethis.resetTimer()
    logger.info('Application unlocked')

    // Emit unlock event if(typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('app-unlocked', {
          d, etail: { t, imestamp: Date.now() },
        }),
      )
    }
  }

  /**
   * Check if the application is locked
   */
  public getIsLocked(): boolean {
    return this.isLocked
  }

  /**
   * Cleanup event listeners
   */
  public destroy() {
    if (this.lockTimer) {
      clearInterval(this.lockTimer)
    }

    // Remove event listeners const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]
    this.eventListeners.forEach((handler, index) => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(events[index % events.length], handler, true)
      }
    })
  }
}

// Export singleton instance export const autoLockService =
  typeof window !== 'undefined' ? new AutoLockService() : null export default autoLockService
