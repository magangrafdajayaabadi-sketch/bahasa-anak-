import { THEMES } from '../data/curriculum'
import { getLanguage } from '../data/languages'
import type { LangCode } from '../data/languages'
import { getSkill } from '../types'
import type { SkillId } from '../types'
import { accent, Hero, TopBar } from '../components/ui'
import { isMastered } from '../lib/progress'
import type { Progress } from '../lib/progress'
import { skillMaterial } from '../data/languageMaterials'
import type { LessonSkill } from '../data/languageMaterials'

interface Props {
  skill: SkillId
  lang: LangCode
  progress: Progress
  onPick: (themeId: string) => void
  onBack: () => void
}

export function ThemePicker({ skill, lang, progress, onPick, onBack }: Props) {
  const s = getSkill(skill)
  const l = getLanguage(lang)
  const lessonSkill: Partial<Record<SkillId, LessonSkill>> = {
    kosakata: 'vocab',
    pelafalan: 'pelafalan',
    menulis: 'menulis',
    mendengar: 'mendengar',
    membaca: 'membaca',
    cerita: 'cerita',
    memory: 'memory',
  }
  const note = lessonSkill[skill] ? skillMaterial(lang, lessonSkill[skill]!) : null

  return (
    <div className="stack">
      <TopBar onBack={onBack} right={<div className="pill">{l.flag}</div>} />
      <Hero
        title={`${s.emoji} ${s.title}`}
        subtitle="Pilih tema yang kamu suka!"
        tone={s.id === 'kosakata' ? 'sun' : s.id === 'pelafalan' ? 'sky' : 'pink'}
      />

      {note && (
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
      )}

      <div className="grid grid-2 mt-2">
        {THEMES.map((th) => {
          const done = th.concepts.filter((c) => isMastered(progress, lang, c.id)).length
          return (
            <button
              key={th.id}
              className="tile"
              style={accent(th.color)}
              onClick={() => onPick(th.id)}
            >
              <span className="icon-tile" style={{ marginBottom: 8 }}>
                {th.emoji}
              </span>
              <div className="tile-title">{th.title}</div>
              <div className="tile-sub">
                {done} / {th.concepts.length} kata dikuasai
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
