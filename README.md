# @nube/ext-ui-sdk

The **authoritative UI contract for Lazybones extensions**. This package owns the page and
widget mount contracts and the Vite build preset; the Lazybones shell (`lb`) and every
extension UI consume it. It is the **single source** that the old three copies — the
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
