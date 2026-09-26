import {
  ShippingDestinationScopeOptions,
  ShippingProfileStatusOptions,
  ShippingProfileStatuses,
} from '@arc/enums/shipping';

/** Shared shape for the USelectMenu option lists the editor passes to children. */
export type ShippingProfileSelectOption = {
  label: string
  value: string
};

/** Archiving is its own explicit action, so the editor never offers that status. */
export const statusOptions: ShippingProfileSelectOption[] = ShippingProfileStatusOptions
  .filter(option => option.value !== ShippingProfileStatuses.ARCHIVED)
  .map(option => ({ label: option.label, value: option.value }));

export const destinationScopeOptions: ShippingProfileSelectOption[] = ShippingDestinationScopeOptions
  .map(option => ({ label: option.label, value: option.value }));
