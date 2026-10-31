import type React from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { DEFAULT_KEYS } from './keys'
import { KeyPad } from './key-pad'
import { NotationField } from './notation-field'
import { PresetList } from './preset-list'
import { RollButton } from './roll-button'
import { RollSteps } from './roll-steps'
import { StatusLine } from './status-line'
import { cx } from './internal/cx'
import type { RollerBaseProps } from './internal/props'
import { useRoller } from './use-roller'

export type { RollResult } from './internal/props'

export interface RollerMiniProps extends RollerBaseProps {
  /** A link to the full roller, shown at the end of the hint line. */
  readonly appLink?: string
}

function DieGlyph(): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 100 100" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
      />
      <circle cx="32" cy="32" r="8" fill="currentColor" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      <circle cx="68" cy="68" r="8" fill="currentColor" />
    </svg>
  )
}

/** One row: a dice-keys button, the notation, Roll, and the total once rolled. */
export function RollerMini({
  keys = DEFAULT_KEYS,
  presets,
  presetsLabel = 'Presets',
  placeholder,
  className,
  appLink,
  ...options
}: RollerMiniProps): React.JSX.Element {
  const roller = useRoller(options)
  const statusId = useId()
  const padId = useId()
  const detailId = useId()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const { result } = roller
  const fresh = result !== null && result.notation === roller.notation

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent): void => {
      if (event.target instanceof Node && anchorRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className={cx('rsui', 'rsui-mini', className)}>
      <div className="rsui-mini-row">
        <span className="rsui-anchor" ref={anchorRef}>
          <button
            type="button"
            className="rsui-keys-toggle"
            aria-label="Dice keys"
            aria-expanded={open}
            aria-controls={padId}
            onClick={() => {
              setOpen(current => !current)
            }}
          >
            <DieGlyph />
          </button>
          {open && (
            <div id={padId} className="rsui-pop rsui-pop--keys" role="group" aria-label="Dice keys">
              <KeyPad keys={keys} roller={roller} />
              {presets !== undefined && presets.length > 0 && (
                <div className="rsui-pop-presets">
                  <p className="rsui-pop-label">{presetsLabel}</p>
                  <PresetList presets={presets} roller={roller} label={presetsLabel} />
                </div>
              )}
            </div>
          )}
        </span>
        <NotationField
          roller={roller}
          statusId={statusId}
          {...(placeholder === undefined ? {} : { placeholder })}
        />
        <RollButton roller={roller} tip />
        {result !== null && (
          <span className="rsui-anchor rsui-mini-total-wrap">
            <button
              type="button"
              className="rsui-mini-total"
              data-stale={fresh ? undefined : ''}
              aria-describedby={detailId}
              aria-label={`Total ${result.total}`}
            >
              {result.total}
            </button>
            <span id={detailId} className="rsui-pop rsui-pop--detail" role="tooltip">
              <RollSteps records={result.records} />
            </span>
          </span>
        )}
      </div>
      <div className="rsui-mini-foot">
        <StatusLine
          id={statusId}
          check={roller.check}
          hint="Type notation, or open the dice keys."
          showValid={fresh}
        />
        {appLink !== undefined && (
          <a className="rsui-app-link" href={appLink}>
            Open in the Roller
          </a>
        )}
      </div>
    </div>
  )
}
