import type { LangCode } from './data/languages'

export type AgeGroup = 'kecil' | 'sedang' | 'besar'

export interface AgeProfile {
  id: AgeGroup
  label: string
  range: string
  emoji: string
  /** Jumlah pilihan pada kuis kosakata */
  choices: number
  /** Aktifkan mode mengeja (ketik) di latihan menulis */
  spelling: boolean
  /** Aktifkan percakapan bebas di latihan berbicara */
  freeTalk: boolean
}

export const AGE_PROFILES: AgeProfile[] = [
  {
    id: 'kecil',
    label: 'Petualang Kecil',
    range: '3–5 tahun',
    emoji: '🐣',
    choices: 2,
    spelling: false,
    freeTalk: false,
  },
  {
    id: 'sedang',
    label: 'Penjelajah',
    range: '6–8 tahun',
    emoji: '🦊',
    choices: 3,
    spelling: false,
    freeTalk: true,
  },
  {
    id: 'besar',
    label: 'Juara Bahasa',
    range: '9–12 tahun',
    emoji: '🦁',
    choices: 4,
    spelling: true,
    freeTalk: true,
  },
]

export const getAgeProfile = (id: AgeGroup): AgeProfile =>
  AGE_PROFILES.find((a) => a.id === id) ?? AGE_PROFILES[1]

export interface Profile {
  name: string
  age: number
  ageGroup: AgeGroup
  avatar: string
  language: LangCode
}

export type SkillId =
  | 'kosakata'
  | 'berbicara'
  | 'menulis'
  | 'pelafalan'
  | 'mendengar'
  | 'membaca'
  | 'cerita'
  | 'memory'

export interface SkillInfo {
  id: SkillId
  title: string
  subtitle: string
  emoji: string
  color: string
  color2: string
}

export const SKILLS: SkillInfo[] = [
  {
    id: 'kosakata',
    title: 'Kosakata',
    subtitle: 'Tebak kata & gambar',
    emoji: '🧩',
    color: '#FF9600',
    color2: '#FFF1DD',
  },
  {
    id: 'pelafalan',
    title: 'Pelafalan',
    subtitle: 'Dengar & tirukan',
    emoji: '🎧',
    color: '#16C7B0',
    color2: '#E2F8F5',
  },
  {
    id: 'berbicara',
    title: 'Berbicara',
    subtitle: 'Ngobrol bareng Kiko',
    emoji: '🎤',
    color: '#FF3D9A',
    color2: '#FFE8F3',
  },
  {
    id: 'menulis',
    title: 'Menulis',
    subtitle: 'Jiplak & eja huruf',
    emoji: '✏️',
    color: '#A55BFF',
    color2: '#F3EBFF',
  },
  {
    id: 'mendengar',
    title: 'Mendengar',
    subtitle: 'Dengar lalu pilih',
    emoji: '👂',
    color: '#1CB0F6',
    color2: '#E4F5FE',
  },
  {
    id: 'membaca',
    title: 'Membaca',
    subtitle: 'Cocokkan tulisan',
    emoji: '📖',
    color: '#58CC02',
    color2: '#ECF9DD',
  },
  {
    id: 'cerita',
    title: 'Cerita',
    subtitle: 'Ikuti cerita mini',
    emoji: '🌟',
    color: '#FF7A3D',
    color2: '#FFEEE4',
  },
  {
    id: 'memory',
    title: 'Memory',
    subtitle: 'Pasangkan kartu',
    emoji: '🃏',
    color: '#E93B3B',
    color2: '#FFE9E7',
  },
]

export const getSkill = (id: SkillId): SkillInfo =>
  SKILLS.find((s) => s.id === id) ?? SKILLS[0]

/** Umpan balik terstruktur dari AI Tutor. */
export interface TutorFeedback {
  /** Pujian singkat, selalu ada */
  praise: string
  /** Satu tips konkret untuk memperbaiki */
  tip: string
  /** Bentuk yang benar dalam bahasa target (boleh kosong) */
  correction: string
  /** Balasan Kiko dalam bahasa target (untuk mode berbicara) */
  reply: string
  /** Arti balasan dalam Bahasa Indonesia */
  replyMeaning: string
  /** Pertanyaan lanjutan agar percakapan berjalan */
  followUp: string
  /** 1–3 bintang */
  stars: number
  emoji: string
  /** true bila jawaban berasal dari tutor offline (tanpa API) */
  offline?: boolean
}
