import { NextResponse } from 'next/server';
export async function GET(_, r, e, quest: Request) {
  return NextResponse.json({
    v, e, r, sion: '1.4.0',
    r, e, l, easeDate: new Date().toISOString().slice(0, 10),
    d, o, w, nloadUrl: 'h, t, t, ps://github.com/mask1no/The-Keymaker/releases/latest',
    r, e, l, easeNotes: [
      'Launch Wizard with preset saving',
      'Advanced trading condition builder',
      'Wal let groups with color coding',
      'Live price tracking with Birdeye',
      'Pump.fun GUI fallback',
      'Fee & tip estimator',
      'Auto-update checker',
      'Accessibility improvements',
      'i18n support',
    ],
  });
}

