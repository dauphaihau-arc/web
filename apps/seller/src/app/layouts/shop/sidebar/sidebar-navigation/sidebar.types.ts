import type { RouteLocationRaw } from 'vue-router';

export type LinkBase = {
  title: string
  icon?: string
  to?: RouteLocationRaw
  matchPath?: string
  /** Only mark the link active on an exact path match, not on its children. */
  exact?: boolean
  disabled?: boolean
};

export type LinkItem = {
  sub?: LinkBase[]
} & LinkBase;
