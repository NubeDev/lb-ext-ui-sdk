/** The member's Header-style choice (host Settings → Theme → Layout). The SDK's `<ExtPage>` reads it
 *  from `ctx` and renders the matching header shape, so an extension page inherits the SAME header the
 *  member picked for host pages — never picking a style itself (inherit-only; no per-ext drift). Mirrors
 *  the host `theme.layout.header` axis. Absent (host predating this field, or a bare dev preview) ⇒ the
 *  `slim` default. Additive: an ext that ignores it is unaffected. */
export type HeaderStyle = "slim" | "band" | "breadcrumbs";
/** The header divider-line choice (host `theme.layout.headerLine`) — which hairline the slim/breadcrumbs
 *  header draws. `none` (default) floats the bar; `bottom`/`top`/`both` fence it. Consumed by `<ExtPage>`
 *  the same way the host slim/breadcrumbs headers consume it. Absent ⇒ `none`. */
export type HeaderLine = "none" | "bottom" | "top" | "both";
/** The sidebar minimise/expand button choice (host `theme.layout.sidebarToggle`) — whether the slim
 *  header shows the sidebar toggle. `shown` (default) renders it; `hidden` omits it. Consumed by
 *  `<ExtPage>` exactly as the host slim header consumes it. The button only appears when the host ALSO
 *  provides `onToggleSidebar` (there is no sidebar to toggle in a bare preview). Absent ⇒ `shown`. */
export type SidebarToggle = "shown" | "hidden";
/** The workspace-scoped context handed to a page mount. `workspace` is the only frozen field; the header
 *  axes are ADDITIVE (a host may omit them; the SDK falls back to the `slim`/`none`/`shown` defaults).
 *
 *  Why these live on `ctx` and not on host React context: an extension mounts its OWN React root (the
 *  SDK's scoped mount), so host context does NOT cross the boundary. `ctx` is the one seam that does —
 *  so every theme axis the ext header must honour, AND the host sidebar-toggle callback, are threaded
 *  here. This is what makes the shared header react to Settings → Theme → Layout for extensions too. */
export interface PageCtx {
    workspace: string;
    /** The member's Header-style choice, threaded from the host theme. Omitted ⇒ `slim`. */
    headerStyle?: HeaderStyle;
    /** The header divider-line choice, threaded from the host theme. Omitted ⇒ `none`. */
    headerLine?: HeaderLine;
    /** The member's sidebar-toggle choice, threaded from the host theme. Omitted ⇒ `shown`. */
    sidebarToggle?: SidebarToggle;
    /** Toggle the HOST sidebar (minimise/expand). The extension's header button can't reach the host's
     *  React `SidebarProvider` across the mount boundary, so the host passes its `toggleSidebar` down here
     *  and the SDK header calls it. Omitted (bare preview, or a host with no sidebar) ⇒ the toggle button
     *  is not rendered — there is nothing to toggle. */
    onToggleSidebar?: () => void;
    /** The caller's workspace-scoped capabilities, projected by the host at mount from the verified
     *  session (rubix-ai `ExtHost` stamps `session.caps`). Read via the SDK's `useCaps()` — an extension
     *  page gates a per-cap affordance from this signal directly, with NO backend probe or round-trip. A
     *  read-only view of grants the caller ALREADY holds: it grants nothing, and the leashed bridge
     *  re-checks every call server-side (the verbs are the wall). ADDITIVE + FAIL-CLOSED — an old host
     *  omits it; `useCaps()` then returns `[]`, so an ext hides the affordance rather than showing it to
     *  everyone. Stamped at mount; a mid-session caps change reflects on the next mount (the `update(ctx)`
     *  live re-supply is the same deferred follow-up as the header-theme axes). Omitted ⇒ `[]`. */
    caps?: string[];
    /** Whether the caller is an admin — the host's OWN `isAdmin(caps)` verdict (rubix-ai
     *  `lib/session/admin-caps.ts`: any of `ADMIN_SECTION_CAPS` present), stamped at mount so "admin"
     *  means ONE thing across host and ext and is NEVER re-derived on the ext side. Read via the SDK's
     *  `useIsAdmin()`. Show/hide ONLY — a mis-shown control still fails at the verb. ADDITIVE +
     *  FAIL-CLOSED — an old host omits it; `useIsAdmin()` then returns `false` (an admin sees too little,
     *  never a member too much). Omitted ⇒ `false`. */
    isAdmin?: boolean;
    /** @deprecated NOT an authorization signal. lb mints EVERY session `role: "member"` and carries real
     *  authority in the CAP set — the role string cannot tell a real admin from a scoped member (backend
     *  `caller.rs`). Gate on `isAdmin`/`caps` (via `useIsAdmin()`/`useCaps()`) instead. Retained only so
     *  existing type-referencers don't break; scheduled for removal in the next MAJOR. */
    role?: string;
}
/** The leashed bridge: the ONLY way a page reaches the platform — a host-mediated, caps-checked MCP
 *  call. Mirrors the WASM guest's `host.call-tool` and the widget bridge's `call`. */
export interface PageBridge {
    call: <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
}
/** The mount contract every extension page remote must expose. Returns an optional teardown. */
export type RemoteMount = (el: HTMLElement, ctx: PageCtx, bridge: PageBridge) => void | (() => void);
//# sourceMappingURL=page.d.ts.map