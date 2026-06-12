import type { RouteLocationRaw } from 'vue-router';

export function useAppNavigate() {
  return {
    to: (target: RouteLocationRaw) => navigateTo(target),
  };
}
