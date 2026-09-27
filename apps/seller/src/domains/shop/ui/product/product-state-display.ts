import { ProductStates } from '@arc/enums/product';

export type ProductStateTone = 'green' | 'yellow' | 'gray';

export function productStateTone(state?: ProductStates): ProductStateTone {
  switch (state) {
    case ProductStates.ACTIVE:
      return 'green';
    case ProductStates.INACTIVE:
      return 'yellow';
    case ProductStates.DRAFT:
      return 'gray';
    default:
      return 'gray';
  }
}

export function productStateLabel(state?: ProductStates) {
  if (!state) {
    return 'Unknown';
  }

  return state.charAt(0).toUpperCase() + state.slice(1);
}
