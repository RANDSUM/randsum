import { D } from '@randsum/dice'
import { resultToFaces } from './utils/resultToFaces'
import type { CustomRollConfig } from './types'

export class CustomD {
  public sides: number
  private coreDie: D

  constructor(public faces: string[]) {
    this.sides = faces.length
    this.faces = faces
    this.coreDie = new D(this.sides)
  }

  toRollConfig(): CustomRollConfig {
    return {
      sides: this.sides,
      quantity: 1,
      faces: this.faces
    }
  }

  roll(): string {
    return resultToFaces(this.coreDie.roll(), this.faces)
  }

  rollMultiple(quantity: number): string[] {
    return this.coreDie
      .rollMultiple(quantity)
      .map((value) => resultToFaces(value, this.faces))
  }
}
