import {
  translateError,
  type ErrorTranslator,
} from '~/shared/utils/api-error-copy';

interface PatternMessage {
  pattern: RegExp
  key: string
  group?: string
}

/**
 * Known English schema strings, mapped to the shared validation copy. The
 * schemas stay English so server and client paths share one source; this table
 * is the single translation point for form feedback.
 */
const EXACT_MESSAGE_KEY: Record<string, string> = {
  'This field is required': 'errors.validation.required',
  'Please enter your name': 'errors.validation.nameRequired',
  'Please enter your email address': 'errors.validation.emailRequired',
  'Enter a full email address, like name@example.com': 'errors.validation.emailInvalid',
  'That email address is too long': 'errors.validation.emailTooLong',
  'That email address looks too short': 'errors.validation.emailTooShort',
  'Use letters and spaces only': 'errors.validation.nameCharacters',
  'Please create a password': 'errors.validation.passwordRequired',
  'Include an uppercase letter, a lowercase letter, a number, and a symbol': 'errors.validation.passwordRequirements',
  'Passwords need 8–16 characters, including an uppercase letter, a lowercase letter, a number, and a symbol': 'errors.validation.passwordStrength',
  'This password does not match. Try again.': 'errors.validation.passwordMismatch',
};

const PATTERN_MESSAGE_KEY: PatternMessage[] = [
  { pattern: /^Keep your name to (\d+) characters or fewer$/, key: 'errors.validation.nameMaxLength', group: 'count' },
  { pattern: /^Your name needs at least (\d+) characters$/, key: 'errors.validation.nameMinLength', group: 'count' },
  { pattern: /^Use at least (\d+) characters$/, key: 'errors.validation.passwordMinLength', group: 'count' },
  { pattern: /^Use (\d+) characters or fewer$/, key: 'errors.validation.passwordMaxLength', group: 'count' },
];

/**
 * Maps a client-side schema message to localized validation copy. An unmapped
 * message becomes the generic validation prompt rather than raw English, so a
 * new schema rule never surfaces untranslated text.
 */
export function localizeValidationMessage(
  message: string | undefined,
  t: ErrorTranslator = translateError,
): string {
  if (!message) {
    return t('errors.validation.generic');
  }

  const exactKey = EXACT_MESSAGE_KEY[message];

  if (exactKey) {
    return t(exactKey);
  }

  for (const entry of PATTERN_MESSAGE_KEY) {
    const match = entry.pattern.exec(message);

    if (match) {
      return t(entry.key, { count: Number(match[1]) });
    }
  }

  return t('errors.validation.generic');
}

/**
 * Applies `localizeValidationMessage` to a list of form errors in place.
 */
export function localizeFormErrors<T extends { message?: string }>(
  errors: T[],
  t: ErrorTranslator = translateError,
): T[] {
  return errors.map(error => ({
    ...error,
    message: localizeValidationMessage(error.message, t),
  }));
}
