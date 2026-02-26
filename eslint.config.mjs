import js from '@eslint/js'
import nextConfig from 'eslint-config-next'
import prettierConfig from 'eslint-config-prettier'

export default [
  // ESLint recommended rules
  js.configs.recommended,

  // Next.js core-web-vitals config (native flat config)
  ...nextConfig,

  // Prettier config (disables conflicting rules)
  prettierConfig,

  // Custom rules for the project
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
      'react/display-name': 'off',
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      'import/no-anonymous-default-export': 'off',

      // add new line above comment
      'lines-around-comment': [
        'error',
        {
          beforeLineComment: true,
          beforeBlockComment: true,
          allowBlockStart: true,
          allowClassStart: true,
          allowObjectStart: true,
          allowArrayStart: true
        }
      ],

      // add new line above return
      'newline-before-return': 'error',

      // add new line below import
      'import/newline-after-import': [
        'error',
        {
          count: 1
        }
      ],

      // add new line after each var, const, let declaration
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: ['export'], next: ['*'] },
        { blankLine: 'always', prev: ['*'], next: ['multiline-const', 'multiline-let', 'multiline-var', 'export'] }
      ]
    }
  },

  // Additional ignore patterns
  {
    ignores: [
      'public/**',
      '*.config.js',
      '!eslint.config.js'
    ]
  }
]
