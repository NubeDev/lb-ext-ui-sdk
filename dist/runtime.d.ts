import { type ReactNode } from "react";
import type { PageBridge, PageCtx } from "./page.js";
/** A caps-checked MCP call — the ONLY reach an ext page has to the platform. Mirrors `PageBridge.call`. */
export type McpClient = <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
/** Wrap an ext's React tree so its `useSession`/`useMcpClient` resolve. Fed by `defineRemote` from the
 *  `ctx`/`bridge` the host hands `mount`. Not for extension authors to call directly. */
export declare function RuntimeProvider({ ctx, bridge, children, }: {
    ctx: PageCtx;
    bridge: PageBridge;
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
//# sourceMappingURL=runtime.d.ts.map