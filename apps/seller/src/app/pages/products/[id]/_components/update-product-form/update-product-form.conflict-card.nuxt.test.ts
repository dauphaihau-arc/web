import { mount } from '@vue/test-utils';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import {
  computed,
  reactive,
  ref,
} from 'vue';
import { ProductStates } from '@arc/enums/product';
import UpdateProductForm from './update-product-form.vue';
import { createUpdateProductSectionStates } from './use-update-product-form/use-update-product-submit/product-section-state';

const reapplyConflictSection = vi.fn();
const refreshProductState = vi.fn();
let sectionScenario: 'version-conflict' | 'duplicate-sku' = 'version-conflict';

vi.mock('./use-update-product-form/use-update-product-form', () => ({
  useUpdateProductForm: () => {
    const sectionStates = reactive(createUpdateProductSectionStates());
    if (sectionScenario === 'version-conflict') {
      sectionStates['product-basic-info'] = {
        status: 'conflict',
        conflict: {
          title: 'Someone updated this section',
          message: 'Your edits are based on an older version. You can overwrite with your edits or refresh to use the latest saved values.',
          reapplyAvailable: true,
        },
      };
    }
    else {
      sectionStates['product-inventory'] = {
        status: 'error',
        errorTitle: 'SKU already in use',
        errorMessage: 'Another product or variant in your shop already uses this SKU. Enter a unique SKU before saving.',
      };
    }

    return {
      btnSubmit: ref(),
      canDeactivateFromDetail: computed(() => true),
      canPublishFromDetail: computed(() => true),
      countValidate: ref(0),
      dataDetailProduct: ref({ product: { id: 'product-1' } }),
      disabledButtonSubmit: ref(false),
      fileImages: ref([]),
      formatStateLabel: () => 'Active',
      idsImageForDelete: ref([]),
      isVariantProduct: computed(() => false),
      isVariantsDirty: ref(false),
      loadingAction: ref(null),
      loadingRefreshSection: ref(null),
      loadingSubmit: ref(false),
      noneVariant: reactive({}),
      onChangeVariants: vi.fn(),
      onChangeVariantType: vi.fn(),
      onError: vi.fn(),
      onSubmit: vi.fn(),
      productState: computed(() => ProductStates.ACTIVE),
      publishImageError: computed(() => ''),
      reapplyConflictSection,
      refreshProductState,
      sectionStateLabel: () => 'Needs review',
      sectionStates,
      stateSubmit: reactive({}),
      stateTone: () => 'green',
      submitWithAction: vi.fn(),
      validateForm: vi.fn(() => []),
      variantSubmission: ref(undefined),
    };
  },
}));

const componentStubs = {
  FormGroupCard: {
    template: '<section><slot name="title" /><slot name="subtitle" /><slot name="content" /></section>',
  },
  ImagesInput: true,
  NoneVariantInput: true,
  ProductFormSectionNav: true,
  SearchCategoryInput: true,
  SelectAttributesInput: true,
  StatusBadge: {
    template: '<span><slot /></span>',
  },
  TagsInput: true,
  UButton: {
    props: ['loading'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  },
  UForm: {
    template: '<form><slot /></form>',
  },
  UFormGroup: {
    template: '<div><slot /></div>',
  },
  UInput: true,
  USelectMenu: true,
  UTextarea: true,
  UpdateProductFormActions: true,
  VariantInput: true,
};

describe('update product conflict card', () => {
  beforeEach(() => {
    sectionScenario = 'version-conflict';
    reapplyConflictSection.mockClear();
    refreshProductState.mockClear();
  });

  it('shows explicit overwrite and refresh actions for product version conflicts', async () => {
    const wrapper = mount(UpdateProductForm, {
      global: {
        stubs: componentStubs,
      },
    });

    expect(wrapper.text()).toContain('Someone updated this section');
    expect(wrapper.text()).toContain('Your edits are based on an older version. You can overwrite with your edits or refresh to use the latest saved values.');
    expect(wrapper.text()).toContain('Keep my edits and save');
    expect(wrapper.text()).toContain('Refresh section');

    await wrapper.findAll('button').find(button => button.text() === 'Keep my edits and save')!.trigger('click');
    expect(reapplyConflictSection).toHaveBeenCalledWith('product-basic-info', expect.any(Object));

    await wrapper.findAll('button').find(button => button.text() === 'Refresh section')!.trigger('click');
    expect(refreshProductState).toHaveBeenCalledWith('product-basic-info');
  });

  it('shows duplicate SKU conflicts as inventory validation errors', () => {
    sectionScenario = 'duplicate-sku';
    const wrapper = mount(UpdateProductForm, {
      global: {
        stubs: componentStubs,
      },
    });

    expect(wrapper.text()).toContain('SKU already in use');
    expect(wrapper.text()).toContain('Another product or variant in your shop already uses this SKU. Enter a unique SKU before saving.');
    expect(wrapper.text()).not.toContain('Keep my edits and save');
  });
});
