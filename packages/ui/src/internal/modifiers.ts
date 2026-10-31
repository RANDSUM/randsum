// One row per modifier, named as @randsum/roller names them. `docKeys` are the
// NOTATION_DOCS entries the modifier's docs page covers (its presets come from
// their examples); `keys` are its canonical forms, concrete enough to roll.

interface ModifierRow {
  readonly docKeys: readonly string[]
  readonly keys: readonly { readonly text: string; readonly label: string }[]
}

export type ModifierName =
  | 'cap'
  | 'replace'
  | 'reroll'
  | 'explode'
  | 'compound'
  | 'penetrate'
  | 'explodeSequence'
  | 'wildDie'
  | 'unique'
  | 'drop'
  | 'keep'
  | 'count'
  | 'multiply'
  | 'plus'
  | 'minus'
  | 'integerDivide'
  | 'modulo'
  | 'sort'
  | 'multiplyTotal'

// `+1` stands for the pair of constant keys (−1, +1).
export const MODIFIER_TABLE: Readonly<Record<ModifierName, ModifierRow>> = {
  cap: {
    docKeys: ['C{..}'],
    keys: [
      { text: 'C{>5}', label: 'Cap at 5' },
      { text: 'C{<2}', label: 'Floor at 2' }
    ]
  },
  replace: {
    docKeys: ['V{..}'],
    keys: [
      { text: 'V{1=2}', label: '1s become 2s' },
      { text: 'V{>5=5}', label: 'Over 5 become 5' }
    ]
  },
  reroll: {
    docKeys: ['R{..}', 'ro{..}'],
    keys: [
      { text: 'R{1}', label: 'Reroll 1s' },
      { text: 'R{<3}', label: 'Reroll under 3' },
      { text: 'ro{1}', label: 'Reroll 1s once' }
    ]
  },
  explode: {
    docKeys: ['!'],
    keys: [
      { text: '!', label: 'Explode' },
      { text: '!{>=5}', label: 'Explode on 5+' }
    ]
  },
  compound: {
    docKeys: ['!!'],
    keys: [
      { text: '!!', label: 'Compound' },
      { text: '!!{>=5}', label: 'Compound on 5+' }
    ]
  },
  penetrate: {
    docKeys: ['!p'],
    keys: [
      { text: '!p', label: 'Penetrate' },
      { text: '!p{>=5}', label: 'Penetrate on 5+' }
    ]
  },
  explodeSequence: {
    docKeys: ['!s{..}', '!i', '!r'],
    keys: [
      { text: '!s{8,10,12}', label: 'Step up' },
      { text: '!i', label: 'Inflate' },
      { text: '!r', label: 'Reduce' }
    ]
  },
  wildDie: { docKeys: ['W'], keys: [{ text: 'W', label: 'Wild die' }] },
  unique: {
    docKeys: ['U'],
    keys: [
      { text: 'U', label: 'Unique' },
      { text: 'U{1}', label: 'Unique but 1s' }
    ]
  },
  drop: {
    docKeys: ['L', 'H', 'D{..}'],
    keys: [
      { text: 'L', label: 'Drop low' },
      { text: 'H', label: 'Drop high' },
      { text: 'D{1}', label: 'Drop 1s' }
    ]
  },
  keep: {
    docKeys: ['K', 'KL', 'KM'],
    keys: [
      { text: 'K', label: 'Keep high' },
      { text: 'KL', label: 'Keep low' },
      { text: 'KM', label: 'Keep middle' }
    ]
  },
  count: {
    docKeys: ['#{..}', 'S{..}', 'F{..}', 'ms{..}'],
    keys: [
      { text: 'S{5}', label: 'Successes on 5+' },
      { text: 'F{1}', label: 'Failures on 1' },
      { text: '#{>=4}', label: 'Count 4+' }
    ]
  },
  multiply: { docKeys: ['*'], keys: [{ text: '*2', label: 'Double dice' }] },
  plus: { docKeys: ['+'], keys: [{ text: '+1', label: 'Constant' }] },
  minus: { docKeys: ['-'], keys: [{ text: '+1', label: 'Constant' }] },
  integerDivide: { docKeys: ['//'], keys: [{ text: '//2', label: 'Halve' }] },
  modulo: { docKeys: ['%'], keys: [{ text: '%2', label: 'Modulo 2' }] },
  sort: {
    docKeys: ['sort'],
    keys: [
      { text: 'sa', label: 'Sort up' },
      { text: 'sd', label: 'Sort down' }
    ]
  },
  multiplyTotal: { docKeys: ['**'], keys: [{ text: '**2', label: 'Double total' }] }
}
