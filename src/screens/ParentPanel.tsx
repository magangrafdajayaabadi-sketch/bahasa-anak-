import { useEffect, useState } from 'react'
import { LANGUAGES } from '../data/languages'
import { SKILLS } from '../types'
import { getAgeProfile } from '../types'
import type { Progress } from '../lib/progress'
import { masteredCount, skillStars, totalStars } from '../lib/progress'
import { Button, TopBar } from '../components/ui'
import { ApiKeyCard } from './ApiKeyCard'
import { hasApiKey } from '../lib/settings'
import { learnerProfile, statsFor, weakSpots } from '../lib/mastery'
import { askInsight, offlineInsight } from '../lib/tutor'
import type { Insight } from '../lib/tutor'

interface Props {
  progress: Progress
  onBack: () => void
  onReset: () => void
}

export function ParentPanel({ progress, onBack, onReset }: Props) {
  const [ai, setAi] = useState<'cek' | 'aktif' | 'cadangan'>('cek')
  const [confirmReset, setConfirmReset] = useState(false)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [gateAnswer, setGateAnswer] = useState('')
  const profile = progress.profile

  const refreshStatus = () => {
    // Kunci milik pengguna (BYOK) diutamakan; kunci .env hanya cadangan.
    if (hasApiKey()) {
      setAi('aktif')
      return
    }
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setAi(d?.serverKey ? 'aktif' : 'cadangan'))
      .catch(() => setAi('cadangan'))
  }

  useEffect(() => {
    refreshStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeLangs = LANGUAGES.filter((l) => (progress.stars[l.code] ?? 0) > 0)

  const currentLang = profile?.language ?? 'en'
  const stats = statsFor(progress.items, currentLang)
  const weak = weakSpots(progress.items, currentLang, 5)

  if (!unlocked) {
    const ok = gateAnswer.trim() === '12'
    return (
      <div className="stack">
        <TopBar onBack={onBack} title="Untuk Orang Tua" />
        <div className="card stack">
          <h2>Konfirmasi orang tua</h2>
          <p className="muted">
            Panel ini berisi kunci API, laporan belajar, dan tombol hapus data.
          </p>
          <label className="muted" htmlFor="parent-gate">
            Jawab dulu: 8 + 4 =
          </label>
          <input
            id="parent-gate"
            className="input"
            inputMode="numeric"
            value={gateAnswer}
            onChange={(e) => setGateAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ok) setUnlocked(true)
            }}
            aria-label="Jawaban konfirmasi orang tua"
          />
          <Button variant="grape" disabled={!ok} onClick={() => setUnlocked(true)}>
            Buka panel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <TopBar onBack={onBack} title="👨‍👩‍👧 Untuk Orang Tua" />

      <div className="card stack">
        <h2>Ringkasan</h2>
        {profile && (
          <p className="muted">
            {profile.avatar} {profile.name} · {getAgeProfile(profile.ageGroup).range}
          </p>
        )}
        <div className="row row-wrap">
          <div className="pill">⭐ {totalStars(progress)} bintang</div>
          <div className="pill">🔥 {progress.streak} hari berturut</div>
          <div className="pill">🧠 {masteredCount(progress)} kata kuat</div>
          <div className="pill">🎯 {stats.accuracy}% ketepatan</div>
        </div>
      </div>

      <div className="card stack">
        <h2>Analisis belajar</h2>
        <p className="muted">
          Kata dinilai dengan sistem pengulangan berjeda: yang keliru dijadwalkan
          muncul lagi lebih cepat, yang sudah lancar makin jarang diulang.
        </p>

        {weak.length > 0 ? (
          <>
            <strong>Perlu perhatian:</strong>
            {weak.map(({ word, stat }) => (
              <div key={word.id} className="card-soft">
                <div className="row">
                  <span style={{ fontSize: 26 }}>{word.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <strong>
                      {word.text} · {word.roman}
                    </strong>
                    <div className="muted" style={{ fontSize: 15 }}>
                      {word.meaning} — benar {stat.correct} dari {stat.attempts} kali
                      {stat.misses.length > 0 && ` · pernah terbaca "${stat.misses[0]}"`}
                    </div>
                  </div>
                  <span className="muted">kotak {stat.box}/5</span>
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="muted">
            {stats.seen === 0
              ? 'Belum ada latihan yang selesai.'
              : 'Tidak ada kata yang menonjol sulit saat ini. 👏'}
          </p>
        )}

        <Button
          variant="grape"
          block
          disabled={loadingInsight || !profile}
          onClick={async () => {
            if (!profile) return
            setLoadingInsight(true)
            const req = {
              language: profile.language,
              ageGroup: profile.ageGroup,
              learnerName: profile.name,
              profile: learnerProfile(progress.items, profile.language),
              streak: progress.streak,
              totalStars: totalStars(progress),
            }
            // Tanpa kunci API, ringkasan tetap dibuat dari data lokal.
            setInsight(hasApiKey() ? await askInsight(req) : offlineInsight(req))
            setLoadingInsight(false)
          }}
        >
          {loadingInsight ? '⏳ Menyusun…' : '📋 Buat ringkasan belajar'}
        </Button>

        {insight && (
          <div className="card-soft stack">
            <p style={{ fontWeight: 700 }}>{insight.summary}</p>
            {insight.strengths.length > 0 && (
              <div>
                <strong>💪 Kekuatan</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 22 }}>
                  {insight.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {insight.focus.length > 0 && (
              <div>
                <strong>🎯 Perlu dilatih</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 22 }}>
                  {insight.focus.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {insight.activity && (
              <div className="notice">🏡 Kegiatan di rumah: {insight.activity}</div>
            )}
            {insight.offline && (
              <p className="muted" style={{ fontSize: 14 }}>
                Ringkasan ini dihitung di perangkat. Isi kunci API untuk versi yang
                ditulis AI.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="card stack">
        <h2>Kemajuan per bahasa</h2>
        {activeLangs.length === 0 && (
          <p className="muted">Belum ada latihan yang diselesaikan.</p>
        )}
        {activeLangs.map((l) => (
          <div key={l.code} className="card-soft">
            <div className="row">
              <span style={{ fontSize: 30 }}>{l.flag}</span>
              <strong style={{ fontSize: 18 }}>{l.name}</strong>
              <div className="spacer" style={{ flex: 1 }} />
              <span className="muted">⭐ {progress.stars[l.code] ?? 0}</span>
            </div>
            <div className="row row-wrap mt-2">
              {SKILLS.map((s) => (
                <span key={s.id} className="muted" style={{ fontSize: 15 }}>
                  {s.emoji} {s.title}: {skillStars(progress, l.code, s.id)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ApiKeyCard onChanged={refreshStatus} />

      <div className="card stack">
        <h2>Status AI Tutor</h2>
        <p className="muted">
          {ai === 'cek' && 'Memeriksa status…'}
          {ai === 'aktif' &&
            '✅ Aktif. Umpan balik dibuat oleh Google Gemini memakai kunci Anda.'}
          {ai === 'cadangan' &&
            '💡 Mode cadangan. Kunci API belum diisi, jadi aplikasi memakai tutor bawaan di perangkat. Semua latihan tetap berjalan penuh.'}
        </p>
        <div className="notice">
          🔒 Privasi: nama panggilan dan progres hanya disimpan di perangkat ini
          (localStorage). Ucapan anak diproses oleh browser untuk diubah menjadi teks;
          hanya teks singkat itu yang dikirim ke AI Tutor untuk dinilai. Tidak ada
          rekaman suara yang disimpan.
        </div>
        <div className="notice">
          ⏰ Saran waktu bermain: 10–15 menit per sesi untuk usia 3–5 tahun, dan
          maksimal 30 menit untuk usia 6–12 tahun.
        </div>
      </div>

      <div className="card stack">
        <h2>Setel ulang</h2>
        <p className="muted">
          Menghapus profil, bintang, dan lencana dari perangkat ini.
        </p>
        {confirmReset ? (
          <div className="row">
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Batal
            </Button>
            <Button variant="bubble" onClick={onReset}>
              Ya, hapus semua
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmReset(true)}>
            🗑️ Hapus data
          </Button>
        )}
      </div>
    </div>
  )
}
