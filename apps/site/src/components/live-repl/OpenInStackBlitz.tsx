import sdk from '@stackblitz/sdk'
import { buildNodeProject } from '../../helpers/stackblitz'
import { extractRandsumDeps } from './extractRandsumDeps'
import './live-repl.css'

interface Props {
  code: string
}

export function OpenInStackBlitz({ code }: Props): React.JSX.Element {
  const handleClick = (): void => {
    const project = buildNodeProject(code, extractRandsumDeps(code), 'RANDSUM Example')
    sdk.openProject({
      ...project,
      files: {
        ...project.files,
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
    <div className="open-in-stackblitz">
      <button type="button" onClick={handleClick}>
        Open in StackBlitz ↗
      </button>
    </div>
  )
}
