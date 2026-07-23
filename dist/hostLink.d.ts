/** The inputs to {@link hostLink}. `workspace` comes from the page `ctx.workspace` (the frozen ctx field);
 *  `dashboard` is the platform dashboard id (e.g. a pack-seeded template); `vars` preselects dashboard
 *  variables by their bare name (the `$name` reference), each a single value or a multi-value list. */
export interface HostLinkOptions {
    /** The target workspace — pass the page `ctx.workspace`. */
    workspace: string;
    /** The platform dashboard id to open (the `dashboard.save` record id / pack `dashboards[].id`). */
    dashboard: string;
    /** Variable selections keyed by BARE variable name (no `var-` prefix) — e.g. `{ meter: "mtr-hq-main" }`.
     *  A `string[]` value emits a repeated `var-<name>` param (the host's multi-value form). Empty values
     *  and empty arrays are dropped. Omit for a link with no preselection. */
    vars?: Record<string, string | string[]>;
}
/** Build a stable host-dashboard deep link (a hash fragment). See the file header for the host contract.
 *  Example: `hostLink({ workspace: "acme", dashboard: "ems-meter-detail", vars: { meter: "mtr-hq-main" } })`
 *  → `"#/t/acme/dashboards/ems-meter-detail?var-meter=mtr-hq-main"`. */
export declare function hostLink(opts: HostLinkOptions): string;
//# sourceMappingURL=hostLink.d.ts.map