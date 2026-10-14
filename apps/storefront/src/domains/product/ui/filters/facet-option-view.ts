import type { ProductFacet } from '~/domains/product/api/contracts/product.contract';
import type { AttributeFilter } from '~/domains/product/ui/filters/product-filter.constants';

export type FacetOptionViewOption = {
  optionKey: string
  value: string
  disabled: boolean
};

export type FacetOptionView = {
  facetKey: string
  attributeName: string
  options: FacetOptionViewOption[]
};

export type BuildFacetOptionViewInput = {
  /**
   * Category-scoped facets computed before any shopper filter narrows the
   * eligible products. Supplies the option list and heading, so an option
   * never disappears from the panel.
   */
  baselineFacets: ProductFacet[]
  /**
   * Facets computed for the active filters (each facet's own filter excluded).
   * Supplies availability only; an option missing here is not offerable.
   */
  filteredFacets: ProductFacet[]
  /** Current shopper selections, always rendered so they stay clearable. */
  selections: AttributeFilter[]
  /**
   * Whether `filteredFacets` reflects the active filters. When the filtered
   * facet query is pending or errored there is no availability signal, so
   * unselected options are conservatively disabled until availability is known;
   * a selected option stays enabled so it remains clearable.
   */
  hasFilteredAvailability: boolean
};

/**
 * Builds the facet panel view: the category baseline options unioned with the
 * shopper's own selections, flagging each option disabled when it is
 * unselected and the filtered availability does not offer it — or while that
 * availability is unknown. Selected options stay enabled even when the active
 * filters make them incompatible, so they can always be cleared.
 */
export function buildFacetOptionView(
  input: BuildFacetOptionViewInput,
): FacetOptionView[] {
  const availability = new Map<string, Set<string>>();

  if (input.hasFilteredAvailability) {
    input.filteredFacets.forEach((facet) => {
      availability.set(
        facet.facet_key,
        new Set(facet.options.map(option => option.option_key)),
      );
    });
  }

  const facetOrder: string[] = [];
  const names = new Map<string, string>();
  const options = new Map<string, Map<string, string>>();

  function ensureFacet(facetKey: string, attributeName: string) {
    if (!options.has(facetKey)) {
      options.set(facetKey, new Map());
      facetOrder.push(facetKey);
    }

    if (!names.has(facetKey) && attributeName) {
      names.set(facetKey, attributeName);
    }
  }

  function addFacetOptions(facet: ProductFacet) {
    ensureFacet(facet.facet_key, facet.attribute_name);
    const existing = options.get(facet.facet_key);

    facet.options.forEach((option) => {
      if (!existing?.has(option.option_key)) {
        existing?.set(option.option_key, option.value);
      }
    });
  }

  input.baselineFacets.forEach(addFacetOptions);
  input.filteredFacets.forEach(addFacetOptions);

  const selectionsByFacet = new Map(
    input.selections.map(selection => [selection.facetKey, selection]),
  );

  input.selections.forEach((selection) => {
    ensureFacet(selection.facetKey, selection.attributeName);
    const existing = options.get(selection.facetKey);

    selection.selectedOptionKeys.forEach((optionKey, index) => {
      if (!existing?.has(optionKey)) {
        existing?.set(optionKey, selection.selectedOptionValues[index] ?? optionKey);
      }
    });
  });

  return facetOrder.map((facetKey) => {
    const selectedKeys = new Set(
      selectionsByFacet.get(facetKey)?.selectedOptionKeys ?? [],
    );
    const availableKeys = availability.get(facetKey);

    return {
      facetKey,
      attributeName: names.get(facetKey) ?? facetKey,
      options: Array.from(options.get(facetKey)?.entries() ?? []).map(
        ([optionKey, value]) => ({
          optionKey,
          value,
          disabled: !selectedKeys.has(optionKey)
            && (!input.hasFilteredAvailability || !(availableKeys?.has(optionKey) ?? false)),
        }),
      ),
    };
  });
}

export type ToggleFacetSelectionInput = {
  facetKey: string
  attributeName: string
  optionKey: string
  optionValue: string
  checked: boolean
};

/**
 * Returns the next attribute filter list after checking or unchecking one
 * option: creates the facet entry, unions the option into it, or drops the
 * entry once its last option is cleared. Shared by the desktop facet panel and
 * the mobile filter sheet so both stage selections identically.
 */
export function toggleFacetSelection(
  filters: AttributeFilter[],
  input: ToggleFacetSelectionInput,
): AttributeFilter[] {
  const existing = filters.find(filter => filter.facetKey === input.facetKey);

  if (!existing) {
    return input.checked
      ? [
        ...filters,
        {
          facetKey: input.facetKey,
          attributeName: input.attributeName,
          selectedOptionKeys: [input.optionKey],
          selectedOptionValues: [input.optionValue],
        },
      ]
      : filters;
  }

  const selectedOptionKeys = input.checked
    ? Array.from(new Set([...existing.selectedOptionKeys, input.optionKey]))
    : existing.selectedOptionKeys.filter(key => key !== input.optionKey);
  const selectedOptionValues = input.checked
    ? Array.from(new Set([...existing.selectedOptionValues, input.optionValue]))
    : existing.selectedOptionValues.filter(value => value !== input.optionValue);

  if (selectedOptionKeys.length === 0) {
    return filters.filter(filter => filter.facetKey !== input.facetKey);
  }

  return filters.map(filter =>
    filter.facetKey === input.facetKey
      ? {
        ...filter,
        attributeName: input.attributeName,
        selectedOptionKeys,
        selectedOptionValues,
      }
      : filter,
  );
}
