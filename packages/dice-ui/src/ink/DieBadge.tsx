import React from 'react'
import { Text } from 'ink'

export interface DieBadgeProps {
  readonly value: number
  readonly variant: 'unchanged' | 'removed' | 'added'
}

export function DieBadge({ value, variant }: DieBadgeProps): React.JSX.Element {
  if (variant === 'removed') {
    return (
      <Text strikethrough color="red">
        {value}
      </Text>
    )
  }

  if (variant === 'added') {
    return <Text color="green">{value}</Text>
  }

  return <Text>{value}</Text>
}
