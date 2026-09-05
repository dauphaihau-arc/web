export type StepperItemValue = string | number
export type StepperItemState = 'completed' | 'active' | 'upcoming'
export type StepperSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type StepperColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
export type StepperOrientation = 'horizontal' | 'vertical'
export type StepperSlotName =
  | 'root'
  | 'header'
  | 'item'
  | 'container'
  | 'trigger'
  | 'indicator'
  | 'icon'
  | 'separator'
  | 'wrapper'
  | 'title'
  | 'description'
  | 'content'

export type StepperItem = {
  title?: string
  description?: string
  content?: string
  icon?: string
  value?: StepperItemValue
  disabled?: boolean
  slot?: string
  class?: unknown
  ui?: Partial<Record<Exclude<StepperSlotName, 'root' | 'header' | 'content'>, unknown>>
}

export type StepperSlotProps<TItem extends StepperItem = StepperItem> = {
  item: TItem
  index: number
  value: StepperItemValue
  state: StepperItemState
  active: boolean
  completed: boolean
  disabled: boolean
}
