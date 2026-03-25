const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Extend defaults rather than replacing them
config.watchFolders = [...(config.watchFolders || []), monorepoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules')
]

// Add react-native to web condition set so Metro resolves packages like
// Zustand to their CJS entries (which use process.env.NODE_ENV) instead
// of ESM entries (which use import.meta.env.MODE — invalid in classic scripts).
config.resolver.unstable_conditionsByPlatform = {
  ...config.resolver.unstable_conditionsByPlatform,
  web: ['browser', 'react-native']
}

// Resolve workspace packages to TypeScript source instead of dist/.
// Metro handles TS natively — this avoids needing a build step on EAS.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const workspacePackages = {
    '@randsum/roller': path.resolve(monorepoRoot, 'packages/roller/src/index.ts'),
    '@randsum/roller/roll': path.resolve(monorepoRoot, 'packages/roller/src/roll/index.ts'),
    '@randsum/roller/docs': path.resolve(monorepoRoot, 'packages/roller/src/docs/index.ts'),
    '@randsum/roller/trace': path.resolve(monorepoRoot, 'packages/roller/src/trace/index.ts'),
    '@randsum/roller/tokenize': path.resolve(
      monorepoRoot,
      'packages/roller/src/notation/tokenize.ts'
    ),
    '@randsum/roller/validate': path.resolve(monorepoRoot, 'packages/roller/src/validate.ts'),
    '@randsum/roller/errors': path.resolve(monorepoRoot, 'packages/roller/src/errors.ts'),
    '@randsum/dice-ui': path.resolve(
      monorepoRoot,
      platform === 'web' ? 'packages/dice-ui/src/index.ts' : 'packages/dice-ui/src/index.native.ts'
    )
  }

  if (workspacePackages[moduleName]) {
    return {
      filePath: workspacePackages[moduleName],
      type: 'sourceFile'
    }
  }

  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
