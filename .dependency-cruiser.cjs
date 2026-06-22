// dependency-cruiser config — enforces the architecture invariants that were
// previously upheld only by convention + review (audit items X7b / architecture
// R2 + R3):
//   1. no circular dependencies anywhere in the workspace
//   2. no game subpath imports another game subpath
//   3. no consumer reaches into @randsum/*/src or @randsum/*/dist
//
// Run:  bun run arch:check   (wired into lefthook pre-push and the CI Gate)

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment:
        'Circular dependency detected. The workspace must remain a strict DAG ' +
        '(roller core <- {games, dice-ui} <- apps). See architecture R2.',
      from: {},
      to: { circular: true }
    },
    {
      name: 'no-cross-game-import-internal',
      severity: 'error',
      comment:
        'A game subpath imported a sibling game generated entry by relative path. ' +
        'Game packages depend ONLY on @randsum/roller, never on each other. See architecture R3.',
      // a per-game generated entry file...
      from: {
        path: '^packages/games/src/([^/]+)\\.generated\\.ts$',
        pathNot: '^packages/games/src/availableGames\\.generated\\.ts$'
      },
      // ...must not import any OTHER per-game generated entry file by path.
      to: {
        path: '^packages/games/src/([^/]+)\\.generated\\.ts$',
        pathNot: '^packages/games/src/availableGames\\.generated\\.ts$'
      }
    },
    {
      name: 'no-cross-game-import-subpath',
      severity: 'error',
      comment:
        'A @randsum/games file imported another game via the @randsum/games/<game> ' +
        'published subpath. Game packages must not depend on each other. See architecture R3.',
      from: { path: '^packages/games/src/' },
      // matches the package subpath specifier (resolved or not), e.g.
      // @randsum/games/blades — but allow @randsum/games/schema (shared spec API).
      to: {
        path: '^@randsum/games/(?!schema$)[^/]+$'
      }
    },
    {
      name: 'no-internal-reach-in',
      severity: 'error',
      comment:
        'A consumer reached into @randsum/*/src or @randsum/*/dist. Import only ' +
        'the published subpath entry points (e.g. @randsum/roller/roll). See architecture R3.',
      from: {},
      to: { path: '@randsum/[^/]+/(src|dist)/' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: [
        'node_modules',
        '\\.test\\.ts$',
        '\\.property\\.test\\.ts$',
        '__tests__',
        '__benchmarks__',
        'dist/'
      ]
    },
    tsConfig: { fileName: 'tsconfig.json' },
    // Runtime edges only. Type-only imports (import type { X }) create benign
    // co-reference loops between the modifier registry and its doc/type modules
    // that are erased at compile time and are NOT runtime cycles — including them
    // produces false positives that contradict the verified-acyclic core.
    tsPreCompilationDeps: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    }
  }
}
