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

export function setActiveGroupId(id: string) {
  try {
    cookies().set(ACTIVE_GROUP_COOKIE, id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  } catch {
    // ignore
  }
}


