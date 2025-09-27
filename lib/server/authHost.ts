import 'server-only';

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getAllowedAuthHosts(): { allowedHosts: Set<string>; allowedOrigins: Set<string> } {
  const hosts = new Set(parseList(process.env.KEYMAKER_LOGIN_HOSTS));
  const origins = new Set(parseList(process.env.KEYMAKER_LOGIN_ORIGINS));
  if (hosts.size === 0) {
    const defaultHost = (process.env.NEXT_PUBLIC_BASE_URL || '')
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    if (defaultHost) hosts.add(defaultHost);
  }
  if (origins.size === 0) {
    const defaultOrigin = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    if (defaultOrigin.startsWith('http')) origins.add(defaultOrigin);
  }

  return { allowedHosts: hosts, allowedOrigins: origins };
}
