import { beforeEach, describe, expect, test } from 'bun:test'

import '../__tests__/setup'
import { useWizardStore } from '../lib/stores/wizardStore'

describe('useWizardStore', () => {
  beforeEach(() => {
    useWizardStore.getState().reset()
  })

  test('initializes with step "type" and canAdvance true', () => {
    const state = useWizardStore.getState()
    expect(state.step).toBe('type')
    expect(state.type).toBe('standard')
    expect(state.draft).toEqual({})
    expect(state.canAdvance).toBe(true)
  })

  test('goToNext advances from type to build', () => {
    useWizardStore.getState().goToNext()
    expect(useWizardStore.getState().step).toBe('build')
  })

  test('goToNext advances through all steps', () => {
    const store = useWizardStore.getState()
    store.updateDraft({ notation: '1d20' })
    store.goToNext() // type -> build
    store.goToNext() // build -> variables
    store.goToNext() // variables -> name
    expect(useWizardStore.getState().step).toBe('name')
  })

  test('goToNext is no-op at last step', () => {
    const store = useWizardStore.getState()
    store.updateDraft({ notation: '1d20', name: 'Test' })
    store.goToNext() // type -> build
    store.goToNext() // build -> variables
    store.goToNext() // variables -> name
    store.goToNext() // no-op
    expect(useWizardStore.getState().step).toBe('name')
  })

  test('goToPrev goes back from build to type', () => {
    useWizardStore.getState().goToNext() // type -> build
    useWizardStore.getState().goToPrev() // build -> type
    expect(useWizardStore.getState().step).toBe('type')
  })

  test('goToPrev is no-op at first step', () => {
    useWizardStore.getState().goToPrev()
    expect(useWizardStore.getState().step).toBe('type')
  })

  test('setType updates the type', () => {
    useWizardStore.getState().setType('game')
    expect(useWizardStore.getState().type).toBe('game')
  })

  test('updateDraft merges fields', () => {
    useWizardStore.getState().updateDraft({ notation: '2d6' })
    useWizardStore.getState().updateDraft({ name: 'Attack' })
    const draft = useWizardStore.getState().draft
    expect(draft.notation).toBe('2d6')
    expect(draft.name).toBe('Attack')
  })

  test('canAdvance is false on build step without notation', () => {
    useWizardStore.getState().goToNext() // type -> build
    expect(useWizardStore.getState().canAdvance).toBe(false)
  })

  test('canAdvance is true on build step with notation', () => {
    useWizardStore.getState().updateDraft({ notation: '1d20' })
    useWizardStore.getState().goToNext() // type -> build
    expect(useWizardStore.getState().canAdvance).toBe(true)
  })

  test('canAdvance is false on name step without name', () => {
    useWizardStore.getState().updateDraft({ notation: '1d20' })
    useWizardStore.getState().goToNext() // type -> build
    useWizardStore.getState().goToNext() // build -> variables
    useWizardStore.getState().goToNext() // variables -> name
    expect(useWizardStore.getState().canAdvance).toBe(false)
  })

  test('canAdvance is true on name step with name', () => {
    useWizardStore.getState().updateDraft({ notation: '1d20', name: 'Test' })
    useWizardStore.getState().goToNext()
    useWizardStore.getState().goToNext()
    useWizardStore.getState().goToNext()
    expect(useWizardStore.getState().canAdvance).toBe(true)
  })

  test('reset clears all state', () => {
    useWizardStore.getState().updateDraft({ notation: '1d20', name: 'Test' })
    useWizardStore.getState().setType('game')
    useWizardStore.getState().goToNext()
    useWizardStore.getState().reset()

    const state = useWizardStore.getState()
    expect(state.step).toBe('type')
    expect(state.type).toBe('standard')
    expect(state.draft).toEqual({})
    expect(state.canAdvance).toBe(true)
  })
})
