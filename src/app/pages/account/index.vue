<script lang="ts" setup>
definePageMeta({ layout: 'market', middleware: ['auth'] })
</script>

<template>
  <div>
    <h3 class="text-2xl font-medium">
      Account
    </h3>
    <div class="mt-3 space-y-3">
      <div>
        <div class="font-medium">
          Name
        </div>
        <div class="font-light text-zinc-600">
          {{ $auth.user?.display_name }}
        </div>
      </div>
      <div>
        <div class="font-medium">
          Email
        </div>
        <div class="font-light text-zinc-600">
          {{ $auth.user?.email }}
        </div>
      </div>
    </div>
  </div>
</template>
