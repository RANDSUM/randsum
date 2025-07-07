import { defineCollection, z } from 'astro:content'

// Enhanced package schema with more metadata
const packages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    version: z.string(),
    npmPackage: z.string(),
    githubPath: z.string(),
    category: z.enum(['core', 'game-system', 'application']),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
    // Additional metadata
    status: z.enum(['stable', 'beta', 'alpha', 'deprecated']).default('stable'),
    minNodeVersion: z.string().optional(),
    dependencies: z.array(z.string()).optional(),
    peerDependencies: z.array(z.string()).optional(),
    license: z.string().default('MIT'),
    author: z.string().optional(),
    homepage: z.string().optional(),
    repository: z.string().optional(),
    // Documentation structure
    hasApiDocs: z.boolean().default(false),
    hasExamples: z.boolean().default(false),
    hasTutorials: z.boolean().default(false)
  })
})

// Enhanced documentation schema with better categorization
const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['guide', 'api', 'tutorial', 'reference', 'concept']),
    subcategory: z.string().optional(),
    order: z.number().optional(),
    tags: z.array(z.string()).optional(),
    // Content metadata
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedReadTime: z.number().optional(), // in minutes
    lastUpdated: z.date().optional(),
    // Related content
    relatedDocs: z.array(z.string()).optional(),
    relatedPackages: z.array(z.string()).optional(),
    // SEO and navigation
    sidebar: z.boolean().default(true),
    toc: z.boolean().default(true),
    searchable: z.boolean().default(true)
  })
})

// Enhanced examples schema with more structure
const examples = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    package: z.string(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    tags: z.array(z.string()).optional(),
    // Example metadata
    category: z.enum(['basic', 'game-integration', 'advanced-usage', 'real-world']).optional(),
    estimatedTime: z.number().optional(), // in minutes
    prerequisites: z.array(z.string()).optional(),
    // Code and demo
    hasLiveDemo: z.boolean().default(false),
    demoUrl: z.string().optional(),
    codeUrl: z.string().optional(),
    // Learning path
    nextExample: z.string().optional(),
    prevExample: z.string().optional(),
    relatedExamples: z.array(z.string()).optional()
  })
})

// Applications collection for apps in the monorepo
const apps = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['cli', 'web', 'bot', 'server', 'desktop']),
    status: z.enum(['active', 'maintenance', 'deprecated']).default('active'),
    version: z.string().optional(),
    // App-specific metadata
    platform: z.array(z.enum(['node', 'browser', 'discord', 'cli', 'web'])).optional(),
    installation: z.enum(['npm', 'download', 'docker', 'source']).optional(),
    // Documentation
    hasUserGuide: z.boolean().default(false),
    hasApiDocs: z.boolean().default(false),
    hasExamples: z.boolean().default(false),
    // Links
    downloadUrl: z.string().optional(),
    demoUrl: z.string().optional(),
    githubPath: z.string(),
    // Metadata
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
    license: z.string().default('MIT')
  })
})

// API Reference collection for detailed API documentation
const api = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    package: z.string(), // Which package this API belongs to
    category: z.enum(['function', 'class', 'interface', 'type', 'constant', 'enum']),
    // API metadata
    signature: z.string().optional(), // Function/method signature
    parameters: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
      required: z.boolean().default(true),
      defaultValue: z.string().optional()
    })).optional(),
    returns: z.object({
      type: z.string(),
      description: z.string()
    }).optional(),
    // Documentation
    since: z.string().optional(), // Version when added
    deprecated: z.string().optional(), // Version when deprecated
    examples: z.array(z.string()).optional(), // Example code snippets
    seeAlso: z.array(z.string()).optional(), // Related API references
    // Organization
    namespace: z.string().optional(),
    module: z.string().optional(),
    order: z.number().optional(),
    tags: z.array(z.string()).optional()
  })
})

// Changelog collection for version history
const changelog = defineCollection({
  type: 'content',
  schema: z.object({
    version: z.string(),
    date: z.date(),
    package: z.string().optional(), // If specific to a package
    type: z.enum(['major', 'minor', 'patch', 'prerelease']),
    // Changes
    breaking: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    fixes: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    deprecated: z.array(z.string()).optional(),
    // Metadata
    highlights: z.array(z.string()).optional(),
    migration: z.string().optional(), // Migration guide content
    tags: z.array(z.string()).optional()
  })
})

export const collections = {
  packages,
  docs,
  examples,
  apps,
  api,
  changelog
}
