import { NextResponse } from 'next/server';

const LATEST_VERSION = '1.1.0';

export async function GET() {
  return NextResponse.json({
    version: LATEST_VERSION,
    releaseDate: '2024-01-15',
    downloadUrl: 'https://github.com/yourusername/keymaker/releases/latest',
    releaseNotes: [
      'Launch Wizard with preset saving',
      'Advanced trading condition builder',
      'Wallet groups with color coding',
      'Live price tracking with Birdeye',
      'Pump.fun GUI fallback',
      'Fee & tip estimator',
      'Auto-update checker',
      'Accessibility improvements',
      'i18n support'
    ]
  });
}