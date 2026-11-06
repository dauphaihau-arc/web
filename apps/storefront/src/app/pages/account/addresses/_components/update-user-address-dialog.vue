<script setup lang="ts">
import AddressFormFields from '~/domains/me/ui/address/address-form-fields.vue'
import {
  type UserAddress,
  useUpdateUserAddressForm,
} from './use-update-user-address-form'

const props = defineProps<{ dataEdit: UserAddress }>()

const {
  formRef,
  stateSubmit,
  schema,
  dataGetCountries,
  isPendingGetCountries,
  dataGetAdministrativeAreas,
  isPendingGetStates,
  hasAdministrativeAreas,
  postalCodeRequired,
  fieldRules,
  selectedCountryCode,
  subdivisionFieldName,
  isLegacySubdivision,
  readOnlySubdivisionLabel,
  onCountryChange,
  onStateCodeChange,
  onStateTextChange,
  startChoosingSubdivision,
  isPendingUpdateAddress,
  onSubmit,
  dialog,
} = useUpdateUserAddressForm(props.dataEdit)
</script>

<template>
  <BaseDialog
    :ui="{
      modal: {
        inner: '-top-10',
      },
    }"
    title="Update address"
  >
    <UForm
      ref="formRef"
      :validate-on="['submit']"
      :state="stateSubmit"
      :schema="schema"
      @submit="onSubmit"
    >
      <AddressFormFields
        v-model:state="stateSubmit"
        :fields="fieldRules"
        :country-code="selectedCountryCode"
        :countries="dataGetCountries"
        :is-pending-countries="isPendingGetCountries"
        :areas="dataGetAdministrativeAreas"
        :is-fetching-areas="isPendingGetStates"
        :has-administrative-areas="hasAdministrativeAreas"
        :postal-code-required="postalCodeRequired"
        :subdivision-field-name="subdivisionFieldName"
        :is-legacy-subdivision="isLegacySubdivision"
        :read-only-subdivision-label="readOnlySubdivisionLabel"
        @country-change="onCountryChange"
        @state-code-change="onStateCodeChange"
        @state-text-change="onStateTextChange"
        @choose-subdivision="startChoosingSubdivision"
      />
    </UForm>

    <template #footer>
      <DialogActions>
        <UButton
          size="md"
          color="gray"
          :disabled="isPendingUpdateAddress"
          @click="dialog.close"
        >
          Cancel
        </UButton>
        <UButton
          size="md"
          type="submit"
          :loading="isPendingUpdateAddress"
          @click="formRef?.submit"
        >
          Save
        </UButton>
      </DialogActions>
    </template>
  </BaseDialog>
</template>
