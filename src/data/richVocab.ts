import { THEMES } from './curriculum'
import type { LangCode } from './languages'
import { EN_CATEGORIES } from './enVocab'
import type { EnCategory, EnWord, Level } from './enVocab'

/**
 * Konten "kaya" untuk bahasa selain Inggris (Mandarin, Arab, Korea, Jepang).
 *
 * Teks kata & cara bacanya diambil dari curriculum.ts yang SUDAH tervalidasi
 * sejak awal proyek. Yang ditambahkan di sini hanya: tingkat kesulitan, fakta
 * ramah anak (Bahasa Indonesia, sama untuk semua bahasa karena membahas
 * konsepnya), dan contoh kalimat sederhana per bahasa.
 *
 * ⚠️ Contoh kalimat non-Inggris ditulis sengaja sangat sederhana untuk
 * meminimalkan risiko kesalahan. Sebaiknya tetap ditinjau penutur asli sebelum
 * dipakai luas. Bahasa Inggris memakai dataset terpisah (enVocab.ts, 20 kategori).
 */

type ExLang = Exclude<LangCode, 'en'> // 'zh' | 'ar' | 'ko' | 'ja'

interface Sentence {
  s: string
  t: string
}

interface Extra {
  level: Level
  fact: string
  ex: Record<ExLang, Sentence>
}

const s = (sentence: string, translation: string): Sentence => ({ s: sentence, t: translation })

/** Data tambahan per konsep (id sama dengan curriculum.ts). */
const EXTRA: Record<string, Extra> = {
  /* ---- Hewan ---- */
  cat: {
    level: 'pemula',
    fact: 'Kucing tidur sampai 16 jam sehari!',
    ex: {
      zh: s('这是猫。', 'Ini kucing.'),
      ar: s('هذه قطة.', 'Ini kucing.'),
      ko: s('이것은 고양이예요.', 'Ini kucing.'),
      ja: s('これはねこです。', 'Ini kucing.'),
    },
  },
  dog: {
    level: 'pemula',
    fact: 'Penciuman anjing jauh lebih tajam dari manusia.',
    ex: {
      zh: s('这是狗。', 'Ini anjing.'),
      ar: s('هذا كلب.', 'Ini anjing.'),
      ko: s('이것은 개예요.', 'Ini anjing.'),
      ja: s('これはいぬです。', 'Ini anjing.'),
    },
  },
  bird: {
    level: 'menengah',
    fact: 'Beberapa burung bisa menirukan suara manusia!',
    ex: {
      zh: s('这是鸟。', 'Ini burung.'),
      ar: s('هذا عصفور.', 'Ini burung.'),
      ko: s('이것은 새예요.', 'Ini burung.'),
      ja: s('これはとりです。', 'Ini burung.'),
    },
  },
  fish: {
    level: 'menengah',
    fact: 'Ikan tidur dengan mata terbuka.',
    ex: {
      zh: s('这是鱼。', 'Ini ikan.'),
      ar: s('هذه سمكة.', 'Ini ikan.'),
      ko: s('이것은 물고기예요.', 'Ini ikan.'),
      ja: s('これはさかなです。', 'Ini ikan.'),
    },
  },
  elephant: {
    level: 'mahir',
    fact: 'Gajah menyapa temannya dengan belalai.',
    ex: {
      zh: s('这是大象。', 'Ini gajah.'),
      ar: s('هذا فيل.', 'Ini gajah.'),
      ko: s('이것은 코끼리예요.', 'Ini gajah.'),
      ja: s('これはぞうです。', 'Ini gajah.'),
    },
  },
  rabbit: {
    level: 'mahir',
    fact: 'Gigi kelinci tumbuh terus sepanjang hidupnya.',
    ex: {
      zh: s('这是兔子。', 'Ini kelinci.'),
      ar: s('هذا أرنب.', 'Ini kelinci.'),
      ko: s('이것은 토끼예요.', 'Ini kelinci.'),
      ja: s('これはうさぎです。', 'Ini kelinci.'),
    },
  },

  /* ---- Warna ---- */
  red: {
    level: 'pemula',
    fact: 'Merah adalah warna yang paling mudah dilihat mata.',
    ex: {
      zh: s('我喜欢红色。', 'Aku suka merah.'),
      ar: s('أحب اللون الأحمر.', 'Aku suka warna merah.'),
      ko: s('저는 빨강을 좋아해요.', 'Aku suka merah.'),
      ja: s('あかがすきです。', 'Aku suka merah.'),
    },
  },
  blue: {
    level: 'pemula',
    fact: 'Langit terlihat biru karena cahaya matahari.',
    ex: {
      zh: s('我喜欢蓝色。', 'Aku suka biru.'),
      ar: s('أحب اللون الأزرق.', 'Aku suka warna biru.'),
      ko: s('저는 파랑을 좋아해요.', 'Aku suka biru.'),
      ja: s('あおがすきです。', 'Aku suka biru.'),
    },
  },
  yellow: {
    level: 'menengah',
    fact: 'Lebah sangat menyukai bunga kuning.',
    ex: {
      zh: s('我喜欢黄色。', 'Aku suka kuning.'),
      ar: s('أحب اللون الأصفر.', 'Aku suka warna kuning.'),
      ko: s('저는 노랑을 좋아해요.', 'Aku suka kuning.'),
      ja: s('きいろがすきです。', 'Aku suka kuning.'),
    },
  },
  green: {
    level: 'menengah',
    fact: 'Daun hijau karena mengandung klorofil.',
    ex: {
      zh: s('我喜欢绿色。', 'Aku suka hijau.'),
      ar: s('أحب اللون الأخضر.', 'Aku suka warna hijau.'),
      ko: s('저는 초록을 좋아해요.', 'Aku suka hijau.'),
      ja: s('みどりがすきです。', 'Aku suka hijau.'),
    },
  },
  black: {
    level: 'mahir',
    fact: 'Warna hitam menyerap semua cahaya.',
    ex: {
      zh: s('我喜欢黑色。', 'Aku suka hitam.'),
      ar: s('أحب اللون الأسود.', 'Aku suka warna hitam.'),
      ko: s('저는 검정을 좋아해요.', 'Aku suka hitam.'),
      ja: s('くろがすきです。', 'Aku suka hitam.'),
    },
  },
  white: {
    level: 'mahir',
    fact: 'Putih adalah gabungan semua warna pelangi.',
    ex: {
      zh: s('我喜欢白色。', 'Aku suka putih.'),
      ar: s('أحب اللون الأبيض.', 'Aku suka warna putih.'),
      ko: s('저는 하양을 좋아해요.', 'Aku suka putih.'),
      ja: s('しろがすきです。', 'Aku suka putih.'),
    },
  },

  /* ---- Angka ---- */
  one: {
    level: 'pemula',
    fact: 'Satu adalah angka pertama saat berhitung.',
    ex: {
      zh: s('数一数：一！', 'Ayo berhitung: satu!'),
      ar: s('عُدّ: واحد!', 'Ayo berhitung: satu!'),
      ko: s('세어 봐요: 하나!', 'Ayo berhitung: satu!'),
      ja: s('かぞえよう：いち！', 'Ayo berhitung: satu!'),
    },
  },
  two: {
    level: 'pemula',
    fact: 'Kita punya dua mata untuk melihat dengan jelas.',
    ex: {
      zh: s('数一数：二！', 'Ayo berhitung: dua!'),
      ar: s('عُدّ: اثنان!', 'Ayo berhitung: dua!'),
      ko: s('세어 봐요: 둘!', 'Ayo berhitung: dua!'),
      ja: s('かぞえよう：に！', 'Ayo berhitung: dua!'),
    },
  },
  three: {
    level: 'pemula',
    fact: 'Segitiga punya tiga sisi.',
    ex: {
      zh: s('数一数：三！', 'Ayo berhitung: tiga!'),
      ar: s('عُدّ: ثلاثة!', 'Ayo berhitung: tiga!'),
      ko: s('세어 봐요: 셋!', 'Ayo berhitung: tiga!'),
      ja: s('かぞえよう：さん！', 'Ayo berhitung: tiga!'),
    },
  },
  four: {
    level: 'menengah',
    fact: 'Meja biasanya berdiri di atas empat kaki.',
    ex: {
      zh: s('数一数：四！', 'Ayo berhitung: empat!'),
      ar: s('عُدّ: أربعة!', 'Ayo berhitung: empat!'),
      ko: s('세어 봐요: 넷!', 'Ayo berhitung: empat!'),
      ja: s('かぞえよう：よん！', 'Ayo berhitung: empat!'),
    },
  },
  five: {
    level: 'menengah',
    fact: 'Satu tangan punya lima jari.',
    ex: {
      zh: s('数一数：五！', 'Ayo berhitung: lima!'),
      ar: s('عُدّ: خمسة!', 'Ayo berhitung: lima!'),
      ko: s('세어 봐요: 다섯!', 'Ayo berhitung: lima!'),
      ja: s('かぞえよう：ご！', 'Ayo berhitung: lima!'),
    },
  },
  six: {
    level: 'mahir',
    fact: 'Semua serangga punya enam kaki.',
    ex: {
      zh: s('数一数：六！', 'Ayo berhitung: enam!'),
      ar: s('عُدّ: ستة!', 'Ayo berhitung: enam!'),
      ko: s('세어 봐요: 여섯!', 'Ayo berhitung: enam!'),
      ja: s('かぞえよう：ろく！', 'Ayo berhitung: enam!'),
    },
  },

  /* ---- Keluarga ---- */
  mother: {
    level: 'pemula',
    fact: 'Kata "mama" mirip di banyak bahasa dunia.',
    ex: {
      zh: s('这是我的妈妈。', 'Ini ibuku.'),
      ar: s('هذه ماما.', 'Ini ibu.'),
      ko: s('우리 엄마예요.', 'Ini ibuku.'),
      ja: s('これはおかあさんです。', 'Ini ibu.'),
    },
  },
  father: {
    level: 'pemula',
    fact: 'Kata "papa" juga terdengar mirip di banyak bahasa.',
    ex: {
      zh: s('这是我的爸爸。', 'Ini ayahku.'),
      ar: s('هذا بابا.', 'Ini ayah.'),
      ko: s('우리 아빠예요.', 'Ini ayahku.'),
      ja: s('これはおとうさんです。', 'Ini ayah.'),
    },
  },
  sister: {
    level: 'menengah',
    fact: 'Kakak perempuan senang menjaga adiknya.',
    ex: {
      zh: s('这是我的姐姐。', 'Ini kakak perempuanku.'),
      ar: s('هذه أختي.', 'Ini saudari perempuanku.'),
      ko: s('우리 언니예요.', 'Ini kakak perempuanku.'),
      ja: s('これはおねえさんです。', 'Ini kakak perempuan.'),
    },
  },
  brother: {
    level: 'menengah',
    fact: 'Kakak laki-laki suka mengajak bermain.',
    ex: {
      zh: s('这是我的哥哥。', 'Ini kakak laki-lakiku.'),
      ar: s('هذا أخي.', 'Ini saudara laki-lakiku.'),
      ko: s('우리 형이에요.', 'Ini kakak laki-lakiku.'),
      ja: s('これはおにいさんです。', 'Ini kakak laki-laki.'),
    },
  },
  grandma: {
    level: 'mahir',
    fact: 'Nenek sering punya banyak cerita seru.',
    ex: {
      zh: s('这是我的奶奶。', 'Ini nenekku.'),
      ar: s('هذه جدتي.', 'Ini nenekku.'),
      ko: s('우리 할머니예요.', 'Ini nenekku.'),
      ja: s('これはおばあさんです。', 'Ini nenek.'),
    },
  },
  baby: {
    level: 'mahir',
    fact: 'Bayi bisa menangis tapi belum bisa bicara.',
    ex: {
      zh: s('这是宝宝。', 'Ini bayi.'),
      ar: s('هذا طفل صغير.', 'Ini bayi kecil.'),
      ko: s('이것은 아기예요.', 'Ini bayi.'),
      ja: s('これはあかちゃんです。', 'Ini bayi.'),
    },
  },

  /* ---- Makanan ---- */
  rice: {
    level: 'pemula',
    fact: 'Setengah penduduk dunia makan nasi setiap hari.',
    ex: {
      zh: s('我吃米饭。', 'Aku makan nasi.'),
      ar: s('آكل الأرز.', 'Aku makan nasi.'),
      ko: s('저는 밥을 먹어요.', 'Aku makan nasi.'),
      ja: s('ごはんをたべます。', 'Aku makan nasi.'),
    },
  },
  bread: {
    level: 'pemula',
    fact: 'Roti dibuat dari tepung, air, dan ragi.',
    ex: {
      zh: s('我吃面包。', 'Aku makan roti.'),
      ar: s('آكل الخبز.', 'Aku makan roti.'),
      ko: s('저는 빵을 먹어요.', 'Aku makan roti.'),
      ja: s('パンをたべます。', 'Aku makan roti.'),
    },
  },
  apple: {
    level: 'menengah',
    fact: 'Apel mengapung di air karena berisi udara.',
    ex: {
      zh: s('我喜欢苹果。', 'Aku suka apel.'),
      ar: s('آكل التفاحة.', 'Aku makan apel.'),
      ko: s('저는 사과를 먹어요.', 'Aku makan apel.'),
      ja: s('りんごをたべます。', 'Aku makan apel.'),
    },
  },
  milk: {
    level: 'menengah',
    fact: 'Susu membantu tulang kita menjadi kuat.',
    ex: {
      zh: s('我喝牛奶。', 'Aku minum susu.'),
      ar: s('أشرب الحليب.', 'Aku minum susu.'),
      ko: s('저는 우유를 마셔요.', 'Aku minum susu.'),
      ja: s('ミルクをのみます。', 'Aku minum susu.'),
    },
  },
  egg: {
    level: 'mahir',
    fact: 'Ayam bisa bertelur hampir setiap hari.',
    ex: {
      zh: s('我吃鸡蛋。', 'Aku makan telur.'),
      ar: s('آكل البيضة.', 'Aku makan telur.'),
      ko: s('저는 계란을 먹어요.', 'Aku makan telur.'),
      ja: s('たまごをたべます。', 'Aku makan telur.'),
    },
  },
  water: {
    level: 'mahir',
    fact: 'Lebih dari separuh tubuh kita adalah air.',
    ex: {
      zh: s('我喝水。', 'Aku minum air.'),
      ar: s('أشرب الماء.', 'Aku minum air.'),
      ko: s('저는 물을 마셔요.', 'Aku minum air.'),
      ja: s('みずをのみます。', 'Aku minum air.'),
    },
  },
}

/** Warna terang tipis untuk kartu, diturunkan dari warna tema. */
const tint = (hex: string) => `${hex}22`

function buildCategories(lang: ExLang): EnCategory[] {
  return THEMES.map((th) => ({
    id: th.id,
    title: th.title,
    emoji: th.emoji,
    color: th.color,
    color2: tint(th.color),
    words: th.concepts.map((c): EnWord => {
      const x = EXTRA[c.id]
      const term = c[lang]
      return {
        id: c.id,
        word: term.text,
        say: term.roman,
        meaning: c.meaning,
        emoji: c.emoji,
        level: x.level,
        example: x.ex[lang].s,
        exampleId: x.ex[lang].t,
        fact: x.fact,
      }
    }),
  }))
}

const CACHE: Partial<Record<LangCode, EnCategory[]>> = {
  zh: buildCategories('zh'),
  ar: buildCategories('ar'),
  ko: buildCategories('ko'),
  ja: buildCategories('ja'),
}

/** Kategori kaya untuk sebuah bahasa (Inggris = 20 kategori; lain = 5 tema). */
export function richCategories(lang: LangCode): EnCategory[] | null {
  if (lang === 'en') return EN_CATEGORIES
  return CACHE[lang] ?? null
}

export const hasRichContent = (lang: LangCode): boolean => richCategories(lang) !== null

export function getRichCategory(lang: LangCode, id?: string): EnCategory | undefined {
  return richCategories(lang)?.find((c) => c.id === id)
}

export function totalRichWords(lang: LangCode): number {
  return richCategories(lang)?.reduce((n, c) => n + c.words.length, 0) ?? 0
}
