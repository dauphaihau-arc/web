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
    class="inline-flex min-h-[32px] cursor-pointer select-none items-center rounded-full border bg-surface pr-1 transition-colors"
    :class="
      props.active
        ? 'border-border-subtle text-text-strong shadow-sm'
        : 'border-dashed border-border-muted text-text-strong hover:border-border-subtle hover:bg-surface-muted'
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
          class="text-text-subtle"
        />
      </template>
    </UButton>

    <span class="text-[12px] font-semibold leading-none sm:text-[13px]">
      {{ props.label }}
    </span>

    <span
      v-if="props.active && props.value"
      class="mx-1.5 h-4 w-px bg-border-subtle"
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
      class="ml-1 shrink-0 text-text-subtle"
    />
  </div>
</template>
