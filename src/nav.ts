// `clampNavChildren()` — the ONE place the `bridge.setNav` caps live (ext-nav-contribution scope).
//
// Dynamic nav children are the first case where EXTENSION data (e.g. site names) renders in HOST chrome:
// the host renders whatever it is handed and branches on none of it. So the bounds — count, depth, label
// length — are enforced HERE, in the SDK, before the tree ever reaches the host, giving one vocabulary
// every host shares. A nav is CHROME: over-cap TRUNCATES with a single console warning; it NEVER throws
// and breaks the page. (Reach is NOT enforced here — that is the extension's own chokepoint's job; this
// only bounds size. See `ExtNavChild`.)

import type { ExtNavChild } from "./page.js";

/** Max total children published across a whole `setNav` call (every node at every depth counts). */
export const NAV_MAX_ITEMS = 200;
/** Max nesting depth of published children (the declared parent is depth 0; its children depth 1). */
export const NAV_MAX_DEPTH = 3;
/** Max label length before truncation. */
export const NAV_MAX_LABEL = 64;
/** Max `vars` keys on a dashboard-carrying child before the over-cap keys are dropped (ext-dashboard-nav
 *  scope). Mirrors the manifest `NAV_MAX_VARS` so the static + dynamic paths bound `vars` identically. */
export const NAV_MAX_VARS = 32;
/** Max length of a `vars` key OR value before it is dropped (ext-dashboard-nav scope). */
export const NAV_MAX_VAR_KV = 128;

/**
 * Clamp a `setNav` child tree to the caps, returning a fresh normalized tree. Beyond-cap nodes are
 * dropped (count/depth) or their labels sliced (length); a single `console.warn` names what was clamped.
 * Pure — no side effects beyond the warning; safe to call on every publish.
 */
export function clampNavChildren(items: ExtNavChild[]): ExtNavChild[] {
  let count = 0;
  let overCount = false;
  let overDepth = false;
  let overLabel = false;
  let overVars = false;

  // Bound a child's `vars` binding (ext-dashboard-nav scope): ≤NAV_MAX_VARS keys, each key + value
  // ≤NAV_MAX_VAR_KV chars. Over-cap keys are DROPPED (never truncated to a wrong value — a half-sliced
  // site id would bind the wrong entity) with a warning, matching the label posture: a nav never throws.
  const clampVars = (vars: Record<string, string> | undefined): Record<string, string> | undefined => {
    if (!vars) return undefined;
    const out: Record<string, string> = {};
    let kept = 0;
    for (const [k, v] of Object.entries(vars)) {
      if (kept >= NAV_MAX_VARS) {
        overVars = true;
        break;
      }
      if (typeof k !== "string" || typeof v !== "string" || !k || k.length > NAV_MAX_VAR_KV || v.length > NAV_MAX_VAR_KV) {
        overVars = true;
        continue;
      }
      out[k] = v;
      kept++;
    }
    return kept > 0 ? out : undefined;
  };

  const walk = (nodes: ExtNavChild[] | undefined, depth: number): ExtNavChild[] => {
    if (!nodes || nodes.length === 0) return [];
    if (depth > NAV_MAX_DEPTH) {
      overDepth = true;
      return [];
    }
    const out: ExtNavChild[] = [];
    for (const n of nodes) {
      if (count >= NAV_MAX_ITEMS) {
        overCount = true;
        break;
      }
      count++;
      let label = typeof n.label === "string" ? n.label : "";
      if (label.length > NAV_MAX_LABEL) {
        label = label.slice(0, NAV_MAX_LABEL);
        overLabel = true;
      }
      const child: ExtNavChild = { id: n.id, label };
      if (n.icon) child.icon = n.icon;
      // A dashboard-carrying child opens the HOST viewer instead of the mount (ext-dashboard-nav scope) —
      // copy the ref + bounded vars verbatim so they survive the clamp; a child smuggling extra fields is
      // still stripped to the known set (the whitelist copy below is the reach/payload guard).
      if (typeof n.dashboard === "string" && n.dashboard) child.dashboard = n.dashboard;
      const vars = clampVars(n.vars);
      if (vars) child.vars = vars;
      const kids = walk(n.children, depth + 1);
      if (kids.length > 0) child.children = kids;
      out.push(child);
    }
    return out;
  };

  const clamped = walk(items, 1);

  if (overCount || overDepth || overLabel || overVars) {
    const reasons = [
      overCount && `>${NAV_MAX_ITEMS} items`,
      overDepth && `depth >${NAV_MAX_DEPTH}`,
      overLabel && `label >${NAV_MAX_LABEL} chars`,
      overVars && `vars >${NAV_MAX_VARS} keys or key/value >${NAV_MAX_VAR_KV} chars`,
    ]
      .filter(Boolean)
      .join(", ");
    // eslint-disable-next-line no-console -- a nav cap breach is a dev-time contract warning, not a throw.
    console.warn(`[ext-ui-sdk] setNav truncated (${reasons})`);
  }

  return clamped;
}
