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
    '@next/next'
  ),
  {
    files: ['eslint.config.js', 'tailwind.config.js', 'postcss.config.js'],
    rules: {
      'import/no-anonymous-default-export': 'off',
    },
  },
  {
    rules: {
      // place custom project rules here
    },
  },
];
