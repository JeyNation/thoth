// Re-export the design-system theme and tokens from the canonical location
// under `src/components/ui/Theme`. This file exists for backward compatibility
// so existing imports like `import theme from '@/theme'` continue to work.
export { default } from './components/atoms/Theme/theme';
export { fieldStateTokens, type FieldStateTokens } from './components/atoms/Theme/theme';
