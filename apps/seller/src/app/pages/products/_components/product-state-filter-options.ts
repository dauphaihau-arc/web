import { ProductStates } from '@arc/enums/product';
import type { FilterOption } from '~/app/components/filter/types';

export const productStateFilterOptions: FilterOption<ProductStates>[] = [
  { label: 'Active', value: ProductStates.ACTIVE },
  { label: 'Inactive', value: ProductStates.INACTIVE },
  { label: 'Draft', value: ProductStates.DRAFT },
];
