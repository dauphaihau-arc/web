<script lang="ts">
import { defineComponent, h, type Component } from 'vue'
import { DatePicker as VDatePicker } from 'v-calendar'
import 'v-calendar/style.css'

export default defineComponent({
  inheritAttrs: false,
  setup(_props, { attrs, slots }) {
    return () => h(VDatePicker as unknown as Component, attrs, slots)
  },
})
</script>
