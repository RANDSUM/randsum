// Registers a happy-dom global environment so the roller component tests can mount
// React components with @testing-library/react under bun:test. Loaded via the site's
// bunfig.toml `[test] preload`. Tests that do not touch the DOM are unaffected by its presence.
import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()
