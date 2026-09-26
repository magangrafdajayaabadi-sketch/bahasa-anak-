import { useNavigate, useParams } from 'react-router-dom'
import { TopBar, TutorBubble, accent } from '../../components/ui'
import { useProgress } from '../../lib/progressContext'
import { isStrong, statOf } from '../../lib/mastery'
import { LEVELS } from '../../data/enVocab'
import type { EnWord, Level } from '../../data/enVocab'
import { getRichCategory } from '../../data/richVocab'
import { skillFromSlug } from './skillMeta'
import { langFromSlug } from '../../data/languages'
import { categoryMaterial } from '../../data/languageMaterials'

type LevelSlug = Level | 'semua'

/**
 * Langkah pemilihan tingkat kesulitan sebelum masuk kartu/latihan:
 * /:lang/:skill/:categoryId.
 */
export function SkillLevelPicker() {
  const { langSlug, skillSlug, categoryId } = useParams()
  const navigate = useNavigate()
  const { progress } = useProgress()

  const meta = skillFromSlug(skillSlug)
  const lang = langFromSlug(langSlug)
  const category = lang ? getRichCategory(lang, categoryId) : undefined

  if (!lang || !meta || !category) {
    return (
      <div className="app">
        <TopBar onBack={() => navigate('/')} />
        <p className="notice center mt-4">Halaman tidak ditemukan.</p>
      </div>
    )
  }

  const strongCount = (words: EnWord[]) =>
    words.filter((wd) => isStrong(statOf(progress.items, lang, wd.id))).length

  const strong = strongCount(category.words)
  const note = categoryMaterial(lang, category.id)

  const tiles: { slug: LevelSlug; label: string; emoji: string; words: EnWord[]; hint: string }[] =
    [
      {
        slug: 'semua',
        label: 'Semua kata',
        emoji: '🌈',
        words: category.words,
        hint: 'campur semua tingkat',
      },
      ...LEVELS.map((lv) => ({
        slug: lv.id,
        label: lv.label,
        emoji: lv.emoji,
        words: category.words.filter((wd) => wd.level === lv.id),
        hint:
          lv.id === 'pemula'
            ? 'kata yang paling mudah'
            : lv.id === 'menengah'
              ? 'sedikit lebih menantang'
              : 'untuk yang sudah jago',
      })),
    ]

  return (
    <div className="app">
      <TopBar
        onBack={() => navigate(`/${langSlug}/${meta.slug}`)}
        right={<div className="pill">{meta.emoji} {meta.title}</div>}
      />

      <div className="hero hero-sun" style={accent(category.color, category.color2)}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>
              {category.emoji} {category.title}
            </h2>
            <div className="hero-sub">
              {strong} / {category.words.length} kata dikuasai
            </div>
          </div>
          <span style={{ fontSize: 52 }}>{category.emoji}</span>
        </div>
      </div>

      <TutorBubble mood="happy" text="Pilih tingkat kesulitan dulu, yuk!" size={74} />

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

      <div className="stack">
        {tiles.map((t) => {
          const s = strongCount(t.words)
          const done = t.words.length > 0 && s >= t.words.length
          return (
            <button
              key={t.slug}
              className="tile tile-row"
              style={accent(category.color, category.color2)}
              onClick={() => navigate(`/${langSlug}/${meta.slug}/${category.id}/${t.slug}`)}
              disabled={t.words.length === 0}
            >
              <div className="row">
                <span className="icon-tile">{t.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div className="tile-title">{t.label}</div>
                  <div className="tile-sub">
                    {t.words.length} kata · {t.hint}
                  </div>
                </div>
                {done ? (
                  <span className="chip" style={{ background: category.color }}>
                    Selesai ✓
                  </span>
                ) : (
                  <span className="tile-sub">
                    {s}/{t.words.length}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
