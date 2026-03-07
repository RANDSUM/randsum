import type { Story, StoryDefault } from '@ladle/react'
import { RollerPlayground } from './RollerPlayground'

const meta: StoryDefault = {
  title: 'RollerPlayground'
}

export default meta

export const Default: Story = () => <RollerPlayground />

export const NoStackBlitz: Story = () => <RollerPlayground stackblitz={false} />

export const Sizes: Story = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
