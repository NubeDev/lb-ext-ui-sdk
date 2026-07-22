import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useSession } from "./runtime.js";
/** Trailing hairline classes are inline too (see file header). `none` (the default) floats the bar. */
const LINE_BORDER = {
    none: {},
    bottom: { borderBottom: "1px solid hsl(var(--border) / 0.6)" },
    top: { borderTop: "1px solid hsl(var(--border) / 0.6)" },
    both: { borderTop: "1px solid hsl(var(--border) / 0.6)", borderBottom: "1px solid hsl(var(--border) / 0.6)" },
};
/** Read the member's header choice from the mount `ctx` (threaded by the host through `PageCtx`). The
 *  session type carries the optional axes; absent ⇒ the shell defaults. Inherit-only: there is no ext
 *  override — the value is exactly what the member picked in Settings → Theme → Layout. */
function useHeaderChoice(fallback) {
    const session = useSession();
    return {
        style: session?.headerStyle ?? fallback,
        line: session?.headerLine ?? "none",
    };
}
/**
 * The extension page shell. Wrap a surface in it and its header inherits the host's Header-style setting:
 *
 *   <ExtPage title="Sites" icon={<Building2 size={16} />} actions={<Button>Add</Button>}>
 *     …page body…
 *   </ExtPage>
 *
 * The ext supplies title / workspace / icon / actions only; the SDK picks the header shape from `ctx`.
 */
export function ExtPage({ title, workspace, icon, description, actions, children, fallbackStyle = "slim", }) {
    const { style, line } = useHeaderChoice(fallbackStyle);
    return (_jsxs("section", { style: { display: "flex", flexDirection: "column", height: "100%", minWidth: 0, color: "hsl(var(--foreground))", background: "hsl(var(--background))" }, children: [_jsx(ExtHeader, { style: style, line: line, title: title, workspace: workspace, icon: icon, description: description, actions: actions }), _jsx("div", { style: { display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }, children: children })] }));
}
/** The header itself — the SAME three shapes the host renders (`slim` / `band` / `breadcrumbs`), so an ext
 *  page is visually indistinguishable from a host page at any setting. Exported for the rare host/tooling
 *  that needs the bare header; `<ExtPage>` is the normal entry. */
export function ExtHeader({ style, line, title, workspace, icon, description, actions }) {
    if (style === "band")
        return _jsx(BandHeader, { title: title, workspace: workspace, icon: icon, description: description, actions: actions });
    if (style === "breadcrumbs")
        return _jsx(BreadcrumbsHeader, { line: line, title: title, workspace: workspace, icon: icon, actions: actions });
    return _jsx(SlimHeader, { line: line, title: title, workspace: workspace, actions: actions });
}
/** Shared trailing cluster: the actions the ext passed. (No Settings gear — routing to host settings is
 *  the HOST chrome's job, outside the ext mount; an ext must not fabricate a host route.) */
function Actions({ actions }) {
    return _jsx("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }, children: actions });
}
/** The workspace / title trail, mirroring the host breadcrumb trail as plain text (the workspace is a
 *  label here, not a link — an ext does not own the host address bar). */
function Trail({ workspace, title }) {
    return (_jsxs("nav", { "aria-label": "Breadcrumb", style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 }, children: [workspace ? (_jsxs(_Fragment, { children: [_jsx("span", { style: { color: "hsl(var(--muted-foreground))" }, children: workspace }), _jsx("span", { "aria-hidden": true, style: { color: "hsl(var(--muted-foreground))" }, children: "/" })] })) : null, _jsx("span", { style: { fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(var(--foreground))" }, children: title })] }));
}
/** `slim` — the shadcn-admin compact bar (the host default). One flat h-14 bar: the trail, then actions.
 *  No icon chip, no wash, no subtitle. There is no sidebar trigger here — the sidebar is host chrome that
 *  lives OUTSIDE the ext mount, so an ext header has nothing to toggle. */
function SlimHeader({ line, title, workspace, actions }) {
    return (_jsxs("header", { style: { display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 8, padding: "0 12px", ...LINE_BORDER[line] }, children: [_jsx(Trail, { workspace: workspace, title: title }), _jsx(Actions, { actions: actions })] }));
}
/** `breadcrumbs` — the minimal trail with a small muted glyph anchor (parity with the host breadcrumbs
 *  header): just the trail + actions, no chip or wash. */
function BreadcrumbsHeader({ line, title, workspace, icon, actions }) {
    return (_jsxs("header", { style: { display: "flex", height: 56, flexShrink: 0, alignItems: "center", gap: 12, padding: "0 16px", ...LINE_BORDER[line] }, children: [icon ? _jsx("span", { "aria-hidden": true, style: { display: "inline-flex", flexShrink: 0, color: "hsl(var(--muted-foreground))" }, children: icon }) : null, _jsx(Trail, { workspace: workspace, title: title }), _jsx(Actions, { actions: actions })] }));
}
/** `band` — the tall icon-chip header: an accent-tinted chip + title/subtitle, the accent wash and the
 *  two-hue signature hairline. Mirrors the host band shape (`min-h-[3.75rem]`). */
function BandHeader({ title, workspace, icon, description, actions }) {
    return (_jsxs("header", { style: { position: "relative", display: "flex", minHeight: "3.75rem", alignItems: "center", gap: 12, padding: "10px 16px", background: "hsl(var(--card) / 0.6)" }, children: [_jsx("div", { "aria-hidden": true, style: { position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(90deg, hsl(var(--accent) / 0.09), hsl(var(--accent-2) / 0.04) 32%, transparent 60%)" } }), _jsx("div", { "aria-hidden": true, style: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1, pointerEvents: "none", background: "linear-gradient(90deg, hsl(var(--accent) / 0.6), hsl(var(--accent-2) / 0.4) 34%, hsl(var(--border)) 72%)" } }), icon ? (_jsx("div", { style: { position: "relative", display: "flex", height: 36, width: 36, flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "calc(var(--radius) - 2px)", border: "1px solid hsl(var(--accent) / 0.25)", color: "hsl(var(--accent))", background: "linear-gradient(135deg, hsl(var(--accent) / 0.16), hsl(var(--accent-2) / 0.10))" }, children: icon })) : null, _jsxs("div", { style: { position: "relative", minWidth: 0 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }, children: [workspace ? _jsxs("span", { style: { color: "hsl(var(--muted-foreground))", fontSize: 12 }, children: [workspace, " /"] }) : null, _jsx("span", { style: { fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(var(--foreground))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, children: title })] }), description ? _jsx("p", { style: { margin: 0, fontSize: 12, color: "hsl(var(--muted-foreground))" }, children: description }) : null] }), _jsx(Actions, { actions: actions })] }));
}
//# sourceMappingURL=ext-page.js.map