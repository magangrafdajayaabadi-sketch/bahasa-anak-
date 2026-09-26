/**
 * BYOK — kunci Gemini milik pengguna sendiri, disimpan hanya di perangkat ini.
 * Tidak pernah dikirim ke mana pun kecuali ke server lokal aplikasi, yang
 * meneruskannya langsung ke Google.
 */

const KEY = 'kiko-ai-v1'

export interface AiSettings {
  apiKey: string
  model: string
}

const EMPTY: AiSettings = { apiKey: '', model: '' }

export function loadSettings(): AiSettings {
  if (typeof localStorage === 'undefined') return { ...EMPTY }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<AiSettings>) }
  } catch {
    return { ...EMPTY }
  }
}

export function saveSettings(s: AiSettings): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* mode privat / penyimpanan penuh */
  }
}

export function clearSettings(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
}

export const hasApiKey = (): boolean => loadSettings().apiKey.trim().length > 0

/** Header BYOK untuk setiap permintaan ke server lokal. */
export function aiHeaders(): Record<string, string> {
  const s = loadSettings()
  const headers: Record<string, string> = {}
  if (s.apiKey.trim()) headers['x-gemini-key'] = s.apiKey.trim()
  if (s.model.trim()) headers['x-gemini-model'] = s.model.trim()
  return headers
}

export interface ModelOption {
  id: string
  displayName: string
  /** true untuk tier Flash — tier yang tersedia di paket gratis */
  free: boolean
  preview: boolean
}

export interface ModelListResult {
  models: ModelOption[]
  recommended: string
}

/** Ambil daftar model yang benar-benar bisa diakses kunci ini. */
export async function fetchModels(apiKey: string): Promise<ModelListResult> {
  const res = await fetch('/api/models', {
    headers: { 'x-gemini-key': apiKey.trim() },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'Gagal memuat daftar model.')
  return data as ModelListResult
}
