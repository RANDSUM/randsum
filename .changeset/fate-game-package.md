---
"@randsum/games": minor
---

Add the Fate Core game package (`@randsum/games/fate`, #940), unblocked by the custom-die-faces feature. `roll()` throws four Fate dice (`faces: [-1, 0, 1]`), applies an optional `modifier` (the skill rating, an integer in `[-2, 4]`, default `0`), and maps the total to the Fate ladder adjective rungs (Legendary down through Terrible), clamping the open ends.

Also hardens the codegen string-literal interpolation: author-supplied strings (result labels, descriptions, enum values, error templates) are now escaped before being emitted into generated TypeScript, so a quote, backslash, or newline can no longer break or inject into the generated module.

> Note: the Fate ladder rung names and the modifier range deserve a human TTRPG-accuracy review before release.
