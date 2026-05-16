export type LinkBase = {
  title: string
  route?: string
  disabled?: boolean
};

export type LinkItem = {
  sub?: LinkBase[]
} & LinkBase;
