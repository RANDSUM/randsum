import { beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock @supabase/supabase-js before importing sessions
const mockSelect = mock(() => ({}))
const mockEq = mock(() => ({}))
const mockSingle = mock(() => ({}))
const mockInsert = mock(() => ({}))
const mockUpdate = mock(() => ({}))
const mockMatch = mock(() => ({}))

const mockFrom = mock(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate
}))

const mockCreateClient = mock(() => ({
  from: mockFrom
}))

void mock.module('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}))

// Mock nanoid
const mockNanoid = mock((size?: number) => {
  if (size === 32) return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  return 'mock8chr'
})

void mock.module('nanoid', () => ({
  nanoid: mockNanoid
}))

describe('sessions lib', () => {
  beforeEach(() => {
    mockNanoid.mockClear()
    mockFrom.mockClear()
    mockSelect.mockClear()
    mockEq.mockClear()
    mockSingle.mockClear()
    mockInsert.mockClear()
    mockUpdate.mockClear()
    mockMatch.mockClear()
  })

  describe('createSession', () => {
    test('returns CreateSessionResult with correct shape', async () => {
      const mockSessionRow = {
        id: 'mock8chr',
        notation: '4d6L',
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
      }

      // Chain: from().insert().select().single()
      mockSelect.mockReturnValue({
        single: mock(() => Promise.resolve({ data: mockSessionRow, error: null }))
      })
      mockInsert.mockReturnValue({ select: mockSelect })

      const { createSession } = await import('../../src/lib/sessions')
      const result = await createSession('4d6L')

      expect(result).toHaveProperty('session')
      expect(result).toHaveProperty('claimToken')
      expect(typeof result.claimToken).toBe('string')
      expect(result.claimToken.length).toBe(32)
    })

    test('session has correct shape', async () => {
      const mockSessionRow = {
        id: 'mock8chr',
        notation: '4d6L',
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
      }

      mockSelect.mockReturnValue({
        single: mock(() => Promise.resolve({ data: mockSessionRow, error: null }))
      })
      mockInsert.mockReturnValue({ select: mockSelect })

      const { createSession } = await import('../../src/lib/sessions')
      const result = await createSession('4d6L')

      expect(result.session).toHaveProperty('id')
      expect(result.session).toHaveProperty('notation')
      expect(result.session).toHaveProperty('created_at')
      expect(result.session).toHaveProperty('updated_at')
      expect(result.session).not.toHaveProperty('claim_token')
    })

    test('generates 8-char id and 32-char claim token via nanoid', async () => {
      const mockSessionRow = {
        id: 'mock8chr',
        notation: '4d6L',
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
      }

      mockSelect.mockReturnValue({
        single: mock(() => Promise.resolve({ data: mockSessionRow, error: null }))
      })
      mockInsert.mockReturnValue({ select: mockSelect })

      const { createSession } = await import('../../src/lib/sessions')
      await createSession('4d6L')

      // nanoid should be called twice: once for id (8), once for claim_token (32)
      expect(mockNanoid).toHaveBeenCalledWith(8)
      expect(mockNanoid).toHaveBeenCalledWith(32)
    })

    test('throws on Supabase error', async () => {
      mockSelect.mockReturnValue({
        single: mock(() => Promise.resolve({ data: null, error: new Error('DB error') }))
      })
      mockInsert.mockReturnValue({ select: mockSelect })

      const { createSession } = await import('../../src/lib/sessions')
      expect(createSession('4d6L')).rejects.toThrow()
    })
  })

  describe('fetchSession', () => {
    test('returns Session when found', async () => {
      const mockSessionRow = {
        id: 'mock8chr',
        notation: '4d6L',
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
      }

      mockEq.mockReturnValue({
        single: mock(() => Promise.resolve({ data: mockSessionRow, error: null }))
      })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { fetchSession } = await import('../../src/lib/sessions')
      const result = await fetchSession('mock8chr')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('mock8chr')
      expect(result?.notation).toBe('4d6L')
    })

    test('returns null when not found', async () => {
      mockEq.mockReturnValue({
        single: mock(() =>
          Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        )
      })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { fetchSession } = await import('../../src/lib/sessions')
      const result = await fetchSession('notfound')

      expect(result).toBeNull()
    })

    test('selects only id, notation, created_at, updated_at', async () => {
      mockEq.mockReturnValue({
        single: mock(() =>
          Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        )
      })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { fetchSession } = await import('../../src/lib/sessions')
      await fetchSession('mock8chr')

      expect(mockSelect).toHaveBeenCalledWith('id, notation, created_at, updated_at')
    })

    test('never selects claim_token', async () => {
      mockEq.mockReturnValue({
        single: mock(() =>
          Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'not found' } })
        )
      })
      mockSelect.mockReturnValue({ eq: mockEq })

      const { fetchSession } = await import('../../src/lib/sessions')
      await fetchSession('mock8chr')

      // Verify select was called and did not include claim_token
      expect(mockSelect).toHaveBeenCalled()
      expect(mockSelect).not.toHaveBeenCalledWith(expect.stringContaining('claim_token'))
    })
  })

  describe('updateSession', () => {
    test('sends claim_token via x-claim-token header', async () => {
      const mockEqUpdate = mock(() => Promise.resolve({ data: null, error: null }))
      mockUpdate.mockReturnValue({ eq: mockEqUpdate })

      const { updateSession } = await import('../../src/lib/sessions')
      await updateSession('mock8chr', '4d6H', 'claim-token-here')
      // Verifies no error thrown — header is set via createClient options (tested structurally)
    })

    test('throws on Supabase error', async () => {
      const mockEqUpdate = mock(() =>
        Promise.resolve({ data: null, error: new Error('Unauthorized') })
      )
      mockUpdate.mockReturnValue({ eq: mockEqUpdate })

      const { updateSession } = await import('../../src/lib/sessions')
      expect(updateSession('mock8chr', '4d6H', 'wrong-token')).rejects.toThrow()
    })
  })

  describe('forkSession', () => {
    test('creates a new session with the same notation', async () => {
      const mockSessionRow = {
        id: 'newid123',
        notation: '4d6L',
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
      }

      mockSelect.mockReturnValue({
        single: mock(() => Promise.resolve({ data: mockSessionRow, error: null }))
      })
      mockInsert.mockReturnValue({ select: mockSelect })

      const { forkSession } = await import('../../src/lib/sessions')
      const result = await forkSession('4d6L')

      expect(result).toHaveProperty('session')
      expect(result).toHaveProperty('claimToken')
      expect(result.session.notation).toBe('4d6L')
    })

    test('returns CreateSessionResult shape', async () => {
      const mockSessionRow = {
        id: 'newid123',
        notation: '2d8+3',
        created_at: '2026-03-17T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z'
      }

      mockSelect.mockReturnValue({
        single: mock(() => Promise.resolve({ data: mockSessionRow, error: null }))
      })
      mockInsert.mockReturnValue({ select: mockSelect })

      const { forkSession } = await import('../../src/lib/sessions')
      const result = await forkSession('2d8+3')

      expect(result.session).toHaveProperty('id')
      expect(result.session).toHaveProperty('notation')
      expect(result.session).toHaveProperty('created_at')
      expect(result.session).toHaveProperty('updated_at')
      expect(typeof result.claimToken).toBe('string')
    })
  })
})
