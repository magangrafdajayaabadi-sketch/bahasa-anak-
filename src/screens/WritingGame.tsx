import { useEffect, useMemo, useRef, useState } from 'react'
import { getTheme } from '../data/curriculum'
import { getLanguage } from '../data/languages'
import type { LangCode } from '../data/languages'
import { getAgeProfile } from '../types'
import type { AgeGroup, TutorFeedback } from '../types'
import { Button, Confetti, ProgressBar, Stars, TopBar, TutorBubble } from '../components/ui'
import { TraceCanvas } from '../components/TraceCanvas'
import type { TraceCanvasHandle } from '../components/TraceCanvas'
import { normalize, speak, stopSpeaking } from '../lib/speech'
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

type RoundKind = 'jiplak' | 'eja'

export function WritingGame({
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
  const age = getAgeProfile(ageGroup)

  const rounds = useMemo(() => {
    // Huruf yang masih lemah dijiplak lebih dulu.
    const ordered = pickSession(items, lang, theme.concepts, 6)
    const trace = ordered
      .slice(0, 4)
      .map((c) => ({ concept: c, kind: 'jiplak' as RoundKind }))
    // Anak 9–12 tahun mendapat tambahan babak mengeja (mengetik).
    const spell = age.spelling
      ? ordered.slice(4, 6).map((c) => ({ concept: c, kind: 'eja' as RoundKind }))
      : []
    return [...trace, ...spell]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, age.spelling, lang])
  const profile = useMemo(() => learnerProfile(items, lang), [items, lang])

  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState(false)

  const canvasRef = useRef<TraceCanvasHandle | null>(null)
  const round = rounds[index]
  const term = round.concept[lang]

  useEffect(() => () => stopSpeaking(), [])

  const sayWord = () => speak(term.text, { lang: l.speechLang, rate: 0.7 })

  async function check() {
    if (busy || checked) return

    let raw = 0
    let attempt = ''

    if (round.kind === 'jiplak') {
      const res = canvasRef.current?.evaluate()
      if (!res || res.empty) {
        setHint(true)
        return
      }
      raw = res.score
      attempt = `jiplakan menutup ${res.coverage}% bentuk huruf, ${res.spill}% coretan keluar garis`
    } else {
      const ok = normalize(typed) === normalize(term.roman)
      const partial = normalize(typed).startsWith(normalize(term.roman).slice(0, 3))
      raw = ok ? 100 : partial ? 60 : 25
      attempt = typed.trim() || '(kosong)'
    }

    setScore(raw)
    setChecked(true)
    setBusy(true)
    if (raw >= 70) sfxCorrect()
    else sfxTryAgain()

    setAttempts((a) => [
      ...a,
      {
        conceptId: round.concept.id,
        score: raw,
        miss: raw < 70 ? attempt : undefined,
      },
    ])

    const fb = await askTutor({
      skill: 'menulis',
      language: lang,
      ageGroup,
      learnerName,
      target: round.kind === 'eja' ? term.roman : term.text,
      targetRoman: term.roman,
      targetMeaning: round.concept.meaning,
      attempt,
      score: raw,
      profile,
    })
    setFeedback(fb)
    setScores((s) => [...s, raw])
    setBusy(false)
  }

  function retry() {
    setChecked(false)
    setFeedback(null)
    setHint(false)
    canvasRef.current?.clear()
    setTyped('')
  }

  function next() {
    setChecked(false)
    setFeedback(null)
    setHint(false)
    setTyped('')
    canvasRef.current?.clear()
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
            text={`Tulisanmu makin rapi, ${learnerName}! Terus berlatih ya.`}
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
        title={<>✏️ Menulis</>}
        right={<div className="pill">{l.flag}</div>}
      />
      <ProgressBar value={index} max={rounds.length} />

      <div className="card-soft center">
        <div className="row" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: 44 }}>{round.concept.emoji}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{round.concept.meaning}</div>
            <div className="muted">
              {term.text} · {term.roman}
            </div>
          </div>
          <Button variant="sky" onClick={sayWord} ariaLabel="Dengarkan kata">
            🔊
          </Button>
        </div>
      </div>

      {round.kind === 'jiplak' ? (
        <>
          <p className="center" style={{ fontWeight: 800, fontSize: 20 }}>
            Jiplak hurufnya dengan jarimu! ✍️
          </p>
          <TraceCanvas
            ref={canvasRef}
            glyph={term.text}
            rtl={l.rtl}
            color={theme.color}
          />
          {hint && (
            <div className="notice center">
              ✏️ Belum ada tulisannya. Sentuh kotak lalu ikuti garis putus-putus ya!
            </div>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="ghost" onClick={() => canvasRef.current?.clear()}>
              🧽 Hapus
            </Button>
            <Button variant="grape" onClick={check} disabled={busy || checked}>
              ✅ Periksa
            </Button>
          </div>
        </>
      ) : (
        <div className="card stack">
          <p className="center" style={{ fontWeight: 800, fontSize: 20 }}>
            Ketik cara bacanya dengan huruf latin!
          </p>
          <input
            className="input"
            placeholder="Contoh: neko"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={checked}
            aria-label="Ketik ejaan"
          />
          <Button
            variant="grape"
            block
            onClick={check}
            disabled={busy || checked || !typed.trim()}
          >
            ✅ Periksa
          </Button>
        </div>
      )}

      {checked && (
        <div className="card stack">
          <TutorBubble
            loading={busy}
            mood={score >= 70 ? 'cheer' : 'happy'}
            size={72}
          >
            {feedback && (
              <>
                <p>
                  <strong>
                    {feedback.emoji} {feedback.praise}
                  </strong>
                </p>
                {feedback.tip && <p className="mt-2">{feedback.tip}</p>}
                {feedback.correction && (
                  <p className="mt-2" dir={l.rtl ? 'rtl' : 'ltr'}>
                    Bentuk yang benar: <strong>{feedback.correction}</strong>
                  </p>
                )}
              </>
            )}
          </TutorBubble>

          {!busy && (
            <>
              <ProgressBar value={score} max={100} />
              <p className="muted center">Ketepatan {score}%</p>
              <Stars value={starsFromScore(score)} />
              <div className="row" style={{ justifyContent: 'center' }}>
                <Button variant="ghost" onClick={retry}>
                  🔁 Ulangi
                </Button>
                <Button variant="mint" onClick={next}>
                  Lanjut ➜
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
