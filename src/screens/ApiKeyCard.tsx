import { useEffect, useState } from 'react'
import { Button } from '../components/ui'
import {
  clearSettings,
  fetchModels,
  loadSettings,
  saveSettings,
} from '../lib/settings'
import type { ModelOption } from '../lib/settings'

type Status =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'ok'; count: number }
  | { kind: 'error'; message: string }

/**
 * Kartu pengaturan BYOK (Bring Your Own Key). Ditempatkan di panel orang tua
 * karena mengisi kunci API adalah tugas orang dewasa, bukan anak.
 */
export function ApiKeyCard({ onChanged }: { onChanged?: () => void }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [models, setModels] = useState<ModelOption[]>([])
  const [reveal, setReveal] = useState(false)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const s = loadSettings()
    setApiKey(s.apiKey)
    setModel(s.model)
    // Kalau kunci sudah tersimpan, muat daftar modelnya sekali.
    if (s.apiKey) void test(s.apiKey, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function test(key: string, announce = true) {
    if (!key.trim()) {
      setStatus({ kind: 'error', message: 'Kunci masih kosong.' })
      return
    }
    setStatus({ kind: 'testing' })
    try {
      const { models: list, recommended } = await fetchModels(key)
      setModels(list)
      setModel((current) => {
        const stillValid = current && list.some((m) => m.id === current)
        return stillValid ? current : recommended
      })
      if (announce) setStatus({ kind: 'ok', count: list.length })
      else setStatus({ kind: 'idle' })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghubungi Google AI.',
      })
    }
  }

  function persist() {
    saveSettings({ apiKey: apiKey.trim(), model: model.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    onChanged?.()
  }

  function forget() {
    clearSettings()
    setApiKey('')
    setModel('')
    setModels([])
    setStatus({ kind: 'idle' })
    onChanged?.()
  }

  const free = models.filter((m) => m.free)
  const others = models.filter((m) => !m.free)

  return (
    <div className="card stack">
      <h2>🔑 Kunci API Gemini (milik Anda)</h2>
      <p className="muted">
        Aplikasi ini memakai <strong>kunci Anda sendiri</strong>. Ambil gratis di{' '}
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--grape-deep)', fontWeight: 800 }}
        >
          aistudio.google.com/apikey
        </a>{' '}
        — cukup masuk dengan akun Google, lalu tekan “Create API key”.
      </p>

      <div className="row">
        <input
          className="input"
          type={reveal ? 'text' : 'password'}
          placeholder="Tempel kunci di sini (AIza…)"
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value)
            setStatus({ kind: 'idle' })
          }}
          autoComplete="off"
          spellCheck={false}
          aria-label="Kunci API Gemini"
          style={{ fontSize: 16 }}
        />
        <Button
          variant="ghost"
          onClick={() => setReveal((r) => !r)}
          ariaLabel={reveal ? 'Sembunyikan kunci' : 'Tampilkan kunci'}
        >
          {reveal ? '🙈' : '👁️'}
        </Button>
      </div>

      <div className="row row-wrap">
        <Button variant="sky" onClick={() => void test(apiKey)} disabled={status.kind === 'testing'}>
          {status.kind === 'testing' ? 'Menguji…' : '🔌 Tes koneksi'}
        </Button>
        <Button variant="mint" onClick={persist} disabled={!apiKey.trim()}>
          💾 Simpan
        </Button>
        {loadSettings().apiKey && (
          <Button variant="ghost" onClick={forget}>
            🗑️ Hapus kunci
          </Button>
        )}
      </div>

      {saved && <div className="notice">✅ Tersimpan di perangkat ini.</div>}
      {status.kind === 'ok' && (
        <div className="notice">
          ✅ Kunci valid! {status.count} model tersedia untuk kunci ini.
        </div>
      )}
      {status.kind === 'error' && <div className="notice">⚠️ {status.message}</div>}

      {models.length > 0 && (
        <>
          <h2 style={{ fontSize: 22 }}>Pilih model</h2>
          <select
            className="input"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            aria-label="Model Gemini"
            style={{ fontSize: 17 }}
          >
            {free.length > 0 && (
              <optgroup label="Tersedia di paket gratis (disarankan)">
                {free.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName} {m.preview ? '· pratinjau' : ''}
                  </option>
                ))}
              </optgroup>
            )}
            {others.length > 0 && (
              <optgroup label="Model lain (cek kuota Anda)">
                {others.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="muted" style={{ fontSize: 15 }}>
            Daftar ini diambil langsung dari kunci Anda, jadi selalu menampilkan
            model terbaru yang benar-benar bisa Anda pakai. Tier{' '}
            <strong>Flash</strong> dan <strong>Flash-Lite</strong> adalah yang
            ditawarkan pada paket gratis Google AI Studio; batas kuotanya bisa
            berubah sewaktu-waktu — periksa di halaman AI Studio Anda.
          </p>
          <Button variant="mint" block onClick={persist}>
            💾 Simpan pilihan
          </Button>
        </>
      )}

      <div className="notice">
        🔒 Kunci hanya disimpan di perangkat ini (localStorage) dan dikirim ke
        server lokal aplikasi untuk diteruskan ke Google. Tidak ada pihak lain
        yang menerimanya. Jangan pakai kunci berbayar milik kantor untuk aplikasi
        yang dipegang anak tanpa pengawasan.
      </div>
    </div>
  )
}
