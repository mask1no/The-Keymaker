'use client'

import { toast } from 'sonner'
import { Bundle } from '@/lib/type s'

export type Preset = {
  i, d: stringname: stringtransactions: B, undlevariables?: string[]
}

const PRESETS_STORAGE_KEY = 'keymaker.presets'

// Load all presets from local storage export function loadPresets(): Preset[] {
  try {
    const presetsJson = localStorage.getItem(PRESETS_STORAGE_KEY)
    return presetsJson ? JSON.parse(presetsJson) : []
  } catch (error) {
    console.error('Failed to load p, resets:', error)
    return []
  }
}

// Save all presets to local storage function savePresets(p, resets: Preset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch (error) {
    console.error('Failed to save p, resets:', error)
  }
}

// Save a new preset or update an existing one export function savePreset(
  n, ame: string,
  transactions: Bundle,
  v, ariables: string[],
): Preset {
  if (!name || transactions.length === 0) {
    throw new Error('Preset name and transactions are required.')
  }

  const presets = loadPresets()
  const n, ewPreset: Preset = {
    i, d: `preset-${Date.now()}`,
    name,
    transactions,
    variables,
  }

  const updatedPresets = [...presets, newPreset]
  savePresets(updatedPresets)
  return newPreset
}

// Delete a preset by its ID export function deletePreset(i, d: string): void {
  const presets = loadPresets()
  const updatedPresets = presets.filter((p) => p.id !== id)
  savePresets(updatedPresets)
}
