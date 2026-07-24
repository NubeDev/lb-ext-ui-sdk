import type { ExtNavChild } from "./page.js";
/** Max total children published across a whole `setNav` call (every node at every depth counts). */
export declare const NAV_MAX_ITEMS = 200;
/** Max nesting depth of published children (the declared parent is depth 0; its children depth 1). */
export declare const NAV_MAX_DEPTH = 3;
/** Max label length before truncation. */
export declare const NAV_MAX_LABEL = 64;
/**
 * Clamp a `setNav` child tree to the caps, returning a fresh normalized tree. Beyond-cap nodes are
 * dropped (count/depth) or their labels sliced (length); a single `console.warn` names what was clamped.
 * Pure — no side effects beyond the warning; safe to call on every publish.
 */
export declare function clampNavChildren(items: ExtNavChild[]): ExtNavChild[];
//# sourceMappingURL=nav.d.ts.map