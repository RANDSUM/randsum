import { describe, expect, test } from 'bun:test'
import { buildStackBlitzProject } from '../src/helpers/stackblitz'

describe('buildStackBlitzProject', () => {
  test('rolls the notation in a runnable Node project', () => {
    const project = buildStackBlitzProject('4d6L')
    expect(project.template).toBe('node')
    expect(project.files['index.ts']).toContain('roll("4d6L")')
    const pkg = JSON.parse(project.files['package.json'] ?? '{}')
    expect(pkg.scripts.start).toBe('tsx index.ts')
    expect(pkg.dependencies['@randsum/roller']).toBe('latest')
  })

  test('quotes notation safely inside the generated code', () => {
    const project = buildStackBlitzProject('1d6"); evil("')
    expect(project.files['index.ts']).toContain(JSON.stringify('1d6"); evil("'))
  })
})
