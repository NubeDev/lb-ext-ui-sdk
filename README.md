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
| `defineRemote()`, `RemoteDef`, `Remote`, `PageRender`, `WidgetRender` | The **federation entry factory** — the authoritative way to build a `remoteEntry.ts`. Give it `{ id, styles, page, widgets }`; it returns `{ mount, mountWidget }` with the scoped mount + React root + widget-dispatch handled. An ext's `remoteEntry.ts` is then generated boilerplate — no hand-written mount plumbing. |
| `defineExtConfig()`, `REACT_EXTERNALS` (from `@nube/ext-ui-sdk/vite`) | The Vite preset: lib-mode ESM `remoteEntry.js` with React externalised (the host import-map / rubix-cube pattern) and CSS kept out of the host `<head>`. |
| `mountScoped()`, `ScopedRender`, `MountScopedOptions` | The lower-level **scoped mount + style** primitive `defineRemote` is built on: wraps the ext in a scoped root inside the host `el` and attaches its stylesheet **there, never `document.head`**. Reach for it directly only if you don't use React. |
| `clampNavChildren()`, `NAV_MAX_*` | The **dynamic nav** caps (`bridge.setNav`): count, depth, label, `vars`. One vocabulary every host shares. See *Lazy nav branches* below. |
| `extTailwindPreset()`, `EXT_ROOT_ATTR` (from `@nube/ext-ui-sdk/tailwind`) | The Tailwind preset that makes the compiled CSS non-leaky: **Preflight OFF** + every utility **scoped under `[data-ext-root]`**. |

## Lazy nav branches

An extension publishes live sidebar children with `bridge.setNav`. Publishing the **whole** tree eagerly
is what forces you into the `NAV_MAX_ITEMS` corner — publish only the open branch, cap at N, append
"… and N more". Two additive fields let you publish a shape instead:

| Field | Direction | Means |
|---|---|---|
| `ExtNavChild.hasChildren` | ext → host | "This node HAS children I haven't given you." The host renders it as an expandable parent with a caret, **initially collapsed**. |
| `PageCtx.navExpanded` (`useNavExpanded()`) | host → ext | The ext-relative refs the host currently renders **expanded** (`"networks/plant-a"`) — same grammar as `ctx.route`. |

```tsx
const expanded = useNavExpanded();                    // e.g. ["networks/plant-a"]
const devices = useDevicesFor(expanded);              // fetch only the open branches
useEffect(() => {
  bridge.setNav?.(networks.map((n) => ({
    id: n.id,
    label: n.name,
    // Say the branch exists; fill it in only once someone opens it.
    ...(devices[n.id] ? { children: devices[n.id] } : { hasChildren: true }),
  })));
}, [bridge, networks, devices]);
```

`navExpanded` is a **state, not an event**, and that is the point: a page can be unmounted while the host
still shows its retained tree, so an expand *event* fired at a dead page would be lost. A set re-supplied
on every `update(ctx)` — and stamped on the **first** `ctx` of a fresh mount — means a page that was not
running when the user expanded still learns which branches are open the moment it mounts.

Both are additive and fail-safe in both directions: an older host ignores `hasChildren` and omits
`navExpanded` (so `useNavExpanded()` is `[]` and the ext just publishes eagerly, as today), and an
extension that never sets either is completely unaffected.

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
5. **Overlay content must portal into the scoped root.** Rule 3 has a consequence that is easy to miss:
   anything rendered through a React **portal** — every Radix dropdown, popover, select, dialog and
   tooltip — defaults to `document.body`, which is **outside** `[data-ext-root]`. It therefore matches
   **none** of the ext's compiled utilities and renders with no width, no background and no padding: an
   unstyled, transparent, full-width overlay across the page. Nothing throws; it just looks broken.
   Pass `usePortalContainer()` as the portal's container:

   ```tsx
   import { usePortalContainer } from "@nube/ext-ui-sdk";        // also on "@nube/ext-ui-sdk/runtime"

   <DropdownMenu.Portal container={usePortalContainer()}>
     <DropdownMenu.Content className="dash-kit …">…</DropdownMenu.Content>
   </DropdownMenu.Portal>
   ```

   This does **not** defeat the reason portals exist. Radix portals to escape an ancestor's `overflow`
   clipping, and the scoped root sets only `h-full w-full` — no `overflow` of its own — so the content
   still escapes the clipping while staying inside the CSS scope. Outside a mounted remote (a story, a
   bare test render) the hook returns `null`, which Radix reads as "use the default container", so the
   same component works in both places.

Because the scoped root lives inside the host-provided `el`, **the host shell needs no change** — an
extension gets isolation purely by mounting through the SDK.

```tsx
// the extension's remoteEntry.ts — GENERATED boilerplate: defineRemote owns the scoped mount, the
// React root, and widget dispatch. No document.head, no hand-written createRoot, no per-ext plumbing.
import styles from "@/styles/tokens.css?inline";        // the ext's OWN component CSS (scoped by the build)
import { defineRemote } from "@nube/ext-ui-sdk";
import { App } from "@/App";
import { GaugeWidget } from "@/widgets/GaugeWidget";

export const { mount, mountWidget } = defineRemote({
  id: "host-metrics",
  styles,
  page: (ctx, bridge) => <App ctx={ctx} bridge={bridge} />,
  widgets: { "host-cpu-mem": (ctx, bridge) => <GaugeWidget bridge={bridge} /> },
});
```

`defineRemote` composes `mountScoped` (below) with a React root under the hood — reach for `mountScoped`
directly only if your UI isn't React.

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
