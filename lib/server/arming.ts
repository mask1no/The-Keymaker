let ARMED_UNTIL = 0;

export function isArmed(): boolean {
  if (process.env.KEYMAKER_ALLOW_LIVE !== 'YES') return false;
  return Date.now() < ARMED_UNTIL;
}

export function arm(minutes = 15): boolean {
  if (process.env.KEYMAKER_ALLOW_LIVE !== 'YES') return false;
  const mins = Math.max(1, Number(minutes) || 15);
  ARMED_UNTIL = Date.now() + mins * 60_000;
  return true;
}

export function disarm(): void {
  ARMED_UNTIL = 0;
}

export function armedUntil(): number {
  return ARMED_UNTIL;
}
