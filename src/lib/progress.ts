import type { LangCode } from '../data/languages'
import type { Profile, SkillId } from '../types'
import { applyAttempt, isStrong, statOf, statsFor } from './mastery'
import type { Attempt, ItemMap } from './mastery'

/** Semua progres disimpan lokal di perangkat — tidak ada data anak yang dikirim keluar. */
const KEY = 'kiko-bahasa-v1'

export interface Badge {
  id: string
  title: string
  emoji: string
  earnedAt: string
}

export interface Progress {
  profile: Profile | null
  /** Total bintang per bahasa */
  stars: Record<string, number>
  /** Bintang per bahasa+keterampilan, mis. "en:kosakata" */
  skillStars: Record<string, number>
  /** Penguasaan per kata (spaced repetition), kunci "en:cat" */
  items: ItemMap
  badges: Badge[]
  streak: number
  lastPlayed: string | null
  soundOn: boolean
}

const EMPTY: Progress = {
  profile: null,
  stars: {},
  skillStars: {},
  items: {},
  badges: [],
  streak: 0,
  lastPlayed: null,
  soundOn: true,
}

/** Data versi lama menyimpan daftar kata dikuasai; pindahkan ke sistem kotak. */
function migrate(raw: Partial<Progress> & { mastered?: string[] }): Progress {
  const merged: Progress = { ...EMPTY, ...raw, items: { ...(raw.items ?? {}) } }
  if (raw.mastered?.length && Object.keys(merged.items).length === 0) {
    const now = Date.now()
    for (const key of raw.mastered) {
      merged.items[key] = {
        box: 3,
        attempts: 1,
        correct: 1,
        lastSeen: now,
        dueAt: now,
        lastScore: 100,
        misses: [],
      }
    }
  }
  return merged
}

export function load(): Progress {
  if (typeof localStorage === 'undefined') return { ...EMPTY }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    return migrate(JSON.parse(raw))
  } catch {
    return { ...EMPTY }
  }
}

export function save(p: Progress): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* penyimpanan penuh / mode privat — abaikan */
  }
}

export function reset(): Progress {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY)
  return { ...EMPTY }
}

const today = () => new Date().toISOString().slice(0, 10)

/** Perbarui runtutan hari (streak) saat anak mulai bermain. */
export function touchStreak(p: Progress): Progress {
  const d = today()
  if (p.lastPlayed === d) return p
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  return {
    ...p,
    streak: p.lastPlayed === yesterday ? p.streak + 1 : 1,
    lastPlayed: d,
  }
}

export interface SessionResult {
  lang: LangCode
  skill: SkillId
  stars: number
  /** Satu entri per soal yang dikerjakan anak */
  attempts: Attempt[]
}

const BADGE_RULES: { id: string; title: string; emoji: string; at: number }[] = [
  { id: 'star10', title: 'Bintang Pemula', emoji: '⭐', at: 10 },
  { id: 'star25', title: 'Bintang Rajin', emoji: '🌟', at: 25 },
  { id: 'star50', title: 'Bintang Hebat', emoji: '💫', at: 50 },
  { id: 'star100', title: 'Bintang Juara', emoji: '🏆', at: 100 },
]

export function recordSession(p: Progress, r: SessionResult): Progress {
  p = touchStreak(p)

  let items = p.items
  for (const attempt of r.attempts) {
    items = applyAttempt(items, r.lang, attempt)
  }

  const skillKey = `${r.lang}:${r.skill}`
  const next: Progress = {
    ...p,
    items,
    stars: { ...p.stars, [r.lang]: (p.stars[r.lang] ?? 0) + r.stars },
    skillStars: {
      ...p.skillStars,
      [skillKey]: (p.skillStars[skillKey] ?? 0) + r.stars,
    },
  }

  const total = Object.values(next.stars).reduce((a, b) => a + b, 0)
  for (const rule of BADGE_RULES) {
    if (total >= rule.at && !next.badges.some((b) => b.id === rule.id)) {
      next.badges = [
        ...next.badges,
        { id: rule.id, title: rule.title, emoji: rule.emoji, earnedAt: today() },
      ]
    }
  }
  if (next.streak >= 3 && !next.badges.some((b) => b.id === 'streak3')) {
    next.badges = [
      ...next.badges,
      { id: 'streak3', title: '3 Hari Berturut!', emoji: '🔥', earnedAt: today() },
    ]
  }
  const strongTotal = statsFor(next.items, r.lang).strong
  if (strongTotal >= 10 && !next.badges.some((b) => b.id === 'master10')) {
    next.badges = [
      ...next.badges,
      { id: 'master10', title: '10 Kata Kuat', emoji: '🧠', earnedAt: today() },
    ]
  }

  save(next)
  return next
}

export const totalStars = (p: Progress): number =>
  Object.values(p.stars).reduce((a, b) => a + b, 0)

export const skillStars = (p: Progress, lang: LangCode, skill: SkillId): number =>
  p.skillStars[`${lang}:${skill}`] ?? 0

/** Sudah "dikuasai" berarti kata itu naik minimal ke kotak 3. */
export const isMastered = (p: Progress, lang: LangCode, conceptId: string): boolean =>
  isStrong(statOf(p.items, lang, conceptId))

export const masteredCount = (p: Progress): number =>
  Object.values(p.items).filter(isStrong).length
