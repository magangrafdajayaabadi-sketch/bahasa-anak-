import { useEffect, useMemo, useRef, useState } from 'react'
import { PHRASES } from '../data/curriculum'
import { getLanguage } from '../data/languages'
import type { LangCode } from '../data/languages'
import { getAgeProfile } from '../types'
import type { AgeGroup } from '../types'
import { Button, Confetti, ProgressBar, Stars, TopBar, TutorBubble } from '../components/ui'
import { bestScore, listen, speak, sttSupported, stopSpeaking } from '../lib/speech'
import type { ListenHandle } from '../lib/speech'
import { sfxCorrect, sfxWin } from '../lib/sfx'
import { askTutor, starsFromScore } from '../lib/tutor'
import { learnerProfile } from '../lib/mastery'
import type { ItemMap } from '../lib/mastery'

interface Props {
  lang: LangCode
  ageGroup: AgeGroup
  learnerName: string
  items: ItemMap
  onFinish: (stars: number) => void
  onBack: () => void
}

interface ChatMsg {
  role: 'anak' | 'kiko'
  text: string
  sub?: string
  rtl?: boolean
}

type Mode = 'terpandu' | 'bebas'

const ROUNDS = 5

export function SpeakingGame({
  lang,
  ageGroup,
  learnerName,
  items,
  onFinish,
  onBack,
}: Props) {
  const l = getLanguage(lang)
  const age = getAgeProfile(ageGroup)
  const profile = useMemo(() => learnerProfile(items, lang), [items, lang])
  const prompts = useMemo(
    () => [...PHRASES].sort(() => Math.random() - 0.5).slice(0, ROUNDS),
    [],
  )

  // Anak kecil selalu memakai latihan terpandu; yang lebih besar boleh memilih.
  const [mode, setMode] = useState<Mode | null>(age.freeTalk ? null : 'terpandu')
  const [turn, setTurn] = useState(0)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [typed, setTyped] = useState('')
  const [starLog, setStarLog] = useState<number[]>([])
  const [answered, setAnswered] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handle = useRef<ListenHandle | null>(null)
  const chatEnd = useRef<HTMLDivElement | null>(null)
  const prompt = prompts[turn]
  const target = prompt?.target[lang]

  const micReady = sttSupported()
  const guided = mode === 'terpandu'

  // Kiko membuka setiap giliran.
  useEffect(() => {
    if (!mode) return

    if (guided) {
      setChat((c) => [
        ...c,
        { role: 'kiko', text: `${prompt.emoji} ${prompt.prompt}` },
        { role: 'kiko', text: target!.text, sub: `dibaca: ${target!.roman}`, rtl: l.rtl },
      ])
      const t = setTimeout(() => speak(target!.text, { lang: l.speechLang, rate: 0.7 }), 450)
      return () => clearTimeout(t)
    }

    // Obrolan bebas: Kiko hanya menyapa sekali di awal, sisanya mengalir.
    if (turn === 0) {
      const hello = PHRASES[0].target[lang]
      setChat([
        {
          role: 'kiko',
          text: hello.text,
          sub: `dibaca: ${hello.roman} · Ceritakan apa saja, Kiko akan menjawab!`,
          rtl: l.rtl,
        },
      ])
      const t = setTimeout(() => speak(hello.text, { lang: l.speechLang, rate: 0.7 }), 450)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, mode])

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, busy])

  useEffect(
    () => () => {
      handle.current?.stop()
      stopSpeaking()
    },
    [],
  )

  async function submit(said: string, rawScore?: number) {
    setAnswered(true)
    setBusy(true)
    setChat((c) => [...c, { role: 'anak', text: said || '…' }])
    if (rawScore !== undefined && rawScore >= 70) sfxCorrect()

    const history = chat.slice(-6).map((m) => ({ role: m.role, text: m.text }))

    const fb = await askTutor({
      skill: 'berbicara',
      language: lang,
      ageGroup,
      learnerName,
      mode: guided ? 'terpandu' : 'bebas',
      target: guided ? target!.text : '',
      targetRoman: guided ? target!.roman : undefined,
      targetMeaning: guided ? prompt.prompt : undefined,
      attempt: said,
      score: rawScore,
      history,
      profile,
    })

    const bubbles: ChatMsg[] = [
      { role: 'kiko', text: `${fb.emoji} ${fb.praise}`, sub: fb.tip || undefined },
    ]
    if (fb.correction && !guided) {
      bubbles.push({
        role: 'kiko',
        text: fb.correction,
        sub: 'coba ucapkan seperti ini',
        rtl: l.rtl,
      })
    }
    if (fb.reply) {
      bubbles.push({
        role: 'kiko',
        text: fb.reply,
        sub: fb.replyMeaning || undefined,
        rtl: l.rtl,
      })
    }
    if (fb.followUp) bubbles.push({ role: 'kiko', text: fb.followUp })

    setChat((c) => [...c, ...bubbles])
    // Di mode terpandu penilaian kemiripan lebih dipercaya; di mode bebas
    // hanya AI yang bisa menilai apakah jawabannya masuk akal.
    setStarLog((s) => [
      ...s,
      guided && rawScore !== undefined ? starsFromScore(rawScore) : fb.stars,
    ])
    setBusy(false)

    const toSpeak = fb.reply || fb.correction
    if (toSpeak) {
      setTimeout(() => speak(toSpeak, { lang: l.speechLang, rate: 0.75 }), 300)
    }
  }

  function startRecording() {
    if (!micReady) return
    setMicError(null)
    setRecording(true)
    stopSpeaking()
    handle.current = listen({
      lang: l.speechLang,
      onResult: (first, alts) => {
        if (guided) {
          const { score, said } = bestScore(alts, [target!.text, target!.roman])
          void submit(said, score)
        } else {
          void submit(first || alts[0] || '')
        }
      },
      onError: (reason) => {
        setRecording(false)
        setMicError(
          reason === 'not-allowed'
            ? 'Izin mikrofon belum diberikan. Minta bantuan orang tua ya!'
            : reason === 'no-speech'
              ? 'Kiko belum mendengar. Coba bicara lebih dekat!'
              : 'Mikrofon belum bisa dipakai. Kamu boleh mengetik jawabannya.',
        )
      },
      onEnd: () => setRecording(false),
    })
  }

  function sendTyped() {
    const text = typed.trim()
    if (!text) return
    if (guided) {
      const { score } = bestScore([text], [target!.text, target!.roman])
      void submit(text, score)
    } else {
      void submit(text)
    }
  }

  function nextTurn() {
    setAnswered(false)
    setTyped('')
    if (turn + 1 >= ROUNDS) {
      setDone(true)
      sfxWin()
    } else {
      setTurn((t) => t + 1)
    }
  }

  /* ----------------------------- Pilih mode ---------------------------- */

  if (!mode) {
    return (
      <div className="stack">
        <TopBar onBack={onBack} title={<>🎤 Berbicara</>} />
        <TutorBubble text="Mau latihan yang mana hari ini?" />
        <button className="tile" onClick={() => setMode('terpandu')}>
          <span className="tile-emoji">📋</span>
          <div className="tile-title">Latihan Terpandu</div>
          <div className="tile-sub">Kiko memberi contoh kalimat untuk ditirukan</div>
        </button>
        <button className="tile" onClick={() => setMode('bebas')}>
          <span className="tile-emoji">💬</span>
          <div className="tile-title">Ngobrol Bebas</div>
          <div className="tile-sub">
            Bicara apa saja — Kiko menjawab dan membetulkan pelan-pelan
          </div>
        </button>
      </div>
    )
  }

  /* ------------------------------ Selesai ------------------------------ */

  if (done) {
    const avg = starLog.length ? starLog.reduce((a, b) => a + b, 0) / starLog.length : 1
    const stars = Math.max(1, Math.min(3, Math.round(avg)))
    return (
      <div className="stack">
        <Confetti show />
        <TopBar title="🎉 Obrolan selesai!" />
        <div className="card center stack">
          <TutorBubble
            mood="cheer"
            text={`Terima kasih sudah mengobrol, ${learnerName}! Kamu berani bicara — itu yang paling penting.`}
          />
          <Stars value={stars} />
          <Button variant="mint" size="lg" block onClick={() => onFinish(stars)}>
            Ambil Bintang! ⭐
          </Button>
        </div>
      </div>
    )
  }

  /* ------------------------------ Bermain ------------------------------ */

  return (
    <div className="stack">
      <TopBar
        onBack={onBack}
        title={<>{guided ? '📋 Terpandu' : '💬 Ngobrol Bebas'}</>}
        right={<div className="pill">{l.flag}</div>}
      />
      <ProgressBar value={turn} max={ROUNDS} />

      <div className="card stack">
        <div className="chat">
          {chat.map((m, i) => (
            <div key={i} className={`bubble ${m.role === 'kiko' ? 'kiko' : 'child'}`}>
              <div dir={m.rtl ? 'rtl' : 'ltr'}>{m.text}</div>
              {m.sub && <div className="sub">{m.sub}</div>}
            </div>
          ))}
          {busy && (
            <div className="bubble kiko">
              <span className="thinking-dots">
                <span>●</span>
                <span>●</span>
                <span>●</span>
              </span>
            </div>
          )}
          <div ref={chatEnd} />
        </div>

        {guided && (
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button
              variant="sky"
              onClick={() => speak(target!.text, { lang: l.speechLang, rate: 0.7 })}
            >
              🔊 Contoh
            </Button>
          </div>
        )}

        {!answered && (
          <>
            <button
              className={`mic-btn ${recording ? 'recording' : ''}`}
              onClick={() => (recording ? handle.current?.stop() : startRecording())}
              disabled={!micReady || busy}
              aria-label={recording ? 'Berhenti bicara' : 'Mulai bicara'}
            >
              🎤
            </button>
            <p className="muted center">
              {recording
                ? 'Kiko mendengarkan…'
                : guided
                  ? 'Tekan lalu ucapkan kalimatnya'
                  : 'Tekan lalu ceritakan apa saja'}
            </p>

            {micError && <div className="notice">😊 {micError}</div>}

            {(age.spelling || !micReady || !guided) && (
              <div className="row">
                <input
                  className="input"
                  placeholder="…atau ketik jawabanmu"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTyped()}
                  dir={l.rtl ? 'rtl' : 'ltr'}
                  aria-label="Ketik jawaban"
                />
                <Button variant="bubble" disabled={!typed.trim() || busy} onClick={sendTyped}>
                  Kirim
                </Button>
              </div>
            )}
          </>
        )}

        {answered && !busy && (
          <Button variant="mint" size="lg" block onClick={nextTurn}>
            {turn + 1 >= ROUNDS ? 'Selesai 🎉' : 'Lanjut ➜'}
          </Button>
        )}
      </div>
    </div>
  )
}
