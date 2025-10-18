import crypto from "crypto";

const cache = new Map<string, any>();

export function stableHash(payload: Buffer | string | Uint8Array): string {
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload as any);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function remember<T>(key: string, value: T) {
  cache.set(key, value);
}

export function recall<T>(key: string): T | undefined {
  return cache.get(key);
}


