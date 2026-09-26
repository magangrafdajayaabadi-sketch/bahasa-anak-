import { getLanguage } from '../data/languages'
import { SKILLS } from '../types'
import type { SkillId } from '../types'
import type { Progress } from '../lib/progress'
import { skillStars, totalStars } from '../lib/progress'
import { accent, IconButton, TutorBubble } from '../components/ui'
import { getAgeProfile } from '../types'
import { hasApiKey } from '../lib/settings'
import { levelFor, statsFor } from '../lib/mastery'
import { recommendNext } from '../lib/flow'
import type { Activity } from '../lib/flow'

interface Props {
  progress: Progress
  onPickSkill: (skill: SkillId) => void
  onStartActivity: (activity: Activity) => void
  onSmartReview: () => void
  onChangeLanguage: () => void
  onOpenParents: () => void
  onToggleSound: () => void
}

const LEVEL_LABEL = {
  mudah: { emoji: '🌱', text: 'Pelan-pelan dulu' },
  sedang: { emoji: '🌤️', text: 'Berkembang bagus' },
  sulit: { emoji: '🔥', text: 'Siap ditantang!' },
} as const

const GREETINGS = [
  'Senang bertemu lagi!',
  'Ayo lanjutkan petualangan!',
  'Kiko sudah menunggumu!',
  'Siap jadi juara hari ini?',
]

export function Home({
  progress,
  onPickSkill,
  onStartActivity,
  onSmartReview,
  onChangeLanguage,
  onOpenParents,
  onToggleSound,
}: Props) {
  const profile = progress.profile!
  const lang = getLanguage(profile.language)
  const age = getAgeProfile(profile.ageGroup)
  const greeting = GREETINGS[new Date().getDate() % GREETINGS.length]

  const stats = statsFor(progress.items, profile.language)
  const level = LEVEL_LABEL[levelFor(progress.items, profile.language)]
  // "Lanjutkan" melengkapi tombol Ulang Cerdas — jadi lewati saran review di sini.
  const resume = recommendNext(progress.items, profile.language, { skipReview: true })
  const started = stats.seen > 0

  return (
    <div className="stack">
      <div className="topbar">
        <div className="pill">
          <span style={{ fontSize: 24 }}>{profile.avatar}</span> {profile.name}
        </div>
        <div className="pill pill-sun">⭐ {totalStars(progress)}</div>
        {progress.streak > 1 && (
          <div className="pill pill-coral">🔥 {progress.streak}</div>
        )}
        <div className="spacer" />
        <IconButton
          label={progress.soundOn ? 'Matikan suara' : 'Nyalakan suara'}
          onClick={onToggleSound}
        >
          {progress.soundOn ? '🔊' : '🔇'}
        </IconButton>
        <IconButton label="Untuk orang tua" onClick={onOpenParents}>
          👨‍👩‍👧
        </IconButton>
      </div>

      <TutorBubble
        mood="happy"
        text={`Halo ${profile.name}! ${greeting}`}
        size={90}
      >
        <p className="muted mt-2" style={{ fontSize: 16 }}>
          {age.emoji} {age.label} · {level.emoji} {level.text}
        </p>
        {stats.seen > 0 && (
          <p className="muted" style={{ fontSize: 15 }}>
            🧠 {stats.strong} kata kuat dari {stats.seen} dipelajari · ketepatan{' '}
            {stats.accuracy}%
          </p>
        )}
      </TutorBubble>

      <button
        className="tile tile-row"
        onClick={() => onStartActivity(resume.activity)}
        style={accent('#58CC02', '#E6F8D8')}
      >
        <div className="row">
          <span className="icon-tile">{started ? resume.emoji : '🚀'}</span>
          <div style={{ flex: 1 }}>
            <div className="tile-title">
              {started ? 'Lanjutkan belajar' : 'Mulai belajar'}
            </div>
            <div className="tile-sub">{resume.label}</div>
          </div>
          <span className="chip">Ayo!</span>
        </div>
      </button>

      {stats.due > 0 && (
        <button
          className="tile tile-row"
          onClick={onSmartReview}
          style={accent('#FF3D9A', '#FFE8F3')}
        >
          <div className="row">
            <span className="icon-tile">🎯</span>
            <div style={{ flex: 1 }}>
              <div className="tile-title">Ulang Cerdas</div>
              <div className="tile-sub">
                {stats.due} kata siap diulang supaya tidak lupa
              </div>
            </div>
            <span className="chip chip-hot">Siap</span>
          </div>
        </button>
      )}

      <button
        className="tile tile-row"
        onClick={onChangeLanguage}
        style={accent(lang.color, lang.color2)}
      >
        <div className="row">
          <span className="icon-tile">{lang.flag}</span>
          <div style={{ flex: 1 }}>
            <div className="tile-title">{lang.name}</div>
            <div className="tile-sub">Ketuk untuk ganti bahasa</div>
          </div>
          <span style={{ fontSize: 22, color: 'var(--ink-faint)' }}>🔁</span>
        </div>
      </button>

      <h2 className="mt-2">Mau latihan apa?</h2>

      <div className="grid grid-2">
        {SKILLS.map((s) => (
          <button
            key={s.id}
            className="tile"
            style={accent(s.color, s.color2)}
            onClick={() => onPickSkill(s.id)}
          >
            <span className="icon-tile" style={{ marginBottom: 8 }}>
              {s.emoji}
            </span>
            <div className="tile-title">{s.title}</div>
            <div className="tile-sub">{s.subtitle}</div>
            <div className="tile-sub" style={{ marginTop: 4 }}>
              ⭐ {skillStars(progress, profile.language, s.id)}
            </div>
          </button>
        ))}
      </div>

      {!hasApiKey() && (
        <button
          className="notice"
          onClick={onOpenParents}
          style={{
            textAlign: 'left',
            font: 'inherit',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          🔑 <strong>Untuk orang tua:</strong> tambahkan kunci Gemini gratis agar
          Kiko bisa memberi umpan balik personal. Ketuk di sini.
        </button>
      )}

      {progress.badges.length > 0 && (
        <>
          <h2 className="mt-2">Lencanaku 🏅</h2>
          <div className="row row-wrap">
            {progress.badges.map((b) => (
              <div key={b.id} className="badge-chip">
                <span className="b-emoji">{b.emoji}</span>
                {b.title}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
