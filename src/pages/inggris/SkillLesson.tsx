import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Confetti,
  ProgressBar,
  Stars,
  TopBar,
  TutorBubble,
  accent,
} from '../../components/ui'
import { TraceCanvas } from '../../components/TraceCanvas'
import type { TraceCanvasHandle } from '../../components/TraceCanvas'
import { useProgress } from '../../lib/progressContext'
import {
  bestScore,
  listen,
  normalize,
  similarity,
  speak,
  sttSupported,
  stopSpeaking,
} from '../../lib/speech'
import type { ListenHandle } from '../../lib/speech'
import { sfxCorrect, sfxTryAgain, sfxWin } from '../../lib/sfx'
import { isStrong, learnerProfile, pickSession, statOf } from '../../lib/mastery'
import type { Attempt, ItemMap, LearnerProfile } from '../../lib/mastery'
import { askTutor, starsFromScore } from '../../lib/tutor'
import type { TutorFeedback, AgeGroup } from '../../types'
import type { LangCode } from '../../data/languages'
import { getLanguage, langFromSlug } from '../../data/languages'
import { LEVELS } from '../../data/enVocab'
import type { EnWord, Level } from '../../data/enVocab'
import { getRichCategory, richCategories } from '../../data/richVocab'
import { skillMaterial, wordMaterials } from '../../data/languageMaterials'
import type { MaterialNote } from '../../data/languageMaterials'
import { skillFromSlug } from './skillMeta'

type LevelSlug = Level | 'semua'

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Bacakan teks dalam bahasa target. */
const say = (text: string, speechLang: string, rate = 0.85) =>
  speak(text, { lang: speechLang, rate })

/** Konteks bahasa yang diteruskan ke tiap mode latihan. */
interface LangCtx {
  lang: LangCode
  speechLang: string
  rtl: boolean
  learnerName: string
  ageGroup: AgeGroup
  profile: LearnerProfile
  items: ItemMap
  /** Semua kata bahasa ini — untuk pengecoh kuis */
  allWords: EnWord[]
}

/* ================================================================== */
/* Halaman pelajaran — memilih mode sesuai keterampilan               */
/* ================================================================== */

export function SkillLesson() {
  const { langSlug, skillSlug, categoryId, level } = useParams()
  const navigate = useNavigate()
  const { progress, record } = useProgress()

  const meta = skillFromSlug(skillSlug)
  const lang = langFromSlug(langSlug)
  const category = lang ? getRichCategory(lang, categoryId) : undefined
  const levelSlug = (level ?? 'semua') as LevelSlug
  const [mode, setMode] = useState<'belajar' | 'latihan'>('belajar')

  const words = useMemo(
    () =>
      category
        ? category.words.filter((wd) => levelSlug === 'semua' || wd.level === levelSlug)
        : [],
    [category, levelSlug],
  )

  useEffect(() => () => stopSpeaking(), [])

  if (!lang || !meta || !category) {
    return (
      <div className="app">
        <TopBar onBack={() => navigate('/')} />
        <p className="notice center mt-4">Halaman tidak ditemukan.</p>
      </div>
    )
  }

  const info = getLanguage(lang)
  const ctx: LangCtx = {
    lang,
    speechLang: info.speechLang,
    rtl: info.rtl,
    learnerName: progress.profile?.name ?? 'Teman',
    ageGroup: progress.profile?.ageGroup ?? 'sedang',
    profile: learnerProfile(progress.items, lang),
    items: progress.items,
    allWords: (richCategories(lang) ?? []).flatMap((c) => c.words),
  }

  const levelMeta = LEVELS.find((l) => l.id === levelSlug)
  const levelLabel = levelMeta ? `${levelMeta.emoji} ${levelMeta.label}` : '🌈 Semua'
  const back = () => navigate(`/${langSlug}/${meta.slug}/${category.id}`)
  const onDone = (stars: number, attempts: Attempt[]) =>
    record({ lang, skill: meta.record, stars, attempts })

  // Menulis: aksara latin (Inggris) memakai ketik; aksara lain memakai jiplak.
  const traceMode = meta.slug === 'menulis' && !info.latinScript

  return (
    <div className="app">
      <TopBar
        onBack={back}
        title={
          <>
            {category.emoji} {category.title}
          </>
        }
        right={<div className="pill">{levelLabel}</div>}
      />

      {meta.slug === 'vocab' && (
        <div className="seg">
          <button
            className={`seg-btn ${mode === 'belajar' ? 'on' : ''}`}
            onClick={() => setMode('belajar')}
          >
            📖 Belajar
          </button>
          <button
            className={`seg-btn ${mode === 'latihan' ? 'on' : ''}`}
            onClick={() => setMode('latihan')}
          >
            🎮 Latihan
          </button>
        </div>
      )}

      {meta.slug === 'vocab' &&
        (mode === 'belajar' ? (
          <LearnView key="learn" words={words} items={progress.items} ctx={ctx} />
        ) : (
          <WordQuiz
            key="quiz"
            words={words}
            categoryColor={category.color}
            allWords={ctx.allWords}
            items={ctx.items}
            lang={ctx.lang}
            speechLang={ctx.speechLang}
            rtl={ctx.rtl}
            onChangeLevel={back}
            onDone={onDone}
          />
        ))}

      {meta.slug === 'pelafalan' && (
        <PronounceView key="pron" words={words} categoryColor={category.color} ctx={ctx} onChangeLevel={back} onDone={onDone} />
      )}

      {meta.slug === 'menulis' && !traceMode && (
        <SpellView key="spell" words={words} categoryColor={category.color} ctx={ctx} onChangeLevel={back} onDone={onDone} />
      )}

      {meta.slug === 'menulis' && traceMode && (
        <TraceView key="trace" words={words} categoryColor={category.color} ctx={ctx} onChangeLevel={back} onDone={onDone} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kerangka akhir sesi (dipakai bersama semua latihan)                */
/* ------------------------------------------------------------------ */

function DoneCard({
  stars,
  correct,
  total,
  onAgain,
  onChangeLevel,
}: {
  stars: number
  correct: number
  total: number
  onAgain: () => void
  onChangeLevel: () => void
}) {
  return (
    <div className="stack">
      <Confetti show />
      <div className="card center stack">
        <TutorBubble
          mood="cheer"
          text={stars === 3 ? 'Luar biasa! Semua bagus! 🎉' : `Bagus! ${correct} dari ${total} tepat.`}
        />
        <Stars value={stars} />
        <Button variant="mint" size="lg" block onClick={onAgain}>
          🔁 Main lagi
        </Button>
        <Button variant="ghost" block onClick={onChangeLevel}>
          🎚️ Ganti tingkat
        </Button>
      </div>
    </div>
  )
}

function LessonNote({ note }: { note: MaterialNote }) {
  return (
    <div className="card-soft">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span style={{ fontSize: 26 }}>{note.emoji}</span>
        <div>
          <strong>{note.title}</strong>
          <p className="muted" style={{ fontSize: 15 }}>
            {note.body}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kosakata — Belajar (kartu)                                         */
/* ------------------------------------------------------------------ */

function LearnView({ words, items, ctx }: { words: EnWord[]; items: ItemMap; ctx: LangCtx }) {
  const [index, setIndex] = useState(0)
  const wd = words[index]

  if (!wd) return <p className="notice center mt-4">Belum ada kata di tingkat ini.</p>

  const known = isStrong(statOf(items, ctx.lang, wd.id))
  const dir = ctx.rtl ? 'rtl' : 'ltr'
  const notes = wordMaterials(ctx.lang, wd)
  const go = (delta: number) => {
    stopSpeaking()
    setIndex((i) => (i + delta + words.length) % words.length)
  }

  return (
    <div className="stack">
      <ProgressBar value={index + 1} max={words.length} />

      <div className="word-card" style={accent('#FFC800')}>
        <div className="word-emoji">{wd.emoji}</div>
        <div className="word-native" dir={dir}>
          {wd.word}
        </div>
        <div className="word-roman">🔊 {wd.say}</div>
        <div className="word-meaning">{wd.meaning}</div>
        {known && <span className="chip chip-new" style={{ marginTop: 6 }}>Sudah kuat 💪</span>}

        <div className="row mt-4" style={{ justifyContent: 'center' }}>
          <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.7)}>
            🐢 Pelan
          </Button>
          <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.95)}>
            🔊 Dengar
          </Button>
        </div>
      </div>

      <div className="card-soft stack">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: 26 }}>💬</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 19 }} dir={dir}>
              {wd.example}
            </p>
            <p className="muted">{wd.exampleId}</p>
          </div>
          <Button variant="ghost" onClick={() => say(wd.example, ctx.speechLang, 0.8)} ariaLabel="Dengar kalimat">
            🔊
          </Button>
        </div>
      </div>

      <div className="fact">
        <span style={{ fontSize: 22 }}>✨</span> {wd.fact}
      </div>

      {notes.length > 0 && (
        <div className="grid grid-2">
          {notes.map((note) => (
            <div key={note.title} className="card-soft">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 25 }}>{note.emoji}</span>
                <div>
                  <strong>{note.title}</strong>
                  <p className="muted" style={{ fontSize: 15 }}>
                    {note.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="row">
        <Button variant="ghost" block onClick={() => go(-1)}>
          ← Sebelumnya
        </Button>
        <Button variant="mint" block onClick={() => go(1)}>
          Berikutnya →
        </Button>
      </div>
      <p className="muted center" style={{ fontSize: 14 }}>
        Kata {index + 1} dari {words.length}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Kosakata — Latihan (pilihan ganda)                                 */
/* ------------------------------------------------------------------ */

/** Kuis pilihan-ganda arti kata. Diekspor agar dipakai ulang oleh Ulang Cerdas. */
export function WordQuiz({
  words,
  categoryColor,
  allWords,
  items,
  lang,
  speechLang,
  rtl,
  onDone,
  onChangeLevel,
}: {
  words: EnWord[]
  categoryColor: string
  allWords: EnWord[]
  items: ItemMap
  lang: LangCode
  speechLang: string
  rtl: boolean
  onDone: (stars: number, attempts: Attempt[]) => void
  onChangeLevel: () => void
}) {
  const rounds = useMemo(
    () => pickSession(items, lang, words, words.length),
    [items, lang, words],
  )
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [done, setDone] = useState(false)
  const recorded = useRef(false)

  const wd = rounds[index]
  const choices = useMemo(() => {
    if (!wd) return []
    const distractors = shuffle(
      allWords.filter((o) => o.id !== wd.id && o.meaning !== wd.meaning),
    ).slice(0, 3)
    return shuffle([wd, ...distractors])
  }, [wd, allWords])

  if (!wd && !done) {
    return <p className="notice center mt-4">Belum ada kata di tingkat ini untuk dilatih.</p>
  }

  function choose(choice: EnWord) {
    if (picked) return
    setPicked(choice.id)
    const right = choice.id === wd.id
    const nextCorrect = correct + (right ? 1 : 0)
    const nextAttempts = [
      ...attempts,
      { conceptId: wd.id, score: right ? 100 : 25, miss: right ? undefined : choice.meaning },
    ]
    if (right) {
      sfxCorrect()
      setCorrect(nextCorrect)
      say(wd.word, speechLang, 0.85)
    } else {
      sfxTryAgain()
    }
    setAttempts(nextAttempts)
    setTimeout(() => next(nextCorrect, nextAttempts), right ? 900 : 2600)
  }

  function next(finalCorrect = correct, finalAttempts = attempts) {
    setPicked(null)
    if (index + 1 >= rounds.length) {
      const stars = starsFromScore((finalCorrect / rounds.length) * 100)
      if (!recorded.current) {
        recorded.current = true
        onDone(stars, finalAttempts)
      }
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  function restart() {
    setIndex(0)
    setCorrect(0)
    setAttempts([])
    setPicked(null)
    recorded.current = false
    setDone(false)
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneCard
        stars={stars}
        correct={correct}
        total={rounds.length}
        onAgain={restart}
        onChangeLevel={onChangeLevel}
      />
    )
  }

  return (
    <div className="stack">
      <ProgressBar value={index} max={rounds.length} />

      <div className="word-card" style={accent(categoryColor)}>
        <div className="word-emoji">{wd.emoji}</div>
        <div className="word-native" dir={rtl ? 'rtl' : 'ltr'}>
          {wd.word}
        </div>
        <Button variant="sky" onClick={() => say(wd.word, speechLang, 0.85)}>
          🔊 Dengar
        </Button>
        <p className="word-meaning mt-4">Apa artinya?</p>
      </div>

      <div className="answers">
        {choices.map((c) => {
          const state =
            picked === null ? '' : c.id === wd.id ? 'correct' : picked === c.id ? 'wrong' : ''
          return (
            <button
              key={c.id}
              className={`answer ${state}`}
              onClick={() => choose(c)}
              disabled={picked !== null}
            >
              <span style={{ fontSize: 32 }}>{c.emoji}</span>
              <span>{c.meaning}</span>
            </button>
          )
        })}
      </div>

      {picked && picked !== wd.id && (
        <div className="fact">
          <span style={{ fontSize: 22 }}>✨</span> <strong>{wd.word}</strong> = {wd.meaning}.{' '}
          {wd.fact}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pelafalan — dengar & tirukan (mikrofon)                            */
/* ------------------------------------------------------------------ */

function PronounceView({
  words,
  categoryColor,
  ctx,
  onDone,
  onChangeLevel,
}: {
  words: EnWord[]
  categoryColor: string
  ctx: LangCtx
  onDone: (stars: number, attempts: Attempt[]) => void
  onChangeLevel: () => void
}) {
  const rounds = useMemo(
    () => pickSession(ctx.items, ctx.lang, words, words.length),
    [ctx.items, ctx.lang, words],
  )
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'siap' | 'rekam' | 'nilai' | 'hasil'>('siap')
  const [heard, setHeard] = useState('')
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const recorded = useRef(false)

  const handle = useRef<ListenHandle | null>(null)
  const wd = rounds[index]
  const micReady = sttSupported()
  const dir = ctx.rtl ? 'rtl' : 'ltr'
  const note = skillMaterial(ctx.lang, 'pelafalan')

  useEffect(
    () => () => {
      handle.current?.stop()
      stopSpeaking()
    },
    [],
  )

  if (!wd) return <p className="notice center mt-4">Belum ada kata di tingkat ini.</p>

  async function grade(said: string, raw: number) {
    setPhase('nilai')
    setHeard(said)
    setScore(raw)
    setFeedback(null)
    if (raw >= 70) {
      sfxCorrect()
      setCorrect((n) => n + 1)
    } else {
      sfxTryAgain()
    }
    setAttempts((a) => [...a, { conceptId: wd.id, score: raw, miss: raw < 70 ? said : undefined }])
    const fb = await askTutor({
      skill: 'pelafalan',
      language: ctx.lang,
      ageGroup: ctx.ageGroup,
      learnerName: ctx.learnerName,
      target: wd.word,
      targetRoman: wd.say,
      targetMeaning: wd.meaning,
      attempt: said || '(tidak terdengar)',
      score: raw,
      profile: ctx.profile,
    })
    setFeedback(fb)
    setPhase('hasil')
  }

  function startRecording() {
    if (!micReady) return
    setMicError(null)
    setHeard('')
    setFeedback(null)
    setPhase('rekam')
    stopSpeaking()
    handle.current = listen({
      lang: ctx.speechLang,
      onResult: (_first, alts) => {
        const { score: s, said } = bestScore(alts, [wd.word, wd.say])
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
      onEnd: () => setPhase((p) => (p === 'rekam' ? 'siap' : p)),
    })
  }

  function next() {
    setHeard('')
    setFeedback(null)
    setPhase('siap')
    if (index + 1 >= rounds.length) {
      const stars = starsFromScore((correct / rounds.length) * 100)
      if (!recorded.current) {
        recorded.current = true
        onDone(stars, attempts)
      }
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneCard
        stars={stars}
        correct={correct}
        total={rounds.length}
        onAgain={() => {
          setIndex(0)
          setCorrect(0)
          setAttempts([])
          setFeedback(null)
          setPhase('siap')
          recorded.current = false
          setDone(false)
        }}
        onChangeLevel={onChangeLevel}
      />
    )
  }

  return (
    <div className="stack">
      <ProgressBar value={index} max={rounds.length} />

      <div className="word-card" style={accent(categoryColor)}>
        <div className="word-emoji">{wd.emoji}</div>
        <div className="word-native" dir={dir}>
          {wd.word}
        </div>
        <div className="word-roman">🔊 {wd.say}</div>
        <div className="word-meaning">{wd.meaning}</div>
        <div className="row mt-4" style={{ justifyContent: 'center' }}>
          <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.6)}>
            🐢 Pelan
          </Button>
          <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.9)}>
            🔊 Normal
          </Button>
        </div>
      </div>

      {note && <LessonNote note={note} />}

      {(phase === 'siap' || phase === 'rekam') && (
        <div className="card center stack">
          <p style={{ fontWeight: 800, fontSize: 20 }}>
            {phase === 'rekam' ? 'Kiko sedang mendengarkan…' : 'Sekarang giliranmu!'}
          </p>
          <button
            className={`mic-btn ${phase === 'rekam' ? 'recording' : ''}`}
            onClick={() => (phase === 'rekam' ? handle.current?.stop() : startRecording())}
            disabled={!micReady}
            aria-label={phase === 'rekam' ? 'Berhenti merekam' : 'Mulai bicara'}
          >
            🎤
          </button>
          <p className="muted">
            {phase === 'rekam' ? 'Ucapkan sekarang' : 'Tekan lalu ucapkan kata di atas'}
          </p>
          {micError && <div className="notice">😊 {micError}</div>}
          {!micReady && (
            <>
              <div className="notice">
                🎤 Mikrofon tidak tersedia. Kamu tetap bisa berlatih: dengarkan lalu tirukan
                dengan suara keras!
              </div>
              <Button variant="mint" onClick={() => void grade('(latihan mandiri)', 75)}>
                Aku sudah menirukan ✅
              </Button>
            </>
          )}
        </div>
      )}

      {phase === 'nilai' && (
        <div className="card">
          <TutorBubble loading size={72} />
        </div>
      )}

      {phase === 'hasil' && feedback && (
        <div className="card stack">
          <TutorBubble mood={score >= 70 ? 'cheer' : 'happy'} size={72}>
            <p>
              <strong>
                {feedback.emoji} {feedback.praise}
              </strong>
            </p>
            {feedback.tip && <p className="mt-2">{feedback.tip}</p>}
          </TutorBubble>
          <div className="card-soft">
            <p className="muted">Kiko mendengar:</p>
            <p style={{ fontSize: 22, fontWeight: 800 }} dir={dir}>
              “{heard || '…'}”
            </p>
            <div className="mt-2">
              <ProgressBar value={score} max={100} />
            </div>
            <p className="muted mt-2">Ketepatan {score}%</p>
          </div>
          <div className="fact">
            <span style={{ fontSize: 22 }}>✨</span> {wd.fact}
          </div>
          <Stars value={starsFromScore(score)} />
          <div className="row">
            <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.6)}>
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

/* ------------------------------------------------------------------ */
/* Menulis (aksara latin) — eja dari gambar & bunyi                   */
/* ------------------------------------------------------------------ */

function SpellView({
  words,
  categoryColor,
  ctx,
  onDone,
  onChangeLevel,
}: {
  words: EnWord[]
  categoryColor: string
  ctx: LangCtx
  onDone: (stars: number, attempts: Attempt[]) => void
  onChangeLevel: () => void
}) {
  const rounds = useMemo(
    () => pickSession(ctx.items, ctx.lang, words, words.length),
    [ctx.items, ctx.lang, words],
  )
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [loadingTip, setLoadingTip] = useState(false)
  const [hintLen, setHintLen] = useState(0)
  const [done, setDone] = useState(false)
  const recorded = useRef(false)

  const wd = rounds[index]
  const note = skillMaterial(ctx.lang, 'menulis')

  useEffect(() => {
    if (wd && !checked) {
      const t = setTimeout(() => say(wd.word, ctx.speechLang, 0.8), 300)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => () => stopSpeaking(), [])

  if (!wd) return <p className="notice center mt-4">Belum ada kata di tingkat ini.</p>

  async function check() {
    if (checked || !typed.trim()) return
    const exact = normalize(typed) === normalize(wd.word)
    const raw = exact ? 100 : similarity(typed, wd.word)
    const said = typed.trim()
    setScore(raw)
    setChecked(true)
    setFeedback(null)
    setLoadingTip(true)
    if (raw >= 70) {
      sfxCorrect()
      setCorrect((n) => n + 1)
      say(wd.word, ctx.speechLang, 0.85)
    } else {
      sfxTryAgain()
    }
    setAttempts((a) => [...a, { conceptId: wd.id, score: raw, miss: raw < 70 ? said : undefined }])
    const fb = await askTutor({
      skill: 'menulis',
      language: ctx.lang,
      ageGroup: ctx.ageGroup,
      learnerName: ctx.learnerName,
      target: wd.word,
      targetRoman: wd.say,
      targetMeaning: wd.meaning,
      attempt: said,
      score: raw,
      profile: ctx.profile,
    })
    setFeedback(fb)
    setLoadingTip(false)
  }

  function next() {
    setTyped('')
    setChecked(false)
    setFeedback(null)
    setLoadingTip(false)
    setHintLen(0)
    if (index + 1 >= rounds.length) {
      const stars = starsFromScore((correct / rounds.length) * 100)
      if (!recorded.current) {
        recorded.current = true
        onDone(stars, attempts)
      }
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneCard
        stars={stars}
        correct={correct}
        total={rounds.length}
        onAgain={() => {
          setIndex(0)
          setCorrect(0)
          setAttempts([])
          setTyped('')
          setChecked(false)
          setFeedback(null)
          setLoadingTip(false)
          setHintLen(0)
          recorded.current = false
          setDone(false)
        }}
        onChangeLevel={onChangeLevel}
      />
    )
  }

  return (
    <div className="stack">
      <ProgressBar value={index} max={rounds.length} />

      <div className="word-card" style={accent(categoryColor)}>
        <div className="word-emoji">{wd.emoji}</div>
        <div className="word-meaning">{wd.meaning}</div>
        <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.8)}>
          🔊 Dengar kata
        </Button>
        {hintLen > 0 && !checked && (
          <p className="word-roman mt-2">
            Petunjuk: {wd.word.slice(0, hintLen)}
            {'•'.repeat(Math.max(0, wd.word.length - hintLen))}
          </p>
        )}
      </div>

      {note && <LessonNote note={note} />}

      {!checked ? (
        <div className="card stack">
          <p className="center" style={{ fontWeight: 800, fontSize: 20 }}>
            Tulis kata Bahasa Inggrisnya!
          </p>
          <input
            className="input"
            placeholder="Ketik di sini…"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void check()}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label="Ketik kata Bahasa Inggris"
          />
          <div className="row">
            <Button
              variant="ghost"
              onClick={() => setHintLen((n) => Math.min(wd.word.length - 1, n + 1))}
              disabled={hintLen >= wd.word.length - 1}
            >
              💡 Petunjuk
            </Button>
            <Button variant="grape" block onClick={() => void check()} disabled={!typed.trim()}>
              ✅ Periksa
            </Button>
          </div>
        </div>
      ) : (
        <div className="card stack">
          <TutorBubble loading={loadingTip} mood={score >= 70 ? 'cheer' : 'happy'} size={72}>
            {feedback && (
              <>
                <p>
                  <strong>
                    {feedback.emoji} {feedback.praise}
                  </strong>
                </p>
                {feedback.tip && <p className="mt-2">{feedback.tip}</p>}
                <p className="mt-2">
                  Kamu menulis: <strong>{typed || '—'}</strong>
                </p>
                <p>
                  Ejaan yang benar: <strong>{wd.word}</strong> ({wd.say})
                </p>
              </>
            )}
          </TutorBubble>

          {!loadingTip && (
            <>
              <div className="fact">
                <span style={{ fontSize: 22 }}>✨</span> {wd.fact}
              </div>
              <ProgressBar value={score} max={100} />
              <Stars value={starsFromScore(score)} />
              <div className="row">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setChecked(false)
                    setFeedback(null)
                    setTyped('')
                  }}
                >
                  🔁 Ulangi
                </Button>
                <Button variant="mint" block onClick={next}>
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

/* ------------------------------------------------------------------ */
/* Menulis (aksara non-latin) — jiplak huruf                          */
/* ------------------------------------------------------------------ */

function TraceView({
  words,
  categoryColor,
  ctx,
  onDone,
  onChangeLevel,
}: {
  words: EnWord[]
  categoryColor: string
  ctx: LangCtx
  onDone: (stars: number, attempts: Attempt[]) => void
  onChangeLevel: () => void
}) {
  const rounds = useMemo(
    () => pickSession(ctx.items, ctx.lang, words, words.length),
    [ctx.items, ctx.lang, words],
  )
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [loadingTip, setLoadingTip] = useState(false)
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState(false)
  const recorded = useRef(false)

  const canvasRef = useRef<TraceCanvasHandle | null>(null)
  const wd = rounds[index]
  const note = skillMaterial(ctx.lang, 'menulis')

  useEffect(() => () => stopSpeaking(), [])

  if (!wd) return <p className="notice center mt-4">Belum ada kata di tingkat ini.</p>

  async function check() {
    if (checked) return
    const res = canvasRef.current?.evaluate()
    if (!res || res.empty) {
      setHint(true)
      return
    }
    const raw = res.score
    setScore(raw)
    setChecked(true)
    setFeedback(null)
    setLoadingTip(true)
    if (raw >= 70) {
      sfxCorrect()
      setCorrect((n) => n + 1)
      say(wd.word, ctx.speechLang, 0.8)
    } else {
      sfxTryAgain()
    }
    setAttempts((a) => [
      ...a,
      {
        conceptId: wd.id,
        score: raw,
        miss: raw < 70 ? `jiplakan menutup ${res.coverage}%` : undefined,
      },
    ])
    const fb = await askTutor({
      skill: 'menulis',
      language: ctx.lang,
      ageGroup: ctx.ageGroup,
      learnerName: ctx.learnerName,
      target: wd.word,
      targetRoman: wd.say,
      targetMeaning: wd.meaning,
      attempt: `jiplakan menutup ${res.coverage}% bentuk, ${res.spill}% keluar garis`,
      score: raw,
      profile: ctx.profile,
    })
    setFeedback(fb)
    setLoadingTip(false)
  }

  function next() {
    setChecked(false)
    setFeedback(null)
    setLoadingTip(false)
    setHint(false)
    canvasRef.current?.clear()
    if (index + 1 >= rounds.length) {
      const stars = starsFromScore((correct / rounds.length) * 100)
      if (!recorded.current) {
        recorded.current = true
        onDone(stars, attempts)
      }
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneCard
        stars={stars}
        correct={correct}
        total={rounds.length}
        onAgain={() => {
          setIndex(0)
          setCorrect(0)
          setAttempts([])
          setChecked(false)
          setFeedback(null)
          setLoadingTip(false)
          setHint(false)
          canvasRef.current?.clear()
          recorded.current = false
          setDone(false)
        }}
        onChangeLevel={onChangeLevel}
      />
    )
  }

  return (
    <div className="stack">
      <ProgressBar value={index} max={rounds.length} />

      <div className="card-soft center">
        <div className="row" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: 40 }}>{wd.emoji}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{wd.meaning}</div>
            <div className="muted" dir={ctx.rtl ? 'rtl' : 'ltr'}>
              {wd.word} · {wd.say}
            </div>
          </div>
          <Button variant="sky" onClick={() => say(wd.word, ctx.speechLang, 0.7)} ariaLabel="Dengar kata">
            🔊
          </Button>
        </div>
      </div>

      {note && <LessonNote note={note} />}

      {!checked ? (
        <>
          <p className="center" style={{ fontWeight: 800, fontSize: 20 }}>
            Jiplak hurufnya dengan jarimu! ✍️
          </p>
          <TraceCanvas ref={canvasRef} glyph={wd.word} rtl={ctx.rtl} color={categoryColor} />
          {hint && (
            <div className="notice center">
              ✏️ Belum ada tulisannya. Sentuh kotak lalu ikuti garis putus-putus ya!
            </div>
          )}
          <div className="row" style={{ justifyContent: 'center' }}>
            <Button variant="ghost" onClick={() => canvasRef.current?.clear()}>
              🧽 Hapus
            </Button>
            <Button variant="grape" onClick={() => void check()}>
              ✅ Periksa
            </Button>
          </div>
        </>
      ) : (
        <div className="card stack">
          <TutorBubble loading={loadingTip} mood={score >= 70 ? 'cheer' : 'happy'} size={72}>
            {feedback && (
              <>
                <p>
                  <strong>
                    {feedback.emoji} {feedback.praise}
                  </strong>
                </p>
                {feedback.tip && <p className="mt-2">{feedback.tip}</p>}
              </>
            )}
          </TutorBubble>

          {!loadingTip && (
            <>
              <div className="fact">
                <span style={{ fontSize: 22 }}>✨</span> {wd.fact}
              </div>
              <ProgressBar value={score} max={100} />
              <Stars value={starsFromScore(score)} />
              <div className="row">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setChecked(false)
                    setFeedback(null)
                    setHint(false)
                    canvasRef.current?.clear()
                  }}
                >
                  🔁 Ulangi
                </Button>
                <Button variant="mint" block onClick={next}>
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
