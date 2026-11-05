// Each die's path through a roll's steps, as data: the model behind the Lanes
// layout of `<randsum-roll-steps>`, for renderers that draw it some other way
// (the Discord bot draws it as text). No elements, no styles.
export { timeline, visibleSteps } from './internal/steps'
export type { Lane, LaneNode, ShownStep, StepInk, Timeline, TimelineRow } from './internal/steps'
