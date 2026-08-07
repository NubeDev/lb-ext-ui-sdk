import type { ExtNavChild, ExtNavPublish } from "./page.js";
/** Max total children published across a whole `setNav` call (every node at every depth counts). */
export declare const NAV_MAX_ITEMS = 200;
/** Max nesting depth of published children (the declared parent is depth 0; its children depth 1). */
export declare const NAV_MAX_DEPTH = 3;
/** Max label length before truncation. */
export declare const NAV_MAX_LABEL = 64;
/** Max `vars` keys on a dashboard-carrying child before the over-cap keys are dropped (ext-dashboard-nav
 *  scope). Mirrors the manifest `NAV_MAX_VARS` so the static + dynamic paths bound `vars` identically. */
export declare const NAV_MAX_VARS = 32;
/** Max length of a `vars` key OR value before it is dropped (ext-dashboard-nav scope). */
export declare const NAV_MAX_VAR_KV = 128;
/**
 * Clamp a `setNav` child tree to the caps, returning a fresh normalized tree. Beyond-cap nodes are
 * dropped (count/depth) or their labels sliced (length); a single `console.warn` names what was clamped.
 * Pure — no side effects beyond the warning; safe to call on every publish.
 */
export declare function clampNavChildren(items: ExtNavChild[]): ExtNavChild[];
/**
 * Clamp an OWNER-KEYED publish (one subtree per declared `[[ui.nav]]` item). The caps are the
 * extension's, not the owner's: every node under every owner counts against the SAME
 * `NAV_MAX_ITEMS` budget, because they all land in one sidebar. Owners are walked in insertion
 * order, so an extension decides what gets the budget by the order it builds the map — put the list
 * that must not silently vanish first.
 */
export declare function clampNavPublish(groups: ExtNavPublish): ExtNavPublish;
//# sourceMappingURL=nav.d.ts.map