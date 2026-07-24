// @nube/ext-ui-sdk — the authoritative UI contract for Lazybones extensions.
//
// The host shell (lb) and every extension import these types from here. This package is the SINGLE
// SOURCE the old per-extension `app/contract.ts` copies and the host-side type collapse into.

export type {
  PageCtx,
  PageBridge,
  PageHandle,
  RemoteMount,
  HeaderStyle,
  HeaderLine,
  SidebarToggle,
  ExtNavItem,
  ExtNavChild,
} from "./page.js";

// The `bridge.setNav` caps live in ONE place — the SDK clamps the child tree (count/depth/label) before it
// reaches host chrome (ext-nav-contribution scope). Exported so a host bridge can reuse the exact same clamp.
export { clampNavChildren, NAV_MAX_ITEMS, NAV_MAX_DEPTH, NAV_MAX_LABEL } from "./nav.js";

// `<ExtPage>` / `<ExtHeader>` — the SDK-owned page shell whose header INHERITS the host's Header chrome
// (Settings → Theme → Layout: Header style, Header line, Sidebar button), including a working sidebar
// toggle and clickable drill breadcrumbs — so extension pages match host pages with no per-ext work and
// no drift (the extension analogue of the host's `<AppPage>`). Reads every axis + the host toggle
// callback from `ctx`; an ext never picks a header itself. See `ext-page.tsx`.
export { ExtPage, ExtHeader } from "./ext-page.js";
export type { ExtPageProps, Crumb } from "./ext-page.js";
export type {
  WidgetField,
  WidgetFrame,
  WidgetTheme,
  WidgetCtx,
  WidgetBridge,
  WidgetHandle,
  RemoteWidgetMount,
} from "./widget.js";
export { WIDGET_CONTRACT_VERSION } from "./widget.js";
export { defineExtConfig, REACT_EXTERNALS } from "./vite.js";
export type { ExtConfigOptions } from "./vite.js";

// Theme & CSS isolation — the SDK OWNS this so every extension is non-leaky for free. `mountScoped`
// wraps the ext in a scoped root and attaches its stylesheet there (never `document.head`);
// `extTailwindPreset` drops Preflight and scopes utilities under that root. See the SDK README
// "Theme & CSS" section. Extensions never define the theme and never write to `document.head`.
export { mountScoped } from "./mount.js";
export type { ScopedRender, MountScopedOptions } from "./mount.js";
export { extTailwindPreset, EXT_ROOT_ATTR } from "./tailwind.js";

// `defineRemote` — the SDK-owned federation entry factory. An ext's `remoteEntry.ts` is generated
// boilerplate that calls this; the scoped mount + React root + widget dispatch live here, so no ext
// hand-writes the mount plumbing. It composes `mountScoped` (CSS isolation) with a React root.
export { defineRemote } from "./remote.js";
export type { RemoteDef, Remote, PageRender, WidgetRender } from "./remote.js";

// `hostLink` — build a stable deep link from an extension page INTO a host surface (generated-product-ux
// scope, Plane 1). An extension seeds a dashboard from its pack and LINKS to the host's own viewer with
// variables preselected, rather than rendering a private board — the link is built here so no ext
// hand-rolls a host URL. Pure URL builder; see `hostLink.ts` for the host route contract.
export { hostLink } from "./hostLink.js";
export type { HostLinkOptions } from "./hostLink.js";

// i18n — the SDK-owned catalog seam (lb release scope, gap d): extensions and shells ship flat
// en/es catalogs, resolve locale via user pref → navigator.language → en, and gate key parity in
// CI with `catalogParity`. Additive; nothing existing changes.
export { resolveLocale, makeTranslator, catalogParity, FALLBACK_LOCALE } from "./i18n.js";
export type { Catalog, Catalogs, Translator } from "./i18n.js";
