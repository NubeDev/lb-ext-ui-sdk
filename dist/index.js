// @nube/ext-ui-sdk — the authoritative UI contract for Lazybones extensions.
//
// The host shell (lb) and every extension import these types from here. This package is the SINGLE
// SOURCE the old per-extension `app/contract.ts` copies and the host-side type collapse into.
export { WIDGET_CONTRACT_VERSION } from "./widget.js";
export { defineExtConfig, REACT_EXTERNALS } from "./vite.js";
// Theme & CSS isolation — the SDK OWNS this so every extension is non-leaky for free. `mountScoped`
// wraps the ext in a scoped root and attaches its stylesheet there (never `document.head`);
// `extTailwindPreset` drops Preflight and scopes utilities under that root. See the SDK README
// "Theme & CSS" section. Extensions never define the theme and never write to `document.head`.
export { mountScoped } from "./mount.js";
export { extTailwindPreset, EXT_ROOT_ATTR } from "./tailwind.js";
// `defineRemote` — the SDK-owned federation entry factory. An ext's `remoteEntry.ts` is generated
// boilerplate that calls this; the scoped mount + React root + widget dispatch live here, so no ext
// hand-writes the mount plumbing. It composes `mountScoped` (CSS isolation) with a React root.
export { defineRemote } from "./remote.js";
// i18n — the SDK-owned catalog seam (lb release scope, gap d): extensions and shells ship flat
// en/es catalogs, resolve locale via user pref → navigator.language → en, and gate key parity in
// CI with `catalogParity`. Additive; nothing existing changes.
export { resolveLocale, makeTranslator, catalogParity, FALLBACK_LOCALE } from "./i18n.js";
//# sourceMappingURL=index.js.map