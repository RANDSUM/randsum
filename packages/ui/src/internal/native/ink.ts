// The colour a step ink is drawn in on React Native, shared by the roll's
// steps and the notation field so a modifier looks the same in both.
import type { StepInk } from '../ink'
import type { RollerTheme } from '../../native/theme'

export function inkColour(theme: RollerTheme, ink: StepInk | 'removed'): string {
  switch (ink) {
    case 'clamp':
      return theme.inkClamp
    case 'substitute':
      return theme.inkSubstitute
    case 'generate':
      return theme.inkGenerate
    case 'filter':
    case 'removed':
      return theme.inkFilter
    case 'add':
      return theme.inkAdd
    case 'subtract':
      return theme.inkSubtract
    default:
      return theme.ink
  }
}
