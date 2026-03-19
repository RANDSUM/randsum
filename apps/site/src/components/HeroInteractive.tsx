import { useCallback, useEffect, useRef, useState } from 'react'
import { roll } from '@randsum/roller'
import { NotationRoller } from './NotationRoller'

// Slot machine tick intervals in ms — fast start, slows to a stop (~2.5s total)
const SLOT_INTERVALS = [
  45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860
]

const DIE_ROLLED = 'die-rolled'

export function SpinningLogo({ logoSrc }: { readonly logoSrc: string }): React.JSX.Element {
  const [spinning, setSpinning] = useState(false)
  const [nudging, setNudging] = useState(false)
  const [spinDuration, setSpinDuration] = useState(3.2)
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const schedule = (): void => {
      nudgeTimerRef.current = setTimeout(
        () => {
          setNudging(true)
        },
        5000 + roll(3000).total
      )
    }
    if (!spinning) schedule()
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    }
  }, [spinning, nudging])

  const handleClick = (): void => {
    if (spinning) return
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
    setNudging(false)
    const duration = 3.0 + (roll(5).total - 1) * 0.1
    setSpinDuration(duration)
    setSpinning(true)
    window.dispatchEvent(new CustomEvent(DIE_ROLLED))
  }

  return (
    <img
      src={logoSrc}
      alt="RANDSUM logo"
      className={[
        'hero-logo',
        spinning ? 'hero-logo--spinning' : '',
        nudging ? 'hero-logo--nudge' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      width={240}
      height={240}
      onClick={handleClick}
      onAnimationEnd={e => {
        if (e.animationName === 'die-spin') setSpinning(false)
        if (e.animationName === 'logo-nudge') setNudging(false)
      }}
      style={{ cursor: 'pointer', '--spin-duration': `${spinDuration}s` } as React.CSSProperties}
    />
  )
}

const CHIP_PRESETS = [
  { label: 'Drop Lowest', notation: '4d6L' },
  { label: 'Fudge', notation: '4dF' },
  { label: 'Something Really Fancy', notation: '6d8L2H1R{1,2}U!C{>7}+5-2' },
  { label: 'Advantage', notation: '2d20H' },
  { label: 'Exploding Pool', notation: '8d8!U+5' },
  { label: 'Wild Die', notation: '5d6W' },
  { label: 'Reroll Ones', notation: '4d6R{1}' },
  { label: 'Percentile', notation: 'd%' },
  { label: 'Keep Three', notation: '4d6K3' },
  { label: 'Escalating', notation: '1d4+1d6+1d8+1d10+1d12+1d20' },
  { label: 'Capped', notation: '3d8C{>6}' },
  { label: 'Geometric', notation: 'g6' },
  { label: 'Draw Dice', notation: '5DD10' }
] as const

export function HeroRollerPlayground(): React.JSX.Element {
  const [notation, setNotation] = useState<string>(CHIP_PRESETS[0].notation)
  const [selectedChip, setSelectedChip] = useState<number | null>(0)
  const [resetToken, setResetToken] = useState(0)
  const autoCyclingRef = useRef(true)
  const cycleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cycleIdxRef = useRef(0)

  const stopCycle = useCallback((): void => {
    autoCyclingRef.current = false
    if (cycleRef.current) {
      clearInterval(cycleRef.current)
      cycleRef.current = undefined
    }
  }, [])

  // Auto-cycle chips every 12 seconds
  useEffect(() => {
    cycleIdxRef.current = 0
    cycleRef.current = setInterval(() => {
      if (!autoCyclingRef.current) return
      cycleIdxRef.current = (cycleIdxRef.current + 1) % CHIP_PRESETS.length
      setSelectedChip(cycleIdxRef.current)
      const preset = CHIP_PRESETS[cycleIdxRef.current]
      if (preset) setNotation(preset.notation)
      setResetToken(t => t + 1)
    }, 12000)
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
    }
  }, [])

  // Cycle through chip presets on die-rolled
  useEffect(() => {
    const handler = (): void => {
      stopCycle()
      if (timerRef.current) clearTimeout(timerRef.current)

      const pickChip = (): number => roll(CHIP_PRESETS.length).total - 1
      const finalIdx = pickChip()
      const stepRef = { current: 0 }

      const tick = (): void => {
        if (stepRef.current < SLOT_INTERVALS.length - 1) {
          const idx = pickChip()
          setSelectedChip(idx)
          const preset = CHIP_PRESETS[idx]
          if (preset) setNotation(preset.notation)
          stepRef.current++
          timerRef.current = setTimeout(tick, SLOT_INTERVALS[stepRef.current])
        } else {
          setSelectedChip(finalIdx)
          const preset = CHIP_PRESETS[finalIdx]
          if (preset) setNotation(preset.notation)
          setResetToken(t => t + 1)
        }
      }

      timerRef.current = setTimeout(tick, SLOT_INTERVALS[0] ?? 45)
    }

    window.addEventListener(DIE_ROLLED, handler)
    return () => {
      window.removeEventListener(DIE_ROLLED, handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [stopCycle])

  const handleChipClick = useCallback(
    (idx: number): void => {
      stopCycle()
      setSelectedChip(idx)
      const preset = CHIP_PRESETS[idx]
      if (preset) setNotation(preset.notation)
      setResetToken(t => t + 1)
    },
    [stopCycle]
  )

  const handleUserType = useCallback((): void => {
    stopCycle()
    setSelectedChip(null)
    // Intentionally does not update notation — NotationRoller owns its textarea state
  }, [stopCycle])

  return (
    <>
      <div className="hero-chips">
        {CHIP_PRESETS.map((chip, i) => (
          <button
            key={i}
            className={['hero-chip', selectedChip === i ? 'hero-chip--active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              handleChipClick(i)
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>
      <NotationRoller notation={notation} resetToken={resetToken} onChange={handleUserType} />
    </>
  )
}

export function ClickableTagline(): React.JSX.Element {
  return (
    <h1
      className="clickable-tagline"
      onClick={() => window.dispatchEvent(new CustomEvent('die-rolled'))}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('die-rolled'))
        }
      }}
    >
      <span className="tagline-plain">Throw </span>
      <span className="tagline-dice">Dice</span>
      <span className="tagline-plain">,</span>
      <br />
      <span className="tagline-plain">Not </span>
      <span className="tagline-exceptions">Exceptions</span>
      <span className="tagline-plain">.</span>
    </h1>
  )
}
