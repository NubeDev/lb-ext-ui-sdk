/** What the caller renders into the scoped root — e.g. `createRoot(root).render(...)`. Returns an
 *  optional teardown for the render itself (React root unmount); `mountScoped` composes it with the
 *  scoped-root removal so the caller returns ONE teardown. */
export type ScopedRender = (root: HTMLElement) => void | (() => void);
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
 * `<style>` INSIDE that div (scoped, not head), then calls `render(root)`. The returned teardown runs
 * the render's own teardown (if any) and removes the scoped root — taking the ext's styles with it.
 */
export declare function mountScoped(el: HTMLElement, { id, styles }: MountScopedOptions, render: ScopedRender): () => void;
//# sourceMappingURL=mount.d.ts.map