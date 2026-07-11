import { type ReactNode } from "react";
import type { PageBridge, PageCtx, RemoteMount } from "./page.js";
import type { RemoteWidgetMount, WidgetBridge, WidgetCtx } from "./widget.js";
/** Render the ext's page: given the host `ctx` + `bridge`, return the page's React tree. */
export type PageRender = (ctx: PageCtx, bridge: PageBridge) => ReactNode;
/** Render one widget tile: given the host widget `ctx` + `bridge`, return the tile's React tree. */
export type WidgetRender = (ctx: WidgetCtx, bridge: WidgetBridge) => ReactNode;
/** What an extension hands `defineRemote`: its id, styles, page renderer, and widget renderers by id. */
export interface RemoteDef {
    /** The opaque ext id — scopes the mount root (`data-ext-root="<id>"`) and stylesheet. */
    id: string;
    /** The ext's compiled stylesheet (a CSS string). Attached scoped under the ext root, never head. */
    styles?: string;
    /** The page renderer. Omit an ext that ships only widgets (then `mount` renders nothing). */
    page?: PageRender;
    /** The widget tiles, keyed by `widgetId` (the manifest `[[widget]]` label slug the shell passes). */
    widgets?: Record<string, WidgetRender>;
}
/** The federation contract a `remoteEntry.ts` re-exports: exactly what the host shell dynamic-imports. */
export interface Remote {
    mount: RemoteMount;
    mountWidget: RemoteWidgetMount;
}
/**
 * Build an extension's `{ mount, mountWidget }` federation entry from its `RemoteDef`. This is the ONE
 * place the scoped-mount + React-root + widget-dispatch contract lives; a generated `remoteEntry.ts`
 * just calls it. Both returned functions are CSS-isolated (via `mountScoped`) with no author effort.
 */
export declare function defineRemote(def: RemoteDef): Remote;
//# sourceMappingURL=remote.d.ts.map