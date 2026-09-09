import type { Ref } from 'vue';
import { toastCustom } from '~/shared/config/toast';
import { useAuthClientConfig } from '~/domains/auth/queries/client-config.query';
import { useGenerateProductDescription } from '~/domains/shop/mutations/generate-product-description.mutation';
import type { StateSubmit } from '~/domains/shop/api/product/contracts/form.contract';

type TitleInputRef = Ref<{
  input?: {
    focus: () => void
    scrollIntoView: (options?: ScrollIntoViewOptions) => void
  }
} | undefined>;

export function useCreateProductAiDescription({
  stateSubmit,
  titleInputRef,
}: {
  stateSubmit: StateSubmit
  titleInputRef: TitleInputRef
}) {
  const toast = useToast();
  const { data: authClientConfig } = useAuthClientConfig();

  const {
    mutateAsync: generateProductDescription,
    isPending: generatingDescription,
  } = useGenerateProductDescription();

  const isAiDescriptionEnabled = computed(() =>
    authClientConfig.value?.ai.product_description_enabled ?? false,
  );
  const canGenerateDescription = computed(() =>
    isAiDescriptionEnabled.value && Boolean(stateSubmit.title?.trim()),
  );

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

  return {
    canGenerateDescription,
    generatingDescription,
    isAiDescriptionEnabled,
    onGenerateDescription,
  };
}
