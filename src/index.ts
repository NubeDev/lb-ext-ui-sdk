// @nube/ext-ui-sdk — the authoritative UI contract for Lazybones extensions.
//
// The host shell (lb) and every extension import these types from here. This package is the SINGLE
// SOURCE the old per-extension `app/contract.ts` copies and the host-side type collapse into.

export type { PageCtx, PageBridge, RemoteMount } from "./page.js";
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
