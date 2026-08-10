// @ts-nocheck

import { createSharedConfig, ignoresConfig } from '@arc/eslint-config';

export default [
  ...(await createSharedConfig({ tsconfigRootDir: import.meta.dirname })),
  ignoresConfig,
];
