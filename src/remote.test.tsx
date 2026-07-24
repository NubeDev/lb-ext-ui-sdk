// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { useEffect, useRef } from "react";
import { act } from "@testing-library/react";

import { defineRemote } from "./remote.js";
import type { PageBridge, PageCtx, PageHandle } from "./page.js";
import { useRoute } from "./runtime.js";
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
    const handle = mountAct(() => mount(el, ctx, bridge)) as PageHandle;

    const scoped = el.querySelector("[data-ext-root='host-metrics']");
    expect(scoped).not.toBeNull();
    // The page rendered inside the scoped root.
    expect(scoped!.textContent).toContain("Host Metrics");
    // The stylesheet is scoped under the root, NOT in the host head (the leak that shipped before).
    expect(scoped!.querySelector("style[data-ext-styles='host-metrics']")).not.toBeNull();
    expect(document.head.querySelector("style[data-ext-styles]")).toBeNull();

    act(() => handle.teardown!());
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

  it("mount returns a { update, teardown } page handle", () => {
    const { mount } = defineRemote({ id: "x", page: () => <div /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, ctx, bridge)) as PageHandle;
    expect(typeof handle.update).toBe("function");
    expect(typeof handle.teardown).toBe("function");
    act(() => handle.teardown!());
  });

  // THE PHASE 0 GATE: N route changes must NOT remount the page. A component that counts its OWN mounts
  // (an empty-dep effect) proves it — `update(ctx)` re-renders in place, so the mount counter stays 1
  // across many route changes while the rendered route tracks each new ctx. If `update` remounted (the
  // trap this whole scope exists to avoid), the counter would climb with every navigation.
  it("update(ctx) re-supplies route WITHOUT remounting (mount runs once across N navigations)", () => {
    let mountCount = 0;
    function Page() {
      const route = useRoute();
      // Empty deps → this fires exactly once per real mount. A remount bumps it; a re-render does not.
      useEffect(() => {
        mountCount += 1;
      }, []);
      return <div data-testid="route">{route || "root"}</div>;
    }

    const { mount } = defineRemote({ id: "ems", page: () => <Page /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, { workspace: "acme", route: "" }, bridge)) as PageHandle;

    const routeText = () => el.querySelector("[data-testid='route']")?.textContent;
    expect(routeText()).toBe("root");
    // Capture the settled mount count (StrictMode may double-invoke the initial mount effect — that is
    // fine; the gate is that navigation adds NO further mounts, so we assert against this baseline).
    const baseline = mountCount;

    for (const r of ["explore", "sites", "sites/site-1", "studio"]) {
      act(() => handle.update!({ workspace: "acme", route: r }));
      expect(routeText()).toBe(r);
      // The decisive assertion: no navigation ever remounts the page — the counter never moves.
      expect(mountCount).toBe(baseline);
    }

    act(() => handle.teardown!());
    expect(el.querySelector("[data-ext-root]")).toBeNull();
  });

  it("preserves in-place component state across update(ctx) (no state loss on nav)", () => {
    // A ref persists only while the component instance lives. If `update` remounted, the ref would reset.
    function Page() {
      const renders = useRef(0);
      renders.current += 1;
      const route = useRoute();
      return <div data-testid="renders">{`${renders.current}:${route}`}</div>;
    }
    const { mount } = defineRemote({ id: "ems", page: () => <Page /> });
    const el = document.createElement("div");
    const handle = mountAct(() => mount(el, { workspace: "acme", route: "a" }, bridge)) as PageHandle;
    act(() => handle.update!({ workspace: "acme", route: "b" }));
    // Same instance kept counting (>=2 renders, ending on route "b") — a remount would have reset to "1:b".
    const [renders, route] = (el.querySelector("[data-testid='renders']")?.textContent ?? "").split(":");
    expect(route).toBe("b");
    expect(Number(renders)).toBeGreaterThanOrEqual(2);
    act(() => handle.teardown!());
  });
});
