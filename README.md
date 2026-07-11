# @nube/ext-ui-sdk

The **authoritative UI contract for Lazybones extensions**. This package owns the page and
widget mount contracts, the Vite build preset, and **theme + CSS isolation** (an extension's
styles can never leak into or override the host — see [Theme & CSS](#theme--css-isolation-the-sdk-owns));
the Lazybones shell (`lb`) and every extension UI consume it. It is the **single source** that the old three copies — the
host-side type, each extension's `app/contract.ts`, and the devkit template — collapse into.

Published to npm (under `aidanpick`); consumable by a downstream team with **no access to
the private `lb` repo**.

## What it exports

| Export | What it is |
|---|---|
| `RemoteMount`, `PageCtx`, `PageBridge` | The **page** mount contract: `mount(el, ctx, bridge)`. |
| `RemoteWidgetMount`, `WidgetCtx`, `WidgetFrame`, `WidgetTheme`, `WidgetHandle`, `WidgetBridge` | The **widget** (frames-in) contract, **v4** — `ctx.data` resolved frames + `ctx.theme` tokens. |
| `WIDGET_CONTRACT_VERSION` | `4` — tiles gate on `ctx.v` (`>= 3` data, `>= 4` theme). |
| `defineExtConfig()`, `REACT_EXTERNALS` (from `@nube/ext-ui-sdk/vite`) | The Vite preset: lib-mode ESM `remoteEntry.js` with React externalised (the host import-map / rubix-cube pattern) and CSS kept out of the host `<head>`. |
| `mountScoped()`, `ScopedRender`, `MountScopedOptions` | The **scoped mount + style** helper: wraps the ext in a scoped root inside the host `el` and attaches its stylesheet **there, never `document.head`**. |
| `extTailwindPreset()`, `EXT_ROOT_ATTR` (from `@nube/ext-ui-sdk/tailwind`) | The Tailwind preset that makes the compiled CSS non-leaky: **Preflight OFF** + every utility **scoped under `[data-ext-root]`**. |

## Theme & CSS (isolation the SDK owns)

**The host owns the theme; extensions CONSUME it, never define it.** An extension UI renders *inside*
the host DOM, so its styles must never leak into or override the host. This SDK makes that structural,
so no extension author has to get it right by hand.

The contract:

1. **No ext-defined theme.** An extension **must not** ship `:root{}` / `.dark{}` token blocks — those
   redefine the host's `--bg`/`--accent`/… globally and repaint the whole host. A **DOM** page/widget
   sits in the host DOM and **inherits** the host tokens via the CSS cascade. A **JS/canvas** widget
   (ECharts, three.js — can't read a CSS var) reads the resolved tokens from **`ctx.theme`** (`WidgetTheme`,
   v4) and recolors on the `update(ctx)` fired by a host light/dark toggle.
2. **No Preflight.** An extension **must not** emit Tailwind Preflight (`@tailwind base`) — it's a global
   `*, body, h1–h6, button, a…` reset that would restyle the host chrome. The host already ran its own
   Preflight; the ext inherits it. `extTailwindPreset()` sets `corePlugins.preflight = false`.
3. **All ext CSS is scoped.** `extTailwindPreset()` sets `important: '[data-ext-root]'`, so every compiled
   utility becomes `[data-ext-root] .p-4 { … }` — confined to the ext's own mount subtree, never matching
   host elements, and winning specificity locally without leaking `!important` outward.
4. **Never `document.head`.** The stylesheet is attached by `mountScoped` **inside the scoped root**, not
   the host head. `defineExtConfig()`'s `cssCodeSplit: true` keeps Vite from inlining it into `<head>`.

Because the scoped root lives inside the host-provided `el`, **the host shell needs no change** — an
extension gets isolation purely by mounting through the SDK.

```ts
// the extension's remoteEntry.ts — ONE scoped mount, no document.head, no ?inline head-injection
import styles from "@/styles/tokens.css?inline";        // the ext's OWN component CSS (scoped by the build)
import { mountScoped } from "@nube/ext-ui-sdk";
import { createRoot } from "react-dom/client";

export const mount: RemoteMount = (el, ctx, bridge) =>
  mountScoped(el, { id: "proof-panel", styles }, (root) => {
    const r = createRoot(root);
    r.render(<App ctx={ctx} bridge={bridge} />);
    return () => r.unmount();
  });
```

```ts
// the extension's tailwind.config.ts — Preflight off + utilities scoped, from the preset
import { extTailwindPreset } from "@nube/ext-ui-sdk/tailwind";
export default {
  presets: [extTailwindPreset()],
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { colors: { accent: "hsl(var(--accent))" /* host token via cascade */ } } },
};
```

`tokens.css` carries **only** `@tailwind components; @tailwind utilities;` and the ext's own scoped
component styles — **no `@tailwind base`, no `:root{}`/`.dark{}`**.

> **Why scoped-class, not Shadow DOM?** Shadow DOM is stronger isolation but breaks the CSS-cascade
> inheritance this contract relies on (host tokens would have to be *forwarded* onto every shadow host),
> and traps React portals/dialogs (popovers escape to `document.body`, outside the shadow). Scoped-class
> gives full leak protection while letting host tokens cascade in for free and portals work unchanged —
> the same pattern the core `packages/*` stylesheets use.

## Use

```ts
// an extension page
import type { RemoteMount } from "@nube/ext-ui-sdk";
export const mount: RemoteMount = (el, ctx, bridge) => { /* … */ };
```

```ts
// the extension's vite.config.ts
import { defineConfig } from "vite";
import { defineExtConfig } from "@nube/ext-ui-sdk/vite";
export default defineConfig({ ...defineExtConfig({ externals: ["echarts"] }) });
```

## Build

```sh
pnpm install
pnpm build      # tsc → dist/
pnpm test       # vitest
```

`pnpm-workspace.yaml` carries the pnpm-11 build-script allow policy (esbuild, via vitest) so
install/build/test don't stop on the approval gate.

## Relationship to `lb`

The contract types **moved out of** `lb`'s shell (`ext-host/federation.ts`,
`dashboard/builder/federationWidget.ts`) into this package; `lb` imports them from here. One
source of truth, not a mirror. Owning design doc:
`lb/docs/scope/extensions/ext-out-of-tree-scope.md`.

## License

MIT (see [LICENSE](LICENSE)).
