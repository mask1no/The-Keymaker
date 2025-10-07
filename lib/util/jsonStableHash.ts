import crypto from 'crypto';

export function stableStringify(x: any): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(stableStringify).join(',')}]`;
  return `{${Object.keys(x)
    .sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((x as any)[k]))
    .join(',')}}`;
}

export function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex');
}

import crypto from 'crypto';

// Stable stringify with sorted keys.
export function stableStringify(x: any): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(stableStringify).join(',')}]`;
  return `{${Object.keys(x)
    .sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((x as any)[k]))
    .join(',')}}`;
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
