// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { act } from "@testing-library/react";

import { defineRemote } from "./remote.js";
import type { PageBridge, PageCtx } from "./page.js";
import type { WidgetBridge, WidgetCtx } from "./widget.js";

const ctx: PageCtx = { workspace: "acme" };
const bridge: PageBridge = { call: async () => ({}) as never };
const wctx: WidgetCtx = { v: 4, workspace: "acme", binding: {}, options: {} };
const wbridge: WidgetBridge = { call: async () => ({}) as never, watch: () => () => {} };

// `defineRemote` mounts via React's `createRoot().render()`, which commits asynchronously — wrap the
// mount in `act()` so the tree is flushed before assertions (the real shell awaits the same commit).
function mountAct(fn: () => void | (() => void)) {
  let teardown: void | (() => void);
  act(() => {
    teardown = fn();
  });
  return teardown;
}

describe("defineRemote — SDK-owned federation entry", () => {
  it("mount renders the page SCOPED (root + stylesheet under el, never head)", () => {
    const { mount } = defineRemote({
      id: "host-metrics",
      styles: ".x{color:red}",
      page: () => <h1>Host Metrics</h1>,
    });
    const el = document.createElement("div");
    const teardown = mountAct(() => mount(el, ctx, bridge));

    const scoped = el.querySelector("[data-ext-root='host-metrics']");
    expect(scoped).not.toBeNull();
    // The page rendered inside the scoped root.
    expect(scoped!.textContent).toContain("Host Metrics");
    // The stylesheet is scoped under the root, NOT in the host head (the leak that shipped before).
    expect(scoped!.querySelector("style[data-ext-styles='host-metrics']")).not.toBeNull();
    expect(document.head.querySelector("style[data-ext-styles]")).toBeNull();

    act(() => (teardown as () => void)());
    expect(el.querySelector("[data-ext-root]")).toBeNull();
  });

  it("mountWidget dispatches by widgetId", () => {
    const { mountWidget } = defineRemote({
      id: "host-metrics",
      widgets: {
        gauge: () => <span>GAUGE</span>,
        other: () => <span>OTHER</span>,
      },
    });
    const el = document.createElement("div");
    mountAct(() => mountWidget(el, wctx, wbridge, "other") as () => void);
    expect(el.textContent).toContain("OTHER");
    expect(el.textContent).not.toContain("GAUGE");
  });

  it("mountWidget falls back to the first widget for an unknown id", () => {
    const { mountWidget } = defineRemote({
      id: "host-metrics",
      widgets: { gauge: () => <span>GAUGE</span> },
    });
    const el = document.createElement("div");
    mountAct(() => mountWidget(el, wctx, wbridge, "does-not-exist") as () => void);
    expect(el.textContent).toContain("GAUGE");
  });

  it("a page-only ext still gives a working mountWidget (renders nothing, no throw)", () => {
    const { mountWidget } = defineRemote({ id: "x", page: () => <div /> });
    const el = document.createElement("div");
    expect(() => mountAct(() => mountWidget(el, wctx, wbridge, "anything") as () => void)).not.toThrow();
  });
});
