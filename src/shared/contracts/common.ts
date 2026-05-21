import type { Ref } from 'vue';

export interface ResponseBaseGetList<T> {
  results: T[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export type RequestGetListParams = Partial<{
  page: number | Ref<number>
  limit: number
  populate: string
  select: string
  sortBy: string
}>;
