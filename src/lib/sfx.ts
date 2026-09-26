/**
 * Efek suara dibangkitkan dengan Web Audio API — tanpa file aset,
 * jadi aplikasi tetap ringan dan bisa jalan offline.
 */

let ctx: AudioContext | null = null
let muted = false

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(value: boolean): void {
  muted = value
}

export function isMuted(): boolean {
  return muted
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const ac = audio()
  if (!ac || muted) return
  const osc = ac.createOscillator()
  const vol = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  vol.gain.setValueAtTime(0.0001, ac.currentTime + start)
  vol.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02)
  vol.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + dur)
  osc.connect(vol).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + dur + 0.05)
}

/** Bunyi "pop" saat tombol ditekan. */
export const sfxTap = () => tone(520, 0, 0.09, 'triangle', 0.12)

/** Melodi naik ceria untuk jawaban benar. */
export const sfxCorrect = () => {
  tone(523.25, 0, 0.12, 'sine')
  tone(659.25, 0.1, 0.12, 'sine')
  tone(783.99, 0.2, 0.22, 'sine')
}

/** Bunyi lembut (bukan menghakimi) saat jawaban belum tepat. */
export const sfxTryAgain = () => {
  tone(392, 0, 0.14, 'sine', 0.12)
  tone(330, 0.12, 0.2, 'sine', 0.12)
}

/** Fanfare saat menyelesaikan satu sesi. */
export const sfxWin = () => {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((n, i) => tone(n, i * 0.11, 0.3, 'triangle', 0.16))
  tone(1318.5, 0.55, 0.5, 'sine', 0.12)
}

/** Bunyi bintang muncul. */
export const sfxStar = (index = 0) =>
  tone(880 + index * 220, 0, 0.18, 'triangle', 0.14)
