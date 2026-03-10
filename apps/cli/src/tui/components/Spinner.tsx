import { Text } from 'ink'
import { useEffect, useState } from 'react'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const

export function Spinner(): React.JSX.Element {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setFrame(f => (f + 1) % FRAMES.length)
    }, 80)
    return () => {
      clearInterval(id)
    }
  }, [])

  return <Text color="cyan">{FRAMES[frame]}</Text>
}
