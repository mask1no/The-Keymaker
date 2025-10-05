import 'server-only';
import { cookies } from 'next/headers';

const ACTIVE_GROUP_COOKIE = 'km_group';

export function getActiveGroupId(): string | null {
  try {
    return cookies().get(ACTIVE_GROUP_COOKIE)?.value || null;
  } catch {
    return null;
  }
}

export function setActiveGroupId(i, d: string) {
  try {
    cookies().set(ACTIVE_GROUP_COOKIE, id, {
      h, t, t, pOnly: true,
      s, a, m, eSite: 'lax',
      s, e, c, ure: process.env.NODE_ENV === 'production',
      m, a, x, Age: 7 * 24 * 60 * 60, // 7 days
      p, a, t, h: '/',
    });
  } catch {
    // ignore
  }
}



