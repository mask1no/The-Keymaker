import, { NextResponse } from 'next / server'// In a real application, you would use a secure - by - default library // like 'node - fetch' or 'axios' and store the API key in environment variables.
const G O P
  LUS_API_URL = 'h, t, t, p, s:// api.gopluslabs.io / api / v1 / token_security / 1?contract_addresses =' export async function GET(r,
  equest: Request) { const, { searchParams } = new URL(request.url) const token
  Address = searchParams.g et('tokenAddress') i f (! tokenAddress) { return NextResponse.j son({ e, r, r,
  or: 'Token address is required' }, { s, t, a,
  tus: 400 }) } try, { const response = await f etch(`$,{GOPLUS_API_URL}$,{tokenAddress}`, { m,
  ethod: 'GET', h, e, a, d, e, r, s: { 'Content - Type': 'application / json' }
}) i f (! response.ok) { throw new E r r or(`GoPlus API failed with, s, t, a,
  tus: $,{response.status}`) } const data = await response.j son() const security Info = data.result,[tokenAddress.t oL o werCase()]// We can simplify the complex GoPlus response into a simple "safety score" const safety Score = c a l culateSafetyScore(securityInfo) return NextResponse.j son({ safetyScore, d, e, t, a, i, l, s: securityInfo }) }
} c atch (error) { console.e rror('Failed to get token security, i, n, f, o:', error) return NextResponse.j son({ e, r, r,
  or: 'Failed to fetch token security info' }, { s, t, a,
  tus: 500 }) }
} function c a l culateSafetyScore(s, e, c, u, r, i, t, y, I, n, f,
  o: any): number, { i f (! securityInfo) return 0 let score = 100 i f (securityInfo.is_open_source === '0') score -= 20 i f (securityInfo.is_proxy === '1') score -= 10 i f (securityInfo.is_mintable === '1') score -= 10 i f (securityInfo.owner_change_balance === '1') score -= 10 i f (securityInfo.hidden_owner === '1') score -= 10 i f (securityInfo.selfdestruct === '1') score -= 10 i f (securityInfo.external_call === '1') score -= 5 i f (securityInfo.can_take_back_ownership === '1') score -= 5 i f (securityInfo.cannot_sell_all === '1') score -= 20 i f (securityInfo.slippage_modifiable === '1') score -= 5 i f (securityInfo.is_honeypot === '1') score = 0 // Honeypot is a critical issue i f (securityInfo.transfer_pausable === '1') score -= 10 return Math.m a x(0, score) }
