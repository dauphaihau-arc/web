<script setup lang="ts">
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { offsetMinutesForInstant } from '../../utils/zoned-local-date-time'
import {
  addDurationToLocal,
  localToInstant,
  nowLocal,
  type PromotionDurationUnit,
} from '../../utils/promotion-schedule-range'

const props = defineProps<{
  /** The IANA timezone the wall clock belongs to; "now" and relative options resolve in it. */
  timezone: string
  /** The wall clock relative options count from; empty means the store's now. */
  anchorLocal?: string
  disabled?: boolean
}>()

const local = defineModel<string>({ required: true })

const dateInputValueFormat = 'D MMM YYYY, [at] HH:mm'
const detailDateFormat = 'D MMM YYYY, HH:mm'

const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const relativeUnits: PromotionDurationUnit[] = ['minute', 'hour', 'day', 'week', 'month', 'year']

const regexHoursMinutes = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
const regexHoursMinutesAMPM = /^([01]?\d|2[0-3])\s?(AM|PM)?$/i
const regexHoursAMPM = /^([01]?\d|2[0-3]):([0-5]\d)\s?(AM|PM)?$/i

type DateOption = {
  /** The wall clock the option selects, `YYYY-MM-DDTHH:mm` in `timezone`. */
  value: string
  /** The formatted wall clock the input displays once the option is chosen. */
  dateInputValueFormatted: string
  /** The title shown for the option in the menu. */
  hintTitle: string
  /** The secondary line shown against the option. */
  detail?: string
}

function localOf(value: dayjs.Dayjs): string {
  return value.format('YYYY-MM-DDTHH:mm')
}

function displayOf(value: string): string {
  return dayjs(value).format(dateInputValueFormat)
}

function detailOf(value: string): string {
  return dayjs(value).format(detailDateFormat)
}

/** The offset in effect at the option's own wall clock, not at the current moment. */
function offsetLabel(local: string): string {
  if (!props.timezone) {
    return ''
  }

  const instant = localToInstant(local, props.timezone) ?? new Date()
  const minutes = offsetMinutesForInstant(instant, props.timezone)
  const sign = minutes < 0 ? '-' : '+'
  const absolute = Math.abs(minutes)
  const hours = Math.floor(absolute / 60)
  const rest = absolute % 60

  return `GMT ${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}

const selected = ref<DateOption>()

watch(local, (value) => {
  if (!value) {
    selected.value = undefined
    return
  }

  if (selected.value?.value === value) {
    return
  }

  const formatted = displayOf(value)

  selected.value = { value, dateInputValueFormatted: formatted, hintTitle: formatted }
}, { immediate: true })

watch(selected, (value) => {
  const next = typeof value === 'string' ? '' : (value?.value ?? '')

  if (local.value !== next) {
    local.value = next
  }
})

const isPositiveNumeric = (value: string) => Number.isFinite(+value) && Number(value) > 0

/**
 * Reads the words the seller typed into a single suggested wall clock. The
 * calendar the words land on is expressed in the store timezone, so "1pm"
 * means 1pm for the shop, and a word that lands in the past rolls forward the
 * same way the original picker did.
 */
function suggestBestDateOption(words: string[]): DateOption | undefined {
  const set = new Set<'hour' | 'day' | 'month' | 'year'>()
  const today = nowLocal(props.timezone).slice(0, 10)

  let dateOption = props.anchorLocal
    ? dayjs(props.anchorLocal)
    : dayjs(`${today}T00:00`)

  for (let word of words) {
    word = word.toLowerCase()

    // case word is day ( 1 - 31 )
    if (!set.has('day') && isPositiveNumeric(word)) {
      const day = Number(word)

      // A day that has already passed rolls to the next month. The reference is
      // the anchor when there is one (the field counts from it), otherwise today.
      const referenceDay = props.anchorLocal
        ? dayjs(props.anchorLocal).date()
        : Number(today.slice(8, 10))

      if (day <= referenceDay) {
        dateOption = dateOption.add(1, 'month')
      }

      const probe = dayjs(new Date(dateOption.year(), dateOption.month(), day))

      if (probe.date() !== day || probe.month() !== dateOption.month()) {
        return undefined
      }

      dateOption = dateOption.date(day)
      set.add('day')
    }

    // word is month name ( ex: Jun )
    else if (
      !set.has('month')
      && /^[a-zA-Z]+$/.test(word)
      && monthNames.findIndex(name => name.includes(word)) !== -1
    ) {
      dateOption = dateOption.month(monthNames.findIndex(name => name.includes(word)))
      set.add('month')
    }

    // word is 1:00, 1am, or 1:10pm
    else if (
      !set.has('hour')
      && (regexHoursAMPM.test(word) || regexHoursMinutesAMPM.test(word) || regexHoursMinutes.test(word))
    ) {
      const [hourPart, minutePart] = word.split(':')
      let hour = parseInt(hourPart!)

      if (word.includes('pm')) {
        hour += 12
      }

      dateOption = dateOption.hour(hour)

      if (minutePart) {
        dateOption = dateOption.minute(parseInt(minutePart))
      }

      const candidate = localOf(dateOption)

      // search hour <= current hour ( ex: current is 2pm, search 1pm ) -> increase day
      if (candidate < nowLocal(props.timezone) || (props.anchorLocal && candidate >= props.anchorLocal)) {
        dateOption = dateOption.add(1, 'day')
      }

      set.add('hour')
    }

    // word is year
    else if (!set.has('year') && isPositiveNumeric(word) && word.length === 4) {
      dateOption = dateOption.year(Number(word))
      set.add('year')
    }
  }

  let value = localOf(dateOption)

  if (words.length >= 2 && value.slice(0, 10) === today && !props.anchorLocal) {
    const now = nowLocal(props.timezone)

    return { value: now, dateInputValueFormatted: displayOf(now), hintTitle: 'Now', detail: detailOf(now) }
  }

  if (words.length > 2 && props.anchorLocal && value.slice(0, 10) === props.anchorLocal.slice(0, 10)) {
    dateOption = dateOption.add(1, 'hour')
    value = localOf(dateOption)
  }

  // case search words start by '1 Jan' ( ex current date is 11 Nov ) -> increase year
  if (value.slice(0, 10) < today) {
    dateOption = dateOption.add(1, 'year')
    value = localOf(dateOption)
  }

  if (props.anchorLocal && value.slice(0, 10) < props.anchorLocal.slice(0, 10)) {
    dateOption = dateOption.add(1, 'year')
    value = localOf(dateOption)
  }

  return { value, dateInputValueFormatted: displayOf(value), hintTitle: displayOf(value) }
}

function search(query: string): DateOption[] {
  const trimmed = query.trim()

  if (!trimmed.match(/^[:,0-9a-zA-Z ]+$/)) {
    return []
  }

  const words = trimmed.split(' ').filter(word => word !== '')

  if (words.length === 0) {
    return []
  }

  const firstWord = words[0]!.toLowerCase()
  const secondWord = words[1]?.toLowerCase()

  const options: DateOption[] = []

  const best = suggestBestDateOption(words)

  if (best) {
    options.push(best)
  }

  // case first word start by now
  if ('now'.includes(firstWord) && !props.anchorLocal) {
    const now = nowLocal(props.timezone)

    options.push({ value: now, dateInputValueFormatted: displayOf(now), hintTitle: 'Now', detail: detailOf(now) })
  }

  // case first word is number
  if (isPositiveNumeric(firstWord) && firstWord.length <= 5) {
    const amount = Number(firstWord)

    const units = secondWord
      ? relativeUnits.filter(unit => unit.startsWith(secondWord) || `${unit}s`.startsWith(secondWord))
      : relativeUnits

    for (const unit of units) {
      const value = addDurationToLocal(props.anchorLocal ?? '', props.timezone, amount, unit)
      const title = `${amount} ${unit}${amount > 1 ? 's' : ''}`

      options.push({ value, dateInputValueFormatted: displayOf(value), hintTitle: title, detail: `${detailOf(value)} ${offsetLabel(value)}` })
    }
  }

  return options
}
</script>

<template>
  <UInputMenu
    v-model="selected"
    :search="search"
    option-attribute="dateInputValueFormatted"
    by="value"
    class="w-72"
    :icon="ICON_NAME_BY_ALIAS['calendarDaysSolid']"
    :debounce="300"
    :disabled="disabled"
    placeholder="Type a date or time..."
    size="lg"
    :ui-menu="{
      option: {
        icon: { base: 'hidden' },
        selectedIcon: { wrapper: 'hidden' },
        container: 'w-full',
        selected: '',
      },
    }"
  >
    <template #option="{ option: dateOption }">
      <div class="flex w-full items-center gap-1 px-2 py-1">
        <span class="grow truncate">
          {{ dateOption.hintTitle }}
        </span>
        <span
          v-if="dateOption.detail"
          class="truncate text-[11px] text-text-muted"
        >
          {{ dateOption.detail }}
        </span>
      </div>
    </template>
  </UInputMenu>
</template>
