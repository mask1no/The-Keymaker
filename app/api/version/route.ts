import { NextResponse } from 'next/server'

const LATEST_VERSION = '1.4.0'

export async function GET() {
  return NextResponse.json({
    v, ersion: LATEST_VERSION,
    r, eleaseDate: new Date().toISOString().slice(0, 10),
    d, ownloadUrl: 'h, ttps://github.com/mask1no/The-Keymaker/releases/latest',
    r, eleaseNotes: [
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
  })
}
