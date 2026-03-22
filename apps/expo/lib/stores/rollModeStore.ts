import { create } from 'zustand'

type RollMode = 'simple' | 'advanced'

interface RollModeState {
  readonly mode: RollMode
  toggle(): void
}

export const useRollModeStore = create<RollModeState>()(set => ({
  mode: 'simple',
  toggle() {
    set(state => ({ mode: state.mode === 'simple' ? 'advanced' : 'simple' }))
  }
}))
