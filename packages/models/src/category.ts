export type Category = {
  id: string
  parentId?: string
  name: string
  rank: number
  imageStorageKey?: string
  imageUrl?: string
  featuredFacetKeys?: string[]
  attributes: {
    id: string
    key?: string
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
}
