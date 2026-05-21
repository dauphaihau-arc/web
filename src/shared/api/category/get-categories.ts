import type { Category } from './category';

export type GetCategoriesRequest = {
  parent_id?: Category['id']
};

export type GetCategoriesResponse = {
  id: string
  parent_id?: string
  name: string
  rank: number
  image_storage_key?: string
  image_url?: string
  attributes: {
    id: string
    name: string
    input_type: string
    is_required: boolean
    rank: number
    options: {
      id: string
      value: string
      rank: number
    }[]
  }[]
}[];
