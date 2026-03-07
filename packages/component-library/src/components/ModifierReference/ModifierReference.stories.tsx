import type { Story, StoryDefault } from '@ladle/react'
import { useState } from 'react'
import type { ModifierReferenceCell } from './ModifierReference'
import { ModifierReference } from './ModifierReference'

const meta: StoryDefault = { title: 'ModifierReference' }

export default meta

export const Default: Story = () => (
  <div style={{ maxWidth: '480px' }}>
    <ModifierReference />
  </div>
)

export const CoreBottom: Story = () => (
  <div style={{ maxWidth: '480px' }}>
    <ModifierReference corePosition="bottom" />
  </div>
)

export const CoreDisabled: Story = () => (
  <div style={{ maxWidth: '480px' }}>
    <ModifierReference coreDisabled />
  </div>
)

export const ModifiersDisabled: Story = () => (
  <div style={{ maxWidth: '480px' }}>
    <ModifierReference modifiersDisabled />
  </div>
)

function WithClickHandlerDemo(): React.JSX.Element {
  const [last, setLast] = useState<ModifierReferenceCell | null>(null)
  return (
    <div style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ModifierReference onCellClick={setLast} />
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: '#9ca3af',
          margin: 0,
          minHeight: '1.2em'
        }}
      >
        {last
          ? `${last.notation} — ${last.description}${last.isCore ? ' (core)' : ''}`
          : 'Click a cell…'}
      </p>
    </div>
  )
}

export const WithClickHandler: Story = () => <WithClickHandlerDemo />
