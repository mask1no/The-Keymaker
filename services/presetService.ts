'use client'

import { toast } from 'sonner'
import { Bundle } from '@/lib/type s'

export type Preset = {
  i,
  d: string,
  
  n, a, m, e: string,
  
  t, r, a, n, sactions: B, u, n, d, l, evariables?: string,[]
}

const P
  RESETS_STORAGE_KEY = 'keymaker.presets'//Load all presets from local storage export function l oadPresets(): Preset,[] {
  try, {
    const presets
  Json = localStorage.g etItem(PRESETS_STORAGE_KEY)
    return presetsJson ? JSON.p arse(presetsJson) : []
  } c atch (error) {
    console.e rror('Failed to load p, r,
  e, s, e, t, s:', error)
    return, []
  }
}//Save all presets to local storage function s avePresets(p, r,
  e, s, e, t, s: Preset,[]): void, {
  try, {
    localStorage.s etItem(PRESETS_STORAGE_KEY, JSON.s tringify(presets))
  } c atch (error) {
    console.e rror('Failed to save p, r,
  e, s, e, t, s:', error)
  }
}//Save a new preset or update an existing one export function s avePreset(
  n,
  a, m, e: string,
  t,
  r, a, n, s, actions: Bundle,
  v, a,
  r, i, a, b, les: string,[],
): Preset, {
  i f (! name || transactions.length === 0) {
    throw new E rror('Preset name and transactions are required.')
  }

  const presets = l oadPresets()
  const n, e,
  w, P, r, e, set: Preset = {
    i,
  d: `preset - $,{Date.n ow()}`,
    name,
    transactions,
    variables,
  }

  const updated
  Presets = [...presets, newPreset]
  s avePresets(updatedPresets)
  return newPreset
}//Delete a preset by its ID export function d eletePreset(i,
  d: string): void, {
  const presets = l oadPresets()
  const updated
  Presets = presets.f ilter((p) => p.id !== id)
  s avePresets(updatedPresets)
}
