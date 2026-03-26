import { useCallback, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { ModifierCategory, NotationDoc } from '@randsum/roller/docs'
import { useTheme } from './useTheme'
import { tokenColor } from './tokenColor'
import { NumericStepper } from './NumericStepper'

import type { QuickReferenceGridProps } from './types'

// ---- Theme tokens ----

const TOKENS = {
  dark: {
    text: '#fafafa',
    textMuted: '#a1a1aa',
    textDim: '#71717a',
    surface: '#18181b',
    surfaceAlt: '#27272a',
    border: '#3f3f46',
    accent: '#a855f7',
    backdrop: 'rgba(0, 0, 0, 0.6)'
  },
  light: {
    text: '#18181b',
    textMuted: '#3f3f46',
    textDim: '#71717a',
    surface: '#f4f4f5',
    surfaceAlt: '#e4e4e7',
    border: '#a1a1aa',
    accent: '#9333ea',
    backdrop: 'rgba(255, 255, 255, 0.6)'
  }
}

// ---- Builder type system ----

type BuilderType =
  | { readonly kind: 'dice' }
  | { readonly kind: 'no-arg'; readonly fragment: string }
  | { readonly kind: 'number'; readonly prefix: string; readonly actual: string }
  | { readonly kind: 'condition'; readonly prefix: string; readonly actual: string }

const NUMBER_KEYS = new Set(['K', 'KL', 'KM', '+', '-', '*', '//', '%', '**', 'ms{..}'])
const CONDITION_KEYS = new Set([
  'R{..}',
  'ro{..}',
  'C{..}',
  'V{..}',
  'D{..}',
  '#{..}',
  'S{..}',
  'F{..}',
  '!s{..}'
])
const DICE_SIDES_KEYS = new Set(['gN', 'DDN', 'zN'])

function getBuilderType(doc: NotationDoc): BuilderType {
  if (doc.key === 'xDN') return { kind: 'dice' }
  if (DICE_SIDES_KEYS.has(doc.key)) {
    const prefix = doc.displayBase.replace('N', '')
    return { kind: 'number', prefix, actual: prefix }
  }
  if (NUMBER_KEYS.has(doc.key)) {
    const actual = doc.key === '-' ? '-' : doc.key === 'ms{..}' ? 'ms' : doc.key
    return { kind: 'number', prefix: doc.displayBase, actual }
  }
  if (CONDITION_KEYS.has(doc.key)) {
    const actual = doc.key.replace('{..}', '')
    return { kind: 'condition', prefix: doc.displayBase.replace('{..}', ''), actual }
  }
  return { kind: 'no-arg', fragment: doc.key === 'sort' ? 'sa' : doc.key }
}

function canAddModifier(notation: string | undefined, doc: NotationDoc): boolean {
  if (doc.category === 'Core' || doc.category === 'Special') return true
  if (notation === undefined || notation.length === 0) return false
  return /\d*d[\d%F{]/i.test(notation)
}

// ---- Category ordering ----

const CATEGORY_ORDER: readonly ModifierCategory[] = [
  'Core',
  'Special',
  'Filter',
  'Generate',
  'Accumulate',
  'Substitute',
  'Clamp',
  'Map',
  'Reinterpret',
  'Scale',
  'Order',
  'Dispatch'
]

const CATEGORY_LABELS: Readonly<Record<ModifierCategory, string>> = {
  Core: 'CORE DICE',
  Special: 'SPECIAL DICE',
  Filter: 'FILTER',
  Generate: 'GENERATE',
  Accumulate: 'ACCUMULATE',
  Substitute: 'SUBSTITUTE',
  Clamp: 'CLAMP',
  Map: 'MAP',
  Reinterpret: 'REINTERPRET',
  Scale: 'SCALE',
  Order: 'ORDER',
  Dispatch: 'DISPATCH'
}

function groupByCategory(): ReadonlyMap<ModifierCategory, readonly NotationDoc[]> {
  const groups = new Map<ModifierCategory, NotationDoc[]>()
  for (const doc of Object.values(NOTATION_DOCS)) {
    const existing = groups.get(doc.category)
    if (existing) {
      existing.push(doc)
    } else {
      groups.set(doc.category, [doc])
    }
  }
  return groups
}

// ---- Styles ----

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  entryKey: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    minWidth: 60
  },
  entryTitle: {
    fontSize: 13,
    flex: 1
  },
  entryChevron: {
    fontSize: 16,
    fontWeight: '300'
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start'
  },
  modalKeyBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50
  },
  modalKeyText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28
  },
  modalTitleWrap: {
    flex: 1,
    gap: 2
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 15
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 19
  },
  modalClose: {
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  modalCloseText: {
    fontSize: 20,
    lineHeight: 22
  },
  modalBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8
  },
  sectionLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingVertical: 1
  },
  docCode: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13
  },
  docNote: {
    fontSize: 13,
    flex: 1
  },
  builderContainer: {
    padding: 14,
    gap: 6
  },
  builderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  addButtonText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    fontWeight: '600'
  },
  disabledHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4
  },
  prefixText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    fontWeight: '600'
  },
  operatorRow: {
    flexDirection: 'row',
    gap: 4
  },
  operatorButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1
  },
  operatorText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    fontWeight: '600'
  },
  separatorText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14
  }
})

// ---- Builder components ----

const OPERATORS = ['<', '>', '=', '<=', '>='] as const

function DiceBuilder({
  accentColor,
  onAdd
}: {
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const [quantity, setQuantity] = useState(1)
  const [sides, setSides] = useState(6)
  const preview = `${quantity}d${sides}`

  return (
    <View style={styles.builderRow}>
      <NumericStepper
        value={quantity}
        onValueChange={setQuantity}
        min={1}
        max={99}
        accentColor={accentColor}
      />
      <Text style={[styles.separatorText, { color: tokens.textDim }]}>{'d'}</Text>
      <NumericStepper
        value={sides}
        onValueChange={setSides}
        min={2}
        max={100}
        accentColor={accentColor}
      />
      <Pressable
        style={[styles.addButton, { backgroundColor: accentColor }]}
        onPress={() => onAdd(preview)}
        accessibilityLabel={`Add ${preview}`}
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: '#fff' }]}>{`Add ${preview}`}</Text>
      </Pressable>
    </View>
  )
}

function NumberBuilder({
  builder,
  accentColor,
  onAdd,
  disabled
}: {
  readonly builder: { readonly prefix: string; readonly actual: string }
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const [value, setValue] = useState(1)
  const preview = `${builder.actual}${value}`

  return (
    <View style={styles.builderRow}>
      <Text style={[styles.prefixText, { color: accentColor }]}>{builder.prefix}</Text>
      <NumericStepper
        value={value}
        onValueChange={setValue}
        min={1}
        max={99}
        accentColor={accentColor}
      />
      <Pressable
        style={[styles.addButton, { backgroundColor: disabled ? tokens.surfaceAlt : accentColor }]}
        onPress={() => {
          if (!disabled) onAdd(preview)
        }}
        disabled={disabled}
        accessibilityLabel={`Add ${preview}`}
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: disabled ? tokens.textDim : '#fff' }]}>
          {`Add ${preview}`}
        </Text>
      </Pressable>
    </View>
  )
}

function ConditionBuilder({
  builder,
  accentColor,
  onAdd,
  disabled
}: {
  readonly builder: { readonly prefix: string; readonly actual: string }
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const [op, setOp] = useState<string>('<')
  const [value, setValue] = useState(3)
  const preview = `${builder.actual}{${op}${value}}`

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.builderRow}>
        <Text style={[styles.prefixText, { color: accentColor }]}>{`${builder.prefix}{`}</Text>
        <View style={styles.operatorRow}>
          {OPERATORS.map(o => {
            const isActive = op === o
            return (
              <Pressable
                key={o}
                style={[
                  styles.operatorButton,
                  {
                    backgroundColor: isActive ? accentColor : tokens.surface,
                    borderColor: isActive ? accentColor : tokens.border
                  }
                ]}
                onPress={() => setOp(o)}
                accessibilityLabel={`Operator ${o}`}
                accessibilityRole="button"
              >
                <Text style={[styles.operatorText, { color: isActive ? '#fff' : tokens.text }]}>
                  {o}
                </Text>
              </Pressable>
            )
          })}
        </View>
        <NumericStepper
          value={value}
          onValueChange={setValue}
          min={1}
          max={99}
          accentColor={accentColor}
        />
        <Text style={[styles.prefixText, { color: accentColor }]}>{'}'}</Text>
      </View>
      <Pressable
        style={[styles.addButton, { backgroundColor: disabled ? tokens.surfaceAlt : accentColor }]}
        onPress={() => {
          if (!disabled) onAdd(preview)
        }}
        disabled={disabled}
        accessibilityLabel={`Add ${preview}`}
        accessibilityRole="button"
      >
        <Text style={[styles.addButtonText, { color: disabled ? tokens.textDim : '#fff' }]}>
          {`Add ${preview}`}
        </Text>
      </Pressable>
    </View>
  )
}

function NoArgBuilder({
  fragment,
  accentColor,
  onAdd,
  disabled
}: {
  readonly fragment: string
  readonly accentColor: string
  readonly onAdd: (fragment: string) => void
  readonly disabled: boolean
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]

  return (
    <Pressable
      style={[styles.addButton, { backgroundColor: disabled ? tokens.surfaceAlt : accentColor }]}
      onPress={() => {
        if (!disabled) onAdd(fragment)
      }}
      disabled={disabled}
      accessibilityLabel={`Add ${fragment}`}
      accessibilityRole="button"
    >
      <Text style={[styles.addButtonText, { color: disabled ? tokens.textDim : '#fff' }]}>
        {`Add ${fragment}`}
      </Text>
    </Pressable>
  )
}

// ---- DocModal ----

function DocModal({
  doc,
  accentColor,
  notation,
  onClose,
  onAdd
}: {
  readonly doc: NotationDoc
  readonly accentColor: string
  readonly notation: string | undefined
  readonly onClose: () => void
  readonly onAdd: (fragment: string) => void
}): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const builder = getBuilderType(doc)
  const canAdd = canAddModifier(notation, doc)

  const handleAdd = useCallback(
    (fragment: string) => {
      onAdd(fragment)
    },
    [onAdd]
  )

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.modalBackdrop, { backgroundColor: tokens.backdrop }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modalContent,
            {
              backgroundColor: tokens.surface,
              borderColor: `${accentColor}66`
            }
          ]}
          onPress={() => {}}
        >
          <ScrollView bounces={false}>
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomWidth: 1, borderBottomColor: tokens.border }
              ]}
            >
              <View style={[styles.modalKeyBadge, { borderColor: `${accentColor}40` }]}>
                <Text style={[styles.modalKeyText, { color: accentColor }]}>{doc.displayBase}</Text>
              </View>
              <View style={styles.modalTitleWrap}>
                <Text style={[styles.modalTitle, { color: tokens.text }]}>{doc.title}</Text>
                <Text style={[styles.modalDescription, { color: tokens.textMuted }]}>
                  {doc.description}
                </Text>
              </View>
              <Pressable
                style={styles.modalClose}
                onPress={onClose}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Text style={[styles.modalCloseText, { color: tokens.textDim }]}>{'\u00D7'}</Text>
              </Pressable>
            </View>

            {/* Forms + Comparisons + Examples */}
            <View style={styles.modalBody}>
              <Text style={[styles.sectionLabel, { color: tokens.textDim }]}>{'Forms'}</Text>
              {doc.forms.map((form, i) => (
                <View key={i} style={styles.docRow}>
                  <Text style={[styles.docCode, { color: accentColor }]}>{form.notation}</Text>
                  <Text style={[styles.docNote, { color: tokens.textDim }]}>{form.note}</Text>
                </View>
              ))}

              {doc.comparisons !== undefined && doc.comparisons.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: tokens.textDim, marginTop: 6 }]}>
                    {'Operators'}
                  </Text>
                  {doc.comparisons.map((c, i) => (
                    <View key={i} style={styles.docRow}>
                      <Text style={[styles.docCode, { color: accentColor }]}>{c.operator}</Text>
                      <Text style={[styles.docNote, { color: tokens.textDim }]}>{c.note}</Text>
                    </View>
                  ))}
                </>
              )}

              <Text style={[styles.sectionLabel, { color: tokens.textDim, marginTop: 6 }]}>
                {'Examples'}
              </Text>
              {doc.examples.map((ex, i) => (
                <View key={i} style={styles.docRow}>
                  <Text style={[styles.docCode, { color: accentColor }]}>{ex.notation}</Text>
                  <Text style={[styles.docNote, { color: tokens.textDim }]}>{ex.description}</Text>
                </View>
              ))}
            </View>

            {/* Builder */}
            <View
              style={[
                styles.builderContainer,
                {
                  borderTopWidth: 1,
                  borderTopColor: tokens.border,
                  backgroundColor: tokens.surfaceAlt
                }
              ]}
            >
              <Text style={[styles.sectionLabel, { color: tokens.textDim }]}>
                {'Add to notation'}
              </Text>
              {builder.kind === 'dice' && (
                <DiceBuilder accentColor={accentColor} onAdd={handleAdd} />
              )}
              {builder.kind === 'number' && (
                <NumberBuilder
                  builder={builder}
                  accentColor={accentColor}
                  onAdd={handleAdd}
                  disabled={!canAdd}
                />
              )}
              {builder.kind === 'condition' && (
                <ConditionBuilder
                  builder={builder}
                  accentColor={accentColor}
                  onAdd={handleAdd}
                  disabled={!canAdd}
                />
              )}
              {builder.kind === 'no-arg' && (
                <NoArgBuilder
                  fragment={builder.fragment}
                  accentColor={accentColor}
                  onAdd={handleAdd}
                  disabled={!canAdd}
                />
              )}
              {!canAdd && doc.category !== 'Core' && doc.category !== 'Special' && (
                <Text style={[styles.disabledHint, { color: tokens.textDim }]}>
                  {'Enter a dice expression first'}
                </Text>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ---- Entry row ----

function EntryRow({
  doc,
  theme,
  onSelect,
  isOdd,
  side
}: {
  readonly doc: NotationDoc
  readonly theme: 'light' | 'dark'
  readonly onSelect: (key: string) => void
  readonly isOdd: boolean
  readonly side?: 'left' | 'right'
}): React.JSX.Element {
  const tokens = TOKENS[theme]
  const accentColor = tokenColor(doc, theme) ?? tokens.accent
  const isRight = side === 'right'
  const isPaired = side !== undefined

  return (
    <Pressable
      style={[
        isPaired ? pairedStyles.entry : styles.entryRow,
        { backgroundColor: isOdd ? `${tokens.surfaceAlt}66` : 'transparent' },
        isRight ? pairedStyles.entryRight : undefined
      ]}
      onPress={() => onSelect(doc.key)}
      accessibilityLabel={`${doc.displayBase} - ${doc.title}`}
      accessibilityRole="button"
    >
      {isRight ? (
        <>
          <Text
            style={[styles.entryTitle, { color: tokens.textMuted, textAlign: 'right' }]}
            numberOfLines={1}
          >
            {doc.title}
          </Text>
          <Text style={[styles.entryKey, { color: accentColor, textAlign: 'right' }]}>
            {doc.displayBase}
          </Text>
          <Text style={[styles.entryChevron, { color: tokens.textDim }]}>{'\u203A'}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.entryChevron, { color: tokens.textDim }]}>{'\u2039'}</Text>
          <Text style={[styles.entryKey, { color: accentColor }]}>{doc.displayBase}</Text>
          <Text style={[styles.entryTitle, { color: tokens.textMuted }]} numberOfLines={1}>
            {doc.title}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const pairedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row'
  },
  entry: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8
  },
  entryRight: {}
})

// ---- Section header ----

function SectionHeader({
  label,
  color,
  theme
}: {
  readonly label: string
  readonly color: string
  readonly theme: 'light' | 'dark'
}): React.JSX.Element {
  const tokens = TOKENS[theme]

  return (
    <View
      style={[
        styles.sectionHeader,
        {
          backgroundColor: tokens.surfaceAlt,
          borderBottomWidth: 1,
          borderBottomColor: tokens.border
        }
      ]}
    >
      <View style={[styles.sectionDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionTitle, { color: tokens.textDim }]}>{label}</Text>
    </View>
  )
}

// ---- Main component ----

type PairedItem =
  | { readonly kind: 'single'; readonly doc: NotationDoc }
  | { readonly kind: 'pair'; readonly left: NotationDoc; readonly right: NotationDoc }

interface SectionData {
  readonly category: ModifierCategory
  readonly color: string
  readonly data: readonly PairedItem[]
  readonly isMulti: boolean
}

export function QuickReferenceGrid({
  onAdd,
  notation,
  inverted: isInverted = false
}: QuickReferenceGridProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = TOKENS[theme]
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const sections: readonly SectionData[] = useMemo(() => {
    const groups = groupByCategory()
    const result: SectionData[] = []
    for (const cat of CATEGORY_ORDER) {
      const docs = groups.get(cat)
      if (docs !== undefined && docs.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const sampleColor = tokenColor(docs[0]!, theme) ?? tokens.accent
        const isMulti = docs.length > 1
        const paired: PairedItem[] = []
        if (isMulti) {
          for (let i = 0; i < docs.length; i += 2) {
            const left = docs[i]!
            const right = docs[i + 1]
            if (right !== undefined) {
              paired.push({ kind: 'pair', left, right })
            } else {
              paired.push({ kind: 'single', doc: left })
            }
          }
        } else {
          paired.push({ kind: 'single', doc: docs[0]! })
        }
        result.push({
          category: cat,
          color: sampleColor,
          data: isInverted ? paired.reverse() : paired,
          isMulti
        })
      }
    }
    return result
  }, [theme, isInverted])

  const selectedDoc = selectedKey !== null ? (NOTATION_DOCS[selectedKey] ?? null) : null
  const selectedAccent =
    selectedDoc !== null ? (tokenColor(selectedDoc, theme) ?? tokens.accent) : tokens.accent

  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedKey(null)
  }, [])

  const handleAdd = useCallback(
    (fragment: string) => {
      onAdd(fragment)
      setSelectedKey(null)
    },
    [onAdd]
  )

  return (
    <View style={styles.container}>
      <SectionList
        sections={
          sections as unknown as readonly {
            category: string
            color: string
            data: PairedItem[]
            isMulti: boolean
          }[]
        }
        keyExtractor={item =>
          item.kind === 'single' ? item.doc.key : `${item.left.key}-${item.right.key}`
        }
        renderSectionHeader={
          isInverted
            ? () => null
            : ({ section }) => {
                const s = section as unknown as SectionData
                return (
                  <SectionHeader
                    label={CATEGORY_LABELS[s.category]}
                    color={s.color}
                    theme={theme}
                  />
                )
              }
        }
        renderSectionFooter={
          isInverted
            ? ({ section }) => {
                const s = section as unknown as SectionData
                return (
                  <SectionHeader
                    label={CATEGORY_LABELS[s.category]}
                    color={s.color}
                    theme={theme}
                  />
                )
              }
            : undefined
        }
        renderItem={({ item, index, section }) => {
          const s = section as unknown as SectionData
          if (item.kind === 'single') {
            return (
              <EntryRow
                doc={item.doc}
                theme={theme}
                onSelect={handleSelect}
                isOdd={index % 2 === 1}
              />
            )
          }
          return (
            <View style={pairedStyles.row}>
              <EntryRow
                doc={item.left}
                theme={theme}
                onSelect={handleSelect}
                isOdd={index % 2 === 0}
                side="left"
              />
              <EntryRow
                doc={item.right}
                theme={theme}
                onSelect={handleSelect}
                isOdd={index % 2 === 1}
                side="right"
              />
            </View>
          )
        }}
        stickySectionHeadersEnabled={false}
        inverted={isInverted}
      />

      {selectedDoc !== null && (
        <DocModal
          doc={selectedDoc}
          accentColor={selectedAccent}
          notation={notation}
          onClose={handleClose}
          onAdd={handleAdd}
        />
      )}
    </View>
  )
}
