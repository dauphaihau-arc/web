<script lang="ts" setup>
const props = defineProps<{
  label: string
  active?: boolean
  value?: string
}>()

defineEmits<{
  clear: []
}>()
</script>

<template>
  <div
    class="inline-flex min-h-[32px] cursor-pointer select-none items-center rounded-full border bg-white pr-1 transition-colors"
    :class="
      props.active
        ? 'border-slate-200 text-slate-900 shadow-sm'
        : 'border-dashed border-slate-300 text-slate-700 hover:border-slate-400'
    "
  >
    <UButton
      v-if="props.active"
      color="gray"
      variant="ghost"
      size="sm"
      square
      padded
      :ui="{
        rounded: 'rounded-full',
      }"
      @click.stop="$emit('clear')"
    >
      <template #leading>
        <AppIcon
          name="xCircle"
          size="xs"
        />
      </template>
    </UButton>

    <UButton
      v-else
      color="gray"
      variant="ghost"
      size="sm"
      square
      tabindex="-1"
      :ui="{
        rounded: 'rounded-full',
      }"
    >
      <template #leading>
        <AppIcon
          name="plusCircle"
          size="xs"
          class="text-slate-600"
        />
      </template>
    </UButton>

    <span class="text-[12px] font-semibold leading-none sm:text-[13px]">
      {{ props.label }}
    </span>

    <span
      v-if="props.active && props.value"
      class="mx-1.5 h-4 w-px bg-slate-200"
    />

    <span
      v-if="props.active && props.value"
      class="text-[12px] font-semibold leading-none text-primary sm:text-[13px]"
    >
      {{ props.value }}
    </span>

    <AppIcon
      name="chevronDown"
      size="xs"
      class="ml-1 shrink-0 text-slate-500"
    />
  </div>
</template>
