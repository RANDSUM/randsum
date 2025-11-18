import { coreNotationPattern } from './lib/patterns'

export function isDiceNotation(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()
  if (trimmed === '') {
    return false
  }

  // Remove whitespace for matching
  const cleanValue = trimmed.replace(/\s+/g, '')

  // Reject if contains decimal points (not valid dice notation)
  if (cleanValue.includes('.')) {
    return false
  }

  // Check if it starts with + or -
  let startIndex = 0
  if (cleanValue[0] === '+' || cleanValue[0] === '-') {
    startIndex = 1
  }

  // Find all dice notation patterns
  let currentIndex = startIndex
  let foundAny = false

  while (currentIndex < cleanValue.length) {
    const remaining = cleanValue.slice(currentIndex)
    const match = remaining.match(coreNotationPattern)
    
    if (!match) {
      // If we've found at least one dice notation, check if rest is just modifiers/arithmetic
      if (foundAny) {
        // Check if remaining is valid modifiers/arithmetic
        const remainingPart = cleanValue.slice(currentIndex)
        if (/^([LH](\d+)?|!|R\{[^}]+\}(\d+)?|C\{[^}]+\}|D\{[^}]+\}|V\{[^}]+\}|U(\{[^}]+\})?|[\+\-]\d+)*$/.test(remainingPart)) {
          return true
        }
      }
      return false
    }

    foundAny = true
    const diceEnd = currentIndex + match.index! + match[0].length
    
    // Check for modifiers after the dice notation
    let modifierEnd = diceEnd
    while (modifierEnd < cleanValue.length) {
      const nextChar = cleanValue[modifierEnd]
      
      // Check if we hit another dice notation
      const nextDiceMatch = cleanValue.slice(modifierEnd).match(coreNotationPattern)
      if (nextDiceMatch && nextDiceMatch.index === 0) {
        break
      }
      
      // Check if it's a valid modifier character
      if (/[LH!RCDVU\+\-]/.test(nextChar)) {
        modifierEnd++
        // Handle modifier blocks like R{...}, C{...}, etc.
        if (nextChar === 'R' || nextChar === 'C' || nextChar === 'D' || nextChar === 'V') {
          const blockMatch = cleanValue.slice(modifierEnd - 1).match(/^[RCDV]\{[^}]+\}/)
          if (blockMatch) {
            modifierEnd = modifierEnd - 1 + blockMatch[0].length
            // Check for max number after R{...}
            if (nextChar === 'R') {
              const maxMatch = cleanValue.slice(modifierEnd).match(/^\d+/)
              if (maxMatch) {
                modifierEnd += maxMatch[0].length
              }
            }
          } else {
            break
          }
        } else if (nextChar === 'U') {
          const uniqueMatch = cleanValue.slice(modifierEnd - 1).match(/^U(\{[^}]+\})?/)
          if (uniqueMatch) {
            modifierEnd = modifierEnd - 1 + uniqueMatch[0].length
          } else {
            break
          }
        } else if (nextChar === '+' || nextChar === '-') {
          const arithmeticMatch = cleanValue.slice(modifierEnd - 1).match(/^[\+\-]\d+/)
          if (arithmeticMatch) {
            modifierEnd = modifierEnd - 1 + arithmeticMatch[0].length
          } else {
            break
          }
        } else if (nextChar === 'L' || nextChar === 'H') {
          const dropMatch = cleanValue.slice(modifierEnd - 1).match(/^[LH](\d+)?/)
          if (dropMatch) {
            modifierEnd = modifierEnd - 1 + dropMatch[0].length
          } else {
            break
          }
        }
      } else {
        break
      }
    }
    
    currentIndex = modifierEnd
    
    // Check if there's a + or - before the next dice notation
    if (currentIndex < cleanValue.length && (cleanValue[currentIndex] === '+' || cleanValue[currentIndex] === '-')) {
      currentIndex++
    }
  }

  // Must match the entire string exactly
  if (!foundAny || currentIndex < cleanValue.length) {
    return false
  }
  
  // Additional check: ensure we didn't skip any non-dice-notation characters
  // by verifying the string only contains valid dice notation characters
  const validChars = /^[\d\+\-dDLHRCVU!{}\s,><=]+$/i
  if (!validChars.test(cleanValue)) {
    return false
  }
  
  return true
}

