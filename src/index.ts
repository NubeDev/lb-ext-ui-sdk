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
