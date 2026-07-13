// i18n — the SDK-owned catalog seam (lb release scope, i18n gap d). An extension UI (or the
// minimal shell) ships flat dotted-key catalogs per locale — the SAME shape as the host's `.mf`
// catalogs (catalogs hold words, code holds keys) — registers them here, and translates through
// one `t()`. Locale resolution is the pinned chain: user pref → `navigator.language` base → `en`.
//
// Scope note: this renders the simple-interpolation subset (`{name}` placeholders). Rich MF1
// (plural/select/typed formats) stays the HOST's job — server-generated content comes through the
// host catalog engine (`message.render` / the generated client twin), never re-implemented here.

/** A flat catalog: dotted key → message source with `{arg}` placeholders. */
export type Catalog = Record<string, string>;
/** Catalogs by locale (BCP-47 base code), e.g. `{ en: {...}, es: {...} }`. */
export type Catalogs = Record<string, Catalog>;

export const FALLBACK_LOCALE = "en";

/**
 * Resolve the display locale: the user's pref (if set and shipped) → the browser language's base
 * code (if shipped) → `en`. `enabled` is the locale set the catalogs actually ship.
 */
export function resolveLocale(
  userPref?: string | null,
  enabled: string[] = [FALLBACK_LOCALE],
): string {
  if (userPref && enabled.includes(userPref)) return userPref;
  const nav =
    typeof navigator !== "undefined" && navigator.language
      ? navigator.language.split("-")[0]
      : "";
  if (nav && enabled.includes(nav)) return nav;
  return FALLBACK_LOCALE;
}

/** Interpolate `{name}` placeholders from `args`. A missing arg renders `[name]` (never blank). */
function interpolate(src: string, args?: Record<string, unknown>): string {
  return src.replace(/\{(\w+)\}/g, (_, name) =>
    args && name in args ? String(args[name]) : `[${name}]`,
  );
}

/** A translate function bound to one locale over one catalog set. */
export type Translator = (key: string, args?: Record<string, unknown>) => string;

/**
 * Build a translator for `locale` over `catalogs`. Selection chain (never blank, never throws):
 * the locale's catalog → the `en` catalog → the key literal.
 */
export function makeTranslator(catalogs: Catalogs, locale: string): Translator {
  return (key, args) => {
    const src = catalogs[locale]?.[key] ?? catalogs[FALLBACK_LOCALE]?.[key];
    return src === undefined ? key : interpolate(src, args);
  };
}

/**
 * The completeness gate for TS catalogs (the twin of the host's `.mf` key-parity test): every
 * locale must carry exactly the same key set. Returns the offending descriptions — empty means
 * parity holds. Wire it into a test so a key added in one language fails the build.
 */
export function catalogParity(catalogs: Catalogs): string[] {
  const locales = Object.keys(catalogs);
  if (locales.length === 0) return ["no catalogs registered"];
  const base = locales[0] as string;
  const baseKeys = new Set(Object.keys(catalogs[base] ?? {}));
  const problems: string[] = [];
  for (const loc of locales.slice(1)) {
    const keys = new Set(Object.keys(catalogs[loc] ?? {}));
    for (const k of baseKeys) if (!keys.has(k)) problems.push(`${loc}: missing key '${k}' (present in ${base})`);
    for (const k of keys) if (!baseKeys.has(k)) problems.push(`${base}: missing key '${k}' (present in ${loc})`);
  }
  return problems;
}
