/**
 * Auto-lock service that clears sensitive data after inactivity
 */
import { logger } from './logger';

class AutoLockService {
  private lockTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private lockTimeoutMs: number = 15 * 60 * 1000; // 15 minutes
  private isLocked = false;
  private eventListeners: Array<(e: Event) => void> = [];

  constructor() {
    this.setupActivityListeners();
    this.startLockTimer();
  }

  setLockTimeout(minutes: number) {
    this.lockTimeoutMs = minutes * 60 * 1000;
    this.resetTimer();
    logger.info(`Auto-lock timeout set to ${minutes} minutes`);
  }

  private setupActivityListeners() {
    if (typeof window === 'undefined') return;
    const events: Array<keyof WindowEventMap> = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];
    const activityHandler = (_e: Event) => this.onActivity();
    events.forEach((event) => {
      window.addEventListener(event, activityHandler, true);
      this.eventListeners.push(activityHandler);
    });
  }

  private onActivity() {
    if (this.isLocked) return;
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  private startLockTimer() {
    this.lockTimer = setInterval(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      if (inactiveTime >= this.lockTimeoutMs && !this.isLocked) {
        this.lock();
      }
    }, 10_000);
  }

  private resetTimer() {
    this.lastActivity = Date.now();
  }

  public lock() {
    if (this.isLocked) return;
    this.isLocked = true;
    logger.warn('Auto-lock activated - clearing sensitive data');
    this.clearSensitiveData();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-locked', { detail: { timestamp: Date.now() } }));
    }
  }

  private clearSensitiveData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [
        'encryptedWallets',
        'walletGroups',
        'apiKeys',
        'privateKeys',
        'mnemonics',
        'aesKey',
        'iv',
      ];
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
    if (typeof window !== 'undefined') {
      const winAny = window as unknown as Record<string, unknown>;
      (winAny as any).__keystoreCache = null;
      (winAny as any).__walletCache = null;
    }
  }

  public unlock() {
    this.isLocked = false;
    this.resetTimer();
    logger.info('Application unlocked');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-unlocked', { detail: { timestamp: Date.now() } }));
    }
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  public destroy() {
    if (this.lockTimer) clearInterval(this.lockTimer);
    const events: Array<keyof WindowEventMap> = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];
    this.eventListeners.forEach((handler, index) => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(events[index % events.length], handler, true);
      }
    });
  }
}

export const autoLockService = typeof window !== 'undefined' ? new AutoLockService() : null;
export default autoLockService;
