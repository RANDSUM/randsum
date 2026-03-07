import type { Story, StoryDefault } from '@ladle/react'
import { RollerPlayground } from './RollerPlayground'

const meta: StoryDefault = {
  title: 'RollerPlayground'
}

export default meta

export const Default: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground defaultNotation="4d6L" />
  </div>
)

export const Advantage: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground defaultNotation="2d20K" />
  </div>
)

export const Disadvantage: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground defaultNotation="2d20kl" />
  </div>
)

export const WithModifier: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground defaultNotation="1d20+5" />
  </div>
)

export const Exploding: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground defaultNotation="4d6!" />
  </div>
)

export const NoStackBlitz: Story = () => (
  <div style={{ padding: '2rem' }}>
    <RollerPlayground stackblitz={false} defaultNotation="4d6L" />
  </div>
)

export const ExpandBreakdown: Story = () => (
  <div style={{ padding: '2rem' }}>
    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
      Roll dice, then click the result chip to expand the breakdown.
    </p>
    <RollerPlayground defaultNotation="4d6L" />
  </div>
)

export const ExpandWithArithmetic: Story = () => (
  <div style={{ padding: '2rem' }}>
    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
      Roll and expand — should show arithmetic modifier steps.
    </p>
    <RollerPlayground defaultNotation="1d20+5" />
  </div>
)

export const ExpandSimpleRoll: Story = () => (
  <div style={{ padding: '2rem' }}>
    <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#9ca3af' }}>
      Simple roll with no modifiers — should show Rolled step only, then Total.
    </p>
    <RollerPlayground defaultNotation="1d6" />
  </div>
)
