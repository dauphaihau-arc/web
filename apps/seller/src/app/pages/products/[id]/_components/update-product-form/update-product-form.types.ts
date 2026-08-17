/* eslint-disable @typescript-eslint/naming-convention */
import type { UpdateProductBody } from '~/domains/shop/api/product/contracts/form.contract';

export type IOnChangeUpdateVariants = Partial<Pick<UpdateProductBody,
  'update_variants' | 'variant_inventories'
  | 'new_single_variants' | 'variant_type' | 'new_combine_variants'
>> & {
  variant_group_name?: string
  variant_sub_group_name?: string
} | null;
