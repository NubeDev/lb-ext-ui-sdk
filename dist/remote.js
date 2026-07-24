import { jsx as _jsx } from "react/jsx-runtime";
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
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { mountScoped } from "./mount.js";
import { RuntimeProvider } from "./runtime.js";
/** Render into `el` (scoped + isolated) via a React root, returning a live `{ update, teardown }`. Shared by
 *  the page and widget paths so the mount plumbing exists once. `renderNode(ctx)` is re-invoked on every
 *  `update` so a fresh `ctx` (route/caps/theme) flows both through the returned tree AND the `RuntimeProvider`
 *  (so `useRoute`/`useSession` see it) — React reconciles the SAME root, so the ext component is NOT remounted
 *  and its state survives. `update` calling `root.render` again is idempotent reconciliation, not a new mount. */
function renderScoped(el, id, styles, ctx, bridge, renderNode) {
    let root = null;
    const tree = (c) => (_jsx(StrictMode, { children: _jsx(RuntimeProvider, { ctx: c, bridge: bridge, children: renderNode(c) }) }));
    const teardown = mountScoped(el, { id, styles }, (mount) => {
        root = createRoot(mount);
        root.render(tree(ctx));
        return () => root?.unmount();
    });
    return {
        // Re-render on the EXISTING root — reconciliation, never a remount (the whole point of the handle).
        update: (next) => root?.render(tree(next)),
        teardown,
    };
}
/**
 * Build an extension's `{ mount, mountWidget }` federation entry from its `RemoteDef`. This is the ONE
 * place the scoped-mount + React-root + widget-dispatch contract lives; a generated `remoteEntry.ts`
 * just calls it. Both returned functions are CSS-isolated (via `mountScoped`) with no author effort.
 */
export function defineRemote(def) {
    const { id, styles, page, widgets = {} } = def;
    // A page returns a live `{ update, teardown }` handle: the host drives `update(ctx)` to re-supply a new
    // `ctx.route`/caps IN PLACE (no remount — see `renderScoped`). A host that only knows the legacy teardown
    // form still works: `teardown` is a function on the handle and the shipped `ExtHost` calls it on unmount.
    const mount = (el, ctx, bridge) => {
        const handle = renderScoped(el, id, styles, ctx, bridge, (c) => page ? page(c, bridge) : null);
        return { update: handle.update, teardown: handle.teardown };
    };
    const mountWidget = (el, ctx, bridge, widgetId) => {
        // Dispatch by id; fall back to the first declared widget for an unknown/empty id (matches the
        // shell's `ext:<id>/<widget>` key resolution being best-effort). Widgets keep the legacy bare-teardown
        // return (the shipped widget host expects `void | (() => void) | WidgetHandle`) — nav re-supply is a
        // page concern, so we return only the teardown here and leave the widget contract untouched.
        const render = widgets[widgetId] ?? Object.values(widgets)[0];
        const handle = renderScoped(el, id, styles, ctx, bridge, () => render ? render(ctx, bridge) : null);
        return handle.teardown;
    };
    return { mount, mountWidget };
}
//# sourceMappingURL=remote.js.map