import { Box, Text, useInput } from 'ink'
import { useCallback, useEffect, useRef, useState } from 'react'
import { execFile } from 'node:child_process'
import { roll } from '@randsum/roller'
import { useTerminalWidth } from '../hooks/useTerminalWidth'

const DOCS_URL = 'https://randsum.dev/getting-started/introduction/'
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

// Light blue (top) → deep blue (bottom)
const GRADIENT: readonly string[] = [
  '#C8DEFF',
  '#A8C8FF',
  '#7AABFF',
  '#5292FF',
  '#3878F0',
  '#2060E0'
]

// Die faces: index 0 = 1 pip, index 5 = 6 pips
const DIE_FACES: readonly (readonly string[])[] = [
  ['╔═════════════╗', '║             ║', '║      ●      ║', '║             ║', '╚═════════════╝'],
  ['╔═════════════╗', '║  ●          ║', '║             ║', '║          ●  ║', '╚═════════════╝'],
  ['╔═════════════╗', '║  ●          ║', '║      ●      ║', '║          ●  ║', '╚═════════════╝'],
  ['╔═════════════╗', '║  ●       ●  ║', '║             ║', '║  ●       ●  ║', '╚═════════════╝'],
  ['╔═════════════╗', '║  ●       ●  ║', '║      ●      ║', '║  ●       ●  ║', '╚═════════════╝'],
  ['╔═════════════╗', '║  ●       ●  ║', '║  ●       ●  ║', '║  ●       ●  ║', '╚═════════════╝']
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
  onSelectionChange
}: {
  readonly isFocused: boolean
  readonly onDown?: () => void
  readonly onExit?: () => void
  readonly onSelectionChange?: (idx: 0 | 1 | 2) => void
}): React.JSX.Element {
  const termWidth = useTerminalWidth()
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
    const finalFace = (roll(6).total - 1) as 0 | 1 | 2 | 3 | 4 | 5

    const progress = { step: 0 }
    const tick = (): void => {
      if (progress.step < SLOT_INTERVALS.length - 1) {
        setTagline(pickRandom(TAGLINES))
        setGetStartedLabel(pickRandom(GET_STARTED_LABELS))
        setGithubLabel(pickRandom(GITHUB_LABELS))
        setDieFaceIdx((roll(6).total - 1) as 0 | 1 | 2 | 3 | 4 | 5)
        progress.step++
        spinRef.current = setTimeout(tick, SLOT_INTERVALS[progress.step] ?? 860)
      } else {
        setTagline(finalTagline)
        setGetStartedLabel(finalGetStarted)
        setGithubLabel(finalGitHub)
        setDieFaceIdx(finalFace)
        setIsSpinning(false)
      }
    }

    spinRef.current = setTimeout(tick, SLOT_INTERVALS[0] ?? 45)
  }, [isSpinning])

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
    <Box flexDirection="row" paddingX={1} paddingY={1}>
      {/* Die logo — selectable, triggers slot machine on Enter */}
      {showDie && (
        <Box flexDirection="column" marginRight={3} justifyContent="center" alignItems="center">
          {dieFace.map((line, i) => (
            <Text key={i} color={dieSelected ? 'white' : '#888888'} bold={dieSelected}>
              {line}
            </Text>
          ))}
        </Box>
      )}

      {/* Right content */}
      <Box flexDirection="column" justifyContent="center">
        {/* RANDSUM gradient ASCII art */}
        <Box flexDirection="column">
          {RANDSUM_ART.map((line, i) => (
            <Text key={i} color={GRADIENT[i] ?? '#2060E0'}>
              {line}
            </Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text bold color="white">
            TypeScript-First Dice Notation Ecosystem
          </Text>
        </Box>

        <Text dimColor>{tagline}</Text>

        {/* Link buttons */}
        <Box flexDirection="row" gap={2} marginTop={1}>
          <Box
            borderStyle="round"
            borderColor={docsSelected ? 'white' : '#4d8eff'}
            backgroundColor={docsSelected ? '#4d8eff' : '#2d68ff'}
            paddingX={2}
          >
            <Text bold color="white">
              {getStartedLabel}
            </Text>
          </Box>

          <Box borderStyle="round" borderColor={githubSelected ? 'white' : '#666666'} paddingX={2}>
            <Text bold color={githubSelected ? 'white' : '#888888'}>
              {githubLabel}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
