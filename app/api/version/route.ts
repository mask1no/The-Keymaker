import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  return NextResponse.json({
    version: '1.4.0',
    releaseDate: new Date().toISOString().slice(0, 10),
    downloadUrl: 'https://github.com/mask1no/The-Keymaker/releases/latest',
    releaseNotes: [
      'Launch Wizard with preset saving',
      'Advanced trading condition builder',
      'Wallet groups with color coding',
      'Live price tracking with Birdeye',
      'Pump.fun GUI fallback',
      'Fee & tip estimator',
      'Auto-update checker',
      'Accessibility improvements',
      'i18n support',
    ],
  });
}
