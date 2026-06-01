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
      shadow: 'shadow-border',
    },
    formGroup: {
      description: 'text-customGray-800',
    },
    radio: {
      help: 'text-customGray-800',
    },
    button: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
    },
    input: {
      default: {
        loadingIcon: 'i-eos-icons:loading',
      },
    },
    tabs: {
      list: {
        background: 'bg-neutral-200/80',
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
