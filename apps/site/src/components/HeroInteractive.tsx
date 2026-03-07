import { useEffect, useRef, useState } from 'react'
import { roll } from '@randsum/roller'

const TAGLINES = [
  'Throw Dice, Not Exceptions.',
  '10 years, and all I got was this website.',
  'Specific Randum Numbers.',
  'Stored safely in the bike-shed.',
  'Zero dependencies. Infinite regrets.',
  'We have types for that.',
  'Probability as a Service.',
  'Just roll with it.',
  "It's not gambling if you have types.",
  'Dice notation: surprisingly controversial.',
  "The last dice library you'll ever need. (Until next week.)"
] as const

const GET_STARTED_LABELS = [
  'Get Started',
  'Read (Please)',
  'Begin Your Descent',
  'Copy the Import',
  'Sure, Why Not',
  'Touch Grass Later',
  'For People',
  'Having fun?',
  'Critical Hit!'
] as const

const GITHUB_LABELS = [
  'GitHub',
  'Star & Forget',
  'Open Issues',
  'Blame History',
  'Source of Truth',
  'Fork It'
] as const

// Slot machine tick intervals in ms — fast start, slows to a stop (~2.5s total)
const SLOT_INTERVALS = [
  45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860
]

const DIE_ROLLED = 'die-rolled'

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
  const [spinDuration, setSpinDuration] = useState(3.2)

  const handleClick = (): void => {
    if (spinning) return
    const duration = 3.0 + (roll(5).total - 1) * 0.1
    setSpinDuration(duration)
    setSpinning(true)
    window.dispatchEvent(new CustomEvent(DIE_ROLLED))
  }

  return (
    <img
      src={logoSrc}
      alt="RANDSUM logo"
      className={`hero-logo${spinning ? ' hero-logo--spinning' : ''}`}
      width={240}
      height={240}
      onClick={handleClick}
      onAnimationEnd={() => {
        setSpinning(false)
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
    <a href="/getting-started/introduction/" className="btn btn-primary">
      <BookIcon />
      <span key={tickKey} className="hero-subtitle-inner">
        {label}
      </span>
    </a>
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
