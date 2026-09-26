import type { LangCode } from './languages'

export interface ListeningMaterial {
  title: string
  focus: string
  warmup: string
  soundClues: string[]
  commonMixups: string[]
  miniDrills: string[]
}

export const LISTENING_MATERIALS: Record<LangCode, ListeningMaterial> = {
  en: {
    title: 'Mendengar Bahasa Inggris',
    focus: 'Tangkap bunyi awal dan akhir kata, karena banyak kata Inggris mirip bila hanya didengar cepat.',
    warmup: 'Dengarkan sekali tanpa menjawab, lalu ulangi sambil tepuk jumlah suku katanya.',
    soundClues: [
      'Bunyi awal penting: cat, cow, dan car sama-sama mulai dengan c/k.',
      'Akhir kata sering pendek: dog berakhir g, fish berakhir sh.',
      'Huruf tertulis tidak selalu sama dengan bunyi: one dibaca seperti "wan".',
      'Vokal pendek perlu dilatih: ship berbeda dari sheep.',
    ],
    commonMixups: [
      'cat dan cut',
      'ship dan sheep',
      'rice dan rise',
      'three dan tree',
    ],
    miniDrills: [
      'Dengar kata, lalu tunjuk gambar tanpa melihat tulisan.',
      'Dengar dua kali: pertama cari bunyi awal, kedua cari arti.',
      'Setelah memilih jawaban, ulangi kata dengan suara kecil lalu suara normal.',
    ],
  },
  zh: {
    title: 'Mendengar Bahasa Mandarin',
    focus: 'Tangkap nada pinyin dan bunyi awal. Nada yang berbeda bisa mengubah arti kata.',
    warmup: 'Dengarkan pinyin pelan, lalu gerakkan tangan: datar, naik, turun-naik, atau turun.',
    soundClues: [
      'Nada pertama terdengar datar dan tinggi, seperti mā.',
      'Nada kedua naik, seperti sedang bertanya: má.',
      'Nada ketiga turun lalu naik: mǎ.',
      'Nada keempat turun tegas: mà.',
      'Bunyi zh, ch, sh terdengar lebih tebal daripada z, c, s.',
    ],
    commonMixups: [
      'mā dan mǎ',
      'sì dan shí',
      'qī dan jī',
      'lǜ dan lù',
    ],
    miniDrills: [
      'Dengar kata, lalu sebutkan nadanya sebelum memilih gambar.',
      'Tepuk satu kali untuk setiap suku kata Mandarin yang terdengar.',
      'Bandingkan dua kata mirip, lalu pilih mana yang nadanya turun tegas.',
    ],
  },
  ar: {
    title: 'Mendengar Bahasa Arab',
    focus: 'Dengarkan harakat pendek, bunyi tenggorokan, dan perbedaan huruf bertitik.',
    warmup: 'Dengarkan kata pelan sambil ikut membaca alih aksara latin dari kanan ke kiri pada tulisan Arabnya.',
    soundClues: [
      'Fathah berbunyi a pendek, kasrah i pendek, dammah u pendek.',
      'Huruf ح terdengar dari tenggorokan dan lebih lembut daripada ه.',
      'Huruf ق terdengar lebih dalam daripada ك.',
      'Huruf ص, ض, ط, ظ terdengar lebih tebal daripada pasangan tipisnya.',
      'Akhiran ة sering terdengar "ah" ketika kata berhenti.',
    ],
    commonMixups: [
      'kalb dan qalb',
      'hisan dan Hasan',
      'samakah dan samaka',
      'asad dan aswad',
    ],
    miniDrills: [
      'Dengar bunyi vokal pendeknya dulu: a, i, atau u.',
      'Minta anak menunjuk arah baca dari kanan sebelum memilih jawaban.',
      'Ulangi kata dengan berbisik agar bunyi tenggorokan tidak dipaksa.',
    ],
  },
  ko: {
    title: 'Mendengar Bahasa Korea',
    focus: 'Dengarkan blok suku kata dan bunyi akhir. Beberapa konsonan akhir terdengar sangat pendek.',
    warmup: 'Dengarkan kata, lalu hitung jumlah blok Hangeulnya dengan tepukan pelan.',
    soundClues: [
      'Setiap blok Hangeul biasanya satu suku kata: go-yang-i.',
      'Konsonan akhir bisa terdengar tertahan, seperti k, t, atau p pendek.',
      'Bunyi ㄱ, ㄷ, ㅂ bisa terdengar lebih ringan di awal kata.',
      'Akhiran 요 terdengar seperti penutup kalimat sopan.',
      'Kata majemuk sering punya petunjuk: 물고기 = 물 + 고기.',
    ],
    commonMixups: [
      'gae dan ge',
      'mal dan mul',
      'nun sebagai mata dan nun sebagai salju',
      'dal sebagai bulan dan dal sebagai bulan kalender',
    ],
    miniDrills: [
      'Dengar kata, lalu pecah menjadi blok: go-yang-i.',
      'Cari bunyi akhir sebelum melihat pilihan jawaban.',
      'Setelah benar, ulangi kata sambil menunjuk tiap blok Hangeul.',
    ],
  },
  ja: {
    title: 'Mendengar Bahasa Jepang',
    focus: 'Dengarkan suku kata, panjang bunyi, dan apakah kata terasa hiragana atau katakana.',
    warmup: 'Dengarkan kata lalu tepuk mora/suku kecilnya: ne-ko, sa-ka-na, o-ka-a-san.',
    soundClues: [
      'Bahasa Jepang enak didengar per suku kecil, bukan per huruf Indonesia.',
      'Vokal panjang ditahan sedikit lebih lama, seperti zou dan okaasan.',
      'Konsonan ganda punya jeda kecil, seperti mittsu.',
      'Katakana sering terdengar seperti kata serapan: raion, pengin.',
      'Partikel dalam kalimat sering pendek: wa, ga, o.',
    ],
    commonMixups: [
      'obaasan dan obasan',
      'ojiisan dan ojisan',
      'koko dan koukou',
      'sake dan sakee',
    ],
    miniDrills: [
      'Dengar kata, lalu tepuk jumlah suku kecil sebelum memilih.',
      'Cari apakah ada bunyi panjang yang ditahan.',
      'Ulangi kata dengan tempo rata, jangan terlalu menekan suku pertama.',
    ],
  },
}

export function listeningMaterial(lang: LangCode): ListeningMaterial {
  return LISTENING_MATERIALS[lang]
}
