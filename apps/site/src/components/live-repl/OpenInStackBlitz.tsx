import sdk from '@stackblitz/sdk'
import { extractRandsumDeps } from './extractRandsumDeps'

interface Props {
  code: string
}

export function OpenInStackBlitz({ code }: Props): React.JSX.Element {
  const handleClick = (): void => {
    const randsumDeps = extractRandsumDeps(code)
    sdk.openProject({
      title: 'RANDSUM Example',
      template: 'node',
      files: {
        'index.ts': code,
        'package.json': JSON.stringify(
          {
            name: 'randsum-example',
            type: 'module',
            scripts: { start: 'tsx index.ts' },
            dependencies: { ...randsumDeps, tsx: 'latest' }
          },
          null,
          2
        ),
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ESNext',
              module: 'NodeNext',
              moduleResolution: 'NodeNext'
            }
          },
          null,
          2
        )
      }
    })
  }

  return (
    <div style={{ textAlign: 'right', marginTop: '0.25rem' }}>
      <button
        onClick={handleClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--sl-color-accent)',
          fontSize: '0.8125rem',
          fontFamily: 'var(--sl-font)',
          padding: '0.25rem 0',
          textDecoration: 'none'
        }}
      >
        Open in StackBlitz ↗
      </button>
    </div>
  )
}
