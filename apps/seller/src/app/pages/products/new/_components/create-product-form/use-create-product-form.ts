import {
  ProductStates,
  ProductVariantTypes,
  productWhoMadeOpts,
} from '@arc/enums/product';
import { useCreateProductSubmit } from './use-create-product-submit';
import { PRODUCT_FORM_ERROR_PRIORITY } from './create-product-form.constants';
import {
  createProductFormSchema,
  createProductInventoryFormSchema,
} from '~/app/pages/products/_schemes/product/create-product-form.schema';
import { toastCustom } from '~/shared/config/toast';
import { useAuthClientConfig } from '~/domains/auth/queries/client-config.query';
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';
import { useGenerateProductDescription } from '~/domains/shop/mutations/generate-product-description.mutation';
import type { FormError, FormErrorEvent, FormSubmitEvent } from '#ui/types';
import type {
  CreateProductBody,
  CreateProductShipping,
  StateCombineVariant,
  StateNoneVariant,
  StateSingleVariant,
  StateSubmit,
} from '~/domains/shop/api/product/contracts/form.contract';

export function useCreateProductForm() {
  const toast = useToast();
  const { data: authClientConfig } = useAuthClientConfig();
  const { data: myShop } = useGetMyShop();

  const fileImages = ref<File[]>([]);
  const titleInputRef = ref();
  const isProductHaveVariants = ref(false);
  const btnSubmitRef = ref();
  const enabledButtonSubmit = ref(false);
  const countValidate = ref(0);
  const shipping = ref<CreateProductShipping | undefined>();

  const noneVariant = reactive<StateNoneVariant>({
    stock: 1,
  });

  const singleVariant = reactive<StateSingleVariant>({});
  const combineVariant = reactive<StateCombineVariant>({});

  const stateSubmit = reactive<StateSubmit>({
    who_made: productWhoMadeOpts[0].id,
    is_digital: false,
    state: ProductStates.ACTIVE,
    variant_type: ProductVariantTypes.NONE,
    attributes: [],
    tags: [],
  });

  const hasImages = computed(() => fileImages.value.length > 0);
  const shopCurrency = computed(() => myShop.value?.currency ?? 'USD');
  const isAiDescriptionEnabled = computed(() =>
    authClientConfig.value?.ai.product_description_enabled ?? false,
  );
  const canGenerateDescription = computed(() =>
    isAiDescriptionEnabled.value && Boolean(stateSubmit.title?.trim()),
  );

  const {
    loadingSubmit,
    submit,
  } = useCreateProductSubmit({
    fileImages,
    shipping,
    shopCurrency,
    noneVariant,
    singleVariant,
    combineVariant,
    stateSubmit,
  });

  const {
    mutateAsync: generateProductDescription,
    isPending: generatingDescription,
  } = useGenerateProductDescription();

  const validateForm = (values: CreateProductBody): FormError[] => {
    let errors: FormError[] = [];
    countValidate.value++;

    const result = createProductFormSchema.safeParse(values);
    if (!result.success) {
      errors = result.error.issues.map((detail) => {
        const path = detail.path.at(-1);
        return {
          path: typeof path === 'string' ? path : '',
          message: detail.message,
        };
      });
    }
    return errors;
  };

  async function onSubmit(event: FormSubmitEvent<CreateProductBody>) {
    await submit(event.data);
  }

  async function onGenerateDescription() {
    if (!canGenerateDescription.value) {
      titleInputRef.value?.input?.focus();
      titleInputRef.value?.input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.add({
        ...toastCustom.error,
        title: 'Add a product title first',
      });
      return;
    }

    try {
      const response = await generateProductDescription({
        title: stateSubmit.title?.trim() ?? '',
        category_id: stateSubmit.category_id,
        who_made: stateSubmit.who_made,
        is_digital: stateSubmit.is_digital,
        variant_type: stateSubmit.variant_type,
        tags: stateSubmit.tags?.filter(Boolean),
        attributes: stateSubmit.attributes?.map(attribute => ({
          category_attribute_id: attribute.attribute_id,
          selected_option_id: attribute.selected,
        })),
      });

      stateSubmit.description = response.description;
    }
    catch {
      toast.add({
        ...toastCustom.error,
        title: 'Generate description failed',
      });
    }
  }

  function onErrorFrom(event: FormErrorEvent) {
    event.errors.sort((currentError, nextError) =>
      PRODUCT_FORM_ERROR_PRIORITY.indexOf(nextError.path) - PRODUCT_FORM_ERROR_PRIORITY.indexOf(currentError.path),
    );

    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  watchDebounced(
    () => [stateSubmit, noneVariant, fileImages.value, shipping],
    () => {
      const baseParsed = createProductFormSchema.safeParse(stateSubmit);
      const conditions = [baseParsed.success, shipping.value];

      if (stateSubmit.variant_type === ProductVariantTypes.NONE) {
        const resultParsed = createProductInventoryFormSchema.safeParse(noneVariant);
        conditions.push(resultParsed.success);
      }
      enabledButtonSubmit.value = conditions.every(Boolean);
    },
    { debounce: 500, maxWait: 1000, deep: true },
  );

  watch(isProductHaveVariants, () => {
    if (isProductHaveVariants.value) {
      noneVariant.amount = undefined;
      noneVariant.stock = 1;
    }
    stateSubmit.variant_type = isProductHaveVariants.value
      ? ProductVariantTypes.SINGLE
      : ProductVariantTypes.NONE;
  });

  return {
    btnSubmitRef,
    canGenerateDescription,
    combineVariant,
    countValidate,
    enabledButtonSubmit,
    fileImages,
    generatingDescription,
    hasImages,
    isAiDescriptionEnabled,
    isProductHaveVariants,
    loadingSubmit,
    noneVariant,
    onErrorFrom,
    onGenerateDescription,
    onSubmit,
    shipping,
    shopCurrency,
    singleVariant,
    stateSubmit,
    titleInputRef,
    validateForm,
  };
}
