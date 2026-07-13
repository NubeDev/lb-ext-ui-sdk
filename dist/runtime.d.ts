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
 *  `{ workspace }` — extra fields (role, locale, sub) are populated by the host session it was mounted
 *  with. Returns `null` only if the host mounted without a session. */
export declare function useSession<T = PageCtx>(): T | null;
/** The leashed MCP client for the mounted ext — a host-mediated, caps-checked tool call. */
export declare function useMcpClient(): McpClient;
//# sourceMappingURL=runtime.d.ts.map