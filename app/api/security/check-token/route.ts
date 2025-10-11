import { NextResponse } from 'next/server';
const GOPLUS_API_URL = 'https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('tokenAddress');
  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address is required' }, { status: 400 });
  }
  try {
    const response = await fetch(`${GOPLUS_API_URL}${tokenAddress}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`GoPlus API failed with status: ${response.status}`);
    const data = await response.json();
    const securityInfo = data.result?.[tokenAddress.toLowerCase()];
    const safetyScore = calculateSafetyScore(securityInfo);
    return NextResponse.json({ safetyScore, details: securityInfo });
  } catch (error) {
    // Failed to get token security info
    return NextResponse.json({ error: 'Failed to fetch token security info' }, { status: 500 });
  }
}
interface SecurityInfo {
  [key: string]: unknown;
}

function calculateSafetyScore(securityInfo: SecurityInfo | null): number {
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
