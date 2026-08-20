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
//   5. The scoped root is HANDED BACK to the render, so overlay content (Radix portals) can be mounted
//      INSIDE it instead of at `document.body`. See `ScopedRender` for why that is load-bearing rather
//      than a convenience.
//
// An extension author calls `mountScoped` and never touches `document.head`. Because the scoped root
// lives inside the host-provided `el`, the HOST needs no change at all.

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
export function mountScoped(
  el: HTMLElement,
  { id, styles }: MountScopedOptions,
  render: ScopedRender,
): () => void {
  const doc = el.ownerDocument;
  const root = doc.createElement("div");
  root.setAttribute("data-ext-root", id);
  // ⚠ INLINE STYLE, never Tailwind classes — the scoped root cannot style ITSELF from the ext's sheet.
  //
  // This used to be `className = "h-full w-full"`, which silently did nothing. `extTailwindPreset()`
  // scopes every compiled utility under `[data-ext-root]`, so the ext's own `h-full` compiles to
  // `[data-ext-root] .h-full` (or, via a kit sheet, `[data-ext-root] :is(.dash-kit .h-full)`) — a
  // DESCENDANT selector. The scoped root IS the `[data-ext-root]` element, so no such rule can ever
  // match it. The class sat there inert.
  //
  // The consequence was not a cosmetic one: unsized, the root grew to fit its content instead of
  // filling the host's bounded slot. Measured at 3006px inside a 700px slot — and because every
  // descendant's `height:100%`/`flex:1` resolves against that, `<ExtPage>`'s `overflowY:auto` body
  // got a clientHeight EQUAL to its scrollHeight and had nothing to scroll. So the page simply could
  // not be scrolled, and the content past the fold was unreachable, with no error anywhere.
  //
  // Inline style is immune: it needs no stylesheet, no build config, and no cooperation from the
  // ext's scoping. `minHeight: 0` is required alongside the height for the same reason it is on every
  // flex child below — without it a flex item refuses to shrink below its content and re-breaks the
  // exact chain this is fixing.
  root.style.height = "100%";
  root.style.width = "100%";
  root.style.minHeight = "0";

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
  // Inline for the same reason as the root: this node also sits at/above the ext's own CSS scope
  // boundary in the height chain, and a class here would be just as inert.
  mount.style.height = "100%";
  mount.style.width = "100%";
  mount.style.minHeight = "0";
  root.appendChild(mount);

  el.appendChild(root);

  const teardown = render(mount, root);
  return () => {
    try {
      if (typeof teardown === "function") teardown();
    } finally {
      root.remove();
    }
  };
}
