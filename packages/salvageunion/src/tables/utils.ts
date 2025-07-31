import type { SalvageUnionTableType } from '../types'

interface MechanicTableFactoryListingOptions {
  label?: string
  description: string
}

interface MechanicTableFactoryOptions {
  nailedIt: MechanicTableFactoryListingOptions
  success: MechanicTableFactoryListingOptions
  toughChoice: MechanicTableFactoryListingOptions
  failure: MechanicTableFactoryListingOptions
  cascadeFailure: MechanicTableFactoryListingOptions
}

export function mechanicTableFactory({
  nailedIt,
  success,
  toughChoice,
  failure,
  cascadeFailure
}: MechanicTableFactoryOptions): SalvageUnionTableType {
  return {
    ['Nailed It']: {
      label: nailedIt.label ?? 'Nailed It',
      description: nailedIt.description,
      hit: 'Nailed It'
    },
    ['Success']: {
      label: success.label ?? 'Success',
      description: success.description,
      hit: 'Success'
    },
    ['Tough Choice']: {
      label: toughChoice.label ?? 'Tough Choice',
      description: toughChoice.description,
      hit: 'Tough Choice'
    },
    ['Failure']: {
      label: failure.label ?? 'Failure',
      description: failure.description,
      hit: 'Failure'
    },
    ['Cascade Failure']: {
      label: cascadeFailure.label ?? 'Cascade Failure',
      description: cascadeFailure.description,
      hit: 'Cascade Failure'
    }
  }
}
