import type { Concept } from '../data/curriculum'
import type { LangCode } from '../data/languages'
import { SKILLS, getSkill } from '../types'
import type { SkillId } from '../types'
import { dueConcepts, isStrong, statOf, statsFor } from './mastery'
import type { ItemMap } from './mastery'
import { categoryById, categoryUniverse } from '../data/wordUniverse'

/**
 * Satu aktivitas yang bisa dimainkan. Dipakai bersama oleh beranda (mulai),
 * layar akhir sesi (main lagi / lanjut), dan mesin rekomendasi — jadi seluruh
 * navigasi memakai satu bentuk data yang sama.
 */
export type Activity =
  | { kind: 'review' }
  | { kind: 'speak' }
  | { kind: 'play'; skill: Exclude<SkillId, 'berbicara'>; themeId: string }

/** Keterampilan bertema (bukan berbicara), urut sesuai tampilan beranda. */
const THEMED_SKILLS = SKILLS.map((s) => s.id).filter(
  (id): id is Exclude<SkillId, 'berbicara'> => id !== 'berbicara',
)

/** Berapa kata dalam kategori ini yang sudah kuat untuk bahasa tertentu. */
export function themeStrong(items: ItemMap, lang: LangCode, themeId: string): number {
  const cat = categoryById(lang, themeId)
  if (!cat) return 0
  return cat.wordIds.filter((id) => isStrong(statOf(items, lang, id))).length
}

const themeDone = (items: ItemMap, lang: LangCode, themeId: string): boolean => {
  const cat = categoryById(lang, themeId)
  return !!cat && cat.wordIds.length > 0 && themeStrong(items, lang, themeId) >= cat.wordIds.length
}

/** Kategori pertama (mulai dari indeks tertentu) yang belum tuntas dikuasai. */
function nextUnfinishedTheme(
  items: ItemMap,
  lang: LangCode,
  afterThemeId?: string,
): string | null {
  const cats = categoryUniverse(lang)
  const start = afterThemeId ? cats.findIndex((c) => c.id === afterThemeId) + 1 : 0
  // Cari maju dulu dari kategori terakhir, lalu putar dari awal.
  const order = [...cats.slice(start), ...cats.slice(0, Math.max(0, start))]
  const found = order.find((c) => !themeDone(items, lang, c.id))
  return found?.id ?? null
}

export interface Suggestion {
  activity: Activity
  /** Kalimat ajakan singkat untuk anak */
  label: string
  emoji: string
  /** Alasan singkat, mis. "3 kata siap diulang" */
  reason: string
}

export interface RecommendOptions {
  /** Jangan sarankan aktivitas yang sama persis dengan yang baru selesai */
  exclude?: Activity
  /** Jangan sarankan Ulang Cerdas (mis. baru saja mengulang) */
  skipReview?: boolean
}

const sameActivity = (a: Activity, b?: Activity): boolean => {
  if (!b || a.kind !== b.kind) return false
  if (a.kind === 'play' && b.kind === 'play')
    return a.skill === b.skill && a.themeId === b.themeId
  return true
}

/** Nama & emoji kategori untuk sebuah bahasa (fallback aman bila tak dikenal). */
function catMeta(lang: LangCode, themeId: string): { title: string; emoji: string } {
  const cat = categoryById(lang, themeId)
  return { title: cat?.title ?? 'Kata', emoji: cat?.emoji ?? '🧩' }
}

/**
 * Pilih langkah belajar terbaik berikutnya.
 * Prioritas: kata yang perlu diulang → lanjut kategori di keterampilan yang sama →
 * keterampilan lain → berbicara.
 */
export function recommendNext(
  items: ItemMap,
  lang: LangCode,
  opts: RecommendOptions = {},
): Suggestion {
  const dueCount = statsFor(items, lang).due

  // 1. Kata jatuh tempo cukup banyak → utamakan mengulang agar tidak lupa.
  if (!opts.skipReview && dueCount >= 3 && !sameActivity({ kind: 'review' }, opts.exclude)) {
    return {
      activity: { kind: 'review' },
      label: 'Ulang Cerdas',
      emoji: '🎯',
      reason: `${dueCount} kata siap diulang`,
    }
  }

  // 2. Lanjutkan keterampilan yang sama ke kategori berikutnya yang belum tuntas.
  if (opts.exclude?.kind === 'play') {
    const skill = opts.exclude.skill
    const themeId = nextUnfinishedTheme(items, lang, opts.exclude.themeId)
    if (themeId) {
      const m = catMeta(lang, themeId)
      return {
        activity: { kind: 'play', skill, themeId },
        label: `${getSkill(skill).title}: ${m.title}`,
        emoji: m.emoji,
        reason: 'kategori berikutnya',
      }
    }
  }

  // 3. Cari keterampilan bertema dengan kategori yang belum tuntas.
  for (const skill of THEMED_SKILLS) {
    const themeId = nextUnfinishedTheme(items, lang)
    if (!themeId) continue
    const candidate: Activity = { kind: 'play', skill, themeId }
    if (!sameActivity(candidate, opts.exclude)) {
      const m = catMeta(lang, themeId)
      return {
        activity: candidate,
        label: `${getSkill(skill).title}: ${m.title}`,
        emoji: getSkill(skill).emoji,
        reason: 'lanjut belajar',
      }
    }
  }

  // 4. Latihan yang tersisa / semua sudah dikuasai → ngobrol.
  if (!sameActivity({ kind: 'speak' }, opts.exclude)) {
    return {
      activity: { kind: 'speak' },
      label: 'Berbicara dengan Kiko',
      emoji: '🎤',
      reason: dueCount ? 'sambil mengulang' : 'praktik percakapan',
    }
  }

  // 5. Cadangan terakhir: kategori pertama yang paling perlu.
  const themeId = nextUnfinishedTheme(items, lang) ?? categoryUniverse(lang)[0].id
  const m = catMeta(lang, themeId)
  return {
    activity: { kind: 'play', skill: 'kosakata', themeId },
    label: `Kosakata: ${m.title}`,
    emoji: '🧩',
    reason: 'ayo main lagi',
  }
}

/** Deskripsi ringkas satu aktivitas — untuk tombol "Main lagi". */
export function describeActivity(
  activity: Activity,
  lang: LangCode,
): { label: string; emoji: string } {
  if (activity.kind === 'review') return { label: 'Ulang Cerdas', emoji: '🎯' }
  if (activity.kind === 'speak') return { label: 'Berbicara', emoji: '🎤' }
  const m = catMeta(lang, activity.themeId)
  return { label: `${getSkill(activity.skill).title}: ${m.title}`, emoji: m.emoji }
}

/** Kumpulan concept untuk sesi review lintas tema (khusus alur internal non-Inggris). */
export const reviewPool = (items: ItemMap, lang: LangCode): Concept[] =>
  dueConcepts(items, lang)
