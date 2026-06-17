<script setup lang="ts">
type ProductFormSection = {
  id: string
  label: string
}

const props = defineProps<{
  sections: ProductFormSection[]
}>()

const SECTION_STICKY_OFFSET = 120
const SECTION_REACHED_TOLERANCE = 16

const activeSectionId = ref(props.sections[0]?.id ?? '')
const sectionElements = shallowRef<HTMLElement[]>([])
const { y } = useWindowScroll()
const pendingSectionId = ref<string | null>(null)
const pendingScrollTop = ref<number | null>(null)

const tabs = computed(() =>
  props.sections.map(section => ({
    label: section.label,
  })),
)

const activeTabIndex = computed(() =>
  Math.max(props.sections.findIndex(section => section.id === activeSectionId.value), 0),
)

function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId)

  if (!target) {
    return
  }

  pendingSectionId.value = sectionId
  activeSectionId.value = sectionId

  const nextTop = window.scrollY + target.getBoundingClientRect().top - SECTION_STICKY_OFFSET
  pendingScrollTop.value = Math.max(nextTop, 0)

  window.scrollTo({
    top: pendingScrollTop.value,
    behavior: 'smooth',
  })
}

function handleChange(index: number) {
  const nextSection = props.sections[index]

  if (!nextSection) {
    return
  }

  scrollToSection(nextSection.id)
}

function collectSections() {
  if (!import.meta.client || props.sections.length === 0) {
    sectionElements.value = []
    return
  }

  sectionElements.value = props.sections
    .map(section => document.getElementById(section.id))
    .filter((element): element is HTMLElement => Boolean(element))
}

function resolveActiveSection() {
  const targets = sectionElements.value

  if (targets.length === 0) {
    return
  }

  const scrollTop = window.scrollY
  const viewportHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  if (scrollTop <= SECTION_REACHED_TOLERANCE) {
    activeSectionId.value = targets[0].id
    return
  }

  if (scrollTop + viewportHeight >= documentHeight - SECTION_REACHED_TOLERANCE) {
    activeSectionId.value = targets.at(-1)?.id ?? targets[0].id
    return
  }

  const thresholdTop = scrollTop + SECTION_STICKY_OFFSET

  const currentSection = targets.reduce((activeTarget, target) => {
    return target.offsetTop <= thresholdTop
      ? target
      : activeTarget
  }, targets[0])

  activeSectionId.value = currentSection.id
}

const finishPendingScroll = useDebounceFn(() => {
  pendingSectionId.value = null
  pendingScrollTop.value = null
  resolveActiveSection()
}, 120)

const syncActiveSection = useThrottleFn(() => {
  const targets = sectionElements.value

  if (targets.length === 0) {
    return
  }

  if (pendingSectionId.value) {
    const pendingTarget = targets.find(target => target.id === pendingSectionId.value)

    if (!pendingTarget) {
      pendingSectionId.value = null
      pendingScrollTop.value = null
      resolveActiveSection()
      return
    }

    activeSectionId.value = pendingTarget.id

    if (
      pendingScrollTop.value !== null
      && Math.abs(window.scrollY - pendingScrollTop.value) <= SECTION_REACHED_TOLERANCE
    ) {
      finishPendingScroll()
      return
    }

    finishPendingScroll()
    return
  }

  resolveActiveSection()
}, 16)

watch(
  () => props.sections,
  async (sections) => {
    activeSectionId.value = sections[0]?.id ?? ''
    await nextTick()
    collectSections()
    syncActiveSection()
  },
  { deep: true },
)

watch(y, () => {
  syncActiveSection()
})

useEventListener('resize', () => {
  collectSections()
  syncActiveSection()
})

onMounted(async () => {
  await nextTick()
  collectSections()
  syncActiveSection()
})
</script>

<template>
  <div class="sticky top-4 z-[3] mb-6 w-fit max-w-full bg-transparent">
    <UTabs
      :items="tabs"
      :model-value="activeTabIndex"
      class="min-w-max"
      @change="handleChange"
    />
  </div>
</template>
