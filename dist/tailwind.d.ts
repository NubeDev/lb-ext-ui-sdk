/** The `data-*` attribute `mountScoped` stamps on the ext root and this preset scopes utilities under. */
export declare const EXT_ROOT_ATTR: "data-ext-root";
/** Build the Tailwind preset fragment for an extension UI: Preflight OFF + all utilities scoped under
 *  `[data-ext-root]`. Spread into `presets`. The ext's own `content`/`theme.extend` stay in its config. */
export declare function extTailwindPreset(): Record<string, unknown>;
//# sourceMappingURL=tailwind.d.ts.map