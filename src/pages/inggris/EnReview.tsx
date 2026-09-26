import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Hero, TopBar, TutorBubble } from '../../components/ui'
import { useProgress } from '../../lib/progressContext'
import { statOf } from '../../lib/mastery'
import { richCategories } from '../../data/richVocab'
import { getLanguage, langFromSlug } from '../../data/languages'
import { WordQuiz } from './SkillLesson'

/**
 * Ulang Cerdas per bahasa: kuis atas kata yang sudah jatuh tempo (spaced
 * repetition) dari seluruh kategori. Route: /:lang/ulang.
 */
export function ReviewPage() {
  const { langSlug } = useParams()
  const navigate = useNavigate()
  const { progress, record } = useProgress()

  const lang = langFromSlug(langSlug)
  const cats = lang ? richCategories(lang) : null

  const allWords = useMemo(() => (cats ?? []).flatMap((c) => c.words), [cats])

  const due = useMemo(() => {
    if (!lang) return []
    const now = Date.now()
    return allWords
      .map((w) => ({ w, stat: statOf(progress.items, lang, w.id) }))
      .filter(({ stat }) => stat.attempts > 0 && stat.dueAt <= now)
      .sort((a, b) => a.stat.box - b.stat.box || a.stat.lastScore - b.stat.lastScore)
      .slice(0, 15)
      .map(({ w }) => w)
  }, [allWords, progress.items, lang])

  const backHome = () => navigate('/')

  if (!lang || !cats) {
    return (
      <div className="app">
        <TopBar onBack={backHome} />
        <p className="notice center mt-4">Halaman tidak ditemukan.</p>
      </div>
    )
  }

  const info = getLanguage(lang)

  if (due.length === 0) {
    return (
      <div className="app">
        <TopBar onBack={backHome} right={<div className="pill">{info.flag} {info.nativeName}</div>} />
        <Hero title="🎯 Ulang Cerdas" subtitle="Belum ada kata yang perlu diulang" tone="pink" />
        <TutorBubble mood="cheer" text="Semua kata masih segar di ingatanmu! Ayo pelajari kata baru." />
        <Button variant="mint" block onClick={() => navigate(`/${langSlug}/vocab`)}>
          🧩 Belajar kata baru
        </Button>
      </div>
    )
  }

  return (
    <div className="app">
      <TopBar onBack={backHome} right={<div className="pill">{info.flag} {info.nativeName}</div>} />
      <Hero title="🎯 Ulang Cerdas" subtitle={`${due.length} kata siap diulang`} tone="pink" />
      <WordQuiz
        words={due}
        categoryColor="#FF3D9A"
        allWords={allWords}
        items={progress.items}
        lang={lang}
        speechLang={info.speechLang}
        rtl={info.rtl}
        onChangeLevel={backHome}
        onDone={(stars, attempts) => record({ lang, skill: 'kosakata', stars, attempts })}
      />
    </div>
  )
}
