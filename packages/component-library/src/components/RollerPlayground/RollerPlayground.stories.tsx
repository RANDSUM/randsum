import type { Story, StoryDefault } from '@ladle/react'
import { RollerPlayground } from './RollerPlayground'

const meta: StoryDefault = {
  title: 'RollerPlayground'
}

export default meta

export const Default: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground />
  </div>
)

export const NoStackBlitz: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground stackblitz={false} />
  </div>
)

export const Sizes: Story = () => (
  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    {(['s', 'm', 'l'] as const).map(size => (
      <div key={size}>
        <p
          style={{
            marginBottom: '0.5rem',
            fontSize: '0.75rem',
            color: '#9ca3af',
            fontFamily: 'monospace'
          }}
        >
          size="{size}"
        </p>
        <RollerPlayground size={size} />
      </div>
    ))}
  </div>
)
