// The landing page's roller: the compact Roller with the landing presets (the only
// roller that gets them), rolled on arrival and re-rolled every few seconds
// until the visitor takes over. Clicking the tagline spins the presets like a
// slot machine.
import { useCallback, useEffect, useRef, useState } from 'react'
import { Roller } from '@randsum/ui/react/roller'
import type { Preset } from '@randsum/ui/presets'
import { roll } from '@randsum/roller/roll'
import { APP_URL } from './links'
import { StackBlitzAction } from './StackBlitzAction'
import './rollers.css'

export const LANDING_PRESETS: readonly Preset[] = [
  { label: 'Drop lowest', notation: '4d6L' },
  { label: 'Advantage', notation: '2d20H' },
  { label: 'Fudge', notation: '4dF' },
  { label: 'Exploding pool', notation: '8d8!+5' },
  { label: 'Wild die', notation: '5d6W' },
  { label: 'Reroll ones', notation: '4d6R{1}' },
  { label: 'Percentile', notation: 'd%' },
  { label: 'Escalating', notation: '1d4+1d6+1d8+1d10+1d12+1d20' },
  { label: 'Capped', notation: '3d8C{>6}' },
  { label: 'Geometric', notation: 'g6' },
  { label: 'Draw dice', notation: '5DD10' },
  { label: 'Something fancy', notation: '6d8L2H1R{1,2}U!C{>7}+5-2' }
]

// Slot machine tick intervals in ms: fast start, slowing to a stop (~2.5s total)
const SLOT_INTERVALS = [
  45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860
]
const DIE_ROLLED = 'die-rolled'
const CYCLE_MS = 12000
const FIRST = LANDING_PRESETS[0]?.notation ?? '4d6L'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function HeroRoller(): React.JSX.Element {
  const [notation, setNotation] = useState(FIRST)
  // The first preset rolls on arrival, so the panel opens on a real result
  const [rollSignal, setRollSignal] = useState(1)
  const cycling = useRef(true)
  const slotRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((idx: number, rollIt: boolean) => {
    const preset = LANDING_PRESETS[idx]
    if (!preset) return
    setNotation(preset.notation)
    if (rollIt) setRollSignal(signal => signal + 1)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return
    const cycle = { idx: 0 }
    const timer = setInterval(() => {
      if (!cycling.current) return
      cycle.idx = (cycle.idx + 1) % LANDING_PRESETS.length
      show(cycle.idx, true)
    }, CYCLE_MS)
    return () => {
      clearInterval(timer)
    }
  }, [show])

  useEffect(() => {
    const handler = (): void => {
      cycling.current = false
      if (slotRef.current) clearTimeout(slotRef.current)
      const pick = (): number => roll(LANDING_PRESETS.length).total - 1
      const finalIdx = pick()
      const step = { current: 0 }
      const tick = (): void => {
        if (step.current < SLOT_INTERVALS.length - 1) {
          show(pick(), false)
          step.current++
          slotRef.current = setTimeout(tick, SLOT_INTERVALS[step.current])
        } else {
          show(finalIdx, true)
        }
      }
      slotRef.current = setTimeout(tick, SLOT_INTERVALS[0] ?? 45)
    }
    window.addEventListener(DIE_ROLLED, handler)
    return () => {
      window.removeEventListener(DIE_ROLLED, handler)
      if (slotRef.current) clearTimeout(slotRef.current)
    }
  }, [show])

  return (
    <Roller
      size="compact"
      className="hero-roller-panel"
      notation={notation}
      onChange={next => {
        cycling.current = false
        setNotation(next)
      }}
      rollSignal={rollSignal}
      presets={LANDING_PRESETS}
      appLink={APP_URL}
      footer={<StackBlitzAction notation={notation} />}
    />
  )
}
