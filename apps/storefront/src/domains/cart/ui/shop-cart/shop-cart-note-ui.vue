<script setup lang="ts">
import { ORDER_CONFIG } from '@arc/enums/order'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

const props = withDefaults(defineProps<{
  shopName?: string
  disabled?: boolean
}>(), {
  shopName: undefined,
  disabled: false,
})

const note = defineModel<string>('note', { required: true })
const showInput = defineModel<boolean>('showInput', { required: true })
</script>

<template>
  <div>
    <UButton
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['notepadText']"
      color="gray"
      :disabled="props.disabled"
      class="mb-2 w-fit"
      @click="showInput = !showInput"
    >
      Add a note to {{ props.shopName }}
    </UButton>

    <UTextarea
      v-if="showInput"
      v-model="note"
      autoresize
      :maxlength="ORDER_CONFIG.MAX_CHAR_NOTE"
      :rows="3"
      size="lg"
    />
  </div>
</template>
