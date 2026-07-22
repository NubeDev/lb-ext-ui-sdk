import type { ReactNode } from "react";
import type { HeaderLine, HeaderStyle } from "./page.js";
/** One clickable step in a drill breadcrumb trail. `onClick` jumps to that level; the LAST crumb (the
 *  current page) omits it and renders as plain text — mirrors the host breadcrumb trail. */
export interface Crumb {
    label: string;
    onClick?: () => void;
}
export interface ExtPageProps {
    /** The page title — rendered as the final trail segment when `crumbs` is omitted. Ignored if `crumbs`
     *  is given (the last crumb IS the title). Provide one of `title` or `crumbs`. */
    title?: string;
    /** A clickable drill trail (`Sites › Site › Node`) for hierarchy pages — rendered IN the host-styled
     *  header, so back-navigation looks and behaves like the host. The last crumb is the current page. */
    crumbs?: Crumb[];
    /** Optional workspace segment prepended to the trail (a plain label — an extension does NOT own host
     *  routing, so it is text, never a link). Omit it and the trail starts at the title/first crumb. */
    workspace?: string;
    /** Optional surface glyph (the ext brings its own icon element — the SDK stays icon-library-agnostic).
     *  Rendered as the band's chip / the breadcrumbs anchor; the slim header omits it (parity with host). */
    icon?: ReactNode;
    /** Optional subtitle — shown only by the `band` style (parity with the host band header). */
    description?: string;
    /** Trailing header controls (buttons, filters). Rendered in the actions slot of every style. */
    actions?: ReactNode;
    /** The page body. Fills the remaining height under the header. */
    children: ReactNode;
    /** Escape hatch for a host that mounts without threading `headerStyle` (a bare dev preview). Ignored
     *  when `ctx.headerStyle` is present — the member's choice always wins (inherit-only). Defaults `slim`. */
    fallbackStyle?: HeaderStyle;
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
export declare function ExtPage({ title, crumbs, workspace, icon, description, actions, children, fallbackStyle, }: ExtPageProps): import("react").JSX.Element;
interface ExtHeaderProps {
    style: HeaderStyle;
    line: HeaderLine;
    trail: Crumb[];
    workspace?: string;
    icon?: ReactNode;
    description?: string;
    actions?: ReactNode;
    /** When present, the slim/breadcrumbs header renders the sidebar toggle button that calls it. */
    onToggleSidebar?: () => void;
}
/** The header itself — the SAME three shapes the host renders (`slim` / `band` / `breadcrumbs`), so an ext
 *  page is visually indistinguishable from a host page at any setting. Exported for the rare host/tooling
 *  that needs the bare header; `<ExtPage>` is the normal entry. */
export declare function ExtHeader({ style, line, trail, workspace, icon, description, actions, onToggleSidebar }: ExtHeaderProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ext-page.d.ts.map