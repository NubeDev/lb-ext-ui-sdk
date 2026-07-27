// `@nube/ext-ui-sdk/runtime` — the in-page runtime seam. An extension's page/widget tree reaches the
// platform ONLY through host-provided context: the workspace-scoped session and the leashed, caps-checked
// MCP client (`bridge.call`). `defineRemote` wraps every ext tree in `<RuntimeProvider>` (populated from
// the `ctx`/`bridge` the host shell passes to `mount`/`mountWidget`), so these hooks Just Work inside an
// ext with zero wiring. Calling them outside a mounted remote throws — a programming error, not a runtime
// condition.

import { createContext, useContext, type ReactNode } from "react";
import type { PageBridge, PageCtx } from "./page.js";

/** A caps-checked MCP call — the ONLY reach an ext page has to the platform. Mirrors `PageBridge.call`. */
export type McpClient = <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;

interface Runtime {
  ctx: PageCtx;
  call: McpClient;
}

const RuntimeCtx = createContext<Runtime | null>(null);

/** Wrap an ext's React tree so its `useSession`/`useMcpClient` resolve. Fed by `defineRemote` from the
 *  `ctx`/`bridge` the host hands `mount`. Not for extension authors to call directly. */
export function RuntimeProvider({
  ctx,
  bridge,
  children,
}: {
  ctx: PageCtx;
  bridge: PageBridge;
  children: ReactNode;
}) {
  return <RuntimeCtx.Provider value={{ ctx, call: bridge.call }}>{children}</RuntimeCtx.Provider>;
}

function useRuntime(hook: string): Runtime {
  const rt = useContext(RuntimeCtx);
  if (!rt) throw new Error(`${hook} called outside a mounted extension remote`);
  return rt;
}

/** The workspace-scoped session for the mounted ext. Typed by the caller; the host guarantees at least
 *  `{ workspace }` — extra fields (`caps`, `isAdmin`, locale, sub) are populated by the host session it
 *  was mounted with. For an admin show/hide gate use `useIsAdmin()`/`useCaps()`, NOT any `role` string
 *  (deprecated — lb mints every session `role: "member"`; authority lives in the caps). Returns `null`
 *  only if the host mounted without a session. */
export function useSession<T = PageCtx>(): T | null {
  const { ctx } = useRuntime("useSession");
  return (ctx as unknown as T) ?? null;
}

/** The leashed MCP client for the mounted ext — a host-mediated, caps-checked tool call. */
export function useMcpClient(): McpClient {
  return useRuntime("useMcpClient").call;
}

/** The caller's workspace-scoped capabilities, as the host projected them onto the mount `ctx` (from the
 *  session `ExtHost` verified at login). The signal an ext page gates a per-cap affordance on, read
 *  SYNCHRONOUSLY on first render — no probe, no round-trip, no flicker. FAIL-CLOSED: an old host that
 *  omits `ctx.caps` yields `[]`, so a cap-gated control hides rather than showing to everyone. A
 *  read-only projection of grants the caller already holds — it grants nothing; the bridge re-checks
 *  every call server-side. */
export function useCaps(): string[] {
  return useRuntime("useCaps").ctx.caps ?? [];
}

/** Whether the caller is an admin — the host's OWN `isAdmin(caps)` verdict, stamped on the `ctx` at
 *  mount (one definition of "admin", shared host↔ext, never recomputed on the far side). The coarse
 *  show/hide gate for admin affordances (Studio, Access, New-site, …). FAIL-CLOSED: an old host that
 *  omits `ctx.isAdmin` yields `false` (an admin sees too little, never a member too much). Show/hide
 *  ONLY — the verbs remain the wall; a mis-shown control still fails server-side. */
export function useIsAdmin(): boolean {
  return useRuntime("useIsAdmin").ctx.isAdmin ?? false;
}

/** The extension's current nav route — the sub-path below `/ext/<id>/` (`""` at the root), owned by the
 *  HOST URL and re-supplied live through `update(ctx)` on every navigation (ext-nav-contribution scope).
 *  This is the SINGLE source of truth for which destination the ext shows; the ext keeps no parallel nav
 *  state. FAIL-SAFE: a host predating nav contribution omits `ctx.route` ⇒ `""` (the root view). */
export function useRoute(): string {
  return useRuntime("useRoute").ctx.route ?? "";
}

/** Ask the HOST to navigate to `path` (the sub-path below `/ext/<id>/`). The host changes the address bar;
 *  the ext re-renders from the resulting `ctx.route` (one direction of truth — the URL). Returns a stable
 *  no-op when the host predates nav contribution (`ctx.onNavigate` absent), so an ext can always call it. */
export function useNavigate(): (path: string) => void {
  return useRuntime("useNavigate").ctx.onNavigate ?? noop;
}

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
export function useNavExpanded(): string[] {
  return useRuntime("useNavExpanded").ctx.navExpanded ?? EMPTY;
}

/** A shared stable empty array so `useNavExpanded()` has a referentially stable fallback on an old host
 *  (a fresh `[]` each render would re-fire every effect that deps on it). */
const EMPTY: string[] = [];

/** A shared stable no-op so `useNavigate()` returns a referentially stable fn on an old host (no re-renders
 *  from a fresh closure identity each call). */
function noop(): void {}
