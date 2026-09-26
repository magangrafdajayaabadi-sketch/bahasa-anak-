import { useState } from 'react'
import { accent, Button, TutorBubble } from '../components/ui'
import { AGE_PROFILES } from '../types'
import type { AgeGroup } from '../types'

const AVATARS = ['🦄', '🐯', '🐼', '🦖', '🐙', '🦋', '🐝', '🦁', '🐳', '🐧', '🦊', '🐸']

interface Props {
  onDone: (name: string, age: number, ageGroup: AgeGroup, avatar: string) => void
}

/** Langkah 1: kenalan. Sengaja hanya nama panggilan — tidak ada data pribadi lain. */
export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('sedang')

  const ageFromGroup: Record<AgeGroup, number> = { kecil: 4, sedang: 7, besar: 10 }

  return (
    <div className="stack">
      <div className="center mt-4">
        <h1>
          Halo! Aku <span style={{ color: 'var(--grape-deep)' }}>Kiko</span> 🦉
        </h1>
        <p className="muted mt-2">Ayo belajar bahasa sambil bermain!</p>
      </div>

      {step === 0 && (
        <div className="card stack">
          <TutorBubble text="Siapa nama panggilanmu?" />
          <input
            className="input"
            placeholder="Tulis namamu di sini…"
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nama panggilan"
          />
          <Button
            variant="grape"
            size="lg"
            block
            disabled={name.trim().length < 1}
            onClick={() => setStep(1)}
          >
            Lanjut ➜
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="card stack">
          <TutorBubble text={`Pilih temanmu, ${name.trim()}!`} />
          <div className="grid grid-3">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={`tile ${a === avatar ? 'selected' : ''}`}
                style={{ ...accent('#A55BFF', '#F3EBFF'), padding: '10px 4px' }}
                onClick={() => setAvatar(a)}
                aria-label={`Pilih avatar ${a}`}
                aria-pressed={a === avatar}
              >
                <span className="tile-emoji">{a}</span>
              </button>
            ))}
          </div>
          <Button variant="grape" size="lg" block onClick={() => setStep(2)}>
            Lanjut ➜
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="card stack">
          <TutorBubble text="Berapa umurmu? Kiko akan sesuaikan permainannya." />
          <div className="stack">
            {AGE_PROFILES.map((p) => (
              <button
                key={p.id}
                className={`tile tile-row ${p.id === ageGroup ? 'selected' : ''}`}
                style={accent('#16C7B0', '#E2F8F5')}
                onClick={() => setAgeGroup(p.id)}
                aria-pressed={p.id === ageGroup}
              >
                <div className="row">
                  <span className="icon-tile">{p.emoji}</span>
                  <div>
                    <div className="tile-title">{p.range}</div>
                    <div className="tile-sub">{p.label}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            variant="mint"
            size="lg"
            block
            onClick={() =>
              onDone(name.trim(), ageFromGroup[ageGroup], ageGroup, avatar)
            }
          >
            Mulai Bermain! 🎉
          </Button>
        </div>
      )}
    </div>
  )
}
