// The PAGE mount contract — the seam every extension's federated page exposes from its `remoteEntry.js`.
//
// This is the authoritative definition (ui-federation scope). The host shell (`lb`) imports these
// types from THIS package; an extension's page implements `RemoteMount`. Frozen: changing the call
// signature is a breaking (major) release of this package.

/** The workspace-scoped context handed to a page mount. */
export interface PageCtx {
  workspace: string;
}

/** The leashed bridge: the ONLY way a page reaches the platform — a host-mediated, caps-checked MCP
 *  call. Mirrors the WASM guest's `host.call-tool` and the widget bridge's `call`. */
export interface PageBridge {
  call: <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
}

/** The mount contract every extension page remote must expose. Returns an optional teardown. */
export type RemoteMount = (
  el: HTMLElement,
  ctx: PageCtx,
  bridge: PageBridge,
) => void | (() => void);
