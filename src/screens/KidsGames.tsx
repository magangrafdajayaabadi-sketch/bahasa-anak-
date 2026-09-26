import { useEffect, useMemo, useState } from 'react'
import { getLanguage } from '../data/languages'
import type { LangCode } from '../data/languages'
import { richCategories, getRichCategory } from '../data/richVocab'
import type { EnWord } from '../data/enVocab'
import { getAgeProfile } from '../types'
import type { AgeGroup, SkillId } from '../types'
import { Button, Confetti, ProgressBar, Stars, TopBar, TutorBubble, accent } from '../components/ui'
import { speak, stopSpeaking } from '../lib/speech'
import { sfxCorrect, sfxTryAgain, sfxWin } from '../lib/sfx'
import { adaptChoices, levelFor, pickSession } from '../lib/mastery'
import type { Attempt, ItemMap } from '../lib/mastery'
import { starsFromScore } from '../lib/tutor'
import { skillMaterial, wordMaterials } from '../data/languageMaterials'
import type { MaterialNote } from '../data/languageMaterials'
import { listeningMaterial } from '../data/listeningMaterials'

interface GameProps {
  lang: LangCode
  themeId: string
  ageGroup: AgeGroup
  learnerName: string
  items: ItemMap
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

function wordsFor(lang: LangCode, themeId: string): { words: EnWord[]; allWords: EnWord[] } {
  const cats = richCategories(lang) ?? []
  const category = getRichCategory(lang, themeId) ?? cats[0]
  return {
    words: category?.words ?? [],
    allWords: cats.flatMap((c) => c.words),
  }
}

function choicesFor(target: EnWord, allWords: EnWord[], count: number): EnWord[] {
  const distractors = shuffle(
    allWords.filter(
      (w) => w.id !== target.id && w.meaning !== target.meaning && w.word !== target.word,
    ),
  ).slice(0, count - 1)
  return shuffle([target, ...distractors])
}

function DoneScreen({
  title,
  text,
  stars,
  attempts,
  onFinish,
}: {
  title: string
  text: string
  stars: number
  attempts: Attempt[]
  onFinish: (stars: number, attempts: Attempt[]) => void
}) {
  return (
    <div className="stack">
      <Confetti show />
      <TopBar title={title} />
      <div className="card center stack">
        <TutorBubble mood="cheer" text={text} />
        <Stars value={stars} />
        <Button variant="mint" size="lg" block onClick={() => onFinish(stars, attempts)}>
          Ambil Bintang! ⭐
        </Button>
      </div>
    </div>
  )
}

function MaterialCard({ note }: { note: MaterialNote }) {
  return (
    <div className="card-soft">
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
  )
}

function MaterialGrid({ notes }: { notes: MaterialNote[] }) {
  if (!notes.length) return null
  return (
    <div className="grid grid-2">
      {notes.map((note) => (
        <MaterialCard key={note.title} note={note} />
      ))}
    </div>
  )
}

function useWordRounds(lang: LangCode, themeId: string, items: ItemMap, count: number) {
  const { words, allWords } = useMemo(() => wordsFor(lang, themeId), [lang, themeId])
  const rounds = useMemo(
    () => pickSession(items, lang, words, Math.min(count, words.length)),
    [items, lang, words, count],
  )
  return { rounds, allWords }
}

export function ListeningGame({
  lang,
  themeId,
  ageGroup,
  learnerName,
  items,
  onFinish,
  onBack,
}: GameProps) {
  const l = getLanguage(lang)
  const age = getAgeProfile(ageGroup)
  const level = levelFor(items, lang)
  const choiceCount = adaptChoices(age.choices, level)
  const { rounds, allWords } = useWordRounds(lang, themeId, items, 6)
  const note = skillMaterial(lang, 'mendengar')
  const material = listeningMaterial(lang)

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [done, setDone] = useState(false)

  const wd = rounds[index]
  const choices = useMemo(
    () => (wd ? choicesFor(wd, allWords, choiceCount) : []),
    [wd, allWords, choiceCount],
  )

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    if (!wd || done) return
    const t = setTimeout(() => speak(wd.word, { lang: l.speechLang, rate: 0.72 }), 350)
    return () => clearTimeout(t)
  }, [wd, done, l.speechLang])

  if (!wd && !done) return <p className="notice center mt-4">Belum ada kata di tema ini.</p>

  function next() {
    setPicked(null)
    if (index + 1 >= rounds.length) {
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  function choose(choice: EnWord) {
    if (picked || !wd) return
    const right = choice.id === wd.id
    setPicked(choice.id)
    setAttempts((a) => [
      ...a,
      { conceptId: wd.id, score: right ? 100 : 25, miss: right ? undefined : choice.meaning },
    ])
    if (right) {
      sfxCorrect()
      setCorrect((n) => n + 1)
      setTimeout(next, 850)
    } else {
      sfxTryAgain()
    }
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneScreen
        title="Selesai!"
        text={`Telingamu hebat, ${learnerName}! Kamu mengenali ${correct} dari ${rounds.length} kata.`}
        stars={stars}
        attempts={attempts}
        onFinish={onFinish}
      />
    )
  }

  return (
    <div className="stack">
      <TopBar onBack={onBack} title="👂 Mendengar" right={<div className="pill">{l.flag}</div>} />
      <ProgressBar value={index} max={rounds.length} />
      <div className="word-card" style={accent('#1CB0F6')}>
        <div className="word-emoji">🔊</div>
        <div className="word-meaning">Dengar kata Kiko, lalu pilih gambarnya.</div>
        <Button variant="sky" onClick={() => speak(wd.word, { lang: l.speechLang, rate: 0.72 })}>
          🔊 Dengar lagi
        </Button>
      </div>
      {note && <MaterialCard note={note} />}
      <div className="card-soft stack">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: 25 }}>🎧</span>
          <div>
            <strong>{material.title}</strong>
            <p className="muted" style={{ fontSize: 15 }}>
              {material.focus}
            </p>
          </div>
        </div>
        <div className="notice notice-sun">{material.warmup}</div>
        <div className="chips-row">
          {material.soundClues.slice(0, 2).map((clue) => (
            <span key={clue} className="filter-chip">
              {clue}
            </span>
          ))}
        </div>
      </div>
      <div className="answers">
        {choices.map((c) => {
          const state =
            picked === null ? '' : c.id === wd.id ? 'correct' : picked === c.id ? 'wrong' : ''
          return (
            <button
              key={c.id}
              className={`answer ${state}`}
              disabled={picked !== null}
              onClick={() => choose(c)}
            >
              <span style={{ fontSize: 42 }}>{c.emoji}</span>
              <span>{c.meaning}</span>
            </button>
          )
        })}
      </div>
      {picked && picked !== wd.id && (
        <div className="card-soft stack">
          <TutorBubble
            mood="happy"
            text={`Hampir! Yang Kiko ucapkan adalah ${wd.meaning}.`}
            size={70}
          />
          <p className="center" dir={l.rtl ? 'rtl' : 'ltr'}>
            <strong>{wd.word}</strong> · {wd.say}
          </p>
          <p className="muted center" style={{ fontSize: 15 }}>
            {material.miniDrills[index % material.miniDrills.length]}
          </p>
          <Button variant="mint" onClick={next}>
            Lanjut ➜
          </Button>
        </div>
      )}
    </div>
  )
}

export function ReadingGame({
  lang,
  themeId,
  ageGroup,
  learnerName,
  items,
  onFinish,
  onBack,
}: GameProps) {
  const l = getLanguage(lang)
  const age = getAgeProfile(ageGroup)
  const level = levelFor(items, lang)
  const choiceCount = adaptChoices(age.choices, level)
  const { rounds, allWords } = useWordRounds(lang, themeId, items, 6)

  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [done, setDone] = useState(false)

  const wd = rounds[index]
  const note = skillMaterial(lang, 'membaca')
  const notes = [
    ...(note ? [note] : []),
    ...(wd ? wordMaterials(lang, wd).slice(0, 1) : []),
  ]
  const choices = useMemo(
    () => (wd ? choicesFor(wd, allWords, choiceCount) : []),
    [wd, allWords, choiceCount],
  )

  useEffect(() => () => stopSpeaking(), [])

  if (!wd && !done) return <p className="notice center mt-4">Belum ada kata di tema ini.</p>

  function next() {
    setPicked(null)
    if (index + 1 >= rounds.length) {
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  function choose(choice: EnWord) {
    if (picked || !wd) return
    const right = choice.id === wd.id
    setPicked(choice.id)
    setAttempts((a) => [
      ...a,
      { conceptId: wd.id, score: right ? 100 : 25, miss: right ? undefined : choice.meaning },
    ])
    if (right) {
      sfxCorrect()
      setCorrect((n) => n + 1)
      setTimeout(next, 850)
    } else {
      sfxTryAgain()
    }
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneScreen
        title="Selesai!"
        text={`Membacamu makin lancar, ${learnerName}! ${correct} dari ${rounds.length} tepat.`}
        stars={stars}
        attempts={attempts}
        onFinish={onFinish}
      />
    )
  }

  return (
    <div className="stack">
      <TopBar onBack={onBack} title="📖 Membaca" right={<div className="pill">{l.flag}</div>} />
      <ProgressBar value={index} max={rounds.length} />
      <div className="word-card" style={accent('#58CC02')}>
        <div className="word-native" dir={l.rtl ? 'rtl' : 'ltr'}>
          {wd.word}
        </div>
        <div className="word-roman">{wd.say}</div>
        <Button variant="sky" onClick={() => speak(wd.word, { lang: l.speechLang, rate: 0.8 })}>
          🔊 Dengar
        </Button>
        <p className="word-meaning mt-4">Apa artinya?</p>
      </div>
      <MaterialGrid notes={notes} />
      <div className="answers">
        {choices.map((c) => {
          const state =
            picked === null ? '' : c.id === wd.id ? 'correct' : picked === c.id ? 'wrong' : ''
          return (
            <button
              key={c.id}
              className={`answer ${state}`}
              disabled={picked !== null}
              onClick={() => choose(c)}
            >
              <span style={{ fontSize: 34 }}>{c.emoji}</span>
              <span>{c.meaning}</span>
            </button>
          )
        })}
      </div>
      {picked && picked !== wd.id && (
        <div className="fact">
          <strong>{wd.word}</strong> berarti {wd.meaning}. {wd.fact}
          <div className="mt-2">
            <Button variant="mint" onClick={next}>
              Lanjut ➜
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function StoryGame({
  lang,
  themeId,
  learnerName,
  items,
  onFinish,
  onBack,
}: GameProps) {
  const l = getLanguage(lang)
  const { rounds, allWords } = useWordRounds(lang, themeId, items, 5)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [done, setDone] = useState(false)

  const wd = rounds[index]
  const note = skillMaterial(lang, 'cerita')
  const notes = [
    ...(note ? [note] : []),
    ...(wd ? wordMaterials(lang, wd).slice(0, 1) : []),
  ]
  const choices = useMemo(() => (wd ? choicesFor(wd, allWords, 3) : []), [wd, allWords])

  useEffect(() => () => stopSpeaking(), [])

  if (!wd && !done) return <p className="notice center mt-4">Belum ada cerita di tema ini.</p>

  function next() {
    setPicked(null)
    if (index + 1 >= rounds.length) {
      setDone(true)
      sfxWin()
    } else {
      setIndex((i) => i + 1)
    }
  }

  function choose(choice: EnWord) {
    if (picked || !wd) return
    const right = choice.id === wd.id
    setPicked(choice.id)
    setAttempts((a) => [
      ...a,
      { conceptId: wd.id, score: right ? 100 : 35, miss: right ? undefined : choice.meaning },
    ])
    if (right) {
      sfxCorrect()
      setCorrect((n) => n + 1)
      setTimeout(next, 1000)
    } else {
      sfxTryAgain()
    }
  }

  if (done) {
    const stars = starsFromScore((correct / rounds.length) * 100)
    return (
      <DoneScreen
        title="Cerita selesai!"
        text={`Kamu mengikuti cerita dengan bagus, ${learnerName}.`}
        stars={stars}
        attempts={attempts}
        onFinish={onFinish}
      />
    )
  }

  return (
    <div className="stack">
      <TopBar onBack={onBack} title="🌟 Cerita" right={<div className="pill">{l.flag}</div>} />
      <ProgressBar value={index} max={rounds.length} />
      <div className="card stack">
        <TutorBubble text={`Cerita ${index + 1}: dengarkan kalimat kecil ini.`} size={72} />
        <div className="word-card" style={accent('#FF7A3D')}>
          <div className="word-emoji">{wd.emoji}</div>
          <p className="word-native" dir={l.rtl ? 'rtl' : 'ltr'}>
            {wd.example}
          </p>
          <p className="word-meaning">{wd.exampleId}</p>
          <Button variant="sky" onClick={() => speak(wd.example, { lang: l.speechLang, rate: 0.78 })}>
            🔊 Dengar cerita
          </Button>
        </div>
        <p className="center" style={{ fontWeight: 800 }}>
          Kata utama di cerita ini artinya apa?
        </p>
      </div>
      <MaterialGrid notes={notes} />
      <div className="answers">
        {choices.map((c) => {
          const state =
            picked === null ? '' : c.id === wd.id ? 'correct' : picked === c.id ? 'wrong' : ''
          return (
            <button
              key={c.id}
              className={`answer ${state}`}
              disabled={picked !== null}
              onClick={() => choose(c)}
            >
              <span style={{ fontSize: 34 }}>{c.emoji}</span>
              <span>{c.meaning}</span>
            </button>
          )
        })}
      </div>
      {picked && picked !== wd.id && (
        <div className="card-soft stack">
          <p>
            Jawabannya <strong>{wd.meaning}</strong>: <span dir={l.rtl ? 'rtl' : 'ltr'}>{wd.word}</span>
          </p>
          <Button variant="mint" onClick={next}>
            Lanjut ➜
          </Button>
        </div>
      )}
    </div>
  )
}

interface MemoryCard {
  id: string
  wordId: string
  kind: 'word' | 'meaning'
  text: string
  sub?: string
}

export function MemoryGame({
  lang,
  themeId,
  learnerName,
  items,
  onFinish,
  onBack,
}: GameProps) {
  const l = getLanguage(lang)
  const { rounds } = useWordRounds(lang, themeId, items, 4)
  const note = skillMaterial(lang, 'memory')
  const cards = useMemo<MemoryCard[]>(
    () =>
      shuffle(
        rounds.flatMap((w) => [
          { id: `${w.id}:word`, wordId: w.id, kind: 'word' as const, text: w.word, sub: w.say },
          { id: `${w.id}:meaning`, wordId: w.id, kind: 'meaning' as const, text: `${w.emoji} ${w.meaning}` },
        ]),
      ),
    [rounds],
  )

  const [open, setOpen] = useState<string[]>([])
  const [matched, setMatched] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, number>>({})
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => () => stopSpeaking(), [])

  if (!cards.length && !done) return <p className="notice center mt-4">Belum ada kartu di tema ini.</p>

  function flip(card: MemoryCard) {
    if (done || matched.includes(card.wordId) || open.includes(card.id) || open.length >= 2) return
    const nextOpen = [...open, card.id]
    setOpen(nextOpen)
    if (card.kind === 'word') speak(card.text, { lang: l.speechLang, rate: 0.78 })
    if (nextOpen.length < 2) return

    const first = cards.find((c) => c.id === nextOpen[0])
    if (!first) return
    if (first.wordId === card.wordId && first.kind !== card.kind) {
      sfxCorrect()
      const word = rounds.find((w) => w.id === card.wordId)
      const score = Math.max(45, 100 - (errors[card.wordId] ?? 0) * 25)
      setAttempts((a) => [...a, { conceptId: card.wordId, score }])
      setTimeout(() => {
        const nextMatched = [...matched, card.wordId]
        setMatched(nextMatched)
        setOpen([])
        if (word) speak(word.word, { lang: l.speechLang, rate: 0.8 })
        if (nextMatched.length >= rounds.length) {
          setDone(true)
          sfxWin()
        }
      }, 550)
    } else {
      sfxTryAgain()
      setErrors((e) => ({
        ...e,
        [first.wordId]: (e[first.wordId] ?? 0) + 1,
        [card.wordId]: (e[card.wordId] ?? 0) + 1,
      }))
      setTimeout(() => setOpen([]), 850)
    }
  }

  if (done) {
    const totalErrors = Object.values(errors).reduce((a, b) => a + b, 0)
    const stars = totalErrors <= 2 ? 3 : totalErrors <= 6 ? 2 : 1
    return (
      <DoneScreen
        title="Memory selesai!"
        text={`Daya ingatmu kuat, ${learnerName}! Semua pasangan ketemu.`}
        stars={stars}
        attempts={attempts}
        onFinish={onFinish}
      />
    )
  }

  return (
    <div className="stack">
      <TopBar onBack={onBack} title="🃏 Memory" right={<div className="pill">{l.flag}</div>} />
      <ProgressBar value={matched.length} max={rounds.length} />
      <TutorBubble text="Buka dua kartu. Pasangkan tulisan dengan artinya!" size={72} />
      {note && <MaterialCard note={note} />}
      <div className="grid grid-2">
        {cards.map((card) => {
          const visible = open.includes(card.id) || matched.includes(card.wordId)
          return (
            <button
              key={card.id}
              className={`tile ${matched.includes(card.wordId) ? 'selected' : ''}`}
              style={{ ...accent('#E93B3B'), minHeight: 118 }}
              onClick={() => flip(card)}
              disabled={matched.includes(card.wordId)}
            >
              {visible ? (
                <>
                  <div
                    className={card.kind === 'word' ? 'word-native' : 'tile-title'}
                    dir={card.kind === 'word' && l.rtl ? 'rtl' : 'ltr'}
                    style={{ fontSize: card.kind === 'word' ? 28 : 21 }}
                  >
                    {card.text}
                  </div>
                  {card.sub && <div className="tile-sub">{card.sub}</div>}
                </>
              ) : (
                <>
                  <span className="tile-emoji">?</span>
                  <div className="tile-sub">Buka kartu</div>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const EXTRA_GAME_COMPONENTS: Partial<Record<SkillId, (props: GameProps) => JSX.Element>> = {
  mendengar: ListeningGame,
  membaca: ReadingGame,
  cerita: StoryGame,
  memory: MemoryGame,
}
