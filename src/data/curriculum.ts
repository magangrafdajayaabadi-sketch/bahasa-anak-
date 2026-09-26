import type { LangCode } from './languages'

export interface Term {
  /** Tulisan asli (aksara aslinya) */
  text: string
  /** Cara baca dengan huruf latin, ramah anak */
  roman: string
}

export interface Concept {
  id: string
  /** Arti dalam Bahasa Indonesia */
  meaning: string
  emoji: string
  en: Term
  zh: Term
  ar: Term
  ko: Term
  ja: Term
}

export interface Theme {
  id: string
  title: string
  emoji: string
  color: string
  concepts: Concept[]
}

const t = (text: string, roman: string): Term => ({ text, roman })

export const THEMES: Theme[] = [
  {
    id: 'hewan',
    title: 'Hewan',
    emoji: '🐾',
    color: '#FF9600',
    concepts: [
      {
        id: 'cat',
        meaning: 'kucing',
        emoji: '🐱',
        en: t('cat', 'cat'),
        zh: t('猫', 'māo'),
        ar: t('قطة', 'qittah'),
        ko: t('고양이', 'goyangi'),
        ja: t('ねこ', 'neko'),
      },
      {
        id: 'dog',
        meaning: 'anjing',
        emoji: '🐶',
        en: t('dog', 'dog'),
        zh: t('狗', 'gǒu'),
        ar: t('كلب', 'kalb'),
        ko: t('개', 'gae'),
        ja: t('いぬ', 'inu'),
      },
      {
        id: 'bird',
        meaning: 'burung',
        emoji: '🐦',
        en: t('bird', 'bird'),
        zh: t('鸟', 'niǎo'),
        ar: t('عصفور', 'usfur'),
        ko: t('새', 'sae'),
        ja: t('とり', 'tori'),
      },
      {
        id: 'fish',
        meaning: 'ikan',
        emoji: '🐟',
        en: t('fish', 'fish'),
        zh: t('鱼', 'yú'),
        ar: t('سمكة', 'samakah'),
        ko: t('물고기', 'mulgogi'),
        ja: t('さかな', 'sakana'),
      },
      {
        id: 'elephant',
        meaning: 'gajah',
        emoji: '🐘',
        en: t('elephant', 'elephant'),
        zh: t('大象', 'dàxiàng'),
        ar: t('فيل', 'fil'),
        ko: t('코끼리', 'kokkiri'),
        ja: t('ぞう', 'zou'),
      },
      {
        id: 'rabbit',
        meaning: 'kelinci',
        emoji: '🐰',
        en: t('rabbit', 'rabbit'),
        zh: t('兔子', 'tùzi'),
        ar: t('أرنب', 'arnab'),
        ko: t('토끼', 'tokki'),
        ja: t('うさぎ', 'usagi'),
      },
    ],
  },
  {
    id: 'warna',
    title: 'Warna',
    emoji: '🎨',
    color: '#FF3D9A',
    concepts: [
      {
        id: 'red',
        meaning: 'merah',
        emoji: '🔴',
        en: t('red', 'red'),
        zh: t('红色', 'hóngsè'),
        ar: t('أحمر', 'ahmar'),
        ko: t('빨강', 'ppalgang'),
        ja: t('あか', 'aka'),
      },
      {
        id: 'blue',
        meaning: 'biru',
        emoji: '🔵',
        en: t('blue', 'blue'),
        zh: t('蓝色', 'lánsè'),
        ar: t('أزرق', 'azraq'),
        ko: t('파랑', 'parang'),
        ja: t('あお', 'ao'),
      },
      {
        id: 'yellow',
        meaning: 'kuning',
        emoji: '🟡',
        en: t('yellow', 'yellow'),
        zh: t('黄色', 'huángsè'),
        ar: t('أصفر', 'asfar'),
        ko: t('노랑', 'norang'),
        ja: t('きいろ', 'kiiro'),
      },
      {
        id: 'green',
        meaning: 'hijau',
        emoji: '🟢',
        en: t('green', 'green'),
        zh: t('绿色', 'lǜsè'),
        ar: t('أخضر', 'akhdar'),
        ko: t('초록', 'chorok'),
        ja: t('みどり', 'midori'),
      },
      {
        id: 'black',
        meaning: 'hitam',
        emoji: '⚫',
        en: t('black', 'black'),
        zh: t('黑色', 'hēisè'),
        ar: t('أسود', 'aswad'),
        ko: t('검정', 'geomjeong'),
        ja: t('くろ', 'kuro'),
      },
      {
        id: 'white',
        meaning: 'putih',
        emoji: '⚪',
        en: t('white', 'white'),
        zh: t('白色', 'báisè'),
        ar: t('أبيض', 'abyad'),
        ko: t('하양', 'hayang'),
        ja: t('しろ', 'shiro'),
      },
    ],
  },
  {
    id: 'angka',
    title: 'Angka',
    emoji: '🔢',
    color: '#1CB0F6',
    concepts: [
      {
        id: 'one',
        meaning: 'satu',
        emoji: '1️⃣',
        en: t('one', 'one'),
        zh: t('一', 'yī'),
        ar: t('واحد', 'wahid'),
        ko: t('하나', 'hana'),
        ja: t('いち', 'ichi'),
      },
      {
        id: 'two',
        meaning: 'dua',
        emoji: '2️⃣',
        en: t('two', 'two'),
        zh: t('二', 'èr'),
        ar: t('اثنان', 'ithnan'),
        ko: t('둘', 'dul'),
        ja: t('に', 'ni'),
      },
      {
        id: 'three',
        meaning: 'tiga',
        emoji: '3️⃣',
        en: t('three', 'three'),
        zh: t('三', 'sān'),
        ar: t('ثلاثة', 'thalathah'),
        ko: t('셋', 'set'),
        ja: t('さん', 'san'),
      },
      {
        id: 'four',
        meaning: 'empat',
        emoji: '4️⃣',
        en: t('four', 'four'),
        zh: t('四', 'sì'),
        ar: t('أربعة', 'arbaah'),
        ko: t('넷', 'net'),
        ja: t('よん', 'yon'),
      },
      {
        id: 'five',
        meaning: 'lima',
        emoji: '5️⃣',
        en: t('five', 'five'),
        zh: t('五', 'wǔ'),
        ar: t('خمسة', 'khamsah'),
        ko: t('다섯', 'daseot'),
        ja: t('ご', 'go'),
      },
      {
        id: 'six',
        meaning: 'enam',
        emoji: '6️⃣',
        en: t('six', 'six'),
        zh: t('六', 'liù'),
        ar: t('ستة', 'sittah'),
        ko: t('여섯', 'yeoseot'),
        ja: t('ろく', 'roku'),
      },
    ],
  },
  {
    id: 'keluarga',
    title: 'Keluarga',
    emoji: '👨‍👩‍👧',
    color: '#58CC02',
    concepts: [
      {
        id: 'mother',
        meaning: 'ibu',
        emoji: '👩',
        en: t('mother', 'mother'),
        zh: t('妈妈', 'māma'),
        ar: t('ماما', 'mama'),
        ko: t('엄마', 'eomma'),
        ja: t('おかあさん', 'okaasan'),
      },
      {
        id: 'father',
        meaning: 'ayah',
        emoji: '👨',
        en: t('father', 'father'),
        zh: t('爸爸', 'bàba'),
        ar: t('بابا', 'baba'),
        ko: t('아빠', 'appa'),
        ja: t('おとうさん', 'otousan'),
      },
      {
        id: 'sister',
        meaning: 'kakak perempuan',
        emoji: '👧',
        en: t('sister', 'sister'),
        zh: t('姐姐', 'jiějie'),
        ar: t('أخت', 'ukht'),
        ko: t('언니', 'eonni'),
        ja: t('おねえさん', 'oneesan'),
      },
      {
        id: 'brother',
        meaning: 'kakak laki-laki',
        emoji: '👦',
        en: t('brother', 'brother'),
        zh: t('哥哥', 'gēge'),
        ar: t('أخ', 'akh'),
        ko: t('형', 'hyeong'),
        ja: t('おにいさん', 'oniisan'),
      },
      {
        id: 'grandma',
        meaning: 'nenek',
        emoji: '👵',
        en: t('grandmother', 'grandmother'),
        zh: t('奶奶', 'nǎinai'),
        ar: t('جدة', 'jaddah'),
        ko: t('할머니', 'halmeoni'),
        ja: t('おばあさん', 'obaasan'),
      },
      {
        id: 'baby',
        meaning: 'bayi',
        emoji: '👶',
        en: t('baby', 'baby'),
        zh: t('宝宝', 'bǎobao'),
        ar: t('طفل', 'tifl'),
        ko: t('아기', 'agi'),
        ja: t('あかちゃん', 'akachan'),
      },
    ],
  },
  {
    id: 'makanan',
    title: 'Makanan',
    emoji: '🍎',
    color: '#A55BFF',
    concepts: [
      {
        id: 'rice',
        meaning: 'nasi',
        emoji: '🍚',
        en: t('rice', 'rice'),
        zh: t('米饭', 'mǐfàn'),
        ar: t('أرز', 'aruzz'),
        ko: t('밥', 'bap'),
        ja: t('ごはん', 'gohan'),
      },
      {
        id: 'bread',
        meaning: 'roti',
        emoji: '🍞',
        en: t('bread', 'bread'),
        zh: t('面包', 'miànbāo'),
        ar: t('خبز', 'khubz'),
        ko: t('빵', 'ppang'),
        ja: t('パン', 'pan'),
      },
      {
        id: 'apple',
        meaning: 'apel',
        emoji: '🍎',
        en: t('apple', 'apple'),
        zh: t('苹果', 'píngguǒ'),
        ar: t('تفاحة', 'tuffahah'),
        ko: t('사과', 'sagwa'),
        ja: t('りんご', 'ringo'),
      },
      {
        id: 'milk',
        meaning: 'susu',
        emoji: '🥛',
        en: t('milk', 'milk'),
        zh: t('牛奶', 'niúnǎi'),
        ar: t('حليب', 'halib'),
        ko: t('우유', 'uyu'),
        ja: t('ミルク', 'miruku'),
      },
      {
        id: 'egg',
        meaning: 'telur',
        emoji: '🥚',
        en: t('egg', 'egg'),
        zh: t('鸡蛋', 'jīdàn'),
        ar: t('بيضة', 'baydah'),
        ko: t('계란', 'gyeran'),
        ja: t('たまご', 'tamago'),
      },
      {
        id: 'water',
        meaning: 'air',
        emoji: '💧',
        en: t('water', 'water'),
        zh: t('水', 'shuǐ'),
        ar: t('ماء', 'maa'),
        ko: t('물', 'mul'),
        ja: t('みず', 'mizu'),
      },
    ],
  },
]

export const getTheme = (id: string): Theme =>
  THEMES.find((th) => th.id === id) ?? THEMES[0]

export const termOf = (concept: Concept, lang: LangCode): Term => concept[lang]

/** Kalimat pembuka untuk latihan berbicara, per bahasa. */
export interface Phrase {
  id: string
  /** Apa yang harus diucapkan anak */
  target: Record<LangCode, Term>
  /** Pertanyaan pemantik dari Kiko, dalam Bahasa Indonesia */
  prompt: string
  emoji: string
}

export const PHRASES: Phrase[] = [
  {
    id: 'hello',
    prompt: 'Sapa Kiko, yuk! Ucapkan "halo".',
    emoji: '👋',
    target: {
      en: t('Hello!', 'hello'),
      zh: t('你好！', 'nǐ hǎo'),
      ar: t('مرحبا!', 'marhaban'),
      ko: t('안녕하세요!', 'annyeonghaseyo'),
      ja: t('こんにちは！', 'konnichiwa'),
    },
  },
  {
    id: 'name',
    prompt: 'Kenalkan namamu kepada Kiko.',
    emoji: '🪪',
    target: {
      en: t('My name is ...', 'my name is'),
      zh: t('我叫 ...', 'wǒ jiào'),
      ar: t('اسمي ...', 'ismi'),
      ko: t('제 이름은 ... 이에요', 'je ireumeun ... ieyo'),
      ja: t('わたしのなまえは ... です', 'watashi no namae wa ... desu'),
    },
  },
  {
    id: 'thanks',
    prompt: 'Ucapkan terima kasih.',
    emoji: '🙏',
    target: {
      en: t('Thank you!', 'thank you'),
      zh: t('谢谢！', 'xièxie'),
      ar: t('شكرا!', 'shukran'),
      ko: t('감사합니다!', 'gamsahamnida'),
      ja: t('ありがとう！', 'arigatou'),
    },
  },
  {
    id: 'like',
    prompt: 'Ceritakan makanan kesukaanmu.',
    emoji: '😋',
    target: {
      en: t('I like apples.', 'i like apples'),
      zh: t('我喜欢苹果。', 'wǒ xǐhuan píngguǒ'),
      ar: t('أحب التفاح.', 'uhibbu at-tuffah'),
      ko: t('저는 사과를 좋아해요.', 'jeoneun sagwareul joahaeyo'),
      ja: t('りんごがすきです。', 'ringo ga suki desu'),
    },
  },
  {
    id: 'howareyou',
    prompt: 'Tanyakan kabar Kiko.',
    emoji: '🤗',
    target: {
      en: t('How are you?', 'how are you'),
      zh: t('你好吗？', 'nǐ hǎo ma'),
      ar: t('كيف حالك؟', 'kayfa haluk'),
      ko: t('잘 지내요?', 'jal jinaeyo'),
      ja: t('げんきですか？', 'genki desu ka'),
    },
  },
  {
    id: 'bye',
    prompt: 'Pamit pada Kiko dengan sopan.',
    emoji: '👋',
    target: {
      en: t('Goodbye!', 'goodbye'),
      zh: t('再见！', 'zàijiàn'),
      ar: t('مع السلامة!', 'maa as-salamah'),
      ko: t('안녕히 가세요!', 'annyeonghi gaseyo'),
      ja: t('さようなら！', 'sayounara'),
    },
  },
]
