import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
});

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**'],
  },
  ...compat.extends('next/core-web-vitals'),
  ...compat.plugins(
    '@typescript-eslint',
    'import',
    'react',
    'react-hooks',
    'jsx-a11y',
    '@next/next',
  ),
  {
    files: ['eslint.config.js', 'tailwind.config.js', 'postcss.config.js'],
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    rules: {
      // TypeScript/React rules we enforce project-wide
      '@typescript-eslint/no-explicit-any': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          // Ensure React imports appear before other external imports for readability
          // and to match the common convention of importing React at the top.
          // This places `react` before other externals while still alphabetizing
          // the remainder.
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
