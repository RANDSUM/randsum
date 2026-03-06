import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackProvider
} from '@codesandbox/sandpack-react'
import { sandpackDark } from '@codesandbox/sandpack-themes'
import { extractRandsumDeps } from './extractRandsumDeps'

interface Props {
  code: string
  readonly?: boolean
}

const theme = {
  ...sandpackDark,
  colors: {
    ...sandpackDark.colors,
    surface1: '#0f172a',
    surface2: '#1e293b',
    surface3: '#334155',
    accent: '#3b82f6',
    base: '#e2e8f0',
    clickable: '#94a3b8',
    hover: '#e2e8f0',
    disabled: '#475569',
    error: '#f87171',
    errorSurface: '#1e293b'
  },
  font: {
    ...sandpackDark.font,
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    size: '13px'
  }
}

export function SandpackRepl({ code, readonly = false }: Props): React.JSX.Element {
  const dependencies = extractRandsumDeps(code)

  const packageJson = JSON.stringify(
    {
      name: 'randsum-example',
      type: 'module',
      scripts: { start: 'node index.js' },
      dependencies
    },
    null,
    2
  )

  return (
    <SandpackProvider
      template="node"
      theme={theme}
      files={{
        '/index.js': { code, active: true },
        '/package.json': { code: packageJson, hidden: true }
      }}
      customSetup={{ dependencies }}
    >
      <SandpackLayout>
        <SandpackCodeEditor readOnly={readonly} />
        <SandpackConsole />
      </SandpackLayout>
    </SandpackProvider>
  )
}
