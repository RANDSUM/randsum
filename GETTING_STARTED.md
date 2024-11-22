# Getting Started

## Insalling

Add `randsum` to your package.json, or copy and paste one of these:

`npm install randsum`

`yarn add randsum`

`bun add randsum`

Then require it in your project!

```js
import { roll } from 'randsum'
```

or

```js
const { roll } = require('randsum')
```

## using `roll`

`randsum` exports a function, `roll`, that will perform a dice roll of the provided parameters.

```ts
import { roll } from 'randsum'

const result = roll(20)

console.log(result.total) // a random number between 1 and 20
```

### The Roll Result

`roll(arg)` returns a `RandsumRollResult` object. This has plenty of helpful keys, but the big ones are `total` and `result`.

`total` returns the combined total of all your rolls, whereas `result` is an `Array` of `Array`s, each one representing the _set_ of different roll results for each pool of dice you rolled.

### Passing a `number` (or number-like `string`)

---

You can give `randsum` a number or number-like string, like so:

```ts
roll(20).total // A random number between 1 and 20
roll('200').total // A random number between 1 and 200
```

This argument represents the `sides` of the die that we're going to roll.

### Passing a Dice Notation `string`

---

See the [Randsum Dice Notation](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md) syntax document for more info.

```ts
roll('4d20H+2') // Roll 4 20 sided die, drop highest, add 2
```

### Passing in Options

---

You can pass in a `RandsumRollOptions` as the first argument. While rolling numerical die, `sides` is the only required value, representing the number of distinct sides of the die.

```ts
roll({ sides: 20 }) // Roll a single 20 sided die
```

The other commonly used key will be `quantity`, which tells you how many dice to roll.

```ts
roll({ sides: 20, quantity: 4 }) // Roll 4 distinct 20 sided die, and give me the total.
```

You can use the `modifier` property of `RandsumRollOptions.options` to further modify your roll. `modifiers` is an object that you can fill with Modifier objects. For instance:

```ts
roll({
  sides: 20,
  quantity: 4,
  modifiers: { drop: { highest: true } }, { plus: 2 }
}) // Roll 4 20 sided die, drop highest, plus 2
```

### Passing in multiple dice pools

`roll` accepts an array of options in varying different formats!

```ts
roll(20, '2d4', {
      sides: 20,
      quantity: 4,
      modifiers: { drop: { highest: true } }, { plus: 2 }
    })
  // Roll 1 d20, 2 d4, and 4 d20 (dropping the highest and adding 2)
```

in these scenarios, `total` and `result` will represent _all_ of these rolls combined.

In most cases, if you are only rolling a single _kind_ of die - as in, each die is the same number (and symbols) of sides - you shouldn't need to pass in multiple dice pool arguments. This is mostly helpful if You have different sets of modifiers applied to different dice in the roll!

### Custom Sides

As of [1.7.0](https://github.com/RANDSUM/randsum-ts/releases/tag/v1.7.0), `roll()` now supports rolling die and getting results with _custom sides_. Just pass in an array of strings as your `sides`!

```ts
roll({
  sides: ['+', '+', '-', '-', ' ', ' '], // fudge dice!
  quantity: 4
}) // Roll 4 fudge dice, return a string result like `+, -, _, _`
```

See the [Randsum Dice Notation](https://github.com/RANDSUM/randsum-ts/blob/main/RANDSUM_DICE_NOTATION.md) for more usage information.

One note on Custom Sides: whenever your roll includes custom dice sides, `total` will return `0`. This is because we can't meaningfully calculate the numerical total of a set of strings! This will return zero if _any_ dice pool in the roll is custom.

For example:

```ts
roll('2d20')
// total = 1-20

roll({
  sides: ['h', 't'],
  quantity: 4
}) // total = 0

roll([
  {
    sides: ['h', 't'],
    quantity: 4
  },
  '2d20'
]) // total = 0
```

### Advanced Usage

`RandsumRollResult` has several other keys that can come in handy for sussing out the specifics of your dice rolls.

- `dicePools` is an object representing the normalized state of each argument passed to `roll`. This includes a version of the provided dice pool argument as a `DicePoolOption` (`option`), as `RandsumNotation` (`notation`), a `Die` representing a single die in this particular `dicePool` and in an array of strings with english-language descriptions of the rolls (`description`)
- `rawRolls` is an object representing arrays of rolls. It shares keys with `dicePools`, allowing us to easily link pools to rawRolls. Each row should be as long as the `quantity`, rolling the `die` in each `dicePool`.
- `modifiedRolls` is an object as well. It shares keys with `dicePools` and `rawRolls`, and each value represents the rolls and total of the roll after modifiers have been applied.

This can be helpful for extracting more details out of your Roll Result!
