// The landing page's questions. The page renders them and its FAQPage structured
// data is built from the same list, so the two cannot drift apart.
export interface FaqEntry {
  readonly question: string
  // Plain text: it goes into JSON-LD as well as the page
  readonly answer: string
  readonly link?: { readonly label: string; readonly href: string }
}

export const LANDING_FAQ: readonly FaqEntry[] = [
  {
    question: 'What is RANDSUM?',
    answer:
      'RANDSUM is an open-source dice engine for TypeScript and JavaScript. Its core package, @randsum/roller, parses dice notation such as 4d6L or 2d20H, rolls it, and returns the total with every step that produced it. Around it sit ready-made game rules, drop-in roller components, a public HTTP API, an installable Roller app, a Discord bot, a plugin for AI agents and an open notation spec.',
    link: { label: 'Read the introduction', href: '/welcome/introduction/' }
  },
  {
    question: 'Which dice notation does it support?',
    answer:
      'Everything in RANDSUM Dice Notation: basic NdS rolls and arithmetic, plus modifiers for drop and keep, reroll, exploding, compounding and penetrating dice, caps, unique results, and counting successes or failures. Fate, percentile, wild, geometric and draw dice are built in.',
    link: { label: 'See the notation reference', href: '/notation/randsum-dice-notation/' }
  },
  {
    question: 'Which games have ready-made rules?',
    answer:
      "@randsum/games covers D&D 5th Edition, Blades in the Dark, Daggerheart, Fate Core, Powered by the Apocalypse, Root: The Roleplaying Game and Salvage Union. Each game's rules are a .randsum.json spec, so you can write one for your own game.",
    link: { label: 'Browse the games', href: '/games/introduction/' }
  },
  {
    question: 'Where does it run?',
    answer:
      '@randsum/roller has no runtime dependencies and ships as ES modules with type declarations, so it runs in Bun, Node.js, Deno and the browser. CommonJS projects can use it through a bundler.',
    link: { label: 'Install it', href: '/roller/getting-started/' }
  },
  {
    question: 'Can I roll dice without writing code?',
    answer:
      'Yes. Install the Roller app on your phone, add the Discord bot to your server for game night, call the public API at api.randsum.dev with no key, or install the plugin so Claude and other agents roll real dice instead of guessing.',
    link: { label: 'See the agent tools', href: '/tools/agents/' }
  },
  {
    question: 'Is RANDSUM free?',
    answer:
      'Yes. Every package is MIT licensed and developed in the open on GitHub, and the API and Discord bot are free to use.',
    link: { label: 'View it on GitHub', href: 'https://github.com/RANDSUM/randsum' }
  }
]
