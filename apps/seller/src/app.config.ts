export default defineAppConfig({
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
  },
  icon: {
    size: '20px', // default <Icon> size applied
    class: 'icon', // default <Icon> class applied
    mode: 'svg', // default <Icon> mode applied
    aliases: {
      'search': 'i-uil:search',
    },
  },
});
