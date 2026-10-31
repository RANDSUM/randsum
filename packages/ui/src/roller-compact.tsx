import type React from 'react'
import { useId, useState } from 'react'
import { DEFAULT_KEYS } from './keys'
import {
  KeyPad,
  NotationField,
  PresetList,
  Readout,
  RollButton,
  StatusLine,
  cx
} from './core/parts'
import type { RollerBaseProps } from './core/props'
import { useRoller } from './core/useRoller'

export type { RollResult } from './core/props'

export interface RollerCompactProps extends RollerBaseProps {
  /**
   * 'landscape' puts the readout beside the builder, 'portrait' above it, and
   * 'auto' (the default) picks by the roller's own width.
   */
  readonly orientation?: 'auto' | 'landscape' | 'portrait'
  /** 'chips' (the default) or 'list', which shows each preset's description. */
  readonly presetsLayout?: 'chips' | 'list'
  /** Shows "Open the full app" in the footer. */
  readonly appLink?: string
  /** Extra footer content, after the app link. */
  readonly footer?: React.ReactNode
}

/** A panel: the readout beside or above the input, Roll and the dice keys. */
export function RollerCompact({
  keys = DEFAULT_KEYS,
  presets,
  presetsLabel = 'Presets',
  presetsLayout = 'chips',
  placeholder,
  className,
  orientation = 'auto',
  appLink,
  footer,
  ...options
}: RollerCompactProps): React.JSX.Element {
  const roller = useRoller(options)
  const statusId = useId()
  const tabsId = useId()
  const [tab, setTab] = useState<'keys' | 'presets'>('keys')
  const hasPresets = presets !== undefined && presets.length > 0
  const showPresets = hasPresets && tab === 'presets'

  return (
    <div className={cx('rsui', 'rsui-compact', className)} data-orientation={orientation}>
      <div className="rsui-compact-body">
        <Readout roller={roller} />
        <div className="rsui-compact-builder">
          <div className="rsui-row">
            <NotationField
              roller={roller}
              statusId={statusId}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
            <RollButton roller={roller} />
          </div>
          <StatusLine id={statusId} check={roller.check} />
          {hasPresets && (
            <div className="rsui-tabs" role="tablist" aria-label="Build with">
              <button
                type="button"
                role="tab"
                id={`${tabsId}-keys`}
                className="rsui-tab"
                aria-selected={!showPresets}
                aria-controls={`${tabsId}-panel`}
                onClick={() => {
                  setTab('keys')
                }}
              >
                Dice keys
              </button>
              <button
                type="button"
                role="tab"
                id={`${tabsId}-presets`}
                className="rsui-tab"
                aria-selected={showPresets}
                aria-controls={`${tabsId}-panel`}
                onClick={() => {
                  setTab('presets')
                }}
              >
                {presetsLabel}
              </button>
            </div>
          )}
          <div
            id={`${tabsId}-panel`}
            className="rsui-compact-panel"
            {...(hasPresets
              ? {
                  role: 'tabpanel',
                  'aria-labelledby': `${tabsId}-${showPresets ? 'presets' : 'keys'}`
                }
              : {})}
          >
            {showPresets ? (
              <PresetList
                presets={presets ?? []}
                roller={roller}
                label={presetsLabel}
                layout={presetsLayout}
              />
            ) : (
              <KeyPad keys={keys} roller={roller} />
            )}
          </div>
        </div>
      </div>
      {(appLink !== undefined || footer !== undefined) && (
        <div className="rsui-compact-footer">
          {appLink !== undefined && (
            <a className="rsui-app-link" href={appLink}>
              Open the full app →
            </a>
          )}
          <span className="rsui-spacer" />
          {footer}
        </div>
      )}
    </div>
  )
}
