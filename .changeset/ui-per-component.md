---
'@randsum/ui': minor
---

Every part of the roller is now its own entry, lodash style:
`@randsum/ui/use-roller`, `/notation-field`, `/roll-button`, `/status-line`,
`/key-pad`, `/preset-list`, `/readout`, `/roll-steps` and `/check`, alongside the
three sizes, `/keys` and `/presets`. Import one part and your bundle gets only
that part; shared code lives in split chunks. `NotationField`'s `statusId` is
now optional.
