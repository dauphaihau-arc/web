<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
</script>

<template>
  <Empty
    :icon="ICON_NAME_BY_ALIAS.warning"
    title="Audit log access required"
    description="Ask a platform administrator to grant your account access to the audit log."
    variant="naked"
    size="xl"
    container-class="min-h-[60vh]"
  />
</template>
