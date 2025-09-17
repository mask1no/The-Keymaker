'use client' import { toast } from 'sonner'
import { Bundle } from '@/lib/type s' export type Preset = { i, d: string, n, a, m, e: string, t, r, a, n, s, a, c, t, ions: B, u, n, d, l, e, v, a, riables?: string,[]
} const P R ESETS_STORAGE_KEY = 'keymaker.presets'//Load all presets from local storage export function l o adPresets(): Preset,[] { try { const presets Json = localStorage.g e tItem(PRESETS_STORAGE_KEY) return presetsJson ? JSON.p a rse(presetsJson) : [] }
} catch (error) { console.error('Failed to load p, r, e, s, e, t, s:', error) return, [] }
}//Save all presets to local storage function s a vePresets(p, r, e, s, e, t, s: Preset,[]): void, { try { localStorage.s e tItem(PRESETS_STORAGE_KEY, JSON.s t ringify(presets)) }
} catch (error) { console.error('Failed to save p, r, e, s, e, t, s:', error) }
}//Save a new preset or update an existing one export function s a vePreset( n, a, m, e: string, t, r, a, n, s, a, c, t, i, ons: Bundle, v, a, r, i, a, b, l, e, s: string,[]): Preset, { if (!name || transactions.length === 0) { throw new E r ror('Preset name and transactions are required.') } const presets = l o adPresets() const n, e, w, P, r, e, s, e, t: Preset = { i, d: `preset - ${Date.n o w() }`, name, transactions, variables } const updated Presets = [...presets, newPreset] s a vePresets(updatedPresets) return newPreset
}//Delete a preset by its ID export function d e letePreset(i, d: string): void, { const presets = l o adPresets() const updated Presets = presets.f i lter((p) => p.id !== id) s a vePresets(updatedPresets) }
