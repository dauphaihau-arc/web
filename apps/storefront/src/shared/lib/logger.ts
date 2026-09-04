import { createConsola } from 'consola';

export const log = createConsola({
  level: import.meta.env.MODE === 'production' ? -999 : 999,
});
