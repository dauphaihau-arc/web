import type { Config } from 'tailwindcss';
import tailwindTypography from '@tailwindcss/typography';
import { sharedTailwindTheme } from '../../packages/ui/src/design-tokens';

export default <Partial<Config>>{
  content: [
    './src/app/**/*.{vue,js,jsx,mjs,ts,tsx}',
    './src/shared/ui/**/*.{vue,js,jsx,mjs,ts,tsx}',
    './src/shared/composables/**/*.{js,ts,mjs}',
    './src/shared/utils/**/*.{js,ts,mjs}',
    '../../packages/ui/src/**/*.{vue,js,jsx,mjs,ts,tsx}',
    './src/app.vue',
    './src/error.vue',
    './src/app.config.ts',
  ],
  theme: {
    extend: {
      ...sharedTailwindTheme.extend,
    },
  },
  plugins: [tailwindTypography],
};
