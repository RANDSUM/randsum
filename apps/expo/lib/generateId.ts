import { randomUUID } from 'expo-crypto'

export function generateId(): string {
  return randomUUID()
}
