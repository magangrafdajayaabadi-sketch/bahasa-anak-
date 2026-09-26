import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { load, recordSession, save } from './progress'
import type { Progress, SessionResult } from './progress'
import { setMuted } from './sfx'

interface ProgressContextValue {
  progress: Progress
  setProgress: React.Dispatch<React.SetStateAction<Progress>>
  /** Catat hasil satu sesi (kosakata/pelafalan/menulis/berbicara). */
  record: (result: SessionResult) => void
}

const Ctx = createContext<ProgressContextValue | null>(null)

/**
 * Sumber tunggal kebenaran untuk progres belajar. Dipakai bersama oleh
 * app utama (mesin layar) dan halaman ber-URL (react-router), sehingga
 * keduanya membaca & menulis progres yang sama tanpa saling menimpa.
 */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => load())

  // Simpan ke localStorage setiap ada perubahan.
  useEffect(() => {
    save(progress)
  }, [progress])

  // Sinkronkan status bisu efek suara.
  useEffect(() => {
    setMuted(!progress.soundOn)
  }, [progress.soundOn])

  const record = (result: SessionResult) =>
    setProgress((p) => recordSession(p, result))

  return <Ctx.Provider value={{ progress, setProgress, record }}>{children}</Ctx.Provider>
}

export function useProgress(): ProgressContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useProgress harus dipakai di dalam <ProgressProvider>')
  return v
}
