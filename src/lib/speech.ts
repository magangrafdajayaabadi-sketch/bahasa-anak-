/**
 * Pembungkus Web Speech API: text-to-speech (Kiko bicara) dan
 * speech-to-text (anak bicara). Keduanya gagal dengan lembut kalau
 * browser tidak mendukung, supaya aplikasi tetap bisa dipakai.
 */

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length) cachedVoices = voices
  return cachedVoices
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = () => loadVoices()
}

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Apakah ada suara terpasang untuk bahasa ini di perangkat pengguna? */
export function hasVoiceFor(lang: string): boolean {
  const base = lang.split('-')[0]
  return loadVoices().some((v) => v.lang.toLowerCase().startsWith(base))
}

export interface SpeakOptions {
  lang: string
  rate?: number
  pitch?: number
  onEnd?: () => void
}

export function speak(text: string, opts: SpeakOptions): void {
  if (!ttsSupported()) {
    opts.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = opts.lang
  // Anak-anak butuh tempo lebih pelan supaya bisa menirukan.
  utter.rate = opts.rate ?? 0.8
  utter.pitch = opts.pitch ?? 1.15

  const base = opts.lang.split('-')[0]
  const voice =
    loadVoices().find((v) => v.lang.toLowerCase() === opts.lang.toLowerCase()) ??
    loadVoices().find((v) => v.lang.toLowerCase().startsWith(base))
  if (voice) utter.voice = voice

  utter.onend = () => opts.onEnd?.()
  utter.onerror = () => opts.onEnd?.()
  window.speechSynthesis.speak(utter)
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel()
}

/* ------------------------------------------------------------------ */
/* Pengenalan suara                                                    */
/* ------------------------------------------------------------------ */

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function sttSupported(): boolean {
  return recognitionCtor() !== null
}

export interface ListenHandle {
  stop(): void
}

export interface ListenOptions {
  lang: string
  onResult: (transcript: string, alternatives: string[]) => void
  onError: (reason: 'no-speech' | 'not-allowed' | 'unsupported' | 'other') => void
  onEnd?: () => void
}

export function listen(opts: ListenOptions): ListenHandle {
  const Ctor = recognitionCtor()
  if (!Ctor) {
    opts.onError('unsupported')
    opts.onEnd?.()
    return { stop() {} }
  }

  const rec = new Ctor()
  rec.lang = opts.lang
  rec.interimResults = false
  rec.maxAlternatives = 5
  rec.continuous = false

  let gotResult = false

  rec.onresult = (e: any) => {
    gotResult = true
    const result = e.results[0]
    const alts: string[] = []
    for (let i = 0; i < result.length; i++) alts.push(result[i].transcript)
    opts.onResult(alts[0] ?? '', alts)
  }
  rec.onerror = (e: any) => {
    const code = e?.error
    if (code === 'no-speech') opts.onError('no-speech')
    else if (code === 'not-allowed' || code === 'service-not-allowed')
      opts.onError('not-allowed')
    else if (code === 'aborted' && gotResult) return
    else opts.onError('other')
  }
  rec.onend = () => opts.onEnd?.()

  try {
    rec.start()
  } catch {
    opts.onError('other')
    opts.onEnd?.()
  }

  return {
    stop() {
      try {
        rec.stop()
      } catch {
        /* diamkan */
      }
    },
  }
}

/* ------------------------------------------------------------------ */
/* Penilaian kemiripan ucapan                                          */
/* ------------------------------------------------------------------ */

/** Buang tanda baca, spasi, dan nada supaya perbandingan lebih adil. */
export function normalize(s: string): string {
  const out: string[] = []
  for (const ch of s.toLowerCase().normalize('NFD')) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp >= 0x300 && cp <= 0x36f) continue // diakritik latin: ā, ǎ, é ...
    if (cp >= 0x64b && cp <= 0x652) continue // harakat Arab
    if (/[\p{L}\p{N}]/u.test(ch)) out.push(ch)
  }
  return out.join('')
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const curr = [i]
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = curr
  }
  return prev[b.length]
}

/** Skor 0–100 antara ucapan anak dan target. */
export function similarity(said: string, target: string): number {
  const a = normalize(said)
  const b = normalize(target)
  if (!a || !b) return 0
  const dist = levenshtein(a, b)
  const score = 1 - dist / Math.max(a.length, b.length)
  return Math.round(Math.max(0, Math.min(1, score)) * 100)
}

/**
 * Bandingkan dengan tulisan asli DAN cara baca latin, lalu ambil yang
 * paling bagus — pengenalan suara kadang mengembalikan salah satunya.
 */
export function bestScore(
  alternatives: string[],
  targets: string[],
): { score: number; said: string } {
  let best = { score: 0, said: alternatives[0] ?? '' }
  for (const alt of alternatives) {
    for (const target of targets) {
      const s = similarity(alt, target)
      if (s > best.score) best = { score: s, said: alt }
    }
  }
  return best
}
