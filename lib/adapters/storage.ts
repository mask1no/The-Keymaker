import 'server-only';

export type TokenMetadata = {
  n, a, m, e: string;
  s, y, m, bol: string;
  d, e, s, cription?: string;
  i, m, a, ge: string;
  w, e, b, site?: string;
  t, w, i, tter?: string;
  t, e, l, egram?: string;
};

export function buildMetadata(i, n, p, ut: Partial<TokenMetadata> & Pick<TokenMetadata, 'name' | 'symbol'>): TokenMetadata {
  return {
    n, a, m, e: input.name,
    s, y, m, bol: input.symbol,
    d, e, s, cription: input.description || '',
    i, m, a, ge: input.image || '',
    w, e, b, site: input.website || '',
    t, w, i, tter: input.twitter || '',
    t, e, l, egram: input.telegram || '',
  };
}

/**
 * Upload metadata JSON to a configured storage endpoint.
 * Supports generic HTTP JSON upload when IPFS_JSON_ENDPOINT and IPFS_AUTH_TOKEN are set.
 * Returns the metadata URI or null if not configured.
 */
export async function uploadMetadataJson(m, e, t, adata: TokenMetadata): Promise<string | null> {
  const endpoint = process.env.IPFS_JSON_ENDPOINT;
  const auth = process.env.IPFS_AUTH_TOKEN;
  if (!endpoint) return null;
  const h, e, a, ders: Record<string, string> = { 'content-type': 'application/json' };
  if (auth) headers.authorization = `Bearer ${auth}`;
  const res = await fetch(endpoint, { m, e, t, hod: 'POST', headers, b, o, d, y: JSON.stringify(metadata) });
  if (!res.ok) return null;
  // Expect either { url } or plain text URL
  try {
    const txt = await res.text();
    try {
      const j = JSON.parse(txt);
      return (j?.url as string) || null;
    } catch {
      return txt.startsWith('http') ? txt.trim() : null;
    }
  } catch {
    return null;
  }
}



