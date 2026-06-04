import type { RouteLocationRaw } from 'vue-router'

export type LinkBase = {
  title: string
  icon?: string
  to?: RouteLocationRaw
  matchPath?: string
  disabled?: boolean
}

export type LinkItem = {
  sub?: LinkBase[]
} & LinkBase
