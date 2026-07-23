// `hostLink` — build a stable deep link from an extension page INTO a host surface (generated-product-ux
// scope, Plane 1, "The link seam"). An extension "generates" a dashboard by seeding it from its pack and
// LINKING to it: rather than rendering a private board, a page hands the operator a link to the host's
// own dashboard viewer with the right variables preselected. This is that link, built in ONE place so no
// extension hand-rolls a host URL (the scope's "never a hand-built URL").
//
// Contract with the host (rubix-ai):
//   - The host is a HASH-history SPA (`createHashHistory`), so a host route lives in the URL fragment.
//     `hostLink` returns a fragment beginning with `#/t/<ws>/…`; a consumer navigates it with
//     `window.location.assign(link)` (or `window.location.hash = link`) — an in-app hash change, no reload.
//   - The canonical dashboard-viewer route is `#/t/<ws>/dashboards/<dashboard>` (a stable path-param link
//     that outlives UI refactors — generated-product-ux O-1). The legacy `?d=<id>` form keeps working; a
//     link minted here uses the canonical route.
//   - Variable selections ride as flat `?var-<name>=<value>` params (the host's Grafana-parity grammar);
//     a multi-value selection repeats the param. A `required` template variable left unset makes the host
//     render its "select a <label>" gate, so a link with the var set is what turns a template into a view.
//
// Pure, no React/DOM — one responsibility, mirrors `i18n.ts`.

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
export function hostLink(opts: HostLinkOptions): string {
  const ws = encodeURIComponent(opts.workspace);
  const dashboard = encodeURIComponent(opts.dashboard);
  const base = `#/t/${ws}/dashboards/${dashboard}`;
  const query = varsToQuery(opts.vars);
  return query ? `${base}?${query}` : base;
}

/** Encode `vars` into the host's flat `var-<name>=<value>` query grammar (repeated for a multi-value),
 *  dropping empty selections. Names and values are `encodeURIComponent`-escaped so an id with a reserved
 *  character can never break out of its param. Returns `""` for no (effective) selection. */
function varsToQuery(vars: HostLinkOptions["vars"]): string {
  if (!vars) return "";
  const parts: string[] = [];
  for (const [name, value] of Object.entries(vars)) {
    const key = `var-${encodeURIComponent(name)}`;
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) {
      if (v === undefined || v === null || v === "") continue;
      parts.push(`${key}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join("&");
}
