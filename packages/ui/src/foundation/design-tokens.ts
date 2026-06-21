export const designColors = {
  customGray: {
    50: '#FFFFFF',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    850: '#1E1E1E',
    900: '#171717',
    950: '#0A0A0A',
  },
  surface: {
    DEFAULT: '#FFFFFF',
    muted: '#F7F8FA',
    subtle: '#FCFCFD',
    keycap: '#EAEAEA',
    accent: '#F6F8FA',
    overlay: 'rgb(255 255 255 / 0.85)',
    overlayDark: 'rgb(0 0 0 / 0.75)',
  },
  border: {
    muted: '#D4D4D8',
    subtle: '#E4E4E7',
    accent: '#E0E7FF',
    hover: '#AABAC9',
  },
  state: {
    success: {
      surface: '#F0FDF4',
      border: '#84CC16',
      text: '#15803D',
    },
    neutral: {
      surface: '#F8FAFC',
      border: '#CBD5E1',
      text: '#64748B',
    },
    warning: {
      surface: '#FEFCE8',
      border: '#FACC15',
      text: '#A16207',
    },
    danger: {
      surface: '#FEF2F2',
      border: '#FECACA',
      text: '#DC2626',
    },
    info: {
      surface: '#EFF6FF',
      border: '#93C5FD',
      text: '#2563EB',
    },
  },
  text: {
    muted: '#71717A',
    subtle: '#52525B',
    strong: '#18181B',
  },
  rating: {
    star: '#FFB100',
  },
} as const

export const designRadii = {
  panel: '1rem',
  dialog: '1.5rem',
  chip: '9999px',
  button: '0.75rem',
} as const

export const designShadows = {
  border: '0 3px 10px rgb(0 0 0 / 0.2)',
  overlay: '0 8px 30px rgba(0,0,0,0.18)',
  hero: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const

export const designLayout = {
  maxWidthHome: '1300px',
  maxWidthShop: '1650px',
  shopSidebarWidth: '220px',
  shopContentMaxWidth: '1400px',
  pageGutter: '2.5rem',
  layoutShopBackground: 'linear-gradient(to top, #f6f8fa, #f6f8fa, #fcfcfd)',
} as const

export const designTokenClasses = {
  shadow: {
    border: 'shadow-border',
    overlay: 'shadow-overlay',
    hero: 'shadow-hero',
  },
} as const

export const sharedTailwindTheme = {
  extend: {
    colors: designColors,
    borderRadius: designRadii,
    boxShadow: designShadows,
    maxWidth: {
      'home-layout': designLayout.maxWidthHome,
      'shop-layout': designLayout.maxWidthShop,
      'shop-layout-content': designLayout.shopContentMaxWidth,
    },
    width: {
      'shop-layout-sidebar': designLayout.shopSidebarWidth,
    },
    spacing: {
      'page-gutter': designLayout.pageGutter,
    },
    backgroundImage: {
      'layout-shop': designLayout.layoutShopBackground,
    },
  },
} as const
