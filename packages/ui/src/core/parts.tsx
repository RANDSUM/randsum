import type React from 'react'
import { useId } from 'react'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { RollRecord } from '@randsum/roller'
import { traceRoll } from '@randsum/roller/trace'
import type { RollTraceStep } from '@randsum/roller/trace'
import type { Key } from '../keys'
import type { Preset } from '../presets'
import type { NotationCheck, RollResult } from './check'
import type { Roller } from './useRoller'

export const cx = (...names: readonly (string | false | undefined)[]): string =>
  names.filter(Boolean).join(' ')

/** Dice and steps have no identity but their order, so each gets an id from it. */
function withIds<T>(
  items: readonly T[],
  prefix: string
): readonly { readonly id: string; readonly item: T }[] {
  return items.map((item, n) => ({ id: `${prefix}${n}`, item }))
}

const MARKS = { empty: '', valid: '✓', invalid: '✕' } as const
const MARK_LABELS = { empty: 'Empty', valid: 'Valid', invalid: 'Invalid' } as const

export function NotationField({
  roller,
  statusId,
  placeholder = '4d6L'
}: {
  readonly roller: Roller
  readonly statusId: string
  readonly placeholder?: string
}): React.JSX.Element {
  const { notation, tokens, check } = roller
  return (
    <div className="rsui-field" data-state={check.kind}>
      <div className="rsui-field-stack">
        {tokens.length > 0 && (
          <div className="rsui-overlay" aria-hidden="true">
            {tokens.map(token => {
              const doc = NOTATION_DOCS[token.key]
              const style =
                doc === undefined
                  ? undefined
                  : ({
                      '--rsui-tok-dark': doc.color,
                      '--rsui-tok-light': doc.colorLight
                    } as React.CSSProperties)
              return (
                <span
                  key={token.start}
                  className={cx(
                    'rsui-tok',
                    doc !== undefined && 'rsui-tok--doc',
                    token.category === 'unknown' && 'rsui-tok--bad'
                  )}
                  style={style}
                >
                  {token.text}
                </span>
              )
            })}
          </div>
        )}
        <input
          className="rsui-input"
          type="text"
          value={notation}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Dice notation"
          aria-invalid={check.kind === 'invalid'}
          aria-describedby={statusId}
          onChange={event => {
            roller.edit(event.target.value)
          }}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              roller.roll()
            }
          }}
        />
      </div>
      {check.kind !== 'empty' && (
        <span className="rsui-mark" role="img" aria-label={MARK_LABELS[check.kind]}>
          {MARKS[check.kind]}
        </span>
      )}
    </div>
  )
}

export function RollButton({
  roller,
  tip = false
}: {
  readonly roller: Roller
  /** Shows the English description on hover and focus (Mini). */
  readonly tip?: boolean
}): React.JSX.Element {
  const { check } = roller
  const tipId = useId()
  const description = check.kind === 'valid' ? check.description : undefined
  const showTip = tip && description !== undefined
  return (
    <span className="rsui-roll-wrap">
      <button
        type="button"
        className="rsui-roll"
        disabled={check.kind !== 'valid'}
        onClick={roller.roll}
        aria-describedby={showTip ? tipId : undefined}
      >
        Roll
      </button>
      {showTip && (
        <span id={tipId} className="rsui-tip" role="tooltip">
          {description}
        </span>
      )}
    </span>
  )
}

export function StatusLine({
  id,
  check,
  hint = 'Type notation, or tap a key.',
  showValid = true
}: {
  readonly id: string
  readonly check: NotationCheck
  readonly hint?: string
  readonly showValid?: boolean
}): React.JSX.Element {
  const text =
    check.kind === 'empty'
      ? hint
      : check.kind === 'invalid'
        ? check.message
        : showValid
          ? check.description
          : ''
  return (
    <p id={id} className="rsui-status" data-state={check.kind} aria-live="polite">
      {text}
    </p>
  )
}

function isPressed(notation: string, key: Key): boolean | undefined {
  if (key.action.kind !== 'modifier') return undefined
  return notation.includes(key.action.text)
}

export function KeyPad({
  keys,
  roller,
  label = 'Dice keys'
}: {
  readonly keys: readonly Key[]
  readonly roller: Roller
  readonly label?: string
}): React.JSX.Element {
  return (
    <div className="rsui-keys" role="group" aria-label={label}>
      {keys.map(key => (
        <button
          key={`${key.action.kind}-${key.label}`}
          type="button"
          className="rsui-key"
          data-kind={key.action.kind}
          aria-pressed={isPressed(roller.notation, key)}
          title={key.title}
          onClick={() => {
            roller.press(key)
          }}
        >
          {key.label}
        </button>
      ))}
    </div>
  )
}

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

type DieVariant = 'kept' | 'removed' | 'added'

function dice(values: readonly number[], variant: DieVariant): React.JSX.Element[] {
  return withIds(values, variant).map(({ id, item }) => (
    <span key={id} className="rsui-die" data-variant={variant}>
      {item}
    </span>
  ))
}

function Step({
  step,
  label
}: {
  readonly step: RollTraceStep
  readonly label?: string
}): React.JSX.Element | null {
  if (step.kind === 'divider' || step.kind === 'finalRolls') return null
  if (step.kind === 'arithmetic') {
    return (
      <li className="rsui-step">
        <span className="rsui-step-label">{step.label}</span>
        <span className="rsui-step-math">{step.display}</span>
      </li>
    )
  }
  const replacements = step.replacements ?? []
  return (
    <li className="rsui-step">
      {label === undefined ? (
        <span className="rsui-step-label">{step.label}</span>
      ) : (
        <code className="rsui-step-label">{label}</code>
      )}
      <span className="rsui-dice">
        {withIds(replacements, 'r').map(({ id, item: r }) => (
          <span key={id} className="rsui-swap">
            <span className="rsui-die" data-variant="removed">
              {r.from}
            </span>
            <span aria-label="became">→</span>
            <span className="rsui-die" data-variant="added">
              {r.to}
            </span>
          </span>
        ))}
        {replacements.length === 0 && dice(step.removed, 'removed')}
        {replacements.length === 0 && dice(step.added, 'added')}
        {dice(step.unchanged, 'kept')}
      </span>
    </li>
  )
}

function visibleSteps(record: RollRecord): readonly RollTraceStep[] {
  return traceRoll(record).filter(step => step.kind !== 'divider' && step.kind !== 'finalRolls')
}

/** Every step of a roll: what was rolled, what changed, what was added. */
export function RollSteps({
  records
}: {
  readonly records: readonly RollRecord[]
}): React.JSX.Element {
  const multiPool = records.length > 1
  return (
    <div className="rsui-steps">
      {withIds(records, 'pool').map(({ id, item: record }) => {
        const steps = visibleSteps(record)
        const [only] = steps
        // A plain pool in a multi-pool roll is one row: its notation and its dice
        if (multiPool && steps.length === 1 && only !== undefined) {
          return (
            <ol key={id} className="rsui-pool">
              <Step step={only} label={record.notation} />
            </ol>
          )
        }
        return (
          <section key={id} className="rsui-pool-group" aria-label={record.notation}>
            {multiPool && (
              <h3 className="rsui-pool-heading">
                <code>{record.notation}</code>
                <span>{record.total}</span>
              </h3>
            )}
            <ol className="rsui-pool">
              {withIds(steps, 'step').map(step => (
                <Step key={step.id} step={step.item} />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}

const EMPTY_COPY = {
  empty: ['Your roll lands here', 'Every step is shown: what was rolled, dropped and added.'],
  valid: ['Ready to roll', 'Press Roll or Enter.'],
  invalid: ['Can’t roll that yet', 'Fix the notation and Roll comes back.']
} as const

/** The total and its steps, or what to do before there is one. */
export function Readout({
  roller,
  actions
}: {
  readonly roller: Roller
  readonly actions?: React.ReactNode
}): React.JSX.Element {
  const { result, check, notation } = roller
  if (result === null) {
    const [title, hint] = EMPTY_COPY[check.kind]
    return (
      <section className="rsui-readout" data-empty="" aria-label="Result">
        <p className="rsui-readout-title">{title}</p>
        <p className="rsui-readout-hint">{hint}</p>
      </section>
    )
  }
  return (
    <section
      className="rsui-readout"
      data-stale={result.notation === notation ? undefined : ''}
      aria-label="Result"
    >
      <ResultHead result={result} actions={actions} />
      <RollSteps records={result.records} />
    </section>
  )
}

function ResultHead({
  result,
  actions
}: {
  readonly result: RollResult
  readonly actions?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="rsui-result-head">
      <output className="rsui-total" aria-live="polite" aria-label={`Total ${result.total}`}>
        {result.total}
      </output>
      <span className="rsui-result-meta">
        <code className="rsui-result-notation">{result.notation}</code>
        <span className="rsui-result-desc">{result.description}</span>
      </span>
      {actions}
    </div>
  )
}
