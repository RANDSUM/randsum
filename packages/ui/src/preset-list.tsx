import type React from 'react'
import type { Preset } from './presets'
import type { Roller } from './use-roller'

export type { Preset } from './presets'
export type { Roller } from './use-roller'

export function PresetList({
  presets,
  roller,
  label = 'Presets',
  layout = 'chips'
}: {
  readonly presets: readonly Preset[]
  readonly roller: Roller
  readonly label?: string
  readonly layout?: 'chips' | 'list'
}): React.JSX.Element {
  return (
    <div className="rsui-presets" data-layout={layout} role="group" aria-label={label}>
      {presets.map(preset => (
        <button
          key={`${preset.label}-${preset.notation}`}
          type="button"
          className="rsui-preset"
          aria-pressed={roller.notation === preset.notation}
          title={layout === 'chips' ? (preset.description ?? preset.notation) : undefined}
          onClick={() => {
            roller.choose(preset)
          }}
        >
          {layout === 'list' ? (
            <>
              <code className="rsui-preset-notation">{preset.notation}</code>
              {preset.description !== undefined && (
                <span className="rsui-preset-desc">{preset.description}</span>
              )}
            </>
          ) : (
            preset.label
          )}
        </button>
      ))}
    </div>
  )
}
