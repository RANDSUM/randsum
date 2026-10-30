// tsc checks the .astro files that Starlight and Expressive Code ship, through
// @astrojs/ts-content-mapper, and they import virtual modules the Astro build
// creates. Neither package publishes types for those, so declare them here.
declare module 'virtual:starlight/*'
declare module 'virtual:astro-expressive-code/*'
