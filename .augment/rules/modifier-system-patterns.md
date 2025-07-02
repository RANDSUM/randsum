---
type: "always_apply"
---

## Modifier System Patterns

- Implement static pattern property for regex matching dice notation
- Implement static parse method to extract options from notation strings
- Use consistent modifier naming: [Action]Modifier (e.g., DropModifier, ExplodeModifier)
- Modifiers should be pure functions that transform roll bonuses
- Include toDescription() and toNotation() methods for human-readable output
- Use formatters utility for consistent description formatting
