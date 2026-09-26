import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LangCode } from './data/languages'
import { LANG_SLUG } from './data/languages'
import { hasRichContent } from './data/richVocab'
import type { AgeGroup, SkillId } from './types'
import { BackgroundBubbles } from './components/ui'
import { Onboarding } from './screens/Onboarding'
import { LanguagePicker } from './screens/LanguagePicker'
import { Home } from './screens/Home'
import { ThemePicker } from './screens/ThemePicker'
import { VocabGame } from './screens/VocabGame'
import { PronunciationGame } from './screens/PronunciationGame'
import { SpeakingGame } from './screens/SpeakingGame'
import { WritingGame } from './screens/WritingGame'
import { EXTRA_GAME_COMPONENTS } from './screens/KidsGames'
import { ParentPanel } from './screens/ParentPanel'
import { NextUp } from './screens/NextUp'
import { reset } from './lib/progress'
import { useProgress } from './lib/progressContext'
import { stopSpeaking } from './lib/speech'
import type { Attempt } from './lib/mastery'
import { reviewPool } from './lib/flow'
import type { Activity } from './lib/flow'

/** Latihan yang punya halaman ber-URL sendiri (selain berbicara). */
const SKILL_SLUG: Partial<Record<SkillId, string>> = {
  kosakata: 'vocab',
  pelafalan: 'pelafalan',
  menulis: 'menulis',
}

type Screen =
  | { name: 'onboarding' }
  | { name: 'language'; firstTime: boolean }
  | { name: 'home' }
  | { name: 'theme'; skill: SkillId }
  /** Semua sesi bermain (tema, review, berbicara) diwakili satu bentuk data */
  | { name: 'activity'; activity: Activity }
  /** Layar "Selanjutnya?" setelah sebuah sesi selesai */
  | { name: 'result'; last: Activity; stars: number }
  | { name: 'parents' }

/** Tanda unik tiap layar, untuk memicu animasi transisi saat berpindah. */
function screenKey(s: Screen): string {
  if (s.name === 'activity') {
    const a = s.activity
    return a.kind === 'play' ? `play:${a.skill}:${a.themeId}` : `act:${a.kind}`
  }
  if (s.name === 'theme') return `theme:${s.skill}`
  return s.name
}

export default function App() {
  // Progres dibagi dengan halaman ber-URL lewat ProgressContext.
  const { progress, setProgress, record } = useProgress()
  const navigate = useNavigate()
  const [screen, setScreen] = useState<Screen>(() =>
    progress.profile ? { name: 'home' } : { name: 'onboarding' },
  )

  // Hentikan suara & gulir ke atas setiap kali berpindah layar.
  useEffect(() => {
    stopSpeaking()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [screen])

  const profile = progress.profile

  function finishOnboarding(
    name: string,
    age: number,
    ageGroup: AgeGroup,
    avatar: string,
  ) {
    setProgress((p) => ({
      ...p,
      profile: { name, age, ageGroup, avatar, language: 'en' },
    }))
    setScreen({ name: 'language', firstTime: true })
  }

  function pickLanguage(code: LangCode) {
    setProgress((p) => ({
      ...p,
      profile: p.profile ? { ...p.profile, language: code } : p.profile,
    }))
    setScreen({ name: 'home' })
  }

  function pickSkill(skill: SkillId) {
    // Berbicara memakai kalimat percakapan, langsung mulai tanpa pilih tema.
    if (skill === 'berbicara') {
      startActivity({ kind: 'speak' })
      return
    }
    // Kosakata/Pelafalan/Menulis punya halaman ber-URL untuk bahasa yang kaya.
    const slug = profile && hasRichContent(profile.language) ? SKILL_SLUG[skill] : undefined
    if (slug && profile) {
      navigate(`/${LANG_SLUG[profile.language]}/${slug}`)
      return
    }
    setScreen({ name: 'theme', skill })
  }

  /** Satu pintu masuk untuk memulai aktivitas apa pun. */
  function startActivity(activity: Activity) {
    if (profile && hasRichContent(profile.language)) {
      const langSlug = LANG_SLUG[profile.language]
      // Ulang Cerdas memakai halaman ber-URL.
      if (activity.kind === 'review') {
        navigate(`/${langSlug}/ulang`)
        return
      }
      // Aktivitas bertema dialihkan ke halaman kategori ber-URL.
      if (activity.kind === 'play') {
        const slug = SKILL_SLUG[activity.skill]
        if (slug) {
          navigate(`/${langSlug}/${slug}/${activity.themeId}`)
          return
        }
      }
    }
    setScreen({ name: 'activity', activity })
  }

  /** Catat hasil sesi lalu tawarkan langkah berikutnya (bukan langsung pulang). */
  function finishActivity(
    activity: Activity,
    skill: SkillId,
    stars: number,
    attempts: Attempt[],
  ) {
    if (!profile) return
    record({ lang: profile.language, skill, stars, attempts })
    setScreen({ name: 'result', last: activity, stars })
  }

  /** Tombol kembali dari sebuah sesi menuju tempat yang masuk akal. */
  function backFrom(activity: Activity) {
    if (activity.kind === 'play') setScreen({ name: 'theme', skill: activity.skill })
    else setScreen({ name: 'home' })
  }

  function handleReset() {
    setProgress(reset())
    setScreen({ name: 'onboarding' })
  }

  function renderActivity(activity: Activity) {
    if (!profile) return null
    const common = {
      lang: profile.language,
      ageGroup: profile.ageGroup,
      learnerName: profile.name,
      items: progress.items,
      onBack: () => backFrom(activity),
    }

    if (activity.kind === 'speak') {
      return (
        <SpeakingGame
          {...common}
          onFinish={(stars) => finishActivity(activity, 'berbicara', stars, [])}
        />
      )
    }

    if (activity.kind === 'review') {
      return (
        <VocabGame
          {...common}
          themeId=""
          customPool={reviewPool(progress.items, profile.language)}
          onFinish={(stars, attempts) =>
            finishActivity(activity, 'kosakata', stars, attempts)
          }
        />
      )
    }

    // activity.kind === 'play'
    const finish = (stars: number, attempts: Attempt[]) =>
      finishActivity(activity, activity.skill, stars, attempts)

    if (activity.skill === 'kosakata')
      return <VocabGame {...common} themeId={activity.themeId} onFinish={finish} />
    if (activity.skill === 'pelafalan')
      return <PronunciationGame {...common} themeId={activity.themeId} onFinish={finish} />
    const ExtraGame = EXTRA_GAME_COMPONENTS[activity.skill]
    if (ExtraGame) return <ExtraGame {...common} themeId={activity.themeId} onFinish={finish} />
    return <WritingGame {...common} themeId={activity.themeId} onFinish={finish} />
  }

  return (
    <>
      <BackgroundBubbles />
      <div className="app">
        <div className="screen-anim" key={screenKey(screen)}>
          {screen.name === 'onboarding' && <Onboarding onDone={finishOnboarding} />}

          {screen.name === 'language' && (
            <LanguagePicker
              onPick={pickLanguage}
              onBack={screen.firstTime ? undefined : () => setScreen({ name: 'home' })}
              starsByLang={progress.stars}
            />
          )}

          {screen.name === 'home' && profile && (
            <Home
              progress={progress}
              onPickSkill={pickSkill}
              onStartActivity={startActivity}
              onSmartReview={() => startActivity({ kind: 'review' })}
              onChangeLanguage={() => setScreen({ name: 'language', firstTime: false })}
              onOpenParents={() => setScreen({ name: 'parents' })}
              onToggleSound={() => setProgress((p) => ({ ...p, soundOn: !p.soundOn }))}
            />
          )}

          {screen.name === 'theme' && profile && (
            <ThemePicker
              skill={screen.skill}
              lang={profile.language}
              progress={progress}
              onPick={(themeId) =>
                startActivity({
                  kind: 'play',
                  skill: screen.skill as Exclude<SkillId, 'berbicara'>,
                  themeId,
                })
              }
              onBack={() => setScreen({ name: 'home' })}
            />
          )}

          {screen.name === 'activity' && renderActivity(screen.activity)}

          {screen.name === 'result' && profile && (
            <NextUp
              progress={progress}
              last={screen.last}
              stars={screen.stars}
              onStart={startActivity}
              onHome={() => setScreen({ name: 'home' })}
            />
          )}

          {screen.name === 'parents' && (
            <ParentPanel
              progress={progress}
              onBack={() => setScreen({ name: 'home' })}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </>
  )
}
