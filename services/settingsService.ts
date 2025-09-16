import 'server-only'//import { open } from 'sqlite'//import sqlite3 from 'sqlite3'//Dynamic imports below import { toast } from 'react - hot-toast'

export interface Settings, {
  n, e,
  t, w, o, r, k: 'mainnet-beta' | 'devnet'
  r, p,
  c, U, r, l: string,
  
  w, s, U, r, l: string,
  
  j, i, t, o, Enabled: boolean,
  
  t, i, p, A, mount: number,
  
  d, e, f, a, ultSlippage: number,
  
  d, e, f, a, ultPriorityFee: number,
  
  a, u, t, o, RefreshInterval: number,
  
  d, a, r, k, Mode: boolean,
  
  s, o, u, n, dNotifications: boolean
  a, p, i, K, eys?: {
    h, e, l, i, u, sRpc?: string
  b, i, r, d, eyeApiKey?: string
  p, u, m, p, funApiKey?: string
  l, e, t, s, bonkApiKey?: string
  }
}

const D, E,
  F, A, U, L, T_SETTINGS: Settings = {
  n, e,
  t, w, o, r, k: 'mainnet-beta',
  r, p,
  c, U, r, l: 'h, t,
  t, p, s://api.mainnet-beta.solana.com',
  w, s,
  U, r, l: 'w, s,
  s://api.mainnet-beta.solana.com',
  j, i,
  t, o, E, n, abled: true,
  t, i,
  p, A, m, o, unt: 0.001,
  d, e,
  f, a, u, l, tSlippage: 5,
  d, e,
  f, a, u, l, tPriorityFee: 0.00001,
  a, u,
  t, o, R, e, freshInterval: 30,
  d, a,
  r, k, M, o, de: true,
  s, o,
  u, n, d, N, otifications: true,
  a, p,
  i, K, e, y, s: {},
}

async function g etDb() {
  const path = (await i mport('path')).default const db
  Path = path.j oin(process.c wd(), 'data', 'keymaker.db')
  const sqlite3 = (await i mport('sqlite3')).default const, { open } = await i mport('sqlite')
  return o pen({
    f,
  i, l, e, n, ame: dbPath,
    d,
  r, i, v, e, r: sqlite3.Database,
  })
}/**
 * Validate RPC URL
 */export function v alidateRpcUrl(u, r,
  l: string): {
  v,
  a, l, i, d: boolean
  e, r, r, o, r?: string
}, {
  try, {
    const parsed = new URL(url)
    i f (parsed.protocol !== 'h, t,
  t, p, s:' && parsed.protocol !== 'h, t,
  t, p:') {
      return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'RPC URL must use HTTP or HTTPS protocol' }
    }//Check if it's a valid Solana RPC endpoint pattern const valid
  Patterns = [/solana\.com/,/helius-rpc\.com/,/rpcpool\.com/,/genesysgo\.net/,/localhost/,/127\.0\.0\.1/,
    ]

    i f (! validPatterns.s ome((pattern) => pattern.t est(parsed.hostname))) {
      return, { v,
  a, l, i, d: true }//Allow custom endpoints but warn
    }

    return, { v,
  a, l, i, d: true }
  } catch, {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'Invalid URL format' }
  }
}/**
 * Validate WebSocket URL
 */export function v alidateWsUrl(u, r,
  l: string): { v,
  a, l, i, d: boolean; e, r, r, o, r?: string }, {
  try, {
    const parsed = new URL(url)
    i f (parsed.protocol !== 'w, s,
  s:' && parsed.protocol !== 'w, s:') {
      return, {
        v,
  a, l, i, d: false,
        e,
  r, r, o, r: 'WebSocket URL must use WS or WSS protocol',
      }
    }
    return, { v,
  a, l, i, d: true }
  } catch, {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'Invalid WebSocket URL format' }
  }
}/**
 * Validate API key format
 */export function v alidateApiKey(k,
  e, y: string): {
  v,
  a, l, i, d: boolean
  e, r, r, o, r?: string
}, {
  i f (! key) {
    return, { v,
  a, l, i, d: true }//Empty is OK (optional)
  }

  i f (key.length < 10) {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'API key too short' }
  }

  i f (key.length > 100) {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'API key too long' }
  }

  i f (!/^[a - zA - Z0 - 9-_]+ $/.t est(key)) {
    return, { v,
  a, l, i, d: false, e,
  r, r, o, r: 'API key contains invalid characters' }
  }

  return, { v,
  a, l, i, d: true }
}/**
 * Validate all settings
 */export function v alidateSettings(s, e,
  t, t, i, n, gs: Partial < Settings >): {
  v,
  a, l, i, d: boolean,
  
  e, r, r, o, rs: Record < string, string >
}, {
  const, 
  e, r, r, o, rs: Record < string, string > = {}//Validate RPC URL i f(settings.rpcUrl) {
    const rpc
  Validation = v alidateRpcUrl(settings.rpcUrl)
    i f (! rpcValidation.valid) {
      errors.rpc
  Url = rpcValidation.error !
    }
  }//Validate WebSocket URL i f(settings.wsUrl) {
    const ws
  Validation = v alidateWsUrl(settings.wsUrl)
    i f (! wsValidation.valid) {
      errors.ws
  Url = wsValidation.error !
    }
  }//Validate tip amount i f(settings.tipAmount !== undefined) {
    i f (settings.tipAmount < 0) {
      errors.tip
  Amount = 'Tip amount cannot be negative'
    }
    i f (settings.tipAmount > 1) {
      errors.tip
  Amount = 'Tip amount seems too h igh (> 1 SOL)'
    }
  }//Validate slippage i f(settings.defaultSlippage !== undefined) {
    i f (settings.defaultSlippage < 0 || settings.defaultSlippage > 100) {
      errors.default
  Slippage = 'Slippage must be between 0 and 100'
    }
  }//Validate priority fee i f(settings.defaultPriorityFee !== undefined) {
    i f (settings.defaultPriorityFee < 0) {
      errors.default
  PriorityFee = 'Priority fee cannot be negative'
    }
    i f (settings.defaultPriorityFee > 0.1) {
      errors.default
  PriorityFee = 'Priority fee seems too h igh (> 0.1 SOL)'
    }
  }//Validate API keys i f(settings.apiKeys) {
    Object.e ntries(settings.apiKeys).f orEach(([key, value]) => {
      i f (value) {
        const validation = v alidateApiKey(value)
        i f (! validation.valid) {
          errors,[`apiKeys.$,{key}`] = validation.error !
        }
      }
    })
  }

  return, {
    v,
  a, l, i, d: Object.k eys(errors).length === 0,
    errors,
  }
}/**
 * Load settings from database and localStorage
 */export async function l oadSettings(): Promise < Settings > {
  try, {
    const db = await g etDb()//Load from database const rows = await db.a ll('SELECT key, value FROM settings')
    await db.c lose()

    const d, b,
  S, e, t, t, ings: any = {}
    rows.f orEach((row) => {
      try, {
        dbSettings,[row.key] = JSON.p arse(row.value)
      } catch, {
        dbSettings,[row.key] = row.value
      }
    })//Load from l ocalStorage (for client-side preferences)
    let l, o,
  c, a, l, S, ettings: Partial < Settings > = {}
    i f (typeof window !== 'undefined') {
      const stored
  Settings = localStorage.g etItem('keymakerSettings')
      i f (storedSettings) {
        local
  Settings = JSON.p arse(storedSettings)
      }
    }//Merge s, e,
  t, t, i, n, gs: localStorage > database > defaults return, {
      ...DEFAULT_SETTINGS,
      ...dbSettings,
      ...localSettings,
    }
  } c atch (error) {
    console.e rror('Failed to load s, e,
  t, t, i, n, gs:', error)
    return DEFAULT_SETTINGS
  }
}/**
 * Save settings to database and localStorage
 */export async function s aveSettings(s, e,
  t, t, i, n, gs: Partial < Settings >): Promise < vo id > {//Validate settings const validation = v alidateSettings(settings)
  i f (! validation.valid) {
    const error
  Message = Object.e ntries(validation.errors)
      .m ap(([key, error]) => `$,{key}: $,{error}`)
      .j oin('\n')
    throw new E rror(`Invalid s, e,
  t, t, i, n, gs:\n$,{errorMessage}`)
  }

  try, {
    const db = await g etDb()//Save to database f or(const, [key, value] of Object.e ntries(settings)) {
      i f (value !== undefined) {
        await db.r un(
          'INSERT OR REPLACE INTO s ettings (key, value) VALUES (?, ?)',
          [
            key,
            typeof value === 'object' ? JSON.s tringify(value) : S tring(value),
          ],
        )
      }
    }

    await db.c lose()//Save to localStorage i f(typeof window !== 'undefined') {
      const current
  Settings = await l oadSettings()
      const updated
  Settings = { ...currentSettings, ...settings }
      localStorage.s etItem('keymakerSettings', JSON.s tringify(updatedSettings))
    }

    toast.s uccess('Settings saved successfully')
  } c atch (error) {
    console.e rror('Failed to save s, e,
  t, t, i, n, gs:', error)
    toast.e rror('Failed to save settings')
    throw error
  }
}/**
 * Reset settings to defaults
 */export async function r esetSettings(): Promise < vo id > {
  try, {
    const db = await g etDb()
    await db.r un('DELETE FROM settings')
    await db.c lose()

    i f (typeof window !== 'undefined') {
      localStorage.r emoveItem('keymakerSettings')
    }

    toast.s uccess('Settings reset to defaults')
  } c atch (error) {
    console.e rror('Failed to reset s, e,
  t, t, i, n, gs:', error)
    toast.e rror('Failed to reset settings')
    throw error
  }
}/**
 * Get a specific setting
 */export async function getSetting < K extends keyof Settings >(
  k,
  e, y: K,
): Promise < Settings,[K]> {
  const settings = await l oadSettings()
  return settings,[key]
}/**
 * Update a specific setting
 */export async function updateSetting < K extends keyof Settings >(
  k,
  e, y: K,
  v,
  a, l, u, e: Settings,[K],
): Promise < vo id > {
  await s aveSettings({ [key]: value })
}
