// `extTailwindPreset()` — the SDK-owned Tailwind config fragment that makes an extension's compiled CSS
// inherently NON-LEAKY. Spread into the ext's `tailwind.config.ts` `presets: [...]`.
//
// Two settings do the isolation, so no extension author has to remember them:
//
//   1. `corePlugins.preflight = false` — DROP Tailwind Preflight. Preflight is a GLOBAL reset
//      (`*, ::before, body, h1–h6, button, a, img…`). Emitting it and injecting it into the host would
//      restyle the host's own chrome. An extension renders INSIDE the host DOM, which is already reset by
//      the host's own Preflight, so the ext needs none — it inherits.
//
//   2. `important = '[data-ext-root]'` — SCOPE every utility under the ext's mount root. In Tailwind v3 a
//      selector-string `important` PREPENDS that selector to every utility: `.p-4` becomes
//      `[data-ext-root] .p-4 { … !important }`. This both (a) confines the utility to the subtree
//      `mountScoped` creates (`<div data-ext-root="<id>">`) — it can't match host elements — and (b) wins
//      any specificity race inside the ext without leaking `!important` outward, since it only ever
//      matches under the root. Utility collisions with the host are structurally impossible.
//
// The ext ALSO must not ship `:root{}` / `.dark{}` token blocks (those redefine host tokens globally):
// the scoped root inherits `--bg`/`--accent`/… from the host via the cascade. This preset can't stop an
// author writing raw `:root{}` in a `.css` file, so the theme/css contract (see the SDK README) forbids
// it and the extension's build test asserts the emitted bundle has neither `:root` nor Preflight.
//
// Returns a plain Tailwind-config-shaped object with NO dependency on `tailwindcss`, keeping this package
// dependency-free (mirrors `defineExtConfig`).

/** The `data-*` attribute `mountScoped` stamps on the ext root and this preset scopes utilities under. */
export const EXT_ROOT_ATTR = "data-ext-root" as const;

/** Build the Tailwind preset fragment for an extension UI: Preflight OFF + all utilities scoped under
 *  `[data-ext-root]`. Spread into `presets`. The ext's own `content`/`theme.extend` stay in its config. */
export function extTailwindPreset(): Record<string, unknown> {
  return {
    // No global reset — the ext inherits the host's Preflight.
    corePlugins: { preflight: false },
    // Prepend `[data-ext-root]` to every utility selector: scoped to the ext subtree AND wins locally.
    important: `[${EXT_ROOT_ATTR}]`,
  };
}
