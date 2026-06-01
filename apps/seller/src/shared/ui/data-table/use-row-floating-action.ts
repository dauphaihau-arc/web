type RowFloatingActionOptions<Row extends { id: string }> = {
  actionCellSelector?: string
  locked?: Ref<boolean>
  rows: Ref<Row[]>
}

export function useRowFloatingAction<Row extends { id: string }>(
  options: RowFloatingActionOptions<Row>,
) {
  const tableWrapper = ref<HTMLElement | null>(null)
  const activeRowId = ref<string | null>(null)
  const actionPosition = reactive({
    top: 0,
    left: 0,
  })
  let cleanupRowListeners: Array<() => void> = []

  const actionCellSelector = computed(() => options.actionCellSelector ?? '[data-table-action-cell]')

  const activeRow = computed(() =>
    options.rows.value.find(row => row.id === activeRowId.value) ?? null,
  )

  const actionVisible = computed(() => !!activeRow.value)
  const isLocked = computed(() => options.locked?.value ?? false)

  function clearActiveRow() {
    if (isLocked.value) return

    activeRowId.value = null
  }

  function setActiveRow(row: Row) {
    activeRowId.value = row.id
  }

  function isActionCellTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && !!target.closest(actionCellSelector.value)
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function updateActionPosition(event: MouseEvent, row: Row, rowElement: HTMLTableRowElement) {
    if (isActionCellTarget(event.target)) {
      clearActiveRow()
      return
    }

    const wrapperRect = tableWrapper.value?.getBoundingClientRect()

    if (!wrapperRect) {
      return
    }

    const rowRect = rowElement.getBoundingClientRect()
    const buttonWidth = 88
    const padding = 20
    const cursorOffset = 18
    const minLeft = rowRect.left - wrapperRect.left + padding + buttonWidth / 2
    const maxLeft = rowRect.right - wrapperRect.left - padding - buttonWidth / 2

    setActiveRow(row)
    actionPosition.top = rowRect.top - wrapperRect.top + rowRect.height / 2
    actionPosition.left = clamp(
      event.clientX - wrapperRect.left + cursorOffset,
      minLeft,
      Math.max(minLeft, maxLeft),
    )
  }

  function bindRowHoverEvents() {
    cleanupRowListeners.forEach(cleanup => cleanup())
    cleanupRowListeners = []

    const tbodyRows = tableWrapper.value?.querySelectorAll<HTMLTableRowElement>('tbody > tr')

    if (!tbodyRows?.length || options.rows.value.length === 0) {
      return
    }

    options.rows.value.forEach((row, index) => {
      const rowElement = tbodyRows[index]

      if (!rowElement) {
        return
      }

      rowElement.classList.add('data-table-row-hover-target')

      const handleMouseEnter = (event: Event) => {
        updateActionPosition(event as MouseEvent, row, rowElement)
      }

      const handleMouseMove = (event: Event) => {
        updateActionPosition(event as MouseEvent, row, rowElement)
      }

      const handleMouseLeave = (event: Event) => {
        const relatedTarget = (event as MouseEvent).relatedTarget

        if (relatedTarget instanceof Node && tableWrapper.value?.querySelector('[data-table-floating-action]')?.contains(relatedTarget)) {
          return
        }

        clearActiveRow()
      }

      rowElement.addEventListener('mouseenter', handleMouseEnter)
      rowElement.addEventListener('mousemove', handleMouseMove)
      rowElement.addEventListener('mouseleave', handleMouseLeave)

      cleanupRowListeners.push(() => {
        rowElement.removeEventListener('mouseenter', handleMouseEnter)
        rowElement.removeEventListener('mousemove', handleMouseMove)
        rowElement.removeEventListener('mouseleave', handleMouseLeave)
      })
    })
  }

  watch(options.rows, async () => {
    await nextTick()
    bindRowHoverEvents()
  }, { immediate: true, flush: 'post' })

  if (options.locked) {
    watch(options.locked, (locked) => {
      if (!locked) {
        activeRowId.value = null
      }
    })
  }

  onBeforeUnmount(() => {
    cleanupRowListeners.forEach(cleanup => cleanup())
  })

  return {
    actionPosition,
    actionVisible,
    activeRow,
    setActiveRow,
    tableWrapper,
  }
}
