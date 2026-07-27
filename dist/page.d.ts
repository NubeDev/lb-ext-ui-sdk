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
    /** The sub-path below `/ext/<id>/` — the extension's OWN nav address (`""` at its root). The extension
     *  renders THIS route; the URL (owned by the host) is the single source of truth, so the ext keeps no
     *  parallel nav state. Re-supplied on EVERY navigation through the live `update(ctx)` handle the mount
     *  returns — never a remount (ext-nav-contribution scope). ADDITIVE + FAIL-SAFE: a host predating nav
     *  contribution omits it ⇒ `""` (the ext shows its root view). Read via `useRoute()`. */
    route?: string;
    /** Ask the HOST to change the address bar to `/ext/<id>/<path>`. The host navigates; the ext re-renders
     *  from the resulting `ctx.route`. ONE direction of truth: the URL. The ext NEVER pushes history itself.
     *  ADDITIVE + FAIL-SAFE: a host predating nav contribution omits it ⇒ a no-op (the ext stays on its
     *  current view). Read via `useNavigate()`. */
    onNavigate?: (path: string) => void;
    /** Which of the extension's nav nodes the host currently renders EXPANDED, as EXT-RELATIVE refs — the
     *  same grammar `route` uses (`"networks"`, `"networks/plant-a"`), never the host's own `ext:<id>/…`
     *  form. This is the host→ext half of lazy nav (ext-nav-lazy-children scope): an extension marks a
     *  published child `hasChildren` without giving its branch, the host renders it collapsed with a
     *  disclosure caret, and when the user opens it that node appears HERE — the extension then fetches
     *  that branch and republishes through `setNav`.
     *
     *  It is deliberately a **state, not an event**, and that is what makes the hard case work. An
     *  extension page can be unmounted while the host still renders its retained tree, so an expand
     *  "event" fired at an unmounted page would simply be lost. A set re-supplied on every `update(ctx)`
     *  — and stamped on the FIRST `ctx` of a fresh mount — means a page that was not running when the
     *  user expanded still learns, on mount, exactly which branches are open and can fill them. Nothing
     *  to queue, nothing to replay, no ordering to get wrong.
     *
     *  Contract notes: the refs are the extension's OWN ids composed by the host, echoed back verbatim —
     *  the host interprets none of them (rule 10). The set may name a node the extension no longer
     *  publishes (its tree shrank); ignore those. It may be non-empty on the very first render, which is
     *  the point. Re-supplied LIVE through `update(ctx)`, never a remount. ADDITIVE + FAIL-SAFE: a host
     *  predating lazy nav omits it ⇒ `[]`, and an extension that publishes eagerly (never setting
     *  `hasChildren`) is unaffected either way. Read via `useNavExpanded()`. */
    navExpanded?: string[];
}
/** A top-level nav destination an extension DECLARES in its manifest `[[ui.nav]]` block — a lens the host
 *  renders in ITS sidebar as a nested child of the extension's group (ext-nav-contribution scope). The host
 *  RELAYS and RENDERS these; it never interprets an `id`. `label` is an i18n KEY in the EXTENSION's own
 *  catalog (the host does not translate it). This mirrors the manifest/`ExtRow` shape verbatim. */
export interface ExtNavItem {
    /** The opaque item id — the `ext:<ext>/<id>` view-key segment. Slug `[a-z0-9-]{1,32}`, unique per block. */
    id: string;
    /** An i18n key in the extension's OWN catalog (resolved ext-side, never host-side). */
    label: string;
    /** A lucide icon name (opaque; the host maps it). Omitted ⇒ the host's default. */
    icon?: string;
    /** Presentation gate ONLY — mirrors the host's admin show/hide. The verbs remain the wall; hiding an
     *  item never blocks its deep link. Omitted ⇒ visible to everyone. */
    admin?: boolean;
    /** Whether this item's children are supplied at RUNTIME via `bridge.setNav`. A `dynamic` item with no
     *  children yet renders as a deliberate (childless) parent, not a broken one. Omitted ⇒ static. */
    dynamic?: boolean;
    /** An OPTIONAL `dashboard:<id>` ref (ext-dashboard-nav scope). Present ⇒ the host renders this item as
     *  a HOST-dashboard link (into the dashboard viewer) instead of routing `ext:<ext>/<id>` into the mount,
     *  reusing the host's own `dashboard`-kind nav grammar. The host bounds it but never resolves the id
     *  (rule 10). Absent ⇒ an ext-route item, exactly today's behavior. */
    dashboard?: string;
    /** An OPTIONAL pinned variable binding the host folds into the viewer URL as `?var-<name>=<value>`
     *  (ext-dashboard-nav scope) — the SAME `Record<string,string>` shape the host `NavItem.vars` uses.
     *  Only meaningful with `dashboard`. Bounded (≤32 keys, key+value ≤128 chars) at parse/clamp. */
    vars?: Record<string, string>;
}
/** A live child an extension PUBLISHES under a `dynamic` nav item via `bridge.setNav` — rendered by the
 *  host in ITS sidebar (ext-nav-contribution scope). Ephemeral + per-mount: never persisted, never shared
 *  between members, gone on unmount. WHATEVER the ext hands `setNav` renders as-is in host chrome, so a
 *  reach-scoped label (e.g. a site name) MUST be derived through the ext's own reach chokepoint — the host
 *  cannot filter for the ext. Clamped by `clampNavChildren` before it reaches the host. */
export interface ExtNavChild {
    /** The opaque child id — appended to the parent's route (`ext:<ext>/<parent>/<id>`). */
    id: string;
    /** The display label, rendered verbatim in host chrome (already reach-scoped by the ext). */
    label: string;
    /** A lucide icon name (opaque). Omitted ⇒ no icon. */
    icon?: string;
    /** Nested grandchildren (depth ≤ 3 total, clamped). Omitted ⇒ a leaf — UNLESS `hasChildren` says
     *  otherwise. */
    children?: ExtNavChild[];
    /** "This node HAS children you have not been given yet" (ext-nav-lazy-children scope). Set it on a
     *  node whose branch is expensive or unbounded — a network whose devices you do not want to publish
     *  until someone looks. The host renders such a node as an expandable parent with a disclosure caret,
     *  **initially collapsed**, and when the user opens it the node's ref appears in `ctx.navExpanded`;
     *  the extension fetches that branch and republishes the whole tree through `setNav`, with `children`
     *  filled in.
     *
     *  Why a separate field rather than an empty `children: []`: an empty array is indistinguishable from
     *  a leaf, and a leaf must keep rendering as a leaf — the whole reported bug was a caret that could
     *  not appear until the children it advertises already existed. This says the branch exists WITHOUT
     *  claiming to know its contents.
     *
     *  Ignored once `children` is non-empty (the real branch always wins over the promise of one), so an
     *  extension can set it unconditionally and let the arrival of children retire it. Copied verbatim by
     *  `clampNavChildren`. ADDITIVE + FAIL-SAFE: a host predating lazy nav ignores the field and simply
     *  renders the node as a leaf until the extension publishes its children — i.e. exactly today's
     *  eager behaviour, which is why an extension may adopt this before every host has upgraded. */
    hasChildren?: boolean;
    /** An OPTIONAL `dashboard:<id>` ref (ext-dashboard-nav scope). Present ⇒ the host renders this child as
     *  a HOST-dashboard link (into the dashboard viewer, var-bound) instead of routing `ext:<ext>/<parent>/
     *  <id>` into the mount — the CRUX case: a per-site `site-overview`, a per-meter `meter-detail`. The host
     *  renders and routes it by kind, branching on this field's presence (never on the ext id — rule 10).
     *  Absent ⇒ an ext-route child, exactly today's behavior. Copied verbatim by `clampNavChildren`. */
    dashboard?: string;
    /** An OPTIONAL pinned variable binding the host folds into the viewer URL as `?var-<name>=<value>`
     *  (ext-dashboard-nav scope) — the SAME `Record<string,string>` shape the host `NavItem.vars` uses.
     *  Only meaningful with `dashboard`. `clampNavChildren` bounds it (≤32 keys, key+value ≤128 chars each,
     *  truncate-with-warning) so a runaway binding can never bloat host chrome. Keep it deterministic (a
     *  single `site`/`meter` key) so the shell's active-highlight reverse-lookup matches a stable tuple. */
    vars?: Record<string, string>;
}
/** The leashed bridge: the ONLY way a page reaches the platform — a host-mediated, caps-checked MCP
 *  call. Mirrors the WASM guest's `host.call-tool` and the widget bridge's `call`. */
export interface PageBridge {
    call: <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
    /** Publish live children for the extension's `dynamic` `[[ui.nav]]` items — the host renders them as
     *  nested entries in ITS sidebar (ext-nav-contribution scope). Ephemeral + per-mount: never persisted,
     *  never shared between members, gone on unmount. The host renders WHATEVER it is handed, so a
     *  reach-scoped label MUST be derived through the extension's own reach chokepoint before it is passed
     *  here (the host cannot filter for the extension). The SDK CLAMPS the tree (`clampNavChildren`: ≤200
     *  items, depth ≤3, label ≤64 chars — over-cap truncates with a console warning, never throws) so a
     *  runaway nav can never break the page. ADDITIVE + FAIL-SAFE — a host predating nav contribution omits
     *  it, and the extension then simply has no dynamic children.
     *
     *  LAZY BRANCHES (ext-nav-lazy-children scope): publishing the whole tree eagerly is what forces an
     *  extension into the `NAV_MAX_ITEMS` corner (publish only the open branch, cap at N, append "… and N
     *  more"). Instead, mark a node `hasChildren` and give it no `children`; when the user opens it, its
     *  ref appears in `ctx.navExpanded` and you call `setNav` AGAIN with that branch filled in. Publishes
     *  remain whole-tree replaces — build the full tree each time from what you have loaded so far. */
    setNav?: (items: ExtNavChild[]) => void;
}
/** What a page `mount` MAY return instead of a bare teardown (parity with `WidgetHandle`): `update(ctx)`
 *  re-supplies a fresh `ctx` (a new `route`, caps, or header axis) and re-renders IN PLACE on the existing
 *  React root — NO remount, so page state, scroll, and in-flight data survive a sidebar click. `teardown()`
 *  disposes on unmount. This is the live re-supply the nav contract stands on: the host threads `ctx.route`
 *  through `update`, never through a remount (ext-nav-contribution scope, the remount trap). */
export interface PageHandle {
    update?: (ctx: PageCtx) => void;
    teardown?: () => void;
}
/** The mount contract every extension page remote must expose. Returns void, a bare teardown (legacy), or
 *  a `{ update, teardown }` handle (the live re-supply path). ADDITIVE: the `void | (() => void)` forms
 *  still hold, so this stays a minor — a host that only knows the teardown form keeps working, and a host
 *  that knows the handle drives `update(ctx)` for in-place route/caps re-supply. */
export type RemoteMount = (el: HTMLElement, ctx: PageCtx, bridge: PageBridge) => void | (() => void) | PageHandle;
//# sourceMappingURL=page.d.ts.map