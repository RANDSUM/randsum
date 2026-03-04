export type RollGroup = {
  notation: string
  initialRolls: number[]
  modifiedRolls: number[]
  droppedIndices: number[]
  groupTotal: number
}

export type HistoryEntry = {
  id: string
  notation: string
  description: string
  total: number
  groups: RollGroup[]
  timestamp: number
}

export type SavedRoll = {
  id: string
  name: string
  notation: string
}
