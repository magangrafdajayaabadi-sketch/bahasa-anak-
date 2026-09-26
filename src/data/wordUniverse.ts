import type { LangCode } from './languages'
import { THEMES } from './curriculum'
import { EN_CATEGORIES } from './enVocab'

/**
 * Satu bentuk seragam untuk semua kata yang penguasaannya dilacak, apa pun
 * sumbernya. Ini menyatukan dua kurikulum: kurikulum lintas-bahasa lama
 * (curriculum.ts) dan kosakata Inggris kaya (enVocab.ts), sehingga hitungan
 * progres (beranda, panel orang tua, ingatan AI) memakai angka yang sama.
 */
export interface UniWord {
  id: string
  text: string
  roman: string
  meaning: string
  emoji: string
}

const EN_UNIVERSE: UniWord[] = EN_CATEGORIES.flatMap((c) =>
  c.words.map((w) => ({
    id: w.id,
    text: w.word,
    roman: w.say,
    meaning: w.meaning,
    emoji: w.emoji,
  })),
)

/** Seluruh kata yang bisa dilatih untuk sebuah bahasa. */
export function wordUniverse(lang: LangCode): UniWord[] {
  // Bahasa Inggris memakai 20 kategori (242 kata); bahasa lain masih memakai
  // kurikulum 5 tema (30 kata) sampai halaman khususnya dibuat.
  if (lang === 'en') return EN_UNIVERSE
  return THEMES.flatMap((t) =>
    t.concepts.map((c) => ({
      id: c.id,
      text: c[lang].text,
      roman: c[lang].roman,
      meaning: c.meaning,
      emoji: c.emoji,
    })),
  )
}

/** Kategori/tema untuk sebuah bahasa — dipakai mesin rekomendasi. */
export interface UniCategory {
  id: string
  title: string
  emoji: string
  wordIds: string[]
}

const EN_CATEGORY_UNIVERSE: UniCategory[] = EN_CATEGORIES.map((c) => ({
  id: c.id,
  title: c.title,
  emoji: c.emoji,
  wordIds: c.words.map((w) => w.id),
}))

export function categoryUniverse(lang: LangCode): UniCategory[] {
  if (lang === 'en') return EN_CATEGORY_UNIVERSE
  return THEMES.map((t) => ({
    id: t.id,
    title: t.title,
    emoji: t.emoji,
    wordIds: t.concepts.map((c) => c.id),
  }))
}

export const categoryById = (lang: LangCode, id: string): UniCategory | undefined =>
  categoryUniverse(lang).find((c) => c.id === id)
