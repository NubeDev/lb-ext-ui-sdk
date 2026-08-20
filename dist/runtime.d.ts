import { type ReactNode } from "react";
import type { PageBridge, PageCtx } from "./page.js";
/** A caps-checked MCP call — the ONLY reach an ext page has to the platform. Mirrors `PageBridge.call`. */
export type McpClient = <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
/** Wrap an ext's React tree so its `useSession`/`useMcpClient` resolve. Fed by `defineRemote` from the
 *  `ctx`/`bridge` the host hands `mount`. Not for extension authors to call directly. */
export declare function RuntimeProvider({ ctx, bridge, portalContainer, children, }: {
    ctx: PageCtx;
    bridge: PageBridge;
    /** The scoped root, from `mountScoped`. Threaded so `usePortalContainer()` can hand it to Radix. */
    portalContainer?: HTMLElement | null;
    children: ReactNode;
}): import("react").JSX.Element;
/** The workspace-scoped session for the mounted ext. Typed by the caller; the host guarantees at least
 *  `{ workspace }` — extra fields (`caps`, `isAdmin`, locale, sub) are populated by the host session it
 *  was mounted with. For an admin show/hide gate use `useIsAdmin()`/`useCaps()`, NOT any `role` string
 *  (deprecated — lb mints every session `role: "member"`; authority lives in the caps). Returns `null`
 *  only if the host mounted without a session. */
export declare function useSession<T = PageCtx>(): T | null;
/** The leashed MCP client for the mounted ext — a host-mediated, caps-checked tool call. */
export declare function useMcpClient(): McpClient;
/** The caller's workspace-scoped capabilities, as the host projected them onto the mount `ctx` (from the
 *  session `ExtHost` verified at login). The signal an ext page gates a per-cap affordance on, read
 *  SYNCHRONOUSLY on first render — no probe, no round-trip, no flicker. FAIL-CLOSED: an old host that
 *  omits `ctx.caps` yields `[]`, so a cap-gated control hides rather than showing to everyone. A
 *  read-only projection of grants the caller already holds — it grants nothing; the bridge re-checks
 *  every call server-side. */
export declare function useCaps(): string[];
/** Whether the caller is an admin — the host's OWN `isAdmin(caps)` verdict, stamped on the `ctx` at
 *  mount (one definition of "admin", shared host↔ext, never recomputed on the far side). The coarse
 *  show/hide gate for admin affordances (Studio, Access, New-site, …). FAIL-CLOSED: an old host that
 *  omits `ctx.isAdmin` yields `false` (an admin sees too little, never a member too much). Show/hide
 *  ONLY — the verbs remain the wall; a mis-shown control still fails server-side. */
export declare function useIsAdmin(): boolean;
/** The extension's current nav route — the sub-path below `/ext/<id>/` (`""` at the root), owned by the
 *  HOST URL and re-supplied live through `update(ctx)` on every navigation (ext-nav-contribution scope).
 *  This is the SINGLE source of truth for which destination the ext shows; the ext keeps no parallel nav
 *  state. FAIL-SAFE: a host predating nav contribution omits `ctx.route` ⇒ `""` (the root view). */
export declare function useRoute(): string;
/** Ask the HOST to navigate to `path` (the sub-path below `/ext/<id>/`). The host changes the address bar;
 *  the ext re-renders from the resulting `ctx.route` (one direction of truth — the URL). Returns a stable
 *  no-op when the host predates nav contribution (`ctx.onNavigate` absent), so an ext can always call it. */
export declare function useNavigate(): (path: string) => void;
/** Which of this extension's nav nodes the host currently renders EXPANDED, as ext-relative refs
 *  (`"networks"`, `"networks/plant-a"` — the same grammar `useRoute()` speaks). The host→ext half of
 *  lazy nav: publish a node with `hasChildren` and no `children`, and when the user opens it its ref
 *  shows up here — fetch that branch and republish through `setNav`.
 *
 *  A STATE, not an event, deliberately: an ext page can be unmounted while the host still renders its
 *  retained tree, so an expand event fired at a dead page would simply be lost. Because this is a set
 *  re-supplied on every `update(ctx)` AND stamped on the first `ctx` of a fresh mount, a page that was
 *  not running when the user expanded still learns which branches are open the moment it mounts.
 *
 *  FAIL-SAFE: a host predating lazy nav omits `ctx.navExpanded` ⇒ `[]`, so an ext that loads lazily
 *  simply publishes nothing extra (and one that publishes eagerly never calls this at all). Returns a
 *  SHARED empty array in that case, so the identity is stable across renders and it is safe to use
 *  directly as a `useEffect`/`useMemo` dep. */
export declare function useNavExpanded(): string[];
/**
 * The DOM node overlay content must portal into — the ext's scoped root.
 *
 * Pass it to any component that renders through a React portal:
 *
 *     <DropdownMenu.Portal container={usePortalContainer()}>
 *
 * WHY THIS IS NOT OPTIONAL. Radix portals overlay content to `document.body` by default so it can
 * escape an ancestor's `overflow` clipping — correct, and not something to defeat. But every utility
 * an ext compiles is scoped under `[data-ext-root]` (see `extTailwindPreset`), and `document.body` is
 * outside that root. Portalled content therefore matches NONE of the ext's CSS and renders as an
 * unstyled, full-width, transparent overlay across the page. There is no error — it just looks broken.
 *
 * Portalling into the scoped root keeps the content inside the CSS scope while still escaping the
 * clipping, because the root is `h-full w-full` and sets no `overflow` of its own.
 *
 * Returns `null` outside a mounted remote (a story, a bare test render) — which is exactly what Radix
 * treats as "use the default container", so a component wired this way works in both places. It does
 * NOT throw, unlike the other hooks here: an overlay that renders unstyled in a story is a far better
 * failure than one that crashes the page.
 */
export declare function usePortalContainer(): HTMLElement | null;
//# sourceMappingURL=runtime.d.ts.map