import {
  ProductStates,
  ProductVariantTypes,
  productWhoMadeOpts,
} from '@arc/enums/product';
import { ShippingProfileStatuses } from '@arc/enums/shipping';
import { useCreateProductAiDescription } from './use-create-product-ai-description';
import { useCreateProductSubmit } from './use-create-product-submit';
import { useCreateProductSubmitState } from './use-create-product-submit-state';
import { useCreateProductVariantState } from './use-create-product-variant-state';
import { PRODUCT_FORM_ERROR_PRIORITY } from '../create-product-form.constants';
import { useGetMyShop } from '~/domains/shop/queries/my-shop.query';
import { SHIPPING_PROFILE_PICKER_QUERY, useShopShippingProfiles } from '~/domains/shop/queries/shipping-profiles.query';
import type { FormErrorEvent } from '#ui/types';
import type { StateSubmit } from '~/domains/shop/api/product/contracts/form.contract';

export function useCreateProductForm() {
  const { data: myShop } = useGetMyShop();
  const { data: shippingProfiles } = useShopShippingProfiles(ref(SHIPPING_PROFILE_PICKER_QUERY));

  const fileImages = ref<File[]>([]);
  const titleInputRef = ref();
  const btnSubmitRef = ref();
  const shippingProfileId = ref<string>();

  /**
   * Creating a Product starts from the shop's Default Shipping Profile when
   * there is a usable one, so the common case needs no selection. The
   * designation is never an assignment: with no usable default the seller
   * chooses a profile explicitly, exactly as before, and a choice already made
   * is never overwritten.
   */
  watch(shippingProfiles, (result) => {
    if (shippingProfileId.value) {
      return;
    }

    const defaultProfile = (result?.results ?? []).find(profile =>
      profile.is_default
      && profile.checkout_ready
      && profile.status === ShippingProfileStatuses.ACTIVE);

    if (defaultProfile) {
      shippingProfileId.value = defaultProfile.id;
    }
  }, { immediate: true });

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
  const selectedShippingProfile = computed(() =>
    shippingProfiles.value?.results.find(profile => profile.id === shippingProfileId.value),
  );
  const isShippingReadyForPublish = computed(() =>
    stateSubmit.is_digital
    || Boolean(
      selectedShippingProfile.value?.checkout_ready
      && selectedShippingProfile.value.status === ShippingProfileStatuses.ACTIVE,
    ),
  );

  const {
    combineVariant,
    isProductHaveVariants,
    noneVariant,
    singleVariant,
  } = useCreateProductVariantState({
    stateSubmit,
  });

  const {
    loadingSubmit,
    submit,
  } = useCreateProductSubmit({
    fileImages,
    shippingProfileId,
    shopCurrency,
    noneVariant,
    singleVariant,
    combineVariant,
    stateSubmit,
  });

  const {
    canGenerateDescription,
    generatingDescription,
    isAiDescriptionEnabled,
    onGenerateDescription,
  } = useCreateProductAiDescription({
    stateSubmit,
    titleInputRef,
  });

  const {
    countValidate,
    enabledButtonSubmit,
    onSubmit,
    validateForm,
  } = useCreateProductSubmitState({
    fileImages,
    hasImages,
    loadingSubmit,
    noneVariant,
    shippingProfileId,
    stateSubmit,
    submit,
  });

  function onErrorFrom(event: FormErrorEvent) {
    event.errors.sort((currentError, nextError) =>
      PRODUCT_FORM_ERROR_PRIORITY.indexOf(nextError.path) - PRODUCT_FORM_ERROR_PRIORITY.indexOf(currentError.path),
    );

    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

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
    isShippingReadyForPublish,
    loadingSubmit,
    noneVariant,
    onErrorFrom,
    onGenerateDescription,
    onSubmit,
    shippingProfileId,
    shopCurrency,
    singleVariant,
    stateSubmit,
    titleInputRef,
    validateForm,
  };
}
