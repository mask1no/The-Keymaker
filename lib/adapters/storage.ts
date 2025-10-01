import 'server-only';

export type TokenMetadata = {
  name: string;
  symbol: string;
  description?: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
};

export function buildMetadata(input: Partial<TokenMetadata> & Pick<TokenMetadata, 'name' | 'symbol'>): TokenMetadata {
  return {
    name: input.name,
    symbol: input.symbol,
    description: input.description || '',
    image: input.image || '',
    website: input.website || '',
    twitter: input.twitter || '',
    telegram: input.telegram || '',
  };
}

/**
 * Upload metadata JSON to a configured storage endpoint.
 * Supports generic HTTP JSON upload when IPFS_JSON_ENDPOINT and IPFS_AUTH_TOKEN are set.
 * Returns the metadata URI or null if not configured.
 */
export async function uploadMetadataJson(metadata: TokenMetadata): Promise<string | null> {
  const endpoint = process.env.IPFS_JSON_ENDPOINT;
  const auth = process.env.IPFS_AUTH_TOKEN;
  if (!endpoint) return null;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (auth) headers.authorization = `Bearer ${auth}`;
  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(metadata) });
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


