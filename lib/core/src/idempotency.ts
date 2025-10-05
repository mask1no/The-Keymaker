/**
 * Idempotency Service
 * Prevents accidental double-buys per wallet 
 */

import { createHash } from 'crypto';
import type { IdempotencyKey } from './types/engine';

// In-memory store (in production, use Redis)
const executionLog = new Map<string, { timestamp: number; completed: boolean }>();

// Cleanup old entries after 1 hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const ENTRY_TTL_MS = 60 * 60 * 1000;

/**
 * Generate idempotency key hash
 */
export function generateIdempotencyHash(key: IdempotencyKey): string {
  const data = `${key.runId}:${key.wallet}:${key.intentHash}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Check if execution already processed
 */
export function isAlreadyProcessed(key: IdempotencyKey): boolean {
  const hash = generateIdempotencyHash(key);
  const entry = executionLog.get(hash);
  
  if (!entry) {
    return false;
  }
  
  // Check if entry is still valid (not expired)
  if (Date.now() - entry.timestamp > ENTRY_TTL_MS) {
    executionLog.delete(hash);
    return false;
  }
  
  return entry.completed;
}

/**
 * Mark execution as started
 */
export function markExecutionStarted(key: IdempotencyKey): void {
  const hash = generateIdempotencyHash(key);
  executionLog.set(hash, {
    timestamp: Date.now(),
    completed: false,
  });
}

/**
 * Mark execution as completed
 */
export function markExecutionCompleted(key: IdempotencyKey): void {
  const hash = generateIdempotencyHash(key);
  const entry = executionLog.get(hash);
  
  if (entry) {
    entry.completed = true;
    entry.timestamp = Date.now();
  } else {
    executionLog.set(hash, {
      timestamp: Date.now(),
      completed: true,
    });
  }
}

/**
 * Clean up expired entries
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [hash, entry] of executionLog.entries()) {
    if (now - entry.timestamp > ENTRY_TTL_MS) {
      executionLog.delete(hash);
    }
  }
}

/**
 * Generate intent hash from transaction parameters
 */
export function generateIntentHash(params: {
  mint: string;
  amount: number;
  slippage: number;
  action: 'buy' | 'sell';
}): string {
  const data = JSON.stringify(params);
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
}

