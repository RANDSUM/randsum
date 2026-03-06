import { Sandpack } from '@codesandbox/sandpack-react'
import { sandpackDark } from '@codesandbox/sandpack-themes'
import { extractRandsumDeps } from './extractRandsumDeps'

interface Props {
  code: string
  readonly?: boolean
}

const theme = {
  ...sandpackDark,
  font: {
    ...sandpackDark.font,
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    size: '13px'
  }
}

export function SandpackRepl({ code, readonly = false }: Props): React.JSX.Element {
  const dependencies = extractRandsumDeps(code)

  return (
    <Sandpack
      template="vanilla-ts"
      theme={theme}
      files={{ '/index.ts': code }}
      customSetup={{ dependencies }}
      options={{
        readOnly: readonly,
        showConsole: true,
        showConsoleButton: true,
        editorHeight: 'auto'
      }}
    />
  )
}
