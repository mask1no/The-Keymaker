'use client'

import { toast } from 'sonner'
import { Bundle } from '@/lib/types'

export type Preset = {
  id: string
  name: string
  transactions: Bundle
  variables?: string[]
}

const PRESETS_STORAGE_KEY = 'keymaker.presets'

// Load all presets from local storage
export function loadPresets(): Preset[] {
  try {
    const presetsJson = localStorage.getItem(PRESETS_STORAGE_KEY)
    return presetsJson ? JSON.parse(presetsJson) : []
  } catch (error) {
    console.error('Failed to load presets:', error)
    return []
  }
}

// Save all presets to local storage
function savePresets(presets: Preset[]): void {
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets))
  } catch (error) {
    console.error('Failed to save presets:', error)
  }
}

// Save a new preset or update an existing one
export function savePreset(
  name: string,
  transactions: Bundle,
  variables: string[],
): Preset {
  if (!name || transactions.length === 0) {
    throw new Error('Preset name and transactions are required.')
  }

  const presets = loadPresets()
  const newPreset: Preset = {
    id: `preset-${Date.now()}`,
    name,
    transactions,
    variables,
  }

  const updatedPresets = [...presets, newPreset]
  savePresets(updatedPresets)
  return newPreset
}

// Delete a preset by its ID
export function deletePreset(id: string): void {
  const presets = loadPresets()
  const updatedPresets = presets.filter((p) => p.id !== id)
  savePresets(updatedPresets)
}
