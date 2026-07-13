/** A flat catalog: dotted key → message source with `{arg}` placeholders. */
export type Catalog = Record<string, string>;
/** Catalogs by locale (BCP-47 base code), e.g. `{ en: {...}, es: {...} }`. */
export type Catalogs = Record<string, Catalog>;
export declare const FALLBACK_LOCALE = "en";
/**
 * Resolve the display locale: the user's pref (if set and shipped) → the browser language's base
 * code (if shipped) → `en`. `enabled` is the locale set the catalogs actually ship.
 */
export declare function resolveLocale(userPref?: string | null, enabled?: string[]): string;
/** A translate function bound to one locale over one catalog set. */
export type Translator = (key: string, args?: Record<string, unknown>) => string;
/**
 * Build a translator for `locale` over `catalogs`. Selection chain (never blank, never throws):
 * the locale's catalog → the `en` catalog → the key literal.
 */
export declare function makeTranslator(catalogs: Catalogs, locale: string): Translator;
/**
 * The completeness gate for TS catalogs (the twin of the host's `.mf` key-parity test): every
 * locale must carry exactly the same key set. Returns the offending descriptions — empty means
 * parity holds. Wire it into a test so a key added in one language fails the build.
 */
export declare function catalogParity(catalogs: Catalogs): string[];
//# sourceMappingURL=i18n.d.ts.map