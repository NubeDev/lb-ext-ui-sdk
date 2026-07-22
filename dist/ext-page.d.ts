import type { ReactNode } from "react";
import type { HeaderLine, HeaderStyle } from "./page.js";
export interface ExtPageProps {
    /** The page title — rendered in the header trail / band. */
    title: string;
    /** Optional workspace segment (a plain label — an extension does NOT own host routing, so it is text,
     *  never a link). Omit it and the trail is just the title. */
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
 * The extension page shell. Wrap a surface in it and its header inherits the host's Header-style setting:
 *
 *   <ExtPage title="Sites" icon={<Building2 size={16} />} actions={<Button>Add</Button>}>
 *     …page body…
 *   </ExtPage>
 *
 * The ext supplies title / workspace / icon / actions only; the SDK picks the header shape from `ctx`.
 */
export declare function ExtPage({ title, workspace, icon, description, actions, children, fallbackStyle, }: ExtPageProps): import("react").JSX.Element;
interface ExtHeaderProps {
    style: HeaderStyle;
    line: HeaderLine;
    title: string;
    workspace?: string;
    icon?: ReactNode;
    description?: string;
    actions?: ReactNode;
}
/** The header itself — the SAME three shapes the host renders (`slim` / `band` / `breadcrumbs`), so an ext
 *  page is visually indistinguishable from a host page at any setting. Exported for the rare host/tooling
 *  that needs the bare header; `<ExtPage>` is the normal entry. */
export declare function ExtHeader({ style, line, title, workspace, icon, description, actions }: ExtHeaderProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ext-page.d.ts.map