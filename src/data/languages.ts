export type LangCode = 'en' | 'zh' | 'ar' | 'ko' | 'ja'

export interface LanguageInfo {
  code: LangCode
  /** Nama bahasa dalam Bahasa Indonesia */
  name: string
  /** Nama asli, ditampilkan kecil di bawah nama */
  nativeName: string
  flag: string
  /** BCP-47, dipakai untuk text-to-speech & pengenalan suara */
  speechLang: string
  /** Aksara latin? Menentukan mode menulis (jiplak vs eja) */
  latinScript: boolean
  /** Arah tulisan */
  rtl: boolean
  color: string
  color2: string
}

export const LANGUAGES: LanguageInfo[] = [
  {
    code: 'en',
    name: 'Bahasa Inggris',
    nativeName: 'English',
    flag: '🇬🇧',
    speechLang: 'en-US',
    latinScript: true,
    rtl: false,
    color: '#1CB0F6',
    color2: '#E4F5FE',
  },
  {
    code: 'zh',
    name: 'Bahasa Mandarin',
    nativeName: '中文',
    flag: '🇨🇳',
    speechLang: 'zh-CN',
    latinScript: false,
    rtl: false,
    color: '#E93B3B',
    color2: '#FFE9E7',
  },
  {
    code: 'ar',
    name: 'Bahasa Arab',
    nativeName: 'العربية',
    flag: '🇸🇦',
    speechLang: 'ar-SA',
    latinScript: false,
    rtl: true,
    color: '#16C7B0',
    color2: '#E2F8F5',
  },
  {
    code: 'ko',
    name: 'Bahasa Korea',
    nativeName: '한국어',
    flag: '🇰🇷',
    speechLang: 'ko-KR',
    latinScript: false,
    rtl: false,
    color: '#A55BFF',
    color2: '#F3EBFF',
  },
  {
    code: 'ja',
    name: 'Bahasa Jepang',
    nativeName: '日本語',
    flag: '🇯🇵',
    speechLang: 'ja-JP',
    latinScript: false,
    rtl: false,
    color: '#FF3D9A',
    color2: '#FFE8F3',
  },
]

export const getLanguage = (code: LangCode): LanguageInfo =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]

/** Slug URL Bahasa Indonesia untuk tiap bahasa, mis. en → "inggris". */
export const LANG_SLUG: Record<LangCode, string> = {
  en: 'inggris',
  zh: 'mandarin',
  ar: 'arab',
  ko: 'korea',
  ja: 'jepang',
}

const SLUG_TO_CODE = Object.fromEntries(
  Object.entries(LANG_SLUG).map(([code, slug]) => [slug, code as LangCode]),
) as Record<string, LangCode>

export const langFromSlug = (slug?: string): LangCode | null =>
  slug ? (SLUG_TO_CODE[slug] ?? null) : null
