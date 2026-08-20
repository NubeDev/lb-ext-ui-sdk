/** What the caller renders into — e.g. `createRoot(mount).render(...)`.
 *
 *  `mount` is a DEDICATED content node inside the scoped root, NOT the scoped root itself:
 *  `createRoot()` clears its container's children on mount, so the ext's `<style>` (a sibling under the
 *  scoped root) must live outside React's container or React would wipe it.
 *
 *  `root` is the scoped root itself (`<div data-ext-root="<id>">`), and it is passed for ONE reason:
 *  **overlay content rendered through a React portal must land inside it.**
 *
 *  Radix (dropdowns, popovers, dialogs, tooltips) portals its content to `document.body` by default, so
 *  it can escape an ancestor's `overflow` clipping. That is correct behaviour and must not be defeated
 *  — but `document.body` is OUTSIDE this root, and `extTailwindPreset()` scopes every compiled utility
 *  under `[data-ext-root]`. Portalled content therefore matches NONE of the ext's CSS: a popover renders
 *  with no width constraint, no background and no padding, as an unstyled full-width overlay covering
 *  the page. Nothing errors; it simply looks broken.
 *
 *  Handing the root back lets the caller portal into it instead — inside the scope, still escaping the
 *  clipping, because the root is `h-full w-full` and imposes no `overflow` of its own.
 *
 *  Returns an optional teardown for the render itself (React root unmount); `mountScoped` composes it
 *  with the scoped-root removal so the caller returns ONE teardown. */
export type ScopedRender = (mount: HTMLElement, root: HTMLElement) => void | (() => void);
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
 * Creates `<div data-ext-root="<id>">` under `el` (sized by INLINE STYLE — see below), attaches
 * `styles` as a
 * `<style>` INSIDE that div (scoped, not head), then calls `render(mount)` with a DEDICATED content
 * child (so React's `createRoot`, which clears its container, can't wipe the `<style>` sibling). The
 * returned teardown runs the render's own teardown (if any) and removes the scoped root — taking the
 * ext's styles with it.
 */
export declare function mountScoped(el: HTMLElement, { id, styles }: MountScopedOptions, render: ScopedRender): () => void;
//# sourceMappingURL=mount.d.ts.map