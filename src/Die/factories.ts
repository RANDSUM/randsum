import { CustomSidesDie, StandardDie } from './constants'
import SingleDie from './single-die'

function dieFactory<D extends string | number>(
  sides: D extends number ? number : string[]
): SingleDie<D>
function dieFactory(sides: number | string[]): SingleDie<string | number> {
  return Array.isArray(sides)
    ? new CustomSidesDie(sides.map(String))
    : new StandardDie(Number(sides))
}

export default dieFactory
