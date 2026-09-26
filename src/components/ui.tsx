import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Mascot } from './Mascot'
import type { MascotMood } from './Mascot'
import { sfxStar, sfxTap } from '../lib/sfx'

/* ------------------------- Latar belakang ------------------------ */

/** Palet aksen inti — dipakai gelembung latar & konfeti. */
const BUBBLE_COLORS = ['#FF3D9A', '#1CB0F6', '#FFC800', '#58CC02', '#A55BFF', '#E93B3B']

/**
 * Menyalurkan warna sebuah kartu ke CSS custom property, sehingga pita aksen,
 * kotak ikon, dan keadaan terpilih memakai satu sumber warna yang sama.
 * `soft` boleh dikosongkan: dibuat otomatis dari warna utama dengan alfa 10%.
 */
export function accent(color: string, soft?: string): CSSProperties {
  return {
    '--accent': color,
    '--accent-soft': soft ?? `${color}1A`,
  } as CSSProperties
}

export function BackgroundBubbles() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: `${(i * 8.5 + (i % 3) * 6) % 96}%`,
        top: `${(i * 13 + (i % 4) * 9) % 92}%`,
        size: 40 + ((i * 37) % 90),
        color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
        delay: `${(i % 7) * 0.9}s`,
      })),
    [],
  )
  return (
    <div className="bg-bubbles" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            background: b.color,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  )
}

/* --------------------------- Spanduk ----------------------------- */

/** Kartu gradien untuk judul layar, dengan maskot mengintip dari kanan. */
export function Hero({
  title,
  subtitle,
  tone = 'pink',
  mood = 'happy',
  right,
}: {
  title: ReactNode
  subtitle?: ReactNode
  tone?: 'pink' | 'sky' | 'sun'
  mood?: MascotMood
  right?: ReactNode
}) {
  return (
    <div className={`hero ${tone === 'pink' ? '' : `hero-${tone}`}`}>
      <div className="row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{title}</h2>
          {subtitle && <div className="hero-sub">{subtitle}</div>}
        </div>
        {right ?? <Mascot mood={mood} size={78} />}
      </div>
    </div>
  )
}

/* ---------------------------- Tombol ----------------------------- */

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'sun' | 'sky' | 'mint' | 'bubble' | 'grape' | 'grass' | 'ghost'
  size?: 'md' | 'lg'
  block?: boolean
  disabled?: boolean
  ariaLabel?: string
}

export function Button({
  children,
  onClick,
  variant = 'sun',
  size = 'md',
  block,
  disabled,
  ariaLabel,
}: ButtonProps) {
  const cls = [
    'btn',
    variant !== 'sun' ? `btn-${variant}` : '',
    size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      className={cls}
      onClick={() => {
        sfxTap()
        onClick?.()
      }}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

export function IconButton({
  children,
  onClick,
  label,
  variant = 'ghost',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  label: string
  variant?: ButtonProps['variant']
  disabled?: boolean
}) {
  return (
    <button
      className={`btn icon-btn ${variant !== 'sun' ? `btn-${variant}` : ''}`}
      onClick={() => {
        sfxTap()
        onClick?.()
      }}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

/* --------------------------- Bintang ----------------------------- */

export function Stars({ value, animate = true }: { value: number; animate?: boolean }) {
  const [shown, setShown] = useState(animate ? 0 : value)

  useEffect(() => {
    if (!animate) {
      setShown(value)
      return
    }
    setShown(0)
    const timers = Array.from({ length: value }, (_, i) =>
      setTimeout(() => {
        setShown(i + 1)
        sfxStar(i)
      }, 320 * (i + 1)),
    )
    return () => timers.forEach(clearTimeout)
  }, [value, animate])

  return (
    <div className="stars" role="img" aria-label={`${value} dari 3 bintang`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`star ${i < shown ? 'on' : ''}`}>
          ⭐
        </span>
      ))}
    </div>
  )
}

/* --------------------------- Konfeti ----------------------------- */

export function Confetti({ show }: { show: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: `${(i * 2.4 + (i % 5) * 3) % 100}%`,
        color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
        delay: `${(i % 10) * 0.12}s`,
        duration: `${1.6 + (i % 5) * 0.35}s`,
      })),
    [],
  )
  if (!show) return null
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <i
          key={i}
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------ Bar kemajuan --------------------------- */

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---------------------- Balon bicara Kiko ------------------------ */

export function TutorBubble({
  text,
  mood = 'happy',
  loading = false,
  children,
  size = 84,
}: {
  text?: string
  mood?: MascotMood
  loading?: boolean
  children?: ReactNode
  size?: number
}) {
  return (
    <div className="tutor-row">
      <Mascot mood={loading ? 'think' : mood} size={size} />
      <div className="speech">
        {loading ? (
          <span className="thinking-dots" aria-label="Kiko sedang berpikir">
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </span>
        ) : (
          <>
            {text && <p>{text}</p>}
            {children}
          </>
        )}
      </div>
    </div>
  )
}

/* ---------------------------- Header ----------------------------- */

export function TopBar({
  onBack,
  title,
  right,
}: {
  onBack?: () => void
  title?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="topbar">
      {onBack && (
        <IconButton label="Kembali" onClick={onBack}>
          ←
        </IconButton>
      )}
      {title && <div className="pill">{title}</div>}
      <div className="spacer" />
      {right}
    </div>
  )
}
