import { getLanguage } from '../data/languages'
import { Button, TopBar, TutorBubble, accent } from '../components/ui'
import { totalStars } from '../lib/progress'
import type { Progress } from '../lib/progress'
import { describeActivity, recommendNext } from '../lib/flow'
import type { Activity } from '../lib/flow'

interface Props {
  progress: Progress
  /** Aktivitas yang baru saja selesai */
  last: Activity
  stars: number
  onStart: (activity: Activity) => void
  onHome: () => void
}

/**
 * Layar "Selanjutnya?" — muncul setelah setiap sesi supaya anak punya jalan
 * meneruskan (main lagi / rekomendasi Kiko) alih-alih terlempar ke beranda.
 * Perayaan bintang sudah dilakukan di dalam permainan, jadi di sini ringkas.
 */
export function NextUp({ progress, last, stars, onStart, onHome }: Props) {
  const profile = progress.profile!
  const lang = getLanguage(profile.language)

  // Kiko menyarankan langkah terbaik, tanpa mengulang aktivitas yang sama.
  const suggestion = recommendNext(progress.items, profile.language, {
    exclude: last,
    skipReview: last.kind === 'review',
  })
  const again = describeActivity(last, profile.language)

  const praise =
    stars >= 3
      ? `Tiga bintang, ${profile.name}! Mau lanjut?`
      : stars === 2
        ? 'Bagus! Ayo teruskan selagi semangat.'
        : 'Kerja bagus! Satu lagi, yuk?'

  return (
    <div className="stack">
      <TopBar
        right={
          <>
            <div className="pill pill-coral">+{stars} ⭐</div>
            <div className="pill pill-sun">⭐ {totalStars(progress)}</div>
          </>
        }
      />

      <TutorBubble mood="cheer" text={praise} size={78} />
      <p className="muted center" style={{ marginTop: -4 }}>
        Kiko pilihkan lanjutan yang pas untukmu 👇
      </p>

      {/* Rekomendasi utama — tombol paling menonjol */}
      <button
        className="tile tile-row"
        onClick={() => onStart(suggestion.activity)}
        style={accent('#58CC02', '#E6F8D8')}
      >
        <div className="row">
          <span className="icon-tile">{suggestion.emoji}</span>
          <div style={{ flex: 1 }}>
            <div className="tile-title">{suggestion.label}</div>
            <div className="tile-sub">{suggestion.reason}</div>
          </div>
          <span className="chip">Kiko pilih</span>
        </div>
      </button>

      <div className="row">
        <Button variant="sky" block onClick={() => onStart(last)}>
          {again.emoji} Main lagi
        </Button>
        <Button variant="ghost" block onClick={onHome}>
          🏠 Beranda
        </Button>
      </div>

      <p className="muted center" style={{ fontSize: 14 }}>
        Sedang belajar {lang.name} {lang.flag}
      </p>
    </div>
  )
}
