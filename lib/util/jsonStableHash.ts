import { createHash } from 'crypto';

/**
 * Create a stable hash from a transaction message for idempotency
 */
export function jsonStableHash(data: any): string {
  // Serialize deterministically
  const sorted = sortKeys(data);
  const json = JSON.stringify(sorted);
  return createHash('sha256').update(json).digest('hex');
}

/**
 * Sort object keys recursively for deterministic serialization
 */
function sortKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sorted: any = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortKeys(obj[key]);
    });

  return sorted;
}

/**
 * Hash a VersionedTransaction message buffer
 */
export function hashTransactionMessage(messageBuffer: Uint8Array): string {
  return createHash('sha256').update(Buffer.from(messageBuffer)).digest('hex');
}
