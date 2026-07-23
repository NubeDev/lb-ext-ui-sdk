/** One resolved field in a frame — the `lb-viz` `Frame.fields[]` shape. */
export interface WidgetField {
    name: string;
    type?: string;
    values: unknown[];
}
/** A resolved data frame handed to a v3 data tile via `ctx.data`. */
export interface WidgetFrame {
    refId?: string;
    name?: string;
    fields: WidgetField[];
    length?: number;
}
/** The resolved theme tokens handed to a JS/canvas widget as `ctx.theme` (v4) — concrete strings, no
 *  `var()`. A widget that can't read a CSS var (ECharts, three.js) recolors from these on every theme
 *  change via `update(ctx)`. Additive; a widget reads what it needs and ignores the rest. */
export interface WidgetTheme {
    bg: string;
    panel: string;
    fg: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    border: string;
    panel2: string;
    overlay: string;
    accent2: string;
    radius: string;
    fontSans: string;
    fontMono: string;
    surface: string;
    motion: string;
    /** The categorical chart ramp (matches core charts). */
    chart: string[];
}
/** The v4 widget mount ctx. v2 fields remain; v3 adds `data` + `fieldConfig`; v4 adds `theme`. */
export interface WidgetCtx {
    /** Contract version. `4` = frames-in + theme; a tile gates on `v >= 3` (data) / `v >= 4` (theme). */
    v: number;
    workspace: string;
    binding: Record<string, unknown>;
    options: Record<string, unknown>;
    vars?: Record<string, unknown>;
    builtins?: Record<string, unknown>;
    timeRange?: {
        from: number;
        to: number;
    };
    /** v3 (data tiles only): the shell-resolved frames for the cell's `sources[]`. The tile RENDERS
     *  these — it never fetches. */
    data?: WidgetFrame[];
    /** v3 (data tiles only): the cell's Field-tab `fieldConfig` (units/decimals/thresholds/legend/…). */
    fieldConfig?: unknown;
    /** v4: the resolved theme tokens (concrete strings) — for JS/canvas widgets. DOM widgets re-theme via
     *  the CSS cascade and can ignore this. Re-supplied on every theme change through `update(ctx)`. */
    theme?: WidgetTheme;
    /** The caller's workspace-scoped capabilities, projected by the host at mount (parity with the page
     *  `PageCtx.caps` — the SAME host `session.caps`). A widget gates a per-cap affordance directly from
     *  this. A read-only view of grants the caller already holds; the bridge re-checks every call. ADDITIVE
     *  + FAIL-CLOSED — a host predating this omits it (treat absent as `[]`). Omitted ⇒ hide the control. */
    caps?: string[];
    /** Whether the caller is an admin — the host's OWN `isAdmin(caps)` verdict (parity with
     *  `PageCtx.isAdmin`, the SAME definition), stamped at mount. Show/hide ONLY. ADDITIVE + FAIL-CLOSED —
     *  a host predating this omits it; treat absent as `false` (an admin sees too little, never a member
     *  too much). Omitted ⇒ hide admin affordances. */
    isAdmin?: boolean;
}
/** The widget bridge — the leashed `call`/`watch` seam (a data tile needs neither; it renders `ctx.data`). */
export interface WidgetBridge {
    call: <T = unknown>(tool: string, args?: Record<string, unknown>) => Promise<T>;
    watch: (tool: string, args: Record<string, unknown>, onEvent: (e: unknown) => void) => () => void;
}
/** A v3 tile MAY return this instead of a bare teardown: `update(ctx)` re-renders in place on a
 *  data/vars/range tick (no re-mount), `teardown()` disposes on unmount. */
export interface WidgetHandle {
    update?: (ctx: WidgetCtx) => void;
    teardown?: () => void;
}
/** The widget mount contract — like the page `mount`, plus the `widgetId` selecting which `[[widget]]`
 *  tile to render. Returns void, a bare teardown (v2), or a `{ update, teardown }` handle (v3+). */
export type RemoteWidgetMount = (el: HTMLElement, ctx: WidgetCtx, bridge: WidgetBridge, widgetId: string) => void | (() => void) | WidgetHandle;
/** The current widget contract version this package defines. */
export declare const WIDGET_CONTRACT_VERSION: 4;
//# sourceMappingURL=widget.d.ts.map