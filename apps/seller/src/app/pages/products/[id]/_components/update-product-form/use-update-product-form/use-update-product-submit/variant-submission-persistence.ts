import { toMinorUnits } from '@arc/utils';
import { ProductVariantTypes } from '@arc/enums/product';
import { shopProductApi } from '~/domains/shop/api/product/product.api';
import type { DetailShopProductResponse } from '~/domains/shop/api/product/contracts/read.contract';
import type {
  ProductVariantConfigurationOption,
  ProductVariantConfigurationVariant,
} from '~/domains/shop/api/product/contracts/variant-configuration.contract';
import type { NoneVariant } from '~/domains/shop/api/product/contracts/form.contract';
import type { VariantEditorSubmission } from '../update-product-form.types';
import {
  flattenPersistedVariantRows,
  variantRowKey,
} from './variant-submission-rows';

export type VariantPersistenceApi = Pick<typeof shopProductApi, 'setVariantConfiguration'>;

type SaveVariantEditorSubmissionInput = {
  api?: VariantPersistenceApi
  detailProduct: DetailShopProductResponse['product']
  expectedProductVersion?: number
  idempotencyKey: () => string
  productId: string
  shopId: string
  submission: VariantEditorSubmission
};

type SaveDefaultVariantConfigurationInput = {
  api?: VariantPersistenceApi
  detailProduct: DetailShopProductResponse['product']
  expectedProductVersion?: number
  idempotencyKey: () => string
  noneVariant: Partial<NoneVariant>
  productId: string
  shopId: string
};

type SubmissionRow = VariantEditorSubmission['rows'][number];
type ExistingVariant = Pick<
  DetailShopProductResponse['product']['variants'][number],
  'id' | 'selections' | 'lifecycle_state'
>;

function findExistingVariant(
  currentProduct: DetailShopProductResponse['product'],
  id: string | undefined,
): ExistingVariant | undefined {
  if (!id) {
    return undefined;
  }

  const topLevelVariant = currentProduct.variants.find(variant => variant.id === id);
  if (topLevelVariant) {
    return topLevelVariant;
  }

  for (const variant of currentProduct.variants) {
    const nestedVariant = variant.variant_options?.find(optionVariant => optionVariant.id === id);
    if (nestedVariant) {
      return {
        id: nestedVariant.id,
        selections: nestedVariant.selections,
        lifecycle_state: nestedVariant.lifecycle_state,
      };
    }
  }

  return undefined;
}

type OptionValueDraft = ProductVariantConfigurationOption['values'][number];

export function isVariantStructureExpansion(
  currentProduct: DetailShopProductResponse['product'],
  submission: VariantEditorSubmission,
) {
  const initialRows = flattenPersistedVariantRows(currentProduct);
  const initialRowsByKey = new Map(
    initialRows.map(row => [variantRowKey(row.optionValue1, row.optionValue2), row]),
  );

  return submission.variantType !== currentProduct.variant_type
    || submission.rows.length > initialRows.length
    || submission.rows.some(row =>
      !row.productVariantId
      && !initialRowsByKey.has(variantRowKey(row.optionValue1, row.optionValue2)),
    );
}

export async function saveDefaultVariantConfiguration({
  api = shopProductApi,
  detailProduct,
  expectedProductVersion,
  idempotencyKey,
  noneVariant,
  productId,
  shopId,
}: SaveDefaultVariantConfigurationInput) {
  if (noneVariant.stock == null || noneVariant.amount == null) {
    throw new Error('Default variant inventory must be reviewed before saving');
  }

  const currentRows = flattenPersistedVariantRows(detailProduct);
  const existingDefaultVariant = detailProduct.variants.find(variant => variant.selections.length === 0);
  const existingDefaultInventory = existingDefaultVariant?.inventory ?? (
    existingDefaultVariant?.id === detailProduct.inventory?.id ? detailProduct.inventory : undefined
  );
  const currency = existingDefaultInventory?.currency ?? currentRows.find(row => row.currency)?.currency ?? 'USD';
  const currentVariantIds = currentRows.length > 0
    ? currentRows.map(row => row.productVariantId)
    : detailProduct.variants.map(variant => variant.id);

  return (await api.setVariantConfiguration(shopId, productId, {
    product_version: expectedProductVersion ?? detailProduct.productVersion,
    idempotency_key: idempotencyKey(),
    options: [],
    variants: [{
      ...(existingDefaultVariant?.id ? { id: existingDefaultVariant.id } : { client_ref: 'default' }),
      selections: [],
      lifecycle_state: existingDefaultVariant?.lifecycle_state ?? 'active',
      inventory: {
        on_hand_quantity: noneVariant.stock,
        expected_on_hand_version: existingDefaultInventory?.onHandVersion,
        sku: noneVariant.sku ?? null,
        amount_minor: toMinorUnits(noneVariant.amount, currency),
        currency,
      },
    }],
    removed_variant_ids: currentVariantIds
      .filter((id): id is string => Boolean(id && id !== existingDefaultVariant?.id)),
  })).product;
}

export async function saveVariantEditorSubmission({
  api = shopProductApi,
  detailProduct,
  expectedProductVersion,
  idempotencyKey,
  productId,
  shopId,
  submission,
}: SaveVariantEditorSubmissionInput) {
  const configuration = buildVariantConfigurationPayload(detailProduct, submission);

  return (await api.setVariantConfiguration(shopId, productId, {
    product_version: expectedProductVersion ?? detailProduct.productVersion,
    idempotency_key: idempotencyKey(),
    ...configuration,
  })).product;
}

function buildVariantConfigurationPayload(
  currentProduct: DetailShopProductResponse['product'],
  submission: VariantEditorSubmission,
) {
  const options = submission.variantType === ProductVariantTypes.SINGLE
    ? [buildOption(currentProduct, 0, submission.variantGroupName ?? currentProduct.options[0]?.name ?? currentProduct.variant_group_name ?? 'Option', submission.rows, 'optionValue1', 'optionValueId1')]
    : [
      buildOption(currentProduct, 0, submission.variantGroupName ?? currentProduct.options[0]?.name ?? currentProduct.variant_group_name ?? 'Option', submission.rows, 'optionValue1', 'optionValueId1'),
      buildOption(currentProduct, 1, submission.variantSubGroupName ?? currentProduct.options[1]?.name ?? currentProduct.variant_sub_group_name ?? 'Option 2', submission.rows, 'optionValue2', 'optionValueId2'),
    ];

  return {
    options,
    variants: submission.rows.map((row, index) => buildVariantPayload({
      currentProduct,
      options,
      row,
      index,
    })),
    removed_variant_ids: removedVariantIds(currentProduct, submission, options),
  };
}

function buildOption(
  currentProduct: DetailShopProductResponse['product'],
  optionIndex: number,
  name: string,
  rows: SubmissionRow[],
  valueField: 'optionValue1' | 'optionValue2',
  valueIdField: 'optionValueId1' | 'optionValueId2',
): ProductVariantConfigurationOption {
  const currentOption = currentProduct.options[optionIndex];
  const seen = new Set<string>();
  const values: OptionValueDraft[] = [];

  rows.forEach((row) => {
    const value = row[valueField]?.trim();
    if (!value) return;

    const key = row[valueIdField] ?? value.toLocaleLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    values.push({
      ...(row[valueIdField] ? { id: row[valueIdField] } : { client_ref: `option-${optionIndex + 1}-value-${values.length + 1}` }),
      value,
      position: values.length + 1,
    });
  });

  return {
    ...(currentOption?.id ? { id: currentOption.id } : { client_ref: `option-${optionIndex + 1}` }),
    name,
    position: optionIndex + 1,
    values,
  };
}

function buildVariantPayload({
  currentProduct,
  index,
  options,
  row,
}: {
  currentProduct: DetailShopProductResponse['product']
  index: number
  options: ProductVariantConfigurationOption[]
  row: SubmissionRow
}): ProductVariantConfigurationVariant {
  const selections = options.map((option, optionIndex) => {
    const rowValueId = optionIndex === 0 ? row.optionValueId1 : row.optionValueId2;
    const rowValue = optionIndex === 0 ? row.optionValue1 : row.optionValue2;
    const value = rowValueId
      ? option.values.find(candidate => candidate.id === rowValueId)
      : option.values.find(candidate => candidate.value === rowValue);

    if (!value) {
      throw new Error('Variant selection value could not be resolved');
    }

    return {
      ...(option.id ? { option_id: option.id } : { option_ref: option.client_ref! }),
      ...(value.id ? { value_id: value.id } : { value_ref: value.client_ref! }),
    };
  });
  const existingVariant = findExistingVariant(currentProduct, row.productVariantId);
  const canRetainIdentity = Boolean(existingVariant)
    && existingVariant!.selections.length === selections.length
    && selections.every(selection => existingVariant!.selections.some(existingSelection =>
      'option_id' in selection
      && 'value_id' in selection
      && existingSelection.option_id === selection.option_id
      && existingSelection.value_id === selection.value_id,
    ));

  return {
    ...(canRetainIdentity ? { id: row.productVariantId } : { client_ref: `variant-${index + 1}` }),
    selections,
    lifecycle_state: row.lifecycleState ?? existingVariant?.lifecycle_state ?? 'active',
    inventory: {
      on_hand_quantity: row.stock,
      expected_on_hand_version: canRetainIdentity ? row.onHandVersion : undefined,
      sku: row.sku ?? null,
      amount_minor: toMinorUnits(row.amount, row.currency ?? currentProduct.inventory?.currency ?? 'USD'),
      currency: row.currency ?? currentProduct.inventory?.currency ?? 'USD',
    },
  };
}

function removedVariantIds(
  currentProduct: DetailShopProductResponse['product'],
  submission: VariantEditorSubmission,
  options: ProductVariantConfigurationOption[],
) {
  const retainedVariantIds = new Set(
    submission.rows
      .filter(row => canRetainSubmittedVariant(currentProduct, row, options))
      .map(row => row.productVariantId!),
  );

  return flattenPersistedVariantRows(currentProduct)
    .map(row => row.productVariantId)
    .filter((id): id is string => Boolean(id && !retainedVariantIds.has(id)));
}

function canRetainSubmittedVariant(
  currentProduct: DetailShopProductResponse['product'],
  row: SubmissionRow,
  options: ProductVariantConfigurationOption[],
) {
  if (!row.productVariantId) return false;

  const existingVariant = findExistingVariant(currentProduct, row.productVariantId);
  if (!existingVariant || existingVariant.selections.length !== options.length) return false;

  const valueIds = [row.optionValueId1, row.optionValueId2].filter((id): id is string => Boolean(id));
  if (valueIds.length !== options.length) return false;

  return valueIds.every(valueId => existingVariant.selections.some(selection => selection.value_id === valueId));
}
