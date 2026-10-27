import '@tanstack/vue-query';
import type { FetchError } from 'ofetch';

declare module '@tanstack/vue-query' {
  interface Register {
    defaultError: FetchError
  }
}
