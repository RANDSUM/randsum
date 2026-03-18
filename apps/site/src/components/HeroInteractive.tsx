import { useCallback, useEffect, useRef, useState } from 'react'
import { roll } from '@randsum/roller'
import { NotationRoller } from '@randsum/component-library'

const TAGLINES = [
  'Very Specific Random Numbers',
  'Zero dependencies. Infinite regrets.',
  'We have types for that.',
  'Probability as a Service.',
  "It's not gambling if you have types.",
  'Dice notation: surprisingly controversial.',
  "The first dice library you'll ever want."
] as const

const GET_STARTED_LABELS = [
  'Get Started',
  'Read (Please)',
  'For People',
  'Having fun?',
  'Critical Hit!',
  'DESCEND'
] as const

const GITHUB_LABELS = [
  'GitHub',
  'Star & Forget',
  'Open Issues',
  'Blame History',
  'Fork It',
  'PAIN',
  'TRUTH'
] as const

const PLAYGROUND_LABELS = ['Playground', 'Try It', 'Roll Dice', 'Open Playground'] as const

// Slot machine tick intervals in ms — fast start, slows to a stop (~2.5s total)
const SLOT_INTERVALS = [
  45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860
]

const DIE_ROLLED = 'die-rolled'

// Curated progression from simplest to most complex, drawn from the roller test suite
const HERO_NOTATIONS = [
  '1d6',
  '1d20',
  '2d6',
  '2d8+3',
  '1d12+5',
  '4d6',
  '4d6L',
  '2d20H',
  '2d12H',
  '5d6L',
  '3d6!',
  '4d6R{1}',
  '2d10R{<3}',
  '4d6K3',
  '3d10!+3',
  '4d6LR{1}!+3',
  '1d4+1d6+1d8+1d10+1d12+1d20',
  '2d4+2d6+2d8',
  '3d4+2d6+1d8',
  '1d6+1d20',
  '4d6L+1d20',
  '2d8+1d6+5',
  '4d6L+2d20H',
  '3d20R{<5}H+2d6L',
  '10d6R{<3}K5',
  '8d8!U+5',
  '6d6C{<2,>5}R{1}+3',
  '6d8L2H1R{1,2}U!C{>7}+5-2',
  '4d6C{>5,<2}LD{>2,<6,2,3}V{6=1}!U{1,2}+2-1',
  '8d10R{<3}K5C{>9}!S{7}+2d6L',
  '6d8!!H2R{1,2}C{<2,>7}U{1,8}V{8=6}+3d4L-2',
  '10d12R{<4}K6D{>10,<2}!C{<3,>11}U{1,12}V{12=10}S{8}+2d6-1d4',
  '4d6LR{<3}!C{>5}+2d8!UR{1}C{<2,>7}+1d12V{12=10}-3'
] as const

function useSlotMachine<T extends string>(
  labels: readonly T[],
  delayRange: readonly [number, number] = [0, 0]
): { label: T; tickKey: number } {
  const [label, setLabel] = useState(labels[0])
  const [tickKey, setTickKey] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const handler = (): void => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const [minDelay, maxDelay] = delayRange
      const range = maxDelay - minDelay
      const startDelay = range > 0 ? minDelay + (roll(range + 1).total - 1) : minDelay

      const finalLabel = labels[roll(labels.length).total - 1]
      const stepRef = { current: 0 }

      const tick = (): void => {
        if (stepRef.current < SLOT_INTERVALS.length - 1) {
          setLabel(labels[roll(labels.length).total - 1])
          setTickKey(k => k + 1)
          stepRef.current++
          timeoutRef.current = setTimeout(tick, SLOT_INTERVALS[stepRef.current])
        } else {
          setLabel(finalLabel)
          setTickKey(k => k + 1)
        }
      }

      timeoutRef.current = setTimeout(tick, (SLOT_INTERVALS[0] ?? 45) + startDelay)
    }

    window.addEventListener(DIE_ROLLED, handler)
    return () => {
      window.removeEventListener(DIE_ROLLED, handler)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [labels])

  return { label, tickKey }
}

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

function BookIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function GitHubIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  )
}

export function ClickSubtitle(): React.JSX.Element {
  const { label, tickKey } = useSlotMachine(TAGLINES)
  return (
    <p className="hero-subtitle">
      <span key={tickKey} className="hero-subtitle-inner">
        {label}
      </span>
    </p>
  )
}

export function GetStartedButton(): React.JSX.Element {
  const { label, tickKey } = useSlotMachine(GET_STARTED_LABELS, [80, 180])
  return (
    <a href="/welcome/introduction/" className="btn btn-secondary">
      <BookIcon />
      <span key={tickKey} className="hero-subtitle-inner">
        {label}
      </span>
    </a>
  )
}

function DiceIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="2" y="2" width="20" height="20" rx="3" ry="3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PlaygroundButton(): React.JSX.Element {
  const { label, tickKey } = useSlotMachine(PLAYGROUND_LABELS, [0, 80])
  return (
    <a
      href="https://playground.randsum.dev"
      className="btn btn-primary"
      target="_blank"
      rel="noopener noreferrer"
    >
      <DiceIcon />
      <span key={tickKey} className="hero-subtitle-inner">
        {label}
      </span>
    </a>
  )
}

const CHIP_PRESETS = [
  { label: 'Your Drop Stat', notation: '1d20-1' },
  { label: 'Fudge', notation: '4dF' },
  { label: 'Something Really Fancy', notation: '6d8L2H1R{1,2}U!C{>7}+5-2' },
  { label: 'Advantage', notation: '2d20H' },
  { label: 'Exploding Pool', notation: '8d8!U+5' },
  { label: 'Wild Die', notation: '5d6W' },
  { label: 'Reroll Ones', notation: '4d6R{1}' },
  { label: 'Percentile', notation: 'd%' },
  { label: 'Keep Three', notation: '4d6K3' },
  { label: 'Escalating', notation: '1d4+1d6+1d8+1d10+1d12+1d20' }
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

  // Auto-cycle chips every 5 seconds
  useEffect(() => {
    cycleIdxRef.current = 0
    cycleRef.current = setInterval(() => {
      if (!autoCyclingRef.current) return
      cycleIdxRef.current = (cycleIdxRef.current + 1) % CHIP_PRESETS.length
      setSelectedChip(cycleIdxRef.current)
      setNotation(CHIP_PRESETS[cycleIdxRef.current].notation)
      setResetToken(t => t + 1)
    }, 5000)
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current)
    }
  }, [])

  // Slot machine on die-rolled
  useEffect(() => {
    const handler = (): void => {
      stopCycle()
      setSelectedChip(null)
      if (timerRef.current) clearTimeout(timerRef.current)

      const finalNotation = HERO_NOTATIONS[roll(HERO_NOTATIONS.length).total - 1]
      const stepRef = { current: 0 }

      const tick = (): void => {
        if (stepRef.current < SLOT_INTERVALS.length - 1) {
          setNotation(HERO_NOTATIONS[roll(HERO_NOTATIONS.length).total - 1])
          stepRef.current++
          timerRef.current = setTimeout(tick, SLOT_INTERVALS[stepRef.current])
        } else {
          setNotation(finalNotation)
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
      setNotation(CHIP_PRESETS[idx].notation)
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

export function GithubButton(): React.JSX.Element {
  const { label, tickKey } = useSlotMachine(GITHUB_LABELS, [200, 360])
  return (
    <a
      href="https://github.com/RANDSUM/randsum"
      className="btn btn-outline"
      target="_blank"
      rel="noopener noreferrer"
    >
      <GitHubIcon />
      <span key={tickKey} className="hero-subtitle-inner">
        {label}
      </span>
    </a>
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
