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
    radio: {
      help: 'text-text-muted',
    },
    button: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
      color: {
        white: {
          outline: 'shadow-sm ring-1 ring-inset ring-border-muted text-text-strong bg-surface hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary-500',
        },
      },
    },
    input: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
    },
    tabs: {
      list: {
        background: 'bg-surface-muted/80',
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
