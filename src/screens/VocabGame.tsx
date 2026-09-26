import { useEffect, useMemo, useRef, useState } from 'react'
import { THEMES, getTheme } from '../data/curriculum'
import type { Concept } from '../data/curriculum'
import { getLanguage } from '../data/languages'
import type { LangCode } from '../data/languages'
import { getAgeProfile } from '../types'
import type { AgeGroup, TutorFeedback } from '../types'
import { Button, Confetti, ProgressBar, Stars, TopBar, TutorBubble } from '../components/ui'
import { speak, stopSpeaking } from '../lib/speech'
import { sfxCorrect, sfxTryAgain, sfxWin } from '../lib/sfx'
import { askTutor, starsFromScore } from '../lib/tutor'
import {
  adaptChoices,
  learnerProfile,
  levelFor,
  pickSession,
} from '../lib/mastery'
import type { Attempt, ItemMap } from '../lib/mastery'

interface Props {
  lang: LangCode
  themeId: string
  ageGroup: AgeGroup
  learnerName: string
  items: ItemMap
  /** Bila diisi, sesi memakai daftar ini (mode Ulang Cerdas lintas tema) */
  customPool?: Concept[]
  onFinish: (stars: number, attempts: Attempt[]) => void
  onBack: () => void
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Mode = 'dengar' | 'baca'

const LEVEL_EMOJI = { mudah: '🌱', sedang: '🌤️', sulit: '🔥' } as const

export function VocabGame({
  lang,
  themeId,
  ageGroup,
  learnerName,
  items,
  customPool,
  onFinish,
  onBack,
}: Props) {
  const theme = getTheme(themeId)
  const l = getLanguage(lang)
  const age = getAgeProfile(ageGroup)

  // Urutan soal ditentukan sistem pengulangan: kata yang jatuh tempo dan
  // paling lemah muncul lebih dulu, kata baru menyusul.
  const rounds = useMemo(
    () => pickSession(items, lang, customPool ?? theme.concepts, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, customPool, lang],
  )
  const allConcepts = useMemo(() => THEMES.flatMap((t) => t.concepts), [])
  const level = useMemo(() => levelFor(items, lang), [items, lang])
  const profile = useMemo(() => learnerProfile(items, lang), [items, lang])
  // Jumlah pilihan menyesuaikan performa, tetapi tetap dalam batas usia.
  const choiceCount = adaptChoices(age.choices, level)

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [loadingTip, setLoadingTip] = useState(false)
  const [done, setDone] = useState(false)

  const concept = rounds[index]
  // Anak kecil (pra-baca) selalu mode dengar-lalu-pilih-gambar.
  const mode: Mode = ageGroup === 'kecil' ? 'dengar' : index % 2 === 0 ? 'dengar' : 'baca'

  const choices = useMemo(() => {
    if (!concept) return []
    const pool = shuffle(
      allConcepts.filter((c) => c.id !== concept.id && c.emoji !== concept.emoji),
    ).slice(0, choiceCount - 1)
    return shuffle([concept, ...pool])
  }, [concept, allConcepts, choiceCount])

  const sayWord = () =>
    speak(concept[lang].text, { lang: l.speechLang, rate: 0.75 })

  // Ucapkan otomatis pada mode dengar agar anak pra-baca tetap bisa main.
  const spokenFor = useRef<string | null>(null)
  useEffect(() => {
    if (!concept || mode !== 'dengar') return
    if (spokenFor.current === concept.id) return
    spokenFor.current = concept.id
    const t = setTimeout(sayWord, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept?.id, mode])

  useEffect(() => () => stopSpeaking(), [])

  async function choose(c: Concept) {
    if (picked) return
    setPicked(c.id)
    const isRight = c.id === concept.id

    if (isRight) {
      sfxCorrect()
      setCorrectCount((n) => n + 1)
      setAttempts((a) => [...a, { conceptId: concept.id, score: 100 }])
      speak(concept[lang].text, { lang: l.speechLang, rate: 0.8 })
      setTimeout(next, 1100)
    } else {
      sfxTryAgain()
      setWrongCount((n) => n + 1)
      setAttempts((a) => [
        ...a,
        { conceptId: concept.id, score: 25, miss: c.meaning },
      ])
      setLoadingTip(true)
      // Umpan balik AI hanya dipanggil saat anak keliru — di situlah
      // bantuan benar-benar dibutuhkan, dan jeda terasa wajar.
      const fb = await askTutor({
        skill: 'kosakata',
        language: lang,
        ageGroup,
        learnerName,
        target: concept[lang].text,
        targetRoman: concept[lang].roman,
        targetMeaning: concept.meaning,
        attempt: `memilih "${c.meaning}"`,
        score: 30,
        profile,
      })
      setFeedback(fb)
      setLoadingTip(false)
    }
  }

  function next() {
    setPicked(null)
    setFeedback(null)
    if (index + 1 >= rounds.length) {
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (done) {
    const pct = (correctCount / rounds.length) * 100
    const stars = starsFromScore(pct)
    return (
      <div className="stack">
        <Confetti show />
        <TopBar title="🎉 Selesai!" />
        <div className="card center stack">
          <TutorBubble
            mood="cheer"
            text={
              stars === 3
                ? `Luar biasa, ${learnerName}! Semua kata kamu kuasai!`
                : stars === 2
                  ? `Bagus sekali! ${correctCount} dari ${rounds.length} tepat.`
                  : 'Kerja bagus sudah mencoba! Ayo main lagi, pasti makin jago.'
            }
          />
          <Stars value={stars} />
          <p className="muted">
            Benar {correctCount} dari {rounds.length} · Salah {wrongCount}
          </p>
          {wrongCount > 0 && (
            <p className="muted" style={{ fontSize: 15 }}>
              🔁 Kata yang tadi keliru akan Kiko munculkan lagi nanti.
            </p>
          )}
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
        title={
          customPool ? (
            <>🎯 Ulang Cerdas</>
          ) : (
            <>
              {theme.emoji} {theme.title}
            </>
          )
        }
        right={
          <>
            <div className="pill" title={`Tingkat: ${level}`}>
              {LEVEL_EMOJI[level]}
            </div>
            <div className="pill">{l.flag}</div>
          </>
        }
      />
      <ProgressBar value={index} max={rounds.length} />

      <div className="word-card">
        {mode === 'dengar' ? (
          <>
            <div className="word-emoji">🔊</div>
            <div className="word-native" dir={l.rtl ? 'rtl' : 'ltr'}>
              {concept[lang].text}
            </div>
            <div className="word-roman">{concept[lang].roman}</div>
            <Button variant="sky" onClick={sayWord}>
              🔊 Dengar lagi
            </Button>
            <p className="word-meaning mt-4">Yang mana gambarnya?</p>
          </>
        ) : (
          <>
            <div className="word-emoji">{concept.emoji}</div>
            <div className="word-meaning">{concept.meaning}</div>
            <p className="word-meaning mt-4">
              Bagaimana menulisnya dalam {l.name.replace('Bahasa ', '')}?
            </p>
          </>
        )}
      </div>

      <div className="answers">
        {choices.map((c) => {
          const isTarget = c.id === concept.id
          const state =
            picked === null
              ? ''
              : isTarget
                ? 'correct'
                : picked === c.id
                  ? 'wrong'
                  : ''
          return (
            <button
              key={c.id}
              className={`answer ${state}`}
              onClick={() => choose(c)}
              disabled={picked !== null}
            >
              {mode === 'dengar' ? (
                <>
                  <span style={{ fontSize: 44 }}>{c.emoji}</span>
                  <span>{c.meaning}</span>
                </>
              ) : (
                <span dir={l.rtl ? 'rtl' : 'ltr'}>
                  {c[lang].text}
                  <span className="tile-sub"> · {c[lang].roman}</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {(loadingTip || feedback) && (
        <div className="card-soft">
          <TutorBubble loading={loadingTip} mood="happy" size={70}>
            {feedback && (
              <>
                <p>
                  <strong>{feedback.emoji} {feedback.praise}</strong>
                </p>
                {feedback.tip && <p className="mt-2">{feedback.tip}</p>}
                <p className="mt-2" dir={l.rtl ? 'rtl' : 'ltr'}>
                  Jawaban yang benar: <strong>{concept[lang].text}</strong> (
                  {concept[lang].roman}) = {concept.meaning} {concept.emoji}
                </p>
              </>
            )}
          </TutorBubble>
          {feedback && (
            <div className="row mt-4">
              <Button variant="sky" onClick={sayWord}>
                🔊 Ucapkan
              </Button>
              <Button variant="mint" onClick={next}>
                Lanjut ➜
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
