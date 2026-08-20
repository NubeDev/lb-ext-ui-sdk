export type { PageCtx, PageBridge, PageHandle, RemoteMount, HeaderStyle, HeaderLine, SidebarToggle, ExtNavItem, ExtNavChild, ExtNavPublish, } from "./page.js";
export { clampNavChildren, clampNavPublish, NAV_MAX_ITEMS, NAV_MAX_DEPTH, NAV_MAX_LABEL, NAV_MAX_VARS, NAV_MAX_VAR_KV, } from "./nav.js";
export { ExtPage, ExtHeader } from "./ext-page.js";
export type { ExtPageProps, Crumb } from "./ext-page.js";
export type { WidgetField, WidgetFrame, WidgetTheme, WidgetCtx, WidgetTarget, WidgetBridge, WidgetHandle, RemoteWidgetMount, } from "./widget.js";
export { WIDGET_CONTRACT_VERSION } from "./widget.js";
export { defineExtConfig, REACT_EXTERNALS } from "./vite.js";
export type { ExtConfigOptions } from "./vite.js";
export { mountScoped } from "./mount.js";
export type { ScopedRender, MountScopedOptions } from "./mount.js";
export { extTailwindPreset, EXT_ROOT_ATTR } from "./tailwind.js";
export { defineRemote } from "./remote.js";
export type { RemoteDef, Remote, PageRender, WidgetRender } from "./remote.js";
export { usePortalContainer } from "./runtime.js";
export { hostLink } from "./hostLink.js";
export type { HostLinkOptions } from "./hostLink.js";
export { resolveLocale, makeTranslator, catalogParity, FALLBACK_LOCALE } from "./i18n.js";
export type { Catalog, Catalogs, Translator } from "./i18n.js";
//# sourceMappingURL=index.d.ts.map