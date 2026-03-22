import { create } from 'zustand'

import type { RollTemplate } from '../types'

type WizardStep = 'type' | 'build' | 'variables' | 'name'
type WizardType = 'standard' | 'game'

const STEP_ORDER: readonly WizardStep[] = ['type', 'build', 'variables', 'name']

interface WizardState {
  readonly step: WizardStep
  readonly type: WizardType
  readonly draft: Partial<RollTemplate>
  readonly canAdvance: boolean

  goToNext(): void
  goToPrev(): void
  setType(type: WizardType): void
  updateDraft(fields: Partial<RollTemplate>): void
  reset(): void
}

function computeCanAdvance(step: WizardStep, draft: Partial<RollTemplate>): boolean {
  switch (step) {
    case 'type':
      return true
    case 'build':
      return typeof draft.notation === 'string' && draft.notation.length > 0
    case 'variables':
      return true
    case 'name':
      return typeof draft.name === 'string' && draft.name.trim().length > 0
  }
}

export const useWizardStore = create<WizardState>()(set => ({
  step: 'type',
  type: 'standard',
  draft: {},
  canAdvance: true,

  goToNext() {
    set(state => {
      const idx = STEP_ORDER.indexOf(state.step)
      if (idx >= STEP_ORDER.length - 1) return state
      const nextStep = STEP_ORDER[idx + 1]!
      return {
        step: nextStep,
        canAdvance: computeCanAdvance(nextStep, state.draft)
      }
    })
  },

  goToPrev() {
    set(state => {
      const idx = STEP_ORDER.indexOf(state.step)
      if (idx <= 0) return state
      const prevStep = STEP_ORDER[idx - 1]!
      return {
        step: prevStep,
        canAdvance: computeCanAdvance(prevStep, state.draft)
      }
    })
  },

  setType(type: WizardType) {
    set(state => ({ type, canAdvance: computeCanAdvance(state.step, state.draft) }))
  },

  updateDraft(fields: Partial<RollTemplate>) {
    set(state => {
      const draft = { ...state.draft, ...fields }
      return { draft, canAdvance: computeCanAdvance(state.step, draft) }
    })
  },

  reset() {
    set({
      step: 'type',
      type: 'standard',
      draft: {},
      canAdvance: true
    })
  }
}))
