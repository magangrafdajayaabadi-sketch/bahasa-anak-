import type { Concept } from '../data/curriculum'
import { THEMES } from '../data/curriculum'
import type { LangCode } from '../data/languages'
import { wordUniverse } from '../data/wordUniverse'
import type { UniWord } from '../data/wordUniverse'

/**
 * Sistem penguasaan adaptif ala Leitner (spaced repetition).
 *
 * Setiap kata punya "kotak" 0–5. Jawaban benar menaikkan kotak dan menunda
 * pengulangan; jawaban keliru menurunkannya sehingga kata itu segera muncul
 * lagi. Semua perhitungan berjalan di perangkat — tidak butuh AI dan tidak
 * memakan kuota, sementara AI dipakai untuk hal yang memang butuh bahasa:
 * memberi umpan balik dan ringkasan.
 */

export interface ItemStat {
  /** 0 = baru dipelajari, 5 = sudah kuat */
  box: number
  attempts: number
  correct: number
  /** epoch ms terakhir dilatih */
  lastSeen: number
  /** epoch ms kapan sebaiknya diulang */
  dueAt: number
  lastScore: number
  /** beberapa jawaban keliru terakhir, jadi bahan konteks untuk AI Tutor */
  misses: string[]
}

export type ItemMap = Record<string, ItemStat>

/** Jeda pengulangan per kotak. Sengaja pendek di awal agar anak cepat mengulang. */
const INTERVALS_MS = [
  0,
  5 * 60_000, // 5 menit
  24 * 3_600_000, // 1 hari
  3 * 24 * 3_600_000,
  7 * 24 * 3_600_000,
  21 * 24 * 3_600_000,
]

const MAX_BOX = INTERVALS_MS.length - 1
export const PASS_SCORE = 70

export const itemKey = (lang: LangCode, conceptId: string) => `${lang}:${conceptId}`

const blank = (): ItemStat => ({
  box: 0,
  attempts: 0,
  correct: 0,
  lastSeen: 0,
  dueAt: 0,
  lastScore: 0,
  misses: [],
})

export interface Attempt {
  conceptId: string
  score: number
  /** apa yang diucapkan/ditulis anak saat keliru */
  miss?: string
}

/** Terapkan satu percobaan ke peta penguasaan; mengembalikan peta baru. */
export function applyAttempt(
  items: ItemMap,
  lang: LangCode,
  attempt: Attempt,
  now = Date.now(),
): ItemMap {
  const key = itemKey(lang, attempt.conceptId)
  const prev = items[key] ?? blank()
  const passed = attempt.score >= PASS_SCORE

  const box = passed ? Math.min(MAX_BOX, prev.box + 1) : Math.max(0, prev.box - 1)
  const misses =
    !passed && attempt.miss
      ? [attempt.miss, ...prev.misses].slice(0, 3)
      : prev.misses

  return {
    ...items,
    [key]: {
      box,
      attempts: prev.attempts + 1,
      correct: prev.correct + (passed ? 1 : 0),
      lastSeen: now,
      // Kata yang keliru dijadwalkan ulang segera (kotak 0 = 0 ms).
      dueAt: now + INTERVALS_MS[box],
      lastScore: attempt.score,
      misses,
    },
  }
}

export const statOf = (items: ItemMap, lang: LangCode, conceptId: string): ItemStat =>
  items[itemKey(lang, conceptId)] ?? blank()

/** Kata dianggap dikuasai bila sudah naik minimal ke kotak 3. */
export const isStrong = (s: ItemStat) => s.box >= 3

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Susun daftar soal satu sesi: yang jatuh tempo dan paling lemah lebih dulu,
 * lalu kata baru, baru sisanya. Diacak di dalam tiap kelompok supaya tidak
 * terasa monoton bagi anak.
 */
export function pickSession<T extends { id: string }>(
  items: ItemMap,
  lang: LangCode,
  pool: T[],
  count: number,
  now = Date.now(),
): T[] {
  const due: { c: T; s: ItemStat }[] = []
  const fresh: T[] = []
  const rest: { c: T; s: ItemStat }[] = []

  for (const c of pool) {
    const s = statOf(items, lang, c.id)
    if (s.attempts === 0) fresh.push(c)
    else if (s.dueAt <= now) due.push({ c, s })
    else rest.push({ c, s })
  }

  // Yang paling lemah (kotak terendah, skor terakhir terburuk) didahulukan.
  due.sort((a, b) => a.s.box - b.s.box || a.s.lastScore - b.s.lastScore)
  rest.sort((a, b) => a.s.dueAt - b.s.dueAt)

  const ordered = [
    ...due.map((d) => d.c),
    ...shuffle(fresh),
    ...rest.map((r) => r.c),
  ]
  return ordered.slice(0, count)
}

/** Semua kata yang jatuh tempo di seluruh tema — bahan untuk "Ulang Cerdas". */
export function dueConcepts(items: ItemMap, lang: LangCode, now = Date.now()): Concept[] {
  const all = THEMES.flatMap((t) => t.concepts)
  return all.filter((c) => {
    const s = statOf(items, lang, c.id)
    return s.attempts > 0 && s.dueAt <= now
  })
}

export interface LangStats {
  seen: number
  strong: number
  accuracy: number
  due: number
}

export function statsFor(items: ItemMap, lang: LangCode, now = Date.now()): LangStats {
  const all = wordUniverse(lang)
  let seen = 0
  let strong = 0
  let attempts = 0
  let correct = 0
  let due = 0

  for (const w of all) {
    const s = statOf(items, lang, w.id)
    if (s.attempts === 0) continue
    seen++
    attempts += s.attempts
    correct += s.correct
    if (isStrong(s)) strong++
    if (s.dueAt <= now) due++
  }

  return {
    seen,
    strong,
    accuracy: attempts ? Math.round((correct / attempts) * 100) : 0,
    due,
  }
}

export type Level = 'mudah' | 'sedang' | 'sulit'

/**
 * Tingkat kesulitan menyesuaikan ketepatan anak. Dipakai untuk menambah atau
 * mengurangi jumlah pilihan jawaban, tanpa pernah keluar dari batas usianya.
 */
export function levelFor(items: ItemMap, lang: LangCode): Level {
  const { seen, accuracy } = statsFor(items, lang)
  if (seen < 4) return 'sedang'
  if (accuracy >= 85) return 'sulit'
  if (accuracy < 60) return 'mudah'
  return 'sedang'
}

export function adaptChoices(base: number, level: Level): number {
  const delta = level === 'sulit' ? 1 : level === 'mudah' ? -1 : 0
  return Math.max(2, Math.min(4, base + delta))
}

export interface WeakSpot {
  word: UniWord
  stat: ItemStat
}

/** Kata yang paling perlu perhatian — untuk konteks AI dan panel orang tua. */
export function weakSpots(
  items: ItemMap,
  lang: LangCode,
  limit = 5,
): WeakSpot[] {
  return wordUniverse(lang)
    .map((word) => ({ word, stat: statOf(items, lang, word.id) }))
    .filter(({ stat }) => stat.attempts > 0 && !isStrong(stat))
    .sort(
      (a, b) =>
        a.stat.box - b.stat.box ||
        a.stat.correct / a.stat.attempts - b.stat.correct / b.stat.attempts ||
        a.stat.lastScore - b.stat.lastScore,
    )
    .slice(0, limit)
}

/** Kata terkuat — dipakai untuk memuji kemajuan yang konkret. */
export function strongSpots(items: ItemMap, lang: LangCode, limit = 5): WeakSpot[] {
  return wordUniverse(lang)
    .map((word) => ({ word, stat: statOf(items, lang, word.id) }))
    .filter(({ stat }) => isStrong(stat))
    .sort((a, b) => b.stat.box - a.stat.box || b.stat.lastScore - a.stat.lastScore)
    .slice(0, limit)
}

/** Ringkasan padat yang dikirim ke AI Tutor sebagai "ingatan" tentang anak. */
export interface LearnerProfile {
  level: Level
  accuracy: number
  wordsSeen: number
  wordsStrong: number
  weakWords: { text: string; roman: string; meaning: string; misses: string[] }[]
  strongWords: string[]
}

export function learnerProfile(items: ItemMap, lang: LangCode): LearnerProfile {
  const s = statsFor(items, lang)
  return {
    level: levelFor(items, lang),
    accuracy: s.accuracy,
    wordsSeen: s.seen,
    wordsStrong: s.strong,
    weakWords: weakSpots(items, lang, 4).map(({ word, stat }) => ({
      text: word.text,
      roman: word.roman,
      meaning: word.meaning,
      misses: stat.misses.slice(0, 2),
    })),
    strongWords: strongSpots(items, lang, 4).map((w) => w.word.roman),
  }
}
