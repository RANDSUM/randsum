# Migration Notes

This package structure has been set up in the monorepo. The following items need to be migrated from the RANDSUM/robo repository:

## Source Code to Migrate

1. **src/** directory:
   - `src/app/` - React frontend for Discord Activity
   - `src/api/` - Backend API routes
   - `src/rooms/` - Colyseus room implementations
   - `src/entities/` - Colyseus schema entities
   - `src/hooks/` - React hooks
   - `src/components/` - React components
   - Any other source files

2. **config/** directory:
   - `config/robo.mjs` - Robo.js configuration file
   - Any other configuration files

3. **Root files:**
   - `.npmrc` - npm configuration (if needed)
   - `example.env` - Example environment variables file
   - `PRIVACY_POLICY.md` - Privacy policy
   - `TERMS_OF_SERVICE.md` - Terms of service

## After Migration

1. Update `config/robo.mjs` to add `@ts-check` and `@type` annotations
2. Ensure all imports from `@randsum/roller` use package imports
3. Run `bun install` from root to establish workspace links
4. Test build, lint, and typecheck commands
