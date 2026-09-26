import { LANGUAGES } from '../data/languages'
import type { LangCode } from '../data/languages'
import { accent, Hero, TopBar } from '../components/ui'
import { hasVoiceFor } from '../lib/speech'

interface Props {
  onPick: (code: LangCode) => void
  onBack?: () => void
  starsByLang: Record<string, number>
}

export function LanguagePicker({ onPick, onBack, starsByLang }: Props) {
  return (
    <div className="stack">
      <TopBar onBack={onBack} />
      <Hero
        title="🌍 Pilih Bahasa"
        subtitle="Bahasa apa yang mau kita jelajahi hari ini?"
        tone="sky"
      />

      <div className="grid grid-2 mt-2">
        {LANGUAGES.map((l) => {
          const stars = starsByLang[l.code] ?? 0
          return (
            <button
              key={l.code}
              className="tile"
              style={accent(l.color, l.color2)}
              onClick={() => onPick(l.code)}
            >
              <span className="tile-emoji">{l.flag}</span>
              <div className="tile-title">{l.name.replace('Bahasa ', '')}</div>
              <div className="tile-sub">{l.nativeName}</div>
              <div className="tile-sub" style={{ marginTop: 4 }}>
                {stars > 0 ? `⭐ ${stars}` : 'Baru!'}
              </div>
              {!hasVoiceFor(l.speechLang) && (
                <div className="tile-sub" style={{ fontSize: 12 }}>
                  🔇 suara belum terpasang
                </div>
              )}
            </button>
          )
        })}
      </div>

      <p className="muted center mt-2" style={{ fontSize: 14 }}>
        Tanda 🔇 berarti perangkat ini belum punya suara untuk bahasa tersebut.
        Latihan lain tetap bisa dimainkan.
      </p>
    </div>
  )
}
