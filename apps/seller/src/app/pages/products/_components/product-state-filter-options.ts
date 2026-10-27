import { ProductStates } from '@arc/enums/product';
import type { FilterOption } from '@arc/ui/patterns/data-filter/types';

export const productStateFilterOptions: FilterOption<ProductStates>[] = [
  { label: 'Active', value: ProductStates.ACTIVE },
  { label: 'Inactive', value: ProductStates.INACTIVE },
  { label: 'Draft', value: ProductStates.DRAFT },
];
