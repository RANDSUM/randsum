---
type: "agent_requested"
description: "Error handling and validation patterns"
---

# Error Handling Standards

## Error Messages

- Always provide clear, actionable error messages with context
- Include the invalid input value when possible
- Use descriptive messages instead of generic "Invalid input"

## Validation Patterns

- Validate inputs early in functions
- Use type guards for runtime type checking
- Throw errors for invalid states, return validation objects for user input
