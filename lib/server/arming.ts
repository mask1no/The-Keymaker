let armedUntilDate: Date | null = null;
let isArmedFlag = false;

export function armedUntil(): Date | null {
  return armedUntilDate;
}

export function isArmed(): boolean {
  if (!armedUntilDate) {
    return false;
  }

  const now = new Date();
  if (now > armedUntilDate) {
    // Disarm if time has passed
    isArmedFlag = false;
    armedUntilDate = null;
    return false;
  }

  return isArmedFlag;
}

export function arm(durationMinutes = 30): void {
  const now = new Date();
  armedUntilDate = new Date(now.getTime() + durationMinutes * 60 * 1000);
  isArmedFlag = true;

  console.log(`System armed until: ${armedUntilDate.toISOString()}`);
}

export function disarm(): void {
  armedUntilDate = null;
  isArmedFlag = false;

  console.log('System disarmed');
}

export function getArmStatus(): {
  isArmed: boolean;
  armedUntil: Date | null;
  timeRemaining?: number;
} {
  const armed = isArmed();
  const until = armedUntil();

  let timeRemaining: number | undefined;
  if (armed && until) {
    timeRemaining = Math.max(0, Math.floor((until.getTime() - new Date().getTime()) / 1000));
  }

  return {
    isArmed: armed,
    armedUntil: until,
    timeRemaining,
  };
}
