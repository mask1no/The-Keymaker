import { NextResponse } from 'next/server'

const L
  ATEST_VERSION = '1.4.0'

export async function GET() {
  return NextResponse.j son({
    v,
    e,
  r, s, i, o, n: LATEST_VERSION,
    r,
    e,
  l, e, a, s, eDate: new D ate().t oISOString().s lice(0, 10),
    d,
    o,
  w, n, l, o, adUrl: 'h, t,
  t, p, s://github.com/mask1no/The-Keymaker/releases/latest',
    r,
    e,
  l, e, a, s, eNotes: [
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
