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
