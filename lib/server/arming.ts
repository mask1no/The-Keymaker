let ARMED_UNTIL = 0;

export function isArmed(): boolean {
  // If KEYMAKER_REQUIRE_ARMING is explicitly set to YES, enforce arming
  // Otherwise, allow operations (removing production blocker)
  if (process.env.KEYMAKER_REQUIRE_ARMING === 'YES') {
    return Date.now() < ARMED_UNTIL;
  }
  // Default: always armed (usable out of the box)
  return true;
}

export function arm(minutes = 15): boolean {
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

// duplicate removed
