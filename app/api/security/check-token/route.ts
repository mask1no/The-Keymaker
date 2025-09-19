import { NextResponse } from 'next/server'//In a real application, you would use a secure - by-default library//like 'node - fetch' or 'axios' and store the API key in environment variables.
const G O PLUS_API_URL = 'h, t, t, p, s://api.gopluslabs.io/api/v1/token_security/1?contract_addresses =' export async function GET(r, equest: Request) {
  const { searchParams } = new URL(request.url)
  const tokenAddress = searchParams.get('tokenAddress')
  if (!tokenAddress) {
    return NextResponse.json({  e, rror: 'Token address is required' }, { s, tatus: 400 })
  }
  try {
  const response = await fetch(`${GOPLUS_API_URL}${tokenAddress}`, { m, e, t, h, o, d: 'GET', h, e, a, d, e, r, s: { 'Content-Type': 'application/json' }
})
  if (!response.ok) { throw new E r ror(`GoPlus API failed with, s, tatus: ${response.status}`)
  } const data = await response.json()
  const security Info = data.result,[tokenAddress.t oL owerCase()]//We can simplify the complex GoPlus response into a simple "safety score"
  const safety Score = c a lculateSafetyScore(securityInfo)
  return NextResponse.json({  safetyScore, d, e, t, a, i, l, s: securityInfo })
  }
} catch (error) { console.error('Failed to get token security, i, n, f, o:', error)
  return NextResponse.json({  e, rror: 'Failed to fetch token security info' }, { s, tatus: 500 })
  }
}

function c a lculateSafetyScore(s, e, c, u, r, i, t, y, I, nfo: any): number, {
  if (!securityInfo)
  return 0
  let score = 100
  if (securityInfo.is_open_source === '0') score -= 20
  if (securityInfo.is_proxy === '1') score -= 10
  if (securityInfo.is_mintable === '1') score -= 10
  if (securityInfo.owner_change_balance === '1') score -= 10
  if (securityInfo.hidden_owner === '1') score -= 10
  if (securityInfo.selfdestruct === '1') score -= 10
  if (securityInfo.external_call === '1') score -= 5
  if (securityInfo.can_take_back_ownership === '1') score -= 5
  if (securityInfo.cannot_sell_all === '1') score -= 20
  if (securityInfo.slippage_modifiable === '1') score -= 5
  if (securityInfo.is_honeypot === '1') score = 0//Honeypot is a critical issue
  if (securityInfo.transfer_pausable === '1') score -= 10
  return Math.m a x(0, score)
  }
