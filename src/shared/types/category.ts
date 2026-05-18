export type Category = {
  id: string
  parentId?: string
  name: string
  rank: number
  imageStorageKey?: string
  imageUrl?: string
  attributes: {
    id: string
    name: string
    inputType: string
    isRequired: boolean
    rank: number
    options: {
      id: string
      value: string
      rank: number
    }[]
  }[]
};

export type GetCategoriesParams = {
  parent_id?: Category['id']
};

export type ResponseGetCategories = {
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

export type CategorySearch = {
  id: Category['id']
  lastNameCategory: Category['name']
  categoriesRelated: Category['name'][]
};
