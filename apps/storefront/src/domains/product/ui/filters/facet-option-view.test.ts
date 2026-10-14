import { describe, expect, it } from 'vitest';
import { toggleFacetSelection, buildFacetOptionView } from './facet-option-view';

/** Facet response shapes as the API returns them (snake_case keys). */
const baselineColor = {
  facet_key: 'color',
  attribute_name: 'Color',
  options: [
    { option_key: 'black', value: 'Black' },
    { option_key: 'white', value: 'White' },
  ],
};

const baselineMaterial = {
  facet_key: 'material',
  attribute_name: 'Material',
  options: [
    { option_key: 'cotton', value: 'Cotton' },
    { option_key: 'linen', value: 'Linen' },
  ],
};

describe('buildFacetOptionView', () => {
  it('keeps baseline options visible and disables those absent from the filtered availability', () => {
    const facets = buildFacetOptionView({
      baselineFacets: [baselineColor, baselineMaterial],
      filteredFacets: [
        { ...baselineColor, options: [{ option_key: 'black', value: 'Black' }] },
        { ...baselineMaterial, options: [{ option_key: 'cotton', value: 'Cotton' }] },
      ],
      selections: [],
      hasFilteredAvailability: true,
    });

    expect(facets).toEqual([
      {
        facetKey: 'color',
        attributeName: 'Color',
        options: [
          { optionKey: 'black', value: 'Black', disabled: false },
          { optionKey: 'white', value: 'White', disabled: true },
        ],
      },
      {
        facetKey: 'material',
        attributeName: 'Material',
        options: [
          { optionKey: 'cotton', value: 'Cotton', disabled: false },
          { optionKey: 'linen', value: 'Linen', disabled: true },
        ],
      },
    ]);
  });

  it('keeps a selected option enabled even when the filtered availability omits it', () => {
    const facets = buildFacetOptionView({
      baselineFacets: [baselineColor],
      filteredFacets: [{ ...baselineColor, options: [{ option_key: 'black', value: 'Black' }] }],
      selections: [
        {
          facetKey: 'color',
          attributeName: 'Color',
          selectedOptionKeys: ['white'],
          selectedOptionValues: ['White'],
        },
      ],
      hasFilteredAvailability: true,
    });

    expect(facets).toEqual([
      {
        facetKey: 'color',
        attributeName: 'Color',
        options: [
          { optionKey: 'black', value: 'Black', disabled: false },
          { optionKey: 'white', value: 'White', disabled: false },
        ],
      },
    ]);
  });

  it('disables unselected options while the filtered availability is unknown', () => {
    const facets = buildFacetOptionView({
      baselineFacets: [baselineColor],
      filteredFacets: [],
      selections: [
        {
          facetKey: 'color',
          attributeName: 'Color',
          selectedOptionKeys: ['white'],
          selectedOptionValues: ['White'],
        },
      ],
      hasFilteredAvailability: false,
    });

    expect(facets[0]?.options).toEqual([
      { optionKey: 'black', value: 'Black', disabled: true },
      { optionKey: 'white', value: 'White', disabled: false },
    ]);
  });

  it('appends a selected option that the baseline does not contain', () => {
    const facets = buildFacetOptionView({
      baselineFacets: [baselineColor],
      filteredFacets: [{ ...baselineColor, options: [] }],
      selections: [
        {
          facetKey: 'color',
          attributeName: 'Color',
          selectedOptionKeys: ['beige'],
          selectedOptionValues: ['Beige'],
        },
      ],
      hasFilteredAvailability: true,
    });

    expect(facets[0]?.options).toEqual([
      { optionKey: 'black', value: 'Black', disabled: true },
      { optionKey: 'white', value: 'White', disabled: true },
      { optionKey: 'beige', value: 'Beige', disabled: false },
    ]);
  });

  it('renders a selected facet that the baseline does not contain', () => {
    const facets = buildFacetOptionView({
      baselineFacets: [],
      filteredFacets: [],
      selections: [
        {
          facetKey: 'size',
          attributeName: 'Size',
          selectedOptionKeys: ['m'],
          selectedOptionValues: ['M'],
        },
      ],
      hasFilteredAvailability: true,
    });

    expect(facets).toEqual([
      {
        facetKey: 'size',
        attributeName: 'Size',
        options: [{ optionKey: 'm', value: 'M', disabled: false }],
      },
    ]);
  });
});

describe('toggleFacetSelection', () => {
  const colorFilter = {
    facetKey: 'color',
    attributeName: 'Color',
    selectedOptionKeys: ['black'],
    selectedOptionValues: ['Black'],
  };

  it('creates a facet entry when the first option is checked', () => {
    expect(toggleFacetSelection([], {
      facetKey: 'color',
      attributeName: 'Color',
      optionKey: 'black',
      optionValue: 'Black',
      checked: true,
    })).toEqual([colorFilter]);
  });

  it('unions a checked option into the existing facet entry', () => {
    expect(toggleFacetSelection([colorFilter], {
      facetKey: 'color',
      attributeName: 'Color',
      optionKey: 'white',
      optionValue: 'White',
      checked: true,
    })).toEqual([
      {
        ...colorFilter,
        selectedOptionKeys: ['black', 'white'],
        selectedOptionValues: ['Black', 'White'],
      },
    ]);
  });

  it('drops the facet entry once its last option is unchecked', () => {
    expect(toggleFacetSelection([colorFilter], {
      facetKey: 'color',
      attributeName: 'Color',
      optionKey: 'black',
      optionValue: 'Black',
      checked: false,
    })).toEqual([]);
  });

  it('leaves the list untouched when unchecking an option that is not selected', () => {
    const filters = [colorFilter];

    expect(toggleFacetSelection(filters, {
      facetKey: 'color',
      attributeName: 'Color',
      optionKey: 'white',
      optionValue: 'White',
      checked: false,
    })).toEqual([colorFilter]);
  });
});
