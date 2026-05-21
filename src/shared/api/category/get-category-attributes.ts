export type CategoryAttributeSelect = {
  id: string
  name: string
  options?: {
    id: string
    value: string
  }[]
};

type NestedCategoryAttributeOption = {
  id: string
  value: string
  rank: number
};

type NestedCategoryAttribute = {
  id: string
  name: string
  options: NestedCategoryAttributeOption[]
};

export type GetCategoryAttributesResponse =
  | { attributes: CategoryAttributeSelect[] }
  | { attributes: NestedCategoryAttribute[] };
