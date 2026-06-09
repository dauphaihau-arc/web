export type OrderDateFilterDraft = {
  operator: 'in_last' | 'eq' | 'between' | 'gte' | 'lte'
  amount: string
  unit: 'days' | 'weeks' | 'months'
  date: Date | null
  startDate: Date | null
  endDate: Date | null
  includeTime: boolean
  time: string
  startTime: string
  endTime: string
  timezone: string
}

export type OrderAmountFilterDraft = {
  operator: 'eq' | 'gte' | 'lte'
  amount: string
}

export type OrderCurrencyFilterDraft = {
  currency: string
}
