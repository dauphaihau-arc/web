<script setup lang="ts">
defineOptions({
  name: 'ProgressSteps',
})

export type ProgressStepState = 'completed' | 'current' | 'upcoming' | 'failed'

export type ProgressStep = {
  key: string
  label: string

  /** Date or estimate line, e.g. `Oct 29, 18:50` / `Est. Nov 2 - 6`. */
  date?: string

  /** Secondary line, e.g. `Add bank account` / `Refunded`. */
  description?: string

  /** Internal route; renders the description as a NuxtLink. */
  href?: string
  state?: ProgressStepState
}

const props = withDefaults(
  defineProps<{
    steps: ProgressStep[]
    ariaLabel?: string
  }>(),
  {
    ariaLabel: 'Progress',
  },
)

const columnsClasses: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  7: 'sm:grid-cols-7',
}

const columnsClass = computed(() => columnsClasses[props.steps.length] ?? 'sm:grid-cols-4')

const barClasses: Record<ProgressStepState, string> = {
  completed: 'bg-primary',
  current: 'bg-primary',
  upcoming: 'bg-border-subtle',
  failed: 'bg-red-400',
}

const labelClasses: Record<ProgressStepState, string> = {
  completed: 'text-text-strong',
  current: 'font-semibold text-text-strong',
  upcoming: 'text-text-muted',
  failed: 'text-state-danger-text',
}

const dateClasses: Record<ProgressStepState, string> = {
  completed: 'text-sm text-text-subtle',
  current: 'text-sm text-text-muted',
  upcoming: 'text-sm text-text-muted',
  failed: 'text-sm text-text-muted',
}

const descriptionClasses: Record<ProgressStepState, string> = {
  completed: 'text-text-muted',
  current: 'text-state-warning-text',
  upcoming: 'text-text-muted',
  failed: 'text-state-danger-text',
}

function stepState(step: ProgressStep): ProgressStepState {
  return step.state ?? 'upcoming'
}
</script>

<template>
  <div class="w-full">
    <ol
      class="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-3"
      :class="columnsClass"
      :aria-label="ariaLabel"
    >
      <li
        v-for="step in steps"
        :key="step.key"
        :aria-current="stepState(step) === 'current' ? 'step' : undefined"
      >
        <span
          aria-hidden="true"
          class="block h-1.5 rounded-full"
          :class="barClasses[stepState(step)]"
        />

        <p
          class="mt-2 text-sm font-medium"
          :class="labelClasses[stepState(step)]"
        >
          {{ step.label }}
        </p>

        <p
          v-if="step.date"
          :class="dateClasses[stepState(step)]"
        >
          {{ step.date }}
        </p>

        <p
          v-if="step.description"
          class="mt-1 text-sm"
          :class="descriptionClasses[stepState(step)]"
        >
          <NuxtLink
            v-if="step.href"
            :to="step.href"
            class="underline underline-offset-2"
          >
            {{ step.description }}
          </NuxtLink>
          <template v-else>
            {{ step.description }}
          </template>
        </p>
      </li>
    </ol>
  </div>
</template>
