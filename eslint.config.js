import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    }
  },
  {
    ignores: [
      'node_modules',
      'packages/*/dist',
      'dist',
      'coverage',
      '*.md',
      'docs',
      'eslint.config.js'
    ]
  },
  {
    rules: {
      '@typescript-eslint/no-misused-spread': 'off',
      'no-ternary': 'warn',
      'func-names': ['error', 'as-needed'],
      'no-restricted-exports': 'error'
    }
  }
]
