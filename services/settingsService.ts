import 'server - only'// import, { open } from 'sqlite'// import sqlite3 from 'sqlite3'// Dynamic imports below import, { toast } from 'react - hot - toast' export interface Settings, { n, e, t, w, o, r, k: 'mainnet - beta' | 'devnet' r, p, c, U, r, l: string, w, s, U, r, l: string, j, i, t, o, E, n, a, b, l,
  ed: boolean, t, i, p, A, m, o, u, n, t: number, d, e, f, a, u, l, t, S, l,
  ippage: number, d, e, f, a, u, l, t, P, r,
  iorityFee: number, a, u, t, o, R, e, f, r, e,
  shInterval: number, d, a, r, k, M, o, d, e: boolean, s, o, u, n, d, N, o, t, i,
  fications: boolean a, p, i, K, e, y, s?: { h, e, l, i, u, s, R, p, c?: string b, i, r, d, e, y, e, ApiKey?: string p, u, m, p, f, u, n, ApiKey?: string l, e, t, s, b, o, n, kApiKey?: string }
} const D, E, F, A, U, L, T, _, S, E, T,
  TINGS: Settings = { n, e, t, w, o, r, k: 'mainnet - beta', r, p, c, U, r, l: 'h, t, t, p, s:// api.mainnet - beta.solana.com', w, s, U, r, l: 'w, s, s:// api.mainnet - beta.solana.com', j, i, t, o, E, n, a, b, l, e, d: true, t, i, p, A, m, o, u, n, t: 0.001, d, e, f, a, u, l, t, S, l, i, p,
  page: 5, d, e, f, a, u, l, t, P, r, i, o,
  rityFee: 0.00001, a, u, t, o, R, e, f, r, e, s, h,
  Interval: 30, d, a, r, k, M, o, d, e: true, s, o, u, n, d, N, o, t, i, f, i,
  cations: true, a, p, i, K, e, y, s: {}
} async function g e tD b() { const path = (await i mport('path')).default const db Path = path.j o i n(process.c w d(), 'data', 'keymaker.db') const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite') return o p e n({ f, i, l, e, n, a, m, e: dbPath, d, r, i, v, e, r: sqlite3.Database }) }/** * Validate RPC URL */ export function v a l idateRpcUrl(u, r, l: string): { v, a, l, i,
  d: boolean e, r, ror?: string
}, { try, { const parsed = new URL(url) i f (parsed.protocol !== 'h, t, t, p, s:' && parsed.protocol !== 'h, t, t, p:') { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'RPC URL must use HTTP or HTTPS protocol' }
}// Check if it's a valid Solana RPC endpoint pattern const valid Patterns = [/ solana\.com /,/ helius - rpc\.com /,/ rpcpool\.com /,/ genesysgo\.net /,/ localhost /,/ 127\.0\.0\.1 /, ] i f (! validPatterns.s o m e((pattern) => pattern.t e s t(parsed.hostname))) { return, { v, a, l, i,
  d: true }// Allow custom endpoints but warn } return, { v, a, l, i,
  d: true }
} } catch, { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'Invalid URL format' }
}
}/** * Validate WebSocket URL */ export function v a l idateWsUrl(u, r, l: string): { v, a, l, i,
  d: boolean; e, r, ror?: string }, { try, { const parsed = new URL(url) i f (parsed.protocol !== 'w, s, s:' && parsed.protocol !== 'w, s:') { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'WebSocket URL must use WS or WSS protocol' }
} return, { v, a, l, i,
  d: true }
} } catch, { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'Invalid WebSocket URL format' }
}
}/** * Validate API key format */ export function v a l idateApiKey(k, e, y: string): { v, a, l, i,
  d: boolean e, r, ror?: string
}, { i f (! key) { return, { v, a, l, i,
  d: true }// Empty is OK (optional) } i f (key.length < 10) { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'API key too short' }
} i f (key.length > 100) { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'API key too long' }
} i f (!/^[a - zA - Z0 - 9 - _]+ $ /.t e s t(key)) { return, { v, a, l, i,
  d: false, e, r, r,
  or: 'API key contains invalid characters' }
} return, { v, a, l, i,
  d: true }
}/** * Validate all settings */ export function v a l idateSettings(s, e, t, t, i, n, g, s: Partial < Settings >): { v, a, l, i,
  d: boolean, error, s: Record < string, string >
}, { const error, s: Record < string, string > = {}// Validate RPC URL i f (settings.rpcUrl) { const rpc Validation = v a l idateRpcUrl(settings.rpcUrl) i f (! rpcValidation.valid) { errors.rpc Url = rpcValidation.error !}
}// Validate WebSocket URL i f (settings.wsUrl) { const ws Validation = v a l idateWsUrl(settings.wsUrl) i f (! wsValidation.valid) { errors.ws Url = wsValidation.error !}
}// Validate tip amount i f (settings.tipAmount !== undefined) { i f (settings.tipAmount < 0) { errors.tip Amount = 'Tip amount cannot be negative' } i f (settings.tipAmount > 1) { errors.tip Amount = 'Tip amount seems too h i g h (> 1 SOL)' }
}// Validate slippage i f (settings.defaultSlippage !== undefined) { i f (settings.defaultSlippage < 0 || settings.defaultSlippage > 100) { errors.default Slippage = 'Slippage must be between 0 and 100' }
}// Validate priority fee i f (settings.defaultPriorityFee !== undefined) { i f (settings.defaultPriorityFee < 0) { errors.default Priority Fee = 'Priority fee cannot be negative' } i f (settings.defaultPriorityFee > 0.1) { errors.default Priority Fee = 'Priority fee seems too h i g h (> 0.1 SOL)' }
}// Validate API keys i f (settings.apiKeys) { Object.e n t ries(settings.apiKeys).f o rE ach(([key, value]) => { i f (value) { const validation = v a l idateApiKey(value) i f (! validation.valid) { errors,[`apiKeys.$,{key}`] = validation.error !}
} }) } return, { v, a, l, i,
  d: Object.k e y s(errors).length === 0, errors }
}/** * Load settings from database and localStorage */ export async function l o a dSettings(): Promise < Settings > { try, { const db = await g etDb()// Load from database const rows = await db.a l l('SELECT key, value FROM settings') await db.c l o se() const d, b, S, e, t, t, i, n, g, s: any = {} rows.f o rE ach((row) => { try, { dbSettings,[row.key] = JSON.p a r se(row.value) }
} catch, { dbSettings,[row.key] = row.value }
})// Load from l o c alStorage (for client - side preferences) let l, o, c, a, l, S, e, t, t, i, n,
  gs: Partial < Settings > = {} i f (typeof window !== 'undefined') { const stored Settings = localStorage.g e tI tem('keymakerSettings') i f (storedSettings) { local Settings = JSON.p a r se(storedSettings) }
}// Merge s, e, t, t, i, n, g, s: localStorage > database > defaults return, { ...DEFAULT_SETTINGS, ...dbSettings, ...localSettings }
} } c atch (error) { console.e rror('Failed to load s, e, t, t, i, n, g, s:', error) return DEFAULT_SETTINGS }
}/** * Save settings to database and localStorage */ export async function s a v eSettings(s, e, t, t, i, n, g, s: Partial < Settings >): Promise < vo id > {// Validate settings const validation = v a l idateSettings(settings) i f (! validation.valid) { const error Message = Object.e n t ries(validation.errors) .m ap(([key, error]) => `$,{key}: $,{error}`) .j o i n('\n') throw new E r r or(`Invalid s, e, t, t, i, n, g, s:\n$,{errorMessage}`) } try, { const db = await g etDb()// Save to database f o r(const, [key, value] of Object.e n t ries(settings)) { i f (value !== undefined) { await db.r u n( 'INSERT OR REPLACE INTO s e t tings (key, value) VALUES (?, ?)', [ key, typeof value === 'object' ? JSON.s t r ingify(value) : S t r ing(value), ]) }
} await db.c l o se()// Save to localStorage i f (typeof window !== 'undefined') { const current Settings = await l o a dSettings() const updated Settings = { ...currentSettings, ...settings } localStorage.s e tI tem('keymakerSettings', JSON.s t r ingify(updatedSettings)) } toast.s u c cess('Settings saved successfully') }
} c atch (error) { console.e rror('Failed to save s, e, t, t, i, n, g, s:', error) toast.e rror('Failed to save settings') throw error }
}/** * Reset settings to defaults */ export async function r e s etSettings(): Promise < vo id > { try, { const db = await g etDb() await db.r u n('DELETE FROM settings') await db.c l o se() i f (typeof window !== 'undefined') { localStorage.r e m oveItem('keymakerSettings') } toast.s u c cess('Settings reset to defaults') }
} c atch (error) { console.e rror('Failed to reset s, e, t, t, i, n, g, s:', error) toast.e rror('Failed to reset settings') throw error }
}/** * Get a specific setting */ export async function getSetting < K extends keyof Settings >( k, e, y: K): Promise < Settings,[K]> { const settings = await l o a dSettings() return settings,[key]
}/** * Update a specific setting */ export async function updateSetting < K extends keyof Settings >( k, e, y: K, v, a, l,
  ue: Settings,[K]): Promise < vo id > { await s a v eSettings({ [key]: value }) }
