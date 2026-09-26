import 'dotenv/config'
import express from 'express'

const PORT = Number(process.env.PORT ?? 8787)
const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/**
 * Model bawaan bila pengguna belum memilih. Tier "flash" adalah yang
 * tersedia di paket gratis Google AI Studio. Daftar model sebenarnya
 * selalu diambil langsung dari API memakai kunci pengguna (/api/models),
 * jadi nama di sini hanya cadangan.
 */
const FALLBACK_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'

const app = express()
app.use(express.json({ limit: '256kb' }))

const rateBuckets = new Map()
let lastRatePrune = 0

function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  return (req, res, next) => {
    const now = Date.now()
    if (now - lastRatePrune > windowMs) {
      lastRatePrune = now
      for (const [key, bucket] of rateBuckets) {
        if (now > bucket.resetAt) rateBuckets.delete(key)
      }
    }

    const id = `${req.ip}:${req.path}`
    const bucket = rateBuckets.get(id) ?? { count: 0, resetAt: now + windowMs }
    if (now > bucket.resetAt) {
      bucket.count = 0
      bucket.resetAt = now + windowMs
    }
    bucket.count += 1
    rateBuckets.set(id, bucket)

    if (bucket.count > max) {
      return res.status(429).json({ error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' })
    }
    next()
  }
}

const aiRateLimit = rateLimit({ windowMs: 60_000, max: 25 })

/**
 * BYOK: kunci dikirim per permintaan dari browser lewat header.
 * GEMINI_API_KEY di .env hanya cadangan untuk pemakaian pribadi.
 */
function apiKeyOf(req) {
  const fromClient = req.get('x-gemini-key')
  return (fromClient && fromClient.trim()) || process.env.GEMINI_API_KEY || ''
}

const modelOf = (req) => req.get('x-gemini-model')?.trim() || FALLBACK_MODEL

/* ------------------------------------------------------------------ */
/* Daftar model                                                        */
/* ------------------------------------------------------------------ */

/** Perkirakan versi dari nama model supaya yang terbaru muncul di atas. */
function versionOf(id) {
  const m = id.match(/gemini-(\d+)(?:[.-](\d+))?/)
  if (!m) return 0
  return Number(m[1]) + (m[2] ? Number(m[2]) / 10 : 0)
}

/**
 * Tier "flash" dan "flash-lite" adalah yang ditawarkan gratis oleh Google
 * AI Studio. Tier "pro" biasanya berbayar atau berkuota sangat kecil,
 * jadi tidak direkomendasikan untuk aplikasi anak yang sering memanggil API.
 */
const isFreeTier = (id) => /flash/.test(id) && !/pro/.test(id)

app.get('/api/models', aiRateLimit, async (req, res) => {
  const key = apiKeyOf(req)
  if (!key) return res.status(401).json({ error: 'Kunci API belum diisi.' })

  try {
    const r = await fetch(`${BASE}/models?pageSize=200`, {
      headers: { 'x-goog-api-key': key },
    })
    const data = await r.json()

    if (!r.ok) {
      return res.status(r.status).json({
        error:
          r.status === 400 || r.status === 403
            ? 'Kunci API tidak valid atau belum diaktifkan.'
            : (data?.error?.message ?? 'Gagal mengambil daftar model.'),
      })
    }

    const models = (data.models ?? [])
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') &&
          /gemini/.test(m.name) &&
          !/embedding|aqa|imagen|veo|tts|image|audio/.test(m.name),
      )
      .map((m) => {
        const id = m.name.replace(/^models\//, '')
        return {
          id,
          displayName: m.displayName ?? id,
          free: isFreeTier(id),
          preview: /preview|exp/.test(id),
          version: versionOf(id),
        }
      })
      // Terbaru dulu, gratis dulu, stabil sebelum preview.
      .sort(
        (a, b) =>
          Number(b.free) - Number(a.free) ||
          b.version - a.version ||
          Number(a.preview) - Number(b.preview) ||
          a.id.localeCompare(b.id),
      )

    const recommended = models.find((m) => m.free && !m.preview) ?? models[0]
    res.json({ models, recommended: recommended?.id ?? FALLBACK_MODEL })
  } catch (err) {
    console.error('[models]', err?.message ?? err)
    res.status(502).json({ error: 'Tidak bisa menghubungi Google AI. Cek koneksi internet.' })
  }
})

/* ------------------------------------------------------------------ */
/* AI Tutor                                                            */
/* ------------------------------------------------------------------ */

const LANG_NAMES = {
  en: 'Inggris',
  zh: 'Mandarin',
  ar: 'Arab',
  ko: 'Korea',
  ja: 'Jepang',
}

const AGE_NOTES = {
  kecil: 'usia 3-5 tahun: pakai kalimat 3-6 kata, kata yang sangat sederhana, banyak emoji',
  sedang: 'usia 6-8 tahun: kalimat pendek dan konkret, boleh satu kata baru per balasan',
  besar: 'usia 9-12 tahun: boleh kalimat lengkap dan penjelasan singkat, tetap hangat',
}

const SKILL_NOTES = {
  kosakata: 'Anak sedang menebak arti kata. Fokuskan tips pada cara mengingat kata itu.',
  pelafalan:
    'Anak menirukan pengucapan. Fokuskan tips pada bunyi yang perlu diperbaiki (suku kata, nada, panjang bunyi).',
  berbicara:
    'Anak sedang mengobrol. Balas dalam bahasa target dengan kalimat sangat pendek, lalu beri satu pertanyaan lanjutan yang mudah.',
  menulis:
    'Anak menjiplak atau mengeja tulisan. Fokuskan tips pada bentuk huruf, urutan goresan, atau ejaan.',
}

/** Ubah profil penguasaan menjadi kalimat singkat agar hemat token. */
function profileNote(profile) {
  if (!profile) return ''
  const parts = [
    `Tingkat anak saat ini: ${profile.level} (ketepatan ${profile.accuracy}%, ${profile.wordsStrong} dari ${profile.wordsSeen} kata sudah kuat).`,
  ]
  if (profile.weakWords?.length) {
    const weak = profile.weakWords
      .map(
        (w) =>
          `${w.roman} (${w.meaning})${w.misses?.length ? `, pernah keliru jadi: ${w.misses.join(' / ')}` : ''}`,
      )
      .join('; ')
    parts.push(`Kata yang masih sering meleset: ${weak}.`)
    parts.push(
      'Bila relevan, kaitkan tips dengan salah satu kata itu supaya anak merasa diingat. Jangan menyebut lebih dari satu.',
    )
  }
  if (profile.strongWords?.length) {
    parts.push(`Kata yang sudah lancar: ${profile.strongWords.join(', ')}.`)
  }
  return parts.join('\n')
}

/** Skema respons (subset OpenAPI yang dipakai Gemini structured output). */
const FEEDBACK_SCHEMA = {
  type: 'OBJECT',
  properties: {
    praise: {
      type: 'STRING',
      description: 'Pujian hangat 1 kalimat dalam Bahasa Indonesia, maksimal 12 kata.',
    },
    tip: {
      type: 'STRING',
      description:
        'Satu saran konkret dalam Bahasa Indonesia, maksimal 20 kata. String kosong bila sudah sempurna.',
    },
    correction: {
      type: 'STRING',
      description: 'Bentuk yang benar dalam bahasa target. String kosong bila anak sudah benar.',
    },
    reply: {
      type: 'STRING',
      description:
        'Balasan Kiko dalam bahasa target, maksimal 8 kata. Hanya untuk latihan berbicara, selain itu string kosong.',
    },
    replyMeaning: {
      type: 'STRING',
      description: 'Arti "reply" dalam Bahasa Indonesia. String kosong bila reply kosong.',
    },
    followUp: {
      type: 'STRING',
      description: 'Pertanyaan lanjutan singkat dalam Bahasa Indonesia. Boleh string kosong.',
    },
    stars: {
      type: 'INTEGER',
      description: 'Nilai 1, 2, atau 3. 1 = perlu latihan lagi, 2 = mendekati, 3 = tepat.',
    },
    emoji: { type: 'STRING', description: 'Satu emoji yang mewakili suasana.' },
  },
  required: [
    'praise',
    'tip',
    'correction',
    'reply',
    'replyMeaning',
    'followUp',
    'stars',
    'emoji',
  ],
  propertyOrdering: [
    'praise',
    'tip',
    'correction',
    'reply',
    'replyMeaning',
    'followUp',
    'stars',
    'emoji',
  ],
}

const SYSTEM_PROMPT = `Kamu adalah "Kiko", burung hantu tutor bahasa untuk anak usia 3-12 tahun di Indonesia.

Aturan wajib:
- Selalu ramah, sabar, dan menyemangati. Tidak pernah mengejek atau memakai kata negatif.
- Semua penjelasan (praise, tip, followUp) ditulis dalam Bahasa Indonesia yang sangat sederhana.
- Materi bahasa target (correction, reply) ditulis dalam bahasa target itu sendiri, dengan aksara aslinya.
- Beri TEPAT SATU saran perbaikan. Jangan menumpuk banyak koreksi sekaligus.
- Panjang tiap kalimat maksimal 20 kata. Hindari istilah tata bahasa yang rumit.
- Topik selalu aman untuk anak. Jangan pernah meminta data pribadi (alamat, sekolah, nomor telepon).
- Kalau ucapan anak tidak terdengar jelas atau kosong, anggap sebagai usaha yang baik dan ajak mencoba lagi.
- Jangan pernah menyalahkan anak atas kesalahan alat (mikrofon, pengenalan suara).`

function buildUserPrompt(body) {
  const langName = LANG_NAMES[body.language] ?? 'Inggris'
  const ageNote = AGE_NOTES[body.ageGroup] ?? AGE_NOTES.sedang
  const skillNote = SKILL_NOTES[body.skill] ?? ''

  const freeChat = body.mode === 'bebas'

  const lines = [
    `Bahasa yang dipelajari: Bahasa ${langName}.`,
    `Nama anak: ${body.learnerName || 'Teman kecil'} (${ageNote}).`,
    `Jenis latihan: ${body.skill}. ${skillNote}`,
  ]

  if (freeChat) {
    lines.push(
      'Ini OBROLAN BEBAS: tidak ada kalimat target. Tanggapi isi ucapan anak dengan hangat,',
      'balas memakai bahasa target dalam kalimat sangat pendek yang bisa ia tirukan,',
      'perbaiki paling banyak satu kesalahan, lalu ajukan satu pertanyaan mudah agar obrolan berlanjut.',
      'Isi "correction" hanya bila ada yang perlu dibetulkan; kalau tidak, biarkan kosong.',
    )
  } else {
    lines.push(
      `Target yang benar: "${body.target}"${body.targetRoman ? ` (cara baca: ${body.targetRoman})` : ''}${body.targetMeaning ? ` (artinya: ${body.targetMeaning})` : ''}.`,
    )
  }

  lines.push(`Yang dilakukan anak: "${body.attempt || '(tidak terdengar)'}".`)

  const note = profileNote(body.profile)
  if (note) lines.push(note)

  if (typeof body.score === 'number' && !freeChat) {
    lines.push(
      `Skor kemiripan otomatis: ${Math.round(body.score)}/100. Pakai sebagai bahan pertimbangan, bukan patokan mutlak.`,
    )
  }

  if (Array.isArray(body.history) && body.history.length) {
    const convo = body.history
      .slice(-6)
      .map((h) => `${h.role === 'anak' ? 'Anak' : 'Kiko'}: ${h.text}`)
      .join('\n')
    lines.push(`Percakapan sebelumnya:\n${convo}`)
  }

  lines.push('Berikan umpan balik sesuai skema.')
  return lines.join('\n')
}

/** Penyaring keamanan diperketat karena penggunanya anak-anak. */
const SAFETY_SETTINGS = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
].map((category) => ({ category, threshold: 'BLOCK_LOW_AND_ABOVE' }))

function makePayload({ system, user, schema, temperature, maxOutputTokens, noThinking }) {
  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature,
      maxOutputTokens,
    },
  }
  // Umpan balik untuk anak harus cepat dan hemat kuota gratis; tugasnya
  // sederhana sehingga penalaran panjang tidak diperlukan.
  if (noThinking) payload.generationConfig.thinkingConfig = { thinkingBudget: 0 }
  return payload
}

async function callGemini(key, model, payload) {
  const r = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(payload),
  })
  return { ok: r.ok, status: r.status, data: await r.json() }
}

/** Panggil model, dan ulangi tanpa thinkingConfig bila model menolaknya. */
async function generate(key, model, opts) {
  let out = await callGemini(key, model, makePayload({ ...opts, noThinking: true }))
  if (!out.ok && /thinking/i.test(JSON.stringify(out.data?.error ?? ''))) {
    out = await callGemini(key, model, makePayload({ ...opts, noThinking: false }))
  }
  return out
}

/** Ubah respons Gemini menjadi objek, atau lempar error yang mudah dipahami. */
function parseResult(out) {
  const candidate = out.data?.candidates?.[0]
  const blocked =
    out.data?.promptFeedback?.blockReason || candidate?.finishReason === 'SAFETY'
  if (blocked) {
    const err = new Error('Jawaban disaring demi keamanan anak.')
    err.code = 'BLOCKED'
    throw err
  }
  const text = candidate?.content?.parts?.map((p) => p.text).join('') ?? ''
  if (!text.trim()) throw new Error('Jawaban model kosong')
  return JSON.parse(text)
}

/** Terjemahkan galat HTTP Google menjadi respons yang ramah bagi aplikasi. */
function sendApiError(res, status, message, label) {
  if (status === 400 || status === 403) {
    return res
      .status(503)
      .json({ error: 'Kunci API tidak valid. Aplikasi memakai tutor cadangan.' })
  }
  if (status === 429) {
    return res
      .status(429)
      .json({ error: 'Kuota gratis sedang penuh. Kiko istirahat sebentar ya!' })
  }
  console.error(`[${label}]`, status, message)
  return res.status(502).json({ error: 'AI Tutor sedang sibuk, coba lagi sebentar lagi.' })
}

app.post('/api/tutor', aiRateLimit, async (req, res) => {
  const body = req.body ?? {}
  const key = apiKeyOf(req)
  const model = modelOf(req)

  if (!body.skill || !body.language) {
    return res.status(400).json({ error: 'skill dan language wajib diisi' })
  }
  if (!key) {
    return res
      .status(503)
      .json({ error: 'Kunci API belum diisi. Aplikasi memakai tutor cadangan.' })
  }

  try {
    const out = await generate(key, model, {
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(body),
      schema: FEEDBACK_SCHEMA,
      temperature: 0.9,
      maxOutputTokens: 800,
    })

    if (!out.ok) {
      return sendApiError(res, out.status, out.data?.error?.message, 'tutor')
    }
    res.json(parseResult(out))
  } catch (err) {
    if (err?.code === 'BLOCKED') return res.status(422).json({ error: err.message })
    console.error('[tutor]', err?.message ?? err)
    res.status(502).json({ error: 'AI Tutor sedang sibuk, coba lagi sebentar lagi.' })
  }
})

/* ------------------------------------------------------------------ */
/* Ringkasan kemajuan untuk orang tua                                  */
/* ------------------------------------------------------------------ */

const INSIGHT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'Ringkasan 2-3 kalimat untuk orang tua dalam Bahasa Indonesia.',
    },
    strengths: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Maksimal 3 poin kekuatan anak, masing-masing satu kalimat.',
    },
    focus: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Maksimal 3 poin yang perlu dilatih, masing-masing satu kalimat.',
    },
    activity: {
      type: 'STRING',
      description:
        'Satu ide kegiatan 5 menit tanpa layar yang bisa dilakukan orang tua bersama anak di rumah.',
    },
  },
  required: ['summary', 'strengths', 'focus', 'activity'],
  propertyOrdering: ['summary', 'strengths', 'focus', 'activity'],
}

const INSIGHT_SYSTEM = `Kamu adalah pendamping belajar yang menulis laporan singkat untuk ORANG TUA
(bukan untuk anak) dalam Bahasa Indonesia yang hangat dan mudah dipahami.

Aturan:
- Fokus pada kemajuan nyata, bukan pujian kosong. Sebut angka bila membantu.
- Jangan pernah melabeli anak "lambat", "kurang", atau membandingkan dengan anak lain.
- Saran harus praktis untuk keluarga Indonesia dan bisa dilakukan tanpa layar.
- Setiap poin maksimal satu kalimat pendek.`

app.post('/api/insight', aiRateLimit, async (req, res) => {
  const body = req.body ?? {}
  const key = apiKeyOf(req)
  const model = modelOf(req)

  if (!key) {
    return res
      .status(503)
      .json({ error: 'Kunci API belum diisi. Aplikasi memakai ringkasan lokal.' })
  }

  const langName = LANG_NAMES[body.language] ?? 'Inggris'
  const ageNote = AGE_NOTES[body.ageGroup] ?? AGE_NOTES.sedang
  const user = [
    `Bahasa yang dipelajari: Bahasa ${langName}.`,
    `Nama anak: ${body.learnerName || 'Anak'} (${ageNote}).`,
    `Runtutan hari belajar: ${body.streak ?? 0}. Total bintang: ${body.totalStars ?? 0}.`,
    profileNote(body.profile) || 'Belum ada data latihan.',
    'Tulis laporan sesuai skema.',
  ].join('\n')

  try {
    const out = await generate(key, model, {
      system: INSIGHT_SYSTEM,
      user,
      schema: INSIGHT_SCHEMA,
      temperature: 0.7,
      maxOutputTokens: 700,
    })

    if (!out.ok) {
      return sendApiError(res, out.status, out.data?.error?.message, 'insight')
    }
    res.json(parseResult(out))
  } catch (err) {
    if (err?.code === 'BLOCKED') return res.status(422).json({ error: err.message })
    console.error('[insight]', err?.message ?? err)
    res.status(502).json({ error: 'Ringkasan belum bisa dibuat, coba lagi nanti.' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'gemini',
    /** true bila server punya kunci cadangan; BYOK tetap diutamakan */
    serverKey: Boolean(process.env.GEMINI_API_KEY),
    fallbackModel: FALLBACK_MODEL,
  })
})

app.listen(PORT, () => {
  console.log(`🦉 Server Kiko berjalan di http://localhost:${PORT}`)
  console.log('   Penyedia AI: Google Gemini (BYOK)')
  console.log(
    process.env.GEMINI_API_KEY
      ? '   Kunci cadangan dari .env terdeteksi.'
      : '   Belum ada kunci di .env — masukkan kunci lewat menu 👨‍👩‍👧 di aplikasi.',
  )
})
