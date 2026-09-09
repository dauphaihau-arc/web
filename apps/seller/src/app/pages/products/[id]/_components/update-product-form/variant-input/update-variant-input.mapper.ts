// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/naming-convention */
import { ProductVariantTypes } from '@arc/enums/product';
import type { VariantEditorSubmission } from '../use-update-product-form/update-product-form.types';
import type {
  UpdateVariantInputState,
  UpdateVariantTable,
  VariantEditorProduct,
} from './update-variant-input.types';
import { DEFAULT_UPDATE_VARIANT_TABLE } from './update-variant-input.constants';

export function generateUpdateVariantOptionId() {
  return new Date().getTime().toString();
}

export function trackDeletedVariantOption(
  state: Pick<UpdateVariantInputState, 'variantIdsDelete' | 'variantsCurrent'>,
  id: number | string,
) {
  if (state.variantsCurrent.has(id)) {
    state.variantIdsDelete.push(id);
  }
}

export function createDefaultUpdateVariantTable(
  overrides: Partial<UpdateVariantTable> = {},
): UpdateVariantTable {
  return {
    ...DEFAULT_UPDATE_VARIANT_TABLE,
    ...overrides,
  };
}

function getVariantSelection(
  product: VariantEditorProduct,
  selections: VariantEditorProduct['variants'][number]['selections'],
  optionIndex: number,
) {
  const optionId = product.options[optionIndex]?.id;

  return optionId
    ? selections.find(selection => selection.option_id === optionId)
    : selections[optionIndex];
}

export function hydrateUpdateVariantInput(
  product: VariantEditorProduct,
  state: UpdateVariantInputState,
  openSubVariant: () => void,
) {
  const { variant_type, variant_group_name: variantGroupName, variants } = product;

  state.variants = variants.map((variant) => {
    state.variantsCurrent.set(variant.id, variant.variant_name);
    state.variantsCurrent.set(variant.variant_name, variant.id);
    return {
      id: variant.id,
      variant_name: variant.variant_name,
      errorMsg: '',
    };
  });

  if (variant_type === ProductVariantTypes.SINGLE) {
    state.variant_group_name = variantGroupName;
    return variants.map((variant, index) => ({
      id: index + 1,
      variant_option_id: variant.id,
      productVariantId: variant.id,
      optionId1: variant.selections[0]?.option_id,
      optionValueId1: variant.selections[0]?.value_id,
      inventoryId: variant.inventory.id,
      variant_name: variant.variant_name || '',
      amount: variant.inventory.amount,
      stock: variant.inventory.stock,
      onHandVersion: variant.inventory.onHandVersion,
      lifecycleState: variant.lifecycle_state,
      sku: variant.inventory?.sku || '',
      currency: variant.inventory?.currency,
      isUpdated: false,
      errorAmount: '',
      errorStock: '',
    }));
  }

  if (variant_type === ProductVariantTypes.COMBINE) {
    state.variant_group_name = variantGroupName;
    state.variant_sub_group_name = product.variant_sub_group_name;
    openSubVariant();
    const subVariantsById = new Map<number | string, {
      id: number | string
      variant_name: string
      errorMsg: string
    }>();
    variants.forEach((variant) => {
      variant.variant_options?.forEach((variantOpt) => {
        if (!subVariantsById.has(variantOpt.variant.id)) {
          state.variantsCurrent.set(variantOpt.variant.id, variantOpt.variant.variant_name);
          state.variantsCurrent.set(variantOpt.variant.variant_name, variantOpt.variant.id);
          subVariantsById.set(variantOpt.variant.id, {
            id: variantOpt.variant.id,
            variant_name: variantOpt.variant.variant_name,
            errorMsg: '',
          });
        }
      });
    });
    state.subVariants = Array.from(subVariantsById.values());

    let id = 0;
    const initVariantsTable: UpdateVariantTable[] = [];
    variants.forEach((variant) => {
      variant.variant_options?.forEach((variantOpt) => {
        const selections = variantOpt.selections?.length
          ? variantOpt.selections
          : variant.selections;
        const primarySelection = getVariantSelection(product, selections, 0);
        const secondarySelection = getVariantSelection(product, selections, 1);
        id++;
        initVariantsTable.push({
          id,
          variant_option_id: variant.id,
          variant_name: variant.variant_name || '',
          sub_variant_option_id: variantOpt.variant.id,
          sub_variant_name: variantOpt.variant.variant_name,
          productVariantId: variantOpt.id,
          optionId1: primarySelection?.option_id,
          optionValueId1: primarySelection?.value_id,
          optionId2: secondarySelection?.option_id,
          optionValueId2: secondarySelection?.value_id,
          subVariantId: variantOpt.id,
          inventoryId: variantOpt.inventory.id,
          amount: variantOpt.inventory.amount,
          stock: variantOpt.inventory.stock,
          onHandVersion: variantOpt.inventory.onHandVersion,
          lifecycleState: variantOpt.lifecycle_state,
          sku: variantOpt.inventory?.sku || '',
          currency: variantOpt.inventory?.currency,
          errorAmount: '',
          errorStock: '',
        });
      });
    });

    return initVariantsTable;
  }

  return [createDefaultUpdateVariantTable({
    amount: product.inventory?.amount,
    stock: 0,
    sku: product.inventory?.sku || '',
    sourceSku: product.inventory?.sku || '',
    currency: product.inventory?.currency,
  })];
}

export function mixUpdateVariantsTable(
  state: Pick<UpdateVariantInputState, 'variants' | 'subVariants' | 'variantsCurrent'>,
  variantsTable: UpdateVariantTable[],
) {
  let id = 0;
  const newVariantsTable: UpdateVariantTable[] = [];

  state.variants.forEach((stateVariant) => {
    state.subVariants.forEach((stateSubVariant) => {
      id++;
      const result = variantsTable.find(
        variant => variant.variant_option_id === stateVariant.id
          && variant.sub_variant_option_id === stateSubVariant.id,
      ) ?? variantsTable.find(
        variant => variant.variant_name === stateVariant.variant_name
          && variant.sub_variant_name === stateSubVariant.variant_name,
      );

      const parentSource = variantsTable.find(
        variant => variant.variant_option_id === stateVariant.id
          || variant.variant_name === stateVariant.variant_name,
      );
      const resultAmount = result?.amount;
      const resultCurrency = result?.currency ?? parentSource?.currency;
      const resultSku = result?.sku;

      newVariantsTable.push({
        id,
        variant_option_id: stateVariant.id,
        variant_name: stateVariant.variant_name || '',
        sourceSku: parentSource?.sourceSku ?? parentSource?.sku,
        sub_variant_option_id: stateSubVariant.id,
        sub_variant_name: stateSubVariant.variant_name || '',
        subVariantId: result?.subVariantId ?? null,
        productVariantId: result?.productVariantId ?? null,
        optionId1: result?.optionId1 ?? parentSource?.optionId1,
        optionValueId1: result?.optionValueId1 ?? parentSource?.optionValueId1,
        optionId2: result?.optionId2,
        optionValueId2: result?.optionValueId2,
        inventoryId: result?.inventoryId ?? null,
        amount: resultAmount,
        stock: result?.stock,
        onHandVersion: result?.onHandVersion,
        lifecycleState: result?.lifecycleState,
        sku: resultSku,
        currency: resultCurrency,
        errorAmount: '',
        errorStock: '',
      });
    });
  });

  return newVariantsTable;
}

export function generateExpandedSku(
  baseSku: string | undefined,
  optionValue: string,
  sourceSubVariantName?: string,
) {
  if (!baseSku || sourceSubVariantName) {
    return '';
  }

  const suffix = optionValue
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return suffix ? `${baseSku}-${suffix}` : baseSku;
}

export function buildVariantEditorSnapshot(
  state: UpdateVariantInputState,
  variantsTable: UpdateVariantTable[],
) {
  return JSON.stringify({
    isActiveSubVariant: state.isActiveSubVariant,
    variantGroupName: state.variant_group_name ?? '',
    variantSubGroupName: state.variant_sub_group_name ?? '',
    variants: state.variants.map(({ id, variant_name: variantName }) => ({
      id,
      variantName,
    })),
    subVariants: state.subVariants.map(({ id, variant_name: variantName }) => ({
      id,
      variantName,
    })),
    variantIdsDelete: state.variantIdsDelete,
    inventory: variantsTable.map(row => ({
      id: row.id,
      variantOptionId: row.variant_option_id,
      subVariantOptionId: row.sub_variant_option_id,
      inventoryId: row.inventoryId,
      variantName: row.variant_name ?? '',
      subVariantName: row.sub_variant_name ?? '',
      amount: row.amount,
      stock: row.stock,
      sku: row.sku ?? '',
      currency: row.currency,
    })),
  });
}

function persistedVariantOptionId(id: unknown) {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : undefined;
}

export function buildVariantEditorSubmission(
  state: UpdateVariantInputState,
  variantsTable: UpdateVariantTable[],
): VariantEditorSubmission {
  return {
    variantType: state.isActiveSubVariant
      ? ProductVariantTypes.COMBINE
      : ProductVariantTypes.SINGLE,
    variantGroupName: state.variant_group_name,
    variantSubGroupName: state.variant_sub_group_name,
    rows: variantsTable.map(row => ({
      optionValue1: row.variant_name ?? '',
      optionValue2: state.isActiveSubVariant
        ? row.sub_variant_name ?? ''
        : undefined,
      productVariantId: row.productVariantId ?? (
        state.isActiveSubVariant
          ? persistedVariantOptionId(row.subVariantId)
          : persistedVariantOptionId(row.variant_option_id)
      ),
      optionId1: row.optionId1,
      optionValueId1: row.optionValueId1,
      optionId2: row.optionId2,
      optionValueId2: row.optionValueId2,
      inventoryId: row.inventoryId ?? undefined,
      amount: row.amount!,
      stock: row.stock!,
      onHandVersion: row.onHandVersion,
      lifecycleState: row.lifecycleState,
      sku: row.sku || undefined,
      currency: row.currency,
    })),
  };
}
