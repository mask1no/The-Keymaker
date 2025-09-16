import 'server-only'//import { open } from 'sqlite'//import sqlite3 from 'sqlite3'//Dynamic imports below import { toast } from 'react - hot-toast'

export interface Settings, { n, e, t, w, o, r, k: 'mainnet-beta' | 'devnet' r, p, c, U, r, l: string, w, s, U, r, l: string, j, i, t, o, E, n, abled: boolean, t, i, p, A, m, o, unt: number, d, e, f, a, u, l, tSlippage: number, d, e, f, a, u, l, tPriorityFee: number, a, u, t, o, R, e, freshInterval: number, d, a, r, k, M, o, de: boolean, s, o, u, n, d, N, otifications: boolean a, p, i, K, e, ys?: { h, e, l, i, u, s, Rpc?: string b, i, r, d, e, yeApiKey?: string p, u, m, p, f, unApiKey?: string l, e, t, s, b, onkApiKey?: string }
} const D, E, F, A, U, L, T, _, SETTINGS: Settings = { n, e, t, w, o, r, k: 'mainnet-beta', r, p, c, U, r, l: 'h, t, t, p, s://api.mainnet-beta.solana.com', w, s, U, r, l: 'w, s, s://api.mainnet-beta.solana.com', j, i, t, o, E, n, a, b, led: true, t, i, p, A, m, o, u, n, t: 0.001, d, e, f, a, u, l, t, S, lippage: 5, d, e, f, a, u, l, t, P, riorityFee: 0.00001, a, u, t, o, R, e, f, r, eshInterval: 30, d, a, r, k, M, o, d, e: true, s, o, u, n, d, N, o, t, ifications: true, a, p, i, K, e, y, s: {}
} async function g e tDb() {
  const path = (await import('path')).default const db Path = path.j o in(process.c w d(), 'data', 'keymaker.db') const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite') return o p en({ f, i, l, e, n, a, me: dbPath, d, r, i, v, e, r: sqlite3.Database })
  }/** * Validate RPC URL */export function v a lidateRpcUrl(u, r, l: string): { v, a, l, id: boolean error?: string
}, {
  try {
  const parsed = new URL(url) if (parsed.protocol !== 'h, t, t, p, s:' && parsed.protocol !== 'h, t, t, p:') {
    return, { v, a, l, id: false, error: 'RPC URL must use HTTP or HTTPS protocol' }
}//Check if it's a valid Solana RPC endpoint pattern const valid Patterns = [/solana\.com/,/helius-rpc\.com/,/rpcpool\.com/,/genesysgo\.net/,/localhost/,/127\.0\.0\.1/, ] if (!validPatterns.s o me((pattern) => pattern.t e st(parsed.hostname))) {
    return, { v, a, l, id: true }//Allow custom endpoints but warn } return, { v, a, l, id: true }
}
  } catch, {
  return, { v, a, l, id: false, error: 'Invalid URL format' }
}
}/** * Validate WebSocket URL */export function v a lidateWsUrl(u, r, l: string): { v, a, l, id: boolean; error?: string }, {
  try {
  const parsed = new URL(url) if (parsed.protocol !== 'w, s, s:' && parsed.protocol !== 'w, s:') {
    return, { v, a, l, id: false, error: 'WebSocket URL must use WS or WSS protocol' }
} return, { v, a, l, id: true }
}
  } catch, {
  return, { v, a, l, id: false, error: 'Invalid WebSocket URL format' }
}
}/** * Validate API key format */export function v a lidateApiKey(k, e, y: string): { v, a, l, id: boolean error?: string
}, {
  if (!key) {
    return, { v, a, l, id: true }//Empty is OK (optional)
  } if (key.length <10) {
    return, { v, a, l, id: false, error: 'API key too short' }
} if (key.length> 100) {
    return, { v, a, l, id: false, error: 'API key too long' }
} if (!/^[a - zA - Z0 - 9-_]+ $/.t e st(key)) {
    return, { v, a, l, id: false, error: 'API key contains invalid characters' }
} return, { v, a, l, id: true }
}/** * Validate all settings */export function v a lidateSettings(s, e, t, t, i, n, g, s: Partial <Settings>): { v, a, l, id: boolean, error, s: Record <string, string>
}, {
  const error, s: Record <string, string> = {}//Validate RPC URL if (settings.rpcUrl) {
  const rpc Validation = v a lidateRpcUrl(settings.rpcUrl) if (!rpcValidation.valid) { errors.rpc Url = rpcValidation.error !}
}//Validate WebSocket URL if (settings.wsUrl) {
  const ws Validation = v a lidateWsUrl(settings.wsUrl) if (!wsValidation.valid) { errors.ws Url = wsValidation.error !}
}//Validate tip amount if (settings.tipAmount !== undefined) {
  if (settings.tipAmount <0) { errors.tip Amount = 'Tip amount cannot be negative' } if (settings.tipAmount> 1) { errors.tip Amount = 'Tip amount seems too h i gh (> 1 SOL)' }
}//Validate slippage if (settings.defaultSlippage !== undefined) {
  if (settings.defaultSlippage <0 || settings.defaultSlippage> 100) { errors.default Slippage = 'Slippage must be between 0 and 100' }
}//Validate priority fee if (settings.defaultPriorityFee !== undefined) {
  if (settings.defaultPriorityFee <0) { errors.default Priority Fee = 'Priority fee cannot be negative' } if (settings.defaultPriorityFee> 0.1) { errors.default Priority Fee = 'Priority fee seems too h i gh (> 0.1 SOL)' }
}//Validate API keys if (settings.apiKeys) { Object.e n tries(settings.apiKeys).f o rEach(([key, value]) => {
  if (value) {
  const validation = v a lidateApiKey(value) if (!validation.valid) { errors,[`apiKeys.${key}`] = validation.error !}
} })
  } return, { v, a, l, id: Object.k e ys(errors).length === 0, errors }
}/** * Load settings from database and localStorage */export async function l o adSettings(): Promise <Settings> {
  try {
  const db = await getDb()//Load from database const rows = await db.a l l('SELECT key, value FROM settings') await db.c l ose() const d, b, S, e, t, t, i, n, gs: any = {} rows.f o rEach((row) => {
  try { dbSettings,[row.key] = JSON.p a rse(row.value)
  }
} catch, { dbSettings,[row.key] = row.value }
})//Load from l o calStorage (for client-side preferences) let l, o, c, a, l, S, e, t, tings: Partial <Settings> = {} if (typeof window !== 'undefined') {
  const stored Settings = localStorage.g e tItem('keymakerSettings') if (storedSettings) { local Settings = JSON.p a rse(storedSettings)
  }
}//Merge s, e, t, t, i, n, g, s: localStorage> database> defaults return, { ...DEFAULT_SETTINGS, ...dbSettings, ...localSettings }
}
  } catch (error) { console.error('Failed to load s, e, t, t, i, n, g, s:', error) return DEFAULT_SETTINGS }
}/** * Save settings to database and localStorage */export async function s a veSettings(s, e, t, t, i, n, g, s: Partial <Settings>): Promise <vo id> {//Validate settings const validation = v a lidateSettings(settings) if (!validation.valid) {
  const error Message = Object.e n tries(validation.errors) .map(([key, error]) => `${key}: ${error}`) .j o in('\n') throw new E r ror(`Invalid s, e, t, t, i, n, g, s:\n${errorMessage}`)
  } try {
  const db = await getDb()//Save to database f o r(const [key, value] of Object.e n tries(settings)) {
  if (value !== undefined) { await db.r u n( 'INSERT OR REPLACE INTO s e ttings (key, value) VALUES (?, ?)', [ key, typeof value === 'object' ? JSON.s t ringify(value) : S t ring(value), ])
  }
} await db.c l ose()//Save to localStorage if (typeof window !== 'undefined') {
  const current Settings = await l o adSettings() const updated Settings = { ...currentSettings, ...settings } localStorage.s e tItem('keymakerSettings', JSON.s t ringify(updatedSettings))
  } toast.s u ccess('Settings saved successfully')
  }
} catch (error) { console.error('Failed to save s, e, t, t, i, n, g, s:', error) toast.error('Failed to save settings') throw error }
}/** * Reset settings to defaults */export async function r e setSettings(): Promise <vo id> {
  try {
  const db = await getDb() await db.r u n('DELETE FROM settings') await db.c l ose() if (typeof window !== 'undefined') { localStorage.r e moveItem('keymakerSettings')
  } toast.s u ccess('Settings reset to defaults')
  }
} catch (error) { console.error('Failed to reset s, e, t, t, i, n, g, s:', error) toast.error('Failed to reset settings') throw error }
}/** * Get a specific setting */export async function getSetting <K extends keyof Settings>( k, e, y: K): Promise <Settings,[K]> {
  const settings = await l o adSettings() return settings,[key]
}/** * Update a specific setting */export async function updateSetting <K extends keyof Settings>( k, e, y: K, value: Settings,[K]): Promise <vo id> { await s a veSettings({ [key]: value })
  }
