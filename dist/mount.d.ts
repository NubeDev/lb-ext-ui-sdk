/** What the caller renders into — e.g. `createRoot(mount).render(...)`. The element passed in is a
 *  DEDICATED content node inside the scoped root, NOT the scoped root itself: `createRoot()` clears its
 *  container's children on mount, so the ext's `<style>` (a sibling under the scoped root) must live
 *  outside React's container or React would wipe it. Returns an optional teardown for the render itself
 *  (React root unmount); `mountScoped` composes it with the scoped-root removal so the caller returns
 *  ONE teardown. */
export type ScopedRender = (mount: HTMLElement) => void | (() => void);
/** Options for `mountScoped`. */
export interface MountScopedOptions {
    /** The extension id — stamped as `data-ext-root="<id>"` (opaque; matches the build's scoping). */
    id: string;
    /** The ext's compiled stylesheet (a CSS string, e.g. `import styles from "./styles.css?inline"`).
     *  Attached SCOPED under the ext root — never `document.head`. Omit for a widget with no CSS. */
    styles?: string;
}
/**
 * Mount an extension's UI into `el` with full CSS isolation, and return a single teardown.
 *
 * Creates `<div data-ext-root="<id>" class="h-full w-full">` under `el`, attaches `styles` as a
 * `<style>` INSIDE that div (scoped, not head), then calls `render(mount)` with a DEDICATED content
 * child (so React's `createRoot`, which clears its container, can't wipe the `<style>` sibling). The
 * returned teardown runs the render's own teardown (if any) and removes the scoped root — taking the
 * ext's styles with it.
 */
export declare function mountScoped(el: HTMLElement, { id, styles }: MountScopedOptions, render: ScopedRender): () => void;
//# sourceMappingURL=mount.d.ts.map