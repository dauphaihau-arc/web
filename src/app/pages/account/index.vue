<script lang="ts" setup>
import { useGetCurrentUser } from '~/shared/server-state/user'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const { data: dataUserAuth } = useGetCurrentUser()
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
          {{ dataUserAuth?.user?.display_name }}
        </div>
      </div>
      <div>
        <div class="font-medium">
          Email
        </div>
        <div class="font-light text-zinc-600">
          {{ dataUserAuth?.user?.email }}
        </div>
      </div>
    </div>
  </div>
</template>
