import type { LangCode } from '../data/languages'
import { getLanguage } from '../data/languages'
import type { AgeGroup, SkillId, TutorFeedback } from '../types'
import { aiHeaders } from './settings'
import type { LearnerProfile } from './mastery'

export interface TutorRequest {
  skill: SkillId
  language: LangCode
  ageGroup: AgeGroup
  learnerName: string
  /** Yang seharusnya diucapkan/ditulis anak. Kosong pada obrolan bebas. */
  target: string
  targetRoman?: string
  targetMeaning?: string
  /** Yang benar-benar dilakukan anak */
  attempt: string
  /** Skor mentah 0–100 dari penilaian lokal (kemiripan/ketepatan garis) */
  score?: number
  /** Beberapa giliran terakhir percakapan (mode berbicara) */
  history?: { role: 'anak' | 'kiko'; text: string }[]
  /** 'bebas' = tidak ada kalimat target, Kiko memimpin percakapan */
  mode?: 'terpandu' | 'bebas'
  /** "Ingatan" Kiko tentang kemajuan dan kelemahan anak */
  profile?: LearnerProfile
}

/**
 * Minta umpan balik ke AI Tutor. Kalau server/API tidak tersedia,
 * pakai tutor cadangan yang berjalan sepenuhnya di perangkat supaya
 * anak tidak pernah menunggu layar kosong.
 */
export async function askTutor(req: TutorRequest): Promise<TutorFeedback> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20_000)
    const res = await fetch('/api/tutor', {
      method: 'POST',
      // BYOK: kunci pengguna ikut di header, bukan disimpan di server.
      headers: { 'Content-Type': 'application/json', ...aiHeaders() },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = (await res.json()) as Partial<TutorFeedback>
    return {
      praise: data.praise ?? 'Bagus sekali!',
      tip: data.tip ?? '',
      correction: data.correction ?? '',
      reply: data.reply ?? '',
      replyMeaning: data.replyMeaning ?? '',
      followUp: data.followUp ?? '',
      stars: clampStars(data.stars ?? starsFromScore(req.score ?? 70)),
      emoji: data.emoji ?? '🎉',
    }
  } catch {
    return offlineTutor(req)
  }
}

const clampStars = (n: number) => Math.max(1, Math.min(3, Math.round(n)))

export function starsFromScore(score: number): number {
  if (score >= 85) return 3
  if (score >= 60) return 2
  return 1
}

/* ------------------------------------------------------------------ */
/* Ringkasan untuk orang tua                                           */
/* ------------------------------------------------------------------ */

export interface Insight {
  summary: string
  strengths: string[]
  focus: string[]
  activity: string
  offline?: boolean
}

export interface InsightRequest {
  language: LangCode
  ageGroup: AgeGroup
  learnerName: string
  profile: LearnerProfile
  streak: number
  totalStars: number
}

export async function askInsight(req: InsightRequest): Promise<Insight> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 25_000)
    const res = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...aiHeaders() },
      body: JSON.stringify(req),
      signal: ctrl.signal,
    })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`status ${res.status}`)
    const data = (await res.json()) as Partial<Insight>
    return {
      summary: data.summary ?? '',
      strengths: data.strengths ?? [],
      focus: data.focus ?? [],
      activity: data.activity ?? '',
    }
  } catch {
    return offlineInsight(req)
  }
}

/** Ringkasan tanpa AI: dihitung dari angka yang sudah ada di perangkat. */
export function offlineInsight(req: InsightRequest): Insight {
  const p = req.profile
  const lang = getLanguage(req.language)
  const levelText =
    p.level === 'sulit'
      ? 'sudah siap ditantang lebih'
      : p.level === 'mudah'
        ? 'sedang butuh banyak pengulangan'
        : 'berkembang dengan stabil'

  return {
    summary:
      p.wordsSeen === 0
        ? `${req.learnerName} belum menyelesaikan latihan ${lang.name}. Ajak mulai dari tema Hewan, ya.`
        : `${req.learnerName} sudah mencoba ${p.wordsSeen} kata ${lang.name} dengan ketepatan ${p.accuracy}%, dan ${p.wordsStrong} kata sudah kuat. Ia ${levelText}.`,
    strengths: p.strongWords.length
      ? [`Kata yang sudah lancar: ${p.strongWords.join(', ')}.`]
      : ['Kemauan mencoba adalah kekuatan terbesarnya saat ini.'],
    focus: p.weakWords.length
      ? p.weakWords.map(
          (w) => `${w.roman} (${w.meaning}) masih sering meleset — ulangi pelan-pelan.`,
        )
      : ['Belum ada kata yang menonjol sulit. Tambah tema baru saja.'],
    activity: p.weakWords.length
      ? `Main tebak-tebakan di rumah: sebutkan "${p.weakWords[0].meaning}" dalam ${lang.name} setiap kali menemuinya hari ini.`
      : `Ajak menyebut 3 benda di rumah dalam ${lang.name} sebelum tidur.`,
    offline: true,
  }
}

/* ------------------------------------------------------------------ */
/* Tutor cadangan (tanpa API)                                          */
/* ------------------------------------------------------------------ */

const PRAISE_HIGH = [
  'Wah, keren banget!',
  'Hebat! Kiko sampai bertepuk tangan 👏',
  'Mantap! Suaramu jelas sekali.',
  'Luar biasa! Kamu cepat belajar.',
]
const PRAISE_MID = [
  'Bagus, sudah hampir tepat!',
  'Sedikit lagi, kamu pasti bisa!',
  'Kiko suka usahamu!',
  'Nyaris sempurna, ayo ulangi sekali lagi.',
]
const PRAISE_LOW = [
  'Tidak apa-apa, mencoba itu keren!',
  'Ayo kita coba pelan-pelan bersama.',
  'Kiko akan bantu, dengarkan sekali lagi ya.',
  'Setiap juara pernah mencoba berkali-kali!',
]

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function offlineTutor(req: TutorRequest): TutorFeedback {
  const lang = getLanguage(req.language)
  const score = req.score ?? 70
  const stars = starsFromScore(score)
  const say = req.targetRoman ? `"${req.targetRoman}"` : `"${req.target}"`

  let tip = ''
  if (score >= 85) {
    tip =
      req.skill === 'menulis'
        ? 'Garismu rapi. Coba tulis lebih besar supaya makin jelas.'
        : `Sekarang coba ucapkan ${say} lebih cepat sedikit, seperti Kiko.`
  } else if (score >= 60) {
    tip =
      req.skill === 'menulis'
        ? 'Ikuti garis abu-abu dari awal sampai akhir, jangan terputus.'
        : `Dengarkan Kiko sekali lagi, lalu tirukan bagian awal ${say}.`
  } else {
    tip =
      req.skill === 'menulis'
        ? 'Tekan tombol 🔊 lalu jiplak pelan-pelan mengikuti bentuk hurufnya.'
        : `Tekan tombol 🔊, dengarkan baik-baik, lalu ucapkan ${say} pelan-pelan.`
  }

  // Sedikit "ingatan" bahkan tanpa AI: sebut kata lemah yang sedang diulang.
  const weak = req.profile?.weakWords?.[0]
  if (weak && score < 85 && req.skill !== 'berbicara') {
    tip += ` Nanti kita ulang "${weak.roman}" juga, ya.`
  }

  const praise =
    score >= 85 ? pick(PRAISE_HIGH) : score >= 60 ? pick(PRAISE_MID) : pick(PRAISE_LOW)

  return {
    praise,
    tip,
    correction: score >= 85 ? '' : req.target,
    reply: req.skill === 'berbicara' ? req.target : '',
    replyMeaning:
      req.skill === 'berbicara' && req.targetMeaning ? req.targetMeaning : '',
    followUp: req.skill === 'berbicara' ? `Ayo ucapkan lagi dalam ${lang.name}!` : '',
    stars,
    emoji: score >= 85 ? '🌟' : score >= 60 ? '💪' : '🤗',
    offline: true,
  }
}
