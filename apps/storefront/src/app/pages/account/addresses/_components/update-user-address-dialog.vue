<script setup lang="ts">
import { ADDRESS_CONFIG } from '@arc/enums/address'
import PhoneInput from '~/domains/me/ui/address/phone-input.vue'
import LegacySubdivisionField from '~/domains/me/ui/address/legacy-subdivision-field.vue'
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
  selectedCountryCode,
  hasAdministrativeAreas,
  postalCodeRequired,
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
      <UFormGroup
        required
        label="Full Name"
        name="full_name"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.full_name"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_FULL_NAME"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Street"
        name="address_1"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.address_1"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_ADDRESS"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        label="Apt / Suite / Other"
        name="address_2"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.address_2"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_ADDRESS"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="City"
        name="city"
        class="mb-4"
      >
        <UInput
          v-model="stateSubmit.city"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_CITY"
          size="lg"
        />
      </UFormGroup>
      <UFormGroup
        required
        label="Country"
        name="country_code"
        class="mb-4"
      >
        <USelectMenu
          v-model="stateSubmit.country_code"
          searchable
          :disabled="isPendingGetCountries"
          :placeholder="stateSubmit.country"
          :options="dataGetCountries ?? []"
          value-attribute="code"
          option-attribute="name"
          size="lg"
          @update:model-value="onCountryChange"
        />
      </UFormGroup>

      <div class="mb-4 flex gap-3">
        <UFormGroup
          :required="hasAdministrativeAreas && !isLegacySubdivision"
          label="State/Province"
          :name="subdivisionFieldName"
          class="w-1/2"
        >
          <LegacySubdivisionField
            v-if="readOnlySubdivisionLabel"
            :value="readOnlySubdivisionLabel ?? ''"
            :action-label="isLegacySubdivision ? 'Choose from list' : undefined"
            @choose="startChoosingSubdivision"
          />
          <USelectMenu
            v-else-if="hasAdministrativeAreas"
            v-model="stateSubmit.state_code"
            searchable
            :disabled="!selectedCountryCode || isPendingGetStates"
            :placeholder="stateSubmit.state"
            :options="dataGetAdministrativeAreas ?? []"
            value-attribute="code"
            option-attribute="name"
            size="lg"
            trailing
            @update:model-value="onStateCodeChange"
          />
          <UInput
            v-else
            v-model="stateSubmit.state_text"
            name="state_text"
            :disabled="!selectedCountryCode && !stateSubmit.country"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_CITY"
            size="lg"
            @update:model-value="onStateTextChange"
          />
        </UFormGroup>
        <UFormGroup
          :required="postalCodeRequired"
          :label="postalCodeRequired ? 'Zip/Postal code' : 'Zip/Postal code (optional)'"
          name="zip"
          class="w-1/2"
        >
          <UInput
            v-model="stateSubmit.zip"
            name="zip"
            :maxlength="ADDRESS_CONFIG.MAX_CHAR_ZIP"
            size="lg"
          />
        </UFormGroup>
      </div>
      <UFormGroup
        required
        label="Phone"
        name="phone"
        class="mb-4"
      >
        <PhoneInput
          v-model="stateSubmit.phone"
          name="phone"
          :country-code="selectedCountryCode"
          :maxlength="ADDRESS_CONFIG.MAX_CHAR_PHONE"
          size="lg"
        />
      </UFormGroup>

      <UCheckbox
        v-model="stateSubmit.is_primary"
        label="Set as default"
        name="is_primary"
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
