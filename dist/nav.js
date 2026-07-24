// `clampNavChildren()` — the ONE place the `bridge.setNav` caps live (ext-nav-contribution scope).
//
// Dynamic nav children are the first case where EXTENSION data (e.g. site names) renders in HOST chrome:
// the host renders whatever it is handed and branches on none of it. So the bounds — count, depth, label
// length — are enforced HERE, in the SDK, before the tree ever reaches the host, giving one vocabulary
// every host shares. A nav is CHROME: over-cap TRUNCATES with a single console warning; it NEVER throws
// and breaks the page. (Reach is NOT enforced here — that is the extension's own chokepoint's job; this
// only bounds size. See `ExtNavChild`.)
/** Max total children published across a whole `setNav` call (every node at every depth counts). */
export const NAV_MAX_ITEMS = 200;
/** Max nesting depth of published children (the declared parent is depth 0; its children depth 1). */
export const NAV_MAX_DEPTH = 3;
/** Max label length before truncation. */
export const NAV_MAX_LABEL = 64;
/**
 * Clamp a `setNav` child tree to the caps, returning a fresh normalized tree. Beyond-cap nodes are
 * dropped (count/depth) or their labels sliced (length); a single `console.warn` names what was clamped.
 * Pure — no side effects beyond the warning; safe to call on every publish.
 */
export function clampNavChildren(items) {
    let count = 0;
    let overCount = false;
    let overDepth = false;
    let overLabel = false;
    const walk = (nodes, depth) => {
        if (!nodes || nodes.length === 0)
            return [];
        if (depth > NAV_MAX_DEPTH) {
            overDepth = true;
            return [];
        }
        const out = [];
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
            const child = { id: n.id, label };
            if (n.icon)
                child.icon = n.icon;
            const kids = walk(n.children, depth + 1);
            if (kids.length > 0)
                child.children = kids;
            out.push(child);
        }
        return out;
    };
    const clamped = walk(items, 1);
    if (overCount || overDepth || overLabel) {
        const reasons = [
            overCount && `>${NAV_MAX_ITEMS} items`,
            overDepth && `depth >${NAV_MAX_DEPTH}`,
            overLabel && `label >${NAV_MAX_LABEL} chars`,
        ]
            .filter(Boolean)
            .join(", ");
        // eslint-disable-next-line no-console -- a nav cap breach is a dev-time contract warning, not a throw.
        console.warn(`[ext-ui-sdk] setNav truncated (${reasons})`);
    }
    return clamped;
}
//# sourceMappingURL=nav.js.map