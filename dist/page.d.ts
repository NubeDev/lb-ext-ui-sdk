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
/** The workspace-scoped context handed to a page mount. `workspace` is the only frozen field; the header
 *  axes are ADDITIVE (a host may omit them; the SDK falls back to the `slim`/`none` defaults). */
export interface PageCtx {
    workspace: string;
    /** The member's Header-style choice, threaded from the host theme. Omitted ⇒ `slim`. */
    headerStyle?: HeaderStyle;
    /** The header divider-line choice, threaded from the host theme. Omitted ⇒ `none`. */
    headerLine?: HeaderLine;
}
/** The leashed bridge: the ONLY way a page reaches the platform — a host-mediated, caps-checked MCP
 *  call. Mirrors the WASM guest's `host.call-tool` and the widget bridge's `call`. */
export interface PageBridge {
    call: <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
}
/** The mount contract every extension page remote must expose. Returns an optional teardown. */
export type RemoteMount = (el: HTMLElement, ctx: PageCtx, bridge: PageBridge) => void | (() => void);
//# sourceMappingURL=page.d.ts.map