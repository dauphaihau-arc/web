import { useI18n } from 'vue-i18n';
import enCart from '~/i18n/locales/en/cart.json';

type MessageParams = Record<string, string | number>;
type Translate = (key: string, params?: MessageParams) => string;

/**
 * Cart surfaces use the global catalog. The English catalog doubles as the
 * fallback so a bare component mount (unit tests, isolated previews) without the
 * i18n plugin still renders the default copy instead of throwing.
 */
export function useShopCartCopy(): Translate {
  try {
    const { t } = useI18n({ useScope: 'global' });

    return (key, params) => {
      const message = t(key, params ?? {});

      return message === key
        ? interpolate(lookupMessage(key) ?? key, params)
        : message;
    };
  }
  catch {
    return (key, params) => interpolate(lookupMessage(key) ?? key, params);
  }
}

function lookupMessage(key: string): string | undefined {
  let node: unknown = enCart;

  for (const segment of key.split('.')) {
    if (typeof node !== 'object' || node === null) {
      return undefined;
    }

    node = (node as Record<string, unknown>)[segment];
  }

  return typeof node === 'string' ? node : undefined;
}

function interpolate(message: string, params?: MessageParams): string {
  return message.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params?.[name];

    return value === undefined ? placeholder : String(value);
  });
}
