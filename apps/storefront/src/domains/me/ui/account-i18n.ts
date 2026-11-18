import enAccount from '~/i18n/locales/en/account.json';

/**
 * Translator for the account area (`account.*`).
 *
 * Some account components are mounted directly in unit tests without the Nuxt
 * i18n plugin. `useAccountTranslator` falls back to the English catalog in that
 * case, so those components keep their English copy while Nuxt-rendered pages
 * read the active locale.
 */
export type AccountTranslator = (
  key: string,
  params?: Record<string, unknown>,
) => string;

function resolveMessage(catalog: unknown, key: string): string | undefined {
  let value: unknown = catalog;

  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    value = (value as Record<string, unknown>)[part];
  }

  return typeof value === 'string' ? value : undefined;
}

export function translateAccount(
  key: string,
  params?: Record<string, unknown>,
): string {
  const message = resolveMessage(enAccount, key) ?? key;

  return message.replace(/\{(\w+)\}/g, (match, name: string) => (
    params && name in params ? String(params[name]) : match
  ));
}

export function useAccountTranslator(): AccountTranslator {
  try {
    const { t } = useI18n();

    return (key, params) => t(key, params ?? {});
  }
  catch {
    return translateAccount;
  }
}
