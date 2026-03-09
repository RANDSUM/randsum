import { useStdout } from 'ink'
import { useEffect, useState } from 'react'

export function useTerminalWidth(): number {
  const { stdout } = useStdout()
  const [width, setWidth] = useState(stdout.columns)

  useEffect(() => {
    const handler = (): void => {
      setWidth(stdout.columns)
    }
    stdout.on('resize', handler)
    return () => {
      stdout.off('resize', handler)
    }
  }, [stdout])

  return width
}
