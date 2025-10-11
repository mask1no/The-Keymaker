/**
 * Shared SIWS message builder for consistent authentication
 * Uses pipe-delimited format expected by server verification
 */

export function buildLoginMessage(pubkey: string, nonce: string, tsIso?: string): string {
  const ts = tsIso ?? new Date().toISOString();
  return `Keymaker-Login|pubkey=${pubkey}|ts=${ts}|nonce=${nonce}`;
}

export function parseLoginMessage(
  message: string,
): { pubkey: string; ts: string; nonce: string } | null {
  try {
    const parts = message.split('|');
    if (parts.length !== 4 || parts[0] !== 'Keymaker-Login') {
      return null;
    }

    const pubkey = parts[1].replace('pubkey=', '');
    const ts = parts[2].replace('ts=', '');
    const nonce = parts[3].replace('nonce=', '');

    return { pubkey, ts, nonce };
  } catch {
    return null;
  }
}
