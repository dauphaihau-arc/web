<script setup lang="ts">
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { consola } from 'consola'

dayjs.extend(isSameOrAfter)

const isPositiveNumeric = (string: string) => Number.isFinite(+string) && Number(string) > 0

const regexHoursMinutes = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
const regexHoursMinutesAMPM = /^([1-9]|1[0-2])\s?(AM|PM)?$/i
const regexHoursAMPM = /^([1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)?$/i

const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

const dateInputValueFormat = 'D MMM YYYY, [at] HH:mm'
const detailDateFormat = 'D MMM YYYY, HH:mm'

type DateOption = {
  dateValue: dayjs.Dayjs
  dateInputValueFormatted: string // show on input
  hintTitle?: string
  detailDateFormatted?: string // show on option
}

const props = defineProps<{
  startDate?: dayjs.Dayjs
}>()

const model = defineModel<dayjs.Dayjs | null>()

const selectedDate = ref<DateOption>()

onMounted(() => {
  if (model.value) {
    selectedDate.value = {
      dateInputValueFormatted: model.value.format(dateInputValueFormat),
      dateValue: model.value,
    }
  }
})

watch(model, () => {
  if (!model.value) {
    selectedDate.value = undefined
  }
})

watch(selectedDate, () => {
  model.value = selectedDate.value?.dateValue
})

const utcOffSet = computed(() => {
  const currentUtcOffSet = dayjs().format('Z')
  const time = currentUtcOffSet.substring(1)
  const [hour, min] = time.split(':')
  return `GMT ${currentUtcOffSet[0]}${parseInt(hour)}${parseInt(min) > 0 ? parseInt(min) : ''}`
})

const currentDay = dayjs().date()

function suggestBestDateOption(words: string[]): DateOption | undefined {
  const timeTypesWasSet = new Set<'hour' | 'day' | 'month' | 'year'>()

  let dateOption = dayjs()
    .hour(0)
    .minute(0)

  if (props.startDate) {
    dateOption = props.startDate
  }

  consola.info('words', words)

  for (let word of words) {
    word = word.toLowerCase()

    // case word is day ( 1 - 31 )
    if (!timeTypesWasSet.has('day') && isPositiveNumeric(word)) {
      consola.info('case day')
      const day = Number(word)
      if (day <= currentDay) {
        dateOption = dateOption.add(1, 'month')
      }
      if (!dayjs(`${dateOption.year()}-${dateOption.month()}-${day}`, 'YYYY-M-D', true).isValid()) {
        return
      }
      dateOption = dateOption.date(day)
      timeTypesWasSet.add('day')
    }

    // word is month name ( ex: Jun )
    else if (
      !timeTypesWasSet.has('month')
      && word.match(/^[a-zA-Z]+$/) && monthNames.findIndex(name => name.includes(word)) !== -1
    ) {
      consola.info('case month name')
      const foundMonthIndex = monthNames.findIndex(name => name.includes(word))
      dateOption = dateOption.month(foundMonthIndex)
      timeTypesWasSet.add('month')
    }

    // word is 1:00, 1am, or 1:10pm
    else if (
      !timeTypesWasSet.has('hour')
      && ((word.match(regexHoursAMPM) || word.match(regexHoursMinutesAMPM)) || word.match(regexHoursMinutes))
    ) {
      consola.info('case hour')
      const [hour, min] = word.split(':')
      let hourInt = parseInt(hour)
      if (word.includes('pm')) {
        hourInt += 12
      }
      dateOption = dateOption.hour(hourInt)
      if (min) {
        dateOption = dateOption.minute(parseInt(min))
      }

      // search hour <= current hour ( ex: current is 2pm, search 1pm ), -> increase day
      if (dayjs().isAfter(dateOption) || (props.startDate && props.startDate.isSameOrAfter(dateOption))) {
        dateOption = dateOption.add(1, 'day')
      }
      timeTypesWasSet.add('hour')
    }

    // word is year
    else if (!timeTypesWasSet.has('year') && isPositiveNumeric(word) && word.length === 4) {
      consola.info('case year')
      dateOption = dateOption.year(Number(word))
      timeTypesWasSet.add('year')
    }
  }

  if (
    words.length >= 2 // check words length to avoid case search with first word is hour ( ex: 1pm )
    && dateOption.isSame(dayjs(), 'day') // second parameter 'day' will check day, month, and year.
    && !props.startDate
  ) {
    consola.info('same day, month, year')
    return {
      hintTitle: 'Now',
      dateInputValueFormatted: dayjs().format(dateInputValueFormat),
      detailDateFormatted: dayjs().format(detailDateFormat),
      dateValue: dayjs(),
    }
  }

  if (words.length > 2 && props.startDate && dateOption.isSame(props.startDate, 'day')) {
    consola.info('have startDate, add 1 hour')
    dateOption = dateOption.add(1, 'hour')
  }

  // case search words start by '1 Jan' or '1 Nov' ( ex current date is 11 Nov ), increase year
  if (dateOption.isBefore(dayjs(), 'day')) {
    consola.info('add 1 year')
    dateOption = dateOption.add(1, 'year')
  }

  if (props.startDate && dateOption.isBefore(props.startDate, 'day')) {
    consola.info('have startDate, add 1 year')
    dateOption = dateOption.add(1, 'year')
  }

  return {
    hintTitle: dateOption.format(dateInputValueFormat),
    dateInputValueFormatted: dateOption.format(dateInputValueFormat),
    dateValue: dateOption,
  }
}

async function search(q: string) {
  q = q.trim()
  if (!q.match(/^[:,0-9a-zA-Z ]+$/)) {
    return []
  }

  const words = q.split(' ').filter(w => w !== '')

  const firstWord = words[0].toLowerCase()
  const secondWord = words[1]?.toLowerCase()

  let dateOptions: DateOption[] = []

  const bestDateOption = suggestBestDateOption(words)
  if (bestDateOption) {
    dateOptions.push(bestDateOption)
  }

  // case first word start by now
  if ('now'.includes(firstWord) && !props.startDate) {
    dateOptions.push({
      hintTitle: 'Now',
      dateInputValueFormatted: dayjs().format(dateInputValueFormat),
      detailDateFormatted: dayjs().format(detailDateFormat),
      dateValue: dayjs(),
    })
  }

  // region case first word is number
  const limitDigit = 5
  if (isPositiveNumeric(firstWord) && firstWord.length <= limitDigit) {
    const firstWordInt = Number(firstWord)

    let formats: dayjs.ManipulateType[] = ['minute', 'hour', 'day', 'week', 'month', 'year']

    if (secondWord) {
      formats = formats.filter(key => key.includes(secondWord))
    }

    const optionsByFormats = formats.map((unit) => {
      const dateValue = props.startDate ? props.startDate.add(firstWordInt, unit) : dayjs().add(firstWordInt, unit)
      const hintTitle = `${firstWordInt} ${unit}${firstWordInt > 1 ? 's' : ''}`
      const detailDateFormatted = dateValue.format(detailDateFormat)
      const dateInputValueFormatted = dateValue.format(dateInputValueFormat)

      return {
        dateValue,
        hintTitle,
        detailDateFormatted: `${detailDateFormatted} ${utcOffSet.value}`,
        dateInputValueFormatted,
      }
    })
    dateOptions = [...dateOptions, ...optionsByFormats]
  }

  return dateOptions
}
</script>

<template>
  <UInputMenu
    v-model="selectedDate"
    :search="search"
    option-attribute="dateInputValueFormatted"
    class="w-72"
    by="dateInputValueFormatted"
    icon="i-heroicons-calendar-days-20-solid"
    :debounce="300"
    placeholder="Type a date or time..."
    size="lg"
    :ui-menu="{
      option: {
        icon: {
          base: 'hidden',
        },
        selectedIcon: {
          wrapper: 'hidden',
        },
        container: 'w-full',
        selected: '',
      },
    }"
  >
    <template #option="{ option: dateData }">
      <div class="flex w-full items-center gap-1 px-2 py-1">
        <span class="grow truncate">
          {{ dateData.hintTitle }}
        </span>
        <span class="truncate text-[11px] text-text-muted">
          {{ dateData.detailDateFormatted }}
        </span>
      </div>
    </template>
  </UInputMenu>
</template>
