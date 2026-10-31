import type React from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { DEFAULT_KEYS } from './keys'
import type { RollResult } from './core/check'
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

export interface HistoryEntry {
  readonly id: number
  readonly notation: string
  readonly total: number
  readonly description: string
}

export interface RollerMaxProps extends RollerBaseProps {
  /** Recent rolls beside the readout and a History dialog. Defaults to true. */
  readonly history?: boolean
  /** localStorage key that keeps history across visits. Omit to keep it in memory. */
  readonly storageKey?: string
  /** How many rolls history keeps. Defaults to 50. */
  readonly historyLimit?: number
}

const RECENT = 3

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry: Record<string, unknown> = { ...value }
  return (
    typeof entry['id'] === 'number' &&
    typeof entry['notation'] === 'string' &&
    typeof entry['total'] === 'number' &&
    typeof entry['description'] === 'string'
  )
}

function loadHistory(storageKey: string | undefined): readonly HistoryEntry[] {
  if (storageKey === undefined) return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry) : []
  } catch {
    return []
  }
}

function saveHistory(storageKey: string | undefined, history: readonly HistoryEntry[]): void {
  if (storageKey === undefined) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(history))
  } catch {
    // Private mode or a full quota: history just doesn't persist
  }
}

function HistoryRow({
  entry,
  onPick
}: {
  readonly entry: HistoryEntry
  readonly onPick: (entry: HistoryEntry) => void
}): React.JSX.Element {
  return (
    <li>
      <button
        type="button"
        className="rsui-history-item"
        aria-label={`Roll ${entry.notation} again (last total ${entry.total})`}
        onClick={() => {
          onPick(entry)
        }}
      >
        <code className="rsui-history-notation">{entry.notation}</code>
        <span className="rsui-history-desc">{entry.description}</span>
        <span className="rsui-history-total">{entry.total}</span>
      </button>
    </li>
  )
}

/** The full roller: builder, readout, recent rolls and history. */
export function RollerMax({
  keys = DEFAULT_KEYS,
  presets,
  presetsLabel = 'Presets',
  placeholder,
  className,
  history: showHistory = true,
  storageKey,
  historyLimit = 50,
  onRoll,
  ...options
}: RollerMaxProps): React.JSX.Element {
  const [history, setHistory] = useState<readonly HistoryEntry[]>([])
  const dialogRef = useRef<HTMLDialogElement>(null)
  const statusId = useId()
  const titleId = useId()

  useEffect(() => {
    setHistory(loadHistory(storageKey))
  }, [storageKey])

  const record = useCallback(
    (result: RollResult) => {
      onRoll?.(result)
      if (!showHistory) return
      setHistory(previous => {
        const entry: HistoryEntry = {
          id: Date.now(),
          notation: result.notation,
          total: result.total,
          description: result.description
        }
        const updated = [entry, ...previous].slice(0, historyLimit)
        saveHistory(storageKey, updated)
        return updated
      })
    },
    [onRoll, showHistory, historyLimit, storageKey]
  )

  const roller = useRoller({ ...options, onRoll: record })

  const again = useCallback(
    (entry: HistoryEntry) => {
      dialogRef.current?.close?.()
      roller.choose({ label: entry.notation, notation: entry.notation })
    },
    [roller]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory(storageKey, [])
  }, [storageKey])

  return (
    <div className={cx('rsui', 'rsui-max', className)}>
      <div className="rsui-max-grid">
        <section className="rsui-max-builder" aria-label="Build a roll">
          <div className="rsui-row">
            <NotationField
              roller={roller}
              statusId={statusId}
              {...(placeholder === undefined ? {} : { placeholder })}
            />
            <RollButton roller={roller} />
          </div>
          <StatusLine id={statusId} check={roller.check} />
          <KeyPad keys={keys} roller={roller} />
          {presets !== undefined && presets.length > 0 && (
            <div className="rsui-max-presets">
              <p className="rsui-pop-label">{presetsLabel}</p>
              <PresetList presets={presets} roller={roller} label={presetsLabel} />
            </div>
          )}
        </section>

        <Readout
          roller={roller}
          actions={
            roller.result !== null && (
              <button
                type="button"
                className="rsui-quiet-button"
                onClick={() => {
                  const last = roller.result
                  if (last !== null)
                    roller.choose({ label: last.notation, notation: last.notation })
                }}
              >
                Roll again
              </button>
            )
          }
        />

        {showHistory && (
          <section className="rsui-recent" aria-label="Recent rolls">
            <div className="rsui-recent-head">
              <h2 className="rsui-recent-title">Recent</h2>
              <button
                type="button"
                className="rsui-quiet-button"
                aria-haspopup="dialog"
                onClick={() => {
                  dialogRef.current?.showModal?.()
                }}
              >
                History
              </button>
            </div>
            {history.length === 0 ? (
              <p className="rsui-recent-empty">Your rolls land here. Tap one to roll it again.</p>
            ) : (
              <ol className="rsui-history-list">
                {history.slice(0, RECENT).map(entry => (
                  <HistoryRow key={entry.id} entry={entry} onPick={again} />
                ))}
              </ol>
            )}
            <dialog
              ref={dialogRef}
              className="rsui rsui-history"
              aria-labelledby={titleId}
              onClick={event => {
                // A click on the backdrop lands on the dialog itself
                if (event.target === event.currentTarget) event.currentTarget.close()
              }}
            >
              <div className="rsui-recent-head">
                <h2 id={titleId} className="rsui-recent-title">
                  History
                </h2>
                {history.length > 0 && (
                  <button type="button" className="rsui-quiet-button" onClick={clearHistory}>
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className="rsui-quiet-button"
                  onClick={() => {
                    dialogRef.current?.close?.()
                  }}
                >
                  Done
                </button>
              </div>
              {history.length === 0 ? (
                <p className="rsui-recent-empty">Your rolls land here. Tap one to roll it again.</p>
              ) : (
                <ol className="rsui-history-list">
                  {history.map(entry => (
                    <HistoryRow key={entry.id} entry={entry} onPick={again} />
                  ))}
                </ol>
              )}
            </dialog>
          </section>
        )}
      </div>
    </div>
  )
}
