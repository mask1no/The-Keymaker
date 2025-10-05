export function cn(...p, a, r, ts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

