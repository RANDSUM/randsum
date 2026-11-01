// The native components' styles, built once per theme: the same look as
// styles.css, in React Native's StyleSheet. Not a public entry.
import { StyleSheet } from 'react-native'
import type { TextStyle } from 'react-native'
import { useRollerTheme } from '../../native/theme'
import type { RollerTheme } from '../../native/theme'

type StyleName =
  | 'text'
  | 'mono'
  | 'panel'
  | 'row'
  | 'grow'
  | 'spacer'
  | 'field'
  | 'fieldValid'
  | 'fieldInvalid'
  | 'input'
  | 'tokenBad'
  | 'mark'
  | 'markValid'
  | 'markInvalid'
  | 'roll'
  | 'rollDisabled'
  | 'rollText'
  | 'rollTextDisabled'
  | 'pressed'
  | 'status'
  | 'statusInvalid'
  | 'keys'
  | 'key'
  | 'keyOn'
  | 'keyText'
  | 'keyDieText'
  | 'presets'
  | 'presetsList'
  | 'preset'
  | 'presetRow'
  | 'presetText'
  | 'presetNotation'
  | 'presetDesc'
  | 'readout'
  | 'stale'
  | 'readoutTitle'
  | 'readoutHint'
  | 'resultHead'
  | 'total'
  | 'totalMax'
  | 'resultMeta'
  | 'resultNotation'
  | 'resultDesc'
  | 'steps'
  | 'poolGroup'
  | 'poolHeading'
  | 'poolHeadingText'
  | 'step'
  | 'stepLabel'
  | 'stepLabelMono'
  | 'stepMath'
  | 'dice'
  | 'swap'
  | 'die'
  | 'dieRemoved'
  | 'dieAdded'
  | 'dieText'
  | 'dieTextRemoved'
  | 'arrow'
  | 'quiet'
  | 'quietText'
  | 'tabs'
  | 'tab'
  | 'tabOn'
  | 'tabText'
  | 'tabTextOn'
  | 'link'
  | 'footer'
  | 'miniKeys'
  | 'builder'
  | 'overlay'
  | 'scrim'
  | 'scrimTap'
  | 'card'
  | 'cardActions'
  | 'recentHead'
  | 'recentTitle'
  | 'recentEmpty'
  | 'historyItem'
  | 'historyText'
  | 'historyTotal'
  | 'sheet'

/** Every style is a TextStyle, which a View accepts too. */
export type RollerStyles = Readonly<Record<StyleName, TextStyle>>

function build(t: RollerTheme): RollerStyles {
  const text = { color: t.ink, fontFamily: t.font } as const
  const mono = { color: t.ink, fontFamily: t.fontMono } as const
  const quiet = {
    minHeight: 40,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: t.radiusMd,
    backgroundColor: t.raised,
    alignItems: 'center',
    justifyContent: 'center'
  } as const
  return StyleSheet.create({
    text,
    mono,
    panel: {
      gap: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: t.radiusXl,
      backgroundColor: t.bg
    },
    row: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    grow: { flexGrow: 1, flexShrink: 1, minWidth: 0 },
    spacer: { flexGrow: 1 },

    field: {
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      minHeight: 52,
      paddingHorizontal: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: t.radiusLg,
      backgroundColor: t.surface
    },
    fieldValid: { borderColor: t.valid },
    fieldInvalid: { borderColor: t.invalid },
    input: {
      ...mono,
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      paddingVertical: 8,
      fontSize: t.textInput,
      fontWeight: '500'
    },
    tokenBad: { textDecorationLine: 'underline', textDecorationColor: t.invalid },
    mark: { fontSize: t.textMd, fontWeight: '700' },
    markValid: { color: t.valid },
    markInvalid: { color: t.invalid },

    roll: {
      minWidth: 96,
      minHeight: 52,
      paddingHorizontal: 20,
      borderRadius: t.radiusLg,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center'
    },
    rollDisabled: { backgroundColor: t.disabledBg },
    rollText: { color: t.onAccent, fontFamily: t.font, fontSize: t.textMd, fontWeight: '700' },
    rollTextDisabled: { color: t.disabledInk },
    pressed: { opacity: 0.7 },

    status: { ...text, color: t.muted, fontSize: t.textSm, minHeight: 20 },
    statusInvalid: { color: t.invalid },

    keys: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    key: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 88,
      minHeight: 44,
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: t.radiusMd,
      backgroundColor: t.raised,
      alignItems: 'center',
      justifyContent: 'center'
    },
    keyOn: { borderColor: t.accent, backgroundColor: t.addedBg },
    keyText: { ...text, fontSize: t.textSm, fontWeight: '600', textAlign: 'center' },
    keyDieText: { fontSize: t.textBase },

    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    presetsList: { flexDirection: 'column', flexWrap: 'nowrap' },
    preset: {
      flexGrow: 1,
      flexShrink: 1,
      minHeight: 36,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: t.radiusMd,
      backgroundColor: t.raised,
      alignItems: 'center',
      justifyContent: 'center'
    },
    presetRow: { alignItems: 'flex-start', gap: 2, paddingVertical: 8 },
    presetText: { ...text, fontSize: t.textSm, fontWeight: '600' },
    presetNotation: { ...mono, fontSize: t.textSm, fontWeight: '600' },
    presetDesc: { ...text, color: t.muted, fontSize: t.textXs },

    readout: {
      gap: 12,
      padding: 16,
      borderRadius: t.radiusLg,
      backgroundColor: t.surface
    },
    stale: { opacity: 0.55 },
    readoutTitle: { ...text, fontSize: t.textMd, fontWeight: '700' },
    readoutHint: { ...text, color: t.muted, fontSize: t.textSm },
    resultHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
    total: {
      ...text,
      fontSize: t.totalCompact,
      lineHeight: t.totalCompact,
      fontWeight: '800',
      fontVariant: ['tabular-nums']
    },
    totalMax: { fontSize: t.totalMax, lineHeight: t.totalMax },
    // minWidth, not just flexBasis: Yoga shrinks a flex item before it wraps,
    // so without it a beside-the-total action squeezes the description
    resultMeta: { flexGrow: 1, flexShrink: 1, flexBasis: 160, minWidth: 160, gap: 2 },
    resultNotation: { ...mono, fontSize: t.textBase, fontWeight: '600' },
    resultDesc: { ...text, color: t.muted, fontSize: t.textSm },

    steps: { gap: 12 },
    poolGroup: { gap: 6 },
    poolHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    poolHeadingText: { ...mono, fontSize: t.textSm, fontWeight: '700' },
    step: { gap: 6 },
    stepLabel: { ...text, color: t.muted, fontSize: t.textXs, fontWeight: '600' },
    stepLabelMono: { fontFamily: t.fontMono },
    stepMath: { ...mono, fontSize: t.textBase },
    dice: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
    swap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    die: {
      minWidth: 36,
      height: 36,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: t.borderStrong,
      borderRadius: t.radiusMd,
      backgroundColor: t.raised,
      alignItems: 'center',
      justifyContent: 'center'
    },
    dieRemoved: { borderStyle: 'dashed', backgroundColor: 'transparent' },
    dieAdded: { borderWidth: 2, borderColor: t.accent, backgroundColor: t.addedBg },
    dieText: { ...text, fontSize: t.textMd, fontWeight: '600', fontVariant: ['tabular-nums'] },
    dieTextRemoved: { color: t.faint, fontWeight: '400', textDecorationLine: 'line-through' },
    arrow: { ...text, color: t.muted },

    quiet,
    quietText: { ...text, fontSize: t.textSm, fontWeight: '600' },
    tabs: {
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      borderRadius: t.radiusMd,
      backgroundColor: t.subtle
    },
    tab: {
      flexGrow: 1,
      minHeight: 36,
      borderRadius: t.radiusSm,
      alignItems: 'center',
      justifyContent: 'center'
    },
    tabOn: { backgroundColor: t.raised },
    tabText: { ...text, color: t.muted, fontSize: t.textSm, fontWeight: '600' },
    tabTextOn: { color: t.ink },
    link: { ...text, color: t.ink, fontSize: t.textSm, fontWeight: '600' },
    footer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },

    miniKeys: { ...quiet, minWidth: 52, minHeight: 52, borderRadius: t.radiusLg },

    // Compact's result lies over the builder; its height is the builder's
    builder: { gap: 12 },
    overlay: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: t.bg
    },
    // Mini's result is a card over a scrim
    scrim: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: t.scrim },
    scrimTap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    card: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 480,
      maxHeight: '80%',
      borderRadius: t.radiusXl,
      backgroundColor: t.bg,
      overflow: 'hidden'
    },
    cardActions: { flexDirection: 'row', gap: 8 },

    recentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recentTitle: { ...text, flexGrow: 1, fontSize: t.textMd, fontWeight: '700' },
    recentEmpty: { ...text, color: t.muted, fontSize: t.textSm },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 48,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: t.radiusMd,
      backgroundColor: t.raised
    },
    historyText: { flexGrow: 1, flexShrink: 1, gap: 2 },
    historyTotal: { ...text, fontSize: t.textLg, fontWeight: '800', fontVariant: ['tabular-nums'] },
    sheet: {
      flexGrow: 1,
      gap: 12,
      padding: 16,
      backgroundColor: t.bg
    }
  })
}

const cache = new WeakMap<RollerTheme, RollerStyles>()

/** The styles for the theme in effect, built once per theme object. */
export function useStyles(): { readonly theme: RollerTheme; readonly styles: RollerStyles } {
  const theme = useRollerTheme()
  const cached = cache.get(theme)
  if (cached !== undefined) return { theme, styles: cached }
  const styles = build(theme)
  cache.set(theme, styles)
  return { theme, styles }
}
