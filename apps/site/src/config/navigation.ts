import type { NavigationItem } from '../components/Sidebar.astro'

// Main site navigation configuration
export const mainNavigation: NavigationItem[] = [
  // Core Package
  {
    href: '/roller',
    label: 'roller',
    prefix: '@randsum/',
    color:
      'bg-gradient-to-r from-silver-300 to-silver-100 bg-clip-text text-transparent',
    hoverColor: 'hover:bg-randsum-800'
  },

  // Game Packages
  {
    href: '/blades',
    label: 'blades',
    prefix: '@randsum/',
    color: 'text-games-blades-500',
    hoverColor: 'hover:bg-games-blades-600/10'
  },
  {
    href: '/daggerheart',
    label: 'daggerheart',
    prefix: '@randsum/',
    color: 'text-games-daggerheart-500',
    hoverColor: 'hover:bg-games-daggerheart-600/10'
  },
  {
    href: '/fifth',
    label: 'fifth',
    prefix: '@randsum/',
    color: 'text-games-fifth-500',
    hoverColor: 'hover:bg-games-fifth-600/10'
  },
  {
    href: '/root-rpg',
    label: 'root-rpg',
    prefix: '@randsum/',
    color: 'text-games-root-rpg-500',
    hoverColor: 'hover:bg-games-root-rpg-600/10'
  },
  {
    href: '/salvageunion',
    label: 'salvageunion',
    prefix: '@randsum/',
    color: 'text-games-salvageunion-500',
    hoverColor: 'hover:bg-games-salvageunion-600/10'
  }
]

// Package-specific additional navigation items
export const rollerAdditionalNavigation: NavigationItem[] = [
  {
    href: '/roller/docs',
    label: 'Docs',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-randsum-800',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
  },
  {
    href: '/roller/examples',
    label: 'Examples',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-randsum-800',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />'
  },
  {
    href: 'https://github.com/RANDSUM/randsum/tree/main/packages/roller',
    label: 'Github',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-randsum-800',
    external: true,
    icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />'
  }
]

export const bladesAdditionalNavigation: NavigationItem[] = [
  {
    href: '/blades/docs',
    label: 'Docs',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-blades-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
  },
  {
    href: '/blades/examples',
    label: 'Examples',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-blades-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />'
  },
  {
    href: 'https://github.com/RANDSUM/randsum/tree/main/packages/blades',
    label: 'Github',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-blades-600/10',
    external: true,
    icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />'
  }
]

export const daggerheartAdditionalNavigation: NavigationItem[] = [
  {
    href: '/daggerheart/docs',
    label: 'Docs',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-daggerheart-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
  },
  {
    href: '/daggerheart/examples',
    label: 'Examples',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-daggerheart-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />'
  },
  {
    href: 'https://github.com/RANDSUM/randsum/tree/main/packages/daggerheart',
    label: 'Github',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-daggerheart-600/10',
    external: true,
    icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />'
  }
]

export const fifthAdditionalNavigation: NavigationItem[] = [
  {
    href: '/fifth/docs',
    label: 'Docs',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-fifth-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
  },
  {
    href: '/fifth/examples',
    label: 'Examples',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-fifth-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />'
  },
  {
    href: 'https://github.com/RANDSUM/randsum/tree/main/packages/fifth',
    label: 'Github',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-fifth-600/10',
    external: true,
    icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />'
  }
]

export const rootRpgAdditionalNavigation: NavigationItem[] = [
  {
    href: '/root-rpg/docs',
    label: 'Docs',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-root-rpg-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
  },
  {
    href: '/root-rpg/examples',
    label: 'Examples',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-root-rpg-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />'
  },
  {
    href: 'https://github.com/RANDSUM/randsum/tree/main/packages/root-rpg',
    label: 'Github',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-root-rpg-600/10',
    external: true,
    icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />'
  }
]

export const salvageunionAdditionalNavigation: NavigationItem[] = [
  {
    href: '/salvageunion/docs',
    label: 'Docs',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-salvageunion-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />'
  },
  {
    href: '/salvageunion/examples',
    label: 'Examples',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-salvageunion-600/10',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />'
  },
  {
    href: 'https://github.com/RANDSUM/randsum/tree/main/packages/salvageunion',
    label: 'Github',
    color: 'text-silver-300',
    hoverColor: 'hover:bg-games-salvageunion-600/10',
    external: true,
    icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />'
  }
]
