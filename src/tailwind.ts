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

/** The canonical semantic color map every extension consumes — the SDK OWNS the token→host-var binding
 *  so no extension hand-copies (and mis-guesses) a `colors:` block. Each token reads the host CSS var
 *  cascaded onto the ext root; the `var(…, <fallback>)` default is the DEV-PREVIEW value (ext mounted
 *  outside a themed host), always overridden by the real host value.
 *
 *  The trap this closes: in stock shadcn `--accent` is the SUBTLE HOVER SURFACE, so `hover:bg-accent`
 *  reads as a faint grey. But the host repurposed `--accent` as the BRAND colour (`--accent-foreground`
 *  = `--bg`; host hovers use `bg-accent/0.1`, never a solid fill). An ext that wrote `hover:bg-accent`
 *  by the shadcn convention therefore painted rows the solid brand colour — the "black hover" bug. So
 *  here `accent` maps to the host's real neutral hover surface (`--muted-bg`), matching the shadcn
 *  semantics ext authors expect; the brand colour is exposed separately as `brand` (→ `--accent`) for
 *  the few spots that genuinely want it (drop indicators, accent chips). Fixes every `bg-accent` site
 *  in every extension at once, correctly, with no per-file edits. */
const EXT_COLORS = {
  border: "hsl(var(--border, 220 13% 91%))",
  input: "hsl(var(--input, 220 13% 91%))",
  ring: "hsl(var(--ring, 221 83% 53%))",
  background: "hsl(var(--background, 0 0% 100%))",
  foreground: "hsl(var(--foreground, 222 15% 15%))",
  primary: {
    DEFAULT: "hsl(var(--primary, 221 83% 53%))",
    foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
  },
  secondary: {
    DEFAULT: "hsl(var(--secondary, 220 14% 96%))",
    foreground: "hsl(var(--secondary-foreground, 222 15% 15%))",
  },
  muted: {
    // Muted SURFACE is `--muted-bg` (host `--muted` is a mid-grey FOREGROUND, not a background).
    DEFAULT: "hsl(var(--muted-bg, 220 14% 96%))",
    foreground: "hsl(var(--muted-foreground, 220 9% 46%))",
  },
  // `accent` = the neutral HOVER surface (shadcn semantics), NOT the brand — see EXT_COLORS docstring.
  accent: {
    DEFAULT: "hsl(var(--muted-bg, 220 14% 96%))",
    foreground: "hsl(var(--foreground, 222 15% 15%))",
  },
  // `brand` = the host's real accent/brand colour, for the few spots that want the strong fill.
  brand: {
    DEFAULT: "hsl(var(--accent, 221 83% 53%))",
    foreground: "hsl(var(--accent-foreground, 0 0% 100%))",
  },
  popover: {
    DEFAULT: "hsl(var(--popover, 0 0% 100%))",
    foreground: "hsl(var(--popover-foreground, 222 15% 15%))",
  },
  card: {
    DEFAULT: "hsl(var(--card, 0 0% 100%))",
    foreground: "hsl(var(--card-foreground, 222 15% 15%))",
  },
  destructive: {
    DEFAULT: "hsl(var(--destructive, 0 72% 51%))",
    foreground: "hsl(var(--destructive-foreground, 0 0% 100%))",
  },
} as const;

/** Build the Tailwind preset fragment for an extension UI: Preflight OFF + all utilities scoped under
 *  `[data-ext-root]` + the canonical semantic color map (so `bg-accent`/`bg-muted`/… resolve to the
 *  RIGHT host var in every ext). Spread into `presets`. The ext's own `content` stays in its config; it
 *  may still `theme.extend` its OWN extra tokens — Tailwind deep-merges presets, so these colours are the
 *  shared base and the ext only adds what's unique to it. */
export function extTailwindPreset(): Record<string, unknown> {
  return {
    // No global reset — the ext inherits the host's Preflight.
    corePlugins: { preflight: false },
    // Prepend `[data-ext-root]` to every utility selector: scoped to the ext subtree AND wins locally.
    important: `[${EXT_ROOT_ATTR}]`,
    // The SDK-owned semantic colours (correct host-var bindings for every ext).
    theme: {
      extend: {
        colors: EXT_COLORS,
        borderRadius: {
          lg: "var(--radius, 0.5rem)",
          md: "calc(var(--radius, 0.5rem) - 2px)",
          sm: "calc(var(--radius, 0.5rem) - 4px)",
        },
      },
    },
  };
}
