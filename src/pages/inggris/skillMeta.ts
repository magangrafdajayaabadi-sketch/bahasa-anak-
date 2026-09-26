import type { SkillId } from '../../types'

/**
 * Konfigurasi tiga latihan Bahasa Inggris yang berbagi struktur halaman
 * ber-URL yang sama: /inggris/:skillSlug/:categoryId/:level.
 */
export type SkillSlug = 'vocab' | 'pelafalan' | 'menulis'

export interface SkillMeta {
  slug: SkillSlug
  /** Nama keterampilan untuk pencatatan progres */
  record: SkillId
  title: string
  emoji: string
  tone: 'pink' | 'sky' | 'sun'
  indexNote: string
}

export const SKILLS_META: Record<SkillSlug, SkillMeta> = {
  vocab: {
    slug: 'vocab',
    record: 'kosakata',
    title: 'Kosakata',
    emoji: '🧩',
    tone: 'sun',
    indexNote: 'Belajar arti kata dengan kartu, contoh kalimat, dan fakta seru.',
  },
  pelafalan: {
    slug: 'pelafalan',
    record: 'pelafalan',
    title: 'Pelafalan',
    emoji: '🎧',
    tone: 'sky',
    indexNote: 'Dengar lalu tirukan lewat mikrofon. Kiko menilai suaramu.',
  },
  menulis: {
    slug: 'menulis',
    record: 'menulis',
    title: 'Menulis',
    emoji: '✏️',
    tone: 'pink',
    indexNote: 'Eja kata Bahasa Inggris dari gambar dan bunyinya.',
  },
}

export const skillFromSlug = (s?: string): SkillMeta | null =>
  s && s in SKILLS_META ? SKILLS_META[s as SkillSlug] : null
