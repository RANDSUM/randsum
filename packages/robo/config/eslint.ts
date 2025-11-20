import globals from 'globals'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

// eslint-disable-next-line @typescript-eslint/no-deprecated
export default tseslint.config(
  { ignores: ['.robo/', 'config/'] },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended
)
