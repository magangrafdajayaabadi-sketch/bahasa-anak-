import type { EnWord } from './enVocab'
import type { LangCode } from './languages'

export type LessonSkill =
  | 'vocab'
  | 'pelafalan'
  | 'menulis'
  | 'mendengar'
  | 'membaca'
  | 'cerita'
  | 'memory'

export interface MaterialNote {
  emoji: string
  title: string
  body: string
}

const TARGET_LANGS = new Set<LangCode>(['zh', 'ar', 'ja', 'ko'])

export function hasExtraMaterials(lang: LangCode): boolean {
  return TARGET_LANGS.has(lang)
}

const PRIMERS: Record<LangCode, MaterialNote[]> = {
  en: [],
  zh: [
    {
      emoji: '🎵',
      title: 'Nada mengubah arti',
      body: 'Mandarin punya empat nada utama. Tanda di pinyin membantu mulut naik, datar, turun-naik, atau turun tegas.',
    },
    {
      emoji: '字',
      title: 'Karakter adalah blok makna',
      body: 'Banyak kata tersusun dari karakter kecil. Coba cari bagian yang berulang, seperti 色 untuk warna.',
    },
  ],
  ar: [
    {
      emoji: '↩',
      title: 'Dibaca dari kanan',
      body: 'Arab dibaca dan ditulis dari kanan ke kiri. Harakat kecil membantu anak tahu bunyi pendeknya.',
    },
    {
      emoji: '🌱',
      title: 'Akar kata',
      body: 'Banyak kata Arab berasal dari tiga huruf akar. Bentuk kata berubah, tetapi keluarganya sering tetap terasa.',
    },
  ],
  ja: [
    {
      emoji: 'かな',
      title: 'Kana dulu',
      body: 'Materi Jepang memakai hiragana dan katakana. Katakana biasanya muncul pada kata serapan seperti ライオン.',
    },
    {
      emoji: '🔹',
      title: 'Partikel kecil penting',
      body: 'Huruf kecil seperti は, が, dan を menandai peran kata dalam kalimat. Anak cukup kenali polanya dulu.',
    },
  ],
  ko: [
    {
      emoji: '한',
      title: 'Hangeul berbentuk blok',
      body: 'Huruf Korea disusun menjadi kotak suku kata. Contohnya 한 berisi ㅎ, ㅏ, dan ㄴ.',
    },
    {
      emoji: '요',
      title: 'Bentuk sopan sehari-hari',
      body: 'Banyak contoh memakai akhiran 요, bentuk sopan yang aman dan sering dipakai anak-anak.',
    },
  ],
}

const CATEGORY_NOTES: Partial<Record<LangCode, Record<string, MaterialNote>>> = {
  zh: {
    angka: {
      emoji: '🔢',
      title: 'Angka Mandarin teratur',
      body: 'Sebelas adalah 十一, harfiah "sepuluh satu". Pola ini membuat angka besar lebih mudah ditebak.',
    },
    warna: {
      emoji: '🎨',
      title: 'Akhiran 色',
      body: 'Banyak nama warna berakhir dengan 色 (se), yang berarti "warna".',
    },
    keluarga: {
      emoji: '👪',
      title: 'Panggilan keluarga spesifik',
      body: 'Mandarin membedakan kakak/adik dan pihak ayah/ibu lebih rinci daripada Bahasa Indonesia.',
    },
  },
  ar: {
    angka: {
      emoji: '٢',
      title: 'Ada bentuk khusus untuk dua',
      body: 'Bahasa Arab punya mutsanna, bentuk khusus untuk dua benda, misalnya tangan menjadi يَدَانِ.',
    },
    warna: {
      emoji: '🎨',
      title: 'Warna mengikuti jenis kata',
      body: 'Beberapa warna punya bentuk maskulin dan feminin, misalnya أَحْمَر dan حَمْرَاء.',
    },
    tempat: {
      emoji: '📍',
      title: 'Pola tempat',
      body: 'Banyak nama tempat memakai pola مَـ, seperti مَدْرَسَة untuk tempat belajar.',
    },
  },
  ja: {
    angka: {
      emoji: '🔢',
      title: 'Dua sistem angka',
      body: 'Jepang memakai angka asli seperti ひとつ dan angka Sino-Jepang seperti いち, tergantung konteks.',
    },
    makanan: {
      emoji: '🍙',
      title: 'Kata serapan pakai katakana',
      body: 'Makanan modern atau serapan sering ditulis katakana, misalnya ケーキ.',
    },
    keluarga: {
      emoji: '👪',
      title: 'Sopan dan akrab',
      body: 'Panggilan keluarga berubah tergantung bicara tentang keluarga sendiri atau orang lain.',
    },
  },
  ko: {
    angka: {
      emoji: '🔢',
      title: 'Dua sistem angka',
      body: 'Korea memakai angka asli Korea dan angka Sino-Korea. Keduanya muncul di situasi berbeda.',
    },
    keluarga: {
      emoji: '👪',
      title: 'Panggilan bergantung pembicara',
      body: 'Kakak perempuan bisa disebut 언니 atau 누나, tergantung yang memanggil anak perempuan atau laki-laki.',
    },
    makanan: {
      emoji: '🍚',
      title: 'Kata majemuk mudah dicari',
      body: 'Banyak kata Korea tersusun jelas, seperti 물고기: 물 berarti air dan 고기 berarti daging.',
    },
  },
}

const SKILL_NOTES: Partial<Record<LangCode, Partial<Record<LessonSkill, MaterialNote>>>> = {
  en: {
    mendengar: {
      emoji: '👂',
      title: 'Dengar awal dan akhir kata',
      body: 'Dalam Inggris, akhir kata sering pendek. Dengar bunyi awal, lalu cek bunyi terakhir sebelum memilih.',
    },
  },
  zh: {
    vocab: {
      emoji: '👀',
      title: 'Lihat bentuk karakter',
      body: 'Cari karakter yang sama di kata berbeda. Itu membantu anak mengingat makna tanpa menghafal kosong.',
    },
    pelafalan: {
      emoji: '🎵',
      title: 'Ikuti nada pinyin',
      body: 'Ucapkan nada lebih pelan dulu. Nada salah bisa mengubah arti kata.',
    },
    menulis: {
      emoji: '笔',
      title: 'Tulis sebagai blok',
      body: 'Arah goresan Mandarin biasanya dari atas ke bawah dan kiri ke kanan. Di sini fokusnya mengenali bentuk.',
    },
    mendengar: {
      emoji: '👂',
      title: 'Dengar nada dan bunyi awal',
      body: 'Tangkap bunyi awal dan nada pinyin dulu, lalu cocokkan dengan gambar. Tidak perlu buru-buru.',
    },
    membaca: {
      emoji: '眼',
      title: 'Cari bagian yang dikenal',
      body: 'Saat membaca karakter, cari bentuk yang pernah muncul. Karakter berulang sering memberi petunjuk makna.',
    },
    cerita: {
      emoji: '📖',
      title: 'Gunakan konteks kalimat',
      body: 'Anak tidak perlu paham semua karakter. Cari kata utama, gambar, dan arti kalimat Indonesianya.',
    },
    memory: {
      emoji: '🧠',
      title: 'Pasangkan suara, bentuk, arti',
      body: 'Saat membuka kartu karakter, ucapkan pinyinnya pelan lalu bayangkan gambarnya.',
    },
  },
  ar: {
    vocab: {
      emoji: '◌َ',
      title: 'Harakat adalah petunjuk bunyi',
      body: 'Fathah berbunyi a, kasrah berbunyi i, dammah berbunyi u. Bacalah tanda kecilnya bersama huruf.',
    },
    pelafalan: {
      emoji: 'ح',
      title: 'Bunyi tenggorokan pelan-pelan',
      body: 'Beberapa bunyi Arab keluar dari tenggorokan. Jangan dipaksa; dengarkan lalu tirukan sedikit demi sedikit.',
    },
    menulis: {
      emoji: '↩',
      title: 'Mulai dari kanan',
      body: 'Tulisan Arab bergerak dari kanan ke kiri. Perhatikan titik huruf karena titik bisa mengubah huruf.',
    },
    mendengar: {
      emoji: '👂',
      title: 'Dengar harakat pendek',
      body: 'Perhatikan bunyi a, i, dan u yang pendek. Harakat kecil sering menjadi kunci membedakan kata.',
    },
    membaca: {
      emoji: 'ب',
      title: 'Titik huruf itu penting',
      body: 'Banyak huruf Arab mirip bentuknya. Titik di atas atau bawah membantu anak membedakannya.',
    },
    cerita: {
      emoji: '📖',
      title: 'Baca dari kanan bersama konteks',
      body: 'Ikuti kalimat dari kanan ke kiri, lalu cari kata yang cocok dengan gambar utama.',
    },
    memory: {
      emoji: '🧠',
      title: 'Ingat bentuk dan titik',
      body: 'Saat memasangkan kartu, sebutkan cara baca latin sambil melihat titik huruf Arabnya.',
    },
  },
  ja: {
    vocab: {
      emoji: 'かな',
      title: 'Kenali hiragana dan katakana',
      body: 'Hiragana terasa seperti kata asli Jepang; katakana sering untuk kata serapan dan bunyi asing.',
    },
    pelafalan: {
      emoji: '⏱',
      title: 'Panjang bunyi penting',
      body: 'Vokal panjang seperti おう ditahan sedikit lebih lama. Panjang pendek bisa membedakan kata.',
    },
    menulis: {
      emoji: 'あ',
      title: 'Kana punya urutan goresan',
      body: 'Ikuti bentuk besar dulu. Setelah hafal, anak bisa belajar urutan goresan yang benar.',
    },
    mendengar: {
      emoji: '👂',
      title: 'Dengar suku kata',
      body: 'Jepang enak dipecah per suku kata: ne-ko, sa-ka-na, o-ka-a-san.',
    },
    membaca: {
      emoji: 'かな',
      title: 'Baca kana perlahan',
      body: 'Hiragana dan katakana dibaca per bunyi kecil. Jangan tebak sekaligus satu kata panjang.',
    },
    cerita: {
      emoji: '📖',
      title: 'Perhatikan partikel',
      body: 'Partikel seperti は, が, dan を membantu menebak siapa melakukan apa dalam cerita.',
    },
    memory: {
      emoji: '🧠',
      title: 'Kelompokkan kana mirip',
      body: 'Saat mencari pasangan, ucapkan kana keras-keras agar bentuk dan bunyinya menempel bersama.',
    },
  },
  ko: {
    vocab: {
      emoji: '한',
      title: 'Baca per blok suku kata',
      body: 'Setiap blok Hangeul biasanya satu suku kata. Pecah kata panjang menjadi blok kecil.',
    },
    pelafalan: {
      emoji: 'ㄱ',
      title: 'Akhir suku kata bisa berubah',
      body: 'Konsonan akhir Korea kadang terdengar lebih pendek. Dengarkan blok terakhir dengan teliti.',
    },
    menulis: {
      emoji: 'ㅏ',
      title: 'Susun huruf dalam kotak',
      body: 'Hangeul ditulis sebagai blok: konsonan awal, vokal, lalu kadang konsonan akhir.',
    },
    mendengar: {
      emoji: '👂',
      title: 'Dengar blok terakhir',
      body: 'Bunyi akhir kata Korea sering pendek. Dengarkan blok terakhir sebelum memilih gambar.',
    },
    membaca: {
      emoji: '한',
      title: 'Baca blok demi blok',
      body: 'Setiap kotak Hangeul biasanya satu suku kata. Pecah kata panjang menjadi beberapa kotak.',
    },
    cerita: {
      emoji: '📖',
      title: 'Cari akhiran kalimat',
      body: 'Akhiran seperti 요 menandai kalimat sopan. Anak bisa fokus pada kata utama dulu.',
    },
    memory: {
      emoji: '🧠',
      title: 'Pasangkan blok dan arti',
      body: 'Buka kartu kata, baca bloknya pelan, lalu cari kartu arti yang gambarnya cocok.',
    },
  },
}

export function languagePrimers(lang: LangCode): MaterialNote[] {
  return PRIMERS[lang] ?? []
}

export function categoryMaterial(lang: LangCode, categoryId?: string): MaterialNote | null {
  if (!categoryId) return null
  return CATEGORY_NOTES[lang]?.[categoryId] ?? null
}

export function skillMaterial(lang: LangCode, skill: LessonSkill): MaterialNote | null {
  return SKILL_NOTES[lang]?.[skill] ?? null
}

export function wordMaterials(lang: LangCode, wd: EnWord): MaterialNote[] {
  if (!hasExtraMaterials(lang)) return []
  const notes: MaterialNote[] = []

  if (lang === 'zh') {
    notes.push({
      emoji: '🎵',
      title: 'Pinyin',
      body: `Baca "${wd.say}" sambil memperhatikan tanda nada di atas vokalnya.`,
    })
    notes.push({
      emoji: wd.word.length <= 1 ? '字' : '词',
      title: wd.word.length <= 1 ? 'Karakter tunggal' : 'Kata gabungan',
      body:
        wd.word.length <= 1
          ? 'Satu karakter ini sudah membawa satu makna. Perhatikan bentuknya seperti gambar kecil.'
          : `Kata ini tersusun dari ${wd.word.length} karakter. Coba lihat bagian mana yang pernah muncul lagi.`,
    })
  }

  if (lang === 'ar') {
    notes.push({
      emoji: '◌',
      title: 'Harakat',
      body: 'Baca huruf Arab bersama tanda kecilnya: a, i, u, atau tanda sukun ketika bunyinya berhenti.',
    })
    if (wd.word.includes('ة')) {
      notes.push({
        emoji: 'ة',
        title: 'Ta marbuthah',
        body: 'Akhiran ة sering menandai kata feminin dan biasanya terdengar seperti "ah" saat berhenti.',
      })
    }
    notes.push({
      emoji: '↩',
      title: 'Arah baca',
      body: 'Lihat kata dari kanan ke kiri, lalu cocokkan dengan cara baca latinnya.',
    })
  }

  if (lang === 'ja') {
    const hasKatakana = /[\u30a0-\u30ff]/.test(wd.word)
    notes.push({
      emoji: hasKatakana ? 'カナ' : 'かな',
      title: hasKatakana ? 'Katakana' : 'Hiragana',
      body: hasKatakana
        ? 'Katakana sering dipakai untuk kata serapan, nama asing, atau bunyi yang ingin ditegaskan.'
        : 'Hiragana adalah aksara dasar Jepang. Baca perlahan per suku kata.',
    })
    if (/[うー]/.test(wd.word)) {
      notes.push({
        emoji: '⏱',
        title: 'Bunyi panjang',
        body: 'Ada bunyi yang ditahan sedikit lebih lama. Dengarkan tombol pelan sebelum menirukan.',
      })
    }
  }

  if (lang === 'ko') {
    notes.push({
      emoji: '한',
      title: 'Blok Hangeul',
      body: `Kata ini punya ${Array.from(wd.word).length} blok. Baca satu blok demi satu blok.`,
    })
    if (wd.word.endsWith('요')) {
      notes.push({
        emoji: '요',
        title: 'Akhiran sopan',
        body: 'Akhiran 요 membuat kalimat terdengar sopan dan ramah untuk percakapan sehari-hari.',
      })
    }
  }

  return notes.slice(0, 3)
}
