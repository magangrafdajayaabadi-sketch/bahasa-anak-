export type MascotMood = 'happy' | 'cheer' | 'think' | 'listen' | 'sad'

interface Props {
  mood?: MascotMood
  size?: number
}

/**
 * Kiko, burung hantu pemandu. Digambar sebagai SVG supaya tajam
 * di semua ukuran layar dan tidak butuh file gambar.
 */
export function Mascot({ mood = 'happy', size = 96 }: Props) {
  const anim =
    mood === 'cheer' ? 'cheer' : mood === 'think' || mood === 'listen' ? 'think' : 'bounce'

  const eyeH = mood === 'cheer' ? 6 : mood === 'sad' ? 12 : 14
  const browY = mood === 'sad' ? 30 : mood === 'think' ? 26 : 28

  return (
    <svg
      className={`mascot ${anim}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Kiko si burung hantu"
    >
      {/* sayap */}
      <ellipse cx="22" cy="70" rx="14" ry="24" fill="#0B8CCB" />
      <ellipse cx="98" cy="70" rx="14" ry="24" fill="#0B8CCB" />

      {/* badan */}
      <ellipse cx="60" cy="68" rx="40" ry="42" fill="#1CB0F6" />
      <ellipse cx="60" cy="78" rx="27" ry="30" fill="#F2FAFF" />

      {/* jambul */}
      <path d="M32 34 L26 16 L46 28 Z" fill="#0B8CCB" />
      <path d="M88 34 L94 16 L74 28 Z" fill="#0B8CCB" />

      {/* wajah */}
      <circle cx="44" cy="52" r="17" fill="#F2FAFF" />
      <circle cx="76" cy="52" r="17" fill="#F2FAFF" />
      <ellipse cx="44" cy="52" rx="9" ry={eyeH} fill="#191D3D" />
      <ellipse cx="76" cy="52" rx="9" ry={eyeH} fill="#191D3D" />
      <circle cx="47" cy="48" r="3.4" fill="#fff" />
      <circle cx="79" cy="48" r="3.4" fill="#fff" />

      {/* alis */}
      <path
        d={`M33 ${browY} q11 -8 22 -2`}
        stroke="#0A78AE"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M87 ${browY} q-11 -8 -22 -2`}
        stroke="#0A78AE"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* paruh */}
      <path d="M60 60 L52 72 L68 72 Z" fill="#FFC800" />

      {/* pipi merona saat senang */}
      {(mood === 'happy' || mood === 'cheer') && (
        <>
          <ellipse cx="32" cy="68" rx="7" ry="4.5" fill="#FF3D9A" opacity="0.4" />
          <ellipse cx="88" cy="68" rx="7" ry="4.5" fill="#FF3D9A" opacity="0.4" />
        </>
      )}

      {/* kaki */}
      <path
        d="M48 108 l0 6 M48 114 l-6 4 M48 114 l6 4"
        stroke="#FFC800"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M72 108 l0 6 M72 114 l-6 4 M72 114 l6 4"
        stroke="#FFC800"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* tanda mendengarkan */}
      {mood === 'listen' && (
        <g>
          <circle cx="104" cy="30" r="4" fill="#FF3D9A">
            <animate
              attributeName="r"
              values="3;7;3"
              dur="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}
    </svg>
  )
}
