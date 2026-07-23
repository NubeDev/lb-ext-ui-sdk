/** The `data-*` attribute `mountScoped` stamps on the ext root and this preset scopes utilities under. */
export declare const EXT_ROOT_ATTR: "data-ext-root";
/** Build the Tailwind preset fragment for an extension UI: Preflight OFF + all utilities scoped under
 *  `[data-ext-root]` + the canonical semantic color map (so `bg-accent`/`bg-muted`/… resolve to the
 *  RIGHT host var in every ext). Spread into `presets`. The ext's own `content` stays in its config; it
 *  may still `theme.extend` its OWN extra tokens — Tailwind deep-merges presets, so these colours are the
 *  shared base and the ext only adds what's unique to it. */
export declare function extTailwindPreset(): Record<string, unknown>;
//# sourceMappingURL=tailwind.d.ts.map