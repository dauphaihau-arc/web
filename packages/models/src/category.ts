export type Category = {
  id: string
  parentId?: string
  name: string
  slug: string
  rank: number
  imageUrl?: string
  imageUrl1x1?: string
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
