import { useNavigate, useParams } from 'react-router-dom'
import { Hero, TopBar, accent } from '../../components/ui'
import { useProgress } from '../../lib/progressContext'
import { isStrong, statOf } from '../../lib/mastery'
import { richCategories, totalRichWords } from '../../data/richVocab'
import { skillFromSlug } from './skillMeta'
import { getLanguage, langFromSlug } from '../../data/languages'
import { languagePrimers, skillMaterial } from '../../data/languageMaterials'

/**
 * Indeks kategori untuk sebuah bahasa + latihan.
 * Contoh: /inggris/vocab, /jepang/pelafalan, /arab/menulis.
 */
export function SkillIndex() {
  const { langSlug, skillSlug } = useParams()
  const navigate = useNavigate()
  const { progress } = useProgress()

  const meta = skillFromSlug(skillSlug)
  const lang = langFromSlug(langSlug)
  const cats = lang ? richCategories(lang) : null

  if (!lang || !meta || !cats) {
    return (
      <div className="app">
        <TopBar onBack={() => navigate('/')} />
        <Hero
          title="🚧 Segera hadir"
          subtitle={
            lang
              ? 'Latihan khusus untuk bahasa ini sedang disiapkan.'
              : 'Halaman tidak dikenali.'
          }
          tone="sky"
        />
        <p className="muted center mt-4">
          Kembali ke{' '}
          <button className="linklike" onClick={() => navigate('/')}>
            beranda
          </button>{' '}
          untuk berlatih.
        </p>
      </div>
    )
  }

  const info = getLanguage(lang)
  const strongOf = (words: { id: string }[]) =>
    words.filter((wd) => isStrong(statOf(progress.items, lang, wd.id))).length
  const totalStrong = cats.reduce((n, c) => n + strongOf(c.words), 0)
  const skillNote = skillMaterial(lang, meta.slug)
  const primers = languagePrimers(lang)

  return (
    <div className="app">
      <TopBar onBack={() => navigate('/')} right={<div className="pill">{info.flag} {info.nativeName}</div>} />
      <Hero
        title={`${meta.emoji} ${meta.title} ${info.name.replace('Bahasa ', '')}`}
        subtitle={`${totalStrong} / ${totalRichWords(lang)} kata sudah kamu kuasai`}
        tone={meta.tone}
      />

      {(skillNote || primers.length > 0) && (
        <div className="grid grid-2 mt-2">
          {skillNote && (
            <div className="card-soft">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span style={{ fontSize: 26 }}>{skillNote.emoji}</span>
                <div>
                  <strong>{skillNote.title}</strong>
                  <p className="muted" style={{ fontSize: 15 }}>
                    {skillNote.body}
                  </p>
                </div>
              </div>
            </div>
          )}
          {primers.slice(0, skillNote ? 1 : 2).map((note) => (
            <div key={note.title} className="card-soft">
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
          ))}
        </div>
      )}

      <div className="grid grid-2 mt-2">
        {cats.map((c) => {
          const strong = strongOf(c.words)
          const done = strong >= c.words.length
          return (
            <button
              key={c.id}
              className="tile"
              style={accent(c.color, c.color2)}
              onClick={() => navigate(`/${langSlug}/${meta.slug}/${c.id}`)}
            >
              <span className="icon-tile" style={{ marginBottom: 8 }}>
                {c.emoji}
              </span>
              <div className="tile-title">{c.title}</div>
              <div className="tile-sub">
                {strong} / {c.words.length} kata dikuasai
              </div>
              {done && (
                <span className="chip" style={{ marginTop: 8, background: c.color }}>
                  Selesai ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="muted center mt-4" style={{ fontSize: 14 }}>
        {meta.indexNote}
      </p>
    </div>
  )
}
