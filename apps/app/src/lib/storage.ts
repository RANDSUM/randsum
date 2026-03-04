import AsyncStorage from '@react-native-async-storage/async-storage'
import type { HistoryEntry, SavedRoll } from '../types'

const HISTORY_KEY = 'roll_history'
const SAVED_KEY = 'saved_rolls'

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY)
    return json ? (JSON.parse(json) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export async function saveHistory(history: HistoryEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // silently fail — avoid crashing on storage errors
  }
}

export async function loadSavedRolls(): Promise<SavedRoll[]> {
  try {
    const json = await AsyncStorage.getItem(SAVED_KEY)
    return json ? (JSON.parse(json) as SavedRoll[]) : []
  } catch {
    return []
  }
}

export async function saveSavedRolls(rolls: SavedRoll[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(rolls))
  } catch {
    // silently fail
  }
}
