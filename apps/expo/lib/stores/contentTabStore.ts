import { create } from 'zustand'

type ContentTab = 'common' | 'notation'

interface ContentTabState {
  readonly tab: ContentTab
  setTab(tab: ContentTab): void
}

export const useContentTabStore = create<ContentTabState>()(set => ({
  tab: 'common',
  setTab(tab: ContentTab) {
    set({ tab })
  }
}))
