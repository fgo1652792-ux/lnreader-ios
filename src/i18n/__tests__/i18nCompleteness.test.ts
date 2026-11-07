import enStrings from '@i18n/languages/en/strings.json';
import arStrings from '@i18n/languages/ar_SA/strings.json';

type StringTree = { [key: string]: string | { [key: string]: string | Record<string, unknown> } };

const leafEntries = (
  tree: StringTree,
  prefix = '',
): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? [[path, value]]
      : leafEntries(value as StringTree, path);
  });

/** Genuine brand names / technical marks that legitimately stay English. */
const BRAND_ALLOWLIST = new Set([
  'advancedSettingsScreen.dnsOverHttps',
  'webview.openInWebView',
  'generalSettingsScreen.epub',
  'browseScreen.pluginIcon',
  'novelScreen.epub.exportingChapter',
]);

describe('Arabic localization completeness', () => {
  const enLeaves = leafEntries(enStrings as StringTree);
  const arMap = new Map(leafEntries(arStrings as StringTree));

  it('English has a healthy key count', () => {
    expect(enLeaves.length).toBeGreaterThan(750);
  });

  it('covers every English key in Arabic', () => {
    const missing = enLeaves
      .map(([key]) => key)
      .filter(key => !arMap.has(key));
    expect(missing).toEqual([]);
  });

  it('has no orphan Arabic keys', () => {
    const enKeys = new Set(enLeaves.map(([key]) => key));
    const orphans = [...arMap.keys()].filter(key => !enKeys.has(key));
    expect(orphans).toEqual([]);
  });

  it('translates UI text (no English copy-paste), except known brands', () => {
    const untranslated = enLeaves
      .filter(([key, value]) => arMap.get(key) === value)
      .map(([key]) => key)
      .filter(key => !BRAND_ALLOWLIST.has(key));
    expect(untranslated).toEqual([]);
  });

  it('preserves i18n-js interpolation placeholders in plural forms', () => {
    // Arabic `.one` forms intentionally use a natural singular without the
    // count ("رواية واحدة"); every `.other` form must keep all placeholders.
    const problems: string[] = [];
    for (const [key, value] of enLeaves) {
      if (key.endsWith('.one')) {
        continue;
      }
      const placeholders = value.match(/%{[^}]+}/g) ?? [];
      const translated = arMap.get(key) ?? '';
      for (const placeholder of placeholders) {
        if (!translated.includes(placeholder)) {
          problems.push(`missing ${placeholder} in ar translation of ${key}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('keeps plural keys paired (.one/.other)', () => {
    const enKeys = new Set(enLeaves.map(([key]) => key));
    const unpaired: string[] = [];
    for (const key of enKeys) {
      if (key.endsWith('.one')) {
        const other = `${key.slice(0, -4)}.other`;
        if (enKeys.has(other)) {
          if (!arMap.has(key)) {
            unpaired.push(`missing ar .one: ${key}`);
          }
          if (!arMap.has(other)) {
            unpaired.push(`missing ar .other: ${other}`);
          }
        }
      }
    }
    expect(unpaired).toEqual([]);
  });
});
