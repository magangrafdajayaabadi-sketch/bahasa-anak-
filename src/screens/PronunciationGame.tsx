import { useEffect, useMemo, useRef, useState } from 'react'
import { getTheme } from '../data/curriculum'
import { getLanguage } from '../data/languages'
import type { LangCode } from '../data/languages'
import type { AgeGroup, TutorFeedback } from '../types'
import { Button, Confetti, ProgressBar, Stars, TopBar, TutorBubble } from '../components/ui'
import { bestScore, listen, speak, sttSupported, stopSpeaking } from '../lib/speech'
import type { ListenHandle } from '../lib/speech'
import { sfxCorrect, sfxTryAgain, sfxWin } from '../lib/sfx'
import { askTutor, starsFromScore } from '../lib/tutor'
import { learnerProfile, pickSession } from '../lib/mastery'
import type { Attempt, ItemMap } from '../lib/mastery'

interface Props {
  lang: LangCode
  themeId: string
  ageGroup: AgeGroup
  learnerName: string
  items: ItemMap
  onFinish: (stars: number, attempts: Attempt[]) => void
  onBack: () => void
}

type Phase = 'siap' | 'merekam' | 'menilai' | 'hasil'

export function PronunciationGame({
  lang,
  themeId,
  ageGroup,
  learnerName,
  items,
  onFinish,
  onBack,
}: Props) {
  const theme = getTheme(themeId)
  const l = getLanguage(lang)
  // Kata yang pelafalannya masih lemah didahulukan.
  const rounds = useMemo(
    () => pickSession(items, lang, theme.concepts, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, lang],
  )
  const profile = useMemo(() => learnerProfile(items, lang), [items, lang])

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('siap')
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handle = useRef<ListenHandle | null>(null)
  const concept = rounds[index]
  const micReady = sttSupported()

  useEffect(() => {
    return () => {
      handle.current?.stop()
      stopSpeaking()
    }
  }, [])

  const sayWord = (rate = 0.7) =>
    speak(concept[lang].text, { lang: l.speechLang, rate })

  async function grade(said: string, rawScore: number) {
    setPhase('menilai')
    setHeard(said)
    setScore(rawScore)
    if (rawScore >= 70) sfxCorrect()
    else sfxTryAgain()

    setAttempts((a) => [
      ...a,
      {
        conceptId: concept.id,
        score: rawScore,
        miss: rawScore < 70 ? said : undefined,
      },
    ])

    const fb = await askTutor({
      skill: 'pelafalan',
      language: lang,
      ageGroup,
      learnerName,
      target: concept[lang].text,
      targetRoman: concept[lang].roman,
      targetMeaning: concept.meaning,
      attempt: said || '(tidak terdengar)',
      score: rawScore,
      profile,
    })
    setFeedback(fb)
    setScores((s) => [...s, rawScore])
    setPhase('hasil')
  }

  function startRecording() {
    if (!micReady) return
    setMicError(null)
    setHeard('')
    setFeedback(null)
    setPhase('merekam')
    stopSpeaking()

    handle.current = listen({
      lang: l.speechLang,
      onResult: (_first, alternatives) => {
        const { score: s, said } = bestScore(alternatives, [
          concept[lang].text,
          concept[lang].roman,
        ])
        void grade(said, s)
      },
      onError: (reason) => {
        setPhase('siap')
        setMicError(
          reason === 'not-allowed'
            ? 'Izin mikrofon belum diberikan. Minta bantuan orang tua ya!'
            : reason === 'unsupported'
              ? 'Browser ini belum mendukung mikrofon.'
              : reason === 'no-speech'
                ? 'Kiko belum mendengar suaramu. Coba lebih dekat ke mikrofon!'
                : 'Mikrofon sedang bermasalah. Coba lagi ya!',
        )
      },
      onEnd: () => {
        setPhase((p) => (p === 'merekam' ? 'siap' : p))
      },
    })
  }

  function next() {
    setFeedback(null)
    setHeard('')
    setPhase('siap')
    if (index + 1 >= rounds.length) {
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (done) {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const stars = starsFromScore(avg)
    return (
      <div className="stack">
        <Confetti show />
        <TopBar title="🎉 Selesai!" />
        <div className="card center stack">
          <TutorBubble
            mood="cheer"
            text={`Suaramu makin jelas, ${learnerName}! Rata-rata ketepatan ${Math.round(avg)}%.`}
          />
          <Stars value={stars} />
          <Button variant="mint" size="lg" block onClick={() => onFinish(stars, attempts)}>
            Ambil Bintang! ⭐
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <TopBar
        onBack={onBack}
        title={<>🎧 Pelafalan</>}
        right={<div className="pill">{l.flag}</div>}
      />
      <ProgressBar value={index} max={rounds.length} />

      <div className="word-card">
        <div className="word-emoji">{concept.emoji}</div>
        <div className="word-native" dir={l.rtl ? 'rtl' : 'ltr'}>
          {concept[lang].text}
        </div>
        <div className="word-roman">{concept[lang].roman}</div>
        <div className="word-meaning">{concept.meaning}</div>
        <div className="row mt-4" style={{ justifyContent: 'center' }}>
          <Button variant="sky" onClick={() => sayWord(0.6)}>
            🐢 Pelan
          </Button>
          <Button variant="sky" onClick={() => sayWord(0.9)}>
            🔊 Normal
          </Button>
        </div>
      </div>

      {phase !== 'hasil' && (
        <div className="card center stack">
          <p style={{ fontWeight: 800, fontSize: 20 }}>
            {phase === 'merekam' ? 'Kiko sedang mendengarkan…' : 'Sekarang giliranmu!'}
          </p>
          <button
            className={`mic-btn ${phase === 'merekam' ? 'recording' : ''}`}
            onClick={() => (phase === 'merekam' ? handle.current?.stop() : startRecording())}
            disabled={!micReady || phase === 'menilai'}
            aria-label={phase === 'merekam' ? 'Berhenti merekam' : 'Mulai bicara'}
          >
            🎤
          </button>
          <p className="muted">
            {phase === 'merekam' ? 'Ucapkan sekarang, lalu tunggu sebentar' : 'Tekan lalu ucapkan kata di atas'}
          </p>

          {micError && <div className="notice">😊 {micError}</div>}

          {!micReady && (
            <>
              <div className="notice">
                🎤 Mikrofon tidak tersedia di browser ini. Kamu tetap bisa berlatih:
                dengarkan lalu tirukan dengan suara keras!
              </div>
              <Button variant="mint" onClick={() => void grade('(latihan mandiri)', 75)}>
                Aku sudah menirukan ✅
              </Button>
            </>
          )}

          {phase === 'menilai' && (
            <TutorBubble loading text="" size={64} />
          )}
        </div>
      )}

      {phase === 'hasil' && feedback && (
        <div className="card stack">
          <TutorBubble mood={score >= 70 ? 'cheer' : 'happy'} size={74}>
            <p>
              <strong>
                {feedback.emoji} {feedback.praise}
              </strong>
            </p>
            {feedback.tip && <p className="mt-2">{feedback.tip}</p>}
          </TutorBubble>

          <div className="card-soft">
            <p className="muted">Kiko mendengar:</p>
            <p style={{ fontSize: 22, fontWeight: 800 }} dir={l.rtl ? 'rtl' : 'ltr'}>
              “{heard || '…'}”
            </p>
            <div className="mt-2">
              <ProgressBar value={score} max={100} />
            </div>
            <p className="muted mt-2">Ketepatan {score}%</p>
          </div>

          <Stars value={starsFromScore(score)} />

          <div className="row">
            <Button variant="sky" onClick={() => sayWord(0.6)}>
              🔊 Dengar
            </Button>
            <Button variant="ghost" onClick={startRecording} disabled={!micReady}>
              🔁 Coba lagi
            </Button>
            <Button variant="mint" onClick={next}>
              Lanjut ➜
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
