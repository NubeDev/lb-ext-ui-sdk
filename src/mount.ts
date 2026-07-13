// `mountScoped()` — the SDK-owned scoped mount + style helper. Every extension mounts through THIS so
// its CSS can never leak into or override the host.
//
// The host hands an extension `mount(el, ctx, bridge)` a live `el` INSIDE the host document. The old
// pattern hand-injected the ext's compiled Tailwind CSS into `document.head` (`<style>?inline`), which
// leaked three ways: Tailwind Preflight reset the host's `*, body, h1–h6, button, a…`; a top-level
// `:root{}` / `.dark{}` block REDEFINED the host's design tokens globally; and unscoped utilities
// collided with the host's. All three are GLOBAL because the stylesheet was global.
//
// The fix is structural, not per-author:
//   1. The ext's content is wrapped in a scoped root `<div data-ext-root="<id>">` INSIDE the host `el`.
//   2. The ext's stylesheet is attached to THAT SUBTREE — a `<style>` appended under the scoped root,
//      never `document.head`. Removing the root removes the styles; nothing survives in the host.
//   3. The build (see `extTailwindPreset`) emits NO Preflight and scopes every utility under
//      `[data-ext-root]`, so even the appended CSS has zero global rules.
//   4. The ext ships NO `:root{}` / `.dark{}` tokens; the scoped root sits in the host DOM and INHERITS
//      the host's `--bg`/`--accent`/… via the CSS cascade (a JS/canvas widget reads `ctx.theme` instead).
//
// An extension author calls `mountScoped` and never touches `document.head`. Because the scoped root
// lives inside the host-provided `el`, the HOST needs no change at all.

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
export function mountScoped(
  el: HTMLElement,
  { id, styles }: MountScopedOptions,
  render: ScopedRender,
): () => void {
  const doc = el.ownerDocument;
  const root = doc.createElement("div");
  root.setAttribute("data-ext-root", id);
  root.className = "h-full w-full";

  // Scoped stylesheet: the ext's compiled CSS lives UNDER the root, never in the host head. When the
  // root is removed on teardown, the stylesheet goes with it. A style element inside the body still
  // applies to its subtree, and (with the no-Preflight, `[data-ext-root]`-scoped build) its rules only
  // match inside this root — so it cannot touch the host.
  if (styles) {
    const style = doc.createElement("style");
    style.setAttribute("data-ext-styles", id);
    style.textContent = styles;
    root.appendChild(style);
  }

  // A dedicated content node for the render. `createRoot(mount).render(...)` reconciles `mount` and
  // clears its children on mount — if we handed it `root`, it would remove the `<style>` sibling above.
  // Rendering into a separate child keeps the stylesheet intact for the ext's whole lifetime.
  const mount = doc.createElement("div");
  mount.className = "h-full w-full";
  root.appendChild(mount);

  el.appendChild(root);

  const teardown = render(mount);
  return () => {
    try {
      if (typeof teardown === "function") teardown();
    } finally {
      root.remove();
    }
  };
}
