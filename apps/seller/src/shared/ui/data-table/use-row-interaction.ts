import type { Ref } from 'vue'

type RowInteractionOptions<Row extends { id: string }> = {
  actionCellSelector?: string
  enabled?: Ref<boolean>
  rows: Ref<Row[]>
  onRowClick?: (row: Row) => void
}

export function useRowInteraction<Row extends { id: string }>(
  options: RowInteractionOptions<Row>,
) {
  const tableWrapper = ref<HTMLElement | null>(null)
  let rowObserver: MutationObserver | null = null
  let cleanupRowListeners: Array<() => void> = []

  const actionCellSelector = computed(() => options.actionCellSelector ?? '[data-table-action-cell]')
  const isEnabled = computed(() => options.enabled?.value ?? true)

  function isActionCellTarget(target: EventTarget | null) {
    return target instanceof Element && !!target.closest(actionCellSelector.value)
  }

  function isInteractiveTarget(target: EventTarget | null) {
    return target instanceof Element && !!target.closest(
      'button, a, input, select, textarea, summary, [role="button"], [role="link"], [role="menuitem"], [data-row-click-ignore]',
    )
  }

  function activateRow(row: Row, eventTarget: EventTarget | null) {
    if (!isEnabled.value || isActionCellTarget(eventTarget) || isInteractiveTarget(eventTarget)) {
      return
    }

    options.onRowClick?.(row)
  }

  function cleanupBoundRowEvents() {
    cleanupRowListeners.forEach(cleanup => cleanup())
    cleanupRowListeners = []
  }

  function bindRowEvents() {
    cleanupBoundRowEvents()

    const tbodyRows = tableWrapper.value?.querySelectorAll<HTMLTableRowElement>('tbody > tr')

    if (!tbodyRows?.length || options.rows.value.length === 0) {
      return
    }

    options.rows.value.forEach((row, index) => {
      const rowElement = tbodyRows[index]

      if (!rowElement) {
        return
      }

      if (!isEnabled.value) {
        rowElement.classList.remove('data-table-row-clickable')
        rowElement.removeAttribute('tabindex')
        return
      }

      rowElement.classList.add('data-table-row-clickable')
      rowElement.setAttribute('tabindex', '0')

      const handleClick = (event: Event) => {
        activateRow(row, event.target)
      }

      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return
        }

        event.preventDefault()
        activateRow(row, event.target)
      }

      rowElement.addEventListener('click', handleClick)
      rowElement.addEventListener('keydown', handleKeydown)

      cleanupRowListeners.push(() => {
        rowElement.classList.remove('data-table-row-clickable')
        rowElement.removeAttribute('tabindex')
        rowElement.removeEventListener('click', handleClick)
        rowElement.removeEventListener('keydown', handleKeydown)
      })
    })
  }

  function stopObservingRows() {
    rowObserver?.disconnect()
    rowObserver = null
  }

  function observeRowDom() {
    stopObservingRows()

    if (!tableWrapper.value) {
      return
    }

    rowObserver = new MutationObserver(() => {
      bindRowEvents()
    })

    rowObserver.observe(tableWrapper.value, {
      childList: true,
      subtree: true,
    })
  }

  watch([options.rows, isEnabled], async () => {
    await nextTick()
    bindRowEvents()
  }, { immediate: true, flush: 'post' })

  watch(tableWrapper, async (wrapper) => {
    if (!wrapper) {
      stopObservingRows()
      cleanupBoundRowEvents()
      return
    }

    await nextTick()
    observeRowDom()
    bindRowEvents()
  }, { flush: 'post' })

  onActivated(async () => {
    await nextTick()
    observeRowDom()
    bindRowEvents()
  })

  onDeactivated(() => {
    stopObservingRows()
    cleanupBoundRowEvents()
  })

  onBeforeUnmount(() => {
    stopObservingRows()
    cleanupBoundRowEvents()
  })

  return {
    tableWrapper,
  }
}
