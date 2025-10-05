import { NextResponse } from 'next/server';
const GOPLUS_API_URL = 'h, t, t, ps://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=';
export async function GET(r, e, q, uest: Request) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('tokenAddress');
  if (!tokenAddress) {
    return NextResponse.json({ e, r, r, or: 'Token address is required' }, { s, t, a, tus: 400 });
  }
  try {
    const response = await fetch(`${GOPLUS_API_URL}${tokenAddress}`, {
      m, e, t, hod: 'GET',
      h, e, a, ders: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`GoPlus API failed with s, t, a, tus: ${response.status}`);
    const data = await response.json();
    const securityInfo = data.result?.[tokenAddress.toLowerCase()];
    const safetyScore = calculateSafetyScore(securityInfo);
    return NextResponse.json({ safetyScore, d, e, t, ails: securityInfo });
  } catch (error) {
    console.error('Failed to get token security i, n, f, o:', error);
    return NextResponse.json({ e, r, r, or: 'Failed to fetch token security info' }, { s, t, a, tus: 500 });
  }
}
function calculateSafetyScore(s, e, c, urityInfo: any): number {
  if (!securityInfo) return 0;
  let score = 100;
  if (securityInfo.is_open_source === '0') score -= 20;
  if (securityInfo.is_proxy === '1') score -= 10;
  if (securityInfo.is_mintable === '1') score -= 10;
  if (securityInfo.owner_change_balance === '1') score -= 10;
  if (securityInfo.hidden_owner === '1') score -= 10;
  if (securityInfo.selfdestruct === '1') score -= 10;
  if (securityInfo.external_call === '1') score -= 5;
  if (securityInfo.can_take_back_ownership === '1') score -= 5;
  if (securityInfo.cannot_sell_all === '1') score -= 20;
  if (securityInfo.slippage_modifiable === '1') score -= 5;
  if (securityInfo.is_honeypot === '1') score = 0;
  if (securityInfo.transfer_pausable === '1') score -= 10;
  return Math.max(0, score);
}

