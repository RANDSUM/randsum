// Web stub — NumericStepper is a native-only component (used in QuickReferenceGrid.native.tsx).
// This empty export satisfies Metro's web resolution without pulling in react-native primitives.
export interface NumericStepperProps {
  readonly value: number
  readonly onValueChange: (value: number) => void
  readonly min?: number
  readonly max?: number
  readonly label?: string
  readonly accentColor?: string
}

export function NumericStepper(_props: NumericStepperProps): React.JSX.Element | null {
  return null
}
