import type { RouteLocationRaw } from 'vue-router'

export type LinkBase = {
  title: string
  to?: RouteLocationRaw
  matchPath?: string
  disabled?: boolean
}

export type LinkItem = {
  sub?: LinkBase[]
} & LinkBase
