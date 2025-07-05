import type { Config } from 'robo.js'

export default {
  clientOptions: {
    intents: ['Guilds', 'GuildMessages']
  },
  plugins: [],
  type: 'robo',
  experimental: {
    buildDirectory: 'dist'
  }
} as Config
