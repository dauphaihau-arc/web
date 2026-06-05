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
    popover: {
      shadow: 'shadow-[0_8px_30px_rgba(0,0,0,0.18)]',
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
      color: {
        white: {
          outline: 'shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 text-gray-900 dark:text-white bg-white dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400',
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
