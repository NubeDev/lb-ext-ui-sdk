import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSession } from "./runtime.js";
/** Trailing hairline styles are inline too (see file header). `none` (the default) floats the bar. */
const LINE_BORDER = {
    none: {},
    bottom: { borderBottom: "1px solid hsl(var(--border) / 0.6)" },
    top: { borderTop: "1px solid hsl(var(--border) / 0.6)" },
    both: { borderTop: "1px solid hsl(var(--border) / 0.6)", borderBottom: "1px solid hsl(var(--border) / 0.6)" },
};
/** Read the member's header choices + the host sidebar-toggle callback from the mount `ctx` (threaded by
 *  the host through `PageCtx`). Inherit-only: there is no ext override — the values are exactly what the
 *  member picked in Settings → Theme → Layout. Absent axes fall back to the shell defaults. */
function useHeaderChoice(fallback) {
    const session = useSession();
    return {
        style: session?.headerStyle ?? fallback,
        line: session?.headerLine ?? "none",
        sidebarToggle: session?.sidebarToggle ?? "shown",
        onToggleSidebar: session?.onToggleSidebar,
        workspace: session?.workspace,
    };
}
/**
 * The extension page shell. Wrap a surface in it and its header inherits the host's Header chrome:
 *
 *   <ExtPage title="Sites" icon={<Building2 size={16} />} actions={<Button>Add</Button>}>…</ExtPage>
 *
 * A drill page passes a clickable trail instead of a plain title:
 *
 *   <ExtPage crumbs={[{ label: "Sites", onClick: goRoot }, { label: site.name }]}>…</ExtPage>
 *
 * The ext supplies title/crumbs / workspace / icon / actions only; the SDK picks the shape and the
 * sidebar toggle from `ctx`.
 */
export function ExtPage({ title, crumbs, workspace, icon, description, actions, children, fallbackStyle = "slim", }) {
    const { style, line, sidebarToggle, onToggleSidebar, workspace: ctxWorkspace } = useHeaderChoice(fallbackStyle);
    // The trail the header renders: an explicit `crumbs` wins; otherwise a single-step trail from `title`.
    const trail = crumbs ?? [{ label: title ?? "" }];
    // The toggle button shows only when the member left it `shown` AND the host actually provided a toggle
    // callback (nothing to toggle in a bare preview) — exactly the host slim header's condition.
    const toggle = sidebarToggle === "shown" ? onToggleSidebar : undefined;
    return (_jsxs("section", { style: { display: "flex", flexDirection: "column", height: "100%", minWidth: 0, color: "hsl(var(--foreground))", background: "hsl(var(--background))" }, children: [_jsx(ExtHeader, { style: style, line: line, trail: trail, workspace: workspace ?? ctxWorkspace, icon: icon, description: description, actions: actions, onToggleSidebar: toggle }), _jsx("div", { style: {
                    display: "flex",
                    minHeight: 0,
                    flex: 1,
                    flexDirection: "column",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                }, children: children })] }));
}
/** The header itself — the SAME three shapes the host renders (`slim` / `band` / `breadcrumbs`), so an ext
 *  page is visually indistinguishable from a host page at any setting. Exported for the rare host/tooling
 *  that needs the bare header; `<ExtPage>` is the normal entry. */
export function ExtHeader({ style, line, trail, workspace, icon, description, actions, onToggleSidebar }) {
    if (style === "band")
        return _jsx(BandHeader, { trail: trail, workspace: workspace, icon: icon, description: description, actions: actions });
    if (style === "breadcrumbs")
        return _jsx(BreadcrumbsHeader, { line: line, trail: trail, workspace: workspace, icon: icon, actions: actions, onToggleSidebar: onToggleSidebar });
    return _jsx(SlimHeader, { line: line, trail: trail, workspace: workspace, actions: actions, onToggleSidebar: onToggleSidebar });
}
/** The sidebar minimise/expand button — the host slim header's `SidebarTrigger`, matched: a ghost icon
 *  button drawing the lucide `PanelLeft` glyph as inline SVG (the SDK ships no icon set), then a vertical
 *  rule. Rendered only when the host provided a toggle callback. */
function SidebarToggleButton({ onToggle }) {
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: onToggle, "aria-label": "Toggle sidebar", title: "Toggle sidebar", style: { display: "inline-flex", height: 28, width: 28, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "calc(var(--radius) - 4px)", border: "none", background: "transparent", color: "hsl(var(--muted-foreground))", cursor: "pointer" }, children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [_jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }), _jsx("path", { d: "M9 3v18" })] }) }), _jsx("span", { "aria-hidden": true, style: { height: 20, width: 1, flexShrink: 0, background: "hsl(var(--border))" } })] }));
}
/** Shared trailing cluster: the actions the ext passed. (No Settings gear — routing to host settings is
 *  the HOST chrome's job, outside the ext mount; an ext must not fabricate a host route.) */
function Actions({ actions }) {
    return _jsx("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: actions });
}
/** The workspace + clickable breadcrumb trail, mirroring the host breadcrumb trail. The workspace
 *  segment is a LINK to the host workspace root (`#/t/<ws>`) — exactly where the host's own headers
 *  send it — via a plain anchor on the host's hash contract (the `hostLink` mechanism; an ext still
 *  never pushes history itself). Each non-last crumb with an `onClick` is a button that jumps to
 *  that level; the last crumb is the current page (plain, `aria-current`). */
function Trail({ workspace, trail }) {
    const sep = (_jsx("span", { "aria-hidden": true, style: { color: "hsl(var(--muted-foreground))", padding: "0 2px" }, children: "/" }));
    return (_jsxs("nav", { "aria-label": "Breadcrumb", style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, minWidth: 0 }, children: [workspace ? (_jsxs(_Fragment, { children: [_jsx("a", { href: `#/t/${encodeURIComponent(workspace)}`, style: { color: "hsl(var(--muted-foreground))", textDecoration: "none" }, onMouseEnter: (e) => { e.currentTarget.style.color = "hsl(var(--foreground))"; }, onMouseLeave: (e) => { e.currentTarget.style.color = "hsl(var(--muted-foreground))"; }, children: workspace }), sep] })) : null, trail.map((c, i) => {
                const last = i === trail.length - 1;
                return (_jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }, children: [i > 0 ? sep : null, last || !c.onClick ? (_jsx("span", { "aria-current": last ? "page" : undefined, style: { fontWeight: last ? 600 : 400, letterSpacing: last ? "-0.01em" : undefined, color: last ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: c.label })) : (_jsx("button", { type: "button", onClick: c.onClick, style: { border: "none", background: "transparent", padding: 0, cursor: "pointer", color: "hsl(var(--muted-foreground))", font: "inherit" }, children: c.label }))] }, i));
            })] }));
}
/** `slim` — the shadcn-admin compact bar (the host default). One flat h-14 bar: the sidebar toggle (when
 *  the host provides one and the member left it shown), the trail, then actions. No icon chip, no wash. */
function SlimHeader({ line, trail, workspace, actions, onToggleSidebar }) {
    return (_jsxs("header", { style: { display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 8, padding: "0 12px", ...LINE_BORDER[line] }, children: [onToggleSidebar ? _jsx(SidebarToggleButton, { onToggle: onToggleSidebar }) : null, _jsx(Trail, { workspace: workspace, trail: trail }), _jsx(Actions, { actions: actions })] }));
}
/** `breadcrumbs` — the minimal trail with a small muted glyph anchor (parity with the host breadcrumbs
 *  header): the sidebar toggle (same condition as slim), the anchor + trail, then actions. */
function BreadcrumbsHeader({ line, trail, workspace, icon, actions, onToggleSidebar }) {
    return (_jsxs("header", { style: { display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 12, padding: "0 16px", ...LINE_BORDER[line] }, children: [onToggleSidebar ? _jsx(SidebarToggleButton, { onToggle: onToggleSidebar }) : null, icon ? _jsx("span", { "aria-hidden": true, style: { display: "inline-flex", flexShrink: 0, color: "hsl(var(--muted-foreground))" }, children: icon }) : null, _jsx(Trail, { workspace: workspace, trail: trail }), _jsx(Actions, { actions: actions })] }));
}
/** `band` — the tall icon-chip header: an accent-tinted chip + title/subtitle, the accent wash and the
 *  two-hue signature hairline. Mirrors the host band shape (`min-h-[3.75rem]`). The band header has no
 *  sidebar toggle (parity with the host — the band pairs with the sidebar, which owns its own edge rail).
 *  Its "title" is the LAST crumb; earlier crumbs render as the muted trail prefix. */
function BandHeader({ trail, workspace, icon, description, actions }) {
    const last = trail[trail.length - 1];
    const prefix = trail.slice(0, -1);
    return (_jsxs("header", { style: { position: "relative", display: "flex", minHeight: "3.75rem", alignItems: "center", gap: 12, padding: "10px 16px", background: "hsl(var(--card) / 0.6)" }, children: [_jsx("div", { "aria-hidden": true, style: { position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg, hsl(var(--accent) / 0.09), hsl(var(--accent-2) / 0.04) 32%, transparent 60%)" } }), _jsx("div", { "aria-hidden": true, style: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1, pointerEvents: "none", background: "linear-gradient(90deg, hsl(var(--accent) / 0.6), hsl(var(--accent-2) / 0.4) 34%, hsl(var(--border)) 72%)" } }), icon ? (_jsx("div", { style: { position: "relative", display: "flex", height: 36, width: 36, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "calc(var(--radius) - 2px)", border: "1px solid hsl(var(--accent) / 0.25)", color: "hsl(var(--accent))", background: "linear-gradient(135deg, hsl(var(--accent) / 0.16), hsl(var(--accent-2) / 0.10))" }, children: icon })) : null, _jsxs("div", { style: { position: "relative", minWidth: 0 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }, children: [workspace ? (_jsxs("a", { href: `#/t/${encodeURIComponent(workspace)}`, style: { color: "hsl(var(--muted-foreground))", fontSize: 12, textDecoration: "none" }, children: [workspace, " /"] })) : null, prefix.map((c, i) => (_jsxs("span", { style: { color: "hsl(var(--muted-foreground))", fontSize: 12 }, children: [c.onClick ? (_jsx("button", { type: "button", onClick: c.onClick, style: { border: "none", background: "transparent", padding: 0, cursor: "pointer", color: "inherit", font: "inherit" }, children: c.label })) : c.label, " /"] }, i))), _jsx("span", { style: { fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: last?.label })] }), description ? _jsx("p", { style: { margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))" }, children: description }) : null] }), _jsx(Actions, { actions: actions })] }));
}
//# sourceMappingURL=ext-page.js.map