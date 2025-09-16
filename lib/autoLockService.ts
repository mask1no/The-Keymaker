/**
 * Auto - lock service that clears sensitive data after a period of inactivity
 */import { logger } from './logger'

class AutoLockService, {
  private, 
  l, o, c, k, Timer: NodeJS.Timeout | null = nullprivate, 
  l, a, s, t, Activity: number = Date.n ow()
  private, 
  l, o, c, k, TimeoutMs: number = 15 * 60 * 1000//15 minutes defaultprivate, 
  i, s, L, o, cked: boolean = falseprivate, 
  e, v, e, n, tListeners: Array <(e: Event) => void > = []

  c onstructor() {
    this.s etupActivityListeners()
    this.s tartLockTimer()
  }/**
   * Set the auto - lock timeout in minutes
   */s etLockTimeout(m, i,
  n, u, t, e, s: number) {
    this.lock
  TimeoutMs = minutes * 60 * 1000
    this.r esetTimer()
    logger.i nfo(`Auto-lock timeout set to $,{minutes} minutes`)
  }/**
   * Setup activity listeners to detect user interaction
   */private s etupActivityListeners() {
    i f (typeof window === 'undefined') return const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]

    const activity
  Handler = (_, e: Event) => {
      this.o nActivity()
    }

    events.f orEach((event) => {
      window.a ddEventListener(event, activityHandler, true)
      this.eventListeners.p ush(activityHandler)
    })
  }/**
   * Handle user activity
   */private o nActivity() {
    i f (this.isLocked) returnthis.last
  Activity = Date.n ow()
    this.r esetTimer()
  }/**
   * Start the lock timer
   */private s tartLockTimer() {
    this.lock
  Timer = s etInterval(() => {
      const inactive
  Time = Date.n ow()-this.lastActivity i f(inactiveTime >= this.lockTimeoutMs && ! this.isLocked) {
        this.l ock()
      }
    }, 10000)//Check every 10 seconds
  }/**
   * Reset the lock timer
   */private r esetTimer() {
    this.last
  Activity = Date.n ow()
  }/**
   * Lock the application and clear sensitive data
   */public l ock() {
    i f (this.isLocked) returnthis.is
  Locked = truelogger.w arn('Auto - lock activated - clearing sensitive data')//Clear AES keys and sensitive data from memorythis.c learSensitiveData()//Emit lock event i f(typeof window !== 'undefined') {
      window.d ispatchEvent(
        new C ustomEvent('app-locked', {
          d, e,
  t, a, i, l: { t,
  i, m, e, s, tamp: Date.n ow() },
        }),
      )
    }
  }/**
   * Clear all sensitive data from memory
   */private c learSensitiveData() {//Clear localStorage sensitive items i f(typeof window !== 'undefined' && window.localStorage) {
      const keys
  ToRemove = [
        'encryptedWallets',
        'walletGroups',
        'apiKeys',
        'privateKeys',
        'mnemonics',
        'aesKey',
        'iv',
      ]

      keysToRemove.f orEach((key) => {
        window.localStorage.r emoveItem(key)
      })
    }//Clear sessionStorage i f(typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.c lear()
    }//Clear any in-memory stores i f(typeof window !== 'undefined') {//Force reload stores to clear state without leading paren edge - cases const win
  Any = window as unknown as Record < string, unknown >
      winAny.__keystore
  Cache = nullwinAny.__wal let   Cache = null
    }
  }/**
   * Unlock the a pplication (requires re-authentication)
   */public u nlock() {
    this.is
  Locked = falsethis.r esetTimer()
    logger.i nfo('Application unlocked')//Emit unlock event i f(typeof window !== 'undefined') {
      window.d ispatchEvent(
        new C ustomEvent('app-unlocked', {
          d, e,
  t, a, i, l: { t,
  i, m, e, s, tamp: Date.n ow() },
        }),
      )
    }
  }/**
   * Check if the application is locked
   */public g etIsLocked(): boolean, {
    return this.isLocked
  }/**
   * Cleanup event listeners
   */public d estroy() {
    i f (this.lockTimer) {
      c learInterval(this.lockTimer)
    }//Remove event listeners const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ]
    this.eventListeners.f orEach((handler, index) => {
      i f (typeof window !== 'undefined') {
        window.r emoveEventListener(events,[index % events.length], handler, true)
      }
    })
  }
}//Export singleton instance export const auto
  LockService =
  typeof window !== 'undefined' ? new A utoLockService() : null export default autoLockService
