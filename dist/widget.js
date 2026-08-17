// The WIDGET mount contract — v4 (frames-in + theme). The authoritative definition.
//
// This package is the SINGLE SOURCE the old "three mirrors" collapse into: the host-side type, the
// per-extension `app/contract.ts` copies, and the devkit template all now import from here. It is
// strictly ADDITIVE and version-gated on `ctx.v`:
//   - v2 tile: reads `binding`/`options`/`vars`/`timeRange`, returns a bare teardown fn (or void).
//   - v3 data tile: reads `ctx.data` frames, returns `{ update, teardown }` for live/vars/range ticks.
//   - v4 tile: ALSO reads `ctx.theme` and recolors on an `update` fired by a theme change.
// A v2/v3 tile under a v4 host is byte-identical: extra ctx fields are ignored; gate on `ctx.v`.
/** The current widget contract version this package defines. */
export const WIDGET_CONTRACT_VERSION = 5;
//# sourceMappingURL=widget.js.map