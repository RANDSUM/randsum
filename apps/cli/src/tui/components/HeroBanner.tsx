import { Box, Text, useInput } from 'ink'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { execFile } from 'node:child_process'
import { roll } from '@randsum/roller'
import { useTerminalWidth } from '../hooks/useTerminalWidth'
import { lerpColor } from '../helpers/gradientColor'

const DOCS_URL = 'https://randsum.dev'
const GITHUB_URL = 'https://github.com/RANDSUM/randsum'

const TAGLINES = [
  'Throw Dice, Not Exceptions.',
  'Spend 13+ years building this library and all I got was this stupid website',
  'Very Specific Random Numbers',
  'Living Comfortably in the Bike Shed.',
  'Zero dependencies. Infinite regrets.',
  'We have types for that.',
  'Probability as a Service.',
  'Just roll with it.',
  "It's not gambling if you have types.",
  'Dice notation: surprisingly controversial.',
  "The first dice library you'll ever want.",
  'Fuck ICE'
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
  '6d8L2H1R{1,2}U!C{>7}+5-2'
] as const

// Slot machine tick intervals — fast start, slows to a stop (~4.5s total)
const SLOT_INTERVALS: readonly number[] = [
  45, 50, 55, 60, 70, 80, 95, 115, 140, 170, 210, 260, 325, 410, 510, 640, 860
]

const RANDSUM_ART: readonly string[] = [
  '██████╗  █████╗ ███╗   ██╗██████╗ ███████╗██╗   ██╗███╗   ███╗',
  '██╔══██╗██╔══██╗████╗  ██║██╔══██╗██╔════╝██║   ██║████╗ ████║',
  '██████╔╝███████║██╔██╗ ██║██║  ██║███████╗██║   ██║██╔████╔██║',
  '██╔══██╗██╔══██║██║╚██╗██║██║  ██║╚════██║██║   ██║██║╚██╔╝██║',
  '██║  ██║██║  ██║██║ ╚████║██████╔╝███████║╚██████╔╝██║ ╚═╝ ██║',
  '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═════╝ ╚═╝     ╚═╝'
]

// Matches site CSS: --sl-color-accent and --sl-color-accent-high (dark mode)
const GRAD_START = '#3b82f6'
const GRAD_END = '#93c5fd'

// Die faces: 8 rows × 15 cols (visually ≈ square at ~2:1 terminal char aspect)
// Index 0–4 = pip faces 1–5; index 5 = RANDSUM logo (R-pattern, always final)
const DIE_FACES: readonly (readonly string[])[] = [
  // 1 pip
  [
    '███████████████',
    '█             █',
    '█             █',
    '█      ▪      █',
    '█             █',
    '█             █',
    '█             █',
    '███████████████'
  ],
  // 2 pips
  [
    '███████████████',
    '█  ▪          █',
    '█             █',
    '█             █',
    '█             █',
    '█             █',
    '█          ▪  █',
    '███████████████'
  ],
  // 3 pips
  [
    '███████████████',
    '█  ▪          █',
    '█             █',
    '█      ▪      █',
    '█             █',
    '█             █',
    '█          ▪  █',
    '███████████████'
  ],
  // 4 pips
  [
    '███████████████',
    '█  ▪       ▪  █',
    '█             █',
    '█             █',
    '█             █',
    '█             █',
    '█  ▪       ▪  █',
    '███████████████'
  ],
  // 5 pips
  [
    '███████████████',
    '█  ▪       ▪  █',
    '█             █',
    '█      ▪      █',
    '█             █',
    '█             █',
    '█  ▪       ▪  █',
    '███████████████'
  ],
  // RANDSUM logo: R-pattern (top-right cluster shifted center, bottom dots spread)
  [
    '███████████████',
    '█  ▪  ▪       █',
    '█             █',
    '█  ▪  ▪       █',
    '█             █',
    '█  ▪       ▪  █',
    '█             █',
    '███████████████'
  ]
]

function openUrl(url: string): void {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  execFile(cmd, [url])
}

function pickRandom<T>(arr: readonly T[]): T {
  const result = arr[roll(arr.length).total - 1]
  if (result === undefined) throw new Error('pickRandom: empty array')
  return result
}

export function HeroBanner({
  isFocused,
  onDown,
  onExit,
  onSelectionChange,
  onNotationChange
}: {
  readonly isFocused: boolean
  readonly onDown?: () => void
  readonly onExit?: () => void
  readonly onSelectionChange?: (idx: 0 | 1 | 2) => void
  readonly onNotationChange?: (notation: string) => void
}): React.JSX.Element {
  const termWidth = useTerminalWidth()

  const randSumArt = useMemo(
    () =>
      RANDSUM_ART.map((line, row) => (
        <Box key={row} flexDirection="row">
          {[...line].map((char, col) => (
            <Text
              key={col}
              color={lerpColor(GRAD_START, GRAD_END, col / Math.max(1, line.length - 1))}
            >
              {char}
            </Text>
          ))}
        </Box>
      )),
    []
  )

  const [selectedItem, setSelectedItem] = useState<0 | 1 | 2>(0)
  const [tagline, setTagline] = useState<string>(TAGLINES[0])
  const [getStartedLabel, setGetStartedLabel] = useState<string>(GET_STARTED_LABELS[0])
  const [githubLabel, setGithubLabel] = useState<string>(GITHUB_LABELS[0])
  const [dieFaceIdx, setDieFaceIdx] = useState<0 | 1 | 2 | 3 | 4 | 5>(5)
  const [isSpinning, setIsSpinning] = useState(false)
  const spinRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (spinRef.current !== undefined) clearTimeout(spinRef.current)
    }
  }, [])

  useEffect(() => {
    onSelectionChange?.(selectedItem)
  }, [selectedItem, onSelectionChange])

  const triggerSlot = useCallback((): void => {
    if (isSpinning) return
    setIsSpinning(true)

    const finalTagline = pickRandom(TAGLINES)
    const finalGetStarted = pickRandom(GET_STARTED_LABELS)
    const finalGitHub = pickRandom(GITHUB_LABELS)
    const finalNotation = pickRandom(HERO_NOTATIONS)

    const progress = { step: 0 }
    const tick = (): void => {
      if (progress.step < SLOT_INTERVALS.length - 1) {
        setTagline(pickRandom(TAGLINES))
        setGetStartedLabel(pickRandom(GET_STARTED_LABELS))
        setGithubLabel(pickRandom(GITHUB_LABELS))
        setDieFaceIdx((roll(5).total - 1) as 0 | 1 | 2 | 3 | 4)
        onNotationChange?.(pickRandom(HERO_NOTATIONS))
        progress.step++
        spinRef.current = setTimeout(tick, SLOT_INTERVALS[progress.step] ?? 860)
      } else {
        setTagline(finalTagline)
        setGetStartedLabel(finalGetStarted)
        setGithubLabel(finalGitHub)
        setDieFaceIdx(5)
        onNotationChange?.(finalNotation)
        setIsSpinning(false)
      }
    }

    spinRef.current = setTimeout(tick, SLOT_INTERVALS[0] ?? 45)
  }, [isSpinning, onNotationChange])

  useInput(
    (_input, key) => {
      if (key.leftArrow) {
        setSelectedItem(prev => Math.max(0, prev - 1) as 0 | 1 | 2)
      } else if (key.rightArrow) {
        setSelectedItem(prev => Math.min(2, prev + 1) as 0 | 1 | 2)
      } else if (key.return) {
        if (selectedItem === 0) {
          triggerSlot()
        } else if (selectedItem === 1) {
          openUrl(DOCS_URL)
        } else {
          openUrl(GITHUB_URL)
        }
      } else if (key.downArrow) {
        onDown?.()
      } else if (_input === 'i' || key.escape) {
        onExit?.()
      }
    },
    { isActive: isFocused }
  )

  const dieFace = DIE_FACES[dieFaceIdx] ?? []
  const dieSelected = isFocused && selectedItem === 0
  const docsSelected = isFocused && selectedItem === 1
  const githubSelected = isFocused && selectedItem === 2
  const showDie = termWidth >= 80

  return (
    <Box flexDirection="row" paddingX={1} paddingY={1} alignItems="center">
      {/* Die logo — selectable, triggers slot machine on Enter */}
      {showDie && (
        <Box
          flexDirection="column"
          marginRight={3}
          marginLeft={3}
          justifyContent="center"
          alignItems="center"
        >
          {dieFace.map((line, i) => (
            <Box key={i} flexDirection="row">
              {[...line].map((char, j) => {
                if (char === ' ') {
                  return (
                    <Text key={j} backgroundColor={dieSelected ? '#d8d8e0' : '#b8b8c0'}>
                      {' '}
                    </Text>
                  )
                }
                return (
                  <Text key={j} color="#1a1a24">
                    {char}
                  </Text>
                )
              })}
            </Box>
          ))}
        </Box>
      )}

      {/* Right content */}
      <Box flexDirection="column" justifyContent="center" flexGrow={1}>
        {/* RANDSUM gradient ASCII art — centered, horizontal gradient (memoized: colors never change) */}
        <Box flexDirection="column" alignItems="center">
          {randSumArt}
        </Box>

        {/* Subtitle + tagline + buttons — centered */}
        <Box flexDirection="column" alignItems="center" marginTop={1}>
          <Text bold color="white">
            TypeScript-First Dice Notation Ecosystem
          </Text>

          <Text dimColor>{tagline}</Text>

          {/* Link buttons */}
          <Box flexDirection="row" gap={2} marginTop={1}>
            <Box
              borderStyle="round"
              borderColor={docsSelected ? 'white' : '#7aabff'}
              backgroundColor={docsSelected ? '#5292FF' : '#1a3a8f'}
              paddingX={2}
            >
              <Text bold color="white">
                {getStartedLabel}
              </Text>
            </Box>

            <Box
              borderStyle="round"
              borderColor={githubSelected ? 'white' : '#666666'}
              paddingX={2}
            >
              <Text bold color={githubSelected ? 'white' : '#888888'}>
                {githubLabel}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
