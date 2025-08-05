/**
 * Auto-lock service that clears sensitive data after a period of inactivity
 */

import { logger } from './logger'

class AutoLockService {
  private lockTimer: NodeJS.Timeout | null = null
  private lastActivity: number = Date.now()
  private lockTimeoutMs: number = 15 * 60 * 1000 // 15 minutes default
  private isLocked: boolean = false
  private eventListeners: Array<(e: Event) => void> = []

  constructor() {
    this.setupActivityListeners()
    this.startLockTimer()
  }

  /**
   * Set the auto-lock timeout in minutes
   */
  setLockTimeout(minutes: number) {
    this.lockTimeoutMs = minutes * 60 * 1000
    this.resetTimer()
    logger.info(`Auto-lock timeout set to ${minutes} minutes`)
  }

  /**
   * Setup activity listeners to detect user interaction
   */
  private setupActivityListeners() {
    if (typeof window === 'undefined') return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    const activityHandler = (_e: Event) => {
      this.onActivity()
    }

    events.forEach(event => {
      window.addEventListener(event, activityHandler, true)
      this.eventListeners.push(activityHandler)
    })
  }

  /**
   * Handle user activity
   */
  private onActivity() {
    if (this.isLocked) return
    
    this.lastActivity = Date.now()
    this.resetTimer()
  }

  /**
   * Start the lock timer
   */
  private startLockTimer() {
    this.lockTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity
      
      if (inactiveTime >= this.lockTimeoutMs && !this.isLocked) {
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
    if (this.isLocked) return

    this.isLocked = true
    logger.warn('Auto-lock activated - clearing sensitive data')

    // Clear AES keys and sensitive data from memory
    this.clearSensitiveData()
    
    // Emit lock event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-locked', { 
        detail: { timestamp: Date.now() } 
      }))
    }
  }

  /**
   * Clear all sensitive data from memory
   */
  private clearSensitiveData() {
    // Clear localStorage sensitive items
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [
        'encryptedWallets',
        'walletGroups',
        'apiKeys',
        'privateKeys',
        'mnemonics',
        'aesKey',
        'iv'
      ]
      
      keysToRemove.forEach(key => {
        window.localStorage.removeItem(key)
      })
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear()
    }

    // Clear any in-memory stores
    if (typeof window !== 'undefined') {
      // Force reload stores to clear state
      (window as any).__keystoreCache = null;
      (window as any).__walletCache = null
    }
  }

  /**
   * Unlock the application (requires re-authentication)
   */
  public unlock() {
    this.isLocked = false
    this.resetTimer()
    logger.info('Application unlocked')
    
    // Emit unlock event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-unlocked', { 
        detail: { timestamp: Date.now() } 
      }))
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

    // Remove event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    this.eventListeners.forEach((handler, index) => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(events[index % events.length], handler, true)
      }
    })
  }
}

// Export singleton instance
export const autoLockService = typeof window !== 'undefined' ? new AutoLockService() : null

export default autoLockService