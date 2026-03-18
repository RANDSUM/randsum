import type { Story, StoryDefault } from '@ladle/react'
import { NotationRoller } from './NotationRoller'

const meta: StoryDefault = {
  title: 'NotationRoller'
}

export default meta

export const Default: Story = () => <NotationRoller />
