import { designTokenClasses } from './design-tokens'

export const sharedAppConfig = {
  ui: {
    primary: 'indigo',
    gray: 'neutral',
    notifications: {
      position: 'top-0 bottom-auto',
    },
    notification: {
      progress: {
        base: 'hidden',
      },
    },
    select: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
    },
    selectMenu: {
      option: {
        base: 'capitalize',
      },
      select: 'capitalize',
    },
    card: {
      shadow: designTokenClasses.shadow.border,
    },
    popover: {
      shadow: designTokenClasses.shadow.overlay,
    },
    formGroup: {
      description: 'text-text-muted',
    },
    skeleton: {
      base: 'animate-pulse rounded-md bg-customGray-300/85 dark:bg-customGray-800/80',
    },
    radio: {
      help: 'text-text-muted',
    },
    button: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
      variant: {
        subtle: 'ring-1 ring-inset ring-{color}-200 text-{color}-500 bg-{color}-50 hover:bg-{color}-100 disabled:bg-{color}-50 aria-disabled:bg-{color}-50 dark:ring-{color}-800 dark:text-{color}-400 dark:bg-{color}-950 dark:hover:bg-{color}-900 dark:disabled:bg-{color}-950 dark:aria-disabled:bg-{color}-950 focus-visible:ring-2 focus-visible:ring-{color}-500 dark:focus-visible:ring-{color}-400',
      },
      color: {
        white: {
          outline: 'shadow-sm ring-1 ring-inset ring-border-muted text-text-strong bg-surface hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary-500',
        },
      },
    },
    chip: {
      translate: {
        'bottom-right': 'translate-y-[-4px] translate-x-[-4px]',
      },
    },
    checkbox: {
      inner: 'ms-1.5',
    },
    input: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
    },
    tabs: {
      list: {
        background: 'bg-customGray-200/80',
        rounded: 'rounded-lg',
        padding: 'p-1',
        width: 'w-full md:w-auto',
      },
    },
  },
  icon: {
    size: '20px',
    class: 'icon',
    mode: 'svg',
    aliases: {
      search: 'i-uil:search',
    },
  },
} as const
