import { config } from '@vue/test-utils';
import { QueryClient, VUE_QUERY_CLIENT } from '@tanstack/vue-query';
import { beforeAll } from 'vitest';

beforeAll(() => {
  config.global.provide = {
    [VUE_QUERY_CLIENT]: new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    }),
  };
});
