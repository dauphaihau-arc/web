<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div>
    <UPopover
      mode="hover"
      :popper="{ offsetDistance: 0 }"
    >
      <UButton
        color="gray"
        variant="ghost"
        class="icon-button"
      >
        {{ locale.toString().toUpperCase() }}
      </UButton>

      <template #panel="{ close }">
        <div class="flex flex-col gap-3 p-2">
          <NuxtLink
            :to="switchLocalePath('en')"
            @click="close"
          >
            <UButton
              color="gray"
              variant="ghost"
              class="icon-button"
            >
              English - EN
            </UButton>
          </NuxtLink>
          <NuxtLink
            :to="switchLocalePath('fr')"
            @click="close"
          >
            <UButton
              color="gray"
              variant="ghost"
              class="icon-button"
            >
              Français - FR
            </UButton>
          </NuxtLink>
          <NuxtLink
            :to="switchLocalePath('la')"
            @click="close"
          >
            <UButton
              color="gray"
              variant="ghost"
              class="w-full"
            >
              Latin - LA
            </UButton>
          </NuxtLink>
        </div>
      </template>
    </UPopover>
  </div>
</template>
