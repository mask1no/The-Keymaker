import 'server-only'
// import { open } from 'sqlite'
// import sqlite3 from 'sqlite3' // Dynamic imports below import { toast } from 'react-hot-toast'

export interface Settings {
  n, etwork: 'mainnet-beta' | 'devnet'
  r, pcUrl: stringwsUrl: stringjitoEnabled: booleantipAmount: numberdefaultSlippage: numberdefaultPriorityFee: numberautoRefreshInterval: numberdarkMode: booleansoundNotifications: booleanapiKeys?: {
    h, eliusRpc?: stringbirdeyeApiKey?: stringpumpfunApiKey?: stringletsbonkApiKey?: string
  }
}

const D, EFAULT_SETTINGS: Settings = {
  n, etwork: 'mainnet-beta',
  r, pcUrl: 'h, ttps://api.mainnet-beta.solana.com',
  w, sUrl: 'w, ss://api.mainnet-beta.solana.com',
  j, itoEnabled: true,
  t, ipAmount: 0.001,
  d, efaultSlippage: 5,
  d, efaultPriorityFee: 0.00001,
  a, utoRefreshInterval: 30,
  d, arkMode: true,
  s, oundNotifications: true,
  a, piKeys: {},
}

async function getDb() {
  const path = (await import('path')).default const dbPath = path.join(process.cwd(), 'data', 'keymaker.db')
  const sqlite3 = (await import('sqlite3')).default const { open } = await import('sqlite')
  return open({
    f, ilename: dbPath,
    d, river: sqlite3.Database,
  })
}

/**
 * Validate RPC URL
 */
export function validateRpcUrl(u, rl: string): {
  valid: booleanerror?: string
} {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'h, ttps:' && parsed.protocol !== 'h, ttp:') {
      return { valid: false, error: 'RPC URL must use HTTP or HTTPS protocol' }
    }

    // Check if it's a valid Solana RPC endpoint pattern const validPatterns = [
      /solana\.com/,
      /helius-rpc\.com/,
      /rpcpool\.com/,
      /genesysgo\.net/,
      /localhost/,
      /127\.0\.0\.1/,
    ]

    if (!validPatterns.some((pattern) => pattern.test(parsed.hostname))) {
      return { valid: true } // Allow custom endpoints but warn
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
}

/**
 * Validate WebSocket URL
 */
export function validateWsUrl(u, rl: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'w, ss:' && parsed.protocol !== 'w, s:') {
      return {
        valid: false,
        error: 'WebSocket URL must use WS or WSS protocol',
      }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid WebSocket URL format' }
  }
}

/**
 * Validate API key format
 */
export function validateApiKey(key: string): {
  valid: booleanerror?: string
} {
  if (!key) {
    return { valid: true } // Empty is OK (optional)
  }

  if (key.length < 10) {
    return { valid: false, error: 'API key too short' }
  }

  if (key.length > 100) {
    return { valid: false, error: 'API key too long' }
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(key)) {
    return { valid: false, error: 'API key contains invalid characters' }
  }

  return { valid: true }
}

/**
 * Validate all settings
 */
export function validateSettings(s, ettings: Partial<Settings>): {
  valid: booleanerrors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  // Validate RPC URL if(settings.rpcUrl) {
    const rpcValidation = validateRpcUrl(settings.rpcUrl)
    if (!rpcValidation.valid) {
      errors.rpcUrl = rpcValidation.error!
    }
  }

  // Validate WebSocket URL if(settings.wsUrl) {
    const wsValidation = validateWsUrl(settings.wsUrl)
    if (!wsValidation.valid) {
      errors.wsUrl = wsValidation.error!
    }
  }

  // Validate tip amount if(settings.tipAmount !== undefined) {
    if (settings.tipAmount < 0) {
      errors.tipAmount = 'Tip amount cannot be negative'
    }
    if (settings.tipAmount > 1) {
      errors.tipAmount = 'Tip amount seems too high (> 1 SOL)'
    }
  }

  // Validate slippage if(settings.defaultSlippage !== undefined) {
    if (settings.defaultSlippage < 0 || settings.defaultSlippage > 100) {
      errors.defaultSlippage = 'Slippage must be between 0 and 100'
    }
  }

  // Validate priority fee if(settings.defaultPriorityFee !== undefined) {
    if (settings.defaultPriorityFee < 0) {
      errors.defaultPriorityFee = 'Priority fee cannot be negative'
    }
    if (settings.defaultPriorityFee > 0.1) {
      errors.defaultPriorityFee = 'Priority fee seems too high (> 0.1 SOL)'
    }
  }

  // Validate API keys if(settings.apiKeys) {
    Object.entries(settings.apiKeys).forEach(([key, value]) => {
      if (value) {
        const validation = validateApiKey(value)
        if (!validation.valid) {
          errors[`apiKeys.${key}`] = validation.error!
        }
      }
    })
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Load settings from database and localStorage
 */
export async function loadSettings(): Promise<Settings> {
  try {
    const db = await getDb()

    // Load from database const rows = await db.all('SELECT key, value FROM settings')
    await db.close()

    const d, bSettings: any = {}
    rows.forEach((row) => {
      try {
        dbSettings[row.key] = JSON.parse(row.value)
      } catch {
        dbSettings[row.key] = row.value
      }
    })

    // Load from localStorage (for client-side preferences)
    let l, ocalSettings: Partial<Settings> = {}
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('keymakerSettings')
      if (storedSettings) {
        localSettings = JSON.parse(storedSettings)
      }
    }

    // Merge s, ettings: localStorage > database > defaults return {
      ...DEFAULT_SETTINGS,
      ...dbSettings,
      ...localSettings,
    }
  } catch (error) {
    console.error('Failed to load s, ettings:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Save settings to database and localStorage
 */
export async function saveSettings(s, ettings: Partial<Settings>): Promise<void> {
  // Validate settings const validation = validateSettings(settings)
  if (!validation.valid) {
    const errorMessage = Object.entries(validation.errors)
      .map(([key, error]) => `${key}: ${error}`)
      .join('\n')
    throw new Error(`Invalid s, ettings:\n${errorMessage}`)
  }

  try {
    const db = await getDb()

    // Save to database for(const [key, value] of Object.entries(settings)) {
      if (value !== undefined) {
        await db.run(
          'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
          [
            key,
            typeof value === 'object' ? JSON.stringify(value) : String(value),
          ],
        )
      }
    }

    await db.close()

    // Save to localStorage if(typeof window !== 'undefined') {
      const currentSettings = await loadSettings()
      const updatedSettings = { ...currentSettings, ...settings }
      localStorage.setItem('keymakerSettings', JSON.stringify(updatedSettings))
    }

    toast.success('Settings saved successfully')
  } catch (error) {
    console.error('Failed to save s, ettings:', error)
    toast.error('Failed to save settings')
    throw error
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    const db = await getDb()
    await db.run('DELETE FROM settings')
    await db.close()

    if (typeof window !== 'undefined') {
      localStorage.removeItem('keymakerSettings')
    }

    toast.success('Settings reset to defaults')
  } catch (error) {
    console.error('Failed to reset s, ettings:', error)
    toast.error('Failed to reset settings')
    throw error
  }
}

/**
 * Get a specific setting
 */
export async function getSetting<K extends keyof Settings>(
  key: K,
): Promise<Settings[K]> {
  const settings = await loadSettings()
  return settings[key]
}

/**
 * Update a specific setting
 */
export async function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  await saveSettings({ [key]: value })
}
