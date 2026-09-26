import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react'

const SIZE = 420

export interface TraceResult {
  /** 0–100, seberapa banyak garis panduan tertutup dan serapi apa */
  score: number
  /** persen bentuk huruf yang sudah dijiplak */
  coverage: number
  /** persen coretan yang keluar dari garis */
  spill: number
  /** true bila anak belum menggambar apa pun */
  empty: boolean
}

export interface TraceCanvasHandle {
  clear(): void
  evaluate(): TraceResult
}

interface Props {
  /** Teks yang dijiplak (huruf/kata dalam aksara aslinya) */
  glyph: string
  rtl?: boolean
  color?: string
}

/**
 * Kanvas jiplak: satu lapisan panduan (huruf abu-abu putus-putus) dan satu
 * lapisan coretan anak. Penilaian membandingkan piksel coretan dengan
 * piksel huruf panduan, jadi tidak perlu data tulisan tangan sama sekali.
 */
export const TraceCanvas = forwardRef<TraceCanvasHandle, Props>(function TraceCanvas(
  { glyph, rtl = false, color = '#A55BFF' },
  ref,
) {
  const guideRef = useRef<HTMLCanvasElement | null>(null)
  const drawRef = useRef<HTMLCanvasElement | null>(null)
  const maskRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  /** Ukuran font terbesar yang masih muat di kanvas. */
  const fitFont = useCallback((ctx: CanvasRenderingContext2D, text: string) => {
    let size = 300
    do {
      ctx.font = `700 ${size}px ${'"Baloo 2", "Noto Sans", system-ui, sans-serif'}`
      if (ctx.measureText(text).width <= SIZE * 0.82) break
      size -= 8
    } while (size > 40)
    return size
  }, [])

  const renderGuide = useCallback(() => {
    const guide = guideRef.current
    const mask = maskRef.current
    if (!guide || !mask) return

    const g = guide.getContext('2d')!
    const m = mask.getContext('2d')!
    g.clearRect(0, 0, SIZE, SIZE)
    m.clearRect(0, 0, SIZE, SIZE)

    const size = fitFont(g, glyph)
    const font = `700 ${size}px "Baloo 2", "Noto Sans", system-ui, sans-serif`

    // Lapisan panduan yang dilihat anak
    g.font = font
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = 'rgba(58, 46, 90, 0.13)'
    g.fillText(glyph, SIZE / 2, SIZE / 2)
    g.strokeStyle = 'rgba(58, 46, 90, 0.45)'
    g.lineWidth = 2
    g.setLineDash([10, 8])
    g.strokeText(glyph, SIZE / 2, SIZE / 2)

    // Lapisan mask untuk penilaian: huruf + pita toleransi di sekelilingnya,
    // supaya coretan anak yang sedikit meleset tetap dihitung benar.
    m.font = font
    m.textAlign = 'center'
    m.textBaseline = 'middle'
    m.lineJoin = 'round'
    m.lineCap = 'round'
    m.strokeStyle = '#000'
    m.lineWidth = 34
    m.strokeText(glyph, SIZE / 2, SIZE / 2)
    m.fillStyle = '#000'
    m.fillText(glyph, SIZE / 2, SIZE / 2)
  }, [glyph, fitFont])

  const clear = useCallback(() => {
    const d = drawRef.current?.getContext('2d')
    d?.clearRect(0, 0, SIZE, SIZE)
  }, [])

  useEffect(() => {
    if (!maskRef.current) {
      const c = document.createElement('canvas')
      c.width = SIZE
      c.height = SIZE
      maskRef.current = c
    }
    renderGuide()
    clear()
  }, [renderGuide, clear])

  const evaluate = useCallback((): TraceResult => {
    const draw = drawRef.current
    const mask = maskRef.current
    if (!draw || !mask) return { score: 0, coverage: 0, spill: 0, empty: true }

    const d = draw.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data
    const m = mask.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data

    let glyphPx = 0
    let userPx = 0
    let inside = 0
    // Cukup ambil sampel tiap 2 piksel — 4x lebih cepat, hasilnya sama.
    for (let i = 0; i < d.length; i += 4 * 2) {
      const inGlyph = m[i + 3] > 128
      const inUser = d[i + 3] > 128
      if (inGlyph) glyphPx++
      if (inUser) {
        userPx++
        if (inGlyph) inside++
      }
    }

    if (glyphPx === 0) return { score: 0, coverage: 0, spill: 0, empty: userPx === 0 }
    if (userPx < glyphPx * 0.04) return { score: 0, coverage: 0, spill: 0, empty: true }

    const coverage = Math.min(1, inside / glyphPx)
    const spill = (userPx - inside) / userPx
    const score = Math.max(0, Math.min(100, Math.round(coverage * 115 - spill * 45)))
    return {
      score,
      coverage: Math.round(coverage * 100),
      spill: Math.round(spill * 100),
      empty: false,
    }
  }, [])

  useImperativeHandle(ref, () => ({ clear, evaluate }), [clear, evaluate])

  function pos(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE,
    }
  }

  function down(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
    move(e)
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawing.current) return
    const ctx = drawRef.current?.getContext('2d')
    if (!ctx) return
    const p = pos(e)
    const from = last.current ?? p
    ctx.strokeStyle = color
    ctx.lineWidth = 22
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  function up() {
    drawing.current = false
    last.current = null
  }

  return (
    <div
      className="canvas-wrap"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      dir={rtl ? 'rtl' : 'ltr'}
      role="application"
      aria-label={`Area menjiplak huruf ${glyph}`}
    >
      <canvas ref={guideRef} width={SIZE} height={SIZE} />
      <canvas ref={drawRef} width={SIZE} height={SIZE} />
    </div>
  )
})
