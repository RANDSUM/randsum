import { describe, expect, test } from 'bun:test'
import { buildStackBlitzProject } from '../src/stackblitz'

describe('buildStackBlitzProject', () => {
  test('returns correct title and description', () => {
    const project = buildStackBlitzProject('2d6')
    expect(project.title).toBe('RANDSUM \u2014 2d6')
    expect(project.description).toBe('Rolling 2d6 with @randsum/roller')
    expect(project.template).toBe('node')
  })

  test('generated code contains JSON-serialized notation', () => {
    const project = buildStackBlitzProject('4d6L')
    expect(project.files['index.ts']).toContain('"4d6L"')
    expect(project.files['index.ts']).not.toContain("'4d6L'")
  })

  test('handles notation with special chars safely', () => {
    const notation = 'test`injection${evil}'
    const project = buildStackBlitzProject(notation)
    const code = project.files['index.ts'] ?? ''
    expect(code).toContain(JSON.stringify(notation))
  })

  test('package.json file is valid JSON with correct deps', () => {
    const project = buildStackBlitzProject('1d20')
    const pkg = JSON.parse(project.files['package.json'] ?? '{}') as {
      dependencies: Record<string, string>
      scripts: Record<string, string>
    }
    expect(pkg.dependencies['@randsum/roller']).toBe('latest')
    expect(pkg.scripts['start']).toBe('tsx index.ts')
  })

  test('files object has index.ts and package.json keys', () => {
    const project = buildStackBlitzProject('3d8')
    expect(Object.keys(project.files)).toContain('index.ts')
    expect(Object.keys(project.files)).toContain('package.json')
  })
})
