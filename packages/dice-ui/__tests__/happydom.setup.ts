// Registers a happy-dom global environment so component-behavior tests for the web (`.tsx`)
// variants can mount React components with @testing-library/react under bun:test. Loaded via
// the package-local bunfig.toml `[test] preload`. Pure-logic test files (e.g. tokenColor) do not
// touch the DOM and are unaffected by its presence.
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()
