import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const localesRoot = fileURLToPath(new URL('../../i18n/locales/', import.meta.url));
const defaultLocale = 'en';

function collectKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return collectKeys(nested, path);
  });
}

function readAreaKeys(locale: string, area: string): string[] {
  const content = JSON.parse(
    readFileSync(join(localesRoot, locale, area), 'utf8'),
  ) as unknown;

  return collectKeys(content).sort();
}

describe('UI Translation key parity', () => {
  const locales = readdirSync(localesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  const areas = readdirSync(join(localesRoot, defaultLocale)).sort();

  it('has the same area files for every locale', () => {
    for (const locale of locales) {
      expect(readdirSync(join(localesRoot, locale)).sort()).toEqual(areas);
    }
  });

  it('has identical keys in every locale for every area', () => {
    for (const area of areas) {
      const expected = readAreaKeys(defaultLocale, area);

      for (const locale of locales) {
        expect(readAreaKeys(locale, area), `${locale}/${area}`).toEqual(expected);
      }
    }
  });
});
