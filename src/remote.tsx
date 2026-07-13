// `defineRemote()` — the SDK-owned federation entry factory. An extension's `remoteEntry.ts` is now
// GENERATED boilerplate: it calls `defineRemote` and re-exports the result. All the mount plumbing —
// CSS-isolated scoped mount (`mountScoped`), the React root (`createRoot` + `StrictMode`), and widget
// dispatch by id — lives HERE, in one place, so no extension hand-writes it and a contract change is a
// single SDK release (never a per-ext edit, never a "three mirrors" drift).
//
// An extension supplies only its own concerns:
//   - `id`      — the opaque ext id (scopes the mount root + stylesheet).
//   - `styles`  — its compiled stylesheet string (`import styles from "./styles/tokens.css?inline"`).
//   - `page`    — a render fn `(ctx, bridge) => ReactNode` (its page component wired to the bridge).
//   - `widgets` — a map `{ [widgetId]: (ctx, bridge) => ReactNode }` for its `[[widget]]` tiles.
//
// `defineRemote` returns `{ mount, mountWidget }` — the exact `RemoteMount` / `RemoteWidgetMount` the
// host shell calls. Each wraps the ext's ReactNode in `mountScoped` (scoped `[data-ext-root]` root +
// stylesheet under it, never `document.head`) and a React root rendered into the scoped content child
// (so `createRoot` can't wipe the injected `<style>` — see `mountScoped`). `mountWidget` dispatches on
// `widgetId` to the matching entry in `widgets`; an unknown/empty id falls back to the first widget.
//
// React is externalised by the ext build (`defineExtConfig`), so the `react`/`react-dom` imports here
// resolve through the host shell's import map to its SINGLE React — no second copy, no "Invalid hook".

import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { mountScoped } from "./mount.js";
import type { PageBridge, PageCtx, RemoteMount } from "./page.js";
import type { RemoteWidgetMount, WidgetBridge, WidgetCtx } from "./widget.js";
import { RuntimeProvider } from "./runtime.js";

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

/** Render `node` into `el` (scoped + isolated) via a React root, returning a single teardown. Shared by
 *  the page and widget paths so the mount plumbing exists once. Wraps the ext tree in `RuntimeProvider`
 *  (fed the host `ctx`/`bridge`) so the ext's `useSession`/`useMcpClient` resolve without any wiring. */
function renderScoped(
  el: HTMLElement,
  id: string,
  styles: string | undefined,
  ctx: PageCtx,
  bridge: PageBridge,
  node: ReactNode,
) {
  return mountScoped(el, { id, styles }, (mount) => {
    const root = createRoot(mount);
    root.render(
      <StrictMode>
        <RuntimeProvider ctx={ctx} bridge={bridge}>
          {node}
        </RuntimeProvider>
      </StrictMode>,
    );
    return () => root.unmount();
  });
}

/**
 * Build an extension's `{ mount, mountWidget }` federation entry from its `RemoteDef`. This is the ONE
 * place the scoped-mount + React-root + widget-dispatch contract lives; a generated `remoteEntry.ts`
 * just calls it. Both returned functions are CSS-isolated (via `mountScoped`) with no author effort.
 */
export function defineRemote(def: RemoteDef): Remote {
  const { id, styles, page, widgets = {} } = def;

  const mount: RemoteMount = (el, ctx, bridge) =>
    renderScoped(el, id, styles, ctx, bridge, page ? page(ctx, bridge) : null);

  const mountWidget: RemoteWidgetMount = (el, ctx, bridge, widgetId) => {
    // Dispatch by id; fall back to the first declared widget for an unknown/empty id (matches the
    // shell's `ext:<id>/<widget>` key resolution being best-effort).
    const render = widgets[widgetId] ?? Object.values(widgets)[0];
    return renderScoped(el, id, styles, ctx, bridge, render ? render(ctx, bridge) : null);
  };

  return { mount, mountWidget };
}
