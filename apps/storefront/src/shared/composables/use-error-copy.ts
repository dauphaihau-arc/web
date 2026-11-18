import { useI18n } from 'vue-i18n';
import {
  translateError,
  type ErrorTranslator,
} from '~/shared/utils/api-error-copy';

/**
 * Translator for the shared error area (`errors.*`). Nuxt renders the active
 * locale; a bare component mount (unit tests, isolated previews) without the
 * i18n plugin falls back to the English catalog instead of throwing. When the
 * plugin is present but a catalog omits the `errors` area, the key itself is
 * returned, so the English catalog still wins.
 */
export function useErrorCopy(): ErrorTranslator {
  try {
    const { t } = useI18n({ useScope: 'global' });

    return (key, params) => {
      const message = t(key, params ?? {});

      return message === key ? translateError(key, params) : message;
    };
  }
  catch {
    return translateError;
  }
}
